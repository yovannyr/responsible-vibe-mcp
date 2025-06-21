/**
 * Transition Engine
 * 
 * Manages the development state machine and determines appropriate phase transitions.
 * Analyzes conversation context and user input to make intelligent phase decisions.
 */

import { createLogger } from './logger.js';
import { StateMachineLoader } from './state-machine-loader.js';

const logger = createLogger('TransitionEngine');

export interface TransitionContext {
  currentPhase: string;
  projectPath: string;
  userInput?: string;
  context?: string;
  conversationSummary?: string;
  recentMessages?: Array<{ role: string; content: string }>;
}

export interface TransitionResult {
  newPhase: string;
  instructions: string;
  transitionReason: string;
  isModeled: boolean;
}

export class TransitionEngine {
  private stateMachineLoader: StateMachineLoader;
  
  constructor(projectPath: string) {
    this.stateMachineLoader = new StateMachineLoader();
    this.stateMachineLoader.loadStateMachine(projectPath);
    
    logger.info('TransitionEngine initialized', { projectPath });
  }
  
  /**
   * Get the loaded state machine for the current project
   */
  getStateMachine(projectPath: string) {
    // Ensure we have the latest state machine for this project
    return this.stateMachineLoader.loadStateMachine(projectPath);
  }

  /**
   * Check if this is the first call from initial state and criteria need to be defined
   */
  private isFirstCallFromInitialState(context: TransitionContext): boolean {
    const stateMachine = this.stateMachineLoader.loadStateMachine(context.projectPath);
    const isInitialState = context.currentPhase === stateMachine.initial_state;
    
    // Check if this appears to be the very first interaction
    // (no conversation summary and minimal context)
    const isFirstInteraction = !context.conversationSummary || 
                              context.conversationSummary.trim().length < 50;
    
    return isInitialState && isFirstInteraction;
  }

  /**
   * Generate instructions for defining phase entrance criteria
   */
  private generateCriteriaDefinitionInstructions(projectPath: string): string {
    const stateMachine = this.stateMachineLoader.loadStateMachine(projectPath);
    const phases = Object.keys(stateMachine.states);
    
    let instructions = `Welcome to ${stateMachine.name}!

Before we begin development, let's establish clear entrance criteria for each phase. This will help us make informed decisions about when to transition between phases throughout the development process.

Please update the plan file with a "Phase Entrance Criteria" section that defines specific, measurable criteria for entering each phase:

## Phase Entrance Criteria

`;

    // Generate criteria template for each phase (except initial state)
    phases.forEach(phase => {
      if (phase === stateMachine.initial_state) return; // Skip initial state
      
      const phaseDefinition = stateMachine.states[phase];
      const capitalizedPhase = this.capitalizePhase(phase);
      
      instructions += `### ${capitalizedPhase} Phase
*${phaseDefinition.description}*

**Enter when:**
- [ ] [Define specific criteria for entering ${phase} phase]
- [ ] [Add measurable conditions that must be met]
- [ ] [Include any deliverables or milestones required]

`;
    });

    instructions += `
Once you've defined these criteria, we can begin development. Throughout the process, consult these criteria when considering phase transitions.

**Remember**: These criteria should be specific and measurable so we can clearly determine when each phase is ready to begin.`;

    return instructions;
  }

  /**
   * Capitalize phase name for display
   */
  private capitalizePhase(phase: string): string {
    return phase.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  /**
   * Analyze context and determine appropriate phase transition
   */
  analyzePhaseTransition(context: TransitionContext): TransitionResult {
    const { currentPhase, projectPath, userInput, context: additionalContext, conversationSummary } = context;
    
    // Reload state machine for this specific project/conversation
    this.stateMachineLoader.loadStateMachine(projectPath);
    
    logger.debug('Analyzing phase transition', {
      currentPhase,
      projectPath,
      hasUserInput: !!userInput,
      hasContext: !!additionalContext,
      hasSummary: !!conversationSummary,
      userInput: userInput ? userInput.substring(0, 50) + (userInput.length > 50 ? '...' : '') : undefined
    });

    // Check if this is the first call from initial state - need to define criteria
    if (this.isFirstCallFromInitialState(context)) {
      logger.info('First call from initial state - generating criteria definition instructions', {
        currentPhase,
        projectPath
      });
      
      return {
        newPhase: currentPhase, // Stay in current phase
        instructions: this.generateCriteriaDefinitionInstructions(projectPath),
        transitionReason: "First interaction - need to define phase entrance criteria",
        isModeled: false
      };
    }

    // For all other cases, stay in current phase and let LLM decide based on plan file criteria
    // The LLM will consult the entrance criteria in the plan file and use proceed_to_phase when ready
    const continueInstructions = this.stateMachineLoader.getContinuePhaseInstructions(currentPhase);
    
    logger.debug('Continuing in current phase - LLM will evaluate transition criteria', {
      currentPhase,
      projectPath
    });
    
    return {
      newPhase: currentPhase,
      instructions: continueInstructions,
      transitionReason: "Continue current phase - LLM will evaluate transition criteria from plan file",
      isModeled: false
    };
  }

  /**
   * Handle explicit phase transition request
   */
  handleExplicitTransition(
    currentPhase: string,
    targetPhase: string,
    projectPath: string,
    reason?: string
  ): TransitionResult {
    // Reload state machine for this specific project/conversation
    this.stateMachineLoader.loadStateMachine(projectPath);
    
    logger.debug('Handling explicit phase transition', {
      currentPhase,
      targetPhase,
      projectPath,
      reason 
    });
    
    // Validate that the target phase exists in the state machine
    if (!this.stateMachineLoader.isValidPhase(targetPhase)) {
      const validPhases = this.stateMachineLoader.getValidPhases();
      const errorMsg = `Invalid target phase: "${targetPhase}". Valid phases are: ${validPhases.join(', ')}`;
      logger.error('Invalid target phase', new Error(errorMsg));
      throw new Error(errorMsg);
    }

    const transitionInfo = this.stateMachineLoader.getTransitionInstructions(
      currentPhase, 
      targetPhase
    );
    
    logger.info('Explicit phase transition processed', {
      fromPhase: currentPhase,
      toPhase: targetPhase,
      reason: reason || transitionInfo.transitionReason,
      isModeled: transitionInfo.isModeled
    });
    
    return {
      newPhase: targetPhase,
      instructions: transitionInfo.instructions,
      transitionReason: reason || transitionInfo.transitionReason,
      isModeled: transitionInfo.isModeled
    };
  }
}
