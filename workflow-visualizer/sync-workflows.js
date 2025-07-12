#!/usr/bin/env node

/**
 * Sync workflow files from the main resources directory
 * This ensures the visualizer has the latest workflow definitions
 */

import { copyFile, readdir, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceDir = join(__dirname, '..', 'resources', 'workflows');
const targetDir = join(__dirname, 'workflows');

async function syncWorkflows() {
  try {
    console.log('🔄 Syncing workflow files...');
    console.log(`Source: ${sourceDir}`);
    console.log(`Target: ${targetDir}`);

    // Ensure target directory exists
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }

    // Read source directory
    const files = await readdir(sourceDir);
    const yamlFiles = files.filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));

    console.log(`Found ${yamlFiles.length} workflow files:`);

    // Copy each YAML file
    for (const file of yamlFiles) {
      const sourcePath = join(sourceDir, file);
      const targetPath = join(targetDir, file);
      
      await copyFile(sourcePath, targetPath);
      console.log(`  ✅ ${file}`);
    }

    console.log('🎉 Workflow sync complete!');
  } catch (error) {
    console.error('❌ Error syncing workflows:', error.message);
    process.exit(1);
  }
}

syncWorkflows();
