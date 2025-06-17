
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js';

let scene, camera, renderer, clock;
let balls = [];
let trailDots = [];
let pitchData = [];
let selectedPitch = null;
let animationActive = false;
let trailEnabled = false;

const cameraPositions = {
  catcher: new THREE.Vector3(0, 1, -65),
  pitcher: new THREE.Vector3(0, 1, 30),
  RHH: new THREE.Vector3(-3, 1, -20),
  LHH: new THREE.Vector3(3, 1, -20),
  "1B": new THREE.Vector3(10, 1, -10),
  "3B": new THREE.Vector3(-10, 1, -10),
};

function initScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  clock = new THREE.Clock();
  addLighting();
  setCameraPosition('catcher');
  animate();
}

function setCameraPosition(view) {
  const pos = cameraPositions[view];
  camera.position.copy(pos);
  camera.lookAt(new THREE.Vector3(0, 2.5, -60.5));
}

function addLighting() {
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const directional = new THREE.DirectionalLight(0xffffff, 0.6);
  directional.position.set(0, 50, -50);
  scene.add(directional);
}

function getSpinAxisVector(degrees) {
  const radians = THREE.MathUtils.degToRad(degrees);
  return new THREE.Vector3(Math.cos(radians), 0, Math.sin(radians)).normalize();
}

function createHalfColorMaterial(pitchType) {
  const colorMap = {
    FF: '#FF0000', SL: '#0000FF', CH: '#00FF00', CU: '#800080',
    SI: '#FFA500', FC: '#A52A2A', KC: '#4B0082', FS: '#4682B4'
  };
  const hex = colorMap[pitchType] || '#CCCCCC';
  const color = new THREE.Color(hex);
  const white = new THREE.Color('#FFFFFF');
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true });
  const geo = new THREE.SphereGeometry(0.145, 32, 32);
  const colors = [];
  for (let i = 0; i < geo.attributes.position.count; i++) {
    const y = geo.attributes.position.getY(i);
    colors.push(...(y >= 0 ? white.toArray() : color.toArray()));
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return new THREE.Mesh(geo, mat);
}

function addBall(pitch) {
  const mat = createHalfColorMaterial(pitch.pitch_type);
  const ball = mat;
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
    t0: t0,
    spinAxis: getSpinAxisVector(pitch.spin_axis || 0),
    spinRate: pitch.release_spin_rate || 0
  };
  ball.position.set(
    ball.userData.release.x,
    ball.userData.release.y,
    ball.userData.release.z
  );
  balls.push(ball);
  scene.add(ball);
}

function updateBalls() {
  const t = clock.getElapsedTime();
  for (const ball of balls) {
    const { t0, velocity, accel, spinAxis, spinRate } = ball.userData;
    const dt = t - t0;
    ball.position.x = ball.userData.release.x + velocity.x * dt + 0.5 * accel.x * dt * dt;
    ball.position.y = ball.userData.release.y + velocity.y * dt + 0.5 * accel.y * dt * dt;
    ball.position.z = ball.userData.release.z + velocity.z * dt + 0.5 * accel.z * dt * dt;

    if (spinRate > 0) {
      const spinRad = spinRate * 2 * Math.PI / 60;
      ball.rotateOnAxis(spinAxis, spinRad * clock.getDelta());
    }

    if (trailEnabled) {
      const dotGeo = new THREE.SphereGeometry(0.02, 8, 8);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(ball.position);
      trailDots.push(dot);
      scene.add(dot);
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  if (animationActive) updateBalls();
  renderer.render(scene, camera);
}

function loadJSON() {
  fetch('pitch_data.json')
    .then(res => res.json())
    .then(data => {
      pitchData = data;
      populateDropdowns(data);
    });
}

function populateDropdowns(data) {
  const teamSet = new Set(data.map(p => p.team));
  const batterSet = new Set(data.map(p => p.batter));
  const pitcherSet = new Set(data.map(p => p.pitcher));
  const gameDateSet = new Set(data.map(p => p.game_date));
  const pitchSet = data.map((p, i) => `${i + 1}: ${p.pitch_type} - ${p.description}`);

  populateSelect("teamSelect", [...teamSet]);
  populateSelect("batterSelect", [...batterSet]);
  populateSelect("pitcherSelect", [...pitcherSet]);
  populateSelect("gameDateSelect", [...gameDateSet]);
  populateSelect("pitchSelect", pitchSet);
  populateSelect("cameraSelect", Object.keys(cameraPositions));
}

function populateSelect(id, options) {
  const select = document.getElementById(id);
  select.innerHTML = "";
  options.forEach(opt => {
    const option = document.createElement("option");
    option.value = opt;
    option.text = opt;
    select.appendChild(option);
  });
}

document.getElementById("replayBtn").addEventListener("click", () => {
  const pitchIdx = document.getElementById("pitchSelect").selectedIndex;
  if (pitchIdx >= 0 && pitchIdx < pitchData.length) {
    clearScene();
    selectedPitch = pitchData[pitchIdx];
    addBall(selectedPitch);
    animationActive = true;
  }
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  animationActive = !animationActive;
});

document.getElementById("cameraSelect").addEventListener("change", (e) => {
  setCameraPosition(e.target.value);
});

document.getElementById("showTrail").addEventListener("change", (e) => {
  trailEnabled = e.target.checked;
});

function clearScene() {
  for (const ball of balls) scene.remove(ball);
  for (const dot of trailDots) scene.remove(dot);
  balls = [];
  trailDots = [];
}

window.addEventListener('load', () => {
  initScene();
  loadJSON();
});
