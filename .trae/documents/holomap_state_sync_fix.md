# 知识图谱状态同步问题修复计划

## 问题描述

初始化弹窗更新 `tacticalData` 后，知识图谱页面的母题颜色、专项变例等级灯没有同步更新。

## 问题分析

### 数据流

```
初始化弹窗 (InitModal)
    ↓ 更新 tacticalData
    ↓ setTacticalData(newData)
    ↓
HoloMap 组件
    ↓ useMemo 计算 targets (依赖 tacticalData)
    ↓ targets 更新 ✓
    ↓
    ✗ selectedTarget 不更新 (独立状态)
    ✗ previewSpecialties 不更新 (从 selectedTarget 复制)
```

### 根本原因

1. **`selectedTarget` 是独立状态**：从 `targets` 中复制出来后，不会随 `targets` 更新
2. **`previewSpecialties` 是深拷贝**：从 `selectedTarget.specialties` 复制，不会自动同步
3. **缺少监听机制**：当 `tacticalData` 变化时，没有更新 `selectedTarget`

### 相关代码位置

- `src/components/HoloMap.jsx` 第 261 行：`const [selectedTarget, setSelectedTarget] = useState(null)`
- `src/components/HoloMap.jsx` 第 262 行：`const [previewSpecialties, setPreviewSpecialties] = useState(null)`
- `src/components/HoloMap.jsx` 第 272 行：`const targets = useMemo(...)` - 会随 `tacticalData` 更新
- `src/components/HoloMap.jsx` 第 508 行：`const specialties = previewSpecialties || selectedTarget?.specialties || []` - 使用的是旧数据

## 解决方案

### 方案：添加 useEffect 监听 tacticalData 变化

当 `tacticalData` 更新时，如果 `selectedTarget` 不为空，从更新后的 `targets` 中找到对应的目标并更新 `selectedTarget` 和 `previewSpecialties`。

### 实施步骤

#### 步骤 1：添加 useEffect 监听 tacticalData 变化

在 `HoloMap.jsx` 中添加：

```javascript
useEffect(() => {
  if (selectedTarget && targets.length > 0) {
    const updatedTarget = targets.find(t => t.target_id === selectedTarget.target_id)
    if (updatedTarget) {
      setSelectedTarget(updatedTarget)
      setPreviewSpecialties(updatedTarget.specialties ? JSON.parse(JSON.stringify(updatedTarget.specialties)) : null)
    }
  }
}, [tacticalData])
```

#### 步骤 2：确保 targets 依赖正确

检查 `targets` 的 `useMemo` 是否正确依赖 `tacticalData`。

#### 步骤 3：测试验证

1. 打开知识图谱页面
2. 点击某个母题打开弹窗
3. 点击右上角"初始化"按钮
4. 在初始化弹窗中修改该母题的等级灯
5. 关闭初始化弹窗
6. 验证母题弹窗中的等级灯是否同步更新

## 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `src/components/HoloMap.jsx` | 添加 useEffect 监听 tacticalData 变化 |

## 注意事项

1. 避免无限循环：useEffect 的依赖应该是 `tacticalData`，而不是 `targets`
2. 保持用户编辑状态：如果用户正在编辑 `previewSpecialties`，不应该覆盖
3. 性能考虑：使用浅比较判断是否需要更新
