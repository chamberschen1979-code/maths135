# M04 初始化弹窗等级状态灯不显示问题修复计划

## 🔍 问题分析

### 根本原因

`InitModal.jsx` 第 194-201 行的检测逻辑：

```javascript
if (motifData?.specialties) {
  motifData.specialties.forEach(spec => spec.variations?.forEach(v => {
    v.master_benchmarks?.forEach(b => {  // ← 问题在这里
      if (b.level === 'L2') hasL2 = true
      if (b.level === 'L3') hasL3 = true
      if (b.level === 'L4') hasL4 = true
    })
  }))
}
```

**问题**：M04.json 已升级为 RAG 格式，只有 `original_pool` 字段，没有 `master_benchmarks` 字段。因此 `hasL2/hasL3/hasL4` 始终为 `false`，导致灯不显示。

### 数据结构对比

| 字段 | M01-M03, M05-M17 | M04 (RAG 格式) |
|------|------------------|----------------|
| `specialties` | ✅ 有 | ✅ 有 |
| `variations[].master_benchmarks` | ✅ 有 | ❌ 无 |
| `variations[].original_pool` | ✅ 有 | ✅ 有 |

---

## 🛠️ 解决方案

### 方案 A：修改 `InitModal.jsx` 检测逻辑（推荐）

**优点**：
- 兼容新旧两种格式
- 不需要修改 M04.json 数据结构
- 符合 RAG 架构设计

**修改内容**：

```javascript
// 修改前 (第 194-201 行)
if (motifData?.specialties) {
  motifData.specialties.forEach(spec => spec.variations?.forEach(v => {
    v.master_benchmarks?.forEach(b => {
      if (b.level === 'L2') hasL2 = true
      if (b.level === 'L3') hasL3 = true
      if (b.level === 'L4') hasL4 = true
    })
  }))
}

// 修改后
if (motifData?.specialties) {
  motifData.specialties.forEach(spec => spec.variations?.forEach(v => {
    // 优先检查 master_benchmarks (旧格式)
    if (v.master_benchmarks) {
      v.master_benchmarks.forEach(b => {
        if (b.level === 'L2') hasL2 = true
        if (b.level === 'L3') hasL3 = true
        if (b.level === 'L4') hasL4 = true
      })
    }
    // 兼容 RAG 格式：检查 original_pool
    if (v.original_pool) {
      v.original_pool.forEach(q => {
        if (q.level === 'L2') hasL2 = true
        if (q.level === 'L3') hasL3 = true
        if (q.level === 'L4') hasL4 = true
      })
    }
  }))
}
```

---

### 方案 B：在 M04.json 中添加 `master_benchmarks` 占位符

**优点**：
- 不需要修改前端代码
- 保持与旧格式完全兼容

**缺点**：
- 数据冗余
- 需要维护两套数据结构

**不推荐原因**：RAG 架构设计目标是简化数据结构，不应为了兼容旧代码而添加冗余字段。

---

## 📋 执行步骤

### 步骤 1：修改 `InitModal.jsx`

**文件**：`src/components/InitModal.jsx`

**修改位置**：第 194-206 行

**修改内容**：同时检查 `master_benchmarks` 和 `original_pool`

### 步骤 2：测试验证

1. 刷新页面
2. 打开初始化弹窗
3. 确认 M04 的 L2/L3/L4 状态灯正常显示

---

## 📝 修改代码

```javascript
// src/components/InitModal.jsx 第 194-206 行

if (motifData?.specialties) {
  motifData.specialties.forEach(spec => spec.variations?.forEach(v => {
    // 兼容旧格式：检查 master_benchmarks
    if (v.master_benchmarks) {
      v.master_benchmarks.forEach(b => {
        if (b.level === 'L2') hasL2 = true
        if (b.level === 'L3') hasL3 = true
        if (b.level === 'L4') hasL4 = true
      })
    }
    // 兼容 RAG 格式：检查 original_pool
    if (v.original_pool) {
      v.original_pool.forEach(q => {
        if (q.level === 'L2') hasL2 = true
        if (q.level === 'L3') hasL3 = true
        if (q.level === 'L4') hasL4 = true
      })
    }
  }))
} else {
  hasL2 = true
  hasL3 = true
  hasL4 = true
}
```

---

## ✅ 预期结果

修改后，M04 的初始化弹窗将正确显示 L2/L3/L4 状态灯，同时保持对旧格式母题（M01-M03, M05-M17）的兼容。
