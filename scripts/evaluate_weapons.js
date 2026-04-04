import fs from 'fs';

const weaponDetailsPath = './src/data/weapon_details.json';
const weaponDetails = JSON.parse(fs.readFileSync(weaponDetailsPath, 'utf-8'));

console.log('=== 杀手锏审视报告（125分+标准）===\n');
console.log('【定义】杀手锏 = 能够"通杀中档题"和"攻克压轴题"的高级方法和工具');
console.log('【排除】基础技能、基础概念、常规方法\n');

// 定义杀手锏评级标准
const evaluationCriteria = {
  // 符合125分+标准的特征
  advancedFeatures: [
    '秒杀', '降维', '放缩', '同构', '变换',
    '不等式', '极值', '偏移', '构造', '转化',
    '配方', '换元', '参数', '嵌套', '复合'
  ],
  
  // 基础技能关键词（不符合标准）
  basicKeywords: [
    '定义', '公式', '计算', '求解', '求值',
    '基础', '直接', '简单', '常规', '标准'
  ]
};

// 评估每个杀手锏
const evaluations = [];

for (const [id, weapon] of Object.entries(weaponDetails)) {
  const coreLogic = weapon.coreLogic || '';
  const scenarios = weapon.scenarios || [];
  const pitfalls = weapon.pitfalls || [];
  const content = `${coreLogic} ${scenarios.join(' ')} ${pitfalls.join(' ')}`;
  
  // 计算高级特征匹配
  let advancedScore = 0;
  for (const feature of evaluationCriteria.advancedFeatures) {
    if (content.includes(feature)) {
      advancedScore++;
    }
  }
  
  // 计算基础特征匹配
  let basicScore = 0;
  for (const keyword of evaluationCriteria.basicKeywords) {
    if (content.includes(keyword)) {
      basicScore++;
    }
  }
  
  // 判断是否符合125分+标准
  let rating = '';
  let reason = '';
  
  // 特殊判断
  const isAdvanced = [
    'S-VEC-02', 'S-VEC-05',  // 极化恒等式
    'S-DERIV-09', 'S-DERIV-10', 'S-DERIV-11',  // 高级导数
    'S-CONIC-05', 'S-CONIC-06', 'S-CONIC-07',  // 高级圆锥曲线
    'S-INEQ-05', 'S-INEQ-06', 'S-INEQ-07', 'S-INEQ-08', 'S-INEQ-09',  // 高级不等式
    'S-LOG-02', 'S-LOG-05',  // 高级对数
    'S-FUNC-08',  // 复合零点
    'S-SEQ-08', 'S-SEQ-09', 'S-SEQ-10',  // 高级数列
  ].includes(id);
  
  const isBasic = [
    'S-LOG-01',  // 换底公式 - 基础
    'S-LOG-03',  // 定点问题 - 基础
    'S-LOG-04',  // 对数定义域 - 基础
    'S-SET-01',  // 空集子集 - 基础概念
    'S-SET-02',  // 端点验证 - 基础
    'S-COMP-01', // 复数基础 - 基础
  ].includes(id);
  
  if (isAdvanced || advancedScore >= 2) {
    rating = '✅ 符合';
    reason = `高级技巧，能秒杀中档题/压轴题`;
  } else if (isBasic || basicScore >= 2) {
    rating = '❌ 不符合';
    reason = `基础技能/常规方法，不属于杀手锏`;
  } else if (advancedScore >= 1) {
    rating = '⚠️ 边缘';
    reason = `有一定技巧性，但可能不够高级`;
  } else {
    rating = '⚠️ 待评估';
    reason = `需要人工判断`;
  }
  
  evaluations.push({
    id,
    name: weapon.coreLogic?.substring(0, 30) || '未知',
    rating,
    reason,
    advancedScore,
    basicScore
  });
}

// 分类输出
const passed = evaluations.filter(e => e.rating === '✅ 符合');
const failed = evaluations.filter(e => e.rating === '❌ 不符合');
const borderline = evaluations.filter(e => e.rating === '⚠️ 边缘' || e.rating === '⚠️ 待评估');

console.log('【✅ 符合125分+标准的杀手锏】\n');
passed.forEach(e => {
  console.log(`  ${e.id}: ${e.name}...`);
  console.log(`    评价: ${e.reason}\n`);
});

console.log(`\n【❌ 不符合标准的（应移除或降级）】\n`);
failed.forEach(e => {
  console.log(`  ${e.id}: ${e.name}...`);
  console.log(`    评价: ${e.reason}\n`);
});

console.log(`\n【⚠️ 需要人工判断的】\n`);
borderline.forEach(e => {
  console.log(`  ${e.id}: ${e.name}...`);
  console.log(`    高级特征: ${e.advancedScore}, 基础特征: ${e.basicScore}`);
  console.log(`    评价: ${e.reason}\n`);
});

console.log('\n=== 统计 ===');
console.log(`符合标准: ${passed.length} 个`);
console.log(`不符合标准: ${failed.length} 个`);
console.log(`需要判断: ${borderline.length} 个`);
console.log(`总计: ${evaluations.length} 个`);
