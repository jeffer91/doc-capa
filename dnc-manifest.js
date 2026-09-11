(function(){
  'use strict';

  const core=window.DOC_CAPA_CORE;
  if(!core){console.error('DOC_CAPA_CORE no está disponible.');return;}

  const DOCUMENT_ID='capacitacion-deteccion';
  const SOURCE_KEYS=['surveys','meetings','coordinators','curricula','peas'];
  const STATUS_LABELS={active:'Activo',closed:'Cerrado',archived:'Archivado'};

  const safeArray=value=>Array.isArray(value)?value:[];
  const norm=value=>typeof normalized==='function'?normalized(value):String(value??'').trim().toLowerCase();
  const activeCareersSafe=()=>typeof activeCareers==='function'?activeCareers():safeArray(state.careers).filter(c=>c?.active!==false);
  const candidateRows=career=>typeof careerCandidates==='function'?careerCandidates(career):safeArray(state.candidates).filter(x=>norm(x.CARRERA)===norm(career));
  const winner=career=>typeof winnerForCareer==='function'?winnerForCareer(career):candidateRows(career).find(x=>x.GANADORA);
  const periodReady=()=>!!state.period;

  core.registerCalculation('dnc.activeCareers',()=>activeCareersSafe());
  core.registerCalculation('dnc.sourceCounts',()=>Object.fromEntries(SOURCE_KEYS.map(key=>[key,safeArray(state.sources?.[key]).length])));
  core.registerCalculation('dnc.analyzedCareers',()=>activeCareersSafe().filter(c=>candidateRows(c.name).length===5));
  core.registerCalculation('dnc.winners',()=>activeCareersSafe().filter(c=>!!winner(c.name)));
  core.registerCalculation('dnc.approvalIssues',()=>{try{return [...new Set((validateDncForFinal?.()||[]).filter(Boolean))];}catch{return['No fue posible ejecutar la validación final.'];}});

  function traceOrigin(key,currentRows){
    const trace=core.getImportTrace()[key];
    if(!trace)return 'Sin archivo de origen registrado en esta versión. La información ya existente continúa siendo válida, pero su archivo histórico no puede reconstruirse automáticamente.';
    const parts=[`Archivo: ${trace.fileName||'sin nombre'}`];
    if(trace.sheet)parts.push(`Hoja/estructura: ${trace.sheet}`);
    if(currentRows!=null)parts.push(`Registros válidos actuales: ${currentRows}`);
    if(trace.importedAt){
      try{parts.push(`Archivo relacionado: ${new Date(trace.importedAt).toLocaleString('es-EC')}`);}catch{}
    }
    return parts.join(' · ');
  }

  function evidenceCount(){
    const evidence=state.annexes?.evidence||{};
    return Object.values(evidence).reduce((sum,rows)=>sum+safeArray(rows).length,0);
  }

  function diagnostics(){
    const diagnostics=[];
    const careers=activeCareersSafe();
    const analyzed=core.calculate('dnc.analyzedCareers');
    const winners=core.calculate('dnc.winners');
    const sourceCounts=core.calculate('dnc.sourceCounts');
    const issues=core.calculate('dnc.approvalIssues');
    const snapshot=core.documentSnapshot(DOCUMENT_ID);
    const periodStatus=core.getPeriodStatus();

    diagnostics.push({group:'Período',label:'Período activo',status:periodReady()?'ok':'error',value:periodReady()?(state.period.label||periodLabel?.()||state.period.id):'Sin período',detail:'Contexto global de todos los datos, documentos y PDFs.'});
    diagnostics.push({group:'Período',label:'Estado del período',status:periodStatus==='active'?'ok':periodStatus==='closed'?'warn':'info',value:STATUS_LABELS[periodStatus],detail:periodStatus==='active'?'Edición normal.':periodStatus==='closed'?'Consulta y PDF; los cambios requieren confirmación.':'Solo consulta.'});

    diagnostics.push({group:'Datos',label:'Carreras del período',status:careers.length?'ok':'error',value:`${careers.length} carrera(s)`,detail:'Colección única reutilizada por las secciones del DNC.',origin:traceOrigin('careers',careers.length)});
    SOURCE_KEYS.forEach(key=>{
      const def=SOURCE_DEFS?.[key],count=sourceCounts[key]||0;
      diagnostics.push({group:'Datos',label:def?.label||key,status:count?'ok':'warn',value:`${count} registro(s)`,detail:count?'Fuente normalizada y disponible para el diagnóstico.':'Todavía no existe evidencia cargada para esta fuente.',origin:traceOrigin(`source:${key}`,count)});
    });

    const exactFive=careers.length>0&&careers.every(c=>candidateRows(c.name).length===5);
    diagnostics.push({group:'Documento DNC',label:'Necesidades candidatas',status:exactFive?'ok':'warn',value:`${analyzed.length}/${careers.length} carrera(s) con 5 candidatas`,detail:'Cada carrera debe cerrar exactamente cinco necesidades antes de procesar resultados.',origin:traceOrigin('candidates',safeArray(state.candidates).length)});
    diagnostics.push({group:'Documento DNC',label:'Necesidades ganadoras',status:careers.length&&winners.length===careers.length?'ok':'warn',value:`${winners.length}/${careers.length} carrera(s)`,detail:'La ganadora debe estar priorizada y validada por coordinación.'});
    diagnostics.push({group:'Documento DNC',label:'Resultados por carrera',status:safeArray(state.results?.careerNeeds).length?'ok':'warn',value:`${safeArray(state.results?.careerNeeds).length} registro(s)`,origin:traceOrigin('career-results',safeArray(state.results?.careerNeeds).length)});
    diagnostics.push({group:'Documento DNC',label:'Vinculación por carrera',status:safeArray(state.results?.careerLinks).length?'ok':'warn',value:`${safeArray(state.results?.careerLinks).length} registro(s)`,origin:traceOrigin('career-links',safeArray(state.results?.careerLinks).length)});
    diagnostics.push({group:'Documento DNC',label:'Capacitación genérica institucional',status:String(state.results?.institutional?.selection?.CAPACITACION_GENERICA||'').trim()?'ok':'warn',value:String(state.results?.institutional?.selection?.CAPACITACION_GENERICA||'Pendiente'),origin:traceOrigin('generic-results',null)});
    diagnostics.push({group:'Documento DNC',label:'Evidencias de anexos',status:evidenceCount()?'ok':'warn',value:`${evidenceCount()} evidencia(s) visual(es)`,detail:`Base maestra: ${safeArray(state.annexes?.masterDatabase).length} registro(s).`,origin:traceOrigin('annex-master',safeArray(state.annexes?.masterDatabase).length)});

    diagnostics.push({group:'Validación',label:'Pendientes antes de aprobar',status:issues.length?'warn':'ok',value:issues.length?`${issues.length} pendiente(s)`:'Sin pendientes',detail:issues.length?issues.slice(0,3).join(' · '):'El documento cumple las validaciones obligatorias disponibles.'});
    diagnostics.push({group:'Validación',label:'Estado del DNC',status:state.dncStatus==='approved'?'ok':'info',value:state.dncStatus==='approved'?'Aprobado':'Borrador',detail:state.dncStatus==='approved'?'Documento cerrado para edición ordinaria.':'Documento todavía editable.'});

    const sectionCount=snapshot?.sections?.filter(x=>x.found).length||0;
    const sectionTotal=snapshot?.sections?.length||0;
    diagnostics.push({group:'PDF y secciones',label:'Manifiesto documental',status:snapshot?.complete?'ok':'error',value:`${sectionCount}/${sectionTotal} secciones construidas`,detail:'El orden del DNC se declara en un manifiesto único y se verifica contra la salida consolidada.'});
    diagnostics.push({group:'PDF y secciones',label:'PDF completo',status:typeof downloadPdf==='function'?'ok':'error',value:typeof downloadPdf==='function'?'Motor disponible':'Motor no disponible',detail:'Se conserva el PDF institucional actual mientras las secciones se migran progresivamente al Core.'});
    diagnostics.push({group:'PDF y secciones',label:'PDF por sección',status:'ok',value:'Disponible',detail:'Cada sección declarada puede previsualizarse y descargarse de forma independiente desde el Core documental.'});

    return diagnostics;
  }

  core.registerDocument({
    id:DOCUMENT_ID,
    appId:'capacitacion',
    title:'Detección de Necesidades de Capacitación',
    sections:[
      {id:'portada',title:'Portada',kind:'cover'},
      {id:'introduccion',title:'1. Introducción',sourceIndex:0},
      {id:'base-legal',title:'2. Base Legal',sourceIndex:1},
      {id:'alineacion',title:'3. Alineación Institucional',sourceIndex:2},
      {id:'metodologia',title:'4. Metodología del Diagnóstico',sourceIndex:3},
      {id:'resultados',title:'5. Resultados del Diagnóstico',sourceIndex:4},
      {id:'resumen',title:'6. Resumen Ejecutivo',sourceIndex:5},
      {id:'conclusiones',title:'7. Conclusiones',sourceIndex:6},
      {id:'recomendaciones',title:'8. Recomendaciones',sourceIndex:7},
      {id:'bibliografia',title:'9. Bibliografía',sourceIndex:8},
      {id:'anexos',title:'10. Anexos',sourceIndex:9}
    ],
    diagnostics
  });

  function traceDescriptor(input){
    if(input.dataset?.source){
      const key=input.dataset.source,def=SOURCE_DEFS?.[key];
      return{key:`source:${key}`,label:def?.label||key,sheet:def?.sheet||'Primera hoja'};
    }
    if(input.dataset?.annexEvidence)return{key:`evidence:${input.dataset.annexEvidence}`,label:`Evidencia ${input.dataset.annexEvidence}`,sheet:'Imagen / evidencia visual'};
    const map={
      careersFileInput:['careers','Carreras del período','Carreras'],
      candidatesFileInput:['candidates','Necesidades candidatas','Candidatas'],
      careerResultsFileInput:['career-results','Resultados por carrera','Resultados por carrera'],
      careerLinksFileInput:['career-links','Vinculación por carrera','Vinculación por carrera'],
      genericFileInput:['generic-results','Capacitación genérica','Libro institucional'],
      specificClassificationFileInput:['specific-classification','Clasificación de capacitaciones específicas','Clasificación'],
      annexSurveyInput:['annex-survey','Resultados de encuesta para Anexo 5','Preguntas / Resultados'],
      annexMasterInput:['annex-master','Base maestra del Anexo 8','Primera hoja']
    };
    const found=map[input.id];
    if(found)return{key:found[0],label:found[1],sheet:found[2]};
    return null;
  }

  function bindTraceCapture(){
    if(document.documentElement.dataset.dncTraceBound==='1')return;
    document.documentElement.dataset.dncTraceBound='1';
    document.addEventListener('change',event=>{
      const input=event.target;
      if(!(input instanceof HTMLInputElement)||input.type!=='file'||!input.files?.length)return;
      if(core.getPeriodStatus()==='archived')return;
      const descriptor=traceDescriptor(input);if(!descriptor)return;
      const file=input.files[0];
      core.recordImportTrace(descriptor.key,{fileName:file.name,label:descriptor.label,sheet:descriptor.sheet,size:file.size,type:file.type||''});
      setTimeout(renderDiagnosticsView,650);
    },true);
  }

  function ensureDiagnosticsUi(){
    const nav=document.querySelector('.sidebar .nav');
    if(nav&&!nav.querySelector('[data-workflow-view="diagnostico"]')){
      const config=nav.querySelector('[data-workflow-view="configuracion"]');
      const btn=document.createElement('button');
      btn.className='nav-item';btn.dataset.workflowView='diagnostico';btn.textContent='Diagnóstico';
      if(config)nav.insertBefore(btn,config);else nav.appendChild(btn);
      btn.addEventListener('click',()=>{
        navigate('diagnostico');
        const title=document.getElementById('pageTitle');if(title)title.textContent='Diagnóstico del DNC';
        renderDiagnosticsView();
      });
    }

    const main=document.querySelector('main.main'),configView=document.getElementById('view-configuracion');
    if(main&&configView&&!document.getElementById('view-diagnostico')){
      const section=document.createElement('section');section.id='view-diagnostico';section.className='view';
      section.innerHTML=`<div class="diagnostic-shell"><div class="section-heading"><div><p class="eyebrow">Control técnico</p><h2>Diagnóstico del DNC</h2><p>Localiza faltantes por período, datos, documento y PDF sin revisar todo el informe.</p></div><button class="btn btn-light" id="refreshDiagnosticsBtn">Actualizar</button></div><div class="notice strong-notice">El diagnóstico muestra el estado actual y, cuando existe trazabilidad registrada, permite identificar el archivo de origen de los datos.</div><div id="dncDiagnosticsHost"></div></div>`;
      main.insertBefore(section,configView);
      section.querySelector('#refreshDiagnosticsBtn').addEventListener('click',renderDiagnosticsView);
    }
  }

  function renderDiagnosticsView(){
    ensureDiagnosticsUi();
    const host=document.getElementById('dncDiagnosticsHost');
    if(host)core.renderDiagnostics(DOCUMENT_ID,host);
  }

  function enhancePreviewFlow(){
    const preview=document.getElementById('workflowPreviewBtn');
    if(preview&&!preview.dataset.sectionPreviewBound){
      preview.dataset.sectionPreviewBound='1';
      preview.textContent='Vista previa por sección';
      preview.addEventListener('click',event=>{
        event.preventDefault();event.stopImmediatePropagation();
        if(!periodReady()){toast('Selecciona primero un período global.');return;}
        core.openSectionChooser(DOCUMENT_ID);
      },true);
      new MutationObserver(()=>{
        if(periodReady()&&preview.disabled)preview.disabled=false;
      }).observe(preview,{attributes:true,attributeFilter:['disabled']});
      if(periodReady())preview.disabled=false;
    }

    const footer=document.querySelector('#view-dnc-operacion .workflow-footer-actions');
    if(footer&&!document.getElementById('workflowFullPreviewBtn')){
      const full=document.createElement('button');full.id='workflowFullPreviewBtn';full.className='btn btn-light';full.textContent='Vista previa completa';
      const pdf=document.getElementById('workflowPdfBtn');
      footer.insertBefore(full,pdf||null);
      full.addEventListener('click',()=>{
        if(!periodReady())return toast('Selecciona primero un período global.');
        const dialog=document.getElementById('pdfPreviewDialog');
        const title=dialog?.querySelector('.dialog-head h2');if(title)title.textContent='Detección de Necesidades de Capacitación';
        document.getElementById('previewDncBtn')?.click();
      });
    }
  }

  function enhancePeriodModal(){
    const editor=document.getElementById('periodEditorBox');
    if(!editor||document.getElementById('periodEditorDialog'))return;
    const dialog=document.createElement('dialog');dialog.id='periodEditorDialog';dialog.className='period-editor-dialog';
    const head=document.createElement('div');head.className='dialog-head';head.innerHTML='<div><p class="eyebrow">Gestor de períodos</p><h2>Crear / editar período</h2></div><button class="icon-btn" id="periodDialogClose" aria-label="Cerrar">×</button>';
    dialog.appendChild(head);dialog.appendChild(editor);document.body.appendChild(dialog);
    dialog.querySelector('#periodDialogClose').addEventListener('click',()=>dialog.close());
    document.getElementById('cancelGlobalPeriodEditBtn')?.addEventListener('click',()=>dialog.close());
    document.getElementById('newGlobalPeriodBtn')?.addEventListener('click',()=>{if(!dialog.open)dialog.showModal();},true);
    document.getElementById('editGlobalPeriodBtn')?.addEventListener('click',()=>{if(!dialog.open)dialog.showModal();},true);
    window.addEventListener('doccapa:period-created',()=>dialog.open&&dialog.close());
    window.addEventListener('doccapa:period-updated',()=>dialog.open&&dialog.close());
  }

  function ensurePeriodStatusUi(){
    const top=document.getElementById('globalPeriodTop');
    if(top&&!document.getElementById('periodStatusPill')){
      const pill=document.createElement('span');pill.id='periodStatusPill';pill.className='period-status-pill';top.appendChild(pill);
    }
    const manager=document.querySelector('#globalPeriodManager .period-manager-actions');
    if(manager&&!document.getElementById('periodStatusSelect')){
      const wrap=document.createElement('label');wrap.className='period-status-control';wrap.innerHTML='<span>Estado</span><select id="periodStatusSelect"><option value="active">Activo</option><option value="closed">Cerrado</option><option value="archived">Archivado</option></select>';
      manager.appendChild(wrap);
      wrap.querySelector('select').addEventListener('change',event=>{
        const next=event.target.value,current=core.getPeriodStatus();
        if(next===current)return;
        const message=next==='closed'?'Cerrar el período limitará la edición y pedirá confirmación para cambios excepcionales. ¿Continuar?':next==='archived'?'Archivar el período lo dejará en modo de solo consulta. ¿Continuar?':'Reactivar el período habilitará nuevamente la edición normal. ¿Continuar?';
        if(!window.confirm(message)){event.target.value=current;return;}
        core.setPeriodStatus(next);syncPeriodStatusUi();renderDiagnosticsView();
      });
    }
  }

  function syncPeriodStatusUi(){
    ensurePeriodStatusUi();
    const status=core.getPeriodStatus();
    const select=document.getElementById('periodStatusSelect');if(select){select.value=status;select.disabled=!periodReady();}
    const pill=document.getElementById('periodStatusPill');if(pill){pill.textContent=STATUS_LABELS[status];pill.className=`period-status-pill ${status}`;}
    document.body.dataset.periodStatus=status;
  }

  function guardPeriodMutations(){
    if(document.documentElement.dataset.periodMutationGuard==='1')return;
    document.documentElement.dataset.periodMutationGuard='1';
    document.addEventListener('click',event=>{
      const target=event.target.closest?.('#workflowApproveBtn,#workflowReopenBtn,.template-upload,#saveInstitutionalConfigBtn,#validateCacesBtn,#saveAnnexConvocatoria,.annex-remove');
      if(!target)return;
      const status=core.getPeriodStatus();
      if(status==='archived'){
        event.preventDefault();event.stopImmediatePropagation();toast('El período está archivado y solo permite consulta.');return;
      }
      if(status==='closed'&&(target.id==='workflowApproveBtn'||target.id==='workflowReopenBtn')){
        if(!window.confirm('El período está cerrado. ¿Deseas realizar esta modificación excepcional?')){event.preventDefault();event.stopImmediatePropagation();}
      }
    },true);
    document.addEventListener('change',event=>{
      const input=event.target;
      if(!(input instanceof HTMLInputElement)||input.type!=='file'||!input.files?.length)return;
      if(core.getPeriodStatus()==='archived'){
        event.preventDefault();event.stopImmediatePropagation();input.value='';toast('El período está archivado y no admite nuevas cargas.');
      }
    },true);
  }

  function injectStyles(){
    if(document.getElementById('dncManifestStyles'))return;
    const style=document.createElement('style');style.id='dncManifestStyles';style.textContent=`
      .period-editor-dialog{width:min(820px,94vw);border:0;border-radius:16px;padding:0;box-shadow:0 24px 70px rgba(15,39,71,.25)}.period-editor-dialog::backdrop{background:rgba(12,25,45,.52)}.period-editor-dialog .dialog-head{padding:18px 20px;border-bottom:1px solid var(--line)}.period-editor-dialog #periodEditorBox{padding:0 20px 20px}.period-editor-dialog .period-lock-note{margin-bottom:0}
      .period-status-control{display:flex;align-items:center;gap:7px;border:1px solid var(--line);border-radius:9px;padding:6px 8px;background:#fff}.period-status-control span{font-size:10px;font-weight:800;color:var(--muted);text-transform:uppercase}.period-status-control select{border:0;background:transparent;color:var(--navy);font-weight:800;outline:0}
      body[data-period-status="archived"] .template-upload{opacity:.42;cursor:not-allowed}
    `;document.head.appendChild(style);
  }

  function init(){
    injectStyles();
    bindTraceCapture();
    ensureDiagnosticsUi();
    enhancePreviewFlow();
    enhancePeriodModal();
    syncPeriodStatusUi();
    guardPeriodMutations();
    renderDiagnosticsView();
  }

  window.addEventListener('doccapa:period-changed',()=>{syncPeriodStatusUi();renderDiagnosticsView();});
  window.addEventListener('doccapa:period-created',()=>{syncPeriodStatusUi();renderDiagnosticsView();});
  window.addEventListener('doccapa:period-updated',()=>{syncPeriodStatusUi();renderDiagnosticsView();});
  window.addEventListener('doccapa:period-status-changed',()=>{syncPeriodStatusUi();renderDiagnosticsView();});
  window.addEventListener('doccapa:trace-updated',()=>renderDiagnosticsView());

  init();
})();
