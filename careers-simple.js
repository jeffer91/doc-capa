(function(){
  'use strict';

  function periodReady(){return !!state.period;}

  function downloadSimpleCareersTemplate(){
    if(!periodReady())return toast('Selecciona o crea primero el período global.');
    downloadJson([{CARRERA:'Ejemplo de carrera'}],'Carreras',`Plantilla_Carreras_${state.period?.id||'Periodo'}.xlsx`);
  }

  async function importSimpleCareers(file){
    if(!ensureEditable())return;
    if(!periodReady())return toast('Selecciona o crea primero el período global.');
    try{
      const rows=await readExcel(file),good=[],bad=[];
      rows.forEach((r,idx)=>{
        const name=String(r.CARRERA||'').trim();
        if(!name){
          bad.push({CARRERA:'',FILA_EXCEL:idx+2,ERROR:'CARRERA es obligatoria'});
          return;
        }
        good.push({name,active:true});
      });

      const map=new Map(
        (state.careers||[])
          .filter(c=>c&&c.active!==false&&String(c.name||'').trim())
          .map(c=>[normalized(c.name),{name:String(c.name).trim(),active:true}])
      );
      good.forEach(c=>map.set(normalized(c.name),c));
      state.careers=[...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'es'));
      saveState();
      showImportResult('careersImportResult',good.length,bad,()=>downloadJson(bad,'Corregir','Correccion_Carreras.xlsx'));
      toast(`Carreras: ${good.length} fila(s) procesada(s).`);
    }catch(e){
      console.error(e);
      toast('No se pudo leer la plantilla de carreras.');
    }
  }

  function simplifyCareersUi(){
    const button=document.getElementById('downloadCareersTemplateBtn');
    const card=button?.closest('article');
    const helper=card?.querySelector('.helper');
    if(helper)helper.innerHTML='Columna requerida: <code>CARRERA</code>. Cada fila representa una carrera incluida en el período activo.';

    const table=document.getElementById('careersTableBody')?.closest('table');
    const head=table?.querySelector('thead tr');
    if(head)head.innerHTML='<th>Carrera</th>';
    const body=document.getElementById('careersTableBody');
    if(body){
      const rows=(state.careers||[]).filter(c=>c&&c.active!==false&&String(c.name||'').trim());
      body.innerHTML=rows.length
        ? rows.map(c=>`<tr><td>${escapeHtml(c.name)}</td></tr>`).join('')
        : '<tr><td class="empty">Sin registros.</td></tr>';
    }
    const caption=document.getElementById('careersTableCaption');
    if(caption)caption.textContent=`${(state.careers||[]).filter(c=>c&&c.active!==false&&String(c.name||'').trim()).length} registro(s)`;
  }

  function rebindControls(){
    const oldButton=document.getElementById('downloadCareersTemplateBtn');
    if(oldButton){
      const newButton=oldButton.cloneNode(true);
      oldButton.replaceWith(newButton);
      newButton.addEventListener('click',downloadSimpleCareersTemplate);
    }

    const oldInput=document.getElementById('careersFileInput');
    if(oldInput){
      const newInput=oldInput.cloneNode(true);
      oldInput.replaceWith(newInput);
      newInput.addEventListener('change',e=>e.target.files[0]&&importSimpleCareers(e.target.files[0]));
    }
  }

  function migrateLegacyCareerShape(){
    const before=JSON.stringify(state.careers||[]);
    state.careers=(state.careers||[])
      .filter(c=>c&&c.active!==false&&String(c.name||'').trim())
      .map(c=>({name:String(c.name).trim(),active:true}));
    const unique=new Map(state.careers.map(c=>[normalized(c.name),c]));
    state.careers=[...unique.values()].sort((a,b)=>a.name.localeCompare(b.name,'es'));
    if(JSON.stringify(state.careers)!==before){
      try{saveState();}catch(e){console.error(e);}
    }
  }

  const baseRenderAll=renderAll;
  renderAll=function(){
    const out=baseRenderAll();
    simplifyCareersUi();
    return out;
  };

  rebindControls();
  migrateLegacyCareerShape();
  simplifyCareersUi();
})();