// src/server/handlers/ToolRequestHandler.js
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { KintoneRestAPIError } from '@kintone/rest-api-client';
import { handleRecordTools } from '../tools/RecordTools.js';
import { handleAppTools } from '../tools/AppTools.js';
import { handleSpaceTools } from '../tools/SpaceTools.js';
import { handleFieldTools } from '../tools/FieldTools.js';
import { handleDocumentationTools } from '../tools/DocumentationTools.js';
import { handleLayoutTools } from '../tools/LayoutTools.js';
import { handleUserTools } from '../tools/UserTools.js';
import { handleSystemTools } from '../tools/SystemTools.js';

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
            
            // MCPプロトコルに準拠したレスポンス形式
            return {
                uri: `file://${args.file_key}`,
                mimeType: fileData.contentType || 'application/octet-stream',
                blob: Buffer.from(fileData.data || fileData).toString('base64')
            };
        }
        
        default:
            throw new Error(`Unknown file tool: ${name}`);
    }
}

/**
 * オブジェクト内の "DROPDOWN" フィールドタイプを "DROP_DOWN" に変換する関数
 * @param {Object} obj 変換対象のオブジェクト
 */
function convertDropdownFieldType(obj) {
    if (!obj || typeof obj !== 'object') return;
    
    // オブジェクトの各プロパティを再帰的に処理
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            
            // type プロパティが "DROPDOWN" の場合、"DROP_DOWN" に変換
            if (key === 'type' && value === 'DROPDOWN') {
                obj[key] = 'DROP_DOWN';
                console.error('フィールドタイプ "DROPDOWN" を "DROP_DOWN" に自動変換しました。');
            }
            // field_type プロパティが "DROPDOWN" の場合、"DROP_DOWN" に変換
            else if (key === 'field_type' && value === 'DROPDOWN') {
                obj[key] = 'DROP_DOWN';
                console.error('フィールドタイプ "DROPDOWN" を "DROP_DOWN" に自動変換しました。');
            }
            // 値がオブジェクトまたは配列の場合、再帰的に処理
            else if (value && typeof value === 'object') {
                convertDropdownFieldType(value);
            }
        }
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
    
    // DROPDOWN を DROP_DOWN に変換する処理
    if (args) {
        convertDropdownFieldType(args);
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
             'get_preview_form_fields', 'get_preview_form_layout', 
             'move_app_to_space', 'move_app_from_space'].includes(name)) {
            result = await handleAppTools(name, args, repository);
        }
        
        else if (['get_space', 'update_space', 'update_space_body', 'get_space_members', 
             'update_space_members', 'add_thread', 'update_thread', 'add_thread_comment', 
             'add_guests', 'update_space_guests'].includes(name)) {
            result = await handleSpaceTools(name, args, repository);
        }
        
else if (['add_fields', 'update_field'].includes(name)) {
            result = await handleFieldTools(name, args, repository);
        }
        
        else if (['create_choice_field', 'create_reference_table_field', 'create_text_field', 
                 'create_number_field', 'create_date_field', 'create_time_field',
                 'create_datetime_field', 'create_rich_text_field', 'create_attachment_field',
                 'create_user_select_field', 'create_subtable_field', 'create_calc_field',
                 'create_status_field', 'create_related_records_field', 'create_link_field'].includes(name)) {
            result = await handleFieldTools(name, args, repository);
        }
        
        else if (name === 'create_lookup_field') {
            // ルックアップフィールド作成ツールの特別処理
            const fieldConfig = await handleFieldTools(name, args, repository);
            
            // 注意書きを追加（ログとレスポンス両方に含める）
            const note = `注意: create_lookup_field ツールは設定オブジェクトを生成するだけのヘルパーツールです。実際にフィールドを追加するには、この結果を add_fields ツールに渡してください。`;
            console.error(note);
            
            // ルックアップフィールドの重要な注意点を追加
            const lookupNote = `
【重要】ルックアップフィールドについて
- ルックアップフィールドは基本的なフィールドタイプ（SINGLE_LINE_TEXT、NUMBERなど）に、lookup属性を追加したものです
- フィールドタイプとして "LOOKUP" を指定するのではなく、適切な基本タイプを指定し、その中にlookupプロパティを設定します
- 参照先アプリは運用環境にデプロイされている必要があります
- ルックアップのキーフィールド自体はフィールドマッピングに含めないでください
- lookupPickerFieldsとsortは省略可能ですが、指定することを強く推奨します
`;
            console.error(lookupNote);
            
            // 使用例を追加（ログとレスポンス両方に含める）
            const example = `使用例:
add_fields({
  app_id: アプリID,
  properties: {
    "${fieldConfig.code}": ${JSON.stringify(fieldConfig, null, 2)}
  }
});`;
            console.error(example);
            
            // 注意書きと使用例を含めた結果オブジェクトを作成
            result = {
                ...fieldConfig,
                _note: note,
                _lookupNote: lookupNote,
                _example: example
            };
            
            // MCPプロトコルが期待する形式に変換して返す
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    },
                    {
                        type: 'text',
                        text: note
                    },
                    {
                        type: 'text',
                        text: lookupNote
                    },
                    {
                        type: 'text',
                        text: example
                    }
                ]
            };
        }
        
        else if (['get_field_type_documentation', 'get_available_field_types', 
                 'get_documentation_tool_description', 'get_field_creation_tool_description',
                 'get_group_element_structure'].includes(name)) {
            result = await handleDocumentationTools(name, args);
        }
        
        else if (['upload_file', 'download_file'].includes(name)) {
            result = await handleFileTools(name, args, repository);
        }
        
        else if (['create_form_layout', 'update_form_layout', 'add_layout_element', 
                 'create_group_layout', 'create_table_layout'].includes(name)) {
            result = await handleLayoutTools(name, args, repository);
        }
        
        else if (['get_users', 'get_groups', 'get_group_users'].includes(name)) {
            result = await handleUserTools(name, args, repository);
        }
        
        else if (['get_kintone_domain', 'get_kintone_username'].includes(name)) {
            result = await handleSystemTools(name, args, repository);
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

// エラーメッセージを構造化するヘルパー関数
function formatErrorMessage(errorType, errorDetail, suggestions) {
    return `
【エラーの種類】
${errorType}

【エラーの詳細】
${errorDetail}

【対応方法】
${suggestions.map((s, i) => `${i+1}. ${s}`).join('\n')}
`;
}

// エラーハンドリング
export function handleToolError(error) {
    let errorCode = ErrorCode.InternalError;
    let errorMessage = error.message;
    let helpText = "";

    // 選択肢フィールドに関連するエラーの特定と対応
    if (error.message.includes("選択肢") && error.message.includes("label")) {
        helpText = formatErrorMessage(
            "選択肢フィールドの設定エラー",
            "options オブジェクトの label 設定に問題があります。",
            [
                "options オブジェクトの各キーと label の値が完全に一致しているか確認してください。\n   正しい例: \"status\": { \"label\": \"status\", \"index\": \"0\" }\n   誤った例: \"status\": { \"label\": \"ステータス\", \"index\": \"0\" }",
                "get_field_type_documentation ツールを使用して、正しい形式を確認してください：\n   例: get_field_type_documentation({ field_type: \"RADIO_BUTTON\" })",
                "create_choice_field ツールを使用して、正しい形式のフィールド設定を生成することもできます：\n   例: create_choice_field({\n     field_type: \"RADIO_BUTTON\",\n     code: \"status\",\n     label: \"ステータス\",\n     choices: [\"not_started\", \"in_progress\", \"completed\"]\n   })"
            ]
        );
    } else if (error.message.includes("選択肢") && error.message.includes("index")) {
        helpText = formatErrorMessage(
            "選択肢フィールドの index 設定エラー",
            "options オブジェクトの index 設定に問題があります。",
            [
                "index は文字列型の数値（\"0\", \"1\"など）で指定されているか確認してください。\n   正しい例: \"status\": { \"label\": \"status\", \"index\": \"0\" }\n   誤った例: \"status\": { \"label\": \"status\", \"index\": 0 }",
                "index は 0 以上の整数値である必要があります。",
                "get_field_type_documentation ツールを使用して、正しい形式を確認してください：\n   例: get_field_type_documentation({ field_type: \"RADIO_BUTTON\" })"
            ]
        );
    } 
    // 計算フィールドのエラー
    else if (error.message.includes("計算") || error.message.includes("expression") || error.message.includes("CALC")) {
        // 未サポート関数に関するエラーかどうかを確認
        if (error.message.includes("関数はkintoneではサポートされていません")) {
            // エラーメッセージをそのまま使用（validateExpressionFormatで生成された詳細なメッセージ）
            helpText = error.message;
        }
        // サブテーブル内のフィールド参照に関するエラーかどうかを確認
        else if (error.message.includes("サブテーブル内のフィールド") || error.message.includes("テーブル名を指定せず")) {
            helpText = formatErrorMessage(
                "計算フィールドのフィールド参照エラー",
                "サブテーブル内のフィールド参照方法が正しくありません。",
                [
                    "サブテーブル内のフィールドを参照する場合は、テーブル名を指定せず、フィールドコードのみを使用してください。\n   正しい例: SUM(金額)\n   誤った例: SUM(経費明細.金額)",
                    "kintoneでは、フィールドコードはアプリ内で一意であるため、サブテーブル名を指定する必要はありません。",
                    "get_field_type_documentation ツールで計算フィールドの仕様を確認してください：\n   例: get_field_type_documentation({ field_type: \"CALC\" })"
                ]
            );
        } else {
            helpText = formatErrorMessage(
                "計算フィールドの設定エラー",
                "計算式または計算フィールドの設定に問題があります。",
                [
                    "kintoneの計算フィールドでサポートされている主な関数:\n   - SUM: 合計を計算\n   - ROUND, ROUNDUP, ROUNDDOWN: 数値の丸め処理\n   - IF, AND, OR, NOT: 条件分岐\n   - DATE_FORMAT: 日付の書式設定と計算",
                    "計算式の構文が正しいか確認してください。\n   - 括弧の対応が取れているか\n   - 演算子の使用方法が正しいか",
                    "参照しているフィールドが存在するか確認してください。\n   - フィールドコードのスペルミスがないか\n   - 参照先のフィールドが既に作成されているか",
                    "サブテーブル内のフィールドを参照する場合は、テーブル名を指定せず、フィールドコードのみを使用してください。\n   正しい例: SUM(金額)\n   誤った例: SUM(経費明細.金額)",
                    "日付の計算例:\n   - 日付の差分: DATE_FORMAT(日付1, \"YYYY/MM/DD\") - DATE_FORMAT(日付2, \"YYYY/MM/DD\")",
                    "循環参照がないか確認してください。\n   - フィールドA→フィールドB→フィールドAのような参照関係がないか",
                    "get_field_type_documentation ツールで計算フィールドの仕様を確認してください：\n   例: get_field_type_documentation({ field_type: \"CALC\" })"
                ]
            );
            
            // kintone計算フィールドの詳細仕様の確認方法を追加
            helpText += "\n\n【kintone計算フィールドの詳細仕様の確認方法】\n" +
                       "1. get_field_type_documentation ツールを使用: get_field_type_documentation({ field_type: \"CALC\" })\n" +
                       "2. 計算フィールドの作成例: create_calc_field({ code: \"total\", label: \"合計\", expression: \"price * quantity\" })\n" +
                       "3. kintone公式ドキュメント: https://jp.cybozu.help/k/ja/user/app_settings/form/form_parts/field_calculation.html";
        }
    }
    // ルックアップフィールドのエラー
    else if (error.message.includes("lookup") || error.message.includes("LOOKUP")) {
        helpText = formatErrorMessage(
            "ルックアップフィールドの設定エラー",
            "ルックアップフィールドの設定に問題があります。",
            [
                "参照先アプリが存在するか確認してください。\n   - アプリIDまたはコードが正しいか\n   - アプリが運用環境にデプロイされているか",
                "フィールドマッピングが正しいか確認してください。\n   - 参照先のフィールドが存在するか\n   - マッピング先のフィールドが既に作成されているか\n   - フィールドの型が互換性を持つか",
                "get_field_type_documentation ツールでルックアップフィールドの仕様を確認してください：\n   例: get_field_type_documentation({ field_type: \"LOOKUP\" })"
            ]
        );
    }
    // レイアウト関連のエラー
    else if (error.message.includes("layout") || error.message.includes("レイアウト")) {
        helpText = formatErrorMessage(
            "レイアウト設定エラー",
            "フォームレイアウトの設定に問題があります。",
            [
                "レイアウト要素の型が正しいか確認してください。\n   - ROW, GROUP, SUBTABLE, FIELD, LABEL, SPACER, HR, REFERENCE_TABLE のいずれか",
                "参照しているフィールドが存在するか確認してください。\n   - フィールドコードのスペルミスがないか\n   - 参照先のフィールドが既に作成されているか",
                "レイアウト構造が正しいか確認してください。\n   - ROW内にはフィールド要素のみ配置可能\n   - GROUP内にはROW, GROUP, SUBTABLEのみ配置可能\n   - トップレベルにはROW, GROUP, SUBTABLEのみ配置可能",
                "get_field_type_documentation ツールでレイアウトの仕様を確認してください：\n   例: get_field_type_documentation({ field_type: \"LAYOUT\" })"
            ]
        );
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
        // kintone API のエラーコードに応じて適切な MCP エラーコードを設定
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
            helpText = formatErrorMessage(
                "アプリが見つからないエラー",
                "指定されたアプリが見つかりません。",
                [
                    "アプリがまだプレビュー環境にのみ存在し、運用環境にデプロイされていない可能性があります。",
                    "デプロイ処理が完了していない可能性があります。",
                    "新規作成したアプリの場合は、get_preview_app_settings ツールを使用してプレビュー環境の情報を取得してください。",
                    "アプリをデプロイするには、deploy_app ツールを使用してください。",
                    "デプロイ状態を確認するには、get_deploy_status ツールを使用してください。",
                    "デプロイが完了したら、運用環境のAPIを使用できます。"
                ]
            );
            
            // kintoneアプリのライフサイクル情報を追加
            helpText += "\n\n【kintoneアプリのライフサイクル】\n1. create_app: アプリを作成（プレビュー環境に作成される）\n2. add_fields: フィールドを追加（プレビュー環境に追加される）\n3. deploy_app: アプリをデプロイ（運用環境へ反映）\n4. get_deploy_status: デプロイ状態を確認（完了するまで待機）\n5. get_app_settings: 運用環境の設定を取得（デプロイ完了後）";
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
                helpText = formatErrorMessage(
                    "必須フィールド不足エラー",
                    `必須フィールドが不足しています：${missingFields.join(', ')}`,
                    [
                        "必須フィールドの値が指定されているか確認してください。",
                        "フィールドの形式が正しいか確認してください。",
                        "フィールドの型が正しいか確認してください。"
                    ]
                );
                
                // 使用例を追加
                helpText += "\n\n【使用例】\n```json\n{\n  \"app_id\": 123,\n  \"fields\": {\n    \"project_name\": { \"value\": \"プロジェクト名\" },\n    \"project_manager\": { \"value\": \"山田太郎\" }\n  }\n}\n```";
            }
        }
        // フィールド形式エラーの場合
        else if (error.message.includes("value") || error.message.includes("record") || error.message.includes("fields")) {
            helpText = formatErrorMessage(
                "フィールド形式エラー",
                "レコードのフィールド値の形式が正しくありません。",
                [
                    "各フィールドは { \"value\": ... } の形式で指定する必要があります。",
                    "フィールドタイプに応じて適切な値の形式が異なります：",
                    "- 文字列1行: { \"value\": \"テキスト\" }",
                    "- 文字列複数行: { \"value\": \"テキスト\\nテキスト2\" }",
                    "- 数値: { \"value\": \"20\" } (文字列として指定)",
                    "- 日時: { \"value\": \"2014-02-16T08:57:00Z\" }",
                    "- チェックボックス: { \"value\": [\"選択肢1\", \"選択肢2\"] } (配列)",
                    "- ユーザー選択: { \"value\": [{ \"code\": \"ユーザーコード\" }] } (オブジェクトの配列)",
                    "- ドロップダウン: { \"value\": \"選択肢1\" }",
                    "- リンク: { \"value\": \"https://www.cybozu.com\" }",
                    "- テーブル: { \"value\": [{ \"value\": { \"テーブル文字列\": { \"value\": \"テスト\" } } }] } (入れ子構造)"
                ]
            );
            
            // 使用例を追加
            helpText += "\n\n【レコード作成の使用例】\n```json\n{\n  \"app_id\": 1,\n  \"fields\": {\n    \"文字列1行\": { \"value\": \"テスト\" },\n    \"文字列複数行\": { \"value\": \"テスト\\nテスト2\" },\n    \"数値\": { \"value\": \"20\" },\n    \"日時\": { \"value\": \"2014-02-16T08:57:00Z\" },\n    \"チェックボックス\": { \"value\": [\"sample1\", \"sample2\"] },\n    \"ユーザー選択\": { \"value\": [{ \"code\": \"sato\" }] },\n    \"ドロップダウン\": { \"value\": \"sample1\" },\n    \"リンク_ウェブ\": { \"value\": \"https://www.cybozu.com\" },\n    \"テーブル\": { \"value\": [{ \"value\": { \"テーブル文字列\": { \"value\": \"テスト\" } } }] }\n  }\n}\n```";
            
            // レコード更新の使用例を追加
            helpText += "\n\n【レコード更新の使用例】\n```json\n{\n  \"app_id\": 1,\n  \"record_id\": 1001,\n  \"fields\": {\n    \"文字列1行_0\": { \"value\": \"character string is changed\" },\n    \"テーブル_0\": { \"value\": [{\n      \"id\": 1,\n      \"value\": {\n        \"文字列1行_1\": { \"value\": \"character string is changed\" }\n      }\n    }]}\n  }\n}\n```";
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
