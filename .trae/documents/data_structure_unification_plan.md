# 数据结构统一方案：sub_targets vs specialties

## 一、现状分析

### 1.1 两套数据结构对比

| 维度 | sub_targets (旧) | specialties (新) |
|------|-----------------|------------------|
| **来源** | tacticalMaps.json | M01-M17.json 母题文件 |
| **ID格式** | `M16_L2_1` (母题_等级_序号) | `M16_V1.1_L2` (母题_专项_变例_等级) |
| **层级** | 2层 (母题 → 子目标) | 4层 (母题 → 专项 → 变例 → 标杆题) |
| **信息量** | 仅状态信息 | 状态 + 题目内容 + 逻辑核心 + 变量因子 |
| **用途** | 状态追踪、Elo计算 | 出题、状态追踪、进度展示 |

### 1.2 使用范围统计

**sub_targets 使用位置 (8个文件)**：
- App.jsx: Elo计算、等级判断、状态更新
- HoloMap.jsx: 衰减检测、状态切换
- TrainingView.jsx: 封顶判断、陷阱名获取
- TacticalDashboard.jsx: 等级状态显示
- BattleScanner.jsx: 诊断结果计算
- useTrainingCenterData.js: 进度统计
- CustomSection.jsx: 周任务显示
- tacticalMaps.json: 数据存储

**specialties 使用位置 (30+个文件)**：
- problemLogic.js: 出题核心逻辑
- dataLoader.js: 数据加载
- TaskCard.jsx: 任务预览
- HoloMap.jsx: 详情面板、武器提取
- WeeklyMission.jsx: 周任务生成
- M01-M17.json: 完整题目数据

### 1.3 当前同步机制

```
┌─────────────────────────────────────────────────────────────┐
│                    App.jsx 同步逻辑                          │
├─────────────────────────────────────────────────────────────┤
│  handleCalibrate() ──┬──► sub_targets.is_mastered 更新      │
│                      └──► specialties.master_benchmarks 更新 │
│                                                             │
│  updateTargetData() ─┬──► sub_targets.last_practice 更新    │
│                      └──► specialties.last_practice 更新    │
│                                                             │
│  初始化面板 ─────────┬──► sub_targets 状态切换              │
│                      └──► specialties 状态切换              │
└─────────────────────────────────────────────────────────────┘
```

## 二、问题诊断

### 2.1 核心问题

1. **数据冗余**：同一状态存储两份，增加维护成本
2. **映射不精确**：`M16_L2_1` 无法精确对应到 `V1.1_L2`，只是按顺序映射
3. **信息丢失**：sub_targets 丢失了专项和变例的语义信息
4. **同步风险**：任何状态更新都需要同时修改两处，容易遗漏

### 2.2 为什么存在两套结构？

**历史原因**：
- `sub_targets` 是早期设计的简化结构，用于快速实现 Elo 系统
- `specialties` 是后来引入的完整结构，用于 AI 出题系统

**设计初衷**：
- `sub_targets` 用于状态追踪（轻量）
- `specialties` 用于出题逻辑（重量）

## 三、统一方案

### 3.1 推荐方案：完全使用 specialties

**目标**：删除 sub_targets，所有状态追踪改用 specialties

**理由**：
1. specialties 包含完整信息，可以完全覆盖 sub_targets 的功能
2. 避免数据冗余和同步问题
3. 与 AI 出题系统天然对接

### 3.2 实施步骤

#### 阶段一：数据层改造

**Step 1: 更新 tacticalMaps.json**
- 为所有母题添加 specialties 结构
- 删除 sub_targets 字段
- 从 M 系列文件同步 specialties 数据

**Step 2: 创建数据迁移工具**
```javascript
// 将现有 sub_targets 状态迁移到 specialties
function migrateSubTargetsToSpecialties(encounter) {
  // 按等级映射状态
}
```

#### 阶段二：业务逻辑改造

**Step 3: 修改 Elo 计算逻辑**
- 文件：App.jsx, HoloMap.jsx
- 函数：calculateElo, getLevelBySubTargets, getLockedLevel, isEloCapped
- 改为：从 specialties.master_benchmarks 提取状态

**Step 4: 修改状态更新逻辑**
- 文件：App.jsx
- 函数：updateTargetData, handleCalibrate, handleGlobalReset
- 改为：只更新 specialties

**Step 5: 修改进度统计逻辑**
- 文件：useTrainingCenterData.js
- 删除 hasNewStructure 判断，统一使用 specialties

**Step 6: 修改 UI 组件**
- 文件：HoloMap.jsx, TrainingView.jsx, TacticalDashboard.jsx
- 适配新的数据结构

#### 阶段三：清理工作

**Step 7: 删除废弃代码**
- 删除所有 sub_targets 相关逻辑
- 删除兼容性判断代码

### 3.3 详细文件修改清单

| 文件 | 修改内容 | 风险等级 |
|------|---------|---------|
| tacticalMaps.json | 添加 specialties，删除 sub_targets | 🔴 高 |
| App.jsx | 修改 Elo 计算、状态更新函数 | 🔴 高 |
| HoloMap.jsx | 修改衰减检测、状态切换 | 🟡 中 |
| TrainingView.jsx | 修改封顶判断 | 🟡 中 |
| TacticalDashboard.jsx | 修改等级状态显示 | 🟢 低 |
| BattleScanner.jsx | 修改诊断结果计算 | 🟡 中 |
| useTrainingCenterData.js | 删除兼容逻辑 | 🟢 低 |
| CustomSection.jsx | 适配新结构 | 🟢 低 |

## 四、风险评估

### 4.1 高风险点

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| **数据丢失** | 用户已有进度可能丢失 | 实现迁移脚本，保留 localStorage 兼容 |
| **Elo 计算错误** | 等级判断失效 | 编写单元测试，验证计算结果一致 |
| **状态同步失败** | 进度显示异常 | 分阶段上线，每阶段验证 |

### 4.2 中风险点

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| **UI 显示异常** | 某些页面数据不显示 | 完整测试所有页面 |
| **出题逻辑受影响** | 题目选择错误 | 验证 problemLogic.js 兼容性 |

### 4.3 低风险点

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| **代码冗余** | 部分废弃代码残留 | 代码审查清理 |

## 五、替代方案

### 5.1 方案B：保留两套，优化同步

**优点**：改动小，风险低
**缺点**：技术债务持续存在

### 5.2 方案C：渐进式迁移

**优点**：风险可控，可回滚
**缺点**：周期长，维护成本高

## 六、建议

### 6.1 推荐执行

**统一使用 specialties 是正确的方向**，理由：
1. 消除数据冗余
2. 提高代码可维护性
3. 与出题系统天然对接
4. 语义更清晰（专项→变例→标杆题）

### 6.2 执行建议

1. **先备份**：导出当前 localStorage 数据
2. **分阶段**：先改数据层，再改业务层，最后清理
3. **充分测试**：每个阶段完成后验证所有功能
4. **保留回滚**：保留旧代码分支，出问题可快速回滚

### 6.3 预计工作量

| 阶段 | 预计时间 | 涉及文件数 |
|------|---------|-----------|
| 数据层改造 | 2-3小时 | 1个 |
| 业务逻辑改造 | 4-5小时 | 7个 |
| 清理测试 | 1-2小时 | 全部 |
| **总计** | **7-10小时** | **8个核心文件** |

## 七、结论

**建议执行统一方案**，但需要注意：
1. 必须实现数据迁移脚本
2. 必须充分测试 Elo 计算逻辑
3. 建议分阶段上线，每阶段验证

是否执行此方案，请确认。
