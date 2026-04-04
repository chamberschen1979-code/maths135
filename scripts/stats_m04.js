/**
 * M04.json 题目统计脚本
 * 统计每个专项、每个变例、每个难度的题目数量
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const M04_PATH = path.join(__dirname, '../src/data/M04.json')

function loadM04() {
  const content = fs.readFileSync(M04_PATH, 'utf-8')
  return JSON.parse(content)
}

function generateStats() {
  const m04 = loadM04()
  
  // 总体统计
  let totalQuestions = 0
  const levelStats = { L1: 0, L2: 0, L3: 0, L4: 0 }
  const specStats = []
  
  if (m04.specialties) {
    m04.specialties.forEach(spec => {
      const specInfo = {
        specId: spec.spec_id,
        specName: spec.name,
        total: 0,
        levels: { L1: 0, L2: 0, L3: 0, L4: 0 },
        variations: []
      }
      
      if (spec.variations) {
        spec.variations.forEach(variation => {
          const varInfo = {
            varId: variation.var_id,
            varName: variation.name,
            total: 0,
            levels: { L1: 0, L2: 0, L3: 0, L4: 0 }
          }
          
          if (variation.original_pool) {
            variation.original_pool.forEach(q => {
              totalQuestions++
              specInfo.total++
              varInfo.total++
              
              const level = q.level || 'L2'
              levelStats[level] = (levelStats[level] || 0) + 1
              specInfo.levels[level] = (specInfo.levels[level] || 0) + 1
              varInfo.levels[level] = (varInfo.levels[level] || 0) + 1
            })
          }
          
          specInfo.variations.push(varInfo)
        })
      }
      
      specStats.push(specInfo)
    })
  }
  
  // 打印报告
  console.log('\n' + '='.repeat(70))
  console.log('📊 M04.json 题目统计报告')
  console.log('='.repeat(70))
  
  console.log('\n📌 总体统计')
  console.log('-'.repeat(40))
  console.log(`总题目数: ${totalQuestions}`)
  console.log(`难度分布:`)
  Object.entries(levelStats).forEach(([level, count]) => {
    const pct = totalQuestions > 0 ? ((count / totalQuestions) * 100).toFixed(1) : 0
    const bar = '█'.repeat(Math.round(count / 2))
    console.log(`  ${level}: ${count.toString().padStart(3)} (${pct}%) ${bar}`)
  })
  
  console.log('\n' + '='.repeat(70))
  console.log('📋 专项统计')
  console.log('='.repeat(70))
  
  specStats.forEach(spec => {
    console.log(`\n🔹 ${spec.specId}: ${spec.specName}`)
    console.log(`   总计: ${spec.total} 题`)
    console.log(`   难度: L1=${spec.levels.L1} | L2=${spec.levels.L2} | L3=${spec.levels.L3} | L4=${spec.levels.L4}`)
    
    spec.variations.forEach(v => {
      if (v.total > 0) {
        console.log(`   ├─ ${v.varId} ${v.varName}: ${v.total} 题 (L2=${v.levels.L2}, L3=${v.levels.L3}, L4=${v.levels.L4})`)
      }
    })
  })
  
  console.log('\n' + '='.repeat(70))
  console.log('📈 难度分布矩阵')
  console.log('='.repeat(70))
  
  // 表头
  console.log('\n专项\\难度\tL1\tL2\tL3\tL4\t总计')
  console.log('-'.repeat(50))
  
  specStats.forEach(spec => {
    const row = [
      spec.specId,
      spec.levels.L1.toString(),
      spec.levels.L2.toString(),
      spec.levels.L3.toString(),
      spec.levels.L4.toString(),
      spec.total.toString()
    ]
    console.log(row.join('\t'))
  })
  
  console.log('-'.repeat(50))
  const totalRow = [
    '总计',
    levelStats.L1.toString(),
    levelStats.L2.toString(),
    levelStats.L3.toString(),
    levelStats.L4.toString(),
    totalQuestions.toString()
  ]
  console.log(totalRow.join('\t'))
  
  console.log('\n' + '='.repeat(70))
  console.log('✅ 统计完成')
  console.log('='.repeat(70) + '\n')
}

// 执行
generateStats()
