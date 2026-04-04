# M04 动态防御与生长机制实施计划

## 📋 概述

本计划旨在实现"做对即冻结、做错入循环"的智能题目管理机制，确保学生每一分钟都在练习"生题"，最大化提分效率。

***

## 🎯 核心目标

1. **做对即冻结 (Mastery Freeze)**：做对的题目不再重复出现（L4 需两次做对）
2. **做错入循环 (Error Loop)**：做错的题目进入冷却循环，14天后重新出现
3. **横向迁移 (Horizontal Migration)**：当题目耗尽时自动从同难度其他变例选取
4. **错题人工入库 (Manual Seed Capture)**：新错题需人工确认才能入库，使用特殊 ID 前缀

***

## 📁 需要修改/创建的文件

| 文件                                       | 操作 | 说明                                                                 |
| ---------------------------------------- | -- | ------------------------------------------------------------------ |
| `src/context/UserProgressContext.jsx`    | 新建 | 用户进度上下文，管理 mastered\_pool、weak\_point\_buffer、l4\_mastery\_counter |
| `src/utils/questionStateManager.js`      | 新建 | 题目状态管理工具函数                                                         |
| `src/utils/problemLogic.js`              | 修改 | 在 selectQuestionFromPool 中添加过滤逻辑                                   |
| `src/components/WeeklyMissionNew.jsx`    | 修改 | 在判题后更新题目状态                                                         |
| `src/App.jsx`                            | 修改 | 添加 UserProgressContext Provider                                    |
| `src/components/weekly/ErrorSection.jsx` | 修改 | 显示冷却中的错题                                                           |

***

## 🔧 详细实施步骤

### 第一步：创建题目状态管理工具 (questionStateManager.js)

**功能**：

* `getMasteredPool()` - 获取已掌握题目列表

* `addToMasteredPool(questionId)` - 添加到已掌握池

* `getWeakPointBuffer()` - 获取错题缓冲区

* `addToWeakPointBuffer(questionId, level, motifId)` - 添加到错题缓冲区（带时间戳）

* `isInCooldown(questionId)` - 检查题目是否在冷却期（14天）

* `getL4MasteryCounter()` - 获取 L4 题目的做对计数

* `incrementL4Mastery(questionId)` - L4 题目做对计数 +1

* `checkL4Mastered(questionId)` - 检查 L4 题目是否达到两次做对

**数据结构**：

```javascript
// localStorage 存储结构
{
  mastered_pool: ['M04_V1_1.1_L2_SEED_001', 'M04_V1_1.1_L2_SEED_002'],
  weak_point_buffer: {
    'M04_V1_1.1_L2_SEED_003': {
      addedAt: '2024-01-15T10:30:00Z',
      level: 'L2',
      motifId: 'M04',
      cooldownDays: 14
    }
  },
  // 🔥 新增：L4 难度的做对计数器
  l4_mastery_counter: {
    'M04_V1_1.1_L4_SEED_001': {
      count: 1,
      lastCorrectAt: '2024-01-15T10:30:00Z'
    }
  }
}
```

***

### 第二步：创建用户进度上下文 (UserProgressContext.jsx)

**功能**：

* 提供 `masteredPool`、`weakPointBuffer`、`l4MasteryCounter` 状态

* 提供 `markAsMastered(questionId, level)` 方法（L2/L3 直接加入，L4 需检查计数）

* 提供 `markAsWeak(questionId, level, motifId)` 方法

* 自动持久化到 localStorage

***

### 第三步：修改 selectQuestionFromPool 函数 (problemLogic.js)

**修改位置**：`src/utils/problemLogic.js` 第 382 行附近

**修改内容**：

```javascript
/**
 * 过滤可用题目（使用 ID 匹配，避免字段不一致问题）
 */
export const filterAvailableSeeds = (originalPool, userProgress) => {
  const { masteredPool = [], weakPointBuffer = {} } = userProgress;
  const now = new Date();

  return originalPool.filter(seed => {
    // 1. 排除已掌握（使用 ID 匹配）
    if (masteredPool.includes(seed.id)) return false;
    
    // 2. 排除冷却中
    const errorRecord = weakPointBuffer[seed.id];
    if (errorRecord) {
      const addedDate = new Date(errorRecord.addedAt);
      const diffDays = (now - addedDate) / (1000 * 60 * 60 * 24);
      if (diffDays < (errorRecord.cooldownDays || 14)) return false;
    }
    
    return true;
  });
};

/**
 * 选择题目（带横向迁移）
 */
const selectQuestionFromPool = (motifData, targetLevel, problemIndex, userProgress = {}) => {
  // 获取该难度的所有题目
  const allQuestions = extractQuestionsByLevel(motifData, targetLevel)
  
  // 过滤掉已掌握和冷却中的题目
  const available = filterAvailableSeeds(allQuestions, userProgress)
  
  if (available.length === 0) {
    console.log('⚠️ 当前难度题目已耗尽，启动横向迁移逻辑...')
    return triggerHorizontalMigration(motifData, targetLevel, userProgress)
  }
  
  // 按 problemIndex 选择题目
  return available[problemIndex % available.length]
}
```

***

### 第四步：修改判题逻辑 (WeeklyMissionNew\.jsx)

**修改位置**：`src/components/WeeklyMissionNew.jsx` 第 1012 行附近（handleSubmitAnswer 函数）

**修改内容**：

```javascript
// 在判题结果出来后更新题目状态
const questionId = task.benchmark?.id || task.id
const questionLevel = task.targetLevel || task.level

if (aiResult.isCorrect) {
  // 做对处理
  if (questionLevel === 'L4') {
    // 🔥 L4 难度：需要累计做对两次才冻结
    const mastered = incrementL4Mastery(questionId)
    if (mastered) {
      console.log(`[Mastery Freeze] L4 题目 ${questionId} 已冻结（累计做对 2 次）`)
    } else {
      console.log(`[L4 进度] 题目 ${questionId} 做对 1 次，需再做对 1 次才能冻结`)
    }
  } else {
    // L2/L3 难度：一次做对即冻结
    markAsMastered(questionId)
    console.log(`[Mastery Freeze] 题目 ${questionId} 已冻结`)
  }
} else {
  // 做错：添加到错题缓冲区
  markAsWeak(questionId, questionLevel, task.motifId)
  console.log(`[Error Loop] 题目 ${questionId} 已进入冷却循环`)
}
```

***

### 第五步：实现横向迁移逻辑 (triggerHorizontalMigration)

**功能**：

* **仅横向迁移**：从同母题的其他变例（Specialty/Variation）中选取同难度题目

* **不进行纵向迁移**：不自动升级或降级难度

* **支持编外题目**：识别 USER\_ADD\_ 前缀的人工入库题目

**代码结构**：

```javascript
const triggerHorizontalMigration = (motifData, targetLevel, userProgress) => {
  const { masteredPool = [], weakPointBuffer = {} } = userProgress
  
  // 1. 尝试横向迁移：同难度其他变例
  const sameLevelOtherVariations = getOtherVariationsQuestions(motifData, targetLevel, userProgress)
  if (sameLevelOtherVariations.length > 0) {
    console.log('[横向迁移] 从其他变例选取题目')
    return sameLevelOtherVariations[0]
  }
  
  // 2. 降级：从冷却池中选取最早冷却的题目
  const cooledQuestions = getCooledQuestions(weakPointBuffer)
  if (cooledQuestions.length > 0) {
    console.log('[复练模式] 选取冷却期结束的错题')
    return cooledQuestions[0]
  }
  
  // 3. 最终降级：提示用户该母题已完成
  console.log('[提示] 该母题所有题目已完成，建议选择其他母题')
  return null
}

/**
 * 获取其他变例的同难度题目（包括编外题目）
 */
const getOtherVariationsQuestions = (motifData, targetLevel, userProgress) => {
  const allQuestions = []
  
  // 遍历所有 specialties 和 variations
  for (const spec of motifData.specialties || []) {
    for (const variation of spec.variations || []) {
      // 获取该变例下目标难度的题目
      const questions = variation.original_pool?.filter(q => 
        q.level === targetLevel
      ) || []
      allQuestions.push(...questions)
    }
  }
  
  // 🔥 过滤掉已掌握和冷却中的题目
  return filterAvailableSeeds(allQuestions, userProgress)
}
```

***

### 第六步：修改 App.jsx 添加 Provider

**修改内容**：

```javascript
import { UserProgressProvider } from './context/UserProgressContext'

// 在 App 组件中包裹 Provider
<UserProgressProvider>
  <WeeklyMissionNew
    // ... 其他 props
    userProgress={userProgress}
    onMarkMastered={markAsMastered}
    onMarkWeak={markAsWeak}
  />
</UserProgressProvider>
```

***

### 第七步：修改 ErrorSection 显示冷却状态

**新增功能**：

* 显示冷却中的错题

* 显示冷却剩余天数

* 区分"待消灭错题"和"冷却中错题"

***

### 第八步：错题人工入库接口

**功能**：

* 提供 UI 入口，让用户/教研员手动选择错题入库

* 入库时需填写 `problem`、`answer`、`key_points` 字段

* **使用特殊 ID 前缀**：`USER_ADD_M04_001`、`USER_ADD_M04_002`...

* **继承变例信息**：自动继承该变例的 `var_id`、`spec_id`

* **默认 meta 标签**：标记为 `source: 'user_added'`，在横向迁移时作为"编外队员"

**数据结构**：

```javascript
{
  id: 'USER_ADD_M04_001',  // 🔥 特殊前缀
  source: 'user_added',
  problem: '用户输入的题目内容',
  answer: '用户输入的答案',
  key_points: ['要点1', '要点2'],
  level: 'L3',
  spec_id: 'V1',           // 继承自当前变例
  var_id: '1.1',           // 继承自当前变例
  addedAt: '2024-01-15T10:30:00Z',
  addedBy: 'user'          // 或 'teacher'
}
```

**UI 设计**：

```
┌─────────────────────────────────────┐
│ 📥 错题入库                          │
├─────────────────────────────────────┤
│ 题目：[文本输入框]                    │
│ 答案：[文本输入框]                    │
│ 解析要点：[多行文本框]                │
│ 难度：[L2] [L3] [L4]                 │
│ 所属变例：V1.1 复合运算与指对转化     │
│                                     │
│ [取消] [确认入库]                     │
└─────────────────────────────────────┘
```

***

## 📊 数据流图

```
用户答题
    ↓
AI 判题
    ↓
┌─────────────────────────────────────────────┐
│  判题结果                                    │
├──────────────┬──────────────────────────────┤
│   Correct    │           Wrong              │
│      ↓       │              ↓               │
│ ┌──────────┐ │    weak_point_buffer         │
│ │ L2/L3?   │ │    (14天冷却)                │
│ ├────┬─────┤ │                              │
│ │Yes │ No  │ │                              │
│ │ ↓  │  ↓  │ │                              │
│ │冻结│L4计数│ │                              │
│ │    │+1   │ │                              │
│ │    │ ↓   │ │                              │
│ │    │≥2次?│ │                              │
│ │    ├─────┤ │                              │
│ │    │Yes │ │                              │
│ │    │ ↓  │ │                              │
│ │    │冻结│ │                              │
│ └────┴─────┘ │                              │
└──────────────┴──────────────────────────────┘
                    ↓
         下次出题时过滤
                    ↓
         selectQuestionFromPool
                    ↓
         ┌─────────────────────┐
         │ 可用题目 > 0?       │
         ├─────────┬───────────┤
         │   Yes   │    No     │
         │    ↓    │     ↓     │
         │ 返回题目│ 横向迁移   │
         │         │ (同难度)   │
         └─────────┴───────────┘
```

***

## ⏱️ 预估工作量

| 步骤                             | 预估时间       |
| ------------------------------ | ---------- |
| 第一步：创建 questionStateManager.js | 40 分钟      |
| 第二步：创建 UserProgressContext.jsx | 25 分钟      |
| 第三步：修改 problemLogic.js         | 35 分钟      |
| 第四步：修改 WeeklyMissionNew\.jsx   | 25 分钟      |
| 第五步：实现横向迁移逻辑                   | 35 分钟      |
| 第六步：修改 App.jsx                 | 10 分钟      |
| 第七步：修改 ErrorSection            | 20 分钟      |
| 第八步：错题人工入库 UI                  | 50 分钟      |
| 测试与调试                          | 40 分钟      |
| **总计**                         | **约 4 小时** |

***

## ✅ 验收标准

1. **做对冻结**：

   * L2/L3：做对的题目在后续任务中不再出现

   * L4：需要累计做对两次（不同时间）才冻结
2. **做错冷却**：做错的题目进入 14 天冷却期
3. **冷却复练**：冷却期结束后题目可重新出现
4. **横向迁移**：题目耗尽时自动从其他变例选取同难度题目
5. **不纵向迁移**：不自动升级或降级难度
6. **人工入库**：

   * 错题需人工确认才能入库

   * 使用 `USER_ADD_` 前缀

   * 继承变例信息（var\_id、spec\_id）

   * 在横向迁移中作为"编外队员"参与
7. **数据持久化**：刷新页面后状态保持
8. **日志完整**：关键操作有清晰的日志输出
9. **ID 匹配**：过滤逻辑使用 ID 匹配，避免字段不一致问题

***

## 🔄 后续扩展

1. **外部错题上传接口**：预留 API 接口，支持从周测、月考导入错题（需人工确认）
2. **学习曲线分析**：统计用户在各难度的掌握进度
3. **智能推荐**：根据用户薄弱点推荐母题
4. **L4 难度调整**：可根据实际数据调整 L4 的冻结阈值（如改为 3 次）

