(function(){
  'use strict';

  const PERIOD_STORAGE_KEY='doc-capa-periods-v2';
  const PREVIOUS_PERIOD_STORAGE_KEYS=['doc-capa-periods-v1'];
  const MONTHS=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const YEAR_MIN=2000,YEAR_MAX=2100;
  let editMode='create';

  const clone=value=>JSON.parse(JSON.stringify(value));
  const emptySources=()=>({surveys:[],meetings:[],coordinators:[],curricula:[],peas:[]});
  const emptyResults=()=>({
    version:1,
    careerNeeds:[],careerLinks:[],specificClassifications:[],
    institutional:{
      needMeta:[],alternatives:[],
      criteria:[
        'Recurrencia en múltiples carreras','Impacto directo en la docencia','Vinculación con planificación académica','Coherencia con perfiles de egreso','Alineación institucional (PEDI–POA–CACES)'
      ].map(CRITERIO=>({CRITERIO,NIVEL_CUMPLIMIENTO:''})),
      indicators:[],
      selection:{CAPACITACION_GENERICA:'',NECESIDAD_BASE:'',BRECHA_TRANSVERSAL:'',JUSTIFICACION_RESULTADOS:'',SINTESIS_JUSTIFICACION:'',IMPACTO_PLANIFICACION:'',IMPACTO_ENSENANZA_APRENDIZAJE:'',IMPACTO_RESULTADOS_APRENDIZAJE:'',IMPACTO_METODOLOGIAS:'',IMPACTO_EVALUACION:''}
    }
  });
  const emptyAnnexes=()=>({
    version:1,
    evidence:{coordinators:[],instrument:[],teachers:[],virtual:[],surveyResults:[],formStructure:[],convocatoria:[]},
    surveyQuestions:[],surveyResults:[],masterDatabase:[],masterSheetName:'Base_Maestra',privacyMode:'internal',
    convocatoria:{date:'',medium:'',recipients:''}
  });
  const emptyPeriodData=()=>({
    careers:[],dncStatus:'draft',sources:emptySources(),candidates:[],results:emptyResults(),annexes:emptyAnnexes()
  });

  function readStoredRegistry(){
    const keys=[PERIOD_STORAGE_KEY,...PREVIOUS_PERIOD_STORAGE_KEYS];
    for(const key of keys){
      try{
        const raw=JSON.parse(localStorage.getItem(key));
        if(raw&&Array.isArray(raw.periods))return raw;
      }catch{}
    }
    return null;
  }

  function loadRegistry(){
    const raw=readStoredRegistry()||{};
    return {
      version:2,
      activeId:raw.activeId||null,
      globalAssets:{resultsImage:raw.globalAssets?.resultsImage??state.results?.image??null},
      periods:(Array.isArray(raw.periods)?raw.periods:[]).map(p=>({...p,archived:false}))
    };
  }
  let registry=loadRegistry();

  function ymParts(value){
    const m=String(value||'').match(/^(\d{4})-(\d{2})$/);
    return m?{year:Number(m[1]),month:Number(m[2])}:null;
  }
  function makeYm(year,month){return `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}`;}
  function labelFor(entry){return `${MONTHS[entry.startMonth-1]} ${entry.startYear} – ${MONTHS[entry.endMonth-1]} ${entry.endYear}`;}
  function descriptor(entry){return {id:entry.id,start:makeYm(entry.startYear,entry.startMonth),end:makeYm(entry.endYear,entry.endMonth),label:labelFor(entry)};}
  function sortPeriods(a,b){return (b.startYear-a.startYear)||(b.startMonth-a.startMonth)||(b.endYear-a.endYear)||(b.endMonth-a.endMonth);}
  function activeEntry(){return registry.periods.find(p=>p.id===registry.activeId)||null;}
  function isValidRange(sm,sy,em,ey){return sy*12+(sm-1)<=ey*12+(em-1);}

  function periodHasData(data){
    if(!data)return false;
    const result=data.results||{};
    const annex=data.annexes||{};
    return !!(
      (data.careers||[]).length||
      (data.candidates||[]).length||
      Object.values(data.sources||{}).some(v=>Array.isArray(v)&&v.length)||
      (result.careerNeeds||[]).length||
      (result.careerLinks||[]).length||
      (result.specificClassifications||[]).length||
      (result.institutional?.needMeta||[]).length||
      (result.institutional?.alternatives||[]).length||
      (result.institutional?.indicators||[]).length||
      String(result.institutional?.selection?.CAPACITACION_GENERICA||'').trim()||
      (annex.surveyQuestions||[]).length||
      (annex.surveyResults||[]).length||
      (annex.masterDatabase||[]).length||
      Object.values(annex.evidence||{}).some(v=>Array.isArray(v)&&v.length)||
      data.plan||data.report||data.execution
    );
  }

  function capturePeriodData(){
    registry.globalAssets.resultsImage=state.results?.image??registry.globalAssets.resultsImage??null;
    const results=clone(state.results||emptyResults());delete results.image;
    return {
      careers:clone(state.careers||[]),
      dncStatus:state.dncStatus||'draft',
      sources:clone(state.sources||emptySources()),
      candidates:clone(state.candidates||[]),
      results,
      annexes:clone(state.annexes||emptyAnnexes()),
      plan:state.plan?clone(state.plan):undefined,
      report:state.report?clone(state.report):undefined,
      execution:state.execution?clone(state.execution):undefined
    };
  }

  function normalizeResults(data){
    const d=emptyResults(),r={...d,...(data||{})};
    r.careerNeeds=Array.isArray(r.careerNeeds)?r.careerNeeds:[];
    r.careerLinks=Array.isArray(r.careerLinks)?r.careerLinks:[];
    r.specificClassifications=Array.isArray(r.specificClassifications)?r.specificClassifications:[];
    r.institutional={...d.institutional,...(r.institutional||{})};
    r.institutional.needMeta=Array.isArray(r.institutional.needMeta)?r.institutional.needMeta:[];
    r.institutional.alternatives=Array.isArray(r.institutional.alternatives)?r.institutional.alternatives:[];
    r.institutional.indicators=Array.isArray(r.institutional.indicators)?r.institutional.indicators:[];
    r.institutional.criteria=Array.isArray(r.institutional.criteria)&&r.institutional.criteria.length?r.institutional.criteria:d.institutional.criteria;
    r.institutional.selection={...d.institutional.selection,...(r.institutional.selection||{})};
    r.image=registry.globalAssets.resultsImage??null;
    return r;
  }

  function normalizeAnnexes(data){
    const d=emptyAnnexes(),a={...d,...(data||{})};
    a.evidence={...d.evidence,...(a.evidence||{})};
    Object.keys(d.evidence).forEach(k=>{if(!Array.isArray(a.evidence[k]))a.evidence[k]=[];});
    a.surveyQuestions=Array.isArray(a.surveyQuestions)?a.surveyQuestions:[];
    a.surveyResults=Array.isArray(a.surveyResults)?a.surveyResults:[];
    a.masterDatabase=Array.isArray(a.masterDatabase)?a.masterDatabase:[];
    a.convocatoria={...d.convocatoria,...(a.convocatoria||{})};
    return a;
  }

  function applyPeriod(entry){
    const data=entry?.data||emptyPeriodData();
    state.period=entry?descriptor(entry):null;
    state.careers=clone(data.careers||[]);
    state.dncStatus=data.dncStatus||'draft';
    state.sources={...emptySources(),...clone(data.sources||{})};
    state.candidates=clone(data.candidates||[]);
    state.results=normalizeResults(data.results);
    state.annexes=normalizeAnnexes(data.annexes);
    ['plan','report','execution'].forEach(k=>{
      if(data[k]!==undefined)state[k]=clone(data[k]);
      else if(k in state)delete state[k];
    });
  }

  function syncActive(){
    const e=activeEntry();
    if(e)e.data=capturePeriodData();
  }
  function saveRegistry(){localStorage.setItem(PERIOD_STORAGE_KEY,JSON.stringify(registry));}
  function persistRaw(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));saveRegistry();}

  function migrate(){
    if(!registry.periods.length&&state.period){
      const s=ymParts(state.period.start||state.period.startMonth),e=ymParts(state.period.end||state.period.endMonth);
      if(s&&e){
        const id=`PER-${makeYm(s.year,s.month)}-${makeYm(e.year,e.month)}`;
        registry.periods.push({
          id,startMonth:s.month,startYear:s.year,endMonth:e.month,endYear:e.year,
          createdAt:new Date().toISOString(),data:capturePeriodData()
        });
        registry.activeId=id;
      }
    }
    registry.periods=registry.periods.map(p=>{const q={...p};delete q.archived;delete q.archivedAt;return q;});
    if(registry.periods.length&&!activeEntry())registry.activeId=registry.periods.sort(sortPeriods)[0].id;
    const e=activeEntry();
    if(e)applyPeriod(e);else state.period=null;
    persistRaw();
  }

  const originalSaveState=saveState;
  saveState=function(){
    syncActive();
    saveRegistry();
    return originalSaveState();
  };

  function switchPeriod(id){
    if(!id||id===registry.activeId)return;
    syncActive();
    const next=registry.periods.find(p=>p.id===id);
    if(!next)return;
    registry.activeId=id;
    applyPeriod(next);
    persistRaw();
    try{renderAll();}catch(e){console.error(e);}
    renderPeriodUi();
    toast(`Período activo: ${labelFor(next)}`);
    window.dispatchEvent(new CustomEvent('doccapa:period-changed',{detail:{period:descriptor(next)}}));
  }

  function monthOptions(selected){
    return MONTHS.map((m,i)=>`<option value="${i+1}" ${selected===i+1?'selected':''}>${m[0].toUpperCase()+m.slice(1)}</option>`).join('');
  }

  function yearControl(id,value,label){
    return `<label class="global-period-field"><span>${label}</span><div class="year-stepper"><button type="button" class="year-step" data-year-target="${id}" data-delta="-1">−</button><input id="${id}" type="number" min="${YEAR_MIN}" max="${YEAR_MAX}" step="1" value="${value}"><button type="button" class="year-step" data-year-target="${id}" data-delta="1">+</button></div></label>`;
  }

  function injectStyles(){
    if(document.getElementById('globalPeriodStyles'))return;
    const s=document.createElement('style');
    s.id='globalPeriodStyles';
    s.textContent=`
      #activePeriodChip{display:none!important}
      .global-period-top{display:flex;align-items:center;gap:8px}
      .global-period-top label{font-size:10px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
      .global-period-top select{border:1px solid var(--line);border-radius:9px;background:#fff;padding:9px 34px 9px 10px;font-weight:700;color:var(--navy);max-width:350px}
      .period-manager{margin-bottom:20px}
      .period-manager-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}
      .period-manager-head h3{margin:0 0 6px}
      .period-manager-actions{display:flex;gap:8px;flex-wrap:wrap}
      .period-global-form{display:grid;grid-template-columns:1.2fr 1fr 1.2fr 1fr;gap:12px;margin-top:18px}
      .global-period-field>span{display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px}
      .global-period-field select,.global-period-field input{width:100%;border:1px solid var(--line);border-radius:9px;background:#fff;padding:10px}
      .year-stepper{display:grid;grid-template-columns:36px 1fr 36px;gap:6px}
      .year-step{border:1px solid var(--line);background:#f5f8fc;border-radius:8px;font-weight:900;font-size:18px;cursor:pointer}
      .period-created-list{display:grid;gap:8px;margin-top:16px}
      .period-created-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 13px;border:1px solid var(--line);border-radius:9px;background:#fafbfd}
      .period-created-row.active{border-color:#9bb8dd;background:#f3f7fc}
      .period-created-row strong,.period-created-row small{display:block}
      .period-created-row small{color:var(--muted);margin-top:2px}
      .period-active-badge{font-size:10px;font-weight:800;padding:4px 7px;border-radius:999px;background:#e9f8f0;color:var(--ok)}
      .legacy-period-editor{display:none!important}
      .period-lock-note{margin-top:12px}
      @media(max-width:900px){.period-global-form{grid-template-columns:1fr 1fr}.global-period-top{width:100%}.global-period-top select{max-width:none;flex:1}}
      @media(max-width:560px){.period-global-form{grid-template-columns:1fr}.period-manager-head{flex-direction:column}.global-period-top{align-items:stretch;flex-direction:column}}
    `;
    document.head.appendChild(s);
  }

  function topbarControl(){
    const top=document.querySelector('.topbar-actions');
    if(!top||document.getElementById('globalPeriodTop'))return;
    const wrap=document.createElement('div');
    wrap.id='globalPeriodTop';
    wrap.className='global-period-top';
    wrap.innerHTML='<label for="globalPeriodSelect">Período global</label><select id="globalPeriodSelect" aria-label="Período global activo"></select>';
    const chip=document.getElementById('activePeriodChip');
    top.insertBefore(wrap,chip||top.firstChild);
    wrap.querySelector('select').addEventListener('change',e=>switchPeriod(e.target.value));
  }

  function managerUi(){
    const view=document.getElementById('view-periodos');
    if(!view||document.getElementById('globalPeriodManager'))return;
    const legacy=document.getElementById('periodStart')?.closest('article');
    if(legacy)legacy.classList.add('legacy-period-editor');
    const heading=view.querySelector('.section-heading');
    const card=document.createElement('article');
    card.id='globalPeriodManager';
    card.className='card period-manager';
    card.innerHTML=`
      <div class="period-manager-head">
        <div>
          <p class="eyebrow">Configuración global</p>
          <h3>Administrar períodos</h3>
          <p>El selector del período activo está siempre en la barra superior. Aquí solo creas períodos y, si todavía no tienen datos, puedes corregir sus fechas.</p>
        </div>
        <div class="period-manager-actions">
          <button class="btn btn-light" id="newGlobalPeriodBtn">Nuevo período</button>
          <button class="btn btn-light" id="editGlobalPeriodBtn">Editar activo</button>
        </div>
      </div>
      <div id="periodEditorBox">
        <div class="period-global-form">
          <label class="global-period-field"><span>Mes inicio</span><select id="periodStartMonth"></select></label>
          ${yearControl('periodStartYear',new Date().getFullYear(),'Año inicio')}
          <label class="global-period-field"><span>Mes fin</span><select id="periodEndMonth"></select></label>
          ${yearControl('periodEndYear',new Date().getFullYear(),'Año fin')}
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" id="saveGlobalPeriodBtn">Crear período</button>
          <button class="btn btn-light" id="cancelGlobalPeriodEditBtn">Cancelar</button>
        </div>
        <div class="info-box" id="globalPeriodSummary">Define el inicio y fin del nuevo período.</div>
        <div class="info-box period-lock-note"><strong>Regla de integridad:</strong> cuando un período ya tiene carreras, plantillas, resultados, anexos u otros datos, sus fechas quedan bloqueadas. Para corregirlas deberá crearse un período nuevo.</div>
      </div>
      <div class="period-created-list" id="createdPeriodsList"></div>`;
    heading?.insertAdjacentElement('afterend',card);

    document.getElementById('newGlobalPeriodBtn').addEventListener('click',()=>beginCreate());
    document.getElementById('editGlobalPeriodBtn').addEventListener('click',()=>beginEdit());
    document.getElementById('saveGlobalPeriodBtn').addEventListener('click',savePeriodFromManager);
    document.getElementById('cancelGlobalPeriodEditBtn').addEventListener('click',()=>fillEditor(activeEntry(),false));
    card.querySelectorAll('.year-step').forEach(btn=>btn.addEventListener('click',()=>{
      const input=document.getElementById(btn.dataset.yearTarget);
      const next=Math.max(YEAR_MIN,Math.min(YEAR_MAX,Number(input.value||new Date().getFullYear())+Number(btn.dataset.delta)));
      input.value=next;
    }));

    const careerCard=document.getElementById('downloadCareersTemplateBtn')?.closest('article');
    if(careerCard){
      const h=careerCard.querySelector('h3');
      if(h)h.textContent='Carreras del período activo';
    }
  }

  function fillEditor(entry,editing){
    editMode=editing?'edit':'create';
    const now=new Date();
    const sm=entry?.startMonth||now.getMonth()+1,sy=entry?.startYear||now.getFullYear();
    const em=entry?.endMonth||now.getMonth()+1,ey=entry?.endYear||now.getFullYear();
    const smEl=document.getElementById('periodStartMonth'),emEl=document.getElementById('periodEndMonth');
    if(smEl)smEl.innerHTML=monthOptions(sm);
    if(emEl)emEl.innerHTML=monthOptions(em);
    const syEl=document.getElementById('periodStartYear'),eyEl=document.getElementById('periodEndYear');
    if(syEl)syEl.value=sy;
    if(eyEl)eyEl.value=ey;
    const btn=document.getElementById('saveGlobalPeriodBtn');
    if(btn)btn.textContent=editing?'Guardar cambios':'Crear período';
    const summary=document.getElementById('globalPeriodSummary');
    if(summary)summary.textContent=editing&&entry?`Editando: ${labelFor(entry)}`:'Define el inicio y fin del nuevo período.';
  }

  function beginCreate(){
    fillEditor(null,false);
    document.getElementById('periodStartMonth')?.focus();
  }

  function beginEdit(){
    const e=activeEntry();
    if(!e)return toast('No existe un período activo para editar.');
    syncActive();
    if(periodHasData(e.data)){
      toast('Las fechas están bloqueadas porque este período ya contiene información.');
      const summary=document.getElementById('globalPeriodSummary');
      if(summary)summary.innerHTML='<strong>Período bloqueado.</strong> Ya contiene información. Para cambiar las fechas crea un período nuevo.';
      return;
    }
    fillEditor(e,true);
  }

  function valuesFromEditor(){
    return {
      sm:Number(document.getElementById('periodStartMonth')?.value),
      sy:Number(document.getElementById('periodStartYear')?.value),
      em:Number(document.getElementById('periodEndMonth')?.value),
      ey:Number(document.getElementById('periodEndYear')?.value)
    };
  }

  function savePeriodFromManager(){
    const {sm,sy,em,ey}=valuesFromEditor();
    if(!sm||!em||sy<YEAR_MIN||sy>YEAR_MAX||ey<YEAR_MIN||ey>YEAR_MAX)return toast('Revisa los meses y años del período.');
    if(!isValidRange(sm,sy,em,ey))return toast('El fin del período no puede ser anterior al inicio.');

    const duplicate=registry.periods.find(p=>p.startMonth===sm&&p.startYear===sy&&p.endMonth===em&&p.endYear===ey&&p.id!==registry.activeId);
    if(duplicate)return toast('Ese período ya existe. Selecciónalo en la barra superior.');

    syncActive();

    if(editMode==='edit'){
      const e=activeEntry();
      if(!e)return;
      if(periodHasData(e.data)){
        toast('No se pueden editar las fechas: el período ya contiene información.');
        return;
      }
      const oldId=e.id;
      const newId=`PER-${makeYm(sy,sm)}-${makeYm(ey,em)}`;
      if(registry.periods.some(p=>p.id===newId&&p.id!==oldId))return toast('Ese período ya existe.');
      e.id=newId;
      e.startMonth=sm;e.startYear=sy;e.endMonth=em;e.endYear=ey;e.updatedAt=new Date().toISOString();
      registry.activeId=newId;
      state.period=descriptor(e);
      e.data=capturePeriodData();
      persistRaw();
      renderAll();renderPeriodUi();fillEditor(e,false);
      toast('Período actualizado.');
      window.dispatchEvent(new CustomEvent('doccapa:period-updated',{detail:{period:descriptor(e),oldId}}));
    }else{
      const start=makeYm(sy,sm),end=makeYm(ey,em),id=`PER-${start}-${end}`;
      if(registry.periods.some(p=>p.id===id))return toast('Ese período ya existe.');
      const entry={id,startMonth:sm,startYear:sy,endMonth:em,endYear:ey,createdAt:new Date().toISOString(),data:emptyPeriodData()};
      registry.periods.push(entry);
      registry.activeId=id;
      applyPeriod(entry);
      persistRaw();
      renderAll();fillEditor(entry,false);renderPeriodUi();
      toast(`Período creado: ${labelFor(entry)}`);
      window.dispatchEvent(new CustomEvent('doccapa:period-created',{detail:{period:descriptor(entry)}}));
    }
  }

  function selectorOptions(){
    const current=registry.activeId;
    const periods=[...registry.periods].sort(sortPeriods);
    if(!periods.length)return '<option value="">Sin períodos creados</option>';
    return periods.map(p=>`<option value="${p.id}" ${p.id===current?'selected':''}>${labelFor(p)}</option>`).join('');
  }

  function renderPeriodUi(){
    topbarControl();managerUi();
    const top=document.getElementById('globalPeriodSelect');
    if(top)top.innerHTML=selectorOptions();

    const list=document.getElementById('createdPeriodsList');
    if(list){
      const rows=[...registry.periods].sort(sortPeriods);
      list.innerHTML=rows.length
        ?rows.map(p=>`<div class="period-created-row ${p.id===registry.activeId?'active':''}"><div><strong>${labelFor(p)}</strong><small>${periodHasData(p.data)?'Con información · fechas bloqueadas':'Sin cargas · fechas editables'}</small></div>${p.id===registry.activeId?'<span class="period-active-badge">ACTIVO</span>':''}</div>`).join('')
        :'<div class="info-box">Todavía no existen períodos creados.</div>';
    }

    const e=activeEntry();
    const summary=document.getElementById('globalPeriodSummary');
    if(summary&&editMode!=='edit')summary.textContent=e?`Período global activo: ${labelFor(e)}`:'No existe un período activo.';
    const legacySummary=document.getElementById('periodSummary');
    if(legacySummary)legacySummary.textContent=e?`Período activo: ${labelFor(e)}`:'No existe un período activo.';
    const edit=document.getElementById('editGlobalPeriodBtn');
    if(edit){
      const locked=e?periodHasData(e.data):false;
      edit.disabled=!e||locked;
      edit.title=locked?'Este período ya contiene información y sus fechas están bloqueadas.':'Editar fechas del período activo';
    }
  }

  window.DOC_CAPA_PERIODS={
    getRegistry:()=>clone(registry),
    setRegistryFromRemote(remote){
      if(!remote||!Array.isArray(remote.periods))return false;
      registry={version:2,activeId:remote.activeId||remote.active_id||null,globalAssets:{resultsImage:remote.globalAssets?.resultsImage??remote.global_assets?.resultsImage??registry.globalAssets.resultsImage??null},periods:clone(remote.periods)};
      if(registry.periods.length&&!registry.periods.some(p=>p.id===registry.activeId))registry.activeId=[...registry.periods].sort(sortPeriods)[0].id;
      applyPeriod(activeEntry());
      persistRaw();renderAll();renderPeriodUi();
      return true;
    },
    capturePeriodData,
    periodHasData,
    persist:()=>{syncActive();persistRaw();},
    switchPeriod
  };

  migrate();
  injectStyles();
  topbarControl();
  managerUi();
  fillEditor(activeEntry(),false);

  const originalRenderAll=renderAll;
  renderAll=function(){
    const out=originalRenderAll();
    renderPeriodUi();
    return out;
  };

  renderAll();
})();