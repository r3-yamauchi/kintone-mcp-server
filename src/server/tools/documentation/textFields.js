// src/server/tools/documentation/textFields.js

/**
 * 文字列フィールド（1行テキスト、複数行テキスト）のドキュメントを取得する関数
 * @param {string} fieldType フィールドタイプ（大文字）
 * @returns {string} ドキュメント文字列
 */
export function getTextFieldDocumentation(fieldType) {
    return `
# 文字列フィールド（${fieldType}）の仕様

## 概要
${fieldType === "SINGLE_LINE_TEXT" ? 
"1行のテキストを入力するフィールドです。ユーザー名、商品名、コード番号など、単一行のテキストデータを扱うのに適しています。" : 
"複数行のテキストを入力するフィールドです。説明文、備考、コメントなど、長文のテキストデータを扱うのに適しています。"}

## 主要なプロパティ
1. \`maxLength\`: 最大文字数（省略可）
   - 入力可能な最大文字数を指定します
   - 1～64000の範囲で指定可能
2. \`minLength\`: 最小文字数（省略可）
   - 入力必須の最小文字数を指定します
   - 0～64000の範囲で指定可能
3. \`unique\`: 重複を禁止するかどうか（true/false、省略可）
   - trueの場合、アプリ内で同じ値を持つレコードを作成できません
4. \`defaultValue\`: 初期値（省略可）
   - レコード作成時にデフォルトで表示される値を指定します

## フィールドタイプの特徴

### SINGLE_LINE_TEXT（1行テキスト）
- 改行を含まないテキストを入力するためのフィールドです
- 入力欄は1行で表示されます
- Enterキーを押しても改行されません
- 主に短いテキスト情報（名前、タイトル、コードなど）に使用します

### MULTI_LINE_TEXT（複数行テキスト）
- 改行を含むテキストを入力するためのフィールドです
- 入力欄は複数行で表示されます
- Enterキーで改行できます
- 主に長いテキスト情報（説明、備考、コメントなど）に使用します
- リッチテキスト機能は含まれません（書式設定が必要な場合はRICH_TEXTを使用）

## 使用例

### 基本的な1行テキストフィールド
\`\`\`json
{
  "type": "SINGLE_LINE_TEXT",
  "code": "product_name",
  "label": "商品名",
  "noLabel": false,
  "required": true,
  "unique": true,
  "maxLength": "100",
  "minLength": "1",
  "defaultValue": ""
}
\`\`\`

### 基本的な複数行テキストフィールド
\`\`\`json
{
  "type": "MULTI_LINE_TEXT",
  "code": "description",
  "label": "説明",
  "noLabel": false,
  "required": false,
  "unique": false,
  "maxLength": "1000",
  "minLength": "0",
  "defaultValue": "ここに説明を入力してください"
}
\`\`\`

### 文字数制限付きテキストフィールド
\`\`\`json
{
  "type": "SINGLE_LINE_TEXT",
  "code": "postal_code",
  "label": "郵便番号",
  "required": true,
  "maxLength": "8",
  "minLength": "7",
  "defaultValue": ""
}
\`\`\`

### 一意性を持つコードフィールド
\`\`\`json
{
  "type": "SINGLE_LINE_TEXT",
  "code": "employee_id",
  "label": "社員番号",
  "required": true,
  "unique": true,
  "maxLength": "10",
  "defaultValue": ""
}
\`\`\`

## 応用例

### 入力ガイダンス付きフィールド
デフォルト値を使って入力ガイダンスを提供できます。ユーザーが入力を始めると自動的に消えます。

\`\`\`json
{
  "type": "MULTI_LINE_TEXT",
  "code": "feedback",
  "label": "フィードバック",
  "defaultValue": "以下の点についてご意見をお聞かせください：\n1. 使いやすさ\n2. デザイン\n3. 機能性\n4. 改善点"
}
\`\`\`

## 注意事項
1. maxLengthとminLengthは文字列型の数値で指定します（例："100"）
2. maxLengthはminLengthより大きい値を指定する必要があります
3. uniqueをtrueにする場合、既存のレコードとの重複チェックが行われるため、大量のレコードがある場合はパフォーマンスに影響する可能性があります
4. SINGLE_LINE_TEXTフィールドでは、入力された改行は保存時に削除されます
5. 文字数の上限（maxLength）は、SINGLE_LINE_TEXTとMULTI_LINE_TEXTともに最大64000文字ですが、パフォーマンスを考慮して適切な値を設定することをお勧めします

## 関連情報
- 書式付きテキストが必要な場合は、RICH_TEXTフィールドを使用してください
- 数値のみを入力する場合は、NUMBERフィールドを使用することで、数値としての検証や計算が可能になります
- 特定の形式（メールアドレス、URL、電話番号など）のテキストを入力する場合は、LINKフィールドの使用を検討してください
`;
}
