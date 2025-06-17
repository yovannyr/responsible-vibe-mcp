/**
 * Mock implementation of filesystem operations for testing
 */

import { vi } from 'vitest';

export class MockFileSystem {
  private files = new Map<string, string>();
  private currentDirectory = '/test/project';
  private gitBranch = 'main';
  
  // File operations
  readFile = vi.fn().mockImplementation(async (path: string) => {
    if (this.files.has(path)) {
      return this.files.get(path);
    }
    throw new Error(`File not found: ${path}`);
  });
  
  writeFile = vi.fn().mockImplementation(async (path: string, content: string) => {
    this.files.set(path, content);
  });
  
  existsSync = vi.fn().mockImplementation((path: string) => {
    return this.files.has(path);
  });
  
  // Directory operations
  getCurrentDirectory = vi.fn().mockImplementation(() => {
    return this.currentDirectory;
  });
  
  // Git operations
  getGitBranch = vi.fn().mockImplementation(() => {
    return this.gitBranch;
  });
  
  // Test utilities
  setCurrentDirectory(path: string) {
    this.currentDirectory = path;
  }
  
  setGitBranch(branch: string) {
    this.gitBranch = branch;
  }
  
  setFileContent(path: string, content: string) {
    this.files.set(path, content);
  }
  
  getFileContent(path: string) {
    return this.files.get(path);
  }
  
  clearFiles() {
    this.files.clear();
  }
  
  getAllFiles() {
    return Object.fromEntries(this.files);
  }
}
