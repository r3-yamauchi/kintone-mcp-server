// src/repositories/KintoneRepository.js
import { KintoneRecordRepository } from './KintoneRecordRepository.js';
import { KintoneAppRepository } from './KintoneAppRepository.js';
import { KintoneFileRepository } from './KintoneFileRepository.js';
import { KintoneSpaceRepository } from './KintoneSpaceRepository.js';
import { KintoneUserRepository } from './KintoneUserRepository.js';

export class KintoneRepository {
    constructor(credentials) {
        this.credentials = credentials;
        
        // 各専門リポジトリのインスタンスを作成
        this.recordRepo = new KintoneRecordRepository(credentials);
        this.appRepo = new KintoneAppRepository(credentials);
        this.fileRepo = new KintoneFileRepository(credentials);
        this.spaceRepo = new KintoneSpaceRepository(credentials);
        this.userRepo = new KintoneUserRepository(credentials);
    }

    // プレビュー環境のアプリ設定を取得
    async getPreviewAppSettings(appId, lang) {
        return this.appRepo.getPreviewAppSettings(appId, lang);
    }

    // プレビュー環境のフォームフィールド情報を取得
    async getPreviewFormFields(appId, lang) {
        return this.appRepo.getPreviewFormFields(appId, lang);
    }

    // プレビュー環境のフォームレイアウト情報を取得
    async getPreviewFormLayout(appId) {
        return this.appRepo.getPreviewFormLayout(appId);
    }

    // レコード関連
    async getRecord(appId, recordId) {
        return this.recordRepo.getRecord(appId, recordId);
    }

    async searchRecords(appId, query, fields = []) {
        return this.recordRepo.searchRecords(appId, query, fields);
    }

    async createRecord(appId, fields) {
        return this.recordRepo.createRecord(appId, fields);
    }

    async updateRecord(record) {
        return this.recordRepo.updateRecord(record);
    }

    async addRecordComment(appId, recordId, text, mentions = []) {
        return this.recordRepo.addRecordComment(appId, recordId, text, mentions);
    }

    // アプリ関連
    async getAppsInfo(appName) {
        return this.appRepo.getAppsInfo(appName);
    }

    async createApp(name, space = null, thread = null) {
        return this.appRepo.createApp(name, space, thread);
    }

    async addFields(appId, properties) {
        return this.appRepo.addFields(appId, properties);
    }

    async deployApp(apps) {
        return this.appRepo.deployApp(apps);
    }

    async getDeployStatus(apps) {
        return this.appRepo.getDeployStatus(apps);
    }

    async updateAppSettings(appId, settings) {
        return this.appRepo.updateAppSettings(appId, settings);
    }

    async getFormLayout(appId) {
        return this.appRepo.getFormLayout(appId);
    }

    async getFormFields(appId) {
        return this.appRepo.getFormFields(appId);
    }

    async updateFormLayout(appId, layout, revision = -1) {
        return this.appRepo.updateFormLayout(appId, layout, revision);
    }

    async updateFormFields(appId, properties, revision = -1) {
        return this.appRepo.updateFormFields(appId, properties, revision);
    }

    async deleteFormFields(appId, fields, revision = -1) {
        return this.appRepo.deleteFormFields(appId, fields, revision);
    }

    // ファイル関連
    async uploadFile(fileName, fileData) {
        return this.fileRepo.uploadFile(fileName, fileData);
    }

    async downloadFile(fileKey) {
        return this.fileRepo.downloadFile(fileKey);
    }

    // スペース関連
    async getSpace(spaceId) {
        return this.spaceRepo.getSpace(spaceId);
    }

    async updateSpace(spaceId, settings) {
        return this.spaceRepo.updateSpace(spaceId, settings);
    }

    async updateSpaceBody(spaceId, body) {
        return this.spaceRepo.updateSpaceBody(spaceId, body);
    }

    async getSpaceMembers(spaceId) {
        return this.spaceRepo.getSpaceMembers(spaceId);
    }

    async updateSpaceMembers(spaceId, members) {
        return this.spaceRepo.updateSpaceMembers(spaceId, members);
    }

    async addThread(spaceId, name) {
        return this.spaceRepo.addThread(spaceId, name);
    }

    async updateThread(threadId, params) {
        return this.spaceRepo.updateThread(threadId, params);
    }

    async addThreadComment(spaceId, threadId, comment) {
        return this.spaceRepo.addThreadComment(spaceId, threadId, comment);
    }

    async updateSpaceGuests(spaceId, guests) {
        return this.spaceRepo.updateSpaceGuests(spaceId, guests);
    }

    // アプリをスペースに移動させる
    async moveAppToSpace(appId, spaceId) {
        return this.appRepo.moveAppToSpace(appId, spaceId);
    }

    // アプリをスペースに所属させないようにする
    async moveAppFromSpace(appId) {
        return this.appRepo.moveAppFromSpace(appId);
    }

    // ユーザー関連
    async addGuests(guests) {
        return this.userRepo.addGuests(guests);
    }

    async getUsers(codes = []) {
        return this.userRepo.getUsers(codes);
    }

    async getGroups(codes = []) {
        return this.userRepo.getGroups(codes);
    }

    async getGroupUsers(groupCode) {
        return this.userRepo.getGroupUsers(groupCode);
    }
    
    // アプリのアクション設定を取得
    async getAppActions(appId, lang) {
        return this.appRepo.getAppActions(appId, lang);
    }
    
    // アプリのプラグイン一覧を取得
    async getAppPlugins(appId) {
        return this.appRepo.getAppPlugins(appId);
    }
}
