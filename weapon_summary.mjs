import fs from 'fs';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         各母题杀手锏配置统计                                  ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const motifFiles = ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09'];

// 读取 weapon_details.json
let weaponDetails = {};
try {
  weaponDetails = JSON.parse(fs.readFileSync('./src/data/weapon_details.json', 'utf8'));
} catch (e) {}

const allWeapons = {};
const results = [];

for (const motif of motifFiles) {
  const data = JSON.parse(fs.readFileSync(`./src/data/${motif}.json`, 'utf8'));
  
  const weapons = {};
  let totalProblems = 0;
  let problemsWithWeapons = 0;
  
  data.specialties?.forEach(spec => {
    spec.variations?.forEach(vari => {
      vari.original_pool?.forEach(p => {
        totalProblems++;
        
        if (p.weapons && p.weapons.length > 0) {
          problemsWithWeapons++;
          p.weapons.forEach(w => {
            if (!weapons[w]) weapons[w] = 0;
            weapons[w]++;
            
            if (!allWeapons[w]) allWeapons[w] = { count: 0, motifs: [] };
            allWeapons[w].count++;
            if (!allWeapons[w].motifs.includes(motif)) allWeapons[w].motifs.push(motif);
          });
        }
      });
    });
  });
  
  const weaponList = Object.entries(weapons).sort((a, b) => b[1] - a[1]);
  
  results.push({
    motif,
    name: data.motif_name,
    totalProblems,
    problemsWithWeapons,
    weaponCount: weaponList.length,
    weapons: weaponList
  });
}

// 输出表格
console.log('【各母题杀手锏配置汇总】\n');
console.log('| 母题 | 名称 | 杀手锏种类 | 有杀手锏题目 | 覆盖率 |');
console.log('|------|------|-----------|-------------|--------|');

results.forEach(r => {
  const rate = (r.problemsWithWeapons / r.totalProblems * 100).toFixed(1);
  console.log(`| ${r.motif} | ${r.name} | ${r.weaponCount} 种 | ${r.problemsWithWeapons}/${r.totalProblems} | ${rate}% |`);
});

console.log(`\n**总计: ${Object.keys(allWeapons).length} 种杀手锏**\n`);

// 详细列表
console.log('\n【各母题杀手锏详细列表】\n');

results.forEach(r => {
  console.log(`\n### ${r.motif} ${r.name}`);
  console.log(`杀手锏种类: ${r.weaponCount} 种\n`);
  
  if (r.weapons.length > 0) {
    r.weapons.forEach(([w, count]) => {
      const detail = weaponDetails[w];
      const name = detail?.coreLogic?.substring(0, 40) || '(未定义)';
      console.log(`- ${w}: ${count} 道 - ${name}...`);
    });
  } else {
    console.log('(无杀手锏配置)');
  }
});

// 杀手锏使用总览
console.log('\n\n【杀手锏使用总览】\n');
const sortedWeapons = Object.entries(allWeapons).sort((a, b) => b[1].count - a[1].count);

sortedWeapons.forEach(([w, info]) => {
  const detail = weaponDetails[w];
  const name = detail?.coreLogic?.substring(0, 50) || '(未定义)';
  console.log(`${w}: ${info.count} 道 (${info.motifs.join(', ')})`);
  console.log(`  ${name}...`);
});
