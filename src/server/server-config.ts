/**
 * Server Configuration
 * 
 * Handles server configuration, component initialization, and MCP server setup.
 * Centralizes the configuration logic that was previously scattered in the main server class.
 */

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { Database } from '../database.js';
import { ConversationManager } from '../conversation-manager.js';
import { TransitionEngine } from '../transition-engine.js';
import { InstructionGenerator } from '../instruction-generator.js';
import { PlanManager } from '../plan-manager.js';
import { InteractionLogger } from '../interaction-logger.js';
import { WorkflowManager } from '../workflow-manager.js';
import { createLogger } from '../logger.js';

import { 
  ServerConfig, 
  ServerContext, 
  ToolRegistry, 
  ResourceRegistry,
  ResponseRenderer
} from './types.js';
import { normalizeProjectPath, buildWorkflowEnum, generateWorkflowDescription } from './server-helpers.js';

const logger = createLogger('ServerConfig');

/**
 * Server component container
 * Holds all the initialized server components
 */
export interface ServerComponents {
  mcpServer: McpServer;
  database: Database;
  context: ServerContext;
  toolRegistry: ToolRegistry;
  resourceRegistry: ResourceRegistry;
  responseRenderer: ResponseRenderer;
}

/**
 * Initialize all server components
 */
export async function initializeServerComponents(config: ServerConfig = {}): Promise<ServerComponents> {
  logger.debug('Initializing server components', config);
  
  // Set project path
  const projectPath = normalizeProjectPath(config.projectPath);
  
  // Initialize MCP server
  const mcpServer = new McpServer({
    name: 'responsible-vibe-mcp',
    version: '1.0.0'
  });

  // Initialize core components
  logger.debug('Initializing core components');
  const database = new Database(projectPath);
  const conversationManager = new ConversationManager(database, projectPath);
  const transitionEngine = new TransitionEngine(projectPath);
  transitionEngine.setConversationManager(conversationManager);
  const planManager = new PlanManager();
  const instructionGenerator = new InstructionGenerator(planManager);
  const workflowManager = new WorkflowManager();
  
  // Conditionally create interaction logger
  const interactionLogger = config.enableLogging !== false 
    ? new InteractionLogger(database) 
    : undefined;

  // Create server context
  const context: ServerContext = {
    conversationManager,
    transitionEngine,
    planManager,
    instructionGenerator,
    workflowManager,
    interactionLogger,
    projectPath
  };

  // Initialize database
  await database.initialize();

  logger.info('Server components initialized successfully');

  return {
    mcpServer,
    database,
    context,
    toolRegistry: null as any, // Will be set by caller
    resourceRegistry: null as any, // Will be set by caller
    responseRenderer: null as any // Will be set by caller
  };
}

/**
 * Register MCP tools with the server
 */
export function registerMcpTools(
  mcpServer: McpServer, 
  toolRegistry: ToolRegistry,
  responseRenderer: ResponseRenderer,
  context: ServerContext
): void {
  logger.debug('Registering MCP tools');

  // Register whats_next tool
  mcpServer.registerTool(
    'whats_next',
    {
      description: 'Analyze conversation context and determine the next development phase with specific instructions for the LLM. This is the primary tool for orchestrating development workflow and should be called after each user interaction.',
      inputSchema: {
        context: z.string().optional().describe('Additional context about current conversation or situation'),
        user_input: z.string().optional().describe('Latest user input or request for analysis'),
        conversation_summary: z.string().optional().describe('LLM-provided summary of the conversation so far, including key decisions and progress made'),
        recent_messages: z.array(z.object({
          role: z.enum(['user', 'assistant']).describe('The role of the message sender'),
          content: z.string().describe('The content of the message')
        })).optional().describe('Array of recent conversation messages that LLM considers relevant for context')
      },
      annotations: {
        title: 'Development Phase Analyzer',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false
      }
    },
    async (args) => {
      const handler = toolRegistry.get('whats_next');
      if (!handler) {
        return responseRenderer.renderError('Tool handler not found: whats_next');
      }
      
      const result = await handler.handle(args, context);
      return responseRenderer.renderToolResponse(result);
    }
  );

  // Register proceed_to_phase tool
  mcpServer.registerTool(
    'proceed_to_phase',
    {
      description: 'Explicitly transition to a specific development phase when the current phase is complete or when a direct phase change is needed. Use this tool when whats_next suggests a phase transition or when you need to move to a specific phase. Always get confirmation by the user for the reason',
      inputSchema: {
        target_phase: z.string().describe('The development phase to transition to'),
        reason: z.string().optional().describe('Optional reason for transitioning to this phase now (e.g., "requirements complete", "user requested", "design approved")')
      },
      annotations: {
        title: 'Phase Transition Controller',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (args) => {
      const handler = toolRegistry.get('proceed_to_phase');
      if (!handler) {
        return responseRenderer.renderError('Tool handler not found: proceed_to_phase');
      }
      
      const result = await handler.handle(args, context);
      return responseRenderer.renderToolResponse(result);
    }
  );

  // Register start_development tool
  mcpServer.registerTool(
    'start_development',
    {
      description: 'Initialize development workflow and transition to the initial development phase. Choose from predefined workflows or use a custom workflow.',
      inputSchema: {
        workflow: z.enum(buildWorkflowEnum(context.workflowManager.getWorkflowNames()))
          .default('waterfall')
          .describe(generateWorkflowDescription(context.workflowManager.getAvailableWorkflows()))
      },
      annotations: {
        title: 'Development Initializer',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (args) => {
      const handler = toolRegistry.get('start_development');
      if (!handler) {
        return responseRenderer.renderError('Tool handler not found: start_development');
      }
      
      const result = await handler.handle(args, context);
      return responseRenderer.renderToolResponse(result);
    }
  );

  // Register resume_workflow tool
  mcpServer.registerTool(
    'resume_workflow',
    {
      description: 'Resume development workflow after conversation compression. Returns system prompt instructions plus comprehensive project context, current state, and next steps to seamlessly continue development.',
      inputSchema: {
        include_system_prompt: z.boolean().optional().describe('Whether to include system prompt instructions (default: true)'),
        simple_prompt: z.boolean().optional().describe('Whether to use simplified system prompt when included (default: true)')
      },
      annotations: {
        title: 'Workflow Resumption Assistant',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (args) => {
      const handler = toolRegistry.get('resume_workflow');
      if (!handler) {
        return responseRenderer.renderError('Tool handler not found: resume_workflow');
      }
      
      const result = await handler.handle(args, context);
      return responseRenderer.renderToolResponse(result);
    }
  );

  // Register reset_development tool
  mcpServer.registerTool(
    'reset_development',
    {
      description: 'Reset conversation state and development progress. This permanently deletes conversation state and plan file, while soft-deleting interaction logs for audit trail. Requires explicit confirmation.',
      inputSchema: {
        confirm: z.boolean().describe('Must be true to execute reset - prevents accidental resets'),
        reason: z.string().optional().describe('Optional reason for reset (for logging and audit trail)')
      },
      annotations: {
        title: 'Development Reset Tool',
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false
      }
    },
    async (args) => {
      const handler = toolRegistry.get('reset_development');
      if (!handler) {
        return responseRenderer.renderError('Tool handler not found: reset_development');
      }
      
      const result = await handler.handle(args, context);
      return responseRenderer.renderToolResponse(result);
    }
  );

  logger.info('MCP tools registered successfully', { 
    tools: toolRegistry.list() 
  });
}

/**
 * Register MCP resources with the server
 */
export function registerMcpResources(
  mcpServer: McpServer,
  resourceRegistry: ResourceRegistry,
  responseRenderer: ResponseRenderer,
  context: ServerContext
): void {
  logger.debug('Registering MCP resources');

  // Development plan resource
  mcpServer.resource(
    'development-plan',
    'plan://current',
    {
      name: 'Current Development Plan',
      description: 'The active development plan document (markdown) that tracks project progress, tasks, and decisions. This file serves as long-term memory for the development process and should be continuously updated by the LLM.',
      mimeType: 'text/markdown'
    },
    async (uri: any) => {
      const handler = resourceRegistry.resolve(uri.href);
      if (!handler) {
        const errorResult = responseRenderer.renderResourceResponse({
          success: false,
          error: 'Resource handler not found',
          data: {
            uri: uri.href,
            text: 'Error: Resource handler not found',
            mimeType: 'text/plain'
          }
        });
        return errorResult;
      }
      
      const result = await handler.handle(new URL(uri.href), context);
      return responseRenderer.renderResourceResponse(result);
    }
  );

  // Conversation state resource
  mcpServer.resource(
    'conversation-state',
    'state://current',
    {
      name: 'Current Conversation State',
      description: 'Current conversation state and phase information (JSON) including conversation ID, project context, current development phase, and plan file location. Use this to understand the current state of the development workflow.',
      mimeType: 'application/json'
    },
    async (uri: any) => {
      const handler = resourceRegistry.resolve(uri.href);
      if (!handler) {
        const errorResult = responseRenderer.renderResourceResponse({
          success: false,
          error: 'Resource handler not found',
          data: {
            uri: uri.href,
            text: JSON.stringify({ 
              error: 'Resource handler not found',
              timestamp: new Date().toISOString()
            }, null, 2),
            mimeType: 'application/json'
          }
        });
        return errorResult;
      }
      
      const result = await handler.handle(new URL(uri.href), context);
      return responseRenderer.renderResourceResponse(result);
    }
  );

  logger.info('MCP resources registered successfully');
}
