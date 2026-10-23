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
  const railLabel = document.querySelector(".identity-rail-text");
  // Fit the entire label vertically to the viewport, without changing letter proportions.
  function sizeIdentityRail() {
    if (!railLabel) return;
    const target = Math.max(240, Math.round(document.documentElement.clientHeight * 0.82));
    railLabel.style.fontSize = "64px";
    const initial = railLabel.scrollHeight;
    if (!initial) return;
    let size = Math.max(26, Math.min(58, 64 * target / initial));
    railLabel.style.fontSize = `${size}px`;
    const measured = railLabel.scrollHeight;
    if (measured) {
      size = Math.max(26, Math.min(58, size * target / measured));
      railLabel.style.fontSize = `${size}px`;
    }
  }
  addEventListener("resize", sizeIdentityRail, { passive: true });
  window.visualViewport?.addEventListener("resize", sizeIdentityRail, { passive: true });

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
    body.classList.toggle("past-hero", index > 0);
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
    // Cada carácter conserva su casilla tipográfica y su línea base.
    // Solo profundidad, rotación local y orden; nunca cambia la composición.
    const transforms = chars.map(() => {
      const direction = rand() < 0.5 ? -1 : 1;
      return {
        z: -(55 + rand() * 105),
        // Giro horizontal en cada carácter; jamás separar las letras del renglón.
        rotationX: direction * (72 + rand() * 43),
        rotationY: rand() < 0.18 ? direction * (8 + rand() * 14) : 0,
      };
    });
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
        ? 0.95
        : 1;
    const from = { opacity: soft ? 0.85 : 0.06, transformPerspective: 900 };
    for (const key of ["z", "rotationX", "rotationY"])
      from[key] = (i) => transforms[i][key] * strength;
    gsap.set(chars, {x: 0, y: 0, scale: 1, rotationZ: 0, transformOrigin: "50% 50%"});
    // Desenfoque solo en pantallas grandes; ningún filtro animado en teléfonos.
    if (!compact.matches) from.filter = `blur(${soft ? 0 : 3}px)`;
    tl.fromTo(
      chars,
      from,
      {
        z: 0,
        rotationX: 0,
        rotationY: 0,
        transformPerspective: 900,
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
        z: (i) => transforms[i].z * 0.65,
        rotationX: (i) => -transforms[i].rotationX * 0.55,
        rotationY: (i) => -transforms[i].rotationY * 0.55,
        transformPerspective: 900,
        opacity: 0,
        scale: 1,
        duration: 1,
        ease: "power1.in",
        stagger: (i) => (ranks[i] / Math.max(1, chars.length - 1)) * 0.4,
      });
  }
  function showStep(timeline, element, at, hold, { last = false } = {}) {
    timeline.fromTo(
      element,
      { opacity: 0 },
      { opacity: 1, duration: 0.62, ease: "none" },
      at,
    );
    const heading = element.querySelector("[data-split]");
    if (heading) timeline.add(titleIn(heading), at + 0.05);
    if (!last)
      timeline.to(
        element,
        { opacity: 0, duration: 0.52, ease: "none" },
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
      let s = scenes[0], tl = sceneTimeline(s, 26, 7, 0.75);
      const intro = s.querySelector(".hero-wordmark");
      const horizontal = splitHeading(intro).chars;
      const rail = document.querySelector(".identity-rail");
      const vertical = [...rail.querySelectorAll(".rail-char")];
      const blueprint = s.querySelector(".hero-phase-blueprint");
      const realized = s.querySelector(".hero-phase-real");
      const heroTitle = s.querySelector(".hero-content > .display");
      const commercial = [...s.querySelectorAll(".hero-bottom [data-split]")];
      // The rail container never moves or fades; each glyph owns its visibility.
      gsap.set(rail, {opacity: 1, visibility: "visible"});
      gsap.set(vertical, {opacity: 0, rotationX: -90, z: -90,
        transformPerspective: 900, transformOrigin: "50% 50%"});
      gsap.set(horizontal, {opacity: 1, rotationX: 0, rotationY: 0, z: 0,
        scale: 1, x: 0, y: 0, transformPerspective: 900});
      gsap.set([blueprint, realized], {opacity: 0});
      gsap.set(intro, {opacity: 1});
      gsap.set(s.querySelector(".hero-bottom"), {autoAlpha: 0});
      gsap.set(s.querySelector(".hero-coordinate"), {autoAlpha: 0});
      gsap.set(s.querySelector(".hero-content > .eyebrow"), {autoAlpha: 0});
      gsap.set(heroTitle, {autoAlpha: 0});
      // 0–3: clean blue / 3–7: technical drawing with intact horizontal title.
      const architecture = gsap.timeline();
      architecture.to(blueprint, {opacity: 1, duration: 3, ease: "none"}, 3);
      // 9–14: registered materialization, exactly concurrent with paired glyphs.
      architecture.to(realized, {opacity: 1, duration: 5, ease: "none"}, 9);
      architecture.to(blueprint, {opacity: 0, duration: 5, ease: "none"}, 9);
      tl.add(architecture, 0);
      const lettering = gsap.timeline();
      horizontal.forEach((char, i) => {
        const at = 9 + i * (3.9 / (horizontal.length - 1));
        lettering.to(char, {rotationX: 90, opacity: 0, z: -90,
          duration: 1.1, ease: "none"}, at);
        lettering.to(vertical[i], {rotationX: 0, opacity: 1, z: 0,
          duration: 1.1, ease: "none"}, at);
      });
      tl.add(lettering, 0);
      tl.to(s.querySelector(".scroll-invitation"), {autoAlpha: 0, duration: 1}, 3);
      tl.to(s.querySelector(".scrim"), {opacity: 1, duration: 1.2}, 14);
      // Copy only follows the completed materialization, with a reading plateau.
      tl.set(heroTitle, {autoAlpha: 1}, 15);
      tl.add(titleIn(heroTitle), 15);
      tl.to(s.querySelector(".hero-content > .eyebrow"), {autoAlpha: 1, duration: .8}, 15);
      tl.set(s.querySelector(".hero-bottom"), {autoAlpha: 1}, 16.7);
      commercial.forEach((el, i) => tl.add(titleIn(el), 16.7 + i * .5));
      tl.to(s.querySelector(".hero-coordinate"), {autoAlpha: 1, duration: .7}, 17.8);
      tl.add(titleOut(heroTitle), 23);
      commercial.forEach((el, i) => tl.add(titleOut(el), 23.2 + i * .15));
      tl.to(s.querySelectorAll(".hero-coordinate,.hero-content>.eyebrow"),
        {autoAlpha: 0, duration: 1}, 23.6);

      s = scenes[1];
      tl = sceneTimeline(s, 15, 4, 0.28);
      tl.add(titleIn(s.querySelector(".display")), 0);
      tl.fromTo(
        s.querySelector(".concept-subtitle"),
        { opacity: 0 },
        { opacity: 1, rotationX: 0, duration: 1.15, ease: "power2.out" },
        1.1,
      );
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
      s.querySelectorAll(".sales-graphic").forEach((el, i) => {
        const at = 2 + i * 4.5;
        tl.fromTo(
          el,
          { autoAlpha: 0, scale: 0.96 },
          { autoAlpha: 1, scale: 1, duration: 1.2, ease: "power2.out" },
          at + 0.3,
        );
        if (i < 3) tl.to(el, { autoAlpha: 0, duration: 0.55 }, at + 4.05);
      });
      imageMotion(
        tl,
        s.querySelector(".visual img"),
        21,
        { scale: 1.04 },
        { scale: 1.08, xPercent: -1 },
      );

      s = scenes[3];
      tl = sceneTimeline(s, 19, 5.3, 0.28);
      tl.add(titleIn(s.querySelector(".display")), 0);
      s.querySelectorAll(".method-panel").forEach((panel, i) => {
        const at = 1.8 + i * 5.6;
        gsap.set(panel, { zIndex: i + 1 });
        tl.fromTo(
          panel,
          { opacity: 0, scale: 1.025 },
          {
            opacity: 1,
            scale: 1,
            duration: 1.2,
            ease: "power2.out",
          },
          at,
        );
        tl.add(titleIn(panel.querySelector("h3")), at + 1.25);
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
            { opacity: 0.15, duration: 1.2 },
            at + 5.6,
          );
      });

      s = scenes[4];
      tl = sceneTimeline(s, 10, 2.4, 0.4);
      tl.add(titleIn(s.querySelector(".display")), 0);
      tl.fromTo(
        s.querySelector(".demo-details"),
        { opacity: 0 },
        { opacity: 1, rotationX: 0, duration: 1.1 },
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
      if (compact.matches) tl.to(s.querySelector(".construction-intro"), {opacity: 0, duration: .6}, 5.4);
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
          { backgroundColor: "#a9d0e9", borderColor: "#a9d0e9", duration: 0.5 },
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
        { opacity: 0 },
        { opacity: 1, rotationX: 0, duration: 0.8 },
        21.5,
      );

      s = scenes[6];
      tl = sceneTimeline(s, 16, 4.3, 0.29);
      tl.add(titleIn(s.querySelector(".display")), 0);
      s.querySelectorAll(".copy-step").forEach((el, i) =>
        showStep(tl, el, 2 + i * 4.3, 4.3, { last: i === 2 }),
      );

      // Corresponding circles and architecture connections share a scroll interval.
      s.querySelectorAll(".spatial-marker").forEach((marker, i) => {
        const group = s.querySelector(`.system-connection[data-system="${marker.dataset.system}"]`);
        tl.fromTo([marker, group], {autoAlpha: 0}, {autoAlpha: 1, duration: .9}, 5.5 + i * .55);
        tl.fromTo(group.querySelector("path"), {strokeDashoffset: 1}, {strokeDashoffset: 0, duration: 1.4, ease: "none"}, 5.5 + i * .55);
      });

      s = scenes[7];
      tl = sceneTimeline(s, 9, 1.8, 0.5);
      tl.add(titleIn(s.querySelector(".display")), 0);
      tl.fromTo(
        s.querySelector(".closing-copy"),
        { opacity: 0 },
        { opacity: 1, rotationX: 0, duration: 1 },
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
        { opacity: 1, rotationX: 0, duration: 1 },
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
  const mediaObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.querySelectorAll("img").forEach(img => { img.loading = "eager"; });
    mediaObserver.unobserve(entry.target);
  }), {rootMargin: "150% 0px"});
  scenes.forEach(scene => mediaObserver.observe(scene));
  sizeIdentityRail();
  configureMotion();
  document.fonts.ready.then(() => {
    sizeIdentityRail();
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
  function positionSpatialMarkers() {
    const picture = document.querySelector(".operations-visual");
    const img = picture.querySelector("img");
    if (!img.naturalWidth) return;
    const stage = picture.closest(".stage");
    const bounds = picture.getBoundingClientRect(), origin = stage.getBoundingClientRect();
    // BOTH orientations use contain, bottom-aligned. No part of either source is cropped.
    const scale = Math.min(bounds.width / img.naturalWidth, bounds.height / img.naturalHeight);
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    img.style.setProperty("--frame-top", `${bounds.height - h}px`);
    img.style.setProperty("--frame-left", `${(bounds.width - w) / 2}px`);
    img.style.setProperty("--frame-right", `${(bounds.width + w) / 2}px`);
    const left = bounds.left - origin.left + (bounds.width - w) / 2;
    const top = bounds.top - origin.top + bounds.height - h;
    const connectors = stage.querySelector(".system-connectors");
    connectors.setAttribute("viewBox", `0 0 ${stage.clientWidth} ${stage.clientHeight}`);
    stage.querySelectorAll(".spatial-marker").forEach(marker => {
      const [x, y] = marker.dataset[img.currentSrc.includes("-mobile.webp") ? "mobile" : "desktop"].split(",").map(Number);
      const tx = left + x * w, ty = top + y * h;
      const icon = marker.querySelector(".system-icon").getBoundingClientRect();
      const sx = icon.left + icon.width / 2 - origin.left;
      const sy = icon.top + icon.height / 2 - origin.top;
      const group = connectors.querySelector(`[data-system="${marker.dataset.system}"]`);
      const path = group.querySelector("path");
      const mx = sx + (tx - sx) * .48;
      path.setAttribute("d", `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`);
      path.setAttribute("pathLength", "1");
      group.querySelectorAll("circle").forEach(dot => {
        dot.setAttribute("cx", tx); dot.setAttribute("cy", ty);
      });
    });
  }
  document.querySelector(".operations-visual img").addEventListener("load", positionSpatialMarkers);
  new ResizeObserver(positionSpatialMarkers).observe(document.querySelector("#operacion .stage"));
  addEventListener("resize", positionSpatialMarkers, {passive: true});
  document.fonts.ready.then(positionSpatialMarkers);
  positionSpatialMarkers();
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
