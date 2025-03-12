// src/server/tools/LayoutTools.js

// レイアウトデータを再帰的に検証・修正する関数
function validateAndFixLayout(layout) {
    if (!Array.isArray(layout)) {
        console.error(`Warning: レイアウトが配列ではありません。自動的に配列に変換します。`);
        layout = [layout];
    }
    
    // 各レイアウト要素を検証・修正
    return layout.map(item => {
        // typeプロパティが指定されていない場合は自動的に補完
        if (!item.type) {
            // トップレベルの要素は ROW, GROUP, SUBTABLE のいずれかである必要がある
            item.type = "ROW"; // デフォルトは ROW
            console.error(`Warning: レイアウト要素に type プロパティが指定されていません。自動的に "ROW" を設定します。`);
        }
        
        // 要素タイプに応じた検証・修正
        if (item.type === "ROW") {
            // fieldsプロパティが指定されていない場合は自動的に補完
            if (!item.fields) {
                item.fields = [];
                console.error(`Warning: ROW要素に fields プロパティが指定されていません。空の配列を設定します。`);
            }
            
            // fieldsプロパティが配列でない場合は配列に変換
            if (!Array.isArray(item.fields)) {
                console.error(`Warning: ROW要素の fields プロパティが配列ではありません。自動的に配列に変換します。`);
                item.fields = [item.fields];
            }
            
            // GROUP要素が含まれる場合は、それが唯一の要素であることを確認
            const groupFields = item.fields.filter(field => field.type === "GROUP");
            if (groupFields.length > 0 && item.fields.length > groupFields.length) {
                console.error(`Warning: GROUP要素を含む行に他のフィールドが配置されています。kintoneの仕様により、グループフィールドの左右にはフィールドを配置できません。GROUP要素のみを残します。`);
                // GROUP要素のみを残す
                item.fields = groupFields;
            }
            
            // 各フィールド要素を検証・修正
            item.fields = item.fields.map(field => {
                // typeプロパティが指定されていない場合は自動的に補完
                if (!field.type) {
                    // フィールド要素のデフォルトタイプは SINGLE_LINE_TEXT
                    field.type = "SINGLE_LINE_TEXT";
                    console.error(`Warning: フィールド要素に type プロパティが指定されていません。自動的に "SINGLE_LINE_TEXT" を設定します。`);
                }
                
                return field;
            });
        } else if (item.type === "GROUP") {
            // codeプロパティが指定されていない場合は自動的に補完
            if (!item.code) {
                item.code = `group_${Date.now()}`;
                console.error(`Warning: GROUP要素に code プロパティが指定されていません。自動的に "${item.code}" を設定します。`);
            }
            
            // labelプロパティが指定されていない場合は自動的に補完
            if (!item.label) {
                item.label = `Group ${item.code}`;
                console.error(`Warning: GROUP要素に label プロパティが指定されていません。自動的に "${item.label}" を設定します。`);
            }
            
            // openGroup プロパティが指定されていない場合は true を設定
            // kintoneの仕様では省略すると false になるが、このMCP Serverでは明示的に true を設定
            if (item.openGroup === undefined) {
                item.openGroup = true;
                console.error(`Warning: GROUP要素 "${item.code}" の openGroup プロパティが指定されていません。自動的に true を設定します。`);
            }
            
            // layoutプロパティが指定されていない場合は自動的に補完
            if (!item.layout) {
                item.layout = [];
                console.error(`Warning: GROUP要素 "${item.code}" に layout プロパティが指定されていません。空の配列を設定します。`);
            }
            
            // layoutプロパティが配列でない場合は配列に変換
            if (!Array.isArray(item.layout)) {
                console.error(`Warning: GROUP要素 "${item.code}" の layout プロパティが配列ではありません。自動的に配列に変換します。`);
                item.layout = [item.layout];
            }
            
            // グループ内からSUBTABLEとGROUP要素を除外
            const filteredLayout = item.layout.filter(subItem => {
                if (subItem.type === "SUBTABLE") {
                    console.error(`Warning: GROUP要素 "${item.code}" 内のSUBTABLE要素を自動的に除外しました。kintoneの仕様により、グループフィールド内にテーブルを入れることはできません。`);
                    return false;
                }
                if (subItem.type === "GROUP") {
                    console.error(`Warning: GROUP要素 "${item.code}" 内のGROUP要素を自動的に除外しました。kintoneの仕様により、グループフィールド内にグループフィールドを入れることはできません。`);
                    return false;
                }
                return true;
            });
            
            // グループ内の各レイアウト要素を再帰的に検証・修正
            item.layout = validateAndFixLayout(filteredLayout);
        } else if (item.type === "SUBTABLE") {
            // codeプロパティが指定されていない場合は自動的に補完
            if (!item.code) {
                item.code = `subtable_${Date.now()}`;
                console.error(`Warning: SUBTABLE要素に code プロパティが指定されていません。自動的に "${item.code}" を設定します。`);
            }
            
            // テーブル内のフィールドを検証（テーブルのフィールド定義を取得できる場合）
            if (item.fields) {
                // GROUP要素がテーブル内に含まれていないことを確認
                const groupFields = Object.entries(item.fields).filter(([_, field]) => field.type === "GROUP");
                if (groupFields.length > 0) {
                    console.error(`Warning: SUBTABLE要素内にGROUP要素が含まれています。kintoneの仕様により、グループフィールドはテーブル化できません。GROUP要素を自動的に除外します。`);
                    
                    // GROUP要素を除外
                    groupFields.forEach(([key, _]) => {
                        delete item.fields[key];
                    });
                }
            }
        }
        
        return item;
    });
}

// レイアウト関連のツールを処理する関数
export async function handleLayoutTools(name, args, repository) {
    switch (name) {
        case 'get_form_layout': {
            // 引数のチェック
            if (!args.app_id) {
                throw new Error('app_id は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Getting form layout for app: ${args.app_id}`);
            
            const response = await repository.getFormLayout(args.app_id);
            
            return response;
        }
        
        case 'update_form_layout': {
            // 引数のチェック
            if (!args.app_id) {
                throw new Error('app_id は必須パラメータです。');
            }
            if (!args.layout) {
                throw new Error('layout は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Updating form layout for app: ${args.app_id}`);
            
            // レイアウトデータを検証・修正
            const validatedLayout = validateAndFixLayout(args.layout);
            
            console.error(`Layout:`, JSON.stringify(validatedLayout, null, 2));
            
            const revision = args.revision || -1; // リビジョン番号（省略時は最新）
            
            const response = await repository.updateFormLayout(
                args.app_id,
                validatedLayout,
                revision
            );
            
            return response;
        }
        
        case 'create_form_layout': {
            // 引数のチェック
            if (!args.app_id) {
                throw new Error('app_id は必須パラメータです。');
            }
            if (!args.fields || !Array.isArray(args.fields)) {
                throw new Error('fields は必須パラメータで、配列形式で指定する必要があります。');
            }
            
            // デバッグ用のログ出力
            console.error(`Creating form layout for app: ${args.app_id}`);
            console.error(`Fields:`, JSON.stringify(args.fields, null, 2));
            
            // レイアウト構造を構築
            const layout = buildFormLayout(args.fields, args.options || {});
            
            // レイアウトを更新
            const response = await repository.updateFormLayout(
                args.app_id,
                layout,
                -1 // 最新リビジョン
            );
            
            return {
                revision: response.revision,
                layout: layout
            };
        }
        
        case 'add_layout_element': {
            // 引数のチェック
            if (!args.app_id) {
                throw new Error('app_id は必須パラメータです。');
            }
            if (!args.element) {
                throw new Error('element は必須パラメータです。');
            }
            if (args.position !== undefined && typeof args.position !== 'object') {
                throw new Error('position はオブジェクト形式で指定する必要があります。');
            }
            
            // デバッグ用のログ出力
            console.error(`Adding layout element to app: ${args.app_id}`);
            console.error(`Element:`, JSON.stringify(args.element, null, 2));
            
            // 現在のレイアウトを取得
            const currentLayout = await repository.getFormLayout(args.app_id);
            
            // 新しいレイアウトを構築
            const newLayout = addElementToLayout(
                currentLayout.layout,
                args.element,
                args.position || {}
            );
            
            // レイアウトを更新
            const response = await repository.updateFormLayout(
                args.app_id,
                newLayout,
                currentLayout.revision
            );
            
            return {
                revision: response.revision,
                layout: newLayout
            };
        }
        
        case 'create_group_layout': {
            // 引数のチェック
            if (!args.code) {
                throw new Error('code は必須パラメータです。');
            }
            if (!args.label) {
                throw new Error('label は必須パラメータです。');
            }
            if (!args.fields || !Array.isArray(args.fields)) {
                throw new Error('fields は必須パラメータで、配列形式で指定する必要があります。');
            }
            
            // デバッグ用のログ出力
            console.error(`Creating group layout: ${args.code}`);
            console.error(`Label: ${args.label}`);
            console.error(`Fields:`, JSON.stringify(args.fields, null, 2));
            
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
            // 引数のチェック
            if (!args.rows || !Array.isArray(args.rows)) {
                throw new Error('rows は必須パラメータで、配列形式で指定する必要があります。');
            }
            
            // デバッグ用のログ出力
            console.error(`Creating table layout with ${args.rows.length} rows`);
            
            // テーブルレイアウトを構築
            const tableLayout = buildTableLayout(args.rows, args.options || {});
            
            return tableLayout;
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
