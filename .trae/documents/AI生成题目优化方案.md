# AI 生成题目优化方案

## 问题分析

### 问题 1：Token 限制导致截断
- 当前 `max_tokens: 4000` 太小
- 复杂数学题需要更长的解析
- 导致 AI 生成被截断

### 问题 2：流式拼接逻辑问题
- 流式传输过程中直接解析 JSON
- 可能导致解析失败
- 需要等待所有数据接收完毕后再解析

---

## 优化方案

### 第一步：扩大 Token 上限

**修改位置**：`src/components/WeeklyMission.jsx` 第 781 行

```javascript
// ❌ 原代码 (太小了)
max_tokens: 4000,

// ✅ 修改为 (建议 6000-8000，保证能写完长解析)
max_tokens: 8000,
```

**说明**：虽然之前为了速度减小了它，但对于复杂数学题，必须保证完整性。

---

### 第二步：修复流式拼接与解析逻辑

**修改位置**：`src/components/WeeklyMission.jsx` 第 790-816 行

**修改前**：
```javascript
// 流式读取响应
const reader = response.body.getReader()
const decoder = new TextDecoder()
let aiContent = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  
  const chunk = decoder.decode(value, { stream: true })
  const lines = chunk.split('\n')
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const dataStr = line.slice(6).trim()
      if (dataStr === '[DONE]') continue
      
      try {
        const data = JSON.parse(dataStr)
        const content = data.choices?.[0]?.delta?.content || ''
        aiContent += content
      } catch (e) {
        // 忽略解析错误
      }
    }
  }
}
```

**修改后**：
```javascript
// 流式读取响应
const reader = response.body.getReader()
const decoder = new TextDecoder()
let fullContent = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  
  const chunk = decoder.decode(value, { stream: true })
  fullContent += chunk
}

// 循环结束后，再处理完整内容
console.log("接收完成，原始内容长度:", fullContent.length)

// 检查是否包含中断标记
if (fullContent.includes("【AI 生成中断】") || fullContent.includes("数据截断异常")) {
  throw new Error("AI 生成被截断，请增加 max_tokens 或重试")
}

// 解析 SSE 格式的数据
let aiContent = ''
const lines = fullContent.split('\n')
for (const line of lines) {
  if (line.startsWith('data: ')) {
    const dataStr = line.slice(6).trim()
    if (dataStr === '[DONE]') continue
    
    try {
      const data = JSON.parse(dataStr)
      const content = data.choices?.[0]?.delta?.content || ''
      aiContent += content
    } catch (e) {
      // 忽略解析错误
    }
  }
}

console.log(`【AI 原始响应】${targetName}:`, aiContent.substring(0, 200))
```

---

## 预期效果

| 优化项 | 效果 |
|--------|------|
| Token 上限扩大 | 解决截断问题，复杂数学题可以完整生成 |
| 流式拼接修复 | 解决解析失败问题，确保数据完整性 |
