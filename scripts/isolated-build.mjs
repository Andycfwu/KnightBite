import { mkdtemp, mkdir, cp, readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
const root=process.cwd();
const destination=await mkdtemp(join(tmpdir(),'knightbite-release-'));
const files=['app','components','hooks','lib','public','tests','scripts','package.json','package-lock.json','next.config.ts','middleware.ts','tsconfig.json','tsconfig.test.json','next-env.d.ts','tailwind.config.ts','postcss.config.js','eslint.config.mjs','playwright.config.ts','playwright.unavailable.config.ts','playwright.preview.config.ts','.nvmrc'];
for(const name of files) {
  try { await cp(join(root,name),join(destination,name),{recursive:true}); }
  catch(error) { if(error.code!=='ENOENT')throw error; }
}
const sourceFiles = {};
async function recordFiles(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) await recordFiles(join(directory, entry.name), name);
    else if (entry.isFile()) sourceFiles[name] = createHash('sha256').update(await readFile(join(directory, entry.name))).digest('hex');
  }
}
await recordFiles(destination);
const sourceDigest = createHash('sha256').update(JSON.stringify(Object.entries(sourceFiles).sort())).digest('hex');
await mkdir(join(root,'test-results'),{recursive:true});
await writeFile(join(root,'test-results/isolated-build.json'),JSON.stringify({directory:destination,node:process.version,startedAt:new Date().toISOString()},null,2));
// Exercise normal production analytics, or the explicitly requested Preview
// suppression. Browser tests intercept transport; the build blocks providers.
const baseEnv={...process.env,NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_ANALYTICS_DISABLED:'',KNIGHTBITE_FIXTURE_ROOT:destination};
async function run(command,args,env=baseEnv) {
  const exit=await new Promise((done,reject)=>{const child=spawn(command,args,{cwd:destination,env,stdio:'inherit'});child.on('error',reject);child.on('exit',done);});
  if(exit!==0)throw new Error(`${command} ${args.join(' ')} exited ${exit}`);
}
console.log(`Isolated source: ${destination}`);
await run('npm',['ci','--no-audit','--no-fund']);
await run('npm',['run','build'],{
  ...baseEnv,NODE_OPTIONS:`--require=${join(destination,'tests/support/synthetic-network.cjs')}`
});
await run('npm',['run','typecheck']);
const buildId=(await readFile(join(destination,'.next/BUILD_ID'),'utf8')).trim();
await writeFile(resolve('test-results/isolated-build.json'),JSON.stringify({directory:destination,node:process.version,buildId,analyticsEnabled:baseEnv.VERCEL_ENV!=='preview',deploymentEnvironment:baseEnv.VERCEL_ENV??null,sourceDigest,sourceFiles,completedAt:new Date().toISOString()},null,2));
console.log(`Isolated production build passed: ${buildId}`);
