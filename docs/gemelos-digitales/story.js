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


  function mountEditorialDiagrams() {
    // Seamless editorial illustrations, never UI cards or PowerPoint-like boxes.
    const sales = document.querySelector(".sales-interface");
    if (sales) {
      sales.classList.add("editorial-graphics");
      sales.innerHTML = `
        <div class="sales-graphic sales-graphic-0" aria-hidden="true">
          <span class="graphic-index">01 / PROYECTO EXPLORABLE</span>
          <svg viewBox="0 0 640 430" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
            <g class="drawing-guides" stroke-width=".8"><path d="M30 54H613M30 162H613M30 270H613M30 378H613M108 22V406M254 22V406M400 22V406M546 22V406"/></g>
            <g class="drawing-primary" stroke-width="2"><path d="M95 237L314 88L548 201L330 355Z"/><path d="M95 237V305L330 411V355M548 201V292L330 411M314 88V169L95 305M314 169L548 292"/><path d="M205 280V361M205 280L423 155M423 155V330M205 361L423 330"/></g>
            <g class="drawing-detail" stroke-width="1"><path d="M122 238L313 112L524 209M122 281L313 160L524 263M158 258V335M260 188V384M382 147V365M483 171V340" /><path d="M314 88V41M548 201L595 186" stroke-dasharray="5 9"/></g>
            <g class="drawing-dots" fill="currentColor" stroke="none"><circle cx="95" cy="237" r="3"/><circle cx="314" cy="88" r="3"/><circle cx="548" cy="201" r="3"/><circle cx="330" cy="355" r="3"/></g>
          </svg><span class="graphic-note">GEOMETRÍA / NAVEGACIÓN / PREVENTA</span>
        </div>
        <div class="sales-graphic sales-graphic-1" aria-hidden="true">
          <span class="graphic-index">02 / UN PROYECTO, CUALQUIER LUGAR</span>
          <svg viewBox="0 0 640 430" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
            <g class="globe-graticule" stroke-width="1"><circle cx="320" cy="210" r="153"/><ellipse cx="320" cy="210" rx="80" ry="153"/><ellipse cx="320" cy="210" rx="132" ry="153"/><ellipse cx="320" cy="210" rx="153" ry="64"/><ellipse cx="320" cy="210" rx="153" ry="119"/><path d="M167 210H473M320 57V363"/></g>
            <g class="globe-routes" stroke-width="2.5"><path d="M272 275Q233 105 352 89"/><path d="M272 275Q399 117 454 236"/><path d="M272 275Q393 360 404 323"/></g>
            <g class="globe-points" fill="#fff" stroke="none"><circle cx="272" cy="275" r="7"/><circle cx="352" cy="89" r="4"/><circle cx="454" cy="236" r="4"/><circle cx="404" cy="323" r="4"/></g>
            <g class="globe-rings"><circle cx="272" cy="275" r="17"/><circle cx="272" cy="275" r="29"/></g>
            <path d="M272 275L182 335H96M454 236L537 259H610" stroke-width="1.3"/>
            <g class="globe-labels" stroke="none" fill="currentColor" font-family="Space Grotesk,Arial,sans-serif" font-size="17" font-weight="600"><text x="94" y="358">ECUADOR</text><text x="489" y="279">EL MUNDO</text></g>
          </svg><span class="graphic-note">EXPERIENCIA WEB / ACCESO REMOTO</span>
        </div>
        <div class="sales-graphic sales-graphic-2" aria-hidden="true">
          <span class="graphic-index">03 / PRESENTACIÓN INMERSIVA</span>
          <svg viewBox="0 0 640 430" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
            <g class="drawing-primary" stroke-width="1.7"><path d="M104 304L318 182L537 261L324 389Z"/><path d="M104 304V213L318 90V182M537 261V168L318 90M104 213L324 301L537 168M324 301V389"/><path d="M200 253V155L425 210V331M425 210L318 147M240 235L240 115M382 283V155"/></g>
            <g class="drawing-guides" stroke-width="1"><path d="M84 194L318 56L562 152M318 56V40M318 90V142M324 389V413M537 168L574 152"/><circle cx="318" cy="90" r="24"/><circle cx="324" cy="389" r="24"/></g><g class="drawing-dots" fill="currentColor" stroke="none"><circle cx="318" cy="90" r="4"/><circle cx="324" cy="389" r="4"/></g>
          </svg><span class="graphic-note">FERIAS / REUNIONES / PRESENTACIONES</span>
        </div>
        <div class="sales-graphic sales-graphic-3" aria-hidden="true">
          <span class="graphic-index">04 / PLANOS ESPACIALES INTERACTIVOS</span>
          <svg viewBox="0 0 640 430" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
            <g class="drawing-primary" stroke-width="2"><path d="M85 68H555V356H85V68Z"/><path d="M85 188H277V68M277 116H430V68M430 116V244H555M277 188V356M430 244V356M85 289H277M330 188H430"/></g>
            <g class="drawing-guides" stroke-width=".9"><path d="M85 51H555M85 43V59M555 43V59M65 68V356M57 68H74M57 356H74"/><path d="M112 92H153V129H112ZM175 92H244V143H175ZM312 119H395V167H312ZM458 273H525V326H458Z"/></g>
            <path class="floor-route" d="M176 322Q242 320 309 282T487 281" stroke="#fff" stroke-width="2.7" stroke-dasharray="4 10"/><circle cx="176" cy="322" r="9" fill="#fff" stroke="none"/><circle cx="487" cy="281" r="16" stroke="#fff" stroke-width="2"/><circle cx="487" cy="281" r="5" fill="#fff" stroke="none"/>
          </svg><span class="graphic-note">RECORRIDOS / AMBIENTES / INFORMACIÓN</span>
        </div>`;
    }
    const ops = document.querySelector(".operations-interface");
    if (ops) {
      ops.classList.add("operations-editorial");
      ops.innerHTML = `
        <svg class="operations-network" viewBox="0 0 1000 720" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g class="network-grid" stroke="#ecedf2" stroke-width=".9"><path d="M192 24V698M315 24V698M438 24V698M561 24V698M684 24V698M807 24V698M96 140H916M96 260H916M96 380H916M96 500H916M96 620H916"/></g>
          <g class="network-routes" stroke="#fff" stroke-width="2"><path d="M530 218L680 155H885"/><path d="M622 346L787 320H946"/><path d="M499 487L699 555H905"/></g>
          <g stroke="#fff" stroke-width="1.5"><circle cx="530" cy="218" r="9"/><circle cx="622" cy="346" r="9"/><circle cx="499" cy="487" r="9"/></g>
          <g fill="#fff" stroke="none"><circle cx="530" cy="218" r="3.3"/><circle cx="622" cy="346" r="3.3"/><circle cx="499" cy="487" r="3.3"/></g>
          <g class="network-rings" stroke="#fff"><circle cx="530" cy="218" r="23"/><circle cx="622" cy="346" r="23"/><circle cx="499" cy="487" r="23"/></g>
        </svg>
        <span class="ops-label ops-label-1"><small>01 / SISTEMA</small>CLIMATIZACIÓN</span>
        <span class="ops-label ops-label-2"><small>02 / REGISTRO</small>CÁMARAS</span>
        <span class="ops-label ops-label-3"><small>03 / CONTROL</small>ACCESOS</span>
        <div class="ops-readout"><strong>EDIFICIO + INFORMACIÓN</strong><span>SENSORES / GESTIÓN ESPACIAL / INTEGRACIÓN A MEDIDA</span></div>`;
    }
  }
  mountEditorialDiagrams();

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
    // La variación se aplica únicamente a profundidad, rotación, escala y tiempo.
    const transforms = chars.map(() => {
      const mode = rand();
      const direction = rand() < 0.5 ? -1 : 1;
      return {
        z: -(55 + rand() * 105),
        // Giro horizontal en cada carácter; jamás separar las letras del renglón.
        rotationX: direction * (72 + rand() * 43),
        rotationY: rand() < 0.18 ? direction * (8 + rand() * 14) : 0,
        scale: mode >= 0.68 ? 0.91 + rand() * 0.08 : 1,
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
    from.scale = (i) => (soft ? 0.98 : transforms[i].scale);
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
        scale: 0.94,
        duration: 1,
        ease: "power1.in",
        stagger: (i) => (ranks[i] / Math.max(1, chars.length - 1)) * 0.4,
      });
  }
  function showStep(timeline, element, at, hold, { last = false } = {}) {
    timeline.fromTo(
      element,
      { opacity: 0.08, rotationX: -58, transformPerspective: 900 },
      { opacity: 1, rotationX: 0, duration: 0.62, ease: "power2.out" },
      at,
    );
    const heading = element.querySelector("[data-split]");
    if (heading) timeline.add(titleIn(heading), at + 0.05);
    if (!last)
      timeline.to(
        element,
        { opacity: 0, rotationX: 42, transformPerspective: 900, duration: 0.52, ease: "power1.in" },
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
        tl = sceneTimeline(s, 18, 4.8, 0.55);
      const intro = s.querySelector(".hero-wordmark");
      const rail = document.querySelector(".identity-rail");
      const blueprint = s.querySelector(".hero-phase-blueprint");
      const hybrid = s.querySelector(".hero-phase-hybrid");
      const realized = s.querySelector(".hero-phase-real");
      // El estado inicial es solo el título horizontal y el logotipo.
      // El scroll controla giro tipográfico, aparición lateral y materialización.
      gsap.set(rail, { autoAlpha: 0, rotationX: -78, transformPerspective: 900 });
      gsap.set([blueprint, hybrid, realized], { opacity: 0 });
      gsap.set(intro, { opacity: 1 });
      gsap.set(s.querySelector(".hero-bottom"), { autoAlpha: 0 });
      gsap.set(s.querySelector(".hero-coordinate"), { autoAlpha: 0 });
      gsap.set(s.querySelector(".hero-content > .eyebrow"), { autoAlpha: 0 });
      gsap.set(s.querySelector(".hero-content > .display"), { autoAlpha: 0 });
      tl.add(titleOut(intro), 0.65);
      tl.fromTo(
        rail,
        { autoAlpha: 0, rotationX: -78, z: -65 },
        { autoAlpha: 1, rotationX: 0, z: 0, duration: 2, ease: "power2.out" },
        1.25,
      );
      tl.fromTo(
        blueprint,
        { opacity: 0, scale: 1.035 },
        { opacity: 1, scale: 1, duration: 2.2, ease: "none" },
        1.4,
      );
      tl.fromTo(
        hybrid,
        { opacity: 0 },
        { opacity: 1, duration: 2.8, ease: "none" },
        5.25,
      );
      tl.fromTo(
        realized,
        { opacity: 0 },
        { opacity: 1, duration: 2.8, ease: "none" },
        8.25,
      );
      const heroTitle = s.querySelector(".hero-content > .display");
      tl.to(s.querySelector(".hero-content > .eyebrow"), { autoAlpha: 1, duration: 0.7 }, 11.3);
      tl.to(heroTitle, { autoAlpha: 1, duration: 0.05 }, 11.45);
      tl.add(titleIn(heroTitle), 11.5);
      tl.fromTo(
        s.querySelector(".hero-bottom"),
        { autoAlpha: 0, rotationX: -45, transformPerspective: 900 },
        { autoAlpha: 1, rotationX: 0, duration: 1.1, ease: "power2.out" },
        13.1,
      );
      tl.to(s.querySelector(".hero-coordinate"), { autoAlpha: 1, duration: 0.6 }, 13.3);
      tl.to(
        s.querySelector(".scroll-invitation"),
        { opacity: 0, duration: 0.55, ease: "none" },
        0.5,
      );
      tl.add(titleOut(heroTitle), 16.35);
      tl.to(s.querySelector(".hero-bottom"), { opacity: 0, duration: 0.8 }, 16.55);

      s = scenes[1];
      tl = sceneTimeline(s, 15, 4, 0.28);
      tl.add(titleIn(s.querySelector(".display")), 0);
      tl.fromTo(
        s.querySelector(".concept-subtitle"),
        { opacity: 0.08, rotationX: -56, transformPerspective: 900 },
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
      tl = sceneTimeline(s, 19, 5.3, 0.22);
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
            { opacity: 0.15, duration: 1.2 },
            at + 5.6,
          );
      });

      s = scenes[4];
      tl = sceneTimeline(s, 10, 2.4, 0.4);
      tl.add(titleIn(s.querySelector(".display")), 0);
      tl.fromTo(
        s.querySelector(".demo-details"),
        { opacity: 0.08, rotationX: -45, transformPerspective: 900 },
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
        { opacity: 0.08, rotationX: -45, transformPerspective: 900 },
        { opacity: 1, rotationX: 0, duration: 0.8 },
        21.5,
      );

      s = scenes[6];
      tl = sceneTimeline(s, 16, 4.3, 0.29);
      tl.add(titleIn(s.querySelector(".display")), 0);
      s.querySelectorAll(".copy-step").forEach((el, i) =>
        showStep(tl, el, 2 + i * 4.3, 4.3, { last: i === 2 }),
      );
      tl.fromTo(
        s.querySelector(".operations-network"),
        { autoAlpha: 0, scale: 0.98 },
        { autoAlpha: 1, scale: 1, duration: 1.8, ease: "power1.out" },
        5.5,
      );
      tl.fromTo(
        s.querySelectorAll(".ops-label"),
        { autoAlpha: 0, rotationX: -55, transformPerspective: 800 },
        { autoAlpha: 1, rotationX: 0, duration: 1.2, stagger: 0.7 },
        6,
      );
      tl.fromTo(
        s.querySelector(".ops-readout"),
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 1.2 },
        7.7,
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
        { opacity: 0.08, rotationX: -45, transformPerspective: 900 },
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
        { opacity: 0.08, rotationX: -40, transformPerspective: 900 },
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
