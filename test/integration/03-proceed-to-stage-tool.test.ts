/**
 * proceed_to_stage Tool Integration Tests
 * 
 * Tests explicit stage transition tool via MCP protocol
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { join } from 'path';
import { existsSync, rmSync } from 'fs';
import { homedir } from 'os';

describe('proceed_to_stage Tool Integration Tests', () => {
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

  describe('Scenario: Valid stage transition from requirements to design', () => {
    it('should transition from requirements to design', async () => {
      // Given: an existing conversation in "requirements" stage
      await startServer();
      
      // Create initial conversation in requirements stage
      const initialResult = await client.callTool({
        name: 'whats_next',
        arguments: {
          user_input: 'implement authentication feature'
        }
      });
      
      const initialResponse = JSON.parse(initialResult.content[0].text!);
      expect(initialResponse.stage).toBe('requirements');

      // When: I call proceed_to_stage with target_stage "design"
      const result = await client.callTool({
        name: 'proceed_to_stage',
        arguments: {
          target_stage: 'design',
          reason: 'requirements gathering complete'
        }
      });

      // Then: the conversation stage should be updated to "design"
      expect(result.content).toBeDefined();
      const response = JSON.parse(result.content[0].text!);
      expect(response.stage).toBe('design');
      
      // And: design-specific instructions should be returned
      expect(response.instructions).toBeDefined();
      expect(response.instructions.toLowerCase()).toMatch(/design|architecture|technical/);
      
      // And: the database should be updated with the new stage
      const stateResource = await client.readResource({
        uri: 'state://current'
      });
      const stateData = JSON.parse(stateResource.contents[0].text!);
      expect(stateData.currentStage).toBe('design');
      
      // And: the transition reason should be recorded
      expect(response.transition_reason).toBe('requirements gathering complete');
    });
  });

  describe('Scenario: Direct stage transition skipping intermediate stages', () => {
    it('should allow direct transition to implementation', async () => {
      // Given: an existing conversation in "requirements" stage
      await startServer();
      
      // Create initial conversation
      await client.callTool({
        name: 'whats_next',
        arguments: {
          user_input: 'implement authentication feature'
        }
      });

      // When: I call proceed_to_stage with target_stage "implementation"
      const result = await client.callTool({
        name: 'proceed_to_stage',
        arguments: {
          target_stage: 'implementation',
          reason: 'skipping design, requirements are clear'
        }
      });

      // Then: the stage should transition directly to "implementation"
      const response = JSON.parse(result.content[0].text!);
      expect(response.stage).toBe('implementation');
      
      // And: implementation-specific instructions should be provided
      expect(response.instructions.toLowerCase()).toMatch(/implement|code|build/);
      
      // And: the transition should be allowed (no strict sequential enforcement)
      expect(response.transition_reason).toBe('skipping design, requirements are clear');
      
      // And: the reason should indicate direct transition
      expect(response.transition_reason.toLowerCase()).toMatch(/skip|direct/);
    });
  });

  describe('Scenario: Transition to completion stage', () => {
    it('should transition to complete stage', async () => {
      // Given: an existing conversation in "testing" stage
      await startServer();
      
      // Create conversation and move to testing stage
      await client.callTool({
        name: 'whats_next',
        arguments: {
          user_input: 'implement authentication feature'
        }
      });
      
      await client.callTool({
        name: 'proceed_to_stage',
        arguments: {
          target_stage: 'testing'
        }
      });

      // When: I call proceed_to_stage with target_stage "complete"
      const result = await client.callTool({
        name: 'proceed_to_stage',
        arguments: {
          target_stage: 'complete',
          reason: 'all testing completed successfully'
        }
      });

      // Then: the conversation should be marked as complete
      const response = JSON.parse(result.content[0].text!);
      expect(response.stage).toBe('complete');
      
      // And: completion instructions should be provided
      expect(response.instructions).toBeDefined();
      expect(response.instructions.toLowerCase()).toMatch(/complete|finish|done/);
      
      // And: the conversation state should reflect project completion
      const stateResource = await client.readResource({
        uri: 'state://current'
      });
      const stateData = JSON.parse(stateResource.contents[0].text!);
      expect(stateData.currentStage).toBe('complete');
    });
  });

  describe('Scenario: Invalid stage transition parameters', () => {
    it('should reject invalid stage names', async () => {
      // Given: the MCP server is running
      await startServer();

      // When: I call proceed_to_stage with an invalid target_stage
      try {
        await client.callTool({
          name: 'proceed_to_stage',
          arguments: {
            target_stage: 'invalid_stage'
          }
        });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Then: the tool should return an error response
        expect(error).toBeDefined();
        // The error should indicate invalid stage
        expect(error.message || error.toString()).toMatch(/invalid|error/i);
      }
    });

    it('should handle missing target_stage parameter', async () => {
      // Given: the MCP server is running
      await startServer();

      // When: I call proceed_to_stage without target_stage
      try {
        await client.callTool({
          name: 'proceed_to_stage',
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
        expect(error.message || error.toString()).toMatch(/required|missing|target_stage/i);
      }
    });
  });

  describe('Scenario: Transition with detailed reason', () => {
    it('should record transition with provided reason', async () => {
      // Given: an existing conversation in "design" stage
      await startServer();
      
      // Create conversation and move to design stage
      await client.callTool({
        name: 'whats_next',
        arguments: {
          user_input: 'implement authentication feature'
        }
      });
      
      await client.callTool({
        name: 'proceed_to_stage',
        arguments: {
          target_stage: 'design'
        }
      });

      // When: I call proceed_to_stage with detailed reason
      const detailedReason = 'design approved by user, ready to code';
      const result = await client.callTool({
        name: 'proceed_to_stage',
        arguments: {
          target_stage: 'implementation',
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
    it('should create new conversation with target stage', async () => {
      // Given: no existing conversation state for the current project
      await startServer();

      // When: I call proceed_to_stage with target_stage "design"
      const result = await client.callTool({
        name: 'proceed_to_stage',
        arguments: {
          target_stage: 'design',
          reason: 'starting directly with design'
        }
      });

      // Then: a new conversation should be created
      const response = JSON.parse(result.content[0].text!);
      expect(response.stage).toBe('design');
      
      // And: the stage should be set to the requested target stage
      expect(response.instructions).toBeDefined();
      expect(response.instructions.toLowerCase()).toMatch(/design|architecture/);
      
      // And: appropriate instructions should be generated for the target stage
      const stateResource = await client.readResource({
        uri: 'state://current'
      });
      const stateData = JSON.parse(stateResource.contents[0].text!);
      expect(stateData.currentStage).toBe('design');
    });
  });

  describe('Scenario: Multiple rapid stage transitions', () => {
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
        name: 'proceed_to_stage',
        arguments: {
          target_stage: 'design',
          reason: 'move to design'
        }
      });

      const transition2 = await client.callTool({
        name: 'proceed_to_stage',
        arguments: {
          target_stage: 'implementation',
          reason: 'move to implementation'
        }
      });

      const transition3 = await client.callTool({
        name: 'proceed_to_stage',
        arguments: {
          target_stage: 'qa',
          reason: 'move to qa'
        }
      });

      // Then: each transition should be processed correctly
      const response1 = JSON.parse(transition1.content[0].text!);
      expect(response1.stage).toBe('design');

      const response2 = JSON.parse(transition2.content[0].text!);
      expect(response2.stage).toBe('implementation');

      const response3 = JSON.parse(transition3.content[0].text!);
      expect(response3.stage).toBe('qa');
      
      // And: the final state should reflect the last successful transition
      const stateResource = await client.readResource({
        uri: 'state://current'
      });
      const stateData = JSON.parse(stateResource.contents[0].text!);
      expect(stateData.currentStage).toBe('qa');
    });
  });
});
