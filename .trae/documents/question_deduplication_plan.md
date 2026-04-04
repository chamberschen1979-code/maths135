# 每周任务出题去重机制分析

## 一、当前问题

### 现象
- 每周任务生成后，如果清空，出题记录就没有了
- 下次生成任务时，可能会重复出相同的题目

### 根因分析

**当前选题逻辑**（problemLogic.js）：
```javascript
return matchedLevelPool[problemIndex % matchedLevelPool.length]
```

- `problemIndex` 是题目索引，从 0 开始
- 使用取模运算循环选择题目
- **问题**：清空任务后，`problemIndex` 重置为 0，导致选到相同的题目

**数据存储**（localStorage）：
- `weekly_tasks`：当前任务列表
- `error_notebook`：错题本
- `weekly_plan`：周计划
- **缺失**：没有 `used_questions` 历史记录

## 二、解决方案对比

### 方案A：添加出题历史记录（推荐）

**原理**：
- 新增 `usedQuestions` 存储已出过的题目ID
- 每次出题时排除已出过的题目
- 清空任务时保留历史记录

**优点**：
- 彻底避免重复出题
- 历史记录可追溯
- 可设置"重置历史"功能

**缺点**：
- 需要修改多个文件
- 需要额外的存储空间

**实现步骤**：
1. 在 App.jsx 中添加 `usedQuestions` 状态
2. 修改 selectBenchmark 函数，排除已用题目
3. 每次生成任务后，将题目ID添加到历史记录
4. 清空任务时不清空历史记录
5. 添加"重置出题历史"按钮（可选）

### 方案B：随机选题

**原理**：
- 使用随机数而非顺序索引选题
- 降低重复概率（但不完全避免）

**优点**：
- 实现简单
- 不需要额外存储

**缺点**：
- 仍有可能重复
- 无法保证覆盖所有题目

### 方案C：混合方案（推荐）

**原理**：
- 结合方案A和方案B
- 优先从未出过的题目中随机选择
- 如果所有题目都出过，则重置历史

**优点**：
- 保证题目不重复
- 题库用完后自动重置
- 用户体验好

**缺点**：
- 实现复杂度中等

## 三、推荐实现方案

### 采用方案C（混合方案）

**数据结构**：
```javascript
// localStorage 新增
usedQuestions: {
  [motifId]: {
    [level]: [questionId1, questionId2, ...]
  }
}
```

**选题逻辑修改**：
```javascript
function selectBenchmark(motifData, targetLevel, problemIndex, options) {
  const usedIds = getUsedQuestionIds(motifId, targetLevel)
  const availablePool = matchedLevelPool.filter(p => !usedIds.includes(p.id))
  
  if (availablePool.length === 0) {
    // 题库用完，重置该母题该等级的历史
    resetUsedQuestions(motifId, targetLevel)
    return matchedLevelPool[Math.floor(Math.random() * matchedLevelPool.length)]
  }
  
  // 随机选择
  return availablePool[Math.floor(Math.random() * availablePool.length)]
}
```

**需要修改的文件**：
1. `src/App.jsx` - 添加 usedQuestions 状态和持久化
2. `src/utils/problemLogic.js` - 修改 selectBenchmark 函数
3. `src/components/WeeklyMissionNew.jsx` - 生成任务后记录题目ID
4. `src/utils/questionHistory.js` - 新建历史记录管理工具

## 四、实现步骤

### 步骤1：创建 questionHistory.js 工具
- getUsedQuestionIds(motifId, level)
- addUsedQuestionId(motifId, level, questionId)
- resetUsedQuestions(motifId, level)
- resetAllUsedQuestions()

### 步骤2：修改 App.jsx
- 添加 usedQuestions 状态
- 添加 localStorage 持久化
- 传递给子组件

### 步骤3：修改 problemLogic.js
- selectBenchmark 函数接收 usedIds 参数
- 过滤已用题目
- 随机选择

### 步骤4：修改 WeeklyMissionNew.jsx
- 生成任务后调用 addUsedQuestionId
- 清空任务时不清空历史记录

### 步骤5：添加重置功能（可选）
- 在设置页面添加"重置出题历史"按钮

## 五、预期效果

- 每次出题都是未做过的新题
- 题库用完后自动重置
- 清空任务不会影响历史记录
- 用户可手动重置历史
