# WeeklyMission.jsx 重构评估报告

## 一、整体评估

### ✅ 重构亮点

| 亮点 | 说明 |
|------|------|
| 代码量大幅减少 | 从 ~2400 行减少到 ~460 行 |
| 逻辑解耦清晰 | 数据、Prompt、解析、UI 分离 |
| 数据流清晰 | CROSS_FILE_INDEX 统一构建并透传 |
| 性能优化 | useMemo 缓存索引数据 |
| 错误处理健壮 | 单个题目失败不影响整体 |

### ⚠️ 发现的问题

#### 问题 1：导入错误

**原代码**：
```javascript
import { 
  findMotifData, 
  getDifficultyByElo, 
  selectBenchmark, 
  selectVariableKnobs,
  buildCrossFileIndex,
  loadMotifData  // ❌ 这个函数不在 problemLogic.js 中
} from '../utils/problemLogic';
```

**问题**：`loadMotifData` 在 `dataLoader.js` 中，不在 `problemLogic.js` 中。

**修复**：
```javascript
import { 
  findMotifData, 
  getDifficultyByElo, 
  selectBenchmark, 
  selectVariableKnobs,
  buildCrossFileIndex
} from '../utils/problemLogic';
import { loadMotifData } from '../utils/dataLoader';
```

#### 问题 2：语法错误

**原代码**：
```javascript
const allEncountersSum = (tacticalData) => {
  if (!tacticalData?.tactical_maps) return 0;
  return tacticalData.tactical_maps
    .flatMap(m => m.encounters)
    .reduce((sum, e) => sum + (e.elo_score || 0), 0);  // ❌ 括号位置错误
};
```

**问题**：第 460 行 `reduce` 的括号位置错误。

**修复**：
```javascript
const allEncountersSum = (tacticalData) => {
  if (!tacticalData?.tactical_maps) return 0;
  return tacticalData.tactical_maps
    .flatMap(m => m.encounters)
    .reduce((sum, e) => sum + (e.elo_score || 0), 0);
};
```

#### 问题 3：缺少依赖项

**原代码**：
```javascript
useEffect(() => {
  const loadRequiredMotifs = async () => {
    // ...
  };
  loadRequiredMotifs();
}, [weeklyPlan?.activeMotifs, errorNotebook, tacticalData]);
```

**问题**：缺少 `loadedMotifData` 依赖项，可能导致无限循环。

**修复**：移除 `loadedMotifData` 依赖项，或使用 `useRef` 存储缓存。

---

## 二、修复方案

### 修复 1：导入语句

```javascript
// src/components/WeeklyMission.jsx
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { ThemeContext } from '../App';
import TaskCard from './TaskCard';
import LatexRenderer from './LatexRenderer';

// --- 导入重构后的工具模块 ---
import { buildSystemPrompt, buildUserPrompt } from '../utils/promptBuilder';
import { parseAIResponse } from '../utils/responseParser';
import { 
  findMotifData, 
  getDifficultyByElo, 
  selectBenchmark, 
  selectVariableKnobs,
  buildCrossFileIndex
} from '../utils/problemLogic';
import { loadMotifData } from '../utils/dataLoader';  // ✅ 单独导入
```

### 修复 2：语法错误

```javascript
const allEncountersSum = (tacticalData) => {
  if (!tacticalData?.tactical_maps) return 0;
  return tacticalData.tactical_maps
    .flatMap(m => m.encounters)
    .reduce((sum, e) => sum + (e.elo_score || 0), 0);
};
```

---

## 三、结论

### 评估结果：重构方向正确，需要修复两个问题

| 问题 | 严重程度 | 修复方案 |
|------|----------|----------|
| 导入错误 | 高 | 从 dataLoader.js 导入 loadMotifData |
| 语法错误 | 高 | 修复 reduce 括号位置 |

### 建议

1. 修复导入语句
2. 修复语法错误
3. 测试验证功能
