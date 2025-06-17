
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.148.0/examples/jsm/controls/OrbitControls.js';

// everything else remains the same (copied from the last confirmed rebuild)
 from 'https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.148.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, clock;
let balls = [];
let pitchData = {};
let currentTeam = null;
let currentPitcher = null;

const spinBalls = true;
const trailDots = [];

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 10);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7.5);
  scene.add(light);

  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshPhongMaterial({ color: 0x228b22 }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const zone = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 3, 0.05),
    new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true })
  );
  zone.position.set(0, 2.5, -60.5);
  scene.add(zone);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2.5, -60.5);
  controls.update();

  createUI();
  loadPitchData();
}

function createUI() {
  const teamSelect = document.createElement('select');
  teamSelect.id = 'teamSelect';
  document.body.appendChild(teamSelect);
  teamSelect.addEventListener('change', () => {
    currentTeam = teamSelect.value;
    populatePitchers(currentTeam);
  });

  const pitcherSelect = document.createElement('select');
  pitcherSelect.id = 'pitcherSelect';
  document.body.appendChild(pitcherSelect);
  pitcherSelect.addEventListener('change', () => {
    currentPitcher = pitcherSelect.value;
    clearBalls();
    throwAllPitches();
  });

  const replayBtn = document.createElement('button');
  replayBtn.innerText = 'Replay';
  replayBtn.onclick = () => {
    clearBalls();
    throwAllPitches();
  };
  document.body.appendChild(replayBtn);
}

function loadPitchData() {
  fetch('pitch_data.json')
    .then(res => res.json())
    .then(data => {
      pitchData = data;
      const teams = Object.keys(pitchData);
      const teamSelect = document.getElementById('teamSelect');
      teams.forEach(team => {
        const opt = document.createElement('option');
        opt.value = team;
        opt.textContent = team;
        teamSelect.appendChild(opt);
      });
      currentTeam = teams[0];
      populatePitchers(currentTeam);
    });
}

function populatePitchers(team) {
  const pitcherSelect = document.getElementById('pitcherSelect');
  pitcherSelect.innerHTML = '';
  const pitchers = Object.keys(pitchData[team]);
  pitchers.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    pitcherSelect.appendChild(opt);
  });
  currentPitcher = pitchers[0];
  clearBalls();
  throwAllPitches();
}

function throwAllPitches() {
  const pitches = pitchData[currentTeam][currentPitcher];
  Object.entries(pitches).forEach(([pitchType, pitch]) => {
    addBall(pitch, pitchType);
  });
}

function getSpinAxisVector(degrees) {
  const radians = THREE.MathUtils.degToRad(degrees);
  return new THREE.Vector3(Math.cos(radians), 0, Math.sin(radians)).normalize();
}

function createHalfColorMaterial(pitchType) {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(1, 0, 1, 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return new THREE.MeshStandardMaterial({ map: texture });
}

function addBall(pitch, pitchType) {
  const geometry = new THREE.SphereGeometry(0.145, 32, 32);
  const material = createHalfColorMaterial(pitchType);
  const ball = new THREE.Mesh(geometry, material);

  const t0 = clock.getElapsedTime();

  ball.userData = {
    t0,
    release: {
      x: -pitch.release_pos_x,
      y: pitch.release_pos_z,
      z: -pitch.release_extension
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
    spinRate: pitch.release_spin_rate,
    spinAxis: getSpinAxisVector(pitch.spin_axis)
  };

  ball.position.set(
    ball.userData.release.x,
    ball.userData.release.y,
    ball.userData.release.z
  );

  balls.push(ball);
  scene.add(ball);
}

function clearBalls() {
  balls.forEach(ball => scene.remove(ball));
  balls = [];
}

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  balls.forEach(ball => {
    const dt = t - ball.userData.t0;
    const { release, velocity, accel } = ball.userData;
    ball.position.set(
      release.x + velocity.x * dt + 0.5 * accel.x * dt * dt,
      release.y + velocity.y * dt + 0.5 * accel.y * dt * dt,
      release.z + velocity.z * dt + 0.5 * accel.z * dt * dt
    );

    if (spinBalls && ball.userData.spinRate) {
      const spinSpeed = (ball.userData.spinRate / 60) * 2 * Math.PI;
      ball.rotateOnAxis(ball.userData.spinAxis, spinSpeed * clock.getDelta());
    }
  });
  renderer.render(scene, camera);
}
