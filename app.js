const GAME_DATA='games-catalog.json';
const HOME_GAMES=[{"id":1,"name":"Bendy and the Ink Machine","gameUrl":"Games/BATIM/index.html","imageUrl":"Game Artwork/batim.png","featured":true,"porter":"crackers & slqnt"},{"id":2,"name":"MiSide","gameUrl":"Games/miside/miside.html","imageUrl":"Game Artwork/miside.jpg","featured":true,"porter":"crackers"},{"id":5,"name":"Cuphead","gameUrl":"Games/cuphead/index.html","imageUrl":"Game Artwork/cuphead.png","featured":true,"porter":"crackers"},{"id":8,"name":"One Shot: World Machine Edition","gameUrl":"Games/oneshot-wme/index.html","imageUrl":"Game Artwork/oneshot.jpg","featured":true,"porter":"shayder"},{"id":10,"name":"Stardew Valley","gameUrl":"Games/stardewvalley/index.html","imageUrl":"Game Artwork/star.jpg","featured":true,"porter":"cirsius"},{"id":16,"name":"Azahar","gameUrl":"Games/Azahar/index.html","imageUrl":"Game Artwork/aza.png","featured":true,"porter":"sexyplankton"},{"id":19,"name":"Inscryption","gameUrl":"Games/inscryption/index.html","imageUrl":"Game Artwork/insc.png","featured":true,"porter":"reeyuki"},{"id":20,"name":"Lobotomy Corporation","gameUrl":"Games/lob-corp/index.html","imageUrl":"Game Artwork/lob-corp.png","featured":true,"porter":"reeyuki"},{"id":25,"name":"Trombone Champ","gameUrl":"Games/tchamp/index.html","imageUrl":"Game Artwork/tchamp/img.png","featured":true,"porter":"gurtmuncher"},{"id":26,"name":"Granny 3","gameUrl":"Games/granny/granny3.html","imageUrl":"Game Artwork/granny3.png","featured":true,"porter":"crax"},{"id":27,"name":"PEAK","gameUrl":"Games/peak/PEAK.html","imageUrl":"Game Artwork/peak.png","featured":true,"porter":"dasher"},{"id":28,"name":"Among Us","gameUrl":"Games/amongus/index.html","imageUrl":"Game Artwork/amongus.webp","featured":true,"porter":"(click for more info)"}];
const STASH_BASE='https://raw.githack.com/lauraevan/Game-Stash/main/';
const STASH_RAW='https://raw.githubusercontent.com/lauraevan/Game-Stash/main/';
const CLOUD_API='https://stratus-api-ceav.onrender.com';
const MEDIA_API=CLOUD_API;
const MEDIA_PLAYER_ORIGIN='https://arc-media.onrender.com';
const MUSIC_API=CLOUD_API;
const MANGA_API=CLOUD_API;
const SCRAMJET_ORIGIN='https://scramjet-v2-prod.onrender.com';
const state={games:[],homeGames:HOME_GAMES.slice(),filtered:[],visible:60,view:'home',heroItems:[],heroIndex:0,heroTimer:null,heroArmed:false,featuredTimer:null,featuredRaf:null,libraryLoaded:false,libraryLoading:null};
const cloudState={games:[],filtered:[],tag:'All',featured:null,token:null,tokenExpires:0,loading:false,active:null,pingTimer:null};
const webState={target:null,proxyUrl:null};
const mediaState={loaded:false,loading:false,home:null,featured:null,query:'',hlsPromise:null,heroVideoToken:0};
const mangaState={loaded:false,loading:false,initialized:false,home:null,query:'',featured:null,current:null,chapters:[],reader:null,retry:0};
const musicState={query:'',results:[],queue:[],index:-1,current:null,searchController:null,initialized:false,tab:'home',player:null,playerReady:null,ytPlayerReady:null,playerUsable:false,playing:false,shuffle:false,repeat:false,timer:null,mode:'idle',playToken:0,directAvailable:false,capabilitiesLoaded:false,audioCtx:null,audioSource:null,filters:[],splitter:null,merger:null,crossL:null,crossR:null,delayL:null,delayR:null,compressor:null,analyser:null,master:null,eq:[0,0,0,0,0,0],spatial:0,normalize:false,motion:true,lyricsCache:new Map(),lyricsData:null,activeLyric:-1,homeTracks:[],homeMade:[],homeLoaded:false,vizRaf:0};
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
  clearInterval(state.featuredTimer);
  cancelAnimationFrame(state.featuredRaf);
  try{state.featuredAnimation?.cancel()}catch(_){}
  state.featuredAnimation=null;
  try{state.featuredResizeObserver?.disconnect()}catch(_){}
  state.featuredResizeObserver=null;
  row.innerHTML='';

  const source=state.homeGames.length?state.homeGames:state.games;
  const featured=source.filter(g=>g.featured).slice(0,12);
  const items=(featured.length?featured:source.slice(0,12));
  if(!items.length)return;

  const track=document.createElement('div');
  track.className='featured-carousel-track';
  track.dataset.originalCount=String(items.length);
  items.forEach(g=>track.append(gameCard(g)));
  items.forEach(g=>{
    const duplicate=gameCard(g);
    duplicate.classList.add('carousel-clone');
    duplicate.setAttribute('aria-hidden','true');
    duplicate.tabIndex=-1;
    track.append(duplicate);
  });
  row.append(track);
  startFeaturedAutoScroll();
}
function startFeaturedAutoScroll(){
  const row=$('#featuredGames');
  const track=row?.querySelector('.featured-carousel-track');
  if(!row||!track||track.children.length<4)return;

  const pause=()=>{
    row.dataset.autoPaused='1';
    try{state.featuredAnimation?.pause()}catch(_){}
  };
  const resume=()=>{
    row.dataset.autoPaused='0';
    if(state.view==='home'&&!document.hidden&&!document.body.classList.contains('reduce-motion')){
      try{state.featuredAnimation?.play()}catch(_){}
    }
  };

  if(!row.dataset.carouselBound){
    row.dataset.carouselBound='1';
    row.dataset.autoPaused='0';
    row.addEventListener('pointerenter',pause);
    row.addEventListener('pointerleave',resume);
    row.addEventListener('focusin',pause);
    row.addEventListener('focusout',resume);
    row.addEventListener('touchstart',pause,{passive:true});
    row.addEventListener('touchend',()=>{
      clearTimeout(row._arcResumeTimer);
      row._arcResumeTimer=setTimeout(resume,1100);
    },{passive:true});
    document.addEventListener('visibilitychange',()=>document.hidden?pause():resume());
  }

  const buildAnimation=()=>{
    try{state.featuredAnimation?.cancel()}catch(_){}
    state.featuredAnimation=null;
    track.style.transform='translate3d(0,0,0)';
    const count=Number(track.dataset.originalCount)||0;
    const first=track.children[0];
    const twin=track.children[count];
    if(!first||!twin)return;
    const distance=Math.max(1,twin.offsetLeft-first.offsetLeft);
    const speed=21;
    const duration=Math.max(18000,Math.round(distance/speed*1000));
    if(document.body.classList.contains('reduce-motion'))return;
    const animation=track.animate(
      [
        {transform:'translate3d(0,0,0)'},
        {transform:`translate3d(-${distance}px,0,0)`}
      ],
      {duration,iterations:Infinity,easing:'linear'}
    );
    state.featuredAnimation=animation;
    if(row.dataset.autoPaused==='1'||state.view!=='home'||document.hidden)animation.pause();
  };

  requestAnimationFrame(()=>requestAnimationFrame(buildAnimation));
  if('ResizeObserver' in window){
    let resizeTimer=null;
    state.featuredResizeObserver=new ResizeObserver(()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(buildAnimation,140);
    });
    state.featuredResizeObserver.observe(row);
  }
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
  if(name==='manga')setupManga();
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
function mediaPoster(item,size='w500'){
  return item?.poster_path?`https://image.tmdb.org/t/p/${size}${item.poster_path}`:'';
}
function mediaBackdrop(item,size='original'){
  return item?.backdrop_path?`https://image.tmdb.org/t/p/${size}${item.backdrop_path}`:mediaPoster(item,'w780');
}
function mediaRating(item){
  const rating=Number(item?.vote_average||0);
  return rating>0?rating.toFixed(1):'';
}
function mediaGenreNames(item){
  return (item?.genres||[]).map(g=>g?.name).filter(Boolean).slice(0,3);
}
function mediaTrailer(item){
  const videos=Array.isArray(item?.videos?.results)?item.videos.results:[];
  const supported=videos.filter(video=>{
    const site=String(video?.site||'').toLowerCase();
    return video?.key&&(site==='vimeo'||site==='dailymotion');
  });
  const score=video=>{
    let value=0;
    if(video.official)value+=10;
    if(video.type==='Trailer')value+=8;
    else if(video.type==='Teaser')value+=5;
    if(video.iso_639_1==='en')value+=2;
    return value;
  };
  return supported.slice().sort((a,b)=>score(b)-score(a))[0]||null;
}
function mediaAutoplayUrl(video){
  if(!video?.key)return '';
  const site=String(video.site||'').toLowerCase();
  if(site==='vimeo'){
    return `https://player.vimeo.com/video/${encodeURIComponent(video.key)}?background=1&autoplay=1&muted=1&loop=1&title=0&byline=0&portrait=0&controls=0`;
  }
  if(site==='dailymotion'){
    return `https://www.dailymotion.com/embed/video/${encodeURIComponent(video.key)}?autoplay=1&mute=1&loop=1&controls=0&queue-enable=false&sharing-enable=false`;
  }
  return '';
}
function mountMediaAutoplay(host,video){
  if(!host)return false;
  host.innerHTML='';
  const src=mediaAutoplayUrl(video);
  if(!src){
    host.hidden=true;
    return false;
  }
  const frame=document.createElement('iframe');
  frame.src=src;
  frame.allow='autoplay; fullscreen; picture-in-picture';
  frame.referrerPolicy='strict-origin-when-cross-origin';
  frame.tabIndex=-1;
  frame.setAttribute('aria-hidden','true');
  host.append(frame);
  host.hidden=false;
  return true;
}
async function hydrateMediaHeroVideo(item){
  const token=++mediaState.heroVideoToken;
  const host=$('#mediaHeroVideo');
  if(host){host.innerHTML='';host.hidden=true}
  if(!item?.id)return;
  try{
    const type=mediaType(item);
    const res=await fetch(`${MEDIA_API}/media/v1/details/${type}/${item.id}`,{cache:'force-cache'});
    const details=await res.json().catch(()=>({}));
    if(token!==mediaState.heroVideoToken)return;
    mountMediaAutoplay(host,mediaTrailer(details));
  }catch{}
}
function mediaCard(item,forcedType='',layout='poster'){
  const type=mediaType(item,forcedType);
  const card=document.createElement('button');
  card.type='button';
  card.className='media-card '+(layout==='landscape'?'media-card-landscape':'media-card-poster');
  card.setAttribute('aria-label','Open '+mediaTitle(item));
  const image=layout==='landscape'?mediaBackdrop(item,'w780'):mediaPoster(item,'w500');
  const rating=mediaRating(item);
  card.innerHTML=`
    <div class="media-card-art">
      ${image?`<img loading="lazy" decoding="async" alt="" src="${image}">`:'<div class="media-poster-fallback">ARC</div>'}
      <div class="media-card-overlay">
        <span class="media-card-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m9 6 9 6-9 6z"/></svg></span>
      </div>
      ${rating?`<span class="media-rating-badge">★ ${rating}</span>`:''}
    </div>
    <div class="media-card-copy"><b></b><span></span></div>`;
  $('.media-card-copy b',card).textContent=mediaTitle(item);
  $('.media-card-copy span',card).textContent=[type==='tv'?'Series':'Movie',mediaYear(item)].filter(Boolean).join(' · ');
  card.onclick=()=>openMediaDetails(type,item.id);
  return card;
}
function renderMediaRow(id,items,forcedType='',layout='poster'){
  const host=$(id);if(!host)return;
  host.innerHTML='';
  (items||[])
    .filter(x=>x?.id&&(forcedType||['movie','tv'].includes(x.media_type)))
    .slice(0,20)
    .forEach(item=>host.append(mediaCard(item,forcedType,layout)));
  if(!host.children.length)host.innerHTML='<div class="media-empty">Nothing to show right now.</div>';
}
function renderMediaHero(item){
  mediaState.featured=item;
  const bg=$('#mediaHeroBg'),title=$('#mediaHeroTitle'),text=$('#mediaHeroText'),meta=$('#mediaHeroMeta'),button=$('#mediaHeroPlay'),label=$('#mediaHeroLabel');
  if(!item)return;
  if(bg)bg.style.backgroundImage=`url("${String(mediaBackdrop(item,'original')).replace(/"/g,'%22')}")`;
  if(title)title.textContent=mediaTitle(item);
  if(text)text.textContent=item.overview||'Discover something worth watching tonight.';
  if(label)label.textContent=mediaType(item)==='tv'?'FEATURED SERIES':'FEATURED FILM';
  if(meta)meta.textContent=[mediaYear(item),mediaRating(item)?'★ '+mediaRating(item):'',mediaType(item)==='tv'?'Series':'Movie'].filter(Boolean).join('   ');
  if(button){button.disabled=false;button.onclick=()=>openMediaDetails(mediaType(item),item.id)}
  hydrateMediaHeroVideo(item);
}
async function loadMediaHome(force=false){
  if((mediaState.loaded&&!force)||mediaState.loading)return;
  mediaState.loading=true;
  try{
    const res=await fetch(`${MEDIA_API}/media/v1/home`,{cache:'force-cache'});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.error||data.detail||`Media catalog failed (${res.status})`);
    mediaState.home=data;mediaState.loaded=true;
    const trending=(data.trending||[]).filter(x=>['movie','tv'].includes(x.media_type));
    renderMediaHero(trending.find(x=>x.backdrop_path)||data.now_playing?.find(x=>x.backdrop_path)||trending[0]||data.popular_movies?.[0]);
    renderMediaRow('#mediaTrending',trending,'','landscape');
    renderMediaRow('#mediaNowPlaying',(data.now_playing||[]).map(x=>({...x,media_type:'movie'})),'movie','poster');
    renderMediaRow('#mediaMovies',(data.popular_movies||[]).map(x=>({...x,media_type:'movie'})),'movie','poster');
    renderMediaRow('#mediaTv',(data.popular_tv||[]).map(x=>({...x,media_type:'tv'})),'tv','landscape');
    renderMediaRow('#mediaUpcoming',(data.upcoming||[]).map(x=>({...x,media_type:'movie'})),'movie','landscape');
    const topRated=[
      ...(data.top_rated_movies||[]).slice(0,10).map(x=>({...x,media_type:'movie'})),
      ...(data.top_rated_tv||[]).slice(0,10).map(x=>({...x,media_type:'tv'}))
    ];
    renderMediaRow('#mediaTopRated',topRated);
  }catch(err){
    const hero=$('#mediaHeroText');if(hero)hero.textContent=err.message||'Could not load movies and shows.';
    ['#mediaTrending','#mediaNowPlaying','#mediaMovies','#mediaTv','#mediaUpcoming','#mediaTopRated'].forEach(id=>{const el=$(id);if(el)el.innerHTML='<div class="media-empty">Cinema library unavailable. Try again shortly.</div>'});
  }finally{mediaState.loading=false}
}
async function searchMedia(query){
  const q=String(query||'').trim();
  if(!q){clearMediaSearch();return}
  mediaState.query=q;
  const rows=$('#mediaRows'),grid=$('#mediaSearchGrid'),head=$('#mediaResultsHead'),title=$('#mediaResultsTitle');
  if(rows)rows.hidden=true;
  if(grid){grid.hidden=false;grid.innerHTML='<div class="media-empty">Searching the cinema…</div>'}
  if(head)head.hidden=false;
  if(title)title.textContent=`Results for “${q}”`;
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
  if(rows)rows.hidden=false;
  if(grid){grid.hidden=true;grid.innerHTML=''}
  if(head)head.hidden=true;
}
function mediaCertification(item,type){
  if(type==='movie'){
    const releases=item?.release_dates?.results||[];
    const us=releases.find(x=>x.iso_3166_1==='US');
    return us?.release_dates?.map(x=>x.certification).find(Boolean)||'';
  }
  const ratings=item?.content_ratings?.results||[];
  return ratings.find(x=>x.iso_3166_1==='US')?.rating||'';
}
function buildMediaArtworkStrip(item,host){
  const images=mediaBackdropGallery(item);
  if(!host||!images.length)return;
  const section=document.createElement('section');
  section.className='media-detail-section';
  section.innerHTML='<div class="media-detail-section-head"><span>ARTWORK</span><h3>Scenes & stills</h3></div><div class="media-artwork-strip"></div>';
  const strip=$('.media-artwork-strip',section);
  images.forEach(url=>{
    const img=document.createElement('img');
    img.loading='lazy';img.decoding='async';img.alt='';img.src=url;
    strip.append(img);
  });
  host.append(section);
}
function buildMediaRecommendations(item,host,type='movie'){
  const recs=[
    ...(item?.recommendations?.results||[]),
    ...(item?.similar?.results||[])
  ].filter((x,index,arr)=>x?.id&&arr.findIndex(y=>y.id===x.id)===index).slice(0,12);
  if(!host||!recs.length)return;
  const section=document.createElement('section');
  section.className='media-detail-section';
  section.innerHTML='<div class="media-detail-section-head"><span>MORE LIKE THIS</span><h3>Keep watching</h3></div><div class="media-row media-detail-recs"></div>';
  const row=$('.media-detail-recs',section);
  recs.forEach(x=>row.append(mediaCard(x,type,'landscape')));
  host.append(section);
}
async function openMediaDetails(type,id){
  $('#mediaDetails')?.remove();
  const modal=document.createElement('div');
  modal.className='media-details';
  modal.id='mediaDetails';
  modal.innerHTML='<div class="media-details-loading">Opening cinema…</div>';
  document.body.append(modal);
  try{
    const res=await fetch(`${MEDIA_API}/media/v1/details/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,{cache:'force-cache'});
    const item=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(item.detail||'Could not load title');
    const backdrop=mediaBackdrop(item);
    const trailer=mediaTrailer(item);
    const logo=mediaLogo(item);
    const genres=mediaGenreNames(item);
    const certification=mediaCertification(item,type);
    const cast=(item?.credits?.cast||[]).slice(0,6).map(x=>x.name).filter(Boolean);
    modal.innerHTML=`
      <button class="media-details-close" aria-label="Close">×</button>
      <div class="media-details-art" style="background-image:url('${String(backdrop).replace(/'/g,'%27')}')"></div>
      <div class="media-details-video" id="mediaDetailsVideo" aria-hidden="true"></div>
      <div class="media-details-scrim"></div>
      <main class="media-details-body">
        <section class="media-details-copy">
          ${logo?`<img class="media-title-logo" src="${logo}" alt="">`:''}
          <span class="kicker">${type==='tv'?'SERIES':'MOVIE'}</span>
          <h2></h2>
          <div class="media-details-meta"></div>
          <p></p>
          <div class="media-detail-cast" id="mediaDetailCast"></div>
          <div class="media-episode-controls" id="mediaEpisodeControls" ${type==='tv'?'':'hidden'}>
            <select id="mediaSeasonSelect" aria-label="Season"></select>
            <select id="mediaEpisodeSelect" aria-label="Episode"></select>
          </div>
          <div class="media-details-actions">
            <button class="primary" id="mediaPlayNow">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 9 6-9 6z"/></svg>
              Play
            </button>

          </div>
        </section>
        <div class="media-details-extra" id="mediaDetailsExtra"></div>
      </main>`;
    $('.media-details-copy h2',modal).textContent=mediaTitle(item);
    $('.media-details-copy p',modal).textContent=item.overview||'No description available.';
    $('.media-details-meta',modal).textContent=[
      mediaYear(item),
      certification,
      type==='movie'&&item.runtime?`${item.runtime} min`:type==='tv'&&item.number_of_seasons?`${item.number_of_seasons} season${item.number_of_seasons===1?'':'s'}`:'',
      mediaRating(item)?`★ ${mediaRating(item)}`:'',
      ...genres
    ].filter(Boolean).join(' · ');
    const castHost=$('#mediaDetailCast',modal);
    if(castHost&&cast.length)castHost.textContent='Starring '+cast.join(', ');
    const close=()=>modal.remove();
    $('.media-details-close',modal).onclick=close;
    mountMediaAutoplay($('#mediaDetailsVideo',modal),trailer);

    if(type==='tv'){
      const seasonSelect=$('#mediaSeasonSelect',modal);
      const seasons=(item.seasons||[]).filter(s=>s.season_number>0);
      seasons.forEach(s=>{
        const o=document.createElement('option');
        o.value=s.season_number;
        o.textContent=s.name||`Season ${s.season_number}`;
        seasonSelect.append(o);
      });
      if(!seasonSelect.children.length){
        const o=document.createElement('option');o.value='1';o.textContent='Season 1';seasonSelect.append(o);
      }
      const loadEpisodes=async()=>{
        const season=Number(seasonSelect.value)||1;
        const epSelect=$('#mediaEpisodeSelect',modal);
        epSelect.innerHTML='<option>Loading episodes…</option>';
        try{
          const rr=await fetch(`${MEDIA_API}/media/v1/tv/${id}/season/${season}`,{cache:'force-cache'});
          const dd=await rr.json();
          epSelect.innerHTML='';
          (dd.episodes||[]).forEach(ep=>{
            const o=document.createElement('option');
            o.value=ep.episode_number;
            o.textContent=`${ep.episode_number}. ${ep.name||'Episode'}`;
            epSelect.append(o);
          });
          if(!epSelect.children.length)epSelect.innerHTML='<option value="1">Episode 1</option>';
        }catch{epSelect.innerHTML='<option value="1">Episode 1</option>'}
      };
      seasonSelect.onchange=loadEpisodes;
      await loadEpisodes();
    }

    $('#mediaPlayNow',modal).onclick=()=>{
      const season=type==='tv'?Number($('#mediaSeasonSelect',modal)?.value)||1:null;
      const episode=type==='tv'?Number($('#mediaEpisodeSelect',modal)?.value)||1:null;
      playMedia({type,id,title:mediaTitle(item),year:Number(mediaYear(item))||undefined,imdbId:item.imdb_id||'',season,episode});
    };

    const extra=$('#mediaDetailsExtra',modal);
    buildMediaArtworkStrip(item,extra);
    buildMediaRecommendations(item,extra,type);
  }catch(err){
    modal.innerHTML=`<button class="media-details-close" aria-label="Close">×</button><div class="media-details-loading">${escapeHtml(err.message||'Could not load title.')}</div>`;
    $('.media-details-close',modal).onclick=()=>modal.remove();
  }
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
    video.src=url;video.load();await waitForMediaReady(video,12000);return;
  }
  if(isHls){
    const Hls=await ensureHls();
    if(!Hls?.isSupported())throw new Error('HLS playback is not supported here');
    const hls=new Hls({enableWorker:true,lowLatencyMode:false,manifestLoadingTimeOut:10000,manifestLoadingMaxRetry:2,levelLoadingTimeOut:10000,levelLoadingMaxRetry:2,fragLoadingTimeOut:12000,fragLoadingMaxRetry:3});
    video._arcHls=hls;
    const fatal=new Promise((_,reject)=>{
      hls.on(Hls.Events.ERROR,(_event,data)=>{if(data?.fatal)reject(new Error(`HLS source failed: ${data.details||data.type||'unknown error'}`))});
    });
    hls.loadSource(url);hls.attachMedia(video);
    await Promise.race([waitForMediaReady(video,14000),fatal]);
    return;
  }
  video.src=url;video.load();await waitForMediaReady(video,12000);
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

function mangaImage(value){
  const raw=String(value||'').trim();
  if(!raw)return '';
  return /^https?:\/\//i.test(raw)?raw:MANGA_API+(raw.startsWith('/')?raw:'/'+raw);
}
function mangaTitle(item){
  const value=item?.title;
  if(typeof value==='string')return value;
  if(Array.isArray(value))return value.find(Boolean)||'Untitled';
  if(value&&typeof value==='object')return value.english||value.romaji||value.native||Object.values(value).find(Boolean)||'Untitled';
  return 'Untitled';
}
function mangaAltTitle(item){
  const list=Array.isArray(item?.altTitles)?item.altTitles:[];
  return list.find(Boolean)||'';
}
function mangaLibrary(){
  try{
    const value=JSON.parse(localStorage.getItem('arc-manga-library')||'[]');
    return Array.isArray(value)?value.filter(x=>x?.id):[];
  }catch(_){return[]}
}
function setMangaLibrary(items){
  localStorage.setItem('arc-manga-library',JSON.stringify(items.slice(0,80)));
  renderMangaSaved();
}
function mangaProgress(){
  try{
    const value=JSON.parse(localStorage.getItem('arc-manga-progress')||'[]');
    return Array.isArray(value)?value.filter(x=>x?.mangaId):[];
  }catch(_){return[]}
}
function setMangaProgress(entry){
  const next=[entry,...mangaProgress().filter(x=>x.mangaId!==entry.mangaId)].slice(0,30);
  localStorage.setItem('arc-manga-progress',JSON.stringify(next));
  renderMangaContinue();
}
function mangaStatusLabel(item){
  const raw=String(item?.status||item?.state||'').trim();
  if(!raw)return 'MANGA';
  return raw.replace(/[_-]+/g,' ').toUpperCase().slice(0,18);
}
function mangaUpdateLabel(item){
  const raw=item?.latestChapter??item?.lastChapter??item?.chapter??item?.chapterNumber;
  if(raw&&typeof raw==='object'){
    const value=raw.number??raw.chapter??raw.title;
    if(value!=null&&String(value).trim())return /^chapter\b/i.test(String(value))?String(value):'Chapter '+value;
  }
  if(raw!=null&&String(raw).trim())return /^chapter\b/i.test(String(raw))?String(raw):'Chapter '+raw;
  return mangaAltTitle(item)||'Updated recently';
}
function mangaCard(item,context=[]){
  const card=document.createElement('button');
  card.type='button';
  card.className='manga-card';
  card.setAttribute('aria-label','Open '+mangaTitle(item));
  const art=document.createElement('span');
  art.className='manga-card-art';
  const img=document.createElement('img');
  img.loading='lazy';img.decoding='async';img.alt='';img.src=mangaImage(item.image||item.cover);
  const badge=document.createElement('span');
  badge.className='manga-card-badge';
  badge.textContent=mangaStatusLabel(item);
  art.append(img,badge);
  const title=document.createElement('b');title.textContent=mangaTitle(item);
  const meta=document.createElement('span');meta.textContent=mangaAltTitle(item)||String(item?.author||item?.artist||'Manga');
  card.append(art,title,meta);
  card.onclick=()=>openMangaDetails(item.id,item);
  return card;
}
function renderMangaRow(id,items){
  const host=$(id);if(!host)return;
  host.innerHTML='';
  (items||[]).slice(0,20).forEach(item=>host.append(mangaCard(item,items)));
  if(!host.children.length)host.innerHTML='<div class="manga-empty">Nothing here yet.</div>';
}
function renderMangaArtwork(popular=[],recent=[]){
  const latest=$('#mangaLatestList');
  if(!latest)return;
  latest.innerHTML='';
  const seen=new Set();
  const items=(recent||[]).filter(item=>item?.id&&!seen.has(item.id)&&seen.add(item.id)).slice(0,6);
  items.forEach((item,index)=>{
    const button=document.createElement('button');
    button.type='button';
    button.className='manga-update-row';

    const indexLabel=document.createElement('span');
    indexLabel.className='manga-update-index';
    indexLabel.textContent=String(index+1).padStart(2,'0');

    const img=document.createElement('img');
    img.alt='';
    img.loading=index<3?'eager':'lazy';
    img.decoding='async';
    img.src=mangaImage(item.image||item.cover);

    const copy=document.createElement('span');
    copy.className='manga-update-copy';
    const title=document.createElement('b');
    title.textContent=mangaTitle(item);
    const meta=document.createElement('small');
    meta.textContent=mangaUpdateLabel(item);
    copy.append(title,meta);

    const badge=document.createElement('span');
    badge.className='manga-update-badge';
    badge.textContent='NEW';

    button.append(indexLabel,img,copy,badge);
    button.onclick=()=>openMangaDetails(item.id,item);
    latest.append(button);
  });
  if(!latest.children.length)latest.innerHTML='<div class="manga-latest-empty">No updates yet.</div>';
}
function renderMangaHero(item){
  mangaState.featured=item||null;
  const title=$('#mangaHeroTitle'),cover=$('#mangaHeroCover'),bg=$('#mangaHeroBackdrop'),open=$('#mangaHeroOpen'),status=$('#mangaHeroStatus');
  if(!item){
    if(title)title.textContent='Manga library unavailable';
    if(open)open.disabled=true;
    return;
  }
  const image=mangaImage(item.image||item.cover);
  if(title)title.textContent=mangaTitle(item);
  if(cover){cover.src=image;cover.hidden=!image}
  if(bg)bg.style.backgroundImage=image?`url("${image.replace(/"/g,'%22')}")`:'none';
  if($('#mangaHeroText'))$('#mangaHeroText').textContent=mangaAltTitle(item)||'A featured series from the Arc Manga catalog.';
  if(status)status.textContent=mangaStatusLabel(item)==='MANGA'?'Featured now':mangaStatusLabel(item);
  if(open){open.disabled=false;open.onclick=()=>openMangaDetails(item.id,item)}
}
function renderMangaContinue(){
  const items=mangaProgress();
  const section=$('#mangaContinueSection'),host=$('#mangaContinueRow');
  if(section)section.hidden=!items.length;
  if(!host)return;
  host.innerHTML='';
  items.forEach((entry,index)=>{
    const card=document.createElement('button');
    card.type='button';card.className='manga-continue-card';
    const img=document.createElement('img');img.alt='';img.loading='lazy';img.src=mangaImage(entry.image);
    const copy=document.createElement('span');
    const title=document.createElement('b');title.textContent=entry.title||'Manga';
    const meta=document.createElement('small');meta.textContent=(entry.chapterTitle||'Chapter')+' · '+Math.max(1,Number(entry.page||0)+1)+'/'+Math.max(1,Number(entry.totalPages||1));
    const bar=document.createElement('i');
    const pct=Math.max(0,Math.min(100,((Number(entry.page||0)+1)/Math.max(1,Number(entry.totalPages||1)))*100));
    bar.style.setProperty('--manga-progress',pct+'%');
    copy.append(title,meta,bar);card.append(img,copy);
    card.onclick=()=>resumeManga(entry);
    host.append(card);
  });
}
function renderMangaSaved(){
  const items=mangaLibrary();
  const section=$('#mangaSavedSection');
  if(section)section.hidden=!items.length;
  renderMangaRow('#mangaSavedRow',items);
}
async function loadMangaHome(force=false){
  if((mangaState.loaded&&!force)||mangaState.loading)return;
  mangaState.loading=true;
  try{
    const request=async()=>{
      const res=await fetch(MANGA_API+'/manga/v1/home?arc='+Date.now(),{cache:'no-store'});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data.error||'Manga library unavailable');
      return data;
    };

    let data=await request();
    let popular=Array.isArray(data.popular)?data.popular:[];
    let recent=Array.isArray(data.recent)?data.recent:[];

    if(!popular.length&&!recent.length){
      await new Promise(resolve=>setTimeout(resolve,450));
      data=await request();
      popular=Array.isArray(data.popular)?data.popular:[];
      recent=Array.isArray(data.recent)?data.recent:[];
    }

    if(!popular.length&&!recent.length)throw new Error('Manga catalog is reconnecting');

    mangaState.home=data;
    mangaState.loaded=true;
    mangaState.retry=0;
    renderMangaHero(popular[0]||recent[0]);
    renderMangaArtwork(popular,recent);
    renderMangaRow('#mangaPopularRow',popular);
    renderMangaRow('#mangaRecentRow',recent);
    renderMangaContinue();
    renderMangaSaved();
  }catch(err){
    mangaState.loaded=false;
    if($('#mangaHeroTitle'))$('#mangaHeroTitle').textContent='Connecting to manga…';
    if($('#mangaHeroText'))$('#mangaHeroText').textContent='Refreshing the manga catalog.';
    ['#mangaPopularRow','#mangaRecentRow'].forEach(id=>{
      const el=$(id);
      if(el)el.innerHTML='<div class="manga-empty">Refreshing library…</div>';
    });
    if(mangaState.retry<3){
      mangaState.retry++;
      setTimeout(()=>{mangaState.loading=false;loadMangaHome(true)},900*mangaState.retry);
      return;
    }
  }finally{
    mangaState.loading=false;
  }
}
async function searchManga(query){
  const q=String(query||'').trim();
  if(!q){clearMangaSearch();return}
  mangaState.query=q;
  const home=$('#mangaHome'),results=$('#mangaSearchResults'),grid=$('#mangaSearchGrid');
  if(home)home.hidden=true;
  if(results)results.hidden=false;
  if($('#mangaSearchTitle'))$('#mangaSearchTitle').textContent='Results for “'+q+'”';
  if(grid)grid.innerHTML='<div class="manga-empty">Searching…</div>';
  try{
    const res=await fetch(MANGA_API+'/manga/v1/search?q='+encodeURIComponent(q),{cache:'no-store'});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.error||'Search failed');
    grid.innerHTML='';
    const items=Array.isArray(data.results)?data.results:[];
    items.forEach(item=>grid.append(mangaCard(item,items)));
    if(!grid.children.length)grid.innerHTML='<div class="manga-empty">No manga found.</div>';
  }catch(err){
    if(grid)grid.innerHTML='<div class="manga-empty">'+escapeHtml(err.message||'Search failed.')+'</div>';
  }
}
function clearMangaSearch(){
  mangaState.query='';
  if($('#mangaSearchInput'))$('#mangaSearchInput').value='';
  if($('#mangaSearchResults'))$('#mangaSearchResults').hidden=true;
  if($('#mangaHome'))$('#mangaHome').hidden=false;
}
function toggleMangaSaved(item){
  const current=mangaLibrary();
  const exists=current.some(x=>x.id===item.id);
  if(exists)setMangaLibrary(current.filter(x=>x.id!==item.id));
  else setMangaLibrary([{id:item.id,title:mangaTitle(item),image:item.image||'',altTitles:item.altTitles||[]},...current]);
  return !exists;
}
function chapterNumber(chapter){
  const direct=Number(chapter?.chapter);
  if(Number.isFinite(direct))return direct;
  const text=String(chapter?.title||'');
  const match=text.match(/(?:chapter|ch\.?\s*)?([0-9]+(?:\.[0-9]+)?)/i);
  return match?Number(match[1]):NaN;
}
function chapterLabel(chapter,index){
  return chapter?.title||chapter?.chapter||('Chapter '+(index+1));
}
async function openMangaDetails(id,seed={}){
  $('#mangaDetails')?.remove();
  const shell=document.createElement('div');
  shell.className='manga-details';shell.id='mangaDetails';
  shell.innerHTML='<div class="manga-details-loading">Opening manga…</div>';
  document.body.append(shell);
  try{
    const res=await fetch(MANGA_API+'/manga/v1/info/'+encodeURIComponent(id),{cache:'force-cache'});
    const item=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(item.error||'Could not load manga');
    mangaState.current=item;
    const allChapters=Array.isArray(item.chapters)?item.chapters.slice():[];
    const readableChapters=allChapters.filter(ch=>{
      if(ch?.readable===false)return false;
      if(ch?.externalUrl)return false;
      const pages=Number(ch?.pages);
      return !Number.isFinite(pages)||pages>0;
    });
    mangaState.chapters=readableChapters.length?readableChapters:allChapters;
    const numeric=mangaState.chapters.filter(ch=>Number.isFinite(chapterNumber(ch)));
    if(numeric.length>=Math.max(2,Math.floor(mangaState.chapters.length*.6))){
      mangaState.chapters.sort((a,b)=>{
        const an=chapterNumber(a),bn=chapterNumber(b);
        if(!Number.isFinite(an))return 1;
        if(!Number.isFinite(bn))return -1;
        return an-bn;
      });
    }
    const image=mangaImage(item.image||seed.image);
    const genres=Array.isArray(item.genres)?item.genres.filter(Boolean):[];
    const saved=mangaLibrary().some(x=>x.id===item.id);
    shell.innerHTML=`
      <button class="manga-details-close" type="button" aria-label="Close">×</button>
      <div class="manga-details-bg" style="background-image:url('${String(image).replace(/'/g,'%27')}')"></div>
      <div class="manga-details-scrim"></div>
      <div class="manga-details-layout">
        <img class="manga-details-cover" alt="" src="${image}">
        <div class="manga-details-copy">
          <span class="kicker">MANGA</span>
          <h2></h2>
          <p class="manga-details-alt"></p>
          <div class="manga-genre-row"></div>
          <div class="manga-details-actions">
            <button class="primary" id="mangaReadFirst" type="button">Start reading</button>
            <button class="secondary" id="mangaSave" type="button">${saved?'Saved':'Save'}</button>
          </div>
        </div>
      </div>
      <section class="manga-chapters">
        <div class="manga-section-head"><div><span>CHAPTERS</span><h2>All chapters</h2></div><span id="mangaChapterCount"></span></div>
        <div class="manga-chapter-list" id="mangaChapterList"></div>
      </section>`;
    $('.manga-details-copy h2',shell).textContent=mangaTitle(item);
    $('.manga-details-alt',shell).textContent=mangaAltTitle(item);
    const genreHost=$('.manga-genre-row',shell);
    genres.slice(0,8).forEach(genre=>{const span=document.createElement('span');span.textContent=genre;genreHost.append(span)});
    $('#mangaChapterCount',shell).textContent=mangaState.chapters.length+' chapters';
    const list=$('#mangaChapterList',shell);
    mangaState.chapters.forEach((chapter,index)=>{
      const row=document.createElement('button');
      row.type='button';row.className='manga-chapter-row';
      const title=document.createElement('b');title.textContent=chapterLabel(chapter,index);
      const date=document.createElement('span');date.textContent=chapter.releaseDate||'';
      row.append(title,date);row.onclick=()=>openMangaChapter(item,mangaState.chapters,index,0);
      list.append(row);
    });
    if(!list.children.length)list.innerHTML='<div class="manga-empty">No chapters available.</div>';
    $('.manga-details-close',shell).onclick=()=>shell.remove();
    $('#mangaSave',shell).onclick=e=>{
      const on=toggleMangaSaved(item);
      e.currentTarget.textContent=on?'Saved':'Save';
    };
    $('#mangaReadFirst',shell).onclick=()=>{
      if(mangaState.chapters.length)openMangaChapter(item,mangaState.chapters,0,0);
    };
  }catch(err){
    shell.innerHTML='<button class="manga-details-close" type="button" aria-label="Close">×</button><div class="manga-details-loading">'+escapeHtml(err.message||'Could not load manga.')+'</div>';
    $('.manga-details-close',shell).onclick=()=>shell.remove();
  }
}
function saveReaderProgress(){
  const reader=mangaState.reader;
  if(!reader?.manga||!reader.chapter)return;
  setMangaProgress({
    mangaId:reader.manga.id,
    title:mangaTitle(reader.manga),
    image:reader.manga.image||'',
    chapterId:reader.chapter.id,
    chapterTitle:chapterLabel(reader.chapter,reader.chapterIndex),
    chapterIndex:reader.chapterIndex,
    page:reader.page,
    totalPages:reader.pages.length,
    mode:reader.mode,
    updatedAt:Date.now()
  });
}
async function resumeManga(entry){
  try{
    const res=await fetch(MANGA_API+'/manga/v1/info/'+encodeURIComponent(entry.mangaId),{cache:'force-cache'});
    const item=await res.json();
    const chapters=Array.isArray(item.chapters)?item.chapters:[];
    let index=chapters.findIndex(x=>x.id===entry.chapterId);
    if(index<0)index=Math.max(0,Math.min(chapters.length-1,Number(entry.chapterIndex)||0));
    openMangaChapter(item,chapters,index,Number(entry.page)||0);
  }catch{}
}
function updateMangaReader(){
  const reader=mangaState.reader;
  const shell=$('#mangaReader');
  if(!reader||!shell)return;
  $('#mangaReaderPage',shell).textContent=(reader.page+1)+' / '+Math.max(1,reader.pages.length);
  $('#mangaReaderMode',shell).textContent=reader.mode==='scroll'?'Scroll':'Pages';
  shell.dataset.mode=reader.mode;
  shell.style.setProperty('--manga-zoom',String(reader.zoom));
  shell.style.setProperty('--manga-page-width',Math.round(760*reader.zoom)+'px');
  const pages=$('#mangaReaderPages',shell);
  if(reader.mode==='page'){
    pages.innerHTML='';
    const item=reader.pages[reader.page];
    if(item){
      const img=document.createElement('img');img.alt='Page '+(reader.page+1);img.src=mangaImage(item.img);img.className='manga-reader-page-image';pages.append(img);
    }
  }
  $('#mangaPrevPage',shell).disabled=reader.page<=0;
  $('#mangaNextPage',shell).disabled=reader.page>=reader.pages.length-1;
  $('#mangaPrevChapter',shell).disabled=reader.chapterIndex<=0;
  $('#mangaNextChapter',shell).disabled=reader.chapterIndex>=reader.chapters.length-1;
  saveReaderProgress();
}
function gotoMangaPage(delta){
  const reader=mangaState.reader;if(!reader)return;
  reader.page=Math.max(0,Math.min(reader.pages.length-1,reader.page+delta));
  updateMangaReader();
}
async function gotoMangaChapter(delta){
  const reader=mangaState.reader;if(!reader)return;
  const next=reader.chapterIndex+delta;
  if(next<0||next>=reader.chapters.length)return;
  await openMangaChapter(reader.manga,reader.chapters,next,0);
}
async function openMangaChapter(manga,chapters,chapterIndex,startPage=0){
  $('#mangaReader')?.remove();
  const chapter=chapters[chapterIndex];
  if(!chapter)return;
  const shell=document.createElement('div');
  shell.className='manga-reader';shell.id='mangaReader';
  shell.innerHTML=`
    <header class="manga-reader-toolbar">
      <button type="button" id="mangaReaderClose" aria-label="Close reader">×</button>
      <div class="manga-reader-title"><b></b><span></span></div>
      <div class="manga-reader-tools">
        <button type="button" id="mangaPrevChapter" title="Previous chapter">‹ Ch.</button>
        <button type="button" id="mangaPrevPage" title="Previous page">‹</button>
        <span id="mangaReaderPage">1 / 1</span>
        <button type="button" id="mangaNextPage" title="Next page">›</button>
        <button type="button" id="mangaNextChapter" title="Next chapter">Ch. ›</button>
        <button type="button" id="mangaReaderMode">Scroll</button>
        <button type="button" id="mangaZoomOut" aria-label="Zoom out">−</button>
        <button type="button" id="mangaZoomIn" aria-label="Zoom in">+</button>
      </div>
    </header>
    <main class="manga-reader-pages" id="mangaReaderPages"><div class="manga-reader-loading">Loading chapter…</div></main>`;
  $('.manga-reader-title b',shell).textContent=mangaTitle(manga);
  $('.manga-reader-title span',shell).textContent=chapterLabel(chapter,chapterIndex);
  document.body.append(shell);
  try{
    const res=await fetch(MANGA_API+'/manga/v1/read?chapterId='+encodeURIComponent(chapter.id),{cache:'force-cache'});
    const pages=await res.json().catch(()=>[]);
    if(!res.ok||!Array.isArray(pages))throw new Error('Could not load chapter');
    const mode=localStorage.getItem('arc-manga-reader-mode')||'scroll';
    const zoom=Math.max(.65,Math.min(1.5,Number(localStorage.getItem('arc-manga-reader-zoom')||1)));
    mangaState.reader={manga,chapters,chapterIndex,chapter,pages,page:Math.max(0,Math.min(pages.length-1,startPage)),mode,zoom};
    const host=$('#mangaReaderPages',shell);
    host.innerHTML='';
    if(mode==='scroll'){
      pages.forEach((page,index)=>{
        const img=document.createElement('img');
        img.alt='Page '+(index+1);img.loading=index<3?'eager':'lazy';img.decoding='async';img.src=mangaImage(page.img);img.className='manga-reader-page-image';img.dataset.page=String(index);host.append(img);
      });
      const observer=new IntersectionObserver(entries=>{
        const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
        if(visible&&mangaState.reader?.mode==='scroll'){
          mangaState.reader.page=Number(visible.target.dataset.page)||0;
          $('#mangaReaderPage',shell).textContent=(mangaState.reader.page+1)+' / '+Math.max(1,pages.length);
          saveReaderProgress();
        }
      },{threshold:[.25,.5,.75]});
      $$('.manga-reader-page-image',host).forEach(img=>observer.observe(img));
      setTimeout(()=>$$('.manga-reader-page-image',host)[mangaState.reader.page]?.scrollIntoView({block:'start'}),50);
    }
    updateMangaReader();
    $('#mangaReaderClose',shell).onclick=()=>{saveReaderProgress();shell.remove();mangaState.reader=null};
    $('#mangaPrevPage',shell).onclick=()=>gotoMangaPage(-1);
    $('#mangaNextPage',shell).onclick=()=>gotoMangaPage(1);
    $('#mangaPrevChapter',shell).onclick=()=>gotoMangaChapter(-1);
    $('#mangaNextChapter',shell).onclick=()=>gotoMangaChapter(1);
    $('#mangaReaderMode',shell).onclick=()=>{
      const reader=mangaState.reader;if(!reader)return;
      reader.mode=reader.mode==='scroll'?'page':'scroll';
      localStorage.setItem('arc-manga-reader-mode',reader.mode);
      openMangaChapter(reader.manga,reader.chapters,reader.chapterIndex,reader.page);
    };
    $('#mangaZoomOut',shell).onclick=()=>{if(mangaState.reader){mangaState.reader.zoom=Math.max(.65,mangaState.reader.zoom-.1);localStorage.setItem('arc-manga-reader-zoom',String(mangaState.reader.zoom));updateMangaReader()}};
    $('#mangaZoomIn',shell).onclick=()=>{if(mangaState.reader){mangaState.reader.zoom=Math.min(1.5,mangaState.reader.zoom+.1);localStorage.setItem('arc-manga-reader-zoom',String(mangaState.reader.zoom));updateMangaReader()}};
  }catch(err){
    $('#mangaReaderPages',shell).innerHTML='<div class="manga-reader-loading">'+escapeHtml(err.message||'Chapter unavailable.')+'</div>';
    $('#mangaReaderClose',shell).onclick=()=>shell.remove();
  }
}
function setupManga(){
  if(mangaState.initialized){loadMangaHome();return}
  mangaState.initialized=true;
  $('#mangaSearchForm')?.addEventListener('submit',e=>{e.preventDefault();searchManga($('#mangaSearchInput')?.value||'')});
  $('#mangaClearSearch')?.addEventListener('click',clearMangaSearch);
  $('[data-manga-query]').forEach(button=>button.addEventListener('click',()=>searchManga(button.dataset.mangaQuery||'')));
  $('#mangaHeroRandom')?.addEventListener('click',()=>{
    const items=mangaState.home?.popular||[];
    if(items.length){const pick=items[Math.floor(Math.random()*items.length)];openMangaDetails(pick.id,pick)}
  });
  $$('[data-manga-filter]').forEach(button=>button.addEventListener('click',()=>{
    $$('[data-manga-filter]').forEach(x=>x.classList.toggle('active',x===button));
    const filter=button.dataset.mangaFilter;
    if(filter==='home'){clearMangaSearch();window.scrollTo({top:0,behavior:'smooth'})}
    else if(filter==='popular')$('#mangaPopularRow')?.scrollIntoView({behavior:'smooth',block:'center'});
    else if(filter==='recent')$('#mangaRecentRow')?.scrollIntoView({behavior:'smooth',block:'center'});
    else if(filter==='saved')$('#mangaSavedSection')?.scrollIntoView({behavior:'smooth',block:'center'});
  }));
  document.addEventListener('keydown',event=>{
    const reader=mangaState.reader;
    if(!reader)return;
    if(event.key==='Escape'){$('#mangaReaderClose')?.click();return}
    if(reader.mode==='page'){
      if(event.key==='ArrowLeft')gotoMangaPage(-1);
      if(event.key==='ArrowRight')gotoMangaPage(1);
    }
  });
  loadMangaHome();
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
  if(musicState.mode==='direct')return 'Enhanced';
  if(musicState.mode==='direct-loading')return 'Preparing';
  return 'Standard';
}
function updateMusicEngineUI(){
  const text=musicEngineLabel();
  if($('#musicSoundEngine'))$('#musicSoundEngine').textContent=text;
  const enhanced=musicState.mode==='direct';
  $('#musicSoundPanel')?.classList.toggle('music-enhanced-ready',enhanced);
  $$('#musicEqPresets button,#musicEq input,#musicSpatial,#musicNormalize').forEach(control=>{
    control.disabled=!enhanced;
  });
  const note=$('#musicSoundNote');
  if(note){
    if(enhanced)note.textContent='Enhanced audio is active. Equalizer, Spatial Width and Sound Check are processing this track in real time.';
    else if(musicState.directAvailable)note.textContent='Enhanced audio will turn on automatically when the active track supports it.';
    else note.textContent='Motion Artwork and lyrics are available now. Equalizer and Spatial Width turn on automatically when enhanced audio is available.';
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
  if(!track)return;
  const art=musicThumb(track);
  $('#musicNowArt').src=art;
  $('#musicNowArtBlur').src=art;
  $('#musicNowTitle').textContent=track.title||'Untitled';
  $('#musicNowArtist').textContent=track.artist||'Unknown artist';
  $('#musicNowAlbum').textContent=track.album||'Single';
  const screen=$('#musicNowScreen');
  if(screen)screen.style.setProperty('--music-now-image','url("'+art.replace(/"/g,'%22')+'")');
  $('#musicMotionArt')?.classList.toggle('motion-enabled',!!musicState.motion);
}
function openMusicNow(){
  if(!musicState.current)return;
  const screen=$('#musicNowScreen');
  if(!screen)return;
  updateMusicNowCard();
  screen.hidden=false;
  document.body.classList.add('music-now-open');
}
function closeMusicNow(){
  $('#musicNowScreen')?.setAttribute('hidden','');
  document.body.classList.remove('music-now-open');
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
function musicHistory(){
  try{
    const value=JSON.parse(localStorage.getItem('arc-music-history')||'[]');
    return Array.isArray(value)?value.filter(x=>x&&x.id).slice(0,20):[];
  }catch(_){return[]}
}
function rememberMusicTrack(track){
  if(!track?.id)return;
  const clean={
    id:track.id,title:track.title||'Untitled',artist:track.artist||'Unknown artist',
    album:track.album||null,duration:Number(track.duration||0),timestamp:track.timestamp||'',
    thumbnail:track.thumbnail||track.artwork||'',artwork:track.artwork||track.thumbnail||''
  };
  const next=[clean,...musicHistory().filter(x=>x.id!==clean.id)].slice(0,20);
  localStorage.setItem('arc-music-history',JSON.stringify(next));
  renderMusicHistory();
}
function musicQueueAndPlay(tracks,index){
  musicState.queue=tracks.slice();
  musicState.results=tracks.slice();
  playMusicTrack(index);
}
function buildMusicArtCard(track,index,tracks,compact=false){
  const card=document.createElement('button');
  card.type='button';
  card.className=compact?'music-home-track compact':'music-home-track';
  card.setAttribute('aria-label','Play '+(track.title||'song')+' by '+(track.artist||'artist'));
  const art=document.createElement('span');
  art.className='music-home-track-art';
  const img=document.createElement('img');
  img.loading='lazy';img.decoding='async';img.alt='';img.src=musicThumb(track);
  const play=document.createElement('i');
  play.setAttribute('aria-hidden','true');play.textContent='▶';
  art.append(img,play);
  const title=document.createElement('b');title.textContent=track.title||'Untitled';
  const meta=document.createElement('span');meta.textContent=track.artist||'Unknown artist';
  card.append(art,title,meta);
  card.onclick=()=>musicQueueAndPlay(tracks,index);
  return card;
}
function renderMusicShelf(id,tracks){
  const host=$('#'+id);
  if(!host)return;
  host.innerHTML='';
  tracks.forEach((track,index)=>host.append(buildMusicArtCard(track,index,tracks)));
}
function renderMusicQuickPicks(tracks){
  const host=$('#musicQuickPicks');
  if(!host)return;
  host.innerHTML='';
  tracks.slice(0,6).forEach((track,index)=>{
    const row=document.createElement('button');
    row.type='button';row.className='music-quick-pick';
    row.setAttribute('aria-label','Play '+track.title+' by '+track.artist);
    const img=document.createElement('img');img.loading='lazy';img.decoding='async';img.alt='';img.src=musicThumb(track);
    const copy=document.createElement('span');
    const title=document.createElement('b');title.textContent=track.title||'Untitled';
    const artist=document.createElement('small');artist.textContent=track.artist||'Unknown artist';
    copy.append(title,artist);
    const play=document.createElement('i');play.textContent='▶';play.setAttribute('aria-hidden','true');
    row.append(img,copy,play);
    row.onclick=()=>musicQueueAndPlay(tracks,index);
    host.append(row);
  });
}
function renderMusicMoods(seedTracks){
  const host=$('#musicMoodGrid');
  if(!host)return;
  const moods=[
    ['Chill','chill mix'],
    ['Focus','focus music'],
    ['Night drive','night drive'],
    ['Throwbacks','throwback hits'],
    ['Alt','alternative hits'],
    ['Energy','workout hits']
  ];
  host.innerHTML='';
  moods.forEach((item,index)=>{
    const [label,query]=item;
    const button=document.createElement('button');
    button.type='button';button.className='music-mood-card';
    const art=seedTracks[index%Math.max(1,seedTracks.length)];
    if(art){
      const img=document.createElement('img');img.alt='';img.loading='lazy';img.src=musicThumb(art);button.append(img);
    }
    const span=document.createElement('span');span.textContent=label;button.append(span);
    button.onclick=()=>searchMusic(query);
    host.append(button);
  });
}
function renderMusicHistory(){
  const history=musicHistory();
  const recent=$('#musicRecentShelf'),section=$('#musicRecentSection'),side=$('#musicSidebarHistory');
  if(section)section.hidden=!history.length;
  if(recent){
    recent.innerHTML='';
    history.slice(0,10).forEach((track,index)=>recent.append(buildMusicArtCard(track,index,history)));
  }
  if(side){
    side.innerHTML='';
    if(history.length){
      const label=document.createElement('span');label.className='music-side-recents-label';label.textContent='Recent';side.append(label);
    }
    history.slice(0,6).forEach((track,index)=>{
      const button=document.createElement('button');
      button.type='button';button.className='music-side-recent';
      const img=document.createElement('img');img.alt='';img.loading='lazy';img.src=musicThumb(track);
      const copy=document.createElement('span');
      const title=document.createElement('b');title.textContent=track.title;
      const artist=document.createElement('small');artist.textContent=track.artist;
      copy.append(title,artist);button.append(img,copy);
      button.onclick=()=>musicQueueAndPlay(history,index);
      side.append(button);
    });
  }
}
async function fetchMusicHomeQuery(query,limit=12){
  const res=await fetch(MUSIC_API+'/music/v1/search?q='+encodeURIComponent(query)+'&limit='+limit,{cache:'force-cache'});
  if(!res.ok)throw new Error('home music failed');
  const data=await res.json();
  return Array.isArray(data.results)?data.results:[];
}
async function loadMusicHome(){
  renderMusicHistory();
  if(musicState.homeLoaded)return;
  musicState.homeLoaded=true;
  const quick=$('#musicQuickPicks'),made=$('#musicMadeShelf'),popular=$('#musicPopularShelf');
  const loading='<div class="music-home-loading">Loading…</div>';
  if(quick)quick.innerHTML=loading;if(made)made.innerHTML=loading;if(popular)popular.innerHTML=loading;
  try{
    const [top,chill,alt]=await Promise.all([
      fetchMusicHomeQuery('top songs',16),
      fetchMusicHomeQuery('chill mix',10),
      fetchMusicHomeQuery('alternative indie',10)
    ]);
    musicState.homeTracks=top;
    const seen=new Set();
    musicState.homeMade=[...chill,...alt].filter(track=>{
      if(!track?.id||seen.has(track.id))return false;
      seen.add(track.id);return true;
    }).slice(0,10);
    renderMusicQuickPicks(top);
    renderMusicShelf('musicMadeShelf',musicState.homeMade);
    renderMusicShelf('musicPopularShelf',top.slice(6,16));
    renderMusicMoods([...top,...musicState.homeMade]);
    renderMusicHistory();
  }catch(_){
    [quick,made,popular].forEach(host=>{if(host)host.innerHTML='<div class="music-home-loading">Could not load music.</div>'});
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
  const art=musicThumb(track);
  $('#musicLyricsArt').src=art;
  const backdrop=$('#musicLyricsBackdrop');
  if(backdrop)backdrop.style.backgroundImage='url("'+art.replace(/"/g,'%22')+'")';
  const body=$('#musicLyricsBody');
  if(!body)return;

  const cached=musicState.lyricsCache.get(track.id);
  if(cached){
    musicState.lyricsData=cached;
    renderMusicLyrics(cached);
    return;
  }

  body.innerHTML='<p class="music-lyrics-loading">Finding lyrics…</p>';
  try{
    const res=await fetch(MUSIC_API+'/music/v1/lyrics/'+encodeURIComponent(track.id),{cache:'force-cache'});
    if(!res.ok)throw new Error('lyrics unavailable');
    const data=await res.json();
    const normalized={
      synced:!!data.synced,
      instrumental:!!data.instrumental,
      lines:Array.isArray(data.lines)?data.lines.map(line=>({
        time:Number.isFinite(Number(line?.time))?Number(line.time):null,
        text:String(line?.text||'').trim()
      })).filter(line=>line.text):[]
    };
    musicState.lyricsCache.set(track.id,normalized);
    musicState.lyricsData=normalized;
    renderMusicLyrics(normalized);
  }catch(_){
    const empty={synced:false,instrumental:false,lines:[]};
    musicState.lyricsData=empty;
    renderMusicLyrics(empty);
  }
}
function renderMusicLyrics(data){
  const body=$('#musicLyricsBody'),mode=$('#musicLyricsMode');
  if(!body)return;
  body.innerHTML='';
  musicState.activeLyric=-1;
  const lines=Array.isArray(data?.lines)?data.lines:[];
  if(mode)mode.textContent=data?.synced?'Synced':'Lyrics';

  if(!lines.length){
    const p=document.createElement('p');
    p.className='music-lyrics-empty';
    p.textContent=data?.instrumental?'This track is instrumental.':'Lyrics are not available for this song.';
    body.append(p);
    return;
  }

  lines.forEach((line,index)=>{
    const el=document.createElement(data.synced?'button':'p');
    el.className='music-lyric-line';
    el.textContent=line.text;
    el.dataset.lyricIndex=String(index);
    if(data.synced&&Number.isFinite(line.time)){
      el.type='button';
      el.dataset.time=String(line.time);
      el.addEventListener('click',()=>musicSeek(line.time));
    }
    body.append(el);
  });

  if(data.synced)syncMusicLyrics(currentMusicTime(),true);
}
function syncMusicLyrics(time,force=false){
  const data=musicState.lyricsData;
  if(!data?.synced||!data.lines?.length)return;
  let active=-1;
  const now=Number(time)||0;
  for(let i=0;i<data.lines.length;i++){
    const t=Number(data.lines[i].time);
    if(Number.isFinite(t)&&t<=now+.08)active=i;
    else if(Number.isFinite(t)&&t>now+.08)break;
  }
  if(active===musicState.activeLyric&&!force)return;
  musicState.activeLyric=active;
  $$('#musicLyricsBody .music-lyric-line').forEach((el,index)=>{
    el.classList.toggle('active',index===active);
    el.classList.toggle('past',index<active);
  });
  const activeEl=$('#musicLyricsBody .music-lyric-line.active');
  if(activeEl&&(!$('#musicLyricsPanel')?.hidden)){
    activeEl.scrollIntoView({behavior:force?'auto':'smooth',block:'center'});
  }
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
  syncMusicLyrics(current);
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
  rememberMusicTrack(track);
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
  loadMusicHome();

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
  $('#musicArtworkButton')?.addEventListener('click',openMusicNow);
  $('#musicNowClose')?.addEventListener('click',closeMusicNow);
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
