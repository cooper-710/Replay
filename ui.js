// ui.js
import { loadAndAnimatePitch, setTrailVisibility, pauseAnimation, replayAnimation } from './animation.js';

export function setupUI(sceneObjects, pitchLoader) {
  const teamSelect = document.getElementById('teamSelect');
  const batterSelect = document.getElementById('batterSelect');
  const dateSelect = document.getElementById('dateSelect');
  const pitcherSelect = document.getElementById('pitcherSelect');
  const pitchSelect = document.getElementById('pitchSelect');
  const cameraSelect = document.getElementById('cameraSelect');
  const trailToggle = document.getElementById('trailToggle');
  const replayBtn = document.getElementById('replayBtn');
  const pauseBtn = document.getElementById('pauseBtn');

  let currentPitchData = null;

  // Load pitch_data.json and populate dropdowns
  fetch('pitch_data.json')
    .then(res => res.json())
    .then(data => {
      const teams = Object.keys(data);
      for (const team of teams) {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamSelect.appendChild(option);
      }

      teamSelect.addEventListener('change', () => {
        const team = teamSelect.value;
        batterSelect.innerHTML = '';
        const batters = Object.keys(data[team]);
        for (const batter of batters) {
          const option = document.createElement('option');
          option.value = batter;
          option.textContent = batter;
          batterSelect.appendChild(option);
        }
      });

      batterSelect.addEventListener('change', () => {
        const team = teamSelect.value;
        const batter = batterSelect.value;
        dateSelect.innerHTML = '';
        const dates = Object.keys(data[team][batter]);
        for (const date of dates) {
          const option = document.createElement('option');
          option.value = date;
          option.textContent = date;
          dateSelect.appendChild(option);
        }
      });

      dateSelect.addEventListener('change', () => {
        const team = teamSelect.value;
        const batter = batterSelect.value;
        const date = dateSelect.value;
        pitcherSelect.innerHTML = '';
        const pitchers = Object.keys(data[team][batter][date]);
        for (const pitcher of pitchers) {
          const option = document.createElement('option');
          option.value = pitcher;
          option.textContent = pitcher;
          pitcherSelect.appendChild(option);
        }
      });

      pitcherSelect.addEventListener('change', () => {
        const team = teamSelect.value;
        const batter = batterSelect.value;
        const date = dateSelect.value;
        const pitcher = pitcherSelect.value;
        pitchSelect.innerHTML = '';
        const pitches = Object.keys(data[team][batter][date][pitcher]);
        for (const pitch of pitches) {
          const option = document.createElement('option');
          option.value = pitch;
          option.textContent = pitch;
          pitchSelect.appendChild(option);
        }
      });

      pitchSelect.addEventListener('change', () => {
        const team = teamSelect.value;
        const batter = batterSelect.value;
        const date = dateSelect.value;
        const pitcher = pitcherSelect.value;
        const pitch = pitchSelect.value;
        currentPitchData = data[team][batter][date][pitcher][pitch];
        pitchLoader(currentPitchData, sceneObjects);
        updateScorebug(team, batter, pitcher, date, pitch);
      });
    });

  trailToggle.addEventListener('change', () => {
    setTrailVisibility(trailToggle.checked);
  });

  replayBtn.addEventListener('click', () => {
    if (currentPitchData) {
      replayAnimation(currentPitchData, sceneObjects);
    }
  });

  pauseBtn.addEventListener('click', () => {
    pauseAnimation();
  });

  function updateScorebug(team, batter, pitcher, date, pitch) {
    document.getElementById('scorebugTeam').textContent = team;
    document.getElementById('scorebugOpponent').textContent = 'OPP';
    document.getElementById('scorebugBatter').textContent = batter;
    document.getElementById('scorebugPitcher').textContent = pitcher;
    document.getElementById('scorebugInning').textContent = '1';
    document.getElementById('scorebugCount').textContent = '0-0';
    // Optionally update Top/Bottom if stored
  }
}
