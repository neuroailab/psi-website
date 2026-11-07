import React from 'react';
import {useFilmTheme} from './FilmTheme';
import {AbsoluteFill, Sequence} from 'remotion';
import {ConceptScene,CONCEPT_DURATION} from './ConceptScene';
import {CapabilityExamples,EXAMPLES,EXAMPLES_DURATION} from './CapabilityExamples';

export const FPS=30,WIDTH=1280,HEIGHT=720;
export const DURATION=CONCEPT_DURATION+EXAMPLES_DURATION;
export const CHAPTERS=[{label:'One-goal concept',frame:0},
  {label:'Generalization across objects and goals',frame:CONCEPT_DURATION},
  ...EXAMPLES.map(e=>({label:({'known-objects':'Known objects','unseen-objects':'Unseen objects','different-goals':'Different goals'})[e.id],
    frame:CONCEPT_DURATION+e.start}))];
export function Preview({assetBase='./assets/'}) {
  const palette=useFilmTheme();
  return <AbsoluteFill style={{background:palette.bg}}>
    <Sequence durationInFrames={CONCEPT_DURATION}><ConceptScene assetBase={assetBase}/></Sequence>
    <Sequence from={CONCEPT_DURATION} durationInFrames={EXAMPLES_DURATION}><CapabilityExamples assetBase={assetBase}/></Sequence>
  </AbsoluteFill>;
}
