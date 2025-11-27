// src/server/tools/definitions/RecordToolDefinitions.js

/**
 * レコード関連のツール定義
 */
export const recordToolDefinitions = [
    {
        name: 'get_record',
        description: 'kintoneアプリの1レコードを取得します。事前に対象アプリのフィールド構造を把握したい場合は、\\`get_form_fields\\` ツールで利用予定のフィールドコードを確認してから本ツールを呼び出してください。',
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
        description: 'kintoneアプリのレコードを検索します。事前に対象アプリのフィールド一覧を把握するため、\\`get_form_fields\\` ツールで利用予定のフィールドコードやフィールドタイプを確認してからクエリーを作成することを推奨します。\n\n' +
            '【よく使用されるクエリ例】\n' +
            '• 文字列検索: Customer = "サイボウズ株式会社" (完全一致)\n' +
            '• 部分一致: Customer like "株式会社" (部分一致)\n' +
            '• ドロップダウン: Status in ("対応中","未対応") (複数値の選択)\n' +
            '• 日付範囲: LimitDay >= "2022-09-29" and LimitDay <= "2022-10-29"\n' +
            '• 日付関数: LimitDay < TODAY() (今日より前)\n' +
            '• 複数条件: Status in ("対応中") and LimitDay < TODAY()\n' +
            '• ソート: Status = "対応中" order by 更新日時 desc\n' +
            '• ページング: Status = "対応中" order by $id desc limit 20 offset 20\n' +
            '• 空欄チェック: Detail is empty (文字列複数行の空欄)\n' +
            '• 非空欄チェック: Detail is not empty (文字列複数行の非空欄)\n' +
            '• 添付ファイル有無: Attachments is empty / is not empty\n' +
            '• ユーザー検索: 作成者 in (LOGINUSER()) (自分が作成したレコード)\n\n' +
            '注意: is empty / is not empty は「文字列（複数行）」と「添付ファイル（FILE）」に対してのみ使用でき、「文字列（1行）」などの他のフィールドタイプに対しては使用できません。\n' +
            'クエリ式の詳細仕様や構文とすべての演算子や関数、フィールド別の使用可否といったkintoneの仕様については get_query_language_documentation ツールを実行して確認してください。',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                query: {
                    type: 'string',
                    description: 'kintoneクエリ構文での検索条件。\n' +
                        '基本形式: "フィールドコード 演算子 値"\n' +
                        '例:\n' +
                        '• Status = "完了" (完全一致)\n' +
                        '• Customer like "株式会社" (部分一致)\n' +
                        '• Status in ("対応中","未対応") (複数選択)\n' +
                        '• LimitDay >= "2022-09-29" and LimitDay <= "2022-10-29" (範囲指定)\n' +
                        '• Detail is empty (文字列複数行の空欄チェック)\n' +
                        '• Detail is not empty (文字列複数行の非空欄チェック)\n' +
                        '• Attachments is empty / is not empty (添付ファイルの有無)\n' +
                        '• Status not in ("完了") order by 更新日時 desc limit 10 (ソート付き)\n' +
                        '注意: is empty / is not empty は「文字列（1行）」では使用できません（文字列（複数行）と添付ファイル（FILE）は可）。\n' +
                        '不明点は get_query_language_documentation ツールで仕様を確認してください。\n' +
                        'オプション順序: order by → limit → offset\n' +
                        '詳細はget_query_language_documentationを参照'
                },
                fields: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    description: '取得するフィールド名の配列（省略時は全フィールド取得）'
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
        description: 'kintoneアプリに新しいレコードを作成します。事前に対象アプリのフィールド構造を把握するため、\\`get_form_fields\\` やフォームの配置情報を確認できる\\`get_form_layout\\` を実行し、必要なフィールドコードと配置を整理してから本ツールを使用することを推奨します。各フィールドは { "value": ... } の形式で指定します。\n' +
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
        description: 'kintoneアプリの既存レコードを更新します。更新前に\\`get_form_fields\\` や\\`get_form_layout\\` でフィールド構造とレイアウトを確認し、利用するフィールドコードが最新であることをチェックしてから操作してください。各フィールドは { "value": ... } の形式で指定します。\n' +
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
    },
    {
        name: 'update_record_status',
        description: 'kintoneレコードのステータスを更新します（プロセス管理）',
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
                action: {
                    type: 'string',
                    description: 'アクション名（プロセス管理で定義されたアクション）'
                },
                assignee: {
                    type: 'string',
                    description: '次の作業者のログイン名（必要な場合）'
                }
            },
            required: ['app_id', 'record_id', 'action']
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
        name: 'update_record_assignees',
        description: 'kintoneレコードの作業者を更新します（プロセス管理）',
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
                assignees: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    description: '作業者のログイン名の配列',
                    maxItems: 100
                }
            },
            required: ['app_id', 'record_id', 'assignees']
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
        name: 'get_record_comments',
        description: 'kintoneレコードのコメントを取得します。limit未指定の場合は内部でページングして全件を取得します。大量データになる場合は limit（例: 10）を指定することを推奨します。',
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
                order: {
                    type: 'string',
                    enum: ['asc', 'desc'],
                    description: 'コメントの取得順（asc: 昇順、desc: 降順）',
                    default: 'desc'
                },
                offset: {
                    type: 'number',
                    description: '取得開始位置（省略時は0）',
                    minimum: 0
                },
                limit: {
                    type: 'number',
                    description: '取得件数。未指定または空文字の場合は全件取得。',
                    minimum: 1
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
        name: 'create_records',
        description: 'kintoneアプリに複数のレコードを一括作成します（最大100件）',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                records: {
                    type: 'array',
                    items: {
                        type: 'object',
                        description: 'レコードのフィールド値（各フィールドは { "value": ... } の形式で指定）'
                    },
                    description: '作成するレコードの配列',
                    maxItems: 100
                }
            },
            required: ['app_id', 'records']
        },
        annotations: {
            readOnly: false,
            safe: true,
            category: 'record',
            requiresConfirmation: true,
            longRunning: true,
            impact: 'medium'
        }
    },
    {
        name: 'upsert_record',
        description: '重複禁止フィールド（updateKey）またはレコードIDをキーに、存在すれば更新・無ければ作成する upsert 機能を使用します。実行前に \`get_form_fields\` や \`get_form_layout\` でフィールド構造を確認し、利用するフィールドコードが最新であることをチェックしてから実行してください。各フィールドは { "value": ... } の形式で指定します。',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
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
                    description: '重複禁止フィールドを使用してレコードを特定'
                },
                fields: {
                    type: 'object',
                    description: 'レコードのフィールド値（各フィールドは { "value": ... } の形式で指定）'
                }
            },
            required: ['app_id', 'updateKey', 'fields']
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
        name: 'upsert_records',
        description: '複数レコードを一括Upsertします。各要素に重複禁止フィールド（updateKey）と更新内容を指定すると、存在するレコードは更新、存在しないレコードは新規作成されます。最大100件。',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                records: {
                    type: 'array',
                    description: 'Upsert対象レコードの配列（最大100件）',
                    maxItems: 100,
                    items: {
                        type: 'object',
                        properties: {
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
                                description: '重複禁止フィールドを使用してレコードを特定'
                            },
                            fields: {
                                type: 'object',
                                description: 'レコードのフィールド値（各フィールドは { "value": ... } の形式で指定）'
                            }
                        },
                        required: ['updateKey', 'fields']
                    }
                }
            },
            required: ['app_id', 'records']
        },
        annotations: {
            readOnly: false,
            safe: true,
            category: 'record',
            requiresConfirmation: true,
            longRunning: true,
            impact: 'medium'
        }
    }
];
