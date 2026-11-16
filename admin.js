/* SNUDI-FO 30 V3 — édition GitHub des actualités enrichies et du calendrier.
 * Aucun jeton n'est stocké dans le navigateur. Les médias sont transférés dans le dépôt GitHub.
 */
'use strict';
const $ = selector => document.querySelector(selector);
const state = {token:'',owner:'',repo:'',branch:'main',tab:'news',toolsFilter:'all',records:{news:[],events:[],tools:[]},sha:{news:'',events:'',tools:''},editingId:null,busy:false,dirty:false,coverDraft:null,coverRemoved:false,pendingMedia:new Map(),editorRange:null,selectedImage:null,orderMode:false,orderSection:null,orderDraft:[],orderDirty:false,view:'records',home:{banner:'',alt:''},homeSha:'',homeDraft:null,homeRemoved:false,homeDirty:false,homeAlt:'',pdfDraft:[],pdfLibrary:[],pdfLibraryError:'',pdfUploadPaths:new Set()};
const PATHS = {news:'content/news.json',events:'content/events.json',tools:'content/tools.json'};
const HOME_PATH='content/home.json';
const PDF_FOLDER='media/pdfs';
const PDF_MAX_BYTES=10*1024*1024;
const PDF_MAX_PER_PUBLICATION=20;
const FIELDS = {
 news:[
  {key:'date',label:'Date de publication',type:'date',required:true},
  {key:'tag',label:'Catégorie',type:'select',options:['Carte scolaire','AESH','Carrière','Formations','Mobilisations','Réglementation','Actualité'],required:true},
  {key:'title',label:'Titre',type:'text',required:true,placeholder:'Titre de l’actualité'},
  {key:'summary',label:'Résumé visible dans la liste',type:'textarea',required:true,placeholder:'Quelques lignes pour présenter l’actualité'},
  {key:'url',label:'Lien source (facultatif)',type:'url',placeholder:'https://…'}
 ],
 events:[
  {key:'date',label:'Date de début',type:'date',required:true},
  {key:'end',label:'Date de fin (facultatif)',type:'date'},
  {key:'time',label:'Heure (facultatif)',type:'time'},
  {key:'type',label:'Catégorie',type:'select',options:['Formation','Échéance','Élections','RIS','Instance','Mobilisation','Autre'],required:true},
  {key:'title',label:'Titre de l’événement',type:'text',required:true,placeholder:'Ex. Formation syndicale : connaître ses droits'},
  {key:'place',label:'Lieu / accès / précision',type:'text',placeholder:'Ex. Nîmes, salle…'},
  {key:'status',label:'Statut',type:'select',options:['Confirmé','À confirmer','Annulé']},
  {key:'source',label:'Lien pour plus d’informations (facultatif)',type:'url',placeholder:'https://…'}
 ],
 tools:[
  {key:'section',label:'Rubrique de Mes outils',type:'select',options:['affichages','fiches','dossiers','modeles','documents'],required:true},
  {key:'title',label:'Titre du contenu',type:'text',required:true,placeholder:'Titre de la fiche, du modèle ou de la ressource'},
  {key:'summary',label:'Résumé affiché dans la liste',type:'textarea',required:true,placeholder:'Quelques lignes qui décrivent ce contenu'},
  {key:'tag',label:'Sous-catégorie (facultatif)',type:'text',placeholder:'Ex. AESH, Carrière, Administration'},
  {key:'url',label:'Lien principal vers la ressource ou le PDF (facultatif)',type:'url',placeholder:'https://…'}
 ]
};
const SECTION_NAMES={affichages:'Affichages écoles',fiches:'Mes droits',dossiers:'Dossiers thématiques',modeles:'Modèles de courriers',documents:'Archives (non publiées)'};
// Compatibilité : les anciennes fiches sans « order » gardent leur ordre d'origine dans tools.json.
function orderedTools(records,section){return records.filter(r=>r.section===section).map((record,index)=>({record,index})).sort((a,b)=>{
 const av=Number.isSafeInteger(a.record.order)&&a.record.order>=0?a.record.order:a.index;
 const bv=Number.isSafeInteger(b.record.order)&&b.record.order>=0?b.record.order:b.index;
 return av-bv||a.index-b.index;
}).map(({record})=>record);}
function resetOrder(){state.orderMode=false;state.orderSection=null;state.orderDraft=[];state.orderDirty=false;}
function orderChanged(){return state.orderDirty;}
function ensureReorderClosed(){if(!state.orderMode)return true;if(state.orderDirty&&!confirm('L’ordre modifié n’a pas été publié sur GitHub. Abandonner ces changements ?'))return false;resetOrder();return true;}

const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
const escapeHtml=str=>String(str??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function message(txt,kind='') { const el=$('#adminMessage');el.textContent=txt;el.className='admin-message '+kind;el.hidden=false;clearTimeout(message.timer);message.timer=setTimeout(()=>el.hidden=true,11000); }
function setBusy(value){state.busy=value;document.querySelectorAll('#workspace button, #connectButton').forEach(b=>b.disabled=value);$('#workingIndicator').hidden=!value;}
function autoSuggestRepo(){const m=location.hostname.match(/^([^.]+)\.github\.io$/i);if(!m)return;$('#owner').value=m[1];$('#repo').value=location.pathname.split('/').filter(Boolean)[0]||m[1]+'.github.io';}
function repoInfo(){return `${state.owner}/${state.repo} · ${state.branch}`;}
function validatePath(val,label){if(!/^[A-Za-z0-9._-]+$/.test(val)||val==='.'||val==='..')throw Error(`${label} invalide.`);}
function githubUrl(path){return `https://api.github.com/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}/contents/${path}`;}
function headers(){return {'Accept':'application/vnd.github+json','Authorization':`Bearer ${state.token}`,'X-GitHub-Api-Version':'2026-03-10'};}
function decode64(txt){const binary=atob(txt.replace(/\s+/g,''));return new TextDecoder().decode(Uint8Array.from(binary,c=>c.charCodeAt(0)));}
function encode64(txt){const bytes=new TextEncoder().encode(txt);let binary='';for(let i=0;i<bytes.length;i+=0x4000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x4000));return btoa(binary);}
function base64Blob(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(Error('Lecture de l’image impossible.'));r.onload=()=>resolve(String(r.result).split(',')[1]);r.readAsDataURL(blob);});}
async function api(path,method='GET',body=null){const response=await fetch(githubUrl(path)+(method==='GET'?'?ref='+encodeURIComponent(state.branch):''),{method,headers:{...headers(),...(body?{'Content-Type':'application/json'}:{})},cache:'no-store',body:body?JSON.stringify(body):undefined});const result=await response.json().catch(()=>({}));return {response,result};}
async function readRemote(type){const {response,result}=await api(PATHS[type]);if(!response.ok)throw Error(`Lecture de ${PATHS[type]} impossible (HTTP ${response.status}) : ${result.message||'vérifie les droits et les fichiers sur GitHub'}`);
 if(!result.sha||typeof result.content!=='string')throw Error(`Contenu de ${PATHS[type]} non pris en charge.`);
 let records;try{records=JSON.parse(decode64(result.content));}catch{throw Error(`${PATHS[type]} n'est pas un JSON valide.`);}
 if(!Array.isArray(records)||records.length>1000)throw Error(`Format de ${PATHS[type]} invalide.`);
 return {records,sha:result.sha};}
async function readHomeRemote(){const {response,result}=await api(HOME_PATH);if(response.status===404)return {record:{banner:'./assets/bandeau-elections-2026.png',alt:'Élections professionnelles 2026 : je vote SNUDI-FO 30 et FNEC FP-FO 30'},sha:''};if(!response.ok)throw Error(`Lecture du bandeau impossible (HTTP ${response.status}) : ${result.message||'vérifie les droits GitHub'}`);
 let record;try{record=JSON.parse(decode64(result.content));}catch{throw Error('Le fichier du bandeau n’est pas un JSON valide.');}
 if(!record||typeof record!=='object'||typeof record.banner!=='string'||typeof record.alt!=='string')throw Error('Configuration de l’accueil invalide.');return {record,sha:result.sha};}
function resetHomeDraft(){if(state.homeDraft?.url)URL.revokeObjectURL(state.homeDraft.url);state.homeDraft=null;state.homeRemoved=false;state.homeDirty=false;state.homeAlt=state.home.alt||'';}
async function reloadAll(){setBusy(true);try{
 const [n,e,t,h]=await Promise.all([readRemote('news'),readRemote('events'),readRemote('tools'),readHomeRemote()]);
 state.records.news=n.records;state.records.events=e.records;state.records.tools=t.records;state.sha.news=n.sha;state.sha.events=e.sha;state.sha.tools=t.sha;state.home=h.record;state.homeSha=h.sha;
 try{state.pdfLibrary=await listRemotePdfs();state.pdfLibraryError='';}catch(error){state.pdfLibrary=[];state.pdfLibraryError=error.message;}
 resetDraft();resetOrder();resetHomeDraft();render();message(state.pdfLibraryError?'Contenus chargés. Bibliothèque PDF temporairement indisponible : '+state.pdfLibraryError:'Contenus et bibliothèque PDF chargés depuis GitHub.',state.pdfLibraryError?'':'ok');
 }catch(error){message(error.message,'error');throw error;}finally{setBusy(false);}}
async function listRemotePdfs(){
 const {response,result}=await api(PDF_FOLDER);
 if(response.status===404)return [];
 if(!response.ok||!Array.isArray(result))throw Error(`Liste des PDF impossible (HTTP ${response.status}).`);
 if(result.length>=1000)throw Error('Le dossier PDF atteint la limite de lecture de cette API (1 000 fichiers).');
 return result.filter(f=>f.type==='file'&&SnudiPdf.normalize(f.path)).map(f=>({path:SnudiPdf.normalize(f.path),size:f.size||0,sha:f.sha||''})).sort((a,b)=>a.path.localeCompare(b.path));
}
async function connect(event){event.preventDefault();if(state.busy)return;const f=new FormData(event.currentTarget);
 try{state.owner=String(f.get('owner')||'').trim();state.repo=String(f.get('repo')||'').trim();state.branch=String(f.get('branch')||'main').trim();state.token=String(f.get('token')||'').trim();validatePath(state.owner,'Propriétaire');validatePath(state.repo,'Dépôt');if(!state.branch||state.branch.includes('..'))throw Error('Branche invalide.');if(!state.token)throw Error('Jeton GitHub manquant.');await reloadAll();$('#token').value='';$('#repositoryTitle').textContent=repoInfo();$('#repositorySubtitle').textContent='Actualités, calendrier, outils et bandeau d’accueil publiés sur GitHub.';$('#connection').hidden=true;$('#workspace').hidden=false;}catch(error){state.token='';$('#token').value='';message(error.message,'error');}}
function mk(tag,cls='',txt=''){const el=document.createElement(tag);if(cls)el.className=cls;if(txt)el.textContent=txt;return el;}
function field(f,value){const wrap=mk('div','form-control');const label=mk('label','',f.label+(f.required?' *':''));label.htmlFor='field_'+f.key;wrap.append(label);let input;
 if(f.type==='textarea'){input=mk('textarea');input.rows=4;input.placeholder=f.placeholder||'';input.value=value||'';}
 else if(f.type==='select'){input=mk('select','input');const vals=[...(f.options||[])];if(value&&!vals.includes(value))vals.push(value);vals.forEach(v=>{const o=mk('option','',f.key==='section'?(SECTION_NAMES[v]||v):v);o.value=v;input.append(o);});input.value=value||vals[0]||'';}
 else {input=mk('input','input');input.type=f.type==='url'?'text':f.type;input.placeholder=f.placeholder||'';input.value=value||'';if(f.type==='url'){input.inputMode='url';input.autocomplete='off';input.spellcheck=false;input.autocapitalize='none';}}
 input.id='field_'+f.key;input.name=f.key;input.required=Boolean(f.required);wrap.append(input);if(f.type==='url'&&!f.required)wrap.append(mk('p','field-hint','Facultatif : laisse ce champ vide si tu n’as pas de lien à ajouter.'));return wrap;}
function usedPaths(record){const results=new Set();if(!record||typeof record!=='object')return results;const cover=SnudiArticle.asPath(record.cover||'');if(cover)results.add(cover);SnudiArticle.imagePaths(record.bodyHtml||'').forEach(p=>results.add(p));return results;}
function resetDraft(){state.pdfDraft=[];for(const url of state.pendingMedia.keys())URL.revokeObjectURL(url);state.pendingMedia.clear();if(state.coverDraft){URL.revokeObjectURL(state.coverDraft.url);state.coverDraft=null;}state.coverRemoved=false;state.editorRange=null;state.selectedImage=null;state.dirty=false;state.editingId=null;}
function confirmDiscard(){return !state.dirty||confirm('Les modifications de ce formulaire ne sont pas publiées. Les abandonner ?');}
function renderList(){
 const list=$('#recordList');list.replaceChildren();
 const sections=Object.keys(SECTION_NAMES),positions=new Map();
 if(state.tab==='tools')sections.forEach(section=>orderedTools(state.records.tools,section).forEach((record,index)=>positions.set(record.id,index)));
 const records=[...state.records[state.tab]]
  .filter(r=>state.tab!=='tools'||(Boolean(SECTION_NAMES[r.section])&&(state.toolsFilter==='all'||r.section===state.toolsFilter)))
  .sort((a,b)=>state.tab==='news'?(b.date||'').localeCompare(a.date||''):state.tab==='events'?(a.date||'').localeCompare(b.date||''):sections.indexOf(a.section)-sections.indexOf(b.section)||(positions.get(a.id)??0)-(positions.get(b.id)??0));
 $('#listTitle').textContent=(state.tab==='news'?'Actualités':state.tab==='events'?'Événements':'Contenus des outils')+` (${records.length})`;
 if(!records.length){list.append(mk('p','muted','Aucune entrée. Ajoute une première publication.'));return;}
 records.forEach(r=>{const card=mk('article','admin-record'+(state.editingId===r.id?' selected':''));const main=mk('div','admin-record-main');main.append(mk('b','',r.title||'Sans titre'),mk('span','',state.tab==='tools'?(SECTION_NAMES[r.section]||r.section||'Outil')+(r.tag?' • '+r.tag:''):`${r.date||'Sans date'} • ${r.tag||r.type||'Autre'}`));if(r.cover)main.append(mk('span','','🖼️ Image de couverture'));const actions=mk('div','admin-record-actions');const edit=mk('button','','Modifier');edit.type='button';edit.dataset.action='edit';edit.dataset.id=r.id;const del=mk('button','delete','Supprimer');del.type='button';del.dataset.action='delete';del.dataset.id=r.id;actions.append(edit,del);card.append(main,actions);list.append(card);});}
function markupFromLegacy(body){return String(body||'').split(/\n\s*\n/).filter(s=>s.trim()).map(s=>'<p>'+escapeHtml(s).replace(/\n/g,'<br>')+'</p>').join('');}
function coverArea(rec){const wrap=mk('section','media-control');const label=mk('div','media-control-title','Image de couverture (facultative)');wrap.append(label);wrap.append(mk('p','field-hint',state.tab==='tools'?'Visible dans la liste des outils et en haut de la fiche. JPEG, PNG ou WebP, optimisé avant envoi.':'Visible sur les cartes d’actualité et en haut de l’article. JPEG, PNG ou WebP, optimisé avant envoi.'));
 const img=mk('img','admin-cover-preview');img.id='coverPreview';img.alt='Aperçu de la couverture';img.hidden=true;wrap.append(img);
 const controls=mk('div','flex-wrap');const choose=mk('label','btn btn-outline btn-sm upload-label','Choisir une image');choose.htmlFor='coverFile';const input=mk('input');input.type='file';input.id='coverFile';input.accept='image/jpeg,image/png,image/webp';input.hidden=true;choose.append(input);const remove=mk('button','btn btn-neutral btn-sm','Retirer l’image');remove.type='button';remove.id='removeCover';controls.append(choose,remove);wrap.append(controls);const info=mk('div','field-hint');info.id='coverStatus';wrap.append(info);return wrap;}
function richEditorArea(rec){const wrap=mk('section','rich-section');const label=mk('div','media-control-title',state.tab==='tools'?'Contenu de la publication':'Contenu de l’article');label.id='richEditorLabel';wrap.append(label);wrap.append(mk('p','field-hint',state.tab==='tools'?'Mise en forme et images intégrées. Pour les modèles de courrier, le texte édité sera également copiable.':'Mise en forme et images intégrées. Les anciennes actualités restent modifiables.'));
 const bar=mk('div','rich-toolbar');bar.setAttribute('role','toolbar');bar.setAttribute('aria-label','Mise en forme de l’article');const controls=[['bold','Gras','G'],['italic','Italique','I'],['underline','Souligné','S'],['h2','Titre H2','H2'],['h3','Sous-titre H3','H3'],['ul','Liste à puces','• Liste'],['ol','Liste numérotée','1. Liste'],['quote','Citation','❝'],['link','Créer un lien','Lien'],['unlink','Enlever le lien','Sans lien']];
 controls.forEach(([cmd,title,label])=>{const b=mk('button','rich-tool',label);b.type='button';b.title=title;b.setAttribute('aria-label',title);b.dataset.cmd=cmd;bar.append(b);});
 const imageButton=mk('button','rich-tool rich-tool-image','＋ Image dans le texte');imageButton.type='button';imageButton.id='insertInlineImage';bar.append(imageButton);wrap.append(bar);
 const editor=mk('div','rich-editor article-content');editor.id='richEditor';editor.contentEditable='true';editor.setAttribute('role','textbox');editor.setAttribute('aria-multiline','true');editor.setAttribute('aria-label','Contenu enrichi de l’article');editor.dataset.placeholder='Rédige le contenu et ajoute des images à l’endroit souhaité…';editor.innerHTML=SnudiArticle.sanitize(rec.bodyHtml||markupFromLegacy(rec.body||''));wrap.append(editor);
 const imageInput=mk('input');imageInput.type='file';imageInput.accept='image/jpeg,image/png,image/webp';imageInput.id='inlineImageInput';imageInput.hidden=true;wrap.append(imageInput);
 const replaceInput=mk('input');replaceInput.type='file';replaceInput.accept=imageInput.accept;replaceInput.id='replaceInlineInput';replaceInput.hidden=true;wrap.append(replaceInput);
 const imageTools=mk('div','selected-image-tools');imageTools.id='selectedImageTools';imageTools.hidden=true;imageTools.append(mk('span','field-hint','Image sélectionnée :'));
 const replace=mk('button','btn btn-outline btn-sm','Remplacer');replace.type='button';replace.id='replaceInline';const del=mk('button','btn btn-neutral btn-sm','Supprimer');del.type='button';del.id='deleteInline';imageTools.append(replace,del);wrap.append(imageTools);wrap.append(mk('p','field-hint','Astuce : clique sur une image dans l’article pour la remplacer ou la supprimer. Les images sont compressées automatiquement avant publication.'));
 return wrap;}
/* PDF partagés : bibliothèque commune aux actualités, événements et outils. */
function pdfName(path){
 for(const section of ['news','events','tools'])for(const r of state.records[section]){
  const match=SnudiPdf.attachments(r).find(a=>a.path===path);
  if(match)return match.label;
 }
 return 'PDF '+path.slice(-16,-4);
}
function pdfAttachmentsArea(){
 const box=mk('section','pdf-admin');box.id='pdfAttachmentsArea';
 box.append(mk('div','media-control-title','Documents PDF joints à cette publication (facultatif)'));
 box.append(mk('p','field-hint','Jusqu’à 20 documents par publication, 10 Mo par fichier. Un même PDF hébergé sur GitHub peut servir dans plusieurs publications, sans copie supplémentaire.'));
 const list=mk('div','pdf-admin-list');list.id='pdfAdminList';box.append(list);
 const row=mk('div','pdf-actions');
 const upload=mk('label','form-control','Importer un nouveau PDF');const file=mk('input','input');file.type='file';file.accept='.pdf,application/pdf';file.multiple=true;file.id='pdfFileInput';upload.append(file);row.append(upload);
 const selectWrap=mk('label','form-control','Réutiliser un PDF déjà publié');const select=mk('select','input');select.id='pdfLibrarySelect';selectWrap.append(select);row.append(selectWrap);
 const add=mk('button','btn btn-outline btn-sm','+ Associer ce PDF');add.id='pdfAddExisting';add.type='button';row.append(add);box.append(row);
 const status=mk('p','field-hint');status.id='pdfLibraryHint';box.append(status);return box;
}
function renderPdfAttachments(){
 const area=$('#pdfAttachmentsArea');if(!area)return;
 const list=$('#pdfAdminList');list.replaceChildren();
 if(!state.pdfDraft.length)list.append(mk('p','muted','Aucun PDF associé à cette publication.'));
 for(const item of state.pdfDraft){
  const row=mk('div','pdf-attachment-item');const field=mk('label','form-control','Titre visible par les collègues');
  const input=mk('input','input');input.type='text';input.maxLength=120;input.required=true;input.dataset.pdfLabel=item.id;input.value=item.label;field.append(input);row.append(field);
  const remove=mk('button','btn btn-neutral btn-sm','Retirer');remove.type='button';remove.dataset.removePdf=item.id;row.append(remove);
  const details=mk('div','pdf-attachment-meta',item.file?`À envoyer sur GitHub • ${(item.file.size/1024/1024).toFixed(2)} Mo`:'Déjà sur GitHub • '+(item.path?item.path.slice(-16,-4):''));
  row.append(details);list.append(row);
 }
 const select=$('#pdfLibrarySelect'),prior=select.value;select.replaceChildren();
 const option=mk('option','','— Choisir un document hébergé —');option.value='';select.append(option);
 for(const item of state.pdfLibrary){const opt=mk('option','',pdfName(item.path)+' · '+(item.size/1024/1024).toFixed(2)+' Mo');opt.value=item.path;select.append(opt);}
 if([...select.options].some(o=>o.value===prior))select.value=prior;
 $('#pdfAddExisting').disabled=!state.pdfLibrary.length;
 $('#pdfLibraryHint').textContent=state.pdfLibraryError?'La liste des PDF n’a pas pu être chargée : '+state.pdfLibraryError:state.pdfLibrary.length?state.pdfLibrary.length+' PDF hébergé(s) dans le dépôt. La sélection n’augmente pas l’espace utilisé.':'Aucun PDF hébergé pour le moment. Importe le premier document pour créer la bibliothèque.';
}
async function addPdfFile(file){
 if(!file)return;
 if(state.pdfDraft.length>=PDF_MAX_PER_PUBLICATION)throw Error('Maximum 20 PDF par publication.');
 if(file.size<6||file.size>PDF_MAX_BYTES)throw Error('« '+file.name+' » : le PDF doit peser au maximum 10 Mo.');
 if(!/\.pdf$/i.test(file.name))throw Error('Le fichier doit porter l’extension .pdf.');
 const header=String.fromCharCode(...new Uint8Array(await file.slice(0,5).arrayBuffer()));
 if(header!=='%PDF-')throw Error('Le fichier « '+file.name+' » ne contient pas un en-tête PDF valide.');
 const label=file.name.replace(/\.pdf$/i,'').replace(/[_-]+/g,' ').slice(0,120).trim()||'Document PDF';
 state.pdfDraft.push({id:photoId(),label,file,path:''});state.dirty=true;renderPdfAttachments();
 message('PDF ajouté au formulaire. Il sera envoyé sur GitHub au moment de la publication.','ok');
}
function addExistingPdf(){
 const path=SnudiPdf.normalize($('#pdfLibrarySelect')?.value||'');if(!path){message('Choisis un PDF dans la bibliothèque.','error');return;}
 if(state.pdfDraft.length>=PDF_MAX_PER_PUBLICATION){message('Maximum 20 PDF par publication.','error');return;}
 if(state.pdfDraft.some(d=>d.path===path)){message('Ce PDF figure déjà dans la publication.','error');return;}
 state.pdfDraft.push({id:photoId(),path,label:pdfName(path),file:null});state.dirty=true;renderPdfAttachments();
 message('Le PDF existant est associé à cette publication sans nouvelle copie.','ok');
}
async function uploadPendingPdfs(record){
 const entries=[];const seen=new Set();
 for(const entry of state.pdfDraft){
  let path=SnudiPdf.normalize(entry.path);
  if(entry.file){
   if(!window.crypto?.subtle)throw Error('Le navigateur ne permet pas le calcul sécurisé de l’empreinte PDF. Utilise HTTPS sur GitHub Pages.');
   const bytes=await entry.file.arrayBuffer();
   if(bytes.byteLength>PDF_MAX_BYTES)throw Error('Un PDF dépasse 10 Mo.');
   const hash=await crypto.subtle.digest('SHA-256',bytes);
   const digest=Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
   path=PDF_FOLDER+'/'+digest+'.pdf';
   const existing=await api(path);
   if(existing.response.status===404){
    const content=await base64Blob(new Blob([bytes],{type:'application/pdf'}));
    const result=await api(path,'PUT',{message:'SNUDI FO 30 : import PDF partagé '+digest.slice(0,12),branch:state.branch,content});
    if(!result.response.ok){
     const after=await api(path);
     if(!after.response.ok)throw Error('Impossible d’importer le PDF ('+result.response.status+') : '+(result.result.message||'vérifie les droits GitHub'));
    }else state.pdfUploadPaths.add(path);
   }else if(!existing.response.ok)throw Error('Lecture du PDF sur GitHub impossible : HTTP '+existing.response.status);
   entry.path=path;
   if(!state.pdfLibrary.some(x=>x.path===path))state.pdfLibrary.push({path,size:entry.file.size});
  }
  if(!path)throw Error('Un PDF associé à la publication est introuvable.');
  if(!entry.file){const available=await api(path);if(available.response.status===404)throw Error('Le PDF « '+entry.label+' » n’existe plus sur GitHub. Retire ce lien puis réimporte le fichier.');if(!available.response.ok)throw Error('Impossible de vérifier le PDF « '+entry.label+' » sur GitHub.');}
  if(seen.has(path))throw Error('Le même PDF est présent deux fois dans cette publication. Retire l’un des doublons.');
  seen.add(path);entries.push({label:String(entry.label).trim().slice(0,120),path});
 }
 if(entries.length)record.attachments=entries;else delete record.attachments;
 return record;
}
/* Nettoyage prudent : on consulte les TROIS fichiers de publications après l’enregistrement.
   Une erreur de lecture bloque la suppression, jamais la publication.
   Les commits GitHub par fichier ne sont pas transactionnels : les modifications réellement simultanées
   doivent être évitées et restent un cas à sécuriser par une authentification/édition centralisée. */
async function cleanUnreferencedPdfs(candidatePaths){
 const paths=[...new Set(candidatePaths.map(SnudiPdf.normalize).filter(Boolean))];
 if(!paths.length)return {deleted:0,errors:[],retained:0};
 let remote;
 try{const all=await Promise.all(['news','events','tools'].map(readRemote));remote={news:all[0].records,events:all[1].records,tools:all[2].records};}
 catch(error){return {deleted:0,retained:paths.length,errors:['Nettoyage PDF suspendu : une catégorie est inaccessible ('+error.message+').']};}
 const used=SnudiPdf.references(remote),errors=[];let deleted=0,retained=0;
 for(const path of paths){
  if(used.has(path)){retained++;continue;}
  try{
   const fresh=await api(path);
   if(fresh.response.status===404)continue;
   if(!fresh.response.ok||!fresh.result.sha)throw Error('Fichier PDF inaccessible');
   const removed=await api(path,'DELETE',{message:'SNUDI FO 30 : retrait PDF sans aucune publication',branch:state.branch,sha:fresh.result.sha});
   if(!removed.response.ok)throw Error('Erreur GitHub HTTP '+removed.response.status);
   state.pdfLibrary=state.pdfLibrary.filter(f=>f.path!==path);state.pdfUploadPaths.delete(path);deleted++;
  }catch(error){errors.push('PDF '+path.slice(-16,-4)+' : '+error.message);}
 }
 return {deleted,errors,retained};
}
function pdfLinksArea(rec){const wrap=mk('section','pdf-link-editor');wrap.id='pdfLinksArea';const title=mk('label','media-control-title','Liens PDF externes (facultatif)');title.htmlFor='field_downloads';wrap.append(title);wrap.append(mk('p','field-hint','Un document par ligne : Nom du fichier | https://adresse-du-pdf. Tu peux aussi insérer des liens directement dans le texte enrichi. Les PDF ne seront pas téléchargés sur GitHub.'));const textarea=mk('textarea','input');textarea.id='field_downloads';textarea.name='downloads';textarea.rows=4;textarea.placeholder='Affiche syndicale | https://exemple.fr/affiche.pdf\nPanneau syndical | https://exemple.fr/panneau.pdf';textarea.value=Array.isArray(rec.downloads)?rec.downloads.map(d=>`${d.label} | ${d.url}`).join('\n'):'';wrap.append(textarea);return wrap;}
function showPdfLinks(){const section=$('#field_section')?.value;const box=$('#pdfLinksArea');if(box)box.hidden=!['affichages','dossiers'].includes(section);const help=$('#pdfLinksHelp');if(help)help.hidden=!['affichages','dossiers'].includes(section);}
function updateToolFormContext(){
 if(state.tab!=='tools')return;
 const section=$('#field_section')?.value||'affichages',label=SECTION_NAMES[section]||'Mes outils',isEditing=Boolean(state.editingId);
 $('#editorTitle').textContent=(isEditing?'Modifier : ':'Nouvelle publication : ')+label;
 const richLabel=$('#richEditorLabel');if(richLabel)richLabel.textContent=section==='dossiers'?'Contenu du dossier thématique':section==='fiches'?'Contenu de la fiche de droits':section==='modeles'?'Contenu du modèle de courrier':'Contenu de l’affichage';
}
function renderForm(){const form=$('#recordForm');form.replaceChildren();const rec=state.records[state.tab].find(r=>r.id===state.editingId)||{};$('#editorTitle').textContent=(state.editingId?'Modifier ':'Nouvelle ')+(state.tab==='news'?'actualité':state.tab==='events'?'entrée du calendrier':'fiche / ressource des outils');$('#editingBadge').hidden=!state.editingId;
 for(const f of FIELDS[state.tab]){if((state.tab==='news'||state.tab==='tools')&&f.key==='url'){form.append(coverArea(rec),richEditorArea(rec));}const initial=rec[f.key]||(!state.editingId&&f.key==='date'?today():(!state.editingId&&f.key==='tag'&&state.tab==='news'?'Actualité':(!state.editingId&&f.key==='section'?(state.toolsFilter!=='all'?state.toolsFilter:'affichages'):'')));form.append(field(f,initial));}
 if(state.tab==='tools'){form.append(pdfLinksArea(rec));const help=mk('p','field-hint','Affichages écoles et Dossiers thématiques : tu peux ajouter plusieurs liens PDF externes, ou réutiliser des PDF de la bibliothèque GitHub.');help.id='pdfLinksHelp';form.append(help);showPdfLinks();}
 form.append(pdfAttachmentsArea());
 const actions=mk('div','form-actions');{const preview=mk('button','btn btn-outline',state.tab==='tools'?'Prévisualiser la fiche':state.tab==='events'?'Prévisualiser les PDF':'Prévisualiser l’article');preview.type='button';preview.id='previewArticle';actions.append(preview);}const save=mk('button','btn btn-primary',state.editingId?'Publier les modifications':'Publier sur GitHub');save.type='submit';const reset=mk('button','btn btn-neutral','Annuler');reset.type='button';reset.id='cancelEdit';actions.append(save,reset);form.append(actions);
 const help=mk('p','field-hint',state.tab==='news'?'Les photos sont enregistrées dans le dépôt avec le jeton GitHub actuel. Une publication peut nécessiter plusieurs commits (images puis article).':state.tab==='events'?'Les catégories correspondent aux filtres de l’agenda public.':'Les quatre rubriques publiques sont : Affichages écoles, Mes droits, Dossiers thématiques et Modèles de courriers. La catégorie « Archives (non publiées) » n’apparaît pas dans l’application publique. Tu peux créer des dossiers longs avec titres, images, liens et PDF partagés. Les images sont publiées dans media/outils/.');form.append(help);
 if(state.tab!=='events'){refreshCover(rec);updateSelectedImage(null);}renderPdfAttachments();updateToolFormContext();}
function refreshCover(rec={}){const img=$('#coverPreview');if(!img)return;const src=state.coverDraft?.url||(!state.coverRemoved?SnudiArticle.asPath(rec.cover||''):'');img.hidden=!src;if(src)img.src=src;else img.removeAttribute('src');$('#coverStatus').textContent=state.coverDraft?'Nouvelle image sélectionnée et compressée.':src?'Image actuellement publiée.':'Aucune couverture sélectionnée.';$('#removeCover').disabled=!src;}
function updateSelectedImage(node){if(state.selectedImage&&state.selectedImage.isConnected)state.selectedImage.classList.remove('image-selected');const ed=$('#richEditor');state.selectedImage=(node&&ed?.contains(node)&&node.tagName==='IMG')?node:null;if(state.selectedImage)state.selectedImage.classList.add('image-selected');const tools=$('#selectedImageTools');if(tools)tools.hidden=!state.selectedImage;}
function renderReorder(){
 const toolsTab=state.tab==='tools',chosen=Boolean(SECTION_NAMES[state.toolsFilter]);
 $('#reorderToolbar').hidden=!toolsTab||state.orderMode;
 $('#openReorder').disabled=!chosen;
 $('#reorderHint').textContent=chosen?'Les articles de « '+SECTION_NAMES[state.toolsFilter]+' » sont présentés dans l’ordre choisi.':'Choisis une rubrique dans le filtre pour définir l’ordre de ses articles.';
 $('#reorderPanel').hidden=!state.orderMode;
 $('#recordList').hidden=state.orderMode;
 $('#newButton').hidden=state.orderMode;
 $('#workspace').classList.toggle('reordering',state.orderMode);
 if(!state.orderMode)return;
 $('#reorderTitle').textContent='Ordre des articles — '+SECTION_NAMES[state.orderSection];
 const panel=$('#reorderItems');panel.replaceChildren();
 state.orderDraft.forEach((id,index)=>{
  const item=state.records.tools.find(r=>r.id===id);if(!item)return;
  const row=mk('div','reorder-item');
  const number=mk('span','reorder-number',String(index+1));
  const label=mk('span','reorder-label',item.title);
  const buttons=mk('div','reorder-buttons');
  for(const [direction,symbol,text,isDisabled] of [['up','↑','Monter',index===0],['down','↓','Descendre',index===state.orderDraft.length-1]]){
   const button=mk('button','reorder-arrow',symbol);button.type='button';button.dataset.move=direction;button.dataset.id=id;
   button.disabled=isDisabled||state.busy;button.title=text+' : '+item.title;button.setAttribute('aria-label',text+' « '+item.title+' »');buttons.append(button);
  }
  row.append(number,label,buttons);panel.append(row);
 });
 $('#saveReorder').disabled=!state.orderDirty||state.busy;
}
function startReorder(){
 if(state.busy||state.tab!=='tools'||!SECTION_NAMES[state.toolsFilter])return;
 if(state.dirty&&!confirmDiscard())return;
 if(state.dirty)resetDraft();
 state.orderMode=true;state.orderSection=state.toolsFilter;
 state.orderDraft=orderedTools(state.records.tools,state.orderSection).map(r=>r.id);state.orderDirty=false;render();
}
function moveReorder(id,direction){
 if(!state.orderMode||state.busy)return;
 const i=state.orderDraft.indexOf(id),j=i+(direction==='up'?-1:direction==='down'?1:0);
 if(i<0||j<0||j>=state.orderDraft.length||i===j)return;
 [state.orderDraft[i],state.orderDraft[j]]=[state.orderDraft[j],state.orderDraft[i]];
 state.orderDirty=true;renderReorder();
}
async function saveReorder(){
 if(!state.orderMode||!state.orderDirty||state.busy)return;
 const section=state.orderSection,ids=[...state.orderDraft];
 if(ids.length!==orderedTools(state.records.tools,section).length||new Set(ids).size!==ids.length){message('Impossible de publier : la liste a changé. Actualise les contenus.','error');return;}
 if(!confirm('Publier ce nouvel ordre pour « '+SECTION_NAMES[section]+' » sur GitHub ?'))return;
 setBusy(true);
 try{
  await assertUnchanged('tools');
  const positions=new Map(ids.map((id,index)=>[id,index]));
  const updated=state.records.tools.map(record=>positions.has(record.id)?{...record,order:positions.get(record.id)}:record);
  const sha=await writeRemote('tools',updated,state.sha.tools,'SNUDI FO 30 : nouvel ordre des contenus — '+SECTION_NAMES[section]);
  state.sha.tools=sha;state.records.tools=updated;resetOrder();render();
  message('Nouvel ordre enregistré sur GitHub. Il sera visible après le déploiement de GitHub Pages.','ok');
 }catch(error){message(error.message,'error');}finally{setBusy(false);renderReorder();}
}
function renderRetiredBaremePanel(){
 const panel=$('#retiredBaremePanel'),details=$('#retiredBaremeDescription'),button=$('#deleteRetiredBareme');
 if(!panel||!details||!button)return;
 const legacy=state.records.tools.filter(r=>r.section==='bareme');
 panel.hidden=state.tab!=='tools'||state.view!=='records'||!legacy.length;
 if(legacy.length){details.textContent=legacy.length+' ancien(s) article(s) « Barème mouvement » sont encore enregistrés dans tools.json. Ils ne sont plus visibles dans l’application. Après sauvegarde, tu peux les supprimer définitivement de GitHub, sans toucher aux autres outils.';button.disabled=state.busy;}
}
async function deleteRetiredBareme(){
 if(state.busy||state.tab!=='tools'||!confirmDiscard()||!ensureReorderClosed())return;
 const legacy=state.records.tools.filter(r=>r.section==='bareme');if(!legacy.length)return;
 if(!confirm('Supprimer définitivement les '+legacy.length+' ancien(s) article(s) de « Barème mouvement » sur GitHub ? Cette action ne peut pas être annulée. Exporte une sauvegarde avant de continuer.'))return;
 setBusy(true);
 try{
  await assertUnchanged('tools');
  const before=[...state.records.tools],updated=before.filter(r=>r.section!=='bareme');
  const sha=await writeRemote('tools',updated,state.sha.tools,'SNUDI FO 30 : retrait définitif des anciens articles Barème mouvement');
  state.sha.tools=sha;state.records.tools=updated;
  // Réutilisation de la bibliothèque partagée : aucun PDF conservé par une autre publication n'est supprimé.
  const paths=[...new Set(legacy.flatMap(r=>[...SnudiPdf.referencedPaths(r)]))];
  const pdfResult=await cleanUnreferencedPdfs(paths);
  // Les images sont nettoyées avec la même routine que lors de la suppression ordinaire d'un outil.
  const imageResult=await cleanUnusedMedia(before,updated);
  resetDraft();render();
  const problems=[...pdfResult.errors,...imageResult.errors];
  message(legacy.length+' ancien(s) article(s) supprimé(s) de GitHub. '+(pdfResult.deleted?pdfResult.deleted+' PDF inutilisé(s) supprimé(s). ':'')+(problems.length?problems.length+' média(s) non nettoyé(s), à vérifier dans le dépôt.':'Les autres rubriques sont conservées.'),problems.length?'':'ok');
 }catch(error){message(error.message,'error');}
 finally{setBusy(false);renderRetiredBaremePanel();}
}
function render(){for(const tab of ['news','events','tools','home']){const button=$('#tab'+tab[0].toUpperCase()+tab.slice(1));const active=tab==='home'?state.view==='home':state.view==='records'&&state.tab===tab;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));}$('#adminContentGrid').hidden=state.view==='home';$('#homeBannerAdmin').hidden=state.view!=='home';if(state.view==='home'){renderHomePanel();return;}$('#toolFilterRow').hidden=state.tab!=='tools';$('#toolSectionFilter').value=state.toolsFilter;renderList();renderForm();renderReorder();renderRetiredBaremePanel();}
function confirmHomeDiscard(){return !state.homeDirty||confirm('Le nouveau bandeau n’a pas été publié. Abandonner les modifications ?');}
function chooseTab(tab){if(state.busy||!['news','events','tools'].includes(tab))return;if(state.view==='home'){if(!confirmHomeDiscard())return;resetHomeDraft();}else if(tab!==state.tab&&(!confirmDiscard()||!ensureReorderClosed()))return;state.view='records';if(tab!==state.tab)resetDraft();state.tab=tab;render();}
function chooseHomeTab(){if(state.busy||state.view==='home')return;if(!confirmDiscard()||!ensureReorderClosed())return;resetDraft();state.view='home';render();}
function startEdit(id){if(state.busy||!confirmDiscard()||!ensureReorderClosed())return;resetDraft();state.editingId=id;state.pdfDraft=SnudiPdf.attachments(state.records[state.tab].find(x=>x.id===id)||{}).map(a=>({...a,id:photoId(),file:null}));render();$('#recordForm').scrollIntoView({behavior:'smooth',block:'start'});}
function parseDownloadLinks(raw){const links=[];for(const line of String(raw||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean)){
 const sep=line.indexOf('|');if(sep<1)throw Error('Chaque lien PDF doit respecter le format : Titre | https://adresse');
 const label=line.slice(0,sep).trim(),url=line.slice(sep+1).trim();let parsed;try{parsed=new URL(url);}catch{}
 if(!label||label.length>120||!parsed||parsed.protocol!=='https:'||!parsed.hostname.includes('.')||url.length>1500)throw Error('Vérifie chaque lien PDF : titre de 120 caractères maximum et adresse HTTPS valide.');
 links.push({label,url:parsed.href});}
 if(links.length>20)throw Error('Limite de 20 liens PDF par article.');return links;}
function createRecord(form){const fd=new FormData(form),original=state.records[state.tab].find(x=>x.id===state.editingId);const r=original?{...original}:{};
 for(const f of FIELDS[state.tab]){
  const value=String(fd.get(f.key)||'').trim();
  if(f.type==='url'){
   if(!value){delete r[f.key];continue;}
   let valid=false;try{const parsed=new URL(value);valid=parsed.protocol==='https:'&&parsed.hostname.includes('.');}catch{}
   if(!valid)throw Error(`Le champ « ${f.label} » doit contenir une adresse HTTPS valide ou rester vide.`);
  }
  r[f.key]=value;
 }
 if(!r.title||((state.tab==='news'||state.tab==='events')&&!r.date)||((state.tab==='news'||state.tab==='tools')&&!r.summary))throw Error('Complète les champs obligatoires.');
 if(state.tab==='events'&&r.end&&r.end<r.date)throw Error('La date de fin précède la date de début.');
 if(state.tab==='tools'&&!SECTION_NAMES[r.section])throw Error('Choisis une rubrique valide.');
 if(state.tab==='tools'){
  if(r.section==='affichages'||r.section==='dossiers'){
   const raw=String(fd.get('downloads')||'').trim();const links=[];
   links.push(...parseDownloadLinks(raw));
   if(links.length)r.downloads=links;else delete r.downloads;
  }else delete r.downloads;
  delete r.copyText; // Le contenu à copier doit toujours correspondre au texte actualisé de l'éditeur.
  // Les nouveaux contenus et les déplacements vers une autre rubrique arrivent en bas.
  if(!original||original.section!==r.section){
   const others=orderedTools(state.records.tools,r.section).filter(item=>item.id!==original?.id);
   const maximum=others.reduce((max,item,index)=>Math.max(max,Number.isSafeInteger(item.order)&&item.order>=0?item.order:index),-1);
   r.order=Math.max(others.length,maximum+1);
  }
 }
 if(state.pdfDraft.length>PDF_MAX_PER_PUBLICATION)throw Error('Pas plus de 20 PDF par publication.');
 const allLabels=state.pdfDraft.map(a=>String(a.label||'').trim());
 if(allLabels.some(label=>!label||label.length>120))throw Error('Chaque PDF doit avoir un titre (120 caractères maximum).');
 if(state.pdfDraft.some(a=>!a.file&&!SnudiPdf.normalize(a.path)))throw Error('Un PDF sélectionné a un chemin invalide.');
 // Les chemins des nouveaux fichiers seront ajoutés APRÈS leur transfert.
 const published=state.pdfDraft.filter(a=>!a.file).map(a=>({label:String(a.label).trim(),path:SnudiPdf.normalize(a.path)}));
 if(published.length)r.attachments=published;else delete r.attachments;
 r.id=original?.id||('pub-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8));return r;}
async function writeRemote(type,records,sha,commit){const payload={message:commit,branch:state.branch,content:encode64(JSON.stringify(records,null,2)+'\n'),sha};const {response,result}=await api(PATHS[type],'PUT',payload);if(!response.ok){if(response.status===409||response.status===422)throw Error('Conflit : les contenus ont changé sur GitHub. Actualise-les avant de réessayer.');throw Error(`Publication impossible (HTTP ${response.status}) : ${result.message||'vérifie les permissions GitHub'}`);}return result.content?.sha||'';}
async function assertUnchanged(type){const fresh=await readRemote(type);if(fresh.sha!==state.sha[type])throw Error('Une autre modification a été publiée sur GitHub. Recharge les contenus avant de recommencer.');}
function photoId(){return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);}
async function compressPhoto(file){if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choisis une image JPEG, PNG ou WebP. Les GIF et SVG ne sont pas acceptés.');if(file.size>15*1024*1024)throw Error('Cette image dépasse 15 Mo. Réduis sa taille avant de la sélectionner.');
 let bitmap;try{bitmap=await createImageBitmap(file);}catch{throw Error('Impossible de lire cette image. Essaie en JPEG ou PNG.');}
 try{let scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));for(let attempt=0;attempt<5;attempt++){
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const quality=[.83,.76,.69,.63,.60][attempt];let blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));let ext='webp';if(!blob||blob.type!=='image/webp'){blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));ext='jpg';}
  canvas.width=0;canvas.height=0;
  if(!blob)throw Error('Compression de l’image impossible sur cet appareil.');if(blob.size<=1.5*1024*1024)return {blob,ext,size:blob.size,width:Math.round(bitmap.width*scale),height:Math.round(bitmap.height*scale)};scale*=.78;
 }throw Error('Cette photo reste trop lourde après compression.');}finally{bitmap.close?.();}}
function saveRange(){const selection=window.getSelection(),editor=$('#richEditor');if(selection&&selection.rangeCount&&editor&&(editor.contains(selection.anchorNode)||selection.anchorNode===editor))state.editorRange=selection.getRangeAt(0).cloneRange();}
function restoreRange(){const editor=$('#richEditor');editor.focus();let range=state.editorRange;const sel=window.getSelection();if(range&&editor.contains(range.commonAncestorContainer)){sel.removeAllRanges();sel.addRange(range);}else{range=document.createRange();range.selectNodeContents(editor);range.collapse(false);sel.removeAllRanges();sel.addRange(range);}}
function applyFormat(cmd){restoreRange();const format={'bold':['bold'],italic:['italic'],underline:['underline'],h2:['formatBlock','h2'],h3:['formatBlock','h3'],ul:['insertUnorderedList'],ol:['insertOrderedList'],quote:['formatBlock','blockquote'],unlink:['unlink']};
 if(cmd==='link'){const value=prompt('Adresse du lien (https://…) :','https://');if(value===null)return;if(!/^https:\/\/\S+$/i.test(value)){message('Le lien doit commencer par https://.','error');return;}document.execCommand('createLink',false,value);}
 else if(format[cmd])document.execCommand(format[cmd][0],false,format[cmd][1]||null);state.dirty=true;saveRange();}
async function prepareImage(file){const img=await compressPhoto(file);const url=URL.createObjectURL(img.blob);state.pendingMedia.set(url,{...img,remotePath:null});return url;}
async function selectCover(file){if(!file)return;setBusy(true);try{const compressed=await compressPhoto(file);if(state.coverDraft)URL.revokeObjectURL(state.coverDraft.url);state.coverDraft={...compressed,url:URL.createObjectURL(compressed.blob),remotePath:null};state.coverRemoved=false;state.dirty=true;refreshCover(state.records[state.tab].find(r=>r.id===state.editingId)||{});message('Image de couverture prête ('+Math.round(compressed.size/1024)+' Ko).','ok');}catch(error){message(error.message,'error');}finally{setBusy(false);}}
function removeCover(){if(state.coverDraft)URL.revokeObjectURL(state.coverDraft.url);state.coverDraft=null;state.coverRemoved=true;state.dirty=true;refreshCover(state.records[state.tab].find(r=>r.id===state.editingId)||{});}
async function insertInline(file,replace=false){if(!file)return;setBusy(true);try{const url=await prepareImage(file);if(replace&&state.selectedImage?.isConnected){const img=state.selectedImage;img.src=url;img.alt=prompt('Description de cette image (accessibilité) :',img.alt||'Illustration de l’article')||'Illustration de l’article';updateSelectedImage(img);}
 else{restoreRange();const alt=prompt('Description de cette image (accessibilité) :','Photographie de la publication')||'Photographie de la publication';document.execCommand('insertHTML',false,`<figure><img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}"></figure><p><br></p>`);saveRange();}
 state.dirty=true;message('Image insérée et compressée. Elle sera envoyée à GitHub lors de la publication.','ok');}catch(error){message(error.message,'error');}finally{setBusy(false);}}
function deleteInline(){const img=state.selectedImage;if(!img)return;const parent=img.closest('figure');if(parent&&parent.querySelectorAll('img').length===1)parent.remove();else img.remove();updateSelectedImage(null);state.dirty=true;}
function draftHtml(){return $('#richEditor')?.innerHTML||'';}
function mediaLinksInEditor(){return [...new Set(Array.from($('#richEditor')?.querySelectorAll('img')||[]).map(el=>el.getAttribute('src')||'').filter(s=>s.startsWith('blob:')))];}
async function uploadBlob(blob,ext,role){const path=`media/${state.tab==='tools'?'outils':'actualites'}/${photoId()}-${role}.${ext}`;const content=await base64Blob(blob);const payload={message:`SNUDI FO 30 : ajout d’image ${state.tab==='tools'?'d’outil':'d’actualité'} (${role})`,branch:state.branch,content};const {response,result}=await api(path,'PUT',payload);if(!response.ok)throw Error(`Envoi de l’image impossible (HTTP ${response.status}) : ${result.message||'vérifie les permissions ou la taille'}`);return './'+path;}
async function uploadPendingMedia(record){let html=draftHtml();const temp=document.createElement('div');temp.innerHTML=SnudiArticle.sanitize(html,{allowBlobs:true});const images=Array.from(temp.querySelectorAll('img'));const blobSources=[...new Set(images.map(i=>i.getAttribute('src')||'').filter(s=>s.startsWith('blob:')))];
 for(const src of blobSources){const entry=state.pendingMedia.get(src);if(!entry)throw Error('Une image provisoire n’est plus accessible. Réinsère-la.');if(!entry.remotePath)entry.remotePath=await uploadBlob(entry.blob,entry.ext,'article');for(const image of images)if(image.getAttribute('src')===src)image.setAttribute('src',entry.remotePath);}
 record.bodyHtml=SnudiArticle.sanitize(temp.innerHTML);delete record.body;
 if(state.coverDraft){if(!state.coverDraft.remotePath)state.coverDraft.remotePath=await uploadBlob(state.coverDraft.blob,state.coverDraft.ext,'couverture');record.cover=state.coverDraft.remotePath;}
 else if(state.coverRemoved)delete record.cover;
 return record;}
async function cleanUnusedMedia(previousRecords,currentRecords){const previous=new Set(previousRecords.flatMap(r=>[...usedPaths(r)]));const current=new Set(currentRecords.flatMap(r=>[...usedPaths(r)]));const obsolete=[...previous].filter(path=>!current.has(path));if(!obsolete.length)return {deleted:0,errors:[]};const errors=[];let deleted=0;
 for(const path of obsolete){try{const {response,result}=await api(path.replace(/^\.\//,''));if(response.status===404)continue;if(!response.ok||!result.sha)throw Error('Fichier introuvable ou inaccessible');const deletion=await api(path.replace(/^\.\//,''),'DELETE',{message:'SNUDI FO 30 : retrait d’une image non utilisée',branch:state.branch,sha:result.sha});if(!deletion.response.ok)throw Error(`HTTP ${deletion.response.status}`);deleted++;}catch(error){errors.push(path+': '+error.message);}}
 return {deleted,errors};}
async function publish(event){
 event.preventDefault();if(state.busy)return;let record;try{record=createRecord(event.currentTarget);}catch(error){message(error.message,'error');return;}
 const type=state.tab,before=[...state.records[type]],list=[...before],position=list.findIndex(x=>x.id===record.id);
 if(!confirm(`Publier ${position<0?'la nouvelle entrée':'les modifications'} « ${record.title} » sur GitHub ?`))return;
 setBusy(true);let mediaUploaded=false;const beforeRecord=before.find(x=>x.id===record.id)||{};
 try{
  await assertUnchanged(type);
  if(type==='news'||type==='tools'){const needed=mediaLinksInEditor().length+(state.coverDraft?1:0);if(needed){message(`Envoi de ${needed} image(s) sur GitHub…`);mediaUploaded=true;}record=await uploadPendingMedia(record);}
  if(state.pdfDraft.some(d=>d.file))message('Vérification et transfert des documents PDF sur GitHub…');
  record=await uploadPendingPdfs(record);
  if(position<0)list.unshift(record);else list[position]=record;
  const sha=await writeRemote(type,list,state.sha[type],`SNUDI FO 30 : ${position<0?'ajout':'mise à jour'} ${type==='news'?'actualité':type==='events'?'calendrier':'outil'} — ${record.title.slice(0,55)}`);
  state.sha[type]=sha;state.records[type]=list;
  const imageCleanup=type!=='events'?await cleanUnusedMedia(before,list):{errors:[]};
  const oldPdfs=SnudiPdf.referencedPaths(beforeRecord),newPdfs=SnudiPdf.referencedPaths(record);
  const pdfCleanup=await cleanUnreferencedPdfs([...oldPdfs].filter(p=>!newPdfs.has(p)));
  resetDraft();state.pdfUploadPaths.clear();render();
  const errors=[...imageCleanup.errors,...pdfCleanup.errors];message(`Publication enregistrée sur GitHub. ${pdfCleanup.deleted?pdfCleanup.deleted+' PDF inutilisé(s) supprimé(s) du dépôt. ':''}${errors.length?errors.length+' fichier(s) n’ont pas pu être nettoyés ; aucun PDF utilisé n’a été supprimé.':'Le site sera visible après le déploiement de GitHub Pages.'}`,errors.length?'':'ok');
 }catch(error){
  let note='';
  if(state.pdfUploadPaths.size){
   const cleanup=await cleanUnreferencedPdfs([...state.pdfUploadPaths]);
   if(cleanup.errors.length)note=' Le nettoyage des PDF transférés n’a pas pu être entièrement vérifié ; certains fichiers peuvent rester sur GitHub.';
   else if(cleanup.deleted)note=' Les PDF sans publication ont été nettoyés.';
   state.pdfUploadPaths.clear();
  }
  message(error.message+note+(mediaUploaded?' Des images déjà transférées peuvent rester sur GitHub.':''),'error');
 }finally{setBusy(false);}
}
async function removeRecord(id){
 if(state.busy||!confirmDiscard())return;const type=state.tab,old=state.records[type].find(x=>x.id===id);if(!old)return;
 if(!confirm(`Supprimer définitivement « ${old.title} » du contenu public sur GitHub ? Les PDF qui ne sont plus utilisés ailleurs seront retirés du dépôt.`))return;
 setBusy(true);try{
  await assertUnchanged(type);const before=[...state.records[type]],updated=before.filter(x=>x.id!==id);
  const sha=await writeRemote(type,updated,state.sha[type],`SNUDI FO 30 : suppression ${type==='news'?'actualité':type==='events'?'événement':'outil'} — ${old.title.slice(0,55)}`);
  state.sha[type]=sha;state.records[type]=updated;
  const imageCleanup=type!=='events'?await cleanUnusedMedia(before,updated):{errors:[]};
  const pdfCleanup=await cleanUnreferencedPdfs([...SnudiPdf.referencedPaths(old)]);
  resetDraft();render();const errors=[...imageCleanup.errors,...pdfCleanup.errors];
  message('Publication supprimée sur GitHub. '+(pdfCleanup.deleted?pdfCleanup.deleted+' PDF inutilisé(s) supprimé(s). ':'')+(errors.length?'Des fichiers n’ont pas pu être nettoyés : consulte le dépôt.':''),errors.length?'':'ok');
 }catch(error){message(error.message,'error');}finally{setBusy(false);}
}
function previewArticle(){const f=$('#recordForm');const dialog=$('#previewDialog');$('#previewTitle').textContent=f.elements.title?.value||'Sans titre';$('#previewMeta').textContent=state.tab==='news'?`${f.elements.date?.value||today()} · ${f.elements.tag?.value||'Actualité'}`:state.tab==='events'?`${f.elements.date?.value||''} · ${f.elements.type?.value||'Événement'}`:SECTION_NAMES[f.elements.section?.value]||'Mes outils';$('#previewSummary').textContent=f.elements.summary?.value||'';const cover=state.coverDraft?.url||(!state.coverRemoved?SnudiArticle.asPath(state.records[state.tab].find(x=>x.id===state.editingId)?.cover||''):'');$('#previewCover').hidden=!cover;if(cover)$('#previewCover').src=cover;else $('#previewCover').removeAttribute('src');$('#previewBody').innerHTML=state.tab==='events'?'':SnudiArticle.sanitize(draftHtml(),{allowBlobs:true});const docs=$('#previewDownloads');docs.replaceChildren();docs.hidden=true;
 const associated=state.pdfDraft.filter(d=>d.label.trim());if(associated.length){docs.hidden=false;docs.append(mk('h3','','PDF joints à cette publication'));for(const d of associated){const row=mk('div','pdf-preview-row');row.append(mk('span','',d.label+(d.file?' (nouveau fichier, pas encore publié)':'')));if(d.path){const a=mk('a','btn btn-outline btn-sm','Ouvrir ↗');a.href=SnudiPdf.href(d.path);a.target='_blank';a.rel='noopener noreferrer';row.append(a);}docs.append(row);}}
 if(state.tab==='tools'&&['affichages','dossiers'].includes(f.elements.section?.value)){
  let links;try{links=parseDownloadLinks(f.elements.downloads?.value||'');}catch(error){message(error.message,'error');return;}
  if(links.length){const heading=mk('h3','','Liens PDF externes');docs.append(heading);for(const link of links){const a=mk('a','btn btn-outline btn-block',link.label+' ↗');a.href=link.url;a.rel='noopener noreferrer';a.target='_blank';docs.append(a);}docs.hidden=false;}
 }dialog.showModal();}
function renderHomePanel(){const src=state.homeRemoved?'':state.homeDraft?.url||state.home.banner||'';const img=$('#homeBannerImg');img.hidden=!src;$('#homeBannerEmpty').hidden=!!src;if(src)img.src=src;else img.removeAttribute('src');$('#homeBannerAlt').value=state.homeAlt||'';$('#homeBannerFileHint').textContent=state.homeDraft?`Image sélectionnée et optimisée (${Math.round(state.homeDraft.size/1024)} Ko). Elle sera envoyée lors de la publication.`:state.homeRemoved?'Le bandeau sera retiré après publication.':'Aucune nouvelle image sélectionnée.';$('#publishHomeBanner').disabled=state.busy||!state.homeDirty;}
async function chooseHomeImage(file){if(!file)return;setBusy(true);try{const img=await compressPhoto(file);if(state.homeDraft?.url)URL.revokeObjectURL(state.homeDraft.url);state.homeDraft={...img,url:URL.createObjectURL(img.blob)};state.homeRemoved=false;state.homeDirty=true;renderHomePanel();message('Bandeau prêt à être publié ('+Math.round(img.size/1024)+' Ko).','ok');}catch(err){message(err.message,'error');}finally{setBusy(false);renderHomePanel();}}
async function publishHome(){if(state.busy||!state.homeDirty)return;const alt=$('#homeBannerAlt').value.trim();if(!state.homeRemoved&&!alt){message('Ajoute une description de l’image.','error');return;}if(alt.length>240){message('La description est trop longue.','error');return;}if(!confirm('Publier ce bandeau sur GitHub ?'))return;
 setBusy(true);let newImagePath='';try{const fresh=await readHomeRemote();if(fresh.sha!==state.homeSha)throw Error('Le bandeau a été modifié sur GitHub. Actualise les contenus avant de publier.');
 let banner=state.homeRemoved?'':state.home.banner;
 if(state.homeDraft){const entry=state.homeDraft;newImagePath=`media/accueil/bandeau-${photoId()}.${entry.ext}`;const payload={message:'SNUDI FO 30 : ajout du bandeau d’accueil',branch:state.branch,content:await base64Blob(entry.blob)};const {response,result}=await api(newImagePath,'PUT',payload);if(!response.ok)throw Error(`Envoi de l’image impossible (HTTP ${response.status}) : ${result.message||'vérifie les permissions GitHub'}`);banner='./'+newImagePath;}
 const record={banner,alt:state.homeRemoved?'':alt};const payload={message:'SNUDI FO 30 : mise à jour du bandeau d’accueil',branch:state.branch,content:encode64(JSON.stringify(record,null,2)+'\n')};if(state.homeSha)payload.sha=state.homeSha;
 const {response,result}=await api(HOME_PATH,'PUT',payload);if(!response.ok){if(response.status===409||response.status===422)throw Error('Conflit GitHub : recharge les contenus et recommence.');throw Error(`Enregistrement du bandeau impossible (HTTP ${response.status}) : ${result.message||'vérifie les droits'}`);}
 const previous=state.home.banner;state.home=record;state.homeSha=result.content?.sha||'';resetHomeDraft();renderHomePanel();message('Bandeau publié sur GitHub. Attends le déploiement GitHub Pages, puis actualise l’application.','ok');
 // Nettoyage uniquement des anciens bandeaux gérés par cette rubrique, après succès.
 if(previous&&previous!==banner&&/^\.\/media\/accueil\/bandeau-[A-Za-z0-9.-]+\.(?:webp|jpg)$/.test(previous)){try{const path=previous.slice(2);const old=await api(path);if(old.response.ok&&old.result.sha)await api(path,'DELETE',{message:'SNUDI FO 30 : suppression ancien bandeau',branch:state.branch,sha:old.result.sha});}catch{}}
 }catch(error){message(error.message+(newImagePath?' Une image transférée peut rester sur GitHub si la publication de configuration a échoué.':''),'error');}finally{setBusy(false);renderHomePanel();}}
function backup(){const content={generatedAt:new Date().toISOString(),news:state.records.news,events:state.records.events,tools:state.records.tools,home:state.home,pdfFiles:state.pdfLibrary.map(x=>({path:x.path,size:x.size}))};const blob=new Blob([JSON.stringify(content,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='sauvegarde-snudi-fo-30.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function disconnect(){if(state.busy||!confirmDiscard()||!ensureReorderClosed()||!confirmHomeDiscard())return;resetDraft();resetHomeDraft();state.token='';state.owner='';state.repo='';state.sha={news:'',events:'',tools:''};state.records={news:[],events:[],tools:[]};state.pdfUploadPaths.clear();state.pdfLibrary=[];state.pdfLibraryError='';$('#workspace').hidden=true;$('#connection').hidden=false;$('#token').value='';message('Déconnecté. Le jeton n’a pas été conservé.');}
$('#connectForm').addEventListener('submit',connect);
$('#recordForm').addEventListener('submit',publish);
$('#tabNews').addEventListener('click',()=>chooseTab('news'));
$('#tabEvents').addEventListener('click',()=>chooseTab('events'));
$('#tabTools').addEventListener('click',()=>chooseTab('tools'));
$('#tabHome').addEventListener('click',chooseHomeTab);
$('#homeBannerFile').addEventListener('change',e=>{const file=e.target.files?.[0];e.target.value='';if(file)chooseHomeImage(file);});
$('#homeBannerAlt').addEventListener('input',e=>{state.homeAlt=e.target.value;state.homeDirty=true;$('#publishHomeBanner').disabled=false;});
$('#publishHomeBanner').addEventListener('click',publishHome);
$('#removeHomeBanner').addEventListener('click',()=>{if(state.busy)return;if(state.homeDraft?.url)URL.revokeObjectURL(state.homeDraft.url);state.homeDraft=null;state.homeRemoved=true;state.homeDirty=true;renderHomePanel();});
$('#resetHomeBanner').addEventListener('click',()=>{if(state.busy)return;resetHomeDraft();renderHomePanel();});
$('#toolSectionFilter').addEventListener('change',e=>{
 if(!ensureReorderClosed()){e.target.value=state.orderSection;return;}
 state.toolsFilter=e.target.value;renderList();renderReorder();if(!state.editingId&&!state.dirty)renderForm();
});
$('#openReorder').addEventListener('click',startReorder);
$('#deleteRetiredBareme').addEventListener('click',deleteRetiredBareme);
$('#cancelReorder').addEventListener('click',()=>{if(!ensureReorderClosed())return;render();});
$('#saveReorder').addEventListener('click',saveReorder);
$('#reorderItems').addEventListener('click',e=>{const b=e.target.closest('[data-move]');if(b)moveReorder(b.dataset.id,b.dataset.move);});
$('#newButton').addEventListener('click',()=>{if(state.busy||!confirmDiscard()||!ensureReorderClosed())return;resetDraft();render();$('#recordForm').scrollIntoView({behavior:'smooth',block:'start'});});
$('#recordForm').addEventListener('input',e=>{if(e.target.matches('[data-pdf-label]')){const pdf=state.pdfDraft.find(d=>d.id===e.target.dataset.pdfLabel);if(pdf){pdf.label=e.target.value;state.dirty=true;}return;}state.dirty=true;if(e.target.id==='richEditor')saveRange();});
$('#recordForm').addEventListener('change',async e=>{if(e.target.id==='pdfFileInput'){const files=[...(e.target.files||[])];e.target.value='';for(const file of files){try{await addPdfFile(file);}catch(error){message(error.message,'error');}}return;}if(e.target.id==='pdfLibrarySelect'){return;}if(e.target.id==='field_section'){showPdfLinks();updateToolFormContext();}if(['coverFile','inlineImageInput','replaceInlineInput'].includes(e.target.id)){const file=e.target.files?.[0];if(e.target.id==='coverFile')selectCover(file);else insertInline(file,e.target.id==='replaceInlineInput');e.target.value='';}else state.dirty=true;});
$('#recordForm').addEventListener('mousedown',e=>{if(e.target.closest('.rich-tool')){saveRange();e.preventDefault();}});
$('#recordForm').addEventListener('click',e=>{const removePdf=e.target.closest('[data-remove-pdf]');if(removePdf){state.pdfDraft=state.pdfDraft.filter(d=>d.id!==removePdf.dataset.removePdf);state.dirty=true;renderPdfAttachments();return;}if(e.target.closest('#pdfAddExisting')){addExistingPdf();return;}const cmd=e.target.closest('[data-cmd]');if(cmd){applyFormat(cmd.dataset.cmd);return;}if(e.target.closest('#cancelEdit')){if(!confirmDiscard())return;resetDraft();render();return;}if(e.target.closest('#previewArticle')){previewArticle();return;}if(e.target.closest('#removeCover')){removeCover();return;}
 if(e.target.closest('#insertInlineImage')){saveRange();$('#inlineImageInput').click();return;}if(e.target.closest('#replaceInline')){$('#replaceInlineInput').click();return;}if(e.target.closest('#deleteInline')){deleteInline();return;}
 const image=e.target.closest('#richEditor img');if(image)updateSelectedImage(image);
 });
$('#recordForm').addEventListener('mouseup',e=>{if(e.target.closest('#richEditor'))saveRange();});
$('#recordForm').addEventListener('keyup',e=>{if(e.target.closest('#richEditor'))saveRange();});
$('#recordList').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;if(b.dataset.action==='edit')startEdit(b.dataset.id);if(b.dataset.action==='delete')removeRecord(b.dataset.id);});
$('#reloadButton').addEventListener('click',()=>{if(!confirmDiscard()||!ensureReorderClosed()||!confirmHomeDiscard())return;reloadAll().catch(()=>{});});
$('#backupButton').addEventListener('click',backup);
$('#disconnectButton').addEventListener('click',disconnect);
$('#closePreview').addEventListener('click',()=>$('#previewDialog').close());
window.addEventListener('beforeunload',e=>{if(state.dirty||state.orderDirty||state.homeDirty){e.preventDefault();e.returnValue='';}});
autoSuggestRepo();
