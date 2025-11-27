// src/server/tools/RecordTools.js
import { KintoneRecord } from '../../models/KintoneRecord.js';
import { ValidationUtils } from '../../utils/ValidationUtils.js';
import { LoggingUtils } from '../../utils/LoggingUtils.js';
import { ResponseBuilder } from '../../utils/ResponseBuilder.js';

// レコード関連のツールを処理する関数
export async function handleRecordTools(name, args, repository) {
    // 共通のツール実行ログ
    LoggingUtils.logToolExecution('record', name, args);
    
    switch (name) {
        case 'get_record': {
            ValidationUtils.validateRequired(args, ['app_id', 'record_id']);
            
            const record = await repository.getRecord(args.app_id, args.record_id);
            return record.fields;  // KintoneRecord ではなく fields を返す
        }
        
        case 'search_records': {
            ValidationUtils.validateRequired(args, ['app_id']);
            
            // クエリーが提供されている場合、kintoneクエリー構文を検証
            if (args.query) {
                ValidationUtils.validateKintoneQuery(args.query);
            }
            
            const records = await repository.searchRecords(
                args.app_id,
                args.query,
                args.fields
            );
            return records.map(r => r.fields);
        }
        
        case 'create_record': {
            ValidationUtils.validateRequired(args, ['app_id', 'fields']);
            ValidationUtils.validateObject(args.fields, 'fields');
            
            const recordId = await repository.createRecord(
                args.app_id,
                args.fields
            );
            return ResponseBuilder.recordCreated(recordId);
        }
        
        case 'update_record': {
            ValidationUtils.validateRequired(args, ['app_id', 'fields']);
            
            // レコードIDまたはupdateKeyのいずれかが必要
            if (!args.record_id && !args.updateKey) {
                throw new Error('record_id または updateKey は必須パラメータです。');
            }
            
            ValidationUtils.validateObject(args.fields, 'fields');
            
            let response;
            if (args.record_id) {
                // レコードIDを使用した更新
                response = await repository.updateRecord(
                    new KintoneRecord(
                        args.app_id,
                        args.record_id,
                        args.fields
                    )
                );
            } else {
                // updateKeyを使用した更新
                response = await repository.updateRecordByKey(
                    args.app_id,
                    args.updateKey.field,
                    args.updateKey.value,
                    args.fields
                );
            }
            
            return ResponseBuilder.recordUpdated(response.revision);
        }
        
        case 'add_record_comment': {
            ValidationUtils.validateRequired(args, ['app_id', 'record_id', 'text']);
            ValidationUtils.validateString(args.text, 'text');
            
            const commentId = await repository.addRecordComment(
                args.app_id,
                args.record_id,
                args.text,
                args.mentions || []
            );
            return ResponseBuilder.withId('comment_id', commentId);
        }
        
        case 'update_record_status': {
            ValidationUtils.validateRequired(args, ['app_id', 'record_id', 'action']);
            ValidationUtils.validateString(args.action, 'action');
            
            const response = await repository.updateRecordStatus(
                args.app_id,
                args.record_id,
                args.action,
                args.assignee
            );
            return ResponseBuilder.withRevision(response.revision);
        }
        
        case 'update_record_assignees': {
            ValidationUtils.validateRequired(args, ['app_id', 'record_id', 'assignees']);
            ValidationUtils.validateArray(args.assignees, 'assignees', {
                maxLength: 100
            });
            
            const response = await repository.updateRecordAssignees(
                args.app_id,
                args.record_id,
                args.assignees
            );
            return ResponseBuilder.withRevision(response.revision);
        }
        
        case 'get_record_comments': {
            ValidationUtils.validateRequired(args, ['app_id', 'record_id']);
            
            const comments = await repository.getRecordComments(
                args.app_id,
                args.record_id,
                args.order || 'desc',
                args.offset || 0,
                args.limit || 10
            );
            return comments;
        }
        
        case 'update_record_comment': {
            throw new Error('kintone REST APIにはコメント編集機能がありません。add_record_comment で新規コメントを追加してください。');
        }
        
        case 'create_records': {
            ValidationUtils.validateRequired(args, ['app_id', 'records']);
            ValidationUtils.validateArray(args.records, 'records', {
                minLength: 1,
                maxLength: 100
            });
            
            const result = await repository.createRecords(args.app_id, args.records);
            return ResponseBuilder.recordsCreated(result.ids, result.revisions);
        }
        
        case 'upsert_record': {
            ValidationUtils.validateRequired(args, ['app_id', 'updateKey', 'fields']);
            ValidationUtils.validateObject(args.updateKey, 'updateKey');
            ValidationUtils.validateString(args.updateKey.field, 'updateKey.field');
            ValidationUtils.validateObject(args.fields, 'fields');

            const result = await repository.upsertRecord(
                args.app_id,
                args.updateKey,
                args.fields
            );

            return {
                record_id: result.id,
                revision: result.revision,
                operation: result.operation
            };
        }

        case 'upsert_records': {
            ValidationUtils.validateRequired(args, ['app_id', 'records']);
            ValidationUtils.validateArray(args.records, 'records', {
                minLength: 1,
                maxLength: 100
            });

            const normalizedRecords = args.records.map((entry, index) => {
                ValidationUtils.validateObject(entry, `records[${index}]`);
                ValidationUtils.validateObject(entry.updateKey, `records[${index}].updateKey`);
                ValidationUtils.validateString(entry.updateKey.field, `records[${index}].updateKey.field`);
                if (entry.updateKey.value === undefined || entry.updateKey.value === null) {
                    throw new Error(`records[${index}].updateKey.value は必須です。`);
                }
                ValidationUtils.validateObject(entry.fields, `records[${index}].fields`);

                return {
                    updateKey: {
                        field: entry.updateKey.field,
                        value: entry.updateKey.value
                    },
                    fields: entry.fields
                };
            });

            const result = await repository.upsertRecords(args.app_id, normalizedRecords);
            return {
                records: result.map((r) => ({
                    record_id: r.id,
                    revision: r.revision,
                    operation: r.operation
                })),
                message: `${result.length}件のレコードをupsertしました`
            };
        }

        default:
            throw new Error(`Unknown record tool: ${name}`);
    }
}
