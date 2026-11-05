import React, {useRef, useState, useEffect, useMemo} from 'react';
import {createRoot} from 'react-dom/client';
import {Player} from '@remotion/player';
import {Story, story, layoutAt} from './Story';

const mount = document.getElementById('hero-feature-player');
// Reserve one mobile panel or the desktop zoom bounds for the entire loop.
// Capability changes never reflow the surrounding article.
const stageHeight = mobile => mobile ? 450 : 874;
function HeroPlayer() {
  const ref = useRef(null);
  const [mobile, setMobile] = useState(() => mount.clientWidth < 600);
  const mobileRef = useRef(mobile);
  mobileRef.current = mobile;
  const height = stageHeight(mobile);
  const inputProps = useMemo(() => ({mobile}), [mobile]);
  const width = mobile ? 640 : story.width;
  useEffect(() => {
    const player = ref.current;
    const root = mount.closest('.hero-feature');
    const controls = root.querySelector('.hero-feature-controls');
    const toggle = root.querySelector('.hero-feature-play');
    const replay = root.querySelector('.hero-feature-replay');
    const status = root.querySelector('.hero-feature-status');
    let manualPause = false;
    window.psiHeroPlayer = player;
    window.psiHeroStory = story;
    window.psiHeroLayout = (frame, narrow = mobileRef.current) => layoutAt(frame, narrow);
    controls.hidden = false;
    const updateControl = () => {
      const playing = player.isPlaying();
      toggle.querySelector('[aria-hidden]').textContent = playing ? 'Ⅱ' : '▶';
      toggle.querySelector('.hero-feature-play-label').textContent = playing ? 'Pause' : 'Play';
      toggle.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} PsiBorg animation`);
      toggle.setAttribute('aria-controls', 'hero-feature-player');
      replay.setAttribute('aria-controls', 'hero-feature-player');
    };
    const updateFrame = event => {
      const frame = event.detail.frame;
      const nextHeight = stageHeight(mobileRef.current);
      mount.dataset.frame = frame;
      mount.dataset.height = nextHeight;
    };
    const tryPlay = () => {
      if (manualPause || document.hidden) return;
      status.textContent = '';
      try { player.play(); } catch (_) { status.textContent = 'Press Play to watch.'; }
    };
    const onToggle = () => {
      manualPause = player.isPlaying();
      if (manualPause) player.pause(); else tryPlay();
    };
    const onReplay = () => {manualPause = false; player.seekTo(0); tryPlay();};
    const onVisibility = () => {if (document.hidden) player.pause(); else tryPlay();};
    const onError = () => {status.textContent = 'The animation could not load. Reload to try again.';};
    const resize = new ResizeObserver(() => {
      const narrow = mount.clientWidth < 600;
      mobileRef.current = narrow;
      setMobile(narrow);
      const nextHeight = stageHeight(narrow);
      mount.dataset.height = nextHeight;
      mount.dataset.compositionWidth = narrow ? 640 : story.width;
      mount.dataset.mobile = String(narrow);
    });
    resize.observe(mount);
    player.addEventListener('frameupdate', updateFrame);
    player.addEventListener('play', updateControl);
    player.addEventListener('pause', updateControl);
    player.addEventListener('error', onError);
    toggle.addEventListener('click', onToggle);
    replay.addEventListener('click', onReplay);
    document.addEventListener('visibilitychange', onVisibility);
    updateControl(); tryPlay();
    return () => {
      player.removeEventListener('frameupdate', updateFrame);
      player.removeEventListener('play', updateControl);
      player.removeEventListener('pause', updateControl);
      player.removeEventListener('error', onError);
      toggle.removeEventListener('click', onToggle);
      replay.removeEventListener('click', onReplay);
      document.removeEventListener('visibilitychange', onVisibility);
      resize.disconnect();
    };
  }, []);
  return <Player ref={ref} component={Story} durationInFrames={story.duration_frames}
    fps={story.fps} compositionWidth={width} compositionHeight={height} inputProps={inputProps}
    autoPlay loop initiallyMuted controls={false} clickToPlay={false}
    doubleClickToFullscreen={false} showVolumeControls={false}
    style={{width: '100%', aspectRatio: `${width}/${height}`, background: 'transparent'}}/>;
}
if (mount) createRoot(mount).render(<HeroPlayer/>);
