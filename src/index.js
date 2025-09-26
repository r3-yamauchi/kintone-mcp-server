#!/usr/bin/env node
// src/index.js
import { MCPServer } from './server/MCPServer.js';
import dotenv from 'dotenv';
import { LoggingUtils } from './utils/LoggingUtils.js';

// 環境変数からkintoneの認証情報を取得
let domain = process.env.KINTONE_DOMAIN;
let username = process.env.KINTONE_USERNAME;
let password = process.env.KINTONE_PASSWORD;

// 環境変数から認証情報が取得できなかった場合、.envファイルを読み込む
if (!domain || !username || !password) {
    LoggingUtils.warn('startup', 'missing_environment_credentials');
    dotenv.config();
    
    // .envファイルから読み込まれた値を確認
    domain = process.env.KINTONE_DOMAIN;
    username = process.env.KINTONE_USERNAME;
    password = process.env.KINTONE_PASSWORD;
    
    // .envファイルからも取得できなかった場合
    if (!domain || !username || !password) {
        LoggingUtils.error('startup', 'missing_kintone_credentials', new Error('Credentials not provided'), {
            requiredVariables: ['KINTONE_DOMAIN', 'KINTONE_USERNAME', 'KINTONE_PASSWORD']
        });
        process.exit(1);
    } else {
        LoggingUtils.info('startup', 'credentials_loaded_from_env');
    }
}

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
