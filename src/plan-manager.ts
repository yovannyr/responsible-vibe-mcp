/**
 * Plan Manager
 * 
 * Handles the creation, updating, and maintenance of project development plan files.
 * Manages markdown plan files that serve as long-term project memory.
 * Supports custom state machine definitions for dynamic plan file generation.
 */

import { writeFile, readFile, access } from 'fs/promises';
import { dirname } from 'path';
import { mkdir } from 'fs/promises';
import { createLogger } from './logger.js';
import type { DevelopmentPhase } from './state-machine.js';
import type { YamlStateMachine } from './state-machine-types.js';

const logger = createLogger('PlanManager');

export interface PlanFileInfo {
  path: string;
  exists: boolean;
  content?: string;
}

export class PlanManager {
  private stateMachine: YamlStateMachine | null = null;
  
  /**
   * Set the state machine definition for dynamic plan generation
   */
  setStateMachine(stateMachine: YamlStateMachine): void {
    this.stateMachine = stateMachine;
    logger.debug('State machine set for plan manager', { 
      name: stateMachine.name,
      phases: Object.keys(stateMachine.states)
    });
  }
  
  /**
   * Get plan file information
   */
  async getPlanFileInfo(planFilePath: string): Promise<PlanFileInfo> {
    try {
      await access(planFilePath);
      const content = await readFile(planFilePath, 'utf-8');
      return {
        path: planFilePath,
        exists: true,
        content
      };
    } catch (error) {
      return {
        path: planFilePath,
        exists: false
      };
    }
  }

  /**
   * Create initial plan file if it doesn't exist
   */
  async ensurePlanFile(planFilePath: string, projectPath: string, gitBranch: string): Promise<void> {
    logger.debug('Ensuring plan file exists', { planFilePath, projectPath, gitBranch });
    
    const planInfo = await this.getPlanFileInfo(planFilePath);
    
    if (!planInfo.exists) {
      logger.info('Plan file not found, creating initial plan', { planFilePath });
      await this.createInitialPlanFile(planFilePath, projectPath, gitBranch);
      logger.info('Initial plan file created successfully', { planFilePath });
    } else {
      logger.debug('Plan file already exists', { planFilePath });
    }
  }

  /**
   * Create initial plan file with template content
   */
  private async createInitialPlanFile(planFilePath: string, projectPath: string, gitBranch: string): Promise<void> {
    logger.debug('Creating initial plan file', { planFilePath });
    
    try {
      // Ensure directory exists
      await mkdir(dirname(planFilePath), { recursive: true });
      logger.debug('Plan file directory ensured', { directory: dirname(planFilePath) });

      const projectName = projectPath.split('/').pop() || 'Unknown Project';
      const branchInfo = gitBranch !== 'no-git' ? ` (${gitBranch} branch)` : '';
      
      const initialContent = this.generateInitialPlanContent(projectName, branchInfo);
      
      await writeFile(planFilePath, initialContent, 'utf-8');
      logger.info('Initial plan file written successfully', { 
        planFilePath,
        contentLength: initialContent.length,
        projectName
      });
    } catch (error) {
      logger.error('Failed to create initial plan file', error as Error, { planFilePath });
      throw error;
    }
  }

  /**
   * Generate initial plan file content based on state machine definition
   */
  private generateInitialPlanContent(projectName: string, branchInfo: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (!this.stateMachine) {
      // Fallback to default structure if no state machine is set
      return this.generateDefaultPlanContent(projectName, branchInfo, timestamp);
    }
    
    const phases = Object.keys(this.stateMachine.states);
    const initialPhase = this.stateMachine.initial_state;
    const initialPhaseDescription = this.stateMachine.states[initialPhase]?.description || initialPhase;
    
    let content = `# Development Plan: ${projectName}${branchInfo}

*Generated on ${timestamp} by Vibe Feature MCP*
*Workflow: ${this.stateMachine.name}*

## Project Overview

**Status**: ${this.capitalizePhase(initialPhase)} Phase  
**Current Phase**: ${this.capitalizePhase(initialPhase)}  
**Workflow**: ${this.stateMachine.description}

### Feature Goals
- [ ] *To be defined based on ${initialPhase} phase*

### Scope
- [ ] *To be defined during ${initialPhase} phase*

## Current Status

**Phase**: ${this.capitalizePhase(initialPhase)}  
**Progress**: Starting development with ${initialPhaseDescription}

`;

    // Generate sections for each phase
    phases.forEach((phase, index) => {
      const phaseDescription = this.stateMachine!.states[phase].description;
      const isCurrentPhase = phase === initialPhase;
      
      content += `## ${this.capitalizePhase(phase)}

*${phaseDescription}*

### Tasks
${isCurrentPhase ? '- [ ] *Tasks will be added as they are identified*' : '- [ ] *To be added after previous phases completion*'}

### Completed
${isCurrentPhase ? '- [x] Created development plan file' : '*None yet*'}

`;
    });

    content += `## Decision Log

### Technical Decisions
*Technical decisions will be documented here as they are made*

### Design Decisions
*Design decisions will be documented here as they are made*

## Notes

*Additional notes and observations will be added here throughout development*

---

*This plan is continuously updated by the LLM as development progresses. Each phase's tasks and completed items are maintained to track progress and provide context for future development sessions.*
`;

    return content;
  }

  /**
   * Generate default plan content when no state machine is available
   */
  private generateDefaultPlanContent(projectName: string, branchInfo: string, timestamp: string): string {
    
    return `# Development Plan: ${projectName}${branchInfo}

*Generated on ${timestamp} by Vibe Feature MCP*

## Project Overview

**Status**: Planning Phase  
**Current Phase**: Requirements Analysis  

### Feature Goals
- [ ] *To be defined based on requirements gathering*

### Scope
- [ ] *To be defined during requirements phase*

## Current Status

**Phase**: Requirements Analysis  
**Progress**: Starting development planning

## Requirements Analysis

### Tasks
- [ ] Gather user requirements
- [ ] Define feature scope
- [ ] Identify constraints and dependencies
- [ ] Document acceptance criteria

### Completed
- [x] Created development plan file

## Design

### Tasks
- [ ] *To be added after requirements completion*

### Completed
*None yet*

## Implementation

### Tasks
- [ ] *To be added after design completion*

### Completed
*None yet*

## Quality Assurance

### Tasks
- [ ] *To be added after implementation completion*

### Completed
*None yet*

## Testing

### Tasks
- [ ] *To be added after QA completion*

### Completed
*None yet*

## Decision Log

### Technical Decisions
*Technical decisions will be documented here as they are made*

### Design Decisions
*Design decisions will be documented here as they are made*

## Notes

*Additional notes and observations will be added here throughout development*

---

*This plan is continuously updated by the LLM as development progresses. Each phase's tasks and completed items are maintained to track progress and provide context for future development sessions.*
`;
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
   * Update plan file with new content (this is typically done by the LLM)
   */
  async updatePlanFile(planFilePath: string, content: string): Promise<void> {
    // Ensure directory exists
    await mkdir(dirname(planFilePath), { recursive: true });
    
    await writeFile(planFilePath, content, 'utf-8');
  }

  /**
   * Get plan file content for LLM context
   */
  async getPlanFileContent(planFilePath: string): Promise<string> {
    const planInfo = await this.getPlanFileInfo(planFilePath);
    
    if (!planInfo.exists) {
      return 'Plan file does not exist yet. It will be created when the LLM updates it.';
    }
    
    return planInfo.content || '';
  }

  /**
   * Generate phase-specific plan file guidance based on state machine
   */
  generatePlanFileGuidance(phase: string): string {
    if (!this.stateMachine) {
      // Fallback to default guidance
      return this.generateDefaultPlanFileGuidance(phase);
    }
    
    const phaseDefinition = this.stateMachine.states[phase];
    if (!phaseDefinition) {
      logger.warn('Unknown phase for plan file guidance', { phase });
      return `Update the ${this.capitalizePhase(phase)} section with current progress and mark completed tasks.`;
    }
    
    const phaseDescription = phaseDefinition.description;
    const capitalizedPhase = this.capitalizePhase(phase);
    
    return `Update the ${capitalizedPhase} section with progress related to: ${phaseDescription}. Mark completed tasks with [x] and add new tasks as they are identified.`;
  }

  /**
   * Generate default plan file guidance for standard phases
   */
  private generateDefaultPlanFileGuidance(phase: string): string {
    switch (phase) {
      case 'requirements':
        return 'Update the Requirements Analysis section with gathered requirements, scope definition, and completed tasks. Mark tasks as complete with [x].';
      
      case 'design':
        return 'Update the Design section with technical decisions, architecture choices, and design progress. Add completed requirements tasks to the Completed section.';
      
      case 'implementation':
        return 'Update the Implementation section with coding progress, completed features, and implementation tasks. Mark completed design tasks.';
      
      case 'qa':
        return 'Update the Quality Assurance section with code review progress, quality checks, and QA tasks. Mark completed implementation tasks.';
      
      case 'testing':
        return 'Update the Testing section with test progress, test results, and testing tasks. Mark completed QA tasks.';
      
      case 'complete':
        return 'Update the plan to reflect completion status. Mark all testing tasks as complete and add final notes.';
      
      default:
        return 'Update the plan file with current progress and mark completed tasks.';
    }
  }
}
