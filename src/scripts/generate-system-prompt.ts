#!/usr/bin/env node

/**
 * Generate System Prompt Script
 * 
 * This script generates the SYSTEM_PROMPT.md file from the actual state machine
 * definition to ensure it stays in sync with the codebase.
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { generateSystemPrompt } from '../system-prompt-generator.js';
import { createLogger } from '../logger.js';

const logger = createLogger('GenerateSystemPrompt');

async function main() {
  try {
    logger.info('Starting system prompt generation');
    
    // Generate the system prompt
    const systemPrompt = generateSystemPrompt();
    
    // Write to SYSTEM_PROMPT.md
    const outputPath = join(process.cwd(), 'SYSTEM_PROMPT.md');
    await writeFile(outputPath, systemPrompt, 'utf-8');
    
    logger.info('System prompt written to file', { outputPath });
    
    // Log the generated prompt to console
    console.log('\n' + '='.repeat(80));
    console.log('GENERATED SYSTEM PROMPT');
    console.log('='.repeat(80));
    console.log(systemPrompt);
    console.log('='.repeat(80));
    console.log(`\nSystem prompt saved to: ${outputPath}`);
    console.log(`Length: ${systemPrompt.length} characters`);
    
  } catch (error) {
    logger.error('Failed to generate system prompt', error as Error);
    console.error('Error generating system prompt:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
