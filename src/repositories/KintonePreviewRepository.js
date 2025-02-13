// src/repositories/KintonePreviewRepository.js
import { BaseKintoneRepository } from './base/BaseKintoneRepository.js';
import { KintoneRestAPIError } from '@kintone/rest-api-client';

/**
 * kintoneアプリのプレビュー環境関連操作を担当するリポジトリクラス
 */
export class KintonePreviewRepository extends BaseKintoneRepository {
    /**
     * プレビュー環境のアプリ設定を取得
     * @param {number} appId アプリID
     * @param {string} lang 言語設定（オプション）
     * @returns {Promise<Object>} アプリ設定情報
     */
    async getPreviewAppSettings(appId, lang) {
        try {
            console.error(`Fetching preview app settings for app: ${appId}`);
            
            // プレビュー環境のAPIを呼び出す
            const params = { app: appId, preview: true };
            if (lang) {
                params.lang = lang;
            }
            
            const response = await this.client.app.getAppSettings(params);
            
            console.error('Preview app settings response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get preview app settings for app ${appId}`);
        }
    }

    /**
     * プレビュー環境のフォームフィールド情報を取得
     * @param {number} appId アプリID
     * @param {string} lang 言語設定（オプション）
     * @returns {Promise<Object>} フィールド情報
     */
    async getPreviewFormFields(appId, lang) {
        try {
            console.error(`Fetching preview form fields for app: ${appId}`);
            
            // プレビュー環境のAPIを呼び出す
            const params = { app: appId, preview: true };
            if (lang) {
                params.lang = lang;
            }
            
            const response = await this.client.app.getFormFields(params);
            
            console.error('Preview form fields response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get preview form fields for app ${appId}`);
        }
    }

    /**
     * プレビュー環境のフォームレイアウト情報を取得
     * @param {number} appId アプリID
     * @returns {Promise<Object>} レイアウト情報
     */
    async getPreviewFormLayout(appId) {
        try {
            console.error(`Fetching preview form layout for app: ${appId}`);
            
            // プレビュー環境のAPIを呼び出す
            const response = await this.client.app.getFormLayout({
                app: appId,
                preview: true // プレビュー環境を指定
            });
            
            console.error('Preview form layout response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get preview form layout for app ${appId}`);
        }
    }

    /**
     * プレビュー環境のアプリのプロセス管理設定を取得
     * @param {number} appId アプリID
     * @returns {Promise<Object>} プロセス管理設定情報
     */
    async getPreviewProcessManagement(appId) {
        try {
            console.error(`Fetching preview process management for app: ${appId}`);
            
            // プレビュー環境のAPIを呼び出す
            const response = await this.client.app.getProcessManagement({
                app: appId,
                preview: true // プレビュー環境を指定
            });
            
            console.error('Preview process management response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get preview process management for app ${appId}`);
        }
    }
}
