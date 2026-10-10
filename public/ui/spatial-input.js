/**
 * Torres del Norte — optional head tracking (desktop) / tilt parallax (mobile).
 * All sensors start with explicit user interaction. Camera frames remain local.
 */
const frame = document.querySelector('#scene-viewer, #viewer');
if (frame) {
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && matchMedia('(pointer: coarse)').matches);
  const label = mobile ? 'TILT' : 'HEAD';
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'tdn-spatial-toggle';
  button.textContent = '[ ' + label + ' VIEW ]';
  button.title = mobile ? 'Activar perspectiva al inclinar el teléfono' :
    'Activar seguimiento de cabeza mediante webcam';
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-label', button.title);

  const css = document.createElement('style');
  css.textContent = `
    #tdn-spatial-toggle {
      position: fixed; z-index: 52; top: 92px; right: 24px;
      pointer-events: auto; cursor: pointer;
      background: rgba(15,21,31,.58); color: #e9e8e2;
      border: 1px solid rgba(210,177,107,.52); border-radius: 0;
      padding: 11px 13px; font: 10px "JetBrains Mono", monospace;
      letter-spacing: .065em; line-height: 1.2; white-space: nowrap;
      backdrop-filter: blur(3px);
    }
    #tdn-spatial-toggle[aria-pressed="true"] {
      color: #D2B16B; border-color: #D2B16B;
    }
    #tdn-spatial-toggle:focus-visible { outline: 2px solid #D2B16B; outline-offset: 3px; }
    @media(max-width:700px) {
      #tdn-spatial-toggle { top: 64px; right: 16px; padding: 9px 10px; font-size: 9px; }
    }
  `;
  document.head.append(css);
  document.body.append(button);

  let enabled = false;
  let starting = false;
  let stream = null;
  let video = null;
  let landmarker = null;
  let raf = 0;
  let lastInference = 0;
  let neutralFace = null;
  let neutralTilt = null;
  let lastSample = { x: 0, y: 0, z: 0 };
  let sensorTimeout = 0;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const angleDelta = (a, b) => ((a - b + 540) % 360) - 180;

  function broadcast(data = lastSample, state = enabled) {
    frame.contentWindow?.postMessage({
      scope: 'tdn:spatial', active: state,
      x: data.x, y: data.y, z: data.z
    }, location.origin);
  }

  function updateButton() {
    button.disabled = starting;
    button.setAttribute('aria-pressed', String(enabled));
    button.textContent = starting ? '[ LOADING ]' : enabled ?
      '[ ' + label + ' ON ]' : '[ ' + label + ' VIEW ]';
  }

  function stop() {
    enabled = false;
    starting = false;
    clearTimeout(sensorTimeout);
    window.removeEventListener('deviceorientation', onOrientation);
    cancelAnimationFrame(raf);
    raf = 0;
    neutralFace = null;
    neutralTilt = null;
    lastSample = { x: 0, y: 0, z: 0 };
    landmarker?.close?.();
    landmarker = null;
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
    if (video) { video.pause(); video.srcObject = null; video.remove(); video = null; }
    broadcast(lastSample, false);
    updateButton();
  }

  function fail(message) {
    stop();
    console.warn('[TDN spatial]', message);
    button.textContent = '[ UNAVAILABLE ]';
    button.title = String(message);
  }

  function onOrientation(event) {
    if (!enabled || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
    if (!neutralTilt) neutralTilt = { beta: event.beta, gamma: event.gamma };
    clearTimeout(sensorTimeout);
    const portrait = Math.abs(screen.orientation?.angle || window.orientation || 0) % 180 === 0;
    let horizontal = portrait ? event.gamma - neutralTilt.gamma :
      angleDelta(event.beta, neutralTilt.beta);
    let vertical = portrait ? angleDelta(event.beta, neutralTilt.beta) :
      event.gamma - neutralTilt.gamma;
    const orientation = screen.orientation?.angle || window.orientation || 0;
    if (!portrait && (orientation === -90 || orientation === 270)) horizontal = -horizontal;
    lastSample = {
      x: clamp(horizontal / 18, -1, 1),
      y: clamp(-vertical / 18, -1, 1),
      z: 0
    };
    broadcast();
  }

  async function startTilt() {
    if (!('DeviceOrientationEvent' in window)) throw new Error('Sin sensores de orientación');
    // This permission must originate directly from the button's user gesture.
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const result = await DeviceOrientationEvent.requestPermission();
      if (result !== 'granted') throw new Error('Permiso de movimiento denegado');
    }
    enabled = true;
    window.addEventListener('deviceorientation', onOrientation);
    sensorTimeout = setTimeout(() => {
      if (enabled && !neutralTilt) fail('No hay datos del giroscopio');
    }, 3000);
  }

  async function startHead() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Webcam no disponible');
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
    });
    video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.style.display = 'none';
    video.srcObject = stream;
    document.body.append(video);
    await video.play();

    const { FaceLandmarker, FilesetResolver } = await import(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm'
    );
    const wasm = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm'
    );
    landmarker = await FaceLandmarker.createFromOptions(wasm, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'CPU'
      },
      runningMode: 'VIDEO',
      numFaces: 1
    });
    enabled = true;
    const render = now => {
      if (!enabled || !video || !landmarker) return;
      if (video.readyState >= 2 && now - lastInference > 90) {
        lastInference = now;
        try {
          const points = landmarker.detectForVideo(video, now).faceLandmarks?.[0];
          if (points) {
            const a = points[33], b = points[263];
            const cx = (a.x + b.x) * 0.5;
            const cy = (a.y + b.y) * 0.5;
            const width = Math.max(0.01, Math.hypot(a.x - b.x, a.y - b.y));
            if (!neutralFace) neutralFace = { cx, cy, width };
            lastSample = {
              x: clamp(-(cx - neutralFace.cx) / 0.16, -1, 1),
              y: clamp(-(cy - neutralFace.cy) / 0.14, -1, 1),
              z: clamp((width / neutralFace.width - 1) / 0.35, -1, 1)
            };
          } else {
            lastSample = { x: 0, y: 0, z: 0 };
            neutralFace = null;
          }
          broadcast();
        } catch (error) {
          console.warn('[TDN spatial] Tracking frame error', error);
        }
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
  }

  button.addEventListener('click', async () => {
    if (starting) return;
    if (enabled) { stop(); return; }
    starting = true;
    updateButton();
    try {
      if (mobile) await startTilt();
      else await startHead();
      starting = false;
      updateButton();
      broadcast();
    } catch (error) {
      fail(error?.message || error);
    }
  });
  frame.addEventListener('load', () => broadcast());
  window.addEventListener('orientationchange', () => { neutralTilt = null; });
  window.addEventListener('pagehide', stop);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (enabled || starting)) stop();
  });
}
