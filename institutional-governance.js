(function(){
  'use strict';
  const core=window.DOC_CAPA_CORE,dnc=window.DOC_CAPA_DNC;
  if(!core||!dnc){console.error('DOC-CAPA governance: Core o cálculos DNC no disponibles.');return;}

  const DOCUMENT_ID='capacitacion-deteccion';
  const CONTEXT_KEY='doc-capa-period-context-v1';
  const MIGRATION_KEY='doc-capa-hardening-migration-v1';
  const arr=v=>Array.isArray(v)?v:[];
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  const norm=v=>typeof normalized==='function'?normalized(v):String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  const readJson=(key,fallback={})=>{try{const x=JSON.parse(localStorage.getItem(key));return x&&typeof x==='object'?x:fallback;}catch{return fallback;}};
  const writeJson=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const periodId=()=>state?.period?.id||state?.period?.label||null;
  const registry=()=>{try{return window.DOC_CAPA_PERIODS?.getRegistry?.()||null;}catch{return null;}};

  function applyVerifiedLegalBasis(){
    if(typeof LEGAL==='undefined'||!LEGAL)return;
    LEGAL.intro=[
      'La detección de necesidades de capacitación docente del Instituto Superior Tecnológico Quito Metropolitano (ITSQMET) se sustenta en la Constitución de la República del Ecuador, la Ley Orgánica de Educación Superior (LOES), el Modelo de Evaluación Externa 2024 con fines de acreditación para los Institutos Superiores Técnicos y Tecnológicos emitido por el CACES y los instrumentos internos de planificación y gestión académica vigentes.',
      'Las referencias que se presentan a continuación se formulan de manera controlada y deben conservar correspondencia con la versión oficial vigente de cada norma o instrumento institucional. El documento utiliza estas disposiciones como fundamento del proceso diagnóstico y no como sustitución de la normativa original.'
    ];
    LEGAL.blocks=[
      {title:'Constitución de la República del Ecuador',items:[
        'El artículo 26 reconoce a la educación como un derecho de las personas a lo largo de su vida y como un deber ineludible del Estado.',
        'El artículo 27 establece que la educación se centrará en el ser humano y garantizará su desarrollo integral, en el marco del respeto a los derechos humanos y de una educación de calidad.',
        'El artículo 350 determina que el Sistema de Educación Superior tiene entre sus finalidades la formación académica y profesional con visión científica y humanista, la investigación y la innovación, bajo principios de calidad y pertinencia.'
      ]},
      {title:'Ley Orgánica de Educación Superior (LOES)',items:[
        'El artículo 12 establece los principios del Sistema de Educación Superior, entre ellos calidad, pertinencia, integralidad, igualdad de oportunidades, responsabilidad y participación.',
        'El artículo 13 dispone, entre las funciones del Sistema de Educación Superior, garantizar el derecho a la educación superior mediante la docencia, investigación y vinculación con la sociedad; asegurar niveles crecientes de calidad, excelencia académica y pertinencia; fortalecer la docencia; e incrementar y diversificar las oportunidades de actualización y perfeccionamiento profesional para los actores del sistema.',
        'El artículo 156 regula la capacitación y perfeccionamiento permanente del personal académico y dispone la previsión de recursos para planes de especialización o capacitación en los términos establecidos por la LOES y la normativa aplicable.'
      ]},
      {title:'Modelo de Evaluación Externa 2024 con fines de acreditación para los Institutos Superiores Técnicos y Tecnológicos – CACES',items:[
        'El indicador 3.2.4, Formación académica en curso y capacitación, establece que los procesos de formación y capacitación de los profesores deben planificarse para crear las capacidades requeridas para el cumplimiento de sus tareas y deben ser objeto de seguimiento, control y evaluación.',
        'Los elementos fundamentales del indicador requieren normativa interna vigente sobre formación y capacitación, planificación articulada con el PEDI, respuesta a necesidades concretas de capacidades y evidencia del seguimiento, control y evaluación del plan.',
        'La lógica del modelo exige identificar las capacidades requeridas, diagnosticar las capacidades actuales y determinar las brechas o necesidades de aprendizaje antes de definir las acciones posteriores de formación o capacitación.'
      ]},
      {title:'Reglamento de Carrera y Escalafón del Personal Académico del Sistema de Educación Superior',items:[
        'La gestión de la carrera académica, la evaluación y el desarrollo del personal académico se sujetan al Reglamento de Carrera y Escalafón vigente y a las disposiciones aplicables al tipo de institución. La aplicación institucional de este instrumento debe verificarse siempre contra su versión oficial vigente.'
      ]},
      {title:'Plan Estratégico de Desarrollo Institucional (PEDI) del ITSQMET',items:[
        'El PEDI vigente constituye el instrumento de planificación estratégica con el cual deben articularse los procesos de fortalecimiento de capacidades del personal académico y las decisiones institucionales de mejora continua.'
      ]},
      {title:'Plan Operativo Anual (POA) del ITSQMET',items:[
        'El POA vigente operacionaliza la planificación institucional y utiliza los diagnósticos y necesidades validadas como insumos para la programación posterior de acciones, metas y recursos, sin que el presente DNC anticipe su ejecución.'
      ]},
      {title:'Manual de Procesos Académicos del ITSQMET',items:[
        'El Manual de Procesos Académicos vigente establece el marco interno para la gestión, seguimiento y mejora de los procesos académicos. Las actividades de detección, planificación, ejecución y evaluación de la capacitación deben conservar trazabilidad con los procedimientos y responsabilidades institucionales aprobados.'
      ]}
    ];
    LEGAL.closing='Con base en este marco, el presente informe se configura como un documento técnico-diagnóstico orientado a identificar, analizar y priorizar necesidades de capacitación docente. Sus resultados constituyen un insumo para la planificación institucional posterior y no generan por sí mismos compromisos de ejecución, cronograma, presupuesto o contratación.';
  }

  function completeCoverageInfo(){
    const careers=typeof activeCareers==='function'?activeCareers():arr(state.careers).filter(c=>c?.active!==false),keys=Object.keys(SOURCE_DEFS||{}),total=careers.length;
    if(!total)return{total:0,covered:0,pct:null,status:'pending',phrase:'las carreras incluidas en el proceso de detección de necesidades de capacitación'};
    const covered=careers.filter(c=>keys.length&&keys.every(k=>arr(state.sources?.[k]).some(r=>norm(r.CARRERA)===norm(c.name)))).length,pct=Math.round(covered/total*100);
    if(covered===total)return{total,covered,pct,status:'complete',phrase:'las carreras incluidas en el proceso, con cobertura metodológica completa de las cinco fuentes definidas'};
    if(covered>0)return{total,covered,pct,status:'partial',phrase:'las carreras con cobertura metodológica completa dentro del período'};
    return{total,covered:0,pct:0,status:'pending',phrase:'las carreras incluidas en el proceso de detección de necesidades de capacitación'};
  }
  if(typeof coverageInfo==='function')coverageInfo=completeCoverageInfo;

  function contextFromState(){return{institutionalConfig:clone(state.institutionalConfig||{}),logo:state.logo||null,methodologyImages:clone(state.methodologyImages||{}),documentMeta:clone(state.documentMeta||{})};}
  function contexts(){return readJson(CONTEXT_KEY,{});}
  function saveContext(id=periodId()){if(!id)return;const all=contexts();all[id]=contextFromState();writeJson(CONTEXT_KEY,all);}
  function applyContext(id){if(!id)return false;const all=contexts(),ctx=all[id];if(!ctx)return false;state.institutionalConfig={...(state.institutionalConfig||{}),...(clone(ctx.institutionalConfig)||{})};state.logo=ctx.logo||null;state.methodologyImages={diagnostic:null,sources:null,...(clone(ctx.methodologyImages)||{})};state.documentMeta=clone(ctx.documentMeta||{});try{saveState();}catch(e){console.error(e);}return true;}
  function migrateContexts(){const all=contexts(),base=contextFromState();arr(registry()?.periods).forEach(p=>{if(!all[p.id])all[p.id]=clone(base);});if(periodId()&&!all[periodId()])all[periodId()]=clone(base);writeJson(CONTEXT_KEY,all);}

  function invalidateLegacyCacesAutoApproval(){
    state.institutionalConfig=state.institutionalConfig||{};
    const invalidate=cfg=>{if(!cfg)return false;const valid=!!cfg.cacesValidatedAt&&norm(cfg.cacesValidatedModel)===norm(cfg.cacesModel)&&String(cfg.cacesValidatedYear||'')===String(cfg.cacesYear||'');if(cfg.cacesValidated===true&&!valid){cfg.cacesValidated=false;delete cfg.cacesValidatedAt;delete cfg.cacesValidatedModel;delete cfg.cacesValidatedYear;return true;}return false;};
    let changed=invalidate(state.institutionalConfig);const all=contexts();Object.values(all).forEach(ctx=>{ctx.institutionalConfig=ctx.institutionalConfig||{};if(invalidate(ctx.institutionalConfig))changed=true;});if(changed)writeJson(CONTEXT_KEY,all);if(!localStorage.getItem(MIGRATION_KEY))localStorage.setItem(MIGRATION_KEY,new Date().toISOString());if(changed){try{saveState();}catch(e){console.error(e);}}
  }

  function saveInstitutionalConfigStrict(){
    if(typeof ensureEditable==='function'&&!ensureEditable())return;
    const cfg=state.institutionalConfig||{},oldModel=String(cfg.cacesModel||''),oldYear=String(cfg.cacesYear||''),newModel=document.getElementById('configCacesModel')?.value.trim()||'',newYear=document.getElementById('configCacesYear')?.value.trim()||'';
    state.institutionalConfig={...cfg,pedi:document.getElementById('configPedi')?.value.trim()||'',poa:document.getElementById('configPoa')?.value.trim()||'',manual:document.getElementById('configManual')?.value.trim()||'',cacesModel:newModel,cacesYear:newYear,surveyTool:document.getElementById('configSurveyTool')?.value.trim()||'Microsoft Forms'};
    if(norm(oldModel)!==norm(newModel)||oldYear!==newYear){state.institutionalConfig.cacesValidated=false;delete state.institutionalConfig.cacesValidatedAt;delete state.institutionalConfig.cacesValidatedModel;delete state.institutionalConfig.cacesValidatedYear;}
    saveState();saveContext();core.clearDirty?.('institutional-config');toast?.('Configuración institucional guardada para el período activo.');
  }
  function validateCacesStrict(){if(typeof ensureEditable==='function'&&!ensureEditable())return;const cfg=state.institutionalConfig||{};if(!String(cfg.cacesModel||'').trim())return toast?.('Configura primero el Modelo CACES vigente.');if(!String(cfg.cacesYear||'').trim())return toast?.('Configura el año o versión del Modelo CACES.');const now=new Date().toISOString();cfg.cacesValidated=true;cfg.cacesValidatedAt=now;cfg.cacesValidatedModel=cfg.cacesModel;cfg.cacesValidatedYear=cfg.cacesYear;saveState();saveContext();toast?.('Modelo CACES validado y registrado para este período.');}
  if(typeof saveInstitutionalConfig==='function')saveInstitutionalConfig=saveInstitutionalConfigStrict;
  if(typeof validateCaces==='function')validateCaces=validateCacesStrict;

  function ensureAnnexVirtualNaUi(){
    state.annexes=state.annexes||{};if(typeof state.annexes.virtualMeetingsNotApplicable!=='boolean')state.annexes.virtualMeetingsNotApplicable=false;
    const cards=document.querySelectorAll('#view-dnc-anexos .annex-card'),card=cards[3];if(!card||card.querySelector('#virtualMeetingsNa'))return;
    const wrap=document.createElement('label');wrap.className='annex-na-control';wrap.innerHTML='<input id="virtualMeetingsNa" type="checkbox"> <span><strong>No aplicó en este período</strong><small>Úsalo únicamente cuando no se realizaron reuniones académicas virtuales.</small></span>';card.appendChild(wrap);
    const check=wrap.querySelector('input');check.checked=!!state.annexes.virtualMeetingsNotApplicable;check.disabled=arr(state.annexes.evidence?.virtual).length>0||state.dncStatus==='approved';check.addEventListener('change',()=>{if(typeof ensureEditable==='function'&&!ensureEditable()){check.checked=!check.checked;return;}state.annexes.virtualMeetingsNotApplicable=check.checked;saveState();toast?.(check.checked?'Anexo 4 registrado como No aplica.':'Anexo 4 vuelve a requerir evidencia.');});
  }
  function patchAnnexPreview(){ensureAnnexVirtualNaUi();if(!state.annexes?.virtualMeetingsNotApplicable||arr(state.annexes?.evidence?.virtual).length)return;const p=document.getElementById('annexesPreview');if(p)p.innerHTML=p.innerHTML.replace('No se afirma la realización de reuniones virtuales hasta que exista evidencia cargada.','No aplicó: durante el período no se realizaron reuniones académicas virtuales; esta condición fue confirmada en la aplicación.');}

  if(typeof validateDncForFinal==='function'){const base=validateDncForFinal;validateDncForFinal=function(){let issues=base();if(state.annexes?.virtualMeetingsNotApplicable&&!arr(state.annexes?.evidence?.virtual).length)issues=issues.filter(x=>!String(x).startsWith('Anexo 4:'));return[...new Set(issues)];};}
  if(typeof buildPrintDocument==='function'){const base=buildPrintDocument;buildPrintDocument=function(){let html=base();if(state.annexes?.virtualMeetingsNotApplicable&&!arr(state.annexes?.evidence?.virtual).length)html=html.replace('No se afirma la realización de reuniones virtuales hasta que exista evidencia cargada.','No aplicó: durante el período no se realizaron reuniones académicas virtuales; esta condición fue confirmada en la aplicación.');return html;};}
  if(typeof writeParagraph==='function'){const base=writeParagraph;writeParagraph=function(doc,text,y){if(state.annexes?.virtualMeetingsNotApplicable&&!arr(state.annexes?.evidence?.virtual).length&&String(text)==='No se afirma la realización de reuniones virtuales hasta que exista evidencia cargada.')text='No aplicó: durante el período no se realizaron reuniones académicas virtuales; esta condición fue confirmada en la aplicación.';return base(doc,text,y);};}

  function bindStrictConfigActions(){const save=document.getElementById('saveInstitutionalConfigBtn');if(save&&!save.dataset.strictConfigBound){save.dataset.strictConfigBound='1';save.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();saveInstitutionalConfigStrict();},true);}const validate=document.getElementById('validateCacesBtn');if(validate&&!validate.dataset.strictCacesBound){validate.dataset.strictCacesBound='1';validate.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();validateCacesStrict();},true);}}
  function bindPeriodContext(){if(document.documentElement.dataset.periodContextBound==='1')return;document.documentElement.dataset.periodContextBound='1';document.addEventListener('change',e=>{if(e.target?.id==='globalPeriodSelect')saveContext();},true);window.addEventListener('doccapa:period-changed',e=>{const id=e.detail?.period?.id||periodId();if(!applyContext(id)){saveContext(id);try{renderAll();}catch(err){console.error(err);}}refreshMetadata();});window.addEventListener('doccapa:period-created',()=>{saveContext();refreshMetadata();});window.addEventListener('doccapa:period-updated',()=>saveContext());}

  function refreshMetadata(){ensureAnnexVirtualNaUi();bindStrictConfigActions();const footer=document.querySelector('.sidebar-footer small');if(footer)footer.textContent=`Core ${core.VERSION} · DNC ${core.getDocument?.(DOCUMENT_ID)?.templateVersion||''}`;if(!document.querySelector('link[rel="icon"]')){const link=document.createElement('link');link.rel='icon';link.href='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0f2747"/><text x="32" y="40" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" font-weight="700" fill="white">DC</text></svg>');document.head.appendChild(link);}document.querySelectorAll('dialog').forEach(d=>{d.setAttribute('aria-modal','true');if(!d.getAttribute('role'))d.setAttribute('role','dialog');});}
  function injectStyles(){if(document.getElementById('governanceStyles'))return;const st=document.createElement('style');st.id='governanceStyles';st.textContent='.annex-na-control{display:flex;gap:9px;align-items:flex-start;margin-top:12px;padding:10px;border:1px solid var(--line);border-radius:9px;background:#f8fafc}.annex-na-control small{display:block;color:var(--muted);margin-top:2px}';document.head.appendChild(st);}

  if(typeof renderAll==='function'){const base=renderAll;renderAll=function(){const out=base();patchAnnexPreview();refreshMetadata();return out;};}
  window.DOC_CAPA_GOVERNANCE={CONTEXT_KEY,periodId,contexts,saveContext,applyContext,contextFromState};

  applyVerifiedLegalBasis();migrateContexts();invalidateLegacyCacesAutoApproval();injectStyles();bindPeriodContext();refreshMetadata();saveContext();try{renderAll();}catch(e){console.error(e);}
})();
