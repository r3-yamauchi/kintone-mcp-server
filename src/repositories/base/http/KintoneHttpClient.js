// src/repositories/base/http/KintoneHttpClient.js
import axios from 'axios';
import FormData from 'form-data';
import { KintoneApiError } from './KintoneApiError.js';

const DEFAULT_TIMEOUT_MS = 60000;

function buildPath({ endpointName, guestSpaceId, preview = false }) {
    const guestPath = guestSpaceId !== undefined && guestSpaceId !== null
        ? `/guest/${guestSpaceId}`
        : '';
    const previewPath = preview ? '/preview' : '';
    return `/k${guestPath}/v1${previewPath}/${endpointName}.json`;
}

function isFormData(value) {
    return value instanceof FormData;
}

function stripUndefined(value) {
    if (value === null || value === undefined) {
        return undefined;
    }
    if (Array.isArray(value)) {
        return value.map(stripUndefined);
    }
    if (typeof value === 'object' && !isFormData(value) && !(value instanceof Date) && !(value instanceof Buffer)) {
        const result = {};
        for (const [key, entry] of Object.entries(value)) {
            if (entry !== undefined) {
                const cleaned = stripUndefined(entry);
                if (cleaned !== undefined) {
                    result[key] = cleaned;
                }
            }
        }
        return result;
    }
    return value;
}

export class KintoneHttpClient {
    constructor(credentials) {
        this.credentials = credentials;
        this.baseUrl = `https://${credentials.domain}`;
        this.authHeader = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
        this.axios = axios.create({
            baseURL: this.baseUrl,
            timeout: DEFAULT_TIMEOUT_MS
        });
    }

    getDefaultHeaders() {
        return {
            'X-Cybozu-Authorization': this.authHeader,
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        };
    }

    async request(method, endpointName, { params, data, preview = false, headers = {}, responseType, rawResponse = false } = {}) {
        const url = buildPath({
            endpointName,
            guestSpaceId: this.credentials.guestSpaceId,
            preview
        });

        const config = {
            method,
            url,
            params: params ? stripUndefined(params) : undefined,
            data: undefined,
            responseType: responseType || 'json',
            headers: {
                ...this.getDefaultHeaders(),
                ...headers
            }
        };

        if (data !== undefined) {
            if (isFormData(data)) {
                config.data = data;
                config.headers = {
                    ...config.headers,
                    ...data.getHeaders()
                };
            } else {
                config.data = stripUndefined(data);
                if (!config.headers['Content-Type']) {
                    config.headers['Content-Type'] = 'application/json';
                }
            }
        }

        try {
            const response = await this.axios.request(config);
            return rawResponse ? response : response.data;
        } catch (error) {
            if (error.response) {
                const { status, data: body } = error.response;
                const message = body?.message || `kintone API request failed with status ${status}`;
                throw new KintoneApiError(message, {
                    status,
                    code: body?.code,
                    errors: body?.errors,
                    responseBody: body
                });
            }
            if (error.request) {
                throw new KintoneApiError('kintone API request failed without response', {
                    status: null,
                    responseBody: null
                });
            }
            if (error instanceof KintoneApiError) {
                throw error;
            }
            throw new KintoneApiError(error.message);
        }
    }

    get(endpointName, params, options = {}) {
        return this.request('get', endpointName, { ...options, params });
    }

    post(endpointName, data, options = {}) {
        return this.request('post', endpointName, { ...options, data });
    }

    put(endpointName, data, options = {}) {
        return this.request('put', endpointName, { ...options, data });
    }

    delete(endpointName, data, options = {}) {
        return this.request('delete', endpointName, { ...options, data });
    }
}
