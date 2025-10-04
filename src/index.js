#!/usr/bin/env node
// src/index.js
// where: エントリーポイント
// what: 環境変数から認証情報を読み込み MCP サーバーを起動
// why: 明示的な環境設定を必須とし、安全にサーバー起動を制御する
import { MCPServer } from './server/MCPServer.js';
import { LoggingUtils } from './utils/LoggingUtils.js';

const REQUIRED_ENV_VARS = ['KINTONE_DOMAIN', 'KINTONE_USERNAME', 'KINTONE_PASSWORD'];
const missingEnvVars = REQUIRED_ENV_VARS.filter((name) => {
    const value = process.env[name];
    return value === undefined || value === '';
});

if (missingEnvVars.length > 0) {
    LoggingUtils.error('startup', 'missing_kintone_credentials', new Error('Credentials not provided'), {
        requiredVariables: REQUIRED_ENV_VARS,
        missingVariables: missingEnvVars
    });
    process.exit(1);
}

const domain = process.env.KINTONE_DOMAIN;
const username = process.env.KINTONE_USERNAME;
const password = process.env.KINTONE_PASSWORD;

// MCPサーバーの起動
try {
    const server = new MCPServer(domain, username, password);
    server.run().catch(error => {
        LoggingUtils.error('startup', 'mcp_server_run_failed', error);
        process.exit(1);
    });
} catch (error) {
    LoggingUtils.error('startup', 'mcp_server_initialization_failed', error);
    process.exit(1);
}
