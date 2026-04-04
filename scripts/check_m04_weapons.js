import fs from 'fs';

const weaponDetailsPath = './src/data/weapon_details.json';
const m04Path = './src/data/M04.json';

const weaponDetails = JSON.parse(fs.readFileSync(weaponDetailsPath, 'utf-8'));
const m04 = JSON.parse(fs.readFileSync(m04Path, 'utf-8'));

// 获取所有有效的杀手锏 ID
const validWeaponIds = Object.keys(weaponDetails);
console.log('=== 有效杀手锏 ID (weapon_details.json) ===');
console.log(validWeaponIds.join(', '));
console.log(`\n共 ${validWeaponIds.length} 个\n`);

// 收集 M04 中所有题目的杀手锏
const weaponUsage = {};
const invalidWeapons = [];
const missingWeapons = [];

console.log('=== M04.json 杀手锏对照表 ===\n');

for (const spec of m04.specialties) {
  for (const variation of spec.variations) {
    console.log(`\n【${spec.spec_id}/${variation.var_id} ${variation.name}】`);
    
    for (const q of variation.original_pool) {
      const weapons = q.meta?.weapons || [];
      
      if (weapons.length === 0) {
        console.log(`  ${q.id}: 无杀手锏`);
        continue;
      }
      
      // 检查每个杀手锏是否有效
      const status = weapons.map(w => {
        if (validWeaponIds.includes(w)) {
          weaponUsage[w] = (weaponUsage[w] || 0) + 1;
          return `✅ ${w}`;
        } else {
          invalidWeapons.push({ questionId: q.id, weapon: w });
          return `❌ ${w} (无效)`;
        }
      });
      
      console.log(`  ${q.id}: [${status.join(', ')}]`);
    }
  }
}

// 统计报告
console.log('\n\n=== 统计报告 ===');
console.log('\n【杀手锏使用频次】');
const sortedUsage = Object.entries(weaponUsage).sort((a, b) => b[1] - a[1]);
sortedUsage.forEach(([id, count]) => {
  const name = weaponDetails[id]?.name || '未知';
  console.log(`  ${id} (${name}): ${count} 次`);
});

console.log('\n【无效杀手锏】');
if (invalidWeapons.length === 0) {
  console.log('  ✅ 无无效杀手锏');
} else {
  invalidWeapons.forEach(({ questionId, weapon }) => {
    console.log(`  ❌ ${questionId}: ${weapon}`);
  });
}

console.log('\n【weapon_details.json 中未被使用的杀手锏】');
const unusedWeapons = validWeaponIds.filter(id => !weaponUsage[id]);
if (unusedWeapons.length === 0) {
  console.log('  ✅ 所有杀手锏都被使用');
} else {
  unusedWeapons.forEach(id => {
    const name = weaponDetails[id]?.name || '未知';
    console.log(`  ${id} (${name})`);
  });
}

// 总结
console.log('\n=== 总结 ===');
console.log(`M04 题目总数: ${Object.values(weaponUsage).reduce((a, b) => a + b, 0) + invalidWeapons.length}`);
console.log(`有效杀手锏引用: ${Object.values(weaponUsage).reduce((a, b) => a + b, 0)}`);
console.log(`无效杀手锏引用: ${invalidWeapons.length}`);
console.log(`未使用的杀手锏: ${unusedWeapons.length}`);
