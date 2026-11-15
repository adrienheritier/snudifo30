/* SNUDI-FO 30 — éditeur GitHub Pages. Aucun jeton n'est stocké. */
'use strict';
const $=selector=>document.querySelector(selector);
const state={token:'',owner:'',repo:'',branch:'main',tab:'news',records:{news:[],events:[]},sha:{news:'',events:''},editingId:null,busy:false};
const PATHS={news:'content/news.json',events:'content/events.json'};
const FIELDS={
 news:[
  {key:'date',label:'Date de publication',type:'date',required:true},
  {key:'tag',label:'Catégorie',type:'select',options:['Carte scolaire','AESH','Carrière','Formations','Mobilisations','Réglementation','Actualité'],required:true},
  {key:'title',label:'Titre',type:'text',required:true,placeholder:'Titre de l’actualité'},
  {key:'summary',label:'Résumé visible dans la liste',type:'textarea',required:true,placeholder:'Quelques lignes pour présenter l’actualité'},
  {key:'body',label:'Contenu de l’article (facultatif)',type:'textarea',placeholder:'Écrire le texte complet. Les retours à la ligne sont conservés.',className:'body-text'},
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
 ]
};
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
function message(txt,kind=''){const el=$('#adminMessage');el.textContent=txt;el.className='admin-message '+kind;el.hidden=false;clearTimeout(message.timer);message.timer=setTimeout(()=>el.hidden=true,8500);}
function setBusy(value){state.busy=value;document.querySelectorAll('#workspace button, #connectButton').forEach(b=>b.disabled=value);}
function autoSuggestRepo(){const m=location.hostname.match(/^([^.]+)\.github\.io$/i);if(!m)return;$('#owner').value=m[1];$('#repo').value=location.pathname.split('/').filter(Boolean)[0]||m[1]+'.github.io';}
function repoInfo(){return `${state.owner}/${state.repo} · ${state.branch}`;}
function validatePath(val,label){if(!/^[A-Za-z0-9._-]+$/.test(val)||val==='.'||val==='..')throw Error(`${label} invalide.`);}
function githubUrl(path){return `https://api.github.com/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}/contents/${path}`;}
function headers(){return {'Accept':'application/vnd.github+json','Authorization':`Bearer ${state.token}`,'X-GitHub-Api-Version':'2026-03-10'};}
function decode64(txt){const binary=atob(txt.replace(/\s+/g,''));return new TextDecoder().decode(Uint8Array.from(binary,c=>c.charCodeAt(0)));}
function encode64(txt){const bytes=new TextEncoder().encode(txt);let binary='';for(let i=0;i<bytes.length;i+=0x4000){binary+=String.fromCharCode(...bytes.subarray(i,i+0x4000));}return btoa(binary);}
async function readRemote(type){const url=githubUrl(PATHS[type])+'?ref='+encodeURIComponent(state.branch);const response=await fetch(url,{headers:headers(),cache:'no-store'});const result=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(`Lecture de ${PATHS[type]} impossible (HTTP ${response.status}) : ${result.message||'vérifiez les droits et les fichiers sur GitHub'}`);
 if(!result.sha||typeof result.content!=='string')throw Error(`Contenu de ${PATHS[type]} non pris en charge.`);
 let records;try{records=JSON.parse(decode64(result.content));}catch{throw Error(`${PATHS[type]} n'est pas un JSON valide.`);}
 if(!Array.isArray(records)||records.length>1000)throw Error(`Format de ${PATHS[type]} invalide.`);
 return {records,sha:result.sha};
}
async function reloadAll(){setBusy(true);try{const [n,e]=await Promise.all([readRemote('news'),readRemote('events')]);state.records.news=n.records;state.records.events=e.records;state.sha.news=n.sha;state.sha.events=e.sha;render();message('Contenus chargés depuis GitHub.','ok');}catch(error){message(error.message,'error');throw error;}finally{setBusy(false);}}
async function connect(event){event.preventDefault();if(state.busy)return;const f=new FormData(event.currentTarget);
 try{
  state.owner=String(f.get('owner')||'').trim();state.repo=String(f.get('repo')||'').trim();state.branch=String(f.get('branch')||'main').trim();state.token=String(f.get('token')||'').trim();
  validatePath(state.owner,'Propriétaire');validatePath(state.repo,'Dépôt');if(!state.branch||state.branch.includes('..'))throw Error('Branche invalide.');if(!state.token)throw Error('Jeton GitHub manquant.');
  await reloadAll();
  $('#token').value='';$('#repositoryTitle').textContent=repoInfo();$('#repositorySubtitle').textContent='Éditions enregistrées par commit GitHub, avec suivi des modifications.';
  $('#connection').hidden=true;$('#workspace').hidden=false;
 }catch(error){state.token='';$('#token').value='';message(error.message,'error');}
}
function mk(tag,cls='',txt=''){const el=document.createElement(tag);if(cls)el.className=cls;if(txt)el.textContent=txt;return el;}
function field(f,value){const wrap=mk('div','form-control');const label=mk('label','',f.label+(f.required?' *':''));label.htmlFor='field_'+f.key;wrap.append(label);
 let input;if(f.type==='textarea'){input=mk('textarea',f.className||'');input.rows=f.key==='body'?9:4;input.placeholder=f.placeholder||'';input.value=value||'';}
 else if(f.type==='select'){input=mk('select','input');const vals=[...(f.options||[])];if(value&&!vals.includes(value))vals.push(value);vals.forEach(v=>{const o=mk('option','',v);o.value=v;input.append(o);});input.value=value||vals[0]||'';}
 else {input=mk('input','input');input.type=f.type;input.placeholder=f.placeholder||'';input.value=value||'';}
 input.id='field_'+f.key;input.name=f.key;input.required=Boolean(f.required);wrap.append(input);return wrap;
}
function renderList(){const list=$('#recordList');list.replaceChildren();const records=[...state.records[state.tab]].sort((a,b)=>state.tab==='news'?(b.date||'').localeCompare(a.date||''):(a.date||'').localeCompare(b.date||''));$('#listTitle').textContent=(state.tab==='news'?'Actualités':'Événements')+` (${records.length})`;
 if(!records.length){list.append(mk('p','muted','Aucune entrée. Ajoute une première publication.'));return;}
 records.forEach(r=>{const card=mk('article','admin-record'+(state.editingId===r.id?' selected':''));const main=mk('div','admin-record-main');main.append(mk('b','',r.title||'Sans titre'),mk('span','',`${r.date||'Sans date'} • ${r.tag||r.type||'Autre'}`));const actions=mk('div','admin-record-actions');const edit=mk('button','','Modifier');edit.type='button';edit.dataset.action='edit';edit.dataset.id=r.id;const del=mk('button','delete','Supprimer');del.type='button';del.dataset.action='delete';del.dataset.id=r.id;actions.append(edit,del);card.append(main,actions);list.append(card);});
}
function renderForm(){const form=$('#recordForm');form.replaceChildren();let rec=state.records[state.tab].find(r=>r.id===state.editingId)||{};$('#editorTitle').textContent=(state.editingId?'Modifier ':'Nouvelle ')+(state.tab==='news'?'actualité':'entrée du calendrier');$('#editingBadge').hidden=!state.editingId;
 for(const f of FIELDS[state.tab]){form.append(field(f,rec[f.key]||(!state.editingId&&f.key==='date'?today():'')));}
 const actions=mk('div','form-actions');const save=mk('button','btn btn-primary',state.editingId?'Publier les modifications':'Publier sur GitHub');save.type='submit';const reset=mk('button','btn btn-neutral','Annuler');reset.type='button';reset.id='cancelEdit';actions.append(save,reset);form.append(actions);
 const help=mk('p','field-hint',state.tab==='news'?'Une actualité peut comporter un contenu complet dans l’application, un lien source, ou les deux.':'Utilise les catégories proposées : elles correspondent aux filtres de l’agenda public.');form.append(help);
}
function render(){const isNews=state.tab==='news';$('#tabNews').classList.toggle('active',isNews);$('#tabEvents').classList.toggle('active',!isNews);$('#tabNews').setAttribute('aria-selected',String(isNews));$('#tabEvents').setAttribute('aria-selected',String(!isNews));renderList();renderForm();}
function chooseTab(tab){if(state.busy||!['news','events'].includes(tab))return;state.tab=tab;state.editingId=null;render();}
function startEdit(id){if(state.busy)return;state.editingId=id;render();$('#recordForm').scrollIntoView({behavior:'smooth',block:'start'});}
function createRecord(form){const fd=new FormData(form),r={};for(const f of FIELDS[state.tab])r[f.key]=String(fd.get(f.key)||'').trim();
 if(!r.date||!r.title||(state.tab==='news'&&!r.summary))throw Error('Complète les champs obligatoires.');
 if(state.tab==='events'&&r.end&&r.end<r.date)throw Error('La date de fin précède la date de début.');
 const urlField=state.tab==='news'?'url':'source';if(r[urlField]&&!/^https:\/\//i.test(r[urlField]))throw Error('Les liens doivent commencer par https://.');
 const original=state.records[state.tab].find(x=>x.id===state.editingId);
 r.id=original?.id||('pub-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8));return r;
}
async function writeRemote(type,records,sha,commit){const payload={message:commit,branch:state.branch,content:encode64(JSON.stringify(records,null,2)+'\n'),sha};
 const response=await fetch(githubUrl(PATHS[type]),{method:'PUT',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify(payload)});
 const result=await response.json().catch(()=>({}));
 if(!response.ok){if(response.status===409||response.status===422)throw Error('Conflit possible : le fichier a changé sur GitHub. Clique sur « Actualiser les contenus » avant de réessayer.');throw Error(`Publication impossible (HTTP ${response.status}) : ${result.message||'vérifiez les permissions GitHub'}`);}
 return result.content?.sha||'';
}
async function publish(event){event.preventDefault();if(state.busy)return;let record;try{record=createRecord(event.currentTarget);}catch(error){message(error.message,'error');return;}
 const type=state.tab;const list=[...state.records[type]];const position=list.findIndex(x=>x.id===record.id);if(position<0)list.unshift(record);else list[position]=record;
 if(!confirm(`Publier ${position<0?'la nouvelle entrée':'les modifications'} « ${record.title} » sur GitHub ?`))return;
 setBusy(true);try{const newSha=await writeRemote(type,list,state.sha[type],`SNUDI FO 30 : ${position<0?'ajout':'mise à jour'} ${type==='news'?'actualité':'calendrier'} — ${record.title.slice(0,55)}`);state.sha[type]=newSha;state.records[type]=list;state.editingId=null;render();message('Publication enregistrée sur GitHub. Le déploiement GitHub Pages doit ensuite se terminer.','ok');}catch(error){message(error.message,'error');}finally{setBusy(false);}
}
async function removeRecord(id){if(state.busy)return;const type=state.tab;const old=state.records[type].find(x=>x.id===id);if(!old)return;if(!confirm(`Supprimer définitivement « ${old.title} » du contenu public sur GitHub ?`))return;
 setBusy(true);try{const updated=state.records[type].filter(x=>x.id!==id);const sha=await writeRemote(type,updated,state.sha[type],`SNUDI FO 30 : suppression ${type==='news'?'actualité':'événement'} — ${old.title.slice(0,55)}`);state.sha[type]=sha;state.records[type]=updated;state.editingId=null;render();message('Suppression enregistrée sur GitHub.','ok');}catch(error){message(error.message,'error');}finally{setBusy(false);}
}
function backup(){const content={generatedAt:new Date().toISOString(),news:state.records.news,events:state.records.events};const blob=new Blob([JSON.stringify(content,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='sauvegarde-snudi-fo-30.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function disconnect(){state.token='';state.owner='';state.repo='';state.sha={news:'',events:''};state.records={news:[],events:[]};state.editingId=null;$('#workspace').hidden=true;$('#connection').hidden=false;$('#token').value='';message('Déconnecté. Le jeton n’a pas été conservé.');}
$('#connectForm').addEventListener('submit',connect);
$('#recordForm').addEventListener('submit',publish);
$('#tabNews').addEventListener('click',()=>chooseTab('news'));
$('#tabEvents').addEventListener('click',()=>chooseTab('events'));
$('#newButton').addEventListener('click',()=>{state.editingId=null;render();$('#recordForm').scrollIntoView({behavior:'smooth',block:'start'});});
$('#recordForm').addEventListener('click',e=>{if(e.target.closest('#cancelEdit')){state.editingId=null;render();}});
$('#recordList').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;if(b.dataset.action==='edit')startEdit(b.dataset.id);if(b.dataset.action==='delete')removeRecord(b.dataset.id);});
$('#reloadButton').addEventListener('click',()=>reloadAll().catch(()=>{}));
$('#backupButton').addEventListener('click',backup);
$('#disconnectButton').addEventListener('click',disconnect);
autoSuggestRepo();
