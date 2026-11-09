import bank from './training-sequences.json' with {type:'json'};

// Replace one of the six general-purpose rows at a time. The three robotics
// rows are never involved, so their existing morph into the overview is exact.
export const SEQUENCE_CYCLE=Object.freeze({start:90,step:15,fade:6,rows:6});
const subscripts='₀₁₂₃₄₅₆₇₈₉';
export function trainingToken(value){
  const match=/^(rgb|a|d|f|c)([0-9_]+)$/.exec(value);
  if(!match)throw new Error(`Unsupported training token: ${value}`);
  const [,prefix,time]=match;
  const kinds={rgb:'rgb',a:'action',d:'depth',f:'flow',c:'campose'};
  const labels={rgb:'RGB',a:'A',d:'Depth',f:'Flow',c:'CamPose '};
  const suffix=time.replaceAll('_','').replace(/\d/g,d=>subscripts[Number(d)]);
  return Object.freeze({kind:kinds[prefix],label:labels[prefix]+suffix,sourceToken:value});
}
export const TRAINING_PATTERNS=Object.freeze(bank.patterns.map((entry,index)=>{
  const tokens=entry.sequence.split(',').map(trainingToken);
  return Object.freeze({id:`training-${entry.id}`,label:entry.id,
    sequence:entry.sequence,sourceLine:entry.sourceLine,promptTokens:entry.promptTokens,
    inputs:tokens.slice(0,entry.promptTokens),outputs:tokens.slice(entry.promptTokens),
    cycleRow:index%SEQUENCE_CYCLE.rows,cycleStart:SEQUENCE_CYCLE.start+index*SEQUENCE_CYCLE.step});
}));
const smooth=value=>{const p=Math.max(0,Math.min(1,value));return p*p*(3-2*p);};
export function cyclingPatternAt(base,frame){
  if(base.capability!==undefined)return {pattern:base,opacity:1};
  let current=base;
  for(const next of TRAINING_PATTERNS){
    if(next.cycleRow!==base.row)continue;
    const elapsed=frame-next.cycleStart;
    if(elapsed<0)break;
    if(elapsed<SEQUENCE_CYCLE.fade)return {pattern:current,opacity:1-smooth(elapsed/SEQUENCE_CYCLE.fade)};
    current={...base,...next};
    if(elapsed<SEQUENCE_CYCLE.fade*2)return {pattern:current,opacity:smooth((elapsed-SEQUENCE_CYCLE.fade)/SEQUENCE_CYCLE.fade)};
  }
  return {pattern:current,opacity:1};
}
