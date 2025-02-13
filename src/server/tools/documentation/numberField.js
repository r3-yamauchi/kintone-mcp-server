// src/server/tools/documentation/numberField.js

/**
 * 数値フィールドのドキュメントを取得する関数
 * @returns {string} ドキュメント文字列
 */
export function getNumberFieldDocumentation() {
    return `
# 数値フィールド（NUMBER）の仕様

## 概要
数値を入力するフィールドです。整数や小数を扱うことができます。金額、数量、割合など、数値データを扱うのに適しています。

## 主要なプロパティ
1. \`maxValue\`: 最大値（省略可）
   - 入力可能な最大値を指定します
   - 文字列型の数値で指定します（例："1000000"）
2. \`minValue\`: 最小値（省略可）
   - 入力可能な最小値を指定します
   - 文字列型の数値で指定します（例："0"）
3. \`unique\`: 重複を禁止するかどうか（true/false、省略可）
   - trueの場合、アプリ内で同じ値を持つレコードを作成できません
4. \`defaultValue\`: 初期値（省略可）
   - レコード作成時にデフォルトで表示される値を指定します
   - 文字列型の数値で指定します（例："0"）
5. \`digit\`: 桁区切り表示するかどうか（true/false、省略可）
   - trueの場合、3桁ごとにカンマ区切りで表示されます（例：1,234,567）
6. \`unit\`: 単位（省略可）
   - 数値の単位を指定します（例："円"、"%"、"kg"など）
7. \`unitPosition\`: 単位の表示位置（"BEFORE"または"AFTER"、省略時は"BEFORE"）
   - "BEFORE"：単位を数値の前に表示（例：$100）
   - "AFTER"：単位を数値の後に表示（例：100円）
8. \`displayScale\`: 小数点以下の表示桁数（0-10の整数、省略可）
   - 小数点以下の表示桁数を指定します（例："2"で小数点以下2桁まで表示）
   - 文字列型の数値で指定します

## 数値フィールドの特徴

- 数値のみ入力可能（文字列は入力できません）
- 計算フィールドの入力値として使用できます
- 集計や並べ替えが可能です
- 桁区切り表示や単位表示のカスタマイズが可能です
- 最大値・最小値による入力制限が可能です

## 使用例

### 基本的な数値フィールド
\`\`\`json
{
  "type": "NUMBER",
  "code": "quantity",
  "label": "数量",
  "required": true,
  "defaultValue": "1",
  "displayScale": "0"
}
\`\`\`

### 金額フィールド（桁区切りと単位あり）
\`\`\`json
{
  "type": "NUMBER",
  "code": "price",
  "label": "価格",
  "required": true,
  "minValue": "0",
  "maxValue": "1000000",
  "defaultValue": "0",
  "digit": true,
  "unit": "円",
  "unitPosition": "AFTER",
  "displayScale": "0"
}
\`\`\`

### 割合フィールド（小数点あり）
\`\`\`json
{
  "type": "NUMBER",
  "code": "discount_rate",
  "label": "割引率",
  "minValue": "0",
  "maxValue": "100",
  "defaultValue": "0",
  "unit": "%",
  "unitPosition": "AFTER",
  "displayScale": "2"
}
\`\`\`

### 通貨フィールド（単位が前）
\`\`\`json
{
  "type": "NUMBER",
  "code": "dollar_amount",
  "label": "金額（ドル）",
  "digit": true,
  "unit": "$",
  "unitPosition": "BEFORE",
  "displayScale": "2"
}
\`\`\`

## 応用例

### 範囲制限付き数値フィールド
評価点など、特定の範囲内の数値のみを許可する場合：

\`\`\`json
{
  "type": "NUMBER",
  "code": "rating",
  "label": "評価（1-5）",
  "required": true,
  "minValue": "1",
  "maxValue": "5",
  "defaultValue": "3",
  "displayScale": "0"
}
\`\`\`

### 計算フィールドとの連携
数値フィールドは計算フィールドと組み合わせて使用できます：

\`\`\`json
// 数量フィールド
{
  "type": "NUMBER",
  "code": "quantity",
  "label": "数量",
  "defaultValue": "1",
  "displayScale": "0"
}

// 単価フィールド
{
  "type": "NUMBER",
  "code": "unit_price",
  "label": "単価",
  "digit": true,
  "unit": "円",
  "displayScale": "0"
}

// 小計を計算するフィールド
{
  "type": "CALC",
  "code": "subtotal",
  "label": "小計",
  "expression": "quantity * unit_price",
  "format": "NUMBER",
  "digit": true,
  "unit": "円",
  "displayScale": "0"
}
\`\`\`

## 注意事項
1. maxValue、minValue、displayScaleは文字列型の数値で指定します（例："100"）
2. maxValueはminValueより大きい値を指定する必要があります
3. displayScaleは0から10までの整数で指定します
4. unitPositionは"BEFORE"（単位を前に表示）または"AFTER"（単位を後に表示）のいずれかを指定します
5. 数値フィールドに文字列を入力することはできません
6. 大きな数値を扱う場合は、数値の制限に注意してください
7. 計算や比較を行う場合、数値は文字列として保存されていることに注意してください

## 関連情報
- 計算が必要な場合は、CALCフィールドと組み合わせて使用してください
- 通貨を扱う場合は、digit=trueを設定して桁区切り表示を有効にすることをお勧めします
- 小数点以下の精度が重要な場合は、displayScaleを適切に設定してください
`;
}
