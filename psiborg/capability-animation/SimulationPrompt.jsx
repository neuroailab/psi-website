import React from 'react';
import {useFilmTheme} from './FilmTheme';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {PromptFilm} from './prompt-animation/PromptFilm';
import {CapabilityHeading} from './OverviewBridge';

export const SIMULATION_PROMPT_DURATION=270;
export const SIMULATION_PROMPT_TIMING=Object.freeze({duration:SIMULATION_PROMPT_DURATION,
  currentReveal:[0,18],actionReveal:[36,54],modelReveal:[54,66],inputArrow:[54,63],
  actionPlayback:[54,234],outputArrow:[54,63],outputReveal:[66,81],finalHold:[234,270],arrowMode:'light-once',
  observationIndex:4,outputObservationIndex:8,actionStart:80,actionCount:80,
  sourceActionHz:20,playbackRate:2/3,sourceCameraSeconds:[64,68]});
const reveal=(frame,start,end)=>{
  const t=Math.max(0,Math.min(1,(frame-start)/(end-start)));return t*t*(3-2*t);
};
export function simulationPromptState(frame){
  const sourceFrame=frame/1.5;
  const offset=Math.max(0,Math.min(79,Math.floor((sourceFrame-36)*20/30)));
  return {kind:'simulation',index:0,frame:sourceFrame,reviewFrame:sourceFrame,tokenSpacingFrames:36,
    observationIndex:4,outputObservationIndex:8,actionIndex:80+offset,
    reveal:{current:reveal(frame,0,18),second:reveal(frame,36,54),model:reveal(frame,54,66),output:reveal(frame,66,81)},
    arrows:{input:reveal(frame,54,63),output:reveal(frame,54,63)},
    tokenStart:{current:0,second:24,output:44}};
}

/** Recorded current→action chunk→next observation illustrates the simulation prompt. */
export function SimulationPrompt({assetBase='./assets/'}){
  const palette=useFilmTheme();
  const frame=useCurrentFrame(),query=simulationPromptState(frame);
  return <AbsoluteFill data-simulation-prompt data-review-frame={frame} data-source-rgb-index="4"
    data-action-index={query.actionIndex} data-output-rgb-index="8" data-playback-rate={2/3}
    data-current-opacity={query.reveal.current} data-action-opacity={query.reveal.second}
    data-model-opacity={query.reveal.model} data-output-opacity={query.reveal.output}
    style={{background:palette.bg,fontFamily:'Arial, sans-serif'}}>
    <CapabilityHeading kind="simulation"/>
    <div style={{position:'absolute',left:60,top:200,width:1160,height:340}}>
      <PromptFilm mode="detail" theme={palette.theme} assetBase={assetBase} markSrc={`${assetBase}psi-mark.svg`}
        width={1160} mobile={false} stageHeight={340} compactQuery={query}/>
    </div>
  </AbsoluteFill>;
}

export default SimulationPrompt;
