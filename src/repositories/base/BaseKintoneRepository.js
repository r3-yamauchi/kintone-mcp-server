// src/repositories/base/BaseKintoneRepository.js
import { createKintoneClient } from './http/createKintoneClient.js';
import { KintoneApiError } from './http/KintoneApiError.js';
import { LoggingUtils } from '../../utils/LoggingUtils.js';

export class BaseKintoneRepository {
    constructor(credentials) {
        this.credentials = credentials;
        this.client = createKintoneClient(credentials);
    }

    // エラーハンドリングを共通化
    handleKintoneError(error, operation) {
        if (error instanceof KintoneApiError) {
            LoggingUtils.error('repository', 'kintone_api_error', error, {
                status: error.status,
                code: error.code,
                errors: error.errors,
            });
            throw new Error(`kintone API Error: ${error.code} - ${error.message}`);
        }
        LoggingUtils.error('repository', 'unexpected_error', error);
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
