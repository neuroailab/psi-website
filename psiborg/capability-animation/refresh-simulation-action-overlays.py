#!/usr/bin/env python3
"""Split verified clean montage windows and rebuild only simulation media.

Example: python refresh-simulation-action-overlays.py --source simulation.mp4
  --work-dir /tmp/psiborg-simulation-actions --install
The four existing RGB sequences keep their source clocks. Crossfades and the
montage's final hold are excluded. The action charts are already in the supplied
video; this script does not synthesize commands or draw new charts.
"""
from pathlib import Path
import argparse,hashlib,json,shutil,subprocess

ROOT=Path(__file__).resolve().parent
ASSETS=ROOT.parent/'assets'
SOURCE_SHA='bdefa16d35e388d772eded6cf252fd18766124ca1639b0d65ca5ad8444f6e866'
# Original grid tile, existing basename, inclusive start, exclusive end.
CLIPS=[(0,'simulation-1',312,456),(1,'simulation-2',0,144),
       (4,'simulation-5-trim8',468,864),(5,'simulation-6',156,300)]
GRID_FRAMES=2716
RETURN_FRAME=1714
def digest(path):return hashlib.file_digest(path.open('rb'),'sha256').hexdigest()
def probe(path):
 d=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]))
 v=next(s for s in d['streams'] if s['codec_type']=='video')
 return {'width':v['width'],'height':v['height'],'fps':v['r_frame_rate'],'frames':v.get('nb_frames'),
  'duration':v.get('duration'),'bytes':path.stat().st_size,'color_space':v.get('color_space'),
  'audio_streams':sum(s['codec_type']=='audio' for s in d['streams'])}
def ffmpeg(args):subprocess.run(['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y',*map(str,args)],check=True)
def install(source,destination):
 pending=destination.with_name(destination.name+'.refresh');shutil.copy2(source,pending)
 assert digest(source)==digest(pending);pending.replace(destination)
def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--source',type=Path,required=True);parser.add_argument('--work-dir',type=Path,required=True)
 parser.add_argument('--install',action='store_true');args=parser.parse_args()
 assert digest(args.source)==SOURCE_SHA,'Unexpected montage; verify its clean cuts before reuse'
 args.work_dir.mkdir(parents=True,exist_ok=True)
 report={'source_file':args.source.name,'source_sha256':SOURCE_SHA,'source_fps':30,
  'excluded_crossfade_ranges':[[144,156],[300,312],[456,468]],'excluded_final_hold':[864,876],
  'grid_frames':GRID_FRAMES,'return_grid_frame':RETURN_FRAME,'clips':[],'grid_assets':[]}
 encoding=['-an','-c:v','libx264','-preset','fast','-crf','18','-threads','2','-pix_fmt','yuv420p',
           '-colorspace','bt709','-color_range','tv','-movflags','+faststart']
 for tile,name,start,end in CLIPS:
  video=args.work_dir/(name+'.mp4');poster=video.with_suffix('.jpg')
  print(f'Encoding {name}: clean source frames {start}–{end-1}',flush=True)
  ffmpeg(['-threads','1','-filter_threads','1','-i',args.source,
   '-vf',f'trim=start_frame={start}:end_frame={end},setpts=PTS-STARTPTS',
   '-frames:v',end-start,'-vsync','0',*encoding,video])
  info=probe(video);assert int(info['frames'])==end-start and info['fps']=='30/1' and info['audio_streams']==0
  ffmpeg(['-threads','1','-filter_threads','1','-i',video,'-vf',
   'scale=in_color_matrix=bt709:out_color_matrix=bt601:out_range=full',
   '-frames:v','1','-threads','1','-pix_fmt','yuvj420p','-q:v','2',poster])
  report['clips'].append({'tile':tile,'basename':name,'source_start_frame':start,'source_end_frame_exclusive':end,
   'output_sha256':digest(video),'poster_sha256':digest(poster),'metadata':info})
 command=['-filter_complex_threads','1']
 for _,name,_,_ in CLIPS:command+=['-threads','1','-stream_loop','-1','-i',args.work_dir/(name+'.mp4')]
 filters=[f'[{i}:v]scale=618:348:flags=lanczos:in_color_matrix=bt709:out_color_matrix=bt709,setsar=1,setpts=PTS-STARTPTS,pad=630:364:0:1:color=0x0c1921[t{i}]' for i in range(4)]
 filters.append('[t0][t1][t2][t3]xstack=inputs=4:layout=0_0|630_0|0_364|630_364,crop=1248:714:0:0[out]')
 grid=args.work_dir/'simulation-grid-2x2.mp4'
 print(f'Encoding simulation-only 2×2 grid: {GRID_FRAMES} frames, four independent source loops',flush=True)
 ffmpeg([*command,'-filter_complex',';'.join(filters),'-map','[out]','-frames:v',GRID_FRAMES,
  '-vsync','0',*encoding,'-progress',args.work_dir/'grid-progress.log',grid])
 info=probe(grid);assert int(info['frames'])==GRID_FRAMES and (info['width'],info['height'])==(1248,714)
 poster=grid.with_suffix('.jpg');returned=args.work_dir/'simulation-grid-return-2x2.png'
 ffmpeg(['-threads','1','-filter_threads','1','-i',grid,'-vf',
  'scale=in_color_matrix=bt709:out_color_matrix=bt601:out_range=full','-frames:v','1',
  '-threads','1','-pix_fmt','yuvj420p','-q:v','2',poster])
 ffmpeg(['-threads','1','-filter_threads','1','-ss',str(RETURN_FRAME/30),'-i',grid,
  '-vf','scale=in_color_matrix=bt709:out_color_matrix=bt709,format=rgb24','-frames:v','1','-threads','1',returned])
 for path in [grid,poster,returned]:
  report['grid_assets'].append({'output':path.name,'output_sha256':digest(path),'metadata':probe(path)})
 if args.install:
  for folder in ['capability-film','carousel']:
   for _,name,_,_ in CLIPS:
    for suffix in ['.mp4','.jpg']:install(args.work_dir/(name+suffix),ASSETS/folder/(name+suffix))
  for path in [grid,poster,returned]:install(path,ASSETS/'capability-film'/path.name)
  catalog_path=ASSETS/'carousel/catalog.json';catalog=json.loads(catalog_path.read_text())
  for episode in catalog['simulation']:
   if Path(episode['video']).stem in {c[1] for c in CLIPS}:episode['crop']=[0,0,1920,1080]
  pending=args.work_dir/'catalog.json';pending.write_text(json.dumps(catalog,indent=2)+'\n');install(pending,catalog_path)
  (ROOT/'simulation-action-overlays.json').write_text(json.dumps(report,indent=2)+'\n')
  reflow_path=ROOT/'four-grid-assets.json';reflow=json.loads(reflow_path.read_text())
  for index,entry in enumerate(reflow['assets']):
   replacement=next((g for g in report['grid_assets'] if g['output']==entry['output']),None)
   if replacement:reflow['assets'][index]={**replacement,'tiles':[0,1,4,5],
    'generation':'Independent loops of the four clean action-overlay clips; see simulation-action-overlays.json'}
   elif entry['output'] in ['simulation-2.mp4','simulation-2.jpg']:
    path=args.work_dir/entry['output'];value=digest(path)
    reflow['assets'][index]={'source':'carousel/'+path.name,'output':path.name,
     'source_sha256':value,'output_sha256':value,'metadata':probe(path)}
  reflow_path.write_text(json.dumps(reflow,indent=2)+'\n')
 (args.work_dir/'simulation-action-overlays.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'installed':args.install,'clips':len(report['clips']),'grid_frames':GRID_FRAMES},indent=2),flush=True)
if __name__=='__main__':main()
