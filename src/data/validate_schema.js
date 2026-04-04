/**
 * 通用 Schema 校验脚本
 * 用法:
 *   node validate_schema.js M04.json       (校验单个文件)
 *   node validate_schema.js all            (校验所有 M*.json 文件)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  requiredFields: ['id', 'level', 'problem', 'answer'],
  requiredMeta: ['core_logic', 'weapons']
};

function validateQuestion(q, fileName, index) {
  const errors = [];
  const prefix = `[${fileName}] 题目 #${index + 1} (ID: ${q.id || 'UNKNOWN'})`;

  // 1. 顶层必填
  for (const field of CONFIG.requiredFields) {
    if (!q[field] && q[field] !== 0) {
      errors.push(`${prefix} ❌ 缺少字段: ${field}`);
    }
  }

  // 2. Meta 检查
  if (!q.meta) {
    // 如果是旧格式 (有 variable_knobs)，暂时不报 meta 缺失错误，因为适配器会处理
    if (!q.variable_knobs) {
      errors.push(`${prefix} ❌ 缺少 meta 对象且不是旧格式`);
    }
  } else {
    for (const field of CONFIG.requiredMeta) {
      if (!q.meta[field]) {
        // 兼容旧格式转换前的状态：如果它是旧格式，meta 可能是空的，由适配器动态生成
        // 但如果是新格式，必须有
        if (q._format === 'RAG' || (q.meta.weapons && Array.isArray(q.meta.weapons))) {
           errors.push(`${prefix} ❌ 新格式缺少 meta.${field}`);
        }
      }
    }
  }
  
  // 3. 难度检查
  if (q.level && !['L1', 'L2', 'L3', 'L4'].includes(q.level)) {
     errors.push(`${prefix} ⚠️ 未知难度: ${q.level}`);
  }

  return errors;
}

function processFile(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n🔍 正在校验: ${fileName} ...`);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let totalErrors = 0;
    let totalQuestions = 0;
    let specialties = [];

    // 兼容两种结构：直接是数组 vs 包含 specialties 的对象
    if (Array.isArray(data)) {
      specialties = [{ variations: [{ original_pool: data }] }]; // 扁平结构假设
    } else if (data.specialties) {
      specialties = data.specialties;
    } else if (data.questions) {
       // 某些旧格式可能是 { questions: [...] }
       specialties = [{ variations: [{ original_pool: data.questions }] }];
    }

    for (const spec of specialties) {
      for (const vari of (spec.variations || [])) {
        const pool = vari.original_pool || [];
        for (let i = 0; i < pool.length; i++) {
          totalQuestions++;
          const errors = validateQuestion(pool[i], fileName, i);
          if (errors.length > 0) {
            totalErrors += errors.length;
            errors.forEach(err => console.error(err));
          }
        }
      }
    }

    if (totalErrors === 0) {
      console.log(`   ✅ ${fileName}: 通过 (${totalQuestions} 题)`);
      return true;
    } else {
      console.error(`   ❌ ${fileName}: 失败 (${totalErrors} 个错误)`);
      return false;
    }

  } catch (e) {
    console.error(`   ❌ ${fileName}: 读取或解析失败 - ${e.message}`);
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  const target = args[0] || 'M04.json'; // 默认校验 M04

  const dataDir = __dirname;
  let filesToCheck = [];

  if (target === 'all') {
    // 查找所有 M*.json 文件 (排除备份和归档)
    const allFiles = fs.readdirSync(dataDir);
    filesToCheck = allFiles
      .filter(f => /^M\d+\.json$/.test(f)) // 匹配 M01.json, M04.json 等
      .map(f => path.join(dataDir, f));
    
    if (filesToCheck.length === 0) {
      console.log('⚠️ 未找到任何 M*.json 文件');
      return;
    }
    console.log(`🚀 批量模式：发现 ${filesToCheck.length} 个母题文件`);
  } else {
    const filePath = path.join(dataDir, target);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ 文件不存在: ${filePath}`);
      process.exit(1);
    }
    filesToCheck = [filePath];
  }

  let hasError = false;
  for (const file of filesToCheck) {
    if (!processFile(file)) {
      hasError = true;
    }
  }

  console.log('\n' + '='.repeat(40));
  if (hasError) {
    console.error('❌ 校验未完成，存在错误。');
    process.exit(1);
  } else {
    console.log('✅ 所有文件校验通过！');
  }
}

main();
