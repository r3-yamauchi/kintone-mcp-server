// src/server/MCPServer.js
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListPromptsRequestSchema,
    ListResourcesRequestSchema,
    GetPromptRequestSchema,
    ListResourceTemplatesRequestSchema,
    ReadResourceRequestSchema,
    McpError,
    ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import { KintoneCredentials } from '../models/KintoneCredentials.js';
import { KintoneRepository } from '../repositories/KintoneRepository.js';
import { executeToolRequest } from './handlers/ToolRequestHandler.js';
import { allToolDefinitions } from './tools/definitions/index.js';
import { LoggingUtils } from '../utils/LoggingUtils.js';

export class MCPServer {
    constructor(domain, username, password) {
        this.credentials = new KintoneCredentials(domain, username, password);
        this.repository = new KintoneRepository(this.credentials);
        
        this.server = new Server(
            {
                name: 'kintonemcp',
                version: '8.0.0',
            },
            {
                capabilities: {
                    tools: {},
                    prompts: {},
                    resources: {},
                },
            }
        );
        
        this.setupRequestHandlers();
        
        // エラーハンドリング
        this.server.onerror = (error) => LoggingUtils.error('server', 'mcp_server_error', error);
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
        
        // プロンプト一覧（未提供のため空配列）
        this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
            prompts: []
        }));
        this.server.setRequestHandler(GetPromptRequestSchema, async () => {
            throw new McpError(ErrorCode.MethodNotFound, 'promptは提供されていません');
        });

        // リソース一覧（未提供のため空配列）
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
            resources: []
        }));
        this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
            resourceTemplates: []
        }));
        this.server.setRequestHandler(ReadResourceRequestSchema, async () => {
            throw new McpError(ErrorCode.MethodNotFound, 'resourceは提供されていません');
        });
        
        // ツールリクエストを実行するハンドラー
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            return executeToolRequest(request, this.repository);
        });
    }
    
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        LoggingUtils.info('server', 'mcp_server_running');
    }
}
