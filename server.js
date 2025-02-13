#!/usr/bin/env node
import { KintoneRestAPIClient, KintoneRestAPIError } from '@kintone/rest-api-client';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} from '@modelcontextprotocol/sdk/types.js';

// ドメインモデル
class KintoneCredentials {
    constructor(domain, username, password) {
        this.domain = domain;
        this.username = username;
        this.password = password;
        this.auth = Buffer.from(`${username}:${password}`).toString('base64');
    }
}

class KintoneRecord {
    constructor(appId, recordId, fields) {
        this.appId = appId;
        this.recordId = recordId;
        this.fields = fields;
    }
}

// リポジトリクラス（npmパッケージ @kintone/rest-api-client を使用）
class KintoneRepository {
    constructor(credentials) {
        this.credentials = credentials;
        this.client = new KintoneRestAPIClient({
            baseUrl: `https://${credentials.domain}`,
            auth: {
                username: credentials.username,
                password: credentials.password,
            },
        });
    }

    // エラーハンドリングを共通化
    handleKintoneError(error, operation) {
        if (error instanceof KintoneRestAPIError) {
            console.error('Kintone API Error:', {
                status: error.status,
                code: error.code,
                message: error.message,
                errors: error.errors,
            });
            throw new Error(`Kintone API Error: ${error.code} - ${error.message}`);
        }
        console.error('Unexpected Error:', error);
        throw new Error(`Failed to ${operation}: ${error.message}`);
    }

    async getRecord(appId, recordId) {
        try {
            console.error(`Fetching record: ${appId}/${recordId}`);
            const response = await this.client.record.getRecord({
                app: appId,
                id: recordId,
            });
            console.error('Response:', response);
            return new KintoneRecord(appId, recordId, response.record);
        } catch (error) {
            this.handleKintoneError(error, `get record ${appId}/${recordId}`);
        }
    }

    async searchRecords(appId, query, fields = []) {
        try {
            const params = { app: appId };
            if (query) {
                params.condition = query;
            }
            if (fields.length > 0) {
                params.fields = fields;
            }
            console.error(`Searching records: ${appId}`);
            console.error(`Request data:`, params);
            
            const records = await this.client.record.getAllRecords(params);
            console.error(`Found ${records.length} records`);
            
            return records.map((record) => {
                const recordId = record.$id.value || 'unknown';
                return new KintoneRecord(appId, recordId, record);
            });
        } catch (error) {
            this.handleKintoneError(error, `search records ${appId}`);
        }
    }

    async createRecord(appId, fields) {
        try {
            console.error(`Creating record in app: ${appId}`);
            const response = await this.client.record.addRecord({
                app: appId,
                record: fields,
            });
            return response.id;
        } catch (error) {
            this.handleKintoneError(error, `create record in app ${appId}`);
        }
    }

    async updateRecord(record) {
        try {
            console.error(`Updating record: ${record.appId}/${record.recordId}`);
            const response = await this.client.record.updateRecord({
                app: record.appId,
                id: record.recordId,
                record: record.fields
            });
            console.error('Update response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `update record ${record.appId}/${record.recordId}`);
        }
    }

    async getAppsInfo(appName) {
        try {
            console.error(`Fetching apps info: ${appName}`);
            const response = await this.client.app.getApps({
                name: appName,
            });
            console.error('Response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get apps info ${appName}`);
        }
    }

    async uploadFile(fileName, fileData) {
        try {
            console.error(`Uploading file: ${fileName}`);
            const buffer = Buffer.from(fileData, 'base64');
            const response = await this.client.file.uploadFile({
                file: {
                    name: fileName,
                    data: buffer
                }
            });
            console.error('File upload response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `upload file ${fileName}`);
        }
    }

    async downloadFile(fileKey) {
        try {
            console.error(`Downloading file with key: ${fileKey}`);
            const response = await this.client.file.downloadFile({ fileKey: fileKey });
            console.error('File download response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `download file with key ${fileKey}`);
        }
    }

    async addRecordComment(appId, recordId, text, mentions = []) {
        try {
            console.error(`Adding comment to record: ${appId}/${recordId}`);
            const response = await this.client.record.addRecordComment({
                app: appId,
                record: recordId,
                comment: {
                    text: text,
                    mentions: mentions
                }
            });
            console.error('Comment added:', response);
            return response.id;
        } catch (error) {
            this.handleKintoneError(error, `add comment to record ${appId}/${recordId}`);
        }
    }
}

class KintoneMCPServer {
    constructor() {
        this.server = new Server(
            {
                name: 'kintone-mcp-server',
                version: '2.0.0',
            },
            {
                capabilities: {
                    tools: {
                        get_record: {
                            description: 'kintoneアプリの1レコードを取得します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    app_id: {
                                        type: 'number',
                                        description: 'kintoneアプリのID',
                                    },
                                    record_id: {
                                        type: 'number',
                                        description: 'レコードID',
                                    },
                                },
                                required: ['app_id', 'record_id'],
                            },
                        },
                        search_records: {
                            description: 'kintoneアプリのレコードを検索します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    app_id: {
                                        type: 'number',
                                        description: 'kintoneアプリのID',
                                    },
                                    query: {
                                        type: 'string',
                                        description: '検索クエリ',
                                    },
                                    fields: {
                                        type: 'array',
                                        items: {
                                            type: 'string',
                                        },
                                        description: '取得するフィールド名の配列',
                                    },
                                },
                                required: ['app_id'],
                            },
                        },
                        create_record: {
                            description: 'kintoneアプリに新しいレコードを作成します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    app_id: {
                                        type: 'number',
                                        description: 'kintoneアプリのID',
                                    },
                                    fields: {
                                        type: 'object',
                                        description: 'レコードのフィールド値',
                                    },
                                },
                                required: ['app_id', 'fields'],
                            },
                        },
                        update_record: {
                            description: 'kintoneアプリの既存レコードを更新します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    app_id: {
                                        type: 'number',
                                        description: 'kintoneアプリのID',
                                    },
                                    record_id: {
                                        type: 'number',
                                        description: 'レコードID',
                                    },
                                    fields: {
                                        type: 'object',
                                        description: '更新するフィールド値',
                                    },
                                },
                                required: ['app_id', 'record_id', 'fields'],
                            },
                        },
                        get_apps_info: {
                            description: '検索キーワードを指定して該当する複数のkintoneアプリの情報を取得します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    app_name: {
                                        type: 'string',
                                        description: 'アプリ名またはその一部',
                                    },
                                },
                                required: ['app_name'],
                            },
                        },
                        download_file: {
                            description: 'kintoneアプリからファイルをダウンロードします',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    file_key: {
                                        type: 'string',
                                        description: 'ダウンロードするファイルのキー',
                                    },
                                },
                                required: ['file_key'],
                            },
                        },
                        upload_file: {
                            description: 'kintoneアプリにファイルをアップロードします',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    file_name: {
                                        type: 'string',
                                        description: 'アップロードするファイルの名前',
                                    },
                                    file_data: {
                                        type: 'string',
                                        description: 'Base64エンコードされたファイルデータ',
                                    },
                                },
                                required: ['file_name', 'file_data'],
                            },
                        },
                        add_comment: {
                            description: 'kintoneレコードにコメントを追加します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    app_id: {
                                        type: 'number',
                                        description: 'kintoneアプリのID',
                                    },
                                    record_id: {
                                        type: 'number',
                                        description: 'レコードID',
                                    },
                                    text: {
                                        type: 'string',
                                        description: 'コメント本文',
                                    },
                                    mentions: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                code: {
                                                    type: 'string',
                                                    description: 'メンション対象のユーザー、グループ、組織のコード',
                                                },
                                                type: {
                                                    type: 'string',
                                                    enum: ['USER', 'GROUP', 'ORGANIZATION'],
                                                    description: 'メンション対象の種類',
                                                }
                                            },
                                            required: ['code', 'type']
                                        },
                                        description: 'メンション情報の配列',
                                    }
                                },
                                required: ['app_id', 'record_id', 'text'],
                            },
                        },
                    },
                },
            }
        );

        // 環境変数のバリデーション
        const requiredEnvVars = ['KINTONE_DOMAIN', 'KINTONE_USERNAME', 'KINTONE_PASSWORD'];
        const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]?.trim());

        if (missingEnvVars.length > 0) {
            throw new Error('Missing or empty required environment variables: ' + missingEnvVars.join(', '));
        }

        this.credentials = new KintoneCredentials(
            process.env.KINTONE_DOMAIN,
            process.env.KINTONE_USERNAME,
            process.env.KINTONE_PASSWORD
        );

        this.repository = new KintoneRepository(this.credentials);

        this.setupRequestHandlers();

        // エラーハンドリング
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }

    setupRequestHandlers() {
        // ツール一覧の取得
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'get_record',
                    description: 'kintoneアプリの1レコードを取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'kintoneアプリのID',
                            },
                            record_id: {
                                type: 'number',
                                description: 'レコードID',
                            },
                        },
                        required: ['app_id', 'record_id'],
                    },
                },
                {
                    name: 'search_records',
                    description: 'kintoneアプリのレコードを検索します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'kintoneアプリのID',
                            },
                            query: {
                                type: 'string',
                                description: '検索クエリ',
                            },
                            fields: {
                                type: 'array',
                                items: {
                                    type: 'string',
                                },
                                description: '取得するフィールド名の配列',
                            },
                        },
                        required: ['app_id'],
                    },
                },
                {
                    name: 'create_record',
                    description: 'kintoneアプリに新しいレコードを作成します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'kintoneアプリのID',
                            },
                            fields: {
                                type: 'object',
                                description: 'レコードのフィールド値',
                            },
                        },
                        required: ['app_id', 'fields'],
                    },
                },
                {
                    name: 'update_record',
                    description: 'kintoneアプリの既存レコードを更新します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'kintoneアプリのID',
                            },
                            record_id: {
                                type: 'number',
                                description: 'レコードID',
                            },
                            fields: {
                                type: 'object',
                                description: '更新するフィールド値',
                            },
                        },
                        required: ['app_id', 'record_id', 'fields'],
                    },
                },
                {
                    name: 'get_apps_info',
                    description: '検索キーワードを指定して該当する複数のkintoneアプリの情報を取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_name: {
                                type: 'string',
                                description: 'アプリ名またはその一部',
                            },
                        },
                        required: ['app_name'],
                    },
                },
                {
                    name: 'download_file',
                    description: 'kintoneアプリからファイルをダウンロードします',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            file_key: {
                                type: 'string',
                                description: 'ダウンロードするファイルのキー',
                            },
                        },
                        required: ['file_key'],
                    },
                },
                {
                    name: 'upload_file',
                    description: 'kintoneアプリにファイルをアップロードします',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            file_name: {
                                type: 'string',
                                description: 'アップロードするファイルの名前',
                            },
                            file_data: {
                                type: 'string',
                                description: 'Base64エンコードされたファイルデータ',
                            },
                        },
                        required: ['file_name', 'file_data'],
                    },
                },
                {
                    name: 'add_comment',
                    description: 'kintoneレコードにコメントを追加します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'kintoneアプリのID',
                            },
                            record_id: {
                                type: 'number',
                                description: 'レコードID',
                            },
                            text: {
                                type: 'string',
                                description: 'コメント本文',
                            },
                            mentions: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        code: {
                                            type: 'string',
                                            description: 'メンション対象のユーザー、グループ、組織のコード',
                                        },
                                        type: {
                                            type: 'string',
                                            enum: ['USER', 'GROUP', 'ORGANIZATION'],
                                            description: 'メンション対象の種類',
                                        }
                                    },
                                    required: ['code', 'type']
                                },
                                description: 'メンション情報の配列',
                            }
                        },
                        required: ['app_id', 'record_id', 'text'],
                    },
                },
            ],
        }));

        // ツールの実行
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                console.error('Tool request:', {
                    name: request.params.name,
                    arguments: request.params.arguments,
                });

                const result = await this.executeToolRequest(request);
                return this.formatSuccessResponse(result);

            } catch (error) {
                console.error('Error in tool execution:', error);
                this.handleToolError(error);
            }
        });
    }

    // ツールリクエストの実行を担当
    async executeToolRequest(request) {
        const { name, arguments: args } = request.params;

        switch (name) {
            case 'get_record': {
                const record = await this.repository.getRecord(args.app_id, args.record_id);
                return record.fields;  // KintoneRecord ではなく fields を返す
            }
            case 'search_records':
                const records = await this.repository.searchRecords(
                    args.app_id,
                    args.query,
                    args.fields
                );
                return records.map(r => r.fields);

            case 'create_record':
                const recordId = await this.repository.createRecord(
                    args.app_id,
                    args.fields
                );
                return { record_id: recordId };

            case 'update_record':
                const response = await this.repository.updateRecord(
                    new KintoneRecord(
                        args.app_id,
                        args.record_id,
                        args.fields
                    )
                );
                return { success: true, revision: response.revision };

            case 'get_apps_info':
                return this.repository.getAppsInfo(args.app_name);

            case 'upload_file':
                const uploadResponse = await this.repository.uploadFile(
                    args.file_name,
                    args.file_data
                );
                return { file_key: uploadResponse.fileKey };

            case 'download_file':
                const fileData = await this.repository.downloadFile(
                    args.file_key
                );
                return fileData;

            case 'add_comment': {
                const commentId = await this.repository.addRecordComment(
                    args.app_id,
                    args.record_id,
                    args.text,
                    args.mentions || []
                );
                return { comment_id: commentId };
            }

            default:
                throw new McpError(
                    ErrorCode.MethodNotFound,
                    `Unknown tool: ${name}`
                );
        }
    }

    // 成功レスポンスのフォーマット
    formatSuccessResponse(result) {
        // ファイルダウンロードの場合は特別な処理
        if (Buffer.isBuffer(result)) {
            return {
                content: [
                    {
                        type: 'text',
                        text: result.toString('base64'),
                    },
                ],
            };
        }

        // 通常のレスポンス
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    }

    // エラーハンドリング
    handleToolError(error) {
        let errorCode = ErrorCode.InternalError;
        let errorMessage = error.message;

        if (error instanceof McpError) {
            throw error;
        } else if (error instanceof KintoneRestAPIError) {
            // Kintone API のエラーコードに応じて適切な MCP エラーコードを設定
            errorCode = error.status >= 500 ? 
                ErrorCode.InternalError : 
                ErrorCode.InvalidRequest;
        }

        throw new McpError(errorCode, errorMessage);
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Kintone MCP server running on stdio');
    }
}

// サーバーの起動
const server = new KintoneMCPServer();
server.run().catch(console.error);

export {
    KintoneCredentials,
    KintoneRecord,
    KintoneRepository,
    KintoneMCPServer
};
