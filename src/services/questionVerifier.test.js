/**
 * Multi-Agent 质检测试脚本 - V2.0 智能评估
 * 测试基于"高考实战标准"的智能评估机制
 */

import { verifyQuestion, verifyQuestionWithRetry } from './questionVerifier.js'

const evaluateDifficultyMatch = (targetLevel, estimatedSteps, branchCount, content) => {
  const DIFFICULTY_INDICATORS = {
    L2: { maxSteps: 3, maxBranches: 0 },
    L3: { maxSteps: 6, maxBranches: 2 },
    L4: { minSteps: 5, maxSteps: 12, minBranches: 1 }
  }
  
  const indicators = DIFFICULTY_INDICATORS[targetLevel] || DIFFICULTY_INDICATORS.L3
  let score = 5.0
  let status = 'Perfect'
  let reason = ''
  
  if (targetLevel === 'L2') {
    if (estimatedSteps > indicators.maxSteps) {
      score -= 1.5 * (estimatedSteps - indicators.maxSteps) / 3
      status = 'TooHard'
      reason = `L2 目标但计算步骤过多 (${estimatedSteps}步 > ${indicators.maxSteps}步)`
    }
    if (branchCount > indicators.maxBranches) {
      score -= 1.0
      status = 'TooHard'
      reason += (reason ? '; ' : '') + `L2 目标但需要分类讨论 (${branchCount}分支)`
    }
    if (!reason) {
      reason = `难度适中，符合 L2 基础题标准 (${estimatedSteps}步)`
    }
  } else if (targetLevel === 'L3') {
    if (estimatedSteps < 3) {
      score -= 1.0
      status = 'TooEasy'
      reason = `L3 目标但计算过于简单 (${estimatedSteps}步)`
    } else if (estimatedSteps > indicators.maxSteps) {
      score -= 0.5 * (estimatedSteps - indicators.maxSteps) / 3
      status = 'TooHard'
      reason = `L3 目标但计算步骤偏多 (${estimatedSteps}步 > ${indicators.maxSteps}步)`
    } else {
      reason = `难度适中，符合 L3 进阶题标准 (${estimatedSteps}步，${branchCount}分支)`
    }
  } else if (targetLevel === 'L4') {
    if (estimatedSteps < indicators.minSteps) {
      score -= 2.0 * (indicators.minSteps - estimatedSteps) / indicators.minSteps
      status = 'TooEasy'
      reason = `L4 压轴题目标但计算过于简单 (${estimatedSteps}步 < ${indicators.minSteps}步)`
    }
    if (branchCount < indicators.minBranches) {
      score -= 0.5
      if (status === 'Perfect') status = 'Mismatch'
      reason += (reason ? '; ' : '') + 'L4 目标但缺少分类讨论'
    }
    if (!reason) {
      reason = `难度适中，符合 L4 压轴题标准 (${estimatedSteps}步，${branchCount}分支)`
    }
  }
  
  score = Math.max(0, Math.min(5, score))
  return { score, status, reason }
}

const testM05_Q7 = {
  content: `（1）已知点 $A(-1,0), B(1,0)$，点 $P$ 在圆 $x^2+(y-1)^2=1$ 上运动，求 $\\overrightarrow{PA} \\cdot \\overrightarrow{PB}$ 的取值范围。
（2）若圆的半径变为 $r$ ($r>0$)，圆心仍为 $(0,1)$，求 $\\overrightarrow{PA} \\cdot \\overrightarrow{PB}$ 的最大值与最小值之差关于 $r$ 的函数解析式。`,
  answer: {
    l1: "$[-1, 3]$",
    l2: "当 $0<r\\le 1$ 时差为 $4r$；当 $r>1$ 时差为 $4r$"
  }
}

const testM05_Fail = {
  content: `已知点 $A(-1,0), B(1,0)$，点 $P$ 在圆 $x^2+y^2=1$ 上运动，求 $\\overrightarrow{PA} \\cdot \\overrightarrow{PB}$ 的取值范围。`,
  answer: {
    l1: "$[-1, 1]$"
  }
}

// 🔧 M06 已移除特殊处理，现在走通用验算路径
// 三角函数题目将通过 extractUniversalFeatures 进行特征识别
// 并通过 executeGenericVerification 或 LLM 降级检查进行验算

const testM15_Pass = {
  content: `某随机变量 X 的分布列为：P(X=1)=0.2, P(X=2)=0.3, P(X=3)=0.25, P(X=4)=0.25，求 E(X)。`,
  answer: {
    l1: "$E(X) = 2.55$"
  }
}

const testM15_Fail = {
  content: `某随机变量 X 的分布列为：P(X=1)=0.3, P(X=2)=0.4, P(X=3)=0.3, P(X=4)=0.2，求 E(X)。`,
  answer: {
    l1: "$E(X) = 2.5$"
  }
}

const testAdvancedTools = {
  content: `已知函数 $f(x) = \\frac{\\ln x}{x}$，求 $f(x)$ 的最大值。提示：使用洛必达法则或泰勒展开求解。`,
  answer: {
    l1: "$f(x)_{max} = \\frac{1}{e}$"
  }
}

// 🔧 新增测试：空内容检测
const testEmptyContent = {
  content: '',
  answer: { l1: '无答案' }
}

// 🔧 新增测试：多种返回结构兼容性
const testVariantStructure = {
  variant: {
    question: '已知点 $A(0,0), B(2,0)$，点 $P$ 在圆 $x^2+y^2=4$ 上运动，求数量积范围。'
  },
  answer: { l1: '$[0, 4]$' }
}

// 🔧 新增测试：参数缺失
const testMissingParams = {
  content: '求向量数量积的范围。',
  answer: { l1: '无法计算' }
}

const runTests = async () => {
  console.log('\n' + '='.repeat(80))
  console.log('🧪 Multi-Agent 质检测试开始 - V2.1 紧急修复验证')
  console.log('='.repeat(80))
  
  // 🔧 测试 0: 空内容检测（新增）
  console.log('\n📋 测试 0: 空内容检测（应立即失败）')
  const result0 = await verifyQuestion(testEmptyContent, 'M05', { targetLevel: 'L3' })
  console.log(`结果: ${!result0.pass && result0.errorType === '题目内容缺失' ? '✅ 正确拦截' : '❌ 未拦截'}`)
  console.log(`错误类型: ${result0.errorType}`)
  console.log(`fitnessScore: ${result0.fitnessScore}`)
  
  // 🔧 测试 0.1: 多种返回结构兼容性（新增）
  console.log('\n📋 测试 0.1: 多种返回结构兼容性')
  const result0_1 = await verifyQuestion(testVariantStructure, 'M05', { targetLevel: 'L3' })
  console.log(`结果: ${result0_1.pass ? '✅ 通过' : '❌ 失败'}`)
  console.log(`内容长度: ${result0_1.fitnessDetails ? '已读取' : '未读取'}`)
  
  // 🔧 测试 0.2: 参数缺失导致验算失败（新增）
  console.log('\n📋 测试 0.2: 参数缺失导致验算失败')
  const result0_2 = await verifyQuestion(testMissingParams, 'M05', { targetLevel: 'L3' })
  console.log(`结果: ${!result0_2.pass ? '✅ 正确拦截' : '❌ 未拦截'}`)
  console.log(`错误类型: ${result0_2.errorType}`)
  console.log(`mathPass: ${result0_2.mathPass}`)
  
  console.log('\n📋 测试 1: M05 向量最值（圆心偏离中点 - 应通过）')
  const result1 = await verifyQuestion(testM05_Q7, 'M05', { targetLevel: 'L3' })
  console.log(`结果: ${result1.pass ? '✅ 通过' : '❌ 失败'}`)
  console.log(`fitnessScore: ${result1.fitnessScore?.toFixed(1)}/5.0`)
  console.log(`难度匹配: ${result1.fitnessDetails?.difficultyMatch?.status} (${result1.fitnessDetails?.difficultyMatch?.score?.toFixed(1)}分)`)
  console.log(`考纲合规: ${result1.fitnessDetails?.syllabusCheck?.status} (${result1.fitnessDetails?.syllabusCheck?.score?.toFixed(1)}分)`)
  console.log(`区分度: ${result1.fitnessDetails?.uniqueness?.status} (${result1.fitnessDetails?.uniqueness?.score?.toFixed(1)}分)`)
  
  console.log('\n📋 测试 2: M05 向量最值（圆心与中点重合 - 应失败）')
  const result2 = await verifyQuestion(testM05_Fail, 'M05', { targetLevel: 'L3' })
  console.log(`结果: ${result2.pass ? '✅ 通过' : '❌ 失败'}`)
  console.log(`错误类型: ${result2.errorType}`)
  console.log(`mathPass: ${result2.mathPass}`)
  
  console.log('\n📋 测试 3: M06 三角函数零点问题')
  const result3 = await verifyQuestion(testM06_Q2, 'M06', { targetLevel: 'L3' })
  console.log(`结果: ${result3.pass ? '✅ 通过' : '❌ 失败'}`)
  console.log(`fitnessScore: ${result3.fitnessScore?.toFixed(1)}/5.0`)
  console.log(`盲解结果: ${result3.blindSolveResult}`)
  
  console.log('\n📋 测试 4: M15 概率分布（归一 - 应通过）')
  const result4 = await verifyQuestion(testM15_Pass, 'M15', { targetLevel: 'L2' })
  console.log(`结果: ${result4.pass ? '✅ 通过' : '❌ 失败'}`)
  console.log(`fitnessScore: ${result4.fitnessScore?.toFixed(1)}/5.0`)
  
  console.log('\n📋 测试 5: M15 概率分布（不归一 - 应失败）')
  const result5 = await verifyQuestion(testM15_Fail, 'M15', { targetLevel: 'L2' })
  console.log(`结果: ${result5.pass ? '✅ 通过' : '❌ 失败'}`)
  console.log(`错误类型: ${result5.errorType}`)
  console.log(`mathPass: ${result5.mathPass}`)
  
  console.log('\n📋 测试 6: 超纲工具检测')
  const result6 = await verifyQuestion(testAdvancedTools, 'M04', { targetLevel: 'L3' })
  console.log(`结果: ${result6.pass ? '✅ 通过' : '❌ 失败'}`)
  console.log(`考纲合规: ${result6.fitnessDetails?.syllabusCheck?.status}`)
  console.log(`检测到的超纲工具: ${result6.fitnessDetails?.syllabusCheck?.detectedTools?.join(', ') || '无'}`)
  
  console.log('\n📋 测试 7: 区分度检查（与已有题目对比）')
  const existingQuestions = [
    {
      motifId: 'M05',
      motifName: '平面向量',
      variant: { question: '已知点 A(-1,0), B(1,0)，点 P 在圆 x²+y²=1 上运动，求数量积的范围。' }
    },
    {
      motifId: 'M06',
      motifName: '三角函数',
      variant: { question: '已知函数 f(x) = sin(2x)，求其在区间 [0, π] 上的单调性。' }
    }
  ]
  const result7 = await verifyQuestion(testM05_Q7, 'M05', { 
    targetLevel: 'L3', 
    existingQuestions 
  })
  console.log(`结果: ${result7.pass ? '✅ 通过' : '❌ 失败'}`)
  console.log(`区分度: ${result7.fitnessDetails?.uniqueness?.status}`)
  console.log(`区分度得分: ${result7.fitnessDetails?.uniqueness?.score?.toFixed(1)}/5.0`)
  console.log(`原因: ${result7.fitnessDetails?.uniqueness?.reason}`)
  
  console.log('\n📋 测试 8: 难度匹配度测试')
  console.log('--- L2 目标 (基础题) ---')
  const l2Match = evaluateDifficultyMatch('L2', 2, 0, '基础计算题')
  console.log(`L2, 2步, 0分支: ${l2Match.status} (${l2Match.score.toFixed(1)}分) - ${l2Match.reason}`)
  
  const l2MatchHard = evaluateDifficultyMatch('L2', 6, 2, '复杂分类讨论')
  console.log(`L2, 6步, 2分支: ${l2MatchHard.status} (${l2MatchHard.score.toFixed(1)}分) - ${l2MatchHard.reason}`)
  
  console.log('--- L3 目标 (进阶题) ---')
  const l3Match = evaluateDifficultyMatch('L3', 5, 1, '参数分析')
  console.log(`L3, 5步, 1分支: ${l3Match.status} (${l3Match.score.toFixed(1)}分) - ${l3Match.reason}`)
  
  const l3MatchEasy = evaluateDifficultyMatch('L3', 2, 0, '简单代入')
  console.log(`L3, 2步, 0分支: ${l3MatchEasy.status} (${l3MatchEasy.score.toFixed(1)}分) - ${l3MatchEasy.reason}`)
  
  console.log('--- L4 目标 (压轴题) ---')
  const l4Match = evaluateDifficultyMatch('L4', 8, 2, '极值点偏移')
  console.log(`L4, 8步, 2分支: ${l4Match.status} (${l4Match.score.toFixed(1)}分) - ${l4Match.reason}`)
  
  const l4MatchEasy = evaluateDifficultyMatch('L4', 3, 0, '简单计算')
  console.log(`L4, 3步, 0分支: ${l4MatchEasy.status} (${l4MatchEasy.score.toFixed(1)}分) - ${l4MatchEasy.reason}`)
  
  console.log('\n📋 测试 9: 重试机制模拟')
  let attemptCount = 0
  const mockGenerateFn = async (negativeConstraints) => {
    attemptCount++
    console.log(`  [Mock] 第 ${attemptCount} 次生成，负约束数量: ${negativeConstraints.length}`)
    
    if (attemptCount === 1) {
      return testM05_Fail
    }
    return testM05_Q7
  }
  
  const retryResult = await verifyQuestionWithRetry(
    mockGenerateFn, 
    'M05', 
    'L3', 
    [], 
    2,
    (status) => {
      console.log(`  [状态更新] ${status.phase}${status.fitnessScore ? ` (fitnessScore: ${status.fitnessScore.toFixed(1)})` : ''}`)
    }
  )
  console.log(`重试结果: ${retryResult.success ? '✅ 成功' : '❌ 失败'}`)
  console.log(`最终 fitnessScore: ${retryResult.fitnessScore?.toFixed(1)}/5.0`)
  
  console.log('\n' + '='.repeat(80))
  console.log('🧪 Multi-Agent 质检测试完成 - V2.1 紧急修复验证')
  console.log('='.repeat(80))
  
  console.log('\n📊 测试汇总:')
  console.log(`  - 空内容检测: ${!result0.pass && result0.errorType === '题目内容缺失' ? '✅' : '❌'}`)
  console.log(`  - 多结构兼容: ${result0_1.fitnessDetails ? '✅' : '❌'}`)
  console.log(`  - 参数缺失拦截: ${!result0_2.pass && !result0_2.mathPass ? '✅' : '❌'}`)
  console.log(`  - M05 正常情况: ${result1.pass ? '✅' : '❌'} (fitnessScore: ${result1.fitnessScore?.toFixed(1)})`)
  console.log(`  - M05 定值陷阱: ${!result2.pass && !result2.mathPass ? '✅ 正确检测' : '❌ 未检测到'}`)
  console.log(`  - M06 三角函数: ${result3.pass ? '✅' : '❌'} (fitnessScore: ${result3.fitnessScore?.toFixed(1)})`)
  console.log(`  - M15 概率归一: ${result4.pass ? '✅' : '❌'} (fitnessScore: ${result4.fitnessScore?.toFixed(1)})`)
  console.log(`  - M15 概率不归一: ${!result5.pass && !result5.mathPass ? '✅ 正确检测' : '❌ 未检测到'}`)
  console.log(`  - 超纲工具检测: ${result6.fitnessDetails?.syllabusCheck?.detectedTools?.length > 0 ? '✅ 正确检测' : '❌ 未检测到'}`)
  console.log(`  - 区分度检查: ${result7.fitnessDetails?.uniqueness?.status !== 'Duplicate' ? '✅' : '❌'}`)
  console.log(`  - 重试机制: ${retryResult.success ? '✅' : '❌'}`)
}

runTests().catch(console.error)
