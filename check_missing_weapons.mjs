import fs from 'fs';

// 读取 weapon_details.json
const weaponDetails = JSON.parse(fs.readFileSync('./src/data/weapon_details.json', 'utf8'));

// 从 M01-M09 中提取所有使用的武器
const motifFiles = ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09'];
const usedWeapons = new Set();

for (const motif of motifFiles) {
  const data = JSON.parse(fs.readFileSync(`./src/data/${motif}.json`, 'utf8'));
  
  data.specialties?.forEach(spec => {
    spec.variations?.forEach(vari => {
      // 变例级别武器
      (vari.toolkit?.linked_weapons || []).forEach(w => usedWeapons.add(w));
      
      // 题目级别武器
      vari.original_pool?.forEach(p => {
        (p.weapons || []).forEach(w => usedWeapons.add(w));
        (p.meta?.weapons || []).forEach(w => usedWeapons.add(w));
      });
    });
  });
}

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         weapon_details.json 缺失武器检查                     ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log(`M01-M09 使用的武器总数: ${usedWeapons.size} 种\n`);

const definedWeapons = new Set(Object.keys(weaponDetails));
console.log(`weapon_details.json 定义的武器: ${definedWeapons.size} 种\n`);

const missing = [];
const defined = [];

usedWeapons.forEach(w => {
  if (definedWeapons.has(w)) {
    defined.push(w);
  } else {
    missing.push(w);
  }
});

console.log('✅ 已定义的武器:');
defined.sort().forEach(w => console.log(`  ${w}`));

console.log('\n❌ 缺失的武器（需要添加到 weapon_details.json）:');
missing.sort().forEach(w => console.log(`  ${w}`));

console.log(`\n总计: ${missing.length} 种武器缺失`);
