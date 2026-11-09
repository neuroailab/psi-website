import bank from './training-sequences.json' with {type:'json'};

// Add examples in a fixed shuffled order. Earlier examples remain on the page;
// the three robotics paths retain their original geometry and handoff.
export const SEQUENCE_ACCUMULATION=Object.freeze({compactStart:60,compactEnd:90,
  start:90,step:15,reveal:10,seed:0x50534917});
export const SEQUENCE_BANKS=Object.freeze({left:40,right:710,width:530,
  firstCenterY:135,rowGap:28,tokenHeight:24,tokenGap:6,arrowGap:32});
function seededRandom(seed){
  let state=seed>>>0;
  return ()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};
}
const random=seededRandom(SEQUENCE_ACCUMULATION.seed);
function shuffled(items){
  const result=[...items];
  for(let i=result.length-1;i>0;i--){
    const other=Math.floor(random()*(i+1));
    [result[i],result[other]]=[result[other],result[i]];
  }
  return result;
}
const entries=shuffled(bank.patterns);
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
    slot:index+6,additionStart:SEQUENCE_ACCUMULATION.start+index*SEQUENCE_ACCUMULATION.step});
}));
function tokenWidth(item){
  if(item.kind==='rgb')return 65;
  if(item.kind==='campose')return 112;
  if(item.kind==='depth'||item.kind==='flow')return 72;
  if(item.kind==='action')return item.label.length>3?68:42;
  return 48;
}
export function accumulatedRowLayout(pattern,slot){
  const bank=slot%2,row=Math.floor(slot/2),left=bank?SEQUENCE_BANKS.right:SEQUENCE_BANKS.left;
  const y=SEQUENCE_BANKS.firstCenterY+row*SEQUENCE_BANKS.rowGap;
  const inputWidths=pattern.inputs.map(tokenWidth),outputWidths=pattern.outputs.map(tokenWidth);
  const groupWidth=widths=>widths.reduce((sum,width)=>sum+width,0)+(widths.length-1)*SEQUENCE_BANKS.tokenGap;
  const width=groupWidth(inputWidths)+SEQUENCE_BANKS.arrowGap+groupWidth(outputWidths);
  if(width>SEQUENCE_BANKS.width)throw new Error(`Sequence exceeds bank: ${pattern.id} (${width}px)`);
  let x=left+(SEQUENCE_BANKS.width-width)/2;
  const boxes=widths=>widths.map(width=>{const box={left:x,top:y-SEQUENCE_BANKS.tokenHeight/2,width,height:SEQUENCE_BANKS.tokenHeight};x+=width+SEQUENCE_BANKS.tokenGap;return box;});
  const inputs=boxes(inputWidths);
  x+=SEQUENCE_BANKS.arrowGap-SEQUENCE_BANKS.tokenGap;
  const outputs=boxes(outputWidths);
  return {bank,row,left,y,width,inputs,outputs};
}
