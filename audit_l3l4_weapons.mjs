import fs from 'fs';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         M01/02/03/04/07/08 L3/L4 杀手锏匹配审计              ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const motifFiles = ['M01', 'M02', 'M03', 'M04', 'M07', 'M08'];

// 读取 weapon_details.json
let weaponDetails = {};
try {
  weaponDetails = JSON.parse(fs.readFileSync('./src/data/weapon_details.json', 'utf8'));
} catch (e) {}

for (const motif of motifFiles) {
  const data = JSON.parse(fs.readFileSync(`./src/data/${motif}.json`, 'utf8'));
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📁 ${motif} ${data.motif_name}`);
  console.log(`${'═'.repeat(60)}`);
  
  let l3Count = 0, l4Count = 0;
  let l3WithWeapon = 0, l4WithWeapon = 0;
  const issues = [];
  
  data.specialties?.forEach(spec => {
    spec.variations?.forEach(vari => {
      vari.original_pool?.forEach(p => {
        // 获取难度级别
        let level = p.level || p.meta?.level || 'L2';
        if (p.id && p.id.includes('_L2')) level = 'L2';
        if (p.id && p.id.includes('_L3')) level = 'L3';
        if (p.id && p.id.includes('_L4')) level = 'L4';
        
        if (level === 'L3') {
          l3Count++;
          if (p.weapons && p.weapons.length > 0) {
            l3WithWeapon++;
          } else {
            issues.push({
              id: p.id,
              level: 'L3',
              problem: p.problem?.substring(0, 50) + '...',
              hint: p.strategy_hint || '(无)'
            });
          }
        } else if (level === 'L4') {
          l4Count++;
          if (p.weapons && p.weapons.length > 0) {
            l4WithWeapon++;
          } else {
            issues.push({
              id: p.id,
              level: 'L4',
              problem: p.problem?.substring(0, 50) + '...',
              hint: p.strategy_hint || '(无)'
            });
          }
        }
      });
    });
  });
  
  console.log(`\nL3: ${l3WithWeapon}/${l3Count} (${(l3WithWeapon/l3Count*100).toFixed(0)}%)`);
  console.log(`L4: ${l4WithWeapon}/${l4Count} (${(l4WithWeapon/l4Count*100).toFixed(0)}%)`);
  
  if (issues.length > 0) {
    console.log(`\n⚠️  缺少杀手锏的 L3/L4 题目 (${issues.length} 道):`);
    issues.slice(0, 10).forEach(i => {
      console.log(`\n  ${i.id} (${i.level}):`);
      console.log(`    题目: ${i.problem}`);
      console.log(`    提示: ${i.hint}`);
    });
    if (issues.length > 10) {
      console.log(`\n  ... 还有 ${issues.length - 10} 道题目缺少杀手锏`);
    }
  } else {
    console.log(`\n✅ 所有 L3/L4 题目都有杀手锏配置`);
  }
}
