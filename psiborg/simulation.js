(() => {
  'use strict';
  const root=document.querySelector('#simulation-results-viewer');if(!root)return;
  const q=selector=>root.querySelector(selector);
  const video=q('video'), select=q('select'), play=q('.simulation-play'), status=q('.simulation-status');
  const canvases=[q('.simulation-expert'),q('.simulation-prediction')], contexts=canvases.map(c=>c.getContext('2d'));
  let entries=[],active=null,loaded=false,autoplay=false;
  function paint(time=video.currentTime) {
    if(!active||!loaded||video.readyState<2)return;
    contexts.forEach((context,i)=>context.drawImage(video,i*active.width,0,active.width,active.height,0,0,active.width,active.height));
    const frame=Math.max(0,Math.min(active.frames-1,Math.floor(time*active.fps+1e-6)));
    root.dataset.frame=frame;root.dataset.sourceTime=active.times[frame];
    q('.simulation-clock').textContent=`${active.times[frame].toFixed(1)} / ${active.times.at(-1).toFixed(1)} s`;
  }
  function choose(shouldPlay=false) {
    video.pause();loaded=false;autoplay=shouldPlay;
    active=entries.find(e=>e.id===select.value);root.dataset.episode=active.id;
    canvases.forEach(c=>{c.width=active.width;c.height=active.height;});
    q('.simulation-description').textContent=active.description;
    q('.simulation-recipe').textContent=`${active.checkpoint/1000}k · RGB · ${active.history}-frame history · ${active.frame_gap_ms} ms`;
    q('.simulation-clock').textContent=`${active.times[0].toFixed(1)} / ${active.times.at(-1).toFixed(1)} s`;
    status.textContent='Loading simulation…';
    video.src=active.video;video.load();
  }
  video.addEventListener('loadeddata',()=>{loaded=true;paint();status.textContent='';if(autoplay){autoplay=false;video.play().catch(()=>{});}});
  video.addEventListener('seeked',()=>paint());
  video.addEventListener('ended',()=>paint());
  video.addEventListener('play',()=>{play.textContent='Ⅱ';play.setAttribute('aria-label','Pause aligned simulation videos');});
  video.addEventListener('pause',()=>{play.textContent='▶';play.setAttribute('aria-label','Play aligned simulation videos');});
  video.addEventListener('error',()=>{status.textContent='The simulation video could not load. Refresh to try again.';});
  play.addEventListener('click',()=>{if(video.paused)video.play().catch(()=>{});else video.pause();});
  select.addEventListener('change',()=>choose(true));
  if('requestVideoFrameCallback' in video){const tick=(_now,metadata)=>{paint(metadata.mediaTime);video.requestVideoFrameCallback(tick);};video.requestVideoFrameCallback(tick);}
  else video.addEventListener('timeupdate',()=>paint());
  fetch('./assets/simulation/catalog.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Could not load simulation examples.');return r.json();}).then(data=>{
    entries=data.episodes;select.replaceChildren(...entries.map(e=>new Option(e.title,e.id)));video.muted=true;video.loop=true;video.autoplay=true;video.playsInline=true;choose(true);
  }).catch(error=>{status.textContent=error.message;});
})();
