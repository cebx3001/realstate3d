import { initUnitEditor } from './unit-editor.js?v=annotation-single-1';

const unitsTrigger = document.getElementById('units-trigger');
const unitsMenu = document.getElementById('units-menu');
const audioToggle = document.getElementById('audio-toggle');
const engineStatus = document.getElementById('engine-status');
const loadingPercent = document.getElementById('loading-percent');
const loadingFill = document.getElementById('loading-fill');
let modelProgress = 0;
let audioMuted = false, audioContext = null;
const ensureAudio = () => {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') audioContext.resume();
};
const blip = (type = 'tick') => {
  if (audioMuted) return;
  ensureAudio();
  const ctx = audioContext, osc = ctx.createOscillator(), gain = ctx.createGain(), now = ctx.currentTime, whoosh = type === 'whoosh';
  osc.type = whoosh ? 'sine' : 'triangle';
  osc.frequency.setValueAtTime(whoosh ? 180 : 760, now);
  osc.frequency.exponentialRampToValueAtTime(whoosh ? 92 : 520, now + (whoosh ? .28 : .055));
  gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(whoosh ? .075 : .038, now + .012); gain.gain.exponentialRampToValueAtTime(.0001, now + (whoosh ? .32 : .075));
  osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + (whoosh ? .34 : .08));
};
let selectedUnit = '35B', engineState = 'loading';
let unitEditor;
let lang = new URLSearchParams(location.search).get('lang') || localStorage.getItem('tdn-lang') || 'en';
if (!['en', 'es'].includes(lang)) lang = 'en';

function refreshEngineStatus() {
  const labels = {
    en: { loading: 'LOADING MODEL', active: 'MODEL READY', error: 'MODEL UNAVAILABLE' },
    es: { loading: 'CARGANDO MODELO', active: 'MODELO LISTO', error: 'MODELO NO DISPONIBLE' },
  };
  engineStatus.textContent = labels[lang][engineState];
  document.body.dataset.engine = engineState;
  const shown = engineState === 'active' ? 100 : Math.max(0, Math.min(100, Math.round(modelProgress)));
  loadingPercent.textContent = String(shown).padStart(3, '0') + '%';
  loadingFill.style.width = shown + '%';
}
function setLanguage(next) {
  lang = next; document.documentElement.lang = lang; localStorage.setItem('tdn-lang', lang);
  document.querySelectorAll('[data-en][data-es]').forEach(el => { el.textContent = el.dataset[lang]; });
  document.getElementById('language-switch').setAttribute('aria-label', lang === 'en' ? 'Cambiar a español' : 'Switch to English');
  refreshEngineStatus();
}

// The cover pose is independent of category state. Public camera input is locked in CSS;
// ?edit=true restores native SuperSplat camera interaction to capture annotations.
function coverPose() {
  const aspect = innerWidth / innerHeight, portrait = aspect < 1;
  const target = [-1.202680182821469, portrait ? 66 : 82.01817408535366, 2.9718346269194775];
  let position;
  if (portrait) position = [-10.9, 126.4, -90];
  else {
    const distance = aspect < 1.333 ? 97 : aspect < 1.778
      ? 97 + (aspect - 1.333) / .445 * 38.83 : 76.4047 * aspect;
    const vertical = aspect < 1.778 ? Math.max(0, (1.778 - aspect) / .445 * 10.6) : 0;
    position = [target[0] - .094629484 * distance, target[1] + .424707888 * distance + vertical, target[2] - .9003713 * distance];
  }
  return { position, target };
}
function closeUnits() {
  unitsMenu.hidden = true;
  unitsTrigger.setAttribute('aria-expanded', 'false');
  document.body.dataset.units = 'closed';
}
function toggleUnits(force) {
  const open = typeof force === 'boolean' ? force : unitsMenu.hidden;
  unitsMenu.hidden = !open;
  unitsTrigger.setAttribute('aria-expanded', String(open));
  document.body.dataset.units = open ? 'open' : 'closed';
  if (open) blip('tick');
}
function go(destination) {
  if (destination === 'technical') toggleUnits();
  else if (destination === 'cover') closeUnits();
}
function selectUnit(code) {
  if (!['17A', '35B', '28C'].includes(code)) return;
  selectedUnit = code;
  document.getElementById('unit-stream').textContent = `UNIT ${code} DATA STREAM`;
  document.querySelectorAll('.units-menu [data-select]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.select === code));
  });
  closeUnits();
  unitEditor?.flyTo(code);
}
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => go(button.dataset.go)));
unitsTrigger.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); toggleUnits(); });
document.querySelectorAll('.units-menu [data-select]').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); selectUnit(button.dataset.select); }));
document.addEventListener('pointerdown', event => { if (!unitsMenu.hidden && !event.target.closest('.units-nav')) closeUnits(); });
document.getElementById('language-switch').addEventListener('click', () => setLanguage(lang === 'en' ? 'es' : 'en'));
audioToggle?.addEventListener('click', () => {
  audioMuted = !audioMuted;
  audioToggle.setAttribute('aria-pressed', String(!audioMuted));
  audioToggle.textContent = audioMuted ? '[ MUTE ]' : '[ AUDIO ]';
  if (!audioMuted) blip('tick');
});
document.querySelectorAll('button,a').forEach(control => control.addEventListener('pointerdown', () => {
  if (control === unitsTrigger || control === audioToggle) return;
  blip(control.dataset.go ? 'whoosh' : 'tick');
}));
window.addEventListener('pointerdown', ensureAudio, { once: true });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !unitsMenu.hidden) closeUnits();
});
setLanguage(lang); closeUnits();
window.__tdnExperience = Object.freeze({
  get state() { return !unitsMenu.hidden ? 'technical' : 'cover'; },
  get unit() { return selectedUnit; }, get engine() { return engineState; },
  get camera() { return { position: coverPose().position, fov: 98 }; },
});

const sceneViewer = document.getElementById('scene-viewer');
unitEditor = initUnitEditor(sceneViewer);
function viewerUrl() {
  const { position, target } = coverPose();
  const camera = [...position, ...target, 98].map(value => value.toFixed(4)).join(',');
  const url = new URL('viewers/exterior-382a1520/index.html', location.href);
  url.searchParams.set('bridge', 'transparent-clear-1');
  url.searchParams.set('content', new URL('assets/exterior/382a1520/v1-streamed/lod-meta.json', location.href).href);
  url.searchParams.set('cam', camera);
  url.searchParams.set('bg', '0.0588,0.08235,0.12157');
  url.searchParams.set('lang', lang);
  for (const flag of ['noui', 'nofx', 'transparent']) url.searchParams.set(flag, '');
  return url.href;
}
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== sceneViewer.contentWindow) return;
  if (event.data?.type === 'tdn:progress') {
    modelProgress = Number(event.data.progress) || 0;
    if (engineState === 'loading') refreshEngineStatus();
  } else if (event.data?.type === 'tdn:first-useful-frame') {
    modelProgress = 100; engineState = 'active'; refreshEngineStatus();
  } else if (event.data?.type === 'tdn:render-error') {
    engineState = 'error'; refreshEngineStatus();
  }
});
sceneViewer.addEventListener('error', () => { engineState = 'error'; refreshEngineStatus(); });
sceneViewer.src = viewerUrl();
let lastOrientation = innerWidth < innerHeight ? 'portrait' : 'landscape';
window.addEventListener('resize', () => {
  const orientation = innerWidth < innerHeight ? 'portrait' : 'landscape';
  if (orientation === lastOrientation) return;
  lastOrientation = orientation;
  modelProgress = 0; engineState = 'loading'; refreshEngineStatus();
  sceneViewer.src = viewerUrl();
});
