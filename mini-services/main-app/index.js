const { spawn } = require('child_process');
const path = require('path');

const nextPath = path.join(__dirname, '../../node_modules/.bin/next');
const child = spawn(nextPath, ['dev', '-p', '3000'], {
  cwd: path.join(__dirname, '../..'),
  stdio: 'inherit',
  shell: true
});

child.on('error', (err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log('Process exited with code:', code);
  process.exit(code || 0);
});
