// src/server/tools/documentation/choiceFields.js

/**
 * 選択肢フィールドのドキュメントを取得する関数
 * @param {string} fieldType フィールドタイプ（大文字）
 * @returns {string} ドキュメント文字列
 */
export function getChoiceFieldDocumentation(fieldType) {
    const typeMap = {
        "DROP_DOWN": {
            name: "ドロップダウン",
            desc: "ドロップダウンリストから1つの選択肢を選ぶフィールドです。選択肢が多い場合や、画面スペースを節約したい場合に適しています。",
            features: [
                "1つの選択肢のみ選択可能",
                "選択肢が多い場合に適している",
                "画面スペースを節約できる",
                "検索機能付きのドロップダウンリストとして表示される"
            ],
            examples: [
                {
                    title: "基本的なドロップダウン",
                    code: `{
  "type": "DROP_DOWN",
  "code": "status",
  "label": "ステータス",
  "options": {
    "not_started": {
      "label": "未着手",
      "index": "0"
    },
    "in_progress": {
      "label": "進行中",
      "index": "1"
    },
    "completed": {
      "label": "完了",
      "index": "2"
    }
  },
  "defaultValue": "not_started"
}`
                },
                {
                    title: "必須のドロップダウン",
                    code: `{
  "type": "DROP_DOWN",
  "code": "priority",
  "label": "優先度",
  "required": true,
  "options": {
    "high": {
      "label": "高",
      "index": "0"
    },
    "medium": {
      "label": "中",
      "index": "1"
    },
    "low": {
      "label": "低",
      "index": "2"
    }
  },
  "defaultValue": "medium"
}`
                }
            ]
        },
        "RADIO_BUTTON": {
            name: "ラジオボタン",
            desc: "複数の選択肢から1つを選ぶフィールドです。選択肢が少なく、すべての選択肢を一目で確認したい場合に適しています。",
            features: [
                "1つの選択肢のみ選択可能",
                "選択肢が少ない場合（2〜5個程度）に適している",
                "すべての選択肢が一目で確認できる",
                "水平または垂直に配置可能"
            ],
            examples: [
                {
                    title: "基本的なラジオボタン（水平配置）",
                    code: `{
  "type": "RADIO_BUTTON",
  "code": "gender",
  "label": "性別",
  "options": {
    "male": {
      "label": "男性",
      "index": "0"
    },
    "female": {
      "label": "女性",
      "index": "1"
    },
    "other": {
      "label": "その他",
      "index": "2"
    }
  },
  "align": "HORIZONTAL",
  "defaultValue": "male"
}`
                },
                {
                    title: "垂直配置のラジオボタン",
                    code: `{
  "type": "RADIO_BUTTON",
  "code": "payment_method",
  "label": "支払方法",
  "required": true,
  "options": {
    "credit_card": {
      "label": "クレジットカード",
      "index": "0"
    },
    "bank_transfer": {
      "label": "銀行振込",
      "index": "1"
    },
    "cash": {
      "label": "現金",
      "index": "2"
    },
    "other": {
      "label": "その他",
      "index": "3"
    }
  },
  "align": "VERTICAL",
  "defaultValue": "credit_card"
}`
                }
            ]
        },
        "CHECK_BOX": {
            name: "チェックボックス",
            desc: "複数の選択肢から複数の項目を選択できるフィールドです。複数の選択肢を同時に選びたい場合に適しています。",
            features: [
                "複数の選択肢を選択可能",
                "選択肢が少ない場合（2〜10個程度）に適している",
                "すべての選択肢が一目で確認できる",
                "水平または垂直に配置可能"
            ],
            examples: [
                {
                    title: "基本的なチェックボックス（水平配置）",
                    code: `{
  "type": "CHECK_BOX",
  "code": "hobbies",
  "label": "趣味",
  "options": {
    "sports": {
      "label": "スポーツ",
      "index": "0"
    },
    "music": {
      "label": "音楽",
      "index": "1"
    },
    "reading": {
      "label": "読書",
      "index": "2"
    },
    "travel": {
      "label": "旅行",
      "index": "3"
    },
    "cooking": {
      "label": "料理",
      "index": "4"
    }
  },
  "align": "HORIZONTAL",
  "defaultValue": ["sports", "music"]
}`
                },
                {
                    title: "垂直配置のチェックボックス",
                    code: `{
  "type": "CHECK_BOX",
  "code": "contact_methods",
  "label": "連絡方法",
  "required": true,
  "options": {
    "email": {
      "label": "メール",
      "index": "0"
    },
    "phone": {
      "label": "電話",
      "index": "1"
    },
    "mail": {
      "label": "郵便",
      "index": "2"
    },
    "visit": {
      "label": "訪問",
      "index": "3"
    }
  },
  "align": "VERTICAL",
  "defaultValue": ["email"]
}`
                }
            ]
        },
        "MULTI_SELECT": {
            name: "複数選択",
            desc: "ドロップダウンリストから複数の選択肢を選べるフィールドです。選択肢が多く、複数選択したい場合に適しています。",
            features: [
                "複数の選択肢を選択可能",
                "選択肢が多い場合に適している",
                "画面スペースを節約できる",
                "検索機能付きのドロップダウンリストとして表示される"
            ],
            examples: [
                {
                    title: "基本的な複数選択",
                    code: `{
  "type": "MULTI_SELECT",
  "code": "categories",
  "label": "カテゴリ",
  "options": {
    "business": {
      "label": "ビジネス",
      "index": "0"
    },
    "technology": {
      "label": "テクノロジー",
      "index": "1"
    },
    "health": {
      "label": "健康",
      "index": "2"
    },
    "education": {
      "label": "教育",
      "index": "3"
    },
    "entertainment": {
      "label": "エンターテイメント",
      "index": "4"
    }
  },
  "defaultValue": ["business", "technology"]
}`
                },
                {
                    title: "必須の複数選択",
                    code: `{
  "type": "MULTI_SELECT",
  "code": "skills",
  "label": "スキル",
  "required": true,
  "options": {
    "html": {
      "label": "HTML",
      "index": "0"
    },
    "css": {
      "label": "CSS",
      "index": "1"
    },
    "python": {
      "label": "python",
      "index": "2"
    },
    "php": {
      "label": "PHP",
      "index": "3"
    }
  },
  "defaultValue": []
}`
                }
            ]
        }
    };

    const typeInfo = typeMap[fieldType] || {
        name: "選択肢",
        desc: "選択肢から値を選ぶフィールドです。",
        features: [],
        examples: []
    };

    return `
# ${typeInfo.name}フィールド（${fieldType}）の仕様

## 概要
${typeInfo.desc}

## 主要なプロパティ
1. \`options\`: 選択肢の定義（オブジェクト、必須）
   - キーは選択肢の値（内部的に使用される識別子）
   - 各選択肢は \`label\`（表示名）と \`index\`（順序）を持つ
2. \`defaultValue\`: 初期値（${fieldType === "CHECK_BOX" || fieldType === "MULTI_SELECT" ? "配列" : "文字列"}、省略可）
   - ${fieldType === "CHECK_BOX" || fieldType === "MULTI_SELECT" ? "選択された選択肢の値の配列" : "選択された選択肢の値"}
3. \`required\`: 必須フィールドかどうか（true/false、省略可）
${fieldType === "RADIO_BUTTON" || fieldType === "CHECK_BOX" ? "4. `align`: 選択肢の配置方向（\"HORIZONTAL\"または\"VERTICAL\"、省略時は\"HORIZONTAL\"）" : ""}

## ${typeInfo.name}フィールドの特徴

${typeInfo.features.map(feature => `- ${feature}`).join('\n')}

## 使用例

${typeInfo.examples.map(example => `### ${example.title}
\`\`\`json
${example.code}
\`\`\``).join('\n\n')}


## 注意事項
1. optionsオブジェクトのキーは、選択肢の内部的な識別子として使用されます
2. 各選択肢のlabelは、ユーザーに表示される文字列です
3. 各選択肢のindexは、表示順序を決定する文字列型の数値です
4. defaultValueには、選択肢のキー${fieldType === "CHECK_BOX" || fieldType === "MULTI_SELECT" ? "の配列" : ""}を指定します
5. ${fieldType === "CHECK_BOX" || fieldType === "MULTI_SELECT" ? "複数の選択肢を選択できるため、値は常に配列として扱われます" : "単一選択のため、値は文字列として扱われます"}
6. APIでデータを取得すると、選択肢は${fieldType === "CHECK_BOX" || fieldType === "MULTI_SELECT" ? "配列" : "文字列"}形式で返されます
7. 選択肢の数が多い場合は、${fieldType === "DROP_DOWN" || fieldType === "MULTI_SELECT" ? "ドロップダウン形式の方が" : "チェックボックスやラジオボタンよりもドロップダウン形式の方が"}UIとして適しています
8. ${fieldType === "RADIO_BUTTON" || fieldType === "CHECK_BOX" ? "alignプロパティで選択肢の配置方向を指定できます（\"HORIZONTAL\"または\"VERTICAL\"）" : "選択肢が多い場合は検索機能を使って絞り込むことができます"}

## 関連情報
- ${typeInfo.name}フィールドは、条件付き表示や分岐処理と組み合わせて使用すると効果的です
- 選択肢が非常に多い場合は、マスターデータとして別アプリで管理し、ルックアップフィールドと組み合わせることも検討してください
`;
}
