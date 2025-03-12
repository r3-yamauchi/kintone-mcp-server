// src/server/tools/documentation/otherFields.js

/**
 * その他のフィールド（LOOKUP, STATUS, RELATED_RECORDS, LINK など）のドキュメントを取得する
 * @param {string} fieldType - フィールドタイプ
 * @returns {string} ドキュメント文字列
 */
export function getOtherFieldDocumentation(fieldType) {
  switch (fieldType) {
    case "LOOKUP":
      return `
# LOOKUP（ルックアップ）フィールドの仕様

## 概要
ルックアップフィールドは、他のkintoneアプリのレコードを参照し、その値を自動的に取得するフィールドです。ユーザーが参照先のレコードを選択すると、関連するフィールドの値が自動的にコピーされます。

## 主要なプロパティ
1. \`lookup\` オブジェクト（必須）:
   - \`relatedApp\`: 参照先アプリの情報
     - \`app\`: 参照先アプリのID（数値または文字列）
     - \`code\`: 参照先アプリのコード（文字列）
     ※ \`app\`と\`code\`のどちらか一方が必須。両方指定した場合は\`code\`が優先されます。
   - \`relatedKeyField\`: 参照先アプリのキーフィールドコード（必須）
   - \`fieldMappings\`: フィールドマッピングの配列（必須）
     - \`field\`: このアプリ側のフィールドコード
     - \`relatedField\`: 参照先アプリのフィールドコード
   - \`lookupPickerFields\`: ルックアップピッカーに表示するフィールドコードの配列（省略可）
   - \`filterCond\`: 参照先レコードの絞り込み条件（クエリ形式、省略可）
   - \`sort\`: 参照先レコードのソート条件（クエリ形式、省略可）
2. \`required\`: 必須フィールドかどうか（true/false、省略可）

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
  "type": "LOOKUP",
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
  "type": "LOOKUP",
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

## 関連情報
- ルックアップフィールドは、関連レコードリストフィールドや関連テーブルフィールドと組み合わせて使用することで、より高度なデータ連携が可能になります。
`;

    case "STATUS":
      return `
# ステータスフィールド（STATUS）の仕様

## 概要
レコードの状態を管理するフィールドです。プロセス管理と連携して使用します。

## 主要なプロパティ
1. \`states\`: 状態の定義（オブジェクト、必須）
   - キーは状態のID
   - 値は状態の定義オブジェクト（name, index, transitions）
2. \`defaultState\`: 初期状態のID（文字列、省略可）

## 使用例
\`\`\`json
{
  "type": "STATUS",
  "code": "status",
  "label": "ステータス",
  "states": {
    "not_started": {
      "name": "未着手",
      "index": "0"
    },
    "in_progress": {
      "name": "進行中",
      "index": "1",
      "transitions": ["completed", "pending"]
    },
    "pending": {
      "name": "保留中",
      "index": "2",
      "transitions": ["in_progress"]
    },
    "completed": {
      "name": "完了",
      "index": "3"
    }
  },
  "defaultState": "not_started"
}
\`\`\`

## 注意事項
1. ステータスフィールドは通常、システムによって自動的に作成されるため、ユーザーが直接作成することはできません。
2. プロセス管理の設定と連携して使用します。
3. transitions は、その状態から遷移可能な状態のIDの配列です。
4. ステータスフィールドの作成は create_status_field ツールを使用すると簡単です（APIでの作成が可能な場合）。
`;

    case "RELATED_RECORDS":
      return `
# 関連レコードリストフィールド（RELATED_RECORDS）の仕様

## 概要
他のkintoneアプリのレコードを関連付けて表示するフィールドです。

## 主要なプロパティ
1. \`relatedApp\`: 参照先アプリの情報（オブジェクト、必須）
   - \`app\`: 参照先アプリのID（数値または文字列）
   - \`code\`: 参照先アプリのコード（文字列）
   ※ \`app\`と\`code\`のどちらか一方が必須。両方指定した場合は\`code\`が優先されます。
2. \`condition\`: 関連付け条件（オブジェクト、必須）
   - \`field\`: このアプリのフィールドコード
   - \`relatedField\`: 参照先アプリのフィールドコード
3. \`displayFields\`: 表示するフィールドのコード配列（省略可）
4. \`filterCond\`: 参照レコードの絞り込み条件（クエリ形式、省略可）
5. \`sort\`: ソート条件（クエリ形式、省略可）

## 使用例
\`\`\`json
{
  "type": "RELATED_RECORDS",
  "code": "related_tasks",
  "label": "関連タスク",
  "relatedApp": {
    "app": "123",
    "code": "tasks"
  },
  "condition": {
    "field": "project_id",
    "relatedField": "project_id"
  },
  "displayFields": ["task_name", "assignee", "due_date", "status"],
  "filterCond": "status != \\"completed\\"",
  "sort": "due_date asc"
}
\`\`\`

## 注意事項
1. 関連レコードリストフィールドは通常、システムによって自動的に作成されるため、ユーザーが直接作成することはできません。
2. 参照先アプリが存在し、指定したフィールドが存在することを確認してください。
3. 関連レコードリストフィールドの作成は create_related_records_field ツールを使用すると簡単です（APIでの作成が可能な場合）。
`;

    case "LINK":
      return `
# リンクフィールド（LINK）の仕様

## 概要
URLやメールアドレス、電話番号などのリンクを設定するフィールドです。クリックすると、対応するアプリケーションが起動します。

## 主要なプロパティ
1. \`protocol\`: リンクのプロトコル（必須）
   - "WEB": Webサイト（http://, https://）
   - "MAIL": メールアドレス（mailto:）
   - "CALL": 電話番号（tel:）
2. \`defaultValue\`: 初期値（省略可）
3. \`unique\`: 重複を禁止するかどうか（true/false、省略可）
4. \`maxLength\`: 最大文字数（省略可）
5. \`minLength\`: 最小文字数（省略可）

## プロトコル別の特徴

### WEB プロトコル
- Webサイトへのリンクを作成します
- 入力値の先頭に自動的に "http://" または "https://" が付加されます
- 入力値に "http://" または "https://" が含まれる場合は、そのまま使用されます

### MAIL プロトコル
- メールアドレスへのリンクを作成します
- クリックするとメールクライアントが起動し、宛先が入力された状態で新規メール作成画面が開きます
- 入力値の先頭に自動的に "mailto:" が付加されます

### CALL プロトコル
- 電話番号へのリンクを作成します
- モバイルデバイスでクリックすると電話アプリが起動し、番号が入力された状態になります
- 入力値の先頭に自動的に "tel:" が付加されます

## 使用例

### Webサイトリンク
\`\`\`json
{
  "type": "LINK",
  "code": "website",
  "label": "ウェブサイト",
  "noLabel": false,
  "required": false,
  "protocol": "WEB",
  "defaultValue": "https://kintone.cybozu.co.jp/"
}
\`\`\`

### メールアドレスリンク
\`\`\`json
{
  "type": "LINK",
  "code": "email",
  "label": "メールアドレス",
  "noLabel": false,
  "required": false,
  "protocol": "MAIL",
  "defaultValue": "support@example.com"
}
\`\`\`

### 電話番号リンク
\`\`\`json
{
  "type": "LINK",
  "code": "phone",
  "label": "電話番号",
  "noLabel": false,
  "required": false,
  "protocol": "CALL",
  "defaultValue": "03-1234-5678"
}
\`\`\`

## 応用例

### 問い合わせフォームへのリンク
\`\`\`json
{
  "type": "LINK",
  "code": "contact_form",
  "label": "お問い合わせ",
  "protocol": "WEB",
  "defaultValue": "https://example.com/contact?ref=kintone"
}
\`\`\`

### 特定の件名と本文を含むメールリンク
\`\`\`json
{
  "type": "LINK",
  "code": "support_mail",
  "label": "サポート問い合わせ",
  "protocol": "MAIL",
  "defaultValue": "support@example.com?subject=サポート問い合わせ&body=以下の情報を記入してください%0A%0A・お名前：%0A・ご利用のサービス：%0A・お問い合わせ内容："
}
\`\`\`

## 注意事項
1. プロトコルに応じた適切な形式で値を入力する必要があります。
2. WEBプロトコルの場合、URLの形式が正しくないとリンクが機能しない場合があります。
3. MAILプロトコルの場合、メールアドレスの形式が正しくないとリンクが機能しない場合があります。
4. CALLプロトコルの場合、国際電話番号形式（+81-3-1234-5678など）も使用できます。
5. リンクフィールドの作成は create_link_field ツールを使用すると簡単です。

## 関連情報
- リンクフィールドは、フォーム上ではクリック可能なリンクとして表示されます。
- モバイルアプリでは、CALLプロトコルのリンクをタップすると電話アプリが起動します。
- MAILプロトコルのリンクには、クエリパラメータを使用して件名（subject）や本文（body）を指定することができます。
`;

    default:
      return `フィールドタイプ ${fieldType} のドキュメントは現在提供されていません。`;
  }
}
