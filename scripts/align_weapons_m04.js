/**
 * 武器库对齐脚本 - 清洗 M04.json 的标签关联
 * 
 * 任务：
 * 1. 强化 S-LOG-02：为同构题目添加标签
 * 2. 新增 S-LOG-05：为对数平均题目添加标签
 * 3. 规范 S-FUNC-01：替换为更具体的武器
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const M04_PATH = path.join(__dirname, '../src/data/M04.json')

// 同构相关关键词
const ISOMORPHIC_KEYWORDS = [
  'xe^x', 'xe_x', 'x e^x', 'x e_x',
  'lnx/x', 'ln x/x', '\\frac{\\ln x}{x}',
  '同构', '指对同构', '同构构造', '同构函数',
  'a^b.*b^a', 'f\\(x\\).*=.*f\\(y\\)'
]

// 对数平均相关关键词
const LOG_MEAN_KEYWORDS = [
  '对数平均', 'logarithmic mean',
  '\\frac{x_1-x_2}{\\ln x_1-\\ln x_2}',
  '\\frac{a-b}{\\ln a-\\ln b}',
  '极值点偏移', '双变量.*证明'
]

function loadM04() {
  const content = fs.readFileSync(M04_PATH, 'utf-8')
  return JSON.parse(content)
}

function saveM04(data) {
  fs.writeFileSync(M04_PATH, JSON.stringify(data, null, 2), 'utf-8')
  console.log('✅ M04.json 已保存')
}

// 检查文本是否包含关键词
function containsKeywords(text, keywords) {
  if (!text || typeof text !== 'string') return false
  const lowerText = text.toLowerCase()
  return keywords.some(kw => {
    try {
      // 简单匹配，不做复杂正则
      return lowerText.includes(kw.toLowerCase()) || text.includes(kw)
    } catch {
      return false
    }
  })
}

// 检查题目是否为同构类型
function isIsomorphicQuestion(q) {
  // 1. 检查 varName
  if (q.varName === '指对同构') return true
  
  // 2. 检查 analysis 和 key_points
  const textToCheck = [
    q.analysis,
    q.problem,
    q.key_points?.join(' '),
    q.meta?.core_logic?.join(' ')
  ].filter(Boolean).join(' ')
  
  return containsKeywords(textToCheck, ISOMORPHIC_KEYWORDS)
}

// 检查题目是否涉及对数平均
function isLogMeanQuestion(q) {
  // 只处理 L4 难度题目
  if (q.level !== 'L4') return false
  
  const textToCheck = [
    q.analysis,
    q.problem,
    q.key_points?.join(' '),
    q.meta?.core_logic?.join(' ')
  ].filter(Boolean).join(' ')
  
  return containsKeywords(textToCheck, LOG_MEAN_KEYWORDS)
}

// 确保 weapons 数组存在并添加标签
function ensureWeapon(weapons, weaponId) {
  if (!weapons) return [weaponId]
  if (!Array.isArray(weapons)) return [weaponId]
  if (weapons.includes(weaponId)) return weapons
  return [...weapons, weaponId]
}

// 主处理函数
function processM04() {
  const m04 = loadM04()
  
  let stats = {
    isomorphicAdded: 0,
    logMeanAdded: 0,
    func01Replaced: 0,
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
              
              // 确保 meta.weapons 存在
              if (!q.meta) q.meta = {}
              if (!q.meta.weapons) q.meta.weapons = []
              
              // 任务1: 强化 S-LOG-02
              if (isIsomorphicQuestion(q)) {
                const oldWeapons = [...q.meta.weapons]
                q.meta.weapons = ensureWeapon(q.meta.weapons, 'S-LOG-02')
                if (q.meta.weapons.length > oldWeapons.length) {
                  stats.isomorphicAdded++
                  console.log(`  ✨ [S-LOG-02] ${q.id}: ${q.problem?.substring(0, 50)}...`)
                }
              }
              
              // 任务2: 新增 S-LOG-05
              if (isLogMeanQuestion(q)) {
                const oldWeapons = [...q.meta.weapons]
                q.meta.weapons = ensureWeapon(q.meta.weapons, 'S-LOG-05')
                if (q.meta.weapons.length > oldWeapons.length) {
                  stats.logMeanAdded++
                  console.log(`  🔥 [S-LOG-05] ${q.id}: ${q.problem?.substring(0, 50)}...`)
                }
              }
              
              // 任务3: 规范 S-FUNC-01
              // L3/L4 难题如果只有 S-FUNC-01，替换为更具体的武器
              if ((q.level === 'L3' || q.level === 'L4') && 
                  q.meta.weapons.length === 1 && 
                  q.meta.weapons[0] === 'S-FUNC-01') {
                
                // 根据题目内容选择更具体的武器
                const textToCheck = [
                  q.analysis,
                  q.problem,
                  q.key_points?.join(' ')
                ].filter(Boolean).join(' ')
                
                let newWeapon = null
                if (textToCheck.includes('ln') || textToCheck.includes('log') || textToCheck.includes('对数')) {
                  newWeapon = 'S-LOG-02'
                } else if (textToCheck.includes('导数') || textToCheck.includes('f\'') || textToCheck.includes('单调')) {
                  newWeapon = 'S-DERIV-03'
                } else if (textToCheck.includes('e^') || textToCheck.includes('指数')) {
                  newWeapon = 'S-LOG-02'
                }
                
                if (newWeapon) {
                  q.meta.weapons = [newWeapon, 'S-FUNC-01'] // 保留 S-FUNC-01 作为副标签
                  stats.func01Replaced++
                  console.log(`  🔧 [S-FUNC-01→${newWeapon}] ${q.id}`)
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
  console.log('\n📊 处理统计:')
  console.log(`  - 总题目数: ${stats.totalQuestions}`)
  console.log(`  - S-LOG-02 新增: ${stats.isomorphicAdded}`)
  console.log(`  - S-LOG-05 新增: ${stats.logMeanAdded}`)
  console.log(`  - S-FUNC-01 替换: ${stats.func01Replaced}`)
}

// 执行
console.log('🚀 开始武器库对齐任务...\n')
processM04()
console.log('\n✅ 武器库对齐完成！')
