// src/server/tools/definitions/FileToolDefinitions.js

/**
 * ファイル関連のツール定義
 */
export const fileToolDefinitions = [
    {
        name: 'download_file',
        description: 'kintoneアプリからファイルをダウンロードします。注意: 現在の実装では1MB以上のファイルは正常にダウンロードできない場合があります。',
        inputSchema: {
            type: 'object',
            properties: {
                file_key: {
                    type: 'string',
                    description: 'ダウンロードするファイルのキー'
                }
            },
            required: ['file_key']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'file',
            requiresConfirmation: false,
            longRunning: true,
            impact: 'low'
        }
    },
    {
        name: 'upload_file',
        description: 'kintoneアプリにファイルをアップロードします',
        inputSchema: {
            type: 'object',
            properties: {
                file_name: {
                    type: 'string',
                    description: 'アップロードするファイルの名前'
                },
                file_data: {
                    type: 'string',
                    description: 'Base64エンコードされたファイルデータ'
                }
            },
            required: ['file_name', 'file_data']
        },
        annotations: {
            readOnly: false,
            safe: true,
            category: 'file',
            requiresConfirmation: false,
            longRunning: true,
            impact: 'medium'
        }
    }
];
