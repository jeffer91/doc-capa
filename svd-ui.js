(function(){
  'use strict';

  const core=window.DOC_CAPA_CORE;
  const MINIMAL_ISSUE_LIMIT=4;
  const SECTION_TABS=[
    {view:'dnc-operacion',label:'Información'},
    {view:'dnc-introduccion',label:'Introducción'},
    {view:'dnc-base-legal',label:'Base legal'},
    {view:'dnc-alineacion',label:'Alineación'},
    {view:'dnc-metodologia',label:'Metodología'},
    {view:'dnc-resultados',label:'Resultados'},
    {view:'dnc-resumen',label:'Resumen'},
    {view:'dnc-conclusiones',label:'Conclusiones'},
    {view:'dnc-recomendaciones',label:'Recomendaciones'},
    {view:'dnc-bibliografia',label:'Bibliografía'},
    {view:'dnc-anexos',label:'Anexos'},
    {view:'documento-portada',label:'Portada'},
    {view:'documento-cabecera',label:'Cabecera'}
  ];
  const UTILITY_VIEWS=[
    {view:'periodos',label:'Períodos'},
    {view:'diagnostico',label:'Diagnóstico'},
    {view:'configuracion',label:'Configuración'}
  ];

  let validationObserver=null;
  let validationSignature='';

  function available(view){return !!document.getElementById(`view-${view}`);}
  function activeView(){return document.querySelector('.view.active')?.id?.replace(/^view-/,'')||'';}
  function issueCount(){
    try{return typeof validateDncForFinal==='function'?[...new Set((validateDncForFinal()||[]).filter(Boolean))].length:0;}
    catch(error){console.error('DOC-CAPA SVD: no se pudieron leer las validaciones.',error);return 0;}
  }
  function go(view){if(typeof window.navigate==='function')return window.navigate(view);return false;}

  function injectStyles(){
    if(document.getElementById('svd2Styles'))return;
    const st=document.createElement('style');
    st.id='svd2Styles';
    st.textContent=`
      body.svd2-mode{background:#f7f8fa}
      body.svd2-mode .app-shell{display:block;min-height:100vh}
      body.svd2-mode .main{min-width:0;width:100%}
      body.svd2-mode .topbar{min-height:auto;padding:9px 20px;gap:14px;position:sticky;top:0;z-index:30;background:#fff;border-bottom:1px solid #edf0f4}
      body.svd2-mode .topbar .eyebrow{font-size:8px;letter-spacing:.09em;color:#8a95a4}
      body.svd2-mode .topbar h1{font-size:15px;margin:1px 0 0;color:var(--navy)}
      body.svd2-mode .topbar-actions{gap:6px;flex-wrap:wrap;justify-content:flex-end}
      body.svd2-mode .global-period-top{gap:6px}
      body.svd2-mode .global-period-top label{font-size:8px}
      body.svd2-mode .global-period-top select{padding:7px 30px 7px 9px;max-width:300px;border-color:#e3e8ef}
      .svd-utility-actions{display:flex;gap:2px;align-items:center}
      .svd-utility-btn{border:0;background:transparent;color:#69778a;padding:6px 7px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer}
      .svd-utility-btn:hover,.svd-utility-btn.active{background:#f1f4f7;color:var(--navy)}
      .svd-nav-shell{position:sticky;top:52px;z-index:20;background:#fff;border-bottom:1px solid #e9edf2;box-shadow:none}
      .svd-documents{display:flex;gap:4px;overflow-x:auto;padding:7px 20px 6px;scrollbar-width:thin}
      .svd-document{position:relative;flex:0 0 auto;min-width:auto;border:0;background:transparent;border-radius:7px;padding:7px 22px 7px 10px;text-align:left;color:var(--text);cursor:pointer}
      .svd-document strong{display:block;font-size:10.5px;color:var(--navy)}
      .svd-document small{display:none}
      .svd-document.selected{background:#f4f7fa}
      .svd-document.selected:after{content:'';position:absolute;left:10px;right:10px;bottom:-6px;height:2px;background:#d7aa22;border-radius:2px}
      .svd-document:disabled{opacity:.42;cursor:not-allowed;background:transparent}
      .svd-doc-status{position:absolute;right:8px;top:10px;width:6px;height:6px;border-radius:999px;background:#d7aa22}
      .svd-doc-status.done{background:var(--ok)}
      .svd-sections{display:flex;gap:1px;overflow-x:auto;padding:0 20px;background:#fafbfc;border-top:1px solid #f0f2f5;scrollbar-width:thin}
      .svd-section-tab{flex:0 0 auto;border:0;background:transparent;color:#748096;padding:8px 8px 7px;font-size:9.5px;font-weight:700;cursor:pointer;position:relative;white-space:nowrap}
      .svd-section-tab:hover,.svd-section-tab.active{color:var(--navy)}
      .svd-section-tab.active:after{content:'';position:absolute;left:8px;right:8px;bottom:0;height:2px;background:var(--navy);border-radius:2px}
      body.svd2-mode .view{padding:16px 20px 24px;max-width:1020px;margin:0 auto;width:100%}
      body.svd2-mode .section-heading{margin-bottom:12px;align-items:flex-start}
      body.svd2-mode .section-heading h2{font-size:18px;margin:2px 0 3px}
      body.svd2-mode .section-heading p{font-size:11px;line-height:1.35;max-width:720px}
      body.svd2-mode .card{padding:14px;box-shadow:none;border-color:#e4e9ef}
      body.svd2-mode .card h3{font-size:13px;margin-bottom:5px}
      body.svd2-mode .card p{font-size:11px;line-height:1.38;margin:4px 0}
      body.svd2-mode .mini-card{padding:11px}
      body.svd2-mode .mini-card strong{font-size:15px}
      body.svd2-mode .workflow-hero{display:none!important}
      body.svd2-mode #view-dnc-operacion .workflow-shell{max-width:900px}
      body.svd2-mode #view-dnc-operacion .workflow-steps{grid-template-columns:minmax(0,1fr) minmax(150px,.42fr);gap:8px;margin-top:0}
      body.svd2-mode #view-dnc-operacion .workflow-step:nth-child(-n+2){display:none}
      body.svd2-mode #view-dnc-operacion .workflow-step{padding:11px 12px;border-radius:9px;box-shadow:none;background:#fff;border:1px solid #e4e9ef}
      body.svd2-mode #view-dnc-operacion .workflow-step span{font-size:9.5px}
      body.svd2-mode #view-dnc-operacion .workflow-step strong{font-size:15px;margin-top:2px}
      body.svd2-mode #view-dnc-operacion .workflow-step small{font-size:9.5px;margin-top:2px}
      .svd-next-step{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0 8px;margin-top:2px}
      .svd-next-step span{display:block;font-size:9px;color:#8a95a4;text-transform:uppercase;letter-spacing:.07em;font-weight:800}
      .svd-next-step strong{display:block;margin-top:2px;font-size:12px;color:var(--navy);font-weight:800}
      body.svd2-mode #view-dnc-operacion .workflow-actions{gap:6px;margin-top:3px;padding-bottom:4px}
      body.svd2-mode #view-dnc-operacion .workflow-actions .btn{padding:8px 10px;font-size:10.5px;background:#fff;color:var(--navy);border:1px solid #dce3eb;box-shadow:none}
      body.svd2-mode #view-dnc-operacion .workflow-actions .process-action{background:#fff;color:var(--navy);border-color:#dce3eb}
      body.svd2-mode #view-dnc-operacion .workflow-panel{padding:13px;margin-top:10px;border-radius:9px;box-shadow:none;border-color:#e4e9ef}
      body.svd2-mode #view-dnc-operacion .workflow-template-row{padding:8px 0}
      body.svd2-mode #view-dnc-operacion .workflow-validation{margin-top:11px}
      body.svd2-mode #view-dnc-operacion #workflowValidationBox{background:transparent;border:0;padding:10px 0 4px;margin:0;color:#566477}
      body.svd2-mode #view-dnc-operacion #workflowValidationBox>strong{display:block;color:var(--navy);font-size:11.5px;margin-bottom:5px}
      body.svd2-mode #view-dnc-operacion .workflow-issue-list{margin:6px 0 0 16px;padding:0}
      body.svd2-mode #view-dnc-operacion .workflow-issue-list li{font-size:10.5px;line-height:1.35;margin:3px 0;color:#657286}
      .svd-issue-hidden{display:none!important}
      .svd-issues-toggle{border:0;background:transparent;color:var(--navy);padding:5px 0 0;font-size:10px;font-weight:800;cursor:pointer}
      body.svd2-mode #view-dnc-operacion .workflow-footer-actions{justify-content:flex-end;gap:5px;margin-top:8px;padding-top:8px;border-top:1px solid #edf0f4}
      body.svd2-mode #view-dnc-operacion .workflow-footer-actions .btn{padding:7px 10px;font-size:10px;background:transparent;color:#5f6f82;border:1px solid transparent;box-shadow:none}
      body.svd2-mode #view-dnc-operacion .workflow-footer-actions .btn:hover{background:#f3f5f8;color:var(--navy)}
      body.svd2-mode #view-dnc-operacion .svd-primary-action{background:var(--navy)!important;color:#fff!important;border-color:var(--navy)!important;box-shadow:none!important}
      body.svd2-mode #view-dnc-operacion .svd-primary-action:disabled{opacity:.45!important}
      body.svd2-mode .process-grid{display:none!important}
      body.svd2-mode .info-box,body.svd2-mode .notice{font-size:11px;padding:9px 10px;margin-top:9px}
      body.svd2-mode .btn{padding:8px 10px}
      .svd-saved{background:#e9f8f0!important;color:var(--ok)!important;border:1px solid #cdebdc!important}
      body.svd2-mode .diagnostic-shell{max-width:none}
      body.doccapa-load-error .svd-nav-shell{border-bottom-color:#e0a7a2}
      @media(max-width:900px){
        body.svd2-mode .topbar{position:sticky;padding:9px 14px;align-items:flex-start;flex-direction:column}
        body.svd2-mode .topbar-actions{width:100%;justify-content:flex-start}
        .svd-nav-shell{top:88px}
        .svd-documents,.svd-sections{padding-left:14px;padding-right:14px}
        body.svd2-mode .view{padding:15px 14px 22px}
      }
      @media(max-width:560px){
        .svd-nav-shell{top:126px}.svd-document{padding-right:20px}
        body.svd2-mode #view-dnc-operacion .workflow-steps{grid-template-columns:1fr}
        .svd-utility-actions{width:100%;overflow-x:auto}
        .svd-next-step{align-items:flex-start;flex-direction:column}
        body.svd2-mode #view-dnc-operacion .workflow-actions{display:flex}
        body.svd2-mode #view-dnc-operacion .workflow-actions .btn{width:auto}
      }
    `;
    document.head.appendChild(st);
  }

  function compactTopbar(){
    const eyebrow=document.querySelector('.topbar .eyebrow');
    const title=document.getElementById('pageTitle');
    if(eyebrow)eyebrow.textContent='DOC-CAPA';
    if(title)title.textContent='Gestión documental';
  }

  function buildUtilities(){
    const actions=document.querySelector('.topbar-actions');
    if(!actions||document.getElementById('svdUtilityActions'))return;
    const wrap=document.createElement('div');
    wrap.id='svdUtilityActions';
    wrap.className='svd-utility-actions';
    UTILITY_VIEWS.filter(x=>available(x.view)).forEach(item=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='svd-utility-btn';
      button.dataset.svdUtility=item.view;
      button.textContent=item.label;
      button.addEventListener('click',()=>go(item.view));
      wrap.appendChild(button);
    });
    actions.appendChild(wrap);
  }

  function buildDocumentNavigation(){
    const top=document.querySelector('.topbar');
    if(!top||document.getElementById('svdNavShell'))return;
    const shell=document.createElement('div');
    shell.id='svdNavShell';
    shell.className='svd-nav-shell';
    shell.innerHTML=`<div class="svd-documents" aria-label="Documentos del proceso">
      <button class="svd-document selected" type="button" data-svd-document="dnc"><strong>Detección de Necesidades</strong><small>Documento seleccionado</small><span class="svd-doc-status" id="svdDncStatus" aria-hidden="true"></span></button>
      <button class="svd-document" type="button" disabled><strong>Plan de Capacitación</strong><small>Próximo documento</small></button>
      <button class="svd-document" type="button" disabled><strong>Informe de Cumplimiento</strong><small>Próximo documento</small></button>
    </div><div class="svd-sections" id="svdSectionTabs" aria-label="Secciones del documento"></div>`;
    top.insertAdjacentElement('afterend',shell);
    shell.querySelector('[data-svd-document="dnc"]')?.addEventListener('click',()=>go('dnc-operacion'));
    const tabs=shell.querySelector('#svdSectionTabs');
    SECTION_TABS.filter(x=>available(x.view)).forEach(item=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='svd-section-tab';
      button.dataset.svdView=item.view;
      button.textContent=item.label;
      button.addEventListener('click',()=>go(item.view));
      tabs.appendChild(button);
    });
  }

  function removeLegacyRuntime(){
    document.querySelector('.sidebar')?.remove();
    document.getElementById('view-inicio')?.remove();
  }

  function validationListSignature(list){
    if(!list)return'';
    return [...list.querySelectorAll(':scope > li')].map(li=>li.textContent.trim()).join('\u241f');
  }

  function compactValidation(force=false){
    const box=document.getElementById('workflowValidationBox');
    const list=box?.querySelector('.workflow-issue-list');
    if(!box||!list){validationSignature='';return;}
    const items=[...list.querySelectorAll(':scope > li')];
    if(!items.length){validationSignature='';box.querySelector('.svd-issues-toggle')?.remove();return;}

    const signature=validationListSignature(list);
    const existingToggle=box.querySelector('.svd-issues-toggle');
    if(!force&&signature===validationSignature&&existingToggle)return;
    validationSignature=signature;

    const expanded=box.dataset.svdExpanded==='1';
    items.forEach((li,index)=>li.classList.toggle('svd-issue-hidden',!expanded&&index>=MINIMAL_ISSUE_LIMIT));

    let toggle=existingToggle;
    if(items.length>MINIMAL_ISSUE_LIMIT){
      if(!toggle){
        toggle=document.createElement('button');
        toggle.type='button';
        toggle.className='svd-issues-toggle';
        toggle.addEventListener('click',()=>{
          box.dataset.svdExpanded=box.dataset.svdExpanded==='1'?'0':'1';
          compactValidation(true);
        });
        box.appendChild(toggle);
      }
      const label=expanded?'Ver menos':`Ver todos los pendientes (${issueCount()})`;
      if(toggle.textContent!==label)toggle.textContent=label;
    }else if(toggle){
      toggle.remove();
    }
  }

  function ensureValidationObserver(){
    const box=document.getElementById('workflowValidationBox');
    if(!box||box.dataset.svdObserved==='1')return;
    box.dataset.svdObserved='1';
    validationObserver=new MutationObserver(mutations=>{
      const structuralChange=mutations.some(m=>m.type==='childList'&&m.target===box);
      if(!structuralChange)return;
      const list=box.querySelector('.workflow-issue-list');
      const signature=validationListSignature(list);
      const toggle=box.querySelector('.svd-issues-toggle');
      if(signature===validationSignature&&toggle)return;
      compactValidation();
    });
    validationObserver.observe(box,{childList:true});
  }

  function workflowProgress(){
    const loadedText=document.getElementById('workflowLoaded')?.textContent||'0/0';
    const match=loadedText.match(/(\d+)\s*\/\s*(\d+)/);
    return{loaded:Number(match?.[1]||0),total:Number(match?.[2]||0)};
  }

  function syncWorkflowPrimaryAction(){
    const view=document.getElementById('view-dnc-operacion');
    if(!view)return;
    const careers=document.getElementById('workflowCareers')?.textContent||'0';
    const progress=workflowProgress();
    const progressSmall=document.getElementById('workflowLoaded')?.closest('.workflow-step')?.querySelector('small');
    if(progressSmall)progressSmall.textContent=`${careers} carreras · datos base y resultados`;

    const labels={
      workflowDownloadBtn:'Plantillas',
      workflowUploadBtn:'Cargar datos',
      workflowProcessBtn:'Procesar DNC',
      workflowEvidenceBtn:'Evidencias',
      workflowPreviewBtn:'Vista previa',
      workflowApproveBtn:'Aprobar',
      workflowPdfBtn:'PDF'
    };
    Object.entries(labels).forEach(([id,label])=>{const el=document.getElementById(id);if(el&&el.textContent!==label)el.textContent=label;});

    let next=document.getElementById('svdNextStep');
    const actions=view.querySelector('.workflow-actions');
    if(actions&&!next){
      next=document.createElement('div');
      next.id='svdNextStep';
      next.className='svd-next-step';
      next.innerHTML='<div><span>Siguiente paso</span><strong id="svdNextStepText">Continúa con el DNC</strong></div>';
      actions.insertAdjacentElement('beforebegin',next);
    }

    const candidates=['workflowDownloadBtn','workflowUploadBtn','workflowProcessBtn','workflowEvidenceBtn','workflowPreviewBtn','workflowApproveBtn','workflowPdfBtn'];
    candidates.forEach(id=>document.getElementById(id)?.classList.remove('svd-primary-action'));

    const issues=issueCount();
    const hasPeriod=!!state?.period;
    const approved=state?.dncStatus==='approved';
    let message='Selecciona un período para comenzar.';
    let primaryId='';
    if(hasPeriod&&approved){message='Documento aprobado. Genera el PDF final cuando lo necesites.';primaryId='workflowPdfBtn';}
    else if(hasPeriod&&progress.total&&progress.loaded<progress.total){message=`Completa las plantillas del DNC (${progress.loaded}/${progress.total}).`;primaryId='workflowUploadBtn';}
    else if(hasPeriod&&issues>0){message=`Revisa ${issues} pendiente(s) y procesa el diagnóstico.`;primaryId='workflowProcessBtn';}
    else if(hasPeriod){message='El DNC está listo para aprobación.';primaryId='workflowApproveBtn';}
    const text=document.getElementById('svdNextStepText');
    if(text&&text.textContent!==message)text.textContent=message;
    const primary=document.getElementById(primaryId);
    if(primary&&!primary.disabled)primary.classList.add('svd-primary-action');
  }

  function simplifyWorkflow(){
    if(!document.getElementById('view-dnc-operacion'))return;
    ensureValidationObserver();
    compactValidation();
    syncWorkflowPrimaryAction();
  }

  function syncNavigation(view=activeView()){
    compactTopbar();
    document.querySelectorAll('.svd-section-tab').forEach(button=>button.classList.toggle('active',button.dataset.svdView===view));
    document.querySelectorAll('.svd-utility-btn').forEach(button=>button.classList.toggle('active',button.dataset.svdUtility===view));
    const dot=document.getElementById('svdDncStatus');
    if(dot){
      const done=state?.dncStatus==='approved';
      dot.classList.toggle('done',done);
      dot.title=done?'Documento finalizado':`${issueCount()} pendiente(s)`;
    }
    simplifyWorkflow();
  }

  function bindNavigate(){
    if(window.__DOC_CAPA_SVD_NAV__)return;
    window.__DOC_CAPA_SVD_NAV__=true;
    const base=window.navigate;
    if(typeof base!=='function')return;
    window.navigate=function(view){
      const out=base(view);
      requestAnimationFrame(()=>syncNavigation(view));
      return out;
    };
  }

  function bindSavedState(id){
    const btn=document.getElementById(id);
    if(!btn||btn.dataset.svdSavedBound==='1')return;
    btn.dataset.svdSavedBound='1';
    btn.addEventListener('click',()=>{
      const wasDirty=core?.isDirty?.('document-layout');
      setTimeout(()=>{
        if(wasDirty&&!core?.isDirty?.('document-layout')){
          const original=btn.dataset.svdOriginalText||btn.textContent;
          btn.dataset.svdOriginalText=original;
          btn.textContent='Guardado';
          btn.classList.add('svd-saved');
          setTimeout(()=>{btn.textContent=original;btn.classList.remove('svd-saved');},1800);
        }
      },0);
    });
  }
  function bindSavedButtons(){bindSavedState('saveCoverConfigBtn');bindSavedState('saveHeaderConfigBtn');}

  function directEntry(){
    const current=activeView();
    if(!current||current==='inicio'){
      const first=SECTION_TABS.find(x=>available(x.view));
      if(first)go(first.view);
    }else{
      syncNavigation(current);
    }
  }

  function init(){
    document.body.classList.add('svd2-mode');
    injectStyles();
    compactTopbar();
    buildUtilities();
    buildDocumentNavigation();
    bindNavigate();
    bindSavedButtons();
    directEntry();
    removeLegacyRuntime();
    syncNavigation();
    window.addEventListener('doccapa:period-changed',()=>requestAnimationFrame(()=>syncNavigation()));
    window.addEventListener('doccapa:dirty-changed',()=>requestAnimationFrame(()=>syncNavigation()));
    document.documentElement.dataset.doccapaReady='1';
    window.dispatchEvent(new CustomEvent('doccapa:ready'));
  }

  try{init();}
  catch(error){
    console.error('DOC-CAPA SVD: fallo de inicialización.',error);
    document.documentElement.dataset.doccapaReady='0';
    throw error;
  }
})();
