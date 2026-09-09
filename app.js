const STORAGE_KEY = 'doc-capa-state-v1';
const { jsPDF } = window.jspdf || {};

const state = loadState();

const INTRO = {
  justification: [
    'La detección de necesidades de capacitación docente constituye un proceso estratégico fundamental para garantizar la calidad de la docencia y la mejora continua de los procesos académicos en el Instituto Superior Tecnológico Quito Metropolitano (ITSQMET). En un contexto de transformación constante de la educación superior tecnológica, caracterizado por la incorporación de nuevas metodologías, enfoques pedagógicos y exigencias del entorno profesional, resulta imprescindible identificar de manera sistemática y fundamentada las brechas de capacitación del cuerpo docente.',
    'El presente informe se justifica como un instrumento técnico-diagnóstico que permite reconocer, analizar y priorizar las necesidades reales de capacitación docente, a partir de evidencia institucional y del criterio académico de los actores directamente involucrados en los procesos formativos. Este diagnóstico se sustenta en el análisis del criterio de los coordinadores de carrera, las reuniones académicas mantenidas con los docentes y los resultados de encuestas institucionales aplicadas, lo que garantiza una aproximación contextualizada y alineada con la realidad académica de cada carrera.',
    'Asimismo, la detección de necesidades de capacitación docente responde a la necesidad de fortalecer el desempeño pedagógico en la función sustantiva de docencia, asegurando la coherencia entre los perfiles de egreso, los resultados de aprendizaje, la planificación académica y las demandas actuales del entorno educativo y profesional. La identificación de múltiples necesidades por carrera, así como la priorización de una necesidad ganadora, permite orientar de manera objetiva y estratégica las futuras acciones institucionales de capacitación docente.',
    'Desde una perspectiva de gestión académica, este informe constituye una base técnica indispensable para la toma de decisiones institucionales, la planificación del Plan Operativo Anual (POA) y la posterior formulación del Plan de Capacitación Docente, sin anticipar ni definir acciones de ejecución. De esta manera, la detección se posiciona como un insumo previo, autónomo y necesario, que respalda la planificación institucional y fortalece los procesos de aseguramiento de la calidad educativa.',
    'Finalmente, este documento se justifica también como evidencia institucional ante los procesos de evaluación externa, al demostrar que el ITSQMET desarrolla procesos sistemáticos, participativos y fundamentados para identificar las necesidades de capacitación docente, en coherencia con los criterios del modelo de evaluación de la educación superior y con los lineamientos de mejora continua de la docencia.'
  ],
  contextIntro: [
    'El contexto en el que se desarrolla la educación superior tecnológica presenta transformaciones profundas y sostenidas que inciden directamente en la práctica docente y en la gestión académica institucional. Estas transformaciones configuran nuevos escenarios formativos que demandan procesos sistemáticos de análisis y actualización del desempeño docente, particularmente en la función sustantiva de docencia.',
    'En el Instituto Superior Tecnológico Quito Metropolitano (ITSQMET), dichas transformaciones se expresan en la diversidad de carreras, campos profesionales y modalidades formativas, así como en la necesidad de garantizar la coherencia entre los perfiles de egreso, los resultados de aprendizaje y las estrategias pedagógicas aplicadas en el aula. En este marco, la detección de necesidades de capacitación docente se justifica como una respuesta institucional a los cambios del entorno educativo y profesional.',
    'A continuación, se describen los principales ejes que caracterizan el contexto institucional y las transformaciones educativas relevantes para el presente diagnóstico.'
  ],
  transformations: [
    ['1.3.1. Transformaciones pedagógicas en la docencia', [
      'La evolución de los enfoques educativos ha impulsado una transición progresiva desde modelos tradicionales de enseñanza hacia enfoques centrados en el desarrollo de competencias y en el aprendizaje activo del estudiante. Este cambio exige que el docente incorpore metodologías que promuevan la participación, el pensamiento crítico y la aplicación práctica de los conocimientos, así como sistemas de evaluación coherentes con los resultados de aprendizaje declarados.',
      'Estas transformaciones demandan un fortalecimiento continuo de las capacidades pedagógicas del docente, particularmente en la planificación didáctica, la selección de estrategias metodológicas y la evaluación del aprendizaje.'
    ]],
    ['1.3.2. Incorporación de tecnologías y entornos digitales', [
      'El uso de tecnologías educativas y recursos digitales se ha consolidado como un componente estructural del proceso de enseñanza-aprendizaje. Plataformas virtuales, recursos interactivos y herramientas digitales forman parte del entorno académico cotidiano, lo que requiere que los docentes desarrollen competencias para su integración pedagógica efectiva, más allá del uso instrumental de la tecnología.',
      'Este escenario plantea la necesidad de identificar brechas en el dominio y aplicación de herramientas digitales, así como en su articulación con los objetivos formativos de cada carrera.'
    ]],
    ['1.3.3. Cambios en el perfil del estudiantado', [
      'El estudiantado del ITSQMET presenta características cada vez más heterogéneas en términos de trayectorias educativas, contextos socioculturales y niveles de preparación académica. Esta diversidad implica nuevos retos para la docencia, especialmente en la adaptación de estrategias metodológicas, la atención a distintos ritmos de aprendizaje y la implementación de enfoques inclusivos.',
      'En este contexto, el fortalecimiento de la capacidad docente para responder a la diversidad estudiantil se convierte en un elemento clave para garantizar la calidad y pertinencia de la formación tecnológica.'
    ]],
    ['1.3.4. Exigencias del aseguramiento de la calidad', [
      'El sistema de aseguramiento de la calidad de la educación superior establece criterios y estándares orientados a garantizar procesos formativos planificados, evaluables y en mejora continua. Estos requerimientos refuerzan la necesidad de contar con diagnósticos institucionales que permitan identificar, con evidencia, las necesidades de capacitación docente y sustentar las decisiones académicas.',
      'La detección de necesidades de capacitación se inscribe, por tanto, en una lógica de cumplimiento normativo y fortalecimiento institucional, alineada con los procesos de planificación académica y los mecanismos de evaluación externa.'
    ]],
    ['1.3.5. Implicaciones institucionales para la docencia', [
      'Las transformaciones descritas generan implicaciones directas para la docencia en el ITSQMET, entre las que se destacan la necesidad de actualización pedagógica permanente, la articulación entre teoría y práctica, y el fortalecimiento de competencias docentes alineadas con los perfiles de egreso de las carreras.',
      'En este marco, el presente diagnóstico se orienta a identificar de manera estructurada las necesidades de capacitación docente, como un insumo técnico que permita responder de forma pertinente a las transformaciones educativas y fortalecer la calidad del proceso formativo institucional.'
    ]]
  ],
  objectivesIntro: [
    'El presente diagnóstico de necesidades de capacitación docente tiene como finalidad orientar de manera técnica y fundamentada la identificación de las brechas existentes en la función sustantiva de docencia del Instituto Superior Tecnológico Quito Metropolitano (ITSQMET). A través de este proceso, se busca generar información confiable y contextualizada que sirva como insumo para la toma de decisiones académicas y la planificación institucional, sin anticipar acciones de ejecución.',
    'Los objetivos del diagnóstico se estructuran en un objetivo general y un conjunto de objetivos específicos, los cuales permiten delimitar el alcance del análisis y garantizar la coherencia del proceso de detección.'
  ],
  generalObjective: 'Identificar, analizar y priorizar las necesidades de capacitación docente en las carreras ofertadas por el Instituto Superior Tecnológico Quito Metropolitano (ITSQMET), en el marco de la función sustantiva de docencia, a partir del criterio de los coordinadores de carrera, las reuniones académicas con los docentes y los resultados de encuestas institucionales, con el fin de generar un insumo técnico que sustente la planificación académica y la formulación posterior del Plan de Capacitación Docente.',
  specificObjectives: [
    'Identificar las principales necesidades de capacitación docente en cada carrera, considerando múltiples requerimientos asociados a la práctica pedagógica y al desarrollo del proceso de enseñanza-aprendizaje.',
    'Analizar las necesidades detectadas a partir de información cualitativa y cuantitativa obtenida mediante el criterio de los coordinadores de carrera, reuniones académicas con los docentes y encuestas institucionales aplicadas.',
    'Priorizar una necesidad de capacitación ganadora por carrera, en función de su impacto en la mejora de la docencia, su recurrencia y su alineación con los requerimientos académicos institucionales.',
    'Reconocer necesidades de capacitación comunes entre carreras, con el propósito de identificar tendencias institucionales y posibles líneas transversales de fortalecimiento docente.',
    'Generar una base técnica y documentada que sirva como insumo para la planificación del Plan Operativo Anual (POA) y para la elaboración posterior del Plan de Capacitación Docente, garantizando la coherencia con los procesos de aseguramiento de la calidad.'
  ]
};

const LEGAL = {
  intro: [
    'La detección de necesidades de capacitación docente del Instituto Superior Tecnológico Quito Metropolitano (ITSQMET) se sustenta en el marco constitucional, legal, reglamentario y normativo vigente del sistema de educación superior del Ecuador, así como en la normativa interna institucional, los cuales establecen la obligación de garantizar la calidad académica mediante procesos sistemáticos de evaluación, planificación y mejora continua del desempeño docente.',
    'El presente informe se fundamenta en las siguientes disposiciones legales:'
  ],
  blocks: [
    {
      title: 'Constitución de la República del Ecuador',
      items: [
        'el artículo 26 establece que la educación es un derecho de las personas a lo largo de su vida y un deber ineludible del Estado, constituyéndose en un área prioritaria de la política pública y de la inversión estatal.',
        'el artículo 27 determina que la educación se centrará en el ser humano y garantizará su desarrollo integral, promoviendo capacidades, habilidades y conocimientos pertinentes para la vida social y productiva.',
        'el artículo 350 señala que el sistema de educación superior tiene como finalidad la formación académica y profesional con visión científica y humanista, la investigación y la innovación, bajo criterios de calidad, pertinencia y responsabilidad social.'
      ]
    },
    {
      title: 'Ley Orgánica de Educación Superior (LOES)',
      items: [
        'el artículo 3 establece como fines de la educación superior el desarrollo del pensamiento crítico, la formación académica y profesional de calidad y la generación de conocimiento pertinente para el desarrollo del país.',
        'el artículo 12 dispone que las instituciones de educación superior deben garantizar procesos académicos de calidad, sustentados en mecanismos de evaluación y mejora continua.',
        'el artículo 13, literal a), establece como una de las funciones del sistema de educación superior asegurar la calidad académica a través de procesos sistemáticos de evaluación y fortalecimiento institucional.',
        'el artículo 155 determina que las instituciones de educación superior promoverán la formación, capacitación y actualización permanente del personal académico, en coherencia con los objetivos institucionales y las necesidades del entorno educativo y profesional.'
      ]
    },
    {
      title: 'Reglamentos del Sistema de Educación Superior',
      items: [
        'los reglamentos derivados de la Ley Orgánica de Educación Superior disponen que las instituciones implementen procesos de planificación académica sustentados en diagnósticos técnicos, que permitan identificar brechas formativas y necesidades de fortalecimiento del desempeño docente.',
        'dichos reglamentos enfatizan la responsabilidad institucional de documentar los procesos de análisis y toma de decisiones relacionados con la mejora continua de la docencia.'
      ]
    },
    {
      title: 'Modelo de Evaluación Externa del Consejo de Aseguramiento de la Calidad de la Educación Superior (CACES)',
      items: [
        'el modelo de evaluación externa del CACES establece criterios e indicadores orientados a verificar la existencia de mecanismos institucionales para la identificación, análisis y priorización de necesidades de capacitación docente.',
        'estos criterios exigen que las instituciones de educación superior cuenten con evidencia documentada que demuestre la planificación académica basada en diagnósticos y análisis sistemáticos del desempeño docente.',
        'el modelo de evaluación promueve la mejora continua de la docencia como un eje fundamental de la calidad educativa.'
      ]
    },
    {
      title: 'Plan Estratégico de Desarrollo Institucional (PEDI) del ITSQMET',
      items: [
        'el Plan Estratégico de Desarrollo Institucional del ITSQMET define como uno de sus ejes estratégicos el fortalecimiento de la calidad académica y el desarrollo permanente del cuerpo docente.',
        'el PEDI establece la necesidad de alinear las decisiones académicas con procesos de análisis y diagnóstico que permitan identificar oportunidades de mejora en la función sustantiva de docencia.'
      ]
    },
    {
      title: 'Plan Operativo Anual (POA) del ITSQMET',
      items: [
        'el Plan Operativo Anual constituye el instrumento de planificación institucional que requiere insumos técnicos previos, tales como diagnósticos de necesidades, para la definición responsable de acciones, metas e indicadores relacionados con la capacitación docente.'
      ]
    },
    {
      title: 'Manual de Procesos Académicos del ITSQMET',
      items: [
        'el Manual de Procesos Académicos regula los procedimientos de planificación, seguimiento y evaluación del proceso docente, estableciendo la obligatoriedad de identificar de manera sistemática las brechas formativas del personal académico.',
        'dicho manual dispone que los procesos de capacitación y fortalecimiento docente deben sustentarse en diagnósticos previos debidamente documentados.'
      ]
    }
  ],
  closing: 'En virtud del marco legal expuesto, el presente informe se configura como un documento técnico–diagnóstico, orientado exclusivamente a la identificación, análisis y priorización de necesidades de capacitación docente, constituyéndose en un insumo previo y obligatorio para la planificación institucional, sin generar compromisos de ejecución, asignación presupuestaria ni programación operativa.'
};

function defaultState(){
  return {
    period: null,
    careers: [],
    diagnosedCareers: [],
    logo: null,
    dncStatus: 'draft',
    legalSnapshot: null
  };
}

function loadState(){
  try { return { ...defaultState(), ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) }; }
  catch { return defaultState(); }
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
}

function monthLabel(value){
  if(!value) return '';
  const [year,month] = value.split('-').map(Number);
  const names = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${names[month-1]} ${year}`;
}

function periodLabel(){
  if(!state.period) return 'Sin período activo';
  return `${monthLabel(state.period.start)} – ${monthLabel(state.period.end)}`;
}

function normalized(text){
  return String(text ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

function activeCareers(){ return state.careers.filter(c => c.active !== false); }
function diagnosedSet(){ return new Set(state.diagnosedCareers.map(normalized)); }
function diagnosedActiveCareers(){
  const set = diagnosedSet();
  return activeCareers().filter(c => set.has(normalized(c.name)));
}

function coverageInfo(){
  const total = activeCareers().length;
  const covered = diagnosedActiveCareers().length;
  if(!total) return { total:0, covered:0, pct:null, status:'pending', phrase:'las carreras incluidas en el proceso de detección de necesidades de capacitación' };
  if(!state.diagnosedCareers.length) return { total, covered:0, pct:0, status:'pending', phrase:'las carreras incluidas en el proceso de detección de necesidades de capacitación' };
  const pct = Math.round((covered/total)*100);
  if(covered === total) return { total, covered, pct, status:'complete', phrase:'las carreras ofertadas por el ITSQMET' };
  return { total, covered, pct, status:'partial', phrase:'las carreras incluidas en el proceso de detección de necesidades de capacitación correspondiente al período' };
}

function introScopeParagraphs(){
  const period = state.period ? periodLabel() : '[PERÍODO ACADÉMICO PENDIENTE]';
  const coverage = coverageInfo();
  return [
    `El presente informe de detección de necesidades de capacitación docente se desarrolla para el período académico ${period}, considerado un momento estratégico dentro del ciclo de planificación, seguimiento y mejora continua de la docencia en el Instituto Superior Tecnológico Quito Metropolitano (ITSQMET). Este período permite analizar de manera pertinente las condiciones reales del ejercicio docente, las prácticas pedagógicas implementadas y las brechas de capacitación evidenciadas durante el desarrollo académico institucional.`,
    'El alcance temporal del diagnóstico no se limita a una revisión puntual, sino que recoge información acumulada y validada a partir de la experiencia docente inmediata, las observaciones académicas realizadas durante el desarrollo de las asignaturas y la reflexión pedagógica generada en los espacios de coordinación y trabajo colegiado. De esta manera, la detección responde a necesidades actuales y contextualizadas, evitando enfoques aislados o desarticulados de la realidad institucional.',
    `En cuanto a la cobertura, el informe abarca ${coverage.phrase}, considerando a los docentes y coordinadores de carrera como actores clave en la identificación de necesidades de capacitación. La detección se realiza exclusivamente desde la función sustantiva de docencia, enfocándose en los procesos de planificación académica, desarrollo de clases, evaluación del aprendizaje, uso de metodologías y fortalecimiento de competencias pedagógicas vinculadas al perfil de egreso de cada carrera.`,
    'La cobertura del diagnóstico se estructura a nivel de carrera, permitiendo identificar múltiples necesidades de capacitación docente, sustentadas en evidencia cualitativa y cuantitativa. A partir de este análisis, se prioriza una necesidad ganadora por carrera, definida como aquella que presenta mayor impacto en la mejora de la docencia y mayor recurrencia según los criterios establecidos. Asimismo, el informe contempla la agrupación de carreras que comparten una misma necesidad de capacitación, lo que posibilita una visión institucional integrada y coherente de las brechas identificadas.',
    'Este enfoque de cobertura permite, además, identificar tendencias transversales, necesidades recurrentes y áreas críticas comunes, sin perder la especificidad disciplinar de cada carrera. De esta forma, el informe aporta información estratégica tanto a nivel particular como institucional, fortaleciendo los procesos de toma de decisiones académicas.',
    'Es importante precisar que el alcance del presente documento se circunscribe estrictamente a la fase de detección y análisis de necesidades, constituyéndose como un insumo técnico previo para la planificación institucional. En consecuencia, no contempla la definición de programas de capacitación, cronogramas, modalidades, cargas horarias ni estrategias de ejecución, los cuales serán desarrollados posteriormente en el Plan de Capacitación Docente, una vez validados los resultados de esta detección.'
  ];
}

function escapeHtml(value){
  return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
}

function renderIntroHtml(){
  let html = '<h2>1. Introducción</h2><h3>1.1. Justificación del Informe</h3>';
  html += INTRO.justification.map(p=>`<p>${escapeHtml(p)}</p>`).join('');
  html += '<h3>1.2. Alcance Temporal y Cobertura</h3>' + introScopeParagraphs().map(p=>`<p>${escapeHtml(p)}</p>`).join('');
  html += '<h3>1.3. Contexto Institucional y Transformaciones Educativas</h3>' + INTRO.contextIntro.map(p=>`<p>${escapeHtml(p)}</p>`).join('');
  INTRO.transformations.forEach(([title,pars])=>{ html += `<h4>${escapeHtml(title)}</h4>${pars.map(p=>`<p>${escapeHtml(p)}</p>`).join('')}`; });
  html += '<h3>1.4. Objetivos del Diagnóstico</h3>' + INTRO.objectivesIntro.map(p=>`<p>${escapeHtml(p)}</p>`).join('');
  html += `<h4>1.4.1. Objetivo General</h4><p>${escapeHtml(INTRO.generalObjective)}</p>`;
  html += '<h4>1.4.2. Objetivos Específicos</h4><ol class="alpha" type="a">' + INTRO.specificObjectives.map(x=>`<li>${escapeHtml(x)}</li>`).join('') + '</ol>';
  return html;
}

function renderLegalHtml(){
  let html = '<h2>2. Base Legal</h2>' + LEGAL.intro.map(p=>`<p>${escapeHtml(p)}</p>`).join('');
  LEGAL.blocks.forEach(block=>{
    html += `<div class="legal-block"><div class="legal-block-title">${escapeHtml(block.title)}</div>`;
    html += block.items.map(item=>`<div class="considerando"><em>Que,</em><span>${escapeHtml(item)}</span></div>`).join('');
    html += '</div>';
  });
  html += `<p>${escapeHtml(LEGAL.closing)}</p>`;
  return html;
}

function renderAll(){
  document.getElementById('activePeriodChip').textContent = state.period ? periodLabel() : 'Sin período activo';
  document.getElementById('homePeriodName').textContent = state.period ? periodLabel() : 'No configurado';
  document.getElementById('introPeriod').textContent = state.period ? periodLabel() : 'Pendiente';

  const active = activeCareers();
  const covered = diagnosedActiveCareers();
  const coverage = coverageInfo();
  document.getElementById('homeCareersCount').textContent = active.length;
  document.getElementById('homeDiagnosedCount').textContent = covered.length;
  document.getElementById('homeCoverage').textContent = coverage.pct == null ? '—' : `${coverage.pct}%`;
  document.getElementById('introActiveCareers').textContent = active.length;
  document.getElementById('introCoverage').textContent = coverage.status === 'complete' ? 'Completa' : coverage.status === 'partial' ? 'Parcial' : 'Pendiente';

  document.getElementById('periodStatusDot').className = `dot${state.period ? ' ok':''}`;
  document.getElementById('periodStatusText').textContent = state.period ? 'Período configurado' : 'Período pendiente';
  document.getElementById('coverageStatusDot').className = `dot${coverage.status === 'complete' ? ' ok':''}`;
  document.getElementById('coverageStatusText').textContent = coverage.status === 'complete' ? 'Cobertura completa' : coverage.status === 'partial' ? `Cobertura parcial (${coverage.covered}/${coverage.total})` : 'Cobertura pendiente';

  if(state.period){
    document.getElementById('periodStart').value = state.period.start;
    document.getElementById('periodEnd').value = state.period.end;
    document.getElementById('periodSummary').textContent = `Período activo: ${periodLabel()}`;
  }

  const tbody = document.getElementById('careersTableBody');
  document.getElementById('careersTableCaption').textContent = `${state.careers.length} registro(s)`;
  if(!state.careers.length){ tbody.innerHTML='<tr><td colspan="3" class="empty">Sin registros.</td></tr>'; }
  else tbody.innerHTML = state.careers.map(c=>`<tr><td>${escapeHtml(c.code||'—')}</td><td>${escapeHtml(c.name)}</td><td>${c.active===false?'No':'Sí'}</td></tr>`).join('');

  document.getElementById('introPreview').innerHTML = renderIntroHtml();
  document.getElementById('legalPreview').innerHTML = renderLegalHtml();
  document.getElementById('legalList').innerHTML = LEGAL.blocks.map((b,i)=>`<div class="legal-item"><strong>${i+1}. ${escapeHtml(b.title)}</strong><span>${b.items.length} considerando(s)</span></div>`).join('');

  const logoPreview = document.getElementById('logoPreview');
  logoPreview.innerHTML = state.logo ? `<img src="${state.logo}" alt="Logotipo institucional">` : 'Sin logotipo cargado';
}

function navigate(view){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(v=>v.classList.remove('active'));
  const target = document.getElementById(`view-${view}`);
  if(target) target.classList.add('active');
  const nav = document.querySelector(`.nav-item[data-view="${view}"]`);
  if(nav) nav.classList.add('active');
  const titles = {inicio:'Panel de capacitación docente',periodos:'Períodos', 'dnc-introduccion':'DNC · Introducción','dnc-base-legal':'DNC · Base Legal',configuracion:'Configuración'};
  document.getElementById('pageTitle').textContent = titles[view] || 'DOC-CAPA';
  window.scrollTo({top:0,behavior:'smooth'});
}

function toast(message){
  const el = document.getElementById('toast'); el.textContent=message; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2600);
}

function savePeriod(){
  const start = document.getElementById('periodStart').value;
  const end = document.getElementById('periodEnd').value;
  if(!start || !end) return toast('Selecciona inicio y fin del período.');
  if(start > end) return toast('La fecha de inicio no puede ser posterior al fin.');
  state.period = {start,end,id:`PER-${start}-${end}`};
  saveState(); toast('Período guardado.');
}

function downloadCareersTemplate(){
  const ws = XLSX.utils.aoa_to_sheet([
    ['CODIGO_CARRERA','CARRERA','ACTIVA'],
    ['','Ejemplo de carrera','SI']
  ]);
  ws['!cols']=[{wch:18},{wch:48},{wch:12}];
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Carreras');
  XLSX.writeFile(wb,`Plantilla_Carreras_${state.period?.id || 'Periodo'}.xlsx`);
}

async function importCareers(file){
  try{
    const data=await file.arrayBuffer(); const wb=XLSX.read(data); const sheet=wb.Sheets[wb.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(sheet,{defval:''});
    const good=[], bad=[];
    rows.forEach((r,idx)=>{
      const name=String(r.CARRERA||'').trim();
      if(!name){ bad.push({...r,FILA_EXCEL:idx+2,ERROR:'CARRERA es obligatoria'}); return; }
      const raw=normalized(r.ACTIVA||'si');
      good.push({code:String(r.CODIGO_CARRERA||'').trim(),name,active:!['no','0','false','inactiva'].includes(raw)});
    });
    state.careers = mergeByName(state.careers,good);
    saveState();
    const result=document.getElementById('careersImportResult');
    result.innerHTML=`<div class="info-box">${good.length} fila(s) cargada(s). ${bad.length ? `${bad.length} con error. <button class="text-button" id="downloadErrorsBtn">Descargar plantilla de corrección</button>` : 'Sin errores.'}</div>`;
    if(bad.length){ document.getElementById('downloadErrorsBtn').onclick=()=>downloadErrorWorkbook(bad,'Correccion_Carreras.xlsx'); }
  }catch(e){ console.error(e); toast('No se pudo leer la plantilla Excel.'); }
}

function mergeByName(existing,incoming){
  const map=new Map(existing.map(x=>[normalized(x.name),x]));
  incoming.forEach(x=>map.set(normalized(x.name),x));
  return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'es'));
}

function downloadErrorWorkbook(rows,filename){
  const ws=XLSX.utils.json_to_sheet(rows); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Corregir'); XLSX.writeFile(wb,filename);
}

function handleLogo(file){
  if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{state.logo=reader.result;saveState();toast('Logotipo cargado.');};
  reader.readAsDataURL(file);
}

function validateDncForFinal(){
  const errors=[]; const cov=coverageInfo();
  if(!state.period) errors.push('No existe un período activo.');
  if(!activeCareers().length) errors.push('No existen carreras activas cargadas para el período.');
  if(cov.status!=='complete') errors.push('La cobertura del diagnóstico todavía no está completa.');
  if(LEGAL.blocks.length!==7) errors.push('La Base Legal maestra no contiene los 7 bloques esperados.');
  return errors;
}

function buildPrintDocument(){
  const period=state.period?periodLabel():'Período pendiente';
  const logo=state.logo ? `<img src="${state.logo}" alt="Logo">` : '<span class="rgi-logo-placeholder">LOGOTIPO<br>ITSQMET</span>';
  return `
    <section class="doc-cover">
      <div class="rgi-head">
        <div class="rgi-logo">${logo}</div>
        <div class="rgi-center"><div class="rgi-unit">Unidad de Gestión de Procesos Académicos</div><div class="rgi-doc">Detección de Necesidades de Capacitación<br>${escapeHtml(period)}</div></div>
        <div class="rgi-code"><div><strong>Código:</strong><br>UGPA-RGI1-01-PRO-70-<br>${state.period ? state.period.start : 'AAAA-MM'}</div></div>
      </div>
      <div class="cover-title"><h1>Detección de Necesidades de Capacitación</h1><h2>${escapeHtml(period)}</h2></div>
      <div class="signature-grid">
        ${signatureColumn('ELABORADO POR:','Mgs. Jefferson Villarreal','Gestor de Procesos Académicos')}
        ${signatureColumn('REVISADO POR:','Ing. Martha Tomalá','Coordinadora General de Carreras')}
        ${signatureColumn('APROBADO POR:','Dr. Alex León','Vicerrector')}
      </div>
    </section>
    <section class="doc-content doc-page">${renderIntroHtml()}</section>
    <section class="doc-content doc-page">${renderLegalHtml()}</section>`;
}

function signatureColumn(label,name,role){
  return `<div class="signature-col"><div class="signature-space">${label}</div><div><strong>NOMBRE:</strong> ${escapeHtml(name)}</div><div><strong>CARGO:</strong> ${escapeHtml(role)}</div></div>`;
}

function openPreview(){
  document.getElementById('printDocument').innerHTML=buildPrintDocument();
  document.getElementById('pdfPreviewDialog').showModal();
}

function closePreview(){ document.getElementById('pdfPreviewDialog').close(); }

function addWrappedText(doc,text,x,y,maxWidth,{size=10,bold=false,italic=false,lineHeight=4.8}={}){
  doc.setFont('helvetica', bold ? (italic?'bolditalic':'bold') : (italic?'italic':'normal'));
  doc.setFontSize(size);
  const lines=doc.splitTextToSize(text,maxWidth);
  lines.forEach(line=>{ if(y>280){doc.addPage();y=18;} doc.text(line,x,y,{align:'left'}); y+=lineHeight; });
  return y;
}

function drawRgiHeader(doc,period){
  const x=15,y=15,w=180,h1=8,h2=20; doc.setDrawColor(0); doc.setLineWidth(.25);
  doc.rect(x,y,45,h1+h2); doc.rect(x+45,y,90,h1); doc.rect(x+45,y+h1,90,h2); doc.rect(x+135,y,45,h1+h2);
  if(state.logo){ try{doc.addImage(state.logo,'PNG',x+4,y+4,37,18,undefined,'FAST');}catch{} }
  else { doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('ITSQMET',x+22.5,y+14,{align:'center'}); }
  doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('Unidad de Gestión de Procesos Académicos',x+90,y+5.2,{align:'center'});
  doc.setFontSize(8.5);doc.text('Detección de Necesidades de Capacitación',x+90,y+14,{align:'center'});doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(period,x+90,y+20,{align:'center'});
  doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.text(['Código:','UGPA-RGI1-01-PRO-70-',state.period?state.period.start:'AAAA-MM'],x+157.5,y+10,{align:'center'});
}

function drawCover(doc){
  const period=state.period?periodLabel():'Período pendiente'; drawRgiHeader(doc,period);
  doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text('Detección de Necesidades de Capacitación',105,132,{align:'center'});doc.setFontSize(16);doc.text(period,105,144,{align:'center'});
  const y=238,x=15,col=60;doc.setDrawColor(0);doc.setLineWidth(.25);doc.rect(x,y,180,42);doc.line(x+col,y,x+col,y+42);doc.line(x+col*2,y,x+col*2,y+42);doc.line(x,y+24,x+180,y+24);doc.line(x,y+31.5,x+180,y+31.5);
  const rows=[['ELABORADO POR:','Mgs. Jefferson Villarreal','Gestor de Procesos Académicos'],['REVISADO POR:','Ing. Martha Tomalá','Coordinadora General de Carreras'],['APROBADO POR:','Dr. Alex León','Vicerrector']];
  rows.forEach((r,i)=>{const cx=x+i*col+2;doc.setFontSize(7.5);doc.setFont('helvetica','bold');doc.text(r[0],cx,y+5);doc.text('NOMBRE:',cx,y+29);doc.text('CARGO:',cx,y+36);doc.setFont('helvetica','normal');doc.text(r[1],cx+14,y+29);const roleLines=doc.splitTextToSize(r[2],42);doc.text(roleLines,cx+12,y+36);});
}

function writeHeading(doc,text,level,y){
  const size=level===2?13:level===3?11:10; if(y>275){doc.addPage();y=18;}doc.setFont('helvetica','bold');doc.setFontSize(size);doc.text(text,15,y);return y+(level===2?7:6);
}

function writeParagraph(doc,text,y){
  doc.setFont('helvetica','normal');doc.setFontSize(9.5);const lines=doc.splitTextToSize(text,180);for(const line of lines){if(y>280){doc.addPage();y=18;}doc.text(line,15,y,{maxWidth:180});y+=4.6;}return y+2.5;
}

function writeIntroPdf(doc){
  let y=20;y=writeHeading(doc,'1. Introducción',2,y);y=writeHeading(doc,'1.1. Justificación del Informe',3,y);INTRO.justification.forEach(p=>y=writeParagraph(doc,p,y));
  y=writeHeading(doc,'1.2. Alcance Temporal y Cobertura',3,y);introScopeParagraphs().forEach(p=>y=writeParagraph(doc,p,y));
  y=writeHeading(doc,'1.3. Contexto Institucional y Transformaciones Educativas',3,y);INTRO.contextIntro.forEach(p=>y=writeParagraph(doc,p,y));
  INTRO.transformations.forEach(([title,pars])=>{y=writeHeading(doc,title,4,y);pars.forEach(p=>y=writeParagraph(doc,p,y));});
  y=writeHeading(doc,'1.4. Objetivos del Diagnóstico',3,y);INTRO.objectivesIntro.forEach(p=>y=writeParagraph(doc,p,y));
  y=writeHeading(doc,'1.4.1. Objetivo General',4,y);y=writeParagraph(doc,INTRO.generalObjective,y);y=writeHeading(doc,'1.4.2. Objetivos Específicos',4,y);
  INTRO.specificObjectives.forEach((p,i)=>{y=writeParagraph(doc,`${String.fromCharCode(97+i)}) ${p}`,y)});
}

function writeLegalPdf(doc){
  let y=20;y=writeHeading(doc,'2. Base Legal',2,y);LEGAL.intro.forEach(p=>y=writeParagraph(doc,p,y));
  LEGAL.blocks.forEach(block=>{
    y=writeHeading(doc,block.title,4,y);
    block.items.forEach(item=>{
      if(y>278){doc.addPage();y=18;}
      doc.setFont('helvetica','italic');doc.setFontSize(9.5);doc.text('Que,',15,y);
      doc.setFont('helvetica','normal');const lines=doc.splitTextToSize(item,165);
      lines.forEach((line,idx)=>{if(y>280){doc.addPage();y=18;}doc.text(line,30,y);y+=4.6;});y+=1.8;
    });
  });
  y=writeParagraph(doc,LEGAL.closing,y);
}

function downloadPdf(){
  if(!jsPDF) return toast('No se cargó el generador PDF.');
  const errors=validateDncForFinal();
  if(errors.length){ toast(`PDF de trabajo: ${errors[0]}`); }
  const doc=new jsPDF({unit:'mm',format:'a4',orientation:'portrait'});drawCover(doc);doc.addPage();writeIntroPdf(doc);doc.addPage();writeLegalPdf(doc);
  const suffix=state.period ? `${state.period.start}_${state.period.end}` : 'BORRADOR';doc.save(`DNC_ITSQMET_${suffix}.pdf`);
}

function bindEvents(){
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.view)));
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.go)));
  document.getElementById('savePeriodBtn').addEventListener('click',savePeriod);
  document.getElementById('downloadCareersTemplateBtn').addEventListener('click',downloadCareersTemplate);
  document.getElementById('careersFileInput').addEventListener('change',e=>e.target.files[0]&&importCareers(e.target.files[0]));
  document.getElementById('logoInput').addEventListener('change',e=>handleLogo(e.target.files[0]));
  document.getElementById('removeLogoBtn').addEventListener('click',()=>{state.logo=null;saveState();});
  document.getElementById('previewDncBtn').addEventListener('click',openPreview);
  document.getElementById('previewLegalBtn').addEventListener('click',openPreview);
  document.getElementById('downloadDncBtn').addEventListener('click',downloadPdf);
  document.getElementById('downloadFromPreviewBtn').addEventListener('click',downloadPdf);
  document.getElementById('closePreviewBtn').addEventListener('click',closePreview);
  document.getElementById('closePreviewBottomBtn').addEventListener('click',closePreview);
}

bindEvents();renderAll();
