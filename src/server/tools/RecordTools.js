// src/server/tools/RecordTools.js
import { KintoneRecord } from '../../models/KintoneRecord.js';

// レコード関連のツールを処理する関数
export async function handleRecordTools(name, args, repository) {
    switch (name) {
        case 'get_record': {
            // 引数のチェック
            if (!args.app_id) {
                throw new Error('app_id は必須パラメータです。');
            }
            if (!args.record_id) {
                throw new Error('record_id は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Fetching record: ${args.app_id}/${args.record_id}`);
            
            const record = await repository.getRecord(args.app_id, args.record_id);
            return record.fields;  // KintoneRecord ではなく fields を返す
        }
        
        case 'search_records': {
            // 引数のチェック
            if (!args.app_id) {
                throw new Error('app_id は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Searching records in app: ${args.app_id}`);
            console.error(`Query: ${args.query || '(none)'}`);
            console.error(`Fields: ${args.fields ? JSON.stringify(args.fields) : '(all)'}`);
            
            const records = await repository.searchRecords(
                args.app_id,
                args.query,
                args.fields
            );
            return records.map(r => r.fields);
        }
        
        case 'create_record': {
            // 引数のチェック
            if (!args.app_id) {
                throw new Error('app_id は必須パラメータです。');
            }
            if (!args.fields) {
                throw new Error('fields は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Creating record in app: ${args.app_id}`);
            console.error(`Fields:`, JSON.stringify(args.fields, null, 2));
            
            // フィールドの検証
            // project_managerフィールドが必須の場合、存在チェック
            if (!args.fields.project_manager) {
                console.error('Warning: project_manager field is missing');
            }
            
            const recordId = await repository.createRecord(
                args.app_id,
                args.fields
            );
            return { record_id: recordId };
        }
        
        case 'update_record': {
            // 引数のチェック
            if (!args.app_id) {
                throw new Error('app_id は必須パラメータです。');
            }
            if (!args.record_id) {
                throw new Error('record_id は必須パラメータです。');
            }
            if (!args.fields) {
                throw new Error('fields は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Updating record: ${args.app_id}/${args.record_id}`);
            console.error(`Fields:`, JSON.stringify(args.fields, null, 2));
            
            const response = await repository.updateRecord(
                new KintoneRecord(
                    args.app_id,
                    args.record_id,
                    args.fields
                )
            );
            return { success: true, revision: response.revision };
        }
        
        case 'add_record_comment': {
            // 引数のチェック
            if (!args.app_id) {
                throw new Error('app_id は必須パラメータです。');
            }
            if (!args.record_id) {
                throw new Error('record_id は必須パラメータです。');
            }
            if (!args.text) {
                throw new Error('text は必須パラメータです。');
            }
            
            // デバッグ用のログ出力
            console.error(`Adding comment to record: ${args.app_id}/${args.record_id}`);
            console.error(`Text: ${args.text}`);
            if (args.mentions && args.mentions.length > 0) {
                console.error(`Mentions:`, JSON.stringify(args.mentions, null, 2));
            }
            
            const commentId = await repository.addRecordComment(
                args.app_id,
                args.record_id,
                args.text,
                args.mentions || []
            );
            return { comment_id: commentId };
        }
        
        default:
            throw new Error(`Unknown record tool: ${name}`);
    }
}
