
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.148.0/examples/jsm/controls/OrbitControls.js';

// === SCENE SETUP ===
const scene = new THREE.Scene();
scene.background = new THREE.Color('#cce0ff');

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// === LIGHTING ===
const ambient = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(10, 10, 5);
dirLight.castShadow = true;
scene.add(dirLight);

// === GROUND ===
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: '#4caf50' })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// === STRIKE ZONE ===
const strikeZone = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.5, 2.0, 0.01)),
  new THREE.LineBasicMaterial({ color: 0x000000 })
);
strikeZone.position.set(0, 2.5, -60.5);
scene.add(strikeZone);

// === GLOBALS ===
let balls = [];
let currentPitchIndex = 0;
let pitchData = [];
let isPaused = false;
let clock = new THREE.Clock();
let activeBall = null;

// === MATERIAL FUNCTION ===
function createHalfColorMaterial(pitchType) {
  const colorMap = {
    FF: '#FF0000', SL: '#0000FF', CH: '#00AA00',
    CU: '#8B00FF', SI: '#FFA500', FC: '#00CED1',
    KC: '#4B0082'
  };
  const hex = colorMap[pitchType] || '#888888';
  const pitchColor = new THREE.Color(hex);

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: false
  });

  const texCanvas = document.createElement('canvas');
  texCanvas.width = 2;
  texCanvas.height = 1;
  const ctx = texCanvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = pitchColor.getStyle();
  ctx.fillRect(1, 0, 1, 1);
  const texture = new THREE.CanvasTexture(texCanvas);
  mat.map = texture;
  mat.map.needsUpdate = true;

  return mat;
}

// === SPIN AXIS FUNCTION ===
function getSpinAxisVector(degrees) {
  const radians = THREE.MathUtils.degToRad(degrees);
  return new THREE.Vector3(Math.cos(radians), 0, Math.sin(radians)).normalize();
}

// === ADD BALL ===
function addBall(pitch) {
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.145, 32, 32),
    createHalfColorMaterial(pitch.pitch_type)
  );
  ball.castShadow = true;

  const t0 = clock.getElapsedTime();
  ball.userData = {
    release: {
      x: -pitch.release_pos_x,
      y: pitch.release_pos_y,
      z: pitch.release_pos_z
    },
    velocity: {
      x: -pitch.vx0,
      y: pitch.vz0,
      z: pitch.vy0
    },
    accel: {
      x: -pitch.ax,
      y: pitch.az,
      z: pitch.ay
    },
    spinRate: pitch.release_spin_rate || 0,
    spinAxis: getSpinAxisVector(pitch.spin_axis || 0),
    t0: t0,
    spinAngle: 0
  };

  ball.position.set(
    ball.userData.release.x,
    ball.userData.release.y,
    ball.userData.release.z
  );

  balls.push(ball);
  scene.add(ball);
  activeBall = ball;
}

// === LOAD PITCH DATA ===
fetch('pitch_data.json')
  .then(res => res.json())
  .then(data => {
    pitchData = data;
    populateDropdowns();
  });

function populateDropdowns() {
  const teamDropdown = document.getElementById('teamSelect');
  const batterDropdown = document.getElementById('batterSelect');
  const gameDateDropdown = document.getElementById('gameDateSelect');
  const pitcherDropdown = document.getElementById('pitcherSelect');
  const pitchDropdown = document.getElementById('pitchSelect');
  const cameraDropdown = document.getElementById('cameraAngleSelect');

  // Fill with unique values
  const teams = [...new Set(pitchData.map(p => p.batter_team))];
  const batters = [...new Set(pitchData.map(p => p.batter))];
  const dates = [...new Set(pitchData.map(p => p.game_date))];
  const pitchers = [...new Set(pitchData.map(p => p.pitcher))];
  const pitches = pitchData.map((p, i) => `Pitch ${i + 1}`);

  for (const t of teams) teamDropdown.innerHTML += `<option>${t}</option>`;
  for (const b of batters) batterDropdown.innerHTML += `<option>${b}</option>`;
  for (const d of dates) gameDateDropdown.innerHTML += `<option>${d}</option>`;
  for (const p of pitchers) pitcherDropdown.innerHTML += `<option>${p}</option>`;
  for (const p of pitches) pitchDropdown.innerHTML += `<option>${p}</option>`;

  cameraDropdown.innerHTML = `
    <option>Catcher</option>
    <option>Pitcher</option>
    <option>RHH</option>
    <option>LHH</option>
    <option>1B</option>
    <option>3B</option>
  `;
}

// === UI HANDLERS ===
document.getElementById('replayBtn').addEventListener('click', () => {
  if (balls.length > 0) {
    scene.remove(balls[0]);
    balls = [];
  }

  const pitchIndex = document.getElementById('pitchSelect').selectedIndex;
  const pitch = pitchData[pitchIndex];
  if (pitch) addBall(pitch);
  clock.start();
  isPaused = false;
});

document.getElementById('pauseBtn').addEventListener('click', () => {
  isPaused = !isPaused;
});

function updateBall(ball, t) {
  const { t0, velocity, accel, spinRate, spinAxis } = ball.userData;
  const dt = t - t0;

  ball.position.x = ball.userData.release.x + velocity.x * dt + 0.5 * accel.x * dt * dt;
  ball.position.y = ball.userData.release.y + velocity.y * dt + 0.5 * accel.y * dt * dt;
  ball.position.z = ball.userData.release.z + velocity.z * dt + 0.5 * accel.z * dt * dt;

  const spinRadiansPerSec = (spinRate * 2 * Math.PI) / 60;
  const spinAngle = spinRadiansPerSec * dt;
  ball.rotateOnWorldAxis(spinAxis, spinAngle - ball.userData.spinAngle);
  ball.userData.spinAngle = spinAngle;
}

// === ANIMATION LOOP ===
function animate() {
  requestAnimationFrame(animate);
  if (!isPaused && activeBall) {
    updateBall(activeBall, clock.getElapsedTime());
  }
  renderer.render(scene, camera);
}
animate();
