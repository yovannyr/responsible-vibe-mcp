/**
 * Database module for persistent state storage
 * 
 * Manages SQLite database for conversation state persistence.
 * Stores minimal state information to survive server restarts.
 */

import sqlite3 from 'sqlite3';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import { homedir } from 'os';
import { join } from 'path';
import type { DevelopmentStage } from './state-machine.js';

export interface ConversationState {
  conversationId: string;
  projectPath: string;
  gitBranch: string;
  currentStage: DevelopmentStage;
  planFilePath: string;
  createdAt: string;
  updatedAt: string;
}

export class Database {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor() {
    // Store database in user's home directory
    const dbDir = join(homedir(), '.vibe-feature-mcp');
    this.dbPath = join(dbDir, 'db.sqlite');
  }

  /**
   * Initialize database connection and create tables
   */
  async initialize(): Promise<void> {
    // Ensure directory exists
    await mkdir(dirname(this.dbPath), { recursive: true });

    // Create database connection
    this.db = new sqlite3.Database(this.dbPath);
    
    // Create conversation_states table
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS conversation_states (
        conversation_id TEXT PRIMARY KEY,
        project_path TEXT NOT NULL,
        git_branch TEXT NOT NULL,
        current_stage TEXT NOT NULL,
        plan_file_path TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Create index for efficient lookups
    await this.runQuery(`
      CREATE INDEX IF NOT EXISTS idx_project_branch 
      ON conversation_states(project_path, git_branch)
    `);
  }

  /**
   * Helper method to run queries with promises
   */
  private runQuery(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Helper method to get single row with promises
   */
  private getRow(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Get conversation state by ID
   */
  async getConversationState(conversationId: string): Promise<ConversationState | null> {
    const row = await this.getRow(
      'SELECT * FROM conversation_states WHERE conversation_id = ?',
      [conversationId]
    );

    if (!row) {
      return null;
    }

    return {
      conversationId: row.conversation_id,
      projectPath: row.project_path,
      gitBranch: row.git_branch,
      currentStage: row.current_stage as DevelopmentStage,
      planFilePath: row.plan_file_path,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Save or update conversation state
   */
  async saveConversationState(state: ConversationState): Promise<void> {
    await this.runQuery(
      `INSERT OR REPLACE INTO conversation_states (
        conversation_id, project_path, git_branch, current_stage, 
        plan_file_path, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        state.conversationId,
        state.projectPath,
        state.gitBranch,
        state.currentStage,
        state.planFilePath,
        state.createdAt,
        state.updatedAt
      ]
    );
  }

  /**
   * Find conversation by project path and git branch
   */
  async findConversationByProject(projectPath: string, gitBranch: string): Promise<ConversationState | null> {
    const row = await this.getRow(
      'SELECT * FROM conversation_states WHERE project_path = ? AND git_branch = ?',
      [projectPath, gitBranch]
    );

    if (!row) {
      return null;
    }

    return {
      conversationId: row.conversation_id,
      projectPath: row.project_path,
      gitBranch: row.git_branch,
      currentStage: row.current_stage as DevelopmentStage,
      planFilePath: row.plan_file_path,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Delete conversation state
   */
  async deleteConversationState(conversationId: string): Promise<void> {
    await this.runQuery(
      'DELETE FROM conversation_states WHERE conversation_id = ?',
      [conversationId]
    );
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.db = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}
