
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js';

let scene, camera, renderer, ball;

function createHalfColorMaterial() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FF0000';
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 256, 512, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.4,
    metalness: 0.1
  });
}

function setup() {
  const canvas = document.getElementById('three-canvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
  scene.add(camera);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 5);
  scene.add(light);

  const geometry = new THREE.SphereGeometry(0.75, 64, 64);
  const material = createHalfColorMaterial();
  ball = new THREE.Mesh(geometry, material);
  ball.geometry.computeVertexNormals();  // ensure shading is correct
  scene.add(ball);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  const axis = new THREE.Vector3(0, 1, 0);
  const angleDelta = 0.05;

  ball.rotateOnAxis(axis, angleDelta);
  console.log('rotation:', ball.rotation.x.toFixed(2), ball.rotation.y.toFixed(2), ball.rotation.z.toFixed(2));
  renderer.render(scene, camera);
}

setup();
