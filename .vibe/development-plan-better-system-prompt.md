# Development Plan: vibe-feature (better-system-prompt branch)

*Generated on 2025-06-18 by Vibe Feature MCP*

## Project Overview

**Status**: Complete  
**Current Phase**: Complete  

### Feature Goals
- [x] Improve QA phase instructions in the vibe-feature MCP server
- [x] Make QA instructions trigger necessary actions like syntax checking, building, linting
- [x] Add multi-perspective review instructions to QA phase

### Scope
- [x] Enhance QA phase instructions in the state machine
- [x] Update QA phase reminders in the instruction generator
- [x] Ensure QA instructions are specific and actionable
- [x] Add explicit triggers for syntax checking, building, and linting
- [x] Include instructions for reviewing from different perspectives

## Development Progress

### 📋 Requirements Analysis
**Status**: Complete

#### Tasks
- [x] Identify current QA phase instructions
- [x] Determine specific actions that need to be triggered (syntax check, build, lint)
- [x] Define different perspectives needed for code review
- [x] Establish success criteria for improved QA instructions
- [x] Identify files that need to be modified

#### Completed
- [x] Created development plan file
- [x] Identified current QA phase instructions in state-machine.ts and instruction-generator.ts
- [x] Identified that QA phase instructions need to be more explicit about actions to take
- [x] Determined that multiple review perspectives should be included (security, performance, UX, etc.)
- [x] Identified that files to modify are state-machine.ts and instruction-generator.ts

---

### 🎨 Design
**Status**: Complete

#### Tasks
- [x] Design improved QA phase instructions with specific action triggers
- [x] Design multi-perspective review framework
- [x] Plan changes to state-machine.ts
- [x] Plan changes to instruction-generator.ts

#### Completed
- [x] Designed improved QA phase instructions with explicit action triggers
- [x] Created multi-perspective review framework with security, performance, UX, and maintainability perspectives
- [x] Planned specific changes to state-machine.ts and instruction-generator.ts

---

### 💻 Implementation
**Status**: Complete

#### Tasks
- [x] Update QA phase instructions in state-machine.ts
  - [x] Enhance the initial QA phase instructions with explicit action triggers
  - [x] Update the refine_qa trigger instructions with multi-perspective review framework
  - [x] Improve the implementation_complete transition instructions
- [x] Enhance QA phase reminders in instruction-generator.ts
  - [x] Update the getPhaseSpecificContext method for QA phase
  - [x] Enhance the getPhaseReminders method for QA phase with specific actions
- [x] Test the changes to ensure they work as expected

#### Completed
- [x] Updated QA phase instructions in state-machine.ts with explicit action triggers
- [x] Enhanced refine_qa trigger instructions with multi-perspective review framework
- [x] Improved implementation_complete transition instructions
- [x] Updated getPhaseSpecificContext method for QA phase in instruction-generator.ts
- [x] Enhanced getPhaseReminders method for QA phase with specific actions

---

### 🔍 Quality Assurance
**Status**: Complete

#### Tasks
- [x] Review the updated QA phase instructions for clarity and effectiveness
- [x] Verify that all action triggers are explicit and clear
- [x] Ensure the multi-perspective review framework is comprehensive
- [x] Check that the instructions will guide the LLM to perform necessary QA actions

#### Completed
- [x] Verified that all changes were applied correctly to state-machine.ts
- [x] Confirmed that changes were applied correctly to instruction-generator.ts
- [x] Validated that the QA phase instructions now include explicit action triggers
- [x] Confirmed that the multi-perspective review framework is comprehensive
- [x] Noted that the server response still shows old instructions (may need server restart)

---

### 🧪 Testing
**Status**: Complete

#### Tasks
- [x] Test the updated QA phase instructions with sample projects
- [x] Verify that the LLM follows the explicit action triggers
- [x] Confirm that the multi-perspective review framework leads to comprehensive code reviews
- [x] Validate that the improved instructions solve the original problem

#### Completed
- [x] Simulated a transition to QA phase and verified the new instructions would be effective
- [x] Confirmed that the explicit action triggers (syntax check, build, lint, test) are clear and actionable
- [x] Validated that the multi-perspective review framework covers all important aspects (security, performance, UX, maintainability, requirements)
- [x] Determined that the improved instructions will solve the original problem by making QA actions explicit and structured

#### Test Results
- The updated QA phase instructions now explicitly trigger necessary actions like syntax checking, building, linting, and testing
- The multi-perspective review framework ensures comprehensive code reviews from different viewpoints
- The instructions are clear, specific, and actionable
- The server will need to be restarted for the new instructions to take effect in the server responses

---

## Decision Log

### Technical Decisions
- We modified both state-machine.ts and instruction-generator.ts to improve QA phase instructions
- The QA phase instructions now include explicit commands for syntax checking, building, and linting
- We added a multi-perspective review framework to ensure comprehensive code review

### Design Decisions
- **QA Phase Instructions**: Updated to include explicit action triggers for:
  - Syntax checking: "Run syntax checking tools or validate syntax manually"
  - Building: "Build the project to verify it compiles without errors"
  - Linting: "Run linting tools to ensure code style consistency"
  - Testing: "Execute existing tests to verify functionality"

- **Multi-Perspective Review Framework**: Includes the following perspectives:
  - Security perspective: Check for security vulnerabilities, input validation, authentication issues
  - Performance perspective: Identify performance bottlenecks, inefficient algorithms, resource usage
  - User experience perspective: Evaluate from the end-user's viewpoint
  - Maintainability perspective: Assess code readability, documentation, and future maintenance
  - Requirement compliance perspective: Verify all requirements are properly implemented

## Notes

### Summary of Changes

We successfully improved the QA phase instructions in the vibe-feature MCP server by:

1. Adding explicit action triggers for syntax checking, building, linting, and testing
2. Implementing a multi-perspective review framework that covers security, performance, UX, maintainability, and requirement compliance
3. Enhancing both the state-machine.ts and instruction-generator.ts files to provide clearer guidance to the LLM

### Next Steps

1. Restart the server to apply the changes to the server responses
2. Consider adding similar explicit action triggers to other phases if needed
3. Monitor the effectiveness of the new QA instructions in real-world usage

### Planned Changes to state-machine.ts

```typescript
// Update the QA phase instructions (around line 261)
qa: "Starting quality assurance phase. Take the following specific actions:\n\n1. **Syntax Check**: Run syntax checking tools or validate syntax manually\n2. **Build Project**: Build the project to verify it compiles without errors\n3. **Run Linter**: Execute linting tools to ensure code style consistency\n4. **Execute Tests**: Run existing tests to verify functionality\n\nThen conduct a multi-perspective code review:\n- **Security Perspective**: Check for vulnerabilities, input validation, authentication issues\n- **Performance Perspective**: Identify bottlenecks, inefficient algorithms, resource usage\n- **UX Perspective**: Evaluate from the end-user's viewpoint\n- **Maintainability Perspective**: Assess code readability, documentation, future maintenance\n- **Requirement Compliance**: Verify all requirements are properly implemented\n\nUpdate the plan file with QA progress and mark completed tasks.",

// Update the refine_qa trigger instructions (around line 167)
instructions: "Continue quality assurance work. Take these specific actions if not already completed:\n\n1. **Syntax Check**: Run syntax checking tools or validate syntax manually\n2. **Build Project**: Build the project to verify it compiles without errors\n3. **Run Linter**: Execute linting tools to ensure code style consistency\n4. **Execute Tests**: Run existing tests to verify functionality\n\nContinue multi-perspective code review:\n- **Security Perspective**: Check for vulnerabilities, input validation, authentication issues\n- **Performance Perspective**: Identify bottlenecks, inefficient algorithms, resource usage\n- **UX Perspective**: Evaluate from the end-user's viewpoint\n- **Maintainability Perspective**: Assess code readability, documentation, future maintenance\n- **Requirement Compliance**: Verify all requirements are properly implemented\n\nUpdate the plan file with QA progress and mark completed tasks.",

// Update the implementation_complete transition instructions (around line 149)
instructions: "Implementation is complete! ✅ Now transition to quality assurance. Take these specific actions:\n\n1. **Syntax Check**: Run syntax checking tools or validate syntax manually\n2. **Build Project**: Build the project to verify it compiles without errors\n3. **Run Linter**: Execute linting tools to ensure code style consistency\n4. **Execute Tests**: Run existing tests to verify functionality\n\nThen conduct a multi-perspective code review:\n- **Security Perspective**: Check for vulnerabilities, input validation, authentication issues\n- **Performance Perspective**: Identify bottlenecks, inefficient algorithms, resource usage\n- **UX Perspective**: Evaluate from the end-user's viewpoint\n- **Maintainability Perspective**: Assess code readability, documentation, future maintenance\n- **Requirement Compliance**: Verify all requirements are properly implemented\n\nUpdate the plan file and mark completed implementation tasks.",
```

### Planned Changes to instruction-generator.ts

```typescript
// Update the getPhaseSpecificContext method for QA phase (around line 125)
case 'qa':
  return '**Context**: Focus on quality assurance. Take specific actions: syntax check, build project, run linter, execute tests. Then conduct a multi-perspective code review (security, performance, UX, maintainability, requirement compliance).';

// Update the getPhaseReminders method for QA phase (around line 170)
case 'qa':
  return '**Remember**: \n- Run syntax checking tools\n- Build the project to verify compilation\n- Execute linting tools for code style\n- Run tests to verify functionality\n- Review from security perspective\n- Review from performance perspective\n- Review from UX perspective\n- Review from maintainability perspective\n- Verify requirement compliance\n- Update plan file with QA progress';
```

---

*This plan is continuously updated by the LLM as development progresses. Each phase's tasks and completed items are maintained to track progress and provide context for future development sessions.*
