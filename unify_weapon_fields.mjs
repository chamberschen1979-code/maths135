import fs from 'fs';

const motifFiles = ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09'];

let totalMerged = 0;
let totalDeleted = 0;

for (const motif of motifFiles) {
  console.log(`\n处理 ${motif}...`);
  
  const data = JSON.parse(fs.readFileSync(`./src/data/${motif}.json`, 'utf8'));
  let mergedCount = 0;
  let deletedCount = 0;
  
  data.specialties?.forEach(spec => {
    spec.variations?.forEach(vari => {
      // 1. 删除变例级别的 linked_weapons 和 weapon_map_note
      if (vari.toolkit?.linked_weapons) {
        delete vari.toolkit.linked_weapons;
        deletedCount++;
      }
      if (vari.toolkit?.weapon_map_note) {
        delete vari.toolkit.weapon_map_note;
        deletedCount++;
      }
      
      // 2. 将 meta.weapons 合并到 weapons
      vari.original_pool?.forEach(p => {
        const metaWeapons = p.meta?.weapons || [];
        const pWeapons = p.weapons || [];
        
        // 合并武器
        const allWeapons = [...new Set([...pWeapons, ...metaWeapons])];
        
        // 如果有武器，设置到 p.weapons
        if (allWeapons.length > 0) {
          p.weapons = allWeapons;
          mergedCount++;
        }
        
        // 删除 meta.weapons
        if (p.meta?.weapons) {
          delete p.meta.weapons;
        }
        
        // 删除 meta.inherit_weapons
        if (p.meta?.inherit_weapons !== undefined) {
          delete p.meta.inherit_weapons;
        }
      });
    });
  });
  
  fs.writeFileSync(`./src/data/${motif}.json`, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  合并了 ${mergedCount} 处武器配置`);
  console.log(`  删除了 ${deletedCount} 处变例级武器配置`);
  totalMerged += mergedCount;
  totalDeleted += deletedCount;
}

console.log(`\n\n总计合并: ${totalMerged} 处武器配置`);
console.log(`总计删除: ${totalDeleted} 处变例级武器配置`);
console.log('\n完成！杀手锏字段已统一为 p.weapons');
