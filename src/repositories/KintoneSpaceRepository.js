// src/repositories/KintoneSpaceRepository.js
import { BaseKintoneRepository } from './base/BaseKintoneRepository.js';

export class KintoneSpaceRepository extends BaseKintoneRepository {
    async getSpace(spaceId) {
        try {
            console.error(`Fetching space: ${spaceId}`);
            const response = await this.client.space.getSpace({ id: spaceId });
            console.error('Response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get space ${spaceId}`);
        }
    }

    async updateSpace(spaceId, settings) {
        try {
            console.error(`Updating space: ${spaceId}`);
            await this.client.space.updateSpace({
                id: spaceId,
                ...settings
            });
        } catch (error) {
            this.handleKintoneError(error, `update space ${spaceId}`);
        }
    }

    async updateSpaceBody(spaceId, body) {
        try {
            console.error(`Updating space body: ${spaceId}`);
            await this.client.space.updateSpaceBody({
                id: spaceId,
                body: body
            });
        } catch (error) {
            this.handleKintoneError(error, `update space body ${spaceId}`);
        }
    }

    async getSpaceMembers(spaceId) {
        try {
            console.error(`Fetching space members: ${spaceId}`);
            const response = await this.client.space.getSpaceMembers({ id: spaceId });
            console.error('Response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get space members ${spaceId}`);
        }
    }

    async updateSpaceMembers(spaceId, members) {
        try {
            console.error(`Updating space members: ${spaceId}`);
            await this.client.space.updateSpaceMembers({
                id: spaceId,
                members: members
            });
        } catch (error) {
            this.handleKintoneError(error, `update space members ${spaceId}`);
        }
    }

    async addThread(spaceId, name) {
        try {
            console.error(`Adding thread to space: ${spaceId}`);
            const response = await this.client.space.addThread({
                space: spaceId,
                name: name
            });
            console.error('Response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `add thread to space ${spaceId}`);
        }
    }

    async updateThread(threadId, params) {
        try {
            console.error(`Updating thread: ${threadId}`);
            await this.client.space.updateThread({
                id: threadId,
                ...params
            });
        } catch (error) {
            this.handleKintoneError(error, `update thread ${threadId}`);
        }
    }

    async addThreadComment(spaceId, threadId, comment) {
        try {
            console.error(`Adding comment to thread: ${threadId}`);
            const response = await this.client.space.addThreadComment({
                space: spaceId,
                thread: threadId,
                comment: comment
            });
            console.error('Response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `add comment to thread ${threadId}`);
        }
    }

    async updateSpaceGuests(spaceId, guests) {
        try {
            console.error(`Updating space guests: ${spaceId}`);
            await this.client.space.updateSpaceGuests({
                id: spaceId,
                guests: guests
            });
        } catch (error) {
            this.handleKintoneError(error, `update space guests ${spaceId}`);
        }
    }
}
