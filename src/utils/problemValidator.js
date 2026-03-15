export const validateProblem = (problem, level, targetId) => {
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

export const verifyAIOutput = (output, difficulty, targetId) => {
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
  
  if (difficulty && difficulty.minSteps) {
    const stepCount = (output.analysis.match(/\d+\./g) || []).length
    if (stepCount < difficulty.minSteps) {
      return { 
        valid: false, 
        reason: `逻辑步数不足：需要至少 ${difficulty.minSteps} 步，实际只有 ${stepCount} 步` 
      }
    }
  }
  
  if (difficulty && difficulty.allowDiscussion === false) {
    if (output.question.includes('讨论') || output.question.includes('分类')) {
      return { 
        valid: false, 
        reason: 'L2 级别禁止出现分类讨论' 
      }
    }
  }
  
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
