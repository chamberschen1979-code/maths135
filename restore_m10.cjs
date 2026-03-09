const fs = require('fs');

// 读取文件
let content = fs.readFileSync('src/data/M10.json', 'utf8');

// 将所有单引号替换回双引号（恢复 JSON 结构）
content = content.replace(/'/g, '"');

// 写回文件
fs.writeFileSync('src/data/M10.json', content, 'utf8');

console.log('已恢复 M10.json 的双引号');

// 验证
try {
  const data = JSON.parse(fs.readFileSync('src/data/M10.json', 'utf8'));
  console.log('✅ M10.json 格式正确');
} catch (e) {
  console.log('❌ M10.json 仍有错误:', e.message);
}
