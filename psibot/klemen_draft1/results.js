(() => {
  const root=document.querySelector('#policy-results-viewer');if(!root)return;
  const select=root.querySelector('select'),video=root.querySelector('video'),svg=root.querySelector('svg');
  const status=root.querySelector('.results-status'),readout=root.querySelector('.dt-readout'),clock=root.querySelector('.results-clock');
  const NS='http://www.w3.org/2000/svg',box={left:52,right:502,top:59,bottom:283};
  let data=null,points=[],serial=0,maxY=1,goalNodes=[],traceNodes=[];
  function el(name,attrs={},text){const n=document.createElementNS(NS,name);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;}
  function stamp(t){const s=Math.floor(Math.max(0,t));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
  const x=t=>box.left+t/data.duration*(box.right-box.left);
  const y=v=>box.bottom-v/maxY*(box.bottom-box.top);
  function draw(){
    svg.replaceChildren();goalNodes=[];traceNodes=[];
    maxY=Math.max(4,Math.ceil(Math.max(...points.map(p=>p.value))/4)*4);
    svg.append(el('text',{transform:'translate(14 171) rotate(-90)','text-anchor':'middle',class:'dt-axis-label'},'Δt (s)'));
    for(let i=0;i<=4;i++){
      const v=maxY*i/4,yy=y(v);svg.append(el('line',{x1:box.left,x2:box.right,y1:yy,y2:yy,class:'dt-grid'}));
      svg.append(el('text',{x:box.left-10,y:yy+4,'text-anchor':'end',class:'dt-tick'},String(v)));
    }
    for(let i=0;i<=4;i++)svg.append(el('text',{x:x(data.duration*i/4),y:306,'text-anchor':'middle',class:'dt-tick'},stamp(data.duration*i/4)));
    svg.append(el('text',{x:277,y:328,'text-anchor':'middle',class:'dt-axis-label'},'Video time'));
    for(const [i,g] of data.goals.entries()){
      const group=el('g',{class:'dt-goal',role:'button',tabindex:0,'aria-label':`New goal at ${g.time.toFixed(2)} seconds; seek video`});
      group.append(el('line',{x1:x(g.time),x2:x(g.time),y1:box.top-8,y2:box.bottom,stroke:'transparent','stroke-width':16}));
      group.append(el('line',{x1:x(g.time),x2:x(g.time),y1:box.top-8,y2:box.bottom,class:'dt-goal-line'}));
      group.append(el('text',{x:Math.min(box.right-75,Math.max(box.left,x(g.time)-3)),y:i%2?39:20,class:'dt-goal-label'},'📷 New Goal'));
      group.append(el('title',{},`New Goal · ${stamp(g.time)} · frame ${g.frame}`));
      const jump=()=>{video.currentTime=g.time;sync();};group.addEventListener('click',jump);group.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();jump();}});
      svg.append(group);goalNodes.push({node:group,time:g.time});
    }
    for(const track of data.tracks){
      const path=el('path',{d:'',class:'dt-trace'});
      const dot=el('circle',{r:2,class:'dt-single',visibility:'hidden'});
      // Keep recorded low values, but do not draw the startup rise from
      // the initial 1–2 model-step readings (0.2–0.4 s) into the curve.
      const firstHigher=track.findIndex(p=>p.value_steps>2);
      svg.append(path,dot);traceNodes.push({track,path,dot,shown:-1,startupBreak:firstHigher>0?firstHigher:-1});
    }
    svg.append(el('line',{id:'dt-playhead',x1:box.left,x2:box.left,y1:box.top-6,y2:box.bottom,class:'dt-playhead'}));
    svg.append(el('circle',{id:'dt-current-point',cx:box.left,cy:box.bottom,r:4,class:'dt-current-point',visibility:'hidden'}));
  }
  function sync(){
    if(!data)return;
    const t=Math.min(data.duration,Math.max(0,video.currentTime||0)),xx=x(t);
    clock.textContent=`${stamp(t)} / ${stamp(data.duration)}`;
    svg.querySelector('#dt-playhead').setAttribute('x1',xx);svg.querySelector('#dt-playhead').setAttribute('x2',xx);
    for(const g of goalNodes){
      const reached=t+0.0001>=g.time;
      g.node.classList.toggle('reached',reached);
      g.node.setAttribute('visibility',reached?'visible':'hidden');
      g.node.setAttribute('aria-hidden',String(!reached));
      g.node.setAttribute('tabindex',reached?'0':'-1');
    }
    for(const item of traceNodes){
      let count=0;while(count<item.track.length && item.track[count].time<=t)count++;
      if(count===item.shown)continue;
      item.shown=count;
      item.path.setAttribute('d',item.track.slice(0,count).map((p,i)=>`${i && i!==item.startupBreak?'L':'M'}${x(p.time).toFixed(3)},${y(p.value).toFixed(3)}`).join(' '));
      item.dot.setAttribute('visibility',count===1?'visible':'hidden');
      if(count===1){const p=item.track[0];item.dot.setAttribute('cx',x(p.time));item.dot.setAttribute('cy',y(p.value));}
    }
    let lo=0,hi=points.length;while(lo<hi){const m=(lo+hi)>>1;if(points[m].time<=t)lo=m+1;else hi=m;}
    const point=points[lo-1];
    const section=data.sections.find(s=>t>=s.start&&t<s.end);
    const current=point && t-point.time<=5 && section?.section===point.section;
    const dot=svg.querySelector('#dt-current-point');
    dot.setAttribute('visibility',current?'visible':'hidden');
    if(current){dot.setAttribute('cx',x(point.time));dot.setAttribute('cy',y(point.value));readout.textContent=`Δt ${point.value.toFixed(1)} s`;}
    else readout.textContent='Δt —';
    root.dataset.time=t.toFixed(3);root.dataset.task=data.id;
  }
  async function loadTask(id,autoplay){
    const ticket=++serial;video.pause();data=null;svg.replaceChildren();readout.textContent='Δt —';status.textContent='Loading task…';
    try{
      const response=await fetch(`../assets/results/${id}.json`);if(!response.ok)throw Error('Could not load the recorded Δt data.');
      const next=await response.json();if(ticket!==serial)return;
      data=next;points=data.tracks.flat().sort((a,b)=>a.time-b.time);draw();
      video.src=new URL(data.video, new URL("../", location.href)).href;video.load();
      root.querySelector('.results-task-title').textContent=data.title;
      video.setAttribute('aria-label',`${data.title} policy video`);
      svg.setAttribute('aria-label',`${data.title}: recorded Δt predictions with ${data.goals.length} new-goal markers. A vertical cursor follows the video.`);
      status.textContent='';sync();
      if(autoplay){try{await video.play();}catch{if(ticket===serial)status.textContent='';}}
    }catch(e){if(ticket===serial)status.textContent=e.message;}
  }
  select.addEventListener('change',()=>loadTask(select.value,true));
  const play=root.querySelector('.policy-play');
  play.addEventListener('click',()=>{if(video.paused)video.play().catch(()=>{});else video.pause();});
  const updatePlay=()=>{play.textContent=video.paused?'▶':'Ⅱ';play.setAttribute('aria-label',video.paused?'Play policy video':'Pause policy video');};
  for(const event of ['play','pause','ended','emptied'])video.addEventListener(event,updatePlay);
  const policySpeed=6;
  function setPolicySpeed(){
    if(video.defaultPlaybackRate!==policySpeed)video.defaultPlaybackRate=policySpeed;
    if(video.playbackRate!==policySpeed)video.playbackRate=policySpeed;
  }
  setPolicySpeed();
  video.addEventListener('ratechange',setPolicySpeed);
  video.addEventListener('loadedmetadata',()=>{setPolicySpeed();sync();});
  for(const event of ['timeupdate','seeked','pause','ended'])video.addEventListener(event,sync);
  if('requestVideoFrameCallback' in video){const tick=()=>{sync();video.requestVideoFrameCallback(tick);};video.requestVideoFrameCallback(tick);}
  video.addEventListener('error',()=>{status.textContent='The video could not load. Reload the page to try again.';});
  loadTask(select.value,false);
})();
