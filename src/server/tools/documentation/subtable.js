// src/server/tools/documentation/subtable.js

/**
 * テーブルフィールドのドキュメントを取得する関数
 * @returns {string} ドキュメント文字列
 */
export function getSubtableDocumentation() {
    return `
# テーブルフィールド（SUBTABLE）の仕様

## 概要
テーブルは、複数のフィールドをグループ化し、表形式で複数行のデータを入力できるフィールドです。明細行や一覧データなど、繰り返し項目を効率的に管理できます。請求書の明細、プロジェクトのタスクリスト、在庫管理など、複数の関連データを一つのレコード内で管理するのに適しています。

## 主要なプロパティ
1. \`fields\`: テーブル内のフィールド定義（オブジェクト、必須）
   - キーはフィールドコード
   - 値はフィールド定義オブジェクト
   - 各フィールドは通常のフィールドと同様に定義しますが、一部の制限があります
2. \`label\`: テーブルの表示名（文字列、必須）
3. \`code\`: テーブルのフィールドコード（文字列、必須）

## テーブルの特徴

- 表形式で複数行のデータを管理できます
- 各行に複数のフィールドを配置できます
- 行の追加・削除・並べ替えが可能です
- 行ごとに一意のIDが自動的に割り当てられます
- 計算フィールドと組み合わせて集計や条件付き計算が可能です

## テーブルの構造

テーブルは以下の構造を持ちます：

1. **テーブル自体の定義**:
   - type: "SUBTABLE"
   - code: テーブルのフィールドコード
   - label: テーブルの表示名

2. **テーブル内のフィールド定義**:
   - fields オブジェクト内に各フィールドを定義
   - 各フィールドは独自のコード、ラベル、型を持ちます
   - フィールド間の関係（計算など）も定義可能

3. **レコード構造**:
   - テーブルのデータは「行」の配列として保存されます
   - 各行は一意の ID を持ち、その中に各フィールドの値が格納されます

## 使用可能なフィールドタイプ

テーブル内では以下のフィールドタイプが使用可能です：

- SINGLE_LINE_TEXT（1行テキスト）
- MULTI_LINE_TEXT（複数行テキスト）
- RICH_TEXT（リッチテキスト）
- NUMBER（数値）
- CALC（計算）
- RADIO_BUTTON（ラジオボタン）
- CHECK_BOX（チェックボックス）
- MULTI_SELECT（複数選択）
- DROP_DOWN（ドロップダウン）
- DATE（日付）
- TIME（時刻）
- DATETIME（日時）
- LINK（リンク）
- USER_SELECT（ユーザー選択）
- GROUP_SELECT（グループ選択）
- ORGANIZATION_SELECT（組織選択）
- FILE（添付ファイル）

## 使用例

### 基本的な明細テーブル
\`\`\`json
{
  "type": "SUBTABLE",
  "code": "items",
  "label": "明細",
  "fields": {
    "item_name": {
      "type": "SINGLE_LINE_TEXT",
      "code": "item_name",
      "label": "品名"
    },
    "quantity": {
      "type": "NUMBER",
      "code": "quantity",
      "label": "数量",
      "displayScale": "0"
    },
    "unit_price": {
      "type": "NUMBER",
      "code": "unit_price",
      "label": "単価",
      "digit": true,
      "unit": "円"
    },
    "subtotal": {
      "type": "CALC",
      "code": "subtotal",
      "label": "小計",
      "expression": "quantity * unit_price",
      "format": "NUMBER",
      "digit": true,
      "unit": "円"
    }
  }
}
\`\`\`

### 選択肢を含むテーブル
\`\`\`json
{
  "type": "SUBTABLE",
  "code": "tasks",
  "label": "タスク一覧",
  "fields": {
    "task_name": {
      "type": "SINGLE_LINE_TEXT",
      "code": "task_name",
      "label": "タスク名"
    },
    "priority": {
      "type": "DROP_DOWN",
      "code": "priority",
      "label": "優先度",
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
    },
    "assignee": {
      "type": "USER_SELECT",
      "code": "assignee",
      "label": "担当者"
    },
    "due_date": {
      "type": "DATE",
      "code": "due_date",
      "label": "期限"
    }
  }
}
\`\`\`

### ファイル添付を含むテーブル
\`\`\`json
{
  "type": "SUBTABLE",
  "code": "documents",
  "label": "関連書類",
  "fields": {
    "document_name": {
      "type": "SINGLE_LINE_TEXT",
      "code": "document_name",
      "label": "書類名"
    },
    "document_type": {
      "type": "DROP_DOWN",
      "code": "document_type",
      "label": "種類",
      "options": {
        "contract": {
          "label": "contract",
          "index": "0"
        },
        "invoice": {
          "label": "invoice",
          "index": "1"
        },
        "receipt": {
          "label": "receipt",
          "index": "2"
        }
      }
    },
    "attachment": {
      "type": "FILE",
      "code": "attachment",
      "label": "添付ファイル"
    },
    "notes": {
      "type": "MULTI_LINE_TEXT",
      "code": "notes",
      "label": "備考"
    }
  }
}
\`\`\`

## 応用例

### 在庫管理テーブル
\`\`\`json
{
  "type": "SUBTABLE",
  "code": "inventory",
  "label": "在庫管理",
  "fields": {
    "product_code": {
      "type": "SINGLE_LINE_TEXT",
      "code": "product_code",
      "label": "商品コード",
      "required": true
    },
    "product_name": {
      "type": "SINGLE_LINE_TEXT",
      "code": "product_name",
      "label": "商品名",
      "required": true
    },
    "category": {
      "type": "DROP_DOWN",
      "code": "category",
      "label": "カテゴリ",
      "options": {
        "electronics": {
          "label": "electronics",
          "index": "0"
        },
        "furniture": {
          "label": "furniture",
          "index": "1"
        },
        "office": {
          "label": "office",
          "index": "2"
        }
      }
    },
    "stock_quantity": {
      "type": "NUMBER",
      "code": "stock_quantity",
      "label": "在庫数",
      "displayScale": "0"
    },
    "reorder_level": {
      "type": "NUMBER",
      "code": "reorder_level",
      "label": "発注点",
      "displayScale": "0"
    },
    "status": {
      "type": "CALC",
      "code": "status",
      "label": "状態",
      "expression": "IF(stock_quantity <= reorder_level, \\"発注必要\\", \\"在庫あり\\")"
    }
  }
}
\`\`\`

### 経費精算テーブル
\`\`\`json
{
  "type": "SUBTABLE",
  "code": "expenses",
  "label": "経費明細",
  "fields": {
    "expense_date": {
      "type": "DATE",
      "code": "expense_date",
      "label": "支出日",
      "required": true
    },
    "expense_type": {
      "type": "DROP_DOWN",
      "code": "expense_type",
      "label": "経費種別",
      "options": {
        "transportation": {
          "label": "transportation",
          "index": "0"
        },
        "meals": {
          "label": "meals",
          "index": "1"
        },
        "accommodation": {
          "label": "accommodation",
          "index": "2"
        },
        "supplies": {
          "label": "supplies",
          "index": "3"
        },
        "other": {
          "label": "other",
          "index": "4"
        }
      },
      "required": true
    },
    "amount": {
      "type": "NUMBER",
      "code": "amount",
      "label": "金額",
      "required": true,
      "digit": true,
      "unit": "円"
    },
    "receipt": {
      "type": "FILE",
      "code": "receipt",
      "label": "領収書"
    },
    "description": {
      "type": "MULTI_LINE_TEXT",
      "code": "description",
      "label": "備考"
    }
  }
}
\`\`\`

## テーブルのデータ構造

APIでテーブルのデータを取得すると、以下のような構造になります：

\`\`\`json
{
  "items": {
    "type": "SUBTABLE",
    "value": [
      {
        "id": "12345",
        "value": {
          "item_name": {
            "type": "SINGLE_LINE_TEXT",
            "value": "商品A"
          },
          "quantity": {
            "type": "NUMBER",
            "value": "5"
          },
          "unit_price": {
            "type": "NUMBER",
            "value": "1000"
          },
          "subtotal": {
            "type": "CALC",
            "value": "5000"
          }
        }
      },
      {
        "id": "12346",
        "value": {
          "item_name": {
            "type": "SINGLE_LINE_TEXT",
            "value": "商品B"
          },
          "quantity": {
            "type": "NUMBER",
            "value": "2"
          },
          "unit_price": {
            "type": "NUMBER",
            "value": "2000"
          },
          "subtotal": {
            "type": "CALC",
            "value": "4000"
          }
        }
      }
    ]
  }
}
\`\`\`

## 集計と計算

### テーブル内のフィールド参照について

kintoneでは、フィールドコードは1つのアプリ内で一意である必要があります。そのため、サブテーブル内のフィールドを参照する際には、サブテーブル名を指定する必要はありません。

#### 正しい参照方法
\`\`\`
// 合計金額の計算
{
  "type": "CALC",
  "code": "total_amount",
  "label": "合計金額",
  "expression": "SUM(金額)",
  "format": "NUMBER",
  "digit": true,
  "unit": "円"
}
\`\`\`

#### 誤った参照方法
\`\`\`
// 誤った参照方法
{
  "type": "CALC",
  "code": "total_amount",
  "label": "合計金額",
  "expression": "SUM(経費明細.金額)",  // 誤り - サブテーブル名は不要
  "format": "NUMBER",
  "digit": true,
  "unit": "円"
}
\`\`\`

テーブル内のフィールドを参照する場合は、フィールドコードのみを指定します。これは、フィールドコードがアプリ内で一意であるためです。

### 条件付き集計
特定の条件に合致する行のみを集計することも可能です：

\`\`\`json
{
  "type": "CALC",
  "code": "high_priority_count",
  "label": "高優先度タスク数",
  "expression": "SUM(IF(priority = \\"high\\", 1, 0))",
  "format": "NUMBER"
}
\`\`\`

### 最大値・最小値の取得
テーブル内の最大値や最小値を取得することも可能です：

\`\`\`
// 最も高い単価を取得
MAX(unit_price)

// 最も早い期限日を取得
MIN(due_date)
\`\`\`


## 注意事項
1. テーブル内では以下のフィールドタイプは使用できません：
   - テーブル（SUBTABLE）- 入れ子のテーブルは作成できません
   - 関連テーブル（REFERENCE_TABLE）
   - ステータス（STATUS）
   - 関連レコードリスト（RELATED_RECORDS）
   - レコード番号（RECORD_NUMBER）
   - 作成者/更新者（CREATOR, MODIFIER）
   - 作成日時/更新日時（CREATED_TIME, UPDATED_TIME）
2. テーブルフィールドの作成は create_subtable_field ツールを使用すると簡単です
3. テーブル内のフィールドは、通常のフィールドと同様に定義します
4. テーブルのレイアウトは、フォームレイアウト設定で特別な扱いを受けます（type: "SUBTABLE"）
5. テーブル内のフィールドを参照する場合は、フィールドコードのみを使用します（テーブルコードは不要）
6. テーブルの行数に制限はありませんが、パフォーマンスを考慮して適切な数に抑えることをお勧めします
7. 大量のデータを扱う場合は、レスポンス時間が遅くなる可能性があります
8. テーブルのデータは、APIでは配列形式で扱われます
9. テーブル内のフィールドコードは、テーブル内で一意である必要があります

## 関連情報
- テーブルは、計算フィールドと組み合わせることで、集計や条件付き計算などの高度な機能を実現できます
- 大量のデータを扱う場合は、パフォーマンスを考慮してテーブルの代わりに別アプリを作成し、関連レコードリストで連携することも検討してください
- テーブルのデータは、CSVエクスポート時に展開されて出力されます
`;
}
