import fs from 'node:fs';
import assert from 'node:assert/strict';

for(const file of ['summary.js','conclusions.js','recommendations.js']){
  const src=fs.readFileSync(file,'utf8');
  assert(src.includes('window.DOC_CAPA_DNC'),`${file} debe consumir DOC_CAPA_DNC`);
  assert(!src.includes('baseDownloadPdf'),`${file} no debe encadenar el PDF heredado`);
  assert(!src.includes('jsPDF?.API'),`${file} no debe interceptar jsPDF.API`);
  assert(!src.includes('buildPrintDocument=function'),`${file} no debe reescribir la vista completa`);
}

const conclusions=fs.readFileSync('conclusions.js','utf8');
const recommendations=fs.readFileSync('recommendations.js','utf8');
const summary=fs.readFileSync('summary.js','utf8');
assert(!conclusions.includes('function clusters('),'Conclusiones no debe recalcular clusters localmente');
assert(!recommendations.includes('function institutionalClusters('),'Recomendaciones no debe recalcular clusters localmente');
assert(!summary.includes('function institutionalClusters('),'Resumen no debe recalcular clusters localmente');

const loader=fs.readFileSync('results.js','utf8');
assert(loader.indexOf("'dnc-calculations.js'")<loader.indexOf("'summary.js'"),'Los cálculos canónicos deben cargarse antes del Resumen');
assert(loader.indexOf("'dnc-calculations.js'")<loader.indexOf("'conclusions.js'"),'Los cálculos canónicos deben cargarse antes de Conclusiones');
assert(loader.indexOf("'dnc-calculations.js'")<loader.indexOf("'recommendations.js'"),'Los cálculos canónicos deben cargarse antes de Recomendaciones');

console.log('derived-canonical-smoke: ok');
