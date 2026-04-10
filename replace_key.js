import fs from 'fs';
const file = 'src/server/gemini.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/process\.env\.API_KEY \|\| process\.env\.GEMINI_API_KEY/g, '"AIzaSyCjHU1JzTNVDPGXsZkJy4TZKbf6oGrOPMQ"');
fs.writeFileSync(file, content);
