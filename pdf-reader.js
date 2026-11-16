/* SNUDI-FO 30 — Lecteur PDF multipage pour PWA mobile (sans iframe).
 * Rendu canvas avec Mozilla PDF.js, charge une seule page à la fois pour limiter la mémoire.
 * La bibliothèque PDF.js est chargée à la première lecture depuis un CDN public.
 * Aucun document n'est téléversé vers le CDN : le PDF reste hébergé sur GitHub Pages.
 */
(function(){
 'use strict';
 const SOURCES=[
  {module:'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs',worker:'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs'},
  {module:'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs',worker:'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs'}
 ];
 let libPromise=null;
 let session=0, pdf=null, loadingTask=null, renderingTask=null, pageNum=1, zoomLevel=1;
 let resizeTimer=0, paintId=0;
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 const get=(id)=>document.getElementById(id);
 function updateUI(){
  const count=get('pdf-page-counter'); if(count)count.textContent=pdf?`Page ${pageNum} / ${pdf.numPages}`:'Chargement…';
  const zoom=get('pdf-zoom-label'); if(zoom)zoom.textContent=Math.round(zoomLevel*100)+' %';
  const disabled=!pdf;
  for(const [name,off] of [['pdf-prev',disabled||pageNum<=1],['pdf-next',disabled||pageNum>=pdf?.numPages],['pdf-zoom-out',disabled||zoomLevel<=0.75],['pdf-zoom-in',disabled||zoomLevel>=2.5]]){
   const b=document.querySelector(`.pdf-reader-controls [data-action="${name}"]`);if(b)b.disabled=Boolean(off);
  }
 }
 function status(message, error=false){const el=get('pdf-reader-status');if(!el)return;el.textContent=message;el.hidden=!message;el.classList.toggle('pdf-reader-error',error);}
 async function loadLib(){
  // Permet de fournir plus tard une version locale de PDF.js sans toucher au lecteur.
  if(window.pdfjsLib?.getDocument)return window.pdfjsLib;
  if(!libPromise)libPromise=(async()=>{
   let lastError;
   for(const source of SOURCES){
    try{const lib=await import(source.module);lib.GlobalWorkerOptions.workerSrc=source.worker;return lib;}
    catch(error){lastError=error;}
   }
   throw lastError||new Error('Bibliothèque PDF indisponible');
  })().catch(e=>{libPromise=null;throw e;});
  return await libPromise;
 }
 function close(){
  session++;paintId++;
  clearTimeout(resizeTimer);
  if(renderingTask){try{renderingTask.cancel();}catch{} renderingTask=null;}
  if(loadingTask){try{loadingTask.destroy();}catch{} loadingTask=null;}
  if(pdf){try{pdf.destroy();}catch{} pdf=null;}
  const canvas=get('pdf-reader-canvas');if(canvas){canvas.width=0;canvas.height=0;canvas.hidden=true;}
  pageNum=1;zoomLevel=1;
 }
 async function open(url){
  close(); const token=session;
  if(!get('pdf-reader-scroll'))return;
  status('Ouverture du PDF…');updateUI();
  try{
   const lib=await loadLib();
   if(token!==session)return;
   loadingTask=lib.getDocument({url,withCredentials:false,isEvalSupported:false,enableScripting:false});
   const document=await loadingTask.promise;
   if(token!==session){try{document.destroy();}catch{}return;}
   pdf=document;pageNum=1;zoomLevel=1;
   updateUI();await draw(token);
  }catch(error){
   if(token!==session)return;
   console.warn('SNUDI-FO 30 — lecture PDF :',error);
   status('Lecture intégrée indisponible. Utilisez « Ouvrir séparément » ci-dessous.',true);updateUI();
  }
 }
 async function draw(token=session){
  const view=get('pdf-reader-scroll'), canvas=get('pdf-reader-canvas');
  if(!pdf||!view||!canvas)return;
  if(renderingTask){try{renderingTask.cancel();}catch{}renderingTask=null;}
  canvas.hidden=true;status(`Chargement de la page ${pageNum}…`);
  const currentPage=pageNum, frame=++paintId;
  try{
   const page=await pdf.getPage(currentPage);
   if(token!==session||currentPage!==pageNum||frame!==paintId)return;
   const natural=page.getViewport({scale:1});
   const availableWidth=Math.max(180,view.clientWidth-24);
   const availableHeight=Math.max(270,Math.min(window.innerHeight*0.75,view.clientHeight-24));
   const fit=Math.min(availableWidth/natural.width,availableHeight/natural.height);
   const scale=clamp(fit,0.05,3)*zoomLevel;
   const viewport=page.getViewport({scale});
   const pixelRatio=Math.min(window.devicePixelRatio||1,2);
   // Budget mémoire conservateur : jusqu'à ~7 millions de pixels par page.
   const memoryScale=Math.min(pixelRatio,Math.sqrt(7000000/(viewport.width*viewport.height)));
   const finalRatio=Math.max(0.5,memoryScale);
   canvas.width=Math.max(1,Math.floor(viewport.width*finalRatio));
   canvas.height=Math.max(1,Math.floor(viewport.height*finalRatio));
   canvas.style.width=Math.round(viewport.width)+'px';
   canvas.style.height=Math.round(viewport.height)+'px';
   const ctx=canvas.getContext('2d',{alpha:false});
   if(!ctx)throw Error('Canvas indisponible');
   const task=page.render({canvasContext:ctx,viewport,transform:finalRatio===1?null:[finalRatio,0,0,finalRatio,0,0]});
   renderingTask=task;
   await task.promise;
   if(token!==session||currentPage!==pageNum||frame!==paintId)return;
   renderingTask=null;canvas.hidden=false;status('');updateUI();
   // Affiche la page depuis son début, même après un zoom ou un changement de page.
   view.scrollTo({top:0,left:0,behavior:'instant'});
  }catch(error){
   if(token!==session)return;
   if(error?.name==='RenderingCancelledException')return;
   console.warn('SNUDI-FO 30 — rendu de la page :',error);
   status('Impossible d’afficher cette page. Essayez « Ouvrir séparément ».',true);
  }
 }
 function go(delta){if(!pdf)return;const next=clamp(pageNum+delta,1,pdf.numPages);if(next===pageNum)return;pageNum=next;updateUI();draw();}
 function zoom(direction){if(!pdf)return;const newZoom=clamp(Math.round((zoomLevel+direction*0.25)*100)/100,0.75,2.5);if(newZoom===zoomLevel)return;zoomLevel=newZoom;updateUI();draw();}
 window.addEventListener('resize',()=>{if(!pdf||!get('pdf-reader-scroll'))return;clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>draw(),180);});
 window.SnudiPdfReader=Object.freeze({open,close,next:()=>go(1),prev:()=>go(-1),zoom});
})();
