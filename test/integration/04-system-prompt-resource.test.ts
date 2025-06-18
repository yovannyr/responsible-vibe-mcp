/**
 * System Prompt Resource Integration Tests
 * 
 * Tests the system prompt resource functionality to ensure it generates
 * and serves the system prompt correctly via MCP.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { join } from 'path';

describe('System Prompt Resource Integration Tests', () => {
  let client: Client;
  let transport: StdioClientTransport;

  async function startServer() {
      // Start the actual MCP server as a subprocess using tsx to run TypeScript directly
      const serverPath = join(process.cwd(), 'src', 'index.ts');
      
      transport = new StdioClientTransport({
        command: 'npx',
        args: ['tsx', serverPath],
      });
  
      client = new Client({
        name: 'test-client',
        version: '1.0.0'
      }, {
        capabilities: {}
      });
  
      await client.connect(transport);
    }

  async function stopServer() {
    if (client) {
      await client.close();
    }
  }

  beforeEach(async () => {
    // Each test gets a fresh server instance
  });

  afterEach(async () => {
    await stopServer();
  });

  describe('Scenario: System prompt resource availability', () => {
    it('should list system prompt resource', async () => {
      // Given: a running vibe-feature-mcp server
      await startServer();

      // When: I list available resources
      const resources = await client.listResources();

      // Then: the system prompt resource should be available
      expect(resources.resources).toBeDefined();
      
      const systemPromptResource = resources.resources.find(r => r.uri === 'prompt://system');
      expect(systemPromptResource).toBeDefined();
      expect(systemPromptResource?.uri).toBe('prompt://system');
      expect(systemPromptResource?.name).toBe('LLM System Prompt');
      expect(systemPromptResource?.description).toContain('Dynamically generated system prompt');
      expect(systemPromptResource?.mimeType).toBe('text/markdown');
    });

    it('should generate and serve system prompt content', async () => {
      // Given: a running vibe-feature-mcp server
      await startServer();

      // When: I read the system prompt resource
      const result = await client.readResource({
        uri: 'prompt://system'
      });

      // Then: the system prompt should be generated and returned
      expect(result.contents).toBeDefined();
      expect(result.contents).toHaveLength(1);
      
      const content = result.contents[0];
      expect(content.uri).toBe('prompt://system');
      expect(content.mimeType).toBe('text/markdown');
      expect(content.text).toBeDefined();
      
      // And: the content should be a comprehensive system prompt
      const promptText = content.text!;
      expect(promptText).toContain('LLM System Prompt for Vibe Feature MCP Integration');
      expect(promptText).toContain('whats_next()');
      expect(promptText).toContain('proceed_to_phase');
      expect(promptText).toContain('Development Phases');
      expect(promptText).toContain('Phase Transitions');
      
      // And: it should include all development phases
      expect(promptText).toContain('idle');
      expect(promptText).toContain('requirements');
      expect(promptText).toContain('design');
      expect(promptText).toContain('implementation');
      expect(promptText).toContain('qa');
      expect(promptText).toContain('testing');
      expect(promptText).toContain('complete');
      
      // And: it should be substantial content
      expect(promptText.length).toBeGreaterThan(10000);
    });

    it('should include phase-specific instructions from state machine', async () => {
      // Given: a running vibe-feature-mcp server
      await startServer();

      // When: I read the system prompt resource
      const result = await client.readResource({
        uri: 'prompt://system'
      });

      // Then: the prompt should include phase-specific instructions
      const promptText = result.contents[0].text!;
      
      // And: it should include direct transition instructions
      expect(promptText).toContain('Direct transition');
      expect(promptText).toContain('Continue in phase');
      
      // And: it should include specific phase guidance
      expect(promptText).toContain('Starting requirements analysis');
      expect(promptText).toContain('Starting design phase');
      expect(promptText).toContain('Starting implementation phase');
      expect(promptText).toContain('Starting quality assurance phase');
      expect(promptText).toContain('Starting testing phase');
      
      // And: it should include transition examples
      expect(promptText).toContain('proceed_to_phase({');
      expect(promptText).toContain('target_phase:');
      expect(promptText).toContain('reason:');
    });

    it('should include information about proceed_to_phase tool', async () => {
      // Given: a running vibe-feature-mcp server
      await startServer();

      // When: I read the system prompt resource
      const result = await client.readResource({
        uri: 'prompt://system'
      });

      // Then: the prompt should include comprehensive proceed_to_phase information
      const promptText = result.contents[0].text!;
      
      // And: it should explain when to use proceed_to_phase
      expect(promptText).toContain('When to Use proceed_to_phase');
      expect(promptText).toContain('Phase completion');
      expect(promptText).toContain('Issue resolution');
      expect(promptText).toContain('Direct transitions');
      expect(promptText).toContain('User requests');
      
      // And: it should include usage examples
      expect(promptText).toContain('Moving forward when ready');
      expect(promptText).toContain('Going back to fix issues');
      expect(promptText).toContain('Skipping phases when appropriate');
      
      // And: it should list available phases
      expect(promptText).toContain('Available phases:');
      expect(promptText).toContain('"idle", "requirements", "design", "implementation", "qa", "testing", "complete"');
    });

    it('should be automatically generated from state machine', async () => {
      // Given: a running vibe-feature-mcp server
      await startServer();

      // When: I read the system prompt resource
      const result = await client.readResource({
        uri: 'prompt://system'
      });

      // Then: the prompt should indicate it was automatically generated
      const promptText = result.contents[0].text!;
      expect(promptText).toContain('automatically generated from the vibe-feature-mcp state machine definition');
      expect(promptText).toContain('ensure accuracy and consistency');
    });
  });
});
