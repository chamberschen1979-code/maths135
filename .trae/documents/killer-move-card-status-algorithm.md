# 杀手锏卡片状态算法分析

## 当前算法

### 数据来源
- `weapon._userState.status`: 硬编码在 `strategy_lib.json` 中
- 值: `LOCKED` | `UNLOCKED` | `CERTIFIED`

### 当前逻辑 (`StrategyHub.jsx` 第 127-132 行)

```javascript
const userState = weapon._userState || { status: 'LOCKED', progress: 0 }
const isLocked = userState.status === 'LOCKED'
const isCertified = userState.status === 'CERTIFIED'
const isTraining = userState.status === 'UNLOCKED'
```

### 三种状态的当前实现

| 状态 | 条件 | 视觉效果 | 问题 |
|------|------|----------|------|
| **LOCKED** | `_userState.status === 'LOCKED'` | `opacity-60` + "未解锁"标签 | ❌ 硬编码，不是基于母题激活 |
| **UNLOCKED** | `_userState.status === 'UNLOCKED'` | 正常显示 + "去认证"按钮 | ❌ 硬编码，不是基于母题激活 |
| **CERTIFIED** | `_userState.status === 'CERTIFIED'` | `CheckCircle size={12}` + "已认证" | ❌ 图标太小 (12px) |

---

## 用户期望的算法

### 状态判定逻辑

```
1. 母题未激活 → LOCKED (卡片模糊)
2. 母题已激活 + 未认证 → UNLOCKED (卡片变亮，显示"去认证")
3. 认证通过 → CERTIFIED (显示认证勋章)
```

### 需要修改的地方

#### 1. 母题激活状态检查

需要检查杀手锏关联的母题 (`weapon.linked_motifs`) 是否在 `tacticalData` 中被激活。

```javascript
// 检查母题是否激活
const isMotifActivated = (motifId, tacticalData) => {
  // 遍历 tacticalData.tactical_maps 查找母题
  // 检查该母题的 gear_level 或 elo_score 是否 > 0
  // 或者检查 user_profile.activeMotifs 是否包含该母题
}
```

#### 2. 杀手锏状态计算

```javascript
const getWeaponStatus = (weapon, tacticalData) => {
  // 优先检查是否已认证
  if (weapon._userState?.status === 'CERTIFIED') {
    return 'CERTIFIED'
  }
  
  // 检查关联母题是否激活
  const linkedMotifs = weapon.linked_motifs || weapon.linked_motifs
  const hasActivatedMotif = linkedMotifs?.some(m => 
    isMotifActivated(m.id, tacticalData)
  )
  
  if (hasActivatedMotif) {
    return 'UNLOCKED'
  }
  
  return 'LOCKED'
}
```

#### 3. 认证勋章放大

```javascript
// 当前
<CheckCircle size={12} />

// 修改为
<CheckCircle size={18} className="text-green-500" />
```

---

## 实施步骤

### 第一步：创建母题激活检查函数

**文件**: `src/utils/motifWeaponMapper.js`

```javascript
export const isMotifActivated = (motifId, tacticalData) => {
  if (!tacticalData?.tactical_maps) return false
  
  for (const map of tacticalData.tactical_maps) {
    const encounter = map.encounters?.find(e => e.target_id === motifId)
    if (encounter) {
      // 检查 gear_level 或 elo_score
      return encounter.gear_level > 0 || encounter.elo_score > 1000
    }
  }
  
  return false
}
```

### 第二步：修改 StrategyHub.jsx 状态计算

```javascript
import { getLinkedMotifsForWeapon, isMotifActivated } from '../utils/motifWeaponMapper'

const renderWeaponCard = (weapon) => {
  // 计算状态
  const linkedMotifs = weapon.linked_motifs || []
  const hasActivatedMotif = linkedMotifs.some(m => 
    isMotifActivated(m.id, tacticalData)
  )
  
  // 优先级：CERTIFIED > UNLOCKED > LOCKED
  let status = 'LOCKED'
  if (weapon._userState?.status === 'CERTIFIED') {
    status = 'CERTIFIED'
  } else if (hasActivatedMotif) {
    status = 'UNLOCKED'
  }
  
  const isLocked = status === 'LOCKED'
  const isCertified = status === 'CERTIFIED'
  const isTraining = status === 'UNLOCKED'
  
  // ... 渲染逻辑
}
```

### 第三步：放大认证勋章

```javascript
{isCertified && (
  <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
    <CheckCircle size={18} className="text-green-500" />
    已认证
  </span>
)}
```

---

## 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/utils/motifWeaponMapper.js` | 修改 | 添加 `isMotifActivated` 函数 |
| `src/components/StrategyHub.jsx` | 修改 | 修改状态计算逻辑，放大勋章 |
