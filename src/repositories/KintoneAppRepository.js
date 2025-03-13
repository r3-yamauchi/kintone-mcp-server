// src/repositories/KintoneAppRepository.js
import { BaseKintoneRepository } from './base/BaseKintoneRepository.js';
import { KintoneRestAPIError } from '@kintone/rest-api-client';
import { validateFieldCode, validateOptions, validateCalcField, validateLinkField, validateReferenceTableField, validateLookupField, validateTextField, validateNumberField, validateDateTimeField, validateRichTextField, validateAttachmentField, validateUserSelectField, validateSubtableField, validateStatusField, validateRelatedRecordsField, validateRecordNumberField, validateSystemField, validateField } from './validators/FieldValidator.js';
import { validateFormLayout, validateFieldSize, validateElementPosition } from './validators/LayoutValidator.js';
import { autoCorrectOptions } from './validators/OptionValidator.js';
import { FIELD_TYPES_REQUIRING_OPTIONS, CALC_FIELD_TYPE, LINK_FIELD_TYPE, VALID_LINK_PROTOCOLS, LOOKUP_FIELD_TYPE, REFERENCE_TABLE_FIELD_TYPE, SUBTABLE_FIELD_TYPE } from '../constants.js';

export class KintoneAppRepository extends BaseKintoneRepository {
    // プレビュー環境のアプリ設定を取得
    async getPreviewAppSettings(appId, lang) {
        try {
            console.error(`Fetching preview app settings for app: ${appId}`);
            
            // プレビュー環境のAPIを呼び出す
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
            
            // プレビュー環境のAPIを呼び出す
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

            // 既存のフィールド情報を取得
            console.error(`Fetching existing fields for app ${appId} to check for duplicates`);
            let existingFields;
            try {
                existingFields = await this.getFormFields(appId);
                console.error(`Found ${Object.keys(existingFields.properties || {}).length} existing fields`);
            } catch (error) {
                console.error(`Failed to get existing fields: ${error.message}`);
                console.error('Continuing without duplicate check');
                existingFields = { properties: {} };
            }
            
            // 既存のフィールドコードのリストを作成
            const existingFieldCodes = Object.keys(existingFields.properties || {});
            console.error(`Existing field codes: ${existingFieldCodes.join(', ')}`);

            // 変換済みのプロパティを格納する新しいオブジェクト
            const convertedProperties = {};
            const warnings = [];
            
            // 使用済みフィールドコードのリスト（既存 + 新規追加済み）
            const usedFieldCodes = [...existingFieldCodes];

            // フィールドコードの自動生成関数
            function generateFieldCode(label) {
                if (!label) return '';
                
                // ラベルから使用可能な文字のみを抽出
                let code = label;
                
                // 英数字、ひらがな、カタカナ、漢字、許可された記号以外を削除
                code = code.replace(/[^a-zA-Z0-9ぁ-んァ-ヶー一-龠々＿_･・＄￥]/g, '_');
                
                // 先頭が数字の場合、先頭に 'f_' を追加
                if (/^[0-9０-９]/.test(code)) {
                    code = 'f_' + code;
                }
                
                return code;
            }

            // フィールドコードの整合性チェックとバリデーション
            for (const [propertyKey, fieldConfig] of Object.entries(properties)) {
                // フィールドコードのバリデーション
                validateFieldCode(propertyKey);

                // codeプロパティの存在チェック
                if (!fieldConfig.code) {
                    // codeが指定されていない場合、labelから自動生成
                    if (fieldConfig.label) {
                        fieldConfig.code = generateFieldCode(fieldConfig.label);
                        warnings.push(
                            `フィールド "${propertyKey}" の code が指定されていないため、label から自動生成しました: "${fieldConfig.code}"`
                        );
                    } else if (propertyKey !== fieldConfig.code) {
                        // labelがない場合はプロパティキーをcodeとして使用
                        fieldConfig.code = generateFieldCode(propertyKey);
                        warnings.push(
                            `フィールド "${propertyKey}" の code が指定されていないため、プロパティキーから自動生成しました: "${fieldConfig.code}"`
                        );
                    } else {
                        throw new Error(
                            `フィールド "${propertyKey}" の code プロパティが指定されていません。\n` +
                            `各フィールドには一意のコードを指定する必要があります。\n` +
                            `使用可能な文字: ひらがな、カタカナ、漢字、英数字、記号(_＿･・＄￥)`
                        );
                    }
                }

                // フィールドコードの重複チェック
                if (usedFieldCodes.includes(fieldConfig.code)) {
                    // 重複する場合、新しいフィールドコードを生成
                    const originalCode = fieldConfig.code;
                    let newCode = originalCode;
                    let suffix = 1;
                    
                    // 一意のフィールドコードになるまで接尾辞を追加
                    while (usedFieldCodes.includes(newCode)) {
                        newCode = `${originalCode}_${suffix}`;
                        suffix++;
                    }
                    
                    // フィールドコードを更新
                    fieldConfig.code = newCode;
                    
                    // 警告メッセージを記録
                    warnings.push(
                        `フィールドコードの重複を自動修正しました: "${originalCode}" → "${fieldConfig.code}"\n` +
                        `kintoneの仕様により、フィールドコードはアプリ内で一意である必要があります。`
                    );
                }
                
                // 使用済みリストに追加
                usedFieldCodes.push(fieldConfig.code);

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

                // 単位位置の自動修正を適用
                if (fieldConfig.type) {
                    // validateField関数を使用して自動修正を適用
                    const correctedField = validateField(fieldConfig);
                    
                    // 修正されたフィールドで置き換え
                    if (fieldConfig.code === propertyKey) {
                        convertedProperties[propertyKey] = correctedField;
                    } else {
                        convertedProperties[fieldConfig.code] = correctedField;
                    }
                    
                    // 自動修正の結果をログに出力
                    if (fieldConfig.type === "NUMBER" || 
                        (fieldConfig.type === "CALC" && fieldConfig.format === "NUMBER")) {
                        if (fieldConfig.unit && !fieldConfig.unitPosition && correctedField.unitPosition) {
                            warnings.push(
                                `フィールド "${fieldConfig.code}" の unitPosition を "${correctedField.unitPosition}" に自動設定しました。`
                            );
                        }
                    }
                    
                    // SUBTABLEフィールドの特別な処理
                    if (fieldConfig.type === SUBTABLE_FIELD_TYPE) {
                        // fieldsプロパティの存在チェック
                        if (!fieldConfig.fields) {
                            throw new Error(
                                `テーブルフィールド "${propertyKey}" には fields プロパティの指定が必須です。\n` +
                                `テーブル内のフィールドを定義するオブジェクトを指定してください。`
                            );
                        }
                        
                        // fieldsの形式チェック
                        if (typeof fieldConfig.fields !== 'object' || Array.isArray(fieldConfig.fields)) {
                            throw new Error(
                                `テーブルフィールド "${propertyKey}" の fields はオブジェクト形式で指定する必要があります。\n` +
                                `例: "fields": { "field1": { "type": "SINGLE_LINE_TEXT", "code": "field1", "label": "テキスト1" } }`
                            );
                        }
                        
                        // テーブル内の使用済みフィールドコードのリスト
                        const usedSubtableFieldCodes = [];
                        
                        // テーブル内の各フィールドをチェック
                        for (const [fieldKey, fieldDef] of Object.entries(fieldConfig.fields)) {
                            // フィールドコードのバリデーション
                            validateFieldCode(fieldKey);
                            
                            // codeプロパティの存在チェック
                            if (!fieldDef.code) {
                                // codeが指定されていない場合、labelから自動生成
                                if (fieldDef.label) {
                                    fieldDef.code = generateFieldCode(fieldDef.label);
                                    warnings.push(
                                        `テーブル "${propertyKey}" 内のフィールド "${fieldKey}" の code が指定されていないため、label から自動生成しました: "${fieldDef.code}"`
                                    );
                                } else if (fieldKey !== fieldDef.code) {
                                    // labelがない場合はプロパティキーをcodeとして使用
                                    fieldDef.code = generateFieldCode(fieldKey);
                                    warnings.push(
                                        `テーブル "${propertyKey}" 内のフィールド "${fieldKey}" の code が指定されていないため、プロパティキーから自動生成しました: "${fieldDef.code}"`
                                    );
                                } else {
                                    throw new Error(
                                        `テーブル "${propertyKey}" 内のフィールド "${fieldKey}" の code プロパティが指定されていません。\n` +
                                        `各フィールドには一意のコードを指定する必要があります。\n` +
                                        `使用可能な文字: ひらがな、カタカナ、漢字、英数字、記号(_＿･・＄￥)`
                                    );
                                }
                            }
                            
                            // テーブル内のフィールドコードの重複チェック
                            if (usedSubtableFieldCodes.includes(fieldDef.code)) {
                                // 重複する場合、新しいフィールドコードを生成
                                const originalCode = fieldDef.code;
                                let newCode = originalCode;
                                let suffix = 1;
                                
                                // 一意のフィールドコードになるまで接尾辞を追加
                                while (usedSubtableFieldCodes.includes(newCode)) {
                                    newCode = `${originalCode}_${suffix}`;
                                    suffix++;
                                }
                                
                                // フィールドコードを更新
                                fieldDef.code = newCode;
                                
                                // 警告メッセージを記録
                                warnings.push(
                                    `テーブル "${propertyKey}" 内のフィールドコードの重複を自動修正しました: "${originalCode}" → "${fieldDef.code}"\n` +
                                    `kintoneの仕様により、フィールドコードはテーブル内で一意である必要があります。`
                                );
                            }
                            
                            // 使用済みリストに追加
                            usedSubtableFieldCodes.push(fieldDef.code);
                            
                            // プロパティキーとcodeの一致チェック
                            if (fieldDef.code !== fieldKey) {
                                warnings.push(
                                    `テーブル "${propertyKey}" 内のフィールドコードの不一致を自動修正しました: ` +
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
                                    `テーブル "${propertyKey}" 内のフィールド "${fieldKey}" の type プロパティが指定されていません。`
                                );
                            }
                            
                            // テーブル内の選択肢フィールドのoptionsの自動修正とバリデーション
                            if (fieldDef.options && FIELD_TYPES_REQUIRING_OPTIONS.includes(fieldDef.type)) {
                                // 選択肢フィールドのoptionsを自動修正
                                const { warnings: optionsWarnings, keyChanges } = autoCorrectOptions(fieldDef.type, fieldDef.options);
                                if (optionsWarnings.length > 0) {
                                    warnings.push(...optionsWarnings.map(w => `テーブル "${propertyKey}" 内: ${w}`));
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
            
            // レイアウトのバリデーション
            validateFormLayout(layout);
            
            // 各要素のサイズ設定のバリデーション
            const validateLayoutElementSizes = (items) => {
                items.forEach(item => {
                    if (item.type === "ROW" && item.fields) {
                        item.fields.forEach(field => {
                            if (field.size) {
                                validateFieldSize(field.size);
                            }
                        });
                    } else if (item.type === "GROUP" && item.layout) {
                        validateLayoutElementSizes(item.layout);
                    }
                });
            };
            
            validateLayoutElementSizes(layout);
            
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

    async updateFormFields(appId, properties, revision = -1) {
        try {
            console.error(`Updating form fields for app: ${appId}`);
            console.error('Properties:', properties);

            // 既存のフィールド情報を取得
            console.error(`Fetching existing fields for app ${appId} to validate updates`);
            let existingFields;
            try {
                existingFields = await this.getFormFields(appId);
                console.error(`Found ${Object.keys(existingFields.properties || {}).length} existing fields`);
            } catch (error) {
                console.error(`Failed to get existing fields: ${error.message}`);
                throw new Error(`既存のフィールド情報を取得できませんでした。アプリID: ${appId}`);
            }
            
            // 既存のフィールドコードのリストを作成
            const existingFieldCodes = Object.keys(existingFields.properties || {});
            console.error(`Existing field codes: ${existingFieldCodes.join(', ')}`);

            // 更新対象のフィールドが存在するかチェック
            for (const fieldCode of Object.keys(properties)) {
                if (!existingFieldCodes.includes(fieldCode)) {
                    throw new Error(`フィールド "${fieldCode}" は存在しません。更新対象のフィールドは既存のフィールドである必要があります。`);
                }
            }

            // フィールドのバリデーション
            for (const [fieldCode, fieldConfig] of Object.entries(properties)) {
                // フィールドコードのバリデーション
                validateFieldCode(fieldCode);

                // フィールドタイプが指定されていない場合はエラー
                if (!fieldConfig.type) {
                    throw new Error(`フィールド "${fieldCode}" にはタイプ(type)の指定が必須です。`);
                }

                // 単位位置の自動修正を適用
                if (fieldConfig.type) {
                    // validateField関数を使用して自動修正を適用
                    const correctedField = validateField(fieldConfig);
                    
                    // 修正されたフィールドで置き換え
                    properties[fieldCode] = correctedField;
                    
                    // 自動修正の結果をログに出力
                    if (fieldConfig.type === "NUMBER" || 
                        (fieldConfig.type === "CALC" && fieldConfig.format === "NUMBER")) {
                        if (fieldConfig.unit && !fieldConfig.unitPosition && correctedField.unitPosition) {
                            console.error(`フィールド "${fieldCode}" の unitPosition を "${correctedField.unitPosition}" に自動設定しました。`);
                        }
                    }
                }
            }

            const params = {
                app: appId,
                properties: properties,
                revision: revision
            };
            
            const response = await this.client.app.updateFormFields(params);
            console.error('Update form fields response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `update form fields for app ${appId}`);
        }
    }

    async deleteFormFields(appId, fields, revision = -1) {
        try {
            console.error(`Deleting form fields for app: ${appId}`);
            console.error('Fields to delete:', fields);

            const params = {
                app: appId,
                fields: fields,
                revision: revision
            };
            
            const response = await this.client.app.deleteFormFields(params);
            console.error('Delete form fields response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `delete form fields for app ${appId}`);
        }
    }
}
