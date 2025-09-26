// src/utils/LoggingUtils.js
/**
 * 共通ログユーティリティ
 * - 構造化されたJSONログを出力
 * - カテゴリ毎のデバッグ出力切り替えをサポート（デフォルトは無効）
 * - 機密情報が含まれる可能性のある値は要約・マスクして出力
 */
const DEFAULT_DEBUG_STATE = false;
const CATEGORY_DEBUG_FLAGS = new Map();
let defaultDebugState = DEFAULT_DEBUG_STATE;

// 環境変数 MCP_LOG_DEBUG でデバッグカテゴリを有効化（例: "record,app"）
const envDebug = process.env.MCP_LOG_DEBUG;
if (envDebug && typeof envDebug === 'string') {
    const normalized = envDebug
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
    for (const category of normalized) {
        CATEGORY_DEBUG_FLAGS.set(category, true);
    }
}

export class LoggingUtils {
    /**
     * デバッグ出力の設定を上書き
     * @param {Object} options 設定オプション
     * @param {boolean} options.defaultDebug 既定のデバッグ状態
     * @param {Record<string, boolean>} options.categories カテゴリ別デバッグ設定
     */
    static configure({ defaultDebug, categories } = {}) {
        if (typeof defaultDebug === 'boolean') {
            defaultDebugState = defaultDebug;
        }
        if (categories && typeof categories === 'object') {
            for (const [category, enabled] of Object.entries(categories)) {
                CATEGORY_DEBUG_FLAGS.set(category, Boolean(enabled));
            }
        }
    }

    /**
     * 指定カテゴリをデバッグ有効化
     * @param {string} category カテゴリ名
     */
    static enableDebug(category) {
        CATEGORY_DEBUG_FLAGS.set(category, true);
    }

    /**
     * 指定カテゴリのデバッグを無効化
     * @param {string} category カテゴリ名
     */
    static disableDebug(category) {
        CATEGORY_DEBUG_FLAGS.set(category, false);
    }

    /**
     * デバッグ出力可否を判定
     * @param {string} category カテゴリ名
     * @returns {boolean}
     */
    static isDebugEnabled(category) {
        if (!category) {
            return defaultDebugState;
        }
        if (CATEGORY_DEBUG_FLAGS.has(category)) {
            return CATEGORY_DEBUG_FLAGS.get(category);
        }
        return defaultDebugState;
    }

    /**
     * 情報ログを出力
     * @param {string} category カテゴリ名
     * @param {string} message メッセージ
     * @param {Object} [metadata] 付随情報
     */
    static info(category, message, metadata) {
        this.emit('info', category, message, metadata);
    }

    /**
     * デバッグログを出力（カテゴリが有効な場合のみ）
     * @param {string} category カテゴリ名
     * @param {string} message メッセージ
     * @param {Object} [metadata] 付随情報
     */
    static debug(category, message, metadata) {
        if (!this.isDebugEnabled(category)) {
            return;
        }
        this.emit('debug', category, message, metadata);
    }

    /**
     * 警告ログを出力
     * @param {string} category カテゴリ名
     * @param {string} message メッセージ
     * @param {Object} [metadata] 付随情報
     */
    static warn(category, message, metadata) {
        this.emit('warn', category, message, metadata);
    }

    /**
     * エラーログを出力
     * @param {string} category カテゴリ名
     * @param {string} message メッセージ
     * @param {Error} error エラーオブジェクト
     * @param {Object} [metadata] 付随情報
     */
    static error(category, message, error, metadata) {
        const details = {
            error: this.sanitizeError(error)
        };
        if (metadata) {
            details.metadata = this.sanitize(metadata);
        }
        this.emit('error', category, message, details, { includeMetadata: true });
    }

    /**
     * 旧API互換: 操作ログ（info扱い）
     */
    static logOperation(operation, params) {
        const metadata = params !== undefined ? { details: params } : undefined;
        this.info('operation', operation, metadata);
    }

    /**
     * 旧API互換: 詳細操作ログ（debug扱い）
     */
    static logDetailedOperation(operation, primaryInfo, details) {
        const metadata = {
            primary: primaryInfo,
            details
        };
        this.debug('operation', operation, metadata);
    }

    /**
     * 旧API互換: ツール実行ログ
     */
    static logToolExecution(toolCategory, toolName, args) {
        const metadata = {
            tool: toolName,
            argumentKeys: Array.isArray(args) ? [] : Object.keys(args || {})
        };
        this.info(`${toolCategory || 'tool'}`, 'tool_execution', metadata);
        if (args && Object.keys(args).length > 0) {
            this.debug(`${toolCategory || 'tool'}`, 'tool_arguments', args);
        }
    }

    /**
     * 旧API互換: API呼び出しログ
     */
    static logApiCall(apiMethod, params) {
        this.info('api', 'api_call', { method: apiMethod });
        if (params) {
            this.debug('api', 'api_call_params', params);
        }
    }

    /**
     * 旧API互換: APIレスポンスログ
     */
    static logApiResponse(apiMethod, response, detailed = false) {
        const summary = this.summarizeResponse(response);
        this.info('api', 'api_response', { method: apiMethod, summary });
        if (detailed) {
            this.debug('api', 'api_response_detail', response);
        }
    }

    /**
     * 旧API互換: エラーログ
     */
    static logError(context, error) {
        this.error('error', context, error);
    }

    /**
     * 旧API互換: 警告ログ
     */
    static logWarning(context, message) {
        this.warn('warning', context, { message });
    }

    /**
     * 内部メソッド: ログを出力
     */
    static emit(level, category, message, metadata, { includeMetadata = false } = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            category: category || 'general',
            message
        };

        if (metadata !== undefined && metadata !== null) {
            const sanitized = includeMetadata ? metadata : this.sanitize(metadata);
            if (sanitized !== undefined) {
                entry.metadata = sanitized;
            }
        }

        console.error(JSON.stringify(entry));
    }

    /**
     * 値をサニタイズして要約を生成
     * @param {*} value 任意の値
     * @param {number} depth 再帰深さ
     * @returns {*} サニタイズ済みの値
     */
    static sanitize(value, depth = 0) {
        if (value === null || value === undefined) {
            return value;
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        const valueType = typeof value;

        if (valueType === 'string') {
            const trimmed = value.trim();
            if (trimmed.length > 64) {
                return `${trimmed.slice(0, 32)}...(${trimmed.length})`;
            }
            return trimmed;
        }

        if (valueType === 'number' || valueType === 'boolean') {
            return value;
        }

        if (Array.isArray(value)) {
            return {
                type: 'array',
                length: value.length
            };
        }

        if (valueType === 'object') {
            if (depth >= 1) {
                return {
                    type: 'object',
                    keys: Object.keys(value).slice(0, 5)
                };
            }
            const result = {};
            const keys = Object.keys(value);
            const limitedKeys = keys.slice(0, 5);
            for (const key of limitedKeys) {
                result[key] = this.sanitize(value[key], depth + 1);
            }
            if (keys.length > limitedKeys.length) {
                result._truncatedKeys = keys.length - limitedKeys.length;
            }
            return result;
        }

        return String(value);
    }

    /**
     * エラーオブジェクトのサニタイズ
     * @param {Error} error エラー
     * @returns {Object}
     */
    static sanitizeError(error) {
        if (!error) {
            return null;
        }
        const base = {
            name: error.name || 'Error',
            message: this.sanitize(error.message),
            code: error.code,
            status: error.status
        };
        if (this.isDebugEnabled('error') && error.stack) {
            base.stack = this.sanitize(error.stack);
        }
        return base;
    }

    /**
     * APIレスポンスの要約
     * @param {Object} response レスポンス
     * @returns {Object|null}
     */
    static summarizeResponse(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        const summary = {};
        if (Array.isArray(response.records)) {
            summary.recordCount = response.records.length;
        }
        if (response.totalCount !== undefined) {
            summary.totalCount = Number(response.totalCount);
        }
        if (response.id !== undefined) {
            summary.id = response.id;
        }
        if (response.ids !== undefined) {
            summary.ids = Array.isArray(response.ids) ? response.ids.length : response.ids;
        }
        if (response.revision !== undefined) {
            summary.revision = response.revision;
        }
        if (Object.keys(summary).length === 0) {
            summary.keys = Object.keys(response).slice(0, 5);
        }
        return summary;
    }
}
