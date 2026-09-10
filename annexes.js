(function(){
  'use strict';

  const EVIDENCE_DEFS={
    coordinators:'Reuniones con coordinadores',
    instrument:'Instrumento de encuesta',
    teachers:'Reuniones con docentes',
    virtual:'Reuniones virtuales',
    surveyResults:'Resultados de encuesta',
    formStructure:'Estructura del formulario',
    convocatoria:'Convocatoria oficial'
  };
  const SENSITIVE_RE=/(cedula|cédula|identificacion|identificación|documento|correo|email|e-mail|nombre|apellido|telefono|teléfono|celular|movil|móvil)/i;

  function defaults(){return{
    version:1,
    evidence:{coordinators:[],instrument:[],teachers:[],virtual:[],surveyResults:[],formStructure:[],convocatoria:[]},
    surveyQuestions:[],
    surveyResults:[],
    masterDatabase:[],
    masterSheetName:'Base_Maestra',
    privacyMode:'internal',
    convocatoria:{date:'',medium:'',recipients:''}
  };}
  function ensureAnnexState(){
    const d=defaults();
    state.annexes={...d,...(state.annexes||{})};
    state.annexes.evidence={...d.evidence,...(state.annexes.evidence||{})};
    Object.keys(EVIDENCE_DEFS).forEach(k=>{if(!Array.isArray(state.annexes.evidence[k]))state.annexes.evidence[k]=[];});
    if(!Array.isArray(state.annexes.surveyQuestions))state.annexes.surveyQuestions=[];
    if(!Array.isArray(state.annexes.surveyResults))state.annexes.surveyResults=[];
    if(!Array.isArray(state.annexes.masterDatabase))state.annexes.masterDatabase=[];
    state.annexes.convocatoria={...d.convocatoria,...(state.annexes.convocatoria||{})};
  }
  ensureAnnexState();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));

  function esc(v){return escapeHtml(v);}
  function norm(v){return normalized(v);}
  function num(v){const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null;}
  function pct(v){const n=num(v);return n==null?'—':`${Math.round(n*100)/100}%`;}
  function boolYes(v){return ['si','sí','true','1','x','ganadora','priorizada'].includes(norm(v));}
  function analyzedCareers(){return activeCareers().filter(c=>careerCandidates(c.name).length===5);}
  function careerNeedResult(career,need){return (state.results?.careerNeeds||[]).find(r=>norm(r.CARRERA)===norm(career)&&norm(r.NOMBRE_NECESIDAD)===norm(need));}
  function surveyTool(){return state.institutionalConfig?.surveyTool||state.institutionalConfig?.encuestaHerramienta||'Microsoft Forms';}
  function periodText(){
    if(state.period?.label)return state.period.label;
    const start=state.period?.start||state.period?.startMonth||'',end=state.period?.end||state.period?.endMonth||'';
    const fmt=v=>{if(!v)return'';const [y,m]=String(v).split('-');const names=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];return m&&names[Number(m)-1]?`${names[Number(m)-1]} ${y}`:String(v);};
    return start&&end?`${fmt(start)} – ${fmt(end)}`:'Período pendiente';
  }
  function saveAnnexes(){try{saveState();}catch(e){console.error(e);toast('No se pudo guardar. Las evidencias pueden superar el almacenamiento local disponible.');}}

  function workbookDownload(sheets,filename){
    const wb=XLSX.utils.book_new();
    Object.entries(sheets).forEach(([name,rows])=>XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),name.slice(0,31)));
    XLSX.writeFile(wb,filename);
  }
  function downloadSurveyTemplate(){
    const q=state.annexes.surveyQuestions.length?state.annexes.surveyQuestions:[{ID_PREGUNTA:'P01',NUMERO:1,TEXTO_PREGUNTA:'',TIPO_PREGUNTA:'CERRADA',SECCION:''}];
    const r=state.annexes.surveyResults.length?state.annexes.surveyResults:[{ID_PREGUNTA:'P01',OPCION_RESPUESTA:'',CANTIDAD:'',PORCENTAJE:''}];
    workbookDownload({Preguntas:q,Resultados:r},`Plantilla_Anexo5_Encuesta_${state.period?.id||'Periodo'}.xlsx`);
  }
  function downloadCorrectionWorkbook(qErrors,rErrors){
    const sheets={};if(qErrors.length)sheets.Errores_Preguntas=qErrors;if(rErrors.length)sheets.Errores_Resultados=rErrors;
    workbookDownload(sheets,'Correccion_Anexo5_Encuesta.xlsx');
  }
  async function readWorkbook(file){const buf=await file.arrayBuffer();return XLSX.read(buf,{type:'array'});}
  function sheetRows(wb,names){
    const sheetName=wb.SheetNames.find(n=>names.some(x=>norm(n)===norm(x)))||wb.SheetNames.find(n=>names.some(x=>norm(n).includes(norm(x))));
    return sheetName?XLSX.utils.sheet_to_json(wb.Sheets[sheetName],{defval:''}):[];
  }
  async function importSurveyWorkbook(file){
    if(!ensureEditable())return;
    try{
      const wb=await readWorkbook(file),qRows=sheetRows(wb,['Preguntas']),rRows=sheetRows(wb,['Resultados']),qGood=[],qBad=[],rGood=[],rBad=[];
      const ids=new Set();
      qRows.forEach((r,i)=>{
        const id=String(r.ID_PREGUNTA||'').trim(),text=String(r.TEXTO_PREGUNTA||'').trim(),type=String(r.TIPO_PREGUNTA||'').trim().toUpperCase();
        if(!id||!text||!['CERRADA','ABIERTA'].includes(type)){qBad.push({...r,FILA_EXCEL:i+2,ERROR:'ID_PREGUNTA, TEXTO_PREGUNTA y TIPO_PREGUNTA (CERRADA/ABIERTA) son obligatorios'});return;}
        if(ids.has(norm(id))){qBad.push({...r,FILA_EXCEL:i+2,ERROR:'ID_PREGUNTA duplicado'});return;}
        ids.add(norm(id));qGood.push({ID_PREGUNTA:id,NUMERO:r.NUMERO||qGood.length+1,TEXTO_PREGUNTA:text,TIPO_PREGUNTA:type,SECCION:String(r.SECCION||'').trim()});
      });
      const validIds=new Set(qGood.map(x=>norm(x.ID_PREGUNTA)));
      rRows.forEach((r,i)=>{
        const id=String(r.ID_PREGUNTA||'').trim(),option=String(r.OPCION_RESPUESTA||'').trim(),count=num(r.CANTIDAD),percentage=String(r.PORCENTAJE??'').trim()===''?null:num(r.PORCENTAJE);
        if(!validIds.has(norm(id))){rBad.push({...r,FILA_EXCEL:i+2,ERROR:'ID_PREGUNTA no existe en la hoja Preguntas'});return;}
        if(!option||count==null||count<0){rBad.push({...r,FILA_EXCEL:i+2,ERROR:'OPCION_RESPUESTA y CANTIDAD numérica son obligatorios'});return;}
        if(percentage!=null&&(percentage<0||percentage>100)){rBad.push({...r,FILA_EXCEL:i+2,ERROR:'PORCENTAJE debe estar entre 0 y 100'});return;}
        rGood.push({ID_PREGUNTA:id,OPCION_RESPUESTA:option,CANTIDAD:count,PORCENTAJE:percentage==null?'':percentage});
      });
      if(qGood.length)state.annexes.surveyQuestions=qGood;
      if(rGood.length)state.annexes.surveyResults=rGood;
      saveAnnexes();renderAll();
      const box=document.getElementById('annexSurveyImportResult');
      const errors=qBad.length+rBad.length;
      if(box)box.innerHTML=`<div class="info-box"><strong>${qGood.length} pregunta(s) y ${rGood.length} resultado(s) válidos.</strong>${errors?`<br>${errors} fila(s) requieren corrección. <button class="text-button" id="downloadAnnexSurveyCorrection">Descargar plantilla solo con errores</button>`:''}</div>`;
      document.getElementById('downloadAnnexSurveyCorrection')?.addEventListener('click',()=>downloadCorrectionWorkbook(qBad,rBad));
      toast('Datos del Anexo 5 procesados.');
    }catch(e){console.error(e);toast('No se pudo leer la plantilla del Anexo 5.');}
  }

  async function importMasterDatabase(file){
    if(!ensureEditable())return;
    try{
      const wb=await readWorkbook(file),name=wb.SheetNames[0],rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:''});
      state.annexes.masterDatabase=rows;state.annexes.masterSheetName=name||'Base_Maestra';saveAnnexes();renderAll();
      const box=document.getElementById('annexMasterImportResult');if(box)box.innerHTML=`<div class="info-box"><strong>${rows.length} registro(s) cargados.</strong> Se conservará la opción de visualización interna o anonimizada.</div>`;
      toast('Base maestra del Anexo 8 cargada.');
    }catch(e){console.error(e);toast('No se pudo leer la base maestra del Anexo 8.');}
  }

  function dataUrlFromImage(file){
    return new Promise((resolve,reject)=>{
      const fr=new FileReader();fr.onerror=reject;fr.onload=()=>{
        const img=new Image();img.onerror=()=>resolve(fr.result);img.onload=()=>{
          const max=1600,scale=Math.min(1,max/Math.max(img.width,img.height)),w=Math.round(img.width*scale),h=Math.round(img.height*scale);
          const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.drawImage(img,0,0,w,h);
          resolve(c.toDataURL('image/jpeg',0.82));
        };img.src=fr.result;
      };fr.readAsDataURL(file);
    });
  }
  async function addEvidence(type,files){
    if(!ensureEditable())return;
    if(!EVIDENCE_DEFS[type])return;
    for(const file of [...files]){
      if(!file.type.startsWith('image/'))continue;
      try{const dataUrl=await dataUrlFromImage(file);state.annexes.evidence[type].push({id:`${Date.now()}-${Math.random().toString(36).slice(2)}`,name:file.name,dataUrl});}
      catch(e){console.error(e);}
    }
    saveAnnexes();renderAll();toast('Evidencia visual agregada.');
  }
  function removeEvidence(type,id){if(!ensureEditable())return;state.annexes.evidence[type]=state.annexes.evidence[type].filter(x=>x.id!==id);saveAnnexes();renderAll();}
  function evidenceHtml(type){
    const rows=state.annexes.evidence[type]||[];
    if(!rows.length)return'<div class="annex-empty">Sin evidencias cargadas.</div>';
    return`<div class="annex-thumb-grid">${rows.map(x=>`<div class="annex-thumb"><img src="${x.dataUrl}" alt="${esc(x.name)}"><div><span>${esc(x.name)}</span><button class="text-button annex-remove" data-type="${type}" data-id="${x.id}">Quitar</button></div></div>`).join('')}</div>`;
  }

  function questionResults(id){return state.annexes.surveyResults.filter(r=>norm(r.ID_PREGUNTA)===norm(id));}
  function resultBreakdown(question){
    const rows=questionResults(question.ID_PREGUNTA),total=rows.reduce((s,r)=>s+(num(r.CANTIDAD)||0),0);
    return rows.map(r=>{const count=num(r.CANTIDAD)||0,given=num(r.PORCENTAJE),percentage=given==null?(total?count/total*100:0):given;return{label:String(r.OPCION_RESPUESTA||'').trim(),count,percentage};}).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,'es'));
  }
  function totalValidResponses(){
    if(state.annexes.masterDatabase.length)return state.annexes.masterDatabase.length;
    let max=0;state.annexes.surveyQuestions.forEach(q=>{const t=resultBreakdown(q).reduce((s,r)=>s+r.count,0);max=Math.max(max,t);});return max;
  }
  function barHtml(rows){
    if(!rows.length)return'<div class="annex-empty">Sin resultados para graficar.</div>';
    const max=Math.max(...rows.map(r=>r.percentage),1);
    return`<div class="annex-bars">${rows.slice(0,10).map(r=>`<div class="annex-bar-row"><span>${esc(r.label)}</span><div class="annex-bar-track"><div class="annex-bar-fill" style="width:${Math.max(2,(r.percentage/max)*100)}%"></div></div><strong>${pct(r.percentage)} · ${r.count}</strong></div>`).join('')}</div>`;
  }
  function surveyQuestionHtml(q){
    const rows=resultBreakdown(q),total=rows.reduce((s,r)=>s+r.count,0),top=rows[0];
    const finding=top?(q.TIPO_PREGUNTA==='ABIERTA'?`La respuesta o categoría más frecuente fue “${top.label}”, con ${top.count} registro(s).`:`La opción con mayor frecuencia fue “${top.label}”, con ${pct(top.percentage)} de las respuestas registradas para esta pregunta.`):'No existen datos suficientes para generar un hallazgo.';
    return`<div class="annex-question"><h4>Pregunta ${esc(q.NUMERO||q.ID_PREGUNTA)}. ${esc(q.TEXTO_PREGUNTA)}</h4><p><strong>Tipo:</strong> ${esc(q.TIPO_PREGUNTA)} · <strong>Total de respuestas:</strong> ${total}</p>${barHtml(rows)}<div class="table-wrap"><table class="institutional-table"><thead><tr><th>Respuesta / opción</th><th>Cantidad</th><th>Porcentaje</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.label)}</td><td class="num-cell">${r.count}</td><td class="num-cell">${pct(r.percentage)}</td></tr>`).join('')}</tbody></table></div><p><strong>Hallazgo principal:</strong> ${esc(finding)}</p></div>`;
  }

  function priorityRows(){
    const rows=[];
    analyzedCareers().forEach(c=>careerCandidates(c.name).forEach(can=>{
      const rr=careerNeedResult(c.name,can.NOMBRE_NECESIDAD)||{};
      const priority=boolYes(can.GANADORA)?'Priorizada por carrera':boolYes(can.PRELIMINAR)?'Preliminar':'No priorizada';
      rows.push({career:c.name,need:can.NOMBRE_NECESIDAD,recurrence:rr.NIVEL_RECURRENCIA||rr.PORCENTAJE_RECURRENCIA||'Pendiente',impact:can.IMPACTO_ACADEMICO||'Pendiente',alignment:can.ALINEACION_INSTITUCIONAL||'Pendiente',pertinence:can.PERTINENCIA_CURRICULAR||'Pendiente',priority});
    }));
    return rows;
  }
  function anonymizeRow(row){const out={};Object.entries(row).forEach(([k,v])=>out[k]=SENSITIVE_RE.test(k)?'[OCULTO]':v);return out;}
  function masterPreviewRows(){const rows=state.annexes.masterDatabase.slice(0,20);return state.annexes.privacyMode==='anonymized'?rows.map(anonymizeRow):rows;}
  function htmlSimpleTable(headers,rows){return`<div class="table-wrap"><table class="institutional-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}" class="empty">Sin datos.</td></tr>`}</tbody></table></div>`;}

  function renderAnnexesHtml(){
    const p=periodText(),tool=surveyTool(),a=state.annexes,total=totalValidResponses(),questions=[...a.surveyQuestions].sort((x,y)=>(num(x.NUMERO)||999)-(num(y.NUMERO)||999));
    let h='<h2>10. Anexos</h2>';
    h+='<h3>Anexo 1. Evidencia del levantamiento de información mediante reuniones académicas con coordinadores de carrera</h3>';
    if(a.evidence.coordinators.length){h+=`<p>El presente anexo constituye evidencia del levantamiento de información realizado mediante reuniones académicas con los coordinadores de carrera del Instituto Superior Tecnológico Quito Metropolitano (ITSQMET), en el marco del proceso de detección de necesidades de capacitación docente correspondiente al período <strong>${esc(p)}</strong>.</p><p>Estas reuniones se desarrollaron como una fuente primaria del diagnóstico, permitiendo validar y complementar la información obtenida a través de encuestas institucionales y reuniones con docentes, así como aportar el criterio académico del coordinador de carrera para la identificación y priorización de necesidades de capacitación, en coherencia con la metodología, la planificación institucional y el aseguramiento de la calidad.</p>${evidenceHtml('coordinators')}`;}else h+='<p><em>No se incorporan afirmaciones sobre reuniones con coordinadores hasta que exista evidencia cargada.</em></p>';

    h+='<h3>Anexo 2. Instrumento de recolección de información: Encuesta institucional para la detección de necesidades de capacitación docente</h3>';
    if(a.evidence.instrument.length||questions.length){h+=`<p>El presente anexo evidencia el instrumento de recolección de información aplicado mediante la plataforma <strong>${esc(tool)}</strong> para la detección de necesidades de capacitación docente del Instituto Superior Tecnológico Quito Metropolitano (ITSQMET), correspondiente al período <strong>${esc(p)}</strong>.</p><p>La encuesta institucional permitió recopilar información cuantitativa y cualitativa del cuerpo docente, constituyéndose en una fuente primaria del diagnóstico, cuyos resultados fueron analizados y triangulados con reuniones académicas y el criterio de los coordinadores de carrera, en coherencia con la metodología definida y los lineamientos institucionales de planificación y aseguramiento de la calidad.</p>${evidenceHtml('instrument')}${questions.length?htmlSimpleTable(['N.º','Pregunta','Tipo','Sección'],questions.map(q=>[q.NUMERO||q.ID_PREGUNTA,q.TEXTO_PREGUNTA,q.TIPO_PREGUNTA,q.SECCION||'—'])):''}`;}else h+='<p><em>Instrumento pendiente de evidencia o estructura registrada.</em></p>';

    h+='<h3>Anexo 3. Evidencia del levantamiento de información mediante reuniones académicas con docentes</h3>';
    if(a.evidence.teachers.length){h+=`<p>El presente anexo evidencia la realización de reuniones académicas con docentes del Instituto Superior Tecnológico Quito Metropolitano (ITSQMET), desarrolladas como parte del proceso de detección de necesidades de capacitación docente correspondiente al período <strong>${esc(p)}</strong>.</p><p>Estas reuniones constituyeron una fuente primaria de información cualitativa, orientada a identificar percepciones, dificultades y requerimientos de capacitación vinculados al desarrollo del proceso de enseñanza-aprendizaje, complementando los resultados obtenidos a través de la encuesta institucional y el criterio de los coordinadores de carrera.</p>${evidenceHtml('teachers')}`;}else h+='<p><em>No se afirma la realización de reuniones con docentes hasta que exista evidencia cargada.</em></p>';

    h+='<h3>Anexo 4. Evidencia del levantamiento de información mediante reuniones académicas virtuales</h3>';
    if(a.evidence.virtual.length){h+=`<p>El presente anexo evidencia la realización de reuniones académicas virtuales desarrolladas como parte del proceso de detección de necesidades de capacitación docente del Instituto Superior Tecnológico Quito Metropolitano (ITSQMET), correspondiente al período <strong>${esc(p)}</strong>.</p><p>Estas sesiones, ejecutadas a través de plataformas digitales, permitieron garantizar la participación de actores académicos en modalidad remota, aportando información cualitativa relevante para la identificación y validación de necesidades de capacitación del cuerpo docente.</p>${evidenceHtml('virtual')}`;}else h+='<p><em>No se afirma la realización de reuniones virtuales hasta que exista evidencia cargada.</em></p>';

    h+='<h3>Anexo 5. Resultados consolidados de la encuesta institucional para la detección de necesidades de capacitación docente</h3>';
    h+=`<p>El presente anexo evidencia los resultados consolidados de la encuesta institucional aplicada mediante <strong>${esc(tool)}</strong> para la detección de necesidades de capacitación docente del Instituto Superior Tecnológico Quito Metropolitano (ITSQMET), correspondiente al período <strong>${esc(p)}</strong>${total?`, en la cual se registraron un total de <strong>${total}</strong> respuestas válidas del cuerpo docente`:''}.</p>`;
    h+=a.evidence.surveyResults.length?evidenceHtml('surveyResults'):'';
    if(questions.length)questions.forEach(q=>h+=surveyQuestionHtml(q));else h+='<p><em>No existen preguntas y resultados cargados para generar los bloques tipo Forms y los gráficos de barras.</em></p>';

    h+='<h3>Anexo 6. Matriz de priorización de necesidades de capacitación docente</h3><p>El presente anexo evidencia la matriz de priorización de necesidades de capacitación docente elaborada a partir de los resultados del proceso de detección institucional desarrollado en el Instituto Superior Tecnológico Quito Metropolitano (ITSQMET) para el período <strong>'+esc(p)+'</strong>.</p><p>La matriz consolida las principales necesidades identificadas y las valora cualitativamente mediante los criterios registrados en el diagnóstico. El estado de prioridad se deriva de la selección preliminar y de la necesidad ganadora validada; no se inventan escalas adicionales.</p>';
    h+=htmlSimpleTable(['Carrera','Necesidad','Recurrencia','Impacto','Alineación','Pertinencia','Nivel de prioridad'],priorityRows().map(r=>[r.career,r.need,r.recurrence,r.impact,r.alignment,r.pertinence,r.priority]));

    h+='<h3>Anexo 7. Estructura del Instrumento Digital de Recolección de Datos</h3>';
    if(a.evidence.formStructure.length||questions.length){const sections=[...new Set(questions.map(q=>q.SECCION).filter(Boolean))];h+=`<p>Evidencia del diseño y configuración de la encuesta institucional aplicada a través de la plataforma <strong>${esc(tool)}</strong>. En esta sección se observa la estructura del instrumento digital${sections.length?`, incluyendo módulos como <strong>${esc(sections.join(', '))}</strong>`:''}, diseñada para organizar adecuadamente la información recopilada durante el período <strong>${esc(p)}</strong>.</p>${evidenceHtml('formStructure')}`;}else h+='<p><em>Estructura del instrumento pendiente de evidencia.</em></p>';

    h+='<h3>Anexo 8. Base de Datos Maestra de Respuestas - Consolidado Inicial</h3><p>Matriz técnica de recolección de datos que contiene el registro consolidado de las participaciones del diagnóstico. Esta evidencia demuestra la validez temporal y técnica del proceso, incluyendo campos de identificación, tiempos de respuesta y variables principales del levantamiento.</p>';
    if(a.masterDatabase.length){const preview=masterPreviewRows(),headers=Object.keys(preview[0]||{}).slice(0,10);h+=`<p><strong>Total de registros:</strong> ${a.masterDatabase.length} · <strong>Vista:</strong> ${a.privacyMode==='anonymized'?'Anonimizada':'Interna'}${a.masterDatabase.length>20?' · Se muestran los primeros 20 registros en el PDF.':''}</p>${htmlSimpleTable(headers,preview.map(r=>headers.map(k=>r[k])))}`;}else h+='<p><em>Base maestra pendiente de carga.</em></p>';

    h+='<h3>Anexo 9. Registro de Convocatoria Oficial y Protocolo de Comunicación Institucional</h3>';
    if(a.evidence.convocatoria.length){h+=`<p>Evidencia de la comunicación oficial emitida por la Unidad de Gestión de Procesos Académicos del ITSQMET para convocar al proceso de detección de necesidades de capacitación docente correspondiente al período <strong>${esc(p)}</strong>.</p><p><strong>Fecha de convocatoria:</strong> ${esc(a.convocatoria.date||'Pendiente')} · <strong>Medio:</strong> ${esc(a.convocatoria.medium||'Pendiente')}${a.convocatoria.recipients?` · <strong>Destinatarios:</strong> ${esc(a.convocatoria.recipients)}`:''}</p>${evidenceHtml('convocatoria')}`;}else h+='<p><em>No se incorpora evidencia de convocatoria hasta que exista un soporte visual cargado.</em></p>';
    return h;
  }

  function annexIssues(){
    const a=state.annexes,issues=[];
    if(!a.evidence.coordinators.length)issues.push('Anexo 1: falta evidencia de reuniones con coordinadores.');
    if(!a.evidence.instrument.length)issues.push('Anexo 2: falta evidencia visual del instrumento aplicado.');
    if(!a.evidence.teachers.length)issues.push('Anexo 3: falta evidencia de reuniones con docentes.');
    if(!a.evidence.virtual.length)issues.push('Anexo 4: falta evidencia de reuniones virtuales o confirmar que no aplicó.');
    if(!a.surveyQuestions.length||!a.surveyResults.length)issues.push('Anexo 5: faltan preguntas y resultados consolidados de la encuesta.');
    if(!priorityRows().length)issues.push('Anexo 6: no existe matriz de priorización derivable de la Sección 4/5.');
    if(!a.evidence.formStructure.length)issues.push('Anexo 7: falta evidencia visual de la estructura del instrumento.');
    if(!a.masterDatabase.length)issues.push('Anexo 8: falta la base de datos maestra de respuestas.');
    if(!a.evidence.convocatoria.length)issues.push('Anexo 9: falta evidencia de convocatoria oficial.');
    if(a.evidence.convocatoria.length&&!a.convocatoria.date)issues.push('Anexo 9: falta fecha de convocatoria.');
    if(a.evidence.convocatoria.length&&!a.convocatoria.medium)issues.push('Anexo 9: falta medio de comunicación.');
    return issues;
  }

  function evidenceCard(number,title,type){return`<article class="annex-card"><div class="annex-card-head"><span class="step">${number}</span><div><strong>${esc(title)}</strong><small>${state.annexes.evidence[type].length} evidencia(s)</small></div></div><div class="candidate-actions"><label class="btn btn-secondary file-label">Agregar imágenes<input type="file" hidden multiple accept="image/png,image/jpeg,image/webp" data-annex-evidence="${type}"></label></div><div id="annex-evidence-${type}">${evidenceHtml(type)}</div></article>`;}

  function injectUi(){
    const nav8=document.querySelector('[data-view="dnc-recomendaciones"]');
    if(nav8&&!document.querySelector('[data-view="dnc-anexos"]')){
      const anchor=nav8.nextElementSibling&&nav8.nextElementSibling.textContent.trim().startsWith('9.')?nav8.nextElementSibling:nav8;
      anchor.insertAdjacentHTML('afterend','<button class="nav-item sub" data-view="dnc-anexos">10. Anexos</button>');
      document.querySelector('[data-view="dnc-anexos"]').addEventListener('click',()=>navigate('dnc-anexos'));
    }
    const main=document.querySelector('main.main'),config=document.getElementById('view-configuracion');
    if(main&&config&&!document.getElementById('view-dnc-anexos')){
      const section=document.createElement('section');section.id='view-dnc-anexos';section.className='view';
      section.innerHTML=`<div class="section-heading"><div><p class="eyebrow">DNC · Sección 10</p><h2>Anexos</h2><p>Módulo ordenado de evidencia documental, visual, de encuesta y técnica.</p></div><span class="status ready">Mixta</span></div><div class="notice strong-notice">Los anexos no son una caja única de archivos. Cada evidencia queda asociada al anexo que corresponde y la numeración se genera automáticamente del Anexo 1 al Anexo 9.</div><div id="annexIssues" class="mt-24"></div><div class="annex-grid mt-24">${evidenceCard(1,'Reuniones con coordinadores','coordinators')}${evidenceCard(2,'Instrumento de encuesta','instrument')}${evidenceCard(3,'Reuniones con docentes','teachers')}${evidenceCard(4,'Reuniones virtuales','virtual')}<article class="annex-card"><div class="annex-card-head"><span class="step">5</span><div><strong>Resultados consolidados de la encuesta</strong><small>Preguntas + resultados + capturas + gráficos automáticos</small></div></div><div class="candidate-actions"><button class="btn btn-light" id="downloadAnnexSurveyTemplate">Descargar plantilla Excel</button><label class="btn btn-secondary file-label">Subir Excel<input id="annexSurveyInput" type="file" hidden accept=".xlsx,.xls"></label><label class="btn btn-secondary file-label">Agregar capturas<input type="file" hidden multiple accept="image/png,image/jpeg,image/webp" data-annex-evidence="surveyResults"></label></div><div id="annexSurveyImportResult"></div><div id="annex-evidence-surveyResults">${evidenceHtml('surveyResults')}</div></article><article class="annex-card"><div class="annex-card-head"><span class="step">6</span><div><strong>Matriz de priorización</strong><small>Generada desde Secciones 4 y 5</small></div></div><p class="tiny">No requiere una segunda carga: usa necesidades, recurrencia, impacto, pertinencia, alineación y estado de priorización ya registrados.</p><strong id="annexPriorityCount">${priorityRows().length} fila(s) disponibles</strong></article>${evidenceCard(7,'Estructura del instrumento digital','formStructure')}<article class="annex-card"><div class="annex-card-head"><span class="step">8</span><div><strong>Base de Datos Maestra</strong><small id="annexMasterCount">${state.annexes.masterDatabase.length} registro(s)</small></div></div><div class="candidate-actions"><label class="btn btn-secondary file-label">Subir base Excel<input id="annexMasterInput" type="file" hidden accept=".xlsx,.xls"></label></div><label class="annex-select-label">Vista para el PDF<select id="annexPrivacyMode"><option value="internal">Completa interna</option><option value="anonymized">Anonimizada / datos personales ocultos</option></select></label><div id="annexMasterImportResult"></div></article><article class="annex-card"><div class="annex-card-head"><span class="step">9</span><div><strong>Convocatoria oficial</strong><small>${state.annexes.evidence.convocatoria.length} evidencia(s)</small></div></div><div class="annex-meta-grid"><label>Fecha<input id="annexConvDate" type="date"></label><label>Medio<input id="annexConvMedium" type="text" placeholder="Correo institucional, circular..."></label><label class="full">Destinatarios (opcional)<input id="annexConvRecipients" type="text"></label></div><div class="candidate-actions"><label class="btn btn-secondary file-label">Agregar imágenes<input type="file" hidden multiple accept="image/png,image/jpeg,image/webp" data-annex-evidence="convocatoria"></label><button class="btn btn-light" id="saveAnnexConvocatoria">Guardar datos</button></div><div id="annex-evidence-convocatoria">${evidenceHtml('convocatoria')}</div></article></div><article class="card mt-24"><div class="section-title-row"><div><h3>Vista previa de Anexos</h3><p>Incluye evidencias tipo Forms, gráficos de barras automáticos, matriz técnica y vista de la base maestra.</p></div><button class="btn btn-light" id="previewAnnexesBtn">Vista previa DNC</button></div><div class="document-preview" id="annexesPreview"></div></article>`;
      main.insertBefore(section,config);
    }
    if(!document.getElementById('annexStyles')){
      const style=document.createElement('style');style.id='annexStyles';style.textContent=`.annex-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.annex-card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px;box-shadow:var(--shadow)}.annex-card-head{display:flex;align-items:center;gap:10px;margin-bottom:14px}.annex-card-head strong,.annex-card-head small{display:block}.annex-card-head small{font-size:11px;color:var(--muted);margin-top:3px}.annex-thumb-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.annex-thumb{border:1px solid var(--line);border-radius:9px;overflow:hidden;background:#fafbfd}.annex-thumb img{display:block;width:100%;height:120px;object-fit:contain;background:#eef2f6}.annex-thumb>div{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:8px;font-size:10px}.annex-thumb span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.annex-empty{padding:12px;border:1px dashed #c6d0dc;border-radius:8px;color:var(--muted);font-size:11px;margin-top:10px}.annex-bars{display:grid;gap:8px;margin:12px 0 14px}.annex-bar-row{display:grid;grid-template-columns:minmax(130px,1.3fr) 2fr auto;gap:8px;align-items:center;font-size:11px}.annex-bar-track{height:14px;background:#e9eef5;border-radius:999px;overflow:hidden}.annex-bar-fill{height:100%;background:var(--navy);border-radius:999px}.annex-question{border-top:1px solid var(--line);padding-top:14px;margin-top:18px}.annex-question h4{margin-top:0}.annex-select-label{display:block;margin-top:14px}.annex-select-label select,.annex-meta-grid input{display:block;width:100%;margin-top:6px;border:1px solid var(--line);border-radius:9px;padding:9px;background:#fff}.annex-meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}.annex-meta-grid .full{grid-column:1/-1}.doc-content .annex-thumb-grid{grid-template-columns:1fr 1fr}.doc-content .annex-thumb img{height:auto;max-height:95mm}.doc-content .annex-bar-fill{background:#0f2747}@media(max-width:980px){.annex-grid,.annex-thumb-grid,.annex-meta-grid{grid-template-columns:1fr}.annex-meta-grid .full{grid-column:auto}.annex-bar-row{grid-template-columns:1fr}.annex-bar-track{height:12px}}`;document.head.appendChild(style);
    }
  }

  function bindUi(){
    document.querySelectorAll('input[data-annex-evidence]').forEach(input=>{if(input.dataset.bound)return;input.dataset.bound='1';input.addEventListener('change',e=>e.target.files?.length&&addEvidence(input.dataset.annexEvidence,e.target.files));});
    document.querySelectorAll('.annex-remove').forEach(btn=>btn.addEventListener('click',()=>removeEvidence(btn.dataset.type,btn.dataset.id)));
    const d=document.getElementById('downloadAnnexSurveyTemplate');if(d&&!d.dataset.bound){d.dataset.bound='1';d.addEventListener('click',downloadSurveyTemplate);}
    const s=document.getElementById('annexSurveyInput');if(s&&!s.dataset.bound){s.dataset.bound='1';s.addEventListener('change',e=>e.target.files[0]&&importSurveyWorkbook(e.target.files[0]));}
    const m=document.getElementById('annexMasterInput');if(m&&!m.dataset.bound){m.dataset.bound='1';m.addEventListener('change',e=>e.target.files[0]&&importMasterDatabase(e.target.files[0]));}
    const privacy=document.getElementById('annexPrivacyMode');if(privacy&&!privacy.dataset.bound){privacy.dataset.bound='1';privacy.addEventListener('change',()=>{if(!ensureEditable())return;state.annexes.privacyMode=privacy.value;saveAnnexes();renderAll();});}
    const saveConv=document.getElementById('saveAnnexConvocatoria');if(saveConv&&!saveConv.dataset.bound){saveConv.dataset.bound='1';saveConv.addEventListener('click',()=>{if(!ensureEditable())return;state.annexes.convocatoria={date:document.getElementById('annexConvDate').value,medium:document.getElementById('annexConvMedium').value.trim(),recipients:document.getElementById('annexConvRecipients').value.trim()};saveAnnexes();renderAll();toast('Datos de convocatoria guardados.');});}
    const p=document.getElementById('previewAnnexesBtn');if(p&&!p.dataset.bound){p.dataset.bound='1';p.addEventListener('click',()=>{document.getElementById('printDocument').innerHTML=`<section class="doc-content doc-page">${renderAnnexesHtml()}</section>`;document.getElementById('pdfPreviewDialog').showModal();});}
  }

  function renderAnnexUi(){
    ensureAnnexState();injectUi();
    Object.keys(EVIDENCE_DEFS).forEach(type=>{const box=document.getElementById(`annex-evidence-${type}`);if(box)box.innerHTML=evidenceHtml(type);});
    const preview=document.getElementById('annexesPreview');if(preview)preview.innerHTML=renderAnnexesHtml();
    const issues=annexIssues(),box=document.getElementById('annexIssues');if(box)box.innerHTML=issues.length?`<div class="info-box"><strong>${issues.length} pendiente(s) en anexos:</strong><br>${issues.slice(0,10).map(esc).join('<br>')}${issues.length>10?'<br>…':''}</div>`:'<div class="info-box">Anexos completos para el período.</div>';
    const count=document.getElementById('implementedSectionsCount');if(count)count.textContent='8';
    const pc=document.getElementById('annexPriorityCount');if(pc)pc.textContent=`${priorityRows().length} fila(s) disponibles`;
    const mc=document.getElementById('annexMasterCount');if(mc)mc.textContent=`${state.annexes.masterDatabase.length} registro(s)`;
    const privacy=document.getElementById('annexPrivacyMode');if(privacy)privacy.value=state.annexes.privacyMode;
    const c=state.annexes.convocatoria;const d=document.getElementById('annexConvDate'),m=document.getElementById('annexConvMedium'),r=document.getElementById('annexConvRecipients');if(d)d.value=c.date||'';if(m)m.value=c.medium||'';if(r)r.value=c.recipients||'';
    bindUi();
  }

  const baseValidate=validateDncForFinal;
  validateDncForFinal=function(){return[...new Set([...baseValidate(),...annexIssues()])];};

  const baseRenderAll=renderAll;
  renderAll=function(){baseRenderAll();renderAnnexUi();};

  const baseNavigate=navigate;
  navigate=function(view){baseNavigate(view);if(view==='dnc-anexos')document.getElementById('pageTitle').textContent='DNC · Anexos';};

  const baseBuildPrint=buildPrintDocument;
  buildPrintDocument=function(){return baseBuildPrint()+`<section class="doc-content doc-page">${renderAnnexesHtml()}</section>`;};

  function pdfEnsure(doc,y,needed=10){if(y+needed>280){doc.addPage();return 18;}return y;}
  function pdfTable(doc,headers,rows,y,widths){
    const x=15,total=180,ws=widths&&widths.length===headers.length?widths:headers.map(()=>total/headers.length),line=4,pad=2;
    const drawHeader=()=>{let rh=9;const lines=headers.map((h,i)=>{const l=doc.splitTextToSize(String(h),ws[i]-pad*2);rh=Math.max(rh,l.length*line+pad*2);return l;});y=pdfEnsure(doc,y,rh);let cx=x;doc.setFillColor(15,39,71);doc.setDrawColor(90);headers.forEach((h,i)=>{doc.rect(cx,y,ws[i],rh,'FD');doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(7.5);doc.text(lines[i],cx+pad,y+pad+3);cx+=ws[i];});doc.setTextColor(0);y+=rh;};
    drawHeader();
    rows.forEach(row=>{const cells=row.map((v,i)=>doc.splitTextToSize(String(v??''),ws[i]-pad*2)),rh=Math.max(8,...cells.map(l=>l.length*line+pad*2));if(y+rh>280){doc.addPage();y=18;drawHeader();}let cx=x;cells.forEach((lines,i)=>{doc.setDrawColor(120);doc.rect(cx,y,ws[i],rh);doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.text(lines,cx+pad,y+pad+3);cx+=ws[i];});y+=rh;});return y+4;
  }
  function writeImagesPdf(doc,images,y){
    images.forEach(img=>{try{const props=doc.getImageProperties(img.dataUrl),maxW=180,maxH=105,ratio=Math.min(maxW/props.width,maxH/props.height),w=props.width*ratio,h=props.height*ratio;y=pdfEnsure(doc,y,h+8);doc.addImage(img.dataUrl,'JPEG',15+(maxW-w)/2,y,w,h,undefined,'FAST');y+=h+7;}catch(e){console.error(e);}});return y;
  }
  function writeBarsPdf(doc,rows,y){
    if(!rows.length)return y;const max=Math.max(...rows.map(r=>r.percentage),1);doc.setFontSize(7.5);rows.slice(0,10).forEach(r=>{y=pdfEnsure(doc,y,8);doc.setFont('helvetica','normal');const label=doc.splitTextToSize(r.label,55)[0]||'';doc.text(label,15,y+3);doc.setFillColor(230,235,242);doc.rect(72,y,80,4,'F');doc.setFillColor(15,39,71);doc.rect(72,y,Math.max(1,80*(r.percentage/max)),4,'F');doc.text(`${pct(r.percentage)} · ${r.count}`,156,y+3);y+=7;});return y+3;
  }

  function writeAnnexesPdf(doc){
    const a=state.annexes,p=periodText(),tool=surveyTool(),questions=[...a.surveyQuestions].sort((x,y)=>(num(x.NUMERO)||999)-(num(y.NUMERO)||999));
    let y=20;
    y=writeHeading(doc,'10. Anexos',2,y);
    const newAnnex=(title)=>{if(y>28){doc.addPage();y=18;}y=writeHeading(doc,title,3,y);};

    newAnnex('Anexo 1. Evidencia del levantamiento de información mediante reuniones académicas con coordinadores de carrera');
    if(a.evidence.coordinators.length){y=writeParagraph(doc,`El presente anexo constituye evidencia del levantamiento de información realizado mediante reuniones académicas con los coordinadores de carrera del Instituto Superior Tecnológico Quito Metropolitano (ITSQMET), en el marco del proceso de detección de necesidades de capacitación docente correspondiente al período ${p}.`,y);y=writeParagraph(doc,'Estas reuniones se desarrollaron como una fuente primaria del diagnóstico, permitiendo validar y complementar la información obtenida a través de encuestas institucionales y reuniones con docentes, así como aportar el criterio académico del coordinador de carrera para la identificación y priorización de necesidades de capacitación.',y);y=writeImagesPdf(doc,a.evidence.coordinators,y);}else y=writeParagraph(doc,'No se incorporan afirmaciones sobre reuniones con coordinadores hasta que exista evidencia cargada.',y);

    newAnnex('Anexo 2. Instrumento de recolección de información: Encuesta institucional para la detección de necesidades de capacitación docente');
    if(a.evidence.instrument.length||questions.length){y=writeParagraph(doc,`El presente anexo evidencia el instrumento de recolección de información aplicado mediante la plataforma ${tool} para la detección de necesidades de capacitación docente del ITSQMET, correspondiente al período ${p}.`,y);y=writeImagesPdf(doc,a.evidence.instrument,y);if(questions.length)y=pdfTable(doc,['N.º','Pregunta','Tipo','Sección'],questions.map(q=>[q.NUMERO||q.ID_PREGUNTA,q.TEXTO_PREGUNTA,q.TIPO_PREGUNTA,q.SECCION||'—']),y,[18,102,28,32]);}else y=writeParagraph(doc,'Instrumento pendiente de evidencia o estructura registrada.',y);

    newAnnex('Anexo 3. Evidencia del levantamiento de información mediante reuniones académicas con docentes');
    if(a.evidence.teachers.length){y=writeParagraph(doc,`El presente anexo evidencia la realización de reuniones académicas con docentes del ITSQMET, desarrolladas como parte del proceso de detección de necesidades de capacitación docente correspondiente al período ${p}.`,y);y=writeImagesPdf(doc,a.evidence.teachers,y);}else y=writeParagraph(doc,'No se afirma la realización de reuniones con docentes hasta que exista evidencia cargada.',y);

    newAnnex('Anexo 4. Evidencia del levantamiento de información mediante reuniones académicas virtuales');
    if(a.evidence.virtual.length){y=writeParagraph(doc,`El presente anexo evidencia la realización de reuniones académicas virtuales desarrolladas como parte del proceso de detección de necesidades de capacitación docente del ITSQMET, correspondiente al período ${p}.`,y);y=writeImagesPdf(doc,a.evidence.virtual,y);}else y=writeParagraph(doc,'No se afirma la realización de reuniones virtuales hasta que exista evidencia cargada.',y);

    newAnnex('Anexo 5. Resultados consolidados de la encuesta institucional para la detección de necesidades de capacitación docente');
    y=writeParagraph(doc,`El presente anexo evidencia los resultados consolidados de la encuesta institucional aplicada mediante ${tool} para la detección de necesidades de capacitación docente del ITSQMET, correspondiente al período ${p}${totalValidResponses()?`, con un total de ${totalValidResponses()} respuestas válidas registradas`:''}.`,y);y=writeImagesPdf(doc,a.evidence.surveyResults,y);
    questions.forEach(q=>{y=pdfEnsure(doc,y,22);y=writeHeading(doc,`Pregunta ${q.NUMERO||q.ID_PREGUNTA}. ${q.TEXTO_PREGUNTA}`,4,y);const rows=resultBreakdown(q),total=rows.reduce((s,r)=>s+r.count,0),top=rows[0];y=writeParagraph(doc,`Tipo: ${q.TIPO_PREGUNTA}. Total de respuestas: ${total}.`,y);y=writeBarsPdf(doc,rows,y);y=pdfTable(doc,['Respuesta / opción','Cantidad','Porcentaje'],rows.map(r=>[r.label,r.count,pct(r.percentage)]),y,[112,28,40]);if(top)y=writeParagraph(doc,q.TIPO_PREGUNTA==='ABIERTA'?`Hallazgo principal: la respuesta o categoría más frecuente fue “${top.label}”, con ${top.count} registro(s).`:`Hallazgo principal: la opción con mayor frecuencia fue “${top.label}”, con ${pct(top.percentage)} de las respuestas registradas para esta pregunta.`,y);});

    newAnnex('Anexo 6. Matriz de priorización de necesidades de capacitación docente');
    y=writeParagraph(doc,`El presente anexo evidencia la matriz de priorización de necesidades de capacitación docente elaborada a partir de los resultados del proceso de detección institucional desarrollado para el período ${p}.`,y);y=pdfTable(doc,['Carrera','Necesidad','Recurrencia','Impacto','Alineación','Pertinencia','Prioridad'],priorityRows().map(r=>[r.career,r.need,r.recurrence,r.impact,r.alignment,r.pertinence,r.priority]),y,[32,48,22,20,20,20,18]);

    newAnnex('Anexo 7. Estructura del Instrumento Digital de Recolección de Datos');
    const sections=[...new Set(questions.map(q=>q.SECCION).filter(Boolean))];if(a.evidence.formStructure.length||questions.length){y=writeParagraph(doc,`Evidencia del diseño y configuración de la encuesta institucional aplicada a través de la plataforma ${tool}${sections.length?`, incluyendo módulos como ${sections.join(', ')}`:''}, durante el período ${p}.`,y);y=writeImagesPdf(doc,a.evidence.formStructure,y);}else y=writeParagraph(doc,'Estructura del instrumento pendiente de evidencia.',y);

    newAnnex('Anexo 8. Base de Datos Maestra de Respuestas - Consolidado Inicial');
    y=writeParagraph(doc,'Matriz técnica de recolección de datos que contiene el registro consolidado de las participaciones del diagnóstico. Esta evidencia demuestra la validez temporal y técnica del proceso.',y);if(a.masterDatabase.length){const preview=masterPreviewRows(),headers=Object.keys(preview[0]||{}).slice(0,8);y=writeParagraph(doc,`Total de registros: ${a.masterDatabase.length}. Vista: ${a.privacyMode==='anonymized'?'anonimizada':'interna'}. Se muestran hasta 20 registros en el documento.`,y);y=pdfTable(doc,headers,preview.map(r=>headers.map(k=>r[k])),y,headers.map(()=>180/Math.max(headers.length,1)));}else y=writeParagraph(doc,'Base maestra pendiente de carga.',y);

    newAnnex('Anexo 9. Registro de Convocatoria Oficial y Protocolo de Comunicación Institucional');
    if(a.evidence.convocatoria.length){y=writeParagraph(doc,`Evidencia de la comunicación oficial emitida por la Unidad de Gestión de Procesos Académicos del ITSQMET para convocar al proceso de detección de necesidades de capacitación docente correspondiente al período ${p}.`,y);y=writeParagraph(doc,`Fecha de convocatoria: ${a.convocatoria.date||'Pendiente'}. Medio: ${a.convocatoria.medium||'Pendiente'}${a.convocatoria.recipients?`. Destinatarios: ${a.convocatoria.recipients}`:''}.`,y);y=writeImagesPdf(doc,a.evidence.convocatoria,y);}else y=writeParagraph(doc,'No se incorpora evidencia de convocatoria hasta que exista un soporte visual cargado.',y);
  }

  const baseDownloadPdf=downloadPdf;
  downloadPdf=function(){
    const api=jsPDF?.API,originalSave=api?.save;if(typeof originalSave!=='function')return baseDownloadPdf();let restored=false;
    api.save=function(filename,options){try{this.addPage();writeAnnexesPdf(this);}catch(e){console.error(e);toast('No se pudieron incorporar los Anexos al PDF.');}api.save=originalSave;restored=true;return originalSave.call(this,filename,options);};
    try{return baseDownloadPdf();}finally{if(!restored)api.save=originalSave;}
  };
  function replaceDownloadListener(id){const old=document.getElementById(id);if(!old)return;const clone=old.cloneNode(true);old.replaceWith(clone);clone.addEventListener('click',downloadPdf);}
  replaceDownloadListener('downloadDncBtn');replaceDownloadListener('downloadFromPreviewBtn');
  renderAll();
})();
