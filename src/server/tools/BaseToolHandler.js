// src/server/tools/BaseToolHandler.js
import { ValidationUtils } from '../../utils/ValidationUtils.js';
import { LoggingUtils } from '../../utils/LoggingUtils.js';

/**
 * ツールハンドラーの基底クラス
 * 共通の処理パターンを提供
 */
export class BaseToolHandler {
    /**
     * コンストラクタ
     * @param {string} toolCategory - ツールカテゴリ名
     */
    constructor(toolCategory) {
        this.toolCategory = toolCategory;
        this.handlers = new Map();
        this.validations = new Map();
    }
    
    /**
     * ツールハンドラーを登録
     * @param {string} toolName - ツール名
     * @param {Function} handler - ハンドラー関数
     * @param {Object} validation - バリデーション設定
     */
    registerTool(toolName, handler, validation = null) {
        this.handlers.set(toolName, handler);
        if (validation) {
            this.validations.set(toolName, validation);
        }
    }
    
    /**
     * ツールリクエストを処理
     * @param {string} name - ツール名
     * @param {Object} args - 引数
     * @param {Object} repository - リポジトリ
     * @returns {Promise<Object>} 実行結果
     */
    async handle(name, args, repository) {
        // ツール実行ログ
        LoggingUtils.logToolExecution(this.toolCategory, name, args);
        
        // ハンドラーの存在確認
        const handler = this.handlers.get(name);
        if (!handler) {
            throw new Error(`Unknown ${this.toolCategory} tool: ${name}`);
        }
        
        // バリデーション実行
        const validation = this.validations.get(name);
        if (validation) {
            this.validateArgs(args, validation);
        }
        
        // ハンドラー実行
        return await handler.call(this, args, repository);
    }
    
    /**
     * 引数をバリデート
     * @param {Object} args - 引数
     * @param {Object} validation - バリデーション設定
     */
    validateArgs(args, validation) {
        // 必須フィールドの検証
        if (validation.required) {
            ValidationUtils.validateRequired(args, validation.required);
        }
        
        // 配列フィールドの検証
        if (validation.arrays) {
            for (const [fieldName, options] of Object.entries(validation.arrays)) {
                if (args[fieldName] !== undefined) {
                    ValidationUtils.validateArray(args[fieldName], fieldName, options);
                }
            }
        }
        
        // オブジェクトフィールドの検証
        if (validation.objects) {
            for (const fieldName of validation.objects) {
                if (args[fieldName] !== undefined) {
                    ValidationUtils.validateObject(args[fieldName], fieldName);
                }
            }
        }
        
        // 数値フィールドの検証
        if (validation.numbers) {
            for (const [fieldName, options] of Object.entries(validation.numbers)) {
                if (args[fieldName] !== undefined) {
                    ValidationUtils.validateNumber(args[fieldName], fieldName, options);
                }
            }
        }
        
        // 文字列フィールドの検証
        if (validation.strings) {
            for (const [fieldName, options] of Object.entries(validation.strings)) {
                if (args[fieldName] !== undefined) {
                    ValidationUtils.validateString(args[fieldName], fieldName, options);
                }
            }
        }
        
        // ブール値フィールドの検証
        if (validation.booleans) {
            for (const fieldName of validation.booleans) {
                if (args[fieldName] !== undefined) {
                    ValidationUtils.validateBoolean(args[fieldName], fieldName);
                }
            }
        }
        
        // カスタムバリデーション
        if (validation.custom) {
            validation.custom(args);
        }
    }
    
    /**
     * 条件付き必須フィールドのバリデーション
     * @param {Object} args - 引数
     * @param {Function} condition - 条件関数
     * @param {string[]} requiredFields - 条件が真の場合の必須フィールド
     * @param {string} errorMessage - エラーメッセージ
     */
    validateConditionalRequired(args, condition, requiredFields, errorMessage) {
        if (condition(args)) {
            for (const field of requiredFields) {
                if (!args[field]) {
                    throw new Error(errorMessage);
                }
            }
        }
    }
    
    /**
     * 相互排他フィールドのバリデーション
     * @param {Object} args - 引数
     * @param {Array<string[]>} exclusiveGroups - 相互排他グループの配列
     * @param {string} errorMessage - エラーメッセージ
     */
    validateMutuallyExclusive(args, exclusiveGroups, errorMessage) {
        for (const group of exclusiveGroups) {
            const presentFields = group.filter(field => args[field] !== undefined);
            if (presentFields.length > 1) {
                throw new Error(errorMessage || `${presentFields.join(' と ')} は同時に指定できません。`);
            }
        }
    }
    
    /**
     * いずれか必須フィールドのバリデーション
     * @param {Object} args - 引数
     * @param {string[]} fields - フィールド名の配列
     * @param {string} errorMessage - エラーメッセージ
     */
    validateRequireOneOf(args, fields, errorMessage) {
        const hasAny = fields.some(field => args[field] !== undefined);
        if (!hasAny) {
            throw new Error(errorMessage || `${fields.join(' または ')} のいずれかは必須です。`);
        }
    }
}