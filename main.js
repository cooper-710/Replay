
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js';

let scene, camera, renderer, clock;
let ball = null, balls = [], trailDots = [], showTrail = false, playing = true;
let pitchData = [];

const pitchColorMap = {
  FF: 0xff0000, SL: 0x0000ff, CH: 0x008000, KC: 0x4B0082,
  SI: 0xFFA500, CU: 0x800080, FC: 0x808080, ST: 0x008080,
  FS: 0x00CED1, EP: 0xFF69B4, KN: 0xA9A9A9, SC: 0x708090,
  SV: 0x000000, CS: 0xA52A2A, FO: 0xDAA520
};

async function loadPitchData() {
  const res = await fetch('./pitch_data.json');
  return await res.json();
}

function createHalfColorMaterial(pitchType) {
  const baseType = pitchType.split(' ')[0];
  const hex = '#' + (pitchColorMap[baseType] || 0x888888).toString(16).padStart(6, '0');

  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, 2, 1);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 1, 2, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;

  return new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.4,
    metalness: 0.1
  });
}

function getSpinAxisVector(degrees) {
  const radians = THREE.MathUtils.degToRad(degrees);
  return new THREE.Vector3(Math.cos(radians), 0, Math.sin(radians)).normalize();
}

async async function setupScene() {

  const canvas = document.getElementById('three-canvas');

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.shadowMap.enabled = true;

  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // enables soft shadowing



  scene = new THREE.Scene();

  scene.background = new THREE.Color(0x222222);



  // === Mound ===

  const moundGeometry = new THREE.CylinderGeometry(2.0, 9, 2.0, 64);

  const moundMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown

  const mound = new THREE.Mesh(moundGeometry, moundMaterial);

  mound.position.set(0, 0, 0);  // Just beneath the pitch release point

  scene.add(mound);

  mound.receiveShadow = true;

  mound.castShadow = false;





  // === Pitcher's Rubber ===

  const rubberGeometry = new THREE.BoxGeometry(1, 0.05, 0.18); // Width, height, depth in feet

  const rubberMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

  const rubber = new THREE.Mesh(rubberGeometry, rubberMaterial);

  rubber.position.set(0, 1.05, 0);

  scene.add(rubber);

  rubber.castShadow = true;

  rubber.receiveShadow = true;





  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);

  camera.position.set(0, 2.5, -65);

  camera.lookAt(0, 2.5, 0);

  scene.add(camera);

  

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));



  const hemiLight = new THREE.HemisphereLight(0xb1e1ff, 0x8b4513, 0.4); 

// Sky blue tint from above, dirt brown bounce from below

  scene.add(hemiLight);



  

  const dirLight = new THREE.DirectionalLight(0xfff0e5, 1.0); // warm sunlight

  dirLight.position.set(5, 10, 5);

  dirLight.castShadow = true;



  dirLight.shadow.mapSize.width = 1024;

  dirLight.shadow.mapSize.height = 1024;

  dirLight.shadow.camera.near = 1;

  dirLight.shadow.camera.far = 100;

  dirLight.shadow.camera.left = -20;

  dirLight.shadow.camera.right = 20;

  dirLight.shadow.camera.top = 20;

  dirLight.shadow.camera.bottom = -20;



  const dirTarget = new THREE.Object3D();

  dirTarget.position.set(0, 0, 0);

  scene.add(dirTarget);

  dirLight.target = dirTarget;



  scene.add(dirLight);







  const plateLight = new THREE.PointLight(0xffffff, 0.6, 100);

  plateLight.position.set(0, 3, -60.5);

  scene.add(plateLight);



  const ground = new THREE.Mesh(

    new THREE.PlaneGeometry(200, 200),

    new THREE.MeshStandardMaterial({ color: 0x1e472d, roughness: 1 })

  );

  ground.rotation.x = -Math.PI / 2;

  scene.add(ground);

  ground.receiveShadow = true;



  const zone = new THREE.LineSegments(

    new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.42, 2.0)),

    new THREE.LineBasicMaterial({ color: 0xffffff })

  );

  zone.position.set(0, 2.5, -60.5);

  scene.add(zone);



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



  window.addEventListener('resize', () => {

    camera.aspect = window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  clock = new THREE.Clock();

  });

}

function throwPitch(pitch) {
  if (ball) scene.remove(ball);
  for (const d of trailDots) scene.remove(d.mesh);
  trailDots = [];

  const ballGeo = new THREE.SphereGeometry(0.145, 32, 32);
  const mat = createHalfColorMaterial(pitch.pitch_type);
  ball = new THREE.Mesh(ballGeo, mat);
  ball.castShadow = true;

  const t0 = clock.getElapsedTime();
  ball.userData = {
    t0,
    release: {
      x: -pitch.release_pos_x,
      y: -pitch.release_pos_z,
      z: -pitch.release_pos_y
    },
    velocity: {
      x: -pitch.vx0,
      y: pitch.vz0,
      z: pitch.vy0
    },
    accel: {
      x: -pitch.ax,
      y: pitch.az,
      z: pitch.ay
    },
    spinRate: pitch.release_spin_rate || 0,
    spinAxis: getSpinAxisVector(pitch.spin_axis || 0),
    type: pitch.pitch_type
  };

  
  playing = true;
  document.getElementById('toggleBtn').textContent = 'Pause';

  ball.position.set(
    ball.userData.release.x,
    ball.userData.release.y,
    ball.userData.release.z
  );

    playing = true;
  document.getElementById('toggleBtn').textContent = 'Pause';
  scene.add(ball);
  updateScorebug(pitch);
}

function updateScorebug(pitch) {
  const sb = document.getElementById('scorebug');
  sb.style.display = 'block';
  sb.innerHTML = `
    <div><b>Inning:</b> ${pitch.inning} ${pitch.top_bottom}</div>
    <div><b>Count:</b> ${pitch.balls}-${pitch.strikes}</div>
    <div><b>Outs:</b> ${pitch.outs}</div>
    <div><b>Runners:</b> ${pitch.runners_on_base.join(', ') || 'None'}</div>
    <div><b>Result:</b> ${pitch.description}</div>
  `;
}

function animate() {
  requestAnimationFrame(animate);
  const now = clock.getElapsedTime();
  const delta = clock.getDelta();

  if (playing && ball) {
    const { t0, release, velocity, accel, spinRate, spinAxis } = ball.userData;
    const t = now - t0;

    ball.position.x = release.x + velocity.x * t + 0.5 * accel.x * t * t;
    ball.position.y = release.y + velocity.y * t + 0.5 * accel.y * t * t;
    ball.position.z = release.z + velocity.z * t + 0.5 * accel.z * t * t;

    if (showTrail) {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        new THREE.MeshBasicMaterial({ color: pitchColorMap[ball.userData.type] || 0xaaaaaa })
      );
      dot.position.copy(ball.position);
      dot.userData = { type: ball.userData.type };
      scene.add(dot);
      trailDots.push({ mesh: dot, t0: now });
    }

    
    if (ball.position.z <= -60.5 && playing) {
      playing = false;
      document.getElementById('toggleBtn').textContent = 'Play';
    }

    if (spinRate > 0) {
      const angleDelta = (spinRate / 60) * 2 * Math.PI * delta;
      ball.rotateOnAxis(spinAxis, angleDelta);
    }
  }

  trailDots = trailDots.filter(d => {
    if (now - d.t0 > 9.5) {
      scene.remove(d.mesh);
      return false;
    }
    return true;
  });

  renderer.render(scene, camera);
}

function populateSelectors() {
  const batterSel = document.getElementById('batterSelect');
  const dateSel = document.getElementById('dateSelect');
  const pitcherSel = document.getElementById('pitcherSelect');
  const pitchSel = document.getElementById('pitchSelect');

  batterSel.innerHTML = '<option disabled selected value="">-- Select Batter --</option>';
  [...new Set(pitchData.map(p => p.batter))].sort().forEach(b => batterSel.add(new Option(b, b)));

  batterSel.addEventListener('change', () => {
    pitcherSel.innerHTML = '<option disabled selected value="">-- Select Pitcher --</option>';
    pitchSel.innerHTML = '<option disabled selected value="">-- Select Pitch --</option>';

    const selectedBatter = batterSel.value;
    const dates = [...new Set(pitchData.filter(p => p.batter === selectedBatter).map(p => p.game_date))].sort();
    dateSel.innerHTML = '<option disabled selected value="">-- Select Game Date --</option>';
    dates.forEach(d => dateSel.add(new Option(d, d)));
  });

  dateSel.addEventListener('change', () => {
    pitchSel.innerHTML = '<option disabled selected value="">-- Select Pitch --</option>';

    const batter = batterSel.value;
    const date = dateSel.value;
    const filtered = pitchData.filter(p => p.batter === batter && p.game_date === date);
    const pitchers = [...new Set(filtered.map(p => p.pitcher))].sort();
    pitcherSel.innerHTML = '<option disabled selected value="">-- Select Pitcher --</option>';
    pitchers.forEach(p => pitcherSel.add(new Option(p, p)));
  });

  pitcherSel.addEventListener('change', () => {
    pitchSel.innerHTML = '<option disabled selected value="">-- Select Pitch --</option>';
    if (ball) {
      scene.remove(ball);
      ball = null;
    }
    for (const d of trailDots) scene.remove(d.mesh);
    trailDots = [];

    const batter = batterSel.value;
    const date = dateSel.value;
    const pitcher = pitcherSel.value;
    const filtered = pitchData.filter(p =>
      p.batter === batter &&
      p.game_date === date &&
      p.pitcher === pitcher
    );
    pitchSel.innerHTML = '<option disabled selected value="">-- Select Pitch --</option>';
    filtered.forEach((p, i) => {
      const label = `${i + 1}: ${p.balls}-${p.strikes}, ${p.pitch_type}, ${p.description}`;
      pitchSel.add(new Option(label, JSON.stringify(p)));
    });
  });

  pitchSel.addEventListener('change', () => {
    if (ball) {
      scene.remove(ball);
      ball = null;
    }
    for (const d of trailDots) scene.remove(d.mesh);
    trailDots = [];

    const pitch = JSON.parse(pitchSel.value);
    throwPitch(pitch);
  });
}

document.getElementById('trailToggle').addEventListener('change', e => {
  showTrail = e.target.checked;
  if (!showTrail) {
    for (const d of trailDots) scene.remove(d.mesh);
    trailDots = [];
  }
});

document.getElementById('replayBtn').addEventListener('click', () => {
  if (!ball) return;
  ball.userData.t0 = clock.getElapsedTime();
  
  playing = true;
  document.getElementById('toggleBtn').textContent = 'Pause';

  ball.position.set(
    ball.userData.release.x,
    ball.userData.release.y,
    ball.userData.release.z
  );
  for (const d of trailDots) scene.remove(d.mesh);
  trailDots = [];
});

document.getElementById('toggleBtn').addEventListener('click', () => {
  playing = !playing;
  document.getElementById('toggleBtn').textContent = playing ? 'Pause' : 'Play';
});

document.getElementById("cameraSelect").addEventListener("change", (e) => {
  const view = e.target.value;
  switch (view) {
    case "catcher": camera.position.set(0, 2.5, -65); camera.lookAt(0, 2.5, 0); break;
    case "pitcher": camera.position.set(0, 6, 5); camera.lookAt(0, 2, -60.5); break;
    case "rhh": camera.position.set(1, 4, -65); camera.lookAt(0, 1.5, 0); break;
    case "lhh": camera.position.set(-1, 4, -65); camera.lookAt(0, 1.5, 0); break;
    case "1b": camera.position.set(50, 4.5, -30); camera.lookAt(0, 5, -30); break;
    case "3b": camera.position.set(-50, 4.5, -30); camera.lookAt(0, 5, -30); break;
  }
});

(async () => {
  await await setupScene();
pitchData = await loadPitchData();
  populateSelectors();
  
  pitchData = await loadPitchData();
  populateSelectors();
  animate();
})();
