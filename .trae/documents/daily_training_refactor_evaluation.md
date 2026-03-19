# "每日保温练"模块重构方案评估

## 方案概述

将 DailyTraining 模块重构为"智能保温练"，实现：
- 复习优先（艾宾浩斯遗忘曲线）
- 技能固化（杀手锏强化）
- 轻量高频（5分钟/3-5题）

## 现有代码结构分析

### 已有模块
| 模块 | 文件 | 功能 |
|------|------|------|
| 训练中心 | `TrainingCenter.jsx` | 学习进度、今日推荐 |
| 周任务 | `WeeklyMissionNew.jsx` | 每周任务生成与答题 |
| 错题本 | `errorNotebook` (state) | 错题记录 |
| 战术数据 | `tacticalData` (state) | 知识点进度、ELO分数 |
| 杀手锏库 | `strategy_lib.json` | 杀手锏数据 |

### 数据结构
```javascript
// tacticalData 结构
{
  tactical_maps: [{
    map_name: "代数区",
    encounters: [{
      target_id: "M01",
      target_name: "集合、逻辑与复数",
      elo_score: 1200,
      health_status: "bleeding",
      specialties: [...]
    }]
  }]
}

// errorNotebook 结构
[{
  id: "err_xxx",
  targetId: "M01",
  classification: { motifId, specialtyId },
  diagnosis: { suggestedWeapons: ["S-SET-01"] }
}]
```

## 方案评估

### ✅ 优点

1. **核心理念正确**
   - 艾宾浩斯遗忘曲线是科学的学习理论
   - 杀手锏强化符合"刻意练习"原则
   - 轻量高频符合习惯养成规律

2. **与现有系统互补**
   - 每周任务：突破新知
   - 每日训练：保鲜复习
   - 错题诊断：发现问题
   - 形成完整闭环

3. **数据复用度高**
   - 可复用 `tacticalData` 的 ELO 数据
   - 可复用 `errorNotebook` 的错题数据
   - 可复用 `strategy_lib` 的杀手锏数据
   - 可复用 `WeeklyMissionNew` 的题目生成逻辑

### ⚠️ 需要注意的问题

1. **数据结构缺失**
   - `knowledgeGraph` 不存在，需要从 `tacticalData` 转换
   - `weaponCertifications` 不存在，需要从 `tacticalData` 推断
   - `lastReviewedAt` 字段不存在，需要新增

2. **题目来源问题**
   - 当前系统依赖 AI 生成题目
   - 每日训练需要大量题目，AI 生成成本高
   - 建议：优先使用已有题库，或缓存生成的题目

3. **调度算法复杂度**
   - 艾宾浩斯算法需要精确的时间追踪
   - 需要考虑用户活跃度、时间段偏好

4. **UI/UX 工作量大**
   - 需要设计新的流式答题体验
   - 需要实现动效和反馈系统
   - 需要设计打卡和连胜机制

## 改进建议

### 1. 简化数据结构

不新建 `knowledgeGraph`，直接使用 `tacticalData`：

```javascript
// 从 tacticalData 提取复习节点
const getReviewNodes = (tacticalData) => {
  const nodes = [];
  tacticalData.tactical_maps.forEach(map => {
    map.encounters.forEach(enc => {
      if (enc.elo_score >= 1001 && enc.elo_score < 2500) {
        nodes.push({
          motifId: enc.target_id,
          motifName: enc.target_name,
          elo: enc.elo_score,
          lastPractice: enc.last_practice // 需要新增
        });
      }
    });
  });
  return nodes;
};
```

### 2. 简化调度逻辑

```javascript
// 简化版调度算法
export const generateDailyTasks = (tacticalData, errorNotebook) => {
  const tasks = [];
  
  // 1. 错题复习 (2题) - 最高优先级
  const unresolvedErrors = errorNotebook.filter(e => !e.resolved);
  // ...
  
  // 2. 低ELO知识点 (2题) - 需要巩固
  const weakNodes = getWeakNodes(tacticalData);
  // ...
  
  // 3. 杀手锏强化 (1题) - 本周学过的
  const recentWeapons = getRecentWeapons(tacticalData);
  // ...
  
  return tasks.slice(0, 5);
};
```

### 3. 复用现有组件

- 复用 `TaskDisplay` 的答题界面
- 复用 `AnswerInput` 的答案录入
- 复用 `judgeAnswerWithFallback` 的评分逻辑

### 4. 分阶段实施

**Phase 1: MVP**
- 基础调度算法
- 简单答题界面
- 打卡记录

**Phase 2: 增强**
- 艾宾浩斯算法
- 连胜机制
- 动效反馈

**Phase 3: 完善**
- 每日总结弹窗
- 数据分析
- 个性化推荐

## 实施计划

### Step 1: 创建核心调度算法 (dailyScheduler.js)
- 输入：tacticalData, errorNotebook
- 输出：dailyTasks 数组
- 逻辑：错题复习 + 低ELO巩固 + 杀手锏强化

### Step 2: 创建每日训练页面 (DailyTraining.jsx)
- 布局：顶部状态栏 + 进度环 + 题目卡片
- 交互：流式答题 + 即时反馈
- 样式：暖色调、轻量风格

### Step 3: 实现打卡机制
- localStorage 存储：dailyStreak, lastTrainingDate
- 连胜显示和激励

### Step 4: 创建每日总结弹窗 (DailySummaryModal.jsx)
- 战绩展示
- 熟练度更新
- 激励反馈

### Step 5: 集成到首页
- 入口按钮
- 红点提醒
- 数据持久化

## 结论

**方案整体合理**，但建议：

1. **简化数据结构**：不新建 knowledgeGraph，复用 tacticalData
2. **分阶段实施**：先 MVP，再增强
3. **复用现有代码**：减少重复开发
4. **控制题目生成成本**：优先使用缓存题目

预估工作量：
- Phase 1 (MVP): 2-3 小时
- Phase 2 (增强): 2-3 小时
- Phase 3 (完善): 1-2 小时
