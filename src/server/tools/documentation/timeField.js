// src/server/tools/documentation/timeField.js

/**
 * 時刻フィールドのドキュメントを取得する関数
 * @returns {string} ドキュメント文字列
 */
export function getTimeFieldDocumentation() {
    return `
# 時刻フィールド（TIME）の仕様

## 概要
時刻を入力するフィールドです。時・分を選択できます。開始時刻、終了時刻、営業時間など、時刻データを扱うのに適しています。

## 主要なプロパティ
1. \`unique\`: 重複を禁止するかどうか（true/false、省略可）
   - trueの場合、アプリ内で同じ値を持つレコードを作成できません
2. \`defaultValue\`: 初期値（省略可）
   - "HH:MM": 特定の時刻（例: "09:30"）
3. \`defaultNowValue\`: レコード作成時に現在の時刻を自動設定するかどうか（true/false、省略可）
   - trueの場合、レコード作成時に自動的に現在の時刻が設定されます
   - 現在の時刻を初期値として設定したい場合はこのプロパティを使用します

## 時刻フィールドの特徴

- 時刻選択UIから時・分を選択できます
- 時刻の表示形式は、kintoneの設定に従います（例：HH:MM）
- 時刻の範囲検索や並べ替えが可能です
- 計算フィールドで時刻計算に使用できます
- 日付情報は含まれません（日付も必要な場合はDATETIMEフィールドを使用）

## 使用例

### 基本的な時刻フィールド
\`\`\`json
{
  "type": "TIME",
  "code": "start_time",
  "label": "開始時刻",
  "required": true,
  "unique": false,
  "defaultValue": "09:00"
}
\`\`\`

### 現在時刻をデフォルト値とする時刻フィールド
\`\`\`json
{
  "type": "TIME",
  "code": "check_in_time",
  "label": "チェックイン時刻",
  "required": true,
  "defaultNowValue": true
}
\`\`\`

### 特定の時刻をデフォルト値とする時刻フィールド
\`\`\`json
{
  "type": "TIME",
  "code": "meeting_time",
  "label": "会議時刻",
  "defaultValue": "13:30"
}
\`\`\`

## 応用例

### 時間範囲の設定
期間を指定する場合は、開始時刻と終了時刻の2つのフィールドを使用します：

\`\`\`json
// 開始時刻フィールド
{
  "type": "TIME",
  "code": "start_time",
  "label": "開始時刻",
  "required": true,
  "defaultValue": "09:00"
}

// 終了時刻フィールド
{
  "type": "TIME",
  "code": "end_time",
  "label": "終了時刻",
  "required": true,
  "defaultValue": "17:30"
}
\`\`\`

### 営業時間の設定
営業時間や受付時間などを設定する場合：

\`\`\`json
// 営業開始時間
{
  "type": "TIME",
  "code": "business_hours_start",
  "label": "営業開始",
  "defaultValue": "10:00"
}

// 営業終了時間
{
  "type": "TIME",
  "code": "business_hours_end",
  "label": "営業終了",
  "defaultValue": "19:00"
}
\`\`\`

## 注意事項
1. defaultValueに時刻を指定する場合は、HH:MM形式（例: 09:30）で指定します
2. 現在の時刻を初期値にする場合は、defaultNowValueをtrueに設定します
3. defaultValueとdefaultNowValueの両方を指定した場合、defaultNowValueが優先されます
4. defaultNowValueはレコード作成時のみ機能し、レコード編集時には適用されません
5. 時刻フィールドには日付情報は含まれません
6. 時刻の範囲検証（最小時刻や最大時刻）はAPIでは直接サポートされていません
7. 時刻の表示形式はkintoneのシステム設定に依存します
8. 秒単位の時刻は指定できません（時・分のみ）

## 関連情報
- 日付も含めて記録する必要がある場合は、DATETIMEフィールドを使用してください
- 日付のみを記録する場合は、DATEフィールドを使用してください
- 時刻の計算や比較を行う場合は、CALCフィールドと組み合わせて使用できます
`;
}
