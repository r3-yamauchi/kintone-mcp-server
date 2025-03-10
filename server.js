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

    // プレビュー環境のアプリ設定を取得
    async getPreviewAppSettings(appId, lang) {
        try {
            console.error(`Fetching preview app settings for app: ${appId}`);
            
            // プレビュー環境のAPIを呼び出す
            // KintoneRestAPIClientのバージョンによっては直接requestメソッドが使えない場合があるため、
            // 代わりにapp.getAppSettingsを使用し、previewパラメータを追加
            const params = { app: appId, preview: true };
            if (lang) {
                params.lang = lang;
            }
            
            const response = await this.client.app.getAppSettings(params);
            
            console.error('Preview app settings response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get preview app settings for app ${appId}`);
        }
    }

    // プレビュー環境のフォームフィールド情報を取得
    async getPreviewFormFields(appId, lang) {
        try {
            console.error(`Fetching preview form fields for app: ${appId}`);
            
            // プレビュー環境のAPIを呼び出す
            // KintoneRestAPIClientのバージョンによっては直接requestメソッドが使えない場合があるため、
            // 代わりにapp.getFormFieldsを使用し、previewパラメータを追加
            const params = { app: appId, preview: true };
            if (lang) {
                params.lang = lang;
            }
            
            const response = await this.client.app.getFormFields(params);
            
            console.error('Preview form fields response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get preview form fields for app ${appId}`);
        }
    }

    // プレビュー環境のフォームレイアウト情報を取得
    async getPreviewFormLayout(appId) {
        try {
            console.error(`Fetching preview form layout for app: ${appId}`);
            
            // プレビュー環境のAPIを直接呼び出す
            // KintoneRestAPIClientのバージョンによっては直接requestメソッドが使えない場合があるため、
            // 代わりにapp.getFormLayoutを使用し、パスを変更する
            const response = await this.client.app.getFormLayout({
                app: appId,
                preview: true // プレビュー環境を指定
            });
            
            console.error('Preview form layout response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get preview form layout for app ${appId}`);
        }
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
            throw new Error(
                `フィールドタイプ "${fieldType}" には options の指定が必須です。\n` +
                `以下の形式で指定してください：\n` +
                `options: {\n` +
                `  "選択肢キー1": { "label": "選択肢キー1", "index": "0" },\n` +
                `  "選択肢キー2": { "label": "選択肢キー2", "index": "1" }\n` +
                `}`
            );
        }

        // optionsの形式チェック
        if (typeof options !== 'object' || Array.isArray(options)) {
            throw new Error(
                'options はオブジェクト形式で指定する必要があります。\n' +
                `以下の形式で指定してください：\n` +
                `options: {\n` +
                `  "選択肢キー1": { "label": "選択肢キー1", "index": "0" },\n` +
                `  "選択肢キー2": { "label": "選択肢キー2", "index": "1" }\n` +
                `}`
            );
        }

        // 各選択肢のバリデーション
        Object.entries(options).forEach(([key, value]) => {
            // labelの存在チェック
            if (!value.label) {
                throw new Error(
                    `選択肢 "${key}" の label が指定されていません。\n` +
                    `kintone APIの仕様により、label には "${key}" という値を指定する必要があります。\n` +
                    `例: "${key}": { "label": "${key}", "index": "0" }`
                );
            }

            // labelと選択肢キーの一致チェック
            if (value.label !== key) {
                throw new Error(
                    `選択肢 "${key}" の label "${value.label}" が一致しません。\n` +
                    `kintone APIの仕様により、label には "${key}" という値を指定する必要があります。\n` +
                    `例: "${key}": { "label": "${key}", "index": "0" }\n` +
                    `注意: 表示名を変更したい場合は、フィールド作成後に別途設定が必要です。`
                );
            }

            // indexの存在チェック
            if (typeof value.index === 'undefined') {
                throw new Error(
                    `選択肢 "${key}" の index が指定されていません。\n` +
                    `0以上の数値を文字列型で指定してください。\n` +
                    `例: "${key}": { "label": "${key}", "index": "0" }`
                );
            }

            // indexが文字列型であることのチェック
            if (typeof value.index !== 'string') {
                throw new Error(
                    `選択肢 "${key}" の index は文字列型の数値を指定してください。\n` +
                    `例: "${key}": { "label": "${key}", "index": "0" }\n` +
                    `現在の値: ${typeof value.index} 型の ${value.index}`
                );
            }

            // indexが数値文字列であることのチェック
            if (!/^\d+$/.test(value.index)) {
                throw new Error(
                    `選択肢 "${key}" の index は 0以上の整数値を文字列型で指定してください。\n` +
                    `例: "${key}": { "label": "${key}", "index": "0" }\n` +
                    `現在の値: "${value.index}"`
                );
            }

            // indexが0以上の数値であることのチェック
            const indexNum = parseInt(value.index, 10);
            if (isNaN(indexNum) || indexNum < 0) {
                throw new Error(
                    `選択肢 "${key}" の index は 0以上の整数値を文字列型で指定してください。\n` +
                    `例: "${key}": { "label": "${key}", "index": "0" }`
                );
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

            // 変換済みのプロパティを格納する新しいオブジェクト
            const convertedProperties = {};
            const warnings = [];

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
                    // 不一致の場合は警告を記録し、正しいキーでプロパティを追加
                    warnings.push(
                        `フィールドコードの不一致を自動修正しました: プロパティキー "${propertyKey}" → フィールドコード "${fieldConfig.code}"\n` +
                        `kintone APIの仕様により、プロパティキーとフィールドコードは完全に一致している必要があります。`
                    );
                    
                    // 元のプロパティキーをlabelとして保存（もしlabelが未設定の場合）
                    if (!fieldConfig.label) {
                        fieldConfig.label = propertyKey;
                    }
                    
                    // 正しいキーでプロパティを追加
                    convertedProperties[fieldConfig.code] = fieldConfig;
                } else {
                    // 一致している場合はそのまま追加
                    convertedProperties[propertyKey] = fieldConfig;
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

            // 警告メッセージを表示
            if (warnings.length > 0) {
                console.error('自動修正の警告:');
                warnings.forEach(warning => console.error(warning));
            }

            const response = await this.client.app.addFormFields({
                app: appId,
                properties: convertedProperties,
                revision: -1 // 最新のリビジョンを使用
            });
            console.error('Field addition response:', response);
            
            // 警告メッセージを含めた拡張レスポンスを返す
            return {
                ...response,
                warnings: warnings.length > 0 ? warnings : undefined
            };
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
            try {
                // まず運用環境のAPIを試す
                const response = await this.client.app.getFormLayout({ app: appId });
                console.error('Form layout response:', response);
                return response;
            } catch (error) {
                // 404エラー（アプリが見つからない）の場合、プレビュー環境のAPIを試す
                if (error instanceof KintoneRestAPIError && 
                    (error.code === 'GAIA_AP01' || error.status === 404)) {
                    console.error(`App ${appId} not found in production environment, trying preview environment...`);
                    const previewResponse = await this.getPreviewFormLayout(appId);
                    
                    // プレビュー環境から取得したことを示す情報を追加
                    return {
                        ...previewResponse,
                        preview: true,
                        message: 'このレイアウト情報はプレビュー環境から取得されました。アプリをデプロイするには deploy_app ツールを使用してください。'
                    };
                }
                // その他のエラーは通常通り処理
                throw error;
            }
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
                version: '3.2.0',
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
                            description: '新しいkintoneアプリを作成します。作成されたアプリはプレビュー環境に存在し、deploy_appを実行するまで運用環境では利用できません。',
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
                            description: `kintoneアプリにフィールドを追加します。追加されたフィールドはプレビュー環境に存在し、deploy_appを実行するまで運用環境では反映されません。
選択肢フィールド（RADIO_BUTTON, CHECK_BOX, MULTI_SELECT, DROP_DOWN）を作成する際の重要な注意点：
1. options オブジェクトの各キーと label の値は必ず一致させる必要があります
2. index は文字列型の数値（"0", "1"など）で指定する必要があります
3. 詳細は get_field_type_documentation ツールで確認できます`,
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    app_id: {
                                        type: 'number',
                                        description: 'アプリID',
                                    },
                                    properties: {
                                        type: 'object',
                                        description: `フィールドの設定。
選択肢フィールドの例:
{
  "status": {
    "type": "RADIO_BUTTON",
    "code": "status",
    "label": "ステータス",
    "options": {
      "not_started": { "label": "not_started", "index": "0" },
      "in_progress": { "label": "in_progress", "index": "1" }
    }
  }
}`,
                                    },
                                },
                                required: ['app_id', 'properties'],
                            },
                        },
                        get_field_type_documentation: {
                            description: "kintoneのフィールドタイプに関する詳細なドキュメントを取得します",
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    field_type: {
                                        type: 'string',
                                        description: "ドキュメントを取得するフィールドタイプ（例: RADIO_BUTTON, CHECK_BOX, MULTI_SELECT, DROP_DOWN, TEXT, NUMBER など）",
                                    },
                                },
                                required: ['field_type'],
                            },
                        },
                        create_choice_field: {
                            description: "選択肢フィールド（RADIO_BUTTON, CHECK_BOX, MULTI_SELECT, DROP_DOWN）の設定を生成します",
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    field_type: {
                                        type: 'string',
                                        description: "フィールドタイプ（RADIO_BUTTON, CHECK_BOX, MULTI_SELECT, DROP_DOWN）",
                                        enum: ["RADIO_BUTTON", "CHECK_BOX", "MULTI_SELECT", "DROP_DOWN"]
                                    },
                                    code: {
                                        type: 'string',
                                        description: "フィールドコード"
                                    },
                                    label: {
                                        type: 'string',
                                        description: "フィールドラベル"
                                    },
                                    choices: {
                                        type: 'array',
                                        items: {
                                            type: 'string'
                                        },
                                        description: "選択肢のキー名の配列"
                                    },
                                    required: {
                                        type: 'boolean',
                                        description: "必須項目かどうか",
                                        default: false
                                    },
                                    align: {
                                        type: 'string',
                                        description: "配置（RADIO_BUTTON と CHECK_BOX のみ）",
                                        enum: ["HORIZONTAL", "VERTICAL"],
                                        default: "HORIZONTAL"
                                    }
                                },
                                required: ['field_type', 'code', 'label', 'choices']
                            },
                        },
                        get_preview_app_settings: {
                            description: 'kintoneアプリのプレビュー環境（動作テスト環境）の一般設定を取得します。新規作成したアプリや、変更をデプロイする前のアプリの設定を取得する場合に使用します。',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    app_id: {
                                        type: 'number',
                                        description: 'アプリID',
                                    },
                                    lang: {
                                        type: 'string',
                                        description: '取得する言語設定（ja, en, zh, user）',
                                        enum: ['ja', 'en', 'zh', 'user'],
                                    },
                                },
                                required: ['app_id'],
                            },
                        },
                        get_preview_form_fields: {
                            description: 'kintoneアプリのプレビュー環境（動作テスト環境）のフォームフィールド情報を取得します。新規作成したアプリや、変更をデプロイする前のアプリのフィールド情報を取得する場合に使用します。',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    app_id: {
                                        type: 'number',
                                        description: 'アプリID',
                                    },
                                    lang: {
                                        type: 'string',
                                        description: '取得する言語設定（ja, en, zh, user）',
                                        enum: ['ja', 'en', 'zh', 'user'],
                                    },
                                },
                                required: ['app_id'],
                            },
                        },
                        get_preview_form_layout: {
                            description: 'kintoneアプリのプレビュー環境（動作テスト環境）のフォームレイアウト情報を取得します。新規作成したアプリや、変更をデプロイする前のアプリのレイアウト情報を取得する場合に使用します。',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    app_id: {
                                        type: 'number',
                                        description: 'アプリID',
                                    },
                                },
                                required: ['app_id'],
                            },
                        },
                        deploy_app: {
                            description: 'kintoneアプリの設定をデプロイ（本番運用開始・運用環境へ反映）します。デプロイが完了するまでget_deploy_statusで確認する必要があります。',
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
                            description: 'kintoneアプリのデプロイ状態（アプリ設定の運用環境への反映状況）を確認します。デプロイが完了するまで定期的に確認する必要があります。',
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
                            description: 'kintoneアプリのフォームレイアウトを取得します。取得したレイアウト情報は、update_form_layoutツールで使用できる形式で返されます。レイアウトはROW（行）、GROUP（グループ）、SUBTABLE（サブテーブル）の階層構造で表現されます。',
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
                            description: 'kintoneアプリのフォームレイアウトを変更します。レイアウトはROW（行）、GROUP（グループ）、SUBTABLE（サブテーブル）の3種類の要素で構成され、それぞれ特定の構造に従う必要があります。ROWにはLABEL、SPACER、HR、FIELD、REFERENCE_TABLEなどのフィールド要素を配置できます。',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    app_id: {
                                        type: 'number',
                                        description: 'kintoneアプリのID',
                                    },
                                    layout: {
                                        type: 'array',
                                        description: 'フォームのレイアウト情報。レイアウト要素（ROW、GROUP、SUBTABLE）の配列で、フォーム上の表示順に並べます。',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                type: {
                                                    type: 'string',
                                                    enum: ['ROW', 'SUBTABLE', 'GROUP'],
                                                    description: 'レイアウト要素のタイプ。ROW（行）は複数のフィールドを横に並べる基本要素、GROUP（グループ）は複数のROWをまとめる要素、SUBTABLE（テーブル）は表形式のデータを扱う要素です。サイボウズ社の正式名称は「テーブル」ですが、一般ユーザーからは「サブテーブル」と呼ばれることもあります。',
                                                },
                                                fields: {
                                                    type: 'array',
                                                    description: 'ROWタイプの場合のフィールド配列。ROW内に配置するフィールド要素（LABEL、SPACER、HR、FIELD、REFERENCE_TABLE）を指定します。',
                                                    items: {
                                                        type: 'object',
                                                        properties: {
                                                            type: {
                                                                type: 'string',
                                                                enum: ['LABEL', 'SPACER', 'HR', 'REFERENCE_TABLE', 'FIELD'],
                                                                description: 'フィールド要素のタイプ。LABEL（ラベル）はテキスト表示、SPACER（スペーサー）は空白、HR（水平線）は区切り線、FIELD（フィールド）は入力項目、REFERENCE_TABLE（参照テーブル）は他のアプリのレコード参照です。',
                                                            },
                                                            code: {
                                                                type: 'string',
                                                                description: 'FIELDタイプの場合のフィールドコード。add_fieldsで追加したフィールドのcodeを指定します。',
                                                            },
                                                            size: {
                                                                type: 'object',
                                                                description: 'フィールドのサイズ設定。幅や高さを指定できます。',
                                                                properties: {
                                                                    width: {
                                                                        type: 'string',
                                                                        description: '幅（"100%"、"150px"など）。パーセント指定の場合はROW内での比率、ピクセル指定の場合は固定幅になります。',
                                                                    },
                                                                    height: {
                                                                        type: 'string',
                                                                        description: '高さ（"200px"など）。主にスペーサーや複数行テキストで使用します。',
                                                                    },
                                                                    innerHeight: {
                                                                        type: 'string',
                                                                        description: '内部高さ（"200px"など）。主に複数行テキストの入力エリアの高さに使用します。',
                                                                    },
                                                                },
                                                            },
                                                            elementId: {
                                                                type: 'string',
                                                                description: '要素のID。システムによって自動的に割り当てられるため、通常は指定不要です。',
                                                            },
                                                            value: {
                                                                type: 'string',
                                                                description: 'LABELタイプの場合のラベルテキスト。表示するテキスト内容を指定します。',
                                                            },
                                                        },
                                                    },
                                                },
                                                code: {
                                                    type: 'string',
                                                    description: 'SUBTABLEタイプの場合のサブテーブルコード。add_fieldsで追加したサブテーブルのcodeを指定します。',
                                                },
                                                layout: {
                                                    type: 'array',
                                                    description: 'GROUPタイプの場合の内部レイアウト。GROUP内に配置するROW要素の配列を指定します。注意：グループ内にテーブル（SUBTABLE）や別のグループ（GROUP）を配置することはできません。',
                                                },
                                            },
                                        },
                                    },
                                    revision: {
                                        type: 'number',
                                        description: 'アプリのリビジョン番号（省略時は-1で最新リビジョンを使用）。同時更新を防ぐために使用します。',
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

        // ツール実行前のログ出力を強化
        console.error(`Executing tool: ${name}`);
        console.error(`Arguments:`, JSON.stringify(args, null, 2));

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
                
                // 警告メッセージがある場合は結果に含める
                const result = {
                    revision: response.revision
                };
                
                if (response.warnings) {
                    result.warnings = response.warnings;
                }
                
                return result;
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

            case 'get_preview_app_settings': {
                const settings = await this.repository.getPreviewAppSettings(
                    args.app_id,
                    args.lang
                );
                return settings;
            }

            case 'get_preview_form_fields': {
                const fields = await this.repository.getPreviewFormFields(
                    args.app_id,
                    args.lang
                );
                return fields;
            }

            case 'get_preview_form_layout': {
                const layout = await this.repository.getPreviewFormLayout(
                    args.app_id
                );
                return layout;
            }

            case 'get_field_type_documentation': {
                const fieldType = args.field_type.toUpperCase();
                
                // 選択肢フィールドのドキュメント
                if (["RADIO_BUTTON", "CHECK_BOX", "MULTI_SELECT", "DROP_DOWN"].includes(fieldType)) {
                    const docs = {
                        common: `
# 選択肢フィールド（${fieldType}）の仕様

## 共通の重要ポイント
1. options オブジェクトの構造:
   - キー名が選択肢の識別子となります
   - 各選択肢には必ず label と index を指定する必要があります
   - label の値は必ずキー名と完全に一致させる必要があります（kintone API の仕様）
   - index は文字列型の数値（"0", "1" など）で、0以上の連番を指定します

2. 表示名の設定:
   - label はキー名と一致させる必要があるため、日本語などの表示名は別途設定する必要があります
   - 表示名はフィールド作成後、管理画面から設定するか、別のAPI呼び出しで設定します`,
                        
                        // フィールドタイプ固有の情報
                        RADIO_BUTTON: `
## RADIO_BUTTON（ラジオボタン）の特徴
- 単一選択のみ可能
- align プロパティで "HORIZONTAL"（横並び）または "VERTICAL"（縦並び）を指定可能
- defaultValue は選択肢のキー名を文字列で指定（例: "sample1"）

## 使用例
\`\`\`json
{
  "type": "RADIO_BUTTON",
  "code": "status",
  "label": "ステータス",
  "noLabel": false,
  "required": true,
  "options": {
    "not_started": {
      "label": "not_started",
      "index": "0"
    },
    "in_progress": {
      "label": "in_progress",
      "index": "1"
    }
  },
  "defaultValue": "not_started",
  "align": "HORIZONTAL"
}
\`\`\``,
                        
                        CHECK_BOX: `
## CHECK_BOX（チェックボックス）の特徴
- 複数選択可能
- align プロパティで "HORIZONTAL"（横並び）または "VERTICAL"（縦並び）を指定可能
- defaultValue は選択肢のキー名の配列で指定（例: ["sample1", "sample2"]）または空配列 []

## 使用例
\`\`\`json
{
  "type": "CHECK_BOX",
  "code": "categories",
  "label": "カテゴリ",
  "noLabel": false,
  "required": false,
  "options": {
    "web": {
      "label": "web",
      "index": "0"
    },
    "mobile": {
      "label": "mobile",
      "index": "1"
    }
  },
  "defaultValue": ["web"],
  "align": "HORIZONTAL"
}
\`\`\``,
                        
                        MULTI_SELECT: `
## MULTI_SELECT（複数選択）の特徴
- 複数選択可能なドロップダウン
- defaultValue は選択肢のキー名の配列で指定（例: ["sample1", "sample2"]）または空配列 []

## 使用例
\`\`\`json
{
  "type": "MULTI_SELECT",
  "code": "tags",
  "label": "タグ",
  "noLabel": false,
  "required": false,
  "options": {
    "important": {
      "label": "important",
      "index": "0"
    },
    "urgent": {
      "label": "urgent",
      "index": "1"
    }
  },
  "defaultValue": []
}
\`\`\``,
                        
                        DROP_DOWN: `
## DROP_DOWN（ドロップダウン）の特徴
- 単一選択のみ可能
- defaultValue は選択肢のキー名を文字列で指定（例: "sample1"）または空文字列 ""

## 使用例
\`\`\`json
{
  "type": "DROP_DOWN",
  "code": "priority",
  "label": "優先度",
  "noLabel": false,
  "required": false,
  "options": {
    "high": {
      "label": "high",
      "index": "0"
    },
    "medium": {
      "label": "medium",
      "index": "1"
    },
    "low": {
      "label": "low",
      "index": "2"
    }
  },
  "defaultValue": "medium"
}
\`\`\``,
                    };
                    
                    // 共通情報とフィールドタイプ固有の情報を結合
                    return docs.common + docs[fieldType];
                }
                
                // その他のフィールドタイプのドキュメント（必要に応じて追加）
                return `フィールドタイプ ${fieldType} のドキュメントは現在提供されていません。`;
            }

            case 'create_choice_field': {
                const { field_type, code, label, choices, required = false, align = "HORIZONTAL" } = args;
                
                // options オブジェクトの生成
                const options = {};
                choices.forEach((choice, index) => {
                    options[choice] = {
                        label: choice,
                        index: String(index)
                    };
                });
                
                // フィールド設定の基本部分
                const fieldConfig = {
                    type: field_type,
                    code: code,
                    label: label,
                    noLabel: false,
                    required: required,
                    options: options
                };
                
                // フィールドタイプ固有の設定を追加
                if (field_type === "RADIO_BUTTON") {
                    fieldConfig.defaultValue = choices.length > 0 ? choices[0] : "";
                    fieldConfig.align = align;
                } else if (field_type === "CHECK_BOX") {
                    fieldConfig.defaultValue = [];
                    fieldConfig.align = align;
                } else if (field_type === "MULTI_SELECT") {
                    fieldConfig.defaultValue = [];
                } else if (field_type === "DROP_DOWN") {
                    fieldConfig.defaultValue = "";
                }
                
                return fieldConfig;
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
        let helpText = "";

        // 選択肢フィールドに関連するエラーの特定と対応
        if (error.message.includes("選択肢") && error.message.includes("label")) {
            helpText = `
選択肢フィールドのエラーが発生しました。以下の点を確認してください：

1. options オブジェクトの各キーと label の値が完全に一致しているか
   正しい例: "status": { "label": "status", "index": "0" }
   誤った例: "status": { "label": "ステータス", "index": "0" }

2. get_field_type_documentation ツールを使用して、正しい形式を確認してください：
   例: get_field_type_documentation({ field_type: "RADIO_BUTTON" })

3. create_choice_field ツールを使用して、正しい形式のフィールド設定を生成することもできます：
   例: create_choice_field({
     field_type: "RADIO_BUTTON",
     code: "status",
     label: "ステータス",
     choices: ["not_started", "in_progress", "completed"]
   })`;
        } else if (error.message.includes("選択肢") && error.message.includes("index")) {
            helpText = `
選択肢フィールドの index に関するエラーが発生しました。以下の点を確認してください：

1. index は文字列型の数値（"0", "1"など）で指定されているか
   正しい例: "status": { "label": "status", "index": "0" }
   誤った例: "status": { "label": "status", "index": 0 }

2. index は 0 以上の整数値か
   
3. get_field_type_documentation ツールを使用して、正しい形式を確認してください：
   例: get_field_type_documentation({ field_type: "RADIO_BUTTON" })`;
        }

        if (error instanceof McpError) {
            throw error;
        } else if (error instanceof KintoneRestAPIError) {
            // Kintone API のエラーコードに応じて適切な MCP エラーコードを設定
            errorCode = error.status >= 500 ? 
                ErrorCode.InternalError : 
                ErrorCode.InvalidRequest;
            
            // アプリが見つからないエラーの場合、プレビュー環境と運用環境の区別に関する情報を追加
            if (error.code === "GAIA_AP01" || error.message.includes("存在しません")) {
                helpText = `
アプリが見つかりません。以下の可能性があります：

1. アプリがまだプレビュー環境にのみ存在し、運用環境にデプロイされていない
2. デプロイ処理が完了していない

解決策：
1. 新規作成したアプリの場合は、get_preview_app_settings ツールを使用してプレビュー環境の情報を取得してください
2. アプリをデプロイするには、deploy_app ツールを使用してください
3. デプロイ状態を確認するには、get_deploy_status ツールを使用してください
4. デプロイが完了したら、運用環境のAPIを使用できます

kintoneアプリのライフサイクル：
1. create_app: アプリを作成（プレビュー環境に作成される）
2. add_fields: フィールドを追加（プレビュー環境に追加される）
3. deploy_app: アプリをデプロイ（運用環境へ反映）
4. get_deploy_status: デプロイ状態を確認（完了するまで待機）
5. get_app_settings: 運用環境の設定を取得（デプロイ完了後）`;
            }
        }

        // ヘルプテキストがある場合は追加
        if (helpText) {
            errorMessage += "\n\n" + helpText;
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
