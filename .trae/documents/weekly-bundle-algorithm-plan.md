# 每周出题选择母题算法分析

## 当前算法位置

**文件**: `src/App.jsx`
**函数**: `generateWeeklyBundle` (第 428-533 行)

## 当前算法逻辑

```javascript
const generateWeeklyBundle = () => {
  const bundle = { errors: [], bleeding: [], basics: [] }
  const addedSubIds = new Set()

  // 1. 错题优先
  if (errorNotebook.length > 0) {
    const recentErrors = errorNotebook
      .filter(e => !e.resolved)
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
      .slice(0, 5)  // 最近 5 个未解决错题

    // 为每个错题找 L2/L3 变例...
  }

  // 2. 出血状态母题
  for (const map of tacticalData.tactical_maps) {
    for (const encounter of map.encounters) {
      if (encounter.health_status === 'bleeding') {
        // 取 L2/L3 未掌握变例，每个母题最多 2 个...
      }
    }
  }

  // 3. 用户勾选的母题
  weeklyPlan.activeMotifs.forEach(motifId => {
    // 取 L2 变例...
  })

  return bundle
}
```

## 用户期望的算法逻辑

### 优先级 1：错题所在领域
- **问题**: 是指上周还是以前所有错题？
- **规则**: 每个错题所在领域出 3 道同等变例、同等级别的题
- **疑问**: 是否需要同等变例？从真实有效 135+ 出发

### 优先级 2：勾选的母题
- **条件**: 必须 elo >= 1001（激活过的母题）
- **规则**: 每个出 3 道题

### 优先级 3：最低分母题
- **条件**: 在激活过的母题（elo >= 1001）里选择
- **规则**: 选择 elo 分数最低的 2 个母题，每个出 3 道题

### 去重规则
- 每个母题只能在其中一种情况出现（按优先级 1 > 2 > 3）

## 对比分析

| 维度 | 当前算法 | 用户期望 |
|------|----------|----------|
| 错题范围 | 最近 5 个未解决 | 未明确（需确认） |
| 每个母题出题数 | 不固定 | 固定 3 道 |
| 勾选母题条件 | 无限制 | 必须 elo >= 1001 |
| 最低分母题 | 无此逻辑 | 选择最低 2 个 |
| 去重逻辑 | 有（addedSubIds） | 有（按优先级） |
| 出血状态 | 有 | 未提及（可能删除） |

## 待确认问题

1. **错题时间范围**: 是上周的错题，还是所有未解决的错题？
2. **同等变例**: 是否需要同等变例？还是只要同等级别即可？
3. **出血状态**: 是否保留出血状态母题的出题逻辑？

## 修改计划

### 步骤 1：确认需求
- 与用户确认上述待确认问题

### 步骤 2：重构算法
- 修改 `generateWeeklyBundle` 函数
- 实现三级优先级逻辑
- 添加去重机制

### 步骤 3：修改勾选限制
- 在 WeeklyMission.jsx 中添加勾选限制
- 只有 elo >= 1001 的母题才能勾选

### 步骤 4：测试验证
- 测试各种场景下的出题逻辑
