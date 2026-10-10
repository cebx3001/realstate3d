/**
 * Optical window controller for Torres del Norte.
 *
 * A browser camera reports the user's eyes relative to the SCREEN, so moving
 * a handheld phone produces translational parallax without WebXR/ARKit.
 * This is screen-relative 3D motion, not world-anchored 6DoF tracking.
 *
 * Works on desktop (head moves) and phone (screen moves); rotation-only
 * gyro parallax remains available as an explicitly labelled fallback.
 * No video or landmarks leave the browser.
 */
const frame = document.querySelector('#scene-viewer, #viewer');
if (frame) {
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && matchMedia('(pointer: coarse)').matches);
  const label = 'HEAD TRACKING';
  const welcome = document.getElementById('tdn-camera-prompt');
  const welcomeStart = document.getElementById('tdn-camera-enable');
  const welcomeSkip = document.getElementById('tdn-camera-skip');
  const welcomeStatus = document.getElementById('tdn-camera-status');
  const editMode = new URLSearchParams(location.search).get('edit') === 'true';
  if (welcome && editMode) welcome.hidden = true;
  if (welcome && mobile) {
    const copy = document.getElementById('tdn-camera-copy');
    if (copy) copy.textContent = 'Esta página utiliza Head Tracking para convertir el teléfono en una ventana espacial. Permite la cámara frontal y mueve el teléfono para explorar la profundidad del entorno.';
  }
  function status(message, error = false) {
    if (!welcomeStatus) return;
    welcomeStatus.textContent = message;
    welcomeStatus.dataset.error = String(error);
  }
  function closeWelcome() {
    if (!welcome || welcome.hidden) return;
    welcome.hidden = true;
    welcome.setAttribute('aria-hidden', 'true');
    if (welcomeStart) welcomeStart.disabled = false;
  }
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'tdn-spatial-toggle';
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-label', mobile ?
    'Activar ventana espacial mediante la cámara frontal' :
    'Activar seguimiento de cabeza mediante webcam');

  const style = document.createElement('style');
  style.textContent = `
    #tdn-spatial-toggle {
      position:fixed; z-index:52; top:92px; right:24px;
      pointer-events:auto; cursor:pointer;
      background:rgba(15,21,31,.58); color:#e9e8e2;
      border:1px solid rgba(210,177,107,.52); border-radius:0;
      padding:11px 13px; font:10px "JetBrains Mono",ui-monospace,monospace;
      letter-spacing:.065em; line-height:1.2; white-space:nowrap;
      backdrop-filter:blur(3px);
    }
    #tdn-spatial-toggle[aria-pressed="true"] {
      color:#D2B16B; border-color:#D2B16B;
    }
    #tdn-spatial-toggle:focus-visible {outline:2px solid #D2B16B;outline-offset:3px}
    @media(max-width:700px) {
      #tdn-spatial-toggle {top:64px;right:16px;padding:9px 10px;font-size:9px}
    }
  `;
  document.head.append(style);
  document.body.append(button);

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const angleDelta = (a, b) => ((a - b + 540) % 360) - 180;
  const zero = () => ({x: 0, y: 0, z: 0});
  let starting = false;
  let mode = null; // 'face' | 'tilt'
  let tryTilt = false;
  let token = 0;
  let stream = null;
  let video = null;
  let landmarker = null;
  let raf = 0;
  let lastProcessedAt = 0;
  let lastVideoTime = -1;
  let reference = null;
  let faceMisses = 0;
  let tiltReference = null;
  let tiltWatchdog = 0;
  let sample = zero();
  let opticalFilter = null;
  let lastFaceAt = 0;
  const irisDistanceMetres = 0.063;
  const focalScale = 0.90; // Approximate normalized focal length; first face is the neutral pose.

  // One-Euro filtering: quiet when stationary, faster with real movement.
  function oneEuro(value, axis, dt) {
    const slot = opticalFilter[axis];
    const factor = cutoff => {
      const tau = 1 / (2 * Math.PI * cutoff);
      return 1 / (1 + tau / dt);
    };
    const velocity = (value - slot.value) / dt;
    slot.speed += (velocity - slot.speed) * factor(1.0);
    const cutoff = (axis === 'span' ? 0.8 : 1.0) + 7 * Math.abs(slot.speed);
    slot.value += (value - slot.value) * factor(cutoff);
    return slot.value;
  }

  function softDeadZone(value, width) {
    return Math.sign(value) * Math.max(0, Math.abs(value) - width);
  }

  function send(active = Boolean(mode)) {
    frame.contentWindow?.postMessage(
      {scope:'tdn:spatial',active,x:sample.x,y:sample.y,z:sample.z},
      location.origin
    );
  }

  function display(text, title) {
    button.textContent = '[ ' + text + ' ]';
    button.title = title || '';
    button.setAttribute('aria-pressed', String(Boolean(mode)));
    button.disabled = starting;
  }

  function refresh() {
    const title = mode === 'face'
      ? 'Cámara frontal activa · mover el dispositivo o la cabeza · pulsar para desactivar'
      : mode === 'tilt'
        ? 'Solo inclinación mediante giroscopio · pulsar para desactivar'
        : tryTilt
          ? 'Cámara frontal no disponible · pulsar para activar inclinación'
          : 'Usa la cámara frontal para una perspectiva dependiente de tus ojos';
    const text = label + (starting ? ' / LOADING' : mode ? ' / ON' : ' / OFF');
    display(text, title);
  }

  function releaseVideo() {
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
    if (video) {
      video.pause();
      video.srcObject = null;
      video.remove();
      video = null;
    }
    landmarker?.close?.();
    landmarker = null;
  }

  function stop() {
    ++token;
    starting = false;
    mode = null;
    cancelAnimationFrame(raf);
    raf = 0;
    clearTimeout(tiltWatchdog);
    window.removeEventListener('deviceorientation', onOrientation);
    releaseVideo();
    reference = null;
    opticalFilter = null;
    lastFaceAt = 0;
    tiltReference = null;
    sample = zero();
    faceMisses = 0;
    send(false);
    refresh();
  }

  function recordFace(points) {
    const left = points[468] || points[33];
    const right = points[473] || points[263];
    if (!left || !right) return;
    const cx = (left.x + right.x) / 2;
    const cy = (left.y + right.y) / 2;
    const ratioY = (video.videoHeight || 480) / Math.max(1, video.videoWidth || 640);
    const span = Math.hypot(left.x - right.x, (left.y - right.y) * ratioY);
    if (!(span > 0.015) || !Number.isFinite(cx + cy + span)) return;

    const now = performance.now();
    if (!reference) {
      // Initial comfortable gaze is the calibration pose of this fixed window.
      reference = {cx, cy, span};
      opticalFilter = {
        cx: {value:cx,speed:0},
        cy: {value:cy,speed:0},
        span: {value:span,speed:0}
      };
      lastFaceAt = now;
      closeWelcome();
      sample = zero();
      faceMisses = 0;
      send(true);
      return;
    }
    const dt = clamp((now - lastFaceAt) / 1000, 1 / 120, .2);
    lastFaceAt = now;
    const filteredCx = oneEuro(cx, 'cx', dt);
    const filteredCy = oneEuro(cy, 'cy', dt);
    const filteredSpan = oneEuro(span, 'span', dt);

    // Pinhole eye pose relative to the *screen*, not a synthetic camera pan.
    // IPD gives a sensible scale; exact screen dimensions are not claimed.
    const x = irisDistanceMetres * (filteredCx - .5) / filteredSpan;
    const y = irisDistanceMetres * (.5 - filteredCy) * ratioY / filteredSpan;
    const neutralX = irisDistanceMetres * (reference.cx - .5) / reference.span;
    const neutralY = irisDistanceMetres * (.5 - reference.cy) * ratioY / reference.span;
    const distance = irisDistanceMetres * focalScale / filteredSpan;
    const neutralDistance = irisDistanceMetres * focalScale / reference.span;

    // Spatial units saturate gradually at sensible head/phone excursions;
    // the view and projection always use the *same* eye displacement.
    sample = {
      x: clamp(softDeadZone(neutralX - x, .003) / (mobile ? .11 : .20), -1, 1),
      y: clamp(softDeadZone(y - neutralY, .003) / (mobile ? .10 : .16), -1, 1),
      z: clamp(softDeadZone(distance - neutralDistance, .005) / (mobile ? .22 : .28), -1, 1)
    };
    faceMisses = 0;
    send(true);
  }

  function onMissingFace() {
    if (++faceMisses === 5 && mode === 'face') {
      // Never snap to zero and never silently recalibrate: freeze last pose.
      display(label + ' / ON', 'Buscando rostro: se mantiene la última perspectiva estable');
      status('Rostro fuera de cámara. La perspectiva permanece fija hasta recuperarlo.');
    }
  }

  async function startFace(runToken) {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('La cámara requiere un navegador con HTTPS y permiso de cámara');
    }
    const captured = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user',
        width: {ideal: mobile ? 384 : 640},
        height: {ideal: mobile ? 288 : 480},
        frameRate: {ideal: mobile ? 24 : 30, max: 30}
      }
    });
    if (runToken !== token) {
      captured.getTracks().forEach(track => track.stop());
      return;
    }
    stream = captured;
    video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.style.display = 'none';
    video.srcObject = captured;
    document.body.append(video);
    await video.play();
    if (runToken !== token) return;
    status('Cámara autorizada. Inicializando detección facial…');

    // Pin to a published stable version; the previous 0.10.22 URL was invalid.
    const version = '0.10.35';
    const base = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@' + version;
    const {FaceLandmarker, FilesetResolver} = await import(base + '/+esm');
    if (runToken !== token) return;
    const wasm = await FilesetResolver.forVisionTasks(base + '/wasm');
    if (runToken !== token) return;
    const detector = await FaceLandmarker.createFromOptions(wasm, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'CPU'
      },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false
    });
    if (runToken !== token) { detector.close(); return; }
    landmarker = detector;
    mode = 'face';
    starting = false;
    refresh();
    closeWelcome();
    status('Seguimiento preparado. Buscando el rostro frente a la cámara…');

    const loop = (now) => {
      if (runToken !== token || mode !== 'face') return;
      const interval = mobile ? 65 : 45; // Lower detection-to-render latency, capped for mobile CPU.
      if (now - lastProcessedAt >= interval && video?.readyState >= 2 &&
          video.currentTime !== lastVideoTime) {
        lastProcessedAt = now;
        lastVideoTime = video.currentTime;
        try {
          const face = landmarker.detectForVideo(video, now).faceLandmarks?.[0];
          if (face) {
            recordFace(face);
            if (faceMisses === 0 && button.title.includes('coloca el rostro')) refresh();
          } else onMissingFace();
        } catch (error) {
          console.warn('[TDN spatial] Face inference', error);
          onMissingFace();
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  function onOrientation(event) {
    if (mode !== 'tilt' || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
    if (!tiltReference) tiltReference = {beta: event.beta, gamma: event.gamma};
    clearTimeout(tiltWatchdog);
    const angle = screen.orientation?.angle ?? window.orientation ?? 0;
    const portrait = Math.abs(angle) % 180 === 0;
    let horizontal = portrait ? angleDelta(event.gamma, tiltReference.gamma)
      : angleDelta(event.beta, tiltReference.beta);
    const vertical = portrait ? angleDelta(event.beta, tiltReference.beta)
      : angleDelta(event.gamma, tiltReference.gamma);
    if (!portrait && (angle === -90 || angle === 270)) horizontal *= -1;
    sample = {
      x: clamp(horizontal / 18, -1, 1),
      y: clamp(-vertical / 18, -1, 1),
      z: 0
    };
    send(true);
  }

  async function startTilt(runToken) {
    if (!('DeviceOrientationEvent' in window)) {
      throw new Error('Este dispositivo no ofrece datos de orientación');
    }
    // iOS requires this directly in the tap event; do not request on page load.
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== 'granted') throw new Error('Movimiento denegado');
    }
    if (runToken !== token) return;
    mode = 'tilt';
    starting = false;
    refresh();
    window.addEventListener('deviceorientation', onOrientation);
    tiltWatchdog = setTimeout(() => {
      if (mode === 'tilt' && !tiltReference) {
        stop();
        display('NO SENSOR','No se recibieron datos de orientación');
      }
    }, 3200);
  }

  welcomeSkip?.addEventListener('click', closeWelcome);
  welcomeStart?.addEventListener('click', () => {
    if (starting) return;
    if (mode === 'face') { closeWelcome(); return; }
    if (welcomeStart) welcomeStart.disabled = true;
    status('Solicitando acceso a la cámara. Acepta el permiso del navegador para continuar.');
    // This remains in the user's click handler, satisfying camera consent rules.
    button.click();
  });

  button.addEventListener('click', () => {
    if (starting) return;
    if (mode) { stop(); return; }
    const runToken = ++token;
    starting = true;
    refresh();
    // Important: startTilt invoked directly in the user gesture (iOS requirement).
    const start = (mobile && tryTilt) ? startTilt(runToken) : startFace(runToken);
    start.catch(error => {
      if (runToken !== token) return;
      console.warn('[TDN spatial]', error);
      stop();
      if (welcome && !welcome.hidden) {
        status('No se pudo activar la cámara: ' + String(error?.message || error) +
          '. Comprueba los permisos del navegador e inténtalo nuevamente.', true);
        if (welcomeStart) welcomeStart.disabled = false;
      }
      if (mobile && !tryTilt) {
        tryTilt = true;
        refresh();
      } else display('UNAVAILABLE', String(error?.message || error));
    });
  });

  frame.addEventListener('load', () => send());
  window.addEventListener('orientationchange', () => {
    reference = null;
    opticalFilter = null;
    lastFaceAt = 0;
    tiltReference = null;
  });
  window.addEventListener('pagehide', stop);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (mode || starting)) stop();
  });
  refresh();
}
