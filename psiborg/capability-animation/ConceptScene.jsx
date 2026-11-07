import React from 'react';
import {useFilmTheme} from './FilmTheme';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {PromptFilm} from './prompt-animation/PromptFilm';
import {CapabilityHeading} from './OverviewBridge';

export const QUERY_SAMPLES=Object.freeze([6]);
export const POLICY_SLOWDOWN=2.5;
export const QUERY_DURATION=285;
export const CONCEPT_DURATION=QUERY_SAMPLES.length*QUERY_DURATION;
export const CONCEPT_TIMING=Object.freeze({flowStart:0,flowDuration:CONCEPT_DURATION,
  queryDuration:QUERY_DURATION,playbackRate:.2,currentReveal:[0,30],goalReveal:[60,90],
  modelReveal:[90,110],inputArrow:[90,105],outputArrow:[90,105],outputReveal:[110,135],
  arrowMode:'light-once',actionReveal:110,actionPlaybackStart:135,
  actionSampleHz:20,actionSamples:20,trajectory:false,plateResult:false});
const reveal=(frame,start,end)=>{
  const t=Math.max(0,Math.min(1,(frame-start)/(end-start)));return t*t*(3-2*t);
};

export function conceptQuery(frame){
  const index=Math.min(QUERY_SAMPLES.length-1,Math.floor(frame/QUERY_DURATION));
  const local=frame-index*QUERY_DURATION;
  const sourceFrame=local*CONCEPT_TIMING.playbackRate;
  const observationIndex=QUERY_SAMPLES[index];
  const actionOffset=Math.max(0,Math.min(19,Math.floor((local-CONCEPT_TIMING.actionPlaybackStart)*4/30)));
  return {kind:'policy',index,frame:sourceFrame,reviewFrame:local/POLICY_SLOWDOWN,tokenSpacingFrames:60,
    observationIndex,actionIndex:observationIndex*20+actionOffset,
    reveal:{current:reveal(local,...CONCEPT_TIMING.currentReveal),second:reveal(local,...CONCEPT_TIMING.goalReveal),
      model:reveal(local,...CONCEPT_TIMING.modelReveal),output:reveal(local,...CONCEPT_TIMING.outputReveal)},
    arrows:{input:reveal(local,...CONCEPT_TIMING.inputArrow),output:reveal(local,...CONCEPT_TIMING.outputArrow)},
    tokenStart:{current:0,second:24,output:44}};
}

/** Keep the middle policy prompt with its fixed conditioning goal. */
export function ConceptScene({assetBase='./assets/'}){
  const palette=useFilmTheme();
  const frame=useCurrentFrame();
  const query=conceptQuery(frame);
  return <AbsoluteFill data-concept="single-goal-policy" data-source-tile="0"
    data-concept-phase="flow" data-query-index={query.index}
    style={{background:palette.bg,color:palette.ink,fontFamily:'Arial, sans-serif'}}>
    <CapabilityHeading kind="policy"/>
    <div data-concept-flow data-flow-frame={query.frame} data-goal-source-frame="278"
      data-flow-kind="compact-policy" data-rgb-index={query.observationIndex}
      data-action-index={query.actionIndex}
      data-current-opacity={query.reveal.current} data-goal-opacity={query.reveal.second}
      data-model-opacity={query.reveal.model} data-output-opacity={query.reveal.output}
      data-playback-rate="0.2" style={{position:'absolute',left:60,top:200,width:1160,height:340}}>
      <PromptFilm mode="detail" theme={palette.theme} assetBase={assetBase} markSrc={`${assetBase}psi-mark.svg`}
        goalSrc={`${assetBase}policy-1-goal.png`} width={1160} mobile={false}
        stageHeight={340} compactQuery={query}/>
    </div>
  </AbsoluteFill>;
}

export default ConceptScene;
