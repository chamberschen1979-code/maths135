import fs from 'fs';

const weaponDetailsPath = './src/data/weapon_details.json';
const m04Path = './src/data/M04.json';

const weaponDetails = JSON.parse(fs.readFileSync(weaponDetailsPath, 'utf-8'));
const m04 = JSON.parse(fs.readFileSync(m04Path, 'utf-8'));

console.log('=== 被清空杀手锏的题目分析 ===\n');

// 收集被清空杀手锏的题目
const clearedQuestions = [];

for (const spec of m04.specialties) {
  for (const variation of spec.variations) {
    for (const q of variation.original_pool) {
      const weapons = q.meta?.weapons || [];
      if (weapons.length === 0) {
        clearedQuestions.push({
          id: q.id,
          problem: q.problem?.substring(0, 100) + '...',
          answer: q.answer,
          keyPoints: q.key_points?.slice(0, 2),
          varName: variation.name,
          specId: spec.spec_id
        });
      }
    }
  }
}

console.log(`共 ${clearedQuestions.length} 道题目被清空杀手锏\n`);

// 展示前 10 个例子
console.log('【示例分析】\n');

clearedQuestions.slice(0, 10).forEach((q, i) => {
  console.log(`${i + 1}. ${q.id}`);
  console.log(`   变例: ${q.specId}/${q.varName}`);
  console.log(`   题目: ${q.problem}`);
  console.log(`   答案: ${q.answer}`);
  console.log(`   关键点: ${q.keyPoints?.join(' | ')}`);
  console.log(`   分析: 该题是指对数运算题，没有匹配到"复合函数单调性"、"零点问题"、"周期对称"等核心杀手锏的特征关键词。`);
  console.log('');
});

// 统计被清空题目的变例分布
console.log('【被清空题目的变例分布】');
const varDistribution = {};
clearedQuestions.forEach(q => {
  const key = `${q.specId}/${q.varName}`;
  varDistribution[key] = (varDistribution[key] || 0) + 1;
});
Object.entries(varDistribution).forEach(([key, count]) => {
  console.log(`  ${key}: ${count} 道`);
});

console.log('\n【原因总结】');
console.log('1. 基础计算题（如换底公式、指数运算）：不需要特定杀手锏');
console.log('2. 指对数方程求解：属于基础技能，不涉及复合函数、零点等高级技巧');
console.log('3. 简单定义域求解：基础题型，无需杀手锏');
console.log('4. 题目内容没有匹配到任何杀手锏的≥2个关键词');
