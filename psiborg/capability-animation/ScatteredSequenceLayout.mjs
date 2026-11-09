// Eighteen equal-size paths share one model. Adjacent rows overlap vertically
// only where their input/output groups occupy different horizontal lanes.
// The three robotics paths retain their original y centers for the handoff.
export const SCATTERED_LAYOUT=Object.freeze({
  tokenWidth:92,tokenHeight:38,tokenGap:10,
  inputLeft:40,inputRight:555,outputLeft:735,outputRight:1240,
  inputTurn:567,outputTurn:721,
  modelPortCenterY:360,modelPortHalfRange:36,
});

// These are literal entries in training-sequences.json. The seven-token
// continuation and redundant RGB/flow examples remain in the source catalog.
export const SCATTERED_SELECTED_TRAINING_IDS=Object.freeze([
  'camera-conditioned','depth-flow','camera-flow','depth-action',
  'pose-estimation','action-flow','camera-depth-flow','depth-action-flow',
  'camera-trajectory',
]);

// Counts describe the existing prompt/prediction split, not a new split.
// Four-token outputs are flanked by single-token outputs; three-token groups
// are flanked by groups of at most two, keeping every adjacent pair disjoint.
const tracks=[
  ['video',145,1,2],
  ['video-flow',173,2,1],
  ['mixed',201,1,4],
  ['training-camera-conditioned',229,2,1],
  ['training-camera-depth-flow',257,3,3],
  ['rgb-flow-action',285,1,2],
  ['training-depth-action-flow',313,3,3],
  ['training-camera-flow',341,2,2],
  ['training-depth-action',369,3,2],
  ['training-depth-flow',397,2,3],
  ['rgb-action',425,2,2],
  ['policy',464,2,2],
  ['training-camera-trajectory',490,3,2],
  ['simulation',516,2,1],
  ['training-action-flow',542,2,2],
  ['progress',568,2,1],
  ['flow-video',597,2,1],
  ['training-pose-estimation',626,2,1],
];
export const SCATTERED_TRACK_DEFINITIONS=Object.freeze(tracks.map(
  ([id,centerY,inputCount,outputCount],index)=>Object.freeze({
    id,index,centerY,inputCount,outputCount,
    inputAnchor:index%2?'right':'left',
    outputAnchor:index%2?'right':'left',
  })));
const byId=new Map(SCATTERED_TRACK_DEFINITIONS.map(track=>[track.id,track]));

export function scatteredTrack(patternOrId){
  const id=typeof patternOrId==='string'?patternOrId:patternOrId.id;
  const track=byId.get(id);
  if(!track)throw new Error(`Unknown scattered sequence: ${id}`);
  return track;
}
export const scatteredRowY=pattern=>scatteredTrack(pattern).centerY;
export function scatteredModelPortY(pattern){
  const {index}=scatteredTrack(pattern);
  return SCATTERED_LAYOUT.modelPortCenterY+SCATTERED_LAYOUT.modelPortHalfRange*
    (2*index/(SCATTERED_TRACK_DEFINITIONS.length-1)-1);
}
export function scatteredTokenBoxes(patternOrId,side){
  if(side!=='input'&&side!=='output')throw new Error(`Unknown token side: ${side}`);
  const track=scatteredTrack(patternOrId),count=track[`${side}Count`];
  if(typeof patternOrId!=='string'&&patternOrId[`${side}s`]?.length!==count){
    throw new Error(`Prompt split changed for ${track.id}: expected ${count} ${side} tokens`);
  }
  const {tokenWidth:width,tokenHeight:height,tokenGap:gap}=SCATTERED_LAYOUT;
  const groupWidth=count*width+(count-1)*gap;
  const start=track[`${side}Anchor`]==='left'?SCATTERED_LAYOUT[`${side}Left`]:
    SCATTERED_LAYOUT[`${side}Right`]-groupWidth;
  return Array.from({length:count},(_,index)=>({
    left:start+index*(width+gap),top:track.centerY-height/2,width,height,
  }));
}
