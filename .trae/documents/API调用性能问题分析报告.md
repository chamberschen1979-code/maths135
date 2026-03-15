# API 调用性能问题分析报告

## 问题确认

**原因 1：未启用流式传输 (Streaming)** ✅ 确认存在

### 当前代码问题

[WeeklyMission.jsx:767-789](file:///Users/mac/Downloads/高中数学/数学无忧/src/components/WeeklyMission.jsx#L767-L789)

```javascript
// ❌ 当前代码：等待全部返回
const response = await fetch(BASE_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify({
    model: MODEL_NAME,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.85,
    top_p: 0.9,
    max_tokens: 8000
    // ❌ 缺少 stream: true
  })
})

// ❌ 使用 response.json() 等待完整响应
const data = await response.json()
```

### 问题分析

| 问题 | 影响 |
|------|------|
| 未设置 `stream: true` | 客户端必须等待服务器完全生成所有 Token |
| 使用 `response.json()` | 阻塞式等待，无法实时显示进度 |
| `max_tokens: 8000` | 生成大量 Token 需要 30-60 秒 |

### 时间消耗估算

| 阶段 | 时间 |
|------|------|
| 服务器生成 8000 Token | 30-50 秒 |
| 网络传输 | 1-5 秒 |
| 前端解析渲染 | 1-2 秒 |
| **总计** | **32-57 秒** |

---

## 优化方案

### 方案 A：启用流式传输（推荐）

**修改点**：
1. 在请求体中添加 `stream: true`
2. 使用 `ReadableStream` 逐步读取数据
3. 实时更新 UI 显示进度

**预期效果**：
- 用户可以在 2-3 秒内看到第一个字符
- 逐步显示生成内容，提升用户体验
- 总时间不变，但感知速度大幅提升

### 方案 B：减少 Token 数量

**修改点**：
- 将 `max_tokens` 从 8000 减少到 2000-4000

**预期效果**：
- 生成时间减少 50-75%
- 但可能影响复杂题目的生成质量

### 方案 C：添加加载动画

**修改点**：
- 在等待期间显示进度动画
- 显示"正在生成题目..."等提示

**预期效果**：
- 提升用户体验
- 不改变实际等待时间

---

## 结论

**原因 1 确认存在**：当前代码未启用流式传输，导致用户必须等待 AI 完全生成所有内容后才能看到响应。

**建议优先级**：
1. **方案 A**（流式传输）- 最佳体验，但改动较大
2. **方案 C**（加载动画）- 最小改动，快速见效
3. **方案 B**（减少 Token）- 折中方案
