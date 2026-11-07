import {build} from 'esbuild';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
await build({entryPoints: [path.join(here, 'player.jsx')], bundle: true, minify: true,
  outfile: path.join(here, '../hero.js'), define: {'process.env.NODE_ENV': '"production"'}});
console.log('Theme-aware responsive hero built');
