(function(){
  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=src;
      script.onload=resolve;
      script.onerror=()=>reject(new Error(`No se pudo cargar ${src}`));
      document.body.appendChild(script);
    });
  }

  loadScript('results-core.js')
    .then(()=>loadScript('summary.js'))
    .catch(error=>{
      console.error(error);
      const toast=document.getElementById('toast');
      if(toast){
        toast.textContent='No se pudieron cargar los módulos de Resultados/Resumen Ejecutivo.';
        toast.classList.add('show');
      }
    });
})();
