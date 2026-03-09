const fs = require('fs');

let content = fs.readFileSync('src/data/M10.json', 'utf8');

// 统计中文引号
const leftQuotes = (content.match(/"/g) || []).length;
const rightQuotes = (content.match(/"/g) || []).length;

console.log('左中文引号数量:', leftQuotes);
console.log('右中文引号数量:', rightQuotes);

// 替换中文引号为英文单引号
content = content.replace(/"/g, "'");
content = content.replace(/"/g, "'");

fs.writeFileSync('src/data/M10.json', content, 'utf8');

// 验证
try {
  const data = JSON.parse(content);
  console.log('M10.json 格式正确');
  console.log('motif_id:', data.motif_id);
} catch (e) {
  console.log('M10.json 错误:', e.message);
}
