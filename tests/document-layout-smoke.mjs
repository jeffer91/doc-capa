import fs from 'node:fs';
import assert from 'node:assert/strict';

const layout=fs.readFileSync('document-layout.js','utf8');
const loader=fs.readFileSync('results.js','utf8');

assert(loader.includes("loadScript('document-layout.js')"),'results.js debe cargar document-layout.js');
assert(loader.indexOf("loadScript('document-layout.js')")>loader.indexOf("loadScript('official-snapshots.js')"),'La estructura documental debe cargarse al final para fijar la salida pública');
for(const view of ['view-documento-portada','view-documento-cabecera'])assert(layout.includes(view),`Falta el apartado ${view}`);
for(const label of ['Portada','Cabecera'])assert(layout.includes(`textContent='${label}'`),`Falta navegación visible para ${label}`);
assert(layout.includes('state.documentMeta'),'Portada y cabecera deben persistirse en documentMeta');
assert(layout.includes('window.drawRgiHeader=drawHeaderPdf'),'La cabecera PDF debe tener un renderer canónico');
assert(layout.includes('window.drawCover=drawCoverPdf'),'La portada PDF debe tener un renderer canónico');
assert(layout.includes('window.buildPrintDocument=buildCanonicalPrintDocument'),'La vista completa debe quedar fijada al manifiesto documental');
assert(layout.includes('window.downloadPdf=downloadCanonicalPdf'),'La descarga pública debe quedar fijada a un único punto de entrada');
assert(layout.includes("['downloadDncBtn','downloadFromPreviewBtn','workflowPdfBtn']"),'Todos los botones de PDF deben usar la misma salida pública');
assert(layout.includes('core.registerDocument'),'El manifiesto debe volver a registrarse con la portada canónica');
assert(layout.includes("id:'portada'"),'Portada debe seguir siendo una sección documental real');

console.log('document-layout-smoke: ok');
