// src/server/handlers/ToolRequestHandler.js
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { KintoneRestAPIError } from '@kintone/rest-api-client';
import { KintoneRecord } from '../../models/KintoneRecord.js';
import { handleRecordTools } from '../tools/RecordTools.js';
import { handleAppTools } from '../tools/AppTools.js';
import { handleSpaceTools } from '../tools/SpaceTools.js';
import { handleFieldTools } from '../tools/FieldTools.js';
import { handleDocumentationTools } from '../tools/DocumentationTools.js';

// ファイル関連のツールを処理する関数
async function handleFileTools(name, args, repository) {
    switch (name) {
        case 'upload_file': {
            const uploadResponse = await repository.uploadFile(
                args.file_name,
                args.file_data
            );
            return { file_key: uploadResponse.fileKey };
        }
        
        case 'download_file': {
            const fileData = await repository.downloadFile(
                args.file_key
            );
            return fileData;
        }
        
        default:
            throw new Error(`Unknown file tool: ${name}`);
    }
}

// ツールリクエストを実行する関数
export async function executeToolRequest(request, repository) {
    // リクエスト全体をログ出力（デバッグ用）
    console.error(`Request params:`, JSON.stringify(request.params, null, 2));
    
    // パラメータの取得と検証
    const { name, arguments: args } = request.params;
    
    // nameのチェック
    if (!name) {
        throw new McpError(
            ErrorCode.InvalidParams,
            `ツール名が指定されていません。`
        );
    }
    
    // argsのチェック
    if (!args) {
        throw new McpError(
            ErrorCode.InvalidParams,
            `ツール "${name}" の引数が指定されていません。`
        );
    }
    
    // ツール実行前のログ出力
    console.error(`Executing tool: ${name}`);
    console.error(`Arguments:`, JSON.stringify(args, null, 2));

    try {
        // ツールの実行結果
        let result;
        
        // ツールのカテゴリに応じて適切なハンドラーに振り分け
        if (['get_record', 'search_records', 'create_record', 'update_record', 'add_record_comment'].includes(name)) {
            result = await handleRecordTools(name, args, repository);
        }
        
        else if (['create_app', 'deploy_app', 'get_deploy_status', 'update_app_settings', 'get_apps_info', 
             'get_form_layout', 'update_form_layout', 'get_preview_app_settings', 
             'get_preview_form_fields', 'get_preview_form_layout'].includes(name)) {
            result = await handleAppTools(name, args, repository);
        }
        
        else if (['get_space', 'update_space', 'update_space_body', 'get_space_members', 
             'update_space_members', 'add_thread', 'update_thread', 'add_thread_comment', 
             'add_guests', 'update_space_guests'].includes(name)) {
            result = await handleSpaceTools(name, args, repository);
        }
        
        else if (['add_fields', 'create_choice_field', 'create_reference_table_field', 'create_lookup_field'].includes(name)) {
            result = await handleFieldTools(name, args, repository);
        }
        
        else if (['get_field_type_documentation'].includes(name)) {
            result = await handleDocumentationTools(name, args);
        }
        
        else if (['upload_file', 'download_file'].includes(name)) {
            result = await handleFileTools(name, args, repository);
        }
        
        // 未知のツール
        else {
            throw new McpError(
                ErrorCode.MethodNotFound,
                `Unknown tool: ${name}`
            );
        }
        
        // MCPプロトコルが期待する形式に変換して返す
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    } catch (error) {
        // エラーハンドリング
        return handleToolError(error);
    }
}

// エラーハンドリング
export function handleToolError(error) {
    let errorCode = ErrorCode.InternalError;
    let errorMessage = error.message;
    let helpText = "";

    // 選択肢フィールドに関連するエラーの特定と対応
    if (error.message.includes("選択肢") && error.message.includes("label")) {
        helpText = `
選択肢フィールドのエラーが発生しました。以下の点を確認してください：

1. options オブジェクトの各キーと label の値が完全に一致しているか
   正しい例: "status": { "label": "status", "index": "0" }
   誤った例: "status": { "label": "ステータス", "index": "0" }

2. get_field_type_documentation ツールを使用して、正しい形式を確認してください：
   例: get_field_type_documentation({ field_type: "RADIO_BUTTON" })

3. create_choice_field ツールを使用して、正しい形式のフィールド設定を生成することもできます：
   例: create_choice_field({
     field_type: "RADIO_BUTTON",
     code: "status",
     label: "ステータス",
     choices: ["not_started", "in_progress", "completed"]
   })`;
    } else if (error.message.includes("選択肢") && error.message.includes("index")) {
        helpText = `
選択肢フィールドの index に関するエラーが発生しました。以下の点を確認してください：

1. index は文字列型の数値（"0", "1"など）で指定されているか
   正しい例: "status": { "label": "status", "index": "0" }
   誤った例: "status": { "label": "status", "index": 0 }

2. index は 0 以上の整数値か
   
3. get_field_type_documentation ツールを使用して、正しい形式を確認してください：
   例: get_field_type_documentation({ field_type: "RADIO_BUTTON" })`;
    }

    if (error instanceof McpError) {
        // MCPエラーの場合は、MCPプロトコルが期待する形式に変換して返す
        return {
            content: [
                {
                    type: 'text',
                    text: error.message
                }
            ],
            isError: true
        };
    } else if (error instanceof KintoneRestAPIError) {
        // Kintone API のエラーコードに応じて適切な MCP エラーコードを設定
        errorCode = error.status >= 500 ? 
            ErrorCode.InternalError : 
            ErrorCode.InvalidRequest;
        
        // エラーの詳細情報を追加
        if (error.errors) {
            errorMessage += "\n\nエラーの詳細情報：";
            for (const [key, value] of Object.entries(error.errors)) {
                errorMessage += `\n- ${key}: ${JSON.stringify(value)}`;
            }
        }
        
        // アプリが見つからないエラーの場合、プレビュー環境と運用環境の区別に関する情報を追加
        if (error.code === "GAIA_AP01" || error.message.includes("存在しません")) {
            helpText = `
アプリが見つかりません。以下の可能性があります：

1. アプリがまだプレビュー環境にのみ存在し、運用環境にデプロイされていない
2. デプロイ処理が完了していない

解決策：
1. 新規作成したアプリの場合は、get_preview_app_settings ツールを使用してプレビュー環境の情報を取得してください
2. アプリをデプロイするには、deploy_app ツールを使用してください
3. デプロイ状態を確認するには、get_deploy_status ツールを使用してください
4. デプロイが完了したら、運用環境のAPIを使用できます

kintoneアプリのライフサイクル：
1. create_app: アプリを作成（プレビュー環境に作成される）
2. add_fields: フィールドを追加（プレビュー環境に追加される）
3. deploy_app: アプリをデプロイ（運用環境へ反映）
4. get_deploy_status: デプロイ状態を確認（完了するまで待機）
5. get_app_settings: 運用環境の設定を取得（デプロイ完了後）`;
        }
        
        // 必須フィールドが不足しているエラーの場合
        else if (error.code === "CB_VA01" && error.errors) {
            const missingFields = [];
            for (const key in error.errors) {
                if (key.includes('.value')) {
                    const fieldMatch = key.match(/record\.([^.]+)\.values\.value/);
                    if (fieldMatch) {
                        missingFields.push(fieldMatch[1]);
                    }
                }
            }
            
            if (missingFields.length > 0) {
                helpText = `
必須フィールドが不足しています：${missingFields.join(', ')}

以下の点を確認してください：
1. 必須フィールドの値が指定されているか
2. フィールドの形式が正しいか
3. フィールドの型が正しいか

例：
{
  "app_id": 123,
  "fields": {
    "project_name": { "value": "プロジェクト名" },
    "project_manager": { "value": "山田太郎" }
  }
}`;
            }
        }
    }

    // ヘルプテキストがある場合は追加
    if (helpText) {
        errorMessage += "\n\n" + helpText;
    }

    // MCPプロトコルが期待する形式に変換して返す
    return {
        content: [
            {
                type: 'text',
                text: errorMessage
            }
        ],
        isError: true
    };
}
