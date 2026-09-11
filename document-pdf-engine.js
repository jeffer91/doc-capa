(function(){
  'use strict';

  const core=window.DOC_CAPA_CORE;
  const DOCUMENT_ID='capacitacion-deteccion';
  if(!core){console.error('DOC-CAPA PDF: Core documental no disponible.');return;}

  const exactRenderers={
    portada:'drawCover',
    introduccion:'writeIntroPdf',
    'base-legal':'writeLegalPdf',
    alineacion:'writeAlignmentPdf',
    metodologia:'writeMethodPdf'
  };

  function safeName(value){return String(value||'documento').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');}
  function periodText(){try{return state?.period&&typeof periodLabel==='function'?periodLabel():state?.period?.label||'sin-periodo';}catch{return state?.period?.label||'sin-periodo';}}
  function escText(value){return String(value??'').replace(/\s+/g,' ').trim();}

  function genericWriter(doc,context={}){
    const margin=15,pageWidth=210,contentWidth=180,maxY=282;
    let y=18;

    function header(){
      doc.setFont('helvetica','normal');doc.setFontSize(7.2);doc.setTextColor(95);
      doc.text(context.title||'DOC-CAPA',margin,9);
      doc.text(periodText(),pageWidth-margin,9,{align:'right'});
      doc.setTextColor(0);
    }
    function nextPage(){doc.addPage();y=18;header();}
    function ensure(needed){if(y+needed>maxY)nextPage();}
    function write(text,{size=9.5,bold=false,italic=false,indent=0,after=3,align='justify'}={}){
      const value=escText(text);if(!value)return;
      const width=contentWidth-indent;
      doc.setFont('helvetica',bold?(italic?'bolditalic':'bold'):(italic?'italic':'normal'));
      doc.setFontSize(size);
      const lines=doc.splitTextToSize(value,width),lineH=Math.max(4.1,size*.46);
      let pos=0;
      while(pos<lines.length){
        if(y>maxY-4)nextPage();
        const capacity=Math.max(1,Math.floor((maxY-y)/lineH)),chunk=lines.slice(pos,pos+capacity);
        doc.text(chunk,margin+indent,y,{maxWidth:width,align:chunk.length>1?align:'left',lineHeightFactor:1.12});
        y+=chunk.length*lineH;pos+=chunk.length;
        if(pos<lines.length)nextPage();
      }
      y+=after;
    }
    function heading(text,level=2){const size={1:15,2:13,3:11,4:10,5:9.5}[level]||9.5;ensure(level<=2?12:9);write(text,{size,bold:true,after:level<=2?5:3,align:'left'});}
    function image(el){
      const src=el?.getAttribute?.('src')||'';if(!src.startsWith('data:image/'))return;
      try{
        const props=doc.getImageProperties(src),ratio=Math.min(170/props.width,95/props.height),w=props.width*ratio,h=props.height*ratio;
        ensure(h+6);
        const type=(src.match(/^data:image\/([^;]+)/i)?.[1]||'png').toUpperCase().replace('JPG','JPEG');
        doc.addImage(src,type,margin+(contentWidth-w)/2,y,w,h,undefined,'FAST');y+=h+6;
      }catch(error){console.warn('DOC-CAPA PDF: imagen omitida.',error);}
    }
    function table(el){
      const rows=[...el.rows];if(!rows.length)return;
      const head=el.tHead?.rows?.[0]?[...el.tHead.rows[0].cells]:[...rows[0].cells];
      const body=el.tBodies?.length?[...el.tBodies].flatMap(tb=>[...tb.rows]):rows.slice(1);
      const cols=Math.max(1,head.length||body[0]?.cells?.length||1),widths=Array(cols).fill(contentWidth/cols),pad=1.7,lineH=3.5;
      const drawHead=()=>{
        const wrapped=head.map((c,i)=>doc.splitTextToSize(escText(c.textContent),(widths[i]||widths[0])-pad*2));
        const h=Math.max(8,...wrapped.map(x=>x.length*lineH+pad*2));ensure(h);
        let x=margin;doc.setFillColor(15,39,71);doc.setDrawColor(115);doc.setFont('helvetica','bold');doc.setFontSize(7.1);
        head.forEach((c,i)=>{const w=widths[i]||widths[0];doc.rect(x,y,w,h,'FD');doc.setTextColor(255);doc.text(wrapped[i]||[],x+pad,y+pad+2.7,{lineHeightFactor:1.05});x+=w;});
        doc.setTextColor(0);y+=h;
      };
      drawHead();
      body.forEach(row=>{
        const cells=[...row.cells],wrapped=Array.from({length:cols},(_,i)=>doc.splitTextToSize(escText(cells[i]?.textContent||''),(widths[i]||widths[0])-pad*2));
        const h=Math.max(7,...wrapped.map(x=>x.length*lineH+pad*2));if(y+h>maxY){nextPage();drawHead();}
        let x=margin;doc.setDrawColor(150);doc.setFont('helvetica','normal');doc.setFontSize(7.1);
        for(let i=0;i<cols;i++){const w=widths[i]||widths[0];doc.rect(x,y,w,h);doc.text(wrapped[i]||[],x+pad,y+pad+2.7,{lineHeightFactor:1.05});x+=w;}y+=h;
      });
      y+=5;
    }
    function list(el){const ordered=el.tagName==='OL';[...el.children].filter(x=>x.tagName==='LI').forEach((li,i)=>{ensure(7);doc.setFont('helvetica','normal');doc.setFontSize(9.2);doc.text(ordered?`${i+1}.`:'•',margin+2,y);write(li.textContent,{size:9.2,indent:9,after:1.5});});y+=2;}
    function render(el){
      if(!el||el.nodeType!==1)return;
      const tag=el.tagName;
      if(/^H[1-5]$/.test(tag)){heading(el.textContent,Number(tag.slice(1)));return;}
      if(tag==='P'){write(el.textContent);return;}
      if(tag==='UL'||tag==='OL'){list(el);return;}
      if(tag==='TABLE'){table(el);return;}
      if(tag==='IMG'){image(el);return;}
      if(tag==='HR'){ensure(5);doc.setDrawColor(170);doc.line(margin,y,margin+contentWidth,y);y+=5;return;}
      if(el.classList?.contains('method-figure')){const img=el.querySelector('img');if(img)image(img);else write(el.textContent,{italic:true});return;}
      [...el.children].forEach(render);
    }
    header();return{render};
  }

  function renderGenericSection(doc,sectionId,title){
    const snap=core.sectionSnapshot(DOCUMENT_ID,sectionId);
    if(!snap?.found)throw new Error(snap?.error||`Sección no disponible: ${sectionId}`);
    const template=document.createElement('template');template.innerHTML=snap.html;
    const root=template.content.firstElementChild;
    const writer=genericWriter(doc,{title});
    [...(root?.children||[])].forEach(writer.render);
  }

  function renderSection(doc,section,index){
    if(index>0)doc.addPage();
    const exactName=exactRenderers[section.id],exact=exactName?window[exactName]:null;
    if(typeof exact==='function'){
      exact(doc);
      return;
    }
    renderGenericSection(doc,section.id,section.title);
  }

  function buildDocumentPdf(){
    const jsPDF=window.jspdf?.jsPDF;
    if(!jsPDF)throw new Error('jsPDF no está disponible.');
    const snapshot=core.documentSnapshot(DOCUMENT_ID);
    if(!snapshot)throw new Error('El documento DNC no está registrado.');
    if(!snapshot.htmlComplete){
      const missing=snapshot.sections.filter(x=>!x.html).map(x=>x.title).join(', ');
      throw new Error(`Hay secciones incompletas: ${missing}`);
    }
    const doc=new jsPDF({unit:'mm',format:'a4',orientation:'portrait'});
    snapshot.sections.forEach((section,index)=>renderSection(doc,section,index));
    return doc;
  }

  function downloadDocumentPdf(){
    try{
      const issues=typeof validateDncForFinal==='function'?validateDncForFinal():[];
      if(issues.length&&state?.dncStatus!=='approved')toast?.(`PDF de trabajo: ${issues[0]}`);
      const doc=buildDocumentPdf();
      doc.save(`DNC_${safeName(periodText())}.pdf`);
      return true;
    }catch(error){
      console.error(error);toast?.(`No se pudo generar el PDF: ${error.message||error}`);return false;
    }
  }

  function rebind(id,handler){
    const old=document.getElementById(id);if(!old)return;
    const clone=old.cloneNode(true);old.replaceWith(clone);clone.addEventListener('click',handler);
  }
  function bind(){['downloadDncBtn','downloadFromPreviewBtn','workflowPdfBtn'].forEach(id=>rebind(id,downloadDocumentPdf));}

  window.DOC_CAPA_PDF={build:buildDocumentPdf,download:downloadDocumentPdf,documentId:DOCUMENT_ID};
  window.downloadPdf=downloadDocumentPdf;
  bind();
})();
