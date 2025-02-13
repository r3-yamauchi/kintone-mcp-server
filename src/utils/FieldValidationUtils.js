// src/utils/FieldValidationUtils.js
import { ALL_FIELD_TYPES, SYSTEM_FIELD_TYPES } from '../constants.js';
import { ValidationUtils } from './ValidationUtils.js';

/**
 * フィールド関連のバリデーションユーティリティ
 */
export class FieldValidationUtils {
    /**
     * フィールドタイプの検証
     * @param {string} fieldType - フィールドタイプ
     * @throws {Error} 無効なフィールドタイプの場合
     */
    static validateFieldType(fieldType) {
        if (!ALL_FIELD_TYPES.includes(fieldType)) {
            throw new Error(`無効なフィールドタイプです: ${fieldType}。有効なタイプ: ${ALL_FIELD_TYPES.join(', ')}`);
        }
    }
    
    /**
     * システムフィールドかどうかをチェック
     * @param {string} fieldCode - フィールドコード
     * @returns {boolean} システムフィールドの場合true
     */
    static isSystemField(fieldCode) {
        return SYSTEM_FIELD_TYPES.includes(fieldCode);
    }
    
    /**
     * フィールドコードの検証
     * @param {string} fieldCode - フィールドコード
     * @throws {Error} 無効なフィールドコードの場合
     */
    static validateFieldCode(fieldCode) {
        ValidationUtils.validateString(fieldCode, 'フィールドコード', {
            minLength: 1,
            maxLength: 128
        });
        
        if (this.isSystemField(fieldCode)) {
            throw new Error(`${fieldCode} はシステムフィールドのため使用できません。`);
        }
        
        // フィールドコードのパターンチェック
        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(fieldCode)) {
            throw new Error('フィールドコードは英字で始まり、英数字とアンダースコアのみ使用できます。');
        }
    }
    
    /**
     * 選択肢フィールドのオプション検証
     * @param {Object} options - オプション設定
     * @param {string} fieldType - フィールドタイプ
     * @throws {Error} 検証エラーの場合
     */
    static validateChoiceOptions(options, fieldType) {
        if (!options || typeof options !== 'object') {
            throw new Error('選択肢フィールドには options が必須です。');
        }
        
        const optionKeys = Object.keys(options);
        if (optionKeys.length === 0) {
            throw new Error('選択肢は少なくとも1つ必要です。');
        }
        
        // 各オプションの検証
        optionKeys.forEach((key, index) => {
            const option = options[key];
            
            if (!option || typeof option !== 'object') {
                throw new Error(`オプション "${key}" の設定が無効です。`);
            }
            
            // labelの検証
            if (option.label !== key) {
                throw new Error(
                    `選択肢 "${key}" の label は "${key}" と完全に一致する必要があります。` +
                    `現在の値: "${option.label}"`
                );
            }
            
            // indexの検証
            if (option.index === undefined || option.index === null) {
                throw new Error(`選択肢 "${key}" に index が設定されていません。`);
            }
            
            if (typeof option.index !== 'string') {
                throw new Error(
                    `選択肢 "${key}" の index は文字列型である必要があります。` +
                    `現在の型: ${typeof option.index}`
                );
            }
            
            const indexNum = parseInt(option.index, 10);
            if (isNaN(indexNum) || indexNum < 0) {
                throw new Error(
                    `選択肢 "${key}" の index は0以上の数値文字列である必要があります。` +
                    `現在の値: "${option.index}"`
                );
            }
        });
    }
    
    /**
     * 計算フィールドの式を検証
     * @param {string} expression - 計算式
     * @throws {Error} 検証エラーの場合
     */
    static validateCalcExpression(expression) {
        if (!expression || typeof expression !== 'string') {
            throw new Error('計算式は必須です。');
        }
        
        // サポートされていない関数のチェック
        const unsupportedFunctions = [
            'CONCAT', 'LEFT', 'RIGHT', 'MID', 'LEN', 'TRIM',
            'UPPER', 'LOWER', 'REPLACE', 'FIND', 'SEARCH'
        ];
        
        const upperExpression = expression.toUpperCase();
        for (const func of unsupportedFunctions) {
            if (upperExpression.includes(func + '(')) {
                throw new Error(
                    `関数 ${func} はkintoneではサポートされていません。` +
                    `サポートされている関数: SUM, ROUND, ROUNDUP, ROUNDDOWN, IF, AND, OR, NOT, DATE_FORMAT`
                );
            }
        }
        
        // サブテーブル内フィールドの参照チェック
        if (expression.includes('.')) {
            throw new Error(
                'サブテーブル内のフィールドを参照する場合は、テーブル名を指定せず、' +
                'フィールドコードのみを使用してください。\n' +
                `誤った例: SUM(経費明細.金額)\n` +
                `正しい例: SUM(金額)`
            );
        }
    }
    
    /**
     * ルックアップフィールドの設定を検証
     * @param {Object} lookupSettings - ルックアップ設定
     * @throws {Error} 検証エラーの場合
     */
    static validateLookupSettings(lookupSettings) {
        ValidationUtils.validateRequired(lookupSettings, [
            'relatedApp', 'relatedKeyField', 'fieldMappings'
        ]);
        
        // 関連アプリの検証
        if (!lookupSettings.relatedApp.app && !lookupSettings.relatedApp.code) {
            throw new Error('ルックアップの参照先アプリ（app または code）が必要です。');
        }
        
        // フィールドマッピングの検証
        ValidationUtils.validateArray(lookupSettings.fieldMappings, 'fieldMappings', {
            minLength: 1
        });
        
        lookupSettings.fieldMappings.forEach((mapping, index) => {
            if (!mapping.field || !mapping.relatedField) {
                throw new Error(
                    `fieldMappings[${index}] に field と relatedField が必要です。`
                );
            }
        });
    }
    
    /**
     * フィールド値の形式を検証
     * @param {*} value - フィールド値
     * @param {string} fieldType - フィールドタイプ
     * @throws {Error} 検証エラーの場合
     */
    static validateFieldValue(value, fieldType) {
        switch (fieldType) {
            case 'SINGLE_LINE_TEXT':
            case 'MULTI_LINE_TEXT':
            case 'RICH_TEXT':
            case 'LINK':
                if (typeof value !== 'object' || !('value' in value)) {
                    throw new Error(`${fieldType} フィールドは { value: "..." } 形式で指定してください。`);
                }
                break;
                
            case 'NUMBER':
                if (typeof value !== 'object' || !('value' in value)) {
                    throw new Error('数値フィールドは { value: "123" } 形式（文字列）で指定してください。');
                }
                if (value.value !== null && typeof value.value !== 'string') {
                    throw new Error('数値フィールドの値は文字列形式で指定してください。');
                }
                break;
                
            case 'CHECK_BOX':
            case 'MULTI_SELECT':
                if (typeof value !== 'object' || !Array.isArray(value.value)) {
                    throw new Error(`${fieldType} フィールドは { value: ["選択肢1", "選択肢2"] } 形式で指定してください。`);
                }
                break;
                
            case 'RADIO_BUTTON':
            case 'DROP_DOWN':
                if (typeof value !== 'object' || !('value' in value)) {
                    throw new Error(`${fieldType} フィールドは { value: "選択肢" } 形式で指定してください。`);
                }
                break;
                
            case 'USER_SELECT':
            case 'ORGANIZATION_SELECT':
            case 'GROUP_SELECT':
                if (typeof value !== 'object' || !Array.isArray(value.value)) {
                    throw new Error(`${fieldType} フィールドは { value: [{ code: "..." }] } 形式で指定してください。`);
                }
                value.value.forEach((item, index) => {
                    if (!item.code) {
                        throw new Error(`${fieldType} フィールドの value[${index}] に code が必要です。`);
                    }
                });
                break;
                
            case 'DATE':
                if (typeof value !== 'object' || !('value' in value)) {
                    throw new Error('日付フィールドは { value: "YYYY-MM-DD" } 形式で指定してください。');
                }
                break;
                
            case 'TIME':
                if (typeof value !== 'object' || !('value' in value)) {
                    throw new Error('時刻フィールドは { value: "HH:MM" } 形式で指定してください。');
                }
                break;
                
            case 'DATETIME':
                if (typeof value !== 'object' || !('value' in value)) {
                    throw new Error('日時フィールドは { value: "YYYY-MM-DDTHH:MM:SSZ" } 形式で指定してください。');
                }
                break;
                
            case 'SUBTABLE':
                if (typeof value !== 'object' || !Array.isArray(value.value)) {
                    throw new Error('テーブルフィールドは { value: [{ value: { ... } }] } 形式で指定してください。');
                }
                break;
        }
    }
}