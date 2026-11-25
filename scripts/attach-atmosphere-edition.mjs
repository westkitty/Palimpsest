import {copyFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const at=p=>fileURLToPath(new URL('../'+p,import.meta.url));
// Keep the Vite renderer available for rollback and comparison; the current,
// approved review becomes the existing folio route. Index and archive stay Vite.
copyFileSync(at('dist/folio-vnext.html'),at('dist/folio-vnext-classic.html'));
const base=at('production/atmosphere/baseline/encore.html.gz');
execFileSync(process.execPath,[at('production/atmosphere/build.mjs'),at('dist/folio-vnext.html'),base,'pages'],{stdio:'inherit'});
