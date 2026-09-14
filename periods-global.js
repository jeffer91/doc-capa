(function(){
  'use strict';

  const CATALOG_KEY='doc-capa-period-catalog-v3';
  const DATA_PREFIX='doc-capa-period-data-v3:';
  const LEGACY_KEYS=['doc-capa-periods-v2','doc-capa-periods-v1'];
  const MONTHS=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const YEAR_MIN=2000,YEAR_MAX=2100;
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const core=window.DOC_CAPA_CORE;
  let selectedId=null;
  let busyCount=0;
  let saveStatusTimer=null;

  const emptySources=()=>({surveys:[],meetings:[],coordinators:[],curricula:[],peas:[]});
  const emptyResults=()=>({
    version:1,careerNeeds:[],careerLinks:[],specificClassifications:[],
    institutional:{
      needMeta:[],alternatives:[],
      criteria:['Recurrencia en múltiples carreras','Impacto directo en la docencia','Vinculación con planificación académica','Coherencia con perfiles de egreso','Alineación institucional (PEDI–POA–CACES)'].map(CRITERIO=>({CRITERIO,NIVEL_CUMPLIMIENTO:''})),
      indicators:[],selection:{CAPACITACION_GENERICA:'',NECESIDAD_BASE:'',BRECHA_TRANSVERSAL:'',JUSTIFICACION_RESULTADOS:'',SINTESIS_JUSTIFICACION:'',IMPACTO_PLANIFICACION:'',IMPACTO_ENSENANZA_APRENDIZAJE:'',IMPACTO_RESULTADOS_APRENDIZAJE:'',IMPACTO_METODOLOGIAS:'',IMPACTO_EVALUACION:''}
    }
  });
  const emptyAnnexes=()=>({version:1,evidence:{coordinators:[],instrument:[],teachers:[],virtual:[],surveyResults:[],formStructure:[],convocatoria:[]},surveyQuestions:[],surveyResults:[],masterDatabase:[],masterSheetName:'Base_Maestra',privacyMode:'internal',convocatoria:{date:'',medium:'',recipients:''}});
  const emptyPeriodData=()=>({careers:[],dncStatus:'draft',sources:emptySources(),candidates:[],results:emptyResults(),annexes:emptyAnnexes()});

  function safeParse(raw,fallback=null){try{return raw?JSON.parse(raw):fallback;}catch{return fallback;}}
  function makeYm(year,month){return `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}`;}
  function labelFor(entry){return `${MONTHS[entry.startMonth-1]} ${entry.startYear} – ${MONTHS[entry.endMonth-1]} ${entry.endYear}`;}
  function descriptor(entry){return {id:entry.id,start:makeYm(entry.startYear,entry.startMonth),end:makeYm(entry.endYear,entry.endMonth),label:labelFor(entry)};}
  function sortPeriods(a,b){return (b.startYear-a.startYear)||(b.startMonth-a.startMonth)||(b.endYear-a.endYear)||(b.endMonth-a.endMonth);}
  function isValidRange(sm,sy,em,ey){return sy*12+(sm-1)<=ey*12+(em-1);}
  function dataKey(id){return `${DATA_PREFIX}${id}`;}
  function stripData(entry){const {data,...meta}=entry||{};return meta;}

  function capturePeriodData(){
    registry.globalAssets.resultsImage=state.results?.image??registry.globalAssets.resultsImage??null;
    const results=clone(state.results||emptyResults());delete results.image;
    return {careers:clone(state.careers||[]),dncStatus:state.dncStatus||'draft',sources:clone(state.sources||emptySources()),candidates:clone(state.candidates||[]),results,annexes:clone(state.annexes||emptyAnnexes()),plan:state.plan?clone(state.plan):undefined,report:state.report?clone(state.report):undefined,execution:state.execution?clone(state.execution):undefined};
  }

  function readLegacyRegistry(){
    for(const key of LEGACY_KEYS){const raw=safeParse(localStorage.getItem(key));if(raw&&Array.isArray(raw.periods))return raw;}
    return null;
  }

  function migrateCatalog(){
    const existing=safeParse(localStorage.getItem(CATALOG_KEY));
    if(existing&&Array.isArray(existing.periods))return {version:3,periods:existing.periods.map(stripData),globalAssets:existing.globalAssets||{resultsImage:null}};

    const legacy=readLegacyRegistry();
    const periods=[];
    const globalAssets=legacy?.globalAssets||{resultsImage:state.results?.image??null};
    if(legacy?.periods?.length){
      legacy.periods.forEach(item=>{
        if(!item?.id)return;
        periods.push(stripData(item));
        if(item.data&&!localStorage.getItem(dataKey(item.id)))localStorage.setItem(dataKey(item.id),JSON.stringify(item.data));
      });
    }

    if(state.period?.id){
      const id=state.period.id;
      if(!periods.some(p=>p.id===id)){
        const sm=String(state.period.start||'').match(/^(\d{4})-(\d{2})$/),em=String(state.period.end||'').match(/^(\d{4})-(\d{2})$/);
        if(sm&&em)periods.push({id,startYear:Number(sm[1]),startMonth:Number(sm[2]),endYear:Number(em[1]),endMonth:Number(em[2]),createdAt:new Date().toISOString()});
      }
      if(!localStorage.getItem(dataKey(id)))localStorage.setItem(dataKey(id),JSON.stringify(capturePeriodData()));
    }
    const out={version:3,periods:periods.map(stripData),globalAssets};
    localStorage.setItem(CATALOG_KEY,JSON.stringify(out));
    return out;
  }

  let registry=migrateCatalog();

  function saveCatalog(){
    const payload={version:3,periods:registry.periods.map(stripData),globalAssets:registry.globalAssets||{resultsImage:null}};
    localStorage.setItem(CATALOG_KEY,JSON.stringify(payload));
    localStorage.setItem('doc-capa-periods-v2',JSON.stringify({...payload,activeId:selectedId}));
  }
  function readPeriodData(id){return safeParse(localStorage.getItem(dataKey(id)),emptyPeriodData())||emptyPeriodData();}
  function writePeriodData(id,data){if(id)localStorage.setItem(dataKey(id),JSON.stringify(data||emptyPeriodData()));}
  function activeEntry(){return registry.periods.find(p=>p.id===selectedId)||null;}

  function normalizeResults(data){
    const d=emptyResults(),r={...d,...(data||{})};
    r.careerNeeds=Array.isArray(r.careerNeeds)?r.careerNeeds:[];r.careerLinks=Array.isArray(r.careerLinks)?r.careerLinks:[];r.specificClassifications=Array.isArray(r.specificClassifications)?r.specificClassifications:[];
    r.institutional={...d.institutional,...(r.institutional||{})};r.institutional.needMeta=Array.isArray(r.institutional.needMeta)?r.institutional.needMeta:[];r.institutional.alternatives=Array.isArray(r.institutional.alternatives)?r.institutional.alternatives:[];r.institutional.indicators=Array.isArray(r.institutional.indicators)?r.institutional.indicators:[];r.institutional.criteria=Array.isArray(r.institutional.criteria)&&r.institutional.criteria.length?r.institutional.criteria:d.institutional.criteria;r.institutional.selection={...d.institutional.selection,...(r.institutional.selection||{})};r.image=registry.globalAssets.resultsImage??null;return r;
  }
  function normalizeAnnexes(data){const d=emptyAnnexes(),a={...d,...(data||{})};a.evidence={...d.evidence,...(a.evidence||{})};Object.keys(d.evidence).forEach(k=>{if(!Array.isArray(a.evidence[k]))a.evidence[k]=[];});a.surveyQuestions=Array.isArray(a.surveyQuestions)?a.surveyQuestions:[];a.surveyResults=Array.isArray(a.surveyResults)?a.surveyResults:[];a.masterDatabase=Array.isArray(a.masterDatabase)?a.masterDatabase:[];a.convocatoria={...d.convocatoria,...(a.convocatoria||{})};return a;}

  function applyPeriod(entry,data=readPeriodData(entry.id)){
    state.period=descriptor(entry);state.careers=clone(data.careers||[]);state.dncStatus=data.dncStatus||'draft';state.sources={...emptySources(),...clone(data.sources||{})};state.candidates=clone(data.candidates||[]);state.results=normalizeResults(data.results);state.annexes=normalizeAnnexes(data.annexes);['plan','report','execution'].forEach(k=>{if(data[k]!==undefined)state[k]=clone(data[k]);else if(k in state)delete state[k];});
  }
  function clearPeriodContext(){state.period=null;state.careers=[];state.dncStatus='draft';state.sources=emptySources();state.candidates=[];state.results=normalizeResults(emptyResults());state.annexes=emptyAnnexes();['plan','report','execution','documentMeta'].forEach(k=>{if(k in state)delete state[k];});}
  function periodHasData(value){const data=value?.id&&!value?.careers?readPeriodData(value.id):value?.data||value;if(!data)return false;const result=data.results||{},annex=data.annexes||{};return !!((data.careers||[]).length||(data.candidates||[]).length||Object.values(data.sources||{}).some(v=>Array.isArray(v)&&v.length)||(result.careerNeeds||[]).length||(result.careerLinks||[]).length||(result.specificClassifications||[]).length||(result.institutional?.needMeta||[]).length||(result.institutional?.alternatives||[]).length||(result.institutional?.indicators||[]).length||String(result.institutional?.selection?.CAPACITACION_GENERICA||'').trim()||(annex.surveyQuestions||[]).length||(annex.surveyResults||[]).length||(annex.masterDatabase||[]).length||Object.values(annex.evidence||{}).some(v=>Array.isArray(v)&&v.length)||data.plan||data.report||data.execution);}

  function globalStateSnapshot(){return {period:null,careers:[],logo:state.logo??null,dncStatus:'draft',institutionalConfig:clone(state.institutionalConfig||{}),methodologyImages:clone(state.methodologyImages||{diagnostic:null,sources:null}),sources:emptySources(),candidates:[]};}
  function writeGlobalShell(){localStorage.setItem(STORAGE_KEY,JSON.stringify(globalStateSnapshot()));saveCatalog();}
  function persistSelected(){if(!selectedId)return;writePeriodData(selectedId,capturePeriodData());writeGlobalShell();}

  function saveStatus(text){
    const el=document.getElementById('svdSaveState');if(!el)return;el.textContent=text;el.hidden=false;
    clearTimeout(saveStatusTimer);if(text==='Guardado')saveStatusTimer=setTimeout(()=>{el.hidden=true;},1600);
  }

  saveState=function(){
    if(selectedId){saveStatus('Guardando…');writePeriodData(selectedId,capturePeriodData());}
    writeGlobalShell();
    try{renderAll();}finally{if(selectedId)saveStatus('Guardado');}
  };

  function updateEmptyState(){
    document.body.classList.toggle('doccapa-no-period',!selectedId);
    let empty=document.getElementById('svdPeriodEmptyState');
    if(!empty){empty=document.createElement('div');empty.id='svdPeriodEmptyState';empty.className='svd-period-empty';empty.innerHTML='<div><strong>Selecciona un período para continuar</strong><span>Los documentos y datos se cargarán únicamente para el período que elijas.</span></div>';document.querySelector('main.main')?.appendChild(empty);}
    empty.hidden=!!selectedId;
  }

  function switchPeriod(id,{openDocument=true}={}){
    if(busyCount>0){toast?.('Espera a que termine la carga actual antes de cambiar de período.');renderPeriodUi();return false;}
    if(!id){if(selectedId)persistSelected();selectedId=null;clearPeriodContext();writeGlobalShell();try{renderAll();}catch{}renderPeriodUi();updateEmptyState();window.dispatchEvent(new CustomEvent('doccapa:period-cleared'));return true;}
    const next=registry.periods.find(p=>p.id===id);if(!next)return false;
    if(selectedId&&selectedId!==id){saveStatus('Guardando…');persistSelected();saveStatus('Guardado');}
    selectedId=id;applyPeriod(next);writeGlobalShell();try{renderAll();}catch(error){console.error(error);}renderPeriodUi();updateEmptyState();window.dispatchEvent(new CustomEvent('doccapa:period-changed',{detail:{period:descriptor(next)}}));toast?.(`Período activo: ${labelFor(next)}`);if(openDocument&&typeof window.navigate==='function')requestAnimationFrame(()=>window.navigate('dnc-operacion'));return true;
  }

  function beginAsync(label='operación'){busyCount+=1;document.documentElement.dataset.doccapaBusy=String(busyCount);window.dispatchEvent(new CustomEvent('doccapa:busy-changed',{detail:{busy:true,label,count:busyCount,periodId:selectedId}}));return {periodId:selectedId,label};}
  function endAsync(token){busyCount=Math.max(0,busyCount-1);document.documentElement.dataset.doccapaBusy=String(busyCount);window.dispatchEvent(new CustomEvent('doccapa:busy-changed',{detail:{busy:busyCount>0,label:token?.label||'',count:busyCount,periodId:selectedId}}));}

  function monthOptions(selected){return MONTHS.map((m,i)=>`<option value="${i+1}" ${selected===i+1?'selected':''}>${m[0].toUpperCase()+m.slice(1)}</option>`).join('');}
  function yearOptions(selected){const out=[];for(let y=new Date().getFullYear()+2;y>=YEAR_MIN;y--)out.push(`<option value="${y}" ${selected===y?'selected':''}>${y}</option>`);return out.join('');}

  function ensureStyles(){if(document.getElementById('svd21PeriodStyles'))return;const st=document.createElement('style');st.id='svd21PeriodStyles';st.textContent=`
    #activePeriodChip{display:none!important}.global-period-top{display:flex;align-items:center;gap:6px}.global-period-top label{font-size:8px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}.global-period-top select{border:1px solid var(--line);border-radius:9px;background:#fff;padding:8px 32px 8px 10px;font-weight:700;color:var(--navy);min-width:230px}.period-create-plus{width:34px;height:34px;border:1px solid var(--line);border-radius:9px;background:#fff;color:var(--navy);font-size:19px;font-weight:800;cursor:pointer}.period-active-badge{font-size:9px;font-weight:800;padding:4px 7px;border-radius:999px;background:#e9f8f0;color:var(--ok)}.svd-save-state{font-size:9px;color:#6d7b8d;font-weight:700}.svd-period-empty{min-height:52vh;display:grid;place-items:center;text-align:center;color:#6d7b8d;padding:24px}.svd-period-empty>div{max-width:430px}.svd-period-empty strong{display:block;color:var(--navy);font-size:18px;margin-bottom:7px}.svd-period-empty span{font-size:11px;line-height:1.5}.doccapa-no-period .svd-nav-shell,.doccapa-no-period main.main>.view{display:none!important}.doccapa-no-period #svdPeriodEmptyState{display:grid!important}.period-create-dialog{border:0;border-radius:14px;padding:0;width:min(520px,calc(100vw - 28px));box-shadow:0 20px 60px rgba(15,39,71,.2)}.period-create-dialog::backdrop{background:rgba(15,39,71,.32)}.period-dialog-head,.period-dialog-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px;border-bottom:1px solid #edf0f4}.period-dialog-actions{border-top:1px solid #edf0f4;border-bottom:0;justify-content:flex-end}.period-dialog-body{padding:16px}.period-dialog-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.period-dialog-grid label span{display:block;font-size:10px;font-weight:700;color:var(--muted);margin-bottom:5px}.period-dialog-grid select{width:100%;padding:9px;border:1px solid var(--line);border-radius:8px;background:#fff}.period-list-svd21{display:grid;gap:8px}.period-list-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:9px;background:#fff}.period-list-row small{display:block;color:var(--muted);margin-top:2px}@media(max-width:700px){.global-period-top{width:100%;flex-wrap:wrap}.global-period-top select{min-width:0;flex:1}.period-dialog-grid{grid-template-columns:1fr}}
  `;document.head.appendChild(st);}

  function topbarControl(){
    const top=document.querySelector('.topbar-actions');if(!top)return;
    let wrap=document.getElementById('globalPeriodTop');
    if(!wrap){wrap=document.createElement('div');wrap.id='globalPeriodTop';wrap.className='global-period-top';wrap.innerHTML='<label for="globalPeriodSelect">Período</label><select id="globalPeriodSelect" aria-label="Seleccionar período"></select><button type="button" class="period-create-plus" id="createPeriodPlus" aria-label="Crear período" title="Crear período">+</button><span id="periodActiveBadge" class="period-active-badge" hidden>ACTIVO</span><span id="svdSaveState" class="svd-save-state" hidden>Guardado</span>';top.insertBefore(wrap,document.getElementById('activePeriodChip')||top.firstChild);wrap.querySelector('#globalPeriodSelect').addEventListener('change',e=>switchPeriod(e.target.value));wrap.querySelector('#createPeriodPlus').addEventListener('click',openCreateDialog);}
  }

  function selectorOptions(){const periods=[...registry.periods].sort(sortPeriods);return `<option value="">Seleccionar período</option>${periods.map(p=>`<option value="${p.id}" ${p.id===selectedId?'selected':''}>${labelFor(p)}</option>`).join('')}`;}

  function ensureCreateDialog(){
    let d=document.getElementById('periodCreateDialog');if(d)return d;d=document.createElement('dialog');d.id='periodCreateDialog';d.className='period-create-dialog';const now=new Date(),year=now.getFullYear(),month=now.getMonth()+1;d.innerHTML=`<div class="period-dialog-head"><div><p class="eyebrow">Períodos</p><strong>Crear período académico</strong></div><button type="button" class="icon-btn" id="closePeriodDialog" aria-label="Cerrar">×</button></div><div class="period-dialog-body"><div class="period-dialog-grid"><label><span>Mes de inicio</span><select id="svdPeriodStartMonth">${monthOptions(month)}</select></label><label><span>Año de inicio</span><select id="svdPeriodStartYear">${yearOptions(year)}</select></label><label><span>Mes de fin</span><select id="svdPeriodEndMonth">${monthOptions(month)}</select></label><label><span>Año de fin</span><select id="svdPeriodEndYear">${yearOptions(year)}</select></label></div><div class="info-box" id="svdPeriodDialogMessage">Define el inicio y fin del período.</div></div><div class="period-dialog-actions"><button type="button" class="btn btn-light" id="cancelPeriodDialog">Cancelar</button><button type="button" class="btn btn-primary" id="confirmCreatePeriod">Crear período</button></div>`;document.body.appendChild(d);d.querySelector('#closePeriodDialog').addEventListener('click',()=>d.close());d.querySelector('#cancelPeriodDialog').addEventListener('click',()=>d.close());d.querySelector('#confirmCreatePeriod').addEventListener('click',createPeriodFromDialog);return d;
  }
  function openCreateDialog(){const d=ensureCreateDialog();const now=new Date(),year=now.getFullYear(),month=now.getMonth()+1;d.querySelector('#svdPeriodStartMonth').innerHTML=monthOptions(month);d.querySelector('#svdPeriodEndMonth').innerHTML=monthOptions(month);d.querySelector('#svdPeriodStartYear').innerHTML=yearOptions(year);d.querySelector('#svdPeriodEndYear').innerHTML=yearOptions(year);d.querySelector('#svdPeriodDialogMessage').textContent='Define el inicio y fin del período.';d.showModal();}
  function createPeriodFromDialog(){const d=ensureCreateDialog(),sm=Number(d.querySelector('#svdPeriodStartMonth').value),sy=Number(d.querySelector('#svdPeriodStartYear').value),em=Number(d.querySelector('#svdPeriodEndMonth').value),ey=Number(d.querySelector('#svdPeriodEndYear').value),message=d.querySelector('#svdPeriodDialogMessage');if(!isValidRange(sm,sy,em,ey)){message.textContent='El fin del período no puede ser anterior al inicio.';return;}const id=`PER-${makeYm(sy,sm)}-${makeYm(ey,em)}`,duplicate=registry.periods.find(p=>p.id===id||p.startMonth===sm&&p.startYear===sy&&p.endMonth===em&&p.endYear===ey);if(duplicate){message.textContent='Ese período ya existe. Se seleccionará el período existente.';d.close();switchPeriod(duplicate.id);return;}const entry={id,startMonth:sm,startYear:sy,endMonth:em,endYear:ey,createdAt:new Date().toISOString(),status:'active'};registry.periods.push(entry);writePeriodData(id,emptyPeriodData());saveCatalog();d.close();renderPeriodUi();switchPeriod(id);window.dispatchEvent(new CustomEvent('doccapa:period-created',{detail:{period:descriptor(entry)}}));}

  function managerUi(){const view=document.getElementById('view-periodos');if(!view)return;let panel=document.getElementById('svd21PeriodManager');if(!panel){view.querySelectorAll('article').forEach(a=>a.classList.add('legacy-period-editor'));panel=document.createElement('article');panel.id='svd21PeriodManager';panel.className='card';panel.innerHTML='<div class="section-title-row"><div><h3>Períodos disponibles</h3><p>Elige un período desde la barra superior o crea uno nuevo con +.</p></div><button type="button" class="btn btn-primary" id="periodManagerCreate">Crear período</button></div><div class="period-list-svd21 mt-24" id="svd21PeriodList"></div>';view.querySelector('.section-heading')?.insertAdjacentElement('afterend',panel);panel.querySelector('#periodManagerCreate').addEventListener('click',openCreateDialog);}const list=document.getElementById('svd21PeriodList');if(list){const rows=[...registry.periods].sort(sortPeriods);list.innerHTML=rows.length?rows.map(p=>`<div class="period-list-row"><div><strong>${labelFor(p)}</strong><small>${periodHasData(p)?'Con información guardada':'Sin datos documentales'}</small></div>${p.id===selectedId?'<span class="period-active-badge">ACTIVO</span>':`<button type="button" class="btn btn-light" data-select-period="${p.id}">Seleccionar</button>`}</div>`).join(''):'<div class="info-box">Todavía no existen períodos. Usa + para crear el primero.</div>';list.querySelectorAll('[data-select-period]').forEach(b=>b.addEventListener('click',()=>switchPeriod(b.dataset.selectPeriod)));}}

  function renderPeriodUi(){topbarControl();const select=document.getElementById('globalPeriodSelect');if(select)select.innerHTML=selectorOptions();const badge=document.getElementById('periodActiveBadge');if(badge)badge.hidden=!selectedId;managerUi();updateEmptyState();}

  const baseNavigate=window.navigate;
  if(typeof baseNavigate==='function'&&!window.__DOC_CAPA_PERIOD_GUARD__){window.__DOC_CAPA_PERIOD_GUARD__=true;window.navigate=function(view){const utilities=new Set(['periodos','diagnostico','configuracion']);if(!selectedId&&!utilities.has(view)){updateEmptyState();return false;}return baseNavigate(view);};}

  window.DOC_CAPA_PERIODS={
    getRegistry:()=>({version:3,activeId:selectedId,globalAssets:clone(registry.globalAssets),periods:clone(registry.periods)}),
    setRegistryFromRemote(remote){if(!remote||!Array.isArray(remote.periods))return false;remote.periods.forEach(p=>{if(p?.id&&p.data)writePeriodData(p.id,p.data);});registry={version:3,globalAssets:remote.globalAssets||remote.global_assets||registry.globalAssets||{resultsImage:null},periods:remote.periods.map(stripData)};saveCatalog();if(remote.activeId||remote.active_id)switchPeriod(remote.activeId||remote.active_id,{openDocument:false});else renderPeriodUi();return true;},
    capturePeriodData,periodHasData,persist:()=>{if(selectedId)persistSelected();},switchPeriod,getSelectedId:()=>selectedId,beginAsync,endAsync,isBusy:()=>busyCount>0,readPeriodData:id=>clone(readPeriodData(id))
  };

  ensureStyles();
  clearPeriodContext();
  writeGlobalShell();
  topbarControl();
  managerUi();
  renderPeriodUi();

  const baseRenderAll=renderAll;
  renderAll=function(){const out=baseRenderAll();renderPeriodUi();return out;};
  renderAll();
})();
