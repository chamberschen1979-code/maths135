# 周度任务页面重构计划 v2

## 一、需求澄清

1. **错题来源**：包括每周任务、每日训练、导入的错题三种
2. **母题激活条件**：Elo >= 1001
3. **架构原则**：保持模块化，避免代码膨胀

## 二、架构设计原则

### 2.1 代码组织策略

**不将所有代码整合到 WeeklyMission.jsx**，而是采用以下架构：

```
src/components/
├── WeeklyMission.jsx          # 容器组件 (~200行)
│   └── 负责状态管理和布局
│
├── weekly/                    # 周度任务专用子组件目录
│   ├── TopicScopeCard.jsx     # 出题范围卡片 (~150行)
│   ├── ErrorSection.jsx       # 错题区组件 (~120行)
│   ├── CustomSection.jsx      # 自选区组件 (~100行)
│   ├── ReinforceSection.jsx   # 强化训练区组件 (~80行)
│   ├── TaskGenerator.jsx      # 生成任务模块 (~100行)
│   ├── TaskDisplay.jsx        # 任务展示区域 (~150行)
│   ├── AnswerInput.jsx        # 答案录入组件 (~120行)
│   └── PrintPreview.jsx       # 打印预览组件 (~100行)
│
├── TaskCard.jsx               # 复用现有组件
└── ...
```

### 2.2 代码行数预估

| 组件 | 预估行数 | 职责 |
|------|----------|------|
| WeeklyMission.jsx | ~200行 | 容器、状态管理、布局 |
| TopicScopeCard.jsx | ~150行 | 出题范围卡片容器 |
| ErrorSection.jsx | ~120行 | 错题区UI和逻辑 |
| CustomSection.jsx | ~100行 | 自选区UI和逻辑 |
| ReinforceSection.jsx | ~80行 | 强化训练区UI |
| TaskGenerator.jsx | ~100行 | 生成/打印任务按钮 |
| TaskDisplay.jsx | ~150行 | 任务展示区域 |
| AnswerInput.jsx | ~120行 | 答案录入（手工+扫描） |
| PrintPreview.jsx | ~100行 | 打印预览弹窗 |
| **总计** | **~1120行** | 分布在9个文件中 |

**对比**：如果全部整合到 WeeklyMission.jsx，可能超过 1500 行，难以维护。

## 三、页面结构设计

```
┌─────────────────────────────────────────────────────────────┐
│  📅 每周使命                                    [高三数学]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📋 出题范围 (TopicScopeCard)                         │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ 🔴 错题区 (ErrorSection)                     │   │   │
│  │  │ 来源：每周任务 + 每日训练 + 导入错题          │   │   │
│  │  │ [导入错题] [查看详情]                         │   │   │
│  │  │ ┌───┐ ┌───┐ ┌───┐ (母题卡片)                │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ 🔵 自选区 (CustomSection)                    │   │   │
│  │  │ [选择母题] (颗粒度：专项级别)                 │   │   │
│  │  │ ┌───┐ ┌───┐ (母题卡片)                       │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ 🟠 强化训练区 (ReinforceSection)             │   │   │
│  │  │ 自动选择Elo最低的2个激活母题                  │   │   │
│  │  │ ┌───┐ ┌───┐                                  │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🎯 生成任务 (TaskGenerator)                          │   │
│  │ [生成任务] [打印任务]                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📝 任务区域 (TaskDisplay)                            │   │
│  │  - 复用 TaskCard.jsx                                │   │
│  │  - 每题下方 [答案录入] 按钮                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 四、核心功能模块

### 4.1 错题区 (ErrorSection.jsx)

**错题来源**：
- `source: 'weekly'` - 来自每周任务
- `source: 'training'` - 来自每日训练
- `source: 'import'` - 外部导入的错题

**功能**：
1. **导入错题**：打开导入对话框，识别母题/专项/变例，只改状态灯不扣分
2. **查看详情**：展开显示所有错题列表
3. **母题卡片**：按母题分组展示，显示错题数量

### 4.2 自选区 (CustomSection.jsx)

**功能**：
1. 在激活母题（Elo >= 1001）中自由选择
2. 支持专项级别选择（如 M01-V1）
3. 排除已在错题区的母题（置灰不可选）

### 4.3 强化训练区 (ReinforceSection.jsx)

**功能**：
1. 自动选择 Elo 最低的 2 个激活母题
2. 排除已在错题区和自选区的母题
3. 顺延选择下一个最低分母题

### 4.4 生成任务 (TaskGenerator.jsx)

**功能**：
1. **生成任务**：调用 AI 生成题目（题干+解析+答案）
2. **打印任务**：生成可打印版本（只有题干+答题区，无解析）

### 4.5 答案录入 (AnswerInput.jsx)

**功能**：
1. 手工录入答案
2. 扫描录入（复用错题诊断的图片上传逻辑）
3. AI 诊断打分，更新 Elo 和状态灯

## 五、数据结构设计

### 5.1 扩展 errorNotebook 结构

```typescript
interface ErrorItem {
  id: string
  targetId: string           // 母题ID
  specId?: string            // 专项ID
  varId?: string             // 变例ID
  diagnosis: string          // 诊断信息
  level: string              // 难度等级
  source: 'import' | 'training' | 'weekly'  // 错题来源
  addedAt: string
  resolved: boolean
  resolvedAt?: string
  score?: number
}
```

### 5.2 新增 weeklyPlan 结构

```typescript
interface WeeklyPlan {
  // 错题区（自动计算）
  errorMotifs: string[]
  
  // 自选区
  selectedMotifs: Array<{
    motifId: string
    specId?: string
  }>
  
  // 强化训练区（自动计算）
  reinforcementMotifs: string[]
  
  // 生成的任务
  generatedTasks: Array<{
    id: string
    motifId: string
    specId?: string
    varId?: string
    problem: string
    analysis: string
    answer: string
    userAnswer?: string
    score?: number
    status: 'pending' | 'completed' | 'reviewed'
  }>
  
  weekStart: string
  weekEnd: string
}
```

## 六、实施步骤

### 阶段一：创建组件目录结构
1. 创建 `src/components/weekly/` 目录
2. 创建各子组件文件骨架

### 阶段二：数据层重构
1. 扩展 `errorNotebook` 数据结构
2. 重构 `weeklyPlan` 数据结构
3. 更新 App.jsx 中的状态管理

### 阶段三：子组件开发
1. 开发 `ErrorSection.jsx`
2. 开发 `CustomSection.jsx`
3. 开发 `ReinforceSection.jsx`
4. 开发 `TopicScopeCard.jsx`（整合上述三个组件）
5. 开发 `TaskGenerator.jsx`
6. 开发 `TaskDisplay.jsx`
7. 开发 `AnswerInput.jsx`
8. 开发 `PrintPreview.jsx`

### 阶段四：容器组件重构
1. 重构 `WeeklyMission.jsx`
2. 删除原有的"激活母题"、"总积分"卡片
3. 整合所有子组件

### 阶段五：测试与优化
1. 端到端测试
2. 性能优化
3. 打印样式调整

## 七、文件变更清单

| 文件 | 操作 | 预估行数 |
|------|------|----------|
| `src/components/WeeklyMission.jsx` | 重构 | ~200行 |
| `src/components/weekly/TopicScopeCard.jsx` | 新增 | ~150行 |
| `src/components/weekly/ErrorSection.jsx` | 新增 | ~120行 |
| `src/components/weekly/CustomSection.jsx` | 新增 | ~100行 |
| `src/components/weekly/ReinforceSection.jsx` | 新增 | ~80行 |
| `src/components/weekly/TaskGenerator.jsx` | 新增 | ~100行 |
| `src/components/weekly/TaskDisplay.jsx` | 新增 | ~150行 |
| `src/components/weekly/AnswerInput.jsx` | 新增 | ~120行 |
| `src/components/weekly/PrintPreview.jsx` | 新增 | ~100行 |
| `src/App.jsx` | 修改 | +50行 |

**总计新增代码**：约 970 行，分布在 8 个独立文件中

## 八、架构优势

1. **模块化**：每个组件职责单一，易于维护
2. **可复用**：子组件可在其他页面复用
3. **可测试**：每个组件可独立测试
4. **可扩展**：新增功能只需添加新组件
5. **避免膨胀**：主文件保持精简（~200行）

## 九、验收标准

1. ✅ 错题区正确展示三种来源的错题（每周任务、每日训练、导入）
2. ✅ 自选区支持专项级别选择，正确排除已在错题区的母题
3. ✅ 强化训练区自动选择 Elo 最低的激活母题（Elo >= 1001）
4. ✅ 生成任务功能正常，包含题干、解析、答案
5. ✅ 打印任务只显示题干和答题区，不显示解析
6. ✅ 答案录入支持手工和扫描两种方式
7. ✅ 诊断打分后正确更新 Elo 和状态灯
8. ✅ WeeklyMission.jsx 主文件不超过 250 行
