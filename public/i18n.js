/* Torres del Norte — interruptor de idioma EN / SP.
   Traduce el texto visible en el propio navegador (sin tocar el código de la página).
   Español es el idioma original; el inglés se aplica encima y se puede revertir. */
(function () {
  'use strict';
  var DICT = {
 "Colección Residencial": "Residential Collection",
 "Historias desde arriba": "Stories from above",
 "Una diferente visión de la ciudad comienza aquí.": "A different vision of the city begins here.",
 "Dos torres se elevan sobre el paisaje, reuniendo hogares, terrazas y vidas cotidianas en una única dirección vertical. Elige una residencia. Encuentra su lugar en el edificio. Entra dentro.": "Two towers rise above the landscape, bringing together homes, terraces and everyday lives in a single vertical address. Choose a residence. Find its place in the building. Step inside.",
 "Explorar las residencias": "Explore the residences",
 "Residencias con recorrido": "Residences with a tour",
 "Visita los departamentos disponibles": "Visit the available apartments",
 "Torre 1": "Tower 1",
 "Torre 2": "Tower 2",
 "Disponible": "Available",
 "Ocupado": "Occupied",
 "Ver interior": "View interior",
 "Portada": "Cover",
 "Arquitectura / Vida / Ciudad": "Architecture / Life / City",
 "Cargando espacio": "Loading space",
 "Torres del Norte — lámina arquitectónica": "Torres del Norte — architectural plate",
 "Cerrar selección": "Close selection",
 "Torres del Norte · Edificio": "Torres del Norte · Building",
 "Torres del Norte · Revista inmobiliaria": "Torres del Norte · Real Estate Magazine",
 "Torres del Norte — Inventario Interior": "Torres del Norte — Interior Inventory",
 "Unidad": "Unit",
 "Clic para entrar": "Click to enter",
 "Plano": "Floor plan",
 "Dollhouse · en poda": "Dollhouse · being trimmed",
 "Plano editorial derivado de la planta técnica. Los ambientes visibles aquí son solo los verificados para navegación.": "Editorial floor plan derived from the technical plan. Only the rooms verified for navigation are shown here.",
 "Toca para explorar": "Tap to explore",
 "Toca en algún espacio": "Tap any space",
 "para navegar": "to navigate",
 "Detalles +": "Details +",
 "Detalles": "Details",
 "Cerrar": "Close",
 "Visor InteriorGS": "InteriorGS viewer",
 "Volver al edificio Torres del Norte": "Back to the Torres del Norte building",
 "Seleccionar unidad": "Select unit",
 "Ficha técnica de la unidad": "Unit specifications",
 "Ambientes": "Rooms",
 "Unidades": "Units",
 "Introducción editorial del ambiente": "Editorial introduction to the room",
 "Ampliar plano": "Enlarge floor plan",
 "Plano de la unidad": "Unit floor plan",
 "Herramientas": "Tools",
 "Elegir ambiente": "Choose room",
 "Seleccionar ambiente": "Select room",
 "Gemelos Digitales": "Digital Twins",
 "EL PUNTO DE ENCUENTRO DE LA VIVIENDA": "THE MEETING POINT OF THE HOME",
 "La sala concentra la actividad social del departamento y establece una relación abierta con el comedor. Un espacio pensado tanto para el uso cotidiano como para recibir, manteniendo una conexión directa con las demás áreas comunes.": "The living room concentrates the apartment's social activity and opens onto the dining room. A space designed for everyday use as well as for entertaining, while keeping a direct connection with the other common areas.",
 "UN ESPACIO QUE CONECTA": "A SPACE THAT CONNECTS",
 "Ubicado entre las principales áreas de uso diario, el comedor funciona como una extensión natural de la sala y mantiene una relación inmediata con la cocina.": "Located between the main everyday areas, the dining room works as a natural extension of the living room and stays immediately connected to the kitchen.",
 "EL ESPACIO DE TRABAJO COTIDIANO": "THE EVERYDAY WORKSPACE",
 "La cocina reúne preparación y almacenamiento dentro de un ambiente definido, conectado directamente con el comedor y próximo al resto del área social.": "The kitchen brings preparation and storage together in a defined space, directly connected to the dining room and close to the rest of the social area.",
 "UN ESPACIO PARA DESCONECTAR": "A SPACE TO UNWIND",
 "El dormitorio principal se integra a la zona privada del departamento como su principal espacio de descanso, separado de la actividad cotidiana de las áreas sociales.": "The primary bedroom sits within the apartment's private zone as its main place of rest, set apart from the daily activity of the social areas.",
 "UNA HABITACIÓN QUE PUEDE CAMBIAR CONTIGO": "A ROOM THAT CAN CHANGE WITH YOU",
 "El segundo dormitorio incorpora un espacio privado adicional que puede destinarse al descanso, recibir huéspedes o adaptarse a otras necesidades de quienes habitan el departamento.": "The second bedroom adds a private space that can be used for rest, for hosting guests, or adapted to the other needs of those who live in the apartment.",
 "LO ESENCIAL, EN UN SOLO ESPACIO": "THE ESSENTIALS, IN A SINGLE SPACE",
 "El baño reúne las funciones esenciales de uso diario dentro de un ambiente compacto y claramente organizado, integrado a la zona privada del departamento.": "The bathroom brings together the essential daily functions in a compact, clearly organized space, integrated into the apartment's private zone.",
 "UN INTERIOR CÁLIDO Y RESUELTO": "A WARM, WELL-RESOLVED INTERIOR",
 "La sala abre el recorrido por un departamento donde el almacenamiento y el mobiliario integrado forman parte de la arquitectura. El acabado cálido del piso acompaña un área social cómoda, conectada naturalmente con el comedor.": "The living room opens the tour of an apartment where storage and built-in furniture are part of the architecture. The warm flooring accompanies a comfortable social area, naturally connected to the dining room.",
 "EL CORAZÓN DEL ÁREA SOCIAL": "THE HEART OF THE SOCIAL AREA",
 "El comedor ocupa una posición central dentro de las áreas compartidas, manteniendo una relación inmediata con la sala y la cocina. La continuidad entre los ambientes permite que funcionen como un solo espacio social.": "The dining room holds a central position among the shared areas, staying immediately connected to the living room and the kitchen. The continuity between spaces lets them work as a single social space.",
 "TODO EN SU LUGAR": "EVERYTHING IN ITS PLACE",
 "La cocina continúa el carácter funcional del departamento con una importante presencia de gabinetes y superficies de trabajo. Preparación, almacenamiento y uso cotidiano se concentran en un espacio conectado directamente con el área social.": "The kitchen continues the apartment's functional character, with a strong presence of cabinets and work surfaces. Preparation, storage and everyday use are concentrated in a space directly connected to the social area.",
 "DESCANSO, TRABAJO Y PRIVACIDAD": "REST, WORK AND PRIVACY",
 "El dormitorio principal reúne varias funciones dentro de un mismo ambiente privado. Además del área de descanso, incorpora espacio de trabajo, almacenamiento integrado y conexión directa con su baño.": "The primary bedroom brings several functions together in one private space. Besides the rest area, it includes a workspace, built-in storage and a direct connection to its bathroom.",
 "MÁS QUE UN SEGUNDO DORMITORIO": "MORE THAN A SECOND BEDROOM",
 "El dormitorio secundario está planteado como un espacio completo para la vida diaria. Integra descanso, almacenamiento y una estación de trabajo propia, permitiendo estudiar o trabajar sin abandonar la privacidad de la habitación.": "The second bedroom is conceived as a complete space for daily life. It combines rest, storage and its own workstation, allowing you to study or work without leaving the privacy of the room.",
 "UN BAÑO CON CARÁCTER CONTEMPORÁNEO": "A BATHROOM WITH A CONTEMPORARY CHARACTER",
 "Integrado al dormitorio principal, este baño lleva el nivel de equipamiento del departamento también a la zona más privada. Su diseño contemporáneo y sus elementos sanitarios de apariencia tecnológica refuerzan la sensación de un interior cuidadosamente equipado.": "Connected to the primary bedroom, this bathroom carries the apartment's level of equipment into its most private zone as well. Its contemporary design and technology-inspired sanitary fixtures reinforce the feeling of a carefully equipped interior.",
 "DISEÑO HASTA EN LOS ESPACIOS COTIDIANOS": "DESIGN EVEN IN EVERYDAY SPACES",
 "El segundo baño mantiene el mismo lenguaje cuidado del departamento, resolviendo las funciones esenciales dentro de un ambiente contemporáneo y claramente organizado.": "The second bathroom keeps the apartment's same careful language, resolving the essential functions in a contemporary, clearly organized space.",
 "UNA LAVANDERÍA QUE REALMENTE TIENE ESPACIO": "A LAUNDRY ROOM WITH REAL SPACE",
 "Más que un espacio técnico reducido, la lavandería destaca por sus dimensiones y por la comodidad que ofrece para organizar las tareas domésticas. Un ambiente amplio que suma funcionalidad real al departamento.": "More than a small utility space, the laundry room stands out for its size and for the comfort it offers in organizing household tasks. A generous room that adds real functionality to the apartment.",
 "El centro social del departamento": "The social heart of the apartment",
 "Un espacio amplio y abierto que organiza la vida social de la vivienda. La sala se integra visualmente con el comedor y mantiene una circulación directa hacia el resto de las áreas comunes.": "A broad, open space that organizes the home's social life. The living room is visually integrated with the dining room and keeps direct circulation to the rest of the common areas.",
 "Entre la sala y la cocina": "Between the living room and the kitchen",
 "El comedor ocupa el punto de encuentro entre las principales áreas sociales. Su posición permite mantener una relación inmediata con la sala y la cocina, formando un ambiente continuo para el uso cotidiano.": "The dining room sits at the meeting point of the main social areas. Its position keeps it immediately connected to the living room and the kitchen, forming a continuous space for everyday use.",
 "Una cocina conectada a la vida diaria": "A kitchen connected to daily life",
 "Integrada al área social, la cocina mantiene una relación directa con el comedor y concentra las funciones de preparación y almacenamiento en un espacio claramente definido.": "Integrated with the social area, the kitchen stays directly connected to the dining room and concentrates preparation and storage functions in a clearly defined space.",
 "El espacio más privado de la vivienda": "The most private space in the home",
 "Separado de la actividad del área social, el dormitorio principal establece una zona de descanso más íntima dentro del departamento, con espacio suficiente para organizar descanso y almacenamiento.": "Set apart from the activity of the social area, the primary bedroom creates a more intimate resting zone within the apartment, with enough space to organize both rest and storage.",
 "Un espacio privado y flexible": "A private, flexible space",
 "Un segundo dormitorio que amplía las posibilidades de la vivienda. Puede funcionar como habitación permanente, dormitorio para huéspedes o adaptarse a nuevas necesidades de sus habitantes.": "A second bedroom that expands the possibilities of the home. It can serve as a permanent room, a guest bedroom, or adapt to the changing needs of its residents.",
 "Un espacio para dormir, estudiar y crecer": "A space to sleep, study and grow",
 "Una habitación pensada para admitir más de una actividad. El espacio puede combinar descanso, almacenamiento y una zona dedicada al estudio o al juego sin perder su carácter privado.": "A room designed to support more than one activity. The space can combine rest, storage and an area for study or play without losing its private character.",
 "Funcionalidad en la zona privada": "Functionality in the private zone",
 "El baño principal concentra las funciones esenciales de uso diario dentro de un ambiente compacto y directamente relacionado con la zona privada del departamento.": "The primary bathroom concentrates the essential daily functions in a compact space directly related to the apartment's private zone.",
 "Escríbenos por WhatsApp": "Message us on WhatsApp"
};
  var TERMS = {
 "Sala": "Living room",
 "Comedor": "Dining room",
 "Cocina": "Kitchen",
 "Dormitorio": "Bedroom",
 "Dormitorio principal": "Primary bedroom",
 "Dormitorio secundario": "Second bedroom",
 "Dormitorio infantil": "Kids' bedroom",
 "Baño": "Bathroom",
 "Baño principal": "Primary bathroom",
 "Baño secundario": "Second bathroom",
 "Lavandería": "Laundry room",
 "Estudio": "Study",
 "Suite": "Suite",
 "Sala TV": "TV room",
 "Área social abierta": "Open social area",
 "Integración con comedor": "Integration with the dining room",
 "Iluminación natural": "Natural light",
 "Conexión con las áreas comunes": "Connection to the common areas",
 "Integrado al área social": "Integrated with the social area",
 "Conexión con sala": "Connection to the living room",
 "Relación directa con cocina": "Direct relationship with the kitchen",
 "Área de preparación": "Preparation area",
 "Mesón de trabajo": "Work counter",
 "Espacio de almacenamiento": "Storage space",
 "Conexión con comedor": "Connection to the dining room",
 "Ventilación e iluminación": "Ventilation and lighting",
 "Área de descanso": "Rest area",
 "Zona privada": "Private zone",
 "Dormitorio independiente": "Separate bedroom",
 "Uso flexible": "Flexible use",
 "Área de ducha": "Shower area",
 "Lavamanos": "Washbasin",
 "Inodoro": "Toilet",
 "Área húmeda diferenciada": "Separate wet area",
 "Mobiliario integrado": "Built-in furniture",
 "Espacios de almacenamiento": "Storage spaces",
 "Acabado de piso de apariencia cálida": "Warm-toned flooring",
 "Integración con sala": "Integration with the living room",
 "Conexión directa con cocina": "Direct connection to the kitchen",
 "Área social continua": "Continuous social area",
 "Gabinetes integrados": "Built-in cabinets",
 "Amplio almacenamiento": "Ample storage",
 "Superficies de trabajo": "Work surfaces",
 "Baño integrado": "En-suite bathroom",
 "Workspace": "Workspace",
 "Mobiliario incorporado": "Built-in furnishings",
 "Clóset": "Closet",
 "Almacenamiento": "Storage",
 "Workspace integrado": "Built-in workspace",
 "Integrado al dormitorio principal": "Connected to the primary bedroom",
 "Ducha": "Shower",
 "Inodoro de diseño tecnológico": "Technology-forward toilet design",
 "Mobiliario de baño": "Bathroom furnishings",
 "Acabados contemporáneos": "Contemporary finishes",
 "Lavandería amplia": "Spacious laundry room",
 "Espacio para equipos": "Space for appliances",
 "Área de trabajo": "Work area",
 "Capacidad de almacenamiento": "Storage capacity",
 "Ambiente independiente": "Separate room",
 "Circulación directa hacia las áreas comunes": "Direct circulation to the common areas",
 "Conexión directa con comedor": "Direct connection to the dining room",
 "Relación abierta con sala": "Open relationship with the living room",
 "Mobiliario de almacenamiento": "Storage furniture",
 "Iluminación y ventilación": "Lighting and ventilation",
 "Zona privada del departamento": "Private zone of the apartment",
 "Posibilidad de zona de estudio": "Option for a study area",
 "Ambiente privado": "Private space"
};
  var KEY = 'tdn-lang';
  var ATTRS = ['aria-label', 'title', 'alt', 'placeholder'];
  var LETTER = /[A-Za-zÀ-ÿ]/;

  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  var RULES = [
    [/^Unidad ([0-9A-Za-z]+) · Torres del Norte$/, function (m) { return 'Unit ' + m[1] + ' · Torres del Norte'; }],
    [/^Unidad ([0-9A-Za-z]+)$/, function (m) { return 'Unit ' + m[1]; }],
    [/^USD (\d{1,3})\.(\d{3})$/, function (m) { return 'USD ' + m[1] + ',' + m[2]; }],
    [/^(\d+) habitaci(?:ón|ones)$/, function (m) { return m[1] + (m[1] === '1' ? ' bedroom' : ' bedrooms'); }],
    [/^(\d+) baños?$/, function (m) { return m[1] + (m[1] === '1' ? ' bathroom' : ' bathrooms'); }],
    [/^Recorrido · (.+)$/, function (m) { var x = own(TERMS, m[1]) ? TERMS[m[1]] : (own(DICT, m[1]) ? DICT[m[1]] : null); return x === null ? null : 'Tour · ' + x; }]
  ];

  function byRules(t) {
    for (var i = 0; i < RULES.length; i++) {
      var m = RULES[i][0].exec(t);
      if (m) { var r = RULES[i][1](m); if (r !== null && r !== undefined) return r; }
    }
    return null;
  }

  function tr(t) {                       // t: texto ya normalizado; devuelve inglés o null
    if (own(DICT, t)) return DICT[t];
    if (own(TERMS, t)) return TERMS[t];
    var r = byRules(t);
    if (r !== null) return r;
    if (t.indexOf(' · ') > -1) {         // listas "a · b · c"
      var parts = t.split(' · '), out = [];
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i], x;
        if (own(TERMS, p)) x = TERMS[p];
        else if (/^[\d\s.,²m]+$/.test(p)) x = p;
        else x = byRules(p);
        if (x === null || x === undefined) return null;
        out.push(x);
      }
      return out.join(' · ');
    }
    return null;
  }

  var lang = 'es';
  try {
    var q = new URLSearchParams(location.search).get('lang');
    lang = (q === 'en' || q === 'es') ? q : (localStorage.getItem(KEY) === 'en' ? 'en' : 'es');
  } catch (e) {}

  var textRec = new WeakMap();           // nodo de texto -> {orig, en}
  var attrRec = new WeakMap();           // elemento -> {atributo: {orig, en}}

  function syncText(n) {
    var p = n.parentNode; if (!p) return;
    var tag = p.nodeName; if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA') return;
    var v = n.nodeValue, rec = textRec.get(n);
    if (!rec || (v !== rec.orig && v !== rec.en)) {
      if (!LETTER.test(v)) { textRec.delete(n); return; }
      var e = tr(norm(v));
      var en = null;
      if (e !== null) { en = v.match(/^\s*/)[0] + e + v.match(/\s*$/)[0]; }
      rec = { orig: v, en: en }; textRec.set(n, rec);
    }
    var want = (lang === 'en' && rec.en !== null) ? rec.en : rec.orig;
    if (n.nodeValue !== want) n.nodeValue = want;
  }

  function syncAttr(el, a) {
    var v = el.getAttribute(a); if (v === null) return;
    var map = attrRec.get(el); if (!map) { map = {}; attrRec.set(el, map); }
    var rec = map[a];
    if (!rec || (v !== rec.orig && v !== rec.en)) {
      var e = LETTER.test(v) ? tr(norm(v)) : null;
      rec = { orig: v, en: e }; map[a] = rec;
    }
    var want = (lang === 'en' && rec.en !== null) ? rec.en : rec.orig;
    if (v !== want) el.setAttribute(a, want);
  }

  function walk(root) {
    if (root.nodeType === 3) { syncText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) syncText(n);
    var el = root.nodeType === 1 ? [root] : [];
    var all = (root.querySelectorAll ? root.querySelectorAll('[aria-label],[title],[alt],[placeholder]') : []);
    for (var i = 0; i < all.length; i++) el.push(all[i]);
    for (var j = 0; j < el.length; j++) for (var k = 0; k < ATTRS.length; k++) if (el[j].hasAttribute(ATTRS[k])) syncAttr(el[j], ATTRS[k]);
  }

  var CSS = '' +
    '.tdn-lang{position:absolute;top:50%;transform:translateY(-50%);display:inline-flex;align-items:center;gap:.45em;' +
    'font-size:10px;font-weight:500;line-height:1;font-family:inherit;letter-spacing:.22em;color:inherit;white-space:nowrap;pointer-events:auto;z-index:60}' +
    '.tdn-lang button{appearance:none;-webkit-appearance:none;background:none;border:0;border-bottom:1px solid transparent;margin:0;padding:10px 3px;' +
    'font:inherit;letter-spacing:inherit;color:inherit;opacity:.5;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '.tdn-lang button:hover{opacity:.85}' +
    '.tdn-lang button[aria-pressed="true"]{opacity:1;color:var(--gold,#718078);border-bottom-color:currentColor}' +
    '.tdn-lang button:focus-visible{outline:1px solid var(--gold,#718078);outline-offset:2px}' +
    '.tdn-lang span{opacity:.35}' +
    /* portada */
    '.mast{padding-right:124px!important}' +
    '.mast .tdn-lang{right:46px}' +
    '@media (max-width:860px){.mast{padding-right:112px!important}.mast .tdn-lang{right:38px}}' +
    /* interior */
    'body.editorial-interior header .tdn-lang{right:92px}' +
    '@media (min-width:821px){body.editorial-interior header{padding-right:172px}}' +
    '@media (max-width:820px){body.editorial-interior header .tdn-lang{right:50px;font-size:9px;letter-spacing:.14em;gap:.3em}}' +
    /* texto que el sitio dibuja desde CSS */
    'html[lang="en"] body.editorial-interior .rooms::before{content:"INTERIOR INVENTORY"}';

  var buttons = [];
  function paintButtons() {
    for (var i = 0; i < buttons.length; i++) buttons[i].setAttribute('aria-pressed', buttons[i].getAttribute('data-lang') === lang ? 'true' : 'false');
  }
  function setLang(l) {
    lang = l;
    try { localStorage.setItem(KEY, l); } catch (e) {}
    document.documentElement.setAttribute('lang', l);
    walk(document.documentElement);
    paintButtons();
  }
  function buildSwitch() {
    var host = document.querySelector('header'); if (!host) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var box = document.createElement('div'); box.className = 'tdn-lang'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Language / Idioma');
    function btn(code, label) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-lang', code); b.textContent = label;
      b.addEventListener('click', function (ev) { ev.stopPropagation(); setLang(code); });
      buttons.push(b); return b;
    }
    var sep = document.createElement('span'); sep.setAttribute('aria-hidden', 'true'); sep.textContent = '/';
    box.appendChild(btn('en', 'EN')); box.appendChild(sep); box.appendChild(btn('es', 'SP'));
    host.appendChild(box); paintButtons();
  }

  function start() {
    buildSwitch();
    document.documentElement.setAttribute('lang', lang);
    walk(document.documentElement);
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === 'characterData') syncText(m.target);
        else if (m.type === 'attributes') syncAttr(m.target, m.attributeName);
        else for (var j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]);
      }
    }).observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  window.__tdnI18n = { translate: function (s) { return tr(norm(s)); }, setLang: setLang, get lang() { return lang; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
