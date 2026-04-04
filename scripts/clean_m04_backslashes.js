import fs from 'fs';

const m04Path = './src/data/M04.json';
const m04 = JSON.parse(fs.readFileSync(m04Path, 'utf-8'));

console.log('=== M04.json 反斜杠全量清洗 ===\n');

let totalFixed = 0;
const issues = {
  tripleBackslash: [],
  quadBackslash: [],
  badNewline: [],
  singleBackslash: []
};

// 常见 LaTeX 命令列表
const latexCommands = [
  'sqrt', 'frac', 'vec', 'bar', 'hat', 'tilde', 'overline', 'underline',
  'alpha', 'beta', 'gamma', 'delta', 'Delta', 'epsilon', 'zeta', 'eta',
  'theta', 'Theta', 'iota', 'kappa', 'lambda', 'Lambda', 'mu', 'nu',
  'xi', 'Xi', 'pi', 'Pi', 'rho', 'sigma', 'Sigma', 'tau', 'upsilon',
  'phi', 'Phi', 'chi', 'psi', 'Psi', 'omega', 'Omega',
  'infty', 'partial', 'nabla', 'forall', 'exists', 'in', 'notin',
  'subset', 'subseteq', 'supset', 'supseteq', 'cup', 'cap', 'emptyset',
  'sum', 'int', 'prod', 'lim', 'log', 'ln', 'lg', 'exp', 'sin', 'cos',
  'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan',
  'leq', 'geq', 'neq', 'ne', 'approx', 'equiv', 'sim', 'propto',
  'cdot', 'times', 'div', 'pm', 'mp', 'ldots', 'cdots', 'vdots', 'ddots',
  'left', 'right', 'Big', 'bigg', 'Bigg', 'big', 'mid', 'vert', 'Vert',
  'rightarrow', 'leftarrow', 'Rightarrow', 'Leftarrow', 'leftrightarrow',
  'to', 'mapsto', 'implies', 'iff',
  'mathbb', 'mathbf', 'mathcal', 'text', 'textbf', 'textit',
  'quad', 'qquad', 'space', 'hspace', 'vspace',
  'angle', 'triangle', 'circ', 'bullet', 'diamond', 'square',
  'perp', 'parallel', 'angle', 'degree',
  'begin', 'end', 'array', 'matrix', 'pmatrix', 'bmatrix', 'vmatrix',
  'sqrt', 'root', 'nthroot'
];

// 检查并修复字符串中的反斜杠问题
function fixBackslashes(str, fieldName, questionId) {
  if (typeof str !== 'string') return { fixed: str, count: 0 };
  
  let fixed = str;
  let count = 0;
  
  // 1. 修复四重反斜杠 -> 双反斜杠
  const quadPattern = /\\\\\\\\([a-zA-Z]+)/g;
  if (quadPattern.test(fixed)) {
    issues.quadBackslash.push({ id: questionId, field: fieldName, sample: fixed.match(quadPattern)?.[0] });
    fixed = fixed.replace(quadPattern, '\\\\$1');
    count++;
  }
  
  // 2. 修复三重反斜杠 -> 双反斜杠
  const triplePattern = /\\\\\\([a-zA-Z]+)/g;
  if (triplePattern.test(fixed)) {
    issues.tripleBackslash.push({ id: questionId, field: fieldName, sample: fixed.match(triplePattern)?.[0] });
    fixed = fixed.replace(triplePattern, '\\\\$1');
    count++;
  }
  
  // 3. 修复 LaTeX 命令前的单反斜杠 -> 双反斜杠
  for (const cmd of latexCommands) {
    const singlePattern = new RegExp(`(?<!\\\\)\\\\(${cmd})(?![a-zA-Z])`, 'g');
    const matches = fixed.match(singlePattern);
    if (matches) {
      issues.singleBackslash.push({ id: questionId, field: fieldName, cmd: `\\${cmd}` });
      fixed = fixed.replace(singlePattern, `\\\\$1`);
      count++;
    }
  }
  
  // 4. 检查是否有 \n 干扰 LaTeX 命令
  const badNewlinePattern = /\n([a-zA-Z]{2,})/g;
  const badMatches = fixed.match(badNewlinePattern);
  if (badMatches) {
    for (const match of badMatches) {
      const cmd = match.substring(1);
      if (latexCommands.includes(cmd)) {
        issues.badNewline.push({ id: questionId, field: fieldName, cmd });
        fixed = fixed.replace(new RegExp(`\\n${cmd}`, 'g'), `\\\\${cmd}`);
        count++;
      }
    }
  }
  
  return { fixed, count };
}

// 遍历所有题目
for (const spec of m04.specialties) {
  for (const variation of spec.variations) {
    for (const q of variation.original_pool) {
      const questionId = q.id;
      
      // 修复 problem 字段
      if (q.problem) {
        const result = fixBackslashes(q.problem, 'problem', questionId);
        if (result.count > 0) {
          q.problem = result.fixed;
          totalFixed += result.count;
        }
      }
      
      // 修复 answer 字段
      if (q.answer) {
        const result = fixBackslashes(q.answer, 'answer', questionId);
        if (result.count > 0) {
          q.answer = result.fixed;
          totalFixed += result.count;
        }
      }
      
      // 修复 analysis 字段
      if (q.analysis) {
        const result = fixBackslashes(q.analysis, 'analysis', questionId);
        if (result.count > 0) {
          q.analysis = result.fixed;
          totalFixed += result.count;
        }
      }
      
      // 修复 key_points 数组
      if (q.key_points && Array.isArray(q.key_points)) {
        for (let i = 0; i < q.key_points.length; i++) {
          const result = fixBackslashes(q.key_points[i], `key_points[${i}]`, questionId);
          if (result.count > 0) {
            q.key_points[i] = result.fixed;
            totalFixed += result.count;
          }
        }
      }
      
      // 修复 meta.core_logic 数组
      if (q.meta?.core_logic && Array.isArray(q.meta.core_logic)) {
        for (let i = 0; i < q.meta.core_logic.length; i++) {
          const result = fixBackslashes(q.meta.core_logic[i], `meta.core_logic[${i}]`, questionId);
          if (result.count > 0) {
            q.meta.core_logic[i] = result.fixed;
            totalFixed += result.count;
          }
        }
      }
      
      // 修复 meta.strategy_hint
      if (q.meta?.strategy_hint) {
        const result = fixBackslashes(q.meta.strategy_hint, 'meta.strategy_hint', questionId);
        if (result.count > 0) {
          q.meta.strategy_hint = result.fixed;
          totalFixed += result.count;
        }
      }
      
      // 修复 meta.trap_tags 数组
      if (q.meta?.trap_tags && Array.isArray(q.meta.trap_tags)) {
        for (let i = 0; i < q.meta.trap_tags.length; i++) {
          const result = fixBackslashes(q.meta.trap_tags[i], `meta.trap_tags[${i}]`, questionId);
          if (result.count > 0) {
            q.meta.trap_tags[i] = result.fixed;
            totalFixed += result.count;
          }
        }
      }
    }
  }
}

// 输出问题报告
console.log('【问题报告】');
console.log(`四重反斜杠 (\\\\\\\\): ${issues.quadBackslash.length} 处`);
if (issues.quadBackslash.length > 0) {
  issues.quadBackslash.slice(0, 5).forEach(i => console.log(`  - ${i.id}: ${i.field}`));
}

console.log(`\n三重反斜杠 (\\\\\\): ${issues.tripleBackslash.length} 处`);
if (issues.tripleBackslash.length > 0) {
  issues.tripleBackslash.slice(0, 5).forEach(i => console.log(`  - ${i.id}: ${i.field}`));
}

console.log(`\n单反斜杠 (\\): ${issues.singleBackslash.length} 处`);
if (issues.singleBackslash.length > 0) {
  const uniqueCmds = [...new Set(issues.singleBackslash.map(i => i.cmd))];
  console.log(`  涉及命令: ${uniqueCmds.slice(0, 10).join(', ')}${uniqueCmds.length > 10 ? '...' : ''}`);
}

console.log(`\n换行符干扰: ${issues.badNewline.length} 处`);
if (issues.badNewline.length > 0) {
  issues.badNewline.slice(0, 5).forEach(i => console.log(`  - ${i.id}: \\n${i.cmd} -> \\\\${i.cmd}`));
}

// 保存
m04.last_updated = new Date().toISOString().split('T')[0];
fs.writeFileSync(m04Path, JSON.stringify(m04, null, 2), 'utf-8');

console.log(`\n=== 清洗完成 ===`);
console.log(`共修复 ${totalFixed} 处反斜杠问题`);
