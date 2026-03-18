# AI 判题系统实施计划（完整版）

## 方案评估

### 核心理念

**出题 AI (Generator)** 关注创造，**判卷 AI (Grader)** 关注理解与评估。两者通过数据（题目和答案）紧密连接。

### 为什么必须给题目和答案？

| 数据   | 作用                          |
| ---- | --------------------------- |
| 题目   | 让 AI 理解语境（是求值还是证明？是填空还是解答？） |
| 标准答案 | 代表出题人的意图和评分标准               |

### 优点

1. **极高的容错率**：处理 LaTeX、纯文本、中文描述等各种格式
2. **语义理解**：判断数学等价性（`1/2 = 0.5`，`x>1 = (1,+∞)`）
3. **智能反馈**：AI 提供有价值的点评
4. **用户体验好**：不再因为格式差异被判错

### 风险与应对

| 风险       | 应对策略                                 |
| -------- | ------------------------------------ |
| API 调用成本 | 使用 qwen-plus（判题 token 少，成本可控）        |
| 网络延迟     | 添加 Loading 状态，异步处理                   |
| API 不可用  | 保留本地 `strictCompare` 作为降级方案          |
| AI 判题一致性 | 使用低 temperature (0.1)，低 top\_p (0.5) |

***

## 实施步骤

### 第一步：创建 AI 判题工具

**文件**：`src/utils/aiGrader.js`

**核心功能**：

1. `buildGraderPrompt(question, standardAnswer, userAnswer, level)` - 构建专业判题 prompt
2. `judgeAnswerWithAI(question, standardAnswer, userAnswer, level)` - 主函数

**Prompt 设计要点**：

```
核心阅卷原则：
1. 数学本质优先：只要数学含义等价，即判为正确
2. 自然语言容错：忽略非关键动词/名词的缺失
3. 步骤与结论：核心结论正确通常判为正确
4. 多问处理：智能匹配标号混乱的答案
```

**模型选择**：`qwen-plus`（比 turbo 更稳定，逻辑推理更强）

### 第二步：修改 WeeklyMissionNew\.jsx

1. 导入 `judgeAnswerWithAI`
2. 修改 `handleSubmitAnswer` 为异步函数
3. 添加 `isSubmitting` 状态防止重复提交
4. 调用 AI 判题并更新状态
5. 保留 `strictCompare` 作为降级方案

### 第三步：修改 TaskDisplay.jsx

1. 显示 AI 点评（`aiReason` 字段）
2. 优化错误提示 UI
3. 添加 Loading 状态显示

### 第四步：添加降级策略

```javascript
try {
  const aiResult = await judgeAnswerWithAI(...);
  // 使用 AI 结果
} catch (error) {
  console.warn('AI 判题失败，降级为本地匹配');
  // 使用 strictCompare
  const isCorrect = strictCompare(userAnswer, correctAnswer);
}
```

***

## 文件修改清单

| 文件                                      | 操作 | 说明                |
| --------------------------------------- | -- | ----------------- |
| `src/utils/aiGrader.js`                 | 新建 | AI 判题核心逻辑         |
| `src/components/WeeklyMissionNew.jsx`   | 修改 | 集成 AI 判题，添加降级     |
| `src/components/weekly/TaskDisplay.jsx` | 修改 | 显示 AI 点评和 Loading |

***

## 代码实现细节

### 1. AI Grader Prompt 完整设计

```javascript
const buildGraderPrompt = (question, standardAnswer, userAnswer, level) => {
  return {
    system: `你是一位经验丰富、宽容且严谨的高中数学金牌阅卷老师。
你的任务是批改学生的作业。你需要对比【题目】、【标准答案】和【学生作答】。

核心阅卷原则 (必须严格遵守)：
1. 数学本质优先：
   - 只要数学含义等价，即判为正确
   - 允许格式混用：LaTeX (sqrt{2})、纯文本 (根号2)、近似值 (1.414) 视为等价
   - 允许集合/区间/不等式混用：{x|x>1}、(1, +∞)、x>1 视为等价

2. 自然语言容错：
   - 忽略非关键动词/名词的缺失
   - 例如："点C在..."与"C在..."等价

3. 步骤与结论：
   - 如果题目只要求"求结果"，学生只写结果且正确，判对
   - 核心结论正确，通常判为正确

4. 多问处理：
   - 仔细识别学生答案中的 (1), (2) 或 ①, ② 标记
   - 如果学生漏答某问，该问判错

输出格式：
- 严禁输出任何多余的文字、寒暄或 Markdown 代码块标记
- 必须且只能输出一个合法的 JSON 对象`,

    user: `【题目内容】：
${question}

【标准答案与解析】：
${JSON.stringify(standardAnswer)}

【学生作答】：
${userAnswer}

【当前难度等级】：${level}

请执行判卷，输出 JSON 格式：
{
  "isCorrect": true/false,
  "reason": "简短点评",
  "details": [{"questionIndex": 1, "isCorrect": true}, ...]
}`
  };
};
```

### 2. API 调用参数

```javascript
{
  model: 'qwen-plus',  // 比 turbo 更稳定
  messages: [...],
  temperature: 0.1,    // 极低温度，保证稳定性
  top_p: 0.5,          // 降低随机性
  max_tokens: 600      // 判题不需要太多 token
}
```

### 3. JSON 解析增强

````javascript
// 强力清洗：去除可能的 markdown 标记
content = content.replace(/```json/g, '').replace(/```/g, '').trim();

// 尝试修复可能的 JSON 截断
const jsonStart = content.indexOf('{');
const jsonEnd = content.lastIndexOf('}');
if (jsonStart !== -1 && jsonEnd !== -1) {
  content = content.substring(jsonStart, jsonEnd + 1);
}
````

### 4. 分数计算

```javascript
const ELO_SCORES = {
  L1: { correct: 20, wrong: -10 },
  L2: { correct: 40, wrong: -20 },
  L3: { correct: 60, wrong: -30 },
  L4: { correct: 100, wrong: -50 }
};
```

***

## 完整流程图

```
出题阶段:
  Input: 母题 M01 + 难度 L3
  Prompt A (Generator): "请出一道关于导数分类讨论的题..."
  Output: 题目 Q + 标准答案 A_std

答题阶段:
  User Input: 学生答案 A_user

判卷阶段:
  Input: 题目 Q + 标准答案 A_std + 学生答案 A_user
  Prompt B (Grader): "你是阅卷老师..."
  Output: 判决 Result (True/False + 点评)
```

***

## 预期效果

| 场景   | 用户答案        | 标准答案            | 判定结果 |
| ---- | ----------- | --------------- | ---- |
| 格式差异 | `f(2)<f(e)` | `f(2) \lt f(e)` | ✅ 正确 |
| 中文差异 | `C在直线AB上`   | `点C在直线AB上`      | ✅ 正确 |
| 数学等价 | `x>1`       | `(1,+∞)`        | ✅ 正确 |
| 近似值  | `1.414`     | `√2`            | ✅ 正确 |
| 符号混用 | `根号e`       | `\sqrt{e}`      | ✅ 正确 |
| 真正错误 | `x=1`       | `x=2`           | ❌ 错误 |
| 漏答   | 只答第1问       | 两问              | 第2问❌ |

***

## 测试用例

1. **故意写错别字**：`C 在直线上` → 预期：✅
2. **混用符号**：`根号2` vs `\sqrt{2}` → 预期：✅
3. **格式差异**：`f(2)<f(e)` vs `f(2) \lt f(e)` → 预期：✅
4. **数学等价**：`x>1` vs `(1,+∞)` → 预期：✅
5. **真正错误**：`x=1` vs `x=2` → 预期：❌
6. **漏答**：只答一问 → 预期：部分正确/错误

