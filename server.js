#!/usr/bin/env node
import axios from 'axios';
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

// リポジトリクラス
class KintoneRepository {
    constructor(credentials) {
        this.credentials = credentials;
        this.baseUrl = `https://${credentials.domain}`;
        this.headers = {
            'X-Cybozu-Authorization': this.credentials.auth,
            'Content-Type': 'application/json'
        };
    }

    async getRecord(appId, recordId) {
        try {
            // デバッグ用のログ
            console.error(`Fetching record: ${appId}/${recordId}`);
            console.error(`URL: ${this.baseUrl}/k/v1/record.json`);

            const headers = {
                ...this.headers,
                'X-HTTP-Method-Override': 'GET'
            };
            console.error(`Headers:`, headers);

            const response = await axios.post(`${this.baseUrl}/k/v1/record.json`, {
                app: appId,
                id: recordId
            }, {
                headers: headers
            });

            // デバッグ用のログ
            console.error('Response:', response.data);

            return new KintoneRecord(appId, recordId, response.data.record);
        } catch (error) {
            // エラー詳細のログ
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers
            });
            throw new Error(`Failed to get record: ${error.message}`);
        }
    }

    async searchRecords(appId, query, fields = []) {
        try {
            const requestData = {
                app: appId,
            };

            if (query) {
                requestData.query = query;
            }

            if (fields.length > 0) {
                requestData.fields = fields;
            }

            // デバッグ用のログ
            console.error(`Searching records: ${appId}`);
            console.error(`Request data:`, requestData);

            const headers = {
                ...this.headers,
                'X-HTTP-Method-Override': 'GET'
            };

            const response = await axios.post(`${this.baseUrl}/k/v1/records.json`,
                requestData,
                { headers: headers }
            );

            return response.data.records.map(record => {
                // レコードIDの取得（undefinedの場合は'unknown'を使用）
                const recordId = record?.$id?.value || 'unknown';
                return new KintoneRecord(appId, recordId, record);
            });
        } catch (error) {
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw new Error(`Failed to search records: ${error.message}`);
        }
    }

    async createRecord(appId, fields) {
        try {
            // デバッグ用のログ
            console.error(`Creating record in app: ${appId}`);
            console.error(`Fields:`, fields);

            const response = await axios.post(`${this.baseUrl}/k/v1/record.json`, {
                app: appId,
                record: fields
            }, {
                headers: this.headers
            });
            return response.data.id;
        } catch (error) {
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw new Error(`Failed to create record: ${error.message}`);
        }
    }

    async updateRecord(record) {
        try {
            // デバッグ用のログ
            console.error(`Updating record: ${record.appId}/${record.recordId}`);
            console.error(`Fields:`, record.fields);

            await axios.put(`${this.baseUrl}/k/v1/record.json`, {
                app: record.appId,
                id: record.recordId,
                record: record.fields
            }, {
                headers: this.headers
            });
        } catch (error) {
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw new Error(`Failed to update record: ${error.message}`);
        }
    }

    async getAppsInfo(appName) {
        try {
            // デバッグ用のログ
            console.error(`Fetching apps info: ${appName}`);
            console.error(`URL: ${this.baseUrl}/k/v1/apps.json`);

            const headers = {
                ...this.headers,
                'X-HTTP-Method-Override': 'GET'
            };
            console.error(`Headers:`, headers);

            const response = await axios.post(`${this.baseUrl}/k/v1/apps.json`, {
                name: appName
            }, {
                headers: headers
            });

            // デバッグ用のログ
            console.error('Response:', response.data);

            return response.data;
        } catch (error) {
            // エラー詳細のログ
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers
            });
            throw new Error(`Failed to get apps info: ${error.message}`);
        }
    }

    async uploadFile(fileName, fileData) {
        try {
            // デバッグ用のログ
            console.error(`Uploading file: ${fileName}`);

            const headers = {
                ...this.headers,
                'Content-Type': 'application/json'
            };

            const response = await axios.post(`${this.baseUrl}/k/v1/file.json`, {
                file: {
                    name: fileName,
                    data: fileData
                }
            }, {
                headers: headers
            });

            // デバッグ用のログ
            console.error('File upload response:', response.data);

            return response.data;
        } catch (error) {
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    async downloadFile(fileKey) {
        try {
            // デバッグ用のログ
            console.error(`Downloading file with key: ${fileKey}`);

            const headers = {
                ...this.headers,
                'X-HTTP-Method-Override': 'GET'
            };

            const response = await axios.post(`${this.baseUrl}/k/v1/file.json`, {
                fileKey: fileKey
            }, {
                headers: headers,
                responseType: 'arraybuffer' // バイナリデータを取得
            });

            // デバッグ用のログ
            console.error('File download response:', response);

            return response.data;
        } catch (error) {
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw new Error(`Failed to download file: ${error.message}`);
        }
    }

}

class KintoneMCPServer {
    constructor() {
        this.server = new Server(
            {
                name: 'kintone-mcp-server',
                version: '0.1.0',
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
                    },
                },
            }
        );

        // 環境変数のバリデーション
        const requiredEnvVars = ['KINTONE_DOMAIN', 'KINTONE_USERNAME', 'KINTONE_PASSWORD'];
        const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

        if (missingEnvVars.length > 0) {
            throw new Error('Missing required environment variables: ' + missingEnvVars.join(', '));
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
            ],
        }));

        // ツールの実行
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                // デバッグ用のログ
                console.error('Tool request:', {
                    name: request.params.name,
                    arguments: request.params.arguments
                });

                switch (request.params.name) {
                    case 'get_record': {
                        const record = await this.repository.getRecord(
                            request.params.arguments.app_id,
                            request.params.arguments.record_id
                        );
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(record.fields, null, 2),
                                },
                            ],
                        };
                    }

                    case 'search_records': {
                        const records = await this.repository.searchRecords(
                            request.params.arguments.app_id,
                            request.params.arguments.query,
                            request.params.arguments.fields
                        );
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(
                                        records.map((r) => r.fields),
                                        null,
                                        2
                                    ),
                                },
                            ],
                        };
                    }

                    case 'create_record': {
                        const recordId = await this.repository.createRecord(
                            request.params.arguments.app_id,
                            request.params.arguments.fields
                        );
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify({ record_id: recordId }, null, 2),
                                },
                            ],
                        };
                    }

                    case 'update_record': {
                        await this.repository.updateRecord(
                            new KintoneRecord(
                                request.params.arguments.app_id,
                                request.params.arguments.record_id,
                                request.params.arguments.fields
                            )
                        );
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify({ success: true }, null, 2),
                                },
                            ],
                        };
                    }

                    case 'get_apps_info': {
                        const appsInfo = await this.repository.getAppsInfo(
                            request.params.arguments.app_name
                        );
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(appsInfo, null, 2),
                                },
                            ],
                        };
                    }

                    case 'upload_file': {
                        const response = await this.repository.uploadFile(
                            request.params.arguments.file_name,
                            request.params.arguments.file_data
                        );
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify({ file_key: response.fileKey }, null, 2),
                                },
                            ],
                        };
                    }

                    case 'download_file': {
                        const fileData = await this.repository.downloadFile(
                            request.params.arguments.file_key
                        );
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: fileData.toString('base64'),
                                },
                            ],
                        };
                    }

                    default:
                        throw new McpError(
                            ErrorCode.MethodNotFound,
                            `Unknown tool: ${request.params.name}`
                        );
                }
            } catch (error) {
                console.error('Error in tool execution:', error);
                throw new McpError(
                    ErrorCode.InternalError,
                    error.message
                );
            }
        });
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
