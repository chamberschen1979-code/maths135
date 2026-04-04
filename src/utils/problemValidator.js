/**
 * problemValidator.js - 题目验证器 (搬运工模式)
 * 
 * 核心理念：只检查"格式完整性"，不检查"数学正确性"
 * 因为 M 库的真题已经是正确的，AI 只是搬运，不需要验算。
 */

/**
 * 检查题目基础结构（防空防错）
 * @param {Object} problem - 题目对象
 * @param {string} level - 难度等级
 * @param {string} targetId - 目标 ID
 * @returns {Object} - 验证结果
 */
export const validateProblem = (problem, level, targetId) => {
  if (!problem || !problem.desc) return { valid: false, reason: '题目描述为空' }
  
  const desc = problem.desc
  
  if (desc.length < 10) return { valid: false, reason: '题目描述过短' }
  
  // 保留：简单的格式检查，防止 AI 输出乱码
  if (desc.includes('undefined') || desc.includes('null')) {
    return { valid: false, reason: '题目包含无效字符' }
  }

  // 保留：检查是否有明确的题目指令
  const requiredKeywords = ['求', '证明', '计算', '判断', '求证', '讨论']
  const hasKeyword = requiredKeywords.some(kw => desc.includes(kw))
  if (!hasKeyword) {
    return { valid: false, reason: '缺少明确的题目指令' }
  }
  
  return { valid: true }
}

/**
 * 验证 AI 输出完整性（搬运工模式）
 * 只检查"防 AI 发疯"，不检查"数学对不对"
 * @param {Object} output - AI 输出的题目对象
 * @param {Object} difficulty - 难度配置（已废弃，保留参数兼容）
 * @param {string} targetId - 目标 ID
 * @returns {Object} - 验证结果
 */
export const verifyAIOutput = (output, difficulty, targetId) => {
  // 1. 检查必要字段（防 JSON 解析失败）
  if (!output.question || !output.analysis || !output.answer) {
    return { valid: false, reason: '缺少必要的题目组成部分 (JSON结构错误)' }
  }

  // 2. 移除所有关于"步数"、"难度适配"的检查
  // 原来的代码：
  // if (stepCount < difficulty.minSteps) { ... }
  // if (output.question.includes('讨论')) { ... }
  // 以上全部删除！

  // 3. 移除所有"物理常识检查"
  // 原来的代码：
  // if (pattern.test(output.question)) { return { reason: '出现负数的物理量' } }
  // 以上全部删除！因为数学压轴题经常出现负数或复杂表达式。

  // 4. 检查是否包含"搬运工指令"的回声（可选）
  // 如果 AI 在 reasoning 里包含了 "逻辑熔断" 字样，说明它内部报错了
  if (output.reasoning && typeof output.reasoning === 'string') {
    if (output.reasoning.includes('逻辑熔断') || output.reasoning.includes('验算失败')) {
      return { valid: false, reason: 'AI 内部逻辑报错（逻辑熔断）' }
    }
  }

  // 5. 检查是否有明显的 JSON 格式问题
  const questionStr = typeof output.question === 'string' 
    ? output.question 
    : (output.question.content || JSON.stringify(output.question))
  
  if (questionStr.includes('[object Object]')) {
    return { valid: false, reason: '题目内容包含序列化错误' }
  }

  return { valid: true }
}
