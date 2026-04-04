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
const removalStats = {};

for (const motif of motifFiles) {
  console.log(`\n处理 ${motif}...`);
  
  const data = JSON.parse(fs.readFileSync(`./src/data/${motif}.json`, 'utf8'));
  let removedCount = 0;
  removalStats[motif] = {};
  
  data.specialties?.forEach(spec => {
    spec.variations?.forEach(vari => {
      vari.original_pool?.forEach(p => {
        // 处理 weapons 字段
        if (p.weapons && p.weapons.length > 0) {
          const filtered = p.weapons.filter(w => !basicWeapons.includes(w));
          const removed = p.weapons.filter(w => basicWeapons.includes(w));
          
          removed.forEach(w => {
            if (!removalStats[motif][w]) removalStats[motif][w] = 0;
            removalStats[motif][w]++;
          });
          
          if (filtered.length !== p.weapons.length) {
            p.weapons = filtered;
            removedCount++;
          }
        }
        
        // 处理 meta.weapons 字段
        if (p.meta?.weapons && p.meta.weapons.length > 0) {
          const filtered = p.meta.weapons.filter(w => !basicWeapons.includes(w));
          const removed = p.meta.weapons.filter(w => basicWeapons.includes(w));
          
          removed.forEach(w => {
            if (!removalStats[motif][w]) removalStats[motif][w] = 0;
            removalStats[motif][w]++;
          });
          
          if (filtered.length !== p.meta.weapons.length) {
            p.meta.weapons = filtered;
            removedCount++;
          }
        }
      });
    });
  });
  
  fs.writeFileSync(`./src/data/${motif}.json`, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  移除了 ${removedCount} 处课本基础方法类武器`);
  totalRemoved += removedCount;
  
  // 输出详细统计
  if (Object.keys(removalStats[motif]).length > 0) {
    Object.entries(removalStats[motif]).forEach(([w, count]) => {
      console.log(`    ${w}: ${count} 处`);
    });
  }
}

console.log(`\n总计移除: ${totalRemoved} 处课本基础方法类武器配置`);
console.log('\n移除的武器列表:');
basicWeapons.forEach(w => console.log(`  - ${w}`));
console.log('\n完成！保留的武器都是真正的"杀手锏"。');
