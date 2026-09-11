(function(){
  'use strict';

  const dnc=window.DOC_CAPA_DNC;
  if(!dnc){console.error('DOC-CAPA Recomendaciones: cálculos DNC no disponibles.');return;}

  const esc=v=>escapeHtml(v);
  const uniq=values=>[...new Set(values.map(v=>String(v??'').trim()).filter(Boolean))];
  function list(values){const a=uniq(values);if(!a.length)return'';if(a.length===1)return a[0];if(a.length===2)return`${a[0]} y ${a[1]}`;return`${a.slice(0,-1).join(', ')} y ${a[a.length-1]}`;}

  function impactAspects(){
    const s=dnc.selected();
    return uniq([
      s.IMPACTO_PLANIFICACION&&'la planificación académica',
      s.IMPACTO_ENSENANZA_APRENDIZAJE&&'el proceso de enseñanza-aprendizaje',
      s.IMPACTO_RESULTADOS_APRENDIZAJE&&'los resultados de aprendizaje',
      s.IMPACTO_METODOLOGIAS&&'las metodologías de enseñanza',
      s.IMPACTO_EVALUACION&&'la evaluación del aprendizaje'
    ]);
  }

  function recommendationParagraphs(){
    const sel=dnc.selected(),scope=dnc.genericScope(),impacts=impactAspects();
    const generic=String(sel.CAPACITACION_GENERICA||'').trim(),genericText=generic||'[CAPACITACIÓN GENÉRICA PENDIENTE]';
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

  function renderRecommendationsHtml(){return '<h2>8. Recomendaciones para la Elaboración del Plan de Capacitación Docente</h2><p>Con base en los resultados del diagnóstico de necesidades de capacitación docente, se plantean las siguientes recomendaciones orientadas a la elaboración del Plan de Capacitación Docente, garantizando coherencia institucional, pertinencia académica y sostenibilidad en el tiempo.</p>'+recommendationParagraphs().map(p=>`<p>${esc(p)}</p>`).join('');}

  function recommendationIssues(){
    const issues=[],sel=dnc.selected(),scope=dnc.genericScope(),specifics=dnc.specifics();
    if(!String(sel.CAPACITACION_GENERICA||'').trim())issues.push('Sección 8: falta la capacitación genérica institucional definida en 5.2.');
    if(!specifics.length)issues.push('Sección 8: no existen capacitaciones específicas consolidadas desde 5.3.');
    if(!impactAspects().length)issues.push('Sección 8: faltan aspectos de impacto documentados para la capacitación genérica.');
    if(!scope.count)issues.push('Sección 8: no se puede determinar el alcance real de la capacitación genérica.');
    return issues;
  }

  function injectUi(){
    const main=document.querySelector('main.main'),config=document.getElementById('view-configuracion');
    if(main&&config&&!document.getElementById('view-dnc-recomendaciones')){
      const section=document.createElement('section');section.id='view-dnc-recomendaciones';section.className='view';
      section.innerHTML='<div class="section-heading"><div><p class="eyebrow">DNC · Sección 8</p><h2>Recomendaciones para la Elaboración del Plan de Capacitación Docente</h2><p>Salida derivada de Resultados. No tiene captura manual propia.</p></div><span class="status ready">Automática</span></div><div class="notice strong-notice">El DNC recomienda qué deberá considerar el Plan posterior; no programa fechas, presupuesto, horas ni ejecución.</div><div id="recommendationIssues" class="mt-24"></div><article class="card mt-24"><div class="section-title-row"><div><h3>Vista previa automática</h3><p>Las recomendaciones usan exclusivamente los cálculos canónicos del DNC.</p></div><button class="btn btn-light" id="previewRecommendationsBtn">Vista previa DNC</button></div><div class="document-preview" id="recommendationsPreview"></div></article>';
      main.insertBefore(section,config);
      section.querySelector('#previewRecommendationsBtn').addEventListener('click',()=>{const host=document.getElementById('printDocument'),dialog=document.getElementById('pdfPreviewDialog');if(host)host.innerHTML=`<section class="doc-content doc-page">${renderRecommendationsHtml()}</section>`;dialog?.showModal();});
    }
  }

  function renderUi(){
    injectUi();const issues=recommendationIssues(),preview=document.getElementById('recommendationsPreview'),box=document.getElementById('recommendationIssues');
    if(preview)preview.innerHTML=renderRecommendationsHtml();
    if(box)box.innerHTML=issues.length?`<div class="info-box"><strong>${issues.length} pendiente(s):</strong><br>${issues.map(esc).join('<br>')}</div>`:'<div class="info-box">Recomendaciones sincronizadas con los resultados del período.</div>';
  }

  const baseValidate=validateDncForFinal;validateDncForFinal=function(){return[...new Set([...baseValidate(),...recommendationIssues()])];};
  const baseRenderAll=renderAll;renderAll=function(){const out=baseRenderAll();renderUi();return out;};
  const baseNavigate=navigate;navigate=function(view){const out=baseNavigate(view);if(view==='dnc-recomendaciones'){const page=document.getElementById('pageTitle');if(page)page.textContent='DNC · Recomendaciones';}return out;};

  window.DOC_CAPA_DERIVED=window.DOC_CAPA_DERIVED||{};
  window.DOC_CAPA_DERIVED.recommendations={renderHtml:renderRecommendationsHtml,paragraphs:recommendationParagraphs,issues:recommendationIssues};
  renderUi();
})();
