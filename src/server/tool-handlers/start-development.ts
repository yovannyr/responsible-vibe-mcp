/**
 * StartDevelopment Tool Handler
 * 
 * Handles initialization of development workflow and transition to the initial 
 * development phase. Allows users to choose from predefined workflows or use a custom workflow.
 */

import { BaseToolHandler } from './base-tool-handler.js';
import { ServerContext } from '../types.js';
import { validateRequiredArgs } from '../server-helpers.js';

/**
 * Arguments for the start_development tool
 */
export interface StartDevelopmentArgs {
  workflow: string;
}

/**
 * Response from the start_development tool
 */
export interface StartDevelopmentResult {
  phase: string;
  instructions: string;
  plan_file_path: string;
  conversation_id: string;
  workflow: any; // State machine object
}

/**
 * StartDevelopment tool handler implementation
 */
export class StartDevelopmentHandler extends BaseToolHandler<StartDevelopmentArgs, StartDevelopmentResult> {

  protected async executeHandler(
    args: StartDevelopmentArgs,
    context: ServerContext
  ): Promise<StartDevelopmentResult> {
    // Validate required arguments
    validateRequiredArgs(args, ['workflow']);

    const selectedWorkflow = args.workflow;

    this.logger.debug('Processing start_development request', { 
      selectedWorkflow
    });

    // Validate workflow selection
    if (!context.workflowManager.validateWorkflowName(selectedWorkflow, context.projectPath)) {
      const availableWorkflows = context.workflowManager.getWorkflowNames();
      throw new Error(
        `Invalid workflow: ${selectedWorkflow}. Available workflows: ${availableWorkflows.join(', ')}, custom`
      );
    }

    // Create or get conversation context with the selected workflow
    const conversationContext = await context.conversationManager.createConversationContext(selectedWorkflow);
    const currentPhase = conversationContext.currentPhase;
    
    // Load the selected workflow
    const stateMachine = context.workflowManager.loadWorkflowForProject(
      conversationContext.projectPath, 
      selectedWorkflow
    );
    const initialState = stateMachine.initial_state;
    
    // Check if development is already started
    if (currentPhase !== initialState) {
      throw new Error(
        `Development already started. Current phase is '${currentPhase}', not initial state '${initialState}'. Use whats_next() to continue development.`
      );
    }
    
    // The initial state IS the first development phase - it's explicitly modeled
    const targetPhase = initialState;
    
    // Transition to the initial development phase
    const transitionResult = await context.transitionEngine.handleExplicitTransition(
      currentPhase,
      targetPhase,
      conversationContext.projectPath,
      'Development initialization',
      selectedWorkflow
    );
    
    // Update conversation state with workflow and phase
    await context.conversationManager.updateConversationState(
      conversationContext.conversationId,
      { 
        currentPhase: transitionResult.newPhase,
        workflowName: selectedWorkflow
      }
    );
    
    // Set state machine on plan manager before creating plan file
    context.planManager.setStateMachine(stateMachine);
    
    // Ensure plan file exists
    await context.planManager.ensurePlanFile(
      conversationContext.planFilePath,
      conversationContext.projectPath,
      conversationContext.gitBranch
    );
    
    const response: StartDevelopmentResult = {
      phase: transitionResult.newPhase,
      instructions: `Look at the plan file (${conversationContext.planFilePath}). Define entrance criteria for each phase of the workflow except the initial phase. Those criteria shall be based on the contents of the previous phase. 
      Example: 
      \`\`\`
      ## Design

      ### Phase Entrance Criteria:
      - [ ] The requirements have been thoroughly defined.
      - [ ] Alternatives have been evaluated and are documented. 
      - [ ] It's clear what's in scope and out of scope
      \`\`\`
      
      IMPORTANT: Once you added reasonable entrance call the whats_next() tool to get guided instructions for the next current phase.`,
      plan_file_path: conversationContext.planFilePath,
      conversation_id: conversationContext.conversationId,
      workflow: stateMachine
    };
    
    // Log interaction
    await this.logInteraction(
      context,
      conversationContext.conversationId,
      'start_development',
      args,
      response,
      transitionResult.newPhase
    );
    
    return response;
  }
}
