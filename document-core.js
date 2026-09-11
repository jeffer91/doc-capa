(function(){
  'use strict';

  const manifests=new Map();
  const calculations=new Map();
  const TRACE_STORAGE_KEY='doc-capa-import-trace-v1';
  const PERIOD_STATUSES=['active','closed','archived'];

  const clone=value=>JSON.parse(JSON.stringify(value));
  const esc=value=>String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  const safeName=value=>String(value||'documento').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');

  function activePeriodId(){
    return state?.period?.id||state?.period?.label||'sin-periodo';
  }

  function readTraceStore(){
    try{
      const raw=JSON.parse(localStorage.getItem(TRACE_STORAGE_KEY));
      return raw&&typeof raw==='object'?raw:{};
    }catch{return {};}
  }

  function writeTraceStore(store){
    localStorage.setItem(TRACE_STORAGE_KEY,JSON.stringify(store));
  }

  function recordImportTrace(key,meta={}){
    const periodId=activePeriodId();
    const store=readTraceStore();
    store[periodId]=store[periodId]||{};
    store[periodId][key]={
      ...store[periodId][key],
      ...meta,
      periodId,
      importedAt:new Date().toISOString()
    };
    writeTraceStore(store);
    window.dispatchEvent(new CustomEvent('doccapa:trace-updated',{detail:{periodId,key}}));
  }

  function getImportTrace(periodId=activePeriodId()){
    return clone(readTraceStore()[periodId]||{});
  }

  function registerCalculation(id,fn){
    if(!id||typeof fn!=='function')throw new Error('Cálculo inválido.');
    calculations.set(id,fn);
  }

  function calculate(id,...args){
    const fn=calculations.get(id);
    if(!fn)throw new Error(`Cálculo no registrado: ${id}`);
    return fn(...args);
  }

  function normalizeManifest(manifest){
    if(!manifest?.id||!manifest?.title||!Array.isArray(manifest.sections))throw new Error('Manifiesto documental inválido.');
    const ids=new Set();
    const sections=manifest.sections.map((section,index)=>{
      if(!section?.id||ids.has(section.id))throw new Error(`Sección inválida o duplicada en ${manifest.id}.`);
      ids.add(section.id);
      return {...section,order:index+1};
    });
    return {...manifest,sections};
  }

  function registerDocument(manifest){
    const normalized=normalizeManifest(manifest);
    manifests.set(normalized.id,normalized);
    window.dispatchEvent(new CustomEvent('doccapa:document-registered',{detail:{documentId:normalized.id}}));
    return normalized;
  }

  function getDocument(documentId){
    const manifest=manifests.get(documentId);
    return manifest?clone(manifest):null;
  }

  function buildDocumentFragment(){
    if(typeof buildPrintDocument!=='function')throw new Error('El documento todavía no dispone de una salida HTML consolidada.');
    const template=document.createElement('template');
    template.innerHTML=buildPrintDocument();
    return template.content;
  }

  function resolveSectionNode(documentId,sectionId){
    const manifest=manifests.get(documentId);
    if(!manifest)throw new Error(`Documento no registrado: ${documentId}`);
    const section=manifest.sections.find(x=>x.id===sectionId);
    if(!section)throw new Error(`Sección no registrada: ${sectionId}`);
    const fragment=buildDocumentFragment();
    if(section.kind==='cover'){
      const node=fragment.querySelector('.doc-cover');
      return {manifest,section,node};
    }
    const nodes=[...fragment.querySelectorAll('.doc-content')];
    const node=nodes[Number(section.sourceIndex)];
    return {manifest,section,node};
  }

  function sectionSnapshot(documentId,sectionId){
    const {manifest,section,node}=resolveSectionNode(documentId,sectionId);
    return {
      documentId,
      documentTitle:manifest.title,
      sectionId,
      sectionTitle:section.title,
      found:!!node,
      html:node?.outerHTML||''
    };
  }

  function documentSnapshot(documentId){
    const manifest=manifests.get(documentId);
    if(!manifest)return null;
    const sections=manifest.sections.map(section=>{
      try{
        const snap=sectionSnapshot(documentId,section.id);
        return {id:section.id,title:section.title,found:snap.found};
      }catch{return{id:section.id,title:section.title,found:false};}
    });
    return {documentId,title:manifest.title,sections,complete:sections.every(x=>x.found)};
  }

  function previewSection(documentId,sectionId){
    const snap=sectionSnapshot(documentId,sectionId);
    if(!snap.found){toast?.(`No se pudo construir la sección: ${snap.sectionTitle}`);return false;}
    const host=document.getElementById('printDocument');
    const dialog=document.getElementById('pdfPreviewDialog');
    if(!host||!dialog)return false;
    host.innerHTML=snap.html;
    const title=dialog.querySelector('.dialog-head h2');
    if(title)title.textContent=snap.sectionTitle;
    dialog.showModal();
    return true;
  }

  function pdfWriter(doc,context){
    const margin=15,maxY=282,pageWidth=210,contentWidth=180;
    let y=18;

    const addHeader=()=>{
      doc.setFont('helvetica','normal');
      doc.setFontSize(7.5);
      doc.setTextColor(90);
      const period=typeof periodLabel==='function'&&state?.period?periodLabel():'Sin período activo';
      doc.text(context.documentTitle,margin,9);
      doc.text(period,pageWidth-margin,9,{align:'right'});
      doc.setTextColor(0);
    };

    const nextPage=()=>{doc.addPage();y=18;addHeader();};
    const ensure=needed=>{if(y+needed>maxY)nextPage();};
    const cleanText=text=>String(text??'').replace(/\s+/g,' ').trim();

    function writeText(text,{size=9.5,bold=false,italic=false,indent=0,after=3,align='justify'}={}){
      const value=cleanText(text);if(!value)return;
      const width=contentWidth-indent;
      doc.setFont('helvetica',bold?(italic?'bolditalic':'bold'):(italic?'italic':'normal'));
      doc.setFontSize(size);
      const lines=doc.splitTextToSize(value,width);
      const lineH=Math.max(4.2,size*0.47);
      let pos=0;
      while(pos<lines.length){
        const capacity=Math.max(1,Math.floor((maxY-y)/lineH));
        if(capacity<=0){nextPage();continue;}
        const chunk=lines.slice(pos,pos+capacity);
        doc.text(chunk,margin+indent,y,{maxWidth:width,align:chunk.length>1?align:'left',lineHeightFactor:1.12});
        y+=chunk.length*lineH;
        pos+=chunk.length;
        if(pos<lines.length)nextPage();
      }
      y+=after;
    }

    function heading(text,level=2){
      const sizes={1:16,2:13,3:11,4:10,5:9.5};
      ensure(level<=2?12:9);
      writeText(text,{size:sizes[level]||9.5,bold:true,after:level<=2?5:3,align:'left'});
    }

    function drawImage(img){
      const src=img?.getAttribute?.('src')||'';
      if(!src.startsWith('data:image/'))return;
      try{
        const props=doc.getImageProperties(src);
        const maxW=170,maxH=100,ratio=Math.min(maxW/props.width,maxH/props.height);
        const w=props.width*ratio,h=props.height*ratio;
        ensure(h+6);
        const type=(src.match(/^data:image\/([^;]+)/i)?.[1]||'png').toUpperCase().replace('JPG','JPEG');
        doc.addImage(src,type,margin+(contentWidth-w)/2,y,w,h,undefined,'FAST');
        y+=h+6;
      }catch(e){console.warn('No se pudo renderizar una imagen en PDF de sección.',e);}
    }

    function drawTable(table){
      const rows=[...table.rows];if(!rows.length)return;
      const headerCells=table.tHead?.rows?.[0]?.cells?[...table.tHead.rows[0].cells]:[...rows[0].cells];
      const bodyRows=table.tBodies?.length?[...table.tBodies].flatMap(tb=>[...tb.rows]):rows.slice(1);
      const cols=Math.max(1,headerCells.length||bodyRows[0]?.cells?.length||1);
      const widths=Array(cols).fill(contentWidth/cols);
      const pad=1.7,lineH=3.6;

      const drawHeader=()=>{
        const contents=headerCells.map(c=>doc.splitTextToSize(cleanText(c.textContent),widths[0]-pad*2));
        const h=Math.max(8,...contents.map(lines=>lines.length*lineH+pad*2));
        ensure(h);
        let x=margin;
        doc.setFillColor(15,39,71);doc.setDrawColor(115);
        headerCells.forEach((cell,i)=>{
          const width=widths[i]||widths[0];
          doc.rect(x,y,width,h,'FD');
          doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(7.2);
          doc.text(contents[i]||[],x+pad,y+pad+2.8,{lineHeightFactor:1.05});
          x+=width;
        });
        doc.setTextColor(0);y+=h;
      };

      drawHeader();
      bodyRows.forEach(row=>{
        const cells=[...row.cells];
        const wrapped=Array.from({length:cols},(_,i)=>doc.splitTextToSize(cleanText(cells[i]?.textContent||''),(widths[i]||widths[0])-pad*2));
        const h=Math.max(7,...wrapped.map(lines=>lines.length*lineH+pad*2));
        if(y+h>maxY){nextPage();drawHeader();}
        let x=margin;doc.setDrawColor(150);doc.setFont('helvetica','normal');doc.setFontSize(7.2);
        for(let i=0;i<cols;i++){
          const width=widths[i]||widths[0];
          doc.rect(x,y,width,h);
          doc.text(wrapped[i]||[],x+pad,y+pad+2.8,{lineHeightFactor:1.05});
          x+=width;
        }
        y+=h;
      });
      y+=5;
    }

    function renderList(list){
      const ordered=list.tagName==='OL';
      [...list.children].filter(x=>x.tagName==='LI').forEach((li,i)=>{
        const prefix=ordered?`${i+1}.`:'•';
        ensure(7);
        doc.setFont('helvetica','normal');doc.setFontSize(9.3);doc.text(prefix,margin+2,y);
        writeText(li.textContent,{size:9.3,indent:9,after:1.5});
      });
      y+=2;
    }

    function renderElement(el){
      if(!el||el.nodeType!==1)return;
      const tag=el.tagName;
      if(/^H[1-5]$/.test(tag)){heading(el.textContent,Number(tag.slice(1)));return;}
      if(tag==='P'){writeText(el.textContent);return;}
      if(tag==='UL'||tag==='OL'){renderList(el);return;}
      if(tag==='TABLE'){drawTable(el);return;}
      if(tag==='IMG'){drawImage(el);return;}
      if(tag==='HR'){ensure(5);doc.setDrawColor(170);doc.line(margin,y,margin+contentWidth,y);y+=5;return;}
      if(el.classList?.contains('legal-block-title')||el.classList?.contains('result-table-title')){heading(el.textContent,4);return;}
      if(el.classList?.contains('considerando')){writeText(el.textContent,{italic:false,indent:4});return;}
      if(el.classList?.contains('method-figure')){
        const img=el.querySelector('img');
        if(img)drawImage(img);else writeText(el.textContent,{italic:true});
        return;
      }
      [...el.children].forEach(renderElement);
    }

    addHeader();
    return {renderElement,heading,writeText,getY:()=>y};
  }

  function downloadSectionPdf(documentId,sectionId){
    const snap=sectionSnapshot(documentId,sectionId);
    if(!snap.found){toast?.(`No se pudo construir la sección: ${snap.sectionTitle}`);return false;}
    if(!window.jspdf?.jsPDF){toast?.('El motor PDF no está disponible.');return false;}
    const doc=new window.jspdf.jsPDF({unit:'mm',format:'a4',orientation:'portrait'});
    const template=document.createElement('template');template.innerHTML=snap.html;
    const root=template.content.firstElementChild;
    const writer=pdfWriter(doc,snap);
    if(snap.sectionId==='portada'){
      writer.heading(snap.documentTitle,1);
      writer.writeText(typeof periodLabel==='function'&&state?.period?periodLabel():'Sin período activo',{size:13,bold:true,align:'center',after:10});
      const logo=root?.querySelector('img');if(logo)writer.renderElement(logo);
      writer.writeText(root?.textContent||snap.sectionTitle,{size:9.5});
    }else{
      [...(root?.children||[])].forEach(writer.renderElement);
    }
    const filename=`${safeName(snap.documentTitle)}_${safeName(snap.sectionTitle)}_${safeName(activePeriodId())}.pdf`;
    doc.save(filename);
    return true;
  }

  function ensureSectionDialog(){
    let dialog=document.getElementById('documentSectionDialog');
    if(dialog)return dialog;
    dialog=document.createElement('dialog');
    dialog.id='documentSectionDialog';
    dialog.className='preview-dialog section-selector-dialog';
    dialog.innerHTML=`<div class="dialog-head"><div><p class="eyebrow">Revisión por sección</p><h2 id="sectionDialogTitle">Secciones</h2></div><button class="icon-btn" id="closeSectionDialog" aria-label="Cerrar">×</button></div><div class="dialog-body"><div id="sectionDialogRows" class="section-dialog-rows"></div></div><div class="dialog-actions"><button class="btn btn-secondary" id="closeSectionDialogBottom">Cerrar</button></div>`;
    document.body.appendChild(dialog);
    dialog.querySelector('#closeSectionDialog').addEventListener('click',()=>dialog.close());
    dialog.querySelector('#closeSectionDialogBottom').addEventListener('click',()=>dialog.close());
    return dialog;
  }

  function openSectionChooser(documentId){
    const manifest=manifests.get(documentId);
    if(!manifest){toast?.('No existe un manifiesto para este documento.');return;}
    const dialog=ensureSectionDialog();
    dialog.querySelector('#sectionDialogTitle').textContent=manifest.title;
    const rows=dialog.querySelector('#sectionDialogRows');
    rows.innerHTML=manifest.sections.map(section=>{
      let available=false;try{available=sectionSnapshot(documentId,section.id).found;}catch{}
      return `<div class="section-dialog-row"><div><strong>${esc(section.title)}</strong><small>${available?'Disponible':'No disponible'}</small></div><div class="section-dialog-actions"><button class="btn btn-light section-preview-action" data-section="${esc(section.id)}" ${available?'':'disabled'}>Vista previa</button><button class="btn btn-secondary section-pdf-action" data-section="${esc(section.id)}" ${available?'':'disabled'}>PDF de sección</button></div></div>`;
    }).join('');
    rows.querySelectorAll('.section-preview-action').forEach(btn=>btn.addEventListener('click',()=>{dialog.close();previewSection(documentId,btn.dataset.section);}));
    rows.querySelectorAll('.section-pdf-action').forEach(btn=>btn.addEventListener('click',()=>downloadSectionPdf(documentId,btn.dataset.section)));
    dialog.showModal();
  }

  function periodRegistry(){
    try{return window.DOC_CAPA_PERIODS?.getRegistry?.()||null;}catch{return null;}
  }

  function activePeriodEntry(){
    const registry=periodRegistry();
    return registry?.periods?.find(p=>p.id===registry.activeId)||null;
  }

  function getPeriodStatus(){
    const entry=activePeriodEntry();
    return PERIOD_STATUSES.includes(entry?.status)?entry.status:'active';
  }

  function setPeriodStatus(status){
    if(!PERIOD_STATUSES.includes(status))throw new Error('Estado de período inválido.');
    const registry=periodRegistry();
    if(!registry)return false;
    const idx=registry.periods.findIndex(p=>p.id===registry.activeId);if(idx<0)return false;
    registry.periods[idx].status=status;
    registry.periods[idx].statusUpdatedAt=new Date().toISOString();
    window.DOC_CAPA_PERIODS.setRegistryFromRemote(registry);
    window.dispatchEvent(new CustomEvent('doccapa:period-status-changed',{detail:{periodId:registry.activeId,status}}));
    return true;
  }

  function protectEditingByPeriodStatus(){
    if(window.__DOC_CAPA_PERIOD_GUARD__)return;
    window.__DOC_CAPA_PERIOD_GUARD__=true;
    const baseEnsure=window.ensureEditable;
    if(typeof baseEnsure==='function'){
      window.ensureEditable=function(){
        const status=getPeriodStatus();
        if(status==='archived'){
          toast?.('El período está archivado y solo permite consulta.');
          return false;
        }
        if(status==='closed'){
          const ok=window.confirm('El período está cerrado. ¿Deseas habilitar esta modificación de forma excepcional?');
          if(!ok)return false;
        }
        return baseEnsure();
      };
    }
  }

  function renderDiagnostics(documentId,host){
    const manifest=manifests.get(documentId);if(!manifest||!host)return;
    const diagnostics=typeof manifest.diagnostics==='function'?manifest.diagnostics():[];
    const groups=[...new Set(diagnostics.map(x=>x.group||'General'))];
    host.innerHTML=groups.map(group=>{
      const items=diagnostics.filter(x=>(x.group||'General')===group);
      return `<section class="diagnostic-group"><h3>${esc(group)}</h3>${items.map((item,i)=>{
        const status=['ok','warn','error','info'].includes(item.status)?item.status:'info';
        return `<div class="diagnostic-row diagnostic-${status}"><div class="diagnostic-state">${status==='ok'?'OK':status==='warn'?'!':status==='error'?'X':'i'}</div><div class="diagnostic-copy"><strong>${esc(item.label)}</strong>${item.value?`<span>${esc(item.value)}</span>`:''}${item.detail?`<small>${esc(item.detail)}</small>`:''}${item.origin?`<button class="text-button diagnostic-origin" data-origin="${esc(group)}-${i}">Ver origen</button><div class="diagnostic-origin-detail" id="origin-${safeName(group)}-${i}" hidden>${esc(item.origin)}</div>`:''}</div></div>`;
      }).join('')}</section>`;
    }).join('');
    host.querySelectorAll('.diagnostic-origin').forEach(btn=>btn.addEventListener('click',()=>{
      const detail=btn.nextElementSibling;if(!detail)return;
      detail.hidden=!detail.hidden;
      btn.textContent=detail.hidden?'Ver origen':'Ocultar origen';
    }));
  }

  function injectStyles(){
    if(document.getElementById('documentCoreStyles'))return;
    const style=document.createElement('style');style.id='documentCoreStyles';style.textContent=`
      .section-selector-dialog{width:min(860px,94vw)}
      .section-dialog-rows{display:grid;gap:9px}.section-dialog-row{display:grid;grid-template-columns:minmax(220px,1fr) auto;gap:14px;align-items:center;padding:12px 14px;border:1px solid var(--line);border-radius:11px;background:#fff}.section-dialog-row small{display:block;color:var(--muted);margin-top:3px}.section-dialog-actions{display:flex;gap:8px;flex-wrap:wrap}
      .diagnostic-shell{max-width:1080px;margin:0 auto}.diagnostic-group{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px;margin-top:16px;box-shadow:var(--shadow)}.diagnostic-group h3{margin:0 0 10px}.diagnostic-row{display:grid;grid-template-columns:34px 1fr;gap:10px;padding:11px 0;border-bottom:1px solid var(--line)}.diagnostic-row:last-child{border-bottom:0}.diagnostic-state{width:28px;height:28px;border-radius:999px;display:grid;place-items:center;font-weight:900;font-size:11px}.diagnostic-ok .diagnostic-state{background:#e9f8f0;color:var(--ok)}.diagnostic-warn .diagnostic-state{background:#fff6e5;color:#9a6700}.diagnostic-error .diagnostic-state{background:#fff0f0;color:#b42318}.diagnostic-info .diagnostic-state{background:#eef3f9;color:#536277}.diagnostic-copy>strong,.diagnostic-copy>span,.diagnostic-copy>small{display:block}.diagnostic-copy>span{margin-top:2px}.diagnostic-copy>small{color:var(--muted);margin-top:3px}.diagnostic-origin{margin-top:5px}.diagnostic-origin-detail{margin-top:7px;padding:9px 11px;background:#f7f9fc;border-radius:8px;color:#536277;font-size:11px}
      .period-status-pill{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.04em;padding:6px 9px;border-radius:999px;background:#e9f8f0;color:var(--ok)}.period-status-pill.closed{background:#fff6e5;color:#8a5a00}.period-status-pill.archived{background:#eef1f5;color:#59667a}
      @media(max-width:680px){.section-dialog-row{grid-template-columns:1fr}.section-dialog-actions{display:grid}.section-dialog-actions .btn{width:100%}}
    `;document.head.appendChild(style);
  }

  injectStyles();
  protectEditingByPeriodStatus();

  window.DOC_CAPA_CORE={
    registerDocument,
    getDocument,
    documentSnapshot,
    sectionSnapshot,
    previewSection,
    downloadSectionPdf,
    openSectionChooser,
    registerCalculation,
    calculate,
    recordImportTrace,
    getImportTrace,
    getPeriodStatus,
    setPeriodStatus,
    renderDiagnostics
  };
})();
