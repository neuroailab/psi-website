import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {cancelRender, continueRender, delayRender, useCurrentFrame} from 'remotion';
import meta from './sequence-clean.json';
import {FPS, promptTiming, getPromptDimensions, getPromptState, revealOpacity, stage} from './timing.mjs';

export {promptTiming, getPromptDimensions, getPromptState, revealOpacity} from './timing.mjs';
const INTRO = 6, samples = [4, 8, 12, 16];
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => {x = clamp(x); return x * x * (3 - 2 * x);};
const mix = (a, b, t) => a + (b - a) * t;
const palettes = {
  dark: {ink: '#edf3f5', muted: '#9aafb9', line: '#263640', rgb: '#83bfff', action: '#c4a2ec', time: '#f2c579'},
  light: {ink: '#182d36', muted: '#576f7b', line: '#d5e0e5', rgb: '#246cb2', action: '#7950a6', time: '#94600c'}
};

function resolveAssets(assetBase, markSrc, goalSrc) {
  const base = new URL(assetBase.endsWith('/') ? assetBase : assetBase + '/', document.baseURI);
  return [new URL(meta.rgb_atlas.file, base).href,
    new URL(meta.action_atlas.file, base).href,
    markSrc ? new URL(markSrc, document.baseURI).href : new URL('../psi-mark.svg', base).href,
    ...(goalSrc ? [new URL(goalSrc, document.baseURI).href] : [])];
}

// The first frame cannot be captured until all three atlases/marks are decoded
// and the frame-driven layout effect has painted. No wall-clock animation runs.
function useAssets(assetBase, markSrc, goalSrc) {
  const [loaded, setLoaded] = useState(null);
  const [initialHandle] = useState(() => delayRender('Loading prompt trajectory assets', {timeoutInMilliseconds: 120000}));
  const handle = useRef(initialHandle);
  useEffect(() => {
    let cancelled = false;
    const pending = handle.current ?? delayRender('Loading prompt trajectory assets', {timeoutInMilliseconds: 120000});
    handle.current = pending;
    const urls = resolveAssets(assetBase, markSrc, goalSrc);
    Promise.all(urls.map(src => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {if (img.decode) await img.decode(); resolve(img);} catch (error) {reject(error);}
      };
      img.onerror = () => reject(new Error(`Prompt animation could not load ${src}`));
      img.src = src;
    }))).then(images => {
      if (!cancelled) setLoaded({key: `${assetBase}|${markSrc || ''}|${goalSrc || ''}`, images});
    }).catch(error => {if (!cancelled) cancelRender(error);});
    return () => {
      cancelled = true;
      if (handle.current === pending) {continueRender(pending); handle.current = null;}
    };
  }, [assetBase, markSrc, goalSrc]);
  return {images: loaded?.key === `${assetBase}|${markSrc || ''}|${goalSrc || ''}` ? loaded.images : null, handle};
}

function paint(canvas, {time, theme, width: W, height: H, mobile: isMobile, pixelRatio, images, compactQuery}) {
  const ctx = canvas.getContext('2d');
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  const [rgb, actions, mark, conditioningGoal] = images;
  const p = palettes[theme] || palettes.dark;
 function text(str,x,y,size=13,color=p.ink,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.textAlign='center';ctx.font=`${size}px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`;ctx.fillText(str,x,y);ctx.restore();}
 function actionIndex(start,count,rate=1){const clock=time<INTRO?time*2:(time-INTRO)*rate;return start+Math.floor(clock*20)%count;}
 function sprite(kind,index,x,y,w,alpha=1){const a=kind==='rgb'?meta.rgb_atlas:meta.action_atlas,h=w*.57,col=kind==='rgb'?index%a.columns:index%20,row=kind==='rgb'?Math.floor(index/a.columns):Math.floor(index/20);ctx.save();ctx.globalAlpha=alpha;if(conditioningGoal&&kind==='rgb'&&index===16){const sw=conditioningGoal.width/1.2,sh=conditioningGoal.height/1.2;ctx.drawImage(conditioningGoal,(conditioningGoal.width-sw)/2,(conditioningGoal.height-sh)/2,sw,sh,x-w/2,y-h/2,w,h);}else ctx.drawImage(kind==='rgb'?rgb:actions,col*a.tile_width,row*a.tile_height,a.tile_width,a.tile_height,x-w/2,y-h/2,w,h);ctx.restore();}
 function layout(){const mobile=isMobile,pad=mobile?6:20,gap=mobile?5:15,w=Math.min(150,(W-2*pad-6*gap)/6.25),aw=w*.75,span=4*w+3*aw+6*gap,y=mobile?97:123;let x=(W-span)/2,r=[],a=[];for(let i=0;i<4;i++){r.push({x:x+w/2,y,w});x+=w;if(i<3){x+=gap;a.push({x:x+aw/2,y,w:aw});x+=aw+gap;}}return{r,a,w,aw,mobile};}
 function box(items,color,alpha=1){const pad=isMobile?3:9,left=Math.min(...items.map(v=>v.x-v.w/2))-pad,right=Math.max(...items.map(v=>v.x+v.w/2))+pad,top=Math.min(...items.map(v=>v.y-v.w*.285))-pad,bottom=Math.max(...items.map(v=>v.y+v.w*.285))+pad;ctx.save();ctx.strokeStyle=color;ctx.lineWidth=isMobile?1.5:2;ctx.globalAlpha=alpha;ctx.shadowColor=color;ctx.shadowBlur=8;ctx.beginPath();ctx.roundRect(left,top,right-left,bottom-top,5);ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=alpha*.06;ctx.fillStyle=color;ctx.fill();ctx.restore();}
 function tokens(x,y,color,alpha,elapsed,count=5){const z=isMobile?6:11,gap=isMobile?3:5;ctx.save();ctx.fillStyle=color;for(let k=0;k<count;k++){ctx.globalAlpha=alpha*ease((elapsed-k*.07)/.09);ctx.fillRect(x-(count*z+(count-1)*gap)/2+k*(z+gap),y,z,z);}ctx.restore();}
 function curve(a,b,color,alpha=1,reveal=1,width=1.5){const mid=(a.x+b.x)/2;const point=t=>{const u=1-t;return{x:u*u*u*a.x+3*u*u*t*mid+3*u*t*t*mid+t*t*t*b.x,y:u*u*u*a.y+3*u*u*t*a.y+3*u*t*t*b.y+t*t*t*b.y};};ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);for(let i=1;i<=Math.ceil(50*reveal);i++){const c=point(Math.min(i/50,reveal));ctx.lineTo(c.x,c.y);}ctx.stroke();if(reveal>.98){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-5,b.y-3);ctx.lineTo(b.x-5,b.y+3);ctx.fill();}else if(reveal>0){const c=point(reveal);ctx.fillStyle=color;ctx.beginPath();ctx.arc(c.x,c.y,2.8,0,Math.PI*2);ctx.fill();}ctx.restore();}
 function phaseAt(t){return t<3?'trajectory':t<5?'trajectory-hold':t<7?'policy':t<9?'simulation':t<11?'progress':t<13?'rearrange':t<16?'policy-query':t<20?'simulation-query':t<23?'progress-query':t<25?'shared-model':'return';}
 function trajectory(t,opacity,l){const{r,a,w,aw,mobile}=l,phase=phaseAt(t),isFirst=t<3,sourceTime=t*4;
  ctx.save();ctx.globalAlpha=opacity;
  // No arrows or tokens in this stage: the recorded frames and actions appear in order.
  for(let i=0;i<4;i++){let alpha=isFirst?revealOpacity(t*FPS,i*2):1;if(t>=5&&t<11){const chosen=phase==='policy'?i===0||i===3:phase==='simulation'?i<2:i===0||i===3;alpha=chosen?1:.25;}sprite('rgb',samples[i],r[i].x,r[i].y,w,opacity*alpha);if(i===0||i===3)text(i===0?'Start':'Goal',r[i].x,r[i].y-w*.285-(mobile?15:18),mobile?13:20,p.ink,opacity*alpha);}
  for(let i=0;i<3;i++){let elapsed=clamp((sourceTime-i*4)/4)*4,alpha=isFirst?revealOpacity(t*FPS,i*2+1):phase==='trajectory-hold'?1:.22;if(t>=5&&i===0){alpha=phase==='progress'?.22:1;elapsed=phase==='policy'?Math.min(t-5,.999):phase==='simulation'?Math.min((t-7)*2,3.999):4;}sprite('action',actionIndex((4+i*4)*20,80,isFirst?4:1),a[i].x,a[i].y,aw,opacity*alpha);}
  const labelY=mobile?22:25;
  if(phase==='policy'){text('Policy',W/2,labelY,mobile?20:28,p.action,opacity);box([r[0],a[0]],p.action,opacity);box([r[3]],p.action,opacity);}
  if(phase==='simulation'){text('Simulation',W/2,labelY,mobile?20:28,p.rgb,opacity);box([r[0],a[0],r[1]],p.rgb,opacity);}
  if(phase==='progress'){text('Δt · 12 s',W/2,labelY,mobile?20:28,p.time,opacity);box([r[0]],p.time,opacity);box([r[3]],p.time,opacity);ctx.save();ctx.globalAlpha=opacity;ctx.strokeStyle=p.time;ctx.lineWidth=1.5;const y=labelY+10;ctx.beginPath();ctx.moveTo(r[0].x,y+5);ctx.lineTo(r[0].x,y);ctx.lineTo(r[3].x,y);ctx.lineTo(r[3].x,y+5);ctx.stroke();ctx.restore();}
  ctx.restore();
 }
 function rows(t,q,l,staticView){const mobile=l.mobile,w=Math.min(150,W*.17),ys=mobile?[80,240,400]:[105,300,495],x1=W*.115,x2=W*.315,xo=W*.85,m={x:W*.56,y:ys[1]},radius=mobile?21:36,phase=phaseAt(t),active=phase==='policy-query'?0:phase==='simulation-query'?1:phase==='progress-query'?2:-1;
  const all=staticView||phase==='shared-model'||phase==='return',names=['Policy','Simulation','Progress'],inks=[p.action,p.rgb,p.time];
  function media(kind,index,from,to,label,alpha,color,tokenTime){const pos={x:mix(from.x,to.x,q),y:mix(from.y,to.y,q)},width=mix(from.w,w,q);sprite(kind,index,pos.x,pos.y,width,alpha*q);const captionAlpha=alpha*ease((q-.55)/.45);text(label,pos.x,pos.y+width*.285+(mobile?22:27),mobile?12:18,p.muted,captionAlpha);tokens(pos.x,pos.y+width*.285+(mobile?36:40),color,captionAlpha,tokenTime);}
  for(let i=0;i<3;i++){const alpha=active<0||active===i?1:.38,y=ys[i],color=inks[i],stream=staticView?10:t-[13,16,20][i];media('rgb',4,l.r[0],{x:x1,y},'RGB₀',alpha,p.rgb,stream);
   if(i===1){const elapsed=staticView?3.999:Math.max(0,Math.min(t-16,3.999));media('action',actionIndex(80,80),l.a[0],{x:x2,y},'Action',alpha,p.action,stream-.35);}
   else media('rgb',16,l.r[3],{x:x2,y},i===0?'Goalₜ':'Goal',alpha,p.rgb,stream-.35);
   if(i===0){media('action',actionIndex(80,20),l.a[0],{x:xo,y},'Action',alpha,p.action,stream-1.55);}
   else if(i===1)media('rgb',8,l.r[1],{x:xo,y},'Next RGB',alpha,p.rgb,stream-1.55);
   else{const tx=mix((l.r[0].x+l.r[3].x)/2,xo,q),ty=mix(50,y,q);text('12 s',tx,ty+8,mobile?30:42,p.time,alpha*q);text('Δt',tx,ty+(mobile?36:44),mobile?15:20,p.muted,alpha*q);tokens(tx,ty+(mobile?49:59),p.time,alpha*ease(q),stream-1.55);}
   const from={x:x2+w/2+9,y},entry={x:m.x-radius-8,y:m.y},exit={x:m.x+radius+8,y:m.y},to={x:xo-w/2-9,y};const wireAlpha=alpha*ease((q-.5)/.5);curve(from,entry,color,wireAlpha*.35);curve(exit,to,color,wireAlpha*.35);
   if(active===i||all){const elapsed=all?5:t-(i===0?13:i===1?16:20);curve(from,entry,color,wireAlpha,ease(elapsed/.85),2.5);curve(exit,to,color,wireAlpha,ease((elapsed-.85)/.9),2.5);}
  }
  ctx.save();ctx.globalAlpha=ease((q-.3)/.7);ctx.drawImage(mark,m.x-radius,m.y-radius,radius*2,radius*2);ctx.restore();
 }

 function single(s,l,staticView){const {q,type}=s,mobile=l.mobile,w=Math.min(150,W*.17),y=mobile?140:155,x1=W*.115,x2=W*.315,xo=W*.85,m={x:W*.56,y},radius=mobile?23:40,color=[p.action,p.rgb,p.time][type],stream=staticView?10:s.elapsed;

  function media(kind,index,from,x,label,ink,clock){const pos={x:mix(from.x,x,q),y:mix(from.y,y,q)},width=mix(from.w,w,q);sprite(kind,index,pos.x,pos.y,width,q);const a=ease((q-.5)/.5);text(label,pos.x,pos.y+width*.285+(mobile?22:28),mobile?12:18,p.muted,a);tokens(pos.x,pos.y+width*.285+(mobile?36:43),ink,a,clock);}
  media('rgb',4,l.r[0],x1,'RGB₀',p.rgb,stream);
  if(type===1)media('action',actionIndex(80,80),l.a[0],x2,'Action',p.action,stream-.35);
  else media('rgb',16,l.r[3],x2,conditioningGoal?'Goal image':type===0?'Goalₜ':'Goal',p.rgb,stream-.35);
  if(type===0)media('action',actionIndex(80,20),l.a[0],xo,'Action',p.action,stream-1.55);
  else if(type===1)media('rgb',8,l.r[1],xo,'Next RGB',p.rgb,stream-1.55);
  else{const x=mix((l.r[0].x+l.r[3].x)/2,xo,q),ty=mix(50,y,q);text('12 s',x,ty+10,mobile?32:44,p.time,q);text('Δt',x,ty+45,mobile?16:20,p.muted,q);tokens(x,ty+62,p.time,q,stream-1.55);}
  const a=ease((q-.45)/.55),from={x:x2+w/2+9,y},entry={x:m.x-radius-8,y},exit={x:m.x+radius+8,y},to={x:xo-w/2-9,y};
  curve(from,entry,color,a*.22);curve(exit,to,color,a*.22);
  curve(from,entry,color,a,ease(stream/.85),2.5);curve(exit,to,color,a,ease((stream-.85)/.9),2.5);
  ctx.save();ctx.globalAlpha=a;ctx.drawImage(mark,m.x-radius,m.y-radius,radius*2,radius*2);ctx.restore();
 }

  // Compact policy/simulation prompts share the same media geometry. Every
  // input, label and token group follows its explicit ordered reveal clock.
  if (compactQuery) {
    const f=compactQuery.reviewFrame, w=300, y=155, radius=40;
    const simulation=compactQuery.kind==='simulation';
    const a=compactQuery.reveal,arrows=compactQuery.arrows,starts=compactQuery.tokenStart;
    const color=simulation?p.rgb:p.action;
    const x1=155, x2=475, xm=740, xo=1000;
    ctx.clearRect(0,0,W,H);
    sprite('rgb',compactQuery.observationIndex,x1,y,w,a.current);
    if(simulation){
      sprite('action',compactQuery.actionIndex,x2,y,w,a.second);
      sprite('rgb',compactQuery.outputObservationIndex,xo,y,w,a.output);
    }else{
      sprite('rgb',16,x2,y,w,a.second);
      sprite('action',compactQuery.actionIndex,xo,y,w,a.output);
    }
    const labelY=y+w*.285+31, tokenY=labelY+20;
    text('Current Observation',x1,labelY,23,p.muted,a.current);
    text(simulation?'Action':'Goal',x2,labelY,23,p.muted,a.second);
    text(simulation?'Next Observation':'Action',xo,labelY,23,p.muted,a.output);
    tokens(x1,tokenY,p.rgb,a.current,(f-starts.current)/FPS);
    tokens(x2,tokenY,simulation?p.action:p.rgb,a.second,(f-starts.second)/FPS);
    tokens(xo,tokenY,color,a.output,(f-starts.output)/FPS);
    const from={x:x2+w/2+12,y},entry={x:xm-radius-8,y};
    const exit={x:xm+radius+8,y},to={x:xo-w/2-12,y};
    // Fixed, complete arrows brighten together once; no moving tips or traces.
    curve(from,entry,color,.22*a.second);
    curve(exit,to,color,.22*a.second);
    curve(from,entry,color,arrows.input,1,2.5);
    curve(exit,to,color,arrows.output,1,2.5);
    ctx.save();ctx.globalAlpha=a.model;
    ctx.drawImage(mark,xm-radius,y-radius,radius*2,radius*2);
    ctx.restore();
    return 1;
  }

  const t = time, l = layout(), intro = t < INTRO;
  const fade = intro ? 1 - ease((t - 5.5) / .5) : 1;
  const local = Math.max(0, t - INTRO), s = stage(local);
  const contentHeight = intro ? (isMobile ? 490 : 620) : (isMobile ? 270 : 320);
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(0, Math.max(0, (H - contentHeight) / 2));
  if (intro) {
    ctx.save(); ctx.globalAlpha = fade; rows(13 + t * 2, 1, l, false); ctx.restore();
  } else {
    // The seven interleaved items use one shared 15-frame beat. Each reaches
    // full opacity on its beat; the original source/action playback is intact.
    if (s.q < 1) trajectory(s.trajectory, 1 - s.q, l);
    if (s.q > 0) single(s, l, false);
  }
  ctx.restore();
  // Per-item fades own the trajectory entrance. A separate canvas fade would
  // delay the first RGB by eight frames and break the uniform reveal beat.
  return intro ? fade : 1;
}

/** Shared, deterministic prompt scene for both Remotion Player and video export.
 * full: 1020 frames; teaser: 180 frames; detail: 840 frames, all at 30 fps.
 * width is the logical drawing width. stageHeight reserves fixed layout bounds.
 */
export function PromptFilm({mode = 'full', theme = 'dark', assetBase = './assets/trajectory/',
  markSrc, goalSrc, width = 1160, mobile = width < 600, stageHeight, pixelRatio = 2, compactQuery}) {
  const frame = useCurrentFrame();
  const canvas = useRef(null);
  const {images, handle} = useAssets(assetBase, markSrc, goalSrc);
  const state = getPromptState(frame, mode);
  const height = stageHeight ?? getPromptDimensions({mode, width, mobile}).height;
  useLayoutEffect(() => {
    if (!canvas.current || !images) return;
    const opacity = paint(canvas.current, {time: state.sourceFrame / FPS, theme,
      width, height, mobile, pixelRatio, images, compactQuery});
    canvas.current.style.opacity = String(opacity);
    if (handle.current !== null) {continueRender(handle.current); handle.current = null;}
  }, [images, state.sourceFrame, theme, width, height, mobile, pixelRatio, compactQuery]);
  return <canvas ref={canvas} width={Math.round(width * pixelRatio)} height={Math.round(height * pixelRatio)}
    role="img" aria-label={compactQuery?.kind==='simulation'?'Simulation prompt using recorded observations and action commands':goalSrc?'Policy prompt using the actual conditioning goal image and recorded plate actions':'Policy, simulation and progress prompts from one recorded trajectory'}
    data-prompt-frame={frame} data-source-frame={compactQuery?1800+compactQuery.observationIndex*30:state.sourceFrame} data-film-phase={compactQuery?`${compactQuery.kind}-query`:state.phase}
    data-capability={compactQuery?compactQuery.kind:state.capability} data-capability-rows={compactQuery?1:state.rows}
    data-rgb-samples={compactQuery?[compactQuery.observationIndex,compactQuery.outputObservationIndex].filter(x=>x!==undefined).join(','):'4,8,12,16'} data-reveal-spacing-frames={compactQuery?(compactQuery.tokenSpacingFrames??24):15}
    data-current-opacity={compactQuery?.reveal.current} data-second-input-opacity={compactQuery?.reveal.second}
    data-model-opacity={compactQuery?.reveal.model} data-output-opacity={compactQuery?.reveal.output}
    data-arrow-mode={compactQuery?'light-once':undefined}
    data-input-arrow-intensity={compactQuery?.arrows.input} data-output-arrow-intensity={compactQuery?.arrows.output}
    data-action-index={compactQuery?.actionIndex} data-output-observation-index={compactQuery?.outputObservationIndex}
    data-media-width={compactQuery?300:undefined} data-arrow-lengths={compactQuery?'55,50':undefined}
    style={{display: 'block', width: '100%', height: '100%', background: 'transparent'}}/>;
}
