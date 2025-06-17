
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js';

// === CORE SETUP ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 2.5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// === LIGHTING ===
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 10, 10);
scene.add(light);

// === STRIKE ZONE ===
const strikeZone = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 3.5, 0.05),
  new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true })
);
strikeZone.position.set(0, 2.5, -60.5);
scene.add(strikeZone);

// === STATE ===
let pitchData = [];
let balls = [];
const clock = new THREE.Clock();

function getSpinAxisVector(degrees) {
  const radians = THREE.MathUtils.degToRad(degrees);
  return new THREE.Vector3(Math.cos(radians), 0, Math.sin(radians)).normalize();
}

function createHalfColorMaterial(pitchType) {
  const colorMap = {
    'FF': '#FF0000',
    'SL': '#0000FF',
    'CH': '#00FF00',
    'CU': '#8A2BE2',
    'SI': '#FFA500'
  };
  const hex = colorMap[pitchType] || '#888888';

  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = hex;
  ctx.fillRect(1, 0, 1, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return new THREE.MeshStandardMaterial({ map: texture });
}

function addBall(pitch) {
  const ballGeo = new THREE.SphereGeometry(0.145, 32, 32);
  const mat = createHalfColorMaterial(pitch.pitch_type);
  const ball = new THREE.Mesh(ballGeo, mat);
  ball.castShadow = true;

  const t0 = clock.getElapsedTime();
  const spinAxis = getSpinAxisVector(pitch.spin_axis || 0);

  ball.userData = {
    release: { x: -pitch.release_pos_x, y: pitch.release_pos_y, z: pitch.release_pos_z },
    velocity: { x: -pitch.vx0, y: pitch.vz0, z: pitch.vy0 },
    accel: { x: -pitch.ax, y: pitch.az, z: pitch.ay },
    spinRate: pitch.release_spin_rate || 0,
    spinAxis: spinAxis,
    t0: t0
  };

  ball.position.set(ball.userData.release.x, ball.userData.release.y, ball.userData.release.z);
  balls.push(ball);
  scene.add(ball);
}

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  for (const ball of balls) {
    const dt = t - ball.userData.t0;
    const { velocity, accel, release, spinRate, spinAxis } = ball.userData;

    ball.position.set(
      release.x + velocity.x * dt + 0.5 * accel.x * dt * dt,
      release.y + velocity.y * dt + 0.5 * accel.y * dt * dt,
      release.z + velocity.z * dt + 0.5 * accel.z * dt * dt
    );

    const angle = (spinRate / 60) * 2 * Math.PI * dt;
    ball.setRotationFromAxisAngle(spinAxis, angle);
  }

  renderer.render(scene, camera);
}

function setupReplayButton() {
  const btn = document.getElementById("replayBtn");
  if (btn && pitchData.length > 0) {
    btn.addEventListener("click", () => {
      // Clear scene except strike zone
      scene.clear();
      balls = [];
      scene.add(strikeZone);
      clock.start();
      addBall(pitchData[0]);  // Load first pitch
    });
  }
}

fetch("pitch_data.json")
  .then(res => res.json())
  .then(data => {
    pitchData = data;
    setupReplayButton();
  });

animate();
