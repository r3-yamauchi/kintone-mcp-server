#!/usr/bin/env node
// src/index.js
import { MCPServer } from './server/MCPServer.js';
import dotenv from 'dotenv';

// .envファイルを読み込む
dotenv.config();

// 環境変数からkintoneの認証情報を取得
let domain = process.env.KINTONE_DOMAIN;
let username = process.env.KINTONE_USERNAME;
let password = process.env.KINTONE_PASSWORD;

// 認証情報のチェック
if (!domain || !username || !password) {
    console.error('環境変数からkintone認証情報を取得できませんでした。');
    
    // .envファイルから読み込まれた値を確認
    if (!domain) domain = process.env.KINTONE_DOMAIN;
    if (!username) username = process.env.KINTONE_USERNAME;
    if (!password) password = process.env.KINTONE_PASSWORD;
    
    // .envファイルからも取得できなかった場合
    if (!domain || !username || !password) {
        console.error('Error: kintone credentials not provided.');
        console.error('Please set the following environment variables:');
        console.error('  - KINTONE_DOMAIN: Your kintone domain (e.g. example.cybozu.com)');
        console.error('  - KINTONE_USERNAME: Your kintone username');
        console.error('  - KINTONE_PASSWORD: Your kintone password');
        process.exit(1);
    } else {
        console.error('.envファイルから認証情報を読み込みました。');
    }
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
