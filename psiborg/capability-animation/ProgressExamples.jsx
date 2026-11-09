import React from 'react';
import {useFilmTheme,filmThemeVariables} from './FilmTheme';
import {AbsoluteFill,Easing,Freeze,Img,OffthreadVideo,Sequence,interpolate,useCurrentFrame} from 'remotion';
import {TITLE_CUE_DURATION,TITLE_FADE,TITLE_HOLD} from './AttentionTitle';
import {FrozenSourceFrame} from './OverviewBridge';
import {Grid as OriginalGrid} from './full-film-original/Story';
import {GRID_SELECTIONS,gridSlotBox,selectedGridBox,placeGridBox} from './FourExampleGrid.mjs';

export const PROGRESS_RESULTS_TIMING=Object.freeze({
  overview:36,highlight:18,zoom:36,lead:90,cue:TITLE_CUE_DURATION,hold:36,return:36,
});
export const PROGRESS_RESULT_PLAYBACK_RATE=.8;
export const PROGRESS_RESULTS_TITLE='For any embodiment';
export const PROGRESS_GRID_BOX=Object.freeze({left:224,top:122,width:832,height:476});
export const PROGRESS_GRID_CONTENT=Object.freeze({width:1280,height:720});
export const PROGRESS_GRID_SOURCE_FRAME=1751;
export const PROGRESS_EXAMPLE_PLAY_START=PROGRESS_RESULTS_TIMING.lead+PROGRESS_RESULTS_TIMING.cue;
const ASPECT=1024/1824;
const GRID_SCALE=2/3;
const definitions=[
  {id:'human-videos',title:PROGRESS_RESULTS_TITLE,
    clips:[{tile:2,name:'progress-3',frames:77}]},
  {id:'robot-embodiments',title:PROGRESS_RESULTS_TITLE,
    clips:[{tile:0,name:'progress-1',frames:122},{tile:4,name:'progress-5',frames:150}]},
];
let cursor=0;
export const PROGRESS_EXAMPLES=definitions.map((example,index)=>{
  const playDuration=Math.ceil(Math.max(...example.clips.map(clip=>clip.frames))/PROGRESS_RESULT_PLAYBACK_RATE);
  const resultDuration=PROGRESS_RESULTS_TIMING.cue+playDuration+PROGRESS_RESULTS_TIMING.hold;
  const returnStart=PROGRESS_RESULTS_TIMING.lead+resultDuration;
  const duration=returnStart+PROGRESS_RESULTS_TIMING.return;
  const result={...example,index,start:cursor,playStart:PROGRESS_EXAMPLE_PLAY_START,
    playDuration,resultDuration,returnStart,returnDuration:PROGRESS_RESULTS_TIMING.return,duration};
  cursor+=duration;
  return result;
});
export const PROGRESS_EXAMPLES_DURATION=cursor;
export const PROGRESS_CHAPTERS=PROGRESS_EXAMPLES.map((example,index)=>(
  {label:index===0?'Human progress':'Robot embodiments',frame:example.start}));
const featuredClips=PROGRESS_EXAMPLES.flatMap(example=>example.clips.map(clip=>({...clip,exampleIndex:example.index})));
const featuredTiles=new Set(featuredClips.map(clip=>clip.tile));
const mix=(a,b,p)=>a+(b-a)*p;
const ease=(frame,start,end)=>interpolate(frame,[start,end],[0,1],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic),
});
const lerpBox=(a,b,p)=>Object.fromEntries(['left','top','width','height'].map(key=>[key,mix(a[key],b[key],p)]));

export const progressGridTileBox=tile=>placeGridBox(selectedGridBox('progress',tile),PROGRESS_GRID_BOX);
export const progressResultBox=(pair,index=0)=>pair
  ?{left:32+index*624,top:234,width:592,height:592*ASPECT}
  :{left:132,top:124,width:1016,height:1016*ASPECT};

function phaseAt(frame,example){
  if(frame<36)return 'overview';
  if(frame<54)return 'highlight';
  if(frame<90)return 'zoom';
  if(frame<PROGRESS_RESULTS_TIMING.lead+TITLE_FADE)return 'cue-fade-in';
  if(frame<example.playStart)return 'cue-hold';
  if(frame<example.playStart+example.playDuration)return 'play';
  if(frame<example.returnStart)return 'final-hold';
  return 'return';
}

function ProgressExampleStage({example,frame,assetBase,freezeMedia=false}){
  const palette=useFilmTheme(),COLOR=palette.progress;
  const returning=frame>=example.returnStart;
  const returnFrame=frame-example.returnStart;
  const zoom=returning?1-ease(returnFrame,0,35):ease(frame,54,89);
  const highlight=returning?1-ease(returnFrame,0,35):ease(frame,36,53);
  const gridOpacity=(1-.62*highlight)*(1-zoom);
  const phase=phaseAt(frame,example);
  const clipId=`progress-background-${example.id}`;
  const resultFrame=frame-PROGRESS_RESULTS_TIMING.lead;
  return <AbsoluteFill data-progress-example={example.id} data-progress-example-frame={frame}
    data-progress-phase={phase} data-progress-grid={phase} data-progress-grid-source-frame={PROGRESS_GRID_SOURCE_FRAME}
    data-grid-kind="progress" data-grid-tile-count={GRID_SELECTIONS.progress.length} data-grid-tiles={GRID_SELECTIONS.progress.join(',')}
    style={{background:palette.bg,fontFamily:'Arial, Helvetica, sans-serif'}}>
    <svg width="0" height="0" aria-hidden="true" style={{position:'absolute'}}>
      <defs><clipPath id={clipId} clipPathUnits="userSpaceOnUse">
        {GRID_SELECTIONS.progress.map((tile,slot)=>{
          const box=gridSlotBox(slot);
          return !featuredTiles.has(tile)&&<rect key={tile} data-background-tile={tile}
            x={box.left} y={box.top} width={box.width} height={box.height} rx="8"/>;
        })}
      </clipPath></defs>
    </svg>
    <div data-progress-base-grid style={{position:'absolute',left:PROGRESS_GRID_BOX.left,top:PROGRESS_GRID_BOX.top,
      width:1248,height:714,transform:`scale(${GRID_SCALE})`,transformOrigin:'top left',opacity:gridOpacity,
      clipPath:`url(#${clipId})`,...filmThemeVariables(palette)}}>
      {freezeMedia?<Img src={`${assetBase}progress-grid-return-2x2.png`} style={{width:'100%',height:'100%',display:'block'}}/>
        :<FrozenSourceFrame frame={PROGRESS_GRID_SOURCE_FRAME}><OriginalGrid kind="progress"/></FrozenSourceFrame>}
    </div>
    {featuredClips.map(clip=>{
      const selectedIndex=example.clips.findIndex(item=>item.tile===clip.tile);
      const selected=selectedIndex>=0;
      const source=progressGridTileBox(clip.tile);
      const target=selected?progressResultBox(example.clips.length===2,selectedIndex):source;
      const box=selected?lerpBox(source,target,zoom):source;
      // The same source clock remains mounted through zoom, cue, playback, hold,
      // and return. Earlier examples retain their end frames in the grid.
      const mediaFrame=clip.exampleIndex<example.index?clip.frames-1:
        clip.exampleIndex>example.index?0:Math.max(0,Math.min(Math.floor((frame-example.playStart)*PROGRESS_RESULT_PLAYBACK_RATE),clip.frames-1));
      const playing=selected&&frame>=example.playStart&&frame<example.playStart+Math.ceil(clip.frames/PROGRESS_RESULT_PLAYBACK_RATE);
      return <div key={clip.tile} data-progress-tile={clip.tile}
        data-progress-selected-tile={selected?clip.tile:undefined} data-selected={selected}
        data-progress-media-frame={mediaFrame} data-progress-media-time={mediaFrame/30}
        data-progress-media-source={`${clip.name}.mp4`} data-progress-media-paused={!playing}
        style={{position:'absolute',...box,opacity:selected?1:gridOpacity,zIndex:selected?2:1,
          borderRadius:selected?mix(8*GRID_SCALE,12,zoom):8*GRID_SCALE,overflow:'hidden',background:palette.bg,
          boxShadow:selected?`0 0 0 ${3*highlight*(1-zoom)}px ${COLOR}`:'none'}}>
        {freezeMedia?<Img src={`${assetBase}${clip.name}-final.png`} data-progress-final-snapshot={clip.tile}
          style={{width:'100%',height:'100%',objectFit:'contain',display:'block'}}/>
        :selected&&frame>=example.playStart?<Sequence from={example.playStart} layout="none">
          <Freeze active={!playing} frame={(clip.frames-1)/PROGRESS_RESULT_PLAYBACK_RATE}>
            <OffthreadVideo src={`${assetBase}${clip.name}.mp4`} muted playsInline
              playbackRate={PROGRESS_RESULT_PLAYBACK_RATE}
              style={{width:'100%',height:'100%',objectFit:'contain',display:'block'}}/>
          </Freeze>
        </Sequence>:<FrozenSourceFrame frame={mediaFrame}>
          <OffthreadVideo src={`${assetBase}${clip.name}.mp4`} muted playsInline playbackRate={1}
            style={{width:'100%',height:'100%',objectFit:'contain',display:'block'}}/>
        </FrozenSourceFrame>}
      </div>;
    })}
    {frame<PROGRESS_RESULTS_TIMING.lead&&<AbsoluteFill data-progress-zoom-dimmer
      style={{pointerEvents:'none',zIndex:9,background:palette.bg,opacity:.72*ease(frame,81,89)}}/>}
    {/* Preserve the paused cue and footage reveal without remounting a headline. */}
    {frame>=PROGRESS_RESULTS_TIMING.lead&&!returning&&<AbsoluteFill data-title-dimmer={example.id}
      style={{pointerEvents:'none',zIndex:10,background:palette.bg,
        opacity:.72*(1-ease(resultFrame,TITLE_HOLD,TITLE_CUE_DURATION))}}/>}
  </AbsoluteFill>;
}

function ProgressExample({example,assetBase}){
  return <ProgressExampleStage example={example} frame={useCurrentFrame()} assetBase={assetBase}/>;
}

/** Full stage, ready to crop with PROGRESS_GRID_BOX for the overview bridge. */
export function ProgressResultsGrid({example=PROGRESS_EXAMPLES.at(-1),assetBase='./assets/',returning=false}){
  const frame=useCurrentFrame();
  const sourceFrame=returning?example.returnStart+frame:frame;
  return <ProgressExampleStage example={example} frame={sourceFrame} assetBase={assetBase} freezeMedia/>;
}

export function ProgressExamples({assetBase='./assets/'}){
  const palette=useFilmTheme();
  return <AbsoluteFill>
    {PROGRESS_EXAMPLES.map(example=><Sequence key={example.id} from={example.start} durationInFrames={example.duration}>
      <ProgressExample example={example} assetBase={assetBase}/>
    </Sequence>)}
    {/* One mounted headline spans both examples and their complete grid transition. */}
    <div data-progress-persistent-title data-title-cue="progress-any-embodiment"
      data-title-placement="headline" data-title-opacity={1}
      style={{position:'absolute',left:'50%',top:66,width:1168,
        transform:'translate(-50%,-50%)',zIndex:11,pointerEvents:'none',
        fontFamily:'Arial, Helvetica, sans-serif',fontSize:36,lineHeight:1.2,
        fontWeight:650,letterSpacing:-.7,textAlign:'center',color:palette.progress}}>
      {PROGRESS_RESULTS_TITLE}
    </div>
  </AbsoluteFill>;
}
