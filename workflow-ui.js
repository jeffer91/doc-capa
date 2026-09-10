(function(){
  'use strict';

  const TEMPLATE_DEFS=[
    {group:'Datos del período',label:'Carreras del período',download:'#downloadCareersTemplateBtn',upload:'#careersFileInput',loaded:()=>activeCareers().length>0},
    {group:'Fuentes del diagnóstico',label:'Encuestas institucionales',download:'[data-template="surveys"]',upload:'[data-source="surveys"]',loaded:()=>hasSource('surveys')},
    {group:'Fuentes del diagnóstico',label:'Reuniones académicas',download:'[data-template="meetings"]',upload:'[data-source="meetings"]',loaded:()=>hasSource('meetings')},
    {group:'Fuentes del diagnóstico',label:'Criterio del coordinador',download:'[data-template="coordinators"]',upload:'[data-source="coordinators"]',loaded:()=>hasSource('coordinators')},
    {group:'Fuentes del diagnóstico',label:'Mallas curriculares',download:'[data-template="curricula"]',upload:'[data-source="curricula"]',loaded:()=>hasSource('curricula')},
    {group:'Fuentes del diagnóstico',label:'Planes de Enseñanza–Aprendizaje (PEA)',download:'[data-template="peas"]',upload:'[data-source="peas"]',loaded:()=>hasSource('peas')},
    {group:'Priorización',label:'Necesidades candidatas por carrera',download:'#downloadCandidatesTemplateBtn',upload:'#candidatesFileInput',loaded:()=>activeCareers().some(c=>careerCandidates(c.name).length>0)},
    {group:'Resultados',label:'Resultados por carrera',download:'#downloadCareerResultsTemplateBtn',upload:'#careerResultsFileInput',loaded:()=>Array.isArray(state.results?.careerNeeds)&&state.results.careerNeeds.length>0},
    {group:'Resultados',label:'Vinculación por carrera',download:'#downloadCareerLinksTemplateBtn',upload:'#careerLinksFileInput',loaded:()=>Array.isArray(state.results?.careerLinks)&&state.results.careerLinks.length>0},
    {group:'Resultados',label:'Capacitación genérica institucional',download:'#downloadGenericTemplateBtn',upload:'#genericFileInput',loaded:()=>!!String(state.results?.institutional?.selection?.CAPACITACION_GENERICA||'').trim()},
    {group:'Resultados',label:'Clasificación de capacitaciones específicas',download:'#downloadSpecificClassificationBtn',upload:'#specificClassificationFileInput',loaded:()=>Array.isArray(state.results?.specificClassifications)&&state.results.specificClassifications.length>0},
    {group:'Anexos',label:'Resultados de encuesta para Anexo 5',download:'#downloadAnnexSurveyTemplate',upload:'#annexSurveyInput',loaded:()=>Array.isArray(state.annexes?.surveyQuestions)&&state.annexes.surveyQuestions.length>0}
  ];

  function safeIssues(){try{return [...new Set((validateDncForFinal?.()||[]).filter(Boolean))];}catch(e){console.error(e);return['No fue posible ejecutar la validación completa del DNC.'];}}
  function hasPeriod(){return !!(state.period&&(state.period.start||state.period.startMonth)&&(state.period.end||state.period.endMonth));}
  function periodLabel(){if(state.period?.label)return state.period.label;const start=state.period?.start||state.period?.startMonth||'',end=state.period?.end||state.period?.endMonth||'';return start&&end?`${start} – ${end}`:'Sin período activo';}
  function approved(){const reopen=document.getElementById('reopenDncBtn');return !!(reopen&&!reopen.hidden);}
  function loadedTemplates(){return TEMPLATE_DEFS.filter(x=>{try{return x.loaded();}catch{return false;}}).length;}
  function sourceCount(){try{return Object.keys(SOURCE_DEFS||{}).filter(k=>hasSource(k)).length;}catch{return 0;}}
  function get(selector){return document.querySelector(selector);}
  function proxy(selector){const el=get(selector);if(!el){toast('Esta carga todavía no está disponible.');return;}el.click();}

  function injectStyles(){
    if(document.getElementById('workflowUiStyles'))return;
    const st=document.createElement('style');st.id='workflowUiStyles';st.textContent=`
      body.workflow-mode #view-inicio>.workflow-legacy-home{display:none!important}
      body.workflow-mode .dnc-technical-nav{display:none!important}
      body.workflow-mode.technical-open .dnc-technical-nav{display:block!important}
      body.workflow-mode #previewDncBtn,body.workflow-mode #downloadDncBtn{display:none!important}
      .workflow-shell{max-width:1120px;margin:0 auto}.workflow-hero{background:linear-gradient(135deg,var(--navy),var(--navy2));color:#fff;border-radius:18px;padding:28px;box-shadow:var(--shadow)}
      .workflow-hero-top{display:flex;justify-content:space-between;gap:22px;align-items:flex-start}.workflow-hero h2{font-size:28px;margin:8px 0 8px}.workflow-hero p{margin:0;color:#d7e2ef;line-height:1.5}.workflow-state{min-width:180px;text-align:right}.workflow-state strong{display:block;font-size:18px}.workflow-state span{font-size:11px;color:#c7d4e8}
      .workflow-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:20px}.workflow-step{background:#fff;border:1px solid var(--line);border-radius:14px;padding:17px;box-shadow:var(--shadow)}.workflow-step span{display:block;font-size:11px;color:var(--muted)}.workflow-step strong{display:block;margin-top:5px;font-size:18px}.workflow-step small{display:block;margin-top:4px;color:#8b96a7}
      .workflow-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}.workflow-actions .btn{padding:12px 16px}.workflow-actions .primary-action{background:var(--navy);color:#fff}.workflow-actions .process-action{background:#2f6feb;color:#fff}.workflow-actions button:disabled{opacity:.45;cursor:not-allowed}
      .workflow-panel{display:none;background:#fff;border:1px solid var(--line);border-radius:14px;padding:20px;margin-top:18px;box-shadow:var(--shadow)}.workflow-panel.open{display:block}.workflow-panel-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:14px}.workflow-panel-head h3{margin:0 0 5px}.workflow-panel-head p{margin:0;color:var(--muted);font-size:12px}
      .workflow-template-group{margin-top:18px}.workflow-template-group>strong{display:block;margin-bottom:8px}.workflow-template-row{display:grid;grid-template-columns:minmax(220px,1fr) auto auto;gap:9px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)}.workflow-template-row:last-child{border-bottom:0}.workflow-template-name small{display:block;color:var(--muted);margin-top:3px}.workflow-ok{color:var(--ok);font-weight:700}.workflow-pending{color:var(--warn);font-weight:700}
      .workflow-validation{margin-top:18px}.workflow-validation .info-box{margin-top:0}.workflow-issue-list{margin:8px 0 0 18px;padding:0}.workflow-issue-list li{margin:5px 0;color:#59667a}.workflow-footer-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;padding-top:18px;border-top:1px solid var(--line)}
      #technicalToggleBtn{margin-top:6px}.workflow-evidence-btn{margin-left:auto}
      @media(max-width:900px){.workflow-steps{grid-template-columns:1fr 1fr}.workflow-hero-top{flex-direction:column}.workflow-state{text-align:left}.workflow-template-row{grid-template-columns:1fr}.workflow-evidence-btn{margin-left:0}}
      @media(max-width:560px){.workflow-steps{grid-template-columns:1fr}.workflow-actions{display:grid}.workflow-actions .btn{width:100%}}
    `;document.head.appendChild(st);
  }

  function markTechnicalNavigation(){
    const section=[...document.querySelectorAll('.nav-section')].find(x=>/Detección de Necesidades/i.test(x.textContent));if(section)section.classList.add('dnc-technical-nav');
    document.querySelectorAll('.nav-item.sub').forEach(x=>x.classList.add('dnc-technical-nav'));
    const periods=document.querySelector('.nav-item[data-view="periodos"]');
    if(periods&&!document.getElementById('technicalToggleBtn')){
      const btn=document.createElement('button');btn.id='technicalToggleBtn';btn.className='nav-item';btn.textContent='Detalle técnico';btn.title='Mostrar u ocultar las secciones internas del documento';
      periods.insertAdjacentElement('afterend',btn);btn.addEventListener('click',()=>{document.body.classList.toggle('technical-open');btn.textContent=document.body.classList.contains('technical-open')?'Ocultar detalle técnico':'Detalle técnico';});
    }
  }

  function createHome(){
    const home=document.getElementById('view-inicio');if(!home||document.getElementById('workflowHome'))return;
    [...home.children].forEach(ch=>ch.classList.add('workflow-legacy-home'));
    const el=document.createElement('div');el.id='workflowHome';el.className='workflow-shell';
    el.innerHTML=`
      <div class="workflow-hero"><div class="workflow-hero-top"><div><span class="pill">Detección de Necesidades de Capacitación</span><h2>Preparar y procesar DNC</h2><p>Trabaja con plantillas por período. La estructura 1–10 se genera internamente y no requiere editar sección por sección.</p></div><div class="workflow-state"><strong id="workflowState">Sin período</strong><span id="workflowStateHelp">Configura un período para comenzar.</span></div></div></div>
      <div class="workflow-steps"><article class="workflow-step"><span>Período</span><strong id="workflowPeriod">Sin período</strong><small id="workflowPeriodHelp">Paso 1</small></article><article class="workflow-step"><span>Carreras</span><strong id="workflowCareers">0</strong><small>Cargadas para el período</small></article><article class="workflow-step"><span>Plantillas con datos</span><strong id="workflowLoaded">0/${TEMPLATE_DEFS.length}</strong><small>Fuentes y resultados</small></article><article class="workflow-step"><span>Pendientes</span><strong id="workflowIssuesCount">—</strong><small>Validaciones antes de aprobar</small></article></div>
      <div class="workflow-actions"><button class="btn btn-light" id="workflowPeriodBtn">1. Crear / seleccionar período</button><button class="btn btn-secondary" id="workflowDownloadBtn">2. Descargar plantillas</button><button class="btn btn-secondary" id="workflowUploadBtn">3. Subir plantillas</button><button class="btn process-action" id="workflowProcessBtn">4. Procesar DNC</button><button class="btn btn-light workflow-evidence-btn" id="workflowEvidenceBtn">Cargar evidencias</button></div>
      <div class="workflow-panel" id="workflowTemplatesPanel"><div class="workflow-panel-head"><div><h3 id="workflowPanelTitle">Plantillas del DNC</h3><p id="workflowPanelHelp">Descarga o carga cada plantilla desde un único lugar.</p></div><button class="icon-btn" id="workflowPanelClose" aria-label="Cerrar">×</button></div><div id="workflowTemplateRows"></div></div>
      <div class="workflow-validation"><div id="workflowValidationBox" class="info-box">Configura un período para iniciar el proceso.</div></div>
      <div class="workflow-footer-actions"><button class="btn btn-light" id="workflowPreviewBtn">Vista previa</button><button class="btn btn-primary" id="workflowApproveBtn">Aprobar DNC</button><button class="btn btn-light" id="workflowReopenBtn" hidden>Reabrir DNC</button><button class="btn btn-primary" id="workflowPdfBtn">Descargar PDF</button></div>`;
    home.appendChild(el);

    document.getElementById('workflowPeriodBtn').addEventListener('click',()=>navigate('periodos'));
    document.getElementById('workflowDownloadBtn').addEventListener('click',()=>openTemplatePanel('download'));
    document.getElementById('workflowUploadBtn').addEventListener('click',()=>openTemplatePanel('upload'));
    document.getElementById('workflowPanelClose').addEventListener('click',()=>document.getElementById('workflowTemplatesPanel').classList.remove('open'));
    document.getElementById('workflowProcessBtn').addEventListener('click',processDnc);
    document.getElementById('workflowEvidenceBtn').addEventListener('click',()=>navigate('dnc-anexos'));
    document.getElementById('workflowPreviewBtn').addEventListener('click',()=>proxy('#previewDncBtn'));
    document.getElementById('workflowApproveBtn').addEventListener('click',()=>proxy('#approveDncBtn'));
    document.getElementById('workflowReopenBtn').addEventListener('click',()=>proxy('#reopenDncBtn'));
    document.getElementById('workflowPdfBtn').addEventListener('click',()=>proxy('#downloadDncBtn'));
  }

  function openTemplatePanel(mode){
    if(!hasPeriod()){toast('Primero configura el período activo.');navigate('periodos');return;}
    const panel=document.getElementById('workflowTemplatesPanel');panel.classList.add('open');
    document.getElementById('workflowPanelTitle').textContent=mode==='download'?'Descargar plantillas':'Subir plantillas';
    document.getElementById('workflowPanelHelp').textContent=mode==='download'?'Descarga únicamente las plantillas que correspondan al levantamiento del período.':'Carga los Excel completados. Las filas correctas se conservan y las erróneas generan su propia plantilla de corrección.';
    const groups=[...new Set(TEMPLATE_DEFS.map(x=>x.group))],container=document.getElementById('workflowTemplateRows');container.innerHTML='';
    groups.forEach(group=>{
      const block=document.createElement('div');block.className='workflow-template-group';block.innerHTML=`<strong>${group}</strong>`;
      TEMPLATE_DEFS.filter(x=>x.group===group).forEach(def=>{
        const row=document.createElement('div');row.className='workflow-template-row';let loaded=false;try{loaded=def.loaded();}catch{}
        row.innerHTML=`<div class="workflow-template-name"><strong>${def.label}</strong><small class="${loaded?'workflow-ok':'workflow-pending'}">${loaded?'Datos cargados':'Pendiente'}</small></div><button class="btn btn-light workflow-row-download" ${mode==='upload'?'style="display:none"':''}>Descargar</button><button class="btn btn-secondary workflow-row-upload" ${mode==='download'?'style="display:none"':''}>Subir Excel</button>`;
        row.querySelector('.workflow-row-download').addEventListener('click',()=>proxy(def.download));row.querySelector('.workflow-row-upload').addEventListener('click',()=>proxy(def.upload));block.appendChild(row);
      });container.appendChild(block);
    });
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function processDnc(){
    if(!hasPeriod()){toast('Primero configura el período activo.');navigate('periodos');return;}
    try{renderAll();}catch(e){console.error(e);toast('Ocurrió un error al procesar el DNC.');return;}
    const issues=safeIssues();
    if(issues.length){toast(`DNC procesado con ${issues.length} pendiente(s).`);}else{toast('DNC procesado correctamente. Está listo para aprobación.');}
    updateWorkflow();
  }

  function updateWorkflow(){
    createHome();markTechnicalNavigation();
    const issues=hasPeriod()?safeIssues():[],isApproved=approved(),ready=hasPeriod()&&issues.length===0;
    const set=(id,text)=>{const el=document.getElementById(id);if(el)el.textContent=text;};
    set('workflowPeriod',periodLabel());set('workflowCareers',activeCareers().length);set('workflowLoaded',`${loadedTemplates()}/${TEMPLATE_DEFS.length}`);set('workflowIssuesCount',hasPeriod()?issues.length:'—');
    let status='Datos incompletos',help='Carga las plantillas requeridas y procesa el DNC.';
    if(!hasPeriod()){status='Sin período';help='Configura un período para comenzar.';}else if(isApproved){status='Aprobado';help='Documento cerrado y listo para descargar.';}else if(ready){status='Listo para aprobar';help='Todas las validaciones obligatorias están completas.';}
    set('workflowState',status);set('workflowStateHelp',help);set('workflowPeriodHelp',hasPeriod()?'Período activo':'Paso 1 obligatorio');
    const preview=document.getElementById('workflowPreviewBtn'),approve=document.getElementById('workflowApproveBtn'),reopen=document.getElementById('workflowReopenBtn'),pdf=document.getElementById('workflowPdfBtn');
    if(preview)preview.disabled=!ready&&!isApproved;if(approve){approve.disabled=!ready||isApproved;approve.hidden=isApproved;}if(reopen)reopen.hidden=!isApproved;if(pdf)pdf.disabled=!isApproved;
    const topPreview=document.getElementById('previewDncBtn'),topPdf=document.getElementById('downloadDncBtn');if(topPreview)topPreview.disabled=!ready&&!isApproved;if(topPdf)topPdf.disabled=!isApproved;
    const box=document.getElementById('workflowValidationBox');if(box){
      if(!hasPeriod())box.innerHTML='<strong>Falta el período activo.</strong> Configúralo antes de descargar o cargar información.';
      else if(isApproved)box.innerHTML='<strong>DNC aprobado.</strong> El documento está cerrado. Para modificar información primero debes reabrirlo.';
      else if(!issues.length)box.innerHTML='<strong>Validación completa.</strong> El DNC está listo para vista previa y aprobación.';
      else box.innerHTML=`<strong>${issues.length} pendiente(s) antes de aprobar.</strong><ul class="workflow-issue-list">${issues.slice(0,12).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}${issues.length>12?`<li>… y ${issues.length-12} pendiente(s) más.</li>`:''}</ul>`;
    }
    const panel=document.getElementById('workflowTemplatesPanel');if(panel?.classList.contains('open')){const title=document.getElementById('workflowPanelTitle')?.textContent||'';openTemplatePanel(title.startsWith('Subir')?'upload':'download');}
  }

  function init(){injectStyles();document.body.classList.add('workflow-mode');createHome();markTechnicalNavigation();updateWorkflow();}
  const baseRenderAll=renderAll;renderAll=function(){baseRenderAll();updateWorkflow();};
  init();
})();