import fs from 'fs';

const m04Path = './src/data/M04.json';
const m05Path = './src/data/M05.json';

console.log('=== 希腊字母转义符补齐脚本 ===\n');

// 希腊字母列表（小写和大写）
const greekLetters = [
  // 小写
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta',
  'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi',
  'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
  // 大写
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
  'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi',
  'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega',
  // 变体
  'varepsilon', 'varphi', 'varpi', 'varrho', 'varsigma', 'vartheta'
];

// 数学语境指示词（用于判断是否在数学公式中）
const mathContextIndicators = [
  // 运算符
  '+', '-', '*', '/', '=', '<', '>', '\\leq', '\\geq', '\\neq', '\\approx',
  // 数学关键词
  '求', '设', '已知', '若', '则', '令', '当', '解', '得',
  // LaTeX 数学环境
  '$', '\\(', '\\[', '\\frac', '\\sqrt', '\\sum', '\\int',
  // 常见搭配
  'angle', 'triangle', 'circle', 'point', 'line', 'plane'
];

/**
 * 检查希腊字母是否在数学语境中
 */
function isInMathContext(text, index, letter) {
  // 检查前后100个字符的上下文
  const start = Math.max(0, index - 100);
  const end = Math.min(text.length, index + letter.length + 100);
  const context = text.substring(start, end);
  
  // 1. 检查是否在 $...$ 数学环境中
  const dollarBefore = context.lastIndexOf('$', index - start);
  const dollarAfter = context.indexOf('$', index - start + letter.length);
  if (dollarBefore !== -1 && dollarAfter !== -1 && dollarBefore < dollarAfter) {
    return true;
  }
  
  // 2. 检查是否有数学运算符或关键词
  for (const indicator of mathContextIndicators) {
    if (context.includes(indicator)) {
      return true;
    }
  }
  
  // 3. 检查前后是否有其他希腊字母（通常希腊字母一起出现）
  for (const greek of greekLetters) {
    if (greek !== letter) {
      const greekPattern = new RegExp(`\\\\?${greek}\\b`, 'i');
      if (greekPattern.test(context)) {
        return true;
      }
    }
  }
  
  // 4. 检查是否紧跟在数学符号后面
  const beforeChar = text[index - 1];
  if (['+', '-', '*', '/', '=', '<', '>', ',', ' ', '(', '['].includes(beforeChar)) {
    // 再检查后面是否有数学符号
    const afterIndex = index + letter.length;
    const afterChar = text[afterIndex];
    if (['+', '-', '*', '/', '=', '<', '>', ' ', ')', ']', ',', '^', '_'].includes(afterChar)) {
      return true;
    }
  }
  
  return false;
}

/**
 * 修复字符串中的希腊字母转义
 */
function fixGreekLetters(str, fieldName, questionId) {
  if (typeof str !== 'string') return { fixed: str, count: 0, details: [] };
  
  let fixed = str;
  let count = 0;
  const details = [];
  
  for (const letter of greekLetters) {
    // 匹配前面没有反斜杠的希腊字母单词
    // 使用负向断言确保前面没有反斜杠
    const pattern = new RegExp(`(?<![\\\\a-zA-Z])\\b${letter}\\b(?![a-zA-Z])`, 'g');
    
    let match;
    while ((match = pattern.exec(str)) !== null) {
      const index = match.index;
      const matchedWord = match[0];
      
      // 检查是否在数学语境中
      if (isInMathContext(str, index, letter)) {
        // 记录需要修复的位置
        details.push({
          letter: matchedWord,
          position: index,
          context: str.substring(Math.max(0, index - 20), Math.min(str.length, index + matchedWord.length + 20))
        });
        count++;
      }
    }
    
    // 执行替换（只替换数学语境中的）
    if (count > 0) {
      // 使用函数式替换，确保只替换数学语境中的
      fixed = fixed.replace(pattern, (match, offset) => {
        if (isInMathContext(str, offset, letter)) {
          return `\\\\${letter}`;
        }
        return match;
      });
    }
  }
  
  return { fixed, count, details };
}

/**
 * 处理单个 JSON 文件
 */
function processFile(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  let totalFixed = 0;
  const allDetails = [];
  
  for (const spec of data.specialties) {
    for (const variation of spec.variations) {
      for (const q of variation.original_pool) {
        const questionId = q.id;
        
        // 处理 problem 字段
        if (q.problem) {
          const result = fixGreekLetters(q.problem, 'problem', questionId);
          if (result.count > 0) {
            q.problem = result.fixed;
            totalFixed += result.count;
            allDetails.push(...result.details.map(d => ({ ...d, id: questionId, field: 'problem' })));
          }
        }
        
        // 处理 answer 字段
        if (q.answer) {
          const result = fixGreekLetters(q.answer, 'answer', questionId);
          if (result.count > 0) {
            q.answer = result.fixed;
            totalFixed += result.count;
            allDetails.push(...result.details.map(d => ({ ...d, id: questionId, field: 'answer' })));
          }
        }
        
        // 处理 analysis 字段
        if (q.analysis) {
          const result = fixGreekLetters(q.analysis, 'analysis', questionId);
          if (result.count > 0) {
            q.analysis = result.fixed;
            totalFixed += result.count;
            allDetails.push(...result.details.map(d => ({ ...d, id: questionId, field: 'analysis' })));
          }
        }
        
        // 处理 key_points 数组
        if (q.key_points && Array.isArray(q.key_points)) {
          for (let i = 0; i < q.key_points.length; i++) {
            const result = fixGreekLetters(q.key_points[i], `key_points[${i}]`, questionId);
            if (result.count > 0) {
              q.key_points[i] = result.fixed;
              totalFixed += result.count;
            }
          }
        }
      }
    }
  }
  
  // 保存文件
  data.last_updated = new Date().toISOString().split('T')[0];
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  
  return { totalFixed, details: allDetails };
}

// 处理 M04.json
console.log('【处理 M04.json】');
const m04Result = processFile(m04Path);
console.log(`  修复了 ${m04Result.totalFixed} 处希腊字母转义问题`);
if (m04Result.details.length > 0) {
  console.log('  示例:');
  m04Result.details.slice(0, 3).forEach(d => {
    console.log(`    - ${d.id}: ${d.field} -> ${d.letter}`);
  });
}

// 处理 M05.json
console.log('\n【处理 M05.json】');
const m05Result = processFile(m05Path);
console.log(`  修复了 ${m05Result.totalFixed} 处希腊字母转义问题`);
if (m05Result.details.length > 0) {
  console.log('  示例:');
  m05Result.details.slice(0, 3).forEach(d => {
    console.log(`    - ${d.id}: ${d.field} -> ${d.letter}`);
  });
}

console.log('\n=== 处理完成 ===');
console.log(`总计修复: ${m04Result.totalFixed + m05Result.totalFixed} 处`);
