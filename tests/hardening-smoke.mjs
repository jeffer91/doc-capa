import fs from 'node:fs';
import assert from 'node:assert/strict';

const hardening=fs.readFileSync('institutional-hardening.js','utf8');
const bibliography=fs.readFileSync('bibliography.js','utf8');
const loader=fs.readFileSync('results.js','utf8');

assert(loader.includes("loadScript('institutional-hardening.js')"),'El módulo de hardening debe cargarse');
assert(loader.indexOf("loadScript('institutional-hardening.js')")>loader.indexOf("loadScript('dnc-manifest.js')"),'Hardening debe cargarse después del manifiesto');

for(const art of ['artículo 12','artículo 13','artículo 156'])assert(hardening.includes(art),`Falta referencia legal verificada: ${art}`);
assert(!hardening.includes('artículo 155'),'No debe reintroducirse el artículo 155 derogado como fundamento');
assert(hardening.includes('indicador 3.2.4'),'Debe fundamentar el DNC en el indicador 3.2.4 del Modelo CACES 2024');
assert(hardening.includes('cacesValidatedAt')&&hardening.includes('cacesValidatedModel')&&hardening.includes('cacesValidatedYear'),'La validación CACES debe dejar metadatos auditables');
assert(hardening.includes("IMPORT_MODE_KEY='doc-capa-import-mode-v1'")&&hardening.includes("return v==='merge'?'merge':'replace'"),'La importación debe usar reemplazo como modo predeterminado');
assert(hardening.includes('virtualMeetingsNotApplicable'),'Anexo 4 debe admitir No aplica explícito');
assert(hardening.includes('officialSnapshots')&&hardening.includes("crypto.subtle.digest('SHA-256'"),'Las versiones oficiales deben conservar snapshot y hash');
assert(hardening.includes('workingBackups'),'Debe existir respaldo de trabajo en IndexedDB');
assert(hardening.includes('keys.every'),'La cobertura debe exigir todas las fuentes por carrera');

assert(bibliography.includes('Modelo de Evaluación Externa 2024 con Fines de Acreditación para los Institutos Superiores Técnicos y Tecnológicos'),'Bibliografía debe usar el título oficial del modelo CACES');
for(const stale of ['Coll, C. (2018)','Salinas, J. (2011)','Zabalza, M. A. (2012)'])assert(!bibliography.includes(stale),`Referencia bibliográfica no verificada aún presente: ${stale}`);

console.log('hardening-smoke: ok');
