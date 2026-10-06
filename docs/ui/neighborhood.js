/** Conceptual SVG geography, deliberately using the existing HUD design system. */
export function initializeMap() {
  const map = document.querySelector('.neighborhood-map');
  const markers = [...map.querySelectorAll('[data-place]')];
  const selection = document.getElementById('map-selection');
  map.querySelectorAll('[data-map-filter]').forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.mapFilter;
    map.querySelectorAll('[data-map-filter]').forEach(control => control.setAttribute('aria-pressed', String(control === button)));
    markers.forEach(marker => { marker.dataset.muted = String(category !== 'all' && marker.dataset.place !== category); marker.dataset.selected = 'false'; });
    selection.textContent = category === 'all' ? 'LA CAROLINA / ENTORNO URBANO' : button.textContent;
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
  let zoom = 1;
  map.querySelectorAll('[data-map-zoom]').forEach(button => button.addEventListener('click', () => {
    zoom = Math.max(1, Math.min(2.5, zoom + Number(button.dataset.mapZoom) * .25));
    map.querySelector('.map-geography').style.transform = `scale(${zoom})`;
  }));
}
