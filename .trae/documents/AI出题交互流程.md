# AI 出题交互流程完整文档

## 概述

本文档详细描述了"数学无忧"系统中 AI 出题功能的完整交互流程，包括数据加载、出题触发、System Prompt 构建、特殊情况处理等。

---

## 核心公式

```
Generated Problem = (Seed: Master Benchmark OR Original Pool) 
                   + (Logic Modifier: Variable Knobs) 
                   + (Boundary Control: Difficulty Constitution)
```

---

## 一、数据加载阶段

### 1.1 索引构建函数

**位置**: `WeeklyMission.jsx` 第 75-114 行

```javascript
const buildCrossFileIndex = () => {
  const index = {}
  const motifFiles = { 
    M01: M01Data, 
    M11: M11Data, 
    M14: M14Data,
    // ... 其他母题文件
  }
  
  Object.entries(motifFiles).forEach(([motifId, data]) => {
    let allProblems = []
    let allPitfalls = []
    let allWeapons = []
    
    data.specialties.forEach(spec => {
      if (spec.variations) {
        spec.variations.forEach(v => {
          // 1. 扁平化收集所有样题和真题
          if (v.master_benchmarks) allProblems.push(...v.master_benchmarks)
          if (v.original_pool) allProblems.push(...v.original_pool)
          
          // 2. 扁平化收集所有的易错陷阱
          if (v.common_pitfalls) {
            v.common_pitfalls.forEach(p => allPitfalls.push(p.description))
          }
          
          // 3. 扁平化收集所有的公式武器
          if (v.toolkit && v.toolkit.linked_weapons) {
            allWeapons.push(...v.toolkit.linked_weapons)
          }
        })
      }
    })
    
    // 构建兼容前端 UI 的数据实体
    const entry = {
      ...data,
      id: data.motif_id || motifId,
      name: data.motif_name || "未命名母题",
      prototypeProblems: allProblems,
      commonPitfalls: [...new Set(allPitfalls)],
      toolkit: { linked_weapons: [...new Set(allWeapons)] },
      specialties: data.specialties || []
    }
    
    index[motifId] = [entry]
  })
  
  return index
}

const CROSS_FILE_INDEX = buildCrossFileIndex()
```

### 1.2 数据结构映射

```
M01.json (原始文件)
    │
    ├── motif_id, motif_name          ──→ entry.id, entry.name
    ├── specialties[]                  ──→ entry.specialties
    │       ├── spec_id, spec_name
    │       └── variations[]
    │               ├── master_benchmarks[]  ──→ entry.prototypeProblems
    │               ├── original_pool[]      ──→ entry.prototypeProblems
    │               ├── common_pitfalls[]    ──→ entry.commonPitfalls
    │               └── toolkit.linked_weapons[] ──→ entry.toolkit.linked_weapons
    │
    └── CROSS_FILE_INDEX['M01'] = [entry]
```

---

## 二、出题触发流程

### 2.1 触发入口

**函数**: `generateAIProblem(motifId, tier, encounter, motifObj, ...)`

**参数说明**:
| 参数 | 类型 | 说明 |
|-----|------|------|
| motifId | string | 母题ID，如 "M01" |
| tier | string | 难度等级，如 "L2"/"L3"/"L4" |
| encounter | number | 遭遇次数 |
| motifObj | object | 包含 spec_id 和 var_id 的对象 |

### 2.2 流程图

```
用户点击"生成题目"按钮
         │
         ▼
┌─────────────────────────────────────┐
│  generateAIProblem() 被调用         │
│  参数: motifId, tier, motifObj      │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  从 CROSS_FILE_INDEX 获取母题数据   │
│  const motifData = CROSS_FILE_INDEX │
│    [motifId][0]                     │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  定位到具体变例                     │
│  currentSpecId = motifObj.spec_id   │
│  currentVarId = motifObj.var_id     │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  提取该变例的数据                   │
│  - master_benchmarks (标杆题)       │
│  - variable_knobs (变量旋钮)        │
│  - question_style (设问风格)        │
│  - trap_types (陷阱类型)            │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  构建 System Prompt                 │
│  + User Prompt                      │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  调用 AI API (千问)                 │
│  生成新题目                         │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  解析 AI 返回的 JSON                │
│  验证并展示给用户                   │
└─────────────────────────────────────┘
```

---

## 三、System Prompt 构建逻辑

### 3.1 核心代码

**位置**: `WeeklyMission.jsx` 第 465-630 行

```javascript
// 1. 获取上下文信息
const currentModuleName = M11Data.module_name || "高中数学专项"

// 2. 从 motifObj 中获取专项和变例信息
const currentSpecId = motifObj?.spec_id || ""
const currentVarId = motifObj?.var_id || ""
const frontendLevel = tier  // L2/L3/L4

// 3. 【种子选择优先级】两级路由
let benchmarkQuestions = []
let variableKnobs = null
let questionStyle = null
let trapTypes = []

if (M11Data.specialties && currentSpecId && currentVarId) {
  const targetSpec = M11Data.specialties.find(s => s.spec_id === currentSpecId)
  if (targetSpec && targetSpec.variations) {
    const targetVar = targetSpec.variations.find(v => v.var_id === currentVarId)
    if (targetVar) {
      // 第一优先级: master_benchmarks (按难度过滤)
      if (targetVar.master_benchmarks) {
        benchmarkQuestions = targetVar.master_benchmarks.filter(q => q.level === frontendLevel)
      }
      
      // 第二优先级: original_pool (按难度过滤，随机选一道)
      if (benchmarkQuestions.length === 0 && targetVar.original_pool) {
        const poolMatches = targetVar.original_pool.filter(q => q.level === frontendLevel)
        if (poolMatches.length > 0) {
          const randomIndex = Math.floor(Math.random() * poolMatches.length)
          benchmarkQuestions = [{
            level: frontendLevel,
            problem: poolMatches[randomIndex].desc || poolMatches[randomIndex].problem || '',
            logic_key: poolMatches[randomIndex].logic_key || '高考真题/名校模考',
            analysis: poolMatches[randomIndex].analysis || null
          }]
          console.log(`【种子选择】从 original_pool 随机选择 ${frontendLevel} 难度题目`)
        }
      }
      
      // 提取变量旋钮
      if (targetVar.variable_knobs) {
        variableKnobs = targetVar.variable_knobs
      }
      // 提取设问风格
      if (targetVar.question_style) {
        questionStyle = targetVar.question_style
      }
      // 提取陷阱类型
      if (targetVar.trap_type) {
        trapTypes = targetVar.trap_type
      }
    }
  }
}

// 如果两级都没有找到，报错提示
if (benchmarkQuestions.length === 0) {
  console.error(`【数据缺失】变例 ${currentVarId} 缺少 ${frontendLevel} 难度的题目，请补充 original_pool`)
}

// 4. 【序列化保护】处理 JSON 转义提示
const rawBenchmarkJson = benchmarkQuestions.length > 0
  ? JSON.stringify(benchmarkQuestions, null, 2)
  : "无可用标杆题，请依据难度宪法自行构造。"

// 5. 从母题 JSON 读取难度宪法 (Guardrails)
const difficultyConstitution = M11Data.system_instruction_template || `默认难度宪法...`

// 6. 构建变量旋钮提示
const variableKnobsPrompt = variableKnobs 
  ? `\n# 变量旋钮因子 (必须从中选择组合)
以下是当前变例的变量旋钮配置（JSON 格式）：
\`\`\`json
${JSON.stringify(variableKnobs, null, 2)}
\`\`\`

⚠️ **命题要求**：
- 请从上述旋钮因子中**随机选择一个组合**进行命题。
- 特别注意 \`trap_type\`（陷阱类型）的植入，确保题目具有区分度。
${trapTypes.length > 0 ? `- 可用陷阱类型：${trapTypes.join('、')}` : ''}`
  : ''

// 7. 构建设问风格提示
const questionStylePrompt = questionStyle
  ? `\n# 设问风格约束
当前变例的设问风格：**${questionStyle}**
请严格按照此风格进行设问，避免平铺直叙。`
  : ''

// 8. 构建最终 System Prompt
const systemPrompt = `# Role
你是 135+ 高中数学研究院首席命题官...

${difficultyConstitution}

# 参考标杆 (Few-Shot Learning)
以下是当前变例对应的标准样题（JSON 格式）：
\`\`\`json
${rawBenchmarkJson}
\`\`\`
${variableKnobsPrompt}${questionStylePrompt}

# 命题流程 (Step-by-Step)
1. **逻辑锁定**: 提取思维链，而非复制题目内容
2. **变量旋钮**: 从 variable_knobs 中随机组合至少 2 个维度
3. **风格注入**: 符合广东考生的备考实际
4. **真实性自检 (Self-Audit)**:
   - "这道题的陷阱是否符合广东卷/强省模考的埋伏习惯？"
   - "计算量是否超过了难度宪法规定的标准？"
   - "是否触犯了难度宪法中的'禁忌'？"
   - "是否遗漏了难度宪法中的'核心考察'点？"
5. **生成输出**: 严格按 JSON Schema 输出

# 输出协议 (JSON Schema)
{
  "question": "题目原文",
  "analysis": "解析",
  "answer": "答案",
  "difficulty": "L2 | L3 | L4",
  "linked_weapons": ["Wxxx"]
}`
```

### 3.2 Prompt 结构分解

```
System Prompt
├── # Role (角色定义)
│   └── 135+ 高中数学研究院首席命题官
│
├── # 难度分级宪法 (Guardrails - 最高准则)  ← 从 JSON 动态读取
│   └── ${difficultyConstitution}
│       └── AI 必须自检：特征、禁忌、典型任务
│
├── # 参考标杆 (Seed - 模仿对象)
│   └── ${rawBenchmarkJson}  ← 两级路由选择
│
├── # 变量旋钮因子
│   └── ${variableKnobsPrompt}  ← 动态注入变量旋钮
│
├── # 设问风格约束
│   └── ${questionStylePrompt}  ← 动态注入设问风格
│
├── # 命题流程 (Step-by-Step)
│   ├── 1. 逻辑锁定
│   ├── 2. 变量旋钮
│   ├── 3. 风格注入
│   ├── 4. 真实性自检 (Self-Audit)  ← 新增
│   └── 5. 生成输出
│
└── # 输出协议 (JSON Schema)
    └── question, analysis, answer, difficulty, linked_weapons
```

---

## 四、数据流向图

### 4.1 完整数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                        M01.json (原始数据)                       │
├─────────────────────────────────────────────────────────────────┤
│ {                                                               │
│   "motif_id": "M01",                                            │
│   "motif_name": "集合与常用逻辑用语",                             │
│   "system_instruction_template": "...",  ──────────────┐       │
│   "specialties": [                                     │       │
│     {                                                  │       │
│       "spec_id": "V1",                                 │       │
│       "spec_name": "集合的运算与关系",                   │       │
│       "variations": [                                  │       │
│         {                                              │       │
│           "var_id": "1.1",                             │       │
│           "name": "基本运算与要素识别",                  │       │
│           "master_benchmarks": [...],  ─────────────┐  │       │
│           "original_pool": [...],       ──────────┐ │  │       │
│           "variable_knobs": {...}      ────────┐  │ │  │       │
│         }                                       │  │ │  │       │
│       ]                                         │  │ │  │       │
│     }                                           │  │ │  │       │
│   ]                                             │  │ │  │       │
│ }                                               │  │ │  │       │
└─────────────────────────────────────────────────┼──┼─┼──┼───────┘
                                                  │  │ │  │
                    ┌─────────────────────────────┘  │ │  │
                    │                                │ │  │
                    ▼                                ▼ ▼  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    种子选择优先级 (两级路由)                      │
├─────────────────────────────────────────────────────────────────┤
│ 1. master_benchmarks.filter(level == L4)  → 找到 → 使用         │
│    ↓ 未找到                                                     │
│ 2. original_pool.filter(level == L4)      → 找到 → 随机选一道   │
│    ↓ 未找到                                                     │
│    报错：请补充 original_pool                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    System Prompt 构建                            │
├─────────────────────────────────────────────────────────────────┤
│ # 难度分级宪法 (Guardrails)                                      │
│ ${difficultyConstitution}  ← 从 JSON 读取                        │
│                                                                  │
│ # 参考标杆 (Seed)                                                │
│ ${rawBenchmarkJson}                                             │
│                                                                  │
│ # 变量旋钮因子 (Logic Modifier)                                  │
│ ${variableKnobsPrompt}                                          │
│                                                                  │
│ # 命题流程 (含 Self-Audit)                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI API (千问)                               │
├─────────────────────────────────────────────────────────────────┤
│ 输入: System Prompt + User Prompt                               │
│ 处理: 学习标杆题思维链 + 从变量旋钮选择组合 + 难度宪法约束         │
│ 输出: 新题目 JSON                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      新题目输出                                   │
├─────────────────────────────────────────────────────────────────┤
│ {                                                                │
│   "question": "设集合 A = {1, 2, 3, 4}，B = {x | x = 2k, k∈Z}...",│
│   "analysis": "【核心思路】空集陷阱与分类讨论...",                  │
│   "answer": "k ∈ {0, 1, 2} 或 k 无解",                           │
│   "difficulty": "L4",                                            │
│   "linked_weapons": ["W002", "W003", "W016"]                     │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 五、特殊情况说明

### 5.1 种子选择优先级：两级路由

```
种子选择优先级 (Seed Selection Priority)
│
├── 第一优先级: master_benchmarks
│   └── 查找 level == Target_Level 的题目
│       └── 优点: 逻辑最纯正，解析最详尽
│       └── 如有多个，全部发送给 AI
│
└── 第二优先级: original_pool
    └── 查找 level == Target_Level 的原题描述
        └── 如有多个，随机选择一道
        └── 优点: 确保题目难度的"血统"符合高考真题/名校模考
        └── 要求: original_pool 各个难度题必须有
```

**代码实现**:
```javascript
// 第一优先级: master_benchmarks (按难度过滤)
if (targetVar.master_benchmarks) {
  benchmarkQuestions = targetVar.master_benchmarks.filter(q => q.level === frontendLevel)
}

// 第二优先级: original_pool (按难度过滤，随机选一道)
if (benchmarkQuestions.length === 0 && targetVar.original_pool) {
  const poolMatches = targetVar.original_pool.filter(q => q.level === frontendLevel)
  if (poolMatches.length > 0) {
    const randomIndex = Math.floor(Math.random() * poolMatches.length)
    benchmarkQuestions = [{
      level: frontendLevel,
      problem: poolMatches[randomIndex].desc || poolMatches[randomIndex].problem || '',
      logic_key: poolMatches[randomIndex].logic_key || '高考真题/名校模考',
      analysis: poolMatches[randomIndex].analysis || null
    }]
  }
}

// 如果两级都没有找到，报错提示
if (benchmarkQuestions.length === 0) {
  console.error(`【数据缺失】变例 ${currentVarId} 缺少 ${frontendLevel} 难度的题目，请补充 original_pool`)
}
```

### 5.2 难度宪法：从 JSON 动态读取

**难度宪法必须始终包含，即使有同难度的标杆题！**

| 组件 | 作用 | 比喻 |
|-----|------|------|
| 标杆题 (Seed) | AI 的模仿对象 | "血肉" |
| 变量因子 (Logic Modifier) | 告诉 AI 在哪些维度变化 | "变装" |
| 难度宪法 (Boundary Control) | 最高准则，约束 AI 行为 | "灵魂 (Guardrails)" |

**代码实现**:
```javascript
// 从母题 JSON 读取难度宪法 (Guardrails)
const difficultyConstitution = M11Data.system_instruction_template || `默认难度宪法...`

// 在 System Prompt 中动态注入
const systemPrompt = `
# Role
你是 135+ 高中数学研究院首席命题官...

${difficultyConstitution}

# 参考标杆 (Few-Shot Learning)
...
`
```

**为什么必须包含难度宪法？**

| 问题 | 示例 |
|-----|------|
| 触犯禁忌 | 在 M01 基础题里加入了复杂的含参讨论 |
| 遗漏核心考察 | 在 M11 切线题里忘了考察定义域 |
| 难度失控 | L2 题目出现了 L4 的复杂度 |

### 5.3 真实性自检 (Self-Audit)

**在命题流程中新增自检步骤**:

```
4. **真实性自检 (Self-Audit)**:
   - "这道题的陷阱是否符合广东卷/强省模考的埋伏习惯？"
   - "计算量是否超过了难度宪法规定的标准？"
   - "是否触犯了难度宪法中的'禁忌'？"
   - "是否遗漏了难度宪法中的'核心考察'点？"
```

### 5.4 母题 JSON 没有 system_instruction_template

**处理逻辑**：
```javascript
const difficultyConstitution = motifData?.system_instruction_template 
  || getDefaultDifficultyConstitution()  // 使用默认宪法
```

### 5.5 两级路由都没有找到对应难度的题目

**处理逻辑**：
```javascript
if (benchmarkQuestions.length === 0) {
  console.error(`【数据缺失】变例 ${currentVarId} 缺少 ${frontendLevel} 难度的题目`)
  console.error(`请补充 original_pool 中的 ${frontendLevel} 难度题目`)
  // 使用默认提示，让 AI 依据难度宪法自行构造
  const rawBenchmarkJson = "无可用标杆题，请依据难度宪法自行构造。"
}
```

---

## 六、关键代码位置索引

| 功能 | 文件位置 | 行号 |
|-----|---------|------|
| 索引构建 | WeeklyMission.jsx | 75-114 |
| 变例定位 | WeeklyMission.jsx | 480-503 |
| 标杆题过滤 | WeeklyMission.jsx | 486-488 |
| 变量旋钮提取 | WeeklyMission.jsx | 489-501 |
| System Prompt 构建 | WeeklyMission.jsx | 542-630 |
| User Prompt 构建 | WeeklyMission.jsx | 632-648 |
| AI API 调用 | WeeklyMission.jsx | 650-700 |

---

## 七、总结

### 核心设计理念

```
标杆题 (master_benchmarks)  →  学习"怎么出这类题"
        +
变量旋钮 (variable_knobs)   →  约束"具体怎么变化"
        ↓
AI 生成新题目  →  有章可循的创新
```

### 数据层级关系

```
母题 (M01)
  └── 专项 (V1)
        └── 变例 (1.1) ← 【核心层级】
              ├── master_benchmarks[] (标杆题)
              └── variable_knobs{} (变量旋钮)
```

### 出题质量保障

1. **思维链学习**: 从标杆题中提取解题逻辑，而非复制数字
2. **变量约束**: 从变量旋钮中选择组合，限制创新范围
3. **难度宪法**: L2/L3/L4 有明确的特征定义和禁忌
4. **多标杆增强**: 多个标杆题帮助 AI 更准确理解题型本质
