import fs from 'node:fs';
import assert from 'node:assert/strict';

const workbench=fs.readFileSync('template-workbench.js','utf8');

assert(workbench.includes('template-workbench-table'),'Información debe renderizar una tabla real de plantillas');
assert(workbench.includes('<th>#</th><th>Plantilla / información</th><th>Descargar plantilla</th><th>Subir plantilla</th><th>Datos subidos</th>'),'La tabla debe conservar las cinco columnas operativas');
assert(workbench.includes("label:'Carreras del período'"),'Debe existir la fila de carreras');
assert(workbench.includes("label:'Necesidades por carrera'"),'Debe existir la fila de necesidades por carrera');
assert(workbench.includes("label:'Resultados de encuesta para Anexo 5'"),'Debe conservarse la duodécima carga');
assert((workbench.match(/correction:'#|correction:'\[/g)||[]).length===12,'La tabla debe contener exactamente 12 cargas del DNC');
assert(workbench.includes("const uploadLabel=loaded?'Reemplazar':'Subir'"),'Una carga existente debe ofrecer Reemplazar en lugar de Subir');
assert(workbench.includes('Cargado · ${countLabelFor(def)}'),'El estado debe mostrar cantidad real de datos cargados');
assert(workbench.includes('Descargar corrección'),'Las filas con errores deben permitir descargar la corrección desde el estado');
assert(workbench.includes("panel.classList.add('open')"),'La tabla debe quedar visible directamente en Información');
assert(workbench.includes("steps.insertAdjacentElement('afterend',panel)"),'La tabla debe ubicarse inmediatamente después del resumen superior');
assert(workbench.includes("#view-dnc-operacion #workflowDownloadBtn,#view-dnc-operacion #workflowUploadBtn{display:none!important}"),'No debe mantenerse un botón intermedio para abrir las plantillas');

console.log('template-table-smoke: ok');
