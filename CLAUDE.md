# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際のClaude Code (claude.ai/code) への指針を提供します。

## 開発コマンド

- **サーバー起動**: `npm start` (`node server.js`を実行)
- **依存関係のインストール**: `npm i`
- **Node.js要件**: バージョン18以上
- **テスト**: 現在未実装 (`npm test`は失敗します)

## クイックセットアップ

1. `.env.sample`を`.env`にコピー
2. kintone認証情報を設定:

   ```bash
   KINTONE_DOMAIN=your-domain.cybozu.com
   KINTONE_USERNAME=your-username
   KINTONE_PASSWORD=your-password
   ```

3. `npm install`を実行後、`npm start`で起動

## 開発ワークフロー

### 典型的な開発フロー

#### 1. 新規アプリ作成

```
create_app → add_fields → create_layout → deploy_app → get_deploy_status
```

#### 2. 既存アプリ更新

```
get_preview_fields → update_field → update_layout → deploy_app
```

#### 3. レコード操作

```
create_record → get_record → update_record (deleteは意図的に未実装)
```

### 開発時の確認コマンド

- **接続テスト**: `get_kintone_domain`
- **アプリ一覧**: `get_apps`
- **フィールド確認**: `get_fields`（本番）または `get_preview_fields`（プレビュー）
- **デプロイ状態**: `get_deploy_status`

## アーキテクチャ概要

これはkintone統合のためのModel Context Protocol (MCP) サーバーです。コードベースは、ツール定義と実装を明確に分離したモジュラーアーキテクチャに従っています。

### コア構造

- **エントリーポイント**: `server.js` → `src/index.js` → `src/server/MCPServer.js`
- **メインサーバー**: `src/server/MCPServer.js` - kintone認証情報でMCPサーバーを初期化
- **リクエストフロー**: `ToolRequestHandler.js` → `ToolRouter.js` → カテゴリー別ツール実装
- **ツール実装**: `src/server/tools/` - カテゴリー別に整理された実際のツールロジック
- **ツール定義**: `src/server/tools/definitions/` - MCPツールスキーマとメタデータ
- **定数**: `src/constants.js` - フィールドタイプ、検証パターン、システムフィールド

### ツール実装パターン

実際のツール実装は以下のフローで行われます：

```text
User Request → ToolRouter → CategoryTools → Repository → kintone API
                    ↓              ↓             ↓
               (ルーティング)  (ビジネスロジック) (API通信)
```

例：`get_record`ツールの場合

1. ToolRouter.jsがリクエストを受信
2. RecordTools.jsの`getRecord`メソッドを呼び出し
3. KintoneRecordRepository.jsがkintone APIと通信
4. BaseKintoneRepository.jsのエラーハンドリングを継承

### ツールカテゴリー

サーバーは9つのカテゴリーにわたる47のツールを提供します：

- **レコード (Records)**: kintoneレコードのCRUD操作（安全のためdeleteは意図的に除外）
- **アプリ (Apps)**: アプリ作成、フィールド管理、デプロイ
- **スペース (Spaces)**: スペースとスレッド管理
- **フィールド (Fields)**: フィールド設定と検証
- **ファイル (Files)**: アップロード/ダウンロード操作（1MB以上のダウンロードは未サポート）
- **レイアウト (Layout)**: フォームレイアウト管理
- **ユーザー (Users)**: ユーザーとグループ情報
- **システム (System)**: 接続情報と診断
- **ドキュメンテーション (Documentation)**: フィールドタイプのドキュメント

### リポジトリパターン

すべてのkintone APIとのやり取りは`src/repositories/`内のリポジトリクラスを通じて行われます：

- `KintoneRepository.js` - メインリポジトリオーケストレーター
- カテゴリー別リポジトリは`BaseKintoneRepository.js`を継承
- API通信には`@kintone/rest-api-client`を使用
- フィールドとレイアウトの検証用バリデーターは`src/repositories/validators/`に配置

### 設定

- 環境変数: `KINTONE_DOMAIN`, `KINTONE_USERNAME`, `KINTONE_PASSWORD`
- 環境変数が設定されていない場合は`.env`ファイルにフォールバック
- 認証情報は`KintoneCredentials.js`モデルで管理
- **重要**: `KINTONE_DOMAIN`は`https://`を含めない (例: `your-domain.cybozu.com`)

### 特殊フィールドタイプ

#### LOOKUP (ルックアップ)

- 基本フィールドタイプ + lookupアトリビュート
- 参照先アプリは本番環境にデプロイ済みである必要あり
- `create_lookup_field`ヘルパーを使用推奨

#### SUBTABLE (テーブル)

- 他のフィールドを含むコンテナ
- ネスト不可（テーブル内にテーブルは配置できない）
- フィールドコードにテーブル名を含めない

#### CALC (計算)

- kintone標準関数のみサポート
- `get_calc_field_documentation`で使用可能な関数を確認
- `create_calc_field`でバリデーション実行

### ツールアノテーション

すべてのツールにはMCP 2025-03-26仕様のアノテーションが含まれています：

- `readOnly`: ツールがデータを変更するかどうか
- `safe`: 操作のリスクレベル
- `category`: 機能グループ
- `requiresConfirmation`: ユーザー確認が推奨されるかどうか
- `longRunning`: 実行時間の予測
- `impact`: 操作の影響レベル (low/medium/high)

## コーディング規約

- **言語**: `package.json`で`type: "module"`を使用したESモジュール
- **非同期処理**: async/awaitを一貫して使用
- **命名規則**: クラスはPascalCase、メソッド/変数はcamelCase
- **エラーハンドリング**: 意味のあるエラーメッセージとタイプを提供
- **コード重複の排除**: 共通機能をユーティリティに抽象化
- **コメント**: 複雑なロジックを説明、ユーザー向けメッセージは日本語を使用
- **ファイルアクセス**: プロジェクトディレクトリ外のファイルには決してアクセスしない
- **Gitコミット**: 絵文字プレフィックスを使用、日本語のコミットメッセージ（`clinerules-bank/01-coding-standards.md`を参照）

## 新しいツールの追加

1. `src/server/tools/definitions/CategoryToolDefinitions.js`にツール定義を作成
2. `src/server/tools/CategoryTools.js`にツールロジックを実装
3. 新しいAPIメソッドが必要な場合はリポジトリクラスを更新
4. `ToolRouter.js`にルーティングを追加（ToolRequestHandler.jsではない）
5. `src/server/tools/definitions/index.js`にツール定義を登録
6. 既存のパターンに従い一貫性を保つ

### 実装例: 新しいレコードツールの追加

**1. ツール定義** (`RecordToolDefinitions.js`):

```javascript
{
  name: "search_records",
  description: "レコードを検索",
  inputSchema: {
    type: "object",
    properties: {
      app_id: { type: "string", description: "アプリID" },
      query: { type: "string", description: "検索クエリ" }
    },
    required: ["app_id", "query"]
  },
  annotations: {
    readOnly: true,
    safe: true,
    category: "records",
    impact: "low"
  }
}
```

**2. ツール実装** (`RecordTools.js`):

```javascript
async searchRecords({ app_id, query }) {
  const records = await this.recordRepository.search(app_id, query);
  return { records };
}
```

**3. リポジトリメソッド** (`KintoneRecordRepository.js`):

```javascript
async search(appId, query) {
  const result = await this.client.record.getRecords({
    app: appId,
    query: query
  });
  return result.records;
}
```

## kintone固有の制約

- **ルックアップフィールド**: 基本フィールドタイプ + lookupアトリビュートとして実装（本番環境へのデプロイが必要）
- **計算フィールド**: kintone標準関数のみサポート（カスタム関数は使用不可）
- **ファイルサイズ制限**: ダウンロードは1MBまで（大きなファイルはタイムアウトする可能性）
- **レート制限**: kintone APIのレート制限に注意
- **フィールドタイプドキュメント**: 詳細は`src/server/tools/documentation/`を参照
- **クエリ構文**: 並び替えのみの場合は `$id > 0` プレフィックスが必要
- **サブテーブルフィールド**: テーブル名を含めない（例: `field_code`のみ、`table.field_code`は不可）
- **デプロイライフサイクル**: create_app → add_fields → deploy_app → 完了待機

### フィールド値フォーマットの例

各フィールドタイプの正しい値フォーマット：

```json
{
  "文字列（1行）": { "value": "テキスト" },
  "数値": { "value": "123" },  // 文字列として指定
  "日付": { "value": "2024-01-01" },
  "ユーザー選択": { "value": [{ "code": "user1" }] },
  "チェックボックス": { "value": ["選択肢1", "選択肢2"] },
  "テーブル": { 
    "value": [
      { 
        "value": { 
          "列1": { "value": "値1" },
          "列2": { "value": "値2" }
        } 
      }
    ] 
  }
}
```

## 重要な注意事項

- **バージョン管理**: `package.json`と`MCPServer.js`の両方でバージョンを更新（現在5.3.0）
- **削除操作なし**: データの安全性のため意図的に除外
- **テストフレームワーク**: 未実装、将来的に追加予定
- **バッチ操作**: JSON-RPCバッチング予定だが未実装
- **エラーハンドラー**: `src/server/handlers/ErrorHandlers.js`に集約
- **データトランスフォーマー**: レスポンスフォーマット用のユーティリティは`src/utils/DataTransformers.js`に配置

## プロジェクトドキュメント

- **アーキテクチャ詳細**: `docs/mcp-server-architecture.md`
- **コーディング標準**: `clinerules-bank/01-coding-standards.md`
- **実装状況**: `docs/implementation-status.md`
- **MCP仕様**: `docs/mcp-specification/`
- **将来の計画**: `clinerules-bank/`の実装計画を参照

## トラブルシューティング

### よくあるエラーと解決方法

**認証エラー**
- 原因: `.env`ファイルの認証情報が不正
- 解決: `KINTONE_DOMAIN`にhttps://を含めない、パスワードは平文で指定

**フィールドが見つからない**
- 原因: アプリが本番環境にデプロイされていない
- 解決: `deploy_app`を実行してから`get_deploy_status`で確認

**フィールド値フォーマットエラー**
- 原因: フィールドタイプに応じた正しいフォーマットを使用していない
- 解決: 上記の「フィールド値フォーマットの例」を参照

**ルックアップフィールドの設定エラー**
- 原因: 参照先アプリが本番環境にない
- 解決: 参照先アプリを先にデプロイしてから設定

**計算フィールドのエラー**
- 原因: サポートされていない関数を使用
- 解決: `get_calc_field_documentation`でサポート関数を確認

**デプロイの順序エラー**
- 原因: フィールド追加前にデプロイを実行
- 解決: create_app → add_fields → deploy_app の順序を守る

### デバッグのヒント

- **接続確認**: 最初に`get_kintone_domain`を実行して接続を確認
- **ログ確認**: サーバーはstderr（console.error）にデバッグログを出力
- **プレビュー確認**: `get_preview_*`ツールで未コミットの変更を確認
- **エラー詳細**: ErrorHandlers.jsが詳細なエラー情報とサジェストを提供