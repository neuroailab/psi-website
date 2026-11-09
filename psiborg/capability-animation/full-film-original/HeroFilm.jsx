import React from 'react';
import {
  AbsoluteFill, Easing, Freeze, Img,
  getRemotionEnvironment, interpolate, staticFile, useCurrentFrame,
} from 'remotion';

import {Story, asset, story, sourceFrameAt} from './Story';
import {GRID_ASSETS,GRID_SELECTIONS} from '../FourExampleGrid.mjs';

export const FPS = story.fps;
export const DURATION = story.duration_frames;
export const HERO_DISSOLVE_FRAMES = 24;
export const heroDimensions = (mobile = false) => mobile
  ? {width: 640, height: 560}
  : {width: 1920, height: 874};

export const SCENES = [
  {kind: 'overview', start: 0, end: story.timing.policy_focus},
  {kind: 'policy', start: story.timing.policy_focus, end: story.timing.simulation_focus},
  {kind: 'simulation', start: story.timing.simulation_focus, end: story.timing.progress_focus},
  {kind: 'progress', start: story.timing.progress_focus, end: story.timing.return_overview},
  {kind: 'overview-return', start: story.timing.return_overview, end: story.duration_frames},
];

// Omit theme in the website player to inherit the live page palette. Explicit
// themes give standalone renders the same colors as the website.
const THEMES = {
  dark: {
    '--paper': '#0b1117', '--surface': '#111c24', '--surface-raised': '#182934',
    '--ink': '#edf3f5', '--muted': '#9aafb9', '--line': '#263640',
    '--accent': '#79e3d5', '--policy': '#83bfff', '--progress': '#f2c579',
    '--hero-feature-shadow': '0 12px 32px -8px rgba(0,0,0,.4)',
  },
  light: {
    '--paper': '#fbfaf7', '--surface': '#fbfaf7', '--surface-raised': '#edf3f4',
    '--ink': '#182d36', '--muted': '#576f7b', '--line': '#d5e0e5',
    '--accent': '#096e69', '--policy': '#246cb2', '--progress': '#94600c',
    '--hero-feature-shadow': '0 8px 18px -8px #172a3029',
  },
};
const C = {
  ink: 'var(--ink, #182d36)', muted: 'var(--muted, #576f7b)',
  line: 'var(--line, #d5e0e5)', surface: 'var(--surface, #fbfaf7)',
  policy: 'var(--accent, #096e69)', simulation: 'var(--policy, #246cb2)',
  progress: 'var(--progress, #94600c)',
};
const DATA = {
  policy: {heading: 'Execute from one goal image'},
  simulation: {heading: 'Imagine possible futures'},
  progress: {heading: 'Track progress'},
};
const kinds = Object.keys(DATA);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const ease = (f, start, duration) => interpolate(f, [start, start + duration], [0, 1], {
  ...clamp, easing: Easing.inOut(Easing.cubic),
});
const videoStyle = {display: 'block', width: '100%', height: '100%', objectFit: 'contain'};

function defaultMark() {
  return getRemotionEnvironment().isRendering
    ? staticFile('assets/capability-film/psi-mark.svg')
    : new URL('./assets/capability-film/psi-mark.svg', document.baseURI).href;
}

function Hub({mobile, markSrc}) {
  const size = mobile ? 74 : 96;
  return <div data-hub="all" data-model-logo="true" style={{
    position: 'absolute', left: (heroDimensions(mobile).width - size) / 2,
    top: mobile ? 10 : 24, width: size, height: size,
  }}>
    <Img src={markSrc || defaultMark()} alt="Psi model" style={{
      display: 'block', width: '100%', height: '100%', objectFit: 'contain',
    }}/>
  </div>;
}

function Connections({mobile, opacity}) {
  const f = useCurrentFrame();
  const dimensions = heroDimensions(mobile);
  const branches = mobile ? [
    {x: 164, y: 110, d: 'M320 92 C320 103 164 97 164 110'},
    {x: 476, y: 110, d: 'M320 92 C320 103 476 97 476 110'},
    {x: 320, y: 330, d: 'M320 92 L320 330'},
  ] : kinds.map((kind, i) => {
    const x = 358 + i * 602;
    return {x, y: 204, d: `M960 126 C960 177 ${x} 158 ${x} 204`};
  });
  return <svg {...dimensions} style={{position: 'absolute', inset: 0, opacity}} aria-hidden="true">
    {kinds.map((kind, i) => {
      const {x, y, d} = branches[i];
      return <g key={kind}>
        <path d={d} fill="none" stroke={C[kind]} strokeWidth={mobile ? 1.5 : 2} opacity=".3"/>
        <path d={d} fill="none" stroke={C[kind]} strokeWidth={mobile ? 2 : 3}
          pathLength="1" strokeDasharray=".09 .91"
          strokeDashoffset={-((f / 90 + i / 3) % 1)} opacity=".85"/>
        <circle cx={x} cy={y} r={mobile ? 3 : 4} fill={C[kind]}/>
      </g>;
    })}
  </svg>;
}

function OpeningGrid({kind}) {
  return <div data-opening-grid={kind} data-grid-playing={false} data-grid-source-frame={0}
    data-grid-kind={kind} data-grid-tile-count={GRID_SELECTIONS[kind].length} data-grid-tiles={GRID_SELECTIONS[kind].join(',')}
    style={{position:'relative',width:'100%',height:'100%'}}>
    <Img src={asset(GRID_ASSETS[kind].replace(/\.mp4$/,'.jpg'))} style={videoStyle}/>
  </div>;
}

function Overview({mobile, markSrc, hideOpeningPolicyHeading=false, hideOpeningHeading, hideOpeningGrid, hideHub=false, hideOpeningHeadings=false}) {
  const f = useCurrentFrame();
  const appear = .35 + .65 * ease(f, 0, 20);
  const mobilePositions = [[24, 120], [336, 120], [180, 340]];
  return <>
    {!hideHub && <Hub mobile={mobile} markSrc={markSrc}/>}
    <Connections mobile={mobile} opacity={appear}/>
    {kinds.map((kind, i) => {
      const d = DATA[kind];
      const policy = kind === 'policy';
      const width = mobile ? 280 : 572;
      return <div key={kind} data-opening-panel={kind} style={{
        position: 'absolute', left: mobile ? mobilePositions[i][0] : 72 + i * 602,
        top: mobile ? mobilePositions[i][1] : 226, width, opacity: appear,
        transform: `translateY(${(1 - ease(f, 0, 24)) * (mobile ? 5 : 10)}px)`,
      }}>
        <div aria-label={policy ? d.heading : undefined} style={{
          fontSize: mobile ? 21 : 31,
          lineHeight: mobile ? (policy ? '23px' : '24px') : '36px',
          height: mobile ? 46 : 36,
          fontWeight: 600, color: C[kind], letterSpacing: mobile ? -.45 : -.7,
          textAlign: 'center', whiteSpace: mobile && policy ? 'pre-line' : 'nowrap',
          opacity:hideOpeningHeadings || (policy && hideOpeningPolicyHeading) || hideOpeningHeading===kind ? 0 : 1,
        }}>{mobile && policy ? d.heading.replace(' one ', '\none ') : d.heading}</div>
        <div data-opening-grid-container={kind} data-opening-grid-hidden={hideOpeningGrid===kind} style={{
          marginTop: mobile ? 6 : 27, width, height: mobile ? 160 : 327,
          overflow: 'hidden', borderRadius: mobile ? 6 : 10,opacity:hideOpeningGrid===kind?0:1,
        }}><OpeningGrid kind={kind}/></div>
      </div>;
    })}

  </>;
}

function Rail({mobile, sourceFrame}) {
  const frame = useCurrentFrame();
  const f = sourceFrame ?? frame;
  const current = SCENES.find(scene => f >= scene.start && f < scene.end);
  return <div aria-hidden="true" style={{
    position: 'absolute', left: mobile ? 16 : 72, right: mobile ? 16 : 72,
    bottom: mobile ? 3 : 4, display: 'flex', gap: mobile ? 4 : 10,
  }}>
    {SCENES.map(scene => <div key={scene.kind} style={{
      height: mobile ? 2 : 3, flex: scene.end - scene.start,
      background: C.line, borderRadius: 3, overflow: 'hidden',
    }}><div style={{
      height: '100%', width: `${interpolate(f, [scene.start, scene.end], [0, 100], clamp)}%`,
      background: C[scene.kind] || C.policy, opacity: current === scene ? 1 : .5,
    }}/></div>)}
  </div>;
}

/** Shared website player / standalone composition, with one global story clock. */
export function HeroFilm({mobile = false, theme, markSrc, showFocusHeading = true, hideOpeningPolicyHeading=false,
  hideOpeningHeading,hideOpeningGrid,hideHub=false,hideOpeningHeadings=false,sourceStart=0,playbackRate=1}) {
  const f = sourceFrameAt(useCurrentFrame(), sourceStart, playbackRate);
  const handoff = story.timing.policy_focus;
  const dimensions = heroDimensions(mobile);
  const palette = THEMES[theme];
  return <AbsoluteFill data-hero-film={mobile ? 'mobile' : 'desktop'} style={{
    ...palette, color: C.ink, overflow: 'hidden',
    fontFamily: 'Arial, Helvetica, sans-serif',
    background: palette ? 'var(--paper)' : 'transparent',
  }}>
    {f < handoff + HERO_DISSOLVE_FRAMES && <AbsoluteFill style={{
      opacity: 1 - ease(f, handoff, HERO_DISSOLVE_FRAMES),
    }}>
      <Freeze frame={handoff - 1} active={f >= handoff}>
        <Overview mobile={mobile} markSrc={markSrc} hideOpeningPolicyHeading={hideOpeningPolicyHeading}
          hideOpeningHeading={hideOpeningHeading} hideOpeningGrid={hideOpeningGrid} hideHub={hideHub} hideOpeningHeadings={hideOpeningHeadings}/>
      </Freeze>
    </AbsoluteFill>}
    {f >= handoff && <div data-original-story-frame={f} style={{
      position: 'absolute', left: 0, top: mobile ? 55 : 0,
      width: dimensions.width, height: mobile ? 450 : dimensions.height,
      opacity: ease(f, handoff, HERO_DISSOLVE_FRAMES),
    }}><Story mobile={mobile} showFocusHeading={showFocusHeading}
      sourceStart={sourceStart} playbackRate={playbackRate}/></div>}
    <Rail mobile={mobile} sourceFrame={f}/>
  </AbsoluteFill>;
}
