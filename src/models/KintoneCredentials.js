// src/models/KintoneCredentials.js
export class KintoneCredentials {
    constructor(domain, username, password) {
        this.domain = domain;
        this.username = username;
        this.password = password;
        this.auth = Buffer.from(`${username}:${password}`).toString('base64');
    }
}
