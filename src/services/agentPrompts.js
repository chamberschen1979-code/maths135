/**
 * Agent-First 架构
 * 
 * V6.0 核心原则：代码只做流程控制，逻辑判断全权交给 LLM
 * 
 * 模块：
 * 1. Extraction Agent - 参数提取专家
 * 2. Logic Auditor Agent - 逻辑审计专家
 * 3. Dynamic Router - 动态路由 (L2严/L4宽)
 */

// ==================== Extraction Agent Prompt ====================

export const EXTRACTION_AGENT_PROMPT = `你是一个数学参数提取专家。请阅读以下题目，提取所有关键数学实体。

【输入题目】
{{content}}

【提取任务】
请识别并提取以下信息：

1. **变量与参数**
   - 题目中出现的所有变量（如 x, y, n, t）
   - 题目中出现的所有参数（如 a, b, r, λ, ω, φ）
   - 参数是否有具体数值？是否有范围限制？

2. **约束条件**
   - 等式约束（如 x + y = 1）
   - 不等式约束（如 x > 0）
   - 隐含约束（如定义域、值域限制）

3. **几何对象**（如适用）
   - 点坐标（如 A(1,0), B(-1,0)）
   - 曲线方程（如圆、直线、抛物线）
   - 动态对象（如动点 P 在圆上运动）

4. **求解目标**
   - 题目要求求什么？（值、范围、表达式、证明）
   - 是否有多问？各问之间是否有递进关系？

5. **条件充分性评估**
   - 条件是否足够求解？
   - 是否存在缺失条件？
   - 是否存在冗余条件？

【输出格式】
请严格返回 JSON：
{
  "variables": ["x", "y"],
  "parameters": {
    "a": { "value": null, "range": null, "description": "未赋值参数" },
    "r": { "value": 1, "range": "r>0", "description": "圆的半径" }
  },
  "constraints": {
    "equations": ["x + y = 1"],
    "inequalities": ["x > 0"],
    "implicit": ["定义域: x ∈ R"]
  },
  "geometricObjects": {
    "points": { "A": [1, 0], "B": [-1, 0] },
    "curves": ["圆: (x-0)² + (y-1)² = 1"]
  },
  "target": {
    "type": "range", // "value" | "range" | "expression" | "proof"
    "description": "求数量积的取值范围",
    "multiPart": false
  },
  "sufficiency": {
    "status": "sufficient", // "sufficient" | "insufficient" | "redundant"
    "missingConditions": [],
    "redundantConditions": []
  },
  "error": null // 如果存在致命错误，在此说明
}`

// ==================== Logic Auditor Agent Prompt ====================

export const LOGIC_AUDITOR_PROMPT = `你是一位资深高中数学教研组长，担任"逻辑审计员"角色。
你的任务不是做计算器，而是做逻辑法官。

【审计原则】
1. **一致性检查**：解析中的每一步推导，是否都能从题干或上一步找到依据？
2. **充分性检查**：题干给出的条件是否足以支撑结论？（警惕条件缺失）
3. **超纲检查**：解题过程是否使用了该难度级别不允许的工具？
4. **逻辑闭环检查**：从条件到结论，是否存在逻辑断裂？

【年级约束】
{{gradeConstraints}}

【输入数据】
题目：{{content}}
解析：{{analysis}}
答案：{{answer}}
难度级别：{{difficulty}}

【审计任务】

### 一、条件充分性审计
- 题干给出的条件是否足够？
- 是否存在"条件缺失导致无法求解"的情况？
- 是否存在"条件冗余"的情况？

### 二、推导一致性审计
- 解析的每一步是否都有依据？
- 是否存在"跳跃推导"或"逻辑幻觉"？
- 是否存在"循环论证"？

### 三、答案合理性审计
- 答案是否与题干条件自洽？
- 若为范围题，边界值是否合理？
- 若为证明题，论证是否完整？

### 四、超纲检查
- 是否使用了该年级不允许的工具？
- L2 题目是否使用了导数等高级工具？
- 解题方法是否与难度级别匹配？

【评分标准】
- **PASS**：逻辑闭环，条件充分，无超纲
- **CONDITIONAL_PASS**：逻辑基本正确，但有小瑕疵（如表述不严谨）
- **FAIL**：存在逻辑断裂、条件缺失或严重超纲

【输出格式】
请严格返回 JSON：
{
  "status": "PASS" | "CONDITIONAL_PASS" | "FAIL",
  "score": 0.0-5.0,
  "auditDetails": {
    "sufficiency": { "pass": true, "issues": [] },
    "consistency": { "pass": true, "issues": [] },
    "answerValidity": { "pass": true, "issues": [] },
    "gradeCompliance": { "pass": true, "issues": [] }
  },
  "reason": "简短说明",
  "suggestion": "修改建议（如果 FAIL）",
  "highlights": ["亮点1", "亮点2"] // 好题的亮点
}`

// ==================== 简化版验算 (L2 专用) ====================

export const SIMPLE_SUBSTITUTION_PROMPT = `你是一个数学验算助手。请执行简单的代入验算。

【题目】
{{content}}

【答案】
{{answer}}

【任务】
1. 将答案代入原方程/原条件
2. 验证是否成立
3. 检查是否有遗漏情况

【输出格式】
{
  "verified": true/false,
  "substitutionSteps": ["步骤1: 代入 x=1", "步骤2: 验证 1+1=2 ✓"],
  "issues": [],
  "confidence": 0.0-1.0
}`

// ==================== 动态路由配置 ====================

export const ROUTER_CONFIG = {
  L2: {
    extractionRequired: true,
    codeCheckRequired: true,  // L2 需要代码级验算
    logicAuditRequired: true,
    passThreshold: 3.5,
    strictMode: true
  },
  L3: {
    extractionRequired: true,
    codeCheckRequired: false, // L3 跳过代码验算
    logicAuditRequired: true,
    passThreshold: 3.8,
    strictMode: false
  },
  L4: {
    extractionRequired: true,
    codeCheckRequired: false, // L4 完全依赖逻辑审计
    logicAuditRequired: true,
    passThreshold: 4.2,
    strictMode: false,
    encourageInnovation: true // 鼓励创新思维
  }
}

// ==================== 导出 ====================
export default {
  EXTRACTION_AGENT_PROMPT,
  LOGIC_AUDITOR_PROMPT,
  SIMPLE_SUBSTITUTION_PROMPT,
  ROUTER_CONFIG
}
