import bank from './training-sequences.json' with {type:'json'};

// Shuffle both the replacement rows and training examples from one fixed seed.
// Seeks and exports reproduce the same animation; robotics rows never change.
export const SEQUENCE_CYCLE=Object.freeze({start:90,step:15,fadeOut:10,blank:2,fadeIn:10,
  rows:6,seed:0x50534917,minRowInterval:5});
function seededRandom(seed){
  let state=seed>>>0;
  return ()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};
}
const random=seededRandom(SEQUENCE_CYCLE.seed);
function shuffled(items){
  const result=[...items];
  for(let i=result.length-1;i>0;i--){
    const other=Math.floor(random()*(i+1));
    [result[i],result[other]]=[result[other],result[i]];
  }
  return result;
}
const entries=shuffled(bank.patterns);
const lastReplacement=Array(SEQUENCE_CYCLE.rows).fill(-Infinity);
let remainingRows=[];
const replacementRows=entries.map((_,index)=>{
  if(!remainingRows.length)remainingRows=Array.from({length:SEQUENCE_CYCLE.rows},(_,row)=>row);
  // Visit each row once per round, leaving time to read it between changes.
  const available=remainingRows.filter(row=>index-lastReplacement[row]>=SEQUENCE_CYCLE.minRowInterval);
  const row=available[Math.floor(random()*available.length)];
  if(row===undefined)throw new Error('Training sequence shuffle has no readable row available');
  remainingRows=remainingRows.filter(candidate=>candidate!==row);
  lastReplacement[row]=index;
  return row;
});
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
export const TRAINING_PATTERNS=Object.freeze(entries.map((entry,index)=>{
  const tokens=entry.sequence.split(',').map(trainingToken);
  return Object.freeze({id:`training-${entry.id}`,label:entry.id,
    sequence:entry.sequence,sourceLine:entry.sourceLine,promptTokens:entry.promptTokens,
    inputs:tokens.slice(0,entry.promptTokens),outputs:tokens.slice(entry.promptTokens),
    cycleRow:replacementRows[index],cycleStart:SEQUENCE_CYCLE.start+index*SEQUENCE_CYCLE.step});
}));
const smooth=value=>{const p=Math.max(0,Math.min(1,value));return p*p*(3-2*p);};
export function cyclingPatternAt(base,frame){
  if(base.capability!==undefined)return {pattern:base,opacity:1};
  let current=base;
  for(const next of TRAINING_PATTERNS){
    if(next.cycleRow!==base.row)continue;
    const elapsed=frame-next.cycleStart;
    if(elapsed<0)break;
    if(elapsed<SEQUENCE_CYCLE.fadeOut)return {pattern:current,opacity:1-smooth(elapsed/SEQUENCE_CYCLE.fadeOut)};
    current={...base,...next};
    const fadeInStart=SEQUENCE_CYCLE.fadeOut+SEQUENCE_CYCLE.blank;
    if(elapsed<fadeInStart)return {pattern:current,opacity:0};
    if(elapsed<fadeInStart+SEQUENCE_CYCLE.fadeIn)return {pattern:current,opacity:smooth((elapsed-fadeInStart)/SEQUENCE_CYCLE.fadeIn)};
  }
  return {pattern:current,opacity:1};
}
