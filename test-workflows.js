#!/usr/bin/env node

// Simple test to verify workflows are loaded correctly
import { getBundledWorkflow, getBundledWorkflowNames } from './workflow-visualizer/src/services/BundledWorkflows.js';

console.log('🔍 Testing bundled workflows...');

const workflowNames = getBundledWorkflowNames();
console.log(`Found ${workflowNames.length} workflows:`, workflowNames);

// Test if bugfix3 is included
if (workflowNames.includes('bugfix3')) {
  console.log('✅ bugfix3 workflow found!');
  const bugfix3Content = getBundledWorkflow('bugfix3');
  if (bugfix3Content && bugfix3Content.includes('bugfix3')) {
    console.log('✅ bugfix3 content loaded correctly');
  } else {
    console.log('❌ bugfix3 content not loaded correctly');
  }
} else {
  console.log('❌ bugfix3 workflow NOT found');
}
