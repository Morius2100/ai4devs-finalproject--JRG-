const fs = require('fs');
const path = require('path');

let data = '';
process.stdin.on('data', (chunk) => {
  data += chunk;
});

process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const prompt = typeof input.prompt === 'string' ? input.prompt : '';
    if (!prompt.trim()) return;

    const target = path.join(__dirname, '..', '..', 'Prompts.md');
    if (!fs.existsSync(target)) {
      fs.writeFileSync(target, '# Prompts\n\nLog of every prompt submitted by the user in this project.\n', 'utf8');
    }

    const timestamp = new Date().toISOString();
    const entry = `\n## ${timestamp}\n\n${prompt}\n`;
    fs.appendFileSync(target, entry, 'utf8');
  } catch (err) {
    // Never block the user's prompt on a logging failure.
  }
});
