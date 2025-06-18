# System Prompt Generation

This document explains how to generate system prompts for the vibe-feature-mcp server.

## Overview

The vibe-feature-mcp server provides a system prompt generator that creates instructions for LLMs to properly integrate with the server. The generator supports two formats:

1. **Verbose**: A comprehensive system prompt with detailed instructions and examples
2. **Simple**: A concise system prompt with essential instructions only

## Usage

### Basic Usage

```bash
# Generate the default (verbose) system prompt
npm run generate-system-prompt

# The prompt will be saved to SYSTEM_PROMPT.md
```

### Selecting Prompt Type

```bash
# Generate the verbose system prompt
npm run generate-system-prompt:verbose

# Generate the simple system prompt
npm run generate-system-prompt:simple
```

### Custom Output Path

```bash
# Specify a custom output path
npm run generate-system-prompt -- --output=path/to/output.md

# Combine type and output path
npm run generate-system-prompt -- --type=simple --output=path/to/simple-prompt.md
```

## Command Line Options

The generator supports the following command line options:

- `--type=<verbose|simple>`: Select the prompt type (default: verbose)
- `--output=<path>`: Specify the output file path (default: SYSTEM_PROMPT.md)

## Prompt Types

### Verbose Prompt

The verbose prompt includes:

- Comprehensive phase descriptions
- Detailed transition instructions
- Multiple examples for each concept
- Extensive guidelines for error handling
- Complete conversation context guidelines

This is ideal for LLMs that benefit from detailed instructions or when implementing complex features.

### Simple Prompt

The simple prompt includes:

- Concise phase descriptions
- Essential transition instructions
- Minimal examples focused on core workflow
- Streamlined guidelines

This is ideal for LLMs with limited context windows or when you need a more concise integration.

## Implementation Details

The system prompt is generated from the state machine definition to ensure accuracy and consistency. The generator:

1. Extracts phase descriptions from the state machine
2. Generates appropriate instructions for each phase
3. Creates transition information based on the state machine
4. Formats everything into a comprehensive or simple prompt

## Examples

### Generate Verbose Prompt to Custom Path

```bash
npm run generate-system-prompt -- --type=verbose --output=.amazonq/rules/verbose-prompt.md
```

### Generate Simple Prompt to Custom Path

```bash
npm run generate-system-prompt -- --type=simple --output=.amazonq/rules/simple-prompt.md
```

### Generate Default Prompt

```bash
npm run generate-system-prompt
```
