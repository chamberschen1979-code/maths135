/**
 * M05 种子题提取与清洗脚本
 * 
 * 目标：从 M05.json 的 master_benchmarks 中提取 12 道高质量种子题
 * 并按 M04 格式清洗，生成 M05_seeds.json
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const M05_PATH = path.join(__dirname, '../src/data/M05.json')
const OUTPUT_PATH = path.join(__dirname, '../src/data/M05_seeds.json')

function loadM05() {
  const content = fs.readFileSync(M05_PATH, 'utf-8')
  return JSON.parse(content)
}

// 生成新 ID
function generateNewId(varId, level, index) {
  const levelNum = { L2: 'L2', L3: 'L3', L4: 'L4' }
  const varNum = varId.replace('.', '_')
  return `M05_${varNum}_${levelNum[level]}_SEED_${String(index).padStart(3, '0')}`
}

// 清洗 LaTeX 转义符
function cleanLatex(text) {
  if (!text || typeof text !== 'string') return text
  // 将 \\\\frac 还原为 \\frac
  return text.replace(/\\\\\\\\/g, '\\\\')
}

// 将 analysis 对象转换为字符串
function convertAnalysis(analysis) {
  if (typeof analysis === 'string') return analysis
  
  if (typeof analysis === 'object' && analysis !== null) {
    const parts = []
    
    // 添加首要步骤
    parts.push('【首要步骤】向量问题优先考虑几何意义或建系策略。')
    
    if (analysis.core_idea) {
      parts.push(`\n【核心思路】${analysis.core_idea}`)
    }
    
    if (analysis.key_steps && Array.isArray(analysis.key_steps)) {
      parts.push('\n【详细推导】')
      analysis.key_steps.forEach((step, i) => {
        parts.push(step)
      })
    }
    
    if (analysis.common_pitfalls && Array.isArray(analysis.common_pitfalls)) {
      parts.push('\n【易错点警示】')
      analysis.common_pitfalls.forEach((pitfall, i) => {
        parts.push(`${i + 1}. ${pitfall}`)
      })
    }
    
    if (analysis.conclusion) {
      parts.push(`\n【答案】${analysis.conclusion}`)
    }
    
    return parts.join('\n')
  }
  
  return ''
}

// 提取并清洗题目
function extractAndCleanQuestions(m05) {
  const seeds = []
  let globalIndex = 1
  
  // 专项信息
  const specInfo = {
    V1: { name: '数量积的核心度量', variations: {} },
    V2: { name: '向量的几何表征与消元', variations: {} }
  }
  
  // 变例信息
  const varInfo = {
    '1.1': { name: '投影向量与夹角范围', specId: 'V1' },
    '1.2': { name: '极化恒等式与最值秒杀', specId: 'V1' },
    '2.1': { name: '线性运算、三点共线与等系数和', specId: 'V2' },
    '2.2': { name: '建系策略与综合最值', specId: 'V2' }
  }
  
  if (m05.specialties) {
    m05.specialties.forEach(spec => {
      if (spec.variations) {
        spec.variations.forEach(variation => {
          const varId = variation.var_id
          const varName = variation.name
          
          if (variation.master_benchmarks) {
            variation.master_benchmarks.forEach(mb => {
              // 构建新格式的题目
              const newQuestion = {
                id: generateNewId(varId, mb.level, globalIndex),
                data_source: 'master_benchmark',
                source: extractSource(mb.problem),
                problem: cleanLatex(mb.problem),
                answer: extractAnswer(mb.analysis),
                key_points: extractKeyPoints(mb.analysis),
                level: mb.level,
                tags: [mb.level, '种子题'],
                quality_score: 95,
                meta: {
                  core_logic: extractKeyPoints(mb.analysis),
                  weapons: extractWeapons(varId),
                  strategy_hint: extractStrategyHint(mb.logic_key),
                  trap_tags: extractPitfalls(mb.analysis)
                },
                specId: varInfo[varId]?.specId || 'V1',
                specName: specInfo[varInfo[varId]?.specId]?.name || '',
                varId: varId,
                varName: varName,
                analysis: cleanLatex(convertAnalysis(mb.analysis))
              }
              
              seeds.push(newQuestion)
              globalIndex++
            })
          }
        })
      }
    })
  }
  
  return seeds
}

// 提取来源
function extractSource(problem) {
  const match = problem.match(/\[(.*?)\]/)
  return match ? match[1] : '未知来源'
}

// 提取答案
function extractAnswer(analysis) {
  if (typeof analysis === 'object' && analysis.conclusion) {
    return cleanLatex(analysis.conclusion)
  }
  return ''
}

// 提取关键步骤
function extractKeyPoints(analysis) {
  if (typeof analysis === 'object' && analysis.key_steps) {
    return analysis.key_steps.map(step => cleanLatex(step))
  }
  return []
}

// 提取易错点
function extractPitfalls(analysis) {
  if (typeof analysis === 'object' && analysis.common_pitfalls) {
    return analysis.common_pitfalls.map(p => cleanLatex(p))
  }
  return []
}

// 提取武器标签
function extractWeapons(varId) {
  const weaponMap = {
    '1.1': ['S-VEC-01'],
    '1.2': ['S-VEC-02'],
    '2.1': ['S-VEC-03'],
    '2.2': ['S-VEC-04']
  }
  return weaponMap[varId] || []
}

// 提取策略提示
function extractStrategyHint(logicKey) {
  return logicKey || ''
}

// 构建最终输出结构
function buildOutputStructure(seeds) {
  // 按 M04 格式组织
  const output = {
    motif_id: 'M05',
    motif_name: '平面向量',
    version: 'v2_RAG',
    last_updated: new Date().toISOString().split('T')[0],
    description: '【种子库 v1.0】从 M05 master_benchmarks 提取的高质量种子题，共 12 道。',
    specialties: [
      {
        spec_id: 'V1',
        spec_name: '数量积的核心度量',
        variations: [
          {
            var_id: '1.1',
            name: '投影向量与夹角范围',
            original_pool: seeds.filter(q => q.varId === '1.1')
          },
          {
            var_id: '1.2',
            name: '极化恒等式与最值秒杀',
            original_pool: seeds.filter(q => q.varId === '1.2')
          }
        ]
      },
      {
        spec_id: 'V2',
        spec_name: '向量的几何表征与消元',
        variations: [
          {
            var_id: '2.1',
            name: '线性运算、三点共线与等系数和',
            original_pool: seeds.filter(q => q.varId === '2.1')
          },
          {
            var_id: '2.2',
            name: '建系策略与综合最值',
            original_pool: seeds.filter(q => q.varId === '2.2')
          }
        ]
      }
    ]
  }
  
  return output
}

// 主函数
function main() {
  console.log('🚀 开始提取 M05 种子题...\n')
  
  const m05 = loadM05()
  const seeds = extractAndCleanQuestions(m05)
  
  console.log(`📦 提取到 ${seeds.length} 道种子题\n`)
  
  // 按变例和难度统计
  const stats = {}
  seeds.forEach(q => {
    const key = `${q.varId}_${q.level}`
    stats[key] = (stats[key] || 0) + 1
  })
  
  console.log('📊 分布统计:')
  Object.entries(stats).sort().forEach(([key, count]) => {
    console.log(`  ${key}: ${count} 题`)
  })
  
  // 构建输出结构
  const output = buildOutputStructure(seeds)
  
  // 保存
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8')
  console.log(`\n✅ 已保存到: ${OUTPUT_PATH}`)
  
  // 打印示例
  console.log('\n📝 示例题目 (第一道):')
  const sample = seeds[0]
  console.log(`  ID: ${sample.id}`)
  console.log(`  来源: ${sample.source}`)
  console.log(`  题目: ${sample.problem.substring(0, 60)}...`)
  console.log(`  答案: ${sample.answer}`)
  console.log(`  武器: ${sample.meta.weapons.join(', ')}`)
}

main()
