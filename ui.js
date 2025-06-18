import {
  loadAndAnimatePitch,
  setTrailVisibility,
  pauseAnimation,
  replayAnimation
} from './animation.js';

export function setupUI({
  onPitchSelect,
  onReplay,
  onPause,
  onToggleTrail,
  sceneObjects
}) {
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
        batterSelect.innerHTML = '';
        const team = teamSelect.value;
        const batters = Object.keys(data[team] || {});
        for (const batter of batters) {
          const option = document.createElement('option');
          option.value = batter;
          option.textContent = batter;
          batterSelect.appendChild(option);
        }
        batterSelect.dispatchEvent(new Event('change'));
      });

      batterSelect.addEventListener('change', () => {
        const team = teamSelect.value;
        const batter = batterSelect.value;
        dateSelect.innerHTML = '';
        const dates = Object.keys(data[team]?.[batter] || {});
        for (const date of dates) {
          const option = document.createElement('option');
          option.value = date;
          option.textContent = date;
          dateSelect.appendChild(option);
        }
        dateSelect.dispatchEvent(new Event('change'));
      });

      dateSelect.addEventListener('change', () => {
        const team = teamSelect.value;
        const batter = batterSelect.value;
        const date = dateSelect.value;
        pitcherSelect.innerHTML = '';
        const pitchers = Object.keys(data[team]?.[batter]?.[date] || {});
        for (const pitcher of pitchers) {
          const option = document.createElement('option');
          option.value = pitcher;
          option.textContent = pitcher;
          pitcherSelect.appendChild(option);
        }
        pitcherSelect.dispatchEvent(new Event('change'));
      });

      pitcherSelect.addEventListener('change', () => {
        const team = teamSelect.value;
        const batter = batterSelect.value;
        const date = dateSelect.value;
        const pitcher = pitcherSelect.value;
        pitchSelect.innerHTML = '';
        const pitches = Object.keys(data[team]?.[batter]?.[date]?.[pitcher] || {});
        for (const pitch of pitches) {
          const option = document.createElement('option');
          option.value = pitch;
          option.textContent = pitch;
          pitchSelect.appendChild(option);
        }
        pitchSelect.dispatchEvent(new Event('change'));
      });

      pitchSelect.addEventListener('change', () => {
        const team = teamSelect.value;
        const batter = batterSelect.value;
        const date = dateSelect.value;
        const pitcher = pitcherSelect.value;
        const pitch = pitchSelect.value;
        const pitchData = data?.[team]?.[batter]?.[date]?.[pitcher]?.[pitch];
        if (pitchData) {
          currentPitchData = pitchData;
          onPitchSelect(pitchData);
          updateScorebug(team, batter, pitcher, date, pitch);
        }
      });

      teamSelect.selectedIndex = 0;
      teamSelect.dispatchEvent(new Event('change'));
    });

  trailToggle.addEventListener('change', () => {
    onToggleTrail(trailToggle.checked);
  });

  replayBtn.addEventListener('click', () => {
    if (currentPitchData) {
      onReplay(currentPitchData);
    }
  });

  pauseBtn.addEventListener('click', () => {
    onPause();
  });

  cameraSelect.addEventListener('change', () => {
    setCamera(cameraSelect.value);
  });

  function setCamera(view) {
    const { camera } = sceneObjects;

    switch (view) {
      case 'catcher':
        camera.position.set(0, 2.5, -65);
        camera.lookAt(0, 2.5, 0);
        break;
      case 'pitcher':
        camera.position.set(0, 6.0, 5);
        camera.lookAt(0, 2.0, -60.5);
        break;
      case 'rhh':
        camera.position.set(1, 4.0, -65);
        camera.lookAt(0, 1.5, 0);
        break;
      case 'lhh':
        camera.position.set(-1, 4.0, -65);
        camera.lookAt(0, 1.5, 0);
        break;
      case '1b':
        camera.position.set(50, 4.5, -30);
        camera.lookAt(0, 5, -30);
        break;
      case '3b':
        camera.position.set(-50, 4.5, -30);
        camera.lookAt(0, 5, -30);
        break;
      case 'side':
        camera.position.set(-25, 2.5, -15);
        camera.lookAt(0, 2.0, -30);
        break;
      case 'top':
        camera.position.set(0, 80, -30);
        camera.lookAt(0, 0, -30);
        break;
    }
  }

  function updateScorebug(team, batter, pitcher, date, pitch) {
    document.getElementById('scorebugTeam').textContent = team;
    document.getElementById('scorebugOpponent').textContent = 'OPP';
    document.getElementById('scorebugBatter').textContent = batter;
    document.getElementById('scorebugPitcher').textContent = pitcher;
    document.getElementById('scorebugInning').textContent = '1';
    document.getElementById('scorebugCount').textContent = '0-0';
  }
}
