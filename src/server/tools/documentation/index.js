// src/server/tools/documentation/index.js

// 各ドキュメントファイルからインポート
import { getTextFieldDocumentation } from './textFields.js';
import { getNumberFieldDocumentation } from './numberField.js';
import { getDateFieldDocumentation } from './dateField.js';
import { getTimeFieldDocumentation } from './timeField.js';
import { getDateTimeFieldDocumentation } from './dateTimeField.js';
import { getRichTextDocumentation } from './richText.js';
import { getFileFieldDocumentation } from './fileField.js';
import { getUserSelectDocumentation } from './userSelect.js';
import { getSubtableDocumentation } from './subtable.js';
import { getCalcFieldDocumentation } from './calcField.js';
import { getChoiceFieldDocumentation } from './choiceFields.js';
import { getLinkFieldDocumentation } from './linkField.js';
import { getLookupDocumentation } from './lookup.js';
import { getReferenceTableDocumentation } from './referenceTable.js';
import { getSystemFieldDocumentation } from './systemFields.js';
import { getLayoutFieldDocumentation, groupElementStructure } from './layoutFields.js';
import { getQueryLanguageDocumentation } from './queryLanguage.js';

// 再エクスポート
export {
    getTextFieldDocumentation,
    getNumberFieldDocumentation,
    getDateFieldDocumentation,
    getTimeFieldDocumentation,
    getDateTimeFieldDocumentation,
    getRichTextDocumentation,
    getFileFieldDocumentation,
    getUserSelectDocumentation,
    getSubtableDocumentation,
    getCalcFieldDocumentation,
    getChoiceFieldDocumentation,
    getLinkFieldDocumentation,
    getLookupDocumentation,
    getReferenceTableDocumentation,
    getSystemFieldDocumentation,
    getLayoutFieldDocumentation,
    groupElementStructure,
    getQueryLanguageDocumentation
};

/**
 * フィールドタイプに基づいてドキュメントを取得する
 * @param {string} fieldType フィールドタイプ（大文字）
 * @returns {string} ドキュメント文字列
 */
export function getFieldTypeDocumentation(fieldType) {
    switch (fieldType) {
        case 'SINGLE_LINE_TEXT':
        case 'MULTI_LINE_TEXT':
            return getTextFieldDocumentation(fieldType);
        case 'NUMBER':
            return getNumberFieldDocumentation();
        case 'DATE':
            return getDateFieldDocumentation();
        case 'TIME':
            return getTimeFieldDocumentation();
        case 'DATETIME':
            return getDateTimeFieldDocumentation();
        case 'RICH_TEXT':
            return getRichTextDocumentation();
        case 'FILE':
            return getFileFieldDocumentation();
        case 'USER_SELECT':
        case 'GROUP_SELECT':
        case 'ORGANIZATION_SELECT':
            return getUserSelectDocumentation(fieldType);
        case 'SUBTABLE':
        case 'TABLE':
            return getSubtableDocumentation();
        case 'CALC':
            return getCalcFieldDocumentation();
        case 'DROP_DOWN':
        case 'RADIO_BUTTON':
        case 'CHECK_BOX':
        case 'MULTI_SELECT':
            return getChoiceFieldDocumentation(fieldType);
        case 'LINK':
            return getLinkFieldDocumentation();
        case 'LOOKUP':
            // 注意: 実際にはLOOKUPは特別なフィールドタイプではなく、基本タイプに属性を追加したものです
            // このケースは互換性のためと、ドキュメント検索のために残しています
            return getLookupDocumentation();
        case 'REFERENCE_TABLE':
            return getReferenceTableDocumentation();
        case 'RECORD_NUMBER':
        case 'CREATOR':
        case 'MODIFIER':
        case 'CREATED_TIME':
        case 'UPDATED_TIME':
            return getSystemFieldDocumentation();
        case 'LAYOUT':
        case 'FORM_LAYOUT':
        case 'GROUP':
            return getLayoutFieldDocumentation(fieldType);
        default:
            return `# ${fieldType}フィールドのドキュメント\n\n申し訳ありませんが、このフィールドタイプのドキュメントはまだ準備されていません。`;
    }
}

/**
 * 利用可能なフィールドタイプの一覧を取得する
 * @returns {Object} フィールドタイプの一覧（カテゴリ別）
 */
export function getAvailableFieldTypes() {
    return {
        basic: [
            { type: 'SINGLE_LINE_TEXT', name: '1行テキスト' },
            { type: 'MULTI_LINE_TEXT', name: '複数行テキスト' },
            { type: 'RICH_TEXT', name: 'リッチテキスト' },
            { type: 'NUMBER', name: '数値' },
            { type: 'CALC', name: '計算' }
        ],
        selection: [
            { type: 'DROP_DOWN', name: 'ドロップダウン' },
            { type: 'RADIO_BUTTON', name: 'ラジオボタン' },
            { type: 'CHECK_BOX', name: 'チェックボックス' },
            { type: 'MULTI_SELECT', name: '複数選択' }
        ],
        dateTime: [
            { type: 'DATE', name: '日付' },
            { type: 'TIME', name: '時刻' },
            { type: 'DATETIME', name: '日時' }
        ],
        reference: [
            { type: 'USER_SELECT', name: 'ユーザー選択' },
            { type: 'GROUP_SELECT', name: 'グループ選択' },
            { type: 'ORGANIZATION_SELECT', name: '組織選択' },
            // 注意: 実際にはLOOKUPは特別なフィールドタイプではなく、基本タイプに属性を追加したものです
            // ここでは互換性のためと、ドキュメント検索のために残しています
            { type: 'LOOKUP', name: 'ルックアップ' },
            { type: 'REFERENCE_TABLE', name: '関連テーブル' }
        ],
        system: [
            { type: 'RECORD_NUMBER', name: 'レコード番号' },
            { type: 'CREATOR', name: '作成者' },
            { type: 'MODIFIER', name: '更新者' },
            { type: 'CREATED_TIME', name: '作成日時' },
            { type: 'UPDATED_TIME', name: '更新日時' }
        ],
        other: [
            { type: 'LINK', name: 'リンク' },
            { type: 'FILE', name: '添付ファイル' },
            { type: 'SUBTABLE', name: 'テーブル' }
        ]
    };
}

/**
 * フィールドタイプのドキュメントツールの説明を取得する
 * @returns {string} ドキュメントツールの説明
 */
export function getDocumentationToolDescription() {
    return `
# kintoneフィールドタイプドキュメントツール

このツールは、kintoneのフィールドタイプに関する詳細なドキュメントを提供します。
各フィールドタイプの仕様、プロパティ、使用例、応用例、注意事項などを確認できます。

## 重要な注意事項

### フォームレイアウトとフィールドの関係
- **通常のフィールドは、レイアウトに含める前に必ず事前に作成しておく必要があります**
- 存在しないフィールドコードをレイアウトに含めると、エラーが発生します
- システムフィールド（RECORD_NUMBER, CREATOR, MODIFIER, CREATED_TIME, UPDATED_TIME）は事前作成不要です
- レイアウト要素（LABEL, SPACER, HR）も事前作成不要です

### 推奨されるワークフロー
1. \`add_fields\` ツールでフィールドを作成（システムフィールドとレイアウト要素を除く）
2. \`get_form_fields\` ツールで作成されたフィールドを確認
3. \`update_form_layout\` ツールでレイアウトを更新

詳細は \`get_field_type_documentation({ field_type: "LAYOUT" })\` で確認できます。

## 利用可能なフィールドタイプ

### 基本フィールド
- SINGLE_LINE_TEXT（1行テキスト）
- MULTI_LINE_TEXT（複数行テキスト）
- RICH_TEXT（リッチテキスト）
- NUMBER（数値）
- CALC（計算）

### 選択フィールド
- DROP_DOWN（ドロップダウン）
- RADIO_BUTTON（ラジオボタン）
- CHECK_BOX（チェックボックス）
- MULTI_SELECT（複数選択）

### 日付・時刻フィールド
- DATE（日付）
- TIME（時刻）
- DATETIME（日時）

### 参照フィールド
- USER_SELECT（ユーザー選択）
- GROUP_SELECT（グループ選択）
- ORGANIZATION_SELECT（組織選択）
- LOOKUP（ルックアップ）
- REFERENCE_TABLE（関連テーブル）

### システムフィールド
- RECORD_NUMBER（レコード番号）
- CREATOR（作成者）
- MODIFIER（更新者）
- CREATED_TIME（作成日時）
- UPDATED_TIME（更新日時）

### その他のフィールド
- LINK（リンク）
- FILE（添付ファイル）
- SUBTABLE（テーブル）
`;
}

/**
 * フィールド作成ツールの説明を取得する
 * @returns {string} フィールド作成ツールの説明
 */
export function getFieldCreationToolDescription() {
    return `
# kintoneフィールド作成ツール

このツールは、kintoneのフィールドを簡単に作成するためのヘルパー関数を提供します。
各フィールドタイプに特化した関数を使用して、適切なフィールド定義を生成できます。

## 重要な注意事項

### フォームレイアウトとフィールドの関係
- **通常のフィールドは、レイアウトに含める前に必ず事前に作成しておく必要があります**
- フィールド作成ツールで生成したフィールド定義は、必ず \`add_fields\` ツールを使用してkintoneアプリに追加してください
- レイアウト更新前に \`get_form_fields\` ツールを使用して、フィールドの存在を確認することを推奨します
- システムフィールド（RECORD_NUMBER, CREATOR, MODIFIER, CREATED_TIME, UPDATED_TIME）は事前作成不要です
- レイアウト要素（LABEL, SPACER, HR）も事前作成不要です

### 推奨されるワークフロー
1. フィールド作成ツールでフィールド定義を生成
2. \`add_fields\` ツールでフィールドをkintoneアプリに追加
3. \`get_form_fields\` ツールで作成されたフィールドを確認
4. \`update_form_layout\` ツールでレイアウトを更新

## 利用可能なツール

- create_choice_field: 選択肢フィールド（ドロップダウン、ラジオボタン、チェックボックス、複数選択）を作成
- create_lookup_field: ルックアップフィールドを作成
- create_reference_table_field: 関連テーブルフィールドを作成
- create_form_layout: フォームレイアウトを自動生成
- add_layout_element: 既存のフォームレイアウトに要素を追加
- create_group_layout: グループ要素を作成
- create_table_layout: テーブルレイアウトを作成

詳細な使用方法は各ツールのドキュメントを参照してください。
`;
}
