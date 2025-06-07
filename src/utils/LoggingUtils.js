// src/utils/LoggingUtils.js
/**
 * 共通ログユーティリティ
 * 統一されたログ形式を提供
 */
export class LoggingUtils {
    /**
     * 操作ログを出力
     * @param {string} operation - 操作名
     * @param {Object|string} params - パラメータ
     */
    static logOperation(operation, params) {
        if (typeof params === 'object') {
            console.error(`${operation}: ${JSON.stringify(params)}`);
        } else {
            console.error(`${operation}: ${params}`);
        }
    }
    
    /**
     * 詳細な操作ログを出力
     * @param {string} operation - 操作名
     * @param {string} primaryInfo - 主要情報
     * @param {Object} details - 詳細情報
     */
    static logDetailedOperation(operation, primaryInfo, details) {
        console.error(`${operation}: ${primaryInfo}`);
        if (details && Object.keys(details).length > 0) {
            console.error('Details:', JSON.stringify(details, null, 2));
        }
    }
    
    /**
     * ツール実行ログを出力
     * @param {string} toolCategory - ツールカテゴリ
     * @param {string} toolName - ツール名
     * @param {Object} args - 引数
     */
    static logToolExecution(toolCategory, toolName, args) {
        console.error(`[${toolCategory}] Executing tool: ${toolName}`);
        if (args && Object.keys(args).length > 0) {
            // app_id, record_id などの主要なIDは最初に表示
            const primaryKeys = ['app_id', 'record_id', 'space_id', 'thread_id'];
            const primaryInfo = {};
            const otherInfo = {};
            
            for (const [key, value] of Object.entries(args)) {
                if (primaryKeys.includes(key)) {
                    primaryInfo[key] = value;
                } else {
                    otherInfo[key] = value;
                }
            }
            
            if (Object.keys(primaryInfo).length > 0) {
                console.error('Primary params:', JSON.stringify(primaryInfo));
            }
            
            if (Object.keys(otherInfo).length > 0) {
                console.error('Additional params:', JSON.stringify(otherInfo, null, 2));
            }
        }
    }
    
    /**
     * API呼び出しログを出力
     * @param {string} apiMethod - APIメソッド名
     * @param {Object} params - パラメータ
     */
    static logApiCall(apiMethod, params) {
        console.error(`API Call: ${apiMethod}`);
        if (params) {
            console.error('Request params:', JSON.stringify(params, null, 2));
        }
    }
    
    /**
     * APIレスポンスログを出力
     * @param {string} apiMethod - APIメソッド名
     * @param {Object} response - レスポンス
     * @param {boolean} detailed - 詳細表示するか
     */
    static logApiResponse(apiMethod, response, detailed = false) {
        if (detailed) {
            console.error(`API Response for ${apiMethod}:`, JSON.stringify(response, null, 2));
        } else {
            // 基本的な情報のみ表示
            const summary = {};
            if (response) {
                if (response.id) summary.id = response.id;
                if (response.ids) summary.ids = response.ids;
                if (response.revision) summary.revision = response.revision;
                if (response.records) summary.recordCount = response.records.length;
                if (response.totalCount !== undefined) summary.totalCount = response.totalCount;
                if (response.success !== undefined) summary.success = response.success;
            }
            console.error(`API Response for ${apiMethod}:`, summary);
        }
    }
    
    /**
     * エラーログを出力
     * @param {string} context - エラーコンテキスト
     * @param {Error} error - エラーオブジェクト
     */
    static logError(context, error) {
        console.error(`Error in ${context}:`, {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
    }
    
    /**
     * 警告ログを出力
     * @param {string} context - 警告コンテキスト
     * @param {string} message - 警告メッセージ
     */
    static logWarning(context, message) {
        console.error(`Warning in ${context}: ${message}`);
    }
}