// src/repositories/base/BaseKintoneRepository.js
import { KintoneRestAPIClient, KintoneRestAPIError } from '@kintone/rest-api-client';
import { LoggingUtils } from '../../utils/LoggingUtils.js';

export class BaseKintoneRepository {
    constructor(credentials) {
        this.credentials = credentials;
        this.client = new KintoneRestAPIClient({
            baseUrl: `https://${credentials.domain}`,
            auth: {
                username: credentials.username,
                password: credentials.password,
            },
        });
    }

    // エラーハンドリングを共通化
    handleKintoneError(error, operation) {
        if (error instanceof KintoneRestAPIError) {
            console.error('kintone API Error:', {
                status: error.status,
                code: error.code,
                message: error.message,
                errors: error.errors,
            });
            throw new Error(`kintone API Error: ${error.code} - ${error.message}`);
        }
        console.error('Unexpected Error:', error);
        throw new Error(`Failed to ${operation}: ${error.message}`);
    }
    
    /**
     * ログ付きでAPIを実行する共通メソッド
     * @param {string} operation - 操作名
     * @param {Function} apiCall - API呼び出し関数
     * @param {string} errorContext - エラーコンテキスト
     * @returns {Promise<*>} APIレスポンス
     */
    async executeWithLogging(operation, apiCall, errorContext) {
        try {
            LoggingUtils.logOperation(operation, '');
            const response = await apiCall();
            LoggingUtils.logApiResponse(operation, response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, errorContext);
        }
    }
    
    /**
     * パラメータログ付きでAPIを実行する共通メソッド
     * @param {string} operation - 操作名
     * @param {Object} params - APIパラメータ
     * @param {Function} apiCall - API呼び出し関数
     * @param {string} errorContext - エラーコンテキスト
     * @returns {Promise<*>} APIレスポンス
     */
    async executeWithDetailedLogging(operation, params, apiCall, errorContext) {
        try {
            LoggingUtils.logApiCall(operation, params);
            const response = await apiCall();
            LoggingUtils.logApiResponse(operation, response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, errorContext);
        }
    }
}
