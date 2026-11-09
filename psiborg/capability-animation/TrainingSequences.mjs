import bank from './training-sequences.json' with {type:'json'};
import {SCATTERED_SELECTED_TRAINING_IDS} from './ScatteredSequenceLayout.mjs';

// A representative subset of literal training sequences; the full catalog
// remains unchanged alongside its YAML provenance.
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
export const TRAINING_PATTERNS=Object.freeze(bank.patterns.filter(entry=>SCATTERED_SELECTED_TRAINING_IDS.includes(entry.id)).map(entry=>{
  const tokens=entry.sequence.split(',').map(trainingToken);
  return Object.freeze({id:`training-${entry.id}`,label:entry.id,
    sequence:entry.sequence,sourceLine:entry.sourceLine,promptTokens:entry.promptTokens,
    inputs:tokens.slice(0,entry.promptTokens),outputs:tokens.slice(entry.promptTokens)});
}));
