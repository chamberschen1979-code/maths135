# 增强 JSON 提取与清洗逻辑优化方案

## 问题分析

### 问题背景
AI 可能会在输出中复述 Prompt 中的示例标记文字，如：
- "✅ 正确示范"
- "❌ 错误示范"
- `<reasoning>` 和 `<output>` 标签外的废话

---

## 实施方案

### 第一步：增强 `extractJsonFromResponse` 函数

在现有的清洗逻辑前添加"强力清洗层"：

```javascript
const extractJsonFromResponse = (text) => {
  if (!text) return null
  
  let cleanText = text.trim()
  
  // 【新增】强力清洗层：移除 Prompt 示例中可能泄露的标记文字
  const forbiddenPatterns = [
    /✅\s*正确的\s*output.*?:/g,
    /❌\s*错误的\s*output.*?:/g,
    /<reasoning>[\s\S]*?<\/reasoning>/g,
    /^[\s\S]*?<output>/g,
    /<\/output>[\s\S]*$/g
  ]
  
  forbiddenPatterns.forEach(pattern => {
    cleanText = cleanText.replace(pattern, '')
  })
  
  // 1. 去除 Markdown 代码块标记
  const jsonBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (jsonBlockMatch) {
    cleanText = jsonBlockMatch[1].trim()
  }
  
  // 2. 尝试直接解析
  try {
    return JSON.parse(cleanText)
  } catch (e) {
    // 3. 如果失败，尝试寻找第一个 { 和最后一个 } 之间的内容
    const firstBrace = cleanText.indexOf('{')
    const lastBrace = cleanText.lastIndexOf('}')
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const potentialJson = cleanText.substring(firstBrace, lastBrace + 1)
      try {
        return JSON.parse(potentialJson)
      } catch (e2) {
        console.warn("二次解析 JSON 失败:", e2)
      }
    }
  }
  return null
}
```

### 第二步：强化 System Prompt 指令

在 System Prompt 末尾增加"绝对禁令"：

```
🚫 **【绝对禁令】**：
1. 严禁在你的最终回复中包含本提示词中的"✅ 正确示范"、"❌ 错误示范"、"关键规则"等示例标记文字。
2. 严禁复述上述示例中的具体数学内容（如判别式计算），你必须生成全新的题目。
3. 你的回复必须**仅**包含 `<reasoning>...</reasoning>` 和 `<output>...</output>` 两个标签，不得有任何多余的前缀或后缀。
```

---

## 结论

**建议合理，建议实施！**

| 评估项 | 评分 | 说明 |
|--------|------|------|
| 问题定位 | ⭐⭐⭐⭐⭐ | 准确识别了 AI 复述示例的问题 |
| 解决方案 | ⭐⭐⭐⭐ | 双管齐下（清洗 + 禁令） |
| 实施难度 | ⭐⭐⭐⭐⭐ | 改动小，风险低 |
| 预期效果 | ⭐⭐⭐⭐ | 能显著减少格式混乱问题 |
