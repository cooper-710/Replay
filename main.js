import { initScene } from './scene.js';
import { setupUI } from './ui.js';
import {
  loadAndAnimatePitch,
  replayAnimation,
  pauseAnimation,
  setTrailVisibility,
  clearAllBalls
} from './animation.js';

let sceneObjects;

window.addEventListener('DOMContentLoaded', () => {
  sceneObjects = initScene();

  setupUI({
    onPitchSelect: (pitchData) => loadAndAnimatePitch(pitchData, sceneObjects),
    onReplay: (pitchData) => replayAnimation(pitchData, sceneObjects),
    onPause: () => pauseAnimation(),
    onToggleTrail: (visible) => setTrailVisibility(visible),
    onClear: () => clearAllBalls(sceneObjects.scene),
    sceneObjects
  });
});
