// src/repositories/KintoneUserRepository.js
import { BaseKintoneRepository } from './base/BaseKintoneRepository.js';

export class KintoneUserRepository extends BaseKintoneRepository {
    async addGuests(guests) {
        try {
            console.error(`Adding guests:`, guests);
            await this.client.space.addGuests({ guests });
        } catch (error) {
            this.handleKintoneError(error, 'add guests');
        }
    }

    async getUsers(codes = []) {
        try {
            console.error(`Fetching users information`);
            const params = {};
            if (codes && codes.length > 0) {
                params.codes = codes;
            }
            const response = await this.client.user.getUsers(params);
            console.error('Users response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get users information`);
        }
    }

    async getGroups(codes = []) {
        try {
            console.error(`Fetching groups information`);
            const params = {};
            if (codes && codes.length > 0) {
                params.codes = codes;
            }
            const response = await this.client.user.getGroups(params);
            console.error('Groups response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get groups information`);
        }
    }

    async getGroupUsers(groupCode) {
        try {
            console.error(`Fetching users in group: ${groupCode}`);
            const response = await this.client.user.getGroupUsers({
                code: groupCode
            });
            console.error('Group users response:', response);
            return response;
        } catch (error) {
            this.handleKintoneError(error, `get users in group ${groupCode}`);
        }
    }
}
