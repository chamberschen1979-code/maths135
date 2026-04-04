import { API_KEY, BASE_URL, VISION_MODEL_NAME } from '../constants/config'
import { enhanceDiagnosisWithKeywords } from '../utils/classificationUtils'
import { getWeaponNameById } from '../utils/weaponUtils'
import { loadMotifData } from '../utils/dataLoader'
import { buildStructurePrompt } from '../utils/motifStructureExtractor'

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
2. 专项/变例选择：
   - 必须先确定母题，然后在该母题的专项列表中选择 specId。
   - 必须在选定的专项中选择存在的 varId。
   - 严禁编造列表中不存在的 ID（例如：如果 M08 只有 2.1，绝不能返回 2.3）。
3. 难度评估：
   - 必须参考"支持难度"列表。
   - 如果题目看起来很难，但该变例不支持 L4，请选择该变例支持的最高难度。

【输出格式】纯JSON（无Markdown标记）：
{
  "questionText": "提取的题干内容",
  "motifId": "M03",
  "specId": "V1",
  "varId": "1.2",
  "difficulty": "L3",
  "keyPoints": ["考点1", "考点2"],
  "trapType": "陷阱类型",
  "message": "诊断评语（一句话指出问题所在）"
}

注意：只返回 motifId、specId、varId 编号，不需要返回名称。`
  
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

  console.log('[AI Text Service] 发送文本请求...')

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

    console.log('[AI Text Service] 响应成功:', resultText.substring(0, 100))

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

  console.log(`[AI Vision Service] 模式: ${mode}, 图片长度: ${base64Image?.length}`)

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

    console.log('[AI Vision Service] 响应成功:', resultText.substring(0, 100))

    return cleanJsonResponse(resultText)
  } catch (error) {
    console.error('[AI Vision Service] 调用失败:', error)
    throw error
  }
}

export const diagnoseError = async (base64Image) => {
    const result = await processImageWithAI(base64Image, { mode: 'DIAGNOSIS' })
    
    console.log('[AI Vision Service] AI 返回结果:', result)
    
    const motifId = result.motifId || 'M01'
    let specId = result.specId || 'V1'
    let varId = result.varId || '1.1'
    
    let motifName = ''
    let specName = ''
    let varName = ''
    let linkedWeapons = []
    
    try {
      const motifData = await loadMotifData(motifId)
      
      if (motifData) {
        motifName = motifData.motif_name || motifData.name || motifId
        
        const specialty = motifData.specialties?.find(
          s => s.spec_id === specId
        )
        
        if (specialty) {
          specName = specialty.spec_name || specId
          
          const variation = specialty.variations?.find(
            v => v.var_id === varId
          )
          
          if (variation) {
            varName = variation.name || varId
            
            if (variation.toolkit?.linked_weapons) {
              linkedWeapons = variation.toolkit.linked_weapons
            }
          } else {
            const firstVariation = specialty.variations?.[0]
            if (firstVariation) {
              console.log(`[AI Vision Service] AI返回变例 ${varId} 无效，自动修正为 ${firstVariation.var_id}`)
              varId = firstVariation.var_id
              varName = firstVariation.name || varId
              if (firstVariation.toolkit?.linked_weapons) {
                linkedWeapons = firstVariation.toolkit.linked_weapons
              }
            }
          }
        } else {
          const firstSpecialty = motifData.specialties?.[0]
          if (firstSpecialty) {
            console.log(`[AI Vision Service] AI返回专项 ${specId} 无效，自动修正为 ${firstSpecialty.spec_id}`)
            specId = firstSpecialty.spec_id
            specName = firstSpecialty.spec_name || specId
            
            const firstVariation = firstSpecialty.variations?.[0]
            if (firstVariation) {
              varId = firstVariation.var_id
              varName = firstVariation.name || varId
              if (firstVariation.toolkit?.linked_weapons) {
                linkedWeapons = firstVariation.toolkit.linked_weapons
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[AI Vision Service] 加载母题数据失败:', error)
    }
    
    const normalizedResult = {
      questionText: result.questionText || '',
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
        suggestedWeapons: linkedWeapons,
        message: result.message || ''
      },
      targetId: motifId,
      greenSubIds: [],
      message: result.message || ''
    }
    
    console.log('[AI Vision Service] 标准化诊断结果:', normalizedResult)
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

  console.log('[AI Text Grading] 发送文本评分请求...')

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

    console.log('[AI Text Grading] 响应成功')
    return cleanJsonResponse(resultText)
  } catch (error) {
    console.error('[AI Text Grading] 调用失败:', error)
    throw error
  }
}

export const generateVariation = async (base64Image) => {
  return processImageWithAI(base64Image, { mode: 'WEEKLY_TASK_GEN' })
}
