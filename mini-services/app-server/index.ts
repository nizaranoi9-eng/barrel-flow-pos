import { createServer } from 'http'
import { spawn } from 'child_process'

import path from 'path'

const projectRoot = path.resolve(__dirname, '../..')

// Start Next.js server
const nextProcess = spawn('npx', ['next', 'dev', '-p', '3000'], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: { ...process.env }
})

nextProcess.on('error', (err) => {
  console.error('Failed to start Next.js:', err)
  process.exit(1)
})

nextProcess.on('exit', (code) => {
  console.log('Next.js exited with code:', code)
  process.exit(code || 0)
})
