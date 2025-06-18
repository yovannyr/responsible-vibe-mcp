/**
 * Common types used across the application
 */

import type { DevelopmentPhase } from './state-machine.js';

/**
 * Interface for interaction log entries
 */
export interface InteractionLog {
  id?: number;
  conversationId: string;
  toolName: string;
  inputParams: string;
  responseData: string;
  currentPhase: DevelopmentPhase;
  timestamp: string;
}

/**
 * Interface for conversation state
 */
export interface ConversationState {
  conversationId: string;
  projectPath: string;
  gitBranch: string;
  currentPhase: DevelopmentPhase;
  planFilePath: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for conversation context
 */
export interface ConversationContext {
  conversationId: string;
  projectPath: string;
  gitBranch: string;
  currentPhase: DevelopmentPhase;
  planFilePath: string;
}
