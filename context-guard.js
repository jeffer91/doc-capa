(function(){
  'use strict';

  const periods=window.DOC_CAPA_PERIODS;
  if(!periods){console.error('DOC-CAPA context guard: gestor de períodos no disponible.');return;}

  let opSequence=0;
  const graceMs=2300;

  function setPeriodControlsDisabled(disabled){
    const select=document.getElementById('globalPeriodSelect');
    const plus=document.getElementById('createPeriodPlus');
    if(select)select.disabled=disabled;
    if(plus)plus.disabled=disabled;
  }

  window.addEventListener('doccapa:busy-changed',event=>{
    const busy=!!event.detail?.busy;
    setPeriodControlsDisabled(busy);
    const save=document.getElementById('svdSaveState');
    if(save&&busy){save.hidden=false;save.textContent='Procesando…';}
  });

  if(typeof readExcel==='function'&&!window.__DOC_CAPA_CONTEXT_READ_EXCEL__){
    window.__DOC_CAPA_CONTEXT_READ_EXCEL__=true;
    const baseReadExcel=readExcel;
    readExcel=async function(file,...args){
      const periodId=periods.getSelectedId?.()||state?.period?.id||null;
      if(!periodId)throw new Error('Selecciona un período antes de cargar información.');
      const token={...periods.beginAsync?.('carga Excel'),periodId,seq:++opSequence};
      try{
        const rows=await baseReadExcel(file,...args);
        const current=periods.getSelectedId?.()||state?.period?.id||null;
        if(current!==periodId)throw new Error('El período cambió durante la carga. La operación fue cancelada para evitar mezclar datos.');
        return rows;
      }finally{
        setTimeout(()=>periods.endAsync?.(token),graceMs);
      }
    };
  }

  document.addEventListener('change',event=>{
    const input=event.target;
    if(!(input instanceof HTMLInputElement)||input.type!=='file'||!input.files?.length)return;
    if(!periods.getSelectedId?.()){
      event.preventDefault();
      event.stopImmediatePropagation();
      input.value='';
      toast?.('Selecciona un período antes de cargar archivos.');
    }
  },true);
})();
