(function(){
  'use strict';

  const arr=v=>Array.isArray(v)?v:[];
  const sourceCount=key=>arr(state.sources?.[key]).length;
  const resultCount=key=>arr(state.results?.[key]).length;
  const annexSurveyCount=()=>arr(state.annexes?.surveyQuestions).length+arr(state.annexes?.surveyResults).length;
  const annexSurveyLabel=()=>{
    const q=arr(state.annexes?.surveyQuestions).length;
    const r=arr(state.annexes?.surveyResults).length;
    if(q&&r)return `${q} pregunta${q===1?'':'s'} · ${r} resultado${r===1?'':'s'}`;
    const total=q+r;
    return `${total} registro${total===1?'':'s'}`;
  };

  const TEMPLATE_DEFS=[
    {label:'Carreras del período',download:'#downloadCareersTemplateBtn',upload:'#careersFileInput',correction:'#careersImportResult',count:()=>activeCareers().length,loaded:()=>activeCareers().length>0,ready:()=>hasPeriod(),reason:'Selecciona un período global.'},
    {label:'Encuestas institucionales',download:'[data-template="surveys"]',upload:'[data-source="surveys"]',correction:'#import-surveys',count:()=>sourceCount('surveys'),loaded:()=>hasSource('surveys'),ready:()=>activeCareers().length>0,reason:'Primero carga las carreras del período.'},
    {label:'Reuniones académicas con docentes',download:'[data-template="meetings"]',upload:'[data-source="meetings"]',correction:'#import-meetings',count:()=>sourceCount('meetings'),loaded:()=>hasSource('meetings'),ready:()=>activeCareers().length>0,reason:'Primero carga las carreras del período.'},
    {label:'Criterio del coordinador de carrera',download:'[data-template="coordinators"]',upload:'[data-source="coordinators"]',correction:'#import-coordinators',count:()=>sourceCount('coordinators'),loaded:()=>hasSource('coordinators'),ready:()=>activeCareers().length>0,reason:'Primero carga las carreras del período.'},
    {label:'Mallas curriculares',download:'[data-template="curricula"]',upload:'[data-source="curricula"]',correction:'#import-curricula',count:()=>sourceCount('curricula'),loaded:()=>hasSource('curricula'),ready:()=>activeCareers().length>0,reason:'Primero carga las carreras del período.'},
    {label:'Planes de Enseñanza–Aprendizaje (PEA)',download:'[data-template="peas"]',upload:'[data-source="peas"]',correction:'#import-peas',count:()=>sourceCount('peas'),loaded:()=>hasSource('peas'),ready:()=>activeCareers().length>0,reason:'Primero carga las carreras del período.'},
    {label:'Necesidades por carrera',download:'#downloadCandidatesTemplateBtn',upload:'#candidatesFileInput',correction:'#candidatesImportResult',count:()=>arr(state.candidates).length,loaded:()=>activeCareers().some(c=>careerCandidates(c.name).length>0),ready:()=>activeCareers().length>0&&Object.keys(typeof SOURCE_DEFS==='object'&&SOURCE_DEFS?SOURCE_DEFS:{}).every(k=>hasSource(k)),reason:'Completa las cinco fuentes del diagnóstico antes de priorizar.'},
    {label:'Resultados por carrera',download:'#downloadCareerResultsTemplateBtn',upload:'#careerResultsFileInput',correction:'#resultsCareerImportResult',count:()=>resultCount('careerNeeds'),loaded:()=>resultCount('careerNeeds')>0,ready:()=>activeCareers().length>0&&activeCareers().every(c=>careerCandidates(c.name).length===5),reason:'Cada carrera debe tener exactamente cinco necesidades candidatas.'},
    {label:'Vinculación por carrera',download:'#downloadCareerLinksTemplateBtn',upload:'#careerLinksFileInput',correction:'#resultsLinksImportResult',count:()=>resultCount('careerLinks'),loaded:()=>resultCount('careerLinks')>0,ready:()=>activeCareers().length>0&&activeCareers().every(c=>!!winnerForCareer(c.name)),reason:'Primero define y valida una necesidad ganadora por cada carrera.'},
    {label:'Capacitación genérica institucional',download:'#downloadGenericTemplateBtn',upload:'#genericFileInput',correction:'#resultsGenericImportResult',count:()=>String(state.results?.institutional?.selection?.CAPACITACION_GENERICA||'').trim()?1:0,countLabel:()=>String(state.results?.institutional?.selection?.CAPACITACION_GENERICA||'').trim()?'1 selección':'0 registros',loaded:()=>!!String(state.results?.institutional?.selection?.CAPACITACION_GENERICA||'').trim(),ready:()=>resultCount('careerNeeds')>0&&resultCount('careerLinks')>0,reason:'Primero procesa resultados y vinculación por carrera.'},
    {label:'Clasificación de capacitaciones específicas',download:'#downloadSpecificClassificationBtn',upload:'#specificClassificationFileInput',correction:'#specificClassificationImportResult',count:()=>resultCount('specificClassifications'),loaded:()=>resultCount('specificClassifications')>0,ready:()=>resultCount('careerLinks')>0,reason:'Primero carga la vinculación por carrera.'},
    {label:'Resultados de encuesta para Anexo 5',download:'#downloadAnnexSurveyTemplate',upload:'#annexSurveyInput',correction:'#annexSurveyImportResult',count:annexSurveyCount,countLabel:annexSurveyLabel,loaded:()=>arr(state.annexes?.surveyQuestions).length>0,ready:()=>hasSource('surveys'),reason:'Primero carga la fuente de encuestas institucionales.'}
  ];

  let rendering=false;
  let refreshTimer=null;
  const q=selector=>document.querySelector(selector);
  const hasPeriod=()=>!!(state.period&&(state.period.start||state.period.startMonth)&&(state.period.end||state.period.endMonth));
  const isReady=def=>{try{return !!def.ready();}catch{return false;}};
  const isLoaded=def=>{try{return !!def.loaded();}catch{return false;}};
  const countFor=def=>{try{return Math.max(0,Number(def.count?.()||0));}catch{return 0;}};
  const countLabelFor=def=>{
    try{if(typeof def.countLabel==='function')return def.countLabel();}catch{}
    const count=countFor(def);
    return `${count} registro${count===1?'':'s'}`;
  };

  function proxy(selector){
    const el=q(selector);
    if(!el){toast?.('Esta acción todavía no está disponible.');return false;}
    el.click();
    return true;
  }

  function correctionAction(def){
    const host=q(def.correction);
    if(!host)return null;
    return [...host.querySelectorAll('button')].find(btn=>/correcci|errores/i.test(btn.textContent||''))||null;
  }

  function correctionCount(def){
    const text=String(q(def.correction)?.textContent||'').replace(/\s+/g,' ').trim();
    if(!text)return null;
    const patterns=[
      /(\d+)\s+(?:fila\(s\)|filas?|registro\(s\)|registros?)\s+(?:con error|requieren correcci[oó]n|rechazad[oa]s?)/i,
      /(?:errores?|rechazad[oa]s?|correcci[oó]n)\D{0,16}(\d+)/i
    ];
    for(const re of patterns){const m=text.match(re);if(m)return Number(m[1]);}
    return null;
  }

  function statusFor(def){
    const correction=correctionAction(def);
    const errors=correctionCount(def);
    if(correction)return{kind:'error',label:errors!=null?`Con errores · ${errors} fila${errors===1?'':'s'}`:'Con errores'};
    if(isLoaded(def))return{kind:'loaded',label:`Cargado · ${countLabelFor(def)}`};
    if(isReady(def))return{kind:'pending',label:'Pendiente'};
    return{kind:'blocked',label:'Bloqueado'};
  }

  function injectStyles(){
    if(document.getElementById('templateWorkbenchStyles'))return;
    const style=document.createElement('style');
    style.id='templateWorkbenchStyles';
    style.textContent=`
      #view-dnc-operacion #workflowTemplatesPanel{display:block!important;margin-top:10px;padding:0!important;border:1px solid #e4e9ef!important;border-radius:10px!important;background:#fff!important;overflow:hidden;box-shadow:none!important}
      #view-dnc-operacion #workflowTemplatesPanel .workflow-panel-head{margin:0;padding:12px 14px;border-bottom:1px solid #edf0f4;align-items:center}
      #view-dnc-operacion #workflowPanelClose{display:none!important}
      #view-dnc-operacion #workflowTemplateRows{overflow-x:auto}
      #view-dnc-operacion #workflowDownloadBtn,#view-dnc-operacion #workflowUploadBtn{display:none!important}
      .template-workbench-table{width:100%;min-width:790px;border-collapse:collapse;background:#fff}
      .template-workbench-table th{padding:9px 10px;background:#f8fafc;border-bottom:1px solid #e5eaf0;color:#6a7789;font-size:9px;text-transform:uppercase;letter-spacing:.045em;text-align:left;white-space:nowrap}
      .template-workbench-table th:first-child,.template-workbench-table td:first-child{width:42px;text-align:center}
      .template-workbench-table th:nth-child(2){width:36%}
      .template-workbench-table th:nth-child(3),.template-workbench-table th:nth-child(4){width:145px;text-align:center}
      .template-workbench-table th:nth-child(5){width:220px}
      .template-workbench-table td{padding:9px 10px;border-bottom:1px solid #edf0f4;vertical-align:middle;font-size:10.5px;color:#344257}
      .template-workbench-table tbody tr:last-child td{border-bottom:0}
      .template-workbench-table tbody tr:hover{background:#fbfcfd}
      .template-name{font-weight:750;color:var(--navy);line-height:1.25}
      .template-seq{color:#8b96a6;font-weight:700}
      .template-action-cell{text-align:center}
      .template-table-btn{min-width:108px;border:1px solid #dce3eb;background:#fff;color:var(--navy);border-radius:7px;padding:7px 9px;font-size:9.5px;font-weight:750;cursor:pointer;white-space:nowrap}
      .template-table-btn:hover:not(:disabled){background:#f2f5f8}
      .template-table-btn.upload{background:#f8fafc}
      .template-table-btn.replace{border-color:#cfd8e3}
      .template-table-btn:disabled{opacity:.42;cursor:not-allowed}
      .template-data-status{display:flex;align-items:flex-start;gap:7px;min-width:0}
      .template-status-dot{width:7px;height:7px;border-radius:50%;margin-top:4px;flex:0 0 auto;background:#c7ced8}
      .template-data-status.loaded .template-status-dot{background:var(--ok)}
      .template-data-status.pending .template-status-dot{background:#d7aa22}
      .template-data-status.error .template-status-dot{background:#c2413b}
      .template-data-status.blocked .template-status-dot{background:#aab3bf}
      .template-status-copy{min-width:0}
      .template-status-main{display:block;font-weight:800;color:#4f5f73;line-height:1.25}
      .template-data-status.loaded .template-status-main{color:var(--ok)}
      .template-data-status.error .template-status-main{color:#b13a34}
      .template-data-status.pending .template-status-main{color:#8a6800}
      .template-status-reason{display:block;margin-top:2px;color:#8a95a4;font-size:9px;line-height:1.25}
      .template-correction-link{display:inline-block;margin-top:3px;border:0;background:transparent;color:#9d312d;padding:0;font-size:9px;font-weight:800;cursor:pointer;text-decoration:underline;text-underline-offset:2px}
      .template-table-summary{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 14px;background:#fbfcfd;border-top:1px solid #edf0f4;color:#68768a;font-size:9.5px}
      .template-table-summary strong{color:var(--navy)}
      @media(max-width:700px){
        #view-dnc-operacion #workflowTemplatesPanel{margin-left:-2px;margin-right:-2px}
        .template-workbench-table{min-width:720px}
      }
    `;
    document.head.appendChild(style);
  }

  function statusHtml(def){
    const status=statusFor(def);
    const reason=status.kind==='blocked'?`<small class="template-status-reason">${escapeHtml(def.reason)}</small>`:'';
    const correction=status.kind==='error'?'<button type="button" class="template-correction-link">Descargar corrección</button>':'';
    return `<div class="template-data-status ${status.kind}"><span class="template-status-dot" aria-hidden="true"></span><div class="template-status-copy"><span class="template-status-main">${escapeHtml(status.label)}</span>${reason}${correction}</div></div>`;
  }

  function renderTable(){
    if(rendering)return;
    const panel=q('#workflowTemplatesPanel');
    const container=q('#workflowTemplateRows');
    if(!panel||!container||!hasPeriod())return;
    rendering=true;
    try{
      panel.classList.add('open');
      const title=q('#workflowPanelTitle');
      const help=q('#workflowPanelHelp');
      if(title)title.textContent='Información requerida';
      if(help)help.textContent='Descarga, completa y sube cada plantilla. El estado y los registros cargados se actualizan en la misma fila.';

      const rows=TEMPLATE_DEFS.map((def,index)=>{
        const ready=isReady(def);
        const loaded=isLoaded(def);
        const uploadLabel=loaded?'Reemplazar':'Subir';
        return `<tr data-template-index="${index}">
          <td class="template-seq">${index+1}</td>
          <td><span class="template-name">${escapeHtml(def.label)}</span></td>
          <td class="template-action-cell"><button type="button" class="template-table-btn template-download" ${ready?'':'disabled'} title="${ready?'Descargar plantilla':escapeHtml(def.reason)}">Descargar</button></td>
          <td class="template-action-cell"><button type="button" class="template-table-btn upload ${loaded?'replace':''} template-upload" ${ready&&state.dncStatus!=='approved'?'':'disabled'} title="${state.dncStatus==='approved'?'El DNC está aprobado.':ready?(loaded?'Reemplazar datos cargados':'Subir plantilla completada'):escapeHtml(def.reason)}">${uploadLabel}</button></td>
          <td>${statusHtml(def)}</td>
        </tr>`;
      }).join('');

      const completed=TEMPLATE_DEFS.filter(isLoaded).length;
      container.innerHTML=`<table class="template-workbench-table" aria-label="Plantillas e información requerida del DNC"><thead><tr><th>#</th><th>Plantilla / información</th><th>Descargar plantilla</th><th>Subir plantilla</th><th>Datos subidos</th></tr></thead><tbody>${rows}</tbody></table><div class="template-table-summary"><span><strong>${completed}/${TEMPLATE_DEFS.length}</strong> cargas completas</span><span>${TEMPLATE_DEFS.length-completed} pendiente${TEMPLATE_DEFS.length-completed===1?'':'s'}</span></div>`;
      container.dataset.unifiedTemplates='table-v2';

      container.querySelectorAll('tr[data-template-index]').forEach(row=>{
        const def=TEMPLATE_DEFS[Number(row.dataset.templateIndex)];
        row.querySelector('.template-download')?.addEventListener('click',()=>{
          if(!isReady(def)){toast?.(def.reason);return;}
          proxy(def.download);
        });
        row.querySelector('.template-upload')?.addEventListener('click',()=>{
          if(state.dncStatus==='approved'){toast?.('El DNC está aprobado. Reábrelo antes de cargar información.');return;}
          if(!isReady(def)){toast?.(def.reason);return;}
          proxy(def.upload);
        });
        row.querySelector('.template-correction-link')?.addEventListener('click',()=>{
          const action=correctionAction(def);
          if(!action){toast?.(`No hay filas pendientes de corrección en ${def.label}.`);return;}
          action.click();
        });
      });
    }finally{
      rendering=false;
    }
  }

  function mountPanel(){
    const panel=q('#workflowTemplatesPanel');
    const steps=q('#view-dnc-operacion .workflow-steps');
    if(!panel||!steps||!hasPeriod())return;
    panel.classList.add('open');
    if(panel.previousElementSibling!==steps)steps.insertAdjacentElement('afterend',panel);
    renderTable();
  }

  function scheduleRefresh(delay=0){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(()=>{mountPanel();renderTable();},delay);
  }

  function bindPrimaryActions(){
    const download=q('#workflowDownloadBtn');
    const upload=q('#workflowUploadBtn');
    if(download)download.classList.add('workbench-hidden');
    if(upload)upload.classList.add('workbench-hidden');
  }

  function observeRuntime(){
    const panel=q('#workflowTemplatesPanel');
    const container=q('#workflowTemplateRows');
    if(panel&&!panel.dataset.workbenchObserved){
      panel.dataset.workbenchObserved='table-v2';
      new MutationObserver(()=>{
        if(rendering||!hasPeriod())return;
        if(!panel.classList.contains('open'))panel.classList.add('open');
      }).observe(panel,{attributes:true,attributeFilter:['class']});
    }
    if(container&&!container.dataset.workbenchObserved){
      container.dataset.workbenchObserved='table-v2';
      new MutationObserver(()=>{
        if(rendering||!hasPeriod())return;
        if(!container.querySelector('.template-workbench-table'))scheduleRefresh(0);
      }).observe(container,{childList:true});
    }
    TEMPLATE_DEFS.forEach(def=>{
      const host=q(def.correction);
      if(host&&!host.dataset.workbenchCorrectionObserved){
        host.dataset.workbenchCorrectionObserved='table-v2';
        new MutationObserver(()=>scheduleRefresh(0)).observe(host,{childList:true,subtree:true,characterData:true});
      }
    });
  }

  function bindRefreshEvents(){
    window.addEventListener('doccapa:period-changed',()=>scheduleRefresh(0));
    window.addEventListener('doccapa:trace-updated',()=>scheduleRefresh(0));
    window.addEventListener('doccapa:period-save-state',()=>scheduleRefresh(0));
    document.addEventListener('change',event=>{
      const input=event.target;
      if(!(input instanceof HTMLInputElement)||input.type!=='file')return;
      scheduleRefresh(350);
      setTimeout(()=>scheduleRefresh(0),1800);
    },true);
  }

  function init(){
    injectStyles();
    bindPrimaryActions();
    observeRuntime();
    bindRefreshEvents();
    mountPanel();
  }

  window.DOC_CAPA_TEMPLATE_TABLE={render:renderTable,definitions:TEMPLATE_DEFS};
  init();
})();
