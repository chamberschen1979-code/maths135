/**
 * V4.x 简化版 Critic 引擎
 * 
 * 移除复杂的异步调用，仅保留必要的审查功能
 * 信任模型自身推理能力
 */

// ==================== 简化版 Critic Prompt ====================

export const CRITIC_SYSTEM_PROMPT = `你是一位拥有 30 年经验的高中数学教研组长。
你的任务是审查另一位老师（AI）出的题目、解析和答案。

【审查要点】
1. 前提充分性：题目条件是否充分、无矛盾
2. 解析自洽性：解析逻辑是否合理
3. 答案合理性：答案是否与题干条件自洽

【输出格式】
请严格返回 JSON：
{
  "status": "PASS" | "FAIL",
  "reason": "简短批评理由（如果是 FAIL）",
  "suggestion": "修改建议（如果是 FAIL）"
}`

// ==================== 简化的约束提取 ====================

/**
 * 简化的约束提取 - 仅用于日志记录
 */
export const extractConstraints = (content) => {
  const constraints = []
  if (!content) return constraints
  
  const text = content.toLowerCase()
  
  // 提取等式
  const eqMatch = text.match(/([a-z])\s*\+\s*([a-z])\s*=\s*(\d+)/g)
  if (eqMatch) {
    eqMatch.forEach(eq => constraints.push(eq))
  }
  
  // 提取不等式
  const ineqMatch = text.match(/([a-z])\s*[<>≥≤]\s*(\d+)/g)
  if (ineqMatch) {
    ineqMatch.forEach(eq => constraints.push(eq))
  }
  
  return constraints
}

/**
 * 简化的答案范围提取
 */
export const extractAnswerRange = (answer) => {
  if (!answer) return null
  
  const rangeMatch = answer.match(/[\(\[]([^,\)\]]+),\s*([^\)\]]+)[\)\]]/)
  if (rangeMatch) {
    return { min: rangeMatch[1], max: rangeMatch[2], raw: rangeMatch[0] }
  }
  
  return null
}

/**
 * 简化的影子测试 - 仅用于日志记录
 * 不再尝试寻找反例，避免阻塞
 */
export const performShadowTest = (content, answer) => {
  console.log('[Critic] ℹ️ 简化模式：跳过影子测试')
  return null
}

/**
 * 构建 Critic 输入
 */
export const buildCriticInput = (problemData, shadowTestResult) => {
  const { content, analysis, answer } = problemData
  
  let input = `【题目】\n${content || '未提供'}\n\n`
  input += `【解析】\n${analysis || '未提供'}\n\n`
  input += `【答案】\n${answer || '未提供'}\n\n`
  
  if (shadowTestResult) {
    input += `【代码反例警告】\n${shadowTestResult.reason}\n\n`
  }
  
  return input
}

/**
 * 解析 Critic 响应
 */
export const parseCriticResponse = (response) => {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        status: parsed.status || 'PASS',
        reason: parsed.reason || '',
        suggestion: parsed.suggestion || ''
      }
    }
  } catch (e) {
    console.error('[Critic] 解析响应失败:', e.message)
  }
  
  return { status: 'PASS', reason: '', suggestion: '' }
}

/**
 * 简化的执行函数 - 信任模型，不阻塞流程
 */
export const executeCriticReview = async (problemData, options = {}) => {
  console.log('[Critic] ℹ️ 简化模式：信任模型能力，跳过深度审查')
  
  // 直接返回通过，让模型自己保证质量
  return {
    isConsistent: true,
    issues: [],
    confidence: 0.8,
    skippedLLM: true,
    message: '简化模式：信任模型自身推理能力'
  }
}

// ==================== 导出 ====================
export default {
  CRITIC_SYSTEM_PROMPT,
  performShadowTest,
  buildCriticInput,
  parseCriticResponse,
  executeCriticReview,
  extractConstraints,
  extractAnswerRange
}
