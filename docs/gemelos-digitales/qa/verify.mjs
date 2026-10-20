import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { content } from '../content.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = readFileSync(root + 'index.html', 'utf8');
const story = readFileSync(root + 'story.js', 'utf8');
const normalize = text => text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const pageText = normalize(html);
const context = { window: {} };
vm.runInNewContext(readFileSync(root + 'config.js', 'utf8'), context);
const config = context.window.GEMELOS_CONFIG;
assert.equal((html.match(/<section class="scene /g) || []).length, 8, 'Ocho escenas');
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'Un único h1');
for (const scene of Object.values(content)) {
  assert(pageText.includes(scene.title.join(' ')), `Falta titular: ${scene.title}`);
  for (const key of ['subtitle', 'body', 'detail', 'name', 'intro', 'outro', 'price']) {
    if (scene[key]) assert(pageText.includes(scene[key]), `Falta contenido: ${scene[key]}`);
  }
  for (const step of scene.steps || []) {
    for (const text of (Array.isArray(step) ? step.slice(0, 3) : [step])) {
      assert(pageText.includes(text), `Falta texto definitivo: ${text}`);
    }
  }
}
for (const match of html.matchAll(/(?:src|href)="((?:assets|vendor)\/[^"?#]+)"/g)) {
  assert(existsSync(root + match[1]), `Recurso ausente: ${match[1]}`);
}
for (const match of html.matchAll(/srcset="([^"]+)"/g)) {
  for (const source of match[1].split(',')) assert(existsSync(root + source.trim().split(' ')[0]));
}
assert(!/<iframe\b|<canvas\b|modulepreload|\.sog|v1-streamed|\/viewers\//.test(html + story), 'La landing no debe cargar el visor ni sus modelos');
assert.equal(config.tourUrl, '../');
assert.equal(new URL(config.tourUrl, 'https://cebx3001.github.io/realstate3d/gemelos-digitales/').href, 'https://cebx3001.github.io/realstate3d/');
assert(config.contact.verified && /^\d{8,15}$/.test(config.contact.phone), 'El contacto debe estar validado');
console.log('OK: ocho escenas, texto editorial, recursos, aislamiento del tour, subdirectorio Pages y contacto validado.');
