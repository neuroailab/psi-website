import React, {useState, useCallback} from 'react';
import {AbsoluteFill, Easing, Freeze, Img, Loop, OffthreadVideo, Sequence,
  getRemotionEnvironment, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import story from './story.json';

export {story};
const T = story.timing;
const W = 1248, H = 714, LABEL_H = 132, TOP = 14;
const OVERVIEW_SCALE = 620 / W;
const kinds = ['policy', 'simulation', 'progress'];
const headings = {
  policy: 'Execute from one goal image',
  simulation: 'Imagine possible futures',
  progress: 'Track progress'
};
const colors = {
  policy: 'var(--accent)', simulation: 'var(--policy)', progress: 'var(--progress)'
};
const ease = (f, start, duration) => interpolate(f, [start, start + duration], [0, 1], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)
});
const mix = (a, b, p) => a + (b - a) * p;
export const sourceFrameAt = (frame, sourceStart = 0, playbackRate = 1) =>
  sourceStart + Math.floor(frame * playbackRate);

// Place each clip on the live composition clock. A fixed fractional trim keeps
// noninteger retiming boundaries aligned without seeking on every frame.
export function clipClock(clip, start, sourceStart = 0, playbackRate = 1) {
  const sequenceStart = Math.max(0, Math.ceil((start - sourceStart) / playbackRate));
  const trimBefore = Math.max(0, sourceStart + sequenceStart * playbackRate - start);
  return {sequenceStart, trimBefore, finalFrame: (clip.frames - 1 - trimBefore) / playbackRate};
}

// Shared by the composition and its responsive viewport; no frame is cropped.
export function layoutAt(f, mobile = false) {
  const focus = {
    policy: ease(f, T.policy_focus, 36) * (1 - ease(f, T.simulation_focus, 36)),
    simulation: ease(f, T.simulation_focus, 36) * (1 - ease(f, T.progress_focus, 36)),
    progress: ease(f, T.progress_focus, 36) * (1 - ease(f, T.return_overview, 36))
  };
  if (mobile) {
    // A compact overview fits all three capabilities in the same phone viewport.
    // Each chapter expands into this area; hidden grids stay decoded for handoffs.
    const positions = [[16, 14], [328, 14], [172, 232]];
    const panels = kinds.map((kind, i) => {
      const own = focus[kind];
      const other = Math.max(...kinds.filter(k => k !== kind).map(k => focus[k]));
      const entry = spring({fps: story.fps, frame: f - T[kind + '_in'], config: {
        damping: 22, stiffness: 130, mass: .9
      }, durationInFrames: 32});
      return {kind, own,
        opacity: ease(f, T[kind + '_in'], 20) * (1 - other),
        left: mix(positions[i][0], 16, own) + (1 - entry) * 8,
        top: mix(positions[i][1], TOP, own),
        scale: mix(296 / W, 608 / W, own) * mix(.985, 1, entry)
      };
    });
    return {panels, height: 450, width: 640, mobile: true};
  }
  const overviewScale = mobile ? 608 / W : OVERVIEW_SCALE;
  const panelHeight = (H + LABEL_H) * overviewScale;
  const mobileFocus = Math.max(...Object.values(focus));
  const panels = kinds.map((kind, i) => {
    const own = focus[kind];
    const other = Math.max(...kinds.filter(k => k !== kind).map(k => focus[k]));
    const entry = spring({fps: 30, frame: f - T[kind + '_in'], config: {
      damping: 22, stiffness: 130, mass: .9
    }, durationInFrames: 32});
    const opacity = ease(f, T[kind + '_in'], 20) * (1 - other);
    return {kind, own, opacity,
      left: mobile ? 16 : mix(16 + i * 632, 336, own),
      top: TOP + (mobile ? i * (panelHeight + 20) * (1 - mobileFocus) : 0) + (1 - entry) * 36,
      scale: (mobile ? overviewScale : mix(overviewScale, 1, own)) * mix(.985, 1, entry)
    };
  });
  const minimum = mobile
    ? TOP * 2 + panelHeight + 2 * (panelHeight + 20) * (1 - mobileFocus)
    : TOP * 2 + panelHeight;
  const height = Math.ceil(Math.max(minimum, ...panels.filter(p => p.opacity > .001)
    .map(p => p.top + (H + LABEL_H) * p.scale + TOP)));
  return {panels, height, width: mobile ? 640 : story.width, mobile};
}

export const asset = src => {
  const name = src.split('/').at(-1);
  return getRemotionEnvironment().isRendering
    ? staticFile(`assets/capability-film/${name}`)
    : new URL(`./assets/capability-film/${name}`, document.baseURI).href;
};
const videoStyle = {width: '100%', height: '100%', objectFit: 'contain', display: 'block'};

function GridVideo({kind, playbackRate = 1, trimBefore = 0}) {
  const [ready, setReady] = useState(false);
  const src = asset(story[kind + '_grid']), poster = src.replace(/\.mp4$/, '.jpg');
  const decoded = useCallback(video => {
    if (video.readyState >= 2 && video.videoWidth > 0) setReady(true);
  }, []);
  if (getRemotionEnvironment().isRendering) return <OffthreadVideo muted src={src}
    playbackRate={playbackRate} trimBefore={trimBefore} style={videoStyle}/>;
  return <div data-grid={kind} data-video-ready={ready} data-grid-playback-rate={playbackRate}
    data-grid-source-offset={trimBefore} style={{position: 'relative', width: '100%', height: '100%'}}>
    <OffthreadVideo muted playsInline pauseWhenBuffering preload="auto" poster={poster} src={src}
      playbackRate={playbackRate} trimBefore={trimBefore}
      onCanPlay={e => decoded(e.currentTarget)} onVideoFrame={decoded}
      style={{...videoStyle, opacity: ready ? 1 : 0}}/>
    {!ready && <Img data-grid-poster={kind} src={poster} style={{...videoStyle, position: 'absolute', inset: 0}}/>}
  </div>;
}

function Clip({clip, start, f, sourceStart = 0, playbackRate = 1}) {
  if (f < start) return <Img src={asset(clip.poster)} style={videoStyle}/>;
  const clock = clipClock(clip, start, sourceStart, playbackRate);
  // Keep the decoded video mounted when playback ends and the tile shrinks.
  return <Sequence from={clock.sequenceStart} layout="none">
    <Freeze frame={clock.finalFrame} active={f >= start + clip.frames}>
      <OffthreadVideo muted poster={asset(clip.poster)} src={asset(clip.asset)}
        playbackRate={playbackRate} trimBefore={clock.trimBefore} style={videoStyle}/>
    </Freeze>
  </Sequence>;
}

function Placeholder() {
  return <div className="psi-hero-placeholder" style={{width: '100%', height: '100%',
    background: 'var(--surface, #edf3f4)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: 'var(--line, #d5e0e5)', fontSize: 80, fontFamily: 'Georgia'}}>Ψ</div>;
}

function Feature({kind, f, cycle, color, sourceStart = 0, playbackRate = 1}) {
  const {tile, highlight, expand, play, collapse, end} = cycle;
  if (f < highlight || f >= end) return null;
  const grow = ease(f, expand, 20) * (1 - ease(f, collapse, 18));
  const x = (tile % 3) * 420, y = Math.floor(tile / 3) * 242;
  const outline = ease(f, highlight, 8) * (1 - ease(f, expand, 15));
  const reveal = ease(f, expand, 5) * (1 - ease(f, end - 5, 5));
  const spotlight = .34 * ease(f, highlight, 10) * (1 - ease(f, expand, 20));
  const featureBox = {position: 'absolute', left: mix(x, 0, grow), top: mix(y, 0, grow),
    width: mix(408, W, grow), height: mix(230, H, grow), borderRadius: mix(8, 12, grow)};
  return <>
    {spotlight > .001 && <div data-spotlight={tile} aria-hidden="true"
      style={{position: 'absolute', inset: 0, opacity: spotlight, pointerEvents: 'none'}}>
      {Array.from({length: 9}, (_, index) => index !== tile && <div key={index}
        style={{position: 'absolute', left: (index % 3) * 420, top: Math.floor(index / 3) * 242,
          width: 408, height: 230, borderRadius: 8, background: 'var(--paper, #fbfaf7)'}}/>)}
    </div>}
    <svg data-highlight={tile} style={{position: 'absolute', left: x - 4, top: y - 4,
      width: 416, height: 238, overflow: 'visible', opacity: outline, pointerEvents: 'none'}}>
      <rect x="2" y="2" width="412" height="234" rx="10" fill="none" stroke={color}
        strokeWidth="2.5" strokeLinecap="round" pathLength="1" strokeDasharray="1"
        strokeDashoffset={1 - ease(f, highlight, 15)}/>
    </svg>
    {grow > .001 && <div aria-hidden="true" style={{...featureBox, opacity: grow * reveal,
      boxShadow: 'var(--hero-feature-shadow, 0 8px 18px -8px #172a3029)', pointerEvents: 'none'}}/>}
    {reveal > .001 && <div data-feature={tile} data-stage={f < play ? 'expand' : f < collapse ? 'play' : 'return'}
      data-feature-kind={kind} data-feature-source-frame={f}
      data-feature-media-frame={Math.max(0, Math.min(story[kind]?.[tile]?.frames - 1, f - play))}
      data-feature-playback-rate={playbackRate} data-feature-final-hold={f >= play + (story[kind]?.[tile]?.frames || 0)}
      style={{...featureBox, opacity: reveal, overflow: 'hidden', background: 'transparent'}}>
      {story[kind]?.[tile]?.asset ? <Clip clip={story[kind][tile]} start={play} f={f}
        sourceStart={sourceStart} playbackRate={playbackRate}/> : <Placeholder/>}
    </div>}
  </>;
}

export function Grid({kind, sourceStart = 0, playbackRate = 1, snapshotSrc}) {
  const id = `psi-hero-grid-${kind}`;
  const sourceFrames = story.grid_frames?.[kind] || story.duration_frames;
  const offset = ((sourceStart % sourceFrames) + sourceFrames) % sourceFrames;
  const firstDuration = (sourceFrames - offset) / playbackRate;
  const loopDuration = sourceFrames / playbackRate;
  const repeating = <Loop durationInFrames={loopDuration} layout="none">
    <GridVideo kind={kind} playbackRate={playbackRate}/>
  </Loop>;
  return <>
    <svg width="0" height="0" aria-hidden="true" style={{position: 'absolute'}}>
      <defs><clipPath id={id} clipPathUnits="userSpaceOnUse">
        {Array.from({length: 9}, (_, tile) => <rect key={tile} x={(tile % 3) * 420}
          y={Math.floor(tile / 3) * 242} width="408" height="230" rx="8"/>)}
      </clipPath></defs>
    </svg>
    <div style={{width: W, height: H, clipPath: `url(#${id})`}}>
      {snapshotSrc ? <Img src={snapshotSrc} data-grid-snapshot={kind} style={videoStyle}/>
        : offset === 0 ? repeating : <>
        <Sequence durationInFrames={firstDuration} layout="none">
          <GridVideo kind={kind} playbackRate={playbackRate} trimBefore={offset}/>
        </Sequence>
        <Sequence from={firstDuration} layout="none">{repeating}</Sequence>
      </>}
      {kind === 'simulation' && story.simulation.map((clip, tile) => !clip?.asset &&
        <div key={tile} style={{position: 'absolute', left: (tile % 3) * 420,
          top: Math.floor(tile / 3) * 242, width: 408, height: 230}}><Placeholder/></div>)}
    </div>
  </>;
}

export function Story({mobile = false, showFocusHeading = true, sourceStart = 0, playbackRate = 1}) {
  const f = sourceFrameAt(useCurrentFrame(), sourceStart, playbackRate);
  const layout = layoutAt(f, mobile);
  return <AbsoluteFill style={{background: 'transparent', fontFamily: 'inherit',
    color: 'var(--ink, #172a30)', overflow: 'hidden'}}>
    <AbsoluteFill style={{opacity: 1 - ease(f, story.duration_frames - 12, 11)}}>
      {layout.panels.filter(panel => panel.opacity > 0).map(({kind, own, opacity, left, top, scale}) => {
        const cycle = story.chapters[kind].cycles.find(c => f >= c.highlight && f < c.end);
        const expansion = cycle ? ease(f, cycle.expand, 20) * (1 - ease(f, cycle.collapse, 18)) : 0;
        const titleEntry = mobile ? 1 : ease(f, T[kind + '_in'] + 4, 24);
        const accentEntry = mobile ? 1 : ease(f, T[kind + '_in'] + 12, 28);
        const mobilePolicy = mobile && kind === 'policy';
        const labelVisibility = showFocusHeading ? 1 : 1 - own;
        return <div key={kind} data-panel={kind} aria-hidden={mobile && opacity === 0 ? true : undefined}
          style={{position: 'absolute', left, top: top + LABEL_H * scale * (1 - labelVisibility) / 2,
          width: W, height: H + LABEL_H * labelVisibility, transform: `scale(${scale})`, transformOrigin: 'top left',
          opacity, zIndex: Math.round(own * 100) + kinds.indexOf(kind)}}>
          {labelVisibility > 0 && <div style={{position: 'relative', height: LABEL_H * labelVisibility, overflow:'hidden'}}>
            <div className="psi-hero-title" aria-label={mobilePolicy ? headings[kind] : undefined}
              style={{fontSize: mobile ? mix(mobilePolicy ? 64 : 76, 60, own) : 60,
              lineHeight: mobilePolicy ? 1 : 1.2, fontWeight: 560,
              textAlign: 'center', whiteSpace: mobilePolicy ? 'pre-line' : 'nowrap', letterSpacing: -1,
              color: 'var(--ink, #172a30)', opacity: titleEntry * labelVisibility,
              transform: `translateY(${(1 - titleEntry) * 12}px)`}}>
              {mobilePolicy ? headings[kind].replace(' from ', '\nfrom ') : headings[kind]}
            </div>
            <div aria-hidden="true" style={{position: 'absolute', left: (W - 112) / 2,
              top: mobilePolicy ? mix(128, 124, own) : 100,
              width: 112, height: 3, borderRadius: 2, background: colors[kind],
              opacity: .75 * accentEntry * labelVisibility, transform: `scaleX(${accentEntry})`, transformOrigin: 'center'}}/>
          </div>}
          <div style={{position: 'relative', width: W, height: H}}>
            <div style={{position: 'absolute', inset: 0, opacity: 1 - expansion}}>
              <Grid kind={kind} sourceStart={sourceStart} playbackRate={playbackRate}/>
            </div>
            {cycle && <Feature kind={kind} f={f} cycle={cycle} color={colors[kind]}
              sourceStart={sourceStart} playbackRate={playbackRate}/>}
          </div>
        </div>;
      })}
    </AbsoluteFill>
  </AbsoluteFill>;
}
