import fs from 'node:fs';
import assert from 'node:assert/strict';

const layout=fs.readFileSync('document-layout.js','utf8');
const loader=fs.readFileSync('results.js','utf8');
const index=loader.lastIndexOf("loadScript('document-layout.js')");
assert(index>=0,'document-layout.js debe existir en el loader');
assert(index===loader.lastIndexOf("loadScript('document-layout.js')"),'document-layout.js debe cargarse una sola vez');
assert(!loader.slice(index).includes("loadScript('summary.js')"),'Ningún módulo documental heredado debe cargarse después de document-layout.js');
assert(layout.includes("const specializedPdfEngine=typeof window.downloadPdf==='function'?window.downloadPdf:null"),'El motor especializado debe congelarse antes de exponer la salida final');
assert(layout.includes('window.downloadPdf=downloadCanonicalPdf'),'La API pública de PDF debe terminar en la salida canónica');
assert(layout.includes('window.buildPrintDocument=buildCanonicalPrintDocument'),'La vista completa debe terminar en el manifiesto canónico');
console.log('legacy-public-entry-smoke: ok');
