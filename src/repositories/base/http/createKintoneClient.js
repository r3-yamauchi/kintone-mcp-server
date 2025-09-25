// src/repositories/base/http/createKintoneClient.js
import FormData from 'form-data';
import { KintoneHttpClient } from './KintoneHttpClient.js';

function removePreview(params = {}) {
    const { preview, ...rest } = params;
    return { preview: preview === true, params: rest };
}

export function createKintoneClient(credentials) {
    const http = new KintoneHttpClient(credentials);

    const space = {
        getSpace: (params) => http.get('space', params),
        updateSpace: (params) => http.put('space', params),
        updateSpaceBody: (params) => http.put('space/body', params),
        getSpaceMembers: (params) => http.get('space/members', params),
        updateSpaceMembers: (params) => http.put('space/members', params),
        addThread: (params) => http.post('space/thread', params),
        updateThread: (params) => http.put('space/thread', params),
        addThreadComment: (params) => http.post('space/thread/comment', params),
        updateSpaceGuests: (params) => http.put('space/guests', params),
        addGuests: (params) => http.post('guests', params)
    };

    const app = {
        getApps: (params) => http.get('apps', params),
        addApp: async (params) => {
            const payload = { name: params.name };
            if (params.space) {
                payload.space = params.space;
                if (params.thread) {
                    payload.thread = params.thread;
                } else {
                    const spaceInfo = await space.getSpace({ id: params.space });
                    if (spaceInfo && spaceInfo.defaultThread) {
                        payload.thread = spaceInfo.defaultThread;
                    }
                }
            } else if (params.thread) {
                payload.thread = params.thread;
            }
            return http.post('app', payload, { preview: true });
        },
        deployApp: (params) => http.post('app/deploy', params, { preview: true }),
        getDeployStatus: (params) => http.get('app/deploy', params, { preview: true }),
        getAppSettings: (params = {}) => {
            const { preview, params: rest } = removePreview(params);
            return http.get('app/settings', rest, { preview });
        },
        updateAppSettings: (params) => http.put('app/settings', params, { preview: true }),
        getProcessManagement: (params = {}) => {
            const { preview, params: rest } = removePreview(params);
            return http.get('app/status', rest, { preview });
        },
        updateProcessManagement: (params) => http.put('app/status', params, { preview: true }),
        getFormFields: (params = {}) => {
            const { preview, params: rest } = removePreview(params);
            return http.get('app/form/fields', rest, { preview });
        },
        addFormFields: (params) => http.post('app/form/fields', params, { preview: true }),
        updateFormFields: (params) => http.put('app/form/fields', params, { preview: true }),
        deleteFormFields: (params) => http.delete('app/form/fields', params, { preview: true }),
        getFormLayout: (params = {}) => {
            const { preview, params: rest } = removePreview(params);
            return http.get('app/form/layout', rest, { preview });
        },
        updateFormLayout: (params) => http.put('app/form/layout', params, { preview: true }),
        getViews: (params = {}) => {
            const { preview, params: rest } = removePreview(params);
            return http.get('app/views', rest, { preview });
        },
        updateViews: (params) => http.put('app/views', params, { preview: true }),
        getAppAcl: (params = {}) => {
            const { preview, params: rest } = removePreview(params);
            return http.get('app/acl', rest, { preview });
        },
        updateAppAcl: (params) => http.put('app/acl', params, { preview: true }),
        getFieldAcl: (params = {}) => {
            const { preview, params: rest } = removePreview(params);
            return http.get('field/acl', rest, { preview });
        },
        updateFieldAcl: (params) => http.put('field/acl', params, { preview: true }),
        getAppActions: (params = {}) => {
            const { preview, params: rest } = removePreview(params);
            return http.get('app/actions', rest, { preview });
        },
        updateAppActions: (params) => http.put('app/actions', params, { preview: true }),
        getPlugins: (params = {}) => {
            const { preview, params: rest } = removePreview(params);
            return http.get('app/plugins', rest, { preview });
        },
        updatePlugins: (params) => http.put('app/plugins', params, { preview: true }),
        getReports: (params = {}) => {
            const { preview, params: rest } = removePreview(params);
            return http.get('app/reports', rest, { preview });
        },
        updateReports: (params) => http.put('app/reports', params, { preview: true }),
        getGeneralNotifications: (params = {}) => {
            const { preview, params: rest } = removePreview(params);
            return http.get('app/notifications/general', rest, { preview });
        },
        updateGeneralNotifications: (params) => http.put('app/notifications/general', params, { preview: true }),
        getPerRecordNotifications: (params = {}) => {
            const { preview, params: rest } = removePreview(params);
            return http.get('app/notifications/perRecord', rest, { preview });
        },
        updatePerRecordNotifications: (params) => http.put('app/notifications/perRecord', params, { preview: true }),
        getReminderNotifications: (params = {}) => {
            const { preview, params: rest } = removePreview(params);
            return http.get('app/notifications/reminder', rest, { preview });
        },
        updateReminderNotifications: (params) => http.put('app/notifications/reminder', params, { preview: true }),
        getAppCustomize: (params = {}) => {
            const { preview, params: rest } = removePreview(params);
            return http.get('app/customize', rest, { preview });
        },
        updateAppCustomize: (params) => http.put('app/customize', params, { preview: true }),
        getRecordAcl: (params = {}) => {
            const { preview, params: rest } = removePreview(params);
            return http.get('record/acl', rest, { preview });
        },
        evaluateRecordsAcl: (params) => http.get('records/acl/evaluate', params),
        move: (params) => http.post('app/move', params)
    };

    const record = {
        getRecord: (params) => http.get('record', params),
        addRecord: (params) => http.post('record', params),
        updateRecord: (params) => http.put('record', params),
        updateRecordByUpdateKey: (params) => http.put('record', params),
        getRecords: (params) => http.get('records', params),
        addRecords: (params) => http.post('records', params),
        updateRecords: (params) => http.put('records', params),
        upsertRecord: async (params) => {
            const { app: appId, updateKey, record: recordData } = params;
            const response = await http.put('records', {
                app: appId,
                upsert: true,
                records: [
                    {
                        updateKey,
                        record: recordData
                    }
                ]
            });

            if (!response || !Array.isArray(response.records) || response.records.length === 0) {
                throw new Error('Unexpected response format from records upsert operation.');
            }

            const result = response.records[0];
            return {
                id: result.id,
                revision: result.revision,
                operation: result.operation
            };
        },
        upsertRecords: async (params) => {
            const { app: appId, records } = params;
            if (!Array.isArray(records) || records.length === 0) {
                throw new Error('records must be a non-empty array when calling upsertRecords.');
            }

            const formattedRecords = records.map((entry) => ({
                updateKey: entry.updateKey,
                record: entry.record
            }));

            const response = await http.put('records', {
                app: appId,
                upsert: true,
                records: formattedRecords
            });

            if (!response || !Array.isArray(response.records) || response.records.length === 0) {
                throw new Error('Unexpected response format from records upsert operation.');
            }

            return response.records.map((recordResult) => ({
                id: recordResult.id,
                revision: recordResult.revision,
                operation: recordResult.operation
            }));
        },
        addRecordComment: (params) => http.post('record/comment', params),
        getRecordComments: (params) => http.get('record/comments', params),
        updateRecordComment: (params) => http.put('record/comment', params),
        updateRecordStatus: (params) => http.put('record/status', params),
        updateRecordAssignees: (params) => http.put('record/assignees', params)
    };

    const file = {
        uploadFile: async (params) => {
            const form = new FormData();
            form.append('file', params.file.data, {
                filename: params.file.name
            });
            return http.post('file', form);
        },
        downloadFile: async (params) => {
            const response = await http.get('file', params, {
                responseType: 'arraybuffer',
                rawResponse: true
            });
            const contentType = response.headers['content-type'] || response.headers['Content-Type'];
            return {
                data: response.data,
                contentType
            };
        }
    };

    return { app, record, space, file };
}
