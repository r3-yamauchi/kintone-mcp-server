// src/repositories/KintoneRecordRepository.js
import { BaseKintoneRepository } from './base/BaseKintoneRepository.js';
import { KintoneRecord } from '../models/KintoneRecord.js';

export class KintoneRecordRepository extends BaseKintoneRepository {
    async getRecord(appId, recordId) {
        try {
            console.error(`Fetching record: ${appId}/${recordId}`);
            const response = await this.client.record.getRecord({
                app: appId,
                id: recordId,
            });
            console.error('Response:', response);
            return new KintoneRecord(appId, recordId, response.record);
        } catch (error) {
            this.handleKintoneError(error, `get record ${appId}/${recordId}`);
        }
    }

    async searchRecords(appId, query, fields = []) {
        try {
            const params = { app: appId };
            
            // クエリ文字列の処理
            if (query) {
                // クエリ文字列が order や limit のみで構成されているかチェック
                const hasCondition = /[^\s]+([ ]*=|[ ]*!=|[ ]*>|[ ]*<|[ ]*>=|[ ]*<=|[ ]*like|[ ]*in |[ ]*not[ ]+in)/.test(query);
                const hasOrderOrLimit = /(order |limit )/i.test(query);
                
                // order や limit のみの場合、$id > 0 を先頭に挿入
                if (!hasCondition && hasOrderOrLimit) {
                    params.condition = `$id > 0 ${query}`;
                    console.error(`Modified query: ${params.condition}`);
                } else {
                    params.condition = query;
                }
            }
            
            if (fields.length > 0) {
                params.fields = fields;
            }
            console.error(`Searching records: ${appId}`);
            console.error(`Request data:`, params);

            const records = await this.client.record.getAllRecords(params);
            console.error(`Found ${records.length} records`);

            return records.map((record) => {
                const recordId = record.$id.value || 'unknown';
                return new KintoneRecord(appId, recordId, record);
            });
        } catch (error) {
            this.handleKintoneError(error, `search records ${appId}`);
        }
    }

    async createRecord(appId, fields) {
        try {
            console.error(`Creating record in app: ${appId}`);
            const response = await this.client.record.addRecord({
                app: appId,
                record: fields,
            });
            return response.id;
        } catch (error) {
            this.handleKintoneError(error, `create record in app ${appId}`);
        }
    }

    async updateRecord(record) {
        try {
            console.error(`Updating record: ${record.appId}/${record.recordId}`);
            const response = await this.client.record.updateRecord({
                app: record.appId,
                id: record.recordId,
                record: record.fields
            });
            console.error('Update response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `update record ${record.appId}/${record.recordId}`);
        }
    }

    async addRecordComment(appId, recordId, text, mentions = []) {
        try {
            console.error(`Adding comment to record: ${appId}/${recordId}`);
            const response = await this.client.record.addRecordComment({
                app: appId,
                record: recordId,
                comment: {
                    text: text,
                    mentions: mentions
                }
            });
            console.error('Comment added:', response);
            return response.id;
        } catch (error) {
            this.handleKintoneError(error, `add comment to record ${appId}/${recordId}`);
        }
    }
}
