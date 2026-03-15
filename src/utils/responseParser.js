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
 */
const extractJsonString = (rawText) => {
  const jsonBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonBlockMatch) {
    const content = jsonBlockMatch[1].trim()
    if (content.startsWith('{') && content.endsWith('}')) {
      return content
    }
  }
  const firstBrace = rawText.indexOf('{')
  const lastBrace = rawText.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("未在响应中找到有效的 JSON 花括号结构")
  }
  return rawText.substring(firstBrace, lastBrace + 1)
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
    const jsonString = extractJsonString(rawText)
    let parsedObj
    
    try {
      parsedObj = JSON.parse(jsonString)
    } catch (e) {
      console.warn("[JSON 修复] 原始解析失败，尝试修复转义字符...")
      const fixedString = fixJsonEscaping(jsonString)
      try {
        parsedObj = JSON.parse(fixedString)
        console.warn("[JSON 修复] 自动修复成功")
      } catch (e2) {
        console.error("[JSON 修复] 修复后仍失败")
        throw new Error(`JSON 格式严重错误：${e.message}`)
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