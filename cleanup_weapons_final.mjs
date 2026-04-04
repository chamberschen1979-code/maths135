import fs from 'fs';

// 课本基础方法类武器（应移除）
const basicWeapons = [
  'S-TRIG-01',  // 配角公式（辅助角公式是课本必修内容）
  'S-TRIG-02',  // 图象变换铁律（课本必修内容）
  'S-VEC-01',   // 投影向量（课本必修内容）
  'S-VEC-04',   // 建系策略（课本基础方法）
  'S-GEO-02',   // 建系秒杀（课本基础方法）
  'S-GEO-03',   // 等体积法（课本基础方法）
  'S-FUNC-02',  // 同增异减（课本必修内容）
];

const motifFiles = ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09'];

let totalRemoved = 0;
let l2Cleared = 0;

for (const motif of motifFiles) {
  console.log(`\n处理 ${motif}...`);
  
  const data = JSON.parse(fs.readFileSync(`./src/data/${motif}.json`, 'utf8'));
  let removedCount = 0;
  let l2Count = 0;
  
  data.specialties?.forEach(spec => {
    spec.variations?.forEach(vari => {
      // 1. 清理变例级别的课本基础方法类武器
      if (vari.toolkit?.linked_weapons && vari.toolkit.linked_weapons.length > 0) {
        const filtered = vari.toolkit.linked_weapons.filter(w => !basicWeapons.includes(w));
        const removed = vari.toolkit.linked_weapons.filter(w => basicWeapons.includes(w));
        
        if (removed.length > 0) {
          console.log(`  变例 ${vari.var_id}: 移除课本基础方法 ${removed.join(', ')}`);
          vari.toolkit.linked_weapons = filtered;
          removedCount++;
        }
      }
      
      // 2. 清理题目级别的武器
      vari.original_pool?.forEach(p => {
        // 获取难度级别
        let level = p.level || p.meta?.level || 'L2';
        if (p.id && p.id.includes('_L2')) level = 'L2';
        if (p.id && p.id.includes('_L3')) level = 'L3';
        if (p.id && p.id.includes('_L4')) level = 'L4';
        
        // 处理 weapons 字段
        if (p.weapons && p.weapons.length > 0) {
          // L2 题目清空所有武器
          if (level === 'L2') {
            p.weapons = [];
            l2Count++;
          } else {
            // L3/L4 题目只移除课本基础方法
            const filtered = p.weapons.filter(w => !basicWeapons.includes(w));
            if (filtered.length !== p.weapons.length) {
              p.weapons = filtered;
              removedCount++;
            }
          }
        }
        
        // 处理 meta.weapons 字段
        if (p.meta?.weapons && p.meta.weapons.length > 0) {
          // L2 题目清空所有武器
          if (level === 'L2') {
            p.meta.weapons = [];
            l2Count++;
          } else {
            // L3/L4 题目只移除课本基础方法
            const filtered = p.meta.weapons.filter(w => !basicWeapons.includes(w));
            if (filtered.length !== p.meta.weapons.length) {
              p.meta.weapons = filtered;
              removedCount++;
            }
          }
        }
      });
    });
  });
  
  fs.writeFileSync(`./src/data/${motif}.json`, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  移除了 ${removedCount} 处课本基础方法类武器`);
  console.log(`  清理了 ${l2Count} 道 L2 题目的武器配置`);
  totalRemoved += removedCount;
  l2Cleared += l2Count;
}

console.log(`\n总计移除: ${totalRemoved} 处课本基础方法类武器配置`);
console.log(`总计清理: ${l2Cleared} 道 L2 题目的武器配置`);
console.log('\n完成！');
