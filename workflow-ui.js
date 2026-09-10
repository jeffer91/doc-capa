(function(){
  'use strict';

  const TEMPLATE_DEFS=[
    {
      group:'Datos base',
      label:'Carreras del período',
      download:'#downloadCareersTemplateBtn',
      upload:'#careersFileInput',
      loaded:()=>activeCareers().length>0,
      ready:()=>hasPeriod(),
      reason:'Selecciona un período global.'
    },
    {
      group:'Fuentes del diagnóstico',
      label:'Encuestas institucionales',
      download:'[data-template="surveys"]',
      upload:'[data-source="surveys"]',
      loaded:()=>hasSource('surveys'),
      ready:()=>activeCareers().length>0,
      reason:'Primero carga las carreras del período.'
    },
    {
      group:'Fuentes del diagnóstico',
      label:'Reuniones académicas',
      download:'[data-template="meetings"]',
      upload:'[data-source="meetings"]',
      loaded:()=>hasSource('meetings'),
      ready:()=>activeCareers().length>0,
      reason:'Primero carga las carreras del período.'
    },
    {
      group:'Fuentes del diagnóstico',
      label:'Criterio del coordinador',
      download:'[data-template="coordinators"]',
      upload:'[data-source="coordinators"]',
      loaded:()=>hasSource('coordinators'),
      ready:()=>activeCareers().length>0,
      reason:'Primero carga las carreras del período.'
    },
    {
      group:'Fuentes del diagnóstico',
      label:'Mallas curriculares',
      download:'[data-template="curricula"]',
      upload:'[data-source="curricula"]',
      loaded:()=>hasSource('curricula'),
      ready:()=>activeCareers().length>0,
      reason:'Primero carga las carreras del período.'
    },
    {
      group:'Fuentes del diagnóstico',
      label:'Planes de Enseñanza–Aprendizaje (PEA)',
      download:'[data-template="peas"]',
      upload:'[data-source="peas"]',
      loaded:()=>hasSource('peas'),
      ready:()=>activeCareers().length>0,
      reason:'Primero carga las carreras del período.'
    },
    {
      group:'Priorización',
      label:'Necesidades candidatas por carrera',
      download:'#downloadCandidatesTemplateBtn',
      upload:'#candidatesFileInput',
      loaded:()=>activeCareers().some(c=>careerCandidates(c.name).length>0),
      ready:()=>activeCareers().length>0&&Object.keys(SOURCE_DEFS||{}).every(k=>hasSource(k)),
      reason:'Completa las cinco fuentes del diagnóstico antes de priorizar.'
    },
    {
      group:'Resultados',
      label:'Resultados por carrera',
      download:'#downloadCareerResultsTemplateBtn',
      upload:'#careerResultsFileInput',
      loaded:()=>Array.isArray(state.results?.careerNeeds)&&state.results.careerNeeds.length>0,
      ready:()=>activeCareers().length>0&&activeCareers().every(c=>careerCandidates(c.name).length===5),
      reason:'Cada carrera debe tener exactamente cinco necesidades candidatas.'
    },
    {
      group:'Resultados',
      label:'Vinculación por carrera',
      download:'#downloadCareerLinksTemplateBtn',
      upload:'#careerLinksFileInput',
      loaded:()=>Array.isArray(state.results?.careerLinks)&&state.results.careerLinks.length>0,
      ready:()=>activeCareers().length>0&&activeCareers().every(c=>!!winnerForCareer(c.name)),
      reason:'Primero define y valida una necesidad ganadora por cada carrera.'
    },
    {
      group:'Resultados',
      label:'Capacitación genérica institucional',
      download:'#downloadGenericTemplateBtn',
      upload:'#genericFileInput',
      loaded:()=>!!String(state.results?.institutional?.selection?.CAPACITACION_GENERICA||'').trim(),
      ready:()=>Array.isArray(state.results?.careerNeeds)&&state.results.careerNeeds.length>0&&Array.isArray(state.results?.careerLinks)&&state.results.careerLinks.length>0,
      reason:'Primero procesa resultados y vinculación por carrera.'
    },
    {
      group:'Resultados',
      label:'Clasificación de capacitaciones específicas',
      download:'#downloadSpecificClassificationBtn',
      upload:'#specificClassificationFileInput',
      loaded:()=>Array.isArray(state.results?.specificClassifications)&&state.results.specificClassifications.length>0,
      ready:()=>Array.isArray(state.results?.careerLinks)&&state.results.careerLinks.length>0,
      reason:'Primero carga la vinculación por carrera.'
    },
    {
      group:'Anexos',
      label:'Resultados de encuesta para Anexo 5',
      download:'#downloadAnnexSurveyTemplate',
      upload:'#annexSurveyInput',
      loaded:()=>Array.isArray(state.annexes?.surveyQuestions)&&state.annexes.surveyQuestions.length>0,
      ready:()=>hasSource('surveys'),
      reason:'Primero carga la fuente de encuestas institucionales.'
    }
  ];

  function safeIssues(){
    try{return [...new Set((validateDncForFinal?.()||[]).filter(Boolean))];}
    catch(e){console.error(e);return['No fue posible ejecutar la validación completa del DNC.'];}
  }
  function hasPeriod(){return !!(state.period&&(state.period.start||state.period.startMonth)&&(state.period.end||state.period.endMonth));}
  function periodLabelSafe(){try{return periodLabel();}catch{return state.period?.label||'Sin período activo';}}
  function approved(){return state.dncStatus==='approved';}
  function loadedTemplates(){return TEMPLATE_DEFS.filter(x=>{try{return x.loaded();}catch{return false;}}).length;}
  function get(selector){return document.querySelector(selector);}
  function proxy(selector){
    const el=get(selector);
    if(!el){toast('Esta carga todavía no está disponible.');return;}
    el.click();
  }
  function templateReady(def){try{return !!def.ready();}catch{return false;}}

  function injectStyles(){
    if(document.getElementById('workflowUiStyles'))return;
    const st=document.createElement('style');
    st.id='workflowUiStyles';
    st.textContent=`
      body.workflow-mode #previewDncBtn,body.workflow-mode #downloadDncBtn{display:none!important}
      .workflow-hidden{display:none!important}
      .workflow-shell{max-width:1120px;margin:0 auto}
      .workflow-hero{background:linear-gradient(135deg,var(--navy),var(--navy2));color:#fff;border-radius:18px;padding:28px;box-shadow:var(--shadow)}
      .workflow-hero-top{display:flex;justify-content:space-between;gap:22px;align-items:flex-start}
      .workflow-hero h2{font-size:28px;margin:8px 0 8px}
      .workflow-hero p{margin:0;color:#d7e2ef;line-height:1.5}
      .workflow-state{min-width:210px;text-align:right}
      .workflow-state strong{display:block;font-size:18px}
      .workflow-state span{font-size:11px;color:#c7d4e8}
      .workflow-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:20px}
      .workflow-step{background:#fff;border:1px solid var(--line);border-radius:14px;padding:17px;box-shadow:var(--shadow)}
      .workflow-step span{display:block;font-size:11px;color:var(--muted)}
      .workflow-step strong{display:block;margin-top:5px;font-size:18px}
      .workflow-step small{display:block;margin-top:4px;color:#8b96a7}
      .workflow-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
      .workflow-actions .btn{padding:12px 16px}
      .workflow-actions .process-action{background:#2f6feb;color:#fff}
      .workflow-actions button:disabled,.workflow-template-row button:disabled{opacity:.42;cursor:not-allowed}
      .workflow-panel{display:none;background:#fff;border:1px solid var(--line);border-radius:14px;padding:20px;margin-top:18px;box-shadow:var(--shadow)}
      .workflow-panel.open{display:block}
      .workflow-panel-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:14px}
      .workflow-panel-head h3{margin:0 0 5px}.workflow-panel-head p{margin:0;color:var(--muted);font-size:12px}
      .workflow-template-group{margin-top:18px}.workflow-template-group>strong{display:block;margin-bottom:8px}
      .workflow-template-row{display:grid;grid-template-columns:minmax(260px,1fr) auto;gap:12px;align-items:center;padding:11px 0;border-bottom:1px solid var(--line)}
      .workflow-template-row:last-child{border-bottom:0}
      .workflow-template-name small{display:block;color:var(--muted);margin-top:4px}
      .workflow-ok{color:var(--ok)!important;font-weight:700}.workflow-pending{color:var(--warn)!important;font-weight:700}
      .workflow-blocked{color:#8a5a00!important}
      .workflow-validation{margin-top:18px}.workflow-validation .info-box{margin-top:0}
      .workflow-issue-list{margin:8px 0 0 18px;padding:0}.workflow-issue-list li{margin:5px 0;color:#59667a}
      .workflow-footer-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;padding-top:18px;border-top:1px solid var(--line)}
      .process-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:22px}
      .process-card{background:#fff;border:1px solid var(--line);border-radius:15px;padding:20px;box-shadow:var(--shadow)}
      .process-card h3{margin:8px 0}.process-card p{color:var(--muted);font-size:12px;line-height:1.5}
      .process-card.disabled{opacity:.58}
      .sidebar .nav-section,.sidebar .nav-item.sub{display:none!important}
      @media(max-width:900px){
        .workflow-steps{grid-template-columns:1fr 1fr}.workflow-hero-top{flex-direction:column}.workflow-state{text-align:left}
        .workflow-template-row{grid-template-columns:1fr}.process-grid{grid-template-columns:1fr}
      }
      @media(max-width:560px){.workflow-steps{grid-template-columns:1fr}.workflow-actions{display:grid}.workflow-actions .btn{width:100%}}
    `;
    document.head.appendChild(st);
  }

  function rebuildSidebar(){
    const nav=document.querySelector('.sidebar .nav');
    if(!nav||nav.dataset.workflowBuilt==='1')return;
    nav.dataset.workflowBuilt='1';
    nav.innerHTML=`
      <button class="nav-item active" data-workflow-view="inicio">Inicio</button>
      <button class="nav-item" data-workflow-view="periodos">Períodos</button>
      <button class="nav-item" data-workflow-view="dnc-operacion">Detección de Necesidades</button>
      <button class="nav-item disabled" disabled>Plan de Capacitación</button>
      <button class="nav-item disabled" disabled>Informe de Cumplimiento</button>
      <button class="nav-item" data-workflow-view="configuracion">Configuración</button>
    `;
    nav.querySelectorAll('[data-workflow-view]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const view=btn.dataset.workflowView;
        navigate(view);
        nav.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
        btn.classList.add('active');
        if(view==='dnc-operacion')openTemplatePanel('download');
      });
    });
  }

  function createLanding(){
    const home=document.getElementById('view-inicio');
    if(!home||document.getElementById('workflowLanding'))return;
    [...home.children].forEach(ch=>ch.classList.add('workflow-hidden'));
    const wrap=document.createElement('div');
    wrap.id='workflowLanding';
    wrap.className='workflow-shell';
    wrap.innerHTML=`
      <div class="workflow-hero">
        <div class="workflow-hero-top">
          <div><span class="pill">Capacitación docente</span><h2>Documentos del proceso</h2><p>Selecciona un período global y trabaja cada documento desde sus plantillas y validaciones.</p></div>
          <div class="workflow-state"><strong id="landingPeriod">Sin período</strong><span>Período global activo</span></div>
        </div>
      </div>
      <div class="process-grid">
        <article class="process-card"><span class="status ready">Disponible</span><h3>Detección de Necesidades</h3><p>Descarga plantillas, carga información, procesa el diagnóstico y genera el PDF institucional.</p><button class="btn btn-primary" id="landingDncBtn">Abrir documento</button></article>
        <article class="process-card disabled"><span class="status">Siguiente proceso</span><h3>Plan de Capacitación</h3><p>Se habilitará como documento independiente y reutilizará los resultados aprobados del DNC.</p></article>
        <article class="process-card disabled"><span class="status">Siguiente proceso</span><h3>Informe de Cumplimiento</h3><p>Se alimentará del Plan y de las evidencias de ejecución del período.</p></article>
      </div>`;
    home.appendChild(wrap);
    document.getElementById('landingDncBtn').addEventListener('click',()=>{
      navigate('dnc-operacion');
      document.querySelector('.sidebar .nav [data-workflow-view="dnc-operacion"]')?.classList.add('active');
      document.querySelector('.sidebar .nav [data-workflow-view="inicio"]')?.classList.remove('active');
      openTemplatePanel('download');
    });
  }

  function createDncView(){
    if(document.getElementById('view-dnc-operacion'))return;
    const main=document.querySelector('main.main');
    const config=document.getElementById('view-configuracion');
    if(!main||!config)return;
    const section=document.createElement('section');
    section.id='view-dnc-operacion';
    section.className='view';
    section.innerHTML=`
      <div class="workflow-shell">
        <div class="workflow-hero">
          <div class="workflow-hero-top">
            <div><span class="pill">Detección de Necesidades de Capacitación</span><h2>Plantillas y procesamiento DNC</h2><p>La estructura documental se genera internamente. Aquí solo trabajas con datos, plantillas, evidencias y validaciones.</p></div>
            <div class="workflow-state"><strong id="workflowState">Sin período</strong><span id="workflowStateHelp">Selecciona el período global para comenzar.</span></div>
          </div>
        </div>
        <div class="workflow-steps">
          <article class="workflow-step"><span>Período global</span><strong id="workflowPeriod">Sin período</strong><small>Seleccionado arriba</small></article>
          <article class="workflow-step"><span>Carreras</span><strong id="workflowCareers">0</strong><small>Cargadas para el período</small></article>
          <article class="workflow-step"><span>Plantillas con datos</span><strong id="workflowLoaded">0/${TEMPLATE_DEFS.length}</strong><small>Datos base, fuentes y resultados</small></article>
          <article class="workflow-step"><span>Pendientes</span><strong id="workflowIssuesCount">—</strong><small>Validaciones antes de aprobar</small></article>
        </div>
        <div class="workflow-actions">
          <button class="btn btn-secondary" id="workflowDownloadBtn">Descargar plantillas</button>
          <button class="btn btn-secondary" id="workflowUploadBtn">Subir plantillas</button>
          <button class="btn process-action" id="workflowProcessBtn">Procesar DNC</button>
          <button class="btn btn-light" id="workflowEvidenceBtn">Cargar evidencias</button>
        </div>
        <div class="workflow-panel" id="workflowTemplatesPanel">
          <div class="workflow-panel-head">
            <div><h3 id="workflowPanelTitle">Plantillas del DNC</h3><p id="workflowPanelHelp">Descarga o carga cada plantilla desde un único lugar.</p></div>
            <button class="icon-btn" id="workflowPanelClose" aria-label="Cerrar">×</button>
          </div>
          <div id="workflowTemplateRows"></div>
        </div>
        <div class="workflow-validation"><div id="workflowValidationBox" class="info-box">Selecciona un período global para iniciar el proceso.</div></div>
        <div class="workflow-footer-actions">
          <button class="btn btn-light" id="workflowPreviewBtn">Vista previa</button>
          <button class="btn btn-primary" id="workflowApproveBtn">Aprobar DNC</button>
          <button class="btn btn-light" id="workflowReopenBtn" hidden>Reabrir DNC</button>
          <button class="btn btn-primary" id="workflowPdfBtn">Descargar PDF</button>
        </div>
      </div>`;
    main.insertBefore(section,config);

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

  function prepareEvidenceView(){
    const view=document.getElementById('view-dnc-anexos');
    if(!view||view.dataset.workflowPrepared==='1')return;
    view.dataset.workflowPrepared='1';
    const eyebrow=view.querySelector('.section-heading .eyebrow');
    const title=view.querySelector('.section-heading h2');
    const desc=view.querySelector('.section-heading p:not(.eyebrow)');
    if(eyebrow)eyebrow.textContent='Detección de Necesidades';
    if(title)title.textContent='Evidencias del DNC';
    if(desc)desc.textContent='Carga y organiza las evidencias que respaldarán los anexos del documento.';
  }

  function openTemplatePanel(mode){
    if(!hasPeriod()){
      toast('Selecciona o crea un período global antes de trabajar con plantillas.');
      navigate('periodos');
      return;
    }
    const panel=document.getElementById('workflowTemplatesPanel');
    if(!panel)return;
    panel.classList.add('open');
    document.getElementById('workflowPanelTitle').textContent=mode==='download'?'Descargar plantillas':'Subir plantillas';
    document.getElementById('workflowPanelHelp').textContent=mode==='download'
      ?'Las plantillas dependientes se habilitan cuando completas los pasos previos.'
      :'Carga los Excel completados. Las filas válidas se conservan y las erróneas generan una plantilla de corrección.';
    const groups=[...new Set(TEMPLATE_DEFS.map(x=>x.group))];
    const container=document.getElementById('workflowTemplateRows');
    container.innerHTML='';
    groups.forEach(group=>{
      const block=document.createElement('div');
      block.className='workflow-template-group';
      block.innerHTML=`<strong>${group}</strong>`;
      TEMPLATE_DEFS.filter(x=>x.group===group).forEach(def=>{
        let loaded=false;try{loaded=def.loaded();}catch{}
        const ready=templateReady(def);
        const row=document.createElement('div');
        row.className='workflow-template-row';
        const status=loaded?'Datos cargados':ready?'Disponible':`Bloqueada · ${def.reason}`;
        const statusClass=loaded?'workflow-ok':ready?'workflow-pending':'workflow-blocked';
        row.innerHTML=`
          <div class="workflow-template-name"><strong>${def.label}</strong><small class="${statusClass}">${status}</small></div>
          <button class="btn ${mode==='download'?'btn-light':'btn-secondary'} workflow-row-action" ${ready?'':'disabled'}>${mode==='download'?'Descargar':'Subir Excel'}</button>`;
        row.querySelector('.workflow-row-action').addEventListener('click',()=>{
          if(!ready){toast(def.reason);return;}
          proxy(mode==='download'?def.download:def.upload);
        });
        block.appendChild(row);
      });
      container.appendChild(block);
    });
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function processDnc(){
    if(!hasPeriod()){
      toast('Selecciona primero el período global.');
      navigate('periodos');
      return;
    }
    try{renderAll();}catch(e){console.error(e);toast('Ocurrió un error al procesar el DNC.');return;}
    const issues=safeIssues();
    toast(issues.length?`DNC procesado con ${issues.length} pendiente(s).`:'DNC procesado correctamente. Está listo para aprobación.');
    updateWorkflow();
  }

  function updateWorkflow(){
    createLanding();createDncView();rebuildSidebar();prepareEvidenceView();
    const issues=hasPeriod()?safeIssues():[];
    const isApproved=approved();
    const ready=hasPeriod()&&issues.length===0;
    const set=(id,text)=>{const el=document.getElementById(id);if(el)el.textContent=text;};

    set('landingPeriod',hasPeriod()?periodLabelSafe():'Sin período');
    set('workflowPeriod',hasPeriod()?periodLabelSafe():'Sin período');
    set('workflowCareers',activeCareers().length);
    set('workflowLoaded',`${loadedTemplates()}/${TEMPLATE_DEFS.length}`);
    set('workflowIssuesCount',hasPeriod()?issues.length:'—');

    let status='Datos incompletos',help='Carga las plantillas habilitadas y procesa el DNC.';
    if(!hasPeriod()){status='Sin período';help='Selecciona el período global para comenzar.';}
    else if(isApproved){status='Aprobado';help='Documento cerrado y listo para descargar.';}
    else if(ready){status='Listo para aprobar';help='Todas las validaciones obligatorias están completas.';}
    set('workflowState',status);set('workflowStateHelp',help);

    const preview=document.getElementById('workflowPreviewBtn');
    const approve=document.getElementById('workflowApproveBtn');
    const reopen=document.getElementById('workflowReopenBtn');
    const pdf=document.getElementById('workflowPdfBtn');
    if(preview)preview.disabled=!ready&&!isApproved;
    if(approve){approve.disabled=!ready||isApproved;approve.hidden=isApproved;}
    if(reopen)reopen.hidden=!isApproved;
    if(pdf)pdf.disabled=!isApproved;

    const box=document.getElementById('workflowValidationBox');
    if(box){
      if(!hasPeriod())box.innerHTML='<strong>Falta seleccionar el período global.</strong> Créalo o selecciónalo desde la barra superior.';
      else if(isApproved)box.innerHTML='<strong>DNC aprobado.</strong> El documento está cerrado. Para modificar información primero debes reabrirlo.';
      else if(!issues.length)box.innerHTML='<strong>Validación completa.</strong> El DNC está listo para vista previa y aprobación.';
      else box.innerHTML=`<strong>${issues.length} pendiente(s) antes de aprobar.</strong><ul class="workflow-issue-list">${issues.slice(0,12).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}${issues.length>12?`<li>… y ${issues.length-12} pendiente(s) más.</li>`:''}</ul>`;
    }

    const panel=document.getElementById('workflowTemplatesPanel');
    if(panel?.classList.contains('open')){
      const title=document.getElementById('workflowPanelTitle')?.textContent||'';
      openTemplatePanel(title.startsWith('Subir')?'upload':'download');
    }
  }

  function init(){
    injectStyles();
    document.body.classList.add('workflow-mode');
    rebuildSidebar();
    createLanding();
    createDncView();
    prepareEvidenceView();
    updateWorkflow();
  }

  const baseRenderAll=renderAll;
  renderAll=function(){const out=baseRenderAll();updateWorkflow();return out;};

  const baseNavigate=navigate;
  navigate=function(view){
    const out=baseNavigate(view);
    const titles={
      inicio:'Panel de capacitación docente',
      periodos:'Períodos',
      'dnc-operacion':'Detección de Necesidades de Capacitación',
      configuracion:'Configuración'
    };
    if(titles[view])document.getElementById('pageTitle').textContent=titles[view];
    document.querySelectorAll('.sidebar .nav .nav-item').forEach(x=>x.classList.remove('active'));
    document.querySelector(`.sidebar .nav [data-workflow-view="${view}"]`)?.classList.add('active');
    return out;
  };

  init();
})();