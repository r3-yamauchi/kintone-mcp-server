// src/server/tools/DocumentationTools.js
import { 
    getFieldTypeDocumentation, 
    getAvailableFieldTypes,
    getDocumentationToolDescription,
    getFieldCreationToolDescription
} from './documentation/index.js';

/**
 * ドキュメント関連のツールを処理する関数
 * @param {string} name ツール名
 * @param {Object} args 引数
 * @returns {string|Object} ツールの実行結果
 */
export async function handleDocumentationTools(name, args) {
    switch (name) {
        case 'get_field_type_documentation': {
            // 引数のチェック
            if (!args.field_type) {
                throw new Error('field_type は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Getting documentation for field type: ${args.field_type}`);
            
            const fieldType = args.field_type.toUpperCase();
            
            // ドキュメントを取得
            return getFieldTypeDocumentation(fieldType);
        }
        
        case 'get_available_field_types': {
            // 利用可能なフィールドタイプの一覧を取得
            return getAvailableFieldTypes();
        }
        
        case 'get_documentation_tool_description': {
            // ドキュメントツールの説明を取得
            return getDocumentationToolDescription();
        }
        
        case 'get_field_creation_tool_description': {
            // フィールド作成ツールの説明を取得
            return getFieldCreationToolDescription();
        }
        
        default:
            throw new Error(`Unknown documentation tool: ${name}`);
    }
}
