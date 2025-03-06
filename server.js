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

    async getSpace(spaceId) {
        try {
            console.error(`Fetching space: ${spaceId}`);
            const response = await this.client.space.getSpace({ id: spaceId });
            console.error('Response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get space ${spaceId}`);
        }
    }

    async updateSpace(spaceId, settings) {
        try {
            console.error(`Updating space: ${spaceId}`);
            await this.client.space.updateSpace({
                id: spaceId,
                ...settings
            });
        } catch (error) {
            this.handleKintoneError(error, `update space ${spaceId}`);
        }
    }

    async updateSpaceBody(spaceId, body) {
        try {
            console.error(`Updating space body: ${spaceId}`);
            await this.client.space.updateSpaceBody({
                id: spaceId,
                body: body
            });
        } catch (error) {
            this.handleKintoneError(error, `update space body ${spaceId}`);
        }
    }

    async getSpaceMembers(spaceId) {
        try {
            console.error(`Fetching space members: ${spaceId}`);
            const response = await this.client.space.getSpaceMembers({ id: spaceId });
            console.error('Response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get space members ${spaceId}`);
        }
    }

    async updateSpaceMembers(spaceId, members) {
        try {
            console.error(`Updating space members: ${spaceId}`);
            await this.client.space.updateSpaceMembers({
                id: spaceId,
                members: members
            });
        } catch (error) {
            this.handleKintoneError(error, `update space members ${spaceId}`);
        }
    }

    async addThread(spaceId, name) {
        try {
            console.error(`Adding thread to space: ${spaceId}`);
            const response = await this.client.space.addThread({
                space: spaceId,
                name: name
            });
            console.error('Response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `add thread to space ${spaceId}`);
        }
    }

    async updateThread(threadId, params) {
        try {
            console.error(`Updating thread: ${threadId}`);
            await this.client.space.updateThread({
                id: threadId,
                ...params
            });
        } catch (error) {
            this.handleKintoneError(error, `update thread ${threadId}`);
        }
    }

    async addThreadComment(spaceId, threadId, comment) {
        try {
            console.error(`Adding comment to thread: ${threadId}`);
            const response = await this.client.space.addThreadComment({
                space: spaceId,
                thread: threadId,
                comment: comment
            });
            console.error('Response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `add comment to thread ${threadId}`);
        }
    }

    async addGuests(guests) {
        try {
            console.error(`Adding guests:`, guests);
            await this.client.space.addGuests({ guests });
        } catch (error) {
            this.handleKintoneError(error, 'add guests');
        }
    }

    async updateSpaceGuests(spaceId, guests) {
        try {
            console.error(`Updating space guests: ${spaceId}`);
            await this.client.space.updateSpaceGuests({
                id: spaceId,
                guests: guests
            });
        } catch (error) {
            this.handleKintoneError(error, `update space guests ${spaceId}`);
        }
    }

    async createApp(name, space = null, thread = null) {
        try {
            console.error(`Creating new app: ${name}`);
            const params = { name };
            if (space) params.space = space;
            if (thread) params.thread = thread;

            const response = await this.client.app.addApp(params);
            console.error('App creation response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `create app ${name}`);
        }
    }

    // フィールドコードのバリデーション
    validateFieldCode(fieldCode) {
        const validPattern = /^[a-zA-Z0-9ぁ-んァ-ヶー一-龠々＿_･・＄￥]+$/;
        if (!validPattern.test(fieldCode)) {
            throw new Error(
                `フィールドコード "${fieldCode}" に使用できない文字が含まれています。\n\n` +
                '使用可能な文字は以下の通りです：\n' +
                '- ひらがな\n' +
                '- カタカナ（半角／全角）\n' +
                '- 漢字\n' +
                '- 英数字（半角／全角）\n' +
                '- 記号：\n' +
                '  - 半角の「_」（アンダースコア）\n' +
                '  - 全角の「＿」（アンダースコア）\n' +
                '  - 半角の「･」（中黒）\n' +
                '  - 全角の「・」（中黒）\n' +
                '  - 全角の通貨記号（＄や￥など）'
            );
        }
        return true;
    }

    // 選択肢フィールドの定数を追加
    static FIELD_TYPES_REQUIRING_OPTIONS = [
        'CHECK_BOX',
        'RADIO_BUTTON',
        'DROP_DOWN',
        'MULTI_SELECT'
    ];

    // 選択肢フィールドのoptionsバリデーション
    validateOptions(fieldType, options) {
        // 選択肢フィールドの場合のみチェック
        if (!KintoneRepository.FIELD_TYPES_REQUIRING_OPTIONS.includes(fieldType)) {
            return true;
        }

        // optionsの必須チェック
        if (!options) {
            throw new Error(`フィールドタイプ "${fieldType}" には options の指定が必須です。`);
        }

        // optionsの形式チェック
        if (typeof options !== 'object' || Array.isArray(options)) {
            throw new Error('options はオブジェクト形式で指定する必要があります。');
        }

        // 各選択肢のバリデーション
        Object.entries(options).forEach(([key, value]) => {
            // labelの存在チェック
            if (!value.label) {
                throw new Error(`選択肢 "${key}" の label が指定されていません。label に "${key}" という値を指定する必要があります。`);
            }

            // labelと選択肢キーの一致チェック
            if (value.label !== key) {
                throw new Error(`選択肢 "${key}" の label "${value.label}" が一致しません。label に "${key}" という値を指定する必要があります。`);
            }

            // indexの存在チェック
            if (typeof value.index === 'undefined') {
                throw new Error(`選択肢 "${key}" の index が指定されていません。 0以上の数値を指定してください。`);
            }

            // indexが0以上の数値であることのチェック
            if (typeof value.index !== 'number' || value.index < 0 || !Number.isInteger(value.index)) {
                throw new Error(`選択肢 "${key}" の index は 0以上の数値を指定してください。`);
            }
        });

        return true;
    }

    static CALC_FIELD_TYPE = 'CALC';

    validateCalcField(fieldType, expression) {
        if (fieldType === KintoneRepository.CALC_FIELD_TYPE) {
            if (expression === undefined) {
                throw new Error('計算フィールドには expression の指定が必須です。空でない文字列で kintoneで使用できる計算式を指定する必要があります。');
            }
            if (typeof expression !== 'string' || expression.trim() === '') {
                throw new Error('expression は空でない文字列で kintoneで使用できる計算式を指定する必要があります。');
            }
        }
        return true;
    }

    // 静的定数を追加
    static LINK_FIELD_TYPE = 'LINK';
    static VALID_LINK_PROTOCOLS = ['WEB', 'CALL', 'MAIL'];

    // リンクフィールドのバリデーションメソッドを追加
    validateLinkField(fieldType, protocol) {
        if (fieldType === KintoneRepository.LINK_FIELD_TYPE) {
            const msg = `指定可能な値: ${KintoneRepository.VALID_LINK_PROTOCOLS.join(', ')}`;
            if (!protocol) {
                throw new Error(
                    `リンクフィールドには protocol の指定が必須です。\n${msg}`
                );
            }
            if (!KintoneRepository.VALID_LINK_PROTOCOLS.includes(protocol)) {
                throw new Error(
                    `protocol の値が不正です: "${protocol}"\n${msg}`
                );
            }
        }
        return true;
    }

    async addFields(appId, properties) {
        try {
            console.error(`Adding fields to app ${appId}`);
            console.error('Field properties:', properties);

            // フィールドコードの整合性チェックとバリデーション
            for (const [propertyKey, fieldConfig] of Object.entries(properties)) {
                // フィールドコードのバリデーション
                this.validateFieldCode(propertyKey);

                // codeプロパティの存在チェック
                if (!fieldConfig.code) {
                    throw new Error(
                        `フィールド "${propertyKey}" の code プロパティが指定されていません。`
                    );
                }

                // プロパティキーとcodeの一致チェック
                if (fieldConfig.code !== propertyKey) {
                    throw new Error(
                        `フィールドコードの不一致: プロパティキー "${propertyKey}" と ` +
                        `フィールド設定内のcode "${fieldConfig.code}" が一致しません。\n` +
                        `kintone APIの仕様により、これらは完全に一致している必要があります。`
                    );
                }

                // 選択肢フィールドのoptionsバリデーション
                if (fieldConfig.type && fieldConfig.options) {
                    this.validateOptions(fieldConfig.type, fieldConfig.options);
                }

                if (fieldConfig.type) {
                    this.validateCalcField(fieldConfig.type, fieldConfig.expression);
                    this.validateLinkField(fieldConfig.type, fieldConfig.protocol);
                }
            }

            const response = await this.client.app.addFormFields({
                app: appId,
                properties: properties,
                revision: -1 // 最新のリビジョンを使用
            });
            console.error('Field addition response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `add fields to app ${appId}`);
        }
    }

    async deployApp(apps) {
        try {
            console.error(`Deploying apps:`, apps);
            const response = await this.client.app.deployApp({
                apps: apps.map(appId => ({
                    app: appId,
                    revision: -1 // 最新のリビジョンを使用
                }))
            });
            console.error('Deploy response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `deploy apps ${apps.join(', ')}`);
        }
    }

    async getDeployStatus(apps) {
        try {
            console.error(`Checking deploy status for apps:`, apps);
            const response = await this.client.app.getDeployStatus({
                apps: apps
            });
            console.error('Deploy status:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get deploy status for apps ${apps.join(', ')}`);
        }
    }

    async updateAppSettings(appId, settings) {
        try {
            console.error(`Updating app settings for app ${appId}`);
            console.error('Settings:', settings);

            const params = {
                app: appId,
                ...settings
            };

            const response = await this.client.app.updateAppSettings(params);
            console.error('Update response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `update app settings for app ${appId}`);
        }
    }

    async getFormLayout(appId) {
        try {
            console.error(`Fetching form layout for app: ${appId}`);
            const response = await this.client.app.getFormLayout({ app: appId });
            console.error('Form layout response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get form layout for app ${appId}`);
        }
    }

    async updateFormLayout(appId, layout, revision = -1) {
        try {
            console.error(`Updating form layout for app: ${appId}`);
            console.error('Layout:', layout);
            
            const params = {
                app: appId,
                layout: layout,
                revision: revision
            };
            
            const response = await this.client.app.updateFormLayout(params);
            console.error('Update form layout response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `update form layout for app ${appId}`);
        }
    }
}

class KintoneMCPServer {
    constructor() {
        this.server = new Server(
            {
                name: 'kintone-mcp-server',
                version: '3.1.0',
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
                        add_record_comment: {
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
                        get_space: {
                            description: 'スペースの一般情報を取得します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    space_id: {
                                        type: 'string',
                                        description: 'スペースID',
                                    },
                                },
                                required: ['space_id'],
                            },
                        },
                        update_space: {
                            description: 'スペースの設定を更新します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    space_id: {
                                        type: 'string',
                                        description: 'スペースID',
                                    },
                                    name: {
                                        type: 'string',
                                        description: 'スペースの新しい名前',
                                    },
                                    isPrivate: {
                                        type: 'boolean',
                                        description: 'プライベート設定',
                                    },
                                    fixedMember: {
                                        type: 'boolean',
                                        description: 'メンバー固定設定',
                                    },
                                    useMultiThread: {
                                        type: 'boolean',
                                        description: 'マルチスレッド設定',
                                    },
                                },
                                required: ['space_id'],
                            },
                        },
                        update_space_body: {
                            description: 'スペースの本文を更新します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    space_id: {
                                        type: 'string',
                                        description: 'スペースID',
                                    },
                                    body: {
                                        type: 'string',
                                        description: 'スペースの本文（HTML形式）',
                                    },
                                },
                                required: ['space_id', 'body'],
                            },
                        },
                        get_space_members: {
                            description: 'スペースメンバーのリストを取得します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    space_id: {
                                        type: 'string',
                                        description: 'スペースID',
                                    },
                                },
                                required: ['space_id'],
                            },
                        },
                        update_space_members: {
                            description: 'スペースメンバーを更新します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    space_id: {
                                        type: 'string',
                                        description: 'スペースID',
                                    },
                                    members: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                entity: {
                                                    type: 'object',
                                                    properties: {
                                                        type: {
                                                            type: 'string',
                                                            enum: ['USER', 'GROUP', 'ORGANIZATION'],
                                                        },
                                                        code: { type: 'string' },
                                                    },
                                                    required: ['type', 'code'],
                                                },
                                                isAdmin: { type: 'boolean' },
                                                includeSubs: { type: 'boolean' },
                                            },
                                            required: ['entity'],
                                        },
                                    },
                                },
                                required: ['space_id', 'members'],
                            },
                        },
                        add_thread: {
                            description: 'スペースにスレッドを追加します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    space_id: {
                                        type: 'string',
                                        description: 'スペースID',
                                    },
                                    name: {
                                        type: 'string',
                                        description: 'スレッド名',
                                    },
                                },
                                required: ['space_id', 'name'],
                            },
                        },
                        update_thread: {
                            description: 'スレッドを更新します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    thread_id: {
                                        type: 'string',
                                        description: 'スレッドID',
                                    },
                                    name: {
                                        type: 'string',
                                        description: 'スレッドの新しい名前',
                                    },
                                    body: {
                                        type: 'string',
                                        description: 'スレッドの本文（HTML形式）',
                                    },
                                },
                                required: ['thread_id'],
                            },
                        },
                        add_thread_comment: {
                            description: 'スレッドにコメントを追加します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    space_id: {
                                        type: 'string',
                                        description: 'スペースID',
                                    },
                                    thread_id: {
                                        type: 'string',
                                        description: 'スレッドID',
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
                                                code: { type: 'string' },
                                                type: {
                                                    type: 'string',
                                                    enum: ['USER', 'GROUP', 'ORGANIZATION'],
                                                },
                                            },
                                            required: ['code', 'type'],
                                        },
                                    },
                                },
                                required: ['space_id', 'thread_id', 'text'],
                            },
                        },
                        add_guests: {
                            description: 'ゲストユーザーを追加します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    guests: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                name: { type: 'string' },
                                                code: { type: 'string' },
                                                password: { type: 'string' },
                                                timezone: { type: 'string' },
                                                locale: {
                                                    type: 'string',
                                                    enum: ['auto', 'en', 'zh', 'ja'],
                                                },
                                            },
                                            required: ['name', 'code', 'password', 'timezone'],
                                        },
                                    },
                                },
                                required: ['guests'],
                            },
                        },
                        update_space_guests: {
                            description: 'スペースのゲストメンバーを更新します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    space_id: {
                                        type: 'string',
                                        description: 'スペースID',
                                    },
                                    guests: {
                                        type: 'array',
                                        items: {
                                            type: 'string',
                                            description: 'ゲストユーザーのメールアドレス',
                                        },
                                    },
                                },
                                required: ['space_id', 'guests'],
                            },
                        },
                        create_app: {
                            description: '新しいkintoneアプリを作成します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    name: {
                                        type: 'string',
                                        description: 'アプリの名前',
                                    },
                                    space: {
                                        type: 'number',
                                        description: 'スペースID（オプション）',
                                    },
                                    thread: {
                                        type: 'number',
                                        description: 'スレッドID（オプション）',
                                    },
                                },
                                required: ['name'],
                            },
                        },
                        add_fields: {
                            description: 'kintoneアプリにフィールドを追加します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    app_id: {
                                        type: 'number',
                                        description: 'アプリID',
                                    },
                                    properties: {
                                        type: 'object',
                                        description: 'フィールドの設定',
                                    },
                                },
                                required: ['app_id', 'properties'],
                            },
                        },
                        deploy_app: {
                            description: 'kintoneアプリの設定をデプロイ（本番運用開始・運用環境へ反映）します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    apps: {
                                        type: 'array',
                                        items: {
                                            type: 'number',
                                        },
                                        description: 'デプロイ対象のアプリID配列',
                                    },
                                },
                                required: ['apps'],
                            },
                        },
                        get_deploy_status: {
                            description: 'kintoneアプリのデプロイ状態（アプリ設定の運用環境への反映状況）を確認します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    apps: {
                                        type: 'array',
                                        items: {
                                            type: 'number',
                                        },
                                        description: '確認対象のアプリID配列',
                                    },
                                },
                                required: ['apps'],
                            },
                        },
                        update_app_settings: {
                            description: 'kintoneアプリの一般設定を変更します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    app_id: {
                                        type: 'number',
                                        description: 'アプリID',
                                    },
                                    name: {
                                        type: 'string',
                                        description: 'アプリの名前（1文字以上64文字以内）',
                                    },
                                    description: {
                                        type: 'string',
                                        description: 'アプリの説明（10,000文字以内、HTMLタグ使用可）',
                                    },
                                    icon: {
                                        type: 'object',
                                        properties: {
                                            type: {
                                                type: 'string',
                                                enum: ['PRESET', 'FILE'],
                                                description: 'アイコンの種類',
                                            },
                                            key: {
                                                type: 'string',
                                                description: 'PRESTETアイコンの識別子',
                                            },
                                            file: {
                                                type: 'object',
                                                properties: {
                                                    fileKey: {
                                                        type: 'string',
                                                        description: 'アップロード済みファイルのキー',
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    theme: {
                                        type: 'string',
                                        enum: ['WHITE', 'RED', 'GREEN', 'BLUE', 'YELLOW', 'BLACK'],
                                        description: 'デザインテーマ',
                                    },
                                    titleField: {
                                        type: 'object',
                                        properties: {
                                            selectionMode: {
                                                type: 'string',
                                                enum: ['AUTO', 'MANUAL'],
                                                description: 'タイトルフィールドの選択方法',
                                            },
                                            code: {
                                                type: 'string',
                                                description: 'MANUALモード時のフィールドコード',
                                            },
                                        },
                                    },
                                    enableThumbnails: {
                                        type: 'boolean',
                                        description: 'サムネイル表示の有効化',
                                    },
                                    enableBulkDeletion: {
                                        type: 'boolean',
                                        description: 'レコード一括削除の有効化',
                                    },
                                    enableComments: {
                                        type: 'boolean',
                                        description: 'コメント機能の有効化',
                                    },
                                    enableDuplicateRecord: {
                                        type: 'boolean',
                                        description: 'レコード再利用機能の有効化',
                                    },
                                    enableInlineRecordEditing: {
                                        type: 'boolean',
                                        description: 'インライン編集の有効化',
                                    },
                                    numberPrecision: {
                                        type: 'object',
                                        properties: {
                                            digits: {
                                                type: 'string',
                                                description: '全体の桁数（1-30）',
                                            },
                                            decimalPlaces: {
                                                type: 'string',
                                                description: '小数部の桁数（0-10）',
                                            },
                                            roundingMode: {
                                                type: 'string',
                                                enum: ['HALF_EVEN', 'UP', 'DOWN'],
                                                description: '数値の丸めかた',
                                            },
                                        },
                                    },
                                    firstMonthOfFiscalYear: {
                                        type: 'string',
                                        description: '第一四半期の開始月（1-12）',
                                    },
                                },
                                required: ['app_id'],
                            },
                        },
                        get_form_layout: {
                            description: 'kintoneアプリのフォームレイアウトを取得します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    app_id: {
                                        type: 'number',
                                        description: 'kintoneアプリのID',
                                    },
                                },
                                required: ['app_id'],
                            },
                        },
                        update_form_layout: {
                            description: 'kintoneアプリのフォームレイアウトを変更します',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    app_id: {
                                        type: 'number',
                                        description: 'kintoneアプリのID',
                                    },
                                    layout: {
                                        type: 'array',
                                        description: 'フォームのレイアウト情報',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                type: {
                                                    type: 'string',
                                                    enum: ['ROW', 'SUBTABLE', 'GROUP'],
                                                    description: 'レイアウト要素のタイプ',
                                                },
                                                fields: {
                                                    type: 'array',
                                                    description: 'ROWタイプの場合のフィールド配列',
                                                    items: {
                                                        type: 'object',
                                                        properties: {
                                                            type: {
                                                                type: 'string',
                                                                enum: ['LABEL', 'SPACER', 'HR', 'REFERENCE_TABLE', 'FIELD'],
                                                                description: 'フィールド要素のタイプ',
                                                            },
                                                            code: {
                                                                type: 'string',
                                                                description: 'FIELDタイプの場合のフィールドコード',
                                                            },
                                                            size: {
                                                                type: 'object',
                                                                description: 'フィールドのサイズ',
                                                                properties: {
                                                                    width: {
                                                                        type: 'string',
                                                                        description: '幅（"100%"など）',
                                                                    },
                                                                    height: {
                                                                        type: 'string',
                                                                        description: '高さ（"200px"など）',
                                                                    },
                                                                    innerHeight: {
                                                                        type: 'string',
                                                                        description: '内部高さ（"200px"など）',
                                                                    },
                                                                },
                                                            },
                                                            elementId: {
                                                                type: 'string',
                                                                description: '要素のID',
                                                            },
                                                            value: {
                                                                type: 'string',
                                                                description: 'LABELタイプの場合のラベルテキスト',
                                                            },
                                                        },
                                                    },
                                                },
                                                code: {
                                                    type: 'string',
                                                    description: 'SUBTABLEタイプの場合のサブテーブルコード',
                                                },
                                                layout: {
                                                    type: 'array',
                                                    description: 'GROUPタイプの場合の内部レイアウト',
                                                },
                                            },
                                        },
                                    },
                                    revision: {
                                        type: 'number',
                                        description: 'アプリのリビジョン番号（省略時は-1で最新リビジョンを使用）',
                                    },
                                },
                                required: ['app_id', 'layout'],
                            },
                        }
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
                    name: 'add_record_comment',
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
                {
                    name: 'get_space',
                    description: 'スペースの一般情報を取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            space_id: {
                                type: 'string',
                                description: 'スペースID',
                            },
                        },
                        required: ['space_id'],
                    },
                },
                {
                    name: 'update_space',
                    description: 'スペースの設定を更新します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            space_id: {
                                type: 'string',
                                description: 'スペースID',
                            },
                            name: {
                                type: 'string',
                                description: 'スペースの新しい名前',
                            },
                            isPrivate: {
                                type: 'boolean',
                                description: 'プライベート設定',
                            },
                            fixedMember: {
                                type: 'boolean',
                                description: 'メンバー固定設定',
                            },
                            useMultiThread: {
                                type: 'boolean',
                                description: 'マルチスレッド設定',
                            },
                        },
                        required: ['space_id'],
                    },
                },
                {
                    name: 'update_space_body',
                    description: 'スペースの本文を更新します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            space_id: {
                                type: 'string',
                                description: 'スペースID',
                            },
                            body: {
                                type: 'string',
                                description: 'スペースの本文（HTML形式）',
                            },
                        },
                        required: ['space_id', 'body'],
                    },
                },
                {
                    name: 'get_space_members',
                    description: 'スペースメンバーのリストを取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            space_id: {
                                type: 'string',
                                description: 'スペースID',
                            },
                        },
                        required: ['space_id'],
                    },
                },
                {
                    name: 'update_space_members',
                    description: 'スペースメンバーを更新します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            space_id: {
                                type: 'string',
                                description: 'スペースID',
                            },
                            members: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        entity: {
                                            type: 'object',
                                            properties: {
                                                type: {
                                                    type: 'string',
                                                    enum: ['USER', 'GROUP', 'ORGANIZATION'],
                                                },
                                                code: { type: 'string' },
                                            },
                                            required: ['type', 'code'],
                                        },
                                        isAdmin: { type: 'boolean' },
                                        includeSubs: { type: 'boolean' },
                                    },
                                    required: ['entity'],
                                },
                            },
                        },
                        required: ['space_id', 'members'],
                    },
                },
                {
                    name: 'add_thread',
                    description: 'スペースにスレッドを追加します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            space_id: {
                                type: 'string',
                                description: 'スペースID',
                            },
                            name: {
                                type: 'string',
                                description: 'スレッド名',
                            },
                        },
                        required: ['space_id', 'name'],
                    },
                },
                {
                    name: 'update_thread',
                    description: 'スレッドを更新します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            thread_id: {
                                type: 'string',
                                description: 'スレッドID',
                            },
                            name: {
                                type: 'string',
                                description: 'スレッドの新しい名前',
                            },
                            body: {
                                type: 'string',
                                description: 'スレッドの本文（HTML形式）',
                            },
                        },
                        required: ['thread_id'],
                    },
                },
                {
                    name: 'add_thread_comment',
                    description: 'スレッドにコメントを追加します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            space_id: {
                                type: 'string',
                                description: 'スペースID',
                            },
                            thread_id: {
                                type: 'string',
                                description: 'スレッドID',
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
                                        code: { type: 'string' },
                                        type: {
                                            type: 'string',
                                            enum: ['USER', 'GROUP', 'ORGANIZATION'],
                                        },
                                    },
                                    required: ['code', 'type'],
                                },
                            },
                        },
                        required: ['space_id', 'thread_id', 'text'],
                    },
                },
                {
                    name: 'add_guests',
                    description: 'ゲストユーザーを追加します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            guests: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        code: { type: 'string' },
                                        password: { type: 'string' },
                                        timezone: { type: 'string' },
                                        locale: {
                                            type: 'string',
                                            enum: ['auto', 'en', 'zh', 'ja'],
                                        },
                                    },
                                    required: ['name', 'code', 'password', 'timezone'],
                                },
                            },
                        },
                        required: ['guests'],
                    },
                },
                {
                    name: 'update_space_guests',
                    description: 'スペースのゲストメンバーを更新します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            space_id: {
                                type: 'string',
                                description: 'スペースID',
                            },
                            guests: {
                                type: 'array',
                                items: {
                                    type: 'string',
                                    description: 'ゲストユーザーのメールアドレス',
                                },
                            },
                        },
                        required: ['space_id', 'guests'],
                    },
                },
                {
                    name: 'create_app',
                    description: '新しいkintoneアプリを作成します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            name: {
                                type: 'string',
                                description: 'アプリの名前',
                            },
                            space: {
                                type: 'number',
                                description: 'スペースID（オプション）',
                            },
                            thread: {
                                type: 'number',
                                description: 'スレッドID（オプション）',
                            },
                        },
                        required: ['name'],
                    },
                },
                {
                    name: 'add_fields',
                    description: 'kintoneアプリにフィールドを追加します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'アプリID',
                            },
                            properties: {
                                type: 'object',
                                description: 'フィールドの設定',
                            },
                        },
                        required: ['app_id', 'properties'],
                    },
                },
                {
                    name: 'deploy_app',
                    description: 'kintoneアプリの設定をデプロイします',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            apps: {
                                type: 'array',
                                items: {
                                    type: 'number',
                                },
                                description: 'デプロイ対象のアプリID配列',
                            },
                        },
                        required: ['apps'],
                    },
                },
                {
                    name: 'get_deploy_status',
                    description: 'kintoneアプリのデプロイ状態を確認します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            apps: {
                                type: 'array',
                                items: {
                                    type: 'number',
                                },
                                description: '確認対象のアプリID配列',
                            },
                        },
                        required: ['apps'],
                    },
                },
                {
                    name: 'update_app_settings',
                    description: 'kintoneアプリの一般設定を変更します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'アプリID',
                            },
                            name: {
                                type: 'string',
                                description: 'アプリの名前（1文字以上64文字以内）',
                            },
                            description: {
                                type: 'string',
                                description: 'アプリの説明（10,000文字以内、HTMLタグ使用可）',
                            },
                            icon: {
                                type: 'object',
                                properties: {
                                    type: {
                                        type: 'string',
                                        enum: ['PRESET', 'FILE'],
                                        description: 'アイコンの種類',
                                    },
                                    key: {
                                        type: 'string',
                                        description: 'PRESTETアイコンの識別子',
                                    },
                                    file: {
                                        type: 'object',
                                        properties: {
                                            fileKey: {
                                                type: 'string',
                                                description: 'アップロード済みファイルのキー',
                                            },
                                        },
                                    },
                                },
                            },
                            theme: {
                                type: 'string',
                                enum: ['WHITE', 'RED', 'GREEN', 'BLUE', 'YELLOW', 'BLACK'],
                                description: 'デザインテーマ',
                            },
                            titleField: {
                                type: 'object',
                                properties: {
                                    selectionMode: {
                                        type: 'string',
                                        enum: ['AUTO', 'MANUAL'],
                                        description: 'タイトルフィールドの選択方法',
                                    },
                                    code: {
                                        type: 'string',
                                        description: 'MANUALモード時のフィールドコード',
                                    },
                                },
                            },
                            enableThumbnails: {
                                type: 'boolean',
                                description: 'サムネイル表示の有効化',
                            },
                            enableBulkDeletion: {
                                type: 'boolean',
                                description: 'レコード一括削除の有効化',
                            },
                            enableComments: {
                                type: 'boolean',
                                description: 'コメント機能の有効化',
                            },
                            enableDuplicateRecord: {
                                type: 'boolean',
                                description: 'レコード再利用機能の有効化',
                            },
                            enableInlineRecordEditing: {
                                type: 'boolean',
                                description: 'インライン編集の有効化',
                            },
                            numberPrecision: {
                                type: 'object',
                                properties: {
                                    digits: {
                                        type: 'string',
                                        description: '全体の桁数（1-30）',
                                    },
                                    decimalPlaces: {
                                        type: 'string',
                                        description: '小数部の桁数（0-10）',
                                    },
                                    roundingMode: {
                                        type: 'string',
                                        enum: ['HALF_EVEN', 'UP', 'DOWN'],
                                        description: '数値の丸めかた',
                                    },
                                },
                            },
                            firstMonthOfFiscalYear: {
                                type: 'string',
                                description: '第一四半期の開始月（1-12）',
                            },
                        },
                        required: ['app_id'],
                    },
                },
                {
                    name: 'get_form_layout',
                    description: 'kintoneアプリのフォームレイアウトを取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'kintoneアプリのID',
                            },
                        },
                        required: ['app_id'],
                    },
                },
                {
                    name: 'update_form_layout',
                    description: 'kintoneアプリのフォームレイアウトを変更します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'kintoneアプリのID',
                            },
                            layout: {
                                type: 'array',
                                description: 'フォームのレイアウト情報',
                                items: {
                                    type: 'object',
                                    properties: {
                                        type: {
                                            type: 'string',
                                            enum: ['ROW', 'SUBTABLE', 'GROUP'],
                                            description: 'レイアウト要素のタイプ',
                                        },
                                        fields: {
                                            type: 'array',
                                            description: 'ROWタイプの場合のフィールド配列',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    type: {
                                                        type: 'string',
                                                        enum: ['LABEL', 'SPACER', 'HR', 'REFERENCE_TABLE', 'FIELD'],
                                                        description: 'フィールド要素のタイプ',
                                                    },
                                                    code: {
                                                        type: 'string',
                                                        description: 'FIELDタイプの場合のフィールドコード',
                                                    },
                                                    size: {
                                                        type: 'object',
                                                        description: 'フィールドのサイズ',
                                                        properties: {
                                                            width: {
                                                                type: 'string',
                                                                description: '幅（"100%"など）',
                                                            },
                                                            height: {
                                                                type: 'string',
                                                                description: '高さ（"200px"など）',
                                                            },
                                                            innerHeight: {
                                                                type: 'string',
                                                                description: '内部高さ（"200px"など）',
                                                            },
                                                        },
                                                    },
                                                    elementId: {
                                                        type: 'string',
                                                        description: '要素のID',
                                                    },
                                                    value: {
                                                        type: 'string',
                                                        description: 'LABELタイプの場合のラベルテキスト',
                                                    },
                                                },
                                            },
                                        },
                                        code: {
                                            type: 'string',
                                            description: 'SUBTABLEタイプの場合のサブテーブルコード',
                                        },
                                        layout: {
                                            type: 'array',
                                            description: 'GROUPタイプの場合の内部レイアウト',
                                        },
                                    },
                                },
                            },
                            revision: {
                                type: 'number',
                                description: 'アプリのリビジョン番号（省略時は-1で最新リビジョンを使用）',
                            },
                        },
                        required: ['app_id', 'layout'],
                    },
                }
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

            case 'add_record_comment': {
                const commentId = await this.repository.addRecordComment(
                    args.app_id,
                    args.record_id,
                    args.text,
                    args.mentions || []
                );
                return { comment_id: commentId };
            }

            case 'get_space':
                return this.repository.getSpace(args.space_id);

            case 'update_space':
                await this.repository.updateSpace(args.space_id, {
                    name: args.name,
                    isPrivate: args.isPrivate,
                    fixedMember: args.fixedMember,
                    useMultiThread: args.useMultiThread,
                });
                return { success: true };

            case 'update_space_body':
                await this.repository.updateSpaceBody(args.space_id, args.body);
                return { success: true };

            case 'get_space_members':
                return this.repository.getSpaceMembers(args.space_id);

            case 'update_space_members':
                await this.repository.updateSpaceMembers(args.space_id, args.members);
                return { success: true };

            case 'add_thread': {
                const response = await this.repository.addThread(args.space_id, args.name);
                return { thread_id: response.id };
            }

            case 'update_thread':
                await this.repository.updateThread(args.thread_id, {
                    name: args.name,
                    body: args.body,
                });
                return { success: true };

            case 'add_thread_comment': {
                const response = await this.repository.addThreadComment(
                    args.space_id,
                    args.thread_id,
                    {
                        text: args.text,
                        mentions: args.mentions || [],
                    }
                );
                return { comment_id: response.id };
            }

            case 'add_guests':
                await this.repository.addGuests(args.guests);
                return { success: true };

            case 'update_space_guests':
                await this.repository.updateSpaceGuests(args.space_id, args.guests);
                return { success: true };

            case 'create_app': {
                const response = await this.repository.createApp(
                    args.name,
                    args.space,
                    args.thread
                );
                return {
                    app: response.app,
                    revision: response.revision
                };
            }

            case 'add_fields': {
                const response = await this.repository.addFields(
                    args.app_id,
                    args.properties
                );
                return {
                    revision: response.revision
                };
            }

            case 'deploy_app': {
                const response = await this.repository.deployApp(args.apps);
                return response;
            }

            case 'get_deploy_status': {
                return this.repository.getDeployStatus(args.apps);
            }

            case 'update_app_settings': {
                const settings = { ...args };
                delete settings.app_id;  // app_idをsettingsから除外

                // undefined のプロパティを削除
                Object.keys(settings).forEach(key => {
                    if (settings[key] === undefined) {
                        delete settings[key];
                    }
                });

                const response = await this.repository.updateAppSettings(args.app_id, settings);
                return { revision: response.revision };
            }

            case 'get_form_layout': {
                const layout = await this.repository.getFormLayout(args.app_id);
                return layout;
            }

            case 'update_form_layout': {
                const response = await this.repository.updateFormLayout(
                    args.app_id,
                    args.layout,
                    args.revision
                );
                return { 
                    success: true,
                    revision: response.revision
                };
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

    get capabilities() {
        return {
            update_app_settings: {
                description: 'kintoneアプリの一般設定を変更します',
                inputSchema: {
                    type: 'object',
                    properties: {
                        app_id: {
                            type: 'number',
                            description: 'アプリID',
                        },
                        name: {
                            type: 'string',
                            description: 'アプリの名前（1文字以上64文字以内）',
                        },
                        description: {
                            type: 'string',
                            description: 'アプリの説明（10,000文字以内、HTMLタグ使用可）',
                        },
                        icon: {
                            type: 'object',
                            properties: {
                                type: {
                                    type: 'string',
                                    enum: ['PRESET', 'FILE'],
                                    description: 'アイコンの種類',
                                },
                                key: {
                                    type: 'string',
                                    description: 'PRESTETアイコンの識別子',
                                },
                                file: {
                                    type: 'object',
                                    properties: {
                                        fileKey: {
                                            type: 'string',
                                            description: 'アップロード済みファイルのキー',
                                        },
                                    },
                                },
                            },
                        },
                        theme: {
                            type: 'string',
                            enum: ['WHITE', 'RED', 'GREEN', 'BLUE', 'YELLOW', 'BLACK'],
                            description: 'デザインテーマ',
                        },
                        titleField: {
                            type: 'object',
                            properties: {
                                selectionMode: {
                                    type: 'string',
                                    enum: ['AUTO', 'MANUAL'],
                                    description: 'タイトルフィールドの選択方法',
                                },
                                code: {
                                    type: 'string',
                                    description: 'MANUALモード時のフィールドコード',
                                },
                            },
                        },
                        enableThumbnails: {
                            type: 'boolean',
                            description: 'サムネイル表示の有効化',
                        },
                        enableBulkDeletion: {
                            type: 'boolean',
                            description: 'レコード一括削除の有効化',
                        },
                        enableComments: {
                            type: 'boolean',
                            description: 'コメント機能の有効化',
                        },
                        enableDuplicateRecord: {
                            type: 'boolean',
                            description: 'レコード再利用機能の有効化',
                        },
                        enableInlineRecordEditing: {
                            type: 'boolean',
                            description: 'インライン編集の有効化',
                        },
                        numberPrecision: {
                            type: 'object',
                            properties: {
                                digits: {
                                    type: 'string',
                                    description: '全体の桁数（1-30）',
                                },
                                decimalPlaces: {
                                    type: 'string',
                                    description: '小数部の桁数（0-10）',
                                },
                                roundingMode: {
                                    type: 'string',
                                    enum: ['HALF_EVEN', 'UP', 'DOWN'],
                                    description: '数値の丸めかた',
                                },
                            },
                        },
                        firstMonthOfFiscalYear: {
                            type: 'string',
                            description: '第一四半期の開始月（1-12）',
                        },
                    },
                    required: ['app_id'],
                },
            }
        };
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
