(function(){
  'use strict';

  function esc(v){return escapeHtml(v);}
  function norm(v){return normalized(v);}
  function uniq(values){return [...new Set(values.map(v=>String(v??'').trim()).filter(Boolean))];}
  function list(values){const a=uniq(values);if(!a.length)return'';if(a.length===1)return a[0];if(a.length===2)return`${a[0]} y ${a[1]}`;return`${a.slice(0,-1).join(', ')} y ${a[a.length-1]}`;}
  function careers(){return activeCareers().filter(c=>careerCandidates(c.name).length===5);}
  function resultFor(career,need){return (state.results?.careerNeeds||[]).find(r=>norm(r.CARRERA)===norm(career)&&norm(r.NOMBRE_NECESIDAD)===norm(need));}
  function linkFor(career){return (state.results?.careerLinks||[]).find(r=>norm(r.CARRERA)===norm(career));}
  function selected(){return state.results?.institutional?.selection||{};}

  function clusters(){
    const cs=careers(),map=new Map();
    cs.forEach(c=>careerCandidates(c.name).forEach(can=>{
      const r=resultFor(c.name,can.NOMBRE_NECESIDAD);
      const label=String(r?.CLAVE_CONSOLIDACION||can.NOMBRE_NECESIDAD||'').trim();
      const key=norm(label);if(!key)return;
      if(!map.has(key))map.set(key,{label,careers:new Set()});
      map.get(key).careers.add(c.name);
    }));
    return [...map.values()].map(x=>({label:x.label,count:x.careers.size,percentage:cs.length?Math.round((x.careers.size/cs.length)*10000)/100:0})).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,'es'));
  }

  function genericScope(){
    const cs=careers(),sel=selected(),key=norm(sel.NECESIDAD_BASE||''),all=clusters();
    const base=all.find(x=>norm(x.label)===key);
    if(!base)return{label:'alcance pendiente de determinación',count:0,total:cs.length};
    return{label:base.count===cs.length?'todas las carreras diagnosticadas':`${base.count} de ${cs.length} carreras diagnosticadas`,count:base.count,total:cs.length};
  }

  function sourceLabels(){return Object.keys(SOURCE_DEFS||{}).filter(k=>hasSource(k)).map(k=>SOURCE_DEFS[k].label);}
  function specifics(){return careers().map(c=>({career:c.name,training:String(linkFor(c.name)?.CAPACITACION_PRIORITARIA||'').trim()})).filter(x=>x.training);}

  function conclusionParagraphs(){
    const cs=careers(),cls=clusters(),rec=cls.filter(x=>x.count>=2),top=rec[0]||cls[0],sel=selected(),scope=genericScope(),spec=specifics(),sources=sourceLabels();
    const generic=String(sel.CAPACITACION_GENERICA||'').trim();
    const p=[];
    p.push(`El diagnóstico de necesidades de capacitación docente desarrollado por el Instituto Superior Tecnológico Quito Metropolitano permite contar con una visión integral, sistemática y fundamentada de las brechas identificadas en la función sustantiva de docencia, a partir del análisis de ${cs.length} carrera(s) incluidas en el período.`);
    if(top){
      const recurringNames=rec.length?list(rec.slice(0,4).map(x=>x.label)):top.label;
      p.push(`Los resultados evidencian que las necesidades de capacitación no se presentan de manera aislada. Se identificaron patrones de recurrencia inter-carreras asociados principalmente con ${recurringNames}, siendo ${top.label} la necesidad con mayor presencia institucional (${top.percentage}% de las carreras analizadas).`);
    }else{
      p.push('Con la información actualmente consolidada no se identifican todavía patrones de recurrencia inter-carreras suficientes para formular una conclusión institucional específica; la app no reemplaza esta ausencia con resultados del período histórico.');
    }
    if(generic){
      p.push(`La capacitación genérica institucional ${generic} constituye la respuesta transversal priorizada a partir de la necesidad base validada, con un alcance de ${scope.label}. Su definición se sustenta en la consolidación de resultados del período y no en valores predeterminados por la aplicación.`);
    }else{
      p.push('La capacitación genérica institucional permanece pendiente de cierre mientras no exista una selección validada en los resultados del diagnóstico.');
    }
    if(spec.length){
      p.push(`Junto con el resultado transversal, el diagnóstico consolida ${spec.length} capacitación(es) específica(s) priorizada(s) por carrera, relacionadas con sus perfiles de egreso, requerimientos curriculares y campos profesionales. Estas prioridades complementan la capacitación genérica institucional y permiten conservar la pertinencia particular de cada carrera.`);
    }
    if(sources.length){
      p.push(`El enfoque aplicado integró ${list(sources)}, fortaleciendo la trazabilidad del diagnóstico mediante la combinación de evidencia cuantitativa, cualitativa y documental efectivamente registrada para el período.`);
    }
    p.push('En conjunto, el diagnóstico se consolida como un insumo técnico para la toma de decisiones institucionales y para la elaboración posterior del Plan de Capacitación Docente. Su alcance corresponde a la fase diagnóstica y no anticipa programación, presupuesto, ejecución ni evaluación de las acciones de capacitación.');
    return p;
  }

  function renderConclusionsHtml(){return '<h2>7. Conclusiones del Diagnóstico</h2>'+conclusionParagraphs().map(p=>`<p>${esc(p)}</p>`).join('');}

  function injectUi(){
    const nav6=document.querySelector('.nav-item[data-view="dnc-resumen"]');
    if(nav6&&!document.querySelector('[data-view="dnc-conclusiones"]')){
      nav6.insertAdjacentHTML('afterend','<button class="nav-item sub" data-view="dnc-conclusiones">7. Conclusiones</button><button class="nav-item sub" data-view="dnc-recomendaciones">8. Recomendaciones</button><button class="nav-item sub" data-view="dnc-bibliografia">9. Bibliografía</button>');
      ['dnc-conclusiones','dnc-recomendaciones','dnc-bibliografia'].forEach(view=>document.querySelector(`[data-view="${view}"]`)?.addEventListener('click',()=>navigate(view)));
    }
    const main=document.querySelector('main.main'),config=document.getElementById('view-configuracion');
    if(main&&config&&!document.getElementById('view-dnc-conclusiones')){
      const section=document.createElement('section');section.id='view-dnc-conclusiones';section.className='view';
      section.innerHTML='<div class="section-heading"><div><p class="eyebrow">DNC · Sección 7</p><h2>Conclusiones del Diagnóstico</h2><p>Salida automática derivada de los resultados consolidados.</p></div><span class="status ready">Automática</span></div><div class="notice strong-notice">Las conclusiones no conservan resultados particulares de períodos anteriores.</div><article class="card mt-24"><div class="document-preview" id="conclusionsPreview"></div></article>';
      main.insertBefore(section,config);
    }
  }

  function renderUi(){injectUi();const el=document.getElementById('conclusionsPreview');if(el)el.innerHTML=renderConclusionsHtml();}
  const baseRenderAll=renderAll;renderAll=function(){baseRenderAll();renderUi();};
  const baseNavigate=navigate;navigate=function(view){baseNavigate(view);if(view==='dnc-conclusiones')document.getElementById('pageTitle').textContent='DNC · Conclusiones';};
  const baseBuildPrint=buildPrintDocument;buildPrintDocument=function(){return baseBuildPrint()+`<section class="doc-content doc-page">${renderConclusionsHtml()}</section>`;};

  function writeConclusionsPdf(doc){let y=20;y=writeHeading(doc,'7. Conclusiones del Diagnóstico',2,y);conclusionParagraphs().forEach(p=>{y=writeParagraph(doc,p,y);});}
  const baseDownloadPdf=downloadPdf;
  downloadPdf=function(){
    const api=jsPDF?.API,originalSave=api?.save;if(typeof originalSave!=='function')return baseDownloadPdf();let restored=false;
    api.save=function(filename,options){try{this.addPage();writeConclusionsPdf(this);}catch(e){console.error(e);toast('No se pudo incorporar la Sección 7 al PDF.');}api.save=originalSave;restored=true;return originalSave.call(this,filename,options);};
    try{return baseDownloadPdf();}finally{if(!restored)api.save=originalSave;}
  };
  function replaceDownloadListener(id){const old=document.getElementById(id);if(!old)return;const clone=old.cloneNode(true);old.replaceWith(clone);clone.addEventListener('click',downloadPdf);}
  replaceDownloadListener('downloadDncBtn');replaceDownloadListener('downloadFromPreviewBtn');renderAll();
})();