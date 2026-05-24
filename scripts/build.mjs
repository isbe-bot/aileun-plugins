import { spawnSync } from 'node:child_process';

const cmd = spawnSync('node', ['bin/pluginctl.js', '--help'], { stdio: 'pipe', encoding: 'utf8' });
if (cmd.status !== 0) {
  process.stderr.write(cmd.stderr || cmd.stdout);
  process.exit(cmd.status || 1);
}

console.log('build: ok (CLI entrypoint executable)');
