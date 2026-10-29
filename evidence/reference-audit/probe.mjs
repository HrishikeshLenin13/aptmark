import {readFileSync} from 'node:fs';
const text=readFileSync(process.argv[2],'utf8');
console.log(`collegeBoardPrimary=${text.includes('https://satsuite.collegeboard.org/')}; milestoneCadence=${text.includes('At every feature milestone')}`);
