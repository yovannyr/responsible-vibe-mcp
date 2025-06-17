# Vibe Feature MCP Server

A Model Context Protocol (MCP) server that acts as an intelligent conversation state manager and development guide for LLMs. This server orchestrates feature development conversations by maintaining state, determining development stages, and providing contextual instructions to guide LLMs through structured development processes.

## Overview

**Vibe Feature MCP** serves as a conversation coordinator that:

- **Manages Conversation State**: Tracks development stage and conversation context across sessions
- **Guides LLM Behavior**: Provides stage-specific instructions telling the LLM what to do next
- **Maintains Project Memory**: Keeps a persistent markdown plan file that serves as long-term project memory
- **Orchestrates Development Flow**: Intelligently determines when to transition between development stages
- **Ensures Progress Tracking**: Continuously instructs the LLM to update completed tasks in the plan file

## Core Interaction Pattern

```
User: "implement auth"
  ↓
LLM: calls whats_next()
  ↓
Vibe-Feature-MCP: analyzes context → determines stage → returns instructions
  ↓
LLM: follows instructions → interacts with user → updates plan file
  ↓
LLM: calls whats_next() again
  ↓
[cycle continues...]
```

## Architecture

### Static Architecture

```mermaid
graph TB
    subgraph "Vibe Feature MCP Server"
        CM[Conversation Manager]
        TM[Transition Engine]
        IM[Instruction Generator]
        PM[Plan Manager]
        DB[(SQLite Database)]
    end
    
    subgraph "Development Stages"
        IDLE[Idle]
        REQ[Requirements]
        DES[Design]
        IMP[Implementation]
        QA[Quality Assurance]
        TEST[Testing]
        COMP[Complete]
    end
    
    subgraph "Persistent Storage"
        DBFILE[~/.vibe-feature-mcp/db.sqlite]
        PF[Project Plan Files]
        GIT[Git Repository Context]
    end
    
    subgraph "LLM Client"
        LLM[LLM Application]
        USER[User]
        CWD[Current Working Directory]
    end
    
    USER --> LLM
    LLM --> CM
    CM --> DB
    CM --> TM
    TM --> IM
    IM --> PM
    
    DB --> DBFILE
    PM --> PF
    CM --> GIT
    
    IDLE --> TM
    REQ --> TM
    DES --> TM
    IMP --> TM
    QA --> TM
    TEST --> TM
    COMP --> TM
    
    IM --> LLM
```

### Core Building Blocks

#### 1. **Conversation Manager**
The Conversation Manager handles conversation identification, state persistence, and coordination between components.

**Responsibilities:**
- Generate unique conversation identifiers from project path + git branch
- Load and persist conversation state from/to database
- Coordinate state updates across components
- Handle conversation lifecycle (creation, updates, cleanup)
- Provide conversation-scoped state isolation
- Manage project-specific development context

**Key Features:**
- **Project-Aware Identification**: Uses absolute project path + current git branch as conversation identifier
- **Git Integration**: Automatically detects git branch changes and creates separate conversation contexts
- **Stateless Operation**: Does not store conversation history, relies on LLM-provided context
- **Multi-Project Support**: Handles multiple concurrent project conversations
- **State Validation**: Ensures state consistency and handles corrupted state recovery
- **Context Processing**: Analyzes LLM-provided conversation summary and recent messages

#### 2. **Transition Engine**
The Transition Engine manages the development state machine and determines appropriate stage transitions.

**Responsibilities:**
- Analyze user input and conversation context
- Determine current development stage
- Evaluate stage completion criteria
- Trigger stage transitions based on conversation analysis
- Implement development state machine logic

**Key Features:**
- **Context Analysis**: Processes LLM-provided conversation summary and recent messages
- **Stage Detection**: Intelligently determines appropriate development stage
- **Transition Logic**: Implements rules for stage progression and regression
- **Completion Assessment**: Evaluates when stages are sufficiently complete
- **State Machine Management**: Handles the core development workflow logic

#### 3. **Instruction Generator**
The Instruction Generator creates stage-specific guidance for the LLM based on current conversation state.

**Responsibilities:**
- Generate contextual instructions for each development stage
- Customize instructions based on project context and history
- Provide task completion guidance
- Generate plan file update instructions

**Key Features:**
- **Stage-Specific Guidance**: Tailored instructions for each development phase
- **Context-Aware Customization**: Adapts instructions based on project type and history
- **Task Management**: Provides clear guidance on task completion and progress tracking
- **Plan File Integration**: Ensures consistent plan file updates and maintenance

#### 4. **Plan Manager**
The Plan Manager handles the creation, updating, and maintenance of project development plan files.

**Responsibilities:**
- Generate and maintain markdown plan files
- Track task completion and progress
- Manage plan file structure and content
- Handle plan file versioning per git branch

**Key Features:**
- **Markdown Generation**: Creates structured development plans in markdown format
- **Progress Tracking**: Maintains task completion status and project progress
- **Branch-Aware Plans**: Separate plan files for different git branches when needed
- **Template Management**: Consistent plan file structure across projects

#### 5. **SQLite Database**
The database provides persistent storage for conversation state and metadata.

**Schema Design:**
- **conversation_states**: Core conversation metadata and current state
- **Indexes**: Optimized for project path + branch lookups

**Key Features:**
- **Persistent State**: Survives server restarts and system reboots
- **Multi-User Support**: Stored in user's home directory (~/.vibe-feature-mcp/)
- **Lightweight Storage**: Minimal overhead for state management
- **Atomic Updates**: Ensures data consistency during concurrent operations

### Dynamic Behavior

```mermaid
sequenceDiagram
    participant User as User
    participant LLM as LLM
    participant SM as State Manager
    participant CM as Conversation Manager
    participant DB as SQLite Database
    participant TM as Transition Engine
    participant IM as Instruction Generator
    participant PM as Plan Manager
    participant FS as File System
    
    User->>LLM: "implement auth"
    LLM->>CM: whats_next(context, user_input, conversation_summary, recent_messages)
    Note over LLM,CM: Server stores NO message history - LLM provides context
    CM->>FS: detect project path + git branch
    CM->>DB: lookup/create conversation state
    DB-->>CM: conversation state (stage, plan path only)
    
    CM->>TM: analyze stage transition
    TM->>TM: analyze LLM-provided context
    TM->>TM: evaluate current stage
    TM-->>CM: stage decision
    
    CM->>IM: generate instructions
    IM->>DB: get project context
    IM-->>CM: stage-specific instructions
    
    CM->>PM: update plan file path
    PM-->>CM: plan file location
    
    CM->>DB: update conversation state (stage only)
    CM-->>LLM: instructions + metadata
    
    LLM->>User: follow instructions
    LLM->>FS: update plan file
    
    Note over User,FS: Cycle continues with each user interaction
```

### Data Flow Architecture

#### 1. **Conversation Identification Flow**
```
User Input → Project Detection → Git Branch Detection → Conversation ID Generation → Database Lookup
```

#### 2. **State Management Flow**
```
Conversation ID → State Retrieval → Context Analysis → Stage Determination → State Update → Persistence
```

#### 3. **Instruction Generation Flow**
```
Current Stage → Project Context → Conversation History → Instruction Template → Customized Instructions
```

#### 4. **Plan File Management Flow**
```
Project Path → Branch Detection → Plan File Path → Content Generation → File Updates → Progress Tracking
```

### Key Architectural Principles

#### 1. **Project-Centric Design**
- Each project maintains independent conversation state
- Git branch awareness enables feature-specific development tracking
- Plan files remain within project directories for easy access

#### 2. **Persistent State Management**
- SQLite database ensures state survives server restarts
- Conversation history enables context-aware decision making
- Database stored in user home directory for portability

#### 3. **Stage-Driven Workflow**
- Clear separation between development stages
- Stage-specific instructions guide LLM behavior
- Transition logic ensures appropriate workflow progression

#### 4. **Conversation Continuity**
- Long-term memory across multiple LLM interactions
- Context preservation enables complex, multi-session development
- History tracking supports learning and improvement

#### 5. **Git Integration**
- Branch-aware conversation management
- Separate development contexts for different features
- Integration with existing git workflows

### Scalability Considerations

#### 1. **Multi-Project Support**
- Concurrent handling of multiple project conversations
- Isolated state prevents cross-project interference
- Efficient database indexing for fast project lookups

#### 2. **Performance Optimization**
- SQLite provides fast local storage with minimal overhead
- Conversation state caching reduces database queries
- Efficient git branch detection minimizes system calls

#### 3. **Storage Management**
- Automatic cleanup of old conversation states
- Plan file management within project boundaries
- Database maintenance and optimization capabilities

### Integration Points

#### 1. **LLM Integration**
- Single `whats_next` tool interface
- JSON-based instruction delivery
- Context-aware response generation

#### 2. **File System Integration**
- Plan file creation and management
- Project directory detection
- Git repository integration

#### 3. **Development Tool Integration**
- Compatible with existing development workflows
- Non-intrusive plan file placement
- Standard markdown format for universal compatibility

### Dynamic Behavior

```mermaid
sequenceDiagram
    participant User as User
    participant LLM as LLM
    participant Server as Vibe Feature MCP
    participant FS as File System
    
    User->>LLM: "implement auth"
    LLM->>Server: whats_next(context: "user wants auth")
    Server->>FS: Check conversation state
    FS-->>Server: No existing state
    Server->>Server: Transition to "requirements"
    Server-->>LLM: "Analyze user's auth request. Ask clarifying questions about WHAT they need. Break down into tasks in plan file. Mark completed tasks."
    
    LLM->>User: Ask clarifying questions about auth
    User->>LLM: Provides requirements details
    LLM->>FS: Update plan file with tasks
    LLM->>Server: whats_next(context: "gathered requirements")
    
    Server->>FS: Check progress & conversation
    Server->>Server: Requirements complete? → Transition to "design"
    Server-->>LLM: "Help user design technical solution. Ask about quality goals & technologies. Update plan file. Mark completed requirements tasks."
    
    loop Development Flow
        LLM->>User: Follow stage instructions
        User->>LLM: Respond with information
        LLM->>FS: Update plan file & mark completed tasks
        LLM->>Server: whats_next(context: "current progress")
        Server->>Server: Evaluate progress & determine next stage
        Server-->>LLM: Stage-specific instructions + "Update completed tasks"
    end
```

## State Machine

The server operates as a state machine that transitions between development stages. While the diagram shows the typical linear progression, **users can transition directly to any stage at any time** using the `proceed_to_stage` tool:

```mermaid
stateDiagram-v2
    [*] --> Idle
    
    Idle --> Requirements : new_feature_request
    
    Requirements --> Requirements : refine_requirements
    Requirements --> Design : requirements_complete
    Requirements --> Idle : abandon_feature
    
    Design --> Design : refine_design
    Design --> Requirements : requirements_unclear
    Design --> Implementation : design_complete
    Design --> Idle : abandon_feature
    
    Implementation --> Implementation : refine_implementation
    Implementation --> Design : design_issues
    Implementation --> QualityAssurance : implementation_complete
    Implementation --> Idle : abandon_feature
    
    QualityAssurance --> QualityAssurance : refine_qa
    QualityAssurance --> Implementation : implementation_issues
    QualityAssurance --> Testing : qa_complete
    QualityAssurance --> Idle : abandon_feature
    
    Testing --> Testing : refine_testing
    Testing --> QualityAssurance : qa_issues
    Testing --> Complete : testing_complete
    Testing --> Idle : abandon_feature
    
    Complete --> Idle : feature_delivered
    Complete --> Requirements : new_feature_request
```

### Stage Transition Flexibility

**All stage transitions are possible** - users can move from any stage to any other stage using `proceed_to_stage`. The transitions shown in the diagram represent the **typical development flow** and have **dedicated transition prompts** that provide specific guidance for common scenarios:

- **Forward progression**: Requirements → Design → Implementation → QA → Testing → Complete
- **Backward refinement**: When issues are discovered, return to earlier stages
- **Refinement loops**: Stay in current stage to add more work or improve quality

**Direct transitions** (not shown in diagram) are also supported for scenarios like:
- **"I have existing code, let's review it"** → Direct to QA stage
- **"I just need help with testing"** → Direct to Testing stage  
- **"Let's go back to requirements"** → Return to Requirements from any stage

For modeled transitions, vibe-feature-mcp provides **contextual guidance** about why the transition makes sense and what to focus on next. For direct transitions, it provides **general stage instructions** appropriate for the target stage.

## Features

### 1. Intelligent Stage Management

The server manages five core development stages, each with specific guidance:

#### Requirements Analysis
- Instructs LLM to analyze user requests and clarify the WHAT
- Guides the LLM to ask clarifying questions about functionality
- Directs the LLM to break down needs into specific tasks
- Ensures the LLM continuously marks completed requirements tasks

#### Design
- Instructs LLM to help user design technical solutions (the HOW)
- Guides the LLM to ask about quality goals and technology preferences
- Directs the LLM to document architectural decisions
- Ensures the LLM marks completed design tasks and updates plan

#### Implementation
- Instructs LLM to guide code implementation following best practices
- Guides the LLM to help with coding standards and structure
- Directs the LLM to track implementation progress
- Ensures the LLM marks completed implementation tasks

#### Quality Assurance
- Instructs LLM to guide code review and quality validation
- Guides the LLM to ensure requirements are properly met
- Directs the LLM to help with testing and documentation
- Ensures the LLM marks completed QA tasks

#### Testing
- Instructs LLM to guide comprehensive testing strategies
- Guides the LLM to help create and execute test plans
- Directs the LLM to validate feature completeness
- Ensures the LLM marks completed testing tasks

### 2. Conversation State Persistence

- **Stage Tracking**: Current development stage and transition history
- **Context Memory**: Conversation context and progress indicators
- **Plan Synchronization**: Ensures plan file stays updated with latest progress

### 3. Dynamic Plan Management

The server ensures the LLM maintains a living development plan document:

- **Project Overview**: Feature goals, scope, and current status
- **Stage Progress**: Tasks, deliverables, and completion status
- **Decision Log**: Important technical and design decisions
- **Timeline**: Progress tracking and milestone completion

## Installation

```bash
npm install @modelcontextprotocol/sdk zod
```

## API Reference

### Resources

#### `development-plan`
- **URI**: `plan://current`
- **Description**: Current development plan document (markdown)
- **Updates**: Continuously updated by LLM based on server instructions

#### `conversation-state`
- **URI**: `state://current`
- **Description**: Current conversation state and stage information
- **Format**: JSON with stage, progress, and transition history

### Tools

#### `whats_next`
The primary tool that analyzes conversation state and provides LLM instructions.

**Parameters:**
- `context` (string, optional): Additional context about current conversation
- `user_input` (string, optional): Latest user input for analysis
- `conversation_summary` (string, optional): LLM-provided summary of the conversation so far
- `recent_messages` (array, optional): Array of recent conversation messages that LLM considers relevant

**Returns:**
- `stage` (string): Current development stage
- `instructions` (string): Detailed instructions for the LLM
- `plan_file_path` (string): Path to the plan file to update
- `transition_reason` (string): Why this stage was chosen
- `completed_tasks` (array): Tasks that should be marked as complete

#### `proceed_to_stage`
Tool for explicitly transitioning to a new development stage when current stage is complete.

**Parameters:**
- `target_stage` (string): The stage to transition to (requirements, design, implementation, qa, testing, complete)
- `reason` (string, optional): Reason for transitioning now

**Returns:**
- `stage` (string): New development stage
- `instructions` (string): Instructions for the new stage
- `plan_file_path` (string): Path to the plan file to update
- `transition_reason` (string): Confirmation of stage transition

### Prompts

#### `stage-guidance`
Provides detailed guidance prompts for specific development stages.

**Arguments:**
- `stage` (string): Development stage name
- `context` (string): Additional context or specific questions

## Stage Progression Flow

### How Users Advance Through Development Stages

The vibe-feature-mcp server guides users through a structured development process using a two-tool approach that gives users full control over stage transitions:

#### 1. **Continuous Guidance with `whats_next`**
- LLM calls `whats_next()` after each user interaction
- Server analyzes current stage progress and plan file status
- Returns stage-specific instructions for what to do next

#### 2. **Explicit Stage Transitions with `proceed_to_stage`**
- When all tasks in a stage are complete, `whats_next()` suggests moving forward
- LLM uses `proceed_to_stage()` to explicitly transition to the next stage
- User maintains full control over pacing and can choose to refine current stage

### Stage Progression Pattern

```mermaid
flowchart TD
    A[User Request] --> B[LLM calls whats_next]
    B --> C{Stage Complete?}
    
    C -->|No| D[Continue Current Stage]
    D --> E[Follow Stage Instructions]
    E --> F[Update Plan File]
    F --> G[User Interaction]
    G --> B
    
    C -->|Yes| H[Suggest Stage Transition]
    H --> I{User Ready?}
    I -->|No| D
    I -->|Yes| J[LLM calls proceed_to_stage]
    J --> K[Transition to Next Stage]
    K --> B
```

### Example Stage Progression

#### Starting a New Feature
```
User: "I want to implement user authentication"
LLM: *calls whats_next()*
vibe-feature-mcp: "New feature detected. Starting requirements analysis. Ask the user clarifying questions about WHAT they need for authentication..."
```

#### Working Within a Stage
```
LLM: *asks clarifying questions, updates plan file*
LLM: *calls whats_next()*
vibe-feature-mcp: "Continue requirements gathering. You still need to clarify password policies and session management..."
```

#### Completing a Stage
```
LLM: *completes all requirements tasks*
LLM: *calls whats_next()*
vibe-feature-mcp: "All requirements tasks are complete! ✅ You can proceed to design stage using 'proceed_to_stage' tool, or continue refining requirements if needed."
```

#### Transitioning to Next Stage
```
LLM: "Great! We've covered all authentication requirements. Let's move to design."
LLM: *calls proceed_to_stage(target_stage: "design", reason: "requirements complete")*
vibe-feature-mcp: "Transitioning to design stage. Help the user design the technical solution. Ask about architecture, technologies, and quality goals..."
```

### Stage Completion Indicators

Each stage is considered complete when:

- **Requirements**: All user needs documented, scope confirmed, tasks broken down
- **Design**: Technical approach defined, architecture decided, technology choices made
- **Implementation**: Core functionality built, code structured, basic testing done
- **Quality Assurance**: Code reviewed, requirements validated, documentation complete
- **Testing**: Test plans executed, coverage verified, feature validated

### Refinement and Flexibility

Users can always choose to:
- **Stay in current stage**: Even when "complete," users can add more tasks or refine existing work
- **Go back**: Use `proceed_to_stage` to return to earlier stages if issues are discovered
- **Skip ahead**: In rare cases, jump to later stages if earlier work is already done

This approach ensures users maintain full control over the development process while receiving structured guidance from vibe-feature-mcp.

## Comprehensive Sample Interaction Flow

```
User: "I need to implement user authentication for my web app"

LLM: *calls whats_next(context: "user wants auth", user_input: "implement user authentication")*

Vibe-Feature-MCP Response:
{
  "stage": "requirements",
  "instructions": "Analyze the user's authentication request. Ask clarifying questions about WHAT they need: What type of authentication? What user data? What security requirements? Break down their needs into specific tasks and add them to the development plan file at ./auth-feature-plan.md. Mark any completed requirements tasks as you progress.",
  "plan_file_path": "./auth-feature-plan.md",
  "transition_reason": "New feature request detected, starting requirements analysis",
  "completed_tasks": []
}

LLM: "I'll help you implement authentication! Let me understand your requirements better:

1. What type of authentication do you need? (email/password, social login, multi-factor?)
2. What user information do you want to store?
3. Do you have any specific security requirements?
4. What's your current tech stack?

*[Creates ./auth-feature-plan.md with initial authentication tasks]*"

User: "I need email/password auth with optional Google login. Store email, name, and profile picture. Using React frontend with Node.js backend."

LLM: *calls whats_next(context: "user clarified basic auth requirements", user_input: "email/password + Google, React/Node stack", conversation_summary: "User wants to implement authentication for web app, clarified basic requirements")*

Vibe-Feature-MCP Response:
{
  "stage": "requirements", 
  "instructions": "Continue gathering requirements. Ask about password policies, session management, user roles, forgot password flow, data validation. Update the plan file with detailed requirements. Mark basic requirements gathering as complete.",
  "plan_file_path": "./auth-feature-plan.md",
  "transition_reason": "Still in requirements phase, need more details",
  "completed_tasks": ["basic_auth_type_identified", "tech_stack_confirmed"]
}

LLM: "Great! Let me gather a few more details:

1. Any password complexity requirements?
2. How long should user sessions last?
3. Do you need user roles/permissions?
4. Need forgot password functionality?
5. Any specific validation rules for user data?

*[Updates plan file marking basic requirements as complete, adds detailed requirement tasks]*"

User: "Standard password rules, 24-hour sessions, just basic user role for now, yes to forgot password, standard email validation."

LLM: *calls whats_next(context: "requirements seem complete", user_input: "password rules, 24h sessions, basic roles, forgot password, email validation")*

Vibe-Feature-MCP Response:
{
  "stage": "requirements",
  "instructions": "All requirements tasks are complete! ✅ You have documented: authentication type, user data, security requirements, tech stack, password policies, session management, user roles, and forgot password flow. You can proceed to design stage using 'proceed_to_stage' tool, or continue refining requirements if needed.",
  "plan_file_path": "./auth-feature-plan.md", 
  "transition_reason": "All requirements tasks completed",
  "completed_tasks": ["requirements_documented", "user_confirmed_scope", "security_requirements_defined", "technical_constraints_identified"]
}

LLM: "Perfect! We've covered all the authentication requirements comprehensively. Let's move to the design phase."

LLM: *calls proceed_to_stage(target_stage: "design", reason: "requirements complete")*

Vibe-Feature-MCP Response:
{
  "stage": "design",
  "instructions": "Help the user design the technical solution. Ask about database schema, API endpoints, security measures (JWT, bcrypt), third-party services for Google auth, error handling strategies. Ask about quality goals and specific technologies they prefer. Update the plan file with design decisions and mark completed requirements tasks as done.",
  "plan_file_path": "./auth-feature-plan.md",
  "transition_reason": "Explicit transition to design phase",
  "completed_tasks": []
}

LLM: "Perfect! Now let's design the technical solution:

**Database Design:**
- Users table: id, email, password_hash, name, profile_picture, google_id, role, created_at
- Sessions table: id, user_id, token, expires_at

**API Endpoints:**
- POST /auth/register
- POST /auth/login  
- POST /auth/google
- POST /auth/forgot-password
- POST /auth/reset-password
- GET /auth/me
- POST /auth/logout

**Security Measures:**
- JWT tokens for session management
- bcrypt for password hashing
- Input validation and sanitization

Do you approve this design? Any changes needed?

*[Updates plan file with design details, marks requirements tasks as complete]*"

User: "Yes, looks good. Let's implement it."

LLM: *calls whats_next(context: "design approved by user", user_input: "approved design, ready to implement")*

Vibe-Feature-MCP Response:
{
  "stage": "design",
  "instructions": "All design tasks are complete! ✅ You have defined the architecture, database schema, API endpoints, and security measures. You can proceed to implementation stage using 'proceed_to_stage' tool, or continue refining the design if needed.",
  "plan_file_path": "./auth-feature-plan.md",
  "transition_reason": "All design tasks completed",
  "completed_tasks": ["architecture_defined", "database_schema_designed", "api_endpoints_planned", "security_measures_defined"]
}

LLM: "Excellent! The design is solid and approved. Let's move to implementation."

LLM: *calls proceed_to_stage(target_stage: "implementation", reason: "design complete and approved")*

Vibe-Feature-MCP Response:
{
  "stage": "implementation",
  "instructions": "Guide the user through implementing the authentication system. Start with backend setup (user model, middleware, API endpoints), then frontend components. Follow coding best practices, include proper error handling, and write basic tests. Update the plan file with implementation progress and mark completed design tasks.",
  "plan_file_path": "./auth-feature-plan.md",
  "transition_reason": "Explicit transition to implementation phase",
  "completed_tasks": []
}

LLM: "Let's implement this step by step:

**Step 1: Backend Setup**
First, let's set up the user model and authentication middleware...

```javascript
// User model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  name: { type: String, required: true },
  profile_picture: String,
  google_id: String,
  role: { type: String, default: 'user' }
});
```

**Step 2: JWT Middleware**
Here's the authentication middleware...

*[Continues with implementation guidance, updates plan file]*"

[Process continues through implementation, QA, and testing phases...]

## LLM System Prompt Integration

To properly integrate with vibe-feature-mcp, the LLM should be configured with a system prompt that establishes the interaction pattern. The key requirement for the stateless approach is that the LLM must provide conversation context when calling `whats_next()`.

### Key Requirements for LLM Integration:

1. **Always call whats_next() after user interactions**
2. **Provide conversation context**: Include summary and recent messages
3. **Follow instructions precisely** from vibe-feature-mcp
4. **Continuously update the plan file** as instructed
5. **Mark completed tasks** when directed

### Conversation Context Parameters:

When calling `whats_next()`, the LLM should provide:
- **context**: Brief description of current situation
- **user_input**: The user's latest message or request  
- **conversation_summary**: Summary of the conversation so far (optional but recommended)
- **recent_messages**: Array of recent relevant messages (optional)

This stateless approach ensures that vibe-feature-mcp can make informed decisions about stage transitions without storing potentially inconsistent conversation history.

For a complete system prompt template, see [SYSTEM_PROMPT.md](./SYSTEM_PROMPT.md).
