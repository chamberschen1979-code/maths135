# 杀手锏模块重构与三大流程整合计划

## 方案评估

### ✅ 合理性确认

1. **删除"每日训练"**
   - 当前代码中没有 DailyTraining 组件，无需删除
   - 首页没有打卡/连胜入口，无需隐藏
   - **结论：无需操作**

2. **改造杀手锏模块**
   - 现有：`CertificationExam.jsx` 只有认证考试
   - 缺失：要点解析 (Learn) 步骤
   - **结论：需要实现**

3. **三大流程连接**
   - 错题诊断 → 推荐杀手锏：部分实现
   - 杀手锏认证 → 每周任务：已实现 weaponId 注入
   - 每周任务 → 打印：已有 PrintPreview 组件
   - **结论：需要增强连接**

4. **预留模拟考试接口**
   - 导航栏可增加入口
   - 数据结构需预留
   - **结论：可行**

### ⚠️ 需要注意的问题

1. **数据结构**
   - `strategy_lib.json` 已有 `certification` 字段
   - 需要增加 `learnContent` 字段存储要点解析
   - 需要增加 `hasLearned` 用户状态

2. **学习内容来源**
   - 当前 `logic_flow` 和 `description` 可作为基础
   - 需要扩展为完整的学习模块

## 实施计划

### Step 1: 扩展杀手锏数据结构

**文件**: `src/data/strategy_lib.json`

为每个杀手锏增加 `learnContent` 字段：

```json
{
  "id": "S-SET-01",
  "name": "空集陷阱自动检测",
  "learnContent": {
    "coreLogic": "见到 A ⊆ B，先想空集，再想非空",
    "scenarios": [
      "题干出现 A ⊆ B 且未说明 A 非空",
      "求参数范围时涉及集合包含关系",
      "题目隐含集合可能为空的条件"
    ],
    "pitfalls": [
      "直接假设集合非空进行运算",
      "未讨论空集直接解不等式"
    ],
    "exampleQuestion": "已知集合 A = {x | x² - ax + b = 0}，若 A ⊆ {1, 2}，求 a, b 的值。",
    "exampleSolution": "① 当 A = ∅ 时，Δ = a² - 4b < 0...\n② 当 A ≠ ∅ 时..."
  },
  "certification": { ... }
}
```

### Step 2: 创建要点解析组件

**文件**: `src/components/strategy/LearnContent.jsx`

功能：
- 展示核心逻辑（一句话）
- 展示使用场景（列表）
- 展示避坑指南（列表）
- 展示经典例题（只读）
- 底部按钮："我已掌握，去认证"

### Step 3: 改造认证流程

**文件**: `src/components/strategy/CertificationExam.jsx`

改造：
- 新增 `mode` 状态：`learn` | `certify`
- 默认进入 `learn` 模式
- 完成学习后才能进入 `certify` 模式
- 记录 `hasLearned` 状态到 localStorage

### Step 4: 更新 KillerMoveCard

**文件**: `src/components/strategy/KillerMoveCard.jsx`

改造：
- 显示学习状态（未学习/已学习/已认证）
- 点击卡片进入学习页面（而非直接考试）
- 认证通过后显示徽章

### Step 5: 增强错题诊断推荐

**文件**: `src/components/DiagnosisView.jsx`

改造：
- 诊断结果中增加"推荐学习杀手锏"按钮
- 点击跳转到对应杀手锏的学习页面
- 传递 `fromDiagnosis=true` 标记

### Step 6: 预留模拟考试接口

**文件**: `src/components/Navigation.jsx`

改造：
- 增加"期末冲刺"入口（置灰 + Coming Soon）
- 预留 `examPaper` 数据类型

### Step 7: 数据持久化

**文件**: `src/utils/weaponProgress.js`

功能：
- 记录学习状态：`hasLearned`
- 记录认证状态：`certified`, `certifiedDate`
- 记录练习次数：`practiceCount`

## 用户故事线验证

### 周五晚：错题诊断
```
小明打开 APP → 点击"错题诊断" → 拍照上传 → 
系统分析："集合参数范围出错" → 
显示"推荐学习杀手锏【空集讨论法】"按钮 → 
点击跳转到学习页面
```

### 周六下午：学习认证
```
小明进入杀手锏页面 → 阅读"要点解析"(3分钟) → 
点击"我已掌握，去认证" → 进入考试 → 
做3道题全对 → 获得徽章 → 
系统记录：S-SET-01 已认证
```

### 周日晚：生成任务
```
小明打开"每周任务" → 
系统显示："基于你的错题和新掌握的【空集讨论法】，已生成专属任务单" → 
点击"打印/导出" → 放入书包
```

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/data/strategy_lib.json` | 修改 | 增加 learnContent 字段 |
| `src/components/strategy/LearnContent.jsx` | 新建 | 要点解析组件 |
| `src/components/strategy/CertificationExam.jsx` | 修改 | 增加学习模式 |
| `src/components/strategy/KillerMoveCard.jsx` | 修改 | 显示学习状态 |
| `src/pages/StrategyHub.jsx` | 修改 | 传递学习状态 |
| `src/components/DiagnosisView.jsx` | 修改 | 增加推荐杀手锏按钮 |
| `src/components/Navigation.jsx` | 修改 | 预留模拟考试入口 |
| `src/utils/weaponProgress.js` | 新建 | 学习进度持久化 |

## 预估工作量

- Step 1-2: 扩展数据结构 + 创建学习组件 (1小时)
- Step 3-4: 改造认证流程 + 更新卡片 (1小时)
- Step 5: 增强错题诊断推荐 (30分钟)
- Step 6-7: 预留接口 + 数据持久化 (30分钟)

**总计: 约3小时**
