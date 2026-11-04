// Lists every sentence the site can show, and reports what src/data/zh.json still lacks.
// Usage: npm run i18n            (add -- --missing to print them)
import { readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const strings = new Set();
const walkDir = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walkDir(p) : [p]; });

const looksLikeText = (s) => /^[A-Z]/.test(s) && !/^(https?:|[A-Z_]+$|M\d)/.test(s) && !/[{}]{2}|=>|\.jsx?$/.test(s);
const literal = /(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g;
const unescape = (s) => s.replace(/\\(['"`\\])/g, '$1');

for (const file of walkDir(join(root, 'src'))) {
  if (!/\.(jsx|js)$/.test(file) || /data[\\/]/.test(file)) continue;
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/\bt\(\s*(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g)) if (!m[2].includes('${')) strings.add(unescape(m[2]));
  for (const m of src.matchAll(literal)) {
    const body = unescape(m[2]);
    if (body.includes('${')) {
      // Generated sentence: `${x} of ${y} steps` becomes "{0} of {1} steps".
      let i = 0;
      const pattern = body.replace(/\$\{[^}]*\}/g, () => `{${i++}}`);
      if (/engine|progress/.test(file) && /[a-z]{3}/.test(pattern.replace(/\{\d\}/g, ''))) strings.add(pattern);
    } else if (looksLikeText(body)) strings.add(body);
  }
}

// Words that the engine puts inside its sentences.
for (const w of ['motors', 'ESC', 'flight controller', 'video system']) strings.add(w);

const SKIP = new Set(['id', 'url', 'link', 'home', 'search', 'icon', 'query', 'currency', 'sym', 'regulator', 'b', 'm', 'mcu', 'imu', 'fw', 'version', 'sz', 'cn', 'ch', 'proto', 'band', 'sys', 'chip', 'added', 'firmware', 'goal', 'personas', 'sub900', 'vtxLevel', 'cat', 'mount', 'stack', 'plug', 'conn', 'key', 'to', 'sel', 'level', 'site']);
const data = await Promise.all(['personas', 'assembly', 'troubleshoot', 'firmware', 'builds', 'regions'].map((n) => import(pathToFileURL(join(root, 'src/data', `${n}.js`)).href)));
const parts = await import(pathToFileURL(join(root, 'src/data/parts.js')).href);
const walk = (v, key) => {
  if (typeof v === 'string') { if (!SKIP.has(key) && /[A-Za-z]/.test(v) && !/^https?:/.test(v)) strings.add(v); return; }
  if (Array.isArray(v)) { v.forEach((x) => walk(x, key)); return; }
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!SKIP.has(k)) walk(x, k);
};
for (const mod of data) for (const [k, v] of Object.entries(mod)) if (typeof v !== 'function' && k !== 'LEARNING') walk(v, k);
for (const s of parts.SLOTS) { strings.add(s.label); strings.add(s.hint); }
for (const g of parts.GOALS) { strings.add(g.label); strings.add(g.label.toLowerCase()); }
for (const c of parts.COMPANIONS) strings.add(c.ros);
for (const s of ['Beginner', 'Intermediate', 'Pro', 'All']) strings.add(s);

const list = [...strings].filter((x) => !x.startsWith('/')).sort();
writeFileSync(join(root, 'scripts/i18n-strings.json'), `${JSON.stringify(list, null, 1)}\n`);
const zh = JSON.parse(readFileSync(join(root, 'src/data/zh.json'), 'utf8'));
const miss = list.filter((s) => !zh[s]);
console.log(`${list.length} strings, ${list.length - miss.length} translated, ${miss.length} missing`);
if (process.argv.includes('--missing')) console.log(miss.join('\n'));
