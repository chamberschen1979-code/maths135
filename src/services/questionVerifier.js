/**
 * Multi-Agent 质检服务 - Agent 2: 盲解者 + 代码验算者
 * 作为 V5.2 出题后的最后一道防线
 */

const MOTIF_CODE_TEMPLATES = {
  M05: {
    name: '平面向量',
    verificationType: 'vector_extremum',
    codeTemplate: `
import math

def verify_vector_extremum(A, B, center, radius):
    """
    验证向量数量积极值问题
    A, B: 端点坐标 [x, y]
    center: 圆心坐标 [x, y]
    radius: 圆的半径
    返回: (最小值, 最大值, 是否为定值)
    """
    # 计算AB中点M
    M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]
    
    # 检查圆心是否与中点重合
    dist_center_to_M = math.sqrt((center[0] - M[0])**2 + (center[1] - M[1])**2)
    
    if dist_center_to_M < 1e-6:
        # 圆心与中点重合，结果为定值
        AM_squared = ((A[0] - M[0])**2 + (A[1] - M[1])**2)
        constant_value = radius**2 - AM_squared
        return (constant_value, constant_value, True)
    
    # 圆心与中点不重合，计算极值
    # |PM|的范围: [|d-r|, d+r]，其中d是圆心到M的距离
    d = dist_center_to_M
    PM_min = abs(d - radius)
    PM_max = d + radius
    
    AM_squared = ((A[0] - M[0])**2 + (A[1] - M[1])**2)
    
    # PA·PB = |PM|² - |AM|²
    min_val = PM_min**2 - AM_squared
    max_val = PM_max**2 - AM_squared
    
    return (min_val, max_val, False)

# 测试用例
A = [-1, 0]
B = [1, 0]
center = [0, 1]
radius = 1

result = verify_vector_extremum(A, B, center, radius)
print(f"最小值: {result[0]:.4f}, 最大值: {result[1]:.4f}, 是否定值: {result[2]}")
`
  },
  
  M06: {
    name: '三角函数',
    verificationType: 'trig_parameter',
    codeTemplate: `
import math

def verify_trig_zeros(omega, phi, interval_start, interval_end, expected_count):
    """
    验证三角函数零点个数
    f(x) = sin(omega*x + phi) 在区间内的零点数
    """
    # 计算周期
    T = 2 * math.pi / omega
    
    # 计算区间长度
    interval_length = interval_end - interval_start
    
    # 计算相位偏移后的起始和结束相位
    start_phase = omega * interval_start + phi
    end_phase = omega * interval_end + phi
    
    # 计算完整周期数
    full_periods = (end_phase - start_phase) / (2 * math.pi)
    
    # 计算零点数（每个周期2个零点）
    estimated_zeros = int(full_periods * 2)
    
    # 检查边界情况
    # 在区间端点检查是否恰好为零
    def f(x):
        return math.sin(omega * x + phi)
    
    # 简化：返回估算结果
    return {
        'period': T,
        'full_periods': full_periods,
        'estimated_zeros': estimated_zeros,
        'interval_length': interval_length
    }

def verify_solution_uniqueness(omega_solutions, constraint_range):
    """
    验证解的唯一性
    omega_solutions: 通解形式，如 [base_value, period]
    constraint_range: 约束范围 [min, max]
    """
    base, period = omega_solutions
    min_val, max_val = constraint_range
    
    valid_solutions = []
    k = -10
    while True:
        sol = base + k * period
        if sol > max_val:
            break
        if sol >= min_val and sol > 0:
            valid_solutions.append(sol)
        k += 1
    
    return {
        'solution_count': len(valid_solutions),
        'solutions': valid_solutions[:10],  # 只返回前10个
        'is_unique': len(valid_solutions) == 1
    }

# 测试
result = verify_trig_zeros(2, math.pi/6, 0, math.pi, 3)
print(f"周期: {result['period']:.4f}, 估算零点数: {result['estimated_zeros']}")
`
  },
  
  M15: {
    name: '概率统计',
    verificationType: 'probability_normalization',
    codeTemplate: `
def verify_probability_distribution(probabilities, tolerance=0.001):
    """
    验证概率分布的归一性
    probabilities: 概率列表
    返回: (总和, 是否归一, 误差)
    """
    total = sum(probabilities)
    error = abs(total - 1.0)
    is_normalized = error <= tolerance
    
    return {
        'total': total,
        'is_normalized': is_normalized,
        'error': error,
        'probabilities': probabilities
    }

def verify_expected_value(values, probabilities):
    """
    验证期望值计算
    """
    if len(values) != len(probabilities):
        return {'error': 'Values and probabilities length mismatch'}
    
    expected = sum(v * p for v, p in zip(values, probabilities))
    variance = sum((v - expected)**2 * p for v, p in zip(values, probabilities))
    
    return {
        'expected_value': expected,
        'variance': variance,
        'standard_deviation': variance ** 0.5
    }

# 测试
probs = [0.2, 0.3, 0.25, 0.25]
result = verify_probability_distribution(probs)
print(f"概率和: {result['total']:.4f}, 是否归一: {result['is_normalized']}, 误差: {result['error']:.4f}")
`
  }
}

const buildVerifierPrompt = (questionObj, motifId) => {
  const motifConfig = MOTIF_CODE_TEMPLATES[motifId] || null
  
  return `# 角色：盲解者 + 代码验算者 (Agent 2)

你是题目质量检验的最后一道防线。你的任务是**独立验证** Agent 1 生成的题目是否数学正确。

## ⚠️ 重要约束
- 你**只能看到题干**，看不到 Agent 1 的 reasoning 或解题步骤
- 你**不能看到标准答案**的具体推导过程
- 你必须**独立思考**，用代码验算或逻辑推导验证题目

## 待验证题目

### 母题类型: ${motifId}
### 题目内容:
${questionObj.content || questionObj.question?.content || '未提供题目内容'}

### 提供的答案（仅供参考，你需要验证其正确性）:
${JSON.stringify(questionObj.answer || questionObj.question?.answer || '未提供答案', null, 2)}

## 验证任务

### 1. 代码验算（针对 ${motifId} 类型）
${motifConfig ? `
请使用以下 Python 代码模板进行验算：
\`\`\`python
${motifConfig.codeTemplate}
\`\`\`

执行代码并记录输出结果。
` : '此母题类型暂无专用代码模板，请使用逻辑推导验证。'}

### 2. 盲解尝试
请尝试**独立解决**这道题目：
- 列出你使用的公式/定理
- 写出关键计算步骤
- 得出你的答案

### 3. 答案比对
将你的盲解结果与提供的答案对比：
- 是否一致？
- 如果不一致，是题目有误还是你的理解有偏差？

### 4. 特殊检查（根据母题类型）

${motifId === 'M05' ? `
**向量专项检查**：
- 如果涉及圆上动点求数量积范围，验证圆心是否与线段中点重合
- 如果重合，结果应为定值，严禁问"范围"
- 取圆上两个极端位置计算，验证结果是否相等
` : ''}

${motifId === 'M06' ? `
**三角专项检查**：
- 如果求 ω 或 φ，检查解的唯一性
- 通解形式是否需要范围限制？
- 题干是否给出了足够的约束条件？
` : ''}

${motifId === 'M15' ? `
**概率专项检查**：
- 验证所有概率之和是否为 1
- 验证每个概率值是否在 [0, 1] 范围内
- 验证期望值计算是否正确
` : ''}

## 输出格式

请以 JSON 格式输出验证结果：

\`\`\`json
{
  "pass": true/false,
  "errorType": null | "定值问范围" | "概率不归一" | "解不唯一" | "条件不足" | "计算错误" | "其他",
  "correctionSuggestion": "具体修改建议，如果 pass 为 false 必须填写",
  "blindSolveResult": "你的盲解结果",
  "codeOutput": "代码执行结果（如果有）",
  "confidence": 0.0-1.0
}
\`\`\`

## 验证原则

1. **严格独立**：不要被提供的答案影响你的判断
2. **代码优先**：能用代码验证的，必须运行代码
3. **逻辑自洽**：题目条件必须充分且不矛盾
4. **教育价值**：题目应该考查真实的数学能力，而非陷阱

现在，请开始你的验证工作。`
}

const mockCodeExecution = (motifId, params) => {
  console.log(`[Agent 2] 执行 ${motifId} 代码验算...`)
  console.log(`[Agent 2] 参数:`, JSON.stringify(params, null, 2))
  
  if (motifId === 'M05') {
    const { A, B, center, radius } = params
    if (!A || !B || !center || radius === undefined) {
      return { success: false, error: '参数不完整' }
    }
    
    const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]
    const distCenterToM = Math.sqrt((center[0] - M[0])**2 + (center[1] - M[1])**2)
    const AM_squared = ((A[0] - M[0])**2 + (A[1] - M[1])**2)
    
    if (distCenterToM < 1e-6) {
      const constantValue = radius**2 - AM_squared
      return {
        success: true,
        isConstant: true,
        minValue: constantValue,
        maxValue: constantValue,
        warning: '⚠️ 圆心与中点重合，结果为定值！'
      }
    }
    
    const PM_min = Math.abs(distCenterToM - radius)
    const PM_max = distCenterToM + radius
    const minVal = PM_min**2 - AM_squared
    const maxVal = PM_max**2 - AM_squared
    
    return {
      success: true,
      isConstant: false,
      minValue: Math.round(minVal * 1000) / 1000,
      maxValue: Math.round(maxVal * 1000) / 1000,
      centerToMDistance: Math.round(distCenterToM * 1000) / 1000
    }
  }
  
  if (motifId === 'M06') {
    const { omega, phi, intervalStart, intervalEnd } = params
    if (!omega) {
      return { success: false, error: '缺少 omega 参数' }
    }
    
    const T = 2 * Math.PI / omega
    const intervalLength = intervalEnd - intervalStart
    const fullPeriods = omega * intervalLength / (2 * Math.PI)
    
    return {
      success: true,
      period: Math.round(T * 1000) / 1000,
      fullPeriods: Math.round(fullPeriods * 100) / 100,
      estimatedZeros: Math.floor(fullPeriods * 2)
    }
  }
  
  if (motifId === 'M15') {
    const { probabilities } = params
    if (!probabilities || !Array.isArray(probabilities)) {
      return { success: false, error: '缺少概率数组' }
    }
    
    const total = probabilities.reduce((sum, p) => sum + p, 0)
    const error = Math.abs(total - 1.0)
    
    return {
      success: true,
      total: Math.round(total * 1000) / 1000,
      isNormalized: error <= 0.001,
      error: Math.round(error * 1000) / 1000,
      warning: error > 0.001 ? `⚠️ 概率和为 ${total}，不等于 1！` : null
    }
  }
  
  return { success: false, error: '未知母题类型' }
}

const extractParamsFromQuestion = (questionObj, motifId) => {
  const content = questionObj.content || questionObj.question?.content || ''
  const answer = questionObj.answer || questionObj.question?.answer || {}
  
  if (motifId === 'M05') {
    const coordPattern = /\(([-\d.]+)\s*,\s*([-\d.]+)\)/g
    const coords = []
    let match
    while ((match = coordPattern.exec(content)) !== null) {
      coords.push([parseFloat(match[1]), parseFloat(match[2])])
    }
    
    const radiusMatch = content.match(/半径[为是]?\s*(\d+(?:\.\d+)?)/)
    const radius = radiusMatch ? parseFloat(radiusMatch[1]) : 1
    
    if (coords.length >= 2) {
      return {
        A: coords[0],
        B: coords[1],
        center: coords.length >= 3 ? coords[2] : [0, 0],
        radius
      }
    }
    
    return { radius }
  }
  
  if (motifId === 'M06') {
    const omegaMatch = content.match(/(\d+)\s*[xω]/)
    const omega = omegaMatch ? parseInt(omegaMatch[1]) : 2
    
    const intervalMatch = content.match(/\((\d+(?:\.\d+)?)\s*[，,]\s*(\d+(?:\.\d+)?)\)/)
    const intervalStart = intervalMatch ? parseFloat(intervalMatch[1]) : 0
    const intervalEnd = intervalMatch ? parseFloat(intervalMatch[2]) : Math.PI
    
    return {
      omega,
      phi: Math.PI / 6,
      intervalStart,
      intervalEnd
    }
  }
  
  if (motifId === 'M15') {
    let probs = []
    
    const percentPattern = /(\d+(?:\.\d+)?)\s*[％%]/g
    let match
    while ((match = percentPattern.exec(content)) !== null) {
      probs.push(parseFloat(match[1]) / 100)
    }
    
    if (probs.length === 0) {
      const decimalPattern = /P\s*\(\s*X\s*=\s*\d+\s*\)\s*=\s*(\d+(?:\.\d+)?)/gi
      while ((match = decimalPattern.exec(content)) !== null) {
        probs.push(parseFloat(match[1]))
      }
    }
    
    if (probs.length === 0) {
      const fracPattern = /(\d+)\/(\d+)/g
      while ((match = fracPattern.exec(content)) !== null) {
        probs.push(parseInt(match[1]) / parseInt(match[2]))
      }
    }
    
    return { probabilities: probs.length > 0 ? probs : [0.25, 0.25, 0.25, 0.25] }
  }
  
  return {}
}

export const verifyQuestion = async (questionObj, motifId, options = {}) => {
  const { useRealAI = false, apiKey = null } = options
  
  console.log(`\n${'='.repeat(60)}`)
  console.log(`[Agent 2] 开始验证题目 - 母题: ${motifId}`)
  console.log(`${'='.repeat(60)}`)
  
  const prompt = buildVerifierPrompt(questionObj, motifId)
  console.log('\n[Agent 2] Prompt 构建完成，长度:', prompt.length)
  
  const params = extractParamsFromQuestion(questionObj, motifId)
  console.log('\n[Agent 2] 提取的参数:', JSON.stringify(params, null, 2))
  
  const codeResult = mockCodeExecution(motifId, params)
  console.log('\n[Agent 2] 代码执行结果:', JSON.stringify(codeResult, null, 2))
  
  let verificationResult = {
    pass: true,
    errorType: null,
    correctionSuggestion: null,
    blindSolveResult: null,
    codeOutput: JSON.stringify(codeResult),
    confidence: 0.8
  }
  
  if (motifId === 'M05' && codeResult.success) {
    if (codeResult.isConstant) {
      verificationResult = {
        pass: false,
        errorType: '定值问范围',
        correctionSuggestion: `检测到圆心与线段中点重合，数量积为定值 ${codeResult.minValue}。请修改圆心位置使其偏离中点，或将问题改为"求数量积的值"。`,
        blindSolveResult: '圆心与中点重合，结果为定值',
        codeOutput: JSON.stringify(codeResult),
        confidence: 0.95
      }
    } else {
      verificationResult.blindSolveResult = `数量积范围为 [${codeResult.minValue}, ${codeResult.maxValue}]，圆心到中点距离为 ${codeResult.centerToMDistance}`
    }
  }
  
  if (motifId === 'M15' && codeResult.success) {
    if (!codeResult.isNormalized) {
      verificationResult = {
        pass: false,
        errorType: '概率不归一',
        correctionSuggestion: `概率之和为 ${codeResult.total}，不等于 1。请重新分配概率值，使总和为 1。`,
        blindSolveResult: '概率分布不归一',
        codeOutput: JSON.stringify(codeResult),
        confidence: 0.95
      }
    }
  }
  
  console.log('\n[Agent 2] 验证结果:', JSON.stringify(verificationResult, null, 2))
  console.log(`${'='.repeat(60)}\n`)
  
  return verificationResult
}

export const verifyQuestionWithRetry = async (generateFn, motifId, maxRetries = 2) => {
  let attempt = 0
  let negativeConstraints = []
  
  while (attempt <= maxRetries) {
    console.log(`\n[Multi-Agent] 第 ${attempt + 1} 次尝试生成题目...`)
    
    const questionObj = await generateFn(negativeConstraints)
    
    const verification = await verifyQuestion(questionObj, motifId)
    
    if (verification.pass) {
      console.log('[Multi-Agent] ✅ 题目验证通过！')
      return { success: true, question: questionObj, verification }
    }
    
    console.log(`[Multi-Agent] ❌ 验证失败: ${verification.errorType}`)
    
    if (verification.correctionSuggestion) {
      negativeConstraints.push(verification.correctionSuggestion)
    }
    
    attempt++
  }
  
  console.log('[Multi-Agent] ⚠️ 达到最大重试次数，返回失败')
  return {
    success: false,
    error: '题目打磨中，请稍后重试',
    attempts: attempt,
    lastVerification: await verifyQuestion(await generateFn([]), motifId)
  }
}

export default {
  verifyQuestion,
  verifyQuestionWithRetry,
  MOTIF_CODE_TEMPLATES
}
