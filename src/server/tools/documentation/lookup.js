// src/server/tools/documentation/lookup.js
import { LOOKUP_FIELD_MIN_WIDTH } from '../../../constants.js';

/**
 * ルックアップフィールドのドキュメントを取得する関数
 * @returns {string} ドキュメント文字列
 */
export function getLookupDocumentation() {
    return `
# LOOKUP（ルックアップ）フィールドの仕様

## 概要
ルックアップフィールドは、他のkintoneアプリのレコードを参照し、その値を自動的に取得するフィールドです。ユーザーが参照先のレコードを選択すると、関連するフィールドの値が自動的にコピーされます。

## 重要な注意点
ルックアップフィールドは、実際には基本的なフィールドタイプ（SINGLE_LINE_TEXT、NUMBERなど）に、lookup属性を追加したものです。
フィールドタイプとして "LOOKUP" を指定するのではなく、適切な基本タイプを指定し、その中にlookupプロパティを設定します。

## 主要なプロパティ
1. \`type\`: 基本的なフィールドタイプ（"SINGLE_LINE_TEXT"など）
2. \`lookup\` オブジェクト（必須）:
   - \`relatedApp\`: 参照先アプリの情報
     - \`app\`: 参照先アプリのID（数値または文字列）
     - \`code\`: 参照先アプリのコード（文字列）
     ※ \`app\`と\`code\`のどちらか一方が必須。両方指定した場合は\`code\`が優先されます。
   - \`relatedKeyField\`: 参照先アプリのキーフィールドコード（必須）
   - \`fieldMappings\`: フィールドマッピングの配列（必須）
     - \`field\`: このアプリ側のフィールドコード
     - \`relatedField\`: 参照先アプリのフィールドコード
     - 注意: ルックアップのキーフィールド自体はマッピングに含めないでください
   - \`lookupPickerFields\`: ルックアップピッカーに表示するフィールドコードの配列（推奨）
   - \`filterCond\`: 参照先レコードの絞り込み条件（クエリ形式、省略可）
   - \`sort\`: 参照先レコードのソート条件（クエリ形式、推奨）
3. \`required\`: 必須フィールドかどうか（true/false、省略可）

## ルックアップの仕組み

1. **参照先アプリの指定**:
   - 参照先のkintoneアプリを指定します（アプリIDまたはアプリコード）
   - 参照先アプリは運用環境にデプロイされている必要があります

2. **キーフィールドの指定**:
   - 参照先アプリのどのフィールドを検索キーとして使用するかを指定します
   - 通常は一意性のあるフィールド（レコード番号、コード番号など）を使用します

3. **フィールドマッピング**:
   - 参照先アプリのどのフィールドの値を、このアプリのどのフィールドにコピーするかを指定します
   - 複数のフィールドをマッピングできます
   - マッピング先のフィールドは事前に作成しておく必要があります

4. **ルックアップピッカー**:
   - ユーザーがルックアップフィールドをクリックすると表示される検索ダイアログ
   - 表示するフィールドを指定できます（lookupPickerFields）
   - 絞り込み条件やソート順も指定できます

## 使用例

### 基本的な顧客情報ルックアップ
\`\`\`json
{
  "type": "SINGLE_LINE_TEXT",
  "code": "customer_lookup",
  "label": "顧客検索",
  "required": true,
  "lookup": {
    "relatedApp": {
      "app": "123",
      "code": "customers"
    },
    "relatedKeyField": "customer_id",
    "fieldMappings": [
      {
        "field": "customer_name",
        "relatedField": "name"
      },
      {
        "field": "customer_email",
        "relatedField": "email"
      },
      {
        "field": "customer_phone",
        "relatedField": "phone"
      }
    ],
    "lookupPickerFields": ["customer_id", "name", "email", "phone"],
    "filterCond": "status = \\"active\\"",
    "sort": "name asc"
  }
}
\`\`\`

### 商品情報ルックアップ（価格自動計算）
\`\`\`json
{
  "type": "SINGLE_LINE_TEXT",
  "code": "product_lookup",
  "label": "商品検索",
  "lookup": {
    "relatedApp": {
      "code": "products"
    },
    "relatedKeyField": "product_code",
    "fieldMappings": [
      {
        "field": "product_name",
        "relatedField": "name"
      },
      {
        "field": "unit_price",
        "relatedField": "price"
      },
      {
        "field": "stock",
        "relatedField": "available_stock"
      }
    ],
    "lookupPickerFields": ["product_code", "name", "price", "available_stock", "category"],
    "filterCond": "available_stock > 0",
    "sort": "category asc, name asc"
  }
}
\`\`\`

## 応用例

### 複数のルックアップを連携させる
複数のルックアップフィールドを連携させることで、階層的なデータ参照が可能になります。
例えば、「部門」→「プロジェクト」→「タスク」という階層構造を実現できます。

1. 部門ルックアップフィールドを作成
2. プロジェクトルックアップフィールドを作成し、filterCondで部門IDを参照
   \`\`\`
   "filterCond": "department_id = \\"" & department_lookup & "\\""
   \`\`\`
3. タスクルックアップフィールドを作成し、filterCondでプロジェクトIDを参照

### 計算フィールドとの連携
ルックアップフィールドで取得した値を計算フィールドで利用できます。
例えば、商品の単価と数量から合計金額を計算する場合：

\`\`\`
unit_price * quantity
\`\`\`

## 注意事項
1. ルックアップフィールドを設定する前に、マッピング先となるフィールドが事前に作成されている必要があります。
2. マッピング先のフィールドは、参照先フィールドと互換性のある型である必要があります。
3. 参照先アプリが存在し、指定したフィールドが存在することを確認してください。
4. 参照先アプリは運用環境にデプロイされている必要があります。プレビュー環境のアプリは参照できません。
5. ルックアップフィールドの値が変更されると、マッピングされたフィールドの値も自動的に更新されます。
6. ルックアップフィールドの作成は create_lookup_field ツールを使用すると簡単です。
7. ルックアップのキーフィールド自体はフィールドマッピングに含めないでください。
8. lookupPickerFieldsとsortは省略可能ですが、指定することを強く推奨します。
9. ルックアップフィールドは「取得」と「クリア」のリンクが表示されるため、通常のフィールドよりも幅を広めに設定することをお勧めします。このMCP Serverでは最小幅（` + LOOKUP_FIELD_MIN_WIDTH + `）を自動的に設定します。

## 関連情報
- ルックアップフィールドは、関連レコードリストフィールドや関連テーブルフィールドと組み合わせて使用することで、より高度なデータ連携が可能になります。
`;
}
