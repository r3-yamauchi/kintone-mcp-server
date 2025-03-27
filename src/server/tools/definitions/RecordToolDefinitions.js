// src/server/tools/definitions/RecordToolDefinitions.js

/**
 * レコード関連のツール定義
 */
export const recordToolDefinitions = [
    {
        name: 'get_record',
        description: 'kintoneアプリの1レコードを取得します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                record_id: {
                    type: 'number',
                    description: 'レコードID'
                }
            },
            required: ['app_id', 'record_id']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'record',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'search_records',
        description: 'kintoneアプリのレコードを検索します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                query: {
                    type: 'string',
                    description: '検索クエリ'
                },
                fields: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    description: '取得するフィールド名の配列'
                }
            },
            required: ['app_id']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'record',
            requiresConfirmation: false,
            longRunning: true,
            impact: 'low'
        }
    },
    {
        name: 'create_record',
        description: 'kintoneアプリに新しいレコードを作成します。各フィールドは { "value": ... } の形式で指定します。\n' +
            '例: {\n' +
            '  "app_id": 1,\n' +
            '  "fields": {\n' +
            '    "文字列1行": { "value": "テスト" },\n' +
            '    "文字列複数行": { "value": "テスト\\nテスト2" },\n' +
            '    "数値": { "value": "20" },\n' +
            '    "日時": { "value": "2014-02-16T08:57:00Z" },\n' +
            '    "チェックボックス": { "value": ["sample1", "sample2"] },\n' +
            '    "ユーザー選択": { "value": [{ "code": "sato" }] },\n' +
            '    "ドロップダウン": { "value": "sample1" },\n' +
            '    "リンク_ウェブ": { "value": "https://www.cybozu.com" },\n' +
            '    "テーブル": { "value": [{ "value": { "テーブル文字列": { "value": "テスト" } } }] }\n' +
            '  }\n' +
            '}',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                fields: {
                    type: 'object',
                    description: 'レコードのフィールド値（各フィールドは { "value": ... } の形式で指定）'
                }
            },
            required: ['app_id', 'fields']
        },
        annotations: {
            readOnly: false,
            safe: true,
            category: 'record',
            requiresConfirmation: true,
            longRunning: false,
            impact: 'medium'
        }
    },
    {
        name: 'update_record',
        description: 'kintoneアプリの既存レコードを更新します。各フィールドは { "value": ... } の形式で指定します。\n' +
            '例1（レコードIDを指定して更新）: {\n' +
            '  "app_id": 1,\n' +
            '  "record_id": 1001,\n' +
            '  "fields": {\n' +
            '    "文字列1行_0": { "value": "character string is changed" },\n' +
            '    "テーブル_0": { "value": [{\n' +
            '      "id": 1,\n' +
            '      "value": {\n' +
            '        "文字列1行_1": { "value": "character string is changed" }\n' +
            '      }\n' +
            '    }]}\n' +
            '  }\n' +
            '}\n\n' +
            '例2（重複禁止フィールドを指定して更新）: {\n' +
            '  "app_id": 1,\n' +
            '  "updateKey": {\n' +
            '    "field": "文字列1行_0",\n' +
            '    "value": "フィールドの値"\n' +
            '  },\n' +
            '  "fields": {\n' +
            '    "文字列1行_1": { "value": "character string is changed" },\n' +
            '    "テーブル_0": { "value": [{\n' +
            '      "id": 1,\n' +
            '      "value": {\n' +
            '        "文字列1行_2": { "value": "character string is changed" }\n' +
            '      }\n' +
            '    }]}\n' +
            '  }\n' +
            '}\n' +
            'レコードIDまたはupdateKeyのいずれかを指定して更新できます。updateKeyを使用する場合は、重複禁止に設定されたフィールドを指定してください。',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                record_id: {
                    type: 'number',
                    description: 'レコードID（updateKeyを使用する場合は不要）'
                },
                updateKey: {
                    type: 'object',
                    properties: {
                        field: {
                            type: 'string',
                            description: '重複禁止に設定されたフィールドコード'
                        },
                        value: {
                            type: 'string',
                            description: 'フィールドの値'
                        }
                    },
                    required: ['field', 'value'],
                    description: '重複禁止フィールドを使用してレコードを特定（record_idを使用する場合は不要）'
                },
                fields: {
                    type: 'object',
                    description: '更新するフィールド値（各フィールドは { "value": ... } の形式で指定）'
                }
            },
            required: ['app_id', 'fields']
        },
        annotations: {
            readOnly: false,
            safe: false,
            category: 'record',
            requiresConfirmation: true,
            longRunning: false,
            impact: 'medium'
        }
    },
    {
        name: 'add_record_comment',
        description: 'kintoneレコードにコメントを追加します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                record_id: {
                    type: 'number',
                    description: 'レコードID'
                },
                text: {
                    type: 'string',
                    description: 'コメント本文'
                },
                mentions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            code: {
                                type: 'string',
                                description: 'メンション対象のユーザー、グループ、組織のコード'
                            },
                            type: {
                                type: 'string',
                                enum: ['USER', 'GROUP', 'ORGANIZATION'],
                                description: 'メンション対象の種類'
                            }
                        },
                        required: ['code', 'type']
                    },
                    description: 'メンション情報の配列'
                }
            },
            required: ['app_id', 'record_id', 'text']
        },
        annotations: {
            readOnly: false,
            safe: true,
            category: 'record',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    }
];
