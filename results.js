(function(){
  'use strict';

  const BUILD_ID='20260914-svd21-context-1';
  const MODULE_TIMEOUT=15000;

  function installBootstrap(){
    document.body.classList.add('doccapa-booting');
    if(!document.getElementById('doccapaBootStyles')){
      const style=document.createElement('style');
      style.id='doccapaBootStyles';
      style.textContent=`
        body.doccapa-booting .app-shell{visibility:hidden!important}
        #doccapaBoot{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:#f7f8fa;color:#0f2747;font-family:Arial,sans-serif}
        #doccapaBoot .boot-card{min-width:260px;max-width:420px;padding:26px 28px;background:#fff;border:1px solid #e3e8ef;border-radius:14px;text-align:center;box-shadow:0 10px 30px rgba(15,39,71,.06)}
        #doccapaBoot strong{display:block;font-size:16px;margin-bottom:6px}
        #doccapaBoot span{display:block;font-size:11px;color:#728095;line-height:1.4}
        #doccapaBoot button{margin-top:14px;border:0;border-radius:8px;padding:9px 12px;background:#0f2747;color:#fff;font-weight:700;cursor:pointer}
      `;
      document.head.appendChild(style);
    }
    if(!document.getElementById('doccapaBoot')){
      const boot=document.createElement('div');
      boot.id='doccapaBoot';
      boot.setAttribute('role','status');
      boot.setAttribute('aria-live','polite');
      boot.innerHTML='<div class="boot-card"><strong>Cargando DOC-CAPA</strong><span>Preparando períodos y componentes de la aplicación…</span></div>';
      document.body.appendChild(boot);
    }
  }

  function finishBootstrap(){
    document.body.classList.remove('doccapa-booting');
    document.getElementById('doccapaBoot')?.remove();
  }

  function failBootstrap(failure){
    document.body.classList.add('doccapa-load-error');
    const boot=document.getElementById('doccapaBoot');
    if(!boot)return;
    const label=failure?.src||'inicialización';
    boot.innerHTML=`<div class="boot-card"><strong>No se pudo iniciar DOC-CAPA</strong><span>Falló ${label}. Recarga la aplicación para intentar nuevamente.</span><button type="button" id="doccapaReloadBtn">Recargar</button></div>`;
    document.getElementById('doccapaReloadBtn')?.addEventListener('click',()=>location.reload());
  }

  function versioned(src){
    const separator=src.includes('?')?'&':'?';
    return `${src}${separator}v=${encodeURIComponent(BUILD_ID)}`;
  }

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      let settled=false;
      const timer=setTimeout(()=>{
        if(settled)return;
        settled=true;
        script.remove();
        reject(new Error(`Tiempo de espera agotado al cargar ${src}`));
      },MODULE_TIMEOUT);
      script.src=versioned(src);
      script.async=false;
      script.onload=()=>{
        if(settled)return;
        settled=true;
        clearTimeout(timer);
        resolve();
      };
      script.onerror=()=>{
        if(settled)return;
        settled=true;
        clearTimeout(timer);
        reject(new Error(`No se pudo cargar ${src}`));
      };
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
    'context-guard.js',
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
    installBootstrap();
    let failure=null;
    for(const src of modules){
      try{await loadScript(src);}
      catch(error){failure={src,error};console.error(error);break;}
    }

    try{await loadScript('svd-ui.js');}
    catch(error){console.error(error);failure=failure||{src:'svd-ui.js',error};}

    if(!failure&&document.documentElement.dataset.doccapaReady!=='1'){
      failure={src:'svd-ui.js',error:new Error('SVD no confirmó la inicialización completa.')};
      console.error(failure.error);
    }

    if(failure){
      failBootstrap(failure);
      const toast=document.getElementById('toast');
      if(toast){toast.textContent=`No se pudo cargar completamente DOC-CAPA (${failure.src}).`;toast.classList.add('show');}
      return;
    }

    finishBootstrap();
  }

  boot().catch(error=>{
    console.error('DOC-CAPA: error fatal durante el arranque.',error);
    failBootstrap({src:'arranque',error});
  });
})();
