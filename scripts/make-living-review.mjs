import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dist=path.resolve(process.argv[2]||'dist');
const htmlFile=path.join(dist,'folio-vnext.html');
let html=await readFile(htmlFile,'utf8');
const moduleScript=/<script type="module" crossorigin src="([^"]+)"><\/script>/;
const m=html.match(moduleScript);
if(!m)throw new Error('Built folio-vnext entry not found; run npm run build first.');
// Hosted Living folios load their own GLB chunks on demand. A genuine
// single-file preview must embed these emitted bytes instead of using file:// fetch.
const embedGltf={
  name:'embed-local-glb-url',
  setup(plugin){
    plugin.onLoad({filter:/\.js$/},async args=>{
      if(!args.path.startsWith(path.join(dist,'assets')+path.sep))return;
      const source=await readFile(args.path,'utf8');
      const urls=/new URL\(`([a-zA-Z0-9_.-]+\.glb(?:[-A-Za-z0-9_]*\.gz)?)`,import\.meta\.url\)\.href/g;
      let result=source;
      for(const match of source.matchAll(urls)){
        const data=await readFile(path.join(path.dirname(args.path),match[1]));
        const mime=match[1].endsWith('.gz')?'application/gzip':'model/gltf-binary';
        result=result.replace(match[0],JSON.stringify('data:'+mime+';base64,'+data.toString('base64')));
      }
      if(result!==source)return {contents:result,loader:'js'};
    });
  },
};
const out=await build({entryPoints:[path.resolve(dist,m[1])],format:'iife',plugins:[embedGltf],bundle:true,minify:true,write:false,target:'es2022',legalComments:'inline'});
const script=out.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
html=html.replace(moduleScript,'').replace(/^.*<link rel="modulepreload"[^>]*>.*$/gm,'');
html=html.replace('href="./archive.html"','href="https://westkitty.github.io/Palimpsest/archive.html"');
html=html.replace('</body>',()=>'<script>'+script+'</script>\n</body>');
await writeFile(path.join(dist,'Palimpsest_Living_Book.html'),html);
