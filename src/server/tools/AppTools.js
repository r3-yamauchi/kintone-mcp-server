// src/server/tools/AppTools.js

// レイアウトデータをkintone APIが期待する形式に変換する関数（同期版）
function convertLayoutForKintoneSync(layout, formFields) {
    // 入力チェック
    if (!layout) {
        console.error('Warning: convertLayoutForKintoneSync called with null or undefined layout');
        return [];
    }
    
    // 配列でない場合は配列に変換
    if (!Array.isArray(layout)) {
        console.error(`Warning: convertLayoutForKintoneSync received non-array layout: ${typeof layout}`);
        layout = [layout];
    }
    
    // レイアウト内の各要素を処理
    return layout.map(item => {
        if (!item) {
            console.error('Warning: null or undefined item in layout');
            return null;
        }
        
        // ROWタイプの場合
        if (item.type === 'ROW') {
            // fieldsが配列でない場合は配列に変換
            if (!Array.isArray(item.fields)) {
                console.error(`Warning: ROW要素の fields プロパティが配列ではありません。自動的に配列に変換します。`);
                item.fields = item.fields ? [item.fields] : [];
            }
            
            return {
                ...item,
                fields: item.fields.map(field => {
                    if (!field) {
                        console.error('Warning: null or undefined field in ROW');
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
                            console.error(`Field not found: ${field.code}`);
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
                console.error(`Warning: GROUP要素 "${item.code}" の layout プロパティが配列ではありません。自動的に配列に変換します。`);
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
                        console.error('Warning: null or undefined field in SUBTABLE');
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
                            console.error(`Field not found: ${field.code}`);
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
                
                // レイアウトデータをkintone APIが期待する形式に変換（同期的に）
                const convertedLayout = convertLayoutForKintoneSync(args.layout, formFields.properties);
                
                // 変換後のレイアウトをログに出力
                console.error(`Converted layout:`, JSON.stringify(convertedLayout, null, 2));
                
                // 深いコピーを作成して参照の問題を解決
                const finalLayout = JSON.parse(JSON.stringify(convertedLayout));
                
                // 最終的なレイアウトをログに出力
                console.error(`Final layout (before API call):`, JSON.stringify(finalLayout, null, 2));
                
                const response = await repository.updateFormLayout(
                    args.app_id,
                    finalLayout,
                    args.revision
                );
                return { 
                    success: true,
                    revision: response.revision
                };
            } catch (error) {
                // エラーの詳細情報を出力
                console.error('Error updating form layout:', error);
                if (error.errors) {
                    console.error('Detailed errors:', JSON.stringify(error.errors, null, 2));
                }
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
        
        // アプリを指定したスペースに移動させるツール
        case 'move_app_to_space': {
            // 引数のチェック
            if (!args.app_id) {
                throw new Error('app_id は必須パラメータです。');
            }
            if (!args.space_id) {
                throw new Error('space_id は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Moving app ${args.app_id} to space ${args.space_id}`);
            
            await repository.moveAppToSpace(args.app_id, args.space_id);
            return { success: true };
        }

        // アプリをスペースに所属させないようにするツール
        case 'move_app_from_space': {
            // 引数のチェック
            if (!args.app_id) {
                throw new Error('app_id は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Moving app ${args.app_id} from space`);
            
            try {
                await repository.moveAppFromSpace(args.app_id);
                return { success: true };
            } catch (error) {
                // エラーメッセージをそのまま返す（リポジトリ層で詳細なエラーメッセージを生成）
                throw error;
            }
        }
        
        // アプリのアクション設定を取得するツール
        case 'get_app_actions': {
            // 引数のチェック
            if (!args.app_id) {
                throw new Error('app_id は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Fetching app actions for app: ${args.app_id}`);
            
            const actions = await repository.getAppActions(
                args.app_id,
                args.lang
            );
            return actions;
        }
        
        // アプリのプラグイン一覧を取得するツール
        case 'get_app_plugins': {
            // 引数のチェック
            if (!args.app_id) {
                throw new Error('app_id は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Fetching plugins for app: ${args.app_id}`);
            
            const plugins = await repository.getAppPlugins(args.app_id);
            return plugins;
        }
        
        default:
            throw new Error(`Unknown app tool: ${name}`);
    }
}
