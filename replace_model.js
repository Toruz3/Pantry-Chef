import fs from 'fs';
const file = 'src/server/gemini.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/gemini-3\.1-flash-lite-preview/g, 'gemini-3-flash-preview');
fs.writeFileSync(file, content);
