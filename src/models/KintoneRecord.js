// src/models/KintoneRecord.js
export class KintoneRecord {
    constructor(appId, recordId, fields) {
        this.appId = appId;
        this.recordId = recordId;
        this.fields = fields;
    }
}
