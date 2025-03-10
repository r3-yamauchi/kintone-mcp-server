// src/server/tools/FieldTools.js

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
            
            const response = await repository.addFields(
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
        
        case 'create_choice_field': {
            // 引数のチェック
            if (!args.field_type) {
                throw new Error('field_type は必須パラメータです。');
            }
            if (!args.code) {
                throw new Error('code は必須パラメータです。');
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
            
            const { field_type, code, label, choices, required = false, align = "HORIZONTAL" } = args;
            
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
            if (!args.code) {
                throw new Error('code は必須パラメータです。');
            }
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
            
            const { 
                code, 
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
            if (!args.code) {
                throw new Error('code は必須パラメータです。');
            }
            if (!args.label) {
                throw new Error('label は必須パラメータです。');
            }
            if (!args.relatedKeyField) {
                throw new Error('relatedKeyField は必須パラメータです。');
            }
            if (!args.relatedAppId && !args.relatedAppCode) {
                throw new Error('relatedAppId または relatedAppCode のいずれかは必須パラメータです。');
            }
            
            const { 
                code, 
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
        
        default:
            throw new Error(`Unknown field tool: ${name}`);
    }
}
