#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  execSync('tsc', { stdio: 'inherit' });
} catch (_) {
  // tsc exits non-zero on type errors but still emits JS
}

const srcAssets = path.join(__dirname, '..', 'src', 'assets');
const distAssets = path.join(__dirname, '..', 'dist', 'assets');

if (fs.existsSync(srcAssets)) {
  if (!fs.existsSync(distAssets)) {
    fs.mkdirSync(distAssets, { recursive: true });
  }
  for (const file of fs.readdirSync(srcAssets)) {
    fs.copyFileSync(path.join(srcAssets, file), path.join(distAssets, file));
  }
  console.log('Assets copied to dist/');
}
