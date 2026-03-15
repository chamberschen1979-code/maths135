# AI 出题算法系统梳理

## 一、整体流程图

```
用户点击生成
    ↓
generateAIProblem(targetId, level, encounter, ...)
    ↓
┌─────────────────────────────────────────────────────────────┐
│  第一阶段：数据准备                                          │
│  1. 母题选择 → 通过 targetId 从 crossFileIndex 获取          │
│  2. 难度匹配 → 通过 elo_score 映射到 L2/L3/L4                │
│  3. 标杆题选择 → 从 specialties → variations → benchmarks   │
│  4. 变量旋钮 → 从 variableKnobs 随机选择                     │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  第二阶段：Prompt 构建                                       │
│  1. System Prompt → JSON 格式约束 + Output Schema           │
│  2. User Prompt → 母题信息 + 参数池 + 分层策略               │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  第三阶段：API 调用                                          │
│  1. 流式传输 → stream: true                                 │
│  2. 模型 → qwen-turbo                                       │
│  3. 参数 → temperature: 0.7, max_tokens: 8000               │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  第四阶段：响应解析                                          │
│  1. 累积流式数据                                             │
│  2. 暴力提取 JSON (第一个 { 到最后一个 })                     │
│  3. 清洗 Markdown 标记                                       │
│  4. 解析 JSON → 提取 question/analysis/answer               │
│  5. LaTeX 清洗 → 修复双重转义                                │
└─────────────────────────────────────────────────────────────┘
    ↓
返回题目对象
```

---

## 二、母题选择算法

### 2.1 入口参数

```javascript
generateAIProblem(targetId, level, encounter, knowledgeEntry, isUserSelected, iterationIndex, problemType, customPrompt, crossFileIndex, dualLevelContext)
```

| 参数 | 说明 |
|------|------|
| `targetId` | 母题 ID（如 "M01-001"） |
| `level` | 难度等级（L2/L3/L4） |
| `encounter` | 遭遇战配置（包含 elo_score, sub_targets） |
| `knowledgeEntry` | 知识点数据（已废弃，改用 crossFileIndex） |
| `crossFileIndex` | 跨文件索引（核心数据源） |

### 2.2 ID 匹配策略

```javascript
// ID 清洗函数：统一格式
const normalizeId = (id) => id.replace(/_/g, '-').toLowerCase()

// 尝试多种 ID 格式匹配
const idVariants = [
  targetId,                    // 原始 ID
  normalizeId(targetId),       // 清洗后的 ID
  targetId.replace(/-/g, '_'), // 下划线版本
  targetId.toUpperCase(),      // 大写版本
  targetId.toLowerCase()       // 小写版本
]

// 遍历所有变体，找到第一个匹配的
for (const variant of idVariants) {
  if (crossFileIndex[variant]) {
    knowledgeData = crossFileIndex[variant][0]
    break
  }
}
```

### 2.3 动态加载兜底

```javascript
// 如果索引中找不到，尝试动态加载
if (!knowledgeData) {
  const loadedData = await loadMotifData(targetId)
  // 构建 prototypeProblems
  knowledgeData = {
    ...loadedData,
    prototypeProblems: extractProblems(loadedData)
  }
}
```

---

## 三、难度匹配算法

### 3.1 Elo 战力到难度的映射

```javascript
const getDifficultyByElo = (elo) => {
  if (elo <= 1800) {
    return {
      tier: '基础筑基',
      level: 'L2',
      complexity: 1,
      steps: 2,
      traps: 0,
      allowDiscussion: false,
      paramConstraint: 'integer_or_simple_fraction'
    }
  } else if (elo <= 2500) {
    return {
      tier: '深度复合',
      level: 'L3',
      complexity: 3,
      steps: 4,
      traps: 1,
      allowDiscussion: true,
      paramConstraint: 'any'
    }
  } else {
    return {
      tier: '战术压轴',
      level: 'L4',
      complexity: 4,
      steps: 5,
      traps: 2,
      allowDiscussion: true,
      paramConstraint: 'any'
    }
  }
}
```

### 3.2 难度参数对照表

| Elo 范围 | 难度等级 | 复杂度 | 步骤数 | 陷阱数 | 参数约束 |
|----------|----------|--------|--------|--------|----------|
| ≤1800 | L2 | 1 | 2-3 | 0 | 整数/简单分数 |
| 1801-2500 | L3 | 3 | 4-6 | 1 | 任意 |
| >2500 | L4 | 4 | 5-7 | 2 | 任意 |

---

## 四、标杆题选择算法

### 4.1 两级路由结构

```
母题 JSON
├── specialties[] (专项列表)
│   ├── spec_id: "M11-001-01"
│   ├── spec_name: "切线方程基础"
│   └── variations[] (变例列表)
│       ├── var_id: "M11-001-01-01"
│       ├── name: "在点处求切线"
│       ├── master_benchmarks[] (标杆题)
│       │   ├── level: "L2"
│       │   ├── problem: "..."
│       │   └── logic_key: "..."
│       └── original_pool[] (原始题库)
```

### 4.2 选择优先级

```javascript
// 第一优先级: master_benchmarks (按难度过滤)
benchmarkQuestions = targetVar.master_benchmarks?.filter(q => q.level === frontendLevel)

// 第二优先级: original_pool (按难度过滤，随机选一道)
if (benchmarkQuestions.length === 0) {
  const poolMatches = targetVar.original_pool?.filter(q => q.level === frontendLevel)
  benchmarkQuestions = [randomChoice(poolMatches)]
}
```

### 4.3 自动选择变例

```javascript
// 如果没有指定 spec_id 和 var_id，自动选择
for (const spec of motifObj.specialties) {
  for (const v of spec.variations) {
    // 检查是否有匹配难度的题目
    if (v.master_benchmarks?.some(q => q.level === frontendLevel)) {
      currentSpecId = spec.spec_id
      currentVarId = v.var_id
      break
    }
  }
}
```

---

## 五、变量旋钮算法

### 5.1 数据结构

```javascript
variableKnobs = [
  {
    name: "基础整数参数",
    weight: 3,  // 权重
    values: { a: 2, b: 1, c: 3 }
  },
  {
    name: "含根式参数",
    weight: 2,
    values: { a: "√2", b: 1, c: 0 }
  }
]
```

### 5.2 基于权重的随机选择

```javascript
// 计算总权重
const totalWeight = variableKnobs.reduce((sum, knob) => sum + (knob.weight || 1), 0)
let random = Math.random() * totalWeight

// 选择一个 knob
for (const knob of variableKnobs) {
  random -= (knob.weight || 1)
  if (random <= 0) {
    Object.assign(params, knob.values)
    break
  }
}
```

---

## 六、Prompt 构建算法

### 6.1 System Prompt 结构

```
# Role
高中数学命题专家...

# Critical Constraints (ABSOLUTE RULES)
1. OUTPUT FORMAT: 严格 JSON
2. LaTeX Hygiene: 单 $ 包裹
3. Reasoning Field Ban: 禁止 LaTeX
4. Self-Correction Trigger: 触发时停止

# Output Schema (Strict)
{
  "reasoning": {...},
  "question": {...},
  "analysis": {...},
  "answer": {...}
}
```

### 6.2 User Prompt 结构

```
## Context
- 母题: xxx
- 难度目标: Q1[L2] → Q2[L3]
- 变式策略: xxx
- 参数池: {...}

## Instructions
1. 参数锁定
2. 题目生成
3. 解析编写
4. 输出格式

## Special Rules
- ...
```

---

## 七、响应解析算法

### 7.1 流式数据累积

```javascript
let fullContent = ''
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  fullContent += decoder.decode(value)
}
```

### 7.2 暴力 JSON 提取

```javascript
const firstBrace = rawJson.indexOf('{')
const lastBrace = rawJson.lastIndexOf('}')
rawJson = rawJson.substring(firstBrace, lastBrace + 1)
```

### 7.3 LaTeX 清洗

```javascript
const sanitizeLatex = (str) => {
  return str
    .replace(/\\\\(frac|sqrt|...)/g, '\\$1')  // 修复双重转义
    .replace(/```json/g, '').replace(/```/g, '')  // 清洗 Markdown
    .replace(/\\n/g, '\n')  // 修复换行符
}
```

---

## 八、问题诊断

### 8.1 当前问题

| 问题 | 原因 | 位置 |
|------|------|------|
| 题干变成解析 | JSON 解析失败 | 第736行 |
| LaTeX 问题 | 双重转义未修复 | 第718行 |
| 格式失控 | Prompt 约束不够强 | 第547行 |

### 8.2 根本原因

1. **Prompt 与代码耦合**：Prompt 里写死 JSON 结构，代码里硬编码解析逻辑
2. **容错分散**：JSON 提取、LaTeX 修复散落各处
3. **缺乏 Few-Shot**：只写约束，没有给示例

---

## 九、重构建议

### 9.1 模块拆分

```
src/
├── utils/
│   ├── promptBuilder.js    # Prompt 生成
│   └── responseParser.js   # 响应解析
└── components/
    └── WeeklyMission.jsx   # 主组件
```

### 9.2 Few-Shot Prompting

```javascript
// 给模型一个完美的示例
const exampleOutput = {
  reasoning: {
    q1_params: { values: "a=2, b=1", reason: "整数，最简配置" },
    q2_params: { values: "a=√2, b=π", reason: "无理数，增加复杂度" }
  },
  question: {
    content: "(1) 已知函数 $f(x)=x^2+2x+1$，求 $f(1)$ 的值。\n(2) 若 $f(x)=x^2+ax+b$ 在 $x=1$ 处有极值，求 $a,b$ 的值。"
  },
  analysis: {
    core_idea: "利用导数判断极值",
    steps: ["代入 $x=1$，得 $f'(1)=2+a=0$", "解得 $a=-2$"]
  },
  answer: { l1: "$f(1)=4$", l2: "$a=-2, b$ 任意" }
}
```

### 9.3 统一错误处理

```javascript
// responseParser.js
export const parseAIResponse = (rawText) => {
  try {
    const json = extractJson(rawText)
    const cleaned = cleanLatex(json)
    return { success: true, data: cleaned }
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      rawPreview: rawText.substring(0, 200)
    }
  }
}
```
