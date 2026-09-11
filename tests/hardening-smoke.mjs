import fs from 'node:fs';
import assert from 'node:assert/strict';

const governance=fs.readFileSync('institutional-governance.js','utf8');
const imports=fs.readFileSync('import-hardening.js','utf8');
const snapshots=fs.readFileSync('official-snapshots.js','utf8');
const bibliography=fs.readFileSync('bibliography.js','utf8');
const loader=fs.readFileSync('results.js','utf8');

for(const moduleName of ['institutional-governance.js','import-hardening.js','official-snapshots.js'])assert(loader.includes(`'${moduleName}'`),`results.js debe cargar directamente ${moduleName}`);
assert(loader.indexOf("'institutional-governance.js'")>loader.indexOf("'dnc-manifest.js'"),'Gobierno institucional debe cargarse después del manifiesto');
assert(loader.indexOf("'official-snapshots.js'")>loader.indexOf("'import-hardening.js'"),'Snapshots debe cargarse después del endurecimiento de importaciones');
assert(!loader.includes("'institutional-hardening.js'"),'No debe quedar el loader intermedio institutional-hardening.js');

for(const art of ['artículo 12','artículo 13','artículo 156'])assert(governance.includes(art),`Falta referencia legal verificada: ${art}`);
assert(!governance.includes('artículo 155'),'No debe reintroducirse el artículo 155 derogado como fundamento');
assert(governance.includes('indicador 3.2.4'),'Debe fundamentar el DNC en el indicador 3.2.4 del Modelo CACES 2024');
assert(governance.includes('cacesValidatedAt')&&governance.includes('cacesValidatedModel')&&governance.includes('cacesValidatedYear'),'La validación CACES debe dejar metadatos auditables');
assert(governance.includes('virtualMeetingsNotApplicable'),'Anexo 4 debe admitir No aplica explícito');
assert(governance.includes('keys.every'),'La cobertura debe exigir todas las fuentes por carrera');

assert(imports.includes("IMPORT_MODE_KEY='doc-capa-import-mode-v1'"),'Debe existir configuración persistente del modo de importación');
assert(imports.includes("const importMode=()=>localStorage.getItem(IMPORT_MODE_KEY)==='merge'?'merge':'replace'"),'La importación debe usar reemplazo como modo predeterminado');
assert(imports.includes('reconcileRemovedCareers'),'Reemplazar carreras debe depurar datos huérfanos');
assert(imports.includes('exactamente 5 necesidades candidatas'),'Debe validarse el total final de cinco candidatas por carrera');

assert(snapshots.includes("SNAPSHOT_STORE='officialSnapshots'")&&snapshots.includes("crypto.subtle.digest('SHA-256'"),'Las versiones oficiales deben conservar snapshot y hash');
assert(snapshots.includes("BACKUP_STORE='workingBackups'"),'Debe existir respaldo de trabajo en IndexedDB');
assert(snapshots.includes('pdfBlob'),'El histórico oficial debe conservar el PDF generado');

assert(bibliography.includes('Modelo de Evaluación Externa 2024 con Fines de Acreditación para los Institutos Superiores Técnicos y Tecnológicos'),'Bibliografía debe usar el título oficial del modelo CACES');
for(const stale of ['Coll, C. (2018)','Salinas, J. (2011)','Zabalza, M. A. (2012)'])assert(!bibliography.includes(stale),`Referencia bibliográfica no verificada aún presente: ${stale}`);

console.log('hardening-smoke: ok');
