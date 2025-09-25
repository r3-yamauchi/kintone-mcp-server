import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { LoggingUtils } from '../../utils/LoggingUtils.js';
import { KintoneApiError } from '../../repositories/base/http/KintoneApiError.js';

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

function handleChoiceFieldError(error) {
    if (error.message.includes("選択肢") && error.message.includes("label")) {
        return formatErrorMessage(
            "選択肢フィールドの設定エラー",
            "options オブジェクトの label 設定に問題があります。",
            [
                "options オブジェクトの各キーと label の値が完全に一致しているか確認してください。\n   正しい例: \"status\": { \"label\": \"status\", \"index\": \"0\" }\n   誤った例: \"status\": { \"label\": \"ステータス\", \"index\": \"0\" }",
                "get_field_type_documentation ツールを使用して、正しい形式を確認してください：\n   例: get_field_type_documentation({ field_type: \"RADIO_BUTTON\" })",
                "create_choice_field ツールを使用して、正しい形式のフィールド設定を生成することもできます：\n   例: create_choice_field({\n     field_type: \"RADIO_BUTTON\",\n     code: \"status\",\n     label: \"ステータス\",\n     choices: [\"not_started\", \"in_progress\", \"completed\"]\n   })"
            ]
        );
    }
    
    if (error.message.includes("選択肢") && error.message.includes("index")) {
        return formatErrorMessage(
            "選択肢フィールドの index 設定エラー",
            "options オブジェクトの index 設定に問題があります。",
            [
                "index は文字列型の数値（\"0\", \"1\"など）で指定されているか確認してください。\n   正しい例: \"status\": { \"label\": \"status\", \"index\": \"0\" }\n   誤った例: \"status\": { \"label\": \"status\", \"index\": 0 }",
                "index は 0 以上の整数値である必要があります。",
                "get_field_type_documentation ツールを使用して、正しい形式を確認してください：\n   例: get_field_type_documentation({ field_type: \"RADIO_BUTTON\" })"
            ]
        );
    }
    
    return null;
}

function handleCalcFieldError(error) {
    if (!(error.message.includes("計算") || error.message.includes("expression") || error.message.includes("CALC"))) {
        return null;
    }
    
    if (error.message.includes("関数はkintoneではサポートされていません")) {
        return error.message;
    }
    
    if (error.message.includes("サブテーブル内のフィールド") || error.message.includes("テーブル名を指定せず")) {
        return formatErrorMessage(
            "計算フィールドのフィールド参照エラー",
            "サブテーブル内のフィールド参照方法が正しくありません。",
            [
                "サブテーブル内のフィールドを参照する場合は、テーブル名を指定せず、フィールドコードのみを使用してください。\n   正しい例: SUM(金額)\n   誤った例: SUM(経費明細.金額)",
                "kintoneでは、フィールドコードはアプリ内で一意であるため、サブテーブル名を指定する必要はありません。",
                "get_field_type_documentation ツールで計算フィールドの仕様を確認してください：\n   例: get_field_type_documentation({ field_type: \"CALC\" })"
            ]
        );
    }
    
    const helpText = formatErrorMessage(
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
    
    return helpText + "\n\n【kintone計算フィールドの詳細仕様の確認方法】\n" +
           "1. get_field_type_documentation ツールを使用: get_field_type_documentation({ field_type: \"CALC\" })\n" +
           "2. 計算フィールドの作成例: create_calc_field({ code: \"total\", label: \"合計\", expression: \"price * quantity\" })\n" +
           "3. kintone公式ドキュメント: https://jp.cybozu.help/k/ja/user/app_settings/form/form_parts/field_calculation.html";
}

function handleLookupFieldError(error) {
    if (!(error.message.includes("lookup") || error.message.includes("LOOKUP"))) {
        return null;
    }
    
    return formatErrorMessage(
        "ルックアップフィールドの設定エラー",
        "ルックアップフィールドの設定に問題があります。",
        [
            "参照先アプリが存在するか確認してください。\n   - アプリIDまたはコードが正しいか\n   - アプリが運用環境にデプロイされているか",
            "フィールドマッピングが正しいか確認してください。\n   - 参照先のフィールドが存在するか\n   - マッピング先のフィールドが既に作成されているか\n   - フィールドの型が互換性を持つか",
            "get_field_type_documentation ツールでルックアップフィールドの仕様を確認してください：\n   例: get_field_type_documentation({ field_type: \"LOOKUP\" })"
        ]
    );
}

function handleLayoutError(error) {
    if (!(error.message.includes("layout") || error.message.includes("レイアウト"))) {
        return null;
    }
    
    return formatErrorMessage(
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

function handleQueryError(error) {
    if (!(error.message.includes("query") || error.message.includes("クエリ") || 
          error.message.includes("Invalid operator") || error.message.includes("Invalid field") ||
          error.message.includes("limit") || error.message.includes("クエリー構文"))) {
        return null;
    }
    
    let suggestions = [
        "基本的なクエリ構文: フィールドコード 演算子 値",
        "文字列は必ずダブルクオートで囲む: Customer = \"サイボウズ株式会社\"",
        "複数値はin演算子で括弧内に記述: Status in (\"対応中\",\"未対応\")",
        "テーブル内フィールドは=でなくinを使用: ResponseDate in (\"2022-09-29T05:00:00Z\")",
        "オプションの順序を守る: order by → limit → offset",
        "limit句のみの指定は使用できません: 検索条件またはorder by句と組み合わせてください"
    ];
    
    if (error.message.includes("Invalid operator")) {
        suggestions = [
            "フィールドタイプに対応した演算子を使用してください:",
            "• 文字列（1行）: = != in not_in like not_like",
            "• 文字列（複数行）: like not_like is is_not",
            "• 数値: = != > < >= <= in not_in",
            "• ドロップダウン/チェックボックス: in not_in",
            "• 日付: = != > < >= <= (TODAY()などの関数も使用可能)",
            "• ユーザー選択: in not_in (LOGINUSER()関数も使用可能)",
            ...suggestions
        ];
    }
    
    if (error.message.includes("Invalid field") || error.message.includes("Field not found")) {
        suggestions = [
            "フィールドコードのスペルを確認してください",
            "フィールドが存在するか確認してください (get_fieldsツールで確認可能)",
            "関連レコードの場合: 関連レコードフィールド.参照先フィールド",
            "テーブル内フィールドの場合: フィールドコードのみ (テーブル名は不要)",
            ...suggestions
        ];
    }
    
    return formatErrorMessage(
        "クエリ構文エラー",
        "検索クエリの構文に問題があります。",
        suggestions.concat([
            "詳細なクエリ構文はget_query_language_documentationツールで確認できます",
            "よく使われるクエリ例:\n" +
            "  • Status = \"完了\" (完全一致)\n" +
            "  • Customer like \"株式会社\" (部分一致)\n" +
            "  • LimitDay >= \"2022-09-29\" and LimitDay <= \"2022-10-29\" (範囲指定)\n" +
            "  • Status in (\"対応中\",\"未対応\") order by 更新日時 desc (ソート付き)\n" +
            "  • $id > 0 limit 10 (条件付きlimit)\n" +
            "  • order by $id desc limit 10 (ソート付きlimit)"
        ])
    );
}

function handleKintoneApiError(error) {
    if (!(error instanceof KintoneApiError)) {
        return null;
    }
    
    let errorMessage = error.message;
    let helpText = "";
    
    // クエリエラーのチェックを最初に行う
    const queryErrorHelp = handleQueryError(error);
    if (queryErrorHelp) {
        return { errorMessage, helpText: queryErrorHelp };
    }
    
    if (error.errors) {
        errorMessage += "\n\nエラーの詳細情報：";
        for (const [key, value] of Object.entries(error.errors)) {
            errorMessage += `\n- ${key}: ${JSON.stringify(value)}`;
        }
    }
    
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
        
        helpText += "\n\n【kintoneアプリのライフサイクル】\n1. create_app: アプリを作成（プレビュー環境に作成される）\n2. add_fields: フィールドを追加（プレビュー環境に追加される）\n3. deploy_app: アプリをデプロイ（運用環境へ反映）\n4. get_deploy_status: デプロイ状態を確認（完了するまで待機）\n5. get_app_settings: 運用環境の設定を取得（デプロイ完了後）";
    }
    
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
            
            helpText += "\n\n【使用例】\n```json\n{\n  \"app_id\": 123,\n  \"fields\": {\n    \"project_name\": { \"value\": \"プロジェクト名\" },\n    \"project_manager\": { \"value\": \"山田太郎\" }\n  }\n}\n```";
        }
    }
    
    else if (error.message.includes("value") || error.message.includes("record") || error.message.includes("fields")) {
        helpText = formatErrorMessage(
            "フィールド形式エラー",
            "レコードのフィールド値の形式が正しくありません。",
            [
                "各フィールドは { \"value\": ... } の形式で指定する必要があります。",
                "フィールドタイプに応じて適切な値の形式が異なります：",
                "- 文字儗1行: { \"value\": \"テキスト\" }",
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
        
        helpText += "\n\n【レコード作成の使用例】\n```json\n{\n  \"app_id\": 1,\n  \"fields\": {\n    \"文字儗1行\": { \"value\": \"テスト\" },\n    \"文字列複数行\": { \"value\": \"テスト\\nテスト2\" },\n    \"数値\": { \"value\": \"20\" },\n    \"日時\": { \"value\": \"2014-02-16T08:57:00Z\" },\n    \"チェックボックス\": { \"value\": [\"sample1\", \"sample2\"] },\n    \"ユーザー選択\": { \"value\": [{ \"code\": \"sato\" }] },\n    \"ドロップダウン\": { \"value\": \"sample1\" },\n    \"リンク_ウェブ\": { \"value\": \"https://www.cybozu.com\" },\n    \"テーブル\": { \"value\": [{ \"value\": { \"テーブル文字列\": { \"value\": \"テスト\" } } }] }\n  }\n}\n```";
        
        helpText += "\n\n【レコード更新の使用例】\n```json\n{\n  \"app_id\": 1,\n  \"record_id\": 1001,\n  \"fields\": {\n    \"文字共1行_0\": { \"value\": \"character string is changed\" },\n    \"テーブル_0\": { \"value\": [{\n      \"id\": 1,\n      \"value\": {\n        \"文字共1行_1\": { \"value\": \"character string is changed\" }\n      }\n    }]}\n  }\n}\n```";
    }
    
    return { errorMessage, helpText };
}

export function handleToolError(error) {
    let errorCode = ErrorCode.InternalError;
    let errorMessage = error.message;
    let helpText = "";

    helpText = 
        handleChoiceFieldError(error) ||
        handleCalcFieldError(error) ||
        handleLookupFieldError(error) ||
        handleLayoutError(error) ||
        handleQueryError(error) ||
        "";

    if (error instanceof McpError) {
        return {
            content: [
                {
                    type: 'text',
                    text: error.message
                }
            ],
            isError: true
        };
    }
    
    if (error instanceof KintoneApiError) {
        errorCode = error.status >= 500 ? 
            ErrorCode.InternalError : 
            ErrorCode.InvalidRequest;
        
        const kintoneErrorResult = handleKintoneApiError(error);
        if (kintoneErrorResult) {
            errorMessage = kintoneErrorResult.errorMessage;
            if (kintoneErrorResult.helpText) {
                helpText = kintoneErrorResult.helpText;
            }
        }
    }

    if (helpText) {
        errorMessage += "\n\n" + helpText;
    }

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
