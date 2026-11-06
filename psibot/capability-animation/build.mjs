import {build} from 'esbuild';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
await build({entryPoints: [path.join(root, 'player.jsx')], bundle: true, minify: true,
  outfile: path.join(root, '../hero.js'), define: {'process.env.NODE_ENV': '"production"'}});
console.log('Integrated Remotion capability film built');
