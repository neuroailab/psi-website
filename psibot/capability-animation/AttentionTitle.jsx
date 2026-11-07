import React from 'react';
import {useFilmTheme} from './FilmTheme';
import {AbsoluteFill,Easing,interpolate} from 'remotion';

export const TITLE_HOLD=54;
export const TITLE_FADE=27;
export const TITLE_CUE_DURATION=TITLE_HOLD+TITLE_FADE;

/** Fade the headline into its final position while the footage stays paused. */
export function AttentionTitle({frame,text,cue,color,headlineFontSize=36}){
  const palette=useFilmTheme();
  const opacity=interpolate(frame,[0,TITLE_FADE],[0,1],{
    extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic),
  });
  const settle=interpolate(frame,[TITLE_HOLD,TITLE_CUE_DURATION],[0,1],{
    extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic),
  });
  return <AbsoluteFill style={{pointerEvents:'none',zIndex:10}}>
    <AbsoluteFill data-title-dimmer={cue} style={{background:palette.bg,opacity:.72*(1-settle)}}/>
    <div data-title-cue={cue} data-title-placement="headline" data-title-opacity={opacity}
      style={{position:'absolute',left:'50%',top:66,transform:'translate(-50%,-50%)',opacity,
        width:1168,fontSize:headlineFontSize,lineHeight:1.2,
        fontWeight:650,letterSpacing:-.7,textAlign:'center',color:color||palette.ink,
        textShadow:'none'}}>{text}</div>
  </AbsoluteFill>;
}
