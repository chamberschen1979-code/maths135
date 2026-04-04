import fs from 'fs';

const m04Path = './src/data/M04.json';
const m05Path = './src/data/M05.json';

const m04 = JSON.parse(fs.readFileSync(m04Path, 'utf-8'));
const m05 = JSON.parse(fs.readFileSync(m05Path, 'utf-8'));

console.log('=== M04 vs M05 题目质量对比分析 ===\n');

// 1. 基本统计
console.log('【1. 基本统计】');
console.log(`M04 总题目数: ${countQuestions(m04)}`);
console.log(`M05 总题目数: ${countQuestions(m05)}\n`);

// 2. 难度分布
console.log('【2. 难度分布对比】');
const m04Levels = getLevelDistribution(m04);
const m05Levels = getLevelDistribution(m05);
console.log('M04:', m04Levels);
console.log('M05:', m05Levels, '\n');

// 3. 字段完整性检查
console.log('【3. 字段完整性检查】');
checkFieldCompleteness('M04', m04);
checkFieldCompleteness('M05', m05);

// 4. quality_score 对比
console.log('\n【4. quality_score 对比】');
const m04Scores = getQualityScores(m04);
const m05Scores = getQualityScores(m05);
console.log(`M04 平均分: ${m04Scores.avg.toFixed(1)} (范围: ${m04Scores.min}-${m04Scores.max})`);
console.log(`M05 平均分: ${m05Scores.avg.toFixed(1)} (范围: ${m05Scores.min}-${m05Scores.max})`);

// 5. weapons 使用情况
console.log('\n【5. weapons 使用情况】');
const m04Weapons = getWeaponStats(m04);
const m05Weapons = getWeaponStats(m05);
console.log('M04 weapons:', m04Weapons);
console.log('M05 weapons:', m05Weapons);

// 6. analysis 字段质量
console.log('\n【6. analysis 字段质量】');
const m04Analysis = checkAnalysisQuality(m04);
const m05Analysis = checkAnalysisQuality(m05);
console.log(`M04 有 analysis 的题目: ${m04Analysis.hasAnalysis}/${m04Analysis.total} (${(m04Analysis.hasAnalysis/m04Analysis.total*100).toFixed(1)}%)`);
console.log(`M05 有 analysis 的题目: ${m05Analysis.hasAnalysis}/${m05Analysis.total} (${(m05Analysis.hasAnalysis/m05Analysis.total*100).toFixed(1)}%)`);
console.log(`M05 analysis 平均长度: ${m05Analysis.avgLength.toFixed(0)} 字符`);

// 7. 难度匹配度分析
console.log('\n【7. 难度匹配度分析】');
analyzeDifficultyMatch(m05);

// 8. 问题诊断
console.log('\n【8. 问题诊断】');
diagnoseIssues(m05);

function countQuestions(data) {
  let count = 0;
  for (const spec of data.specialties) {
    for (const variation of spec.variations) {
      count += (variation.original_pool || []).length;
    }
  }
  return count;
}

function getLevelDistribution(data) {
  const levels = { L2: 0, L3: 0, L4: 0 };
  for (const spec of data.specialties) {
    for (const variation of spec.variations) {
      for (const q of variation.original_pool) {
        levels[q.level] = (levels[q.level] || 0) + 1;
      }
    }
  }
  return levels;
}

function checkFieldCompleteness(name, data) {
  const requiredFields = ['id', 'problem', 'answer', 'level', 'key_points', 'meta'];
  const issues = { missing: [], empty: [] };
  
  for (const spec of data.specialties) {
    for (const variation of spec.variations) {
      for (const q of variation.original_pool) {
        for (const field of requiredFields) {
          if (!q[field]) {
            issues.missing.push(`${q.id}: 缺少 ${field}`);
          } else if (Array.isArray(q[field]) && q[field].length === 0) {
            issues.empty.push(`${q.id}: ${field} 为空数组`);
          } else if (typeof q[field] === 'string' && q[field].trim() === '') {
            issues.empty.push(`${q.id}: ${field} 为空字符串`);
          }
        }
      }
    }
  }
  
  if (issues.missing.length === 0 && issues.empty.length === 0) {
    console.log(`${name}: ✅ 所有必填字段完整`);
  } else {
    console.log(`${name}: ⚠️ 发现 ${issues.missing.length + issues.empty.length} 个问题`);
    if (issues.missing.length > 0) console.log(`  缺失字段: ${issues.missing.slice(0, 3).join(', ')}...`);
    if (issues.empty.length > 0) console.log(`  空字段: ${issues.empty.slice(0, 3).join(', ')}...`);
  }
}

function getQualityScores(data) {
  const scores = [];
  for (const spec of data.specialties) {
    for (const variation of spec.variations) {
      for (const q of variation.original_pool) {
        if (q.quality_score) scores.push(q.quality_score);
      }
    }
  }
  return {
    avg: scores.reduce((a, b) => a + b, 0) / scores.length,
    min: Math.min(...scores),
    max: Math.max(...scores)
  };
}

function getWeaponStats(data) {
  const weapons = {};
  for (const spec of data.specialties) {
    for (const variation of spec.variations) {
      for (const q of variation.original_pool) {
        const ws = q.meta?.weapons || [];
        for (const w of ws) {
          weapons[w] = (weapons[w] || 0) + 1;
        }
      }
    }
  }
  return weapons;
}

function checkAnalysisQuality(data) {
  let hasAnalysis = 0;
  let total = 0;
  let totalLength = 0;
  
  for (const spec of data.specialties) {
    for (const variation of spec.variations) {
      for (const q of variation.original_pool) {
        total++;
        if (q.analysis && q.analysis.length > 50) {
          hasAnalysis++;
          totalLength += q.analysis.length;
        }
      }
    }
  }
  
  return {
    hasAnalysis,
    total,
    avgLength: hasAnalysis > 0 ? totalLength / hasAnalysis : 0
  };
}

function analyzeDifficultyMatch(data) {
  // 检查 L2/L3/L4 题目的特征
  const levelFeatures = {
    L2: { avgKeyPoints: 0, avgProblemLen: 0, count: 0 },
    L3: { avgKeyPoints: 0, avgProblemLen: 0, count: 0 },
    L4: { avgKeyPoints: 0, avgProblemLen: 0, count: 0 }
  };
  
  for (const spec of data.specialties) {
    for (const variation of spec.variations) {
      for (const q of variation.original_pool) {
        const level = q.level;
        if (levelFeatures[level]) {
          levelFeatures[level].avgKeyPoints += (q.key_points || []).length;
          levelFeatures[level].avgProblemLen += (q.problem || '').length;
          levelFeatures[level].count++;
        }
      }
    }
  }
  
  for (const level of ['L2', 'L3', 'L4']) {
    const f = levelFeatures[level];
    if (f.count > 0) {
      console.log(`${level}: 平均 key_points=${(f.avgKeyPoints/f.count).toFixed(1)}, 平均题干长度=${(f.avgProblemLen/f.count).toFixed(0)}`);
    }
  }
  
  // 难度递进检查
  const l2kp = levelFeatures.L2.avgKeyPoints / levelFeatures.L2.count;
  const l3kp = levelFeatures.L3.avgKeyPoints / levelFeatures.L3.count;
  const l4kp = levelFeatures.L4.avgKeyPoints / levelFeatures.L4.count;
  
  if (l2kp <= l3kp && l3kp <= l4kp) {
    console.log('✅ 难度递进合理: key_points 数量随难度增加');
  } else {
    console.log('⚠️ 难度递进可能有问题: key_points 数量未随难度增加');
  }
}

function diagnoseIssues(data) {
  const issues = [];
  
  for (const spec of data.specialties) {
    for (const variation of spec.variations) {
      for (const q of variation.original_pool) {
        // 检查题目是否有明确的求解指令
        const problem = q.problem || '';
        const hasInstruction = ['求', '证明', '计算', '判断', '求证', '讨论'].some(k => problem.includes(k));
        if (!hasInstruction) {
          issues.push(`${q.id}: 缺少明确的求解指令`);
        }
        
        // 检查答案是否合理
        const answer = q.answer || '';
        if (answer.length < 2) {
          issues.push(`${q.id}: 答案过短 "${answer}"`);
        }
        
        // 检查是否有 trap_tags
        const trapTags = q.meta?.trap_tags || [];
        if (q.level === 'L4' && trapTags.length === 0) {
          issues.push(`${q.id}: L4 题目缺少 trap_tags`);
        }
      }
    }
  }
  
  if (issues.length === 0) {
    console.log('✅ 未发现明显问题');
  } else {
    console.log(`发现 ${issues.length} 个潜在问题:`);
    issues.slice(0, 10).forEach(i => console.log(`  - ${i}`));
    if (issues.length > 10) {
      console.log(`  ... 还有 ${issues.length - 10} 个问题`);
    }
  }
}
