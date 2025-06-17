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
import { createLogger } from './logger.js';
import type { DevelopmentStage } from './state-machine.js';

const logger = createLogger('Server');

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
    logger.debug('Initializing VibeFeatureMCPServer');
    
    // Initialize MCP server
    this.server = new McpServer({
      name: 'vibe-feature-mcp',
      version: '1.0.0'
    });

    // Initialize components
    logger.debug('Initializing server components');
    this.database = new Database();
    this.conversationManager = new ConversationManager(this.database);
    this.transitionEngine = new TransitionEngine();
    this.planManager = new PlanManager();
    this.instructionGenerator = new InstructionGenerator(this.planManager);

    this.setupTools();
    this.setupResources();
    
    logger.info('VibeFeatureMCPServer initialized successfully');
  }

  /**
   * Setup MCP tools
   */
  private setupTools(): void {
    logger.debug('Setting up MCP tools');
    
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
        const toolLogger = logger.child('whats_next');
        toolLogger.debug('Tool called', { params: Object.keys(params) });
        
        try {
          const result = await this.handleWhatsNext(params);
          toolLogger.info('Tool executed successfully');
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          toolLogger.error('Tool execution failed', error as Error);
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
        const toolLogger = logger.child('proceed_to_stage');
        toolLogger.debug('Tool called', { target_stage: params.target_stage, reason: params.reason });
        
        try {
          const result = await this.handleProceedToStage(params);
          toolLogger.info('Stage transition completed', { target_stage: params.target_stage });
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          toolLogger.error('Stage transition failed', error as Error, { target_stage: params.target_stage });
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
    
    logger.info('MCP tools setup completed');
  }

  /**
   * Setup MCP resources
   */
  private setupResources(): void {
    logger.debug('Setting up MCP resources');
    
    // Development plan resource
    this.server.resource(
      'development-plan',
      'plan://current',
      {
        description: 'Current development plan document (markdown)',
        mimeType: 'text/markdown'
      },
      async (uri: any) => {
        const resourceLogger = logger.child('plan-resource');
        resourceLogger.debug('Plan resource accessed');
        
        try {
          const context = await this.conversationManager.getConversationContext();
          const planContent = await this.planManager.getPlanFileContent(context.planFilePath);
          
          resourceLogger.info('Plan resource retrieved successfully', { 
            planFilePath: context.planFilePath,
            contentLength: planContent.length 
          });
          
          return {
            contents: [{
              uri: uri.href,
              text: planContent,
              mimeType: 'text/markdown'
            }]
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          resourceLogger.error('Failed to retrieve plan resource', error as Error);
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
        const resourceLogger = logger.child('state-resource');
        resourceLogger.debug('State resource accessed');
        
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
          
          resourceLogger.info('State resource retrieved successfully', { 
            conversationId: context.conversationId,
            currentStage: context.currentStage 
          });
          
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(stateInfo, null, 2),
              mimeType: 'application/json'
            }]
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          resourceLogger.error('Failed to retrieve state resource', error as Error);
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
    
    logger.info('MCP resources setup completed');
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
    const handlerLogger = logger.child('handleWhatsNext');
    handlerLogger.debug('Starting whats_next analysis', { 
      hasContext: !!params.context,
      hasUserInput: !!params.user_input,
      hasSummary: !!params.conversation_summary,
      messageCount: params.recent_messages?.length || 0
    });

    // Get current conversation context
    const conversationContext = await this.conversationManager.getConversationContext();
    handlerLogger.debug('Retrieved conversation context', {
      conversationId: conversationContext.conversationId,
      currentStage: conversationContext.currentStage,
      projectPath: conversationContext.projectPath
    });
    
    // Ensure plan file exists
    await this.planManager.ensurePlanFile(
      conversationContext.planFilePath,
      conversationContext.projectPath,
      conversationContext.gitBranch
    );
    handlerLogger.debug('Plan file ensured', { planFilePath: conversationContext.planFilePath });

    // Analyze stage transition
    const transitionResult = this.transitionEngine.analyzeStageTransition({
      currentStage: conversationContext.currentStage,
      userInput: params.user_input,
      context: params.context,
      conversationSummary: params.conversation_summary,
      recentMessages: params.recent_messages
    });
    
    handlerLogger.debug('Stage transition analyzed', {
      currentStage: conversationContext.currentStage,
      newStage: transitionResult.newStage,
      isModeled: transitionResult.isModeled,
      transitionReason: transitionResult.transitionReason
    });

    // Update conversation state if stage changed
    if (transitionResult.newStage !== conversationContext.currentStage) {
      await this.conversationManager.updateConversationState(
        conversationContext.conversationId,
        { currentStage: transitionResult.newStage }
      );
      handlerLogger.info('Stage transition completed', {
        conversationId: conversationContext.conversationId,
        fromStage: conversationContext.currentStage,
        toStage: transitionResult.newStage,
        reason: transitionResult.transitionReason
      });
    } else {
      handlerLogger.debug('No stage change required', { currentStage: conversationContext.currentStage });
    }

    // Check if plan file exists
    const planInfo = await this.planManager.getPlanFileInfo(conversationContext.planFilePath);
    handlerLogger.debug('Plan file info retrieved', { exists: planInfo.exists });

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
    
    handlerLogger.info('Instructions generated successfully', {
      stage: transitionResult.newStage,
      instructionLength: instructions.instructions.length
    });

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
    const handlerLogger = logger.child('handleProceedToStage');
    handlerLogger.debug('Starting explicit stage transition', { 
      targetStage: params.target_stage,
      reason: params.reason 
    });

    // Get current conversation context
    const conversationContext = await this.conversationManager.getConversationContext();
    handlerLogger.debug('Retrieved conversation context', {
      conversationId: conversationContext.conversationId,
      currentStage: conversationContext.currentStage,
      targetStage: params.target_stage
    });

    // Handle explicit transition
    const transitionResult = this.transitionEngine.handleExplicitTransition(
      conversationContext.currentStage,
      params.target_stage,
      params.reason
    );
    
    handlerLogger.debug('Explicit transition processed', {
      fromStage: conversationContext.currentStage,
      toStage: transitionResult.newStage,
      transitionReason: transitionResult.transitionReason
    });

    // Update conversation state
    await this.conversationManager.updateConversationState(
      conversationContext.conversationId,
      { currentStage: transitionResult.newStage }
    );
    
    handlerLogger.info('Explicit stage transition completed', {
      conversationId: conversationContext.conversationId,
      fromStage: conversationContext.currentStage,
      toStage: transitionResult.newStage,
      reason: transitionResult.transitionReason
    });

    // Ensure plan file exists
    await this.planManager.ensurePlanFile(
      conversationContext.planFilePath,
      conversationContext.projectPath,
      conversationContext.gitBranch
    );
    handlerLogger.debug('Plan file ensured', { planFilePath: conversationContext.planFilePath });

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
    
    handlerLogger.info('Instructions generated for explicit transition', {
      stage: transitionResult.newStage,
      instructionLength: instructions.instructions.length
    });

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
    logger.info('Starting Vibe Feature MCP Server');
    
    try {
      // Initialize database
      logger.debug('Initializing database');
      await this.database.initialize();
      logger.info('Database initialized successfully');

      // Setup stdio transport
      logger.debug('Setting up stdio transport');
      const transport = new StdioServerTransport();
      
      // Connect server to transport
      logger.debug('Connecting server to transport');
      await this.server.connect(transport);
      
      // Log startup (to stderr so it doesn't interfere with stdio protocol)
      logger.info('Vibe Feature MCP Server started successfully');
      console.error('Vibe Feature MCP Server started successfully');
    } catch (error) {
      logger.error('Failed to start Vibe Feature MCP Server', error as Error);
      console.error('Failed to start Vibe Feature MCP Server:', error);
      throw error;
    }
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Vibe Feature MCP Server');
    
    try {
      await this.database.close();
      logger.info('Database connection closed');
      console.error('Shutting down Vibe Feature MCP Server...');
    } catch (error) {
      logger.error('Error during shutdown', error as Error);
      console.error('Error during shutdown:', error);
    }
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  logger.info('Initializing Vibe Feature MCP Server');
  const server = new VibeFeatureMCPServer();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, initiating graceful shutdown');
    console.error('Shutting down Vibe Feature MCP Server...');
    await server.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, initiating graceful shutdown');
    console.error('Shutting down Vibe Feature MCP Server...');
    await server.shutdown();
    process.exit(0);
  });

  try {
    // Start server
    await server.start();
  } catch (error) {
    logger.error('Failed to start server in main', error as Error);
    throw error;
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Unhandled error in main', error as Error);
    console.error('Failed to start Vibe Feature MCP Server:', error);
    process.exit(1);
  });
}
