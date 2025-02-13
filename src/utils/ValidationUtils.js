// src/utils/ValidationUtils.js
/**
 * 共通バリデーションユーティリティ
 * ツール間で共通の引数検証ロジックを提供
 */
export class ValidationUtils {
    /**
     * 必須フィールドの検証
     * @param {Object} args - 検証対象の引数オブジェクト
     * @param {string[]} requiredFields - 必須フィールド名の配列
     * @throws {Error} 必須フィールドが存在しない場合
     */
    static validateRequired(args, requiredFields) {
        for (const field of requiredFields) {
            if (args[field] === undefined || args[field] === null) {
                throw new Error(`${field} は必須パラメータです。`);
            }
        }
    }
    
    /**
     * 配列フィールドの検証
     * @param {*} value - 検証対象の値
     * @param {string} fieldName - フィールド名
     * @param {Object} options - オプション設定
     * @param {number} options.minLength - 最小要素数
     * @param {number} options.maxLength - 最大要素数
     * @param {boolean} options.allowEmpty - 空配列を許可するか
     * @throws {Error} 検証エラーの場合
     */
    static validateArray(value, fieldName, options = {}) {
        if (!Array.isArray(value)) {
            throw new Error(`${fieldName} は配列形式で指定する必要があります。`);
        }
        
        if (!options.allowEmpty && value.length === 0) {
            throw new Error(`${fieldName} には少なくとも1つの要素を指定する必要があります。`);
        }
        
        if (options.minLength !== undefined && value.length < options.minLength) {
            throw new Error(`${fieldName} には少なくとも${options.minLength}個の要素を指定する必要があります。`);
        }
        
        if (options.maxLength !== undefined && value.length > options.maxLength) {
            throw new Error(`${fieldName} は最大${options.maxLength}件までです。`);
        }
    }
    
    /**
     * オブジェクトフィールドの検証
     * @param {*} value - 検証対象の値
     * @param {string} fieldName - フィールド名
     * @throws {Error} 検証エラーの場合
     */
    static validateObject(value, fieldName) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            throw new Error(`${fieldName} はオブジェクト形式で指定する必要があります。`);
        }
    }
    
    /**
     * 数値フィールドの検証
     * @param {*} value - 検証対象の値
     * @param {string} fieldName - フィールド名
     * @param {Object} options - オプション設定
     * @param {number} options.min - 最小値
     * @param {number} options.max - 最大値
     * @param {boolean} options.allowString - 文字列形式の数値を許可するか
     * @throws {Error} 検証エラーの場合
     */
    static validateNumber(value, fieldName, options = {}) {
        let numValue = value;
        
        if (options.allowString && typeof value === 'string') {
            numValue = Number(value);
        }
        
        if (typeof numValue !== 'number' || isNaN(numValue)) {
            throw new Error(`${fieldName} は数値で指定する必要があります。`);
        }
        
        if (options.min !== undefined && numValue < options.min) {
            throw new Error(`${fieldName} は${options.min}以上である必要があります。`);
        }
        
        if (options.max !== undefined && numValue > options.max) {
            throw new Error(`${fieldName} は${options.max}以下である必要があります。`);
        }
    }
    
    /**
     * 文字列フィールドの検証
     * @param {*} value - 検証対象の値
     * @param {string} fieldName - フィールド名
     * @param {Object} options - オプション設定
     * @param {number} options.minLength - 最小文字数
     * @param {number} options.maxLength - 最大文字数
     * @param {string[]} options.allowedValues - 許可される値のリスト
     * @throws {Error} 検証エラーの場合
     */
    static validateString(value, fieldName, options = {}) {
        if (typeof value !== 'string') {
            throw new Error(`${fieldName} は文字列で指定する必要があります。`);
        }
        
        if (options.minLength !== undefined && value.length < options.minLength) {
            throw new Error(`${fieldName} は${options.minLength}文字以上である必要があります。`);
        }
        
        if (options.maxLength !== undefined && value.length > options.maxLength) {
            throw new Error(`${fieldName} は${options.maxLength}文字以内である必要があります。`);
        }
        
        if (options.allowedValues && !options.allowedValues.includes(value)) {
            throw new Error(`${fieldName} は次のいずれかである必要があります: ${options.allowedValues.join(', ')}`);
        }
    }
    
    /**
     * ブール値フィールドの検証
     * @param {*} value - 検証対象の値
     * @param {string} fieldName - フィールド名
     * @throws {Error} 検証エラーの場合
     */
    static validateBoolean(value, fieldName) {
        if (typeof value !== 'boolean') {
            throw new Error(`${fieldName} はブール値（true/false）で指定する必要があります。`);
        }
    }
}