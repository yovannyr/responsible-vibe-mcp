# proceed_to_stage Tool Integration Tests

## Feature: Explicit Stage Transition Tool

As an LLM client using the Vibe Feature MCP server
I want to call the `proceed_to_stage` tool to explicitly transition between development stages
So that I can control the development workflow progression when stages are complete

### Background:
- `proceed_to_stage` allows explicit stage transitions
- It accepts target_stage (required) and reason (optional) parameters
- It should validate stage transitions and update conversation state
- It should return new stage instructions and update database

---

## Scenario: Valid stage transition from requirements to design

**Given** an existing conversation in "requirements" stage
**And** the requirements stage has completed tasks
**When** I call `proceed_to_stage` with target_stage "design"
**Then** the conversation stage should be updated to "design"
**And** design-specific instructions should be returned
**And** the database should be updated with the new stage
**And** the transition reason should be recorded

### Expected Behavior:
- Database should be updated with new stage and timestamp
- Instructions should be generated for the target stage
- Plan file path should remain consistent
- Transition reason should be captured and returned
- Stage-specific guidance should be provided

---

## Scenario: Direct stage transition skipping intermediate stages

**Given** an existing conversation in "requirements" stage
**When** I call `proceed_to_stage` with target_stage "implementation"
**Then** the stage should transition directly to "implementation"
**And** implementation-specific instructions should be provided
**And** the transition should be allowed (no strict sequential enforcement)
**And** the reason should indicate direct transition

### Expected Behavior:
- Non-sequential transitions should be permitted
- Instructions should be appropriate for target stage regardless of previous stage
- Database should record the direct transition
- No validation errors should occur for stage skipping

---

## Scenario: Transition to completion stage

**Given** an existing conversation in "testing" stage
**And** all testing tasks are complete
**When** I call `proceed_to_stage` with target_stage "complete"
**Then** the conversation should be marked as complete
**And** completion instructions should be provided
**And** the conversation state should reflect project completion

### Expected Behavior:
- Conversation should transition to "complete" stage
- Completion-specific instructions should be generated
- Database should be updated with completion timestamp
- Instructions should guide project wrap-up activities

---

## Scenario: Invalid stage transition parameters

**Given** the MCP server is running
**When** I call `proceed_to_stage` with an invalid target_stage
**Then** the tool should return an error response
**And** the current conversation state should remain unchanged
**And** a meaningful error message should be provided

### Expected Behavior:
- Invalid stage names should be rejected
- Error response should include valid stage options
- Database state should not be modified on validation errors
- Server should remain stable after invalid requests

---

## Scenario: Transition with detailed reason

**Given** an existing conversation in "design" stage
**When** I call `proceed_to_stage` with target_stage "implementation" and reason "design approved by user, ready to code"
**Then** the transition should be recorded with the provided reason
**And** the reason should be included in the response
**And** the database should store the transition reason

### Expected Behavior:
- Transition reasons should be captured and stored
- Reasons should be included in tool response
- Historical transition data should be preserved
- Reasons should help with conversation context understanding

---

## Scenario: Transition without existing conversation

**Given** no existing conversation state for the current project
**When** I call `proceed_to_stage` with target_stage "design"
**Then** a new conversation should be created
**And** the stage should be set to the requested target stage
**And** appropriate instructions should be generated for the target stage

### Expected Behavior:
- New conversations should be created if none exist
- Target stage should be set as initial stage
- Project detection should work same as whats_next tool
- Instructions should be contextually appropriate for starting at target stage

---

## Scenario: Concurrent stage transitions

**Given** multiple rapid calls to `proceed_to_stage`
**When** transitions are requested in quick succession
**Then** each transition should be processed atomically
**And** the final state should reflect the last successful transition
**And** no race conditions should occur in database updates

### Expected Behavior:
- Database updates should be atomic and consistent
- Concurrent requests should be handled gracefully
- Final conversation state should be deterministic
- No data corruption should occur from concurrent access
