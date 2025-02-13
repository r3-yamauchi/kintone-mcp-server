// src/server/tools/documentation/userSelect.js

/**
 * ユーザー/グループ/組織選択フィールドのドキュメントを取得する関数
 * @param {string} fieldType フィールドタイプ（大文字）
 * @returns {string} ドキュメント文字列
 */
export function getUserSelectDocumentation(fieldType) {
    const typeMap = {
        "USER_SELECT": "ユーザー",
        "GROUP_SELECT": "グループ",
        "ORGANIZATION_SELECT": "組織"
    };
    
    const typeName = typeMap[fieldType] || "ユーザー/グループ/組織";
    
    // 各フィールドタイプ固有の説明
    const typeSpecificDesc = {
        "USER_SELECT": "ユーザー選択フィールドは、kintoneに登録されているユーザーを選択するためのフィールドです。担当者、承認者、作業者など、人に関連する情報を扱うのに適しています。",
        "GROUP_SELECT": "グループ選択フィールドは、kintoneに登録されているグループを選択するためのフィールドです。部署、チーム、プロジェクトグループなど、組織のグループに関連する情報を扱うのに適しています。",
        "ORGANIZATION_SELECT": "組織選択フィールドは、kintoneに登録されている組織を選択するためのフィールドです。会社、部門、支社など、組織構造に関連する情報を扱うのに適しています。"
    };
    
    // 各フィールドタイプ固有の使用例
    const typeSpecificExample = {
        "USER_SELECT": `
### 担当者フィールド
\`\`\`json
{
  "type": "USER_SELECT",
  "code": "assignee",
  "label": "担当者",
  "required": true,
  "defaultValue": [
    {
      "type": "USER",
      "code": "user1"
    }
  ]
}
\`\`\`

### 複数の承認者フィールド
\`\`\`json
{
  "type": "USER_SELECT",
  "code": "approvers",
  "label": "承認者",
  "required": true,
  "defaultValue": []
}
\`\`\``,
        "GROUP_SELECT": `
### 部署フィールド
\`\`\`json
{
  "type": "GROUP_SELECT",
  "code": "department",
  "label": "部署",
  "required": true,
  "defaultValue": [
    {
      "type": "GROUP",
      "code": "sales"
    }
  ]
}
\`\`\`

### 関連チームフィールド
\`\`\`json
{
  "type": "GROUP_SELECT",
  "code": "related_teams",
  "label": "関連チーム",
  "required": false,
  "defaultValue": []
}
\`\`\``,
        "ORGANIZATION_SELECT": `
### 所属組織フィールド
\`\`\`json
{
  "type": "ORGANIZATION_SELECT",
  "code": "division",
  "label": "所属組織",
  "required": true,
  "defaultValue": [
    {
      "type": "ORGANIZATION",
      "code": "tokyo_branch"
    }
  ]
}
\`\`\`

### 関連部門フィールド
\`\`\`json
{
  "type": "ORGANIZATION_SELECT",
  "code": "related_divisions",
  "label": "関連部門",
  "required": false,
  "defaultValue": []
}
\`\`\``
    };
    
    return `
# ${typeName}選択フィールド（${fieldType}）の仕様

## 概要
${typeSpecificDesc[fieldType] || `kintoneの${typeName}を選択するフィールドです。複数選択が可能です。`}

## 主要なプロパティ
1. \`defaultValue\`: 初期値（オブジェクトの配列、省略可）
   - 各オブジェクトには \`type\` と \`code\` が必要
   - \`type\`: "${fieldType === "USER_SELECT" ? "USER" : fieldType === "GROUP_SELECT" ? "GROUP" : "ORGANIZATION"}"
   - \`code\`: ${typeName}のコード（ログイン名やグループコードなど）
2. \`entities\`: 選択可能な${typeName}の制限（オブジェクトの配列、省略可）
   - 選択肢を特定の${typeName}に制限する場合に使用
   - 指定しない場合は、すべての${typeName}が選択可能
3. \`required\`: 必須フィールドかどうか（true/false、省略可）

## ${typeName}選択フィールドの特徴

- kintoneに登録されている${typeName}から選択できます
- 複数選択が可能です（配列として保存）
- 選択肢はkintoneの${typeName}管理と連動しています
- 選択可能な${typeName}を制限することができます
- レコード作成時のデフォルト値を設定できます
- 権限に基づいた動的な選択肢表示が可能です

## 基本的な使用例

### 基本的な${typeName}選択フィールド
\`\`\`json
{
  "type": "${fieldType}",
  "code": "${fieldType.toLowerCase()}_field",
  "label": "${typeName}選択",
  "required": false,
  "defaultValue": []
}
\`\`\`

### 必須の${typeName}選択フィールド（デフォルト値あり）
\`\`\`json
{
  "type": "${fieldType}",
  "code": "${fieldType.toLowerCase()}_required",
  "label": "${typeName}（必須）",
  "required": true,
  "defaultValue": [
    {
      "type": "${fieldType === "USER_SELECT" ? "USER" : fieldType === "GROUP_SELECT" ? "GROUP" : "ORGANIZATION"}",
      "code": "${fieldType === "USER_SELECT" ? "user1" : fieldType === "GROUP_SELECT" ? "group1" : "org1"}"
    }
  ]
}
\`\`\`

### 選択可能な${typeName}を制限したフィールド
\`\`\`json
{
  "type": "${fieldType}",
  "code": "${fieldType.toLowerCase()}_restricted",
  "label": "選択可能な${typeName}",
  "entities": [
    {
      "type": "${fieldType === "USER_SELECT" ? "USER" : fieldType === "GROUP_SELECT" ? "GROUP" : "ORGANIZATION"}",
      "code": "${fieldType === "USER_SELECT" ? "user1" : fieldType === "GROUP_SELECT" ? "group1" : "org1"}"
    },
    {
      "type": "${fieldType === "USER_SELECT" ? "USER" : fieldType === "GROUP_SELECT" ? "GROUP" : "ORGANIZATION"}",
      "code": "${fieldType === "USER_SELECT" ? "user2" : fieldType === "GROUP_SELECT" ? "group2" : "org2"}"
    }
  ]
}
\`\`\`

## 応用例
${typeSpecificExample[fieldType] || ''}

## 注意事項
1. defaultValueに指定する${typeName}は、kintone環境に現に存在している必要があります。存在しない、あるいは無効化されている${typeName}を設定するとエラーが発生するため、初期値（既定値）を設定する場合は十分に注意してください。
2. entitiesを指定すると、選択可能な${typeName}を制限できます
3. ${typeName}選択フィールドは、kintoneの画面上でドロップダウンリストとして表示されます
4. ユーザーの権限によって、選択できる${typeName}が制限される場合があります
5. APIでデータを取得すると、${typeName}情報は配列形式で返されます
6. ${typeName}が削除された場合、そのコードを含むフィールドは正しく表示されない可能性があります

## 関連情報
- ${typeName}選択フィールドは、ワークフローやプロセス管理と組み合わせて使用すると効果的です
- 複数の${typeName}を選択する場合は、配列として扱われます
- kintoneのユーザー管理機能と連携しているため、${typeName}情報の更新は自動的に反映されます
`;
}
