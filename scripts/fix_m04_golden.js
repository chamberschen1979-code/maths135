/**
 * M04 金牌库修复脚本
 * 执行三步修复策略
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../src/data/M04.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

let stats = {
  domainCheckAdded: 0,
  highRiskRewritten: 0,
  difficultyAdjusted: 0,
  tagsRemoved: 0
};

// 第一步：批量逻辑加固 - 对数题目定义域检查
function addDomainCheck() {
  const keywords = ['定义域', '真数', '>0', '> 0'];
  
  for (const spec of data.specialties || []) {
    for (const v of spec.variations || []) {
      for (const q of v.original_pool || []) {
        // 检查是否是对数题目
        if (q.problem && (q.problem.includes('log') || q.problem.includes('ln'))) {
          // 检查 analysis 前50字符是否包含关键词
          const analysis = q.analysis || '';
          const first50 = analysis.substring(0, 100);
          const hasKeyword = keywords.some(k => first50.includes(k));
          
          if (!hasKeyword) {
            // 在解析开头插入定义域检查
            const domainNote = `【首要步骤】求解对数型函数问题，必须先确定定义域：令真数部分 > 0。\n\n`;
            q.analysis = domainNote + analysis;
            stats.domainCheckAdded++;
          }
        }
      }
    }
  }
}

// 第二步：高危题目专项重写
function rewriteHighRiskQuestions() {
  const highRiskQuestions = {
    'M04_2.2_L2_003': {
      problem: '函数 $f(x) = \\log_a x$ 的图像特征是？',
      answer: '过点 (1, 0)，在 y 轴右侧，双侧渐近线向下',
      key_points: ['对数函数图像过定点 (1, 0)', '当 a > 1 时递增，0 < a < 1 时递减', '渐近线为 y 轴 (x=0)']
    },
    'M04_1.2_L2_NEW_5943': {
      problem: '已知函数 $f(x) = x^3 - 3x + 1$，求其单调区间和极值点。',
      answer: '递增区间：$(-\\infty, -1)$ 和 $(1, +\\infty)$；递减区间：$(-1, 1)$；极大值 $f(-1) = 3$，极小值 $f(1) = -1$',
      key_points: ['求导 $f\'(x) = 3x^2 - 3 = 3(x+1)(x-1)$', '令 $f\'(x) = 0$ 得 $x = \\pm 1$', '列表分析单调性']
    },
    'M04_2.1_L4_NEW_5453': {
      problem: '证明：$\\ln(1 + \\frac{1}{n}) < \\frac{1}{n}$（$n \\in \\mathbb{N}^*$）',
      answer: '令 $f(x) = \\ln(1+x) - x$，则 $f\'(x) = \\frac{1}{1+x} - 1 = \\frac{-x}{1+x} < 0$（$x > 0$），故 $f(x)$ 在 $(0, +\\infty)$ 递减，$f(x) < f(0) = 0$，即 $\\ln(1+x) < x$，令 $x = \\frac{1}{n}$ 得证。',
      key_points: ['构造函数 $f(x) = \\ln(1+x) - x$', '求导判断单调性', '利用函数单调性证明不等式']
    }
  };
  
  for (const spec of data.specialties || []) {
    for (const v of spec.variations || []) {
      for (const q of v.original_pool || []) {
        if (highRiskQuestions[q.id]) {
          const fix = highRiskQuestions[q.id];
          q.problem = fix.problem;
          q.answer = fix.answer;
          q.key_points = fix.key_points;
          stats.highRiskRewritten++;
        }
      }
    }
  }
}

// 第三步：难度重排
function adjustDifficulty() {
  const adjustments = {
    'M04_1.1_L2_005': 'L3',
    'M04_1.2_L2_NEW_5943': 'L3',
    'M04_1.1_L4_OLD_6874': 'L3'
  };
  
  for (const spec of data.specialties || []) {
    for (const v of spec.variations || []) {
      for (const q of v.original_pool || []) {
        if (adjustments[q.id] && q.level !== adjustments[q.id]) {
          q.level = adjustments[q.id];
          stats.difficultyAdjusted++;
        }
      }
    }
  }
}

// 第四步：移除冗余标签
function removeRedundantTags() {
  for (const spec of data.specialties || []) {
    for (const v of spec.variations || []) {
      for (const q of v.original_pool || []) {
        if (q.meta && q.meta.weapons) {
          const idx = q.meta.weapons.indexOf('S-GENERAL-01');
          if (idx !== -1) {
            q.meta.weapons.splice(idx, 1);
            stats.tagsRemoved++;
          }
        }
      }
    }
  }
}

// 执行修复
console.log('🚀 开始执行 M04 金牌库修复...\n');

addDomainCheck();
console.log(`✅ 第一步完成：为 ${stats.domainCheckAdded} 道对数题目添加了定义域检查`);

rewriteHighRiskQuestions();
console.log(`✅ 第二步完成：重写了 ${stats.highRiskRewritten} 道高危题目`);

adjustDifficulty();
console.log(`✅ 第三步完成：调整了 ${stats.difficultyAdjusted} 道题目难度`);

removeRedundantTags();
console.log(`✅ 第四步完成：移除了 ${stats.tagsRemoved} 个冗余标签`);

// 保存
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
console.log('\n💾 文件已保存');
console.log('\n📊 修复统计：');
console.log(`   - 定义域检查添加：${stats.domainCheckAdded}`);
console.log(`   - 高危题目重写：${stats.highRiskRewritten}`);
console.log(`   - 难度调整：${stats.difficultyAdjusted}`);
console.log(`   - 冗余标签移除：${stats.tagsRemoved}`);
