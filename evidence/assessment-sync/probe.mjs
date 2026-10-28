import { readFileSync } from 'node:fs';
const source = readFileSync(process.argv[2], 'utf8');
console.log(`writeQueue=${source.includes('new AssessmentSync') ? 'versioned' : 'promise-tail'}; retry=${source.includes('Retry unsaved changes')}; controlledNotes=${/\bvalue=\{m\.notes\[q\.id\] \?\? ""\}/.test(source)}`);
