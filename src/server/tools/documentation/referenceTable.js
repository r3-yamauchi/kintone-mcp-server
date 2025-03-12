// src/server/tools/documentation/referenceTable.js

/**
 * 関連テーブルフィールドのドキュメントを取得する関数
 * @returns {string} ドキュメント文字列
 */
export function getReferenceTableDocumentation() {
    return `
# 関連テーブル（REFERENCE_TABLE）の仕様

## 概要
関連テーブルは、他のkintoneアプリのレコードを参照して表示するフィールドです。日本語では「関連テーブル」と呼ばれます。

## 必須パラメータ
1. \`referenceTable\` オブジェクト:
   - \`relatedApp\`: 参照先アプリの情報
     - \`app\`: 参照先アプリのID（数値または文字列）
     - \`code\`: 参照先アプリのコード（文字列）
     ※ \`app\`と\`code\`のどちらか一方が必須。両方指定した場合は\`code\`が優先されます。
   - \`condition\`: 関連付け条件
     - \`field\`: このアプリのフィールドコード
     - \`relatedField\`: 参照するアプリのフィールドコード

## オプションパラメータ
1. \`filterCond\`: 参照するレコードの絞り込み条件（クエリ形式、例: "数値_0 > 10 and 数値_1 > 20"）
2. \`displayFields\`: 表示するフィールドのコード配列（例: ["表示するフィールド_0", "表示するフィールド_1"]）
3. \`sort\`: ソート条件（クエリ形式、例: "數值_0 desc, 數值_1 asc"）
4. \`size\`: 一度に表示する最大レコード数（1, 3, 5, 10, 20, 30, 40, 50のいずれか）

## 使用例
\`\`\`json
{
  "type": "REFERENCE_TABLE",
  "code": "関連レコード一覧",
  "label": "関連レコード一覧",
  "noLabel": true,
  "referenceTable": {
    "relatedApp": {
      "app": "3",
      "code": "参照先アプリ"
    },
    "condition": {
      "field": "このアプリのフィールド",
      "relatedField": "参照するアプリのフィールド"
    },
    "filterCond": "数値_0 > 10 and 数値_1 > 20",
    "displayFields": ["表示するフィールド_0", "表示するフィールド_1"],
    "sort": "數值_0 desc, 數值_1 asc",
    "size": "5"
  }
}
\`\`\`

## 注意事項
1. 関連テーブルはフォームレイアウト上では特別な扱いを受けます。
2. レイアウト要素としては、ROW内のフィールド要素として配置します（type: "REFERENCE_TABLE"）。
3. フォームレイアウトのGROUP（グループ）内に関連テーブルを配置することはできません。
`;
}
