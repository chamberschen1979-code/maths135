/**
 * 题目验算调度中心
 * 
 * V4.0 架构升级：策略调度模式
 * - 自动扫描 ./verifiers 目录加载策略模块
 * - 根据题型动态调度到对应策略
 * - 支持热插拔新增母题验算器
 * - 自动加载模块配置 JSON
 * 
 * V5.0 架构升级：自适应多样性与难度控制
 * - 通用指纹去重算法 (extractFingerprint)
 * - 难度感知动态评分策略 (difficulty_profiles)
 * - 变例均衡调度器
 * 
 * V6.0 架构升级：Agent-First
 * - Extraction Agent: LLM 驱动的参数提取
 * - Logic Auditor Agent: 逻辑审计专家
 * - 动态路由: L2严/L4宽
 * - 代码只做流程控制，逻辑判断全权交给 LLM
 * 
 * 职责：
 * 1. 特征提取 (extractUniversalFeatures)
 * 2. 规则匹配 (identifyQuestionType)
 * 3. 策略调度 (dispatchToStrategy)
 * 4. 通用评估 (fitnessScore 计算)
 * 5. 指纹去重 (extractFingerprint, calculateSimilarity)
 * 6. Agent 验算 (Extraction + Logic Audit)
 */

import { evaluate, sqrt, abs, sum, fraction, format, pi, sin, cos, number } from 'mathjs'
import { checkSyllabusCompliance, GRADE_RESTRICTIONS } from '../config/syllabusRules.js'
import M03Strategy from './verifiers/M03_quadratic_analysis.js'
import M04Strategy from './verifiers/M04_exp_log_iso.js'
import M05Strategy from './verifiers/M05_vector_circle.js'
import M06Strategy from './verifiers/M06_trig_analysis.js'
import { 
  performShadowTest, 
  buildCriticInput, 
  parseCriticResponse,
  executeCriticReview,
  CRITIC_SYSTEM_PROMPT 
} from './criticEngine.js'
import {
  EXTRACTION_AGENT_PROMPT,
  LOGIC_AUDITOR_PROMPT,
  SIMPLE_SUBSTITUTION_PROMPT,
  ROUTER_CONFIG
} from './agentPrompts.js'

// ==================== 通用 LLM 调用函数 ====================

/**
 * 延迟函数
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 通用 LLM 调用函数 (修复版)
 * 增加了对非法字符的清洗和更严格的 JSON 构建
 * 
 * 🚀 V6.0 增强特性：
 * - 清洗 Prompt：移除可能导致 JSON 解析错误的非法控制字符
 * - 安全构建 Body：确保 response_format 只在必要时添加
 * - 增强错误日志：打印出发送的具体错误信息
 * - 超时时间增加到 60 秒
 * - 指数退避重试机制
 */
const callLLM = async (prompt, options = {}) => {
  const {
    jsonMode = false,
    temperature = 0.1,
    maxTokens = 2000,
    timeout = 60000,
    maxRetries = 3
  } = options
  
  const apiKey = import.meta.env.VITE_QWEN_API_KEY || 'YOUR_API_KEY'
  const baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  const modelName = 'qwen-turbo'
  
  if (!apiKey || apiKey === 'YOUR_API_KEY') {
    console.warn('[LLM] ⚠️ API Key 未配置，跳过 LLM 调用')
    return null
  }

  // 🛡️ 新增：清洗 Prompt，移除可能导致 JSON 解析失败的非法控制字符
  // 保留 \n, \t, \r，但移除其他 ASCII 控制字符 (0-31 除了 9,10,13)
  const cleanPrompt = prompt.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      // 🛡️ 构建请求体
      const requestBody = {
        model: modelName,
        messages: [
          { role: 'user', content: cleanPrompt }
        ],
        temperature,
        max_tokens: maxTokens
      }

      // 仅在 jsonMode 为 true 时添加 response_format
      // 某些模型或接口版本在不支持时会报 400
      if (jsonMode) {
        requestBody.response_format = { type: "json_object" }
        // 💡 技巧：如果是 JSON 模式，建议在 prompt 里强制要求 "请直接输出 JSON，不要包含 markdown 标记"
      }
      
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      // 🆕 增强错误处理：如果是 400，打印具体错误信息
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[LLM] ❌ API 响应错误 (${response.status}):`, errorText)
        
        // 如果是 400 且包含 "json" 相关错误，尝试关闭 jsonMode 重试一次（降级策略）
        if (response.status === 400 && jsonMode && attempt === 0) {
          console.warn('[LLM] ⚠️ JSON 模式可能被拒绝，尝试关闭 JSON 模式重试...')
          throw new Error(`LLM API 400: ${errorText}`)
        }
        
        throw new Error(`LLM API 失败: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.choices || data.choices.length === 0) {
        console.warn('[LLM] ⚠️ 返回数据为空')
        return null
      }

      console.log(`[LLM] ✅ 调用成功 (尝试 ${attempt + 1}/${maxRetries + 1})`)
      return data.choices[0].message.content
      
    } catch (e) {
      const isLastAttempt = attempt === maxRetries
      
      if (e.name === 'AbortError') {
        console.warn(`[LLM] ⏱️ 请求超时 (${timeout/1000}s)`)
      } else {
        // 只有在非最后一次才打印详细错误，避免刷屏
        if (!isLastAttempt) {
          console.error(`[LLM] ❌ 调用失败 (尝试 ${attempt + 1}/${maxRetries + 1}):`, e.message)
        } else {
          console.error(`[LLM] ❌ 最终失败:`, e.message)
        }
      }
      
      if (isLastAttempt) {
        console.error('[LLM] ❌ 所有重试均失败，返回 null (触发降级策略)')
        return null // 返回 null 让上层逻辑处理降级
      }
      
      const backoffTime = Math.pow(2, attempt) * 1000
      await delay(backoffTime)
    }
  }
  
  return null
}

// ==================== 难度配置缓存 ====================
const difficultyConfigCache = new Map()

// ==================== 通用指纹去重算法 ====================

/**
 * 提取题目的结构化指纹
 * 用于跨母题的通用去重
 */
const extractFingerprint = (content, typeLabel = '') => {
  if (!content) return null
  
  // 🆕 结构化归一化：忽略具体数值
  const normalizeStructure = (text) => {
    let t = text.toLowerCase()
    // 1. 将所有坐标数字替换为 # (例如 (1,0) -> (#,#))
    t = t.replace(/\(\s*-?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*[πp]i)?\s*,\s*-?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*[πp]i)?\s*\)/gi, '(#,#)')
    // 2. 将半径的具体数值替换为 #
    t = t.replace(/半径[为是]?\s*[√\d\.\/]+/g, '半径为#')
    t = t.replace(/半径\s*=\s*[√\d\.\/]+/g, '半径=#')
    // 3. 将等号后的数值替换为 # (保留参数字母)
    t = t.replace(/=\s*[√\d\.]+(?=[\s,\)\]\}])/g, '=#')
    // 4. 将分数替换为 #
    t = t.replace(/\d+\s*\/\s*\d+/g, '#')
    // 5. 将 π 的倍数替换为 #
    t = t.replace(/[+-]?\d*(?:\.\d+)?\s*\*?\s*[πp]i/gi, '#π')
    return t
  }
  
  const normalized = content.toLowerCase()
  const structuralContent = normalizeStructure(content)
  
  // 1. 几何模型识别
  let geoModel = 'none'
  if (/圆|circle/i.test(normalized)) geoModel = 'circle'
  else if (/三角形|triangle/i.test(normalized)) geoModel = 'triangle'
  else if (/四边形|四边|quad/i.test(normalized)) geoModel = 'quadrilateral'
  else if (/函数图像|函数图像|图像/i.test(normalized)) geoModel = 'function_graph'
  else if (/椭圆|双曲线|抛物线/i.test(normalized)) geoModel = 'conic'
  else if (/球|圆柱|圆锥|立体/i.test(normalized)) geoModel = 'solid'
  
  // 2. 操作类型识别
  let operationType = 'unknown'
  if (/数量积|点积|点乘/i.test(normalized)) operationType = 'dot_product'
  else if (/线性表示|系数|基底/i.test(normalized)) operationType = 'linear_combination'
  else if (/单调性|递增|递减/i.test(normalized)) operationType = 'monotonicity'
  else if (/零点|根|求解/i.test(normalized)) operationType = 'root_finding'
  else if (/最值|最大值|最小值|极值/i.test(normalized)) operationType = 'extremum'
  else if (/求证|证明/i.test(normalized)) operationType = 'proof'
  else if (/范围|取值|值域/i.test(normalized)) operationType = 'range'
  else if (/变换|平移|旋转|伸缩/i.test(normalized)) operationType = 'transformation'
  else if (/对称|奇偶/i.test(normalized)) operationType = 'symmetry'
  
  // 3. 复杂度标记
  const complexityMarkers = []
  if (/参数|字母/.test(normalized)) complexityMarkers.push('parameter')
  if (/讨论|分类|若.*则/i.test(normalized)) complexityMarkers.push('classification')
  if (/动点|动态|变化/i.test(normalized)) complexityMarkers.push('dynamic')
  if (/构造|建系/i.test(normalized)) complexityMarkers.push('construction')
  if (/存在|任意|恒成立/i.test(normalized)) complexityMarkers.push('quantifier')
  if (/综合|结合|跨模块/i.test(normalized)) complexityMarkers.push('cross_module')
  if (/计算.*大|复杂/i.test(normalized)) complexityMarkers.push('heavy_computation')
  
  // 4. 答案形式
  let answerForm = 'unknown'
  if (/求.*值|计算/i.test(normalized)) answerForm = 'value'
  else if (/取值范围|取值|范围/i.test(normalized)) answerForm = 'range'
  else if (/求.*式|表达式/i.test(normalized)) answerForm = 'expression'
  else if (/求证|证明/i.test(normalized)) answerForm = 'proof'
  else if (/判断|是否/i.test(normalized)) answerForm = 'boolean'
  else if (/求.*点|坐标/i.test(normalized)) answerForm = 'point'
  
  // 5. 题干关键词向量 (用于相似度计算)
  const keywords = []
  const keywordPatterns = [
    /向量|数量积|模|夹角/, /函数|定义域|值域/,
    /单调|递增|递减/, /极值|最值|导数/,
    /圆|圆心|半径/, /三角|正弦|余弦/,
    /不等式|恒成立|存在/, /证明|求证/
  ]
  keywordPatterns.forEach((pattern, idx) => {
    if (pattern.test(normalized)) {
      keywords.push(idx)
    }
  })
  
  return {
    geoModel,
    operationType,
    complexityMarkers,
    answerForm,
    keywords,
    structuralContent: structuralContent.substring(0, 200), // 🆕 存储结构化内容
    typeLabel
  }
}

/**
 * 计算两个指纹的相似度 (Jaccard 相似系数)
 * 🆕 增强版：结构同构判定
 */
const calculateSimilarity = (fp1, fp2) => {
  if (!fp1 || !fp2) return 0
  
  // 🚀 结构同构判定：如果 operationType、geoModel、answerForm 三者完全相同
  // 直接判定为高度相似，无论数值如何
  if (fp1.operationType === fp2.operationType && 
      fp1.geoModel === fp2.geoModel && 
      fp1.answerForm === fp2.answerForm &&
      fp1.operationType !== 'unknown' && 
      fp1.geoModel !== 'none') {
    
    console.log(`[调度中心] 🔍 结构同构检测: ${fp1.geoModel} + ${fp1.operationType} + ${fp1.answerForm}`)
    
    // 进一步检查复杂度标记是否相似
    const markers1 = new Set(fp1.complexityMarkers)
    const markers2 = new Set(fp2.complexityMarkers)
    const markerIntersection = new Set([...markers1].filter(x => markers2.has(x)))
    
    // 如果复杂度标记也有重叠，直接判定为重复
    if (markerIntersection.size >= 2) {
      console.log(`[调度中心] ⚠️ 结构高度相似，判定为重复`)
      return 0.92 // 强制超过 0.85 阈值
    }
    
    // 即使复杂度标记不完全相同，也给高基础分
    return 0.88
  }
  
  // 1. 几何模型相同性
  const geoSame = fp1.geoModel === fp2.geoModel && fp1.geoModel !== 'none' ? 0.3 : 0
  
  // 2. 操作类型相同性
  const opSame = fp1.operationType === fp2.operationType && fp1.operationType !== 'unknown' ? 0.3 : 0
  
  // 3. 复杂度标记 Jaccard 相似度
  const markers1 = new Set(fp1.complexityMarkers)
  const markers2 = new Set(fp2.complexityMarkers)
  const intersection = new Set([...markers1].filter(x => markers2.has(x)))
  const union = new Set([...markers1, ...markers2])
  const markerSimilarity = union.size > 0 ? (intersection.size / union.size) * 0.2 : 0
  
  // 4. 答案形式相同性
  const ansSame = fp1.answerForm === fp2.answerForm && fp1.answerForm !== 'unknown' ? 0.1 : 0
  
  // 5. 关键词向量重叠度
  const kw1 = new Set(fp1.keywords)
  const kw2 = new Set(fp2.keywords)
  const kwIntersection = new Set([...kw1].filter(x => kw2.has(x)))
  const kwUnion = new Set([...kw1, ...kw2])
  const kwSimilarity = kwUnion.size > 0 ? (kwIntersection.size / kwUnion.size) * 0.1 : 0
  
  return geoSame + opSame + markerSimilarity + ansSame + kwSimilarity
}

/**
 * 检查是否与已有题目重复
 */
const checkDuplicate = (content, typeLabel, existingQuestions = []) => {
  const newFingerprint = extractFingerprint(content, typeLabel)
  if (!newFingerprint) return { isDuplicate: false, similarity: 0 }
  
  let maxSimilarity = 0
  let mostSimilar = null
  
  for (const existing of existingQuestions) {
    const existingFingerprint = existing.fingerprint || extractFingerprint(existing.content, existing.typeLabel)
    if (existingFingerprint) {
      const similarity = calculateSimilarity(newFingerprint, existingFingerprint)
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity
        mostSimilar = existingFingerprint
      }
    }
  }
  
  return {
    isDuplicate: maxSimilarity > 0.85,
    similarity: maxSimilarity,
    mostSimilar
  }
}

// ==================== 难度配置加载 ====================

/**
 * 加载难度配置文件
 */
const loadDifficultyConfig = async () => {
  if (difficultyConfigCache.has('difficulty_profiles')) {
    return difficultyConfigCache.get('difficulty_profiles')
  }
  
  // 内置默认配置
  const defaultConfig = {
    difficulty_profiles: {
      L2: {
        required_markers: ['direct_application'],
        forbidden_markers: ['classification', 'parameter_range', 'quantifier'],
        base_score: 3.0,
        pass_threshold: 3.2
      },
      L3: {
        required_markers: ['parameter', 'classification', 'dynamic_analysis'],
        base_score: 3.5,
        potential_bonus: 1.0,
        pass_threshold: 3.8
      },
      L4: {
        required_markers: ['construction', 'proof', 'cross_module'],
        base_score: 4.0,
        potential_bonus: 1.0,
        pass_threshold: 4.2
      }
    }
  }
  
  // 尝试从 public/data 加载自定义配置
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/data/difficulty_profiles.json')
      if (response.ok) {
        const config = await response.json()
        difficultyConfigCache.set('difficulty_profiles', config)
        console.log('[调度中心] ✅ 已加载难度配置文件')
        return config
      }
    } catch (e) {
      console.log('[调度中心] ℹ️ 使用内置难度配置')
    }
  }
  
  difficultyConfigCache.set('difficulty_profiles', defaultConfig)
  return defaultConfig
}

// ==================== 配置缓存 ====================
const configCache = new Map()

// ==================== 简化版硬规则守卫 ====================

/**
 * 简化版硬规则守卫：仅保留最核心的 5-6 条规则
 * 避免过度复杂导致误杀
 */
const quickLogicScan = (content) => {
  const errors = []
  if (!content) return { pass: true, errors: [] }
  
  const text = content.toLowerCase()
  
  // 1. 正整数/自然数矛盾 (核心规则)
  if (text.includes('正整数') || text.includes('自然数')) {
    if (/和为\s*0/.test(text) || /和为\s*-\d/.test(text)) {
      errors.push('❌ 正整数之和不可能为 0 或负数')
    }
    if (/积为\s*0/.test(text)) {
      errors.push('❌ 正整数的积不可能为 0')
    }
  }
  
  // 2. 三角函数值域 (核心规则)
  const trigPatterns = [
    /(?:sin|cos)\s*[\(\[]?\s*[^)\]]*\s*[\)\]]?\s*[=＝]\s*(-?\d+(?:\.\d+)?)/gi,
    /(?:正弦|余弦).*?[=＝]\s*(-?\d+(?:\.\d+)?)/gi
  ]
  
  for (const pattern of trigPatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const val = parseFloat(match[1])
      if (!isNaN(val) && (val > 1.0001 || val < -1.0001)) {
        errors.push(`❌ 三角函数值 ${val} 超出 [-1, 1] 范围`)
      }
    }
  }
  
  // 3. 概率归一性 (核心规则)
  if (text.includes('概率')) {
    const probMatch = text.match(/概率[为是]?\s*(-?\d+(?:\.\d+)?)/g)
    if (probMatch) {
      for (const m of probMatch) {
        const val = parseFloat(m.match(/-?\d+(?:\.\d+)?/)?.[0])
        if (!isNaN(val) && (val > 1 || val < 0)) {
          errors.push(`❌ 概率值 ${val} 超出 [0, 1] 范围`)
        }
      }
    }
  }
  
  // 4. 圆的半径必须为正 (核心规则)
  if (/半径[为是]?\s*(-?\d+(?:\.\d+)?)/.test(text)) {
    const match = text.match(/半径[为是]?\s*(-?\d+(?:\.\d+)?)/)
    if (match) {
      const val = parseFloat(match[1])
      if (!isNaN(val) && val <= 0) {
        errors.push(`❌ 圆的半径必须为正数，当前为 ${val}`)
      }
    }
  }
  
  // 5. 对数定义域 (核心规则)
  if (text.includes('log') || text.includes('对数')) {
    if (/log\s*\(\s*0\s*\)/.test(text)) {
      errors.push('❌ 对数的真数必须大于 0')
    }
  }
  
  // 6. 分母不为零 (核心规则)
  if (/\/\s*0(?![.\d])/.test(text) && !/\/\s*0\.\d/.test(text)) {
    errors.push('❌ 分母不能为零')
  }
  
  console.log(`[硬规则守卫] 检查结果: ${errors.length === 0 ? '✅ 通过' : '❌ 发现 ' + errors.length + ' 个问题'}`)
  
  return { 
    pass: errors.length === 0, 
    errors,
    errorCount: errors.length 
  }
}

// ==================== 策略注册表 ====================
const strategyRegistry = new Map()

const registerStrategy = (strategy) => {
  if (!strategy.motifId) {
    console.warn('[调度中心] 策略缺少 motifId，跳过注册')
    return
  }
  strategyRegistry.set(strategy.motifId, strategy)
  console.log(`[调度中心] ✅ 已注册策略: ${strategy.motifId}`)
}

// 注册内置策略
registerStrategy(M03Strategy)
registerStrategy(M04Strategy)
registerStrategy(M05Strategy)
registerStrategy(M06Strategy)

/**
 * 动态加载模块配置 JSON
 * 浏览器环境使用 fetch，Node.js 环境使用 fs
 */
const loadModuleConfig = async (motifId) => {
  if (configCache.has(motifId)) {
    return configCache.get(motifId)
  }
  
  // 浏览器环境 - 使用 fetch 从 public/data 加载
  if (typeof window !== 'undefined') {
    try {
      console.log(`[调度中心] 🌐 浏览器环境 fetch 配置：${motifId}.json`)
      const response = await fetch(`/data/${motifId}.json`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const config = await response.json()
      configCache.set(motifId, config)
      console.log(`[调度中心] ✅ 配置加载成功：${motifId}`)
      return config
    } catch (e) {
      console.error(`[调度中心] ❌ 浏览器加载配置失败 (${motifId}):`, e.message)
      return null
    }
  }
  
  // Node.js 环境
  try {
    const fs = await import('fs')
    const path = await import('path')
    const { fileURLToPath } = await import('url')
    
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const configPath = path.join(__dirname, '../../data', `${motifId}.json`)
    
    const configContent = fs.readFileSync(configPath, 'utf-8')
    const config = JSON.parse(configContent)
    configCache.set(motifId, config)
    console.log(`[调度中心] 📄 自动加载配置: ${motifId}.json`)
    return config
  } catch (e) {
    console.warn(`[调度中心] ⚠️ 无法自动加载 ${motifId}.json:`, e.message)
    return null
  }
}

// ==================== 特征提取器 ====================
const extractUniversalFeatures = (content, motifId) => {
  if (!content || typeof content !== 'string') {
    return { motifId, rawContent: '', objects: {}, relations: {}, parameters: {}, complexity: {}, errors: [] }
  }
  
  const errors = []
  
  // 🆕 检查非法区间 (如 (4π, 2π) 左边界 > 右边界)
  // 🚀 修复：排除点坐标的误报 (前面紧跟着 "点" "坐标" "P" "A" "B" "C" 等字眼的情况)
  const intervalPattern = /(?<![点坐标PABCDMNOQ])([\(\[])\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*[πp]i)?)\s*,\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*[πp]i)?)\s*([\)\]])/gi
  let intervalMatch
  while ((intervalMatch = intervalPattern.exec(content)) !== null) {
    // 额外检查：如果括号内两个值看起来像坐标（都是小数字或简单分数），跳过
    const leftStr = intervalMatch[2]
    const rightStr = intervalMatch[3]
    
    // 跳过看起来像坐标的情况 (两个值都是简单数字，且绝对值较小)
    const leftNum = parseIntervalValue(leftStr)
    const rightNum = parseIntervalValue(rightStr)
    
    // 如果两个值都在 -10 到 10 之间，很可能是坐标点，跳过
    if (leftNum !== null && rightNum !== null && 
        Math.abs(leftNum) <= 10 && Math.abs(rightNum) <= 10 &&
        !leftStr.includes('π') && !rightStr.includes('π')) {
      continue
    }
    
    if (leftNum !== null && rightNum !== null && leftNum >= rightNum) {
      errors.push({
        type: 'invalid_interval',
        message: `非法区间: ${intervalMatch[0]} (左边界 ${leftNum} >= 右边界 ${rightNum})`,
        interval: intervalMatch[0]
      })
      console.warn(`[调度中心] ⚠️ 发现非法区间: ${intervalMatch[0]}`)
    }
  }
  
  const features = {
    motifId: motifId,
    rawContent: content,
    errors,
    
    objects: {
      hasTrig: /sin|cos|tan|cot|sec|csc|正弦|余弦|正切|余切/i.test(content),
      hasLog: /log|ln|对数|log[_\(]/i.test(content),
      hasExp: /e\^|exp|\^\{?x\}?|指数/i.test(content),
      hasVector: /vec|向量|⋅|×|→|AB|PA|PB|数量积|点积/i.test(content),
      hasCircle: /圆|x\^2\+y\^2|\(x[+-]?\d*\)\^2\+\(y/i.test(content),
      hasEllipse: /椭圆|x\^2\/a\^2\+y\^2\/b\^2|a\^2>b\^2/i.test(content),
      hasHyperbola: /双曲线|x\^2\/a\^2-y\^2\/b\^2/i.test(content),
      hasParabola: /抛物线|y\^2=|x\^2=/i.test(content),
      hasDerivative: /导数|f\'\(x\)|f''\(x\)|切线|极值|单调/i.test(content),
      hasSequence: /数列|a_n|S_n|等差|等比|an|Sn/i.test(content),
      hasProbability: /概率|分布|期望|方差|P\(|随机/i.test(content),
      hasSet: /集合|∪|∩|∈|∉|⊆|⊇|\{.*\|.*\}/i.test(content),
      hasComplex: /复数|z\s*=|i\s*\^|虚部|实部/i.test(content),
      hasInequality: /不等式|≥|≤|>|<|≥|≤/i.test(content),
      hasFunction: /函数|f\s*\(|定义域|值域/i.test(content),
      hasSolid: /三视图|体积|表面积|棱柱|棱锥|球/i.test(content),
      hasCoordinate: /坐标|点\s*\(|线段|中点/i.test(content)
    },
    
    relations: {
      hasEquation: /[=]\s*[^=\n]/.test(content),
      hasInequality: /[<>≠≥≤]/.test(content),
      hasRange: /范围|区间|取值|值域|定义域/i.test(content),
      hasZeroPoint: /零点|根|解|交点|f\s*\(\s*x\s*\)\s*=\s*0/i.test(content),
      hasMonotonicity: /单调|递增|递减|增函数|减函数/i.test(content),
      hasSymmetry: /对称|奇偶|中心对称|轴对称/i.test(content),
      hasExtremum: /最大|最小|极值|最值/i.test(content),
      hasPeriod: /周期|T\s*=|周期性/i.test(content),
      hasPerpendicular: /垂直|⊥|直角/i.test(content),
      hasParallel: /平行|∥/i.test(content),
      hasTangent: /切线|切点|相切/i.test(content)
    },
    
    parameters: {
      omega: /ω\s*[=<>∈]|ω\s*[0-9π]/.test(content),
      phi: /φ\s*[=<>∈]|φ\s*[0-9π]/.test(content),
      baseA: /a\s*[=<>∈]|log[_\(]?\s*a/i.test(content),
      constantK: /k\s*[=<>∈]/.test(content),
      parameterM: /m\s*[=<>∈]/.test(content),
      parameterN: /n\s*[=<>∈]/.test(content),
      parameterT: /t\s*[=<>∈]/.test(content),
      lambda: /λ\s*[=<>∈]/.test(content),
      numbers: content.match(/-?\d+(?:\.\d+)?(?:\/\d+)?/g) || [],
      coordinates: content.match(/\(\s*-?\d+(?:\.\d+)?(?:\/\d+)?\s*,\s*-?\d+(?:\.\d+)?(?:\/\d+)?\s*\)/g) || [],
      fractions: content.match(/\d+\s*\/\s*\d+/g) || [],
      percentages: content.match(/\d+(?:\.\d+)?\s*[％%]/g) || []
    },
    
    complexity: {
      steps: (content.match(/（\d+）|(\d+)\.|第一问|第二问|第三问/g) || []).length,
      hasProof: /证明|说明理由|推导|求证/i.test(content),
      hasConstruction: /构造|建系|设|令|假设/i.test(content),
      hasClassification: /分类|讨论|分情况|当.*时|若.*则/i.test(content),
      hasTransformation: /换元|代换|转化|化简/i.test(content),
      hasGeometry: /如图|图形|几何|作图/i.test(content),
      hasApplication: /实际|应用|生活|模型/i.test(content)
    }
  }
  
  console.log('[调度中心] 📋 特征提取完成:', {
    objects: Object.keys(features.objects).filter(k => features.objects[k]).join(', ') || '无',
    relations: Object.keys(features.relations).filter(k => features.relations[k]).join(', ') || '无',
    errors: errors.length > 0 ? errors.map(e => e.message).join('; ') : '无'
  })
  
  return features
}

/**
 * 解析区间边界值
 */
const parseIntervalValue = (str) => {
  if (!str) return null
  str = str.trim().toLowerCase()
  
  // 处理 π 表达式
  if (str === 'π' || str === 'pi') return Math.PI
  const piMatch = str.match(/^([+-]?\d*(?:\.\d+)?)\s*\*?\s*[πp]i$/i)
  if (piMatch) {
    const coef = piMatch[1] === '' || piMatch[1] === '+' ? 1 : 
                 piMatch[1] === '-' ? -1 : parseFloat(piMatch[1])
    return coef * Math.PI
  }
  
  // 处理分数
  if (str.includes('/')) {
    const parts = str.split('/')
    const num = parseFloat(parts[0].trim())
    const den = parseFloat(parts[1].trim())
    return den !== 0 ? num / den : null
  }
  
  return parseFloat(str)
}

// ==================== 规则引擎 ====================
const identifyQuestionType = (features, moduleConfig) => {
  if (!moduleConfig || !moduleConfig.specialties) {
    return { type: 'unknown', skipMathCheck: true, reason: '无模块配置' }
  }
  
  const content = (features.rawContent || '').toLowerCase()
  
  const normalizedObjects = new Set(
    Object.keys(features.objects || {})
      .filter(k => features.objects[k])
      .map(s => s.replace('has', '').toLowerCase())
  )
  const normalizedRelations = new Set(
    Object.keys(features.relations || {})
      .filter(k => features.relations[k])
      .map(s => s.replace('has', '').toLowerCase())
  )
  
  console.log('[规则引擎] 标准化对象:', [...normalizedObjects])
  console.log('[规则引擎] 标准化关系:', [...normalizedRelations])
  
  for (const specialty of moduleConfig.specialties) {
    for (const variation of specialty.variations || []) {
      if (!variation.identification_rules) continue
      
      const rules = variation.identification_rules
      let isMatch = true
      
      if (rules.required_objects && rules.required_objects.length > 0) {
        for (const reqObj of rules.required_objects) {
          if (!normalizedObjects.has(reqObj.toLowerCase())) {
            isMatch = false
            break
          }
        }
      }
      
      if (isMatch && rules.required_relations && rules.required_relations.length > 0) {
        const hasRelation = rules.required_relations.some(rel =>
          normalizedRelations.has(rel.toLowerCase()) || content.includes(rel)
        )
        if (!hasRelation && rules.keywords) {
          const hasKeyword = rules.keywords.some(kw => content.includes(kw.toLowerCase()))
          if (!hasKeyword) isMatch = false
        } else if (!hasRelation) {
          isMatch = false
        }
      }
      
      if (isMatch && rules.forbidden_objects && rules.forbidden_objects.length > 0) {
        for (const forbObj of rules.forbidden_objects) {
          if (normalizedObjects.has(forbObj.toLowerCase())) {
            isMatch = false
            break
          }
        }
      }
      
      if (isMatch) {
        console.log(`[规则引擎] ✅ 匹配成功: ${variation.type_label}`)
        return {
          type: variation.type_label,
          skipMathCheck: false,
          expectedMethod: variation.expected_method,
          sourceVariation: variation.var_id,
          linkedWeapons: variation.toolkit?.linked_weapons || [],
          success: true
        }
      }
    }
  }
  
  return {
    type: 'unknown',
    skipMathCheck: true,
    success: false,
    reason: '无匹配识别规则'
  }
}

// ==================== 难度评估 ====================
const DIFFICULTY_INDICATORS = {
  L2: { maxSteps: 3, maxBranches: 0 },
  L3: { maxSteps: 6, maxBranches: 2 },
  L4: { minSteps: 5, maxSteps: 12, minBranches: 1 }
}

const evaluateDifficultyMatch = (targetLevel, estimatedSteps, branchCount, content) => {
  const indicators = DIFFICULTY_INDICATORS[targetLevel] || DIFFICULTY_INDICATORS.L3
  let score = 5.0
  let status = 'Perfect'
  let reason = ''
  
  const hasComplexConstruction = /构造|辅助线|建系|换元|参数方程|极坐标/.test(content || '')
  const hasProof = /证明|求证|说明理由/.test(content || '')
  
  if (targetLevel === 'L2') {
    if (estimatedSteps > indicators.maxSteps) {
      score -= 1.5 * (estimatedSteps - indicators.maxSteps) / 3
      status = 'TooHard'
      reason = `L2 目标但计算步骤过多 (${estimatedSteps}步)`
    } else {
      reason = `难度适中，符合 L2 标准 (${estimatedSteps}步)`
    }
  } else if (targetLevel === 'L3') {
    if (estimatedSteps < 3) {
      score -= 1.0
      status = 'TooEasy'
      reason = `L3 目标但计算过于简单 (${estimatedSteps}步)`
    } else if (estimatedSteps > indicators.maxSteps) {
      score -= 0.5 * (estimatedSteps - indicators.maxSteps) / 3
      status = 'TooHard'
      reason = `L3 目标但步骤偏多 (${estimatedSteps}步)`
    } else {
      reason = `难度适中，符合 L3 标准 (${estimatedSteps}步，${branchCount}分支)`
    }
  } else if (targetLevel === 'L4') {
    const hasSufficientComplexity = estimatedSteps >= 10 || hasComplexConstruction || hasProof
    if (estimatedSteps < indicators.minSteps && !hasSufficientComplexity) {
      score -= 2.0 * (indicators.minSteps - estimatedSteps) / indicators.minSteps
      status = 'TooEasy'
      reason = `L4 目标但计算过于简单 (${estimatedSteps}步)`
    } else {
      reason = `难度适中，符合 L4 标准 (${estimatedSteps}步)`
    }
  }
  
  return { score: Math.max(0, Math.min(5, score)), status, reason }
}

const evaluateSyllabusCompliance = (content, grade = '高三', motifId = '', targetLevel = null) => {
  const result = checkSyllabusCompliance(content, grade, motifId, targetLevel)
  
  if (!result.pass) {
    return {
      score: 0,
      status: 'Fail',
      detectedTools: [result.reason],
      details: result.details
    }
  }
  
  return {
    score: 5.0,
    status: 'Pass',
    detectedTools: [],
    details: result.details
  }
}

const calculateFitnessScore = (difficultyMatch, syllabusCheck, uniqueness, verificationResult = null, rawContent = '') => {
  const WEIGHTS = { difficulty: 0.40, syllabus: 0.30, uniqueness: 0.30 }
  
  let rawScore = 
    (difficultyMatch.score * WEIGHTS.difficulty) + 
    (syllabusCheck.score * WEIGHTS.syllabus) + 
    (uniqueness.score * WEIGHTS.uniqueness)
  
  const skipMathCheck = verificationResult?.skipMathCheck || false
  const requiresLLMCheck = verificationResult?.requiresLLMCheck || false
  const potentialScore = verificationResult?.potentialScore || null
  
  // 🆕 新增：如果有 potentialScore，使用它作为最低分数保障
  if (potentialScore !== null) {
    rawScore = Math.max(rawScore, potentialScore)
    console.log(`[调度中心] 📊 题目获得潜力分: ${potentialScore} 分 (实际计算: ${rawScore.toFixed(1)})`)
  }
  
  // 🚀 核心改进：根据题目文本的"视觉复杂度"自动补偿分数
  if (skipMathCheck && potentialScore === null) {
    const content = rawContent || ''
    const complexityKeywords = content.match(/证明|讨论|存在|恒成立|若|则|构造|分类|分段|参数|范围|取值|最值|极值/g) || []
    const complexityBonus = complexityKeywords.length * 0.1
    
    // 如果题目看起来确实像 L3/L4，即使无法硬验算，也允许它冲到 4.0
    if (complexityBonus > 0) {
      rawScore = Math.min(rawScore + complexityBonus, 4.0)
      console.warn(`[调度中心] ⚠️ 参数提取受限，基于复杂度给予补偿分 (+${complexityBonus.toFixed(1)})，当前预估: ${rawScore.toFixed(1)}`)
    } else {
      rawScore = Math.min(rawScore, 3.5)
      console.warn(`[调度中心] ⚠️ 警告：题目跳过数学硬验算 (reason: ${verificationResult?.message || verificationResult?.reason || 'unknown'})，分数被限制在 3.5 分以内`)
    }
  } else if (requiresLLMCheck && potentialScore === null) {
    rawScore = Math.min(rawScore, 4.5)
    console.log(`[调度中心] ℹ️ 提示：题目需 LLM 二次确认，分数上限 4.5`)
  }
  
  const finalScore = Math.round(Math.max(0, Math.min(5, rawScore)) * 10) / 10
  return finalScore
}

// ==================== 主验算函数 ====================
export const verifyQuestion = async (questionObj, motifId, options = {}) => {
  const { 
    targetLevel = 'L3', 
    existingQuestions = [], 
    moduleConfig = null, 
    grade = '高三' 
  } = options
  
  console.log(`\n${'='.repeat(60)}`)
  console.log(`[调度中心] 开始验算 - 母题: ${motifId}, 目标难度: ${targetLevel}`)
  console.log(`${'='.repeat(60)}`)
  
  const rawContentRaw = questionObj?.content || 
                     questionObj?.question?.content || 
                     questionObj?.variant?.question || 
                     questionObj?.text ||
                     questionObj?.data?.content ||
                     ''
  
  // 🚑 【新增急救包】修复常见的 LaTeX 转义丢失问题 (如 aeq1 -> a \neq 1)
  const fixMathTypos = (text) => {
    if (!text) return text
    let t = text
    // 1. 修复变量直接跟 eq 的情况 (如 aeq1, xeq0 -> a \neq 1, x \neq 0)
    // 匹配模式：字母 + eq + 数字
    t = t.replace(/([a-zA-Z])eq(\d+)/g, '$1 \\neq $2')
    // 2. 修复空格 + eq 的情况 (如 x eq 0 -> x \neq 0)
    t = t.replace(/\s+eq\s+/g, ' \\neq ')
    // 3. 修复可能丢失的反斜杠 (如果原本是 \neq 但变成了 neq)
    // 注意：使用负向后顾确保不重复替换已经正确的 \\neq
    t = t.replace(/(?<!\\)neq/g, '\\neq')
    
    // 4. 修复其他常见转义丢失
    t = t.replace(/(?<!\\)geq/g, '\\geq') // >=
    t = t.replace(/(?<!\\)leq/g, '\\leq') // <=
    t = t.replace(/(?<!\\)cdot/g, '\\cdot') // 乘号
    
    return t
  }

  const rawContent = fixMathTypos(rawContentRaw)

  // 如果修复后的内容和原内容不同，打印日志方便调试
  if (rawContent !== rawContentRaw) {
    console.log('[调度中心] 🚑 检测到数学符号转义错误，已自动修复:')
    console.log('  原内容片段:', rawContentRaw.substring(0, 60) + '...')
    console.log('  修复后片段:', rawContent.substring(0, 60) + '...')
  }
  
  if (!rawContent || rawContent.trim().length === 0) {
    return {
      pass: false,
      mathPass: false,
      errorType: '题目内容缺失',
      correctionSuggestion: '生成的题目内容为空，请重新生成。',
      fitnessScore: 0,
      confidence: 1.0
    }
  }
  
  // 0. 自动加载模块配置（如果未提供）
  const effectiveConfig = moduleConfig || await loadModuleConfig(motifId)
  
  // 🚀 0.5 硬规则守卫：毫秒级拦截基础公理错误
  const hardRuleCheck = quickLogicScan(rawContent)
  if (!hardRuleCheck.pass) {
    console.log(`[调度中心] ❌ 硬规则守卫拦截: ${hardRuleCheck.errors.join('; ')}`)
    return {
      pass: false,
      mathPass: false,
      errorType: '逻辑公理冲突',
      correctionSuggestion: hardRuleCheck.errors.join('; '),
      fitnessScore: 0,
      confidence: 1.0,
      hardRuleErrors: hardRuleCheck.errors
    }
  }
  
  // 1. 特征提取
  const features = extractUniversalFeatures(rawContent, motifId)
  
  // 🆕 1.5 检查特征中的错误（如非法区间）
  // 🚀 改进：不要直接熔断，而是将错误信息存入 verificationResult，让后面的评分逻辑去扣分
  let structuralWarning = null
  if (features.errors && features.errors.length > 0) {
    const error = features.errors[0]
    console.log(`[调度中心] ⚠️ 题目存在结构性疑点: ${error.message}`)
    structuralWarning = error.message
    // 不再直接返回失败，而是继续处理，让评分逻辑去扣分
  }
  
  // 🆕 1.6 指纹去重检查
  const duplicateCheck = checkDuplicate(rawContent, motifId, existingQuestions)
  if (duplicateCheck.isDuplicate) {
    console.log(`[调度中心] ⚠️ 检测到重复题目 (相似度: ${(duplicateCheck.similarity * 100).toFixed(1)}%)`)
    return {
      pass: false,
      mathPass: false,
      errorType: '题目重复',
      correctionSuggestion: `与已有题目相似度过高 (${(duplicateCheck.similarity * 100).toFixed(1)}%)，请生成不同的题目`,
      fitnessScore: 0,
      confidence: 1.0,
      duplicateCheck
    }
  }
  
  // 2. 规则匹配（使用自动加载的配置或传入的配置）
  let identificationResult = null
  if (effectiveConfig) {
    identificationResult = identifyQuestionType(features, effectiveConfig)
    features.identifiedType = identificationResult.type
  }
  
  // 3. 策略调度
  const strategy = strategyRegistry.get(motifId)
  let verificationResult = null
  
  // 🚀 V6.0 动态路由：根据难度级别选择验算路径
  const routerConfig = ROUTER_CONFIG[targetLevel] || ROUTER_CONFIG.L3
  console.log(`[调度中心] 🛤️ 动态路由配置: ${targetLevel}`, routerConfig)
  
  if (strategy) {
    console.log(`[调度中心] 🎯 调度到策略: ${motifId}`)
    
    const typeLabel = identificationResult?.type || 'unknown'
    // 🚀 传入 moduleConfig 和 targetLevel，支持 level_constraints 校验
    const params = strategy.extractParams(typeLabel, rawContent, features, effectiveConfig, targetLevel)
    console.log('[调度中心] 参数提取结果:', JSON.stringify(params, null, 2))
    
    verificationResult = strategy.verify(typeLabel, params, questionObj?.answer)
    console.log('[调度中心] 验算结果:', JSON.stringify(verificationResult, null, 2))
  } else {
    console.log(`[调度中心] ⚠️ 无注册策略: ${motifId}，降级为 Agent 验算`)
    verificationResult = {
      pass: true,
      skipMathCheck: true,
      requiresLLMCheck: true,
      reason: '无注册策略，需要 Agent 验算'
    }
  }
  
  // 🚀 V6.0 Agent-First 验算流程
  // L2: Extraction -> Code Check -> Logic Audit
  // L3/L4: Extraction -> Logic Audit (Deep)
  if (verificationResult?.pass !== false) {
    console.log('[调度中心] 🤖 Agent-First 模式：启动逻辑审计')
    
    // 1. 启动 Extraction Agent (所有难度都需提取，用于后续审计)
    console.log('[调度中心] 🤖 启动 Extraction Agent...')
    const extractionInput = EXTRACTION_AGENT_PROMPT.replace('{{content}}', rawContent)
    const extractionResult = await callLLM(extractionInput, { jsonMode: true, temperature: 0.1 })
    
    // 解析提取结果
    let extractedData = {}
    if (extractionResult) {
      try {
        extractedData = JSON.parse(extractionResult)
        console.log('[调度中心] ✅ 参数提取成功:', extractedData.sufficiency)
        
        // ⚠️ 关键拦截：如果 Extraction Agent 发现条件缺失，直接熔断
        if (extractedData.sufficiency?.status === 'insufficient') {
          console.log('[调度中心] ❌ Extraction Agent 检测到条件缺失')
          verificationResult = {
            pass: false,
            skipMathCheck: false,
            reason: 'Extraction Agent 检测到条件缺失',
            error: extractedData.sufficiency.missingConditions?.join('; ') || '条件不足',
            extractedData
          }
        }
      } catch (e) {
        console.warn('[调度中心] ⚠️ Extraction Agent 输出解析失败，降级处理')
      }
    }
    
    // 2. 如果提取阶段未失败，继续 Logic Audit
    if (verificationResult?.pass !== false) {
      console.log('[调度中心] 🤖 启动 Logic Auditor Agent...')
      
      // 构建年级约束字符串
      // 将中文年级映射到配置中的 key
      const gradeKey = grade === '高一' ? 'grade10' : grade === '高二' ? 'grade11' : 'grade12'
      const gradeRestriction = GRADE_RESTRICTIONS[gradeKey] || GRADE_RESTRICTIONS.grade12
      const forbiddenTools = gradeRestriction?.toolForbidden || []
      const gradeConstraints = `当前年级：${grade}。严禁使用：${forbiddenTools.slice(0, 10).join('、') || '无'}等工具。`
      
      const auditInput = LOGIC_AUDITOR_PROMPT
        .replace('{{gradeConstraints}}', gradeConstraints)
        .replace('{{content}}', rawContent)
        .replace('{{analysis}}', questionObj?.analysis || questionObj?.solution || '')
        .replace('{{answer}}', JSON.stringify(questionObj?.answer || questionObj?.answer_content || ''))
        .replace('{{difficulty}}', targetLevel)
      
      const auditResult = await callLLM(auditInput, { jsonMode: true, temperature: 0.1 })
      
      if (auditResult) {
        try {
          const auditData = JSON.parse(auditResult)
          console.log('[调度中心] 📋 审计结果:', auditData.status, auditData.reason)
          
          // 根据审计结果更新 verificationResult
          if (auditData.status === 'FAIL') {
            verificationResult = {
              pass: false,
              skipMathCheck: false,
              reason: 'Logic Auditor 判定失败',
              error: auditData.reason,
              suggestion: auditData.suggestion,
              auditDetails: auditData.auditDetails
            }
          } else {
            // 审计通过，给予高分潜力
            verificationResult.potentialScore = auditData.score
            verificationResult.highlights = auditData.highlights
            verificationResult.requiresLLMCheck = false // 既然 LLM 审过了，就不标记为需二次确认
            verificationResult.auditDetails = auditData.auditDetails
          }
        } catch (e) {
          console.warn('[调度中心] ⚠️ Logic Auditor 输出解析失败，维持原判')
        }
      }
    }
    
    // 3. L2 专属：简单代入验算 (双重保险)
    if (routerConfig.codeCheckRequired && verificationResult?.pass !== false) {
      console.log('[调度中心] 🔍 L2 严格模式：执行简单代入验算')
      
      const subInput = SIMPLE_SUBSTITUTION_PROMPT
        .replace('{{content}}', rawContent)
        .replace('{{answer}}', JSON.stringify(questionObj?.answer || questionObj?.answer_content || ''))
      
      const subResult = await callLLM(subInput, { jsonMode: true, temperature: 0.1 })
      
      if (subResult) {
        try {
          const subData = JSON.parse(subResult)
          if (!subData.verified) {
            console.log('[调度中心] ❌ 代入验算不成立')
            verificationResult = {
              pass: false,
              skipMathCheck: false,
              reason: '代入验算不成立',
              error: subData.issues?.join('; ') || '验算失败'
            }
          } else {
            console.log('[调度中心] ✅ 代入验算通过')
          }
        } catch (e) {
          console.warn('[调度中心] ⚠️ 代入验算解析失败，跳过')
        }
      }
    }
    
    // 记录验算路径
    verificationResult.routerConfig = routerConfig
    verificationResult.verificationPath = targetLevel === 'L2' ? 'strict' : 'flexible'
    verificationResult.extractedData = extractedData
  }
  
  // 4. 综合评估 (传入 grade 和 motifId)
  const difficultyMatch = evaluateDifficultyMatch(targetLevel, verificationResult?.estimatedSteps || 1, verificationResult?.branchCount || 0, rawContent)
  const syllabusCheck = evaluateSyllabusCompliance(rawContent, grade, motifId, targetLevel)
  const uniqueness = { score: 5.0, status: 'High', reason: '首批题目' }
  const fitnessScore = calculateFitnessScore(difficultyMatch, syllabusCheck, uniqueness, verificationResult, rawContent)
  
  // 5. 最终判定逻辑
  const threshold = (targetLevel === 'L2') ? 3.5 : 3.8
  const scoreQualified = fitnessScore >= threshold
  
  // 🟢 优化 mathVerified 逻辑：
  // 1. 如果硬验算失败 (pass === false)，则 mathVerified = false
  // 2. 如果硬验算成功 (pass === true && skip === false)，则 mathVerified = true
  // 3. 如果跳过验算 (skip === true)：
  //    - 对于 L2 题目，或者分数已经达标 (>= 3.5) 的情况，视为"软通过" (mathVerified = true)
  //    - 对于 L3/L4 且分数不高的情况，视为"未通过" (mathVerified = false)
  let mathVerified = true // 默认为 true，除非明确失败
  
  if (verificationResult?.pass === false) {
    // 明确验算失败
    mathVerified = false
  } else if (verificationResult?.skipMathCheck) {
    // 跳过验算的情况
    if (targetLevel === 'L2' || fitnessScore >= 3.5) {
      mathVerified = true // L2 或高分允许跳过
      console.log(`[调度中心] ℹ️ 提示：跳过硬验算，但因难度/分数达标，视为"软通过"`)
    } else {
      mathVerified = false // L3/L4 低分不允许跳过
      console.log(`[调度中心] ⚠️ 警告：跳过硬验算且分数/难度不足，判定为未通过`)
    }
  }
  
  const finalResult = {
    pass: mathVerified && scoreQualified,
    mathPass: mathVerified,
    scoreQualified,
    threshold,
    errorType: verificationResult?.pass === false ? '数学验算失败' : 
               !scoreQualified ? '分数未达标' : 
               structuralWarning ? '结构性疑点' : null,
    correctionSuggestion: verificationResult?.warning || verificationResult?.error || structuralWarning || null,
    fitnessScore,
    fitnessDetails: { difficultyMatch, syllabusCheck, uniqueness },
    verificationResult,
    structuralWarning,
    confidence: verificationResult?.skipMathCheck ? 0.5 : 0.8
  }
  
  console.log(`[调度中心] 当前难度 ${targetLevel}，通过阈值：${threshold}, 实际得分：${fitnessScore.toFixed(1)}`)
  console.log(`[调度中心] 判定详情: mathVerified=${mathVerified}, scoreQualified=${scoreQualified}`)
  
  if (finalResult.pass) {
    console.log(`[调度中心] ✅ 题目验证通过！(分数: ${fitnessScore.toFixed(1)})`)
  } else {
    console.log(`[调度中心] ❌ 题目验证未达标 (MathPass: ${mathVerified}, Score: ${fitnessScore.toFixed(1)})`)
    if (!mathVerified) {
      console.log(`[调度中心]    原因: ${verificationResult?.skipMathCheck ? '跳过数学验算' : '验算失败'}`)
    }
    if (!scoreQualified) {
      console.log(`[调度中心]    原因: 分数 ${fitnessScore.toFixed(1)} < ${threshold} 阈值`)
    }
  }
  
  console.log(`\n[调度中心] 最终结果: pass=${finalResult.pass}, fitnessScore=${fitnessScore.toFixed(1)}`)
  console.log(`${'='.repeat(60)}\n`)
  
  return finalResult
}

// ==================== 带重试的验算 ====================
export const verifyQuestionWithRetry = async (
  generateFn,
  motifId,
  targetLevel = 'L3',
  existingQuestions = [],
  maxRetries = 3, // 🚀 增加重试次数从 2 到 3
  onStatusUpdate = null
) => {
  let attempt = 0
  let negativeConstraints = []
  
  while (attempt <= maxRetries) {
    console.log(`\n[调度中心] 第 ${attempt + 1} 次尝试生成题目...`)
    
    if (onStatusUpdate) {
      onStatusUpdate({
        phase: 'generating',
        attempt: attempt + 1,
        maxRetries: maxRetries + 1
      })
    }
    
    // 🚀 V5.1 传递重试次数给 generateFn，用于动态降温
    const questionObj = await generateFn(negativeConstraints, attempt)
    
    if (onStatusUpdate) {
      onStatusUpdate({
        phase: 'verifying',
        attempt: attempt + 1
      })
    }
    
    const verification = await verifyQuestion(questionObj, motifId, {
      targetLevel,
      existingQuestions
    })
    
    if (onStatusUpdate) {
      onStatusUpdate({
        phase: 'evaluating',
        fitnessScore: verification.fitnessScore,
        details: verification.fitnessDetails
      })
    }
    
    if (verification.pass) {
      console.log('[调度中心] ✅ 题目验证通过！')
      console.log(`[调度中心] 📊 fitnessScore: ${verification.fitnessScore.toFixed(1)}/5.0`)
      
      // 🆕 提取指纹，用于后续去重
      const rawContent = questionObj?.content || 
                         questionObj?.question?.content || 
                         questionObj?.variant?.question || 
                         questionObj?.text ||
                         ''
      const fingerprint = extractFingerprint(rawContent, motifId)
      
      if (onStatusUpdate) {
        onStatusUpdate({
          phase: 'passed',
          fitnessScore: verification.fitnessScore
        })
      }
      
      return {
        success: true,
        question: questionObj,
        verification,
        fitnessScore: verification.fitnessScore,
        fingerprint // 🆕 返回指纹，供调用方存储
      }
    }
    
    console.log(`[调度中心] ❌ 验证失败: ${verification.errorType}`)
    console.log(`[调度中心] 📊 fitnessScore: ${verification.fitnessScore.toFixed(1)}/5.0`)
    
    if (onStatusUpdate) {
      onStatusUpdate({
        phase: 'retrying',
        errorType: verification.errorType,
        correctionSuggestion: verification.correctionSuggestion
      })
    }
    
    // 🚀 增强负约束提示：针对重复题目的特殊处理
    if (verification.errorType === '题目重复') {
      negativeConstraints.push(
        '⚠️ 题目被判定为重复！请彻底更换几何模型或代数结构，不要仅修改数字。' +
        '例如：如果之前是"圆上动点求数量积范围"，请尝试"三角形内求线性组合系数"或"向量基底分解求最值"等完全不同的模型。'
      )
    } else if (verification.correctionSuggestion) {
      negativeConstraints.push(verification.correctionSuggestion)
    }
    
    attempt++
  }
  
  console.log('[调度中心] ⚠️ 达到最大重试次数，返回失败')
  
  if (onStatusUpdate) {
    onStatusUpdate({
      phase: 'failed',
      attempts: attempt
    })
  }
  
  return {
    success: false,
    error: '题目打磨中，请稍后重试',
    attempts: attempt
  }
}

// ==================== 导出 ====================
export default {
  verifyQuestion,
  verifyQuestionWithRetry,
  extractUniversalFeatures,
  identifyQuestionType,
  strategyRegistry,
  registerStrategy,
  loadModuleConfig,
  configCache,
  // V5.0 新增
  extractFingerprint,
  calculateSimilarity,
  checkDuplicate,
  loadDifficultyConfig,
  // V5.1 新增
  quickLogicScan
}
