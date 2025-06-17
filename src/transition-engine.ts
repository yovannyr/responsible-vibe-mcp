/**
 * Transition Engine
 * 
 * Manages the development state machine and determines appropriate stage transitions.
 * Analyzes conversation context and user input to make intelligent stage decisions.
 */

import { 
  type DevelopmentStage, 
  getTransitionInstructions, 
  getContinueStageInstructions,
  isModeledTransition 
} from './state-machine.js';

export interface TransitionContext {
  currentStage: DevelopmentStage;
  userInput?: string;
  context?: string;
  conversationSummary?: string;
  recentMessages?: Array<{ role: string; content: string }>;
}

export interface TransitionResult {
  newStage: DevelopmentStage;
  instructions: string;
  transitionReason: string;
  isModeled: boolean;
}

export class TransitionEngine {
  
  /**
   * Analyze context and determine appropriate stage transition
   */
  analyzeStageTransition(context: TransitionContext): TransitionResult {
    const { currentStage, userInput, context: additionalContext, conversationSummary } = context;

    // Analyze if we should transition to a new stage
    const suggestedStage = this.determineSuggestedStage(context);
    
    if (suggestedStage !== currentStage) {
      // Stage transition detected
      const transitionInfo = getTransitionInstructions(currentStage, suggestedStage);
      
      return {
        newStage: suggestedStage,
        instructions: transitionInfo.instructions,
        transitionReason: transitionInfo.transitionReason,
        isModeled: transitionInfo.isModeled
      };
    } else {
      // Continue in current stage
      const instructions = getContinueStageInstructions(currentStage);
      
      return {
        newStage: currentStage,
        instructions,
        transitionReason: `Continuing work in ${currentStage} stage`,
        isModeled: true
      };
    }
  }

  /**
   * Handle explicit stage transition request
   */
  handleExplicitTransition(
    currentStage: DevelopmentStage, 
    targetStage: DevelopmentStage, 
    reason?: string
  ): TransitionResult {
    const transitionInfo = getTransitionInstructions(currentStage, targetStage);
    
    return {
      newStage: targetStage,
      instructions: transitionInfo.instructions,
      transitionReason: reason || transitionInfo.transitionReason,
      isModeled: transitionInfo.isModeled
    };
  }

  /**
   * Determine suggested stage based on conversation context
   */
  private determineSuggestedStage(context: TransitionContext): DevelopmentStage {
    const { currentStage, userInput, context: additionalContext, conversationSummary } = context;

    // Combine all available context
    const fullContext = [
      userInput || '',
      additionalContext || '',
      conversationSummary || ''
    ].join(' ').toLowerCase();

    // Stage transition logic based on context analysis
    switch (currentStage) {
      case 'idle':
        return this.analyzeIdleStage(fullContext);
      
      case 'requirements':
        return this.analyzeRequirementsStage(fullContext);
      
      case 'design':
        return this.analyzeDesignStage(fullContext);
      
      case 'implementation':
        return this.analyzeImplementationStage(fullContext);
      
      case 'qa':
        return this.analyzeQAStage(fullContext);
      
      case 'testing':
        return this.analyzeTestingStage(fullContext);
      
      case 'complete':
        return this.analyzeCompleteStage(fullContext);
      
      default:
        return currentStage;
    }
  }

  private analyzeIdleStage(context: string): DevelopmentStage {
    // Look for new feature requests
    const featureKeywords = [
      'implement', 'build', 'create', 'add', 'develop', 'feature', 
      'need', 'want', 'requirement', 'functionality'
    ];
    
    if (featureKeywords.some(keyword => context.includes(keyword))) {
      return 'requirements';
    }
    
    return 'idle';
  }

  private analyzeRequirementsStage(context: string): DevelopmentStage {
    // Check for completion indicators
    const completionKeywords = [
      'requirements complete', 'ready to design', 'move to design',
      'start design', 'design phase', 'how to implement'
    ];
    
    if (completionKeywords.some(keyword => context.includes(keyword))) {
      return 'design';
    }

    // Check for abandonment
    if (context.includes('abandon') || context.includes('cancel') || context.includes('stop')) {
      return 'idle';
    }
    
    return 'requirements';
  }

  private analyzeDesignStage(context: string): DevelopmentStage {
    // Check for implementation readiness
    const implementationKeywords = [
      'design complete', 'ready to implement', 'start coding', 
      'begin implementation', 'build it', 'code it'
    ];
    
    if (implementationKeywords.some(keyword => context.includes(keyword))) {
      return 'implementation';
    }

    // Check for requirements issues
    const requirementsIssues = [
      'unclear requirements', 'requirements unclear', 'need more requirements',
      'requirements missing', 'what exactly'
    ];
    
    if (requirementsIssues.some(keyword => context.includes(keyword))) {
      return 'requirements';
    }

    // Check for abandonment
    if (context.includes('abandon') || context.includes('cancel') || context.includes('stop')) {
      return 'idle';
    }
    
    return 'design';
  }

  private analyzeImplementationStage(context: string): DevelopmentStage {
    // Check for QA readiness
    const qaKeywords = [
      'implementation complete', 'ready for review', 'code review',
      'quality check', 'qa', 'review code', 'check quality'
    ];
    
    if (qaKeywords.some(keyword => context.includes(keyword))) {
      return 'qa';
    }

    // Check for design issues
    const designIssues = [
      'design problem', 'architecture issue', 'design flaw',
      'need to redesign', 'design doesn\'t work'
    ];
    
    if (designIssues.some(keyword => context.includes(keyword))) {
      return 'design';
    }

    // Check for abandonment
    if (context.includes('abandon') || context.includes('cancel') || context.includes('stop')) {
      return 'idle';
    }
    
    return 'implementation';
  }

  private analyzeQAStage(context: string): DevelopmentStage {
    // Check for testing readiness
    const testingKeywords = [
      'qa complete', 'ready for testing', 'start testing',
      'test it', 'run tests', 'testing phase'
    ];
    
    if (testingKeywords.some(keyword => context.includes(keyword))) {
      return 'testing';
    }

    // Check for implementation issues
    const implementationIssues = [
      'bugs found', 'implementation issue', 'code problem',
      'need to fix', 'implementation bug'
    ];
    
    if (implementationIssues.some(keyword => context.includes(keyword))) {
      return 'implementation';
    }

    // Check for abandonment
    if (context.includes('abandon') || context.includes('cancel') || context.includes('stop')) {
      return 'idle';
    }
    
    return 'qa';
  }

  private analyzeTestingStage(context: string): DevelopmentStage {
    // Check for completion
    const completionKeywords = [
      'testing complete', 'tests pass', 'all tests passing',
      'feature complete', 'ready to deliver', 'done'
    ];
    
    if (completionKeywords.some(keyword => context.includes(keyword))) {
      return 'complete';
    }

    // Check for QA issues
    const qaIssues = [
      'quality issue', 'qa problem', 'documentation missing',
      'quality check needed', 'back to qa'
    ];
    
    if (qaIssues.some(keyword => context.includes(keyword))) {
      return 'qa';
    }

    // Check for abandonment
    if (context.includes('abandon') || context.includes('cancel') || context.includes('stop')) {
      return 'idle';
    }
    
    return 'testing';
  }

  private analyzeCompleteStage(context: string): DevelopmentStage {
    // Check for new feature requests
    const newFeatureKeywords = [
      'new feature', 'next feature', 'implement', 'build next',
      'another feature', 'add more'
    ];
    
    if (newFeatureKeywords.some(keyword => context.includes(keyword))) {
      return 'requirements';
    }

    // Check for delivery completion
    const deliveryKeywords = [
      'delivered', 'deployment complete', 'feature delivered',
      'done with this', 'finished'
    ];
    
    if (deliveryKeywords.some(keyword => context.includes(keyword))) {
      return 'idle';
    }
    
    return 'complete';
  }
}
