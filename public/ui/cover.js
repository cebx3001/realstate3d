import { loadHudEngine } from './supersplat-hud.js';
import { cameraPose, clamp } from './scroll-model.mjs';
import { createNarrative } from './narrative.js';
import { initializeMap } from './neighborhood.js';

const editorial = document.getElementById('editorial');
const status = document.getElementById('engine-status');
let selectedUnit = '35B', viewer, narrative;
let engineState = 'loading', progress = 0, manualOrbit = 0;
let lang = new URLSearchParams(location.search).get('lang') || localStorage.getItem('tdn-lang') || 'en';
if (!['en', 'es'].includes(lang)) lang = 'en';
function refreshEngineStatus() {
  const labels = {
    en: { loading: '3D ENGINE LOADING', active: '3D ENGINE ACTIVE', error: '3D ENGINE UNAVAILABLE' },
    es: { loading: 'CARGANDO MOTOR 3D', active: 'MOTOR 3D ACTIVO', error: 'MOTOR 3D NO DISPONIBLE' },
  };
  status.textContent = labels[lang][engineState];
  document.body.dataset.engine = engineState;
}
function setLanguage(next) {
  lang = next; document.documentElement.lang = lang; localStorage.setItem('tdn-lang', lang);
  document.querySelectorAll('[data-en][data-es]').forEach(el => { el.textContent = el.dataset[lang]; });
  document.getElementById('language-switch').setAttribute('aria-label', lang === 'en' ? 'Cambiar a español' : 'Switch to English');
  refreshEngineStatus();
}
/** Only the existing SuperSplat camera API moves the Gaussian. */
function applyCameraState() {
  const manager = viewer?.cameraManager;
  if (!manager) return;
  const pose = cameraPose(innerWidth, innerHeight, progress, manualOrbit);
  viewer.global.state.cameraMode = 'orbit'; viewer.global.state.animationPaused = true;
  manager.camera.look(manager.camera.position.clone().set(...pose.position), manager.camera.position.clone().set(...pose.target));
  manager.camera.fov = pose.fov; manager.snap(); viewer.global.app.renderNextFrame = true;
}
function closeUnits() { editorial.hidden = true; document.body.dataset.units = 'closed'; }
function go(destination) {
  if (destination === 'technical') {
    editorial.hidden = false; document.body.dataset.units = 'open';
    document.querySelector('.panel-nav [data-go="technical"]').setAttribute('aria-pressed', 'true');
  } else {
    closeUnits();
    if (destination === 'cover') { manualOrbit = 0; narrative?.seek(0); }
    else if (destination === 'manifesto') narrative?.seek(.065);
    else if (destination === 'map') narrative?.seek(1);
  }
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
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => go(button.dataset.go)));
document.querySelectorAll('[data-select]').forEach(button => button.addEventListener('click', () => selectUnit(button.dataset.select)));
document.getElementById('language-switch').addEventListener('click', () => setLanguage(lang === 'en' ? 'es' : 'en'));
document.addEventListener('keydown', event => { if (event.key === 'Escape') { if (!editorial.hidden) closeUnits(); else go('cover'); } });
setLanguage(lang);
initializeMap();
window.__tdnExperience = Object.freeze({
  get state() { return !editorial.hidden ? 'technical' : document.body.dataset.narrative || 'cover'; },
  get progress() { return progress; }, get unit() { return selectedUnit; }, get engine() { return engineState; },
  get camera() { const c = viewer?.cameraManager?.camera; return c ? { position: [c.position.x,c.position.y,c.position.z], fov: c.fov } : null; },
  // Also used by the separate, visible viewport QA fixture; no automatic playback.
  seek(value) { if (Number.isFinite(value)) { closeUnits(); narrative?.seek(clamp(value)); } },
});
createNarrative({
  onProgress(value) { progress = value; applyCameraState(); },
  onOrbit(delta) { manualOrbit = clamp(manualOrbit + delta, -35, 35); applyCameraState(); },
  isModalOpen: () => !editorial.hidden,
}).then(value => { narrative = value; }).catch(error => console.error('Torres del Norte: narrative initialization failed', error));

async function startScene() {
  const canvas = document.getElementById('scene-canvas');
  canvas.addEventListener('webglcontextcreationerror', event => {
    console.error('Torres del Norte: graphics context creation failed:', event.statusMessage || 'No platform details');
  });
  const [{ main }, response] = await Promise.all([
    loadHudEngine(), fetch('viewers/exterior-382a1520/settings.json'),
  ]);
  if (!response.ok) throw new Error(`SuperSplat settings: HTTP ${response.status}`);
  const settings = await response.json();
  settings.background.color = [0, 0, 0, 0];
  viewer = await main(canvas, settings, {
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
