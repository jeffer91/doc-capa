import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const calculations=new Map();
global.window={DOC_CAPA_CORE:{registerCalculation:(id,fn)=>calculations.set(id,fn)}};
global.normalized=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
global.state={
 careers:[{name:'A',active:true},{name:'B',active:true}],
 sources:{surveys:[{CARRERA:'A'}],meetings:[],coordinators:[],curricula:[],peas:[]},
 candidates:[
  ...Array.from({length:5},(_,i)=>({CARRERA:'A',NOMBRE_NECESIDAD:i===0?'Metodologías activas':`A${i}`,GANADORA:i===0,IMPACTO_ACADEMICO:'Alto'})),
  ...Array.from({length:5},(_,i)=>({CARRERA:'B',NOMBRE_NECESIDAD:i===0?'Metodologías activas':`B${i}`,GANADORA:i===0,IMPACTO_ACADEMICO:'Alto'}))
 ],
 results:{careerNeeds:[{CARRERA:'A',NOMBRE_NECESIDAD:'Metodologías activas',CLAVE_CONSOLIDACION:'metodologias'},{CARRERA:'B',NOMBRE_NECESIDAD:'Metodologías activas',CLAVE_CONSOLIDACION:'metodologias'}],careerLinks:[{CARRERA:'A',CAPACITACION_PRIORITARIA:'Curso A'},{CARRERA:'B',CAPACITACION_PRIORITARIA:'Curso B'}],institutional:{needMeta:[{CLAVE_CONSOLIDACION:'metodologias',NECESIDAD_INSTITUCIONAL:'Metodologías activas'}],selection:{NECESIDAD_BASE:'metodologias',CAPACITACION_GENERICA:'Curso genérico'}}},
 annexes:{evidence:{coordinators:[{}],instrument:[]}}
};
global.SOURCE_DEFS={surveys:{},meetings:{},coordinators:{},curricula:{},peas:{}};
global.activeCareers=()=>state.careers.filter(c=>c.active!==false);
global.careerCandidates=career=>state.candidates.filter(x=>normalized(x.CARRERA)===normalized(career));
global.winnerForCareer=career=>careerCandidates(career).find(x=>x.GANADORA===true);
global.validateDncForFinal=()=>[];
vm.runInThisContext(fs.readFileSync('dnc-calculations.js','utf8'));
assert.equal(calculations.get('dnc.analyzedCareers')().length,2);
const clusters=calculations.get('dnc.clusters')();
assert.equal(clusters[0].count,2);
assert.equal(clusters[0].percentage,100);
assert.equal(calculations.get('dnc.genericScope')().all,true);
assert.equal(calculations.get('dnc.specifics')().length,2);
assert.equal(calculations.get('dnc.evidenceCount')(),1);
console.log('calculations-smoke: ok');
