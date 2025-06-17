
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.148.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let balls = [];
let pitchData = [];
let selectedPitch = null;
let trailDots = [];
let clock = new THREE.Clock();
let cameraAngle = 'Catcher';
let isPlaying = false;
let showTrail = true;

const cameraAngles = {
  Catcher: { x: 0, y: 1.8, z: 5 },
  Pitcher: { x: 0, y: 1.8, z: -5 },
  RHH: { x: 2, y: 1.8, z: 0 },
  LHH: { x: -2, y: 1.8, z: 0 },
  '1B': { x: 5, y: 1.8, z: 2 },
  '3B': { x: -5, y: 1.8, z: 2 }
};

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#111');

  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(...Object.values(cameraAngles[cameraAngle]));

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(0, 10, 10);
  scene.add(light);

  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.01, 0.5), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  plate.position.set(0, 0, -18.44);
  scene.add(plate);

  loadPitchData();

  setupUI();
}

function setupUI() {
  document.getElementById('replayBtn').addEventListener('click', () => {
    if (selectedPitch) {
      addBall(selectedPitch);
    }
  });

  document.getElementById('pauseBtn').addEventListener('click', () => {
    isPlaying = !isPlaying;
  });

  document.getElementById('trailToggle').addEventListener('change', (e) => {
    showTrail = e.target.checked;
  });

  document.getElementById('cameraSelect').addEventListener('change', (e) => {
    cameraAngle = e.target.value;
    camera.position.set(...Object.values(cameraAngles[cameraAngle]));
    controls.update();
  });
}

function loadPitchData() {
  fetch('pitch_data.json')
    .then(res => res.json())
    .then(data => {
      pitchData = data;
      populateDropdowns(data);
    });
}

function populateDropdowns(data) {
  const pitchSelect = document.getElementById('pitchSelect');
  data.forEach((pitch, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = `${pitch.pitcher} vs ${pitch.batter} (${pitch.pitch_type} - ${pitch.description})`;
    pitchSelect.appendChild(opt);
  });

  pitchSelect.addEventListener('change', (e) => {
    selectedPitch = pitchData[e.target.value];
  });
}

function getSpinAxisVector(degrees) {
  const radians = THREE.MathUtils.degToRad(degrees);
  return new THREE.Vector3(Math.cos(radians), 0, Math.sin(radians)).normalize();
}

function createHalfColorMaterial(pitchType) {
  const colorMap = {
    FF: '#FF0000', SL: '#0000FF', CU: '#00FF00', CH: '#FFFF00',
    SI: '#FFA500', FC: '#800080', KC: '#4B0082', FS: '#A52A2A'
  };

  const pitchColor = new THREE.Color(colorMap[pitchType] || '#FFFFFF');

  const mat = new THREE.MeshStandardMaterial({
    color: pitchColor,
    flatShading: false,
    metalness: 0.3,
    roughness: 0.5
  });

  return mat;
}

function addBall(pitch) {
  const geometry = new THREE.SphereGeometry(0.145, 32, 32);
  const material = createHalfColorMaterial(pitch.pitch_type);
  const ball = new THREE.Mesh(geometry, material);

  ball.userData = {
    t0: clock.getElapsedTime(),
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
    spinAxis: getSpinAxisVector(pitch.spin_axis || 0),
    spinRate: pitch.release_spin_rate || 0
  };

  ball.position.set(ball.userData.release.x, ball.userData.release.y, ball.userData.release.z);

  scene.add(ball);
  balls.push(ball);
}

function animate() {
  requestAnimationFrame(animate);

  const tNow = clock.getElapsedTime();
  for (const ball of balls) {
    const t = tNow - ball.userData.t0;
    if (t > 5) {
      scene.remove(ball);
      balls = balls.filter(b => b !== ball);
      continue;
    }

    const { release, velocity, accel, spinAxis, spinRate } = ball.userData;

    ball.position.set(
      release.x + velocity.x * t + 0.5 * accel.x * t * t,
      release.y + velocity.y * t + 0.5 * accel.y * t * t,
      release.z + velocity.z * t + 0.5 * accel.z * t * t
    );

    if (spinRate && spinAxis) {
      const spinRadPerSec = (spinRate * 2 * Math.PI) / 60;
      ball.rotateOnAxis(spinAxis, spinRadPerSec * clock.getDelta());
    }

    if (showTrail) {
      const dotGeo = new THREE.SphereGeometry(0.01, 8, 8);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(ball.position);
      scene.add(dot);
      trailDots.push({ mesh: dot, tCreated: tNow });
    }
  }

  trailDots = trailDots.filter(trail => {
    if (tNow - trail.tCreated > 2) {
      scene.remove(trail.mesh);
      return false;
    }
    return true;
  });

  controls.update();
  renderer.render(scene, camera);
}
