# 完善数据驱动的动态标题计划

## 背景

用户希望将顶部 Banner 的副标题从固定文本改为动态显示，使用 M11.json 中的 `motif_name` 和 `logic_schema_version` 字段。

## 当前状态

**M11.json 中的字段**:
```json
{
  "motif_name": "导数工具基础",
  "logic_schema_version": "9.5-DEEP-SYNC-NATIONAL"
}
```

**当前代码** (第 3231-3233 行):
```jsx
<p className="text-sm text-gray-500 mt-1">
  生成时间：{bundle ? new Date(bundle.generatedAt).toLocaleDateString('zh-CN') : ''}
</p>
```

## 目标效果

```
数学无忧 · 周度练习包
导数工具基础 · 9.5-DEEP-SYNC-NATIONAL 深度同步版 | 生成时间：2026/03/08
```

## 实施步骤

1. [ ] 修改顶部 Banner 副标题，添加动态字段显示
   - 位置：第 3231-3233 行
   - 添加 `{M11Data.motif_name} · {M11Data.logic_schema_version} 深度同步版`
   - 保留原有的生成时间显示

2. [ ] 运行 lint 检查确保无语法错误
