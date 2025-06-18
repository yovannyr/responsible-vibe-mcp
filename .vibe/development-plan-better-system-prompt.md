# Development Plan: vibe-feature (better-system-prompt branch)

*Generated on 2025-06-18 by Vibe Feature MCP*

## Project Overview

**Status**: Requirements Phase  
**Current Phase**: Requirements Analysis  

### Feature Goals
- [x] Improve QA phase instructions in the vibe-feature MCP server
- [ ] Make QA instructions trigger necessary actions like syntax checking, building, linting
- [ ] Add multi-perspective review instructions to QA phase

### Scope
- [x] Enhance QA phase instructions in the state machine
- [x] Update QA phase reminders in the instruction generator
- [ ] Ensure QA instructions are specific and actionable
- [ ] Add explicit triggers for syntax checking, building, and linting
- [ ] Include instructions for reviewing from different perspectives

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
**Status**: In Progress

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
**Status**: Not Started

#### Tasks
- [ ] Review the updated QA phase instructions for clarity and effectiveness
- [ ] Verify that all action triggers are explicit and clear
- [ ] Ensure the multi-perspective review framework is comprehensive
- [ ] Check that the instructions will guide the LLM to perform necessary QA actions

#### Completed
*None yet*

---

### 🧪 Testing
**Status**: Not Started

#### Tasks
- [ ] Test the updated QA phase instructions with sample projects
- [ ] Verify that the LLM follows the explicit action triggers
- [ ] Confirm that the multi-perspective review framework leads to comprehensive code reviews
- [ ] Validate that the improved instructions solve the original problem

#### Completed
*None yet*

---

## Decision Log

### Technical Decisions
- We will modify both state-machine.ts and instruction-generator.ts to improve QA phase instructions
- The QA phase instructions will include explicit commands for syntax checking, building, and linting
- We will add a multi-perspective review framework to ensure comprehensive code review

### Design Decisions
- **QA Phase Instructions**: Will be updated to include explicit action triggers for:
  - Syntax checking: "Run syntax checking tools or validate syntax manually"
  - Building: "Build the project to verify it compiles without errors"
  - Linting: "Run linting tools to ensure code style consistency"
  - Testing: "Execute existing tests to verify functionality"

- **Multi-Perspective Review Framework**: Will include the following perspectives:
  - Security perspective: Check for security vulnerabilities, input validation, authentication issues
  - Performance perspective: Identify performance bottlenecks, inefficient algorithms, resource usage
  - User experience perspective: Evaluate from the end-user's viewpoint
  - Maintainability perspective: Assess code readability, documentation, and future maintenance
  - Requirement compliance perspective: Verify all requirements are properly implemented

- **Implementation Plan**:
  1. Update the QA phase instructions in state-machine.ts
  2. Enhance the QA phase reminders in instruction-generator.ts
  3. Add specific action triggers and multi-perspective review guidance

## Notes

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
