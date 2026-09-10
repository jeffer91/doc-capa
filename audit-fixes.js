(function(){
  // Auditoría transversal: corrige inconsistencias detectadas entre las secciones 1–5
  // sin introducir datos de resultados ni ponderaciones no definidas.

  // 1) Coherencia de fuentes entre Introducción y Metodología.
  if(typeof INTRO!=='undefined'){
    INTRO.justification[1]='El presente informe se justifica como un instrumento técnico-diagnóstico que permite reconocer, analizar y priorizar las necesidades reales de capacitación docente, a partir de evidencia institucional y del criterio académico de los actores directamente involucrados en los procesos formativos. Este diagnóstico se sustenta en el análisis conjunto de encuestas institucionales, reuniones académicas con docentes, revisión de mallas curriculares y Planes de Enseñanza–Aprendizaje (PEA), así como del criterio de los coordinadores de carrera, lo que garantiza una aproximación contextualizada y alineada con la realidad académica de cada carrera.';
    INTRO.generalObjective='Identificar, analizar y priorizar las necesidades de capacitación docente en las carreras ofertadas por el Instituto Superior Tecnológico Quito Metropolitano (ITSQMET), en el marco de la función sustantiva de docencia, a partir del análisis integrado de encuestas institucionales, reuniones académicas con docentes, mallas curriculares, Planes de Enseñanza–Aprendizaje (PEA) y criterio de los coordinadores de carrera, con el fin de generar un insumo técnico que sustente la planificación académica y la formulación posterior del Plan de Capacitación Docente.';
    INTRO.specificObjectives[1]='Analizar las necesidades detectadas a partir de información cualitativa y cuantitativa obtenida mediante encuestas institucionales, reuniones académicas con docentes, revisión de mallas curriculares y Planes de Enseñanza–Aprendizaje (PEA), así como del criterio de los coordinadores de carrera.';
  }

  // 2) Párrafos del PDF justificados. Evita la alineación izquierda usada en la versión inicial.
  if(typeof writeParagraph==='function'){
    writeParagraph=function(doc,text,y){
      doc.setFont('helvetica','normal');
      doc.setFontSize(9.5);
      const width=180,lineH=4.6;
      const lines=doc.splitTextToSize(String(text??''),width);
      let pos=0;
      while(pos<lines.length){
        if(y>276){doc.addPage();y=18;}
        const capacity=Math.max(1,Math.floor((280-y)/lineH));
        const chunk=lines.slice(pos,pos+capacity);
        doc.text(chunk,15,y,{maxWidth:width,align:'justify',lineHeightFactor:1.15});
        y+=chunk.length*lineH;
        pos+=chunk.length;
        if(pos<lines.length){doc.addPage();y=18;}
      }
      return y+2.5;
    };
  }

  state.institutionalConfig=state.institutionalConfig||{};
  if(!state.institutionalConfig.specificTypePercentageRule) state.institutionalConfig.specificTypePercentageRule='pending';

  function analyzedCareersLocal(){return activeCareers().filter(c=>careerCandidates(c.name).length===5);}
  function linkFor(career){return state.results?.careerLinks?.find(r=>normalized(r.CARRERA)===normalized(career));}

  function injectClassificationCard(){
    const view=document.getElementById('view-dnc-resultados');
    if(!view||document.getElementById('specificTrainingTypeCard'))return;
    const issues=document.getElementById('resultsIssues');
    const card=document.createElement('article');
    card.id='specificTrainingTypeCard';
    card.className='card mt-24';
    card.innerHTML=`<div class="section-title-row"><div><h3>Clasificación de capacitaciones específicas</h3><p>Dato de la Sección 5.3 utilizado por el Resumen Ejecutivo. No se calcula a partir del nombre de la capacitación.</p></div></div><div class="candidate-actions mt-24"><button class="btn btn-light" id="downloadSpecificTypesBtn">Descargar plantilla</button><label class="btn btn-secondary file-label">Subir Excel<input id="specificTypesInput" type="file" hidden accept=".xlsx,.xls"></label></div><div id="specificTypesImportResult"></div>`;
    if(issues) view.insertBefore(card,issues); else view.appendChild(card);
    document.getElementById('downloadSpecificTypesBtn').addEventListener('click',downloadSpecificTypes);
    document.getElementById('specificTypesInput').addEventListener('change',e=>e.target.files[0]&&importSpecificTypes(e.target.files[0]));
  }

  function downloadSpecificTypes(){
    const rows=analyzedCareersLocal().map(c=>{
      const l=linkFor(c.name)||{};
      return {CARRERA:c.name,CAPACITACION_PRIORITARIA:l.CAPACITACION_PRIORITARIA||'',TIPO_CAPACITACION_PRIORIZADA:l.TIPO_CAPACITACION_PRIORIZADA||''};
    });
    if(!rows.length)rows.push({CARRERA:'Ejemplo de carrera',CAPACITACION_PRIORITARIA:'Capacitación priorizada',TIPO_CAPACITACION_PRIORIZADA:'Tipo institucional'});
    downloadJson(rows,'Clasificacion_Especificas',`Plantilla_Clasificacion_Capacitaciones_Especificas_${state.period?.id||'Periodo'}.xlsx`);
  }

  async function importSpecificTypes(file){
    if(!ensureEditable())return;
    try{
      const rows=await readExcel(file),good=[],bad=[];
      rows.forEach((r,idx)=>{
        const career=String(r.CARRERA||'').trim(),training=String(r.CAPACITACION_PRIORITARIA||'').trim(),type=String(r.TIPO_CAPACITACION_PRIORIZADA||'').trim();
        const link=linkFor(career);
        if(!link){bad.push({...r,FILA_EXCEL:idx+2,ERROR:'La carrera no tiene vinculación cargada en la Sección 5.3'});return;}
        if(!training||normalized(training)!==normalized(link.CAPACITACION_PRIORITARIA)){bad.push({...r,FILA_EXCEL:idx+2,ERROR:'CAPACITACION_PRIORITARIA no coincide con la registrada en la Sección 5.3'});return;}
        if(!type){bad.push({...r,FILA_EXCEL:idx+2,ERROR:'TIPO_CAPACITACION_PRIORIZADA es obligatorio'});return;}
        link.TIPO_CAPACITACION_PRIORIZADA=type;good.push(r);
      });
      saveState();
      showImportResult('specificTypesImportResult',good.length,bad,()=>downloadJson(bad,'Corregir','Correccion_Clasificacion_Capacitaciones_Especificas.xlsx'));
      toast(`Clasificación de capacitaciones específicas: ${good.length} fila(s) procesada(s).`);
    }catch(e){console.error(e);toast('No se pudo leer la plantilla de clasificación de capacitaciones específicas.');}
  }

  function injectRuleConfig(){
    const cfgView=document.getElementById('view-configuracion');
    if(!cfgView||document.getElementById('specificTypeRuleConfig'))return;
    const card=document.createElement('article');
    card.id='specificTypeRuleConfig';card.className='card mt-24';
    card.innerHTML=`<h3>Regla institucional para porcentajes por tipo de capacitación específica</h3><p>El documento fuente no explicita la fórmula de los porcentajes de caracterización. La app no la inventa: debe quedar validada institucionalmente.</p><label>Regla de cálculo<select id="specificTypeRule" style="display:block;width:100%;max-width:560px;margin-top:8px;border:1px solid var(--line);border-radius:9px;padding:10px;background:#fff"><option value="pending">Pendiente de validación</option><option value="by_count">Por número de capacitaciones específicas priorizadas: cantidad del tipo / total × 100</option></select></label><div class="form-actions"><button class="btn btn-primary" id="saveSpecificTypeRule">Guardar regla</button></div>`;
    cfgView.appendChild(card);
    document.getElementById('specificTypeRule').value=state.institutionalConfig.specificTypePercentageRule||'pending';
    document.getElementById('saveSpecificTypeRule').addEventListener('click',()=>{
      if(!ensureEditable())return;
      state.institutionalConfig.specificTypePercentageRule=document.getElementById('specificTypeRule').value;
      saveState();toast('Regla institucional guardada.');
    });
  }

  const baseValidate=validateDncForFinal;
  validateDncForFinal=function(){
    const issues=[...baseValidate()];
    analyzedCareersLocal().forEach(c=>{
      const l=linkFor(c.name);
      if(l?.CAPACITACION_PRIORITARIA&&!String(l.TIPO_CAPACITACION_PRIORIZADA||'').trim()) issues.push(`${c.name}: falta TIPO_CAPACITACION_PRIORIZADA para el resumen ejecutivo.`);
    });
    if((state.institutionalConfig.specificTypePercentageRule||'pending')==='pending') issues.push('Falta validar la regla institucional para calcular porcentajes por tipo de capacitación específica.');
    return [...new Set(issues)];
  };

  const baseRenderAll=renderAll;
  renderAll=function(){
    baseRenderAll();
    injectClassificationCard();injectRuleConfig();
    const s=document.getElementById('specificTypeRule');if(s)s.value=state.institutionalConfig.specificTypePercentageRule||'pending';
  };

  renderAll();
})();
