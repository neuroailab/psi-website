import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useFilmTheme} from './FilmTheme';
import {PROMPT_PATTERNS,OPENING_TIMING,TokenCard,PromptArrow,tokenBoxes,
  rowOpacityAt,kinds,ease,mix,LOGO_START} from './PromptDiagram';
import {TRAINING_PATTERNS,SEQUENCE_ACCUMULATION as TIMING,SEQUENCE_BANKS,
  accumulatedRowLayout} from './TrainingSequenceAccumulation.mjs';

function SequenceRow({pattern,slot,frame,original=false}){
  const palette=useFilmTheme(),layout=accumulatedRowLayout(pattern,slot);
  // First make six compact lanes above the logo, then move sideways, then
  // settle into the two banks. This keeps every chip clear of other rows/Ψ.
  const compact=original?ease(frame,TIMING.compactStart,TIMING.compactStart+10):1;
  const sideways=original?ease(frame,TIMING.compactStart+10,TIMING.compactEnd-10):1;
  const settle=original?ease(frame,TIMING.compactEnd-10,TIMING.compactEnd):1;
  const reveal=original?1:ease(frame,pattern.additionStart,pattern.additionStart+TIMING.reveal);
  const opacity=original?rowOpacityAt(pattern,frame):1-ease(frame,...OPENING_TIMING.focus);
  const lift=original?0:(1-reveal)*5;
  const boxes=side=>{
    const target=side==='input'?layout.inputs:layout.outputs;
    const source=original?tokenBoxes(pattern,side):target;
    return target.map((box,index)=>{
      const from=source[index],width=mix(from.width,box.width,compact),height=mix(from.height,box.height,compact);
      const x=mix(from.left+from.width/2,box.left+box.width/2,sideways);
      const stagingY=original?SEQUENCE_BANKS.firstCenterY+pattern.row*SEQUENCE_BANKS.rowGap:layout.y;
      const y=mix(mix(from.top+from.height/2,stagingY,compact),layout.y,settle)+lift;
      return {left:x-width/2,top:y-height/2,width,height};
    });
  };
  const inputs=boxes('input'),outputs=boxes('output');
  const color=kinds(palette)[pattern.outputs[0].kind];
  const from=inputs.at(-1).left+inputs.at(-1).width+5,to=outputs[0].left-5,y=inputs[0].top+inputs[0].height/2;
  const edge=layout.bank?layout.left-5:layout.left+SEQUENCE_BANKS.width+5;
  const port=layout.bank?LOGO_START.left+LOGO_START.width:LOGO_START.left;
  const portY=LOGO_START.top+LOGO_START.height/2+(layout.row-5)*3;
  const bend=(edge+port)/2;
  const entry=original?1:reveal;
  return <AbsoluteFill data-prompt-pattern={pattern.id} data-sequence-slot={slot}
    data-training-sequence={pattern.sequence} data-training-split={pattern.promptTokens}
    data-pattern-opacity={opacity} data-sequence-reveal={reveal} data-sequence-compact={compact}
    data-sequence-bank={layout.bank} aria-hidden={opacity===0?true:undefined}
    style={{opacity,pointerEvents:'none'}}>
    <svg width="1280" height="720" style={{position:'absolute',inset:0,overflow:'visible'}} aria-hidden="true">
      {original&&compact<1&&<g opacity={1-compact}>
        <PromptArrow pattern={pattern} side="input" frame={frame} morph={0}/>
        <PromptArrow pattern={pattern} side="output" frame={frame} morph={0}/>
      </g>}
      {/* These unheaded links associate each complete sequence with the model. */}
      <path d={`M${edge} ${layout.y}C${bend} ${layout.y} ${bend} ${portY} ${port} ${portY}`}
        fill="none" stroke={color} strokeWidth=".9" opacity={settle*entry*.16}/>
      <g opacity={compact*entry}>
        <path d={`M${from} ${y}H${to}`} fill="none" stroke={color} strokeWidth="1.2" opacity=".65"/>
        <path d={`M${to} ${y}l-4 -3v6Z`} fill={color} opacity=".8"/>
      </g>
    </svg>
    <div style={{position:'absolute',inset:0,clipPath:original?'none':`inset(0 ${1280-(layout.left+SEQUENCE_BANKS.width*reveal)}px 0 ${layout.left}px)`}}>
      {['input','output'].map(side=>pattern[side==='input'?'inputs':'outputs'].map((item,index)=><TokenCard
        key={`${side}-${index}`} item={item} box={(side==='input'?inputs:outputs)[index]}
        pattern={pattern} side={side} index={index} frame={frame} revealFrame={pattern.start??pattern.additionStart}
        textSize={mix(16,14,compact)} glyphSize={mix(17,13,compact)} singleLine={compact===1}/>))}
    </div>
  </AbsoluteFill>;
}

export function AccumulatingSequences({frame}){
  return <>
    {PROMPT_PATTERNS.filter(pattern=>pattern.capability===undefined).map(pattern=><SequenceRow
      key={pattern.id} pattern={pattern} slot={pattern.row} frame={frame} original/>)}
    {TRAINING_PATTERNS.filter(pattern=>frame>=pattern.additionStart).map(pattern=><SequenceRow
      key={pattern.id} pattern={pattern} slot={pattern.slot} frame={frame}/>)}
  </>;
}
