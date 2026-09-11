import fs from 'node:fs';
import assert from 'node:assert/strict';

const layout=fs.readFileSync('document-layout.js','utf8');
const pdf=fs.readFileSync('document-pdf-engine.js','utf8');
const loader=fs.readFileSync('results.js','utf8');

assert(loader.includes("'document-layout.js'"),'results.js debe cargar document-layout.js');
assert(loader.indexOf("'document-layout.js'")>loader.indexOf("'official-snapshots.js'"),'La estructura documental debe cargarse después de snapshots');
assert(loader.indexOf("'document-pdf-engine.js'")>loader.indexOf("'document-layout.js'"),'El motor PDF final debe cargarse después de Portada/Cabecera');
for(const view of ['view-documento-portada','view-documento-cabecera'])assert(layout.includes(view),`Falta el apartado ${view}`);
for(const label of ['Portada','Cabecera'])assert(layout.includes(`textContent='${label}'`),`Falta navegación de compatibilidad para ${label}`);
assert(layout.includes('state.documentMeta'),'Portada y cabecera deben persistirse en documentMeta');
assert(layout.includes('window.drawRgiHeader=drawHeaderPdf'),'La cabecera PDF debe tener un renderer canónico');
assert(layout.includes('window.drawCover=drawCoverPdf'),'La portada PDF debe tener un renderer canónico');
assert(layout.includes('window.buildPrintDocument=buildCanonicalPrintDocument'),'La vista completa debe quedar fijada al manifiesto documental');
assert(layout.includes('core.registerDocument'),'El manifiesto debe volver a registrarse con la portada canónica');
assert(layout.includes("id:'portada'"),'Portada debe seguir siendo una sección documental real');
assert(pdf.includes('window.downloadPdf=downloadDocumentPdf'),'La descarga pública final debe pertenecer al motor PDF documental');
assert(pdf.includes("['downloadDncBtn','downloadFromPreviewBtn','workflowPdfBtn']"),'Todos los botones de PDF deben enlazarse al motor final');

console.log('document-layout-smoke: ok');
