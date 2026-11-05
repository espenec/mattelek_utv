'use strict';
const $ = id => document.getElementById(id);
const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const controls = ['grade','topic','search','sort'].map($);
const topics = [...new Set(GAMES.flatMap(g => g.tags))].sort((a,b)=>a.localeCompare(b,'nb'));
$('topic').insertAdjacentHTML('beforeend',topics.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join(''));
function filteredGames(games, grade, topic, query, sort) {
 const q=query.trim().toLocaleLowerCase('nb');
 return games.filter(g=>(!grade || g.grade<=Number(grade)) && (!topic || g.tags.includes(topic)) && (!q || [g.title,g.equipment,g.summary,...g.tags].join(' ').toLocaleLowerCase('nb').includes(q))).sort((a,b)=>(sort==='grade' ? a.grade-b.grade : 0) || a.title.localeCompare(b.title,'nb',{numeric:true}));
}
function render(){
 const list=filteredGames(GAMES,$('grade').value,$('topic').value,$('search').value,$('sort').value);
 $('results').textContent=`${list.length} av ${GAMES.length} spill`;
 $('empty').hidden=!!list.length;
 $('games').innerHTML=list.map(g=>`<article class="game-card"><div class="card-top"><span class="grade-badge">Fra ${g.grade}. trinn</span><span class="card-number" aria-hidden="true">${String(GAMES.indexOf(g)+1).padStart(2,'0')}</span></div><h3>${esc(g.title)}</h3><p class="summary">${esc(g.summary)}</p><ul class="tags" aria-label="Tren på">${g.tags.map(t=>`<li>${esc(t)}</li>`).join('')}</ul><div class="card-bottom"><button class="open-game" data-game="${g.id}" aria-label="Åpne ${esc(g.title)}">Se spillet →</button><span class="resources-note">Video${g.resources.length?' + spillark':''}</span></div></article>`).join('');
}
function reset(){ $('grade').value='';$('topic').value='';$('search').value='';$('sort').value='name';render(); }
controls.forEach(el=>el.addEventListener(el.id==='search'?'input':'change',render));
$('reset').addEventListener('click',reset);$('empty-reset').addEventListener('click',()=>{reset();$('grade').focus()});
const dialog=$('game-dialog');let trigger=null;
function openGame(id){
 const g=GAMES.find(g=>g.id===id);if(!g)return;
 trigger=document.activeElement;
 $('detail').innerHTML=`<span class="grade-badge">Fra ${g.grade}. trinn og oppover</span><h2 id="dialog-title">${esc(g.title)}</h2><ul class="tags" aria-label="Tren på">${g.tags.map(t=>`<li>${esc(t)}</li>`).join('')}</ul><p class="equipment"><strong>Du trenger:</strong> ${esc(g.equipment)}</p><h3>Slik spiller dere</h3>${g.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}${g.clarification?`<p class="equipment"><strong>Avtal før start:</strong> ${esc(g.clarification)}</p>`:''}${g.images.map((src,i)=>`<img class="reference-image" src="${src}" alt="${esc(g.title)} – ${g.title==='10 000'?'poengtabell':'eksempel på spilleoppsett'}${g.images.length>1?' '+(i+1):''}" loading="lazy">`).join('')}${g.differentiation.length?`<section class="adaptation"><h3>Tilpass spillet</h3>${g.differentiation.map(p=>`<p>${esc(p)}</p>`).join('')}</section>`:''}${g.resources.length?`<h3>Spillark</h3><div class="resource-links">${g.resources.map(r=>`<a href="${r.href}" target="_blank" rel="noopener">${esc(r.label)} · PDF ↗</a>`).join('')}</div>`:''}<h3>Se gjennomføringen</h3><div id="video-area" class="video-placeholder"><button type="button" class="primary" id="play-video">▶ Spill av video</button><a class="video-link" href="https://www.youtube.com/watch?v=${g.video}" target="_blank" rel="noopener">Åpne på YouTube ↗</a><small>Videoen lastes fra YouTube først når du trykker på spill av.</small></div><p class="source">Fra <a href="${g.source}" target="_blank" rel="noopener">Espens klasserom – originalinnlegget ↗</a>. Temaene inkluderer også forslagene til tilpasning.</p>`;
 $('play-video').addEventListener('click',()=>{
  const area=$('video-area');area.className='';area.innerHTML=`<iframe class="video-frame" src="https://www.youtube-nocookie.com/embed/${g.video}?autoplay=1&rel=0" title="Video: ${esc(g.title)}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe><a class="video-link" href="https://www.youtube.com/watch?v=${g.video}" target="_blank" rel="noopener">Åpne på YouTube ↗</a>`;
 });
 dialog.showModal();dialog.scrollTop=0;$('close-dialog').focus();
}
$('games').addEventListener('click',e=>{const b=e.target.closest('[data-game]');if(b)openGame(b.dataset.game)});
$('close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
dialog.addEventListener('close',()=>{$('detail').innerHTML='';trigger?.focus()});
render();
