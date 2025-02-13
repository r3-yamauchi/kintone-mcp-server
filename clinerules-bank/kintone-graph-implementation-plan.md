# kintone MCP Server グラフ機能追加実装計画

このドキュメントは、kintone MCP Serverに「kintoneアプリにグラフを追加する」機能を実装するための完全な計画と実装手順を提供します。
このドキュメントは、ユーザーの以下の要望により作成されました。

```text
https://cybozu.dev/ja/kintone/docs/rest-api/apps/report/update-graph-settings/ 
に kintone の「アプリのグラフ設定を変更する」 API のドキュメントがあります。
この仕様をもとに この MCP Server に「kintoneアプリにグラフを追加する」機能の追加実装を計画できますか？

策定していただいた実装計画を今日は実行せずに後日に Act モードに実装させたいと考えています。
そのために必要な全ての完全な情報を markdown形式のファイルとして出力してください。
今回策定していただいた実装計画を完全に遂行するのに必要な完全なプロンプトを含めてください。
```

## 目次

1. [機能概要](#機能概要)
2. [APIの仕様](#apiの仕様)
3. [実装計画](#実装計画)
4. [実装手順](#実装手順)
5. [テスト方法](#テスト方法)
6. [実装プロンプト](#実装プロンプト)

## 機能概要

新しいツール「add_graph」を追加し、kintoneアプリにグラフを追加できるようにします。このツールは以下の機能を提供します：

- 様々な種類のグラフ（棒グラフ、円グラフ、折れ線グラフなど）の追加
- グラフの表示設定（集計方法、分類項目、ソート条件など）の指定
- 定期レポート設定（オプション）

## APIの仕様

kintoneのグラフ設定を変更するAPIの仕様は以下の通りです：

- エンドポイント: `/v1/preview/app/reports.json`
- メソッド: PUT
- 必要なアクセス権: アプリ管理権限
- 主要パラメータ:
  - app: アプリID
  - reports: グラフ設定情報を含むオブジェクト
    - chartType: グラフの種類（BAR, COLUMN, PIE, LINE, AREA, TABLE など）
    - chartMode: 表示モード（NORMAL, STACKED, PERCENTAGE）
    - name: グラフの名前
    - groups: 分類項目
    - aggregations: 集計方法（COUNT, SUM, AVERAGE, MAX, MIN）
    - filterCond: 絞り込み条件
    - sorts: ソート条件

## 実装計画

### 変更が必要なファイル

以下のファイルに変更を加える必要があります：

1. **src/server/MCPServer.js**
   - 新しいツール「add_graph」の定義を追加

2. **src/repositories/KintoneAppRepository.js**
   - グラフ設定を変更するメソッド `updateGraphSettings` を追加

3. **src/server/tools/AppTools.js**
   - グラフ関連のツールを処理する関数を追加

4. **src/server/handlers/ToolRequestHandler.js**
   - 新しいツールの処理を追加

## 実装手順

### 1. KintoneAppRepository.jsの変更

`KintoneAppRepository` クラスに `updateGraphSettings` メソッドを追加します。

```javascript
/**
 * アプリのグラフ設定を更新
 * @param {number} appId アプリID
 * @param {Object} graphSettings グラフ設定
 * @returns {Promise<Object>} 更新結果
 */
async updateGraphSettings(appId, graphSettings) {
    try {
        console.error(`Updating graph settings for app ${appId}`);
        console.error('Graph settings:', graphSettings);

        const response = await this.client.request({
            method: 'PUT',
            path: '/k/v1/preview/app/reports.json',
            body: {
                app: appId,
                reports: graphSettings
            }
        });
        
        console.error('Update response:', response);
        return response;
    } catch (error) {
        this.handleKintoneError(error, `update graph settings for app ${appId}`);
    }
}
```

### 2. AppTools.jsの変更

`handleAppTools` 関数内に `add_graph` ケースを追加します。

```javascript
case 'add_graph': {
    // 引数のチェック
    if (!args.app_id) {
        throw new Error('app_id は必須パラメータです。');
    }
    if (!args.graph_name) {
        throw new Error('graph_name は必須パラメータです。');
    }
    if (!args.chart_type) {
        throw new Error('chart_type は必須パラメータです。');
    }
    if (!args.groups || !Array.isArray(args.groups) || args.groups.length === 0) {
        throw new Error('groups は必須パラメータで、少なくとも1つの項目を指定する必要があります。');
    }
    if (!args.aggregations || !Array.isArray(args.aggregations) || args.aggregations.length === 0) {
        throw new Error('aggregations は必須パラメータで、少なくとも1つの項目を指定する必要があります。');
    }
    
    // デバッグ用のログ出力
    console.error(`Adding graph to app: ${args.app_id}`);
    
    // グラフ設定の構築
    const graphSettings = {};
    graphSettings[args.graph_name] = {
        chartType: args.chart_type,
        name: args.graph_name,
        index: args.index || "0",
        groups: args.groups,
        aggregations: args.aggregations
    };
    
    // オプションパラメータの追加
    if (args.chart_mode) {
        graphSettings[args.graph_name].chartMode = args.chart_mode;
    }
    if (args.filter_cond) {
        graphSettings[args.graph_name].filterCond = args.filter_cond;
    }
    if (args.sorts) {
        graphSettings[args.graph_name].sorts = args.sorts;
    }
    if (args.periodic_report) {
        graphSettings[args.graph_name].periodicReport = args.periodic_report;
    }
    
    // グラフ設定の更新
    const response = await repository.updateGraphSettings(args.app_id, graphSettings);
    
    return {
        success: true,
        revision: response.revision,
        message: `グラフ「${args.graph_name}」をアプリID ${args.app_id} に追加しました。`
    };
}
```

### 3. MCPServer.jsの変更

`ListToolsRequestSchema` ハンドラー内の `tools` 配列に新しいツール定義を追加します。

```javascript
{
    name: 'add_graph',
    description: 'kintoneアプリにグラフを追加します',
    inputSchema: {
        type: 'object',
        properties: {
            app_id: {
                type: 'number',
                description: 'kintoneアプリのID'
            },
            graph_name: {
                type: 'string',
                description: 'グラフの名前'
            },
            chart_type: {
                type: 'string',
                enum: ['BAR', 'COLUMN', 'PIE', 'LINE', 'AREA', 'SPLINE', 'SPLINE_AREA', 'TABLE', 'PIVOT_TABLE'],
                description: 'グラフの種類'
            },
            chart_mode: {
                type: 'string',
                enum: ['NORMAL', 'STACKED', 'PERCENTAGE'],
                description: 'グラフの表示モード'
            },
            groups: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        code: {
                            type: 'string',
                            description: '分類する項目のフィールドコード'
                        },
                        per: {
                            type: 'string',
                            description: '時間単位（YEAR, QUARTER, MONTH, WEEK, DAY, HOUR, MINUTE）'
                        }
                    },
                    required: ['code']
                },
                description: '分類する項目の一覧'
            },
            aggregations: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            enum: ['COUNT', 'SUM', 'AVERAGE', 'MAX', 'MIN'],
                            description: '集計方法の種類'
                        },
                        code: {
                            type: 'string',
                            description: '集計対象のフィールドコード'
                        }
                    },
                    required: ['type']
                },
                description: '集計方法の設定'
            },
            filter_cond: {
                type: 'string',
                description: '絞り込み条件（クエリ形式）'
            },
            sorts: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        by: {
                            type: 'string',
                            enum: ['TOTAL', 'GROUP1', 'GROUP2', 'GROUP3'],
                            description: 'ソートの対象'
                        },
                        order: {
                            type: 'string',
                            enum: ['ASC', 'DESC'],
                            description: 'ソートの並び順'
                        }
                    },
                    required: ['by', 'order']
                },
                description: 'ソート条件'
            },
            periodic_report: {
                type: 'object',
                properties: {
                    active: {
                        type: 'boolean',
                        description: '定期レポートの実行状態'
                    },
                    period: {
                        type: 'object',
                        properties: {
                            every: {
                                type: 'string',
                                enum: ['YEAR', 'QUARTER', 'MONTH', 'WEEK', 'DAY', 'HOUR'],
                                description: '定期レポートの集計間隔の種類'
                            },
                            time: {
                                type: 'string',
                                description: '集計を実施する時刻（HH:mm形式）'
                            }
                        },
                        required: ['every']
                    }
                },
                description: '定期レポートの設定'
            }
        },
        required: ['app_id', 'graph_name', 'chart_type', 'groups', 'aggregations']
    }
}
```

### 4. ToolRequestHandler.jsの変更

`executeToolRequest` 関数内の条件分岐に新しいツールを追加します。

```javascript
else if (['create_app', 'deploy_app', 'get_deploy_status', 'update_app_settings', 'get_apps_info', 
     'get_form_layout', 'update_form_layout', 'get_preview_app_settings', 
     'get_preview_form_fields', 'get_preview_form_layout', 
     'move_app_to_space', 'move_app_from_space', 'add_graph'].includes(name)) {
    result = await handleAppTools(name, args, repository);
}
```

## テスト方法

実装後、以下のような形でツールをテストできます：

```javascript
// 棒グラフの追加例
add_graph({
  app_id: 123,
  graph_name: "売上集計",
  chart_type: "BAR",
  chart_mode: "NORMAL",
  groups: [
    { code: "category" }
  ],
  aggregations: [
    { type: "SUM", code: "sales_amount" }
  ],
  sorts: [
    { by: "TOTAL", order: "DESC" }
  ]
});

// 定期レポート付きの円グラフ追加例
add_graph({
  app_id: 123,
  graph_name: "月次売上レポート",
  chart_type: "PIE",
  groups: [
    { code: "sales_region" }
  ],
  aggregations: [
    { type: "SUM", code: "sales_amount" }
  ],
  periodic_report: {
    active: true,
    period: {
      every: "MONTH",
      time: "09:00"
    }
  }
});
```

## 実装プロンプト

以下は、ACTモードで実装を行うための完全なプロンプトです。このプロンプトをコピーして使用することで、計画通りに実装を進めることができます。

```
https://cybozu.dev/ja/kintone/docs/rest-api/apps/report/update-graph-settings/ に kintone の「アプリのグラフ設定を変更する」 API のドキュメントがあります。
この仕様をもとに この MCP Server に「kintoneアプリにグラフを追加する」機能を追加実装してください。

具体的には以下の4つのファイルを変更する必要があります：

1. src/repositories/KintoneAppRepository.js
   - グラフ設定を変更するメソッド `updateGraphSettings` を追加

2. src/server/tools/AppTools.js
   - グラフ関連のツールを処理する関数を追加

3. src/server/MCPServer.js
   - 新しいツール「add_graph」の定義を追加

4. src/server/handlers/ToolRequestHandler.js
   - 新しいツールの処理を追加

それぞれのファイルに追加すべきコードは以下の通りです：

### 1. KintoneAppRepository.js

KintoneAppRepository クラスに以下のメソッドを追加してください：

```javascript
/**
 * アプリのグラフ設定を更新
 * @param {number} appId アプリID
 * @param {Object} graphSettings グラフ設定
 * @returns {Promise<Object>} 更新結果
 */
async updateGraphSettings(appId, graphSettings) {
    try {
        console.error(`Updating graph settings for app ${appId}`);
        console.error('Graph settings:', graphSettings);

        const response = await this.client.request({
            method: 'PUT',
            path: '/k/v1/preview/app/reports.json',
            body: {
                app: appId,
                reports: graphSettings
            }
        });
        
        console.error('Update response:', response);
        return response;
    } catch (error) {
        this.handleKintoneError(error, `update graph settings for app ${appId}`);
    }
}
```

### 2. AppTools.js

handleAppTools 関数内に以下のケースを追加してください：

```javascript
case 'add_graph': {
    // 引数のチェック
    if (!args.app_id) {
        throw new Error('app_id は必須パラメータです。');
    }
    if (!args.graph_name) {
        throw new Error('graph_name は必須パラメータです。');
    }
    if (!args.chart_type) {
        throw new Error('chart_type は必須パラメータです。');
    }
    if (!args.groups || !Array.isArray(args.groups) || args.groups.length === 0) {
        throw new Error('groups は必須パラメータで、少なくとも1つの項目を指定する必要があります。');
    }
    if (!args.aggregations || !Array.isArray(args.aggregations) || args.aggregations.length === 0) {
        throw new Error('aggregations は必須パラメータで、少なくとも1つの項目を指定する必要があります。');
    }
    
    // デバッグ用のログ出力
    console.error(`Adding graph to app: ${args.app_id}`);
    
    // グラフ設定の構築
    const graphSettings = {};
    graphSettings[args.graph_name] = {
        chartType: args.chart_type,
        name: args.graph_name,
        index: args.index || "0",
        groups: args.groups,
        aggregations: args.aggregations
    };
    
    // オプションパラメータの追加
    if (args.chart_mode) {
        graphSettings[args.graph_name].chartMode = args.chart_mode;
    }
    if (args.filter_cond) {
        graphSettings[args.graph_name].filterCond = args.filter_cond;
    }
    if (args.sorts) {
        graphSettings[args.graph_name].sorts = args.sorts;
    }
    if (args.periodic_report) {
        graphSettings[args.graph_name].periodicReport = args.periodic_report;
    }
    
    // グラフ設定の更新
    const response = await repository.updateGraphSettings(args.app_id, graphSettings);
    
    return {
        success: true,
        revision: response.revision,
        message: `グラフ「${args.graph_name}」をアプリID ${args.app_id} に追加しました。`
    };
}
```

### 3. MCPServer.js

ListToolsRequestSchema ハンドラー内の tools 配列に以下のツール定義を追加してください：

```javascript
{
    name: 'add_graph',
    description: 'kintoneアプリにグラフを追加します',
    inputSchema: {
        type: 'object',
        properties: {
            app_id: {
                type: 'number',
                description: 'kintoneアプリのID'
            },
            graph_name: {
                type: 'string',
                description: 'グラフの名前'
            },
            chart_type: {
                type: 'string',
                enum: ['BAR', 'COLUMN', 'PIE', 'LINE', 'AREA', 'SPLINE', 'SPLINE_AREA', 'TABLE', 'PIVOT_TABLE'],
                description: 'グラフの種類'
            },
            chart_mode: {
                type: 'string',
                enum: ['NORMAL', 'STACKED', 'PERCENTAGE'],
                description: 'グラフの表示モード'
            },
            groups: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        code: {
                            type: 'string',
                            description: '分類する項目のフィールドコード'
                        },
                        per: {
                            type: 'string',
                            description: '時間単位（YEAR, QUARTER, MONTH, WEEK, DAY, HOUR, MINUTE）'
                        }
                    },
                    required: ['code']
                },
                description: '分類する項目の一覧'
            },
            aggregations: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            enum: ['COUNT', 'SUM', 'AVERAGE', 'MAX', 'MIN'],
                            description: '集計方法の種類'
                        },
                        code: {
                            type: 'string',
                            description: '集計対象のフィールドコード'
                        }
                    },
                    required: ['type']
                },
                description: '集計方法の設定'
            },
            filter_cond: {
                type: 'string',
                description: '絞り込み条件（クエリ形式）'
            },
            sorts: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        by: {
                            type: 'string',
                            enum: ['TOTAL', 'GROUP1', 'GROUP2', 'GROUP3'],
                            description: 'ソートの対象'
                        },
                        order: {
                            type: 'string',
                            enum: ['ASC', 'DESC'],
                            description: 'ソートの並び順'
                        }
                    },
                    required: ['by', 'order']
                },
                description: 'ソート条件'
            },
            periodic_report: {
                type: 'object',
                properties: {
                    active: {
                        type: 'boolean',
                        description: '定期レポートの実行状態'
                    },
                    period: {
                        type: 'object',
                        properties: {
                            every: {
                                type: 'string',
                                enum: ['YEAR', 'QUARTER', 'MONTH', 'WEEK', 'DAY', 'HOUR'],
                                description: '定期レポートの集計間隔の種類'
                            },
                            time: {
                                type: 'string',
                                description: '集計を実施する時刻（HH:mm形式）'
                            }
                        },
                        required: ['every']
                    }
                },
                description: '定期レポートの設定'
            }
        },
        required: ['app_id', 'graph_name', 'chart_type', 'groups', 'aggregations']
    }
}
```

### 4. ToolRequestHandler.js

executeToolRequest 関数内の条件分岐に新しいツールを追加してください：

```javascript
else if (['create_app', 'deploy_app', 'get_deploy_status', 'update_app_settings', 'get_apps_info', 
     'get_form_layout', 'update_form_layout', 'get_preview_app_settings', 
     'get_preview_form_fields', 'get_preview_form_layout', 
     'move_app_to_space', 'move_app_from_space', 'add_graph'].includes(name)) {
    result = await handleAppTools(name, args, repository);
}
```

実装後、以下のようなコマンドでテストできます：

```javascript
add_graph({
  app_id: 123,
  graph_name: "売上集計",
  chart_type: "BAR",
  chart_mode: "NORMAL",
  groups: [
    { code: "category" }
  ],
  aggregations: [
    { type: "SUM", code: "sales_amount" }
  ],
  sorts: [
    { by: "TOTAL", order: "DESC" }
  ]
});
```
