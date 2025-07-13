# kintone MCP Server インストールガイド （ CLINE 向け ）

このガイドは CLINE などの LLM クライアントで kintone-mcp-server をインストールおよび設定する手順を示します。

## 前提条件

- Node.js v20 以上がインストールされていること
- npm が使用可能であること
- CLINE（または Claude Desktop）がインストールされていること

## インストール手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/r3-yamauchi/kintone-mcp-server.git
cd kintone-mcp-server
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. MCP サーバーの設定

CLINE の設定ファイルに kintone MCP サーバーを追加します。

#### 設定ファイルの場所

- **CLINE（VSCode 拡張機能）**:
  - macOS/Linux: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
  - Windows: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

- **Claude Desktop**:
  - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

#### 設定内容の追加

以下の設定を `"mcpServers"` セクションに追加してください。

```json
{
  "mcpServers": {
    "kintone": {
      "command": "node",
      "args": [
        "/絶対パス/kintone-mcp-server/server.js"
      ],
      "env": {
        "KINTONE_DOMAIN": "your-subdomain.cybozu.com",
        "KINTONE_USERNAME": "your-kintone-username",
        "KINTONE_PASSWORD": "your-kintone-password"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

**注意**:

- `/絶対パス/kintone-mcp-server/server.js` は、クローンしたリポジトリの `server.js` への絶対パスに置き換えてください。
- `KINTONE_DOMAIN` は、ご利用の kintone サブドメイン（例: `example.cybozu.com`）に置き換えてください。
- `KINTONE_USERNAME` と `KINTONE_PASSWORD` は、kintone にアクセスするための認証情報を入力してください。

### 4. CLINE または Claude Desktop の再起動

設定ファイルを保存した後、CLINE または Claude Desktop を再起動して設定を反映させてください。

## 動作確認

CLINE に以下のようなプロンプトを入力して、kintone MCP サーバーが正常に動作しているか確認できます。

```text
kintone MCP サーバーを使用して、アプリ ID 123 のレコードを取得してください。
```

## トラブルシューティング

- **Node.js のバージョン確認**:

```bash
node -v
```

  バージョンが 20 以上であることを確認してください。

- **設定ファイルの JSON 構文エラー**:
  設定ファイルが正しい JSON 構文で記述されているか確認してください。

- **kintone 認証情報の確認**:
  `KINTONE_USERNAME` と `KINTONE_PASSWORD` が正しいか確認してください。

- **サーバーの起動確認**:

```bash
node /絶対パス/kintone-mcp-server/server.js
```

  エラーが出力されないか確認してください。

## セキュリティ上の注意

- `KINTONE_PASSWORD` を設定ファイルに平文で記述することになるため、設定ファイルのアクセス権限を適切に設定し、第三者が閲覧できないようにしてください。

---

このガイドに従って設定を行うことで、CLINE から kintone にアクセスし、データの取得や更新が可能になります。
