// src/server/tools/definitions/FieldToolDefinitions.js

/**
 * フィールド関連のツール定義
 */
export const fieldToolDefinitions = [
    {
        name: 'add_fields',
        description: 'kintoneアプリにフィールドを追加します。各フィールドには code（フィールドコード）、type（フィールドタイプ）、label（表示名）の指定が必須です。\n' +
            'フィールドコードに使用できる文字: ひらがな、カタカナ、漢字、英数字、記号(_＿･・＄￥)\n' +
            '注意: システムフィールドタイプ（CREATOR, MODIFIER, RECORD_NUMBER, CREATED_TIME, UPDATED_TIME）は追加できません。これらはkintoneによって自動的に作成されるフィールドです。\n' +
            '`type`: `CREATOR` のようなシステムフィールドタイプを指定すると、エラーが発生します。\n' +
            '代替方法として、以下のようなフィールドを追加できます：\n' +
            '- CREATOR（作成者）の代わりに「申請者」などの名前でUSER_SELECTフィールド\n' +
            '- MODIFIER（更新者）の代わりに「承認者」などの名前でUSER_SELECTフィールド\n' +
            '- CREATED_TIME（作成日時）の代わりに「申請日時」などの名前でDATETIMEフィールド\n' +
            '- UPDATED_TIME（更新日時）の代わりに「承認日時」などの名前でDATETIMEフィールド\n' +
            '- RECORD_NUMBER（レコード番号）の代わりに「管理番号」などの名前でSINGLE_LINE_TEXTフィールド\n' +
            '例: {\n' +
            '  "app_id": 123,\n' +
            '  "properties": {\n' +
            '    "number_field": {\n' +
            '      "type": "NUMBER",\n' +
            '      "code": "number_field",\n' +
            '      "label": "数値フィールド"\n' +
            '    },\n' +
            '    "text_field": {\n' +
            '      "type": "SINGLE_LINE_TEXT",\n' +
            '      "code": "text_field",\n' +
            '      "label": "テキストフィールド"\n' +
            '    }\n' +
            '  }\n' +
            '}\n' +
            'また、ルックアップフィールドをフォームに配置する際は 250 以上の幅を明示的に指定してください。',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'アプリID'
                },
                properties: {
                    type: 'object',
                    description: 'フィールドの設定（各フィールドには code, type, label の指定が必須）'
                }
            },
            required: ['app_id', 'properties']
        },
        annotations: {
            readOnly: false,
            safe: false,
            category: 'app',
            requiresConfirmation: true,
            longRunning: false,
            impact: 'medium'
        }
    },
    {
        name: 'update_field',
        description: '既存のkintoneフィールドの設定を更新します。\n' +
            '注意: システムフィールドタイプ（CREATOR, MODIFIER, RECORD_NUMBER, CREATED_TIME, UPDATED_TIME）は更新できません。\n' +
            '例: {\n' +
            '  "app_id": 123,\n' +
            '  "field_code": "text_field",\n' +
            '  "field": {\n' +
            '    "type": "SINGLE_LINE_TEXT",\n' +
            '    "code": "text_field",\n' +
            '    "label": "更新後のラベル",\n' +
            '    "required": true\n' +
            '  }\n' +
            '}',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'アプリID'
                },
                field_code: {
                    type: 'string',
                    description: '更新対象のフィールドコード'
                },
                field: {
                    type: 'object',
                    description: '更新後のフィールド設定'
                },
                revision: {
                    type: 'number',
                    description: 'アプリのリビジョン番号（省略時は-1で最新リビジョンを使用）'
                }
            },
            required: ['app_id', 'field_code', 'field']
        },
        annotations: {
            readOnly: false,
            safe: false,
            category: 'app',
            requiresConfirmation: true,
            longRunning: false,
            impact: 'medium'
        }
    },
    {
        name: 'create_choice_field',
        description: '選択肢フィールド（ラジオボタン、チェックボックス、ドロップダウン、複数選択）の設定を生成します。\n' +
            'フィールドコードに使用できる文字: ひらがな、カタカナ、漢字、英数字、記号(_＿･・＄￥)\n' +
            '例: {\n' +
            '  "field_type": "RADIO_BUTTON",\n' +
            '  "code": "radio_field",\n' +
            '  "label": "ラジオボタン",\n' +
            '  "choices": ["選択肢1", "選択肢2", "選択肢3"],\n' +
            '  "align": "HORIZONTAL"\n' +
            '}',
        inputSchema: {
            type: 'object',
            properties: {
                field_type: {
                    type: 'string',
                    enum: ['RADIO_BUTTON', 'CHECK_BOX', 'DROP_DOWN', 'MULTI_SELECT'],
                    description: 'フィールドタイプ'
                },
                code: {
                    type: 'string',
                    description: 'フィールドコード（指定しない場合はlabelから自動生成）'
                },
                label: {
                    type: 'string',
                    description: 'フィールドラベル'
                },
                choices: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    description: '選択肢の配列'
                },
                required: {
                    type: 'boolean',
                    description: '必須フィールドかどうか'
                },
                align: {
                    type: 'string',
                    enum: ['HORIZONTAL', 'VERTICAL'],
                    description: 'ラジオボタン・チェックボックスの配置方向'
                }
            },
            required: ['field_type', 'label', 'choices']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'field',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'create_reference_table_field',
        description: '関連テーブルフィールドの設定を生成します。\n' +
            'フィールドコードに使用できる文字: ひらがな、カタカナ、漢字、英数字、記号(_＿･・＄￥)\n' +
            '例: {\n' +
            '  "code": "related_table",\n' +
            '  "label": "関連テーブル",\n' +
            '  "relatedAppId": 123,\n' +
            '  "conditionField": "customer_id",\n' +
            '  "relatedConditionField": "customer_id"\n' +
            '}',
        inputSchema: {
            type: 'object',
            properties: {
                code: {
                    type: 'string',
                    description: 'フィールドコード（指定しない場合はlabelから自動生成）'
                },
                label: {
                    type: 'string',
                    description: 'フィールドラベル'
                },
                relatedAppId: {
                    type: 'number',
                    description: '参照先アプリのID'
                },
                relatedAppCode: {
                    type: 'string',
                    description: '参照先アプリのコード（IDより優先）'
                },
                conditionField: {
                    type: 'string',
                    description: '自アプリの条件フィールド'
                },
                relatedConditionField: {
                    type: 'string',
                    description: '参照先アプリの条件フィールド'
                },
                filterCond: {
                    type: 'string',
                    description: '参照レコードの絞り込み条件'
                },
                displayFields: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    description: '表示するフィールドの配列'
                },
                sort: {
                    type: 'string',
                    description: '参照レコードのソート条件'
                },
                size: {
                    type: 'number',
                    enum: [1, 3, 5, 10, 20, 30, 40, 50],
                    description: '一度に表示する最大レコード数'
                },
                noLabel: {
                    type: 'boolean',
                    description: 'ラベルを非表示にするかどうか'
                }
            },
            required: ['label', 'conditionField', 'relatedConditionField']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'field',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'create_lookup_field',
        description: 'ルックアップフィールドの設定を生成します。\n' +
            'フィールドコードに使用できる文字: ひらがな、カタカナ、漢字、英数字、記号(_＿･・＄￥)\n' +
            '例: {\n' +
            '  "code": "lookup_field",\n' +
            '  "label": "ルックアップ",\n' +
            '  "relatedAppId": 123,\n' +
            '  "relatedKeyField": "customer_id",\n' +
            '  "fieldMappings": [\n' +
            '    { "field": "name", "relatedField": "customer_name" },\n' +
            '    { "field": "email", "relatedField": "customer_email" }\n' +
            '  ]\n' +
            '}',
        inputSchema: {
            type: 'object',
            properties: {
                code: {
                    type: 'string',
                    description: 'フィールドコード（指定しない場合はlabelから自動生成）'
                },
                label: {
                    type: 'string',
                    description: 'フィールドラベル'
                },
                relatedAppId: {
                    type: 'number',
                    description: '参照先アプリのID'
                },
                relatedAppCode: {
                    type: 'string',
                    description: '参照先アプリのコード（IDより優先）'
                },
                relatedKeyField: {
                    type: 'string',
                    description: '参照先アプリのキーフィールド'
                },
                fieldMappings: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            field: {
                                type: 'string',
                                description: '自アプリのフィールド'
                            },
                            relatedField: {
                                type: 'string',
                                description: '参照先アプリのフィールド'
                            }
                        },
                        required: ['field', 'relatedField']
                    },
                    description: 'フィールドマッピングの配列'
                },
                lookupPickerFields: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    description: 'ルックアップピッカーに表示するフィールドの配列'
                },
                filterCond: {
                    type: 'string',
                    description: '参照レコードの絞り込み条件'
                },
                sort: {
                    type: 'string',
                    description: '参照レコードのソート条件'
                },
                required: {
                    type: 'boolean',
                    description: '必須フィールドかどうか'
                }
            },
            required: ['label', 'relatedKeyField', 'fieldMappings']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'field',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    }
];
