import { categories } from './environment-data.js';

const editorial = document.getElementById('editorial');
const neighborhood = document.getElementById('environment-lower-third');
const trigger = document.querySelector('.environment-access');
const status = document.getElementById('engine-status');
const number = document.getElementById('environment-number');
const items = document.getElementById('environment-items');
const summary = document.getElementById('environment-summary');
const picker = document.getElementById('environment-mobile-select');
let selectedUnit = '35B', selectedCategory = 2, engineState = 'loading';
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

// The cover pose is independent of category state. User drag is the only orbit input.
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
function selectCategory(index) {
  selectedCategory = (index + categories.length) % categories.length;
  const category = categories[selectedCategory];
  number.textContent = `${category.code} / ${category.title}`;
  items.replaceChildren(...category.items.map(value => {
    const item = document.createElement('li'); item.textContent = value; return item;
  }));
  summary.textContent = category.summary;
  picker.value = category.key;
  neighborhood.querySelectorAll('[data-category]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.category === category.key));
  });
}
function closeNeighborhood() {
  neighborhood.hidden = true; document.body.dataset.neighborhood = 'closed'; trigger.setAttribute('aria-expanded', 'false');
}
function openNeighborhood() {
  editorial.hidden = true; document.body.dataset.units = 'closed';
  selectCategory(selectedCategory);
  neighborhood.hidden = false; document.body.dataset.neighborhood = 'open'; trigger.setAttribute('aria-expanded', 'true');
}
function go(destination) {
  if (destination === 'technical') {
    closeNeighborhood(); editorial.hidden = false; document.body.dataset.units = 'open';
    document.querySelector('.panel-nav [data-go="technical"]').setAttribute('aria-pressed', 'true');
  } else if (destination === 'neighborhood' || destination === 'manifesto') {
    if (destination === 'neighborhood' && !neighborhood.hidden) closeNeighborhood();
    else openNeighborhood();
  } else if (destination === 'close-neighborhood') closeNeighborhood();
  else if (destination === 'cover') {
    editorial.hidden = true; document.body.dataset.units = 'closed'; closeNeighborhood();
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
document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => selectCategory(categories.findIndex(category => category.key === button.dataset.category))));
document.querySelectorAll('[data-category-step]').forEach(button => button.addEventListener('click', () => selectCategory(selectedCategory + Number(button.dataset.categoryStep))));
picker.addEventListener('change', () => selectCategory(categories.findIndex(category => category.key === picker.value)));
document.getElementById('language-switch').addEventListener('click', () => setLanguage(lang === 'en' ? 'es' : 'en'));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (!neighborhood.hidden) closeNeighborhood();
    else if (!editorial.hidden) go('cover');
  }
});
setLanguage(lang); selectCategory(selectedCategory); closeNeighborhood();
window.__tdnExperience = Object.freeze({
  get state() { return !editorial.hidden ? 'technical' : !neighborhood.hidden ? 'neighborhood' : 'cover'; },
  get category() { return categories[selectedCategory].key; }, get unit() { return selectedUnit; }, get engine() { return engineState; },
  get camera() { return { position: coverPose().position, fov: 98 }; },
});

const sceneViewer = document.getElementById('scene-viewer');
function viewerUrl() {
  const { position, target } = coverPose();
  const camera = [...position, ...target, 98].map(value => value.toFixed(4)).join(',');
  const url = new URL('viewers/exterior-382a1520/index.html', location.href);
  url.searchParams.set('content', new URL('assets/exterior/382a1520/v1-streamed/lod-meta.json', location.href).href);
  url.searchParams.set('cam', camera);
  url.searchParams.set('bg', '0.0588,0.08235,0.12157');
  url.searchParams.set('lang', lang);
  for (const flag of ['noui', 'nofx', 'noanim', 'transparent']) url.searchParams.set(flag, '');
  return url.href;
}
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== sceneViewer.contentWindow) return;
  if (event.data?.type === 'tdn:first-useful-frame') {
    engineState = 'active'; refreshEngineStatus();
  }
});
sceneViewer.addEventListener('error', () => { engineState = 'error'; refreshEngineStatus(); });
sceneViewer.src = viewerUrl();
let lastOrientation = innerWidth < innerHeight ? 'portrait' : 'landscape';
window.addEventListener('resize', () => {
  const orientation = innerWidth < innerHeight ? 'portrait' : 'landscape';
  if (orientation === lastOrientation) return;
  lastOrientation = orientation;
  engineState = 'loading'; refreshEngineStatus();
  sceneViewer.src = viewerUrl();
});
