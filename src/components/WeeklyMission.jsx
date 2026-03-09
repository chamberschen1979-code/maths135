import { useState, useContext, useMemo, useEffect } from 'react'
import { 
  Calendar, FileText, AlertTriangle, Target, CheckCircle, 
  Printer, ChevronDown, Clock, TrendingUp, BookOpen, 
  X, Plus, Trash2, Download, Sparkles, AlertCircle, Code, Info, Loader2
} from 'lucide-react'
import { ThemeContext } from '../App'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

const API_KEY = import.meta.env.VITE_QWEN_API_KEY
const BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
const MODEL_NAME = 'qwen-plus'

const MOTIF_FILES = {
  'M01': () => import('../data/M01.json'),
  'M02': () => import('../data/M02.json'),
  'M03': () => import('../data/M03.json'),
  'M04': () => import('../data/M04.json'),
  'M05': () => import('../data/M05.json'),
  'M06': () => import('../data/M06.json'),
  'M07': () => import('../data/M07.json'),
  'M08': () => import('../data/M08.json'),
  'M09': () => import('../data/M09.json'),
  'M10': () => import('../data/M10.json'),
  'M11': () => import('../data/M11.json'),
  'M12': () => import('../data/M12.json'),
  'M13': () => import('../data/M13.json'),
  'M14': () => import('../data/M14.json'),
  'M15': () => import('../data/M15.json'),
  'M16': () => import('../data/M16.json'),
  'M17': () => import('../data/M17.json'),
}

const MOTIF_NAMES = {
  'M01': '集合、逻辑与复数',
  'M02': '不等式性质',
  'M03': '函数概念与性质',
  'M04': '指对数函数与运算',
  'M05': '平面向量',
  'M06': '三角函数基础',
  'M07': '解三角形综合',
  'M08': '数列基础与求和',
  'M09': '立体几何基础',
  'M10': '解析几何基础',
  'M11': '导数工具基础',
  'M12': '概率与统计综合',
  'M13': '解析几何综合压轴',
  'M14': '导数综合压轴',
  'M15': '数列综合压轴',
  'M16': '计数原理与二项式',
  'M17': '创新思维与情境',
}

// LaTeX 渲染组件
const LatexRenderer = ({ content }) => {
  if (!content) return null
  
  // 处理双斜杠换行和真正的换行符，确保 ReactMarkdown 识别
  const processedContent = content
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\n/g, '  \n') // Markdown 换行需要两个空格
  
  return (
    <div className="latex-content">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
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

let motifDataCache = {}

const loadMotifData = async (motifId) => {
  if (motifDataCache[motifId]) {
    return motifDataCache[motifId]
  }
  
  if (MOTIF_FILES[motifId]) {
    try {
      const module = await MOTIF_FILES[motifId]()
      const data = module.default || module
      motifDataCache[motifId] = data
      console.log(`【动态加载】${motifId} 数据加载成功`)
      return data
    } catch (error) {
      console.error(`【加载失败】${motifId}:`, error)
      return null
    }
  }
  return null
}

const buildCrossFileIndex = (loadedData = {}) => {
  const index = {}
  
  Object.entries(loadedData).forEach(([motifId, data]) => {
    if (!data) return
    
    let allProblems = []
    let allPitfalls = []
    let allWeapons = []
    
    if (data.specialties) {
      data.specialties.forEach(spec => {
        if (spec.variations) {
          spec.variations.forEach(v => {
            if (v.master_benchmarks) allProblems.push(...v.master_benchmarks)
            if (v.original_pool) allProblems.push(...v.original_pool)
            
            if (v.common_pitfalls) {
              v.common_pitfalls.forEach(p => allPitfalls.push(p.description || p))
            }
            
            if (v.toolkit && v.toolkit.linked_weapons) {
              allWeapons.push(...v.toolkit.linked_weapons)
            }
          })
        }
      })
    }
    
    const entry = {
      ...data,
      id: data.motif_id || motifId,
      name: data.motif_name || MOTIF_NAMES[motifId] || "未命名母题",
      prototypeProblems: allProblems,
      commonPitfalls: [...new Set(allPitfalls)],
      toolkit: { linked_weapons: [...new Set(allWeapons)] },
      specialties: data.specialties || []
    }
    
    index[motifId] = [entry]
    console.log(`【索引构建】${entry.name}(${motifId}): 共提取 ${allProblems.length} 道试题`)
  })
  
  return index
}

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

const generateAIProblem = async (targetId, level, encounter, knowledgeEntry, isUserSelected = false, iterationIndex = 0, problemType = null, customPrompt = null, crossFileIndex = {}) => {
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
  
  // 优先从 crossFileIndex 直接提取（不依赖传入的 knowledgeEntry）
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
    if (crossFileIndex[variant] && crossFileIndex[variant].length > 0) {
      directEntry = crossFileIndex[variant][0]
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
  
  // 兼容两种格式：question 和 problem 字段
  const getQuestionText = (p) => p?.question || p?.problem || p?.content || ''
  const getAnswerText = (p) => p?.answer || p?.analysis || ''
  
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
    prototypePreview: getQuestionText(prototypeProblem).substring(0, 50) || '无',
    sourcePath: sourcePath
  })
  
  // 参数生成
  const generateParams = (diff, iterIdx = 0) => {
    const params = {}
    const constraint = diff.paramConstraint
    const randomOffset = iterIdx * 17 + Math.random() * 100
    
    // V4.1: 基于 variableKnobs.weight 的随机选择
    const variableKnobs = knowledgeData?.variableKnobs || []
    if (variableKnobs.length > 0) {
      // 计算总权重
      const totalWeight = variableKnobs.reduce((sum, knob) => sum + (knob.weight || 1), 0)
      let random = Math.random() * totalWeight
      
      // 选择一个 knob
      for (const knob of variableKnobs) {
        random -= (knob.weight || 1)
        if (random <= 0) {
          // 应用 knob 的值
          if (knob.values) {
            Object.assign(params, knob.values)
          }
          if (knob.name) {
            params._selectedKnob = knob.name
          }
          console.log(`【V4.1 旋钮选择】权重命中: ${knob.name} (weight: ${knob.weight})`)
          break
        }
      }
    }
    
    if (constraint === 'integer_or_simple_fraction') {
      params.a = params.a ?? Math.floor((Math.random() * 10 + randomOffset) % 10) + 1
      params.b = params.b ?? Math.floor((Math.random() * 10 + randomOffset * 1.5) % 10) - 5
      params.c = params.c ?? Math.floor((Math.random() * 10 + randomOffset * 2) % 10) + 2
      params.fracNum = params.fracNum ?? Math.floor((Math.random() * 9 + randomOffset) % 9) + 1
      params.fracDen = params.fracDen ?? Math.floor((Math.random() * 9 + randomOffset * 1.2) % 9) + 2
    } else {
      params.a = params.a ?? Math.floor((Math.random() * 10 + randomOffset) % 10) + 1
      params.b = params.b ?? Math.floor((Math.random() * 20 + randomOffset * 1.5) % 20) - 10
      params.c = params.c ?? Math.floor((Math.random() * 15 + randomOffset * 2) % 15) + 2
      params.alpha = params.alpha ?? Math.floor((Math.random() * 30 + randomOffset) % 30) + 30
      params.k = params.k ?? Math.floor((Math.random() * 5 + randomOffset) % 5) + 1
      params.m = params.m ?? Math.floor((Math.random() * 5 + randomOffset * 1.3) % 5) + 1
      params.n = params.n ?? Math.floor((Math.random() * 5 + randomOffset * 1.5) % 5) + 1
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
  const buildDNAProblem = async (targetId, targetName, difficulty, params, prototype, topicType, knowledgePoints, sourcePath, problemType = null, motifObj = null, iterationIndex = 0, customPrompt = null) => {
    const { tier, steps, traps, paramChanges, level } = difficulty
    
    // ============================================================
    // 熔断机制：无有效样题 DNA，严禁 AI 凭空想象
    // ============================================================
    // 兼容两种格式：question 和 problem 字段
    const getQuestionText = (p) => p?.question || p?.problem || p?.content || ''
    const getAnswerText = (p) => p?.answer || p?.analysis || ''
    
    const questionText = getQuestionText(prototype)
    if (!questionText) {
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
    
    // ============================================================
    // 【动态 Prompt 构建器】V6.0 - 支持专项对齐与序列化保护
    // ============================================================
    
    // 1. 获取上下文信息（从 motifObj 动态获取）
    const currentModuleName = motifObj?.module_name || MOTIF_NAMES[targetId] || "高中数学专项"
    const instructionTemplate = motifObj?.system_instruction_template || ""
    
    // 2. 从 motifObj 中获取专项和变例信息
    const currentSpecId = motifObj?.spec_id || ""
    const currentVarId = motifObj?.var_id || ""
    const frontendLevel = tier
    
    // 3. 【种子选择优先级】两级路由
    let benchmarkQuestions = []
    let variableKnobs = null
    let questionStyle = null
    let trapTypes = []
    
    if (motifObj?.specialties && currentSpecId && currentVarId) {
      const targetSpec = motifObj.specialties.find(s => s.spec_id === currentSpecId)
      if (targetSpec && targetSpec.variations) {
        const targetVar = targetSpec.variations.find(v => v.var_id === currentVarId)
        if (targetVar) {
          // 第一优先级: master_benchmarks (按难度过滤)
          if (targetVar.master_benchmarks) {
            benchmarkQuestions = targetVar.master_benchmarks.filter(q => q.level === frontendLevel)
          }
          
          // 第二优先级: original_pool (按难度过滤，随机选一道)
          if (benchmarkQuestions.length === 0 && targetVar.original_pool) {
            const poolMatches = targetVar.original_pool.filter(q => q.level === frontendLevel)
            if (poolMatches.length > 0) {
              const randomIndex = Math.floor(Math.random() * poolMatches.length)
              benchmarkQuestions = [{
                level: frontendLevel,
                problem: poolMatches[randomIndex].desc || poolMatches[randomIndex].problem || '',
                logic_key: poolMatches[randomIndex].logic_key || '高考真题/名校模考',
                analysis: poolMatches[randomIndex].analysis || null
              }]
              console.log(`【种子选择】从 original_pool 随机选择 ${frontendLevel} 难度题目`)
            }
          }
          
          // 提取变量旋钮
          if (targetVar.variable_knobs) {
            variableKnobs = targetVar.variable_knobs
          }
          // 提取设问风格
          if (targetVar.question_style) {
            questionStyle = targetVar.question_style
          }
          // 提取陷阱类型
          if (targetVar.trap_type) {
            trapTypes = targetVar.trap_type
          }
        }
      }
    }
    
    // 如果两级都没有找到，报错提示
    if (benchmarkQuestions.length === 0) {
      console.error(`【数据缺失】变例 ${currentVarId} 缺少 ${frontendLevel} 难度的题目，请补充 original_pool`)
    }
    
    // 4. 【序列化保护】处理 JSON 转义提示
    const rawBenchmarkJson = benchmarkQuestions.length > 0
      ? JSON.stringify(benchmarkQuestions, null, 2)
      : "无可用标杆题，请依据难度宪法自行构造。"
    
    // 5. 构建变量旋钮提示
    const variableKnobsPrompt = variableKnobs 
      ? `\n# 变量旋钮因子 (必须从中选择组合)
以下是当前变例的变量旋钮配置（JSON 格式）：
\`\`\`json
${JSON.stringify(variableKnobs, null, 2)}
\`\`\`

⚠️ **命题要求**：
- 请从上述旋钮因子中**随机选择一个组合**进行命题。
- 特别注意 \`trap_type\`（陷阱类型）的植入，确保题目具有区分度。
${trapTypes.length > 0 ? `- 可用陷阱类型：${trapTypes.join('、')}` : ''}`
      : ''
    
    // 6. 构建设问风格提示
    const questionStylePrompt = questionStyle
      ? `\n# 设问风格约束
当前变例的设问风格：**${questionStyle}**
请严格按照此风格进行设问，避免平铺直叙。`
      : ''
    
    // 7. 从母题 JSON 读取难度宪法 (Guardrails) - 动态获取
    const difficultyConstitution = motifObj?.system_instruction_template || `### 🎯 难度分级宪法 (必须严格执行)

**L2 (基础夯实)**:
- **特征**: 单步逻辑，无参数或参数为常数，无需分类讨论。
- **典型任务**: 直接代入计算、简单判断。
- **禁忌**: 禁止出现"求参数范围"、"逆向求区间"、"分类讨论"。

**L3 (能力提升)**:
- **特征**: 两步逻辑，含单参数，需简单分类讨论。
- **典型任务**: 含参讨论、恒成立求参（分离参数法）。
- **禁忌**: 禁止双重参数联动、复杂的隐零点代换。

**L4 (实战拔高)**:
- **特征**: 多步逻辑，双参数或复杂结构，需多重分类讨论或构造新函数。
- **典型任务**: 极值点偏移、隐零点问题、已知最值逆求参数。
- **核心**: 必须包含一个"思维陷阱"或"转化难点"。`
    
    // 8. 构建最终 System Prompt
    const systemPrompt = customPrompt || `# Role
你是 135+ 高中数学研究院首席命题官。你的核心专长是**新高考 I 卷（广东卷）**命题逻辑，并深度融合山东、浙江、湖北等强省的模拟题创新思维。当前任务模块：**${currentModuleName}**。

# 核心使命
基于提供的【参考标杆】(master_benchmarks) 和【变量旋钮】(variable_knobs)，生成具有**"广东灵魂 + 全国视野"**的原创题目。
- **立足广东**：严格遵循新高考 I 卷（广东卷）的命题规范、难度分布和评分标准。
- **借鉴强省**：吸收山东卷的"严谨分类讨论"、浙江卷的"指对巧妙构造"、湖北卷的"创新设问"，用于提升 L4 题目的区分度。
- **拒绝**：机械改数字、纯繁琐计算、脱离新高考考纲的偏题怪题。
- **追求**：结构识别、思想转化、隐含陷阱、分类完备性。

${difficultyConstitution}

# 参考标杆 (Few-Shot Learning)
以下是当前变例对应的标准样题（JSON 格式）：
\`\`\`json
${rawBenchmarkJson}
\`\`\`

⚠️ **重要数据格式说明 (LaTeX 序列化保护)**：
- 上述参考样题中的 LaTeX 公式因经过 JSON 序列化，可能包含双反斜杠（如 \\\\frac）。
- **你的任务**：在生成新题目时，请理解其数学含义，但输出必须使用**标准的单层反斜杠 LaTeX 格式**（如 $\\frac{1}{2}$ 应输出为 $\\frac{1}{2}$ 的原始形式，即单个反斜杠）。
- 严禁直接复制粘贴上述 JSON 中的转义字符到最终输出中。
${variableKnobsPrompt}${questionStylePrompt}

# 命题流程 (Step-by-Step)

1. **逻辑锁定 (Logic Lock)**:
   - 仔细研读【参考标杆】中的 \`logic_core\` 和 \`analysis\`。
   - **关键**: 提取其"思维链"（例如：设切点 $\\to$ 列方程 $\\to$ 转化为函数零点 $\\to$ 求极值），而非仅仅复制题目内容。

2. **变量旋钮 (Variable Knobs Activation)**:
   - **必须**从 \`variable_knobs\` 中随机组合至少 2 个维度进行变化：
     - \`function_structure\`: 强制混合指对函数或三角函数，避免单一多项式。
     - \`question_style\`: 尝试"存在性"、"探究性"或"反向求解"设问。
     - \`trap_type\`: **显式埋雷**！例如：设计一个 $a<0$ 时定义域不成立的陷阱，或一个需要检验端点 $t=1$ 是否为增根的细节。
   - **逆向验算**: 确保新数据能得出**整数**、**简洁分式**或**常见根式** (如 $\\ln 2, \\sqrt{2}$)，严禁出现无法手算的无理数。

3. **风格注入 (Style Injection)**:
   - **自检**: "这道题是否符合广东考生的备考实际？" (不能太偏)
   - **升华**: "这道题是否具备足够的区分度？" (引入山东/浙江的逻辑深度)
   - 确保题目表述符合新高考规范（如：定义域声明、区间开闭严谨性）。

4. **真实性自检 (Self-Audit)**:
   - "这道题的陷阱是否符合广东卷/强省模考的埋伏习惯？"
   - "计算量是否超过了难度宪法规定的标准？"
   - "是否触犯了难度宪法中的'禁忌'？"
   - "是否遗漏了难度宪法中的'核心考察'点？"

5. **生成输出 (JSON Generation)**:
   - 严格按照下方 JSON Schema 输出。
   - **解析要求**: \`analysis\` 字段必须包含 \`【核心思路】\` (揭示结构识别与转化逻辑) 和 \`【关键步骤】\` (展示评分关键点，特别是分类讨论的界限)。

# 强制学术约束
1. **LaTeX 规范**:
   - 所有数学符号、公式必须用 \`$\` 包裹 (如 \`$f(x)$\`, \`$x \\in \\mathbb{R}$\`)。
   - **严禁**将中文文字放入 \`$\` 中 (错误示例：\`$求 a 的范围$\` ✅ 正确：\`求 $a$ 的范围\`)。
2. **解析深度**:
   - 禁止只写计算过程。必须点破"为什么要这样分类"、"陷阱在哪里"。
   - 必须显式引用关联的武器库 ID (如 \`linked_weapons\`: ["W028", "W045"])。
3. **纯净输出**:
   - 仅输出纯 JSON 字符串。
   - **禁止** 输出 \`\`\`json 标记、Markdown 代码块或任何解释性文字。

# 输出协议 (JSON Schema)
{
  "question": "题目原文 (标准 LaTeX，包含必要的定义域提示或隐含条件)",
  "analysis": "【核心思路】... (阐述结构识别、转化思想、陷阱规避) \\n\\n【关键步骤】... (展示关键推导、分类讨论的临界点、端点检验)",
  "answer": "最终简答 (如： $ a \\in (-3, -2) $  或  $ x-y-1=0 $ )",
  "difficulty": "L2 | L3 | L4",
  "linked_weapons": ["Wxxx", "Wyyy"]
}`

    // 6. 构建 User Prompt
    const userPrompt = `【当前母题信息】
- 母题名称：${targetName}
- 战力分数：${effectiveElo}
- 知识点：${knowledgePoints.length > 0 ? knowledgePoints.join('、') : targetName}
- 难度等级：${tier} (${level})

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

【防污染指令】
严禁在解析中输出"深度复合、战力对位、步骤数、陷阱数"等系统评价标签。必须直接输出可直接打印的教研级纯净解析。`

    console.log(`【命题引擎 2.0】AI 正在深度推理: ${targetName}`, {
      prototypeDNA: getQuestionText(prototype)?.substring(0, 50) + '...',
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
      // 【清除 AI 废话】过滤思考过程、thought 标签等
      // ============================================================
      const cleanAIContent = (rawContent) => {
        let cleaned = rawContent
        
        // 1. 移除 thought 标签及其内容
        cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, '')
        cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
        
        // 2. 移除思考过程标签
        cleaned = cleaned.replace(/【思考过程】[\s\S]*?(?=【|$)/g, '')
        cleaned = cleaned.replace(/【思维链】[\s\S]*?(?=【|$)/g, '')
        cleaned = cleaned.replace(/思考过程：[\s\S]*?(?=\n\n|【|$)/g, '')
        
        // 3. 移除引导词
        cleaned = cleaned.replace(/好的，[^\n]*\n/g, '')
        cleaned = cleaned.replace(/根据您的要求[^\n]*\n/g, '')
        cleaned = cleaned.replace(/我将为您[^\n]*\n/g, '')
        cleaned = cleaned.replace(/下面是[^\n]*\n/g, '')
        cleaned = cleaned.replace(/这是一道[^\n]*\n/g, '')
        
        // 4. 移除 Markdown 代码块标记
        cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '')
        
        // 5. 移除前后空白
        cleaned = cleaned.trim()
        
        return cleaned
      }
      
      // ============================================================
      // 【大道至简】恢复纯净的 JSON 解析
      // ============================================================
      let aiResult = { question: '', analysis: '', answer: '' }
      try {
        const cleanJsonStr = cleanAIContent(aiContent)
        const parsed = JSON.parse(cleanJsonStr)
        
        aiResult.question = parsed.question || ''
        aiResult.analysis = parsed.analysis || ''
        aiResult.answer = parsed.answer || ''
        aiResult.thought = parsed.thought_process || parsed.thought || ''
        
        // ============================================================
        // 【双重清洗】提取思考过程，正文纯净化
        // ============================================================
        
        // 深度清洗函数：移除思考过程相关内容
        const deepCleanThought = (text) => {
          if (!text) return ''
          let cleaned = text
          
          // 移除 <thought> 标签及其内容
          cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, '')
          
          // 移除【思考过程】及其后的内容（直到遇到下一个【或结尾）
          cleaned = cleaned.replace(/【思考过程】[\s\S]*?(?=【|$)/g, '')
          
          // 移除【思路】及其后的内容
          cleaned = cleaned.replace(/【思路】[\s\S]*?(?=【|$)/g, '')
          
          // 移除 "思路：" 及其后的内容
          cleaned = cleaned.replace(/思路[：:][\s\S]*?(?=\n\n|【|$)/g, '')
          
          // 移除 "Thought:" 及其后的内容
          cleaned = cleaned.replace(/Thought:[\s\S]*?(?=\n\n|【|$)/gi, '')
          
          // 移除 "思考过程：" 及其后的内容
          cleaned = cleaned.replace(/思考过程[：:][\s\S]*?(?=\n\n|【|$)/g, '')
          
          // 移除系统标签
          cleaned = cleaned
            .replace(/【.*?战力.*?】\n?/g, '')
            .replace(/【深度复合.*?】\n?/g, '')
            .replace(/步骤数：.*?参数变化：.*?[0-9]处\n?/g, '')
          
          // 清理多余空白
          cleaned = cleaned
            .replace(/^[\s|]+\n?/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim()
          
          return cleaned
        }
        
        // 1. 从 question 中提取思考过程
        if (aiResult.question) {
          // 检测 <thought> 标签
          const thoughtMatch = aiResult.question.match(/<thought>([\s\S]*?)<\/thought>/i)
          if (thoughtMatch) {
            aiResult.thought = thoughtMatch[1].trim().substring(0, 400)
          }
          
          // 检测【思考过程】标签
          const thinkMatch = aiResult.question.match(/【思考过程】([\s\S]*?)(?=【|$)/)
          if (thinkMatch && !aiResult.thought) {
            aiResult.thought = thinkMatch[1].trim().substring(0, 400)
          }
          
          // 深度清洗 question
          aiResult.question = deepCleanThought(aiResult.question)
          
          // 如果 question 超过 500 字，尝试截断
          if (aiResult.question.length > 500) {
            // 寻找正文结束标记
            const endMarkers = ['【答案】', '【解答】', '答案：', '解：', '\n\n\n']
            for (const marker of endMarkers) {
              const idx = aiResult.question.indexOf(marker)
              if (idx > 100) {
                aiResult.question = aiResult.question.substring(0, idx).trim()
                break
              }
            }
            // 如果仍然超过 500 字，强制截断
            if (aiResult.question.length > 500) {
              aiResult.question = aiResult.question.substring(0, 500) + '...'
            }
          }
        }
        
        // 2. 从 analysis 中提取思考过程
        if (aiResult.analysis) {
          // 检测 <thought> 标签
          const thoughtMatch = aiResult.analysis.match(/<thought>([\s\S]*?)<\/thought>/i)
          if (thoughtMatch && !aiResult.thought) {
            aiResult.thought = thoughtMatch[1].trim().substring(0, 400)
          }
          
          // 检测【思考过程】标签
          const thinkMatch = aiResult.analysis.match(/【思考过程】([\s\S]*?)(?=【|$)/)
          if (thinkMatch && !aiResult.thought) {
            aiResult.thought = thinkMatch[1].trim().substring(0, 400)
          }
          
          // 检测【思路】标签
          const ideaMatch = aiResult.analysis.match(/【思路】([\s\S]*?)(?=【|$)/)
          if (ideaMatch && !aiResult.thought) {
            aiResult.thought = ideaMatch[1].trim().substring(0, 400)
          }
          
          // 深度清洗 analysis
          aiResult.analysis = deepCleanThought(aiResult.analysis)
          
          // 如果 analysis 超过 500 字，尝试截断
          if (aiResult.analysis.length > 500) {
            const endMarkers = ['【答案】', '【解答】', '答案：', '\n\n\n']
            for (const marker of endMarkers) {
              const idx = aiResult.analysis.indexOf(marker)
              if (idx > 100) {
                aiResult.analysis = aiResult.analysis.substring(0, idx).trim()
                break
              }
            }
            if (aiResult.analysis.length > 500) {
              aiResult.analysis = aiResult.analysis.substring(0, 500) + '...'
            }
          }
        }
        
        // 3. 限制 thought 字数
        if (aiResult.thought && aiResult.thought.length > 400) {
          aiResult.thought = aiResult.thought.substring(0, 400) + '...'
        }
        
        console.log(`【JSON 解析成功】${targetName}:`, aiResult.question?.substring(0, 50))
        if (aiResult.thought) {
          console.log(`【思考过程已提取】字数: ${aiResult.thought.length}`)
        }
        
      } catch (error) {
        console.error('【AI生成严重损坏】', error)
        aiResult = {
          question: "【AI 生成中断】由于该题目的数学推导极其复杂，超出了单次输出限制，请点击重新生成。",
          analysis: "数据截断异常：JSON Parsing Error。",
          answer: "生成失败",
          thought: ''
        }
      }
      
      // 应用代数美化过滤
      const questionText = sanitizeAlgebra(aiResult.question || getQuestionText(prototype))
      const analysisText = sanitizeAlgebra(aiResult.analysis || getAnswerText(prototype) || '请根据题目要求进行解答。')
      const answerText = sanitizeAlgebra(aiResult.answer || prototype?.answer || '答案待计算')
      
      console.log(`【最终题目】${targetName}:`, questionText.substring(0, 100))
      
      return {
        question: questionText,
        analysis: analysisText,
        answer: answerText,
        thought: aiResult.thought || '',
        isAIGenerated: true,
        aiLabel: `[135+ 战术筑基：${effectiveElo}战力对位训练]`,
        prototypeInfo: {
          targetName,
          targetId,
          originalQuestion: getQuestionText(prototype),
          originalAnalysis: getAnswerText(prototype) || '暂无解析',
          knowledgePoints: knowledgePoints.length > 0 ? knowledgePoints : [targetName]
        },
        aiPrompt: userPrompt
      }
    } catch (error) {
      console.error(`【AI 请求失败】${targetName}:`, error)
      
      // 回退到本地模式
      const questionText = sanitizeAlgebra(getQuestionText(prototype))
      const analysisText = sanitizeAlgebra(getAnswerText(prototype) || '请根据题目要求进行解答。')
      const answerText = sanitizeAlgebra(prototype?.answer || '答案待计算')
      
      return {
        question: questionText,
        analysis: `[本地模式] ${analysisText}`,
        answer: answerText,
        isAIGenerated: true,
        aiLabel: `[本地模式：${effectiveElo}战力对位]`,
        prototypeInfo: {
          targetName,
          targetId,
          originalQuestion: getQuestionText(prototype),
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
    problemType,
    knowledgeData,  // V3.1: 传递完整的 motifObj（包含 evolution_blueprint）
    iterationIndex, // V3.1: 传递迭代索引，强制错开变例方向
    customPrompt    // 传递自定义 Prompt
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

const findProblemsFromKnowledgeBase = (targetId, level, crossFileIndex = {}) => {
  const knowledgeEntry = crossFileIndex[targetId]
  
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
              analysis: `【${entry.category || entry.name}】${entry.levelScaffolding?.[`${targetLevel.toLowerCase()}_base`] || entry.levelScaffolding?.[`L${targetLevel.slice(1)}_base`] || ''}`,
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

// ============================================================
// TaskCard 组件：任务卡片（带参考例题折叠面板）
// ============================================================
const TaskCard = ({ task, isAcademicMode, CROSS_FILE_INDEX, showAnalysis = true }) => {
  const itemKey = `task-${task.motifId}-${task.source}`
  
  // 根据 source 确定徽章样式
  const getSourceBadge = () => {
    if (task.source === 'error') {
      return { 
        emoji: '🔴', 
        label: '待消灭错题', 
        bgClass: 'bg-red-100 dark:bg-red-900/20',
        textClass: 'text-red-600 dark:text-red-400',
        cardBg: isAcademicMode ? 'bg-red-50' : 'bg-red-900/10'
      }
    }
    if (task.source === 'active') {
      return { 
        emoji: '🔵', 
        label: '本周主攻目标', 
        bgClass: 'bg-blue-100 dark:bg-blue-900/20',
        textClass: 'text-blue-600 dark:text-blue-400',
        cardBg: isAcademicMode ? 'bg-blue-50' : 'bg-blue-900/10'
      }
    }
    if (task.source === 'bottom_elo') {
      return { 
        emoji: '🟠', 
        label: '短板智能兜底', 
        bgClass: 'bg-orange-100 dark:bg-orange-900/20',
        textClass: 'text-orange-600 dark:text-orange-400',
        cardBg: isAcademicMode ? 'bg-orange-50' : 'bg-orange-900/10'
      }
    }
    return { 
      emoji: '⚪', 
      label: '未知来源', 
      bgClass: 'bg-slate-100 dark:bg-zinc-800',
      textClass: 'text-slate-600 dark:text-zinc-400',
      cardBg: isAcademicMode ? 'bg-slate-50' : 'bg-zinc-800/50'
    }
  }
  
  const badge = getSourceBadge()
  
  // 获取参考样题（根据 targetLevel 自动匹配）
  const getPreviewProblem = () => {
    // 兼容两种字段名：motifId/targetId, targetLevel/level
    const motifId = task.motifId || task.targetId
    const targetLevel = task.targetLevel || task.level
    
    const knowledgeDataArray = CROSS_FILE_INDEX[motifId]
    if (!knowledgeDataArray || knowledgeDataArray.length === 0) {
      console.log('【getPreviewProblem】未找到知识数据', motifId)
      return null
    }
    
    // 取第一个元素
    const knowledgeData = knowledgeDataArray[0]
    console.log('【getPreviewProblem】', { 
      motifId, 
      targetLevel, 
      hasSpecialties: !!knowledgeData.specialties,
      specialtiesLength: knowledgeData.specialties?.length 
    })
    
    // 从 specialties -> variations -> master_benchmarks 中获取样题
    const specialties = knowledgeData.specialties || []
    for (const spec of specialties) {
      const variations = spec.variations || []
      for (const v of variations) {
        const benchmarks = v.master_benchmarks || []
        // 根据 targetLevel 过滤
        const targetBenchmark = benchmarks.find(b => b.level === targetLevel)
        if (targetBenchmark) {
          console.log('【找到样题】', { specName: spec.spec_name, varName: v.name, level: targetLevel })
          return {
            specName: spec.spec_name || '',
            varName: v.name || '',
            level: targetLevel,
            question: targetBenchmark.problem || targetBenchmark.question,
            logicKey: targetBenchmark.logic_key || '标准解题流程',
            analysis: targetBenchmark.analysis || null,
            coreIdea: targetBenchmark.analysis?.core_idea || v.logic_core || '标准解题流程',
            keySteps: targetBenchmark.analysis?.key_steps || [],
            commonPitfalls: targetBenchmark.analysis?.common_pitfalls || [],
            linkedWeapons: v.toolkit?.linked_weapons || []
          }
        }
      }
    }
    
    // 回退到 master_benchmarks（旧结构）
    const mb = knowledgeData.master_benchmarks || []
    const targetMB = mb.find(b => b.level === targetLevel)
    if (targetMB) {
      console.log('【找到样题(旧结构)】', { level: targetLevel })
      return {
        specName: '',
        varName: '',
        level: targetLevel,
        question: targetMB.problem || targetMB.question,
        logicKey: targetMB.logic_key || '标准解题流程',
        analysis: targetMB.analysis || null,
        coreIdea: targetMB.analysis?.core_idea || '标准解题流程',
        keySteps: targetMB.analysis?.key_steps || [],
        commonPitfalls: targetMB.analysis?.common_pitfalls || [],
        linkedWeapons: []
      }
    }
    
    // 回退到 prototypeProblems
    const prototypeProblems = knowledgeData.prototypeProblems || knowledgeData.prototype_problems || []
    if (prototypeProblems.length > 0) {
      console.log('【找到样题(prototypeProblems)】', { count: prototypeProblems.length })
      return {
        specName: '',
        varName: '',
        level: targetLevel,
        question: prototypeProblems[0].problem || prototypeProblems[0].question,
        logicKey: '标准解题流程',
        analysis: null,
        coreIdea: '标准解题流程',
        keySteps: [],
        commonPitfalls: [],
        linkedWeapons: []
      }
    }
    
    console.log('【未找到样题】', { motifId, targetLevel })
    return null
  }
  
  const previewProblem = getPreviewProblem()
  
  // 弹窗状态
  const [showPrototypeModal, setShowPrototypeModal] = useState(false)
  
  return (
    <>
      <div className={`p-3 rounded-lg border ${isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-800 border-zinc-700'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${badge.bgClass} ${badge.textClass}`}>
              {badge.emoji} {badge.label}
            </span>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${isAcademicMode ? 'bg-slate-100 text-slate-600' : 'bg-zinc-700 text-zinc-300'}`}>
              {task.motifId || task.targetId} · {task.motifName || task.targetName} - {task.targetLevel || task.level}
            </span>
            <button
              onClick={() => {
                console.log('【样题参考按钮点击】', { previewProblem: !!previewProblem, task })
                if (previewProblem) {
                  setShowPrototypeModal(true)
                }
              }}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                previewProblem 
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title={previewProblem ? "查看母题样题" : "暂无样题数据"}
            >
              <span>📖</span>
              <span>样题参考</span>
            </button>
            <span className={`text-xs px-2 py-0.5 rounded font-bold ${
              task.targetLevel === 'L4' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
              task.targetLevel === 'L3' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              攻克 {task.targetLevel}
            </span>
          </div>
        </div>
        <div className="mt-2 text-xs">
          <span className={`${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
            📌 本周目标：攻克 {task.targetLevel} 级别变例，连续3次训练正确即可通关
          </span>
        </div>
        
        {/* AI 生成的题目展示 - 只显示题干，不显示解析 */}
        {task.variant && (
          <div className={`mt-3 p-3 rounded border ${isAcademicMode ? 'bg-white border-emerald-200' : 'bg-zinc-800 border-emerald-700'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">✨</span>
              <span className={`text-xs font-bold ${isAcademicMode ? 'text-emerald-600' : 'text-emerald-400'}`}>
                AI 定制题目
              </span>
              {task.isAIGenerated && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${isAcademicMode ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400'}`}>
                  AI生成
                </span>
              )}
            </div>
            <div className={`text-sm ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
              <LatexRenderer content={task.variant.question} />
            </div>
            {/* 仅在打印预览区显示解析和答案 */}
            {showAnalysis && task.variant.analysis && (
              <div className={`mt-2 pt-2 border-t text-xs ${isAcademicMode ? 'border-slate-200 text-slate-600' : 'border-zinc-600 text-zinc-400'}`}>
                <span className="font-medium">解析：</span>
                <LatexRenderer content={task.variant.analysis} />
              </div>
            )}
            {showAnalysis && task.variant.answer && (
              <div className={`mt-1 text-xs ${isAcademicMode ? 'text-green-600' : 'text-green-400'}`}>
                <span className="font-medium">答案：</span>
                <LatexRenderer content={task.variant.answer} />
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 样题弹窗 */}
      {showPrototypeModal && previewProblem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPrototypeModal(false)}>
          <div 
            className={`max-w-3xl mx-4 rounded-lg border p-6 max-h-[85vh] overflow-y-auto ${isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-700'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* 标题区：专项名称 + 变例名称 + 难度等级 */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-lg font-bold ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
                  📖 参考母题样题
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  {previewProblem.specName && (
                    <span className={`text-xs px-2 py-0.5 rounded ${isAcademicMode ? 'bg-purple-100 text-purple-600' : 'bg-purple-900/30 text-purple-400'}`}>
                      {previewProblem.specName}
                    </span>
                  )}
                  {previewProblem.varName && (
                    <span className={`text-xs px-2 py-0.5 rounded ${isAcademicMode ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400'}`}>
                      {previewProblem.varName}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                    previewProblem.level === 'L4' ? 'bg-amber-100 text-amber-600' :
                    previewProblem.level === 'L3' ? 'bg-purple-100 text-purple-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {previewProblem.level}
                  </span>
                </div>
                {/* logic_key 渲染：一眼看穿题目本质 */}
                {previewProblem.logicKey && (
                  <div className="mt-2 mb-2 p-2 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-md">
                    <p className="text-xs font-bold text-indigo-700">
                      <span className="mr-2">🎯 [逻辑核心]</span>
                      {previewProblem.logicKey}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowPrototypeModal(false)}
                className={`p-1 rounded ${isAcademicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-800'}`}
              >
                ✕
              </button>
            </div>
            
            {/* 题目区 */}
            <div className={`p-4 rounded-lg mb-4 ${isAcademicMode ? 'bg-slate-50' : 'bg-zinc-800'}`}>
              <div className="mb-2">
                <span className={`font-medium ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                  【题目】
                </span>
              </div>
              <div className={`${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                <LatexRenderer content={previewProblem.question} />
              </div>
            </div>
            
            {/* 核心思路区：蓝色背景块 */}
            <div className={`p-4 rounded-lg mb-4 ${isAcademicMode ? 'bg-blue-50 border border-blue-200' : 'bg-blue-900/20 border border-blue-700'}`}>
              <div className="mb-2">
                <span className={`font-medium ${isAcademicMode ? 'text-blue-700' : 'text-blue-400'}`}>
                  💡 核心思路
                </span>
              </div>
              <div className={`${isAcademicMode ? 'text-blue-800' : 'text-blue-300'}`}>
                <LatexRenderer content={previewProblem.coreIdea} />
              </div>
            </div>
            
            {/* 解析步骤：数字编号列表 */}
            {previewProblem.keySteps && previewProblem.keySteps.length > 0 && (
              <div className={`p-4 rounded-lg mb-4 ${isAcademicMode ? 'bg-slate-50' : 'bg-zinc-800'}`}>
                <div className="mb-2">
                  <span className={`font-medium ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                    📝 解析步骤
                  </span>
                </div>
                <ol className={`list-decimal list-inside space-y-2 ${isAcademicMode ? 'text-slate-600' : 'text-zinc-400'}`}>
                  {previewProblem.keySteps.map((step, idx) => (
                    <li key={idx} className="text-sm">
                      <LatexRenderer content={step} />
                    </li>
                  ))}
                </ol>
              </div>
            )}
            
            {/* 避坑指南：橙色背景块 */}
            {previewProblem.commonPitfalls && previewProblem.commonPitfalls.length > 0 && (
              <div className={`p-4 rounded-lg mb-4 ${isAcademicMode ? 'bg-amber-50 border border-amber-200' : 'bg-amber-900/20 border border-amber-700'}`}>
                <div className="mb-2">
                  <span className={`font-medium ${isAcademicMode ? 'text-amber-700' : 'text-amber-400'}`}>
                    ⚠️ 避坑指南
                  </span>
                </div>
                <ul className={`space-y-2 ${isAcademicMode ? 'text-amber-700' : 'text-amber-300'}`}>
                  {previewProblem.commonPitfalls.map((pitfall, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span>⚠️</span>
                      <LatexRenderer content={pitfall} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* 核心方法与公式：Badge 按钮 */}
            {previewProblem.linkedWeapons && previewProblem.linkedWeapons.length > 0 && (
              <div className={`p-4 rounded-lg ${isAcademicMode ? 'bg-slate-50' : 'bg-zinc-800'}`}>
                <div className="mb-2">
                  <span className={`font-medium ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                    🔧 核心方法与公式
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {previewProblem.linkedWeapons.map((weapon, idx) => {
                    // 武器代码到中文名称的映射
                    const weaponNames = {
                      'W028': '求导法则',
                      'W031': '公切线模型',
                      'W033': '高次方程试根法',
                      'W035': '含参不等式',
                      'W039': '切线方程综合',
                      'W040': '方程组消元',
                      'W041': '分类讨论思想',
                      'W042': '数形结合',
                      'W043': '逆向思维'
                    }
                    const weaponName = weaponNames[weapon] || weapon
                    return (
                      <button
                        key={idx}
                        onClick={() => console.log(`[Link Weapon]: ${weapon} - ${weaponName}`)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isAcademicMode 
                            ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' 
                            : 'bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50'
                        }`}
                      >
                        {weaponName}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
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
  
  const [loadedMotifData, setLoadedMotifData] = useState({})
  
  const CROSS_FILE_INDEX = useMemo(() => {
    return buildCrossFileIndex(loadedMotifData)
  }, [loadedMotifData])
  
  useEffect(() => {
    const loadRequiredMotifs = async () => {
      const requiredMotifs = new Set()
      
      tacticalData?.tactical_maps?.forEach(map => {
        map.encounters.forEach(e => {
          if (e.grades?.includes(currentGrade)) {
            requiredMotifs.add(e.target_id)
          }
        })
      })
      
      weeklyPlan?.activeMotifs?.forEach(motifId => {
        requiredMotifs.add(motifId)
      })
      
      errorNotebook?.forEach(e => {
        if (!e.resolved && e.targetId) {
          requiredMotifs.add(e.targetId)
        }
      })
      
      const newLoadedData = { ...loadedMotifData }
      let hasNewData = false
      
      for (const motifId of requiredMotifs) {
        if (!newLoadedData[motifId]) {
          const data = await loadMotifData(motifId)
          if (data) {
            newLoadedData[motifId] = data
            hasNewData = true
          }
        }
      }
      
      if (hasNewData) {
        setLoadedMotifData(newLoadedData)
      }
    }
    
    loadRequiredMotifs()
  }, [tacticalData, currentGrade, weeklyPlan?.activeMotifs, errorNotebook])
  
  const [bundle, setBundle] = useState(() => {
    try {
      const saved = localStorage.getItem('weeklyMissionBundle')
      if (saved) {
        const parsed = JSON.parse(saved)
        // 检查是否是今天生成的（超过24小时则清除）
        const generatedAt = new Date(parsed.generatedAt).getTime()
        const now = Date.now()
        const hoursDiff = (now - generatedAt) / (1000 * 60 * 60)
        if (hoursDiff < 24) {
          console.log('【恢复 bundle 状态】从 localStorage 恢复')
          return parsed
        } else {
          console.log('【清除过期 bundle】超过24小时')
          localStorage.removeItem('weeklyMissionBundle')
        }
      }
    } catch (e) {
      console.error('【恢复 bundle 失败】', e)
    }
    return null
  })
  
  const [generating, setGenerating] = useState(false)
  const [selectorGrade, setSelectorGrade] = useState(currentGrade)
  const [verificationState, setVerificationState] = useState({})
  const [uploadedImages, setUploadedImages] = useState({})
  const [showPromptEditor, setShowPromptEditor] = useState(false)
  const [expandedPrototype, setExpandedPrototype] = useState(null)
  
  // 保存 bundle 到 localStorage
  useEffect(() => {
    if (bundle) {
      try {
        localStorage.setItem('weeklyMissionBundle', JSON.stringify(bundle))
        console.log('【保存 bundle 到 localStorage】')
      } catch (e) {
        console.error('【保存 bundle 失败】', e)
      }
    } else {
      localStorage.removeItem('weeklyMissionBundle')
      console.log('【清除 bundle 从 localStorage】')
    }
  }, [bundle])
  
  const [systemPrompt, setSystemPrompt] = useState(`# Role
你是 135+ 高中数学研究院首席命题官。你的核心专长是**新高考 I 卷（广东卷）**命题逻辑，并深度融合山东、浙江、湖北等强省的模拟题创新思维。当前任务模块：**高中数学专项**。

# 核心使命
基于提供的【参考标杆】(master_benchmarks) 和【变量旋钮】(variable_knobs)，生成具有**"广东灵魂 + 全国视野"**的原创题目。
- **立足广东**：严格遵循新高考 I 卷（广东卷）的命题规范、难度分布和评分标准。
- **借鉴强省**：吸收山东卷的"严谨分类讨论"、浙江卷的"指对巧妙构造"、湖北卷的"创新设问"，用于提升 L4 题目的区分度。
- **拒绝**：机械改数字、纯繁琐计算、脱离新高考考纲的偏题怪题。
- **追求**：结构识别、思想转化、隐含陷阱、分类完备性。

# 🎯 难度分级宪法 (必须严格执行)

## L2 (基础夯实 - 广东卷 T1/T2 风格)
- **特征**: 单步逻辑，概念清晰，无参数或参数为常数。
- **核心考察**: 定义域优先意识、导数公式准确性、切线方程规范书写。
- **典型任务**: "在点处"求切线、无参单调区间、简单极值。
- **禁忌**: 禁止出现参数讨论、逆向求参、复杂代数变形。
- **风格**: **广东卷基础题风格**——入口宽、计算量适中、重规范。

## L3 (能力提升 - 广东卷 T7/T8 或 T21(1) 风格)
- **特征**: 两步逻辑，含单参数，需简单分类（如 $a \\le 0$ vs $a > 0$）。
- **核心考察**: "过点"与"在点"的区别、分离参数法、基本二次型讨论。
- **典型任务**: "过定点"求切线、单参单调性讨论、恒成立求参（分离后易求最值）。
- **禁忌**: 禁止双重参数、隐零点、复杂放缩。
- **风格**: **广东卷中档题风格**——模型标准、思路清晰、强调通性通法。

## L4 (实战拔高 - 融合强省特色的压轴题)
- **特征**: 多步逻辑，结构复杂，需多重分类或构造新函数。
- **核心考察**:
  1. **转化思想**: 几何问题 (切线条数) $\\to$ 代数问题 (零点分布)。
  2. **完备性**: 二次型导数的"判别式 - 对称轴 - 定义域"三维讨论 (**山东卷特色**)。
  3. **构造能力**: 指对同构、特殊关系代换 (**浙江卷特色**)。
  4. **陷阱识别**: 隐含定义域、端点效应、参数对开口方向的影响。
- **典型任务**: 公切线 (异点)、切线条数反推参数、已知最值逆求参 (需讨论极值点位置)。
- **风格**: **以广东卷为底色**（不偏不怪），**注入强省深度**（逻辑更密、陷阱更深），对标新高考 I 卷 T21/T22 的高区分度要求。

# 命题流程 (Step-by-Step)

1. **逻辑锁定 (Logic Lock)**:
   - 仔细研读【参考标杆】中的 \`logic_core\` 和 \`analysis\`。
   - **关键**: 提取其"思维链"（例如：设切点 $\\to$ 列方程 $\\to$ 转化为函数零点 $\\to$ 求极值），而非仅仅复制题目内容。

2. **变量旋钮 (Variable Knobs Activation)**:
   - **必须**从 \`variable_knobs\` 中随机组合至少 2 个维度进行变化：
     - \`function_structure\`: 强制混合指对函数或三角函数，避免单一多项式。
     - \`question_style\`: 尝试"存在性"、"探究性"或"反向求解"设问。
     - \`trap_type\`: **显式埋雷**！例如：设计一个 $a<0$ 时定义域不成立的陷阱，或一个需要检验端点 $t=1$ 是否为增根的细节。
   - **逆向验算**: 确保新数据能得出**整数**、**简洁分式**或**常见根式** (如 $\\ln 2, \\sqrt{2}$)，严禁出现无法手算的无理数。

3. **风格注入 (Style Injection)**:
   - **自检**: "这道题是否符合广东考生的备考实际？" (不能太偏)
   - **升华**: "这道题是否具备足够的区分度？" (引入山东/浙江的逻辑深度)
   - 确保题目表述符合新高考规范（如：定义域声明、区间开闭严谨性）。

4. **生成输出 (JSON Generation)**:
   - 严格按照下方 JSON Schema 输出。
   - **解析要求**: \`analysis\` 字段必须包含 \`【核心思路】\` (揭示结构识别与转化逻辑) 和 \`【关键步骤】\` (展示评分关键点，特别是分类讨论的界限)。

# 强制学术约束
1. **LaTeX 规范**:
   - 所有数学符号、公式必须用 \`$\` 包裹 (如 \`$f(x)$\`, \`$x \\in \\mathbb{R}$\`)。
   - **严禁**将中文文字放入 \`$\` 中 (错误示例：\`$求 a 的范围$\` ✅ 正确：\`求 $a$ 的范围\`)。
2. **解析深度**:
   - 禁止只写计算过程。必须点破"为什么要这样分类"、"陷阱在哪里"。
   - 必须显式引用关联的武器库 ID (如 \`linked_weapons\`: ["W028", "W045"])。
3. **纯净输出**:
   - 仅输出纯 JSON 字符串。
   - **禁止** 输出 \`\`\`json 标记、Markdown 代码块或任何解释性文字。

# 输出协议 (JSON Schema)
{
  "question": "题目原文 (标准 LaTeX，包含必要的定义域提示或隐含条件)",
  "analysis": "【核心思路】... (阐述结构识别、转化思想、陷阱规避) \\n\\n【关键步骤】... (展示关键推导、分类讨论的临界点、端点检验)",
  "answer": "最终简答 (如： $ a \\in (-3, -2) $  或  $ x-y-1=0 $ )",
  "difficulty": "L2 | L3 | L4",
  "linked_weapons": ["Wxxx", "Wyyy"]
}`)

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
    
    // 只累计积分 >= 1001 的母题
    const qualifiedEncounters = currentGradeEncounters.filter(e => (e.elo_score || 0) >= 1001)
    const totalElo = qualifiedEncounters.reduce((sum, e) => sum + (e.elo_score || 0), 0)
    
    return {
      newErrors: weekErrors.filter(e => !e.resolved).length,
      resolvedErrors: weekErrors.filter(e => e.resolved).length,
      totalErrors: errorNotebook.filter(e => !e.resolved).length,
      bleedingCount,
      healthyCount,
      totalElo,
      activeMotifsCount: weeklyPlan.activeMotifs.length
    }
  }, [errorNotebook, tacticalData, weeklyPlan, currentGrade])

  const availableMotifs = useMemo(() => {
    const motifs = []
    const crossFileIndex = buildCrossFileIndex(loadedMotifData)
    
    tacticalData.tactical_maps.forEach(map => {
      map.encounters.forEach(encounter => {
        const grades = encounter.grades || []
        const minGrade = grades.reduce((min, g) => 
          (gradeOrder[g] || 999) < (gradeOrder[min] || 999) ? g : min, grades[0])
        
        if (selectorGrade === '高三' || grades.includes(selectorGrade)) {
          const l2Subs = encounter.sub_targets?.filter(s => s.level_req === 'L2') || []
          const l3Subs = encounter.sub_targets?.filter(s => s.level_req === 'L3') || []
          const l4Subs = encounter.sub_targets?.filter(s => s.level_req === 'L4') || []
          
          const crossFileEntry = crossFileIndex[encounter.target_id]?.[0]
          const specialties = crossFileEntry?.specialties || []
          
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
            hasL4: l4Subs.length > 0,
            specialties,
            commonPitfalls: crossFileEntry?.commonPitfalls || [],
            toolkit: crossFileEntry?.toolkit || {}
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
        const aiProblem = await generateAIProblem(targetId, targetLevel, encounter, CROSS_FILE_INDEX[targetId], isUserSelected, iterationIndex, null, null, CROSS_FILE_INDEX)
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
            const aiProblem = await generateAIProblem(targetId, targetLevel, encounter, CROSS_FILE_INDEX[targetId], isUserSelected, iterationIndex, null, null, CROSS_FILE_INDEX)
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
    
    const knowledgeProblems = findProblemsFromKnowledgeBase(targetId, targetLevel, CROSS_FILE_INDEX)
    if (knowledgeProblems && knowledgeProblems.length > 0) {
      const shuffledProbs = [...knowledgeProblems].sort(() => Math.random() - 0.5)
      
      // 筑基环节：使用 iterationIndex 选择知识库题目
      if (forceGenerate) {
        // 如果索引超出知识库题目数量，强制调用 AI 生成
        if (iterationIndex >= shuffledProbs.length) {
          const aiProblem = await generateAIProblem(targetId, targetLevel, encounter, CROSS_FILE_INDEX[targetId], isUserSelected, iterationIndex, null, null, CROSS_FILE_INDEX)
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
      const aiProblem = await generateAIProblem(targetId, targetLevel, encounter, CROSS_FILE_INDEX[targetId], isUserSelected, iterationIndex, null, null, CROSS_FILE_INDEX)
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
    
    const aiProblem = await generateAIProblem(targetId, targetLevel, encounter, CROSS_FILE_INDEX[targetId], isUserSelected, iterationIndex, null, null, CROSS_FILE_INDEX)
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
    
    console.log('【开始生成】handleGenerateBundle 启动 - V2.0 战力分层算法')
    
    // ============================================================
    // V2.0 任务选择算法：三级优先级漏斗
    // ============================================================
    
    // 辅助函数：根据 Elo 判断当前需要攻克的等级
    const getTargetLevel = (elo) => {
      if (elo >= 3000) return null // 满级通关，不需要再练
      if (elo >= 2500) return 'L4'
      if (elo >= 1800) return 'L3'
      if (elo >= 1001) return 'L2'
      return null // 未激活
    }
    
    // 获取全局所有的 encounters 平铺列表
    const allEncounters = tacticalData.tactical_maps.flatMap(map => map.encounters)
    
    const selectedMotifs = []
    const addedMotifIds = new Set()
    
    // ==========================================
    // 优先级 1：优先错题所在领域 (未解决的错题)
    // ==========================================
    const unresolvedErrors = errorNotebook.filter(e => !e.resolved)
    unresolvedErrors.forEach(error => {
      const motifId = error.targetId
      if (!addedMotifIds.has(motifId)) {
        const encounter = allEncounters.find(e => e.target_id === motifId)
        if (encounter) {
          const targetLevel = getTargetLevel(encounter.elo_score || 500)
          if (targetLevel) {
            selectedMotifs.push({
              motifId: encounter.target_id,
              motifName: encounter.target_name,
              targetLevel: targetLevel,
              source: 'error',
              elo: encounter.elo_score || 500
            })
            addedMotifIds.add(motifId)
          }
        }
      }
    })
    
    // ==========================================
    // 优先级 2：勾选的母题 (必须 elo >= 1001 且未通关)
    // ==========================================
    ;(weeklyPlan.activeMotifs || []).forEach(motifId => {
      if (!addedMotifIds.has(motifId)) {
        const encounter = allEncounters.find(e => e.target_id === motifId)
        if (encounter) {
          const elo = encounter.elo_score || 500
          const targetLevel = getTargetLevel(elo)
          if (elo >= 1001 && targetLevel) {
            selectedMotifs.push({
              motifId: encounter.target_id,
              motifName: encounter.target_name,
              targetLevel: targetLevel,
              source: 'active',
              elo: elo
            })
            addedMotifIds.add(motifId)
          }
        }
      }
    })
    
    // ==========================================
    // 优先级 3：底分兜底 (激活过 elo >= 1001，选最低的 2 个)
    // ==========================================
    const availableForBottom = allEncounters
      .filter(e => !addedMotifIds.has(e.target_id))
      .filter(e => (e.elo_score || 500) >= 1001 && getTargetLevel(e.elo_score || 500) !== null)
      .sort((a, b) => (a.elo_score || 500) - (b.elo_score || 500))
      .slice(0, 2) // 取最低的 2 个
    
    availableForBottom.forEach(encounter => {
      selectedMotifs.push({
        motifId: encounter.target_id,
        motifName: encounter.target_name,
        targetLevel: getTargetLevel(encounter.elo_score || 500),
        source: 'bottom_elo',
        elo: encounter.elo_score || 500
      })
      addedMotifIds.add(encounter.target_id)
    })
    
    console.log(`【任务选择完成】共选择 ${selectedMotifs.length} 个母题`)
    
    if (selectedMotifs.length === 0) {
      console.log('【无任务】请先在初始化面板激活母题或导入错题')
      setBundle({ tasks: [], generatedAt: new Date().toISOString() })
      setGenerating(false)
      return
    }
    
    // 获取全局所有的 encounters Map，方便查询
    const allEncountersMap = new Map()
    for (const map of tacticalData.tactical_maps) {
      for (const encounter of map.encounters) {
        allEncountersMap.set(encounter.target_id, encounter)
      }
    }
    
    // ============================================================
    // V2.0 战力分层算法：根据 Elo 决定出题数量和难度分布
    // ============================================================
    const problemPromises = []
    
    for (const task of selectedMotifs) {
      const encounter = allEncountersMap.get(task.motifId)
      if (!encounter) {
        console.log(`【跳过】${task.motifId} 未找到 encounter`)
        continue
      }
      
      const elo = task.elo
      const targetLevel = task.targetLevel
      const source = task.source
      
      console.log(`【战力分层】${task.motifName} Elo: ${elo} 目标等级: ${targetLevel} 来源: ${source}`)
      
      // ============================================================
      // 战力分层规则：
      // - Elo < 1800: 全部 L2（3道）
      // - 1801 <= Elo < 2500: 1道L2 + 2道L3
      // - Elo >= 2501: 1道L2/L3回顾 + 1道L4挑战 + 1道跨专项综合题
      // ============================================================
      
      if (elo < 1800) {
        // 全部 L2（3道）
        for (let i = 0; i < 3; i++) {
          problemPromises.push(
            generateAIProblem(task.motifId, 'L2', encounter, CROSS_FILE_INDEX[task.motifId], source === 'active', i, null, systemPrompt, CROSS_FILE_INDEX)
              .then(problem => {
                if (problem) {
                  return {
                    targetId: task.motifId,
                    targetName: task.motifName,
                    subId: `${task.motifId}_L2_${i}_${Date.now()}`,
                    subName: `${task.motifName} - L2练习`,
                    level: 'L2',
                    variant: problem,
                    variantType: 'S',
                    source,
                    isAIGenerated: true,
                    aiLabel: problem.aiLabel,
                    prototypeInfo: problem.prototypeInfo
                  }
                }
                return null
              })
          )
        }
      } else if (elo >= 1800 && elo < 2500) {
        // 1道L2 + 2道L3
        problemPromises.push(
          generateAIProblem(task.motifId, 'L2', encounter, CROSS_FILE_INDEX[task.motifId], source === 'active', 0, null, systemPrompt, CROSS_FILE_INDEX)
            .then(problem => {
              if (problem) {
                return {
                  targetId: task.motifId,
                  targetName: task.motifName,
                  subId: `${task.motifId}_L2_0_${Date.now()}`,
                  subName: `${task.motifName} - L2回顾`,
                  level: 'L2',
                  variant: problem,
                  variantType: 'S',
                  source,
                  isAIGenerated: true,
                  aiLabel: problem.aiLabel,
                  prototypeInfo: problem.prototypeInfo
                }
              }
              return null
            })
        )
        
        for (let i = 0; i < 2; i++) {
          problemPromises.push(
            generateAIProblem(task.motifId, 'L3', encounter, CROSS_FILE_INDEX[task.motifId], source === 'active', i + 1, null, systemPrompt, CROSS_FILE_INDEX)
              .then(problem => {
                if (problem) {
                  return {
                    targetId: task.motifId,
                    targetName: task.motifName,
                    subId: `${task.motifId}_L3_${i}_${Date.now()}`,
                    subName: `${task.motifName} - L3进阶`,
                    level: 'L3',
                    variant: problem,
                    variantType: 'S',
                    source,
                    isAIGenerated: true,
                    aiLabel: problem.aiLabel,
                    prototypeInfo: problem.prototypeInfo
                  }
                }
                return null
              })
          )
        }
      } else {
        // Elo >= 2501: 1道L2/L3回顾 + 1道L4挑战 + 1道跨专项综合题
        // 第一道：L2或L3回顾
        const reviewLevel = Math.random() > 0.5 ? 'L3' : 'L2'
        problemPromises.push(
          generateAIProblem(task.motifId, reviewLevel, encounter, CROSS_FILE_INDEX[task.motifId], source === 'active', 0, null, systemPrompt, CROSS_FILE_INDEX)
            .then(problem => {
              if (problem) {
                return {
                  targetId: task.motifId,
                  targetName: task.motifName,
                  subId: `${task.motifId}_${reviewLevel}_0_${Date.now()}`,
                  subName: `${task.motifName} - ${reviewLevel}回顾`,
                  level: reviewLevel,
                  variant: problem,
                  variantType: 'S',
                  source,
                  isAIGenerated: true,
                  aiLabel: problem.aiLabel,
                  prototypeInfo: problem.prototypeInfo
                }
              }
              return null
            })
        )
        
        // 第二道：L4挑战
        problemPromises.push(
          generateAIProblem(task.motifId, 'L4', encounter, CROSS_FILE_INDEX[task.motifId], source === 'active', 1, null, systemPrompt, CROSS_FILE_INDEX)
            .then(problem => {
              if (problem) {
                return {
                  targetId: task.motifId,
                  targetName: task.motifName,
                  subId: `${task.motifId}_L4_1_${Date.now()}`,
                  subName: `${task.motifName} - L4挑战`,
                  level: 'L4',
                  variant: problem,
                  variantType: 'S',
                  source,
                  isAIGenerated: true,
                  aiLabel: problem.aiLabel,
                  prototypeInfo: problem.prototypeInfo
                }
              }
              return null
            })
        )
        
        // 第三道：跨专项综合题（使用L4难度）
        problemPromises.push(
          generateAIProblem(task.motifId, 'L4', encounter, CROSS_FILE_INDEX[task.motifId], source === 'active', 2, 'cross_specialty', systemPrompt, CROSS_FILE_INDEX)
            .then(problem => {
              if (problem) {
                return {
                  targetId: task.motifId,
                  targetName: task.motifName,
                  subId: `${task.motifId}_L4_cross_${Date.now()}`,
                  subName: `${task.motifName} - 跨专项综合`,
                  level: 'L4',
                  variant: problem,
                  variantType: 'S',
                  source,
                  isAIGenerated: true,
                  aiLabel: problem.aiLabel,
                  prototypeInfo: problem.prototypeInfo,
                  isCrossSpecialty: true
                }
              }
              return null
            })
        )
      }
    }
    
    // ============================================================
    // 并行执行所有 AI 请求
    // ============================================================
    console.log(`【并行执行】等待 ${problemPromises.length} 个 AI 请求完成...`)
    const results = await Promise.all(problemPromises)
    
    // 过滤 null 结果
    const validResults = results.filter(Boolean)
    
    console.log(`【生成完成】成功生成 ${validResults.length} 道题目`)
    
    // 创建全新 bundle 对象
    const newBundle = {
      tasks: validResults,
      generatedAt: new Date().toISOString()
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
                <div className="mt-2 font-medium">✅ 答案：<LatexRenderer content={item.variant?.answer} /></div>
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
            .hide-in-print {
              display: none !important;
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
    if (!bundle || !bundle.tasks) return []
    return bundle.tasks
  }, [bundle])

  const aiGeneratedCount = useMemo(() => {
    if (!bundle || !bundle.tasks) return 0
    return bundle.tasks.length
  }, [bundle])

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
                  <span className={`text-xs ${isAcademicMode ? 'text-blue-600' : 'text-blue-400'}`}>总积分</span>
                </div>
                <p className={`text-2xl font-bold ${isAcademicMode ? 'text-blue-600' : 'text-blue-400'}`}>
                  {weeklyStats.totalElo}
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
                  onClick={() => setSystemPrompt(`# Role
你是 135+ 高中数学研究院首席命题官。你的核心专长是**新高考 I 卷（广东卷）**命题逻辑，并深度融合山东、浙江、湖北等强省的模拟题创新思维。当前任务模块：**高中数学专项**。

# 核心使命
基于提供的【参考标杆】(master_benchmarks) 和【变量旋钮】(variable_knobs)，生成具有**"广东灵魂 + 全国视野"**的原创题目。
- **立足广东**：严格遵循新高考 I 卷（广东卷）的命题规范、难度分布和评分标准。
- **借鉴强省**：吸收山东卷的"严谨分类讨论"、浙江卷的"指对巧妙构造"、湖北卷的"创新设问"，用于提升 L4 题目的区分度。
- **拒绝**：机械改数字、纯繁琐计算、脱离新高考考纲的偏题怪题。
- **追求**：结构识别、思想转化、隐含陷阱、分类完备性。

# 🎯 难度分级宪法 (必须严格执行)

## L2 (基础夯实 - 广东卷 T1/T2 风格)
- **特征**: 单步逻辑，概念清晰，无参数或参数为常数。
- **核心考察**: 定义域优先意识、导数公式准确性、切线方程规范书写。
- **典型任务**: "在点处"求切线、无参单调区间、简单极值。
- **禁忌**: 禁止出现参数讨论、逆向求参、复杂代数变形。
- **风格**: **广东卷基础题风格**——入口宽、计算量适中、重规范。

## L3 (能力提升 - 广东卷 T7/T8 或 T21(1) 风格)
- **特征**: 两步逻辑，含单参数，需简单分类（如 $a \\le 0$ vs $a > 0$）。
- **核心考察**: "过点"与"在点"的区别、分离参数法、基本二次型讨论。
- **典型任务**: "过定点"求切线、单参单调性讨论、恒成立求参（分离后易求最值）。
- **禁忌**: 禁止双重参数、隐零点、复杂放缩。
- **风格**: **广东卷中档题风格**——模型标准、思路清晰、强调通性通法。

## L4 (实战拔高 - 融合强省特色的压轴题)
- **特征**: 多步逻辑，结构复杂，需多重分类或构造新函数。
- **核心考察**:
  1. **转化思想**: 几何问题 (切线条数) $\\to$ 代数问题 (零点分布)。
  2. **完备性**: 二次型导数的"判别式 - 对称轴 - 定义域"三维讨论 (**山东卷特色**)。
  3. **构造能力**: 指对同构、特殊关系代换 (**浙江卷特色**)。
  4. **陷阱识别**: 隐含定义域、端点效应、参数对开口方向的影响。
- **典型任务**: 公切线 (异点)、切线条数反推参数、已知最值逆求参 (需讨论极值点位置)。
- **风格**: **以广东卷为底色**（不偏不怪），**注入强省深度**（逻辑更密、陷阱更深），对标新高考 I 卷 T21/T22 的高区分度要求。

# 命题流程 (Step-by-Step)

1. **逻辑锁定 (Logic Lock)**:
   - 仔细研读【参考标杆】中的 \`logic_core\` 和 \`analysis\`。
   - **关键**: 提取其"思维链"（例如：设切点 $\\to$ 列方程 $\\to$ 转化为函数零点 $\\to$ 求极值），而非仅仅复制题目内容。

2. **变量旋钮 (Variable Knobs Activation)**:
   - **必须**从 \`variable_knobs\` 中随机组合至少 2 个维度进行变化：
     - \`function_structure\`: 强制混合指对函数或三角函数，避免单一多项式。
     - \`question_style\`: 尝试"存在性"、"探究性"或"反向求解"设问。
     - \`trap_type\`: **显式埋雷**！例如：设计一个 $a<0$ 时定义域不成立的陷阱，或一个需要检验端点 $t=1$ 是否为增根的细节。
   - **逆向验算**: 确保新数据能得出**整数**、**简洁分式**或**常见根式** (如 $\\ln 2, \\sqrt{2}$)，严禁出现无法手算的无理数。

3. **风格注入 (Style Injection)**:
   - **自检**: "这道题是否符合广东考生的备考实际？" (不能太偏)
   - **升华**: "这道题是否具备足够的区分度？" (引入山东/浙江的逻辑深度)
   - 确保题目表述符合新高考规范（如：定义域声明、区间开闭严谨性）。

4. **生成输出 (JSON Generation)**:
   - 严格按照下方 JSON Schema 输出。
   - **解析要求**: \`analysis\` 字段必须包含 \`【核心思路】\` (揭示结构识别与转化逻辑) 和 \`【关键步骤】\` (展示评分关键点，特别是分类讨论的界限)。

# 强制学术约束
1. **LaTeX 规范**:
   - 所有数学符号、公式必须用 \`$\` 包裹 (如 \`$f(x)$\`, \`$x \\in \\mathbb{R}$\`)。
   - **严禁**将中文文字放入 \`$\` 中 (错误示例：\`$求 a 的范围$\` ✅ 正确：\`求 $a$ 的范围\`)。
2. **解析深度**:
   - 禁止只写计算过程。必须点破"为什么要这样分类"、"陷阱在哪里"。
   - 必须显式引用关联的武器库 ID (如 \`linked_weapons\`: ["W028", "W045"])。
3. **纯净输出**:
   - 仅输出纯 JSON 字符串。
   - **禁止** 输出 \`\`\`json 标记、Markdown 代码块或任何解释性文字。

# 输出协议 (JSON Schema)
{
  "question": "题目原文 (标准 LaTeX，包含必要的定义域提示或隐含条件)",
  "analysis": "【核心思路】... (阐述结构识别、转化思想、陷阱规避) \\n\\n【关键步骤】... (展示关键推导、分类讨论的临界点、端点检验)",
  "answer": "最终简答 (如： $ a \\in (-3, -2) $  或  $ x-y-1=0 $ )",
  "difficulty": "L2 | L3 | L4",
  "linked_weapons": ["Wxxx", "Wyyy"]
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
              
            </div>
          )}
        </section>

        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className={`w-4 h-4 ${isAcademicMode ? 'text-blue-600' : 'text-emerald-500'}`} />
              <h2 className={`text-sm font-semibold uppercase tracking-wider ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                下周训练内容
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
          ) : (
            <div className="space-y-4">
              {/* 🔴 错题专项训练区域 */}
              {bundle.tasks.filter(t => t.source === 'error').length > 0 && (
                <div className={`rounded-lg border ${isAcademicMode ? 'bg-white border-red-200' : 'bg-zinc-900 border-red-500/30'}`}>
                  <div className={`p-4 border-b ${isAcademicMode ? 'border-red-100 bg-red-50' : 'border-red-500/30 bg-red-900/10'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔴</span>
                      <h3 className={`text-base font-bold ${isAcademicMode ? 'text-red-700' : 'text-red-400'}`}>
                        错题专项训练
                      </h3>
                      <span className={`text-xs ${isAcademicMode ? 'text-red-500' : 'text-red-400/70'}`}>
                        ({bundle.tasks.filter(t => t.source === 'error').length}个母题)
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${isAcademicMode ? 'text-red-500' : 'text-red-400/70'}`}>
                      针对本周录入的错题进行专项强化
                    </p>
                  </div>
                  <div className="p-4 space-y-4">
                    {bundle.tasks.filter(t => t.source === 'error').map((task, idx) => (
                      <TaskCard key={`error-${idx}`} task={task} isAcademicMode={isAcademicMode} CROSS_FILE_INDEX={CROSS_FILE_INDEX} showAnalysis={false} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* 🔵 自主强化练习区域 */}
              {bundle.tasks.filter(t => t.source === 'active').length > 0 && (
                <div className={`rounded-lg border ${isAcademicMode ? 'bg-white border-blue-200' : 'bg-zinc-900 border-blue-500/30'}`}>
                  <div className={`p-4 border-b ${isAcademicMode ? 'border-blue-100 bg-blue-50' : 'border-blue-500/30 bg-blue-900/10'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔵</span>
                      <h3 className={`text-base font-bold ${isAcademicMode ? 'text-blue-700' : 'text-blue-400'}`}>
                        自主强化练习
                      </h3>
                      <span className={`text-xs ${isAcademicMode ? 'text-blue-500' : 'text-blue-400/70'}`}>
                        ({bundle.tasks.filter(t => t.source === 'active').length}个母题)
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${isAcademicMode ? 'text-blue-500' : 'text-blue-400/70'}`}>
                      您勾选的本周重点攻克目标
                    </p>
                  </div>
                  <div className="p-4 space-y-4">
                    {bundle.tasks.filter(t => t.source === 'active').map((task, idx) => (
                      <TaskCard key={`active-${idx}`} task={task} isAcademicMode={isAcademicMode} CROSS_FILE_INDEX={CROSS_FILE_INDEX} showAnalysis={false} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* 🟠 智能推荐强化区域 */}
              {bundle.tasks.filter(t => t.source === 'bottom_elo').length > 0 && (
                <div className={`rounded-lg border ${isAcademicMode ? 'bg-white border-black' : 'bg-zinc-900 border-zinc-700'}`}>
                  <div className={`p-4 border-b ${isAcademicMode ? 'border-black bg-orange-50' : 'border-zinc-700 bg-orange-900/10'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🟠</span>
                      <h3 className={`text-base font-bold ${isAcademicMode ? 'text-orange-700' : 'text-orange-400'}`}>
                        智能推荐强化
                      </h3>
                      <span className={`text-xs ${isAcademicMode ? 'text-orange-500' : 'text-orange-400/70'}`}>
                        ({bundle.tasks.filter(t => t.source === 'bottom_elo').length}个母题)
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${isAcademicMode ? 'text-orange-500' : 'text-orange-400/70'}`}>
                      系统根据 Elo 分数智能推荐的短板补强
                    </p>
                  </div>
                  <div className="p-4 space-y-4">
                    {bundle.tasks.filter(t => t.source === 'bottom_elo').map((task, idx) => (
                      <TaskCard key={`bottom-${idx}`} task={task} isAcademicMode={isAcademicMode} CROSS_FILE_INDEX={CROSS_FILE_INDEX} showAnalysis={false} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* 无任务提示 */}
              {bundle.tasks.length === 0 && (
                <div className={`rounded-lg border p-8 text-center ${isAcademicMode ? 'bg-amber-50 border-amber-200' : 'bg-amber-900/10 border-amber-500/30'}`}>
                  <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${isAcademicMode ? 'text-amber-400' : 'text-amber-500'}`} />
                  <p className={`text-sm font-medium mb-2 ${isAcademicMode ? 'text-amber-700' : 'text-amber-400'}`}>
                    当前暂无激活母题
                  </p>
                  <p className={`text-xs ${isAcademicMode ? 'text-amber-600' : 'text-amber-500/80'}`}>
                    请先前往"作战看板"开启母题练习，或在左侧手动勾选本周重点
                  </p>
                </div>
              )}
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
                          {/* 专项列表 - 简化版 */}
                          {motif.specialties && motif.specialties.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {motif.specialties.map((specialty, sIdx) => (
                                <span 
                                  key={sIdx} 
                                  className={`text-xs px-2 py-0.5 rounded ${
                                    isAcademicMode 
                                      ? 'bg-slate-100 text-slate-600' 
                                      : 'bg-zinc-700 text-zinc-300'
                                  }`}
                                >
                                  {specialty.spec_name || specialty.specialty_name || specialty.name || `专项${sIdx + 1}`}
                                </span>
                              ))}
                            </div>
                          )}
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
              {bundle?.tasks?.[0]?.targetName || '综合训练'} · 动态生成版 | 生成时间：{bundle ? new Date(bundle.generatedAt).toLocaleDateString('zh-CN') : ''}
            </p>
          </div>
          
          {bundle && bundle.tasks && bundle.tasks.length > 0 && (
            <div className="mb-8 print:break-inside-avoid-page">
              <h2 className="text-lg font-bold mb-3 border-b pb-2">📋 本周训练任务 ({bundle.tasks.length}题)</h2>
              {bundle.tasks.map((item, idx) => (
                <div key={idx} className="mb-6 p-4 border rounded print:break-inside-avoid">
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>{item.targetId} · {item.targetName}</span>
                    <span>{item.level} · {item.source === 'error' ? '🔴错题' : item.source === 'active' ? '🔵主攻' : '🟠兜底'}</span>
                  </div>
                  <p className="font-medium mb-3">{item.subName}</p>
                  <div className="text-sm whitespace-pre-line mb-4"><LatexRenderer content={item.variant?.question} /></div>
                  <div className="draft-area h-[180px] border-2 border-dashed border-gray-400 rounded bg-slate-50 p-2 mb-4">
                    <span className="text-xs text-gray-500">📝 草稿区（请在下方演算）</span>
                  </div>
                  <div className="hide-in-print mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600 print:break-before-avoid">
                    <p className="font-medium mb-1">📖 解析：</p>
                    <div className="whitespace-pre-line"><LatexRenderer content={item.variant?.analysis} /></div>
                    <div className="mt-2 font-medium">✅ 答案：<LatexRenderer content={item.variant?.answer} /></div>
                    {item.isAIGenerated && (
                      <p className="mt-2 text-blue-500 text-xs">[AI智能生成]</p>
                    )}
                    {item.commonPitfalls && item.commonPitfalls.length > 0 && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="font-medium text-amber-700 mb-2">⚠️ 易错陷阱</p>
                        <ul className="list-disc list-inside text-amber-600 text-sm space-y-1">
                          {item.commonPitfalls.map((pitfall, pIdx) => (
                            <li key={pIdx}>{pitfall}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {item.toolkit?.linked_weapons && item.toolkit.linked_weapons.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="font-medium text-blue-700 mb-2">🔧 相关公式</p>
                        <div className="flex flex-wrap gap-2">
                          {item.toolkit.linked_weapons.map((weapon, wIdx) => (
                            <span 
                              key={wIdx} 
                              className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs cursor-pointer hover:bg-blue-200 transition-colors"
                              onClick={() => console.log('跳转到公式:', weapon)}
                            >
                              {weapon}
                            </span>
                          ))}
                        </div>
                      </div>
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
