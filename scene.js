// scene.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js';

export function initScene() {
  const canvas = document.getElementById('three-canvas');
  const scene = new THREE.Scene();

  // Camera (behind catcher looking toward mound)
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 5, -65);
  camera.lookAt(0, 3, 0);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x0a0a0a);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  scene.add(ambientLight, directionalLight);

  // Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: 0x223322 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  scene.add(ground);

  // Home Plate
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.01, 1),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  plate.position.set(0, 0.01, -60.5);
  scene.add(plate);

  // Strike Zone Box
  const szWidth = 1.5;
  const szHeight = 2.0;
  const szGeometry = new THREE.BoxGeometry(szWidth, szHeight, 0.05);
  const szEdges = new THREE.EdgesGeometry(szGeometry);
  const szLines = new THREE.LineSegments(szEdges, new THREE.LineBasicMaterial({ color: 0xffffff }));
  szLines.position.set(0, 2.8 - szHeight / 2, -60.5);
  scene.add(szLines);

  // Handle resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}
