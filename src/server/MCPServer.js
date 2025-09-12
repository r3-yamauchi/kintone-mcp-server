// src/server/MCPServer.js
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { KintoneCredentials } from '../models/KintoneCredentials.js';
import { KintoneRepository } from '../repositories/KintoneRepository.js';
import { executeToolRequest } from './handlers/ToolRequestHandler.js';
import { allToolDefinitions } from './tools/definitions/index.js';

export class MCPServer {
    constructor(domain, username, password) {
        this.credentials = new KintoneCredentials(domain, username, password);
        this.repository = new KintoneRepository(this.credentials);
        
        this.server = new Server(
            {
                name: 'kintonemcp',
                version: '7.3.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );
        
        this.setupRequestHandlers();
        
        // エラーハンドリング
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    
    setupRequestHandlers() {
        // ツール一覧を返すハンドラー
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: allToolDefinitions
        }));
        
        // ツールリクエストを実行するハンドラー
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            return executeToolRequest(request, this.repository);
        });
    }
    
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('kintone MCP server running on stdio');
    }
}
