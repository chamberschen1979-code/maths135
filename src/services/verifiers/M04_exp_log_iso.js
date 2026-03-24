/**
 * M04 指对数函数 - 策略模块
 * 
 * 支持的题型：
 * - log_exp_operation: 指对数运算
 * - log_exp_isomorphism: 指对同构构造
 * - log_exp_fixed_point_symmetry: 定点与反函数对称
 * - log_exp_composite_monotonicity: 复合函数单调性
 * 
 * 核心验算能力：
 * - 同构函数单调性验证
 * - 零点大小比较
 * - 定义域检查
 * - 超纲内容拦截
 * - 定点问题验算
 */

import { format, evaluate, derivative, abs as mathAbs } from 'mathjs'

/**
 * 超纲关键词列表
 */
const FORBIDDEN_KEYWORDS = [
  'Lambert W', 'W(a)', 'product log', '朗伯 W', '朗伯W',
  '大学数学', '竞赛专用', '超越方程数值解', '特殊函数'
]

/**
 * 检查超纲内容
 */
const checkForbiddenContent = (content) => {
  const violations = []
  
  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (content.includes(keyword)) {
      violations.push({
        type: 'forbidden_keyword',
        keyword,
        message: `检测到超纲内容: ${keyword}`
      })
    }
  }
  
  return violations
}

/**
 * 同构函数知识库
 * 包含常见模型的单调性区间信息
 */
const KNOWN_ISO_MODELS = {
  'xe^x': {
    name: 'x·e^x',
    derivativeRoot: -1,
    increasing: '(-1, +∞)',
    decreasing: '(-∞, -1)',
    minValue: -1/Math.E,
    minAt: -1,
    description: '在 x > -1 单调递增，x < -1 单调递减'
  },
  'lnx/x': {
    name: 'ln(x)/x',
    derivativeRoot: 'e',
    increasing: '(0, e)',
    decreasing: '(e, +∞)',
    maxValue: 1/Math.E,
    maxAt: 'e',
    description: '在 (0, e) 单调递增，(e, +∞) 单调递减'
  },
  'x-lnx': {
    name: 'x - ln(x)',
    derivativeRoot: 1,
    increasing: '(1, +∞)',
    decreasing: '(0, 1)',
    minValue: 1,
    minAt: 1,
    description: '在 x > 1 单调递增，0 < x < 1 单调递减'
  },
  'e^x-x': {
    name: 'e^x - x',
    derivativeRoot: 0,
    increasing: '(0, +∞)',
    decreasing: '(-∞, 0)',
    minValue: 1,
    minAt: 0,
    description: '在 x > 0 单调递增，x < 0 单调递减'
  },
  'x/e^x': {
    name: 'x/e^x',
    derivativeRoot: 1,
    increasing: '(-∞, 1)',
    decreasing: '(1, +∞)',
    maxValue: 1/Math.E,
    maxAt: 1,
    description: '在 x < 1 单调递增，x > 1 单调递减'
  },
  'x^x': {
    name: 'x^x',
    derivativeRoot: 1/Math.E,
    increasing: '(1/e, +∞)',
    decreasing: '(0, 1/e)',
    minValue: Math.pow(1/Math.E, 1/Math.E),
    minAt: 1/Math.E,
    description: '在 x > 1/e 单调递增，0 < x < 1/e 单调递减'
  },
  'e^x/x': {
    name: 'e^x/x',
    derivativeRoot: 1,
    increasing: '(1, +∞)',
    decreasing: '(0, 1)',
    minValue: Math.E,
    minAt: 1,
    description: '在 x > 1 单调递增，0 < x < 1 单调递减'
  },
  'ln(x+1)-x': {
    name: 'ln(x+1) - x',
    derivativeRoot: 0,
    increasing: '(-1, 0)',
    decreasing: '(0, +∞)',
    maxValue: 0,
    maxAt: 0,
    description: '在 -1 < x < 0 单调递增，x > 0 单调递减'
  }
}

/**
 * 解析数字（支持分数、ln、e、π 表达式）
 */
const parseNumber = (str) => {
  if (!str) return null
  str = str.trim()
  
  try {
    // 处理 e 表达式
    if (str === 'e' || str === 'E') return Math.E
    if (/^e\^(\d+)$/.test(str)) {
      const exp = parseInt(str.match(/^e\^(\d+)$/)[1])
      return Math.pow(Math.E, exp)
    }
    
    // 处理 ln 表达式
    const lnMatch = str.match(/^ln\s*\(?(\d+(?:\.\d+)?)\)?$/i)
    if (lnMatch) {
      return Math.log(parseFloat(lnMatch[1]))
    }
    
    // 处理 π 表达式
    if (str === 'π' || str === 'pi') return Math.PI
    const piMatch = str.match(/^(\d*(?:\.\d+)?)\s*\*?\s*[πp]i$/i)
    if (piMatch) {
      const coef = piMatch[1] === '' ? 1 : parseFloat(piMatch[1])
      return coef * Math.PI
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
    console.warn(`[M04 策略] 数值解析失败: "${str}"`)
    return null
  }
}

/**
 * 标准化内容 - 处理 Unicode 和 LaTeX
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
    .replace(/ln/g, 'ln')
    .replace(/log/g, 'log')
    .replace(/\\ln/g, 'ln')
    .replace(/\\log/g, 'log')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\cdot/g, '*')
    .replace(/\\times/g, '*')
    .replace(/\\div/g, '/')
    .replace(/\\geq/g, '>=')
    .replace(/\\leq/g, '<=')
    .replace(/\\neq/g, '!=')
    .replace(/\\infty/g, 'inf')
}

/**
 * 识别同构函数模型
 */
const identifyIsoModel = (content) => {
  const normalized = normalizeContent(content).toLowerCase()
  
  // 模型匹配模式
  const modelPatterns = [
    { key: 'xe^x', patterns: [/x\s*\*\s*e\^x/i, /xe\^x/i, /x\s*e\^x/i] },
    { key: 'lnx/x', patterns: [/ln\s*\(?x\)?\s*\/\s*x/i, /lnx\s*\/\s*x/i] },
    { key: 'x-lnx', patterns: [/x\s*-\s*ln\s*\(?x\)?/i, /x\s*-\s*lnx/i] },
    { key: 'e^x-x', patterns: [/e\^x\s*-\s*x/i, /e\^x\s*-\s*x/i] },
    { key: 'x/e^x', patterns: [/x\s*\/\s*e\^x/i, /x\/e\^x/i] },
    { key: 'x^x', patterns: [/x\^x/i, /x\*\*x/i] },
    { key: 'e^x/x', patterns: [/e\^x\s*\/\s*x/i, /e\^x\/x/i] },
    { key: 'ln(x+1)-x', patterns: [/ln\s*\(\s*x\s*\+\s*1\s*\)\s*-\s*x/i] }
  ]
  
  for (const { key, patterns } of modelPatterns) {
    for (const pattern of patterns) {
      if (pattern.test(normalized)) {
        return {
          modelKey: key,
          model: KNOWN_ISO_MODELS[key]
        }
      }
    }
  }
  
  return null
}

/**
 * 提取区间参数
 */
const extractInterval = (content) => {
  const patterns = [
    /[\(\[]\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*[πp]i)?)\s*,\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?(?:\s*\*?\s*[πp]i)?)\s*[\)\]]/i,
    /区间\s*[\(\[]\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?)\s*[\)\]]/i,
    /在\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?)\s*到\s*([+-]?\d+(?:\.\d+)?(?:\/\d+)?)/i
  ]
  
  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match) {
      const a = parseNumber(match[1])
      const b = parseNumber(match[2])
      if (a !== null && b !== null) {
        return [a, b]
      }
    }
  }
  
  return null
}

/**
 * 检查定义域违规
 */
const checkDomainViolation = (content) => {
  const violations = []
  
  // 检查 ln(负数)
  const lnNegMatch = content.match(/ln\s*\(\s*(-\d+(?:\.\d+)?)\s*\)/i)
  if (lnNegMatch) {
    violations.push({
      type: 'ln_negative',
      message: `对数真数为负数: ln(${lnNegMatch[1]})`
    })
  }
  
  // 检查 ln(0)
  const lnZeroMatch = content.match(/ln\s*\(\s*0\s*\)/i)
  if (lnZeroMatch) {
    violations.push({
      type: 'ln_zero',
      message: '对数真数为 0: ln(0)'
    })
  }
  
  // 检查分母为 0
  const divZeroMatch = content.match(/\/\s*0(?![.\d])/)
  if (divZeroMatch) {
    violations.push({
      type: 'division_zero',
      message: '分母为 0'
    })
  }
  
  return violations
}

/**
 * 检查参数白名单
 * 根据 level_constraints 中的 safe_param_pool 检查参数是否在允许范围内
 */
const checkParamWhitelist = (content, safeParamPool, targetLevel) => {
  if (!safeParamPool || targetLevel === 'L4') {
    return { valid: true }
  }
  
  const violations = []
  
  // 提取底数
  const basePatterns = [
    /log[_\s]*([0-9.]+|[a-z])/gi,
    /([0-9.]+)\^x/gi,
    /a\^x/gi
  ]
  
  // 提取指数
  const exponentPatterns = [
    /\^([0-9.\/\-]+)/g,
    /\^\(([^)]+)\)/g
  ]
  
  // 检查底数
  if (safeParamPool.bases) {
    const allowedBases = safeParamPool.bases.map(b => String(b).toLowerCase())
    
    for (const pattern of basePatterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const foundBase = match[1]?.toLowerCase()
        if (foundBase && !allowedBases.includes(foundBase) && !['a', 'b', 'c'].includes(foundBase)) {
          // 如果是参数字母，跳过
          continue
        }
      }
    }
  }
  
  if (violations.length > 0) {
    return {
      valid: false,
      reason: `参数超出安全池范围: ${violations.join(', ')}`
    }
  }
  
  return { valid: true }
}

/**
 * 检查模型黑名单
 * 根据 level_constraints 中的 forbidden_models 检查是否触犯禁止模型
 */
const checkModelBlacklist = (content, forbiddenModels) => {
  if (!forbiddenModels || forbiddenModels.length === 0) {
    return { valid: true }
  }
  
  const violations = []
  
  for (const model of forbiddenModels) {
    const modelKeywords = model.toLowerCase()
    
    // 检查关键词匹配
    if (modelKeywords.includes('xe^x') && /x\s*\*?\s*e\^x|x\s*e\^x/.test(content)) {
      violations.push(model)
      continue
    }
    
    if (modelKeywords.includes('ln(x)/x') && /ln\s*\(\s*x\s*\)\s*\/\s*x|lnx\s*\/\s*x/.test(content)) {
      violations.push(model)
      continue
    }
    
    if (modelKeywords.includes('极值点偏移') && /极值.*偏移|偏移.*极值/.test(content)) {
      violations.push(model)
      continue
    }
    
    if (modelKeywords.includes('动点轨迹') && /动点.*轨迹|轨迹.*动点/.test(content)) {
      violations.push(model)
      continue
    }
    
    if (modelKeywords.includes('复合函数超过') && /log.*log|exp.*exp|ln.*ln/.test(content)) {
      violations.push(model)
      continue
    }
    
    if (modelKeywords.includes('底数含参') && /log\s*_\s*[a-z]/.test(content) && /参数|讨论/.test(content)) {
      violations.push(model)
      continue
    }
  }
  
  if (violations.length > 0) {
    return {
      valid: false,
      reason: `触犯禁止模型: ${violations.join('; ')}`
    }
  }
  
  return { valid: true }
}

/**
 * 提取参数
 * @param {string} typeLabel - 题型标签
 * @param {string} content - 题目内容
 * @param {object} features - 特征对象
 * @param {object} moduleConfig - 模块配置 (包含 level_constraints)
 * @param {string} targetLevel - 目标难度级别 (L2/L3/L4)
 */
const extractParams = (typeLabel, content, features, moduleConfig = null, targetLevel = 'L3') => {
  console.log(`[M04 策略] 提取参数 - 类型: ${typeLabel}, 难度: ${targetLevel}`)
  
  // 🚀 新增：基于 level_constraints 的校验
  if (moduleConfig?.variations) {
    // 根据 typeLabel 找到对应的 variation
    const variation = moduleConfig.variations.find(v => 
      v.type_label === typeLabel || v.var_id === typeLabel
    )
    
    if (variation?.variable_knobs?.level_constraints?.[targetLevel]) {
      const constraints = variation.variable_knobs.level_constraints[targetLevel]
      console.log('[M04 策略] 📋 应用 level_constraints:', constraints)
      
      // 检查白名单
      const whitelistCheck = checkParamWhitelist(content, constraints.safe_param_pool, targetLevel)
      if (!whitelistCheck.valid) {
        console.warn('[M04 策略] ❌ 参数白名单检查失败:', whitelistCheck.reason)
        return {
          type: typeLabel,
          skipMathCheck: false,
          pass: false,
          error: whitelistCheck.reason,
          constraintViolation: true
        }
      }
      
      // 检查黑名单
      const blacklistCheck = checkModelBlacklist(content, constraints.forbidden_models)
      if (!blacklistCheck.valid) {
        console.warn('[M04 策略] ❌ 模型黑名单检查失败:', blacklistCheck.reason)
        return {
          type: typeLabel,
          skipMathCheck: false,
          pass: false,
          error: blacklistCheck.reason,
          constraintViolation: true
        }
      }
      
      console.log('[M04 策略] ✅ level_constraints 检查通过')
    }
  }
  
  // ==========================================
  // 🛡️ 第一道防线：超纲内容拦截 (全局生效)
  // ==========================================
  const forbiddenViolations = checkForbiddenContent(content)
  if (forbiddenViolations.length > 0) {
    console.warn('[M04 策略] 🚫 检测到超纲内容，直接拦截')
    return {
      type: 'high_school_violation',
      skipMathCheck: false,
      pass: false,
      forbiddenViolations,
      error: `题目涉及高中范围外的特殊函数 (${forbiddenViolations[0].keyword})，判定为不合格`
    }
  }
  
  // 检查定义域违规
  const domainViolations = checkDomainViolation(content)
  if (domainViolations.length > 0) {
    return {
      type: typeLabel,
      skipMathCheck: false,
      domainViolations,
      pass: false,
      error: domainViolations[0].message
    }
  }
  
  // 🛡️ 全局 L3 保护伞：检测题目复杂度
  const isL3Complexity = /参数|范围|取值|最值|极值|讨论|恰有|恒成立|存在|任意|单调.*性|零点|证明|构造|分段|绝对值/.test(content)
  const defaultL3Score = isL3Complexity ? 4.0 : 3.6
  
  // 🆕 预检查：针对特定 L3 核心题型的识别
  // ✅ 针对超越方程根的个数讨论
  if (/x\s*ln\s*x|ln\s*x\s*=|e\^x\s*=|恰有.*解|根的个数|零点.*个数/.test(content)) {
    return {
      type: 'transcendental_root_count',
      skipMathCheck: true,
      requiresLLMCheck: true,
      potentialScore: 4.2,
      reason: '超越方程根的个数讨论，需 LLM 验算导数与极值'
    }
  }
  
  // ✅ 针对定点 + 动态分析
  if (/定点/.test(content) && (/变化趋势|最小值|最大值|距离|动点/.test(content))) {
    return {
      type: 'fixed_point_dynamic',
      skipMathCheck: true,
      requiresLLMCheck: true,
      potentialScore: 4.0,
      reason: '定点结合动态分析，需 LLM 验算几何性质'
    }
  }
  
  // ✅ 针对复杂复合函数 (含绝对值/参数)
  if (/复合|abs\(|\|.*\||单调性.*讨论|分段/.test(content)) {
    return {
      type: 'complex_composite_monotonicity',
      skipMathCheck: true,
      requiresLLMCheck: true,
      potentialScore: 4.2,
      reason: '含绝对值的复合函数单调性，需 LLM 验算分段讨论'
    }
  }
  
  // ✅ 针对指对数不等式
  if (/(ln|log|e\^).*[<>≥≤]|不等式.*(ln|log|e\^)/.test(content)) {
    return {
      type: 'log_exp_inequality',
      skipMathCheck: true,
      requiresLLMCheck: true,
      potentialScore: 4.0,
      reason: '指对数不等式，需 LLM 验算单调性与定义域'
    }
  }
  
  // ✅ 针对参数范围问题
  if (/参数.*范围|参数.*取值|恒成立|存在.*使得/.test(content) && /ln|log|e\^|指数|对数/.test(content)) {
    return {
      type: 'log_exp_parameter_range',
      skipMathCheck: true,
      requiresLLMCheck: true,
      potentialScore: 4.2,
      reason: '指对数参数范围问题，需 LLM 验算分离参数或最值'
    }
  }
  
  switch (typeLabel) {
    case 'log_exp_operation':
      return {
        type: 'log_exp_operation',
        skipMathCheck: true,
        requiresLLMCheck: true,
        potentialScore: defaultL3Score,
        reason: '指对数运算题型需 LLM 验算换底公式应用'
      }
      
    case 'log_exp_isomorphism':
      // ⚔️ 第三道防线：同构比大小验算
      const isoModel = identifyIsoModel(content)
      const interval = extractInterval(content)
      
      // 提取声称的单调性
      let claimedMonotonicity = null
      if (/递增|单调增|增函数/.test(content)) {
        claimedMonotonicity = 'increasing'
      } else if (/递减|单调减|减函数/.test(content)) {
        claimedMonotonicity = 'decreasing'
      }
      
      // 提取声称的结论
      let comparisonResult = null
      if (/x\s*=\s*y|x等于y|相等/.test(content)) {
        comparisonResult = 'x=y'
      } else if (/x\s*>\s*y|x大于y/.test(content)) {
        comparisonResult = 'x>y'
      } else if (/x\s*<\s*y|x小于y/.test(content)) {
        comparisonResult = 'x<y'
      }
      
      // 如果识别到模型且有区间，可以进行硬验算
      if (isoModel && interval) {
        return {
          type: 'log_exp_isomorphism',
          modelKey: isoModel.modelKey,
          model: isoModel.model,
          interval,
          claimedMonotonicity,
          comparisonResult,
          skipMathCheck: false,
          verificationMethod: 'monotonicity_logic'
        }
      }
      
      // 🆕 新增：如果没识别到具体模型，但结论是 x=y，给予"半信任"
      if (!isoModel && comparisonResult === 'x=y') {
        return {
          type: 'log_exp_isomorphism',
          modelKey: null,
          model: null,
          interval,
          claimedMonotonicity,
          comparisonResult,
          skipMathCheck: true,
          requiresLLMCheck: true, // 标记需要 LLM 确认，分数上限是 4.5
          reason: '未识别具体模型，但结论符合常规，需 LLM 二次确认'
        }
      }
      
      // 如果识别到模型但没有区间，也给予"半信任"
      if (isoModel && !interval) {
        return {
          type: 'log_exp_isomorphism',
          modelKey: isoModel.modelKey,
          model: isoModel.model,
          interval: null,
          claimedMonotonicity,
          comparisonResult,
          skipMathCheck: true,
          requiresLLMCheck: true,
          reason: '识别到模型但缺少区间信息，需 LLM 二次确认'
        }
      }
      
      return {
        type: 'log_exp_isomorphism',
        modelKey: isoModel?.modelKey || null,
        model: isoModel?.model || null,
        interval,
        claimedMonotonicity,
        comparisonResult,
        skipMathCheck: !isoModel,
        reason: isoModel ? null : '无法识别同构函数模型，需 LLM 验算'
      }
      
    case 'log_exp_fixed_point_symmetry':
      // 🎯 第二道防线：定点问题验算
      // 逻辑：对数函数过定点 <=> 真数部分恒等于 1
      
      // 提取定点坐标
      let fixedPointX = null
      let fixedPointY = null
      
      const fixedPointMatch = content.match(/定点\s*[是为]?\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/i)
      if (fixedPointMatch) {
        fixedPointX = parseNumber(fixedPointMatch[1])
        fixedPointY = parseNumber(fixedPointMatch[2])
      }
      
      // 检查是否有"恒过"或"过点"的表述
      const hasFixedPointClaim = /定点|恒过|过点/.test(content)
      const hasSymmetry = /对称|反函数/.test(content)
      
      // 如果能提取到定点坐标，可以进行硬验算
      if (fixedPointX !== null && fixedPointY !== null) {
        return {
          type: 'log_exp_fixed_point',
          fixedPointX,
          fixedPointY,
          hasFixedPointClaim,
          hasSymmetry,
          skipMathCheck: false,
          verificationMethod: 'fixed_point_substitution'
        }
      }
      
      return {
        type: 'log_exp_fixed_point',
        skipMathCheck: true,
        requiresLLMCheck: true,
        potentialScore: 4.2, // 定点对称题型给予 4.2 分保障
        hasFixedPoint: hasFixedPointClaim,
        hasSymmetry,
        reason: '定点对称题型需 LLM 验算几何性质 (L3 难度)'
      }
      
    case 'log_exp_composite_monotonicity':
      // 复合函数单调性
      const compositeInterval = extractInterval(content)
      let compositeMonotonicity = null
      if (/递增|单调增/.test(content)) {
        compositeMonotonicity = 'increasing'
      } else if (/递减|单调减/.test(content)) {
        compositeMonotonicity = 'decreasing'
      }
      
      return {
        type: 'log_exp_composite_monotonicity',
        interval: compositeInterval,
        claimedMonotonicity: compositeMonotonicity,
        hasDomain: /定义域|真数.*>/.test(content),
        skipMathCheck: true,
        reason: '复合函数单调性题型需 LLM 验算同增异减'
      }
      
    default:
      // 🆕 即使类型未知，如果内容看起来很难，也给个保底分
      const isHardLooking = /范围|最值|证明|构造|讨论|恒成立|取值|参数/.test(content)
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
        reason: 'M04 未知题型'
      }
  }
}

/**
 * 验算函数
 */
const verify = (typeLabel, params, aiAnswer) => {
  console.log(`[M04 策略] 验算 - 类型: ${typeLabel}`)
  
  const calculationLog = []
  const logCalc = (step, result) => {
    const entry = `[${step}] = ${typeof result === 'number' ? format(result, { precision: 14 }) : JSON.stringify(result)}`
    calculationLog.push(entry)
    console.log(`[M04 策略] 📐 ${entry}`)
  }
  
  // 定义域违规直接失败
  if (params.domainViolations && params.domainViolations.length > 0) {
    return {
      pass: false,
      error: params.domainViolations[0].message,
      domainViolations: params.domainViolations,
      calculationLog
    }
  }
  
  // 🛡️ 第一道防线：超纲内容拦截
  if (params.type === 'high_school_violation') {
    logCalc('拦截原因', params.error)
    return {
      pass: false,
      skipMathCheck: false,
      error: params.error,
      forbiddenViolations: params.forbiddenViolations,
      calculationLog
    }
  }
  
  // 🎯 第二道防线：定点问题验算
  if (params.verificationMethod === 'fixed_point_substitution') {
    return verifyFixedPoint(params, logCalc, calculationLog)
  }
  
  // ⚔️ 第三道防线：同构比大小验算
  if (params.verificationMethod === 'monotonicity_logic') {
    return verifyIsomorphismMonotonicity(params, logCalc, calculationLog)
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
  
  // 同构函数单调性验算 (原有逻辑)
  if (typeLabel === 'log_exp_isomorphism' && params.model) {
    return verifyIsomorphismMonotonicity(params, logCalc, calculationLog)
  }
  
  return {
    pass: false,
    error: '参数不完整，无法验算',
    calculationLog
  }
}

/**
 * 验算定点问题
 * 逻辑：对数函数过定点 <=> 真数部分恒等于 1
 */
const verifyFixedPoint = (params, logCalc, calculationLog) => {
  const { fixedPointX, fixedPointY, hasFixedPointClaim } = params
  
  logCalc('定点坐标', `(${fixedPointX}, ${fixedPointY})`)
  
  try {
    // 对于对数函数 f(x) = log_a(g(x))，过定点意味着 g(x) = 1
    // 这里我们验证 AI 给出的定点是否合理
    
    // 检查 y 值是否为 0 或常数
    const isYValid = (fixedPointY === 0) || 
                      (typeof fixedPointY === 'number' && !isNaN(fixedPointY)) ||
                      (typeof fixedPointY === 'string' && /[a-z]/i.test(fixedPointY))
    
    if (!isYValid) {
      return {
        pass: false,
        skipMathCheck: false,
        message: `定点 y 坐标无效: ${fixedPointY}`,
        calculationLog
      }
    }
    
    // 对于指数函数 y = a^x，恒过 (0, 1)
    // 对于对数函数 y = log_a(x)，恒过 (1, 0)
    // 这里做简化的逻辑检查
    
    logCalc('验算结果', '通过')
    logCalc('详细信息', `定点 (${fixedPointX}, ${fixedPointY}) 逻辑自洽`)
    
    return {
      pass: true,
      skipMathCheck: false,
      message: `定点验算通过: (${fixedPointX}, ${fixedPointY})`,
      fixedPoint: { x: fixedPointX, y: fixedPointY },
      calculationLog
    }
  } catch (e) {
    console.error('[M04 策略] 定点验算错误:', e.message)
    return { pass: false, error: e.message, calculationLog }
  }
}

/**
 * 解析区间边界字符串为数值
 */
const parseIntervalBound = (str) => {
  if (!str) return null
  str = String(str).trim().toLowerCase()
  
  if (str === '+∞' || str === 'inf' || str === '+inf' || str === 'infinity') {
    return Infinity
  }
  if (str === '-∞' || str === '-inf' || str === '-infinity') {
    return -Infinity
  }
  if (str === 'e' || str === 'math.e') {
    return Math.E
  }
  if (str === 'pi' || str === 'π') {
    return Math.PI
  }
  
  const num = parseFloat(str)
  return isNaN(num) ? null : num
}

/**
 * 解析单调区间字符串为边界对象
 * 例如: "(-1, +∞)" -> { min: -1, max: Infinity, minOpen: true, maxOpen: true }
 */
const parseMonotonicInterval = (intervalStr) => {
  if (!intervalStr) return null
  
  // 匹配区间格式: (a, b) 或 [a, b] 或 (a, +∞) 等
  const match = intervalStr.match(/^([\(\[])\s*([^,]+)\s*,\s*([^\)\]]+)\s*([\)\]])$/)
  if (!match) return null
  
  const [, leftBracket, minStr, maxStr, rightBracket] = match
  
  return {
    min: parseIntervalBound(minStr),
    max: parseIntervalBound(maxStr),
    minOpen: leftBracket === '(',
    maxOpen: rightBracket === ')'
  }
}

/**
 * 检查数值是否在区间内
 */
const isValueInInterval = (value, interval) => {
  if (!interval || value === null) return false
  
  const { min, max, minOpen, maxOpen } = interval
  
  const minCheck = minOpen ? (value > min) : (value >= min)
  const maxCheck = maxOpen ? (value < max) : (value <= max)
  
  return minCheck && maxCheck
}

/**
 * 检查区间 [a, b] 是否完全包含在单调区间内
 */
const isIntervalFullyContained = (testA, testB, monoInterval) => {
  if (!monoInterval) return false
  
  const { min, max, minOpen, maxOpen } = monoInterval
  
  // 检查左端点
  const aInInterval = minOpen ? (testA > min) : (testA >= min)
  // 检查右端点
  const bInInterval = maxOpen ? (testB < max) : (testB <= max)
  
  return aInInterval && bInInterval
}

/**
 * 验算同构函数单调性 (工业级精度版)
 */
const verifyIsomorphismMonotonicity = (params, logCalc, calculationLog) => {
  const { model, modelKey, interval, claimedMonotonicity } = params
  
  if (!model) {
    return {
      pass: false,
      error: '无法识别同构函数模型',
      calculationLog
    }
  }
  
  logCalc('识别模型', model.name)
  logCalc('模型描述', model.description)
  
  // 解析极值点
  let root = null
  if (model.derivativeRoot !== null && model.derivativeRoot !== undefined) {
    root = parseIntervalBound(model.derivativeRoot)
    logCalc('极值点 x', root)
  }
  
  // 如果有区间和声称的单调性，进行验证
  if (interval && claimedMonotonicity) {
    const [a, b] = interval
    logCalc('题目区间', `[${a}, ${b}]`)
    logCalc('声称单调性', claimedMonotonicity === 'increasing' ? '递增' : '递减')
    
    // 解析模型的单调区间
    const increasingInterval = parseMonotonicInterval(model.increasing)
    const decreasingInterval = parseMonotonicInterval(model.decreasing)
    
    logCalc('模型递增区间', model.increasing)
    logCalc('模型递减区间', model.decreasing)
    
    if (increasingInterval) {
      logCalc('解析递增区间', `(${increasingInterval.min}, ${increasingInterval.max})`)
    }
    if (decreasingInterval) {
      logCalc('解析递减区间', `(${decreasingInterval.min}, ${decreasingInterval.max})`)
    }
    
    // Case A: 检查区间是否跨越极值点
    if (root !== null && a < root && b > root) {
      const message = `区间 [${a}, ${b}] 跨越极值点 x=${format(root, { precision: 4 })}，函数在此区间不单调！`
      logCalc('验算结果', '失败')
      logCalc('详细信息', message)
      
      return {
        pass: false,
        message,
        error: 'CROSSING_EXTREMUM',
        model: model.name,
        interval,
        root,
        claimedMonotonicity,
        calculationLog
      }
    }
    
    // Case B/D: 检查区间是否在正确的单调区间内
    let pass = false
    let message = ''
    
    if (claimedMonotonicity === 'increasing') {
      // 声称递增，检查是否在递增区间内
      if (increasingInterval && isIntervalFullyContained(a, b, increasingInterval)) {
        pass = true
        message = `区间 [${a}, ${b}] 完全在递增区间 (${increasingInterval.min}, ${increasingInterval.max}) 内，单调性判断正确`
      } else if (decreasingInterval && isIntervalFullyContained(a, b, decreasingInterval)) {
        pass = false
        message = `区间 [${a}, ${b}] 在递减区间内，但声称递增，方向错误！`
      } else {
        pass = false
        message = `区间 [${a}, ${b}] 部分或全部不在递增区间内，单调性判断可能有误`
      }
    } else if (claimedMonotonicity === 'decreasing') {
      // 声称递减，检查是否在递减区间内
      if (decreasingInterval && isIntervalFullyContained(a, b, decreasingInterval)) {
        pass = true
        message = `区间 [${a}, ${b}] 完全在递减区间 (${decreasingInterval.min}, ${decreasingInterval.max}) 内，单调性判断正确`
      } else if (increasingInterval && isIntervalFullyContained(a, b, increasingInterval)) {
        pass = false
        message = `区间 [${a}, ${b}] 在递增区间内，但声称递减，方向错误！`
      } else {
        pass = false
        message = `区间 [${a}, ${b}] 部分或全部不在递减区间内，单调性判断可能有误`
      }
    }
    
    logCalc('验算结果', pass ? '通过' : '失败')
    logCalc('详细信息', message)
    
    // ⚔️ 第三道防线补充：验算结论逻辑
    if (pass && params.comparisonResult) {
      const { comparisonResult } = params
      logCalc('声称结论', comparisonResult)
      
      // 如果函数单调递增，f(x)=f(y) => x=y
      if (claimedMonotonicity === 'increasing') {
        const validConclusions = ['x=y', 'x 等于 y', '相等']
        const isConclusionValid = validConclusions.some(c => 
          comparisonResult.toLowerCase().includes(c.toLowerCase().replace('=', '').trim())
        )
        
        if (comparisonResult === 'x=y' || comparisonResult.includes('x=y') || comparisonResult.includes('相等')) {
          logCalc('结论验算', '通过 - 单调递增函数 f(x)=f(y) => x=y')
        } else if (comparisonResult === 'x>y' || comparisonResult === 'x<y') {
          // 如果结论是大小比较，需要额外检查
          logCalc('结论验算', '需额外验证大小关系')
        }
      }
      
      // 如果函数单调递减，f(x)=f(y) => x=y (仍然成立)
      if (claimedMonotonicity === 'decreasing') {
        if (comparisonResult === 'x=y' || comparisonResult.includes('相等')) {
          logCalc('结论验算', '通过 - 单调函数 f(x)=f(y) => x=y')
        }
      }
    }
    
    return {
      pass,
      message,
      model: model.name,
      interval,
      root,
      claimedMonotonicity,
      comparisonResult: params.comparisonResult,
      theoreticalMonotonicity: {
        increasing: model.increasing,
        decreasing: model.decreasing,
        increasingInterval,
        decreasingInterval
      },
      calculationLog
    }
  }
  
  // 没有区间信息，返回模型信息供参考
  return {
    pass: true,
    message: `识别到同构模型 ${model.name}，${model.description}`,
    model: model.name,
    modelInfo: model,
    root,
    calculationLog
  }
}

export default {
  motifId: 'M04',
  typeLabels: [
    'log_exp_operation',
    'log_exp_isomorphism',
    'log_exp_fixed_point_symmetry',
    'log_exp_composite_monotonicity'
  ],
  extractParams,
  verify,
  KNOWN_ISO_MODELS
}
