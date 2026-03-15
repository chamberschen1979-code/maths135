# problemLogic.js 代码评估报告

## 一、整体评估

### ✅ 优点

| 优点 | 说明 |
|------|------|
| 纯函数设计 | 无副作用，易于测试 |
| 职责单一 | 每个函数只做一件事 |
| 配置驱动 | 难度映射易于维护 |
| 保留原有算法 | 不破坏现有业务逻辑 |
| 兼容性好 | 处理多种 ID 格式和数据结构 |

### ⚠️ 需要修复的问题

#### 问题 1：window.loadMotifData 依赖全局变量

**原代码**：
```javascript
if (window.loadMotifData) {
  const loadedData = await window.loadMotifData(targetId);
}
```

**问题**：依赖全局变量，不利于模块化和测试。

**修复**：改为参数注入：
```javascript
export const findMotifData = async (targetId, crossFileIndex, loadMotifDataFn = null) => {
  // ...
  if (loadMotifDataFn) {
    const loadedData = await loadMotifDataFn(targetId);
    // ...
  }
}
```

#### 问题 2：selectVariableKnobs 返回数组但逻辑只选一个

**原代码**：
```javascript
const selected = [];
// 只选一个
for (const knob of knobsPool) {
  if (random <= weight) {
    selected.push(knob);
    break;
  }
}
return selected;
```

**问题**：返回数组但只选一个，调用方需要处理数组。

**修复**：直接返回对象或 null：
```javascript
export const selectVariableKnobs = (knobsPool) => {
  if (!knobsPool || knobsPool.length === 0) return null;

  const totalWeight = knobsPool.reduce((sum, k) => sum + (k.weight || 1), 0);
  let random = Math.random() * totalWeight;

  for (const knob of knobsPool) {
    const weight = knob.weight || 1;
    if (random <= weight) {
      return knob;
    }
    random -= weight;
  }

  return knobsPool[0]; // 兜底返回第一个
};
```

#### 问题 3：normalizeId 空字符串处理

**原代码**：
```javascript
export const normalizeId = (id) => {
  if (!id) return '';
  return id.replace(/_/g, '-').toLowerCase();
};
```

**问题**：返回空字符串可能导致后续逻辑出错。

**修复**：返回 null 更明确：
```javascript
export const normalizeId = (id) => {
  if (!id) return null;
  return id.replace(/_/g, '-').toLowerCase();
};
```

---

## 二、修复后的完整代码

```javascript
// src/utils/problemLogic.js

export const normalizeId = (id) => {
  if (!id) return null
  return id.replace(/_/g, '-').toLowerCase()
}

export const findMotifData = async (targetId, crossFileIndex, loadMotifDataFn = null) => {
  if (!targetId || !crossFileIndex) return null

  const idVariants = [
    targetId,
    normalizeId(targetId),
    targetId.replace(/-/g, '_'),
    targetId.toUpperCase(),
    targetId.toLowerCase()
  ]

  for (const variant of idVariants) {
    if (variant && crossFileIndex[variant] && crossFileIndex[variant].length > 0) {
      return crossFileIndex[variant][0]
    }
  }

  if (loadMotifDataFn) {
    try {
      const loadedData = await loadMotifDataFn(targetId)
      if (loadedData) {
        return {
          ...loadedData,
          prototypeProblems: loadedData.prototypeProblems || loadedData.prototype_problems || []
        }
      }
    } catch (e) {
      console.warn('动态加载母题数据失败:', e)
    }
  }

  return null
}

export const getDifficultyByElo = (elo) => {
  const score = elo || 0

  if (score <= 1800) {
    return {
      tier: '基础筑基',
      level: 'L2',
      complexity: 1,
      steps: 2,
      traps: 0,
      allowDiscussion: false,
      paramConstraint: 'integer_or_simple_fraction'
    }
  } else if (score <= 2500) {
    return {
      tier: '深度复合',
      level: 'L3',
      complexity: 3,
      steps: 4,
      traps: 1,
      allowDiscussion: true,
      paramConstraint: 'any'
    }
  } else {
    return {
      tier: '战术压轴',
      level: 'L4',
      complexity: 4,
      steps: 5,
      traps: 2,
      allowDiscussion: true,
      paramConstraint: 'any'
    }
  }
}

export const selectBenchmark = (motifData, targetLevel) => {
  if (!motifData) return null

  const specialties = motifData.specialties || []

  // 优先查找 master_benchmarks
  for (const spec of specialties) {
    const variations = spec.variations || []
    for (const v of variations) {
      const benchmarks = v.master_benchmarks || []
      const match = benchmarks.find(b => b.level === targetLevel)
      if (match) return match
    }
  }

  // 降级查找 original_pool
  for (const spec of specialties) {
    const variations = spec.variations || []
    for (const v of variations) {
      const pool = v.original_pool || []
      const matches = pool.filter(b => b.level === targetLevel)
      if (matches.length > 0) {
        return matches[Math.floor(Math.random() * matches.length)]
      }
    }
  }

  // 最后降级查找旧结构
  const mb = motifData.master_benchmarks || []
  const matchMB = mb.find(b => b.level === targetLevel)
  if (matchMB) return matchMB

  return null
}

export const selectVariableKnobs = (knobsPool) => {
  if (!knobsPool || knobsPool.length === 0) return null

  const totalWeight = knobsPool.reduce((sum, k) => sum + (k.weight || 1), 0)
  let random = Math.random() * totalWeight

  for (const knob of knobsPool) {
    const weight = knob.weight || 1
    if (random <= weight) {
      return knob
    }
    random -= weight
  }

  return knobsPool[0]
}

export const buildCrossFileIndex = (motifDataMap) => {
  const index = {}
  if (!motifDataMap) return index

  Object.entries(motifDataMap).forEach(([key, value]) => {
    const normalKey = normalizeId(key)
    if (normalKey) {
      if (!index[normalKey]) {
        index[normalKey] = []
      }
      index[normalKey].push(value)
    }
  })
  return index
}
```

---

## 三、结论

### 评估结果：✅ 代码合理，需要小修复

| 问题 | 修复方案 |
|------|----------|
| window 全局变量依赖 | 改为参数注入 |
| selectVariableKnobs 返回值 | 直接返回对象或 null |
| normalizeId 空值处理 | 返回 null |
| 添加 try-catch | 动态加载时捕获异常 |

### 建议：使用修复后的代码
