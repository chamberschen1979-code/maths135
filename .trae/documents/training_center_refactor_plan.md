# 列表模块重构计划 - 训练任务中心

## 一、需求分析

### 1. 核心洞察

**知识图谱 vs 列表页的定位区分**：

| 维度 | 知识图谱 (战略层) | 列表页 (战术层) |
|------|------------------|----------------|
| 用户心智 | "我在哪？强弱项分布？" | "我今天该练什么？" |
| 信息密度 | 宏观、模糊、趋势 | 微观、精确、状态 |
| 交互目标 | 浏览、分析 | 点击、开始训练、修复 |
| 核心价值 | 状态概览 | 行动指引 |

### 2. 存在意义

**必须保留**，但要从"静态列表"转变为"动态任务管理中心"。

关键价值：
- 展示熔断警告（为什么不能做题）
- 展示连击进度（还差几次通关）
- 推荐下一步（减少决策成本）

---

## 二、重构方案

### 1. 页面重命名

- 当前：`知识图谱` → `列表视图`
- 新名称：`训练中心` 或 `我的进度`

### 2. 四大板块设计

#### 板块A：紧急修复区 (Critical Alerts)

**触发条件**：`isHighLevelLocked === true` 或 L2状态为RED

**显示内容**：
```
⚠️ 检测到基础能力退化
[导数] 专项 - 母题 "切线方程" L2 节点熔断 🔴
[按钮] 立即进行 L2 修复训练 (需连对 3 题解封)
```

**数据来源**：
- `eloEngine.evaluateSubmission()` 返回的 `qualification.isHighLevelLocked`
- `qualification.l2Status === 'RED'`

#### 板块B：今日推荐 (Next Up)

**推荐逻辑**：
1. 差1-2次连击就能通关的变例（`motifStreak >= 1`）
2. ELO接近下一级阈值的母题

**显示内容**：
```
⚡ 即将通关
[数列] 母题 "求和公式" 变例2 - 再对 1 题即可通关 🟢
[按钮] 继续训练
```

#### 板块C：全量进度看板 (Progress Tree)

**层级结构**：专项 → 母题 → 变例

**显示内容**：
```
📁 专项：函数与导数 (掌握度 60%)
  📘 母题：单调性讨论 (ELO 1600)
    变例 01: 🟢 通关 (连击 5)
    变例 02: 🔴 进行中 (连击 1/3) - [继续训练]
    变例 03: 🔒 锁定 (L2基础不牢)
```

**状态图标**：
- 🟢 已通关
- 🔴 进行中（未通关）
- 🔒 锁定（熔断状态）
- ⚠️ 警告（连击即将重置）

#### 板块D：数据概览 (Mini Stats)

**顶部状态栏**：
```
当前等级: L3 (ELO 1850) | 待修复项: 2 个 (🔴) | 即将通关: 3 个 (⚡)
```

---

## 三、数据结构

### 1. 专项数据结构

```javascript
{
  specId: 'V1',
  specName: '导数切线专项',
  progress: 0.6,  // 掌握度
  hasMeltdown: true,  // 是否有熔断项
  motifs: [
    {
      motifId: 'M11',
      motifName: '导数工具基础',
      elo: 1600,
      level: 'L2',
      variants: [
        {
          varId: '1.1',
          varName: '求曲线"过"某点的切线',
          status: 'mastered',  // mastered | in_progress | locked
          streak: 5,
          isLocked: false
        }
      ]
    }
  ]
}
```

### 2. 状态计算逻辑

```javascript
// 计算专项掌握度
const calculateSpecProgress = (motifs) => {
  const allVariants = motifs.flatMap(m => m.variants);
  const mastered = allVariants.filter(v => v.status === 'mastered').length;
  return mastered / allVariants.length;
};

// 检测熔断项
const detectMeltdown = (motifs) => {
  return motifs.some(m => 
    m.variants.some(v => v.isLocked || v.l2Status === 'RED')
  );
};

// 推荐训练
const recommendNext = (motifs) => {
  return motifs
    .flatMap(m => m.variants.map(v => ({ ...v, motifId: m.motifId, motifName: m.motifName })))
    .filter(v => v.streak >= 1 && v.streak < 3 && !v.isLocked)
    .sort((a, b) => b.streak - a.streak);
};
```

---

## 四、实施步骤

### Phase 1：数据层准备

1. 创建 `useTrainingCenterData` Hook
2. 实现专项/母题/变例的层级数据聚合
3. 实现状态计算逻辑（熔断检测、推荐算法）

### Phase 2：UI组件开发

1. 创建 `CriticalAlertsPanel.jsx` - 紧急修复区
2. 创建 `RecommendedNextPanel.jsx` - 今日推荐
3. 创建 `ProgressTree.jsx` - 全量进度看板
4. 创建 `MiniStatsBar.jsx` - 数据概览

### Phase 3：页面整合

1. 重构 `TacticalDashboard.jsx`
2. 添加Tab切换（紧急 | 推荐 | 全部）
3. 实现筛选和排序功能

### Phase 4：交互优化

1. 点击变例直接进入训练
2. 熔断项一键进入修复训练
3. 状态实时更新

---

## 五、与现有系统的结合

### 1. 使用已有的双轨制数据

| 现有字段 | 用途 |
|---------|------|
| `qualification.isHighLevelLocked` | 紧急修复区显示 |
| `qualification.l2Status` | L2状态灯 |
| `qualification.motifStreak` | 连击进度显示 |
| `qualification.l2RemediationStreak` | 解封进度显示 |

### 2. 使用已有的Elo数据

| 现有字段 | 用途 |
|---------|------|
| `elo_score` | ELO分数显示 |
| `gear_level` | 等级显示 |
| `sub_targets.is_mastered` | 变例通关状态 |

---

## 六、风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 数据聚合复杂度高 | 性能问题 | 使用 useMemo 缓存计算结果 |
| 层级过深导致UI复杂 | 用户困惑 | 默认折叠，按需展开 |
| 与知识图谱功能重叠 | 定位模糊 | 明确区分：图谱=概览，列表=行动 |

---

## 七、待确认问题

1. **页面名称**：使用"训练中心"还是"我的进度"？
2. **默认Tab**：打开时默认显示"紧急"还是"推荐"？
3. **专项数据来源**：是否需要新建专项数据文件，还是从现有母题数据聚合？

---

## 八、总结

这个重构建议非常合理，核心价值在于：

1. **行动导向**：告诉用户"现在该做什么"
2. **状态透明**：清晰展示熔断、锁定、连击进度
3. **减少决策成本**：推荐算法自动排序优先级

建议按计划实施，将列表页从"静态展示"转变为"动态任务管理中心"。
