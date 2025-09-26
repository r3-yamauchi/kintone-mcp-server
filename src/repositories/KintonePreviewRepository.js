// src/repositories/KintonePreviewRepository.js
import { BaseKintoneRepository } from './base/BaseKintoneRepository.js';
import { LoggingUtils } from '../utils/LoggingUtils.js';

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
            LoggingUtils.info('preview', 'get_preview_app_settings', { appId, lang });
            
            // プレビュー環境のAPIを呼び出す
            const params = { app: appId, preview: true };
            if (lang) {
                params.lang = lang;
            }
            
            const response = await this.client.app.getAppSettings(params);
            
            LoggingUtils.debug('preview', 'get_preview_app_settings_response', response);
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
            LoggingUtils.info('preview', 'get_preview_form_fields', { appId, lang });
            
            // プレビュー環境のAPIを呼び出す
            const params = { app: appId, preview: true };
            if (lang) {
                params.lang = lang;
            }
            
            const response = await this.client.app.getFormFields(params);
            
            LoggingUtils.debug('preview', 'get_preview_form_fields_response', response);
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
            LoggingUtils.info('preview', 'get_preview_form_layout', { appId });
            
            // プレビュー環境のAPIを呼び出す
            const response = await this.client.app.getFormLayout({
                app: appId,
                preview: true // プレビュー環境を指定
            });
            
            LoggingUtils.debug('preview', 'get_preview_form_layout_response', response);
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
            LoggingUtils.info('preview', 'get_preview_process_management', { appId });
            
            // プレビュー環境のAPIを呼び出す
            const response = await this.client.app.getProcessManagement({
                app: appId,
                preview: true // プレビュー環境を指定
            });
            
            LoggingUtils.debug('preview', 'get_preview_process_management_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get preview process management for app ${appId}`);
        }
    }
}
