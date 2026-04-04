import fs from 'fs';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         M01-M09 各母题杀手锏统计报告                         ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const motifFiles = ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09'];

// 读取 weapon_details.json
let weaponDetails = {};
try {
  weaponDetails = JSON.parse(fs.readFileSync('./src/data/weapon_details.json', 'utf8'));
} catch (e) {
  console.log('weapon_details.json 读取失败');
}

const allStats = {};
const allWeapons = {};

for (const motif of motifFiles) {
  try {
    const data = JSON.parse(fs.readFileSync(`./src/data/${motif}.json`, 'utf8'));
    
    allStats[motif] = {
      name: data.motif_name,
      total: 0,
      withWeapons: 0,
      L2: { total: 0, withWeapons: 0 },
      L3: { total: 0, withWeapons: 0 },
      L4: { total: 0, withWeapons: 0 },
      weapons: {}
    };
    
    data.specialties?.forEach(spec => {
      spec.variations?.forEach(vari => {
        vari.original_pool?.forEach(p => {
          // 获取难度级别
          let level = p.level || p.meta?.level || 'L2';
          if (p.id && p.id.includes('_L2')) level = 'L2';
          if (p.id && p.id.includes('_L3')) level = 'L3';
          if (p.id && p.id.includes('_L4')) level = 'L4';
          
          allStats[motif].total++;
          allStats[motif][level].total++;
          
          // 获取武器
          const weapons = p.weapons || p.meta?.weapons || [];
          
          if (weapons.length > 0) {
            allStats[motif].withWeapons++;
            allStats[motif][level].withWeapons++;
            
            weapons.forEach(w => {
              if (!allStats[motif].weapons[w]) allStats[motif].weapons[w] = 0;
              allStats[motif].weapons[w]++;
              
              if (!allWeapons[w]) allWeapons[w] = { count: 0, motifs: [] };
              allWeapons[w].count++;
              if (!allWeapons[w].motifs.includes(motif)) allWeapons[w].motifs.push(motif);
            });
          }
        });
      });
    });
    
  } catch (e) {
    console.log(`${motif}: 读取失败 - ${e.message}`);
  }
}

// 输出各母题统计
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║              各母题杀手锏使用统计                            ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

let grandTotal = 0;
let grandWithWeapons = 0;

for (const motif of motifFiles) {
  const s = allStats[motif];
  const coverage = s.total > 0 ? (s.withWeapons / s.total * 100).toFixed(1) : 0;
  const weaponCount = Object.keys(s.weapons).length;
  
  grandTotal += s.total;
  grandWithWeapons += s.withWeapons;
  
  console.log(`\n📁 ${motif} ${s.name}`);
  console.log(`   总题目: ${s.total} 道`);
  console.log(`   有杀手锏: ${s.withWeapons} 道 (覆盖率: ${coverage}%)`);
  console.log(`   杀手锏种类: ${weaponCount} 个`);
  
  // 输出各难度级别
  const l2Rate = s.L2.total > 0 ? (s.L2.withWeapons / s.L2.total * 100).toFixed(0) : 0;
  const l3Rate = s.L3.total > 0 ? (s.L3.withWeapons / s.L3.total * 100).toFixed(0) : 0;
  const l4Rate = s.L4.total > 0 ? (s.L4.withWeapons / s.L4.total * 100).toFixed(0) : 0;
  console.log(`   L2: ${s.L2.total}道 (${l2Rate}%) | L3: ${s.L3.total}道 (${l3Rate}%) | L4: ${s.L4.total}道 (${l4Rate}%)`);
  
  // 输出杀手锏列表
  if (weaponCount > 0) {
    const sortedWeapons = Object.entries(s.weapons).sort((a, b) => b[1] - a[1]);
    console.log(`   杀手锏:`);
    sortedWeapons.forEach(([w, count]) => {
      const detail = weaponDetails[w];
      const name = detail?.coreLogic?.substring(0, 30) || w;
      console.log(`     ${w}: ${count}道 - ${name}...`);
    });
  }
}

// 汇总
console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
console.log('║                      总体统计                                ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const grandCoverage = grandTotal > 0 ? (grandWithWeapons / grandTotal * 100).toFixed(1) : 0;
console.log(`总题目数: ${grandTotal} 道`);
console.log(`有杀手锏: ${grandWithWeapons} 道 (覆盖率: ${grandCoverage}%)`);
console.log(`杀手锏种类: ${Object.keys(allWeapons).length} 种`);

// 杀手锏使用排行
console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
console.log('║              杀手锏使用排行榜                                ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const sortedAllWeapons = Object.entries(allWeapons).sort((a, b) => b[1].count - a[1].count);
sortedAllWeapons.forEach(([w, info], index) => {
  const detail = weaponDetails[w];
  const name = detail?.coreLogic?.substring(0, 40) || w;
  console.log(`${index + 1}. ${w}: ${info.count}道 - ${name}...`);
  console.log(`   涉及: ${info.motifs.join(', ')}`);
});
