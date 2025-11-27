// src/server/tools/AppTools.js
import { ValidationUtils } from '../../utils/ValidationUtils.js';
import { LoggingUtils } from '../../utils/LoggingUtils.js';
import { ResponseBuilder } from '../../utils/ResponseBuilder.js';

// レイアウトデータをkintone APIが期待する形式に変換する関数（同期版）
function convertLayoutForKintoneSync(layout, formFields) {
    // 入力チェック
    if (!layout) {
        LoggingUtils.logWarning('convertLayoutForKintoneSync', 'called with null or undefined layout');
        return [];
    }
    
    // 配列でない場合は配列に変換
    if (!Array.isArray(layout)) {
        LoggingUtils.logWarning('convertLayoutForKintoneSync', `received non-array layout: ${typeof layout}`);
        layout = [layout];
    }
    
    // レイアウト内の各要素を処理
    return layout.map(item => {
        if (!item) {
            LoggingUtils.logWarning('convertLayoutForKintoneSync', 'null or undefined item in layout');
            return null;
        }
        
        // ROWタイプの場合
        if (item.type === 'ROW') {
            // fieldsが配列でない場合は配列に変換
            if (!Array.isArray(item.fields)) {
                LoggingUtils.logWarning('convertLayoutForKintoneSync', 'ROW要素の fields プロパティが配列ではありません。自動的に配列に変換します。');
                item.fields = item.fields ? [item.fields] : [];
            }
            
            return {
                ...item,
                fields: item.fields.map(field => {
                    if (!field) {
                        LoggingUtils.logWarning('convertLayoutForKintoneSync', 'null or undefined field in ROW');
                        return null;
                    }
                    
                    // FIELDタイプの場合、フィールドコードに対応するフィールドタイプを取得
                    if (field.type === 'FIELD' && field.code) {
                        const fieldInfo = formFields[field.code];
                        if (fieldInfo) {
                            // フィールド情報が存在する場合、typeを実際のフィールドタイプに変換
                            return {
                                ...field,
                                type: fieldInfo.type
                            };
                        } else {
                            LoggingUtils.logWarning('convertLayoutForKintoneSync', `Field not found: ${field.code}`);
                            // フィールド情報が存在しない場合、そのまま返す
                            return field;
                        }
                    }
                    return field;
                }).filter(Boolean) // nullやundefinedを除外
            };
        }
        // GROUPタイプの場合
        else if (item.type === 'GROUP' && item.layout) {
            // layoutが配列でない場合は配列に変換
            if (!Array.isArray(item.layout)) {
                LoggingUtils.logWarning('convertLayoutForKintoneSync', `GROUP要素 "${item.code}" の layout プロパティが配列ではありません。自動的に配列に変換します。`);
                item.layout = item.layout ? [item.layout] : [];
            }
            
            return {
                ...item,
                layout: convertLayoutForKintoneSync(item.layout, formFields) // 再帰的に処理（同期的に）
            };
        }
        // SUBTABLEタイプの場合
        else if (item.type === 'SUBTABLE' && item.fields) {
            return {
                ...item,
                fields: Object.entries(item.fields).map(([_, field]) => {
                    if (!field) {
                        LoggingUtils.logWarning('convertLayoutForKintoneSync', 'null or undefined field in SUBTABLE');
                        return null;
                    }
                    
                    // フィールドコードに対応するフィールドタイプを取得
                    if (field.code) {
                        const fieldInfo = formFields[field.code];
                        if (fieldInfo) {
                            // フィールド情報が存在する場合、typeを実際のフィールドタイプに変換
                            return {
                                ...field,
                                type: fieldInfo.type
                            };
                        } else {
                            LoggingUtils.logWarning('convertLayoutForKintoneSync', `Field not found: ${field.code}`);
                            // フィールド情報が存在しない場合、そのまま返す
                            return field;
                        }
                    }
                    return field;
                }).filter(Boolean) // nullやundefinedを除外
            };
        }
        return item;
    }).filter(Boolean); // nullやundefinedを除外
}

// アプリ関連のツールを処理する関数
export async function handleAppTools(name, args, repository) {
    // 共通のツール実行ログ
    LoggingUtils.logToolExecution('app', name, args);
    
    switch (name) {
        case 'create_app': {
            ValidationUtils.validateRequired(args, ['name']);
            ValidationUtils.validateString(args.name, 'name');
            
            const response = await repository.createApp(
                args.name,
                args.space,
                args.thread
            );
            return ResponseBuilder.appCreated(response.app, response.revision);
        }
        
        case 'deploy_app': {
            ValidationUtils.validateRequired(args, ['apps']);
            ValidationUtils.validateArray(args.apps, 'apps', { minLength: 1 });
            
            const response = await repository.deployApp(args.apps);
            return response;
        }
        
        case 'get_deploy_status': {
            ValidationUtils.validateRequired(args, ['apps']);
            ValidationUtils.validateArray(args.apps, 'apps', { minLength: 1 });
            
            const status = await repository.getDeployStatus(args.apps);
            return status;
        }
        
        case 'update_app_settings': {
            ValidationUtils.validateRequired(args, ['app_id']);
            
            const settings = { ...args };
            delete settings.app_id;  // app_idをsettingsから除外

            // undefined のプロパティを削除
            Object.keys(settings).forEach(key => {
                if (settings[key] === undefined) {
                    delete settings[key];
                }
            });

            const response = await repository.updateAppSettings(args.app_id, settings);
            return ResponseBuilder.withRevision(response.revision);
        }
        
        case 'get_apps_info': {
            const hasName = args.app_name !== undefined && args.app_name !== null;
            const hasId = args.app_id !== undefined && args.app_id !== null;

            if (!hasName && !hasId) {
                throw new Error('app_name または app_id のいずれかを指定してください。');
            }

            let appName;
            if (hasName) {
                ValidationUtils.validateString(args.app_name, 'app_name', { minLength: 1 });
                appName = args.app_name.trim();
                if (appName.length === 0) {
                    throw new Error('app_name は空文字列にはできません。');
                }
            }

            let appId;
            if (hasId) {
                ValidationUtils.validateNumber(args.app_id, 'app_id', { min: 1 });
                if (!Number.isInteger(args.app_id)) {
                    throw new Error('app_id は自然数（整数）で指定してください。');
                }
                appId = Number(args.app_id);
            }

            let appCode;
            if (args.app_code !== undefined && args.app_code !== null) {
                ValidationUtils.validateString(args.app_code, 'app_code', { minLength: 1 });
                const trimmed = args.app_code.trim();
                if (!/^[A-Za-z][A-Za-z0-9]*$/.test(trimmed)) {
                    throw new Error('app_code はアルファベットで始まる半角英数字で指定してください。');
                }
                appCode = trimmed;
            }

            let spaceId;
            if (args.space_id !== undefined && args.space_id !== null) {
                ValidationUtils.validateNumber(args.space_id, 'space_id', { min: 1 });
                if (!Number.isInteger(args.space_id)) {
                    throw new Error('space_id は自然数（整数）で指定してください。');
                }
                spaceId = Number(args.space_id);
            }

            const appsInfo = await repository.getAppsInfo({ appName, appId, appCode, spaceId });
            return appsInfo;
        }

        case 'get_form_fields': {
            ValidationUtils.validateRequired(args, ['app_id']);

            const fields = await repository.getFormFields(args.app_id);
            return fields;
        }
        
        case 'get_form_layout': {
            ValidationUtils.validateRequired(args, ['app_id']);
            
            const layout = await repository.getFormLayout(args.app_id);
            return layout;
        }
        
        case 'update_form_layout': {
            ValidationUtils.validateRequired(args, ['app_id', 'layout']);
            ValidationUtils.validateArray(args.layout, 'layout');
            
            try {
                // アプリのフィールド情報を取得
                const formFields = await repository.getFormFields(args.app_id);
                
                // レイアウトデータをkintone APIが期待する形式に変換（同期的に）
                const convertedLayout = convertLayoutForKintoneSync(args.layout, formFields.properties);
                
                // 変換後のレイアウトをログに出力
                LoggingUtils.logDetailedOperation('Converted layout', '', { layout: convertedLayout });
                
                // 深いコピーを作成して参照の問題を解決
                const finalLayout = JSON.parse(JSON.stringify(convertedLayout));
                
                const response = await repository.updateFormLayout(
                    args.app_id,
                    finalLayout,
                    args.revision
                );
                return ResponseBuilder.withRevision(response.revision);
            } catch (error) {
                // エラーの詳細情報を出力
                LoggingUtils.logError('update_form_layout', error);
                if (error.errors) {
                    LoggingUtils.logDetailedOperation('Detailed errors', '', error.errors);
                }
                throw error;
            }
        }
        
        case 'get_preview_app_settings': {
            ValidationUtils.validateRequired(args, ['app_id']);
            
            const settings = await repository.getPreviewAppSettings(
                args.app_id,
                args.lang
            );
            return settings;
        }
        
        case 'get_preview_form_fields': {
            ValidationUtils.validateRequired(args, ['app_id']);
            
            const fields = await repository.getPreviewFormFields(
                args.app_id,
                args.lang
            );
            return fields;
        }
        
        case 'get_preview_form_layout': {
            ValidationUtils.validateRequired(args, ['app_id']);
            
            const layout = await repository.getPreviewFormLayout(
                args.app_id
            );
            return layout;
        }
        
        // アプリを指定したスペースに移動させるツール
        case 'move_app_to_space': {
            ValidationUtils.validateRequired(args, ['app_id', 'space_id']);
            
            await repository.moveAppToSpace(args.app_id, args.space_id);
            return ResponseBuilder.success();
        }

        // アプリをスペースに所属させないようにするツール
        case 'move_app_from_space': {
            ValidationUtils.validateRequired(args, ['app_id']);
            
            try {
                await repository.moveAppFromSpace(args.app_id);
                return ResponseBuilder.success();
            } catch (error) {
                // エラーメッセージをそのまま返す（リポジトリ層で詳細なエラーメッセージを生成）
                throw error;
            }
        }
        
        // アプリのアクション設定を取得するツール
        case 'get_app_actions': {
            ValidationUtils.validateRequired(args, ['app_id']);
            
            const actions = await repository.getAppActions(
                args.app_id,
                args.lang
            );
            return actions;
        }
        
        // アプリのプラグイン一覧を取得するツール
        case 'get_app_plugins': {
            ValidationUtils.validateRequired(args, ['app_id']);
            
            const plugins = await repository.getAppPlugins(args.app_id);
            return plugins;
        }
        
        // アプリのプロセス管理設定を取得するツール
        case 'get_process_management': {
            ValidationUtils.validateRequired(args, ['app_id']);
            
            // プレビュー環境かどうかを判定
            const preview = args.preview === true;

            const processManagement = await repository.getProcessManagement(
                args.app_id,
                preview
            );
            return processManagement;
        }
        
        case 'update_process_management': {
            ValidationUtils.validateRequired(args, ['app_id', 'enable']);
            ValidationUtils.validateBoolean(args.enable, 'enable');
            
            const response = await repository.updateProcessManagement(
                args.app_id,
                args.enable,
                args.states,
                args.actions,
                args.revision
            );
            return ResponseBuilder.withRevision(response.revision);
        }
        
        case 'get_views': {
            ValidationUtils.validateRequired(args, ['app_id']);
            
            const views = await repository.getViews(args.app_id, args.preview);
            return views;
        }
        
        case 'update_views': {
            ValidationUtils.validateRequired(args, ['app_id', 'views']);
            ValidationUtils.validateObject(args.views, 'views');
            
            const response = await repository.updateViews(
                args.app_id,
                args.views,
                args.revision
            );
            return ResponseBuilder.withRevision(response.revision);
        }
        
        case 'get_app_acl': {
            ValidationUtils.validateRequired(args, ['app_id']);
            
            const acl = await repository.getAppAcl(args.app_id, args.preview);
            return acl;
        }
        
        case 'get_field_acl': {
            ValidationUtils.validateRequired(args, ['app_id']);
            
            const acl = await repository.getFieldAcl(args.app_id, args.preview);
            return acl;
        }
        
        case 'update_field_acl': {
            ValidationUtils.validateRequired(args, ['app_id', 'rights']);
            ValidationUtils.validateArray(args.rights, 'rights');
            
            const response = await repository.updateFieldAcl(
                args.app_id,
                args.rights,
                args.revision
            );
            return ResponseBuilder.withRevision(response.revision);
        }
        
        case 'get_reports': {
            ValidationUtils.validateRequired(args, ['app_id']);
            
            const reports = await repository.getReports(args.app_id, args.preview);
            return reports;
        }
        
        case 'update_reports': {
            ValidationUtils.validateRequired(args, ['app_id', 'reports']);
            ValidationUtils.validateObject(args.reports, 'reports');
            
            const response = await repository.updateReports(
                args.app_id,
                args.reports,
                args.revision
            );
            return ResponseBuilder.withRevision(response.revision);
        }
        
        case 'get_notifications': {
            ValidationUtils.validateRequired(args, ['app_id']);
            
            const notifications = await repository.getNotifications(args.app_id, args.preview);
            return notifications;
        }
        
        case 'update_notifications': {
            ValidationUtils.validateRequired(args, ['app_id', 'notifications']);
            ValidationUtils.validateArray(args.notifications, 'notifications');
            
            const response = await repository.updateNotifications(
                args.app_id,
                args.notifications,
                args.revision
            );
            return ResponseBuilder.withRevision(response.revision);
        }
        
        case 'get_per_record_notifications': {
            ValidationUtils.validateRequired(args, ['app_id']);
            
            const notifications = await repository.getPerRecordNotifications(args.app_id, args.preview);
            return notifications;
        }
        
        case 'update_per_record_notifications': {
            ValidationUtils.validateRequired(args, ['app_id', 'notifications']);
            ValidationUtils.validateArray(args.notifications, 'notifications');
            
            const response = await repository.updatePerRecordNotifications(
                args.app_id,
                args.notifications,
                args.revision
            );
            return ResponseBuilder.withRevision(response.revision);
        }
        
        case 'get_reminder_notifications': {
            ValidationUtils.validateRequired(args, ['app_id']);
            
            const notifications = await repository.getReminderNotifications(args.app_id, args.preview);
            return notifications;
        }
        
        case 'update_reminder_notifications': {
            ValidationUtils.validateRequired(args, ['app_id', 'notifications']);
            ValidationUtils.validateArray(args.notifications, 'notifications');
            
            const response = await repository.updateReminderNotifications(
                args.app_id,
                args.notifications,
                args.revision
            );
            return ResponseBuilder.withRevision(response.revision);
        }
        
        case 'update_app_actions': {
            ValidationUtils.validateRequired(args, ['app_id', 'actions']);
            ValidationUtils.validateObject(args.actions, 'actions');
            
            const response = await repository.updateAppActions(
                args.app_id,
                args.actions,
                args.revision
            );
            return ResponseBuilder.withRevision(response.revision);
        }
        
        case 'update_plugins': {
            ValidationUtils.validateRequired(args, ['app_id']);
            
            const response = await repository.updatePlugins(
                args.app_id,
                args.plugins || {},
                args.revision
            );
            return ResponseBuilder.withRevision(response.revision);
        }
        
        case 'get_app_customize': {
            ValidationUtils.validateRequired(args, ['app_id']);
            
            const customize = await repository.getAppCustomize(args.app_id, args.preview);
            return customize;
        }
        
        case 'update_app_customize': {
            ValidationUtils.validateRequired(args, ['app_id', 'scope']);
            ValidationUtils.validateString(args.scope, 'scope', {
                allowedValues: ['ALL', 'ADMIN', 'NONE']
            });
            
            const response = await repository.updateAppCustomize(
                args.app_id,
                args.scope,
                args.desktop,
                args.mobile,
                args.revision
            );
            return ResponseBuilder.withRevision(response.revision);
        }
        
        case 'update_app_acl': {
            ValidationUtils.validateRequired(args, ['app_id', 'rights']);
            ValidationUtils.validateArray(args.rights, 'rights');
            
            const response = await repository.updateAppAcl(
                args.app_id,
                args.rights,
                args.revision
            );
            return ResponseBuilder.withRevision(response.revision);
        }
        
        case 'get_record_acl': {
            ValidationUtils.validateRequired(args, ['app_id', 'record_id']);
            
            const acl = await repository.getRecordAcl(args.app_id, args.record_id);
            return acl;
        }
        
        case 'evaluate_records_acl': {
            ValidationUtils.validateRequired(args, ['app_id', 'record_ids']);
            ValidationUtils.validateArray(args.record_ids, 'record_ids', {
                minLength: 1
            });
            
            const result = await repository.evaluateRecordsAcl(args.app_id, args.record_ids);
            return result;
        }
        
        default:
            throw new Error(`Unknown app tool: ${name}`);
    }
}
