import React from 'react';
import {AbsoluteFill,getRemotionEnvironment,staticFile,useCurrentFrame} from 'remotion';
import {FilmThemeProvider,useFilmTheme,filmThemeVariables} from './FilmTheme';
import {CapabilityOverview} from './CapabilityOverview';
import {OPENING_TIMING,PROMPT_PATTERNS,CAPABILITY_PATTERNS,PromptDiagram,ModelMark,
  CapabilityTitleLabel,morphLogoBox,rowOpacityAt,visibleRowCountAt,fullyVisibleRowCountAt,openingPhaseAt,ease} from './PromptDiagram';

export {FPS,WIDTH,HEIGHT,DURATION,OPENING_DURATIONS,OPENING_TIMING,openingPhaseAt,overviewGridFrame,
  PROMPT_PATTERNS,CHAPTERS,PATH_STREAMS,pathStreamAt,PATH_REVEAL_SEED,PATH_REVEAL_STEP,PATH_REVEAL_FADE,
  PATH_REVEAL_ORDER,PATH_REVEAL_TIMING,rowRevealOpacityAt,visibleRowCountAt,fullyVisibleRowCountAt,
  LOGO_START,LOGO_END,ROW_LAYOUT,OVERVIEW_LAYOUT,rowOpacityAt,rowLabelAt,tokenBoxes,
  overviewTokenBoxes,overviewLogoBox,overviewMediaBox,overviewTitleBox,morphTokenBoxes,morphLogoBox,diagramRouteAt,
  overviewTokenLabel,tokenOpacityAt} from './PromptDiagram';

function OpeningContent(){
  const frame=useCurrentFrame(),palette=useFilmTheme();
  const handoff=ease(frame,...OPENING_TIMING.handoff);
  const markSrc=getRemotionEnvironment().isRendering?staticFile('assets/capability-film/psi-mark.svg'):'./assets/capability-film/psi-mark.svg';
  const phase=openingPhaseAt(frame),morphStarted=frame>=OPENING_TIMING.handoff[0];
  const policy=CAPABILITY_PATTERNS[0];
  return <AbsoluteFill data-prompt-opening data-opening-frame={frame} data-opening-phase={phase}
    data-opening-theme={palette.theme} data-visible-row-count={visibleRowCountAt(frame)}
    data-fully-visible-row-count={fullyVisibleRowCountAt(frame)}
    data-path-reveal-start={OPENING_TIMING.pathReveal[0]} data-path-reveal-end={OPENING_TIMING.pathReveal[1]}
    data-path-reveal-seed={OPENING_TIMING.pathRevealSeed} data-path-reveal-step={OPENING_TIMING.pathRevealStep}
    data-path-reveal-fade={OPENING_TIMING.pathRevealFade}
    data-path-stream-count={PROMPT_PATTERNS.length}
    style={{...filmThemeVariables(palette),background:palette.bg,fontFamily:'Arial, Helvetica, sans-serif',color:palette.ink}}>
    <CapabilityOverview showDiagrams={false} showTitles={false} transparent
      gridOpacity={ease(frame,...OPENING_TIMING.gridReveal)} markSrc={markSrc}/>
    <div data-prompt-column-label="input" style={{position:'absolute',left:40,top:88,width:515,
      textAlign:'center',fontSize:23,fontWeight:500,color:palette.muted,opacity:1-ease(frame,...OPENING_TIMING.columnLabelFade)}}>Prompt</div>
    <div data-prompt-column-label="output" style={{position:'absolute',left:735,top:88,width:505,
      textAlign:'center',fontSize:23,fontWeight:500,color:palette.muted,opacity:1-ease(frame,...OPENING_TIMING.columnLabelFade)}}>Predict</div>
    {PROMPT_PATTERNS.map(pattern=><PromptDiagram key={pattern.id} pattern={pattern} frame={frame}
      morph={pattern.capability===undefined?0:handoff} opacity={rowOpacityAt(pattern,frame)}/>)}
    <ModelMark kind="policy" src={markSrc} box={morphLogoBox(policy,handoff)}/>
    {morphStarted&&CAPABILITY_PATTERNS.slice(1).map(pattern=><ModelMark key={pattern.id} kind={pattern.id}
      src={markSrc} box={morphLogoBox(pattern,handoff)}/>)}
    {morphStarted&&CAPABILITY_PATTERNS.map(pattern=><CapabilityTitleLabel key={pattern.id} pattern={pattern}
      opacity={ease(frame,...OPENING_TIMING.headingReveal)}/>)}
    <div data-prompt-opening-headline style={{position:'absolute',top:18,left:56,width:1168,textAlign:'center',
      fontSize:34,lineHeight:'42px',fontWeight:400,letterSpacing:-.7,color:palette.ink,opacity:1-ease(frame,...OPENING_TIMING.headlineFade)}}>
      {OPENING_TIMING.headline}
    </div>
  </AbsoluteFill>;
}

export function PromptOpening({theme='dark'}){
  return <FilmThemeProvider theme={theme}><OpeningContent/></FilmThemeProvider>;
}
