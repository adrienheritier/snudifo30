/* SNUDI-FO 30 V3 — édition GitHub des actualités enrichies et du calendrier.
 * Aucun jeton n'est stocké dans le navigateur. Les médias sont transférés dans le dépôt GitHub.
 */
'use strict';
const $ = selector => document.querySelector(selector);
const state = {token:'',owner:'',repo:'',branch:'main',tab:'news',toolsFilter:'all',records:{news:[],events:[],tools:[]},sha:{news:'',events:'',tools:''},editingId:null,busy:false,dirty:false,coverDraft:null,coverRemoved:false,pendingMedia:new Map(),editorRange:null,selectedImage:null,orderMode:false,orderSection:null,orderDraft:[],orderDirty:false,view:'records',home:{banner:'',alt:''},homeSha:'',homeDraft:null,homeRemoved:false,homeDirty:false,homeAlt:''};
const PATHS = {news:'content/news.json',events:'content/events.json',tools:'content/tools.json'};
const HOME_PATH='content/home.json';
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
  {key:'section',label:'Rubrique de Mes outils',type:'select',options:['bareme','modeles','fiches','documents'],required:true},
  {key:'title',label:'Titre du contenu',type:'text',required:true,placeholder:'Titre de la fiche, du modèle ou de la ressource'},
  {key:'summary',label:'Résumé affiché dans la liste',type:'textarea',required:true,placeholder:'Quelques lignes qui décrivent ce contenu'},
  {key:'tag',label:'Sous-catégorie (facultatif)',type:'text',placeholder:'Ex. AESH, Carrière, Administration'},
  {key:'url',label:'Lien vers une ressource externe (facultatif)',type:'url',placeholder:'https://…'}
 ]
};
const SECTION_NAMES={bareme:'Barème mouvement',modeles:'Modèles de courriers',fiches:'Fiches pratiques',documents:'Documents utiles'};
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
async function reloadAll(){setBusy(true);try{const [n,e,t,h]=await Promise.all([readRemote('news'),readRemote('events'),readRemote('tools'),readHomeRemote()]);state.records.news=n.records;state.records.events=e.records;state.records.tools=t.records;state.sha.news=n.sha;state.sha.events=e.sha;state.sha.tools=t.sha;state.home=h.record;state.homeSha=h.sha;resetDraft();resetOrder();resetHomeDraft();render();message('Contenus chargés depuis GitHub.','ok');}catch(error){message(error.message,'error');throw error;}finally{setBusy(false);}}
async function connect(event){event.preventDefault();if(state.busy)return;const f=new FormData(event.currentTarget);
 try{state.owner=String(f.get('owner')||'').trim();state.repo=String(f.get('repo')||'').trim();state.branch=String(f.get('branch')||'main').trim();state.token=String(f.get('token')||'').trim();validatePath(state.owner,'Propriétaire');validatePath(state.repo,'Dépôt');if(!state.branch||state.branch.includes('..'))throw Error('Branche invalide.');if(!state.token)throw Error('Jeton GitHub manquant.');await reloadAll();$('#token').value='';$('#repositoryTitle').textContent=repoInfo();$('#repositorySubtitle').textContent='Actualités, calendrier, outils et bandeau d’accueil publiés sur GitHub.';$('#connection').hidden=true;$('#workspace').hidden=false;}catch(error){state.token='';$('#token').value='';message(error.message,'error');}}
function mk(tag,cls='',txt=''){const el=document.createElement(tag);if(cls)el.className=cls;if(txt)el.textContent=txt;return el;}
function field(f,value){const wrap=mk('div','form-control');const label=mk('label','',f.label+(f.required?' *':''));label.htmlFor='field_'+f.key;wrap.append(label);let input;
 if(f.type==='textarea'){input=mk('textarea');input.rows=4;input.placeholder=f.placeholder||'';input.value=value||'';}
 else if(f.type==='select'){input=mk('select','input');const vals=[...(f.options||[])];if(value&&!vals.includes(value))vals.push(value);vals.forEach(v=>{const o=mk('option','',f.key==='section'?(SECTION_NAMES[v]||v):v);o.value=v;input.append(o);});input.value=value||vals[0]||'';}
 else {input=mk('input','input');input.type=f.type==='url'?'text':f.type;input.placeholder=f.placeholder||'';input.value=value||'';if(f.type==='url'){input.inputMode='url';input.autocomplete='off';input.spellcheck=false;input.autocapitalize='none';}}
 input.id='field_'+f.key;input.name=f.key;input.required=Boolean(f.required);wrap.append(input);if(f.type==='url'&&!f.required)wrap.append(mk('p','field-hint','Facultatif : laisse ce champ vide si tu n’as pas de lien à ajouter.'));return wrap;}
function usedPaths(record){const results=new Set();if(!record||typeof record!=='object')return results;const cover=SnudiArticle.asPath(record.cover||'');if(cover)results.add(cover);SnudiArticle.imagePaths(record.bodyHtml||'').forEach(p=>results.add(p));return results;}
function resetDraft(){for(const url of state.pendingMedia.keys())URL.revokeObjectURL(url);state.pendingMedia.clear();if(state.coverDraft){URL.revokeObjectURL(state.coverDraft.url);state.coverDraft=null;}state.coverRemoved=false;state.editorRange=null;state.selectedImage=null;state.dirty=false;state.editingId=null;}
function confirmDiscard(){return !state.dirty||confirm('Les modifications de ce formulaire ne sont pas publiées. Les abandonner ?');}
function renderList(){
 const list=$('#recordList');list.replaceChildren();
 const sections=Object.keys(SECTION_NAMES),positions=new Map();
 if(state.tab==='tools')sections.forEach(section=>orderedTools(state.records.tools,section).forEach((record,index)=>positions.set(record.id,index)));
 const records=[...state.records[state.tab]]
  .filter(r=>state.tab!=='tools'||state.toolsFilter==='all'||r.section===state.toolsFilter)
  .sort((a,b)=>state.tab==='news'?(b.date||'').localeCompare(a.date||''):state.tab==='events'?(a.date||'').localeCompare(b.date||''):sections.indexOf(a.section)-sections.indexOf(b.section)||(positions.get(a.id)??0)-(positions.get(b.id)??0));
 $('#listTitle').textContent=(state.tab==='news'?'Actualités':state.tab==='events'?'Événements':'Contenus des outils')+` (${records.length})`;
 if(!records.length){list.append(mk('p','muted','Aucune entrée. Ajoute une première publication.'));return;}
 records.forEach(r=>{const card=mk('article','admin-record'+(state.editingId===r.id?' selected':''));const main=mk('div','admin-record-main');main.append(mk('b','',r.title||'Sans titre'),mk('span','',state.tab==='tools'?(SECTION_NAMES[r.section]||r.section||'Outil')+(r.tag?' • '+r.tag:''):`${r.date||'Sans date'} • ${r.tag||r.type||'Autre'}`));if(r.cover)main.append(mk('span','','🖼️ Image de couverture'));const actions=mk('div','admin-record-actions');const edit=mk('button','','Modifier');edit.type='button';edit.dataset.action='edit';edit.dataset.id=r.id;const del=mk('button','delete','Supprimer');del.type='button';del.dataset.action='delete';del.dataset.id=r.id;actions.append(edit,del);card.append(main,actions);list.append(card);});}
function markupFromLegacy(body){return String(body||'').split(/\n\s*\n/).filter(s=>s.trim()).map(s=>'<p>'+escapeHtml(s).replace(/\n/g,'<br>')+'</p>').join('');}
function coverArea(rec){const wrap=mk('section','media-control');const label=mk('div','media-control-title','Image de couverture (facultative)');wrap.append(label);wrap.append(mk('p','field-hint',state.tab==='tools'?'Visible dans la liste des outils et en haut de la fiche. JPEG, PNG ou WebP, optimisé avant envoi.':'Visible sur les cartes d’actualité et en haut de l’article. JPEG, PNG ou WebP, optimisé avant envoi.'));
 const img=mk('img','admin-cover-preview');img.id='coverPreview';img.alt='Aperçu de la couverture';img.hidden=true;wrap.append(img);
 const controls=mk('div','flex-wrap');const choose=mk('label','btn btn-outline btn-sm upload-label','Choisir une image');choose.htmlFor='coverFile';const input=mk('input');input.type='file';input.id='coverFile';input.accept='image/jpeg,image/png,image/webp';input.hidden=true;choose.append(input);const remove=mk('button','btn btn-neutral btn-sm','Retirer l’image');remove.type='button';remove.id='removeCover';controls.append(choose,remove);wrap.append(controls);const info=mk('div','field-hint');info.id='coverStatus';wrap.append(info);return wrap;}
function richEditorArea(rec){const wrap=mk('section','rich-section');const label=mk('div','media-control-title',state.tab==='tools'?'Contenu de la fiche / du modèle':'Contenu de l’article');wrap.append(label);wrap.append(mk('p','field-hint',state.tab==='tools'?'Mise en forme et images intégrées. Pour les modèles de courrier, le texte édité sera également copiable.':'Mise en forme et images intégrées. Les anciennes actualités restent modifiables.'));
 const bar=mk('div','rich-toolbar');bar.setAttribute('role','toolbar');bar.setAttribute('aria-label','Mise en forme de l’article');const controls=[['bold','Gras','G'],['italic','Italique','I'],['underline','Souligné','S'],['h2','Titre H2','H2'],['h3','Sous-titre H3','H3'],['ul','Liste à puces','• Liste'],['ol','Liste numérotée','1. Liste'],['quote','Citation','❝'],['link','Créer un lien','Lien'],['unlink','Enlever le lien','Sans lien']];
 controls.forEach(([cmd,title,label])=>{const b=mk('button','rich-tool',label);b.type='button';b.title=title;b.setAttribute('aria-label',title);b.dataset.cmd=cmd;bar.append(b);});
 const imageButton=mk('button','rich-tool rich-tool-image','＋ Image dans le texte');imageButton.type='button';imageButton.id='insertInlineImage';bar.append(imageButton);wrap.append(bar);
 const editor=mk('div','rich-editor article-content');editor.id='richEditor';editor.contentEditable='true';editor.setAttribute('role','textbox');editor.setAttribute('aria-multiline','true');editor.setAttribute('aria-label','Contenu enrichi de l’article');editor.dataset.placeholder='Rédige le contenu et ajoute des images à l’endroit souhaité…';editor.innerHTML=SnudiArticle.sanitize(rec.bodyHtml||markupFromLegacy(rec.body||''));wrap.append(editor);
 const imageInput=mk('input');imageInput.type='file';imageInput.accept='image/jpeg,image/png,image/webp';imageInput.id='inlineImageInput';imageInput.hidden=true;wrap.append(imageInput);
 const replaceInput=mk('input');replaceInput.type='file';replaceInput.accept=imageInput.accept;replaceInput.id='replaceInlineInput';replaceInput.hidden=true;wrap.append(replaceInput);
 const imageTools=mk('div','selected-image-tools');imageTools.id='selectedImageTools';imageTools.hidden=true;imageTools.append(mk('span','field-hint','Image sélectionnée :'));
 const replace=mk('button','btn btn-outline btn-sm','Remplacer');replace.type='button';replace.id='replaceInline';const del=mk('button','btn btn-neutral btn-sm','Supprimer');del.type='button';del.id='deleteInline';imageTools.append(replace,del);wrap.append(imageTools);wrap.append(mk('p','field-hint','Astuce : clique sur une image dans l’article pour la remplacer ou la supprimer. Les images sont compressées automatiquement avant publication.'));
 return wrap;}
function renderForm(){const form=$('#recordForm');form.replaceChildren();const rec=state.records[state.tab].find(r=>r.id===state.editingId)||{};$('#editorTitle').textContent=(state.editingId?'Modifier ':'Nouvelle ')+(state.tab==='news'?'actualité':state.tab==='events'?'entrée du calendrier':'fiche / ressource des outils');$('#editingBadge').hidden=!state.editingId;
 for(const f of FIELDS[state.tab]){if((state.tab==='news'||state.tab==='tools')&&f.key==='url'){form.append(coverArea(rec),richEditorArea(rec));}const initial=rec[f.key]||(!state.editingId&&f.key==='date'?today():(!state.editingId&&f.key==='tag'&&state.tab==='news'?'Actualité':(!state.editingId&&f.key==='section'?(state.toolsFilter!=='all'?state.toolsFilter:'bareme'):'')));form.append(field(f,initial));}
 const actions=mk('div','form-actions');if(state.tab!=='events'){const preview=mk('button','btn btn-outline',state.tab==='tools'?'Prévisualiser la fiche':'Prévisualiser l’article');preview.type='button';preview.id='previewArticle';actions.append(preview);}const save=mk('button','btn btn-primary',state.editingId?'Publier les modifications':'Publier sur GitHub');save.type='submit';const reset=mk('button','btn btn-neutral','Annuler');reset.type='button';reset.id='cancelEdit';actions.append(save,reset);form.append(actions);
 const help=mk('p','field-hint',state.tab==='news'?'Les photos sont enregistrées dans le dépôt avec le jeton GitHub actuel. Une publication peut nécessiter plusieurs commits (images puis article).':state.tab==='events'?'Les catégories correspondent aux filtres de l’agenda public.':'Les contenus sont répartis dans les quatre rubriques de Mes outils. Les modèles de courriers peuvent être copiés depuis la fiche publique. Les photos sont publiées dans media/outils/.');form.append(help);
 if(state.tab!=='events'){refreshCover(rec);updateSelectedImage(null);}}
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
function render(){for(const tab of ['news','events','tools','home']){const button=$('#tab'+tab[0].toUpperCase()+tab.slice(1));const active=tab==='home'?state.view==='home':state.view==='records'&&state.tab===tab;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));}$('#adminContentGrid').hidden=state.view==='home';$('#homeBannerAdmin').hidden=state.view!=='home';if(state.view==='home'){renderHomePanel();return;}$('#toolFilterRow').hidden=state.tab!=='tools';$('#toolSectionFilter').value=state.toolsFilter;renderList();renderForm();renderReorder();}
function confirmHomeDiscard(){return !state.homeDirty||confirm('Le nouveau bandeau n’a pas été publié. Abandonner les modifications ?');}
function chooseTab(tab){if(state.busy||!['news','events','tools'].includes(tab))return;if(state.view==='home'){if(!confirmHomeDiscard())return;resetHomeDraft();}else if(tab!==state.tab&&(!confirmDiscard()||!ensureReorderClosed()))return;state.view='records';if(tab!==state.tab)resetDraft();state.tab=tab;render();}
function chooseHomeTab(){if(state.busy||state.view==='home')return;if(!confirmDiscard()||!ensureReorderClosed())return;resetDraft();state.view='home';render();}
function startEdit(id){if(state.busy||!confirmDiscard()||!ensureReorderClosed())return;resetDraft();state.editingId=id;render();$('#recordForm').scrollIntoView({behavior:'smooth',block:'start'});}
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
  delete r.copyText; // Le contenu à copier doit toujours correspondre au texte actualisé de l'éditeur.
  // Les nouveaux contenus et les déplacements vers une autre rubrique arrivent en bas.
  if(!original||original.section!==r.section){
   const others=orderedTools(state.records.tools,r.section).filter(item=>item.id!==original?.id);
   const maximum=others.reduce((max,item,index)=>Math.max(max,Number.isSafeInteger(item.order)&&item.order>=0?item.order:index),-1);
   r.order=Math.max(others.length,maximum+1);
  }
 }
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
async function publish(event){event.preventDefault();if(state.busy)return;let record;try{record=createRecord(event.currentTarget);}catch(error){message(error.message,'error');return;}
 const type=state.tab;const before=[...state.records[type]];const list=[...before];const position=list.findIndex(x=>x.id===record.id);
 if(!confirm(`Publier ${position<0?'la nouvelle entrée':'les modifications'} « ${record.title} » sur GitHub ?`))return;
 setBusy(true);let mediaUploaded=false;
 try{await assertUnchanged(type);if(type==='news'||type==='tools'){const needed=mediaLinksInEditor().length+(state.coverDraft?1:0);if(needed)message(`Préparation et envoi de ${needed} image(s) sur GitHub…`);record=await uploadPendingMedia(record);mediaUploaded=needed>0;}
 if(position<0)list.unshift(record);else list[position]=record;
 const newSha=await writeRemote(type,list,state.sha[type],`SNUDI FO 30 : ${position<0?'ajout':'mise à jour'} ${type==='news'?'actualité':type==='events'?'calendrier':'outil'} — ${record.title.slice(0,55)}`);
 state.sha[type]=newSha;state.records[type]=list;const cleanup=type!=='events'?await cleanUnusedMedia(before,list):{deleted:0,errors:[]};resetDraft();render();
 message('Publication enregistrée sur GitHub. '+(cleanup.errors.length?`${cleanup.errors.length} ancienne(s) image(s) n’ont pas pu être supprimées ; le contenu reste publié.`:'Le déploiement GitHub Pages doit ensuite se terminer.'),cleanup.errors.length?'':'ok');
 }catch(error){message(error.message+(mediaUploaded?' Des images déjà envoyées peuvent rester sur GitHub ; réessaie la publication avant d’abandonner ce formulaire.':''),'error');}finally{setBusy(false);}}
async function removeRecord(id){if(state.busy||!confirmDiscard())return;const type=state.tab;const old=state.records[type].find(x=>x.id===id);if(!old)return;if(!confirm(`Supprimer définitivement « ${old.title} » du contenu public sur GitHub ?`))return;
 setBusy(true);try{await assertUnchanged(type);const before=[...state.records[type]],updated=before.filter(x=>x.id!==id);const sha=await writeRemote(type,updated,state.sha[type],`SNUDI FO 30 : suppression ${type==='news'?'actualité':type==='events'?'événement':'outil'} — ${old.title.slice(0,55)}`);state.sha[type]=sha;state.records[type]=updated;const cleanup=type!=='events'?await cleanUnusedMedia(before,updated):{errors:[]};resetDraft();render();message(cleanup.errors.length?'Publication supprimée. Certaines anciennes images restent à nettoyer sur GitHub.':'Suppression enregistrée sur GitHub.','ok');}catch(error){message(error.message,'error');}finally{setBusy(false);}}
function previewArticle(){if(state.tab==='events')return;const f=$('#recordForm');const dialog=$('#previewDialog');$('#previewTitle').textContent=f.elements.title?.value||'Sans titre';$('#previewMeta').textContent=state.tab==='news'?`${f.elements.date?.value||today()} · ${f.elements.tag?.value||'Actualité'}`:SECTION_NAMES[f.elements.section?.value]||'Mes outils';$('#previewSummary').textContent=f.elements.summary?.value||'';const cover=state.coverDraft?.url||(!state.coverRemoved?SnudiArticle.asPath(state.records[state.tab].find(x=>x.id===state.editingId)?.cover||''):'');$('#previewCover').hidden=!cover;if(cover)$('#previewCover').src=cover;else $('#previewCover').removeAttribute('src');$('#previewBody').innerHTML=SnudiArticle.sanitize(draftHtml(),{allowBlobs:true});dialog.showModal();}
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
function backup(){const content={generatedAt:new Date().toISOString(),news:state.records.news,events:state.records.events,tools:state.records.tools,home:state.home};const blob=new Blob([JSON.stringify(content,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='sauvegarde-snudi-fo-30.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function disconnect(){if(state.busy||!confirmDiscard()||!ensureReorderClosed()||!confirmHomeDiscard())return;resetDraft();resetHomeDraft();state.token='';state.owner='';state.repo='';state.sha={news:'',events:'',tools:''};state.records={news:[],events:[],tools:[]};$('#workspace').hidden=true;$('#connection').hidden=false;$('#token').value='';message('Déconnecté. Le jeton n’a pas été conservé.');}
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
$('#cancelReorder').addEventListener('click',()=>{if(!ensureReorderClosed())return;render();});
$('#saveReorder').addEventListener('click',saveReorder);
$('#reorderItems').addEventListener('click',e=>{const b=e.target.closest('[data-move]');if(b)moveReorder(b.dataset.id,b.dataset.move);});
$('#newButton').addEventListener('click',()=>{if(state.busy||!confirmDiscard()||!ensureReorderClosed())return;resetDraft();render();$('#recordForm').scrollIntoView({behavior:'smooth',block:'start'});});
$('#recordForm').addEventListener('input',e=>{state.dirty=true;if(e.target.id==='richEditor')saveRange();});
$('#recordForm').addEventListener('change',e=>{if(['coverFile','inlineImageInput','replaceInlineInput'].includes(e.target.id)){const file=e.target.files?.[0];if(e.target.id==='coverFile')selectCover(file);else insertInline(file,e.target.id==='replaceInlineInput');e.target.value='';}else state.dirty=true;});
$('#recordForm').addEventListener('mousedown',e=>{if(e.target.closest('.rich-tool')){saveRange();e.preventDefault();}});
$('#recordForm').addEventListener('click',e=>{const cmd=e.target.closest('[data-cmd]');if(cmd){applyFormat(cmd.dataset.cmd);return;}if(e.target.closest('#cancelEdit')){if(!confirmDiscard())return;resetDraft();render();return;}if(e.target.closest('#previewArticle')){previewArticle();return;}if(e.target.closest('#removeCover')){removeCover();return;}
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
