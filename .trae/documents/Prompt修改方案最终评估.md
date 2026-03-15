# Prompt 修改方案最终评估

## 回应评估

### 担忧 1：质量下降 ✅ 已解决

| 原担忧 | 回应方案 | 评估 |
|--------|----------|------|
| 约束减少导致质量下降 | 压缩高密度指令 + Quality Check | ✅ 合理 |
| 缺少 Few-Shot 示例 | 改为"结构示例 + 关键特征描述" | ✅ 可接受 |
| 解析绑定铁律缺失 | 在 System Prompt 中保留 "Analysis Iron Law" | ✅ 已保留 |

### 担忧 2：LaTeX 转义 ✅ 已解决

| 原担忧 | 回应方案 | 评估 |
|--------|----------|------|
| JSON 转义破坏 LaTeX | JSON.parse 自动处理标准转义 | ✅ 正确 |
| 模型过度转义 | sanitizeLatex 函数修复 | ✅ 有防御 |
| 渲染异常 | 正则清洗 + 二次验证 | ✅ 有兜底 |

### 担忧 3：前端渲染适配 ✅ 已解决

| 原担忧 | 回应方案 | 评估 |
|--------|----------|------|
| 数据结构变更 | 新的 generatedProblem 结构 | ✅ 明确 |
| 渲染逻辑变更 | 适配新 JSON 结构 | ✅ 已说明 |

---

## 最终方案评估

### System Prompt 评估

**优点**：
- 高密度指令，Token 大幅减少
- 保留核心约束（难度逻辑、解析铁律、LaTeX 防御）
- 增加自我验证机制（Self-Correction）

**建议**：
- 可以保留 `levelBase` 和 `levelTarget` 的动态注入

### 解析逻辑评估

**优点**：
- 多层防御（JSON 提取 → Markdown 清洗 → LaTeX 修复 → 二次验证）
- sanitizeLatex 函数处理边缘情况
- 错误日志完善

**建议**：
- sanitizeLatex 函数的正则需要更精确，避免误伤

---

## 实施计划

### 第一步：修改 System Prompt

```javascript
const systemPrompt = `
Role
高中数学命题专家。专长新高考 I 卷，能精准控制难度与区分度。

Critical Constraints
1. Format: 仅输出纯 JSON。严禁 Markdown (\`\`\`)。
2. LaTeX Defense:
   - 公式必须用 $...$ 包裹。
   - 严禁中文进入 $ 内。
   - 注意：JSON 会自动转义反斜杠，你只需输出正常 LaTeX (如 \\frac)，不要手动双重转义。
3. Difficulty Logic:
   - Q1 (${levelBase}): 单步/双步推导，参数整数化，无陷阱。
   - Q2 (${levelTarget}): 必须包含 [分类讨论/数形结合/构造法] 之一。参数可含根式，但需可手算。
4. Analysis Iron Law:
   - 解析步骤必须显式代入 Q1/Q2 选定的具体参数。
   - 禁止"本题考查..."等空话，直接写"因 a=2, 故..."。
5. Self-Correction: 在 reasoning 字段中，先验证 Δ 是否为完全平方数，验证通过再生成 content。

Output Schema (Strict)
{
  "reasoning": {
    "q1_params": {"values": "...", "reason": "..."},
    "q2_params": {"values": "...", "reason": "..."},
    "verification": "Δ check & logic flow check"
  },
  "question": {
    "difficulty_l1": "基础巩固|综合运用|拓展探究",
    "difficulty_l2": "基础巩固|综合运用|拓展探究",
    "content": "题干 (1)... (2)..."
  },
  "analysis": {
    "core_idea": "一句话破题",
    "steps": ["Step 1: 代入 a=...", "Step 2: ..."],
    "trap_hint": "易错点"
  },
  "answer": {"l1": "...", "l2": "..."}
}
`;
```

### 第二步：修改 User Prompt

```javascript
const userPrompt = `
## Context
- **母题**: ${targetName} (${knowledgePoints})
- **难度目标**: Q1[${levelBase}] → Q2[${levelTarget}]
- **变式策略**: ${variantName} (${variantDesc})
- **参数池**: ${JSON.stringify(params)}

## Instructions
1. **参数锁定**: 从参数池中选择适合 Q1 和 Q2 的具体数值，确保计算可手算。
2. **题目生成**: 基于母题逻辑进行变式，严禁机械改数。
3. **解析编写**: 步骤需显式代入选定参数，点破陷阱。
4. **输出**: 严格遵循 System Prompt 中的 JSON Schema。

## Special Rules
- ${errorPointHint || "无特殊错误点提示"}
- 确保学科基因耦合（如复数题必含 i）。
`;
```

### 第三步：修改解析逻辑

```javascript
// 1. 提取 JSON 块
const jsonMatch = fullContent.match(/{[\s\S]*}/);
if (!jsonMatch) {
  throw new Error("未检测到有效的 JSON 结构");
}

let rawJson = jsonMatch[0];

// 2. 清洗 Markdown 标记
rawJson = rawJson.replace(/```json/g, "").replace(/```/g, "");

// 3. 解析 JSON
const result = JSON.parse(rawJson);

// 4. 二次验证
if (!result.question || !result.analysis || !result.answer) {
  throw new Error("JSON 结构缺失关键字段");
}

// 5. LaTeX 清洗
const sanitizeLatex = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/\\\\(frac|sqrt|sum|int|infty|geq|leq|alpha|beta|gamma|delta|Delta|pi|theta|lambda|mu|sigma|omega)/g, '\\$1');
};

// 6. 设置结果
aiResult = {
  question: sanitizeLatex(result.question.content),
  analysis: {
    core_idea: sanitizeLatex(result.analysis.core_idea),
    steps: result.analysis.steps.map(sanitizeLatex),
    trap_hint: sanitizeLatex(result.analysis.trap_hint)
  },
  answer: {
    l1: sanitizeLatex(result.answer.l1),
    l2: sanitizeLatex(result.answer.l2)
  },
  reasoning: result.reasoning
};
```

### 第四步：灰度测试

1. 在"每周使命"模块测试
2. 生成 10 道题，人工核对：
   - LaTeX 是否渲染正常？
   - Q2 是否有分类讨论？
   - 解析是否代入了数值？

### 第五步：回滚预案

保留旧的 systemPrompt 副本（注释掉），如需回滚只需：
1. 改回 `MODEL_NAME = 'qwen-plus'`
2. 解开旧 Prompt 注释

---

## 结论

**评估结果：方案合理，建议采纳**

| 评估项 | 结果 |
|--------|------|
| 质量保障 | ✅ 已解决 |
| LaTeX 转义 | ✅ 已解决 |
| 前端适配 | ✅ 已说明 |
| 风险控制 | ✅ 有灰度测试和回滚预案 |

**预期收益**：
- Token 减少 ~70%
- 生成速度提升 2-3 倍
- 解析更可靠
