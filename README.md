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
        SM[State Manager]
        TM[Transition Engine]
        IM[Instruction Generator]
        PM[Plan Manager]
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
        CS[Conversation State]
        PF[Plan Markdown File]
        CF[Configuration]
    end
    
    subgraph "LLM Client"
        LLM[LLM Application]
        USER[User]
    end
    
    USER --> LLM
    LLM --> SM
    SM --> TM
    TM --> IM
    IM --> PM
    
    SM <--> CS
    PM <--> PF
    
    IDLE --> TM
    REQ --> TM
    DES --> TM
    IMP --> TM
    QA --> TM
    TEST --> TM
    COMP --> TM
    
    IM --> LLM
```

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

The server operates as a state machine that transitions between development stages based on conversation analysis:

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

## Configuration

Create a configuration file `vibe-config.json`:

```json
{
  "projectName": "My Project",
  "planFilePath": "./feature-plan.md",
  "stateFilePath": "./conversation-state.json",
  "stageInstructions": {
    "requirements": "Analyze the user's request about the feature they want to implement. Ask clarifying questions about WHAT they need. Explore alternative approaches. Break down their needs into specific tasks and add them to the plan file. Mark completed requirements tasks as you progress.",
    "design": "Help the user design the technical solution. Ask about quality goals, technologies, architecture decisions. Document the HOW of implementation. Update the plan file with design decisions. Mark completed requirements tasks and add design tasks.",
    "implementation": "Guide the user through implementing the feature. Follow coding best practices, ensure proper error handling and testing. Update the plan file with implementation progress. Mark completed design tasks and track implementation tasks.",
    "qa": "Guide the user through quality assurance. Review code quality, validate requirements are met, ensure proper testing. Update the plan file with QA results. Mark completed implementation tasks.",
    "testing": "Guide the user through comprehensive testing. Create test plans, execute tests, validate feature completeness. Update the plan file with test results. Mark completed QA tasks."
  },
  "transitionCriteria": {
    "requirements_to_design": ["requirements_documented", "user_confirmed_scope"],
    "design_to_implementation": ["architecture_defined", "tech_stack_chosen"],
    "implementation_to_qa": ["core_functionality_complete", "basic_testing_done"],
    "qa_to_testing": ["code_reviewed", "requirements_validated"],
    "testing_to_complete": ["tests_passing", "feature_validated"]
  }
}
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

**Returns:**
- `stage` (string): Current development stage
- `instructions` (string): Detailed instructions for the LLM
- `plan_file_path` (string): Path to the plan file to update
- `transition_reason` (string): Why this stage was chosen
- `completed_tasks` (array): Tasks that should be marked as complete

### Prompts

#### `stage-guidance`
Provides detailed guidance prompts for specific development stages.

**Arguments:**
- `stage` (string): Development stage name
- `context` (string): Additional context or specific questions

## Comprehensive Sample Interaction Flow

### Scenario: User wants to implement authentication

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

LLM: *calls whats_next(context: "user clarified basic auth requirements", user_input: "email/password + Google, React/Node stack")*

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
  "stage": "design",
  "instructions": "Help the user design the technical solution. Ask about database schema, API endpoints, security measures (JWT, bcrypt), third-party services for Google auth, error handling strategies. Ask about quality goals and specific technologies they prefer. Update the plan file with design decisions and mark completed requirements tasks as done.",
  "plan_file_path": "./auth-feature-plan.md", 
  "transition_reason": "Requirements complete, transitioning to design phase",
  "completed_tasks": ["requirements_documented", "user_confirmed_scope", "security_requirements_defined"]
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
  "stage": "implementation",
  "instructions": "Guide the user through implementing the authentication system. Start with backend setup (user model, middleware, API endpoints), then frontend components. Follow coding best practices, include proper error handling, and write basic tests. Update the plan file with implementation progress and mark completed design tasks.",
  "plan_file_path": "./auth-feature-plan.md",
  "transition_reason": "Design approved, moving to implementation",
  "completed_tasks": ["architecture_defined", "database_schema_designed", "api_endpoints_planned"]
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
```

## Usage Patterns

### LLM System Integration

The LLM should be configured to regularly call `whats_next` after user interactions:

```typescript
// Example LLM integration pattern
const handleUserInput = async (userInput: string, conversationContext: string) => {
  // Call vibe-feature-mcp for guidance
  const guidance = await client.callTool({
    name: "whats_next",
    arguments: {
      context: conversationContext,
      user_input: userInput
    }
  });
  
  // Follow the provided instructions
  const response = await followInstructions(guidance.instructions);
  
  // Update plan file as instructed
  await updatePlanFile(guidance.plan_file_path, guidance.completed_tasks);
  
  return response;
};
```

### Plan File Structure

The development plan follows this structure:

```markdown
# Authentication Feature Development Plan

## Project Overview
- **Feature**: User Authentication System
- **Current Stage**: Implementation

## Development Stages

### 1. Requirements Analysis
- **Tasks**:
  - [x] Identify authentication type (email/password + Google)
  - [x] Define user data requirements
  - [x] Specify security requirements
  - [x] Confirm technology stack

### 2. Design
- **Tasks**:
  - [x] Design database schema
  - [x] Define API endpoints
  - [x] Plan security measures
- **Decisions**:
  - Using JWT for session management
  - bcrypt for password hashing

### 3. Implementation
- **Tasks**:
  - [x] Set up user model
  - [x] Implement JWT middleware
  - [ ] Implement Google OAuth
  - [ ] Create forgot password flow
  - [ ] Build frontend components

### 4. Quality Assurance
- **Tasks**:
  - [ ] Code review
  - [ ] Security audit
  - [ ] Requirements validation

### 5. Testing
- **Tasks**:
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] End-to-end tests

## Decisions Log
- **JWT vs Sessions**: Chose JWT for stateless authentication
- **Password Hashing**: Selected bcrypt for security
```

## Best Practices

### For LLM Integration
1. **Always call `whats_next`** after user interactions
2. **Follow instructions precisely** provided by the server
3. **Update plan files consistently** as instructed
4. **Mark completed tasks** as directed by the server
5. **Maintain conversation context** for better state management

### For Development Guidance
1. **Clear stage separation** - each stage has distinct goals
2. **Continuous progress tracking** - always update the plan file
3. **User confirmation** - ensure user agreement before stage transitions
4. **Decision documentation** - record important choices in the plan
5. **Task granularity** - break down work into manageable tasks

## Contributing

1. Fork the repository
2. Follow the development workflow using this server
3. Test with various feature development scenarios
4. Submit pull requests with comprehensive documentation

## License

MIT License - see LICENSE file for details.
