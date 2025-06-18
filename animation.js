import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js';

let currentBall, animationId;
let trailDots = [];
let showTrail = false;
let isPaused = false;

export function loadAndAnimatePitch(pitchData, sceneObjects) {
  const { scene, camera, renderer } = sceneObjects;

  if (currentBall) {
    scene.remove(currentBall);
    currentBall.geometry.dispose();
    currentBall.material.dispose();
    currentBall = null;
  }
  trailDots.forEach(dot => scene.remove(dot));
  trailDots = [];

  const ballGeometry = new THREE.SphereGeometry(0.15, 32, 32);
  const [r, g, b] = hexToRgb(pitchData.color || '#ff0000');
  const ballMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(r, g, b) });
  const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

  const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
  const whiteHalf = new THREE.Mesh(ballGeometry, whiteMaterial);
  whiteHalf.position.x = 0.075;

  const ballGroup = new THREE.Group();
  ballGroup.add(ballMesh);
  ballGroup.add(whiteHalf);
  scene.add(ballGroup);
  currentBall = ballGroup;

  const startX = pitchData.release_pos_x;
  const startY = 0; // depth axis
  const startZ = pitchData.release_pos_z;

  ballGroup.position.set(startX, startY, startZ);

  const { vx0, vy0, vz0, ax, ay, az } = pitchData;
  const spinRate = pitchData.release_spin_rate || 0;
  const spinAxis = pitchData.spin_axis || 0;

  const spinRad = (spinRate / 60) * 2 * Math.PI;
  const spinAxisVec = new THREE.Vector3(
    Math.sin(THREE.MathUtils.degToRad(spinAxis)),
    0,
    Math.cos(THREE.MathUtils.degToRad(spinAxis))
  );

  const tMax = 0.45;
  const startTime = performance.now();
  let t = 0;

  function animate() {
    if (isPaused) return;

    const now = performance.now();
    const elapsed = (now - startTime) / 1000;
    if (elapsed > tMax) {
      cancelAnimationFrame(animationId);
      setTimeout(() => scene.remove(ballGroup), 9500);
      return;
    }

    const x = startX + vx0 * elapsed + 0.5 * ax * elapsed ** 2;
    const y = startY + vy0 * elapsed + 0.5 * ay * elapsed ** 2;
    const z = startZ + vz0 * elapsed + 0.5 * az * elapsed ** 2;
    ballGroup.position.set(x, y, z);

    const angle = spinRad * elapsed;
    ballGroup.setRotationFromAxisAngle(spinAxisVec, angle);

    if (showTrail && t % 2 === 0) {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 6, 6),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(r, g, b) })
      );
      dot.position.copy(ballGroup.position);
      scene.add(dot);
      trailDots.push(dot);
      setTimeout(() => scene.remove(dot), 9500);
    }

    t++;
    animationId = requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  animate();
}

export function setTrailVisibility(value) {
  showTrail = value;
}

export function pauseAnimation() {
  isPaused = true;
}

export function replayAnimation(pitchData, sceneObjects) {
  isPaused = false;
  loadAndAnimatePitch(pitchData, sceneObjects);
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.replace('#', ''), 16);
  return [
    (bigint >> 16 & 255) / 255,
    (bigint >> 8 & 255) / 255,
    (bigint & 255) / 255
  ];
}
