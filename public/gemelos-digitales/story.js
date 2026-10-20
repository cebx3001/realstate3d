/* Narrativa progresiva: HTML estático completo, animación opcional y reversible. */
(() => {
  "use strict";
  const config = window.GEMELOS_CONFIG;
  const root = document.documentElement;
  const body = document.body;
  const scenes = [...document.querySelectorAll(".scene")];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const compact = matchMedia("(max-width: 700px)");
  const shortViewport = matchMedia(
    "(max-height: 550px), (max-width: 700px) and (max-height: 619px)",
  );
  const motionButton = document.querySelector(".motion-toggle");
  const chapterLinks = [...document.querySelectorAll(".chapter-nav a")];
  const splitCache = new WeakMap();
  const timelines = new Map();
  let context = null;
  let staticObserver = null;
  let manualStatic = false;
  let currentChapter = 0;
  let scrollFrame = 0;
  try {
    manualStatic = sessionStorage.getItem("gemelos-static") === "true";
  } catch (_) {
    /* Storage is optional. */
  }

  if (config?.contact?.verified && /^\d{8,15}$/.test(config.contact.phone)) {
    const url = `https://wa.me/${config.contact.phone}?text=${encodeURIComponent(config.contact.message)}`;
    document.querySelectorAll(".contact-link").forEach((a) => {
      a.href = url;
    });
  }
  if (config?.tourUrl)
    document.querySelectorAll(".tour-link").forEach((a) => {
      a.href = config.tourUrl;
    });

  function setChapter(index) {
    if (index < 0 || index >= scenes.length) return;
    currentChapter = index;
    document.getElementById("chapter-number").textContent =
      scenes[index].dataset.number;
    document.getElementById("chapter-name").textContent =
      scenes[index].dataset.label;
    chapterLinks.forEach((a, i) =>
      i === index
        ? a.setAttribute("aria-current", "location")
        : a.removeAttribute("aria-current"),
    );
  }
  function progress() {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      const max = root.scrollHeight - innerHeight;
      document.querySelector(".reading-progress > span").style.transform =
        `scaleX(${max > 0 ? scrollY / max : 0})`;
      scrollFrame = 0;
    });
  }
  addEventListener("scroll", progress, { passive: true });

  // FNV-1a + mulberry32: el patrón no cambia al recargar ni al invertir el scroll.
  function randomFor(text) {
    let seed = 2166136261;
    for (const c of text) seed = Math.imul(seed ^ c.codePointAt(0), 16777619);
    return () => {
      seed += 0x6d2b79f5;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function splitHeading(element) {
    if (splitCache.has(element)) return splitCache.get(element);
    const lines = [...element.querySelectorAll(":scope > .line")];
    const texts = lines.length
      ? lines.map((l) => l.textContent)
      : [element.textContent];
    const text = texts.join(" ");
    const semantic = document.createElement("span");
    semantic.className = "semantic-text";
    semantic.textContent = text;
    const visual = document.createElement("span");
    visual.className = "split-visual";
    visual.setAttribute("aria-hidden", "true");
    const chars = [];
    texts.forEach((line) => {
      const lineEl = document.createElement("span");
      lineEl.className = "line";
      line.split(/(\s+)/).forEach((token) => {
        if (/^\s+$/.test(token)) {
          lineEl.append(document.createTextNode(token));
          return;
        }
        const word = document.createElement("span");
        word.className = "word";
        for (const char of token) {
          const span = document.createElement("span");
          span.className = "char";
          span.textContent = char;
          word.append(span);
          chars.push(span);
        }
        lineEl.append(word);
      });
      visual.append(lineEl);
    });
    element.replaceChildren(semantic, visual);
    const rand = randomFor(text);
    const transforms = chars.map(() => ({
      x: (rand() - 0.5) * 145,
      y: (rand() - 0.5) * 105,
      z: 80 + rand() * 270,
      rotationX: (rand() - 0.5) * 125,
      rotationY: (rand() - 0.5) * 130,
      rotationZ: (rand() - 0.5) * 35,
      scale: 0.7 + rand() * 0.5,
    }));
    const order = chars.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const ranks = order.map((_, i) => order.indexOf(i));
    const result = { chars, transforms, ranks };
    splitCache.set(element, result);
    return result;
  }

  function titleIn(element, soft = false) {
    const { chars, transforms, ranks } = splitHeading(element);
    const tl = gsap.timeline();
    const strength = soft
      ? compact.matches
        ? 0.035
        : 0.12
      : compact.matches
        ? 0.5
        : 1;
    const from = { opacity: soft ? 0.85 : 0 };
    for (const key of ["x", "y", "z", "rotationX", "rotationY", "rotationZ"])
      from[key] = (i) => transforms[i][key] * strength;
    from.scale = (i) => (soft ? 0.98 : transforms[i].scale);
    // Desenfoque solo en pantallas grandes; ningún filtro animado en teléfonos.
    if (!compact.matches) from.filter = `blur(${soft ? 0 : 3}px)`;
    tl.fromTo(
      chars,
      from,
      {
        x: 0,
        y: 0,
        z: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        scale: 1,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.95,
        ease: "power2.out",
        stagger: (i) => (ranks[i] / Math.max(1, chars.length - 1)) * 0.75,
      },
      0,
    );
    return tl;
  }
  function titleOut(element) {
    const { chars, transforms, ranks } = splitHeading(element);
    return gsap
      .timeline()
      .to(chars, {
        x: (i) => transforms[i].x * 0.4,
        y: (i) => transforms[i].y * 0.5,
        z: (i) => -transforms[i].z * 0.5,
        rotationX: (i) => -transforms[i].rotationX * 0.45,
        rotationY: (i) => transforms[i].rotationY * 0.5,
        rotationZ: (i) => -transforms[i].rotationZ * 0.4,
        opacity: 0,
        scale: 0.94,
        duration: 1,
        ease: "power1.in",
        stagger: (i) => (ranks[i] / Math.max(1, chars.length - 1)) * 0.4,
      });
  }
  function showStep(timeline, element, at, hold, { last = false } = {}) {
    timeline.fromTo(
      element,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.55, ease: "power1.out" },
      at,
    );
    const heading = element.querySelector("[data-split]");
    if (heading) timeline.add(titleIn(heading), at + 0.05);
    if (!last)
      timeline.to(
        element,
        { opacity: 0, y: -12, duration: 0.45, ease: "power1.in" },
        at + hold - 0.45,
      );
  }
  function sceneTimeline(scene, units, screens, readerAt = 0.28) {
    const index = scenes.indexOf(scene);
    const clock = { value: 0 };
    const tl = gsap.timeline({
      scrollTrigger: {
        id: scene.id,
        trigger: scene,
        start: "top top",
        end: () => `+=${Math.round(innerHeight * screens)}`,
        pin: true,
        pinSpacing: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onEnter: () => setChapter(index),
        onEnterBack: () => setChapter(index),
        onUpdate: (self) => {
          if (self.isActive) setChapter(index);
        },
      },
    });
    tl.to(clock, { value: 1, duration: units, ease: "none" }, 0);
    tl.readerAt = readerAt;
    timelines.set(scene.id, tl);
    return tl;
  }
  function imageMotion(
    tl,
    selector,
    duration,
    from = { scale: 1.04 },
    to = { scale: 1 },
  ) {
    const media = gsap.timeline();
    media.fromTo(selector, from, { ...to, duration, ease: "none" }, 0);
    tl.add(media, 0);
  }
  function buildStory() {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    body.classList.add("motion-ready");
    scenes.forEach((scene) =>
      scene.querySelectorAll("[data-split]").forEach(splitHeading),
    );
    context = gsap.context(() => {
      let s = scenes[0],
        tl = sceneTimeline(s, 10, 2.4, 0.35);
      tl.add(titleIn(s.querySelector(".display"), true), 0);
      const copy = gsap
        .timeline()
        .fromTo(
          s.querySelector(".hero-bottom"),
          { opacity: 0.65, y: 12 },
          { opacity: 1, y: 0, duration: 1.2 },
          1.1,
        );
      tl.add(copy, 0).add(titleOut(s.querySelector(".display")), 8.2);
      tl.to(
        s.querySelector(".hero-bottom"),
        { opacity: 0, y: -20, duration: 0.8 },
        8.3,
      );
      tl.to(
        s.querySelector(".scroll-invitation"),
        { opacity: 0, duration: 0.5 },
        1.3,
      );
      imageMotion(
        tl,
        s.querySelector(".visual img"),
        10,
        { scale: 1.04 },
        { scale: 1.12, xPercent: -2 },
      );

      s = scenes[1];
      tl = sceneTimeline(s, 15, 4, 0.28);
      tl.add(titleIn(s.querySelector(".display")), 0);
      s.querySelectorAll(".copy-step").forEach((el, i) =>
        showStep(tl, el, 2 + i * 4, 4, { last: i === 2 }),
      );
      imageMotion(
        tl,
        s.querySelector(".visual img"),
        15,
        { scale: 1.23, xPercent: -5 },
        { scale: 1.03, xPercent: 0 },
      );
      tl.fromTo(
        s.querySelector(".perspective-frame"),
        { opacity: 0, scale: 0.86 },
        { opacity: 1, scale: 1, duration: 3 },
        2,
      );

      s = scenes[2];
      tl = sceneTimeline(s, 21, 5.3, 0.23);
      tl.add(titleIn(s.querySelector(".display")), 0);
      s.querySelectorAll(".copy-step").forEach((el, i) =>
        showStep(tl, el, 2 + i * 4.5, 4.5, { last: i === 3 }),
      );
      s.querySelectorAll(".ui-card").forEach((el, i) => {
        const at = 2 + i * 4.5;
        tl.fromTo(
          el,
          { opacity: 0, y: 25, rotationY: -8 },
          { opacity: 1, y: 0, rotationY: 0, duration: 0.8 },
          at + 0.4,
        );
        if (i < 3) tl.to(el, { opacity: 0, y: -10, duration: 0.45 }, at + 4.05);
      });
      imageMotion(
        tl,
        s.querySelector(".visual img"),
        21,
        { scale: 1.04 },
        { scale: 1.08, xPercent: -1 },
      );

      s = scenes[3];
      tl = sceneTimeline(s, 19, 5.3, 0.22);
      tl.add(titleIn(s.querySelector(".display")), 0);
      s.querySelectorAll(".method-panel").forEach((panel, i) => {
        const at = 1.8 + i * 5.6;
        gsap.set(panel, { zIndex: i + 1 });
        tl.fromTo(
          panel,
          { opacity: 0, yPercent: 25, scale: 0.94 },
          {
            opacity: 1,
            yPercent: 0,
            scale: 1,
            duration: 1.2,
            ease: "power2.out",
          },
          at,
        );
        tl.add(titleIn(panel.querySelector("h3")), at + 0.5);
        const media = gsap
          .timeline()
          .fromTo(
            panel.querySelector("img"),
            { scale: 1.12 },
            { scale: 1, duration: 5.5, ease: "none" },
          );
        tl.add(media, at);
        if (i < 2)
          tl.to(
            panel,
            { scale: 0.9, xPercent: -5, opacity: 0.2, duration: 1.2 },
            at + 5.6,
          );
      });

      s = scenes[4];
      tl = sceneTimeline(s, 10, 2.4, 0.4);
      tl.add(titleIn(s.querySelector(".display")), 0);
      tl.fromTo(
        s.querySelector(".demo-details"),
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 1.1 },
        1.8,
      );
      imageMotion(
        tl,
        s.querySelector(".demo-visual"),
        10,
        { scale: 1.18, clipPath: "inset(12% 8% 12% 8%)" },
        { scale: 1, clipPath: "inset(0% 0% 0% 0%)" },
      );

      s = scenes[5];
      tl = sceneTimeline(s, 25, 6.5, 0.17);
      tl.add(titleIn(s.querySelector(".display")), 0);
      const images = s.querySelectorAll(".build-image");
      gsap.set(images, { opacity: 0 });
      gsap.set(images[0], { opacity: 1 });
      const times = [2, 6.7, 11.4, 16.1];
      const visuals = gsap.timeline();
      times.forEach((at, i) => {
        if (i > 0) {
          visuals.fromTo(
            images[i],
            { opacity: 0, clipPath: "inset(0% 0% 100% 0%)" },
            {
              opacity: 1,
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1.1,
              ease: "power1.inOut",
            },
            at,
          );
          // La imagen anterior permanece bajo la máscara, sin fundido a un fondo vacío.
        }
        tl.to(
          s.querySelectorAll(".build-tick i")[i],
          { backgroundColor: "#c9b3e2", borderColor: "#c9b3e2", duration: 0.5 },
          at,
        );
      });
      tl.add(visuals, 0);
      s.querySelectorAll(".copy-step").forEach((el, i) =>
        showStep(tl, el, times[i], 4.7),
      );
      tl.to(
        s.querySelector(".build-progress"),
        { scaleX: 1, duration: 14.1, ease: "none" },
        2,
      );
      tl.to(
        s.querySelector(".construction-timeline"),
        { opacity: 0, duration: 0.7 },
        21,
      );
      tl.fromTo(
        s.querySelector(".construction-outro"),
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.8 },
        21.5,
      );

      s = scenes[6];
      tl = sceneTimeline(s, 16, 4.3, 0.29);
      tl.add(titleIn(s.querySelector(".display")), 0);
      s.querySelectorAll(".copy-step").forEach((el, i) =>
        showStep(tl, el, 2 + i * 4.3, 4.3, { last: i === 2 }),
      );
      tl.fromTo(
        s.querySelector(".operations-panel"),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2 },
        5.8,
      );
      tl.fromTo(
        s.querySelectorAll(".op-marker"),
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 1, stagger: 0.7 },
        6,
      );
      imageMotion(
        tl,
        s.querySelector(".operations-visual img"),
        16,
        { scale: 1.08 },
        { scale: 1 },
      );

      s = scenes[7];
      tl = sceneTimeline(s, 9, 1.8, 0.5);
      tl.add(titleIn(s.querySelector(".display")), 0);
      tl.fromTo(
        s.querySelector(".closing-copy"),
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 1 },
        1.5,
      );
      tl.fromTo(
        s.querySelector(".closing-actions"),
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 1 },
        2.3,
      );
      tl.fromTo(
        s.querySelector(".price-note"),
        { opacity: 0 },
        { opacity: 1, duration: 1 },
        2.8,
      );
    });
    ScrollTrigger.refresh();
  }
  function observeStatic() {
    staticObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setChapter(scenes.indexOf(visible[0].target));
      },
      { rootMargin: "-15% 0px -35% 0px", threshold: [0, 0.15, 0.5] },
    );
    scenes.forEach((s) => staticObserver.observe(s));
  }
  function configureMotion(restore = false) {
    const active = scenes[currentChapter];
    staticObserver?.disconnect();
    staticObserver = null;
    context?.revert();
    context = null;
    timelines.clear();
    body.classList.remove("motion-ready");
    const shouldAnimate =
      !reduced.matches &&
      !manualStatic &&
      !shortViewport.matches &&
      window.gsap &&
      window.ScrollTrigger;
    body.classList.toggle("static-mode", !shouldAnimate);
    if (shouldAnimate) buildStory();
    else observeStatic();
    motionButton.setAttribute("aria-pressed", String(!shouldAnimate));
    motionButton.querySelector(".motion-label").textContent = shouldAnimate
      ? "PAUSAR MOVIMIENTO"
      : "ACTIVAR MOVIMIENTO";
    motionButton.setAttribute(
      "aria-label",
      shouldAnimate
        ? "Pausar movimiento y mostrar todo el contenido"
        : "Activar movimiento vinculado al desplazamiento",
    );
    motionButton.querySelector(".motion-icon").innerHTML = shouldAnimate
      ? '<svg class="icon" viewBox="0 0 24 24"><path d="M8 5v14M16 5v14" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
      : '<svg class="icon" viewBox="0 0 24 24"><path d="m8 5 11 7-11 7Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
    if (reduced.matches) {
      motionButton.disabled = true;
      motionButton.setAttribute(
        "aria-label",
        "Movimiento reducido según tu dispositivo",
      );
    } else motionButton.disabled = false;
    if (restore) requestAnimationFrame(() => navigate(active.id, false));
    progress();
  }
  function navigate(id, focus = true) {
    const section = document.getElementById(id);
    if (!section) return;
    const tl = timelines.get(id);
    const top = tl
      ? tl.scrollTrigger.start +
        (tl.scrollTrigger.end - tl.scrollTrigger.start) * tl.readerAt
      : section.getBoundingClientRect().top + scrollY;
    window.scrollTo({ top, behavior: "instant" });
    setChapter(scenes.indexOf(section));
    if (focus) {
      const heading = section.querySelector("h1,h2");
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
  }
  document.querySelectorAll('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (event) => {
      const id = a.hash.slice(1);
      if (!document.getElementById(id)) return;
      event.preventDefault();
      history.pushState(null, "", "#" + id);
      navigate(id);
    }),
  );
  addEventListener("hashchange", () => navigate(location.hash.slice(1)));
  // Tabular hasta un CTA revela su escena, sin atrapar ni desviar el foco.
  document.querySelectorAll(".scene .button").forEach((a) =>
    a.addEventListener("focus", () => {
      const id = a.closest(".scene").id;
      const tl = timelines.get(id);
      if (tl && (!tl.scrollTrigger.isActive || tl.progress() < 0.3))
        navigate(id, false);
    }),
  );
  motionButton.addEventListener("click", () => {
    manualStatic = !manualStatic;
    try {
      sessionStorage.setItem("gemelos-static", String(manualStatic));
    } catch (_) {}
    configureMotion(true);
  });
  reduced.addEventListener("change", () => configureMotion(true));
  compact.addEventListener("change", () => configureMotion(true));
  shortViewport.addEventListener("change", () => configureMotion(true));
  configureMotion();
  document.fonts.ready.then(() => {
    if (context) ScrollTrigger.refresh();
    if (location.hash) navigate(location.hash.slice(1), false);
  });
  // Las imágenes diferidas conservan sus dimensiones; actualizar solo tras la carga inicial.
  addEventListener(
    "load",
    () => {
      if (context) ScrollTrigger.refresh();
    },
    { once: true },
  );
  addEventListener("pageshow", (event) => {
    if (event.persisted && context) ScrollTrigger.refresh();
  });
  window.GemelosStory = Object.freeze({
    navigate,
    get animated() {
      return !!context;
    },
    get chapters() {
      return [...timelines].map(([id, tl]) => ({
        id,
        start: tl.scrollTrigger.start,
        end: tl.scrollTrigger.end,
        progress: tl.progress(),
        duration: tl.duration(),
      }));
    },
  });
})();
