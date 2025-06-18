/**
 * Testable version of VibeFeatureMCPServer with dependency injection
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DevelopmentPhase } from '../../src/state-machine.js';
import { ConversationManager } from '../../src/conversation-manager.js';
import { TransitionEngine } from '../../src/transition-engine.js';
import { InstructionGenerator } from '../../src/instruction-generator.js';
import { PlanManager } from '../../src/plan-manager.js';
import type { MockDatabase } from './database.mock.js';
import type { MockFileSystem } from './filesystem.mock.js';

export class TestableVibeFeatureMCPServer {
  private server: McpServer;
  private database: MockDatabase;
  private fileSystem: MockFileSystem;
  private conversationManager: ConversationManager;
  private transitionEngine: TransitionEngine;
  private instructionGenerator: InstructionGenerator;
  private planManager: PlanManager;

  constructor(database: MockDatabase, fileSystem: MockFileSystem) {
    this.database = database;
    this.fileSystem = fileSystem;
    
    // Initialize MCP server
    this.server = new McpServer({
      name: 'vibe-feature-mcp-test',
      version: '1.0.0'
    });

    // Initialize components with mocked dependencies
    this.conversationManager = new TestableConversationManager(this.database, this.fileSystem);
    this.transitionEngine = new TransitionEngine();
    this.planManager = new TestablePlanManager(this.fileSystem);
    this.instructionGenerator = new InstructionGenerator(this.planManager);

    this.setupTools();
    this.setupResources();
  }

  async initialize(): Promise<void> {
    await this.database.initialize();
  }

  async close(): Promise<void> {
    await this.database.close();
  }

  private setupTools(): void {
    // whats_next tool
    this.server.tool(
      'whats_next',
      {
        context: z.string().optional(),
        user_input: z.string().optional(),
        conversation_summary: z.string().optional(),
        recent_messages: z.array(z.object({
          role: z.string(),
          content: z.string()
        })).optional()
      },
      async (params) => {
        try {
          return await this.handleWhatsNext(params);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return {
            content: [{
              type: 'text' as const,
              text: `Error: ${errorMessage}`
            }],
            isError: true
          };
        }
      }
    );

    // proceed_to_phase tool
    this.server.tool(
      'proceed_to_phase',
      {
        target_phase: z.enum(['idle', 'requirements', 'design', 'implementation', 'qa', 'testing', 'complete']),
        reason: z.string().optional()
      },
      async (params) => {
        try {
          return await this.handleProceedToPhase(params);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return {
            content: [{
              type: 'text' as const,
              text: `Error: ${errorMessage}`
            }],
            isError: true
          };
        }
      }
    );
  }

  private setupResources(): void {
    // Development plan resource
    this.server.resource(
      'development-plan',
      'plan://current',
      {
        description: 'Current development plan document (markdown)',
        mimeType: 'text/markdown'
      },
      async (uri: any) => {
        try {
          const context = await this.conversationManager.getConversationContext();
          const planContent = await this.planManager.getPlanFileContent(context.planFilePath);
          
          return {
            contents: [{
              uri: uri.href,
              text: planContent,
              mimeType: 'text/markdown'
            }]
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return {
            contents: [{
              uri: uri.href,
              text: `Error loading plan: ${errorMessage}`,
              mimeType: 'text/plain'
            }]
          };
        }
      }
    );

    // Conversation state resource
    this.server.resource(
      'conversation-state',
      'state://current',
      {
        description: 'Current conversation state and phase information',
        mimeType: 'application/json'
      },
      async (uri: any) => {
        try {
          const context = await this.conversationManager.getConversationContext();
          
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(context, null, 2),
              mimeType: 'application/json'
            }]
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify({ error: errorMessage }, null, 2),
              mimeType: 'application/json'
            }]
          };
        }
      }
    );
  }

  private async handleWhatsNext(params: any) {
    const context = await this.conversationManager.getConversationContext();
    
    // Analyze phase transition
    const phaseDecision = await this.transitionEngine.analyzePhaseTransition(
      context.currentPhase,
      params.context || '',
      params.user_input || '',
      params.conversation_summary || '',
      params.recent_messages || []
    );

    // Update conversation phase if changed
    if (phaseDecision.newPhase !== context.currentPhase) {
      await this.conversationManager.updatePhase(context.conversationId, phaseDecision.newPhase);
      context.currentPhase = phaseDecision.newPhase;
    }

    // Generate instructions
    const instructions = await this.instructionGenerator.generateInstructions(
      phaseDecision.newPhase,
      context,
      params.context || ''
    );

    return {
      phase: phaseDecision.newPhase,
      instructions: instructions.instructions,
      plan_file_path: context.planFilePath,
      transition_reason: phaseDecision.reason,
      completed_tasks: instructions.completedTasks
    };
  }

  private async handleProceedToPhase(params: any) {
    const context = await this.conversationManager.getConversationContext();
    
    // Update conversation phase
    await this.conversationManager.updatePhase(context.conversationId, params.target_phase);
    context.currentPhase = params.target_phase;

    // Generate instructions for new phase
    const instructions = await this.instructionGenerator.generateInstructions(
      params.target_phase,
      context,
      params.reason || 'Explicit phase transition'
    );

    return {
      phase: params.target_phase,
      instructions: instructions.instructions,
      plan_file_path: context.planFilePath,
      transition_reason: params.reason || 'Explicit phase transition',
      completed_tasks: instructions.completedTasks
    };
  }

  // Test utilities
  async callTool(toolName: string, params: any) {
    if (toolName === 'whats_next') {
      return await this.handleWhatsNext(params);
    } else if (toolName === 'proceed_to_phase') {
      return await this.handleProceedToPhase(params);
    }
    throw new Error(`Unknown tool: ${toolName}`);
  }

  async getResource(uri: string) {
    if (uri === 'plan://current') {
      const context = await this.conversationManager.getConversationContext();
      const planContent = await this.planManager.getPlanFileContent(context.planFilePath);
      return { text: planContent, mimeType: 'text/markdown' };
    } else if (uri === 'state://current') {
      const context = await this.conversationManager.getConversationContext();
      return { text: JSON.stringify(context, null, 2), mimeType: 'application/json' };
    }
    throw new Error(`Unknown resource: ${uri}`);
  }

  listTools() {
    return ['whats_next', 'proceed_to_phase'];
  }

  listResources() {
    return ['plan://current', 'state://current'];
  }
}

// Testable versions of components that accept mocked dependencies
class TestableConversationManager extends ConversationManager {
  constructor(database: MockDatabase, private fileSystem: MockFileSystem) {
    super(database as any);
  }

  protected detectProjectPath(): string {
    return this.fileSystem.getCurrentDirectory();
  }

  protected detectGitBranch(projectPath: string): string {
    return this.fileSystem.getGitBranch();
  }
}

class TestablePlanManager extends PlanManager {
  constructor(private fileSystem: MockFileSystem) {
    super();
  }

  async getPlanFileContent(planFilePath: string): Promise<string> {
    try {
      return await this.fileSystem.readFile(planFilePath);
    } catch (error) {
      // Create default plan file if it doesn't exist
      const defaultContent = this.generateDefaultPlanContent();
      await this.fileSystem.writeFile(planFilePath, defaultContent);
      return defaultContent;
    }
  }

  private generateDefaultPlanContent(): string {
    return `# Development Plan

*Generated by Vibe Feature MCP*

## Project Overview

**Status**: Planning Phase  
**Current Phase**: Requirements Analysis

### Feature Goals
- [ ] *To be defined based on requirements gathering*

### Scope
- [ ] *To be defined during requirements phase*

## Development Progress

### 📋 Requirements Analysis
**Status**: In Progress

### 🎨 Design
**Status**: Not Started

### 💻 Implementation
**Status**: Not Started

### 🔍 Quality Assurance
**Status**: Not Started

### 🧪 Testing
**Status**: Not Started
`;
  }
}
