import { API_KEY, BASE_URL, VISION_MODEL_NAME } from '../constants/config'
import { enhanceDiagnosisWithKeywords } from '../utils/classificationUtils'
import { getWeaponNameById } from '../utils/weaponUtils'
import { loadMotifData } from '../utils/dataLoader'
import { buildStructurePrompt } from '../utils/motifStructureExtractor'
import { findWeaponsByMotif, matchWeaponsByKeywords } from '../utils/weaponDetailsAdapter'
import weaponDetails from '../data/weapon_details.json'

const VISION_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'

const TEXT_MODEL_NAME = 'qwen-turbo'

let diagnosisPromptCache = null

const buildDiagnosisPrompt = async () => {
  if (diagnosisPromptCache) return diagnosisPromptCache
  
  const structureInfo = await buildStructurePrompt()
  
  diagnosisPromptCache = `你是高中数学教研专家。请分析这道错题图片。

【第一步：OCR识别】
完整提取题干内容（忽略手写答案的潦草程度）

【第二步：母题定位】
根据题目内容，匹配到以下母题体系中的一个：
M01 集合、逻辑与复数, M02 不等式性质, M03 函数概念与性质, M04 指对数函数, M05 平面向量,
M06 三角函数基础, M07 解三角形综合, M08 数列基础与求和, M09 立体几何基础, M10 圆锥曲线基础,
M11 导数工具基础, M12 概率与统计, M13 解析几何压轴, M14 导数综合压轴, M15 数列综合压轴,
M16 计数原理, M17 创新思维与情境

${structureInfo}

【严格约束】
1. 母题选择：必须从上述列表的 [Mxx] 中选择一个最匹配的。
2. 专项/变例选择（极其重要！）：
   - ⚠️ 不是叫你选第一个！必须逐项阅读该母题下所有专项名称和变例名称。
   - 根据题目的实际数学内容（知识点、解法类型），选择最匹配的 specId 和 varId。
   - 举例：如果题目考"线面平行证明"→ 选包含"平行垂直证明"的变例，不选"体积表面积"。
   - 必须在选定的专项中选择存在的 varId，严禁编造不存在的 ID。
   - ⚠️ 变例名称后面的 [关键词: xxx] 是重要线索，用来辅助判断。
3. 难度评估：
   - 必须参考"支持难度"列表。
   - 如果题目看起来很难，但该变例不支持 L4，请选择该变例支持的最高难度。

【输出格式】纯JSON（无Markdown标记）：
{
  "questionText": "提取的题干内容",
  "motifId": "Mxx",
  "specId": "Vx",
  "varId": "x.x",
  "difficulty": "L2",
  "keyPoints": ["考点1", "考点2"],
  "trapType": "陷阱类型",
  "message": "诊断评语（一句话指出问题所在）"
}
其中 motifId/specId/varId 必须从上面列出的结构中选取真实存在的编号。`
  
  return diagnosisPromptCache
}

const CERTIFICATION_GRADING_PROMPT = (strategy) => {
  if (strategy?.certification?.promptSystem) {
    return strategy.certification.promptSystem + `

必须返回严格的纯 JSON 格式（不要包含任何 Markdown 标记如 \`\`\`json，不要解释），格式如下：
{
  "passed": true/false,
  "score": 0-100,
  "feedback": "具体评语，指出哪里做得好，哪里需要改进",
  "missingStep": "如果未通过，指出缺失的关键步骤"
}`;
  }
  
  return `你是一位严格的数学教练，负责评判学生是否掌握了特定的解题方法（杀手锏）。

当前考察的杀手锏是"${strategy?.name || '未知'}"。
核心逻辑是：${strategy?.logic_flow || strategy?.description || '未提供'}

请检查学生的解题过程是否显式使用了该逻辑。

必须返回严格的纯 JSON 格式（不要包含任何 Markdown 标记）：
{
  "passed": true/false,
  "score": 0-100,
  "feedback": "具体评语，指出哪里做得好，哪里需要改进",
  "missingStep": "如果未通过，指出缺失的关键步骤"
}`;
}

const WEEKLY_TASK_GEN_PROMPT = `你是一位高中数学出题专家。请识别图片中的数学题目，提取核心考点，并基于此生成一道新的变式题。

必须返回严格的纯 JSON 格式（不要包含任何 Markdown 标记）：
{
  "originalTopic": "原题考点",
  "originalDifficulty": "L1-L4",
  "newQuestion": "新题目内容（完整题目文本）",
  "newAnswer": "新题目的答案",
  "explanation": "解题思路简述"
}`

const QUESTION_GEN_PROMPT = (strategy, scenarioTag, difficultyLevel) => {
  const focusLogic = strategy?.certification?.focusLogic || strategy?.logic_flow || '核心解题步骤'
  const antiPattern = strategy?.certification?.antiPattern || '跳步或逻辑跳跃'
  
  return `你是高中数学命题专家。为杀手锏「${strategy?.name || '未知方法'}」命制一道考察「${scenarioTag}」的题目。

【核心逻辑】${strategy?.logic_flow || strategy?.description || '未提供'}

【命题要求】
1. 设计陷阱诱导学生犯「${antiPattern}」错误
2. 必须显式写出「${focusLogic}」才能正确解题
3. 难度：${difficultyLevel}

【输出格式】纯JSON，无Markdown标记：
{
  "questionText": "题目（支持LaTeX，用$包裹）",
  "answerKey": "答案（如：$a \\geq 0$）",
  "keyLogicPoint": "考点（一句话）",
  "difficulty": "${difficultyLevel}",
  "trapDescription": "陷阱（一句话）",
  "scenarioTag": "${scenarioTag}",
  "expectedSteps": ["步骤1", "步骤2"],
  "standardSolution": "解析（只写解题步骤，无思考过程）"
}`
}

const cleanSolution = (text) => {
  if (!text) return ''
  
  let cleaned = text
  
  // 移除 XML 标签包裹的内容
  cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, '')
  cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
  
  // 移除【思考过程】等标记
  cleaned = cleaned.replace(/【思考过程】[\s\S]*?(?=【|$)/g, '')
  cleaned = cleaned.replace(/【分析】[\s\S]*?(?=【|$)/g, '')
  cleaned = cleaned.replace(/【解题思路】[\s\S]*?(?=【|$)/g, '')
  
  // 移除"思考过程："、"分析："等开头的段落（直到遇到解题步骤开始）
  cleaned = cleaned.replace(/思考过程[：:][\s\S]*?(?=\n[0-9①②③④⑤⑥⑦⑧⑨⑩]|解：|证明：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/分析[：:][\s\S]*?(?=\n[0-9①②③④⑤⑥⑦⑧⑨⑩]|解：|证明：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/解题思路[：:][\s\S]*?(?=\n[0-9①②③④⑤⑥⑦⑧⑨⑩]|解：|证明：|综上|答案|$)/g, '')
  
  // 移除"——错误"、"——修正"等标记开头的段落
  cleaned = cleaned.replace(/——错误！[\s\S]*?(?=——|解：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/——修正[\s\S]*?(?=——|解：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/——矛盾[\s\S]*?(?=——|解：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/——放弃[\s\S]*?(?=——|解：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/——.*?——/g, '')
  
  // 移除"然而"、"因此最终采用"等过渡语开头的段落
  cleaned = cleaned.replace(/然而[\s\S]*?(?=解：|综上|答案|①|②|③|$)/g, '')
  cleaned = cleaned.replace(/因此最终采用[\s\S]*?(?=解：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/最终决定[\s\S]*?(?=解：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/最终采用[\s\S]*?(?=解：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/唯一办法[\s\S]*?(?=解：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/唯一合理解释[\s\S]*?(?=解：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/唯一合规方案[\s\S]*?(?=解：|综上|答案|$)/g, '')
  
  // 移除"但需检查"、"但注意"等开头的段落
  cleaned = cleaned.replace(/但需检查[\s\S]*?(?=解：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/但注意[\s\S]*?(?=解：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/经查[\s\S]*?(?=解：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/回溯[\s\S]*?(?=解：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/重新审视[\s\S]*?(?=解：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/重新审题[\s\S]*?(?=解：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/必须调整[\s\S]*?(?=解：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/必须修正[\s\S]*?(?=解：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/如何排除[\s\S]*?(?=解：|综上|答案|$)/g, '')
  
  // 移除"正确解法"、"正确做法"等开头的段落
  cleaned = cleaned.replace(/正确解法[\s\S]*?(?=解：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/正确做法[\s\S]*?(?=解：|综上|答案|$)/g, '')
  
  // 移除否定句式开头的段落
  cleaned = cleaned.replace(/不，[\s\S]*?(?=解：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/不满足[\s\S]*?(?=解：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/违反[\s\S]*?(?=解：|综上|答案|$)/g, '')
  cleaned = cleaned.replace(/不符合[\s\S]*?(?=解：|综上|答案|$)/g, '')
  
  // 清理多余空行
  cleaned = cleaned.replace(/\n\s*\n/g, '\n')
  cleaned = cleaned.trim()
  
  return cleaned
}

const cleanJsonResponse = (text) => {
  if (!text) return {}
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const jsonStart = cleaned.indexOf('{')
    const jsonEnd = cleaned.lastIndexOf('}')
    if (jsonStart !== -1 && jsonEnd !== -1) {
      let jsonStr = cleaned.substring(jsonStart, jsonEnd + 1)
      
      try {
        return JSON.parse(jsonStr)
      } catch (parseError) {
        // JSON 解析失败，尝试修复 LaTeX 转义问题
        // 将字符串值中的单反斜杠（非 JSON 转义字符）转为双反斜杠
        const fixedJson = jsonStr.replace(/"([^"]*)"(?=\s*[:,\]}])/g, (match, content) => {
          // 转义非 JSON 标准转义字符的反斜杠
          const escaped = content.replace(/\\(?!["\\\/bfnrtu])/g, '\\\\')
          return `"${escaped}"`
        })
        return JSON.parse(fixedJson)
      }
    }
    return JSON.parse(cleaned)
  } catch (e) {
    console.error('[JSON 解析失败] 原始文本:', text.substring(0, 500))
    console.error('[JSON 解析失败] 错误:', e.message)
    throw new Error('AI 返回格式错误，请重试')
  }
}

export const sendTextChat = async (systemPrompt, userPrompt) => {
  if (!API_KEY) {
    throw new Error('API Key 未配置，请检查 .env 文件中的 VITE_QWEN_API_KEY')
  }


  const requestBody = {
    model: TEXT_MODEL_NAME,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userPrompt
      }
    ]
  }

  try {
    const response = await fetch(VISION_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[AI Text Service] API 错误:', errorText)
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const resultText = data.choices?.[0]?.message?.content || ''


    return cleanJsonResponse(resultText)
  } catch (error) {
    console.error('[AI Text Service] 调用失败:', error)
    throw error
  }
}

export const generateCertificationQuestion = async (strategy, scenarioTag, difficultyLevel = 'L2') => {
  const systemPrompt = QUESTION_GEN_PROMPT(strategy, scenarioTag, difficultyLevel)
  const userPrompt = '请生成符合要求的数学题目，返回 JSON 格式结果。'
  
  const result = await sendTextChat(systemPrompt, userPrompt)
  
  if (result.standardSolution) {
    result.standardSolution = cleanSolution(result.standardSolution)
  }
  if (result.questionText) {
    result.questionText = cleanSolution(result.questionText)
  }
  
  return result
}

export const generateRemedialQuestion = async (strategy, weakScenario, previousFeedback) => {
  const systemPrompt = `你是高中数学命题专家。学生「${weakScenario}」薄弱，请命制一道L1难度补考题。

【核心逻辑】${strategy?.logic_flow || strategy?.description || '未提供'}
【学生反馈】${previousFeedback}

【输出格式】纯JSON：
{
  "questionText": "题目（支持LaTeX）",
  "answerKey": "答案",
  "keyLogicPoint": "考点",
  "difficulty": "L1",
  "trapDescription": "陷阱",
  "scenarioTag": "${weakScenario}",
  "expectedSteps": ["步骤"],
  "standardSolution": "解析（只写解题步骤）"
}`
  
  const result = await sendTextChat(systemPrompt, '生成补考题，返回JSON。')
  
  if (result.standardSolution) {
    result.standardSolution = cleanSolution(result.standardSolution)
  }
  if (result.questionText) {
    result.questionText = cleanSolution(result.questionText)
  }
  
  return result
}

export const processImageWithAI = async (base64Image, options = {}) => {
  const { mode, context = {}, customPrompt } = options

  if (!API_KEY) {
    throw new Error('API Key 未配置，请检查 .env 文件中的 VITE_QWEN_API_KEY')
  }

  let systemPrompt = ''
  let userPrompt = ''

  if (customPrompt) {
    systemPrompt = customPrompt
    userPrompt = '请分析这道题目并返回 JSON 格式的诊断结果。'
  } else {
    switch (mode) {
      case 'DIAGNOSIS':
        systemPrompt = await buildDiagnosisPrompt()
        userPrompt = '请分析这道题目并返回 JSON 格式的诊断结果。'
        break

      case 'CERTIFICATION_GRADING':
        systemPrompt = CERTIFICATION_GRADING_PROMPT(context.strategy)
        userPrompt = '请评判学生的解题过程并返回 JSON 格式的评分结果。'
        break

      case 'WEEKLY_TASK_GEN':
        systemPrompt = WEEKLY_TASK_GEN_PROMPT
        userPrompt = '请识别题目并生成变式题，返回 JSON 格式结果。'
        break

      default:
        throw new Error(`未知的 AI 处理模式: ${mode}`)
    }
  }


  const requestBody = {
    model: VISION_MODEL_NAME,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: base64Image }
          },
          {
            type: 'text',
            text: `${systemPrompt}\n\n${userPrompt}`
          }
        ]
      }
    ]
  }

  try {
    const response = await fetch(VISION_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[AI Vision Service] API 错误:', errorText)
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const resultText = data.choices?.[0]?.message?.content || ''


    return cleanJsonResponse(resultText)
  } catch (error) {
    console.error('[AI Vision Service] 调用失败:', error)
    throw error
  }
}

const normalizeId = (id) => {
  if (id === undefined || id === null) return null
  return String(id).trim()
}

const normalizeSpecId = (rawId) => {
  const id = normalizeId(rawId)
  if (!id) return null
  if (/^V\d+$/i.test(id)) return id.toUpperCase()
  if (/^\d+$/.test(id)) return 'V' + id
  return id.toUpperCase()
}

const extractVariationKeywords = (variation) => {
  const words = []

  // 1. 变例名称拆词
  const nameClean = (variation.name || '').replace(/[【】（）()]/g, ' ')
  words.push(...nameClean.split(/[\s，,、]+/).filter(w => w.length >= 2))

  // 2. variable_knobs 中的 desc 值（最精准的题目特征描述）
  const knobs = variation.variable_knobs || {}
  for (const entries of Object.values(knobs)) {
    if (Array.isArray(entries)) {
      for (const entry of entries) {
        if (entry.desc && entry.desc.length >= 2) words.push(entry.desc)
      }
    }
  }

  // 3. logic_core 首句（通常概括了核心考点）
  const core = variation.logic_core || ''
  const firstSentence = core.split(/[。；;]/)[0]
  if (firstSentence && firstSentence.length >= 4) words.push(firstSentence.slice(0, 30))

  return [...new Set(words)]
}

const findBestVariation = (specialties, rawSpecId, rawVarId, questionText) => {
  const specId = normalizeSpecId(rawSpecId)
  const varId = normalizeId(rawVarId)

  let exactMatch = null

  // 1. 精确匹配 AI 返回的 specId/varId
  for (const spec of (specialties || [])) {
    if (normalizeSpecId(spec.spec_id) === specId) {
      for (const vari of (spec.variations || [])) {
        if (normalizeId(vari.var_id) === varId) {
          exactMatch = { spec, variation: vari, matchType: 'exact' }
          break
        }
      }
      if (!exactMatch && spec.variations?.length > 0) {
        exactMatch = { spec, variation: spec.variations[0], matchType: 'spec_exact_var_fallback' }
      }
      break
    }
  }

  // 2. 始终做关键词匹配，从 variable_knobs/name/logic_core 提取
  let bestKeywordMatch = null
  let bestKeywordScore = 0

  if (questionText) {
    for (const spec of (specialties || [])) {
      for (const vari of (spec.variations || [])) {
        const keywords = extractVariationKeywords(vari)
        let score = 0
        for (const kw of keywords) {
          if (kw.length >= 2 && questionText.includes(kw)) {
            score += kw.length
          }
        }
        if (score > bestKeywordScore) {
          bestKeywordScore = score
          bestKeywordMatch = { spec, variation: vari, matchType: 'keyword', score }
        }
      }
    }
  }

  // 3. 决策：若关键词匹配分≥4 且匹配的变例不同于精确匹配结果，用关键词
  if (bestKeywordMatch && bestKeywordScore >= 4) {
    if (!exactMatch ||
        normalizeId(bestKeywordMatch.variation.var_id) !== normalizeId(exactMatch.variation.var_id)) {
      console.log(`[diagnosis] 关键词覆盖: AI返回 ${rawSpecId}/${rawVarId}, 实际最佳 ${bestKeywordMatch.spec.spec_id}/${bestKeywordMatch.variation.var_id} (分${bestKeywordScore})`)
      return bestKeywordMatch
    }
  }

  // 4. 精确匹配优先
  if (exactMatch) return exactMatch

  // 5. 任何关键词兜底
  if (bestKeywordMatch) return bestKeywordMatch

  return null
}

export const diagnoseError = async (base64Image) => {
    const result = await processImageWithAI(base64Image, { mode: 'DIAGNOSIS' })

    const rawSpecId = result.specId || 'V1'
    const rawVarId = result.varId || '1.1'
    const motifId = result.motifId || 'M01'
    const questionText = result.questionText || ''

    let specId = rawSpecId
    let varId = rawVarId
    let specName = ''
    let varName = ''
    let motifName = ''
    let suggestedWeapons = []

    try {
      const motifData = await loadMotifData(motifId)

      if (motifData) {
        motifName = motifData.motif_name || motifData.name || motifId

        const match = findBestVariation(motifData.specialties, rawSpecId, rawVarId, questionText)

        if (match) {
          specId = normalizeSpecId(match.spec.spec_id)
          specName = match.spec.spec_name || specId
          varId = normalizeId(match.variation.var_id)
          varName = match.variation.name || varId
        } else if (motifData.specialties?.length > 0) {
          const firstSpec = motifData.specialties[0]
          specId = normalizeSpecId(firstSpec.spec_id)
          specName = firstSpec.spec_name || specId
          if (firstSpec.variations?.length > 0) {
            varId = normalizeId(firstSpec.variations[0].var_id)
            varName = firstSpec.variations[0].name || varId
          }
        }

        // 武器推荐：优先用适配器统一查找（与方法工具页保证一致）
        const adapterWeapons = findWeaponsByMotif(motifId)
        if (adapterWeapons.length > 0) {
          suggestedWeapons = adapterWeapons.map(w => w.id)
        }

        // 补充关键词匹配的武器
        if (questionText) {
          const keywordMatches = matchWeaponsByKeywords(questionText)
          for (const m of keywordMatches) {
            if (!suggestedWeapons.includes(m.weaponId)) {
              suggestedWeapons.push(m.weaponId)
            }
          }
        }

        // 如果适配器没有结果，降级使用 variation 的 linked_weapons
        if (suggestedWeapons.length === 0) {
          const variation = match?.variation || motifData.specialties?.[0]?.variations?.[0]
          if (variation?.toolkit?.linked_weapons) {
            suggestedWeapons = variation.toolkit.linked_weapons
          }
        }

        // 过滤：只保留在 weapon_details 中实际存在的武器
        const allKnownIds = new Set(Object.keys(weaponDetails))
        suggestedWeapons = suggestedWeapons.filter(id => allKnownIds.has(id)).slice(0, 5)
      }
    } catch (error) {
      console.error('[AI Vision Service] 加载母题数据失败:', error)
    }

    const normalizedResult = {
      questionText,
      classification: {
        motifId,
        motifName,
        specId,
        specName,
        varId,
        varName,
        difficulty: result.difficulty || 'L2'
      },
      diagnosis: {
        keyPoints: result.keyPoints || [],
        trapType: result.trapType || null,
        suggestedWeapons,
        message: result.message || ''
      },
      targetId: motifId,
      greenSubIds: [],
      message: result.message || ''
    }

    return normalizedResult
  }

export const gradeCertification = async (base64Image, strategy) => {
  return processImageWithAI(base64Image, { 
    mode: 'CERTIFICATION_GRADING', 
    context: { strategy } 
  })
}

export const gradeCertificationText = async (textAnswer, strategy) => {
  if (!API_KEY) {
    throw new Error('API Key 未配置，请检查 .env 文件中的 VITE_QWEN_API_KEY')
  }

  const focusLogic = strategy?.certification?.focusLogic || strategy?.logic_flow || '核心解题步骤'
  const antiPattern = strategy?.certification?.antiPattern || '跳步或逻辑跳跃'

  const systemPrompt = `你是一位严格的数学教练，负责评判学生是否掌握了特定的解题方法（杀手锏）。

当前考察的杀手锏是「${strategy?.name || '未知'}」。
核心逻辑是：${strategy?.logic_flow || strategy?.description || '未提供'}

【评分标准】
1. 必须显式体现「${focusLogic}」这一逻辑步骤
2. 严格检查是否出现「${antiPattern}」的情况
3. 步骤完整、逻辑清晰、计算正确

必须返回严格的纯 JSON 格式（不要包含任何 Markdown 标记）：
{
  "passed": true/false,
  "score": 0-100,
  "feedback": "具体评语，指出哪里做得好，哪里需要改进",
  "missingStep": "如果未通过，指出缺失的关键步骤"
}`

  const userPrompt = `学生录入的答案如下：

${textAnswer}

请评判该答案是否正确掌握了「${strategy?.name}」方法。`


  const requestBody = {
    model: TEXT_MODEL_NAME,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  }

  try {
    const response = await fetch(VISION_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[AI Text Grading] API 错误:', errorText)
      throw new Error(`API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    const resultText = data.choices?.[0]?.message?.content || ''

    return cleanJsonResponse(resultText)
  } catch (error) {
    console.error('[AI Text Grading] 调用失败:', error)
    throw error
  }
}

export const generateVariation = async (base64Image) => {
  return processImageWithAI(base64Image, { mode: 'WEEKLY_TASK_GEN' })
}
