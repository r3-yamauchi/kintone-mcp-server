// src/server/tools/definitions/SystemToolDefinitions.js

/**
 * システム関連のツール定義
 */
export const systemToolDefinitions = [
    {
        name: 'get_kintone_domain',
        description: 'kintoneの接続先ドメインを取得します',
        inputSchema: {
            type: 'object',
            properties: {}
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'system',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'get_kintone_username',
        description: 'kintoneへの接続に使用されるユーザー名を取得します',
        inputSchema: {
            type: 'object',
            properties: {}
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'system',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    }
];
