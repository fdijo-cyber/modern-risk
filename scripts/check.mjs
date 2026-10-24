import {readdirSync,statSync,readFileSync} from 'node:fs';import {join} from 'node:path';import {spawnSync} from 'node:child_process';
function walk(dir){return readdirSync(dir).flatMap(f=>{const p=join(dir,f);return statSync(p).isDirectory()?walk(p):[p];});}
for(const f of ['apps','packages','tests','scripts'].flatMap(walk).filter(f=>/\.(mjs|js)$/.test(f))){const r=spawnSync(process.execPath,['--check',f],{stdio:'inherit'});if(r.status)process.exit(r.status);}
for(const path of ['apps/web/public/index.html','apps/web/public/style.css','database/migrations/001_postgres.sql','docs/master-specification.md'])if(!readFileSync(path).length)throw new Error('Empty '+path);
console.log('JavaScript syntax and required artifact checks passed. Buildless application: no compilation required.');
