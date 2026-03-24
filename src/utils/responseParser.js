// src/utils/responseParser.js

/**
 * LaTeX 内容清洗与修复
 * 
 * ⚠️ 转义字符特别说明：
 * 在 JS 字符串中，要表示正则中的单个反斜杠 \，需要写四个反斜杠 \\\\
 */
const sanitizeLatex = (str) => {
  if (!str) return str
  let cleaned = str

  // 1. 清理 Markdown 标记
  cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '')
  
  // 2. 修复错误的美元符包裹 "$ $" -> "$$"
  cleaned = cleaned.replace(/\$\s+\$/g, '$$')

  // 3. 【关键】预处理：移除命令与参数之间的空白 (解决 "sqrt 2" -> "sqrt2")
  const commandsThatNeedArgs = [
    'sqrt', 'frac', 'mathbb', 'text', 'bf', 'it', 'rm', 'cal', 'bb', 
    'vec', 'hat', 'bar', 'tilde', 'widehat', 'widetilde', 'overline', 
    'underline', 'left', 'right'
  ]
  
  commandsThatNeedArgs.forEach(cmd => {
    const regex = new RegExp(`(?<!\\\\)${cmd}\\s+([a-zA-Z0-9()])`, 'g')
    cleaned = cleaned.replace(regex, `${cmd}$1`)
  })

  // 4. 【修复 BUG】修复上标/下标缺失花括号 (保护 ^\circ 等命令)
  // 4.1 处理数字：^2 -> ^{2}
  cleaned = cleaned.replace(/([\^_])\s*([0-9]+)/g, '$1{$2}')
  
  // 4.2 处理单字母 (且前面没有反斜杠)：^x -> ^{x}
  cleaned = cleaned.replace(/([\^_])\s*(?<!\\)([a-zA-Z])(?![a-zA-Z])/g, '$1{$2}')
  
  // 4.3 处理命令前的多余空格：^ \circ -> ^\circ (不要加花括号)
  cleaned = cleaned.replace(/([\^_])\s+(\\[a-zA-Z]+)/g, '$1$2')

  // 5. 【核心修复】针对 "命令 + 数字/字母" 的紧凑格式
  // 5.1 sqrt
  cleaned = cleaned.replace(/(?<!\\)sqrt(\d+)/g, '\\sqrt{$1}')
  cleaned = cleaned.replace(/(?<!\\)sqrt([a-zA-Z])(?!\w)/g, '\\sqrt{$1}')

  // 5.2 frac
  cleaned = cleaned.replace(/(?<!\\)frac(\d+)(\d+)/g, '\\frac{$1}{$2}')
  
  // 5.3 mathbb
  cleaned = cleaned.replace(/(?<!\\)mathbb([A-Z])/g, '\\mathbb{$1}')
  
  // 5.4 希腊字母 + 数字
  const greekWithNumbers = ['alpha', 'beta', 'gamma', 'delta', 'theta', 'pi', 'sigma', 'omega']
  greekWithNumbers.forEach(cmd => {
    const regex = new RegExp(`(?<!\\\\)${cmd}(\\d+)`, 'g')
    cleaned = cleaned.replace(regex, `\\${cmd}$1`)
  })

  // 6. 普通命令修复列表
  const latexFixes = [
    // --- 集合论 ---
    { pattern: /(?<!\\)\bmid\b/g, replacement: '\\mid' },
    { pattern: /(?<!\\)\bcap\b/g, replacement: '\\cap' },
    { pattern: /(?<!\\)\bcup\b/g, replacement: '\\cup' },
    { pattern: /(?<!\\)\bemptyset\b/g, replacement: '\\emptyset' },
    { pattern: /(?<!\\)\bin\b(?![a-z])/g, replacement: '\\in' },
    { pattern: /(?<!\\)\bnotin\b/g, replacement: '\\notin' },
    { pattern: /(?<!\\)\bsubset\b/g, replacement: '\\subset' },
    { pattern: /(?<!\\)\bsubseteq\b/g, replacement: '\\subseteq' },
    { pattern: /(?<!\\)\bunion\b/g, replacement: '\\cup' },
    { pattern: /(?<!\\)\bintersection\b/g, replacement: '\\cap' },
    { pattern: /(?<!\\)\bcomplement\b/g, replacement: '\\complement' },
    
    // --- 希腊字母 ---
    { pattern: /(?<!\\)\balpha\b/g, replacement: '\\alpha' },
    { pattern: /(?<!\\)\bbeta\b/g, replacement: '\\beta' },
    { pattern: /(?<!\\)\bgamma\b/g, replacement: '\\gamma' },
    { pattern: /(?<!\\)\bdelta\b/g, replacement: '\\delta' },
    { pattern: /(?<!\\)\bDelta\b/g, replacement: '\\Delta' },
    { pattern: /(?<!\\)\bpi\b(?!\s*\()/g, replacement: '\\pi' },
    { pattern: /(?<!\\)\btheta\b/g, replacement: '\\theta' },
    { pattern: /(?<!\\)\blambda\b/g, replacement: '\\lambda' },
    { pattern: /(?<!\\)\bmu\b/g, replacement: '\\mu' },
    { pattern: /(?<!\\)\bsigma\b/g, replacement: '\\sigma' },
    { pattern: /(?<!\\)\bomega\b/g, replacement: '\\omega' },
    { pattern: /(?<!\\)\bOmega\b/g, replacement: '\\Omega' },
    { pattern: /(?<!\\)\bphi\b/g, replacement: '\\phi' },
    { pattern: /(?<!\\)\bPhi\b/g, replacement: '\\Phi' },
    { pattern: /(?<!\\)\bepsilon\b/g, replacement: '\\epsilon' },

    // --- 运算符 ---
    { pattern: /(?<!\\)\binfty\b/g, replacement: '\\infty' },
    { pattern: /(?<!\\)\bpartial\b/g, replacement: '\\partial' },
    { pattern: /(?<!\\)\bleq\b/g, replacement: '\\leq' },
    { pattern: /(?<!\\)\bgeq\b/g, replacement: '\\geq' },
    { pattern: /(?<!\\)\bneq\b/g, replacement: '\\neq' },
    { pattern: /(?<!\\)\bapprox\b/g, replacement: '\\approx' },
    { pattern: /(?<!\\)\bcdot\b/g, replacement: '\\cdot' },
    { pattern: /(?<!\\)\btimes\b/g, replacement: '\\times' },
    { pattern: /(?<!\\)\bdiv\b/g, replacement: '\\div' },
    { pattern: /(?<!\\)\bpm\b/g, replacement: '\\pm' },
    { pattern: /(?<!\\)\bmp\b/g, replacement: '\\mp' },
    { pattern: /(?<!\\)\bprime\b/g, replacement: '\\prime' },
    { pattern: /(?<!\\)\bcirc\b/g, replacement: '\\circ' },
    
    // --- 大型运算符 ---
    { pattern: /(?<!\\)\bsum\b(?!\s*=)/g, replacement: '\\sum' },
    { pattern: /(?<!\\)\bprod\b/g, replacement: '\\prod' },
    { pattern: /(?<!\\)\bint\b/g, replacement: '\\int' },

    // --- 三角函数/对数 ---
    { pattern: /(?<!\\)\bsin\b/g, replacement: '\\sin' },
    { pattern: /(?<!\\)\bcos\b/g, replacement: '\\cos' },
    { pattern: /(?<!\\)\btan\b/g, replacement: '\\tan' },
    { pattern: /(?<!\\)\bcot\b/g, replacement: '\\cot' },
    { pattern: /(?<!\\)\bsec\b/g, replacement: '\\sec' },
    { pattern: /(?<!\\)\bcsc\b/g, replacement: '\\csc' },
    { pattern: /(?<!\\)\blog\b/g, replacement: '\\log' },
    { pattern: /(?<!\\)\bln\b/g, replacement: '\\ln' },
    { pattern: /(?<!\\)\blim\b/g, replacement: '\\lim' },
    { pattern: /(?<!\\)\bexp\b/g, replacement: '\\exp' },

    // --- 箭头与关系 ---
    { pattern: /(?<!\\)\bto\b/g, replacement: '\\to' },
    { pattern: /(?<!\\)\bgets\b/g, replacement: '\\gets' },
    { pattern: /(?<!\\)\brightarrow\b/g, replacement: '\\rightarrow' },
    { pattern: /(?<!\\)\bleftarrow\b/g, replacement: '\\leftarrow' },
    { pattern: /(?<!\\)\bRightarrow\b/g, replacement: '\\Rightarrow' },
    { pattern: /(?<!\\)\bLeftarrow\b/g, replacement: '\\Leftarrow' },
    { pattern: /(?<!\\)\bleftrightarrow\b/g, replacement: '\\leftrightarrow' },
    { pattern: /(?<!\\)\bequiv\b/g, replacement: '\\equiv' },
    { pattern: /(?<!\\)\bcong\b/g, replacement: '\\cong' },
    { pattern: /(?<!\\)\bperp\b/g, replacement: '\\perp' },
    { pattern: /(?<!\\)\bparallel\b/g, replacement: '\\parallel' },
    { pattern: /(?<!\\)\bangle\b/g, replacement: '\\angle' },
    { pattern: /(?<!\\)\bmeasuredangle\b/g, replacement: '\\measuredangle' },
    { pattern: /(?<!\\)\bsphericalangle\b/g, replacement: '\\sphericalangle' },

    // --- 逻辑量词 ---
    { pattern: /(?<!\\)\bforall\b/g, replacement: '\\forall' },
    { pattern: /(?<!\\)\bexists\b/g, replacement: '\\exists' },
    { pattern: /(?<!\\)\bnexists\b/g, replacement: '\\nexists' },

    // --- 排版与符号 ---
    { pattern: /(?<!\\)\bdots\b/g, replacement: '\\dots' },
    { pattern: /(?<!\\)\bcdots\b/g, replacement: '\\cdots' },
    { pattern: /(?<!\\)\bldots\b/g, replacement: '\\ldots' },
    { pattern: /(?<!\\)\bvdots\b/g, replacement: '\\vdots' },
    { pattern: /(?<!\\)\bddots\b/g, replacement: '\\ddots' },
    { pattern: /(?<!\\)\bquad\b/g, replacement: '\\quad' },
    { pattern: /(?<!\\)\bqquad\b/g, replacement: '\\qquad' },
    { pattern: /(?<!\\)\bleft\b/g, replacement: '\\left' },
    { pattern: /(?<!\\)\bright\b/g, replacement: '\\right' },
    { pattern: /(?<!\\)\bBig\b/g, replacement: '\\Big' },
    { pattern: /(?<!\\)\bbigg\b/g, replacement: '\\bigg' },
    { pattern: /(?<!\\)\bBigg\b/g, replacement: '\\Bigg' },
    { pattern: /(?<!\\)\boverline\b/g, replacement: '\\overline' },
    { pattern: /(?<!\\)\bunderline\b/g, replacement: '\\underline' },
    { pattern: /(?<!\\)\bvec\b/g, replacement: '\\vec' },
    { pattern: /(?<!\\)\bhat\b/g, replacement: '\\hat' },
    { pattern: /(?<!\\)\bbar\b/g, replacement: '\\bar' },
    { pattern: /(?<!\\)\btilde\b/g, replacement: '\\tilde' },
    { pattern: /(?<!\\)\bwidehat\b/g, replacement: '\\widehat' },
    { pattern: /(?<!\\)\bwidetilde\b/g, replacement: '\\widetilde' },
    
    // --- 特殊关系 ---
    { pattern: /(?<!\\)\bll\b/g, replacement: '\\ll' },
    { pattern: /(?<!\\)\bgg\b/g, replacement: '\\gg' },
    { pattern: /(?<!\\)\bprec\b/g, replacement: '\\prec' },
    { pattern: /(?<!\\)\bsucc\b/g, replacement: '\\succ' },
    { pattern: /(?<!\\)\bpreceq\b/g, replacement: '\\preceq' },
    { pattern: /(?<!\\)\bsucceq\b/g, replacement: '\\succeq' },
    { pattern: /(?<!\\)\bsim\b/g, replacement: '\\sim' },
    { pattern: /(?<!\\)\bpropto\b/g, replacement: '\\propto' },
    { pattern: /(?<!\\)\bleqslant\b/g, replacement: '\\leqslant' },
    { pattern: /(?<!\\)\bgeqslant\b/g, replacement: '\\geqslant' },
  ]

  for (const { pattern, replacement } of latexFixes) {
    cleaned = cleaned.replace(pattern, replacement)
  }

  return cleaned
}

/**
 * JSON 转义字符修复
 */
const fixJsonEscaping = (jsonString) => {
  let fixed = jsonString

  // 1. 修复特殊符号前的单反斜杠
  fixed = fixed.replace(/(?<!\\)\\([{}_%&^#~])/g, '\\\\$1')

  // 2. 修复已知 LaTeX 命令前的单反斜杠
  const latexCommands = [
    'frac', 'sqrt', 'sum', 'int', 'infty', 'geq', 'leq', 'neq', 'approx', 'equiv',
    'cdot', 'times', 'div', 'alpha', 'beta', 'gamma', 'delta', 'Delta', 'pi',
    'theta', 'lambda', 'mu', 'sigma', 'Sigma', 'Omega', 'omega', 'epsilon', 'phi', 'Phi',
    'mathbb', 'mathbf', 'mathcal', 'text', 'textbf', 'textit',
    'dots', 'cdots', 'ldots', 'vdots', 'ddots',
    'quad', 'qquad', 'left', 'right', 'mid', 'Big', 'bigg', 'Bigg',
    'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
    'arcsin', 'arccos', 'arctan',
    'log', 'ln', 'lg', 'exp',
    'lim', 'limsup', 'liminf',
    'vec', 'hat', 'bar', 'tilde', 'overline', 'underline', 'overrightarrow',
    'partial', 'nabla', 'forall', 'exists', 'in', 'notin', 'subset', 'subseteq',
    'cup', 'cap', 'emptyset', 'varnothing',
    'rightarrow', 'leftarrow', 'Rightarrow', 'Leftarrow', 'leftrightarrow',
    'prime', 'circ', 'angle', 'perp', 'parallel',
    'R', 'N', 'Z', 'Q', 'C',
    'Re', 'Im', 'arg', 'deg', 'gcd', 'lcm', 'mod', 'pm', 'mp', 'll', 'gg',
    'complement', 'measuredangle', 'sphericalangle', 'nexists', 'leqslant', 'geqslant',
    'prec', 'succ', 'preceq', 'succeq', 'sim', 'propto', 'widehat', 'widetilde'
  ]
  const cmdPattern = latexCommands.join('|')
  fixed = fixed.replace(new RegExp(`(?<!\\\\)\\\\(${cmdPattern})`, 'g'), '\\\\$1')

  // 3. 兜底规则
  fixed = fixed.replace(/(?<!\\)\\([^"\\\/bfnrtu{}_%&^#~])/g, '\\\\$1')

  return fixed
}

/**
 * 从原始文本中提取 JSON 字符串
 * 🚀 V5.1 增强：支持多种代码块格式和更强的容错能力
 */
const extractJsonString = (rawText) => {
  // 1. 先尝试匹配 ```json 代码块 (最高优先级)
  const jsonBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonBlockMatch) {
    const content = jsonBlockMatch[1].trim()
    if (content.startsWith('{') && content.endsWith('}')) {
      console.log('[JSON提取] 从 markdown 代码块中提取成功')
      return content
    }
  }
  
  // 2. 尝试匹配 ```json ... ``` 格式 (可能没有闭合的 ```)
  const openBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*)/)
  if (openBlockMatch) {
    const content = openBlockMatch[1].trim()
    // 尝试找到最后一个 }
    const lastBrace = content.lastIndexOf('}')
    if (lastBrace > 0) {
      const potentialJson = content.substring(0, lastBrace + 1)
      if (potentialJson.startsWith('{')) {
        console.log('[JSON提取] 从未闭合的代码块中提取成功')
        return potentialJson
      }
    }
  }
  
  // 3. 尝试找到第一个完整的 JSON 对象
  const firstBrace = rawText.indexOf('{')
  if (firstBrace === -1) {
    throw new Error("未在响应中找到有效的 JSON 花括号结构")
  }
  
  // 使用括号匹配找到完整的 JSON
  let depth = 0
  let inString = false
  let escape = false
  let endPos = -1
  
  for (let i = firstBrace; i < rawText.length; i++) {
    const char = rawText[i]
    
    if (escape) {
      escape = false
      continue
    }
    
    if (char === '\\') {
      escape = true
      continue
    }
    
    if (char === '"') {
      inString = !inString
      continue
    }
    
    if (!inString) {
      if (char === '{') depth++
      else if (char === '}') {
        depth--
        if (depth === 0) {
          endPos = i
          break
        }
      }
    }
  }
  
  if (endPos === -1) {
    throw new Error("未找到完整的 JSON 结构")
  }
  
  console.log('[JSON提取] 从原始文本中提取成功')
  return rawText.substring(firstBrace, endPos + 1)
}

/**
 * 🚀 V6.0 流式解析 Fallback
 * 当 JSON 解析彻底失败时，使用正则表达式直接提取关键字段
 */
const fallbackExtractFields = (rawText) => {
  console.log('[JSON提取] 🚨 启用 Fallback 模式：正则提取')
  
  const result = {
    question: null,
    analysis: null,
    answer: null,
    _fallback: true
  }
  
  // 尝试提取 question 字段
  const questionPatterns = [
    /"question"\s*:\s*"([\s\S]*?)"\s*,\s*"/,
    /"question"\s*:\s*"([\s\S]*?)"\s*}/,
    /题目[：:]\s*([\s\S]*?)(?=解析|答案|$)/,
    /【题目】\s*([\s\S]*?)(?=【解析】|【答案】|$)/
  ]
  
  for (const pattern of questionPatterns) {
    const match = rawText.match(pattern)
    if (match && match[1]) {
      result.question = match[1].trim()
      break
    }
  }
  
  // 尝试提取 analysis 字段
  const analysisPatterns = [
    /"analysis"\s*:\s*"([\s\S]*?)"\s*,\s*"/,
    /"analysis"\s*:\s*"([\s\S]*?)"\s*}/,
    /解析[：:]\s*([\s\S]*?)(?=答案|$)/,
    /【解析】\s*([\s\S]*?)(?=【答案】|$)/
  ]
  
  for (const pattern of analysisPatterns) {
    const match = rawText.match(pattern)
    if (match && match[1]) {
      result.analysis = match[1].trim()
      break
    }
  }
  
  // 尝试提取 answer 字段
  const answerPatterns = [
    /"answer"\s*:\s*"([\s\S]*?)"\s*}/,
    /"answer"\s*:\s*\[([\s\S]*?)\]\s*}/,
    /答案[：:]\s*([\s\S]*?)(?=$)/,
    /【答案】\s*([\s\S]*?)(?=$)/
  ]
  
  for (const pattern of answerPatterns) {
    const match = rawText.match(pattern)
    if (match && match[1]) {
      result.answer = match[1].trim()
      break
    }
  }
  
  // 检查是否至少提取到一个字段
  if (!result.question && !result.analysis && !result.answer) {
    throw new Error("Fallback 模式也无法提取任何有效字段")
  }
  
  console.log('[JSON提取] ✅ Fallback 模式提取成功')
  return result
}

/**
 * 清洗 reasoning 字段 (移除 LaTeX 符号，只留纯文本)
 */
const cleanReasoning = (obj) => {
  if (typeof obj === 'string') {
    return obj
      .replace(/\$/g, '')
      .replace(/\\(frac|sqrt|sum|int|infty|alpha|beta|gamma|delta|pi|theta|lambda|mu|sigma|omega|phi|left|right|mid|cap|cup|in|notin|subset|subseteq|geq|leq|neq|approx|cdot|times|div|sin|cos|tan|log|ln|lim|vec|hat|bar|overline|underline|dots|cdots|quad|forall|exists|equiv|cong|perp|parallel|angle|prime|pm|mp|ll|gg|circ|complement|to|gets|rightarrow|leftarrow|Rightarrow|Leftarrow|leqslant|geqslant|prec|succ|preceq|succeq|sim|propto|widehat|widetilde|nexists|measuredangle|sphericalangle|arcsin|arccos|arctan|sec|csc|exp|limsup|liminf|nabla|partial|text|textbf|textit|mathbb|mathbf|mathcal|tilde|varnothing|Re|Im|arg|deg|gcd|lcm|mod|R|N|Z|Q|C|Delta|Sigma|Omega|Phi|epsilon)/g, '$1')
  }
  if (Array.isArray(obj)) return obj.map(item => cleanReasoning(item))
  if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach(k => obj[k] = cleanReasoning(obj[k]))
  }
  return obj
}

/**
 * 主解析入口
 */
export const parseAIResponse = (rawText) => {
  try {
    // 🔧 修复5: 预处理原始文本，处理常见的 LaTeX 转义问题
    let preprocessedText = rawText
    
    // 5.1 统一换行符
    preprocessedText = preprocessedText.replace(/\r\n/g, '\n')
    
    // 5.2 处理 JSON 字符串中的双反斜杠问题
    // AI 返回的 \\frac 在 JSON 中应该表示为 \\\\frac
    // 但有时 AI 直接返回 \frac，导致 JSON 解析失败
    
    const jsonString = extractJsonString(preprocessedText)
    let parsedObj
    
    // 尝试多种解析策略
    const parseStrategies = [
      { name: '原始解析', fn: (s) => s },
      { name: '修复转义', fn: fixJsonEscaping },
      {
        name: 'LaTeX 预处理',
        fn: (s) => {
          // 🔧 新增：针对 LaTeX 内容的预处理
          let cleaned = s
          
          // 1. 临时替换 LaTeX 公式中的问题字符
          // 将 $...$ 中的内容临时保护起来
          const latexPlaceholders = []
          cleaned = cleaned.replace(/\$([^$]+)\$/g, (match, latex) => {
            // 修复 LaTeX 内部的双引号问题
            const fixed = latex.replace(/"/g, "'")
            latexPlaceholders.push(fixed)
            return `__LATEX_${latexPlaceholders.length - 1}__`
          })
          
          // 2. 修复字符串值中的问题
          // 移除控制字符（保留换行、制表符）
          cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
          
          // 3. 还原 LaTeX 公式
          latexPlaceholders.forEach((latex, i) => {
            cleaned = cleaned.replace(`__LATEX_${i}__`, `$${latex}$`)
          })
          
          return cleaned
        }
      },
      { 
        name: '宽松模式', 
        fn: (s) => {
          // 移除控制字符
          let cleaned = s.replace(/[\x00-\x1F\x7F]/g, (char) => {
            if (char === '\n' || char === '\r' || char === '\t') return char
            return ''
          })
          // 修复未转义的反斜杠
          cleaned = cleaned.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
          return cleaned
        }
      },
      {
        name: '激进修复',
        fn: (s) => {
          // 将所有单反斜杠变成双反斜杠（除了 JSON 特殊字符）
          let cleaned = s
          // 先保护已正确转义的
          cleaned = cleaned.replace(/\\\\(["\\/bfnrtu])/g, '\x00$1')
          // 转义单反斜杠
          cleaned = cleaned.replace(/\\/g, '\\\\')
          // 恢复保护的
          cleaned = cleaned.replace(/\x00(["\\/bfnrtu])/g, '\\\\$1')
          return cleaned
        }
      }
    ]
    
    let lastError = null
    for (const strategy of parseStrategies) {
      try {
        const processedString = strategy.fn(jsonString)
        parsedObj = JSON.parse(processedString)
        if (strategy.name !== '原始解析') {
          console.warn(`[JSON 修复] 使用策略 "${strategy.name}" 成功解析`)
        }
        break
      } catch (e) {
        lastError = e
        console.warn(`[JSON 修复] 策略 "${strategy.name}" 失败: ${e.message.substring(0, 50)}`)
        continue
      }
    }
    
    if (!parsedObj) {
      console.error("[JSON 修复] 所有解析策略均失败，尝试 Fallback 模式")
      
      // 🚀 V6.0 启用 Fallback 模式
      try {
        const fallbackResult = fallbackExtractFields(rawText)
        if (fallbackResult) {
          console.log("[JSON 修复] ✅ Fallback 模式成功提取字段")
          parsedObj = fallbackResult
        } else {
          throw new Error("Fallback 模式也失败")
        }
      } catch (fallbackError) {
        console.error("[JSON 修复] Fallback 模式失败:", fallbackError.message)
        throw new Error(`JSON 格式严重错误：${lastError?.message || '未知错误'}`)
      }
    }

    if (!parsedObj.question && !parsedObj.analysis && !parsedObj.answer) {
      throw new Error("JSON 结构缺失必要字段")
    }

    // --- 调试：打印处理前的 answer.l1 ---
    if (parsedObj.answer && parsedObj.answer.l1) {
       console.log("🔴 [处理前] answer.l1:", parsedObj.answer.l1.substring(0, 100))
    }

    // 1. 处理 Question (保留换行，因为题干可能有多行)
    if (parsedObj.question) {
      if (typeof parsedObj.question === 'string') {
        parsedObj.question = sanitizeLatex(parsedObj.question)
      } else if (parsedObj.question.content) {
        parsedObj.question.content = sanitizeLatex(parsedObj.question.content)
      }
    }
    
    // 2. 处理 Analysis (保留换行，因为解析需要段落结构)
    if (parsedObj.analysis) {
      if (typeof parsedObj.analysis === 'string') {
        parsedObj.analysis = sanitizeLatex(parsedObj.analysis)
      } else {
        if (parsedObj.analysis.core_idea) parsedObj.analysis.core_idea = sanitizeLatex(parsedObj.analysis.core_idea)
        if (parsedObj.analysis.steps && Array.isArray(parsedObj.analysis.steps)) {
          parsedObj.analysis.steps = parsedObj.analysis.steps.map(step => sanitizeLatex(step))
        }
        if (parsedObj.analysis.trap_hint) parsedObj.analysis.trap_hint = sanitizeLatex(parsedObj.analysis.trap_hint)
        Object.keys(parsedObj.analysis).forEach(key => {
          if (typeof parsedObj.analysis[key] === 'string' && !['core_idea', 'steps', 'trap_hint'].includes(key)) {
             parsedObj.analysis[key] = sanitizeLatex(parsedObj.analysis[key])
          }
        })
      }
    }
    
    // 3. 处理 Answer (【关键修复】强制移除换行符，防止公式断裂)
    if (parsedObj.answer) {
      if (typeof parsedObj.answer === 'string') {
        // 先移除换行，再清洗
        parsedObj.answer = sanitizeLatex(parsedObj.answer.replace(/\n/g, ' ').replace(/\s+/g, ' '))
      } else {
        Object.keys(parsedObj.answer).forEach(key => {
          const before = parsedObj.answer[key]
          if (typeof before === 'string') {
            // 【核心逻辑】移除换行符，合并多余空格
            const noNewLineStr = before.replace(/\n/g, ' ').replace(/\s+/g, ' ')
            parsedObj.answer[key] = sanitizeLatex(noNewLineStr)
            
            const after = parsedObj.answer[key]
            if (before !== after) {
               console.log(`🟢 [已修复] answer.${key}:`, before.substring(0, 50), "->", after.substring(0, 50))
            } else {
               console.log(`⚪ [无变化] answer.${key}:`, before.substring(0, 50))
            }
          }
        })
      }
    }

    // 4. 处理 Reasoning
    if (parsedObj.reasoning) {
      parsedObj.reasoning = cleanReasoning(parsedObj.reasoning)
    }
    
    // 🔧 修复6: 确保返回的对象包含 content 字段
    // 兼容多种结构，确保后续验证能正确读取题目内容
    if (!parsedObj.content) {
      parsedObj.content = parsedObj.question?.content || 
                          parsedObj.question || 
                          parsedObj.text || 
                          ''
    }

    return { success: true, data: parsedObj }

  } catch (error) {
    console.error("解析失败详情:", error.message)
    return {
      success: false,
      error: error.message,
      rawPreview: rawText.substring(0, 500)
    }
  }
}