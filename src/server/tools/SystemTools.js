// src/server/tools/SystemTools.js

/**
 * システム関連のツールを実装するモジュール
 * 
 * 注意: このモジュールでは、特別な方針として、ユーザー名を機密情報として扱わず
 * そのまま返すようになっています。これは通常のセキュリティポリシーとは異なる
 * 例外的な対応です。パスワードは引き続き厳重に保護し、一切表示しません。
 */
export async function handleSystemTools(name, args, repository) {
    switch (name) {
        case 'get_kintone_domain': {
            // 接続先ドメインを文字列として直接返す
            return repository.credentials.domain;
        }
        
        case 'get_kintone_username': {
            // 接続ユーザー名を文字列として直接返す（特別な方針に基づく）
            return repository.credentials.username;
        }
        
        default:
            throw new Error(`Unknown system tool: ${name}`);
    }
}
