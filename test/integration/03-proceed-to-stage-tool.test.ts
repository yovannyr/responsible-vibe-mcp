/**
 * proceed_to_phase Tool Integration Tests
 * 
 * Tests explicit phase transition tool via MCP protocol
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { join } from 'path';
import { existsSync, rmSync } from 'fs';
import { homedir } from 'os';

describe('proceed_to_phase Tool Integration Tests', () => {
  let client: Client;
  let transport: StdioClientTransport;
  const testDbDir = join(homedir(), '.vibe-feature-mcp-test-03');

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

  describe('Scenario: Valid phase transition from requirements to design', () => {
    it('should transition from requirements to design', async () => {
      // Given: an existing conversation in "requirements" phase
      await startServer();
      
      // Create initial conversation in requirements phase (by providing feature request)
      const initialResult = await client.callTool({
        name: 'whats_next',
        arguments: {
          user_input: 'implement authentication feature'
        }
      });
      
      const initialResponse = JSON.parse(initialResult.content[0].text!);
      expect(initialResponse.phase).toBe('requirements');

      // When: I call proceed_to_phase with target_phase "design"
      const result = await client.callTool({
        name: 'proceed_to_phase',
        arguments: {
          target_phase: 'design',
          reason: 'requirements gathering complete'
        }
      });

      // Then: the conversation phase should be updated to "design"
      expect(result.content).toBeDefined();
      const response = JSON.parse(result.content[0].text!);
      expect(response.phase).toBe('design');
      
      // And: design-specific instructions should be returned
      expect(response.instructions).toBeDefined();
      expect(response.instructions.toLowerCase()).toMatch(/design|architecture|technical/);
      
      // And: the database should be updated with the new phase
      const stateResource = await client.readResource({
        uri: 'state://current'
      });
      const stateData = JSON.parse(stateResource.contents[0].text!);
      expect(stateData.currentPhase).toBe('design');
      
      // And: the transition reason should be recorded
      expect(response.transition_reason).toBe('requirements gathering complete');
    });
  });

  describe('Scenario: Direct phase transition skipping intermediate phases', () => {
    it('should allow direct transition to implementation', async () => {
      // Given: an existing conversation in "requirements" phase
      await startServer();
      
      // Create initial conversation (will be in requirements due to feature request)
      const initialResult = await client.callTool({
        name: 'whats_next',
        arguments: {
          user_input: 'implement authentication'
        }
      });
      
      const initialResponse = JSON.parse(initialResult.content[0].text!);
      expect(initialResponse.phase).toBe('requirements');

      // When: I call proceed_to_phase with target_phase "implementation" (skipping design)
      const result = await client.callTool({
        name: 'proceed_to_phase',
        arguments: {
          target_phase: 'implementation',
          reason: 'requirements and design already done offline'
        }
      });

      // Then: the phase should transition directly to "implementation"
      const response = JSON.parse(result.content[0].text!);
      expect(response.phase).toBe('implementation');
      
      // And: implementation-specific instructions should be provided
      expect(response.instructions).toBeDefined();
      expect(response.instructions.toLowerCase()).toMatch(/implement|code|build/);
      
      // And: the transition reason should be recorded
      expect(response.transition_reason).toBe('requirements and design already done offline');
    });
  });

  describe('Scenario: Transition to completion phase', () => {
    it('should transition to complete phase', async () => {
  // Given: an existing conversation in "testing" phase
      await startServer();
      
      // Create conversation and move to testing phase
      await client.callTool({
        name: 'whats_next',
        arguments: {
          user_input: 'implement authentication feature'
        }
      });
      
      await client.callTool({
        name: 'proceed_to_phase',
        arguments: {
          target_phase: 'testing'
        }
      });

      // When: I call proceed_to_phase with target_phase "complete"
      const result = await client.callTool({
        name: 'proceed_to_phase',
        arguments: {
          target_phase: 'complete',
          reason: 'all testing completed successfully'
        }
      });

      // Then: the conversation should be marked as complete
      const response = JSON.parse(result.content[0].text!);
      expect(response.phase).toBe('complete');
      
      // And: completion instructions should be provided
      expect(response.instructions).toBeDefined();
      expect(response.instructions.toLowerCase()).toMatch(/complete|finish|done/);
      
      // And: the conversation state should reflect project completion
      const stateResource = await client.readResource({
        uri: 'state://current'
      });
      const stateData = JSON.parse(stateResource.contents[0].text!);
      expect(stateData.currentPhase).toBe('complete');
    });
  });

  describe('Scenario: Invalid phase transition parameters', () => {
    it('should reject invalid phase names', async () => {
      // Given: the MCP server is running
      await startServer();

      // When: I call proceed_to_phase with an invalid target_phase
      try {
        await client.callTool({
          name: 'proceed_to_phase',
          arguments: {
            target_phase: 'invalid_phase'
          }
        });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Then: the tool should return an error response
        expect(error).toBeDefined();
        // The error should indicate invalid phase
        expect(error.message || error.toString()).toMatch(/invalid|error/i);
      }
    });

    it('should handle missing target_phase parameter', async () => {
      // Given: the MCP server is running
      await startServer();

      // When: I call proceed_to_phase without target_phase
      try {
        await client.callTool({
          name: 'proceed_to_phase',
          arguments: {
            reason: 'test reason'
          }
        });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Then: the tool should return an error response
        expect(error).toBeDefined();
        // The error should indicate missing required parameter
        expect(error.message || error.toString()).toMatch(/required|missing|target_phase/i);
      }
    });
  });

  describe('Scenario: Transition with detailed reason', () => {
    it('should record transition with provided reason', async () => {
      // Given: an existing conversation in "design" phase
      await startServer();
      
      // Create conversation and move to design phase
      await client.callTool({
        name: 'whats_next',
        arguments: {
          user_input: 'implement authentication feature'
        }
      });
      
      await client.callTool({
        name: 'proceed_to_phase',
        arguments: {
          target_phase: 'design'
        }
      });

      // When: I call proceed_to_phase with detailed reason
      const detailedReason = 'design approved by user, ready to code';
      const result = await client.callTool({
        name: 'proceed_to_phase',
        arguments: {
          target_phase: 'implementation',
          reason: detailedReason
        }
      });

      // Then: the transition should be recorded with the provided reason
      const response = JSON.parse(result.content[0].text!);
      expect(response.transition_reason).toBe(detailedReason);
      
      // And: the reason should be included in the response
      expect(response.transition_reason).toContain('approved');
      expect(response.transition_reason).toContain('ready to code');
    });
  });

  describe('Scenario: Transition without existing conversation', () => {
    it('should create new conversation with target phase', async () => {
      // Given: no existing conversation state for the current project
      await startServer();

      // When: I call proceed_to_phase with target_phase "design"
      const result = await client.callTool({
        name: 'proceed_to_phase',
        arguments: {
          target_phase: 'design',
          reason: 'starting directly with design'
        }
      });

      // Then: a new conversation should be created
      const response = JSON.parse(result.content[0].text!);
      expect(response.phase).toBe('design');
      
      // And: the phase should be set to the requested target phase
      expect(response.instructions).toBeDefined();
      expect(response.instructions.toLowerCase()).toMatch(/design|architecture/);
      
      // And: appropriate instructions should be generated for the target phase
      const stateResource = await client.readResource({
        uri: 'state://current'
      });
      const stateData = JSON.parse(stateResource.contents[0].text!);
      expect(stateData.currentPhase).toBe('design');
    });
  });

  describe('Scenario: Multiple rapid phase transitions', () => {
    it('should handle sequential transitions correctly', async () => {
      // Given: an existing conversation
      await startServer();
      
      await client.callTool({
        name: 'whats_next',
        arguments: {
          user_input: 'implement authentication feature'
        }
      });

      // When: transitions are requested in sequence
      const transition1 = await client.callTool({
        name: 'proceed_to_phase',
        arguments: {
          target_phase: 'design',
          reason: 'move to design'
        }
      });

      const transition2 = await client.callTool({
        name: 'proceed_to_phase',
        arguments: {
          target_phase: 'implementation',
          reason: 'move to implementation'
        }
      });

      const transition3 = await client.callTool({
        name: 'proceed_to_phase',
        arguments: {
          target_phase: 'qa',
          reason: 'move to qa'
        }
      });

      // Then: each transition should be processed correctly
      const response1 = JSON.parse(transition1.content[0].text!);
      expect(response1.phase).toBe('design');

      const response2 = JSON.parse(transition2.content[0].text!);
      expect(response2.phase).toBe('implementation');

      const response3 = JSON.parse(transition3.content[0].text!);
      expect(response3.phase).toBe('qa');
      
      // And: the final state should reflect the last successful transition
      const stateResource = await client.readResource({
        uri: 'state://current'
      });
      const stateData = JSON.parse(stateResource.contents[0].text!);
      expect(stateData.currentPhase).toBe('qa');
    });
  });
});
