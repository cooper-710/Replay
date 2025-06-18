import { initScene } from './scene.js';
import { setupUI } from './ui.js';
import {
  loadAndAnimatePitch,
  animate,
  pauseAnimation,
  replayAnimation,
  setTrailVisibility,
  clearAllBalls
} from './animation.js';

let sceneObjects;

window.addEventListener('DOMContentLoaded', async () => {
  sceneObjects = initScene();
  setupUI({
    onPitchSelect: (pitchData) => loadAndAnimatePitch(pitchData, sceneObjects),
    onReplay: (pitchData) => replayAnimation(pitchData, sceneObjects),
    onPause: () => pauseAnimation(),
    onToggleTrail: (visible) => setTrailVisibility(visible),
    onClear: () => clearAllBalls(sceneObjects.scene)
  });
  animate(sceneObjects);
});
