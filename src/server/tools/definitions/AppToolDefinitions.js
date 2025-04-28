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
    }
];
