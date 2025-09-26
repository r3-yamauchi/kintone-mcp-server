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
    
    /**
     * kintoneクエリー構文の検証
     * @param {string} query - 検証対象のクエリー文字列
     * @throws {Error} 検証エラーの場合
     */
    static validateKintoneQuery(query) {
        if (typeof query !== 'string') {
            throw new Error('クエリーは文字列で指定する必要があります。');
        }
        
        // クエリーを正規化（前後の空白を除去）
        const normalizedQuery = query.trim();
        
        // limit句のみの指定をチェック（条件やorder byがない場合）
        const limitOnlyPattern = /^\s*limit\s+\d+\s*$/i;
        if (limitOnlyPattern.test(normalizedQuery)) {
            throw new Error('kintoneクエリー構文では "limit" のみの指定はサポートされていません。検索条件またはorder by句と組み合わせて使用してください。（例: "$id > 0 limit 10" または "order by $id desc limit 10"）');
        }
        
        // その他の基本的なクエリー構文チェック
        const invalidPatterns = [
            {
                pattern: /\blimit\s+0\b/i,
                message: 'limit は1以上の値を指定してください。'
            },
            {
                pattern: /\boffset\s+([1-9]\d{4,})/i,
                message: 'offset の最大値は10,000です。'
            }
        ];

        for (const { pattern, message } of invalidPatterns) {
            if (pattern.test(query)) {
                throw new Error(message);
            }
        }

        const limitPattern = /\blimit\s+(\d+)/ig;
        for (const match of query.matchAll(limitPattern)) {
            const value = Number(match[1]);
            if (!Number.isNaN(value) && value > 500) {
                throw new Error('limit の最大値は500です。');
            }
        }
    }
}
