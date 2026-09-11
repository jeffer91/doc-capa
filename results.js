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

  const modules=[
    'consistency.js',
    'results-core.js',
    'document-core.js',
    'dnc-calculations.js',
    'summary.js',
    'conclusions.js',
    'recommendations.js',
    'bibliography.js',
    'annexes.js',
    'workflow-ui.js',
    'periods-global.js',
    'careers-simple.js',
    'template-workbench.js',
    'dnc-manifest.js',
    'institutional-governance.js',
    'import-hardening.js',
    'official-snapshots.js',
    'document-layout.js',
    'document-pdf-engine.js'
  ];

  async function boot(){
    let failure=null;
    for(const src of modules){
      try{await loadScript(src);}catch(error){failure={src,error};console.error(error);break;}
    }

    // SVD 2.0 se intenta cargar siempre. Así, un fallo previo no hace reaparecer
    // silenciosamente la navegación lateral heredada como interfaz principal.
    try{await loadScript('svd-ui.js');}
    catch(error){
      console.error(error);
      failure=failure||{src:'svd-ui.js',error};
    }

    if(failure){
      const toast=document.getElementById('toast');
      if(toast){
        toast.textContent=`No se pudo cargar completamente DOC-CAPA (${failure.src}).`;
        toast.classList.add('show');
      }
      document.body.classList.add('doccapa-load-error');
    }
  }

  boot();
})();
