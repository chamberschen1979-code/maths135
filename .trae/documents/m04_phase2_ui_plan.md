# M04 动态防御与生长机制 - 第二阶段实施计划

## 📋 概述

本阶段主要完成 UI 层面的开发，包括冷却状态可视化和错题人工入库功能。

---

## 🎯 核心目标

1. **冷却状态可视化**：在错题列表中显示冷却进度
2. **错题人工入库**：提供 UI 录入界面，支持手动添加新题目

---

## 📁 需要修改/创建的文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/weekly/ErrorSection.jsx` | 修改 | 显示冷却倒计时 |
| `src/components/weekly/ManualEntryModal.jsx` | 新建 | 错题入库悬浮组件 |
| `src/utils/questionStateManager.js` | 修改 | 添加用户题库管理函数 |
| `src/context/UserProgressContext.jsx` | 修改 | 添加 addToUserPool 方法 |

---

## 🔧 详细实施步骤

### 第一步：修改 ErrorSection.jsx - 可视化冷却进度

**修改内容**：

1. **导入冷却状态工具函数**：
```javascript
import { getCooldownRemainingDays, isInCooldown } from '../../utils/questionStateManager';
```

2. **修改错题显示逻辑**：
```javascript
// 在错题列表中，对每个错题检查冷却状态
const motifErrors = errorNotebook?.filter(e => e.targetId === motif.motifId && !e.resolved) || [];
const latestError = motifErrors.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
const questionId = latestError?.id;
const inCooldown = questionId ? isInCooldown(questionId) : false;
const remainingDays = questionId ? getCooldownRemainingDays(questionId) : 0;
```

3. **显示冷却标签**：
```jsx
{inCooldown && (
  <div className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded">
    <span>❄️</span>
    <span>冷却中（还剩 {remainingDays} 天）</span>
  </div>
)}
```

---

### 第二步：更新 questionStateManager.js - 添加用户题库管理

**新增函数**：

```javascript
/**
 * 获取用户添加的题库
 */
export const getUserAddedPool = () => {
  const progress = getUserProgress();
  return progress.user_added_pool || [];
};

/**
 * 添加用户录入的题目
 */
export const addToUserPool = (question) => {
  const progress = getUserProgress();
  
  if (!progress.user_added_pool) {
    progress.user_added_pool = [];
  }
  
  progress.user_added_pool.push(question);
  saveUserProgress(progress);
  
  console.log(`[User Pool] 题目 ${question.id} 已添加到用户题库`);
  return true;
};
```

---

### 第三步：创建 ManualEntryModal.jsx - 错题入库悬浮组件

**组件功能**：
- 录入题目、答案、解析要点
- 选择难度等级（L2/L3/L4）
- 自动生成 `USER_ADD_` 前缀的 ID
- 自动继承变例信息

**ID 生成逻辑**：
```javascript
const generateId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `USER_ADD_${motifId}_${timestamp}`;
};
```

---

### 第四步：更新 UserProgressContext.jsx

**新增方法**：
```javascript
const handleAddToUserPool = useCallback((question) => {
  addToUserPool(question);
  // 刷新状态...
}, []);
```

---

### 第五步：在 WeeklyMissionNew.jsx 中集成入库入口

**添加入口按钮和弹窗**：
```jsx
<button onClick={() => setShowEntryModal(true)}>
  📥 录入新题
</button>

<ManualEntryModal
  isOpen={showEntryModal}
  onClose={() => setShowEntryModal(false)}
  motifId={selectedMotif?.motifId}
  specId={selectedMotif?.specId}
  varId={selectedMotif?.varId}
  motifName={selectedMotif?.motifName}
/>
```

---

## 📊 UI 效果预览

### 冷却状态显示

```
┌─────────────────────────────────────────────┐
│ 待消灭错题                                    │
├─────────────────────────────────────────────┤
│ 指对数函数与运算 L3                           │
│ ❄️ 冷却中（还剩 7 天）                        │
│                                              │
│ 三角函数基础 L2                              │
│                                              │
│ 解三角形综合 L4                              │
│ ❄️ 冷却中（还剩 12 天）                       │
└─────────────────────────────────────────────┘
```

### 错题入库弹窗

```
┌─────────────────────────────────────┐
│ 📥 错题入库                          │
├─────────────────────────────────────┤
│ 题目：                              │
│ [多行文本框]                         │
│                                     │
│ 答案：                              │
│ [文本框]                            │
│                                     │
│ 解析要点（每行一个）：               │
│ [多行文本框]                         │
│                                     │
│ 难度：[L2] [L3●] [L4]               │
│                                     │
│ 所属变例：指对数函数与运算 · V1.1    │
│                                     │
│           [取消] [确认入库]          │
└─────────────────────────────────────┘
```

---

## ⏱️ 预估工作量

| 步骤 | 预估时间 |
|------|----------|
| 第一步：修改 ErrorSection.jsx | 20 分钟 |
| 第二步：更新 questionStateManager.js | 15 分钟 |
| 第三步：创建 ManualEntryModal.jsx | 40 分钟 |
| 第四步：更新 UserProgressContext.jsx | 10 分钟 |
| 第五步：集成入库入口 | 15 分钟 |
| 测试与调试 | 30 分钟 |
| **总计** | **约 2 小时** |

---

## ✅ 验收标准

1. **冷却状态显示**：
   - 冷却中的错题显示"❄️ 冷却中（还剩 X 天）"
   - 非冷却错题正常显示

2. **错题入库功能**：
   - 可以录入题目、答案、解析要点
   - 可以选择难度等级
   - 自动生成 `USER_ADD_` 前缀的 ID
   - 自动继承变例信息

3. **数据持久化**：
   - 用户录入的题目保存在 localStorage
   - 刷新页面后数据保持

---

## 🔄 与第一阶段的关系

| 阶段 | 内容 | 状态 |
|------|------|------|
| 第一阶段 | 核心引擎建设 | ✅ 已完成 |
| 第二阶段 | UI 与增量入库 | 📝 本计划 |

第二阶段依赖第一阶段提供的工具函数：
- `getCooldownRemainingDays()` - 显示冷却倒计时
- `isInCooldown()` - 判断冷却状态
- `addToUserPool()` - 添加用户题目
