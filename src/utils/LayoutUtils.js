// src/utils/LayoutUtils.js
import { LOOKUP_FIELD_MIN_WIDTH, SYSTEM_FIELD_TYPES } from '../constants.js';

/**
 * フィールドの幅を自動補正する関数
 * @param {Object} field レイアウト内のフィールド要素
 * @param {Object} fieldDef フィールド定義
 * @returns {Object} 補正されたフィールド要素とガイダンスメッセージを含むオブジェクト
 */
export function autoCorrectFieldWidth(field, fieldDef) {
    // フィールド要素のディープコピーを作成
    const correctedField = JSON.parse(JSON.stringify(field));
    // ガイダンスメッセージを格納する変数
    let guidance = null;
    
    // デバッグ情報の出力
    console.error(`autoCorrectFieldWidth: フィールド "${field.code}" の幅を確認中...`);
    console.error(`フィールドタイプ: ${field.type}`);
    console.error(`現在の幅: ${field.size?.width || "未指定"}`);
    
    if (fieldDef) {
        console.error(`フィールド定義: ${JSON.stringify({
            type: fieldDef.type,
            hasLookup: fieldDef.lookup !== undefined,
            lookupInfo: fieldDef.lookup ? {
                relatedApp: fieldDef.lookup.relatedApp?.app,
                relatedKeyField: fieldDef.lookup.relatedKeyField
            } : null
        })}`);
    } else {
        console.error(`フィールド定義が見つかりません`);
    }
    
    // ルックアップフィールドの場合（lookup プロパティの有無で判断）
    if (fieldDef && fieldDef.lookup !== undefined) {
        console.error(`"${field.code}" はルックアップフィールドです`);
        
        // sizeプロパティがない場合は作成
        if (!correctedField.size) {
            correctedField.size = {};
            console.error(`"${field.code}" のsizeプロパティが存在しないため作成しました`);
        }
        
        // 幅が指定されていない、または最小幅より小さい場合は補正
        if (!correctedField.size.width || parseInt(correctedField.size.width, 10) < parseInt(LOOKUP_FIELD_MIN_WIDTH, 10)) {
            const oldWidth = correctedField.size.width || "未指定";
            correctedField.size.width = LOOKUP_FIELD_MIN_WIDTH;
            console.error(`ルックアップフィールド "${field.code}" の幅を ${oldWidth} から ${LOOKUP_FIELD_MIN_WIDTH} に自動補正しました。`);
            
            // ガイダンスメッセージを設定
            guidance = `ルックアップフィールド "${field.code}" をフォームレイアウトに配置する際には必ず幅を指定する必要があり、その幅は ${LOOKUP_FIELD_MIN_WIDTH} 以上の値を明示的に指定してください。`;
            console.error(`ガイダンス: ${guidance}`);
        } else {
            console.error(`ルックアップフィールド "${field.code}" の幅は ${correctedField.size.width} で、最小幅 ${LOOKUP_FIELD_MIN_WIDTH} 以上のため補正不要です。`);
        }
    } else {
        console.error(`"${field.code}" はルックアップフィールドではありません`);
    }
    
    // 推奨幅の情報がある場合
    if (fieldDef && fieldDef._recommendedMinWidth) {
        // sizeプロパティがない場合は作成
        if (!correctedField.size) {
            correctedField.size = {};
        }
        
        // 幅が指定されていない、または推奨幅より小さい場合は補正
        if (!correctedField.size.width || parseInt(correctedField.size.width, 10) < parseInt(fieldDef._recommendedMinWidth, 10)) {
            const oldWidth = correctedField.size.width || "未指定";
            correctedField.size.width = fieldDef._recommendedMinWidth;
            console.error(`フィールド "${field.code}" の幅を ${oldWidth} から ${fieldDef._recommendedMinWidth} に自動補正しました。`);
        }
    }
    
    return {
        field: correctedField,
        guidance
    };
}

/**
 * レイアウト全体のフィールド幅を自動補正する関数
 * @param {Array} layout レイアウト配列
 * @param {Object} formFields フォームのフィールド定義
 * @returns {Object} 補正されたレイアウト配列とガイダンスメッセージの配列を含むオブジェクト
 */
export function autoCorrectLayoutWidths(layout, formFields) {
    if (!layout || !Array.isArray(layout)) return { layout, guidances: [] };
    
    // ガイダンスメッセージを収集する配列
    const guidances = [];
    
    // 再帰的にレイアウトを処理する関数
    const processLayout = (layoutItems) => {
        if (!layoutItems || !Array.isArray(layoutItems)) return layoutItems;
        
        return layoutItems.map(item => {
            // ROWの場合、内部のフィールドを処理
            if (item.type === "ROW" && item.fields) {
                const processedFields = item.fields.map(field => {
                    // フィールドコードからフィールド定義を取得
                    const fieldDef = field.code && formFields ? formFields[field.code] : null;
                    // フィールド幅の自動補正
                    const result = autoCorrectFieldWidth(field, fieldDef);
                    
                    // ガイダンスメッセージがあれば収集
                    if (result.guidance) {
                        guidances.push(result.guidance);
                    }
                    
                    return result.field;
                });
                
                return {
                    ...item,
                    fields: processedFields
                };
            }
            
            // GROUPの場合、内部のレイアウトを再帰的に処理
            if (item.type === "GROUP" && item.layout) {
                return {
                    ...item,
                    layout: processLayout(item.layout)
                };
            }
            
            return item;
        });
    };
    
    // レイアウトを処理
    const correctedLayout = processLayout(layout);
    
    return {
        layout: correctedLayout,
        guidances
    };
}

/**
 * レイアウトからフィールドコードを抽出する関数
 * @param {Array} layout レイアウト配列
 * @returns {Array} レイアウトに含まれるフィールドコードの配列
 */
export function extractFieldsFromLayout(layout) {
    if (!layout || !Array.isArray(layout)) return [];
    
    // フィールドコードを収集する配列
    const fieldCodes = [];
    
    // 再帰的にレイアウトを処理する関数
    const processLayout = (layoutItems) => {
        if (!layoutItems || !Array.isArray(layoutItems)) return;
        
        layoutItems.forEach(item => {
            // ROWの場合、内部のフィールドを処理
            if (item.type === "ROW" && item.fields) {
                item.fields.forEach(field => {
                    // フィールドコードがあれば収集
                    if (field.code) {
                        fieldCodes.push(field.code);
                    }
                });
            }
            
            // GROUPの場合、内部のレイアウトを再帰的に処理
            if (item.type === "GROUP" && item.layout) {
                processLayout(item.layout);
            }
            
            // SUBTABLEの場合、テーブル自体のコードと内部フィールドのコードを収集
            if (item.type === "SUBTABLE") {
                if (item.code) {
                    fieldCodes.push(item.code);
                }

                // テーブル内のフィールドも収集
                if (item.fields && typeof item.fields === "object") {
                    Object.values(item.fields).forEach(subField => {
                        if (subField && subField.code) {
                            fieldCodes.push(subField.code);
                        }
                    });
                }
            }
        });
    };
    
    // レイアウトを処理
    processLayout(layout);
    
    return fieldCodes;
}

/**
 * レイアウトに含まれるフィールドを検証する関数
 * @param {Array} layout レイアウト配列
 * @param {Object} allFields フォームのフィールド定義
 * @returns {Array} レイアウトに含まれていないカスタムフィールドの配列
 */
export function validateFieldsInLayout(layout, allFields) {
    if (!allFields) return [];
    
    // システムフィールドを除外したカスタムフィールドのリスト
    const customFields = Object.entries(allFields)
        .filter(([_, field]) => !SYSTEM_FIELD_TYPES.includes(field.type))
        .map(([fieldCode]) => fieldCode);
    
    // レイアウトに含まれるフィールドのリストを抽出
    const fieldsInLayout = extractFieldsFromLayout(layout);
    
    // レイアウトに含まれていないカスタムフィールドを特定
    const missingFields = customFields.filter(
        fieldCode => !fieldsInLayout.includes(fieldCode)
    );
    
    return missingFields;
}

/**
 * レイアウトに含まれていないフィールドを追加する関数
 * @param {Array} layout レイアウト配列
 * @param {Object} allFields フォームのフィールド定義
 * @param {boolean} autoFix 自動修正を行うかどうか
 * @returns {Object} 修正されたレイアウト配列と警告メッセージを含むオブジェクト
 */
export function addMissingFieldsToLayout(layout, allFields, autoFix = false) {
    if (!allFields) return { layout, warnings: [] };
    
    // レイアウトに含まれていないカスタムフィールドを特定
    const missingFields = validateFieldsInLayout(layout, allFields);
    
    // 警告メッセージを格納する配列
    const warnings = [];
    
    // 不足しているフィールドがない場合はそのまま返す
    if (missingFields.length === 0) {
        return { layout, warnings };
    }
    
    // 警告メッセージを作成
    warnings.push(`以下のフィールドがレイアウトに含まれていません: ${missingFields.join(', ')}`);
    
    // 自動修正を行わない場合はそのまま返す
    if (!autoFix) {
        warnings.push('自動修正を行うには autoFix オプションを true に設定してください。');
        return { layout, warnings };
    }
    
    // 不足しているフィールドを最下部に追加
    const newLayout = JSON.parse(JSON.stringify(layout));
    
    // 不足しているフィールドごとに行要素を作成して追加
    missingFields.forEach(fieldCode => {
        const field = allFields[fieldCode];
        if (!field) return;
        
        // フィールドタイプに応じた処理
        if (field.type === "SUBTABLE") {
            // テーブルの場合は直接追加
            newLayout.push({
                type: "SUBTABLE",
                code: fieldCode
            });
            warnings.push(`テーブルフィールド "${fieldCode}" をレイアウトに自動追加しました。`);
        } else {
            // 通常のフィールドの場合は行要素として追加
            newLayout.push({
                type: "ROW",
                fields: [{
                    type: field.type,
                    code: fieldCode
                }]
            });
            warnings.push(`フィールド "${fieldCode}" をレイアウトに自動追加しました。`);
        }
    });
    
    return { layout: newLayout, warnings };
}
