// src/repositories/KintoneFileRepository.js
import { BaseKintoneRepository } from './base/BaseKintoneRepository.js';
import { LoggingUtils } from '../utils/LoggingUtils.js';

export class KintoneFileRepository extends BaseKintoneRepository {
    async uploadFile(fileName, fileData) {
        try {
            LoggingUtils.logDetailedOperation('uploadFile', 'ファイルアップロード開始', { fileName });
            const buffer = Buffer.from(fileData, 'base64');
            const response = await this.client.file.uploadFile({
                file: {
                    name: fileName,
                    data: buffer
                }
            });
            LoggingUtils.logDetailedOperation('uploadFile', 'ファイルアップロード完了', { 
                fileName,
                fileKey: response.fileKey 
            });
            return response;
        } catch (error) {
            this.handleKintoneError(error, `upload file ${fileName}`);
        }
    }

    async downloadFile(fileKey) {
        try {
            LoggingUtils.logDetailedOperation('downloadFile', 'ファイルダウンロード開始', { fileKey });
            const response = await this.client.file.downloadFile({ fileKey: fileKey });
            LoggingUtils.logDetailedOperation('downloadFile', 'ファイルダウンロード完了', { 
                fileKey,
                contentType: response.contentType || 'unknown' 
            });
            return response;
        } catch (error) {
            this.handleKintoneError(error, `download file with key ${fileKey}`);
        }
    }
}
