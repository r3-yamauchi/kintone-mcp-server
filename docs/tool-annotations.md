# kintone MCP Serverツールアノテーション一覧

このドキュメントは、kintone MCP Serverで提供されている各ツールに対するアノテーション属性を定義しています。
MCP仕様2025-03-26に対応するために追加されたツールアノテーションの実装状況を示しています。

## アノテーション属性

各ツールには以下のアノテーション属性を設定します：

- **readOnly**: ツールが読み取り専用かどうか（データ変更を行わない）
- **safe**: ツールが安全な操作かどうか（誤操作によるリスクが低い）
- **category**: ツールの機能カテゴリ
- **requiresConfirmation**: ユーザー確認が推奨されるかどうか
- **longRunning**: 長時間実行される可能性があるかどうか
- **impact**: 操作の影響範囲（"low", "medium", "high"）

## 1. レコード関連ツール

| ツール名 | readOnly | safe | category | requiresConfirmation | longRunning | impact | 説明 |
|---------|----------|------|----------|----------------------|-------------|--------|------|
| get_record | true | true | record | false | false | low | 単一レコード取得は読み取り専用で安全 |
| search_records | true | true | record | false | true | low | 検索は読み取り専用だが、大量データ取得の可能性あり |
| create_record | false | true | record | true | false | medium | 新規レコード作成は変更操作だがデータ損失リスクは低い |
| update_record | false | false | record | true | false | medium | 既存データ更新は変更操作でデータ損失リスク |
| add_record_comment | false | true | record | false | false | low | コメント追加は変更操作だが影響範囲が限定的 |
| update_record_status | false | false | record | true | false | medium | プロセス管理ステータス更新は重要な変更操作 |
| update_record_assignees | false | false | record | true | false | medium | 作業者更新はアクセス権に影響する変更操作 |
| get_record_comments | true | true | record | false | false | low | コメント一覧取得は読み取り専用で安全 |
| update_record_comment | false | false | record | true | false | low | コメント編集は変更操作だが影響範囲が限定的 |
| create_records | false | true | record | true | true | high | 複数レコードの一括作成は大きな変更操作 |
| upsert_record | false | false | record | true | false | medium | レコードの作成または更新を行うUpsert操作 |
| upsert_records | false | false | record | true | true | high | 複数レコードをUpsertする変更操作（既存更新と新規作成を同時に実行） |

## 2. アプリ関連ツール

| ツール名 | readOnly | safe | category | requiresConfirmation | longRunning | impact | 説明 |
|---------|----------|------|----------|----------------------|-------------|--------|------|
| get_apps_info | true | true | app | false | false | low | アプリ名/ID/コード/スペースIDでアプリ情報を取得（app_name または app_id は必須） |
| create_app | false | true | app | true | false | high | 新規アプリ作成は大きな変更だが既存データへの影響なし |
| deploy_app | false | false | app | true | true | high | デプロイは重要な変更操作で時間がかかる場合あり |
| get_deploy_status | true | true | app | false | false | low | デプロイ状態確認は読み取り専用で安全 |
| update_app_settings | false | false | app | true | false | medium | アプリ設定変更は重要な変更操作 |
| get_form_fields | true | true | app | false | false | low | フィールド設定取得は読み取り専用で安全 |
| get_form_layout | true | true | app | false | false | low | フォームレイアウト取得は読み取り専用で安全 |
| get_app_actions | true | true | app | false | false | low | アプリアクションの設定取得は読み取り専用で安全 |
| get_app_plugins | true | true | app | false | false | low | アプリのプラグイン一覧取得は読み取り専用で安全 |
| get_process_management | true | true | app | false | false | low | プロセス管理設定取得は読み取り専用で安全 |
| update_process_management | false | false | app | true | false | high | プロセス管理設定の更新は重要な変更操作 |
| update_form_layout | false | false | app | true | false | medium | レイアウト変更は重要な変更操作 |
| get_preview_app_settings | true | true | app | false | false | low | プレビュー設定取得は読み取り専用で安全 |
| get_preview_form_fields | true | true | app | false | false | low | プレビューフィールド取得は読み取り専用で安全 |
| get_preview_form_layout | true | true | app | false | false | low | プレビューレイアウト取得は読み取り専用で安全 |
| move_app_to_space | false | false | app | true | false | medium | アプリ移動は重要な変更操作 |
| move_app_from_space | false | false | app | true | false | medium | アプリ移動は重要な変更操作 |
| get_views | true | true | app | false | false | low | 一覧（ビュー）設定取得は読み取り専用で安全 |
| update_views | false | false | app | true | false | medium | 一覧（ビュー）設定の更新は重要な変更操作 |
| get_app_acl | true | true | app | false | false | low | アプリアクセス権限取得は読み取り専用で安全 |
| update_app_acl | false | false | app | true | false | high | アプリアクセス権限の更新は重要な変更操作 |
| get_field_acl | true | true | app | false | false | low | フィールドアクセス権限取得は読み取り専用で安全 |
| update_field_acl | false | false | app | true | false | high | フィールドアクセス権限の更新は重要な変更操作 |
| get_reports | true | true | app | false | false | low | グラフ設定取得は読み取り専用で安全 |
| update_reports | false | false | app | true | false | medium | グラフ設定の更新は重要な変更操作 |
| get_notifications | true | true | app | false | false | low | 通知条件設定取得は読み取り専用で安全 |
| update_notifications | false | false | app | true | false | medium | 通知条件設定の更新は重要な変更操作 |
| get_per_record_notifications | true | true | app | false | false | low | レコード単位の通知設定取得は読み取り専用で安全 |
| update_per_record_notifications | false | false | app | true | false | medium | レコード単位の通知設定の更新は重要な変更操作 |
| get_reminder_notifications | true | true | app | false | false | low | リマインダー通知設定取得は読み取り専用で安全 |
| update_reminder_notifications | false | false | app | true | false | medium | リマインダー通知設定の更新は重要な変更操作 |
| update_app_actions | false | false | app | true | false | medium | アプリアクション設定の更新は重要な変更操作 |
| update_plugins | false | false | app | true | false | high | プラグイン設定の更新は重要な変更操作 |
| get_app_customize | true | true | app | false | false | low | JavaScript/CSSカスタマイズ設定取得は読み取り専用で安全 |
| update_app_customize | false | false | app | true | false | high | JavaScript/CSSカスタマイズ設定の更新は重要な変更操作 |
| get_record_acl | true | true | app | false | false | low | レコードアクセス権限取得は読み取り専用で安全 |
| evaluate_records_acl | true | true | app | false | true | low | 複数レコードのアクセス権限評価は読み取り専用で安全 |

## 3. フィールド関連ツール

| ツール名 | readOnly | safe | category | requiresConfirmation | longRunning | impact | 説明 |
|---------|----------|------|----------|----------------------|-------------|--------|------|
| add_fields | false | false | app | true | false | medium | フィールド追加はアプリ構造を変更する重要操作 |
| update_field | false | false | app | true | false | medium | フィールド更新はアプリ構造を変更する重要操作 |
| create_choice_field | true | true | field | false | false | low | 設定生成のみで実際の変更は行わない |
| create_reference_table_field | true | true | field | false | false | low | 設定生成のみで実際の変更は行わない |
| create_lookup_field | true | true | field | false | false | low | 設定生成のみで実際の変更は行わない |

## 4. ファイル関連ツール

| ツール名 | readOnly | safe | category | requiresConfirmation | longRunning | impact | 説明 |
|---------|----------|------|----------|----------------------|-------------|--------|------|
| download_file | true | true | file | false | true | low | ファイルダウンロードは読み取り専用だが大きなファイルの場合時間がかかる |
| upload_file | false | true | file | false | true | medium | ファイルアップロードは変更操作で大きなファイルの場合時間がかかる |

## 5. スペース関連ツール

| ツール名 | readOnly | safe | category | requiresConfirmation | longRunning | impact | 説明 |
|---------|----------|------|----------|----------------------|-------------|--------|------|
| get_space | true | true | space | false | false | low | スペース情報取得は読み取り専用で安全 |
| update_space | false | false | space | true | false | medium | スペース設定変更は重要な変更操作 |
| update_space_body | false | false | space | true | false | medium | スペース本文変更は重要な変更操作 |
| get_space_members | true | true | space | false | false | low | メンバー情報取得は読み取り専用で安全 |
| update_space_members | false | false | space | true | false | high | メンバー変更はアクセス権に影響する重要操作 |
| add_thread | false | true | space | false | false | low | スレッド追加は変更操作だが影響範囲が限定的 |
| update_thread | false | false | space | true | false | medium | スレッド更新は変更操作 |
| add_thread_comment | false | true | space | false | false | low | コメント追加は変更操作だが影響範囲が限定的 |
| add_guests | false | false | user | true | false | high | ゲスト追加はアクセス権に影響する重要操作 |
| update_space_guests | false | false | space | true | false | high | ゲスト更新はアクセス権に影響する重要操作 |

## 6. レイアウト関連ツール

| ツール名 | readOnly | safe | category | requiresConfirmation | longRunning | impact | 説明 |
|---------|----------|------|----------|----------------------|-------------|--------|------|
| create_form_layout | true | true | layout | false | false | low | レイアウト生成のみで実際の変更は行わない |
| add_layout_element | true | true | layout | false | false | low | レイアウト要素追加の設定生成のみで実際の変更は行わない |
| create_group_layout | true | true | layout | false | false | low | グループレイアウト生成のみで実際の変更は行わない |
| create_table_layout | true | true | layout | false | false | low | テーブルレイアウト生成のみで実際の変更は行わない |

## 7. ユーザー関連ツール

| ツール名 | readOnly | safe | category | requiresConfirmation | longRunning | impact | 説明 |
|---------|----------|------|----------|----------------------|-------------|--------|------|
| get_users | true | true | user | false | false | low | ユーザー情報取得は読み取り専用で安全 |
| get_groups | true | true | user | false | false | low | グループ情報取得は読み取り専用で安全 |
| get_group_users | true | true | user | false | false | low | グループユーザー取得は読み取り専用で安全 |
| get_kintone_username | true | true | user | false | false | low | 接続ユーザー名取得は読み取り専用で安全 |
| get_fields | true | true | user | false | false | low | フィールド一覧取得は読み取り専用で安全 |

## 8. システム関連ツール

| ツール名 | readOnly | safe | category | requiresConfirmation | longRunning | impact | 説明 |
|---------|----------|------|----------|----------------------|-------------|--------|------|
| get_kintone_domain | true | true | system | false | false | low | ドメイン情報取得は読み取り専用で安全 |

## 9. ドキュメント関連ツール

| ツール名 | readOnly | safe | category | requiresConfirmation | longRunning | impact | 説明 |
|---------|----------|------|----------|----------------------|-------------|--------|------|
| get_field_type_documentation | true | true | documentation | false | false | low | ドキュメント取得は読み取り専用で安全 |
| get_available_field_types | true | true | documentation | false | false | low | フィールドタイプ一覧取得は読み取り専用で安全 |
| get_documentation_tool_description | true | true | documentation | false | false | low | ツール説明取得は読み取り専用で安全 |
| get_calc_field_documentation | true | true | documentation | false | false | low | 計算フィールドドキュメント取得は読み取り専用で安全 |

## 実装例

```javascript
// 読み取り専用ツールの例
{
  name: 'get_record',
  description: 'kintoneアプリの1レコードを取得します',
  inputSchema: {
    // 既存のスキーマ定義
  },
  annotations: {
    readOnly: true,
    safe: true,
    category: 'record',
    requiresConfirmation: false,
    longRunning: false,
    impact: 'low'
  }
}

// 破壊的操作を行うツールの例
{
  name: 'update_record',
  description: 'kintoneアプリの既存レコードを更新します。各フィールドは { "value": ... } の形式で指定します。',
  inputSchema: {
    // 既存のスキーマ定義
  },
  annotations: {
    readOnly: false,
    safe: false,
    category: 'record',
    requiresConfirmation: true,
    longRunning: false,
    impact: 'medium'
  }
}
