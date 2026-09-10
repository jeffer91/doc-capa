(function(){
  'use strict';

  function esc(v){return escapeHtml(v);}
  function norm(v){return normalized(v);}
  function unique(values){return [...new Set(values.map(v=>String(v??'').trim()).filter(Boolean))];}
  function list(values){const a=unique(values);if(!a.length)return'';if(a.length===1)return a[0];if(a.length===2)return`${a[0]} y ${a[1]}`;return`${a.slice(0,-1).join(', ')} y ${a[a.length-1]}`;}
  function analyzedCareers(){return activeCareers().filter(c=>careerCandidates(c.name).length===5);}
  function selectedGeneric(){return state.results?.institutional?.selection||{};}
  function careerNeedResult(career,need){return (state.results?.careerNeeds||[]).find(r=>norm(r.CARRERA)===norm(career)&&norm(r.NOMBRE_NECESIDAD)===norm(need));}
  function careerLink(career){return (state.results?.careerLinks||[]).find(r=>norm(r.CARRERA)===norm(career));}

  function institutionalClusters(){
    const careers=analyzedCareers(),total=careers.length,map=new Map();
    careers.forEach(c=>careerCandidates(c.name).forEach(can=>{
      const result=careerNeedResult(c.name,can.NOMBRE_NECESIDAD);
      const label=String(result?.CLAVE_CONSOLIDACION||can.NOMBRE_NECESIDAD||'').trim();
      const key=norm(label);if(!key)return;
      if(!map.has(key))map.set(key,{key,label,careers:new Set()});
      map.get(key).careers.add(c.name);
    }));
    return [...map.values()].map(g=>({
      ...g,
      count:g.careers.size,
      total,
      percentage:total?Math.round((g.careers.size/total)*10000)/100:0
    }));
  }

  function baseCluster(){
    const need=String(selectedGeneric().NECESIDAD_BASE||'').trim();
    if(!need)return null;
    const key=norm(need);
    return institutionalClusters().find(g=>g.key===key||norm(g.label)===key)||null;
  }

  function genericScope(){
    const b=baseCluster(),careers=analyzedCareers();
    if(!b||!careers.length)return{all:false,count:0,total:careers.length,label:'alcance institucional pendiente de determinación'};
    const all=b.count===careers.length;
    return{all,count:b.count,total:careers.length,label:all?'todas las carreras diagnosticadas':`${b.count} de ${careers.length} carreras diagnosticadas`};
  }

  function impactAspects(){
    const s=selectedGeneric();
    return unique([
      s.IMPACTO_PLANIFICACION&&'la planificación académica',
      s.IMPACTO_ENSENANZA_APRENDIZAJE&&'el proceso de enseñanza-aprendizaje',
      s.IMPACTO_RESULTADOS_APRENDIZAJE&&'los resultados de aprendizaje',
      s.IMPACTO_METODOLOGIAS&&'las metodologías de enseñanza',
      s.IMPACTO_EVALUACION&&'la evaluación del aprendizaje'
    ]);
  }

  function specificTrainings(){
    return analyzedCareers().map(c=>({career:c.name,link:careerLink(c.name)||{}})).filter(x=>String(x.link.CAPACITACION_PRIORITARIA||'').trim());
  }

  function recommendationParagraphs(){
    const sel=selectedGeneric(),scope=genericScope(),impacts=impactAspects();
    const generic=String(sel.CAPACITACION_GENERICA||'').trim();
    const genericText=generic||'[CAPACITACIÓN GENÉRICA PENDIENTE]';
    const reach=scope.all?'transversal para todas las carreras diagnosticadas':scope.count?`de alcance transversal para ${scope.count} de ${scope.total} carreras diagnosticadas`:'de alcance institucional pendiente de determinación';
    const impactText=impacts.length?list(impacts):'los aspectos de impacto sustentados en el diagnóstico';
    return[
      `Se recomienda que el Plan de Capacitación Docente incorpore de manera prioritaria la capacitación genérica institucional ${genericText}, considerándola como una acción de base para el fortalecimiento del cuerpo docente. Esta capacitación deberá concebirse como un eje ${reach} que contribuya a fortalecer ${impactText}.`,
      `Se sugiere que el Plan de Capacitación Docente incluya las capacitaciones específicas priorizadas por carrera, respetando las particularidades académicas y disciplinares, así como el perfil de egreso de cada programa académico. Estas capacitaciones deberán planificarse de forma complementaria a la capacitación genérica institucional ${genericText}, evitando duplicidades y asegurando una articulación coherente entre ambos niveles de capacitación.`,
      'Se recomienda que la elaboración del Plan de Capacitación Docente considere criterios de priorización claros, tales como el impacto académico, la recurrencia de la necesidad, el alcance institucional y la alineación con los objetivos estratégicos del ITSQMET. Estos criterios permitirán orientar de manera responsable la asignación de recursos y la planificación de las acciones de capacitación.',
      'Se sugiere que el Plan de Capacitación Docente mantenga una diferenciación explícita entre las fases de diagnóstico, planificación, ejecución y evaluación, asegurando el cumplimiento del Manual de Procesos Académicos y fortaleciendo la trazabilidad del proceso.',
      'Se recomienda que el Plan de Capacitación Docente incorpore mecanismos de seguimiento y evaluación que permitan medir el impacto de las acciones de capacitación en el desempeño docente y en la calidad del proceso de enseñanza-aprendizaje. Estos mecanismos deberán orientarse a la mejora continua y retroalimentar futuros procesos de detección de necesidades de capacitación.'
    ];
  }

  function renderRecommendationsHtml(){
    return '<h2>8. Recomendaciones para la Elaboración del Plan de Capacitación Docente</h2><p>Con base en los resultados del diagnóstico de necesidades de capacitación docente, se plantean las siguientes recomendaciones orientadas a la elaboración del Plan de Capacitación Docente, garantizando coherencia institucional, pertinencia académica y sostenibilidad en el tiempo.</p>'+recommendationParagraphs().map(p=>`<p>${esc(p)}</p>`).join('');
  }

  function recommendationIssues(){
    const issues=[],sel=selectedGeneric(),scope=genericScope();
    if(!String(sel.CAPACITACION_GENERICA||'').trim())issues.push('Sección 8: falta la capacitación genérica institucional definida en 5.2.');
    if(!specificTrainings().length)issues.push('Sección 8: no existen capacitaciones específicas consolidadas desde 5.3.');
    if(!impactAspects().length)issues.push('Sección 8: faltan aspectos de impacto documentados para la capacitación genérica.');
    if(!scope.count)issues.push('Sección 8: no se puede determinar el alcance real de la capacitación genérica.');
    return issues;
  }

  function injectUi(){
    const nav6=document.querySelector('.nav-item[data-view="dnc-resumen"]');
    if(nav6&&!document.querySelector('[data-view="dnc-recomendaciones"]')){
      nav6.insertAdjacentHTML('afterend','<button class="nav-item sub disabled" disabled title="Pendiente de definición">7. Conclusiones</button><button class="nav-item sub" data-view="dnc-recomendaciones">8. Recomendaciones</button><button class="nav-item sub disabled" disabled title="Pendiente de definición">9. Referencias</button>');
      document.querySelector('[data-view="dnc-recomendaciones"]').addEventListener('click',()=>navigate('dnc-recomendaciones'));
    }
    const main=document.querySelector('main.main'),config=document.getElementById('view-configuracion');
    if(main&&config&&!document.getElementById('view-dnc-recomendaciones')){
      const section=document.createElement('section');section.id='view-dnc-recomendaciones';section.className='view';
      section.innerHTML=`<div class="section-heading"><div><p class="eyebrow">DNC · Sección 8</p><h2>Recomendaciones para la Elaboración del Plan de Capacitación Docente</h2><p>Salida derivada de Resultados. No tiene captura manual propia.</p></div><span class="status ready">Automática</span></div><div class="notice strong-notice">El DNC recomienda qué deberá considerar el Plan posterior; no programa fechas, presupuesto, horas ni ejecución.</div><div id="recommendationIssues" class="mt-24"></div><article class="card mt-24"><div class="section-title-row"><div><h3>Vista previa automática</h3><p>Un párrafo introductorio y cinco recomendaciones continuas, sin subtítulos internos ni tablas.</p></div><button class="btn btn-light" id="previewRecommendationsBtn">Vista previa DNC</button></div><div class="document-preview" id="recommendationsPreview"></div></article>`;
      main.insertBefore(section,config);
      section.querySelector('#previewRecommendationsBtn').addEventListener('click',()=>{document.getElementById('printDocument').innerHTML=`<section class="doc-content doc-page">${renderRecommendationsHtml()}</section>`;document.getElementById('pdfPreviewDialog').showModal();});
    }
  }

  function renderRecommendationsUi(){
    injectUi();
    const issues=recommendationIssues();
    const preview=document.getElementById('recommendationsPreview');if(preview)preview.innerHTML=renderRecommendationsHtml();
    const box=document.getElementById('recommendationIssues');if(box)box.innerHTML=issues.length?`<div class="info-box"><strong>${issues.length} pendiente(s):</strong><br>${issues.map(esc).join('<br>')}</div>`:'<div class="info-box">Recomendaciones sincronizadas con los resultados del período.</div>';
    const count=document.getElementById('implementedSectionsCount');if(count)count.textContent='7';
  }

  const baseValidate=validateDncForFinal;
  validateDncForFinal=function(){return[...new Set([...baseValidate(),...recommendationIssues(),'Sección 7. Conclusiones pendiente de implementación.','Sección 9. Referencias pendiente de implementación.'])];};

  const baseRenderAll=renderAll;
  renderAll=function(){baseRenderAll();renderRecommendationsUi();};

  const baseNavigate=navigate;
  navigate=function(view){baseNavigate(view);if(view==='dnc-recomendaciones')document.getElementById('pageTitle').textContent='DNC · Recomendaciones';};

  const baseBuildPrint=buildPrintDocument;
  buildPrintDocument=function(){return baseBuildPrint()+`<section class="doc-content doc-page">${renderRecommendationsHtml()}</section>`;};

  function writeRecommendationsPdf(doc){
    let y=20;
    y=writeHeading(doc,'8. Recomendaciones para la Elaboración del Plan de Capacitación Docente',2,y);
    y=writeParagraph(doc,'Con base en los resultados del diagnóstico de necesidades de capacitación docente, se plantean las siguientes recomendaciones orientadas a la elaboración del Plan de Capacitación Docente, garantizando coherencia institucional, pertinencia académica y sostenibilidad en el tiempo.',y);
    recommendationParagraphs().forEach(p=>{y=writeParagraph(doc,p,y);});
  }

  const baseDownloadPdf=downloadPdf;
  downloadPdf=function(){
    const api=jsPDF?.API,originalSave=api?.save;
    if(typeof originalSave!=='function')return baseDownloadPdf();
    let restored=false;
    api.save=function(filename,options){
      try{this.addPage();writeRecommendationsPdf(this);}catch(e){console.error(e);toast('No se pudo incorporar la Sección 8 al PDF.');}
      api.save=originalSave;restored=true;
      return originalSave.call(this,filename,options);
    };
    try{return baseDownloadPdf();}finally{if(!restored)api.save=originalSave;}
  };

  function replaceDownloadListener(id){const old=document.getElementById(id);if(!old)return;const clone=old.cloneNode(true);old.replaceWith(clone);clone.addEventListener('click',downloadPdf);}
  replaceDownloadListener('downloadDncBtn');
  replaceDownloadListener('downloadFromPreviewBtn');
  renderAll();
})();
