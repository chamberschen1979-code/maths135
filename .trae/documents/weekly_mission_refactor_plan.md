# 周生成任务逻辑重构计划 (V4.0 终极纯净版 - 修订版)

## 我对 V4.0 算法的核心理解

### 第一层：超级候选池（准入红线）

三个独立名单：

1. **红色名单 (Red List)**：errorNotebook 中未核销的错题母题 ID
2. **战力名单 (Power List)**：数据库中 `elo_score >= 1001` 的母题 ID
3. **勾选名单 (Choice List)**：weeklyPlan.activeMotifs 数组中的 ID

**禁令**：除此之外，严禁访问任何数据。

### 第二层：顺序生产与物理去重

**核心机制**：使用两个 Set 进行双重去重

* `usedMotifIds`：防止**重复母题**

* `addedSubIds`：防止**重复题目**（即使是不同母题也可能引用同一道综合题）

***

## 用户修改意见整合

### 1. 战力名单的"实时性"检查

* 如果某个母题既在 powerList 里，也在 redList 里，以 redList 为准（已通过 usedMotifIds 实现）

* **关键提醒**：`findEncounterById` 函数必须过滤掉 `elo_score < 1001` 的情况，防止手动勾选了 L1 母题却意外触发了样题提取

### 2. 筑基强化的"强制 AI"参数传递

* `forceGenerate` 参数（第五个参数）必须为 `true`

* **关键提醒**：`extractProblemFromEncounter` 内部必须实时计算该 encounter 的 `elo_score`，而不再是写死传一个 `'L2'` 字符串进去

### 3. 意愿补位的"空状态"UI 表现

* 无内容时**不要隐藏整个 Section**，而是渲染一个"灰色占位态"

* 理由：让用户清晰感知到"不是系统坏了，而是我没攒下错题/没点亮足够的母题"

* 这种"缺失感"会反向激励用户去看板"点灯"

### 4. generateAIProblem 增加"样题对标"逻辑

* **参数扰动系数**：当 Elo 为 L2 级别时，参数必须保证计算结果为整数或简单分数，禁止出现复杂的根式

* **双重输出比对**：在 `verifyAIOutput` 中增加检查——如果解析（analysis）中的逻辑步数少于该等级要求的最小步数（如 L3 要求不少于 4 步），则视为无效，重新生成

* **DNA 强约束**：在 Prompt 中明确："必须保留样题的\[知识点组合方式]，仅允许改变\[常数项]和\[函数类型]"

***

## 修改方案（完整版）

### 核心代码结构

```javascript
const handleGenerateBundle = () => {
  setGenerating(true)
  setBundle(null) // 步骤 0：UI 清场
  
  setTimeout(() => {
    const newBundle = {
      errors: [],
      bleeding: [],
      basics: [],
      generatedAt: new Date().toISOString(),
      noActiveMotifs: false
    }
    
    // 双重去重机制
    const addedSubIds = new Set()    // 防止重复题目
    const usedMotifIds = new Set()   // 防止重复母题
    
    // ========== 第一层：超级候选池 ==========
    // 红色名单
    const redList = new Set(
      errorNotebook.filter(e => !e.resolved).map(e => e.targetId)
    )
    
    // 战力名单：elo_score >= 1001（注意：是 1001，不是 1000）
    const powerList = new Map()
    const allEncounters = new Map() // 用于 findEncounterById
    
    for (const map of tacticalData.tactical_maps) {
      for (const encounter of map.encounters) {
        allEncounters.set(encounter.target_id, encounter)
        if ((encounter.elo_score || 0) >= 1001) {
          powerList.set(encounter.target_id, encounter)
        }
      }
    }
    
    // 勾选名单
    const choiceList = new Set(weeklyPlan.activeMotifs || [])
    
    // 辅助函数：安全获取 encounter（过滤 L1）
    const findEncounterById = (targetId) => {
      const encounter = allEncounters.get(targetId)
      if (!encounter) return null
      // 物理熔断：过滤 elo_score < 1001 的情况
      if ((encounter.elo_score || 0) < 1001 && !redList.has(targetId)) {
        return null
      }
      return encounter
    }
    
    // ========== 步骤 1：🔴 错题巩固 ==========
    for (const targetId of redList) {
      usedMotifIds.add(targetId)
      const encounter = findEncounterById(targetId)
      if (encounter) {
        for (let i = 0; i < 2; i++) {
          const problem = extractProblemFromEncounter(
            encounter, 
            encounter.gear_level || 'L2', // 实时计算，不写死
            'error', 
            addedSubIds, 
            true,  // forceGenerate = true
            true   // isUserSelected = true（错题视为用户关注）
          )
          if (problem) newBundle.errors.push(problem)
        }
      }
    }
    
    // ========== 步骤 2：🟡 筑基强化 ==========
    // 战力名单中不在 usedMotifIds 中的 ID，按 Elo 从低到高排序
    const foundationCandidates = [...powerList.values()]
      .filter(e => !usedMotifIds.has(e.target_id))
      .sort((a, b) => (a.elo_score || 0) - (b.elo_score || 0))
      .slice(0, 3)
    
    for (const encounter of foundationCandidates) {
      usedMotifIds.add(encounter.target_id)
      for (let i = 0; i < 3; i++) {
        const problem = extractProblemFromEncounter(
          encounter, 
          encounter.gear_level || 'L2', // 实时计算
          'bleeding', 
          addedSubIds, 
          true,  // forceGenerate = true（物理锁定 3x3）
          false  // isUserSelected = false
        )
        if (problem) newBundle.bleeding.push(problem)
      }
    }
    
    // ========== 步骤 3：🔵 意愿补位 ==========
    // 勾选名单中不在 usedMotifIds 中的 ID
    for (const targetId of choiceList) {
      if (usedMotifIds.has(targetId)) continue
      usedMotifIds.add(targetId)
      const encounter = findEncounterById(targetId)
      if (encounter) {
        for (let i = 0; i < 2; i++) {
          const problem = extractProblemFromEncounter(
            encounter, 
            encounter.gear_level || 'L2',
            'active', 
            addedSubIds, 
            true,  // forceGenerate = true
            true   // isUserSelected = true
          )
          if (problem) newBundle.basics.push(problem)
        }
      }
    }
    
    // ========== 全空处理 ==========
    const total = newBundle.errors.length + newBundle.bleeding.length + newBundle.basics.length
    if (total === 0) {
      newBundle.noActiveMotifs = true
    }
    
    setBundle(newBundle)
    setGenerating(false)
  }, 300)
}
```

### UI 空状态渲染

```jsx
{/* 错题巩固 - 始终显示，空则显示占位态 */}
<div className="p-4 border-b border-slate-200 dark:border-zinc-700">
  <div className="flex items-center gap-2 mb-2">
    <span className="text-sm">🔴</span>
    <h3 className="text-sm font-semibold text-red-600">错题巩固</h3>
  </div>
  {bundle.errors.length === 0 ? (
    <p className="text-xs text-slate-400 italic">[暂无新增错题] —— 本周表现优秀，继续保持！</p>
  ) : (
    // 正常渲染题目列表
  )}
</div>

{/* 筑基强化 - 始终显示，空则显示占位态 */}
<div className="p-4 border-b border-slate-200 dark:border-zinc-700">
  <div className="flex items-center gap-2 mb-2">
    <span className="text-sm">🟡</span>
    <h3 className="text-sm font-semibold text-amber-600">筑基强化</h3>
  </div>
  {bundle.bleeding.length === 0 ? (
    <p className="text-xs text-slate-400 italic">[暂无筑基任务] —— 请前往看板激活母题（战力 >= 1001）</p>
  ) : (
    // 正常渲染题目列表
  )}
</div>

{/* 意愿补位 - 始终显示，空则显示占位态 */}
<div className="p-4">
  <div className="flex items-center gap-2 mb-2">
    <span className="text-sm">🔵</span>
    <h3 className="text-sm font-semibold text-blue-600">意愿补位</h3>
  </div>
  {bundle.basics.length === 0 ? (
    <p className="text-xs text-slate-400 italic">[暂无补位任务] —— 可手动勾选下周重点母题</p>
  ) : (
    // 正常渲染题目列表
  )}
</div>
```

### generateAIProblem 增强

```javascript
const generateAIProblem = (targetId, level, encounter, knowledgeEntry, isUserSelected = false) => {
  const eloScore = encounter?.elo_score || 0
  
  // 物理熔断：elo_score < 1001 且非用户选择，返回 null
  if (eloScore < 1001 && !isUserSelected) {
    return null
  }
  
  const effectiveElo = eloScore < 1001 ? 1001 : eloScore
  
  // 难度对位
  const getDifficultyByElo = (elo) => {
    if (elo <= 1800) {
      return {
        tier: '基础筑基',
        level: 'L2',
        minSteps: 2,
        maxSteps: 3,
        allowDiscussion: false, // L2 严禁分类讨论
        paramConstraint: 'integer_or_simple_fraction' // 参数约束：整数或简单分数
      }
    } else if (elo <= 2500) {
      return {
        tier: '深度复合',
        level: 'L3',
        minSteps: 4,
        maxSteps: 6,
        allowDiscussion: true, // L3 强制分类讨论
        paramConstraint: 'any'
      }
    }
    // ... 其他等级
  }
  
  const difficulty = getDifficultyByElo(effectiveElo)
  
  // 参数生成（根据约束）
  const generateParams = (constraint) => {
    if (constraint === 'integer_or_simple_fraction') {
      // L2：只生成整数或简单分数（分母 <= 10）
      return {
        a: Math.floor(Math.random() * 10) + 1,
        b: Math.floor(Math.random() * 10) - 5,
        // ...
      }
    }
    // L3+：允许更复杂的参数
  }
  
  // DNA 强约束：保留样题的知识点组合方式
  const prompt = `
    【命题规则】
    1. 必须保留样题的[知识点组合方式]
    2. 仅允许改变[常数项]和[函数类型]
    3. 禁止引入新的知识点或删除原有知识点
    
    【样题 DNA】
    ${prototypeProblem?.question || '无'}
    
    【战力对位】
    ${effectiveElo} 分 → ${difficulty.tier}
  `
  
  // ... 生成题目
}
```

### verifyAIOutput 增强

```javascript
const verifyAIOutput = (output, difficulty) => {
  // 原有检查...
  
  // 新增：逻辑步数检查
  const stepCount = (output.analysis.match(/\d+\./g) || []).length
  if (stepCount < difficulty.minSteps) {
    return { 
      valid: false, 
      reason: `逻辑步数不足：需要至少 ${difficulty.minSteps} 步，实际只有 ${stepCount} 步` 
    }
  }
  
  // 新增：L2 禁止分类讨论检查
  if (!difficulty.allowDiscussion && output.question.includes('讨论')) {
    return { 
      valid: false, 
      reason: 'L2 级别禁止出现分类讨论' 
    }
  }
  
  // 新增：L3 强制分类讨论检查
  if (difficulty.allowDiscussion && !output.question.includes('讨论')) {
    return { 
      valid: false, 
      reason: 'L3 级别必须包含分类讨论' 
    }
  }
  
  return { valid: true }
}
```

***

## 实现步骤清单

1. [ ] 修改准入门槛：`eloScore >= 1000` → `eloScore >= 1001`
2. [ ] 实现双重去重机制：`usedMotifIds` + `addedSubIds`
3. [ ] 实现 `findEncounterById` 辅助函数（过滤 L1）
4. [ ] 重写步骤 1 错题巩固：使用 redList，存入 usedMotifIds
5. [ ] 重写步骤 2 筑基强化：过滤 usedMotifIds，取战力名单前 3，每个 3 题
6. [ ] 重写步骤 3 意愿补位：过滤 usedMotifIds，取勾选名单剩余 ID
7. [ ] 废除 20 题容量限制
8. [ ] 实现 UI 空状态占位态渲染
9. [ ] 增强 `generateAIProblem`：参数约束 + DNA 强约束
10. [ ] 增强 `verifyAIOutput`：逻辑步数检查 + 分类讨论检查
11. [ ] 运行 lint 检查

