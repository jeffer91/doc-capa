import fs from 'node:fs';
import assert from 'node:assert/strict';

const loader=fs.readFileSync('results.js','utf8');
const svd=fs.readFileSync('svd-ui.js','utf8');
const pdf=fs.readFileSync('document-pdf-engine.js','utf8');

assert(loader.includes("'document-pdf-engine.js'"),'Debe cargarse el motor PDF canónico');
assert(loader.indexOf("'document-pdf-engine.js'")<loader.indexOf("loadScript('svd-ui.js')"),'El motor PDF canónico debe quedar fijado antes de la capa SVD final');
assert(loader.includes("try{await loadScript('svd-ui.js');}"),'SVD 2.0 debe intentarse incluso cuando falle un módulo previo');

assert(svd.includes("document.querySelector('.sidebar')?.remove()"),'El shell SVD debe retirar físicamente el sidebar heredado del DOM');
assert(svd.includes("document.getElementById('view-inicio')?.remove()"),'El dashboard Inicio heredado debe retirarse del DOM');
assert(!svd.includes('body.svd2-mode .sidebar{display:none!important}'),'El sidebar ya no debe limitarse a quedar oculto por CSS');

assert(pdf.includes('window.DOC_CAPA_PDF={build:buildDocumentPdf,download:downloadDocumentPdf'),'Debe existir un motor PDF documental explícito');
assert(pdf.includes('window.downloadPdf=downloadDocumentPdf'),'La salida PDF pública debe quedar en el motor canónico');
assert(!pdf.includes('baseDownloadPdf'),'El motor canónico no debe encadenar downloadPdf heredados');
assert(!pdf.includes('specializedPdfEngine'),'El motor canónico no debe depender del PDF especializado heredado');
assert(!pdf.includes('API.save=function'),'El motor canónico no debe interceptar jsPDF.API.save');

console.log('runtime-cleanup-smoke: ok');
