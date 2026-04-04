# 出题历史记录系统设计方案

## 问题分析

### 当前问题
1. **清空任务导致出题记录丢失**：`weeklyTasks` 清空后，`problemIndex` 从 0 开始，可能重复出题
2. **缺乏出题历史追踪**：没有独立存储"哪些题出过"
3. **无法重置单道题**：用户想要"重置后相当于没出过"

### 现有机制
- **遗忘曲线**：做对的题7天后 `is_mastered` 变为 `false`，可再次出现
- **出题选择**：`problemIndex % pool.length` 选择题目
- **问题**：`problemIndex` 没有持久化

---

## 设计方案

### 方案概述
创建独立的 `questionHistory` 存储，与 `weeklyTasks` 分离，记录每道题的出题情况。

### 数据结构

```javascript
// localStorage key: 'question_history'
questionHistory: {
  // 按 母题ID + 变例ID + 题目ID 组合作为唯一标识
  "M01_V1.1_Q001": {
    questionId: "Q001",           // 题目ID
    motifId: "M01",               // 母题ID
    varId: "V1.1",                // 变例ID
    level: "L2",                  // 难度等级
    
    // 出题记录
    firstIssuedAt: "2024-01-01",  // 首次出题时间
    lastIssuedAt: "2024-01-15",   // 最近出题时间
    issueCount: 2,                // 出题次数
    
    // 答题记录
    lastAnsweredAt: null,         // 最近答题时间
    lastGrade: null,              // 最近评级 (S/A/B/C)
    consecutiveCorrect: 0,        // 连续正确次数
    isMastered: false,            // 是否已掌握
    
    // 重置标记
    isReset: false,               // 是否被用户重置
    resetAt: null                 // 重置时间
  }
}
```

### 核心逻辑

#### 1. 出题时检查历史
```javascript
const selectQuestionWithHistory = (motifData, targetLevel, questionHistory) => {
  const pool = getQuestionPool(motifData, targetLevel);
  
  // 优先选择：未出过的题
  const unissued = pool.filter(q => !questionHistory[getKey(motifData.id, q.id)]);
  if (unissued.length > 0) {
    return randomSelect(unissued);
  }
  
  // 其次选择：被重置的题（相当于没出过）
  const reset = pool.filter(q => questionHistory[getKey(motifData.id, q.id)]?.isReset);
  if (reset.length > 0) {
    return randomSelect(reset);
  }
  
  // 再次选择：遗忘的题（7天+未掌握）
  const decayed = pool.filter(q => {
    const history = questionHistory[getKey(motifData.id, q.id)];
    return history && 
           !history.isMastered && 
           daysSince(history.lastAnsweredAt) >= 7;
  });
  if (decayed.length > 0) {
    return randomSelect(decayed);
  }
  
  // 最后：随机选择
  return randomSelect(pool);
};
```

#### 2. 清空任务时保留历史
```javascript
const clearWeeklyTasks = () => {
  // 只清空任务列表，不清空出题历史
  setWeeklyTasks([]);
  // questionHistory 保持不变
};
```

#### 3. 重置单道题
```javascript
const resetQuestionHistory = (questionKey) => {
  setQuestionHistory(prev => ({
    ...prev,
    [questionKey]: {
      ...prev[questionKey],
      isReset: true,
      resetAt: new Date().toISOString()
    }
  }));
};
```

---

## 实现步骤

### 第一步：创建 questionHistory 状态
- 在 App.jsx 中添加 `questionHistory` state
- 使用 localStorage 持久化存储
- 与 `weeklyTasks` 分离

### 第二步：修改出题逻辑
- 在 `generateSingleProblem` 中集成历史检查
- 出题时记录到 `questionHistory`
- 优先选择未出过的题

### 第三步：添加重置功能
- 在 UI 中添加"出题历史"面板
- 支持查看历史记录
- 支持重置单道题

### 第四步：与遗忘曲线集成
- 复用现有的 `DECAY_CONFIG` 配置
- 做对的题7天后可再次出现
- 做错的题优先出现

---

## 用户界面设计

### 出题历史面板
```
┌─────────────────────────────────────┐
│ 📋 出题历史                          │
├─────────────────────────────────────┤
│ 筛选: [全部] [未掌握] [已重置]        │
├─────────────────────────────────────┤
│ M01 集合运算                         │
│   V1.1 基础运算                      │
│     Q001 [L2] ✅已掌握 (2次)         │
│     Q002 [L2] ❌未掌握 (1次) [重置]  │
│     Q003 [L3] ⏰7天前 [重置]         │
│                                     │
│ M04 指对数运算                       │
│   ...                               │
└─────────────────────────────────────┘
```

---

## 预期效果

1. **清空任务不影响历史**：出题记录独立存储
2. **避免短期重复**：优先选择未出过的题
3. **支持重置**：用户可手动重置某道题
4. **遗忘曲线**：做对的题7天后可复习
5. **错题优先**：做错的题优先再次出现
