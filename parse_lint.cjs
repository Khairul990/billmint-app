const fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('lint_report.json', 'utf8'));
  const undefMap = {};
  
  data.forEach(file => {
    file.messages.forEach(msg => {
      if (msg.ruleId === 'no-undef') {
        // ESLint no-undef messages typically look like: "'variableName' is not defined."
        const match = msg.message.match(/'([^']+)' is not defined/);
        const varName = match ? match[1] : msg.message;
        
        if (!undefMap[varName]) {
          undefMap[varName] = { count: 0, files: new Set() };
        }
        undefMap[varName].count++;
        undefMap[varName].files.add(file.filePath);
      }
    });
  });

  const results = Object.keys(undefMap).map(v => {
    return {
      variable: v,
      count: undefMap[v].count,
      files: Array.from(undefMap[v].files).slice(0, 3) // preview up to 3 files
    };
  }).sort((a, b) => b.count - a.count);

  console.log(JSON.stringify(results, null, 2));
} catch (err) {
  console.error("Error reading or parsing lint_report.json:", err.message);
}
