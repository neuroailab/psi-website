import React from 'react';
import {AbsoluteFill,getRemotionEnvironment,staticFile,useCurrentFrame} from 'remotion';
import {useFilmTheme,filmThemeVariables} from './FilmTheme';
import {Grid} from './full-film-original/Story';
import {CAPABILITY_PATTERNS,OPENING_TIMING,OVERVIEW_LAYOUT,PromptDiagram,ModelMark,CapabilityTitleLabel,
  overviewLogoBox,overviewMediaBox} from './PromptDiagram';

export {OVERVIEW_LAYOUT,overviewTitleBox,overviewLogoBox,overviewMediaBox,overviewTokenBoxes} from './PromptDiagram';

/** Each capability keeps one horizontal prompt above its own recorded examples. */
export function CapabilityOverview({showDiagrams=true,showTitles=true,hideOpeningHeading,hideOpeningGrid,
  opacity=1,gridOpacity=1,titleOpacity=1,transparent=false,markSrc,
  gridPlaybackStart=OPENING_TIMING.gridPlaybackStart}){
  const frame=useCurrentFrame(),palette=useFilmTheme();
  const src=markSrc||(getRemotionEnvironment().isRendering
    ?staticFile('assets/capability-film/psi-mark.svg'):'./assets/capability-film/psi-mark.svg');
  return <AbsoluteFill data-capability-overview data-capability-overview-frame={frame}
    data-overview-grid-clock-start={gridPlaybackStart} data-overview-grid-source-frame={0}
    data-overview-grid-playing={false}
    data-overview-layout="horizontal-prompts" data-overview-prompt-center-y={OVERVIEW_LAYOUT.promptY}
    data-overview-block-center-y={(OVERVIEW_LAYOUT.titleY-OVERVIEW_LAYOUT.titleLineHeight/2+OVERVIEW_LAYOUT.gridTop+OVERVIEW_LAYOUT.gridHeight)/2}
    style={{...filmThemeVariables(palette),background:transparent?'transparent':palette.bg,opacity,
      color:palette.ink,fontFamily:'Arial, Helvetica, sans-serif'}}>
    {CAPABILITY_PATTERNS.map(pattern=>{
      const box=overviewMediaBox(pattern),scale=box.width/1248;
      const hidden=hideOpeningGrid===pattern.id;
      return <div key={pattern.id} data-capability-column={pattern.id} data-overview-grid={pattern.id}
        data-opening-grid-container={pattern.id} data-opening-grid-hidden={hidden}
        data-grid-left={box.left} data-grid-top={box.top} data-grid-width={box.width} data-grid-height={box.height}
        data-grid-opacity={hidden?0:gridOpacity} data-grid-clock-start={gridPlaybackStart}
        data-grid-clock-frame={0}
        style={{position:'absolute',...box,borderRadius:8,overflow:'hidden',opacity:hidden?0:gridOpacity}}>
        <div style={{width:1248,height:714,transform:`scale(${scale})`,transformOrigin:'top left'}}>
          {/* Overviews stay on frame zero; only expanded examples play. */}
          <Grid kind={pattern.id}/>
        </div>
      </div>;
    })}
    {showDiagrams&&CAPABILITY_PATTERNS.map(pattern=><PromptDiagram key={pattern.id} pattern={pattern} frame={frame} morph={1}/>)}
    {showDiagrams&&CAPABILITY_PATTERNS.map(pattern=><ModelMark key={pattern.id} kind={pattern.id} box={overviewLogoBox(pattern)} src={src}/>)}
    {showTitles&&CAPABILITY_PATTERNS.map(pattern=><CapabilityTitleLabel key={pattern.id} pattern={pattern}
      opacity={hideOpeningHeading===pattern.id?0:titleOpacity}/>)}
  </AbsoluteFill>;
}
