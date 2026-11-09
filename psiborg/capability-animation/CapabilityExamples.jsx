import React from 'react';
import {useFilmTheme} from './FilmTheme';
import {AbsoluteFill,Easing,Freeze,Img,OffthreadVideo,Sequence,interpolate,useCurrentFrame} from 'remotion';
import {AttentionTitle} from './AttentionTitle';
import {PolicyGrid,GRID_LEAD,GRID_RETURN,POLICY_PLAYBACK_RATE,exampleBox,exampleInset} from './PolicyGrid';

const GOAL_HOLD=126,SHRINK=36;
export const EXAMPLE_PLAY_START=GOAL_HOLD+SHRINK;
export const FINAL_COMPARISON_HOLD=60;
const definitions=[
  {id:'known-objects',title:'Our model learns new ways to interact with familiar objects',headlineFontSize:32,resultDuration:352,
    clips:[{tile:1,name:'policy-2',frames:224,motion:244}]},
  {id:'unseen-objects',title:'It reaches goals involving novel objects',headlineFontSize:32,resultDuration:376,
    clips:[{tile:5,name:'policy-6',frames:122,motion:244}]},
  {id:'different-goals',title:'and follows diverse goals in the same scene.',headlineFontSize:32,resultDuration:282,
    clips:[{tile:4,name:'policy-5',frames:66,motion:132},{tile:7,name:'policy-8',frames:75,motion:150}]},
];
let cursor=0;
export const EXAMPLES=definitions.map((example,index)=>{
  const oldMotion=Math.max(...example.clips.map(clip=>clip.motion));
  const clips=example.clips.map(clip=>({...clip,motion:Math.ceil(clip.motion*1.25)}));
  const finalHoldStart=EXAMPLE_PLAY_START+Math.max(...clips.map(clip=>clip.motion));
  const previousDuration=example.resultDuration+(EXAMPLE_PLAY_START-108)+Math.max(...clips.map(clip=>clip.motion))-oldMotion;
  const resultDuration=Math.max(previousDuration,finalHoldStart+FINAL_COMPARISON_HOLD);
  const returnDuration=GRID_RETURN;
  const duration=GRID_LEAD+resultDuration+returnDuration;
  const result={...example,clips,resultDuration,finalHoldStart,finalHoldDuration:resultDuration-finalHoldStart,
    start:cursor,duration,returnDuration};cursor+=duration;return result;
});
export const EXAMPLES_DURATION=cursor;
const mix=(a,b,p)=>a+(b-a)*p;
const ease=f=>interpolate(f,[GOAL_HOLD,GOAL_HOLD+SHRINK],[0,1],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic),
});

function DemoPanel({clip,index,pair,frame,assetBase}){
  const palette=useFilmTheme();
  const p=ease(frame);
  const box=exampleBox(pair,index);
  const inset=exampleInset(pair,index);
  const goal=`${assetBase}${clip.name}-goal.png`;
  const poster=`${assetBase}${clip.name}-clean.jpg`;
  return <>
    <div data-demo-execution={clip.tile} data-source-tile={clip.tile} style={{position:'absolute',...box,borderRadius:12,overflow:'hidden',opacity:p,background:palette.mediaSurface}}>
      {frame<EXAMPLE_PLAY_START?<Img src={poster} style={{width:'100%',height:'100%',objectFit:'contain'}}/>:
        <Sequence from={EXAMPLE_PLAY_START} layout="none">
          <Freeze active={frame>=EXAMPLE_PLAY_START+clip.motion} frame={clip.motion-1}>
            <OffthreadVideo src={`${assetBase}${clip.name}-clean.mp4`} muted playbackRate={POLICY_PLAYBACK_RATE}
              style={{width:'100%',height:'100%',objectFit:'contain'}}/>
          </Freeze>
        </Sequence>}
    </div>
    <div data-demo-goal={clip.tile} data-conditioning-goal={clip.tile} style={{position:'absolute',left:mix(box.left,inset.left,p),top:mix(box.top,inset.top,p),
      width:mix(box.width,inset.width,p),height:mix(box.height,inset.height,p),borderRadius:mix(12,8,p),overflow:'hidden',
      background:palette.bg,boxShadow:`0 0 0 ${mix(1,2,p)}px ${palette.policyAccent}`}}>
      <Img src={goal} style={{width:'100%',height:'100%',objectFit:'contain',transform:'scale(1.2)'}}/>
      <div style={{position:'absolute',left:8,top:8,fontSize:pair?13:mix(19,14,p),fontWeight:650,
        color:palette.policy,background:palette.labelBg,borderRadius:4,padding:'4px 8px'}}>GOAL{pair?` ${index+1}`:''}</div>
    </div>
  </>;
}

function CapabilityExample({example,assetBase}){
  const palette=useFilmTheme();
  const f=useCurrentFrame();
  const pair=example.clips.length===2;
  return <AbsoluteFill data-demo={example.id} data-capability-example={example.id} data-example-frame={f}
    data-final-hold-start={example.finalHoldStart} data-final-hold-duration={example.finalHoldDuration}
    data-phase={f<GOAL_HOLD?'goal':f<EXAMPLE_PLAY_START?'goal-to-corner':f<example.finalHoldStart?'execution':'final-comparison'}>
    {example.clips.map((clip,index)=><DemoPanel key={clip.tile} {...{clip,index,pair,frame:f,assetBase}}/>)}
    <AttentionTitle frame={f} text={example.title} cue={example.id} color={palette.policy} headlineFontSize={example.headlineFontSize}/>
  </AbsoluteFill>;
}

export function CapabilityExamples({assetBase='./assets/'}){
  const palette=useFilmTheme();
  return <AbsoluteFill style={{background:palette.bg,color:palette.ink,fontFamily:'Arial, sans-serif'}}>
    {EXAMPLES.map(example=><Sequence key={example.id} from={example.start} durationInFrames={example.duration}>
      <Sequence durationInFrames={GRID_LEAD}>
        <PolicyGrid example={example} assetBase={assetBase}/>
      </Sequence>
      <Sequence from={GRID_LEAD} durationInFrames={example.resultDuration}>
        <CapabilityExample example={example} assetBase={assetBase}/>
      </Sequence>
      {example.returnDuration>0&&<Sequence from={GRID_LEAD+example.resultDuration} durationInFrames={example.returnDuration} premountFor={45}>
        <PolicyGrid example={example} assetBase={assetBase} returning/>
      </Sequence>}
    </Sequence>)}
  </AbsoluteFill>;
}
