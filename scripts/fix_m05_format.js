/**
 * M05.json 格式修复脚本 V2
 * 直接修复文件中的格式问题
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const M05_PATH = path.join(__dirname, '../src/data/M05.json')
const OUTPUT_PATH = path.join(__dirname, '../src/data/M05_fixed.json')

function fixM05() {
  console.log('🔧 开始修复 M05.json...\n')
  
  let content = fs.readFileSync(M05_PATH, 'utf-8')
  
  // 1. 移除所有独立的 `]` `[` 连接（数组拼接错误）
  // 将 `]\n[` 或 `]  \n  [` 替换为 `,`
  content = content.replace(/\]\s*\n\s*\[/g, ',')
  
  // 2. 验证修复后的 JSON 是否有效
  try {
    const data = JSON.parse(content)
    console.log('✅ JSON 格式修复成功')
    
    // 3. 统计题目
    let totalQuestions = 0
    const stats = {}
    
    if (data.specialties) {
      data.specialties.forEach(spec => {
        if (spec.variations) {
          spec.variations.forEach(v => {
            if (v.original_pool) {
              const count = v.original_pool.length
              stats[v.var_id] = { name: v.name, count }
              totalQuestions += count
            }
          })
        }
      })
    }
    
    console.log(`\n📊 提取到 ${totalQuestions} 道题目\n`)
    Object.entries(stats).forEach(([vid, info]) => {
      console.log(`  ${vid} ${info.name}: ${info.count} 题`)
    })
    
    // 4. 保存修复后的文件
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`\n✅ 已保存到: ${OUTPUT_PATH}`)
    
  } catch (e) {
    console.log('❌ JSON 格式修复失败:', e.message)
    
    // 尝试更激进的修复
    console.log('\n🔄 尝试更激进的修复...')
    
    // 移除所有控制字符
    content = content.replace(/[\x00-\x1F\x7F]/g, char => {
      if (char === '\n' || char === '\r' || char === '\t') return char
      return ''
    })
    
    // 再次尝试
    try {
      const data = JSON.parse(content)
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf-8')
      console.log('✅ 激进修复成功')
    } catch (e2) {
      console.log('❌ 激进修复也失败:', e2.message)
      
      // 保存修复后的内容用于调试
      fs.writeFileSync(OUTPUT_PATH + '.txt', content, 'utf-8')
      console.log('📝 已保存原始内容到: ' + OUTPUT_PATH + '.txt')
    }
  }
}

fixM05()
