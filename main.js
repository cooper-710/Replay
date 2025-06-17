// main.js
import { initScene } from './scene.js';
import { setupUI } from './ui.js';
import { loadAndAnimatePitch } from './animation.js';

let sceneObjects;

async function main() {
  sceneObjects = initScene();
  setupUI(sceneObjects, loadAndAnimatePitch);

  // NEW: Render initial empty scene continuously
  const { scene, camera, renderer } = sceneObjects;
  function renderLoop() {
    requestAnimationFrame(renderLoop);
    renderer.render(scene, camera);
  }
  renderLoop();
}

main();
