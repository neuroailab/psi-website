import React from 'react';
import {AbsoluteFill, Composition, Loop, OffthreadVideo, registerRoot, staticFile} from 'remotion';

const trimmedFrames = 516;
const full = {width: '100%', height: '100%', objectFit: 'fill', display: 'block'};
function SoloCup() {
  return <OffthreadVideo muted src={staticFile('original-simulation-5.mp4')}
    trimBefore={120} trimAfter={636} style={full}/>;
}
function SimulationGrid() {
  return <AbsoluteFill>
    <OffthreadVideo muted src={staticFile('original-simulation-grid.mp4')} style={full}/>
    <div style={{position: 'absolute', left: 420, top: 242, width: 408, height: 230, overflow: 'hidden'}}>
      <Loop durationInFrames={trimmedFrames} layout="none"><SoloCup/></Loop>
    </div>
  </AbsoluteFill>;
}
registerRoot(() => <>
  <Composition id="SoloCupTrimmed" component={SoloCup} durationInFrames={trimmedFrames} fps={30} width={912} height={512}/>
  <Composition id="SimulationGridTrimmed" component={SimulationGrid} durationInFrames={2716} fps={30} width={1248} height={714}/>
</>);
