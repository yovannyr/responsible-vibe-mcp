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
import { Database, type ConversationState } from './database.js';
import type { DevelopmentStage } from './state-machine.js';

export interface ConversationContext {
  conversationId: string;
  projectPath: string;
  gitBranch: string;
  currentStage: DevelopmentStage;
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
    const projectPath = this.detectProjectPath();
    const gitBranch = this.detectGitBranch(projectPath);
    
    // Try to find existing conversation
    let state = await this.database.findConversationByProject(projectPath, gitBranch);
    
    if (!state) {
      // Create new conversation
      state = await this.createNewConversation(projectPath, gitBranch);
    }

    return {
      conversationId: state.conversationId,
      projectPath: state.projectPath,
      gitBranch: state.gitBranch,
      currentStage: state.currentStage,
      planFilePath: state.planFilePath
    };
  }

  /**
   * Update conversation state
   */
  async updateConversationState(
    conversationId: string, 
    updates: Partial<Pick<ConversationContext, 'currentStage' | 'planFilePath'>>
  ): Promise<void> {
    const existingState = await this.database.getConversationState(conversationId);
    
    if (!existingState) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const updatedState: ConversationState = {
      ...existingState,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.database.saveConversationState(updatedState);
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
      currentStage: 'idle',
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
