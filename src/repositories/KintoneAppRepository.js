// src/repositories/KintoneAppRepository.js
import { BaseKintoneRepository } from './base/BaseKintoneRepository.js';
import { KintoneFormRepository } from './KintoneFormRepository.js';
import { KintonePreviewRepository } from './KintonePreviewRepository.js';
import { LoggingUtils } from '../utils/LoggingUtils.js';

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

    async getAppsInfo({ appName, appId, appCode, spaceId }) {
        const params = {
            ids: appId ? [appId] : []
        };

        if (appName) {
            params.name = appName;
        }

        if (appCode) {
            params.codes = [appCode];
        }

        if (spaceId) {
            params.spaceIds = [spaceId];
        }

        return this.executeWithDetailedLogging(
            'getApps',
            params,
            () => this.client.app.getApps(params),
            `get apps info ${appName || ''}${appId ? ` (id: ${appId})` : ''}${appCode ? ` (code: ${appCode})` : ''}${spaceId ? ` (space: ${spaceId})` : ''}`
        );
    }

    async createApp(name, space = null, thread = null) {
        const params = { name };
        if (space) params.space = space;
        if (thread) params.thread = thread;

        return this.executeWithDetailedLogging(
            'addApp',
            params,
            () => this.client.app.addApp(params),
            `create app ${name}`
        );
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
        const params = {
            apps: apps.map(appId => ({
                app: appId,
                revision: -1 // 最新のリビジョンを使用
            }))
        };
        return this.executeWithDetailedLogging(
            'deployApp',
            params,
            () => this.client.app.deployApp(params),
            `deploy apps ${apps.join(', ')}`
        );
    }

    async getDeployStatus(apps) {
        const params = { apps: apps };
        return this.executeWithDetailedLogging(
            'getDeployStatus',
            params,
            () => this.client.app.getDeployStatus(params),
            `get deploy status for apps ${apps.join(', ')}`
        );
    }

    async updateAppSettings(appId, settings) {
        const params = {
            app: appId,
            ...settings
        };
        return this.executeWithDetailedLogging(
            'updateAppSettings',
            params,
            () => this.client.app.updateAppSettings(params),
            `update app settings for app ${appId}`
        );
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
            LoggingUtils.info('app', 'move_app_to_space', { appId, spaceId });
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
            LoggingUtils.info('app', 'move_app_from_space', { appId });
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
            const params = { app: appId };
            if (lang) params.lang = lang;
            
            const response = await this.client.app.getAppActions(params);
            LoggingUtils.info('app', 'get_app_actions', { appId, lang });
            LoggingUtils.debug('app', 'get_app_actions_response', response);
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
            LoggingUtils.info('app', 'get_app_plugins', { appId });
            const response = await this.client.app.getPlugins({
                app: appId
            });
            LoggingUtils.debug('app', 'get_app_plugins_response', response);
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
            LoggingUtils.info('app', 'get_process_management', { appId });
            
            const response = await this.client.app.getProcessManagement({
                app: appId
            });
            
            LoggingUtils.debug('app', 'get_process_management_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get process management for app ${appId}`);
        }
    }

    /**
     * アプリのプロセス管理設定を更新
     * @param {number} appId アプリID
     * @param {boolean} enable プロセス管理を有効にするか
     * @param {Object} states ステータス設定
     * @param {Array} actions アクション設定
     * @param {number} revision リビジョン番号
     * @returns {Promise<Object>} 更新結果
     */
    async updateProcessManagement(appId, enable, states, actions, revision = -1) {
        try {
            LoggingUtils.info('app', 'update_process_management', { appId, enable, hasStates: Boolean(states), hasActions: Boolean(actions) });
            LoggingUtils.debug('app', 'update_process_management_payload', { states, actions, revision });
            
            const params = {
                app: appId,
                enable: enable
            };
            
            if (states) {
                params.states = states;
            }
            
            if (actions) {
                params.actions = actions;
            }
            
            if (revision && revision !== -1) {
                params.revision = revision;
            }
            
            const response = await this.client.app.updateProcessManagement(params);
            LoggingUtils.debug('app', 'update_process_management_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `update process management for app ${appId}`);
        }
    }

    /**
     * アプリのビュー設定を取得
     * @param {number} appId アプリID
     * @param {boolean} preview プレビュー環境かどうか
     * @returns {Promise<Object>} ビュー設定情報
     */
    async getViews(appId, preview = false) {
        try {
            LoggingUtils.info('app', 'get_views', { appId, preview: Boolean(preview) });
            
            const params = { app: appId };
            if (preview) {
                params.preview = true;
            }
            
            const response = await this.client.app.getViews(params);
            LoggingUtils.debug('app', 'get_views_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get views for app ${appId}`);
        }
    }

    /**
     * アプリのビュー設定を更新
     * @param {number} appId アプリID
     * @param {Object} views ビュー設定
     * @param {number} revision リビジョン番号
     * @returns {Promise<Object>} 更新結果
     */
    async updateViews(appId, views, revision = -1) {
        try {
            LoggingUtils.info('app', 'update_views', { appId, revision });
            LoggingUtils.debug('app', 'update_views_payload', views);
            
            const params = {
                app: appId,
                views: views
            };
            
            if (revision && revision !== -1) {
                params.revision = revision;
            }
            
            const response = await this.client.app.updateViews(params);
            LoggingUtils.debug('app', 'update_views_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `update views for app ${appId}`);
        }
    }

    /**
     * アプリのアクセス権限を取得
     * @param {number} appId アプリID
     * @param {boolean} preview プレビュー環境かどうか
     * @returns {Promise<Object>} アクセス権限情報
     */
    async getAppAcl(appId, preview = false) {
        try {
            LoggingUtils.info('app', 'get_app_acl', { appId, preview: Boolean(preview) });
            
            const params = { app: appId };
            if (preview) {
                params.preview = true;
            }
            
            const response = await this.client.app.getAppAcl(params);
            LoggingUtils.debug('app', 'get_app_acl_response', response);
            return {
                acl: response.rights,
                revision: response.revision
            };
        } catch (error) {
            this.handleKintoneError(error, `get app ACL for app ${appId}`);
        }
    }

    /**
     * フィールドのアクセス権限を取得
     * @param {number} appId アプリID
     * @param {boolean} preview プレビュー環境かどうか
     * @returns {Promise<Object>} フィールドアクセス権限情報
     */
    async getFieldAcl(appId, preview = false) {
        try {
            LoggingUtils.info('app', 'get_field_acl', { appId, preview: Boolean(preview) });
            
            const params = { app: appId };
            if (preview) {
                params.preview = true;
            }
            
            const response = await this.client.app.getFieldAcl(params);
            LoggingUtils.debug('app', 'get_field_acl_response', response);
            return {
                rights: response.rights,
                revision: response.revision
            };
        } catch (error) {
            this.handleKintoneError(error, `get field ACL for app ${appId}`);
        }
    }

    /**
     * フィールドのアクセス権限を更新
     * @param {number} appId アプリID
     * @param {Array} rights フィールドアクセス権限設定
     * @param {number} revision リビジョン番号
     * @returns {Promise<Object>} 更新結果
     */
    async updateFieldAcl(appId, rights, revision = -1) {
        try {
            LoggingUtils.info('app', 'update_field_acl', { appId, revision });
            LoggingUtils.debug('app', 'update_field_acl_payload', rights);
            
            const params = {
                app: appId,
                rights: rights
            };
            
            if (revision && revision !== -1) {
                params.revision = revision;
            }
            
            const response = await this.client.app.updateFieldAcl(params);
            LoggingUtils.debug('app', 'update_field_acl_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `update field ACL for app ${appId}`);
        }
    }

    /**
     * グラフ設定を取得
     * @param {number} appId アプリID
     * @param {boolean} preview プレビュー環境かどうか
     * @returns {Promise<Object>} グラフ設定情報
     */
    async getReports(appId, preview = false) {
        try {
            LoggingUtils.info('app', 'get_reports', { appId, preview: Boolean(preview) });
            
            const params = { app: appId };
            if (preview) {
                params.preview = true;
            }
            
            const response = await this.client.app.getReports(params);
            LoggingUtils.debug('app', 'get_reports_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get reports for app ${appId}`);
        }
    }

    /**
     * グラフ設定を更新
     * @param {number} appId アプリID
     * @param {Object} reports グラフ設定
     * @param {number} revision リビジョン番号
     * @returns {Promise<Object>} 更新結果
     */
    async updateReports(appId, reports, revision = -1) {
        try {
            LoggingUtils.info('app', 'update_reports', { appId, revision });
            LoggingUtils.debug('app', 'update_reports_payload', reports);
            
            const params = {
                app: appId,
                reports: reports
            };
            
            if (revision && revision !== -1) {
                params.revision = revision;
            }
            
            const response = await this.client.app.updateReports(params);
            LoggingUtils.debug('app', 'update_reports_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `update reports for app ${appId}`);
        }
    }

    /**
     * 通知条件設定を取得
     * @param {number} appId アプリID
     * @param {boolean} preview プレビュー環境かどうか
     * @returns {Promise<Object>} 通知条件設定情報
     */
    async getNotifications(appId, preview = false) {
        try {
            LoggingUtils.info('app', 'get_notifications', { appId, preview: Boolean(preview) });
            
            const params = { app: appId };
            if (preview) {
                params.preview = true;
            }
            
            const response = await this.client.app.getGeneralNotifications(params);
            LoggingUtils.debug('app', 'get_notifications_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get notifications for app ${appId}`);
        }
    }

    /**
     * 通知条件設定を更新
     * @param {number} appId アプリID
     * @param {Array} notifications 通知条件設定
     * @param {number} revision リビジョン番号
     * @returns {Promise<Object>} 更新結果
     */
    async updateNotifications(appId, notifications, revision = -1) {
        try {
            LoggingUtils.info('app', 'update_notifications', { appId, revision });
            LoggingUtils.debug('app', 'update_notifications_payload', notifications);
            
            const params = {
                app: appId,
                notifications: notifications
            };
            
            if (revision && revision !== -1) {
                params.revision = revision;
            }
            
            const response = await this.client.app.updateGeneralNotifications(params);
            LoggingUtils.debug('app', 'update_notifications_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `update notifications for app ${appId}`);
        }
    }

    /**
     * レコード単位の通知設定を取得
     * @param {number} appId アプリID
     * @param {boolean} preview プレビュー環境かどうか
     * @returns {Promise<Object>} 通知設定情報
     */
    async getPerRecordNotifications(appId, preview = false) {
        try {
            LoggingUtils.info('app', 'get_per_record_notifications', { appId, preview: Boolean(preview) });
            
            const params = { app: appId };
            if (preview) {
                params.preview = true;
            }
            
            const response = await this.client.app.getPerRecordNotifications(params);
            LoggingUtils.debug('app', 'get_per_record_notifications_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get per-record notifications for app ${appId}`);
        }
    }

    /**
     * レコード単位の通知設定を更新
     * @param {number} appId アプリID
     * @param {Array} notifications 通知設定
     * @param {number} revision リビジョン番号
     * @returns {Promise<Object>} 更新結果
     */
    async updatePerRecordNotifications(appId, notifications, revision = -1) {
        try {
            LoggingUtils.info('app', 'update_per_record_notifications', { appId, revision });
            LoggingUtils.debug('app', 'update_per_record_notifications_payload', notifications);
            
            const params = {
                app: appId,
                notifications: notifications
            };
            
            if (revision && revision !== -1) {
                params.revision = revision;
            }
            
            const response = await this.client.app.updatePerRecordNotifications(params);
            LoggingUtils.debug('app', 'update_per_record_notifications_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `update per-record notifications for app ${appId}`);
        }
    }

    /**
     * リマインダー通知設定を取得
     * @param {number} appId アプリID
     * @param {boolean} preview プレビュー環境かどうか
     * @returns {Promise<Object>} 通知設定情報
     */
    async getReminderNotifications(appId, preview = false) {
        try {
            LoggingUtils.info('app', 'get_reminder_notifications', { appId, preview: Boolean(preview) });
            
            const params = { app: appId };
            if (preview) {
                params.preview = true;
            }
            
            const response = await this.client.app.getReminderNotifications(params);
            LoggingUtils.debug('app', 'get_reminder_notifications_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get reminder notifications for app ${appId}`);
        }
    }

    /**
     * リマインダー通知設定を更新
     * @param {number} appId アプリID
     * @param {Array} notifications 通知設定
     * @param {number} revision リビジョン番号
     * @returns {Promise<Object>} 更新結果
     */
    async updateReminderNotifications(appId, notifications, revision = -1) {
        try {
            LoggingUtils.info('app', 'update_reminder_notifications', { appId, revision });
            LoggingUtils.debug('app', 'update_reminder_notifications_payload', notifications);
            
            const params = {
                app: appId,
                notifications: notifications
            };
            
            if (revision && revision !== -1) {
                params.revision = revision;
            }
            
            const response = await this.client.app.updateReminderNotifications(params);
            LoggingUtils.debug('app', 'update_reminder_notifications_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `update reminder notifications for app ${appId}`);
        }
    }

    /**
     * アプリアクション設定を更新
     * @param {number} appId アプリID
     * @param {Object} actions アクション設定
     * @param {number} revision リビジョン番号
     * @returns {Promise<Object>} 更新結果
     */
    async updateAppActions(appId, actions, revision = -1) {
        try {
            LoggingUtils.info('app', 'update_app_actions', { appId, revision });
            LoggingUtils.debug('app', 'update_app_actions_payload', actions);
            
            const params = {
                app: appId,
                actions: actions
            };
            
            if (revision && revision !== -1) {
                params.revision = revision;
            }
            
            const response = await this.client.app.updateAppActions(params);
            LoggingUtils.debug('app', 'update_app_actions_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `update app actions for app ${appId}`);
        }
    }

    /**
     * プラグイン設定を更新
     * @param {number} appId アプリID
     * @param {Object} plugins プラグイン設定
     * @param {number} revision リビジョン番号
     * @returns {Promise<Object>} 更新結果
     */
    async updatePlugins(appId, plugins, revision = -1) {
        try {
            LoggingUtils.info('app', 'update_plugins', { appId, revision });
            LoggingUtils.debug('app', 'update_plugins_payload', plugins);
            
            const params = {
                app: appId,
                plugins: plugins
            };
            
            if (revision && revision !== -1) {
                params.revision = revision;
            }
            
            const response = await this.client.app.updatePlugins(params);
            LoggingUtils.debug('app', 'update_plugins_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `update plugins for app ${appId}`);
        }
    }

    /**
     * JavaScript/CSSカスタマイズ設定を取得
     * @param {number} appId アプリID
     * @param {boolean} preview プレビュー環境かどうか
     * @returns {Promise<Object>} カスタマイズ設定情報
     */
    async getAppCustomize(appId, preview = false) {
        try {
            LoggingUtils.info('app', 'get_app_customize', { appId, preview: Boolean(preview) });
            
            const params = { app: appId };
            if (preview) {
                params.preview = true;
            }
            
            const response = await this.client.app.getAppCustomize(params);
            LoggingUtils.debug('app', 'get_app_customize_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get app customize for app ${appId}`);
        }
    }

    /**
     * JavaScript/CSSカスタマイズ設定を更新
     * @param {number} appId アプリID
     * @param {string} scope 適用範囲
     * @param {Object} desktop PC用設定
     * @param {Object} mobile モバイル用設定
     * @param {number} revision リビジョン番号
     * @returns {Promise<Object>} 更新結果
     */
    async updateAppCustomize(appId, scope, desktop, mobile, revision = -1) {
        try {
            LoggingUtils.info('app', 'update_app_customize', { appId, scope, revision });
            LoggingUtils.debug('app', 'update_app_customize_payload', { desktop, mobile });
            
            const params = {
                app: appId,
                scope: scope
            };
            
            if (desktop) {
                params.desktop = desktop;
            }
            
            if (mobile) {
                params.mobile = mobile;
            }
            
            if (revision && revision !== -1) {
                params.revision = revision;
            }
            
            const response = await this.client.app.updateAppCustomize(params);
            LoggingUtils.debug('app', 'update_app_customize_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `update app customize for app ${appId}`);
        }
    }

    /**
     * アプリのアクセス権限を更新
     * @param {number} appId アプリID
     * @param {Array} rights アクセス権限設定
     * @param {number} revision リビジョン番号
     * @returns {Promise<Object>} 更新結果
     */
    async updateAppAcl(appId, rights, revision = -1) {
        try {
            LoggingUtils.info('app', 'update_app_acl', { appId, revision });
            LoggingUtils.debug('app', 'update_app_acl_payload', rights);
            
            const params = {
                app: appId,
                rights: rights
            };
            
            if (revision && revision !== -1) {
                params.revision = revision;
            }
            
            const response = await this.client.app.updateAppAcl(params);
            LoggingUtils.debug('app', 'update_app_acl_response', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `update app ACL for app ${appId}`);
        }
    }

    /**
     * レコードのアクセス権限を取得
     * @param {number} appId - アプリID
     * @param {number} recordId - レコードID
     * @returns {Promise<Object>} アクセス権限情報
     */
    async getRecordAcl(appId, recordId) {
        try {
            LoggingUtils.logDetailedOperation('getRecordAcl', 'レコードアクセス権限取得', { appId, recordId });
            
            const params = {
                app: appId,
                id: recordId
            };
            
            const response = await this.client.app.getRecordAcl(params);
            LoggingUtils.logDetailedOperation('getRecordAcl', 'レコードアクセス権限取得完了', { 
                appId, 
                recordId,
                rights: response.rights ? response.rights.length : 0 
            });
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get record ACL for app ${appId}, record ${recordId}`);
        }
    }

    /**
     * 複数レコードのアクセス権限を評価
     * @param {number} appId - アプリID
     * @param {number[]} recordIds - レコードIDの配列
     * @returns {Promise<Object>} 評価結果
     */
    async evaluateRecordsAcl(appId, recordIds) {
        try {
            LoggingUtils.logDetailedOperation('evaluateRecordsAcl', 'レコードアクセス権限評価', { 
                appId, 
                recordCount: recordIds.length 
            });
            
            const params = {
                app: appId,
                ids: recordIds
            };
            
            const response = await this.client.app.evaluateRecordsAcl(params);
            LoggingUtils.logDetailedOperation('evaluateRecordsAcl', 'レコードアクセス権限評価完了', { 
                appId, 
                recordCount: recordIds.length,
                evaluatedCount: response.rights ? Object.keys(response.rights).length : 0
            });
            return response;
        } catch (error) {
            this.handleKintoneError(error, `evaluate records ACL for app ${appId}`);
        }
    }
}
