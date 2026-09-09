(function(){
  const EXEC_RULE_PENDING='pending';
  const EXEC_RULE_BY_CAREERS='count_by_careers';

  function ensureExecutiveState(){
    state.results=state.results||{};
    state.results.specificClassifications=Array.isArray(state.results.specificClassifications)?state.results.specificClassifications:[];
    state.institutionalConfig=state.institutionalConfig||{};
    if(!state.institutionalConfig.executiveSpecificTypeRule){
      state.institutionalConfig.executiveSpecificTypeRule=EXEC_RULE_PENDING;
    }
  }
  ensureExecutiveState();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));

  function esc(v){return escapeHtml(v);}
  function num(v){const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null;}
  function pct(v){const n=num(v);return n==null?'—':`${Math.round(n*100)/100}%`;}
  function nonEmpty(values){return values.map(v=>String(v??'').trim()).filter(Boolean);}
  function naturalList(values){
    const a=[...new Set(nonEmpty(values))];
    if(!a.length)return'';
    if(a.length===1)return a[0];
    if(a.length===2)return`${a[0]} y ${a[1]}`;
    return`${a.slice(0,-1).join(', ')} y ${a[a.length-1]}`;
  }
  function keyOf(career,need){return`${normalized(career)}|${normalized(need)}`;}
  function analyzedCareers(){return activeCareers().filter(c=>careerCandidates(c.name).length===5);}
  function careerLink(career){return (state.results?.careerLinks||[]).find(r=>normalized(r.CARRERA)===normalized(career));}
  function careerNeedResult(career,need){return (state.results?.careerNeeds||[]).find(r=>keyOf(r.CARRERA,r.NOMBRE_NECESIDAD)===keyOf(career,need));}
  function usedSourceLabels(){return Object.keys(SOURCE_DEFS).filter(hasSource).map(k=>SOURCE_DEFS[k].label);}
  function selectedGeneric(){return state.results?.institutional?.selection||{};}
  function institutionalNeedMeta(){return state.results?.institutional?.needMeta||[];}

  function institutionalClusters(){
    const careers=analyzedCareers(),total=careers.length,map=new Map();
    careers.forEach(c=>{
      careerCandidates(c.name).forEach(can=>{
        const rr=careerNeedResult(c.name,can.NOMBRE_NECESIDAD);
        const label=String(rr?.CLAVE_CONSOLIDACION||can.NOMBRE_NECESIDAD||'').trim();
        const k=normalized(label);
        if(!k)return;
        if(!map.has(k))map.set(k,{key:k,label,careers:new Set(),types:new Set(),impacts:new Set()});
        const g=map.get(k);g.careers.add(c.name);
        if(rr?.TIPO_NECESIDAD)g.types.add(rr.TIPO_NECESIDAD);
        if(can.IMPACTO_ACADEMICO&&normalized(can.IMPACTO_ACADEMICO)!=='pendiente')g.impacts.add(can.IMPACTO_ACADEMICO);
      });
    });
    return [...map.values()].map(g=>{
      const meta=institutionalNeedMeta().find(m=>normalized(m.CLAVE_CONSOLIDACION||m.NECESIDAD_INSTITUCIONAL)===g.key)||{};
      return{
        ...g,
        careers:[...g.careers],
        count:g.careers.size,
        percentage:total?Math.round((g.careers.size/total)*10000)/100:0,
        displayName:String(meta.NECESIDAD_INSTITUCIONAL||g.label).trim(),
        presenceLevel:String(meta.NIVEL_PRESENCIA||'').trim(),
        nature:String(meta.TIPO_NECESIDAD||naturalList([...g.types])).trim(),
        impact:String(meta.IMPACTO_INSTITUCIONAL||naturalList([...g.impacts])).trim()
      };
    }).sort((a,b)=>b.count-a.count||a.displayName.localeCompare(b.displayName,'es'));
  }

  function selectedBaseCluster(){
    const sel=selectedGeneric(),k=normalized(sel.NECESIDAD_BASE||'');
    if(!k)return null;
    return institutionalClusters().find(g=>g.key===k||normalized(g.displayName)===k||normalized(g.label)===k)||null;
  }

  function prioritizedSpecifics(){
    return analyzedCareers().map(c=>{
      const link=careerLink(c.name)||{};
      return{career:c.name,training:String(link.CAPACITACION_PRIORITARIA||'').trim(),link};
    }).filter(x=>x.training);
  }

  function classificationFor(career,training){
    return (state.results.specificClassifications||[]).find(r=>normalized(r.CARRERA)===normalized(career)&&normalized(r.CAPACITACION_PRIORIZADA)===normalized(training));
  }

  function typeDistribution(){
    const specifics=prioritizedSpecifics(),rule=state.institutionalConfig.executiveSpecificTypeRule,map=new Map();
    specifics.forEach(s=>{
      const c=classificationFor(s.career,s.training);
      if(!c?.TIPO_CAPACITACION_PRIORIZADA)return;
      const label=String(c.TIPO_CAPACITACION_PRIORIZADA).trim(),k=normalized(label);
      if(!map.has(k))map.set(k,{type:label,count:0});
      map.get(k).count++;
    });
    return [...map.values()].map(x=>({
      ...x,
      percentage:rule===EXEC_RULE_BY_CAREERS&&specifics.length?Math.round((x.count/specifics.length)*10000)/100:null
    })).sort((a,b)=>b.count-a.count||a.type.localeCompare(b.type,'es'));
  }

  function genericExecutive(){
    const sel=selectedGeneric(),base=selectedBaseCluster(),careers=analyzedCareers();
    const all=!!(base&&careers.length&&base.count===careers.length);
    const impactLabels=[
      ['planificación académica',sel.IMPACTO_PLANIFICACION],
      ['proceso de enseñanza-aprendizaje',sel.IMPACTO_ENSENANZA_APRENDIZAJE],
      ['resultados de aprendizaje',sel.IMPACTO_RESULTADOS_APRENDIZAJE],
      ['metodologías',sel.IMPACTO_METODOLOGIAS],
      ['evaluación',sel.IMPACTO_EVALUACION]
    ].filter(x=>String(x[1]||'').trim()).map(x=>x[0]);
    return{
      training:String(sel.CAPACITACION_GENERICA||'').trim(),
      type:'Genérica institucional',
      recurrence:base?.presenceLevel||'Pendiente',
      impact:base?.impact||'Pendiente',
      scope:base?(all?'Todas las carreras diagnosticadas':`${base.count} de ${careers.length} carreras diagnosticadas`):'Pendiente',
      nature:base?.nature||'Pendiente',
      function:'Docencia',
      focus:String(sel.NECESIDAD_BASE||sel.BRECHA_TRANSVERSAL||base?.displayName||'').trim(),
      purpose:String(sel.SINTESIS_JUSTIFICACION||sel.JUSTIFICACION_RESULTADOS||'').trim(),
      impactLabels
    };
  }

  function executiveIndicators(){return (state.results?.institutional?.indicators||[]).slice(0,4);}
  function section5TableCount(){
    const careers=analyzedCareers();
    return 3+((state.results?.institutional?.indicators||[]).length?1:0)+(careers.length*3);
  }

  function htmlTable(counter,title,headers,rows){
    counter.n++;
    const th=headers.map(h=>`<th>${esc(h)}</th>`).join('');
    const body=rows.length?rows.map(r=>`<tr>${r.map(c=>`<td>${c==null?'':c}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}" class="empty">Sin datos registrados.</td></tr>`;
    return`<div class="result-table-block"><div class="result-table-title"><strong>Tabla ${counter.n}. ${esc(title)}</strong></div><div class="table-wrap"><table class="institutional-table"><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table></div></div>`;
  }

  function summaryIssues(){
    const issues=[],generic=genericExecutive(),specifics=prioritizedSpecifics(),base=selectedBaseCluster();
    if(!generic.training)issues.push('La Sección 5 no tiene capacitación genérica institucional seleccionada.');
    if(!base)issues.push('No se puede relacionar la capacitación genérica con una necesidad institucional consolidada.');
    if(base&&!base.nature)issues.push('Falta la naturaleza/tipo institucional de la necesidad base en la Sección 5.');
    if(base&&!base.impact)issues.push('Falta el nivel de impacto institucional de la necesidad base en la Sección 5.');
    specifics.forEach(s=>{
      const c=classificationFor(s.career,s.training);
      if(!c?.TIPO_CAPACITACION_PRIORIZADA)issues.push(`${s.career}: falta clasificar el tipo de la capacitación priorizada "${s.training}".`);
    });
    if(state.institutionalConfig.executiveSpecificTypeRule===EXEC_RULE_PENDING){
      issues.push('Falta validar la regla institucional para calcular porcentajes por tipo de capacitación específica.');
    }
    return[...new Set(issues)];
  }

  function renderSummaryHtml(){
    const counter={n:section5TableCount()},generic=genericExecutive(),specifics=prioritizedSpecifics(),dist=typeDistribution(),sources=usedSourceLabels(),indicators=executiveIndicators();
    const rule=state.institutionalConfig.executiveSpecificTypeRule;
    let h='<h2>6. Resumen Ejecutivo de Resultados del Diagnóstico</h2>';
    h+='<p>El presente resumen ejecutivo consolida los principales resultados del diagnóstico de necesidades de capacitación docente, diferenciando claramente la capacitación genérica institucional y las capacitaciones específicas priorizadas por carrera, constituyéndose en un insumo técnico para la planificación institucional.</p>';

    h+='<h3>6.1. Resultados institucionales de capacitación</h3>';
    h+=`<p>Del análisis consolidado de <strong>${esc(naturalList(sources)||'las fuentes efectivamente registradas')}</strong>, se identificó <strong>${esc(generic.training||'un resultado institucional pendiente de cierre')}</strong>, con <strong>${esc(generic.recurrence)}</strong> recurrencia y <strong>${esc(generic.impact)}</strong> impacto en la función sustantiva de docencia.</p>`;
    h+=htmlTable(counter,'Resultado institucional de capacitación genérica',['Elemento','Resultado'],[
      ['Tipo de capacitación',esc(generic.type)],
      ['Capacitación identificada',esc(generic.training||'Pendiente')],
      ['Nivel de recurrencia institucional',esc(generic.recurrence)],
      ['Impacto en la docencia',esc(generic.impact)],
      ['Alcance',esc(generic.scope)],
      ['Naturaleza',esc(generic.nature)],
      ['Función sustantiva',esc(generic.function)]
    ]);
    if(indicators.length){
      h+=htmlTable(counter,'Principales evidencias cuantitativas institucionales',['Indicador institucional','Resultado'],indicators.map(i=>[esc(i.ASPECTO_EVALUADO),`<span class="num-cell">${pct(i.PORCENTAJE_DOCENTES)}</span>`]));
    }else{
      h+='<p>No se incorporan evidencias cuantitativas ejecutivas porque la Sección 5 no contiene indicadores específicos vinculados a la selección. La app no los inventa para completar la tabla.</p>';
    }
    const impacts=generic.impactLabels.length?naturalList(generic.impactLabels):'los aspectos de impacto documentados en la Sección 5';
    h+=`<p><strong>Síntesis ejecutiva:</strong> La capacitación <strong>${esc(generic.training||'pendiente')}</strong> se consolida como una necesidad de naturaleza <strong>${esc(generic.nature)}</strong> y alcance <strong>${esc(generic.scope)}</strong>, al incidir directamente en ${esc(impacts)}.</p>`;

    h+='<h3>6.2. Resultados de capacitación específica por carrera</h3><p>El diagnóstico permitió identificar capacitaciones específicas prioritarias por carrera, alineadas al perfil de egreso y al campo disciplinar, complementarias a la capacitación genérica institucional.</p>';
    h+=htmlTable(counter,'Consolidado ejecutivo de capacitaciones específicas por carrera',['Carrera','Capacitación priorizada'],specifics.map(s=>[esc(s.career),esc(s.training)]));
    const distRows=dist.map(d=>[esc(d.type),rule===EXEC_RULE_BY_CAREERS?`<span class="num-cell">${pct(d.percentage)}</span>`:'Pendiente de regla institucional']);
    h+=htmlTable(counter,'Caracterización de las capacitaciones específicas',['Tipo de capacitación','Porcentaje'],distRows);
    if(rule===EXEC_RULE_BY_CAREERS&&dist.length){
      const top=dist[0],second=dist[1];
      h+=`<p><strong>Síntesis ejecutiva:</strong> Las capacitaciones específicas responden a necesidades propias del campo profesional de cada carrera. La caracterización de las capacitaciones priorizadas evidencia un predominio de <strong>${esc(top.type)}</strong>, que representa <strong>${pct(top.percentage)}</strong> del total${second?`, seguido de <strong>${esc(second.type)}</strong> con <strong>${pct(second.percentage)}</strong>`:''}. Estas capacitaciones se articulan con la capacitación genérica institucional desde un enfoque complementario.</p>`;
    }else{
      h+='<p><strong>Síntesis ejecutiva:</strong> La distribución porcentual por tipo permanece pendiente hasta que el ITSQMET valide la regla institucional de cálculo. La app no deduce los porcentajes del documento histórico.</p>';
    }

    h+='<h3>6.3. Priorización final de necesidades de capacitación</h3>';
    const genericCharacteristics=naturalList([generic.scope,generic.nature,generic.impact]);
    h+=htmlTable(counter,'Priorización final institucional',['Nivel','Tipo de capacitación','Características'],[
      ['Nivel 1','Capacitación genérica institucional',esc(genericCharacteristics||'Pendiente')],
      ['Nivel 2','Capacitaciones específicas por carrera','Contextualizadas según las necesidades particulares de cada carrera y complementarias a la capacitación genérica institucional']
    ]);
    const specificFocus=dist.length?naturalList(dist.map(d=>d.type)):'Pendiente de clasificación';
    h+=htmlTable(counter,'Relación entre capacitación genérica y específica',['Elemento','Capacitación genérica','Capacitación específica'],[
      ['Alcance','Institucional','Por carrera'],
      ['Enfoque',esc(generic.focus||'Pendiente'),esc(specificFocus)],
      ['Impacto','Sistémico','Focalizado'],
      ['Relación','Complementaria con las específicas','Complementarias a la genérica']
    ]);
    const specificPurposes=naturalList(specifics.map(s=>s.link.FINALIDAD_CAPACITACION_ESPECIFICA));
    h+=`<p><strong>Cierre ejecutivo:</strong> El diagnóstico evidencia una estructura de necesidades de capacitación conformada por una capacitación genérica institucional, <strong>${esc(generic.training||'pendiente')}</strong>, orientada a ${esc(generic.purpose||generic.focus||'la finalidad institucional documentada en la Sección 5')}, y un conjunto de capacitaciones específicas por carrera destinadas a ${esc(specificPurposes||'atender las finalidades particulares registradas para cada carrera')}. Esta priorización permite una planificación coherente, eficiente y alineada con la mejora continua de la docencia.</p>`;
    return h;
  }

  function injectStyles(){
    if(document.getElementById('summaryExecutiveStyles'))return;
    const style=document.createElement('style');style.id='summaryExecutiveStyles';style.textContent=`
      .summary-auto-banner{background:#eef7f3;border:1px solid #c6e1d4;border-radius:10px;padding:12px 14px;color:#315f4a;margin-bottom:18px}
      .summary-rule-card{max-width:760px}
      .summary-rule-card select{width:100%;margin-top:7px;border:1px solid var(--line);border-radius:9px;padding:10px;background:#fff}
      .summary-classification-note{font-size:11px;color:var(--muted);margin-top:8px}
    `;document.head.appendChild(style);
  }

  function injectUi(){
    injectStyles();
    const resultsNav=document.querySelector('.nav-item[data-view="dnc-resultados"]');
    if(resultsNav&&!document.querySelector('.nav-item[data-view="dnc-resumen"]')){
      resultsNav.insertAdjacentHTML('afterend','<button class="nav-item sub" data-view="dnc-resumen">6. Resumen Ejecutivo</button>');
      document.querySelector('.nav-item[data-view="dnc-resumen"]').addEventListener('click',()=>navigate('dnc-resumen'));
    }

    const homeGrid=document.querySelector('#view-inicio .grid.three.mt-24');
    if(homeGrid&&!document.getElementById('homeSummaryCard')){
      const statusCard=homeGrid.lastElementChild;
      const card=document.createElement('article');card.className='card';card.id='homeSummaryCard';
      card.innerHTML='<div class="card-head"><span class="step">6</span><span class="status ready">Implementado</span></div><h3>Resumen Ejecutivo</h3><p>Vista ejecutiva automática de los resultados institucionales y por carrera de la Sección 5.</p><button class="text-button" id="openSummaryHomeBtn">Abrir sección →</button>';
      homeGrid.insertBefore(card,statusCard);
      card.querySelector('#openSummaryHomeBtn').addEventListener('click',()=>navigate('dnc-resumen'));
      const list=statusCard.querySelector('.check-list');
      if(list&&!document.getElementById('summaryStatusLine')){
        const line=document.createElement('div');line.id='summaryStatusLine';line.innerHTML='<span class="dot ok"></span>Resumen Ejecutivo implementado';list.insertBefore(line,list.children[5]||null);
      }
    }

    const configView=document.getElementById('view-configuracion');
    if(configView&&!document.getElementById('summaryRuleConfigCard')){
      const card=document.createElement('article');card.className='card mt-24 summary-rule-card';card.id='summaryRuleConfigCard';
      card.innerHTML=`<h3>Regla institucional · caracterización de capacitaciones específicas</h3><p>La DNC fuente no define la fórmula de los porcentajes por tipo. La app solo los calculará cuando esta regla sea validada institucionalmente.</p><label>Regla de cálculo<select id="summaryTypeRuleSelect"><option value="${EXEC_RULE_PENDING}">Pendiente de validación institucional</option><option value="${EXEC_RULE_BY_CAREERS}">Por número de carreras / total de capacitaciones específicas × 100</option></select></label><div class="form-actions"><button class="btn btn-primary" id="saveSummaryTypeRuleBtn">Guardar regla</button></div><div id="summaryTypeRuleNotice" class="info-box"></div>`;
      configView.appendChild(card);
      card.querySelector('#saveSummaryTypeRuleBtn').addEventListener('click',saveTypeRule);
    }

    const resultsGrid=document.querySelector('#view-dnc-resultados .result-upload-grid');
    if(resultsGrid&&!document.getElementById('specificClassificationCard')){
      const card=document.createElement('div');card.className='result-upload-card';card.id='specificClassificationCard';
      card.innerHTML='<h4>4. Clasificación de capacitaciones específicas</h4><p>La carrera y la capacitación priorizada vienen de la Sección 5; únicamente se clasifica el tipo de capacitación para el consolidado ejecutivo.</p><div class="candidate-actions"><button class="btn btn-light" id="downloadSpecificClassificationBtn">Descargar plantilla</button><label class="btn btn-secondary file-label">Subir Excel<input id="specificClassificationFileInput" type="file" hidden accept=".xlsx,.xls"></label></div><div id="specificClassificationImportResult"></div><div class="summary-classification-note">Este dato pertenece a Resultados; el Resumen Ejecutivo no tiene captura propia.</div>';
      resultsGrid.appendChild(card);
      card.querySelector('#downloadSpecificClassificationBtn').addEventListener('click',downloadSpecificClassificationTemplate);
      card.querySelector('#specificClassificationFileInput').addEventListener('change',e=>e.target.files[0]&&importSpecificClassification(e.target.files[0]));
    }

    const main=document.querySelector('main.main'),config=document.getElementById('view-configuracion');
    if(main&&config&&!document.getElementById('view-dnc-resumen')){
      const section=document.createElement('section');section.id='view-dnc-resumen';section.className='view';
      section.innerHTML=`
        <div class="section-heading"><div><p class="eyebrow">DNC · Sección 6</p><h2>Resumen Ejecutivo de Resultados del Diagnóstico</h2><p>Consolidación automática y coherente de la Sección 5.</p></div><span class="status ready">Automática</span></div>
        <div class="summary-auto-banner"><strong>Sin captura de datos.</strong> Esta sección se actualiza automáticamente cuando cambia cualquier resultado de la Sección 5.</div>
        <div class="grid three compact-grid">
          <article class="mini-card"><span>Capacitación genérica</span><strong id="summaryGenericName">Pendiente</strong><small>Desde 5.2</small></article>
          <article class="mini-card"><span>Capacitaciones específicas</span><strong id="summarySpecificCount">0</strong><small>Desde 5.3</small></article>
          <article class="mini-card"><span>Regla de caracterización</span><strong id="summaryRuleStatus">Pendiente</strong><small>Configuración institucional</small></article>
        </div>
        <div id="summaryIssues" class="mt-24"></div>
        <article class="card mt-24"><div class="section-title-row"><div><h3>Vista previa del Resumen Ejecutivo</h3><p>6.1, 6.2 y 6.3 se generan sin duplicar resultados ni crear una segunda base de datos.</p></div><button class="btn btn-light" id="previewSummaryBtn">Vista previa DNC</button></div><div class="document-preview" id="summaryPreview"></div></article>`;
      main.insertBefore(section,config);
      section.querySelector('#previewSummaryBtn').addEventListener('click',openPreview);
    }
  }

  function saveTypeRule(){
    if(!ensureEditable())return;
    const select=document.getElementById('summaryTypeRuleSelect');
    state.institutionalConfig.executiveSpecificTypeRule=select?.value||EXEC_RULE_PENDING;
    saveState();toast('Regla ejecutiva guardada.');
  }

  function downloadSpecificClassificationTemplate(){
    const rows=prioritizedSpecifics().map(s=>{
      const old=classificationFor(s.career,s.training)||{};
      return{CARRERA:s.career,CAPACITACION_PRIORIZADA:s.training,TIPO_CAPACITACION_PRIORIZADA:old.TIPO_CAPACITACION_PRIORIZADA||''};
    });
    if(!rows.length)rows.push({CARRERA:'Ejemplo de carrera',CAPACITACION_PRIORIZADA:'Capacitación priorizada',TIPO_CAPACITACION_PRIORIZADA:''});
    downloadJson(rows,'Clasificacion_Especificas',`Plantilla_Clasificacion_Capacitaciones_Especificas_${state.period?.id||'Periodo'}.xlsx`);
  }

  async function importSpecificClassification(file){
    if(!ensureEditable())return;
    try{
      const rows=await readExcel(file),good=[],bad=[];
      rows.forEach((r,idx)=>{
        const career=String(r.CARRERA||'').trim(),training=String(r.CAPACITACION_PRIORIZADA||'').trim(),type=String(r.TIPO_CAPACITACION_PRIORIZADA||'').trim();
        const link=careerLink(career);
        if(!sourceRowCareerValid(career)){bad.push({...r,FILA_EXCEL:idx+2,ERROR:'CARRERA no existe o no está activa'});return;}
        if(!link?.CAPACITACION_PRIORITARIA){bad.push({...r,FILA_EXCEL:idx+2,ERROR:'La carrera no tiene capacitación priorizada en la Sección 5'});return;}
        if(normalized(training)!==normalized(link.CAPACITACION_PRIORITARIA)){bad.push({...r,FILA_EXCEL:idx+2,ERROR:'CAPACITACION_PRIORIZADA no coincide con la Sección 5'});return;}
        if(!type){bad.push({...r,FILA_EXCEL:idx+2,ERROR:'TIPO_CAPACITACION_PRIORIZADA es obligatorio'});return;}
        good.push({CARRERA:career,CAPACITACION_PRIORIZADA:training,TIPO_CAPACITACION_PRIORIZADA:type});
      });
      const map=new Map((state.results.specificClassifications||[]).map(r=>[normalized(r.CARRERA),r]));good.forEach(r=>map.set(normalized(r.CARRERA),r));state.results.specificClassifications=[...map.values()];
      saveState();showImportResult('specificClassificationImportResult',good.length,bad,()=>downloadJson(bad,'Corregir','Correccion_Clasificacion_Capacitaciones_Especificas.xlsx'));
      toast(`Clasificación específica: ${good.length} fila(s) procesada(s).`);
    }catch(e){console.error(e);toast('No se pudo leer la plantilla de clasificación específica.');}
  }

  function renderSummaryUi(){
    ensureExecutiveState();injectUi();
    const generic=genericExecutive(),specifics=prioritizedSpecifics(),rule=state.institutionalConfig.executiveSpecificTypeRule,issues=summaryIssues();
    const byId=id=>document.getElementById(id);
    if(byId('implementedSectionsCount'))byId('implementedSectionsCount').textContent='6';
    if(byId('summaryGenericName'))byId('summaryGenericName').textContent=generic.training||'Pendiente';
    if(byId('summarySpecificCount'))byId('summarySpecificCount').textContent=specifics.length;
    if(byId('summaryRuleStatus'))byId('summaryRuleStatus').textContent=rule===EXEC_RULE_BY_CAREERS?'Validada':'Pendiente';
    if(byId('summaryPreview'))byId('summaryPreview').innerHTML=renderSummaryHtml();
    if(byId('summaryIssues'))byId('summaryIssues').innerHTML=issues.length?`<div class="info-box"><strong>${issues.length} pendiente(s) para un resumen ejecutivo completo:</strong><br>${issues.slice(0,8).map(esc).join('<br>')}${issues.length>8?'<br>…':''}</div>`:'<div class="info-box">Resumen Ejecutivo completo y sincronizado con la Sección 5.</div>';
    if(byId('summaryTypeRuleSelect'))byId('summaryTypeRuleSelect').value=rule;
    if(byId('summaryTypeRuleNotice'))byId('summaryTypeRuleNotice').textContent=rule===EXEC_RULE_BY_CAREERS?'Regla validada: porcentaje por tipo = capacitaciones específicas clasificadas en ese tipo / total de capacitaciones específicas priorizadas × 100.':'Pendiente: la app no calculará porcentajes por tipo hasta que se valide una regla institucional.';
  }

  const baseValidate=validateDncForFinal;
  validateDncForFinal=function(){return[...new Set([...baseValidate(),...summaryIssues()])];};

  const baseRenderAll=renderAll;
  renderAll=function(){baseRenderAll();renderSummaryUi();};

  const baseNavigate=navigate;
  navigate=function(view){baseNavigate(view);if(view==='dnc-resumen')document.getElementById('pageTitle').textContent='DNC · Resumen Ejecutivo';};

  const baseBuildPrint=buildPrintDocument;
  buildPrintDocument=function(){return baseBuildPrint()+`<section class="doc-content doc-page">${renderSummaryHtml()}</section>`;};

  function pdfEnsure(doc,y,needed=10){if(y+needed>280){doc.addPage();return 18;}return y;}
  function pdfTable(doc,title,headers,rows,y,widths){
    y=pdfEnsure(doc,y,18);y=writeParagraph(doc,title,y);const x=15,total=180;const ws=widths&&widths.length===headers.length?widths:headers.map(()=>total/headers.length),line=4.1,pad=2;
    const drawHeader=()=>{let max=8;const lines=headers.map((h,i)=>{const l=doc.splitTextToSize(String(h),ws[i]-pad*2);max=Math.max(max,l.length*line+pad*2);return l;});y=pdfEnsure(doc,y,max);let cx=x;doc.setFillColor(15,39,71);doc.setDrawColor(80);headers.forEach((h,i)=>{doc.rect(cx,y,ws[i],max,'FD');doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text(lines[i],cx+pad,y+pad+3);cx+=ws[i];});doc.setTextColor(0);y+=max;};
    drawHeader();
    rows.forEach(row=>{const cells=row.map((v,i)=>doc.splitTextToSize(String(v??''),ws[i]-pad*2)),rh=Math.max(8,...cells.map(l=>l.length*line+pad*2));if(y+rh>280){doc.addPage();y=18;drawHeader();}let cx=x;cells.forEach((lines,i)=>{doc.setDrawColor(110);doc.rect(cx,y,ws[i],rh);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(lines,cx+pad,y+pad+3);cx+=ws[i];});y+=rh;});return y+4;
  }

  function writeSummaryPdf(doc){
    const generic=genericExecutive(),specifics=prioritizedSpecifics(),dist=typeDistribution(),sources=usedSourceLabels(),indicators=executiveIndicators(),rule=state.institutionalConfig.executiveSpecificTypeRule;
    let tableNo=section5TableCount(),y=20;
    y=writeHeading(doc,'6. Resumen Ejecutivo de Resultados del Diagnóstico',2,y);
    y=writeParagraph(doc,'El presente resumen ejecutivo consolida los principales resultados del diagnóstico de necesidades de capacitación docente, diferenciando claramente la capacitación genérica institucional y las capacitaciones específicas priorizadas por carrera, constituyéndose en un insumo técnico para la planificación institucional.',y);

    y=writeHeading(doc,'6.1. Resultados institucionales de capacitación',3,y);
    y=writeParagraph(doc,`Del análisis consolidado de ${naturalList(sources)||'las fuentes efectivamente registradas'}, se identificó ${generic.training||'un resultado institucional pendiente de cierre'}, con ${generic.recurrence} recurrencia y ${generic.impact} impacto en la función sustantiva de docencia.`,y);
    tableNo++;y=pdfTable(doc,`Tabla ${tableNo}. Resultado institucional de capacitación genérica`,['Elemento','Resultado'],[
      ['Tipo de capacitación',generic.type],['Capacitación identificada',generic.training||'Pendiente'],['Nivel de recurrencia institucional',generic.recurrence],['Impacto en la docencia',generic.impact],['Alcance',generic.scope],['Naturaleza',generic.nature],['Función sustantiva',generic.function]
    ],y,[72,108]);
    if(indicators.length){tableNo++;y=pdfTable(doc,`Tabla ${tableNo}. Principales evidencias cuantitativas institucionales`,['Indicador institucional','Resultado'],indicators.map(i=>[i.ASPECTO_EVALUADO,pct(i.PORCENTAJE_DOCENTES)]),y,[145,35]);}
    else y=writeParagraph(doc,'No se incorporan evidencias cuantitativas ejecutivas porque la Sección 5 no contiene indicadores específicos vinculados a la selección.',y);
    y=writeParagraph(doc,`Síntesis ejecutiva: La capacitación ${generic.training||'pendiente'} se consolida como una necesidad de naturaleza ${generic.nature} y alcance ${generic.scope}, al incidir directamente en ${generic.impactLabels.length?naturalList(generic.impactLabels):'los aspectos de impacto documentados en la Sección 5'}.`,y);

    y=writeHeading(doc,'6.2. Resultados de capacitación específica por carrera',3,y);
    y=writeParagraph(doc,'El diagnóstico permitió identificar capacitaciones específicas prioritarias por carrera, alineadas al perfil de egreso y al campo disciplinar, complementarias a la capacitación genérica institucional.',y);
    tableNo++;y=pdfTable(doc,`Tabla ${tableNo}. Consolidado ejecutivo de capacitaciones específicas por carrera`,['Carrera','Capacitación priorizada'],specifics.map(s=>[s.career,s.training]),y,[80,100]);
    tableNo++;y=pdfTable(doc,`Tabla ${tableNo}. Caracterización de las capacitaciones específicas`,['Tipo de capacitación','Porcentaje'],dist.map(d=>[d.type,rule===EXEC_RULE_BY_CAREERS?pct(d.percentage):'Pendiente de regla institucional']),y,[135,45]);
    if(rule===EXEC_RULE_BY_CAREERS&&dist.length){
      const top=dist[0],second=dist[1];y=writeParagraph(doc,`Síntesis ejecutiva: Las capacitaciones específicas evidencian un predominio de ${top.type}, que representa ${pct(top.percentage)} del total${second?`, seguido de ${second.type} con ${pct(second.percentage)}`:''}. Estas capacitaciones se articulan con la capacitación genérica institucional desde un enfoque complementario.`,y);
    }else y=writeParagraph(doc,'Síntesis ejecutiva: La distribución porcentual por tipo permanece pendiente hasta que el ITSQMET valide la regla institucional de cálculo.',y);

    y=writeHeading(doc,'6.3. Priorización final de necesidades de capacitación',3,y);
    tableNo++;y=pdfTable(doc,`Tabla ${tableNo}. Priorización final institucional`,['Nivel','Tipo de capacitación','Características'],[
      ['Nivel 1','Capacitación genérica institucional',naturalList([generic.scope,generic.nature,generic.impact])||'Pendiente'],
      ['Nivel 2','Capacitaciones específicas por carrera','Contextualizadas según las necesidades particulares de cada carrera y complementarias a la capacitación genérica institucional']
    ],y,[25,65,90]);
    tableNo++;y=pdfTable(doc,`Tabla ${tableNo}. Relación entre capacitación genérica y específica`,['Elemento','Capacitación genérica','Capacitación específica'],[
      ['Alcance','Institucional','Por carrera'],
      ['Enfoque',generic.focus||'Pendiente',dist.length?naturalList(dist.map(d=>d.type)):'Pendiente de clasificación'],
      ['Impacto','Sistémico','Focalizado'],
      ['Relación','Complementaria con las específicas','Complementarias a la genérica']
    ],y,[35,72.5,72.5]);
    const specificPurposes=naturalList(specifics.map(s=>s.link.FINALIDAD_CAPACITACION_ESPECIFICA));
    y=writeParagraph(doc,`Cierre ejecutivo: El diagnóstico evidencia una estructura de necesidades de capacitación conformada por una capacitación genérica institucional, ${generic.training||'pendiente'}, orientada a ${generic.purpose||generic.focus||'la finalidad institucional documentada en la Sección 5'}, y un conjunto de capacitaciones específicas por carrera destinadas a ${specificPurposes||'atender las finalidades particulares registradas para cada carrera'}. Esta priorización permite una planificación coherente, eficiente y alineada con la mejora continua de la docencia.`,y);
  }

  const baseDownloadPdf=downloadPdf;
  downloadPdf=function(){
    const api=jsPDF?.API,originalSave=api?.save;
    if(typeof originalSave!=='function')return baseDownloadPdf();
    let restored=false;
    api.save=function(filename,options){
      try{this.addPage();writeSummaryPdf(this);}
      catch(e){console.error(e);toast('No se pudo incorporar el Resumen Ejecutivo al PDF.');}
      api.save=originalSave;restored=true;
      return originalSave.call(this,filename,options);
    };
    try{return baseDownloadPdf();}
    finally{if(!restored)api.save=originalSave;}
  };

  function replaceDownloadListener(id){
    const old=document.getElementById(id);if(!old)return;
    const clone=old.cloneNode(true);old.replaceWith(clone);clone.addEventListener('click',downloadPdf);
  }

  injectUi();
  replaceDownloadListener('downloadDncBtn');
  replaceDownloadListener('downloadFromPreviewBtn');
  renderAll();
})();
