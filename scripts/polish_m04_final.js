/**
 * M04.json 最终抛光脚本
 * 
 * 任务：
 * 1. 锁定 L2 答案与题干 (M04_1.1_L2_005)
 * 2. 具象化 L2 场景 (M04_2.1_L2_003)
 * 3. 清洗 LaTeX 转义符 (全局)
 * 4. 强制置顶防御性标签 (复合函数)
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

function saveM04(data) {
  fs.writeFileSync(M04_PATH, JSON.stringify(data, null, 2), 'utf-8')
  console.log('✅ M04.json 已保存')
}

// 清洗 LaTeX 转义符
function cleanLatexEscapes(text) {
  if (!text || typeof text !== 'string') return text
  
  // 将 \\\\frac 还原为 \\frac (JSON 中 \\ 表示一个 \)
  // 目标：确保解析后传给前端的是单个 \
  // 策略：将连续多个 \\ 统一为单个 \
  // 但要注意：JSON 中 \\ 表示一个 \，所以 \\\\ 表示两个 \
  // 我们需要将 \\\\ 替换为 \\（在 JSON 层面）
  
  let result = text
  
  // 处理过度转义：\\\\frac -> \\frac
  result = result.replace(/\\\\\\\\/g, '\\\\')
  
  // 处理双反斜杠后跟命令：\\\\frac -> \\frac
  result = result.replace(/\\\\(frac|sqrt|ln|log|sin|cos|tan|sum|int|lim|cdot|times|le|ge|ne|approx|infty|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|phi|omega)/g, '\\$1')
  
  return result
}

// 检查是否包含 log(f(x)) 结构
function hasLogOfFunction(text) {
  if (!text || typeof text !== 'string') return false
  // 检查是否包含 log(f(x)) 或 ln(f(x)) 结构
  const patterns = [
    /log.*\(/i,
    /ln.*\(/i,
    /\\log.*\(/,
    /\\ln.*\(/
  ]
  return patterns.some(p => p.test(text))
}

// 主处理函数
function polishM04() {
  const m04 = loadM04()
  
  let stats = {
    answerFixed: 0,
    questionPolished: 0,
    latexCleaned: 0,
    weaponReordered: 0,
    totalQuestions: 0
  }
  
  // 遍历所有题目
  if (m04.specialties) {
    m04.specialties.forEach(spec => {
      if (spec.variations) {
        spec.variations.forEach(variation => {
          if (variation.original_pool) {
            variation.original_pool.forEach(q => {
              stats.totalQuestions++
              
              // 任务1: 锁定 L2 答案 (M04_1.1_L2_005)
              if (q.id === 'M04_1.1_L2_005') {
                console.log(`\n📝 [任务1] 处理 ${q.id}`)
                console.log(`  原答案: ${q.answer}`)
                
                // 修正答案为 7
                q.answer = '7'
                
                // 清理 key_points 中的修正说明
                q.key_points = [
                  '平方关联法：$(x^{1/2}+x^{-1/2})^2 = x+x^{-1}+2=9$，得 $x+x^{-1}=7$',
                  '分子 $x^2+x^{-2}+2 = (x+x^{-1})^2 = 49$',
                  '原式 $= 49/7 = 7$'
                ]
                
                // 同步更新 meta.core_logic
                if (q.meta) {
                  q.meta.core_logic = [...q.key_points]
                }
                
                stats.answerFixed++
                console.log(`  ✅ 新答案: ${q.answer}`)
              }
              
              // 任务2: 具象化 L2 场景 (M04_2.1_L2_003)
              if (q.id === 'M04_2.1_L2_003') {
                console.log(`\n📝 [任务2] 处理 ${q.id}`)
                console.log(`  原题目: ${q.problem}`)
                
                // 具象化题目：直接给出 A 点坐标
                q.problem = '已知 $f(x) = a^{x-2}$ 过定点 $A$，$g(x)=\\log_a(x+1)$ 过定点 $B$。若 $a=2$，且 $A(2,1)$，则直线 $AB$ 的斜率为（ ）。'
                
                // 更新 key_points
                q.key_points = [
                  '指数函数 $f(x)=2^{x-2}$ 过定点 $(2,1)$（令 $x-2=0$）',
                  '对数函数 $g(x)=\\log_2(x+1)$ 过定点 $(0,0)$（令 $x+1=1$）',
                  '斜率 $k = (1-0)/(2-0) = 1/2$'
                ]
                
                // 更新 analysis
                q.analysis = `【解题思路】本题考查指数函数和对数函数的定点问题。

【详细推导】
1. 指数函数 $f(x)=a^{x-2}$ 的定点：
   令 $x-2=0$，得 $x=2$，$f(2)=a^0=1$
   ∴ 点 $A(2,1)$

2. 对数函数 $g(x)=\\log_a(x+1)$ 的定点：
   令 $x+1=1$，得 $x=0$，$g(0)=\\log_a 1=0$
   ∴ 点 $B(0,0)$

3. 计算斜率：
   $k = \\frac{y_A - y_B}{x_A - x_B} = \\frac{1-0}{2-0} = \\frac{1}{2}$

【易错点警示】记住指数函数 $y=a^{x-k}$ 过定点 $(k,1)$，对数函数 $y=\\log_a(x-k)$ 过定点 $(k+1,0)$。`
                
                if (q.meta) {
                  q.meta.core_logic = [...q.key_points]
                }
                
                stats.questionPolished++
                console.log(`  ✅ 新题目: ${q.problem.substring(0, 60)}...`)
              }
              
              // 任务3: 清洗 LaTeX 转义符
              const fieldsToClean = ['analysis', 'problem', 'answer']
              let latexChanged = false
              
              fieldsToClean.forEach(field => {
                if (q[field] && typeof q[field] === 'string') {
                  const cleaned = cleanLatexEscapes(q[field])
                  if (cleaned !== q[field]) {
                    q[field] = cleaned
                    latexChanged = true
                  }
                }
              })
              
              // 清洗 key_points
              if (q.key_points && Array.isArray(q.key_points)) {
                q.key_points = q.key_points.map(kp => {
                  if (typeof kp === 'string') {
                    return cleanLatexEscapes(kp)
                  }
                  return kp
                })
              }
              
              // 清洗 meta.core_logic
              if (q.meta && q.meta.core_logic && Array.isArray(q.meta.core_logic)) {
                q.meta.core_logic = q.meta.core_logic.map(cl => {
                  if (typeof cl === 'string') {
                    return cleanLatexEscapes(cl)
                  }
                  return cl
                })
              }
              
              if (latexChanged) {
                stats.latexCleaned++
              }
              
              // 任务4: 强制置顶防御性标签 (复合函数)
              // 检查是否包含 log(f(x)) 结构
              const textToCheck = [
                q.problem,
                q.analysis,
                q.key_points?.join(' ')
              ].filter(Boolean).join(' ')
              
              if (hasLogOfFunction(textToCheck) && q.meta && q.meta.weapons) {
                // 确保 S-LOG-04 排在第一位
                const weapons = q.meta.weapons
                const hasLog04 = weapons.includes('S-LOG-04')
                const hasFunc01 = weapons.includes('S-FUNC-01')
                
                if (hasLog04 && weapons[0] !== 'S-LOG-04') {
                  // 将 S-LOG-04 移到第一位
                  const filtered = weapons.filter(w => w !== 'S-LOG-04')
                  q.meta.weapons = ['S-LOG-04', ...filtered]
                  stats.weaponReordered++
                  console.log(`  🔧 [任务4] 重排武器: ${q.id} -> S-LOG-04 置顶`)
                } else if (hasFunc01 && weapons[0] !== 'S-LOG-04' && !hasLog04) {
                  // 如果没有 S-LOG-04 但有 S-FUNC-01，且题目涉及复合函数
                  // 添加 S-LOG-04 并置顶
                  const filtered = weapons.filter(w => w !== 'S-FUNC-01')
                  q.meta.weapons = ['S-LOG-04', 'S-FUNC-01', ...filtered]
                  stats.weaponReordered++
                  console.log(`  🔧 [任务4] 添加武器: ${q.id} -> S-LOG-04 置顶`)
                }
              }
            })
          }
        })
      }
    })
  }
  
  // 保存结果
  saveM04(m04)
  
  // 打印统计
  console.log('\n📊 抛光统计:')
  console.log(`  - 总题目数: ${stats.totalQuestions}`)
  console.log(`  - 答案锁定: ${stats.answerFixed}`)
  console.log(`  - 题目具象化: ${stats.questionPolished}`)
  console.log(`  - LaTeX 清洗: ${stats.latexCleaned}`)
  console.log(`  - 武器重排: ${stats.weaponReordered}`)
}

// 执行
console.log('🚀 开始 M04.json 最终抛光...\n')
polishM04()
console.log('\n✅ 抛光完成！')
