// src/server/tools/definitions/UserToolDefinitions.js

/**
 * ユーザー関連のツール定義
 */
export const userToolDefinitions = [
    {
        name: 'get_users',
        description: 'kintoneのユーザー情報を取得します',
        inputSchema: {
            type: 'object',
            properties: {
                codes: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    description: '取得するユーザーコードの配列（指定しない場合はすべてのユーザーを取得）'
                }
            }
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'user',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'get_groups',
        description: 'kintoneのグループ情報を取得します',
        inputSchema: {
            type: 'object',
            properties: {
                codes: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    description: '取得するグループコードの配列（指定しない場合はすべてのグループを取得）'
                }
            }
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'user',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'get_group_users',
        description: '指定したグループに所属するユーザーの一覧を取得します',
        inputSchema: {
            type: 'object',
            properties: {
                group_code: {
                    type: 'string',
                    description: 'グループコード'
                }
            },
            required: ['group_code']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'user',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'add_guests',
        description: 'ゲストユーザーを追加します',
        inputSchema: {
            type: 'object',
            properties: {
                guests: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: {
                                type: 'string'
                            },
                            code: {
                                type: 'string'
                            },
                            password: {
                                type: 'string'
                            },
                            timezone: {
                                type: 'string'
                            },
                            locale: {
                                type: 'string',
                                enum: ['auto', 'en', 'zh', 'ja']
                            }
                        },
                        required: ['name', 'code', 'password', 'timezone']
                    }
                }
            },
            required: ['guests']
        },
        annotations: {
            readOnly: false,
            safe: false,
            category: 'user',
            requiresConfirmation: true,
            longRunning: false,
            impact: 'high'
        }
    }
];
