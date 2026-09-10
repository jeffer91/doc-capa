(function(){
  'use strict';

  // Mantiene coherencia entre Introducción y las cinco fuentes realmente usadas en Metodología.
  if(typeof INTRO!=='undefined'){
    INTRO.justification[1]='El presente informe se justifica como un instrumento técnico-diagnóstico que permite reconocer, analizar y priorizar las necesidades reales de capacitación docente, a partir de evidencia institucional y del criterio académico de los actores directamente involucrados en los procesos formativos. Este diagnóstico se sustenta en el análisis conjunto de encuestas institucionales, reuniones académicas con docentes, revisión de mallas curriculares y Planes de Enseñanza–Aprendizaje (PEA), así como del criterio de los coordinadores de carrera, lo que garantiza una aproximación contextualizada y alineada con la realidad académica de cada carrera.';
    INTRO.generalObjective='Identificar, analizar y priorizar las necesidades de capacitación docente en las carreras ofertadas por el Instituto Superior Tecnológico Quito Metropolitano (ITSQMET), en el marco de la función sustantiva de docencia, a partir del análisis integrado de encuestas institucionales, reuniones académicas con docentes, mallas curriculares, Planes de Enseñanza–Aprendizaje (PEA) y criterio de los coordinadores de carrera, con el fin de generar un insumo técnico que sustente la planificación académica y la formulación posterior del Plan de Capacitación Docente.';
    INTRO.specificObjectives[1]='Analizar las necesidades detectadas a partir de información cualitativa y cuantitativa obtenida mediante encuestas institucionales, reuniones académicas con docentes, revisión de mallas curriculares y Planes de Enseñanza–Aprendizaje (PEA), así como del criterio de los coordinadores de carrera.';
  }

  // Los párrafos del PDF institucional deben salir justificados.
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
})();
