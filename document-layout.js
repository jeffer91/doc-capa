(function(){
  'use strict';

  const core=window.DOC_CAPA_CORE;
  if(!core){console.error('DOC-CAPA layout: Core documental no disponible.');return;}

  const DOCUMENT_ID='capacitacion-deteccion';
  const SECTION_IDS=['portada','introduccion','base-legal','alineacion','metodologia','resultados','resumen','conclusiones','recomendaciones','bibliografia','anexos'];
  const specializedPdfEngine=typeof window.downloadPdf==='function'?window.downloadPdf:null;
  const fallbackPrintBuilder=typeof window.buildPrintDocument==='function'?window.buildPrintDocument:null;
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(v):String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));

  const DEFAULT_META={
    header:{
      unit:'Unidad de Gestión de Procesos Académicos',
      documentName:'Detección de Necesidades de Capacitación',
      codePrefix:'UGPA-RGI1-01-PRO-70',
      showPeriod:true
    },
    cover:{
      title:'Detección de Necesidades de Capacitación',
      subtitle:'',
      elaborated:{name:'Mgs. Jefferson Villarreal',role:'Gestor de Procesos Académicos'},
      reviewed:{name:'Ing. Martha Tomalá',role:'Coordinadora General de Carreras'},
      approved:{name:'Dr. Alex León',role:'Vicerrector'}
    }
  };

  function mergePerson(base,value){return{...base,...(value||{})};}
  function ensureMeta(){
    const raw=state.documentMeta||{};
    state.documentMeta={
      ...raw,
      header:{...DEFAULT_META.header,...(raw.header||{})},
      cover:{
        ...DEFAULT_META.cover,
        ...(raw.cover||{}),
        elaborated:mergePerson(DEFAULT_META.cover.elaborated,raw.cover?.elaborated),
        reviewed:mergePerson(DEFAULT_META.cover.reviewed,raw.cover?.reviewed),
        approved:mergePerson(DEFAULT_META.cover.approved,raw.cover?.approved)
      }
    };
    return state.documentMeta;
  }

  function periodText(){
    if(state.period&&typeof periodLabel==='function')return periodLabel();
    return state.period?.label||'Período pendiente';
  }
  function codeText(){const h=ensureMeta().header,suffix=state.period?.start||'AAAA-MM';return`${String(h.codePrefix||'').replace(/-+$/,'')}-${suffix}`;}
  function coverSubtitle(){const c=ensureMeta().cover;return String(c.subtitle||'').trim()||periodText();}

  function headerHtml(){
    const h=ensureMeta().header,p=periodText(),logo=state.logo?`<img src="${state.logo}" alt="Logo institucional">`:'<span class="rgi-logo-placeholder">LOGOTIPO<br>ITSQMET</span>';
    return `<div class="rgi-head document-header-component" data-document-component="cabecera"><div class="rgi-logo">${logo}</div><div class="rgi-center"><div class="rgi-unit">${esc(h.unit)}</div><div class="rgi-doc">${esc(h.documentName)}${h.showPeriod?`<br>${esc(p)}`:''}</div></div><div class="rgi-code"><div><strong>Código:</strong><br>${esc(codeText())}</div></div></div>`;
  }
  function signatureHtml(label,person){return`<div class="signature-col"><div class="signature-space">${esc(label)}</div><div><strong>NOMBRE:</strong> ${esc(person.name)}</div><div><strong>CARGO:</strong> ${esc(person.role)}</div></div>`;}
  function renderCoverHtml(){
    const c=ensureMeta().cover;
    return `<section class="doc-cover" data-document-section="portada">${headerHtml()}<div class="cover-title"><h1>${esc(c.title)}</h1><h2>${esc(coverSubtitle())}</h2></div><div class="signature-grid">${signatureHtml('ELABORADO POR:',c.elaborated)}${signatureHtml('REVISADO POR:',c.reviewed)}${signatureHtml('APROBADO POR:',c.approved)}</div></section>`;
  }

  function imageType(src){const t=String(src||'').match(/^data:image\/([^;]+)/i)?.[1]?.toUpperCase()||'PNG';return t==='JPG'?'JPEG':t;}
  function drawHeaderPdf(doc,period=periodText()){
    const h=ensureMeta().header,x=15,y=15,h1=8,h2=20;
    doc.setDrawColor(0);doc.setLineWidth(.25);doc.rect(x,y,45,h1+h2);doc.rect(x+45,y,90,h1);doc.rect(x+45,y+h1,90,h2);doc.rect(x+135,y,45,h1+h2);
    if(state.logo){try{doc.addImage(state.logo,imageType(state.logo),x+4,y+4,37,18,undefined,'FAST');}catch(e){console.warn('No se pudo incorporar el logo a la cabecera.',e);}}
    else{doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('ITSQMET',x+22.5,y+14,{align:'center'});}
    doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.text(String(h.unit||''),x+90,y+5.2,{align:'center',maxWidth:84});
    doc.setFontSize(8.2);doc.text(String(h.documentName||''),x+90,y+13.5,{align:'center',maxWidth:84});
    if(h.showPeriod){doc.setFont('helvetica','normal');doc.setFontSize(7.8);doc.text(String(period||''),x+90,y+20,{align:'center',maxWidth:84});}
    doc.setFont('helvetica','normal');doc.setFontSize(7.2);const codeLines=doc.splitTextToSize(`Código:\n${codeText()}`,40);doc.text(codeLines,x+157.5,y+8,{align:'center'});
  }
  function drawCoverPdf(doc){
    const c=ensureMeta().cover;drawHeaderPdf(doc,periodText());
    doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text(String(c.title||''),105,132,{align:'center',maxWidth:170});doc.setFontSize(15);doc.text(String(coverSubtitle()),105,144,{align:'center',maxWidth:170});
    const y=238,x=15,col=60;doc.rect(x,y,180,42);doc.line(x+col,y,x+col,y+42);doc.line(x+col*2,y,x+col*2,y+42);doc.line(x,y+24,x+180,y+24);doc.line(x,y+31.5,x+180,y+31.5);
    const rows=[['ELABORADO POR:',c.elaborated],['REVISADO POR:',c.reviewed],['APROBADO POR:',c.approved]];
    rows.forEach((r,i)=>{const cx=x+i*col+2,p=r[1];doc.setFontSize(7.2);doc.setFont('helvetica','bold');doc.text(r[0],cx,y+5);doc.text('NOMBRE:',cx,y+29);doc.text('CARGO:',cx,y+36);doc.setFont('helvetica','normal');doc.text(doc.splitTextToSize(String(p.name||''),42),cx+14,y+29);doc.text(doc.splitTextToSize(String(p.role||''),42),cx+12,y+36);});
  }

  // Estas funciones son los únicos renderizadores públicos de portada/cabecera que debe consumir el motor especializado.
  window.drawRgiHeader=drawHeaderPdf;
  window.drawCover=drawCoverPdf;

  function exactPdf(name){return(doc)=>{const fn=window[name];if(typeof fn!=='function')throw new Error(`Renderer PDF no disponible: ${name}`);fn(doc);};}
  function registerCanonicalManifest(){
    const current=core.getDocument(DOCUMENT_ID)||{};
    core.registerDocument({
      id:DOCUMENT_ID,
      appId:current.appId||'capacitacion',
      title:current.title||'Detección de Necesidades de Capacitación',
      templateVersion:current.templateVersion||'DNC-2026.09.2',
      diagnostics:current.diagnostics,
      sections:[
        {id:'portada',title:'Portada',kind:'cover',render:renderCoverHtml,pdfRenderer:drawCoverPdf},
        {id:'introduccion',title:'1. Introducción',elementId:'introPreview',pdfRenderer:exactPdf('writeIntroPdf')},
        {id:'base-legal',title:'2. Base Legal',elementId:'legalPreview',pdfRenderer:exactPdf('writeLegalPdf')},
        {id:'alineacion',title:'3. Alineación Institucional',elementId:'alignmentPreview',pdfRenderer:exactPdf('writeAlignmentPdf')},
        {id:'metodologia',title:'4. Metodología del Diagnóstico',elementId:'methodPreview',pdfRenderer:exactPdf('writeMethodPdf')},
        {id:'resultados',title:'5. Resultados del Diagnóstico',elementId:'resultsPreview'},
        {id:'resumen',title:'6. Resumen Ejecutivo',elementId:'summaryPreview'},
        {id:'conclusiones',title:'7. Conclusiones',elementId:'conclusionsPreview'},
        {id:'recomendaciones',title:'8. Recomendaciones',elementId:'recommendationsPreview'},
        {id:'bibliografia',title:'9. Bibliografía',elementId:'bibliographyPreview'},
        {id:'anexos',title:'10. Anexos',elementId:'annexesPreview'}
      ]
    });
  }

  function buildCanonicalPrintDocument(){
    const snapshots=SECTION_IDS.map(id=>core.sectionSnapshot(DOCUMENT_ID,id));
    if(snapshots.every(x=>x.found))return snapshots.map(x=>x.html).join('');
    console.warn('Se usa el constructor de vista completa de compatibilidad porque una sección independiente no está disponible.',snapshots.filter(x=>!x.found));
    return fallbackPrintBuilder?fallbackPrintBuilder():snapshots.filter(x=>x.found).map(x=>x.html).join('');
  }
  window.buildPrintDocument=buildCanonicalPrintDocument;

  function downloadCanonicalPdf(){
    ensureMeta();
    if(!specializedPdfEngine){toast?.('No está disponible el motor PDF institucional.');return false;}
    const snapshot=core.documentSnapshot(DOCUMENT_ID);
    if(!snapshot?.htmlComplete){toast?.('No se puede generar el PDF: existe una sección documental incompleta.');return false;}
    const issues=typeof validateDncForFinal==='function'?validateDncForFinal():[];
    if(issues.length&&state.dncStatus!=='approved')toast?.(`PDF de trabajo: ${issues[0]}`);
    return specializedPdfEngine();
  }
  window.downloadPdf=downloadCanonicalPdf;

  function replaceClick(id,handler){const old=document.getElementById(id);if(!old)return;const clone=old.cloneNode(true);old.replaceWith(clone);clone.addEventListener('click',handler);}
  function bindCanonicalOutput(){['downloadDncBtn','downloadFromPreviewBtn','workflowPdfBtn'].forEach(id=>replaceClick(id,downloadCanonicalPdf));}

  function saveContext(){try{window.DOC_CAPA_GOVERNANCE?.saveContext?.();}catch(e){console.warn('No se pudo guardar el contexto documental del período.',e);}}
  function persist(scope){try{saveState();saveContext();core.clearDirty?.(scope);}catch(e){console.error(e);toast?.('No se pudo guardar la configuración documental.');return false;}return true;}

  function injectStyles(){if(document.getElementById('documentLayoutStyles'))return;const st=document.createElement('style');st.id='documentLayoutStyles';st.textContent=`
    .document-layout-shell{max-width:1120px;margin:0 auto}.document-layout-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(360px,.9fr);gap:18px}.document-layout-form{display:grid;grid-template-columns:1fr 1fr;gap:12px}.document-layout-form label.full{grid-column:1/-1}.document-layout-form input{display:block;width:100%;margin-top:6px;border:1px solid var(--line);border-radius:9px;padding:10px;background:#fff}.layout-preview{background:#fff;border:1px solid var(--line);border-radius:13px;padding:18px;overflow:auto}.layout-preview .doc-cover{min-height:720px;transform-origin:top center}.layout-preview .document-header-component{margin-bottom:18px}.layout-save-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.layout-help{font-size:11px;color:var(--muted);margin-top:8px}.document-layout-form .check-line{display:flex;align-items:center;gap:8px}.document-layout-form .check-line input{width:auto;margin:0}.layout-person-title{grid-column:1/-1;margin:8px 0 -2px;font-size:11px;font-weight:900;color:var(--navy);text-transform:uppercase;letter-spacing:.04em}.layout-logo-preview{min-height:105px;border:1px dashed #b7c2d0;border-radius:10px;display:grid;place-items:center;background:#fafbfd;padding:10px;margin-top:10px}.layout-logo-preview img{max-width:220px;max-height:90px;object-fit:contain}@media(max-width:900px){.document-layout-grid,.document-layout-form{grid-template-columns:1fr}.document-layout-form label.full,.layout-person-title{grid-column:auto}}
  `;document.head.appendChild(st);}

  function injectNavigation(){
    const nav=document.querySelector('.sidebar .nav');if(!nav)return;
    if(nav.querySelector('[data-document-layout="portada"]'))return;
    const config=nav.querySelector('[data-workflow-view="configuracion"],[data-view="configuracion"]');
    const portada=document.createElement('button');portada.className='nav-item';portada.dataset.documentLayout='portada';portada.textContent='Portada';
    const cabecera=document.createElement('button');cabecera.className='nav-item';cabecera.dataset.documentLayout='cabecera';cabecera.textContent='Cabecera';
    if(config){nav.insertBefore(portada,config);nav.insertBefore(cabecera,config);}else{nav.append(portada,cabecera);}
    const go=(view,title,btn)=>{navigate(view);const page=document.getElementById('pageTitle');if(page)page.textContent=title;nav.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));btn.classList.add('active');};
    portada.addEventListener('click',()=>go('documento-portada','Portada del documento',portada));cabecera.addEventListener('click',()=>go('documento-cabecera','Cabecera del documento',cabecera));
  }

  function injectViews(){
    const main=document.querySelector('main.main'),anchor=document.getElementById('view-dnc-operacion')||document.getElementById('view-dnc-introduccion')||document.getElementById('view-configuracion');if(!main||!anchor)return;
    if(!document.getElementById('view-documento-portada')){
      const v=document.createElement('section');v.id='view-documento-portada';v.className='view';v.innerHTML=`<div class="document-layout-shell"><div class="section-heading"><div><p class="eyebrow">Documento · Componente</p><h2>Portada</h2><p>Configura título, subtítulo y responsables de la portada institucional del período activo.</p></div><span class="status ready">Por período</span></div><div class="document-layout-grid mt-24"><article class="card"><h3>Datos de portada</h3><div class="document-layout-form"><label class="full">Título<input id="coverTitleInput" type="text"></label><label class="full">Subtítulo opcional<input id="coverSubtitleInput" type="text" placeholder="Vacío = período activo"></label><div class="layout-person-title">Elaborado por</div><label>Nombre<input id="coverElaboratedName" type="text"></label><label>Cargo<input id="coverElaboratedRole" type="text"></label><div class="layout-person-title">Revisado por</div><label>Nombre<input id="coverReviewedName" type="text"></label><label>Cargo<input id="coverReviewedRole" type="text"></label><div class="layout-person-title">Aprobado por</div><label>Nombre<input id="coverApprovedName" type="text"></label><label>Cargo<input id="coverApprovedRole" type="text"></label></div><div class="layout-save-row"><button class="btn btn-primary" id="saveCoverConfigBtn">Guardar portada</button></div><p class="layout-help">La configuración queda asociada al período y entra en la copia oficial al aprobar el DNC.</p></article><article class="layout-preview"><div id="coverComponentPreview"></div></article></div></div>`;main.insertBefore(v,anchor);
    }
    if(!document.getElementById('view-documento-cabecera')){
      const v=document.createElement('section');v.id='view-documento-cabecera';v.className='view';v.innerHTML=`<div class="document-layout-shell"><div class="section-heading"><div><p class="eyebrow">Documento · Componente</p><h2>Cabecera</h2><p>Configura la cabecera RGI de forma independiente de la portada.</p></div><span class="status ready">Por período</span></div><div class="document-layout-grid mt-24"><article class="card"><h3>Datos de cabecera</h3><div class="document-layout-form"><label class="full">Unidad responsable<input id="headerUnitInput" type="text"></label><label class="full">Nombre del documento<input id="headerDocumentNameInput" type="text"></label><label class="full">Código base<input id="headerCodePrefixInput" type="text" placeholder="UGPA-RGI1-01-PRO-70"></label><label class="full check-line"><input id="headerShowPeriodInput" type="checkbox"> Mostrar período en la cabecera</label></div><div class="layout-save-row"><label class="btn btn-secondary file-label">Cargar logotipo<input id="documentHeaderLogoInput" type="file" hidden accept="image/png,image/jpeg,image/webp"></label><button class="btn btn-light" id="removeDocumentHeaderLogoBtn">Quitar logotipo</button><button class="btn btn-primary" id="saveHeaderConfigBtn">Guardar cabecera</button></div><div class="layout-logo-preview" id="documentHeaderLogoPreview"></div><p class="layout-help">El sufijo del código se completa automáticamente con el mes/año inicial del período.</p></article><article class="layout-preview"><div id="headerComponentPreview"></div></article></div></div>`;main.insertBefore(v,anchor);
    }
  }

  function fillInputs(){
    const m=ensureMeta(),h=m.header,c=m.cover,set=(id,val)=>{const el=document.getElementById(id);if(el&&document.activeElement!==el)el.value=val??'';};
    set('coverTitleInput',c.title);set('coverSubtitleInput',c.subtitle);set('coverElaboratedName',c.elaborated.name);set('coverElaboratedRole',c.elaborated.role);set('coverReviewedName',c.reviewed.name);set('coverReviewedRole',c.reviewed.role);set('coverApprovedName',c.approved.name);set('coverApprovedRole',c.approved.role);set('headerUnitInput',h.unit);set('headerDocumentNameInput',h.documentName);set('headerCodePrefixInput',h.codePrefix);
    const show=document.getElementById('headerShowPeriodInput');if(show)show.checked=h.showPeriod!==false;
  }
  function renderPreviews(){
    const cover=document.getElementById('coverComponentPreview');if(cover)cover.innerHTML=renderCoverHtml();const header=document.getElementById('headerComponentPreview');if(header)header.innerHTML=headerHtml();const logo=document.getElementById('documentHeaderLogoPreview');if(logo)logo.innerHTML=state.logo?`<img src="${state.logo}" alt="Logo institucional">`:'<span class="tiny">Sin logotipo cargado</span>';
  }
  function renderLayout(){fillInputs();renderPreviews();}

  function bindForms(){
    if(document.documentElement.dataset.documentLayoutBound==='1')return;document.documentElement.dataset.documentLayoutBound='1';
    const dirtyIds=['coverTitleInput','coverSubtitleInput','coverElaboratedName','coverElaboratedRole','coverReviewedName','coverReviewedRole','coverApprovedName','coverApprovedRole','headerUnitInput','headerDocumentNameInput','headerCodePrefixInput','headerShowPeriodInput'];dirtyIds.forEach(id=>document.getElementById(id)?.addEventListener('input',()=>core.markDirty?.('document-layout')));
    document.getElementById('saveCoverConfigBtn')?.addEventListener('click',()=>{if(typeof ensureEditable==='function'&&!ensureEditable())return;const c=ensureMeta().cover;c.title=document.getElementById('coverTitleInput').value.trim()||DEFAULT_META.cover.title;c.subtitle=document.getElementById('coverSubtitleInput').value.trim();c.elaborated={name:document.getElementById('coverElaboratedName').value.trim(),role:document.getElementById('coverElaboratedRole').value.trim()};c.reviewed={name:document.getElementById('coverReviewedName').value.trim(),role:document.getElementById('coverReviewedRole').value.trim()};c.approved={name:document.getElementById('coverApprovedName').value.trim(),role:document.getElementById('coverApprovedRole').value.trim()};if(persist('document-layout')){registerCanonicalManifest();renderPreviews();toast?.('Portada guardada para el período activo.');}});
    document.getElementById('saveHeaderConfigBtn')?.addEventListener('click',()=>{if(typeof ensureEditable==='function'&&!ensureEditable())return;const h=ensureMeta().header;h.unit=document.getElementById('headerUnitInput').value.trim()||DEFAULT_META.header.unit;h.documentName=document.getElementById('headerDocumentNameInput').value.trim()||DEFAULT_META.header.documentName;h.codePrefix=document.getElementById('headerCodePrefixInput').value.trim()||DEFAULT_META.header.codePrefix;h.showPeriod=document.getElementById('headerShowPeriodInput').checked;if(persist('document-layout')){registerCanonicalManifest();renderPreviews();toast?.('Cabecera guardada para el período activo.');}});
    document.getElementById('documentHeaderLogoInput')?.addEventListener('change',e=>{const file=e.target.files?.[0];if(!file||typeof ensureEditable==='function'&&!ensureEditable())return;const reader=new FileReader();reader.onload=()=>{state.logo=reader.result;if(persist('document-layout')){renderPreviews();toast?.('Logotipo institucional actualizado.');}};reader.readAsDataURL(file);});
    document.getElementById('removeDocumentHeaderLogoBtn')?.addEventListener('click',()=>{if(typeof ensureEditable==='function'&&!ensureEditable())return;state.logo=null;if(persist('document-layout')){renderPreviews();toast?.('Logotipo retirado de la cabecera.');}});
  }

  function bootstrap(){
    ensureMeta();injectStyles();injectNavigation();injectViews();bindForms();registerCanonicalManifest();bindCanonicalOutput();renderLayout();
    try{saveState();saveContext();}catch(e){console.warn('No se pudo persistir la migración inicial de estructura documental.',e);}
  }

  bootstrap();
  window.addEventListener('doccapa:period-changed',()=>{ensureMeta();registerCanonicalManifest();renderLayout();bindCanonicalOutput();});
  window.addEventListener('doccapa:period-created',()=>{ensureMeta();renderLayout();});
  window.DOC_CAPA_LAYOUT={VERSION:'1.0.0',ensureMeta,renderCoverHtml,headerHtml,drawCoverPdf,drawHeaderPdf,buildPrintDocument:buildCanonicalPrintDocument,downloadPdf:downloadCanonicalPdf};
})();
