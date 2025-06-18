
import { loadAndAnimatePitch, replayAnimation, pauseAnimation, setTrailVisibility } from './animation.js';

let currentPitchData = null;
let sceneObjects = {};

export function initUI(data, sceneObjectsRef) {
  sceneObjects = sceneObjectsRef;

  const teamSelect = document.getElementById('teamSelect');
  const batterSelect = document.getElementById('batterSelect');
  const dateSelect = document.getElementById('dateSelect');
  const pitcherSelect = document.getElementById('pitcherSelect');
  const pitchSelect = document.getElementById('pitchSelect');

  populateDropdown(teamSelect, Object.keys(data));

  teamSelect.addEventListener('change', () => {
    const team = teamSelect.value;
    populateDropdown(batterSelect, Object.keys(data[team] || {}));
    clearDropdown(dateSelect);
    clearDropdown(pitcherSelect);
    clearDropdown(pitchSelect);
  });

  batterSelect.addEventListener('change', () => {
    const team = teamSelect.value;
    const batter = batterSelect.value;
    populateDropdown(dateSelect, Object.keys(data[team]?.[batter] || {}));
    clearDropdown(pitcherSelect);
    clearDropdown(pitchSelect);
  });

  dateSelect.addEventListener('change', () => {
    const team = teamSelect.value;
    const batter = batterSelect.value;
    const date = dateSelect.value;
    populateDropdown(pitcherSelect, Object.keys(data[team]?.[batter]?.[date] || {}));
    clearDropdown(pitchSelect);
  });

  pitcherSelect.addEventListener('change', () => {
    const team = teamSelect.value;
    const batter = batterSelect.value;
    const date = dateSelect.value;
    const pitcher = pitcherSelect.value;
    populateDropdown(pitchSelect, Object.keys(data[team]?.[batter]?.[date]?.[pitcher] || {}));
  });

  pitchSelect.addEventListener('change', () => {
    const team = teamSelect.value;
    const batter = batterSelect.value;
    const date = dateSelect.value;
    const pitcher = pitcherSelect.value;
    const pitch = pitchSelect.value;

    console.log("Selected Path:", team, batter, date, pitcher, pitch);
    const pitchData = data?.[team]?.[batter]?.[date]?.[pitcher]?.[pitch];
    console.log("Loaded Pitch Data:", pitchData);

    if (pitchData) {
      currentPitchData = pitchData;
      loadAndAnimatePitch(currentPitchData, sceneObjects);
      updateScorebug(team, batter, pitcher, date, pitch);
    } else {
      console.error("⚠️ Pitch data not found for:", team, batter, date, pitcher, pitch);
    }
  });

  document.getElementById('replayBtn').addEventListener('click', () => {
    if (currentPitchData) {
      replayAnimation(currentPitchData, sceneObjects);
    }
  });

  document.getElementById('pauseBtn').addEventListener('click', () => {
    pauseAnimation();
  });

  document.getElementById('trailBtn').addEventListener('click', (e) => {
    setTrailVisibility(e.target.checked);
  });

  document.getElementById('viewSelect').addEventListener('change', (e) => {
    const view = e.target.value;
    const camera = sceneObjects.camera;
    if (view === 'Catcher') {
      camera.position.set(0, 2.5, -65);
    } else if (view === 'Umpire') {
      camera.position.set(0, 2.5, -62);
    } else if (view === 'Behind Pitcher') {
      camera.position.set(0, 2.2, 10);
    }
    camera.lookAt(0, 2.5, 0);
  });
}

function populateDropdown(select, options) {
  clearDropdown(select);
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    select.appendChild(option);
  });
}

function clearDropdown(select) {
  select.innerHTML = '<option value="">--</option>';
}

function updateScorebug(team, batter, pitcher, date, pitch) {
  document.getElementById('scorebug').textContent = `TEAM: ${team} | BATTER: ${batter} | PITCHER: ${pitcher} | DATE: ${date} | PITCH ID: ${pitch}`;
}
