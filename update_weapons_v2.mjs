import fs from 'fs';

// 从 weapon_map_note 中提取武器ID
function extractWeaponsFromNote(note) {
  if (!note) return [];
  const matches = note.match(/S-[A-Z]+-\d+/g) || [];
  return [...new Set(matches)];
}

const motifFiles = ['M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09'];

let totalUpdated = 0;

for (const motif of motifFiles) {
  console.log(`\n处理 ${motif}...`);
  
  const data = JSON.parse(fs.readFileSync(`./src/data/${motif}.json`, 'utf8'));
  let updatedCount = 0;
  
  data.specialties?.forEach(spec => {
    spec.variations?.forEach(vari => {
      // 获取变例级别的武器
      let linkedWeapons = vari.toolkit?.linked_weapons || [];
      
      // 如果 linked_weapons 为空，尝试从 weapon_map_note 提取
      if (linkedWeapons.length === 0) {
        const note = vari.toolkit?.weapon_map_note || vari.toolkit?.priority_guidance || '';
        linkedWeapons = extractWeaponsFromNote(note);
      }
      
      if (linkedWeapons.length === 0) return;
      
      vari.original_pool?.forEach(p => {
        // 检查题目是否有 meta.weapons 字段
        if (p.meta && Array.isArray(p.meta.weapons)) {
          if (p.meta.weapons.length === 0) {
            p.meta.weapons = [...linkedWeapons];
            updatedCount++;
          }
        }
        // 检查题目是否有直接的 weapons 字段
        else if (Array.isArray(p.weapons)) {
          if (p.weapons.length === 0) {
            p.weapons = [...linkedWeapons];
            updatedCount++;
          }
        }
        // 如果题目有 tags 字段，添加武器到 tags
        else if (p.tags && Array.isArray(p.tags)) {
          const weaponTags = p.tags.filter(t => t.startsWith('S-'));
          if (weaponTags.length === 0) {
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
  totalUpdated += updatedCount;
}

console.log(`\n总计更新: ${totalUpdated} 道题`);
