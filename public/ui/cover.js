import { loadHudEngine } from './supersplat-hud.js';

const states = ['cover', 'technical', 'manifesto'];
const editorial = document.getElementById('editorial');
const technical = document.getElementById('technical-panel');
const manifesto = document.getElementById('manifesto-panel');
const status = document.getElementById('engine-status');
let state = 'cover';
let selectedUnit = '35B';
let viewer;
let engineState = 'loading';
let lang = new URLSearchParams(location.search).get('lang') || localStorage.getItem('tdn-lang') || 'en';
if (!['en', 'es'].includes(lang)) lang = 'en';

function refreshEngineStatus() {
  const labels = {
    en: { loading: '3D ENGINE LOADING', active: '3D ENGINE ACTIVE', error: '3D ENGINE UNAVAILABLE' },
    es: { loading: 'CARGANDO MOTOR 3D', active: 'MOTOR 3D ACTIVO', error: 'MOTOR 3D NO DISPONIBLE' },
  };
  status.textContent = labels[lang][engineState];
}

function setLanguage(next) {
  lang = next;
  document.documentElement.lang = lang;
  localStorage.setItem('tdn-lang', lang);
  document.querySelectorAll('[data-en][data-es]').forEach(el => { el.textContent = el.dataset[lang]; });
  document.getElementById('language-switch').setAttribute('aria-label', lang === 'en' ? 'Cambiar a español' : 'Switch to English');
  refreshEngineStatus();
}

/** Orbit in the scene, never translate the document/canvas or interpolate CSS. */
function applyCameraState() {
  const manager = viewer?.cameraManager;
  if (!manager) return;
  const aspect = innerWidth / innerHeight;
  const portrait = aspect < 1;
  const target = [-1.202680182821469, portrait ? 66 : 82.01817408535366, 2.9718346269194775];
  let position;
  if (portrait) position = [-10.9, 126.4, -90];
  else {
    // Calibrated cover distance for the export's horizontal FOV in landscape.
    const distance = aspect < 1.333 ? 97 : aspect < 1.778
      ? 97 + (aspect - 1.333) / .445 * 38.83 : 76.4047 * aspect;
    const vertical = aspect < 1.778 ? Math.max(0, (1.778 - aspect) / .445 * 10.6) : 0;
    position = [target[0] - .094629484 * distance, target[1] + .424707888 * distance + vertical, target[2] - .9003713 * distance];
  }
  if (state !== 'cover') {
    const angle = 24 * Math.PI / 180;
    const x = position[0] - target[0], z = position[2] - target[2];
    const dx = x * Math.cos(angle) + z * Math.sin(angle);
    const dz = -x * Math.sin(angle) + z * Math.cos(angle);
    position[0] = target[0] + dx;
    position[2] = target[2] + dz;
    // Look right of the building so it occupies the space left of the dossier.
    const offset = portrait ? 25 : 45;
    const length = Math.hypot(dx, dz);
    const right = [-dz / length, 0, dx / length];
    for (let i = 0; i < 3; i++) { target[i] += right[i] * offset; position[i] += right[i] * offset; }
  }
  viewer.global.state.cameraMode = 'orbit';
  viewer.global.state.animationPaused = true;
  const from = manager.camera.position.clone().set(...position);
  const to = manager.camera.position.clone().set(...target);
  manager.camera.look(from, to);
  manager.camera.fov = 98;
  manager.snap();
  viewer.global.app.renderNextFrame = true;
}

function setState(next) {
  if (!states.includes(next) || next === state) return;
  state = next;
  document.body.dataset.state = state;
  editorial.hidden = state === 'cover';
  technical.hidden = state !== 'technical';
  manifesto.hidden = state !== 'manifesto';
  document.querySelectorAll('.panel-nav [data-go]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.go === state)));
  document.querySelectorAll('.hero-hud').forEach(el => { el.inert = state !== 'cover'; });
  applyCameraState();
}

function step(direction) {
  const index = states.indexOf(state);
  setState(states[Math.max(0, Math.min(states.length - 1, index + direction))]);
}

function selectUnit(code) {
  if (!['17A', '35B', '28C'].includes(code)) return;
  selectedUnit = code;
  document.getElementById('unit-stream').textContent = `UNIT ${code} DATA STREAM`;
  document.getElementById('selection-status').textContent = `UNIT ${code} / DATA STREAM`;
  document.querySelectorAll('[data-unit]').forEach(row => {
    row.dataset.selected = String(row.dataset.unit === code);
    row.querySelector('[data-select]').setAttribute('aria-pressed', row.dataset.selected);
  });
}

document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => setState(button.dataset.go)));
document.querySelectorAll('[data-select]').forEach(button => button.addEventListener('click', () => selectUnit(button.dataset.select)));
document.getElementById('language-switch').addEventListener('click', () => setLanguage(lang === 'en' ? 'es' : 'en'));

function canScrollManifesto(target, direction) {
  if (state !== 'manifesto' || !manifesto.contains(target)) return false;
  const remaining = manifesto.scrollHeight - manifesto.clientHeight - manifesto.scrollTop;
  return direction > 0 ? remaining > 1 : manifesto.scrollTop > 1;
}

// A trackpad burst advances exactly one state. The lock releases after the burst,
// not after a CSS animation. Only the manifesto may use a native inner scrollbar.
let wheelMode = null;
let wheelQuiet;
document.addEventListener('wheel', event => {
  if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX) || !event.deltaY) return;
  const direction = Math.sign(event.deltaY);
  clearTimeout(wheelQuiet);
  wheelQuiet = setTimeout(() => { wheelMode = null; }, 180);
  if (!wheelMode && canScrollManifesto(event.target, direction)) wheelMode = 'panel';
  if (wheelMode === 'panel') return;
  event.preventDefault();
  event.stopPropagation();
  if (wheelMode === 'state') return;
  wheelMode = 'state';
  step(direction);
}, { passive: false, capture: true });

let touchOrigin;
let touchMoved = false;
let touchScrolling = false;
document.addEventListener('touchstart', event => {
  if (event.touches.length !== 1) { touchOrigin = undefined; return; }
  touchOrigin = { x: event.touches[0].clientX, y: event.touches[0].clientY, target: event.target };
  touchMoved = false;
  touchScrolling = false;
}, { passive: true });
document.addEventListener('touchmove', event => {
  if (!touchOrigin || event.touches.length !== 1) return;
  const delta = touchOrigin.y - event.touches[0].clientY;
  const dx = touchOrigin.x - event.touches[0].clientX;
  if (!touchMoved && canScrollManifesto(touchOrigin.target, Math.sign(delta))) touchScrolling = true;
  if (touchScrolling) return;
  event.preventDefault();
  event.stopPropagation();
  if (touchMoved || Math.abs(delta) < 24 || Math.abs(delta) <= Math.abs(dx)) return;
  touchMoved = true;
  step(Math.sign(delta));
}, { passive: false, capture: true });
document.addEventListener('touchend', () => { touchOrigin = undefined; }, { passive: true });
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('button,a,input,textarea,select')) return;
  const direction = ['ArrowDown', 'PageDown', ' '].includes(event.key) ? 1 : ['ArrowUp', 'PageUp'].includes(event.key) ? -1 : 0;
  if (event.key === 'Escape') { setState('cover'); return; }
  if (!direction || canScrollManifesto(event.target, direction)) return;
  event.preventDefault();
  step(direction);
});
window.addEventListener('resize', applyCameraState);
setLanguage(lang);

// Read-only diagnostics for comparing the rendered deployment with the reference.
window.__tdnExperience = Object.freeze({
  get state() { return state; }, get unit() { return selectedUnit; }, get engine() { return engineState; },
  get camera() { const c = viewer?.cameraManager?.camera; return c ? { position: [c.position.x,c.position.y,c.position.z], fov: c.fov } : null; },
});

async function startScene() {
  const [{ main }, response] = await Promise.all([
    loadHudEngine(), fetch('viewers/exterior-382a1520/settings.json'),
  ]);
  if (!response.ok) throw new Error(`SuperSplat settings: HTTP ${response.status}`);
  const settings = await response.json();
  settings.background.color = [0, 0, 0, 0];
  viewer = await main(document.getElementById('scene-canvas'), settings, {
    contentUrl: new URL('assets/exterior/382a1520/v1-streamed/lod-meta.json', location.href).href,
    renderer: 'webgl', headless: true, lockedCamera: true, transparent: true,
    noui: true, noanim: true, nofx: true, lang,
  });
  viewer.global.events.on('camera:ready', applyCameraState);
  viewer.global.events.on('firstFrame', () => {
    applyCameraState(); engineState = 'active'; refreshEngineStatus();
  });
  viewer.global.events.on('error', error => { console.error(error); engineState = 'error'; refreshEngineStatus(); });
}
startScene().catch(error => {
  console.error('Torres del Norte: SuperSplat initialization failed', error);
  engineState = 'error'; refreshEngineStatus();
});
