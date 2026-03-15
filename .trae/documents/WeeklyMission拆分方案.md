# WeeklyMission.jsx 拆分方案

## 文件现状分析

**总行数**：3559 行

**主要函数/组件分布**：

| 函数/组件 | 起始行 | 估计行数 | 功能 |
|-----------|--------|----------|------|
| `LatexErrorBoundary` | 58 | ~25 | 错误边界组件 |
| `extractJsonFromResponse` | 82 | ~44 | JSON 提取 |
| `parseAnalysis` | 126 | ~19 | 解析函数 |
| `formatAnalysisObject` | 145 | ~30 | 格式化函数 |
| `LatexRenderer` | 175 | ~31 | LaTeX 渲染组件 |
| `levelColors` | 206 | ~7 | 常量 |
| `sourceLabels` | 213 | ~8 | 常量 |
| `loadMotifData` | 221 | ~20 | 数据加载 |
| `buildCrossFileIndex` | 241 | ~46 | 索引构建 |
| `validateProblem` | 287 | ~29 | 验证函数 |
| `generateAIProblem` | 316 | ~1100 | **AI 生成函数** |
| `verifyAIOutput` | 1416 | ~50 | 验证函数 |
| `findProblemsFromKnowledgeBase` | 1466 | ~39 | 查找函数 |
| `TaskCard` | 1505 | ~365 | 任务卡片组件 |
| `WeeklyMission` | 1871 | ~1688 | **主组件** |

---

## 拆分方案

### 方案 A：按功能模块拆分（推荐）

```
src/components/WeeklyMission/
├── index.jsx                    # 主组件入口（~200行）
├── WeeklyMission.jsx            # 主组件逻辑（~800行）
├── TaskCard.jsx                 # 任务卡片组件（~365行）
├── LatexRenderer.jsx            # LaTeX 渲染组件（~100行）
├── utils/
│   ├── jsonParser.js            # JSON 解析函数（~100行）
│   ├── problemGenerator.js      # AI 生成函数（~1100行）
│   ├── problemValidator.js      # 验证函数（~100行）
│   └── dataLoader.js            # 数据加载函数（~100行）
└── constants/
    └── index.js                 # 常量定义（~20行）
```

**优点**：
- 职责分离清晰
- 便于单元测试
- 代码可维护性高

**缺点**：
- 需要处理模块间的依赖关系
- 可能引入循环依赖问题

---

### 方案 B：按组件拆分（保守）

```
src/components/
├── WeeklyMission.jsx            # 主组件（~2000行）
├── TaskCard.jsx                 # 任务卡片组件（~365行）
├── LatexRenderer.jsx            # LaTeX 渲染组件（~100行）
└── utils/
    └── problemUtils.js          # 工具函数（~1400行）
```

**优点**：
- 改动较小
- 风险较低

**缺点**：
- `problemUtils.js` 仍然很大
- 职责分离不够清晰

---

## 风险分析

### 拆分风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 循环依赖 | 高 | 使用依赖注入或事件总线 |
| 状态管理复杂化 | 中 | 使用 Context 或状态管理库 |
| 样式冲突 | 低 | 使用 CSS Modules |
| 测试覆盖不足 | 中 | 先补充测试再拆分 |
| 性能影响 | 低 | 使用 React.memo 优化 |

### 最大风险点

1. **`generateAIProblem` 函数**（~1100行）
   - 依赖大量外部变量和函数
   - 包含复杂的 Prompt 构建逻辑
   - 拆分时需要仔细处理依赖关系

2. **`WeeklyMission` 主组件**（~1688行）
   - 包含大量状态管理逻辑
   - 依赖多个子组件和工具函数
   - 拆分时需要重新设计状态流

---

## 稳妥方案：渐进式拆分

### 第一阶段：提取独立组件（低风险）

1. **提取 `LatexRenderer` 组件**（~100行）
   - 无外部依赖
   - 纯展示组件
   - 风险：低

2. **提取 `TaskCard` 组件**（~365行）
   - 依赖较少
   - 可通过 props 传递数据
   - 风险：低

3. **提取常量文件**（~20行）
   - 无依赖
   - 风险：极低

### 第二阶段：提取工具函数（中风险）

1. **提取 JSON 解析函数**（~100行）
   - 纯函数
   - 风险：低

2. **提取数据加载函数**（~100行）
   - 需要处理异步逻辑
   - 风险：中

3. **提取验证函数**（~100行）
   - 纯函数
   - 风险：低

### 第三阶段：重构核心函数（高风险）

1. **拆分 `generateAIProblem` 函数**（~1100行）
   - 拆分为多个小函数
   - 使用依赖注入
   - 风险：高

2. **拆分 `WeeklyMission` 主组件**（~1688行）
   - 提取自定义 Hooks
   - 提取子组件
   - 风险：高

---

## 结论

**建议采用"渐进式拆分"方案**：

1. **立即执行**：提取 `LatexRenderer`、`TaskCard`、常量文件（低风险）
2. **短期执行**：提取工具函数（中风险）
3. **长期规划**：重构核心函数（高风险）

**预期效果**：
- 第一阶段完成后，文件行数减少约 500 行
- 第二阶段完成后，文件行数减少约 300 行
- 第三阶段完成后，文件行数减少约 2000 行

**最终目标**：
- 主组件文件 < 1000 行
- 每个工具函数文件 < 500 行
- 每个组件文件 < 400 行
