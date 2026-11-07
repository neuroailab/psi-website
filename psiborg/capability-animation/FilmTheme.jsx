import React,{createContext,useContext} from 'react';

// Keep the approved dark film unchanged while matching the blog's light paper.
// These colors affect the animation UI only; recorded media is never filtered.
export const FILM_PALETTES=Object.freeze({
  dark:Object.freeze({theme:'dark',bg:'#0b1117',ink:'#eef4f7',muted:'#9aafb9',line:'#263640',
    surface:'#111c24',mediaSurface:'#101c24',policy:'#b7faf0',policyAccent:'#70d9ce',
    simulation:'#83bfff',progress:'#efc372',rgb:'#83bfff',action:'#c4a2ec',time:'#f2c579',
    labelBg:'#0b1117e8',cueShadow:'0 3px 24px #00000088',
    headingFrom:{policy:[121,227,213],simulation:[131,191,255],progress:[242,197,121]},
    headingTo:{policy:[183,250,240],simulation:[131,191,255],progress:[239,195,114]}}),
  light:Object.freeze({theme:'light',bg:'#fbfaf7',ink:'#182d36',muted:'#576f7b',line:'#d5e0e5',
    surface:'#fbfaf7',mediaSurface:'#edf3f4',policy:'#096e69',policyAccent:'#096e69',
    simulation:'#246cb2',progress:'#94600c',rgb:'#246cb2',action:'#7950a6',time:'#94600c',
    labelBg:'#fbfaf7e8',cueShadow:'0 3px 24px #fbfaf788',
    headingFrom:{policy:[9,110,105],simulation:[36,108,178],progress:[148,96,12]},
    headingTo:{policy:[9,110,105],simulation:[36,108,178],progress:[148,96,12]}}),
});
const FilmThemeContext=createContext(FILM_PALETTES.dark);
export const filmPalette=theme=>FILM_PALETTES[theme]||FILM_PALETTES.dark;
export const useFilmTheme=()=>useContext(FilmThemeContext);
export function FilmThemeProvider({theme='dark',children}){
  return <FilmThemeContext.Provider value={filmPalette(theme)}>{children}</FilmThemeContext.Provider>;
}
export function filmThemeVariables(p){
  return {'--paper':p.bg,'--surface':p.surface,'--line':p.line,'--ink':p.ink,'--muted':p.muted,
    '--accent':p.policyAccent,'--policy':p.simulation,'--progress':p.time};
}
