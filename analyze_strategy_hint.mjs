import fs from 'fs';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         strategy_hint 字段内容分析                           ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const motifFiles = ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09'];

const allHints = [];
const hintPatterns = {};

for (const motif of motifFiles) {
  const data = JSON.parse(fs.readFileSync(`./src/data/${motif}.json`, 'utf8'));
  
  data.specialties?.forEach(spec => {
    spec.variations?.forEach(vari => {
      vari.original_pool?.forEach(p => {
        if (p.strategy_hint) {
          allHints.push({
            motif,
            id: p.id,
            hint: p.strategy_hint,
            weapons: p.weapons || []
          });
          
          // 分析模式
          const hint = p.strategy_hint;
          if (hint.includes('模型：')) {
            const model = hint.replace('模型：', '').split('#')[0].trim();
            if (!hintPatterns[model]) hintPatterns[model] = 0;
            hintPatterns[model]++;
          } else if (hint.includes('法')) {
            const method = hint.match(/[^，。]+法/)?.[0] || hint.substring(0, 20);
            if (!hintPatterns[method]) hintPatterns[method] = 0;
            hintPatterns[method]++;
          } else {
            const key = hint.substring(0, 30);
            if (!hintPatterns[key]) hintPatterns[key] = 0;
            hintPatterns[key]++;
          }
        }
      });
    });
  });
}

console.log(`strategy_hint 总数: ${allHints.length} 条\n`);

console.log('【常见模式 TOP 20】\n');
const sortedPatterns = Object.entries(hintPatterns).sort((a, b) => b[1] - a[1]);
sortedPatterns.slice(0, 20).forEach(([pattern, count], index) => {
  console.log(`${index + 1}. ${pattern}: ${count} 次`);
});

console.log('\n\n【示例内容】\n');
const samples = allHints.slice(0, 15);
samples.forEach(s => {
  console.log(`${s.id}:`);
  console.log(`  strategy_hint: ${s.hint}`);
  console.log(`  weapons: ${s.weapons.join(', ') || '(无)'}`);
  console.log('');
});

// 分析 strategy_hint 与 weapons 的关系
console.log('\n【strategy_hint 与 weapons 关系分析】\n');
const withWeapons = allHints.filter(h => h.weapons.length > 0);
const withoutWeapons = allHints.filter(h => h.weapons.length === 0);

console.log(`有 strategy_hint 且有 weapons: ${withWeapons.length} 条`);
console.log(`有 strategy_hint 但无 weapons: ${withoutWeapons.length} 条`);

if (withoutWeapons.length > 0) {
  console.log('\n无 weapons 的 strategy_hint 示例:');
  withoutWeapons.slice(0, 10).forEach(s => {
    console.log(`  ${s.id}: ${s.hint}`);
  });
}
