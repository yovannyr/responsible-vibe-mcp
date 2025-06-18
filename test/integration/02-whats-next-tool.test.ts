/**
 * whats_next Tool Integration Tests
 * 
 * Tests the primary analysis and instruction tool via MCP protocol
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { join } from 'path';
import { existsSync, rmSync } from 'fs';
import { homedir } from 'os';

describe('whats_next Tool Integration Tests', () => {
  let client: Client;
  let transport: StdioClientTransport;
  const testDbDir = join(homedir(), '.vibe-feature-mcp-test-02');

  beforeEach(async () => {
    // Clean up any existing test database
    if (existsSync(testDbDir)) {
      rmSync(testDbDir, { recursive: true, force: true });
    }
  });

  afterEach(async () => {
    // Clean up client and server
    if (client) {
      await client.close();
    }
    // Clean up test database
    if (existsSync(testDbDir)) {
      rmSync(testDbDir, { recursive: true, force: true });
    }
  });

  async function startServer() {
    const serverPath = join(process.cwd(), 'src', 'index.ts');
    
    transport = new StdioClientTransport({
      command: 'npx',
      args: ['tsx', serverPath],
      env: {
        ...process.env,
        VIBE_FEATURE_DB_DIR: testDbDir
      }
    });

    client = new Client({
      name: 'test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    await client.connect(transport);
  }

  describe('Scenario: First call to whats_next creates new conversation', () => {
    it('should create new conversation for first whats_next call', async () => {
      // Given: no existing conversation state for the current project
      await startServer();
      expect(existsSync(testDbDir)).toBe(true);

      // When: I call whats_next with user input about implementing a new feature
      const result = await client.callTool({
        name: 'whats_next',
        arguments: {
          user_input: 'implement user authentication',
          context: 'user wants to add auth to their app'
        }
      });

      // Then: a new conversation should be created
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      
      const response = JSON.parse(result.content[0].text!);
      
      // And: the phase should transition to "requirements" (detected feature request)
      expect(response.phase).toBe('requirements');
      
      // And: instructions should guide requirements gathering
      expect(response.instructions).toContain('requirements');
      expect(response.instructions.toLowerCase()).toMatch(/what|analyze|clarify/);
      
      // And: a plan file path should be provided
      expect(response.plan_file_path).toBeDefined();
      expect(response.plan_file_path).toMatch(/\.md$/);
      
      // And: the transition reason should indicate feature request detection
      expect(response.transition_reason.toLowerCase()).toMatch(/new|feature|requirements/);
    });
  });

  describe('Scenario: Continuing existing conversation in idle phase', () => {
    it('should continue in idle or transition when appropriate', async () => {
      // Given: an existing conversation in "idle" phase
      await startServer();
      
      // Create initial conversation
      const initialResult = await client.callTool({
        name: 'whats_next',
        arguments: {
          user_input: 'implement user authentication'
        }
      });
      
      const initialResponse = JSON.parse(initialResult.content[0].text!);
      expect(initialResponse.phase).toBe('requirements');

      // When: I call whats_next with conversation context indicating ongoing work
      const result = await client.callTool({
        name: 'whats_next',
        arguments: {
          conversation_summary: 'User wants authentication, discussed tech stack',
          user_input: 'what about password requirements?',
          context: 'continuing development discussion'
        }
      });

      // Then: the phase should remain "requirements" or transition appropriately
      const response = JSON.parse(result.content[0].text!);
      expect(['requirements', 'design', 'implementation']).toContain(response.phase);
      
      // And: instructions should be contextually appropriate
      expect(response.instructions).toBeDefined();
      expect(response.instructions.length).toBeGreaterThan(0);
    });

    it('should suggest appropriate transition when context indicates readiness', async () => {
      // Given: an existing conversation with comprehensive context
      await startServer();
      
      // When: I provide conversation_summary and recent_messages indicating phase completion
      const result = await client.callTool({
        name: 'whats_next',
        arguments: {
          conversation_summary: 'Completed authentication system design. User approved the architecture with JWT tokens, bcrypt hashing, and RESTful API endpoints.',
          recent_messages: [
            { role: 'user', content: 'The design looks perfect, let\'s implement it' },
            { role: 'assistant', content: 'Great! I\'ll help you implement the authentication system step by step.' }
          ],
          user_input: 'ready to start coding',
          context: 'design phase complete, ready for implementation'
        }
      });

      // Then: the transition engine should analyze the context
      expect(result.content).toBeDefined();
      const response = JSON.parse(result.content[0].text!);
      
      // And: determine appropriate phase transitions (could be any phase based on context)
      expect(response.phase).toBeDefined();
      expect(['idle', 'requirements', 'design', 'implementation']).toContain(response.phase);
      
      // And: provide contextually relevant instructions
      expect(response.instructions).toBeDefined();
      if (response.phase === 'implementation') {
        expect(response.instructions.toLowerCase()).toMatch(/implement|code|build/);
      } else if (response.phase === 'design') {
        expect(response.instructions.toLowerCase()).toMatch(/design|proceed|complete/);
      } else if (response.phase === 'requirements') {
        expect(response.instructions.toLowerCase()).toMatch(/requirements|analyze|clarify/);
      } else if (response.phase === 'idle') {
        expect(response.instructions.toLowerCase()).toMatch(/start|begin|initial/);
      }
    });
  });

  describe('Scenario: Handling malformed or missing parameters', () => {
    it('should handle missing project context gracefully', async () => {
      // Given: the MCP server is running
      await startServer();

      // When: I call whats_next with minimal parameters
      const result = await client.callTool({
        name: 'whats_next',
        arguments: {}
      });

      // Then: the tool should handle the request gracefully
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      
      const response = JSON.parse(result.content[0].text!);
      
      // And: return meaningful response
      expect(response.phase).toBeDefined();
      expect(response.instructions).toBeDefined();
      expect(response.plan_file_path).toBeDefined();
      expect(response.transition_reason).toBeDefined();
    });

    it('should work with minimal parameters', async () => {
      // Given: the MCP server is running
      await startServer();

      // When: I call whats_next with just user input
      const result = await client.callTool({
        name: 'whats_next',
        arguments: {
          user_input: 'help me build a feature'
        }
      });

      // Then: the tool should work properly
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      
      const response = JSON.parse(result.content[0].text!);
      expect(response.phase).toBeDefined();
      expect(response.instructions).toBeDefined();
      expect(response.plan_file_path).toBeDefined();
    });
  });

  describe('Scenario: Context analysis drives phase transitions', () => {
    it('should analyze conversation context for phase transitions', async () => {
      // Given: an existing conversation with rich context
      await startServer();

      // When: I provide conversation_summary and recent_messages indicating phase completion
      const result = await client.callTool({
        name: 'whats_next',
        arguments: {
          conversation_summary: 'Completed authentication system design. User approved the architecture with JWT tokens, bcrypt hashing, and RESTful API endpoints.',
          recent_messages: [
            { role: 'user', content: 'The design looks perfect, let\'s implement it' },
            { role: 'assistant', content: 'Great! I\'ll help you implement the authentication system step by step.' }
          ],
          user_input: 'ready to start coding',
          context: 'design phase complete, ready for implementation'
        }
      });

      // Then: the transition engine should analyze the context
      expect(result.content).toBeDefined();
      const response = JSON.parse(result.content[0].text!);
      
      // And: determine appropriate phase transitions
      expect(response.phase).toBeDefined();
      expect(['requirements', 'design', 'implementation']).toContain(response.phase);
      
      // And: provide contextually relevant instructions
      expect(response.instructions).toBeDefined();
      if (response.phase === 'implementation') {
        expect(response.instructions.toLowerCase()).toMatch(/implement|code|build/);
      } else if (response.phase === 'design') {
        expect(response.instructions.toLowerCase()).toMatch(/design|proceed|complete/);
      } else if (response.phase === 'requirements') {
        expect(response.instructions.toLowerCase()).toMatch(/requirements|analyze|clarify/);
      }
    });

    it('should handle conversations with different project contexts', async () => {
      // Given: a server running
      await startServer();

      // When: I call whats_next with specific project context
      const result = await client.callTool({
        name: 'whats_next',
        arguments: {
          user_input: 'working on user profile feature',
          context: 'feature branch development'
        }
      });

      // Then: the conversation should be handled appropriately
      const response = JSON.parse(result.content[0].text!);
      expect(response.phase).toBeDefined();
      expect(response.instructions).toBeDefined();
      expect(response.plan_file_path).toBeDefined();
      
      // And: plan file path should be contextually appropriate
      expect(response.plan_file_path).toMatch(/\.md$/);
    });
  });
});
