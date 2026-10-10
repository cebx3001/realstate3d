/**
 * Torres del Norte — screen-anchored, head-coupled off-axis camera.
 * Additive to SuperSplat: native camera-manager poses, scene data, controls,
 * transitions and saved annotations are never modified.
 */
export function attachSpatialCamera(viewer) {
  const app = viewer?.global?.app;
  const eye = viewer?.global?.camera;
  const lens = eye?.camera;
  if (!app || !eye || !lens || typeof eye.setPosition !== 'function') {
    console.warn('[TDN spatial] Camera entity unavailable');
    return;
  }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && matchMedia('(pointer: coarse)').matches);
  const originalProjection = lens.calculateProjection;
  const originalOffset = lens.projectionOffset;
  const baseOffsetX = Number.isFinite(originalOffset?.x) ? originalOffset.x : 0;
  const baseOffsetY = Number.isFinite(originalOffset?.y) ? originalOffset.y : 0;
  const target = { x: 0, y: 0, z: 0 };
  const eased = { x: 0, y: 0, z: 0 };
  const position = { x: 0, y: 0, z: 0 };
  const windowPlane = { distance: 1, halfWidth: 1, halfHeight: 1, dx: 0, dy: 0, dz: 0 };
  let active = false;
  let projectionInstalled = false;
  let displaced = false;
  let disposed = false;

  // Every rendered pixel is a ray from the tracked eye through one fixed
  // rectangular window. Objects on the reference plane stay stationary;
  // nearer and farther geometry exhibits depth-dependent motion parallax.
  function offAxisProjection(matrix) {
    const screenDistance = Math.max(0.02, windowPlane.distance - windowPlane.dz);
    const near = Math.max(0.001, Number(lens.nearClip) || 0.01);
    const far = Math.max(near + 1, Number(lens.farClip) || 1000);
    const scale = near / screenDistance;
    const cx = windowPlane.dx;
    const cy = windowPlane.dy;
    const left = (-windowPlane.halfWidth + baseOffsetX * windowPlane.halfWidth - cx) * scale;
    const right = (windowPlane.halfWidth + baseOffsetX * windowPlane.halfWidth - cx) * scale;
    const bottom = (-windowPlane.halfHeight + baseOffsetY * windowPlane.halfHeight - cy) * scale;
    const top = (windowPlane.halfHeight + baseOffsetY * windowPlane.halfHeight - cy) * scale;
    matrix.setFrustum(left, right, bottom, top, near, far);
  }

  function restoreProjection() {
    if (projectionInstalled && lens.calculateProjection === offAxisProjection) {
      lens.calculateProjection = originalProjection;
    }
    projectionInstalled = false;
  }

  function restorePosition() {
    if (!displaced) return;
    eye.setPosition(position.x, position.y, position.z);
    displaced = false;
  }

  function onMessage(event) {
    if (event.origin !== location.origin || event.source !== window.parent) return;
    if (event.data?.scope !== 'tdn:spatial') return;
    active = event.data.active === true;
    for (const axis of ['x', 'y', 'z']) {
      target[axis] = active ? clamp(Number(event.data[axis]) || 0, -1, 1) : 0;
    }
    app.renderNextFrame = true;
  }

  function onUpdate(dt) {
    if (disposed) return;
    // Short output smoothing only; optical One-Euro filter handles jitter.
    const alpha = 1 - Math.exp(-clamp(Number(dt) || 1 / 60, 0, .1) * 25);
    let changing = false;
    for (const axis of ['x', 'y', 'z']) {
      const old = eased[axis];
      eased[axis] += (target[axis] - eased[axis]) * alpha;
      if (!active && Math.abs(eased[axis]) < .0002) eased[axis] = 0;
      if (Math.abs(eased[axis] - old) > .00002) changing = true;
    }
    if (changing) app.renderNextFrame = true;
  }

  function onPrerender() {
    if (disposed || app.xr?.active) return;
    restorePosition(); // Defensive against an interrupted previous render.

    const amount = Math.max(Math.abs(eased.x), Math.abs(eased.y), Math.abs(eased.z));
    if (amount < .0001) {
      restoreProjection();
      return;
    }

    const native = viewer.cameraManager?.camera;
    if (!native?.position || typeof native.calcFocusPoint !== 'function') return;
    const focus = new native.position.constructor();
    native.calcFocusPoint(focus);
    const distance = Math.hypot(
      native.position.x - focus.x,
      native.position.y - focus.y,
      native.position.z - focus.z
    );
    if (!(distance > .01) || !Number.isFinite(distance)) return;

    const aspect = clamp(Number(lens.aspectRatio) ||
      (app.graphicsDevice.width / Math.max(1, app.graphicsDevice.height)), .2, 6);
    const fov = clamp(Number(lens.fov) || 60, 10, 140) * Math.PI / 360;
    const tangent = Math.tan(fov);
    const halfWidth = distance * tangent * (lens.horizontalFov ? 1 : aspect);
    const halfHeight = distance * tangent * (lens.horizontalFov ? 1 / aspect : 1);

    // Virtual eye motion is a fraction of the fixed viewport's physical span.
    // Unlike the previous sensitivity multiplier this is used in the
    // geometric frustum too, so the image is not simply dragged.
    const lateral = mobile ? .43 : .40;
    const vertical = mobile ? .41 : .38;
    windowPlane.distance = distance;
    windowPlane.halfWidth = halfWidth;
    windowPlane.halfHeight = halfHeight;
    windowPlane.dx = halfWidth * lateral * eased.x;
    windowPlane.dy = halfHeight * vertical * eased.y;
    windowPlane.dz = distance * .10 * eased.z;

    const p = eye.getPosition();
    position.x = p.x;
    position.y = p.y;
    position.z = p.z;
    const r = eye.right, u = eye.up, f = eye.forward;
    eye.setPosition(
      p.x + r.x * windowPlane.dx + u.x * windowPlane.dy + f.x * windowPlane.dz,
      p.y + r.y * windowPlane.dx + u.y * windowPlane.dy + f.y * windowPlane.dz,
      p.z + r.z * windowPlane.dx + u.z * windowPlane.dy + f.z * windowPlane.dz
    );
    displaced = true;
    // Reassign even when already installed: the frustum changes with the
    // tracked eyes, native orbit, FOV or viewport aspect ratio each frame.
    lens.calculateProjection = offAxisProjection;
    projectionInstalled = true;
  }

  function onPostrender() {
    restorePosition();
  }

  function dispose() {
    disposed = true;
    window.removeEventListener('message', onMessage);
    app.off('update', onUpdate);
    app.off('prerender', onPrerender);
    app.off('postrender', onPostrender);
    restorePosition();
    restoreProjection();
  }

  window.addEventListener('message', onMessage);
  app.on('update', onUpdate);
  app.on('prerender', onPrerender);
  app.on('postrender', onPostrender);
  window.addEventListener('pagehide', dispose, { once: true });
}
