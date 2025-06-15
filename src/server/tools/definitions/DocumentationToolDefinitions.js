// src/server/tools/definitions/DocumentationToolDefinitions.js

/**
 * ドキュメント関連のツール定義
 */
export const documentationToolDefinitions = [
    {
        name: 'get_field_type_documentation',
        description: 'フィールドタイプに関するドキュメントを取得します',
        inputSchema: {
            type: 'object',
            properties: {
                field_type: {
                    type: 'string',
                    description: 'ドキュメントを取得するフィールドタイプ'
                }
            },
            required: ['field_type']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'documentation',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'get_available_field_types',
        description: '利用可能なフィールドタイプの一覧を取得します',
        inputSchema: {
            type: 'object',
            properties: {}
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'documentation',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'get_documentation_tool_description',
        description: 'ドキュメントツールの説明を取得します',
        inputSchema: {
            type: 'object',
            properties: {}
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'documentation',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'get_field_creation_tool_description',
        description: 'フィールド作成ツールの説明を取得します',
        inputSchema: {
            type: 'object',
            properties: {}
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'documentation',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'get_query_language_documentation',
        description: 'kintoneクエリ言語（検索クエリ）に関する詳細なドキュメントを取得します。演算子、条件式、並び替え、ページングなどの使い方を説明します。',
        inputSchema: {
            type: 'object',
            properties: {}
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'documentation',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    }
];
