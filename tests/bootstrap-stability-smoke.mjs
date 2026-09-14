import fs from 'node:fs';
import assert from 'node:assert/strict';

const loader=fs.readFileSync('results.js','utf8');
const svd=fs.readFileSync('svd-ui.js','utf8');

assert(loader.includes("const BUILD_ID='")&&loader.includes('function versioned(src)'),'El loader debe versionar los módulos para evitar mezclas de caché');
assert(loader.includes("document.body.classList.add('doccapa-booting')"),'La app debe ocultar el shell heredado durante el arranque');
assert(loader.includes('Cargando DOC-CAPA'),'Debe existir un estado de carga visible y neutro');
assert(loader.includes("document.documentElement.dataset.doccapaReady!=='1'"),'El loader debe comprobar que SVD terminó realmente de inicializar');
assert(loader.includes('MODULE_TIMEOUT'),'La carga de módulos debe tener timeout');
assert(loader.includes("script.src=versioned(src)"),'Los módulos dinámicos deben usar cache-busting');

assert(svd.includes("document.documentElement.dataset.doccapaReady='1'"),'SVD debe confirmar explícitamente que terminó el arranque');
assert(svd.includes("validationListSignature"),'La compactación de pendientes debe usar una firma estable');
assert(svd.includes("validationObserver.observe(box,{childList:true})"),'El observer debe limitarse a cambios estructurales directos');
assert(!svd.includes('MutationObserver(()=>queueMicrotask(compactValidation))'),'No debe reaparecer el bucle autorreferente de microtareas');
assert(svd.includes("if(toggle.textContent!==label)toggle.textContent=label"),'La etiqueta del control de pendientes solo debe mutarse cuando cambie');

console.log('bootstrap-stability-smoke: ok');
