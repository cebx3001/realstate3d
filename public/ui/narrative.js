import { clamp, createScrollClock, letterWindow, wheelPixels } from './scroll-model.mjs';

/** A single GSAP timeline scrubbed directly by wheel/touch distance.
 * The document is fixed: scroll is animation time, never section navigation.
 * Both title representations are separate DOM objects; x/y never transport glyphs.
 */
export async function createNarrative({ onProgress, onOrbit, isModalOpen }) {
  await document.fonts.ready;
  const gsap = window.gsap;
  if (!gsap) throw new Error('Torres del Norte: local GSAP could not load');
  const clock = createScrollClock();
  const monument = document.querySelector('.monument');
  const lines = [...monument.children];
  const words = lines.map(line => line.textContent);
  const spine = document.querySelector('.spine');
  const flow = document.querySelector('.editorial-flow');
  const map = document.querySelector('.neighborhood-map');
  const cover = document.querySelector('.cover-card');
  const motion = { progress: 0 };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let timeline, frame, measuredHeight;
  spine.textContent = '';
  [...'TORRES DEL NORTE'].forEach(character => {
    const glyph = document.createElement('span');
    glyph.className = character === ' ' ? 'spine-space' : 'spine-char';
    glyph.textContent = character === ' ' ? '\u00a0' : character;
    spine.append(glyph);
  });
  const spineCharacters = [...spine.querySelectorAll('.spine-char')];
  function layoutLetters() {
    const letters = [];
    lines.forEach((line, lineIndex) => {
      line.removeAttribute('style');
      line.className = 'monument-line';
      line.textContent = words[lineIndex];
      const text = line.firstChild;
      const range = document.createRange();
      range.selectNodeContents(line);
      const bounds = range.getBoundingClientRect();
      const metrics = [...words[lineIndex]].map((character, i) => {
        range.setStart(text, i); range.setEnd(text, i + 1);
        const rect = range.getBoundingClientRect();
        return { character, left: rect.left - bounds.left, width: rect.width };
      });
      line.textContent = '';
      line.style.width = `${bounds.width}px`;
      line.style.height = `${parseFloat(getComputedStyle(line).lineHeight)}px`;
      metrics.forEach(({ character, left, width }) => {
        const glyph = document.createElement('span');
        glyph.className = 'monument-char'; glyph.textContent = character;
        glyph.style.left = `${left}px`; glyph.style.width = `${width}px`;
        line.append(glyph); letters.push(glyph);
      });
      line.setAttribute('aria-hidden', 'true');
    });
    return letters;
  }
  function build() {
    const progress = clock.progress;
    timeline?.kill();
    gsap.set([flow, map, cover, spine, ...spineCharacters], { clearProps: 'transform,opacity,visibility' });
    const letters = layoutLetters();
    measuredHeight = innerHeight;
    const startY = innerHeight * 1.08;
    const travel = flow.offsetHeight + startY + innerHeight * .35;
    clock.resize(travel / .91 + innerHeight * .85);
    timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
    timeline.to(motion, { progress: 1, duration: 1 }, 0);
    letters.forEach((letter, index) => {
      const { start, turn, reveal } = letterWindow(index);
      timeline.fromTo(letter, { rotationX: 0, rotationY: 0, z: 0, opacity: 1 }, {
        rotationX: reduced.matches ? 0 : (index % 2 ? -92 : 92),
        rotationY: reduced.matches ? 0 : (index % 3 - 1) * 38,
        z: reduced.matches ? 0 : -180 - (index % 4) * 35,
        opacity: 0, duration: turn, transformOrigin: '50% 55%',
      }, start);
      timeline.fromTo(spineCharacters[index], {
        rotationY: reduced.matches ? 0 : -88, z: reduced.matches ? 0 : -30, opacity: 0,
      }, { rotationY: 0, z: 0, opacity: 1, duration: reveal }, start + turn * .52);
    });
    timeline.fromTo(spine, { opacity: 0 }, { opacity: 1, duration: .01 }, .006);
    timeline.fromTo(cover, { y: 0, opacity: 1 }, { y: reduced.matches ? 0 : -35, opacity: 0, duration: .045 }, .007);
    timeline.fromTo(flow, { y: startY }, { y: startY - travel, duration: .91 }, .004);
    timeline.fromTo(map, { y: innerHeight + 40, visibility: 'visible' }, { y: 0, duration: .085 }, .915);
    // Foreground headlines also use independently turning glyphs. Their timing is
    // derived from the measured position in the ONE flow, never per-section triggers.
    flow.querySelectorAll('[data-kinetic]').forEach(heading => {
      if (!heading.dataset.split) {
        const text = heading.textContent.trim();
        heading.setAttribute('aria-label', text); heading.textContent = '';
        text.split(/(\s+)/).forEach(word => {
          const unit = document.createElement('span'); unit.className = 'story-word'; unit.setAttribute('aria-hidden', 'true');
          [...word].forEach(character => {
            const glyph = document.createElement('span'); glyph.className = 'story-char'; glyph.textContent = character;
            unit.append(glyph);
          }); heading.append(unit);
        }); heading.dataset.split = 'true';
      }
      gsap.set(heading.querySelectorAll('.story-char'), { clearProps: 'transform,opacity' });
      const entry = clamp((startY + heading.offsetTop - innerHeight * .89) / travel * .91 + .004, .005, .9);
      timeline.fromTo(heading.querySelectorAll('.story-char'), {
        rotationX: reduced.matches ? 0 : 76, z: reduced.matches ? 0 : -22, opacity: .12,
      }, { rotationX: 0, z: 0, opacity: 1, duration: .009, stagger: .00024, transformOrigin: '50% 70%' }, entry);
    });
    timeline.progress(progress);
    render();
  }
  function render() {
    frame = undefined;
    const progress = clock.progress;
    timeline.progress(progress);
    document.body.dataset.scrolled = progress > .005 ? 'true' : 'false';
    document.body.dataset.narrative = progress > .915 ? 'map' : progress > .005 ? 'editorial' : 'cover';
    cover.inert = progress >= .052;
    flow.inert = progress === 0;
    map.inert = progress < .96;
    map.setAttribute('aria-hidden', String(progress < .915));
    onProgress(progress);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(render); }
  function seek(progress) { clock.seek(progress); render(); }
  document.addEventListener('wheel', event => {
    if (event.ctrlKey || isModalOpen()) return;
    if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    event.preventDefault(); event.stopPropagation();
    clock.advance(wheelPixels(event.deltaY, event.deltaMode, innerHeight)); schedule();
  }, { passive: false, capture: true });
  let touch;
  document.addEventListener('touchstart', event => {
    if (event.touches.length !== 1 || isModalOpen() || event.target.closest('button,a')) { touch = null; return; }
    const point = event.touches[0]; touch = { x: point.clientX, y: point.clientY, axis: null };
  }, { passive: true, capture: true });
  document.addEventListener('touchmove', event => {
    if (!touch || event.touches.length !== 1) return;
    const point = event.touches[0], dx = point.clientX - touch.x, dy = touch.y - point.clientY;
    if (!touch.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 3) touch.axis = Math.abs(dy) >= Math.abs(dx) ? 'scroll' : 'orbit';
    event.preventDefault(); event.stopPropagation();
    if (touch.axis === 'scroll') { clock.advance(dy); schedule(); }
    else if (touch.axis === 'orbit') onOrbit(dx * .12);
    touch.x = point.clientX; touch.y = point.clientY;
  }, { passive: false, capture: true });
  document.addEventListener('touchend', () => { touch = null; }, { passive: true });
  let drag;
  document.querySelector('.scene').addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || isModalOpen()) return;
    drag = event.clientX; event.currentTarget.setPointerCapture(event.pointerId);
  });
  document.querySelector('.scene').addEventListener('pointermove', event => {
    if (drag == null) return;
    onOrbit((event.clientX - drag) * .12); drag = event.clientX;
  });
  document.querySelector('.scene').addEventListener('pointerup', () => { drag = null; });
  document.querySelector('.scene').addEventListener('lostpointercapture', () => { drag = null; });
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || isModalOpen() || event.target.closest('input,textarea,select')) return;
    if (event.key === 'Home') { event.preventDefault(); seek(0); return; }
    if (event.key === 'End') { event.preventDefault(); seek(1); return; }
    const amount = ['PageDown', ' '].includes(event.key) ? innerHeight * .65 : event.key === 'PageUp' ? -innerHeight * .65 : event.key === 'ArrowDown' ? 70 : event.key === 'ArrowUp' ? -70 : 0;
    if (!amount || (event.key === ' ' && event.target.closest('button,a'))) return;
    event.preventDefault(); clock.advance(amount); schedule();
  });
  let resizeFrame;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(build);
  });
  reduced.addEventListener('change', build);
  build();
  return { seek, get progress() { return clock.progress; }, get length() { return clock.length; }, get viewportHeight() { return measuredHeight; } };
}
