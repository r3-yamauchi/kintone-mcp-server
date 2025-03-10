// src/server/MCPServer.js
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { KintoneCredentials } from '../models/KintoneCredentials.js';
import { KintoneRepository } from '../repositories/KintoneRepository.js';
import { executeToolRequest } from './handlers/ToolRequestHandler.js';

export class MCPServer {
    constructor(domain, username, password) {
        this.credentials = new KintoneCredentials(domain, username, password);
        this.repository = new KintoneRepository(this.credentials);
        
        this.server = new Server(
            {
                name: 'kintonemcp',
                version: '3.4.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );
        
        this.setupRequestHandlers();
        
        // エラーハンドリング
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    
    setupRequestHandlers() {
        // ツール一覧を返すハンドラー
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                // レコード関連のツール
                {
                    name: 'get_record',
                    description: 'kintoneアプリの1レコードを取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'kintoneアプリのID'
                            },
                            record_id: {
                                type: 'number',
                                description: 'レコードID'
                            }
                        },
                        required: ['app_id', 'record_id']
                    }
                },
                {
                    name: 'search_records',
                    description: 'kintoneアプリのレコードを検索します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'kintoneアプリのID'
                            },
                            query: {
                                type: 'string',
                                description: '検索クエリ'
                            },
                            fields: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                description: '取得するフィールド名の配列'
                            }
                        },
                        required: ['app_id']
                    }
                },
                {
                    name: 'create_record',
                    description: 'kintoneアプリに新しいレコードを作成します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'kintoneアプリのID'
                            },
                            fields: {
                                type: 'object',
                                description: 'レコードのフィールド値'
                            }
                        },
                        required: ['app_id', 'fields']
                    }
                },
                {
                    name: 'update_record',
                    description: 'kintoneアプリの既存レコードを更新します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'kintoneアプリのID'
                            },
                            record_id: {
                                type: 'number',
                                description: 'レコードID'
                            },
                            fields: {
                                type: 'object',
                                description: '更新するフィールド値'
                            }
                        },
                        required: ['app_id', 'record_id', 'fields']
                    }
                },
                
                // アプリ関連のツール
                {
                    name: 'get_apps_info',
                    description: '検索キーワードを指定して該当する複数のkintoneアプリの情報を取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_name: {
                                type: 'string',
                                description: 'アプリ名またはその一部'
                            }
                        },
                        required: ['app_name']
                    }
                },
                
                // ファイル関連のツール
                {
                    name: 'download_file',
                    description: 'kintoneアプリからファイルをダウンロードします',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            file_key: {
                                type: 'string',
                                description: 'ダウンロードするファイルのキー'
                            }
                        },
                        required: ['file_key']
                    }
                },
                {
                    name: 'upload_file',
                    description: 'kintoneアプリにファイルをアップロードします',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            file_name: {
                                type: 'string',
                                description: 'アップロードするファイルの名前'
                            },
                            file_data: {
                                type: 'string',
                                description: 'Base64エンコードされたファイルデータ'
                            }
                        },
                        required: ['file_name', 'file_data']
                    }
                },
                
                // コメント関連のツール
                {
                    name: 'add_record_comment',
                    description: 'kintoneレコードにコメントを追加します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'kintoneアプリのID'
                            },
                            record_id: {
                                type: 'number',
                                description: 'レコードID'
                            },
                            text: {
                                type: 'string',
                                description: 'コメント本文'
                            },
                            mentions: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        code: {
                                            type: 'string',
                                            description: 'メンション対象のユーザー、グループ、組織のコード'
                                        },
                                        type: {
                                            type: 'string',
                                            enum: ['USER', 'GROUP', 'ORGANIZATION'],
                                            description: 'メンション対象の種類'
                                        }
                                    },
                                    required: ['code', 'type']
                                },
                                description: 'メンション情報の配列'
                            }
                        },
                        required: ['app_id', 'record_id', 'text']
                    }
                },
                
                // スペース関連のツール
                {
                    name: 'get_space',
                    description: 'スペースの一般情報を取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            space_id: {
                                type: 'string',
                                description: 'スペースID'
                            }
                        },
                        required: ['space_id']
                    }
                },
                {
                    name: 'update_space',
                    description: 'スペースの設定を更新します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            space_id: {
                                type: 'string',
                                description: 'スペースID'
                            },
                            name: {
                                type: 'string',
                                description: 'スペースの新しい名前'
                            },
                            isPrivate: {
                                type: 'boolean',
                                description: 'プライベート設定'
                            },
                            fixedMember: {
                                type: 'boolean',
                                description: 'メンバー固定設定'
                            },
                            useMultiThread: {
                                type: 'boolean',
                                description: 'マルチスレッド設定'
                            }
                        },
                        required: ['space_id']
                    }
                },
                {
                    name: 'update_space_body',
                    description: 'スペースの本文を更新します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            space_id: {
                                type: 'string',
                                description: 'スペースID'
                            },
                            body: {
                                type: 'string',
                                description: 'スペースの本文（HTML形式）'
                            }
                        },
                        required: ['space_id', 'body']
                    }
                },
                {
                    name: 'get_space_members',
                    description: 'スペースメンバーのリストを取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            space_id: {
                                type: 'string',
                                description: 'スペースID'
                            }
                        },
                        required: ['space_id']
                    }
                },
                {
                    name: 'update_space_members',
                    description: 'スペースメンバーを更新します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            space_id: {
                                type: 'string',
                                description: 'スペースID'
                            },
                            members: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        entity: {
                                            type: 'object',
                                            properties: {
                                                type: {
                                                    type: 'string',
                                                    enum: ['USER', 'GROUP', 'ORGANIZATION']
                                                },
                                                code: {
                                                    type: 'string'
                                                }
                                            },
                                            required: ['type', 'code']
                                        },
                                        isAdmin: {
                                            type: 'boolean'
                                        },
                                        includeSubs: {
                                            type: 'boolean'
                                        }
                                    },
                                    required: ['entity']
                                }
                            }
                        },
                        required: ['space_id', 'members']
                    }
                },
                {
                    name: 'add_thread',
                    description: 'スペースにスレッドを追加します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            space_id: {
                                type: 'string',
                                description: 'スペースID'
                            },
                            name: {
                                type: 'string',
                                description: 'スレッド名'
                            }
                        },
                        required: ['space_id', 'name']
                    }
                },
                {
                    name: 'update_thread',
                    description: 'スレッドを更新します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            thread_id: {
                                type: 'string',
                                description: 'スレッドID'
                            },
                            name: {
                                type: 'string',
                                description: 'スレッドの新しい名前'
                            },
                            body: {
                                type: 'string',
                                description: 'スレッドの本文（HTML形式）'
                            }
                        },
                        required: ['thread_id']
                    }
                },
                {
                    name: 'add_thread_comment',
                    description: 'スレッドにコメントを追加します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            space_id: {
                                type: 'string',
                                description: 'スペースID'
                            },
                            thread_id: {
                                type: 'string',
                                description: 'スレッドID'
                            },
                            text: {
                                type: 'string',
                                description: 'コメント本文'
                            },
                            mentions: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        code: {
                                            type: 'string'
                                        },
                                        type: {
                                            type: 'string',
                                            enum: ['USER', 'GROUP', 'ORGANIZATION']
                                        }
                                    },
                                    required: ['code', 'type']
                                }
                            }
                        },
                        required: ['space_id', 'thread_id', 'text']
                    }
                },
                {
                    name: 'add_guests',
                    description: 'ゲストユーザーを追加します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            guests: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        name: {
                                            type: 'string'
                                        },
                                        code: {
                                            type: 'string'
                                        },
                                        password: {
                                            type: 'string'
                                        },
                                        timezone: {
                                            type: 'string'
                                        },
                                        locale: {
                                            type: 'string',
                                            enum: ['auto', 'en', 'zh', 'ja']
                                        }
                                    },
                                    required: ['name', 'code', 'password', 'timezone']
                                }
                            }
                        },
                        required: ['guests']
                    }
                },
                {
                    name: 'update_space_guests',
                    description: 'スペースのゲストメンバーを更新します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            space_id: {
                                type: 'string',
                                description: 'スペースID'
                            },
                            guests: {
                                type: 'array',
                                items: {
                                    type: 'string',
                                    description: 'ゲストユーザーのメールアドレス'
                                }
                            }
                        },
                        required: ['space_id', 'guests']
                    }
                },
                
                // アプリ作成・設定関連のツール
                {
                    name: 'create_app',
                    description: '新しいkintoneアプリを作成します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            name: {
                                type: 'string',
                                description: 'アプリの名前'
                            },
                            space: {
                                type: 'number',
                                description: 'スペースID（オプション）'
                            },
                            thread: {
                                type: 'number',
                                description: 'スレッドID（オプション）'
                            }
                        },
                        required: ['name']
                    }
                },
                {
                    name: 'add_fields',
                    description: 'kintoneアプリにフィールドを追加します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'アプリID'
                            },
                            properties: {
                                type: 'object',
                                description: 'フィールドの設定'
                            }
                        },
                        required: ['app_id', 'properties']
                    }
                },
                {
                    name: 'deploy_app',
                    description: 'kintoneアプリの設定をデプロイします',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            apps: {
                                type: 'array',
                                items: {
                                    type: 'number'
                                },
                                description: 'デプロイ対象のアプリID配列'
                            }
                        },
                        required: ['apps']
                    }
                },
                {
                    name: 'get_deploy_status',
                    description: 'kintoneアプリのデプロイ状態を確認します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            apps: {
                                type: 'array',
                                items: {
                                    type: 'number'
                                },
                                description: '確認対象のアプリID配列'
                            }
                        },
                        required: ['apps']
                    }
                },
                {
                    name: 'update_app_settings',
                    description: 'kintoneアプリの一般設定を変更します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'アプリID'
                            },
                            name: {
                                type: 'string',
                                description: 'アプリの名前（1文字以上64文字以内）'
                            },
                            description: {
                                type: 'string',
                                description: 'アプリの説明（10,000文字以内、HTMLタグ使用可）'
                            },
                            icon: {
                                type: 'object',
                                properties: {
                                    type: {
                                        type: 'string',
                                        enum: ['PRESET', 'FILE'],
                                        description: 'アイコンの種類'
                                    },
                                    key: {
                                        type: 'string',
                                        description: 'PRESTETアイコンの識別子'
                                    },
                                    file: {
                                        type: 'object',
                                        properties: {
                                            fileKey: {
                                                type: 'string',
                                                description: 'アップロード済みファイルのキー'
                                            }
                                        }
                                    }
                                }
                            },
                            theme: {
                                type: 'string',
                                enum: ['WHITE', 'RED', 'GREEN', 'BLUE', 'YELLOW', 'BLACK'],
                                description: 'デザインテーマ'
                            },
                            titleField: {
                                type: 'object',
                                properties: {
                                    selectionMode: {
                                        type: 'string',
                                        enum: ['AUTO', 'MANUAL'],
                                        description: 'タイトルフィールドの選択方法'
                                    },
                                    code: {
                                        type: 'string',
                                        description: 'MANUALモード時のフィールドコード'
                                    }
                                }
                            },
                            enableThumbnails: {
                                type: 'boolean',
                                description: 'サムネイル表示の有効化'
                            },
                            enableBulkDeletion: {
                                type: 'boolean',
                                description: 'レコード一括削除の有効化'
                            },
                            enableComments: {
                                type: 'boolean',
                                description: 'コメント機能の有効化'
                            },
                            enableDuplicateRecord: {
                                type: 'boolean',
                                description: 'レコード再利用機能の有効化'
                            },
                            enableInlineRecordEditing: {
                                type: 'boolean',
                                description: 'インライン編集の有効化'
                            },
                            numberPrecision: {
                                type: 'object',
                                properties: {
                                    digits: {
                                        type: 'string',
                                        description: '全体の桁数（1-30）'
                                    },
                                    decimalPlaces: {
                                        type: 'string',
                                        description: '小数部の桁数（0-10）'
                                    },
                                    roundingMode: {
                                        type: 'string',
                                        enum: ['HALF_EVEN', 'UP', 'DOWN'],
                                        description: '数値の丸めかた'
                                    }
                                }
                            },
                            firstMonthOfFiscalYear: {
                                type: 'string',
                                description: '第一四半期の開始月（1-12）'
                            }
                        },
                        required: ['app_id']
                    }
                },
                {
                    name: 'get_form_layout',
                    description: 'kintoneアプリのフォームレイアウトを取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'kintoneアプリのID'
                            }
                        },
                        required: ['app_id']
                    }
                },
                {
                    name: 'update_form_layout',
                    description: 'kintoneアプリのフォームレイアウトを変更します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'kintoneアプリのID'
                            },
                            layout: {
                                type: 'array',
                                description: 'フォームのレイアウト情報',
                                items: {
                                    type: 'object',
                                    properties: {
                                        type: {
                                            type: 'string',
                                            enum: ['ROW', 'SUBTABLE', 'GROUP'],
                                            description: 'レイアウト要素のタイプ'
                                        },
                                        fields: {
                                            type: 'array',
                                            description: 'ROWタイプの場合のフィールド配列',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    type: {
                                                        type: 'string',
                                                        enum: ['LABEL', 'SPACER', 'HR', 'REFERENCE_TABLE', 'FIELD'],
                                                        description: 'フィールド要素のタイプ'
                                                    },
                                                    code: {
                                                        type: 'string',
                                                        description: 'FIELDタイプの場合のフィールドコード'
                                                    },
                                                    size: {
                                                        type: 'object',
                                                        description: 'フィールドのサイズ',
                                                        properties: {
                                                            width: {
                                                                type: 'string',
                                                                description: '幅（"100%"など）'
                                                            },
                                                            height: {
                                                                type: 'string',
                                                                description: '高さ（"200px"など）'
                                                            },
                                                            innerHeight: {
                                                                type: 'string',
                                                                description: '内部高さ（"200px"など）'
                                                            }
                                                        }
                                                    },
                                                    elementId: {
                                                        type: 'string',
                                                        description: '要素のID'
                                                    },
                                                    value: {
                                                        type: 'string',
                                                        description: 'LABELタイプの場合のラベルテキスト'
                                                    }
                                                }
                                            }
                                        },
                                        code: {
                                            type: 'string',
                                            description: 'SUBTABLEタイプの場合のサブテーブルコード'
                                        },
                                        layout: {
                                            type: 'array',
                                            description: 'GROUPタイプの場合の内部レイアウト'
                                        }
                                    }
                                }
                            },
                            revision: {
                                type: 'number',
                                description: 'アプリのリビジョン番号（省略時は-1で最新リビジョンを使用）'
                            }
                        },
                        required: ['app_id', 'layout']
                    }
                },
                
                // プレビュー環境関連のツール
                {
                    name: 'get_preview_app_settings',
                    description: 'プレビュー環境のkintoneアプリ設定を取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'kintoneアプリのID'
                            },
                            lang: {
                                type: 'string',
                                enum: ['ja', 'en', 'zh'],
                                description: '言語設定（オプション）'
                            }
                        },
                        required: ['app_id']
                    }
                },
                {
                    name: 'get_preview_form_fields',
                    description: 'プレビュー環境のkintoneアプリのフォームフィールド情報を取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'kintoneアプリのID'
                            },
                            lang: {
                                type: 'string',
                                enum: ['ja', 'en', 'zh'],
                                description: '言語設定（オプション）'
                            }
                        },
                        required: ['app_id']
                    }
                },
                {
                    name: 'get_preview_form_layout',
                    description: 'プレビュー環境のkintoneアプリのフォームレイアウト情報を取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'kintoneアプリのID'
                            }
                        },
                        required: ['app_id']
                    }
                },
                
                // フィールド作成支援ツール
                {
                    name: 'create_choice_field',
                    description: '選択肢フィールド（ラジオボタン、チェックボックス、ドロップダウン、複数選択）の設定を生成します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            field_type: {
                                type: 'string',
                                enum: ['RADIO_BUTTON', 'CHECK_BOX', 'DROP_DOWN', 'MULTI_SELECT'],
                                description: 'フィールドタイプ'
                            },
                            code: {
                                type: 'string',
                                description: 'フィールドコード'
                            },
                            label: {
                                type: 'string',
                                description: 'フィールドラベル'
                            },
                            choices: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                description: '選択肢の配列'
                            },
                            required: {
                                type: 'boolean',
                                description: '必須フィールドかどうか'
                            },
                            align: {
                                type: 'string',
                                enum: ['HORIZONTAL', 'VERTICAL'],
                                description: 'ラジオボタン・チェックボックスの配置方向'
                            }
                        },
                        required: ['field_type', 'code', 'label', 'choices']
                    }
                },
                {
                    name: 'create_reference_table_field',
                    description: '関連テーブルフィールドの設定を生成します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            code: {
                                type: 'string',
                                description: 'フィールドコード'
                            },
                            label: {
                                type: 'string',
                                description: 'フィールドラベル'
                            },
                            relatedAppId: {
                                type: 'number',
                                description: '参照先アプリのID'
                            },
                            relatedAppCode: {
                                type: 'string',
                                description: '参照先アプリのコード（IDより優先）'
                            },
                            conditionField: {
                                type: 'string',
                                description: '自アプリの条件フィールド'
                            },
                            relatedConditionField: {
                                type: 'string',
                                description: '参照先アプリの条件フィールド'
                            },
                            filterCond: {
                                type: 'string',
                                description: '参照レコードの絞り込み条件'
                            },
                            displayFields: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                description: '表示するフィールドの配列'
                            },
                            sort: {
                                type: 'string',
                                description: '参照レコードのソート条件'
                            },
                            size: {
                                type: 'number',
                                enum: [1, 3, 5, 10, 20, 30, 40, 50],
                                description: '一度に表示する最大レコード数'
                            },
                            noLabel: {
                                type: 'boolean',
                                description: 'ラベルを非表示にするかどうか'
                            }
                        },
                        required: ['code', 'label', 'conditionField', 'relatedConditionField']
                    }
                },
                {
                    name: 'create_lookup_field',
                    description: 'ルックアップフィールドの設定を生成します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            code: {
                                type: 'string',
                                description: 'フィールドコード'
                            },
                            label: {
                                type: 'string',
                                description: 'フィールドラベル'
                            },
                            relatedAppId: {
                                type: 'number',
                                description: '参照先アプリのID'
                            },
                            relatedAppCode: {
                                type: 'string',
                                description: '参照先アプリのコード（IDより優先）'
                            },
                            relatedKeyField: {
                                type: 'string',
                                description: '参照先アプリのキーフィールド'
                            },
                            fieldMappings: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        field: {
                                            type: 'string',
                                            description: '自アプリのフィールド'
                                        },
                                        relatedField: {
                                            type: 'string',
                                            description: '参照先アプリのフィールド'
                                        }
                                    },
                                    required: ['field', 'relatedField']
                                },
                                description: 'フィールドマッピングの配列'
                            },
                            lookupPickerFields: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                description: 'ルックアップピッカーに表示するフィールドの配列'
                            },
                            filterCond: {
                                type: 'string',
                                description: '参照レコードの絞り込み条件'
                            },
                            sort: {
                                type: 'string',
                                description: '参照レコードのソート条件'
                            },
                            required: {
                                type: 'boolean',
                                description: '必須フィールドかどうか'
                            }
                        },
                        required: ['code', 'label', 'relatedKeyField', 'fieldMappings']
                    }
                },
                
                // ドキュメント関連のツール
                {
                    name: 'get_field_type_documentation',
                    description: 'フィールドタイプに関するドキュメントを取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            field_type: {
                                type: 'string',
                                description: 'ドキュメントを取得するフィールドタイプ'
                            }
                        },
                        required: ['field_type']
                    }
                }
            ]
        }));
        
        // ツールリクエストを実行するハンドラー
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            return executeToolRequest(request, this.repository);
        });
    }
    
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Kintone MCP server running on stdio');
    }
}
