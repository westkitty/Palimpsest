import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dist=path.resolve(process.argv[2]||'dist');
const htmlFile=path.join(dist,'folio-vnext.html');
let html=await readFile(htmlFile,'utf8');
const moduleScript=/<script type="module" crossorigin src="([^"]+)"><\/script>/;
const m=html.match(moduleScript);
if(!m)throw new Error('Built folio-vnext entry not found; run npm run build first.');
const out=await build({entryPoints:[path.resolve(dist,m[1])],format:'iife',bundle:true,minify:true,write:false,target:'es2022',legalComments:'inline'});
const script=out.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
html=html.replace(moduleScript,'').replace(/^.*<link rel="modulepreload"[^>]*>.*$/gm,'');
html=html.replace('href="./archive.html"','href="https://westkitty.github.io/Palimpsest/archive.html"');
html=html.replace('</body>',()=>'<script>'+script+'</script>\n</body>');
await writeFile(path.join(dist,'Palimpsest_Living_Book.html'),html);
