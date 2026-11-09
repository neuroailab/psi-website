import React, {useRef, useState, useEffect, useMemo} from 'react';
import {createRoot} from 'react-dom/client';
import {Player} from '@remotion/player';
import {prefetch} from 'remotion';
import progress from './progress-data.json';
import {PROGRESS_EXAMPLES} from './ProgressExamples';
import policyGrid from './grid-media.json';
import story from './full-film-original/story.json';
import {GRID_SELECTIONS} from './FourExampleGrid.mjs';
import {FullFilm, CHAPTERS, SECTIONS, DURATION, FPS, WIDTH, HEIGHT} from './FullFilm';

const mount = document.getElementById('hero-feature-player');
export const PLAYBACK_RATE = 1.2;
const pageTheme = () => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';

function CapabilityPlayer() {
  const ref = useRef(null);
  const [theme, setTheme] = useState(pageTheme);
  const [playbackFeedback, setPlaybackFeedback] = useState(null);
  const inputProps = useMemo(() => ({theme}), [theme]);
  useEffect(() => {
    // Warm the standalone result clips before their chapters. Keep the much
    // larger grid composites streamed rather than retaining them as blobs.
    const mediaBase = './assets/capability-film/';
    const sources = [...new Set([
      ...policyGrid.clips.map(clip => `${mediaBase}${clip.video}`),
      ...story.feature_tiles.map(tile => new URL(`${mediaBase}${story.simulation[tile].asset.replace(/^assets\//, '')}`, document.baseURI).href),
      ...GRID_SELECTIONS.simulation.map(tile => new URL(`${mediaBase}${story.simulation[tile].asset.replace(/^assets\//, '')}`, document.baseURI).href),
      ...GRID_SELECTIONS.progress.map(tile => `${mediaBase}progress-${tile+1}.mp4`),
      `${mediaBase}${progress.source}`, ...PROGRESS_EXAMPLES.flatMap(example =>
        example.clips.map(clip => `${mediaBase}${clip.name}.mp4`)),
    ])];
    const pending = sources.map(source => prefetch(source, {method: 'blob-url'}));
    let active = true;
    mount.dataset.filmMedia = 'loading';
    mount.dataset.filmMediaCount = String(pending.length);
    Promise.all(pending.map(item => item.waitUntilDone())).then(() => {
      if (active) mount.dataset.filmMedia = 'ready';
    }).catch(() => {
      // The normal source URL and buffering protection remain available on failure.
      if (active) mount.dataset.filmMedia = 'fallback';
    });
    return () => {active = false; pending.forEach(item => item.free());};
  }, []);
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const next = pageTheme();
      setTheme(next);
      mount.dataset.theme = next;
    });
    observer.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const player = ref.current;
    const root = mount.closest('.hero-feature');
    const controls = root.querySelector('.hero-feature-controls');
    const status = root.querySelector('.hero-feature-status');
    const seek = root.querySelector('.hero-feature-seek');
    const time = root.querySelector('.hero-feature-time');
    const chapters = [...root.querySelectorAll('[data-chapter]')];
    let manualPause = false;
    let feedbackTimer, feedbackSequence = 0;
    let scrubbing = false, resumeAfterSeek = false, seekMode = null, seekFrame = null;
    window.psiHeroPlayer = player;
    window.psiHeroFilm = {version: 18, playbackRate: PLAYBACK_RATE, wallDurationSeconds: DURATION / FPS / PLAYBACK_RATE, reviewRevision: 'accumulating-sequences-v18', chapters: CHAPTERS, sections: SECTIONS,
      duration: DURATION, fps: FPS, width: WIDTH, height: HEIGHT};
    mount.dataset.compositionWidth = WIDTH;
    mount.dataset.height = HEIGHT;
    mount.dataset.theme = pageTheme();
    mount.tabIndex = 0;
    mount.setAttribute('role', 'button');
    mount.setAttribute('aria-keyshortcuts', 'Space Enter');
    if (controls) controls.hidden = false;
    seek.max = String(DURATION - 1);
    seek.title = 'Drag to seek through the animation';
    const setStatus = text => {if (status) status.textContent = text;};
    const formatTime = frame => {
      const seconds = Math.floor(frame / FPS / PLAYBACK_RATE);
      return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    };
    const updateTimeline = frame => {
      mount.dataset.frame = frame;
      if (!scrubbing) seek.value = String(frame);
      const displayFrame = scrubbing ? Number(seek.value) : frame;
      seek.style.setProperty('--seek-progress', `${100 * displayFrame / (DURATION - 1)}%`);
      if (time) time.textContent = `${formatTime(displayFrame)} / ${formatTime(DURATION)}`;
      seek.setAttribute('aria-valuetext', `${formatTime(displayFrame)} of ${formatTime(DURATION)}`);
      const section = SECTIONS.find(item => displayFrame >= item.start && displayFrame < item.end)?.kind || '';
      for (const button of chapters) {
        const kind = button.dataset.chapter === 'Progress tracking' ? 'progress' : button.dataset.chapter.toLowerCase();
        if (section.startsWith(kind)) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
      }
    };
    const updateControl = () => {
      const playing = player.isPlaying();
      const action = playing ? 'Pause' : 'Play';
      mount.setAttribute('aria-label', `${action} PsiBorg animation`);
      mount.title = `${action} animation — click, tap, Space or Enter`;
      mount.dataset.playbackState = playing ? 'playing' : 'paused';
      mount.dataset.playbackIntent = manualPause ? 'paused' : 'playing';
      mount.dataset.scrubbing = String(scrubbing);
      seek.dataset.scrubbing = String(scrubbing);
    };
    const updateFrame = event => updateTimeline(event.detail.frame);
    const tryPlay = () => {
      if (manualPause || document.hidden || scrubbing) return;
      setStatus('');
      try {
        const pending = player.play();
        pending?.catch?.(() => setStatus('Click or tap the animation to play.'));
      } catch (_) {setStatus('Click or tap the animation to play.');}
    };
    const onToggle = () => {
      manualPause = player.isPlaying();
      if (manualPause) player.pause(); else tryPlay();
      clearTimeout(feedbackTimer);
      setPlaybackFeedback({action: manualPause ? 'pause' : 'play', id: ++feedbackSequence});
      feedbackTimer = setTimeout(() => setPlaybackFeedback(null), 900);
      mount.focus({preventScroll: true});
      updateControl();
    };
    const onVideoKey = event => {
      if (![' ', 'Enter'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) onToggle();
    };
    const onError = () => setStatus('The animation could not load. Reload to try again.');
    const beginSeek = (mode = 'input') => {
      if (scrubbing) return;
      resumeAfterSeek = player.isPlaying();
      scrubbing = true;
      seekMode = mode;
      seekFrame = player.getCurrentFrame();
      player.pause();
      updateControl();
    };
    const applySeek = () => {
      beginSeek();
      const frame = Math.min(DURATION - 1, Math.max(0, Number(seek.value)));
      seekFrame = frame;
      player.seekTo(frame);
      updateTimeline(frame);
    };
    const finishSeek = () => {
      if (!scrubbing) return;
      scrubbing = false;
      seekMode = null;
      manualPause = !resumeAfterSeek;
      updateTimeline(seekFrame ?? player.getCurrentFrame());
      if (resumeAfterSeek) tryPlay();
      updateControl();
    };
    const seekKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];
    const onSeekPointer = () => beginSeek('pointer');
    const onSeekKeyDown = event => {if (seekKeys.includes(event.key)) beginSeek('keyboard');};
    const onSeekKeyUp = event => {if (seekKeys.includes(event.key)) finishSeek();};
    const onSeekChange = () => {if (seekMode !== 'keyboard') finishSeek();};
    const onVisibility = () => {
      if (document.hidden) {finishSeek(); player.pause();}
      else tryPlay();
      updateControl();
    };
    const onChapter = event => {
      const chapter = CHAPTERS.find(item => item.label === event.currentTarget.dataset.chapter);
      if (!chapter) return;
      finishSeek();
      const wasPlaying = player.isPlaying();
      player.pause();
      player.seekTo(chapter.frame);
      updateTimeline(chapter.frame);
      if (wasPlaying) tryPlay();
      updateControl();
    };
    player.addEventListener('frameupdate', updateFrame);
    player.addEventListener('play', updateControl);
    player.addEventListener('pause', updateControl);
    player.addEventListener('error', onError);
    mount.addEventListener('click', onToggle);
    mount.addEventListener('keydown', onVideoKey);
    seek.addEventListener('pointerdown', onSeekPointer);
    seek.addEventListener('keydown', onSeekKeyDown);
    seek.addEventListener('input', applySeek);
    seek.addEventListener('change', onSeekChange);
    seek.addEventListener('keyup', onSeekKeyUp);
    seek.addEventListener('blur', finishSeek);
    window.addEventListener('pointerup', finishSeek);
    window.addEventListener('pointercancel', finishSeek);
    chapters.forEach(button => button.addEventListener('click', onChapter));
    document.addEventListener('visibilitychange', onVisibility);
    updateControl(); updateTimeline(player.getCurrentFrame()); tryPlay();
    return () => {
      clearTimeout(feedbackTimer);
      player.removeEventListener('frameupdate', updateFrame);
      player.removeEventListener('play', updateControl);
      player.removeEventListener('pause', updateControl);
      player.removeEventListener('error', onError);
      mount.removeEventListener('click', onToggle);
      mount.removeEventListener('keydown', onVideoKey);
      seek.removeEventListener('pointerdown', onSeekPointer);
      seek.removeEventListener('keydown', onSeekKeyDown);
      seek.removeEventListener('input', applySeek);
      seek.removeEventListener('change', onSeekChange);
      seek.removeEventListener('keyup', onSeekKeyUp);
      seek.removeEventListener('blur', finishSeek);
      window.removeEventListener('pointerup', finishSeek);
      window.removeEventListener('pointercancel', finishSeek);
      chapters.forEach(button => button.removeEventListener('click', onChapter));
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  return <><Player ref={ref} component={FullFilm} inputProps={inputProps}
    durationInFrames={DURATION} fps={FPS} compositionWidth={WIDTH} compositionHeight={HEIGHT}
    playbackRate={PLAYBACK_RATE} autoPlay loop initiallyMuted controls={false} clickToPlay={false}
    spaceKeyToPlayOrPause={false} doubleClickToFullscreen={false} showVolumeControls={false}
    style={{width: '100%', height: '100%', aspectRatio: `${WIDTH}/${HEIGHT}`, background: 'transparent'}}/>
    {playbackFeedback && <span key={playbackFeedback.id} className="hero-feature-feedback"
      data-feedback-action={playbackFeedback.action} aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        {playbackFeedback.action === 'pause'
          ? <><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></>
          : <path d="M8 4.5v15l12-7.5z"/>}
      </svg>
    </span>}
  </>;
}
if (mount) createRoot(mount).render(<CapabilityPlayer/>);
