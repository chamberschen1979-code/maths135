# JSON 解析错误修复计划

## 问题诊断

**错误信息**：
```
JSON 格式严重错误: Bad escaped character in JSON at position 1221
```

**原因**：AI 返回的 JSON 中包含非法转义字符，当前的修复逻辑不够全面。

---

## 当前修复逻辑的不足

当前只处理了特定的 LaTeX 命令：
```javascript
jsonString.replace(/(?<!\\)\\(frac|sqrt|sum|...)/g, '\\\\$1')
```

但遗漏了：
1. `\{` 和 `\}` - 花括号转义
2. `\n` - 换行符（AI 可能误用）
3. 其他未列出的 LaTeX 命令

---

## 修复方案

### 方案：增强 JSON 修复逻辑

在 `responseParser.js` 中添加更全面的修复：

```javascript
const fixJsonEscaping = (jsonString) => {
  let fixed = jsonString

  // 1. 修复未转义的花括号 \{ \} -> \\{ \\}
  fixed = fixed.replace(/(?<!\\)\\{/g, '\\\\{')
  fixed = fixed.replace(/(?<!\\)\\}/g, '\\\\}')

  // 2. 修复 LaTeX 命令
  const latexCommands = [
    'frac', 'sqrt', 'sum', 'int', 'infty', 'geq', 'leq', 'cdot', 'times', 'div',
    'alpha', 'beta', 'gamma', 'delta', 'Delta', 'pi', 'theta', 'lambda', 'mu',
    'sigma', 'Omega', 'omega', 'mathbb', 'mathbf', 'text', 'dots', 'cdots', 'ldots',
    'quad', 'qquad', 'left', 'right', 'mid', 'sin', 'cos', 'tan', 'log', 'ln',
    'lim', 'vec', 'hat', 'bar', 'overline', 'underline', 'partial', 'nabla'
  ]
  const cmdPattern = latexCommands.join('|')
  fixed = fixed.replace(new RegExp(`(?<!\\\\)\\\\(${cmdPattern})`, 'g'), '\\\\$1')

  // 3. 修复字符串内的裸露反斜杠（非标准转义）
  // 将 \x (非标准转义) 替换为 \\x
  fixed = fixed.replace(/(?<!\\)\\([^"\\\/bfnrtu])/g, '\\\\$1')

  return fixed
}
```

---

## 实施步骤

1. 更新 `src/utils/responseParser.js`，添加 `fixJsonEscaping` 函数
2. 在 JSON 解析失败时调用该函数
3. 增加错误日志输出原始内容片段，便于调试
4. 运行测试验证

---

## 文件变更

| 操作 | 文件 |
|------|------|
| 修改 | `src/utils/responseParser.js` |
