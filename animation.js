import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js';

let balls = [];
let trailDots = [];
let clock = new THREE.Clock();
let lastTime = 0;
let playing = true;
let showTrail = false;

const pitchColorMap = {
  FF: 0xff0000, SL: 0x0000ff, CH: 0x008000, KC: 0x4B0082,
  SI: 0xFFA500, CU: 0x800080, FC: 0x808080, ST: 0x008080,
  FS: 0x00CED1, EP: 0xFF69B4, KN: 0xA9A9A9, SC: 0x708090,
  SV: 0x000000, CS: 0xA52A2A, FO: 0xDAA520
};

function createHalfColorMaterial(pitchType) {
  const colorMap = {
    FF: '#FF0000', SL: '#0000FF', CH: '#008000', KC: '#4B0082',
    SI: '#FFA500', CU: '#800080', FC: '#808080', ST: '#008080',
    FS: '#00CED1', EP: '#FF69B4', KN: '#A9A9A9', SC: '#708090',
    SV: '#000000', CS: '#A52A2A', FO: '#DAA520'
  };
  const baseType = pitchType.split(' ')[0];
  const hex = colorMap[baseType] || '#888888';
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
  return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.4, metalness: 0.1 });
}

function getSpinAxisVector(degrees) {
  const radians = THREE.MathUtils.degToRad(degrees);
  return new THREE.Vector3(Math.cos(radians), 0, Math.sin(radians)).normalize();
}

export function loadAndAnimatePitch(pitchData, sceneObjects) {
  const { scene, renderer, camera } = sceneObjects;
  const pitchTypeLabel = pitchData.pitchType || 'UNKNOWN';

  const ballGeo = new THREE.SphereGeometry(0.145, 32, 32);
  const mat = createHalfColorMaterial(pitchTypeLabel);
  const ball = new THREE.Mesh(ballGeo, mat);
  ball.castShadow = true;

  const t0 = clock.getElapsedTime();

  ball.userData = {
    type: pitchTypeLabel,
    t0,
    release: {
      x: -pitchData.release_pos_x,
      y: pitchData.release_pos_z,
      z: -pitchData.release_extension
    },
    velocity: {
      x: -pitchData.vx0,
      y: pitchData.vz0,
      z: pitchData.vy0
    },
    accel: {
      x: -pitchData.ax,
      y: pitchData.az,
      z: pitchData.ay
    },
    spinRate: pitchData.release_spin_rate || 0,
    spinAxis: getSpinAxisVector(pitchData.spin_axis || 0)
  };

  ball.position.set(
    ball.userData.release.x,
    ball.userData.release.y,
    ball.userData.release.z
  );

  scene.add(ball);
  balls.push(ball);
}

export function setTrailVisibility(value) {
  showTrail = value;
  if (!showTrail) {
    for (const d of trailDots) d.mesh?.parent?.remove(d.mesh);
    trailDots = [];
  }
}

export function pauseAnimation() {
  playing = false;
}

export function replayAnimation(pitchData, sceneObjects) {
  const now = clock.getElapsedTime();
  for (let ball of balls) {
    ball.userData.t0 = now;
    ball.position.set(
      ball.userData.release.x,
      ball.userData.release.y,
      ball.userData.release.z
    );
  }
  for (const d of trailDots) sceneObjects.scene.remove(d.mesh);
  trailDots = [];
}

export function clearAllBalls(scene) {
  for (let ball of balls) scene.remove(ball);
  for (let dot of trailDots) scene.remove(dot.mesh);
  balls = [];
  trailDots = [];
}

export function animate(sceneObjects) {
  const { scene, renderer, camera } = sceneObjects;

  requestAnimationFrame(() => animate(sceneObjects));
  const now = clock.getElapsedTime();
  const delta = now - lastTime;
  lastTime = now;

  if (playing) {
    for (let ball of balls) {
      const { t0, release, velocity, accel, spinRate, spinAxis } = ball.userData;
      const t = now - t0;
      const z = release.z + velocity.z * t + 0.5 * accel.z * t * t;
      if (z <= -60.5) continue;
      ball.position.x = release.x + velocity.x * t + 0.5 * accel.x * t * t;
      ball.position.y = release.y + velocity.y * t + 0.5 * accel.y * t * t;
      ball.position.z = z;

      if (showTrail && t % 2 === 0) {
        const baseType = ball.userData.type.split(' ')[0];
        const color = pitchColorMap[baseType] || 0x888888;
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 8, 8),
          new THREE.MeshBasicMaterial({ color })
        );
        dot.position.copy(ball.position);
        scene.add(dot);
        dot.userData = { type: ball.userData.type };
        trailDots.push({ mesh: dot, t0: now });
      }

      if (spinRate > 0) {
        const radPerSec = (spinRate / 60) * 2 * Math.PI;
        const angleDelta = radPerSec * delta;
        ball.rotateOnAxis(spinAxis.clone(), angleDelta);
      }
    }
  }

  const currentTime = clock.getElapsedTime();
  trailDots = trailDots.filter(dotObj => {
    if (currentTime - dotObj.t0 > 9.5) {
      scene.remove(dotObj.mesh);
      return false;
    }
    return true;
  });

  renderer.render(scene, camera);
}
