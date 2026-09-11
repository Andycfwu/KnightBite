import { spawn } from 'node:child_process';
const env = { ...process.env, VERCEL_ENV: 'preview' };
for (const args of [['run', 'build:isolated'], ['exec', '--', 'playwright', 'test', '--config', 'playwright.preview.config.ts']]) {
  const code = await new Promise((resolve, reject) => {
    const child = spawn('npm', args, { env, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', resolve);
  });
  if (code !== 0) process.exit(code ?? 1);
}
