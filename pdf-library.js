/* SNUDI-FO 30 — références PDF gérées par le dépôt, communes aux trois rubriques. */
(function(){
 'use strict';
 const PATH_RX=/^(?:\.\/)?media\/pdfs\/([a-f0-9]{64})\.pdf$/;
 function normalize(path){if(typeof path!=='string')return '';const m=PATH_RX.exec(path);return m?'media/pdfs/'+m[1]+'.pdf':'';}
 function href(path){const safe=normalize(path);return safe?'./'+safe:'';}
 function attachments(record){if(!record||!Array.isArray(record.attachments))return [];return record.attachments.slice(0,20).filter(x=>x&&typeof x==='object'&&normalize(x.path)&&typeof x.label==='string').map(x=>({path:normalize(x.path),label:x.label.trim().slice(0,120)||'Document PDF'}));}
 // Conservateur : une référence au fichier dans un lien HTML ou un autre champ
 // empêche sa suppression, même si elle ne figure pas dans « attachments ».
 function referencedPaths(record){const paths=new Set();if(!record||typeof record!=='object')return paths;for(const a of attachments(record))paths.add(a.path);const text=JSON.stringify(record);const rx=/media\/pdfs\/[a-f0-9]{64}\.pdf/g;for(const m of text.matchAll(rx))paths.add(m[0]);return paths;}
 function references(lists){const counts=new Map();for(const records of Object.values(lists)){if(!Array.isArray(records))continue;for(const record of records)for(const p of referencedPaths(record))counts.set(p,(counts.get(p)||0)+1);}return counts;}
 window.SnudiPdf=Object.freeze({normalize,href,attachments,referencedPaths,references});
})();
