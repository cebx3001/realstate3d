const UNIT_CODES = ['BUILDING', '17A', '35B', '28C'];
const DRAFT_KEY = 'tdn-unit-settings-v2';

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
  let settings = null;
  let ready = false;
  let renderFailed = false;
  let queuedUnit = null;
  let request = 0;
  let setCollapsed = () => {};

  const say = message => { output.textContent = message; };
  const send = (action, payload = {}) => {
    if (renderFailed) { if (active) say('EL VISOR 3D NO ESTÁ DISPONIBLE EN ESTE NAVEGADOR.'); return false; }
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
    let view = annotation;
    if (code !== 'BUILDING' && innerWidth < innerHeight) {
      const initial = annotation.camera.initial;
      const target = [...annotation.position];
      const scale = 1.22;
      const position = target.map((value, index) => value + (initial.position[index] - value) * scale);
      view = {
        ...annotation,
        camera: { initial: { position, target, fov: Math.min(108, initial.fov + 8) } },
      };
    }
    send('fly-to', { annotation: view });
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
        if (!renderFailed) say('ENCUADRA LA VISTA Y AÑADE UNA ANOTACIÓN.');
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
      ready = true; renderFailed = false;
      if (queuedUnit && settings) { const code = queuedUnit; queuedUnit = null; flyTo(code); }
    } else if (data?.type === 'tdn:render-error' && active) {
      ready = false; renderFailed = true;
      say('EL VISOR 3D NO ESTÁ DISPONIBLE EN ESTE NAVEGADOR.');
    } else if (data?.type === 'tdn:annotation' && active) {
      const { position, camera } = data;
      if (!settings || !validAnnotation({ position, camera: { initial: camera } })) {
        say('NO SE PUDO GUARDAR LA ANOTACIÓN.'); return;
      }
      const code = unitSelect.value;
      const annotation = {
        position: [...position], title: code === 'BUILDING' ? 'Edificio' : `Unit ${code}`, text: '',
        camera: { initial: { position: [...camera.position], target: [...camera.target], fov: camera.fov } },
        extras: { unit: code },
      };
      settings.annotations = settings.annotations.filter(item => unitOf(item) !== code);
      settings.annotations.push(annotation);
      settings.annotations.sort((a, b) => UNIT_CODES.indexOf(unitOf(a)) - UNIT_CODES.indexOf(unitOf(b)));
      persist();
      const count = settings.annotations.filter(item => UNIT_CODES.includes(unitOf(item)) && validAnnotation(item)).length;
      say(`ANOTACIÓN ${code} GUARDADA / ${count} DE 4. DESCARGA settings.json CUANDO TERMINES.`);
      setCollapsed(false);
    } else if (data?.type === 'tdn:bridge-error' && active) {
      say(`ERROR DEL VISOR: ${data.message}`);
    }
  });

  sceneViewer.addEventListener('load', () => { ready = false; });
  load();
  if (active) {
    document.body.dataset.edit = 'true';
    panel.hidden = false;
    const toggle = document.getElementById('editor-collapse');
    setCollapsed = collapsed => {
      panel.classList.toggle('is-collapsed', collapsed);
      toggle.textContent = collapsed ? '[ ABRIR ]' : '[ OCULTAR ]';
      toggle.setAttribute('aria-expanded', String(!collapsed));
      toggle.setAttribute('aria-label', collapsed ? 'Abrir controles de edición' : 'Contraer controles de edición');
    };
    toggle.addEventListener('click', () => setCollapsed(!panel.classList.contains('is-collapsed')));
    setCollapsed(window.matchMedia('(max-width: 700px)').matches);
    document.getElementById('editor-add-annotation').addEventListener('click', () => {
      if (!settings) { say('ESPERANDO CONFIGURACIÓN…'); return; }
      if (send('arm-annotation')) {
        say('SELECCIONA LA UBICACIÓN DE LA ANOTACIÓN EN EL EDIFICIO.');
        setCollapsed(true);
      }
    });
    unitSelect.addEventListener('change', () => {
      say(find(unitSelect.value)
        ? 'ANOTACIÓN GUARDADA. PUEDES ACTUALIZARLA.'
        : 'ENCUADRA LA VISTA Y AÑADE UNA ANOTACIÓN.');
    });
    document.getElementById('editor-export').addEventListener('click', () => {
      if (!settings) { say('ESPERANDO CONFIGURACIÓN…'); return; }
      const blob = new Blob([JSON.stringify(settings, null, 2) + '\n'], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = 'settings.json'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      say(`settings.json DESCARGADO / ${settings.annotations.filter(a => UNIT_CODES.includes(unitOf(a)) && validAnnotation(a)).length} ANOTACIONES`);
    });
    document.getElementById('editor-import').addEventListener('change', async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const imported = JSON.parse(await file.text());
        if (imported.version !== 2 || !Array.isArray(imported.cameras) || !Array.isArray(imported.annotations) ||
            imported.annotations.some(a => UNIT_CODES.includes(unitOf(a)) && !validAnnotation(a))) throw new Error('Formato de SuperSplat inválido.');
        settings = imported; persist();
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
