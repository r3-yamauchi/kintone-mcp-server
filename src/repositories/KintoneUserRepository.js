// src/repositories/KintoneUserRepository.js
import { BaseKintoneRepository } from './base/BaseKintoneRepository.js';
import { LoggingUtils } from '../utils/LoggingUtils.js';

export class KintoneUserRepository extends BaseKintoneRepository {
    /**
     * kintone User APIを直接呼び出すヘルパーメソッド
     * @param {string} path - APIパス（例: '/v1/users.json'）
     * @param {Object} params - リクエストパラメータ
     * @returns {Promise<Object>} APIレスポンス
     */
    async callUserApi(path, params = {}) {
        // User APIのエンドポイントを構築
        const baseUrl = `https://${this.credentials.domain}`;
        const url = new URL(path, baseUrl);
        
        // kintone/cybozu.com共通管理APIの認証ヘッダー
        // X-Cybozu-Authorization: {base64(username:password)} の形式
        const auth = Buffer.from(`${this.credentials.username}:${this.credentials.password}`).toString('base64');
        const headers = {
            'X-Cybozu-Authorization': auth,
            'X-HTTP-Method-Override': 'GET',  // GETメソッドのオーバーライド
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        // リクエストボディを構築
        const body = JSON.stringify(params);

        LoggingUtils.logDetailedOperation('callUserApi', 'User API呼び出し', {
            url: url.toString(),
            method: 'POST (Override: GET)',
            bodyParams: params
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',  // POSTメソッドを使用
                headers: headers,
                body: body  // パラメータはボディに含める
            });

            const responseText = await response.text();
            
            if (!response.ok) {
                LoggingUtils.logError('callUserApi', new Error(`Status: ${response.status}, Body: ${responseText}`));
                
                // エラーコードに基づいた詳細なエラーメッセージ
                let errorMessage = `User API Error: ${response.status}`;
                try {
                    const errorData = JSON.parse(responseText);
                    if (errorData.code === 'CB_IL02') {
                        errorMessage = `User APIアクセスエラー: 無効なリクエストです。\n\n` +
                            `考えられる原因:\n` +
                            `1. cybozu.com共通管理の権限が不足している可能性があります\n` +
                            `2. User APIへのアクセスが許可されていない可能性があります\n` +
                            `3. 認証情報に問題がある可能性があります\n\n` +
                            `対処法:\n` +
                            `- cybozu.com共通管理者権限を持つユーザーアカウントを使用してください\n` +
                            `- またはAPIトークンを使用した認証を検討してください`;
                    } else {
                        errorMessage += ` - ${errorData.message || responseText}`;
                    }
                } catch (e) {
                    errorMessage += ` - ${responseText}`;
                }
                
                throw new Error(errorMessage);
            }

            // JSONパース
            try {
                const jsonResponse = JSON.parse(responseText);
                LoggingUtils.logDetailedOperation('callUserApi', 'User API応答', {
                    status: response.status,
                    dataReceived: true
                });
                return jsonResponse;
            } catch (parseError) {
                LoggingUtils.logError('callUserApi', parseError);
                throw new Error(`Failed to parse User API response: ${responseText}`);
            }
        } catch (error) {
            if (error.message.includes('User API Error')) {
                throw error;
            }
            LoggingUtils.logError('callUserApi', error);
            throw new Error(`Failed to call User API: ${error.message}`);
        }
    }
    async addGuests(guests) {
        try {
            LoggingUtils.logDetailedOperation('addGuests', 'ゲスト追加', { guestCount: guests.length });
            await this.client.space.addGuests({ guests });
            LoggingUtils.logDetailedOperation('addGuests', 'ゲスト追加完了', { guestCount: guests.length });
        } catch (error) {
            this.handleKintoneError(error, 'add guests');
        }
    }

    async getUsers(codes = []) {
        try {
            LoggingUtils.logDetailedOperation('getUsers', 'ユーザー情報取得', { 
                requestedCodes: codes.length > 0 ? codes : 'all' 
            });
            
            const params = {};
            if (codes && codes.length > 0) {
                params.codes = codes;
            }
            
            // User API /v1/users.json を直接呼び出し
            const response = await this.callUserApi('/v1/users.json', params);
            
            LoggingUtils.logDetailedOperation('getUsers', 'ユーザー情報取得完了', { 
                userCount: response.users ? response.users.length : 0 
            });
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get users information`);
        }
    }

    async getGroups(codes = []) {
        try {
            LoggingUtils.logDetailedOperation('getGroups', 'グループ情報取得', { 
                requestedCodes: codes.length > 0 ? codes : 'all' 
            });
            
            const params = {};
            if (codes && codes.length > 0) {
                params.codes = codes;
            }
            
            // User API /v1/groups.json を直接呼び出し
            const response = await this.callUserApi('/v1/groups.json', params);
            
            LoggingUtils.logDetailedOperation('getGroups', 'グループ情報取得完了', { 
                groupCount: response.groups ? response.groups.length : 0 
            });
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get groups information`);
        }
    }

    async getGroupUsers(groupCode) {
        try {
            LoggingUtils.logDetailedOperation('getGroupUsers', 'グループユーザー取得', { groupCode });
            
            // User API /v1/groups/users.json を呼び出し
            // パラメータとしてcodeを渡す
            const params = {
                code: groupCode
            };
            const response = await this.callUserApi('/v1/group/users.json', params);
            
            LoggingUtils.logDetailedOperation('getGroupUsers', 'グループユーザー取得完了', { 
                groupCode,
                userCount: response.users ? response.users.length : 0 
            });
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get users in group ${groupCode}`);
        }
    }
}
