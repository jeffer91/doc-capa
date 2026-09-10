(function(){
  'use strict';

  const TEMPLATE_DEFS=[
    {group:'Datos base',label:'Carreras del período',download:'#downloadCareersTemplateBtn',upload:'#careersFileInput',correction:'#careersImportResult',loaded:()=>activeCareers().length>0,ready:()=>hasPeriod(),reason:'Selecciona un período global.'},
    {group:'Fuentes del diagnóstico',label:'Encuestas institucionales',download:'[data-template="surveys"]',upload:'[data-source="surveys"]',correction:'#import-surveys',loaded:()=>hasSource('surveys'),ready:()=>activeCareers().length>0,reason:'Primero carga las carreras del período.'},
    {group:'Fuentes del diagnóstico',label:'Reuniones académicas',download:'[data-template="meetings"]',upload:'[data-source="meetings"]',correction:'#import-meetings',loaded:()=>hasSource('meetings'),ready:()=>activeCareers().length>0,reason:'Primero carga las carreras del período.'},
    {group:'Fuentes del diagnóstico',label:'Criterio del coordinador',download:'[data-template="coordinators"]',upload:'[data-source="coordinators"]',correction:'#import-coordinators',loaded:()=>hasSource('coordinators'),ready:()=>activeCareers().length>0,reason:'Primero carga las carreras del período.'},
    {group:'Fuentes del diagnóstico',label:'Mallas curriculares',download:'[data-template="curricula"]',upload:'[data-source="curricula"]',correction:'#import-curricula',loaded:()=>hasSource('curricula'),ready:()=>activeCareers().length>0,reason:'Primero carga las carreras del período.'},
    {group:'Fuentes del diagnóstico',label:'Planes de Enseñanza–Aprendizaje (PEA)',download:'[data-template="peas"]',upload:'[data-source="peas"]',correction:'#import-peas',loaded:()=>hasSource('peas'),ready:()=>activeCareers().length>0,reason:'Primero carga las carreras del período.'},
    {group:'Priorización',label:'Necesidades candidatas por carrera',download:'#downloadCandidatesTemplateBtn',upload:'#candidatesFileInput',correction:'#candidatesImportResult',loaded:()=>activeCareers().some(c=>careerCandidates(c.name).length>0),ready:()=>activeCareers().length>0&&Object.keys(SOURCE_DEFS||{}).every(k=>hasSource(k)),reason:'Completa las cinco fuentes del diagnóstico antes de priorizar.'},
    {group:'Resultados',label:'Resultados por carrera',download:'#downloadCareerResultsTemplateBtn',upload:'#careerResultsFileInput',correction:'#resultsCareerImportResult',loaded:()=>Array.isArray(state.results?.careerNeeds)&&state.results.careerNeeds.length>0,ready:()=>activeCareers().length>0&&activeCareers().every(c=>careerCandidates(c.name).length===5),reason:'Cada carrera debe tener exactamente cinco necesidades candidatas.'},
    {group:'Resultados',label:'Vinculación por carrera',download:'#downloadCareerLinksTemplateBtn',upload:'#careerLinksFileInput',correction:'#resultsLinksImportResult',loaded:()=>Array.isArray(state.results?.careerLinks)&&state.results.careerLinks.length>0,ready:()=>activeCareers().length>0&&activeCareers().every(c=>!!winnerForCareer(c.name)),reason:'Primero define y valida una necesidad ganadora por cada carrera.'},
    {group:'Resultados',label:'Capacitación genérica institucional',download:'#downloadGenericTemplateBtn',upload:'#genericFileInput',correction:'#resultsGenericImportResult',loaded:()=>!!String(state.results?.institutional?.selection?.CAPACITACION_GENERICA||'').trim(),ready:()=>Array.isArray(state.results?.careerNeeds)&&state.results.careerNeeds.length>0&&Array.isArray(state.results?.careerLinks)&&state.results.careerLinks.length>0,reason:'Primero procesa resultados y vinculación por carrera.'},
    {group:'Resultados',label:'Clasificación de capacitaciones específicas',download:'#downloadSpecificClassificationBtn',upload:'#specificClassificationFileInput',correction:'#specificClassificationImportResult',loaded:()=>Array.isArray(state.results?.specificClassifications)&&state.results.specificClassifications.length>0,ready:()=>Array.isArray(state.results?.careerLinks)&&state.results.careerLinks.length>0,reason:'Primero carga la vinculación por carrera.'},
    {group:'Anexos',label:'Resultados de encuesta para Anexo 5',download:'#downloadAnnexSurveyTemplate',upload:'#annexSurveyInput',correction:'#annexSurveyImportResult',loaded:()=>Array.isArray(state.annexes?.surveyQuestions)&&state.annexes.surveyQuestions.length>0,ready:()=>hasSource('surveys'),reason:'Primero carga la fuente de encuestas institucionales.'}
  ];

  let rendering=false;
  const q=selector=>document.querySelector(selector);
  const hasPeriod=()=>!!(state.period&&(state.period.start||state.period.startMonth)&&(state.period.end||state.period.endMonth));
  const isReady=def=>{try{return !!def.ready();}catch{return false;}};
  const isLoaded=def=>{try{return !!def.loaded();}catch{return false;}};

  function proxy(selector){
    const el=q(selector);
    if(!el){toast('Esta acción todavía no está disponible.');return false;}
    el.click();
    return true;
  }

  function correctionAction(def){
    const host=q(def.correction);
    if(!host)return null;
    return [...host.querySelectorAll('button')].find(btn=>/correcci|errores/i.test(btn.textContent||''))||null;
  }

  function injectStyles(){
    if(document.getElementById('templateWorkbenchStyles'))return;
    const style=document.createElement('style');
    style.id='templateWorkbenchStyles';
    style.textContent=`
      .workflow-template-row.workbench-row{grid-template-columns:minmax(250px,1fr) minmax(430px,auto);gap:16px}
      .template-row-actions{display:grid;grid-template-columns:repeat(3,minmax(128px,1fr));gap:8px;align-items:center}
      .template-row-actions .btn{white-space:nowrap;width:100%}
      .template-correction-ready{font-weight:800}
      .template-status-error{color:#b45309!important;font-weight:800}
      #workflowUploadBtn.workbench-hidden{display:none!important}
      @media(max-width:1000px){.workflow-template-row.workbench-row{grid-template-columns:1fr}.template-row-actions{grid-template-columns:repeat(3,minmax(0,1fr))}}
      @media(max-width:650px){.template-row-actions{grid-template-columns:1fr}.template-row-actions .btn{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function statusFor(def){
    const correction=correctionAction(def);
    const ready=isReady(def);
    const loaded=isLoaded(def);
    if(correction)return{label:'Con corrección pendiente',className:'template-status-error'};
    if(loaded)return{label:'Datos cargados',className:'workflow-ok'};
    if(ready)return{label:'Pendiente de carga',className:'workflow-pending'};
    return{label:`Bloqueada · ${def.reason}`,className:'workflow-blocked'};
  }

  function renderUnifiedPanel(){
    if(rendering)return;
    const panel=q('#workflowTemplatesPanel');
    const container=q('#workflowTemplateRows');
    if(!panel||!container||!panel.classList.contains('open'))return;
    rendering=true;
    try{
      const title=q('#workflowPanelTitle');
      const help=q('#workflowPanelHelp');
      if(title)title.textContent='Plantillas del DNC';
      if(help)help.textContent='En cada fila puedes descargar la plantilla, subir el Excel completado y descargar la corrección cuando existan filas con error.';
      container.innerHTML='';
      [...new Set(TEMPLATE_DEFS.map(def=>def.group))].forEach(group=>{
        const block=document.createElement('div');
        block.className='workflow-template-group';
        block.innerHTML=`<strong>${group}</strong>`;
        TEMPLATE_DEFS.filter(def=>def.group===group).forEach(def=>{
          const ready=isReady(def);
          const correction=correctionAction(def);
          const status=statusFor(def);
          const row=document.createElement('div');
          row.className='workflow-template-row workbench-row';
          row.dataset.templateLabel=def.label;
          row.innerHTML=`
            <div class="workflow-template-name">
              <strong>${escapeHtml(def.label)}</strong>
              <small class="${status.className}">${escapeHtml(status.label)}</small>
            </div>
            <div class="template-row-actions">
              <button class="btn btn-light template-download" ${ready?'':'disabled'}>Descargar plantilla</button>
              <button class="btn btn-secondary template-upload" ${ready&&state.dncStatus!=='approved'?'':'disabled'}>Subir plantilla</button>
              <button class="btn btn-light template-correction ${correction?'template-correction-ready':''}" ${correction?'':'disabled'}>Corrección</button>
            </div>`;
          row.querySelector('.template-download').addEventListener('click',()=>{
            if(!ready){toast(def.reason);return;}
            proxy(def.download);
          });
          row.querySelector('.template-upload').addEventListener('click',()=>{
            if(state.dncStatus==='approved'){toast('El DNC está aprobado. Reábrelo antes de cargar información.');return;}
            if(!ready){toast(def.reason);return;}
            proxy(def.upload);
          });
          row.querySelector('.template-correction').addEventListener('click',()=>{
            const action=correctionAction(def);
            if(!action){toast(`No hay filas pendientes de corrección en ${def.label}.`);return;}
            action.click();
          });
          block.appendChild(row);
        });
        container.appendChild(block);
      });
      container.dataset.unifiedTemplates='1';
    }finally{
      rendering=false;
    }
  }

  function refreshCorrectionStates(){
    const container=q('#workflowTemplateRows');
    if(!container||container.dataset.unifiedTemplates!=='1')return;
    TEMPLATE_DEFS.forEach(def=>{
      const row=[...container.querySelectorAll('.workbench-row')].find(x=>x.dataset.templateLabel===def.label);
      if(!row)return;
      const correction=correctionAction(def);
      const button=row.querySelector('.template-correction');
      const small=row.querySelector('.workflow-template-name small');
      if(button){
        button.disabled=!correction;
        button.classList.toggle('template-correction-ready',!!correction);
      }
      if(correction&&small){small.textContent='Con corrección pendiente';small.className='template-status-error';}
    });
  }

  function openWorkbench(){
    if(!hasPeriod()){
      toast('Selecciona o crea un período global antes de trabajar con plantillas.');
      navigate('periodos');
      return;
    }
    const panel=q('#workflowTemplatesPanel');
    if(!panel)return;
    panel.classList.add('open');
    renderUnifiedPanel();
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function bindPrimaryAction(){
    const download=q('#workflowDownloadBtn');
    const upload=q('#workflowUploadBtn');
    if(download&&!download.dataset.workbenchBound){
      download.dataset.workbenchBound='1';
      download.textContent='Plantillas del DNC';
      download.addEventListener('click',event=>{
        event.preventDefault();event.stopImmediatePropagation();openWorkbench();
      },true);
    }
    if(upload)upload.classList.add('workbench-hidden');
  }

  function observePanel(){
    const panel=q('#workflowTemplatesPanel');
    const container=q('#workflowTemplateRows');
    if(panel&&!panel.dataset.workbenchObserved){
      panel.dataset.workbenchObserved='1';
      new MutationObserver(()=>{if(panel.classList.contains('open'))renderUnifiedPanel();}).observe(panel,{attributes:true,attributeFilter:['class']});
    }
    if(container&&!container.dataset.workbenchObserved){
      container.dataset.workbenchObserved='1';
      new MutationObserver(()=>{
        if(rendering)return;
        if(container.querySelector('.workflow-row-action'))renderUnifiedPanel();
      }).observe(container,{childList:true,subtree:true});
    }
    TEMPLATE_DEFS.forEach(def=>{
      const host=q(def.correction);
      if(host&&!host.dataset.workbenchCorrectionObserved){
        host.dataset.workbenchCorrectionObserved='1';
        new MutationObserver(()=>refreshCorrectionStates()).observe(host,{childList:true,subtree:true});
      }
    });
  }

  function init(){
    injectStyles();
    bindPrimaryAction();
    observePanel();
    if(q('#workflowTemplatesPanel')?.classList.contains('open'))renderUnifiedPanel();
  }

  init();
})();