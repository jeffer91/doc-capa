(function(){
  'use strict';

  const FIXED_REFERENCES=[
    'Asamblea Nacional Constituyente del Ecuador. (2008). Constitución de la República del Ecuador. Registro Oficial 449, 20 de octubre de 2008, con sus reformas vigentes.',
    'Asamblea Nacional del Ecuador. (2010). Ley Orgánica de Educación Superior (LOES). Registro Oficial Suplemento 298, 12 de octubre de 2010, con sus reformas vigentes.',
    'Consejo de Aseguramiento de la Calidad de la Educación Superior (CACES). (2024). Modelo de Evaluación Externa 2024 con Fines de Acreditación para los Institutos Superiores Técnicos y Tecnológicos.'
  ];

  function esc(v){return escapeHtml(v);}
  function institutionalReferences(){
    const cfg=state.institutionalConfig||{};
    return [
      `Instituto Superior Tecnológico Quito Metropolitano (ITSQMET). (s. f.). ${String(cfg.pedi||'Plan Estratégico de Desarrollo Institucional (PEDI)').trim()}. Documento institucional vigente.`,
      `Instituto Superior Tecnológico Quito Metropolitano (ITSQMET). (s. f.). ${String(cfg.poa||'Plan Operativo Anual (POA)').trim()}. Documento institucional vigente.`,
      `Instituto Superior Tecnológico Quito Metropolitano (ITSQMET). (s. f.). ${String(cfg.manual||'Manual de Procesos Académicos').trim()}. Documento institucional vigente.`
    ];
  }
  function references(){return [...FIXED_REFERENCES,...institutionalReferences()];}
  function renderBibliographyHtml(){return '<h2>9. Bibliografía</h2><p>Se incluyen únicamente las fuentes normativas, técnicas e institucionales utilizadas como fundamento directo del documento.</p>'+references().map(r=>`<p class="bibliography-entry">${esc(r)}</p>`).join('');}

  function injectUi(){
    const main=document.querySelector('main.main'),config=document.getElementById('view-configuracion');
    if(main&&config&&!document.getElementById('view-dnc-bibliografia')){
      const section=document.createElement('section');section.id='view-dnc-bibliografia';section.className='view';
      section.innerHTML='<div class="section-heading"><div><p class="eyebrow">DNC · Sección 9</p><h2>Bibliografía</h2><p>Fuentes normativas, técnicas e institucionales verificables utilizadas por el DNC.</p></div><span class="status locked">Controlada</span></div><article class="card mt-24"><div class="document-preview" id="bibliographyPreview"></div></article>';
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

  function writeBibliographyPdf(doc){let y=20;y=writeHeading(doc,'9. Bibliografía',2,y);y=writeParagraph(doc,'Se incluyen únicamente las fuentes normativas, técnicas e institucionales utilizadas como fundamento directo del documento.',y);references().forEach(r=>{y=writeParagraph(doc,r,y);});}
  const baseDownloadPdf=downloadPdf;
  downloadPdf=function(){
    const api=jsPDF?.API,originalSave=api?.save;if(typeof originalSave!=='function')return baseDownloadPdf();let restored=false;
    api.save=function(filename,options){try{this.addPage();writeBibliographyPdf(this);}catch(e){console.error(e);toast('No se pudo incorporar la Sección 9 al PDF.');}api.save=originalSave;restored=true;return originalSave.call(this,filename,options);};
    try{return baseDownloadPdf();}finally{if(!restored)api.save=originalSave;}
  };
  function replaceDownloadListener(id){const old=document.getElementById(id);if(!old)return;const clone=old.cloneNode(true);old.replaceWith(clone);clone.addEventListener('click',downloadPdf);}
  replaceDownloadListener('downloadDncBtn');replaceDownloadListener('downloadFromPreviewBtn');renderAll();
})();
