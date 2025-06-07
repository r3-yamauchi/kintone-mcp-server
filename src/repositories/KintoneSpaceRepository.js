// src/repositories/KintoneSpaceRepository.js
import { BaseKintoneRepository } from './base/BaseKintoneRepository.js';
import { LoggingUtils } from '../utils/LoggingUtils.js';
import { ResponseBuilder } from '../utils/ResponseBuilder.js';

export class KintoneSpaceRepository extends BaseKintoneRepository {
    async getSpace(spaceId) {
        try {
            LoggingUtils.logDetailedOperation('getSpace', 'スペース情報取得', { spaceId });
            const response = await this.client.space.getSpace({ id: spaceId });
            LoggingUtils.logDetailedOperation('getSpace', 'スペース情報取得完了', { spaceId });
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get space ${spaceId}`);
        }
    }

    async updateSpace(spaceId, settings) {
        try {
            LoggingUtils.logDetailedOperation('updateSpace', 'スペース情報更新', { spaceId, settings });
            await this.client.space.updateSpace({
                id: spaceId,
                ...settings
            });
            LoggingUtils.logDetailedOperation('updateSpace', 'スペース情報更新完了', { spaceId });
        } catch (error) {
            this.handleKintoneError(error, `update space ${spaceId}`);
        }
    }

    async updateSpaceBody(spaceId, body) {
        try {
            LoggingUtils.logDetailedOperation('updateSpaceBody', 'スペース本文更新', { spaceId, bodyLength: body.length });
            await this.client.space.updateSpaceBody({
                id: spaceId,
                body: body
            });
            LoggingUtils.logDetailedOperation('updateSpaceBody', 'スペース本文更新完了', { spaceId });
        } catch (error) {
            this.handleKintoneError(error, `update space body ${spaceId}`);
        }
    }

    async getSpaceMembers(spaceId) {
        try {
            LoggingUtils.logDetailedOperation('getSpaceMembers', 'スペースメンバー取得', { spaceId });
            const response = await this.client.space.getSpaceMembers({ id: spaceId });
            LoggingUtils.logDetailedOperation('getSpaceMembers', 'スペースメンバー取得完了', { 
                spaceId, 
                memberCount: response.members ? response.members.length : 0 
            });
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get space members ${spaceId}`);
        }
    }

    async updateSpaceMembers(spaceId, members) {
        try {
            LoggingUtils.logDetailedOperation('updateSpaceMembers', 'スペースメンバー更新', { 
                spaceId, 
                memberCount: members.length 
            });
            await this.client.space.updateSpaceMembers({
                id: spaceId,
                members: members
            });
            LoggingUtils.logDetailedOperation('updateSpaceMembers', 'スペースメンバー更新完了', { spaceId });
        } catch (error) {
            this.handleKintoneError(error, `update space members ${spaceId}`);
        }
    }

    async addThread(spaceId, name) {
        try {
            LoggingUtils.logDetailedOperation('addThread', 'スレッド作成', { spaceId, threadName: name });
            const response = await this.client.space.addThread({
                space: spaceId,
                name: name
            });
            LoggingUtils.logDetailedOperation('addThread', 'スレッド作成完了', { 
                spaceId, 
                threadId: response.id 
            });
            return response;
        } catch (error) {
            this.handleKintoneError(error, `add thread to space ${spaceId}`);
        }
    }

    async updateThread(threadId, params) {
        try {
            LoggingUtils.logDetailedOperation('updateThread', 'スレッド更新', { threadId, params });
            await this.client.space.updateThread({
                id: threadId,
                ...params
            });
            LoggingUtils.logDetailedOperation('updateThread', 'スレッド更新完了', { threadId });
        } catch (error) {
            this.handleKintoneError(error, `update thread ${threadId}`);
        }
    }

    async addThreadComment(spaceId, threadId, comment) {
        try {
            LoggingUtils.logDetailedOperation('addThreadComment', 'コメント追加', { 
                spaceId, 
                threadId, 
                commentLength: comment.text ? comment.text.length : 0 
            });
            const response = await this.client.space.addThreadComment({
                space: spaceId,
                thread: threadId,
                comment: comment
            });
            LoggingUtils.logDetailedOperation('addThreadComment', 'コメント追加完了', { 
                commentId: response.id 
            });
            return response;
        } catch (error) {
            this.handleKintoneError(error, `add comment to thread ${threadId}`);
        }
    }

    async updateSpaceGuests(spaceId, guests) {
        try {
            LoggingUtils.logDetailedOperation('updateSpaceGuests', 'スペースゲスト更新', { 
                spaceId, 
                guestCount: guests.length 
            });
            await this.client.space.updateSpaceGuests({
                id: spaceId,
                guests: guests
            });
            LoggingUtils.logDetailedOperation('updateSpaceGuests', 'スペースゲスト更新完了', { spaceId });
        } catch (error) {
            this.handleKintoneError(error, `update space guests ${spaceId}`);
        }
    }
}
