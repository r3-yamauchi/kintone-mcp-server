// src/server/tools/documentation/fileField.js

/**
 * 添付ファイルフィールドのドキュメントを取得する関数
 * @returns {string} ドキュメント文字列
 */
export function getFileFieldDocumentation() {
    return `
# 添付ファイルフィールド（FILE）の仕様

## 概要
ファイルをアップロードして添付するフィールドです。複数のファイルを添付することができます。画像、文書、PDFなど、様々な種類のファイルを扱うのに適しています。

## 主要なプロパティ
特に設定可能なプロパティはありません。添付ファイルフィールドは、他のフィールドタイプと比較して設定オプションが少ないシンプルな構造です。

## 添付ファイルフィールドの特徴

- 複数のファイルを添付できます
- 様々な種類のファイル（画像、文書、PDF、圧縮ファイルなど）をアップロード可能です
- ファイルのプレビュー機能があります（画像、PDF）
- ファイルのダウンロードが可能です
- 添付ファイルはkintoneのストレージに保存されます
- APIを使用してプログラムからファイルの操作が可能です

## 使用例

### 基本的な添付ファイルフィールド
\`\`\`json
{
  "type": "FILE",
  "code": "attachments",
  "label": "添付ファイル",
  "required": false
}
\`\`\`

### 必須の添付ファイルフィールド
\`\`\`json
{
  "type": "FILE",
  "code": "contract_document",
  "label": "契約書",
  "required": true
}
\`\`\`

## 応用例

### 画像アップロード用フィールド
商品画像や写真などをアップロードするためのフィールド：

\`\`\`json
{
  "type": "FILE",
  "code": "product_images",
  "label": "商品画像"
}
\`\`\`

### テーブル内の添付ファイルフィールド
テーブル内に添付ファイルフィールドを配置することで、行ごとに関連ファイルを添付できます：

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
        }
      }
    },
    "attachment": {
      "type": "FILE",
      "code": "attachment",
      "label": "添付ファイル"
    }
  }
}
\`\`\`

## 注意事項
1. 添付ファイルフィールドには初期値を設定することはできません
2. ファイルのアップロードには別途APIを使用する必要があります
3. アップロードできるファイルサイズや種類はkintoneの設定に依存します
4. 一般的なファイルサイズの上限は10MBですが、システム設定で変更可能です
5. 添付ファイルはkintoneのストレージを消費します
6. 大量のファイルをアップロードする場合は、パフォーマンスやストレージ容量に注意が必要です
7. 添付ファイルのダウンロードには適切な権限が必要です

## 関連情報
- 画像のみを表示する場合は、別途プラグインを使用することで、画像ギャラリーのような表示が可能です
- 添付ファイルの内容を自動的に処理したい場合は、Webhookと組み合わせて外部サービスと連携することができます
- 添付ファイルの管理にはAPIを使用すると効率的です
`;
}
