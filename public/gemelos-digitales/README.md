# Gemelos Digitales

Landing estática independiente: https://cebx3001.github.io/realstate3d/gemelos-digitales/

## Edición

`content.mjs` contiene el guion, `graphics.mjs` las ilustraciones SVG y los puntos operacionales, `render.mjs` genera el HTML semántico. `styles.css` conserva la base editorial y `cinematic.css` define la secuencia revisada y sus adaptaciones. `fonts.css` sirve Archivo Black, Space Grotesk y DM Sans localmente, con sus licencias OFL en `assets/`.

```sh
node public/gemelos-digitales/render.mjs
node public/gemelos-digitales/qa/verify.mjs
python -m http.server 4174 --directory public
```

El HTML está incluido: GitHub Pages no necesita compilación. `config.js` configura WhatsApp y el enlace del recorrido. El contacto +593 99 273 0095 fue confirmado expresamente por el usuario.

## Secuencia y tipografía

Ocho escenas con GSAP 3.13.0 y ScrollTrigger locales, `pin` y `scrub: true`. No hay reproducción autónoma de la narración. Cada escena contiene secuencias independientes de imágenes, letras e información.

La portada utiliza 26 unidades de progreso: apertura 0–3; aparición del blueprint 3–6 y lectura hasta 9; materialización y transferencia de las 16 letras entre 9–14; aparición comercial desde 15; lectura completa desde 19 hasta 23; salida 23–26. Los valores representan desplazamiento, no segundos. El rótulo lateral no se anima como bloque: cada carácter corresponde al mismo índice del título horizontal y comparte su intervalo de salida/entrada. La inversión del scroll reconstruye la secuencia.

Los caracteres conservan su caja tipográfica desde el inicio. Solo cambian rotación local X/Y, profundidad Z, opacidad y desenfoque moderado en escritorio. No cambian X/Y, escala, rotación Z, interletrado ni posición de los titulares. La perspectiva se aplica individualmente, con origen central. Las letras visuales llevan `aria-hidden`; cada titular conserva una única copia semántica.

El botón de pausa muestra todo el contenido y conserva la preferencia durante la sesión. Movimiento reducido, teléfonos de menos de 620 px de alto y ventanas de menos de 550 px de alto utilizan una versión estática legible. No se interceptan la rueda ni los gestos táctiles. Los CTA de teclado revelan su escena y los enlaces de capítulo saltan a intervalos de lectura.

## Imágenes y gráficos

La portada usa cuatro WebP: blueprint y render en horizontal y vertical. El blueprint es una única perspectiva arquitectónica general, sin planos complementarios. El render se materializó a partir de esa geometría para registrar el fundido.

La construcción tiene cuatro estados horizontales y cuatro verticales. La serie vertical se creó desde una toma propia del edificio terminado; no son recortes de las imágenes horizontales. Cada orientación mantiene su cámara y entorno. Los estados se revelan con máscaras de scroll, en contextos de apilado aislados. La comprobación detecta qué imagen queda efectivamente por encima, además de su opacidad y texto.

Operación utiliza composiciones independientes para escritorio y móvil. Sus cinco indicadores corresponden a equipos de cubierta, ambientes, seguridad, entrada y redes verticales. Las coordenadas normalizadas se adaptan al mismo `object-fit: cover` de la imagen, evitando que los marcadores se separen de la arquitectura al cambiar el viewport. Es una capacidad futura, señalada en el contenido.

Las fuentes y los recursos visuales son locales. Las imágenes posteriores se cargan al aproximarse a su escena. `assets/provenance.json` documenta su procedencia. No hay texto ni interfaz incrustados en las imágenes generadas.

## Torres del Norte

Se conserva la captura auténtica y el enlace `../` en la misma pestaña. La landing no incluye el visor, modelos, inventario ni scripts del tour. Ningún archivo del recorrido original ha sido modificado.

## Validación

`qa/index.html` reúne capturas reales de Chromium. `qa/report.json` registra recursos, fases de portada, sincronización de caracteres, apilado y reversibilidad de las cuatro etapas, pausa y reanudación, movimiento reducido y JavaScript desactivado. `qa/typography.json` comprueba 13 posiciones de scroll por escena en dos viewports. `qa/interactions.json` registra navegación, regreso del navegador y axe WCAG 2 A/AA y 2.1 AA.

```sh
python public/gemelos-digitales/qa/browser-check.py http://localhost:4174/gemelos-digitales/ /tmp/gemelos-qa
python public/gemelos-digitales/qa/typography-check.py http://localhost:4174/gemelos-digitales/ /tmp/gemelos-type
```

Viewports revisados: 1440×900, 390×844, 375×667, 320×568 y 844×390. Las pruebas móviles emulan viewport y entrada táctil en Chromium; no constituyen pruebas en Safari o dispositivos físicos ni una certificación de accesibilidad.

## Publicación

La fuente principal es `public/gemelos-digitales/` y el workflow existente publica `public/`. El repositorio conserva además una fuente Pages legacy en `main:/docs`; su copia ya existente `docs/gemelos-digitales/` se sincroniza con la landing para que ambos mecanismos sirvan el mismo resultado. No se modifican el workflow, la configuración Pages ni los archivos del tour. Si Pages pasa exclusivamente a GitHub Actions, puede retirarse esa copia en una tarea posterior.
