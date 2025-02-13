// src/repositories/validators/OptionValidator.js
import { FIELD_TYPES_REQUIRING_OPTIONS } from '../../constants.js';

// 選択肢フィールドのoptionsを自動修正するメソッド
export function autoCorrectOptions(fieldType, options) {
    const warnings = [];
    const keyChanges = {};
    
    // 選択肢フィールドの場合のみ処理
    if (!FIELD_TYPES_REQUIRING_OPTIONS.includes(fieldType)) {
        return { warnings, keyChanges };
    }
    
    // 各選択肢のlabelとキー名の一致をチェックし、不一致の場合は自動修正
    Object.entries(options).forEach(([key, value]) => {
        // labelの存在チェック
        if (!value.label) {
            value.label = key;
            warnings.push(
                `選択肢 "${key}" の label が指定されていないため、自動的に "${key}" を設定しました。\n` +
                `kintone APIの仕様により、label とキー名は完全に一致している必要があります。`
            );
            return;
        }
        
        // labelと選択肢キーの一致チェック
        if (value.label !== key) {
            // キー名をlabelと同じ値に変更する（逆方向の修正）
            const originalKey = key;
            const newKey = value.label;
            
            // キー名の変更情報を記録
            keyChanges[originalKey] = newKey;
            
            warnings.push(
                `選択肢 "${originalKey}" のキー名を label "${newKey}" と一致するように自動修正しました。\n` +
                `kintone APIの仕様により、キー名と label は完全に一致している必要があります。`
            );
        }
    });
    
    return { warnings, keyChanges };
}
