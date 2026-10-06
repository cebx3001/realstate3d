/** Conceptual SVG geography using the existing HUD palette and type families. */
export function initializeMap() {
  const map = document.querySelector('.neighborhood-map');
  const field = map.querySelector('.map-field'), drawing = map.querySelector('.map-drawing');
  const markers = [...map.querySelectorAll('[data-place]')];
  const selection = document.getElementById('map-selection');
  const centers = { all: [500,325], public: [470,345], commerce: [470,250], culture: [700,290], mobility: [260,330], city: [825,300] };
  let zoom = 1, center = [...centers.all], extent = [1000,650], drag;
  function render() {
    // Mobile crops a navigable view instead of shrinking all labels to 3 px.
    extent = innerWidth <= 700 ? [field.clientWidth / .65 / zoom, field.clientHeight / .65 / zoom] : [1000 / zoom,650 / zoom];
    drawing.setAttribute('viewBox', `${center[0]-extent[0]/2} ${center[1]-extent[1]/2} ${extent[0]} ${extent[1]}`);
  }
  function pan(dx, dy = 0) {
    const scale = Math.min(field.clientWidth / extent[0], field.clientHeight / extent[1]);
    center[0] = Math.max(0,Math.min(1000,center[0] - dx / scale));
    center[1] = Math.max(0,Math.min(650,center[1] - dy / scale)); render();
  }
  map.querySelectorAll('[data-map-filter]').forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.mapFilter; center = [...centers[category]];
    map.querySelectorAll('[data-map-filter]').forEach(control => control.setAttribute('aria-pressed', String(control === button)));
    markers.forEach(marker => { marker.dataset.muted = String(category !== 'all' && marker.dataset.place !== category); marker.dataset.selected = 'false'; });
    selection.textContent = category === 'all' ? 'LA CAROLINA / ENTORNO URBANO' : button.textContent;
    render();
  }));
  markers.forEach(marker => {
    marker.setAttribute('tabindex', '0'); marker.setAttribute('role', 'button'); marker.setAttribute('aria-label', marker.dataset.label);
    const select = () => {
      markers.forEach(item => { item.dataset.selected = String(item === marker); });
      selection.textContent = marker.dataset.label.toUpperCase();
    };
    marker.addEventListener('click', select);
    marker.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); } });
  });
  map.querySelectorAll('[data-map-zoom]').forEach(button => button.addEventListener('click', () => {
    zoom = Math.max(1, Math.min(2.5, zoom + Number(button.dataset.mapZoom) * .25)); render();
  }));
  field.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.target.closest('button,[data-place]')) return;
    drag = [event.clientX,event.clientY]; field.setPointerCapture(event.pointerId);
  });
  field.addEventListener('pointermove', event => {
    if (!drag) return;
    pan(event.clientX-drag[0],event.clientY-drag[1]); drag = [event.clientX,event.clientY];
  });
  field.addEventListener('pointerup', () => { drag = null; });
  field.addEventListener('lostpointercapture', () => { drag = null; });
  new ResizeObserver(render).observe(field); render();
  return { pan };
}
