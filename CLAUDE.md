# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際のClaude Code (claude.ai/code) への指針を提供します。

## 開発コマンド

- **サーバー起動**: `pnpm start` (`node server.js`を実行)
- **依存関係のインストール**: `pnpm install`
- **パッケージマネージャーの指定**: `preinstall` スクリプトで pnpm 以外でのインストールを拒否します。必要に応じて `corepack enable` → `corepack prepare pnpm@10.13.1 --activate` を実行してから `pnpm install` を実行してください。
- **Node.js要件**: バージョン20以上
- **テスト**: 現在未実装 (`pnpm test`は失敗します)
- **開発時のリアルタイム実行**: 依存関係更新後は`pnpm start`でサーバーを再起動

## 最新の依存関係 (2025年9月更新)

- **`@modelcontextprotocol/sdk`**: ^1.18.2 (MCP 2025-03-26仕様対応)
- **HTTPクライアント**: Node.js 20標準の `fetch` / `FormData`

## ライセンス

このプロジェクトはAGPL-3.0ライセンスで公開されています。ネットワーク経由での利用時もソースコード開示義務があることに注意してください。

## クイックセットアップ

1. 必要な環境変数をシェルで設定（例）:

   ```bash
   export KINTONE_DOMAIN=your-domain.cybozu.com
   export KINTONE_USERNAME=your-username
   export KINTONE_PASSWORD=your-password
   ```

2. `pnpm install`を実行後、`pnpm start`で起動

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

#### 4. Upsert操作

```
upsert_record  - 重複禁止フィールドを使用した単一レコードのUpsert
upsert_records - 同じ仕様で最大100件までの複数レコードUpsert
```

`upsert_record`と`upsert_records`はいずれもNode.js標準の `fetch` を使って `/k/v1/records.json` のUPSERTモード（`upsert: true` + `records` 配列）を直接呼び出します：
- 指定された重複禁止フィールド（updateKey）と値をそのままAPIに渡し、kintone側のUPSERT処理に委譲
- 単一レコードの場合は配列1件、複数レコードの場合は最大100件までまとめて送信
- 応答は `{ id, revision, operation }` を含む配列を受け取り、ツール側でメッセージや結果オブジェクトに整形
- レコード検索や手動比較は行わず、kintone標準REST APIのみで処理を完結

### 開発時の確認コマンド

- **接続テスト**: `get_kintone_domain`
- **アプリ一覧**: `get_apps`
- **フィールド確認**: `get_fields`（本番）または `get_preview_fields`（プレビュー）
- **デプロイ状態**: `get_deploy_status`
- **クエリ構文確認**: `get_query_language_documentation`

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

サーバーは9つのカテゴリーにわたる79のツールを提供します：

- **レコード (Records)**: kintoneレコードのCRUD操作（安全のためdeleteは意図的に除外）、upsertモードもサポート
- **アプリ (Apps)**: アプリ作成、フィールド管理、デプロイ、アクション設定（filterCond対応）
- **スペース (Spaces)**: スペースとスレッド管理
- **フィールド (Fields)**: フィールド設定と検証
- **ファイル (Files)**: アップロード/ダウンロード操作（1MB以上のダウンロードは未サポート）
- **レイアウト (Layout)**: フォームレイアウト管理
- **ユーザー (Users)**: ユーザーとグループ情報
- **システム (System)**: 接続情報と診断
- **ドキュメンテーション (Documentation)**: フィールドタイプとクエリ言語のドキュメント

### リポジトリパターン

すべてのkintone APIとのやり取りは`src/repositories/`内のリポジトリクラスを通じて行われます：

- `KintoneRepository.js` - メインリポジトリオーケストレーター
- カテゴリー別リポジトリは`BaseKintoneRepository.js`を継承
- API通信はNode.js標準のfetchとFormDataを直接利用
- フィールドとレイアウトの検証用バリデーターは`src/repositories/validators/`に配置

### 設定

- 環境変数: `KINTONE_DOMAIN`, `KINTONE_USERNAME`, `KINTONE_PASSWORD`（サーバー起動前に必ず設定する）
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

## エラーハンドリングのベストプラクティス

### エラータイプの使い分け

- **ValidationError**: 入力値の検証エラー
- **KintoneAPIError**: kintone API呼び出しエラー  
- **NetworkError**: ネットワーク接続エラー
- **ConfigurationError**: 設定・認証エラー

### エラーメッセージの構造

```javascript
throw new Error(`[${errorType}] ${message} - ${detail}`);
```

### ユーザーフレンドリーなエラー対応

ErrorHandlers.jsのサジェスト機能を活用し、解決策を提示する。特にクエリ構文エラーでは詳細なガイダンスを提供。

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

### 新しいツールを追加する際のチェックリスト

1. **ツール定義の追加** (`src/server/tools/definitions/`)
   - inputSchemaの定義
   - annotationsの設定
   
2. **ツールハンドラーの実装** (`src/server/tools/`)
   - ValidationUtilsを使用した入力検証
   - LoggingUtilsを使用したログ出力
   - ResponseBuilderを使用したレスポンス生成

3. **リポジトリメソッドの実装** (`src/repositories/`)
   - 実際のkintone APIを呼び出すメソッド
   - LoggingUtilsを使用した詳細ログ
   - エラーハンドリング

4. **ファサードメソッドの追加** (`src/repositories/KintoneRepository.js`)
   - 対応するリポジトリメソッドを呼び出す
   - これを忘れると "repository.methodName is not a function" エラーが発生

## kintone固有の制約と新機能

### 基本制約

- **ルックアップフィールド**: 基本フィールドタイプ + lookupアトリビュートとして実装（本番環境へのデプロイが必要）
- **計算フィールド**: kintone標準関数のみサポート（カスタム関数は使用不可）
- **ファイルサイズ制限**: ダウンロードは1MBまで（大きなファイルはタイムアウトする可能性）
- **レート制限**: kintone APIのレート制限に注意
- **クエリ構文**: 並び替えのみの場合は `$id > 0` プレフィックスが必要
- **サブテーブルフィールド**: テーブル名を含めない（例: `field_code`のみ、`table.field_code`は不可）
- **デプロイライフサイクル**: create_app → add_fields → deploy_app → 完了待機

### 7.2.0の新機能

#### 文字列（複数行）フィールドでのis演算子対応
```javascript
// 新しく対応したクエリ例
"Detail is empty"         // 文字列複数行フィールドが空欄
"Detail is not empty"     // 文字列複数行フィールドが非空欄
```

#### アプリアクション設定のfilterCondプロパティ対応
```javascript
// 条件付きアクション実行の設定例
{
  "app_id": 123,
  "actions": {
    "承認アクション": {
      "name": "承認アクション",
      "index": "0",
      "filterCond": "Status = \"レビュー中\" and 作成者 in (LOGINUSER())",
      // ... その他の設定
    }
  }
}
```

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

## クエリ構文の使いやすさ改善

### search_recordsツールの強化
- **即座に使える例**: ツール定義に11個の実用的クエリ例を記載
- **段階的学習**: 基本例 → 詳細ドキュメント → エラー時ガイダンス
- **エラー時サポート**: クエリエラー時に具体的な解決策を自動提示

### よく使われるクエリパターン例
```javascript
// 基本的な検索パターン
"Status = \"完了\""                                    // 完全一致
"Customer like \"株式会社\""                           // 部分一致
"Status in (\"対応中\",\"未対応\")"                   // 複数選択
"LimitDay >= \"2022-09-29\" and LimitDay <= \"2022-10-29\"" // 範囲指定
"Detail is empty"                                      // 空欄チェック（7.2.0新機能）
"Status not in (\"完了\") order by 更新日時 desc"    // ソート付き

// limit句の正しい使用例（kintone制約対応）
"$id > 0 limit 10"                                     // 条件付きlimit
"order by $id desc limit 10"                          // ソート付きlimit
// 注意: "limit 10" のような単独使用は無効
```

## パフォーマンス最適化

### バッチ処理の活用

- `create_records`、`update_records`を使用して複数レコードを一括処理
- 100件を超える場合は分割処理を検討

### APIコール数の削減

- 必要なフィールドのみを取得（fieldsパラメータの活用）
- キャッシュの適切な利用（WebFetchツールの15分キャッシュを参考）

### 検索クエリの最適化

- インデックスが設定されているフィールドでの検索を優先
- 複雑な条件はアプリ側で事前にビューを作成

## よくある実装パターン

### プレビュー環境と本番環境の切り替え

```javascript
// プレビュー環境のフィールドを取得してから本番反映
const previewFields = await this.appRepository.getPreviewFormFields(appId);
// フィールドを編集
await this.appRepository.updateFormFields(appId, updatedFields);
// 本番環境へデプロイ
await this.appRepository.deployApp(appId);
```

### 条件付きフィールド更新

```javascript
// 既存フィールドを確認
const existingFields = await this.appRepository.getFormFields(appId);
// 存在チェック
if (existingFields[fieldCode]) {
    // 更新
    await this.appRepository.updateField(appId, fieldCode, updates);
} else {
    // 新規追加
    await this.appRepository.addFields(appId, [newField]);
}
```

## 重要な注意事項

- **バージョン管理**: `package.json`、`manifest.json`、`MCPServer.js`の3ファイルでバージョンを更新（現在7.2.0）
- **削除操作なし**: データの安全性のため意図的に除外
- **テストフレームワーク**: 未実装、将来的に追加予定
- **バッチ操作**: JSON-RPCバッチング予定だが未実装
- **エラーハンドラー**: `src/server/handlers/ErrorHandlers.js`に集約
- **データトランスフォーマー**: レスポンスフォーマット用のユーティリティは`src/utils/DataTransformers.js`に配置

## 実装済みAPIと今後の実装

### 実装済みAPI (79ツール)

#### レコード操作 (15ツール)
- `get_record`, `search_records`, `create_record`, `update_record`
- `add_record_comment`, `get_record_comments`, `update_record_comment`
- `get_record_acl`, `update_record_status`, `update_record_assignees`
- `create_records`, `update_records` (バッチ処理)
- `upsert_record` (重複禁止フィールドを使用したUpsert操作)
- **未実装**: `deleteRecord` (安全性のため意図的に除外)

#### アプリ管理 (36ツール)
- **基本操作**: `create_app`, `get_apps_info`, `deploy_app`, `get_deploy_status`
- **設定管理**: `update_app_settings`, `get_preview_app_settings`
- **フィールド管理**: `add_fields`, `update_field`, `delete_form_fields`
- **レイアウト**: `get_form_layout`, `update_form_layout`, `get_preview_form_layout`
- **ビュー**: `get_views`, `update_views`
- **アクセス権限**: `get_app_acl`, `update_app_acl`, `get_field_acl`, `update_field_acl`
- **プロセス管理**: `get_process_management`, `update_process_management`
- **グラフ**: `get_reports`, `update_reports`
- **通知**: `get_notifications`, `update_notifications`, `get_per_record_notifications`, `update_per_record_notifications`, `get_reminder_notifications`, `update_reminder_notifications`
- **カスタマイズ**: `get_app_customize`, `update_app_customize`, `get_app_actions`, `update_app_actions`, `get_app_plugins`, `update_plugins`
- **スペース連携**: `move_app_to_space`, `move_app_from_space`

#### フィールド作成ヘルパー (14ツール)
- `create_text_field`, `create_number_field`, `create_date_field`, `create_time_field`
- `create_datetime_field`, `create_choice_field`, `create_user_select_field`
- `create_attachment_field`, `create_link_field`, `create_rich_text_field`
- `create_subtable_field`, `create_calc_field`, `create_reference_table_field`
- `create_related_records_field`, `create_status_field`

#### その他の機能
- **スペース管理** (10ツール): スペース、スレッド、ゲストユーザー管理
- **ファイル操作** (2ツール): `upload_file`, `download_file`
- **ユーザー管理** (3ツール): `get_users`, `get_groups`, `get_group_users`
- **システム** (2ツール): `get_kintone_domain`, `get_fields`
- **ドキュメント** (6ツール): フィールドタイプとクエリ言語のドキュメント取得

### 実装しない主要なAPI

#### リスクやセキュリティ面を考慮したうえで実装しない機能
- すべての削除系API (`deleteRecords`, `deleteSpace`, `deleteApp`など)
- パスワード変更API
- システム管理者向けAPI

## プロジェクトドキュメント

- **アーキテクチャ詳細**: `docs/mcp-server-architecture.md`
- **コーディング標準**: `clinerules-bank/01-coding-standards.md`
- **実装状況**: `docs/implementation-status.md`
- **MCP仕様**: `docs/mcp-specification/`
- **将来の計画**: `clinerules-bank/`の実装計画を参照

## トラブルシューティング

### よくあるエラーと解決方法

**認証エラー**
- 原因: 環境変数が未設定、または値が不正
- 解決: サーバー起動前に `KINTONE_DOMAIN`, `KINTONE_USERNAME`, `KINTONE_PASSWORD` を再設定し、`KINTONE_DOMAIN` に `https://` を含めない

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

**クエリ構文エラー (7.2.0で改善)**
- 原因: kintoneクエリ構文の誤用
- 解決: `get_query_language_documentation`でクエリ構文を確認、エラーハンドラーが詳細なガイダンスを提供

**User APIエラー (CB_IL02)**
- 原因: cybozu.com共通管理者権限がない、またはUser APIが無効
- 解決: `get_users`、`get_groups`、`get_group_users`を使用する場合は、以下を確認：
  - 使用しているアカウントがcybozu.com共通管理者権限を持っているか
  - cybozu.com共通管理でUser APIが有効になっているか
- 注意: これらのツールは特権的な操作のため、通常のkintoneユーザーでは使用できません

### エラー対処方法

**"repository.methodName is not a function" エラー**
このエラーが発生した場合は、以下を確認：
1. KintoneRepositoryクラスに対応するメソッドが存在するか
2. メソッド名が正しいか（typoがないか）
3. 適切なリポジトリ（appRepo, recordRepo等）を呼び出しているか

**kintone APIメソッドが存在しないエラー**
1. [kintone JavaScript Client公式ドキュメント](https://github.com/kintone/js-sdk/tree/main/packages/rest-api-client/docs)を確認
2. APIがどのクライアント（app, record, space等）に属するか確認
3. 正しいクライアントメソッドを使用するよう実装を修正

### デバッグのヒント

- **接続確認**: 最初に`get_kintone_domain`を実行して接続を確認
- **ログ確認**: サーバーはstderr（console.error）にデバッグログを出力
- **プレビュー確認**: `get_preview_*`ツールで未コミットの変更を確認
- **エラー詳細**: ErrorHandlers.jsが詳細なエラー情報とサジェストを提供
- **クエリテスト**: `search_records`でクエリ構文をテスト

## APIカバレッジ

- **実装率**: 約95%（削除系APIを除く）
- **総ツール数**: 79ツール
- **カテゴリー数**: 9カテゴリー
- **対応kintone APIバージョン**: 最新（2025年9月アップデート時点）

### 主な実装の特徴

1. **安全性重視**: 削除系APIは意図的に未実装
2. **バッチ処理対応**: 複数レコードの一括作成・更新
3. **プレビュー環境対応**: 主要なAPIでプレビュー環境をサポート
4. **包括的なエラーハンドリング**: 詳細なエラーメッセージと解決策の提示
5. **型安全性**: 全ツールにJSON Schemaによる入力検証
6. **アノテーション**: MCP 2025-03-26仕様準拠のメタデータ
7. **クエリ構文サポート**: 詳細なドキュメントとエラー時ガイダンス

## リファクタリング（2025年改善）

### 実施した改善

#### 1. 共通ユーティリティの導入

**ValidationUtils** (`src/utils/ValidationUtils.js`)
- 引数の必須チェック、型チェック、配列検証などを統一化
- 各ツールで重複していたバリデーションコードを削減

**LoggingUtils** (`src/utils/LoggingUtils.js`)
- ログ出力形式を統一
- API呼び出しとレスポンスのログを標準化
- デバッグ効率の向上

**ResponseBuilder** (`src/utils/ResponseBuilder.js`)
- レスポンス形式を統一
- 成功/エラーレスポンスの構築を簡潔に

**FieldValidationUtils** (`src/utils/FieldValidationUtils.js`)
- フィールド固有のバリデーションロジックを集約
- 選択肢フィールド、計算フィールド、ルックアップフィールドの検証

#### 2. リポジトリ層の改善

**BaseKintoneRepository拡張**
- `executeWithLogging`: ログ付きAPI実行の共通メソッド
- `executeWithDetailedLogging`: パラメータログ付きAPI実行
- try-catch-logパターンの重複を解消

**リポジトリの簡潔化**
- 各リポジトリメソッドが共通メソッドを使用
- コード行数を約40%削減
- 一貫性のあるエラーハンドリング

#### 3. ツール実装の標準化

**共通パターンの適用**
- 全ツールで統一されたバリデーション
- 統一されたログ出力
- 統一されたレスポンス形式

**コードの可読性向上**
- ビジネスロジックとバリデーションの分離
- 各ツールの責務が明確に

### リファクタリングの成果

1. **コード削減**: 重複コードを約60%削減
2. **保守性向上**: 新しいツール追加時の実装工数を約50%削減
3. **一貫性**: 全ツールで統一されたパターンを使用
4. **デバッグ効率**: 統一されたログ形式により問題の特定が容易に
5. **拡張性**: 新しいバリデーションルールやログ形式の追加が容易に

### 今後の改善余地

1. **BaseToolHandlerの活用**: 各ToolsファイルをBaseToolHandlerを継承したクラスに変換
2. **エラーコードの体系化**: エラーコードの定数化と分類
3. **設定の外部化**: ツール定義の自動生成機能
4. **パフォーマンス最適化**: 並列処理可能な箇所の特定と実装

## バージョン7.2.0の主な更新内容 (2025年7月)

### 新機能

1. **文字列（複数行）フィールドでのis演算子対応**
   - `search_records`ツールで`is empty`、`is not empty`クエリが使用可能
   - エラーハンドリングとドキュメントも更新

2. **アプリアクション設定APIのfilterCondプロパティ対応**
   - `get_app_actions`、`update_app_actions`でアクション実行条件を設定可能
   - kintoneクエリ構文による柔軟な条件指定

3. **クエリ構文ガイダンスの大幅改善**
   - `search_records`ツール定義に11個の実用的なクエリ例を追加
   - `get_query_language_documentation`の包括的な更新
   - エラー時の詳細ガイダンス強化

### 重要な発見事項

#### kintone APIの制限事項
1. **レコード単位のアクセス権限取得**
   - `client.record.getRecordAcl`は存在しない
   - 代わりに`client.app.getRecordAcl`と`client.app.evaluateRecordsAcl`を使用
   - これらはアプリレベルのAPIで、特定のレコードに対するアクセス権限を評価

2. **ファサードパターンの重要性**
   - KintoneRepositoryクラスがファサードとして機能
   - 新しいツールを追加する際は、必ずKintoneRepositoryにも対応メソッドを追加する必要がある
   - 例: `getViews`, `updateViews`, `getRecordAcl`, `evaluateRecordsAcl`など

### User API関連の制限事項

#### User APIへのアクセス要件
User API（`get_users`、`get_groups`、`get_group_users`）は、cybozu.com共通管理のAPIであり、以下の要件があります：

1. **権限要件**
   - cybozu.com共通管理者権限が必要
   - 通常のkintoneユーザーアカウントではアクセスできません

2. **エラーコード CB_IL02**
   - 「Invalid request」を示すエラー
   - 主に権限不足または認証方法の問題で発生

3. **代替案**
   - cybozu.com共通管理者権限を持つアカウントを使用
   - APIトークン認証の使用を検討（ただし、User APIはAPIトークンをサポートしていない可能性あり）
   - kintone内でのユーザー情報取得は、レコードのCREATOR/MODIFIERフィールドやUSER_SELECTフィールドから間接的に取得

4. **実装詳細**
  - Node.js標準のfetchとFormDataのみで直接HTTPリクエストを実装
   - 認証は`X-Cybozu-Authorization`ヘッダーを使用（Base64エンコードされたusername:password）
   - POSTメソッドで`X-HTTP-Method-Override: GET`ヘッダーを使用（User APIの仕様に準拠）
   - パラメータはリクエストボディにJSON形式で送信

## 貢献ガイドライン

### プルリクエストの作成方法

1. フィーチャーブランチを作成: `feature/ツール名-機能説明`
2. コミットメッセージは日本語で記述（絵文字プレフィックス使用）
3. 新しいツールは必ずツール定義とドキュメントをセットで追加
4. CLAUDE.mdの更新も忘れずに

### コードレビューチェックリスト

- [ ] ValidationUtilsを使用した入力検証
- [ ] LoggingUtilsを使用したログ出力
- [ ] ResponseBuilderを使用したレスポンス生成
- [ ] エラーハンドリングの実装
- [ ] ツール定義のアノテーション設定
- [ ] KintoneRepositoryファサードへのメソッド追加
- [ ] 既存のコーディング規約に準拠

この包括的なドキュメントにより、開発者はkintone MCP Serverの全機能を理解し、効果的に活用できるようになります。
