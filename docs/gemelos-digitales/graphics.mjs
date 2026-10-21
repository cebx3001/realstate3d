/* Geometry explains the four selling contexts; no decorative panels or random routes. */
const svg = body => `<svg viewBox="0 0 640 430" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const graphics = [
  ['PREVENTA / ANTES DE LA ENTREGA', svg(`
    <g class="architecture-solid"><path d="M167 368V202H452V368M167 368H490M196 368V326H236V368M271 368V326H315V368M348 368V326H422V368"/>
    <path d="M167 264H452M167 313H452M186 219H248V251H186ZM278 219H340V251H278ZM369 219H431V251H369ZM186 277H248V301H186ZM369 277H431V301H369Z"/>
    <path d="M278 277H340V301H278Z" fill="currentColor" fill-opacity=".28"/>
    </g><g stroke-dasharray="5 6" opacity=".65"><path d="M167 202V90H452V202M167 144H452M186 106H248V132H186ZM278 106H340V132H278ZM369 106H431V132H369ZM186 161H248V189H186ZM278 161H340V189H278ZM369 161H431V189H369Z"/></g>
    <path d="M495 368V48H95M482 48V73H530L495 48M109 48V127M98 127Q109 143 120 127M495 48L335 18L95 48M335 18V48M495 48L530 73" opacity=".7"/>
    <path d="M309 289L361 255H524"/><circle cx="309" cy="289" r="5" fill="currentColor"/>
    <text x="408" y="243" class="svg-label">TU FUTURO HOGAR</text>
    <text x="170" y="405" class="svg-label">EXPLORABLE ANTES DE CONSTRUIRSE</text>`)],
  ['COMPRADORES / SIN DISTANCIAS', svg(`
    <circle cx="320" cy="215" r="163" opacity=".45"/>
    <g fill="currentColor" fill-opacity=".08" stroke-width="1.4"><path d="M208 93L242 69L279 72L287 90L265 112L247 113L255 133L241 156L255 171L250 190L272 207L271 221L255 217L237 197L225 181L205 171L204 152L184 142L185 119Z"/>
    <path d="M272 218L301 220L322 242L317 263L301 281L295 306L282 335L272 339L269 314L257 285L248 259L250 235Z"/>
    <path d="M366 86L397 89L420 110L442 123L449 151L431 167L410 156L390 174L380 160L362 165L350 144L334 139L336 116L354 109Z"/>
    <path d="M357 177L383 175L399 193L394 220L378 242L368 263L353 258L347 234L331 216L335 193Z"/>
    <path d="M415 272L443 265L455 285L449 302L421 307L405 291Z"/></g>
    <path class="journey-path" d="M257 240Q163 177 223 154" stroke-width="3"/>
    <path class="journey-path" d="M257 240Q316 92 366 131" stroke-width="1.5" opacity=".65"/>
    <circle cx="257" cy="240" r="6" fill="currentColor"/><circle cx="223" cy="154" r="5" fill="currentColor"/><circle cx="366" cy="131" r="4" fill="currentColor"/>
    <text x="153" y="139" class="svg-label">ESTADOS UNIDOS</text><text x="273" y="258" class="svg-label">ECUADOR</text>
    <text x="198" y="414" class="svg-label">UN ENLACE. CUALQUIER LUGAR.</text>`)],
  ['PRESENTACIONES / UNA EXPERIENCIA COMPARTIDA', svg(`
    <g class="presentation-building"><path d="M182 237V103L314 56L456 102V235L317 289Z M182 103L317 151L456 102M317 151V289M182 148L317 196L456 149M182 192L317 242L456 191"/>
    <path d="M203 124V142M237 137V154M276 150V170M203 170V186M237 180V199M276 195V211M342 155V182M376 144V167M415 131V153M342 205V227M376 192V215M415 180V201" opacity=".5"/>
    </g><g stroke-width="2.4"><circle cx="107" cy="224" r="14"/><path d="M85 308V270Q85 247 107 247Q126 248 138 263L172 249M103 276V349M103 307L126 349M87 273L70 303"/>
    <circle cx="241" cy="330" r="16"/><path d="M209 392V374Q209 350 241 350Q273 350 273 374V392"/>
    <circle cx="343" cy="335" r="16"/><path d="M311 397V379Q311 355 343 355Q375 355 375 379V397"/>
    <circle cx="445" cy="330" r="16"/><path d="M413 392V374Q413 350 445 350Q477 350 477 374V392"/></g>`)],
  ['EXPLORACIÓN / CADA AMBIENTE A TU ALCANCE', svg(`
    <g stroke-width="4"><path d="M120 74H520V352H120V74M120 204H264V74M264 204V257M264 307V352M376 74V207M376 257V352M376 207H520"/></g>
    <g stroke-width="1.3" opacity=".7"><path d="M120 204H173M223 204H264M173 204V154A50 50 0 0 1 223 204M264 257H314A50 50 0 0 1 264 307M376 207H426A50 50 0 0 1 376 257"/>
    <path d="M140 94H242V146H140ZM143 98H183V115H143ZM197 98H237V115H197ZM394 94H500V161H394ZM400 99H439V121H400ZM454 99H494V121H454Z"/>
    <path d="M137 231H158V310H227V331H137ZM287 113H350V177H287ZM403 284H487V329H403ZM396 263H495V277H396Z"/>
    <circle cx="319" cy="145" r="17"/></g>
    <path class="floor-route" d="M319 335V240Q319 220 294 220H239Q220 220 220 250V276" stroke-dasharray="3 8" stroke-width="2.5"/>
    <circle cx="220" cy="276" r="15"/><circle cx="220" cy="276" r="5" fill="currentColor"/>
    <text x="178" y="401" class="svg-label">PLANOS / RECORRIDOS / INFORMACIÓN</text>`)]
];
export const salesGraphics = `<div class="sales-interface editorial-graphics" aria-hidden="true">${graphics.map(([label,drawing],i)=>`<div class="sales-graphic sales-graphic-${i}"><span class="graphic-index">0${i+1} / ${label}</span>${drawing}</div>`).join('')}</div>`;
const icons={
 camera:'<path d="M3 8h12v9H3zM15 10l6-3v11l-6-3M7 17v4m-3 0h8"/>',
 sensor:'<path d="M10 5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0V5Zm2 4v8m-6-10H3m3 5H3"/>',
 climate:'<path d="M12 3v18M4 7l16 10M4 17 20 7M9 5l3 3 3-3M9 19l3-3 3 3M5 10l4-1V5M15 19v-4l4-1"/>',
 access:'<path d="M5 21V3h13v18M2 21h20M10 3v18m4-10v3"/>',
 systems:'<path d="M4 3v8h8v10M20 3v8h-8M7 6H1m16 0h6M9 16h6"/>'
};
const markers=[
 ['climate','CLIMATIZACIÓN','Equipos de cubierta','0.60,0.075','0.47,0.22'],
 ['sensor','SENSORES','Ambientes interiores','0.62,0.31','0.40,0.39'],
 ['camera','CÁMARAS','Circulación y seguridad','0.47,0.75','0.47,0.68'],
 ['access','ACCESOS','Ingreso al edificio','0.46,0.82','0.47,0.73'],
 ['systems','INSTALACIONES','Redes por nivel','0.73,0.55','0.72,0.57']
];
export const operationsGraphics=`<div class="operations-interface spatial-overlay" aria-hidden="true">${markers.map(([id,label,note,desktop,mobile])=>`<div class="spatial-marker spatial-${id}" data-desktop="${desktop}" data-mobile="${mobile}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">${icons[id]}</svg><span>${label}<small>${note}</small></span></div>`).join('')}</div>`;
