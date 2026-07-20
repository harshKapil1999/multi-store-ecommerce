import { spawn, execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';

const preferredPorts = [3000, 3002, 3003, 3004];
const devLockPath = path.join(process.cwd(), '.next', 'dev', 'lock');

const isPortBusy = (port) => {
  try {
    execFileSync('lsof', ['-ti', `tcp:${port}`], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return true;
  } catch {
    return false;
  }
};

const getAvailablePort = async () => {
  for (const port of preferredPorts) {
    if (!isPortBusy(port)) {
      return port;
    }
  }

  throw new Error(`No available port found in ${preferredPorts.join(', ')}`);
};

if (existsSync(devLockPath)) {
  if (isPortBusy(3000)) {
    console.log('Frontend dev server already appears to be running for this app. Reusing the existing instance.');
    process.exit(0);
  }

  console.log('Removing stale frontend dev lock; no server is listening on port 3000.');
  rmSync(devLockPath, { force: true });
}

const port = await getAvailablePort();

if (port !== 3000) {
  console.log(`Port 3000 is busy. Starting frontend on port ${port} instead.`);
}

const child = spawn('pnpm', ['exec', 'next', 'dev', '-p', String(port)], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: String(port),
  },
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
