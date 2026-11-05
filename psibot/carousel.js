(() => {
  'use strict';
  const section = document.querySelector('#results');
  if (!section) return;
  const tabs = [...section.querySelectorAll('[data-tab]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const controllers = new Map();
  let selectedTab = tabs.find(tab => tab.getAttribute('aria-selected') === 'true')?.dataset.tab || 'policy';
  const make = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const button = (cls, label, text) => {
    const node = make('button', cls, text);
    node.type = 'button'; node.setAttribute('aria-label', label);
    return node;
  };
  const setTab = (name, focus = false) => {
    if (!tabs.some(tab => tab.dataset.tab === name)) return;
    selectedTab = name;
    for (const tab of tabs) {
      const active = tab.dataset.tab === name;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) panel.hidden = !active;
      controllers.get(tab.dataset.tab)?.setActive(active);
      if (active && focus) tab.focus();
    }
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setTab(tab.dataset.tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault(); setTab(tabs[next].dataset.tab, true);
    });
  });
  setTab(selectedTab);

  function mount(root, entries) {
    if (!entries?.length) {
      root.textContent = 'No videos are available for this capability yet.';
      return {setActive() {}};
    }
    const name = root.dataset.carousel;
    let index = 0, entry = entries[0], active = false, visible = false;
    let generation = 0, frameRequest = null, initialized = false;
    let wantsPlay = !reduced.matches, lastPaintTime = 0, goalImage = null, posterImage = null;
    let plotMaxX = 1, plotMaxY = 1, lastReadout = '';
    const imageCache = new Map();
    const strip = make('div', 'carousel-strip');
    strip.setAttribute('aria-label', 'Choose a video');
    const navigation = make('div', 'carousel-nav');
    const previous = button('carousel-prev', 'Previous video', '←');
    const next = button('carousel-next', 'Next video', '→');
    const counter = make('span', 'carousel-counter');
    counter.setAttribute('role', 'status'); counter.setAttribute('aria-live', 'polite');
    navigation.append(previous, counter, next);
    const stage = make('div', 'carousel-stage');
    const video = make('video', 'carousel-video');
    video.hidden = true; video.muted = true; video.loop = true; video.playsInline = true;
    video.preload = 'metadata'; video.setAttribute('aria-hidden', 'true');
    const canvas = make('canvas', 'carousel-canvas');
    canvas.width = 1280; canvas.height = 720;
    canvas.setAttribute('role', 'img');
    const context = canvas.getContext('2d');
    stage.append(video, canvas);
    const controls = make('div', 'carousel-controls');
    const play = button('carousel-play', 'Play selected video', '▶ Play');
    const title = make('span', 'carousel-title');
    const readout = make('span', 'carousel-readout');
    controls.append(play, title, readout);
    const status = make('p', 'carousel-status');
    status.setAttribute('role', 'status');
    root.replaceChildren(strip, navigation, stage, controls, status);
    root.tabIndex = 0;
    root.setAttribute('aria-label', `${({policy: 'Policy and progress', simulation: 'Simulation', progress: 'Progress tracking', failure: 'Failure detection'}[name] || name)} video carousel`);
    root.setAttribute('aria-roledescription', 'carousel');

    function getImage(url) {
      if (!url) return Promise.resolve(null);
      if (!imageCache.has(url)) imageCache.set(url, new Promise(resolve => {
        const image = new Image();
        image.onload = () => resolve(image); image.onerror = () => resolve(null);
        image.src = url;
      }));
      return imageCache.get(url);
    }
    function paintCrop(ctx, source, crop, width, height) {
      if (!source || !crop) return;
      ctx.drawImage(source, ...crop, 0, 0, width, height);
    }
    function renderStrip() {
      const ticket = generation;
      strip.replaceChildren();
      for (const offset of [-1, 0, 1]) {
        const position = (index + offset + entries.length) % entries.length;
        const item = entries[position];
        const card = button(`carousel-card${offset === 0 ? ' is-current' : ''}`,
          `${offset === 0 ? 'Current video' : offset < 0 ? 'Previous video' : 'Next video'}: ${item.title}`);
        card.dataset.offset = String(offset);
        if (offset === 0) card.setAttribute('aria-current', 'true');
        const thumbnail = make('canvas', 'carousel-thumbnail');
        thumbnail.width = 640; thumbnail.height = 360;
        thumbnail.setAttribute('aria-hidden', 'true');
        const label = make('span', 'carousel-card-title', item.title);
        card.append(thumbnail, label);
        card.addEventListener('click', () => {
          if (offset) { select(position); strip.querySelector('[data-offset="0"]')?.focus(); }
          else toggle();
        });
        strip.append(card);
        getImage(item.poster).then(image => {
          if (!image || ticket !== generation) return;
          const ctx = thumbnail.getContext('2d');
          const crop = item.posterCrop || item.crop;
          ctx.fillStyle = '#080f16'; ctx.fillRect(0, 0, 640, 360);
          const ratio = crop[2] / crop[3], width = Math.min(640, 360 * ratio), height = width / ratio;
          ctx.drawImage(image, ...crop, (640 - width) / 2, (360 - height) / 2, width, height);
        });
      }
      counter.textContent = `${index + 1} / ${entries.length}`;
    }
    function updateButton() {
      play.textContent = video.paused ? '▶ Play' : 'Ⅱ Pause';
      play.setAttribute('aria-label', `${video.paused ? 'Play' : 'Pause'} ${entry.title}`);
    }
    const canPlay = () => active && visible && !document.hidden && wantsPlay;
    function syncPlayback() {
      if (!initialized) return;
      if (!canPlay()) { video.pause(); return; }
      if (video.readyState < 2) return;
      const ticket = generation;
      video.play().catch(error => {
        if (ticket !== generation || error.name === 'AbortError') return;
        wantsPlay = false;
        status.textContent = 'Press Play to start this video.';
        updateButton();
      });
    }
    function toggle() {
      wantsPlay = video.paused;
      syncPlayback();
    }
    play.addEventListener('click', toggle);
    previous.addEventListener('click', () => select(index - 1));
    next.addEventListener('click', () => select(index + 1));
    root.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault(); select(index + (event.key === 'ArrowRight' ? 1 : -1));
    });

    function reached(points, position, field) {
      let low = 0, high = points.length;
      while (low < high) {
        const mid = (low + high) >> 1;
        if (points[mid][field] <= position + 1e-7) low = mid + 1; else high = mid;
      }
      return low;
    }
    function roundRect(x, y, width, height, radius) {
      context.beginPath();
      if (context.roundRect) context.roundRect(x, y, width, height, radius);
      else context.rect(x, y, width, height);
    }
    function drawChart(time) {
      if (!entry.points?.length) { readout.textContent = ''; return; }
      const failure = entry.kind === 'failure';
      const frame = Math.max(0, Math.min((entry.video_x?.length || 1) - 1, Math.floor(time * entry.video_fps + 1e-4)));
      const position = failure ? entry.video_x[frame] : time;
      const field = failure ? 'x' : 'time';
      root.dataset.frame = String(Math.floor(time * entry.video_fps + 1e-4));
      root.dataset.graphX = String(position);
      const series = failure ? [
        {points: entry.success.points, color: '#76cfb0', label: 'Success'},
        {points: entry.points, color: '#f3a17e', label: 'Failure'}
      ] : [{points: entry.points, color: '#e8c27c', label: 'Δt'}];
      const narrow = root.clientWidth < 500;
      const width = canvas.width * (narrow ? .47 : .34);
      const height = canvas.height * (failure ? (narrow ? .34 : .32) : (narrow ? .36 : .31));
      const gap = canvas.width * .014;
      const left = failure ? gap : canvas.width - width - gap;
      const top = gap;
      const font = canvas.width * (narrow ? .036 : .018);
      context.save();
      roundRect(left, top, width, height, canvas.width * .009);
      context.fillStyle = 'rgba(8, 15, 22, .87)'; context.fill();
      context.strokeStyle = 'rgba(146,164,175,.3)'; context.lineWidth = 1; context.stroke();
      context.font = `500 ${font}px system-ui, sans-serif`;
      context.fillStyle = '#e8eef2'; context.textAlign = 'left';
      context.fillText('Δt (s)', left + gap, top + font + gap * .6);
      const plot = {left: left + gap * (narrow ? 1 : 2), right: left + width - gap, top: top + font * (narrow && failure ? 2.6 : 2.3), bottom: top + height - (narrow ? gap : font * 1.7)};
      const X = value => plot.left + Math.max(0, Math.min(plotMaxX, value)) / plotMaxX * (plot.right - plot.left);
      const Y = value => plot.bottom - Math.max(0, value) / plotMaxY * (plot.bottom - plot.top);
      context.lineWidth = canvas.width * .001;
      context.strokeStyle = '#26343e';
      for (let row = 0; row <= 2; row++) {
        const y = plot.bottom - (plot.bottom - plot.top) * row / 2;
        context.beginPath(); context.moveTo(plot.left, y); context.lineTo(plot.right, y); context.stroke();
      }
      if (!narrow) {
        context.fillStyle = '#92a4af'; context.font = `${font * .72}px system-ui, sans-serif`;
        context.fillText(String(Number(plotMaxY.toFixed(1))), left + gap * .5, plot.top + font * .4);
        context.fillText('0', left + gap * .7, plot.bottom);
        context.textAlign = 'center';
        context.fillText(failure ? 'Episode time (s)' : 'Clip time (s)', (plot.left + plot.right) / 2, top + height - font * .38);
      }
      const labels = [];
      for (let i = 0; i < series.length; i++) {
        const item = series[i], count = reached(item.points, position, field);
        const latest = count ? item.points[count - 1] : null;
        root.dataset[`${failure ? item.label.toLowerCase() : 'progress'}Points`] = String(count);
        root.dataset[`${failure ? item.label.toLowerCase() : 'progress'}ShownThrough`] = latest ? String(latest[field]) : '';
        root.dataset[`${failure ? item.label.toLowerCase() : 'progress'}Value`] = latest ? String(latest.value) : '';
        context.strokeStyle = item.color; context.lineWidth = canvas.width * .0017;
        context.setLineDash(failure && i === 1 ? [canvas.width * .005, canvas.width * .003] : []);
        context.beginPath();
        let lastSegment = null;
        for (let pointIndex = 0; pointIndex < count; pointIndex++) {
          const point = item.points[pointIndex];
          const x = X(point[field]), y = Y(point.value);
          if (pointIndex === 0 || point.segment !== lastSegment) context.moveTo(x, y); else context.lineTo(x, y);
          lastSegment = point.segment;
        }
        context.stroke(); context.setLineDash([]);
        if (latest) {
          context.beginPath(); context.arc(X(latest[field]), Y(latest.value), canvas.width * .003, 0, Math.PI * 2);
          context.fillStyle = item.color; context.fill();
        }
        const label = `${item.label} ${latest ? latest.value.toFixed(1) + ' s' : '—'}`;
        labels.push(label);
        context.fillStyle = item.color; context.textAlign = 'right';
        context.font = `500 ${font * (narrow ? (failure ? .9 : 1) : (failure ? .7 : .85))}px system-ui, sans-serif`;
        context.fillText(label, left + width - gap, top + font * (failure ? (i === 0 ? .95 : 1.85) : 1) + gap * .6);
      }
      if (failure) for (const event of entry.events || []) {
        if (event.x > position + 1e-7) continue;
        context.strokeStyle = '#92a4af'; context.setLineDash([4, 4]); context.lineWidth = 1;
        context.beginPath(); context.moveTo(X(event.x), plot.top); context.lineTo(X(event.x), plot.bottom); context.stroke();
        context.setLineDash([]);
      }
      const text = labels.join(' · ');
      if (text !== lastReadout) { readout.textContent = text; lastReadout = text; }
      context.restore();
    }
    function drawGoal() {
      if (!goalImage || entry.kind !== 'failure') return;
      const width = canvas.width * .22, height = width * goalImage.height / goalImage.width;
      const gap = canvas.width * .014, x = canvas.width - width - gap, y = gap;
      context.save(); context.drawImage(goalImage, x, y, width, height);
      context.strokeStyle = '#e8c27c'; context.lineWidth = canvas.width * .002;
      context.strokeRect(x, y, width, height);
      context.fillStyle = 'rgba(8,15,22,.85)'; context.fillRect(x, y + height, width, canvas.width * .028);
      context.fillStyle = '#e8eef2'; context.font = `${canvas.width * .018}px system-ui,sans-serif`;
      context.textAlign = 'center'; context.fillText('Goal', x + width / 2, y + height + canvas.width * .021);
      context.restore();
    }
    function paint(time = video.currentTime || 0) {
      lastPaintTime = time;
      context.fillStyle = '#080f16'; context.fillRect(0, 0, canvas.width, canvas.height);
      if (video.readyState >= 2 && video.currentSrc === new URL(entry.video, document.baseURI).href) {
        paintCrop(context, video, entry.crop, canvas.width, canvas.height);
      } else if (posterImage) paintCrop(context, posterImage, entry.posterCrop || entry.crop, canvas.width, canvas.height);
      drawChart(time); drawGoal();
      root.dataset.time = time.toFixed(4);
      root.dataset.currentTime = time.toFixed(4);
      root.dataset.frame = String(Math.floor(time * entry.video_fps + 1e-4));
    }
    function scheduleFrame() {
      if (!('requestVideoFrameCallback' in video) || frameRequest !== null || !active) return;
      const ticket = generation;
      frameRequest = video.requestVideoFrameCallback((_now, metadata) => {
        frameRequest = null;
        if (ticket !== generation || !active) return;
        paint(metadata.mediaTime); scheduleFrame();
      });
    }
    function cancelFrame() {
      if (frameRequest !== null) video.cancelVideoFrameCallback?.(frameRequest);
      frameRequest = null;
    }
    function select(position) {
      generation++; cancelFrame(); video.pause();
      wantsPlay = !reduced.matches;
      index = (position + entries.length) % entries.length; entry = entries[index];
      initialized = true; posterImage = null; goalImage = null; lastReadout = '';
      root.dataset.index = String(index); root.dataset.episode = entry.id;
      root.dataset.kind = entry.kind; root.dataset.count = String(entries.length);
      if (entry.success) root.dataset.successEpisode = entry.success.id; else delete root.dataset.successEpisode;
      title.textContent = entry.title;
      canvas.setAttribute('aria-label', `${entry.title}${entry.points?.length ? ': video with recorded time-to-goal predictions' : ''}`);
      canvas.height = Math.round(canvas.width * entry.crop[3] / entry.crop[2]);
      const series = entry.success ? [entry.points, entry.success.points] : [entry.points || []];
      plotMaxY = 1;
      for (const points of series) for (const point of points) plotMaxY = Math.max(plotMaxY, point.value);
      plotMaxY = Math.ceil(plotMaxY);
      plotMaxX = entry.kind === 'failure' ? Math.max(entry.video_x.at(-1), entry.success.video_x.at(-1)) : entry.duration;
      plotMaxX = Math.max(plotMaxX, .001);
      status.textContent = 'Loading video…';
      readout.textContent = '';
      video.src = entry.video; video.load(); video.playbackRate = entry.playbackRate || 1;
      paint(0); renderStrip(); updateButton(); scheduleFrame();
      const ticket = generation;
      getImage(entry.poster).then(image => {
        if (ticket !== generation) return;
        posterImage = image; paint(video.currentTime || 0);
      });
      getImage(entry.goal).then(image => {
        if (ticket !== generation) return;
        goalImage = image; paint(video.currentTime || 0);
      });
    }
    for (const event of ['play', 'pause', 'ended', 'emptied']) video.addEventListener(event, updateButton);
    video.addEventListener('loadedmetadata', () => { video.playbackRate = entry.playbackRate || 1; });
    video.addEventListener('loadeddata', () => { status.textContent = ''; paint(); syncPlayback(); scheduleFrame(); });
    video.addEventListener('canplay', () => { status.textContent = ''; syncPlayback(); });
    for (const event of ['seeked', 'pause', 'ended']) video.addEventListener(event, () => paint());
    if (!('requestVideoFrameCallback' in video)) video.addEventListener('timeupdate', () => paint());
    video.addEventListener('error', () => { status.textContent = 'This video could not load. Choose another example or refresh the page.'; updateButton(); });
    new IntersectionObserver(([change]) => { visible = change.isIntersecting; syncPlayback(); }, {threshold: .12}).observe(stage);
    document.addEventListener('visibilitychange', syncPlayback);
    reduced.addEventListener('change', () => { if (reduced.matches) wantsPlay = false; syncPlayback(); });
    new ResizeObserver(() => { if (initialized) paint(lastPaintTime); }).observe(stage);
    return {
      setActive(value) {
        active = value;
        if (active && !initialized) select(index);
        if (active) scheduleFrame(); else cancelFrame();
        syncPlayback();
      }
    };
  }
  fetch('./assets/carousel/catalog.json?v=b735c105731f').then(response => {
    if (!response.ok) throw Error('The video collection could not load. Refresh the page to try again.');
    return response.json();
  }).then(data => {
    for (const root of section.querySelectorAll('[data-carousel]')) controllers.set(root.dataset.carousel, mount(root, data[root.dataset.carousel]));
    setTab(selectedTab);
    section.dataset.carouselReady = 'true';
  }).catch(error => {
    for (const root of section.querySelectorAll('[data-carousel]')) {
      const message = make('p', 'carousel-status', error.message);
      message.setAttribute('role', 'status'); root.replaceChildren(message);
    }
  });
})();
