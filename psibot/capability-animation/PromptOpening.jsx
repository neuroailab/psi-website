import React from 'react';
import {AbsoluteFill,getRemotionEnvironment,staticFile,useCurrentFrame} from 'remotion';
import {FilmThemeProvider,useFilmTheme,filmThemeVariables} from './FilmTheme';
import {CapabilityOverview} from './CapabilityOverview';
import {OPENING_TIMING,PROMPT_PATTERNS,CAPABILITY_PATTERNS,LOGO_START,PromptDiagram,ModelMark,
  CapabilityTitleLabel,overviewLogoBox,morphLogoBox,rowOpacityAt,ease} from './PromptDiagram';

export {FPS,WIDTH,HEIGHT,DURATION,OPENING_TIMING,PROMPT_PATTERNS,CHAPTERS,PATH_STREAMS,pathStreamAt,
  LOGO_START,LOGO_END,ROW_LAYOUT,OVERVIEW_LAYOUT,rowOpacityAt,rowLabelAt,tokenBoxes,
  overviewTokenBoxes,overviewLogoBox,overviewMediaBox,overviewTitleBox,morphTokenBoxes,morphLogoBox,diagramRouteAt,
  overviewTokenLabel,tokenOpacityAt} from './PromptDiagram';

function OpeningContent(){
  const frame=useCurrentFrame(),palette=useFilmTheme();
  const handoff=ease(frame,...OPENING_TIMING.handoff);
  const markSrc=getRemotionEnvironment().isRendering?staticFile('assets/capability-film/psi-mark.svg'):'./assets/capability-film/psi-mark.svg';
  const phase=frame<405?'all-rows':frame<465?'capability-focus':frame<555?'capability-handoff':
    frame<615?'diagram-pause':frame<645?'grid-reveal':'capability-overview';
  const policy=CAPABILITY_PATTERNS[0];
  return <AbsoluteFill data-prompt-opening data-opening-frame={frame} data-opening-phase={phase}
    data-opening-theme={palette.theme} data-visible-row-count={PROMPT_PATTERNS.length}
    data-path-stream-count={PROMPT_PATTERNS.length}
    style={{...filmThemeVariables(palette),background:palette.bg,fontFamily:'Arial, Helvetica, sans-serif',color:palette.ink}}>
    {frame>=465&&<CapabilityOverview showDiagrams={false} showTitles={false} transparent
      gridOpacity={ease(frame,...OPENING_TIMING.gridReveal)} markSrc={markSrc}/>}
    <div data-prompt-column-label="input" style={{position:'absolute',left:70,top:94,width:470,
      textAlign:'center',fontSize:23,fontWeight:500,color:palette.muted,opacity:1-ease(frame,465,501)}}>Prompt</div>
    <div data-prompt-column-label="output" style={{position:'absolute',left:776,top:94,width:456,
      textAlign:'center',fontSize:23,fontWeight:500,color:palette.muted,opacity:1-ease(frame,465,501)}}>Predict</div>
    {PROMPT_PATTERNS.map(pattern=><PromptDiagram key={pattern.id} pattern={pattern} frame={frame}
      morph={pattern.capability===undefined?0:handoff} opacity={rowOpacityAt(pattern,frame)}/>)}
    <ModelMark kind="policy" src={markSrc} box={morphLogoBox(policy,handoff)}/>
    {frame>=465&&CAPABILITY_PATTERNS.slice(1).map(pattern=><ModelMark key={pattern.id} kind={pattern.id}
      src={markSrc} box={morphLogoBox(pattern,handoff)}/>)}
    {frame>=465&&CAPABILITY_PATTERNS.map(pattern=><CapabilityTitleLabel key={pattern.id} pattern={pattern}
      opacity={ease(frame,...OPENING_TIMING.headingReveal)}/>)}
    <div data-prompt-opening-headline style={{position:'absolute',top:18,left:56,width:1168,textAlign:'center',
      fontSize:42,lineHeight:'50px',fontWeight:600,letterSpacing:-.7,color:palette.ink,opacity:1-ease(frame,465,495)}}>
      {OPENING_TIMING.headline}
    </div>
  </AbsoluteFill>;
}

export function PromptOpening({theme='dark'}){
  return <FilmThemeProvider theme={theme}><OpeningContent/></FilmThemeProvider>;
}
