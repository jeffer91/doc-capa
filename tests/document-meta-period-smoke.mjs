import fs from 'node:fs';
import assert from 'node:assert/strict';

const layout=fs.readFileSync('document-layout.js','utf8');
const governance=fs.readFileSync('institutional-governance.js','utf8');
assert(layout.includes('state.documentMeta'),'La estructura documental debe vivir en documentMeta');
assert(governance.includes('documentMeta:clone(state.documentMeta||{})'),'El contexto por período debe capturar documentMeta');
assert(governance.includes('state.documentMeta=clone(ctx.documentMeta||{})'),'Al cambiar período debe restaurarse documentMeta');
assert(layout.includes("window.addEventListener('doccapa:period-changed'"),'La UI documental debe refrescarse al cambiar de período');
console.log('document-meta-period-smoke: ok');
