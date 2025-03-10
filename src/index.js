#!/usr/bin/env node
// src/index.js
import { MCPServer } from './server/MCPServer.js';

// 環境変数からkintoneの認証情報を取得
const domain = process.env.KINTONE_DOMAIN;
const username = process.env.KINTONE_USERNAME;
const password = process.env.KINTONE_PASSWORD;

// 認証情報のチェック
if (!domain || !username || !password) {
    console.error('Error: kintone credentials not provided.');
    console.error('Please set the following environment variables:');
    console.error('  - KINTONE_DOMAIN: Your kintone domain (e.g. example.cybozu.com)');
    console.error('  - KINTONE_USERNAME: Your kintone username');
    console.error('  - KINTONE_PASSWORD: Your kintone password');
    process.exit(1);
}

// MCPサーバーの起動
try {
    const server = new MCPServer(domain, username, password);
    server.run().catch(error => {
        console.error('Failed to start MCP server:', error);
        process.exit(1);
    });
} catch (error) {
    console.error('Error initializing MCP server:', error);
    process.exit(1);
}
