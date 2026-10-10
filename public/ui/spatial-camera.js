/**
 * Torres del Norte — additive spatial camera bridge.
 * Only the rendered eye changes. SuperSplat camera manager, saved poses,
 * annotations, input navigation, transitions and scene data are untouched.
 */
export function attachSpatialCamera(viewer) {
  const app = viewer?.global?.app;
  const eye = viewer?.global?.camera;
  const manager = viewer?.cameraManager;
  const lens = eye?.camera;
  if (!app || !eye || !manager || !lens) {
    console.warn('[TDN spatial] Camera bridge unavailable');
    return;
  }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const projection = lens.projectionOffset;
  const baseOffset = projection && Number.isFinite(projection.x) &&
    Number.isFinite(projection.y) ? [projection.x, projection.y] : null;
  let active = false;
  const target = { x: 0, y: 0, z: 0 };
  const eased = { x: 0, y: 0, z: 0 };
  let adjusted = false;

  function restoreProjection() {
    if (baseOffset && lens.projectionOffset) {
      const current = lens.projectionOffset;
      if (Math.abs(current.x - baseOffset[0]) + Math.abs(current.y - baseOffset[1]) > 0.00001) {
        lens.projectionOffset = new current.constructor(...baseOffset);
      }
    }
  }

  const receive = event => {
    if (event.origin !== location.origin || event.source !== window.parent) return;
    const data = event.data;
    if (data?.scope !== 'tdn:spatial') return;
    active = data.active === true;
    target.x = active ? clamp(Number(data.x) || 0, -1, 1) : 0;
    target.y = active ? clamp(Number(data.y) || 0, -1, 1) : 0;
    target.z = active ? clamp(Number(data.z) || 0, -1, 1) : 0;
    app.renderNextFrame = true;
  };
  window.addEventListener('message', receive);

  // Listener registered AFTER viewer initialization, so native update has
  // already placed the author-approved camera each frame.
  app.on('update', dt => {
    if (app.xr?.active) return;
    const factor = 1 - Math.exp(-clamp(Number(dt) || 1 / 60, 0, 0.1) * 9);
    for (const axis of ['x', 'y', 'z']) {
      eased[axis] += (target[axis] - eased[axis]) * factor;
      if (!active && Math.abs(eased[axis]) < 0.0004) eased[axis] = 0;
    }
    const moving = active || eased.x !== 0 || eased.y !== 0 || eased.z !== 0;
    if (!moving) {
      if (adjusted) {
        restoreProjection();
        adjusted = false;
        app.renderNextFrame = true;
      }
      return;
    }

    const native = manager.camera;
    if (!native?.position || typeof native.calcFocusPoint !== 'function') return;
    const focus = new native.position.constructor();
    native.calcFocusPoint(focus);
    const distance = Math.hypot(
      native.position.x - focus.x,
      native.position.y - focus.y,
      native.position.z - focus.z
    );
    if (!Number.isFinite(distance) || distance < 0.01) return;

    // World-space translation scaled to the scene rather than hardcoded metres.
    const dx = distance * 0.045 * eased.x;
    const dy = distance * 0.035 * eased.y;
    const dz = distance * 0.025 * eased.z;
    const p = eye.getPosition();
    const r = eye.right;
    const u = eye.up;
    const f = eye.forward;
    eye.setPosition(
      p.x + r.x * dx + u.x * dy + f.x * dz,
      p.y + r.y * dx + u.y * dy + f.y * dz,
      p.z + r.z * dx + u.z * dy + f.z * dz
    );

    // Asymmetric lens shift keeps the focal plane visually anchored while
    // nearer and farther splats separate with actual perspective parallax.
    if (baseOffset && lens.projectionOffset) {
      const aspect = Math.max(0.1, eye.camera.aspectRatio ||
        (app.graphicsDevice.width / Math.max(1, app.graphicsDevice.height)));
      const halfAngle = clamp(native.fov || lens.fov, 5, 150) * Math.PI / 360;
      const tanHalf = Math.tan(halfAngle);
      const halfWidth = distance * tanHalf * (lens.horizontalFov ? 1 : aspect);
      const halfHeight = distance * tanHalf * (lens.horizontalFov ? 1 / aspect : 1);
      const offset = lens.projectionOffset;
      lens.projectionOffset = new offset.constructor(
        baseOffset[0] - dx / Math.max(0.01, halfWidth),
        baseOffset[1] - dy / Math.max(0.01, halfHeight)
      );
    }

    adjusted = true;
    app.renderNextFrame = true;
  });

  window.addEventListener('pagehide', () => {
    window.removeEventListener('message', receive);
    restoreProjection();
  }, { once: true });
}
