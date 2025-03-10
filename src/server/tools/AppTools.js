// src/server/tools/AppTools.js

// レイアウトデータをkintone APIが期待する形式に変換する関数
async function convertLayoutForKintone(layout, formFields) {
    // レイアウト内の各要素を処理
    return layout.map(item => {
        // ROWタイプの場合
        if (item.type === 'ROW') {
            return {
                ...item,
                fields: item.fields.map(field => {
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
                            console.error(`Field not found: ${field.code}`);
                            // フィールド情報が存在しない場合、そのまま返す
                            return field;
                        }
                    }
                    return field;
                })
            };
        }
        // GROUPタイプの場合
        else if (item.type === 'GROUP' && item.layout) {
            return {
                ...item,
                layout: convertLayoutForKintone(item.layout, formFields) // 再帰的に処理
            };
        }
        // SUBTABLEタイプの場合
        else if (item.type === 'SUBTABLE' && item.fields) {
            return {
                ...item,
                fields: item.fields.map(field => {
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
                            console.error(`Field not found: ${field.code}`);
                            // フィールド情報が存在しない場合、そのまま返す
                            return field;
                        }
                    }
                    return field;
                })
            };
        }
        return item;
    });
}

// アプリ関連のツールを処理する関数
export async function handleAppTools(name, args, repository) {
    switch (name) {
        case 'create_app': {
            // 引数のチェック
            if (!args.name) {
                throw new Error('name は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Creating new app: ${args.name}`);
            
            const response = await repository.createApp(
                args.name,
                args.space,
                args.thread
            );
            return {
                app: response.app,
                revision: response.revision
            };
        }
        
        case 'deploy_app': {
            // 引数のチェック
            if (!args.apps) {
                throw new Error('apps は必須パラメータです。');
            }
            if (!Array.isArray(args.apps)) {
                throw new Error('apps は配列形式で指定する必要があります。');
            }
            if (args.apps.length === 0) {
                throw new Error('apps には少なくとも1つのアプリIDを指定する必要があります。');
            }
            
            // デバッグ用のログ出力
            console.error(`Deploying apps:`, args.apps);
            
            const response = await repository.deployApp(args.apps);
            return response;
        }
        
        case 'get_deploy_status': {
            // 引数のチェック
            if (!args.apps) {
                throw new Error('apps は必須パラメータです。');
            }
            if (!Array.isArray(args.apps)) {
                throw new Error('apps は配列形式で指定する必要があります。');
            }
            if (args.apps.length === 0) {
                throw new Error('apps には少なくとも1つのアプリIDを指定する必要があります。');
            }
            
            // デバッグ用のログ出力
            console.error(`Checking deploy status for apps:`, args.apps);
            
            return repository.getDeployStatus(args.apps);
        }
        
        case 'update_app_settings': {
            // 引数のチェック
            if (!args.app_id) {
                throw new Error('app_id は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Updating app settings for app: ${args.app_id}`);
            
            const settings = { ...args };
            delete settings.app_id;  // app_idをsettingsから除外

            // undefined のプロパティを削除
            Object.keys(settings).forEach(key => {
                if (settings[key] === undefined) {
                    delete settings[key];
                }
            });

            const response = await repository.updateAppSettings(args.app_id, settings);
            return { revision: response.revision };
        }
        
        case 'get_apps_info': {
            // 引数のチェック
            if (!args.app_name) {
                throw new Error('app_name は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Fetching apps info: ${args.app_name}`);
            
            return repository.getAppsInfo(args.app_name);
        }
        
        case 'get_form_layout': {
            // 引数のチェック
            if (!args.app_id) {
                throw new Error('app_id は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Fetching form layout for app: ${args.app_id}`);
            
            const layout = await repository.getFormLayout(args.app_id);
            return layout;
        }
        
        case 'update_form_layout': {
            // 引数のチェック
            if (!args.app_id) {
                throw new Error('app_id は必須パラメータです。');
            }
            if (!args.layout) {
                throw new Error('layout は必須パラメータです。');
            }
            if (!Array.isArray(args.layout)) {
                throw new Error('layout は配列形式で指定する必要があります。');
            }
            
            // デバッグ用のログ出力
            console.error(`Updating form layout for app: ${args.app_id}`);
            console.error(`Layout:`, JSON.stringify(args.layout, null, 2));
            
            try {
                // アプリのフィールド情報を取得
                const formFields = await repository.getFormFields(args.app_id);
                
                // レイアウトデータをkintone APIが期待する形式に変換
                const convertedLayout = await convertLayoutForKintone(args.layout, formFields.properties);
                
                console.error(`Converted layout:`, JSON.stringify(convertedLayout, null, 2));
                
                const response = await repository.updateFormLayout(
                    args.app_id,
                    convertedLayout,
                    args.revision
                );
                return { 
                    success: true,
                    revision: response.revision
                };
            } catch (error) {
                console.error('Error converting layout:', error);
                throw error;
            }
        }
        
        case 'get_preview_app_settings': {
            // 引数のチェック
            if (!args.app_id) {
                throw new Error('app_id は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Fetching preview app settings for app: ${args.app_id}`);
            
            const settings = await repository.getPreviewAppSettings(
                args.app_id,
                args.lang
            );
            return settings;
        }
        
        case 'get_preview_form_fields': {
            // 引数のチェック
            if (!args.app_id) {
                throw new Error('app_id は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Fetching preview form fields for app: ${args.app_id}`);
            
            const fields = await repository.getPreviewFormFields(
                args.app_id,
                args.lang
            );
            return fields;
        }
        
        case 'get_preview_form_layout': {
            // 引数のチェック
            if (!args.app_id) {
                throw new Error('app_id は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Fetching preview form layout for app: ${args.app_id}`);
            
            const layout = await repository.getPreviewFormLayout(
                args.app_id
            );
            return layout;
        }
        
        default:
            throw new Error(`Unknown app tool: ${name}`);
    }
}
