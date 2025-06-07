// src/server/tools/DocumentationTools.js
import { 
    getFieldTypeDocumentation, 
    getAvailableFieldTypes,
    getDocumentationToolDescription,
    getFieldCreationToolDescription,
    groupElementStructure
} from './documentation/index.js';
import { ValidationUtils } from '../../utils/ValidationUtils.js';
import { LoggingUtils } from '../../utils/LoggingUtils.js';

/**
 * ドキュメント関連のツールを処理する関数
 * @param {string} name ツール名
 * @param {Object} args 引数
 * @returns {string|Object} ツールの実行結果
 */
export async function handleDocumentationTools(name, args) {
    // 共通のツール実行ログ
    LoggingUtils.logToolExecution('documentation', name, args);
    
    switch (name) {
        case 'get_field_type_documentation': {
            ValidationUtils.validateRequired(args, ['field_type']);
            ValidationUtils.validateString(args.field_type, 'field_type');
            
            const fieldType = args.field_type.toUpperCase();
            LoggingUtils.logDetailedOperation('get_field_type_documentation', 'フィールドタイプドキュメント取得', { fieldType });
            
            // ドキュメントを取得
            return getFieldTypeDocumentation(fieldType);
        }
        
        case 'get_available_field_types': {
            LoggingUtils.logDetailedOperation('get_available_field_types', '利用可能フィールドタイプ一覧取得', {});
            // 利用可能なフィールドタイプの一覧を取得
            return getAvailableFieldTypes();
        }
        
        case 'get_documentation_tool_description': {
            LoggingUtils.logDetailedOperation('get_documentation_tool_description', 'ドキュメントツール説明取得', {});
            // ドキュメントツールの説明を取得
            return getDocumentationToolDescription();
        }
        
        case 'get_field_creation_tool_description': {
            LoggingUtils.logDetailedOperation('get_field_creation_tool_description', 'フィールド作成ツール説明取得', {});
            // フィールド作成ツールの説明を取得
            return getFieldCreationToolDescription();
        }
        
        case 'get_group_element_structure': {
            LoggingUtils.logDetailedOperation('get_group_element_structure', 'GROUP要素構造ドキュメント取得', {});
            // GROUP要素の構造に関するドキュメントを取得
            return groupElementStructure;
        }
        
        default:
            throw new Error(`Unknown documentation tool: ${name}`);
    }
}
