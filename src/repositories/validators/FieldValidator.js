// src/repositories/validators/FieldValidator.js
import { FIELD_TYPES_REQUIRING_OPTIONS, CALC_FIELD_TYPE, LINK_FIELD_TYPE, VALID_LINK_PROTOCOLS, LOOKUP_FIELD_TYPE, REFERENCE_TABLE_FIELD_TYPE, SINGLE_LINE_TEXT_FIELD_TYPE, MULTI_LINE_TEXT_FIELD_TYPE, NUMBER_FIELD_TYPE, VALID_UNIT_POSITIONS, DATE_FIELD_TYPE, TIME_FIELD_TYPE, DATETIME_FIELD_TYPE, RICH_TEXT_FIELD_TYPE, ATTACHMENT_FIELD_TYPE, USER_SELECT_FIELD_TYPE, GROUP_SELECT_FIELD_TYPE, ORGANIZATION_SELECT_FIELD_TYPE, SUBTABLE_FIELD_TYPE, STATUS_FIELD_TYPE, RELATED_RECORDS_FIELD_TYPE, RECORD_NUMBER_FIELD_TYPE, CREATOR_FIELD_TYPE, MODIFIER_FIELD_TYPE, CREATED_TIME_FIELD_TYPE, UPDATED_TIME_FIELD_TYPE, UNIT_POSITION_PATTERNS } from '../../constants.js';

import { autoCorrectUnitPosition } from '../../server/tools/FieldTools.js';

/**
 * フィールドを検証し、必要に応じて自動修正を適用する関数
 * @param {Object} field フィールドオブジェクト
 * @returns {Object} 検証・修正済みのフィールドオブジェクト
 */
export function validateField(field) {
    // 単位位置の自動修正を適用
    const correctedField = autoCorrectUnitPosition(field);
    
    // フィールドコードの検証
    if (correctedField.code) {
        validateFieldCode(correctedField.code);
    }
    
    // フィールドタイプ固有の検証
    if (correctedField.type) {
        // 選択肢フィールドの検証
        if (FIELD_TYPES_REQUIRING_OPTIONS.includes(correctedField.type)) {
            validateOptions(correctedField.type, correctedField.options);
        }
        
        // 計算フィールドの検証
        if (correctedField.type === CALC_FIELD_TYPE) {
            validateCalcField(correctedField.type, correctedField.expression, correctedField);
        }
        
        // リンクフィールドの検証
        if (correctedField.type === LINK_FIELD_TYPE) {
            validateLinkField(correctedField.type, correctedField.protocol);
        }
        
        // 関連テーブルフィールドの検証
        if (correctedField.type === REFERENCE_TABLE_FIELD_TYPE) {
            validateReferenceTableField(correctedField.type, correctedField.referenceTable);
        }
        
        // 数値フィールドの検証
        if (correctedField.type === NUMBER_FIELD_TYPE) {
            validateNumberField(correctedField.type, correctedField);
        }
        
        // 文字列フィールドの検証
        if ([SINGLE_LINE_TEXT_FIELD_TYPE, MULTI_LINE_TEXT_FIELD_TYPE].includes(correctedField.type)) {
            validateTextField(correctedField.type, correctedField);
        }
        
        // 日時フィールドの検証
        if ([DATE_FIELD_TYPE, TIME_FIELD_TYPE, DATETIME_FIELD_TYPE].includes(correctedField.type)) {
            validateDateTimeField(correctedField.type, correctedField);
        }
        
        // リッチエディタフィールドの検証
        if (correctedField.type === RICH_TEXT_FIELD_TYPE) {
            validateRichTextField(correctedField.type, correctedField);
        }
        
        // 添付ファイルフィールドの検証
        if (correctedField.type === ATTACHMENT_FIELD_TYPE) {
            validateAttachmentField(correctedField.type, correctedField);
        }
        
        // ユーザー選択フィールドの検証
        if ([USER_SELECT_FIELD_TYPE, GROUP_SELECT_FIELD_TYPE, ORGANIZATION_SELECT_FIELD_TYPE].includes(correctedField.type)) {
            validateUserSelectField(correctedField.type, correctedField);
        }
        
        // テーブルフィールドの検証
        if (correctedField.type === SUBTABLE_FIELD_TYPE) {
            validateSubtableField(correctedField.type, correctedField);
        }
        
        // ステータスフィールドの検証
        if (correctedField.type === STATUS_FIELD_TYPE) {
            validateStatusField(correctedField.type, correctedField);
        }
        
        // 関連レコードリストフィールドの検証
        if (correctedField.type === RELATED_RECORDS_FIELD_TYPE) {
            validateRelatedRecordsField(correctedField.type, correctedField);
        }
        
        // レコード番号フィールドの検証
        if (correctedField.type === RECORD_NUMBER_FIELD_TYPE) {
            validateRecordNumberField(correctedField.type, correctedField);
        }
        
        // システムフィールドの検証
        if ([CREATOR_FIELD_TYPE, MODIFIER_FIELD_TYPE, CREATED_TIME_FIELD_TYPE, UPDATED_TIME_FIELD_TYPE].includes(correctedField.type)) {
            validateSystemField(correctedField.type, correctedField);
        }
        
        // LOOKUPフィールドの検証
        if (correctedField.type === LOOKUP_FIELD_TYPE) {
            validateLookupField(correctedField.type, correctedField.lookup);
        }
    }
    
    return correctedField;
}

/**
 * 単位記号に基づいて適切な unitPosition を判定する関数
 * @param {string} unit 単位記号
 * @returns {string} 適切な unitPosition ("BEFORE" または "AFTER")
 */
function determineUnitPosition(unit) {
    // 判定理由を記録する変数
    let reason = "";
    
    // 単位が指定されていない場合
    if (!unit) {
        reason = "単位が指定されていないため";
        console.error(`単位位置判定: ${reason}、デフォルト値 "AFTER" を設定`);
        return "AFTER";
    }
    
    // 単位の長さが4文字以上の場合
    if (unit.length >= 4) {
        reason = `単位の長さが4文字以上 (${unit.length}文字) のため`;
        console.error(`単位位置判定: ${reason}、"AFTER" を設定`);
        return "AFTER";
    }
    
    // 複合単位の判定（スペースや特殊記号を含む）
    if (/[\s\/\-\+]/.test(unit) || (unit.length > 1 && /[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(unit))) {
        reason = `複合単位 "${unit}" と判断されるため`;
        console.error(`単位位置判定: ${reason}、"AFTER" を設定`);
        return "AFTER";
    }
    
    // 完全一致による判定
    const isBeforeExact = UNIT_POSITION_PATTERNS.BEFORE.includes(unit);
    const isAfterExact = UNIT_POSITION_PATTERNS.AFTER.includes(unit);
    
    // 両方のパターンに一致する場合
    if (isBeforeExact && isAfterExact) {
        reason = `単位 "${unit}" が BEFORE と AFTER の両方のパターンに一致するため`;
        console.error(`単位位置判定: ${reason}、"AFTER" を優先設定`);
        return "AFTER";
    }
    
    // BEFOREパターンに完全一致
    if (isBeforeExact) {
        reason = `単位 "${unit}" が BEFORE パターンに完全一致するため`;
        console.error(`単位位置判定: ${reason}、"BEFORE" を設定`);
        return "BEFORE";
    }
    
    // AFTERパターンに完全一致
    if (isAfterExact) {
        reason = `単位 "${unit}" が AFTER パターンに完全一致するため`;
        console.error(`単位位置判定: ${reason}、"AFTER" を設定`);
        return "AFTER";
    }
    
    // 部分一致による判定（完全一致しない場合のフォールバック）
    const beforeMatches = UNIT_POSITION_PATTERNS.BEFORE.filter(pattern => unit.includes(pattern));
    const afterMatches = UNIT_POSITION_PATTERNS.AFTER.filter(pattern => unit.includes(pattern));
    
    // 両方のパターンに部分一致する場合
    if (beforeMatches.length > 0 && afterMatches.length > 0) {
        reason = `単位 "${unit}" が BEFORE パターン [${beforeMatches.join(', ')}] と AFTER パターン [${afterMatches.join(', ')}] の両方に部分一致するため`;
        console.error(`単位位置判定: ${reason}、"AFTER" を優先設定`);
        return "AFTER";
    }
    
    // BEFOREパターンに部分一致
    if (beforeMatches.length > 0) {
        reason = `単位 "${unit}" が BEFORE パターン [${beforeMatches.join(', ')}] に部分一致するため`;
        console.error(`単位位置判定: ${reason}、"BEFORE" を設定`);
        return "BEFORE";
    }
    
    // AFTERパターンに部分一致
    if (afterMatches.length > 0) {
        reason = `単位 "${unit}" が AFTER パターン [${afterMatches.join(', ')}] に部分一致するため`;
        console.error(`単位位置判定: ${reason}、"AFTER" を設定`);
        return "AFTER";
    }
    
    // どのパターンにも一致しない場合
    reason = `単位 "${unit}" がどのパターンにも一致しないため`;
    console.error(`単位位置判定: ${reason}、デフォルト値 "AFTER" を設定`);
    return "AFTER";
}

/**
 * kintoneのシステムフィールドのコードリスト
 * これらのフィールドはkintoneによって自動的に作成され、同じコードのフィールドを追加することはできません
 */
const SYSTEM_FIELD_CODES = [
    'RECORD_NUMBER', // レコード番号
    'CREATOR',       // 作成者
    'MODIFIER',      // 更新者
    'CREATED_TIME',  // 作成日時
    'UPDATED_TIME'   // 更新日時
];

/**
 * システムフィールドの代替フィールドの例
 */
const SYSTEM_FIELD_ALTERNATIVES = {
    'RECORD_NUMBER': '「管理番号」などの名前でSINGLE_LINE_TEXTフィールドを追加できます',
    'CREATOR': '「申請者」などの名前でUSER_SELECTフィールドを追加できます',
    'MODIFIER': '「承認者」などの名前でUSER_SELECTフィールドを追加できます',
    'CREATED_TIME': '「申請日時」などの名前でDATETIMEフィールドを追加できます',
    'UPDATED_TIME': '「承認日時」などの名前でDATETIMEフィールドを追加できます'
};

// フィールドコードのバリデーション
export function validateFieldCode(fieldCode) {
    // システムフィールドのコードと一致するかチェック
    if (SYSTEM_FIELD_CODES.includes(fieldCode)) {
        const alternative = SYSTEM_FIELD_ALTERNATIVES[fieldCode] || 
            '別のフィールドコードを使用してください';
        
        throw new Error(
            `フィールドコード "${fieldCode}" はkintoneのシステムフィールドとして予約されています。\n\n` +
            'kintoneアプリを作成すると、以下のシステムフィールドが自動的に作成されます：\n' +
            '- RECORD_NUMBER（レコード番号）\n' +
            '- CREATOR（作成者）\n' +
            '- MODIFIER（更新者）\n' +
            '- CREATED_TIME（作成日時）\n' +
            '- UPDATED_TIME（更新日時）\n\n' +
            `【代替方法】\n${alternative}`
        );
    }
    
    const validPattern = /^[a-zA-Z0-9ぁ-んァ-ヶー一-龠々＿_･・＄￥]+$/;
    if (!validPattern.test(fieldCode)) {
        throw new Error(
            `フィールドコード "${fieldCode}" に使用できない文字が含まれています。\n\n` +
            '使用可能な文字は以下の通りです：\n' +
            '- ひらがな\n' +
            '- カタカナ（半角／全角）\n' +
            '- 漢字\n' +
            '- 英数字（半角／全角）\n' +
            '- 記号：\n' +
            '  - 半角の「_」（アンダースコア）\n' +
            '  - 全角の「＿」（アンダースコア）\n' +
            '  - 半角の「･」（中黒）\n' +
            '  - 全角の「・」（中黒）\n' +
            '  - 全角の通貨記号（＄や￥など）'
        );
    }
    return true;
}

// 選択肢フィールドのoptionsバリデーション
export function validateOptions(fieldType, options) {
    // 選択肢フィールドの場合のみチェック
    if (!FIELD_TYPES_REQUIRING_OPTIONS.includes(fieldType)) {
        return true;
    }

    // optionsの必須チェック
    if (!options) {
        throw new Error(
            `フィールドタイプ "${fieldType}" には options の指定が必須です。\n` +
            `以下の形式で指定してください：\n` +
            `options: {\n` +
            `  "選択肢キー1": { "label": "選択肢キー1", "index": "0" },\n` +
            `  "選択肢キー2": { "label": "選択肢キー2", "index": "1" }\n` +
            `}`
        );
    }

    // optionsの形式チェック
    if (typeof options !== 'object' || Array.isArray(options)) {
        throw new Error(
            'options はオブジェクト形式で指定する必要があります。\n' +
            `以下の形式で指定してください：\n` +
            `options: {\n` +
            `  "選択肢キー1": { "label": "選択肢キー1", "index": "0" },\n` +
            `  "選択肢キー2": { "label": "選択肢キー2", "index": "1" }\n` +
            `}`
        );
    }

    // 各選択肢のバリデーション
    Object.entries(options).forEach(([key, value]) => {
        // labelの存在チェック
        if (!value.label) {
            throw new Error(
                `選択肢 "${key}" の label が指定されていません。\n` +
                `kintone APIの仕様により、label には "${key}" という値を指定する必要があります。\n` +
                `例: "${key}": { "label": "${key}", "index": "0" }`
            );
        }

        // labelと選択肢キーの一致チェック
        if (value.label !== key) {
            throw new Error(
                `選択肢 "${key}" の label "${value.label}" が一致しません。\n` +
                `kintone APIの仕様により、キー名と label は完全に一致している必要があります。\n` +
                `例: "${value.label}": { "label": "${value.label}", "index": "0" },\n` +
                `注意: 自動修正機能を有効にすると、キー名が label と同じ値に修正されます。`
            );
        }

        // indexの存在チェック
        if (typeof value.index === 'undefined') {
            throw new Error(
                `選択肢 "${key}" の index が指定されていません。\n` +
                `0以上の数値を文字列型で指定してください。\n` +
                `例: "${key}": { "label": "${key}", "index": "0" }`
            );
        }

        // indexが文字列型であることのチェック
        if (typeof value.index !== 'string') {
            throw new Error(
                `選択肢 "${key}" の index は文字列型の数値を指定してください。\n` +
                `例: "${key}": { "label": "${key}", "index": "0" },\n` +
                `現在の値: ${typeof value.index} 型の ${value.index}`
            );
        }

        // indexが数値文字列であることのチェック
        if (!/^\d+$/.test(value.index)) {
            throw new Error(
                `選択肢 "${key}" の index は 0以上の整数値を文字列型で指定してください。\n` +
                `例: "${key}": { "label": "${key}", "index": "0" },\n` +
                `現在の値: "${value.index}"`
            );
        }

        // indexが0以上の数値であることのチェック
        const indexNum = parseInt(value.index, 10);
        if (isNaN(indexNum) || indexNum < 0) {
            throw new Error(
                `選択肢 "${key}" の index は 0以上の整数値を文字列型で指定してください。\n` +
                `例: "${key}": { "label": "${key}", "index": "0" }`
            );
        }
    });

    return true;
}

/**
 * kintoneでサポートされていない関数のリスト
 * key: 未サポート関数名, value: 代替方法の説明
 */
const UNSUPPORTED_FUNCTIONS = {
    "DAYS_BETWEEN": "日付の差分は「DATE_FORMAT(日付1, \"YYYY/MM/DD\") - DATE_FORMAT(日付2, \"YYYY/MM/DD\")」で計算できます",
    "AVERAGE": "平均値は「SUM(フィールド) / COUNT(フィールド)」で計算できます",
    "CONCATENATE": "文字列の連結は「&」演算子を使用します。例: 文字列1 & \" \" & 文字列2",
    "VLOOKUP": "参照テーブルの値を取得するには、ルックアップフィールドを使用してください",
    "COUNTIF": "条件付きカウントは「SUM(IF(条件, 1, 0))」で計算できます",
    "SUMIF": "条件付き合計は「SUM(IF(条件, 値, 0))」で計算できます",
    "TODAY": "現在の日付を取得するには、日付フィールドで「defaultNowValue: true」を設定してください",
    "NOW": "現在の日時を取得するには、日時フィールドで「defaultNowValue: true」を設定してください",
    "MONTH": "月を取得するには「DATE_FORMAT(日付, \"MM\")」を使用してください",
    "YEAR": "年を取得するには「DATE_FORMAT(日付, \"YYYY\")」を使用してください",
    "DAY": "日を取得するには「DATE_FORMAT(日付, \"DD\")」を使用してください"
};

/**
 * 計算式内のテーブル名.フィールド名パターンを検出して修正する関数
 * @param {string} expression 計算式
 * @returns {{isValid: boolean, message: string, suggestion: string}} 検証結果
 */
function validateExpressionFormat(expression) {
    // 未サポート関数の検出
    for (const [func, alternative] of Object.entries(UNSUPPORTED_FUNCTIONS)) {
        const funcPattern = new RegExp(`${func}\\s*\\(`, 'i');
        if (funcPattern.test(expression)) {
            // DAYS_BETWEEN関数の特別処理（代替案の自動生成）
            if (func === "DAYS_BETWEEN") {
                const daysPattern = /DAYS_BETWEEN\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/i;
                const match = expression.match(daysPattern);
                if (match) {
                    const [_, date1, date2] = match;
                    const suggestion = expression.replace(
                        daysPattern, 
                        `ROUNDDOWN(DATE_FORMAT(${date1}, "YYYY/MM/DD") - DATE_FORMAT(${date2}, "YYYY/MM/DD"), 0)`
                    );
                    
                    return {
                        isValid: false,
                        message: `計算式で使用されている "${func}" 関数はkintoneではサポートされていません。\n\n【代替方法】\n${alternative}\n\n【修正案】\n${suggestion}\n\nkintoneの計算フィールドでサポートされている関数の詳細は get_field_type_documentation ツールで確認できます。`,
                        suggestion: suggestion
                    };
                }
            }
            
            return {
                isValid: false,
                message: `計算式で使用されている "${func}" 関数はkintoneではサポートされていません。\n\n【代替方法】\n${alternative}\n\nkintoneの計算フィールドでサポートされている関数の詳細は get_field_type_documentation ツールで確認できます。`,
                suggestion: null
            };
        }
    }

    // テーブル名.フィールド名パターンを検出
    // 修正: 数値リテラルの小数点を除外するために正規表現を改良
    // 1. 数値リテラルの前後に識別子が来ない場合は除外
    // 2. 識別子の後に続くドットのみを検出

    // 数値リテラルを検出する正規表現
    const numberPattern = /\b\d+\.\d+\b/g;

    // 数値リテラルを一時的に置換して保護
    const numberPlaceholders = {};
    let placeholderCount = 0;
    let protectedExpression = expression.replace(numberPattern, (match) => {
        const placeholder = `__NUMBER_PLACEHOLDER_${placeholderCount}__`;
        numberPlaceholders[placeholder] = match;
        placeholderCount++;
        return placeholder;
    });

    // テーブル名.フィールド名パターンを検出
    const tableFieldPattern = /([a-zA-Z0-9ぁ-んァ-ヶー一-龠々＿_･・＄￥]+)\.([a-zA-Z0-9ぁ-んァ-ヶー一-龠々＿_･・＄￥]+)/g;

    if (tableFieldPattern.test(protectedExpression)) {
        // 修正案を作成
        const suggestion = protectedExpression.replace(tableFieldPattern, "$2");

        // プレースホルダーを元の数値に戻す
        const finalSuggestion = suggestion.replace(/__NUMBER_PLACEHOLDER_\d+__/g, (placeholder) => {
            return numberPlaceholders[placeholder] || placeholder;
        });

        return {
            isValid: false,
            message: `計算式内でサブテーブル内のフィールドを参照する際は、テーブル名を指定せず、フィールドコードのみを使用してください。\n\n【誤った参照方法】\n${expression}\n\n【正しい参照方法】\n${finalSuggestion}\n\nkintoneでは、フィールドコードはアプリ内で一意であるため、サブテーブル名を指定する必要はありません。`,
            suggestion: finalSuggestion
        };
    }

    // 空の計算式チェック
    if (!expression || expression.trim() === '') {
        return {
            isValid: false,
            message: `計算式が空です。有効な計算式を指定してください。\n\n【計算式の例】\n- 数値計算: price * quantity\n- 合計計算: SUM(金額)\n- 条件分岐: IF(quantity > 10, price * 0.9, price)`,
            suggestion: null
        };
    }
    
    return { isValid: true };
}

// 計算フィールドのバリデーション
export function validateCalcField(fieldType, expression, config) {
    if (fieldType === CALC_FIELD_TYPE) {
        // formulaからexpressionへの自動変換
        if (config && config.formula !== undefined && config.expression === undefined) {
            config.expression = config.formula;
            delete config.formula;
            console.error(`警告: 計算フィールドの計算式は formula ではなく expression に指定してください。今回は自動的に変換しました。`);
            expression = config.expression;
        }
        
        // digit=trueの場合はformatをNUMBER_DIGITに自動設定
        if (config && config.digit === true && (!config.format || config.format === 'NUMBER')) {
            config.format = 'NUMBER_DIGIT';
            console.error(`桁区切り表示が有効なため、format を "NUMBER_DIGIT" に自動設定しました。`);
        }
        
        // 計算式のチェック
        if (expression === undefined) {
            throw new Error('計算フィールドには expression の指定が必須です。formula ではなく expression を使用してください。');
        }
        if (typeof expression !== 'string' || expression.trim() === '') {
            throw new Error('expression は空でない文字列で kintoneで使用できる計算式を指定する必要があります。');
        }
        
        // digit=trueの場合はformatをNUMBER_DIGITに自動設定
        if (config && config.digit === true && (!config.format || config.format === 'NUMBER')) {
            config.format = 'NUMBER_DIGIT';
            console.error(`桁区切り表示が有効なため、format を "NUMBER_DIGIT" に自動設定しました。`);
        }
        
        // 表示形式のチェック
        if (config && config.format !== undefined) {
            const validFormats = ['NUMBER', 'NUMBER_DIGIT', 'DATE', 'TIME', 'DATETIME', 'HOUR_MINUTE', 'DAY_HOUR_MINUTE'];
            if (!validFormats.includes(config.format)) {
                throw new Error(`format の値が不正です: "${config.format}"\n指定可能な値: ${validFormats.join(', ')}`);
            }
            
            // 数値形式の場合の追加チェック
            if (config.format === 'NUMBER' || config.format === 'NUMBER_DIGIT') {
                // 桁区切りのチェック
                if (config.digit !== undefined && 
                    typeof config.digit !== 'boolean' && 
                    config.digit !== 'true' && 
                    config.digit !== 'false') {
                    throw new Error('digitはtrueまたはfalseで指定してください。');
                }
                
                // 小数点以下桁数のチェック
                if (config.displayScale !== undefined) {
                    const scale = parseInt(config.displayScale, 10);
                    if (isNaN(scale) || scale < 0 || scale > 10) {
                        throw new Error('displayScaleは0から10までの整数で指定してください。');
                    }
                }
                
                // 単位位置のチェック
                if (config.unitPosition && !VALID_UNIT_POSITIONS.includes(config.unitPosition)) {
                    throw new Error(`単位位置の値が不正です: "${config.unitPosition}"\n指定可能な値: ${VALID_UNIT_POSITIONS.join(', ')}`);
                }
                
                // 単位記号と unitPosition の組み合わせが不自然な場合は警告
                if (config.unit && config.unitPosition) {
                    const recommendedPosition = determineUnitPosition(config.unit);
                    if (config.unitPosition !== recommendedPosition) {
                        const examples = {
                            "BEFORE": "$100, ¥100",
                            "AFTER": "100円, 100%, 100kg"
                        };
                        
                        console.error(`警告: 単位記号「${config.unit}」には unitPosition="${recommendedPosition}" が推奨されます。` +
                                   `現在の設定: "${config.unitPosition}"。` +
                                   `例: ${examples[recommendedPosition]}`);
                    }
                }
            }
        } else if (config) {
            // formatが指定されていない場合はデフォルトでNUMBER_DIGITを設定
            config.format = 'NUMBER_DIGIT';
            console.error(`formatが指定されていないため、デフォルト値 "NUMBER_DIGIT" を設定しました。`);
        }
    }
    return true;
}

// リンクフィールドのバリデーション
export function validateLinkField(fieldType, protocol) {
    if (fieldType === LINK_FIELD_TYPE) {
        const msg = `指定可能な値: ${VALID_LINK_PROTOCOLS.join(', ')}`;
        if (!protocol) {
            throw new Error(
                `リンクフィールドには protocol の指定が必須です。\n${msg}`
            );
        }
        if (!VALID_LINK_PROTOCOLS.includes(protocol)) {
            throw new Error(
                `protocol の値が不正です: "${protocol}"\n${msg}`
            );
        }
    }
    return true;
}

// 関連テーブルフィールドのバリデーション
export function validateReferenceTableField(fieldType, referenceTable) {
    if (fieldType === REFERENCE_TABLE_FIELD_TYPE) {
        // 必須項目のチェック
        if (!referenceTable) {
            throw new Error('関連テーブルフィールドには referenceTable の指定が必須です。');
        }
        
        // relatedApp のチェック
        if (!referenceTable.relatedApp) {
            throw new Error('関連テーブルフィールドには relatedApp の指定が必須です。');
        }
        
        // app または code のいずれかが必要
        if (!referenceTable.relatedApp.app && !referenceTable.relatedApp.code) {
            throw new Error('関連テーブルフィールドには参照先アプリのIDまたはコード（relatedApp.app または relatedApp.code）の指定が必須です。');
        }
        
        // condition のチェック
        if (!referenceTable.condition) {
            throw new Error('関連テーブルフィールドには condition の指定が必須です。');
        }
        
        if (!referenceTable.condition.field) {
            throw new Error('関連テーブルフィールドには自アプリのフィールド（condition.field）の指定が必須です。');
        }
        
        if (!referenceTable.condition.relatedField) {
            throw new Error('関連テーブルフィールドには参照先アプリのフィールド（condition.relatedField）の指定が必須です。');
        }
        
        // size の値チェック（指定されている場合）
        if (referenceTable.size !== undefined) {
            const validSizes = ['1', '3', '5', '10', '20', '30', '40', '50', 1, 3, 5, 10, 20, 30, 40, 50];
            if (!validSizes.includes(referenceTable.size)) {
                throw new Error('関連テーブルフィールドの表示件数（size）には 1, 3, 5, 10, 20, 30, 40, 50 のいずれかを指定してください。');
            }
        }
    }
    return true;
}

// 数値フィールドのバリデーション
export function validateNumberField(fieldType, config) {
    if (fieldType === NUMBER_FIELD_TYPE) {
        // 最大値・最小値のチェック
        if (config.maxValue !== undefined && config.minValue !== undefined) {
            const max = parseFloat(config.maxValue);
            const min = parseFloat(config.minValue);
            if (!isNaN(max) && !isNaN(min) && max < min) {
                throw new Error('最大値は最小値より大きい値を指定してください。');
            }
        }
        
        // 単位位置のチェック
        if (config.unitPosition && !VALID_UNIT_POSITIONS.includes(config.unitPosition)) {
            throw new Error(`単位位置の値が不正です: "${config.unitPosition}"\n指定可能な値: ${VALID_UNIT_POSITIONS.join(', ')}`);
        }
        
        // 単位記号と unitPosition の組み合わせが不自然な場合は警告
        if (config.unit && config.unitPosition) {
            const recommendedPosition = determineUnitPosition(config.unit);
            if (config.unitPosition !== recommendedPosition) {
                const examples = {
                    "BEFORE": "$100, ¥100",
                    "AFTER": "100円, 100%, 100kg"
                };
                
                console.error(`警告: 単位記号「${config.unit}」には unitPosition="${recommendedPosition}" が推奨されます。` +
                           `現在の設定: "${config.unitPosition}"。` +
                           `例: ${examples[recommendedPosition]}`);
            }
        }
        
        // digitのチェック（桁区切り表示）
        if (config.digit !== undefined && 
            typeof config.digit !== 'boolean' && 
            config.digit !== 'true' && 
            config.digit !== 'false') {
            throw new Error('digitはtrueまたはfalseで指定してください。');
        }
        
        // displayScaleのチェック（小数点以下の表示桁数）
        if (config.displayScale === "") {
            // 空文字列の場合は削除
            delete config.displayScale;
            console.error(`数値フィールドの displayScale に空文字列が指定されたため、指定を削除しました。`);
        } else if (config.displayScale !== undefined) {
            const scale = parseInt(config.displayScale, 10);
            if (isNaN(scale) || scale < 0 || scale > 10) {
                throw new Error('displayScaleは0から10までの整数で指定してください。');
            }
        }
    }
    return true;
}

// 文字列フィールドのバリデーション
export function validateTextField(fieldType, config) {
    if (fieldType === SINGLE_LINE_TEXT_FIELD_TYPE || fieldType === MULTI_LINE_TEXT_FIELD_TYPE) {
        // 最大文字数・最小文字数のチェック
        if (config.maxLength !== undefined && config.minLength !== undefined) {
            const max = parseInt(config.maxLength, 10);
            const min = parseInt(config.minLength, 10);
            if (!isNaN(max) && !isNaN(min) && max < min) {
                throw new Error('最大文字数は最小文字数より大きい値を指定してください。');
            }
        }
        
        // uniqueのチェック（重複禁止）
        if (config.unique !== undefined && 
            typeof config.unique !== 'boolean' && 
            config.unique !== 'true' && 
            config.unique !== 'false') {
            throw new Error('uniqueはtrueまたはfalseで指定してください。');
        }
    }
    return true;
}

// 日時フィールドのバリデーション
export function validateDateTimeField(fieldType, config) {
    if (fieldType === DATE_FIELD_TYPE || fieldType === TIME_FIELD_TYPE || fieldType === DATETIME_FIELD_TYPE) {
        // uniqueのチェック（重複禁止）
        if (config.unique !== undefined && 
            typeof config.unique !== 'boolean' && 
            config.unique !== 'true' && 
            config.unique !== 'false') {
            throw new Error('uniqueはtrueまたはfalseで指定してください。');
        }
        
        // defaultNowValueのチェック
        if (config.defaultNowValue !== undefined && 
            typeof config.defaultNowValue !== 'boolean' && 
            config.defaultNowValue !== 'true' && 
            config.defaultNowValue !== 'false') {
            throw new Error('defaultNowValueはtrueまたはfalseで指定してください。');
        }
        
        // defaultValueのチェック（日付フィールドの場合）
        if (fieldType === DATE_FIELD_TYPE && config.defaultValue) {
            // "TODAY"は受け付けない
            if (config.defaultValue === 'TODAY') {
                throw new Error('日付フィールドのデフォルト値として"TODAY"は使用できません。代わりにdefaultNowValue: trueを使用してください。');
            }
            
            // YYYY-MM-DD形式かチェック
            const datePattern = /^\d{4}-\d{2}-\d{2}$/;
            if (!datePattern.test(config.defaultValue)) {
                throw new Error('日付フィールドのdefaultValueはYYYY-MM-DD形式（例: 2023-01-31）で指定してください。');
            }
            
            // 有効な日付かチェック
            const date = new Date(config.defaultValue);
            if (isNaN(date.getTime())) {
                throw new Error(`日付フィールドのdefaultValue "${config.defaultValue}" は有効な日付ではありません。YYYY-MM-DD形式（例: 2023-01-31）で指定してください。`);
            }
        }
        
        // defaultValueのチェック（時刻フィールドの場合）
        if (fieldType === TIME_FIELD_TYPE && config.defaultValue) {
            // "NOW"は受け付けない
            if (config.defaultValue === 'NOW') {
                throw new Error('時刻フィールドのデフォルト値として"NOW"は使用できません。代わりにdefaultNowValue: trueを使用してください。');
            }
            
            // HH:MM形式かチェック
            const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
            if (!timePattern.test(config.defaultValue)) {
                throw new Error('時刻フィールドのdefaultValueはHH:MM形式（例: 09:30）で指定してください。');
            }
        }
        
        // defaultValueのチェック（日時フィールドの場合）
        if (fieldType === DATETIME_FIELD_TYPE && config.defaultValue) {
            // "NOW"は受け付けない
            if (config.defaultValue === 'NOW') {
                throw new Error('日時フィールドのデフォルト値として"NOW"は使用できません。代わりにdefaultNowValue: trueを使用してください。');
            }
            
            // YYYY-MM-DDTHH:MM:SS形式かチェック
            const datetimePattern = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
            if (!datetimePattern.test(config.defaultValue)) {
                throw new Error('日時フィールドのdefaultValueはYYYY-MM-DDTHH:MM:SS形式（例: 2023-01-31T09:30:00）で指定してください。');
            }
            
            // 有効な日時かチェック
            const date = new Date(config.defaultValue);
            if (isNaN(date.getTime())) {
                throw new Error(`日時フィールドのdefaultValue "${config.defaultValue}" は有効な日時ではありません。YYYY-MM-DDTHH:MM:SS形式（例: 2023-01-31T09:30:00）で指定してください。`);
            }
        }
    }
    return true;
}

// リッチエディタフィールドのバリデーション
export function validateRichTextField(fieldType, config) {
    if (fieldType === RICH_TEXT_FIELD_TYPE) {
        // defaultValueのチェック
        if (config.defaultValue !== undefined && typeof config.defaultValue !== 'string') {
            throw new Error('リッチエディタフィールドのdefaultValueは文字列で指定してください。');
        }
    }
    return true;
}

// 添付ファイルフィールドのバリデーション
export function validateAttachmentField(fieldType, config) {
    if (fieldType === ATTACHMENT_FIELD_TYPE) {
        // 特に必要なバリデーションはないが、将来的に追加する可能性があるため関数は用意しておく
    }
    return true;
}

// ユーザー選択フィールドのバリデーション
export function validateUserSelectField(fieldType, config) {
    if (fieldType === USER_SELECT_FIELD_TYPE || fieldType === GROUP_SELECT_FIELD_TYPE || fieldType === ORGANIZATION_SELECT_FIELD_TYPE) {
        // defaultValueのチェック
        if (config.defaultValue !== undefined) {
            if (!Array.isArray(config.defaultValue)) {
                throw new Error(`${fieldType}フィールドのdefaultValueは配列で指定してください。`);
            }
            
            // 各要素のチェック
            config.defaultValue.forEach((item, index) => {
                if (typeof item !== 'object' || item === null) {
                    throw new Error(`${fieldType}フィールドのdefaultValue[${index}]はオブジェクトで指定してください。`);
                }
                
                if (!item.type || !item.code) {
                    throw new Error(`${fieldType}フィールドのdefaultValue[${index}]には type と code の指定が必須です。`);
                }
                
                // typeの値チェック
                const validTypes = {
                    [USER_SELECT_FIELD_TYPE]: ['USER'],
                    [GROUP_SELECT_FIELD_TYPE]: ['GROUP'],
                    [ORGANIZATION_SELECT_FIELD_TYPE]: ['ORGANIZATION']
                };
                
                const validTypesForField = validTypes[fieldType] || [];
                if (!validTypesForField.includes(item.type)) {
                    throw new Error(`${fieldType}フィールドのdefaultValue[${index}].typeには ${validTypesForField.join(', ')} のいずれかを指定してください。`);
                }
            });
        }
        
        // entitiesのチェック
        if (config.entities !== undefined) {
            if (!Array.isArray(config.entities)) {
                throw new Error(`${fieldType}フィールドのentitiesは配列で指定してください。`);
            }
        }
    }
    return true;
}

// テーブルフィールドのバリデーション
export function validateSubtableField(fieldType, config) {
    if (fieldType === SUBTABLE_FIELD_TYPE) {
        // fieldsプロパティの存在チェック
        if (!config.fields) {
            throw new Error(
                `テーブルフィールドには fields プロパティの指定が必須です。\n` +
                `テーブル内のフィールドを定義するオブジェクトを指定してください。`
            );
        }
        
        // fieldsの形式チェック
        if (typeof config.fields !== 'object' || Array.isArray(config.fields)) {
            throw new Error(
                `テーブルフィールドの fields はオブジェクト形式で指定する必要があります。\n` +
                `例: "fields": { "field1": { "type": "SINGLE_LINE_TEXT", "code": "field1", "label": "テキスト1" } }`
            );
        }
        
        // テーブル内の各フィールドをチェック
        for (const [fieldKey, fieldDef] of Object.entries(config.fields)) {
            // フィールドコードのバリデーション
            validateFieldCode(fieldKey);
            
            // codeプロパティの存在チェック
            if (!fieldDef.code) {
                throw new Error(
                    `テーブル内のフィールド "${fieldKey}" の code プロパティが指定されていません。`
                );
            }
            
            // プロパティキーとcodeの一致チェック
            if (fieldDef.code !== fieldKey) {
                throw new Error(
                    `テーブル内のフィールドコードの不一致: ` +
                    `プロパティキー "${fieldKey}" ≠ フィールドコード "${fieldDef.code}"\n` +
                    `kintone APIの仕様により、プロパティキーとフィールドコードは完全に一致している必要があります。`
                );
            }
            
            // typeプロパティの存在チェック
            if (!fieldDef.type) {
                throw new Error(
                    `テーブル内のフィールド "${fieldKey}" の type プロパティが指定されていません。`
                );
            }
            
            // テーブル内では使用できないフィールドタイプのチェック
            const invalidSubtableFieldTypes = [
                SUBTABLE_FIELD_TYPE,
                REFERENCE_TABLE_FIELD_TYPE,
                STATUS_FIELD_TYPE,
                RELATED_RECORDS_FIELD_TYPE,
                RECORD_NUMBER_FIELD_TYPE,
                CREATOR_FIELD_TYPE,
                MODIFIER_FIELD_TYPE,
                CREATED_TIME_FIELD_TYPE,
                UPDATED_TIME_FIELD_TYPE
            ];
            
            if (invalidSubtableFieldTypes.includes(fieldDef.type)) {
                throw new Error(
                    `テーブル内では "${fieldDef.type}" タイプのフィールドは使用できません。`
                );
            }
            
            // テーブル内の選択肢フィールドのoptionsのバリデーション
            if (FIELD_TYPES_REQUIRING_OPTIONS.includes(fieldDef.type)) {
                validateOptions(fieldDef.type, fieldDef.options);
            }
            
            // テーブル内の各フィールドタイプ固有のバリデーション
            if (fieldDef.type === CALC_FIELD_TYPE) {
                validateCalcField(fieldDef.type, fieldDef.expression);
            }
            if (fieldDef.type === LINK_FIELD_TYPE) {
                validateLinkField(fieldDef.type, fieldDef.protocol);
            }
            if ([SINGLE_LINE_TEXT_FIELD_TYPE, MULTI_LINE_TEXT_FIELD_TYPE].includes(fieldDef.type)) {
                validateTextField(fieldDef.type, fieldDef);
            }
            if (fieldDef.type === NUMBER_FIELD_TYPE) {
                validateNumberField(fieldDef.type, fieldDef);
            }
            if ([DATE_FIELD_TYPE, TIME_FIELD_TYPE, DATETIME_FIELD_TYPE].includes(fieldDef.type)) {
                validateDateTimeField(fieldDef.type, fieldDef);
            }
            if (fieldDef.type === RICH_TEXT_FIELD_TYPE) {
                validateRichTextField(fieldDef.type, fieldDef);
            }
            if (fieldDef.type === ATTACHMENT_FIELD_TYPE) {
                validateAttachmentField(fieldDef.type, fieldDef);
            }
            if ([USER_SELECT_FIELD_TYPE, GROUP_SELECT_FIELD_TYPE, ORGANIZATION_SELECT_FIELD_TYPE].includes(fieldDef.type)) {
                validateUserSelectField(fieldDef.type, fieldDef);
            }
        }
    }
    return true;
}

// ステータスフィールドのバリデーション
export function validateStatusField(fieldType, config) {
    if (fieldType === STATUS_FIELD_TYPE) {
        // ステータスフィールドは通常、システムによって自動的に作成されるため、
        // ユーザーが直接作成することはできません。
        // しかし、将来的にAPIでの作成が可能になった場合のために関数を用意しておきます。
        
        // 状態のチェック（指定されている場合）
        if (config.states !== undefined) {
            if (typeof config.states !== 'object' || Array.isArray(config.states)) {
                throw new Error('statesはオブジェクト形式で指定する必要があります。');
            }
            
            // 各状態のバリデーション
            Object.entries(config.states).forEach(([stateKey, stateValue]) => {
                if (typeof stateValue !== 'object' || stateValue === null) {
                    throw new Error(`状態 "${stateKey}" の設定はオブジェクト形式で指定する必要があります。`);
                }
                
                // 名前のチェック
                if (!stateValue.name) {
                    throw new Error(`状態 "${stateKey}" の name が指定されていません。`);
                }
                
                // 遷移先のチェック
                if (stateValue.transitions !== undefined && (!Array.isArray(stateValue.transitions))) {
                    throw new Error(`状態 "${stateKey}" の transitions は配列で指定する必要があります。`);
                }
            });
        }
        
        // デフォルト状態のチェック
        if (config.defaultState !== undefined && typeof config.defaultState !== 'string') {
            throw new Error('defaultStateは文字列で指定する必要があります。');
        }
    }
    return true;
}

// 関連レコードリストフィールドのバリデーション
export function validateRelatedRecordsField(fieldType, config) {
    if (fieldType === RELATED_RECORDS_FIELD_TYPE) {
        // 必須項目のチェック
        if (!config.relatedApp) {
            throw new Error('関連レコードリストフィールドには relatedApp の指定が必須です。');
        }
        
        // app または code のいずれかが必要
        if (!config.relatedApp.app && !config.relatedApp.code) {
            throw new Error('関連レコードリストフィールドには参照先アプリのIDまたはコード（relatedApp.app または relatedApp.code）の指定が必須です。');
        }
        
        // 関連条件のチェック
        if (!config.condition) {
            throw new Error('関連レコードリストフィールドには condition の指定が必須です。');
        }
        
        if (!config.condition.field) {
            throw new Error('関連レコードリストフィールドには自アプリのフィールド（condition.field）の指定が必須です。');
        }
        
        if (!config.condition.relatedField) {
            throw new Error('関連レコードリストフィールドには参照先アプリのフィールド（condition.relatedField）の指定が必須です。');
        }
        
        // 表示フィールドのチェック（指定されている場合）
        if (config.displayFields !== undefined) {
            if (!Array.isArray(config.displayFields)) {
                throw new Error('displayFieldsは配列で指定する必要があります。');
            }
            
            // 各表示フィールドのチェック
            config.displayFields.forEach((field, index) => {
                if (typeof field !== 'string') {
                    throw new Error(`displayFields[${index}]は文字列で指定する必要があります。`);
                }
            });
        }
        
        // フィルター条件のチェック（指定されている場合）
        if (config.filterCond !== undefined && typeof config.filterCond !== 'string') {
            throw new Error('filterCondは文字列で指定する必要があります。');
        }
        
        // ソート条件のチェック（指定されている場合）
        if (config.sort !== undefined && typeof config.sort !== 'string') {
            throw new Error('sortは文字列で指定する必要があります。');
        }
    }
    return true;
}

// レコード番号フィールドのバリデーション
export function validateRecordNumberField(fieldType, config) {
    if (fieldType === RECORD_NUMBER_FIELD_TYPE) {
        // レコード番号フィールドは通常、システムによって自動的に作成されるため、
        // ユーザーが直接作成することはできません。
        // しかし、将来的にAPIでの作成が可能になった場合のために関数を用意しておきます。
        
        // 採番ルールのチェック（指定されている場合）
        if (config.format !== undefined && typeof config.format !== 'string') {
            throw new Error('formatは文字列で指定する必要があります。');
        }
    }
    return true;
}

// システムフィールド（作成者/更新者/作成日時/更新日時）のバリデーション
export function validateSystemField(fieldType, config) {
    if ([CREATOR_FIELD_TYPE, MODIFIER_FIELD_TYPE, CREATED_TIME_FIELD_TYPE, UPDATED_TIME_FIELD_TYPE].includes(fieldType)) {
        // システムフィールドは通常、システムによって自動的に作成されるため、
        // ユーザーが直接作成することはできません。
        // しかし、将来的にAPIでの作成が可能になった場合のために関数を用意しておきます。
    }
    return true;
}

// LOOKUPフィールドのバリデーション
export function validateLookupField(fieldType, lookup) {
    if (fieldType === LOOKUP_FIELD_TYPE) {
        // 必須項目のチェック
        if (!lookup) {
            throw new Error('LOOKUPフィールドには lookup の指定が必須です。');
        }
        
        // relatedApp のチェック
        if (!lookup.relatedApp) {
            throw new Error('LOOKUPフィールドには relatedApp の指定が必須です。');
        }
        
        // app または code のいずれかが必要
        if (!lookup.relatedApp.app && !lookup.relatedApp.code) {
            throw new Error('LOOKUPフィールドには参照先アプリのIDまたはコード（relatedApp.app または relatedApp.code）の指定が必須です。');
        }
        
        // relatedKeyField のチェック
        if (!lookup.relatedKeyField) {
            throw new Error('LOOKUPフィールドには relatedKeyField の指定が必須です。');
        }
        
        // fieldMappings のチェック
        if (!lookup.fieldMappings || !Array.isArray(lookup.fieldMappings) || lookup.fieldMappings.length === 0) {
            throw new Error('LOOKUPフィールドには fieldMappings の指定が必須です。少なくとも1つのマッピングを含む配列である必要があります。');
        }
        
        // 各フィールドマッピングのチェック
        lookup.fieldMappings.forEach((mapping, index) => {
            if (!mapping.field) {
                throw new Error(`LOOKUPフィールドの fieldMappings[${index}].field の指定が必須です。`);
            }
            if (!mapping.relatedField) {
                throw new Error(`LOOKUPフィールドの fieldMappings[${index}].relatedField の指定が必須です。`);
            }
        });
    }
    return true;
}
