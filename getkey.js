const fs = require('fs');
const crypto = require('crypto');

const pem = fs.readFileSync('./extension.pem', 'utf8');
const publicKey = crypto.createPublicKey(pem);
const der = publicKey.export({ type: 'spki', format: 'der' });
const base64Key = der.toString('base64');

console.log(base64Key);
