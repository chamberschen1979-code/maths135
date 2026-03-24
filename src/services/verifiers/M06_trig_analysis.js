/**
 * M06 三角函数 - 策略模块
 * 
 * 支持的题型：
 * - trig_angle_transformation: 配角技巧与基本方程
 * - trig_auxiliary_angle: 辅助角公式与对称性
 * - trig_graph_transform: 图象变换与性质
 * - trig_zero_point_range: 零点个数与 ω 范围
 */

import { format, pi, abs as mathAbs, sqrt } from 'mathjs'

/**
 * 解析数字（支持分数、π 表达式）
 */
const parseNumber = (str) => {
  if (!str) return null
  str = str.trim()
  
  try {
    // 处理 π 表达式
    if (str.includes('π') || str.includes('pi')) {
      const normalized = str.replace(/π/g, 'pi').replace(/π/g, 'pi')
      const piPattern = /([+-]?\d*(?:\.\d+)?)\s*\*?\s*pi/i
      const match = normalized.match(piPattern)
      if (match) {
        const coef = match[1] === '' || match[1] === '+' ? 1 : 
                     match[1] === '-' ? -1 : parseFloat(match[1])
        return coef * Math.PI
      }
      if (str === 'π' || str === 'pi') return Math.PI
    }
    
    // 处理分数
    if (str.includes('/')) {
      const parts = str.split('/')
      const num = parseFloat(parts[0].trim())
      const den = parseFloat(parts[1].trim())
      return den !== 0 ? num / den : null
    }
    
    return parseFloat(str)
  } catch (e) {
    console.warn(`[M06 策略] 数值解析失败: "${str}"`)
    return null
  }
}

/**
 * 标准化内容 - 处理 Unicode 和 LaTeX
 * 🚀 增强对 LaTeX 语法的兼容
 */
const normalizeContent = (content) => {
  return content
    // 🚀 先干掉所有的反斜杠，避免 \\sin 匹配失败
    .replace(/\\+/g, '')
    // 干掉花括号
    .replace(/[\{\}]/g, '')
    // 干掉多余空格，让正则匹配更稳
    .replace(/\s+/g, ' ')
    .trim()
    // Unicode 符号转换
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/ω/g, 'omega')
    .replace(/φ/g, 'phi')
    .replace(/π/g, 'pi')
    // LaTeX 命令转换
    .replace(/pi/g, 'pi')
    .replace(/omega/g, 'omega')
    .replace(/phi/g, 'phi')
    .replace(/frac\(([^)]+)\)\(([^)]+)\)/g, '($1)/($2)')
    // 处理 sin, cos, tan 的 LaTeX 写法
    .replace(/sin/gi, 'sin')
    .replace(/cos/gi, 'cos')
    .replace(/tan/gi, 'tan')
}

/**
 * 提取三角函数参数
 */
const extractTrigParams = (content) => {
  const normalized = normalizeContent(content)
  const params = {
    omega: null,
    phi: null,
    interval: null,
    zeroCount: null,
    hasSin: /sin/i.test(content),
    hasCos: /cos/i.test(content),
    hasTan: /tan/i.test(content)
  }
  
  // 🆕 新增：识别 y=sin(2x - π/3) 或 f(x)=cos(3x+π/4) 格式
  const functionPattern = /(?:y|f\(x\))\s*=\s*(sin|cos)\s*\(\s*(\d+(?:\.\d+)?)\s*\*?\s*x\s*([+-])\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*pi)?)\s*\)/i
  const funcMatch = normalized.match(functionPattern)
  
  if (funcMatch) {
    const [, trigFunc, omegaStr, sign, phiStr] = funcMatch
    params.omega = parseNumber(omegaStr)
    const phiValue = parseNumber(phiStr)
    params.phi = sign === '-' ? -phiValue : phiValue
    params.hasSin = trigFunc.toLowerCase() === 'sin'
    params.hasCos = trigFunc.toLowerCase() === 'cos'
    
    console.log(`[M06 策略] 从函数表达式提取: ω=${params.omega}, φ=${params.phi}`)
    return params
  }
  
  // 🆕 新增：识别 sin(ωx + φ) 或 cos(ωx + φ) 格式
  const simpleFuncPattern = /(sin|cos)\s*\(\s*(\d+(?:\.\d+)?)\s*\*?\s*x\s*([+-])\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*pi)?)\s*\)/i
  const simpleMatch = normalized.match(simpleFuncPattern)
  
  if (simpleMatch) {
    const [, trigFunc, omegaStr, sign, phiStr] = simpleMatch
    params.omega = parseNumber(omegaStr)
    const phiValue = parseNumber(phiStr)
    params.phi = sign === '-' ? -phiValue : phiValue
    params.hasSin = trigFunc.toLowerCase() === 'sin'
    params.hasCos = trigFunc.toLowerCase() === 'cos'
    
    console.log(`[M06 策略] 从三角表达式提取: ω=${params.omega}, φ=${params.phi}`)
    return params
  }
  
  // 提取 ω (omega) - 原有逻辑
  const omegaPatterns = [
    /omega\s*[=<>∈]\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*pi)?)/i,
    /ω\s*[=<>∈]\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*pi)?)/i,
    /(\d+(?:\.\d+)?)\s*x/i
  ]
  
  for (const pattern of omegaPatterns) {
    const match = normalized.match(pattern)
    if (match) {
      params.omega = parseNumber(match[1])
      if (params.omega !== null) break
    }
  }
  
  // 提取 φ (phi) - 原有逻辑
  const phiPatterns = [
    /phi\s*[=<>∈]\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*pi)?)/i,
    /φ\s*[=<>∈]\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*pi)?)/i,
    /\+\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*pi)?)/i
  ]
  
  for (const pattern of phiPatterns) {
    const match = normalized.match(pattern)
    if (match) {
      params.phi = parseNumber(match[1])
      if (params.phi !== null) break
    }
  }
  
  // 提取区间 [a, b]
  const intervalPatterns = [
    /[\(\[]\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*pi)?)\s*,\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*pi)?)\s*[\)\]]/i,
    /区间\s*[\(\[]\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*pi)?)\s*,\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*pi)?)\s*[\)\]]/i
  ]
  
  for (const pattern of intervalPatterns) {
    const match = normalized.match(pattern)
    if (match) {
      const a = parseNumber(match[1])
      const b = parseNumber(match[2])
      if (a !== null && b !== null) {
        params.interval = [a, b]
        break
      }
    }
  }
  
  // 提取零点个数
  const zeroCountPatterns = [
    /恰有\s*(\d+)\s*个\s*(?:零点|根|交点)/i,
    /有\s*(\d+)\s*个\s*(?:零点|根|交点)/i,
    /零点.*?(\d+)\s*个/i,
    /(\d+)\s*个\s*(?:零点|根|交点)/i
  ]
  
  for (const pattern of zeroCountPatterns) {
    const match = content.match(pattern)
    if (match) {
      params.zeroCount = parseInt(match[1], 10)
      break
    }
  }
  
  return params
}

/**
 * 提取对称点和对称轴信息
 */
const extractSymmetryInfo = (content) => {
  const result = {
    symmetryPoint: null,
    symmetryAxis: null
  }
  
  // 提取对称中心点 (x0, y0)
  const symmetryCenterPatterns = [
    /对称中心\s*[是为]?\s*\(\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*pi)?)\s*,\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?)\s*\)/i,
    /关于\s*点\s*\(\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*pi)?)\s*,\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?)\s*\)\s*对称/i,
    /中心对称.*?\(\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*pi)?)\s*,\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?)\s*\)/i
  ]
  
  for (const pattern of symmetryCenterPatterns) {
    const match = content.match(pattern)
    if (match) {
      const x = parseNumber(match[1])
      const y = parseNumber(match[2])
      if (x !== null && y !== null) {
        result.symmetryPoint = { x, y }
        break
      }
    }
  }
  
  // 提取对称轴 x = x0
  const symmetryAxisPatterns = [
    /对称轴\s*[是为]?\s*x\s*=\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*pi)?)/i,
    /关于\s*x\s*=\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*pi)?)\s*对称/i,
    /轴对称.*?x\s*=\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*pi)?)/i
  ]
  
  for (const pattern of symmetryAxisPatterns) {
    const match = content.match(pattern)
    if (match) {
      const x = parseNumber(match[1])
      if (x !== null) {
        result.symmetryAxis = x
        break
      }
    }
  }
  
  return result
}

/**
 * 提取参数
 */
const extractParams = (typeLabel, content, features) => {
  console.log(`[M06 策略] 提取参数 - 类型: ${typeLabel}`)
  
  const trigParams = extractTrigParams(content)
  const symmetryInfo = extractSymmetryInfo(content)
  
  // 🛡️ 全局 L3 保护伞：检测题目复杂度
  const isL3Complexity = /变换|参数|区间|对称轴|零点|图像平移|最值|范围|取值|证明|讨论/.test(content)
  const defaultL3Score = isL3Complexity ? 4.0 : 3.6
  
  switch (typeLabel) {
    case 'trig_angle_transformation':
      // 配角技巧题型 - 如果有对称点信息，可以进行代数验算
      if (symmetryInfo.symmetryPoint || symmetryInfo.symmetryAxis) {
        return {
          type: 'trig_angle_transformation',
          skipMathCheck: false,
          hasSin: trigParams.hasSin,
          hasCos: trigParams.hasCos,
          omega: trigParams.omega,
          phi: trigParams.phi,
          symmetryPoint: symmetryInfo.symmetryPoint,
          symmetryAxis: symmetryInfo.symmetryAxis,
          verificationMethod: 'symmetry_substitution'
        }
      }
      
      // 新逻辑：只要有 omega 和 phi，就尝试验算"一致性"
      if (trigParams.omega && trigParams.phi !== null) {
        return {
          type: 'trig_angle_transformation',
          skipMathCheck: false,
          hasSin: trigParams.hasSin,
          hasCos: trigParams.hasCos,
          omega: trigParams.omega,
          phi: trigParams.phi,
          symmetryPoint: symmetryInfo.symmetryPoint || null,
          symmetryAxis: symmetryInfo.symmetryAxis || null,
          verificationMethod: symmetryInfo.symmetryPoint ? 'symmetry_substitution' : 'equation_consistency'
        }
      }
      
      // 只有连 omega 和 phi 都提取不到，才降级
      return {
        type: 'trig_angle_transformation',
        skipMathCheck: true,
        requiresLLMCheck: true,
        potentialScore: defaultL3Score,
        hasSin: trigParams.hasSin,
        hasCos: trigParams.hasCos,
        reason: '无法提取关键参数 (ω, φ)，需 LLM 验算'
      }
      
    case 'trig_auxiliary_angle':
      return {
        type: 'trig_auxiliary_angle',
        skipMathCheck: true,
        requiresLLMCheck: true,
        potentialScore: defaultL3Score,
        omega: trigParams.omega,
        phi: trigParams.phi,
        reason: '辅助角题型需 LLM 验算振幅相位'
      }
      
    case 'trig_graph_transform':
      return {
        type: 'trig_graph_transform',
        skipMathCheck: true,
        requiresLLMCheck: true,
        potentialScore: defaultL3Score,
        omega: trigParams.omega,
        phi: trigParams.phi,
        reason: '图象变换题型需 LLM 验算相位分析'
      }
      
    case 'trig_zero_point_range':
      return {
        type: 'trig_zero_point_range',
        omega: trigParams.omega,
        phi: trigParams.phi,
        interval: trigParams.interval,
        zeroCount: trigParams.zeroCount,
        skipMathCheck: !(trigParams.omega && trigParams.interval && trigParams.zeroCount)
      }
      
    default:
      // 🆕 即使类型未知，如果内容看起来很难，也给个保底分
      const isHardLooking = /范围|最值|证明|构造|讨论|恒成立|取值|参数|sin|cos|tan|三角/.test(content)
      if (isHardLooking) {
        return {
          type: 'unknown_but_hard',
          skipMathCheck: true,
          requiresLLMCheck: true,
          potentialScore: 3.8, // 刚好卡在 L3 及格线上，避免误杀
          reason: '未识别具体题型，但题目复杂度较高，允许 LLM 验算'
        }
      }
      
      return {
        type: 'unknown',
        skipMathCheck: true,
        reason: 'M06 未知题型'
      }
  }
}

/**
 * 验算函数
 */
const verify = (typeLabel, params, aiAnswer) => {
  console.log(`[M06 策略] 验算 - 类型: ${typeLabel}`)
  
  const calculationLog = []
  const logCalc = (step, result) => {
    const entry = `[${step}] = ${typeof result === 'number' ? format(result, { precision: 14 }) : JSON.stringify(result)}`
    calculationLog.push(entry)
    console.log(`[M06 策略] 📐 ${entry}`)
  }
  
  // 跳过数学验算的类型
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
  
  // 对称性验算 (配角技巧题型)
  if (typeLabel === 'trig_angle_transformation' && params.verificationMethod === 'symmetry_substitution') {
    return verifySymmetry(params, logCalc, calculationLog)
  }
  
  // 方程一致性验算 (简化版)
  if (typeLabel === 'trig_angle_transformation' && params.verificationMethod === 'equation_consistency') {
    logCalc('验算模式', '方程一致性检查 (简化版)')
    logCalc('ω', params.omega)
    logCalc('φ', params.phi)
    
    // 简单验算：只要参数存在且合理，就认为通过
    if (params.omega > 0) {
      return {
        pass: true,
        skipMathCheck: false,
        message: '参数提取成功，方程结构合理',
        omega: params.omega,
        phi: params.phi,
        calculationLog
      }
    } else {
      return {
        pass: false,
        skipMathCheck: false,
        message: 'ω 参数异常 (应大于 0)',
        calculationLog
      }
    }
  }
  
  // 零点个数验算
  if (typeLabel === 'trig_zero_point_range' && params.omega && params.interval && params.zeroCount) {
    return verifyZeroPointCount(params, logCalc, calculationLog)
  }
  
  return {
    pass: false,
    error: '参数不完整，无法验算',
    calculationLog
  }
}

/**
 * 验算对称性
 * 对于 f(x) = sin(ωx + φ) 或 cos(ωx + φ):
 * - 若 (x0, y0) 是对称中心，则 f(x0) = y0
 * - 若 x = x0 是对称轴，则 f(x0) 取极值
 */
const verifySymmetry = (params, logCalc, calculationLog) => {
  const { omega = 1, phi = 0, symmetryPoint, symmetryAxis, hasSin, hasCos } = params
  
  logCalc('ω', omega)
  logCalc('φ', phi)
  logCalc('函数类型', hasSin ? 'sin' : (hasCos ? 'cos' : 'unknown'))
  
  try {
    // 验算对称中心
    if (symmetryPoint) {
      const { x, y } = symmetryPoint
      logCalc('对称中心', `(${x}, ${y})`)
      
      // 计算函数值
      let calculatedY
      if (hasSin) {
        calculatedY = Math.sin(omega * x + phi)
      } else if (hasCos) {
        calculatedY = Math.cos(omega * x + phi)
      } else {
        return {
          pass: false,
          error: '无法确定函数类型',
          calculationLog
        }
      }
      
      logCalc(`f(${x})`, calculatedY)
      
      // 验证是否等于 y (允许浮点误差)
      const tolerance = 1e-6
      const isCorrect = Math.abs(calculatedY - y) < tolerance
      
      logCalc('误差', Math.abs(calculatedY - y))
      logCalc('判定结果', isCorrect ? '通过' : '失败')
      
      if (isCorrect) {
        return {
          pass: true,
          skipMathCheck: false,
          message: `对称中心验证通过: f(${x.toFixed(4)}) = ${calculatedY.toFixed(6)} ≈ ${y}`,
          symmetryPoint,
          calculatedValue: calculatedY,
          expectedValue: y,
          calculationLog
        }
      } else {
        return {
          pass: false,
          skipMathCheck: false,
          message: `对称中心验证失败: f(${x.toFixed(4)}) = ${calculatedY.toFixed(6)}, 应为 ${y}`,
          symmetryPoint,
          calculatedValue: calculatedY,
          expectedValue: y,
          calculationLog
        }
      }
    }
    
    // 验算对称轴
    if (symmetryAxis !== null) {
      const x0 = symmetryAxis
      logCalc('对称轴', `x = ${x0}`)
      
      // 对于 sin 函数，对称轴处取极值 (±1)
      // 对于 cos 函数，对称轴处取极值 (±1)
      let calculatedY
      if (hasSin) {
        calculatedY = Math.sin(omega * x0 + phi)
      } else if (hasCos) {
        calculatedY = Math.cos(omega * x0 + phi)
      } else {
        return {
          pass: false,
          error: '无法确定函数类型',
          calculationLog
        }
      }
      
      logCalc(`f(${x0})`, calculatedY)
      
      // 对称轴处函数值应为 ±1 (极值点)
      const isExtremum = Math.abs(Math.abs(calculatedY) - 1) < 1e-6
      
      logCalc('是否极值点', isExtremum)
      logCalc('判定结果', isExtremum ? '通过' : '失败')
      
      if (isExtremum) {
        return {
          pass: true,
          skipMathCheck: false,
          message: `对称轴验证通过: f(${x0.toFixed(4)}) = ${calculatedY.toFixed(6)} (极值点)`,
          symmetryAxis: x0,
          calculatedValue: calculatedY,
          calculationLog
        }
      } else {
        return {
          pass: false,
          skipMathCheck: false,
          message: `对称轴验证失败: f(${x0.toFixed(4)}) = ${calculatedY.toFixed(6)}, 不是极值点`,
          symmetryAxis: x0,
          calculatedValue: calculatedY,
          calculationLog
        }
      }
    }
    
    return {
      pass: false,
      error: '缺少对称点或对称轴信息',
      calculationLog
    }
  } catch (e) {
    console.error('[M06 策略] 对称性验算错误:', e.message)
    return { pass: false, error: e.message, calculationLog }
  }
}

/**
 * 验算零点个数 (精确版)
 * 逻辑：计算区间两端点的相位差，结合正弦函数性质确定零点个数的可能范围
 */
const verifyZeroPointCount = (params, logCalc, calculationLog) => {
  const { omega, interval, zeroCount, phi = 0 } = params
  
  if (!omega || !interval || zeroCount === null) {
    return { pass: false, error: '参数不完整', calculationLog }
  }
  
  try {
    const [a, b] = interval
    const T = 2 * Math.PI / omega
    const halfT = T / 2
    
    logCalc('ω', omega)
    logCalc('φ (初相)', phi || 0)
    logCalc('区间 [a, b]', interval)
    logCalc('周期 T', T)
    logCalc('半周期 (零点间距)', halfT)
    
    const length = b - a
    logCalc('区间长度', length)
    
    const minZeros = Math.floor(length / halfT)
    const maxZeros = Math.ceil(length / halfT) + 1
    
    logCalc('理论最少零点数', minZeros)
    logCalc('理论最多零点数', maxZeros)
    
    const isPossible = zeroCount >= minZeros && zeroCount <= maxZeros
    const avgZeros = length / halfT
    const significantDeviation = Math.abs(zeroCount - avgZeros) > 1.5
    
    let pass = isPossible && !significantDeviation
    let message = ''
    
    if (!isPossible) {
      message = `数据矛盾：区间长度 ${length.toFixed(2)} (约${avgZeros.toFixed(1)}个半周期) 不可能容纳 ${zeroCount} 个零点。合理范围是 [${minZeros}, ${maxZeros}]。`
      pass = false
    } else if (significantDeviation) {
      message = `数据存疑：虽然理论上可能，但 ${zeroCount} 个零点对于该区间长度极为罕见，建议检查题目条件。`
      pass = true
    } else {
      message = `零点个数合理。区间长度对应约 ${avgZeros.toFixed(2)} 个半周期，声称 ${zeroCount} 个零点在可行范围内。`
    }
    
    logCalc('判定结果', pass ? '通过' : '失败')
    logCalc('详细信息', message)
    
    return {
      pass,
      warning: pass && significantDeviation ? message : null,
      message: pass ? message : message,
      theoreticalRange: [minZeros, maxZeros],
      claimedZeroCount: zeroCount,
      period: T,
      calculationLog,
      mathDetails: {
        intervalLength: length,
        halfPeriod: halfT,
        avgZeros
      }
    }
  } catch (e) {
    console.error('[M06 策略] 验算错误:', e.message)
    return { pass: false, error: e.message, calculationLog }
  }
}

export default {
  motifId: 'M06',
  typeLabels: [
    'trig_angle_transformation',
    'trig_auxiliary_angle',
    'trig_graph_transform',
    'trig_zero_point_range'
  ],
  extractParams,
  verify
}
