/**
 * Database module for persistent state storage
 * 
 * Manages SQLite database for conversation state persistence.
 * Stores minimal state information to survive server restarts.
 * Also stores interaction logs for auditing and debugging.
 */

import sqlite3 from 'sqlite3';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import { homedir } from 'os';
import { join } from 'path';
import { createLogger } from './logger.js';
import type { DevelopmentPhase } from './state-machine.js';
import type { ConversationState, InteractionLog } from './types.js';

const logger = createLogger('Database');

export class Database {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor(projectPath: string) {
    // Store database in .vibe subfolder of the project
    const vibeDir = join(projectPath, '.vibe');
    this.dbPath = join(vibeDir, 'conversation-state.sqlite');
    logger.debug('Database path configured', { projectPath, dbPath: this.dbPath });
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
      
      // Create interaction_logs table
      await this.runQuery(`
        CREATE TABLE IF NOT EXISTS interaction_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id TEXT NOT NULL,
          tool_name TEXT NOT NULL,
          input_params TEXT NOT NULL,
          response_data TEXT NOT NULL,
          current_phase TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          FOREIGN KEY (conversation_id) REFERENCES conversation_states(conversation_id)
        )
      `);

      // Create index for efficient lookups of interaction logs
      await this.runQuery(`
        CREATE INDEX IF NOT EXISTS idx_interaction_conversation_id 
        ON interaction_logs(conversation_id)
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
   * Helper method to get multiple rows with promises
   */
  private getAllRows(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
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
   * Log an interaction to the database
   */
  async logInteraction(log: InteractionLog): Promise<void> {
    logger.debug('Logging interaction to database', { 
      conversationId: log.conversationId,
      toolName: log.toolName
    });
    
    try {
      await this.runQuery(
        `INSERT INTO interaction_logs (
          conversation_id, tool_name, input_params, response_data,
          current_phase, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          log.conversationId,
          log.toolName,
          log.inputParams,
          log.responseData,
          log.currentPhase,
          log.timestamp
        ]
      );
      
      logger.debug('Interaction logged successfully', { 
        conversationId: log.conversationId,
        toolName: log.toolName,
        timestamp: log.timestamp
      });
    } catch (error) {
      logger.error('Failed to log interaction', error as Error, { 
        conversationId: log.conversationId 
      });
      throw error;
    }
  }

  /**
   * Get all interactions for a specific conversation
   */
  async getInteractionsByConversationId(conversationId: string): Promise<InteractionLog[]> {
    logger.debug('Getting interactions by conversation ID', { conversationId });
    
    try {
      const rows = await this.getAllRows(
        'SELECT * FROM interaction_logs WHERE conversation_id = ? ORDER BY timestamp ASC',
        [conversationId]
      );

      const logs: InteractionLog[] = rows.map(row => ({
        id: row.id,
        conversationId: row.conversation_id,
        toolName: row.tool_name,
        inputParams: row.input_params,
        responseData: row.response_data,
        currentPhase: row.current_phase as DevelopmentPhase,
        timestamp: row.timestamp
      }));
      
      logger.debug('Retrieved interaction logs', { 
        conversationId,
        count: logs.length
      });
      
      return logs;
    } catch (error) {
      logger.error('Failed to get interaction logs', error as Error, { conversationId });
      throw error;
    }
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
