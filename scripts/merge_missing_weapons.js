import fs from 'fs';

const currentPath = './src/data/weapon_details.json';
const backupPath = './src/data/weapon_details_副本.json';

const current = JSON.parse(fs.readFileSync(currentPath, 'utf-8'));
const backup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

// 需要从副本中提取的杀手锏 ID
const missingIds = ['S-LOG-01', 'S-LOG-02', 'S-LOG-03', 'S-LOG-04', 'S-LOG-05', 'S-LOG-06', 'S-LOG-07'];

console.log('=== 合并缺失的杀手锏 ===\n');

let addedCount = 0;

for (const id of missingIds) {
  if (backup[id] && !current[id]) {
    current[id] = backup[id];
    console.log(`✅ 添加: ${id}`);
    addedCount++;
  } else if (current[id]) {
    console.log(`⏭️ 已存在: ${id}`);
  } else {
    console.log(`❌ 副本中也没有: ${id}`);
  }
}

// 保存
fs.writeFileSync(currentPath, JSON.stringify(current, null, 2), 'utf-8');

console.log(`\n=== 完成 ===`);
console.log(`添加了 ${addedCount} 个杀手锏`);
console.log(`当前共有 ${Object.keys(current).length} 个杀手锏`);
