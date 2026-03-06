import { useState, useContext, useMemo } from 'react'
import { 
  Calendar, FileText, AlertTriangle, Target, CheckCircle, 
  Printer, ChevronDown, Clock, TrendingUp, BookOpen, 
  X, Plus, Trash2, Download, Sparkles, AlertCircle, Code, Info, Loader2
} from 'lucide-react'
import { ThemeContext } from '../App'
import knowledgeV1Functions from '../data/knowledge_v1_functions.json'
import knowledgeV2Geometry from '../data/knowledge_v2_geometry.json'
import knowledgeV3Trigonometry from '../data/knowledge_v3_trigonometry.json'
import knowledgeV4Stereometry from '../data/knowledge_v4_stereometry.json'
import knowledgeV5Probability from '../data/knowledge_v5_probability.json'
import knowledgeV6Sequences from '../data/knowledge_v6_sequences.json'
import knowledgeV7Basics from '../data/knowledge_v7_basics.json'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

// API 配置
const API_KEY = import.meta.env.VITE_QWEN_API_KEY
const BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
const MODEL_NAME = 'qwen-plus'

// LaTeX 渲染组件
const LatexRenderer = ({ content }) => {
  if (!content) return null
  // 彻底删除所有自作聪明的反斜杠拯救正则，它们破坏了原生 LaTeX
  const safeContent = content
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
  
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
    >
      {safeContent}
    </ReactMarkdown>
  )
}

const levelColors = {
  L1: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  L2: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  L3: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
  L4: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' }
}

const sourceLabels = {
  error: { label: '错题巩固', color: 'text-red-500', icon: '🔴' },
  bleeding: { label: '筑基强化', color: 'text-amber-500', icon: '🟡' },
  active: { label: '意愿补位', color: 'text-emerald-500', icon: '🔵' }
}

const KNOWLEDGE_DATABASES = [
  knowledgeV1Functions,
  knowledgeV2Geometry,
  knowledgeV3Trigonometry,
  knowledgeV4Stereometry,
  knowledgeV5Probability,
  knowledgeV6Sequences,
  knowledgeV7Basics
]

const buildCrossFileIndex = () => {
  const index = {}
  
  // ID 清洗函数：统一格式，对 ID 不敏感
  const normalizeId = (id) => {
    if (!id) return null
    return id.replace(/_/g, '-').toLowerCase()
  }
  
  // 字段强制提取：在对象中搜索包含 question 或 desc 的字段
  const extractQuestionFields = (obj) => {
    if (!obj || typeof obj !== 'object') return []
    
    const results = []
    
    // 直接检查常见字段
    const directFields = ['prototype_problems', 'prototypeProblems', 'prototype_problem', 'prototypeProblem', 'prototype']
    for (const field of directFields) {
      if (obj[field]) {
        if (Array.isArray(obj[field])) {
          for (const item of obj[field]) {
            // 同时支持 desc 和 question 字段
            const questionText = item.question || item.desc
            if (questionText) {
              results.push({
                question: questionText,
                level: item.level,
                analysis: item.analysis,
                answer: item.answer
              })
            }
          }
        } else if (typeof obj[field] === 'object') {
          const questionText = obj[field].question || obj[field].desc
          if (questionText) {
            results.push({ question: questionText, ...obj[field] })
          }
        } else if (typeof obj[field] === 'string') {
          results.push({ question: obj[field] })
        }
      }
    }
    
    // 深度搜索：遍历所有字段找 question 或 desc
    for (const key of Object.keys(obj)) {
      const val = obj[key]
      if (val && typeof val === 'object') {
        const questionText = val.question || val.desc
        if (questionText) {
          results.push({ question: questionText, ...val })
        } else if (Array.isArray(val)) {
          for (const item of val) {
            if (item && typeof item === 'object') {
              const itemQuestion = item.question || item.desc
              if (itemQuestion) {
                results.push({ question: itemQuestion, ...item })
              }
            }
          }
        }
      }
    }
    
    return results
  }
  
  KNOWLEDGE_DATABASES.forEach(db => {
    if (db.motifs) {
      db.motifs.forEach(motif => {
        const systemId = motif.mapping_to_system
        if (systemId) {
          // 字段强制提取
          const extractedPrototypes = extractQuestionFields(motif)
          const pList = motif.prototype_problems || motif.prototypeProblems || []
          const pSingle = motif.prototype_problem || motif.prototypeProblem
          const finalPrototypes = extractedPrototypes.length > 0 ? extractedPrototypes : 
                                  (pList.length > 0 ? pList : (pSingle ? [pSingle] : []))
          
          const firstPrototype = finalPrototypes[0] || null
          
          const entry = {
            id: motif.id,
            name: motif.name,
            levelScaffolding: motif.level_scaffolding,
            evolutionBlueprint: motif.evolution_blueprint,  // V3.1: 战术蓝图
            validLevels: motif.valid_levels,  // V3.1: 有效难度级别
            prototypeProblems: finalPrototypes,
            prototypeProblem: firstPrototype,
            prototypeLogic: motif.prototype_logic || motif.prototypeLogic || '标准解题流程',
            knowledgePoints: motif.knowledge_points || motif.knowledgePoints || [],
            l4Trap: motif.l4_trap,
            aiCommand: motif.ai_command,
            category: db.category,
            _sourcePath: `${db.category}/${motif.name}` // 源路径追踪
          }
          
          // 主索引：mapping_to_system（同时索引清洗后的 ID）
          const normalizedSystemId = normalizeId(systemId)
          if (!index[systemId]) index[systemId] = []
          index[systemId].push(entry)
          
          // 清洗后的 ID 也索引
          if (normalizedSystemId && normalizedSystemId !== systemId) {
            if (!index[normalizedSystemId]) index[normalizedSystemId] = []
            index[normalizedSystemId].push(entry)
          }
          
          // 增强 ID 匹配：同时索引 motif.id（如 t1_1）
          if (motif.id && motif.id !== systemId) {
            if (!index[motif.id]) index[motif.id] = []
            index[motif.id].push(entry)
            
            // 清洗后的 motif.id 也索引
            const normalizedMotifId = normalizeId(motif.id)
            if (normalizedMotifId && normalizedMotifId !== motif.id) {
              if (!index[normalizedMotifId]) index[normalizedMotifId] = []
              index[normalizedMotifId].push(entry)
            }
          }
          
          console.log(`【索引构建】${motif.name}(${motif.id}): ${finalPrototypes.length} 道样题`)
        }
      })
    }
  })
  
  return index
}

const CROSS_FILE_INDEX = buildCrossFileIndex()

const validateProblem = (problem, level, targetId) => {
  if (!problem || !problem.desc) return { valid: false, reason: '题目描述为空' }
  
  const desc = problem.desc
  
  if (desc.length < 10) return { valid: false, reason: '题目描述过短' }
  
  const complexPatterns = [
    /√\d{3,}/,
    /\^\d{3,}/,
    /sin\([^)]*\d{2,}[^)]*\)/,
    /cos\([^)]*\d{2,}[^)]*\)/,
  ]
  
  for (const pattern of complexPatterns) {
    if (pattern.test(desc)) {
      return { valid: false, reason: '包含过于复杂的数值，不适合手算' }
    }
  }
  
  const requiredKeywords = ['求', '证明', '计算', '判断', '求证', '讨论']
  const hasKeyword = requiredKeywords.some(kw => desc.includes(kw))
  if (!hasKeyword) {
    return { valid: false, reason: '缺少明确的题目指令' }
  }
  
  return { valid: true }
}

const generateAIProblem = async (targetId, level, encounter, knowledgeEntry, isUserSelected = false, iterationIndex = 0, customPrompt = null) => {
  const targetName = encounter?.target_name || targetId
  const subTargets = encounter?.sub_targets || []
  const subInfo = subTargets.find(s => s.level_req === level)
  const subName = subInfo?.sub_name || `${targetName}练习`
  
  // 物理熔断：elo_score < 1001 且非用户勾选的，直接返回 null
  const eloScore = encounter?.elo_score || 0
  if (eloScore < 1001 && !isUserSelected) {
    return null
  }
  
  const effectiveElo = eloScore < 1001 ? 1001 : eloScore
  
  // Elo 战力到难度的映射函数（V5.0 DNA-Driven）
  const getDifficultyByElo = (elo) => {
    if (elo <= 1800) {
      return {
        tier: '基础筑基',
        level: 'L2',
        complexity: 1,
        steps: 2,
        minSteps: 2,
        maxSteps: 3,
        traps: 0,
        paramChanges: 1,
        allowDiscussion: false,
        paramConstraint: 'integer_or_simple_fraction',
        description: '单一知识点，公式直取，计算步数 2 步'
      }
    } else if (elo <= 2500) {
      return {
        tier: '深度复合',
        level: 'L3',
        complexity: 3,
        steps: 4,
        minSteps: 4,
        maxSteps: 6,
        traps: 1,
        paramChanges: 3,
        allowDiscussion: true,
        paramConstraint: 'any',
        description: '含参分类讨论或跨章节综合'
      }
    } else {
      return {
        tier: '战术压轴',
        level: 'L4',
        complexity: 4,
        steps: 5,
        minSteps: 5,
        maxSteps: 7,
        traps: 2,
        paramChanges: 4,
        allowDiscussion: true,
        paramConstraint: 'any',
        description: '逻辑证明与极端值探究'
      }
    }
  }
  
  const difficulty = getDifficultyByElo(effectiveElo)
  
  // ============================================================
  // 样题 DNA 提取（双重索引提取 - 强制对齐）
  // ============================================================
  
  // ID 清洗函数：统一格式
  const normalizeId = (id) => {
    if (!id) return null
    return id.replace(/_/g, '-').toLowerCase()
  }
  
  // 双重索引提取：不要只看 targetId，要看 normalizedId
  const nId = normalizeId(targetId)
  
  // 优先从 CROSS_FILE_INDEX 直接提取（不依赖传入的 knowledgeEntry）
  let knowledgeData = null
  let directEntry = null
  
  // 尝试多种 ID 格式匹配
  const idVariants = [
    targetId,           // 原始 ID
    nId,                // 清洗后的 ID
    targetId.replace(/-/g, '_'),  // 下划线版本
    targetId.toUpperCase(),        // 大写版本
    targetId.toLowerCase()         // 小写版本
  ]
  
  for (const variant of idVariants) {
    if (CROSS_FILE_INDEX[variant] && CROSS_FILE_INDEX[variant].length > 0) {
      directEntry = CROSS_FILE_INDEX[variant][0]
      console.log(`【双重索引】通过 ${variant} 匹配到数据`)
      break
    }
  }
  
  // 如果直接索引找到，优先使用
  if (directEntry) {
    knowledgeData = directEntry
    console.log(`【双重索引】${targetId} → 找到 prototypeProblems: ${directEntry.prototypeProblems?.length || 0} 道`)
  } else {
    // 回退到传入的 knowledgeEntry
    knowledgeData = knowledgeEntry?.[0] || {}
    console.log(`【双重索引】${targetId} → 回退到 knowledgeEntry`)
  }
  
  // 强制提取 prototypeProblems
  const prototypeProblems = knowledgeData?.prototypeProblems || 
                            knowledgeData?.prototype_problems || 
                            []
  
  // 如果数组为空，尝试在父级对象直接找单体字段
  const prototypeProblem = (prototypeProblems.length > 0 && prototypeProblems[0]) ||
                           knowledgeData?.prototypeProblem ||
                           knowledgeData?.prototype_problem ||
                           knowledgeData?.prototype ||
                           null
  
  const prototypeLogic = knowledgeData?.prototypeLogic || 
                         knowledgeData?.prototype_logic || 
                         '标准解题流程'
  
  const knowledgePoints = knowledgeData?.knowledgePoints || 
                         knowledgeData?.knowledge_points || 
                         []
  
  const topicType = knowledgeData?.topicType || 
                   knowledgeData?.topic_type || 
                   targetName
  
  const sourcePath = knowledgeData?._sourcePath || `未知路径(targetId: ${targetId})`
  
  // 实时热检查：输出样题数量
  console.log(`【热检查】母题 ${targetId}(${targetName}) 已识别到 ${prototypeProblems.length} 道样题`, {
    hasPrototype: !!prototypeProblem,
    prototypePreview: prototypeProblem?.question?.substring(0, 50) || '无',
    sourcePath: sourcePath
  })
  
  // 参数生成
  const generateParams = (diff, iterIdx = 0) => {
    const params = {}
    const constraint = diff.paramConstraint
    const randomOffset = iterIdx * 17 + Math.random() * 100
    
    if (constraint === 'integer_or_simple_fraction') {
      params.a = Math.floor((Math.random() * 10 + randomOffset) % 10) + 1
      params.b = Math.floor((Math.random() * 10 + randomOffset * 1.5) % 10) - 5
      params.c = Math.floor((Math.random() * 10 + randomOffset * 2) % 10) + 2
      params.fracNum = Math.floor((Math.random() * 9 + randomOffset) % 9) + 1
      params.fracDen = Math.floor((Math.random() * 9 + randomOffset * 1.2) % 9) + 2
    } else {
      params.a = Math.floor((Math.random() * 10 + randomOffset) % 10) + 1
      params.b = Math.floor((Math.random() * 20 + randomOffset * 1.5) % 20) - 10
      params.c = Math.floor((Math.random() * 15 + randomOffset * 2) % 15) + 2
      params.alpha = Math.floor((Math.random() * 30 + randomOffset) % 30) + 30
      params.k = Math.floor((Math.random() * 5 + randomOffset) % 5) + 1
      params.m = Math.floor((Math.random() * 5 + randomOffset * 1.3) % 5) + 1
      params.n = Math.floor((Math.random() * 5 + randomOffset * 1.5) % 5) + 1
    }
    
    return params
  }
  
  const params = generateParams(difficulty, iterationIndex)
  
  // ============================================================
  // 代数渲染引擎 (Algebraic Formatter)
  // 处理系数 1/-1、系数 0、正负号连接
  // ============================================================
  const formatPolynomial = (coeffs, variable = 'x') => {
    // coeffs = [a, b, c] 表示 ax² + bx + c
    const terms = []
    
    // x² 项
    if (coeffs[0] !== 0) {
      if (coeffs[0] === 1) terms.push(`${variable}²`)
      else if (coeffs[0] === -1) terms.push(`-${variable}²`)
      else terms.push(`${coeffs[0]}${variable}²`)
    }
    
    // x 项
    if (coeffs[1] !== 0) {
      if (coeffs[1] > 0) {
        if (coeffs[1] === 1) terms.push(variable)
        else terms.push(`${coeffs[1]}${variable}`)
      } else {
        if (coeffs[1] === -1) terms.push(`-${variable}`)
        else terms.push(`${coeffs[1]}${variable}`)
      }
    }
    
    // 常数项
    if (coeffs[2] !== 0) {
      terms.push(coeffs[2].toString())
    }
    
    // 拼接，处理正负号
    let result = ''
    for (let i = 0; i < terms.length; i++) {
      const term = terms[i]
      if (i === 0) {
        result = term
      } else {
        if (term.startsWith('-')) {
          result += ' - ' + term.slice(1)
        } else {
          result += ' + ' + term
        }
      }
    }
    
    return result || '0'
  }
  
  // 格式化复数 a + bi
  const formatComplex = (real, imag) => {
    const parts = []
    if (real !== 0) parts.push(real.toString())
    if (imag !== 0) {
      if (imag === 1) parts.push('i')
      else if (imag === -1) parts.push('-i')
      else parts.push(`${imag}i`)
    }
    
    let result = ''
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (i === 0) {
        result = part
      } else {
        if (part.startsWith('-')) {
          result += ' - ' + part.slice(1)
        } else {
          result += ' + ' + part
        }
      }
    }
    return result || '0'
  }
  
  // ============================================================
  // DNA-Driven 命题生成器（命题引擎 2.0 - 真实 AI 调用）
  // 异步架构：接通千问 API 心脏
  // ============================================================
  const buildDNAProblem = async (targetId, targetName, difficulty, params, prototype, topicType, knowledgePoints, sourcePath, customPrompt = null, motifObj = null, iterationIndex = 0) => {
    const { tier, steps, traps, paramChanges, level } = difficulty
    
    // ============================================================
    // 熔断机制：无有效样题 DNA，严禁 AI 凭空想象
    // ============================================================
    if (!prototype || !prototype.question) {
      const pathInfo = sourcePath || `未知路径（请检查 KNOWLEDGE_DATABASES 中是否存在 targetId: ${targetId}）`
      console.error(`【熔断】母题"${targetName}"(ID: ${targetId})缺少样题原型`)
      
      return {
        question: `【系统熔断】无法生成题目：母题"${targetName}"缺少样题原型。`,
        analysis: `【错误日志】\n- targetId: ${targetId}\n- targetName: ${targetName}\n- 数据源路径: ${pathInfo}`,
        answer: '【熔断】样题缺失，无法生成答案',
        isAIGenerated: true,
        aiLabel: `[错误：样题缺失]`,
        isError: true,
        errorPath: pathInfo
      }
    }
    
    // ============================================================
    // 真实 AI 请求：调用千问 API
    // ============================================================
    
    // 数学对象渲染器：处理代数美化
    const sanitizeAlgebra = (text) => {
      if (!text || typeof text !== 'string') return text
      return text
        .replace(/\b1([a-zA-Z])/g, '$1')           // 1x → x
        .replace(/\b0([a-zA-Z])/g, '0')            // 0x → 0
        .replace(/\+\s*-/g, '- ')                  // + - → -
        .replace(/-\s*-/g, '+ ')                   // - - → +
        .replace(/\s+/g, ' ')                      // 多空格 → 单空格
        .trim()
    }
    
    // 构建完整的 AI Prompt
    const systemPrompt = customPrompt || `【专家身份】
你是 135+ 高中数学研究院首席命题官。你拥有 20 年高考阅卷经验，你的命题准则是：战力精准、反同质化、数值精美、学术严谨。

【三步命题法 (V3.1架构)】
1. 蓝图至上：收到数据后，【命题最高战术蓝图】是你的最高指导原则，【样题 DNA】仅作为该难度的参考水位。你必须深刻理解蓝图中定义的"核心逻辑"与"设问结构"。
2. 破壳重构 (反同质化)：严禁"逻辑克隆"或"同构换皮"！你必须彻底抛弃【样题原文】的表象外壳（如特定的函数表达式、固定的几何体），严格按照传入的【强制变异方向】构建全新的数学皮囊。
3. 灵魂注入：根据传入的【特征数打散】要求，将指定的数字巧妙无痕地编织进题干（作为参数、系数或已知条件），以此证明题目的绝对原创性。

【全学科执行规范】
1. 代数极简化：严禁出现 $0x, 1x, +(-)$ 等非专业表达。必须执行代数最简化渲染。
2. 梯度设问制：严格遵照战术蓝图中 \`two_part_structure\` 的要求。若蓝图要求双问结构，第(1)问必须是基础保底，第(2)问必须是深度探究或分类讨论。
3. 数值友好性：
   - 代数：判别式 $\\Delta$ 必须为完全平方数（除故意设计的超越方程外）。
   - 几何/复数：边长、模长优先设计为整数。
   - 概率：计算结果必须是简洁的最简分数。
   - 严禁：由于数值随机导致的"计算死循环"、"无实数解(非预期)"或违背常理的物理结果。
4. 学科锚点：
   - 复数必含 $i$；向量必含 $\\vec{a}$ 或坐标；集合端点必左小右大；数列项数 $n$ 必为正整数。

【输出协议 (最高红线警告)】
1. 仅输出纯 JSON 字符串，绝对禁止包含 \`\`\`json 等 Markdown 标记，禁止任何开场白。
2. 【强制结构化思维】：你的 JSON 必须严格包含以下 5 个字段（绝不能少）：
   - "question": 题目原文。
   - "thought_process": 你的草稿区。【字数生死线】：严禁超过 400 字！你只需列出最核心的骨架方程即可。遇到复杂计算必须直接采用"设而不求"或"隐零点法"。绝不允许进行长篇大论的验算，否则输出过长会导致系统 API 崩溃截断！
   - "analysis": 最终交付给学生的教研解析。严禁出现"重算"、"校验"等独白。必须是经过 thought_process 整理后的纯净排版！
   - "answer": 最终简答。
   - "aiLabel": 你的内部标签。
3. 【标签隔离】：所有类似"深度复合、战力对位、参数变化"的评价，只能写在 "aiLabel" 字段中，绝对不准出现在 "analysis" 里！
4. 【LaTeX 极度纯净警告 (生死红线)】：
   - 绝不允许将普通中文汉字和标点符号（如"已知","在","处","的","；"，"等）包裹在 $ $ 或 $$ $$ 内部！
   - 错误示例：$已知 f(x)=x^2，求切线；$
   - 正确示例：已知 $f(x)=x^2$，求切线；
   - KaTeX 无法解析中文，违规将导致整个前端系统崩溃！
5. 【公式规范】：行内公式必须用单 $ 包裹两端，独立公式用双 $$ 包裹两端。绝不允许出现一端单 $ 一端双 $$ 的语法错误！`

    // ============================================================
    // 【V3.1 核心：全学科泛化摇骰子与随机熵】
    // ============================================================
    const randomEntropy = Math.floor(Math.random() * 1000000) // 防伪流水号，打破缓存
    const coefficientSalt = Math.floor(Math.random() * 8) + 2 // 生成 2-9 的特征特征数
    
    // 泛化兜底方向（不写死"函数"）
    let forcedVariant = "结合本考点的其他核心数学模型或表现形式"
    const levelKey = tier // tier 已经是 "L2", "L3", "L4" 格式
    
    // 从 JSON 战术蓝图中抽取变例
    if (motifObj?.evolutionBlueprint?.[levelKey]?.lateral_variants?.length > 0) {
      const variants = motifObj.evolutionBlueprint[levelKey].lateral_variants
      // 【核心修复】：放弃随机，使用并发索引强行错开，彻底杜绝重复题！
      forcedVariant = variants[iterationIndex % variants.length]
      console.log(`【全学科强制变异】${targetName} 任务${iterationIndex} 获得方向:`, forcedVariant)
    }
    console.log(`【防伪流水号】${randomEntropy} | 【特征数】${coefficientSalt}`)

    const userPrompt = `
【当前母题信息】
- 母题名称：${targetName}
- 战力分数：${effectiveElo}
- 知识点：${knowledgePoints.length > 0 ? knowledgePoints.join('、') : targetName}
- 难度等级：${tier} (${level})

【命题最高战术蓝图 (必须服从)】
${motifObj?.evolutionBlueprint ? JSON.stringify(motifObj.evolutionBlueprint, null, 2) : '无特别战术蓝图'}

【⚠️ 样题原型 (仅供难度与格式参考，绝对禁止照抄)】
${prototype ? `样题原文：${prototype.question}

样题解析逻辑：${prototype.analysis || '暂无解析'}` : '无样题'}

【参数池】（仅供参考，AI 需自主设计合理数值）
${JSON.stringify(params, null, 2)}

【严格要求】
1. 保持学科基因强耦合（集合题必须是集合题，复数题必含 i）
2. 集合元素不能重复（如 A={1,2,3} 而非 A={1,1,1}）
3. 判别式 Δ 必须为完全平方数
4. 区间端点必须左小右大
5. 输出标准 JSON 格式：{"question": "题干", "analysis": "解析", "answer": "答案"}

【双问制强制规则】
当前战力分数为 ${effectiveElo}。
- 若战力 > 1800（L3/L4 难度），禁止输出单问题目！
- 必须使用 Markdown 编号列表输出 (1) 和 (2) 两问。
- 第一问为基础计算，第二问为综合推理或证明。
- 示例格式：
  (1) 第一问内容
  (2) 第二问内容
- 注意：不要使用 \\begin{enumerate}，直接用 (1) (2) 编号即可。
- 数学公式用 $...$ 包裹，如 $x^2 + y^2 = 1$

【难度爆炸指令】
${effectiveElo > 2000 ? `检测到当前战力 > 2000。禁止生成基础计算题！
必须引入 1 个隐藏参数（如 $m, k$）或 1 个几何位置约束，且必须严格按照 (1)(2) 梯度设问。
第一问为基础计算，第二问必须涉及参数讨论或最值问题。` : ''}

【防污染指令】
严禁在解析中输出"深度复合、战力对位、步骤数、陷阱数"等系统评价标签。必须直接输出可直接打印的教研级纯净解析。

【绝对反同质化指令 (防伪流水号: ${randomEntropy})】
1. 你的系统生成温度已调至最高。你必须发挥特级教师的创造力，当前防伪码为 ${randomEntropy}。
2. 【强制变异方向】：${forcedVariant}。你必须严格沿此方向构建全新的题目骨架！
3. 【严禁套路换皮】：绝对不允许仅仅修改【样题原文】中的常数！你必须彻底更换核心表达式、几何体模型、数列形式或应用题概率背景。严禁使用本考点下最烂大街的标准教辅模型！
4. 【特征数打散】：请在题干的已知条件中，巧妙地将数字 ${coefficientSalt} 作为其中一个关键特征值（例如：多项式的某一项系数、某条线段的长度、数列的首项、或者特定参数 a 的值），以此证明这是一道针对当前流水号绝对原创的题目！
5. 【最高红线】：你输出的题目如果和【样题原文】一模一样，或者仅仅是替换了原题的常数，你将被判定为严重违规！必须使用全新的函数构造！
`

    console.log(`【命题引擎 2.0】AI 正在深度推理: ${targetName}`, {
      prototypeDNA: prototype.question?.substring(0, 50) + '...',
      eloScore: effectiveElo,
      knowledgePoints: knowledgePoints
    })
    
    // V3.1: 打印【命题最高战术蓝图】
    if (motifObj?.evolutionBlueprint) {
      console.log(`【命题最高战术蓝图】${targetName}:`, motifObj.evolutionBlueprint)
    } else {
      console.warn(`【战术蓝图缺失】${targetName} 没有 evolution_blueprint，将使用基础 Prompt`)
    }
    
    // ============================================================
    // 调用千问 API
    // ============================================================
    try {
      if (!API_KEY) {
        console.warn('【API Key 未配置】使用本地模拟模式')
        throw new Error('API Key 未配置')
      }
      
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.85,  // V3.1: 强制打破模型保守性
          top_p: 0.9,
          max_tokens: 6000  // V3.1: 增加到 6000，避免 thought_process 过长导致截断
        })
      })
      
      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`)
      }
      
      const data = await response.json()
      const aiContent = data.choices?.[0]?.message?.content || ''
      
      console.log(`【AI 原始响应】${targetName}:`, aiContent.substring(0, 200))
      
      // ============================================================
      // 【大道至简】恢复纯净的 JSON 解析
      // ============================================================
      let aiResult = { question: '', analysis: '', answer: '' }
      try {
        const cleanJsonStr = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(cleanJsonStr)
        
        aiResult.question = parsed.question || ''
        aiResult.analysis = parsed.analysis || ''
        aiResult.answer = parsed.answer || ''
        
        console.log(`【JSON 解析成功】${targetName}:`, aiResult.question?.substring(0, 50))
        
        // 傻瓜式暴力切除，不管后面跟着什么，只要匹配到就删
        if (aiResult.analysis) {
          aiResult.analysis = aiResult.analysis
            .replace(/【.*?战力.*?】\n?/g, '')
            .replace(/【深度复合.*?】\n?/g, '')
            .replace(/步骤数：.*?参数变化：.*?[0-9]处\n?/g, '')
            .replace(/^[\s|]+\n?/g, '') // 清理开头的竖线或空格
            .trim()
        }
        
      } catch (error) {
        console.error('【JSON解析失败】', error)
        // 回退逻辑
        aiResult = {
          question: prototype.question,
          analysis: prototype.analysis || '请根据题目要求进行解答。',
          answer: prototype.answer || '答案待计算'
        }
      }
      
      // 应用代数美化过滤
      const questionText = sanitizeAlgebra(aiResult.question || prototype.question)
      const analysisText = sanitizeAlgebra(aiResult.analysis || prototype.analysis || '请根据题目要求进行解答。')
      const answerText = sanitizeAlgebra(aiResult.answer || prototype.answer || '答案待计算')
      
      console.log(`【最终题目】${targetName}:`, questionText.substring(0, 100))
      
      return {
        question: questionText,
        analysis: analysisText,
        answer: answerText,
        isAIGenerated: true,
        aiLabel: `[135+ 战术筑基：${effectiveElo}战力对位训练]`,
        prototypeInfo: {
          targetName,
          targetId,
          originalQuestion: prototype.question,
          originalAnalysis: prototype.analysis || '暂无解析',
          knowledgePoints: knowledgePoints.length > 0 ? knowledgePoints : [targetName]
        },
        aiPrompt: userPrompt
      }
    } catch (error) {
      console.error(`【AI 请求失败】${targetName}:`, error)
      
      // 回退到本地模式
      const questionText = sanitizeAlgebra(prototype.question)
      const analysisText = sanitizeAlgebra(prototype.analysis || '请根据题目要求进行解答。')
      const answerText = sanitizeAlgebra(prototype.answer || '答案待计算')
      
      return {
        question: questionText,
        analysis: `[本地模式] ${analysisText}`,
        answer: answerText,
        isAIGenerated: true,
        aiLabel: `[本地模式：${effectiveElo}战力对位]`,
        prototypeInfo: {
          targetName,
          targetId,
          originalQuestion: prototype.question,
          knowledgePoints: knowledgePoints.length > 0 ? knowledgePoints : [targetName]
        },
        isError: false,
        fallbackMode: true
      }
    }
  }
  
  // 返回异步结果
  return buildDNAProblem(
    targetId, 
    targetName, 
    difficulty, 
    params, 
    prototypeProblem, 
    topicType, 
    knowledgePoints,
    sourcePath,
    customPrompt,
    knowledgeData,  // V3.1: 传递完整的 motifObj（包含 evolution_blueprint）
    iterationIndex  // V3.1: 传递迭代索引，强制错开变例方向
  )
}

// AI 输出质量验证函数（V4.0 增强：逻辑步数检查 + 分类讨论检查）
const verifyAIOutput = (output, difficulty, targetId) => {
  if (!output.question || !output.analysis || !output.answer) {
    return { valid: false, reason: '缺少必要的题目组成部分' }
  }
  
  const sanityChecks = [
    { pattern: /-\d+\s*(人|个|只|条)/, reason: '出现负数的物理量' },
    { pattern: /\d+\.\d+\s*(人|个|只)/, reason: '出现非整数的离散量' }
  ]
  
  for (const check of sanityChecks) {
    if (check.pattern.test(output.question) || check.pattern.test(output.answer)) {
      return { valid: false, reason: check.reason }
    }
  }
  
  // V4.0 新增：逻辑步数检查
  if (difficulty && difficulty.minSteps) {
    const stepCount = (output.analysis.match(/\d+\./g) || []).length
    if (stepCount < difficulty.minSteps) {
      return { 
        valid: false, 
        reason: `逻辑步数不足：需要至少 ${difficulty.minSteps} 步，实际只有 ${stepCount} 步` 
      }
    }
  }
  
  // V4.0 新增：L2 禁止分类讨论检查
  if (difficulty && difficulty.allowDiscussion === false) {
    if (output.question.includes('讨论') || output.question.includes('分类')) {
      return { 
        valid: false, 
        reason: 'L2 级别禁止出现分类讨论' 
      }
    }
  }
  
  // V4.0 新增：L3 强制分类讨论检查
  if (difficulty && difficulty.allowDiscussion === true) {
    if (!output.question.includes('讨论') && !output.question.includes('分类')) {
      return { 
        valid: false, 
        reason: 'L3 级别必须包含分类讨论' 
      }
    }
  }
  
  return { valid: true }
}

const findProblemsFromKnowledgeBase = (targetId, level) => {
  const knowledgeEntry = CROSS_FILE_INDEX[targetId]
  
  if (!knowledgeEntry || knowledgeEntry.length === 0) {
    return null
  }
  
  const levelMap = { 'L1': 'L1', 'L2': 'L2', 'L3': 'L3', 'L4': 'L4' }
  const targetLevel = levelMap[level] || 'L2'
  
  const allProblems = []
  
  knowledgeEntry.forEach(entry => {
    if (entry.prototypeProblems && entry.prototypeProblems.length > 0) {
      entry.prototypeProblems.forEach(prob => {
        if (prob.level === targetLevel) {
          const validation = validateProblem(prob, level, targetId)
          if (validation.valid) {
            allProblems.push({
              question: prob.desc,
              analysis: `【${entry.category}】${entry.levelScaffolding?.[`${targetLevel.toLowerCase()}_base`] || entry.levelScaffolding?.[`L${targetLevel.slice(1)}_base`] || ''}`,
              answer: '见教材解析',
              source: 'knowledge_base',
              knowledgeId: entry.id,
              knowledgeName: entry.name,
              isValidated: true
            })
          }
        }
      })
    }
  })
  
  return allProblems.length > 0 ? allProblems : null
}

function WeeklyMission({ 
  tacticalData, 
  weeklyPlan, 
  errorNotebook, 
  currentGrade,
  onSetActiveMotifs,
  onResolveError,
  onNavigate
}) {
  const { isAcademicMode } = useContext(ThemeContext)
  const [showMotifSelector, setShowMotifSelector] = useState(false)
  const [selectedMotifs, setSelectedMotifs] = useState(weeklyPlan.activeMotifs || [])
  const [bundle, setBundle] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [selectorGrade, setSelectorGrade] = useState(currentGrade)
  const [verificationState, setVerificationState] = useState({})
  const [uploadedImages, setUploadedImages] = useState({})
  const [showPromptEditor, setShowPromptEditor] = useState(false)
  const [expandedPrototype, setExpandedPrototype] = useState(null) // 展开的样题原型
  
  // 教研级 Master Prompt（可编辑）- 命题引擎 2.0 最高宪法
  const [systemPrompt, setSystemPrompt] = useState(`【专家身份】
你是 135+ 高中数学研究院首席命题官。你拥有 20 年高考阅卷经验，你的命题准则是：逻辑同构、梯度科学、数值精美、学术严谨。

【三步命题法】
1. 深度解码：收到 \${prototypeDNA} 后，必须先解析其考查的数学基因（考点、难度、逻辑步数）。请在命题前，内部提取并确认样题的：① 知识点（如：共轭复数）；② 核心公式（如：模长公式）；③ 逻辑转折点（如：实部为 0）。生成的变式必须完整覆盖这些 DNA 节点。
2. 逻辑克隆：变式的命题必须与样题保持学科基因强耦合。严禁将向量题出成函数题。
3. 梯度重构：根据 \${eloScore} 调整复杂度。

【全学科执行规范】
1. 代数极简化：严禁出现 $0x, 1x, +(-)$ 等非专业表达。必须执行代数最简化渲染。
2. 梯度设问制：凡战力 $> 1800 (L3/L4)$ 的题目，强制采用双问结构。第(1)问基础保底；第(2)问引入变量参数进行深度探究或分类讨论。
3. 数值友好性：
   - 代数：判别式 $\\Delta$ 必须为完全平方数。
   - 几何/复数：边长、模长优先设计为整数。
   - 概率：计算结果必须是简洁的最简分数。
   - 严禁：由于数值随机导致的"计算死循环"或出现毫无常识的物理结果。
4. 学科锚点：
   - 复数：必含 $i$；向量：必含 $\\vec{a}$ 或坐标。
   - 集合：区间端点必须左小右大；数列：项数 $n$ 必须为正整数。

【输出协议】
仅输出纯 JSON 字符串，不得包含 \`\`\`json 等 Markdown 标记，不得包含任何开场白或解释。确保 JSON 字段名为 question, analysis, answer, aiLabel。`)

  const gradeOrder = { '高一': 1, '高二': 2, '高三': 3 }

  const getLevelStatus = (subs) => {
    if (!subs || subs.length === 0) return 'none'
    const allGreen = subs.every(s => s.is_mastered === true)
    const hasWarning = subs.some(s => s.is_mastered === 'warning')
    const hasRed = subs.some(s => s.is_mastered === false) || subs.some(s => s.is_mastered === undefined)
    
    if (allGreen) return 'mastered'
    if (hasWarning) return 'warning'
    if (hasRed) return 'locked'
    return 'none'
  }

  const getStatusDotColor = (status) => {
    switch (status) {
      case 'mastered': return 'bg-emerald-500'
      case 'warning': return 'bg-amber-500'
      case 'locked': return 'bg-red-500'
      default: return 'bg-slate-300'
    }
  }

  const weeklyStats = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const weekErrors = errorNotebook.filter(e => 
      new Date(e.addedAt) >= weekAgo
    )
    
    const allEncounters = tacticalData.tactical_maps.flatMap(m => m.encounters)
    
    const currentGradeEncounters = allEncounters.filter(e => 
      e.grades?.includes(currentGrade)
    )
    
    const bleedingCount = currentGradeEncounters.filter(e => e.health_status === 'bleeding').length
    const healthyCount = currentGradeEncounters.filter(e => e.health_status === 'healthy').length
    
    const totalElo = currentGradeEncounters.reduce((sum, e) => sum + (e.elo_score || 500), 0)
    const avgElo = currentGradeEncounters.length > 0 
      ? totalElo / currentGradeEncounters.length 
      : 500
    
    return {
      newErrors: weekErrors.filter(e => !e.resolved).length,
      resolvedErrors: weekErrors.filter(e => e.resolved).length,
      totalErrors: errorNotebook.filter(e => !e.resolved).length,
      bleedingCount,
      healthyCount,
      avgElo: Math.round(avgElo),
      activeMotifsCount: weeklyPlan.activeMotifs.length
    }
  }, [errorNotebook, tacticalData, weeklyPlan, currentGrade])

  const availableMotifs = useMemo(() => {
    const motifs = []
    tacticalData.tactical_maps.forEach(map => {
      map.encounters.forEach(encounter => {
        const grades = encounter.grades || []
        const minGrade = grades.reduce((min, g) => 
          (gradeOrder[g] || 999) < (gradeOrder[min] || 999) ? g : min, grades[0])
        
        if (selectorGrade === '高三' || grades.includes(selectorGrade)) {
          const l2Subs = encounter.sub_targets?.filter(s => s.level_req === 'L2') || []
          const l3Subs = encounter.sub_targets?.filter(s => s.level_req === 'L3') || []
          const l4Subs = encounter.sub_targets?.filter(s => s.level_req === 'L4') || []
          
          motifs.push({
            id: encounter.target_id,
            name: encounter.target_name,
            elo: encounter.elo_score,
            level: encounter.gear_level,
            grades,
            minGrade,
            l2Status: getLevelStatus(l2Subs),
            l3Status: getLevelStatus(l3Subs),
            l4Status: getLevelStatus(l4Subs),
            hasL2: l2Subs.length > 0,
            hasL3: l3Subs.length > 0,
            hasL4: l4Subs.length > 0
          })
        }
      })
    })
    return motifs
  }, [tacticalData, selectorGrade])

  const currentGradeMotifCount = useMemo(() => {
    let count = 0
    tacticalData.tactical_maps.forEach(map => {
      map.encounters.forEach(encounter => {
        if (encounter.grades?.includes(currentGrade)) {
          count++
        }
      })
    })
    return count
  }, [tacticalData, currentGrade])

  const extractProblemFromEncounter = async (encounter, targetLevel, source, usedSubIds, forceGenerate = false, isUserSelected = false, iterationIndex = 0) => {
    const targetId = encounter.target_id
    const targetName = encounter.target_name
    
    // 物理熔断：elo_score < 1001 且非用户勾选的，直接返回 null
    const eloScore = encounter.elo_score || 0
    if (eloScore < 1001 && !isUserSelected) {
      return null
    }
    
    const subTargets = encounter.sub_targets || []
    const targetSubs = subTargets.filter(s => s.level_req === targetLevel)
    
    // 筑基环节禁止返回 null：如果没有子目标，强制生成 AI 题目
    if (targetSubs.length === 0) {
      if (forceGenerate) {
        const aiProblem = await generateAIProblem(targetId, targetLevel, encounter, CROSS_FILE_INDEX[targetId], isUserSelected)
        if (!aiProblem) return null
        return {
          targetId,
          targetName,
          subId: `${targetId}_${targetLevel.toLowerCase()}_ai_forced_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          subName: `${targetName} - ${targetLevel}练习`,
          level: targetLevel,
          variant: aiProblem,
          variantType: 'S',
          source,
          isAIGenerated: true,
          aiLabel: aiProblem.aiLabel,
          prototypeInfo: aiProblem.prototypeInfo
        }
      }
      return null
    }
    
    const shuffledSubs = [...targetSubs].sort(() => Math.random() - 0.5)
    
    for (const sub of shuffledSubs) {
      const subIdBase = `${targetId}_${sub.sub_id}`
      
      if (sub.variants) {
        const variantTypes = ['S', 'A', 'B'].filter(v => sub.variants[v])
        const shuffledVariants = [...variantTypes].sort(() => Math.random() - 0.5)
        
        // 筑基环节：使用 iterationIndex 选择变式
        if (forceGenerate) {
          // 关键修复：如果索引超出变式数量，强制调用 AI 生成
          if (iterationIndex >= shuffledVariants.length) {
            const aiProblem = await generateAIProblem(targetId, targetLevel, encounter, CROSS_FILE_INDEX[targetId], isUserSelected, iterationIndex)
            if (aiProblem) {
              return {
                targetId,
                targetName,
                subId: `${targetId}_${targetLevel.toLowerCase()}_ai_iter${iterationIndex}_${Date.now()}`,
                subName: `${targetName} - ${targetLevel}练习`,
                level: targetLevel,
                variant: aiProblem,
                variantType: 'S',
                source,
                isAIGenerated: true,
                aiLabel: aiProblem.aiLabel,
                prototypeInfo: aiProblem.prototypeInfo
              }
            }
          }
          
          // 正常取变式
          const v = shuffledVariants[iterationIndex % shuffledVariants.length]
          const subId = `${subIdBase}_${v}_${Date.now()}_${iterationIndex}`
          return {
            targetId,
            targetName,
            subId,
            subName: sub.sub_name,
            level: targetLevel,
            variant: sub.variants[v],
            variantType: v,
            source,
            isFromTactical: true
          }
        }
        
        for (const v of shuffledVariants) {
          const subId = `${subIdBase}_${v}`
          if (!usedSubIds.has(subId)) {
            return {
              targetId,
              targetName,
              subId,
              subName: sub.sub_name,
              level: targetLevel,
              variant: sub.variants[v],
              variantType: v,
              source,
              isFromTactical: true
            }
          }
        }
        
        // 强制内容复用：如果所有变式都已打印，强制复用第一个变式
        const firstVariant = variantTypes[0]
        if (firstVariant && sub.variants[firstVariant]) {
          const forcedSubId = `${subIdBase}_${firstVariant}_forced_${Date.now()}`
          return {
            targetId,
            targetName,
            subId: forcedSubId,
            subName: sub.sub_name,
            level: targetLevel,
            variant: sub.variants[firstVariant],
            variantType: firstVariant,
            source,
            isFromTactical: true,
            isForcedReuse: true
          }
        }
      }
    }
    
    const knowledgeProblems = findProblemsFromKnowledgeBase(targetId, targetLevel)
    if (knowledgeProblems && knowledgeProblems.length > 0) {
      const shuffledProbs = [...knowledgeProblems].sort(() => Math.random() - 0.5)
      
      // 筑基环节：使用 iterationIndex 选择知识库题目
      if (forceGenerate) {
        // 如果索引超出知识库题目数量，强制调用 AI 生成
        if (iterationIndex >= shuffledProbs.length) {
          const aiProblem = await generateAIProblem(targetId, targetLevel, encounter, CROSS_FILE_INDEX[targetId], isUserSelected, iterationIndex)
          if (aiProblem) {
            return {
              targetId,
              targetName,
              subId: `${targetId}_${targetLevel.toLowerCase()}_ai_iter${iterationIndex}_${Date.now()}`,
              subName: `${targetName} - ${targetLevel}练习`,
              level: targetLevel,
              variant: aiProblem,
              variantType: 'S',
              source,
              isAIGenerated: true,
              aiLabel: aiProblem.aiLabel
            }
          }
        }
        
        const prob = shuffledProbs[iterationIndex % shuffledProbs.length]
        return {
          targetId,
          targetName,
          subId: `${targetId}_${targetLevel.toLowerCase()}_kb_${iterationIndex}_${Date.now()}`,
          subName: prob.knowledgeName || targetName,
          level: targetLevel,
          variant: {
            question: prob.question,
            analysis: prob.analysis,
            answer: prob.answer
          },
          variantType: 'S',
          source,
          isFromKnowledgeBase: true,
          knowledgeId: prob.knowledgeId
        }
      }
      
      for (const prob of shuffledProbs) {
        const subId = `${targetId}_${targetLevel.toLowerCase()}_kb_${prob.knowledgeId || Math.random().toString(36).slice(2)}`
        if (!usedSubIds.has(subId)) {
          return {
            targetId,
            targetName,
            subId,
            subName: prob.knowledgeName || targetName,
            level: targetLevel,
            variant: {
              question: prob.question,
              analysis: prob.analysis,
              answer: prob.answer
            },
            variantType: 'S',
            source,
            isFromKnowledgeBase: true,
            knowledgeId: prob.knowledgeId
          }
        }
      }
      
      // 强制复用知识库题目
      const firstProb = shuffledProbs[0]
      if (firstProb) {
        const forcedSubId = `${targetId}_${targetLevel.toLowerCase()}_kb_forced_${Date.now()}`
        return {
          targetId,
          targetName,
          subId: forcedSubId,
          subName: firstProb.knowledgeName || targetName,
          level: targetLevel,
          variant: {
            question: firstProb.question,
            analysis: firstProb.analysis,
            answer: firstProb.answer
          },
          variantType: 'S',
          source,
          isFromKnowledgeBase: true,
          knowledgeId: firstProb.knowledgeId,
          isForcedReuse: true
        }
      }
    }
    
    // 最后兜底：强制生成 AI 题目
    if (forceGenerate) {
      const aiProblem = await generateAIProblem(targetId, targetLevel, encounter, CROSS_FILE_INDEX[targetId], isUserSelected)
      if (!aiProblem) return null
      return {
        targetId,
        targetName,
        subId: `${targetId}_${targetLevel.toLowerCase()}_ai_final_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        subName: `${targetName} - ${targetLevel}练习`,
        level: targetLevel,
        variant: aiProblem,
        variantType: 'S',
        source,
        isAIGenerated: true,
        aiLabel: aiProblem.aiLabel,
        prototypeInfo: aiProblem.prototypeInfo
      }
    }
    
    const aiProblem = await generateAIProblem(targetId, targetLevel, encounter, CROSS_FILE_INDEX[targetId], isUserSelected)
    if (!aiProblem) return null
    const aiSubId = `${targetId}_${targetLevel.toLowerCase()}_ai_${Date.now()}_${Math.random().toString(36).slice(2)}`
    return {
      targetId,
      targetName,
      subId: aiSubId,
      subName: encounter.sub_targets?.[0]?.sub_name || `${targetName} - ${targetLevel}练习`,
      level: targetLevel,
      variant: aiProblem,
      variantType: 'S',
      source,
      isAIGenerated: true,
      prototypeInfo: aiProblem.prototypeInfo
    }
  }

  const handleGenerateBundle = async () => {
    setGenerating(true)
    setBundle(null)
    
    console.log('【开始生成】handleGenerateBundle 启动')
    
    // ========== 第一层：超级候选池 ==========
    const redList = new Set(
      errorNotebook.filter(e => !e.resolved).map(e => e.targetId)
    )
    
    const powerList = new Map()
    const allEncounters = new Map()
    
    for (const map of tacticalData.tactical_maps) {
      for (const encounter of map.encounters) {
        allEncounters.set(encounter.target_id, encounter)
        if ((encounter.elo_score || 0) >= 1001) {
          powerList.set(encounter.target_id, encounter)
        }
      }
    }
    
    const choiceList = new Set(weeklyPlan.activeMotifs || [])
    
    const findEncounterById = (targetId) => {
      const encounter = allEncounters.get(targetId)
      if (!encounter) return null
      if ((encounter.elo_score || 0) < 1001 && !redList.has(targetId) && !choiceList.has(targetId)) {
        return null
      }
      return encounter
    }
    
    const addedSubIds = new Set()
    const usedMotifIds = new Set()
    
    // ========== 步骤 1：🔴 错题巩固 ==========
    const errorPromises = []
    for (const targetId of redList) {
      usedMotifIds.add(targetId)
      const encounter = findEncounterById(targetId)
      if (encounter) {
        const level = encounter.gear_level || 'L2'
        for (let i = 0; i < 2; i++) {
          errorPromises.push(
            extractProblemFromEncounter(encounter, level, 'error', addedSubIds, true, true, i)
              .then(problem => {
                if (problem) {
                  addedSubIds.add(problem.subId)
                  return problem
                }
                return null
              })
          )
        }
      }
    }
    
    // ========== 步骤 2：🔵 意愿补位 ==========
    const basicPromises = []
    for (const targetId of choiceList) {
      if (usedMotifIds.has(targetId)) continue
      usedMotifIds.add(targetId)
      const encounter = findEncounterById(targetId)
      if (encounter) {
        const level = encounter.gear_level || 'L2'
        for (let i = 0; i < 2; i++) {
          basicPromises.push(
            extractProblemFromEncounter(encounter, level, 'active', addedSubIds, true, true, i)
              .then(problem => {
                if (problem) {
                  addedSubIds.add(problem.subId)
                  return problem
                }
                return null
              })
          )
        }
      }
    }
    
    // ========== 步骤 3：🟡 筑基强化 ==========
    const foundationCandidates = [...powerList.values()]
      .filter(e => !usedMotifIds.has(e.target_id))
      .sort((a, b) => (a.elo_score || 0) - (b.elo_score || 0))
      .slice(0, 3)
    
    const bleedingPromises = []
    for (const encounter of foundationCandidates) {
      usedMotifIds.add(encounter.target_id)
      const level = encounter.gear_level || 'L2'
      for (let i = 0; i < 3; i++) {
        bleedingPromises.push(
          extractProblemFromEncounter(encounter, level, 'bleeding', addedSubIds, true, false, i)
            .then(problem => {
              if (problem) {
                addedSubIds.add(problem.subId)
                return problem
              }
              return null
            })
        )
      }
    }
    
    // ========== 并行执行所有 AI 请求 ==========
    console.log('【并行执行】等待所有 AI 请求完成...')
    const [errorResults, basicResults, bleedingResults] = await Promise.all([
      Promise.all(errorPromises),
      Promise.all(basicPromises),
      Promise.all(bleedingPromises)
    ])
    
    // ========== 过滤 null 结果并创建全新 bundle ==========
    const errors = errorResults.filter(Boolean)
    const basics = basicResults.filter(Boolean)
    const bleeding = bleedingResults.filter(Boolean)
    
    console.log('【生成完成】errors:', errors.length, 'basics:', basics.length, 'bleeding:', bleeding.length)
    
    // ========== 一次性创建全新 bundle 对象 ==========
    const newBundle = {
      errors,
      bleeding,
      basics,
      generatedAt: new Date().toISOString(),
      noActiveMotifs: errors.length + bleeding.length + basics.length === 0
    }
    
    console.log('【设置状态】setBundle 调用')
    setBundle(newBundle)
    setGenerating(false)
    console.log('【设置状态】setGenerating(false) 调用')
  }

  const handleSaveMotifs = () => {
    onSetActiveMotifs(selectedMotifs)
    setShowMotifSelector(false)
  }

  const LEVEL_POINT_VALUE = {
    'L2': 40,
    'L3': 60,
    'L4': 100
  }

  const handleVerifyAnswer = (itemKey, isCorrect) => {
    const item = allQuestions.find(q => `${q.targetId}_${q.subId}` === itemKey)
    if (!item) return

    const encounter = tacticalData.tactical_maps
      .flatMap(map => map.encounters)
      .find(e => e.target_id === item.targetId)
    
    if (!encounter) return

    const subTarget = encounter.sub_targets?.find(s => s.sub_id === item.subId)
    if (!subTarget) return

    const currentElo = encounter.elo_score || 500
    const level = item.level

    let eloChange = 0
    let newConsecutiveCorrect = subTarget.consecutive_correct || 0

    if (isCorrect) {
      eloChange = LEVEL_POINT_VALUE[level] || 40
      newConsecutiveCorrect = newConsecutiveCorrect + 1
    } else {
      newConsecutiveCorrect = 0
    }

    const newElo = Math.min(3000, Math.max(0, currentElo + eloChange))
    
    const updatedSubTargets = encounter.sub_targets.map(s => {
      if (s.sub_id === item.subId) {
        const isMastered = newConsecutiveCorrect >= 3 && newElo >= (level === 'L2' ? 1001 : level === 'L3' ? 1801 : 2501)
        return {
          ...s,
          is_mastered: isCorrect ? (isMastered ? true : s.is_mastered) : false,
          consecutive_correct: newConsecutiveCorrect,
          last_practice: new Date().toISOString()
        }
      }
      return s
    })

    const updatedEncounter = {
      ...encounter,
      elo_score: newElo,
      gear_level: newElo >= 2501 ? 'L4' : newElo >= 1801 ? 'L3' : newElo >= 1001 ? 'L2' : 'L1',
      sub_targets: updatedSubTargets
    }

    const updatedTacticalMaps = tacticalData.tactical_maps.map(map => ({
      ...map,
      encounters: map.encounters.map(e => 
        e.target_id === item.targetId ? updatedEncounter : e
      )
    }))

    if (onTacticalDataUpdate) {
      onTacticalDataUpdate({ tactical_maps: updatedTacticalMaps })
    }

    setVerificationState(prev => ({
      ...prev,
      [itemKey]: {
        verified: true,
        isCorrect,
        eloChange,
        newConsecutiveCorrect
      }
    }))
  }

  const handleInputChange = (itemKey, value) => {
    setVerificationState(prev => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        inputValue: value,
        hasInput: value.trim().length > 0
      }
    }))
  }

  const handleImageUpload = (itemKey, file) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      setUploadedImages(prev => ({
        ...prev,
        [itemKey]: reader.result
      }))
      setVerificationState(prev => ({
        ...prev,
        [itemKey]: {
          ...prev[itemKey],
          hasUpload: true
        }
      }))
    }
    reader.readAsDataURL(file)
  }

  const canShowAnalysis = (itemKey) => {
    const state = verificationState[itemKey]
    return state?.hasInput || state?.hasUpload
  }

  const renderVerificationComponent = (item, idx) => {
    const itemKey = `${item.targetId}_${item.subId}`
    const state = verificationState[itemKey] || {}
    const showAnalysis = canShowAnalysis(itemKey)
    const isVerified = state?.verified

    return (
      <div className={`mt-3 p-3 rounded border ${isAcademicMode ? 'bg-slate-50 border-slate-200' : 'bg-zinc-800/50 border-zinc-700'}`}>
        {!isVerified ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="输入你的答案..."
                value={state.inputValue || ''}
                onChange={(e) => handleInputChange(itemKey, e.target.value)}
                className={`flex-1 px-3 py-2 rounded text-sm ${
                  isAcademicMode 
                    ? 'bg-white border-slate-200 text-slate-700' 
                    : 'bg-zinc-700 border-zinc-600 text-zinc-200'
                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <label className={`px-3 py-2 rounded text-sm cursor-pointer ${
                isAcademicMode 
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}>
                <Upload className="w-4 h-4 inline mr-1" />
                上传草稿
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleImageUpload(itemKey, e.target.files[0])}
                />
              </label>
            </div>
            
            {showAnalysis && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    setVerificationState(prev => ({
                      ...prev,
                      [itemKey]: { ...prev[itemKey], showAnalysis: true }
                    }))
                  }}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                    isAcademicMode 
                      ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                      : 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                  }`}
                >
                  📖 查看解析
                </button>
                <button
                  onClick={() => handleVerifyAnswer(itemKey, true)}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                    isAcademicMode 
                      ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
                      : 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50'
                  }`}
                >
                  ✅ 确认通过
                </button>
                <button
                  onClick={() => handleVerifyAnswer(itemKey, false)}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                    isAcademicMode 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                  }`}
                >
                  ❌ 核销失败
                </button>
              </div>
            )}
            
            {state.showAnalysis && (
              <div className={`mt-3 p-3 rounded text-sm ${isAcademicMode ? 'bg-gray-100 text-gray-600' : 'bg-zinc-700 text-zinc-300'}`}>
                <p className="font-medium mb-1">📖 解析：</p>
                <div className="whitespace-pre-line"><LatexRenderer content={item.variant?.analysis} /></div>
                <p className="mt-2 font-medium">✅ 答案：{item.variant?.answer}</p>
              </div>
            )}
          </>
        ) : (
          <div className={`p-3 rounded text-sm ${
            state.isCorrect 
              ? isAcademicMode ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-900/20 text-emerald-400'
              : isAcademicMode ? 'bg-red-50 text-red-600' : 'bg-red-900/20 text-red-400'
          }`}>
            {state.isCorrect ? (
              <div>
                ✅ 核销通过！积分 +{state.eloChange}，连续正确 {state.newConsecutiveCorrect}/3
              </div>
            ) : (
              <div>
                ❌ 核销失败，连续正确计数归零
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const toggleMotif = (motifId) => {
    setSelectedMotifs(prev => 
      prev.includes(motifId) 
        ? prev.filter(id => id !== motifId)
        : [...prev, motifId]
    )
  }

  const handlePrint = () => {
    const printContent = document.querySelector('.print-content')
    if (!printContent) return
    
    const originalContents = document.body.innerHTML
    const printWindow = window.open('', '_blank')
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>数学无忧 · 周度练习包</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: white;
              color: black;
              font-size: 12pt;
              line-height: 1.5;
              padding: 15mm;
            }
            h1 {
              font-size: 18pt;
              font-weight: bold;
              margin-bottom: 10pt;
              text-align: center;
            }
            h2 {
              font-size: 14pt;
              font-weight: bold;
              margin-top: 15pt;
              margin-bottom: 8pt;
              border-bottom: 1px solid #ccc;
              padding-bottom: 4pt;
              page-break-before: always;
            }
            h2:first-of-type {
              page-break-before: avoid;
            }
            .mb-6 {
              margin-bottom: 18pt;
              page-break-inside: avoid;
            }
            .mb-8 {
              margin-bottom: 24pt;
            }
            .p-4 {
              padding: 10pt;
            }
            .border {
              border: 1px solid #ccc;
            }
            .rounded {
              border-radius: 4pt;
            }
            .draft-area {
              height: 180px;
              min-height: 180px;
              border: 1px dashed #999;
              background: #fafafa;
              margin-bottom: 12pt;
              padding: 6pt;
            }
            .text-gray-500 {
              color: #666;
            }
            .text-gray-600 {
              color: #555;
            }
            .text-sm {
              font-size: 10pt;
            }
            .font-medium {
              font-weight: 500;
            }
            .font-bold {
              font-weight: bold;
            }
            .flex {
              display: flex;
            }
            .justify-between {
              justify-content: space-between;
            }
            .whitespace-pre-line {
              white-space: pre-line;
            }
            .bg-gray-50 {
              background: #f8f8f8;
              padding: 8pt;
              border-radius: 4pt;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

  const allQuestions = useMemo(() => {
    if (!bundle) return []
    return [...bundle.errors, ...bundle.bleeding, ...bundle.basics]
  }, [bundle])

  const aiGeneratedCount = useMemo(() => {
    if (!bundle) return 0
    return allQuestions.filter(q => q.isAIGenerated).length
  }, [bundle, allQuestions])

  return (
    <div className="h-full bg-slate-50 dark:bg-zinc-950 overflow-y-auto">
      <div className="w-full px-4 py-6 max-w-4xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className={`w-6 h-6 ${isAcademicMode ? 'text-blue-600' : 'text-emerald-500'}`} />
            <h1 className={`text-xl font-bold ${isAcademicMode ? 'text-slate-900' : 'text-zinc-100'}`}>
              周度任务生成器
            </h1>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded ${isAcademicMode ? 'bg-blue-100 text-blue-600' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {currentGrade}
          </span>
        </header>

        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className={`w-4 h-4 ${isAcademicMode ? 'text-blue-600' : 'text-emerald-500'}`} />
            <h2 className={`text-sm font-semibold uppercase tracking-wider ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
              本周总结
            </h2>
          </div>
          <div className={`rounded-lg border p-4 ${isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-3 rounded-lg ${isAcademicMode ? 'bg-red-50' : 'bg-red-900/20'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className={`text-xs ${isAcademicMode ? 'text-red-600' : 'text-red-400'}`}>新录入错题</span>
                </div>
                <p className={`text-2xl font-bold ${isAcademicMode ? 'text-red-600' : 'text-red-400'}`}>
                  {weeklyStats.newErrors}
                </p>
              </div>
              
              <div className={`p-3 rounded-lg ${isAcademicMode ? 'bg-amber-50' : 'bg-amber-900/20'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-amber-500" />
                  <span className={`text-xs ${isAcademicMode ? 'text-amber-600' : 'text-amber-400'}`}>待消灭错题</span>
                </div>
                <p className={`text-2xl font-bold ${isAcademicMode ? 'text-amber-600' : 'text-amber-400'}`}>
                  {weeklyStats.totalErrors}
                </p>
              </div>
              
              <div className={`p-3 rounded-lg ${isAcademicMode ? 'bg-emerald-50' : 'bg-emerald-900/20'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className={`text-xs ${isAcademicMode ? 'text-emerald-600' : 'text-emerald-400'}`}>已消灭</span>
                </div>
                <p className={`text-2xl font-bold ${isAcademicMode ? 'text-emerald-600' : 'text-emerald-400'}`}>
                  {weeklyStats.resolvedErrors}
                </p>
              </div>
              
              <div className={`p-3 rounded-lg ${isAcademicMode ? 'bg-blue-50' : 'bg-blue-900/20'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className={`text-xs ${isAcademicMode ? 'text-blue-600' : 'text-blue-400'}`}>平均积分</span>
                </div>
                <p className={`text-2xl font-bold ${isAcademicMode ? 'text-blue-600' : 'text-blue-400'}`}>
                  {weeklyStats.avgElo}
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className={`w-4 h-4 ${isAcademicMode ? 'text-slate-500' : 'text-zinc-500'}`} />
                  <span className={`text-sm ${isAcademicMode ? 'text-slate-600' : 'text-zinc-400'}`}>
                    下周学习重点：{weeklyStats.activeMotifsCount} 个母题
                  </span>
                </div>
                <button
                  onClick={() => setShowMotifSelector(true)}
                  className={`px-3 py-1.5 rounded text-xs font-medium ${
                    isAcademicMode 
                      ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                      : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  }`}
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  选择下周重点
                </button>
              </div>
              {weeklyPlan.activeMotifs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {weeklyPlan.activeMotifs.map(motifId => {
                    const motif = availableMotifs.find(m => m.id === motifId)
                    return motif ? (
                      <span 
                        key={motifId}
                        className={`text-xs px-2 py-1 rounded ${
                          isAcademicMode 
                            ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                            : 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {motif.id} · {motif.name}
                      </span>
                    ) : null
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 命题引擎配置 - 折叠面板 */}
        <section className="mb-6">
          <button
            onClick={() => setShowPromptEditor(!showPromptEditor)}
            className={`w-full flex items-center justify-between p-3 rounded-lg border ${
              isAcademicMode 
                ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' 
                : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 ${isAcademicMode ? 'text-amber-500' : 'text-amber-400'}`} />
              <span className={`text-sm font-medium ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                命题引擎配置
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showPromptEditor ? 'rotate-180' : ''} ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`} />
          </button>
          
          {showPromptEditor && (
            <div className={`mt-2 p-4 rounded-lg border ${isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-medium ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                  教研级 Master Prompt（可编辑）
                </span>
                <button
                  onClick={() => setSystemPrompt(`你是高中数学命题专家，必须严格遵守以下三条铁律：

【铁律一：同构映射】
- 严禁改变样题的考点类型
- 如果样题是复数运算，生成的必须是复数运算
- 如果样题是集合问题，生成的必须是集合问题
- 如果样题是函数性质，生成的必须是函数性质
- 仅允许改变常数项数值和参数符号

【铁律二：LaTeX 规范】
- 严禁出现 0x, 1x, +- 等非规范表达
- 必须通过代数简化输出标准 LaTeX
- 系数必须化简到最简形式
- 负号必须正确处理，避免 -- 变成 +

【铁律三：战力对位】
- Elo 1001-1800 (L2 基础筑基)：2-3 步计算，无分类讨论，参数为整数或简单分数
- Elo 1801-2500 (L3 深度复合)：4-6 步计算，含分类讨论，参数可含根式
- Elo 2500+ (L4 战术压轴)：5-7 步计算，多参数讨论，含逻辑证明

【输出格式】
必须返回 JSON 格式：
{
  "question": "题干（使用 LaTeX 公式）",
  "analysis": "解析步骤（编号列表）",
  "answer": "最终答案"
}`)}
                  className={`text-xs px-2 py-1 rounded ${isAcademicMode ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                >
                  重置默认
                </button>
              </div>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className={`w-full h-64 p-3 rounded-lg border text-xs font-mono resize-y ${
                  isAcademicMode 
                    ? 'bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400' 
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                } outline-none`}
                placeholder="输入教研级 Master Prompt..."
              />
              <p className={`mt-2 text-xs ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`}>
                💡 提示：修改此 Prompt 会影响所有 AI 生成的题目。支持实时生效。
              </p>
              
              {/* 变量占位符说明 */}
              <div className={`mt-3 p-3 rounded-lg border ${isAcademicMode ? 'bg-blue-50 border-blue-200' : 'bg-zinc-800 border-zinc-600'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Code className={`w-4 h-4 ${isAcademicMode ? 'text-blue-500' : 'text-blue-400'}`} />
                  <span className={`text-xs font-medium ${isAcademicMode ? 'text-blue-600' : 'text-blue-300'}`}>
                    可用变量占位符
                  </span>
                </div>
                <div className={`text-xs space-y-1 ${isAcademicMode ? 'text-slate-600' : 'text-zinc-300'}`}>
                  <div className="flex items-start gap-2">
                    <code className={`px-1.5 py-0.5 rounded text-xs ${isAcademicMode ? 'bg-blue-100 text-blue-700' : 'bg-zinc-700 text-blue-300'}`}>
                      {'${prototypeDNA}'}
                    </code>
                    <span>→ 样题原型的完整题目内容（自动注入）</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className={`px-1.5 py-0.5 rounded text-xs ${isAcademicMode ? 'bg-blue-100 text-blue-700' : 'bg-zinc-700 text-blue-300'}`}>
                      {'${eloScore}'}
                    </code>
                    <span>→ 当前母题的 Elo 战力分数</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className={`px-1.5 py-0.5 rounded text-xs ${isAcademicMode ? 'bg-blue-100 text-blue-700' : 'bg-zinc-700 text-blue-300'}`}>
                      {'${targetName}'}
                    </code>
                    <span>→ 母题名称（如"集合"、"复数"）</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className={`px-1.5 py-0.5 rounded text-xs ${isAcademicMode ? 'bg-blue-100 text-blue-700' : 'bg-zinc-700 text-blue-300'}`}>
                      {'${knowledgePoints}'}
                    </code>
                    <span>→ 相关知识点列表</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className={`w-4 h-4 ${isAcademicMode ? 'text-blue-600' : 'text-emerald-500'}`} />
              <h2 className={`text-sm font-semibold uppercase tracking-wider ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                下周物料预览
              </h2>
            </div>
            <div className="flex gap-2">
              {bundle && (
                <button
                  onClick={() => setBundle(null)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    isAcademicMode 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                      : 'bg-red-900/20 text-red-400 hover:bg-red-900/30 border border-red-500/30'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  清空题目
                </button>
              )}
              <button
                onClick={handleGenerateBundle}
                disabled={generating}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  generating
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : isAcademicMode 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {generating ? '生成中...' : bundle ? '重新生成' : '生成带走包'}
              </button>
              {bundle && (
                <button
                  onClick={handlePrint}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    isAcademicMode 
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200' 
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  打印 PDF
                </button>
              )}
            </div>
          </div>
          
          <div className={`text-xs mt-2 mb-3 ${isAcademicMode ? 'text-slate-500' : 'text-zinc-500'}`}>
            [源数据核对：待消灭错题 {errorNotebook.filter(e => !e.resolved).length} 道，图谱红点 {
              tacticalData.tactical_maps.flatMap(m => m.encounters)
                .filter(e => e.grades?.includes(currentGrade) && 
                  (e.sub_targets || []).some(sub => sub.is_mastered === false)
                ).length
            } 个]
          </div>

          {!bundle ? (
            <div className={`rounded-lg border p-8 text-center ${isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'}`}>
              <Clock className={`w-12 h-12 mx-auto mb-3 ${isAcademicMode ? 'text-slate-300' : 'text-zinc-700'}`} />
              <p className={`text-sm ${isAcademicMode ? 'text-slate-500' : 'text-zinc-500'}`}>
                点击"生成带走包"按钮，系统将根据错题、薄弱点和下周重点自动生成练习题
              </p>
              <p className={`text-xs mt-2 ${isAcademicMode ? 'text-slate-400' : 'text-zinc-600'}`}>
                支持跨文件抓题，若数据库无现成题目将自动生成模拟题
              </p>
            </div>
          ) : bundle.noActiveMotifs ? (
            <div className={`rounded-lg border p-8 text-center ${isAcademicMode ? 'bg-amber-50 border-amber-200' : 'bg-amber-900/10 border-amber-500/30'}`}>
              <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${isAcademicMode ? 'text-amber-400' : 'text-amber-500'}`} />
              <p className={`text-sm font-medium mb-2 ${isAcademicMode ? 'text-amber-700' : 'text-amber-400'}`}>
                当前暂无激活母题
              </p>
              <p className={`text-xs ${isAcademicMode ? 'text-amber-600' : 'text-amber-500/80'}`}>
                请先前往"作战看板"开启母题练习，或在左侧手动勾选本周重点
              </p>
              <p className={`text-xs mt-2 ${isAcademicMode ? 'text-amber-500' : 'text-amber-500/60'}`}>
                系统不会从纯初始状态（全灰/L1且无记录）的母题中自动抓题
              </p>
            </div>
          ) : (
            <div className={`rounded-lg border ${isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'}`}>
              <div className="p-4 border-b border-slate-200 dark:border-zinc-700">
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${isAcademicMode ? 'text-slate-500' : 'text-zinc-500'}`}>
                    生成时间：{new Date(bundle.generatedAt).toLocaleString('zh-CN')}
                    {' · '}共 {allQuestions.length} 道题
                  </p>
                  {aiGeneratedCount > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded ${isAcademicMode ? 'bg-blue-50 text-blue-500' : 'bg-blue-900/20 text-blue-400'}`}>
                      <Sparkles className="w-3 h-3 inline mr-1" />
                      含 {aiGeneratedCount} 道 AI 模拟题
                    </span>
                  )}
                </div>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto">
                {/* 错题巩固 - 始终显示 */}
                <div className="p-4 border-b border-slate-200 dark:border-zinc-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">🔴</span>
                    <h3 className={`text-sm font-semibold ${isAcademicMode ? 'text-red-600' : 'text-red-400'}`}>
                      错题巩固 ({bundle.errors.length}题)
                    </h3>
                  </div>
                  {bundle.errors.length === 0 ? (
                    <p className={`text-xs italic ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`}>
                      [暂无新增错题] —— 本周表现优秀，继续保持！
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {bundle.errors.map((item, idx) => {
                        const itemKey = `error-${idx}`
                        const isExpanded = expandedPrototype === itemKey
                        
                        return (
                          <div key={idx} className={`p-3 rounded ${item.isAIGenerated ? 'bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/30' : isAcademicMode ? 'bg-red-50' : 'bg-red-900/10'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-mono ${isAcademicMode ? 'text-slate-500' : 'text-zinc-500'}`}>
                                  {item.targetId}
                                </span>
                                {item.isAIGenerated && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
                                    🔵 教研预设
                                  </span>
                                )}
                                {item.isFromKnowledgeBase && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">
                                    🟣 知识库
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setExpandedPrototype(isExpanded ? null : itemKey)}
                                  className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors ${isAcademicMode ? 'text-slate-400 hover:text-blue-500' : 'text-zinc-500 hover:text-blue-400'}`}
                                  title="查看样题原型"
                                >
                                  <Info className="w-4 h-4" />
                                </button>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${levelColors[item.level]?.bg} ${levelColors[item.level]?.text}`}>
                                  {item.level} · {item.variantType}
                                </span>
                              </div>
                            </div>
                            <p className={`text-sm font-medium mb-2 ${isAcademicMode ? 'text-slate-800' : 'text-zinc-200'}`}>
                              {item.subName}
                            </p>
                            <div className="text-xs mt-2 p-2 bg-slate-50 dark:bg-zinc-800/50 rounded border border-dashed border-slate-200 dark:border-zinc-700">
                              <div className={`whitespace-pre-line ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                                <LatexRenderer content={item.variant?.question || item.prototype_desc || "正在匹配精准题干..."} />
                              </div>
                            </div>
                            {/* 样题原型展开区 - 全景视图 */}
                            {isExpanded && (
                              <div className={`mt-2 p-3 rounded text-xs ${isAcademicMode ? 'bg-slate-100 border border-slate-300' : 'bg-zinc-800 border border-zinc-600'}`}>
                                {/* 样题原文 */}
                                <div className="mb-3">
                                  <div className="flex items-center gap-1 mb-1">
                                    <FileText className={`w-3 h-3 ${isAcademicMode ? 'text-blue-500' : 'text-blue-400'}`} />
                                    <span className={`font-medium ${isAcademicMode ? 'text-blue-600' : 'text-blue-300'}`}>
                                      【样题原文】
                                    </span>
                                  </div>
                                  {(item.prototypeInfo?.originalQuestion || item.variant?.prototypeInfo?.originalQuestion) ? (
                                    <div className={`${isAcademicMode ? 'text-slate-600' : 'text-zinc-300'}`}>
                                      <LatexRenderer content={item.prototypeInfo?.originalQuestion || item.variant?.prototypeInfo?.originalQuestion} />
                                    </div>
                                  ) : (
                                    <div className={`${isAcademicMode ? 'text-amber-600' : 'text-amber-400'}`}>
                                      [诊断] 样题原文缺失
                                    </div>
                                  )}
                                </div>
                                {/* 样题解析 */}
                                <div>
                                  <div className="flex items-center gap-1 mb-1">
                                    <FileText className={`w-3 h-3 ${isAcademicMode ? 'text-green-500' : 'text-green-400'}`} />
                                    <span className={`font-medium ${isAcademicMode ? 'text-green-600' : 'text-green-300'}`}>
                                      【样题解析】
                                    </span>
                                  </div>
                                  {(() => {
                                    const analysis = item.prototypeInfo?.originalAnalysis || item.variant?.prototypeInfo?.originalAnalysis
                                    // 空值判定：如果解析为空或只有"暂无解析"，标红显示警告
                                    if (!analysis || analysis === '暂无解析' || analysis.trim() === '') {
                                      return (
                                        <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30">
                                          <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                                            <AlertTriangle className="w-3 h-3" />
                                            <span>【数据缺失警告】</span>
                                          </div>
                                          <p className="mt-1 text-red-500 dark:text-red-300">
                                            该母题 JSON 缺少解析基因，请联系教研重录。
                                          </p>
                                        </div>
                                      )
                                    }
                                    return (
                                      <div className={`${isAcademicMode ? 'text-slate-600' : 'text-zinc-300'}`}>
                                        <LatexRenderer content={analysis} />
                                      </div>
                                    )
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                
                {/* 筑基强化 - 始终显示 */}
                <div className="p-4 border-b border-slate-200 dark:border-zinc-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">🟡</span>
                    <h3 className={`text-sm font-semibold ${isAcademicMode ? 'text-amber-600' : 'text-amber-400'}`}>
                      筑基强化 ({bundle.bleeding.length}题)
                    </h3>
                  </div>
                  {bundle.bleeding.length === 0 ? (
                    <p className={`text-xs italic ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`}>
                      [暂无筑基任务] —— 请前往看板激活母题（战力 &gt;=1001）
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {bundle.bleeding.map((item, idx) => {
                        const itemKey = `bleeding-${idx}`
                        const isExpanded = expandedPrototype === itemKey
                        
                        return (
                          <div key={idx} className={`p-3 rounded ${item.isAIGenerated ? 'bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/30' : isAcademicMode ? 'bg-amber-50' : 'bg-amber-900/10'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-mono ${isAcademicMode ? 'text-slate-500' : 'text-zinc-500'}`}>
                                  {item.targetId}
                                </span>
                                {item.isAIGenerated && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
                                    🔵 教研预设
                                  </span>
                                )}
                                {item.isFromKnowledgeBase && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">
                                    🟣 知识库
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setExpandedPrototype(isExpanded ? null : itemKey)}
                                  className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors ${isAcademicMode ? 'text-slate-400 hover:text-blue-500' : 'text-zinc-500 hover:text-blue-400'}`}
                                  title="查看样题原型"
                                >
                                  <Info className="w-4 h-4" />
                                </button>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${levelColors[item.level]?.bg} ${levelColors[item.level]?.text}`}>
                                  {item.level} · {item.variantType}
                                </span>
                              </div>
                            </div>
                            <p className={`text-sm font-medium mb-2 ${isAcademicMode ? 'text-slate-800' : 'text-zinc-200'}`}>
                              {item.subName}
                            </p>
                            <div className="text-xs mt-2 p-2 bg-slate-50 dark:bg-zinc-800/50 rounded border border-dashed border-slate-200 dark:border-zinc-700">
                              <div className={`whitespace-pre-line ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                                <LatexRenderer content={item.variant?.question || item.prototype_desc || "正在匹配精准题干..."} />
                              </div>
                            </div>
                            {/* 样题原型展开区 - 全景视图 */}
                            {isExpanded && (
                              <div className={`mt-2 p-3 rounded text-xs ${isAcademicMode ? 'bg-slate-100 border border-slate-300' : 'bg-zinc-800 border border-zinc-600'}`}>
                                {/* 样题原文 */}
                                <div className="mb-3">
                                  <div className="flex items-center gap-1 mb-1">
                                    <FileText className={`w-3 h-3 ${isAcademicMode ? 'text-blue-500' : 'text-blue-400'}`} />
                                    <span className={`font-medium ${isAcademicMode ? 'text-blue-600' : 'text-blue-300'}`}>
                                      【样题原文】
                                    </span>
                                  </div>
                                  <div className={`${isAcademicMode ? 'text-slate-600' : 'text-zinc-300'}`}>
                                    <LatexRenderer content={item.prototypeInfo?.originalQuestion || item.variant?.prototypeInfo?.originalQuestion || '无样题原文'} />
                                  </div>
                                </div>
                                {/* 样题解析 */}
                                <div>
                                  <div className="flex items-center gap-1 mb-1">
                                    <FileText className={`w-3 h-3 ${isAcademicMode ? 'text-green-500' : 'text-green-400'}`} />
                                    <span className={`font-medium ${isAcademicMode ? 'text-green-600' : 'text-green-300'}`}>
                                      【样题解析】
                                    </span>
                                  </div>
                                  {(() => {
                                    const analysis = item.prototypeInfo?.originalAnalysis || item.variant?.prototypeInfo?.originalAnalysis
                                    if (!analysis || analysis === '暂无解析' || analysis.trim() === '') {
                                      return (
                                        <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30">
                                          <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                                            <AlertTriangle className="w-3 h-3" />
                                            <span>【数据缺失警告】</span>
                                          </div>
                                          <p className="mt-1 text-red-500 dark:text-red-300">
                                            该母题 JSON 缺少解析基因，请联系教研重录。
                                          </p>
                                        </div>
                                      )
                                    }
                                    return (
                                      <div className={`${isAcademicMode ? 'text-slate-600' : 'text-zinc-300'}`}>
                                        <LatexRenderer content={analysis} />
                                      </div>
                                    )
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                
                {/* 意愿补位 - 始终显示 */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">🔵</span>
                    <h3 className={`text-sm font-semibold ${isAcademicMode ? 'text-blue-600' : 'text-blue-400'}`}>
                      意愿补位 ({bundle.basics.length}题)
                    </h3>
                  </div>
                  {bundle.basics.length === 0 ? (
                    <p className={`text-xs italic ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`}>
                      [暂无补位任务] —— 可手动勾选下周重点母题
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {bundle.basics.map((item, idx) => {
                        const itemKey = `basics-${idx}`
                        const isExpanded = expandedPrototype === itemKey
                        
                        return (
                          <div key={idx} className={`p-3 rounded ${item.isAIGenerated ? 'bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/30' : isAcademicMode ? 'bg-emerald-50' : 'bg-emerald-900/10'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-mono ${isAcademicMode ? 'text-slate-500' : 'text-zinc-500'}`}>
                                  {item.targetId}
                                </span>
                                {item.isAIGenerated && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
                                    🔵 教研预设
                                  </span>
                                )}
                                {item.isFromKnowledgeBase && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">
                                    🟣 知识库
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setExpandedPrototype(isExpanded ? null : itemKey)}
                                  className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors ${isAcademicMode ? 'text-slate-400 hover:text-blue-500' : 'text-zinc-500 hover:text-blue-400'}`}
                                  title="查看样题原型"
                                >
                                  <Info className="w-4 h-4" />
                                </button>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${levelColors[item.level]?.bg} ${levelColors[item.level]?.text}`}>
                                  {item.level} · {item.variantType}
                                </span>
                              </div>
                            </div>
                            <p className={`text-sm font-medium mb-2 ${isAcademicMode ? 'text-slate-800' : 'text-zinc-200'}`}>
                              {item.subName}
                            </p>
                            <div className="text-xs mt-2 p-2 bg-slate-50 dark:bg-zinc-800/50 rounded border border-dashed border-slate-200 dark:border-zinc-700">
                              <div className={`whitespace-pre-line ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                                <LatexRenderer content={item.variant?.question || item.prototype_desc || "正在匹配精准题干..."} />
                              </div>
                            </div>
                            {/* 样题原型展开区 - 全景视图 */}
                            {isExpanded && (
                              <div className={`mt-2 p-3 rounded text-xs ${isAcademicMode ? 'bg-slate-100 border border-slate-300' : 'bg-zinc-800 border border-zinc-600'}`}>
                                {/* 样题原文 */}
                                <div className="mb-3">
                                  <div className="flex items-center gap-1 mb-1">
                                    <FileText className={`w-3 h-3 ${isAcademicMode ? 'text-blue-500' : 'text-blue-400'}`} />
                                    <span className={`font-medium ${isAcademicMode ? 'text-blue-600' : 'text-blue-300'}`}>
                                      【样题原文】
                                    </span>
                                  </div>
                                  <div className={`${isAcademicMode ? 'text-slate-600' : 'text-zinc-300'}`}>
                                    <LatexRenderer content={item.prototypeInfo?.originalQuestion || item.variant?.prototypeInfo?.originalQuestion || '无样题原文'} />
                                  </div>
                                </div>
                                {/* 样题解析 */}
                                <div>
                                  <div className="flex items-center gap-1 mb-1">
                                    <FileText className={`w-3 h-3 ${isAcademicMode ? 'text-green-500' : 'text-green-400'}`} />
                                    <span className={`font-medium ${isAcademicMode ? 'text-green-600' : 'text-green-300'}`}>
                                      【样题解析】
                                    </span>
                                  </div>
                                  {(() => {
                                    const analysis = item.prototypeInfo?.originalAnalysis || item.variant?.prototypeInfo?.originalAnalysis
                                    if (!analysis || analysis === '暂无解析' || analysis.trim() === '') {
                                      return (
                                        <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30">
                                          <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                                            <AlertTriangle className="w-3 h-3" />
                                            <span>【数据缺失警告】</span>
                                          </div>
                                          <p className="mt-1 text-red-500 dark:text-red-300">
                                            该母题 JSON 缺少解析基因，请联系教研重录。
                                          </p>
                                        </div>
                                      )
                                    }
                                    return (
                                      <div className={`${isAcademicMode ? 'text-slate-600' : 'text-zinc-300'}`}>
                                        <LatexRenderer content={analysis} />
                                      </div>
                                    )
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {showMotifSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`max-w-2xl w-full mx-4 rounded-lg border ${isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-700'}`}>
              <div className="p-4 border-b border-slate-200 dark:border-zinc-700 flex items-center justify-between">
                <h3 className={`font-bold ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
                  选择下周学习重点
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {['高一', '高二', '高三'].map(g => (
                      <button
                        key={g}
                        onClick={() => setSelectorGrade(g)}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          selectorGrade === g
                            ? isAcademicMode 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-emerald-600 text-white'
                            : isAcademicMode 
                              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowMotifSelector(false)} className="p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  {availableMotifs.map(motif => {
                    const isActivated = (motif.elo || 0) >= 1001
                    const isSelected = selectedMotifs.includes(motif.id)
                    
                    return (
                      <label
                        key={motif.id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all border ${
                          !isActivated 
                            ? 'opacity-50 cursor-not-allowed' 
                            : isSelected
                              ? isAcademicMode ? 'bg-blue-50 border-blue-200 cursor-pointer' : 'bg-emerald-900/20 border-emerald-500/30 cursor-pointer'
                              : isAcademicMode ? 'bg-slate-50 hover:bg-slate-100 cursor-pointer' : 'bg-zinc-800 hover:bg-zinc-700 cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => isActivated && toggleMotif(motif.id)}
                          disabled={!isActivated}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-mono ${isActivated ? (isAcademicMode ? 'text-slate-400' : 'text-zinc-500') : 'text-slate-300'}`}>
                                {motif.id}
                              </span>
                              <span className={`text-sm font-medium ${isActivated ? (isAcademicMode ? 'text-slate-700' : 'text-zinc-300') : 'text-slate-400'}`}>
                                {motif.name}
                              </span>
                              {!isActivated && (
                                <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">未激活</span>
                              )}
                            </div>
                            <span className={`text-xs font-mono font-bold ${isActivated ? (isAcademicMode ? 'text-blue-600' : 'text-emerald-400') : 'text-slate-400'}`}>
                              ELO {motif.elo}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            {motif.hasL2 && (
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-medium ${isActivated ? (isAcademicMode ? 'text-slate-600' : 'text-zinc-400') : 'text-slate-400'}`}>L2 熟练</span>
                                <span className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(motif.l2Status)}`}></span>
                              </div>
                            )}
                            {motif.hasL3 && (
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-medium ${isActivated ? (isAcademicMode ? 'text-slate-600' : 'text-zinc-400') : 'text-slate-400'}`}>L3 迁移</span>
                                <span className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(motif.l3Status)}`}></span>
                              </div>
                            )}
                            {motif.hasL4 && (
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-medium ${isActivated ? (isAcademicMode ? 'text-slate-600' : 'text-zinc-400') : 'text-slate-400'}`}>L4 融会</span>
                                <span className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(motif.l4Status)}`}></span>
                              </div>
                            )}
                            {motif.minGrade && motif.minGrade !== '高一' && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                motif.minGrade === '高二' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-500'
                              }`}>
                                {motif.minGrade}解锁
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 dark:border-zinc-700 flex justify-end gap-2">
                <button
                  onClick={() => setShowMotifSelector(false)}
                  className={`px-4 py-2 rounded-lg text-sm ${isAcademicMode ? 'bg-slate-100 text-slate-600' : 'bg-zinc-800 text-zinc-300'}`}
                >
                  取消
                </button>
                <button
                  onClick={handleSaveMotifs}
                  className={`px-4 py-2 rounded-lg text-sm text-white ${isAcademicMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  保存 ({selectedMotifs.length})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="print-content">
        <div className="max-w-[210mm] mx-auto p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">数学无忧 · 周度练习包</h1>
            <p className="text-sm text-gray-500 mt-1">
              生成时间：{bundle ? new Date(bundle.generatedAt).toLocaleDateString('zh-CN') : ''}
            </p>
          </div>
          
          {bundle && bundle.errors.length > 0 && (
            <div className="mb-8 print:break-inside-avoid-page">
              <h2 className="text-lg font-bold mb-3 border-b pb-2">🔴 错题巩固</h2>
              {bundle.errors.map((item, idx) => (
                <div key={idx} className="mb-6 p-4 border rounded print:break-inside-avoid">
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>{item.targetId} · {item.targetName}</span>
                    <span>{item.level} · 变式{item.variantType}</span>
                  </div>
                  <p className="font-medium mb-3">{item.subName}</p>
                  <div className="text-sm whitespace-pre-line mb-4"><LatexRenderer content={item.variant?.question} /></div>
                  <div className="draft-area h-[180px] border-2 border-dashed border-gray-400 rounded bg-slate-50 p-2 mb-4">
                    <span className="text-xs text-gray-500">📝 草稿区（请在下方演算）</span>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600 print:break-before-avoid">
                    <p className="font-medium mb-1">📖 解析：</p>
                    <div className="whitespace-pre-line"><LatexRenderer content={item.variant?.analysis} /></div>
                    <p className="mt-2 font-medium">✅ 答案：{item.variant?.answer}</p>
                    {item.isAIGenerated && (
                      <p className="mt-2 text-blue-500 text-xs">[教研室预设方案]</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {bundle && bundle.bleeding.length > 0 && (
            <div className="mb-8 print:break-inside-avoid-page">
              <h2 className="text-lg font-bold mb-3 border-b pb-2">🟡 筑基强化</h2>
              {bundle.bleeding.map((item, idx) => (
                <div key={idx} className="mb-6 p-4 border rounded print:break-inside-avoid">
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>{item.targetId} · {item.targetName}</span>
                    <span>{item.level} · 变式{item.variantType}</span>
                  </div>
                  <p className="font-medium mb-3">{item.subName}</p>
                  <div className="text-sm whitespace-pre-line mb-4"><LatexRenderer content={item.variant?.question} /></div>
                  <div className="draft-area h-[180px] border-2 border-dashed border-gray-400 rounded bg-slate-50 p-2 mb-4">
                    <span className="text-xs text-gray-500">📝 草稿区（请在下方演算）</span>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600 print:break-before-avoid">
                    <p className="font-medium mb-1">📖 解析：</p>
                    <div className="whitespace-pre-line"><LatexRenderer content={item.variant?.analysis} /></div>
                    <div className="mt-2 font-medium flex items-start gap-1"><span>✅ 答案：</span><div className="flex-1"><LatexRenderer content={item.variant?.answer} /></div></div>
                    {item.isAIGenerated && (
                      <p className="mt-2 text-blue-500 text-xs">[教研室预设方案]</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {bundle && bundle.basics.length > 0 && (
            <div className="mb-8 print:break-inside-avoid-page">
              <h2 className="text-lg font-bold mb-3 border-b pb-2">🔵 意愿补位</h2>
              {bundle.basics.map((item, idx) => (
                <div key={idx} className="mb-6 p-4 border rounded print:break-inside-avoid">
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>{item.targetId} · {item.targetName}</span>
                    <span>{item.level} · 变式{item.variantType}</span>
                  </div>
                  <p className="font-medium mb-3">{item.subName}</p>
                  <div className="text-sm whitespace-pre-line mb-4"><LatexRenderer content={item.variant?.question} /></div>
                  <div className="draft-area h-[180px] border-2 border-dashed border-gray-400 rounded bg-slate-50 p-2 mb-4">
                    <span className="text-xs text-gray-500">📝 草稿区（请在下方演算）</span>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600 print:break-before-avoid">
                    <p className="font-medium mb-1">📖 解析：</p>
                    <div className="whitespace-pre-line"><LatexRenderer content={item.variant?.analysis} /></div>
                    <div className="mt-2 font-medium flex items-start gap-1"><span>✅ 答案：</span><div className="flex-1"><LatexRenderer content={item.variant?.answer} /></div></div>
                    {item.isAIGenerated && (
                      <p className="mt-2 text-blue-500 text-xs">[教研室预设方案]</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WeeklyMission
