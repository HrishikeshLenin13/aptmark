import {readFileSync} from 'node:fs';
const document=JSON.parse(readFileSync(process.argv[2],'utf8'));
console.log(`development:status=${document.scripts['development:status'] ?? 'absent'}`);
