// main.js
import { initScene } from './scene.js';
import { setupUI } from './ui.js';
import { loadAndAnimatePitch } from './animation.js';

let sceneObjects;

async function main() {
  sceneObjects = initScene(); // camera, scene, renderer, etc.
  setupUI(sceneObjects, loadAndAnimatePitch);
}

main();
