(function(){
  'use strict';

  const REFERENCES=[
    'CACES. (2024). Modelo de evaluación externa de la calidad de la educación superior. Consejo de Aseguramiento de la Calidad de la Educación Superior.',
    'Coll, C. (2018). Aprender y enseñar con las TIC: expectativas, realidad y potencialidades. Ediciones Morata.',
    'Delors, J. (1996). La educación encierra un tesoro. UNESCO.',
    'Díaz Barriga, F., & Hernández, G. (2010). Estrategias docentes para un aprendizaje significativo: una interpretación constructivista (3.ª ed.). McGraw-Hill.',
    'Fernández, M., & Montero, L. (2007). La formación del profesorado: nuevas perspectivas. Graó.',
    'García Aretio, L. (2014). Bases, mediaciones y futuro de la educación a distancia en la sociedad digital. Síntesis.',
    'Imbernón, F. (2011). Formación docente y profesional: formar para la innovación. Graó.',
    'LOES. (2018). Ley Orgánica de Educación Superior. Registro Oficial del Ecuador.',
    'Marcelo, C. (2009). Desarrollo profesional docente: pasado y futuro. Revista de Educación, 350, 15–35.',
    'Ministerio de Educación del Ecuador. (2016). Lineamientos para la aplicación del Diseño Universal para el Aprendizaje (DUA). MINEDUC.',
    'Morin, E. (2001). Los siete saberes necesarios para la educación del futuro. UNESCO.',
    'OCDE. (2019). Panorama de la educación: indicadores de la OCDE. OECD Publishing.',
    'Perrenoud, P. (2004). Diez nuevas competencias para enseñar. Graó.',
    'Rué, J. (2012). La formación docente en la universidad: desafíos y propuestas. Octaedro.',
    'Salinas, J. (2011). Innovación docente y uso de las TIC en educación superior. Universidad de las Islas Baleares.',
    'Zabalza, M. A. (2012). Competencias docentes del profesorado universitario: calidad y desarrollo profesional. Narcea.'
  ];

  function esc(v){return escapeHtml(v);}
  function renderBibliographyHtml(){return '<h2>9. Bibliografía</h2>'+REFERENCES.map(r=>`<p class="bibliography-entry">${esc(r)}</p>`).join('');}

  function injectUi(){
    const main=document.querySelector('main.main'),config=document.getElementById('view-configuracion');
    if(main&&config&&!document.getElementById('view-dnc-bibliografia')){
      const section=document.createElement('section');section.id='view-dnc-bibliografia';section.className='view';
      section.innerHTML='<div class="section-heading"><div><p class="eyebrow">DNC · Sección 9</p><h2>Bibliografía</h2><p>Bibliografía institucional del documento base.</p></div><span class="status locked">Controlada</span></div><article class="card mt-24"><div class="document-preview" id="bibliographyPreview"></div></article>';
      main.insertBefore(section,config);
    }
    if(!document.getElementById('bibliographyStyles')){
      const st=document.createElement('style');st.id='bibliographyStyles';st.textContent='.bibliography-entry{padding-left:18px;text-indent:-18px;margin-bottom:9px!important}';document.head.appendChild(st);
    }
  }

  function renderUi(){injectUi();const el=document.getElementById('bibliographyPreview');if(el)el.innerHTML=renderBibliographyHtml();}
  const baseRenderAll=renderAll;renderAll=function(){baseRenderAll();renderUi();};
  const baseNavigate=navigate;navigate=function(view){baseNavigate(view);if(view==='dnc-bibliografia')document.getElementById('pageTitle').textContent='DNC · Bibliografía';};
  const baseValidate=validateDncForFinal;
  validateDncForFinal=function(){return [...new Set(baseValidate().filter(x=>!(String(x).includes('Sección 7')&&String(x).includes('pendiente de implementación'))&&!(String(x).includes('Sección 9')&&String(x).includes('pendiente de implementación'))))];};
  const baseBuildPrint=buildPrintDocument;buildPrintDocument=function(){return baseBuildPrint()+`<section class="doc-content doc-page">${renderBibliographyHtml()}</section>`;};

  function writeBibliographyPdf(doc){let y=20;y=writeHeading(doc,'9. Bibliografía',2,y);REFERENCES.forEach(r=>{y=writeParagraph(doc,r,y);});}
  const baseDownloadPdf=downloadPdf;
  downloadPdf=function(){
    const api=jsPDF?.API,originalSave=api?.save;if(typeof originalSave!=='function')return baseDownloadPdf();let restored=false;
    api.save=function(filename,options){try{this.addPage();writeBibliographyPdf(this);}catch(e){console.error(e);toast('No se pudo incorporar la Sección 9 al PDF.');}api.save=originalSave;restored=true;return originalSave.call(this,filename,options);};
    try{return baseDownloadPdf();}finally{if(!restored)api.save=originalSave;}
  };
  function replaceDownloadListener(id){const old=document.getElementById(id);if(!old)return;const clone=old.cloneNode(true);old.replaceWith(clone);clone.addEventListener('click',downloadPdf);}
  replaceDownloadListener('downloadDncBtn');replaceDownloadListener('downloadFromPreviewBtn');renderAll();
})();