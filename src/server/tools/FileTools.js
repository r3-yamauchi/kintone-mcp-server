// src/server/tools/FileTools.js
import { ValidationUtils } from '../../utils/ValidationUtils.js';
import { LoggingUtils } from '../../utils/LoggingUtils.js';
import { ResponseBuilder } from '../../utils/ResponseBuilder.js';

/**
 * ファイル関連のツールを処理する関数
 * @param {string} name ツール名
 * @param {Object} args 引数
 * @param {Object} repository リポジトリオブジェクト
 * @returns {Promise<Object>} ツールの実行結果
 */
export async function handleFileTools(name, args, repository) {
    // 共通のツール実行ログ
    LoggingUtils.logToolExecution('file', name, args);
    
    switch (name) {
        case 'upload_file': {
            ValidationUtils.validateRequired(args, ['file_name', 'file_data']);
            ValidationUtils.validateString(args.file_name, 'file_name');
            ValidationUtils.validateString(args.file_data, 'file_data');
            
            LoggingUtils.logDetailedOperation('upload_file', 'ファイルアップロード開始', { fileName: args.file_name });
            
            const uploadResponse = await repository.uploadFile(
                args.file_name,
                args.file_data
            );
            
            LoggingUtils.logDetailedOperation('upload_file', 'ファイルアップロード完了', { fileKey: uploadResponse.fileKey });
            
            return ResponseBuilder.withId('file_key', uploadResponse.fileKey);
        }
        
        case 'download_file': {
            ValidationUtils.validateRequired(args, ['file_key']);
            ValidationUtils.validateString(args.file_key, 'file_key');
            
            LoggingUtils.logDetailedOperation('download_file', 'ファイルダウンロード開始', { fileKey: args.file_key });
            
            const fileData = await repository.downloadFile(
                args.file_key
            );
            
            LoggingUtils.logDetailedOperation('download_file', 'ファイルダウンロード完了', { 
                fileKey: args.file_key,
                mimeType: fileData.contentType || 'application/octet-stream'
            });
            
            // MCPプロトコルに準拠したレスポンス形式
            return {
                uri: `file://${args.file_key}`,
                mimeType: fileData.contentType || 'application/octet-stream',
                blob: Buffer.from(fileData.data || fileData).toString('base64')
            };
        }
        
        default:
            throw new Error(`Unknown file tool: ${name}`);
    }
}
