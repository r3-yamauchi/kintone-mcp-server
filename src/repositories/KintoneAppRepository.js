// src/repositories/KintoneAppRepository.js
import { BaseKintoneRepository } from './base/BaseKintoneRepository.js';
import { KintoneRestAPIError } from '@kintone/rest-api-client';
import { KintoneFormRepository } from './KintoneFormRepository.js';
import { KintonePreviewRepository } from './KintonePreviewRepository.js';

/**
 * kintoneアプリの基本操作を担当するリポジトリクラス
 */
export class KintoneAppRepository extends BaseKintoneRepository {
    /**
     * コンストラクタ
     * @param {Object} client kintone REST APIクライアント
     */
    constructor(client) {
        super(client);
        this.formRepository = new KintoneFormRepository(client);
        this.previewRepository = new KintonePreviewRepository(client);
    }

    async getAppsInfo(appName) {
        try {
            console.error(`Fetching apps info: ${appName}`);
            const response = await this.client.app.getApps({
                name: appName,
            });
            console.error('Response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get apps info ${appName}`);
        }
    }

    async createApp(name, space = null, thread = null) {
        try {
            console.error(`Creating new app: ${name}`);
            const params = { name };
            if (space) params.space = space;
            if (thread) params.thread = thread;

            const response = await this.client.app.addApp(params);
            console.error('App creation response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `create app ${name}`);
        }
    }

    /**
     * アプリにフィールドを追加
     * @param {number} appId アプリID
     * @param {Object} properties フィールドプロパティ
     * @returns {Promise<Object>} 追加結果
     */
    async addFields(appId, properties) {
        return this.formRepository.addFields(appId, properties);
    }

    async deployApp(apps) {
        try {
            console.error(`Deploying apps:`, apps);
            const response = await this.client.app.deployApp({
                apps: apps.map(appId => ({
                    app: appId,
                    revision: -1 // 最新のリビジョンを使用
                }))
            });
            console.error('Deploy response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `deploy apps ${apps.join(', ')}`);
        }
    }

    async getDeployStatus(apps) {
        try {
            console.error(`Checking deploy status for apps:`, apps);
            const response = await this.client.app.getDeployStatus({
                apps: apps
            });
            console.error('Deploy status:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get deploy status for apps ${apps.join(', ')}`);
        }
    }

    async updateAppSettings(appId, settings) {
        try {
            console.error(`Updating app settings for app ${appId}`);
            console.error('Settings:', settings);

            const params = {
                app: appId,
                ...settings
            };

            const response = await this.client.app.updateAppSettings(params);
            console.error('Update response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `update app settings for app ${appId}`);
        }
    }

    /**
     * アプリのフォームレイアウト情報を取得
     * @param {number} appId アプリID
     * @returns {Promise<Object>} レイアウト情報
     */
    async getFormLayout(appId) {
        return this.formRepository.getFormLayout(appId);
    }
    
    /**
     * アプリのフィールド情報を取得
     * @param {number} appId アプリID
     * @returns {Promise<Object>} フィールド情報
     */
    async getFormFields(appId) {
        return this.formRepository.getFormFields(appId);
    }

    /**
     * プレビュー環境のアプリ設定を取得
     * @param {number} appId アプリID
     * @param {string} lang 言語設定（オプション）
     * @returns {Promise<Object>} アプリ設定情報
     */
    async getPreviewAppSettings(appId, lang) {
        return this.previewRepository.getPreviewAppSettings(appId, lang);
    }

    /**
     * プレビュー環境のフォームフィールド情報を取得
     * @param {number} appId アプリID
     * @param {string} lang 言語設定（オプション）
     * @returns {Promise<Object>} フィールド情報
     */
    async getPreviewFormFields(appId, lang) {
        return this.previewRepository.getPreviewFormFields(appId, lang);
    }

    /**
     * プレビュー環境のフォームレイアウト情報を取得
     * @param {number} appId アプリID
     * @returns {Promise<Object>} レイアウト情報
     */
    async getPreviewFormLayout(appId) {
        return this.previewRepository.getPreviewFormLayout(appId);
    }

    /**
     * フォームレイアウトを更新
     * @param {number} appId アプリID
     * @param {Array} layout レイアウト配列
     * @param {number} revision リビジョン番号（省略時は最新）
     * @returns {Promise<Object>} 更新結果
     */
    async updateFormLayout(appId, layout, revision = -1) {
        return this.formRepository.updateFormLayout(appId, layout, revision);
    }

    /**
     * フォームフィールドを更新
     * @param {number} appId アプリID
     * @param {Object} properties フィールドプロパティ
     * @param {number} revision リビジョン番号（省略時は最新）
     * @returns {Promise<Object>} 更新結果
     */
    async updateFormFields(appId, properties, revision = -1) {
        return this.formRepository.updateFormFields(appId, properties, revision);
    }

    /**
     * フォームフィールドを削除
     * @param {number} appId アプリID
     * @param {Array<string>} fields 削除するフィールドコードの配列
     * @param {number} revision リビジョン番号（省略時は最新）
     * @returns {Promise<Object>} 削除結果
     */
    async deleteFormFields(appId, fields, revision = -1) {
        return this.formRepository.deleteFormFields(appId, fields, revision);
    }

    // アプリを指定したスペースに移動させるメソッド
    async moveAppToSpace(appId, spaceId) {
        try {
            console.error(`Moving app ${appId} to space ${spaceId}`);
            await this.client.app.move({
                app: appId,
                space: spaceId
            });
            return { success: true };
        } catch (error) {
            this.handleKintoneError(error, `move app ${appId} to space ${spaceId}`);
        }
    }

    // アプリをスペースに所属させないようにするメソッド
    async moveAppFromSpace(appId) {
        try {
            console.error(`Moving app ${appId} from space`);
            await this.client.app.move({
                app: appId,
                space: null
            });
            return { success: true };
        } catch (error) {
            // kintoneシステム設定による制限の場合の特別なエラーハンドリング
            if (error.code === 'CB_NO01' || 
                (error.message && error.message.includes('スペースに所属しないアプリの作成を許可'))) {
                throw new Error(
                    `アプリ ${appId} をスペースに所属させないようにすることができませんでした。\n\n` +
                    `【考えられる原因】\n` +
                    `kintoneシステム管理の「利用する機能の選択」で「スペースに所属しないアプリの作成を許可する」が無効になっている可能性があります。\n\n` +
                    `【対応方法】\n` +
                    `1. kintone管理者に「スペースに所属しないアプリの作成を許可する」設定を有効にするよう依頼してください。\n` +
                    `2. または、アプリを別のスペースに移動する方法を検討してください。`
                );
            }
            this.handleKintoneError(error, `move app ${appId} from space`);
        }
    }

    /**
     * アプリのアクション設定を取得
     * @param {number} appId アプリID
     * @param {string} lang 言語設定（オプション）
     * @returns {Promise<Object>} アクション設定情報
     */
    async getAppActions(appId, lang) {
        try {
            console.error(`Fetching app actions for app: ${appId}`);
            const params = { app: appId };
            if (lang) params.lang = lang;
            
            const response = await this.client.app.getAppActions(params);
            console.error('App actions response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get app actions for app ${appId}`);
        }
    }

    /**
     * アプリに追加されているプラグインの一覧を取得
     * @param {number} appId アプリID
     * @returns {Promise<Object>} プラグイン情報
     */
    async getAppPlugins(appId) {
        try {
            console.error(`Fetching plugins for app: ${appId}`);
            const response = await this.client.app.getPlugins({
                app: appId
            });
            console.error('Plugins response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get app plugins for app ${appId}`);
        }
    }

    /**
     * アプリのプロセス管理設定を取得
     * @param {number} appId アプリID
     * @returns {Promise<Object>} プロセス管理設定情報
     */
    async getProcessManagement(appId) {
        try {
            console.error(`Fetching process management for app: ${appId}`);
            
            const response = await this.client.app.getProcessManagement({
                app: appId
            });
            
            console.error('Process management response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get process management for app ${appId}`);
        }
    }
}
