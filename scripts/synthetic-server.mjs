import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
const {directory,buildId}=JSON.parse(await readFile('test-results/isolated-build.json','utf8'));
if (!buildId) throw new Error('Run npm run build:isolated successfully before browser tests.');
if ((await readFile(join(directory,'.next/BUILD_ID'),'utf8')).trim() !== buildId) throw new Error('Isolated build identity changed; rebuild before testing.');
const child=spawn(process.execPath,[join(directory,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','3217'],{
  cwd:directory,stdio:'inherit',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_ANALYTICS_DISABLED:'',KNIGHTBITE_SYNTHETIC_MENUS:'1',KNIGHTBITE_FIXTURE_ROOT:directory,NODE_OPTIONS:`--require=${join(directory,'tests/support/synthetic-network.cjs')}`}
});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code??0));
