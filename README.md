# MCP server for kintone サンプル (Unofficial)

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/r3-yamauchi/kintone-mcp-server)

これは [kintone](https://kintone.cybozu.co.jp/) との連携目的で使用できる [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) サーバーのサンプルコードです。
生成AIを用いて自動作成したものを現状有姿で提供します。

この MCP server を使うと [Claude Desktop](https://claude.ai/download) アプリなどの MCPホストアプリから
kintoneデータを参照・更新したり、kintoneアプリ自体を作成するなどのことができます。

**サイボウズより 公式の MCP Server が提供開始されました。**
特に理由がなければ公式MCP Serverを使用するのが良いと思います。 

## dxtファイル による [Claude Desktop](https://claude.ai/download) アプリ へのインストール手順（推奨）

[https://github.com/r3-yamauchi/kintone-mcp-server/releases](https://github.com/r3-yamauchi/kintone-mcp-server/releases) から最新の [unofficial-kintone-mcp-server-7.3.0.dxt](https://github.com/r3-yamauchi/kintone-mcp-server/releases/download/7.3.0/unofficial-kintone-mcp-server-7.3.0.dxt) をダウンロードし、 
[Claude Desktop](https://claude.ai/download) アプリ の [設定] の [デスクトップアプリ] - [拡張機能] をクリックして、「詳細設定」をクリックしてください。

<!-- markdownlint-disable MD033 -->
<img height="500" src="docs/images/dxt-install1.png" alt="デスクトップアプリの拡張機能設定" style="margin-bottom: 1.6rem;" />
<!-- markdownlint-enable MD033 -->

「拡張機能をインストール...」をクリックし、ダウンロードした unofficial-kintone-mcp-server-7.3.0.dxt を指定してください。

<!-- markdownlint-disable MD033 -->
<img height="600" src="docs/images/dxt-install2.png" alt="dxtファイルによるインストール" style="margin-bottom: 1.6rem;" />
<!-- markdownlint-enable MD033 -->

「インストール」をクリックしてください。

<!-- markdownlint-disable MD033 -->
<img height="500" src="docs/images/dxt-install3.png" alt="kintoneへの接続情報の入力欄" style="margin-bottom: 1.6rem;" />
<!-- markdownlint-enable MD033 -->

接続先の kintone のドメイン, ユーザー名, パスワード を入力して「保存」ボタンをクリックしてください。

<!-- markdownlint-disable MD033 -->
<img height="500" src="docs/images/dxt-install4.png" alt="kintoneへの接続情報の入力欄" style="margin-bottom: 1.6rem;" />
<!-- markdownlint-enable MD033 -->

<!-- markdownlint-disable MD033 -->
<img height="500" src="docs/images/dxt-install5.png" alt="kintoneへの接続情報を入力して保存ボタンをクリック" style="margin-bottom: 1.6rem;" />
<!-- markdownlint-enable MD033 -->

「無効」となっているトグルスイッチをクリックして「有効」にし、設定画面を閉じてください。

<!-- markdownlint-disable MD033 -->
<img height="300" src="docs/images/dxt-install6.png" alt="「有効」にする" style="margin-bottom: 1.6rem;" />
<!-- markdownlint-enable MD033 -->

新規チャット画面を開いてください。
ツールアイコンをクリックすると読み込まれている拡張機能（MCPサーバー）が表示されます。
「unofficial-kintone-mcp-server」が有効になっていれば利用することができます。

<!-- markdownlint-disable MD033 -->
<img height="300" src="docs/images/tool.png" alt="読み込まれている拡張機能（MCPサーバー）の一覧" style="margin-bottom: 1.6rem;" />
<!-- markdownlint-enable MD033 -->

「unofficial-kintone-mcp-server」の右側の「>」をクリックすると、使用できるツールが表示されます。
使用したくないツールがある場合は無効化してください。

<!-- markdownlint-disable MD033 -->
<img height="300" src="docs/images/tools.png" alt="ツールの一覧" style="margin-bottom: 1.6rem;" />
<!-- markdownlint-enable MD033 -->

## dxtファイルを使用しない場合の Claude Desktopアプリ へのインストール手順

### 1. ソースコードをダウンロードする

ダウンロード先はどこでも構いませんが、半角英数のみで構成される、あいだにスペースを含まないパスに入れるのが良いと思います。

### 2. Node.jsをインストールする

Node.js 20 以降を使用してください。

### 3. npm installする

```bash
npm i
```

### 4. Claude Desktopアプリの設定ファイルを編集する

claude_desktop_config.json という設定ファイルを探して、以下を参考に、このファイルの "mcpServers" の項に設定を追加してください。

```json
{
  "mcpServers": {
    "kintone": {
      "command": "node",
      "env": {
        "KINTONE_DOMAIN": "[あなたが使用するサブドメイン].cybozu.com",
        "KINTONE_USERNAME": "MCP接続で使用するkintoneユーザー名",
        "KINTONE_PASSWORD": "kintoneユーザーのパスワード（平文）"
      },
      "args": [
        "[kintone-mcp-serverを配置したパス]/server.js"
      ]
    }
  }
}
```

### 5. Claude Desktopアプリを再起動する

claude_desktop_config.json への変更を保存したのち、Claude Desktopアプリを一度終了させて再起動してください。
アプリを終了させたように見えても常駐したまま残っている場合があるため、常駐アイコンを右クリックしてQuitしてください。

## 使い方

### 1. 動作確認

まずは Claude に "kintoneアプリ「*設定したkintoneユーザーでアクセス出来るアプリ名の一例*」のアプリIDを調べて" と尋ねてみてください。
ここで入力するkintoneアプリ名は一言一句正確に指定する必要があります。

### 2. この MCP server が提供している機能の一覧

各ツールのアノテーション属性については [docs/tool-annotations.md](docs/tool-annotations.md) を参照してください。

#### レコード操作

- `get_record`: kintoneアプリの1レコードを取得
- `search_records`: kintoneアプリのレコードを検索
- `create_record`: kintoneアプリに新しいレコードを作成
- `update_record`: kintoneアプリの既存レコードを更新
- `upsert_record`: kintoneアプリの重複禁止フィールドを指定してレコードを作成または更新（Upsert操作）
- `add_record_comment`: kintoneレコードにコメントを追加
- `update_record_status`: kintoneレコードのステータスを更新（プロセス管理）
- `update_record_assignees`: kintoneレコードの作業者を更新（プロセス管理）
- `get_record_comments`: kintoneレコードのコメントを取得
- `update_record_comment`: kintoneレコードの既存コメントを更新

#### ファイル操作

- `upload_file`: kintoneにファイルをアップロード
- `download_file`: kintoneからファイルをダウンロード（注意: 現在の実装では1MB以上のファイルは正常にダウンロードできない場合があります）

#### アプリ情報

- `get_apps_info`: 検索キーワードを指定して該当する複数のkintoneアプリの情報を取得
- `get_form_layout`: kintoneアプリのフォームレイアウトを取得
- `get_app_actions`: kintoneアプリのアプリアクション設定を取得
- `get_app_plugins`: kintoneアプリに追加されているプラグインの一覧を取得
- `get_process_management`: kintoneアプリのプロセス管理設定を取得
- `get_app_acl`: kintoneアプリのアクセス権限を取得
- `get_field_acl`: kintoneアプリのフィールドのアクセス権限を取得
- `get_record_acl`: 指定したレコードのアクセス権限を取得
- `evaluate_records_acl`: 指定した条件でレコードのアクセス権限を評価
- `get_views`: kintoneアプリの一覧（ビュー）の設定を取得
- `get_reports`: kintoneアプリのグラフ設定を取得
- `get_notifications`: kintoneアプリの通知条件設定を取得
- `get_per_record_notifications`: kintoneアプリのレコード単位の通知設定を取得
- `get_reminder_notifications`: kintoneアプリのリマインダー通知設定を取得

#### アプリ操作

- `create_app`: kintoneアプリの新規作成
- `add_fields`: kintoneアプリへのフィールド追加
- `update_field`: 既存のkintoneフィールドの設定を更新
- `update_form_layout`: kintoneアプリのフォームレイアウトを変更
- `update_app_settings`: アプリの一般設定を変更
- `deploy_app`: kintoneアプリの本番運用開始（運用環境へ反映）
- `get_deploy_status`: アプリ設定の運用環境への反映状況を確認する
- `move_app_to_space`: kintoneアプリを指定したスペースに移動
- `move_app_from_space`: kintoneアプリをスペースに所属させないようにする
- `update_app_acl`: kintoneアプリのアクセス権限を更新
- `update_field_acl`: kintoneアプリのフィールドのアクセス権限を更新
- `update_views`: kintoneアプリの一覧（ビュー）の設定を更新
- `update_reports`: kintoneアプリのグラフ設定を更新
- `update_notifications`: kintoneアプリの通知条件設定を更新
- `update_per_record_notifications`: kintoneアプリのレコード単位の通知設定を更新
- `update_reminder_notifications`: kintoneアプリのリマインダー通知設定を更新
- `update_process_management`: kintoneアプリのプロセス管理設定を更新
- `update_app_actions`: kintoneアプリのアクション設定を更新

#### スペース操作

- `get_space`: スペースの一般情報を取得
- `update_space`: スペースの設定を更新
- `update_space_body`: スペースの本文を更新
- `get_space_members`: スペースメンバーのリストを取得
- `update_space_members`: スペースメンバーを更新
- `add_thread`: スペースにスレッドを追加
- `update_thread`: スレッドを更新
- `add_thread_comment`: スレッドにコメントを追加
- `add_guests`: ゲストユーザーを追加
- `update_space_guests`: スペースのゲストメンバーを更新

#### ユーザー・グループ情報

- `get_users`: kintoneのユーザー情報を取得
- `get_groups`: kintoneのグループ情報を取得
- `get_group_users`: 指定したグループに所属するユーザーの一覧を取得

#### kintone接続情報

- `get_kintone_domain`: kintoneの接続先ドメインを取得
- `get_kintone_username`: kintoneへの接続に使用されるユーザー名を取得

## その他

この MCP server を使用してどういったことが出来るかブログに書いたので読んでみてください。

- [kintoneと生成AI(Claude)のちょっとイイ関係](https://www.r3it.com/blog/kintone-mcp-server-20250115-yamauchi)
- [kintone AIラボ と kintone用 MCP Server の現在地](https://www.r3it.com/blog/kintone-ai-lab-20250501-yamauchi)

Webブラウザー版の Claude からも利用できる OAuth をサポートした リモートMCPサーバー のコードを 別途 [こちら](https://github.com/r3-yamauchi/kintone-oauth-mcp-server-cfw) で公開しています。

**「kintone」はサイボウズ株式会社の登録商標です。**

ここに記載している内容は情報提供を目的としており、個別のサポートはできません。
設定内容についてのご質問やご自身の環境で動作しないといったお問い合わせをいただいても対応はできませんので、ご了承ください。
