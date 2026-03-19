# 杀手锏模块"母题关联"升级计划（修订版）

## 代码分析

### 当前数据结构

**strategy_lib.json**:
- 每个杀手锏有 `id`, `name`, `rank`, `logic_flow`, `description`, `trigger_keywords`
- **没有** `linked_motifs` 字段

**tacticalMaps.json**:
- 包含 M01-M17 母题数据
- 每个母题有 `target_id`, `target_name`, `elo_score`, `gear_level`

**StrategyHub.jsx**:
- 渲染杀手锏卡片
- 当前底部显示 `trigger_keywords`
- 已有 `onNavigate` prop 可用于跳转

**M01-M17.json**:
- 每个变例有 `toolkit.linked_weapons` 字段
- 例如: `"S-SET-02"` 表示关联杀手锏 S-SET-02

## 用户建议整合

### 建议1：跳转时的"高亮"如何实现？

**实施方案**：
1. 在 `App.jsx` 中维护 `selectedMotifId` 状态
2. 点击杀手锏胶囊 → 调用 `onNavigate('dashboard')` + `setSelectedMotifId('M01')`
3. `HoloMap.jsx` 接收 `selectedMotifId` 后自动滚动到该节点并高亮显示

### 建议2：胶囊的视觉层级

**实施方案**：
- 限制显示最多 4 个
- 多余的显示为 `+N`
- 鼠标悬停时展示全部（Tooltip）

### 建议3：反向映射

**实施方案**：
- 创建 `src/utils/motifWeaponMapper.js`
- 通过代码动态计算杀手锏对应的母题，- 不需要手动维护 `linked_motifs` 字段

## 实施步骤

### 第一步：创建映射工具函数
**文件**: `src/utils/motifWeaponMapper.js`

```javascript
import tacticalMaps from '../data/tacticalMaps.json';
import strategyLib from '../data/strategy_lib.json';

// 杀手锏 -> 母题 的映射
const weaponToMotifMap = {
  'S-SET-01': ['M01'],
  'S-SET-02': ['M01'],
  'S-SET-03': ['M01'],
  'S-COMP-01': ['M01'],
  // ... 其他映射
};

// 获取杀手锏关联的母题
export const getLinkedMotifsForWeapon = (weaponId) => {
  const motifIds = weaponToMotifMap[weaponId] || [];
  return motifIds.map(id => getMotifInfo(id)).filter(Boolean);
};

// 获取母题信息
export const getMotifInfo = (motifId) => {
  for (const map of tacticalMaps.tactical_maps) {
    const encounter = map.encounters.find(e => e.target_id === motifId);
    if (encounter) {
      return { id: motifId, name: encounter.target_name };
    }
  }
  return null;
};
```

### 第二步：修改 StrategyHub.jsx
**修改内容**:
1. 导入 `getLinkedMotifsForWeapon`
2. 替换底部 `trigger_keywords` 渲染为 `linked_motifs` 胶囊
3. 添加点击事件处理
4. 限制显示数量（最多 4 个）

### 第三步：修改 App.jsx
**修改内容**:
1. 添加 `selectedMotifId` 状态
2. 传递给 `HoloMap` 组件

### 第四步：修改 HoloMap.jsx
**修改内容**:
1. 接收 `selectedMotifId` prop
2. 添加高亮效果（放大/闪烁）
3. 自动滚动到该节点

## 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/utils/motifWeaponMapper.js` | 新建 | 映射工具函数 |
| `src/components/StrategyHub.jsx` | 修改 | 渲染母题胶囊，添加跳转逻辑 |
| `src/App.jsx` | 修改 | 添加 selectedMotifId 状态 |
| `src/components/HoloMap.jsx` | 修改 | 添加高亮效果 |

## 预期效果

```
┌─────────────────────────────────┐
│ 🔥 空集陷阱自动检测              │
│                                 │
│ 见到 A ⊆ B 或 A ∩ B = ∅...     │
│                                 │
│ 适用母题场景：                   │
│ ┌──────┐ ┌──────┐              │
│ │🎯 M01│ │🎯 M03│              │
│ │集合..│ │函数..│              │
│ └──────┘ └──────┘              │
└─────────────────────────────────┘
```

点击胶囊 → 跳转到知识图谱 → 高亮对应母题
