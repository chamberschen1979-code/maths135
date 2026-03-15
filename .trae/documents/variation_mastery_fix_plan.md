# 变例通关规则与等级分布修复计划

## 一、问题分析

### 1. 等级分布呈现逻辑（当前是正确的）

**HoloMap.jsx 第404-429行 `getLightStyleForVariation` 函数：**
```javascript
const benchmarks = variation?.master_benchmarks || []
const hasBenchmarkForLevel = benchmarks.some(b => b.level === lvl)

if (!hasBenchmarkForLevel) {
  return null  // 不显示该等级灯
}
```

**结论**：等级分布是根据 M 文件的 `master_benchmarks` 数组判断的，这是正确的。

**示例**：
- M01 变例 1.1 有 L2/L3/L4 三个 benchmark → 显示 3 个灯
- M01 变例 1.2 只有 L3/L4 两个 benchmark → 只显示 2 个灯

### 2. 变例通关规则问题（当前是错误的）

**当前 `calculatePromotionProgress` 函数逻辑：**
```javascript
let totalVariations = 0
detailData.specialties.forEach(spec => {
  totalVariations += (spec.variations?.length || 0)  // 统计变例总数
})

const masteredCount = subTargets.filter(sub => sub.is_mastered === true).length  // 统计 sub_targets 中已通关的数量
```

**问题**：
- `totalVariations` 来自 M 文件的变例数量
- `masteredCount` 来自 tacticalMaps 的 sub_targets 数量
- 这两个数字来源不同，不匹配

**正确规则**：
某变例通关 = 该变例的所有等级（L2/L3/L4）状态灯都变绿

## 二、修复方案

### 修复 `calculatePromotionProgress` 函数

**新逻辑**：
1. 遍历每个变例
2. 检查该变例的每个等级灯是否都是绿色
3. 统计已通关的变例数量

**代码实现**：
```javascript
const calculatePromotionProgress = () => {
  if (!hasSpecialties) return null
  
  let totalVariations = 0
  let masteredVariations = 0
  
  const subTargets = (previewSubTargets || selectedTarget?.sub_targets) || []
  
  detailData.specialties.forEach(spec => {
    spec.variations?.forEach(variation => {
      totalVariations++
      
      // 获取该变例的所有等级
      const benchmarks = variation?.master_benchmarks || []
      const levels = [...new Set(benchmarks.map(b => b.level))]  // 如 ['L2', 'L3', 'L4']
      
      if (levels.length === 0) return  // 没有等级的变例跳过
      
      // 检查该变例的所有等级灯是否都是绿色
      const allLevelsMastered = levels.every(lvl => {
        const subForLevel = subTargets.filter(sub => sub.level_req === lvl)
        return subForLevel.length > 0 && subForLevel.every(sub => sub.is_mastered === true)
      })
      
      if (allLevelsMastered) {
        masteredVariations++
      }
    })
  })
  
  return {
    totalVariations,
    masteredVariations,
    progress: totalVariations > 0 ? (masteredVariations / totalVariations) * 100 : 0
  }
}
```

## 三、实施步骤

1. 修改 HoloMap.jsx 的 `calculatePromotionProgress` 函数
2. 更新弹窗中"变例通关：X/Y 个"的显示逻辑
3. 测试验证

## 四、风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| sub_targets 与变例等级不匹配 | 可能导致无法正确判断 | 按等级聚合判断，而非精确匹配 |

## 五、注意事项

由于 sub_targets 与变例不是一对一映射，当前逻辑是按等级聚合：
- 如果某变例有 L2/L3/L4 三个等级
- 需要该母题的所有 L2 sub_targets 都通关，且所有 L3 sub_targets 都通关，且所有 L4 sub_targets 都通关
- 该变例才算通关

这个逻辑在语义上是合理的，因为：
- sub_targets 代表"学习目标"
- 变例代表"题目类型"
- 一个变例对应多个学习目标（按等级分）
