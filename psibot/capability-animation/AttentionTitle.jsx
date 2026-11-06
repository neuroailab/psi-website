import React from 'react';
import {useFilmTheme} from './FilmTheme';
import {AbsoluteFill,Easing,interpolate} from 'remotion';

export const TITLE_HOLD=54;
export const TITLE_MOVE=27;
export const TITLE_CUE_DURATION=TITLE_HOLD+TITLE_MOVE;
const mix=(a,b,p)=>a+(b-a)*p;

/** Read the instruction over paused footage, then release the footage to play. */
export function AttentionTitle({frame,text,cue,color,headlineFontSize=36}){
  const palette=useFilmTheme();
  const settle=interpolate(frame,[TITLE_HOLD,TITLE_CUE_DURATION],[0,1],{
    extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic),
  });
  return <AbsoluteFill style={{pointerEvents:'none',zIndex:10}}>
    <AbsoluteFill data-title-dimmer={cue} style={{background:palette.bg,opacity:.72*(1-settle)}}/>
    <div data-title-cue={cue} data-title-placement={frame<TITLE_HOLD?'centered':frame<TITLE_CUE_DURATION?'moving':'headline'}
      style={{position:'absolute',left:'50%',top:mix(360,66,settle),transform:'translate(-50%,-50%)',
        width:mix(1000,1168,settle),fontSize:mix(48,headlineFontSize,settle),lineHeight:1.2,
        fontWeight:650,letterSpacing:-.7,textAlign:'center',color:color||palette.ink,
        textShadow:settle<1?palette.cueShadow:'none'}}>{text}</div>
  </AbsoluteFill>;
}
