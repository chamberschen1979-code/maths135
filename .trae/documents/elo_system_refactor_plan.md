# Elo评分与出题系统重构计划

## 一、需求概述

### 1. Elo分数算法简化

| 等级 | 答对加分 | 答错扣分 |
| -- | ---- | ---- |
| L1 | +20  | -10  |
| L2 | +40  | -20  |
| L3 | +60  | -30  |
| L4 | +100 | -50  |

* 取消分数评级（S/A/B/C）

* 取消特殊倍数（L4奖励1.5x、L2惩罚2.0x、熔断惩罚2.5x）

### 2. 多问分别计算

* 每问独立计算Elo分数

* 例：第一问L2做对+40，第二问L4做错-50

### 3. 出题难度选择逻辑

| 用户等级 | 出题规则          |
| ---- | ------------- |
| L1   | 只出L1单问题目      |
| L2   | 只出L2单问题目      |
| L3   | 可出L2+L3两问题目   |
| L4   | 可出L2/3+L4两问题目 |

### 4. 双轨制系统

* **轨道A（晋级资格）**：熔断逻辑、连击计数、权限锁定

* **轨道B（ELO积分）**：独立累加、细粒度评估

### 5. 母题晋级规则（保持不变）

以下规则在重构后必须保持不变：

| 规则         | 说明                  | 现有代码位置                                            |
| ---------- | ------------------- | ------------------------------------------------- |
| 🟢 变例通关条件  | 连续3次训练题目答题正确        | `MASTERY_CONFIG.CONSECUTIVE_CORRECT_REQUIRED = 3` |
| 🟢 Elo分数达标 | 达到该级别的Elo阈值         | `LEVEL_THRESHOLDS` + `checkMasteryEligibility()`  |
| 🔴 导入错题    | 不扣分，但变例状态变红         | `errorNotebook` 处理逻辑                              |
| 🔴 训练错题    | 扣分，且变例状态变红          | `updateSubTargetMastery()`                        |
| 🔴 Elo上限限制 | 有变例未通关时，Elo不超过该级别上限 | `applyEloCeiling()` + `getEloCeiling()`           |

**关键函数保留：**

```javascript
// 这些函数逻辑不变，只调整内部调用的Elo计算方式
export const getTargetStatus = (targetLevel, currentElo, consecutiveCorrect) => {...}
export const checkMasteryEligibility = (subTarget, eloScore) => {...}
export const updateSubTargetMastery = (subTarget, isCorrect, isFirstAttempt, currentElo) => {...}
export const getEloCeiling = (subTargets, motifData) => {...}
export const applyEloCeiling = (elo, subTargets, motifData) => {...}
```

### 6. 新增修正点

#### 修正1：出题逻辑必须响应"熔断锁定"

在 `selectQuestionLevels` 函数中，必须加入最高优先级的锁定检查：

```javascript
export const selectQuestionLevels = (userLevel, motifData, userQualificationStatus) => {
  // 【最高优先级】如果用户处于 L2 熔断锁定状态，无视当前 UserLevel，强制只出纯 L2 单问
  if (userQualificationStatus?.isHighLevelLocked) {
    return [
      { level: 'L2', questionIndex: 0, isMultiQuestion: false }
    ];
  }
  
  // 原有逻辑...
}
```

#### 修正2：区分"变例连击"与"解封连击"

维护两个独立的连击计数逻辑：

| 计数器                   | 用途     | 增加条件        | 清零条件   |
| --------------------- | ------ | ----------- | ------ |
| `motifStreak`         | 变例通关判定 | 任何题目全对 +1   | 任何题目错误 |
| `l2RemediationStreak` | 解封判定   | 仅纯L2单问正确 +1 | L2单问错误 |

解锁条件：`l2RemediationStreak >= 3` 时，将 `isHighLevelLocked` 设为 `false`

#### 修正3：增强多问解析容错

实现 `parseMultiQuestionAnswer` 函数：

```javascript
export const parseMultiQuestionAnswer = (rawInput, expectedCount) => {
  let answers = [];
  
  // 优先级1: 正则匹配 (1), (2) 或 ①, ② 等标记
  const bracketPattern = /[(（]([1-4])[)）]|([①②③④])/g;
  // ...匹配逻辑
  
  // 优先级2: 按换行符分割
  if (answers.length === 0 && rawInput.includes('\n')) {
    answers = rawInput.split('\n').filter(s => s.trim());
  }
  
  // 优先级3: 按 ; 或 , 分割
  if (answers.length === 0) {
    answers = rawInput.split(/[;,；，]/).filter(s => s.trim());
  }
  
  // 校验：答案数量 != 题目问数
  if (answers.length !== expectedCount) {
    return {
      status: 'FORMAT_ERROR',
      message: '检测到答案格式不完整，请明确区分第 1 问和第 2 问的答案。',
      answers: []
    };
  }
  
  return { status: 'OK', answers };
};
```

格式错误处理：

* 不计算 ELO 得失（或仅扣 5 分格式分）

* 不计入连击（视为无效提交）

* 显示友好提示

#### 修正4：L1等级迁移逻辑

```javascript
export const migrateUserLevel = (oldEloScore) => {
  // 若旧用户 eloScore < 1000 (L2门槛)，自动降级为 L1
  if (oldEloScore < LEVEL_THRESHOLDS.L2.min) {
    return 'L1';
  }
  return getLevelByElo(oldEloScore);
};
```

确保 `LEVEL_THRESHOLDS` 中包含 L1 的下限（0）和 L2 的下限（1000）。

***

## 二、现有代码结构分析

### 需要修改的文件

| 文件                                    | 现有功能            | 修改内容                   |
| ------------------------------------- | --------------- | ---------------------- |
| `src/utils/eloEngine.js`              | Elo计算、熔断惩罚、精通进度 | 简化Elo算法、新增双轨制逻辑、新增解封连击 |
| `src/config/difficultyConfig.js`      | 难度配置、Elo阈值      | 调整阈值、新增L1配置            |
| `src/data/scoringEngine.json`         | 分数配置、出题分布       | 更新分数、重写出题分布            |
| `src/utils/problemLogic.js`           | 题目生成逻辑          | 新增难度匹配逻辑、熔断锁定检查        |
| `src/components/WeeklyMissionNew.jsx` | 前端评判逻辑          | 多问解析、格式错误处理、分问得分展示     |

### 可复用的字段

| 字段名                                           | 所在文件                | 用途          |
| --------------------------------------------- | ------------------- | ----------- |
| `LEVEL_THRESHOLDS`                            | eloEngine.js        | 等级阈值（需新增L1） |
| `MASTERY_CONFIG.CONSECUTIVE_CORRECT_REQUIRED` | eloEngine.js        | 连续正确次数要求    |
| `level_scores`                                | scoringEngine.json  | 各等级分数配置     |
| `DIFFICULTY_TIERS`                            | difficultyConfig.js | 难度层级配置      |

***

## 三、实施步骤

### 步骤1：更新 scoringEngine.json

```json
{
  "level_scores": {
    "L1": { "score_correct": 20, "score_wrong": -10 },
    "L2": { "score_correct": 40, "score_wrong": -20 },
    "L3": { "score_correct": 60, "score_wrong": -30 },
    "L4": { "score_correct": 100, "score_wrong": -50 }
  },
  "elo_question_distribution": {
    "L1": { "recommended_levels": ["L1"], "multi_question": false },
    "L2": { "recommended_levels": ["L2"], "multi_question": false },
    "L3": { "recommended_levels": ["L2+L3"], "multi_question": true },
    "L4": { "recommended_levels": ["L2+L4", "L3+L4"], "multi_question": true }
  }
}
```

### 步骤2：重构 eloEngine.js

**2.1 更新等级阈值**

```javascript
const LEVEL_THRESHOLDS = {
  L1: { min: 0, max: 999 },
  L2: { min: 1000, max: 1799 },
  L3: { min: 1800, max: 2499 },
  L4: { min: 2500, max: 3000 },
}
```

**2.2 简化Elo计算函数**

```javascript
const ELO_SCORES = {
  L1: { correct: 20, wrong: -10 },
  L2: { correct: 40, wrong: -20 },
  L3: { correct: 60, wrong: -30 },
  L4: { correct: 100, wrong: -50 }
}

export const calculateSimpleEloChange = (level, isCorrect) => {
  const scores = ELO_SCORES[level] || ELO_SCORES.L1
  return isCorrect ? scores.correct : scores.wrong
}
```

**2.3 新增多问Elo计算**

```javascript
export const calculateMultiQuestionElo = (details) => {
  let totalDelta = 0
  const breakdown = []
  
  details.forEach(d => {
    const delta = calculateSimpleEloChange(d.level, d.isCorrect)
    totalDelta += delta
    breakdown.push({
      index: d.index,
      level: d.level,
      isCorrect: d.isCorrect,
      delta
    })
  })
  
  return { totalDelta, breakdown }
}
```

**2.4 新增双轨制评估函数（含解封连击）**

```javascript
export const evaluateSubmission = (params) => {
  const { userAnswers, correctAnswers, questionMeta, currentUser } = params
  
  // 1. 逐问比对
  const details = userAnswers.map((ans, i) => ({
    index: i,
    level: questionMeta.questions[i].level,
    isCorrect: strictCompare(ans, correctAnswers[i])
  }))
  
  const isAllCorrect = details.every(d => d.isCorrect)
  const hasL2Error = details.some(d => d.level === 'L2' && !d.isCorrect)
  const isPureL2Question = details.every(d => d.level === 'L2') && details.length === 1
  
  // 2. 轨道B: ELO计算
  const eloResult = calculateMultiQuestionElo(details)
  
  // 3. 轨道A: 晋级资格判定（区分两种连击）
  let motifStreak = isAllCorrect ? (currentUser.motifStreak || 0) + 1 : 0
  let l2RemediationStreak = currentUser.l2RemediationStreak || 0
  
  if (isPureL2Question) {
    // 纯L2单问：影响解封连击
    l2RemediationStreak = isAllCorrect ? l2RemediationStreak + 1 : 0
  }
  // 综合题：不影响解封连击
  
  const isHighLevelLocked = currentUser.isHighLevelLocked && l2RemediationStreak < 3
  
  // L2错误触发熔断
  const newLocked = hasL2Error ? true : isHighLevelLocked
  
  return {
    pass: isAllCorrect,
    elo: eloResult,
    qualification: {
      motifStreak,
      l2RemediationStreak,
      l2Status: hasL2Error ? 'RED' : 'GREEN',
      isHighLevelLocked: newLocked,
      nextAction: newLocked ? 'FORCE_L2_REMEDIATION' : (isAllCorrect ? 'NEXT' : 'RETRY')
    },
    feedback: { details }
  }
}
```

**2.5 删除/废弃的代码**

* 删除 `calculateEloChange` 中的复杂Elo公式

* 删除 `MASTERY_CONFIG.L4_BONUS_MULTIPLIER`

* 删除 `MASTERY_CONFIG.L2_PENALTY_MULTIPLIER`

* 删除 `MASTERY_CONFIG.MELTDOWN_PENALTY_MULTIPLIER`

### 步骤3：更新 difficultyConfig.js

**3.1 新增L1配置**

```javascript
export const DIFFICULTY_TIERS = [
  {
    id: 'beginner',
    name: '入门基础',
    eloRange: [0, 999],
    config: {
      level: 'L1',
      complexity: 0.5,
      steps: 1,
      traps: 0,
      multiQuestion: false
    }
  },
  {
    id: 'foundation',
    name: '基础筑基',
    eloRange: [1000, 1799],
    config: {
      level: 'L2',
      complexity: 1,
      steps: 2,
      traps: 0,
      multiQuestion: false
    }
  },
  // ... L3, L4 配置
]
```

**3.2 新增难度匹配函数**

```javascript
export const getQuestionLevelsForUser = (userLevel) => {
  const mapping = {
    'L1': { levels: ['L1'], multiQuestion: false },
    'L2': { levels: ['L2'], multiQuestion: false },
    'L3': { levels: ['L2', 'L3'], multiQuestion: true },
    'L4': { levels: ['L2', 'L3', 'L4'], multiQuestion: true }
  }
  return mapping[userLevel] || mapping['L1']
}
```

### 步骤4：更新 problemLogic.js

**4.1 新增出题难度选择逻辑（含熔断锁定检查）**

```javascript
export const selectQuestionLevels = (userLevel, motifData, userQualificationStatus) => {
  // 【最高优先级】熔断锁定：强制只出纯L2单问
  if (userQualificationStatus?.isHighLevelLocked) {
    return [
      { level: 'L2', questionIndex: 0, isMultiQuestion: false }
    ];
  }
  
  const config = getQuestionLevelsForUser(userLevel)
  
  if (!config.multiQuestion) {
    // L1/L2: 单问
    return [{ level: config.levels[0], isMultiQuestion: false }]
  }
  
  // L3/L4: 两问组合
  if (userLevel === 'L3') {
    return [
      { level: 'L2', questionIndex: 0 },
      { level: 'L3', questionIndex: 1 }
    ]
  }
  
  if (userLevel === 'L4') {
    const firstLevel = Math.random() > 0.5 ? 'L2' : 'L3'
    return [
      { level: firstLevel, questionIndex: 0 },
      { level: 'L4', questionIndex: 1 }
    ]
  }
}
```

### 步骤5：更新 WeeklyMissionNew\.jsx

**5.1 新增多问解析函数**

```javascript
const parseMultiQuestionAnswer = (rawInput, expectedCount) => {
  if (!rawInput) return { status: 'EMPTY', answers: [] };
  
  let answers = [];
  const normalized = rawInput.replace(/[（(]/g, '(').replace(/[）)]/g, ')');
  
  // 优先级1: 匹配 (1) (2) 或 ① ②
  const bracketMatches = normalized.match(/[(]([1-4])[)]|[①②③④]/g);
  if (bracketMatches && bracketMatches.length >= expectedCount) {
    // 提取每个标记后的内容
    // ...解析逻辑
  }
  
  // 优先级2: 按换行符分割
  if (answers.length === 0 && normalized.includes('\n')) {
    answers = normalized.split('\n').map(s => s.trim()).filter(Boolean);
  }
  
  // 优先级3: 按 ; 或 , 分割
  if (answers.length === 0) {
    answers = normalized.split(/[;,；，]/).map(s => s.trim()).filter(Boolean);
  }
  
  // 校验
  if (answers.length !== expectedCount) {
    return {
      status: 'FORMAT_ERROR',
      message: `检测到答案格式不完整（期望${expectedCount}问，实际${answers.length}问），请明确区分各问答案。`,
      answers: []
    };
  }
  
  return { status: 'OK', answers };
};
```

**5.2 更新答案评判逻辑**

```javascript
const evaluateAnswers = (userAnswer, correctAnswer, questionMeta) => {
  const expectedCount = questionMeta.questions?.length || 1;
  const parseResult = parseMultiQuestionAnswer(userAnswer, expectedCount);
  
  // 格式错误处理
  if (parseResult.status === 'FORMAT_ERROR') {
    return {
      status: 'FORMAT_ERROR',
      message: parseResult.message,
      details: [],
      totalDelta: -5,  // 格式分
      isAllCorrect: false,
      isInvalidSubmit: true  // 不计入连击
    };
  }
  
  const userAnswers = parseResult.answers;
  const correctQuestions = parseSubQuestions(correctAnswer);
  
  const details = [];
  let totalDelta = 0;
  
  questionMeta.questions.forEach((q, index) => {
    const userQ = userAnswers[index] || '';
    const correctQ = correctQuestions[String(index + 1)] || '';
    const level = q.level;
    
    const isCorrect = strictCompare(userQ, correctQ);
    const delta = calculateSimpleEloChange(level, isCorrect);
    
    details.push({ index, level, isCorrect, delta, userAnswer: userQ, correctAnswer: correctQ });
    totalDelta += delta;
  });
  
  return {
    status: 'OK',
    details,
    totalDelta,
    isAllCorrect: details.every(d => d.isCorrect),
    isInvalidSubmit: false
  };
};
```

***

## 四、数据结构定义

### 4.1 用户答案结构

```javascript
// 输入
userAnswer = "(1) 答案1 (2) 答案2"

// 解析后
userAnswers = ["答案1", "答案2"]
```

### 4.2 题目元数据结构

```javascript
questionMeta = {
  questions: [
    { level: 'L2', content: '第一问内容' },
    { level: 'L4', content: '第二问内容' }
  ]
}
```

### 4.3 评估结果结构

```javascript
evaluationResult = {
  status: 'OK',  // 或 'FORMAT_ERROR'
  pass: false,   // 二元判定
  elo: {
    current: 1250,
    delta: -10,
    breakdown: [
      { index: 0, level: 'L2', isCorrect: true, delta: 40 },
      { index: 1, level: 'L4', isCorrect: false, delta: -50 }
    ]
  },
  qualification: {
    motifStreak: 0,           // 变例连击
    l2RemediationStreak: 0,   // 解封连击
    l2Status: 'GREEN',
    isHighLevelLocked: false,
    nextAction: 'RETRY'
  },
  feedback: {
    summary: '高阶失守，整题失败',
    details: [...]
  },
  isInvalidSubmit: false  // 是否无效提交（格式错误）
}
```

***

## 五、测试用例

### 5.1 Elo计算测试

| 场景          | 预期结果             |
| ----------- | ---------------- |
| L1做对        | +20              |
| L2做错        | -20              |
| L2做对 + L4做错 | +40 - 50 = -10   |
| L3做对 + L4做对 | +60 + 100 = +160 |

### 5.2 熔断逻辑测试

| 场景          | L2状态     | 高阶锁定  | 解封连击变化 |
| ----------- | -------- | ----- | ------ |
| L2做错 + L4做对 | 🔴 RED   | ✅ 锁定  | 清零     |
| L2做对 + L4做错 | 🟢 GREEN | ❌ 不锁定 | 不变     |
| 全对          | 🟢 GREEN | ❌ 不锁定 | 不变     |

### 5.3 解封连击测试

| 场景          | 题目类型 | 结果 | 解封连击变化  |
| ----------- | ---- | -- | ------- |
| 纯L2单问正确     | 单问   | 全对 | +1      |
| 纯L2单问错误     | 单问   | 错误 | 清零      |
| L2+L3综合题全对  | 两问   | 全对 | 不变      |
| L2+L4综合题L2错 | 两问   | 错误 | 清零 + 锁定 |

### 5.4 出题难度测试

| 用户等级 | 熔断锁定 | 预期题目              |
| ---- | ---- | ----------------- |
| L1   | 否    | 单问L1              |
| L2   | 否    | 单问L2              |
| L3   | 否    | 两问(L2+L3)         |
| L4   | 否    | 两问(L2+L4 或 L3+L4) |
| 任意   | 是    | 单问L2（强制）          |

### 5.5 多问解析测试

| 输入            | 预期问数 | 解析结果          |
| ------------- | ---- | ------------- |
| "(1) A (2) B" | 2    | \["A", "B"]   |
| "①A\n②B"      | 2    | \["A", "B"]   |
| "A;B"         | 2    | \["A", "B"]   |
| "A"           | 2    | FORMAT\_ERROR |

***

## 六、实施顺序

1. **Phase 1**: 更新配置文件 (scoringEngine.json, difficultyConfig.js)
2. **Phase 2**: 重构Elo引擎 (eloEngine.js) - 含双连击逻辑
3. **Phase 3**: 更新出题逻辑 (problemLogic.js) - 含熔断锁定检查
4. **Phase 4**: 更新前端评判逻辑 (WeeklyMissionNew\.jsx) - 含多问解析
5. **Phase 5**: 测试验证

***

## 七、风险评估

| 风险           | 影响       | 缓解措施                 |
| ------------ | -------- | -------------------- |
| 现有用户Elo分数不兼容 | 用户分数可能异常 | 添加迁移逻辑，按比例转换         |
| 多问解析失败       | 评分错误     | 增强标准化清洗引擎 + 格式错误友好提示 |
| 熔断逻辑误触发      | 用户体验差    | 添加详细日志和调试模式          |
| 解封连击计数混乱     | 无法正确解锁   | 明确区分两种连击的触发条件        |

***

## 八、最终确认清单

* [ ] scoringEngine.json: L1-L4 分值已更新，无倍数奖励

* [ ] eloEngine.js: `calculateSimpleEloChange` 已替换复杂公式

* [ ] eloEngine.js: `evaluateSubmission` 实现双轨制

* [ ] eloEngine.js: 增加了 `l2RemediationStreak` 逻辑

* [ ] problemLogic.js: `selectQuestionLevels` 增加了 `isHighLevelLocked` 强制拦截

* [ ] WeeklyMissionNew\.jsx: 前端能展示分问得分详情

* [ ] WeeklyMissionNew\.jsx: 前端能处理格式错误的友好提示

