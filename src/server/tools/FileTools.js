// src/server/tools/FileTools.js

/**
 * ファイル関連のツールを処理する関数
 * @param {string} name ツール名
 * @param {Object} args 引数
 * @param {Object} repository リポジトリオブジェクト
 * @returns {Promise<Object>} ツールの実行結果
 */
export async function handleFileTools(name, args, repository) {
    switch (name) {
        case 'upload_file': {
            const uploadResponse = await repository.uploadFile(
                args.file_name,
                args.file_data
            );
            return { file_key: uploadResponse.fileKey };
        }
        
        case 'download_file': {
            const fileData = await repository.downloadFile(
                args.file_key
            );
            
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
