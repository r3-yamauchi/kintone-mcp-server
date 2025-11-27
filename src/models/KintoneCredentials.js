// src/models/KintoneCredentials.js
function normalizeDomain(rawDomain) {
    if (!rawDomain || typeof rawDomain !== 'string') {
        throw new Error('KINTONE_DOMAIN が不正です。文字列を指定してください。');
    }

    const trimmed = rawDomain.trim();
    const prefixed = trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`;

    let url;
    try {
        url = new URL(prefixed);
    } catch (error) {
        throw new Error('KINTONE_DOMAIN がURLとして解釈できません。http(s)://を含めた形式か、サブドメインのみを指定してください。');
    }

    return {
        host: url.host,           // 例: your-subdomain.cybozu.com や localhost:8000
        origin: `${url.protocol}//${url.host}` // 例: https://your-subdomain.cybozu.com
    };
}

export class KintoneCredentials {
    constructor(domain, username, password) {
        const normalized = normalizeDomain(domain);
        this.domain = normalized.host;
        this.origin = normalized.origin;
        this.username = username;
        this.password = password;
        this.auth = Buffer.from(`${username}:${password}`).toString('base64');
    }
}
