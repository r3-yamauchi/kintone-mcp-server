// src/server/tools/FieldTools.js
import { UNIT_POSITION_PATTERNS } from '../../constants.js';

/**
 * 単位記号に基づいて適切な unitPosition を判定する関数
 * @param {string} unit 単位記号
 * @returns {string} 適切な unitPosition ("BEFORE" または "AFTER")
 */
function determineUnitPosition(unit) {
    // 判定理由を記録する変数
    let reason = "";
    
    // 単位が指定されていない場合
    if (!unit) {
        reason = "単位が指定されていないため";
        console.error(`単位位置判定: ${reason}、デフォルト値 "AFTER" を設定`);
        return "AFTER";
    }
    
    // 単位の長さが4文字以上の場合
    if (unit.length >= 4) {
        reason = `単位の長さが4文字以上 (${unit.length}文字) のため`;
        console.error(`単位位置判定: ${reason}、"AFTER" を設定`);
        return "AFTER";
    }
    
    // 複合単位の判定（スペースや特殊記号を含む）
    if (/[\s\/\-\+]/.test(unit) || (unit.length > 1 && /[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(unit))) {
        reason = `複合単位 "${unit}" と判断されるため`;
        console.error(`単位位置判定: ${reason}、"AFTER" を設定`);
        return "AFTER";
    }
    
    // 完全一致による判定
    const isBeforeExact = UNIT_POSITION_PATTERNS.BEFORE.includes(unit);
    const isAfterExact = UNIT_POSITION_PATTERNS.AFTER.includes(unit);
    
    // 両方のパターンに一致する場合
    if (isBeforeExact && isAfterExact) {
        reason = `単位 "${unit}" が BEFORE と AFTER の両方のパターンに一致するため`;
        console.error(`単位位置判定: ${reason}、"AFTER" を優先設定`);
        return "AFTER";
    }
    
    // BEFOREパターンに完全一致
    if (isBeforeExact) {
        reason = `単位 "${unit}" が BEFORE パターンに完全一致するため`;
        console.error(`単位位置判定: ${reason}、"BEFORE" を設定`);
        return "BEFORE";
    }
    
    // AFTERパターンに完全一致
    if (isAfterExact) {
        reason = `単位 "${unit}" が AFTER パターンに完全一致するため`;
        console.error(`単位位置判定: ${reason}、"AFTER" を設定`);
        return "AFTER";
    }
    
    // 部分一致による判定（完全一致しない場合のフォールバック）
    const beforeMatches = UNIT_POSITION_PATTERNS.BEFORE.filter(pattern => unit.includes(pattern));
    const afterMatches = UNIT_POSITION_PATTERNS.AFTER.filter(pattern => unit.includes(pattern));
    
    // 両方のパターンに部分一致する場合
    if (beforeMatches.length > 0 && afterMatches.length > 0) {
        reason = `単位 "${unit}" が BEFORE パターン [${beforeMatches.join(', ')}] と AFTER パターン [${afterMatches.join(', ')}] の両方に部分一致するため`;
        console.error(`単位位置判定: ${reason}、"AFTER" を優先設定`);
        return "AFTER";
    }
    
    // BEFOREパターンに部分一致
    if (beforeMatches.length > 0) {
        reason = `単位 "${unit}" が BEFORE パターン [${beforeMatches.join(', ')}] に部分一致するため`;
        console.error(`単位位置判定: ${reason}、"BEFORE" を設定`);
        return "BEFORE";
    }
    
    // AFTERパターンに部分一致
    if (afterMatches.length > 0) {
        reason = `単位 "${unit}" が AFTER パターン [${afterMatches.join(', ')}] に部分一致するため`;
        console.error(`単位位置判定: ${reason}、"AFTER" を設定`);
        return "AFTER";
    }
    
    // どのパターンにも一致しない場合
    reason = `単位 "${unit}" がどのパターンにも一致しないため`;
    console.error(`単位位置判定: ${reason}、デフォルト値 "AFTER" を設定`);
    return "AFTER";
}

/**
 * フィールドの単位位置を自動修正する関数
 * @param {Object} field フィールドオブジェクト
 * @returns {Object} 修正されたフィールドオブジェクト
 */
export function autoCorrectUnitPosition(field) {
    // フィールドオブジェクトのディープコピーを作成
    const correctedField = JSON.parse(JSON.stringify(field));
    
    // NUMBER フィールドの場合
    if (field.type === "NUMBER" && field.unit && !field.unitPosition) {
        // 単位記号に基づいて適切な unitPosition を判定
        correctedField.unitPosition = determineUnitPosition(field.unit);
        console.error(`NUMBER フィールド "${field.code || ''}" の unitPosition を "${correctedField.unitPosition}" に自動設定しました。`);
    }
    
    // CALC フィールドの場合
    if (field.type === "CALC" && field.format === "NUMBER" && field.unit && !field.unitPosition) {
        // 単位記号に基づいて適切な unitPosition を判定
        correctedField.unitPosition = determineUnitPosition(field.unit);
        console.error(`CALC フィールド "${field.code || ''}" の unitPosition を "${correctedField.unitPosition}" に自動設定しました。`);
    }
    
    // サブテーブルフィールドの場合、内部のフィールドも再帰的に処理
    if (field.type === "SUBTABLE" && field.fields) {
        // 各サブフィールドに対して自動修正を適用
        for (const [fieldKey, fieldDef] of Object.entries(field.fields)) {
            correctedField.fields[fieldKey] = autoCorrectUnitPosition(fieldDef);
        }
        console.error(`SUBTABLE フィールド "${field.code || ''}" 内のフィールドの単位位置を自動修正しました。`);
    }
    
    return correctedField;
}

/**
 * 単位記号と unitPosition の組み合わせが適切かチェックし、警告メッセージを返す関数
 * @param {string} unit 単位記号
 * @param {string} unitPosition 単位位置
 * @returns {string|null} 警告メッセージ（問題がなければ null）
 */
function checkUnitPositionWarning(unit, unitPosition) {
    if (!unit || !unitPosition) return null;
    
    const recommendedPosition = determineUnitPosition(unit);
    
    if (unitPosition !== recommendedPosition) {
        const examples = {
            "BEFORE": "$100, ¥100",
            "AFTER": "100円, 100%, 100kg"
        };
        
        return `単位記号「${unit}」には unitPosition="${recommendedPosition}" が推奨されます。` +
               `現在の設定: "${unitPosition}"。` +
               `例: ${examples[recommendedPosition]}`;
    }
    
    return null;
}

// フィールド関連のツールを処理する関数
export async function handleFieldTools(name, args, repository) {
    switch (name) {
        case 'add_fields': {
            // 引数のチェック
            if (!args.app_id) {
                throw new Error('app_id は必須パラメータです。');
            }
            if (!args.properties) {
                throw new Error('properties は必須パラメータです。');
            }
            if (typeof args.properties !== 'object' || Array.isArray(args.properties)) {
                throw new Error('properties はオブジェクト形式で指定する必要があります。');
            }
            if (Object.keys(args.properties).length === 0) {
                throw new Error('properties には少なくとも1つのフィールド定義を指定する必要があります。');
            }
            
            // デバッグ用のログ出力
            console.error(`Adding fields to app: ${args.app_id}`);
            console.error(`Properties:`, JSON.stringify(args.properties, null, 2));
            
            // フィールドのコード設定を確認・修正
            const processedProperties = {};
            for (const [key, field] of Object.entries(args.properties)) {
                // フィールドコードが指定されていない場合は自動生成
                if (!field.code) {
                    // ラベルがある場合はラベルからコードを生成、なければキーを使用
                    const baseCode = field.label ? field.label : key;
                    // 英数字以外を削除し、小文字に変換
                    const code = baseCode
                        .replace(/[^a-zA-Z0-9ぁ-んァ-ヶー一-龠々＿_･・＄￥]/g, '')
                        .toLowerCase();
                    field.code = code || `field_${Date.now()}`;
                    console.error(`フィールドコードを自動生成しました: ${field.code}`);
                }
                
                // フィールドタイプが指定されていない場合はエラー
                if (!field.type) {
                    throw new Error(`フィールド "${field.code}" にはタイプ(type)の指定が必須です。`);
                }
                
                // 計算フィールドの場合、formulaからexpressionへの自動変換
                if (field.type === "CALC" && field.formula !== undefined && field.expression === undefined) {
                    field.expression = field.formula;
                    delete field.formula;
                    console.error(`警告: 計算フィールド "${field.code}" の計算式は formula ではなく expression に指定してください。今回は自動的に変換しました。`);
                }
                
                // 数値フィールドの場合、displayScaleが空文字列なら削除
                if (field.type === "NUMBER" && field.displayScale === "") {
                    delete field.displayScale;
                    console.error(`数値フィールド "${field.code}" の displayScale に空文字列が指定されたため、指定を削除しました。`);
                }
                
                processedProperties[field.code] = field;
            }
            
            const response = await repository.addFields(
                args.app_id,
                processedProperties
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
        
        case 'create_choice_field': {
            // 引数のチェック
            if (!args.field_type) {
                throw new Error('field_type は必須パラメータです。');
            }
            if (!args.label) {
                throw new Error('label は必須パラメータです。');
            }
            if (!args.choices) {
                throw new Error('choices は必須パラメータです。');
            }
            if (!Array.isArray(args.choices)) {
                throw new Error('choices は配列形式で指定する必要があります。');
            }
            
            // 有効なフィールドタイプかチェック
            const validFieldTypes = ["RADIO_BUTTON", "CHECK_BOX", "DROP_DOWN", "MULTI_SELECT"];
            if (!validFieldTypes.includes(args.field_type)) {
                throw new Error(`field_type は ${validFieldTypes.join(', ')} のいずれかである必要があります。`);
            }
            
            // フィールドコードの自動生成
            let code = args.code;
            if (!code) {
                // ラベルからコードを生成
                code = args.label
                    .replace(/[^a-zA-Z0-9ぁ-んァ-ヶー一-龠々＿_･・＄￥]/g, '_')
                    .toLowerCase();
                
                // 先頭が数字の場合、先頭に 'f_' を追加
                if (/^[0-9０-９]/.test(code)) {
                    code = 'f_' + code;
                }
                
                console.error(`フィールドコードを自動生成しました: ${code}`);
            }
            
            const { field_type, label, choices, required = false, align = "HORIZONTAL" } = args;
            
            // デバッグ用のログ出力
            console.error(`Creating choice field: ${code}`);
            console.error(`Field type: ${field_type}`);
            console.error(`Label: ${label}`);
            console.error(`Choices:`, JSON.stringify(choices, null, 2));
            
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
        
        case 'create_reference_table_field': {
            // 引数のチェック
            if (!args.label) {
                throw new Error('label は必須パラメータです。');
            }
            if (!args.conditionField) {
                throw new Error('conditionField は必須パラメータです。');
            }
            if (!args.relatedConditionField) {
                throw new Error('relatedConditionField は必須パラメータです。');
            }
            if (!args.relatedAppId && !args.relatedAppCode) {
                throw new Error('relatedAppId または relatedAppCode のいずれかは必須パラメータです。');
            }
            
            // フィールドコードの自動生成
            let code = args.code;
            if (!code) {
                // ラベルからコードを生成
                code = args.label
                    .replace(/[^a-zA-Z0-9ぁ-んァ-ヶー一-龠々＿_･・＄￥]/g, '_')
                    .toLowerCase();
                
                // 先頭が数字の場合、先頭に 'f_' を追加
                if (/^[0-9０-９]/.test(code)) {
                    code = 'f_' + code;
                }
                
                console.error(`フィールドコードを自動生成しました: ${code}`);
            }
            
            const { 
                label, 
                relatedAppId, 
                relatedAppCode, 
                conditionField, 
                relatedConditionField, 
                filterCond, 
                displayFields, 
                sort, 
                size, 
                noLabel = true 
            } = args;
            
            // デバッグ用のログ出力
            console.error(`Creating reference table field: ${code}`);
            console.error(`Label: ${label}`);
            console.error(`Related app: ${relatedAppCode || relatedAppId}`);
            console.error(`Condition: ${conditionField} -> ${relatedConditionField}`);
            
            // フィールド設定の基本部分
            const fieldConfig = {
                type: "REFERENCE_TABLE",
                code: code,
                label: label,
                noLabel: noLabel,
                referenceTable: {
                    relatedApp: {},
                    condition: {
                        field: conditionField,
                        relatedField: relatedConditionField
                    }
                }
            };
            
            // relatedApp の設定（app と code の優先順位に注意）
            if (relatedAppCode) {
                fieldConfig.referenceTable.relatedApp.code = relatedAppCode;
            }
            if (relatedAppId && !relatedAppCode) {
                fieldConfig.referenceTable.relatedApp.app = relatedAppId;
            }
            
            // オプション項目の追加
            if (filterCond) fieldConfig.referenceTable.filterCond = filterCond;
            if (displayFields && Array.isArray(displayFields)) fieldConfig.referenceTable.displayFields = displayFields;
            if (sort) fieldConfig.referenceTable.sort = sort;
            if (size) fieldConfig.referenceTable.size = String(size); // 文字列型に変換
            
            return fieldConfig;
        }
        
        case 'create_lookup_field': {
            // 引数のチェック
            if (!args.label) {
                throw new Error('label は必須パラメータです。');
            }
            if (!args.relatedKeyField) {
                throw new Error('relatedKeyField は必須パラメータです。');
            }
            if (!args.relatedAppId && !args.relatedAppCode) {
                throw new Error('relatedAppId または relatedAppCode のいずれかは必須パラメータです。');
            }
            
            // フィールドコードの自動生成
            let code = args.code;
            if (!code) {
                // ラベルからコードを生成
                code = args.label
                    .replace(/[^a-zA-Z0-9ぁ-んァ-ヶー一-龠々＿_･・＄￥]/g, '_')
                    .toLowerCase();
                
                // 先頭が数字の場合、先頭に 'f_' を追加
                if (/^[0-9０-９]/.test(code)) {
                    code = 'f_' + code;
                }
                
                console.error(`フィールドコードを自動生成しました: ${code}`);
            }
            
            const { 
                label, 
                relatedAppId, 
                relatedAppCode, 
                relatedKeyField, 
                fieldMappings, 
                lookupPickerFields, 
                filterCond, 
                sort, 
                required = false 
            } = args;
            
            // デバッグ用のログ出力
            console.error(`Creating lookup field: ${code}`);
            console.error(`Label: ${label}`);
            console.error(`Related app: ${relatedAppCode || relatedAppId}`);
            console.error(`Related key field: ${relatedKeyField}`);
            
            // バリデーション
            if (!fieldMappings || !Array.isArray(fieldMappings) || fieldMappings.length === 0) {
                throw new Error('fieldMappingsは少なくとも1つのマッピングを含む配列である必要があります');
            }
            
            // フィールドマッピングの各要素をチェック
            fieldMappings.forEach((mapping, index) => {
                if (!mapping.field) {
                    throw new Error(`fieldMappings[${index}].fieldは必須です`);
                }
                if (!mapping.relatedField) {
                    throw new Error(`fieldMappings[${index}].relatedFieldは必須です`);
                }
            });
            
            // デバッグ用のログ出力（フィールドマッピング）
            console.error(`Field mappings:`, JSON.stringify(fieldMappings, null, 2));
            
            // フィールド設定の基本部分
            const fieldConfig = {
                type: "LOOKUP",
                code: code,
                label: label,
                required: required,
                lookup: {
                    relatedApp: {},
                    relatedKeyField: relatedKeyField,
                    fieldMappings: fieldMappings
                }
            };
            
            // relatedApp の設定（code が優先）
            if (relatedAppCode) {
                fieldConfig.lookup.relatedApp.code = relatedAppCode;
            }
            if (relatedAppId && !relatedAppCode) {
                fieldConfig.lookup.relatedApp.app = relatedAppId;
            }
            
            // オプション項目の追加
            if (lookupPickerFields && Array.isArray(lookupPickerFields)) {
                fieldConfig.lookup.lookupPickerFields = lookupPickerFields;
            }
            if (filterCond) fieldConfig.lookup.filterCond = filterCond;
            if (sort) fieldConfig.lookup.sort = sort;
            
            return fieldConfig;
        }
        
        case 'create_text_field': {
            // 引数のチェック
            if (!args.code) {
                throw new Error('code は必須パラメータです。');
            }
            if (!args.label) {
                throw new Error('label は必須パラメータです。');
            }
            if (!args.field_type || !['SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT'].includes(args.field_type)) {
                throw new Error('field_type は SINGLE_LINE_TEXT または MULTI_LINE_TEXT である必要があります。');
            }
            
            const { 
                field_type, 
                code, 
                label, 
                required = false, 
                noLabel = false,
                unique = false,
                maxLength,
                minLength,
                defaultValue = ""
            } = args;
            
            // デバッグ用のログ出力
            console.error(`Creating text field: ${code}`);
            console.error(`Field type: ${field_type}`);
            console.error(`Label: ${label}`);
            
            // フィールド設定の基本部分
            const fieldConfig = {
                type: field_type,
                code: code,
                label: label,
                noLabel: noLabel,
                required: required
            };
            
            // オプション項目の追加
            if (unique) fieldConfig.unique = unique;
            if (defaultValue !== "") fieldConfig.defaultValue = defaultValue;
            if (maxLength !== undefined) fieldConfig.maxLength = String(maxLength);
            if (minLength !== undefined) fieldConfig.minLength = String(minLength);
            
            return fieldConfig;
        }
        
        case 'create_number_field': {
            // 引数のチェック
            if (!args.code) {
                throw new Error('code は必須パラメータです。');
            }
            if (!args.label) {
                throw new Error('label は必須パラメータです。');
            }
            
            const { 
                code, 
                label, 
                required = false, 
                noLabel = false,
                unique = false,
                maxValue,
                minValue,
                defaultValue = "",
                digit = false,
                unit,
                unitPosition,
                displayScale
            } = args;
            
            // デバッグ用のログ出力
            console.error(`Creating number field: ${code}`);
            console.error(`Label: ${label}`);
            
            // 単位記号に基づいて適切な unitPosition を判定
            let effectiveUnitPosition;
            
            if (unitPosition !== undefined) {
                // ユーザーが明示的に指定した場合はその値を使用
                effectiveUnitPosition = unitPosition;
                
                // 単位記号と unitPosition の組み合わせが不自然な場合は警告
                if (unit) {
                    const warning = checkUnitPositionWarning(unit, unitPosition);
                    if (warning) {
                        console.error(`警告: ${warning}`);
                    }
                }
            } else if (unit) {
                // 単位記号が指定されている場合は自動判定
                effectiveUnitPosition = determineUnitPosition(unit);
                console.error(`単位記号「${unit}」に基づいて unitPosition を "${effectiveUnitPosition}" に自動設定しました。`);
            } else {
                // どちらも指定されていない場合はデフォルト値を AFTER に変更
                effectiveUnitPosition = "AFTER";
            }
            
            // フィールド設定の基本部分
            const fieldConfig = {
                type: "NUMBER",
                code: code,
                label: label,
                noLabel: noLabel,
                required: required
            };
            
            // オプション項目の追加
            if (unique) fieldConfig.unique = unique;
            if (defaultValue !== "") fieldConfig.defaultValue = defaultValue;
            if (digit) fieldConfig.digit = digit;
            if (maxValue !== undefined) fieldConfig.maxValue = String(maxValue);
            if (minValue !== undefined) fieldConfig.minValue = String(minValue);
            if (unit !== undefined) fieldConfig.unit = unit;
            fieldConfig.unitPosition = effectiveUnitPosition;
            
            // displayScaleが空文字列なら削除、それ以外は設定
            if (displayScale === "") {
                console.error(`数値フィールド "${code}" の displayScale に空文字列が指定されたため、指定を削除しました。`);
                // displayScaleを設定しない
            } else if (displayScale !== undefined) {
                // displayScaleの値の範囲チェック
                const scale = parseInt(displayScale, 10);
                if (isNaN(scale) || scale < 0 || scale > 10) {
                    throw new Error('displayScaleは0から10までの整数で指定してください。');
                }
                fieldConfig.displayScale = String(displayScale);
            }
            
            return fieldConfig;
        }
        
        case 'create_date_field': {
            // 引数のチェック
            if (!args.code) {
                throw new Error('code は必須パラメータです。');
            }
            if (!args.label) {
                throw new Error('label は必須パラメータです。');
            }
            
            const { 
                code, 
                label, 
                required = false, 
                noLabel = false,
                unique = false,
                defaultValue = ""
            } = args;
            
            // デバッグ用のログ出力
            console.error(`Creating date field: ${code}`);
            console.error(`Label: ${label}`);
            
            // フィールド設定の基本部分
            const fieldConfig = {
                type: "DATE",
                code: code,
                label: label,
                noLabel: noLabel,
                required: required
            };
            
            // オプション項目の追加
            if (unique) fieldConfig.unique = unique;
            if (defaultValue !== "") fieldConfig.defaultValue = defaultValue;
            
            return fieldConfig;
        }
        
        case 'create_time_field': {
            // 引数のチェック
            if (!args.code) {
                throw new Error('code は必須パラメータです。');
            }
            if (!args.label) {
                throw new Error('label は必須パラメータです。');
            }
            
            const { 
                code, 
                label, 
                required = false, 
                noLabel = false,
                unique = false,
                defaultValue = ""
            } = args;
            
            // デバッグ用のログ出力
            console.error(`Creating time field: ${code}`);
            console.error(`Label: ${label}`);
            
            // フィールド設定の基本部分
            const fieldConfig = {
                type: "TIME",
                code: code,
                label: label,
                noLabel: noLabel,
                required: required
            };
            
            // オプション項目の追加
            if (unique) fieldConfig.unique = unique;
            if (defaultValue !== "") fieldConfig.defaultValue = defaultValue;
            
            return fieldConfig;
        }
        
        case 'create_datetime_field': {
            // 引数のチェック
            if (!args.code) {
                throw new Error('code は必須パラメータです。');
            }
            if (!args.label) {
                throw new Error('label は必須パラメータです。');
            }
            
            const { 
                code, 
                label, 
                required = false, 
                noLabel = false,
                unique = false,
                defaultValue = ""
            } = args;
            
            // デバッグ用のログ出力
            console.error(`Creating datetime field: ${code}`);
            console.error(`Label: ${label}`);
            
            // フィールド設定の基本部分
            const fieldConfig = {
                type: "DATETIME",
                code: code,
                label: label,
                noLabel: noLabel,
                required: required
            };
            
            // オプション項目の追加
            if (unique) fieldConfig.unique = unique;
            if (defaultValue !== "") fieldConfig.defaultValue = defaultValue;
            
            return fieldConfig;
        }
        
        case 'create_rich_text_field': {
            // 引数のチェック
            if (!args.code) {
                throw new Error('code は必須パラメータです。');
            }
            if (!args.label) {
                throw new Error('label は必須パラメータです。');
            }
            
            const { 
                code, 
                label, 
                required = false, 
                noLabel = false,
                defaultValue = ""
            } = args;
            
            // デバッグ用のログ出力
            console.error(`Creating rich text field: ${code}`);
            console.error(`Label: ${label}`);
            
            // フィールド設定の基本部分
            const fieldConfig = {
                type: "RICH_TEXT",
                code: code,
                label: label,
                noLabel: noLabel,
                required: required
            };
            
            // オプション項目の追加
            if (defaultValue !== "") fieldConfig.defaultValue = defaultValue;
            
            return fieldConfig;
        }
        
        case 'create_attachment_field': {
            // 引数のチェック
            if (!args.code) {
                throw new Error('code は必須パラメータです。');
            }
            if (!args.label) {
                throw new Error('label は必須パラメータです。');
            }
            
            const { 
                code, 
                label, 
                required = false, 
                noLabel = false
            } = args;
            
            // デバッグ用のログ出力
            console.error(`Creating attachment field: ${code}`);
            console.error(`Label: ${label}`);
            
            // フィールド設定の基本部分
            const fieldConfig = {
                type: "FILE",
                code: code,
                label: label,
                noLabel: noLabel,
                required: required
            };
            
            return fieldConfig;
        }
        
        case 'create_user_select_field': {
            // 引数のチェック
            if (!args.code) {
                throw new Error('code は必須パラメータです。');
            }
            if (!args.label) {
                throw new Error('label は必須パラメータです。');
            }
            if (!args.field_type || !['USER_SELECT', 'GROUP_SELECT', 'ORGANIZATION_SELECT'].includes(args.field_type)) {
                throw new Error('field_type は USER_SELECT, GROUP_SELECT, ORGANIZATION_SELECT のいずれかである必要があります。');
            }
            
            const { 
                field_type,
                code, 
                label, 
                required = false, 
                noLabel = false,
                defaultValue = [],
                entities = []
            } = args;
            
            // デバッグ用のログ出力
            console.error(`Creating ${field_type} field: ${code}`);
            console.error(`Label: ${label}`);
            
            // フィールド設定の基本部分
            const fieldConfig = {
                type: field_type,
                code: code,
                label: label,
                noLabel: noLabel,
                required: required
            };
            
            // オプション項目の追加
            if (defaultValue.length > 0) fieldConfig.defaultValue = defaultValue;
            if (entities.length > 0) fieldConfig.entities = entities;
            
            return fieldConfig;
        }
        
        case 'create_subtable_field': {
            // 引数のチェック
            if (!args.code) {
                throw new Error('code は必須パラメータです。');
            }
            if (!args.label) {
                throw new Error('label は必須パラメータです。');
            }
            if (!args.fields || !Array.isArray(args.fields) || args.fields.length === 0) {
                throw new Error('fields は必須パラメータで、少なくとも1つのフィールド定義を含む配列である必要があります。');
            }
            
            const { 
                code, 
                label, 
                fields
            } = args;
            
            // デバッグ用のログ出力
            console.error(`Creating table field: ${code}`);
            console.error(`Label: ${label}`);
            console.error(`Fields:`, JSON.stringify(fields, null, 2));
            
            // テーブル内のフィールド定義を構築
            const subtableFields = {};
            
            // 各フィールド定義を処理
            for (const fieldDef of fields) {
                if (!fieldDef.code) {
                    throw new Error('テーブル内の各フィールドには code の指定が必須です。');
                }
                if (!fieldDef.type) {
                    throw new Error(`テーブル内のフィールド "${fieldDef.code}" には type の指定が必須です。`);
                }
                if (!fieldDef.label) {
                    throw new Error(`テーブル内のフィールド "${fieldDef.code}" には label の指定が必須です。`);
                }
                
                // テーブル内では使用できないフィールドタイプをチェック
                const invalidSubtableFieldTypes = [
                    'SUBTABLE',
                    'REFERENCE_TABLE',
                    'STATUS',
                    'RELATED_RECORDS',
                    'RECORD_NUMBER',
                    'CREATOR',
                    'MODIFIER',
                    'CREATED_TIME',
                    'UPDATED_TIME'
                ];
                
                if (invalidSubtableFieldTypes.includes(fieldDef.type)) {
                    throw new Error(`テーブル内では "${fieldDef.type}" タイプのフィールドは使用できません。`);
                }
                
                // フィールド定義をテーブルのfieldsに追加
                subtableFields[fieldDef.code] = fieldDef;
            }
            
            // フィールド設定の基本部分
            const fieldConfig = {
                type: "SUBTABLE",
                code: code,
                label: label,
                noLabel: false,
                fields: subtableFields
            };
            
            return fieldConfig;
        }
        
        case 'create_calc_field': {
            // 計算フィールドの仕様に関する警告を表示
            console.error(`
【注意】kintoneの計算フィールドについて
- kintoneの計算フィールドは独自の構文と関数セットを持っています
- Excel/Spreadsheetなどで使用できる関数の多くはサポートされていません
- サブテーブル内のフィールドを参照する場合は、テーブル名を指定せず、フィールドコードのみを使用してください
  正しい例: SUM(金額)
  誤った例: SUM(経費明細.金額)
- 日付の差分計算は DATE_FORMAT(日付1, "YYYY/MM/DD") - DATE_FORMAT(日付2, "YYYY/MM/DD") で行います
- 詳細な仕様は get_field_type_documentation ツールで確認できます
  例: get_field_type_documentation({ field_type: "CALC" })
`);

            // 引数のチェック
            if (!args.code) {
                throw new Error('code は必須パラメータです。');
            }
            if (!args.label) {
                throw new Error('label は必須パラメータです。');
            }
            if (!args.expression) {
                throw new Error('expression は必須パラメータです。');
            }
            
            const { 
                code, 
                label, 
                expression,
                noLabel = false,
                // 表示形式関連パラメータ
                format,
                digit = false,
                displayScale = "0",
                unit = "",
                unitPosition
            } = args;
            
            // デバッグ用のログ出力
            console.error(`Creating calculation field: ${code}`);
            console.error(`Label: ${label}`);
            console.error(`Expression: ${expression}`);
            
            // フィールド設定の基本部分
            const fieldConfig = {
                type: "CALC",
                code: code,
                label: label,
                noLabel: noLabel,
                expression: expression
            };
            
            // 表示形式の設定
            // digit=trueの場合はNUMBER_DIGITを使用、それ以外はformatパラメータまたはデフォルト値を使用
            if (digit === true) {
                fieldConfig.format = "NUMBER_DIGIT";
                console.error(`桁区切り表示が有効なため、format を "NUMBER_DIGIT" に設定しました。`);
            } else if (format) {
                fieldConfig.format = format;
                console.error(`Format: ${format}`);
            } else {
                // デフォルトでNUMBER_DIGITを使用（桁区切り表示をデフォルトにする）
                fieldConfig.format = "NUMBER_DIGIT";
                console.error(`formatが指定されていないため、デフォルト値 "NUMBER_DIGIT" を設定しました。`);
            }
            
            // 数値形式の場合の追加設定
            if (fieldConfig.format === "NUMBER" || fieldConfig.format === "NUMBER_DIGIT") {
                // digitはformatで表現するため、fieldConfigには含めない
                
                if (displayScale !== undefined) fieldConfig.displayScale = String(displayScale);
                if (unit !== undefined) fieldConfig.unit = unit;
                
                // 単位記号に基づいて適切な unitPosition を判定
                let effectiveUnitPosition;
                
                if (unitPosition !== undefined) {
                    // ユーザーが明示的に指定した場合はその値を使用
                    effectiveUnitPosition = unitPosition;
                    
                    // 単位記号と unitPosition の組み合わせが不自然な場合は警告
                    if (unit) {
                        const warning = checkUnitPositionWarning(unit, unitPosition);
                        if (warning) {
                            console.error(`警告: ${warning}`);
                        }
                    }
                } else if (unit) {
                    // 単位記号が指定されている場合は自動判定
                    effectiveUnitPosition = determineUnitPosition(unit);
                    console.error(`単位記号「${unit}」に基づいて unitPosition を "${effectiveUnitPosition}" に自動設定しました。`);
                } else {
                    // どちらも指定されていない場合はデフォルト値を AFTER に変更
                    effectiveUnitPosition = "AFTER";
                }
                
                fieldConfig.unitPosition = effectiveUnitPosition;
            }
            
            return fieldConfig;
        }
        
        case 'create_status_field': {
            // 引数のチェック
            if (!args.code) {
                throw new Error('code は必須パラメータです。');
            }
            if (!args.label) {
                throw new Error('label は必須パラメータです。');
            }
            if (!args.states || !Array.isArray(args.states) || args.states.length === 0) {
                throw new Error('states は必須パラメータで、少なくとも1つの状態定義を含む配列である必要があります。');
            }
            
            const { 
                code, 
                label, 
                states,
                defaultState = states[0].name,
                noLabel = false
            } = args;
            
            // デバッグ用のログ出力
            console.error(`Creating status field: ${code}`);
            console.error(`Label: ${label}`);
            console.error(`States:`, JSON.stringify(states, null, 2));
            
            // 状態定義を構築
            const statesObj = {};
            
            // 各状態定義を処理
            for (const stateDef of states) {
                if (!stateDef.name) {
                    throw new Error('各状態には name の指定が必須です。');
                }
                
                // 状態定義をstatesに追加
                statesObj[stateDef.name] = {
                    name: stateDef.name,
                    index: stateDef.index || String(Object.keys(statesObj).length),
                    ...(stateDef.transitions && { transitions: stateDef.transitions })
                };
            }
            
            // フィールド設定の基本部分
            const fieldConfig = {
                type: "STATUS",
                code: code,
                label: label,
                noLabel: noLabel,
                states: statesObj,
                defaultState: defaultState
            };
            
            return fieldConfig;
        }
        
        case 'create_related_records_field': {
            // 引数のチェック
            if (!args.code) {
                throw new Error('code は必須パラメータです。');
            }
            if (!args.label) {
                throw new Error('label は必須パラメータです。');
            }
            if (!args.relatedApp) {
                throw new Error('relatedApp は必須パラメータです。');
            }
            if (!args.condition) {
                throw new Error('condition は必須パラメータです。');
            }
            if (!args.condition.field) {
                throw new Error('condition.field は必須パラメータです。');
            }
            if (!args.condition.relatedField) {
                throw new Error('condition.relatedField は必須パラメータです。');
            }
            
            const { 
                code, 
                label, 
                relatedApp,
                condition,
                displayFields,
                filterCond,
                sort,
                noLabel = false
            } = args;
            
            // デバッグ用のログ出力
            console.error(`Creating related records field: ${code}`);
            console.error(`Label: ${label}`);
            console.error(`Related app:`, JSON.stringify(relatedApp, null, 2));
            console.error(`Condition:`, JSON.stringify(condition, null, 2));
            
            // フィールド設定の基本部分
            const fieldConfig = {
                type: "RELATED_RECORDS",
                code: code,
                label: label,
                noLabel: noLabel,
                relatedApp: relatedApp,
                condition: condition
            };
            
            // オプション項目の追加
            if (displayFields) fieldConfig.displayFields = displayFields;
            if (filterCond) fieldConfig.filterCond = filterCond;
            if (sort) fieldConfig.sort = sort;
            
            return fieldConfig;
        }
        
        case 'create_link_field': {
            // 引数のチェック
            if (!args.code) {
                throw new Error('code は必須パラメータです。');
            }
            if (!args.label) {
                throw new Error('label は必須パラメータです。');
            }
            if (!args.protocol || !['WEB', 'MAIL', 'CALL'].includes(args.protocol)) {
                throw new Error('protocol は WEB, MAIL, CALL のいずれかである必要があります。');
            }
            
            const { 
                code, 
                label, 
                protocol,
                required = false, 
                noLabel = false,
                unique = false,
                maxLength,
                minLength,
                defaultValue = ""
            } = args;
            
            // デバッグ用のログ出力
            console.error(`Creating link field: ${code}`);
            console.error(`Label: ${label}`);
            console.error(`Protocol: ${protocol}`);
            
            // フィールド設定の基本部分
            const fieldConfig = {
                type: "LINK",
                code: code,
                label: label,
                noLabel: noLabel,
                required: required,
                protocol: protocol
            };
            
            // オプション項目の追加
            if (unique) fieldConfig.unique = unique;
            if (defaultValue !== "") fieldConfig.defaultValue = defaultValue;
            if (maxLength !== undefined) fieldConfig.maxLength = String(maxLength);
            if (minLength !== undefined) fieldConfig.minLength = String(minLength);
            
            return fieldConfig;
        }
        
        case 'update_field': {
            // 引数のチェック
            if (!args.app_id) {
                throw new Error('app_id は必須パラメータです。');
            }
            if (!args.field_code) {
                throw new Error('field_code は必須パラメータです。');
            }
            if (!args.field) {
                throw new Error('field は必須パラメータです。');
            }
            if (typeof args.field !== 'object' || Array.isArray(args.field)) {
                throw new Error('field はオブジェクト形式で指定する必要があります。');
            }
            
            // デバッグ用のログ出力
            console.error(`Updating field in app: ${args.app_id}`);
            console.error(`Field code: ${args.field_code}`);
            console.error(`Field:`, JSON.stringify(args.field, null, 2));
            
            // フィールドのタイプチェック
            if (!args.field.type) {
                throw new Error(`フィールド "${args.field_code}" にはタイプ(type)の指定が必須です。`);
            }
            
            // システムフィールドタイプのチェック
            const systemFieldTypes = ['RECORD_NUMBER', 'CREATOR', 'MODIFIER', 'CREATED_TIME', 'UPDATED_TIME'];
            if (systemFieldTypes.includes(args.field.type)) {
                throw new Error(
                    `フィールドタイプ "${args.field.type}" は更新できません。これはkintoneによって自動的に作成されるシステムフィールドです。\n` +
                    `代替方法として、以下のようなフィールドを追加できます：\n` +
                    `- CREATOR（作成者）の代わりに「申請者」などの名前でUSER_SELECTフィールド\n` +
                    `- MODIFIER（更新者）の代わりに「承認者」などの名前でUSER_SELECTフィールド\n` +
                    `- CREATED_TIME（作成日時）の代わりに「申請日時」などの名前でDATETIMEフィールド\n` +
                    `- UPDATED_TIME（更新日時）の代わりに「承認日時」などの名前でDATETIMEフィールド\n` +
                    `- RECORD_NUMBER（レコード番号）の代わりに「管理番号」などの名前でSINGLE_LINE_TEXTフィールド`
                );
            }
            
            // プロパティオブジェクトの作成
            const properties = {
                [args.field_code]: args.field
            };
            
            // フィールドの更新
            const response = await repository.updateFormFields(
                args.app_id,
                properties,
                args.revision || -1
            );
            
            return {
                revision: response.revision
            };
        }
        
        default:
            throw new Error(`Unknown field tool: ${name}`);
    }
}
