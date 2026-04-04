import fs from 'fs';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         M01-M09 杀手锏字段使用情况分析                        ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const motifFiles = ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09'];

const fieldStats = {
  vari_linked_weapons: { count: 0, locations: [] },
  vari_weapon_map_note: { count: 0, locations: [] },
  prob_weapons: { count: 0, locations: [] },
  prob_meta_weapons: { count: 0, locations: [] },
  prob_strategy_hint: { count: 0, locations: [] }
};

for (const motif of motifFiles) {
  const data = JSON.parse(fs.readFileSync(`./src/data/${motif}.json`, 'utf8'));
  
  data.specialties?.forEach(spec => {
    spec.variations?.forEach(vari => {
      // 检查变例级别的 linked_weapons
      if (vari.toolkit?.linked_weapons && vari.toolkit.linked_weapons.length > 0) {
        fieldStats.vari_linked_weapons.count++;
        fieldStats.vari_linked_weapons.locations.push(`${motif}/${spec.spec_id}.${vari.var_id}`);
      }
      
      // 检查变例级别的 weapon_map_note
      if (vari.toolkit?.weapon_map_note) {
        fieldStats.vari_weapon_map_note.count++;
        fieldStats.vari_weapon_map_note.locations.push(`${motif}/${spec.spec_id}.${vari.var_id}`);
      }
      
      // 检查题目级别
      vari.original_pool?.forEach(p => {
        // p.weapons
        if (p.weapons && p.weapons.length > 0) {
          fieldStats.prob_weapons.count++;
          fieldStats.prob_weapons.locations.push(`${motif}/${p.id}`);
        }
        
        // p.meta.weapons
        if (p.meta?.weapons && p.meta.weapons.length > 0) {
          fieldStats.prob_meta_weapons.count++;
          fieldStats.prob_meta_weapons.locations.push(`${motif}/${p.id}`);
        }
        
        // p.strategy_hint
        if (p.strategy_hint) {
          fieldStats.prob_strategy_hint.count++;
          fieldStats.prob_strategy_hint.locations.push(`${motif}/${p.id}`);
        }
      });
    });
  });
}

console.log('【变例级别字段】\n');
console.log(`1. toolkit.linked_weapons: ${fieldStats.vari_linked_weapons.count} 处`);
if (fieldStats.vari_linked_weapons.count > 0) {
  console.log('   位置:');
  fieldStats.vari_linked_weapons.locations.slice(0, 10).forEach(l => console.log(`   - ${l}`));
  if (fieldStats.vari_linked_weapons.locations.length > 10) {
    console.log(`   ... 共 ${fieldStats.vari_linked_weapons.locations.length} 处`);
  }
}

console.log(`\n2. toolkit.weapon_map_note: ${fieldStats.vari_weapon_map_note.count} 处`);
if (fieldStats.vari_weapon_map_note.count > 0) {
  console.log('   位置:');
  fieldStats.vari_weapon_map_note.locations.slice(0, 10).forEach(l => console.log(`   - ${l}`));
  if (fieldStats.vari_weapon_map_note.locations.length > 10) {
    console.log(`   ... 共 ${fieldStats.vari_weapon_map_note.locations.length} 处`);
  }
}

console.log('\n\n【题目级别字段】\n');
console.log(`3. p.weapons: ${fieldStats.prob_weapons.count} 处`);
console.log(`4. p.meta.weapons: ${fieldStats.prob_meta_weapons.count} 处`);
console.log(`5. p.strategy_hint: ${fieldStats.prob_strategy_hint.count} 处`);

console.log('\n\n【问题总结】');
console.log('❌ 变例级别的 linked_weapons 应该删除');
console.log('❌ 题目级别的 meta.weapons 应该合并到 p.weapons');
console.log('⚠️  strategy_hint 可以保留作为提示，但不是杀手锏字段');

console.log('\n\n【统一方案】');
console.log('1. 删除变例级别的 toolkit.linked_weapons 和 weapon_map_note');
console.log('2. 将 p.meta.weapons 合并到 p.weapons');
console.log('3. 统一使用 p.weapons 作为杀手锏字段');
