// Thirteen equal-size paths share one model, with room between every row.
// Main-path anchors allow a direct handoff into the three overview columns.
export const SCATTERED_LAYOUT=Object.freeze({
  tokenWidth:92,tokenHeight:38,tokenGap:10,
  inputLeft:40,inputRight:573,outputLeft:709,outputRight:1240,
  inputTurn:583,outputTurn:697,
  modelPortCenterY:360,modelPortHalfRange:36,
});

// These are literal entries in training-sequences.json. The seven-token
// continuation and redundant RGB/flow examples remain in the source catalog.
export const SCATTERED_SELECTED_TRAINING_IDS=Object.freeze([
  'camera-conditioned','depth-flow','depth-action-flow','camera-trajectory',
]);

// Each row has independent input/output offsets: different token counts and
// distances from the model give every sequence its own visible length.
// Counts describe the existing prompt/prediction split, not a new split.
const tracks=[
  ['simulation',145,2,1,350,733],
  ['video',190,1,2,80,960],
  ['video-flow',232,2,1,245,1100],
  ['mixed',274,1,4,450,760],
  ['training-camera-conditioned',316,2,1,160,975],
  ['training-depth-action-flow',358,3,3,240,730],
  ['rgb-flow-action',400,1,2,285,1020],
  ['training-depth-flow',442,2,3,90,865],
  ['rgb-action',480,2,2,325,795],
  ['policy',520,2,2,379,709],
  ['training-camera-trajectory',568,3,2,40,930],
  ['flow-video',620,2,1,215,850],
  ['progress',685,2,1,365,720],
];
export const SCATTERED_TRACK_DEFINITIONS=Object.freeze(tracks.map(
  ([id,centerY,inputCount,outputCount,inputLeft,outputLeft],index)=>Object.freeze({
    id,index,centerY,inputCount,outputCount,inputLeft,outputLeft,
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
  const start=track[`${side}Left`];
  return Array.from({length:count},(_,index)=>({
    left:start+index*(width+gap),top:track.centerY-height/2,width,height,
  }));
}
