import { initScene } from './scene.js';
import { setupUI } from './ui.js';
import { loadAndAnimatePitch } from './animation.js';

let sceneObjects;

async function main() {
  // Initialize the full scene (camera, renderer, controls, etc.)
  sceneObjects = initScene();

  // Attach UI logic for dropdowns, replay, pause, trail, etc.
  setupUI(sceneObjects, loadAndAnimatePitch);

  // Start rendering loop
  renderLoop();
}

function renderLoop() {
  requestAnimationFrame(renderLoop);

  // Update camera if using OrbitControls
  if (sceneObjects.controls) {
    sceneObjects.controls.update();
  }

  sceneObjects.renderer.render(sceneObjects.scene, sceneObjects.camera);
}

main();
