import fs from 'fs';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         M01-M09 杀手锏配置审计报告 v2.0                      ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const motifFiles = ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09'];
const allWeapons = {};
const allStrategyHints = {};
const motifStats = {};
const missingWeapons = new Set();

for (const motif of motifFiles) {
  try {
    const data = JSON.parse(fs.readFileSync(`./src/data/${motif}.json`, 'utf8'));
    
    motifStats[motif] = {
      name: data.motif_name,
      totalProblems: 0,
      weapons: {},
      strategyHints: {},
      problemsWithWeapons: 0,
      problemsWithHints: 0
    };
    
    data.specialties?.forEach(spec => {
      spec.variations?.forEach(vari => {
        vari.original_pool?.forEach(p => {
          motifStats[motif].totalProblems++;
          
          // 检查 weapons 字段（直接在题目上或在 meta 中）
          const weapons = p.weapons || p.meta?.weapons || [];
          if (weapons.length > 0) {
            motifStats[motif].problemsWithWeapons++;
          }
          weapons.forEach(w => {
            if (!motifStats[motif].weapons[w]) motifStats[motif].weapons[w] = 0;
            motifStats[motif].weapons[w]++;
            
            if (!allWeapons[w]) allWeapons[w] = { count: 0, motifs: [] };
            allWeapons[w].count++;
            if (!allWeapons[w].motifs.includes(motif)) allWeapons[w].motifs.push(motif);
          });
          
          // 检查 strategy_hint 字段
          const hint = p.strategy_hint || p.key_points?.[0] || '';
          if (hint && hint.includes('模型：')) {
            motifStats[motif].problemsWithHints++;
            const hintKey = hint.replace('模型：', '').trim();
            if (!motifStats[motif].strategyHints[hintKey]) motifStats[motif].strategyHints[hintKey] = 0;
            motifStats[motif].strategyHints[hintKey]++;
            
            if (!allStrategyHints[hintKey]) allStrategyHints[hintKey] = { count: 0, motifs: [] };
            allStrategyHints[hintKey].count++;
            if (!allStrategyHints[hintKey].motifs.includes(motif)) allStrategyHints[hintKey].motifs.push(motif);
          }
          
          // 检查 tags 字段（M07风格）
          const tags = p.tags || [];
          tags.forEach(t => {
            if (t.startsWith('S-')) {
              if (!motifStats[motif].weapons[t]) motifStats[motif].weapons[t] = 0;
              motifStats[motif].weapons[t]++;
              
              if (!allWeapons[t]) allWeapons[t] = { count: 0, motifs: [] };
              allWeapons[t].count++;
              if (!allWeapons[t].motifs.includes(motif)) allWeapons[t].motifs.push(motif);
            }
          });
        });
      });
    });
    
    console.log(`\n📁 ${motif} ${data.motif_name}`);
    console.log(`   总题目: ${motifStats[motif].totalProblems} 道`);
    console.log(`   有武器配置: ${motifStats[motif].problemsWithWeapons} 道`);
    console.log(`   有策略提示: ${motifStats[motif].problemsWithHints} 道`);
    
    const weaponEntries = Object.entries(motifStats[motif].weapons);
    if (weaponEntries.length > 0) {
      console.log(`   杀手锏使用:`);
      weaponEntries.sort((a, b) => b[1] - a[1]).forEach(([w, count]) => {
        console.log(`     ${w}: ${count} 道`);
      });
    }
    
  } catch (e) {
    console.log(`\n📁 ${motif}: 文件读取失败 - ${e.message}`);
  }
}

// 全局武器统计
console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
console.log('║                    全局杀手锏统计                            ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const sortedWeapons = Object.entries(allWeapons).sort((a, b) => b[1].count - a[1].count);
sortedWeapons.forEach(([w, info]) => {
  console.log(`${w}: ${info.count} 道 (涉及: ${info.motifs.join(', ')})`);
});

// 检查 strategy_lib.json
console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
console.log('║              strategy_lib.json 武器库检查                    ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

try {
  const strategyLib = JSON.parse(fs.readFileSync('./src/data/strategy_lib.json', 'utf8'));
  
  const libWeapons = new Set();
  // 修正：strategy_lib.json 结构是 { categories: [...] }
  const categories = strategyLib.categories || strategyLib;
  
  if (Array.isArray(categories)) {
    categories.forEach(category => {
      category.weapons?.forEach(w => {
        libWeapons.add(w.id);
      });
    });
  }
  
  console.log(`武器库中共有 ${libWeapons.size} 个武器\n`);
  
  console.log('检查武器是否在库:');
  const missingList = [];
  sortedWeapons.forEach(([w, info]) => {
    if (libWeapons.has(w)) {
      console.log(`  ✅ ${w} 已入库`);
    } else {
      console.log(`  ❌ ${w} 未入库！需要添加 (${info.count}道题使用)`);
      missingList.push(w);
      missingWeapons.add(w);
    }
  });
  
  if (missingList.length > 0) {
    console.log(`\n⚠️  缺失武器汇总: ${missingList.join(', ')}`);
  }
  
} catch (e) {
  console.log(`strategy_lib.json 读取失败: ${e.message}`);
}

// 统计 strategy_hint 中的模型
console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
console.log('║           strategy_hint 模型统计（潜在杀手锏）               ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const sortedHints = Object.entries(allStrategyHints).sort((a, b) => b[1].count - a[1].count);
sortedHints.slice(0, 30).forEach(([h, info]) => {
  console.log(`${h}: ${info.count} 道 (涉及: ${info.motifs.join(', ')})`);
});

// 输出统计汇总
console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
console.log('║                      审计总结                                ║');
console.log('╚══════════════════════════════════════════════════════════════╝');

let totalProblems = 0;
let totalWithWeapons = 0;
let totalWithHints = 0;
Object.values(motifStats).forEach(s => {
  totalProblems += s.totalProblems;
  totalWithWeapons += s.problemsWithWeapons;
  totalWithHints += s.problemsWithHints;
});

console.log(`\n总题目数: ${totalProblems} 道`);
console.log(`有武器配置: ${totalWithWeapons} 道 (${(totalWithWeapons/totalProblems*100).toFixed(1)}%)`);
console.log(`有策略提示: ${totalWithHints} 道 (${(totalWithHints/totalProblems*100).toFixed(1)}%)`);
console.log(`武器种类: ${sortedWeapons.length} 种`);
console.log(`缺失武器: ${missingWeapons.size} 种`);
