// Comprueba la sintaxis de todos los .js del proyecto (útil antes de un commit o en CI)
const { readdirSync, statSync } = require('fs');
const { join } = require('path');
const { execFileSync } = require('child_process');

const roots = ['src', 'scripts', 'public/js'];
const files = [];
const walk = (dir) => readdirSync(dir).forEach((f) => {
  const p = join(dir, f);
  if (statSync(p).isDirectory()) walk(p);
  else if (p.endsWith('.js')) files.push(p);
});
roots.forEach(walk);

let failed = 0;
for (const f of files) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  } catch (e) {
    failed += 1;
    console.error(`✗ ${f}\n${e.stderr}`);
  }
}
console.log(`${files.length - failed}/${files.length} ficheros correctos`);
process.exit(failed ? 1 : 0);
