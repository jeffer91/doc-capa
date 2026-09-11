(function(){
  'use strict';

  const dnc=window.DOC_CAPA_DNC;
  if(!dnc){console.error('DOC-CAPA Resumen: cálculos DNC no disponibles.');return;}

  const EXEC_RULE_PENDING='pending';
  const EXEC_RULE_BY_CAREERS='count_by_careers';
  const esc=v=>escapeHtml(v);
  const norm=v=>normalized(v);
  const num=v=>{const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null;};
  const pct=v=>{const n=num(v);return n==null?'—':`${Math.round(n*100)/100}%`;};
  const unique=values=>[...new Set(values.map(v=>String(v??'').trim()).filter(Boolean))];
  function naturalList(values){const a=unique(values);if(!a.length)return'';if(a.length===1)return a[0];if(a.length===2)return`${a[0]} y ${a[1]}`;return`${a.slice(0,-1).join(', ')} y ${a[a.length-1]}`;}

  function ensureExecutiveState(){
    state.results=state.results||{};
    state.results.specificClassifications=Array.isArray(state.results.specificClassifications)?state.results.specificClassifications:[];
    state.institutionalConfig=state.institutionalConfig||{};
    if(!state.institutionalConfig.executiveSpecificTypeRule)state.institutionalConfig.executiveSpecificTypeRule=EXEC_RULE_PENDING;
  }
  ensureExecutiveState();

  function usedSourceLabels(){const counts=dnc.sourceCounts();return Object.keys(counts).filter(k=>counts[k]>0).map(k=>SOURCE_DEFS?.[k]?.label||k);}
  function classificationFor(career,training){return(state.results.specificClassifications||[]).find(r=>norm(r.CARRERA)===norm(career)&&norm(r.CAPACITACION_PRIORIZADA)===norm(training));}
  function prioritizedSpecifics(){return dnc.specifics();}
  function selectedBaseCluster(){return dnc.baseCluster();}

  function typeDistribution(){
    const specifics=prioritizedSpecifics(),rule=state.institutionalConfig.executiveSpecificTypeRule,map=new Map();
    specifics.forEach(s=>{const c=classificationFor(s.career,s.training);if(!c?.TIPO_CAPACITACION_PRIORIZADA)return;const label=String(c.TIPO_CAPACITACION_PRIORIZADA).trim(),key=norm(label);if(!map.has(key))map.set(key,{type:label,count:0});map.get(key).count++;});
    return[...map.values()].map(x=>({...x,percentage:rule===EXEC_RULE_BY_CAREERS&&specifics.length?Math.round(x.count/specifics.length*10000)/100:null})).sort((a,b)=>b.count-a.count||a.type.localeCompare(b.type,'es'));
  }

  function genericExecutive(){
    const sel=dnc.selected(),base=selectedBaseCluster(),scope=dnc.genericScope();
    const impactLabels=[
      ['planificación académica',sel.IMPACTO_PLANIFICACION],
      ['proceso de enseñanza-aprendizaje',sel.IMPACTO_ENSENANZA_APRENDIZAJE],
      ['resultados de aprendizaje',sel.IMPACTO_RESULTADOS_APRENDIZAJE],
      ['metodologías',sel.IMPACTO_METODOLOGIAS],
      ['evaluación',sel.IMPACTO_EVALUACION]
    ].filter(x=>String(x[1]||'').trim()).map(x=>x[0]);
    return{
      training:String(sel.CAPACITACION_GENERICA||'').trim(),type:'Genérica institucional',
      recurrence:base?.presenceLevel||'Pendiente',impact:base?.impact||'Pendiente',scope:scope.label||'Pendiente',nature:base?.nature||'Pendiente',function:'Docencia',
      focus:String(sel.NECESIDAD_BASE||sel.BRECHA_TRANSVERSAL||base?.displayName||'').trim(),
      purpose:String(sel.SINTESIS_JUSTIFICACION||sel.JUSTIFICACION_RESULTADOS||'').trim(),impactLabels
    };
  }

  function executiveIndicators(){return(state.results?.institutional?.indicators||[]).slice(0,4);}
  function section5TableCount(){const careers=dnc.analyzedCareers();return 3+((state.results?.institutional?.indicators||[]).length?1:0)+(careers.length*3);}
  function htmlTable(counter,title,headers,rows){counter.n++;const th=headers.map(h=>`<th>${esc(h)}</th>`).join('');const body=rows.length?rows.map(r=>`<tr>${r.map(c=>`<td>${c==null?'':c}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}" class="empty">Sin datos registrados.</td></tr>`;return`<div class="result-table-block"><div class="result-table-title"><strong>Tabla ${counter.n}. ${esc(title)}</strong></div><div class="table-wrap"><table class="institutional-table"><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table></div></div>`;}

  function summaryIssues(){
    const issues=[],generic=genericExecutive(),specifics=prioritizedSpecifics(),base=selectedBaseCluster();
    if(!generic.training)issues.push('La Sección 5 no tiene capacitación genérica institucional seleccionada.');
    if(!base)issues.push('No se puede relacionar la capacitación genérica con una necesidad institucional consolidada.');
    if(base&&!base.nature)issues.push('Falta la naturaleza/tipo institucional de la necesidad base en la Sección 5.');
    if(base&&!base.impact)issues.push('Falta el nivel de impacto institucional de la necesidad base en la Sección 5.');
    specifics.forEach(s=>{if(!classificationFor(s.career,s.training)?.TIPO_CAPACITACION_PRIORIZADA)issues.push(`${s.career}: falta clasificar el tipo de la capacitación priorizada "${s.training}".`);});
    if(state.institutionalConfig.executiveSpecificTypeRule===EXEC_RULE_PENDING)issues.push('Falta validar la regla institucional para calcular porcentajes por tipo de capacitación específica.');
    return[...new Set(issues)];
  }

  function renderSummaryHtml(){
    const counter={n:section5TableCount()},generic=genericExecutive(),specifics=prioritizedSpecifics(),dist=typeDistribution(),sources=usedSourceLabels(),indicators=executiveIndicators(),rule=state.institutionalConfig.executiveSpecificTypeRule;
    let h='<h2>6. Resumen Ejecutivo de Resultados del Diagnóstico</h2>';
    h+='<p>El presente resumen ejecutivo consolida los principales resultados del diagnóstico de necesidades de capacitación docente, diferenciando claramente la capacitación genérica institucional y las capacitaciones específicas priorizadas por carrera, constituyéndose en un insumo técnico para la planificación institucional.</p>';
    h+='<h3>6.1. Resultados institucionales de capacitación</h3>';
    h+=`<p>Del análisis consolidado de <strong>${esc(naturalList(sources)||'las fuentes efectivamente registradas')}</strong>, se identificó <strong>${esc(generic.training||'un resultado institucional pendiente de cierre')}</strong>, con <strong>${esc(generic.recurrence)}</strong> recurrencia y <strong>${esc(generic.impact)}</strong> impacto en la función sustantiva de docencia.</p>`;
    h+=htmlTable(counter,'Resultado institucional de capacitación genérica',['Elemento','Resultado'],[['Tipo de capacitación',esc(generic.type)],['Capacitación identificada',esc(generic.training||'Pendiente')],['Nivel de recurrencia institucional',esc(generic.recurrence)],['Impacto en la docencia',esc(generic.impact)],['Alcance',esc(generic.scope)],['Naturaleza',esc(generic.nature)],['Función sustantiva',esc(generic.function)]]);
    if(indicators.length)h+=htmlTable(counter,'Principales evidencias cuantitativas institucionales',['Indicador institucional','Resultado'],indicators.map(i=>[esc(i.ASPECTO_EVALUADO),`<span class="num-cell">${pct(i.PORCENTAJE_DOCENTES)}</span>`]));
    else h+='<p>No se incorporan evidencias cuantitativas ejecutivas porque la Sección 5 no contiene indicadores específicos vinculados a la selección.</p>';
    h+=`<p><strong>Síntesis ejecutiva:</strong> La capacitación <strong>${esc(generic.training||'pendiente')}</strong> se consolida como una necesidad de naturaleza <strong>${esc(generic.nature)}</strong> y alcance <strong>${esc(generic.scope)}</strong>, al incidir directamente en ${esc(generic.impactLabels.length?naturalList(generic.impactLabels):'los aspectos de impacto documentados en la Sección 5')}.</p>`;
    h+='<h3>6.2. Resultados de capacitación específica por carrera</h3><p>El diagnóstico permitió identificar capacitaciones específicas prioritarias por carrera, alineadas al perfil de egreso y al campo disciplinar, complementarias a la capacitación genérica institucional.</p>';
    h+=htmlTable(counter,'Consolidado ejecutivo de capacitaciones específicas por carrera',['Carrera','Capacitación priorizada'],specifics.map(s=>[esc(s.career),esc(s.training)]));
    h+=htmlTable(counter,'Caracterización de las capacitaciones específicas',['Tipo de capacitación','Porcentaje'],dist.map(d=>[esc(d.type),rule===EXEC_RULE_BY_CAREERS?`<span class="num-cell">${pct(d.percentage)}</span>`:'Pendiente de regla institucional']));
    if(rule===EXEC_RULE_BY_CAREERS&&dist.length){const top=dist[0],second=dist[1];h+=`<p><strong>Síntesis ejecutiva:</strong> Las capacitaciones específicas evidencian un predominio de <strong>${esc(top.type)}</strong>, que representa <strong>${pct(top.percentage)}</strong> del total${second?`, seguido de <strong>${esc(second.type)}</strong> con <strong>${pct(second.percentage)}</strong>`:''}.</p>`;}
    else h+='<p><strong>Síntesis ejecutiva:</strong> La distribución porcentual por tipo permanece pendiente hasta que el ITSQMET valide la regla institucional de cálculo.</p>';
    h+='<h3>6.3. Priorización final de necesidades de capacitación</h3>';
    h+=htmlTable(counter,'Priorización final institucional',['Nivel','Tipo de capacitación','Características'],[['Nivel 1','Capacitación genérica institucional',esc(naturalList([generic.scope,generic.nature,generic.impact])||'Pendiente')],['Nivel 2','Capacitaciones específicas por carrera','Contextualizadas según las necesidades particulares de cada carrera y complementarias a la capacitación genérica institucional']]);
    h+=htmlTable(counter,'Relación entre capacitación genérica y específica',['Elemento','Capacitación genérica','Capacitación específica'],[['Alcance','Institucional','Por carrera'],['Enfoque',esc(generic.focus||'Pendiente'),esc(dist.length?naturalList(dist.map(d=>d.type)):'Pendiente de clasificación')],['Impacto','Sistémico','Focalizado'],['Relación','Complementaria con las específicas','Complementarias a la genérica']]);
    const specificPurposes=naturalList(specifics.map(s=>s.link.FINALIDAD_CAPACITACION_ESPECIFICA));
    h+=`<p><strong>Cierre ejecutivo:</strong> El diagnóstico evidencia una estructura de necesidades de capacitación conformada por una capacitación genérica institucional, <strong>${esc(generic.training||'pendiente')}</strong>, orientada a ${esc(generic.purpose||generic.focus||'la finalidad institucional documentada en la Sección 5')}, y un conjunto de capacitaciones específicas por carrera destinadas a ${esc(specificPurposes||'atender las finalidades particulares registradas para cada carrera')}.</p>`;
    return h;
  }

  function injectStyles(){if(document.getElementById('summaryExecutiveStyles'))return;const style=document.createElement('style');style.id='summaryExecutiveStyles';style.textContent='.summary-auto-banner{background:#eef7f3;border:1px solid #c6e1d4;border-radius:10px;padding:12px 14px;color:#315f4a;margin-bottom:18px}.summary-rule-card{max-width:760px}.summary-rule-card select{width:100%;margin-top:7px;border:1px solid var(--line);border-radius:9px;padding:10px;background:#fff}.summary-classification-note{font-size:11px;color:var(--muted);margin-top:8px}';document.head.appendChild(style);}

  function saveTypeRule(){if(!ensureEditable())return;state.institutionalConfig.executiveSpecificTypeRule=document.getElementById('summaryTypeRuleSelect')?.value||EXEC_RULE_PENDING;saveState();toast('Regla ejecutiva guardada.');}
  function downloadSpecificClassificationTemplate(){const rows=prioritizedSpecifics().map(s=>{const old=classificationFor(s.career,s.training)||{};return{CARRERA:s.career,CAPACITACION_PRIORIZADA:s.training,TIPO_CAPACITACION_PRIORIZADA:old.TIPO_CAPACITACION_PRIORIZADA||''};});if(!rows.length)rows.push({CARRERA:'Ejemplo de carrera',CAPACITACION_PRIORIZADA:'Capacitación priorizada',TIPO_CAPACITACION_PRIORIZADA:''});downloadJson(rows,'Clasificacion_Especificas',`Plantilla_Clasificacion_Capacitaciones_Especificas_${state.period?.id||'Periodo'}.xlsx`);}

  async function importSpecificClassification(file){
    if(!ensureEditable())return;
    try{
      const rows=await readExcel(file),good=[],bad=[],active=dnc.activeCareers();
      rows.forEach((r,idx)=>{
        const career=String(r.CARRERA||'').trim(),training=String(r.CAPACITACION_PRIORIZADA||'').trim(),type=String(r.TIPO_CAPACITACION_PRIORIZADA||'').trim(),link=dnc.linkFor(career);
        if(!active.some(c=>norm(c.name)===norm(career))){bad.push({...r,FILA_EXCEL:idx+2,ERROR:'CARRERA no existe o no está activa'});return;}
        if(!link?.CAPACITACION_PRIORITARIA){bad.push({...r,FILA_EXCEL:idx+2,ERROR:'La carrera no tiene capacitación priorizada en la Sección 5'});return;}
        if(norm(training)!==norm(link.CAPACITACION_PRIORITARIA)){bad.push({...r,FILA_EXCEL:idx+2,ERROR:'CAPACITACION_PRIORIZADA no coincide con la Sección 5'});return;}
        if(!type){bad.push({...r,FILA_EXCEL:idx+2,ERROR:'TIPO_CAPACITACION_PRIORIZADA es obligatorio'});return;}
        good.push({CARRERA:career,CAPACITACION_PRIORIZADA:training,TIPO_CAPACITACION_PRIORIZADA:type});
      });
      const map=new Map((state.results.specificClassifications||[]).map(r=>[norm(r.CARRERA),r]));good.forEach(r=>map.set(norm(r.CARRERA),r));state.results.specificClassifications=[...map.values()];saveState();showImportResult('specificClassificationImportResult',good.length,bad,()=>downloadJson(bad,'Corregir','Correccion_Clasificacion_Capacitaciones_Especificas.xlsx'));toast(`Clasificación específica: ${good.length} fila(s) procesada(s).`);
    }catch(error){console.error(error);toast('No se pudo leer la plantilla de clasificación específica.');}
  }

  function injectUi(){
    injectStyles();
    const resultsNav=document.querySelector('.nav-item[data-view="dnc-resultados"]');if(resultsNav&&!document.querySelector('.nav-item[data-view="dnc-resumen"]')){resultsNav.insertAdjacentHTML('afterend','<button class="nav-item sub" data-view="dnc-resumen">6. Resumen Ejecutivo</button>');document.querySelector('.nav-item[data-view="dnc-resumen"]')?.addEventListener('click',()=>navigate('dnc-resumen'));}
    const configView=document.getElementById('view-configuracion');
    if(configView&&!document.getElementById('summaryRuleConfigCard')){const card=document.createElement('article');card.className='card mt-24 summary-rule-card';card.id='summaryRuleConfigCard';card.innerHTML=`<h3>Regla institucional · caracterización de capacitaciones específicas</h3><p>La app solo calculará porcentajes por tipo cuando esta regla esté validada institucionalmente.</p><label>Regla de cálculo<select id="summaryTypeRuleSelect"><option value="${EXEC_RULE_PENDING}">Pendiente de validación institucional</option><option value="${EXEC_RULE_BY_CAREERS}">Por número de carreras / total de capacitaciones específicas × 100</option></select></label><div class="form-actions"><button class="btn btn-primary" id="saveSummaryTypeRuleBtn">Guardar regla</button></div><div id="summaryTypeRuleNotice" class="info-box"></div>`;configView.appendChild(card);card.querySelector('#saveSummaryTypeRuleBtn').addEventListener('click',saveTypeRule);}
    const resultsGrid=document.querySelector('#view-dnc-resultados .result-upload-grid');
    if(resultsGrid&&!document.getElementById('specificClassificationCard')){const card=document.createElement('div');card.className='result-upload-card';card.id='specificClassificationCard';card.innerHTML='<h4>4. Clasificación de capacitaciones específicas</h4><p>La carrera y la capacitación priorizada vienen de Resultados; aquí únicamente se clasifica el tipo.</p><div class="candidate-actions"><button class="btn btn-light" id="downloadSpecificClassificationBtn">Descargar plantilla</button><label class="btn btn-secondary file-label">Subir Excel<input id="specificClassificationFileInput" type="file" hidden accept=".xlsx,.xls"></label></div><div id="specificClassificationImportResult"></div><div class="summary-classification-note">Este dato pertenece a Resultados; el Resumen Ejecutivo no tiene captura propia.</div>';resultsGrid.appendChild(card);card.querySelector('#downloadSpecificClassificationBtn').addEventListener('click',downloadSpecificClassificationTemplate);card.querySelector('#specificClassificationFileInput').addEventListener('change',e=>e.target.files[0]&&importSpecificClassification(e.target.files[0]));}
    const main=document.querySelector('main.main'),config=document.getElementById('view-configuracion');
    if(main&&config&&!document.getElementById('view-dnc-resumen')){const section=document.createElement('section');section.id='view-dnc-resumen';section.className='view';section.innerHTML='<div class="section-heading"><div><p class="eyebrow">DNC · Sección 6</p><h2>Resumen Ejecutivo de Resultados del Diagnóstico</h2><p>Consolidación automática desde la fuente canónica de Resultados.</p></div><span class="status ready">Automática</span></div><div class="summary-auto-banner"><strong>Sin captura duplicada.</strong> Esta sección se actualiza automáticamente cuando cambian los resultados.</div><div class="grid three compact-grid"><article class="mini-card"><span>Capacitación genérica</span><strong id="summaryGenericName">Pendiente</strong><small>Desde 5.2</small></article><article class="mini-card"><span>Capacitaciones específicas</span><strong id="summarySpecificCount">0</strong><small>Desde 5.3</small></article><article class="mini-card"><span>Regla de caracterización</span><strong id="summaryRuleStatus">Pendiente</strong><small>Configuración institucional</small></article></div><div id="summaryIssues" class="mt-24"></div><article class="card mt-24"><div class="section-title-row"><div><h3>Vista previa del Resumen Ejecutivo</h3><p>Se genera sin crear una segunda base de cálculos.</p></div><button class="btn btn-light" id="previewSummaryBtn">Vista previa DNC</button></div><div class="document-preview" id="summaryPreview"></div></article>';main.insertBefore(section,config);section.querySelector('#previewSummaryBtn').addEventListener('click',()=>{const host=document.getElementById('printDocument'),dialog=document.getElementById('pdfPreviewDialog');if(host)host.innerHTML=`<section class="doc-content doc-page">${renderSummaryHtml()}</section>`;dialog?.showModal();});}
  }

  function renderSummaryUi(){
    ensureExecutiveState();injectUi();const generic=genericExecutive(),specifics=prioritizedSpecifics(),rule=state.institutionalConfig.executiveSpecificTypeRule,issues=summaryIssues();
    const byId=id=>document.getElementById(id);if(byId('summaryGenericName'))byId('summaryGenericName').textContent=generic.training||'Pendiente';if(byId('summarySpecificCount'))byId('summarySpecificCount').textContent=specifics.length;if(byId('summaryRuleStatus'))byId('summaryRuleStatus').textContent=rule===EXEC_RULE_BY_CAREERS?'Validada':'Pendiente';if(byId('summaryPreview'))byId('summaryPreview').innerHTML=renderSummaryHtml();if(byId('summaryIssues'))byId('summaryIssues').innerHTML=issues.length?`<div class="info-box"><strong>${issues.length} pendiente(s) para un resumen ejecutivo completo:</strong><br>${issues.slice(0,8).map(esc).join('<br>')}${issues.length>8?'<br>…':''}</div>`:'<div class="info-box">Resumen Ejecutivo completo y sincronizado con Resultados.</div>';if(byId('summaryTypeRuleSelect'))byId('summaryTypeRuleSelect').value=rule;if(byId('summaryTypeRuleNotice'))byId('summaryTypeRuleNotice').textContent=rule===EXEC_RULE_BY_CAREERS?'Regla validada: porcentaje por tipo = capacitaciones específicas clasificadas en ese tipo / total de capacitaciones específicas priorizadas × 100.':'Pendiente: la app no calculará porcentajes por tipo hasta validar una regla institucional.';
  }

  const baseValidate=validateDncForFinal;validateDncForFinal=function(){return[...new Set([...baseValidate(),...summaryIssues()])];};
  const baseRenderAll=renderAll;renderAll=function(){const out=baseRenderAll();renderSummaryUi();return out;};
  const baseNavigate=navigate;navigate=function(view){const out=baseNavigate(view);if(view==='dnc-resumen'){const page=document.getElementById('pageTitle');if(page)page.textContent='DNC · Resumen Ejecutivo';}return out;};

  window.DOC_CAPA_DERIVED=window.DOC_CAPA_DERIVED||{};
  window.DOC_CAPA_DERIVED.summary={renderHtml:renderSummaryHtml,issues:summaryIssues,genericExecutive,typeDistribution};
  renderSummaryUi();
})();
