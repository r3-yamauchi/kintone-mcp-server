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

**重要**: GROUP要素には必ず \`layout\` プロパティを使用してください。\`fields\` プロパティは使用できません。

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

**GROUP要素の正しい構造**:
- \`type\`: "GROUP" を指定
- \`code\`: グループのフィールドコード
- \`label\`: グループの表示名
- \`layout\`: グループ内のレイアウト要素の配列（ROW要素の配列）
- \`openGroup\`: グループを開いた状態で表示するかどうか（true/false）

**よくある間違い**:
- \`fields\` プロパティを使用している（正しくは \`layout\` プロパティを使用）
- \`layout\` プロパティが配列でない
- \`layout\` プロパティが指定されていない

**エラー例**:
\`\`\`json
{
  "type": "GROUP",
  "code": "empty_group",
  "fields": [] // 誤り: fieldsではなくlayoutプロパティを使用する必要があります
}
\`\`\`

**正しい例**:
\`\`\`json
{
  "type": "GROUP",
  "code": "empty_group",
  "label": "空のグループ",
  "layout": [] // 正しい: layoutプロパティを使用
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
空白スペースを挿入します。レイアウトの調整や要素間の間隔を設けるために使用します。

\`\`\`json
{
  "type": "SPACER",
  "elementId": "spacer1",
  "size": {
    "width": 100,
    "height": 30
  }
}
\`\`\`

**注意事項**:
- \`elementId\` は一意の識別子です。指定しない場合は自動生成されます。
- \`size\` プロパティでスペースの幅と高さを指定できます。
- スペース要素はデータを持たず、純粋にレイアウト調整のための視覚的な要素です。
- \`add_fields\` ツールではなく、\`update_form_layout\` または \`add_layout_element\` ツールを使用して追加します。
- \`create_spacer_element\` ツールを使用して簡単に作成できます。

#### HR（罫線）
水平線を挿入します。セクションの区切りや視覚的な分離のために使用します。

\`\`\`json
{
  "type": "HR",
  "elementId": "hr1"
}
\`\`\`

**注意事項**:
- \`elementId\` は一意の識別子です。指定しない場合は自動生成されます。
- 罫線要素はデータを持たず、純粋にレイアウト調整のための視覚的な要素です。
- \`add_fields\` ツールではなく、\`update_form_layout\` または \`add_layout_element\` ツールを使用して追加します。
- \`create_hr_element\` ツールを使用して簡単に作成できます。

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

## 重要な注意事項

### フィールドの事前作成の必要性
- **通常のフィールドは、レイアウトに含める前に必ず事前に作成しておく必要があります**
- 存在しないフィールドコードをレイアウトに含めると、エラーが発生します
- フィールド作成は \`add_fields\` ツールを使用して行ってください
- レイアウト更新前に \`get_form_fields\` ツールを使用して、フィールドの存在を確認することを推奨します

### 事前作成が不要な例外
以下の要素については、事前に作成する必要はありません：

1. **システムフィールド**：
   - RECORD_NUMBER（レコード番号）
   - CREATOR（作成者）
   - MODIFIER（更新者）
   - CREATED_TIME（作成日時）
   - UPDATED_TIME（更新日時）
   これらはkintoneによって自動的に作成されるため、事前作成は不要です。

2. **レイアウト要素**：
   - LABEL（ラベル）
   - SPACER（スペーサー）
   - HR（罫線）
   これらはデータを持たない純粋な視覚的要素であり、フィールドとして作成する必要はありません。

### 推奨されるワークフロー
1. \`add_fields\` ツールでフィールドを作成（システムフィールドとレイアウト要素を除く）
2. \`get_form_fields\` ツールで作成されたフィールドを確認
3. \`update_form_layout\` ツールでレイアウトを更新（システムフィールドとレイアウト要素も含めることができます）

### よくあるエラーと対処法
- エラー: "指定されたフィールドコードが存在しません"
  - 原因: レイアウトに含まれる通常のフィールドコードが実際に存在しない
  - 対処: \`add_fields\` ツールを使用して、該当するフィールドを事前に作成する
  - 注意: システムフィールドやレイアウト要素（LABEL, SPACER, HR）の場合は、このエラーは発生しません

## その他の注意事項
1. レイアウト要素は階層構造を持ち、トップレベルには ROW, GROUP, SUBTABLE 要素のみ配置できます。
2. ROW 要素内には FIELD, LABEL, SPACER, HR, REFERENCE_TABLE 要素のみ配置できます。
   - **重要**: ROW 要素内に SUBTABLE や GROUP 要素を配置することはできません。これらの要素はトップレベルに配置する必要があります。
3. GROUP 要素内には ROW 要素のみ配置できます（GROUP内にGROUPやSUBTABLEは配置できません）。
4. GROUP 要素には必ず \`layout\` プロパティを使用し、\`fields\` プロパティは使用しないでください。
5. フィールドコードは実際に存在するフィールドのコードと一致している必要があります。
6. width、height、innerHeightには数値のみ指定可能です（pxや%などの単位は使用できません）。
7. ルックアップフィールドをフォームに配置する際は 250 以上の幅を明示的に指定してください。
8. レイアウトの更新は \`update_form_layout\` ツールを使用します。

## レイアウト制約と配置ルール

kintoneのフォームレイアウトには以下の制約があります：

### 1. トップレベルに配置可能な要素
- ROW（行）
- GROUP（グループ）
- SUBTABLE（テーブル）

### 2. ROW（行）内に配置可能な要素
- 通常のフィールド（SINGLE_LINE_TEXT, NUMBER, DATE など）
- LABEL（ラベル）
- SPACER（スペーサー）
- HR（水平線）
- REFERENCE_TABLE（関連テーブル）
- **注意**: ROW内にはSUBTABLEやGROUPは配置できません

### 3. GROUP（グループ）内に配置可能な要素
- ROW（行）のみ
- **注意**: GROUP内には別のGROUPやSUBTABLEは配置できません

### 4. SUBTABLE（テーブル）内に配置可能な要素
- 通常のフィールド（SINGLE_LINE_TEXT, NUMBER, DATE など）
- **注意**: SUBTABLE内にはGROUPは配置できません

### 配置ルールの理由
これらの制約はkintoneの仕様によるものです：
- SUBTABLEやGROUPはトップレベルに配置する必要があります
- ROW内にSUBTABLEやGROUPを配置できないのは、行要素が基本的にフィールドを横に並べるための要素であり、複雑な構造を内包できないためです
- GROUP内に別のGROUPやSUBTABLEを配置できないのは、入れ子構造の複雑さを制限するためです

## 自動修正機能

kintoneのフォームレイアウトの制約に違反するレイアウトは、自動的に修正されます：

1. **ROW内のSUBTABLEやGROUPの自動移動**:
   - ROW内にSUBTABLEやGROUPが配置されている場合、これらは自動的にトップレベルに移動されます
   - 移動時には警告メッセージが表示されます

2. **GROUP内のSUBTABLEやGROUPの自動移動**:
   - GROUP内にSUBTABLEやGROUPが配置されている場合、これらも自動的にトップレベルに移動されます
   - 移動時には警告メッセージが表示されます

3. **SUBTABLE内のGROUP要素の自動除外**:
   - SUBTABLE内にGROUP要素が含まれている場合、これらは自動的に除外されます
   - kintoneの仕様により、SUBTABLE内にはGROUP要素を配置できません

この自動修正機能により、レイアウトの制約に違反する設定をしても、エラーが発生せずに処理が続行され、適切なレイアウトが生成されます。ただし、意図したレイアウトと異なる結果になる可能性があるため、警告メッセージに注意してください。
`;
}

/**
 * GROUP要素の構造に関するドキュメントを取得する
 * @returns {Object} ドキュメントオブジェクト
 */
export const groupElementStructure = {
    title: "GROUP要素の構造",
    description: `
# GROUP要素の正しい構造

GROUP要素（グループフィールド）は以下の構造で定義する必要があります：

\`\`\`json
{
  "type": "GROUP",
  "code": "グループコード",
  "label": "グループ名",
  "openGroup": true,
  "layout": [
    {
      "type": "ROW",
      "fields": [
        // フィールド要素
      ]
    }
  ]
}
\`\`\`

## 重要な注意点

- GROUP要素には \`fields\` ではなく \`layout\` プロパティを使用してください
- \`layout\` プロパティには ROW 要素の配列を指定します
- GROUP要素内には別のGROUP要素やSUBTABLE要素を配置できません
- GROUP要素を含む行には他のフィールドを配置できません

## 必須プロパティ

- \`type\`: "GROUP" を指定
- \`code\`: グループのフィールドコード
- \`label\`: グループの表示名
- \`layout\`: グループ内のレイアウト要素の配列

## オプションプロパティ

- \`openGroup\`: グループを開いた状態で表示するかどうか（true/false）
`,
    examples: [
        {
            title: "基本的なGROUP要素",
            code: `
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
          "type": "SINGLE_LINE_TEXT",
          "code": "customer_name",
          "size": { "width": "150" }
        },
        {
          "type": "SINGLE_LINE_TEXT",
          "code": "customer_email",
          "size": { "width": "150" }
        }
      ]
    },
    {
      "type": "ROW",
      "fields": [
        {
          "type": "MULTI_LINE_TEXT",
          "code": "customer_address",
          "size": { "width": "300" }
        }
      ]
    }
  ]
}
`
        },
        {
            title: "空のGROUP要素",
            code: `
{
  "type": "GROUP",
  "code": "empty_group",
  "label": "空のグループ",
  "layout": []
}
`
        },
        {
            title: "よくある間違い（fieldsプロパティを使用）",
            code: `
{
  "type": "GROUP",
  "code": "empty_group",
  "fields": [] // 誤り: fieldsではなくlayoutプロパティを使用する必要があります
}
`
        }
    ]
};
