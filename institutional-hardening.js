(function(){
  'use strict';
  const scripts=['institutional-governance.js','import-hardening.js','official-snapshots.js'];
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error(`No se pudo cargar ${src}`));document.body.appendChild(s);});
  scripts.reduce((p,src)=>p.then(()=>load(src)),Promise.resolve()).catch(error=>{console.error(error);toast?.('No se pudieron cargar los controles institucionales de DOC-CAPA.');});
})();
