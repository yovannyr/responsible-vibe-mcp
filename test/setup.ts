/**
 * Test setup file for Vitest
 * Configures global test environment and utilities
 */

import { vi } from 'vitest';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdirSync, rmSync, existsSync } from 'fs';

// Global test configuration
const TEST_DB_DIR = join(tmpdir(), 'vibe-feature-mcp-test');

// Setup before all tests
beforeAll(() => {
  // Create test database directory
  if (!existsSync(TEST_DB_DIR)) {
    mkdirSync(TEST_DB_DIR, { recursive: true });
  }
});

// Cleanup after all tests
afterAll(() => {
  // Clean up test database directory
  if (existsSync(TEST_DB_DIR)) {
    rmSync(TEST_DB_DIR, { recursive: true, force: true });
  }
});

// Setup before each test
beforeEach(() => {
  // Clear all mocks
  vi.clearAllMocks();
});

// Export test utilities
export const TEST_CONFIG = {
  DB_DIR: TEST_DB_DIR,
  DB_PATH: join(TEST_DB_DIR, 'test.sqlite'),
  PROJECT_PATH: '/test/project',
  GIT_BRANCH: 'main'
};
