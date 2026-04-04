import fs from 'fs';

const m04Path = './src/data/M04.json';
const m04 = JSON.parse(fs.readFileSync(m04Path, 'utf-8'));

console.log('=== M04.json analysis 补全脚本 ===\n');

// 找出缺少 analysis 的题目
const missingAnalysis = [];

for (const spec of m04.specialties) {
  for (const variation of spec.variations) {
    for (const q of variation.original_pool) {
      if (!q.analysis || q.analysis.length < 50) {
        missingAnalysis.push({
          id: q.id,
          problem: q.problem,
          answer: q.answer,
          key_points: q.key_points,
          level: q.level,
          varId: variation.var_id,
          varName: variation.name,
          specId: spec.spec_id,
          specName: spec.spec_name,
          question: q
        });
      }
    }
  }
}

console.log(`发现 ${missingAnalysis.length} 道题目缺少 analysis\n`);

// 为每道题生成 analysis
for (const item of missingAnalysis) {
  const { id, problem, answer, key_points, level, varId, varName, question } = item;
  
  // 生成 analysis 模板
  const analysis = generateAnalysis(problem, answer, key_points, level, varId, varName);
  
  question.analysis = analysis;
  console.log(`已补全: ${id}`);
}

// 保存
m04.last_updated = new Date().toISOString().split('T')[0];
fs.writeFileSync(m04Path, JSON.stringify(m04, null, 2), 'utf-8');

console.log(`\n=== 补全完成 ===`);
console.log(`共补全 ${missingAnalysis.length} 道题目的 analysis`);

function generateAnalysis(problem, answer, key_points, level, varId, varName) {
  // 提取关键信息
  const keyPointsText = (key_points || []).map((kp, i) => `${i + 1}. ${kp}`).join('\n');
  
  // 根据变例生成特定的分析模板
  let specificTips = '';
  
  if (varId === '1.1') {
    specificTips = `1. 换底公式应用时注意底数和真数的对应关系。
2. 指数与对数的互化要准确。
3. 注意定义域的限制条件。`;
  } else if (varId === '1.2') {
    specificTips = `1. 比较大小优先考虑函数单调性。
2. 中间值法（0、1等）是常用技巧。
3. 注意对数函数的底数对单调性的影响。`;
  } else if (varId === '2.1') {
    specificTips = `1. 利用函数单调性解不等式。
2. 注意对数不等式的定义域限制。
3. 分类讨论时要全面。`;
  } else if (varId === '2.2') {
    specificTips = `1. 换元法简化复合函数。
2. 注意新变量的取值范围。
3. 分段函数要分段讨论。`;
  } else if (varId === '2.3') {
    specificTips = `1. 奇偶性判断先看定义域是否关于原点对称。
2. 周期性结合对称性可简化问题。
3. 利用性质画出函数草图辅助分析。`;
  } else {
    specificTips = `1. 仔细审题，明确解题方向。
2. 选择合适的方法进行求解。
3. 注意检验结果的合理性。`;
  }
  
  // 生成完整的 analysis
  return `【首要步骤】求解指对数函数问题，必须先确定定义域：令真数部分 > 0。

【核心思路】本题考查${varName}相关知识。

【详细推导】
${keyPointsText}

【易错点警示】
${specificTips}

【答案】${answer}`;
}
