import React from 'react';
import {AbsoluteFill,interpolate,useCurrentFrame} from 'remotion';
import {useFilmTheme} from './FilmTheme';

const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'};

/** A brief reading pause between the prompting explanation and its examples. */
export function NarrativeTitle({cue,kind,lines,duration}){
  const palette=useFilmTheme();
  const frame=useCurrentFrame();
  const opacity=interpolate(frame,[0,8,duration-13,duration-1],[0,1,1,0],clamp);
  return <AbsoluteFill data-narrative-card={cue} data-narrative-frame={frame}
    data-narrative-duration={duration} data-narrative-opacity={opacity}
    data-narrative-text={lines.join(' ')}
    style={{background:palette.bg,color:palette[kind],fontFamily:'Arial, Helvetica, sans-serif',
      display:'flex',alignItems:'center',justifyContent:'center'}}>
    <div style={{width:1120,textAlign:'center',fontSize:52,lineHeight:1.22,
      fontWeight:650,letterSpacing:-.7,opacity}}>
      {lines.map(line=><div key={line}>{line}</div>)}
    </div>
  </AbsoluteFill>;
}
