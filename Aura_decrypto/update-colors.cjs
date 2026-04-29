const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Hardcoded hex colors
  content = content.replace(/#050505/g, 'var(--bg-primary)');
  content = content.replace(/#111111|#111(?![0-9a-fA-F])/g, 'var(--bg-secondary)');
  content = content.replace(/#0a0a0a/g, 'var(--bg-secondary)');
  content = content.replace(/#ffffff|#fff(?![0-9a-fA-F])/g, 'var(--text-primary)');
  content = content.replace(/#000000|#000(?![0-9a-fA-F])/g, 'var(--btn-text)');
  content = content.replace(/#00ff88/gi, 'var(--accent-primary)');
  content = content.replace(/#00ccff/gi, 'var(--accent-secondary)');
  content = content.replace(/#ffcc00/gi, 'var(--warning)');
  content = content.replace(/#a0a0a0/gi, 'var(--text-secondary)');
  content = content.replace(/#ff4d4d/gi, 'var(--error)');

  // RGBA with whitespace handling
  content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*([0-9.]+)\s*\)/g, 'rgba(var(--text-rgb), $1)');
  content = content.replace(/rgba\(\s*0\s*,\s*255\s*,\s*136\s*,\s*([0-9.]+)\s*\)/g, 'rgba(var(--accent-primary-rgb), $1)');
  content = content.replace(/rgba\(\s*0\s*,\s*204\s*,\s*255\s*,\s*([0-9.]+)\s*\)/g, 'rgba(var(--accent-secondary-rgb), $1)');
  content = content.replace(/rgba\(\s*255\s*,\s*204\s*,\s*0\s*,\s*([0-9.]+)\s*\)/g, 'rgba(var(--warning-rgb), $1)');
  content = content.replace(/rgba\(\s*255\s*,\s*77\s*,\s*77\s*,\s*([0-9.]+)\s*\)/g, 'rgba(var(--error-rgb), $1)');
  content = content.replace(/rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*([0-9.]+)\s*\)/g, 'rgba(var(--btn-text-rgb), $1)');

  fs.writeFileSync(file, content, 'utf8');
});

console.log('Replaced colors in TSX files successfully.');
