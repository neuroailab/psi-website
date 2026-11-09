// Original catalog indices remain stable: featured clips, goals and source
// clocks still refer to those IDs. Only their position in the overview changes.
export const GRID_SELECTIONS=Object.freeze({
  policy:Object.freeze([0,1,5,4]),
  simulation:Object.freeze([0,1,4,5]),
  progress:Object.freeze([2,0,4,3]),
});
export const GRID_ASSETS=Object.freeze({
  policy:'policy-grid-2x2.mp4',
  simulation:'simulation-grid-2x2.mp4',
  progress:'progress-grid-2x2.mp4',
});
export const GRID_GEOMETRY=Object.freeze({width:1248,height:714,columns:2,
  tileWidth:618,tileHeight:350,columnGap:12,rowGap:14});
export const POLICY_GRID_BOX=Object.freeze({left:74,top:36,width:1132,height:1132*714/1248});

export function gridSlotBox(slot){
  const {columns,tileWidth,tileHeight,columnGap,rowGap}=GRID_GEOMETRY;
  return {left:(slot%columns)*(tileWidth+columnGap),
    top:Math.floor(slot/columns)*(tileHeight+rowGap),width:tileWidth,height:tileHeight};
}

export function selectedGridBox(kind,tile){
  // The two different-goal examples share recording 0065. Its alternate goal
  // emerges from the same overview cell and separates into the paired result.
  const primary=kind==='policy'&&tile===7?4:tile;
  const slot=GRID_SELECTIONS[kind].indexOf(primary);
  return slot<0?null:gridSlotBox(slot);
}

export function placeGridBox(box,container){
  const sx=container.width/GRID_GEOMETRY.width,sy=container.height/GRID_GEOMETRY.height;
  return {left:container.left+box.left*sx,top:container.top+box.top*sy,
    width:box.width*sx,height:box.height*sy};
}
