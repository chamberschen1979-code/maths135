// src/utils/responseParser.js

/**
 * LaTeX 内容清洗与修复
 * 🔧 V10.0 逻辑重构版：解析时容错，输出前脱敏
 */

/**
 * 基础清洗：只做必要的格式统一，不做反斜杠倍增
 */
const sanitizeLatex = (str) => {
  if (!str) return str;
  let cleaned = str;
  
  // 1. 统一换行符，处理控制字符
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // 2. 角度符号修复
  cleaned = cleaned.replace(/(\d+)\s*°/g, '$1^\\circ').replace(/°/g, '^\\circ');
  
  // 3. 【注意】这里不再强制 replace(/\\/g, '\\\\')，让解析策略去处理
  return cleaned;
}

/**
 * 最终输出清洗：将多重转义还原为单转义，确保 KaTeX/MathJax 识别
 */
const finalCleanup = (str) => {
  if (typeof str !== 'string') return str;
  let res = str;
  
  // 将 2个或更多连续反斜杠 统一还原为 1个反斜杠
  // 逻辑：在 JS 字符串里，"\\" 代表一个杠。我们要把所有多余的转义全部干掉。
  res = res.replace(/\\{2,}/g, '\\');
  
  return res;
}

/**
 * JSON 转义字符修复
 * 🔧 V9.5 极简版：删除过度修复的反斜杠处理
 */
const fixJsonEscaping = (jsonString) => {
  let fixed = jsonString

  try {
    JSON.parse(fixed)
    return fixed
  } catch (e) {
    console.log('[JSON修复] 检测到非法JSON，启动深度修复...', e.message)
  }

  fixed = fixed.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

  // 清理控制字符
  fixed = fixed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // 修复常见的 JSON 格式问题
  // 修复未转义的引号（但不是 \" 这种已经转义的）
  fixed = fixed.replace(/(?<!\\)"/g, '\\"')
  
  // 修复未闭合的字符串（简单处理）
  // 注意：不再强制双写反斜杠，让 JSON 解析器自己处理 LaTeX 转义

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
    reasoning: null,
    _fallback: true
  }
  
  // 🔥 新增：更激进的提取策略
  const aggressivePatterns = [
    // 尝试提取 question.content (对象形式)
    /"question"\s*:\s*\{[^}]*"content"\s*:\s*"([\s\S]*?)"\s*\}/,
    // 尝试提取整个 question 对象
    /"question"\s*:\s*(\{[\s\S]*?"content"\s*:\s*"[\s\S]*?"\s*\})/,
    // 尝试提取 reasoning 对象
    /"reasoning"\s*:\s*(\{[\s\S]*?\})\s*,\s*"question"/,
  ]
  
  // 先尝试激进策略
  for (const pattern of aggressivePatterns) {
    const match = rawText.match(pattern)
    if (match && match[1]) {
      console.log(`[JSON 修复] 🟢 激进策略命中`)
      // 如果匹配到 content
      if (match[1].includes('content') || match[1].length > 20) {
        let content = match[1]
        // 清理转义字符
        content = content.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\')
        // 如果匹配的是对象形式，提取 content
        if (content.startsWith('{')) {
          const contentMatch = content.match(/"content"\s*:\s*"([\s\S]*?)"/)
          if (contentMatch) {
            result.question = { content: contentMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') }
          }
        } else {
          result.question = { content }
        }
        break
      }
    }
  }
  
  // 尝试提取 question 字段 (原有逻辑)
  if (!result.question) {
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
  }
  
  // 尝试提取 analysis 字段
  const analysisPatterns = [
    /"analysis"\s*:\s*"([\s\S]*?)"\s*,\s*"/,
    /"analysis"\s*:\s*"([\s\S]*?)"\s*}/,
    /"analysis"\s*:\s*(\{[\s\S]*?\})\s*,\s*"/,
    /解析[：:]\s*([\s\S]*?)(?=答案|$)/,
    /【解析】\s*([\s\S]*?)(?=【答案】|$)/
  ]
  
  for (const pattern of analysisPatterns) {
    const match = rawText.match(pattern)
    if (match && match[1]) {
      let analysis = match[1].trim()
      // 如果是对象形式，提取 core_idea
      if (analysis.startsWith('{')) {
        const coreIdeaMatch = analysis.match(/"core_idea"\s*:\s*"([\s\S]*?)"/)
        if (coreIdeaMatch) {
          result.analysis = { core_idea: coreIdeaMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') }
        }
      } else {
        result.analysis = analysis
      }
      break
    }
  }
  
  // 尝试提取 answer 字段
  const answerPatterns = [
    /"answer"\s*:\s*"([\s\S]*?)"\s*}/,
    /"answer"\s*:\s*\[([\s\S]*?)\]\s*}/,
    /"answer"\s*:\s*(\{[\s\S]*?\})\s*}/,
    /答案[：:]\s*([\s\S]*?)(?=$)/,
    /【答案】\s*([\s\S]*?)(?=$)/
  ]
  
  for (const pattern of answerPatterns) {
    const match = rawText.match(pattern)
    if (match && match[1]) {
      let answer = match[1].trim()
      // 如果是对象形式，提取 l1
      if (answer.startsWith('{')) {
        const l1Match = answer.match(/"l1"\s*:\s*"([\s\S]*?)"/)
        const l2Match = answer.match(/"l2"\s*:\s*"([\s\S]*?)"/)
        result.answer = {
          l1: l1Match ? l1Match[1].replace(/\\"/g, '"') : null,
          l2: l2Match ? l2Match[1].replace(/\\"/g, '"') : null
        }
      } else {
        result.answer = answer
      }
      break
    }
  }
  
  // 尝试提取 reasoning 字段
  const reasoningPatterns = [
    /"reasoning"\s*:\s*(\{[\s\S]*?\})\s*,\s*"question"/,
    /"reasoning"\s*:\s*"([\s\S]*?)"\s*,\s*"question"/
  ]
  
  for (const pattern of reasoningPatterns) {
    const match = rawText.match(pattern)
    if (match && match[1]) {
      result.reasoning = match[1].trim()
      break
    }
  }
  
  // 检查是否至少提取到一个字段
  if (!result.question && !result.analysis && !result.answer) {
    // 🔥 最后的尝试：直接提取所有中文内容
    const lastResortMatch = rawText.match(/[\u4e00-\u9fa5]+[\s\S]*?[\u4e00-\u9fa5]+/g)
    if (lastResortMatch && lastResortMatch.length > 0) {
      console.log('[JSON 修复] 🟡 最后手段：提取所有中文内容')
      result.question = { content: lastResortMatch.slice(0, 3).join('\n') }
      result.analysis = { core_idea: '自动提取' }
      result.answer = { l1: null, l2: null }
      result._lastResort = true
    } else {
      throw new Error("Fallback 模式也无法提取任何有效字段")
    }
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
          let cleaned = s
          
          // 1. 保护 $...$ 中的 LaTeX 内容
          const latexPlaceholders = []
          cleaned = cleaned.replace(/\$([^$]+)\$/g, (match, latex) => {
            const fixed = latex.replace(/"/g, "'")
            latexPlaceholders.push(fixed)
            return `__LATEX_${latexPlaceholders.length - 1}__`
          })
          
          // 2. 清理控制字符
          cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
          
          // 3. 【关键】将单反斜杠转为双反斜杠，确保 JSON.parse 通过
          // 这样即使 AI 返回 \frac，也能骗过 JSON.parse
          cleaned = cleaned.replace(/\\/g, '\\\\')
          
          // 4. 还原 LaTeX 占位符
          latexPlaceholders.forEach((latex, i) => {
            cleaned = cleaned.replace(`__LATEX_${i}__`, `$${latex}$`)
          })
          
          return cleaned
        }
      },
      { 
        name: '宽松模式', 
        fn: (s) => {
          let cleaned = s.replace(/[\x00-\x1F\x7F]/g, (char) => {
            if (char === '\n' || char === '\r' || char === '\t') return char
            return ''
          })
          cleaned = cleaned.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
          return cleaned
        }
      }
      // ⚠️ 已停用"激进修复"和"超级修复"策略
      // 这两个策略在处理标准 LaTeX 时往往"帮倒忙"
      // LaTeX 预处理 和 宽松模式 已经足够应对 90% 的场景
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
        parsedObj.question = finalCleanup(sanitizeLatex(parsedObj.question))
      } else if (parsedObj.question.content) {
        parsedObj.question.content = finalCleanup(sanitizeLatex(parsedObj.question.content))
      }
    }
    
    // 2. 处理 Analysis (保留换行，因为解析需要段落结构)
    if (parsedObj.analysis) {
      if (typeof parsedObj.analysis === 'string') {
        parsedObj.analysis = finalCleanup(sanitizeLatex(parsedObj.analysis))
      } else {
        if (parsedObj.analysis.core_idea) parsedObj.analysis.core_idea = finalCleanup(sanitizeLatex(parsedObj.analysis.core_idea))
        if (parsedObj.analysis.steps && Array.isArray(parsedObj.analysis.steps)) {
          parsedObj.analysis.steps = parsedObj.analysis.steps.map(step => finalCleanup(sanitizeLatex(step)))
        }
        if (parsedObj.analysis.trap_hint) parsedObj.analysis.trap_hint = finalCleanup(sanitizeLatex(parsedObj.analysis.trap_hint))
        Object.keys(parsedObj.analysis).forEach(key => {
          if (typeof parsedObj.analysis[key] === 'string' && !['core_idea', 'steps', 'trap_hint'].includes(key)) {
             parsedObj.analysis[key] = finalCleanup(sanitizeLatex(parsedObj.analysis[key]))
          }
        })
      }
    }
    
    // 3. 处理 Answer
    if (parsedObj.answer) {
      const processStr = (before) => {
        if (typeof before !== 'string') return before;
        
        // 保留原始换行，只清理多余空格
        let ans = before.trim()
        
        // 【核心修复】先清理多余杠，确保 KaTeX 识别
        ans = finalCleanup(ans)
 
        // 自动包裹数学内容 (只有在没有 $ 且看起来像数学公式时)
        const mathSigns = ['\\', '^', '_', '{', '}', '=', '>', '<']
        const looksLikeMath = mathSigns.some(sign => ans.includes(sign))
        
        if (ans && !ans.includes('$') && looksLikeMath) {
          ans = `$${ans}$`
        }
        return ans;
      }

      if (typeof parsedObj.answer === 'string') {
        parsedObj.answer = processStr(parsedObj.answer)
      } else {
        Object.keys(parsedObj.answer).forEach(key => {
          const before = parsedObj.answer[key]
          parsedObj.answer[key] = processStr(before)
          
          const after = parsedObj.answer[key]
          if (before !== after) {
            console.log(`🟢 [已修复] answer.${key}:`, before.substring(0, 50), "->", after.substring(0, 50))
          } else {
            console.log(`⚪ [无变化] answer.${key}:`, before.substring(0, 50))
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