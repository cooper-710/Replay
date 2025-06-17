// scene.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js';

export function initScene() {
  const canvas = document.getElementById('three-canvas');
  const scene = new THREE.Scene();

  // === CAMERA ===
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 5, -65);
  camera.lookAt(0, 2.5, -60.5);

  // === RENDERER ===
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.setClearColor(0x050505); // Deep black-gray background

  // === LIGHTING ===
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  const keyLight = new THREE.DirectionalLight(0xfff5e5, 1.2); // Warm stadium tone
  keyLight.position.set(20, 50, 10);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 100;
  scene.add(ambientLight, keyLight);

  // === FIELD (Textured Ground) ===
  const grassTexture = new THREE.MeshStandardMaterial({
    color: 0x1e442d, // dark turf green
    roughness: 1,
    metalness: 0
  });
  const field = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), grassTexture);
  field.rotation.x = -Math.PI / 2;
  field.receiveShadow = true;
  scene.add(field);

  // === PITCHER'S MOUND ===
  const mound = new THREE.Mesh(
    new THREE.SphereGeometry(2.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x6e4f3a }) // mound brown
  );
  mound.position.set(0, 0.1, 0); // flat edge toward plate
  mound.receiveShadow = true;
  scene.add(mound);

  // === HOME PLATE (Shaped) ===
  const plateShape = new THREE.Shape();
  const w = 0.85, h = 1.0;
  plateShape.moveTo(-w, 0);
  plateShape.lineTo(w, 0);
  plateShape.lineTo(w, h * 0.6);
  plateShape.lineTo(0, h);
  plateShape.lineTo(-w, h * 0.6);
  plateShape.lineTo(-w, 0);
  const plateGeom = new THREE.ExtrudeGeometry(plateShape, { depth: 0.02, bevelEnabled: false });
  const plate = new THREE.Mesh(
    plateGeom,
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
  );
  plate.rotation.x = -Math.PI / 2;
  plate.position.set(0, 0.01, -60.5);
  plate.receiveShadow = true;
  scene.add(plate);

  // === STRIKE ZONE (Clean glowing frame) ===
  const szWidth = 1.5;
  const szHeight = 2.0;
  const szBox = new THREE.BoxGeometry(szWidth, szHeight, 0.05);
  const szEdges = new THREE.EdgesGeometry(szBox);
  const szLines = new THREE.LineSegments(
    szEdges,
    new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 })
  );
  szLines.position.set(0, 2.8 - szHeight / 2, -60.5);
  scene.add(szLines);

  // === BACK WALL / HORIZON ===
  const backdrop = new THREE.Mesh(
    new THREE.CylinderGeometry(100, 100, 80, 32, 1, true, 0, Math.PI),
    new THREE.MeshStandardMaterial({
      color: 0x111111,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.8
    })
  );
  backdrop.rotation.y = Math.PI;
  backdrop.position.set(0, 30, -90);
  scene.add(backdrop);

  // === SKY DOME ===
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(300, 32, 32),
    new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      color: 0x080808,
      transparent: true,
      opacity: 0.85
    })
  );
  sky.position.y = 100;
  scene.add(sky);

  // === RESIZE HANDLER ===
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}
