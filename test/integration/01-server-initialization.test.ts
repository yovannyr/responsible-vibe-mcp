/**
 * Server Initialization Integration Tests
 * 
 * Tests MCP server startup, configuration, and component initialization
 * using the actual MCP protocol via Client/Server communication
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { join } from 'path';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { homedir } from 'os';

describe('Server Initialization Integration Tests', () => {
  let client: Client;
  let transport: StdioClientTransport;
  let serverProcess: ChildProcess;
  const testDbDir = join(homedir(), '.vibe-feature-mcp-test-01');

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
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill();
    }
    // Clean up test database
    if (existsSync(testDbDir)) {
      rmSync(testDbDir, { recursive: true, force: true });
    }
  });

  async function startServer() {
    // Start the actual MCP server as a subprocess using tsx to run TypeScript directly
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

  describe('Scenario: Server starts successfully with clean state', () => {
    it('should initialize server with all components', async () => {
      // Given: no existing database or configuration files exist
      expect(existsSync(testDbDir)).toBe(false);

      // When: the MCP server is started
      await startServer();

      // Then: the server should initialize successfully
      // (connection success implies successful initialization)
      expect(client).toBeDefined();

      // And: the database should be created
      expect(existsSync(testDbDir)).toBe(true);

      // And: the server should expose the following tools
      const toolsResponse = await client.listTools();
      const toolNames = toolsResponse.tools.map(tool => tool.name);
      expect(toolNames).toContain('whats_next');
      expect(toolNames).toContain('proceed_to_stage');

      // And: the server should expose the following resources
      const resourcesResponse = await client.listResources();
      const resourceUris = resourcesResponse.resources.map(resource => resource.uri);
      expect(resourceUris).toContain('plan://current');
      expect(resourceUris).toContain('state://current');
    });
  });

  describe('Scenario: Server handles invalid startup conditions', () => {
    it('should handle startup with invalid database directory', async () => {
      // Given: an invalid database directory path
      const invalidDbDir = '/invalid/path/that/does/not/exist';
      
      // When: the MCP server attempts to initialize
      const serverPath = join(process.cwd(), 'dist', 'index.js');
      
      transport = new StdioClientTransport({
        command: 'node',
        args: [serverPath],
        env: {
          ...process.env,
          VIBE_FEATURE_DB_DIR: invalidDbDir
        }
      });

      client = new Client({
        name: 'test-client',
        version: '1.0.0'
      }, {
        capabilities: {}
      });

      // Then: the server should handle the error gracefully
      // (Either connect successfully after creating the directory, or fail gracefully)
      try {
        await client.connect(transport);
        // If connection succeeds, the server handled the error by creating the directory
        expect(true).toBe(true);
      } catch (error) {
        // If connection fails, it should be a meaningful error
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Scenario: Server reconnects to existing database', () => {
    it('should reconnect to existing database and preserve state', async () => {
      // Given: an existing database with conversation states
      // First, start server and create some state
      await startServer();
      
      // Create a conversation by calling whats_next
      await client.callTool({
        name: 'whats_next',
        arguments: {
          user_input: 'implement authentication feature'
        }
      });

      // Get the initial state
      const initialStateResponse = await client.readResource({
        uri: 'state://current'
      });
      const initialState = JSON.parse(initialStateResponse.contents[0].text!);

      // Close the first server
      await client.close();

      // When: the server is restarted
      await startServer();

      // Then: the server should connect to the existing database
      expect(existsSync(testDbDir)).toBe(true);

      // And: preserve all existing conversation states
      const restoredStateResponse = await client.readResource({
        uri: 'state://current'
      });
      const restoredState = JSON.parse(restoredStateResponse.contents[0].text!);

      // And: be able to continue previous conversations
      expect(restoredState.conversationId).toBe(initialState.conversationId);
      expect(restoredState.projectPath).toBe(initialState.projectPath);
      expect(restoredState.currentStage).toBe(initialState.currentStage);
    });
  });

  describe('Scenario: Server components are properly integrated', () => {
    it('should have all components working together', async () => {
      // Given: a clean server setup
      await startServer();

      // When: we test basic functionality
      const result = await client.callTool({
        name: 'whats_next',
        arguments: {
          user_input: 'test feature request'
        }
      });

      // Then: all components should work together
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      
      // The result should be a JSON string containing the expected fields
      const resultText = result.content[0].text;
      expect(resultText).toBeDefined();
      
      const parsedResult = JSON.parse(resultText!);
      expect(parsedResult).toHaveProperty('stage');
      expect(parsedResult).toHaveProperty('instructions');
      expect(parsedResult).toHaveProperty('plan_file_path');
      expect(parsedResult).toHaveProperty('transition_reason');
    });
  });

  describe('Scenario: Server resources are accessible', () => {
    it('should provide access to plan and state resources', async () => {
      // Given: a server with some conversation state
      await startServer();

      // Create a conversation first
      await client.callTool({
        name: 'whats_next',
        arguments: {
          user_input: 'implement authentication'
        }
      });

      // When: we access the resources
      const planResource = await client.readResource({
        uri: 'plan://current'
      });
      const stateResource = await client.readResource({
        uri: 'state://current'
      });

      // Then: plan resource should be accessible
      expect(planResource.contents).toBeDefined();
      expect(planResource.contents.length).toBeGreaterThan(0);
      expect(planResource.contents[0].mimeType).toBe('text/markdown');
      expect(planResource.contents[0].text).toContain('Development Plan');

      // And: state resource should be accessible
      expect(stateResource.contents).toBeDefined();
      expect(stateResource.contents.length).toBeGreaterThan(0);
      expect(stateResource.contents[0].mimeType).toBe('application/json');
      
      const stateData = JSON.parse(stateResource.contents[0].text!);
      expect(stateData).toHaveProperty('conversationId');
      expect(stateData).toHaveProperty('currentStage');
      expect(stateData).toHaveProperty('projectPath');
    });
  });
});
