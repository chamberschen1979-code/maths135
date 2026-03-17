# 原 WeeklyMission "待消灭错题"逻辑分析

## 一、核心概念

### 1.1 "待消灭错题"的定义

在原来的 WeeklyMission.jsx 中，"待消灭错题"是指：

```javascript
value={errorNotebook?.filter(e => !e.resolved).length || 0}
```

- 统计 `errorNotebook` 数组中 `resolved` 字段为 `false` 的错题数量
- 只要 `resolved` 为 `false`，就算作"待消灭"

### 1.2 错题数据结构

```typescript
interface ErrorItem {
  id: string
  targetId: string           // 母题ID
  targetName?: string        // 母题名称
  diagnosis: string          // 诊断信息
  level?: string             // 难度等级
  source?: 'weekly' | 'training' | 'import'  // 来源（新增）
  addedAt: string
  resolved: boolean          // 是否已消灭
  resolvedAt?: string        // 消灭时间
}
```

## 二、错题消灭逻辑

### 2.1 原代码中的消灭机制

在 App.jsx 中，有一个 `resolveError` 函数（需要确认具体实现）：

```javascript
// 原代码传递给 WeeklyMission 的 prop
onResolveError={resolveError}
```

### 2.2 消灭错题的条件

根据原代码分析，错题消灭的可能条件：

1. **用户完成任务后**：在任务卡片中答对题目
2. **手动标记**：用户主动点击"已掌握"按钮
3. **AI诊断通过**：答案录入后 AI 评分达到一定阈值

### 2.3 消灭错题的流程

```
用户答题 → AI评分 → 分数 >= 阈值(如80分) → 标记 resolved=true → 更新 Elo 和状态灯
```

## 三、新版 WeeklyMissionNew 缺失的功能

### 3.1 当前缺失

1. **没有"消灭错题"按钮**：用户无法手动标记错题已消灭
2. **答案录入后没有更新 errorNotebook**：`handleSubmitAnswer` 只更新了 `generatedTasks`，没有同步更新 `errorNotebook`
3. **没有消灭后的 Elo 更新逻辑**

### 3.2 需要补充的功能

1. **在 TaskDisplay 中添加消灭逻辑**：
   - 答案提交后，如果分数 >= 80，自动标记对应错题为已消灭
   - 更新 Elo 分数（+分）
   - 更新变例状态灯（可能从红变黄/绿）

2. **在 ErrorSection 中添加手动消灭按钮**：
   - 用户可以手动标记某个错题为"已掌握"
   - 不扣分，只改变状态

3. **消灭后的数据同步**：
   - 更新 `errorNotebook` 中对应错题的 `resolved` 字段
   - 触发 `setErrorNotebook` 更新状态

## 四、建议的实现方案

### 4.1 答案录入后自动消灭

```javascript
const handleSubmitAnswer = useCallback((taskIndex, answer, score) => {
  // 1. 更新任务状态
  setGeneratedTasks(prev => prev.map((task, idx) => 
    idx === taskIndex ? { ...task, userAnswer: answer, score } : task
  ));

  // 2. 如果分数 >= 80，标记对应错题为已消灭
  if (score >= 80) {
    const task = generatedTasks[taskIndex];
    if (task?.source === 'error') {
      setErrorNotebook(prev => prev.map(err => 
        err.targetId === task.motifId && !err.resolved
          ? { ...err, resolved: true, resolvedAt: new Date().toISOString() }
          : err
      ));
    }
  }
}, [generatedTasks, setErrorNotebook]);
```

### 4.2 手动消灭错题

在 ErrorSection 中添加"已掌握"按钮：

```javascript
const handleMarkResolved = (errorId) => {
  setErrorNotebook(prev => prev.map(err => 
    err.id === errorId 
      ? { ...err, resolved: true, resolvedAt: new Date().toISOString() }
      : err
  ));
};
```

### 4.3 消灭后的 Elo 更新

```javascript
const updateEloAfterResolve = (motifId, score) => {
  // 基于分数计算 Elo 增量
  const eloDelta = Math.floor((score - 60) * 5); // 60分及格，每高1分加5 Elo
  
  // 更新 tacticalData 中的 Elo
  // 注意：这需要通过父组件的回调函数实现
};
```

## 五、总结

### 原逻辑
- "待消灭错题" = `errorNotebook.filter(e => !e.resolved).length`
- 消灭条件：`resolved` 字段变为 `true`
- 消灭方式：通过 `onResolveError` 回调

### 新版需要补充
1. 答案录入后自动判断是否消灭
2. 手动消灭按钮
3. 消灭后同步更新 Elo 和状态灯
4. 错题来源标记（weekly/training/import）
