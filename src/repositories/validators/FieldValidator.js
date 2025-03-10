// src/repositories/validators/FieldValidator.js
// src/repositories/validators/FieldValidator.js
import { FIELD_TYPES_REQUIRING_OPTIONS, CALC_FIELD_TYPE, LINK_FIELD_TYPE, VALID_LINK_PROTOCOLS, LOOKUP_FIELD_TYPE, REFERENCE_TABLE_FIELD_TYPE } from '../../constants.js';

// フィールドコードのバリデーション
export function validateFieldCode(fieldCode) {
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
                `例: "${value.label}": { "label": "${value.label}", "index": "0" }\n` +
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
                `例: "${key}": { "label": "${key}", "index": "0" }\n` +
                `現在の値: ${typeof value.index} 型の ${value.index}`
            );
        }

        // indexが数値文字列であることのチェック
        if (!/^\d+$/.test(value.index)) {
            throw new Error(
                `選択肢 "${key}" の index は 0以上の整数値を文字列型で指定してください。\n` +
                `例: "${key}": { "label": "${key}", "index": "0" }\n` +
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

// 計算フィールドのバリデーション
export function validateCalcField(fieldType, expression) {
    if (fieldType === CALC_FIELD_TYPE) {
        if (expression === undefined) {
            throw new Error('計算フィールドには expression の指定が必須です。空でない文字列で kintoneで使用できる計算式を指定する必要があります。');
        }
        if (typeof expression !== 'string' || expression.trim() === '') {
            throw new Error('expression は空でない文字列で kintoneで使用できる計算式を指定する必要があります。');
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
