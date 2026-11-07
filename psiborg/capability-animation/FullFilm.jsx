import React from 'react';
import {FilmThemeProvider,useFilmTheme,filmThemeVariables} from './FilmTheme';
import {AbsoluteFill,Freeze,Sequence,getRemotionEnvironment,staticFile,useCurrentFrame} from 'remotion';
import {Preview as Policy,CHAPTERS as POLICY_CHAPTERS,DURATION as POLICY_DURATION,FPS,WIDTH,HEIGHT} from './Preview';
import {EXAMPLES} from './CapabilityExamples';
import {PolicyGrid,GRID_RETURN} from './PolicyGrid';
import {HeroFilm,heroDimensions} from './full-film-original/HeroFilm';
import {Grid as OriginalGrid} from './full-film-original/Story';
import {CapabilityTransition,OverviewReturn,FrozenOverview,FrozenSourceFrame,TRANSITION_DURATION,BRIDGE_DURATION} from './OverviewBridge';
import {SimulationPrompt,SIMULATION_PROMPT_DURATION} from './SimulationPrompt';
import {ProgressPrompt,PROGRESS_PROMPT_DURATION} from './ProgressPrompt';
import {ProgressExamples,PROGRESS_EXAMPLES,PROGRESS_CHAPTERS,PROGRESS_EXAMPLES_DURATION,ProgressResultsGrid,PROGRESS_RESULTS_TIMING,PROGRESS_GRID_BOX} from './ProgressExamples';
import story from './full-film-original/story.json';
import {PromptOpening,DURATION as OPENING_DURATION,CHAPTERS as OPENING_CHAPTERS} from './PromptOpening';

export {FPS,WIDTH,HEIGHT};
export const INTRO_DURATION=OPENING_DURATION;
export const OVERVIEW_START=0;
export const POLICY_TITLE_START=OVERVIEW_START+INTRO_DURATION;
export const POLICY_START=POLICY_TITLE_START+TRANSITION_DURATION;
export const POLICY_RETURN_START=POLICY_START+POLICY_DURATION;
export const SIMULATION_TITLE_START=POLICY_RETURN_START+BRIDGE_DURATION;
export const SIMULATION_PROMPT_START=SIMULATION_TITLE_START+TRANSITION_DURATION;
export const SIMULATION_START=SIMULATION_PROMPT_START+SIMULATION_PROMPT_DURATION;
export const SIMULATION_SOURCE_START=story.chapters.simulation.full_grid;
export const SIMULATION_PLAYBACK_RATE=.8;
export const SIMULATION_DURATION=Math.ceil((story.timing.progress_focus-SIMULATION_SOURCE_START)/SIMULATION_PLAYBACK_RATE);
export const SIMULATION_RETURN_START=SIMULATION_START+SIMULATION_DURATION;
export const PROGRESS_TITLE_START=SIMULATION_RETURN_START+BRIDGE_DURATION;
export const PROGRESS_PROMPT_START=PROGRESS_TITLE_START+TRANSITION_DURATION;
export const PROGRESS_START=PROGRESS_PROMPT_START+PROGRESS_PROMPT_DURATION;
export const PROGRESS_SOURCE_START=story.chapters.progress.full_grid;
export const PROGRESS_DURATION=PROGRESS_EXAMPLES_DURATION;
export const PROGRESS_RETURN_START=PROGRESS_START+PROGRESS_DURATION;
export const CLOSING_START=PROGRESS_RETURN_START+BRIDGE_DURATION;
export const CLOSING_DURATION=90;
export const DURATION=CLOSING_START+CLOSING_DURATION;
export const SECTIONS=[
  {kind:'overview',start:OVERVIEW_START,end:POLICY_TITLE_START},
  {kind:'policy-heading',start:POLICY_TITLE_START,end:POLICY_START},
  {kind:'policy',start:POLICY_START,end:POLICY_RETURN_START},
  {kind:'policy-overview-return',start:POLICY_RETURN_START,end:SIMULATION_TITLE_START},
  {kind:'simulation-heading',start:SIMULATION_TITLE_START,end:SIMULATION_PROMPT_START},
  {kind:'simulation-prompt',start:SIMULATION_PROMPT_START,end:SIMULATION_START},
  {kind:'simulation',start:SIMULATION_START,end:SIMULATION_RETURN_START},
  {kind:'simulation-overview-return',start:SIMULATION_RETURN_START,end:PROGRESS_TITLE_START},
  {kind:'progress-heading',start:PROGRESS_TITLE_START,end:PROGRESS_PROMPT_START},
  {kind:'progress-prompt',start:PROGRESS_PROMPT_START,end:PROGRESS_START},
  {kind:'progress',start:PROGRESS_START,end:PROGRESS_RETURN_START},
  {kind:'progress-overview-return',start:PROGRESS_RETURN_START,end:CLOSING_START},
  {kind:'closing',start:CLOSING_START,end:DURATION},
];
export const CHAPTERS=[...OPENING_CHAPTERS,{label:'Policy',frame:POLICY_TITLE_START},
  ...POLICY_CHAPTERS.map((chapter,i)=>({label:i===0?'Policy animation':chapter.label,frame:POLICY_START+chapter.frame})),
  {label:'Policy return',frame:POLICY_RETURN_START},
  {label:'Simulation',frame:SIMULATION_TITLE_START},
  {label:'Simulation animation',frame:SIMULATION_PROMPT_START},
  {label:'Simulation examples',frame:SIMULATION_START},
  {label:'Simulation return',frame:SIMULATION_RETURN_START},
  {label:'Progress tracking',frame:PROGRESS_TITLE_START},
  {label:'Progress animation',frame:PROGRESS_PROMPT_START},
  ...PROGRESS_CHAPTERS.map(chapter=>({...chapter,frame:PROGRESS_START+chapter.frame})),
  {label:'Progress return',frame:PROGRESS_RETURN_START},
  {label:'Closing overview',frame:CLOSING_START}];

function OriginalSegment({sourceStart=0,showFocusHeading=false}){
  const palette=useFilmTheme();
  const frame=useCurrentFrame(),sourceFrame=Math.min(story.timing.progress_focus-1,sourceStart+Math.floor(frame*SIMULATION_PLAYBACK_RATE));
  const size=heroDimensions(false),scale=WIDTH/size.width;
  return <div data-original-segment data-original-frame={sourceFrame}
    style={{position:'absolute',left:0,top:(HEIGHT-size.height*scale)/2,width:size.width,height:size.height,
      transform:`scale(${scale})`,transformOrigin:'top left'}}>
    <HeroFilm mobile={false} theme={palette.theme} showFocusHeading={showFocusHeading}
      sourceStart={sourceStart} playbackRate={SIMULATION_PLAYBACK_RATE}/>
  </div>;
}

const POLICY_CROP={left:74,top:36,width:1132,height:368*512/912*3+28};
const LEGACY_GRID_BOX={left:224,top:122,width:832,height:476};
function GridReturn({kind,assetBase}){
  const palette=useFilmTheme();
  if(kind==='policy')return <OverviewReturn kind={kind} fromBox={POLICY_CROP}
    contentWidth={1280} contentHeight={720} contentCrop={POLICY_CROP}>
    <Freeze frame={GRID_RETURN-1}><PolicyGrid example={EXAMPLES.at(-1)} assetBase={assetBase} returning/></Freeze>
  </OverviewReturn>;
  if(kind==='progress')return <OverviewReturn kind={kind} fromBox={PROGRESS_GRID_BOX}
    contentWidth={1280} contentHeight={720} contentCrop={PROGRESS_GRID_BOX}>
    <FrozenSourceFrame frame={PROGRESS_RESULTS_TIMING.return-1}>
      <ProgressResultsGrid example={PROGRESS_EXAMPLES.at(-1)} assetBase={assetBase} returning/>
    </FrozenSourceFrame>
  </OverviewReturn>;
  return <OverviewReturn kind={kind} fromBox={LEGACY_GRID_BOX} contentWidth={1248} contentHeight={714}>
    <div style={{width:1248,height:714,...filmThemeVariables(palette)}}>
      <OriginalGrid kind={kind} snapshotSrc={`${assetBase}simulation-grid-return.png`}/>
    </div>
  </OverviewReturn>;
}

/** Each capability returns to the same three-column prompt overview. */
function FullFilmContent(){
  const palette=useFilmTheme();
  const frame=useCurrentFrame();
  const assetBase=getRemotionEnvironment().isRendering?`${staticFile('assets/capability-film')}/`:'./assets/capability-film/';
  const section=SECTIONS.find(item=>frame>=item.start&&frame<item.end)?.kind;
  return <AbsoluteFill data-full-section={section} data-full-frame={frame} data-film-theme={palette.theme} style={{...filmThemeVariables(palette),background:palette.bg}}>
    <Sequence from={OVERVIEW_START} durationInFrames={INTRO_DURATION}><PromptOpening theme={palette.theme}/></Sequence>
    <Sequence from={POLICY_TITLE_START} durationInFrames={TRANSITION_DURATION}><CapabilityTransition kind="policy"/></Sequence>
    <Sequence from={POLICY_START} durationInFrames={POLICY_DURATION}><Policy assetBase={assetBase}/></Sequence>
    <Sequence from={POLICY_RETURN_START} durationInFrames={BRIDGE_DURATION} premountFor={45}><GridReturn kind="policy" assetBase={assetBase}/></Sequence>
    <Sequence from={SIMULATION_TITLE_START} durationInFrames={TRANSITION_DURATION}><CapabilityTransition kind="simulation"/></Sequence>
    <Sequence from={SIMULATION_PROMPT_START} durationInFrames={SIMULATION_PROMPT_DURATION}><SimulationPrompt assetBase={assetBase}/></Sequence>
    <Sequence from={SIMULATION_START} durationInFrames={SIMULATION_DURATION}><OriginalSegment sourceStart={SIMULATION_SOURCE_START}/></Sequence>
    <Sequence from={SIMULATION_RETURN_START} durationInFrames={BRIDGE_DURATION} premountFor={45}><GridReturn kind="simulation" assetBase={assetBase}/></Sequence>
    <Sequence from={PROGRESS_TITLE_START} durationInFrames={TRANSITION_DURATION}><CapabilityTransition kind="progress"/></Sequence>
    <Sequence from={PROGRESS_PROMPT_START} durationInFrames={PROGRESS_PROMPT_DURATION}><ProgressPrompt assetBase={assetBase}/></Sequence>
    <Sequence from={PROGRESS_START} durationInFrames={PROGRESS_DURATION}><ProgressExamples assetBase={assetBase}/></Sequence>
    <Sequence from={PROGRESS_RETURN_START} durationInFrames={BRIDGE_DURATION} premountFor={45}><GridReturn kind="progress" assetBase={assetBase}/></Sequence>
    <Sequence from={CLOSING_START} durationInFrames={CLOSING_DURATION}>
      <FrozenOverview/>
    </Sequence>
  </AbsoluteFill>;
}

export function FullFilm({theme='dark'}){
  return <FilmThemeProvider theme={theme}><FullFilmContent/></FilmThemeProvider>;
}
