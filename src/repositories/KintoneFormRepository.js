// src/repositories/KintoneFormRepository.js
import { BaseKintoneRepository } from './base/BaseKintoneRepository.js';
import { KintoneApiError } from './base/http/KintoneApiError.js';
import { validateFieldCode, validateOptions, validateField } from './validators/FieldValidator.js';
import { validateFormLayout, validateFieldSize } from './validators/LayoutValidator.js';
import { autoCorrectOptions } from './validators/OptionValidator.js';
import { FIELD_TYPES_REQUIRING_OPTIONS, SUBTABLE_FIELD_TYPE } from '../constants.js';
import { autoCorrectLayoutWidths, validateFieldsInLayout, addMissingFieldsToLayout } from '../utils/LayoutUtils.js';
import { LoggingUtils } from '../utils/LoggingUtils.js';

function logLookupFieldSummary(appId, properties, source) {
    if (!properties) {
        return;
    }
    const lookupCodes = Object.entries(properties)
        .filter(([, field]) => field && field.lookup !== undefined)
        .map(([code]) => code);
    if (lookupCodes.length > 0) {
        LoggingUtils.debug('form', 'lookup_fields_detected', {
            appId,
            source,
            count: lookupCodes.length,
            codes: lookupCodes
        });
    }
}

/**
 * kintoneアプリのフォーム関連操作を担当するリポジトリクラス
 */
export class KintoneFormRepository extends BaseKintoneRepository {
    /**
     * アプリのフィールド情報を取得
     * @param {number} appId アプリID
     * @returns {Promise<Object>} フィールド情報
     */
    async getFormFields(appId) {
        try {
            LoggingUtils.info('form', 'get_form_fields', { appId });
            try {
                const response = await this.client.app.getFormFields({ app: appId });
                logLookupFieldSummary(appId, response.properties, 'production');
                return response;
            } catch (error) {
                if (error instanceof KintoneApiError &&
                    (error.code === 'GAIA_AP01' || error.status === 404)) {
                    throw new Error(
                        '対象アプリのフィールド情報が本番環境で見つかりませんでした。プレビュー環境の情報が必要な場合は get_preview_form_fields ツールを使用してください。'
                    );
                }
                throw error;
            }
        } catch (error) {
            this.handleKintoneError(error, `get form fields for app ${appId}`);
        }
    }

    /**
     * アプリのフォームレイアウト情報を取得
     * @param {number} appId アプリID
     * @returns {Promise<Object>} レイアウト情報
     */
    async getFormLayout(appId) {
        try {
            LoggingUtils.info('form', 'get_form_layout', { appId });
            try {
                const response = await this.client.app.getFormLayout({ app: appId });
                LoggingUtils.debug('form', 'get_form_layout_response', response);
                return response;
            } catch (error) {
                // 404エラー（アプリが見つからない）の場合、プレビュー環境のAPIを試す
                if (error instanceof KintoneApiError && 
                    (error.code === 'GAIA_AP01' || error.status === 404)) {
                    // プレビュー環境のレイアウト情報を取得
                    const previewResponse = await this.client.app.getFormLayout({
                        app: appId,
                        preview: true // プレビュー環境を指定
                    });
                    LoggingUtils.debug('form', 'get_form_layout_preview_response', previewResponse);
                    
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

    /**
     * アプリにフィールドを追加
     * @param {number} appId アプリID
     * @param {Object} properties フィールドプロパティ
     * @returns {Promise<Object>} 追加結果
     */
    async addFields(appId, properties) {
        try {
            LoggingUtils.info('form', 'add_fields', {
                appId,
                propertyCount: Object.keys(properties || {}).length
            });

            // 既存のフィールド情報を取得
            let existingFields;
            try {
                existingFields = await this.getFormFields(appId);
                LoggingUtils.debug('form', 'existing_field_count', {
                    appId,
                    count: Object.keys(existingFields.properties || {}).length
                });
            } catch (error) {
                LoggingUtils.warn('form', 'existing_field_fetch_failed', {
                    appId,
                    message: error.message
                });
                existingFields = { properties: {} };
            }
            
            // 既存のフィールドコードのリストを作成
            const existingFieldCodes = Object.keys(existingFields.properties || {});
            LoggingUtils.debug('form', 'existing_field_codes', {
                appId,
                codes: existingFieldCodes
            });

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
                warnings.forEach((warning) => {
                    LoggingUtils.warn('form', 'field_addition_warning', { appId, warning });
                });
            }

            const response = await this.client.app.addFormFields({
                app: appId,
                properties: convertedProperties,
                revision: -1 // 最新のリビジョンを使用
            });
            LoggingUtils.debug('form', 'add_fields_response', response);
            
            // 警告メッセージを含めた拡張レスポンスを返す
            return {
                ...response,
                warnings: warnings.length > 0 ? warnings : undefined
            };
        } catch (error) {
            this.handleKintoneError(error, `add fields to app ${appId}`);
        }
    }

    /**
     * フォームレイアウトを更新
     * @param {number} appId アプリID
     * @param {Array} layout レイアウト配列
     * @param {number} revision リビジョン番号（省略時は最新）
     * @returns {Promise<Object>} 更新結果
     */
    async updateFormLayout(appId, layout, revision = -1) {
        try {
            LoggingUtils.info('form', 'update_form_layout', { appId, revision });
            LoggingUtils.debug('form', 'update_form_layout_payload', layout);
            
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
            
            // フォームフィールド情報を取得
            let formFields = null;
            try {
                const fieldsResponse = await this.getFormFields(appId);
                formFields = fieldsResponse.properties || {};
                LoggingUtils.debug('form', 'form_field_count_for_layout', {
                    appId,
                    count: Object.keys(formFields).length
                });
            } catch (error) {
                LoggingUtils.warn('form', 'form_field_fetch_failed_for_layout', {
                    appId,
                    message: error.message
                });
            }
            
            // 不足しているフィールドの自動追加の有効/無効を制御するフラグ
            const autoAddMissingFields = false; // 不足しているフィールドの自動追加を無効化

            // レイアウトに含まれていないフィールドをチェック
            let layoutWithMissingFields = layout;
            if (formFields) {
                // レイアウトに含まれていないフィールドを検出
                const missingFields = validateFieldsInLayout(layout, formFields);
                
                if (missingFields.length > 0) {
                    LoggingUtils.warn('form', 'layout_missing_fields', {
                        appId,
                        missingFields
                    });
                    
                    if (autoAddMissingFields) {
                        // 不足しているフィールドを自動追加
                        const { layout: fixedLayout, warnings } = addMissingFieldsToLayout(layout, formFields, true);
                        layoutWithMissingFields = fixedLayout;
                        
                        // 警告メッセージを出力
                        warnings.forEach((warning) => {
                            LoggingUtils.warn('form', 'auto_added_missing_field', { appId, warning });
                        });
                    } else {
                        LoggingUtils.warn('form', 'auto_add_missing_fields_disabled', { appId });
                    }
                } else {
                    LoggingUtils.debug('form', 'layout_contains_all_fields', { appId });
                }
            }
            
            // レイアウトの幅を自動補正（共通ユーティリティを使用）
            let correctedLayout = layoutWithMissingFields;
            if (formFields) {
                const { layout: widthCorrectedLayout } = autoCorrectLayoutWidths(layoutWithMissingFields, formFields);
                correctedLayout = widthCorrectedLayout;
                LoggingUtils.debug('form', 'layout_width_corrected', { appId });
            }
            
            // GROUPフィールドの label プロパティを除去する関数
            const removeGroupLabels = (items) => {
                // 入力チェック
                if (!items) {
                    LoggingUtils.warn('form', 'remove_group_labels_missing_items', { appId });
                    return [];
                }
                
                // Promiseオブジェクトの場合はエラーログを出力
                if (items instanceof Promise) {
                    LoggingUtils.warn('form', 'remove_group_labels_received_promise', { appId });
                    return [];
                }
                
                // 配列でない場合は配列に変換
                if (!Array.isArray(items)) {
                    LoggingUtils.warn('form', 'remove_group_labels_non_array', {
                        appId,
                        itemType: typeof items
                    });
                    return [];
                }
                
                return items.map(item => {
                    if (!item) {
                        LoggingUtils.warn('form', 'remove_group_labels_null_item', { appId });
                        return null;
                    }
                    
                    if (item.type === "GROUP") {
                        // label プロパティを削除した新しいオブジェクトを作成
                        const newItem = { ...item };
                        delete newItem.label;
                        
                        // layout プロパティが存在する場合は再帰的に処理
                        if (newItem.layout) {
                            // Promiseオブジェクトの場合はエラーログを出力
                            if (newItem.layout instanceof Promise) {
                                LoggingUtils.warn('form', 'group_layout_contains_promise', { appId, groupCode: newItem.code });
                                newItem.layout = [];
                            } else if (!Array.isArray(newItem.layout)) {
                                // 配列でない場合は配列に変換
                                LoggingUtils.warn('form', 'group_layout_not_array', { appId, groupCode: newItem.code });
                                // 空でない値の場合のみ配列に変換
                                newItem.layout = newItem.layout ? [newItem.layout] : [];
                            }
                            
                            newItem.layout = removeGroupLabels(newItem.layout);
                        }
                        
                        return newItem;
                    } else if (item.type === "ROW" && item.fields) {
                        // fieldsが配列でない場合は配列に変換
                        if (!Array.isArray(item.fields)) {
                            LoggingUtils.warn('form', 'row_fields_not_array', { appId });
                            item.fields = item.fields ? [item.fields] : [];
                        }
                        
                        // ROW内のフィールドも処理（念のため）
                        return {
                            ...item,
                            fields: item.fields.map(field => {
                                if (!field) {
                                    LoggingUtils.warn('form', 'row_contains_null_field', { appId });
                                    return null;
                                }
                                
                                if (field.type === "GROUP") {
                                    const newField = { ...field };
                                    delete newField.label;
                                    return newField;
                                }
                                return field;
                            }).filter(Boolean) // nullやundefinedを除外
                        };
                    }
                    return item;
                }).filter(Boolean); // nullやundefinedを除外
            };
            
            // レイアウト情報から GROUPフィールドの label プロパティを除去
            const layoutWithoutGroupLabels = removeGroupLabels(correctedLayout);
            
            const params = {
                app: appId,
                layout: layoutWithoutGroupLabels,
                revision: revision
            };
            
            // リクエストパラメータの詳細をデバッグログに出力
            LoggingUtils.debug('form', 'update_form_layout_request', {
                app: params.app,
                revision: params.revision
            });
            LoggingUtils.debug('form', 'update_form_layout_request_layout', params.layout);
            
            const response = await this.client.app.updateFormLayout(params);
            LoggingUtils.debug('form', 'update_form_layout_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `update form layout for app ${appId}`);
        }
    }

    /**
     * フォームフィールドを更新
     * @param {number} appId アプリID
     * @param {Object} properties フィールドプロパティ
     * @param {number} revision リビジョン番号（省略時は最新）
     * @returns {Promise<Object>} 更新結果
     */
    async updateFormFields(appId, properties, revision = -1) {
        try {
            LoggingUtils.info('form', 'update_form_fields', { appId, revision, propertyCount: Object.keys(properties || {}).length });
            LoggingUtils.debug('form', 'update_form_fields_payload', properties);

            // 既存のフィールド情報を取得
            let existingFields;
            try {
                existingFields = await this.getFormFields(appId);
                LoggingUtils.debug('form', 'existing_field_count_for_update', {
                    appId,
                    count: Object.keys(existingFields.properties || {}).length
                });
            } catch (error) {
                LoggingUtils.error('form', 'existing_fields_fetch_failed_for_update', error, { appId });
                throw new Error(`既存のフィールド情報を取得できませんでした。アプリID: ${appId}`);
            }
            
            // 既存のフィールドコードのリストを作成
            const existingFieldCodes = Object.keys(existingFields.properties || {});
            LoggingUtils.debug('form', 'existing_field_codes_for_update', {
                appId,
                codes: existingFieldCodes
            });

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
                            LoggingUtils.debug('form', 'unit_position_auto_set', {
                                appId,
                                fieldCode,
                                unitPosition: correctedField.unitPosition
                            });
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
            LoggingUtils.debug('form', 'update_form_fields_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `update form fields for app ${appId}`);
        }
    }

    /**
     * フォームフィールドを削除
     * @param {number} appId アプリID
     * @param {Array<string>} fields 削除するフィールドコードの配列
     * @param {number} revision リビジョン番号（省略時は最新）
     * @returns {Promise<Object>} 削除結果
     */
    async deleteFormFields(appId, fields, revision = -1) {
        try {
            LoggingUtils.info('form', 'delete_form_fields', { appId, revision, fieldCount: fields?.length || 0 });
            LoggingUtils.debug('form', 'delete_form_fields_payload', fields);

            const params = {
                app: appId,
                fields: fields,
                revision: revision
            };
            
            const response = await this.client.app.deleteFormFields(params);
            LoggingUtils.debug('form', 'delete_form_fields_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `delete form fields for app ${appId}`);
        }
    }
}
