import fs from 'fs';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         杀手锏配置合理性抽样审计                              ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// 读取 weapon_details.json
let weaponDetails = {};
try {
  weaponDetails = JSON.parse(fs.readFileSync('./src/data/weapon_details.json', 'utf8'));
} catch (e) {}

const motifFiles = ['M01', 'M02', 'M04', 'M07', 'M08'];

for (const motif of motifFiles) {
  const data = JSON.parse(fs.readFileSync(`./src/data/${motif}.json`, 'utf8'));
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📁 ${motif} ${data.motif_name}`);
  console.log(`${'═'.repeat(60)}`);
  
  // 收集所有 L3/L4 题目
  const problems = [];
  data.specialties?.forEach(spec => {
    spec.variations?.forEach(vari => {
      vari.original_pool?.forEach(p => {
        let level = p.level || p.meta?.level || 'L2';
        if (p.id && p.id.includes('_L2')) level = 'L2';
        if (p.id && p.id.includes('_L3')) level = 'L3';
        if (p.id && p.id.includes('_L4')) level = 'L4';
        
        if ((level === 'L3' || level === 'L4') && p.weapons && p.weapons.length > 0) {
          problems.push({
            id: p.id,
            level,
            problem: p.problem?.substring(0, 60) + '...',
            weapons: p.weapons,
            hint: p.strategy_hint || ''
          });
        }
      });
    });
  });
  
  console.log(`\nL3/L4 题目总数: ${problems.length}`);
  
  // 统计武器使用
  const weaponCounts = {};
  problems.forEach(p => {
    p.weapons.forEach(w => {
      if (!weaponCounts[w]) weaponCounts[w] = { count: 0, samples: [] };
      weaponCounts[w].count++;
      if (weaponCounts[w].samples.length < 3) {
        weaponCounts[w].samples.push(p);
      }
    });
  });
  
  console.log(`\n杀手锏使用分布:`);
  Object.entries(weaponCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([w, info]) => {
      const detail = weaponDetails[w];
      const name = detail?.coreLogic?.substring(0, 40) || '(未定义)';
      console.log(`\n  ${w}: ${info.count} 次`);
      console.log(`    定义: ${name}...`);
      console.log(`    示例题目:`);
      info.samples.forEach(s => {
        console.log(`      - ${s.id}: ${s.problem}`);
      });
    });
  
  // 抽样检查：每5道题抽1道
  console.log(`\n\n【抽样检查】每5道题抽1道:`);
  const sampleIndices = [0, 5, 10, 15, 20, 25, 30, 35, 40];
  sampleIndices.forEach(i => {
    if (problems[i]) {
      const p = problems[i];
      console.log(`\n  ${p.id} (${p.level}):`);
      console.log(`    题目: ${p.problem}`);
      console.log(`    杀手锏: ${p.weapons.join(', ')}`);
      console.log(`    提示: ${p.hint}`);
      
      // 检查武器定义
      p.weapons.forEach(w => {
        const detail = weaponDetails[w];
        if (detail) {
          console.log(`    ${w} 核心逻辑: ${detail.coreLogic?.substring(0, 50)}...`);
        } else {
          console.log(`    ${w}: ⚠️ 未在 weapon_details.json 中定义`);
        }
      });
    }
  });
}
