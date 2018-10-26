'use strict';

const path = require('path');
const fs = require('fs');
const qs = require('querystring');

const API_BASE = 'https://api.ow.donmartin76.com';
const AUTH_SERVER = API_BASE + '/auth/local/api/markdown-notes';

const settings = require('./settings.json');
const challenge = require('./code_challenge.json');

if (process.argv.length !== 3) {
    console.error('Usage: node make_curl_command.js <code>');
    process.exit(1);
}

const code = process.argv[2];

console.error(`code_verifier: ${challenge.code_verifier}`);
console.error(`code: ${code}`);
console.error('curl command to obtain a token:');
console.error('');
console.log(`curl -d 'grant_type=authorization_code&client_id=${settings.client_id}&code_verifier=${challenge.code_verifier}&code=${qs.escape(code)}' ${AUTH_SERVER}/token`);
