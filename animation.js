// animation.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js';

let currentBall, animationId, trailDots = [], startTime;
let showTrail = false;
let isPaused = false;

export function loadAndAnimatePitch(pitchData, sceneObjects) {
  const { scene, camera, renderer } = sceneObjects;

  // Clear previous ball and trail
  if (currentBall) {
    scene.remove(currentBall);
    currentBall.geometry.dispose();
    currentBall.material.dispose();
    currentBall = null;
  }
  trailDots.forEach(dot => scene.remove(dot));
  trailDots = [];

  // === Ball Setup ===
  const ballGeometry = new THREE.SphereGeometry(0.15, 32, 32);
  const color = pitchData.color || '#ff0000';
  const [r, g, b] = hexToRgb(color);
  const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(r, g, b) });
  currentBall = new THREE.Mesh(ballGeometry, material);

  // Half-white appearance (spin visible)
  const halfWhite = new THREE.Mesh(ballGeometry, new THREE.MeshStandardMaterial({ color: 0xffffff }));
  const ballGroup = new THREE.Group();
  ballGroup.add(currentBall);
  halfWhite.position.x = 0.075;
  ballGroup.add(halfWhite);
  ballGroup.position.set(pitchData.release_pos_x, pitchData.release_pos_z, 0);
  scene.add(ballGroup);

  // === Physics Constants ===
  const { vx0, vy0, vz0, ax, ay, az } = pitchData;
  const tMax = 0.45; // fixed time to plate
  const dt = 0.016;
  let t = 0;

  // === Spin Setup ===
  const spinRate = pitchData.release_spin_rate || 0;
  const spinAxis = pitchData.spin_axis || 0;
  const spinSpeed = (spinRate / 60) * 2 * Math.PI; // rad/sec
  const spinAxisVec = new THREE.Vector3(
    Math.sin(THREE.MathUtils.degToRad(spinAxis)),
    0,
    Math.cos(THREE.MathUtils.degToRad(spinAxis))
  );

  startTime = performance.now();

  function animate() {
    if (isPaused) return;

    animationId = requestAnimationFrame(animate);
    const elapsed = (performance.now() - startTime) / 1000;
    if (elapsed > tMax) {
      cancelAnimationFrame(animationId);
      setTimeout(() => scene.remove(ballGroup), 9500);
      return;
    }

    // Position update
    const x = pitchData.release_pos_x + vx0 * elapsed + 0.5 * ax * elapsed ** 2;
    const y = pitchData.release_pos_y + vy0 * elapsed + 0.5 * ay * elapsed ** 2;
    const z = 0 + vz0 * elapsed + 0.5 * az * elapsed ** 2;
    ballGroup.position.set(x, y, z);

    // Spin update
    const angle = spinSpeed * elapsed;
    ballGroup.setRotationFromAxisAngle(spinAxisVec, angle);

    // Trail dot
    if (showTrail && t % 3 === 0) {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(r, g, b) })
      );
      dot.position.copy(ballGroup.position);
      scene.add(dot);
      trailDots.push(dot);
      setTimeout(() => {
        scene.remove(dot);
      }, 9500);
    }

    t++;
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
  return [(bigint >> 16) / 255, ((bigint >> 8) & 255) / 255, (bigint & 255) / 255];
}
