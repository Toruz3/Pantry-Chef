import fs from 'fs';
const file = 'src/server/gemini.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/process\.env\.GEMINI_API_KEY/g, 'process.env.API_KEY || process.env.GEMINI_API_KEY');
fs.writeFileSync(file, content);
