// src/server/tools/DocumentationTools.js

// ドキュメント関連のツールを処理する関数
export async function handleDocumentationTools(name, args) {
    switch (name) {
        case 'get_field_type_documentation': {
            // 引数のチェック
            if (!args.field_type) {
                throw new Error('field_type は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Getting documentation for field type: ${args.field_type}`);
            
            const fieldType = args.field_type.toUpperCase();
            
            // 選択肢フィールドのドキュメント
            if (["RADIO_BUTTON", "CHECK_BOX", "MULTI_SELECT", "DROP_DOWN"].includes(fieldType)) {
                const docs = {
                    common: `
# 選択肢フィールド（${fieldType}）の仕様

## 共通の重要ポイント
1. options オブジェクトの構造:
   - キー名が選択肢の識別子となります
   - 各選択肢には必ず label と index を指定する必要があります
   - label の値は必ずキー名と完全に一致させる必要があります（kintone API の仕様）
   - index は文字列型の数値（"0", "1" など）で、0以上の連番を指定します

2. 表示名の設定:
   - label はキー名と一致させる必要があるため、日本語などの表示名は別途設定する必要があります
   - 表示名はフィールド作成後、管理画面から設定するか、別のAPI呼び出しで設定します`,
                    
                    // フィールドタイプ固有の情報
                    RADIO_BUTTON: `
## RADIO_BUTTON（ラジオボタン）の特徴
- 単一選択のみ可能
- align プロパティで "HORIZONTAL"（横並び）または "VERTICAL"（縦並び）を指定可能
- defaultValue は選択肢のキー名を文字列で指定（例: "sample1"）

## 使用例
\`\`\`json
{
  "type": "RADIO_BUTTON",
  "code": "status",
  "label": "ステータス",
  "noLabel": false,
  "required": true,
  "options": {
    "not_started": {
      "label": "not_started",
      "index": "0"
    },
    "in_progress": {
      "label": "in_progress",
      "index": "1"
    }
  },
  "defaultValue": "not_started",
  "align": "HORIZONTAL"
}
\`\`\``,
                    
                    CHECK_BOX: `
## CHECK_BOX（チェックボックス）の特徴
- 複数選択可能
- align プロパティで "HORIZONTAL"（横並び）または "VERTICAL"（縦並び）を指定可能
- defaultValue は選択肢のキー名の配列で指定（例: ["sample1", "sample2"]）または空配列 []

## 使用例
\`\`\`json
{
  "type": "CHECK_BOX",
  "code": "categories",
  "label": "カテゴリ",
  "noLabel": false,
  "required": false,
  "options": {
    "web": {
      "label": "web",
      "index": "0"
    },
    "mobile": {
      "label": "mobile",
      "index": "1"
    }
  },
  "defaultValue": ["web"],
  "align": "HORIZONTAL"
}
\`\`\``,
                    
                    MULTI_SELECT: `
## MULTI_SELECT（複数選択）の特徴
- 複数選択可能なドロップダウン
- defaultValue は選択肢のキー名の配列で指定（例: ["sample1", "sample2"]）または空配列 []

## 使用例
\`\`\`json
{
  "type": "MULTI_SELECT",
  "code": "tags",
  "label": "タグ",
  "noLabel": false,
  "required": false,
  "options": {
    "important": {
      "label": "important",
      "index": "0"
    },
    "urgent": {
      "label": "urgent",
      "index": "1"
    }
  },
  "defaultValue": []
}
\`\`\``,
                    
                    DROP_DOWN: `
## DROP_DOWN（ドロップダウン）の特徴
- 単一選択のみ可能
- defaultValue は選択肢のキー名を文字列で指定（例: "sample1"）または空文字列 ""

## 使用例
\`\`\`json
{
  "type": "DROP_DOWN",
  "code": "priority",
  "label": "優先度",
  "noLabel": false,
  "required": false,
  "options": {
    "high": {
      "label": "high",
      "index": "0"
    },
    "medium": {
      "label": "medium",
      "index": "1"
    },
    "low": {
      "label": "low",
      "index": "2"
    }
  },
  "defaultValue": "medium"
}
\`\`\``,
                };
                
                // 共通情報とフィールドタイプ固有の情報を結合
                return docs.common + docs[fieldType];
            }
            
            // 関連テーブルフィールドのドキュメント
            if (fieldType === "REFERENCE_TABLE") {
                return `
# 関連テーブル（REFERENCE_TABLE）の仕様

## 概要
関連テーブルは、他のkintoneアプリのレコードを参照して表示するフィールドです。日本語では「関連テーブル」と呼ばれます。

## 必須パラメータ
1. \`referenceTable\` オブジェクト:
   - \`relatedApp\`: 参照先アプリの情報
     - \`app\`: 参照先アプリのID（数値または文字列）
     - \`code\`: 参照先アプリのコード（文字列）
     ※ \`app\`と\`code\`のどちらか一方が必須。両方指定した場合は\`code\`が優先されます。
   - \`condition\`: 関連付け条件
     - \`field\`: このアプリのフィールドコード
     - \`relatedField\`: 参照するアプリのフィールドコード

## オプションパラメータ
1. \`filterCond\`: 参照するレコードの絞り込み条件（クエリ形式、例: "数値_0 > 10 and 数値_1 > 20"）
2. \`displayFields\`: 表示するフィールドのコード配列（例: ["表示するフィールド_0", "表示するフィールド_1"]）
3. \`sort\`: ソート条件（クエリ形式、例: "數值_0 desc, 數值_1 asc"）
4. \`size\`: 一度に表示する最大レコード数（1, 3, 5, 10, 20, 30, 40, 50のいずれか）

## 使用例
\`\`\`json
{
  "type": "REFERENCE_TABLE",
  "code": "関連レコード一覧",
  "label": "関連レコード一覧",
  "noLabel": true,
  "referenceTable": {
    "relatedApp": {
      "app": "3",
      "code": "参照先アプリ"
    },
    "condition": {
      "field": "このアプリのフィールド",
      "relatedField": "参照するアプリのフィールド"
    },
    "filterCond": "数値_0 > 10 and 数値_1 > 20",
    "displayFields": ["表示するフィールド_0", "表示するフィールド_1"],
    "sort": "數值_0 desc, 數值_1 asc",
    "size": "5"
  }
}
\`\`\`

## 注意事項
1. 関連テーブルはフォームレイアウト上では特別な扱いを受けます。
2. レイアウト要素としては、ROW内のフィールド要素として配置します（type: "REFERENCE_TABLE"）。
3. フォームレイアウトのGROUP（グループ）内に関連テーブルを配置することはできません。
`;
            }
            
            // LOOKUPフィールドのドキュメント
            if (fieldType === "LOOKUP") {
                return `
# LOOKUP（ルックアップ）フィールドの仕様

## 概要
ルックアップフィールドは、他のkintoneアプリのレコードを参照し、その値を自動的に取得するフィールドです。

## 必須パラメータ
1. \`lookup\` オブジェクト:
   - \`relatedApp\`: 参照先アプリの情報
     - \`app\`: 参照先アプリのID（数値または文字列）
     - \`code\`: 参照先アプリのコード（文字列）
     ※ \`app\`と\`code\`のどちらか一方が必須。両方指定した場合は\`code\`が優先されます。
   - \`relatedKeyField\`: 参照先アプリのキーフィールドコード
   - \`fieldMappings\`: フィールドマッピングの配列
     - \`field\`: このアプリ側のフィールドコード
     - \`relatedField\`: 参照先アプリのフィールドコード

## オプションパラメータ
1. \`lookup.lookupPickerFields\`: ルックアップピッカーに表示するフィールドコードの配列
2. \`lookup.filterCond\`: 参照先レコードの絞り込み条件（クエリ形式）
3. \`lookup.sort\`: 参照先レコードのソート条件（クエリ形式）

## 使用例
\`\`\`json
{
  "type": "LOOKUP",
  "code": "customer_lookup",
  "label": "顧客情報",
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
      }
    ],
    "lookupPickerFields": ["name", "email", "phone"],
    "filterCond": "status = \\"active\\"",
    "sort": "name asc"
  }
}
\`\`\`

## 注意事項
1. ルックアップフィールドを設定する前に、マッピング先となるフィールドが事前に作成されている必要があります。
2. 参照先アプリが存在し、指定したフィールドが存在することを確認してください。
3. ルックアップフィールドの作成は create_lookup_field ツールを使用すると簡単です。
`;
            }
            
            // その他のフィールドタイプのドキュメント（必要に応じて追加）
            return `フィールドタイプ ${fieldType} のドキュメントは現在提供されていません。`;
        }
        
        default:
            throw new Error(`Unknown documentation tool: ${name}`);
    }
}
