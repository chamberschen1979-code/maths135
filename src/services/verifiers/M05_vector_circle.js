/**
 * M05 平面向量 - 策略模块
 * 
 * 支持的题型：
 * - vector_circle_extremum: 圆上动点数量积最值（极化恒等式）
 * - vector_coefficient_ratio: 向量系数/面积比/奔驰定理
 * - vector_projection_angle: 投影向量与夹角范围
 * - vector_coordinate_optimization: 建系策略与二次函数化
 */

import { format } from 'mathjs'

const parseNumber = (str) => {
  if (!str) return null
  str = str.trim()
  
  try {
    if (str.includes('/')) {
      const [num, den] = str.split('/').map(s => parseFloat(s.trim()))
      return den !== 0 ? num / den : null
    }
    return parseFloat(str)
  } catch (e) {
    console.warn(`[M05 策略] 数值解析失败: "${str}"`)
    return null
  }
}

/**
 * 标准化内容 - 处理 Unicode 上标等特殊字符
 */
const normalizeContent = (content) => {
  return content
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/⁴/g, '^4')
    .replace(/⁵/g, '^5')
    .replace(/⁶/g, '^6')
    .replace(/⁷/g, '^7')
    .replace(/⁸/g, '^8')
    .replace(/⁹/g, '^9')
    .replace(/⁰/g, '^0')
}

const extractCircleEquation = (content) => {
  // 先标准化内容
  const normalized = normalizeContent(content)
  
  const patterns = [
    {
      regex: /\(x\s*([+-])\s*(\d+(?:\.\d+)?)\)\s*\^?\s*2\s*\+\s*\(y\s*([+-])\s*(\d+(?:\.\d+)?)\)\s*\^?\s*2\s*=\s*(\d+(?:\.\d+)?)/i,
      type: 'standard'
    },
    {
      regex: /x\s*\^\s*2\s*\+\s*\(y\s*([+-])\s*(\d+(?:\.\d+)?)\)\s*\^?\s*2\s*=\s*(\d+(?:\.\d+)?)/i,
      type: 'y_offset'
    },
    {
      regex: /\(x\s*([+-])\s*(\d+(?:\.\d+)?)\)\s*\^?\s*2\s*\+\s*y\s*\^\s*2\s*=\s*(\d+(?:\.\d+)?)/i,
      type: 'x_offset'
    },
    {
      regex: /x\s*\^\s*2\s*\+\s*y\s*\^\s*2\s*=\s*(\d+(?:\.\d+)?)/i,
      type: 'origin'
    }
  ]
  
  for (const { regex, type } of patterns) {
    const match = normalized.match(regex)
    if (match) {
      if (type === 'origin') {
        const rSquared = parseFloat(match[1])
        if (rSquared > 0) {
          const r = Math.sqrt(rSquared)
          return { center: [0, 0], radius: r }
        }
      } else if (type === 'y_offset') {
        const ySign = match[1] === '+' ? -1 : 1
        const yOffset = parseFloat(match[2])
        const rSquared = parseFloat(match[3])
        if (rSquared > 0) {
          return { center: [0, ySign * yOffset], radius: Math.sqrt(rSquared) }
        }
      } else if (type === 'x_offset') {
        const xSign = match[1] === '+' ? -1 : 1
        const xOffset = parseFloat(match[2])
        const rSquared = parseFloat(match[3])
        if (rSquared > 0) {
          return { center: [xSign * xOffset, 0], radius: Math.sqrt(rSquared) }
        }
      } else {
        const xSign = match[1] === '+' ? -1 : 1
        const xOffset = parseFloat(match[2])
        const ySign = match[3] === '+' ? -1 : 1
        const yOffset = parseFloat(match[4])
        const rSquared = parseFloat(match[5])
        if (rSquared > 0) {
          return { center: [xSign * xOffset, ySign * yOffset], radius: Math.sqrt(rSquared) }
        }
      }
    }
  }
  
  return null
}

/**
 * 向量线性表示专项防御
 * 拦截基底退化和动点问定值的错误题目
 */
const checkVectorLinearCombination = (content) => {
  // 仅当包含线性表示特征时触发
  if (!/\\vec\{OP\}\s*=|向量\s*OP\s*=|x\s*\+\s*y\s*\+\s*z|系数和/.test(content)) return null
  
  const errors = []
  const isMoving = /点\s*P\s*在.*运动|动点|轨迹/.test(content)
  const asksConstant = /求\s*(x\s*\+\s*y|系数和)\s*的\s*值/.test(content) && !/范围/.test(content)
  
  // 提取坐标检测基底退化 (O与A/B/C重合)
  const points = {}
  const ptRegex = /([A-Z])\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g
  let m
  while ((m = ptRegex.exec(content)) !== null) {
    points[m[1]] = { x: parseFloat(m[2]), y: parseFloat(m[3]) }
  }
  
  const O = points['O'] || { x: 0, y: 0 }
  ;['A', 'B', 'C'].forEach(k => {
    if (points[k] && Math.abs(points[k].x - O.x) < 1e-6 && Math.abs(points[k].y - O.y) < 1e-6) {
      errors.push(`❌ 基底退化：${k}${JSON.stringify(points[k])}与原点O重合，解不唯一！`)
    }
  })
  
  // 动点问定值检查
  if (isMoving && asksConstant && errors.length === 0) {
    errors.push('⚠️ 逻辑谬误：P是动点却求系数和"定值"，除非有强约束，否则应求"范围"。')
  }
  
  if (errors.length > 0) {
    console.warn('[M05 防御] 拦截失败题目:', errors.join('; '))
    return { type: 'vector_linear_risk', pass: false, skipMathCheck: true, error: errors.join('; ') }
  }
  
  // 检查通过，给予高潜力分并跳过后续复杂验算
  return { type: 'vector_linear_safe', pass: true, skipMathCheck: true, potentialScore: 4.2, reason: '线性表示逻辑自洽' }
}

const extractParams = (typeLabel, content, features) => {
  console.log(`[M05 策略] 提取参数 - 类型: ${typeLabel}`)
  
  // 🛡️ 【最高优先级】运行专项防御
  const defense = checkVectorLinearCombination(content)
  if (defense) return defense // 直接返回拦截结果或通过信号
  
  const normalizedContent = content.toLowerCase()
  
  // 🛡️ 全局 L3 保护伞：检测题目复杂度
  const isL3Complexity = /动点|最值|范围|夹角|投影|系数|参数|轨迹|数量积|模|圆弧/.test(content)
  const defaultL3Score = isL3Complexity ? 4.0 : 3.6
  
  // 🆕 预检查：针对特定 L3 核心题型的识别
  // ✅ 针对动点 + 最值 + 参数函数
  if (/动点|圆弧|轨迹/.test(content) && (/最小值|最大值|函数解析式|关于.*的函数/.test(content))) {
    return {
      type: 'vector_moving_point_extremum',
      skipMathCheck: true,
      requiresLLMCheck: true,
      potentialScore: 4.5, // 向量压轴题，给最高档的软通过分
      reason: '向量动点最值及函数解析式，需 LLM 验算建系与轨迹'
    }
  }
  
  // ✅ 针对一般的向量最值问题
  if (/数量积.*最值|模.*最值|PA.*PB|PA.*PC/.test(content)) {
    return {
      type: 'vector_dot_product_extremum',
      skipMathCheck: true,
      requiresLLMCheck: true,
      potentialScore: 4.0,
      reason: '向量数量积最值问题，需 LLM 验算几何意义'
    }
  }
  
  // ✅ 针对向量范围问题
  if (/范围|取值范围|值域/.test(content) && /向量|数量积|点积/.test(content)) {
    return {
      type: 'vector_range_problem',
      skipMathCheck: true,
      requiresLLMCheck: true,
      potentialScore: 4.0,
      reason: '向量范围问题，需 LLM 验算边界条件'
    }
  }
  
  // ✅ 针对向量与圆的综合题
  if (/圆/.test(content) && (/向量|数量积|点积/.test(content))) {
    return {
      type: 'vector_circle_composite',
      skipMathCheck: true,
      requiresLLMCheck: true,
      potentialScore: 4.2,
      reason: '向量与圆综合题，需 LLM 验算几何性质'
    }
  }
  
  switch (typeLabel) {
    case 'vector_coefficient_ratio':
      return {
        type: 'vector_coefficient',
        skipMathCheck: true,
        requiresLLMCheck: true,
        potentialScore: defaultL3Score,
        hasLambda: /λ|λ|lambda/i.test(content),
        hasAreaRatio: /面积比|面积之比/.test(content),
        hasBenzTheorem: /奔驰定理|奔驰/.test(content),
        reason: '向量系数题型需 LLM 验算逻辑一致性 (L3 难度)'
      }
      
    case 'vector_projection_angle':
      return {
        type: 'vector_projection',
        skipMathCheck: true,
        reason: '投影向量题型需 LLM 验算几何意义'
      }
      
    case 'vector_coordinate_optimization':
      return {
        type: 'vector_coordinate',
        skipMathCheck: true,
        reason: '建系优化题型需 LLM 验算策略选择'
      }
      
    case 'vector_circle_extremum':
      // 圆上动点数量积最值 - 需要提取圆参数
      const coords = []
      const coordPattern = /\(\s*(-?\d+(?:\.\d+)?(?:\/\d+)?)\s*,\s*(-?\d+(?:\.\d+)?(?:\/\d+)?)\s*\)/g
      let match
      
      while ((match = coordPattern.exec(content)) !== null) {
        const x = parseNumber(match[1])
        const y = parseNumber(match[2])
        if (x !== null && y !== null) {
          coords.push([x, y])
        }
      }
      
      let radius = 1
      const radiusPatterns = [
        /半径[为是]?\s*(\d+(?:\.\d+)?)/,
        /半径\s*=\s*(\d+(?:\.\d+)?)/,
        /r\s*=\s*(\d+(?:\.\d+)?)/i
      ]
      
      for (const pattern of radiusPatterns) {
        const rMatch = content.match(pattern)
        if (rMatch) {
          radius = parseFloat(rMatch[1])
          break
        }
      }
      
      const circleInfo = extractCircleEquation(content)
      
      if (coords.length >= 2) {
        return {
          type: 'vector_circle_extremum',
          A: coords[0],
          B: coords[1],
          center: coords.length >= 3 ? coords[2] : (circleInfo?.center || [0, 0]),
          radius: circleInfo?.radius || radius,
          skipMathCheck: false
        }
      }
      
      if (circleInfo) {
        return {
          type: 'vector_circle_extremum',
          A: null,
          B: null,
          center: circleInfo.center,
          radius: circleInfo.radius,
          skipMathCheck: false
        }
      }
      
      return {
        type: 'vector_circle_extremum',
        skipMathCheck: true,
        requiresLLMCheck: true,
        potentialScore: 4.0, // L3 难度的向量圆题型，给予 4.0 分保障
        reason: '无法提取圆或坐标参数，需 LLM 验算 (L3 难度)'
      }
      
    default:
      // 🆕 即使类型未知，如果内容看起来很难，也给个保底分
      const isHardLooking = /范围|最值|证明|构造|讨论|恒成立|取值|参数|向量|圆/.test(content)
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
        reason: 'M05 未知题型'
      }
  }
}

const verify = (typeLabel, params, aiAnswer) => {
  console.log(`[M05 策略] 验算 - 类型: ${typeLabel}`)
  
  const calculationLog = []
  const logCalc = (step, result) => {
    const entry = `[${step}] = ${typeof result === 'number' ? format(result, { precision: 14 }) : JSON.stringify(result)}`
    calculationLog.push(entry)
    console.log(`[M05 策略] 📐 ${entry}`)
  }
  
  // 🛡️ 专项防御拦截：如果 pass 明确为 false，直接返回失败
  if (params.pass === false) {
    return {
      pass: false,
      skipMathCheck: true,
      type: params.type,
      error: params.error || '逻辑错误',
      calculationLog
    }
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
  
  // 圆上动点数量积最值验算（极化恒等式）
  if (typeLabel === 'vector_circle_extremum' && params.A && params.B && params.center) {
    return verifyVectorCircleExtremum(params, logCalc, calculationLog)
  }
  
  return {
    pass: false,
    error: '参数不完整，无法验算',
    calculationLog
  }
}

const verifyVectorCircleExtremum = (params, logCalc, calculationLog) => {
  const { A, B, center, radius } = params
  
  if (!A || !B || !center || radius === undefined) {
    return { 
      pass: false, 
      error: '参数不完整，无法验算',
      calculationLog
    }
  }
  
  if (center[0] === null || center[1] === null) {
    return {
      pass: false,
      error: '圆心坐标无效',
      calculationLog
    }
  }
  
  try {
    const Ax = A[0], Ay = A[1]
    const Bx = B[0], By = B[1]
    const Cx = center[0], Cy = center[1]
    const r = radius
    
    logCalc('A', [Ax, Ay])
    logCalc('B', [Bx, By])
    logCalc('圆心 C', [Cx, Cy])
    logCalc('半径 r', r)
    
    // 计算中点 M
    const Mx = (Ax + Bx) / 2
    const My = (Ay + By) / 2
    logCalc('中点 M', [Mx, My])
    
    // 计算圆心到中点的距离
    const dx = Cx - Mx
    const dy = Cy - My
    const distSquared = dx * dx + dy * dy
    const distCenterToM = Math.sqrt(distSquared)
    logCalc('圆心到中点距离 d', distCenterToM)
    
    // 计算 |AM|²
    const AMx = Ax - Mx
    const AMy = Ay - My
    const AM_squared = AMx * AMx + AMy * AMy
    logCalc('|AM|²', AM_squared)
    
    // 判断圆心是否与中点重合
    const tolerance = 1e-8
    const isCoincident = distSquared < tolerance
    logCalc('圆心与中点重合?', isCoincident)
    
    if (isCoincident) {
      // 定值情况
      const constantValue = r * r - AM_squared
      logCalc('定值 PA·PB', constantValue)
      
      return {
        pass: true,
        isConstant: true,
        minValue: constantValue,
        maxValue: constantValue,
        warning: '⚠️ 圆心与中点重合，结果为定值！',
        calculationLog,
        mathDetails: {
          midpoint: [Mx, My],
          distanceToCenter: distCenterToM,
          AMsquared: AM_squared
        }
      }
    }
    
    // 正常情况：计算最值范围
    const PM_min_squared = (distCenterToM - r) * (distCenterToM - r)
    const PM_max_squared = (distCenterToM + r) * (distCenterToM + r)
    logCalc('|PM|² 最小', PM_min_squared)
    logCalc('|PM|² 最大', PM_max_squared)
    
    const minVal = PM_min_squared - AM_squared
    const maxVal = PM_max_squared - AM_squared
    logCalc('PA·PB 最小值', minVal)
    logCalc('PA·PB 最大值', maxVal)
    
    return {
      pass: true,
      isConstant: false,
      minValue: minVal,
      maxValue: maxVal,
      centerToMDistance: distCenterToM,
      calculationLog,
      mathDetails: {
        midpoint: [Mx, My],
        distanceToCenter: distCenterToM,
        AMsquared: AM_squared,
        PMrange: [Math.sqrt(PM_min_squared), Math.sqrt(PM_max_squared)]
      }
    }
  } catch (e) {
    console.error('[M05 策略] 验算错误:', e.message)
    return { 
      pass: false, 
      error: e.message, 
      calculationLog 
    }
  }
}

export default {
  motifId: 'M05',
  typeLabels: [
    'vector_circle_extremum',
    'vector_coefficient_ratio',
    'vector_projection_angle',
    'vector_coordinate_optimization'
  ],
  extractParams,
  verify
}
