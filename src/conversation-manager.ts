/**
 * Conversation Manager
 * 
 * Handles conversation identification, state persistence, and coordination
 * between components. Generates unique conversation identifiers from 
 * project path + git branch combination.
 */

import { execSync } from 'child_process';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { createLogger } from './logger.js';
import { Database, type ConversationState } from './database.js';
import type { DevelopmentPhase } from './state-machine.js';

const logger = createLogger('ConversationManager');

export interface ConversationContext {
  conversationId: string;
  projectPath: string;
  gitBranch: string;
  currentPhase: DevelopmentPhase;
  planFilePath: string;
}

export class ConversationManager {
  private database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  /**
   * Get or create conversation context for current project
   */
  async getConversationContext(): Promise<ConversationContext> {
    logger.debug('Getting conversation context');
    
    const projectPath = this.detectProjectPath();
    const gitBranch = this.detectGitBranch(projectPath);
    
    logger.debug('Project context detected', { projectPath, gitBranch });
    
    // Try to find existing conversation
    let state = await this.database.findConversationByProject(projectPath, gitBranch);
    
    if (!state) {
      logger.debug('No existing conversation found, creating new one');
      // Create new conversation
      state = await this.createNewConversation(projectPath, gitBranch);
      logger.info('New conversation created', { 
        conversationId: state.conversationId,
        projectPath,
        gitBranch,
        currentPhase: state.currentPhase
      });
    } else {
      logger.debug('Existing conversation found', { 
        conversationId: state.conversationId,
        currentPhase: state.currentPhase
      });
    }

    return {
      conversationId: state.conversationId,
      projectPath: state.projectPath,
      gitBranch: state.gitBranch,
      currentPhase: state.currentPhase,
      planFilePath: state.planFilePath
    };
  }

  /**
   * Update conversation state
   */
  async updateConversationState(
    conversationId: string, 
    updates: Partial<Pick<ConversationContext, 'currentPhase' | 'planFilePath'>>
  ): Promise<void> {
    logger.debug('Updating conversation state', { conversationId, updates });
    
    const existingState = await this.database.getConversationState(conversationId);
    
    if (!existingState) {
      logger.warn('Attempted to update non-existent conversation', { conversationId });
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Only include defined values in the update
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    const updatedState: ConversationState = {
      ...existingState,
      ...filteredUpdates,
      updatedAt: new Date().toISOString()
    };

    await this.database.saveConversationState(updatedState);
    
    logger.info('Conversation state updated', { 
      conversationId,
      updates: filteredUpdates,
      previousPhase: existingState.currentPhase,
      newPhase: updatedState.currentPhase
    });
  }

  /**
   * Detect current project path (absolute path to current working directory)
   */
  private detectProjectPath(): string {
    return resolve(process.cwd());
  }

  /**
   * Detect current git branch
   */
  private detectGitBranch(projectPath: string): string {
    try {
      // Check if we're in a git repository
      if (!existsSync(`${projectPath}/.git`)) {
        return 'no-git';
      }

      // Get current branch name
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: projectPath,
        encoding: 'utf8'
      }).trim();

      return branch || 'unknown';
    } catch (error) {
      // If git command fails, return fallback
      return 'no-git';
    }
  }

  /**
   * Create new conversation state
   */
  private async createNewConversation(projectPath: string, gitBranch: string): Promise<ConversationState> {
    const conversationId = this.generateConversationId(projectPath, gitBranch);
    const planFilePath = this.generatePlanFilePath(projectPath, gitBranch);
    const now = new Date().toISOString();

    const state: ConversationState = {
      conversationId,
      projectPath,
      gitBranch,
      currentPhase: 'idle',
      planFilePath,
      createdAt: now,
      updatedAt: now
    };

    await this.database.saveConversationState(state);
    return state;
  }

  /**
   * Generate unique conversation ID from project path and git branch
   */
  private generateConversationId(projectPath: string, gitBranch: string): string {
    // Create a hash-like identifier from project path + branch
    const combined = `${projectPath}:${gitBranch}`;
    
    // Simple hash function for consistent IDs
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to positive hex string
    const hashStr = Math.abs(hash).toString(16);
    
    // Include readable parts for debugging
    const projectName = projectPath.split('/').pop() || 'unknown';
    
    return `${projectName}-${gitBranch}-${hashStr}`;
  }

  /**
   * Generate plan file path for the project
   */
  private generatePlanFilePath(projectPath: string, gitBranch: string): string {
    // For main/master branches, use simple name
    if (gitBranch === 'main' || gitBranch === 'master' || gitBranch === 'no-git') {
      return `${projectPath}/development-plan.md`;
    }
    
    // For feature branches, include branch name
    const safeBranchName = gitBranch.replace(/[^a-zA-Z0-9-_]/g, '-');
    return `${projectPath}/development-plan-${safeBranchName}.md`;
  }
}
