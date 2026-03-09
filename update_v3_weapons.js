import fs from 'fs';

const data = JSON.parse(fs.readFileSync('src/data/M02.json', 'utf8'));

// 找到 V3 并更新武器映射
const v3 = data.specialties.find(s => s.spec_id === 'V3');
if (v3) {
  v3.variations.forEach(v => {
    // 更新 toolkit.linked_weapons
    if (v.toolkit) {
      v.toolkit.linked_weapons = ['S-INEQ-05'];
      delete v.toolkit.weapon_map_note;
    }
    // 更新 master_benchmarks 中的 linked_weapons
    if (v.master_benchmarks) {
      v.master_benchmarks.forEach(mb => {
        if (mb.analysis && mb.analysis.linked_weapons) {
          mb.analysis.linked_weapons = ['S-INEQ-05'];
        }
      });
    }
    console.log(`变例 ${v.var_id} (${v.name}): ["S-INEQ-05"]`);
  });
}

fs.writeFileSync('src/data/M02.json', JSON.stringify(data, null, 2), 'utf8');
console.log('\n✅ M02.json V3 武器映射已更新');
