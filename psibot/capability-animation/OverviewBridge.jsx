import React from 'react';
import {useFilmTheme} from './FilmTheme';
import {AbsoluteFill,Freeze,Sequence,interpolate,useCurrentFrame} from 'remotion';
import {CapabilityOverview} from './CapabilityOverview';
import {CAPABILITY_PATTERNS,OVERVIEW_LAYOUT,overviewTitleBox,overviewMediaBox} from './PromptDiagram';

export const TRANSITION_DURATION=36;
export const BRIDGE_SHRINK_FRAMES=48;
export const BRIDGE_DURATION=78;
export const OVERVIEW_FRAME=OVERVIEW_LAYOUT.canonicalFrame;
export const CAPABILITY_DATA=Object.freeze({
  policy:{index:0,title:'Execute from one goal image',from:[121,227,213],to:[183,250,240],color:'#b7faf0'},
  simulation:{index:1,title:'Imagine possible futures',from:[131,191,255],to:[131,191,255],color:'#83bfff'},
  progress:{index:2,title:'Track progress',from:[242,197,121],to:[239,195,114],color:'#efc372'},
});
const mix=(a,b,p)=>a+(b-a)*p;
const ease=(frame,start,end)=>{
  const p=interpolate(frame,[start,end],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return p*p*(3-2*p);
};
export const CAPABILITY_HEADING_STYLE={position:'absolute',left:640,top:76,width:1168,
  transform:'translate(-50%,-50%)',fontFamily:'Arial, Helvetica, sans-serif',fontSize:42,lineHeight:'48.3px',
  fontWeight:600,letterSpacing:-.7,textAlign:'center',color:'#b7faf0',whiteSpace:'nowrap'};

export function overviewGridBox(kind){
  return overviewMediaBox(CAPABILITY_PATTERNS.find(pattern=>pattern.id===kind));
}

// Isolate a source clock from the short enclosing chapter. A plain Freeze can
// exceed the full composition clock and clip later Loop iterations.
export function FrozenSourceFrame({frame,children}){
  return <Sequence from={-frame} layout="none"><Freeze frame={frame}>{children}</Freeze></Sequence>;
}

export function FrozenOverview({opacity=1,hideOpeningHeading,hideOpeningGrid}){
  return <div data-frozen-overview data-overview-frame={OVERVIEW_FRAME}
    style={{position:'absolute',inset:0,opacity}}>
    <FrozenSourceFrame frame={OVERVIEW_FRAME}>
      <CapabilityOverview hideOpeningHeading={hideOpeningHeading} hideOpeningGrid={hideOpeningGrid}/>
    </FrozenSourceFrame>
  </div>;
}

export function CapabilityHeading({kind='policy'}){
  const palette=useFilmTheme();
  const data=CAPABILITY_DATA[kind];
  return <div data-capability-heading={kind} data-policy-heading={kind==='policy'?true:undefined}
    style={{...CAPABILITY_HEADING_STYLE,color:palette[kind]}}>{data.title}</div>;
}

/** The selected heading moves directly from its branch label into the top position. */
export function CapabilityTransition({kind='policy'}){
  const palette=useFilmTheme();
  const frame=useCurrentFrame(),p=ease(frame,0,TRANSITION_DURATION-1),data=CAPABILITY_DATA[kind];
  const from=overviewTitleBox(CAPABILITY_PATTERNS.find(pattern=>pattern.id===kind));
  const color=`rgb(${palette.headingFrom[kind].map((value,i)=>Math.round(mix(value,palette.headingTo[kind][i],p))).join(',')})`;
  return <AbsoluteFill data-capability-transition={kind} data-policy-transition={kind==='policy'?true:undefined}
    data-transition-frame={frame} style={{background:palette.bg}}>
    <div data-overview-fade style={{position:'absolute',inset:0,opacity:1-p}}>
      <FrozenOverview hideOpeningHeading={kind}/>
    </div>
    <div data-moving-capability-heading={kind} data-moving-policy-heading={kind==='policy'?true:undefined}
      style={{...CAPABILITY_HEADING_STYLE,left:mix(from.x,640,p),top:mix(from.y,76,p),width:mix(from.width,1168,p),
        fontSize:mix(from.fontSize,42,p),lineHeight:`${mix(from.lineHeight,48.3,p)}px`,
        letterSpacing:mix(-.45,-.7,p),color}}>{data.title}</div>
  </AbsoluteFill>;
}

/**
 * Shrink a complete grid back into its own branch of the overview.
 * `fromBox` is its starting rectangle in the1280×720 stage. Children retain
 * their logical contentWidth/contentHeight. contentCrop can select just the
 * grid inside a larger stage, avoiding scaled black margins during the return.
 * The caller freezes children on the exact preceding final-grid frame.
 */
export function OverviewReturn({kind,children,fromBox={left:0,top:0,width:1280,height:720},
  contentWidth=1280,contentHeight=720,contentCrop}){
  const palette=useFilmTheme();
  const frame=useCurrentFrame();
  const shrink=ease(frame,0,BRIDGE_SHRINK_FRAMES-1);
  const handoff=ease(frame,BRIDGE_SHRINK_FRAMES,BRIDGE_DURATION-1);
  const target=overviewGridBox(kind);
  const box=Object.fromEntries(['left','top','width','height'].map(key=>[key,mix(fromBox[key],target[key],shrink)]));
  const crop=contentCrop||{left:0,top:0,width:contentWidth,height:contentHeight};
  const sx=box.width/crop.width,sy=box.height/crop.height;
  return <AbsoluteFill data-overview-return={kind} data-return-frame={frame}
    data-return-phase={frame<BRIDGE_SHRINK_FRAMES?'shrink':'handoff'} style={{background:palette.bg}}>
    <FrozenOverview opacity={shrink} hideOpeningGrid={frame<BRIDGE_SHRINK_FRAMES?kind:undefined}/>
    <div data-returning-grid={kind} data-return-content-opacity={1-handoff}
      style={{position:'absolute',...box,opacity:1-handoff,overflow:'hidden',borderRadius:mix(0,8,shrink)}}>
      <div style={{position:'absolute',left:-crop.left*sx,top:-crop.top*sy,width:contentWidth,height:contentHeight,
        transform:`scale(${sx},${sy})`,transformOrigin:'top left'}}>{children}</div>
    </div>
  </AbsoluteFill>;
}
