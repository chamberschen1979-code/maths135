import fs from 'fs';

const motifFiles = ['M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09'];

for (const motif of motifFiles) {
  console.log(`\n处理 ${motif}...`);
  
  const data = JSON.parse(fs.readFileSync(`./src/data/${motif}.json`, 'utf8'));
  let updatedCount = 0;
  
  data.specialties?.forEach(spec => {
    spec.variations?.forEach(vari => {
      // 获取变例级别的武器
      const linkedWeapons = vari.toolkit?.linked_weapons || [];
      
      vari.original_pool?.forEach(p => {
        // 检查题目是否有 meta.weapons 字段
        if (p.meta && Array.isArray(p.meta.weapons)) {
          // 如果题目没有武器配置，从变例继承
          if (p.meta.weapons.length === 0 && linkedWeapons.length > 0) {
            p.meta.weapons = [...linkedWeapons];
            updatedCount++;
          }
        }
        // 检查题目是否有直接的 weapons 字段（M07风格）
        else if (Array.isArray(p.weapons)) {
          if (p.weapons.length === 0 && linkedWeapons.length > 0) {
            p.weapons = [...linkedWeapons];
            updatedCount++;
          }
        }
        // 如果题目有 tags 字段，尝试从 tags 提取武器
        else if (p.tags && Array.isArray(p.tags)) {
          const weaponTags = p.tags.filter(t => t.startsWith('S-'));
          if (weaponTags.length === 0 && linkedWeapons.length > 0) {
            // 添加武器到 tags
            p.tags = [...p.tags, ...linkedWeapons];
            updatedCount++;
          }
        }
      });
    });
  });
  
  // 写回文件
  fs.writeFileSync(`./src/data/${motif}.json`, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  更新了 ${updatedCount} 道题的武器配置`);
}

console.log('\n完成！');
