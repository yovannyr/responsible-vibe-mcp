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
import { createLogger } from './logger.js';
import type { DevelopmentPhase } from './state-machine.js';

const logger = createLogger('Database');

export interface ConversationState {
  conversationId: string;
  projectPath: string;
  gitBranch: string;
  currentPhase: DevelopmentPhase;
  planFilePath: string;
  createdAt: string;
  updatedAt: string;
}

export class Database {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor() {
    // Store database in user's home directory, or use test directory if specified
    const dbDir = process.env.VIBE_FEATURE_DB_DIR || join(homedir(), '.vibe-feature-mcp');
    this.dbPath = join(dbDir, 'db.sqlite');
    logger.debug('Database path configured', { dbPath: this.dbPath });
  }

  /**
   * Initialize database connection and create tables
   */
  async initialize(): Promise<void> {
    logger.debug('Initializing database', { dbPath: this.dbPath });
    
    try {
      // Ensure directory exists
      await mkdir(dirname(this.dbPath), { recursive: true });
      logger.debug('Database directory ensured', { directory: dirname(this.dbPath) });

      // Create database connection
      this.db = new sqlite3.Database(this.dbPath);
      logger.debug('Database connection established');
      
      // Create conversation_states table
      await this.runQuery(`
        CREATE TABLE IF NOT EXISTS conversation_states (
          conversation_id TEXT PRIMARY KEY,
          project_path TEXT NOT NULL,
          git_branch TEXT NOT NULL,
          current_phase TEXT NOT NULL,
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
      
      logger.info('Database initialized successfully', { dbPath: this.dbPath });
    } catch (error) {
      logger.error('Failed to initialize database', error as Error, { dbPath: this.dbPath });
      throw error;
    }
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
    logger.debug('Retrieving conversation state', { conversationId });
    
    try {
      const row = await this.getRow(
        'SELECT * FROM conversation_states WHERE conversation_id = ?',
        [conversationId]
      );

      if (!row) {
        logger.debug('Conversation state not found', { conversationId });
        return null;
      }

      const state = {
        conversationId: row.conversation_id,
        projectPath: row.project_path,
        gitBranch: row.git_branch,
        currentPhase: row.current_phase as DevelopmentPhase,
        planFilePath: row.plan_file_path,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      logger.debug('Conversation state retrieved', { 
        conversationId,
        currentPhase: state.currentPhase,
        projectPath: state.projectPath
      });
      
      return state;
    } catch (error) {
      logger.error('Failed to retrieve conversation state', error as Error, { conversationId });
      throw error;
    }
  }

  /**
   * Save or update conversation state
   */
  async saveConversationState(state: ConversationState): Promise<void> {
    logger.debug('Saving conversation state', { 
      conversationId: state.conversationId,
      currentPhase: state.currentPhase,
      projectPath: state.projectPath
    });
    
    try {
      await this.runQuery(
        `INSERT OR REPLACE INTO conversation_states (
          conversation_id, project_path, git_branch, current_phase,
          plan_file_path, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          state.conversationId,
          state.projectPath,
          state.gitBranch,
          state.currentPhase,
          state.planFilePath,
          state.createdAt,
          state.updatedAt
        ]
      );
      
      logger.info('Conversation state saved successfully', { 
        conversationId: state.conversationId,
        currentPhase: state.currentPhase
      });
    } catch (error) {
      logger.error('Failed to save conversation state', error as Error, { 
        conversationId: state.conversationId 
      });
      throw error;
    }
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
      currentPhase: row.current_phase as DevelopmentPhase,
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
    logger.debug('Closing database connection');
    
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            logger.error('Failed to close database connection', err);
            reject(err);
          } else {
            this.db = null;
            logger.info('Database connection closed successfully');
            resolve();
          }
        });
      } else {
        logger.debug('Database connection already closed');
        resolve();
      }
    });
  }
}
