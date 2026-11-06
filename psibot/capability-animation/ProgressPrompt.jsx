import React from 'react';
import {useFilmTheme} from './FilmTheme';
import {AbsoluteFill,Freeze,Img,OffthreadVideo,Sequence,interpolate,useCurrentFrame} from 'remotion';
import progress from './progress-data.json';
import {CapabilityHeading} from './OverviewBridge';

export const PROGRESS_PROMPT_DURATION=288;
export const PROGRESS_PROMPT_PLAY_START=81;
export const PROGRESS_PROMPT_PLAYBACK_RATE=2/3;
const playbackFrames=Math.ceil(progress.frames/PROGRESS_PROMPT_PLAYBACK_RATE);
export const PROGRESS_PROMPT_TIMING=Object.freeze({
  duration:PROGRESS_PROMPT_DURATION,playStart:PROGRESS_PROMPT_PLAY_START,
  sourceFrames:progress.frames,sourceFps:progress.fps,playbackRate:PROGRESS_PROMPT_PLAYBACK_RATE,currentReveal:[0,18],goalReveal:[36,54],
  modelReveal:[54,66],inputArrow:[54,63],outputArrow:[54,63],outputReveal:[66,81],arrowMode:'light-once',
});
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'};
const ease=(frame,start,duration)=>{
  const p=interpolate(frame,[start,start+duration],[0,1],clamp);
  return p*p*(3-2*p);
};
const media={width:'100%',height:'100%',objectFit:'contain',display:'block'};
const asset=(base,name)=>`${base.replace(/\/$/,'')}/${name}`;

export function progressPromptState(frame){
  const sourceFrame=Math.max(0,Math.min(progress.frames-1,Math.floor((frame-PROGRESS_PROMPT_PLAY_START)*PROGRESS_PROMPT_PLAYBACK_RATE)));
  const sourceSeconds=sourceFrame/progress.fps;
  const prediction=progress.points.reduce((value,point)=>
    point.time<=sourceSeconds+1e-7?point.value:value,progress.points[0].value);
  return {sourceFrame,sourceSeconds,prediction,
    reveal:{current:ease(frame,0,18),goal:ease(frame,36,18),model:ease(frame,54,12),output:ease(frame,66,15)},
    playing:frame>=PROGRESS_PROMPT_PLAY_START&&frame<PROGRESS_PROMPT_PLAY_START+playbackFrames};
}

function Tokens({center,frame,start,color,opacity}){
  return <div style={{position:'absolute',left:center-37.5,top:490,display:'flex',gap:5,opacity}}>
    {Array.from({length:5},(_,i)=><div key={i} style={{width:11,height:11,background:color,
      opacity:ease(frame,start+i*2,3)}}/>)}
  </div>;
}

function Arrow({from,to,intensity,baseOpacity}){
  const COLORS=useFilmTheme();
  return <g data-prompt-arrow data-arrow-mode="light-once" data-arrow-intensity={intensity}>
    <path d={`M${from} 355H${to}`} fill="none" stroke={COLORS.time} strokeWidth="1.5" opacity={.22*baseOpacity}/>
    <path d={`M${from} 355H${to}`} fill="none" stroke={COLORS.time} strokeWidth="2.5" opacity={intensity}/>
    <path d={`M${to} 355L${to-5} 352L${to-5} 358Z`} fill={COLORS.time} opacity={.22*baseOpacity+.78*intensity}/>
  </g>;
}

/** Real recorded observations, one fixed conditioning goal, and recorded Δt predictions. */
export function ProgressPrompt({assetBase='./assets/'}){
  const COLORS=useFilmTheme();
  const frame=useCurrentFrame();
  const {sourceFrame,sourceSeconds,prediction,playing,reveal}=progressPromptState(frame);
  const arrowIntensity=ease(frame,54,9);
  const panel={position:'absolute',top:355-300*512/912/2,width:300,height:300*512/912,overflow:'hidden'};
  const label={position:'absolute',top:455,width:300,textAlign:'center',fontSize:23,lineHeight:'28px',color:COLORS.muted};
  return <AbsoluteFill data-progress-prompt data-source-frame={sourceFrame}
    data-source-time={sourceSeconds.toFixed(3)} data-prediction={prediction.toFixed(1)}
    data-review-frame={frame} data-current-opacity={reveal.current} data-goal-opacity={reveal.goal}
    data-model-opacity={reveal.model} data-output-opacity={reveal.output}
    data-fixed-goal-frame={progress.goalSourceFrame} data-flow-phase={frame<36?'current':frame<54?'goal':frame<66?'model':frame<81?'output':playing?'tracking':'hold'}
    style={{background:COLORS.bg,color:COLORS.ink,fontFamily:'Arial, sans-serif'}}>
    <CapabilityHeading kind="progress"/>
    <div data-progress-current-observation style={{...panel,left:65,opacity:reveal.current}}>
      {frame<PROGRESS_PROMPT_PLAY_START?<Img src={asset(assetBase,progress.poster)} style={media}/>:
        <Sequence from={PROGRESS_PROMPT_PLAY_START} layout="none">
          <Freeze active={!playing} frame={playbackFrames-1}>
            <OffthreadVideo muted playsInline src={asset(assetBase,progress.source)} playbackRate={PROGRESS_PROMPT_PLAYBACK_RATE} style={media}/>
          </Freeze>
        </Sequence>}
    </div>
    <div data-progress-conditioning-goal style={{...panel,left:385,opacity:reveal.goal}}>
      <Img src={asset(assetBase,progress.goal)} style={media}/>
    </div>
    <svg width="1280" height="720" style={{position:'absolute',inset:0}} aria-hidden="true">
      <Arrow from={697} to={752} intensity={arrowIntensity} baseOpacity={reveal.goal}/>
      <Arrow from={848} to={898} intensity={arrowIntensity} baseOpacity={reveal.goal}/>
    </svg>
    <Img src={asset(assetBase,'psi-mark.svg')} style={{position:'absolute',left:760,top:315,width:80,height:80,opacity:reveal.model}}/>
    <div data-progress-prediction-output style={{position:'absolute',left:910,top:316,width:300,textAlign:'center',
      fontSize:64,lineHeight:'78px',fontWeight:500,fontVariantNumeric:'tabular-nums',color:COLORS.time,opacity:reveal.output}}>
      {prediction.toFixed(1)}<span style={{fontSize:34,marginLeft:10}}>s</span>
    </div>
    <div style={{...label,left:65,opacity:reveal.current}}>Current Observation</div>
    <div style={{...label,left:385,opacity:reveal.goal}}>Goal</div>
    <div style={{...label,left:910,opacity:reveal.output}}>Δt</div>
    <Tokens center={215} frame={frame/1.5} start={0} color={COLORS.rgb} opacity={reveal.current}/>
    <Tokens center={535} frame={frame/1.5} start={24} color={COLORS.rgb} opacity={reveal.goal}/>
    <Tokens center={1060} frame={frame/1.5} start={44} color={COLORS.time} opacity={reveal.output}/>
  </AbsoluteFill>;
}

export default ProgressPrompt;
