// src/repositories/KintoneRecordRepository.js
import { BaseKintoneRepository } from './base/BaseKintoneRepository.js';
import { KintoneRecord } from '../models/KintoneRecord.js';
import { LoggingUtils } from '../utils/LoggingUtils.js';

export class KintoneRecordRepository extends BaseKintoneRepository {
    async getRecord(appId, recordId) {
        const params = { app: appId, id: recordId };
        return this.executeWithDetailedLogging(
            'getRecord',
            params,
            () => this.client.record.getRecord(params),
            `get record ${appId}/${recordId}`
        ).then(response => new KintoneRecord(appId, recordId, response.record));
    }

    async searchRecords(appId, query, fields = []) {
        const params = { app: appId };
        
        // クエリ文字列の処理
        if (query) {
            // クエリ文字列が order や limit のみで構成されているかチェック
            // 条件句の検出: 比較/文字列/集合/空判定（is empty / is not empty）をサポート
            const hasCondition = /[^\s]+(?:\s*(?:=|!=|>|<|>=|<=|like|in|not\s+in)|\s+is\s+(?:not\s+)?empty)/i.test(query);
            const hasOrderOrLimit = /(order |limit )/i.test(query);
            
            // order や limit のみの場合、$id > 0 を先頭に挿入
            if (!hasCondition && hasOrderOrLimit) {
                params.condition = `$id > 0 ${query}`;
                LoggingUtils.logOperation('Modified query', params.condition);
            } else {
                params.condition = query;
            }
        }
        
        if (fields.length > 0) {
            params.fields = fields;
        }

        return this.executeWithDetailedLogging(
            'searchRecords',
            params,
            () => this.client.record.getAllRecords(params),
            `search records ${appId}`
        ).then(records => {
            LoggingUtils.logOperation(`Found records`, `${records.length} records`);
            return records.map((record) => {
                const recordId = record.$id.value || 'unknown';
                return new KintoneRecord(appId, recordId, record);
            });
        });
    }

    async createRecord(appId, fields) {
        const params = { app: appId, record: fields };
        return this.executeWithDetailedLogging(
            'createRecord',
            params,
            () => this.client.record.addRecord(params),
            `create record in app ${appId}`
        ).then(response => response.id);
    }

    async updateRecord(record) {
        const params = {
            app: record.appId,
            id: record.recordId,
            record: record.fields
        };
        return this.executeWithDetailedLogging(
            'updateRecord',
            params,
            () => this.client.record.updateRecord(params),
            `update record ${record.appId}/${record.recordId}`
        );
    }

    async updateRecordByKey(appId, keyField, keyValue, fields) {
        const params = {
            app: appId,
            updateKey: {
                field: keyField,
                value: keyValue
            },
            record: fields
        };
        return this.executeWithDetailedLogging(
            'updateRecordByKey',
            params,
            () => this.client.record.updateRecordByUpdateKey(params),
            `update record by key ${appId}/${keyField}=${keyValue}`
        );
    }

    async addRecordComment(appId, recordId, text, mentions = []) {
        const params = {
            app: appId,
            record: recordId,
            comment: {
                text: text,
                mentions: mentions
            }
        };
        return this.executeWithDetailedLogging(
            'addRecordComment',
            params,
            () => this.client.record.addRecordComment(params),
            `add comment to record ${appId}/${recordId}`
        ).then(response => response.id);
    }

    async getRecordAcl(appId, recordIds) {
        // kintone REST APIではレコード単位のアクセス権限取得はサポートされていません
        throw new Error(
            'レコード単位のアクセス権限取得機能はkintone REST APIではサポートされていません。\n\n' +
            '代替案：\n' +
            '1. アプリ全体のアクセス権限を確認する場合は get_app_acl を使用してください\n' +
            '2. プロセス管理のステータスに基づくアクセス制御を確認する場合は get_process_management を使用してください\n' +
            '3. レコードの作成者・更新者を確認する場合は、レコード取得時に CREATOR/MODIFIER フィールドを参照してください'
        );
    }

    async updateRecordStatus(appId, recordId, action, assignee = null) {
        const params = {
            app: appId,
            id: recordId,
            action: action
        };
        
        if (assignee) {
            params.assignee = assignee;
        }
        
        return this.executeWithDetailedLogging(
            'updateRecordStatus',
            params,
            () => this.client.record.updateRecordStatus(params),
            `update record status ${appId}/${recordId}`
        );
    }

    async updateRecordAssignees(appId, recordId, assignees) {
        const params = {
            app: appId,
            id: recordId,
            assignees: assignees
        };
        return this.executeWithDetailedLogging(
            'updateRecordAssignees',
            params,
            () => this.client.record.updateRecordAssignees(params),
            `update record assignees ${appId}/${recordId}`
        );
    }

    async getRecordComments(appId, recordId, order = 'desc', offset = 0, limit = 10) {
        const params = {
            app: appId,
            record: recordId,
            order: order,
            offset: offset,
            limit: limit
        };
        return this.executeWithDetailedLogging(
            'getRecordComments',
            params,
            () => this.client.record.getRecordComments(params),
            `get comments for record ${appId}/${recordId}`
        ).then(response => ({
            comments: response.comments,
            totalCount: response.totalCount
        }));
    }

    async updateRecordComment(appId, recordId, commentId, text, mentions = []) {
        const params = {
            app: appId,
            record: recordId,
            comment: commentId,
            text: text,
            mentions: mentions
        };
        return this.executeWithDetailedLogging(
            'updateRecordComment',
            params,
            () => this.client.record.updateRecordComment(params),
            `update comment ${commentId} for record ${appId}/${recordId}`
        );
    }

    async createRecords(appId, records) {
        const params = {
            app: appId,
            records: records
        };
        return this.executeWithDetailedLogging(
            'createRecords',
            params,
            () => this.client.record.addRecords(params),
            `create records in app ${appId}`
        );
    }

    async updateRecords(appId, records) {
        const params = {
            app: appId,
            records: records
        };
        return this.executeWithDetailedLogging(
            'updateRecords',
            params,
            () => this.client.record.updateRecords(params),
            `update records in app ${appId}`
        );
    }

    async upsertRecord(appId, updateKey, fields) {
        const params = {
            app: appId,
            updateKey: updateKey,
            record: fields
        };
        return this.executeWithDetailedLogging(
            'upsertRecord',
            params,
            () => this.client.record.upsertRecord(params),
            `upsert record in app ${appId} with key ${updateKey.field}=${updateKey.value}`
        );
    }
}
