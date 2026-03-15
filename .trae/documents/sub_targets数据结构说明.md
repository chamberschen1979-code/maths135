# sub_targets 数据结构说明

## 一、数据来源澄清

### 1.1 sub_targets 的数据来源

**`sub_targets` 来自 `tacticalMaps.json`，不是从 M01-M17.json 获取**

```
tacticalMaps.json
├── tactical_maps[]
│   └── encounters[]
│       └── sub_targets[]  ← 状态灯的数据来源
```

**M01-M17.json** 的数据结构：
```
M01.json
├── specialties[]
│   └── variations[]
│       ├── master_benchmarks[]  ← 标杆题（用于出题）
│       ├── original_pool[]      ← 原始题目池
│       └── variable_knobs{}    ← 变量旋钮
```

**关键区别**：
- `sub_targets`：描述母题的**等级状态**（L2/L3/L4 是否已攻克）
- `master_benchmarks`：**标杆题**（用于 AI 学习和出题）

---

## 二、为什么有些母题没有 L4

### 2.1 实际统计

| 母题类型 | 数量 | 有 L4 | 无 L4 |
|----------|------|------|------|
| 基础母题（M01-M10） | 10 | 0 | 10 |
| 压轴母题（M11-M17） | 7 | 5 | 2 |

**结论**：**12 个母题没有 L4**，不是"每个母题都有L4级别的标杆题"

### 2.2 原因分析

1. **数据不完整**：`tacticalMaps.json` 是手动维护的文件
   - 基础母题（M01-M10）可能还没有添加 L4 的 sub_targets
   - 这是数据准备阶段，不是代码问题

2. **难度分层**：
   - L2：基础夯实（所有母题都有）
   - L3：能力提升（所有母题都有）
   - L4：实战拔高（只有压轴母题有）

3. **数据结构设计**：
   - `sub_targets` 中的 `level_req` 字段定义了该母题的**最高难度**
   - 如果母题最高难度是 L3，就不会有 L4 的 sub_targets

---

## 三、状态灯逻辑（动态，非写死）

### 3.1 代码逻辑

```javascript
// TacticalDashboard.jsx 第437-443行
const l2Subs = encounter.sub_targets?.filter(s => s.level_req === 'L2') || []
const l3Subs = encounter.sub_targets?.filter(s => s.level_req === 'L3') || []
const l4Subs = encounter.sub_targets?.filter(s => s.level_req === 'L4') || []

const l2Status = getLevelStatus(l2Subs)
const l3Status = getLevelStatus(l3Subs)
const l4Status = getLevelStatus(l4Subs)

// UI 渲染（第470-487行）
{l2Subs.length > 0 && (
  <div>L2 熟练 <状态灯 /></div>
)}
{l3Subs.length > 0 && (
  <div>L3 迁移 <状态灯 /></div>
)}
{l4Subs.length > 0 && (
  <div>L4 融会 <状态灯 /></div>
)}
```

**关键**：状态灯的显示完全基于 `sub_targets` 的 `level_req` 字段，动态计算。

---

## 四、原始数据来源

### 4.1 master_benchmarks（标杆题）

**来源**：M01-M17.json 的 `specialties -> variations -> master_benchmarks`

**用途**：
1. AI 学习：让 AI 理解这类题目的解题思路
2. 出题种子：作为 Few-shot 示例，指导 AI 生成新题目

**数据结构**：
```json
{
  "level": "L4",
  "problem": "[2024·新高考 I 卷·T5 风格] 已知向量 ...",
  "logic_key": "投影向量公式直接应用",
  "analysis": {
    "core_idea": "新高考基础题特点：概念清晰，直接套用投影向量公式...",
    "key_steps": [...]
  }
}
```

### 4.2 original_pool（原始题目池）

**来源**：M01-M17.json 的 `specialties -> variations -> original_pool`

**用途**：
1. 题目池：作为备选题目，当 master_benchmarks 没有对应难度时使用
2. 真题来源：来自高考真题、名校模考等

**数据结构**：
```json
{
  "desc": "[24 新高考 I] 已知向量 a=(1,2), b=(2,-1)，求 a 在 b 上的投影向量。",
  "level": "L2"
}
```

---

## 五、总结

| 问题 | 答案 |
|------|------|
| sub_targets 数据来源 | tacticalMaps.json（手动维护） |
| master_benchmarks 数据来源 | M01-M17.json（母题数据） |
| 状态灯是写死的吗？ | ❌ 不是，动态从 sub_targets 获取 |
| 为什么有些母题没有 L4 | tacticalMaps.json 数据不完整，基础母题缺少 L4 sub_targets |
| 每个母题都有 L4 标杆题吗 | ✅ 是，在 M01-M17.json 中 |
| 原始题目池和 sub_targets 的关系 | 两个不同的数据结构，没有直接关系 |

**核心概念**：
- `sub_targets`：母题的**等级进度状态**（UI 显示用）
- `master_benchmarks`：母题的**标杆题**（AI 学习和出题用）
- `original_pool`：母题的**题目池**（备选用）

这三者是**独立的数据结构**，服务于不同的功能。
