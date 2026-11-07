import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player} from '@remotion/player';
import {PromptFilm, getPromptDimensions, getPromptState, promptTiming} from './PromptFilm';

const mount = document.getElementById('prompt-feature-player');
function PromptPlayer() {
  const playerRef = useRef(null);
  const [width, setWidth] = useState(() => Math.max(1, Math.round(mount.clientWidth)));
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');
  const [reduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const mobile = width < 600;
  const {height} = getPromptDimensions({mode: 'full', width, mobile});
  useLayoutEffect(() => {mount.style.height = `${height}px`;}, [height]);
  const inputProps = useMemo(() => ({mode: 'full', width, mobile, theme,
    assetBase: new URL('./assets/trajectory/', document.baseURI).href,
    markSrc: new URL('./assets/psi-mark.svg', document.baseURI).href}), [width, mobile, theme]);
  useEffect(() => {
    const player = playerRef.current;
    const root = mount.closest('.trajectory-film');
    const toggle = root.querySelector('.trajectory-play');
    const replay = root.querySelector('.trajectory-replay');
    const note = root.querySelector('.trajectory-note');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let manualPause = false, manualMotion = false, visible = true;
    window.psiPromptPlayer = player;
    window.psiPromptTiming = promptTiming;
    const updateControl = () => {
      const playing = player.isPlaying();
      toggle.textContent = playing ? 'Ⅱ' : '▶';
      toggle.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} animation`);
      toggle.setAttribute('aria-controls', 'prompt-feature-player');
      replay.setAttribute('aria-controls', 'prompt-feature-player');
    };
    const updateFrame = event => {
      const frame = event.detail.frame;
      const state = getPromptState(frame);
      Object.assign(root.dataset, {filmTime: (frame / 30).toFixed(2), filmPhase: state.phase,
        capability: state.capability, capabilityRows: String(state.rows), modelCount: state.rows ? '1' : '0',
        rgbSamples: '4,8,12,16', introSpeed: '2', actionLoop: 'true', revealSpacingFrames: '15'});
      mount.dataset.frame = String(frame);
    };
    const sync = () => {
      if (document.hidden || !visible || manualPause || (motion.matches && !manualMotion)) player.pause();
      else {try {player.play();} catch (_) {note.textContent = 'Press Play to watch.';}}
      updateControl();
    };
    const onToggle = () => {
      if (player.isPlaying()) manualPause = true;
      else {
        manualPause = false;
        if (motion.matches && !manualMotion) {manualMotion = true; player.seekTo(0);}
      }
      sync();
    };
    const onReplay = () => {manualPause = false; manualMotion = true; player.seekTo(0); sync();};
    const onMotion = () => {manualMotion = false; manualPause = false; if (motion.matches) player.seekTo(157); sync();};
    const onError = () => {note.textContent = 'The animation could not load. Reload to try again.';};
    const resize = new ResizeObserver(() => setWidth(Math.max(1, Math.round(mount.clientWidth))));
    const themes = new MutationObserver(() => setTheme(document.documentElement.dataset.theme || 'dark'));
    const visibility = new IntersectionObserver(entries => {visible = entries[0].isIntersecting; sync();}, {threshold: .05});
    resize.observe(mount);
    themes.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
    visibility.observe(root);
    player.addEventListener('frameupdate', updateFrame);
    player.addEventListener('play', updateControl);
    player.addEventListener('pause', updateControl);
    player.addEventListener('error', onError);
    toggle.addEventListener('click', onToggle);
    replay.addEventListener('click', onReplay);
    document.addEventListener('visibilitychange', sync);
    motion.addEventListener('change', onMotion);
    if (motion.matches) player.seekTo(157);
    updateFrame({detail: {frame: player.getCurrentFrame()}}); sync();
    return () => {
      resize.disconnect(); themes.disconnect(); visibility.disconnect();
      player.removeEventListener('frameupdate', updateFrame);
      player.removeEventListener('play', updateControl);
      player.removeEventListener('pause', updateControl);
      player.removeEventListener('error', onError);
      toggle.removeEventListener('click', onToggle);
      replay.removeEventListener('click', onReplay);
      document.removeEventListener('visibilitychange', sync);
      motion.removeEventListener('change', onMotion);
    };
  }, []);
  return <Player ref={playerRef} component={PromptFilm} durationInFrames={promptTiming.durationInFrames.full}
    fps={promptTiming.fps} compositionWidth={width} compositionHeight={height} inputProps={inputProps}
    autoPlay={!reduced} loop initiallyMuted controls={false} clickToPlay={false}
    doubleClickToFullscreen={false} showVolumeControls={false}
    style={{width: '100%', height, background: 'transparent'}}/>;
}
if (mount) createRoot(mount).render(<PromptPlayer/>);
