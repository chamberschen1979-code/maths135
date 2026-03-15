# 数据结构重构计划：sub_targets 与变例映射

## 一、当前问题诊断

### 发现的核心BUG

**训练答题后变例状态灯不变绿的原因：**

1. **TrainingView.jsx 没有传递 `masteredSubId` 参数**
   ```javascript
   // 当前代码（第315行）
   onBattleComplete({
     targetId: target.target_id,
     eloChange: finalEloChange,
     newHealthStatus,
     grade,
     // ❌ 缺少 masteredSubId 和 practicedSubId
   })
   ```

2. **eloEngine.js 的 `processPracticeResult` 函数从未被调用**
   - 该函数实现了"连续3次正确变绿"的逻辑
   - 但 TrainingView.jsx 和 App.jsx 都没有使用它

3. **当前流程断裂**
   ```
   训练答题 → TrainingView.jsx → onBattleComplete（无masteredSubId）
                                        ↓
                              App.jsx → updateTargetData
                                        ↓
                              masteredSubId 为 null → is_mastered 不更新
   ```

### 应有的正确流程
```
训练答题 → 获取当前变例的 sub_id
     ↓
连续正确计数 → consecutive_correct++
     ↓
连续3次正确 → is_mastered = true（变绿）
     ↓
更新 tacticalData → 知识图谱显示绿色状态灯
```

## 二、修复方案（无需重构数据结构）

### 方案：修复训练流程，正确调用 eloEngine

**修改 TrainingView.jsx：**
1. 获取当前训练的变例对应的 `sub_id`
2. 追踪 `consecutive_correct` 连续正确次数
3. 调用 `eloEngine.processPracticeResult()` 处理结果
4. 传递 `masteredSubId` 给 `onBattleComplete`

**修改 App.jsx：**
1. 使用 `eloEngine.processPracticeResult()` 更新 sub_targets
2. 正确处理连续正确计数和状态变更

## 三、风险评估

### 低风险
| 修改项 | 风险 | 说明 |
|--------|------|------|
| TrainingView.jsx | 低 | 只是添加参数传递 |
| App.jsx | 低 | 使用已有的 eloEngine 函数 |

### 需要注意
| 问题 | 解决方案 |
|------|----------|
| 如何确定当前训练的变例对应的 sub_id？ | 需要建立变例到 sub_target 的映射 |
| sub_targets 与变例不是一对一 | 按等级聚合，一个变例对应多个 sub_targets |

## 四、实施步骤

### 第一步：修复训练流程
1. 在 TrainingView.jsx 中追踪当前训练的变例
2. 调用 eloEngine.processPracticeResult()
3. 传递 masteredSubId 给 onBattleComplete

### 第二步：验证
1. 连续答对3次同一变例的题目
2. 检查知识图谱该变例的状态灯是否变绿

## 五、关于数据结构重构的建议

**当前不需要重构数据结构**，因为：
1. 核心问题是代码流程断裂，不是数据结构问题
2. eloEngine 已经实现了正确的逻辑
3. 只需要正确调用即可

**如果未来需要精确追踪每个变例**，再考虑扩展 sub_targets 结构。
