# MCP server for kintone サンプル

これは [kintone](https://kintone.cybozu.co.jp/) との連携目的で使用できる [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) サーバーの簡易なサンプルです。
生成AIを用いて自動作成したものを現状有姿で提供します。

この MCP server を使うと [Claude Desktop](https://claude.ai/download)アプリから kintoneデータへアクセス・更新できます。

クライアントとして Claudeデスクトップアプリを使用する場合は Claude Pro プランのサブスクリプションが必要です。
Windsurf や CLINE で使用することもできます。

<a href="https://glama.ai/mcp/servers/dki958qnks">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/dki958qnks/badge" alt="kintone Server MCP server" />
</a>

## 使い方

### 1. ソースコードをダウンロードする

ダウンロード先はどこでも構いませんが、半角英数のみで構成される、あいだにスペースを含まないパスに入れるのが良いと思います。

### 2. Node.jsをインストールする

Node.js 18 以降を使用してください。

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

### 6. 動作確認

まずは Claude に "kintoneアプリ「*設定したkintoneユーザーでアクセス出来るアプリ名の一例*」のアプリIDを調べて" と尋ねてみてください。
ここで入力するkintoneアプリ名は一言一句正確に指定する必要があります。

### 7. この MCP server が提供している機能の一覧

#### レコード操作

- `get_record`: kintoneアプリの1レコードを取得
- `search_records`: kintoneアプリのレコードを検索
- `create_record`: kintoneアプリに新しいレコードを作成
- `update_record`: kintoneアプリの既存レコードを更新
- `add_record_comment`: kintoneレコードにコメントを追加

#### ファイル操作

- `upload_file`: kintoneにファイルをアップロード
- `download_file`: kintoneからファイルをダウンロード（注意: 現在の実装では1MB以上のファイルは正常にダウンロードできない場合があります）

#### アプリ情報

- `get_apps_info`: 検索キーワードを指定して該当する複数のkintoneアプリの情報を取得
- `get_form_layout`: kintoneアプリのフォームレイアウトを取得

#### アプリ操作

- `create_app`: kintoneアプリの新規作成
- `add_fields`: kintoneアプリへのフィールド追加
- `update_field`: 既存のkintoneフィールドの設定を更新
- `deploy_app`: kintoneアプリの本番運用開始（運用環境へ反映）
- `get_deploy_status`: アプリ設定の運用環境への反映状況を確認する
- `update_form_layout`: kintoneアプリのフォームレイアウトを変更
- `update_app_settings`: アプリの一般設定を変更

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

### 8. その他

その他に、この MCP server を使用してどういったことが出来るか [ブログ](https://www.r3it.com/blog/kintone-mcp-server-20250115-yamauchi) に書いたので読んでみてください。

他にも kintone用の MCP server を公開されている方がおられますので、参考にしながらご自身でオリジナルの MCP server を作ってみるのも良いかもしれません。

**「kintone」はサイボウズ株式会社の登録商標です。**

ここに記載している内容は情報提供を目的としており、個別のサポートはできません。
設定内容についてのご質問やご自身の環境で動作しないといったお問い合わせをいただいても対応はできませんので、ご了承ください。
