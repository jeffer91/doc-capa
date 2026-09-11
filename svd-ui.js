(function(){
  'use strict';

  const core=window.DOC_CAPA_CORE;
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

  function available(view){return !!document.getElementById(`view-${view}`);}
  function activeView(){return document.querySelector('.view.active')?.id?.replace(/^view-/,'')||'';}
  function issueCount(){try{return typeof validateDncForFinal==='function'?[...new Set((validateDncForFinal()||[]).filter(Boolean))].length:0;}catch{return 0;}}

  function injectStyles(){
    if(document.getElementById('svd2Styles'))return;
    const st=document.createElement('style');
    st.id='svd2Styles';
    st.textContent=`
      body.svd2-mode{background:#f4f6f9}
      body.svd2-mode .app-shell{display:block;min-height:100vh}
      body.svd2-mode .sidebar{display:none!important}
      body.svd2-mode .main{min-width:0;width:100%}
      body.svd2-mode .topbar{min-height:auto;padding:11px 24px;gap:16px;position:sticky;top:0;z-index:30;background:#fff}
      body.svd2-mode .topbar .eyebrow{font-size:9px;letter-spacing:.09em;color:#7a8799}
      body.svd2-mode .topbar h1{font-size:16px;margin:2px 0 0;color:var(--navy)}
      body.svd2-mode .topbar-actions{gap:8px;flex-wrap:wrap;justify-content:flex-end}
      body.svd2-mode .global-period-top{gap:7px}
      body.svd2-mode .global-period-top label{font-size:9px}
      body.svd2-mode .global-period-top select{padding:8px 31px 8px 10px;max-width:320px}
      .svd-utility-actions{display:flex;gap:4px;align-items:center}
      .svd-utility-btn{border:0;background:transparent;color:#627087;padding:7px 8px;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer}
      .svd-utility-btn:hover,.svd-utility-btn.active{background:#eef3f8;color:var(--navy)}
      .svd-nav-shell{position:sticky;top:58px;z-index:20;background:#fff;border-bottom:1px solid var(--line);box-shadow:0 5px 16px rgba(15,39,71,.035)}
      .svd-documents{display:flex;gap:8px;overflow-x:auto;padding:10px 24px 8px;scrollbar-width:thin}
      .svd-document{position:relative;flex:0 0 auto;min-width:180px;border:1px solid var(--line);background:#fff;border-radius:9px;padding:9px 12px;text-align:left;color:var(--text);cursor:pointer}
      .svd-document strong,.svd-document small{display:block}
      .svd-document strong{font-size:11.5px;color:var(--navy)}
      .svd-document small{font-size:9.5px;color:var(--muted);margin-top:2px}
      .svd-document.selected{background:#f8fafc;border-color:#b9c8da}
      .svd-document.selected:after{content:'';position:absolute;left:14px;right:14px;bottom:-1px;height:2px;background:#d7aa22;border-radius:2px}
      .svd-document:disabled{opacity:.55;cursor:not-allowed;background:#fafbfd}
      .svd-doc-status{position:absolute;right:10px;top:10px;width:7px;height:7px;border-radius:999px;background:#d7aa22}
      .svd-doc-status.done{background:var(--ok)}
      .svd-sections{display:flex;gap:3px;overflow-x:auto;padding:0 24px;background:#f6f8fb;border-top:1px solid #edf1f6;scrollbar-width:thin}
      .svd-section-tab{flex:0 0 auto;border:0;background:transparent;color:#6d7a8e;padding:10px 9px 9px;font-size:10.5px;font-weight:700;cursor:pointer;position:relative;white-space:nowrap}
      .svd-section-tab:hover{color:var(--navy)}
      .svd-section-tab.active{color:var(--navy)}
      .svd-section-tab.active:after{content:'';position:absolute;left:9px;right:9px;bottom:0;height:2px;background:var(--navy);border-radius:2px}
      body.svd2-mode .view{padding:20px 24px 28px;max-width:1180px;margin:0 auto;width:100%}
      body.svd2-mode .section-heading{margin-bottom:14px;align-items:flex-start}
      body.svd2-mode .section-heading h2{font-size:20px;margin:3px 0 4px}
      body.svd2-mode .section-heading p{font-size:12px;line-height:1.35;max-width:760px}
      body.svd2-mode .card{padding:16px}
      body.svd2-mode .card h3{font-size:14px;margin-bottom:6px}
      body.svd2-mode .card p{font-size:12px;line-height:1.4;margin:5px 0}
      body.svd2-mode .mini-card{padding:13px}
      body.svd2-mode .mini-card strong{font-size:16px}
      body.svd2-mode .workflow-hero{display:none!important}
      body.svd2-mode .workflow-steps{grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:0}
      body.svd2-mode .workflow-step{padding:12px;border-radius:10px;box-shadow:none}
      body.svd2-mode .workflow-step strong{font-size:15px}
      body.svd2-mode .workflow-step small{font-size:10px}
      body.svd2-mode .workflow-actions{gap:7px;margin-top:13px}
      body.svd2-mode .workflow-actions .btn{padding:9px 12px}
      body.svd2-mode .workflow-panel{padding:15px;margin-top:13px;border-radius:11px;box-shadow:none}
      body.svd2-mode .workflow-template-row{padding:9px 0}
      body.svd2-mode .workflow-footer-actions{margin-top:13px;padding-top:13px}
      body.svd2-mode .process-grid{display:none!important}
      body.svd2-mode #view-inicio{display:none!important}
      body.svd2-mode .info-box,body.svd2-mode .notice{font-size:12px;padding:10px 12px;margin-top:11px}
      body.svd2-mode .btn{padding:9px 12px}
      .svd-saved{background:#e9f8f0!important;color:var(--ok)!important;border:1px solid #cdebdc!important}
      body.svd2-mode .diagnostic-shell{max-width:none}
      @media(max-width:900px){
        body.svd2-mode .topbar{position:sticky;padding:10px 16px;align-items:flex-start;flex-direction:column}
        body.svd2-mode .topbar-actions{width:100%;justify-content:flex-start}
        .svd-nav-shell{top:94px}
        .svd-documents,.svd-sections{padding-left:16px;padding-right:16px}
        body.svd2-mode .view{padding:18px 16px 24px}
        body.svd2-mode .workflow-steps{grid-template-columns:1fr 1fr}
      }
      @media(max-width:560px){
        .svd-nav-shell{top:132px}
        .svd-document{min-width:160px}
        body.svd2-mode .workflow-steps{grid-template-columns:1fr}
        .svd-utility-actions{width:100%;overflow-x:auto}
      }
    `;
    document.head.appendChild(st);
  }

  function buildUtilities(){
    const actions=document.querySelector('.topbar-actions');
    if(!actions||document.getElementById('svdUtilityActions'))return;
    const wrap=document.createElement('div');wrap.id='svdUtilityActions';wrap.className='svd-utility-actions';
    UTILITY_VIEWS.filter(x=>available(x.view)).forEach(item=>{
      const b=document.createElement('button');b.type='button';b.className='svd-utility-btn';b.dataset.svdUtility=item.view;b.textContent=item.label;
      b.addEventListener('click',()=>navigate(item.view));wrap.appendChild(b);
    });
    actions.appendChild(wrap);
  }

  function buildDocumentNavigation(){
    const main=document.querySelector('main.main'),top=document.querySelector('.topbar');
    if(!main||!top||document.getElementById('svdNavShell'))return;
    const shell=document.createElement('div');shell.id='svdNavShell';shell.className='svd-nav-shell';
    shell.innerHTML=`<div class="svd-documents" aria-label="Documentos del proceso">
      <button class="svd-document selected" type="button" data-svd-document="dnc"><strong>Detección de Necesidades</strong><small>Documento seleccionado</small><span class="svd-doc-status" id="svdDncStatus" aria-hidden="true"></span></button>
      <button class="svd-document" type="button" disabled><strong>Plan de Capacitación</strong><small>Próximo documento</small></button>
      <button class="svd-document" type="button" disabled><strong>Informe de Cumplimiento</strong><small>Próximo documento</small></button>
    </div><div class="svd-sections" id="svdSectionTabs" aria-label="Secciones del documento"></div>`;
    top.insertAdjacentElement('afterend',shell);
    shell.querySelector('[data-svd-document="dnc"]')?.addEventListener('click',()=>navigate('dnc-operacion'));
    const tabs=shell.querySelector('#svdSectionTabs');
    SECTION_TABS.filter(x=>available(x.view)).forEach(item=>{
      const b=document.createElement('button');b.type='button';b.className='svd-section-tab';b.dataset.svdView=item.view;b.textContent=item.label;
      b.addEventListener('click',()=>navigate(item.view));tabs.appendChild(b);
    });
  }

  function compactTopbar(){
    const eyebrow=document.querySelector('.topbar .eyebrow'),title=document.getElementById('pageTitle');
    if(eyebrow)eyebrow.textContent='DOC-CAPA';
    if(title)title.textContent='Gestión documental';
  }

  function syncNavigation(view=activeView()){
    compactTopbar();
    document.querySelectorAll('.svd-section-tab').forEach(b=>b.classList.toggle('active',b.dataset.svdView===view));
    document.querySelectorAll('.svd-utility-btn').forEach(b=>b.classList.toggle('active',b.dataset.svdUtility===view));
    const dot=document.getElementById('svdDncStatus');
    if(dot){const done=state?.dncStatus==='approved';dot.classList.toggle('done',done);dot.title=done?'Documento finalizado':`${issueCount()} pendiente(s)`;}
  }

  function bindNavigate(){
    if(window.__DOC_CAPA_SVD_NAV__)return;window.__DOC_CAPA_SVD_NAV__=true;
    const base=window.navigate;
    if(typeof base!=='function')return;
    window.navigate=function(view){const out=base(view);requestAnimationFrame(()=>syncNavigation(view));return out;};
  }

  function bindSavedState(id){
    const btn=document.getElementById(id);if(!btn||btn.dataset.svdSavedBound==='1')return;btn.dataset.svdSavedBound='1';
    btn.addEventListener('click',()=>{
      const wasDirty=core?.isDirty?.('document-layout');
      setTimeout(()=>{
        if(wasDirty&&!core?.isDirty?.('document-layout')){
          const original=btn.dataset.svdOriginalText||btn.textContent;btn.dataset.svdOriginalText=original;btn.textContent='Guardado';btn.classList.add('svd-saved');
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
      if(first)navigate(first.view);
    }else syncNavigation(current);
  }

  function init(){
    document.body.classList.add('svd2-mode');injectStyles();compactTopbar();buildUtilities();buildDocumentNavigation();bindNavigate();bindSavedButtons();syncNavigation();setTimeout(directEntry,0);
    window.addEventListener('doccapa:period-changed',()=>syncNavigation());
    window.addEventListener('doccapa:dirty-changed',()=>syncNavigation());
  }

  init();
})();
