# Gemelos Digitales

Landing estática independiente para `https://cebx3001.github.io/realstate3d/gemelos-digitales/`.

## Edición y vista previa

Desde este directorio:

```sh
node render.mjs
node qa/verify.mjs
```

`index.html` está incluido y funciona sin compilación en GitHub Pages. `content.mjs` contiene todo el guion; `render.mjs` regenera el HTML semántico y copia el símbolo original del proyecto. `config.js` configura el contacto y el enlace del recorrido. El número comercial fue confirmado explícitamente para Gemelos Digitales el 20 de octubre de 2026.

Para previsualizar desde la raíz del repositorio:

```sh
python -m http.server 4173 --directory public
```

Abrir `http://localhost:4173/gemelos-digitales/`.

## Movimiento y accesibilidad

`story.js` crea ocho timelines independientes con GSAP 3.13.0 y ScrollTrigger. Los caracteres usan una semilla derivada del texto, orden de entrada reproducible y transformaciones 3D. Las imágenes, los textos y los elementos de interfaz tienen sus propias secuencias. Todo el movimiento narrativo depende directamente del scroll (`scrub: true`), sin reproducción autónoma ni scroll artificial.

Cada escena tiene intervalos de lectura. Los accesos del encabezado y los ocho marcadores inferiores llevan a un punto legible de cada capítulo. El botón de pausa devuelve la página a su disposición estática y recuerda la preferencia durante la sesión. `prefers-reduced-motion`, pantallas de menos de 550 px de alto y teléfonos de menos de 620 px de alto usan la versión estática. Si GSAP o JavaScript no están disponibles, siguen apareciendo el guion completo y los enlaces.

Los titulares conservan un único texto semántico; las letras decorativas tienen `aria-hidden`. El foco de teclado revela los CTA dentro de las escenas. No se secuestra la rueda, el gesto táctil ni las teclas de navegación.

## Imágenes e independencia del tour

`assets/` incluye 11 imágenes principales y variantes WebP para escritorio y teléfono, aproximadamente 3,5 MB en conjunto. Solo la portada tiene prioridad alta; las demás imágenes usan carga diferida. Las cuatro fases de construcción utilizan como referencia la misma imagen del edificio terminado y el mismo recorte en cada formato. Son visualizaciones ilustrativas, como lo señala la página. La escena operacional representa una posible ampliación, no una integración existente.

`torres-del-norte-real.webp` procede de una captura real del visor exterior. Se ocultaron las superposiciones únicamente en el navegador de captura. No se editaron los archivos, modelos ni configuraciones de cámara del recorrido. El enlace `../` abre la experiencia existente en la misma pestaña. La landing no incluye iframes, modelos, scripts del tour ni precarga del recorrido. El manifiesto `assets/provenance.json` documenta la procedencia.

La fuente Manrope y las bibliotecas GSAP se sirven localmente. Sus avisos y licencias se conservan en `assets/Manrope-OFL.txt` y en los encabezados de `vendor/`.

## Comprobación visual

`qa/index.html` reúne capturas reales de escritorio y teléfono de las ocho escenas. `qa/report.json` registra las pruebas de renderizado, recursos, ausencia de solicitudes 3D, sincronización de estados y pausa/reanudación. `qa/interactions.json` incluye navegación al tour, regreso del navegador, reversibilidad de las letras y resultados de axe para WCAG 2 A/AA y 2.1 AA. La comprobación automatizada complementa la revisión visual, no representa una certificación de accesibilidad.

Se revisaron Chromium a 1440×900, 390×844, 375×667, 320×568 y 844×390, además de movimiento reducido y JavaScript desactivado. Las medidas móviles son emulación de viewport y entrada táctil; no se ha probado en dispositivos físicos ni Safari.

Para repetir las capturas, con Python y Playwright disponibles:

```sh
python qa/browser-check.py http://localhost:4173/gemelos-digitales/ /tmp/gemelos-qa
```

## Publicación

El workflow existente `.github/workflows/pages.yml` publica `public/` al actualizar `main`. Los cambios de esta landing están contenidos únicamente en `public/gemelos-digitales/`. El tour raíz, sus visores, su inventario y el workflow permanecen intactos.
