// src/server/tools/documentation/linkField.js

/**
 * リンクフィールドのドキュメントを取得する関数
 * @returns {string} ドキュメント文字列
 */
export function getLinkFieldDocumentation() {
    return `
# リンクフィールド（LINK）の仕様

## 概要
URLを入力し、クリック可能なリンクとして表示するフィールドです。Webサイト、ファイル、メールアドレスなど、外部リソースへのリンクを扱うのに適しています。

## 主要なプロパティ
1. \`protocol\`: プロトコル指定（"WEB", "CALL", "MAIL"のいずれか、省略可）
   - "WEB": Webサイト用（http://, https://）
   - "CALL": 電話番号用（tel:）
   - "MAIL": メールアドレス用（mailto:）
   - 省略時は "WEB" になります
2. \`defaultValue\`: 初期値（文字列、省略可）
   - プロトコルに応じた形式で指定します
   - 例: "https://example.com", "mail@example.com", "0312345678"
3. \`unique\`: 重複を禁止するかどうか（true/false、省略可）
   - trueの場合、アプリ内で同じ値を持つレコードを作成できません

## リンクフィールドの特徴

- クリック可能なリンクとして表示されます
- プロトコルに応じて適切なアクションが実行されます（Webサイト表示、メール作成、電話発信）
- 入力値の形式チェックが行われます
- 表示テキストとURLを別々に設定することができます
- モバイル端末でも適切に動作します（電話番号は通話アプリを起動など）

## 使用例

### 基本的なWebリンク
\`\`\`json
{
  "type": "LINK",
  "code": "website",
  "label": "Webサイト",
  "protocol": "WEB",
  "defaultValue": "https://kintone.cybozu.com/"
}
\`\`\`

### メールアドレスリンク
\`\`\`json
{
  "type": "LINK",
  "code": "email",
  "label": "メールアドレス",
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
  "protocol": "CALL",
  "defaultValue": "0312345678"
}
\`\`\`

### 必須のリンクフィールド
\`\`\`json
{
  "type": "LINK",
  "code": "company_website",
  "label": "会社ウェブサイト",
  "protocol": "WEB",
  "required": true
}
\`\`\`

## 応用例

### 社内システムへのリンク
社内システムへのリンクを設定する例：

\`\`\`json
{
  "type": "LINK",
  "code": "internal_system",
  "label": "社内システム",
  "protocol": "WEB",
  "defaultValue": "https://internal.example.com/system/"
}
\`\`\`

### ドキュメントへのリンク
クラウドストレージ上のドキュメントへのリンクを設定する例：

\`\`\`json
{
  "type": "LINK",
  "code": "document_link",
  "label": "関連ドキュメント",
  "protocol": "WEB",
  "defaultValue": "https://docs.google.com/document/d/xxxxxxxxxxxx/"
}
\`\`\`

### 問い合わせ先情報
問い合わせ先情報をリンクとして設定する例：

\`\`\`json
// メールアドレス
{
  "type": "LINK",
  "code": "contact_email",
  "label": "問い合わせメール",
  "protocol": "MAIL",
  "defaultValue": "contact@example.com"
}

// 電話番号
{
  "type": "LINK",
  "code": "contact_phone",
  "label": "問い合わせ電話",
  "protocol": "CALL",
  "defaultValue": "0312345678"
}
\`\`\`


## 入力形式と検証

### Webリンク（protocol: "WEB"）
- 入力形式: URL形式（http://またはhttps://で始まる文字列）
- 自動補完: プロトコル（http://）が省略された場合、自動的に補完されます
- 例: "example.com" → "http://example.com"

### メールリンク（protocol: "MAIL"）
- 入力形式: メールアドレス形式（xxx@xxx.xxx）
- クリック時: メーラーが起動し、宛先に設定されます
- 例: "contact@example.com"

### 電話リンク（protocol: "CALL"）
- 入力形式: 電話番号形式（数字とハイフン）
- クリック時: 
  - PC: 電話アプリケーション（Skypeなど）が起動
  - モバイル: 通話アプリが起動
- 例: "03-1234-5678" または "0312345678"

## 注意事項
1. protocolに応じて、入力値の形式チェックが行われます
2. Webリンクの場合、プロトコル（http://またはhttps://）が省略されると自動的に補完されます
3. メールリンクの場合、クリックするとメーラーが起動します
4. 電話リンクの場合、クリックすると電話アプリケーションが起動します
5. モバイル端末では、電話リンクをタップすると通話アプリが起動します
6. リンクフィールドの値は、単純な文字列として保存されます
7. 長いURLの場合、表示上は省略されることがありますが、機能には影響ありません

## 関連情報
- リンクフィールドは、外部システムとの連携に役立ちます
- 添付ファイルへのリンクを設定する場合は、ファイルのURLを取得してリンクフィールドに設定します
- 社内システムへのリンクを設定する場合は、認証情報の扱いに注意が必要です
- モバイルアプリでは、電話リンクやメールリンクが特に便利です
`;
}
