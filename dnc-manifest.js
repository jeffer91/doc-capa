(function(){
  'use strict';

  const core=window.DOC_CAPA_CORE,dnc=window.DOC_CAPA_DNC;
  if(!core||!dnc){console.error('Core o cálculos DNC no disponibles.');return;}
  const DOCUMENT_ID='capacitacion-deteccion';
  const TEMPLATE_VERSION='DNC-2026.09.2';
  const STATUS_LABELS={active:'Activo',closed:'Cerrado',archived:'Archivado'};
  const SOURCE_KEYS=['surveys','meetings','coordinators','curricula','peas'];
  const arr=v=>Array.isArray(v)?v:[];
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(v):String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));

  function renderCover(){
    const p=state.period?(typeof periodLabel==='function'?periodLabel():state.period.label||state.period.id):'Período pendiente';
    const logo=state.logo?`<img src="${state.logo}" alt="Logo ITSQMET">`:'<span class="rgi-logo-placeholder">LOGOTIPO<br>ITSQMET</span>';
    const sig=(label,name,role)=>`<div class="signature-col"><div class="signature-space">${label}</div><div><strong>NOMBRE:</strong> ${esc(name)}</div><div><strong>CARGO:</strong> ${esc(role)}</div></div>`;
    return `<section class="doc-cover" data-document-section="portada"><div class="rgi-head"><div class="rgi-logo">${logo}</div><div class="rgi-center"><div class="rgi-unit">Unidad de Gestión de Procesos Académicos</div><div class="rgi-doc">Detección de Necesidades de Capacitación<br>${esc(p)}</div></div><div class="rgi-code"><div><strong>Código:</strong><br>UGPA-RGI1-01-PRO-70-<br>${esc(state.period?.start||'AAAA-MM')}</div></div></div><div class="cover-title"><h1>Detección de Necesidades de Capacitación</h1><h2>${esc(p)}</h2></div><div class="signature-grid">${sig('ELABORADO POR:','Mgs. Jefferson Villarreal','Gestor de Procesos Académicos')}${sig('REVISADO POR:','Ing. Martha Tomalá','Coordinadora General de Carreras')}${sig('APROBADO POR:','Dr. Alex León','Vicerrector')}</div></section>`;
  }

  const exactPdf=fnName=>(doc)=>{const fn=window[fnName];if(typeof fn!=='function')throw new Error(`Renderer PDF institucional no disponible: ${fnName}`);fn(doc);};

  function traceOrigin(key,currentRows){
    const trace=core.getImportTrace()[key];
    if(!trace)return 'Sin archivo de origen confirmado en la trazabilidad v2.';
    const parts=[`Archivo: ${trace.fileName||'sin nombre'}`];
    if(trace.sheet)parts.push(`Hoja/estructura: ${trace.sheet}`);
    if(trace.validRows!=null)parts.push(`Filas válidas: ${trace.validRows}`);
    if(trace.invalidRows!=null)parts.push(`Filas rechazadas: ${trace.invalidRows}`);
    if(currentRows!=null)parts.push(`Registros actuales: ${currentRows}`);
    if(trace.importedAt){try{parts.push(`Importado: ${new Date(trace.importedAt).toLocaleString('es-EC')}`);}catch{}}
    return parts.join(' · ');
  }

  function diagnostics(){
    const out=[],careers=dnc.activeCareers(),analyzed=dnc.analyzedCareers(),winners=careers.filter(c=>!!dnc.winner(c.name)),sources=dnc.sourceCounts(),issues=dnc.approvalIssues(),snap=core.documentSnapshot(DOCUMENT_ID),periodStatus=core.getPeriodStatus(),storage=core.storageEstimate(),official=core.getOfficialVersion(DOCUMENT_ID);
    out.push({group:'Período',label:'Período activo',status:state.period?'ok':'error',value:state.period?(state.period.label||state.period.id):'Sin período',detail:'Contexto global de datos, documento y salidas.'});
    out.push({group:'Período',label:'Estado del período',status:periodStatus==='active'?'ok':periodStatus==='closed'?'warn':'info',value:STATUS_LABELS[periodStatus],detail:periodStatus==='active'?'Edición normal.':periodStatus==='closed'?'Consulta y PDF; cambios excepcionales con confirmación.':'Solo consulta.'});
    out.push({group:'Datos',label:'Carreras del período',status:careers.length?'ok':'error',value:`${careers.length} carrera(s)`,origin:traceOrigin('careers',careers.length),detail:'Fuente única compartida por el DNC.'});
    SOURCE_KEYS.forEach(key=>{const count=sources[key]||0,def=SOURCE_DEFS?.[key];out.push({group:'Datos',label:def?.label||key,status:count?'ok':'warn',value:`${count} registro(s)`,origin:traceOrigin(`source:${key}`,count),detail:count?'Fuente normalizada disponible.':'Fuente pendiente.'});});
    const exactFive=careers.length>0&&careers.every(c=>dnc.candidates(c.name).length===5);
    out.push({group:'Documento DNC',label:'Necesidades candidatas',status:exactFive?'ok':'warn',value:`${analyzed.length}/${careers.length} carrera(s) con 5 candidatas`,origin:traceOrigin('candidates',arr(state.candidates).length)});
    out.push({group:'Documento DNC',label:'Necesidades ganadoras',status:careers.length&&winners.length===careers.length?'ok':'warn',value:`${winners.length}/${careers.length} carrera(s)`});
    out.push({group:'Documento DNC',label:'Resultados por carrera',status:arr(state.results?.careerNeeds).length?'ok':'warn',value:`${arr(state.results?.careerNeeds).length} registro(s)`,origin:traceOrigin('career-results',arr(state.results?.careerNeeds).length)});
    out.push({group:'Documento DNC',label:'Vinculación por carrera',status:arr(state.results?.careerLinks).length?'ok':'warn',value:`${arr(state.results?.careerLinks).length} registro(s)`,origin:traceOrigin('career-links',arr(state.results?.careerLinks).length)});
    out.push({group:'Documento DNC',label:'Capacitación genérica institucional',status:String(dnc.selected().CAPACITACION_GENERICA||'').trim()?'ok':'warn',value:String(dnc.selected().CAPACITACION_GENERICA||'Pendiente'),origin:traceOrigin('generic-results',null)});
    out.push({group:'Documento DNC',label:'Evidencias de anexos',status:dnc.evidenceCount()?'ok':'warn',value:`${dnc.evidenceCount()} evidencia(s) visual(es)`,detail:`Base maestra: ${arr(state.annexes?.masterDatabase).length} registro(s).`,origin:traceOrigin('annex-master',arr(state.annexes?.masterDatabase).length)});
    out.push({group:'Validación',label:'Pendientes antes de aprobar',status:issues.length?'warn':'ok',value:issues.length?`${issues.length} pendiente(s)`:'Sin pendientes',detail:issues.length?issues.slice(0,3).join(' · '):'Validaciones obligatorias superadas.'});
    out.push({group:'Validación',label:'Estado del DNC',status:state.dncStatus==='approved'?'ok':'info',value:state.dncStatus==='approved'?'Aprobado':'Borrador'});
    const htmlCount=snap?.sections?.filter(x=>x.html).length||0,pdfCount=snap?.sections?.filter(x=>x.pdf).length||0,total=snap?.sections?.length||0;
    out.push({group:'PDF y secciones',label:'Manifiesto documental',status:snap?.htmlComplete?'ok':'error',value:`${htmlCount}/${total} secciones independientes`,detail:'Cada sección se obtiene desde su renderer o vista propia; el Core ya no construye el documento completo para localizarla.'});
    out.push({group:'PDF y secciones',label:'PDF por sección',status:snap?.pdfComplete?'ok':'error',value:`${pdfCount}/${total} secciones renderizables`,detail:snap?.pdfComplete?'Prueba en memoria superada para todas las secciones.':(snap?.sections||[]).filter(x=>!x.pdf).map(x=>`${x.title}: ${x.error||'error'}`).slice(0,3).join(' · ')});
    out.push({group:'Arquitectura',label:'Core documental',status:'ok',value:`v${core.VERSION}`,detail:`Plantilla ${TEMPLATE_VERSION}`});
    out.push({group:'Arquitectura',label:'Cálculos canónicos',status:'ok',value:'dnc-calculations.js',detail:'Diagnóstico y nuevas funciones consultan una capa única de cálculos DNC.'});
    out.push({group:'Almacenamiento',label:'Uso de almacenamiento local',status:storage.mb>=4?'error':storage.mb>=3?'warn':'ok',value:`${storage.mb} MB estimados`,detail:storage.mb>=3?'La app se acerca al límite típico del navegador. Reduce evidencias pesadas o migra almacenamiento persistente antes de crecer.':'Uso local dentro de un margen razonable.'});
    out.push({group:'Versionado',label:'Versión oficial registrada',status:official?'ok':'info',value:official?`${official.templateVersion} / Core ${official.coreVersion}`:'Aún no registrada',detail:official?`Registrada ${official.recordedAt}`:'Se registra al aprobar el DNC.'});
    return out;
  }

  core.registerDocument({
    id:DOCUMENT_ID,appId:'capacitacion',title:'Detección de Necesidades de Capacitación',templateVersion:TEMPLATE_VERSION,
    sections:[
      {id:'portada',title:'Portada',kind:'cover',render:renderCover,pdfRenderer:exactPdf('drawCover')},
      {id:'introduccion',title:'1. Introducción',elementId:'introPreview',pdfRenderer:exactPdf('writeIntroPdf')},
      {id:'base-legal',title:'2. Base Legal',elementId:'legalPreview',pdfRenderer:exactPdf('writeLegalPdf')},
      {id:'alineacion',title:'3. Alineación Institucional',elementId:'alignmentPreview',pdfRenderer:exactPdf('writeAlignmentPdf')},
      {id:'metodologia',title:'4. Metodología del Diagnóstico',elementId:'methodPreview',pdfRenderer:exactPdf('writeMethodPdf')},
      {id:'resultados',title:'5. Resultados del Diagnóstico',elementId:'resultsPreview'},
      {id:'resumen',title:'6. Resumen Ejecutivo',elementId:'summaryPreview'},
      {id:'conclusiones',title:'7. Conclusiones',elementId:'conclusionsPreview'},
      {id:'recomendaciones',title:'8. Recomendaciones',elementId:'recommendationsPreview'},
      {id:'bibliografia',title:'9. Bibliografía',elementId:'bibliographyPreview'},
      {id:'anexos',title:'10. Anexos',elementId:'annexesPreview'}
    ],diagnostics
  });

  function descriptorForInput(input){
    if(input.dataset?.source){const key=input.dataset.source,def=SOURCE_DEFS?.[key];return{key:`source:${key}`,label:def?.label||key,sheet:def?.sheet||'Primera hoja',resultHost:`import-${key}`,count:()=>arr(state.sources?.[key]).length};}
    const map={
      careersFileInput:{key:'careers',label:'Carreras del período',sheet:'Carreras',resultHost:'careersImportResult',count:()=>dnc.activeCareers().length},
      candidatesFileInput:{key:'candidates',label:'Necesidades candidatas',sheet:'Candidatas',resultHost:'candidatesImportResult',count:()=>arr(state.candidates).length},
      careerResultsFileInput:{key:'career-results',label:'Resultados por carrera',sheet:'Resultados por carrera',resultHost:'resultsCareerImportResult',count:()=>arr(state.results?.careerNeeds).length},
      careerLinksFileInput:{key:'career-links',label:'Vinculación por carrera',sheet:'Vinculación por carrera',resultHost:'resultsLinksImportResult',count:()=>arr(state.results?.careerLinks).length},
      genericFileInput:{key:'generic-results',label:'Capacitación genérica',sheet:'Libro institucional',resultHost:'resultsGenericImportResult',count:()=>String(dnc.selected().CAPACITACION_GENERICA||'').trim()?1:0},
      specificClassificationFileInput:{key:'specific-classification',label:'Clasificación de capacitaciones específicas',sheet:'Clasificación',resultHost:'specificClassificationImportResult',count:()=>arr(state.results?.specificClassifications).length},
      annexSurveyInput:{key:'annex-survey',label:'Resultados de encuesta para Anexo 5',sheet:'Preguntas / Resultados',resultHost:'annexSurveyImportResult',count:()=>arr(state.annexes?.surveyQuestions).length+arr(state.annexes?.surveyResults).length},
      annexMasterInput:{key:'annex-master',label:'Base maestra del Anexo 8',sheet:'Primera hoja',resultHost:'annexMasterImportResult',count:()=>arr(state.annexes?.masterDatabase).length}
    };
    return map[input.id]||null;
  }

  function parseImportOutcome(text){
    const t=String(text||'').replace(/\s+/g,' ').trim();
    if(!t||/no se pudo|error fatal/i.test(t))return null;
    const valid=Number((t.match(/(\d+)\s+(?:fila\(s\)|registro\(s\)|pregunta\(s\)|resultado\(s\))\s+(?:válid|procesad|cargad)/i)||[])[1]);
    const invalid=Number((t.match(/(\d+)\s+(?:con error|fila\(s\) requieren corrección|rechazad)/i)||[])[1]);
    return{validRows:Number.isFinite(valid)?valid:null,invalidRows:Number.isFinite(invalid)?invalid:null};
  }

  function bindTraceCapture(){
    if(document.documentElement.dataset.dncTraceBound==='2')return;document.documentElement.dataset.dncTraceBound='2';
    document.addEventListener('change',event=>{
      const input=event.target;if(!(input instanceof HTMLInputElement)||input.type!=='file'||!input.files?.length||core.getPeriodStatus()==='archived')return;
      const d=descriptorForInput(input);if(!d)return;const file=input.files[0],host=document.getElementById(d.resultHost),before=d.count();
      const commit=()=>{const text=host?.textContent||'',outcome=parseImportOutcome(text),after=d.count();if(!outcome&&after===before)return false;if(/no se pudo/i.test(text))return false;core.recordImportTrace(d.key,{fileName:file.name,label:d.label,sheet:d.sheet,size:file.size,type:file.type||'',validRows:outcome?.validRows??after,invalidRows:outcome?.invalidRows??null});return true;};
      if(host){let done=false;const observer=new MutationObserver(()=>{if(done)return;if(commit()){done=true;observer.disconnect();renderDiagnosticsView();}});observer.observe(host,{childList:true,subtree:true,characterData:true});setTimeout(()=>{if(!done)commit();observer.disconnect();},3500);}else setTimeout(()=>commit(),1500);
    },true);
  }

  function ensureDiagnosticsUi(){
    const nav=document.querySelector('.sidebar .nav');
    if(nav&&!nav.querySelector('[data-workflow-view="diagnostico"]')){const config=nav.querySelector('[data-workflow-view="configuracion"]');const btn=document.createElement('button');btn.className='nav-item';btn.dataset.workflowView='diagnostico';btn.textContent='Diagnóstico';if(config)nav.insertBefore(btn,config);else nav.appendChild(btn);btn.addEventListener('click',()=>{navigate('diagnostico');const title=document.getElementById('pageTitle');if(title)title.textContent='Diagnóstico del DNC';renderDiagnosticsView();});}
    const main=document.querySelector('main.main'),configView=document.getElementById('view-configuracion');
    if(main&&configView&&!document.getElementById('view-diagnostico')){const section=document.createElement('section');section.id='view-diagnostico';section.className='view';section.innerHTML='<div class="diagnostic-shell"><div class="section-heading"><div><p class="eyebrow">Control técnico</p><h2>Diagnóstico del DNC</h2><p>Localiza faltantes por período, datos, documento, almacenamiento y PDF.</p></div><button class="btn btn-light" id="refreshDiagnosticsBtn">Actualizar</button></div><div class="notice strong-notice">La trazabilidad solo registra una carga cuando existe evidencia de importación procesada; seleccionar un archivo por sí solo no crea un origen.</div><div id="dncDiagnosticsHost"></div></div>';main.insertBefore(section,configView);section.querySelector('#refreshDiagnosticsBtn').addEventListener('click',renderDiagnosticsView);}
  }
  function renderDiagnosticsView(){ensureDiagnosticsUi();const host=document.getElementById('dncDiagnosticsHost');if(host)core.renderDiagnostics(DOCUMENT_ID,host);}

  function enhancePreviewFlow(){
    const preview=document.getElementById('workflowPreviewBtn');
    if(preview&&!preview.dataset.sectionPreviewBound){preview.dataset.sectionPreviewBound='2';preview.textContent='Vista previa por sección';preview.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();if(!state.period)return toast('Selecciona primero un período global.');core.openSectionChooser(DOCUMENT_ID);},true);if(state.period)preview.disabled=false;}
    const footer=document.querySelector('#view-dnc-operacion .workflow-footer-actions');
    if(footer&&!document.getElementById('workflowFullPreviewBtn')){const full=document.createElement('button');full.id='workflowFullPreviewBtn';full.className='btn btn-light';full.textContent='Vista previa completa';const pdf=document.getElementById('workflowPdfBtn');footer.insertBefore(full,pdf||null);full.addEventListener('click',()=>{if(!state.period)return toast('Selecciona primero un período global.');document.getElementById('previewDncBtn')?.click();});}
  }

  function enhancePeriodModal(){const editor=document.getElementById('periodEditorBox');if(!editor||document.getElementById('periodEditorDialog'))return;const dialog=document.createElement('dialog');dialog.id='periodEditorDialog';dialog.className='period-editor-dialog';const head=document.createElement('div');head.className='dialog-head';head.innerHTML='<div><p class="eyebrow">Gestor de períodos</p><h2>Crear / editar período</h2></div><button class="icon-btn" id="periodDialogClose" aria-label="Cerrar">×</button>';dialog.appendChild(head);dialog.appendChild(editor);document.body.appendChild(dialog);dialog.querySelector('#periodDialogClose').addEventListener('click',()=>dialog.close());document.getElementById('cancelGlobalPeriodEditBtn')?.addEventListener('click',()=>dialog.close());document.getElementById('newGlobalPeriodBtn')?.addEventListener('click',()=>{if(!dialog.open)dialog.showModal();},true);document.getElementById('editGlobalPeriodBtn')?.addEventListener('click',()=>{if(!dialog.open)dialog.showModal();},true);window.addEventListener('doccapa:period-created',()=>dialog.open&&dialog.close());window.addEventListener('doccapa:period-updated',()=>dialog.open&&dialog.close());}

  function ensurePeriodStatusUi(){const top=document.getElementById('globalPeriodTop');if(top&&!document.getElementById('periodStatusPill')){const pill=document.createElement('span');pill.id='periodStatusPill';pill.className='period-status-pill';top.appendChild(pill);}const manager=document.querySelector('#globalPeriodManager .period-manager-actions');if(manager&&!document.getElementById('periodStatusSelect')){const wrap=document.createElement('label');wrap.className='period-status-control';wrap.innerHTML='<span>Estado</span><select id="periodStatusSelect"><option value="active">Activo</option><option value="closed">Cerrado</option><option value="archived">Archivado</option></select>';manager.appendChild(wrap);wrap.querySelector('select').addEventListener('change',event=>{const next=event.target.value,current=core.getPeriodStatus();if(next===current)return;const msg=next==='closed'?'Cerrar el período limitará la edición. ¿Continuar?':next==='archived'?'Archivar el período lo dejará en solo consulta. ¿Continuar?':'Reactivar el período habilitará edición normal. ¿Continuar?';if(!window.confirm(msg)){event.target.value=current;return;}core.setPeriodStatus(next);syncPeriodStatusUi();renderDiagnosticsView();});}}
  function syncPeriodStatusUi(){ensurePeriodStatusUi();const status=core.getPeriodStatus(),select=document.getElementById('periodStatusSelect'),pill=document.getElementById('periodStatusPill');if(select){select.value=status;select.disabled=!state.period;}if(pill){pill.textContent=STATUS_LABELS[status];pill.className=`period-status-pill ${status}`;}document.body.dataset.periodStatus=status;}

  function ensureDirtyDialog(){let dialog=document.getElementById('dirtyPeriodDialog');if(dialog)return dialog;dialog=document.createElement('dialog');dialog.id='dirtyPeriodDialog';dialog.className='period-editor-dialog';dialog.innerHTML='<div class="dialog-head"><div><p class="eyebrow">Cambios pendientes</p><h2>Antes de cambiar de período</h2></div></div><div style="padding:20px"><p>Hay cambios de configuración que todavía no se han guardado.</p><div class="candidate-actions" style="justify-content:flex-end"><button class="btn btn-light" data-dirty-action="cancel">Cancelar</button><button class="btn btn-secondary" data-dirty-action="discard">Descartar y cambiar</button><button class="btn btn-primary" data-dirty-action="save">Guardar y cambiar</button></div></div>';document.body.appendChild(dialog);return dialog;}
  function bindDirtyState(){
    const ids=['configPedi','configPoa','configManual','configCacesModel','configCacesYear','configSurveyTool'];ids.forEach(id=>{const el=document.getElementById(id);if(el&&!el.dataset.dirtyBound){el.dataset.dirtyBound='1';el.addEventListener('input',()=>core.markDirty('institutional-config'));el.addEventListener('change',()=>core.markDirty('institutional-config'));}});
    document.getElementById('saveInstitutionalConfigBtn')?.addEventListener('click',()=>setTimeout(()=>core.clearDirty('institutional-config'),0));
    const select=document.getElementById('globalPeriodSelect');if(!select||select.dataset.dirtyGuard==='1')return;select.dataset.dirtyGuard='1';let bypass=false;
    select.addEventListener('change',event=>{if(bypass||!core.isDirty())return;event.preventDefault();event.stopImmediatePropagation();const target=event.target.value,current=window.DOC_CAPA_PERIODS?.getRegistry?.().activeId||'';event.target.value=current;const dialog=ensureDirtyDialog();const handler=e=>{const action=e.target.closest?.('[data-dirty-action]')?.dataset.dirtyAction;if(!action)return;dialog.removeEventListener('click',handler);dialog.close();if(action==='cancel')return;if(action==='save'&&core.isDirty('institutional-config')&&typeof saveInstitutionalConfig==='function')saveInstitutionalConfig();core.clearDirty();bypass=true;event.target.value=target;event.target.dispatchEvent(new Event('change',{bubbles:true}));bypass=false;};dialog.addEventListener('click',handler);dialog.showModal();},true);
  }

  function guardPeriodMutations(){if(document.documentElement.dataset.periodMutationGuard==='2')return;document.documentElement.dataset.periodMutationGuard='2';document.addEventListener('click',event=>{const target=event.target.closest?.('#workflowApproveBtn,#workflowReopenBtn,.template-upload,#saveInstitutionalConfigBtn,#validateCacesBtn,#saveAnnexConvocatoria,.annex-remove');if(!target)return;const status=core.getPeriodStatus();if(status==='archived'){event.preventDefault();event.stopImmediatePropagation();toast('El período está archivado y solo permite consulta.');return;}if(status==='closed'&&(target.id==='workflowApproveBtn'||target.id==='workflowReopenBtn')&&!window.confirm('El período está cerrado. ¿Deseas realizar esta modificación excepcional?')){event.preventDefault();event.stopImmediatePropagation();}},true);document.addEventListener('change',event=>{const input=event.target;if(!(input instanceof HTMLInputElement)||input.type!=='file'||!input.files?.length)return;if(core.getPeriodStatus()==='archived'){event.preventDefault();event.stopImmediatePropagation();input.value='';toast('El período está archivado y no admite nuevas cargas.');}},true);}

  function bindVersioning(){const record=()=>setTimeout(()=>{if(state.dncStatus==='approved')core.recordOfficialVersion(DOCUMENT_ID,{approvedAt:new Date().toISOString()});renderDiagnosticsView();},30);document.getElementById('workflowApproveBtn')?.addEventListener('click',record);document.getElementById('approveDncBtn')?.addEventListener('click',record);}

  function injectStyles(){if(document.getElementById('dncManifestStyles'))return;const style=document.createElement('style');style.id='dncManifestStyles';style.textContent='.period-editor-dialog{width:min(820px,94vw);border:0;border-radius:16px;padding:0;box-shadow:0 24px 70px rgba(15,39,71,.25)}.period-editor-dialog::backdrop{background:rgba(12,25,45,.52)}.period-editor-dialog .dialog-head{padding:18px 20px;border-bottom:1px solid var(--line)}.period-editor-dialog #periodEditorBox{padding:0 20px 20px}.period-status-control{display:flex;align-items:center;gap:7px;border:1px solid var(--line);border-radius:9px;padding:6px 8px;background:#fff}.period-status-control span{font-size:10px;font-weight:800;color:var(--muted);text-transform:uppercase}.period-status-control select{border:0;background:transparent;color:var(--navy);font-weight:800;outline:0}body[data-period-status="archived"] .template-upload{opacity:.42;cursor:not-allowed}';document.head.appendChild(style);}

  function init(){injectStyles();bindTraceCapture();ensureDiagnosticsUi();enhancePreviewFlow();enhancePeriodModal();syncPeriodStatusUi();bindDirtyState();guardPeriodMutations();bindVersioning();renderDiagnosticsView();}
  ['doccapa:period-changed','doccapa:period-created','doccapa:period-updated','doccapa:period-status-changed','doccapa:trace-updated'].forEach(name=>window.addEventListener(name,()=>{syncPeriodStatusUi();bindDirtyState();renderDiagnosticsView();}));
  init();
})();
