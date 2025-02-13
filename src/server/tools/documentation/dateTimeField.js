// src/server/tools/documentation/dateTimeField.js

/**
 * 日時フィールドのドキュメントを取得する関数
 * @returns {string} ドキュメント文字列
 */
export function getDateTimeFieldDocumentation() {
    return `
# 日時フィールド（DATETIME）の仕様

## 概要
日付と時刻を入力するフィールドです。カレンダーから日付を選択し、時・分を指定できます。会議日時、予約日時、イベント開始時刻など、日付と時刻の両方が必要なデータを扱うのに適しています。

## 主要なプロパティ
1. \`unique\`: 重複を禁止するかどうか（true/false、省略可）
   - trueの場合、アプリ内で同じ値を持つレコードを作成できません
2. \`defaultValue\`: 初期値（省略可）
   - "YYYY-MM-DDTHH:MM:SS": 特定の日時（例: "2023-01-31T09:30:00"）
3. \`defaultNowValue\`: レコード作成時に現在の日時を自動設定するかどうか（true/false、省略可）
   - trueの場合、レコード作成時に自動的に現在の日時が設定されます
   - 現在の日時を初期値として設定したい場合はこのプロパティを使用します

## 日時フィールドの特徴

- カレンダーUIから日付を選択し、時刻も指定できます
- 日時の表示形式は、kintoneの設定に従います（例：YYYY/MM/DD HH:MM）
- 日時の範囲検索や並べ替えが可能です
- 計算フィールドで日時計算に使用できます
- 日付と時刻の両方の情報を含みます

## 使用例

### 基本的な日時フィールド
\`\`\`json
{
  "type": "DATETIME",
  "code": "meeting_datetime",
  "label": "会議日時",
  "required": true,
  "unique": false,
  "defaultValue": ""
}
\`\`\`

### 現在の日時をデフォルト値とする日時フィールド
\`\`\`json
{
  "type": "DATETIME",
  "code": "created_datetime",
  "label": "作成日時",
  "required": true,
  "defaultNowValue": true
}
\`\`\`

### 特定の日時をデフォルト値とする日時フィールド
\`\`\`json
{
  "type": "DATETIME",
  "code": "event_start",
  "label": "イベント開始",
  "defaultValue": "2023-04-01T10:00:00"
}
\`\`\`

## 応用例

### 予約システムでの使用
予約システムなどで開始日時と終了日時を設定する場合：

\`\`\`json
// 予約開始日時
{
  "type": "DATETIME",
  "code": "reservation_start",
  "label": "予約開始",
  "required": true
}

// 予約終了日時
{
  "type": "DATETIME",
  "code": "reservation_end",
  "label": "予約終了",
  "required": true
}
\`\`\`

## 注意事項
1. defaultValueに日時を指定する場合は、YYYY-MM-DDTHH:MM:SS形式（例: 2023-01-31T09:30:00）で指定します
2. 現在の日時を初期値にする場合は、defaultNowValueをtrueに設定します
3. defaultValueとdefaultNowValueの両方を指定した場合、defaultNowValueが優先されます
4. defaultNowValueはレコード作成時のみ機能し、レコード編集時には適用されません
5. 日時フィールドには日付と時刻の両方の情報が含まれます
6. 日時の範囲検証（最小日時や最大日時）はAPIでは直接サポートされていません
7. 日時の表示形式はkintoneのシステム設定に依存します
8. タイムゾーンの扱いに注意が必要です（kintoneはユーザーのタイムゾーン設定に基づいて表示します）

## 関連情報
- 日付のみを記録する場合は、DATEフィールドを使用してください
- 時刻のみを記録する場合は、TIMEフィールドを使用してください
- 日時の計算や比較を行う場合は、CALCフィールドと組み合わせて使用できます
`;
}
