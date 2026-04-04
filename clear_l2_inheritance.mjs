import fs from 'fs';

const motifFiles = ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09'];

let totalCleared = 0;

for (const motif of motifFiles) {
  console.log(`\n处理 ${motif}...`);
  
  const data = JSON.parse(fs.readFileSync(`./src/data/${motif}.json`, 'utf8'));
  let clearedCount = 0;
  
  data.specialties?.forEach(spec => {
    spec.variations?.forEach(vari => {
      vari.original_pool?.forEach(p => {
        // 获取难度级别
        let level = p.level || p.meta?.level || 'L2';
        if (p.id && p.id.includes('_L2')) level = 'L2';
        if (p.id && p.id.includes('_L3')) level = 'L3';
        if (p.id && p.id.includes('_L4')) level = 'L4';
        
        // 只处理 L2 题目
        if (level === 'L2') {
          // 清空 weapons 字段
          if (p.weapons && p.weapons.length > 0) {
            p.weapons = [];
            clearedCount++;
          }
          // 清空 meta.weapons 字段
          if (p.meta?.weapons && p.meta.weapons.length > 0) {
            p.meta.weapons = [];
            clearedCount++;
          }
          // 添加标记，表示不继承变例级别的武器
          if (!p.meta) p.meta = {};
          p.meta.inherit_weapons = false;
        }
      });
    });
  });
  
  fs.writeFileSync(`./src/data/${motif}.json`, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  清理了 ${clearedCount} 处 L2 题目的杀手锏配置`);
  totalCleared += clearedCount;
}

console.log(`\n总计清理: ${totalCleared} 处 L2 题目的杀手锏配置`);
console.log('\n完成！L2 基础题不再配置杀手锏。');
