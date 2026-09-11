import fs from 'node:fs';
import assert from 'node:assert/strict';

const layout=fs.readFileSync('document-layout.js','utf8');
const pdf=fs.readFileSync('document-pdf-engine.js','utf8');
const loader=fs.readFileSync('results.js','utf8');

const layoutIndex=loader.indexOf("'document-layout.js'");
const pdfIndex=loader.indexOf("'document-pdf-engine.js'");
assert(layoutIndex>=0,'document-layout.js debe existir en el loader');
assert(pdfIndex>layoutIndex,'document-pdf-engine.js debe fijar la salida después de document-layout.js');
assert(loader.indexOf("'document-layout.js'",layoutIndex+1)===-1,'document-layout.js debe cargarse una sola vez');
assert(loader.indexOf("'document-pdf-engine.js'",pdfIndex+1)===-1,'document-pdf-engine.js debe cargarse una sola vez');
for(const legacy of ["'summary.js'","'conclusions.js'","'recommendations.js'","'bibliography.js'","'annexes.js'"]){
  assert(loader.indexOf(legacy)<pdfIndex,`Ningún módulo documental heredado debe cargarse después del motor PDF final: ${legacy}`);
}
assert(layout.includes('window.buildPrintDocument=buildCanonicalPrintDocument'),'La vista completa debe terminar en el manifiesto canónico');
assert(pdf.includes('window.DOC_CAPA_PDF={build:buildDocumentPdf,download:downloadDocumentPdf'),'Debe existir una API documental PDF explícita');
assert(pdf.includes('window.downloadPdf=downloadDocumentPdf'),'La API pública de PDF debe terminar en el motor documental canónico');
assert(!pdf.includes('specializedPdfEngine'),'El motor final no debe congelar ni reutilizar la cadena PDF heredada');

console.log('legacy-public-entry-smoke: ok');
