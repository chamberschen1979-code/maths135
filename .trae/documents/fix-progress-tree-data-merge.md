# 修复进度看板数据合并逻辑

## 审阅结论

用户的分析思路 **完全正确**！问题定位准确：

### 当前状态

| 数据源 | 结构 | 状态 |
|--------|------|------|
| `tacticalMaps.json` | `sub_targets` (旧) | M01-M15, M17 只有旧结构 |
| `tacticalMaps.json` | `specialties` (新) | 只有 M16 有新结构 |
| M 系列文件 (M01.json 等) | `specialties` (新) | **所有文件都有完整的新结构** |

### 问题根源

`useTrainingCenterData.js` 中的 `getSpecialtiesWithStatus` 函数存在 ID 匹配问题：

1. **M 系列文件的 `master_benchmarks.id` 格式**: `M01_V1.1_MB_L2_V96`
2. **代码生成的 `legacy_id` 格式**: `M01_L2_1`
3. **`tacticalMaps.json` 的 `sub_id` 格式**: `M01_L2_1`

ID 格式不匹配导致状态迁移失败。

## 修改方案

### 方案：优先使用 M 系列文件数据

**核心思路**：不修改 `tacticalMaps.json`，而是修改 Hook 的数据合并逻辑。

**优先级**：
1. M 系列文件 `.specialties` (新结构，完整数据)
2. `tacticalMaps.json` `.specialties` (如果存在)
3. 空数组 (兜底)

### 执行步骤

#### Step 1: 重写 `useTrainingCenterData.js` 的数据合并逻辑

```javascript
// 关键修改：优先使用 M 系列文件的 specialties 数据
let sourceSpecialties = [];

// 优先级 1: M 系列文件
if (MOTIF_DATA_MAP[motifId]?.specialties) {
  sourceSpecialties = JSON.parse(JSON.stringify(MOTIF_DATA_MAP[motifId].specialties));
}
// 优先级 2: tacticalMaps.json 中的 specialties
else if (encounter.specialties?.length > 0) {
  sourceSpecialties = encounter.specialties;
}
// 优先级 3: 空数组
```

#### Step 2: 状态迁移逻辑优化

由于 M 系列文件的 `master_benchmarks.id` 格式与 `sub_targets.sub_id` 格式不同，需要：

1. **方案 A**: 修改 M 系列文件，添加 `legacy_id` 字段
2. **方案 B**: 修改状态匹配逻辑，使用模糊匹配（如按 level 和 index 匹配）
3. **方案 C**: 暂时忽略状态迁移，所有题目显示为未开始（推荐，因为当前数据都是初始状态）

#### Step 3: 验证

- 刷新页面，查看控制台日志
- 确认 `progressTree` 中 `variants` 数组不为空
- 确认 `varName` 显示正确的专项名称（如 "基本运算与要素识别"）

## 文件修改清单

| 文件 | 修改内容 |
|------|---------|
| `src/hooks/useTrainingCenterData.js` | 重写数据合并逻辑，优先使用 M 系列文件 |

## 风险评估

- **低风险**: 只修改前端渲染逻辑，不修改数据文件
- **兼容性**: 保持对旧数据的兼容（如果 M 系列文件不存在，仍可使用 `tacticalMaps.json` 的数据）
