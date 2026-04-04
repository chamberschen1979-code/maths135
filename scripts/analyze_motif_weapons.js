import fs from 'fs';

const weaponDetailsPath = './src/data/weapon_details.json';
const weaponDetails = JSON.parse(fs.readFileSync(weaponDetailsPath, 'utf-8'));

// 母题与杀手锏的映射关系
const motifWeaponMapping = {
  'M01': { name: '集合与逻辑', weapons: ['S-SET-01', 'S-SET-02', 'S-COMP-01'] },
  'M02': { name: '不等式', weapons: ['S-INEQ-02', 'S-INEQ-05', 'S-INEQ-06', 'S-INEQ-07', 'S-INEQ-08', 'S-INEQ-09', 'S-INEQ-10'] },
  'M03': { name: '函数', weapons: ['S-FUNC-02', 'S-FUNC-04', 'S-FUNC-05', 'S-FUNC-06', 'S-FUNC-08'] },
  'M04': { name: '指对数', weapons: ['S-LOG-01', 'S-LOG-02', 'S-LOG-03', 'S-LOG-04', 'S-LOG-05'] },
  'M05': { name: '平面向量', weapons: ['S-VEC-01', 'S-VEC-02', 'S-VEC-03', 'S-VEC-04', 'S-VEC-05'] },
  'M06': { name: '三角函数', weapons: ['S-TRIG-01', 'S-TRIG-02', 'S-TRIG-03'] },
  'M07': { name: '解三角形', weapons: ['S-TRI-02', 'S-TRI-04'] },
  'M08': { name: '数列', weapons: ['S-SEQ-01', 'S-SEQ-02', 'S-SEQ-04', 'S-SEQ-08', 'S-SEQ-09', 'S-SEQ-10'] },
  'M09': { name: '立体几何', weapons: ['S-GEO-02', 'S-GEO-03'] },
  'M10': { name: '解析几何', weapons: ['S-CONIC-01', 'S-CONIC-02', 'S-CONIC-03', 'S-CONIC-05', 'S-CONIC-06', 'S-CONIC-07'] },
  'M11': { name: '导数', weapons: ['S-DERIV-03', 'S-DERIV-04', 'S-DERIV-09', 'S-DERIV-10', 'S-DERIV-11'] },
  'M12': { name: '概率统计', weapons: ['S-PROB-01'] },
};

console.log('=== 各母题杀手锏分布分析 ===\n');

// 统计每个母题的杀手锏数量
const stats = [];
for (const [motifId, info] of Object.entries(motifWeaponMapping)) {
  const validWeapons = info.weapons.filter(w => weaponDetails[w]);
  const level1Count = validWeapons.filter(w => {
    const wInfo = weaponDetails[w];
    return ['换底公式', '定义域', '定点', '定义降维', '渐近线', '端点验证', '复数模', 'SSA判定'].some(k => wInfo?.coreLogic?.includes(k));
  }).length;
  
  stats.push({
    motifId,
    name: info.name,
    total: validWeapons.length,
    level1: level1Count,
    level2plus: validWeapons.length - level1Count,
    weapons: validWeapons
  });
}

// 按杀手锏数量排序
stats.sort((a, b) => b.total - a.total);

console.log('【各母题杀手锏数量】\n');
console.log('| 母题 | 名称 | 杀手锏数 | Level 1 | Level 2+ |');
console.log('|------|------|----------|---------|----------|');
stats.forEach(s => {
  console.log(`| ${s.motifId} | ${s.name} | ${s.total} | ${s.level1} | ${s.level2plus} |`);
});

// 分析 M04 为什么杀手锏多
console.log('\n\n【M04 杀手锏多的原因分析】\n');
const m04Stats = stats.find(s => s.motifId === 'M04');
console.log(`M04（${m04Stats.name}）有 ${m04Stats.total} 个杀手锏：`);
m04Stats.weapons.forEach(w => {
  const wInfo = weaponDetails[w];
  console.log(`  - ${w}: ${wInfo?.coreLogic?.substring(0, 40) || '未知'}...`);
});

console.log('\n问题：M04 的杀手锏包含了其他模块的内容！');
console.log('例如：');
console.log('  - S-FUNC-xx 属于 M03（函数模块）');
console.log('  - S-DERIV-xx 属于 M11（导数模块）');
console.log('  - S-INEQ-xx 属于 M02（不等式模块）');
console.log('  - S-SEQ-xx 属于 M08（数列模块）');

// 分析 M05 为什么杀手锏少
console.log('\n\n【M05 杀手锏少的原因分析】\n');
const m05Stats = stats.find(s => s.motifId === 'M05');
console.log(`M05（${m05Stats.name}）有 ${m05Stats.total} 个杀手锏：`);
m05Stats.weapons.forEach(w => {
  const wInfo = weaponDetails[w];
  console.log(`  - ${w}: ${wInfo?.coreLogic?.substring(0, 40) || '未知'}...`);
});

console.log('\n原因：向量模块的方法相对集中，主要是：');
console.log('  1. 投影向量（基础）');
console.log('  2. 极化恒等式（核心技巧）');
console.log('  3. 线性运算/三点共线（基础）');
console.log('  4. 建系策略（通用方法）');
console.log('  5. 奔驰定理（高级技巧）');

// 建议调整
console.log('\n\n【建议调整】\n');
console.log('问题：M04 的题目匹配了太多其他模块的杀手锏');
console.log('原因：M04 题目涉及函数、导数、不等式等综合应用');
console.log('\n解决方案：');
console.log('1. 严格按母题分配杀手锏');
console.log('   - M04 只匹配 S-LOG-xx 系列（指对数专用）');
console.log('   - M03 匹配 S-FUNC-xx 系列');
console.log('   - M11 匹配 S-DERIV-xx 系列');
console.log('\n2. 或者接受跨模块使用');
console.log('   - M04 题目确实会用到函数、导数技巧');
console.log('   - 允许跨模块匹配，但标注主要模块');

console.log('\n\n【修正后的各母题杀手锏数量】\n');
console.log('如果严格按模块分配：');
console.log('| 母题 | 杀手锏数 |');
console.log('|------|----------|');
stats.forEach(s => {
  console.log(`| ${s.motifId} (${s.name}) | ${s.level2plus} 个 |`);
});
