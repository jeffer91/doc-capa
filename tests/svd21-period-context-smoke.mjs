import fs from 'node:fs';
import assert from 'node:assert/strict';

const periods=fs.readFileSync('periods-global.js','utf8');
const guard=fs.readFileSync('context-guard.js','utf8');
const loader=fs.readFileSync('results.js','utf8');

assert(periods.includes("const CATALOG_KEY='doc-capa-period-catalog-v3'"),'Debe existir un catálogo de períodos separado de los datos documentales');
assert(periods.includes("const DATA_PREFIX='doc-capa-period-data-v3:'"),'Cada período debe persistir sus datos en un contexto separado');
assert(periods.includes('let selectedId=null'),'La aplicación debe iniciar sin período seleccionado');
assert(periods.includes('Seleccionar período'),'El selector debe ofrecer un estado inicial vacío');
assert(periods.includes('id="createPeriodPlus"')&&periods.includes('aria-label="Crear período"'),'Debe existir el botón + identificado para crear períodos');
assert(periods.includes('periodCreateDialog')&&periods.includes('Crear período académico'),'La creación debe abrir un diálogo dedicado');
assert(periods.includes('doccapa-no-period')&&periods.includes('Selecciona un período para continuar'),'Sin período debe mostrarse un estado vacío documental');
assert(periods.includes('globalStateSnapshot')&&periods.includes('localStorage.setItem(STORAGE_KEY'),'El estado global persistido no debe restaurar automáticamente un contexto documental');
assert(periods.includes('busyCount>0')&&periods.includes('Espera a que termine la carga actual'),'No se debe permitir cambiar de período durante una operación contextual');
assert(guard.includes("readExcel=async function"),'Las lecturas Excel deben quedar protegidas por contexto');
assert(guard.includes('current!==periodId'),'La carga debe verificar que el período no cambió durante la operación');
assert(guard.includes('periods.beginAsync')&&guard.includes('periods.endAsync'),'La operación debe bloquear temporalmente el cambio de período');
assert(loader.includes("'periods-global.js',\n    'context-guard.js',"),'El guard debe cargarse inmediatamente después del gestor de períodos');

console.log('svd21-period-context-smoke: ok');
