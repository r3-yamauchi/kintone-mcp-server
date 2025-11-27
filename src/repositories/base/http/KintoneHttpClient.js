// src/repositories/base/http/KintoneHttpClient.js
import { KintoneApiError } from './KintoneApiError.js';

const DEFAULT_TIMEOUT_MS = 60000;

function buildPath({ endpointName, guestSpaceId, preview = false }) {
    const guestPath = guestSpaceId !== undefined && guestSpaceId !== null
        ? `/guest/${guestSpaceId}`
        : '';
    const previewPath = preview ? '/preview' : '';
    return `/k${guestPath}/v1${previewPath}/${endpointName}.json`;
}

const FORM_DATA_SUPPORTED = typeof FormData !== 'undefined';

function isFormData(value) {
    return FORM_DATA_SUPPORTED && value instanceof FormData;
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
    }

    getDefaultHeaders() {
        return {
            'X-Cybozu-Authorization': this.authHeader,
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        };
    }

    async request(method, endpointName, { params, data, preview = false, headers = {}, responseType, rawResponse = false } = {}) {
        const path = buildPath({
            endpointName,
            guestSpaceId: this.credentials.guestSpaceId,
            preview
        });
        const url = new URL(path, this.baseUrl);

        const requestHeaders = new Headers(this.getDefaultHeaders());
        for (const [key, value] of Object.entries(headers)) {
            if (value !== undefined && value !== null) {
                requestHeaders.set(key, String(value));
            }
        }

        const originalMethod = method.toUpperCase();
        const useOverride = originalMethod !== 'POST';
        const init = {
            method: 'POST',
            headers: requestHeaders,
            signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS)
        };

        if (useOverride) {
            requestHeaders.set('X-HTTP-Method-Override', originalMethod);
        }

        const expectedResponseType = responseType || 'json';

        // kintone の method override では GET/PUT/DELETE も POST ボディにパラメータを含める
        const payloadSource = data !== undefined ? data : params;

        if (payloadSource !== undefined) {
            if (isFormData(payloadSource)) {
                // fetchがboundary付きヘッダーを自動付与するため、Content-Typeは削除
                requestHeaders.delete('Content-Type');
                init.body = payloadSource;
            } else {
                const payload = stripUndefined(payloadSource);
                init.body = JSON.stringify(payload);
                if (!requestHeaders.has('Content-Type')) {
                    requestHeaders.set('Content-Type', 'application/json');
                }
            }
        }

        let response;
        try {
            response = await fetch(url, init);
        } catch (error) {
            if (error instanceof KintoneApiError) {
                throw error;
            }
            const isAbortError = error?.name === 'AbortError';
            throw new KintoneApiError(
                isAbortError ? 'kintone API request timed out' : 'kintone API request failed without response',
                {
                    status: null,
                    responseBody: null
                }
            );
        }

        const parseErrorBody = async () => {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                try {
                    return await response.json();
                } catch (parseError) {
                    return null;
                }
            }
            try {
                return await response.text();
            } catch (parseError) {
                return null;
            }
        };

        if (!response.ok) {
            const body = await parseErrorBody();
            const message = typeof body === 'object' && body?.message
                ? body.message
                : `kintone API request failed with status ${response.status}`;

            throw new KintoneApiError(message, {
                status: response.status,
                code: typeof body === 'object' ? body?.code : undefined,
                errors: typeof body === 'object' ? body?.errors : undefined,
                responseBody: body
            });
        }

        if (rawResponse) {
            const dataBuffer = expectedResponseType === 'arraybuffer'
                ? Buffer.from(await response.arrayBuffer())
                : await response.text();
            return {
                data: dataBuffer,
                headers: Object.fromEntries(response.headers.entries()),
                status: response.status
            };
        }

        if (expectedResponseType === 'arraybuffer') {
            return Buffer.from(await response.arrayBuffer());
        }

        if (expectedResponseType === 'text') {
            return await response.text();
        }

        if (response.status === 204) {
            return null;
        }

        const text = await response.text();
        if (!text) {
            return {};
        }

        try {
            return JSON.parse(text);
        } catch (error) {
            throw new KintoneApiError('kintone API returned invalid JSON response', {
                status: response.status,
                responseBody: text
            });
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
