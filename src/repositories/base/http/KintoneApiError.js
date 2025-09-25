// src/repositories/base/http/KintoneApiError.js
export class KintoneApiError extends Error {
    constructor(message, { status = null, code = null, errors = null, responseBody = null } = {}) {
        super(message);
        this.name = 'KintoneApiError';
        this.status = status;
        this.code = code;
        this.errors = errors;
        this.responseBody = responseBody;
    }
}
