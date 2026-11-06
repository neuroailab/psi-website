import React from 'react';
import {AbsoluteFill,Img} from 'remotion';
import {useFilmTheme} from './FilmTheme';

export const FPS=30,WIDTH=1280,HEIGHT=720,DURATION=735;
export const OPENING_TIMING=Object.freeze({tokenDisplay:'simultaneous',tokenReveal:0,
  allRows:[0,405],focus:[405,465],handoff:[465,555],overview:[555,735],
  headingReveal:[495,535],overviewSourceOffset:405,logoMove:[465,555],
  morphRoute:'direct',morphDirect:[465,555],
  diagramPause:[555,615],gridReveal:[615,645],overviewHold:[645,735],
  headline:'One model, many ways to prompt',arrowMode:'independent-staggered-streams',
  pathStreamSeed:0x505349,pathStreamSpeed:.7});
const token=(kind,label)=>({kind,label});
export const PROMPT_PATTERNS=Object.freeze([
  {id:'video',label:'Video prediction',start:0,end:405,
    inputs:[token('rgb','RGB₀')],outputs:[token('rgb','RGB₁'),token('rgb','RGB₂')]},
  {id:'video-flow',label:'Video-conditioned flow prediction',start:0,end:405,
    inputs:[token('rgb','RGB₀'),token('rgb','RGB₁')],outputs:[token('flow','Flow₀₁')]},
  {id:'flow-video',label:'Flow-conditioned video prediction',start:0,end:405,
    inputs:[token('rgb','RGB₀'),token('flow','Flow₀₁')],outputs:[token('rgb','RGB₁')]},
  {id:'mixed',label:'Mixed-modality prediction',start:0,end:405,
    inputs:[token('rgb','RGB₀')],outputs:[token('depth','Depth₀'),token('flow','Flow₀₁'),token('depth','Depth₁'),token('rgb','RGB₁')]},
  {id:'rgb-action',label:'Interleaved observations and actions',start:0,end:405,
    inputs:[token('rgb','RGB₀'),token('action','A₀')],outputs:[token('rgb','RGB₁'),token('action','A₁')]},
  {id:'rgb-flow-action',label:'Visual flow and actions',start:0,end:405,
    inputs:[token('rgb','RGB')],outputs:[token('flow','Flow'),token('action','Action')]},
  {id:'policy',label:'Execute from one goal image',start:0,end:405,capability:0,
    inputs:[token('rgb','Current RGB'),token('rgb','Goal RGB')],outputs:[token('time','Δt'),token('action','Actions')]},
  {id:'simulation',label:'Imagine possible futures',start:0,end:405,capability:1,
    inputs:[token('rgb','RGB'),token('action','Actions')],outputs:[token('rgb','Next RGB')]},
  {id:'progress',label:'Track progress',start:0,end:405,capability:2,
    inputs:[token('rgb','Current RGB'),token('rgb','Goal RGB')],outputs:[token('time','Δt')]},
].map((pattern,row)=>Object.freeze({...pattern,row,revealFrames:pattern.inputs.concat(pattern.outputs)
  .map(()=>0)})));
export const CHAPTERS=[{label:'Prompting interface',frame:0},
  {label:'Focus on robotics',frame:405},{label:'Capability transition',frame:465},
  {label:'Three prompting paths',frame:555},{label:'Recorded examples',frame:615},
  {label:'Three capabilities',frame:645}];
// Seeded phase offsets and speeds keep overlapping streams identical on seek/export.
function streamSettings(seed){
  let state=seed>>>0;
  const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};
  return PROMPT_PATTERNS.map(()=>Object.freeze({period:76+Math.floor(random()*35),phase:random()}));
}
export const PATH_STREAMS=Object.freeze(streamSettings(OPENING_TIMING.pathStreamSeed));
export function pathStreamAt(pattern,frame,side){
  const {period,phase}=PATH_STREAMS[pattern.row];
  return ((frame*OPENING_TIMING.pathStreamSpeed/period+phase+(side==='output'?.43:0))%1+1)%1;
}
const mix=(a,b,p)=>a+(b-a)*p;
const ease=(frame,start,end)=>{
  const p=Math.max(0,Math.min(1,(frame-start)/(end-start)));
  return p*p*(3-2*p);
};
export const LOGO_START=Object.freeze({left:(WIDTH-90)/2,top:(HEIGHT-90)/2,width:90,height:90});
export const OVERVIEW_LAYOUT=Object.freeze({left:40,step:406,width:388,titleY:180,titleFontSize:22,
  titleLineHeight:26.4,promptY:252,tokenWidth:60,tokenHeight:38,tokenGap:8,logoSize:48,
  inputLeft:36,logoLeft:204,outputLeft:292,gridTop:330,
  gridWidth:388,gridHeight:388*714/1248,canonicalFrame:734});
export const columnLeft=pattern=>OVERVIEW_LAYOUT.left+pattern.capability*OVERVIEW_LAYOUT.step;
export function overviewTitleBox(pattern){return {x:columnLeft(pattern)+OVERVIEW_LAYOUT.width/2,y:OVERVIEW_LAYOUT.titleY,
  width:OVERVIEW_LAYOUT.width,fontSize:OVERVIEW_LAYOUT.titleFontSize,lineHeight:OVERVIEW_LAYOUT.titleLineHeight};}
export function overviewLogoBox(pattern){return {left:columnLeft(pattern)+OVERVIEW_LAYOUT.logoLeft,
  top:OVERVIEW_LAYOUT.promptY-OVERVIEW_LAYOUT.logoSize/2,width:OVERVIEW_LAYOUT.logoSize,height:OVERVIEW_LAYOUT.logoSize};}
export function overviewMediaBox(pattern){return {left:columnLeft(pattern),top:OVERVIEW_LAYOUT.gridTop,
  width:OVERVIEW_LAYOUT.gridWidth,height:OVERVIEW_LAYOUT.gridHeight};}
export const LOGO_END=Object.freeze(overviewLogoBox(PROMPT_PATTERNS.find(p=>p.id==='policy')));
export const ROW_LAYOUT=Object.freeze({firstCenterY:152,rowGap:52,labelLeft:14,labelWidth:292,
  capabilityLabelWidth:310,labelFontSize:22,capabilityLabelFontSize:20,inputCenter:305,outputCenter:1004,
  inputWidth:130,outputWidth:92,inputGap:20,tokenGap:10,tokenHeight:42});
const kinds=palette=>({rgb:palette.rgb,depth:palette.policyAccent,flow:palette.action,
  action:palette.action,time:palette.time});
const rowY=pattern=>ROW_LAYOUT.firstCenterY+pattern.row*ROW_LAYOUT.rowGap;
export function rowOpacityAt(pattern,frame){
  return pattern.capability===undefined?1-ease(frame,...OPENING_TIMING.focus):1;
}
export function rowLabelAt(pattern,frame){
  return {...overviewTitleBox(pattern),motion:ease(frame,...OPENING_TIMING.handoff)};
}
export const CAPABILITY_PATTERNS=Object.freeze(PROMPT_PATTERNS.filter(pattern=>pattern.capability!==undefined));
export {mix,ease,kinds,rowY};

export function TokenGlyph({kind,color,compact,size}){
  const style={display:'block',width:size??(compact?17:46),height:size??(compact?17:46),flexShrink:0};
  const line={fill:'none',stroke:color,strokeWidth:2.2,strokeLinecap:'round',strokeLinejoin:'round'};
  return <svg viewBox="0 0 48 48" style={style} aria-hidden="true">
    {kind==='rgb'&&<>
      <rect x="4" y="7" width="40" height="33" rx="5" {...line}/>
      <path d="M16 9V38M30 9V38" {...line} opacity=".45"/>
      <path d="M6 24H42" {...line} opacity=".45"/>
      <rect x="7" y="10" width="7" height="11" rx="1" fill={color} opacity=".65"/>
      <rect x="19" y="27" width="8" height="10" rx="1" fill={color} opacity=".38"/>
      <rect x="33" y="10" width="8" height="11" rx="1" fill={color} opacity=".85"/>
    </>}
    {kind==='depth'&&<>
      <rect x="4" y="5" width="40" height="38" rx="6" {...line} opacity=".4"/>
      <rect x="10" y="11" width="28" height="26" rx="5" {...line} opacity=".65"/>
      <rect x="16" y="17" width="16" height="14" rx="4" {...line}/>
    </>}
    {kind==='flow'&&[0,1,2].map(i=><g key={i} opacity={.5+i*.25}>
      <path d={`M7 ${13+i*12}h32m-7 -5l7 5-7 5`} {...line}/>
    </g>)}
    {kind==='action'&&<>
      <path d="M7 41h14m-7 -1V28l14-13 12 8m-3-5 6 9-8 3" {...line}/>
      {[[14,28],[28,15],[40,23]].map(([cx,cy])=><circle key={cx} cx={cx} cy={cy} r="4" fill={color}/>)}
    </>}
    {kind==='time'&&<>
      <circle cx="24" cy="25" r="17" {...line}/>
      <path d="M24 14v12l9 5M19 3h10" {...line}/>
    </>}
  </svg>;
}


export function TokenCard({item,box,frame,revealFrame,pattern,side,index,opacity=1,displayLabel,compactProgress=0}){
  const palette=useFilmTheme(),color=kinds(palette)[item.kind];
  const visible=opacity,label=displayLabel??item.label;
  const words=label.split(' ');
  return <div data-prompt-token={`${pattern.id}-${side}-${index}`} data-token-kind={item.kind}
    data-token-label={label} data-token-source-label={item.label} data-token-side={side} data-token-reveal-frame={revealFrame}
    data-token-opacity={visible} data-token-center-x={box.left+box.width/2} data-token-center-y={box.top+box.height/2}
    data-token-width={box.width} data-token-height={box.height} aria-hidden={visible===0?true:undefined}
    style={{position:'absolute',...box,opacity:visible,
      border:`1.2px solid ${color}`,borderRadius:8,
      boxSizing:'border-box',background:palette.bg,overflow:'hidden'}}>
    <div style={{position:'absolute',inset:0,background:color,opacity:palette.theme==='dark'?.09:.055}}/>
    <div style={{position:'relative',width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:mix(5,4,compactProgress),color}}>
      <TokenGlyph kind={item.kind} color={color} compact size={mix(17,14,compactProgress)}/>
      <span style={{fontSize:mix(16,14.5,compactProgress),fontWeight:550,lineHeight:'17px',textAlign:'center',letterSpacing:-.2}}>
        {words.map((word,i)=><React.Fragment key={i}>{i>0&&<br/>}{word}</React.Fragment>)}
      </span>
    </div>
  </div>;
}

export function tokenBoxes(pattern,side){
  const items=side==='input'?pattern.inputs:pattern.outputs;
  const width=side==='input'?ROW_LAYOUT.inputWidth:ROW_LAYOUT.outputWidth;
  const center=side==='input'?ROW_LAYOUT.inputCenter:ROW_LAYOUT.outputCenter;
  const gap=side==='input'?ROW_LAYOUT.inputGap:ROW_LAYOUT.tokenGap;
  const total=items.length*width+(items.length-1)*gap;
  return items.map((_,index)=>({left:center-total/2+index*(width+gap),
    top:rowY(pattern)-ROW_LAYOUT.tokenHeight/2,width,height:ROW_LAYOUT.tokenHeight}));
}


export function overviewTokenBoxes(pattern,side){
  const items=side==='input'?pattern.inputs:pattern.outputs;
  return items.map((_,index)=>({left:columnLeft(pattern)+(side==='input'
      ?OVERVIEW_LAYOUT.inputLeft+index*(OVERVIEW_LAYOUT.tokenWidth+OVERVIEW_LAYOUT.tokenGap)
      :OVERVIEW_LAYOUT.outputLeft),
    top:OVERVIEW_LAYOUT.promptY-OVERVIEW_LAYOUT.tokenHeight/2,
    width:OVERVIEW_LAYOUT.tokenWidth,height:OVERVIEW_LAYOUT.tokenHeight}));
}
export function overviewTokenLabel(pattern,side,index){
  if(side==='input')return pattern.id==='simulation'?['RGB','A'][index]:['RGB','RGBᵍ'][index];
  return pattern.id==='policy'?['Δt','A'][index]:pattern.id==='simulation'?'RGB′':'Δt';
}
export function tokenOpacityAt(pattern,side,index,frame,morph=0){
  if(pattern.id==='policy'&&side==='output'&&index===0)return morph>0?0:1-ease(frame,...OPENING_TIMING.focus);
  return 1;
}
export const morphBox=(source,target,p)=>Object.fromEntries(['left','top','width','height'].map(key=>[key,mix(source[key],target[key],p)]));
export function diagramRouteAt(morph){
  // Shared progress keeps token geometry, model geometry, arrows, and styling
  // synchronized along one direct route. Retain the old keys for callers.
  return {mode:'direct',progress:morph,lanes:morph,columns:morph,lift:morph};
}
export function morphLogoBox(pattern,morph){
  return morphBox(LOGO_START,overviewLogoBox(pattern),morph);
}
export function morphTokenBoxes(pattern,side,morph){
  const source=tokenBoxes(pattern,side);
  if(pattern.capability===undefined)return source;
  const target=overviewTokenBoxes(pattern,side);
  return source.map((box,index)=>morphBox(box,target[index],morph));
}
function PromptArrow({pattern,side,frame,morph}){
  const palette=useFilmTheme(),color=kinds(palette)[pattern.id==='policy'&&morph>0?'action':pattern.outputs[0].kind];
  const input=side==='input',source=tokenBoxes(pattern,side),y=rowY(pattern);
  const portY=HEIGHT/2+(pattern.row-(PROMPT_PATTERNS.length-1)/2)*6;
  const capability=pattern.capability!==undefined;
  const route=capability?diagramRouteAt(morph):{lanes:0,columns:0,lift:0};
  const boxes=capability?morphTokenBoxes(pattern,side,morph):source;
  const logo=capability?morphLogoBox(pattern,morph):LOGO_START;
  const groupY=boxes.reduce((sum,box)=>sum+box.top+box.height/2,0)/boxes.length;
  const modelPortY=logo.top+logo.height/2+mix(portY-HEIGHT/2,0,route.lanes);
  const from=input?{x:boxes.at(-1).left+boxes.at(-1).width+mix(10,8,route.columns),y:groupY}:
    {x:logo.left+logo.width+mix(12,8,route.columns),y:modelPortY};
  const outputAnchor=pattern.id==='policy'&&!input
    ?morphBox(boxes[0],boxes[1],morph>0?1:ease(frame,...OPENING_TIMING.focus)):boxes[0];
  const to=input?{x:logo.left-mix(12,8,route.columns),y:modelPortY}:
    {x:outputAnchor.left-mix(12,8,route.columns),y:groupY};
  const launch=mix(550,from.x,route.columns),outputTurn=mix(793,to.x,route.columns);
  const mid=input?(launch+to.x)/2:(from.x+outputTurn)/2;
  const path=input
    ?`M${from.x} ${from.y} H${launch} C${mid} ${from.y} ${mid} ${to.y} ${to.x} ${to.y}`
    :`M${from.x} ${from.y} C${mid} ${from.y} ${mid} ${to.y} ${outputTurn} ${to.y} H${to.x}`;
  const progress=pathStreamAt(pattern,frame,side);
  const stream={pathLength:1,strokeDasharray:'.12 .88',strokeDashoffset:-progress,strokeLinecap:'round'};
  return <g data-prompt-arrow={`${pattern.id}-${side}`} data-arrow-mode="independent-staggered-streams"
    data-stream-progress={progress} data-stream-period={PATH_STREAMS[pattern.row].period}
    data-stream-speed={OPENING_TIMING.pathStreamSpeed} data-arrow-from-x={from.x} data-arrow-from-y={from.y}
    data-arrow-to-x={to.x} data-arrow-to-y={to.y}>
    <path d={path} fill="none" stroke={color} strokeWidth="1.3" opacity={palette.theme==='dark'?.28:.34}/>
    <path d={path} fill="none" stroke={color} strokeWidth="6" opacity={palette.theme==='dark'?.12:.07} {...stream}/>
    <path data-arrow-stream d={path} fill="none" stroke={color} strokeWidth="2.6" opacity=".9" {...stream}/>
    <path d={`M${to.x} ${to.y}l-5 -3.5v7Z`} fill={color} opacity=".5"/>
  </g>;
}
export function PromptDiagram({pattern,frame,morph=0,opacity=1}){
  const inputs=morphTokenBoxes(pattern,'input',morph),outputs=morphTokenBoxes(pattern,'output',morph);
  const overview=pattern.capability!==undefined&&morph>0;
  const compactProgress=overview?diagramRouteAt(morph).columns:0;
  return <AbsoluteFill data-prompt-pattern={pattern.id} data-prompt-row={pattern.row}
    data-pattern-opacity={opacity} data-pattern-start={0} data-diagram-morph={morph}
    data-diagram-route="direct" style={{opacity}}>
    <svg width={WIDTH} height={HEIGHT} style={{position:'absolute',inset:0}} aria-hidden="true">
      <PromptArrow pattern={pattern} side="input" frame={frame} morph={morph}/>
      <PromptArrow pattern={pattern} side="output" frame={frame} morph={morph}/>
    </svg>
    {pattern.inputs.map((item,index)=><TokenCard key={`input-${index}`} item={item} box={inputs[index]}
      frame={frame} revealFrame={0} pattern={pattern} side="input" index={index}
      displayLabel={overview?overviewTokenLabel(pattern,'input',index):undefined} compactProgress={compactProgress}/>)}
    {pattern.outputs.map((item,index)=><TokenCard key={`output-${index}`} item={item} box={outputs[index]}
      frame={frame} revealFrame={0} pattern={pattern} side="output" index={index}
      displayLabel={overview?overviewTokenLabel(pattern,'output',index):undefined} compactProgress={compactProgress}
      opacity={tokenOpacityAt(pattern,'output',index,frame,morph)}/>)}
  </AbsoluteFill>;
}
export function ModelMark({box,src,kind='shared'}){
  return <div data-prompt-model data-model-capability={kind}
    data-model-center-x={box.left+box.width/2} data-model-center-y={box.top+box.height/2}
    data-model-width={box.width} style={{position:'absolute',...box}}>
    <Img src={src} alt="Psi model" style={{display:'block',width:'100%',height:'100%',objectFit:'contain'}}/>
  </div>;
}
export function CapabilityTitleLabel({pattern,opacity=1}){
  const palette=useFilmTheme(),box=overviewTitleBox(pattern);
  const color=`rgb(${palette.headingFrom[pattern.id].join(',')})`;
  return <div data-row-label={pattern.id} data-prompt-row-label={pattern.id} data-overview-heading={pattern.id}
    data-label-text={pattern.label} data-label-center-x={box.x} data-label-center-y={box.y}
    data-label-width={box.width} data-label-font-size={box.fontSize} data-label-opacity={opacity}
    data-label-role="overview" style={{position:'absolute',left:box.x,top:box.y,width:box.width,
      transform:'translate(-50%,-50%)',fontSize:box.fontSize,lineHeight:`${box.lineHeight}px`,
      fontWeight:600,letterSpacing:-.45,textAlign:'center',whiteSpace:'nowrap',color,opacity}}>{pattern.label}</div>;
}
