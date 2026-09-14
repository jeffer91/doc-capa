import fs from 'node:fs';
import assert from 'node:assert/strict';

const ui=fs.readFileSync('svd-ui.js','utf8');
const loader=fs.readFileSync('results.js','utf8');

assert(ui.includes("document.body.classList.add('svd2-mode')"),'SVD 2.0 debe activarse como modo visual global');
assert(ui.includes("document.querySelector('.sidebar')?.remove()"),'La interfaz SVD 2.0 debe retirar el menú lateral heredado');
assert(ui.includes("document.getElementById('view-inicio')?.remove()"),'El dashboard Inicio no debe permanecer en el DOM final');
assert(ui.includes('svd-documents')&&ui.includes('Detección de Necesidades')&&ui.includes('Plan de Capacitación')&&ui.includes('Informe de Cumplimiento'),'Debe existir panel superior de documentos');
assert(ui.includes('svd-sections'),'Debe existir una fila de pestañas de secciones');
for(const label of ['Información','Introducción','Base legal','Alineación','Metodología','Resultados','Resumen','Conclusiones','Recomendaciones','Bibliografía','Anexos','Portada','Cabecera'])assert(ui.includes(`label:'${label}'`),`Falta pestaña SVD: ${label}`);
assert(ui.includes("current==='inicio'"),'La entrada debe reconocer y abandonar el dashboard Inicio heredado');
assert(ui.includes('go(first.view)'),'La app debe abrir directamente la primera sección disponible');
assert(ui.includes("eyebrow.textContent='DOC-CAPA'")&&ui.includes("title.textContent='Gestión documental'"),'La cabecera superior debe ser compacta e institucional');
assert(ui.includes('.svd-doc-status.done{background:var(--ok)}'),'Documento finalizado debe usar señal verde discreta');
assert(ui.includes('.svd-saved'),'Debe existir confirmación visual de acciones guardadas');
assert(ui.includes('MINIMAL_ISSUE_LIMIT=4'),'La pantalla Información debe limitar visualmente los pendientes iniciales');
assert(ui.includes('svd-issues-toggle')&&ui.includes('Ver todos los pendientes'),'Los pendientes deben poder expandirse bajo demanda');
assert(ui.includes('svd-next-step')&&ui.includes('Siguiente paso'),'Debe existir una guía compacta del siguiente paso');
assert(ui.includes('svd-primary-action'),'Debe existir una única acción primaria contextual');
assert(ui.includes("workflow-step:nth-child(-n+2){display:none}"),'La pantalla Información debe evitar métricas redundantes ya visibles en la cabecera');
assert(ui.includes("workflowUploadBtn:'Cargar datos'")&&ui.includes("workflowPdfBtn:'PDF'"),'Las acciones principales deben usar etiquetas breves');
assert(loader.includes("loadScript('svd-ui.js')"),'El loader debe cargar SVD 2.0');

console.log('svd-ui-smoke: ok');
