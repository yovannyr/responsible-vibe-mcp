# Development Plan: responsible-vibe (tool-based-instructions branch)

*Generated on 2025-06-26 by Vibe Feature MCP*
*Workflow: waterfall*

## Project Overview

**Status**: Design Phase  
**Current Phase**: Design  
**Workflow**: From Specification down to test – the historical way. Ideal for larger, design-heavy tasks with well-defined requirements

### Feature Goals
- [x] Make responsible-vibe-mcp usage more consistent across all information sources
- [x] Eliminate confusion between different tools and their purposes
- [x] Improve tool descriptions to better guide users
- [x] Implement plan-file-centric information architecture

### Scope
- [x] Fix `transition_reason` confusion in `whats_next()` tool
- [x] Analyze and improve tool descriptions for better user guidance
- [ ] Implement consistent plan-file-centric approach for all dynamic information
- [ ] Ensure workflow flexibility without hardcoded phase names

## Current Status

**Phase**: Design  
**Progress**: Implementing consistent information propagation architecture

### Current Phase Tasks
- [x] Remove confusing `transition_reason` from `whats_next()` response
- [x] Analyze current tool descriptions for user guidance improvements
- [x] Identify hardcoded workflow information in tool descriptions
- [x] **DECISION**: Choose simple plan file structure (Option A)
- [x] Implement simple plan file template (task lists + decisions only)
- [x] Put all dynamic guidance in tool responses instead of plan file
- [x] Update tool descriptions to reference simple plan file structure
- [x] Test improved architecture with different workflows
- [x] **IMPLEMENTATION COMPLETE**: All 96 tests passing

### Completed
- [x] Created development plan file
- [x] Fixed `transition_reason` confusion in `whats_next()` tool
- [x] Identified architectural inconsistency in tool descriptions
- [x] **MAJOR DECISION**: Chose Option A for plan file architecture
- [x] **IMPLEMENTATION**: Successfully implemented plan-file-centric architecture

## Requirements

*Gathering and analyzing requirements*

### Tasks
- [ ] *To be added after previous phases completion*

### Completed
*None yet*

## Design

*Designing technical solution*

### Tasks
- [x] Analyze current server.ts structure and identify refactoring opportunities
- [x] Design modular architecture with clear separation of concerns
- [x] Define module structure and file organization
- [x] Design tool handler abstraction pattern
- [x] Design resource handler abstraction pattern
- [x] Design server configuration module
- [x] Design common helper utilities
- [x] Define TypeScript interfaces for new modules
- [x] Plan migration strategy to avoid breaking changes
- [x] Design tool response renderer for MCP protocol translation
- [x] Finalize interface contracts between modules
- [x] Review design for potential issues or improvements
- [x] **CONSISTENCY**: Design plan-file-centric information architecture
- [x] **DECISION**: Choose simple plan file structure (Option A)
- [ ] **NEXT**: Implement simple plan file template (task lists + decisions only)
- [ ] **NEXT**: Put all dynamic guidance in tool responses instead of plan file
- [ ] **NEXT**: Update tool descriptions to reference simple plan file structure

### Completed
- [x] Identified key issues with current monolithic server.ts
- [x] Proposed new directory structure with server/ folder
- [x] Designed separation between tool handlers, resource handlers, and core server
- [x] Added tool response renderer to separate business logic from MCP protocol concerns
- [x] Defined clean interfaces for BusinessResponse and McpToolResponse
- [x] Established consistent error handling patterns

## Implementation

*Building the solution*

### Tasks
- [x] Create core types and interfaces (src/server/types.ts)
- [x] Implement response renderer for MCP protocol translation
- [x] Create server helper functions for common operations
- [x] Create base tool handler classes with error handling
- [x] Implement WhatsNext tool handler
- [x] Implement ProceedToPhase tool handler
- [x] Implement StartDevelopment tool handler
- [x] Implement ResumeWorkflow tool handler
- [x] Implement ResetDevelopment tool handler
- [x] Create tool handler registry
- [x] Implement resource handlers
- [x] Create resource handler registry
- [x] Create main server orchestrator
- [x] Update existing server.ts to use new architecture
- [ ] Update tests to work with new structure (3 minor test failures remaining)

### Completed
- [x] Established clean separation between business logic and MCP protocol
- [x] Created consistent error handling patterns across all handlers
- [x] Implemented base classes to reduce code duplication
- [x] Successfully refactored monolithic server.ts into modular architecture
- [x] Maintained backward compatibility with existing API
- [x] All core functionality working (93/96 tests passing)
- [x] Build process working correctly

## Qa

*Quality assurance and review*

### Tasks
- [ ] *To be added after previous phases completion*

### Completed
*None yet*

## Testing

*Testing and validation*

### Tasks
- [ ] *To be added after previous phases completion*

### Completed
*None yet*

## Complete

*Feature complete and ready for delivery*

### Tasks
- [ ] *To be added after previous phases completion*

### Completed
*None yet*

## Decision Log

### Technical Decisions

**2025-06-26: Consistent Information Architecture Pattern**
- **Problem**: Information about workflows and phases was scattered across system prompt, tool descriptions, tool results, and plan files with inconsistent detail levels
- **Root Cause**: Static descriptions contained hardcoded workflow-specific information while actual workflows are chosen dynamically
- **Solution**: Plan-file-centric approach where all dynamic information lives in the plan file
- **Pattern**: Static descriptions stay generic + point to plan file for specifics
- **Benefits**: Workflow flexibility, single source of truth, user visibility, maintainable architecture

**2025-06-26: Removed `transition_reason` from `whats_next()` Response**
- **Problem**: `transition_reason` in `whats_next()` was confusing because the tool doesn't actually transition anything
- **Confusion**: Only `proceed_to_phase()` should have a `reason` parameter since it's the only tool that actually transitions
- **Solution**: Removed `transition_reason` field entirely from `whats_next()` response
- **Result**: Cleaner, less confusing tool interface

**2025-06-26: Plan File Architecture Decision - Option A Selected**
- **Problem**: Proposed complex plan file structure assumed tools could dynamically update plan content
- **Reality Check**: Tools have no intelligence to manipulate plan files - only LLM can update them
- **Options Considered**:
  - A: Simple plan file (task lists + decisions) + dynamic guidance in tool responses
  - B: Accept LLM manual maintenance of minimal structure  
  - C: Rethink plan-file-centric approach entirely
- **Decision**: **Option A** - Keep plan file very simple, put all dynamic guidance in tool responses
- **Rationale**: Maintainable by LLM, clear separation of concerns, reduces plan file maintenance burden
- **Implementation**: Plan file = task tracker + context only, tools provide all dynamic "what to do now" guidance
*Technical decisions will be documented here as they are made*

### Design Decisions
*Design decisions will be documented here as they are made*

## Notes

*Additional notes and observations will be added here throughout development*

---

*This plan is continuously updated by the LLM as development progresses. Each phase's tasks and completed items are maintained to track progress and provide context for future development sessions.*
