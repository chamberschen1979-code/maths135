/**
 * Multi-Agent 质检测试脚本
 * 测试 V5.2 出题 + Agent 2 代码盲测的双重保险系统
 */

import { verifyQuestion, verifyQuestionWithRetry } from './questionVerifier.js'

// 测试用例 1: M05 向量最值问题（圆心与中点不重合 - 应该通过）
const testM05_Q7 = {
  content: `（1）已知点 $A(-1,0), B(1,0)$，点 $P$ 在圆 $x^2+(y-1)^2=1$ 上运动，求 $\\overrightarrow{PA} \\cdot \\overrightarrow{PB}$ 的取值范围。
（2）若圆的半径变为 $r$ ($r>0$)，圆心仍为 $(0,1)$，求 $\\overrightarrow{PA} \\cdot \\overrightarrow{PB}$ 的最大值与最小值之差关于 $r$ 的函数解析式。`,
  answer: {
    l1: "$[-1, 3]$",
    l2: "当 $0<r\\le 1$ 时差为 $4r$；当 $r>1$ 时差为 $4r$"
  }
}

// 测试用例 2: M05 向量最值问题（圆心与中点重合 - 应该失败）
const testM05_Fail = {
  content: `已知点 $A(-1,0), B(1,0)$，点 $P$ 在圆 $x^2+y^2=1$ 上运动，求 $\\overrightarrow{PA} \\cdot \\overrightarrow{PB}$ 的取值范围。`,
  answer: {
    l1: "$[-1, 1]$"
  }
}

// 测试用例 3: M06 三角函数问题
const testM06_Q2 = {
  content: `已知函数 $f(x) = \\sin(2x + \\frac{\\pi}{6})$ 在区间 $(0, \\pi)$ 内恰有 3 个零点，求 $\\omega$ 的值。`,
  answer: {
    l1: "$\\omega = 2$"
  }
}

// 测试用例 4: M15 概率问题（概率和为 1 - 应该通过）
const testM15_Pass = {
  content: `某随机变量 X 的分布列为：P(X=1)=0.2, P(X=2)=0.3, P(X=3)=0.25, P(X=4)=0.25，求 E(X)。`,
  answer: {
    l1: "$E(X) = 2.55$"
  }
}

// 测试用例 5: M15 概率问题（概率和不归一 - 应该失败）
const testM15_Fail = {
  content: `某随机变量 X 的分布列为：P(X=1)=0.3, P(X=2)=0.4, P(X=3)=0.3, P(X=4)=0.2，求 E(X)。`,
  answer: {
    l1: "$E(X) = 2.5$"
  }
}

const runTests = async () => {
  console.log('\n' + '='.repeat(80))
  console.log('🧪 Multi-Agent 质检测试开始')
  console.log('='.repeat(80))
  
  // 测试 1: M05 正常情况
  console.log('\n📋 测试 1: M05 向量最值（圆心偏离中点 - 应通过）')
  const result1 = await verifyQuestion(testM05_Q7, 'M05')
  console.log(`结果: ${result1.pass ? '✅ 通过' : '❌ 失败'}`)
  if (!result1.pass) {
    console.log(`错误类型: ${result1.errorType}`)
    console.log(`修改建议: ${result1.correctionSuggestion}`)
  }
  
  // 测试 2: M05 定值陷阱
  console.log('\n📋 测试 2: M05 向量最值（圆心与中点重合 - 应失败）')
  const result2 = await verifyQuestion(testM05_Fail, 'M05')
  console.log(`结果: ${result2.pass ? '✅ 通过' : '❌ 失败'}`)
  if (!result2.pass) {
    console.log(`错误类型: ${result2.errorType}`)
    console.log(`修改建议: ${result2.correctionSuggestion}`)
  }
  
  // 测试 3: M06 三角函数
  console.log('\n📋 测试 3: M06 三角函数零点问题')
  const result3 = await verifyQuestion(testM06_Q2, 'M06')
  console.log(`结果: ${result3.pass ? '✅ 通过' : '❌ 失败'}`)
  console.log(`盲解结果: ${result3.blindSolveResult}`)
  
  // 测试 4: M15 概率归一（正常）
  console.log('\n📋 测试 4: M15 概率分布（归一 - 应通过）')
  const result4 = await verifyQuestion(testM15_Pass, 'M15')
  console.log(`结果: ${result4.pass ? '✅ 通过' : '❌ 失败'}`)
  
  // 测试 5: M15 概率不归一
  console.log('\n📋 测试 5: M15 概率分布（不归一 - 应失败）')
  const result5 = await verifyQuestion(testM15_Fail, 'M15')
  console.log(`结果: ${result5.pass ? '✅ 通过' : '❌ 失败'}`)
  if (!result5.pass) {
    console.log(`错误类型: ${result5.errorType}`)
    console.log(`修改建议: ${result5.correctionSuggestion}`)
  }
  
  // 测试 6: 重试机制
  console.log('\n📋 测试 6: 重试机制模拟')
  let attemptCount = 0
  const mockGenerateFn = async (negativeConstraints) => {
    attemptCount++
    console.log(`  [Mock] 第 ${attemptCount} 次生成，负约束数量: ${negativeConstraints.length}`)
    
    if (attemptCount === 1) {
      return testM05_Fail  // 第一次返回有问题的题目
    }
    return testM05_Q7  // 第二次返回正确的题目
  }
  
  const retryResult = await verifyQuestionWithRetry(mockGenerateFn, 'M05', 2)
  console.log(`重试结果: ${retryResult.success ? '✅ 成功' : '❌ 失败'}`)
  if (retryResult.success) {
    console.log(`总尝试次数: ${attemptCount}`)
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('🧪 Multi-Agent 质检测试完成')
  console.log('='.repeat(80))
  
  // 汇总
  console.log('\n📊 测试汇总:')
  console.log(`  - M05 正常情况: ${result1.pass ? '✅' : '❌'}`)
  console.log(`  - M05 定值陷阱: ${!result2.pass ? '✅ 正确检测' : '❌ 未检测到'}`)
  console.log(`  - M06 三角函数: ${result3.pass ? '✅' : '❌'}`)
  console.log(`  - M15 概率归一: ${result4.pass ? '✅' : '❌'}`)
  console.log(`  - M15 概率不归一: ${!result5.pass ? '✅ 正确检测' : '❌ 未检测到'}`)
  console.log(`  - 重试机制: ${retryResult.success ? '✅' : '❌'}`)
}

runTests().catch(console.error)
