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
                version: '3.6.0',
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
                    description: 'kintoneアプリからファイルをダウンロードします。注意: 現在の実装では1MB以上のファイルは正常にダウンロードできない場合があります。',
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
                    description: 'kintoneアプリにフィールドを追加します。各フィールドには code（フィールドコード）、type（フィールドタイプ）、label（表示名）の指定が必須です。\n' +
                        'フィールドコードに使用できる文字: ひらがな、カタカナ、漢字、英数字、記号(_＿･・＄￥)\n' +
                        '注意: システムフィールドタイプ（CREATOR, MODIFIER, RECORD_NUMBER, CREATED_TIME, UPDATED_TIME）は追加できません。これらはkintoneによって自動的に作成されるフィールドです。\n' +
                        '`type`: `CREATOR` のようなシステムフィールドタイプを指定すると、エラーが発生します。\n' +
                        '代替方法として、以下のようなフィールドを追加できます：\n' +
                        '- CREATOR（作成者）の代わりに「申請者」などの名前でUSER_SELECTフィールド\n' +
                        '- MODIFIER（更新者）の代わりに「承認者」などの名前でUSER_SELECTフィールド\n' +
                        '- CREATED_TIME（作成日時）の代わりに「申請日時」などの名前でDATETIMEフィールド\n' +
                        '- UPDATED_TIME（更新日時）の代わりに「承認日時」などの名前でDATETIMEフィールド\n' +
                        '- RECORD_NUMBER（レコード番号）の代わりに「管理番号」などの名前でSINGLE_LINE_TEXTフィールド\n' +
                        '例: {\n' +
                        '  "app_id": 123,\n' +
                        '  "properties": {\n' +
                        '    "number_field": {\n' +
                        '      "type": "NUMBER",\n' +
                        '      "code": "number_field",\n' +
                        '      "label": "数値フィールド"\n' +
                        '    },\n' +
                        '    "text_field": {\n' +
                        '      "type": "SINGLE_LINE_TEXT",\n' +
                        '      "code": "text_field",\n' +
                        '      "label": "テキストフィールド"\n' +
                        '    }\n' +
                        '  }\n' +
                        '}',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'アプリID'
                            },
                            properties: {
                                type: 'object',
                                description: 'フィールドの設定（各フィールドには code, type, label の指定が必須）'
                            }
                        },
                        required: ['app_id', 'properties']
                    }
                },
                {
                    name: 'update_field',
                    description: '既存のkintoneフィールドの設定を更新します。\n' +
                        '注意: システムフィールドタイプ（CREATOR, MODIFIER, RECORD_NUMBER, CREATED_TIME, UPDATED_TIME）は更新できません。\n' +
                        '例: {\n' +
                        '  "app_id": 123,\n' +
                        '  "field_code": "text_field",\n' +
                        '  "field": {\n' +
                        '    "type": "SINGLE_LINE_TEXT",\n' +
                        '    "code": "text_field",\n' +
                        '    "label": "更新後のラベル",\n' +
                        '    "required": true\n' +
                        '  }\n' +
                        '}',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'アプリID'
                            },
                            field_code: {
                                type: 'string',
                                description: '更新対象のフィールドコード'
                            },
                            field: {
                                type: 'object',
                                description: '更新後のフィールド設定'
                            },
                            revision: {
                                type: 'number',
                                description: 'アプリのリビジョン番号（省略時は-1で最新リビジョンを使用）'
                            }
                        },
                        required: ['app_id', 'field_code', 'field']
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
                    description: 'kintoneアプリのフォームレイアウトを変更します。トップレベルには ROW と SUBTABLE と GROUP を配置できます。SUBTABLEやGROUPはトップレベルに配置する必要があります。ROW内に配置することはできません。',
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
                                                        description: 'フィールド要素のタイプ（"LABEL", "SPACER", "HR", "REFERENCE_TABLE"または実際のフィールドタイプ）'
                                                    },
                                                    code: {
                                                        type: 'string',
                                                        description: 'フィールド要素の場合のフィールドコード'
                                                    },
                                                    size: {
                                                        type: 'object',
                                                        description: 'フィールドのサイズ',
                                                        properties: {
                                                            width: {
                                                                type: 'string',
                                                                description: '幅（数値のみ指定可能、例：100）'
                                                            },
                                                            height: {
                                                                type: 'string',
                                                                description: '高さ（数値のみ指定可能、例：200）'
                                                            },
                                                            innerHeight: {
                                                                type: 'string',
                                                                description: '内部高さ（数値のみ指定可能、例：200）'
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
                                            description: 'フィールドコード'
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
                {
                    name: 'move_app_to_space',
                    description: 'kintoneアプリを指定したスペースに移動します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'kintoneアプリのID'
                            },
                            space_id: {
                                type: ['string', 'number'],
                                description: '移動先のスペースID'
                            }
                        },
                        required: ['app_id', 'space_id']
                    }
                },
                {
                    name: 'move_app_from_space',
                    description: 'kintoneアプリをスペースに所属させないようにします。注意: kintoneシステム管理の「利用する機能の選択」で「スペースに所属しないアプリの作成を許可する」が有効になっている必要があります。',
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
                    description: '選択肢フィールド（ラジオボタン、チェックボックス、ドロップダウン、複数選択）の設定を生成します。\n' +
                        'フィールドコードに使用できる文字: ひらがな、カタカナ、漢字、英数字、記号(_＿･・＄￥)\n' +
                        '例: {\n' +
                        '  "field_type": "RADIO_BUTTON",\n' +
                        '  "code": "radio_field",\n' +
                        '  "label": "ラジオボタン",\n' +
                        '  "choices": ["選択肢1", "選択肢2", "選択肢3"],\n' +
                        '  "align": "HORIZONTAL"\n' +
                        '}',
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
                                description: 'フィールドコード（指定しない場合はlabelから自動生成）'
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
                        required: ['field_type', 'label', 'choices']
                    }
                },
                {
                    name: 'create_reference_table_field',
                    description: '関連テーブルフィールドの設定を生成します。\n' +
                        'フィールドコードに使用できる文字: ひらがな、カタカナ、漢字、英数字、記号(_＿･・＄￥)\n' +
                        '例: {\n' +
                        '  "code": "related_table",\n' +
                        '  "label": "関連テーブル",\n' +
                        '  "relatedAppId": 123,\n' +
                        '  "conditionField": "customer_id",\n' +
                        '  "relatedConditionField": "customer_id"\n' +
                        '}',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            code: {
                                type: 'string',
                                description: 'フィールドコード（指定しない場合はlabelから自動生成）'
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
                        required: ['label', 'conditionField', 'relatedConditionField']
                    }
                },
                {
                    name: 'create_lookup_field',
                    description: 'ルックアップフィールドの設定を生成します。\n' +
                        'フィールドコードに使用できる文字: ひらがな、カタカナ、漢字、英数字、記号(_＿･・＄￥)\n' +
                        '例: {\n' +
                        '  "code": "lookup_field",\n' +
                        '  "label": "ルックアップ",\n' +
                        '  "relatedAppId": 123,\n' +
                        '  "relatedKeyField": "customer_id",\n' +
                        '  "fieldMappings": [\n' +
                        '    { "field": "name", "relatedField": "customer_name" },\n' +
                        '    { "field": "email", "relatedField": "customer_email" }\n' +
                        '  ]\n' +
                        '}',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            code: {
                                type: 'string',
                                description: 'フィールドコード（指定しない場合はlabelから自動生成）'
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
                        required: ['label', 'relatedKeyField', 'fieldMappings']
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
                },
                {
                    name: 'get_available_field_types',
                    description: '利用可能なフィールドタイプの一覧を取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {}
                    }
                },
                {
                    name: 'get_documentation_tool_description',
                    description: 'ドキュメントツールの説明を取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {}
                    }
                },
                {
                    name: 'get_field_creation_tool_description',
                    description: 'フィールド作成ツールの説明を取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {}
                    }
                },
                
                // レイアウト関連のツール
                {
                    name: 'create_form_layout',
                    description: 'フィールド情報からフォームレイアウトを自動生成します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'kintoneアプリのID'
                            },
                            fields: {
                                type: 'array',
                                items: {
                                    type: 'object'
                                },
                                description: 'レイアウトに配置するフィールド情報の配列'
                            },
                            options: {
                                type: 'object',
                                properties: {
                                    groupBySection: {
                                        type: 'boolean',
                                        description: 'セクションごとにグループ化するかどうか'
                                    },
                                    fieldsPerRow: {
                                        type: 'number',
                                        description: '1行あたりのフィールド数'
                                    }
                                },
                                description: 'レイアウト生成オプション'
                            }
                        },
                        required: ['app_id', 'fields']
                    }
                },
                {
                    name: 'add_layout_element',
                    description: '既存のフォームレイアウトに要素を追加します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            app_id: {
                                type: 'number',
                                description: 'kintoneアプリのID'
                            },
                            element: {
                                type: 'object',
                                description: '追加する要素'
                            },
                            position: {
                                type: 'object',
                                properties: {
                                    index: {
                                        type: 'number',
                                        description: '挿入位置のインデックス'
                                    },
                                    type: {
                                        type: 'string',
                                        enum: ['GROUP'],
                                        description: '挿入先の要素タイプ'
                                    },
                                    groupCode: {
                                        type: 'string',
                                        description: '挿入先のグループコード'
                                    },
                                    after: {
                                        type: 'string',
                                        description: 'この要素の後に挿入するフィールドコード'
                                    },
                                    before: {
                                        type: 'string',
                                        description: 'この要素の前に挿入するフィールドコード'
                                    }
                                },
                                description: '要素の挿入位置'
                            }
                        },
                        required: ['app_id', 'element']
                    }
                },
                {
                    name: 'create_group_layout',
                    description: 'グループ要素を作成します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            code: {
                                type: 'string',
                                description: 'グループコード'
                            },
                            label: {
                                type: 'string',
                                description: 'グループラベル'
                            },
                            fields: {
                                type: 'array',
                                items: {
                                    type: 'object'
                                },
                                description: 'グループ内に配置するフィールド情報の配列'
                            },
                            openGroup: {
                                type: 'boolean',
                                description: 'グループを開いた状態で表示するかどうか'
                            },
                            options: {
                                type: 'object',
                                properties: {
                                    fieldsPerRow: {
                                        type: 'number',
                                        description: '1行あたりのフィールド数'
                                    }
                                },
                                description: 'グループレイアウト生成オプション'
                            }
                        },
                        required: ['code', 'label', 'fields']
                    }
                },
                {
                    name: 'create_table_layout',
                    description: 'テーブルレイアウトを作成します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            rows: {
                                type: 'array',
                                items: {
                                    type: 'array',
                                    items: {
                                        type: 'object'
                                    }
                                },
                                description: 'テーブルの各行に配置するフィールド情報の二次元配列'
                            },
                            options: {
                                type: 'object',
                                description: 'テーブルレイアウト生成オプション'
                            }
                        },
                        required: ['rows']
                    }
                },
                
                // ユーザー関連のツール
                {
                    name: 'get_users',
                    description: 'kintoneのユーザー情報を取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            codes: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                description: '取得するユーザーコードの配列（指定しない場合はすべてのユーザーを取得）'
                            }
                        }
                    }
                },
                {
                    name: 'get_groups',
                    description: 'kintoneのグループ情報を取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            codes: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                description: '取得するグループコードの配列（指定しない場合はすべてのグループを取得）'
                            }
                        }
                    }
                },
                {
                    name: 'get_group_users',
                    description: '指定したグループに所属するユーザーの一覧を取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            group_code: {
                                type: 'string',
                                description: 'グループコード'
                            }
                        },
                        required: ['group_code']
                    }
                },
                
                // システム関連のツール
                {
                    name: 'get_kintone_domain',
                    description: 'kintoneの接続先ドメインを取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {}
                    }
                },
                {
                    name: 'get_kintone_username',
                    description: 'kintoneへの接続に使用されるユーザー名を取得します',
                    inputSchema: {
                        type: 'object',
                        properties: {}
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
