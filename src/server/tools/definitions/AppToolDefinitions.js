// src/server/tools/definitions/AppToolDefinitions.js

/**
 * アプリ関連のツール定義
 */
export const appToolDefinitions = [
    {
        name: 'get_process_management',
        description: 'kintoneアプリのプロセス管理設定を取得します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                preview: {
                    type: 'boolean',
                    description: 'プレビュー環境の設定を取得する場合はtrue（省略時はfalse）'
                }
            },
            required: ['app_id']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'app',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'update_process_management',
        description: 'kintoneアプリのプロセス管理設定を更新します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                enable: {
                    type: 'boolean',
                    description: 'プロセス管理を有効にするかどうか'
                },
                states: {
                    type: 'object',
                    description: 'ステータスの設定。キーはステータス名',
                    additionalProperties: {
                        type: 'object',
                        properties: {
                            name: {
                                type: 'string',
                                description: 'ステータスの名前'
                            },
                            index: {
                                type: 'number',
                                description: 'ステータスの表示順'
                            },
                            assignee: {
                                type: 'object',
                                properties: {
                                    type: {
                                        type: 'string',
                                        enum: ['ONE', 'ALL', 'ANY'],
                                        description: '作業者の設定タイプ'
                                    },
                                    entities: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                entity: {
                                                    type: 'object',
                                                    properties: {
                                                        type: {
                                                            type: 'string',
                                                            enum: ['USER', 'GROUP', 'ORGANIZATION', 'FIELD_ENTITY', 'CREATOR'],
                                                            description: 'エンティティの種類'
                                                        },
                                                        code: {
                                                            type: 'string',
                                                            description: 'エンティティのコード'
                                                        }
                                                    },
                                                    required: ['type']
                                                }
                                            },
                                            required: ['entity']
                                        },
                                        description: '作業者エンティティの配列'
                                    }
                                },
                                required: ['type', 'entities']
                            }
                        },
                        required: ['name', 'index']
                    }
                },
                actions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: {
                                type: 'string',
                                description: 'アクションの名前'
                            },
                            from: {
                                type: 'string',
                                description: '遷移元のステータス名'
                            },
                            to: {
                                type: 'string',
                                description: '遷移先のステータス名'
                            },
                            filterCond: {
                                type: 'string',
                                description: 'アクションの実行条件'
                            }
                        },
                        required: ['name', 'from', 'to']
                    },
                    description: 'ステータス間の遷移アクション'
                },
                revision: {
                    type: 'number',
                    description: '更新前のリビジョン番号（省略時は最新）'
                }
            },
            required: ['app_id', 'enable']
        },
        annotations: {
            readOnly: false,
            safe: false,
            category: 'app',
            requiresConfirmation: true,
            longRunning: false,
            impact: 'high'
        }
    },
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
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'app',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
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
        },
        annotations: {
            readOnly: false,
            safe: true,
            category: 'app',
            requiresConfirmation: true,
            longRunning: false,
            impact: 'high'
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
        },
        annotations: {
            readOnly: false,
            safe: false,
            category: 'app',
            requiresConfirmation: true,
            longRunning: true,
            impact: 'high'
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
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'app',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
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
        },
        annotations: {
            readOnly: false,
            safe: false,
            category: 'app',
            requiresConfirmation: true,
            longRunning: false,
            impact: 'medium'
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
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'app',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'update_form_layout',
        description: 'kintoneアプリのフォームレイアウトを変更します。トップレベルには ROW と SUBTABLE と GROUP を配置できます。SUBTABLEやGROUPはトップレベルに配置する必要があります。ROW内に配置することはできません。SUBTABLEをレイアウトに含める際には、fieldsプロパティでテーブル内に表示するフィールドとその順序を指定する必要があります。また、ルックアップフィールドをフォームに配置する際は 250 以上の幅を明示的に指定してください。',
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
        },
        annotations: {
            readOnly: false,
            safe: false,
            category: 'app',
            requiresConfirmation: true,
            longRunning: false,
            impact: 'medium'
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
        },
        annotations: {
            readOnly: false,
            safe: false,
            category: 'app',
            requiresConfirmation: true,
            longRunning: false,
            impact: 'medium'
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
        },
        annotations: {
            readOnly: false,
            safe: false,
            category: 'app',
            requiresConfirmation: true,
            longRunning: false,
            impact: 'medium'
        }
    },
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
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'app',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
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
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'app',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
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
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'app',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'get_app_actions',
        description: 'kintoneアプリのアクション設定を取得します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                lang: {
                    type: 'string',
                    enum: ['ja', 'en', 'zh', 'user', 'default'],
                    description: '取得する名称の言語（オプション）'
                }
            },
            required: ['app_id']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'app',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'get_app_plugins',
        description: 'kintoneアプリに追加されているプラグインの一覧を取得します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                }
            },
            required: ['app_id']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'app',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'get_views',
        description: 'kintoneアプリの一覧（ビュー）の設定を取得します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                preview: {
                    type: 'boolean',
                    description: 'プレビュー環境の設定を取得する場合はtrue（省略時はfalse）'
                }
            },
            required: ['app_id']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'app',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'update_views',
        description: 'kintoneアプリの一覧（ビュー）の設定を更新します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                views: {
                    type: 'object',
                    description: 'ビューの設定オブジェクト。各ビュー名をキーとして、ビューの設定を値として指定します。',
                    additionalProperties: {
                        type: 'object',
                        properties: {
                            index: {
                                type: 'number',
                                description: 'ビューの表示順'
                            },
                            type: {
                                type: 'string',
                                enum: ['LIST', 'CALENDAR', 'CUSTOM'],
                                description: 'ビューの種類'
                            },
                            name: {
                                type: 'string',
                                description: 'ビューの名前'
                            },
                            fields: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                description: '表示するフィールドコードの配列（LIST/CUSTOMビューのみ）'
                            },
                            date: {
                                type: 'string',
                                description: 'カレンダー表示に使用する日付フィールドのコード（CALENDARビューのみ）'
                            },
                            title: {
                                type: 'string',
                                description: 'カレンダーのタイトルに使用するフィールドのコード（CALENDARビューのみ）'
                            },
                            filterCond: {
                                type: 'string',
                                description: '絞り込み条件'
                            },
                            sort: {
                                type: 'string',
                                description: 'ソート条件'
                            },
                            html: {
                                type: 'string',
                                description: 'カスタマイズビューのHTML（CUSTOMビューのみ）'
                            },
                            pager: {
                                type: 'boolean',
                                description: 'ページ送りの表示/非表示（CUSTOMビューのみ）'
                            }
                        },
                        required: ['type', 'name']
                    }
                },
                revision: {
                    type: 'number',
                    description: '更新前のリビジョン番号（省略時は最新）'
                }
            },
            required: ['app_id', 'views']
        },
        annotations: {
            readOnly: false,
            safe: false,
            category: 'app',
            requiresConfirmation: true,
            longRunning: false,
            impact: 'medium'
        }
    },
    {
        name: 'get_app_acl',
        description: 'kintoneアプリのアクセス権限を取得します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                preview: {
                    type: 'boolean',
                    description: 'プレビュー環境の設定を取得する場合はtrue（省略時はfalse）'
                }
            },
            required: ['app_id']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'app',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'get_field_acl',
        description: 'kintoneアプリのフィールドのアクセス権限を取得します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                preview: {
                    type: 'boolean',
                    description: 'プレビュー環境の設定を取得する場合はtrue（省略時はfalse）'
                }
            },
            required: ['app_id']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'app',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'update_field_acl',
        description: 'kintoneアプリのフィールドのアクセス権限を更新します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                rights: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            code: {
                                type: 'string',
                                description: 'フィールドコード'
                            },
                            entities: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        entity: {
                                            type: 'object',
                                            properties: {
                                                type: {
                                                    type: 'string',
                                                    enum: ['USER', 'GROUP', 'ORGANIZATION', 'FIELD_ENTITY'],
                                                    description: 'エンティティの種類'
                                                },
                                                code: {
                                                    type: 'string',
                                                    description: 'エンティティのコード（FIELD_ENTITYの場合はフィールドコード）'
                                                }
                                            },
                                            required: ['type']
                                        },
                                        viewable: {
                                            type: 'boolean',
                                            description: '閲覧可能かどうか'
                                        },
                                        editable: {
                                            type: 'boolean',
                                            description: '編集可能かどうか'
                                        }
                                    },
                                    required: ['entity']
                                },
                                description: 'アクセス権限を設定するエンティティの配列'
                            }
                        },
                        required: ['code', 'entities']
                    },
                    description: 'フィールドごとのアクセス権限設定'
                },
                revision: {
                    type: 'number',
                    description: '更新前のリビジョン番号（省略時は最新）'
                }
            },
            required: ['app_id', 'rights']
        },
        annotations: {
            readOnly: false,
            safe: false,
            category: 'app',
            requiresConfirmation: true,
            longRunning: false,
            impact: 'high'
        }
    },
    {
        name: 'get_reports',
        description: 'kintoneアプリのグラフ設定を取得します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                preview: {
                    type: 'boolean',
                    description: 'プレビュー環境の設定を取得する場合はtrue（省略時はfalse）'
                }
            },
            required: ['app_id']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'app',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'update_reports',
        description: 'kintoneアプリのグラフ設定を更新します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                reports: {
                    type: 'object',
                    description: 'グラフの設定オブジェクト。各グラフ名をキーとして、グラフの設定を値として指定します。',
                    additionalProperties: {
                        type: 'object',
                        properties: {
                            chartType: {
                                type: 'string',
                                enum: ['BAR', 'COLUMN', 'PIE', 'LINE', 'PIVOT_TABLE', 'TABLE'],
                                description: 'グラフの種類'
                            },
                            chartMode: {
                                type: 'string',
                                enum: ['NORMAL', 'STACKED', 'PERCENTAGE'],
                                description: 'グラフモード（BAR/COLUMNのみ）'
                            },
                            name: {
                                type: 'string',
                                description: 'グラフの名前'
                            },
                            index: {
                                type: 'number',
                                description: 'グラフの表示順'
                            },
                            groups: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        code: {
                                            type: 'string',
                                            description: 'グループ化するフィールドのコード'
                                        }
                                    },
                                    required: ['code']
                                },
                                description: 'グループ化の設定（最大3つ）',
                                maxItems: 3
                            },
                            aggregations: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        type: {
                                            type: 'string',
                                            enum: ['COUNT', 'SUM', 'AVERAGE', 'MAX', 'MIN'],
                                            description: '集計タイプ'
                                        },
                                        code: {
                                            type: 'string',
                                            description: '集計対象フィールドのコード（COUNTの場合は不要）'
                                        }
                                    },
                                    required: ['type']
                                },
                                description: '集計の設定'
                            },
                            filterCond: {
                                type: 'string',
                                description: '絞り込み条件'
                            },
                            sorts: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        by: {
                                            type: 'string',
                                            enum: ['TOTAL', 'GROUP1', 'GROUP2', 'GROUP3'],
                                            description: 'ソート対象'
                                        },
                                        order: {
                                            type: 'string',
                                            enum: ['ASC', 'DESC'],
                                            description: 'ソート順'
                                        }
                                    },
                                    required: ['by', 'order']
                                },
                                description: 'ソート設定'
                            },
                            periodicReport: {
                                type: 'object',
                                properties: {
                                    active: {
                                        type: 'boolean',
                                        description: '定期レポートを有効にするか'
                                    },
                                    period: {
                                        type: 'object',
                                        properties: {
                                            every: {
                                                type: 'string',
                                                enum: ['YEAR', 'QUARTER', 'MONTH', 'WEEK', 'DAY', 'HOUR'],
                                                description: 'レポート期間'
                                            },
                                            pattern: {
                                                type: 'string',
                                                enum: ['THIS_PERIOD', 'LAST_PERIOD', 'PERIODS_FROM_BEGINNING'],
                                                description: 'レポートパターン'
                                            }
                                        },
                                        required: ['every']
                                    }
                                },
                                description: '定期レポートの設定'
                            }
                        },
                        required: ['chartType', 'name', 'index']
                    }
                },
                revision: {
                    type: 'number',
                    description: '更新前のリビジョン番号（省略時は最新）'
                }
            },
            required: ['app_id', 'reports']
        },
        annotations: {
            readOnly: false,
            safe: false,
            category: 'app',
            requiresConfirmation: true,
            longRunning: false,
            impact: 'medium'
        }
    },
    {
        name: 'get_notifications',
        description: 'kintoneアプリの通知条件設定を取得します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                preview: {
                    type: 'boolean',
                    description: 'プレビュー環境の設定を取得する場合はtrue（省略時はfalse）'
                }
            },
            required: ['app_id']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'app',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'update_notifications',
        description: 'kintoneアプリの通知条件設定を更新します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                notifications: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            filterCond: {
                                type: 'string',
                                description: '通知条件'
                            },
                            title: {
                                type: 'string',
                                description: '通知内容'
                            },
                            targets: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        entity: {
                                            type: 'object',
                                            properties: {
                                                type: {
                                                    type: 'string',
                                                    enum: ['USER', 'GROUP', 'ORGANIZATION', 'FIELD_ENTITY'],
                                                    description: 'エンティティの種類'
                                                },
                                                code: {
                                                    type: 'string',
                                                    description: 'エンティティのコード'
                                                }
                                            },
                                            required: ['type']
                                        },
                                        includeSubs: {
                                            type: 'boolean',
                                            description: '配下の組織を含むか（組織の場合のみ）'
                                        }
                                    },
                                    required: ['entity']
                                },
                                description: '通知先の配列'
                            }
                        },
                        required: ['title', 'targets']
                    },
                    description: '通知条件設定の配列'
                },
                revision: {
                    type: 'number',
                    description: '更新前のリビジョン番号（省略時は最新）'
                }
            },
            required: ['app_id', 'notifications']
        },
        annotations: {
            readOnly: false,
            safe: false,
            category: 'app',
            requiresConfirmation: true,
            longRunning: false,
            impact: 'medium'
        }
    },
    {
        name: 'get_per_record_notifications',
        description: 'kintoneアプリのレコード単位の通知設定を取得します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                preview: {
                    type: 'boolean',
                    description: 'プレビュー環境の設定を取得する場合はtrue（省略時はfalse）'
                }
            },
            required: ['app_id']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'app',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'update_per_record_notifications',
        description: 'kintoneアプリのレコード単位の通知設定を更新します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                notifications: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            filterCond: {
                                type: 'string',
                                description: '通知条件'
                            },
                            title: {
                                type: 'string',
                                description: '通知内容'
                            },
                            targets: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        entity: {
                                            type: 'object',
                                            properties: {
                                                type: {
                                                    type: 'string',
                                                    enum: ['USER', 'GROUP', 'ORGANIZATION', 'FIELD_ENTITY'],
                                                    description: 'エンティティの種類'
                                                },
                                                code: {
                                                    type: 'string',
                                                    description: 'エンティティのコード'
                                                }
                                            },
                                            required: ['type']
                                        },
                                        includeSubs: {
                                            type: 'boolean',
                                            description: '配下の組織を含むか（組織の場合のみ）'
                                        }
                                    },
                                    required: ['entity']
                                },
                                description: '通知先の配列'
                            }
                        },
                        required: ['title', 'targets']
                    },
                    description: '通知条件設定の配列'
                },
                revision: {
                    type: 'number',
                    description: '更新前のリビジョン番号（省略時は最新）'
                }
            },
            required: ['app_id', 'notifications']
        },
        annotations: {
            readOnly: false,
            safe: false,
            category: 'app',
            requiresConfirmation: true,
            longRunning: false,
            impact: 'medium'
        }
    },
    {
        name: 'get_reminder_notifications',
        description: 'kintoneアプリのリマインダー通知設定を取得します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                preview: {
                    type: 'boolean',
                    description: 'プレビュー環境の設定を取得する場合はtrue（省略時はfalse）'
                }
            },
            required: ['app_id']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'app',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'update_reminder_notifications',
        description: 'kintoneアプリのリマインダー通知設定を更新します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                notifications: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            filterCond: {
                                type: 'string',
                                description: '通知条件'
                            },
                            title: {
                                type: 'string',
                                description: '通知内容'
                            },
                            timing: {
                                type: 'object',
                                properties: {
                                    code: {
                                        type: 'string',
                                        description: '基準となる日時フィールドのコード'
                                    },
                                    daysLater: {
                                        type: 'string',
                                        description: '基準日時からの日数（負の値で前）'
                                    },
                                    hoursLater: {
                                        type: 'string',
                                        description: '基準日時からの時間数（負の値で前）'
                                    },
                                    time: {
                                        type: 'string',
                                        description: '通知時刻（HH:MM形式）'
                                    }
                                },
                                required: ['code']
                            },
                            targets: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        entity: {
                                            type: 'object',
                                            properties: {
                                                type: {
                                                    type: 'string',
                                                    enum: ['USER', 'GROUP', 'ORGANIZATION', 'FIELD_ENTITY'],
                                                    description: 'エンティティの種類'
                                                },
                                                code: {
                                                    type: 'string',
                                                    description: 'エンティティのコード'
                                                }
                                            },
                                            required: ['type']
                                        },
                                        includeSubs: {
                                            type: 'boolean',
                                            description: '配下の組織を含むか（組織の場合のみ）'
                                        }
                                    },
                                    required: ['entity']
                                },
                                description: '通知先の配列'
                            }
                        },
                        required: ['title', 'timing', 'targets']
                    },
                    description: 'リマインダー通知設定の配列'
                },
                revision: {
                    type: 'number',
                    description: '更新前のリビジョン番号（省略時は最新）'
                }
            },
            required: ['app_id', 'notifications']
        },
        annotations: {
            readOnly: false,
            safe: false,
            category: 'app',
            requiresConfirmation: true,
            longRunning: false,
            impact: 'medium'
        }
    },
    {
        name: 'update_app_actions',
        description: 'kintoneアプリのアクション設定を更新します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                actions: {
                    type: 'object',
                    description: 'アクション設定。アクション名をキーとして設定を指定',
                    additionalProperties: {
                        type: 'object',
                        properties: {
                            name: {
                                type: 'string',
                                description: 'アクションの名前'
                            },
                            index: {
                                type: 'string',
                                description: 'アクションの表示順'
                            },
                            destApp: {
                                type: 'object',
                                properties: {
                                    app: {
                                        type: 'string',
                                        description: '遷移先アプリID'
                                    },
                                    code: {
                                        type: 'string',
                                        description: '遷移先アプリコード'
                                    }
                                },
                                description: '遷移先アプリ情報'
                            },
                            mappings: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        srcField: {
                                            type: 'string',
                                            description: 'コピー元フィールドコード'
                                        },
                                        destField: {
                                            type: 'string',
                                            description: 'コピー先フィールドコード'
                                        }
                                    },
                                    required: ['srcField', 'destField']
                                },
                                description: 'フィールドマッピング'
                            },
                            entities: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        type: {
                                            type: 'string',
                                            enum: ['USER', 'GROUP', 'ORGANIZATION'],
                                            description: 'エンティティの種類'
                                        },
                                        code: {
                                            type: 'string',
                                            description: 'エンティティのコード'
                                        }
                                    },
                                    required: ['type', 'code']
                                },
                                description: 'アクションを利用できるエンティティ'
                            }
                        },
                        required: ['name', 'index']
                    }
                },
                revision: {
                    type: 'number',
                    description: '更新前のリビジョン番号（省略時は最新）'
                }
            },
            required: ['app_id', 'actions']
        },
        annotations: {
            readOnly: false,
            safe: false,
            category: 'app',
            requiresConfirmation: true,
            longRunning: false,
            impact: 'medium'
        }
    },
    {
        name: 'update_plugins',
        description: 'kintoneアプリのプラグイン設定を更新します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                plugins: {
                    type: 'object',
                    description: 'プラグイン設定。プラグインIDをキーとして設定を指定',
                    additionalProperties: {
                        type: 'object',
                        properties: {
                            config: {
                                type: 'string',
                                description: 'プラグインの設定（JSON文字列）'
                            }
                        }
                    }
                },
                revision: {
                    type: 'number',
                    description: '更新前のリビジョン番号（省略時は最新）'
                }
            },
            required: ['app_id']
        },
        annotations: {
            readOnly: false,
            safe: false,
            category: 'app',
            requiresConfirmation: true,
            longRunning: false,
            impact: 'medium'
        }
    },
    {
        name: 'get_app_customize',
        description: 'kintoneアプリのJavaScript/CSSカスタマイズ設定を取得します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                preview: {
                    type: 'boolean',
                    description: 'プレビュー環境の設定を取得する場合はtrue（省略時はfalse）'
                }
            },
            required: ['app_id']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'app',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'update_app_customize',
        description: 'kintoneアプリのJavaScript/CSSカスタマイズ設定を更新します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                scope: {
                    type: 'string',
                    enum: ['ALL', 'ADMIN', 'NONE'],
                    description: 'カスタマイズの適用範囲'
                },
                desktop: {
                    type: 'object',
                    properties: {
                        js: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    type: {
                                        type: 'string',
                                        enum: ['FILE', 'URL'],
                                        description: 'JavaScriptファイルの種類'
                                    },
                                    file: {
                                        type: 'object',
                                        properties: {
                                            fileKey: {
                                                type: 'string',
                                                description: 'アップロードしたファイルのキー'
                                            }
                                        },
                                        required: ['fileKey']
                                    },
                                    url: {
                                        type: 'string',
                                        description: 'JavaScriptファイルのURL'
                                    }
                                },
                                required: ['type']
                            },
                            description: 'PC用JavaScriptファイル'
                        },
                        css: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    type: {
                                        type: 'string',
                                        enum: ['FILE', 'URL'],
                                        description: 'CSSファイルの種類'
                                    },
                                    file: {
                                        type: 'object',
                                        properties: {
                                            fileKey: {
                                                type: 'string',
                                                description: 'アップロードしたファイルのキー'
                                            }
                                        },
                                        required: ['fileKey']
                                    },
                                    url: {
                                        type: 'string',
                                        description: 'CSSファイルのURL'
                                    }
                                },
                                required: ['type']
                            },
                            description: 'PC用CSSファイル'
                        }
                    }
                },
                mobile: {
                    type: 'object',
                    properties: {
                        js: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    type: {
                                        type: 'string',
                                        enum: ['FILE', 'URL'],
                                        description: 'JavaScriptファイルの種類'
                                    },
                                    file: {
                                        type: 'object',
                                        properties: {
                                            fileKey: {
                                                type: 'string',
                                                description: 'アップロードしたファイルのキー'
                                            }
                                        },
                                        required: ['fileKey']
                                    },
                                    url: {
                                        type: 'string',
                                        description: 'JavaScriptファイルのURL'
                                    }
                                },
                                required: ['type']
                            },
                            description: 'モバイル用JavaScriptファイル'
                        },
                        css: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    type: {
                                        type: 'string',
                                        enum: ['FILE', 'URL'],
                                        description: 'CSSファイルの種類'
                                    },
                                    file: {
                                        type: 'object',
                                        properties: {
                                            fileKey: {
                                                type: 'string',
                                                description: 'アップロードしたファイルのキー'
                                            }
                                        },
                                        required: ['fileKey']
                                    },
                                    url: {
                                        type: 'string',
                                        description: 'CSSファイルのURL'
                                    }
                                },
                                required: ['type']
                            },
                            description: 'モバイル用CSSファイル'
                        }
                    }
                },
                revision: {
                    type: 'number',
                    description: '更新前のリビジョン番号（省略時は最新）'
                }
            },
            required: ['app_id', 'scope']
        },
        annotations: {
            readOnly: false,
            safe: false,
            category: 'app',
            requiresConfirmation: true,
            longRunning: false,
            impact: 'high'
        }
    },
    {
        name: 'update_app_acl',
        description: 'kintoneアプリのアクセス権限を更新します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                rights: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            entity: {
                                type: 'object',
                                properties: {
                                    type: {
                                        type: 'string',
                                        enum: ['USER', 'GROUP', 'ORGANIZATION', 'CREATOR'],
                                        description: 'エンティティの種類'
                                    },
                                    code: {
                                        type: 'string',
                                        description: 'エンティティのコード（CREATORの場合は不要）'
                                    }
                                },
                                required: ['type']
                            },
                            appEditable: {
                                type: 'boolean',
                                description: 'アプリ管理権限'
                            },
                            recordViewable: {
                                type: 'boolean',
                                description: 'レコード閲覧権限'
                            },
                            recordAddable: {
                                type: 'boolean',
                                description: 'レコード追加権限'
                            },
                            recordEditable: {
                                type: 'boolean',
                                description: 'レコード編集権限'
                            },
                            recordDeletable: {
                                type: 'boolean',
                                description: 'レコード削除権限'
                            },
                            recordImportable: {
                                type: 'boolean',
                                description: 'レコードインポート権限'
                            },
                            recordExportable: {
                                type: 'boolean',
                                description: 'レコードエクスポート権限'
                            },
                            includeSubs: {
                                type: 'boolean',
                                description: '配下の組織を含むか（組織の場合のみ）'
                            }
                        },
                        required: ['entity']
                    },
                    description: 'アクセス権限設定の配列'
                },
                revision: {
                    type: 'number',
                    description: '更新前のリビジョン番号（省略時は最新）'
                }
            },
            required: ['app_id', 'rights']
        },
        annotations: {
            readOnly: false,
            safe: false,
            category: 'app',
            requiresConfirmation: true,
            longRunning: false,
            impact: 'high'
        }
    },
    {
        name: 'get_record_acl',
        description: '指定したレコードのアクセス権限を取得します',
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
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'app',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    },
    {
        name: 'evaluate_records_acl',
        description: '指定した条件でレコードのアクセス権限を評価します',
        inputSchema: {
            type: 'object',
            properties: {
                app_id: {
                    type: 'number',
                    description: 'kintoneアプリのID'
                },
                record_ids: {
                    type: 'array',
                    items: {
                        type: 'number'
                    },
                    description: 'レコードIDの配列',
                    minItems: 1
                }
            },
            required: ['app_id', 'record_ids']
        },
        annotations: {
            readOnly: true,
            safe: true,
            category: 'app',
            requiresConfirmation: false,
            longRunning: false,
            impact: 'low'
        }
    }
];
