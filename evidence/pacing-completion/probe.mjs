import { readFileSync } from 'node:fs';
const source = readFileSync(process.argv[2], 'utf8');
const section = source.match(/useState<DrillConfig>\(\{\s*section:\s*"(math|rw)"/)?.[1];
if (!section) throw Error('Pacing default section not found.');
console.log(`defaultSection=${section}; introductoryPanel=${source.includes('className="pacing-intro"')}`);
