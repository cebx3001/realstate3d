import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { content as c } from "./content.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));
const esc = (s) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const title = (lines, tag = "h2", cls = "") =>
  `<${tag} class="display ${cls}" data-split>${lines.map((l) => `<span class="line">${esc(l)}</span>`).join("")}</${tag}>`;
const image = (name, alt, cls = "", hero = false, portrait = false) =>
  `<picture class="visual ${cls}">${!portrait ? `<source media="(max-width: 700px)" srcset="assets/${name}-mobile.webp">` : ""}<img src="assets/${name}.webp" ${!portrait ? `srcset="assets/${name}-960.webp 960w, assets/${name}.webp 1672w" sizes="100vw"` : ""} alt="${esc(alt)}" width="${portrait ? 1024 : 1672}" height="${portrait ? 1280 : 941}" loading="${hero ? "eager" : "lazy"}" ${hero ? 'fetchpriority="high"' : ""} decoding="async"></picture>`;
const heroLayers = ["blueprint", "hybrid", "real"].map((stage) =>
  `<picture class="hero-phase hero-phase-${stage}" aria-hidden="true"><source media="(max-width: 700px)" srcset="assets/hero-${stage}-mobile.webp"><img src="assets/hero-${stage}-desktop.webp" alt="" width="1440" height="810" loading="${stage === "blueprint" ? "eager" : "lazy"}" decoding="async"></picture>`
).join("");
const eyebrow = (number, text) =>
  `<p class="eyebrow"><span class="eyebrow-index">${number}</span><span>${text}</span></p>`;
const notes = `<div class="visual-caption" aria-hidden="true"><span>ESPACIO / PERSPECTIVA / EXPERIENCIA</span><span>REPRESENTACIÓN CONCEPTUAL</span></div>`;
const steps = (items, cls = "") =>
  items
    .map(
      (t, i) =>
        `<div class="copy-step ${cls}" data-step="${i}"><span class="step-marker">0${i + 1} / 0${items.length}</span>${Array.isArray(t) ? `<h3 data-split>${esc(t[0])}</h3><p>${esc(t[1])}</p>` : `<p>${esc(t)}</p>`}</div>`,
    )
    .join("");
const scene = (id, number, label, html) =>
  `<section class="scene scene-${id}" id="${id}" aria-labelledby="heading-${id}" data-label="${label}" data-number="${number}"><div class="stage">${html}</div></section>`;
const logo = readFileSync(root + "../index.html", "utf8").match(
  /<svg viewBox="139 524 784 585"[^>]*>.*?<\/svg>/,
)[0];
const chapters = [
  ["portada", "Inicio"],
  ["concepto", "El concepto"],
  ["ventas", "Comercialización"],
  ["metodos", "Creación"],
  ["demostracion", "Torres del Norte"],
  ["construccion", "Construcción"],
  ["operacion", "Operación"],
  ["contacto", "Hablemos"],
];

const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#140E21">
  <meta name="description" content="Gemelos digitales para presentar, explorar y comercializar proyectos arquitectónicos. Recorre Torres del Norte y descubre nuevas perspectivas para tu proyecto.">
  <meta property="og:title" content="Gemelos Digitales — El espacio se convierte en experiencia">
  <meta property="og:description" content="Experiencias tridimensionales para constructoras, promotoras e inmobiliarias.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://cebx3001.github.io/realstate3d/gemelos-digitales/">
  <meta property="og:image" content="https://cebx3001.github.io/realstate3d/gemelos-digitales/assets/hero-real-desktop.webp">
  <title>Gemelos Digitales — El espacio se convierte en experiencia</title>
  <link rel="icon" href="assets/symbol.svg" type="image/svg+xml">
  <link rel="preload" href="assets/manrope-latin.woff" as="font" type="font/woff" crossorigin>
  <link rel="stylesheet" href="styles.css">
  <script src="config.js" defer></script>
  <script src="vendor/gsap.min.js" defer></script>
  <script src="vendor/ScrollTrigger.min.js" defer></script>
  <script src="story.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#demostracion">Saltar a la demostración</a>
  <header class="site-header">
    <a class="header-caption" href="#portada">ARQUITECTURA<br><span>EN OTRA DIMENSIÓN</span></a>
    <a class="brand" href="#portada" aria-label="Gemelos Digitales — inicio">${logo}</a>
    <a class="header-demo" href="#demostracion"><span>EXPLORAR DEMO</span><span class="circle-arrow" aria-hidden="true">↗</span></a>
  </header>
  <div class="identity-rail" aria-hidden="true">GEMELOS DIGITALES</div>
  <main id="experiencia">
  ${scene(
    "portada",
    "01",
    "Una nueva perspectiva",
    `
    <div class="hero-sequence" aria-hidden="true">${heroLayers}</div>
    <div class="scrim"></div>
    <div class="scene-content hero-content">
      <h1 class="hero-wordmark" data-split><span class="line">GEMELOS</span><span class="line">DIGITALES</span></h1>
      ${eyebrow("01", "ESPACIOS QUE PUEDES EXPLORAR")}
      ${title(c.hero.title, "h2")}
      <div class="hero-bottom"><p class="lead">${c.hero.subtitle}</p><p class="body-copy">${c.hero.body}</p></div>
      <a class="scroll-invitation" href="#concepto"><span class="scroll-line" aria-hidden="true"></span>DESLIZA PARA DESCUBRIR <span aria-hidden="true">↓</span></a>
    </div>
    <div class="hero-coordinate" aria-hidden="true">01 — 08<br>UNA NUEVA PERSPECTIVA</div>
  `,
  )}
  ${scene(
    "concepto",
    "02",
    "El concepto",
    `
    ${image("hero-architecture", "Otra perspectiva de la arquitectura contemporánea.", "concept-visual")}
    <div class="scrim"></div>
    <div class="scene-content split-content">
      ${eyebrow("02", "QUÉ ES UN GEMELO DIGITAL")}
      ${title(c.concept.title)}
      <div class="copy-track concept-track">${steps(c.concept.steps)}</div>
    </div>
    <div class="perspective-frame" aria-hidden="true"><i></i><i></i><i></i><i></i><span>UN MISMO ESPACIO. TU PUNTO DE VISTA.</span></div>
  `,
  )}
  ${scene(
    "ventas",
    "03",
    "Comercialización",
    `
    ${image("sales-remote", "Sala de un departamento contemporáneo con vistas a la ciudad.")}
    <div class="scrim"></div>
    <div class="scene-content split-content">
      ${eyebrow("03", "COMERCIALIZACIÓN INMOBILIARIA")}
      ${title(c.sales.title)}
      <div class="copy-track sales-track">${steps(c.sales.steps)}</div>
    </div>
    <div class="sales-interface" aria-hidden="true">
      <div class="interface-panel ui-card ui-select"><div class="panel-top"><span>EXPLORA LOS ESPACIOS</span><span>↗</span></div><div class="space-options"><span class="selected">Sala</span><span>Cocina</span><span>Dormitorio</span></div><div class="panel-bottom"><i class="dot"></i> TU PRÓXIMO HOGAR, DESDE AQUÍ</div></div>
      <div class="interface-panel ui-card ui-location"><div class="panel-top"><span>SIN DISTANCIAS</span><span>◎</span></div><div class="location-path"><span>ECUADOR</span><i></i><span>EL MUNDO</span></div><p>Una propiedad. Cualquier lugar.</p></div>
      <div class="interface-panel ui-card ui-presentation"><div class="panel-top"><span>UNA EXPERIENCIA COMPARTIDA</span><span>↗</span></div><div class="presentation-icon">▱ <span>▯</span></div><p>Tu proyecto, en cada presentación.</p></div>
      <div class="interface-panel ui-card ui-plan"><div class="panel-top"><span>PLANTA / DEPARTAMENTO</span><span>＋</span></div><svg class="floorplan" viewBox="0 0 300 150" fill="none"><path d="M20 15H280V135H20Z M180 15V65H280 M180 90V135 M100 15V90H20 M100 115V135 M20 90H70 M125 90H180 M230 65V135" stroke="currentColor" stroke-width="2"/><path d="M40 28H80V60H40Z M194 25H225V48H194Z M238 25H268V48H238Z M125 35H155V70H125Z" stroke="currentColor"/><circle cx="135" cy="105" r="8" fill="#B8ADC8"/><circle cx="135" cy="105" r="15" stroke="#B8ADC8"/></svg><div class="panel-bottom"><span>Sala principal</span><span>CONTACTO COMERCIAL ↗</span></div></div>
      <span class="concept-label">INTERFAZ ILUSTRATIVA</span>
    </div>
  `,
  )}
  ${scene(
    "metodos",
    "04",
    "Cómo lo creamos",
    `
    <div class="scene-content method-heading">${eyebrow("04", "CÓMO CREAMOS LOS ESPACIOS")}${title(c.methods.title, "h2", "section-title")}</div>
    <div class="method-deck">${c.methods.steps.map((m, i) => `<article class="method-panel" data-method="${i}">${image(m[3], m[4], "method-visual", false, true)}<div class="method-shade"></div><div class="method-content"><span class="method-number">0${i + 1} <span>/ 03</span></span><h3 data-split>${m[0]}</h3><p class="method-question">${m[1]}</p><p class="body-copy">${m[2]}</p></div></article>`).join("")}</div>
  `,
  )}
  ${scene(
    "demostracion",
    "05",
    "Torres del Norte",
    `
    ${image("torres-del-norte-real", "Captura auténtica del modelo tridimensional exterior de Torres del Norte.", "demo-visual")}
    <div class="scrim"></div>
    <div class="scene-content demo-content">
      ${eyebrow("05", "UNA EXPERIENCIA REAL")}${title(c.demo.title)}
      <div class="demo-details"><p class="project-name">${c.demo.name}</p><p class="body-copy">${c.demo.body}</p><p class="demo-note">${c.demo.detail}</p><a class="button button-light tour-link" href="../">INGRESAR AL RECORRIDO <span aria-hidden="true">↗</span></a></div>
    </div>
    <div class="demo-proof"><span class="dot"></span> CAPTURA DEL PROYECTO ORIGINAL <span>CUENCA, ECUADOR</span></div>
  `,
  )}
  ${scene(
    "construccion",
    "06",
    "La evolución de una obra",
    `
    <div class="construction-images">${c.construction.steps.map((s, i) => image("build-stage-0" + (i + 1), "Etapa " + (i + 1) + ": " + s[0].toLowerCase() + ", desde la misma perspectiva.", "build-image build-" + i)).join("")}</div>
    <div class="scrim"></div>
    <div class="scene-content construction-heading">${eyebrow("06", "GEMELOS DIGITALES EN CONSTRUCCIÓN")}${title(c.construction.title, "h2", "section-title")}<p class="construction-intro">${c.construction.intro}</p></div>
    <div class="construction-timeline"><div class="build-track" aria-hidden="true"><span class="build-progress"></span>${c.construction.steps.map((s, i) => `<div class="build-tick"><span>0${i + 1}</span><i></i></div>`).join("")}</div><div class="copy-track build-copy">${steps(c.construction.steps)}</div></div>
    <p class="construction-outro">${c.construction.outro}</p>
    <span class="construction-disclaimer">SECUENCIA ARQUITECTÓNICA ILUSTRATIVA</span>
  `,
  )}
  ${scene(
    "operacion",
    "07",
    "Una nueva posibilidad",
    `
    ${image("operations", "Representación conceptual de un edificio en corte con sus espacios e instalaciones.", "operations-visual")}
    <div class="scrim"></div>
    <div class="scene-content split-content">${eyebrow("07", "GEMELOS DIGITALES OPERACIONALES")}${title(c.operations.title)}<div class="copy-track operations-track">${steps(c.operations.steps)}</div><p class="future-note">CAPACIDAD DE AMPLIACIÓN · INTEGRACIÓN A MEDIDA</p></div>
    <div class="operations-interface" aria-hidden="true"><div class="op-marker marker-1"><i></i><span>CLIMATIZACIÓN</span></div><div class="op-marker marker-2"><i></i><span>CÁMARAS</span></div><div class="op-marker marker-3"><i></i><span>ACCESOS</span></div><div class="interface-panel operations-panel"><div class="panel-top"><span>VISIÓN DEL EDIFICIO</span><span>◎</span></div><div class="system-row"><span>Temperatura</span><span>22 °C</span></div><div class="system-row"><span>Accesos</span><span>Planta baja</span></div><div class="system-row"><span>Instalaciones</span><span>Por nivel</span></div><div class="panel-bottom">DATOS ILUSTRATIVOS · POSIBLE INTEGRACIÓN</div></div></div>
  `,
  )}
  ${scene(
    "contacto",
    "08",
    "Tu próximo proyecto",
    `
    <div class="closing-glow" aria-hidden="true"></div>
    <div class="scene-content closing-content">${eyebrow("08", "HAGAMOS VISIBLE LO QUE IMAGINAS")}${title(c.closing.title)}<div class="closing-bottom"><div class="closing-copy"><p class="lead">${c.closing.body}</p><p class="body-copy">${c.closing.detail}</p></div><div class="closing-actions"><a class="button button-light contact-link" href="https://wa.me/593992730095?text=Hola%2C%20me%20interesa%20crear%20un%20gemelo%20digital%20para%20mi%20proyecto.">HABLEMOS DE TU PROYECTO <span aria-hidden="true">↗</span></a><a class="button button-outline tour-link" href="../">VER DEMOSTRACIÓN <span aria-hidden="true">↗</span></a></div></div><p class="price-note">${c.closing.price}</p></div>
  `,
  )}
  </main>
  <footer class="story-hud"><span class="current-chapter"><span id="chapter-number">01</span><span class="hud-divider"></span><span id="chapter-name">Una nueva perspectiva</span></span><nav class="chapter-nav" aria-label="Capítulos">${chapters.map(([id, label], i) => `<a href="#${id}" aria-label="${String(i + 1).padStart(2, "0")}. ${label}" ${i === 0 ? 'aria-current="location"' : ""}><span></span></a>`).join("")}</nav><button class="motion-toggle" type="button" aria-pressed="false"><span class="motion-icon" aria-hidden="true">Ⅱ</span><span class="motion-label">PAUSAR MOVIMIENTO</span></button></footer>
  <div class="reading-progress" aria-hidden="true"><span></span></div>
</body>
</html>`;
let finalHtml = html;
const icon = (path) =>
  `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${path}</svg>`;
finalHtml = finalHtml
  .replaceAll("↗", icon('<path d="M5 19 19 5M5 5h14v14"/>'))
  .replaceAll("↓", icon('<path d="M12 3v18m-7-7 7 7 7-7"/>'))
  .replaceAll(
    "◎",
    icon('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>'),
  )
  .replaceAll("＋", icon('<path d="M12 4v16M4 12h16"/>'))
  .replace(
    "▱ <span>▯</span>",
    `<svg viewBox="0 0 180 80" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="20" y="8" width="100" height="57" rx="2"/><path d="M5 72h130M55 65v7M85 65v7"/><rect x="135" y="22" width="30" height="50" rx="3"/></svg>`,
  );
for (const [id] of chapters) {
  const start = finalHtml.indexOf(`id="${id}"`);
  const h = finalHtml.indexOf("<h", start);
  const close = finalHtml.indexOf(" ", h);
  finalHtml =
    finalHtml.slice(0, close) + ` id="heading-${id}"` + finalHtml.slice(close);
}
writeFileSync(root + "index.html", finalHtml);
writeFileSync(
  root + "assets/symbol.svg",
  logo
    .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')
    .replace("currentColor", "#F4F1F7"),
);
console.log("index.html generado desde content.mjs; ocho escenas estáticas.");
