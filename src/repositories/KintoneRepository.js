// src/repositories/KintoneRepository.js
import { KintoneRestAPIClient, KintoneRestAPIError } from '@kintone/rest-api-client';
import { KintoneRecord } from '../models/KintoneRecord.js';
import { validateFieldCode, validateOptions, validateCalcField, validateLinkField, validateReferenceTableField, validateLookupField } from './validators/FieldValidator.js';
import { autoCorrectOptions } from './validators/OptionValidator.js';
import { FIELD_TYPES_REQUIRING_OPTIONS, CALC_FIELD_TYPE, LINK_FIELD_TYPE, VALID_LINK_PROTOCOLS, LOOKUP_FIELD_TYPE, REFERENCE_TABLE_FIELD_TYPE, SUBTABLE_FIELD_TYPE } from '../constants.js';

export class KintoneRepository {
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
            
            // クエリ文字列の処理
            if (query) {
                // クエリ文字列が order や limit のみで構成されているかチェック
                const hasCondition = /[^\s]+([ ]*=|[ ]*!=|[ ]*>|[ ]*<|[ ]*>=|[ ]*<=|[ ]*like|[ ]*in |[ ]*not[ ]+in)/.test(query);
                const hasOrderOrLimit = /(order |limit )/i.test(query);
                
                // order や limit のみの場合、$id > 0 を先頭に挿入
                if (!hasCondition && hasOrderOrLimit) {
                    params.condition = `$id > 0 ${query}`;
                    console.error(`Modified query: ${params.condition}`);
                } else {
                    params.condition = query;
                }
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
                validateFieldCode(propertyKey);

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

                // 選択肢フィールドのoptionsの自動修正とバリデーション
                if (fieldConfig.type && fieldConfig.options && 
                    FIELD_TYPES_REQUIRING_OPTIONS.includes(fieldConfig.type)) {
                    
                    // 選択肢フィールドのoptionsを自動修正
                    const { warnings: optionsWarnings, keyChanges } = autoCorrectOptions(fieldConfig.type, fieldConfig.options);
                    if (optionsWarnings.length > 0) {
                        warnings.push(...optionsWarnings);
                    }
                    
                    // キー名の変更があった場合、optionsオブジェクトを再構築
                    if (Object.keys(keyChanges).length > 0) {
                        const newOptions = {};
                        for (const [key, value] of Object.entries(fieldConfig.options)) {
                            // 変更対象のキーの場合は新しいキー名を使用
                            const newKey = keyChanges[key] || key;
                            newOptions[newKey] = value;
                        }
                        fieldConfig.options = newOptions;
                    }
                    
                    // 修正後のoptionsをバリデーション
                    validateOptions(fieldConfig.type, fieldConfig.options);
                }

                if (fieldConfig.type) {
                    validateCalcField(fieldConfig.type, fieldConfig.expression);
                    validateLinkField(fieldConfig.type, fieldConfig.protocol);
                    validateReferenceTableField(fieldConfig.type, fieldConfig.referenceTable);
                    validateLookupField(fieldConfig.type, fieldConfig.lookup);
                    
                    // SUBTABLEフィールドの特別な処理
                    if (fieldConfig.type === SUBTABLE_FIELD_TYPE) {
                        // fieldsプロパティの存在チェック
                        if (!fieldConfig.fields) {
                            throw new Error(
                                `サブテーブルフィールド "${propertyKey}" には fields プロパティの指定が必須です。\n` +
                                `サブテーブル内のフィールドを定義するオブジェクトを指定してください。`
                            );
                        }
                        
                        // fieldsの形式チェック
                        if (typeof fieldConfig.fields !== 'object' || Array.isArray(fieldConfig.fields)) {
                            throw new Error(
                                `サブテーブルフィールド "${propertyKey}" の fields はオブジェクト形式で指定する必要があります。\n` +
                                `例: "fields": { "field1": { "type": "SINGLE_LINE_TEXT", "code": "field1", "label": "テキスト1" } }`
                            );
                        }
                        
                        // サブテーブル内の各フィールドをチェック
                        for (const [fieldKey, fieldDef] of Object.entries(fieldConfig.fields)) {
                            // フィールドコードのバリデーション
                            validateFieldCode(fieldKey);
                            
                            // codeプロパティの存在チェック
                            if (!fieldDef.code) {
                                throw new Error(
                                    `サブテーブル "${propertyKey}" 内のフィールド "${fieldKey}" の code プロパティが指定されていません。`
                                );
                            }
                            
                            // プロパティキーとcodeの一致チェック
                            if (fieldDef.code !== fieldKey) {
                                warnings.push(
                                    `サブテーブル "${propertyKey}" 内のフィールドコードの不一致を自動修正しました: ` +
                                    `プロパティキー "${fieldKey}" → フィールドコード "${fieldDef.code}"\n` +
                                    `kintone APIの仕様により、プロパティキーとフィールドコードは完全に一致している必要があります。`
                                );
                                
                                // 元のプロパティキーをlabelとして保存（もしlabelが未設定の場合）
                                if (!fieldDef.label) {
                                    fieldDef.label = fieldKey;
                                }
                                
                                // 正しいキーでフィールドを追加
                                fieldConfig.fields[fieldDef.code] = fieldDef;
                                delete fieldConfig.fields[fieldKey];
                            }
                            
                            // typeプロパティの存在チェック
                            if (!fieldDef.type) {
                                throw new Error(
                                    `サブテーブル "${propertyKey}" 内のフィールド "${fieldKey}" の type プロパティが指定されていません。`
                                );
                            }
                            
                            // サブテーブル内の選択肢フィールドのoptionsの自動修正とバリデーション
                            if (fieldDef.options && FIELD_TYPES_REQUIRING_OPTIONS.includes(fieldDef.type)) {
                                // 選択肢フィールドのoptionsを自動修正
                                const { warnings: optionsWarnings, keyChanges } = autoCorrectOptions(fieldDef.type, fieldDef.options);
                                if (optionsWarnings.length > 0) {
                                    warnings.push(...optionsWarnings.map(w => `サブテーブル "${propertyKey}" 内: ${w}`));
                                }
                                
                                // キー名の変更があった場合、optionsオブジェクトを再構築
                                if (Object.keys(keyChanges).length > 0) {
                                    const newOptions = {};
                                    for (const [key, value] of Object.entries(fieldDef.options)) {
                                        // 変更対象のキーの場合は新しいキー名を使用
                                        const newKey = keyChanges[key] || key;
                                        newOptions[newKey] = value;
                                    }
                                    fieldDef.options = newOptions;
                                }
                                
                                // 修正後のoptionsをバリデーション
                                validateOptions(fieldDef.type, fieldDef.options);
                            }
                        }
                    }
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
    
    // アプリのフィールド情報を取得
    async getFormFields(appId) {
        try {
            console.error(`Fetching form fields for app: ${appId}`);
            try {
                // まず運用環境のAPIを試す
                const response = await this.client.app.getFormFields({ app: appId });
                console.error('Form fields response:', response);
                return response;
            } catch (error) {
                // 404エラー（アプリが見つからない）の場合、プレビュー環境のAPIを試す
                if (error instanceof KintoneRestAPIError && 
                    (error.code === 'GAIA_AP01' || error.status === 404)) {
                    console.error(`App ${appId} not found in production environment, trying preview environment...`);
                    const previewResponse = await this.getPreviewFormFields(appId);
                    
                    // プレビュー環境から取得したことを示す情報を追加
                    return {
                        ...previewResponse,
                        preview: true,
                        message: 'このフィールド情報はプレビュー環境から取得されました。アプリをデプロイするには deploy_app ツールを使用してください。'
                    };
                }
                // その他のエラーは通常通り処理
                throw error;
            }
        } catch (error) {
            this.handleKintoneError(error, `get form fields for app ${appId}`);
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
