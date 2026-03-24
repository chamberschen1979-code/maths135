/**
 * M03 函数概念与性质 - 策略模块
 * 
 * 支持的题型：
 * - quadratic_axis_interval: 轴动区间定 / 区间动轴定 (最值问题)
 * - quadratic_root_distribution: 根的分布 (零点位置)
 * - quadratic_inequality_always_true: 恒成立/存在性问题
 * - quadratic_composite_mono: 复合函数单调性 (对数/绝对值嵌套)
 */

import { format, abs as mathAbs, sqrt, pow } from 'mathjs'

/**
 * 解析数字（支持分数、根号、简单表达式）
 */
const parseNumber = (str) => {
  if (!str) return null
  str = str.trim().replace(/\s/g, '')
  
  try {
    // 处理简单分数 a/b
    if (str.includes('/') && !str.includes('sqrt')) {
      const parts = str.split('/')
      if (parts.length === 2) {
        const num = parseFloat(parts[0])
        const den = parseFloat(parts[1])
        return den !== 0 ? num / den : null
      }
    }
    
    // 处理简单根号 sqrt(n)
    if (str.includes('sqrt')) {
      const match = str.match(/sqrt\((\d+)\)/)
      if (match) return Math.sqrt(parseInt(match[1]))
    }

    return parseFloat(str)
  } catch (e) {
    console.warn(`[M03 策略] 数值解析失败: "${str}"`)
    return null
  }
}

/**
 * 标准化内容 - 清理 LaTeX 和 Unicode
 */
const normalizeContent = (content) => {
  return content
    .replace(/\\+/g, '') // 去掉反斜杠
    .replace(/[\{\}]/g, '') // 去掉花括号
    .replace(/\s+/g, ' ') // 统一空格
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/≠/g, '!=')
    .replace(/x\^2/g, 'x^2')
    .replace(/ax\^2/g, 'ax^2')
    .trim()
}

/**
 * 提取二次函数核心参数
 */
const extractQuadraticParams = (content) => {
  const normalized = normalizeContent(content)
  const params = {
    a: null,
    b: null,
    c: null,
    interval: null,
    axis: null,
    hasParameter: /a|b|c|m|k|λ/.test(content),
    isComposite: /log|abs|sqrt/.test(content),
    questionType: null // 'range', 'value', 'always_true', 'root_dist'
  }

  // 1. 识别函数解析式 f(x) = ax^2 + bx + c
  // 匹配模式：ax^2, x^2, -x^2, +bx, -bx, +c, -c
  const funcPatterns = [
    /f\(x\)\s*=\s*(-?\d*\.?\d*)?\s*\*?\s*x\^2\s*([+-]\s*\d*\.?\d*)?\s*\*?\s*x\s*([+-]\s*\d*\.?\d*)?/i,
    /y\s*=\s*(-?\d*\.?\d*)?\s*\*?\s*x\^2\s*([+-]\s*\d*\.?\d*)?\s*\*?\s*x\s*([+-]\s*\d*\.?\d*)?/i,
    // 含参情况：ax^2 + bx + c
    /f\(x\)\s*=\s*([a-z])\s*\*?\s*x\^2\s*([+-]\s*[a-z\d]*\.?\d*)?\s*\*?\s*x\s*([+-]\s*[a-z\d]*\.?\d*)?/i
  ]

  for (const pattern of funcPatterns) {
    const match = normalized.match(pattern)
    if (match) {
      const [, aStr, bStr, cStr] = match
      params.a = aStr ? (aStr === '-' ? -1 : (aStr === '+' ? 1 : parseNumber(aStr.replace('*', '')))) : 1
      params.b = bStr ? parseNumber(bStr.replace('*', '').replace('+', '')) : 0
      params.c = cStr ? parseNumber(cStr.replace('*', '').replace('+', '')) : 0
      
      // 计算对称轴 x = -b/2a
      if (params.a !== 0 && params.b !== null) {
        params.axis = -params.b / (2 * params.a)
      }
      console.log(`[M03 策略] 提取解析式: a=${params.a}, b=${params.b}, c=${params.c}, 轴=${params.axis}`)
      break
    }
  }

  // 2. 提取区间 [m, n]
  const intervalPatterns = [
    /\[\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\]/,
    /区间\s*\[\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\]/,
    /x\s*∈\s*\[\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\]/
  ]
  
  for (const pattern of intervalPatterns) {
    const match = normalized.match(pattern)
    if (match) {
      params.interval = [parseFloat(match[1]), parseFloat(match[2])]
      break
    }
  }

  // 3. 识别问题类型
  if (/取值范围 | 最值 | 最大 | 最小/.test(content)) params.questionType = 'range'
  else if (/恒成立 | 任意 | 所有/.test(content)) params.questionType = 'always_true'
  else if (/恰有 | 根 | 零点 | 交点/.test(content)) params.questionType = 'root_dist'
  else if (/求.*值 | 计算/.test(content)) params.questionType = 'value'

  return params
}

/**
 * 提取参数
 */
const extractParams = (typeLabel, content, features) => {
  console.log(`[M03 策略] 提取参数 - 类型: ${typeLabel}`)
  
  const quadParams = extractQuadraticParams(content)
  
  // 🛡️ 全局 L3/L4 保护伞：检测题目复杂度
  const isL3Complexity = /参数 | 讨论 | 范围 | 恒成立 | 恰有 | 复合/.test(content)
  const defaultScore = isL3Complexity ? 4.0 : 3.5

  switch (typeLabel) {
    case 'quadratic_axis_interval':
      // 轴动区间定：必须提取到区间和参数 a 或 b
      if (quadParams.interval && (quadParams.hasParameter || quadParams.axis !== null)) {
        return {
          type: 'quadratic_axis_interval',
          skipMathCheck: false,
          ...quadParams,
          verificationMethod: 'extreme_point_check'
        }
      }
      return {
        type: 'quadratic_axis_interval',
        skipMathCheck: true,
        requiresLLMCheck: true,
        potentialScore: defaultScore,
        reason: '无法提取完整区间或参数，需 LLM 验算分类讨论逻辑'
      }

    case 'quadratic_root_distribution':
      // 根的分布：需要判别式逻辑
      return {
        type: 'quadratic_root_distribution',
        skipMathCheck: !(quadParams.a && quadParams.b && quadParams.c),
        ...quadParams,
        verificationMethod: 'discriminant_check'
      }

    case 'quadratic_inequality_always_true':
      // 恒成立：重点检查 a=0 退化情况
      return {
        type: 'quadratic_inequality_always_true',
        skipMathCheck: true, // 逻辑复杂，主要靠 LLM
        requiresLLMCheck: true,
        ...quadParams,
        potentialScore: defaultScore + 0.5, // 恒成立通常较难
        reason: '需 LLM 验证 a=0 退化及 Δ 讨论'
      }

    case 'quadratic_composite_mono':
      return {
        type: 'quadratic_composite_mono',
        skipMathCheck: true,
        requiresLLMCheck: true,
        ...quadParams,
        reason: '复合函数需 LLM 验证定义域优先原则'
      }

    default:
      const isHardLooking = /二次 | 抛物线 | 最值 | 范围 | 恒成立/.test(content)
      if (isHardLooking) {
        return {
          type: 'unknown_but_hard',
          skipMathCheck: true,
          requiresLLMCheck: true,
          potentialScore: 3.8,
          reason: '未识别具体题型，但涉及二次函数核心考点，允许 LLM 验算'
        }
      }
      return { type: 'unknown', skipMathCheck: true, reason: 'M03 未知题型' }
  }
}

/**
 * 验算函数
 */
const verify = (typeLabel, params, aiAnswer) => {
  console.log(`[M03 策略] 验算 - 类型: ${typeLabel}`)
  
  const calculationLog = []
  const logCalc = (step, result) => {
    const entry = `[${step}] = ${typeof result === 'number' ? format(result, { precision: 14 }) : JSON.stringify(result)}`
    calculationLog.push(entry)
    console.log(`[M03 策略] 📐 ${entry}`)
  }

  if (params.skipMathCheck) {
    return {
      pass: true,
      skipMathCheck: true,
      type: params.type,
      message: params.reason || '需要 LLM 验算',
      calculationLog,
      requiresLLMCheck: params.requiresLLMCheck || true,
      potentialScore: params.potentialScore || null
    }
  }

  // 1. 最值/范围问题验算 (轴动区间定)
  if (typeLabel === 'quadratic_axis_interval' && params.verificationMethod === 'extreme_point_check') {
    return verifyAxisInterval(params, logCalc, calculationLog)
  }

  // 2. 根的分布验算 (判别式)
  if (typeLabel === 'quadratic_root_distribution' && params.verificationMethod === 'discriminant_check') {
    return verifyRootDistribution(params, logCalc, calculationLog)
  }

  return { pass: false, error: '参数不完整或题型不匹配', calculationLog }
}

/**
 * 验算：轴动区间定 (最值问题)
 * 核心逻辑：选取区间的两个端点和对称轴（如果在区间内），计算函数值，验证最值是否在预期位置
 */
const verifyAxisInterval = (params, logCalc, calculationLog) => {
  const { a, b, c, interval, axis } = params
  if (!interval) return { pass: false, error: '缺少区间信息', calculationLog }

  const [start, end] = interval
  const f = (x) => a * x * x + b * x + c

  logCalc('函数', `f(x) = ${a}x^2 + ${b}x + ${c}`)
  logCalc('区间', `[${start}, ${end}]`)
  logCalc('对称轴', axis)

  // 计算关键点函数值
  const valStart = f(start)
  const valEnd = f(end)
  logCalc(`f(${start})`, valStart)
  logCalc(`f(${end})`, valEnd)

  let valAxis = null
  let isAxisInside = false
  
  // 如果对称轴在区间内，计算顶点值
  if (axis !== null && axis >= start && axis <= end) {
    isAxisInside = true
    valAxis = f(axis)
    logCalc(`f(轴=${axis})`, valAxis)
  } else {
    logCalc('对称轴位置', '在区间外')
  }

  // 理论最值推导
  let theoreticalMin, theoreticalMax
  
  if (a > 0) {
    // 开口向上：最小值在顶点（若在区间内）或离轴近端点；最大值在离轴远端点
    theoreticalMin = isAxisInside ? valAxis : Math.min(valStart, valEnd)
    theoreticalMax = Math.max(valStart, valEnd)
  } else if (a < 0) {
    // 开口向下：最大值在顶点（若在区间内）或离轴近端点；最小值在离轴远端点
    theoreticalMax = isAxisInside ? valAxis : Math.max(valStart, valEnd)
    theoreticalMin = Math.min(valStart, valEnd)
  } else {
    // a=0 退化为一次函数 (此处仅作防御，实际应由 LLM 处理)
    theoreticalMin = Math.min(valStart, valEnd)
    theoreticalMax = Math.max(valStart, valEnd)
  }

  logCalc('理论最小值', theoreticalMin)
  logCalc('理论最大值', theoreticalMax)

  // 🛑 动态性熔断测试：如果题目问"范围"，但最大值等于最小值，说明是定值，报错！
  if (Math.abs(theoreticalMax - theoreticalMin) < 1e-9) {
    return {
      pass: false,
      error: '致命错误：目标量为定值，严禁问"取值范围"',
      calculationLog,
      suggestion: '修改几何构型或变式方向，确保目标量随参数变化'
    }
  }

  return {
    pass: true,
    skipMathCheck: false,
    message: `最值逻辑自洽。区间内函数值范围约为 [${theoreticalMin.toFixed(4)}, ${theoreticalMax.toFixed(4)}]`,
    theoreticalRange: [theoreticalMin, theoreticalMax],
    calculationLog
  }
}

/**
 * 验算：根的分布 (判别式检查)
 * 核心逻辑：计算 Δ，验证是否有实根
 */
const verifyRootDistribution = (params, logCalc, calculationLog) => {
  const { a, b, c } = params
  if (a === 0) {
    return { pass: true, message: '退化为一次方程，跳过判别式检查', calculationLog }
  }

  const delta = b * b - 4 * a * c
  logCalc('判别式 Δ', delta)
  logCalc('sqrt(Δ)', delta >= 0 ? sqrt(delta) : '无实根')

  if (delta < 0) {
    return {
      pass: false,
      error: '数据矛盾：Δ < 0，方程无实根，不可能有"根的分布"问题',
      calculationLog
    }
  }

  return {
    pass: true,
    skipMathCheck: false,
    message: `判别式校验通过：Δ = ${delta.toFixed(4)} >= 0，存在实根`,
    delta,
    calculationLog
  }
}

export default {
  motifId: 'M03',
  typeLabels: [
    'quadratic_axis_interval',
    'quadratic_root_distribution',
    'quadratic_inequality_always_true',
    'quadratic_composite_mono'
  ],
  extractParams,
  verify
}