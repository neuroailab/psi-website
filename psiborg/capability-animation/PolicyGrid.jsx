import React from 'react';
import {useFilmTheme} from './FilmTheme';
import {AbsoluteFill,Easing,Freeze,Img,OffthreadVideo,interpolate,useCurrentFrame} from 'remotion';
import manifest from './grid-media.json';
import {GRID_SELECTIONS,POLICY_GRID_BOX,selectedGridBox,placeGridBox} from './FourExampleGrid.mjs';

export const GRID_LEAD=90,GRID_RETURN=36,POLICY_PLAYBACK_RATE=.4;
export const POLICY_GRID_PREVIEW_RATE=1/3;
export const GRID_TIMING=Object.freeze({overview:36,highlight:18,zoom:36,lead:GRID_LEAD,return:GRID_RETURN});
const ASPECT=512/912;
const mix=(a,b,t)=>a+(b-a)*t;
const ease=(frame,start,duration)=>interpolate(frame,[start,start+duration],[0,1],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)});
const lerpBox=(a,b,p)=>Object.fromEntries(['left','top','width','height'].map(k=>[k,mix(a[k],b[k],p)]));
export const gridBox=tile=>placeGridBox(selectedGridBox('policy',tile),POLICY_GRID_BOX);
export const exampleBox=(pair,index)=>pair?{left:32+index*624,top:230,width:592,height:592*ASPECT}:
  {left:184,top:152,width:912,height:512};
export function exampleInset(pair,index){
  const b=exampleBox(pair,index),margin=pair?12:20,width=pair?174:246;
  return {left:b.left+margin,top:b.top+margin,width,height:width*ASPECT};
}

function GridTile({clip,example,frame,returning,assetBase}){
  const palette=useFilmTheme();
  const selectedIndex=example.clips.findIndex(c=>c.tile===clip.tile);
  const selected=selectedIndex>=0,pair=example.clips.length===2;
  const companion=!GRID_SELECTIONS.policy.includes(clip.tile);
  const source=gridBox(clip.tile),target=selected?exampleBox(pair,selectedIndex):source;
  const highlight=returning?1-ease(frame,0,GRID_RETURN-1):ease(frame,36,17);
  const zoom=returning?1-ease(frame,0,GRID_RETURN-1):ease(frame,54,35);
  const box=selected?lerpBox(source,target,zoom):source;
  const tileZoom=selected?zoom:0;
  const opacity=companion?zoom:selected?1:(1-.62*highlight)*(1-zoom);
  const margin=source.width*.025,goalWidth=source.width*.27;
  const gridGoal={left:margin,top:margin,width:goalWidth,height:goalWidth*ASPECT};
  const inset=selected?exampleInset(pair,selectedIndex):null;
  const resultGoal=inset?{...inset,left:inset.left-target.left,top:inset.top-target.top}:gridGoal;
  const smallGoal=lerpBox(gridGoal,resultGoal,zoom);
  // Enlarge the real conditioning goal as the selected tile reaches its result
  // panel, so the following goal-first explanation begins without an image cut.
  const reveal=selected&&!returning?ease(frame,68,21):0;
  const goal=lerpBox(smallGoal,{left:0,top:0,width:box.width,height:box.height},reveal);
  const mediaFrame=returning?(selected?example.clips[selectedIndex].motion-1:Math.floor(Math.min(frame/1.5,35)*1.25)):Math.min(frame,53);
  const gridPlaybackRate=returning?POLICY_PLAYBACK_RATE:POLICY_GRID_PREVIEW_RATE;
  const fontSize=mix(12,returning?(pair?13:14):(pair?13:19),tileZoom);
  return <div data-grid-tile={clip.tile} data-selected={selected} data-media-frame={mediaFrame} data-grid-clock-start="0" data-grid-preview-playing={!returning&&frame<54}
    data-grid-companion={companion}
    style={{position:'absolute',...box,opacity,zIndex:selected?2:1,borderRadius:mix(5,12,tileZoom),
      overflow:'hidden',background:palette.mediaSurface,boxShadow:selected?`0 0 0 ${3*highlight*(1-(returning?0:reveal))}px ${palette.policyAccent}`:'none'}}>
    <Freeze active={returning||frame>=54} frame={mediaFrame}>
      <OffthreadVideo muted playsInline pauseWhenBuffering src={`${assetBase}${clip.video}`} playbackRate={gridPlaybackRate}
        style={{width:'100%',height:'100%',objectFit:'contain',display:'block'}}/>
    </Freeze>
    <div data-grid-goal={clip.tile} style={{position:'absolute',...goal,overflow:'hidden',borderRadius:mix(2,returning?8:12,tileZoom),
      background:palette.bg,boxShadow:`0 0 0 ${mix(.7,returning?2:1,tileZoom)}px ${palette.policyAccent}`}}>
      <Img src={`${assetBase}${clip.goal}`} style={{width:'100%',height:'100%',objectFit:'contain',display:'block',transform:'scale(1.2)'}}/>
      <div style={{position:'absolute',left:mix(3,8,tileZoom),top:mix(3,8,tileZoom),fontSize,fontWeight:650,
        color:palette.policy,background:palette.labelBg,borderRadius:mix(2,4,tileZoom),padding:`${mix(2,4,tileZoom)}px ${mix(3,8,tileZoom)}px`}}>
        GOAL{selected&&pair&&zoom>.5?` ${selectedIndex+1}`:''}
      </div>
    </div>
  </div>;
}

export function PolicyGrid({example,assetBase='./assets/',returning=false}){
  const palette=useFilmTheme();
  const frame=useCurrentFrame();
  const phase=returning?'return':frame<36?'overview':frame<54?'highlight':'zoom';
  const clips=manifest.clips.filter(clip=>GRID_SELECTIONS.policy.includes(clip.tile)||example.clips.some(item=>item.tile===clip.tile));
  return <AbsoluteFill data-policy-grid={phase} data-grid-example={example.id} data-grid-frame={frame}
    data-grid-kind="policy" data-grid-tile-count={GRID_SELECTIONS.policy.length} data-grid-tiles={GRID_SELECTIONS.policy.join(',')}
    style={{background:palette.bg,fontFamily:'Arial, sans-serif'}}>
    {clips.map(clip=><GridTile key={clip.tile} {...{clip,example,frame,returning,assetBase}}/>)}
    {!returning&&<AbsoluteFill style={{pointerEvents:'none',zIndex:3,background:palette.bg,opacity:.72*ease(frame,81,8)}}/>}
    {returning&&<div data-return-title style={{position:'absolute',left:56,top:44,width:1168,zIndex:3,
      fontSize:36,lineHeight:1.2,fontWeight:650,letterSpacing:-.7,textAlign:'center',color:palette.policy,opacity:1-ease(frame,0,12)}}>
      {example.title}
    </div>}
  </AbsoluteFill>;
}
