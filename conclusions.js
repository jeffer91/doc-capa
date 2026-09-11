(function(){
  'use strict';

  const dnc=window.DOC_CAPA_DNC;
  if(!dnc){console.error('DOC-CAPA Conclusiones: cálculos DNC no disponibles.');return;}

  const esc=v=>escapeHtml(v);
  const uniq=values=>[...new Set(values.map(v=>String(v??'').trim()).filter(Boolean))];
  function list(values){const a=uniq(values);if(!a.length)return'';if(a.length===1)return a[0];if(a.length===2)return`${a[0]} y ${a[1]}`;return`${a.slice(0,-1).join(', ')} y ${a[a.length-1]}`;}
  function sourceLabels(){return Object.keys(dnc.sourceCounts()).filter(k=>dnc.sourceCounts()[k]>0).map(k=>SOURCE_DEFS?.[k]?.label||k);}

  function conclusionParagraphs(){
    const cs=dnc.analyzedCareers(),clusters=dnc.clusters(),rec=dnc.recurrentClusters(),top=rec[0]||clusters[0],sel=dnc.selected(),scope=dnc.genericScope(),spec=dnc.specifics(),sources=sourceLabels();
    const generic=String(sel.CAPACITACION_GENERICA||'').trim(),p=[];
    p.push(`El diagnóstico de necesidades de capacitación docente desarrollado por el Instituto Superior Tecnológico Quito Metropolitano permite contar con una visión integral, sistemática y fundamentada de las brechas identificadas en la función sustantiva de docencia, a partir del análisis de ${cs.length} carrera(s) incluidas en el período.`);
    if(top){
      const recurringNames=rec.length?list(rec.slice(0,4).map(x=>x.displayName||x.label)):top.displayName||top.label;
      p.push(`Los resultados evidencian que las necesidades de capacitación no se presentan de manera aislada. Se identificaron patrones de recurrencia inter-carreras asociados principalmente con ${recurringNames}, siendo ${top.displayName||top.label} la necesidad con mayor presencia institucional (${top.percentage}% de las carreras analizadas).`);
    }else{
      p.push('Con la información actualmente consolidada no se identifican todavía patrones de recurrencia inter-carreras suficientes para formular una conclusión institucional específica; la aplicación no reemplaza esta ausencia con resultados de otros períodos.');
    }
    if(generic){
      p.push(`La capacitación genérica institucional ${generic} constituye la respuesta transversal priorizada a partir de la necesidad base validada, con un alcance de ${scope.label.toLowerCase()}. Su definición se sustenta en la consolidación de resultados del período y no en valores predeterminados por la aplicación.`);
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
      section.innerHTML='<div class="section-heading"><div><p class="eyebrow">DNC · Sección 7</p><h2>Conclusiones del Diagnóstico</h2><p>Salida automática derivada de los resultados consolidados.</p></div><span class="status ready">Automática</span></div><div class="notice strong-notice">Las conclusiones usan la misma fuente de cálculos que Resultados y Diagnóstico.</div><article class="card mt-24"><div class="document-preview" id="conclusionsPreview"></div></article>';
      main.insertBefore(section,config);
    }
  }

  function renderUi(){injectUi();const el=document.getElementById('conclusionsPreview');if(el)el.innerHTML=renderConclusionsHtml();}
  const baseRenderAll=renderAll;renderAll=function(){const out=baseRenderAll();renderUi();return out;};
  const baseNavigate=navigate;navigate=function(view){const out=baseNavigate(view);if(view==='dnc-conclusiones'){const page=document.getElementById('pageTitle');if(page)page.textContent='DNC · Conclusiones';}return out;};

  window.DOC_CAPA_DERIVED=window.DOC_CAPA_DERIVED||{};
  window.DOC_CAPA_DERIVED.conclusions={renderHtml:renderConclusionsHtml,paragraphs:conclusionParagraphs};
  renderUi();
})();
