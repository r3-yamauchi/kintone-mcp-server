# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start server**: `npm start` (runs `node server.js`)
- **Install dependencies**: `npm i`
- **Node.js requirement**: Version 18 or higher
- **Test**: Currently not implemented (`npm test` will fail)

## Quick Setup

1. Copy `.env.sample` to `.env`
2. Set your kintone credentials:
   ```
   KINTONE_DOMAIN=your-domain.cybozu.com
   KINTONE_USERNAME=your-username
   KINTONE_PASSWORD=your-password
   ```
3. Run `npm install` then `npm start`

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

- **Records**: CRUD operations on kintone records (note: delete intentionally excluded for safety)
- **Apps**: App creation, field management, deployment
- **Spaces**: Space and thread management
- **Fields**: Field configuration and validation
- **Files**: Upload/download operations (note: 1MB+ downloads not supported)
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
- **File access**: Never access files outside the project directory

## Adding New Tools

1. Create tool definition in `src/server/tools/definitions/CategoryToolDefinitions.js`
2. Implement tool logic in `src/server/tools/CategoryTools.js`
3. Update repository class if new API methods needed
4. Add routing in `ToolRequestHandler.js`
5. Follow existing patterns for consistency

## kintone Specific Constraints

- **Lookup fields**: Implemented as base field type + lookup attribute
- **Calculated fields**: Only kintone standard functions supported
- **File size limit**: Download limited to 1MB per file
- **Rate limits**: Be mindful of kintone API rate limits
- **Field type documentation**: See `src/server/tools/documentation/` for detailed field info

## Important Notes

- **Version management**: Update version in both `package.json` AND `MCPServer.js`
- **No delete operations**: Intentionally excluded for data safety
- **Test framework**: Not yet implemented, future addition planned
- **Batch operations**: JSON-RPC batching planned but not yet implemented

## Project Documentation

- **Architecture details**: `docs/mcp-server-architecture.md`
- **Coding standards**: `clinerules-bank/01-coding-standards.md`
- **Implementation status**: `docs/implementation-status.md`
- **MCP specifications**: `docs/mcp-specification/`
- **Future plans**: See `clinerules-bank/` for implementation plans

## Troubleshooting

- **Connection errors**: Check credentials in `.env` file
- **API errors**: Verify kintone app permissions and field configurations
- **Tool not found**: Ensure tool is properly registered in definitions and handler
- **Version mismatch**: Update both `package.json` and `MCPServer.js` versions