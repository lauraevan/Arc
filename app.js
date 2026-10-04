const GAME_DATA='games-catalog.json';
const HOME_GAMES=[{"id":1,"name":"Bendy and the Ink Machine","gameUrl":"Games/BATIM/index.html","imageUrl":"Game Artwork/batim.png","featured":true,"porter":"crackers & slqnt"},{"id":2,"name":"MiSide","gameUrl":"Games/miside/miside.html","imageUrl":"Game Artwork/miside.jpg","featured":true,"porter":"crackers"},{"id":5,"name":"Cuphead","gameUrl":"Games/cuphead/index.html","imageUrl":"Game Artwork/cuphead.png","featured":true,"porter":"crackers"},{"id":8,"name":"One Shot: World Machine Edition","gameUrl":"Games/oneshot-wme/index.html","imageUrl":"Game Artwork/oneshot.jpg","featured":true,"porter":"shayder"},{"id":10,"name":"Stardew Valley","gameUrl":"Games/stardewvalley/index.html","imageUrl":"Game Artwork/star.jpg","featured":true,"porter":"cirsius"},{"id":16,"name":"Azahar","gameUrl":"Games/Azahar/index.html","imageUrl":"Game Artwork/aza.png","featured":true,"porter":"sexyplankton"},{"id":19,"name":"Inscryption","gameUrl":"Games/inscryption/index.html","imageUrl":"Game Artwork/insc.png","featured":true,"porter":"reeyuki"},{"id":20,"name":"Lobotomy Corporation","gameUrl":"Games/lob-corp/index.html","imageUrl":"Game Artwork/lob-corp.png","featured":true,"porter":"reeyuki"},{"id":25,"name":"Trombone Champ","gameUrl":"Games/tchamp/index.html","imageUrl":"Game Artwork/tchamp/img.png","featured":true,"porter":"gurtmuncher"},{"id":26,"name":"Granny 3","gameUrl":"Games/granny/granny3.html","imageUrl":"Game Artwork/granny3.png","featured":true,"porter":"crax"},{"id":27,"name":"PEAK","gameUrl":"Games/peak/PEAK.html","imageUrl":"Game Artwork/peak.png","featured":true,"porter":"dasher"},{"id":28,"name":"Among Us","gameUrl":"Games/amongus/index.html","imageUrl":"Game Artwork/amongus.webp","featured":true,"porter":"(click for more info)"}];
const STASH_BASE='https://raw.githack.com/lauraevan/Game-Stash/main/';
const STASH_RAW='https://raw.githubusercontent.com/lauraevan/Game-Stash/main/';
const CLOUD_API='https://stratus-api-ceav.onrender.com';
const MEDIA_API=CLOUD_API;
const MEDIA_PLAYER_ORIGIN='https://arc-media.onrender.com';
const MUSIC_API=CLOUD_API;
const SCRAMJET_ORIGIN='https://scramjet-v2-prod.onrender.com';
const state={games:[],homeGames:HOME_GAMES.slice(),filtered:[],visible:60,view:'home',heroItems:[],heroIndex:0,heroTimer:null,heroArmed:false,libraryLoaded:false,libraryLoading:null};
const cloudState={games:[],filtered:[],tag:'All',featured:null,token:null,tokenExpires:0,loading:false,active:null,pingTimer:null};
const webState={target:null,proxyUrl:null};
const mediaState={loaded:false,loading:false,home:null,featured:null,query:'',hlsPromise:null};
const musicState={query:'',results:[],queue:[],index:-1,current:null,searchController:null,initialized:false,tab:'home',player:null,playerReady:null,ytPlayerReady:null,playerUsable:false,playing:false,shuffle:false,repeat:false,timer:null,mode:'idle',playToken:0,directAvailable:false,capabilitiesLoaded:false,audioCtx:null,audioSource:null,filters:[],splitter:null,merger:null,crossL:null,crossR:null,delayL:null,delayR:null,compressor:null,analyser:null,master:null,eq:[0,0,0,0,0,0],spatial:0,normalize:false,motion:true,lyricsCache:new Map(),homeTracks:[],homeLoaded:false,vizRaf:0};
const WALLPAPER_THEMES={
  fireflies:{
    url:'https://www.desktophut.com/files/1654706911-1654706911-pc-fireflies-forest-live-wallpaper.mp4',
    fallback:'assets/wallpapers/fireflies.b64',accent:'#d5b36a',dim:.58
  },
  cherry:{
    url:'https://motionbgs.com/dl/hd/7897',
    fallback:'assets/wallpapers/cherry.b64',accent:'#e2a2ba',dim:.56
  },
  makima:{
    url:'https://motionbgs.com/dl/hd/9059',
    fallback:'assets/wallpapers/makima.b64',accent:'#d46558',dim:.62
  },
  'green-tree':{
    url:'https://www.desktophut.com/files/1qEk6XwmHf-CalmGreenTreeLiveWallpaper.mp4',
    fallback:'assets/wallpapers/green-tree.b64',accent:'#78a86b',dim:.60
  },
  'japanese-summer':{
    imageB64:'assets/wallpapers/japanese-summer.jpg.b64',accent:'#d79b70',dim:.54
  }
};
const wallpaperState={urls:new Map(),token:0};


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
  el.setAttribute('aria-label','Play '+(game.name||'game'));
  el.innerHTML=`<div class="game-art"><img loading="lazy" decoding="async" fetchpriority="low" alt="" src="${imageUrl(game)}"></div>
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
  const source=state.homeGames.length?state.homeGames:state.games;
  const items=source.filter(g=>g.featured).slice(0,12);
  (items.length?items:source.slice(0,12)).forEach(g=>row.append(gameCard(g)));
}
function homeHeroItems(){
  const source=state.homeGames.length?state.homeGames:state.games;
  const featured=source.filter(g=>g.featured&&g.imageUrl);
  return (featured.length?featured:source.filter(g=>g.imageUrl)).slice(0,8);
}
function showHomeHero(index=0){
  if(!state.heroItems.length)return;
  state.heroIndex=((index%state.heroItems.length)+state.heroItems.length)%state.heroItems.length;
  const game=state.heroItems[state.heroIndex];
  const bg=$('#homeHeroBg'),title=$('#homeHeroTitle'),text=$('#homeHeroText'),eyebrow=$('#homeHeroEyebrow'),play=$('#homeHeroPlay');
  if(bg&&state.heroArmed){
    bg.style.opacity='.35';
    const next=imageUrl(game);
    const preload=new Image();
    preload.decoding='async';
    preload.fetchPriority='low';
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
  $$('#homeHeroDots .hero-dot').forEach((dot,i)=>dot.classList.toggle('active',i===state.heroIndex));
}
function armHomeHero(){
  if(state.heroArmed)return;
  state.heroArmed=true;
  showHomeHero(state.heroIndex);
  restartHomeHeroTimer();
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
  if(!state.heroArmed||state.heroItems.length<2)return;
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
  if(state.libraryLoaded)return state.games;
  if(state.libraryLoading)return state.libraryLoading;
  state.libraryLoading=(async()=>{
    try{
      const res=await fetch(GAME_DATA,{cache:'force-cache'});
      if(!res.ok)throw new Error('catalog request failed');
      const data=await res.json();
      state.games=Array.isArray(data)?data:[];
      state.filtered=state.games.slice();
      state.libraryLoaded=true;
      renderGames();
      return state.games;
    }catch(err){
      const count=$('#gameCount');if(count)count.textContent='Could not load the game library.';
      console.error(err);
      throw err;
    }finally{
      state.libraryLoading=null;
    }
  })();
  return state.libraryLoading;
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
  if(name==='games'){
    loadGames().catch(()=>{});
    setTimeout(()=>$('#gameSearch')?.focus({preventScroll:true}),40);
  }
  if(name==='cloud')loadCloudCatalog();
  if(name==='watch')loadMediaHome();
  if(name==='music')setupMusic();
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
    b.setAttribute('aria-label','Filter cloud games by '+tag);
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
    card.setAttribute('aria-label','Play '+(game.name||'cloud game'));
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
  card.setAttribute('aria-label','Open '+mediaTitle(item));
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
  if(opts.title)qs.set('title',opts.title);
  if(opts.year)qs.set('year',String(opts.year));
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
  const collapse=$('#sidebarCollapse');
  const applySidebarState=(collapsed)=>{
    document.body.classList.toggle('sidebar-collapsed',collapsed);
    if(collapse){
      collapse.setAttribute('aria-label',collapsed?'Expand sidebar':'Collapse sidebar');
      collapse.title=collapsed?'Expand sidebar':'Collapse sidebar';
    }
  };
  applySidebarState(localStorage.getItem('arc-sidebar-collapsed')==='1');
  collapse?.addEventListener('click',()=>{
    const collapsed=!document.body.classList.contains('sidebar-collapsed');
    applySidebarState(collapsed);
    localStorage.setItem('arc-sidebar-collapsed',collapsed?'1':'0');
  });
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

const MUSIC_EQ_PRESETS={
  flat:[0,0,0,0,0,0],
  bass:[7,5,2,0,-1,-2],
  vocal:[-2,-1,0,3,4,1],
  bright:[-2,-1,0,1,3,6],
  night:[4,2,0,-1,-2,-4]
};
const MUSIC_EQ_FREQS=[60,170,350,1000,3500,10000];

function musicApiUrl(path=''){
  return /^https?:\/\//i.test(path)?path:MUSIC_API+path;
}
function musicTime(seconds){
  const total=Math.max(0,Math.floor(Number(seconds)||0));
  return Math.floor(total/60)+':'+String(total%60).padStart(2,'0');
}
function musicSetStatus(text=''){
  const el=$('#musicStatus');
  if(el)el.textContent=text;
}
function setMusicTab(tab){
  musicState.tab=tab==='search'?'search':'home';
  $('#musicHome')?.toggleAttribute('hidden',musicState.tab!=='home');
  $('#musicSearchView')?.toggleAttribute('hidden',musicState.tab!=='search');
  $$('[data-music-tab]').forEach(b=>b.classList.toggle('active',b.dataset.musicTab===musicState.tab));
  if(musicState.tab==='search')setTimeout(()=>$('#musicSearchInput')?.focus({preventScroll:true}),20);
}
function musicThumb(track){
  return track?musicApiUrl(track.thumbnail||track.artwork||''):'';
}
function musicEngineLabel(){
  if(musicState.mode==='direct')return 'YT Music · Enhanced';
  if(musicState.mode==='youtube')return 'YT Music · Fallback';
  if(musicState.mode==='direct-loading')return 'Preparing audio';
  return 'YT Music';
}
function updateMusicEngineUI(){
  const text=musicEngineLabel();
  if($('#musicEnginePill'))$('#musicEnginePill').textContent=text;
  if($('#musicSoundEngine'))$('#musicSoundEngine').textContent=text;
  const enhanced=musicState.mode==='direct';
  $('#musicSoundPanel')?.classList.toggle('music-enhanced-ready',enhanced);
  $$('#musicEqPresets button,#musicEq input,#musicSpatial,#musicNormalize').forEach(control=>{
    control.disabled=!enhanced;
  });
  const note=$('#musicSoundNote');
  if(note){
    if(enhanced)note.textContent='Enhanced audio is active. EQ, Spatial Width and Sound Check are processing this track in real time.';
    else if(musicState.directAvailable)note.textContent='Enhanced audio is available and will activate when a compatible direct stream starts.';
    else note.textContent='This host is using the fast YouTube Music fallback player. Lyrics and Motion Artwork still work, but EQ and Spatial Width require the direct audio engine.';
  }
}
async function loadMusicCapabilities(){
  if(musicState.capabilitiesLoaded)return musicState.directAvailable;
  musicState.capabilitiesLoaded=true;
  try{
    const res=await fetch(MUSIC_API+'/music/v1/health',{cache:'no-store'});
    if(!res.ok)throw new Error('health failed');
    const data=await res.json();
    musicState.directAvailable=!!data.directAudioAvailable;
  }catch(_){
    musicState.directAvailable=false;
  }
  updateMusicEngineUI();
  return musicState.directAvailable;
}
function loadYoutubeApi(){
  if(window.YT&&window.YT.Player)return Promise.resolve();
  if(musicState.playerReady)return musicState.playerReady;
  musicState.playerReady=new Promise((resolve,reject)=>{
    const done=()=>resolve();
    if(window.YT&&window.YT.Player)return done();
    const old=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=()=>{try{if(typeof old==='function')old()}catch(_){} done()};
    if(!document.querySelector('script[data-arc-youtube]')){
      const script=document.createElement('script');
      script.src='https://www.youtube.com/iframe_api';
      script.async=true;
      script.dataset.arcYoutube='1';
      script.onerror=()=>reject(new Error('YouTube API failed'));
      document.head.append(script);
    }
    let checks=0;
    const poll=setInterval(()=>{
      if(window.YT&&window.YT.Player){clearInterval(poll);done()}
      else if(++checks>120){clearInterval(poll);reject(new Error('YouTube API timed out'))}
    },100);
  });
  return musicState.playerReady;
}
async function ensureMusicPlayer(){
  await loadYoutubeApi();
  if(musicState.player&&musicState.ytPlayerReady){await musicState.ytPlayerReady;return musicState.player}
  if(musicState.playerUsable)return musicState.player;
  musicState.ytPlayerReady=new Promise((resolve,reject)=>{
    let player;
    player=new YT.Player('musicYoutubeHost',{
      width:'200',height:'200',
      playerVars:{autoplay:0,controls:0,disablekb:1,fs:0,playsinline:1,rel:0,origin:location.origin},
      events:{
        onReady:event=>{
          const volume=Math.max(0,Math.min(100,Number(localStorage.getItem('arc-music-volume')||90)));
          event.target.setVolume(volume);
          musicState.player=event.target;
          musicState.playerUsable=true;
          resolve(event.target);
        },
        onStateChange:event=>{
          if(musicState.mode!=='youtube')return;
          musicState.playing=event.data===YT.PlayerState.PLAYING;
          if(event.data===YT.PlayerState.PLAYING){musicSetStatus('Playing');startMusicClock()}
          else if(event.data===YT.PlayerState.BUFFERING)musicSetStatus('Buffering…');
          else if(event.data===YT.PlayerState.PAUSED)stopMusicClock();
          else if(event.data===YT.PlayerState.ENDED){stopMusicClock();if(musicState.repeat)playMusicTrack(musicState.index);else stepMusic(1)}
          updateMusicPlayer();
        },
        onError:()=>{
          if(musicState.mode!=='youtube')return;
          musicState.playing=false;
          musicSetStatus('This track cannot be played');
          updateMusicPlayer();
        }
      }
    });
    musicState.player=player;
    setTimeout(()=>reject(new Error('YouTube player startup timed out')),12000);
  });
  return musicState.ytPlayerReady;
}
async function ensureMusicAudioGraph(){
  const audio=$('#musicAudio');
  if(!audio)return null;
  if(musicState.audioCtx){
    if(musicState.audioCtx.state==='suspended')await musicState.audioCtx.resume().catch(()=>{});
    return musicState.audioCtx;
  }
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtx)return null;
  const ctx=new AudioCtx();
  const source=ctx.createMediaElementSource(audio);
  const filters=MUSIC_EQ_FREQS.map((frequency,index)=>{
    const node=ctx.createBiquadFilter();
    node.frequency.value=frequency;
    node.gain.value=Number(musicState.eq[index]||0);
    if(index===0)node.type='lowshelf';
    else if(index===MUSIC_EQ_FREQS.length-1)node.type='highshelf';
    else{node.type='peaking';node.Q.value=1}
    return node;
  });
  source.connect(filters[0]);
  for(let i=0;i<filters.length-1;i++)filters[i].connect(filters[i+1]);

  const splitter=ctx.createChannelSplitter(2);
  const merger=ctx.createChannelMerger(2);
  filters[filters.length-1].connect(splitter);
  splitter.connect(merger,0,0);
  splitter.connect(merger,1,1);

  const delayL=ctx.createDelay(.05),delayR=ctx.createDelay(.05);
  const crossL=ctx.createGain(),crossR=ctx.createGain();
  delayL.delayTime.value=.012;delayR.delayTime.value=.012;
  crossL.gain.value=0;crossR.gain.value=0;
  splitter.connect(delayL,0);delayL.connect(crossL);crossL.connect(merger,0,1);
  splitter.connect(delayR,1);delayR.connect(crossR);crossR.connect(merger,0,0);

  const compressor=ctx.createDynamicsCompressor();
  const analyser=ctx.createAnalyser();
  analyser.fftSize=256;
  analyser.smoothingTimeConstant=.82;
  const master=ctx.createGain();
  master.gain.value=1;
  merger.connect(compressor);
  compressor.connect(analyser);
  analyser.connect(master);
  master.connect(ctx.destination);

  musicState.audioCtx=ctx;
  musicState.audioSource=source;
  musicState.filters=filters;
  musicState.splitter=splitter;
  musicState.merger=merger;
  musicState.crossL=crossL;
  musicState.crossR=crossR;
  musicState.delayL=delayL;
  musicState.delayR=delayR;
  musicState.compressor=compressor;
  musicState.analyser=analyser;
  musicState.master=master;
  applyMusicSoundSettings(false);
  await ctx.resume().catch(()=>{});
  return ctx;
}
function saveMusicSoundSettings(){
  localStorage.setItem('arc-music-eq',JSON.stringify(musicState.eq));
  localStorage.setItem('arc-music-spatial',String(musicState.spatial));
  localStorage.setItem('arc-music-normalize',musicState.normalize?'1':'0');
  localStorage.setItem('arc-music-motion',musicState.motion?'1':'0');
}
function applyMusicSoundSettings(save=true){
  musicState.filters.forEach((filter,index)=>{filter.gain.value=Number(musicState.eq[index]||0)});
  const width=Math.max(0,Math.min(1,Number(musicState.spatial||0)/100));
  if(musicState.crossL)musicState.crossL.gain.value=.22*width;
  if(musicState.crossR)musicState.crossR.gain.value=.22*width;
  if(musicState.delayL)musicState.delayL.delayTime.value=.008+.012*width;
  if(musicState.delayR)musicState.delayR.delayTime.value=.008+.012*width;
  if(musicState.compressor){
    if(musicState.normalize){
      musicState.compressor.threshold.value=-22;
      musicState.compressor.knee.value=18;
      musicState.compressor.ratio.value=3;
      musicState.compressor.attack.value=.006;
      musicState.compressor.release.value=.24;
    }else{
      musicState.compressor.threshold.value=0;
      musicState.compressor.knee.value=0;
      musicState.compressor.ratio.value=1;
    }
  }
  $$('#musicEq input[data-eq-band]').forEach((input,index)=>{input.value=String(musicState.eq[index]||0)});
  if($('#musicSpatial'))$('#musicSpatial').value=String(musicState.spatial||0);
  if($('#musicNormalize'))$('#musicNormalize').checked=!!musicState.normalize;
  if($('#musicMotion'))$('#musicMotion').checked=!!musicState.motion;
  $('#musicMotionArt')?.classList.toggle('motion-enabled',!!musicState.motion);
  if(save)saveMusicSoundSettings();
}
function applyMusicEqPreset(name){
  const preset=MUSIC_EQ_PRESETS[name]||MUSIC_EQ_PRESETS.flat;
  musicState.eq=preset.slice();
  $$('#musicEqPresets [data-eq-preset]').forEach(b=>b.classList.toggle('active',b.dataset.eqPreset===name));
  applyMusicSoundSettings(true);
}
function restoreMusicSoundSettings(){
  try{
    const eq=JSON.parse(localStorage.getItem('arc-music-eq')||'null');
    if(Array.isArray(eq)&&eq.length===6)musicState.eq=eq.map(v=>Math.max(-12,Math.min(12,Number(v)||0)));
  }catch(_){}
  musicState.spatial=Math.max(0,Math.min(100,Number(localStorage.getItem('arc-music-spatial')||0)));
  musicState.normalize=localStorage.getItem('arc-music-normalize')==='1';
  musicState.motion=localStorage.getItem('arc-music-motion')!=='0';
  applyMusicSoundSettings(false);
}
function updateMusicNowCard(){
  const track=musicState.current;
  const card=$('#musicNowCard');
  if(!track||!card)return;
  card.hidden=false;
  const art=musicThumb(track);
  $('#musicNowArt').src=art;
  $('#musicNowArtBlur').src=art;
  $('#musicNowTitle').textContent=track.title||'Untitled';
  $('#musicNowArtist').textContent=track.artist||'Unknown artist';
  $('#musicNowAlbum').textContent=track.album||'Single';
  $('#musicMotionArt')?.classList.toggle('motion-enabled',!!musicState.motion);
}
function updateMusicSession(track){
  if(!('mediaSession' in navigator)||!track)return;
  try{
    navigator.mediaSession.metadata=new MediaMetadata({
      title:track.title||'Untitled',
      artist:track.artist||'Unknown artist',
      album:track.album||'Arc Music',
      artwork:[{src:musicThumb(track),sizes:'544x544',type:'image/jpeg'}]
    });
    navigator.mediaSession.playbackState=musicState.playing?'playing':'paused';
  }catch(_){}
}
function updateMusicPlayer(){
  const track=musicState.current,player=$('#musicPlayer');
  if(!track||!player)return;
  player.hidden=false;
  document.body.classList.add('music-playing');
  $('#musicPlayerTitle').textContent=track.title||'Untitled';
  $('#musicPlayerArtist').textContent=track.artist||'Unknown artist';
  $('#musicPlayerArt').src=musicThumb(track);
  $('#musicPlayPath')?.setAttribute('d',musicState.playing?'M7 5h4v14H7zM13 5h4v14h-4z':'m8 5 11 7-11 7z');
  $('#musicPlay')?.setAttribute('aria-label',musicState.playing?'Pause':'Play');
  $('#musicShuffle')?.classList.toggle('active',musicState.shuffle);
  $('#musicRepeat')?.classList.toggle('active',musicState.repeat);
  $$('.music-track').forEach((row,i)=>row.classList.toggle('active',musicState.queue[i]?.id===track.id));
  updateMusicNowCard();
  updateMusicEngineUI();
  updateMusicSession(track);
}
function renderMusicTopResult(){
  const top=$('#musicTopResult'),track=musicState.results[0];
  if(!top)return;
  top.innerHTML='';
  if(!track){top.hidden=true;return}
  top.hidden=false;
  const label=document.createElement('div');
  label.className='music-top-result-label';
  label.textContent='Top result';
  const card=document.createElement('button');
  card.type='button';card.className='music-top-result-card';
  const img=document.createElement('img');img.alt='';img.src=musicThumb(track);
  const copy=document.createElement('div');
  const title=document.createElement('b');title.textContent=track.title;
  const meta=document.createElement('span');meta.textContent=track.artist+' · '+(track.album||'Song');
  const play=document.createElement('span');play.className='music-top-play';play.setAttribute('aria-hidden','true');play.textContent='▶';
  copy.append(title,meta);card.append(img,copy,play);card.onclick=()=>playMusicTrack(0);top.append(label,card);
}
function renderMusicResults(){
  const host=$('#musicResults'),songs=$('#musicSongsHead'),title=$('#musicResultsTitle');
  if(!host)return;
  host.innerHTML='';
  if(songs)songs.hidden=!musicState.results.length;
  if(title)title.textContent=musicState.query?'Results for “'+musicState.query+'”':'Results';
  renderMusicTopResult();
  musicState.results.forEach((track,index)=>{
    const row=document.createElement('button');
    row.type='button';
    row.className='music-track'+(musicState.current?.id===track.id?' active':'');
    row.setAttribute('role','listitem');
    row.setAttribute('aria-label','Play '+track.title+' by '+track.artist);
    const num=document.createElement('span');num.className='music-track-index';num.textContent=String(index+1);
    const art=document.createElement('span');art.className='music-track-art';
    const img=document.createElement('img');img.loading='lazy';img.decoding='async';img.alt='';img.src=musicThumb(track);art.append(img);
    const copy=document.createElement('span');copy.className='music-track-copy';
    const name=document.createElement('b');name.textContent=track.title;
    const artist=document.createElement('small');artist.textContent=track.artist;copy.append(name,artist);
    const album=document.createElement('span');album.className='music-track-album';album.textContent=track.album||'Single';
    const time=document.createElement('span');time.className='music-track-time';time.textContent=track.timestamp||musicTime(track.duration);
    row.append(num,art,copy,album,time);
    row.onclick=()=>playMusicTrack(index);
    host.append(row);
  });
}
async function searchMusic(query){
  const q=String(query||'').trim();
  if(!q)return;
  setMusicTab('search');
  musicState.searchController?.abort();
  const controller=new AbortController();
  musicState.searchController=controller;
  musicState.query=q;
  const input=$('#musicSearchInput');
  if(input&&input.value!==q)input.value=q;
  musicSetStatus('Searching…');
  const started=performance.now();
  try{
    const res=await fetch(MUSIC_API+'/music/v1/search?q='+encodeURIComponent(q)+'&limit=24',{cache:'no-store',signal:controller.signal});
    if(!res.ok)throw new Error('Search failed');
    const data=await res.json();
    musicState.results=Array.isArray(data.results)?data.results:[];
    musicState.queue=musicState.results.slice();
    renderMusicResults();
    musicSetStatus(musicState.results.length+' songs · '+Math.max(1,Math.round(performance.now()-started))+' ms');
  }catch(err){
    if(err?.name==='AbortError')return;
    musicState.results=[];
    renderMusicResults();
    musicSetStatus('Search unavailable');
  }finally{
    if(musicState.searchController===controller)musicState.searchController=null;
  }
}
async function loadMusicHomeShelf(){
  if(musicState.homeLoaded)return;
  musicState.homeLoaded=true;
  const host=$('#musicHomeShelf');
  if(!host)return;
  host.innerHTML='<div class="music-home-loading">Loading music…</div>';
  try{
    const res=await fetch(MUSIC_API+'/music/v1/search?q='+encodeURIComponent('top songs 2026')+'&limit=10',{cache:'force-cache'});
    if(!res.ok)throw new Error('home music failed');
    const data=await res.json();
    musicState.homeTracks=Array.isArray(data.results)?data.results.slice(0,10):[];
    host.innerHTML='';
    musicState.homeTracks.forEach((track,index)=>{
      const card=document.createElement('button');
      card.type='button';
      card.className='music-artwork-card';
      const img=document.createElement('img');img.loading='lazy';img.decoding='async';img.alt='';img.src=musicThumb(track);
      const title=document.createElement('b');title.textContent=track.title;
      const meta=document.createElement('span');meta.textContent=track.artist;
      card.append(img,title,meta);
      card.onclick=()=>{
        musicState.queue=musicState.homeTracks.slice();
        musicState.results=musicState.homeTracks.slice();
        playMusicTrack(index);
      };
      host.append(card);
    });
  }catch(_){
    host.innerHTML='<div class="music-home-loading">Music recommendations unavailable.</div>';
  }
}
function openMusicDrawer(kind){
  const lyrics=$('#musicLyricsPanel'),sound=$('#musicSoundPanel'),backdrop=$('#musicDrawerBackdrop');
  if(!lyrics||!sound||!backdrop)return;
  const showLyrics=kind==='lyrics';
  lyrics.hidden=!showLyrics;
  sound.hidden=showLyrics;
  backdrop.hidden=false;
  document.body.classList.add('music-drawer-open');
  if(showLyrics&&musicState.current)loadMusicLyrics(musicState.current);
}
function closeMusicDrawers(){
  $('#musicLyricsPanel')?.setAttribute('hidden','');
  $('#musicSoundPanel')?.setAttribute('hidden','');
  $('#musicDrawerBackdrop')?.setAttribute('hidden','');
  document.body.classList.remove('music-drawer-open');
}
async function loadMusicLyrics(track){
  if(!track)return;
  $('#musicLyricsTitle').textContent='Lyrics';
  $('#musicLyricsTrack').textContent=track.title||'Untitled';
  $('#musicLyricsArtist').textContent=track.artist||'Unknown artist';
  $('#musicLyricsArt').src=musicThumb(track);
  const body=$('#musicLyricsBody');
  if(!body)return;
  const cached=musicState.lyricsCache.get(track.id);
  if(cached){renderMusicLyricsLines(cached);return}
  body.innerHTML='<p class="music-lyrics-loading">Loading lyrics…</p>';
  try{
    const res=await fetch(MUSIC_API+'/music/v1/lyrics/'+encodeURIComponent(track.id),{cache:'force-cache'});
    const data=await res.json();
    const lines=Array.isArray(data.lines)?data.lines:[];
    musicState.lyricsCache.set(track.id,lines);
    renderMusicLyricsLines(lines);
  }catch(_){
    renderMusicLyricsLines([]);
  }
}
function renderMusicLyricsLines(lines){
  const body=$('#musicLyricsBody');
  if(!body)return;
  body.innerHTML='';
  if(!lines.length){
    const p=document.createElement('p');
    p.className='music-lyrics-empty';
    p.textContent='Lyrics are not available for this song.';
    body.append(p);
    return;
  }
  lines.forEach(line=>{
    const p=document.createElement('p');
    p.textContent=line;
    body.append(p);
  });
}
function currentMusicDuration(){
  const audio=$('#musicAudio');
  if(musicState.mode==='direct'||musicState.mode==='direct-loading'){
    return Number.isFinite(audio?.duration)?audio.duration:Number(musicState.current?.duration||0);
  }
  try{return Number(musicState.player?.getDuration?.())||Number(musicState.current?.duration||0)}catch(_){return Number(musicState.current?.duration||0)}
}
function currentMusicTime(){
  const audio=$('#musicAudio');
  if(musicState.mode==='direct'||musicState.mode==='direct-loading'){
    return Number.isFinite(audio?.currentTime)?audio.currentTime:0;
  }
  try{return Number(musicState.player?.getCurrentTime?.())||0}catch(_){return 0}
}
function updateMusicTimeline(){
  const range=$('#musicProgress');
  if(!range)return;
  const duration=currentMusicDuration();
  const current=currentMusicTime();
  range.value=duration>0?String(Math.round(current/duration*1000)):'0';
  $('#musicCurrentTime').textContent=musicTime(current);
  $('#musicDuration').textContent=musicTime(duration);
}
function startMusicClock(){
  stopMusicClock();
  musicState.timer=setInterval(updateMusicTimeline,400);
  updateMusicTimeline();
  startMusicVisualizer();
}
function stopMusicClock(){
  if(musicState.timer)clearInterval(musicState.timer);
  musicState.timer=null;
  updateMusicTimeline();
}
function startMusicVisualizer(){
  if(musicState.vizRaf)return;
  const loop=()=>{
    musicState.vizRaf=requestAnimationFrame(loop);
    const wrap=$('#musicMotionArt'),canvas=$('#musicVisualizer');
    if(!wrap||!canvas||!musicState.motion)return;
    let pulse=.16;
    if(musicState.mode==='direct'&&musicState.analyser){
      const bins=new Uint8Array(musicState.analyser.frequencyBinCount);
      musicState.analyser.getByteFrequencyData(bins);
      let bass=0,count=Math.min(16,bins.length);
      for(let i=0;i<count;i++)bass+=bins[i];
      pulse=.08+(bass/Math.max(1,count)/255)*.32;
      const rect=canvas.getBoundingClientRect();
      const dpr=Math.min(2,window.devicePixelRatio||1);
      const width=Math.max(1,Math.round(rect.width*dpr)),height=Math.max(1,Math.round(rect.height*dpr));
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}
      const ctx=canvas.getContext('2d');
      if(ctx){
        ctx.clearRect(0,0,width,height);
        const bars=32,step=Math.max(1,Math.floor(bins.length/bars)),barW=width/bars;
        ctx.fillStyle='rgba(255,255,255,.16)';
        for(let i=0;i<bars;i++){
          const value=bins[Math.min(bins.length-1,i*step)]/255;
          const h=Math.max(1,value*height*.22);
          ctx.fillRect(i*barW,height-h,Math.max(1,barW-2*dpr),h);
        }
      }
    }
    wrap.style.setProperty('--music-pulse',String(pulse));
  };
  musicState.vizRaf=requestAnimationFrame(loop);
}
async function useYoutubeFallback(track,token){
  if(token!==musicState.playToken)return;
  const audio=$('#musicAudio');
  try{audio?.pause();if(audio){audio.removeAttribute('src');audio.load()}}catch(_){}
  musicState.mode='youtube';
  musicState.playing=false;
  updateMusicEngineUI();
  musicSetStatus('Using fallback player…');
  try{
    const player=await ensureMusicPlayer();
    if(token!==musicState.playToken)return;
    player.loadVideoById(track.id);
  }catch(_){
    musicSetStatus('Playback unavailable');
  }
}
async function tryDirectMusic(track,token){
  const audio=$('#musicAudio');
  if(!audio)return useYoutubeFallback(track,token);
  musicState.mode='direct-loading';
  updateMusicEngineUI();
  await ensureMusicAudioGraph().catch(()=>null);
  if(token!==musicState.playToken)return;
  try{musicState.player?.stopVideo?.()}catch(_){}
  audio.src=MUSIC_API+'/music/v1/audio/'+encodeURIComponent(track.id);
  audio.currentTime=0;
  const timeout=setTimeout(()=>{
    if(token===musicState.playToken&&musicState.mode==='direct-loading')useYoutubeFallback(track,token);
  },5500);
  const onPlaying=()=>{
    if(token!==musicState.playToken)return;
    clearTimeout(timeout);
    musicState.mode='direct';
    musicState.playing=true;
    musicSetStatus('Playing');
    updateMusicEngineUI();
    updateMusicPlayer();
    startMusicClock();
  };
  audio.addEventListener('playing',onPlaying,{once:true});
  try{
    await audio.play();
  }catch(_){
    clearTimeout(timeout);
    if(token===musicState.playToken&&musicState.mode==='direct-loading')useYoutubeFallback(track,token);
  }
}
async function playMusicTrack(index){
  const track=musicState.queue[index];
  if(!track)return;
  const token=++musicState.playToken;
  musicState.index=index;
  musicState.current=track;
  musicState.playing=false;
  updateMusicPlayer();
  renderMusicResults();
  if(!$('#musicLyricsPanel')?.hidden)loadMusicLyrics(track);

  if(musicState.directAvailable){
    musicState.mode='direct-loading';
    musicSetStatus('Preparing enhanced audio…');
    updateMusicEngineUI();
    tryDirectMusic(track,token);
  }else{
    musicState.mode='youtube';
    musicSetStatus('Loading…');
    updateMusicEngineUI();
    useYoutubeFallback(track,token);
  }
}
function stepMusic(delta){
  if(!musicState.queue.length)return;
  let next;
  if(musicState.shuffle&&musicState.queue.length>1){
    do{next=Math.floor(Math.random()*musicState.queue.length)}while(next===musicState.index);
  }else{
    next=musicState.index+delta;
    if(next<0)next=musicState.queue.length-1;
    if(next>=musicState.queue.length)next=0;
  }
  playMusicTrack(next);
}
function musicPlay(){
  if(!musicState.current)return;
  if(musicState.mode==='direct'){
    $('#musicAudio')?.play().catch(()=>useYoutubeFallback(musicState.current,musicState.playToken));
  }else{
    musicState.player?.playVideo?.();
  }
}
function musicPause(){
  if(musicState.mode==='direct')$('#musicAudio')?.pause();
  else musicState.player?.pauseVideo?.();
}
function musicSeek(seconds){
  const duration=currentMusicDuration();
  const target=Math.max(0,Math.min(Number(seconds)||0,duration||Infinity));
  if(musicState.mode==='direct'){
    if($('#musicAudio'))$('#musicAudio').currentTime=target;
  }else{
    try{musicState.player?.seekTo(target,true)}catch(_){}
  }
}
function setupMusic(){
  if(musicState.initialized)return;
  musicState.initialized=true;
  const form=$('#musicSearchForm'),input=$('#musicSearchInput'),volume=$('#musicVolume'),audio=$('#musicAudio');
  restoreMusicSoundSettings();
  ensureMusicPlayer().catch(()=>{});
  loadMusicCapabilities();
  loadMusicHomeShelf();

  form?.addEventListener('submit',e=>{e.preventDefault();searchMusic(input?.value||'')});
  input?.addEventListener('focus',()=>setMusicTab('search'));
  $$('[data-music-query]').forEach(b=>b.addEventListener('click',()=>searchMusic(b.dataset.musicQuery||'')));
  $$('[data-music-tab]').forEach(b=>b.addEventListener('click',()=>setMusicTab(b.dataset.musicTab)));

  $('#musicPlay')?.addEventListener('click',()=>{if(musicState.playing)musicPause();else musicPlay()});
  $('#musicPrev')?.addEventListener('click',()=>stepMusic(-1));
  $('#musicNext')?.addEventListener('click',()=>stepMusic(1));
  $('#musicShuffle')?.addEventListener('click',()=>{musicState.shuffle=!musicState.shuffle;updateMusicPlayer()});
  $('#musicRepeat')?.addEventListener('click',()=>{musicState.repeat=!musicState.repeat;updateMusicPlayer()});
  $('#musicProgress')?.addEventListener('input',e=>{const d=currentMusicDuration();if(d>0)musicSeek(Number(e.target.value)/1000*d)});

  const savedVolume=Math.max(0,Math.min(100,Number(localStorage.getItem('arc-music-volume')||90)));
  if(volume)volume.value=String(savedVolume);
  if(audio)audio.volume=savedVolume/100;
  volume?.addEventListener('input',e=>{
    const v=Math.max(0,Math.min(100,Number(e.target.value)||0));
    localStorage.setItem('arc-music-volume',String(v));
    if(audio)audio.volume=v/100;
    try{musicState.player?.setVolume(v)}catch(_){}
  });

  audio?.addEventListener('playing',()=>{
    if(musicState.mode!=='direct'&&musicState.mode!=='direct-loading')return;
    musicState.mode='direct';
    musicState.playing=true;
    updateMusicEngineUI();
    updateMusicPlayer();
    startMusicClock();
  });
  audio?.addEventListener('pause',()=>{
    if(musicState.mode!=='direct')return;
    musicState.playing=false;
    stopMusicClock();
    updateMusicPlayer();
  });
  audio?.addEventListener('waiting',()=>{if(musicState.mode==='direct')musicSetStatus('Buffering…')});
  audio?.addEventListener('ended',()=>{if(musicState.mode==='direct'){musicState.playing=false;stopMusicClock();if(musicState.repeat)playMusicTrack(musicState.index);else stepMusic(1)}});
  audio?.addEventListener('error',()=>{
    if((musicState.mode==='direct'||musicState.mode==='direct-loading')&&musicState.current)useYoutubeFallback(musicState.current,musicState.playToken);
  });

  $('#musicLyricsButton')?.addEventListener('click',()=>openMusicDrawer('lyrics'));
  $('#musicSoundButton')?.addEventListener('click',()=>openMusicDrawer('sound'));
  $('#musicNowLyrics')?.addEventListener('click',()=>openMusicDrawer('lyrics'));
  $('#musicNowSound')?.addEventListener('click',()=>openMusicDrawer('sound'));
  $('#musicArtworkButton')?.addEventListener('click',()=>{
    setMusicTab('home');
    $('#musicNowCard')?.scrollIntoView({behavior:'smooth',block:'center'});
  });
  $('#musicDrawerBackdrop')?.addEventListener('click',closeMusicDrawers);
  $$('[data-close-music-drawer]').forEach(b=>b.addEventListener('click',closeMusicDrawers));

  $$('#musicEqPresets [data-eq-preset]').forEach(b=>b.addEventListener('click',()=>applyMusicEqPreset(b.dataset.eqPreset)));
  $$('#musicEq input[data-eq-band]').forEach((input,index)=>input.addEventListener('input',()=>{
    musicState.eq[index]=Number(input.value)||0;
    $$('#musicEqPresets [data-eq-preset]').forEach(b=>b.classList.remove('active'));
    applyMusicSoundSettings(true);
  }));
  $('#musicSpatial')?.addEventListener('input',e=>{musicState.spatial=Number(e.target.value)||0;applyMusicSoundSettings(true)});
  $('#musicNormalize')?.addEventListener('change',e=>{musicState.normalize=!!e.target.checked;applyMusicSoundSettings(true)});
  $('#musicMotion')?.addEventListener('change',e=>{musicState.motion=!!e.target.checked;applyMusicSoundSettings(true);if(musicState.motion)startMusicVisualizer()});

  if('mediaSession' in navigator){
    const actions={
      play:musicPlay,
      pause:musicPause,
      previoustrack:()=>stepMusic(-1),
      nexttrack:()=>stepMusic(1),
      seekbackward:d=>musicSeek(currentMusicTime()-(d.seekOffset||10)),
      seekforward:d=>musicSeek(currentMusicTime()+(d.seekOffset||10)),
      seekto:d=>{if(Number.isFinite(d.seekTime))musicSeek(d.seekTime)}
    };
    Object.entries(actions).forEach(([name,handler])=>{try{navigator.mediaSession.setActionHandler(name,handler)}catch(_){}});
  }
}

async function wallpaperUrl(name){
  if(wallpaperState.urls.has(name))return wallpaperState.urls.get(name);
  const def=WALLPAPER_THEMES[name];
  if(!def)return null;
  if(def.url){
    wallpaperState.urls.set(name,def.url);
    return def.url;
  }
  const file=def.file||def.fallback;
  if(!file)return null;
  const res=await fetch(file,{cache:'force-cache'});
  if(!res.ok)throw new Error('wallpaper request failed');
  const encoded=(await res.text()).trim();
  const raw=atob(encoded);
  const bytes=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  const url=URL.createObjectURL(new Blob([bytes],{type:'video/mp4'}));
  wallpaperState.urls.set(name,url);
  return url;
}
function syncWallpaperPlayback(){
  const video=$('#themeWallpaper');
  if(!video||video.hidden)return;
  if(document.body.classList.contains('reduce-motion'))video.pause();
  else video.play().catch(()=>{});
}
async function applyWallpaperTheme(name){
  const video=$('#themeWallpaper');
  if(!video)return;
  const def=WALLPAPER_THEMES[name];
  const token=++wallpaperState.token;
  document.body.classList.remove('wallpaper-static');
  document.body.style.removeProperty('--wallpaper-image');
  if(!def){
    video.pause();
    video.hidden=true;
    video.style.opacity='0';
    video.removeAttribute('src');
    video.load();
    document.body.style.removeProperty('--wallpaper-dim');
    return;
  }
  document.body.style.setProperty('--wallpaper-dim',String(def.dim||.58));
  if(def.imageB64){
    video.pause();
    video.hidden=true;
    video.style.opacity='0';
    video.removeAttribute('src');
    video.load();
    try{
      const res=await fetch(def.imageB64,{cache:'force-cache'});
      if(!res.ok)throw new Error('wallpaper request failed');
      const encoded=(await res.text()).trim();
      if(token!==wallpaperState.token||document.body.dataset.theme!==name)return;
      document.body.classList.add('wallpaper-static');
      document.body.style.setProperty('--wallpaper-image',`url("data:image/jpeg;base64,${encoded}")`);
    }catch(err){
      console.error('Wallpaper failed to load',err);
    }
    return;
  }
  try{
    const url=await wallpaperUrl(name);
    if(token!==wallpaperState.token||document.body.dataset.theme!==name)return;
    video.hidden=false;
    video.style.opacity='0';
    const fail=()=>{
      if(token!==wallpaperState.token)return;
      video.pause();
      video.hidden=true;
      video.style.opacity='0';
      console.warn('Wallpaper source unavailable:',name);
    };
    video.addEventListener('error',fail,{once:true});
    if(video.src!==url){
      video.src=url;
      video.load();
    }
    const reveal=()=>{
      if(token!==wallpaperState.token)return;
      video.style.opacity='1';
      syncWallpaperPlayback();
    };
    if(video.readyState>=2)reveal();
    else video.addEventListener('loadeddata',reveal,{once:true});
  }catch(err){
    console.error('Wallpaper failed to load',err);
    video.hidden=true;
    video.style.opacity='0';
  }
}
function setupThemes(){
  const saved=localStorage.getItem('arc-theme')||'arc';
  setTheme(saved);
  $$('.theme-option').forEach(b=>b.addEventListener('click',()=>setTheme(b.dataset.theme)));
  const compact=$('#compactToggle'),motion=$('#motionToggle');
  if(compact){
    compact.checked=localStorage.getItem('arc-compact')==='1';
    document.body.classList.toggle('compact',compact.checked);
    compact.addEventListener('change',()=>{
      document.body.classList.toggle('compact',compact.checked);
      localStorage.setItem('arc-compact',compact.checked?'1':'0');
    });
  }
  if(motion){
    motion.checked=localStorage.getItem('arc-motion')==='1';
    document.body.classList.toggle('reduce-motion',motion.checked);
    motion.addEventListener('change',()=>{
      document.body.classList.toggle('reduce-motion',motion.checked);
      localStorage.setItem('arc-motion',motion.checked?'1':'0');
      syncWallpaperPlayback();
    });
  }
}
function setTheme(name){
  const valid=$$('.theme-option[data-theme]').some(b=>b.dataset.theme===name)?name:'arc';
  document.body.classList.remove('theme-mono','theme-midnight');
  document.body.dataset.theme=valid;
  const wallpaper=!!WALLPAPER_THEMES[valid];
  document.body.classList.toggle('wallpaper-theme',wallpaper);
  $$('.theme-option').forEach(b=>b.classList.toggle('selected',b.dataset.theme===valid));
  localStorage.setItem('arc-theme',valid);
  applyWallpaperTheme(valid);
}
setupNavigation();setupSearch();setupThemes();setupWeb();setupCloud();setupMedia();renderFeatured();startHomeHero();
window.addEventListener('pointerdown',armHomeHero,{once:true,passive:true});
window.addEventListener('keydown',armHomeHero,{once:true});
