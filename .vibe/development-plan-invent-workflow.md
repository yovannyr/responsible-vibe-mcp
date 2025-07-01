# Development Plan: responsible-vibe (invent-workflow branch)

*Generated on 2025-07-01 by Vibe Feature MCP*
*Workflow: minor-enhancement*

## Goal
Implement a new workflow for the responsible-vibe-mcp server to extend the available development processes beyond the current waterfall, epcc, bugfix, and minor-enhancement workflows.

## Explore
### Tasks
- [x] Define the new workflow concept and use case
- [x] Analyze existing workflow patterns and structure
- [x] Design the new workflow phases and transitions
- [x] Plan integration with existing workflow manager
- [x] Document workflow requirements and specifications
- [x] Create the YAML workflow definition
- [x] Test the new workflow

### Completed
- [x] Created development plan file
- [x] Analyzed existing workflow structure and patterns
- [x] Examined StateMachineLoader and WorkflowManager implementation
- [x] Reviewed existing workflow YAML definitions (epcc, waterfall, bugfix, minor-enhancement)
- [x] Defined greenfield workflow concept with user
- [x] Created comprehensive greenfield.yaml workflow definition with 5 phases
- [x] Verified workflow loads correctly and all tests pass (96/96 tests passed)

## Implement

### Phase Entrance Criteria:
- [x] The new workflow requirements have been thoroughly analyzed
- [x] Existing workflow patterns have been studied and documented
- [x] The new workflow structure and phases have been designed
- [x] Integration points with existing code have been identified
- [x] Implementation approach has been planned and documented

### Tasks
- [x] Create greenfield.yaml workflow definition file
- [x] Define all 5 phases with proper descriptions and instructions
- [x] Implement comprehensive transition logic between phases
- [x] Add phase-specific deliverables (PRD, Architecture Doc, etc.)
- [x] Test workflow loading and integration
- [x] Run full test suite to ensure no regressions
- [x] Verify workflow appears in available workflows list
- [x] Update documentation to mention new greenfield workflow
- [x] Prepare commit with conventional commit message

### Completed
- [x] Created `/resources/workflows/greenfield.yaml` with comprehensive 5-phase workflow
- [x] Implemented all transitions with proper instructions and reasoning
- [x] Verified workflow loads correctly and integrates with existing system
- [x] Confirmed all 96 tests pass with no regressions
- [x] Tested workflow discovery and phase enumeration
- [x] Updated README.md to document new greenfield workflow in two locations
- [x] Committed changes with conventional commit message: "feat: add greenfield workflow for starting new projects from scratch"

## Key Decisions
- **Existing Workflow Analysis**: The system supports 4 predefined workflows:
  - `waterfall`: Classical 5-phase process (requirements → design → implementation → qa → testing)
  - `epcc`: 4-phase iterative process (explore → plan → code → commit)
  - `bugfix`: 4-phase focused process (reproduce → analyze → fix → verify)
  - `minor-enhancement`: 2-phase streamlined process (explore → implement)
- **Workflow Structure**: All workflows are defined as YAML files in `resources/workflows/` directory
- **Integration Points**: WorkflowManager loads workflows, StateMachineLoader handles YAML parsing and validation
- **Implementation Approach**: Need to create new YAML workflow definition and ensure it's automatically discovered
- **New Workflow Design**: "greenfield" workflow for starting projects from scratch
  - **Name**: `greenfield`
  - **Description**: "A comprehensive workflow for starting new projects from scratch: Ideation, Architecture, Plan, Code, Document - ideal for greenfield projects requiring thorough upfront planning"
  - **Phases**: 
    1. `ideation` - Deep requirements discovery, scope definition, PRD creation
    2. `architecture` - Tech stack selection, architecture design, technical documentation
    3. `plan` - Implementation planning (similar to epcc plan phase)
    4. `code` - Development implementation (similar to epcc code phase)  
    5. `document` - Comprehensive README and project documentation creation
  - **Target Use Case**: New projects starting from zero, requiring comprehensive planning and documentation

## Notes
- Workflows are automatically loaded from `resources/workflows/*.yaml` files
- Each workflow defines states, transitions, and phase-specific instructions
- The system supports both predefined and custom workflows (via `.vibe/state-machine.yaml`)
- All workflows follow the same YAML schema defined in `resources/state-machine-schema.json`
- **Greenfield Workflow Implementation**: Created `/resources/workflows/greenfield.yaml` with:
  - 5 phases: ideation → architecture → plan → code → document
  - Comprehensive transitions allowing refinement loops and backward navigation
  - Phase-specific deliverables: PRD, Architecture Doc, Implementation Plan, Working Code, Comprehensive README
  - Extensive questioning prompts for ideation and architecture phases
  - Integration with existing epcc-style planning and coding approaches
  - Focus on newcomer-friendly documentation in final phase

---
*This plan is maintained by the LLM. Tool responses provide guidance on which section to focus on and what tasks to work on.*
