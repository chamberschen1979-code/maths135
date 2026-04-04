import fs from 'fs';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         杀手锏整改方案执行                                    ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const motifFiles = ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09'];

let stats = {
  l2Cleared: 0,
  l3Configured: 0,
  l4Adjusted: 0
};

for (const motif of motifFiles) {
  const data = JSON.parse(fs.readFileSync(`./src/data/${motif}.json`, 'utf8'));
  
  data.specialties?.forEach(spec => {
    spec.variations?.forEach(vari => {
      vari.original_pool?.forEach(p => {
        // 获取难度级别
        let level = p.level || p.meta?.level || 'L2';
        if (p.id && p.id.includes('_L2')) level = 'L2';
        if (p.id && p.id.includes('_L3')) level = 'L3';
        if (p.id && p.id.includes('_L4')) level = 'L4';
        
        const problem = (p.problem || '') + ' ' + (p.strategy_hint || '');
        
        // 1. L2 题目"去武器化"
        if (level === 'L2' && p.weapons && p.weapons.length > 0) {
          p.weapons = [];
          stats.l2Cleared++;
        }
        
        // 2. L3 题目配置 S-LOG-03（比较大小/恒成立类）
        if (level === 'L3') {
          const isCompareOrHengChengLi = 
            problem.includes('比较') || 
            problem.includes('大小') ||
            problem.includes('恒成立') ||
            problem.includes('ab') && problem.includes('ba') ||
            problem.includes('a^b') || problem.includes('aᵇ');
          
          if (isCompareOrHengChengLi) {
            if (!p.weapons) p.weapons = [];
            if (!p.weapons.includes('S-LOG-03')) {
              p.weapons.push('S-LOG-03');
              stats.l3Configured++;
            }
          }
        }
        
        // 3. L4 题目调整：保留 S-LOG-02，剔除 S-LOG-05
        if (level === 'L4' && p.weapons) {
          if (p.weapons.includes('S-LOG-05')) {
            p.weapons = p.weapons.filter(w => w !== 'S-LOG-05');
            stats.l4Adjusted++;
          }
        }
      });
    });
  });
  
  fs.writeFileSync(`./src/data/${motif}.json`, JSON.stringify(data, null, 2), 'utf8');
}

console.log('【执行结果】\n');
console.log(`1. L2 题目"去武器化": 清空了 ${stats.l2Cleared} 道 L2 题目的武器`);
console.log(`2. L3 题目配置 S-LOG-03: 配置了 ${stats.l3Configured} 道比较大小/恒成立类题目`);
console.log(`3. L4 题目调整: 剔除了 ${stats.l4Adjusted} 处 S-LOG-05`);

console.log('\n完成！杀手锏配置已按整改方案调整。');
