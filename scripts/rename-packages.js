#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

function replaceInFile(filePath, searchRegex, replacement) {
  const content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.replace(searchRegex, replacement);
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (
      file.isDirectory() &&
      !['node_modules', '.git', 'dist'].includes(file.name)
    ) {
      processDirectory(fullPath);
    } else if (
      file.isFile() &&
      (file.name.endsWith('.ts') ||
        file.name.endsWith('.js') ||
        file.name === 'package.json')
    ) {
      replaceInFile(fullPath, /@responsible-vibe\//g, '@codemcp/workflows');
    }
  }
}

console.log('Renaming @codemcp/workflows to @codemcp/workflows...');
processDirectory('.');
console.log('Done!');
