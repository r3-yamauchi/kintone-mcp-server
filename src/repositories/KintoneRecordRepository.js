// src/repositories/KintoneRecordRepository.js
import { BaseKintoneRepository } from './base/BaseKintoneRepository.js';
import { KintoneRecord } from '../models/KintoneRecord.js';
import { LoggingUtils } from '../utils/LoggingUtils.js';

const DEFAULT_PAGE_LIMIT = 500;
const LIMIT_REGEX = /\blimit\s+(\d+)/i;
const OFFSET_REGEX = /\boffset\s+(\d+)/i;
const ORDER_BY_REGEX = /\border\s+by\b/i;
const TRAILING_CONNECTOR_REGEX = /(?:\b(?:and|or)\b|\border\s+by\b)\s*$/i;

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
        const { cleanQuery, userLimit, userOffset, hasLimit, hasOffset, hasOrderBy } = normalizeQuery(query);

        if (hasLimit && userLimit !== null && userLimit > DEFAULT_PAGE_LIMIT) {
            throw new Error('kintoneのlimit上限は500です。limitを省略して全件取得するか、500以下を指定してください。');
        }

        const normalizedFields = normalizeFields(fields);
        const baseParams = {
            app: appId,
            ...(normalizedFields.length > 0 ? { fields: normalizedFields } : {})
        };

        // ユーザーがlimitを指定している場合は単回取得（ユーザー意図を優先）
        if (hasLimit) {
            const effectiveLimit = userLimit ?? DEFAULT_PAGE_LIMIT;
            const effectiveOffset = hasOffset ? userOffset ?? 0 : 0;
            const singleQuery = buildOffsetQuery(cleanQuery, effectiveLimit, effectiveOffset);
            const params = { ...baseParams, query: singleQuery };

            return this.executeWithDetailedLogging(
                'searchRecords',
                params,
                () => this.client.record.getRecords(params),
                `search records ${appId}`
            ).then(response => mapRecords(appId, response.records));
        }

        // limit未指定の場合は全件取得。order by が無ければ $id カーソル、ある場合は offset。
        const useIdPaging = !hasOrderBy;
        const allRecords = [];
        let offset = hasOffset ? userOffset ?? 0 : 0;
        let lastIdCursor = 0;

        while (true) {
            const paginatedQuery = useIdPaging
                ? buildIdQuery(cleanQuery, lastIdCursor, DEFAULT_PAGE_LIMIT)
                : buildOffsetQuery(cleanQuery, DEFAULT_PAGE_LIMIT, offset);

            const params = { ...baseParams, query: paginatedQuery };
            const response = await this.executeWithDetailedLogging(
                'searchRecords',
                params,
                () => this.client.record.getRecords(params),
                `search records ${appId}${useIdPaging ? ` (id>${lastIdCursor})` : ` (offset ${offset})`}`
            );

            const records = response.records || [];
            allRecords.push(...mapRecords(appId, records));

            if (records.length < DEFAULT_PAGE_LIMIT) {
                break;
            }

            if (useIdPaging) {
                const lastRecordId = extractLastId(records);
                if (lastRecordId === null) {
                    throw new Error('$id フィールドを取得できなかったためページングを継続できません。fields に $id を含めてください。');
                }
                lastIdCursor = lastRecordId;
            } else {
                offset += DEFAULT_PAGE_LIMIT;
            }
        }

        return allRecords;
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

    async getRecordAcl(appId, recordId) {
        const params = { app: appId, id: recordId };
        return this.executeWithDetailedLogging(
            'getRecordAcl',
            params,
            () => this.client.app.getRecordAcl(params),
            `get record ACL ${appId}/${recordId}`
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
            totalCount: response.totalCount,
            older: response.older,
            newer: response.newer
        }));
    }

    // コメント編集APIは存在しないため、実装しない（ツール側からも非公開）

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
        const response = await this.executeWithDetailedLogging(
            'upsertRecord',
            params,
            () => this.client.record.upsertRecord(params),
            `upsert record in app ${appId} with key ${updateKey.field}=${updateKey.value}`
        );
        return response;
    }

    async upsertRecords(appId, records) {
        const params = {
            app: appId,
            records: records.map((entry) => ({
                updateKey: entry.updateKey,
                record: entry.fields
            }))
        };

        return this.executeWithDetailedLogging(
            'upsertRecords',
            params,
            () => this.client.record.upsertRecords(params),
            `upsert multiple records in app ${appId}`
        );
    }
}

function normalizeQuery(rawQuery) {
    const query = (rawQuery || '').trim();
    if (!query) {
        return {
            cleanQuery: '',
            userLimit: null,
            userOffset: null,
            hasLimit: false,
            hasOffset: false,
            hasOrderBy: false
        };
    }

    const limitMatch = query.match(LIMIT_REGEX);
    const hasLimit = Boolean(limitMatch);
    const userLimit = hasLimit ? Number(limitMatch[1]) : null;

    const offsetMatch = query.match(OFFSET_REGEX);
    const hasOffset = Boolean(offsetMatch);
    const userOffset = hasOffset ? Number(offsetMatch[1]) : null;

    let cleanQuery = query;
    if (hasLimit) {
        cleanQuery = cleanQuery.replace(LIMIT_REGEX, '');
    }
    if (hasOffset) {
        cleanQuery = cleanQuery.replace(OFFSET_REGEX, '');
    }
    cleanQuery = removeTrailingConnectors(cleanQuery).trim().replace(/\s+/g, ' ');

    const hasOrderBy = ORDER_BY_REGEX.test(cleanQuery);

    return { cleanQuery, userLimit, userOffset, hasLimit, hasOffset, hasOrderBy };
}

function normalizeFields(fields) {
    if (!Array.isArray(fields) || fields.length === 0) {
        return [];
    }
    const withId = fields.includes('$id') ? fields : [...fields, '$id'];
    return deduplicateFields(withId);
}

function deduplicateFields(list) {
    const seen = new Set();
    const result = [];
    for (const item of list) {
        if (!seen.has(item)) {
            seen.add(item);
            result.push(item);
        }
    }
    return result;
}

function removeTrailingConnectors(query) {
    let current = query;
    while (TRAILING_CONNECTOR_REGEX.test(current)) {
        current = current.replace(TRAILING_CONNECTOR_REGEX, '').trim();
    }
    return current;
}

function buildOffsetQuery(baseQuery, limit, offset) {
    const core = baseQuery || '$id > 0';
    return `${core} limit ${limit} offset ${offset}`.trim();
}

function buildIdQuery(baseQuery, lastId, limit) {
    const idCondition = `$id > ${lastId}`;
    const core = baseQuery ? `${baseQuery} and ${idCondition}` : idCondition;
    return `${core} order by $id asc limit ${limit}`.trim();
}

function mapRecords(appId, records = []) {
    LoggingUtils.logOperation('Found records', `${records.length} records`);
    return records.map((record) => {
        const recordId = record?.$id?.value || 'unknown';
        return new KintoneRecord(appId, recordId, record);
    });
}

function extractLastId(records = []) {
    if (records.length === 0) return null;
    const last = records[records.length - 1];
    const idVal = last?.$id?.value;
    const num = Number(idVal);
    if (Number.isNaN(num)) {
        return null;
    }
    return num;
}
