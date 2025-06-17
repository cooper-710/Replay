
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js';

// === SCENE SETUP ===
const scene = new THREE.Scene();
scene.background = new THREE.Color('#d0f0ff');

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.8, -65);  // Catcher's POV

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// === LIGHTING ===
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 5, -10);
scene.add(light);

// === STRIKE ZONE ===
const strikeZone = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 2.0, 0.05),
    new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true })
);
strikeZone.position.set(0, 2, -60.5);
scene.add(strikeZone);

// === MOUND ===
const mound = new THREE.Mesh(
    new THREE.CylinderGeometry(4, 4, 0.25, 32),
    new THREE.MeshStandardMaterial({ color: 0x8B4513 })
);
mound.position.set(0, 0.125, 0);
scene.add(mound);

// === GLOBALS ===
let pitches = [];
let currentIndex = 0;
let ball = null;
let animationStart = null;
let spinGroup = null;
let spinAngle = 0;

// === LOAD PITCH DATA ===
fetch('pitch_data.json')
    .then(res => res.json())
    .then(data => {
        pitches = data;
        throwPitch(pitches[currentIndex]);
    });

// === THROW PITCH ===
function throwPitch(pitch) {
    if (ball) scene.remove(ball);
    if (spinGroup) scene.remove(spinGroup);

    const geometry = new THREE.SphereGeometry(0.145, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });

    const ballMesh = new THREE.Mesh(geometry, material);
    ballMesh.position.set(pitch.release_pos_x, pitch.release_pos_y, pitch.release_pos_z);

    // Add color spin
    const colorMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

    const leftHalf = new THREE.Mesh(new THREE.SphereGeometry(0.145, 32, 32, 0, Math.PI), colorMat);
    const rightHalf = new THREE.Mesh(new THREE.SphereGeometry(0.145, 32, 32, Math.PI, Math.PI), whiteMat);

    spinGroup = new THREE.Group();
    spinGroup.add(leftHalf);
    spinGroup.add(rightHalf);

    spinGroup.position.copy(ballMesh.position);
    scene.add(spinGroup);

    ball = spinGroup;
    animationStart = performance.now();

    animatePitch(pitch);
}

// === ANIMATE PITCH ===
function animatePitch(pitch) {
    const { vx0, vy0, vz0, ax, ay, az } = pitch;
    const startX = pitch.release_pos_x;
    const startY = pitch.release_pos_y;
    const startZ = pitch.release_pos_z;

    function animateFrame(time) {
        const t = (time - animationStart) / 1000;  // seconds
        if (t > 1.5) return;

        const x = startX + vx0 * t + 0.5 * ax * t * t;
        const y = startY + vy0 * t + 0.5 * ay * t * t;
        const z = startZ + vz0 * t + 0.5 * az * t * t;

        spinGroup.position.set(x, y, z);

        // Spin logic
        const spinRateRPS = (pitch.release_spin_rate || 1800) / 60;
        spinAngle += spinRateRPS * 0.1;
        spinGroup.rotation.y = spinAngle;

        renderer.render(scene, camera);
        requestAnimationFrame(animateFrame);
    }

    requestAnimationFrame(animateFrame);
}

// === HANDLE KEYBOARD ===
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
        currentIndex = (currentIndex + 1) % pitches.length;
        throwPitch(pitches[currentIndex]);
    }
    if (e.key === 'ArrowLeft') {
        currentIndex = (currentIndex - 1 + pitches.length) % pitches.length;
        throwPitch(pitches[currentIndex]);
    }
});
