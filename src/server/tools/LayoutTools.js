// src/server/tools/LayoutTools.js
import { autoCorrectFieldWidth, autoCorrectLayoutWidths } from '../../utils/LayoutUtils.js';
import { ValidationUtils } from '../../utils/ValidationUtils.js';
import { LoggingUtils } from '../../utils/LoggingUtils.js';
import { ResponseBuilder } from '../../utils/ResponseBuilder.js';

// フィールドコードの自動生成関数
function generateFieldCode(label) {
    if (!label) return '';
    
    // ラベルから使用可能な文字のみを抽出
    let code = label;
    
    // 英数字、ひらがな、カタカナ、漢字、許可された記号以外を削除
    code = code.replace(/[^a-zA-Z0-9ぁ-んァ-ヶー一-龠々＿_･・＄￥]/g, '_');
    
    // 先頭が数字の場合、先頭に 'f_' を追加
    if (/^[0-9０-９]/.test(code)) {
        code = 'f_' + code;
    }
    
    return code;
}

// システムフィールドとレイアウト要素のリスト（事前作成不要）
const SYSTEM_FIELD_TYPES = [
    "RECORD_NUMBER", 
    "CREATOR", 
    "MODIFIER", 
    "CREATED_TIME", 
    "UPDATED_TIME"
];

// レイアウト要素のリスト（事前作成不要）
const LAYOUT_ELEMENT_TYPES = [
    "LABEL", 
    "SPACER", 
    "HR"
];

// レイアウトデータを再帰的に検証・修正する関数（同期版）
function validateAndFixLayout(layout, existingFieldCodes = []) {
    // 使用済みフィールドコードのリスト（既存 + 新規追加済み）
    const usedFieldCodes = [...existingFieldCodes];
    if (!Array.isArray(layout)) {
        LoggingUtils.logWarning('validateAndFixLayout', 'レイアウトが配列ではありません。自動的に配列に変換します。');
        layout = [layout];
    }
    
    // ROW内やGROUP内から抽出したSUBTABLEやGROUPを保存するための配列
    const extractedElements = [];
    
    // 各レイアウト要素を検証・修正
    const processedLayout = layout.map(item => {
        // typeプロパティが指定されていない場合は自動的に補完
        if (!item.type) {
            // トップレベルの要素は ROW, GROUP, SUBTABLE のいずれかである必要がある
            item.type = "ROW"; // デフォルトは ROW
            LoggingUtils.logWarning('validateAndFixLayout', 'レイアウト要素に type プロパティが指定されていません。自動的に "ROW" を設定します。');
        }
        
        // 要素タイプに応じた検証・修正
        if (item.type === "ROW") {
            // fieldsプロパティが指定されていない場合は自動的に補完
            if (!item.fields) {
                item.fields = [];
                LoggingUtils.logWarning('validateAndFixLayout', 'ROW要素に fields プロパティが指定されていません。空の配列を設定します。');
            }
            
            // fieldsプロパティが配列でない場合は配列に変換
            if (!Array.isArray(item.fields)) {
                LoggingUtils.logWarning('validateAndFixLayout', 'ROW要素の fields プロパティが配列ではありません。自動的に配列に変換します。');
                item.fields = [item.fields];
            }
            
            // ROW要素内からGROUP要素を抽出してトップレベルに移動
            const groupFields = item.fields.filter(field => field.type === "GROUP");
            if (groupFields.length > 0) {
                LoggingUtils.logWarning('validateAndFixLayout', 'ROW要素内のGROUP要素を自動的にトップレベルに移動しました。kintoneの仕様により、グループフィールドはトップレベルに配置する必要があります。');
                // GROUP要素をトップレベルに移動するために保存
                extractedElements.push(...groupFields);
                // ROW内からは除外
                item.fields = item.fields.filter(field => field.type !== "GROUP");
            }
            
            // ROW要素内からSUBTABLE要素を抽出してトップレベルに移動
            const subtableFields = item.fields.filter(field => field.type === "SUBTABLE");
            if (subtableFields.length > 0) {
                LoggingUtils.logWarning('validateAndFixLayout', 'ROW要素内のSUBTABLE要素を自動的にトップレベルに移動しました。kintoneの仕様により、テーブルはトップレベルに配置する必要があります。');
                // SUBTABLE要素をトップレベルに移動するために保存
                extractedElements.push(...subtableFields);
                // ROW内からは除外
                item.fields = item.fields.filter(field => field.type !== "SUBTABLE");
            }
            
            // 各フィールド要素を検証・修正
            item.fields = item.fields.map(field => {
                // typeプロパティが指定されていない場合は自動的に補完
                if (!field.type) {
                    // フィールド要素のデフォルトタイプは SINGLE_LINE_TEXT
                    field.type = "SINGLE_LINE_TEXT";
                    LoggingUtils.logWarning('validateAndFixLayout', 'フィールド要素に type プロパティが指定されていません。自動的に "SINGLE_LINE_TEXT" を設定します。');
                }
                
                // フィールドコードが存在するかチェック（システムフィールドとレイアウト要素は除外）
                if (field.code && 
                    !existingFieldCodes.includes(field.code) && 
                    !SYSTEM_FIELD_TYPES.includes(field.type) && 
                    !LAYOUT_ELEMENT_TYPES.includes(field.type) && 
                    field.type !== "REFERENCE_TABLE") {
                    
                    LoggingUtils.logWarning('validateAndFixLayout', 
                        `フィールドコード "${field.code}" (タイプ: ${field.type}) は存在しません。` +
                        `このフィールドはレイアウトに含める前に add_fields ツールで作成する必要があります。` +
                        `システムフィールド（${SYSTEM_FIELD_TYPES.join(', ')}）とレイアウト要素（${LAYOUT_ELEMENT_TYPES.join(', ')}）は事前作成不要です。`);
                }
                
                return field;
            });
        } else if (item.type === "GROUP") {
            // labelプロパティが指定されていない場合は自動的に補完
            if (!item.label) {
                item.label = `グループ${Date.now()}`;
                LoggingUtils.logWarning('validateAndFixLayout', `GROUP要素に label プロパティが指定されていません。自動的に "${item.label}" を設定します。`);
            }
            
            // codeプロパティが指定されていない場合は自動的に補完
            if (!item.code) {
                // labelから自動生成
                item.code = generateFieldCode(item.label);
                LoggingUtils.logDetailedOperation('validateAndFixLayout', 'GROUP要素のコードを自動生成', { code: item.code });
            }
            
            // fieldsプロパティが指定されている場合はlayoutプロパティに変換
            if (item.fields !== undefined) {
                LoggingUtils.logWarning('validateAndFixLayout', `GROUP要素 "${item.code}" に fields プロパティが指定されています。layout プロパティに変換します。GROUP要素には fields ではなく layout プロパティを使用してください。`);
                
                // fieldsプロパティが配列でない場合は配列に変換
                if (!Array.isArray(item.fields)) {
                    item.fields = [item.fields];
                }
                
                // fieldsの内容をROW要素に変換してlayoutに設定
                if (item.fields.length > 0) {
                    item.layout = [{
                        type: "ROW",
                        fields: item.fields
                    }];
                } else {
                    item.layout = [];
                }
                
                // fieldsプロパティを削除
                delete item.fields;
            }
            
            // 既存のフィールドコードとの重複チェック
            if (usedFieldCodes.includes(item.code)) {
                // 重複する場合、新しいフィールドコードを生成
                const originalCode = item.code;
                let newCode = originalCode;
                let suffix = 1;
                
                // 一意のフィールドコードになるまで接尾辞を追加
                while (usedFieldCodes.includes(newCode)) {
                    newCode = `${originalCode}_${suffix}`;
                    suffix++;
                }
                
                // フィールドコードを更新
                item.code = newCode;
                LoggingUtils.logDetailedOperation('validateAndFixLayout', 'GROUP要素のフィールドコード重複を解消', { newCode: item.code });
            }
            
            // 使用済みリストに追加
            usedFieldCodes.push(item.code);
            
            // openGroup プロパティが指定されていない場合は true を設定
            // kintoneの仕様では省略すると false になるが、このMCP Serverでは明示的に true を設定
            if (item.openGroup === undefined) {
                item.openGroup = true;
                LoggingUtils.logDetailedOperation('validateAndFixLayout', 'GROUP要素のopenGroupを自動設定', { code: item.code, openGroup: true });
            }
            
            // layoutプロパティが指定されていない場合は空の配列を設定
            if (item.layout === undefined) {
                item.layout = [];
                LoggingUtils.logWarning('validateAndFixLayout', `GROUP要素 "${item.code}" に layout プロパティが指定されていません。空の配列を設定します。`);
            }
            
            // layoutプロパティが配列でない場合は配列に変換
            if (!Array.isArray(item.layout)) {
                LoggingUtils.logWarning('validateAndFixLayout', `GROUP要素 "${item.code}" の layout プロパティが配列ではありません。自動的に配列に変換します。`);
                item.layout = [item.layout];
            }
            
            // グループ内からSUBTABLEとGROUP要素を抽出してトップレベルに移動
            const filteredLayout = [];
            for (const subItem of item.layout) {
                if (subItem.type === "SUBTABLE") {
                    LoggingUtils.logWarning('validateAndFixLayout', `GROUP要素 "${item.code}" 内のSUBTABLE要素を自動的にトップレベルに移動しました。kintoneの仕様により、グループフィールド内にテーブルを入れることはできません。`);
                    extractedElements.push(subItem);
                } else if (subItem.type === "GROUP") {
                    LoggingUtils.logWarning('validateAndFixLayout', `GROUP要素 "${item.code}" 内のGROUP要素を自動的にトップレベルに移動しました。kintoneの仕様により、グループフィールド内にグループフィールドを入れることはできません。`);
                    extractedElements.push(subItem);
                } else {
                    filteredLayout.push(subItem);
                }
            }
            
            // グループ内の各レイアウト要素を再帰的に検証・修正（同期的に呼び出し）
            if (filteredLayout.length > 0) {
                item.layout = validateAndFixLayout(filteredLayout);
            } else {
                item.layout = [];
            }
        } else if (item.type === "SUBTABLE") {
            // labelプロパティが指定されていない場合は自動的に補完
            if (!item.label) {
                item.label = `テーブル${Date.now()}`;
                LoggingUtils.logWarning('validateAndFixLayout', `SUBTABLE要素に label プロパティが指定されていません。自動的に "${item.label}" を設定します。`);
            }
            
            // codeプロパティが指定されていない場合は自動的に補完
            if (!item.code) {
                // labelから自動生成
                item.code = generateFieldCode(item.label);
                LoggingUtils.logDetailedOperation('validateAndFixLayout', 'SUBTABLE要素のコードを自動生成', { code: item.code });
            }
            
            // 既存のフィールドコードとの重複チェック
            if (usedFieldCodes.includes(item.code)) {
                // 重複する場合、新しいフィールドコードを生成
                const originalCode = item.code;
                let newCode = originalCode;
                let suffix = 1;
                
                // 一意のフィールドコードになるまで接尾辞を追加
                while (usedFieldCodes.includes(newCode)) {
                    newCode = `${originalCode}_${suffix}`;
                    suffix++;
                }
                
                // フィールドコードを更新
                item.code = newCode;
                LoggingUtils.logDetailedOperation('validateAndFixLayout', 'SUBTABLE要素のフィールドコード重複を解消', { newCode: item.code });
            }
            
            // 使用済みリストに追加
            usedFieldCodes.push(item.code);
            
            // テーブル内のフィールドを検証（テーブルのフィールド定義を取得できる場合）
            if (item.fields) {
                // GROUP要素がテーブル内に含まれていないことを確認
                const groupFields = Object.entries(item.fields).filter(([_, field]) => field.type === "GROUP");
                if (groupFields.length > 0) {
                    LoggingUtils.logWarning('validateAndFixLayout', 'SUBTABLE要素内にGROUP要素が含まれています。kintoneの仕槕により、グループフィールドはテーブル化できません。GROUP要素を自動的に除外します。');
                    
                    // GROUP要素を除外
                    groupFields.forEach(([key, _]) => {
                        delete item.fields[key];
                    });
                }
            }
        }
        
        return item;
    });
    
    // 抽出した要素をトップレベルに追加
    return [...processedLayout, ...extractedElements];
}

// スペース要素を作成する関数
function createSpacerElement(elementId = null, size = null) {
  const element = {
    type: "SPACER",
    elementId: elementId || `spacer_${Date.now()}`
  };
  
  if (size) {
    element.size = size;
  }
  
  return element;
}

// 罫線要素を作成する関数
function createHrElement(elementId = null) {
  return {
    type: "HR",
    elementId: elementId || `hr_${Date.now()}`
  };
}

// ラベル要素を作成する関数
function createLabelElement(value, elementId = null) {
  return {
    type: "LABEL",
    value: value,
    elementId: elementId || `label_${Date.now()}`
  };
}


// GROUPフィールドのlabelプロパティを削除し、layoutが空配列の場合はlayoutプロパティ自体を削除する関数
function cleanupGroupElements(layout) {
    if (!Array.isArray(layout)) {
        return layout;
    }
    
    return layout.map(item => {
        if (item.type === "GROUP") {
            // labelプロパティを削除
            if (item.label !== undefined) {
                delete item.label;
            }
            
            // layoutプロパティが空配列の場合は削除
            if (Array.isArray(item.layout) && item.layout.length === 0) {
                delete item.layout;
            } else if (Array.isArray(item.layout)) {
                // layoutプロパティが配列の場合は再帰的に処理
                item.layout = cleanupGroupElements(item.layout);
            }
        } else if (item.type === "ROW" && Array.isArray(item.fields)) {
            // ROW要素内のGROUP要素も処理
            item.fields = item.fields.map(field => {
                if (field.type === "GROUP") {
                    // labelプロパティを削除
                    if (field.label !== undefined) {
                        delete field.label;
                    }
                    
                    // layoutプロパティが空配列の場合は削除
                    if (Array.isArray(field.layout) && field.layout.length === 0) {
                        delete field.layout;
                    } else if (Array.isArray(field.layout)) {
                        // layoutプロパティが配列の場合は再帰的に処理
                        field.layout = cleanupGroupElements(field.layout);
                    }
                }
                return field;
            });
        }
        
        return item;
    });
}

// レイアウト関連のツールを処理する関数
export async function handleLayoutTools(name, args, repository) {
    // 共通のツール実行ログ
    LoggingUtils.logToolExecution('layout', name, args);
    
    switch (name) {
        case 'get_form_layout': {
            ValidationUtils.validateRequired(args, ['app_id']);
            
            LoggingUtils.logDetailedOperation('get_form_layout', 'フォームレイアウト取得', { appId: args.app_id });
            
            const response = await repository.getFormLayout(args.app_id);
            
            return response;
        }
        
        case 'update_form_layout': {
            ValidationUtils.validateRequired(args, ['app_id', 'layout']);
            ValidationUtils.validateArray(args.layout, 'layout');
            
            LoggingUtils.logDetailedOperation('update_form_layout', 'フォームレイアウト更新開始', { appId: args.app_id });
            LoggingUtils.logDetailedOperation('update_form_layout', '入力レイアウト', { layout: args.layout });
            
            // 既存のフィールド情報を取得
            let existingFieldCodes = [];
            try {
                const existingFields = await repository.getFormFields(args.app_id);
                existingFieldCodes = Object.keys(existingFields.properties || {});
                LoggingUtils.logDetailedOperation('update_form_layout', '既存フィールド一覧', { fieldCodes: existingFieldCodes });
            } catch (error) {
                LoggingUtils.logWarning('update_form_layout', `既存フィールドの取得に失敗: ${error.message}`);
                LoggingUtils.logWarning('update_form_layout', '重複チェックなしで続行します');
            }
            
            // レイアウトデータを検証・修正（同期的に呼び出し）
            const validatedLayout = validateAndFixLayout(args.layout, existingFieldCodes);
            
            // 変換後のレイアウトをログに出力
            LoggingUtils.logDetailedOperation('update_form_layout', '検証済みレイアウト', { layout: validatedLayout });
            
            // フォームフィールド情報を取得
            let formFields = null;
            try {
                LoggingUtils.logDetailedOperation('update_form_layout', 'フォームフィールド情報取得中', { appId: args.app_id });
                const fieldsResponse = await repository.getFormFields(args.app_id);
                formFields = fieldsResponse.properties || {};
                LoggingUtils.logDetailedOperation('update_form_layout', 'フォームフィールド情報取得完了', { fieldCount: Object.keys(formFields).length });
                
                // ルックアップフィールドの情報をログに出力（デバッグ用）
                const lookupFields = Object.entries(formFields).filter(([_, field]) => field.lookup !== undefined);
                if (lookupFields.length > 0) {
                    LoggingUtils.logDetailedOperation('update_form_layout', 'ルックアップフィールド検出', { count: lookupFields.length });
                    lookupFields.forEach(([code, field]) => {
                        LoggingUtils.logDetailedOperation('update_form_layout', 'ルックアップフィールド詳細', {
                            code,
                            type: field.type,
                            relatedApp: field.lookup.relatedApp?.app,
                            relatedKeyField: field.lookup.relatedKeyField
                        });
                    });
                } else {
                    LoggingUtils.logDetailedOperation('update_form_layout', 'ルックアップフィールドなし', {});
                }
            } catch (error) {
                LoggingUtils.logWarning('update_form_layout', `フォームフィールド情報の取得に失敗: ${error.message}`);
                LoggingUtils.logWarning('update_form_layout', '幅の自動補正をスキップします');
                formFields = null;
            }
            
            // レイアウトの幅を自動補正
            let correctedLayout = validatedLayout;
            let layoutGuidances = [];
            
            if (formFields) {
                LoggingUtils.logDetailedOperation('update_form_layout', 'レイアウト幅の自動補正開始', {});
                
                // 補正前のレイアウト情報をログに出力
                const fieldsBeforeCorrection = [];
                const extractFieldInfo = (items) => {
                    items.forEach(item => {
                        if (item.type === "ROW" && item.fields) {
                            item.fields.forEach(field => {
                                if (field.code) {
                                    fieldsBeforeCorrection.push({
                                        code: field.code,
                                        type: field.type,
                                        width: field.size?.width || "未指定",
                                        isLookup: formFields[field.code]?.lookup !== undefined
                                    });
                                }
                            });
                        } else if (item.type === "GROUP" && item.layout) {
                            extractFieldInfo(item.layout);
                        }
                    });
                };
                extractFieldInfo(validatedLayout);
                LoggingUtils.logDetailedOperation('update_form_layout', '補正前のフィールド情報', { fields: fieldsBeforeCorrection });
                
                // 幅の自動補正を実行
                const correctionResult = autoCorrectLayoutWidths(validatedLayout, formFields);
                correctedLayout = correctionResult.layout;
                layoutGuidances = correctionResult.guidances;
                LoggingUtils.logDetailedOperation('update_form_layout', 'レイアウト幅の自動補正完了', {});
                
                // ガイダンスメッセージがあれば出力
                if (layoutGuidances.length > 0) {
                    LoggingUtils.logDetailedOperation('update_form_layout', 'ガイダンスメッセージ', { messages: layoutGuidances });
                }
                
                // 補正後のレイアウト情報をログに出力
                const fieldsAfterCorrection = [];
                const extractCorrectedFieldInfo = (items) => {
                    items.forEach(item => {
                        if (item.type === "ROW" && item.fields) {
                            item.fields.forEach(field => {
                                if (field.code) {
                                    fieldsAfterCorrection.push({
                                        code: field.code,
                                        type: field.type,
                                        width: field.size?.width || "未指定",
                                        isLookup: formFields[field.code]?.lookup !== undefined
                                    });
                                }
                            });
                        } else if (item.type === "GROUP" && item.layout) {
                            extractCorrectedFieldInfo(item.layout);
                        }
                    });
                };
                extractCorrectedFieldInfo(correctedLayout);
                LoggingUtils.logDetailedOperation('update_form_layout', '補正後のフィールド情報', { fields: fieldsAfterCorrection });
                
                // 変更があったフィールドを特定
                const changedFields = fieldsAfterCorrection.filter((field, index) => {
                    const beforeField = fieldsBeforeCorrection[index];
                    return beforeField && field.width !== beforeField.width;
                });
                if (changedFields.length > 0) {
                    LoggingUtils.logDetailedOperation('update_form_layout', '幅が変更されたフィールド', { fields: changedFields });
                } else {
                    LoggingUtils.logDetailedOperation('update_form_layout', '幅が変更されたフィールドなし', {});
                }
            } else {
                LoggingUtils.logWarning('update_form_layout', 'フォームフィールド情報が取得できなかったため、幅の自動補正をスキップします');
            }
            
            // GROUPフィールドのlabelプロパティを削除し、layoutが空配列の場合はlayoutプロパティ自体を削除
            const cleanedLayout = cleanupGroupElements(correctedLayout);
            
            // 深いコピーを作成して参照の問題を解決
            const finalLayout = JSON.parse(JSON.stringify(cleanedLayout));
            
            // 最終的なレイアウトをログに出力
            LoggingUtils.logDetailedOperation('update_form_layout', '最終レイアウト（API呼び出し前）', { layout: finalLayout });
            
            const revision = args.revision || -1; // リビジョン番号（省略時は最新）
            
            try {
                const response = await repository.updateFormLayout(
                    args.app_id,
                    finalLayout,
                    revision
                );
                
                // ガイダンスメッセージがあればレスポンスに含める
                if (layoutGuidances.length > 0) {
                    return {
                        ...response,
                        guidances: layoutGuidances
                    };
                }
                
                return response;
            } catch (error) {
                // エラーの詳細情報を出力
                LoggingUtils.logError('update_form_layout', 'フォームレイアウトの更新エラー', error);
                if (error.errors) {
                    LoggingUtils.logError('update_form_layout', '詳細エラー', error.errors);
                }
                throw error;
            }
        }
        
        case 'create_form_layout': {
            ValidationUtils.validateRequired(args, ['app_id', 'fields']);
            ValidationUtils.validateArray(args.fields, 'fields');
            
            LoggingUtils.logDetailedOperation('create_form_layout', 'フォームレイアウト作成開始', { appId: args.app_id });
            LoggingUtils.logDetailedOperation('create_form_layout', 'フィールド定義', { fields: args.fields });
            
            // 既存のフィールド情報を取得
            let existingFieldCodes = [];
            try {
                const existingFields = await repository.getFormFields(args.app_id);
                existingFieldCodes = Object.keys(existingFields.properties || {});
                LoggingUtils.logDetailedOperation('update_form_layout', '既存フィールド一覧', { fieldCodes: existingFieldCodes });
            } catch (error) {
                LoggingUtils.logWarning('update_form_layout', `既存フィールドの取得に失敗: ${error.message}`);
                LoggingUtils.logWarning('update_form_layout', '重複チェックなしで続行します');
            }
            
            // レイアウト構造を構築
            const layout = buildFormLayout(args.fields, args.options || {});
            
            // レイアウトを検証・修正（同期的に呼び出し）
            const validatedLayout = validateAndFixLayout(layout, existingFieldCodes);
            
            // フォームフィールド情報を取得
            let formFields = null;
            try {
                const fieldsResponse = await repository.getFormFields(args.app_id);
                formFields = fieldsResponse.properties || {};
                LoggingUtils.logDetailedOperation('create_form_layout', '幅補正用フォームフィールド取得完了', { fieldCount: Object.keys(formFields).length });
                
                // ルックアップフィールドの情報をログに出力（デバッグ用）
                const lookupFields = Object.entries(formFields).filter(([_, field]) => field.lookup !== undefined);
                if (lookupFields.length > 0) {
                    LoggingUtils.logDetailedOperation('create_form_layout', 'ルックアップフィールド検出', { count: lookupFields.length, fields: lookupFields.map(([code]) => code) });
                } else {
                    LoggingUtils.logDetailedOperation('create_form_layout', 'ルックアップフィールドなし', {});
                }
            } catch (error) {
                LoggingUtils.logWarning('create_form_layout', `幅補正用フィールド情報の取得に失敗: ${error.message}`);
                LoggingUtils.logWarning('create_form_layout', '幅補正なしで続行します');
            }
            
            // レイアウトの幅を自動補正
            let correctedLayout = validatedLayout;
            let layoutGuidances = [];
            
            if (formFields) {
                const correctionResult = autoCorrectLayoutWidths(validatedLayout, formFields);
                correctedLayout = correctionResult.layout;
                layoutGuidances = correctionResult.guidances;
                LoggingUtils.logDetailedOperation('create_form_layout', 'レイアウト幅補正適用完了', {});
                
                // ガイダンスメッセージがあれば出力
                if (layoutGuidances.length > 0) {
                    LoggingUtils.logDetailedOperation('update_form_layout', 'ガイダンスメッセージ', { messages: layoutGuidances });
                }
            }
            
            // 深いコピーを作成して参照の問題を解決
            const finalLayout = JSON.parse(JSON.stringify(correctedLayout));
            
            // 最終的なレイアウトをログに出力
            LoggingUtils.logDetailedOperation('update_form_layout', '最終レイアウト（API呼び出し前）', { layout: finalLayout });
            
            try {
                // レイアウトを更新
                const response = await repository.updateFormLayout(
                    args.app_id,
                    finalLayout,
                    -1 // 最新リビジョン
                );
                
                // ガイダンスメッセージがあればレスポンスに含める
                if (layoutGuidances.length > 0) {
                    return {
                        revision: response.revision,
                        layout: layout,
                        guidances: layoutGuidances
                    };
                } else {
                    return {
                        revision: response.revision,
                        layout: layout
                    };
                }
            } catch (error) {
                // エラーの詳細情報を出力
                LoggingUtils.logError('create_form_layout', 'フォームレイアウトの作成エラー', error);
                if (error.errors) {
                    LoggingUtils.logError('create_form_layout', '詳細エラー', error.errors);
                }
                throw error;
            }
        }
        
        case 'add_layout_element': {
            ValidationUtils.validateRequired(args, ['app_id', 'element']);
            ValidationUtils.validateObject(args.element, 'element');
            if (args.position !== undefined) {
                ValidationUtils.validateObject(args.position, 'position');
            }
            
            LoggingUtils.logDetailedOperation('add_layout_element', 'レイアウト要素追加開始', { appId: args.app_id });
            LoggingUtils.logDetailedOperation('add_layout_element', '追加要素', { element: args.element });
            
            // 現在のレイアウトを取得
            const currentLayout = await repository.getFormLayout(args.app_id);
            
            // 既存のフィールド情報を取得
            let existingFieldCodes = [];
            try {
                const existingFields = await repository.getFormFields(args.app_id);
                existingFieldCodes = Object.keys(existingFields.properties || {});
                LoggingUtils.logDetailedOperation('update_form_layout', '既存フィールド一覧', { fieldCodes: existingFieldCodes });
            } catch (error) {
                LoggingUtils.logWarning('update_form_layout', `既存フィールドの取得に失敗: ${error.message}`);
                LoggingUtils.logWarning('update_form_layout', '重複チェックなしで続行します');
            }
            
            // 要素を検証・修正
            let validatedElement = args.element;
            if (args.element.type === "GROUP" || args.element.type === "SUBTABLE") {
                // GROUP要素とSUBTABLE要素は検証・修正（同期的に呼び出し）
                const validatedElements = validateAndFixLayout([args.element], existingFieldCodes);
                validatedElement = validatedElements[0];
            }
            
            // 新しいレイアウトを構築
            const newLayout = addElementToLayout(
                currentLayout.layout,
                validatedElement,
                args.position || {}
            );
            
            // フォームフィールド情報を取得
            let formFields = null;
            try {
                const fieldsResponse = await repository.getFormFields(args.app_id);
                formFields = fieldsResponse.properties || {};
                LoggingUtils.logDetailedOperation('add_layout_element', '幅補正用フォームフィールド取得完了', {});
            } catch (error) {
                LoggingUtils.logWarning('create_form_layout', `幅補正用フィールド情報の取得に失敗: ${error.message}`);
                LoggingUtils.logWarning('create_form_layout', '幅補正なしで続行します');
            }
            
            // レイアウトの幅を自動補正
            let correctedLayout = newLayout;
            let layoutGuidances = [];
            
            if (formFields) {
                const correctionResult = autoCorrectLayoutWidths(newLayout, formFields);
                correctedLayout = correctionResult.layout;
                layoutGuidances = correctionResult.guidances;
                LoggingUtils.logDetailedOperation('create_form_layout', 'レイアウト幅補正適用完了', {});
                
                // ガイダンスメッセージがあれば出力
                if (layoutGuidances.length > 0) {
                    LoggingUtils.logDetailedOperation('update_form_layout', 'ガイダンスメッセージ', { messages: layoutGuidances });
                }
            }
            
            // 深いコピーを作成して参照の問題を解決
            const finalLayout = JSON.parse(JSON.stringify(correctedLayout));
            
            // 最終的なレイアウトをログに出力
            LoggingUtils.logDetailedOperation('update_form_layout', '最終レイアウト（API呼び出し前）', { layout: finalLayout });
            
            try {
                // レイアウトを更新
                const response = await repository.updateFormLayout(
                    args.app_id,
                    finalLayout,
                    currentLayout.revision
                );
                
                // ガイダンスメッセージがあればレスポンスに含める
                if (layoutGuidances.length > 0) {
                    return {
                        revision: response.revision,
                        layout: newLayout,
                        guidances: layoutGuidances
                    };
                } else {
                    return {
                        revision: response.revision,
                        layout: newLayout
                    };
                }
            } catch (error) {
                // エラーの詳細情報を出力
                LoggingUtils.logError('add_layout_element', 'レイアウト要素の追加エラー', error);
                if (error.errors) {
                    LoggingUtils.logError('add_layout_element', '詳細エラー', error.errors);
                }
                throw error;
            }
        }
        
        case 'create_group_layout': {
            ValidationUtils.validateRequired(args, ['code', 'label', 'fields']);
            ValidationUtils.validateArray(args.fields, 'fields');
            
            LoggingUtils.logDetailedOperation('create_group_layout', 'グループレイアウト作成', { 
                code: args.code, 
                label: args.label,
                fields: args.fields 
            });
            
            // グループ内のレイアウトを構築
            const groupLayout = buildGroupLayout(args.fields, args.options || {});
            
            // グループ要素を作成
            const groupElement = {
                type: "GROUP",
                code: args.code,
                label: args.label,
                openGroup: args.openGroup !== false, // デフォルトは開いた状態
                layout: groupLayout
            };
            
            return groupElement;
        }
        
        case 'create_table_layout': {
            ValidationUtils.validateRequired(args, ['rows']);
            ValidationUtils.validateArray(args.rows, 'rows');
            
            LoggingUtils.logDetailedOperation('create_table_layout', 'テーブルレイアウト作成', { rowCount: args.rows.length });
            
            // テーブルレイアウトを構築
            const tableLayout = buildTableLayout(args.rows, args.options || {});
            
            return tableLayout;
        }
        
        case 'create_spacer_element': {
            const elementId = args.elementId;
            const size = {};
            
            if (args.width !== undefined) {
                size.width = args.width;
            }
            
            if (args.height !== undefined) {
                size.height = args.height;
            }
            
            const logData = { elementId };
            if (Object.keys(size).length > 0) {
                logData.size = size;
            }
            LoggingUtils.logDetailedOperation('create_spacer_element', 'スペーサー要素作成', logData);
            
            // スペース要素を作成
            const spacerElement = createSpacerElement(
                elementId,
                Object.keys(size).length > 0 ? size : null
            );
            
            return spacerElement;
        }
        
        case 'create_hr_element': {
            const elementId = args.elementId;
            
            LoggingUtils.logDetailedOperation('create_hr_element', '罫線要素作成', { elementId });
            
            // 罫線要素を作成
            const hrElement = createHrElement(elementId);
            
            return hrElement;
        }
        
        case 'create_label_element': {
            ValidationUtils.validateRequired(args, ['value']);
            
            const value = args.value;
            const elementId = args.elementId;
            
            LoggingUtils.logDetailedOperation('create_label_element', 'ラベル要素作成', { value, elementId });
            
            // ラベル要素を作成
            const labelElement = createLabelElement(value, elementId);
            
            return labelElement;
        }
        
        default:
            throw new Error(`Unknown layout tool: ${name}`);
    }
}

// フォームレイアウトを構築する関数
function buildFormLayout(fields, options = {}) {
    const layout = [];
    
    // フィールドをグループ化（セクション分け）するかどうか
    const groupBySection = options.groupBySection === true;
    // 1行あたりの最大フィールド数
    const fieldsPerRow = options.fieldsPerRow || 1;
    
    if (groupBySection) {
        // セクションごとにグループ化
        const sections = {};
        
        // フィールドをセクションごとに分類
        fields.forEach(field => {
            const sectionName = field.section || 'デフォルト';
            if (!sections[sectionName]) {
                sections[sectionName] = [];
            }
            sections[sectionName].push(field);
        });
        
        // 各セクションをグループとして追加
        Object.entries(sections).forEach(([sectionName, sectionFields]) => {
            // セクション内のレイアウトを構築
            const sectionLayout = buildSectionLayout(sectionFields, { fieldsPerRow });
            
            // セクションがデフォルト以外の場合はグループとして追加
            if (sectionName !== 'デフォルト') {
                layout.push({
                    type: "GROUP",
                    code: `section_${sectionName.replace(/\s+/g, '_').toLowerCase()}`,
                    label: sectionName,
                    openGroup: true,
                    layout: sectionLayout
                });
            } else {
                // デフォルトセクションの場合は直接追加
                layout.push(...sectionLayout);
            }
        });
    } else {
        // セクション分けなしで単純にレイアウトを構築
        layout.push(...buildSectionLayout(fields, { fieldsPerRow }));
    }
    
    return layout;
}

// セクション内のレイアウトを構築する関数
function buildSectionLayout(fields, options = {}) {
    const layout = [];
    const fieldsPerRow = options.fieldsPerRow || 1;
    
    // フィールドを行ごとに分割
    for (let i = 0; i < fields.length; i += fieldsPerRow) {
        const rowFields = fields.slice(i, i + fieldsPerRow);
        
        // 行要素を作成
        const row = {
            type: "ROW",
            fields: []
        };
        
        // 行内の各フィールドを追加
        rowFields.forEach(field => {
            // フィールドタイプに応じた要素を作成
            let element;
            
            if (field.type === "LABEL") {
                element = {
                    type: "LABEL",
                    value: field.value || field.label
                };
            } else if (field.type === "SPACER") {
                element = {
                    type: "SPACER",
                    elementId: field.elementId || `spacer_${Date.now()}`
                };
            } else if (field.type === "HR") {
                element = {
                    type: "HR",
                    elementId: field.elementId || `hr_${Date.now()}`
                };
            } else if (field.type === "REFERENCE_TABLE") {
                element = {
                    type: "REFERENCE_TABLE",
                    code: field.code
                };
            } else if (field.type === "GROUP") {
                // グループ要素はそのまま追加（既に構築済みと仮定）
                layout.push(field);
                return; // この要素は行に追加しない
            } else {
                // 通常のフィールド - レイアウト要素としては実際のフィールドタイプを使用
                // kintoneのAPIではフィールド要素のタイプは実際のフィールドタイプ（"NUMBER"など）を指定する必要がある
                
                // コードが指定されていない場合はエラー
                if (!field.code) {
                    throw new Error(`フィールド要素にはコード(code)の指定が必須です。`);
                }
                
                // フィールドタイプの取得（優先順位: field.type > field.fieldType > デフォルト値）
                let fieldType = field.type || field.fieldType;
                
                // フィールドタイプが指定されていない場合はエラー
                if (!fieldType) {
                    throw new Error(`フィールド要素 "${field.code}" にはフィールドタイプ(type または fieldType)の指定が必須です。`);
                }
                
                element = {
                    type: fieldType, // 実際のフィールドタイプを使用
                    code: field.code,
                    size: field.size || {}
                };
            }
            
            // 行に要素を追加
            row.fields.push(element);
        });
        
        // 行要素をレイアウトに追加（フィールドがある場合のみ）
        if (row.fields.length > 0) {
            layout.push(row);
        }
    }
    
    return layout;
}

// グループ内のレイアウトを構築する関数
function buildGroupLayout(fields, options = {}) {
    // 基本的にはセクションレイアウトと同じ
    return buildSectionLayout(fields, options);
}

// テーブルレイアウトを構築する関数
function buildTableLayout(rows, options = {}) {
    const layout = [];
    
    // 各行を処理
    rows.forEach(rowFields => {
        // 行要素を作成
        const row = {
            type: "ROW",
            fields: []
        };
        
        // 行内の各フィールドを追加
        rowFields.forEach(field => {
            // フィールドタイプに応じた要素を作成
            let element;
            
            if (field.type === "LABEL") {
                element = {
                    type: "LABEL",
                    value: field.value || field.label
                };
            } else if (field.type === "SPACER") {
                element = {
                    type: "SPACER",
                    elementId: field.elementId || `spacer_${Date.now()}`
                };
            } else if (field.type === "HR") {
                element = {
                    type: "HR",
                    elementId: field.elementId || `hr_${Date.now()}`
                };
            } else if (field.type === "REFERENCE_TABLE") {
                element = {
                    type: "REFERENCE_TABLE",
                    code: field.code
                };
            } else {
                // 通常のフィールド - レイアウト要素としては実際のフィールドタイプを使用
                // kintoneのAPIではフィールド要素のタイプは実際のフィールドタイプ（"NUMBER"など）を指定する必要がある
                
                // コードが指定されていない場合はエラー
                if (!field.code) {
                    throw new Error(`テーブル内のフィールド要素にはコード(code)の指定が必須です。`);
                }
                
                // フィールドタイプの取得（優先順位: field.type > field.fieldType > デフォルト値）
                let fieldType = field.type || field.fieldType;
                
                // フィールドタイプが指定されていない場合はエラー
                if (!fieldType) {
                    throw new Error(`テーブル内のフィールド要素 "${field.code}" にはフィールドタイプ(type または fieldType)の指定が必須です。`);
                }
                
                element = {
                    type: fieldType, // 実際のフィールドタイプを使用
                    code: field.code,
                    size: field.size || {}
                };
            }
            
            // 行に要素を追加
            row.fields.push(element);
        });
        
        // 行要素をレイアウトに追加（フィールドがある場合のみ）
        if (row.fields.length > 0) {
            layout.push(row);
        }
    });
    
    return layout;
}

// レイアウトに要素を追加する関数
function addElementToLayout(layout, element, position = {}) {
    // レイアウトのコピーを作成
    const newLayout = JSON.parse(JSON.stringify(layout));
    
    // 位置指定がある場合
    if (position.index !== undefined) {
        // 指定された位置に要素を挿入
        if (position.type === "GROUP" && position.groupCode) {
            // グループ内に挿入
            const groupIndex = newLayout.findIndex(item => 
                item.type === "GROUP" && item.code === position.groupCode
            );
            
            if (groupIndex >= 0) {
                if (!newLayout[groupIndex].layout) {
                    newLayout[groupIndex].layout = [];
                }
                
                // グループ内の指定位置に挿入
                if (element.type === "ROW") {
                    // ROW要素はそのまま挿入
                    newLayout[groupIndex].layout.splice(position.index, 0, element);
                } else {
                    // その他の要素はROWでラップして挿入
                    const row = {
                        type: "ROW",
                        fields: [element]
                    };
                    newLayout[groupIndex].layout.splice(position.index, 0, row);
                }
            }
        } else {
            // トップレベルに挿入
            if (element.type === "ROW" || element.type === "GROUP" || element.type === "SUBTABLE") {
                // ROW, GROUP, SUBTABLE要素はそのまま挿入
                newLayout.splice(position.index, 0, element);
            } else {
                // その他の要素はROWでラップして挿入
                const row = {
                    type: "ROW",
                    fields: [element]
                };
                newLayout.splice(position.index, 0, row);
            }
        }
    } else if (position.after || position.before) {
        // 特定の要素の前後に挿入
        const targetCode = position.after || position.before;
        let inserted = false;
        
        // レイアウト内の各要素を再帰的に検索
        function searchAndInsert(items) {
            if (inserted) return items;
            
            return items.map(item => {
                // 既に挿入済みなら処理しない
                if (inserted) return item;
                
                // GROUP要素の場合は内部レイアウトも検索
                if (item.type === "GROUP" && item.layout) {
                    return {
                        ...item,
                        layout: searchAndInsert(item.layout)
                    };
                }
                
                // ROW要素の場合はフィールドを検索
                if (item.type === "ROW" && item.fields) {
                    // フィールド内にターゲットがあるか検索
                    // 注意: フィールド要素のタイプは実際のフィールドタイプ（"NUMBER"など）になっているため、
                    // 特定のタイプではなく、コードで検索する
                    const fieldIndex = item.fields.findIndex(field => 
                        field.code === targetCode
                    );
                    
                    if (fieldIndex >= 0) {
                        // 要素を挿入する位置を決定
                        const insertIndex = position.after ? fieldIndex + 1 : fieldIndex;
                        
                        // 要素を挿入
                        const newFields = [...item.fields];
                        newFields.splice(insertIndex, 0, element);
                        inserted = true;
                        
                        return {
                            ...item,
                            fields: newFields
                        };
                    }
                }
                
                return item;
            });
        }
        
        // レイアウト内を検索して要素を挿入
        const updatedLayout = searchAndInsert(newLayout);
        
        // 要素が挿入されなかった場合は最後に追加
        if (!inserted) {
            if (element.type === "ROW" || element.type === "GROUP" || element.type === "SUBTABLE") {
                // ROW, GROUP, SUBTABLE要素はそのまま追加
                updatedLayout.push(element);
            } else {
                // その他の要素はROWでラップして追加
                const row = {
                    type: "ROW",
                    fields: [element]
                };
                updatedLayout.push(row);
            }
        }
        
        return updatedLayout;
    } else {
        // 位置指定がない場合は最後に追加
        if (element.type === "ROW" || element.type === "GROUP" || element.type === "SUBTABLE") {
            // ROW, GROUP, SUBTABLE要素はそのまま追加
            newLayout.push(element);
        } else {
            // その他の要素はROWでラップして追加
            const row = {
                type: "ROW",
                fields: [element]
            };
            newLayout.push(row);
        }
    }
    
    return newLayout;
}
