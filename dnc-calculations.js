(function(){
  'use strict';
  const core=window.DOC_CAPA_CORE;if(!core){console.error('DOC_CAPA_CORE no disponible para cálculos DNC.');return;}
  const norm=v=>typeof normalized==='function'?normalized(v):String(v??'').trim().toLowerCase();
  const arr=v=>Array.isArray(v)?v:[];
  const active=()=>typeof activeCareers==='function'?activeCareers():arr(state.careers).filter(c=>c?.active!==false);
  const candidates=career=>typeof careerCandidates==='function'?careerCandidates(career):arr(state.candidates).filter(x=>norm(x.CARRERA)===norm(career));
  const winner=career=>typeof winnerForCareer==='function'?winnerForCareer(career):candidates(career).find(x=>x.GANADORA===true);
  const resultFor=(career,need)=>arr(state.results?.careerNeeds).find(r=>norm(r.CARRERA)===norm(career)&&norm(r.NOMBRE_NECESIDAD)===norm(need));
  const linkFor=career=>arr(state.results?.careerLinks).find(r=>norm(r.CARRERA)===norm(career));
  const analyzed=()=>active().filter(c=>candidates(c.name).length===5);
  function clusters(){
    const cs=analyzed(),total=cs.length,map=new Map();
    cs.forEach(c=>candidates(c.name).forEach(can=>{const r=resultFor(c.name,can.NOMBRE_NECESIDAD),label=String(r?.CLAVE_CONSOLIDACION||can.NOMBRE_NECESIDAD||'').trim(),key=norm(label);if(!key)return;if(!map.has(key))map.set(key,{key,label,careers:new Set(),types:new Set(),impacts:new Set()});const g=map.get(key);g.careers.add(c.name);if(r?.TIPO_NECESIDAD)g.types.add(String(r.TIPO_NECESIDAD).trim());if(can.IMPACTO_ACADEMICO&&norm(can.IMPACTO_ACADEMICO)!=='pendiente')g.impacts.add(String(can.IMPACTO_ACADEMICO).trim());}));
    return[...map.values()].map(g=>{const meta=arr(state.results?.institutional?.needMeta).find(m=>norm(m.CLAVE_CONSOLIDACION||m.NECESIDAD_INSTITUCIONAL)===g.key)||{};return{key:g.key,label:g.label,careers:[...g.careers],count:g.careers.size,total,percentage:total?Math.round(g.careers.size/total*10000)/100:0,displayName:String(meta.NECESIDAD_INSTITUCIONAL||g.label).trim(),presenceLevel:String(meta.NIVEL_PRESENCIA||'').trim(),nature:String(meta.TIPO_NECESIDAD||[...g.types].join(', ')).trim(),impact:String(meta.IMPACTO_INSTITUCIONAL||[...g.impacts].join(', ')).trim()};}).sort((a,b)=>b.count-a.count||a.displayName.localeCompare(b.displayName,'es'));
  }
  const selected=()=>state.results?.institutional?.selection||{};
  function baseCluster(){const key=norm(selected().NECESIDAD_BASE||'');if(!key)return null;return clusters().find(g=>g.key===key||norm(g.displayName)===key||norm(g.label)===key)||null;}
  function genericScope(){const cs=analyzed(),b=baseCluster();if(!b||!cs.length)return{all:false,count:0,total:cs.length,label:'Pendiente'};return{all:b.count===cs.length,count:b.count,total:cs.length,label:b.count===cs.length?'Todas las carreras diagnosticadas':`${b.count} de ${cs.length} carreras diagnosticadas`};}
  const specifics=()=>analyzed().map(c=>({career:c.name,link:linkFor(c.name)||{},training:String(linkFor(c.name)?.CAPACITACION_PRIORITARIA||'').trim()})).filter(x=>x.training);
  const sourceCounts=()=>Object.fromEntries(Object.keys(SOURCE_DEFS||{}).map(k=>[k,arr(state.sources?.[k]).length]));
  const evidenceCount=()=>Object.values(state.annexes?.evidence||{}).reduce((s,v)=>s+arr(v).length,0);
  const approvalIssues=()=>{try{return[...new Set((typeof validateDncForFinal==='function'?validateDncForFinal():[]).filter(Boolean))];}catch(e){return[`Validación no disponible: ${e.message||e}`];}};
  const api={activeCareers:active,candidates,analyzedCareers:analyzed,winner,resultFor,linkFor,clusters,recurrentClusters:()=>clusters().filter(x=>x.count>=2),selected,baseCluster,genericScope,specifics,sourceCounts,evidenceCount,approvalIssues};
  Object.entries(api).forEach(([name,fn])=>core.registerCalculation(`dnc.${name}`,fn));window.DOC_CAPA_DNC=api;
})();
