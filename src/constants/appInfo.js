// src/constants/appInfo.js
// what: アプリのバージョンとUser-Agentを一元管理する定数群
// why: 外部HTTPリクエストで共通のUser-Agentを設定し、バージョン更新時の同期漏れを防ぐため
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../../package.json');

export const SERVER_VERSION = pkg.version;
export const USER_AGENT = `r3-yamauchi/kintone-mcp-server/${SERVER_VERSION}`;
