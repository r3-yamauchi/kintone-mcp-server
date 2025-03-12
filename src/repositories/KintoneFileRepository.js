// src/repositories/KintoneFileRepository.js
import { BaseKintoneRepository } from './base/BaseKintoneRepository.js';

export class KintoneFileRepository extends BaseKintoneRepository {
    async uploadFile(fileName, fileData) {
        try {
            console.error(`Uploading file: ${fileName}`);
            const buffer = Buffer.from(fileData, 'base64');
            const response = await this.client.file.uploadFile({
                file: {
                    name: fileName,
                    data: buffer
                }
            });
            console.error('File upload response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `upload file ${fileName}`);
        }
    }

    async downloadFile(fileKey) {
        try {
            console.error(`Downloading file with key: ${fileKey}`);
            const response = await this.client.file.downloadFile({ fileKey: fileKey });
            console.error('File download response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `download file with key ${fileKey}`);
        }
    }
}
