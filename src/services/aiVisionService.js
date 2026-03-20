import { API_KEY, BASE_URL, VISION_MODEL_NAME } from '../constants/config'
import { enhanceDiagnosisWithKeywords } from '../utils/classificationUtils'

const VISION_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'

const TEXT_MODEL_NAME = 'qwen-turbo'

const DIAGNOSIS_PROMPT = `你是高中数学教研专家。请分析这道错题图片，重点识别题干内容并归类。

【核心任务】
1. OCR提取题干（忽略手写答案的潦草程度）
2. 判断题目属于哪个母题、专项
3. 识别关键考点和陷阱类型
4. 推荐相关杀手锏

【输出格式】纯JSON（无Markdown标记）：
{
  "questionText": "提取的题干内容（完整题目，不含答案）",
  "classification": {
    "motifId": "M01",
    "motifName": "集合、逻辑用语与复数",
    "specialtyId": "V1",
    "specialtyName": "集合的运算与关系",
    "difficulty": "L2"
  },
  "diagnosis": {
    "keyPoints": ["考点1", "考点2"],
    "trapType": "空集陷阱",
    "suggestedWeapons": ["S-SET-01", "S-SET-02"],
    "message": "诊断评语"
  },
  "confidence": 0.85
}

【母题列表】
M01 集合、逻辑与复数, M02 不等式性质, M03 函数概念与性质, M04 指对数函数, M05 平面向量,
M06 三角函数基础, M07 解三角形综合, M08 数列基础与求和, M09 立体几何基础, M10 解析几何基础,
M11 导数工具基础, M12 概率与统计, M13 解析几何压轴, M14 导数综合压轴, M15 数列综合压轴,
M16 计数原理, M17 创新思维与情境

【专项列表】（每个母题下的V1, V2, V3等）
M01: V1集合运算, V2逻辑用语, V3复数
M02: V1不等式解法, V2基本不等式
M03: V1函数概念, V2单调性, V3奇偶性, V4零点
M04: V1指数函数, V2对数函数, V3指对数运算
M05: V1向量运算, V2数量积, V3向量几何
M06: V1三角定义, V2恒等变换, V3图像性质
M07: V1正弦定理, V2余弦定理, V3解三角形综合
M08: V1等差数列, V2等比数列, V3数列求和
M09: V1空间几何体, V2点线面, V3空间向量
M10: V1直线, V2圆, V3直线与圆
M11: V1导数概念, V2导数与单调性, V3导数与极值
M12: V1概率, V2统计
M13: V1椭圆, V2双曲线, V3抛物线
M14: V1导数综合, V2导数证明
M15: V1数列综合, V2数列压轴
M16: V1排列组合, V2二项式
M17: V1新定义, V2数学文化

【杀手锏ID参考】
S-SET-01 空集陷阱, S-SET-02 端点取舍
S-FUNC-01 数形结合, S-FUNC-02 复合函数
S-TRI-01 正弦定理, S-TRI-02 余弦定理
S-VEC-01 向量几何, S-VEC-02 数量积
S-SEQ-01 等差等比, S-SEQ-02 数列求和
S-GEO-01 空间想象, S-GEO-02 体积最值
S-ANA-01 韦达定理, S-ANA-02 联立消元
S-DER-01 导数单调性, S-DER-02 零点分布`

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
  const { mode, context = {} } = options

  if (!API_KEY) {
    throw new Error('API Key 未配置，请检查 .env 文件中的 VITE_QWEN_API_KEY')
  }

  let systemPrompt = ''
  let userPrompt = ''

  switch (mode) {
    case 'DIAGNOSIS':
      systemPrompt = DIAGNOSIS_PROMPT
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
    
    const normalizedResult = {
      questionText: result.questionText || '',
      classification: {
        motifId: result.classification?.motifId || result.targetId || 'M01',
        motifName: result.classification?.motifName || '',
        specialtyId: result.classification?.specialtyId || 'V1',
        specialtyName: result.classification?.specialtyName || '',
        difficulty: result.classification?.difficulty || 'L2'
      },
      diagnosis: {
        keyPoints: result.diagnosis?.keyPoints || [],
        trapType: result.diagnosis?.trapType || null,
        suggestedWeapons: result.diagnosis?.suggestedWeapons || [],
        message: result.diagnosis?.message || result.message || ''
      },
      confidence: result.confidence || 0.5,
      targetId: result.classification?.motifId || result.targetId || 'M01',
      greenSubIds: result.greenSubIds || [],
      message: result.diagnosis?.message || result.message || ''
    }
    
    const enhancedResult = enhanceDiagnosisWithKeywords(normalizedResult)
    
    console.log('[AI Vision Service] 增强诊断结果:', enhancedResult)
    return enhancedResult
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
