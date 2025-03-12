// src/server/tools/documentation/dateField.js

/**
 * 日付フィールドのドキュメントを取得する関数
 * @returns {string} ドキュメント文字列
 */
export function getDateFieldDocumentation() {
    return `
# 日付フィールド（DATE）の仕様

## 概要
日付を入力するフィールドです。カレンダーから日付を選択できます。誕生日、締切日、予定日など、日付データを扱うのに適しています。

## 主要なプロパティ
1. \`unique\`: 重複を禁止するかどうか（true/false、省略可）
   - trueの場合、アプリ内で同じ値を持つレコードを作成できません
2. \`defaultValue\`: 初期値（省略可）
   - "YYYY-MM-DD": 特定の日付（例: "2023-01-31"）
3. \`defaultNowValue\`: レコード作成時に現在の日付を自動設定するかどうか（true/false、省略可）
   - trueの場合、レコード作成時に自動的に現在の日付が設定されます
   - 現在の日付を初期値として設定したい場合はこのプロパティを使用します

## 日付フィールドの特徴

- カレンダーUIから日付を選択できます
- 日付の表示形式は、kintoneの設定に従います（例：YYYY/MM/DD）
- 日付の範囲検索や並べ替えが可能です
- 計算フィールドで日付計算に使用できます
- 時刻情報は含まれません（時刻も必要な場合はDATETIMEフィールドを使用）

## 使用例

### 基本的な日付フィールド
\`\`\`json
{
  "type": "DATE",
  "code": "birthday",
  "label": "誕生日",
  "required": true,
  "unique": false,
  "defaultValue": ""
}
\`\`\`

### 今日の日付をデフォルト値とする日付フィールド
\`\`\`json
{
  "type": "DATE",
  "code": "registration_date",
  "label": "登録日",
  "required": true,
  "defaultNowValue": true
}
\`\`\`

### 特定の日付をデフォルト値とする日付フィールド
\`\`\`json
{
  "type": "DATE",
  "code": "start_date",
  "label": "開始日",
  "defaultValue": "2023-04-01"
}
\`\`\`

## 応用例

### 期限日の設定
プロジェクト管理などで期限日を設定する場合：

\`\`\`json
{
  "type": "DATE",
  "code": "due_date",
  "label": "期限日",
  "required": true
}
\`\`\`

### 日付範囲の設定
期間を指定する場合は、開始日と終了日の2つのフィールドを使用します：

\`\`\`json
// 開始日フィールド
{
  "type": "DATE",
  "code": "start_date",
  "label": "開始日",
  "required": true
}

// 終了日フィールド
{
  "type": "DATE",
  "code": "end_date",
  "label": "終了日",
  "required": true
}
\`\`\`

## 注意事項
1. defaultValueに日付を指定する場合は、YYYY-MM-DD形式（例: 2023-01-31）で指定します
2. 現在の日付を初期値にする場合は、defaultNowValueをtrueに設定します
3. defaultValueとdefaultNowValueの両方を指定した場合、defaultNowValueが優先されます
4. defaultNowValueはレコード作成時のみ機能し、レコード編集時には適用されません
5. 日付フィールドには時刻情報は含まれません
6. 日付の範囲検証（最小日付や最大日付）はAPIでは直接サポートされていません
7. 日付の表示形式はkintoneのシステム設定に依存します

## 関連情報
- 時刻も含めて記録する必要がある場合は、DATETIMEフィールドを使用してください
- 時刻のみを記録する場合は、TIMEフィールドを使用してください
- 日付の計算や比較を行う場合は、CALCフィールドと組み合わせて使用できます
`;
}
