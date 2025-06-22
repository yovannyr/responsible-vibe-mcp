# Logging in Vibe Feature MCP Server

The Vibe Feature MCP Server includes comprehensive logging with proper log levels for debugging, monitoring, and troubleshooting.

## Log Levels

The server uses four log levels following standard practices:

- **DEBUG**: Detailed tracing and execution flow information
- **INFO**: Success operations and important milestones  
- **WARN**: Expected errors and recoverable issues
- **ERROR**: Caught but unexpected errors

## Configuration

Set the log level using the `LOG_LEVEL` environment variable:

```bash
# Debug level (most verbose)
export LOG_LEVEL=DEBUG

# Info level (default)
export LOG_LEVEL=INFO

# Warning level
export LOG_LEVEL=WARN

# Error level only
export LOG_LEVEL=ERROR
```

## Log Format

Logs are formatted as:
```
[timestamp] LEVEL [component] message {context}
```

Example:
```
[2024-06-17T18:00:00.000Z] INFO [Server:whats_next] Tool executed successfully
[2024-06-17T18:00:00.000Z] DEBUG [Database] Retrieving conversation state {"conversationId":"abc123"}
```

## Components

The server logs from these main components:

- **Server**: Main server operations and tool handlers
- **Database**: SQLite operations and state persistence
- **ConversationManager**: Conversation context and state management
- **TransitionEngine**: Phase transition analysis
- **InstructionGenerator**: Instruction generation
- **PlanManager**: Plan file operations

## Usage Examples

### Development with Debug Logging
```bash
LOG_LEVEL=DEBUG npx tsx src/index.ts
```

### Production with Info Logging
```bash
LOG_LEVEL=INFO node dist/index.js
```

### Testing with Debug Logging
```bash
LOG_LEVEL=DEBUG npm test
```

## Log Context

Logs include contextual information such as:

- **conversationId**: Unique conversation identifier
- **currentPhase**: Development phase (requirements, design, etc.)
- **projectPath**: Absolute path to the project
- **gitBranch**: Current git branch
- **operation**: Specific operation being performed
- **error**: Error details when applicable

## Debugging Common Issues

### Database Issues
Look for logs from the `Database` component:
```
[timestamp] ERROR [Database] Failed to initialize database
```

### Phase Transition Issues  
Check logs from `TransitionEngine` and tool handlers:
```
[timestamp] DEBUG [Server:whats_next] Phase transition analyzed
[timestamp] INFO [Server:whats_next] Phase transition completed
```

### Plan File Issues
Monitor `PlanManager` logs:
```
[timestamp] DEBUG [PlanManager] Plan file ensured
[timestamp] WARN [PlanManager] Plan file not found, creating default
```

## Integration with MCP Inspector

When using the MCP Inspector for debugging, set debug logging to see detailed protocol interactions:

```bash
LOG_LEVEL=DEBUG npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

## Performance Monitoring

Use INFO level logging in production to monitor:
- Tool execution success/failure rates
- Database operation performance
- Phase transition patterns
- Error frequencies

The logging system provides comprehensive visibility into the server's operation while maintaining performance through configurable log levels.
