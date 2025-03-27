// src/server/tools/definitions/LayoutToolDefinitions.js

/**
 * レイアウト関連のツール定義
 */
export const layoutToolDefinitions = [
    {
        name: 'create_form_layout',
        description: 'フィールド情報からフォームレイアウトを自動生成します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                fields: {
                    type: 'array',
                    items: {
                        type: 'object'
                    },
                    description: 'レイアウトに配置するフィールド情報の配列'
                },
                options: {
                    type: 'object',
                    properties: {
                        groupBySection: {
                            type: 'boolean',
                            description: 'セクションごとにグループ化するかどうか'
                        },
                        fieldsPerRow: {
                            type: 'number',
                            description: '1行あたりのフィールド数'
                        }
                    },
                    description: 'レイアウト生成オプション'
                }
            },
            required: ['app_id', 'fields']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'layout',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'add_layout_element',
        description: '既存のフォームレイアウトに要素を追加します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                element: {
                    type: 'object',
                    description: '追加する要素'
                },
                position: {
                    type: 'object',
                    properties: {
                        index: {
                            type: 'number',
                            description: '挿入位置のインデックス'
                        },
                        type: {
                            type: 'string',
                            enum: ['GROUP'],
                            description: '挿入先の要素タイプ'
                        },
                        groupCode: {
                            type: 'string',
                            description: '挿入先のグループコード'
                        },
                        after: {
                            type: 'string',
                            description: 'この要素の後に挿入するフィールドコード'
                        },
                        before: {
                            type: 'string',
                            description: 'この要素の前に挿入するフィールドコード'
                        }
                    },
                    description: '要素の挿入位置'
                }
            },
            required: ['app_id', 'element']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'layout',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'create_group_layout',
        description: 'グループ要素を作成します',
        inputSchema: {
            type: 'object',
            properties: {
                code: {
                    type: 'string',
                    description: 'グループコード'
                },
                label: {
                    type: 'string',
                    description: 'グループラベル'
                },
                fields: {
                    type: 'array',
                    items: {
                        type: 'object'
                    },
                    description: 'グループ内に配置するフィールド情報の配列'
                },
                openGroup: {
                    type: 'boolean',
                    description: 'グループを開いた状態で表示するかどうか'
                },
                options: {
                    type: 'object',
                    properties: {
                        fieldsPerRow: {
                            type: 'number',
                            description: '1行あたりのフィールド数'
                        }
                    },
                    description: 'グループレイアウト生成オプション'
                }
            },
            required: ['code', 'label', 'fields']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'layout',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'create_table_layout',
        description: 'テーブルレイアウトを作成します',
        inputSchema: {
            type: 'object',
            properties: {
                rows: {
                    type: 'array',
                    items: {
                        type: 'array',
                        items: {
                            type: 'object'
                        }
                    },
                    description: 'テーブルの各行に配置するフィールド情報の二次元配列'
                },
                options: {
                    type: 'object',
                    description: 'テーブルレイアウト生成オプション'
                }
            },
            required: ['rows']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'layout',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    }
];
