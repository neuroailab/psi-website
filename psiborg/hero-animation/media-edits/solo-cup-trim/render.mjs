import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir, readdir, readFile, writeFile, copyFile, access, symlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const blogArg = process.argv.find(a => a.startsWith('--blog-root='));
const blogRoot = blogArg?.slice('--blog-root='.length) || process.env.PSIBORG_BLOG_ROOT || path.resolve(here, '../../..');
await mkdir(path.join(here, 'public'), {recursive: true});
for (const [source, target] of [['assets/carousel/simulation-5.mp4', 'original-simulation-5.mp4'],
  ['assets/hero-story/simulation-grid.mp4', 'original-simulation-grid.mp4']]) {
  const dest = path.join(here, 'public', target);
  try {await access(dest);} catch {await copyFile(path.join(blogRoot, source), dest);}
}
const require = createRequire(import.meta.url);
const entry = require.resolve('@remotion/renderer');
require(path.join(path.dirname(entry), 'port-config.js')).getPortConfig = () => ({host: '127.0.0.1', hostsToTry: ['127.0.0.1']});
const {bundle} = await import('@remotion/bundler');
const {getCompositions, renderStill, renderFrames} = require('@remotion/renderer');
const out = path.join(here, 'output');
await mkdir(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(here, 'remotion/index.jsx'), publicDir: path.join(here, 'public'), outDir: path.join(here, 'bundle')});
const base = {serveUrl, timeoutInMilliseconds: 120000,
  browserExecutable: '/ccn2/u/atlask/ccwm/ccwm/psi2/robots/corl_demo/remotion/node_modules/.remotion/chrome-headless-shell/linux64/chrome-headless-shell-linux64/chrome-headless-shell',
  binariesDirectory: '/tmp/psiborg-story-runtime/bin'};
const compositions = await getCompositions(base);
const reports = [];
for (const [id, name] of [['SoloCupTrimmed', 'simulation-5'], ['SimulationGridTrimmed', 'simulation-grid']]) {
  const composition = compositions.find(c => c.id === id);
  const frameDir = path.join(out, name + '-frames');
  await mkdir(frameDir, {recursive: true});
  const saved = new Set((await readdir(frameDir)).map(n => Number(n.match(/^element-(\d+)\.png$/)?.[1])).filter(Number.isFinite));
  const total = composition.durationInFrames;
  // All simulation predictions advance on 12-frame (400ms) boundaries.
  // Checked source hold frames differ only by tiny H.264 compression noise.
  const sampleStep = id === 'SimulationGridTrimmed' ? 12 : 1;
  const requested = Array.from({length: Math.ceil(total / sampleStep)}, (_, i) => i * sampleStep);
  const missing = requested.filter(i => !saved.has(i));
  let last = -1;
  console.log(`${id}: rendering ${missing.length} frames; reusing ${saved.size}`);
  if (missing.length) await renderFrames({...base, composition, outputDir: frameDir, frames: missing,
    imageFormat: 'png', concurrency: 4, offthreadVideoThreads: 4,
    offthreadVideoCacheSizeInBytes: 1024 * 1024 * 1024,
    onFrameUpdate: count => {const pct = Math.floor(count / missing.length * 20) * 5;
      if (pct > last) {last = pct; console.log(`${id}: ${pct}% (${count}/${missing.length})`);}}});
  const names = (await readdir(frameDir)).filter(n => /^element-\d+\.png$/.test(n)).sort();
  const digits = names[0].match(/^element-(\d+)\./)[1].length;
  const encodeDir = path.join(out, name + '-encode-frames');
  await mkdir(encodeDir, {recursive: true});
  for (const [i, sourceFrame] of requested.entries()) {
    const source = path.join(frameDir, `element-${String(sourceFrame).padStart(digits, '0')}.png`);
    await access(source);
    const target = path.join(encodeDir, `element-${String(i).padStart(4, '0')}.png`);
    try {await access(target);} catch {await symlink(source, target);}
  }
  const output = path.join(out, name + '.mp4');
  console.log(`${id}: encoding ${total} frames`);
  await new Promise((resolve, reject) => {
    const child = spawn('/tmp/psiborg-story-runtime/bin/ffmpeg', ['-nostdin', '-v', 'error', '-threads', '1', '-filter_threads', '1',
      '-framerate', String(30 / sampleStep), '-i', path.join(encodeDir, 'element-%04d.png'),
      '-vf', 'fps=30', '-frames:v', String(total),
      '-an', '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', '-crf', '16', '-g', '30',
      '-threads', '1', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-y', output], {stdio: 'inherit'});
    child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Encoding exited ${code}`)));
  });
  await renderStill({...base, composition, frame: 0, imageFormat: 'jpeg', jpegQuality: 95, output: path.join(out, name + '.jpg')});
  reports.push({renderer: 'Remotion 4.0.523', composition: id, frames: total, fps: composition.fps,
    width: composition.width, height: composition.height, sourceTrimFrames: 240, sourceTrimSeconds: 8,
    output, poster: path.join(out, name + '.jpg'), codec: 'h264', crf: 16, x264Preset: 'ultrafast', audio: false,
    remotionSampleStep: sampleStep, remotionSamples: requested.length,
    cadence: sampleStep === 12 ? 'Original 400 ms prediction holds; sampled every 12 frames and repeated at 30 fps' : 'Every source frame rendered'});
  await writeFile(path.join(out, name + '-render.json'), JSON.stringify(reports.at(-1), null, 2) + '\n');
  console.log(`${id}: complete ${output}`);
}
const sha = async p => createHash('sha256').update(await readFile(path.join(here, p))).digest('hex');
await writeFile(path.join(out, 'render-receipt.json'), JSON.stringify({
  createdAt: new Date().toISOString(), renderer: 'Remotion', trim: {frames: 240, fps: 30, seconds: 8, firstSourceFrame: 240, lastSourceFrame: 635},
  grid: {preservedFrames: 2716, replacementTile: 4, x: 420, y: 242, width: 408, height: 230, loopFrames: 396},
  inputs: {clip: await sha('public/original-simulation-5.mp4'), grid: await sha('public/original-simulation-grid.mp4')},
  sourceSha256: await sha('remotion/index.jsx'), reports
}, null, 2) + '\n');
