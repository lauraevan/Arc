const GAME_DATA='https://raw.githubusercontent.com/lauraevan/Game-Stash/main/games.json';
const STASH_BASE='https://raw.githack.com/lauraevan/Game-Stash/main/';
const STASH_RAW='https://raw.githubusercontent.com/lauraevan/Game-Stash/main/';
const CLOUD_API='https://stratus-api-ceav.onrender.com';
const MEDIA_API=CLOUD_API;
const MEDIA_PLAYER_ORIGIN='https://arc-media.onrender.com';
const SCRAMJET_ORIGIN='https://scramjet-v2-prod.onrender.com';
const state={games:[],filtered:[],visible:60,view:'home',heroItems:[],heroIndex:0,heroTimer:null};
const cloudState={games:[],filtered:[],tag:'All',featured:null,token:null,tokenExpires:0,loading:false,active:null,pingTimer:null};
const webState={target:null,proxyUrl:null};
const mediaState={loaded:false,loading:false,home:null,featured:null,query:'',hlsPromise:null};

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
function homeHeroItems(){
  const featured=state.games.filter(g=>g.featured&&g.imageUrl);
  return (featured.length?featured:state.games.filter(g=>g.imageUrl)).slice(0,8);
}
function showHomeHero(index=0){
  if(!state.heroItems.length)return;
  state.heroIndex=((index%state.heroItems.length)+state.heroItems.length)%state.heroItems.length;
  const game=state.heroItems[state.heroIndex];
  const bg=$('#homeHeroBg'),title=$('#homeHeroTitle'),text=$('#homeHeroText'),eyebrow=$('#homeHeroEyebrow'),play=$('#homeHeroPlay');
  if(bg){
    bg.style.opacity='.35';
    const next=imageUrl(game);
    const preload=new Image();
    preload.onload=()=>{if(state.heroItems[state.heroIndex]===game){bg.src=next;requestAnimationFrame(()=>bg.style.opacity='.88')}};
    preload.onerror=()=>{bg.style.opacity='.5'};
    preload.src=next;
  }
  if(title)title.textContent=game.name||'Featured game';
  if(text){
    const credit=game.porter?('Port by '+game.porter+'. '):game.author?('By '+game.author+'. '):'';
    text.textContent=credit+'Play instantly from the Arc game library.';
  }
  if(eyebrow)eyebrow.innerHTML='ARC <i></i> FEATURED GAME';
  if(play){play.disabled=false;play.onclick=()=>openGame(game)}
  $('#homeHeroDots .hero-dot').forEach((dot,i)=>dot.classList.toggle('active',i===state.heroIndex));
}
function startHomeHero(){
  state.heroItems=homeHeroItems();
  if(!state.heroItems.length)return;
  const dots=$('#homeHeroDots');
  if(dots){
    dots.innerHTML='';
    state.heroItems.forEach((game,i)=>{
      const dot=document.createElement('button');
      dot.type='button';dot.className='hero-dot';dot.setAttribute('aria-label',game.name||('Featured game '+(i+1)));
      dot.onclick=()=>{showHomeHero(i);restartHomeHeroTimer()};
      dots.append(dot);
    });
  }
  showHomeHero(0);
  restartHomeHeroTimer();
}
function restartHomeHeroTimer(){
  clearInterval(state.heroTimer);
  if(state.heroItems.length<2)return;
  state.heroTimer=setInterval(()=>{
    if(state.view==='home'&&!document.hidden)showHomeHero(state.heroIndex+1);
  },7000);
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
    renderFeatured();renderGames();startHomeHero();
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
  if(name==='watch')loadMediaHome();
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

function cloudAuthHeaders(json=true){
  const headers={Authorization:`Bearer ${cloudState.token||''}`,'X-Arc-Client':'arc-ubg'};
  if(json)headers['Content-Type']='application/json';
  return headers;
}
function cloudSetStatus(label,state='connecting'){
  const el=$('#cloudApiStatus');if(!el)return;
  el.className=`cloud-status ${state}`;
  el.innerHTML='<i></i>'+label;
}
async function ensureCloudToken(){
  if(cloudState.token&&cloudState.tokenExpires>Date.now()+60_000)return cloudState.token;
  const res=await fetch(`${CLOUD_API}/cloud/v1/browser-token`,{
    method:'POST',
    headers:{'Content-Type':'application/json','X-Arc-Client':'arc-ubg'},
    body:'{}'
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||`Arc Cloud auth failed (${res.status})`);
  cloudState.token=data.token;
  cloudState.tokenExpires=Number(data.expires_at)||Date.now()+30*60_000;
  return cloudState.token;
}
async function loadCloudCatalog(){
  if(cloudState.loading||cloudState.games.length)return;
  cloudState.loading=true;
  cloudSetStatus('Connecting','connecting');
  try{
    const res=await fetch(`${CLOUD_API}/cloud/v1/catalog`,{cache:'no-store'});
    if(!res.ok)throw new Error(`Catalog unavailable (${res.status})`);
    const data=await res.json();
    cloudState.games=Array.isArray(data)?data:[];
    cloudState.filtered=cloudState.games.slice();
    cloudState.featured=cloudState.games.find(g=>/black myth|battlefield|red dead/i.test(g.name||''))||cloudState.games[0]||null;
    renderCloudSpotlight();
    renderCloudTags();
    renderCloudGames();
    cloudSetStatus('Online','online');
    ensureCloudToken().catch(()=>{});
  }catch(err){
    cloudSetStatus('Offline','offline');
    const grid=$('#cloudGrid');
    if(grid)grid.innerHTML=`<div class="cloud-empty"><b>Arc Cloud is unavailable.</b><span>${escapeHtml(err.message||'Try again in a moment.')}</span><button class="secondary" id="retryCloud">Retry</button></div>`;
    setTimeout(()=>$('#retryCloud')?.addEventListener('click',()=>{cloudState.loading=false;cloudState.games=[];loadCloudCatalog()}),0);
  }finally{cloudState.loading=false}
}
function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function cloudGameArt(game){
  return game.cover||game.image||'';
}
function renderCloudSpotlight(){
  const game=cloudState.featured;if(!game)return;
  const bg=$('#cloudSpotlightBg'),title=$('#cloudSpotlightTitle'),desc=$('#cloudSpotlightDesc'),play=$('#cloudSpotlightPlay');
  if(bg)bg.style.backgroundImage=`url("${String(cloudGameArt(game)).replace(/"/g,'%22')}")`;
  if(title)title.textContent=game.name||'Arc Cloud';
  if(desc)desc.textContent=game.description||'Play instantly from Arc Cloud.';
  if(play){
    play.disabled=false;
    play.onclick=()=>startCloudGame(game);
  }
}
function renderCloudTags(){
  const host=$('#cloudTags');if(!host)return;
  const counts=new Map();
  cloudState.games.forEach(g=>(g.tags||[]).forEach(t=>counts.set(t,(counts.get(t)||0)+1)));
  const tags=['All',...Array.from(counts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([t])=>t)];
  host.innerHTML='';
  tags.forEach(tag=>{
    const b=document.createElement('button');
    b.type='button';b.className='cloud-tag'+(cloudState.tag===tag?' active':'');
    b.textContent=tag;
    b.onclick=()=>{cloudState.tag=tag;applyCloudFilter()};
    host.append(b);
  });
}
function applyCloudFilter(){
  const q=($('#cloudSearch')?.value||'').trim().toLowerCase();
  cloudState.filtered=cloudState.games.filter(g=>{
    const text=[g.name,g.description,...(g.tags||[])].filter(Boolean).join(' ').toLowerCase();
    return (!q||text.includes(q))&&(cloudState.tag==='All'||(g.tags||[]).includes(cloudState.tag));
  });
  renderCloudTags();renderCloudGames();
}
function renderCloudGames(){
  const host=$('#cloudGrid');if(!host)return;
  host.innerHTML='';
  cloudState.filtered.forEach(game=>{
    const card=document.createElement('button');
    card.type='button';card.className='cloud-game-card';
    const art=document.createElement('div');art.className='cloud-game-art';
    const img=document.createElement('img');img.loading='lazy';img.alt='';img.src=cloudGameArt(game);
    img.addEventListener('error',()=>{img.style.opacity='.15'});
    const play=document.createElement('span');play.className='cloud-play-badge';play.innerHTML='<svg viewBox="0 0 24 24"><path d="m9 7 8 5-8 5Z"/></svg>';
    art.append(img,play);
    const meta=document.createElement('div');meta.className='cloud-game-meta';
    const name=document.createElement('div');name.className='cloud-game-name';name.textContent=game.name||'Untitled';
    const tags=document.createElement('div');tags.className='cloud-game-tags';tags.textContent=(game.tags||[]).slice(0,2).join(' · ')||'Cloud';
    meta.append(name,tags);card.append(art,meta);
    card.onclick=()=>startCloudGame(game);
    host.append(card);
  });
  const count=$('#cloudGameCount');
  if(count)count.textContent=`${cloudState.filtered.length.toLocaleString()} games`;
  if(!cloudState.filtered.length)host.innerHTML='<div class="cloud-empty"><b>No games found.</b><span>Try another search or category.</span></div>';
}
function showCloudSession(game){
  closeCloudSession(false);
  const shell=document.createElement('div');shell.className='cloud-session';shell.id='cloudSession';
  shell.innerHTML=`
    <div class="cloud-session-bar">
      <div class="cloud-session-game">
        <span class="cloud-session-dot"></span>
        <div><b></b><small id="cloudSessionStatus">Preparing session…</small></div>
      </div>
      <div class="cloud-session-tools">
        <span class="cloud-time" id="cloudSessionTime">19:00</span>
        <button class="cloud-session-close" id="cloudSessionClose" aria-label="Exit cloud game">×</button>
      </div>
    </div>
    <div class="cloud-stage" id="cloudStage">
      <div class="cloud-loader">
        <img src="assets/arc-logo.svg" alt="" />
        <b id="cloudLoaderTitle">Starting ${escapeHtml(game.name||'game')}</b>
        <span id="cloudLoaderText">Connecting to Arc Cloud…</span>
        <div class="cloud-progress"><i id="cloudProgressBar"></i></div>
      </div>
    </div>`;
  $('.cloud-session-game b',shell).textContent=game.name||'Arc Cloud';
  document.body.append(shell);
  $('#cloudSessionClose')?.addEventListener('click',()=>closeCloudSession(true));
  return shell;
}
function setCloudSessionStatus(title,text,progress){
  const status=$('#cloudSessionStatus'),loader=$('#cloudLoaderTitle'),sub=$('#cloudLoaderText'),bar=$('#cloudProgressBar');
  if(status)status.textContent=text||title;
  if(loader)loader.textContent=title;
  if(sub)sub.textContent=text||'';
  if(bar&&Number.isFinite(progress))bar.style.width=`${Math.max(4,Math.min(100,progress))}%`;
}
async function readNdjson(res,onItem){
  if(!res.body?.getReader){
    const txt=await res.text();
    txt.split(/\\n+/).filter(Boolean).forEach(line=>{try{onItem(JSON.parse(line))}catch{}});
    return;
  }
  const reader=res.body.getReader();const decoder=new TextDecoder();let buf='';
  while(true){
    const {done,value}=await reader.read();
    if(done)break;
    buf+=decoder.decode(value,{stream:true});
    const lines=buf.split('\\n');buf=lines.pop()||'';
    for(const line of lines){if(!line.trim())continue;try{onItem(JSON.parse(line))}catch{}}
  }
  if(buf.trim()){try{onItem(JSON.parse(buf))}catch{}}
}
async function startCloudGame(game){
  if(cloudState.active)return;
  showCloudSession(game);
  cloudState.active={game,uuid:null,started:false};
  try{
    await ensureCloudToken();
    setCloudSessionStatus('Preparing your cloud PC','Reserving a session…',14);
    const res=await fetch(`${CLOUD_API}/cloud/v1/createSession`,{
      method:'POST',headers:cloudAuthHeaders(),body:JSON.stringify({game_key:game.game_key})
    });
    if(!res.ok){
      const data=await res.json().catch(()=>({}));
      throw new Error(data.error||`Session request failed (${res.status})`);
    }
    let terminal=false;
    await readNdjson(res,item=>{
      if(!cloudState.active)return;
      if(item.uuid)cloudState.active.uuid=item.uuid;
      if(item.status==='creating_account')setCloudSessionStatus('Preparing your cloud PC','Getting a session ready…',24);
      if(item.status==='account_ready')setCloudSessionStatus('Account ready','Contacting the game server…',38);
      if(item.status==='requesting_game')setCloudSessionStatus('Requesting game','Checking availability…',50);
      if(item.status==='queue'){
        terminal=true;
        const pos=Number(item.queue_pos)||0;
        setCloudSessionStatus('Waiting for a machine',pos?`Queue position ${pos}`:'Almost ready…',58);
        setTimeout(()=>pollCloudQueue(),3300);
      }
      if(item.status==='finished_queue'){
        terminal=true;
        setCloudSessionStatus('Machine ready','Starting stream…',78);
        activateCloudSession();
      }
      if(item.status==='error')throw new Error(item.error||'Cloud session failed');
    });
    if(!terminal&&cloudState.active?.uuid&&!cloudState.active.started){
      setTimeout(()=>pollCloudQueue(),3300);
    }
  }catch(err){
    cloudSessionError(err);
  }
}
async function pollCloudQueue(){
  const active=cloudState.active;if(!active?.uuid||active.started)return;
  try{
    const res=await fetch(`${CLOUD_API}/cloud/v1/getQueue?uuid=${encodeURIComponent(active.uuid)}`,{headers:cloudAuthHeaders(false),cache:'no-store'});
    const data=await res.json().catch(()=>({}));
    if(res.status===429){setTimeout(()=>pollCloudQueue(),3500);return}
    if(!res.ok)throw new Error(data.error||`Queue check failed (${res.status})`);
    if(data.status==='creating_account'){
      setCloudSessionStatus('Preparing your cloud PC','Still getting an account ready…',30);
      setTimeout(()=>pollCloudQueue(),3500);return;
    }
    if(data.status==='finished_queue'){
      setCloudSessionStatus('Machine ready','Starting stream…',80);
      await activateCloudSession();return;
    }
    const pos=Number(data.queue_pos)||0;
    const pct=Math.max(55,Math.min(76,76-Math.min(pos,20)));
    setCloudSessionStatus('Waiting for a machine',pos?`Queue position ${pos}`:'Almost ready…',pct);
    setTimeout(()=>pollCloudQueue(),3500);
  }catch(err){cloudSessionError(err)}
}
async function activateCloudSession(){
  const active=cloudState.active;if(!active?.uuid||active.started)return;
  active.started=true;
  try{
    const res=await fetch(`${CLOUD_API}/cloud/v1/startGame`,{
      method:'POST',headers:cloudAuthHeaders(),body:JSON.stringify({uuid:active.uuid})
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.error||`Start failed (${res.status})`);
    active.maxSeconds=Number(data.max_seconds)||1140;
    active.startedAt=Date.now();
    const stage=$('#cloudStage');
    if(!stage)return;
    const frame=document.createElement('iframe');
    frame.className='cloud-frame';
    frame.allow='autoplay; fullscreen; gamepad; clipboard-read; clipboard-write';
    frame.allowFullscreen=true;
    frame.src=`${CLOUD_API}/cloud/v1/embed?id=${encodeURIComponent(active.uuid)}`;
    stage.replaceChildren(frame);
    $('#cloudSessionStatus').textContent=data.relay_available?'Streaming · relay ready':'Streaming';
    startCloudHeartbeat();
    updateCloudTime();
  }catch(err){
    active.started=false;
    cloudSessionError(err);
  }
}
function startCloudHeartbeat(){
  clearInterval(cloudState.pingTimer);
  cloudState.pingTimer=setInterval(async()=>{
    const active=cloudState.active;if(!active?.uuid||!active.started)return;
    try{
      const res=await fetch(`${CLOUD_API}/cloud/v1/pingSession`,{
        method:'POST',headers:cloudAuthHeaders(),body:JSON.stringify({uuid:active.uuid})
      });
      if(!res.ok&&res.status!==429){
        const data=await res.json().catch(()=>({}));
        throw new Error(data.error||'Cloud session ended');
      }
      if(res.ok){
        const data=await res.json().catch(()=>null);
        if(data?.session_time_limit_seconds)active.maxSeconds=data.session_time_limit_seconds;
      }
    }catch(err){
      if(cloudState.active)$('#cloudSessionStatus').textContent='Connection interrupted';
    }
  },12000);
  cloudState.pingTimer.unref?.();
}
function updateCloudTime(){
  const active=cloudState.active;if(!active?.started)return;
  const remaining=Math.max(0,(active.maxSeconds||1140)-Math.floor((Date.now()-active.startedAt)/1000));
  const el=$('#cloudSessionTime');
  if(el)el.textContent=`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`;
  if(remaining>0&&cloudState.active===active)setTimeout(updateCloudTime,1000);
}
function cloudSessionError(err){
  setCloudSessionStatus('Couldn’t start the session',err?.message||'Arc Cloud returned an error.',100);
  const stage=$('#cloudStage');
  const loader=stage?.querySelector('.cloud-loader');
  if(loader&&!loader.querySelector('.cloud-error-actions')){
    const actions=document.createElement('div');actions.className='cloud-error-actions';
    actions.innerHTML='<button class="secondary">Close</button>';
    actions.querySelector('button').onclick=()=>closeCloudSession(true);
    loader.append(actions);
  }
}
async function closeCloudSession(sendQuit=true){
  const active=cloudState.active;
  cloudState.active=null;
  clearInterval(cloudState.pingTimer);cloudState.pingTimer=null;
  $('#cloudSession')?.remove();
  if(sendQuit&&active?.uuid&&cloudState.token){
    try{
      await fetch(`${CLOUD_API}/cloud/v1/quitSession`,{
        method:'POST',headers:cloudAuthHeaders(),body:JSON.stringify({uuid:active.uuid}),keepalive:true
      });
    }catch{}
  }
}
function setupCloud(){
  $('#cloudSearch')?.addEventListener('input',applyCloudFilter);
  window.addEventListener('pagehide',()=>{
    const active=cloudState.active;
    if(active?.uuid&&cloudState.token){
      fetch(`${CLOUD_API}/cloud/v1/quitSession`,{
        method:'POST',headers:cloudAuthHeaders(),body:JSON.stringify({uuid:active.uuid}),keepalive:true
      }).catch(()=>{});
    }
  });
  loadCloudCatalog();
}


function mediaType(item,forced=''){
  return forced||item?.media_type||'movie';
}
function mediaTitle(item){
  return item?.title||item?.name||'Untitled';
}
function mediaYear(item){
  return String(item?.release_date||item?.first_air_date||'').slice(0,4);
}
function mediaPoster(item){
  return item?.poster_path?`https://image.tmdb.org/t/p/w500${item.poster_path}`:'';
}
function mediaBackdrop(item){
  return item?.backdrop_path?`https://image.tmdb.org/t/p/original${item.backdrop_path}`:mediaPoster(item);
}
function mediaCard(item,forcedType=''){
  const type=mediaType(item,forcedType);
  const card=document.createElement('button');
  card.type='button';card.className='media-card';
  const poster=mediaPoster(item);
  card.innerHTML=`<div class="media-poster">${poster?`<img loading="lazy" alt="" src="${poster}">`:'<div class="media-poster-fallback">ARC</div>'}</div><div class="media-card-copy"><b></b><span></span></div>`;
  $('.media-card-copy b',card).textContent=mediaTitle(item);
  $('.media-card-copy span',card).textContent=[type==='tv'?'Series':'Movie',mediaYear(item)].filter(Boolean).join(' · ');
  card.onclick=()=>openMediaDetails(type,item.id);
  return card;
}
function renderMediaRow(id,items,forcedType=''){
  const host=$(id);if(!host)return;
  host.innerHTML='';
  (items||[]).filter(x=>x?.id&&(forcedType||['movie','tv'].includes(x.media_type))).slice(0,20).forEach(item=>host.append(mediaCard(item,forcedType)));
  if(!host.children.length)host.innerHTML='<div class="media-empty">Nothing to show right now.</div>';
}
function renderMediaHero(item){
  mediaState.featured=item;
  const bg=$('#mediaHeroBg'),title=$('#mediaHeroTitle'),text=$('#mediaHeroText'),button=$('#mediaHeroPlay');
  if(!item)return;
  if(bg)bg.style.backgroundImage=`url("${String(mediaBackdrop(item)).replace(/"/g,'%22')}")`;
  if(title)title.textContent=mediaTitle(item);
  if(text)text.textContent=item.overview||'Watch movies and shows through Arc.';
  if(button){button.disabled=false;button.onclick=()=>openMediaDetails(mediaType(item),item.id)}
}
async function loadMediaHome(force=false){
  if((mediaState.loaded&&!force)||mediaState.loading)return;
  mediaState.loading=true;
  try{
    const res=await fetch(`${MEDIA_API}/media/v1/home`,{cache:'no-store'});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.error||data.detail||`Media catalog failed (${res.status})`);
    mediaState.home=data;mediaState.loaded=true;
    const trending=(data.trending||[]).filter(x=>['movie','tv'].includes(x.media_type));
    renderMediaHero(trending.find(x=>x.backdrop_path)||trending[0]||data.popular_movies?.[0]);
    renderMediaRow('#mediaTrending',trending);
    renderMediaRow('#mediaMovies',data.popular_movies||[],'movie');
    renderMediaRow('#mediaTv',data.popular_tv||[],'tv');
    renderMediaRow('#mediaTopRated',[...(data.top_rated_movies||[]).slice(0,10),...(data.top_rated_tv||[]).slice(0,10)].map((x,i)=>({...x,media_type:i<10?'movie':'tv'})));
  }catch(err){
    const hero=$('#mediaHeroText');if(hero)hero.textContent=err.message||'Could not load movies and shows.';
    ['#mediaTrending','#mediaMovies','#mediaTv','#mediaTopRated'].forEach(id=>{const el=$(id);if(el)el.innerHTML='<div class="media-empty">Media library unavailable. Try again shortly.</div>'});
  }finally{mediaState.loading=false}
}
async function searchMedia(query){
  const q=String(query||'').trim();
  if(!q){clearMediaSearch();return}
  mediaState.query=q;
  const rows=$('#mediaRows'),grid=$('#mediaSearchGrid'),head=$('#mediaResultsHead'),title=$('#mediaResultsTitle');
  if(rows)rows.hidden=true;if(grid){grid.hidden=false;grid.innerHTML='<div class="media-empty">Searching…</div>'}if(head)head.hidden=false;if(title)title.textContent=`Results for “${q}”`;
  try{
    const res=await fetch(`${MEDIA_API}/media/v1/search?q=${encodeURIComponent(q)}`,{cache:'no-store'});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.detail||'Search failed');
    grid.innerHTML='';
    (data.results||[]).slice(0,40).forEach(item=>grid.append(mediaCard(item)));
    if(!grid.children.length)grid.innerHTML='<div class="media-empty">No movies or shows found.</div>';
  }catch(err){grid.innerHTML=`<div class="media-empty">${escapeHtml(err.message||'Search failed.')}</div>`}
}
function clearMediaSearch(){
  mediaState.query='';
  const input=$('#mediaSearchInput');if(input)input.value='';
  const rows=$('#mediaRows'),grid=$('#mediaSearchGrid'),head=$('#mediaResultsHead');
  if(rows)rows.hidden=false;if(grid){grid.hidden=true;grid.innerHTML=''}if(head)head.hidden=true;
}
async function openMediaDetails(type,id){
  $('#mediaDetails')?.remove();
  const modal=document.createElement('div');modal.className='media-details';modal.id='mediaDetails';
  modal.innerHTML='<div class="media-details-loading">Loading details…</div>';
  document.body.append(modal);
  try{
    const res=await fetch(`${MEDIA_API}/media/v1/details/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,{cache:'no-store'});
    const item=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(item.detail||'Could not load title');
    const backdrop=mediaBackdrop(item);
    modal.innerHTML=`
      <button class="media-details-close" aria-label="Close">×</button>
      <div class="media-details-art" style="background-image:url('${String(backdrop).replace(/'/g,'%27')}')"></div>
      <div class="media-details-scrim"></div>
      <div class="media-details-copy">
        <span class="kicker">${type==='tv'?'SERIES':'MOVIE'}</span>
        <h2></h2>
        <div class="media-details-meta"></div>
        <p></p>
        <div class="media-episode-controls" id="mediaEpisodeControls" ${type==='tv'?'':'hidden'}>
          <select id="mediaSeasonSelect" aria-label="Season"></select>
          <select id="mediaEpisodeSelect" aria-label="Episode"></select>
        </div>
        <div class="media-details-actions">
          <button class="primary" id="mediaPlayNow">Play</button>
          <button class="secondary" id="mediaCloseDetails">Close</button>
        </div>
      </div>`;
    $('.media-details-copy h2',modal).textContent=mediaTitle(item);
    $('.media-details-copy p',modal).textContent=item.overview||'No description available.';
    $('.media-details-meta',modal).textContent=[
      mediaYear(item),
      item.runtime?`${item.runtime} min`:item.number_of_seasons?`${item.number_of_seasons} season${item.number_of_seasons===1?'':'s'}`:'',
      item.vote_average?`${Number(item.vote_average).toFixed(1)}/10`:''
    ].filter(Boolean).join(' · ');
    const close=()=>modal.remove();
    $('.media-details-close',modal).onclick=close;
    $('#mediaCloseDetails',modal).onclick=close;
    if(type==='tv'){
      const seasonSelect=$('#mediaSeasonSelect',modal);
      const seasons=(item.seasons||[]).filter(s=>s.season_number>0);
      seasons.forEach(s=>{const o=document.createElement('option');o.value=s.season_number;o.textContent=s.name||`Season ${s.season_number}`;seasonSelect.append(o)});
      if(!seasonSelect.children.length){const o=document.createElement('option');o.value='1';o.textContent='Season 1';seasonSelect.append(o)}
      const loadEpisodes=async()=>{
        const season=Number(seasonSelect.value)||1;
        const epSelect=$('#mediaEpisodeSelect',modal);epSelect.innerHTML='<option>Loading…</option>';
        try{
          const rr=await fetch(`${MEDIA_API}/media/v1/tv/${id}/season/${season}`);
          const dd=await rr.json();epSelect.innerHTML='';
          (dd.episodes||[]).forEach(ep=>{const o=document.createElement('option');o.value=ep.episode_number;o.textContent=`${ep.episode_number}. ${ep.name||'Episode'}`;epSelect.append(o)});
        }catch{epSelect.innerHTML='<option value="1">Episode 1</option>'}
      };
      seasonSelect.onchange=loadEpisodes;await loadEpisodes();
    }
    $('#mediaPlayNow',modal).onclick=()=>{
      const season=type==='tv'?Number($('#mediaSeasonSelect',modal)?.value)||1:null;
      const episode=type==='tv'?Number($('#mediaEpisodeSelect',modal)?.value)||1:null;
      playMedia({type,id,title:mediaTitle(item),year:Number(mediaYear(item))||undefined,imdbId:item.imdb_id||'',season,episode});
    };
  }catch(err){modal.innerHTML=`<button class="media-details-close" aria-label="Close">×</button><div class="media-details-loading">${escapeHtml(err.message||'Could not load title.')}</div>`;$('.media-details-close',modal).onclick=()=>modal.remove()}
}
function absoluteMediaUrl(url=''){
  return /^https?:\/\//i.test(url)?url:MEDIA_API+(url.startsWith('/')?url:'/'+url);
}
function ensureHls(){
  if(window.Hls)return Promise.resolve(window.Hls);
  if(mediaState.hlsPromise)return mediaState.hlsPromise;
  const sources=[
    'https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.6.13/hls.min.js'
  ];
  mediaState.hlsPromise=new Promise((resolve,reject)=>{
    let index=0;
    const load=()=>{
      if(index>=sources.length){reject(new Error('Could not load the HLS player'));return}
      const s=document.createElement('script');
      s.src=sources[index++];
      s.onload=()=>window.Hls?resolve(window.Hls):load();
      s.onerror=()=>{s.remove();load()};
      document.head.append(s);
    };
    load();
  });
  return mediaState.hlsPromise;
}
function resetMediaVideo(video){
  try{video?._arcHls?.destroy()}catch{}
  video._arcHls=null;
  try{video.pause()}catch{}
  video.removeAttribute('src');
  video.load();
}
function waitForMediaReady(video,timeout=12000){
  return new Promise((resolve,reject)=>{
    let settled=false;
    const finish=(error)=>{
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      video.removeEventListener('loadedmetadata',ready);
      video.removeEventListener('canplay',ready);
      video.removeEventListener('error',failed);
      error?reject(error):resolve();
    };
    const ready=()=>finish();
    const failed=()=>finish(new Error(video.error?.message||'Source failed to load'));
    const timer=setTimeout(()=>finish(new Error('Source timed out')),timeout);
    video.addEventListener('loadedmetadata',ready);
    video.addEventListener('canplay',ready);
    video.addEventListener('error',failed);
  });
}
async function attachMediaSource(video,server){
  resetMediaVideo(video);
  const url=absoluteMediaUrl(server.play_url||'');
  if(!url)throw new Error('No playable URL returned');
  const isHls=server.type==='hls'||/\.m3u8(?:$|\?)/i.test(url);
  if(isHls&&video.canPlayType('application/vnd.apple.mpegurl')){
    video.src=url;
    video.load();
    await waitForMediaReady(video,12000);
    return;
  }
  if(isHls){
    const Hls=await ensureHls();
    if(!Hls?.isSupported())throw new Error('HLS playback is not supported here');
    const hls=new Hls({
      enableWorker:true,
      lowLatencyMode:false,
      manifestLoadingTimeOut:10000,
      manifestLoadingMaxRetry:2,
      levelLoadingTimeOut:10000,
      levelLoadingMaxRetry:2,
      fragLoadingTimeOut:12000,
      fragLoadingMaxRetry:3
    });
    video._arcHls=hls;
    const fatal=new Promise((_,reject)=>{
      hls.on(Hls.Events.ERROR,(_event,data)=>{
        if(data?.fatal)reject(new Error(`HLS source failed: ${data.details||data.type||'unknown error'}`));
      });
    });
    hls.loadSource(url);
    hls.attachMedia(video);
    await Promise.race([waitForMediaReady(video,14000),fatal]);
    return;
  }
  video.src=url;
  video.load();
  await waitForMediaReady(video,12000);
}
function mediaServerRank(server){
  const provider=String(server?.provider||'').toLowerCase();
  const name=String(server?.name||'').toLowerCase();
  if(provider==='orlando')return 0;
  if(provider==='vidy'&&name.includes('miami'))return 1;
  if(provider==='vidcore')return 2;
  if(provider==='castle')return 3;
  if(provider==='vidlink')return 4;
  if(provider==='vidnest')return 5;
  if(provider==='vidzee')return 6;
  if(provider==='vidrock')return 7;
  if(provider==='cinejoy')return 8;
  if(provider==='vixsrc')return 9;
  return 20;
}
async function playMedia(opts){
  $('#mediaPlayer')?.remove();
  const shell=document.createElement('div');shell.className='media-player';shell.id='mediaPlayer';
  shell.innerHTML=`<div class="media-player-bar"><div><b></b><small id="mediaPlayerStatus">Arc player</small></div><button aria-label="Close">×</button></div><div class="media-player-stage"></div>`;
  $('.media-player-bar b',shell).textContent=opts.title||'Arc';
  $('.media-player-bar button',shell).onclick=()=>shell.remove();
  const qs=new URLSearchParams({type:opts.type,id:String(opts.id)});
  if(opts.season)qs.set('season',String(opts.season));
  if(opts.episode)qs.set('episode',String(opts.episode));
  const frame=document.createElement('iframe');
  frame.className='media-frame';
  frame.allow='autoplay; fullscreen; picture-in-picture';
  frame.allowFullscreen=true;
  frame.referrerPolicy='no-referrer';
  frame.src=`${MEDIA_PLAYER_ORIGIN}/api/player?${qs}`;
  $('.media-player-stage',shell).append(frame);
  document.body.append(shell);
}
function setupMedia(){
  $('#mediaSearchForm')?.addEventListener('submit',e=>{e.preventDefault();searchMedia($('#mediaSearchInput')?.value||'')});
  $('#mediaClearSearch')?.addEventListener('click',clearMediaSearch);
}


function normalizeWebTarget(input=''){
  const value=String(input).trim();
  if(!value)return null;
  if(/^https?:\/\//i.test(value))return value;
  if(/^([a-z0-9-]+\.)+[a-z]{2,}([/:?#].*)?$/i.test(value))return 'https://'+value;
  return 'https://www.google.com/search?q='+encodeURIComponent(value);
}
function scramjetGotoUrl(target){
  return SCRAMJET_ORIGIN+'/?goto='+encodeURIComponent(target);
}
function loadWebTarget(input){
  const target=normalizeWebTarget(input);
  if(!target)return;
  webState.target=target;
  webState.proxyUrl=scramjetGotoUrl(target);
  switchView('web');
  const addr=$('#webAddress');
  if(addr)addr.value=target;
  const stage=$('#webStage');
  if(!stage)return;
  const frame=document.createElement('iframe');
  frame.className='web-frame';
  frame.id='webFrame';
  frame.src=webState.proxyUrl;
  frame.allow='fullscreen; autoplay; clipboard-read; clipboard-write; gamepad';
  frame.referrerPolicy='no-referrer';
  stage.replaceChildren(frame);
}
function showWebHome(){
  webState.target=null;webState.proxyUrl=null;
  const addr=$('#webAddress');if(addr)addr.value='';
  const stage=$('#webStage');if(!stage)return;
  stage.innerHTML=`<div class="web-start">
    <img src="assets/arc-logo.svg" alt="" />
    <h1>Search The Web</h1>
    <p>Browse through Arc using Scramjet v2.</p>
    <form class="web-start-search" id="webStartForm">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
      <input id="webStartInput" autocomplete="off" placeholder="Search the web or enter a URL" />
    </form>
  </div>`;
  bindWebStartForm();
}
function bindWebStartForm(){
  $('#webStartForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    loadWebTarget($('#webStartInput')?.value||'');
  });
}
function setupWeb(){
  bindWebStartForm();
  $('#webAddressForm')?.addEventListener('submit',e=>{
    e.preventDefault();loadWebTarget($('#webAddress')?.value||'');
  });
  $('#webReload')?.addEventListener('click',()=>{
    const frame=$('#webFrame');if(frame&&webState.proxyUrl)frame.src=webState.proxyUrl;
  });
  $('#webBack')?.addEventListener('click',()=>{
    const frame=$('#webFrame');try{frame?.contentWindow?.history.back()}catch{}
  });
  $('#webForward')?.addEventListener('click',()=>{
    const frame=$('#webFrame');try{frame?.contentWindow?.history.forward()}catch{}
  });
  $('#webHome')?.addEventListener('click',showWebHome);
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
      loadWebTarget(global.value);
      global.blur();
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
setupNavigation();setupSearch();setupThemes();setupWeb();setupCloud();setupMedia();loadGames();
