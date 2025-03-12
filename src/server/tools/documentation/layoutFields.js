// src/server/tools/documentation/layoutFields.js

/**
 * レイアウト関連フィールド（LAYOUT, FORM_LAYOUT）のドキュメントを取得する
 * @param {string} fieldType - フィールドタイプ
 * @returns {string} ドキュメント文字列
 */
export function getLayoutFieldDocumentation(fieldType) {
  if (fieldType !== "LAYOUT" && fieldType !== "FORM_LAYOUT") {
    return `フィールドタイプ ${fieldType} のドキュメントは現在提供されていません。`;
  }
  
  return `
# フォームレイアウトの仕様

## 概要
kintoneのフォームレイアウトは、フィールドの配置や表示方法を定義します。
レイアウトは複数の要素（ROW, GROUP, SUBTABLE）から構成され、階層構造を持ちます。

## レイアウト要素の種類

### ROW（行）要素
行要素は、複数のフィールド要素を横に並べるためのコンテナです。

\`\`\`json
{
  "type": "ROW",
  "fields": [
    {
      "type": "SINGLE_LINE_TEXT", // 実際のフィールドタイプ（NUMBER, SINGLE_LINE_TEXT など）
      "code": "field_code",
      "size": {
        "width": 100
      }
    },
    {
      "type": "LABEL",
      "value": "ラベルテキスト"
    }
  ]
}
\`\`\`

### GROUP（グループ）要素
グループ要素は、複数の行要素をグループ化し、折りたたみ可能なセクションを作成します。

\`\`\`json
{
  "type": "GROUP",
  "code": "group_code",
  "label": "グループ名",
  "openGroup": true,
  "layout": [
    {
      "type": "ROW",
      "fields": [
        {
          "type": "SINGLE_LINE_TEXT", // 実際のフィールドタイプを指定
          "code": "field_in_group"
        }
      ]
    }
  ]
}
\`\`\`

### SUBTABLE（テーブル）要素
テーブルフィールドをレイアウトに配置するための要素です。

\`\`\`json
{
  "type": "SUBTABLE",
  "code": "subtable_code"
}
\`\`\`

### フィールド要素
行内に配置される各種要素です。

#### FIELD（フィールド）
通常のフィールドを配置します。

\`\`\`json
{
  "type": "SINGLE_LINE_TEXT", // 実際のフィールドタイプを指定
  "code": "field_code",
  "size": {
    "width": 150,
    "height": 42
  }
}
\`\`\`

#### LABEL（ラベル）
テキストラベルを表示します。

\`\`\`json
{
  "type": "LABEL",
  "value": "セクションタイトル"
}
\`\`\`

#### SPACER（スペース）
空白スペースを挿入します。

\`\`\`json
{
  "type": "SPACER",
  "elementId": "spacer1"
}
\`\`\`

#### HR（罫線）
水平線を挿入します。

\`\`\`json
{
  "type": "HR",
  "elementId": "hr1"
}
\`\`\`

#### REFERENCE_TABLE（関連テーブル）
関連テーブルフィールドを配置します。

\`\`\`json
{
  "type": "REFERENCE_TABLE",
  "code": "reference_table_code"
}
\`\`\`

## サイズ指定
フィールド要素のサイズは size プロパティで指定できます。

\`\`\`json
"size": {
  "width": 150,    // 幅
  "height": 42,    // 高さ
  "innerHeight": 100  // 内部高さ（リッチエディタなど）
}
\`\`\`

## 使用例
\`\`\`json
[
  {
    "type": "ROW",
    "fields": [
      {
            "type": "SINGLE_LINE_TEXT", // 実際のフィールドタイプを指定
            "code": "title",
            "size": {
              "width": 100
            }
      }
    ]
  },
  {
    "type": "GROUP",
    "code": "customer_info",
    "label": "顧客情報",
    "openGroup": true,
    "layout": [
      {
        "type": "ROW",
        "fields": [
          {
            "type": "SINGLE_LINE_TEXT", // 実際のフィールドタイプを指定
            "code": "customer_name"
          },
          {
            "type": "SINGLE_LINE_TEXT", // 実際のフィールドタイプを指定
            "code": "customer_email"
          }
        ]
      }
    ]
  },
  {
    "type": "SUBTABLE",
    "code": "items"
  }
]
\`\`\`

## 注意事項
1. レイアウト要素は階層構造を持ち、トップレベルには ROW, GROUP, SUBTABLE 要素のみ配置できます。
2. ROW 要素内には FIELD, LABEL, SPACER, HR, REFERENCE_TABLE 要素のみ配置できます。
3. GROUP 要素内には ROW, GROUP, SUBTABLE 要素を配置できます。
4. フィールドコードは実際に存在するフィールドのコードと一致している必要があります。
5. width、height、innerHeightには数値のみ指定可能です（pxや%などの単位は使用できません）。
6. レイアウトの更新は update_form_layout ツールを使用します。
`;
}
