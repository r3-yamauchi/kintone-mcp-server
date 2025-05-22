# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start server**: `npm start` (runs `node server.js`)
- **Install dependencies**: `npm i`
- **Node.js requirement**: Version 18 or higher

## Architecture Overview

This is a Model Context Protocol (MCP) server for kintone integration. The codebase follows a modular architecture with clear separation between tool definitions and implementations.

### Core Structure

- **Entry point**: `server.js` → `src/index.js`
- **Main server**: `src/server/MCPServer.js` - Initializes MCP server with kintone credentials
- **Tool orchestration**: `src/server/handlers/ToolRequestHandler.js` - Routes tool requests to appropriate handlers
- **Tool implementations**: `src/server/tools/` - Contains actual tool logic organized by category
- **Tool definitions**: `src/server/tools/definitions/` - Contains MCP tool schemas and metadata

### Tool Categories

The server provides 47 tools across 9 categories:

- **Records**: CRUD operations on kintone records
- **Apps**: App creation, field management, deployment
- **Spaces**: Space and thread management
- **Fields**: Field configuration and validation
- **Files**: Upload/download operations
- **Layout**: Form layout management
- **Users**: User and group information
- **System**: Connection info and diagnostics
- **Documentation**: Field type documentation

### Repository Pattern

All kintone API interactions go through repository classes in `src/repositories/`:

- `KintoneRepository.js` - Main repository orchestrator
- Category-specific repositories inherit from `BaseKintoneRepository.js`
- Uses `@kintone/rest-api-client` for API communication

### Configuration

- Environment variables: `KINTONE_DOMAIN`, `KINTONE_USERNAME`, `KINTONE_PASSWORD`
- Falls back to `.env` file if environment variables not set
- Credentials managed through `KintoneCredentials.js` model

### Tool Annotations

All tools include MCP 2025-03-26 specification annotations:

- `readOnly`: Whether tool modifies data
- `safe`: Risk level of operation
- `category`: Functional grouping
- `requiresConfirmation`: Whether user confirmation recommended
- `longRunning`: Execution time expectations
- `impact`: Operation impact level (low/medium/high)

## Coding Standards

- **Language**: ES modules with `type: "module"` in package.json
- **Async**: Use async/await consistently
- **Naming**: PascalCase for classes, camelCase for methods/variables
- **Error handling**: Provide meaningful error messages and types
- **No code duplication**: Abstract common functionality into utilities
- **Comments**: Explain complex logic, use Japanese for user-facing messages
