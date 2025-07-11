#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const visualizerDir = join(__dirname, '..');

console.log('🚀 Starting Workflow Visualizer...');
console.log('📁 Directory:', visualizerDir);

// Check if we're in development (has package.json) or published (pre-built)
const hasPackageJson = existsSync(join(visualizerDir, 'package.json'));
const hasBuiltFiles = existsSync(join(visualizerDir, 'dist', 'index.html'));

if (hasBuiltFiles) {
  // We're in a published package - serve the pre-built files
  console.log('📦 Using pre-built visualizer files...');
  startStaticServer();
} else if (hasPackageJson) {
  // We're in development - build and serve
  console.log('🔧 Development mode - building and serving...');
  
  // Check if dependencies are installed
  if (!existsSync(join(visualizerDir, 'node_modules'))) {
    console.log('📦 Installing dependencies...');
    const install = spawn('npm', ['install'], { 
      cwd: visualizerDir, 
      stdio: 'inherit' 
    });
    
    install.on('close', (code) => {
      if (code === 0) {
        startDevServer();
      } else {
        console.error('❌ Failed to install dependencies');
        process.exit(1);
      }
    });
  } else {
    startDevServer();
  }
} else {
  console.error('❌ Neither built files nor source files found');
  process.exit(1);
}

function startDevServer() {
  console.log('🌐 Starting development server...');
  const server = spawn('npm', ['run', 'dev'], { 
    cwd: visualizerDir, 
    stdio: 'inherit' 
  });
  
  server.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
  });
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down visualizer...');
    server.kill('SIGINT');
    process.exit(0);
  });
}

function startStaticServer() {
  console.log('🌐 Starting static file server...');
  
  // Use a simple static server
  const { createServer } = await import('http');
  const { readFile } = await import('fs/promises');
  const { extname } = await import('path');
  
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };
  
  const server = createServer(async (req, res) => {
    try {
      let filePath = join(visualizerDir, 'dist', req.url === '/' ? 'index.html' : req.url);
      
      // Security check - ensure we're serving from dist directory
      if (!filePath.startsWith(join(visualizerDir, 'dist'))) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      
      const content = await readFile(filePath);
      const ext = extname(filePath);
      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    }
  });
  
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`✅ Workflow Visualizer running at http://localhost:${port}`);
    console.log('Press Ctrl+C to stop');
  });
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down visualizer...');
    server.close();
    process.exit(0);
  });
}
