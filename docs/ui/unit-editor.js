const UNIT_CODES = ['17A', '35B', '28C'];
const DRAFT_KEY = 'tdn-unit-settings-v1';

const finiteVec = value => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
const validAnnotation = value =>
  value && finiteVec(value.position) && finiteVec(value.camera?.initial?.position) &&
  finiteVec(value.camera?.initial?.target) && Number.isFinite(value.camera?.initial?.fov) &&
  value.camera.initial.fov > 0 && value.camera.initial.fov < 180;
const unitOf = annotation => annotation?.extras?.unit;

export function initUnitEditor(sceneViewer) {
  const active = new URLSearchParams(location.search).get('edit') === 'true';
  const panel = document.getElementById('unit-editor');
  const unitSelect = document.getElementById('editor-unit');
  const output = document.getElementById('editor-status');
  const marker = document.createElement('i');
  marker.className = 'point-marker';
  marker.hidden = true;
  marker.setAttribute('aria-hidden', 'true');
  document.querySelector('.scene').append(marker);
  let settings = null;
  let point = null;
  let ready = false;
  let queuedUnit = null;
  let request = 0;
  let pendingCapture = null;

  const say = message => { output.textContent = message; };
  const send = (action, payload = {}) => {
    if (!ready) { if (active) say('ESPERANDO VISOR SUPER SPLAT…'); return false; }
    sceneViewer.contentWindow.postMessage({ scope: 'tdn:viewer', action, requestId: ++request, ...payload }, location.origin);
    return request;
  };
  const find = code => settings?.annotations?.find(annotation => unitOf(annotation) === code && validAnnotation(annotation));
  const persist = () => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(settings)); }
    catch { say('ALMACENAMIENTO LOCAL NO DISPONIBLE. DESCARGA EL JSON.'); }
  };
  const flyTo = code => {
    if (!UNIT_CODES.includes(code)) return;
    if (!settings) { queuedUnit = code; return; }
    const annotation = find(code);
    if (!annotation) {
      if (active) say(`UNIT ${code} / SIN VISTA GUARDADA`);
      return;
    }
    if (!ready) { queuedUnit = code; return; }
    send('fly-to', { annotation });
  };
  const load = async () => {
    try {
      const response = await fetch(new URL('settings.json', location.href), { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      settings = await response.json();
      if (settings.version !== 2 || !Array.isArray(settings.annotations) || !Array.isArray(settings.cameras)) {
        throw new Error('settings.json no tiene el formato nativo esperado.');
      }
      if (active) {
        try {
          const draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
          if (draft?.version === 2 && Array.isArray(draft.annotations)) settings = draft;
        } catch { /* Invalid local draft: retain published file. */ }
        say('ENCUADRA LA UNIDAD Y MARCA UN PUNTO EN LA ESCENA.');
      }
      if (queuedUnit) { const code = queuedUnit; queuedUnit = null; flyTo(code); }
    } catch (error) {
      if (active) say(`ERROR: ${error.message}`);
    }
  };

  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== sceneViewer.contentWindow) return;
    const data = event.data;
    if (data?.type === 'tdn:viewer-ready') {
      ready = true;
      if (queuedUnit && settings) { const code = queuedUnit; queuedUnit = null; flyTo(code); }
    } else if (data?.type === 'tdn:render-error' && active) {
      ready = false;
      say('EL VISOR 3D NO ESTÁ DISPONIBLE EN ESTE NAVEGADOR.');
    } else if (data?.type === 'tdn:point' && active) {
      if (!finiteVec(data.position)) return;
      point = data.position;
      marker.hidden = false;
      marker.style.left = `${data.screen?.x * 100 || 0}%`;
      marker.style.top = `${data.screen?.y * 100 || 0}%`;
      say(`PUNTO 3D: ${point.map(v => v.toFixed(3)).join(' / ')}. CAPTURA LA VISTA.`);
    } else if (data?.type === 'tdn:camera' && active && pendingCapture === data.requestId) {
      pendingCapture = null;
      const camera = data.camera;
      if (!point || !validAnnotation({ position: point, camera: { initial: camera } })) {
        say('CÁMARA O PUNTO 3D INVÁLIDO.'); return;
      }
      const code = unitSelect.value;
      const annotation = {
        position: [...point], title: `Unit ${code}`, text: '',
        camera: { initial: { position: [...camera.position], target: [...camera.target], fov: camera.fov } },
        extras: { unit: code },
      };
      settings.annotations = settings.annotations.filter(item => unitOf(item) !== code);
      settings.annotations.push(annotation);
      settings.annotations.sort((a, b) => UNIT_CODES.indexOf(unitOf(a)) - UNIT_CODES.indexOf(unitOf(b)));
      persist();
      say(`UNIT ${code} / VISTA GUARDADA EN ESTE NAVEGADOR. DESCARGA settings.json.`);
    } else if (data?.type === 'tdn:bridge-error' && active) {
      pendingCapture = null;
      say(`ERROR DEL VISOR: ${data.message}`);
    }
  });

  sceneViewer.addEventListener('load', () => { ready = false; });
  load();
  if (active) {
    document.body.dataset.edit = 'true';
    panel.hidden = false;
    document.getElementById('editor-mark').addEventListener('click', () => {
      point = null; marker.hidden = true;
      if (send('arm-point')) say('HAZ UN CLIC SOBRE LA SUPERFICIE DE LA TORRE.');
    });
    document.getElementById('editor-capture').addEventListener('click', () => {
      if (!settings) { say('ESPERANDO CONFIGURACIÓN…'); return; }
      if (!point) { say('MARCA PRIMERO EL PUNTO 3D EN LA ESCENA.'); return; }
      pendingCapture = send('camera') || null;
      if (pendingCapture) say('CAPTURANDO POSICIÓN, TARGET Y FOV…');
    });
    unitSelect.addEventListener('change', () => {
      point = null; marker.hidden = true;
      say(find(unitSelect.value) ? 'VISTA GUARDADA. PUEDES REEMPLAZARLA.' : 'ENCUADRA Y MARCA UN PUNTO.');
    });
    document.getElementById('editor-export').addEventListener('click', () => {
      if (!settings) { say('ESPERANDO CONFIGURACIÓN…'); return; }
      const blob = new Blob([JSON.stringify(settings, null, 2) + '\n'], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = 'settings.json'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      say(`settings.json DESCARGADO / ${settings.annotations.filter(a => UNIT_CODES.includes(unitOf(a)) && validAnnotation(a)).length} UNIDADES`);
    });
    document.getElementById('editor-import').addEventListener('change', async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const imported = JSON.parse(await file.text());
        if (imported.version !== 2 || !Array.isArray(imported.cameras) || !Array.isArray(imported.annotations) ||
            imported.annotations.some(a => UNIT_CODES.includes(unitOf(a)) && !validAnnotation(a))) throw new Error('Formato de SuperSplat inválido.');
        settings = imported; point = null; marker.hidden = true; persist();
        say('settings.json IMPORTADO. LISTO PARA CONTINUAR.');
      } catch (error) { say(`ERROR AL IMPORTAR: ${error.message}`); }
      event.target.value = '';
    });
    document.getElementById('editor-close').addEventListener('click', () => {
      const url = new URL(location.href); url.searchParams.delete('edit'); location.assign(url.href);
    });
  }

  return { flyTo };
}
