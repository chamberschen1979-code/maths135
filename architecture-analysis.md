# 「数学无忧」架构分析报告

> 生成日期：2026-05-01  
> 技术栈：React 19 + Vite 7 + Tailwind CSS 4 + KaTeX + Qwen AI

---

## 一、功能模块全景

### 1. 知识图谱 (TacticalDashboard)
17 个母题（M01-M17）的 ELO 等级可视化。每个母题下细分"专项(specialty) → 变例(variation) → 基准点(benchmark)"三层层级结构，用"装备等级(L1-L4)"和"健康状态(bleeding/healthy)"直观展示掌握程度。

### 2. 学习进度 (TrainingCenter)
基于用户当前装备等级，从题目库中筛选合适难度的母题供练习。支持选择不同专项和变例，内核接入"杀手锏(weapon)"系统进行定向训练。

### 3. 错题诊断 (DiagnosisView)
核心特色功能。用户上传错题图片 → AI 视觉识别 → 自动分类到对应母题/专项/变例 → 推荐适配的"杀手锏"解题方法 → 加入错题库。支持纯文字对话模式。

### 4. 方法工具 / 杀手锏系统 (StrategyHub)
数学解题方法的知识库（如"分离参数法"、"指对同构"等），每个杀手锏关联多个母题。支持学习、认证考试（AI 出题+AI 批改）流程。认证通过后记录到用户档案。

### 5. 每周任务 (WeeklyMissionNew)
综合错题库 + 用户勾选的母题 + ELO 最低兜底三项优先级，生成当周训练任务。每个母题出 3 道 AI 生成的变式题，学生作答后 AI 批改并更新 ELO。

### 6. 学情评估 (AssessmentModal)
首次使用的摸底测试。从评估题库抽取题目，完成后给出初始 ELO 和装备等级。两种模式：SmartAssessment（自适应出题）和 ManualSetup（手动对标）。

### 7. 用户管理 & 管理员面板
本地 localStorage 多用户系统。管理员可查看所有用户的学习进度、活动日志，管理用户的学情评估权限。

---

## 二、功能耦合关系

### 2.1 架构概览 — "中心辐射型" God Component

```
                    ┌──────────────┐
                    │   App.jsx     │  ← 1363 行，包含所有核心状态和逻辑
                    │ (God Component)│
                    └──────┬───────┘
          ┌────────┬──────┬──────┬────────┬────────┐
          ▼        ▼      ▼      ▼        ▼        ▼
     知识图谱  学习进度 错题诊断 方法工具 每周任务
     Dashboard Training Diagnosis Strategy Weekly
```

App.jsx 是绝对的中心节点，持有以下全部状态并通过 props 下传：
- `tacticalData` — 全局游戏化数据（17个母题的ELO、装备等级等）
- `errorNotebook` — 错题库
- `weeklyPlan` / `weeklyTasks` — 每周任务计划
- `questionHistory` — 题目历史记录
- `assessmentHistory` — 评估历史
- `messages` — AI 对话消息

### 2.2 数据流向

```
用户操作 → App.jsx handler → setState → props 传递给子组件
                                      → useEffect → localStorage 持久化
```

**关键耦合点：**

1. **tacticalData ↔ 所有模块**：仪表盘展示它，训练中心读取它来选题，每周任务用它生成任务列表并写回 ELO，AI 诊断后也更新它。这是全应用最核心的共享状态。

2. **errorNotebook ↔ 每周任务**：错题库是每周任务优先级最高的输入源，同时 AI 诊断也会写入错题库。

3. **questionHistory / questionStateManager ↔ 选题逻辑**：题目状态管理器（做对冻结、做错冷却）直接影响 dataLoader 中的选题行为。

4. **userManager / localStorage ↔ 全部数据**：所有持久化数据通过 `userManager.getData()` / `userManager.setData()` 走 localStorage，采用 `{prefix}_{version}_user_{username}_{dataType}` 的 key 命名。

### 2.3 数据存储耦合

持久化依赖 localStorage 的 key 命名约定：

```
存储 Key 模式                    →  使用者
──────────────────────────────────────────────────
maths_current_user              → userManager (当前登录用户)
maths_users                     → userManager (用户列表)
maths_v1_user_{name}_{type}     → userManager (用户级数据隔离)
user_question_progress          → questionStateManager (题目进度，无用户隔离!)
weapon_progress                 → weaponProgress (武器进度)
```

**问题：** `questionStateManager` 使用固定的 `user_question_progress` key，不支持多用户隔离，而 `userManager` 的数据使用带用户名的 key。两套存储方案并存。

---

## 三、核心算法

### 3.1 ELO 递阶系统

这是整个应用最核心的算法引擎，位于 `eloEngine.js` 和 `eloUtils.js`。

**等级定义（`benchmarkUtils.js`）：**
```
L1:   0 -  999  (入门)
L2: 1000 - 1799  (基础)
L3: 1800 - 2499  (进阶)
L4: 2500 - 3000  (压轴)
初始 ELO: L1=800, L2=1000, L3=1800, L4=2500
```

**ELO 升降规则（`eloEngine.js`）：**
```
答对加分：L1+20, L2+40, L3+60, L4+100
答错扣分：L1-10, L2-20, L3-30, L4-50
```

**装备等级判定（`benchmarkUtils.js` 的 `calculateGearLevelFromSpecialties`）：**
- L2 有任何一个 benchmark 是 RED → gear_level = L1
- L2 全部 GREEN + L3 未全部 GREEN → gear_level = L2
- L2/L3 全部 GREEN + L4 未全部 GREEN → gear_level = L3
- L2/L3/L4 全部 GREEN → gear_level = L4

**ELO 天花板机制（`eloUtils.js` 的 `getEloCeilingFromSpecialties`）：**
当前等级的所有 benchmark 必须全部 mastered 才能突破天花板：
```
L2 全部 mastered → ceiling = 1799 (L2.max)
L3 全部 mastered → ceiling = 2499 (L3.max)
L4 全部 mastered → ceiling = 3000 (L4.max)
```

### 3.2 熔断机制（Meltdown）

`eloEngine.js` 中的 `calculateMeltdownPenalty`：当 L4 等级学生答错 L2 基础题时触发熔断惩罚，扣 100 ELO 并重置所有节点为红色。

### 3.3 遗忘衰减系统

`benchmarkUtils.js` 的 `checkBenchmarkDecay`：已掌握的 benchmark 如果超过 `DECAY_CONFIG.YELLOW_THRESHOLD_DAYS` 天未练习，自动降级为未掌握状态（标记 `decayed_from: true`）。

### 3.4 每周任务生成算法

`App.jsx` 的 `generateWeeklyBundle` 按三级优先级选取母题：

```
优先级 1：未解决的错题所在母题（ELO >= 1001 且未通关）
优先级 2：用户主动勾选的母题（ELO >= 1001 且未通关）
优先级 3：ELO 最低的 2 个已激活母题（兜底）
```

### 3.5 RAG 题目生成流水线

`WeeklyMissionNew.jsx` + `problemLogic.js` + `dataLoader.js`：

```
1. 输入：母题ID + 目标难度(L2/L3/L4) + 年级(高一/高二/高三)
2. 选题（selectBenchmark）：
   a. 优先从 original_pool 中按难度筛选（RAG 模式）
   b. 应用年级过滤（filterByGradeRestrictions）：拦截超纲工具（导数、洛必达等）
   c. 降级：master_benchmarks → otherLevelBenchmarks → otherLevelPool
3. 选变量因子（selectVariableKnobs）：从 variation.variable_knobs 中按难度筛选
4. 构建 Prompt（promptBuilder.js）：注入种子题、难度锚点、年级护栏、约束条件
5. AI 生成题目（callLLM）→ 解析 JSON → 题目验证（questionVerifier.js）
6. 学生作答 → AI 批改（aiGrader.js）→ 更新 ELO + 题目状态
```

### 3.6 题目状态冷却系统

`questionStateManager.js` 实现：

```
做对 → mastered_pool（永久冻结，不再出现）
做错 → weak_point_buffer（14天冷却期，冷却期内不出现）
L4 特殊规则：需累计做对 2 次才冻结
```

### 3.7 AI 视觉诊断流水线

`aiVisionService.js` 的 `diagnoseError`：

```
上传图片 → qwen-vl-max 视觉识别
         → 提取题干 + 分类母题/专项/变例/难度
         → 查找母题 JSON 数据，验证 specId/varId 是否有效
         → 回退策略：如果 AI 返回的 ID 无效，取第一个存在的
         → 关联 linked_weapons（推荐杀手锏）
         → 返回标准化的 diagnosisResult
```

### 3.8 年级内容护栏

`syllabusRules.js` + `problemLogic.js` 的 `filterByGradeRestrictions`：

```
第一道防线：大学工具红线（洛必达、泰勒、拉格朗日等全年级禁止）
第二道防线：年级特定工具禁令（高一的导数/空间向量等）
第三道防线：母题特定上下文限制
第四道防线：L2 思维难度过滤（禁止"导数""求导"等工具词在元数据中）
```

---

## 四、代码问题审查

### 4.1 🔴 严重问题

**God Component — App.jsx 1363 行**

所有核心状态(6个)、所有业务逻辑(20+个 handler)、所有数据持久化逻辑全部集中在 App.jsx 中。这意味着任何一个状态的修改都需要遍历整个组件树，且任何修改 App.jsx 的行为都是高风险操作。建议拆分为自定义 hooks（如 `useTacticalData`、`useErrorNotebook`、`useWeeklyPlan` 等）。

**重复的 ELO 常量定义**

`ELO_SCORES` 在 `eloEngine.js` 第 25-29 行和 `aiGrader.js` 第 6-11 行有完全相同的定义。如果修改 ELO 分值，容易遗漏其中一处，导致判题和仪表盘数据不一致。

**questionStateManager 不支持多用户**

`user_question_progress` 存储在 localStorage 使用固定 key，不区分用户。而其他所有数据都通过 `userManager.getStorageKey()` 带用户前缀。这会导致多用户共享同一份题目进度数据。

### 4.2 🟡 中等问题

**API Key 暴露路径**

`constants/config.js` 中 `API_KEY = import.meta.env.VITE_QWEN_API_KEY` — 使用 Vite 的 `VITE_` 前缀意味着 API Key 会被打包进前端 JS bundle，任何访问网站的人都能在浏览器中查看。这是已知 Vite 行为，但对于 API Key 安全来说是风险点。

**空 handler**

`App.jsx` 第 1267-1270 行：
```jsx
onStartTraining={(params) => {}}
onStartRemediation={(params) => {}}
```
两个回调传空函数。如果这些功能后续需要实现，当前缺少功能；如果不需要，应该从 TrainingCenter 的 props 中移除。

**localStorage 读写在每次渲染时触发**

`App.jsx` 第 170-179 行的 useEffect 没有依赖数组：
```jsx
useEffect(() => {
  const currentUser = userManager.getCurrentUser();
  if (currentUser && currentUser !== userIdRef.current) {
    userIdRef.current = currentUser;
    loadTacticalDataForUser(currentUser);
  }
  if (!currentUser) {
    userIdRef.current = null;
  }
});
```
这个 effect 在每次渲染后都会执行。虽然内部有 ref 守卫，但不必要的每次都查 localStorage 会造成性能浪费。

**ELO 天花板边界不一致**

`handleCalibrate` 中第 739 行用 `elo >= 1700` 判断 healthy，而其他地方（如 `handleUpdateMotifElo` 第 216 行）用 `elo >= 2501` 判断 healthy。`health_status` 的判断标准在不同 handler 中不一致。

### 4.3 🟢 轻微问题

**`questionHistoryUtils.js` 被导入但使用有限**

在 `WeeklyMissionNew.jsx` 中同时导入了 `questionHistoryUtils`（从 utils）和通过 props 透传了 `questionHistory` / `setQuestionHistory`，两套系统并存，可能造成数据不一致。

**测试覆盖不足**

只有 `questionVerifier.test.js` 和 `problemLogic.test.js` 两个测试文件。核心的 `eloEngine.js`、`benchmarkUtils.js`、`aiGrader.js`、`promptBuilder.js` 等关键算法模块均无测试。

**类型安全缺失**

项目使用 `.jsx` 文件，没有 TypeScript。对于 17 个母题 JSON 数据文件的复杂嵌套结构，缺少类型校验意味着运行时才能发现数据结构错误。

**数据迁移脚本复杂度**

`migrateDataStructure.js` 大量使用关键词映射（如 `KEYWORD_MAPPINGS` 跨越所有 17 个母题），这些映射表随母题体系演进容易过时，且没有自动校验映射是否与当前 JSON 文件一致。

---

## 五、总结

这是一个设计精巧的高中数学私教工具，核心亮点在于：

- **三层知识图谱**：母题→专项→变例→benchmark 的细粒度知识建模
- **ELO 递阶 + 熔断 + 衰减**：借鉴游戏化设计的三重学习动力机制
- **RAG + AI 命题**：结合本地题库的结构化约束和 AI 的生成能力
- **年级自适应**：从高一的"禁止导数"到高三的"全开模式"的梯度护栏

主要改进方向是架构解耦（拆分 God Component）和存储统一（修复 questionStateManager 的多用户隔离问题）。
