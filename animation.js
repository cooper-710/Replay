
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js';

let activeBall = null;
let trailDots = [];
let animationFrame;
let startTime;
let animating = false;

function clearTrail(scene) {
  trailDots.forEach(dot => scene.remove(dot));
  trailDots = [];
}

function createBall(scene) {
  const geometry = new THREE.SphereGeometry(0.15, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const ball = new THREE.Mesh(geometry, material);
  scene.add(ball);
  return ball;
}

function setTrailVisibility(visible) {
  trailDots.forEach(dot => dot.visible = visible);
}

function pauseAnimation() {
  animating = false;
  cancelAnimationFrame(animationFrame);
}

function clearAllBalls(scene) {
  if (activeBall) {
    scene.remove(activeBall);
    activeBall = null;
  }
  clearTrail(scene);
  pauseAnimation();
}

function replayAnimation(pitchData, sceneObjects) {
  clearAllBalls(sceneObjects.scene);
  loadAndAnimatePitch(pitchData, sceneObjects);
}

function loadAndAnimatePitch(pitchData, sceneObjects) {
  const {
    release_pos_x, release_pos_y, release_pos_z,
    vx0, vy0, vz0, ax, ay, az,
    release_spin_rate, spin_axis, time_to_plate
  } = pitchData;

  const scene = sceneObjects.scene;
  activeBall = createBall(scene);
  activeBall.position.set(release_pos_x, release_pos_z, release_pos_y);

  const spinRadiansPerFrame = (release_spin_rate / 60) * (2 * Math.PI / 60);
  const axis = new THREE.Vector3(Math.cos((spin_axis - 90) * Math.PI / 180), 0, Math.sin((spin_axis - 90) * Math.PI / 180));

  startTime = performance.now() / 1000;
  animating = true;

  function animate() {
    if (!animating) return;

    const t = (performance.now() / 1000) - startTime;

    if (t >= time_to_plate) {
      animating = false;
      return;
    }

    const x = release_pos_x + vx0 * t + 0.5 * ax * t * t;
    const y = release_pos_y + vy0 * t + 0.5 * ay * t * t;
    const z = release_pos_z + vz0 * t + 0.5 * az * t * t;

    activeBall.position.set(x, z, y);
    activeBall.rotateOnWorldAxis(axis, spinRadiansPerFrame);

    const trailDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    trailDot.position.copy(activeBall.position);
    scene.add(trailDot);
    trailDots.push(trailDot);

    animationFrame = requestAnimationFrame(animate);
  }

  animate();
}

export {
  loadAndAnimatePitch,
  replayAnimation,
  pauseAnimation,
  setTrailVisibility,
  clearAllBalls
};
