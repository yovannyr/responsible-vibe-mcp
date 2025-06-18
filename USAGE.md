# Vibe Feature MCP Server - Usage Guide

## Installation and Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the server:**
   ```bash
   npm run build
   ```

3. **Run the server:**
   ```bash
   npm start
   ```

## MCP Client Configuration

To use this server with an MCP client, configure it as a stdio transport:

```json
{
  "mcpServers": {
    "vibe-feature": {
      "command": "node",
      "args": ["/path/to/vibe-feature-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

## Available Tools

### `whats_next`
The primary tool that analyzes conversation state and provides LLM instructions.

**Parameters:**
- `context` (optional): Additional context about current conversation
- `user_input` (optional): Latest user input for analysis  
- `conversation_summary` (optional): LLM-provided summary of the conversation so far
- `recent_messages` (optional): Array of recent conversation messages

**Returns:**
- `phase`: Current development phase
- `instructions`: Detailed instructions for the LLM
- `plan_file_path`: Path to the plan file to update
- `transition_reason`: Why this phase was chosen
- `is_modeled_transition`: Whether this is a modeled transition
- `conversation_id`: Unique conversation identifier

### `proceed_to_phase`
Explicitly transition to a new development phase.

**Parameters:**
- `target_phase`: The phase to transition to (idle, requirements, design, implementation, qa, testing, complete)
- `reason` (optional): Reason for transitioning now

**Returns:** Same format as `whats_next`

## Available Resources

### `plan://current`
Current development plan document in markdown format.

### `state://current`
Current conversation state and phase information in JSON format.

## Development Phases

1. **idle**: Ready for new development tasks
2. **requirements**: Gathering and analyzing requirements
3. **design**: Technical design and architecture
4. **implementation**: Code development and building
5. **qa**: Quality assurance and code review
6. **testing**: Testing and validation
7. **complete**: Feature complete and ready for delivery

## Example Usage Flow

1. **Start new feature:**
   ```json
   {
     "name": "whats_next",
     "arguments": {
       "user_input": "I want to implement user authentication",
       "context": "Starting new feature development"
     }
   }
   ```

2. **Continue in current phase:**
   ```json
   {
     "name": "whats_next",
     "arguments": {
       "conversation_summary": "We've gathered basic auth requirements",
       "user_input": "I need password reset functionality too"
     }
   }
   ```

3. **Explicit phase transition:**
   ```json
   {
     "name": "proceed_to_phase",
     "arguments": {
       "target_phase": "design",
       "reason": "Requirements are complete, ready for design"
     }
   }
   ```

## Plan File Management

The server automatically creates and manages a development plan file in your project directory:
- Main branch: `development-plan.md`
- Feature branches: `development-plan-{branch-name}.md`

The LLM is instructed to continuously update this file with:
- Task progress and completion status
- Technical decisions and design choices
- Implementation notes and progress
- Testing results and validation

## Database Storage

Conversation state is persisted in SQLite database at:
`~/.vibe-feature-mcp/db.sqlite`

This ensures state survives server restarts and provides conversation continuity.

## Project Identification

Each conversation is uniquely identified by:
- **Project path**: Absolute path to current working directory
- **Git branch**: Current git branch (or 'no-git' if not in a git repo)

This allows multiple projects and branches to have independent conversation states.

## Testing

Run the test script to verify server functionality:
```bash
node test-server.js
```

This will test:
- Server initialization
- Tool listing
- Basic `whats_next` functionality

## Troubleshooting

### Server won't start
- Check that all dependencies are installed: `npm install`
- Ensure the project is built: `npm run build`
- Check for TypeScript errors: `npm run build`

### Database issues
- Database is created automatically in `~/.vibe-feature-mcp/`
- Delete the database directory to reset all conversation state
- Check file permissions on the home directory

### Git detection issues
- Server works without git (uses 'no-git' as branch name)
- Ensure you're in the correct project directory
- Check git repository status with `git status`

## Development

### Project Structure
```
src/
├── index.ts              # Main server entry point
├── state-machine.ts      # State machine definitions and transitions
├── database.ts           # SQLite database management
├── conversation-manager.ts # Conversation identification and state
├── transition-engine.ts  # Phase transition logic
├── instruction-generator.ts # LLM instruction generation
└── plan-manager.ts       # Plan file management
```

### Building
```bash
npm run build    # Compile TypeScript
npm run clean    # Clean build directory
npm run dev      # Build and run
```

### Architecture
The server follows a modular architecture with clear separation of concerns:
- **Conversation Manager**: Handles project identification and state persistence
- **Transition Engine**: Analyzes context and determines phase transitions
- **Instruction Generator**: Creates contextual LLM guidance
- **Plan Manager**: Manages development plan files
- **Database**: Provides persistent state storage
