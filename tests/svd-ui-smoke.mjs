import fs from 'node:fs';
import assert from 'node:assert/strict';

const ui=fs.readFileSync('svd-ui.js','utf8');
const loader=fs.readFileSync('results.js','utf8');

assert(ui.includes("document.body.classList.add('svd2-mode')"),'SVD 2.0 debe activarse como modo visual global');
assert(ui.includes('body.svd2-mode .sidebar{display:none!important}'),'La interfaz SVD 2.0 no debe depender del menú lateral');
assert(ui.includes('svd-documents')&&ui.includes('Detección de Necesidades')&&ui.includes('Plan de Capacitación')&&ui.includes('Informe de Cumplimiento'),'Debe existir panel superior de documentos');
assert(ui.includes('svd-sections'),'Debe existir una fila de pestañas de secciones');
for(const label of ['Información','Introducción','Base legal','Alineación','Metodología','Resultados','Resumen','Conclusiones','Recomendaciones','Bibliografía','Anexos','Portada','Cabecera'])assert(ui.includes(`label:'${label}'`),`Falta pestaña SVD: ${label}`);
assert(ui.includes("current==='inicio'"),'La entrada debe abandonar el dashboard Inicio');
assert(ui.includes("navigate(first.view)"),'La app debe abrir directamente el primer documento/sección disponible');
assert(ui.includes("eyebrow.textContent='DOC-CAPA'")&&ui.includes("title.textContent='Gestión documental'"),'La cabecera superior debe ser compacta e institucional');
assert(ui.includes('.svd-doc-status.done{background:var(--ok)}'),'Documento finalizado debe usar señal verde discreta');
assert(ui.includes('.svd-saved'),'Debe existir confirmación visual de acciones guardadas');
assert(loader.includes("loadScript('svd-ui.js')"),'El loader debe cargar SVD 2.0');
assert(loader.indexOf("loadScript('svd-ui.js')")>loader.indexOf("loadScript('document-layout.js')"),'SVD 2.0 debe ser la última capa visual para evitar sobrescrituras posteriores');

console.log('svd-ui-smoke: ok');
