// scene.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js';

export function initScene() {
  const canvas = document.getElementById('three-canvas');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);

  // === MOUND ===
  const moundGeometry = new THREE.CylinderGeometry(2.0, 9, 2.0, 64);
  const moundMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const mound = new THREE.Mesh(moundGeometry, moundMaterial);
  mound.position.set(0, 0, 0);
  mound.receiveShadow = true;
  scene.add(mound);

  // === PITCHER'S RUBBER ===
  const rubber = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.05, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  rubber.position.set(0, 1.05, 0);
  rubber.castShadow = true;
  rubber.receiveShadow = true;
  scene.add(rubber);

  // === CAMERA ===
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 2.5, -65);
  camera.lookAt(0, 2.5, 0);
  scene.add(camera);

  // === LIGHTING ===
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  const hemiLight = new THREE.HemisphereLight(0xb1e1ff, 0x8b4513, 0.4);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xfff0e5, 1.0);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);
  dirLight.shadow.camera.set(-20, 20, 20, -20, 1, 100);

  const dirTarget = new THREE.Object3D();
  dirTarget.position.set(0, 0, 0);
  scene.add(dirTarget);
  dirLight.target = dirTarget;

  scene.add(dirLight);

  const plateLight = new THREE.PointLight(0xffffff, 0.6, 100);
  plateLight.position.set(0, 3, -60.5);
  scene.add(plateLight);

  // === GROUND ===
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x1e472d, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // === STRIKE ZONE ===
  const zone = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.42, 2.0)),
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );
  zone.position.set(0, 2.5, -60.5);
  scene.add(zone);

  // === HOME PLATE ===
  const shape = new THREE.Shape();
  shape.moveTo(-0.85, 0);
  shape.lineTo(0.85, 0);
  shape.lineTo(0.85, 0.5);
  shape.lineTo(0, 1.0);
  shape.lineTo(-0.85, 0.5);
  shape.lineTo(-0.85, 0);
  const plate = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })
  );
  plate.rotation.x = -Math.PI / 2;
  plate.position.set(0, 0.011, -60.5);
  scene.add(plate);

  // === RESIZE ===
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}
