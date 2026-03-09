# 135+ 弹窗 UI 重构计划

## 业务逻辑理解确认

### 核心算法链路

1. **母题 → 子变式映射**

   * 19个标准母题（如 t4\_2 解析几何压轴题）

   * 每个母题包含多个子变式（小问）

   * L2 = 第一小问（基础，40分）

   * L3 = 第二小问（进阶，60分）

   * L4 = 第三小问/陷阱（巅峰，100分）

2. **动态出题与计分**

   * 一道题可组合多个小问

   * 示例：L2+L3 = 100分，L3+L4 = 160分

   * 40/60/100 是单次通关奖励，非总分天花板

3. **独立晋级与红黄绿认定**

   * 🟢 绿灯：Elo达标 + 连续3次首刷全对

   * 🟡 黄灯：超过7天未练习

   * 🔴 红灯：默认状态或近期做错

   * L4熔断：L2做错 → 2.5倍惩罚 → 全灯爆红

## 当前代码状态检查

### 已完成项

* ✅ App.jsx：旧常量已删除

* ✅ HoloMap.jsx：stopPropagation 已添加（第750-751行）

* ✅ GRADE\_ZONES：已更新为母题 ID

### 待修复项

* ❌ 弹窗 UI：仍在平铺显示所有 subTargets 名称

* ❌ 未简化为 L2/L3/L4 三张状态卡片

* ❌ tacticalMaps.json 中 sub\_name 仍有 `[基准]` 前缀

## 实施步骤

### 第一步：重构 HoloMap.jsx 弹窗 UI

**删除平铺显示代码**（第829-863行的 renderSubButton 函数）

**替换为卡片化显示**：

```jsx
// L2 卡片
{l2Subs.length > 0 && (
  <div className="mb-3 p-3 rounded-lg border ...">
    <div className="flex items-center justify-between">
      <span>L2 基础</span>
      <span>{l2AllGreen ? '🟢 已掌握' : l2HasWarning ? '🟡 衰减中' : '🔴 未掌握'}</span>
    </div>
    <div className="text-xs">单次通关: +40 Elo</div>
  </div>
)}

// L3 卡片（类似结构）
// L4 卡片（类似结构）
```

### 第二步：清理 tacticalMaps.json 数据

移除所有 `sub_name` 中的 `[基准]` 前缀

### 第三步：验证构建

运行 `npm run build` 确保无错误

## 涉及算法的文件

1. **eloEngine.js** - Elo 计算引擎
2. **scoringEngine.json** - 分值配置（40/60/100）
3. **tacticalMaps.json** - 母题与子变式数据
4. **HoloMap.jsx** - 弹窗 UI 渲染
5. **App.jsx** - 全局状态管理

## 算法一致性检查

当前实现是否符合业务逻辑：

* ✅ 40/60/100 单次通关奖励

* ✅ 独立晋级判定

* ❌ 弹窗 UI 未简化为卡片

