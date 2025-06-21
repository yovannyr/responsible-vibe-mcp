/**
 * Instruction Generator
 * 
 * Creates phase-specific guidance for the LLM based on current conversation state.
 * Customizes instructions based on project context and development phase.
 * Supports custom state machine definitions for dynamic instruction generation.
 */

import type { ConversationContext } from './types.js';
import { PlanManager } from './plan-manager.js';
import type { YamlStateMachine } from './state-machine-types.js';

export interface InstructionContext {
  phase: string;
  conversationContext: ConversationContext;
  transitionReason: string;
  isModeled: boolean;
  planFileExists: boolean;
}

export interface GeneratedInstructions {
  instructions: string;
  planFileGuidance: string;
  metadata: {
    phase: string;
    planFilePath: string;
    transitionReason: string;
    isModeled: boolean;
  };
}

export class InstructionGenerator {
  private planManager: PlanManager;
  private stateMachine: YamlStateMachine | null = null;

  constructor(planManager: PlanManager) {
    this.planManager = planManager;
  }

  /**
   * Set the state machine definition for dynamic instruction generation
   */
  setStateMachine(stateMachine: YamlStateMachine): void {
    this.stateMachine = stateMachine;
  }

  /**
   * Generate comprehensive instructions for the LLM
   */
  async generateInstructions(
    baseInstructions: string,
    context: InstructionContext
  ): Promise<GeneratedInstructions> {
    
    // Get plan file guidance
    const planFileGuidance = this.planManager.generatePlanFileGuidance(context.phase);
    
    // Enhance base instructions with context-specific guidance
    const enhancedInstructions = await this.enhanceInstructions(
      baseInstructions,
      context,
      planFileGuidance
    );

    return {
      instructions: enhancedInstructions,
      planFileGuidance,
      metadata: {
        phase: context.phase,
        planFilePath: context.conversationContext.planFilePath,
        transitionReason: context.transitionReason,
        isModeled: context.isModeled
      }
    };
  }

  /**
   * Enhance base instructions with context-specific information
   */
  private async enhanceInstructions(
    baseInstructions: string,
    context: InstructionContext,
    planFileGuidance: string
  ): Promise<string> {
    
    const { phase, conversationContext, transitionReason, isModeled, planFileExists } = context;
    
    // Build enhanced instructions
    let enhanced = baseInstructions;

    // Add phase-specific context
    enhanced += '\n\n' + this.getPhaseSpecificContext(phase);

    // Add plan file instructions
    enhanced += '\n\n**Plan File Management:**\n';
    enhanced += `- Plan file location: \`${conversationContext.planFilePath}\`\n`;
    
    if (!planFileExists) {
      enhanced += '- Plan file will be created when you first update it\n';
    }
    
    enhanced += `- ${planFileGuidance}\n`;
    enhanced += '- Always mark completed tasks with [x] and add new tasks as needed\n';
    enhanced += '- Keep the plan file updated with your progress throughout the conversation\n';

    // Add project context
    enhanced += '\n\n**Project Context:**\n';
    enhanced += `- Project: ${conversationContext.projectPath}\n`;
    enhanced += `- Branch: ${conversationContext.gitBranch}\n`;
    enhanced += `- Current Phase: ${phase}\n`;

    // Add transition context if this is a modeled transition
    if (isModeled && transitionReason) {
      enhanced += '\n\n**Transition Context:**\n';
      enhanced += `- ${transitionReason}\n`;
    }

    // Add phase-specific reminders
    enhanced += '\n\n' + this.getPhaseReminders(phase);

    return enhanced;
  }

  /**
   * Get phase-specific contextual information based on state machine
   */
  private getPhaseSpecificContext(phase: string): string {
    if (this.stateMachine) {
      const phaseDefinition = this.stateMachine.states[phase];
      if (phaseDefinition) {
        return `**Context**: ${phaseDefinition.description}`;
      }
    }
    
    // Fallback to default context for standard phases
    return this.getDefaultPhaseContext(phase);
  }

  /**
   * Get default phase context for standard phases
   */
  private getDefaultPhaseContext(phase: string): string {
     return '**Context**: Continue with current development activities. If you\'ve been doing this specific activity for a longer period, ask the user for guidance';
  }

  /**
   * Get phase-specific reminders and best practices based on state machine
   */
  private getPhaseReminders(phase: string): string {
    if (this.stateMachine) {
      const phaseDefinition = this.stateMachine.states[phase];
      if (phaseDefinition) {
        const capitalizedPhase = this.capitalizePhase(phase);
        return `**Remember**: \n- Focus on: ${phaseDefinition.description}\n- Update plan file with ${phase} progress\n- Mark completed tasks with [x]\n- Stay focused on current phase objectives`;
      }
    }
    
    // Fallback to default reminders for standard phases
    return this.getDefaultPhaseReminders(phase);
  }

  /**
   * Get default phase reminders for standard phases
   */
  private getDefaultPhaseReminders(phase: string): string {
    switch (phase) {
      case 'requirements':
        return '**Remember**: \n- Ask "what" not "how"\n- Break down complex requests into specific tasks\n- Clarify scope and constraints\n- Document acceptance criteria\n- Update plan file with gathered requirements';
      
      case 'design':
        return '**Remember**: \n- Build on established requirements\n- Consider scalability and maintainability\n- Document architectural decisions\n- Choose appropriate technologies\n- Update plan file with design decisions';
      
      case 'implementation':
        return '**Remember**: \n- Follow the established design\n- Write clean, well-documented code\n- Include error handling\n- Follow coding best practices\n- Update plan file with implementation progress';
      
      case 'qa':
        return '**Remember**: \n- Run syntax checking tools\n- Build the project to verify compilation\n- Execute linting tools for code style\n- Run tests to verify functionality\n- Review from security perspective\n- Review from performance perspective\n- Review from UX perspective\n- Review from maintainability perspective\n- Verify requirement compliance\n- Update plan file with QA progress';
      
      case 'testing':
        return '**Remember**: \n- Create comprehensive test plans\n- Test normal and edge cases\n- Validate user acceptance criteria\n- Document test results\n- Update plan file with testing progress';
      
      case 'complete':
        return '**Remember**: \n- Summarize what was accomplished\n- Finalize all documentation\n- Mark all tasks as complete\n- Prepare handoff documentation\n- Update plan file with completion status';
      
      default:
        return '**Remember**: \n- Keep the plan file updated\n- Mark completed tasks\n- Stay focused on current phase objectives';
    }
  }

  /**
   * Capitalize phase name for display
   */
  private capitalizePhase(phase: string): string {
    return phase.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
