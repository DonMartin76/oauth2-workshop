'use strict';

const crypto = require('crypto');
const qs = require('querystring');
const path = require('path');
const fs = require('fs');

const settings = require('./settings.json');

const API_BASE = 'https://api.ow.donmartin76.com';
const AUTH_SERVER = API_BASE + '/auth/local/api/markdown-notes';

const scope = 'read_profile read_notes read_index';
const redirect_uri = 'http://localhost:3000/callback';

function createCodeChallenge() {
    return crypto.randomBytes(56).toString('hex');
};

const code_verifier = createCodeChallenge();
const sha256 = crypto.createHash('sha256');
sha256.update(code_verifier);
const code_challenge = sha256.digest('base64');

fs.writeFileSync(path.join(__dirname, 'code_challenge.json'), JSON.stringify({
    code_verifier,
    code_challenge
}, null, 2), 'utf8');

const client_id = settings.client_id;
console.error(`Client ID: ${client_id}`);
console.error(`Code verifier: ${code_verifier}`);
console.error('Auth Server authorize URL:');
console.error('');
console.log(`${AUTH_SERVER}/authorize?response_type=code&client_id=${client_id}&redirect_uri=${qs.escape(redirect_uri)}&scope=${qs.escape(scope)}&code_challenge_method=S256&code_challenge=${qs.escape(code_challenge)}`);
console.error('');
console.error('The code_challenge was stored to "code_challenge.json" in this directory.');
