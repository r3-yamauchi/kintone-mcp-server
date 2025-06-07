// src/utils/ResponseBuilder.js
/**
 * 共通レスポンスビルダー
 * 統一されたレスポンス形式を提供
 */
export class ResponseBuilder {
    /**
     * 成功レスポンスを生成
     * @param {Object} additionalData - 追加データ
     * @returns {Object} レスポンスオブジェクト
     */
    static success(additionalData = {}) {
        return { success: true, ...additionalData };
    }
    
    /**
     * リビジョン付き成功レスポンスを生成
     * @param {number} revision - リビジョン番号
     * @param {Object} additionalData - 追加データ
     * @returns {Object} レスポンスオブジェクト
     */
    static withRevision(revision, additionalData = {}) {
        return { success: true, revision, ...additionalData };
    }
    
    /**
     * リビジョンと警告付きレスポンスを生成
     * @param {number} revision - リビジョン番号
     * @param {Array} warnings - 警告メッセージ配列
     * @param {Object} additionalData - 追加データ
     * @returns {Object} レスポンスオブジェクト
     */
    static withRevisionAndWarnings(revision, warnings, additionalData = {}) {
        const response = { revision, ...additionalData };
        if (warnings && warnings.length > 0) {
            response.warnings = warnings;
        }
        return response;
    }
    
    /**
     * ID付きレスポンスを生成
     * @param {string} idField - IDフィールド名
     * @param {string|number} idValue - ID値
     * @param {Object} additionalData - 追加データ
     * @returns {Object} レスポンスオブジェクト
     */
    static withId(idField, idValue, additionalData = {}) {
        return { [idField]: idValue, ...additionalData };
    }
    
    /**
     * レコード作成レスポンスを生成
     * @param {string|number} recordId - レコードID
     * @param {number} revision - リビジョン番号（オプション）
     * @returns {Object} レスポンスオブジェクト
     */
    static recordCreated(recordId, revision = null) {
        const response = { record_id: recordId };
        if (revision !== null) {
            response.revision = revision;
        }
        return response;
    }
    
    /**
     * レコード更新レスポンスを生成
     * @param {number} revision - リビジョン番号
     * @returns {Object} レスポンスオブジェクト
     */
    static recordUpdated(revision) {
        return { success: true, revision };
    }
    
    /**
     * 複数レコード作成レスポンスを生成
     * @param {Array} ids - レコードID配列
     * @param {Array} revisions - リビジョン番号配列
     * @returns {Object} レスポンスオブジェクト
     */
    static recordsCreated(ids, revisions) {
        return { ids, revisions };
    }
    
    /**
     * 複数レコード更新レスポンスを生成
     * @param {Array} records - 更新結果配列
     * @returns {Object} レスポンスオブジェクト
     */
    static recordsUpdated(records) {
        return { records };
    }
    
    /**
     * アプリ作成レスポンスを生成
     * @param {string|number} appId - アプリID
     * @param {number} revision - リビジョン番号
     * @returns {Object} レスポンスオブジェクト
     */
    static appCreated(appId, revision) {
        return { app: appId, revision };
    }
    
    /**
     * デプロイレスポンスを生成
     * @param {Object} deployStatus - デプロイステータス
     * @returns {Object} レスポンスオブジェクト
     */
    static deployStatus(deployStatus) {
        return deployStatus;
    }
    
    /**
     * リスト形式のレスポンスを生成
     * @param {string} listName - リスト名
     * @param {Array} items - アイテム配列
     * @param {Object} metadata - メタデータ（totalCount, hasMoreなど）
     * @returns {Object} レスポンスオブジェクト
     */
    static list(listName, items, metadata = {}) {
        return { [listName]: items, ...metadata };
    }
    
    /**
     * ページネーション付きレスポンスを生成
     * @param {Array} items - アイテム配列
     * @param {number} totalCount - 総件数
     * @param {number} offset - オフセット
     * @param {number} limit - リミット
     * @returns {Object} レスポンスオブジェクト
     */
    static paginated(items, totalCount, offset, limit) {
        return {
            items,
            totalCount,
            offset,
            limit,
            hasMore: offset + items.length < totalCount
        };
    }
    
    /**
     * ACL（アクセス権限）レスポンスを生成
     * @param {Array} acl - アクセス権限配列
     * @param {number} revision - リビジョン番号
     * @returns {Object} レスポンスオブジェクト
     */
    static acl(acl, revision) {
        return { acl, revision };
    }
    
    /**
     * フィールド情報レスポンスを生成
     * @param {Object} properties - フィールドプロパティ
     * @param {number} revision - リビジョン番号（オプション）
     * @returns {Object} レスポンスオブジェクト
     */
    static fields(properties, revision = null) {
        const response = { properties };
        if (revision !== null) {
            response.revision = revision;
        }
        return response;
    }
    
    /**
     * レイアウト情報レスポンスを生成
     * @param {Array} layout - レイアウト配列
     * @param {number} revision - リビジョン番号（オプション）
     * @returns {Object} レスポンスオブジェクト
     */
    static layout(layout, revision = null) {
        const response = { layout };
        if (revision !== null) {
            response.revision = revision;
        }
        return response;
    }
    
    /**
     * エラーレスポンスを生成
     * @param {string} message - エラーメッセージ
     * @param {string} code - エラーコード（オプション）
     * @param {Object} details - 詳細情報（オプション）
     * @returns {Object} レスポンスオブジェクト
     */
    static error(message, code = null, details = null) {
        const response = { success: false, error: message };
        if (code) {
            response.code = code;
        }
        if (details) {
            response.details = details;
        }
        return response;
    }
}