(() => {
  'use strict';
  const el = (tag, text, cls) => { const node = document.createElement(tag); if (text != null) node.textContent = text; if (cls) node.className = cls; return node; };
  const option = (value, label) => new Option(label, value);
  const format = value => Number.isFinite(value) ? value.toFixed(4) : '—';
  function table(node, caption, columns, rows) {
    node.replaceChildren(el('caption', caption));
    const head = el('thead'), hr = el('tr');
    ['Model', ...columns].forEach(label => { const th = el('th', label); th.scope = 'col'; hr.append(th); });
    head.append(hr); node.append(head);
    const body = el('tbody');
    const maxima = columns.map((_, i) => Math.max(...rows.map(row => Number.isFinite(row.values[i]) ? row.values[i] : -Infinity)));
    rows.forEach(row => {
      const tr = el('tr', null, row.ours ? 'ours' : '');
      const label = el('th', row.label); label.scope = 'row'; tr.append(label);
      row.values.forEach((value, i) => tr.append(el('td', format(value), Number.isFinite(value) && value === maxima[i] ? 'best' : '')));
      body.append(tr);
    });
    node.append(body);
  }
  function mountChart(root, entry, progress, success = null) {
    const svg = root.querySelector('.benchmark-chart');
    const node = (tag, attrs = {}, text) => {
      const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.entries(attrs).forEach(([k,v]) => n.setAttribute(k,v));
      if (text != null) n.textContent = text;
      return n;
    };
    svg.replaceChildren();
    const series = success ? [
      {key:'success', entry:success, color:'#206b5d', label:'Success'},
      {key:'failure', entry, color:'#b6532a', label:'Failure'}
    ] : [{key:'wsm', entry, color:'#206b5d', label:'PsiBorg'}];
    const xmax = Math.max(...series.map(s => s.entry.video_x.at(-1) || 1));
    const ymax = Math.max(1, Math.ceil(Math.max(...series.flatMap(s => s.entry.points.map(p => p.wsm)))));
    const X = x => 54 + Math.max(0,Math.min(xmax,x)) / xmax * 448;
    const Y = y => 340 - y / ymax * 306;
    svg.append(node('text',{x:54,y:19,class:'benchmark-axis'},'Δt (s)'));
    for (let i=0; i<=4; i++) {
      const value=ymax*i/4, y=Y(value), x=xmax*i/4;
      svg.append(node('line',{x1:54,x2:502,y1:y,y2:y,class:'dt-grid'}));
      svg.append(node('text',{x:45,y:y+4,'text-anchor':'end',class:'benchmark-axis'},Number(value.toFixed(1))));
      svg.append(node('text',{x:X(x),y:362,'text-anchor':'middle',class:'benchmark-axis'},progress ? Math.round(x*100) : Number(x.toFixed(1))));
    }
    svg.append(node('text',{x:278,y:389,'text-anchor':'middle',class:'benchmark-axis'},entry.x_label));
    const eventGroup=node('g');svg.append(eventGroup);
    const traces=series.map(({key,entry:source,color,label}) => {
      const path=node('path',{class:'benchmark-trace',stroke:color,'data-model':'wsm','data-series':key});
      if (key==='failure') path.setAttribute('stroke-dasharray','7 4');
      path.append(node('title',{},label));
      const dots=node('g',{'data-points':key,fill:color});
      svg.append(path,dots);return {key,source,path,dots,shown:-1};
    });
    const playhead=node('line',{y1:34,y2:340,stroke:'#94a59d','stroke-width':1});svg.append(playhead);
    return position => {
      root.dataset.graphX=position;
      traces.forEach(trace => {
        const {key,source,path,dots}=trace;
        const past=source.points.filter(p => p.x<=position+1e-7);
        if(trace.shown===past.length)return;
        trace.shown=past.length;
        path.setAttribute('d',past.map((p,i)=>`${i?'L':'M'}${X(p.x).toFixed(2)},${Y(p.wsm).toFixed(2)}`).join(' '));
        dots.replaceChildren(...(source.dense||source.points.length>64?past.slice(-1):past).map(p=>node('circle',{cx:X(p.x),cy:Y(p.wsm),r:3,'data-x':p.x})));
        root.querySelector(`.benchmark-${key}-value`).textContent=past.length?`${past.at(-1).wsm.toFixed(1)} s`:'—';
      });
      eventGroup.replaceChildren();
      entry.events.filter(e=>e.x<=position+1e-7).forEach(e=>{
        eventGroup.append(node('line',{x1:X(e.x),x2:X(e.x),y1:34,y2:340,class:'benchmark-event'}));
        eventGroup.append(node('text',{x:Math.min(X(e.x)+5,455),y:34,class:'benchmark-axis'},e.label));
      });
      playhead.setAttribute('x1',X(position));playhead.setAttribute('x2',X(position));
    };
  }
  function init(root, data) {
    const kind = root.dataset.benchmark, progress = kind === 'progress';
    const q = selector => root.querySelector(selector);
    const filter = q('.benchmark-filter'), episodes = q('.benchmark-episode'), video = q('video'), speed = q('.benchmark-speed');
    const entries = data[kind].map(entry => {
      if (progress || entry.outcome !== 'Successful' || !entry.id.includes('_original/')) return entry;
      // Keep branch metadata in the source data, but omit it from successful
      // original-arm clip names and graph annotations.
      return {...entry,
        title: entry.title.replace(/ · branch \d+%/i, ''),
        events: entry.events.filter(event => !/^branch$/i.test(event.label))
      };
    });
    const datasets = [...new Set(entries.map(e => e.dataset))].sort();
    // Pair each failure with its successful replay at the same branch and arm
    // configuration. Keep successful entries as references, not selectable clips.
    const selectable = progress ? entries : entries.filter(e => e.outcome === 'Incomplete');
    const byId = new Map(entries.map(e => [e.id,e]));
    const successFor = entry => {
      const reference = byId.get(entry.id.slice(0,entry.id.lastIndexOf('/'))+'/replay_control');
      if (!reference || reference.outcome !== 'Successful' || reference.goal !== entry.goal) {
        throw new Error('Matching successful replay is unavailable.');
      }
      return reference;
    };
    filter.append(option('all', progress ? 'All paired datasets' : 'All failures'));
    if (progress) datasets.forEach(name => filter.append(option(name, name)));
    else [50,70,90].filter(percent => selectable.some(e => e.id.startsWith(`b0${percent}_`)))
      .forEach(percent => filter.append(option(`branch${percent}`, `${percent}% branch`)));
    const models = Object.entries(data.models);
    const modelLabel = name => name.startsWith('PSI V2') ? 'PsiBorg V2 · 820k' : 'PsiBorg · 1040k (BF16)';
    function updateTable() {
      // Tables can be commented out independently while preserving all model results.
      if (!q('table')) return;
      if (progress) {
        const dataset = filter.value;
        const value = summary => dataset === 'all' ? summary.mean : summary.by_dataset[dataset];
        const rows = models.map(([name, m]) => ({label:modelLabel(name), ours:true, values:[value(m.public.public.fixed), value(m.public.paired.fixed)]}));
        rows.push({label:'Robometer · offline', values:[value(data.public_robometer.full), value(data.public_robometer.paired)]});
        rows.push({label:'DINOv2', values:[dataset === 'all' ? data.public_dino.dataset_macro_mean : data.public_dino.by_dataset[dataset], null]});
        const n = dataset === 'all' ? 72 : data.public_robometer.full.counts[dataset];
        const pairedN = dataset === 'all' ? 16 : (data.public_robometer.paired.counts[dataset] || 0);
        table(q('table'), `${dataset === 'all' ? 'Robometer public benchmark' : dataset} · ${n} episodes`, [`Single-view VOC ↑ (n=${n})`, `Paired-cohort VOC ↑ (n=${pairedN})`], rows);
        q('.benchmark-table-note').textContent = 'VOC measures correlation with episode progress; higher is better. Paired-cohort PsiBorg uses two cameras; Robometer retains its own offline protocol. — indicates an unavailable comparison. Videos show the agent view of the 16 paired-camera episodes; Δt curves still use both views. Tables retain the full benchmark and paired-cohort scores for the selected dataset.';
      } else {
        const rows = models.map(([name, m]) => ({label:modelLabel(name), ours:true, values:[m.abc.rgb.test.auroc, m.abc['rgb+rgblh'].test.auroc, m.abc['rgb+rgblh'].test.failure_f1]}));
        rows.push({label:'Robometer · success head', values:[data.abc_baselines['Robometer success'], null, null]});
        rows.push({label:'DINOv2', values:[data.abc_baselines.DINOv2, null, null]});
        rows.push({label:'Robometer · W5 detector*', values:[null, null, data.abc_detector_baselines[0].failure_f1]});
        table(q('table'), 'ABC simulation · all 72 held-out test continuations', ['Single-view AUROC ↑', 'Paired-view AUROC ↑', 'Failure F1 ↑'], rows);
        q('.benchmark-table-note').textContent = 'AUROC evaluates terminal success ranking. PsiBorg failure F1 uses paired views and a development-selected threshold. *Robometer W5 is a reconstruction of the paper’s detector. — indicates an unavailable comparison. Episode filters do not change this full-test-set table.';
      }
    }
    let active=null, updateChart=null;
    const scene=q('.benchmark-scene');
    const sceneContext=scene.getContext('2d');
    const playbackRate=()=>progress?Number(speed.value):2;
    let visible=false;
    scene.tabIndex=0;scene.setAttribute('role','button');scene.setAttribute('aria-label','Agent video: click or press Space to pause or resume');
    const toggle=()=>{if(video.paused)video.play().catch(()=>{});else video.pause();};
    const play=q('.benchmark-play');
    play.addEventListener('click',toggle);
    const updatePlay=()=>{play.textContent=video.paused?'▶':'Ⅱ';play.setAttribute('aria-label',video.paused?'Play video':'Pause video');};
    for(const event of ['play','pause','ended','emptied'])video.addEventListener(event,updatePlay);
    scene.addEventListener('click',toggle);scene.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();toggle();}});
    function paint(time=video.currentTime) {
      if (!active) return;
      if (video.readyState>=2) {
        const crop=active.cameras[0];
        sceneContext.drawImage(video,...crop,0,0,crop[2],crop[3]);
      }
      // Video callbacks may round 30 fps timestamps to microseconds.
      const frame=Math.max(0,Math.min(active.video_x.length-1,Math.floor(time*active.video_fps+1e-4)));
      updateChart(active.video_x[frame]);

      root.dataset.frame=frame;
    }
    function selectEpisode() {
      video.pause();
      active=selectable.find(e=>e.id===episodes.value);
      root.dataset.episode=active.id;
      const success = progress ? null : successFor(active);
      if (success) root.dataset.successEpisode=success.id;
      scene.width=active.cameras[0][2];scene.height=active.cameras[0][3];
      updateChart=mountChart(root,active,progress,success);updateChart(0);
      video.src=active.video;video.load();video.playbackRate=playbackRate();
      q('.benchmark-task').textContent=active.task;
      q('.benchmark-outcome').textContent=active.outcome;
      q('.benchmark-goal img').src=active.goal;
      q('.benchmark-goal img').alt=`Goal for ${active.task}`;
      q('.benchmark-goal').title=active.goal_description;
      q('.benchmark-description').textContent=active.description;
      q('.benchmark-status').textContent='';
    }
    function populate() {
      const selected = filter.value;
      const filtered = selectable.filter(e => selected === 'all' || (progress ? e.dataset === selected : e.id.startsWith(`b0${selected.slice(6)}_`)));
      episodes.replaceChildren(...filtered.map(e => option(e.id, e.title)));
      updateTable(); selectEpisode();
    }
    episodes.addEventListener('change', () => selectEpisode());
    filter.addEventListener('change', () => populate());
    if(speed)speed.addEventListener('change', () => { video.playbackRate=playbackRate(); });
    video.addEventListener('loadedmetadata', () => { video.playbackRate=playbackRate(); });
    video.addEventListener('loadeddata', () => { paint(); if (visible) { video.play().catch(()=>{}); } });
    video.addEventListener('seeked', () => paint());
    video.addEventListener('ended', () => paint());
    new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible&&video.readyState>=2)video.play().catch(()=>{});else if(!visible)video.pause();},{threshold:0.15}).observe(q('.benchmark-media'));
    if ('requestVideoFrameCallback' in video) {
      const frame=(_now,metadata)=>{paint(metadata.mediaTime);video.requestVideoFrameCallback(frame);};
      video.requestVideoFrameCallback(frame);
    } else {
      video.addEventListener('timeupdate',()=>paint());
    }
    video.addEventListener('error', () => { q('.benchmark-status').textContent = 'This video could not load. Choose another episode or refresh the page.'; });
    populate();
  }
  fetch('./assets/benchmarks/results.json', {cache:'no-store'}).then(response => {
    if (!response.ok) throw new Error('Benchmark data unavailable'); return response.json();
  }).then(data => document.querySelectorAll('[data-benchmark]').forEach(root => init(root, data))).catch(error => {
    document.querySelectorAll('.benchmark-status').forEach(node => { node.textContent = error.message; });
  });
})();
