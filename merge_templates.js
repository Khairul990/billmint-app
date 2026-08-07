import fs from 'fs';
import path from 'path';

// TemplateConfigs exports `templates`
// Since we are running in an ES module, we'll parse the file with regex to extract the templates safely
const configsContent = fs.readFileSync('src/components/invoice-templates/TemplateConfigs.js', 'utf8');

// The file exports `export const templates = [...]`
let jsonStr = configsContent.match(/export const templates = (\[[\s\S]*\]);/)[1];
// jsonStr is not pure JSON, it's JS. We'll use a safer eval
const templates = eval(`(${jsonStr})`);

let templateEngineStr = fs.readFileSync('src/services/TemplateEngine.js', 'utf8');

let newTemplatesCode = templates.map(t => {
  return `  { id: '${t.id}', name: '${t.name}', type: 'PRO', icon: LayoutTemplate, desc: '${t.description.replace(/'/g, "\\'")}', tags: ['A4', 'Modern', 'New'], layoutFamily: 'modern', thumbnail: '${t.thumbnail}' }`;
}).join(',\n');

templateEngineStr = templateEngineStr.replace(
  /];/,
  `,\n  // New integrated templates\n${newTemplatesCode}\n];`
);

fs.writeFileSync('src/services/TemplateEngine.js', templateEngineStr);
console.log('Merged templates successfully.');
