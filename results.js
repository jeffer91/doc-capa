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

  loadScript('consistency.js')
    .then(()=>loadScript('results-core.js'))
    .then(()=>loadScript('summary.js'))
    .then(()=>loadScript('conclusions.js'))
    .then(()=>loadScript('recommendations.js'))
    .then(()=>loadScript('bibliography.js'))
    .then(()=>loadScript('annexes.js'))
    .then(()=>loadScript('workflow-ui.js'))
    .then(()=>loadScript('periods-global.js'))
    .then(()=>loadScript('careers-simple.js'))
    .catch(error=>{
      console.error(error);
      const toast=document.getElementById('toast');
      if(toast){
        toast.textContent='No se pudieron cargar todos los módulos del DNC.';
        toast.classList.add('show');
      }
    });
})();