import fs from 'fs';

const m05Path = './src/data/M05.json';
const m05 = JSON.parse(fs.readFileSync(m05Path, 'utf-8'));

console.log('=== M05.json 教研组长审定问题修复 ===\n');

let fixedCount = 0;

// 1. 修复 M05_1_1_L3_010 逻辑隐患
console.log('【1. 修复 M05_1_1_L3_010 逻辑隐患】');
for (const spec of m05.specialties) {
  for (const variation of spec.variations) {
    for (const q of variation.original_pool) {
      if (q.id === 'M05_1_1_L3_010') {
        // 修复 key_points，添加关于 cosθ=0 的讨论
        q.key_points = [
          "1. 列式：$|\\vec{a}|\\cos\\theta = \\frac{1}{4}|\\vec{b}|\\cos\\theta$。",
          "2. 代入：$\\cos\\theta = \\frac{1}{4} \\times 2 \\times \\cos\\theta = \\frac{1}{2}\\cos\\theta$。",
          "3. 移项：$\\cos\\theta - \\frac{1}{2}\\cos\\theta = 0$，即 $\\frac{1}{2}\\cos\\theta = 0$。",
          "4. 解得：$\\cos\\theta = 0$。",
          "⚠️ 注意：不能直接约去 $\\cos\\theta$，否则会漏掉垂直情况！"
        ];
        
        // 修复 meta.core_logic
        if (q.meta) {
          q.meta.core_logic = q.key_points;
          // 添加 trap_tags
          q.meta.trap_tags = [
            "直接约去 $\\cos\\theta$ 导致漏解",
            "忽略 $\\vec{a} \\perp \\vec{b}$ 的特殊情况",
            "投影长度公式记忆错误"
          ];
        }
        
        // 修复 analysis
        q.analysis = `【首要步骤】向量问题优先考虑几何意义或建系策略。

【核心思路】本题考查投影长度的概念与计算。关键在于方程变形时不能直接约分。

【详细推导】
1. 列式：$|\\vec{a}|\\cos\\theta = \\frac{1}{4}|\\vec{b}|\\cos\\theta$。
2. 代入：$\\cos\\theta = \\frac{1}{4} \\times 2 \\times \\cos\\theta = \\frac{1}{2}\\cos\\theta$。
3. 移项：$\\cos\\theta - \\frac{1}{2}\\cos\\theta = 0$，即 $\\frac{1}{2}\\cos\\theta = 0$。
4. 解得：$\\cos\\theta = 0$。
⚠️ 注意：不能直接约去 $\\cos\\theta$，否则会漏掉垂直情况！

【易错点警示】
1. 直接约去 $\\cos\\theta$ 导致漏解。
2. 忽略 $\\vec{a} \\perp \\vec{b}$ 的特殊情况。
3. 投影长度公式记忆错误。

【答案】$0$`;
        
        console.log(`  ✅ 已修复: ${q.id}`);
        fixedCount++;
      }
    }
  }
}

// 2. 为 M05_2_1_L4_SEED_009 添加 S-VEC-05 杀手锏
console.log('\n【2. 为奔驰定理题目添加专用杀手锏】');
for (const spec of m05.specialties) {
  for (const variation of spec.variations) {
    for (const q of variation.original_pool) {
      if (q.id === 'M05_2_1_L4_SEED_009') {
        // 添加 S-VEC-05 杀手锏
        if (q.meta) {
          if (!q.meta.weapons.includes('S-VEC-05')) {
            q.meta.weapons.push('S-VEC-05');
          }
          // 强化 strategy_hint
          q.meta.strategy_hint = '奔驰定理 (面积比与系数关系) - 严禁建系硬算';
        }
        console.log(`  ✅ 已添加 S-VEC-05: ${q.id}`);
        fixedCount++;
      }
    }
  }
}

// 3. 为所有奔驰定理相关题目添加 S-VEC-05
console.log('\n【3. 为所有奔驰定理相关题目添加 S-VEC-05】');
const benzKeywords = ['奔驰定理', '面积比', 'S_{\\triangle PBC}', 'S_{\\triangle PAB}'];
for (const spec of m05.specialties) {
  for (const variation of spec.variations) {
    for (const q of variation.original_pool) {
      const content = JSON.stringify(q);
      const hasBenz = benzKeywords.some(k => content.includes(k));
      
      if (hasBenz && q.meta && !q.meta.weapons?.includes('S-VEC-05')) {
        q.meta.weapons = q.meta.weapons || [];
        q.meta.weapons.push('S-VEC-05');
        console.log(`  ✅ 已添加 S-VEC-05: ${q.id}`);
        fixedCount++;
      }
    }
  }
}

// 4. 修复 LaTeX 四重转义问题
console.log('\n【4. 修复 LaTeX 转义问题】');
let latexFixed = 0;
for (const spec of m05.specialties) {
  for (const variation of spec.variations) {
    for (const q of variation.original_pool) {
      // 检查并修复 analysis 中的四重转义
      if (q.analysis && q.analysis.includes('\\\\\\\\')) {
        q.analysis = q.analysis.replace(/\\\\\\\\/g, '\\\\');
        latexFixed++;
      }
      // 检查 problem
      if (q.problem && q.problem.includes('\\\\\\\\')) {
        q.problem = q.problem.replace(/\\\\\\\\/g, '\\\\');
        latexFixed++;
      }
      // 检查 key_points
      if (q.key_points) {
        for (let i = 0; i < q.key_points.length; i++) {
          if (q.key_points[i].includes('\\\\\\\\')) {
            q.key_points[i] = q.key_points[i].replace(/\\\\\\\\/g, '\\\\');
            latexFixed++;
          }
        }
      }
    }
  }
}
console.log(`  ✅ 修复了 ${latexFixed} 处 LaTeX 转义问题`);
if (latexFixed > 0) fixedCount++;

// 5. 为 L4 极化恒等式题目强化 strategy_hint
console.log('\n【5. 强化 L4 极化恒等式题目的策略提示】');
for (const spec of m05.specialties) {
  for (const variation of spec.variations) {
    for (const q of variation.original_pool) {
      if (q.level === 'L4' && q.meta?.weapons?.includes('S-VEC-02')) {
        if (!q.meta.strategy_hint.includes('严禁建系')) {
          q.meta.strategy_hint = q.meta.strategy_hint + ' - 严禁建系硬算，优先识别几何模型';
          console.log(`  ✅ 强化提示: ${q.id}`);
          fixedCount++;
        }
      }
    }
  }
}

// 保存
m05.last_updated = new Date().toISOString().split('T')[0];
fs.writeFileSync(m05Path, JSON.stringify(m05, null, 2), 'utf-8');

console.log(`\n=== 修复完成 ===`);
console.log(`共修复 ${fixedCount} 个问题`);
