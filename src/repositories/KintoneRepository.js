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

    async getRecordAcl(appId, recordId) {
        return this.appRepo.getRecordAcl(appId, recordId);
    }

    async evaluateRecordsAcl(appId, recordIds) {
        return this.appRepo.evaluateRecordsAcl(appId, recordIds);
    }

    async updateRecordStatus(appId, recordId, action, assignee = null) {
        return this.recordRepo.updateRecordStatus(appId, recordId, action, assignee);
    }

    async updateRecordAssignees(appId, recordId, assignees) {
        return this.recordRepo.updateRecordAssignees(appId, recordId, assignees);
    }

    async getRecordComments(appId, recordId, order = 'desc', offset = 0, limit = 10) {
        return this.recordRepo.getRecordComments(appId, recordId, order, offset, limit);
    }

    async updateRecordComment(appId, recordId, commentId, text, mentions = []) {
        return this.recordRepo.updateRecordComment(appId, recordId, commentId, text, mentions);
    }

    async createRecords(appId, records) {
        return this.recordRepo.createRecords(appId, records);
    }

    async updateRecords(appId, records) {
        return this.recordRepo.updateRecords(appId, records);
    }

    async upsertRecord(appId, updateKey, fields) {
        return this.recordRepo.upsertRecord(appId, updateKey, fields);
    }

    async upsertRecords(appId, records) {
        return this.recordRepo.upsertRecords(appId, records);
    }

    async updateRecordByKey(appId, keyField, keyValue, fields) {
        return this.recordRepo.updateRecordByKey(appId, keyField, keyValue, fields);
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

    // アプリのプロセス管理設定を取得
    async getProcessManagement(appId, preview = false) {
        if (preview) {
            return this.appRepo.previewRepository.getPreviewProcessManagement(appId);
        } else {
            return this.appRepo.getProcessManagement(appId);
        }
    }

    // アプリのプロセス管理設定を更新
    async updateProcessManagement(appId, enable, states, actions, revision = -1) {
        return this.appRepo.updateProcessManagement(appId, enable, states, actions, revision);
    }

    // アプリのビュー設定を取得
    async getViews(appId, preview = false) {
        return this.appRepo.getViews(appId, preview);
    }

    // アプリのビュー設定を更新
    async updateViews(appId, views, revision = -1) {
        return this.appRepo.updateViews(appId, views, revision);
    }

    // アプリのアクセス権限を取得
    async getAppAcl(appId, preview = false) {
        return this.appRepo.getAppAcl(appId, preview);
    }

    // フィールドのアクセス権限を取得
    async getFieldAcl(appId, preview = false) {
        return this.appRepo.getFieldAcl(appId, preview);
    }

    // フィールドのアクセス権限を更新
    async updateFieldAcl(appId, rights, revision = -1) {
        return this.appRepo.updateFieldAcl(appId, rights, revision);
    }

    // グラフ設定を取得
    async getReports(appId, preview = false) {
        return this.appRepo.getReports(appId, preview);
    }

    // グラフ設定を更新
    async updateReports(appId, reports, revision = -1) {
        return this.appRepo.updateReports(appId, reports, revision);
    }

    // 通知条件設定を取得
    async getNotifications(appId, preview = false) {
        return this.appRepo.getNotifications(appId, preview);
    }

    // 通知条件設定を更新
    async updateNotifications(appId, notifications, revision = -1) {
        return this.appRepo.updateNotifications(appId, notifications, revision);
    }

    // レコード単位の通知設定を取得
    async getPerRecordNotifications(appId, preview = false) {
        return this.appRepo.getPerRecordNotifications(appId, preview);
    }

    // レコード単位の通知設定を更新
    async updatePerRecordNotifications(appId, notifications, revision = -1) {
        return this.appRepo.updatePerRecordNotifications(appId, notifications, revision);
    }

    // リマインダー通知設定を取得
    async getReminderNotifications(appId, preview = false) {
        return this.appRepo.getReminderNotifications(appId, preview);
    }

    // リマインダー通知設定を更新
    async updateReminderNotifications(appId, notifications, revision = -1) {
        return this.appRepo.updateReminderNotifications(appId, notifications, revision);
    }

    // アプリアクション設定を更新
    async updateAppActions(appId, actions, revision = -1) {
        return this.appRepo.updateAppActions(appId, actions, revision);
    }

    // プラグイン設定を更新
    async updatePlugins(appId, plugins, revision = -1) {
        return this.appRepo.updatePlugins(appId, plugins, revision);
    }

    // JavaScript/CSSカスタマイズ設定を取得
    async getAppCustomize(appId, preview = false) {
        return this.appRepo.getAppCustomize(appId, preview);
    }

    // JavaScript/CSSカスタマイズ設定を更新
    async updateAppCustomize(appId, scope, desktop, mobile, revision = -1) {
        return this.appRepo.updateAppCustomize(appId, scope, desktop, mobile, revision);
    }

    // アプリのアクセス権限を更新
    async updateAppAcl(appId, rights, revision = -1) {
        return this.appRepo.updateAppAcl(appId, rights, revision);
    }
}
