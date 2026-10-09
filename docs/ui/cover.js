import { initUnitEditor } from './unit-editor.js?v=exact-annotations-1';

const unitsTrigger = document.getElementById('units-trigger');
const UNIT_INFO = Object.freeze({
  '17A': { tower: { en: 'TOWER 1', es: 'TORRE 1' }, area: '120 M²', beds: 3, baths: 2, price: 'USD 127.000', href: 'inventory/?unit=inventory-47&room=living' },
  '35B': { tower: { en: 'TOWER 1', es: 'TORRE 1' }, area: '123 M²', beds: 3, baths: 2, price: 'USD 135.000', href: 'inventory/?unit=inventory-48&room=living' },
  '28C': { tower: { en: 'TOWER 2', es: 'TORRE 2' }, area: '107 M²', beds: 3, baths: 2, price: 'USD 139.000', href: 'inventory/?unit=inventory-50&room=living' },
});
const unitFlyout = document.getElementById('unit-flyout');
const unitFlyoutClose = document.getElementById('unit-flyout-close');
const unitMarker = document.getElementById('unit-annotation-marker');
const unitMarkerCode = document.getElementById('unit-annotation-code');
const unitsMenu = document.getElementById('units-menu');
const audioToggle = document.getElementById('audio-toggle');
const engineStatus = document.getElementById('engine-status');
const loadingPercent = document.getElementById('loading-percent');
const loadingFill = document.getElementById('loading-fill');
let modelProgress = 0;
let audioMuted = false, audioContext = null;
const ensureAudio = () => {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return false;
  if (!audioContext) audioContext = new AudioCtor();
  if (audioContext.state === 'suspended') audioContext.resume();
  return true;
};
const blip = (type = 'tick') => {
  if (audioMuted) return;
  if (!ensureAudio()) return;
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
  if (!unitFlyout.hidden && UNIT_INFO[selectedUnit]) renderUnitFlyout(selectedUnit);
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
function hideUnitFlyout() {
  unitFlyout.hidden = true;
  unitMarker.hidden = true;
}
function positionUnitFlyout(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  unitMarker.hidden = false;
  unitMarker.style.left = x + 'px';
  unitMarker.style.top = y + 'px';
  unitMarkerCode.textContent = '[ ' + selectedUnit + ' ]';
  requestAnimationFrame(() => {
    const margin = 20, topGuard = 86, bottomGuard = 72, gap = 22;
    const w = unitFlyout.offsetWidth || 300, h = unitFlyout.offsetHeight || 130;
    let left, top;
    if (innerWidth <= 700) {
      left = Math.max(margin, Math.min(innerWidth - margin - w, x - w * .5));
      top = y > innerHeight * .54 ? y - h - gap : y + gap;
    } else {
      // Desktop: fixed editorial column at the left, independent of unit marker.
      // Keep the building and monumental lettering clear in the central canvas.
      left = Math.max(margin, Math.min(innerWidth - margin - w, 36));
      top = Math.max(topGuard, (innerHeight - h) * .5);
    }
    left = Math.max(margin, Math.min(innerWidth - margin - w, left));
    top = Math.max(topGuard, Math.min(innerHeight - bottomGuard - h, top));
    unitFlyout.style.left = left + 'px';
    unitFlyout.style.top = top + 'px';
  });
}
function renderUnitFlyout(code) {
  const info = UNIT_INFO[code];
  if (!info) return;
  document.getElementById('unit-flyout-label').textContent = lang === 'es' ? '[ RESIDENCIA DISPONIBLE ]' : '[ AVAILABLE RESIDENCE ]';
  document.getElementById('unit-flyout-name').textContent = code;
  document.getElementById('unit-flyout-tower').textContent = info.tower[lang];
  document.getElementById('unit-flyout-area').textContent = info.area;
  document.getElementById('unit-flyout-beds').textContent = lang === 'es' ? `${info.beds} DORMITORIOS` : `${info.beds} BEDROOMS`;
  document.getElementById('unit-flyout-baths').textContent = lang === 'es' ? `${info.baths} BAÑOS` : `${info.baths} BATHROOMS`;
  document.getElementById('unit-flyout-price').textContent = info.price;
  const link = document.getElementById('unit-flyout-link');
  link.href = info.href;
  document.getElementById('unit-flyout-action').textContent = lang === 'es' ? 'VER INTERIOR' : 'VIEW INTERIOR';
  unitFlyout.hidden = false;
}
function go(destination) {
  if (destination === 'technical') toggleUnits();
  else if (destination === 'cover') {
    closeUnits();
    hideUnitFlyout();
    sceneViewer?.contentWindow?.postMessage({ scope: 'tdn:viewer', action: 'clear-annotation' }, location.origin);
    unitEditor?.flyTo('BUILDING');
  }
}
function selectUnit(code) {
  if (!UNIT_INFO[code]) return;
  selectedUnit = code;
  document.getElementById('unit-stream').textContent = `UNIT ${code} DATA STREAM`;
  document.querySelectorAll('.units-menu [data-select]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.select === code));
  });
  closeUnits();
  hideUnitFlyout();
  blip('whoosh');
  unitEditor?.flyTo(code);
}
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => go(button.dataset.go)));
unitsTrigger.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); toggleUnits(); });
unitsTrigger.addEventListener('pointerdown', event => event.stopPropagation());
unitsMenu.addEventListener('pointerdown', event => event.stopPropagation());
document.querySelectorAll('.units-menu [data-select]').forEach(button => button.addEventListener('click', event => {
  event.preventDefault(); event.stopPropagation(); selectUnit(button.dataset.select);
}));
unitFlyoutClose.addEventListener('click', hideUnitFlyout);
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
  url.searchParams.set('bridge', 'anchored-units-vignette-1');
  url.searchParams.set('revision', 'mcmc-ready-height-20261009-5');
  url.searchParams.set('content', new URL('assets/exterior/382a1520/v1-streamed/lod-meta.json', location.href).href);
  url.searchParams.set('budget', '0.75');
  // The crystallization transition is part of the standard cover, not an opt-in preview.
  url.searchParams.set('effect', 'mcmc');
  url.searchParams.set('webgl', '');
  url.searchParams.set('cam', camera);
  url.searchParams.set('bg', '0.0588,0.08235,0.12157');
  url.searchParams.set('lang', lang);
  for (const flag of ['noui', 'nofx', 'transparent']) url.searchParams.set(flag, '');
  return url.href;
}
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== sceneViewer.contentWindow) return;
  if (event.data?.type === 'tdn:annotation-screen') {
    if (event.data.unit !== selectedUnit) return;
    if (event.data.hidden) { hideUnitFlyout(); return; }
    renderUnitFlyout(selectedUnit);
    positionUnitFlyout(Number(event.data.x), Number(event.data.y));
  } else if (event.data?.type === 'tdn:progress') {
    modelProgress = Number(event.data.progress) || 0;
    if (engineState === 'loading') refreshEngineStatus();
  } else if (event.data?.type === 'tdn:first-useful-frame') {
    modelProgress = 100; engineState = 'active'; refreshEngineStatus();
    if (audioContext) blip('tick');
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
