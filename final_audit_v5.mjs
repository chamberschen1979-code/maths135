import fs from 'fs';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         M01-M09 杀手锏全面审计报告 v5.0                      ║');
console.log('║         L2 题目不继承变例级杀手锏                             ║');
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
      weapons: {},
      variationWeapons: {}
    };
    
    data.specialties?.forEach(spec => {
      spec.variations?.forEach(vari => {
        // 获取变例级别的杀手锏
        const variWeapons = vari.toolkit?.linked_weapons || [];
        
        // 记录变例级别的杀手锏
        variWeapons.forEach(w => {
          if (!allStats[motif].variationWeapons[w]) allStats[motif].variationWeapons[w] = 0;
          allStats[motif].variationWeapons[w]++;
        });
        
        vari.original_pool?.forEach(p => {
          // 获取难度级别
          let level = p.level || p.meta?.level || 'L2';
          if (p.id && p.id.includes('_L2')) level = 'L2';
          if (p.id && p.id.includes('_L3')) level = 'L3';
          if (p.id && p.id.includes('_L4')) level = 'L4';
          
          allStats[motif].total++;
          allStats[motif][level].total++;
          
          // 获取武器 - L2 题目不继承变例级别武器
          let weapons = [];
          
          // 1. 题目直接的 weapons 字段
          if (p.weapons && p.weapons.length > 0) {
            weapons = p.weapons;
          }
          // 2. meta.weapons 字段
          else if (p.meta?.weapons && p.meta.weapons.length > 0) {
            weapons = p.meta.weapons;
          }
          // 3. 只有 L3/L4 题目才能从变例级别继承
          else if (level !== 'L2' && variWeapons.length > 0) {
            weapons = variWeapons;
          }
          
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
  const variWeaponCount = Object.keys(s.variationWeapons).length;
  
  grandTotal += s.total;
  grandWithWeapons += s.withWeapons;
  
  console.log(`\n📁 ${motif} ${s.name}`);
  console.log(`   总题目: ${s.total} 道`);
  console.log(`   有杀手锏: ${s.withWeapons} 道 (覆盖率: ${coverage}%)`);
  console.log(`   题目级杀手锏种类: ${weaponCount} 个 | 变例级杀手锏种类: ${variWeaponCount} 个`);
  
  // 输出各难度级别
  const l2Rate = s.L2.total > 0 ? (s.L2.withWeapons / s.L2.total * 100).toFixed(0) : 0;
  const l3Rate = s.L3.total > 0 ? (s.L3.withWeapons / s.L3.total * 100).toFixed(0) : 0;
  const l4Rate = s.L4.total > 0 ? (s.L4.withWeapons / s.L4.total * 100).toFixed(0) : 0;
  console.log(`   L2: ${s.L2.total}道 (${l2Rate}%) | L3: ${s.L3.total}道 (${l3Rate}%) | L4: ${s.L4.total}道 (${l4Rate}%)`);
  
  // 输出变例级杀手锏
  if (variWeaponCount > 0) {
    console.log(`   变例级杀手锏: ${Object.keys(s.variationWeapons).join(', ')}`);
  }
  
  // 输出题目级杀手锏列表
  if (weaponCount > 0) {
    const sortedWeapons = Object.entries(s.weapons).sort((a, b) => b[1] - a[1]);
    console.log(`   题目级杀手锏分布:`);
    sortedWeapons.slice(0, 5).forEach(([w, count]) => {
      console.log(`     ${w}: ${count}道`);
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

// 难度级别统计
let l2Total = 0, l2WithWeapons = 0;
let l3Total = 0, l3WithWeapons = 0;
let l4Total = 0, l4WithWeapons = 0;

Object.values(allStats).forEach(s => {
  l2Total += s.L2.total;
  l2WithWeapons += s.L2.withWeapons;
  l3Total += s.L3.total;
  l3WithWeapons += s.L3.withWeapons;
  l4Total += s.L4.total;
  l4WithWeapons += s.L4.withWeapons;
});

console.log(`\n难度级别分布:`);
console.log(`  L2 基础题: ${l2WithWeapons}/${l2Total} (${(l2WithWeapons/l2Total*100).toFixed(1)}%)`);
console.log(`  L3 进阶题: ${l3WithWeapons}/${l3Total} (${(l3WithWeapons/l3Total*100).toFixed(1)}%)`);
console.log(`  L4 巅峰题: ${l4WithWeapons}/${l4Total} (${(l4WithWeapons/l4Total*100).toFixed(1)}%)`);

// 杀手锏使用排行
console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
console.log('║              杀手锏使用排行榜 TOP 15                         ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const sortedAllWeapons = Object.entries(allWeapons).sort((a, b) => b[1].count - a[1].count);
sortedAllWeapons.slice(0, 15).forEach(([w, info], index) => {
  const detail = weaponDetails[w];
  const name = detail?.coreLogic?.substring(0, 40) || w;
  console.log(`${index + 1}. ${w}: ${info.count}道 - ${name}...`);
  console.log(`   涉及: ${info.motifs.join(', ')}`);
});
