import { spawn } from 'node:child_process';

export async function startPreview(port = 4322) {
  const server = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--ignore-lock', '--host', '127.0.0.1', '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  server.stdout.on('data', (data) => { output += data; });
  server.stderr.on('data', (data) => { output += data; });
  const url = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 300; attempt++) {
    if (server.exitCode !== null) throw new Error(`Preview exited: ${output}`);
    if (await fetch(url).then((response) => response.ok).catch(() => false)) {
      return { url, stop: () => server.kill('SIGTERM') };
    }
    await new Promise((done) => setTimeout(done, 200));
  }
  server.kill('SIGTERM');
  throw new Error(`Preview timed out: ${output}`);
}
