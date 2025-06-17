#!/usr/bin/env node

/**
 * Vibe Feature MCP Server
 * 
 * A Model Context Protocol server that acts as an intelligent conversation 
 * state manager and development guide for LLMs.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { Database } from './database.js';
import { ConversationManager } from './conversation-manager.js';
import { TransitionEngine } from './transition-engine.js';
import { InstructionGenerator } from './instruction-generator.js';
import { PlanManager } from './plan-manager.js';
import type { DevelopmentStage } from './state-machine.js';

/**
 * Main server class that orchestrates all components
 */
class VibeFeatureMCPServer {
  private server: McpServer;
  private database: Database;
  private conversationManager: ConversationManager;
  private transitionEngine: TransitionEngine;
  private instructionGenerator: InstructionGenerator;
  private planManager: PlanManager;

  constructor() {
    // Initialize MCP server
    this.server = new McpServer({
      name: 'vibe-feature-mcp',
      version: '1.0.0'
    });

    // Initialize components
    this.database = new Database();
    this.conversationManager = new ConversationManager(this.database);
    this.transitionEngine = new TransitionEngine();
    this.planManager = new PlanManager();
    this.instructionGenerator = new InstructionGenerator(this.planManager);

    this.setupTools();
    this.setupResources();
  }

  /**
   * Setup MCP tools
   */
  private setupTools(): void {
    // Primary tool: whats_next
    this.server.tool(
      'whats_next',
      {
        context: z.string().optional().describe('Additional context about current conversation'),
        user_input: z.string().optional().describe('Latest user input for analysis'),
        conversation_summary: z.string().optional().describe('LLM-provided summary of the conversation so far'),
        recent_messages: z.array(z.object({
          role: z.string(),
          content: z.string()
        })).optional().describe('Array of recent conversation messages that LLM considers relevant')
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

    // Secondary tool: proceed_to_stage
    this.server.tool(
      'proceed_to_stage',
      {
        target_stage: z.enum(['idle', 'requirements', 'design', 'implementation', 'qa', 'testing', 'complete'])
          .describe('The stage to transition to'),
        reason: z.string().optional().describe('Reason for transitioning now')
      },
      async (params) => {
        try {
          return await this.handleProceedToStage(params);
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

  /**
   * Setup MCP resources
   */
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
        description: 'Current conversation state and stage information',
        mimeType: 'application/json'
      },
      async (uri: any) => {
        try {
          const context = await this.conversationManager.getConversationContext();
          
          const stateInfo = {
            conversationId: context.conversationId,
            projectPath: context.projectPath,
            gitBranch: context.gitBranch,
            currentStage: context.currentStage,
            planFilePath: context.planFilePath,
            timestamp: new Date().toISOString()
          };
          
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(stateInfo, null, 2),
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

  /**
   * Handle whats_next tool call
   */
  private async handleWhatsNext(params: {
    context?: string;
    user_input?: string;
    conversation_summary?: string;
    recent_messages?: Array<{ role: string; content: string }>;
  }) {
    // Get current conversation context
    const conversationContext = await this.conversationManager.getConversationContext();
    
    // Ensure plan file exists
    await this.planManager.ensurePlanFile(
      conversationContext.planFilePath,
      conversationContext.projectPath,
      conversationContext.gitBranch
    );

    // Analyze stage transition
    const transitionResult = this.transitionEngine.analyzeStageTransition({
      currentStage: conversationContext.currentStage,
      userInput: params.user_input,
      context: params.context,
      conversationSummary: params.conversation_summary,
      recentMessages: params.recent_messages
    });

    // Update conversation state if stage changed
    if (transitionResult.newStage !== conversationContext.currentStage) {
      await this.conversationManager.updateConversationState(
        conversationContext.conversationId,
        { currentStage: transitionResult.newStage }
      );
    }

    // Check if plan file exists
    const planInfo = await this.planManager.getPlanFileInfo(conversationContext.planFilePath);

    // Generate enhanced instructions
    const instructions = await this.instructionGenerator.generateInstructions(
      transitionResult.instructions,
      {
        stage: transitionResult.newStage,
        conversationContext: {
          ...conversationContext,
          currentStage: transitionResult.newStage
        },
        transitionReason: transitionResult.transitionReason,
        isModeled: transitionResult.isModeled,
        planFileExists: planInfo.exists
      }
    );

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          stage: transitionResult.newStage,
          instructions: instructions.instructions,
          plan_file_path: conversationContext.planFilePath,
          transition_reason: transitionResult.transitionReason,
          is_modeled_transition: transitionResult.isModeled,
          conversation_id: conversationContext.conversationId
        }, null, 2)
      }]
    };
  }

  /**
   * Handle proceed_to_stage tool call
   */
  private async handleProceedToStage(params: {
    target_stage: DevelopmentStage;
    reason?: string;
  }) {
    // Get current conversation context
    const conversationContext = await this.conversationManager.getConversationContext();

    // Handle explicit transition
    const transitionResult = this.transitionEngine.handleExplicitTransition(
      conversationContext.currentStage,
      params.target_stage,
      params.reason
    );

    // Update conversation state
    await this.conversationManager.updateConversationState(
      conversationContext.conversationId,
      { currentStage: transitionResult.newStage }
    );

    // Ensure plan file exists
    await this.planManager.ensurePlanFile(
      conversationContext.planFilePath,
      conversationContext.projectPath,
      conversationContext.gitBranch
    );

    // Check if plan file exists
    const planInfo = await this.planManager.getPlanFileInfo(conversationContext.planFilePath);

    // Generate enhanced instructions
    const instructions = await this.instructionGenerator.generateInstructions(
      transitionResult.instructions,
      {
        stage: transitionResult.newStage,
        conversationContext: {
          ...conversationContext,
          currentStage: transitionResult.newStage
        },
        transitionReason: transitionResult.transitionReason,
        isModeled: transitionResult.isModeled,
        planFileExists: planInfo.exists
      }
    );

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          stage: transitionResult.newStage,
          instructions: instructions.instructions,
          plan_file_path: conversationContext.planFilePath,
          transition_reason: transitionResult.transitionReason,
          is_modeled_transition: transitionResult.isModeled,
          conversation_id: conversationContext.conversationId
        }, null, 2)
      }]
    };
  }

  /**
   * Initialize and start the server
   */
  async start(): Promise<void> {
    // Initialize database
    await this.database.initialize();

    // Setup stdio transport
    const transport = new StdioServerTransport();
    
    // Connect server to transport
    await this.server.connect(transport);
    
    // Log startup (to stderr so it doesn't interfere with stdio protocol)
    console.error('Vibe Feature MCP Server started successfully');
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown(): Promise<void> {
    await this.database.close();
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const server = new VibeFeatureMCPServer();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.error('Shutting down Vibe Feature MCP Server...');
    await server.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('Shutting down Vibe Feature MCP Server...');
    await server.shutdown();
    process.exit(0);
  });

  // Start server
  await server.start();
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Failed to start Vibe Feature MCP Server:', error);
    process.exit(1);
  });
}
