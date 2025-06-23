# Development Plan: vibe-feature (restart branch)

*Generated on 2025-06-23 by Vibe Feature MCP*
*Workflow: Explore-Plan-Code-Commit Workflow*

## Project Overview

**Status**: Explore Phase  
**Current Phase**: Explore  
**Workflow**: A comprehensive development workflow based on Anthropic's best practices: Explore, Plan, Code, Commit based on https://www.anthropic.com/engineering/claude-code-best-practices

### Feature Goals
- [x] Add a `reset_development` tool to the responsible-vibe MCP server
- [x] Allow users to reset conversation state and start fresh
- [x] Provide options for partial vs complete reset
- [x] Maintain data safety with confirmation prompts

### Scope
- [x] New MCP tool: `reset_development`
- [x] Database methods for state cleanup
- [x] Plan file management for reset scenarios
- [x] Comprehensive error handling and logging
- [x] User confirmation and safety measures

## Current Status

**Phase**: Explore  
**Progress**: Starting development with Research and exploration phase - understanding the problem space

### Current Phase Tasks
- [ ] *Tasks will be added as they are identified*

### Completed
- [x] Created development plan file

## Explore

*Research and exploration phase - understanding the problem space*

### Tasks
- [x] Analyze existing codebase structure and state management
- [x] Identify key components: ConversationManager, Database, PlanManager
- [x] Find existing state management methods in Database class
- [x] Understand current tool structure in server.ts
- [x] Research state storage (SQLite database + plan files)
- [ ] Design reset functionality requirements and approach

### Completed
- [x] Found existing `deleteConversationState` method in Database class
- [x] Discovered state is stored in SQLite database with conversation_states and interaction_logs tables
- [x] Confirmed plan files are stored in `.vibe` directory as markdown files
- [x] Identified existing tools: whats_next, proceed_to_phase, start_development, resume_workflow

## Plan

*Planning phase - creating a detailed implementation strategy*

### Tasks
- [x] Define reset functionality requirements
- [x] Design reset tool API and parameters
- [x] Plan database cleanup methods
- [x] Design plan file handling strategy
- [x] Consider edge cases and error scenarios
- [x] Plan user confirmation and safety measures
- [x] Create detailed implementation steps
- [x] Update design to use hybrid approach per user preference
- [x] Design soft-delete for interaction logs (audit trail)
- [x] Design hard-delete for conversation state and plan files (clean slate)
- [x] Remove scope parameter - always do complete reset

### Implementation Steps

#### Step 1: Extend Database Schema
- Add `is_reset` and `reset_at` columns to `interaction_logs` table only
- Create database migration for existing interaction logs

#### Step 2: Extend Database Class
- Add `softDeleteInteractionLogs(conversationId, reason)` method
- Add methods to query active vs all interaction logs
- Use existing `deleteConversationState` method for hard deletion
- Add comprehensive error handling and logging

#### Step 3: Extend PlanManager Class  
- Add `deletePlanFile(planFilePath: string)` method
- Add file existence verification and error handling
- Handle file system permissions and errors gracefully

#### Step 4: Extend ConversationManager Class
- Add `resetConversation(confirm, reason)` method
- Add parameter validation logic (just confirm boolean)
- Orchestrate hybrid reset operations across components
- Handle cleanup verification

#### Step 5: Add Reset Tool to Server
- Register `reset_development` tool in server.ts
- Implement tool handler with parameter validation
- Add comprehensive error handling and user feedback
- Ensure proper sequencing of hard/soft deletes

#### Step 6: Update Existing Query Methods
- Modify interaction log queries to exclude soft-deleted logs by default
- Add explicit methods to include reset logs when needed for audit

#### Step 7: Add Tests
- Unit tests for soft delete interaction log methods
- Unit tests for plan file deletion
- Integration tests for hybrid reset tool
- Edge case testing (non-existent files, permission errors)

#### Step 8: Update Documentation
- Add reset tool to README.md
- Document hybrid reset approach and audit benefits
- Add usage examples and explain reset history tracking

### Completed
- [x] **Reset Tool Design**: `reset_development` tool with simple confirm parameter
- [x] **Hybrid Strategy**: Hard delete conversation state/plan file, soft delete interaction logs
- [x] **Database Schema**: Add soft delete columns to interaction_logs table only
- [x] **Safety Measures**: Require explicit confirmation, provide detailed feedback
- [x] **Audit Trail**: Maintain reset history through soft-deleted interaction logs
- [x] **Error Handling**: Comprehensive error handling with rollback capabilities

### Reset Functionality Design

#### Tool: `reset_development`
**Purpose**: Reset conversation state and development progress

**Parameters**:
- `confirm` (boolean, required): Must be true to execute reset
- `reason` (string, optional): Reason for reset (for logging)

**Returns**:
- `success` (boolean): Whether reset was successful
- `reset_items` (array): List of items that were deleted
- `conversation_id` (string): The conversation that was reset
- `message` (string): Human-readable result message

**Behavior**: 
- **Hard deletes** current conversation state from database (fresh start)
- **Soft deletes** interaction logs (marks as reset with timestamp for audit trail)
- **Hard deletes** the plan file for the current conversation (clean slate)
- Provides clean slate for fresh development start while maintaining reset history

#### Database Extensions
**Database Schema Changes**:
1. Add `is_reset` (boolean) and `reset_at` (timestamp) columns to `interaction_logs` table only

**New Methods in Database class**:
1. `softDeleteInteractionLogs(conversationId: string, reason?: string)`: Mark interaction logs as reset
2. `deleteConversationState(conversationId: string)`: Hard delete conversation state (already exists)
3. `getActiveInteractionLogs(conversationId: string)`: Get non-reset interaction logs
4. `getAllInteractionLogs(conversationId: string)`: Get all logs including reset ones

#### Plan Manager Extensions  
**New Methods in PlanManager class**:
1. `deletePlanFile(planFilePath: string)`: Safely delete plan file
2. `ensurePlanFileDeleted(planFilePath: string)`: Verify plan file deletion

#### ConversationManager Extensions
**New Methods in ConversationManager class**:
1. `resetConversation(confirm: boolean, reason?: string)`: Orchestrate complete reset
2. `validateResetRequest(confirm: boolean)`: Validate reset parameters
3. `cleanupConversationData(conversationId: string)`: Complete data cleanup

#### Error Handling Strategy
- Validate all parameters before execution
- Create backups before destructive operations
- Rollback on partial failures
- Comprehensive logging of reset operations
- Clear error messages for users

#### Safety Measures
- Require explicit `confirm: true` parameter
- Log all reset operations with timestamp and reason
- Provide detailed feedback about what was reset
- Backup plan files before deletion (optional)

### Edge Cases Considered
1. **Non-existent conversation**: Handle gracefully with informative message
2. **File system errors**: Proper error handling for plan file operations
3. **Database errors**: Transaction rollback for partial failures
4. **Concurrent operations**: Handle race conditions during reset
5. **Invalid parameters**: Comprehensive parameter validation
6. **Partial reset failures**: What happens if database succeeds but file deletion fails?
7. **Permission issues**: Handle cases where plan file cannot be deleted due to permissions
8. **Git branch switching**: What happens if user switches branches during reset?
9. **Multiple conversations**: Ensure reset only affects intended conversation
10. **Backup failures**: Handle cases where backup creation fails

### Alternative Approaches Considered

#### Approach 1: Mostly Hard Reset (CHOSEN - USER PREFERENCE)
- Completely delete conversation state and plan files. Soft-delete interaction logs, 
- Pros: Clean slate, simple implementation, immediate effect, no database bloat
- Cons: No recovery possible, permanent data loss of plan

#### Approach 2: Soft Reset (Rejected)
- Keep data but mark as "reset" with timestamps
- Pros: Data recovery possible, audit trail maintained
- Cons: More complex, database grows over time, not needed per user

#### Approach 3: Archive Reset (Rejected)
- Move data to archive tables/files
- Pros: Data preserved, clean active state
- Cons: Complex implementation, storage overhead, unnecessary complexity

**Decision**: Implementing hard reset approach per user preference. This provides the cleanest user experience with immediate fresh start and simple implementation.

### Potential Issues & Mitigations

#### Issue 1: Accidental Reset
**Mitigation**: Require explicit `confirm: true` parameter and log all operations

#### Issue 2: Partial Failure Recovery
**Mitigation**: Implement transaction-like behavior with rollback capabilities

#### Issue 3: Performance Impact
**Mitigation**: Reset operations are infrequent, optimize for safety over speed

#### Issue 4: Data Loss
**Mitigation**: Clear documentation, confirmation requirements, optional backups

### Security Considerations
- No sensitive data exposure in reset operations
- Proper parameter validation to prevent injection attacks
- Audit logging for all reset operations
- No elevation of privileges required

## Code

*Implementation phase - writing and building the solution*

### Tasks
- [x] Step 1: Extend Database Schema (add is_reset, reset_at columns to interaction_logs)
- [x] Step 2: Extend Database Class (soft delete methods for interaction logs)
- [x] Step 3: Extend PlanManager Class (hard delete plan files)
- [x] Step 4: Extend ConversationManager Class (orchestrate hybrid reset)
- [x] Step 5: Add Reset Tool to Server (register reset_development tool)
- [x] Step 6: Update Existing Query Methods (filter soft-deleted logs)
- [x] Step 7: Add Tests (unit and integration tests)
- [ ] Step 8: Update Documentation (README and API docs)

### Completed
- [x] **Database Schema**: Added is_reset and reset_at columns to interaction_logs table
- [x] **Database Methods**: Added softDeleteInteractionLogs, getActiveInteractionLogs, getAllInteractionLogsIncludingReset
- [x] **Plan Manager Methods**: Added deletePlanFile and ensurePlanFileDeleted methods
- [x] **Conversation Manager**: Added resetConversation, validateResetRequest, verifyResetCleanup methods
- [x] **Server Tool**: Registered reset_development tool with proper validation and error handling
- [x] **Types**: Updated InteractionLog interface to include isReset and resetAt fields
- [x] **Database Migration**: Added runMigrations method to handle existing databases
- [x] **Testing**: Created comprehensive tests for reset functionality
- [x] **Validation**: Parameter validation and error handling implemented

## Commit

*Finalization phase - committing changes and documentation*

### Tasks
- [x] Verify all implementation is complete and working
- [x] Run final test suite to ensure no regressions
- [x] Document the new reset functionality
- [x] Update README.md with reset tool documentation
- [x] Commit changes with proper commit message

### Completed
- [x] **Implementation Verification**: All code implemented and tested successfully
- [x] **Test Suite**: All existing tests pass + new reset functionality tests pass
- [x] **Functionality Working**: Reset tool successfully implemented with hybrid approach
- [x] **Error Handling**: Comprehensive validation and error handling implemented
- [x] **Database Migration**: Automatic migration for existing databases implemented
- [x] **README Documentation**: Added comprehensive reset_development tool documentation
- [x] **Git Commit**: Successfully committed all changes with descriptive commit message

## Decision Log

## Decision Log

### Technical Decisions
- **Reset Tool API**: Simple approach with just `confirm` parameter for safety
- **Database Strategy**: Hybrid approach - hard delete conversation state, soft delete interaction logs
- **Hybrid Implementation**: Hard delete for clean slate, soft delete for audit trail
- **Safety First**: Require explicit confirmation to prevent accidental resets
- **Audit Trail**: Soft delete interaction logs to track reset events and patterns
- **Schema Changes**: Only add soft delete columns to interaction_logs table

### Design Decisions
- **Tool Name**: `reset_development` - clear and descriptive
- **Parameter Design**: Required `confirm` parameter prevents accidental execution
- **Return Format**: Structured response with success status and detailed feedback
- **Logging Strategy**: Comprehensive logging for audit trail and debugging
- **Reset Strategy**: **HYBRID APPROACH** (USER PREFERENCE)
  - **Hard delete**: Conversation state and plan file for clean slate
  - **Soft delete**: Interaction logs to maintain audit trail of reset events
  - Best of both worlds: clean start + reset history

## Notes

### Testing Strategy
- **Unit Tests**: Test each new method in isolation
- **Integration Tests**: Test complete reset workflow
- **Error Scenario Tests**: Test all identified edge cases
- **Performance Tests**: Ensure reset operations complete in reasonable time
- **Safety Tests**: Verify confirmation requirements work correctly

### Future Enhancements
- **Selective Reset**: Reset specific phases only (e.g., reset from design phase)
- **Reset Templates**: Pre-configured reset scenarios for common use cases
- **Batch Reset**: Reset multiple conversations at once
- **Reset History**: Track reset operations for analytics
- **Recovery Tools**: Ability to recover from accidental resets

### Implementation Notes
- Follow existing code patterns and logging conventions
- Maintain backward compatibility with existing tools
- Use TypeScript for type safety
- Follow the project's error handling patterns
- Ensure comprehensive test coverage

### Rollout Strategy
1. Implement core functionality
2. Add comprehensive tests
3. Test in development environment
4. Update documentation
5. Release as new tool version

---

*This plan is continuously updated by the LLM as development progresses. Each phase's tasks and completed items are maintained to track progress and provide context for future development sessions.*
