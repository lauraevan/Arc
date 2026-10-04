const GAME_DATA='https://raw.githubusercontent.com/lauraevan/Game-Stash/main/games.json';
const STASH_BASE='https://raw.githack.com/lauraevan/Game-Stash/main/';
const STASH_RAW='https://raw.githubusercontent.com/lauraevan/Game-Stash/main/';
const state={games:[],filtered:[],visible:60,view:'home'};

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

function encodePath(path=''){
  return path.split('/').map(encodeURIComponent).join('/');
}
function gameUrl(game){
  if(/^https?:\/\//i.test(game.gameUrl||'')) return game.gameUrl;
  return STASH_BASE+encodePath(game.gameUrl||'');
}
function imageUrl(game){
  if(/^https?:\/\//i.test(game.imageUrl||'')) return game.imageUrl;
  return STASH_RAW+encodePath(game.imageUrl||'');
}
function gameCard(game){
  const el=document.createElement('button');
  el.className='game-card';
  el.type='button';
  el.innerHTML=`<div class="game-art"><img loading="lazy" alt="" src="${imageUrl(game)}"></div>
    <div class="game-meta"><div class="game-name"></div><div class="game-sub"></div></div>`;
  $('.game-name',el).textContent=game.name||'Untitled';
  $('.game-sub',el).textContent=game.porter?('Port by '+game.porter):(game.author||'Arc game');
  $('img',el).addEventListener('error',e=>{e.currentTarget.style.opacity='.18'});
  el.addEventListener('click',()=>openGame(game));
  return el;
}
function renderFeatured(){
  const row=$('#featuredGames'); if(!row)return;
  row.innerHTML='';
  const items=state.games.filter(g=>g.featured).slice(0,12);
  (items.length?items:state.games.slice(0,12)).forEach(g=>row.append(gameCard(g)));
}
function applyGameFilter(reset=true){
  const q=($('#gameSearch')?.value||'').trim().toLowerCase();
  const mode=$('#gameFilter')?.value||'all';
  state.filtered=state.games.filter(g=>{
    const hay=[g.name,g.porter,g.author,g.source].filter(Boolean).join(' ').toLowerCase();
    return (!q||hay.includes(q))&&(mode!=='featured'||g.featured);
  });
  if(reset)state.visible=60;
  renderGames();
}
function renderGames(){
  const grid=$('#gameGrid'); if(!grid)return;
  grid.innerHTML='';
  state.filtered.slice(0,state.visible).forEach(g=>grid.append(gameCard(g)));
  const count=$('#gameCount');
  if(count)count.textContent=`${state.filtered.length.toLocaleString()} games available`;
  const more=$('#loadMore');
  if(more)more.hidden=state.visible>=state.filtered.length;
}
async function loadGames(){
  try{
    const res=await fetch(GAME_DATA,{cache:'no-store'});
    if(!res.ok)throw new Error('catalog request failed');
    const data=await res.json();
    state.games=Array.isArray(data)?data:[];
    state.filtered=state.games.slice();
    renderFeatured();renderGames();
  }catch(err){
    const count=$('#gameCount');if(count)count.textContent='Could not load the game library.';
    console.error(err);
  }
}
function switchView(name){
  state.view=name;
  $$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));
  $$('.nav-item[data-view]').forEach(b=>{
    const on=b.dataset.view===name;b.classList.toggle('active',on);
    if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  });
  document.body.classList.remove('sidebar-open');
  window.scrollTo({top:0,behavior:document.body.classList.contains('reduce-motion')?'auto':'smooth'});
  if(name==='games')setTimeout(()=>$('#gameSearch')?.focus({preventScroll:true}),40);
}
function openGame(game){
  const player=document.createElement('div');player.className='player';
  const title=document.createElement('div');title.className='player-title';title.textContent=game.name||'Arc';
  const frame=document.createElement('iframe');
  frame.src=gameUrl(game);frame.allow='autoplay; fullscreen; gamepad; clipboard-read; clipboard-write';frame.allowFullscreen=true;
  const bar=document.createElement('div');bar.className='player-bar';
  const spacer=document.createElement('div');spacer.className='player-spacer';
  const pop=document.createElement('button');pop.className='player-action';pop.textContent='Open tab';
  pop.onclick=()=>window.open(gameUrl(game),'_blank','noopener');
  const close=document.createElement('button');close.className='player-action player-close';close.textContent='×';close.setAttribute('aria-label','Close');
  close.onclick=()=>player.remove();
  bar.append(title,spacer,pop,close);player.append(bar,frame);document.body.append(player);
}
function setupNavigation(){
  $$('.nav-item[data-view]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
  $$('[data-go]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.go)));
  $('#menuButton')?.addEventListener('click',()=>document.body.classList.toggle('sidebar-open'));
  $('#mobileBackdrop')?.addEventListener('click',()=>document.body.classList.remove('sidebar-open'));
}
function setupSearch(){
  $('#gameSearch')?.addEventListener('input',()=>applyGameFilter(true));
  $('#gameFilter')?.addEventListener('change',()=>applyGameFilter(true));
  $('#loadMore')?.addEventListener('click',()=>{state.visible+=60;renderGames()});
  const global=$('#globalSearch');
  global?.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&global.value.trim()){
      switchView('games');const gs=$('#gameSearch');gs.value=global.value;applyGameFilter(true);
    }
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='/'&&!/input|textarea|select/i.test(document.activeElement?.tagName||'')){e.preventDefault();global?.focus()}
    if(e.key==='Escape'){const p=$('.player');if(p)p.remove();else document.body.classList.remove('sidebar-open')}
  });
}
function setupThemes(){
  const saved=localStorage.getItem('arc-theme')||'arc';
  setTheme(saved);
  $$('.theme-option').forEach(b=>b.addEventListener('click',()=>setTheme(b.dataset.theme)));
  const compact=$('#compactToggle'),motion=$('#motionToggle');
  compact.checked=localStorage.getItem('arc-compact')==='1';
  motion.checked=localStorage.getItem('arc-motion')==='1';
  document.body.classList.toggle('compact',compact.checked);
  document.body.classList.toggle('reduce-motion',motion.checked);
  compact.addEventListener('change',()=>{document.body.classList.toggle('compact',compact.checked);localStorage.setItem('arc-compact',compact.checked?'1':'0')});
  motion.addEventListener('change',()=>{document.body.classList.toggle('reduce-motion',motion.checked);localStorage.setItem('arc-motion',motion.checked?'1':'0')});
}
function setTheme(name){
  document.body.classList.remove('theme-mono','theme-midnight');
  if(name==='mono')document.body.classList.add('theme-mono');
  if(name==='midnight')document.body.classList.add('theme-midnight');
  $$('.theme-option').forEach(b=>b.classList.toggle('selected',b.dataset.theme===name));
  localStorage.setItem('arc-theme',name);
}
setupNavigation();setupSearch();setupThemes();loadGames();
