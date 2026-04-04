import fs from 'fs';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         M01-M09 杀手锏配置审计报告 v3.0                      ║');
console.log('║         按难度级别分析杀手锏分布                              ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const motifFiles = ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09'];

// 读取 weapon_details.json
let weaponDetails = {};
try {
  weaponDetails = JSON.parse(fs.readFileSync('./src/data/weapon_details.json', 'utf8'));
} catch (e) {
  console.log('weapon_details.json 读取失败');
}

// 统计
const stats = {
  total: { L2: 0, L3: 0, L4: 0 },
  withWeapons: { L2: 0, L3: 0, L4: 0 },
  byMotif: {}
};

for (const motif of motifFiles) {
  try {
    const data = JSON.parse(fs.readFileSync(`./src/data/${motif}.json`, 'utf8'));
    
    stats.byMotif[motif] = {
      name: data.motif_name,
      L2: { total: 0, withWeapons: 0, weapons: {} },
      L3: { total: 0, withWeapons: 0, weapons: {} },
      L4: { total: 0, withWeapons: 0, weapons: {} }
    };
    
    data.specialties?.forEach(spec => {
      spec.variations?.forEach(vari => {
        vari.original_pool?.forEach(p => {
          // 获取难度级别
          let level = p.level || p.meta?.level || 'L2';
          if (p.id && p.id.includes('_L2')) level = 'L2';
          if (p.id && p.id.includes('_L3')) level = 'L3';
          if (p.id && p.id.includes('_L4')) level = 'L4';
          
          // 获取武器
          const weapons = p.weapons || p.meta?.weapons || [];
          
          stats.total[level]++;
          stats.byMotif[motif][level].total++;
          
          if (weapons.length > 0) {
            stats.withWeapons[level]++;
            stats.byMotif[motif][level].withWeapons++;
            
            weapons.forEach(w => {
              if (!stats.byMotif[motif][level].weapons[w]) {
                stats.byMotif[motif][level].weapons[w] = 0;
              }
              stats.byMotif[motif][level].weapons[w]++;
            });
          }
        });
      });
    });
    
  } catch (e) {
    console.log(`${motif}: 读取失败 - ${e.message}`);
  }
}

// 输出报告
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║              各难度级别杀手锏使用统计                        ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log(`L2 基础题: ${stats.withWeapons.L2}/${stats.total.L2} 道有杀手锏 (${(stats.withWeapons.L2/stats.total.L2*100).toFixed(1)}%)`);
console.log(`L3 进阶题: ${stats.withWeapons.L3}/${stats.total.L3} 道有杀手锏 (${(stats.withWeapons.L3/stats.total.L3*100).toFixed(1)}%)`);
console.log(`L4 巅峰题: ${stats.withWeapons.L4}/${stats.total.L4} 道有杀手锏 (${(stats.withWeapons.L4/stats.total.L4*100).toFixed(1)}%)`);

console.log('\n⚠️  问题分析:');
if (stats.withWeapons.L2 > stats.total.L2 * 0.2) {
  console.log(`   ❌ L2 基础题杀手锏过多！应该宁缺毋滥，L2题主要考查基本方法`);
}
if (stats.withWeapons.L3 < stats.total.L3 * 0.5) {
  console.log(`   ⚠️  L3 进阶题杀手锏覆盖率偏低，建议审视`);
}
if (stats.withWeapons.L4 < stats.total.L4 * 0.7) {
  console.log(`   ⚠️  L4 巅峰题杀手锏覆盖率偏低，建议审视`);
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║              各模块 L2 题目杀手锏详情                        ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

for (const motif of motifFiles) {
  const m = stats.byMotif[motif];
  if (m.L2.withWeapons > 0) {
    console.log(`\n📁 ${motif} ${m.name}`);
    console.log(`   L2题: ${m.L2.total} 道, ${m.L2.withWeapons} 道有杀手锏`);
    const weapons = Object.entries(m.L2.weapons).sort((a, b) => b[1] - a[1]);
    weapons.forEach(([w, count]) => {
      const detail = weaponDetails[w];
      const name = detail?.name || w;
      console.log(`     ${w}: ${count} 道`);
      if (detail) {
        console.log(`       → ${detail.coreLogic?.substring(0, 50)}...`);
      }
    });
  }
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║              各模块 L3/L4 题目杀手锏详情                     ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

for (const motif of motifFiles) {
  const m = stats.byMotif[motif];
  if (m.L3.withWeapons > 0 || m.L4.withWeapons > 0) {
    console.log(`\n📁 ${motif} ${m.name}`);
    if (m.L3.withWeapons > 0) {
      console.log(`   L3题: ${m.L3.total} 道, ${m.L3.withWeapons} 道有杀手锏`);
      const weapons = Object.entries(m.L3.weapons).sort((a, b) => b[1] - a[1]);
      weapons.slice(0, 3).forEach(([w, count]) => {
        console.log(`     ${w}: ${count} 道`);
      });
    }
    if (m.L4.withWeapons > 0) {
      console.log(`   L4题: ${m.L4.total} 道, ${m.L4.withWeapons} 道有杀手锏`);
      const weapons = Object.entries(m.L4.weapons).sort((a, b) => b[1] - a[1]);
      weapons.slice(0, 3).forEach(([w, count]) => {
        console.log(`     ${w}: ${count} 道`);
      });
    }
  }
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║                      审计建议                                ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');
console.log('1. L2 基础题：杀手锏应该极少，主要考查基本概念和基本方法');
console.log('2. L3 进阶题：适度使用杀手锏，体现技巧性');
console.log('3. L4 巅峰题：杀手锏是核心，体现高考实战价值');
console.log('4. 宁缺毋滥：不是所有技巧都叫杀手锏，要有实战价值');
