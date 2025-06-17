
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.148.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let baseballs = [];
let activeBalls = [];
let pitchData;
let animationId;
let clock = new THREE.Clock();
let selectedTeam = null;
let selectedPitcher = null;
let selectedPitches = [];

const pitchColors = {
    FF: 0xff0000,
    SL: 0x0000ff,
    CH: 0x00ff00,
    CU: 0xff00ff,
    SI: 0xffff00,
    FC: 0x00ffff,
    KC: 0x9933ff,
    FS: 0xff9933,
    default: 0xffffff
};

init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.8, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.8, 0);
    controls.update();

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 10, 10);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const plateGeometry = new THREE.BoxGeometry(0.5, 0.01, 0.5);
    const plateMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const plate = new THREE.Mesh(plateGeometry, plateMaterial);
    plate.position.set(0, 0, -18.44);
    scene.add(plate);

    fetch('./pitch_data.json')
        .then(res => res.json())
        .then(data => {
            pitchData = data;
            populateDropdowns(data);
        });

    document.getElementById('playButton').addEventListener('click', () => {
        throwNextPitch();
    });
}

function populateDropdowns(data) {
    const teamDropdown = document.getElementById('teamDropdown');
    for (let team in data) {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamDropdown.appendChild(option);
    }

    teamDropdown.addEventListener('change', (e) => {
        selectedTeam = e.target.value;
        updatePitcherDropdown();
    });

    document.getElementById('pitcherDropdown').addEventListener('change', (e) => {
        selectedPitcher = e.target.value;
        updatePitchCheckboxes();
    });
}

function updatePitcherDropdown() {
    const pitcherDropdown = document.getElementById('pitcherDropdown');
    pitcherDropdown.innerHTML = '<option>Select Pitcher</option>';
    if (!selectedTeam) return;

    for (let pitcher in pitchData[selectedTeam]) {
        const option = document.createElement('option');
        option.value = pitcher;
        option.textContent = pitcher;
        pitcherDropdown.appendChild(option);
    }
}

function updatePitchCheckboxes() {
    const container = document.getElementById('pitchCheckboxes');
    container.innerHTML = '';

    if (!selectedTeam || !selectedPitcher) return;

    const pitches = Object.keys(pitchData[selectedTeam][selectedPitcher]);
    const uniqueTypes = [...new Set(pitches.map(p => p.split(' ')[0]))];

    uniqueTypes.forEach(type => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" value="${type}" checked> ${type}`;
        label.querySelector('input').addEventListener('change', () => {
            selectedPitches = getSelectedPitchTypes();
        });
        container.appendChild(label);
    });

    selectedPitches = uniqueTypes;
}

function getSelectedPitchTypes() {
    const checkboxes = document.querySelectorAll('#pitchCheckboxes input[type="checkbox"]');
    return Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
}

function throwNextPitch() {
    if (!selectedTeam || !selectedPitcher || selectedPitches.length === 0) return;

    const allKeys = Object.keys(pitchData[selectedTeam][selectedPitcher])
        .filter(k => selectedPitches.includes(k.split(' ')[0]));

    const key = allKeys[Math.floor(Math.random() * allKeys.length)];
    const pitch = pitchData[selectedTeam][selectedPitcher][key];

    const geometry = new THREE.SphereGeometry(0.037, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: pitchColors[pitch.pitch_type] || pitchColors.default });
    const ball = new THREE.Mesh(geometry, material);

    ball.position.set(pitch.release_pos_x, pitch.release_pos_y, pitch.release_pos_z);
    ball.userData = {
        vx0: pitch.vx0,
        vy0: pitch.vy0,
        vz0: pitch.vz0,
        ax: pitch.ax,
        ay: pitch.ay,
        az: pitch.az,
        t: 0
    };

    scene.add(ball);
    activeBalls.push(ball);
}

function animate() {
    animationId = requestAnimationFrame(animate);
    const delta = clock.getDelta();

    activeBalls.forEach(ball => {
        const t = ball.userData.t + delta;
        ball.userData.t = t;

        const { vx0, vy0, vz0, ax, ay, az } = ball.userData;
        ball.position.x = ball.position.x + vx0 * delta + 0.5 * ax * delta * delta;
        ball.position.y = ball.position.y + vy0 * delta + 0.5 * ay * delta * delta;
        ball.position.z = ball.position.z + vz0 * delta + 0.5 * az * delta * delta;
    });

    renderer.render(scene, camera);
}
