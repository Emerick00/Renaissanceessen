
let S={matches:[],awards:{},fines:[]},admin=false,rev=-1,editId=null;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>s.trim().replace(/\s+/g,' ');
const key=s=>norm(s).toLowerCase();
const cap1=s=>{s=norm(s);return s.charAt(0).toUpperCase()+s.slice(1)};
const iso=t=>t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
const lastSunday=()=>{const t=new Date();t.setDate(t.getDate()-t.getDay());return iso(t)};
const fmt=d=>new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

function tally(list){const m={};list.forEach(({n,g})=>{const k=key(n);m[k]=m[k]||{n,c:0};m[k].c+=g||1});return Object.values(m).sort((x,y)=>y.c-x.c||x.n.localeCompare(y.n))}
const boards=()=>({
  goals:tally(S.matches.flatMap(m=>m.scorers)),
  mvps:tally(Object.values(S.awards).filter(a=>a.mvp).map(a=>({n:a.mvp}))),
  caps:tally(Object.values(S.awards).filter(a=>a.cap).map(a=>({n:a.cap}))),
  gks:tally(Object.values(S.awards).filter(a=>a.gk).map(a=>({n:a.gk})))
});
const MED=['🥇','🥈','🥉'],CLS=['g1','g2','g3'];
function renderStats(){
  const {goals,mvps,caps,gks}=boards();
  const n=Math.max(goals.length,mvps.length,caps.length,gks.length,3);
  const cell=(r,u1,uN)=>r?`<b>${esc(r.n)}</b><small>${r.c} ${r.c>1?uN:u1}</small>`:'<span class="mut">—</span>';
  let rows='';
  for(let i=0;i<n;i++)rows+=`<tr class="${i<3?CLS[i]:''}"><td class="rn">${i<3?MED[i]:i+1}</td><td>${cell(goals[i],'but','buts')}</td><td>${cell(mvps[i],'fois','fois')}</td><td>${cell(caps[i],'fois','fois')}</td><td>${cell(gks[i],'fois','fois')}</td></tr>`;
  $('stats').innerHTML=`<div class="card tw"><table class="lt"><thead><tr><th></th><th>⚽ Buteurs</th><th>⭐ Joueurs</th><th>🧢 Capit.</th><th>🧤 Gardiens</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function renderSun(){
  const dates=[...new Set([...S.matches.map(m=>m.d),...Object.keys(S.awards)])].sort().reverse();
  if(!dates.length){$('sun').innerHTML='<div class="card mut">Aucun match enregistré pour le moment.</div>';return}
  $('sun').innerHTML=dates.map(d=>{
    const ms=S.matches.filter(m=>m.d===d),a=S.awards[d]||{},top=tally(ms.flatMap(m=>m.scorers))[0];
    const rows=ms.map(m=>`<div class="match"><div><div>${esc(m.a)} <span class="sc">${m.sa} – ${m.sb}</span> ${esc(m.b)}</div><div>${m.scorers.map((s,i)=>admin?`<span class="chip ed">${esc(s.n)} ⚽${s.g}<button data-g="${m.id}:${i}:-1">−</button><button data-g="${m.id}:${i}:1">+</button></span>`:`<span class="chip">${esc(s.n)} ⚽${s.g}</span>`).join('')}</div></div>${admin?`<div><button class="x" data-ed="${m.id}" title="Modifier">✎</button><button class="x" data-del="${m.id}" title="Supprimer">✕</button></div>`:''}</div>`).join('');
    return `<div class="card"><h2>${fmt(d)}</h2>${rows}<div class="award">${top?`<span>🥇 ${esc(top.n)} (${top.c})</span>`:''}${a.mvp?`<span>⭐ ${esc(a.mvp)}</span>`:''}${a.cap?`<span>🧢 ${esc(a.cap)}</span>`:''}${a.gk?`<span>🧤 ${esc(a.gk)}</span>`:''}${admin?`<button class="x" data-ea="${d}" style="font-size:.85rem">✎ distinctions</button>`:''}</div></div>`;
  }).join('');
}
const fmtS=d=>new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long'});
const eur=n=>(+n||0).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
function dueOf(d){const t=new Date(d+'T12:00:00');t.setDate(t.getDate()+7-t.getDay());return iso(t)}
function renderFines(){
  const F=[...S.fines].sort((a,b)=>b.due.localeCompare(a.due)||b.id-a.id),today=iso(new Date());
  const owed=S.fines.filter(f=>!f.paid).reduce((s,f)=>s+f.amt,0),paid=S.fines.filter(f=>f.paid).reduce((s,f)=>s+f.amt,0);
  const rows=F.map(f=>{
    const late=!f.paid&&f.due<today;
    const st=f.paid?'<span class="st ok">✅ Payé</span>':late?'<span class="st late">⚠️ Paiement en retard</span>':'<span class="st no">⏳ À payer</span>';
    return `<div class="fine"><div><b>${esc(f.n)}</b> — ${eur(f.amt)}<div class="mut"><b>${esc(f.t||'Retard')}</b> · ${fmtS(f.d)} · à payer avant le ${fmt(f.due)}</div>${f.det?`<div class="mut"><i>${esc(f.det)}</i></div>`:''}<div style="margin-top:4px">${st}</div></div>${admin?`<div style="white-space:nowrap"><button class="x" data-fp="${f.id}" title="Payé / non payé">${f.paid?'↩':'✔'}</button><button class="x" data-fe="${f.id}" title="Modifier">✎</button><button class="x" data-fd="${f.id}" title="Supprimer">✕</button></div>`:''}</div>`}).join('');
  $('flist').innerHTML=`<div class="top"><div class="card"><small>💶 Reste à payer</small><b>${eur(owed)}</b></div><div class="card"><small>✅ Déjà payé</small><b>${eur(paid)}</b></div></div><div class="card"><h2>Amendes (retards et autres)</h2>${rows||'<div class="mut">Aucune amende enregistrée.</div>'}</div>`;
}
function names(){
  const s=new Set();S.matches.forEach(m=>m.scorers.forEach(x=>s.add(x.n)));
  Object.values(S.awards).forEach(a=>{if(a.mvp)s.add(a.mvp);if(a.cap)s.add(a.cap);if(a.gk)s.add(a.gk)});
  S.fines.forEach(f=>s.add(f.n));
  return [...s].sort((a,b)=>a.localeCompare(b));
}
function pick(inp,src){
  const w=document.createElement('div');w.className='pw';inp.parentNode.insertBefore(w,inp);w.appendChild(inp);
  inp.setAttribute('autocomplete','off');
  const b=document.createElement('button');b.type='button';b.className='pb';b.textContent='▾';b.title='Choisir un nom existant';w.appendChild(b);
  b.onclick=()=>{
    const old=w.querySelector('.pl');if(old){old.remove();return}
    const ns=(src||names)(),l=document.createElement('div');l.className='pl';
    if(!ns.length)l.innerHTML='<div class="mut">Aucun nom enregistré</div>';
    else ns.forEach(n=>{const d=document.createElement('div');d.textContent=n;d.onclick=()=>{inp.value=n;l.remove()};l.appendChild(d)});
    w.appendChild(l);
  };
}
document.addEventListener('click',e=>document.querySelectorAll('.pl').forEach(l=>{if(!l.parentNode.contains(e.target))l.remove()}));
function fillX(){
  const el=$('xd'),cur=el.value;
  const ds=[...new Set([...S.matches.map(m=>m.d),...Object.keys(S.awards),...S.fines.map(f=>f.d)])].sort().reverse();
  el.innerHTML=ds.map(x=>`<option value="${x}">${fmt(x)}</option>`).join('')||'<option value="">Aucune donnée</option>';
  if(cur&&ds.includes(cur))el.value=cur;
}
function render(){renderStats();renderSun();renderFines();fillX()}

async function save(){
  render();
  try{
    const r=await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(S)});
    if(r.status===401){setAdmin(false);alert('Session expirée : reconnectez-vous.');rev=-1;load();return}
    if(!r.ok)throw new Error('erreur '+r.status);
    rev=(await r.json()).rev;
  }catch(e){alert('Enregistrement impossible : '+((e&&e.message)||e))}
}

/* PDF */
const INFO={lieu:"Seumannstr. 2-4, Essen",rass:"8h45",coup:"9h00",retard:"9h15",charge:"Berlyno",pres:"Loïc",vice:"Franklin"};
const bd=cut=>{
  const ms=S.matches.filter(m=>!cut||m.d<=cut);
  const aw=Object.entries(S.awards).filter(([k])=>!cut||k<=cut).map(e=>e[1]);
  return {goals:tally(ms.flatMap(m=>m.scorers)),mvps:tally(aw.filter(a=>a.mvp).map(a=>({n:a.mvp}))),caps:tally(aw.filter(a=>a.cap).map(a=>({n:a.cap}))),gks:tally(aw.filter(a=>a.gk).map(a=>({n:a.gk})))};
};
function buildReport(mode,date,JS,logo){
  const d=new JS({unit:'mm',format:'a4'}),M=14,W=210,CW=182,today=iso(new Date());
  const RED=[200,16,46],INK=[30,30,30],GREY=[100,100,100],GOLDL=[255,248,222],ROSE=[252,240,241];
  let y=0;
  const col=c=>d.setTextColor(c[0],c[1],c[2]);
  const need=h=>{if(y+h>282){d.addPage();y=16}};
  const txt=(t,sz=9,b=false,c=INK,x=M,w=CW)=>{d.setFont('helvetica',b?'bold':'normal');d.setFontSize(sz);col(c);
    d.splitTextToSize(String(t),w).forEach(l=>{need(sz*0.38+2);d.text(l,x,y);y+=sz*0.38+1.5})};
  const h2=t=>{need(14);y+=3;txt(t,11.5,true,RED);d.setDrawColor(RED[0],RED[1],RED[2]);d.setLineWidth(0.4);d.line(M,y-1.5,M+CW,y-1.5);y+=1.5};
  const note=t=>{txt(t,8,false,GREY);y+=0.5};
  const eur=a=>a.toFixed(2).replace('.',',')+' €';
  const fmtD=x=>new Date(x+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'2-digit'});
  const stat=f=>f.paid?'Payé':f.due<today?'Paiement en retard':'À payer';
  const fill=f=>f.paid?[217,245,227]:f.due<today?[253,224,224]:[255,240,207];
  const sc=m=>m.scorers.map(s=>s.n+(s.g>1?' (x'+s.g+')':'')).join(', ');
  const lead=t=>t.length?t.filter(x=>x.c===t[0].c).map(x=>x.n).join(', ')+' ('+t[0].c+')':'-';
  function tbl(cols,rows){
    const tot=cols.reduce((s,c)=>s+c.w,0),Wc=cols.map(c=>c.w*CW/tot);
    const head=()=>{need(10);d.setFillColor(RED[0],RED[1],RED[2]);d.rect(M,y-4.2,CW,6,'F');let x=M;
      d.setFont('helvetica','bold');d.setFontSize(8.5);d.setTextColor(255,255,255);cols.forEach((c,i)=>{d.text(c.h,x+2,y);x+=Wc[i]});y+=5.1};
    head();
    rows.forEach(r=>{
      d.setFont('helvetica',r.b?'bold':'normal');d.setFontSize(8.5);
      const cells=r.c.map((t,i)=>[].concat(t).flatMap(s=>d.splitTextToSize(String(s),Wc[i]-4)));
      const n=Math.max(...cells.map(c=>c.length)),h=n*3.9+1.9;
      if(y-3.3+h>284){d.addPage();y=16;head()}
      if(r.f){d.setFillColor(r.f[0],r.f[1],r.f[2]);d.rect(M,y-3.3,CW,h,'F')}
      d.setDrawColor(225,225,225);d.setLineWidth(0.1);d.line(M,y-3.3+h,M+CW,y-3.3+h);
      d.setFont('helvetica',r.b?'bold':'normal');d.setFontSize(8.5);col(INK);
      let x=M;cells.forEach((c,i)=>{c.forEach((l,k)=>d.text(l,x+2,y+0.3+k*3.9));x+=Wc[i]});
      y+=h;
    });
    y+=2;
  }
  function classement(cut){
    const b=bd(cut),medal=[[245,221,122],[207,213,219],[220,166,122]],rows=[];
    const cell=(r,a,z)=>r?r.n+' - '+r.c+' '+(r.c>1?z:a):'-';
    for(let i=0;i<5;i++)rows.push({c:[(i+1)+(i?'e':'er')+(i<3?' ('+['Or','Argent','Bronze'][i]+')':''),cell(b.goals[i],'but','buts'),cell(b.mvps[i],'fois','fois'),cell(b.caps[i],'fois','fois'),cell(b.gks[i],'fois','fois')],f:i<3?medal[i]:null,b:i<3});
    tbl([{h:'Rang',w:26},{h:'Buteurs',w:39},{h:'Joueurs',w:39},{h:'Capitaines',w:39},{h:'Gardiens',w:39}],rows);
  }
  const fineRows=a=>a.map(f=>({c:[f.n,eur(f.amt),(f.t||'Retard')+(f.det?' ('+f.det+')':'')+' - '+fmtS(f.d)+', avant le '+fmtS(f.due),stat(f)],f:fill(f)}));
  const fineCols=[{h:'Nom',w:40},{h:'Montant',w:24},{h:'Amende / date limite',w:78},{h:'Statut',w:40}];
  const owed=S.fines.filter(f=>!f.paid).reduce((s,f)=>s+f.amt,0),paid=S.fines.filter(f=>f.paid).reduce((s,f)=>s+f.amt,0);

  // en-tête
  const title=mode==='day'?'Rapport du '+fmt(date):'Rapport de saison - tous les dimanches';
  d.setFillColor(RED[0],RED[1],RED[2]);d.rect(0,0,W,3.5,'F');
  try{d.addImage(logo,'JPEG',M,7,24,24)}catch(e){}
  d.setFont('helvetica','bold');d.setFontSize(20);col(INK);d.text('Renaissance Essen',M+30,16);
  d.setFont('helvetica','normal');d.setFontSize(10.5);d.text(d.splitTextToSize(title,CW-30)[0],M+30,23);
  d.setFontSize(8.5);col(GREY);d.text('Édité le '+new Date().toLocaleDateString('fr-FR'),M+30,28.5);
  d.setDrawColor(RED[0],RED[1],RED[2]);d.setLineWidth(0.6);d.line(M,34,M+CW,34);
  y=44;
  d.setFillColor(245,245,242);d.roundedRect(M,y-5,CW,19,2,2,'F');
  txt('Lieu : '+INFO.lieu+'  |  Rassemblement '+INFO.rass+'  |  Coup d\'envoi '+INFO.coup+'  |  Retards dès '+INFO.retard,8.5,true,INK,M+3,CW-6);
  txt('Amende en euros à régler avant le dimanche suivant. Chargé sportif lors de la signature : '+INFO.charge+'  |  Président : '+INFO.pres+'  |  Vice-président : '+INFO.vice,8,false,INK,M+3,CW-6);
  y+=3;

  if(mode==='day'){
    const ms=S.matches.filter(m=>m.d===date),a=S.awards[date]||{},fs=S.fines.filter(f=>f.d===date);
    h2('Résumé du jour');
    note(ms.length+' match(s) joué(s) - '+fs.length+' amende(s)'+(fs.length?' pour '+eur(fs.reduce((s,f)=>s+f.amt,0)):'')+'.');
    tbl([{h:'Distinction',w:70},{h:'Détail',w:112}],[
      {c:['Meilleur buteur',lead(tally(ms.flatMap(m=>m.scorers)))],f:GOLDL},
      {c:['Meilleur joueur',a.mvp||'-'],f:GOLDL},
      {c:['Meilleur capitaine',a.cap||'-'],f:GOLDL},
      {c:['Meilleur gardien',a.gk||'-'],f:GOLDL}]);
    h2('Scores des matchs');
    if(ms.length)tbl([{h:'Match',w:70},{h:'Score',w:22},{h:'Buteurs',w:90}],ms.map((m,i)=>({c:[m.a+' - '+m.b,m.sa+' - '+m.sb,sc(m)||'-'],f:i%2?ROSE:null})));
    else txt('Aucun match enregistré ce dimanche.',9,false,GREY);
    h2('Amendes du jour');
    if(fs.length)tbl(fineCols,fineRows(fs));
    else txt('Aucune amende enregistrée ce dimanche.',9,false,GREY);
    h2('Classement général (top 5, cumul jusqu\'à ce dimanche)');
    classement(date);
    txt('Reste à payer sur l\'ensemble des amendes : '+eur(owed),9.5,true,RED);
  }else{
    const ds=[...new Set([...S.matches.map(m=>m.d),...Object.keys(S.awards),...S.fines.map(f=>f.d)])].sort();
    h2('Classement général (top 5)');
    classement(null);
    h2('Chiffres de la saison');
    tbl([{h:'Dimanches',w:1},{h:'Matchs',w:1},{h:'Buts',w:1},{h:'Amendes payées',w:1},{h:'Reste à payer',w:1}],[
      {c:[String(ds.length),String(S.matches.length),String(S.matches.reduce((s,m)=>s+m.scorers.reduce((t,x)=>t+x.g,0),0)),eur(paid),eur(owed)],b:true,f:GOLDL}]);
    h2('Dimanche par dimanche');
    if(!ds.length)txt('Aucune donnée enregistrée.',9,false,GREY);
    else tbl([{h:'Date',w:22},{h:'Matchs (buteurs)',w:96},{h:'Distinctions / amendes',w:64}],ds.map((dt,i)=>{
      const ms=S.matches.filter(m=>m.d===dt),a=S.awards[dt]||{},fs=S.fines.filter(f=>f.d===dt),g=lead(tally(ms.flatMap(m=>m.scorers)));
      const ln=[];
      if(g!=='-')ln.push('Buteur : '+g);
      if(a.mvp)ln.push('Joueur : '+a.mvp);
      if(a.cap)ln.push('Capitaine : '+a.cap);
      if(a.gk)ln.push('Gardien : '+a.gk);
      if(fs.length)ln.push('Amendes : '+fs.length+' ('+eur(fs.reduce((s,f)=>s+f.amt,0))+')');
      return {c:[fmtD(dt),ms.length?ms.map(m=>m.a+' '+m.sa+'-'+m.sb+' '+m.b+(sc(m)?' ('+sc(m)+')':'')):'-',ln.length?ln:'-'],f:i%2?ROSE:null};
    }));
    h2('Amendes - récapitulatif');
    if(S.fines.length)tbl(fineCols,fineRows([...S.fines].sort((a,b)=>a.d.localeCompare(b.d))));
    else txt('Aucune amende enregistrée.',9,false,GREY);
    txt('Total payé : '+eur(paid)+'  |  Reste à payer : '+eur(owed),9.5,true,RED);
  }
  const n=d.getNumberOfPages();
  for(let i=1;i<=n;i++){d.setPage(i);d.setDrawColor(200,200,200);d.setLineWidth(0.2);d.line(M,288,M+CW,288);
    d.setFont('helvetica','normal');d.setFontSize(8);d.setTextColor(120,120,120);
    d.text('Renaissance Essen - Foot du Dimanche',M,293);d.text('Page '+i+' / '+n,M+CW,293,{align:'right'})}
  return d;
}
function logoData(){const i=document.querySelector('.hero img'),c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;c.getContext('2d').drawImage(i,0,0);return c.toDataURL('image/jpeg',0.92)}
function saveBlob(buf,name){const u=URL.createObjectURL(new Blob([buf],{type:'application/pdf'})),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}
async function exportPdf(mode,date){
  try{
    if(!window.jspdf){alert('Module PDF introuvable (public/vendor/jspdf.umd.min.js).');return}
    if(mode==='day'&&!date){alert('Aucun dimanche à exporter.');return}
    const d=buildReport(mode,date,window.jspdf.jsPDF,logoData());
    saveBlob(d.output('arraybuffer'),mode==='day'?'renaissance-essen-'+date+'.pdf':'renaissance-essen-saison.pdf');
  }catch(e){alert('Export impossible : '+((e&&e.message)||e))}
}

/* Admin */
function addRow(n='',g=1){const r=document.createElement('div');r.className='sr';r.innerHTML='<input placeholder="Joueur" autocomplete="off"><input type="number" min="1" value="'+g+'"><button class="x" type="button">✕</button>';const inp=r.children[0];inp.value=n;pick(inp);r.children[2].onclick=()=>r.remove();$('scl').appendChild(r)}
function readRows(){const o=[];[...$('scl').children].forEach(r=>{const n=cap1(r.querySelector('input').value),g=Math.max(0,parseInt(r.children[1].value)||0);if(n&&g)o.push({n,g})});return o}
function resetForm(){editId=null;['a','b'].forEach(i=>$(i).value='');$('sa').value=$('sb').value=0;$('scl').innerHTML='';addRow();$('mt').textContent='Nouveau match';$('addM').textContent='Enregistrer le match';$('canc').classList.add('hide')}
function fillA(){const a=S.awards[$('d2').value]||{};$('mvp').value=a.mvp||'';$('cap').value=a.cap||'';$('gk').value=a.gk||''}
let fEdit=null;
const types=()=>[...new Set(['Retard',...S.fines.map(f=>f.t||'Retard')])].sort((a,b)=>a.localeCompare(b));
function fUpd(){$('fdue').textContent=$('fd').value?'📅 À payer avant le '+fmt(dueOf($('fd').value)):''}
function fOpen(o){$('fform').classList.toggle('hide',!o);$('fplus').classList.toggle('hide',o)}
function fReset(){fEdit=null;['fn','fa','fdet'].forEach(i=>$(i).value='');$('ftype').value='Retard';$('fd').value=lastSunday();$('ft').textContent='Nouvelle amende';$('fadd').textContent='Enregistrer';fUpd();fOpen(false)}
function initFines(){
  fReset();$('fd').onchange=fUpd;$('fcanc').onclick=fReset;$('fplus').onclick=()=>fOpen(true);
  $('fadd').onclick=()=>{
    const n=cap1($('fn').value),t=cap1($('ftype').value)||'Retard',det=norm($('fdet').value),amt=parseFloat($('fa').value),d=$('fd').value;
    if(!n||!d||!(amt>=0)){alert('Indiquez le nom, la date et le montant.');return}
    if(fEdit)S.fines=S.fines.map(f=>f.id===fEdit?{...f,n,t,det,d,amt,due:dueOf(d)}:f);else S.fines.push({id:Date.now(),n,t,det,d,amt,due:dueOf(d),paid:false});
    fReset();save();
  };
  $('flist').onclick=e=>{
    const t=e.target.dataset;
    if(t.fp){const f=S.fines.find(x=>x.id==t.fp);f.paid=!f.paid;save()}
    if(t.fd&&confirm('Supprimer cette amende ?')){S.fines=S.fines.filter(x=>x.id!=t.fd);save()}
    if(t.fe){const f=S.fines.find(x=>x.id==t.fe);fEdit=f.id;$('fn').value=f.n;$('ftype').value=f.t||'Retard';$('fdet').value=f.det||'';$('fd').value=f.d;$('fa').value=f.amt;fUpd();$('ft').textContent="Modifier l'amende";$('fadd').textContent='Mettre à jour';fOpen(true);window.scrollTo(0,0)}
  };
}
function initAdmin(){
  initFines();
  ['fn','mvp','cap','gk'].forEach(i=>pick($(i)));pick($('ftype'),types);
  $('d').value=$('d2').value=lastSunday();$('d2').onchange=fillA;resetForm();
  $('addS').onclick=()=>addRow();$('canc').onclick=resetForm;
  $('addM').onclick=()=>{
    const a=norm($('a').value),b=norm($('b').value);
    if(!a||!b||!$('d').value){alert('Indiquez la date et les deux équipes.');return}
    const m={id:editId||Date.now(),d:$('d').value,a,b,sa:+$('sa').value||0,sb:+$('sb').value||0,scorers:readRows()};
    const was=editId;
    if(was)S.matches=S.matches.map(x=>x.id===was?m:x);else S.matches.push(m);
    resetForm();save();alert(was?'Match modifié ✅':'Match enregistré ✅');
  };
  $('addA').onclick=()=>{
    const d=$('d2').value;if(!d)return;
    const mvp=cap1($('mvp').value),cap=cap1($('cap').value),gk=cap1($('gk').value);
    if(!mvp&&!cap&&!gk)delete S.awards[d];else S.awards[d]={mvp,cap,gk};
    save();
  };
  $('rst').onclick=()=>{if(confirm('Effacer toutes les données pour tout le monde ?')){S={matches:[],awards:{},fines:[]};save()}};
  $('sun').onclick=e=>{
    const t=e.target.dataset;
    if(t.del&&confirm('Supprimer ce match ?')){S.matches=S.matches.filter(m=>m.id!=t.del);save()}
    if(t.g){const[id,i,dl]=t.g.split(':');const m=S.matches.find(x=>x.id==id),s=m.scorers[+i];s.g+=+dl;if(s.g<=0)m.scorers.splice(+i,1);save()}
    if(t.ea){$('d2').value=t.ea;fillA();document.querySelector('[data-t=add]').click();setTimeout(()=>$('d2').scrollIntoView({block:'center'}),60)}
    if(t.ed){const m=S.matches.find(x=>x.id==t.ed);editId=m.id;$('d').value=m.d;$('a').value=m.a;$('b').value=m.b;$('sa').value=m.sa;$('sb').value=m.sb;$('scl').innerHTML='';m.scorers.forEach(s=>addRow(s.n,s.g));addRow();$('mt').textContent='Modifier le match';$('addM').textContent='Mettre à jour';$('canc').classList.remove('hide');document.querySelector('[data-t=add]').click()}
  };
}

$('nav').onclick=e=>{
  const t=e.target.dataset.t;if(!t)return;
  [...$('nav').children].forEach(b=>b.classList.toggle('on',b===e.target));
  ['stats','sun','fines','add'].forEach(s=>$(s)&&$(s).classList.toggle('hide',s!==t));
};
$('pdfDay').onclick=()=>exportPdf('day',$('xd').value);
$('pdfAll').onclick=()=>exportPdf('all');

const setAdmin=a=>{admin=a;document.body.classList.toggle('admin',a);$('badge').textContent=a?'Mode administrateur — vous seul pouvez modifier.':'Résultats en lecture seule';render()};
async function load(){
  try{
    const r=await fetch('/api/state',{cache:'no-store',credentials:'same-origin'});if(!r.ok)throw 0;
    const o=await r.json();
    if(o.rev!==rev){rev=o.rev;const s=o.state||{};S={matches:s.matches||[],awards:s.awards||{},fines:s.fines||[]};render()}
  }catch(e){if(rev<0)$('badge').textContent='Connexion au serveur impossible.'}
}
$('loginBtn').onclick=()=>{$('loginForm').classList.toggle('hide');$('pw').focus()};
$('pwOk').onclick=async()=>{
  try{
    const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({password:$('pw').value})});
    if(r.status===429){alert('Trop de tentatives. Réessayez dans quelques minutes.');return}
    if(!r.ok){alert('Mot de passe incorrect.');return}
    $('pw').value='';$('loginForm').classList.add('hide');setAdmin(true);
  }catch(e){alert('Connexion impossible.')}
};
$('pw').onkeydown=e=>{if(e.key==='Enter')$('pwOk').click()};
$('logout').onclick=async()=>{try{await fetch('/api/logout',{method:'POST',credentials:'same-origin'})}catch(e){}setAdmin(false)};
(async()=>{
  initAdmin();
  try{const r=await fetch('/api/me',{credentials:'same-origin'});setAdmin(!!(await r.json()).admin)}catch(e){setAdmin(false)}
  await load();
  setInterval(()=>{if(!document.hidden)load()},60000);
})();
