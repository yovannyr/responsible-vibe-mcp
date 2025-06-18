/**
 * Mock implementation of Database class for testing
 */

import { vi } from 'vitest';
import type { ConversationState } from '../../src/database.js';

export class MockDatabase {
  private conversations = new Map<string, ConversationState>();
  
  initialize = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
  
  createConversation = vi.fn().mockImplementation(async (state: Omit<ConversationState, 'createdAt' | 'updatedAt'>) => {
    const fullState: ConversationState = {
      ...state,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.conversations.set(state.conversationId, fullState);
    return fullState;
  });
  
  findConversationByProject = vi.fn().mockImplementation(async (projectPath: string, gitBranch: string) => {
    const conversationId = this.generateConversationId(projectPath, gitBranch);
    return this.conversations.get(conversationId) || null;
  });
  
  updateConversationPhase = vi.fn().mockImplementation(async (conversationId: string, phase: string) => {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.currentPhase = phase as any;
      conversation.updatedAt = new Date().toISOString();
      this.conversations.set(conversationId, conversation);
      return conversation;
    }
    return null;
  });
  
  private generateConversationId(projectPath: string, gitBranch: string): string {
    return `${projectPath}#${gitBranch}`.replace(/[^a-zA-Z0-9]/g, '-');
  }
  
  // Test utilities
  clearConversations() {
    this.conversations.clear();
  }
  
  getConversations() {
    return Array.from(this.conversations.values());
  }
}
