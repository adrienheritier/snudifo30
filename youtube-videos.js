/* SNUDI-FO 30 V3.12 : capsules YouTube (liens normalisés, aucun HTML externe stocké). */
(function(global){
 'use strict';
 const VIDEO_ID=/^[A-Za-z0-9_-]{11}$/;
 const MAX_VIDEOS=8;
 function parse(raw){
  const input=String(raw||'').trim();
  if(VIDEO_ID.test(input))return input;
  let value=input;
  if(/^(?:(?:www|m|music)\.)?youtube\.com\//i.test(value)||/^(?:www\.)?youtu\.be\//i.test(value)||/^www\.youtube-nocookie\.com\//i.test(value))value='https://'+value;
  let url;try{url=new URL(value);}catch{return null;}
  if(url.protocol!=='https:'||url.username||url.password)return null;
  const host=url.hostname.toLowerCase();
  const parts=url.pathname.split('/').filter(Boolean);
  let id='';
  if(host==='youtu.be'||host==='www.youtu.be')id=parts.length===1?parts[0]:'';
  else if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host)){
   if(parts[0]==='watch'&&parts.length===1)id=url.searchParams.get('v')||'';
   else if(['shorts','live','embed','v'].includes(parts[0])&&parts.length===2)id=parts[1];
  }
  return VIDEO_ID.test(id)?id:null;
 }
 function ids(record){
  const source=Array.isArray(record?.videos)?record.videos:[];
  const result=[];
  for(const entry of source){const id=parse(typeof entry==='string'?entry:entry?.id||entry?.url||'');if(id&&!result.includes(id))result.push(id);if(result.length>=MAX_VIDEOS)break;}
  return result;
 }
 function lines(raw){
  const entries=String(raw||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  if(entries.length>MAX_VIDEOS)throw Error('Tu peux intégrer au maximum '+MAX_VIDEOS+' vidéos YouTube par publication.');
  const results=[];
  for(const [i,value] of entries.entries()){
   const id=parse(value);
   if(!id)throw Error('Lien YouTube invalide à la ligne '+(i+1)+'. Colle un lien youtube.com/watch, youtu.be, /shorts, /live ou /embed.');
   if(!results.includes(id))results.push(id);
  }
  return results;
 }
 function markup(record){
  const list=ids(record);if(!list.length)return '';
  return '<section class="article-videos" aria-label="Capsules vidéo YouTube">'+list.map((id,i)=>
   '<div class="youtube-item"><div class="youtube-frame"><iframe loading="lazy" src="https://www.youtube-nocookie.com/embed/'+id+'?rel=0" title="Vidéo YouTube '+(i+1)+'" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><a class="youtube-fallback" href="https://www.youtube.com/watch?v='+id+'" target="_blank" rel="noopener noreferrer">Ouvrir sur YouTube si la vidéo ne se lance pas ↗</a></div>'
  ).join('')+'</section>';
 }
 global.SnudiYouTube=Object.freeze({parse,ids,lines,markup,MAX_VIDEOS});
})(typeof window!=='undefined'?window:globalThis);
