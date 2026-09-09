(function(){
  const RESULT_CRITERIA=[
    'Recurrencia en múltiples carreras',
    'Impacto directo en la docencia',
    'Vinculación con planificación académica',
    'Coherencia con perfiles de egreso',
    'Alineación institucional (PEDI–POA–CACES)'
  ];

  function defaultResults(){
    return {
      version:1,
      image:null,
      careerNeeds:[],
      careerLinks:[],
      institutional:{
        needMeta:[],
        alternatives:[],
        criteria:RESULT_CRITERIA.map(c=>({CRITERIO:c,NIVEL_CUMPLIMIENTO:''})),
        indicators:[],
        selection:{
          CAPACITACION_GENERICA:'',
          NECESIDAD_BASE:'',
          BRECHA_TRANSVERSAL:'',
          JUSTIFICACION_RESULTADOS:'',
          SINTESIS_JUSTIFICACION:'',
          IMPACTO_PLANIFICACION:'',
          IMPACTO_ENSENANZA_APRENDIZAJE:'',
          IMPACTO_RESULTADOS_APRENDIZAJE:'',
          IMPACTO_METODOLOGIAS:'',
          IMPACTO_EVALUACION:''
        }
      }
    };
  }

  function ensureResultsState(){
    const d=defaultResults();
    state.results={...d,...(state.results||{})};
    state.results.careerNeeds=Array.isArray(state.results.careerNeeds)?state.results.careerNeeds:[];
    state.results.careerLinks=Array.isArray(state.results.careerLinks)?state.results.careerLinks:[];
    state.results.institutional={...d.institutional,...(state.results.institutional||{})};
    state.results.institutional.needMeta=Array.isArray(state.results.institutional.needMeta)?state.results.institutional.needMeta:[];
    state.results.institutional.alternatives=Array.isArray(state.results.institutional.alternatives)?state.results.institutional.alternatives:[];
    state.results.institutional.indicators=Array.isArray(state.results.institutional.indicators)?state.results.institutional.indicators:[];
    state.results.institutional.criteria=Array.isArray(state.results.institutional.criteria)&&state.results.institutional.criteria.length?state.results.institutional.criteria:d.institutional.criteria;
    state.results.institutional.selection={...d.institutional.selection,...(state.results.institutional.selection||{})};
  }
  ensureResultsState();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));

  function esc(v){return escapeHtml(v);}
  function num(v){const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null;}
  function pct(v){const n=num(v);return n==null?'—':`${Math.round(n*100)/100}%`;}
  function keyOf(career,need){return `${normalized(career)}|${normalized(need)}`;}
  function careerNeedResult(career,need){return state.results.careerNeeds.find(r=>keyOf(r.CARRERA,r.NOMBRE_NECESIDAD)===keyOf(career,need));}
  function careerLink(career){return state.results.careerLinks.find(r=>normalized(r.CARRERA)===normalized(career));}
  function analyzedCareers(){return activeCareers().filter(c=>careerCandidates(c.name).length===5);}
  function usedSourceLabels(){return Object.keys(SOURCE_DEFS).filter(hasSource).map(k=>SOURCE_DEFS[k].label);}
  function sourceLabelsForCandidate(career,need){return evidenceForNeed(career,need).map(x=>x.label);}
  function nonEmpty(values){return values.map(v=>String(v??'').trim()).filter(Boolean);}
  function naturalList(values){const a=[...new Set(nonEmpty(values))];if(!a.length)return'';if(a.length===1)return a[0];if(a.length===2)return`${a[0]} y ${a[1]}`;return`${a.slice(0,-1).join(', ')} y ${a[a.length-1]}`;}
  function alpha(i){return String.fromCharCode(65+i)+')';}

  function clusterKeyFor(career,need){
    const r=careerNeedResult(career,need);
    return String(r?.CLAVE_CONSOLIDACION||need||'').trim();
  }

  function institutionalClusters(){
    const total=analyzedCareers().length;
    const map=new Map();
    analyzedCareers().forEach(c=>{
      careerCandidates(c.name).forEach(can=>{
        const rr=careerNeedResult(c.name,can.NOMBRE_NECESIDAD);
        const label=clusterKeyFor(c.name,can.NOMBRE_NECESIDAD)||can.NOMBRE_NECESIDAD;
        const k=normalized(label);
        if(!k)return;
        if(!map.has(k))map.set(k,{key:k,label,careers:new Set(),needs:[],sources:new Set(),types:new Set(),impacts:new Set()});
        const g=map.get(k);g.careers.add(c.name);g.needs.push(can.NOMBRE_NECESIDAD);
        sourceLabelsForCandidate(c.name,can.NOMBRE_NECESIDAD).forEach(s=>g.sources.add(s));
        if(rr?.TIPO_NECESIDAD)g.types.add(rr.TIPO_NECESIDAD);
        if(can.IMPACTO_ACADEMICO&&normalized(can.IMPACTO_ACADEMICO)!=='pendiente')g.impacts.add(can.IMPACTO_ACADEMICO);
      });
    });
    return [...map.values()].map(g=>{
      const meta=state.results.institutional.needMeta.find(m=>normalized(m.CLAVE_CONSOLIDACION||m.NECESIDAD_INSTITUCIONAL)===g.key)||{};
      return {
        ...g,
        careers:[...g.careers],
        sources:[...g.sources],
        types:[...g.types],
        impacts:[...g.impacts],
        count:g.careers.size,
        percentage:total?Math.round((g.careers.size/total)*10000)/100:0,
        displayName:String(meta.NECESIDAD_INSTITUCIONAL||g.label).trim(),
        presenceLevel:String(meta.NIVEL_PRESENCIA||'').trim(),
        institutionalType:String(meta.TIPO_NECESIDAD||naturalList([...g.types])).trim(),
        institutionalImpact:String(meta.IMPACTO_INSTITUCIONAL||naturalList([...g.impacts])).trim()
      };
    }).sort((a,b)=>b.count-a.count||a.displayName.localeCompare(b.displayName,'es'));
  }

  function recurrentClusters(){return institutionalClusters().filter(g=>g.count>=2);}
  function selectedGeneric(){return state.results.institutional.selection||{};}
  function selectedBaseCluster(){
    const sel=selectedGeneric();
    if(!sel.NECESIDAD_BASE)return null;
    const k=normalized(sel.NECESIDAD_BASE);
    return institutionalClusters().find(g=>g.key===k||normalized(g.displayName)===k||normalized(g.label)===k)||null;
  }
  function selectedAlternative(){return state.results.institutional.alternatives.find(a=>normalized(a.RESULTADO_PRIORIZACION)==='seleccionada')||null;}

  function resultImageHtml(){
    const src=state.results.image;
    return src?`<div class="method-figure"><img src="${src}" alt="Imagen ilustrativa de resultados"></div>`:`<div class="method-figure"><div><strong>Imagen ilustrativa fija de resultados</strong><br><span>Pendiente de configurar en Configuración.</span></div></div>`;
  }

  function htmlTable(counter,title,headers,rows){
    counter.n+=1;
    const th=headers.map(h=>`<th>${esc(h)}</th>`).join('');
    const body=rows.length?rows.map(r=>`<tr>${r.map(c=>`<td>${c==null?'':c}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}" class="empty">Sin datos registrados.</td></tr>`;
    return `<div class="result-table-block"><div class="result-table-title"><strong>Tabla ${counter.n}. ${esc(title)}</strong></div><div class="table-wrap"><table class="institutional-table"><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table></div></div>`;
  }

  function synthesisIntro(){return 'La síntesis general de los resultados del diagnóstico de necesidades de capacitación docente presenta una visión integrada de las principales brechas identificadas en las carreras del Instituto Superior Tecnológico Quito Metropolitano (ITSQMET), a partir del análisis conjunto de encuestas institucionales, reuniones académicas con docentes, revisión de mallas curriculares y Planes de Enseñanza–Aprendizaje, así como del criterio de los coordinadores de carrera. Este análisis permite evidenciar tendencias institucionales, niveles de recurrencia y áreas críticas comunes que inciden directamente en la calidad del proceso de enseñanza-aprendizaje, constituyéndose en un insumo técnico que orienta la toma de decisiones académicas y respalda la planificación institucional posterior, sin implicar aún la ejecución de acciones de capacitación.';}

  function renderResultsHtml(){
    const counter={n:0};
    const careers=analyzedCareers();
    const clusters=institutionalClusters();
    const recurring=recurrentClusters();
    const top=recurring[0]||clusters[0]||null;
    const second=recurring[1]||clusters[1]||null;
    const sources=usedSourceLabels();
    const sel=selectedGeneric();
    const base=selectedBaseCluster();
    let h='<h2>5. Resultados del Diagnóstico</h2>'+resultImageHtml();

    h+='<h3>5.1. Síntesis General de Resultados del Diagnóstico</h3><p>'+esc(synthesisIntro())+'</p>';
    h+='<h4>5.1.1. Panorama institucional de necesidades de capacitación docente</h4>';
    const totalNeeds=careers.reduce((sum,c)=>sum+careerCandidates(c.name).length,0);
    const description=`se analizaron ${careers.length} carrera(s) y se consolidaron ${totalNeeds} necesidades candidatas de capacitación docente`;
    h+=`<p>El análisis institucional de los resultados del diagnóstico de necesidades de capacitación docente del Instituto Superior Tecnológico Quito Metropolitano (ITSQMET) evidencia que ${esc(description)}.</p>`;
    h+=`<p>La integración de los resultados obtenidos a través de <strong>${esc(sources.length?naturalList(sources):'las fuentes disponibles')}</strong> permitió consolidar una visión global de las necesidades de capacitación docente. ${recurring.length?`Se identificaron ${recurring.length} ámbito(s) con recurrencia inter-carreras, principalmente en torno a <strong>${esc(naturalList(recurring.slice(0,5).map(x=>x.displayName)))}</strong>.`:'No se registran todavía ámbitos con recurrencia en más de una carrera.'}</p>`;
    if(top)h+=`<p>Desde una perspectiva agregada, la necesidad con mayor presencia institucional corresponde a <strong>${esc(top.displayName)}</strong>, identificada en ${top.count} de ${careers.length} carrera(s), equivalente a <strong>${pct(top.percentage)}</strong>. Este resultado evidencia una coincidencia inter-carreras sustentada en los datos consolidados del período, sin sustituir los criterios de impacto, pertinencia, alineación y validación definidos en la metodología.</p>`;

    h+='<h4>5.1.2. Criterios aplicados para la consolidación de resultados</h4>';
    const criteria=[
      ['A) Convergencia de resultados entre fuentes de información','Se contrastan los resultados provenientes de las fuentes efectivamente registradas para identificar coincidencias y complementariedades.'],
      ['B) Recurrencia inter-carreras','Se determina en cuántas carreras aparece cada necesidad consolidada y su porcentaje respecto del total de carreras analizadas.'],
      ['C) Impacto académico en la función sustantiva de docencia','Se consideran las valoraciones de impacto registradas durante la priorización por carrera.'],
      ['D) Pertinencia curricular','Se considera la relación de la necesidad con el currículo y los requerimientos específicos de la carrera.'],
      ['E) Coherencia con la planificación institucional','Se revisa la alineación registrada con los instrumentos y criterios institucionales vigentes.'],
      ['F) Validación académica','Se respeta la validación del coordinador exigida para cerrar la necesidad prioritaria por carrera.']
    ];
    criteria.forEach(([t,p])=>h+=`<h5>${esc(t)}</h5><p>${esc(p)}</p>`);
    if(base&&sel.CAPACITACION_GENERICA)h+=`<p>A partir de la aplicación conjunta de estos criterios, se consolidó <strong>${esc(base.displayName)}</strong> como necesidad base de la capacitación genérica institucional <strong>${esc(sel.CAPACITACION_GENERICA)}</strong>, de acuerdo con la selección validada para el período.</p>`;
    else if(top)h+=`<p>Con los datos actualmente registrados, <strong>${esc(top.displayName)}</strong> presenta la mayor recurrencia inter-carreras. La determinación de la capacitación genérica permanece sujeta a la selección institucional validada.</p>`;

    h+='<h4>5.1.3. Identificación de necesidades recurrentes a nivel institucional</h4>';
    if(recurring.length){
      h+='<p>A nivel institucional, las necesidades recurrentes se concentran en los siguientes ámbitos:</p>';
      recurring.forEach((g,i)=>{
        const detail=[`${g.count} de ${careers.length} carrera(s)`,pct(g.percentage),g.sources.length?`respaldada por ${naturalList(g.sources)}`:'sin detalle de fuentes consolidado',g.institutionalType?`tipo: ${g.institutionalType}`:'',g.institutionalImpact?`impacto registrado: ${g.institutionalImpact}`:''].filter(Boolean).join('; ');
        h+=`<h5>${alpha(i)} ${esc(g.displayName)}</h5><p>Esta necesidad presenta una recurrencia institucional de <strong>${pct(g.percentage)}</strong> (${esc(detail)}).</p>`;
      });
    }else h+='<p>No existen todavía necesidades con presencia en más de una carrera; por tanto, la app no fuerza una lista artificial de ámbitos recurrentes.</p>';

    h+='<h3>5.2. Capacitación Genérica Institucional</h3><p>La capacitación genérica institucional se define como una respuesta de alcance transversal, orientada a atender las brechas pedagógicas comunes identificadas en el diagnóstico de necesidades de capacitación docente del Instituto Superior Tecnológico Quito Metropolitano (ITSQMET). Su definición se sustenta en la recurrencia de necesidades compartidas entre las carreras, en su impacto directo sobre la planificación académica y la calidad del proceso de enseñanza-aprendizaje, y en su alineación con los objetivos estratégicos institucionales y los criterios de aseguramiento de la calidad.</p><p>La capacitación genérica institucional constituye un insumo técnico para la planificación posterior del fortalecimiento docente, sin sustituir las capacitaciones específicas por carrera ni implicar todavía acciones de ejecución.</p>';

    h+='<h4>5.2.1. Justificación de la capacitación genérica institucional</h4>';
    if(sel.CAPACITACION_GENERICA&&base){
      const breach=sel.BRECHA_TRANSVERSAL||base.displayName;
      const just=sel.JUSTIFICACION_RESULTADOS||`su presencia en ${base.count} de ${careers.length} carrera(s), equivalente a ${pct(base.percentage)}, junto con las valoraciones institucionales registradas`;
      h+=`<p>Los resultados del diagnóstico institucional evidencian la existencia de <strong>${esc(breach)}</strong>, identificada de manera recurrente en ${base.count} de ${careers.length} carrera(s).</p><p>El análisis consolidado de las fuentes permitió identificar como área prioritaria <strong>${esc(base.displayName)}</strong>, debido a ${esc(just)}.</p><p>La definición de la capacitación genérica institucional <strong>${esc(sel.CAPACITACION_GENERICA)}</strong> responde a la recurrencia, impacto académico, pertinencia y alineación institucional evidenciados en el diagnóstico.</p>`;
    }else h+='<p><em>La capacitación genérica institucional permanece pendiente de selección y validación; la app no incorpora un nombre fijo ni lo deduce automáticamente de una fórmula no definida.</em></p>';

    h+='<h4>5.2.2. Capacitación genérica institucional</h4><h5>A) Necesidades de capacitación consideradas a nivel institucional</h5>';
    const instRows=(recurring.length?recurring:clusters).map(g=>[esc(g.displayName),esc(g.presenceLevel||'Pendiente de validación'),`<span class="num-cell">${pct(g.percentage)}</span>`]);
    h+=htmlTable(counter,'Necesidades a nivel institucional',['Necesidad de capacitación identificada','Presencia institucional','Porcentaje de recurrencia'],instRows);
    if(top){h+=`<p><strong>Interpretación.</strong> La necesidad relacionada con <strong>${esc(top.displayName)}</strong> presenta el mayor nivel de recurrencia institucional, con <strong>${pct(top.percentage)}</strong>${second?`, seguida de <strong>${esc(second.displayName)}</strong> con <strong>${pct(second.percentage)}</strong>`:''}. La categoría cualitativa de presencia solo se muestra cuando ha sido validada institucionalmente.</p>`;}

    h+='<h5>B) Criterios aplicados para la selección de la capacitación genérica</h5>';
    const critRows=RESULT_CRITERIA.map(c=>{const r=state.results.institutional.criteria.find(x=>normalized(x.CRITERIO)===normalized(c));return[esc(c),esc(r?.NIVEL_CUMPLIMIENTO||'Pendiente de validación')];});
    h+=htmlTable(counter,'Criterios para la selección de la capacitación genérica',['Criterio','Nivel de cumplimiento'],critRows);

    h+='<h5>C) Comparación con otras capacitaciones consideradas</h5>';
    h+=htmlTable(counter,'Comparación de capacitaciones consideradas',['Capacitación considerada','Fortalezas','Limitaciones','Resultado'],state.results.institutional.alternatives.map(a=>[esc(a.CAPACITACION_CANDIDATA),esc(a.FORTALEZAS),esc(a.LIMITACIONES),esc(a.RESULTADO_PRIORIZACION)]));

    h+='<h5>D) Resultados cuantitativos que respaldan la selección</h5>';
    if(state.results.institutional.indicators.length){
      h+=htmlTable(counter,'Resultados cuantitativos que respaldan la selección',['Aspecto evaluado','Porcentaje de docentes'],state.results.institutional.indicators.map(i=>[esc(i.ASPECTO_EVALUADO),`<span class="num-cell">${pct(i.PORCENTAJE_DOCENTES)}</span>`]));
    }else h+='<p>No se incorporan indicadores cuantitativos adicionales porque no se han cargado indicadores específicos de la encuesta vinculados a la selección. La app no los fabrica a partir del nombre de la capacitación.</p>';

    h+='<h5>E) Razones técnicas que explican su selección</h5>';
    if(sel.CAPACITACION_GENERICA){
      const valued=state.results.institutional.criteria.filter(c=>String(c.NIVEL_CUMPLIMIENTO||'').trim());
      h+=`<p>La selección de <strong>${esc(sel.CAPACITACION_GENERICA)}</strong> se sustenta en las valoraciones institucionales registradas${valued.length?`: ${esc(valued.map(c=>`${c.CRITERIO}: ${c.NIVEL_CUMPLIMIENTO}`).join('; '))}`:'.'}</p>`;
    }else h+='<p><em>Pendiente de selección institucional.</em></p>';

    h+='<h5>F) Naturaleza institucional de la capacitación seleccionada</h5><p>Una capacitación genérica institucional tiene alcance transversal, no depende exclusivamente de un campo disciplinar, fortalece competencias comunes y complementa las capacitaciones específicas por carrera. Su alcance concreto se determina a partir de la necesidad base seleccionada y de las carreras en las que esta aparece.</p>';
    if(sel.CAPACITACION_GENERICA)h+=`<p>La selección de la capacitación genérica institucional <strong>${esc(sel.CAPACITACION_GENERICA)}</strong> se sustenta en evidencia cuantitativa, análisis cualitativo y criterios institucionales definidos en la metodología del diagnóstico. ${sel.SINTESIS_JUSTIFICACION?esc(sel.SINTESIS_JUSTIFICACION):'Su elección queda registrada como insumo para la elaboración posterior del Plan de Capacitación Docente.'}</p>`;

    h+='<h4>5.2.3. Alcance institucional de la capacitación genérica</h4>';
    if(sel.CAPACITACION_GENERICA&&base){const all=base.count===careers.length&&careers.length>0;h+=`<p>La capacitación genérica institucional <strong>${esc(sel.CAPACITACION_GENERICA)}</strong> se vincula con ${all?'<strong>todas las carreras diagnosticadas</strong>':`<strong>${base.count} de ${careers.length} carreras diagnosticadas</strong>`}, de acuerdo con la presencia de la necesidad base <strong>${esc(base.displayName)}</strong>. La app no afirma alcance total cuando los datos no lo respaldan.</p>`;}else h+='<p><em>Alcance pendiente de determinación.</em></p>';

    h+='<h4>5.2.4. Relación de la capacitación genérica con la mejora de la docencia</h4>';
    const impactFields=[['Planificación',sel.IMPACTO_PLANIFICACION],['Proceso de enseñanza-aprendizaje',sel.IMPACTO_ENSENANZA_APRENDIZAJE],['Resultados de aprendizaje',sel.IMPACTO_RESULTADOS_APRENDIZAJE],['Metodologías',sel.IMPACTO_METODOLOGIAS],['Evaluación',sel.IMPACTO_EVALUACION]].filter(x=>String(x[1]||'').trim());
    if(impactFields.length){h+='<ul class="method-list">'+impactFields.map(([a,v])=>`<li><strong>${esc(a)}:</strong> ${esc(v)}</li>`).join('')+'</ul>';}else h+='<p>No se registraron relaciones específicas de impacto para esta capacitación; la app no incorpora afirmaciones no sustentadas.</p>';

    h+='<h3>5.3. Resultados del Diagnóstico por Carrera</h3><p>Los resultados del diagnóstico de necesidades de capacitación docente por carrera permiten analizar, desde una perspectiva específica, cómo las necesidades identificadas a nivel institucional se manifiestan en los distintos campos disciplinares del Instituto Superior Tecnológico Quito Metropolitano (ITSQMET).</p><p>Este apartado presenta los resultados desagregados por carrera, considerando las particularidades académicas, pedagógicas y profesionales de cada área, sin perder de vista el marco institucional previamente consolidado.</p><p>Para cada carrera, el análisis se estructura en dos componentes: 1) identificación de las principales necesidades de capacitación docente; y 2) vinculación de dichas necesidades con la capacitación genérica institucional definida.</p>';

    careers.forEach((c,idx)=>{
      const candidates=careerCandidates(c.name);
      const link=careerLink(c.name)||{};
      const rrows=candidates.map(can=>({can,res:careerNeedResult(c.name,can.NOMBRE_NECESIDAD)}));
      const areas=nonEmpty(rrows.map(x=>x.res?.TIPO_NECESIDAD));
      h+=`<h4>5.3.${idx+1}. ${esc(c.name)}</h4><h5>5.3.${idx+1}.1. Necesidades identificadas</h5>`;
      const areaText=link.SINTESIS_AREAS_IDENTIFICADAS||naturalList(areas)||'las áreas registradas en el diagnóstico';
      const context=link.CONTEXTO_DISCIPLINAR_PEDAGOGICO||'las particularidades académicas y pedagógicas documentadas para la carrera';
      h+=`<p>El diagnóstico de necesidades de capacitación docente en la carrera de <strong>${esc(c.name)}</strong> evidencia requerimientos relacionados con <strong>${esc(areaText)}</strong>. Estas necesidades responden a ${esc(context)}.</p><p>A partir del análisis de <strong>${esc(naturalList(usedSourceLabels())||'las fuentes efectivamente registradas')}</strong>, se identificaron <strong>${candidates.length}</strong> necesidades de capacitación docente, que se presentan a continuación.</p>`;
      h+=htmlTable(counter,`Necesidades identificadas – ${c.name}`,['N.º','Necesidad de capacitación identificada','Tipo de necesidad','Nivel de recurrencia'],rrows.map((x,i)=>[String(i+1),esc(x.can.NOMBRE_NECESIDAD),esc(x.res?.TIPO_NECESIDAD||'Pendiente'),esc(x.res?.NIVEL_RECURRENCIA||'Pendiente')]));
      h+='<p><strong>Análisis cuantitativo de recurrencia.</strong></p>';
      h+=htmlTable(counter,`Recurrencia de necesidades – ${c.name}`,['Necesidad','Porcentaje de recurrencia'],rrows.map(x=>[esc(x.can.NOMBRE_NECESIDAD),`<span class="num-cell">${pct(x.res?.PORCENTAJE_RECURRENCIA)}</span>`]));
      const comparable=rrows.map(x=>({name:x.can.NOMBRE_NECESIDAD,type:x.res?.TIPO_NECESIDAD,n:num(x.res?.PORCENTAJE_RECURRENCIA)})).filter(x=>x.n!=null).sort((a,b)=>b.n-a.n);
      if(comparable.length){const m=comparable[0];h+=`<p><strong>Interpretación.</strong> La necesidad relacionada con <strong>${esc(m.name)}</strong> presenta el mayor porcentaje de recurrencia registrado, con <strong>${pct(m.n)}</strong>${m.type?`, y se clasifica como <strong>${esc(m.type)}</strong>`:''}. Este resultado cuantitativo no sustituye los demás criterios de priorización ni la validación académica.</p>`;}else h+='<p><strong>Interpretación.</strong> No existe un porcentaje de recurrencia validado suficiente para identificar un máximo cuantitativo.</p>';
      h+='<p><strong>Análisis cualitativo.</strong> ';
      if(link.HALLAZGO_CUALITATIVO_PRINCIPAL){h+=`Desde el análisis cualitativo, se identificó ${esc(link.HALLAZGO_CUALITATIVO_PRINCIPAL)}.${link.HALLAZGO_COMPLEMENTARIO?` Asimismo, se evidenció ${esc(link.HALLAZGO_COMPLEMENTARIO)}`:''}${link.CONTEXTO_CARRERA?`, especialmente en relación con ${esc(link.CONTEXTO_CARRERA)}`:''}.`;}else h+='No se registró una síntesis cualitativa suficiente para redactar afirmaciones adicionales; la app no inventa testimonios ni atribuye expresiones a los docentes.';h+='</p>';

      h+=`<h5>5.3.${idx+1}.2. Vinculación de la capacitación prioritaria con la carrera</h5>`;
      if(link.CAPACITACION_PRIORITARIA)h+=`<p>Con base en los criterios de recurrencia, impacto académico y pertinencia curricular, y respetando la necesidad ganadora validada en la metodología, la capacitación prioritaria para la carrera de <strong>${esc(c.name)}</strong> corresponde a:</p><p class="result-selected">${esc(link.CAPACITACION_PRIORITARIA)}</p>`;else h+='<p><em>Capacitación prioritaria pendiente de registrar.</em></p>';
      h+=htmlTable(counter,`Vinculación de la capacitación prioritaria – ${c.name}`,['Aspecto','Vinculación con la carrera'],[
        ['Perfil de egreso',esc(link.VINCULACION_PERFIL_EGRESO||'Pendiente')],
        ['Competencias declaradas',esc(link.COMPETENCIAS_RELACIONADAS||'Pendiente')],
        ['Impacto en la docencia',esc(link.IMPACTO_DOCENCIA||'Pendiente')],
        ['Pertinencia curricular',esc(link.NIVEL_PERTINENCIA||'Pendiente')],
        ['Alineación institucional',esc(link.ALINEACION_INSTITUCIONAL||'Pendiente')]
      ]);
      h+='<p><strong>Relación con la capacitación genérica institucional.</strong> ';
      if(link.CAPACITACION_PRIORITARIA&&sel.CAPACITACION_GENERICA&&link.TIPO_ARTICULACION_GENERICA&&link.EXPLICACION_RELACION)h+=`La capacitación prioritaria <strong>${esc(link.CAPACITACION_PRIORITARIA)}</strong> se articula de manera <strong>${esc(link.TIPO_ARTICULACION_GENERICA)}</strong> con la capacitación genérica institucional <strong>${esc(sel.CAPACITACION_GENERICA)}</strong>, debido a que ${esc(link.EXPLICACION_RELACION)}.`;else h+='La relación específica permanece pendiente de sustento; la app no genera una articulación genérica por defecto.';h+='</p>';
      if(link.FINALIDAD_CAPACITACION_ESPECIFICA||link.IMPACTO_CONJUNTO){h+=`<p><strong>Síntesis del resultado por carrera.</strong> El diagnóstico evidencia que la carrera de <strong>${esc(c.name)}</strong>${link.FINALIDAD_CAPACITACION_ESPECIFICA?` requiere una capacitación específica orientada a ${esc(link.FINALIDAD_CAPACITACION_ESPECIFICA)}`:' presenta una capacitación específica priorizada'}${sel.CAPACITACION_GENERICA?`, complementada por la capacitación genérica institucional <strong>${esc(sel.CAPACITACION_GENERICA)}</strong>`:''}.${link.IMPACTO_CONJUNTO?` Esta combinación permite ${esc(link.IMPACTO_CONJUNTO)}.`:''}</p>`;}
    });
    return h;
  }

  function resultIssues(){
    const issues=[];
    const careers=analyzedCareers();
    if(!state.results.image)issues.push('Falta la imagen fija de resultados de la Sección 5.');
    careers.forEach(c=>{
      const candidates=careerCandidates(c.name);
      candidates.forEach(can=>{
        const r=careerNeedResult(c.name,can.NOMBRE_NECESIDAD);
        if(!r){issues.push(`${c.name}: falta completar resultados para "${can.NOMBRE_NECESIDAD}".`);return;}
        if(!String(r.TIPO_NECESIDAD||'').trim())issues.push(`${c.name}: falta TIPO_NECESIDAD para "${can.NOMBRE_NECESIDAD}".`);
        const p=num(r.PORCENTAJE_RECURRENCIA);if(p==null||p<0||p>100)issues.push(`${c.name}: porcentaje de recurrencia inválido para "${can.NOMBRE_NECESIDAD}".`);
        if(!String(r.NIVEL_RECURRENCIA||'').trim())issues.push(`${c.name}: falta NIVEL_RECURRENCIA validado para "${can.NOMBRE_NECESIDAD}".`);
      });
      const link=careerLink(c.name);
      if(!link)issues.push(`${c.name}: falta la vinculación de resultados por carrera.`);
      else{
        const winner=winnerForCareer(c.name);
        if(winner&&normalized(link.NECESIDAD_GANADORA)!==normalized(winner.NOMBRE_NECESIDAD))issues.push(`${c.name}: NECESIDAD_GANADORA no coincide con la ganadora validada de la Sección 4.`);
        ['CAPACITACION_PRIORITARIA','VINCULACION_PERFIL_EGRESO','COMPETENCIAS_RELACIONADAS','IMPACTO_DOCENCIA','NIVEL_PERTINENCIA','ALINEACION_INSTITUCIONAL'].forEach(f=>{if(!String(link[f]||'').trim())issues.push(`${c.name}: falta ${f}.`);});
      }
    });
    const recurring=recurrentClusters();
    if(!recurring.length)issues.push('No existen necesidades recurrentes inter-carreras suficientes para determinar la capacitación genérica institucional.');
    recurring.forEach(g=>{if(!g.presenceLevel)issues.push(`Falta NIVEL_PRESENCIA institucional para "${g.displayName}".`);});
    const sel=selectedGeneric(),base=selectedBaseCluster(),alt=selectedAlternative();
    if(!sel.CAPACITACION_GENERICA)issues.push('Falta seleccionar la capacitación genérica institucional.');
    if(!sel.NECESIDAD_BASE||!base)issues.push('La capacitación genérica no tiene una necesidad base válida dentro de la consolidación institucional.');
    if(!alt)issues.push('Debe existir exactamente una alternativa marcada como Seleccionada.');
    else if(sel.CAPACITACION_GENERICA&&normalized(alt.CAPACITACION_CANDIDATA)!==normalized(sel.CAPACITACION_GENERICA))issues.push('La capacitación de la hoja Seleccion no coincide con la alternativa marcada como Seleccionada.');
    const selectedCount=state.results.institutional.alternatives.filter(a=>normalized(a.RESULTADO_PRIORIZACION)==='seleccionada').length;
    if(selectedCount!==1)issues.push(`Debe existir una sola capacitación genérica seleccionada (actual: ${selectedCount}).`);
    RESULT_CRITERIA.forEach(c=>{const r=state.results.institutional.criteria.find(x=>normalized(x.CRITERIO)===normalized(c));if(!String(r?.NIVEL_CUMPLIMIENTO||'').trim())issues.push(`Falta nivel de cumplimiento del criterio: ${c}.`);});
    state.results.institutional.indicators.forEach(i=>{const p=num(i.PORCENTAJE_DOCENTES);if(p==null||p<0||p>100)issues.push(`Indicador cuantitativo inválido: ${i.ASPECTO_EVALUADO||'sin nombre'}.`);});
    return [...new Set(issues)];
  }

  async function readBook(file){const data=await file.arrayBuffer();return XLSX.read(data);}
  function rowsFromSheet(wb,name){const ws=wb.Sheets[name];return ws?XLSX.utils.sheet_to_json(ws,{defval:''}):[];}
  function writeBook(sheets,filename){const wb=XLSX.utils.book_new();sheets.forEach(({name,rows})=>{const ws=XLSX.utils.json_to_sheet(rows);ws['!cols']=Object.keys(rows[0]||{}).map(k=>({wch:Math.min(55,Math.max(15,k.length+3))}));XLSX.utils.book_append_sheet(wb,ws,name);});XLSX.writeFile(wb,filename);}

  function downloadCareerResultsTemplate(){
    const rows=[];
    state.candidates.forEach(can=>{
      const old=careerNeedResult(can.CARRERA,can.NOMBRE_NECESIDAD)||{};
      rows.push({CARRERA:can.CARRERA,NOMBRE_NECESIDAD:can.NOMBRE_NECESIDAD,CLAVE_CONSOLIDACION:old.CLAVE_CONSOLIDACION||can.NOMBRE_NECESIDAD,TIPO_NECESIDAD:old.TIPO_NECESIDAD||'',PORCENTAJE_RECURRENCIA:old.PORCENTAJE_RECURRENCIA??'',NIVEL_RECURRENCIA:old.NIVEL_RECURRENCIA||''});
    });
    if(!rows.length)rows.push({CARRERA:'Ejemplo de carrera',NOMBRE_NECESIDAD:'Necesidad',CLAVE_CONSOLIDACION:'Necesidad consolidada',TIPO_NECESIDAD:'Pedagógica',PORCENTAJE_RECURRENCIA:60,NIVEL_RECURRENCIA:'Validar institucionalmente'});
    writeBook([{name:'Resultados_Carrera',rows}],`Plantilla_Resultados_Por_Carrera_${state.period?.id||'Periodo'}.xlsx`);
  }

  async function importCareerResults(file){
    if(!ensureEditable())return;
    try{
      const wb=await readBook(file),rows=rowsFromSheet(wb,wb.SheetNames[0]),good=[],bad=[];
      rows.forEach((r,idx)=>{
        const career=String(r.CARRERA||'').trim(),need=String(r.NOMBRE_NECESIDAD||'').trim();
        if(!career||!need){bad.push({...r,FILA_EXCEL:idx+2,ERROR:'CARRERA y NOMBRE_NECESIDAD son obligatorios'});return;}
        const candidate=state.candidates.find(c=>keyOf(c.CARRERA,c.NOMBRE_NECESIDAD)===keyOf(career,need));
        if(!candidate){bad.push({...r,FILA_EXCEL:idx+2,ERROR:'La necesidad no existe entre las candidatas de la Sección 4'});return;}
        const p=num(r.PORCENTAJE_RECURRENCIA);
        if(p==null||p<0||p>100){bad.push({...r,FILA_EXCEL:idx+2,ERROR:'PORCENTAJE_RECURRENCIA debe ser un número entre 0 y 100'});return;}
        if(!String(r.TIPO_NECESIDAD||'').trim()||!String(r.NIVEL_RECURRENCIA||'').trim()){bad.push({...r,FILA_EXCEL:idx+2,ERROR:'TIPO_NECESIDAD y NIVEL_RECURRENCIA son obligatorios'});return;}
        good.push({CARRERA:career,NOMBRE_NECESIDAD:need,CLAVE_CONSOLIDACION:String(r.CLAVE_CONSOLIDACION||need).trim(),TIPO_NECESIDAD:String(r.TIPO_NECESIDAD).trim(),PORCENTAJE_RECURRENCIA:p,NIVEL_RECURRENCIA:String(r.NIVEL_RECURRENCIA).trim()});
      });
      const map=new Map(state.results.careerNeeds.map(r=>[keyOf(r.CARRERA,r.NOMBRE_NECESIDAD),r]));good.forEach(r=>map.set(keyOf(r.CARRERA,r.NOMBRE_NECESIDAD),r));state.results.careerNeeds=[...map.values()];saveState();showImportResult('resultsCareerImportResult',good.length,bad,()=>downloadJson(bad,'Corregir','Correccion_Resultados_Por_Carrera.xlsx'));toast(`Resultados por carrera: ${good.length} fila(s) procesada(s).`);
    }catch(e){console.error(e);toast('No se pudo leer la plantilla de resultados por carrera.');}
  }

  function downloadCareerLinksTemplate(){
    const rows=analyzedCareers().map(c=>{
      const old=careerLink(c.name)||{},winner=winnerForCareer(c.name);
      return {CARRERA:c.name,NECESIDAD_GANADORA:winner?.NOMBRE_NECESIDAD||old.NECESIDAD_GANADORA||'',CAPACITACION_PRIORITARIA:old.CAPACITACION_PRIORITARIA||'',SINTESIS_AREAS_IDENTIFICADAS:old.SINTESIS_AREAS_IDENTIFICADAS||'',CONTEXTO_DISCIPLINAR_PEDAGOGICO:old.CONTEXTO_DISCIPLINAR_PEDAGOGICO||'',HALLAZGO_CUALITATIVO_PRINCIPAL:old.HALLAZGO_CUALITATIVO_PRINCIPAL||'',HALLAZGO_COMPLEMENTARIO:old.HALLAZGO_COMPLEMENTARIO||'',CONTEXTO_CARRERA:old.CONTEXTO_CARRERA||'',VINCULACION_PERFIL_EGRESO:old.VINCULACION_PERFIL_EGRESO||'',COMPETENCIAS_RELACIONADAS:old.COMPETENCIAS_RELACIONADAS||'',IMPACTO_DOCENCIA:old.IMPACTO_DOCENCIA||'',NIVEL_PERTINENCIA:old.NIVEL_PERTINENCIA||'',ALINEACION_INSTITUCIONAL:old.ALINEACION_INSTITUCIONAL||'',TIPO_ARTICULACION_GENERICA:old.TIPO_ARTICULACION_GENERICA||'',EXPLICACION_RELACION:old.EXPLICACION_RELACION||'',FINALIDAD_CAPACITACION_ESPECIFICA:old.FINALIDAD_CAPACITACION_ESPECIFICA||'',IMPACTO_CONJUNTO:old.IMPACTO_CONJUNTO||''};
    });
    if(!rows.length)rows.push({CARRERA:'Ejemplo de carrera',NECESIDAD_GANADORA:'Necesidad validada',CAPACITACION_PRIORITARIA:'',SINTESIS_AREAS_IDENTIFICADAS:'',CONTEXTO_DISCIPLINAR_PEDAGOGICO:'',HALLAZGO_CUALITATIVO_PRINCIPAL:'',HALLAZGO_COMPLEMENTARIO:'',CONTEXTO_CARRERA:'',VINCULACION_PERFIL_EGRESO:'',COMPETENCIAS_RELACIONADAS:'',IMPACTO_DOCENCIA:'',NIVEL_PERTINENCIA:'',ALINEACION_INSTITUCIONAL:'',TIPO_ARTICULACION_GENERICA:'',EXPLICACION_RELACION:'',FINALIDAD_CAPACITACION_ESPECIFICA:'',IMPACTO_CONJUNTO:''});
    writeBook([{name:'Vinculacion_Carrera',rows}],`Plantilla_Vinculacion_Por_Carrera_${state.period?.id||'Periodo'}.xlsx`);
  }

  async function importCareerLinks(file){
    if(!ensureEditable())return;
    try{
      const wb=await readBook(file),rows=rowsFromSheet(wb,wb.SheetNames[0]),good=[],bad=[];
      rows.forEach((r,idx)=>{
        const career=String(r.CARRERA||'').trim();if(!sourceRowCareerValid(career)){bad.push({...r,FILA_EXCEL:idx+2,ERROR:'CARRERA no existe o no está activa'});return;}
        const winner=winnerForCareer(career);if(!winner){bad.push({...r,FILA_EXCEL:idx+2,ERROR:'La carrera no tiene necesidad ganadora validada en la Sección 4'});return;}
        if(normalized(r.NECESIDAD_GANADORA)!==normalized(winner.NOMBRE_NECESIDAD)){bad.push({...r,FILA_EXCEL:idx+2,ERROR:'NECESIDAD_GANADORA no coincide con la Sección 4'});return;}
        if(!String(r.CAPACITACION_PRIORITARIA||'').trim()){bad.push({...r,FILA_EXCEL:idx+2,ERROR:'CAPACITACION_PRIORITARIA es obligatoria'});return;}
        const fields=['CARRERA','NECESIDAD_GANADORA','CAPACITACION_PRIORITARIA','SINTESIS_AREAS_IDENTIFICADAS','CONTEXTO_DISCIPLINAR_PEDAGOGICO','HALLAZGO_CUALITATIVO_PRINCIPAL','HALLAZGO_COMPLEMENTARIO','CONTEXTO_CARRERA','VINCULACION_PERFIL_EGRESO','COMPETENCIAS_RELACIONADAS','IMPACTO_DOCENCIA','NIVEL_PERTINENCIA','ALINEACION_INSTITUCIONAL','TIPO_ARTICULACION_GENERICA','EXPLICACION_RELACION','FINALIDAD_CAPACITACION_ESPECIFICA','IMPACTO_CONJUNTO'];
        const clean={};fields.forEach(f=>clean[f]=String(r[f]??'').trim());good.push(clean);
      });
      const map=new Map(state.results.careerLinks.map(r=>[normalized(r.CARRERA),r]));good.forEach(r=>map.set(normalized(r.CARRERA),r));state.results.careerLinks=[...map.values()];saveState();showImportResult('resultsLinksImportResult',good.length,bad,()=>downloadJson(bad,'Corregir','Correccion_Vinculacion_Por_Carrera.xlsx'));toast(`Vinculación por carrera: ${good.length} fila(s) procesada(s).`);
    }catch(e){console.error(e);toast('No se pudo leer la plantilla de vinculación por carrera.');}
  }

  function downloadGenericTemplate(){
    const clusters=institutionalClusters(),oldMeta=state.results.institutional.needMeta;
    const needs=(clusters.length?clusters:[{label:'Necesidad consolidada',displayName:'Necesidad consolidada',count:0,percentage:0,institutionalType:'',institutionalImpact:''}]).map(g=>{
      const old=oldMeta.find(m=>normalized(m.CLAVE_CONSOLIDACION||m.NECESIDAD_INSTITUCIONAL)===normalized(g.label))||{};
      return {CLAVE_CONSOLIDACION:g.label,NECESIDAD_INSTITUCIONAL:old.NECESIDAD_INSTITUCIONAL||g.displayName,CARRERAS_EN_QUE_APARECE:g.count,PORCENTAJE_RECURRENCIA:g.percentage,NIVEL_PRESENCIA:old.NIVEL_PRESENCIA||'',TIPO_NECESIDAD:old.TIPO_NECESIDAD||g.institutionalType||'',IMPACTO_INSTITUCIONAL:old.IMPACTO_INSTITUCIONAL||g.institutionalImpact||''};
    });
    const alternatives=state.results.institutional.alternatives.length?state.results.institutional.alternatives:clusters.map(g=>({CAPACITACION_CANDIDATA:'',NECESIDAD_BASE:g.displayName,FORTALEZAS:'',LIMITACIONES:'',RESULTADO_PRIORIZACION:'No priorizada'}));
    if(!alternatives.length)alternatives.push({CAPACITACION_CANDIDATA:'',NECESIDAD_BASE:'',FORTALEZAS:'',LIMITACIONES:'',RESULTADO_PRIORIZACION:'No priorizada'});
    const criteria=RESULT_CRITERIA.map(c=>{const old=state.results.institutional.criteria.find(x=>normalized(x.CRITERIO)===normalized(c));return{CRITERIO:c,NIVEL_CUMPLIMIENTO:old?.NIVEL_CUMPLIMIENTO||''};});
    const indicators=state.results.institutional.indicators.length?state.results.institutional.indicators:[{ASPECTO_EVALUADO:'',PORCENTAJE_DOCENTES:''}];
    const selection=[{...defaultResults().institutional.selection,...state.results.institutional.selection}];
    writeBook([{name:'Necesidades_Institucionales',rows:needs},{name:'Capacitaciones_Candidatas',rows:alternatives},{name:'Criterios',rows:criteria},{name:'Indicadores_Encuesta',rows:indicators},{name:'Seleccion',rows:selection}],`Plantilla_Capacitacion_Generica_${state.period?.id||'Periodo'}.xlsx`);
  }

  async function importGeneric(file){
    if(!ensureEditable())return;
    try{
      const wb=await readBook(file),bad=[];
      const known=institutionalClusters();
      const needs=rowsFromSheet(wb,'Necesidades_Institucionales').map((r,idx)=>{
        const key=String(r.CLAVE_CONSOLIDACION||r.NECESIDAD_INSTITUCIONAL||'').trim();const match=known.find(g=>normalized(g.label)===normalized(key)||normalized(g.displayName)===normalized(key));
        if(!key||!match){bad.push({...r,HOJA:'Necesidades_Institucionales',FILA_EXCEL:idx+2,ERROR:'CLAVE_CONSOLIDACION no corresponde a una necesidad consolidada actual'});return null;}
        return{CLAVE_CONSOLIDACION:match.label,NECESIDAD_INSTITUCIONAL:String(r.NECESIDAD_INSTITUCIONAL||match.displayName).trim(),NIVEL_PRESENCIA:String(r.NIVEL_PRESENCIA||'').trim(),TIPO_NECESIDAD:String(r.TIPO_NECESIDAD||'').trim(),IMPACTO_INSTITUCIONAL:String(r.IMPACTO_INSTITUCIONAL||'').trim()};
      }).filter(Boolean);
      const alternatives=rowsFromSheet(wb,'Capacitaciones_Candidatas').map((r,idx)=>{
        const name=String(r.CAPACITACION_CANDIDATA||'').trim();if(!name)return null;const base=String(r.NECESIDAD_BASE||'').trim();if(!base){bad.push({...r,HOJA:'Capacitaciones_Candidatas',FILA_EXCEL:idx+2,ERROR:'NECESIDAD_BASE es obligatoria'});return null;}return{CAPACITACION_CANDIDATA:name,NECESIDAD_BASE:base,FORTALEZAS:String(r.FORTALEZAS||'').trim(),LIMITACIONES:String(r.LIMITACIONES||'').trim(),RESULTADO_PRIORIZACION:String(r.RESULTADO_PRIORIZACION||'No priorizada').trim()};
      }).filter(Boolean);
      const criteria=rowsFromSheet(wb,'Criterios').map(r=>({CRITERIO:String(r.CRITERIO||'').trim(),NIVEL_CUMPLIMIENTO:String(r.NIVEL_CUMPLIMIENTO||'').trim()})).filter(r=>r.CRITERIO);
      const indicators=rowsFromSheet(wb,'Indicadores_Encuesta').map((r,idx)=>{const aspect=String(r.ASPECTO_EVALUADO||'').trim();if(!aspect)return null;const p=num(r.PORCENTAJE_DOCENTES);if(p==null||p<0||p>100){bad.push({...r,HOJA:'Indicadores_Encuesta',FILA_EXCEL:idx+2,ERROR:'PORCENTAJE_DOCENTES debe estar entre 0 y 100'});return null;}return{ASPECTO_EVALUADO:aspect,PORCENTAJE_DOCENTES:p};}).filter(Boolean);
      const sr=rowsFromSheet(wb,'Seleccion')[0]||{};const selection={};Object.keys(defaultResults().institutional.selection).forEach(f=>selection[f]=String(sr[f]??'').trim());
      state.results.institutional.needMeta=needs;state.results.institutional.alternatives=alternatives;state.results.institutional.criteria=criteria.length?criteria:defaultResults().institutional.criteria;state.results.institutional.indicators=indicators;state.results.institutional.selection=selection;saveState();
      showImportResult('resultsGenericImportResult',needs.length+alternatives.length+criteria.length+indicators.length,bad,()=>downloadJson(bad,'Corregir','Correccion_Capacitacion_Generica.xlsx'));toast('Configuración de capacitación genérica procesada.');
    }catch(e){console.error(e);toast('No se pudo leer la plantilla de capacitación genérica.');}
  }

  function handleResultImage(file){
    if(!ensureEditable()||!file)return;const reader=new FileReader();reader.onload=()=>{state.results.image=reader.result;saveState();toast('Imagen de resultados guardada.');};reader.readAsDataURL(file);
  }

  function renderResultsUi(){
    ensureResultsState();
    const careers=analyzedCareers(),clusters=institutionalClusters(),recurring=recurrentClusters(),sel=selectedGeneric();
    const byId=id=>document.getElementById(id);
    if(byId('resultsCareersCount'))byId('resultsCareersCount').textContent=careers.length;
    if(byId('resultsNeedsCount'))byId('resultsNeedsCount').textContent=`${state.results.careerNeeds.length}/${state.candidates.length}`;
    if(byId('resultsRecurringCount'))byId('resultsRecurringCount').textContent=recurring.length;
    if(byId('resultsGenericName'))byId('resultsGenericName').textContent=sel.CAPACITACION_GENERICA||'Pendiente';
    if(byId('resultsPreview'))byId('resultsPreview').innerHTML=renderResultsHtml();
    if(byId('resultsInstitutionalBody')){
      const list=recurring.length?recurring:clusters;
      byId('resultsInstitutionalBody').innerHTML=list.length?list.map(g=>`<tr><td>${esc(g.displayName)}</td><td>${g.count} de ${careers.length}</td><td>${pct(g.percentage)}</td><td>${esc(g.presenceLevel||'Pendiente')}</td></tr>`).join(''):'<tr><td colspan="4" class="empty">Sin consolidación institucional disponible.</td></tr>';
    }
    const issues=resultIssues();if(byId('resultsIssues'))byId('resultsIssues').innerHTML=issues.length?`<div class="info-box"><strong>${issues.length} pendiente(s) para aprobar:</strong><br>${issues.slice(0,8).map(esc).join('<br>')}${issues.length>8?'<br>…':''}</div>`:'<div class="info-box">Sección 5 completa para aprobación.</div>';
    if(byId('resultsImagePreview'))byId('resultsImagePreview').innerHTML=state.results.image?`<img src="${state.results.image}" alt="Imagen de resultados">`:'Sin imagen configurada';
  }

  const baseValidate=validateDncForFinal;
  validateDncForFinal=function(){return [...new Set([...baseValidate(),...resultIssues()])];};

  const baseRenderAll=renderAll;
  renderAll=function(){baseRenderAll();renderResultsUi();const c=document.getElementById('implementedSectionsCount');if(c)c.textContent='5';};

  const baseNavigate=navigate;
  navigate=function(view){baseNavigate(view);if(view==='dnc-resultados')document.getElementById('pageTitle').textContent='DNC · Resultados del Diagnóstico';};

  const baseBuildPrint=buildPrintDocument;
  buildPrintDocument=function(){return baseBuildPrint()+`<section class="doc-content doc-page">${renderResultsHtml()}</section>`;};

  function pdfEnsure(doc,y,needed=10){if(y+needed>280){doc.addPage();return 18;}return y;}
  function pdfTable(doc,title,headers,rows,y,widths){
    y=pdfEnsure(doc,y,18);y=writeParagraph(doc,title,y);const x=15,total=180;const ws=widths&&widths.length===headers.length?widths:headers.map(()=>total/headers.length);const line=4.1,pad=2;
    const drawHeader=()=>{let max=8;const lines=headers.map((h,i)=>{const l=doc.splitTextToSize(String(h),ws[i]-pad*2);max=Math.max(max,l.length*line+pad*2);return l;});y=pdfEnsure(doc,y,max);let cx=x;doc.setFillColor(15,39,71);doc.setDrawColor(80);headers.forEach((h,i)=>{doc.rect(cx,y,ws[i],max,'FD');doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text(lines[i],cx+pad,y+pad+3);cx+=ws[i];});doc.setTextColor(0);y+=max;};
    drawHeader();
    rows.forEach(row=>{const cells=row.map((v,i)=>doc.splitTextToSize(String(v??''),ws[i]-pad*2));const rh=Math.max(8,...cells.map(l=>l.length*line+pad*2));if(y+rh>280){doc.addPage();y=18;drawHeader();}let cx=x;cells.forEach((lines,i)=>{doc.setDrawColor(110);doc.rect(cx,y,ws[i],rh);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(lines,cx+pad,y+pad+3);cx+=ws[i];});y+=rh;});return y+4;
  }

  function writeResultsPdf(doc){
    const careers=analyzedCareers(),clusters=institutionalClusters(),recurring=recurrentClusters(),top=recurring[0]||clusters[0]||null,second=recurring[1]||clusters[1]||null,sel=selectedGeneric(),base=selectedBaseCluster();let tableNo=0,y=20;
    y=writeHeading(doc,'5. Resultados del Diagnóstico',2,y);y=addImageBlock(doc,state.results.image,y);
    y=writeHeading(doc,'5.1. Síntesis General de Resultados del Diagnóstico',3,y);y=writeParagraph(doc,synthesisIntro(),y);
    y=writeHeading(doc,'5.1.1. Panorama institucional de necesidades de capacitación docente',4,y);const totalNeeds=careers.reduce((s,c)=>s+careerCandidates(c.name).length,0);y=writeParagraph(doc,`El análisis institucional evidencia que se analizaron ${careers.length} carrera(s) y se consolidaron ${totalNeeds} necesidades candidatas de capacitación docente.`,y);if(recurring.length)y=writeParagraph(doc,`Se identificaron ${recurring.length} ámbito(s) con recurrencia inter-carreras, principalmente en torno a ${naturalList(recurring.slice(0,5).map(x=>x.displayName))}.`,y);if(top)y=writeParagraph(doc,`La necesidad con mayor presencia institucional corresponde a ${top.displayName}, identificada en ${top.count} de ${careers.length} carrera(s), equivalente a ${pct(top.percentage)}.`,y);
    y=writeHeading(doc,'5.1.2. Criterios aplicados para la consolidación de resultados',4,y);['A) Convergencia de resultados entre fuentes de información.','B) Recurrencia inter-carreras.','C) Impacto académico en la función sustantiva de docencia.','D) Pertinencia curricular.','E) Coherencia con la planificación institucional.','F) Validación académica.'].forEach(t=>y=writeParagraph(doc,t,y));if(base&&sel.CAPACITACION_GENERICA)y=writeParagraph(doc,`La necesidad base ${base.displayName} sustenta la capacitación genérica institucional ${sel.CAPACITACION_GENERICA}, de acuerdo con la selección validada para el período.`,y);
    y=writeHeading(doc,'5.1.3. Identificación de necesidades recurrentes a nivel institucional',4,y);if(recurring.length)recurring.forEach((g,i)=>{y=writeHeading(doc,`${alpha(i)} ${g.displayName}`,4,y);y=writeParagraph(doc,`Se registra en ${g.count} de ${careers.length} carrera(s), equivalente a ${pct(g.percentage)}${g.sources.length?`, con evidencia proveniente de ${naturalList(g.sources)}`:''}.`,y);});else y=writeParagraph(doc,'No se registran todavía necesidades con presencia en más de una carrera.',y);

    y=writeHeading(doc,'5.2. Capacitación Genérica Institucional',3,y);y=writeParagraph(doc,'La capacitación genérica institucional se define como una respuesta de alcance transversal, orientada a atender las brechas pedagógicas comunes identificadas en el diagnóstico. Su definición se sustenta en la recurrencia, impacto académico, pertinencia y alineación institucional, y constituye un insumo para la planificación posterior.',y);
    y=writeHeading(doc,'5.2.1. Justificación de la capacitación genérica institucional',4,y);if(sel.CAPACITACION_GENERICA&&base){y=writeParagraph(doc,`Los resultados evidencian la existencia de ${sel.BRECHA_TRANSVERSAL||base.displayName}, identificada en ${base.count} de ${careers.length} carrera(s).`,y);y=writeParagraph(doc,`La capacitación genérica institucional ${sel.CAPACITACION_GENERICA} responde a la necesidad base ${base.displayName} y a los criterios institucionales registrados.`,y);}else y=writeParagraph(doc,'La capacitación genérica institucional permanece pendiente de selección y validación.',y);
    y=writeHeading(doc,'5.2.2. Capacitación genérica institucional',4,y);y=writeHeading(doc,'A) Necesidades de capacitación consideradas a nivel institucional',4,y);tableNo++;y=pdfTable(doc,`Tabla ${tableNo}. Necesidades a nivel institucional`,['Necesidad','Presencia','%'],(recurring.length?recurring:clusters).map(g=>[g.displayName,g.presenceLevel||'Pendiente',pct(g.percentage)]),y,[105,40,35]);if(top)y=writeParagraph(doc,`La necesidad ${top.displayName} presenta el mayor nivel de recurrencia institucional con ${pct(top.percentage)}${second?`, seguida de ${second.displayName} con ${pct(second.percentage)}`:''}.`,y);
    y=writeHeading(doc,'B) Criterios aplicados para la selección de la capacitación genérica',4,y);tableNo++;y=pdfTable(doc,`Tabla ${tableNo}. Criterios para la selección de la capacitación genérica`,['Criterio','Nivel'],RESULT_CRITERIA.map(c=>{const r=state.results.institutional.criteria.find(x=>normalized(x.CRITERIO)===normalized(c));return[c,r?.NIVEL_CUMPLIMIENTO||'Pendiente'];}),y,[135,45]);
    y=writeHeading(doc,'C) Comparación con otras capacitaciones consideradas',4,y);tableNo++;y=pdfTable(doc,`Tabla ${tableNo}. Comparación de capacitaciones consideradas`,['Capacitación','Fortalezas','Limitaciones','Resultado'],state.results.institutional.alternatives.map(a=>[a.CAPACITACION_CANDIDATA,a.FORTALEZAS,a.LIMITACIONES,a.RESULTADO_PRIORIZACION]),y,[55,48,47,30]);
    y=writeHeading(doc,'D) Resultados cuantitativos que respaldan la selección',4,y);if(state.results.institutional.indicators.length){tableNo++;y=pdfTable(doc,`Tabla ${tableNo}. Resultados cuantitativos que respaldan la selección`,['Aspecto evaluado','% docentes'],state.results.institutional.indicators.map(i=>[i.ASPECTO_EVALUADO,pct(i.PORCENTAJE_DOCENTES)]),y,[145,35]);}else y=writeParagraph(doc,'No se incorporan indicadores cuantitativos adicionales porque no han sido cargados indicadores específicos vinculados a la selección.',y);
    y=writeHeading(doc,'E) Razones técnicas que explican su selección',4,y);if(sel.CAPACITACION_GENERICA)y=writeParagraph(doc,`La selección de ${sel.CAPACITACION_GENERICA} se sustenta en las valoraciones institucionales registradas y en la consolidación de la necesidad base.`,y);else y=writeParagraph(doc,'Selección pendiente.',y);
    y=writeHeading(doc,'F) Naturaleza institucional de la capacitación seleccionada',4,y);y=writeParagraph(doc,'La capacitación genérica tiene alcance transversal, no depende exclusivamente de un campo disciplinar, fortalece competencias comunes y complementa las capacitaciones específicas.',y);
    y=writeHeading(doc,'5.2.3. Alcance institucional de la capacitación genérica',4,y);if(sel.CAPACITACION_GENERICA&&base)y=writeParagraph(doc,`La capacitación ${sel.CAPACITACION_GENERICA} se vincula con ${base.count===careers.length&&careers.length?'todas las carreras diagnosticadas':`${base.count} de ${careers.length} carreras diagnosticadas`}.`,y);else y=writeParagraph(doc,'Alcance pendiente de determinación.',y);
    y=writeHeading(doc,'5.2.4. Relación de la capacitación genérica con la mejora de la docencia',4,y);const impacts=[['Planificación',sel.IMPACTO_PLANIFICACION],['Proceso de enseñanza-aprendizaje',sel.IMPACTO_ENSENANZA_APRENDIZAJE],['Resultados de aprendizaje',sel.IMPACTO_RESULTADOS_APRENDIZAJE],['Metodologías',sel.IMPACTO_METODOLOGIAS],['Evaluación',sel.IMPACTO_EVALUACION]].filter(x=>String(x[1]||'').trim());if(impacts.length)y=writeBulletList(doc,impacts.map(([a,v])=>`${a}: ${v}`),y);else y=writeParagraph(doc,'No se registraron relaciones específicas de impacto para esta capacitación.',y);

    y=writeHeading(doc,'5.3. Resultados del Diagnóstico por Carrera',3,y);y=writeParagraph(doc,'Los resultados por carrera presentan las necesidades identificadas y la vinculación de la capacitación prioritaria con cada campo disciplinar, manteniendo una única plantilla repetible para todas las carreras analizadas.',y);
    careers.forEach((c,idx)=>{
      y=pdfEnsure(doc,y,16);y=writeHeading(doc,`5.3.${idx+1}. ${c.name}`,4,y);y=writeHeading(doc,`5.3.${idx+1}.1. Necesidades identificadas`,4,y);const candidates=careerCandidates(c.name),link=careerLink(c.name)||{},rrows=candidates.map(can=>({can,res:careerNeedResult(c.name,can.NOMBRE_NECESIDAD)}));y=writeParagraph(doc,`Se identificaron ${candidates.length} necesidades de capacitación docente a partir de las fuentes registradas para la carrera.`,y);tableNo++;y=pdfTable(doc,`Tabla ${tableNo}. Necesidades identificadas – ${c.name}`,['N.º','Necesidad','Tipo','Nivel recurrencia'],rrows.map((x,i)=>[i+1,x.can.NOMBRE_NECESIDAD,x.res?.TIPO_NECESIDAD||'Pendiente',x.res?.NIVEL_RECURRENCIA||'Pendiente']),y,[12,92,40,36]);tableNo++;y=pdfTable(doc,`Tabla ${tableNo}. Recurrencia de necesidades – ${c.name}`,['Necesidad','%'],rrows.map(x=>[x.can.NOMBRE_NECESIDAD,pct(x.res?.PORCENTAJE_RECURRENCIA)]),y,[145,35]);const comparable=rrows.map(x=>({name:x.can.NOMBRE_NECESIDAD,n:num(x.res?.PORCENTAJE_RECURRENCIA)})).filter(x=>x.n!=null).sort((a,b)=>b.n-a.n);if(comparable.length)y=writeParagraph(doc,`La necesidad ${comparable[0].name} presenta el mayor porcentaje de recurrencia registrado, con ${pct(comparable[0].n)}. Este resultado no sustituye los demás criterios de priorización.`,y);if(link.HALLAZGO_CUALITATIVO_PRINCIPAL)y=writeParagraph(doc,`Análisis cualitativo: ${link.HALLAZGO_CUALITATIVO_PRINCIPAL}${link.HALLAZGO_COMPLEMENTARIO?`. ${link.HALLAZGO_COMPLEMENTARIO}`:''}${link.CONTEXTO_CARRERA?` En relación con ${link.CONTEXTO_CARRERA}`:''}.`,y);else y=writeParagraph(doc,'Análisis cualitativo: no se registró una síntesis suficiente para formular afirmaciones adicionales.',y);
      y=writeHeading(doc,`5.3.${idx+1}.2. Vinculación de la capacitación prioritaria con la carrera`,4,y);if(link.CAPACITACION_PRIORITARIA)y=writeParagraph(doc,`La capacitación prioritaria para la carrera de ${c.name} corresponde a: ${link.CAPACITACION_PRIORITARIA}.`,y);else y=writeParagraph(doc,'Capacitación prioritaria pendiente de registrar.',y);tableNo++;y=pdfTable(doc,`Tabla ${tableNo}. Vinculación de la capacitación prioritaria – ${c.name}`,['Aspecto','Vinculación con la carrera'],[['Perfil de egreso',link.VINCULACION_PERFIL_EGRESO||'Pendiente'],['Competencias declaradas',link.COMPETENCIAS_RELACIONADAS||'Pendiente'],['Impacto en la docencia',link.IMPACTO_DOCENCIA||'Pendiente'],['Pertinencia curricular',link.NIVEL_PERTINENCIA||'Pendiente'],['Alineación institucional',link.ALINEACION_INSTITUCIONAL||'Pendiente']],y,[55,125]);if(link.CAPACITACION_PRIORITARIA&&sel.CAPACITACION_GENERICA&&link.TIPO_ARTICULACION_GENERICA&&link.EXPLICACION_RELACION)y=writeParagraph(doc,`La capacitación prioritaria ${link.CAPACITACION_PRIORITARIA} se articula de manera ${link.TIPO_ARTICULACION_GENERICA} con la capacitación genérica ${sel.CAPACITACION_GENERICA}, debido a que ${link.EXPLICACION_RELACION}.`,y);
    });
  }

  downloadPdf=function(){
    if(!jsPDF)return toast('No se cargó el generador PDF.');const errors=validateDncForFinal();if(errors.length&&state.dncStatus!=='approved')toast(`PDF de trabajo: ${errors[0]}`);const doc=new jsPDF({unit:'mm',format:'a4',orientation:'portrait'});drawCover(doc);doc.addPage();writeIntroPdf(doc);doc.addPage();writeLegalPdf(doc);doc.addPage();writeAlignmentPdf(doc);doc.addPage();writeMethodPdf(doc);doc.addPage();writeResultsPdf(doc);doc.save(`DNC_ITSQMET_${state.period?`${state.period.start}_${state.period.end}`:'BORRADOR'}.pdf`);
  };

  function replaceDownloadListener(id){const old=document.getElementById(id);if(!old)return;const clone=old.cloneNode(true);old.replaceWith(clone);clone.addEventListener('click',downloadPdf);}

  function bindResultsEvents(){
    document.getElementById('downloadCareerResultsTemplateBtn')?.addEventListener('click',downloadCareerResultsTemplate);
    document.getElementById('careerResultsFileInput')?.addEventListener('change',e=>e.target.files[0]&&importCareerResults(e.target.files[0]));
    document.getElementById('downloadCareerLinksTemplateBtn')?.addEventListener('click',downloadCareerLinksTemplate);
    document.getElementById('careerLinksFileInput')?.addEventListener('change',e=>e.target.files[0]&&importCareerLinks(e.target.files[0]));
    document.getElementById('downloadGenericTemplateBtn')?.addEventListener('click',downloadGenericTemplate);
    document.getElementById('genericFileInput')?.addEventListener('change',e=>e.target.files[0]&&importGeneric(e.target.files[0]));
    document.getElementById('previewResultsBtn')?.addEventListener('click',openPreview);
    document.getElementById('resultsImageInput')?.addEventListener('change',e=>e.target.files[0]&&handleResultImage(e.target.files[0]));
    document.getElementById('removeResultsImageBtn')?.addEventListener('click',()=>{if(!ensureEditable())return;state.results.image=null;saveState();});
    replaceDownloadListener('downloadDncBtn');replaceDownloadListener('downloadFromPreviewBtn');
  }

  bindResultsEvents();
  renderAll();
})();
