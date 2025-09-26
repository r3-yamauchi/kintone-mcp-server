// src/repositories/validators/LayoutValidator.js
import { LoggingUtils } from '../../utils/LoggingUtils.js';

function logLayoutWarning(message, metadata = {}) {
    LoggingUtils.warn('layout_validator', 'warning', { message, ...metadata });
}

// レイアウト要素のタイプを検証する関数
export function validateLayoutElementType(element, allowedTypes) {
    // typeプロパティが指定されていない場合は自動的に補完
    if (!element.type) {
        // デフォルトのタイプを設定
        if (allowedTypes && allowedTypes.length > 0) {
            element.type = allowedTypes[0]; // 許可されているタイプの最初のものを使用
            logLayoutWarning(`レイアウト要素に type プロパティが指定されていません。自動的に "${element.type}" を設定します。`);
        } else {
            // 許可されているタイプが指定されていない場合は "ROW" をデフォルトとして使用
            element.type = "ROW";
            logLayoutWarning('レイアウト要素に type プロパティが指定されていません。自動的に "ROW" を設定します。');
        }
    }
    
    if (allowedTypes && !allowedTypes.includes(element.type)) {
        throw new Error(
            `レイアウト要素のタイプが不正です: "${element.type}"\n` +
            `指定可能な値: ${allowedTypes.join(', ')}`
        );
    }
    
    return true;
}

// ROW要素を検証する関数
export function validateRowElement(row) {
    validateLayoutElementType(row, ["ROW"]);
    
    // fieldsプロパティが指定されていない場合は自動的に補完
    if (!row.fields) {
        row.fields = [];
        logLayoutWarning('ROW要素に fields プロパティが指定されていません。空の配列を設定します。');
    }
    
    // fieldsプロパティが配列でない場合は配列に変換
    if (!Array.isArray(row.fields)) {
        logLayoutWarning('ROW要素の fields プロパティが配列ではありません。自動的に配列に変換します。');
        row.fields = [row.fields];
    }
    
    // GROUP要素が含まれる場合は、それが唯一の要素であることを確認
    const groupFields = row.fields.filter(field => field.type === "GROUP");
    if (groupFields.length > 0 && row.fields.length > groupFields.length) {
        throw new Error('GROUP要素を含む行には他のフィールドを配置できません。kintoneの仕様により、グループフィールドはトップレベルに配置する必要があります。');
    }
    
    // ROW要素内にSUBTABLE要素が含まれていないことを確認
    const subtableFields = row.fields.filter(field => field.type === "SUBTABLE");
    if (subtableFields.length > 0) {
        throw new Error('ROW要素内にはSUBTABLE要素を配置できません。kintoneの仕様により、テーブルはトップレベルに配置する必要があります。');
    }
    
    // 各フィールド要素を検証
    row.fields.forEach((field, index) => {
        // フィールド要素のタイプは実際のフィールドタイプ（"NUMBER"など）または特殊タイプ（"LABEL"など）
        // 特殊タイプのみを検証し、実際のフィールドタイプは許容する
        if (["LABEL", "SPACER", "HR", "REFERENCE_TABLE"].includes(field.type)) {
            validateLayoutElementType(field, ["LABEL", "SPACER", "HR", "REFERENCE_TABLE"]);
        }
        
        // フィールドタイプに応じた検証
        if (field.type === "LABEL") {
            if (!field.value) {
                throw new Error(`ROW要素内のLABEL要素[${index}]には value プロパティが必須です。`);
            }
        } else if (field.type === "REFERENCE_TABLE") {
            if (!field.code) {
                throw new Error(`ROW要素内のREFERENCE_TABLE要素[${index}]には code プロパティが必須です。`);
            }
        }
    });
    
    return true;
}

// GROUP要素を検証する関数
export function validateGroupElement(group) {
    validateLayoutElementType(group, ["GROUP"]);
    
    if (!group.code) {
        throw new Error('GROUP要素には code プロパティが必須です。');
    }
    
    // fieldsプロパティが指定されている場合は明確なエラーメッセージを表示
    if (group.fields !== undefined) {
        throw new Error(
            `GROUP要素 "${group.code}" には fields プロパティではなく layout プロパティを使用してください。\n` +
            `GROUP要素の正しい構造:\n` +
            `{\n` +
            `  "type": "GROUP",\n` +
            `  "code": "グループコード",\n` +
            `  "label": "グループ名",\n` +
            `  "layout": [] // ここに行要素を配置\n` +
            `}`
        );
    }
    
    // フィールド追加時には label プロパティが必須だが、
    // レイアウト更新時には label プロパティを省略する必要があるため、
    // ここではチェックを行わない
    
    // openGroup プロパティが指定されていない場合は true を設定
    // kintoneの仕様では省略すると false になるが、このMCP Serverでは明示的に true を設定
    if (group.openGroup === undefined) {
        group.openGroup = true;
        logLayoutWarning(`GROUP要素 "${group.code}" の openGroup プロパティが指定されていません。自動的に true を設定します。`, { groupCode: group.code });
    }
    
    // layout プロパティが存在しない場合は空の配列を設定
    if (group.layout === undefined) {
        group.layout = [];
        logLayoutWarning(`GROUP要素 "${group.code}" に layout プロパティが指定されていません。空の配列を設定します。`, { groupCode: group.code });
    }
    
    // layout プロパティが配列でない場合は配列に変換
    if (!Array.isArray(group.layout)) {
        logLayoutWarning(`GROUP要素 "${group.code}" の layout プロパティが配列ではありません。自動的に配列に変換します。`, { groupCode: group.code });
        group.layout = [group.layout];
    }
    
    // グループ内の各レイアウト要素を検証
    group.layout.forEach((item, index) => {
        validateLayoutElementType(item, ["ROW"]);
        
        // グループ内にはSUBTABLEやGROUPを配置できない制約を追加
        if (item.type === "SUBTABLE") {
            throw new Error(`GROUP要素 "${group.code}" 内にはSUBTABLE要素を配置できません。kintoneの仕様により、グループフィールド内にテーブルを入れることはできません。`);
        }
        
        if (item.type === "GROUP") {
            throw new Error(`GROUP要素 "${group.code}" 内にはGROUP要素を配置できません。kintoneの仕様により、グループフィールド内にグループフィールドを入れることはできません。`);
        }
        
        // 要素タイプに応じた検証
        if (item.type === "ROW") {
            validateRowElement(item);
        } else {
            throw new Error(`GROUP要素 "${group.code}" 内には ROW 要素のみ配置できます。`);
        }
    });
    
    return true;
}

// SUBTABLE要素を検証する関数
export function validateSubtableElement(subtable) {
    validateLayoutElementType(subtable, ["SUBTABLE"]);
    
    if (!subtable.code) {
        throw new Error('SUBTABLE要素には code プロパティが必須です。');
    }
    
    // テーブル内のフィールドを検証（テーブルのフィールド定義を取得できる場合）
    if (subtable.fields) {
        // GROUP要素がテーブル内に含まれていないことを確認
        const hasGroupField = Object.values(subtable.fields).some(field => field.type === "GROUP");
        if (hasGroupField) {
            throw new Error('SUBTABLE要素内にはGROUP要素を配置できません。kintoneの仕様により、グループフィールドはテーブル化できません。');
        }
    }
    
    return true;
}

// フォームレイアウト全体を検証する関数
export function validateFormLayout(layout) {
    if (!Array.isArray(layout)) {
        throw new Error('フォームレイアウトは配列形式で指定する必要があります。');
    }
    
    // 各レイアウト要素を検証
    layout.forEach((item, index) => {
        validateLayoutElementType(item, ["ROW", "GROUP", "SUBTABLE"]);
        
        // 要素タイプに応じた検証
        if (item.type === "ROW") {
            validateRowElement(item);
        } else if (item.type === "GROUP") {
            validateGroupElement(item);
        } else if (item.type === "SUBTABLE") {
            validateSubtableElement(item);
        }
    });
    
    return true;
}

// フィールドサイズを検証する関数
export function validateFieldSize(size) {
    if (!size) return true;
    
    if (typeof size !== 'object') {
        throw new Error('size はオブジェクト形式で指定する必要があります。');
    }
    
    // 幅の検証
    if (size.width !== undefined) {
        // 文字列形式の場合は数値に変換
        if (typeof size.width === 'string') {
            // 数値以外の文字（単位など）を除去して数値のみを抽出
            const numericPart = size.width.replace(/[^0-9.]/g, '');
            const numWidth = Number(numericPart);
            
            if (isNaN(numWidth)) {
                throw new Error('size.width は数値または数値形式の文字列で指定する必要があります。');
            }
            
            // 元の文字列に数値以外の文字が含まれていた場合は警告
            if (size.width !== numericPart) {
                logLayoutWarning(`size.width に単位または数値以外の文字が含まれています。kintoneでは単位の指定はできません。数値部分のみを使用します: "${size.width}" → ${numWidth}`);
            } else {
                logLayoutWarning(`size.width が文字列形式で指定されています。自動的に数値に変換しました: "${size.width}" → ${numWidth}`);
            }
            
            // 数値に変換して置き換え
            size.width = numWidth;
        } else if (typeof size.width !== 'number') {
            throw new Error('size.width は数値または数値形式の文字列で指定する必要があります。');
        }
        
        // 有効な範囲かチェック
        if (size.width <= 0) {
            throw new Error('size.width は正の数値で指定する必要があります。');
        }
    }
    
    // 高さの検証
    if (size.height !== undefined) {
        // 文字列形式の場合は数値に変換
        if (typeof size.height === 'string') {
            // 数値以外の文字（単位など）を除去して数値のみを抽出
            const numericPart = size.height.replace(/[^0-9.]/g, '');
            const numHeight = Number(numericPart);
            
            if (isNaN(numHeight)) {
                throw new Error('size.height は数値または数値形式の文字列で指定する必要があります。');
            }
            
            // 元の文字列に数値以外の文字が含まれていた場合は警告
            if (size.height !== numericPart) {
                logLayoutWarning(`size.height に単位または数値以外の文字が含まれています。kintoneでは単位の指定はできません。数値部分のみを使用します: "${size.height}" → ${numHeight}`);
            } else {
                logLayoutWarning(`size.height が文字列形式で指定されています。自動的に数値に変換しました: "${size.height}" → ${numHeight}`);
            }
            
            // 数値に変換して置き換え
            size.height = numHeight;
        } else if (typeof size.height !== 'number') {
            throw new Error('size.height は数値または数値形式の文字列で指定する必要があります。');
        }
        
        // 有効な範囲かチェック
        if (size.height <= 0) {
            throw new Error('size.height は正の数値で指定する必要があります。');
        }
    }
    
    // 内部高さの検証
    if (size.innerHeight !== undefined) {
        // 文字列形式の場合は数値に変換
        if (typeof size.innerHeight === 'string') {
            // 数値以外の文字（単位など）を除去して数値のみを抽出
            const numericPart = size.innerHeight.replace(/[^0-9.]/g, '');
            const numInnerHeight = Number(numericPart);
            
            if (isNaN(numInnerHeight)) {
                throw new Error('size.innerHeight は数値または数値形式の文字列で指定する必要があります。');
            }
            
            // 元の文字列に数値以外の文字が含まれていた場合は警告
            if (size.innerHeight !== numericPart) {
                logLayoutWarning(`size.innerHeight に単位または数値以外の文字が含まれています。kintoneでは単位の指定はできません。数値部分のみを使用します: "${size.innerHeight}" → ${numInnerHeight}`);
            } else {
                logLayoutWarning(`size.innerHeight が文字列形式で指定されています。自動的に数値に変換しました: "${size.innerHeight}" → ${numInnerHeight}`);
            }
            
            // 数値に変換して置き換え
            size.innerHeight = numInnerHeight;
        } else if (typeof size.innerHeight !== 'number') {
            throw new Error('size.innerHeight は数値または数値形式の文字列で指定する必要があります。');
        }
        
        // 有効な範囲かチェック
        if (size.innerHeight <= 0) {
            throw new Error('size.innerHeight は正の数値で指定する必要があります。');
        }
    }
    
    return true;
}

// レイアウト要素の位置指定を検証する関数
export function validateElementPosition(position) {
    if (!position) return true;
    
    if (typeof position !== 'object') {
        throw new Error('position はオブジェクト形式で指定する必要があります。');
    }
    
    // インデックス指定の検証
    if (position.index !== undefined) {
        if (typeof position.index !== 'number' || position.index < 0) {
            throw new Error('position.index は 0 以上の整数で指定する必要があります。');
        }
        
        // グループ内への挿入の場合
        if (position.type === "GROUP") {
            if (!position.groupCode) {
                throw new Error('グループ内への挿入には position.groupCode の指定が必須です。');
            }
        }
    }
    // 前後指定の検証
    else if (position.after !== undefined || position.before !== undefined) {
        if (position.after !== undefined && position.before !== undefined) {
            throw new Error('position.after と position.before は同時に指定できません。');
        }
        
        const targetCode = position.after || position.before;
        if (!targetCode || typeof targetCode !== 'string') {
            throw new Error('position.after または position.before には有効なフィールドコードを指定する必要があります。');
        }
    }
    
    return true;
}
