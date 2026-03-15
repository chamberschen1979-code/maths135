# responseParser.js 代码评估报告

## 一、整体评估

### ✅ 优点

| 优点 | 说明 |
|------|------|
| 模块化设计 | 职责单一，易于测试 |
| 暴力提取 JSON | 策略正确，能处理模型输出废话的情况 |
| LaTeX 清洗管道 | 设计合理，处理常见问题 |
| 错误处理完善 | 返回统一的对象结构 |
| Reasoning 字段清洗 | 移除 LaTeX，确保纯文本 |

### ⚠️ 需要修复的问题

#### 问题 1：模板字符串语法错误

**原代码**：
```javascript
throw new Error(`JSON 格式严重错误: $ {e.message}`);
```

**问题**：`${}` 中间有空格，会导致模板字符串解析错误。

**修复**：
```javascript
throw new Error(`JSON 格式严重错误: ${e.message}`);
```

#### 问题 2：双重包裹修复正则

**原代码**：
```javascript
cleaned = cleaned.replace(/\$\s*\$(.*?)\$\s*\$/g, '$$$1$$');
```

**问题**：替换结果 `$$$1$$` 不正确，应该是 `$$1$`。

**修复**：
```javascript
cleaned = cleaned.replace(/\$\s*\$(.*?)\$\s*\$/g, '$$$1$');
```

#### 问题 3：cleanReasoning 函数未处理数组

**原代码**：
```javascript
const cleanReasoning = (obj) => {
  if(typeof obj === 'string') return obj.replace(/\$/g, '');
  if(typeof obj === 'object' && obj !== null) {
     Object.keys(obj).forEach(k => obj[k] = cleanReasoning(obj[k]));
  }
  return obj;
};
```

**问题**：如果值是数组，`Object.keys` 不会遍历数组元素。

**修复**：
```javascript
const cleanReasoning = (obj) => {
  if (typeof obj === 'string') return obj.replace(/\$/g, '');
  if (Array.isArray(obj)) return obj.map(item => cleanReasoning(item));
  if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach(k => obj[k] = cleanReasoning(obj[k]));
  }
  return obj;
};
```

---

## 二、修复后的完整代码

```javascript
// src/utils/responseParser.js

const sanitizeLatex = (str) => {
  if (!str) return str;

  let cleaned = str;

  // 1. 去除 Markdown 代码块标记
  cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');

  // 2. 修复双重包裹: $ $...$ $ -> $...$
  cleaned = cleaned.replace(/\$\s*\$(.*?)\$\s*\$/g, '$$$1$');

  // 3. 修复连续的 $$ (行内公式误用为行间)
  cleaned = cleaned.replace(/\$\$/g, '$');

  return cleaned;
};

const extractJsonString = (rawText) => {
  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("未在响应中找到有效的 JSON 花括号结构");
  }

  return rawText.substring(firstBrace, lastBrace + 1);
};

const cleanReasoning = (obj) => {
  if (typeof obj === 'string') return obj.replace(/\$/g, '');
  if (Array.isArray(obj)) return obj.map(item => cleanReasoning(item));
  if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach(k => obj[k] = cleanReasoning(obj[k]));
  }
  return obj;
};

export const parseAIResponse = (rawText) => {
  try {
    // Step 1: 提取 JSON 子串
    const jsonString = extractJsonString(rawText);

    // Step 2: 尝试解析 JSON
    let parsedObj;
    try {
      parsedObj = JSON.parse(jsonString);
    } catch (e) {
      // 启发式修复：将单独出现的 \ 后面跟字母的，变成 \\
      const fixedString = jsonString.replace(/(?<!\\)\\(frac|sqrt|sum|int|infty|geq|leq|cdot|times|div|alpha|beta|gamma|delta|Delta|pi|theta|lambda|mu|sigma|Omega|omega|mathbb|mathbf|text|dots|cdots|ldots|quad|qquad|left|right|{|}|^|_|mid)/g, '\\\\$1');

      try {
        parsedObj = JSON.parse(fixedString);
        console.warn("JSON 解析经过自动修复成功");
      } catch (e2) {
        throw new Error(`JSON 格式严重错误: ${e.message}`);
      }
    }

    // Step 3: 验证必要字段
    if (!parsedObj.question || !parsedObj.analysis || !parsedObj.answer) {
      throw new Error("JSON 结构缺失必要字段 (question/analysis/answer)");
    }

    // Step 4: 清洗 LaTeX 内容
    if (parsedObj.question.content) {
      parsedObj.question.content = sanitizeLatex(parsedObj.question.content);
    }
    if (parsedObj.analysis.steps && Array.isArray(parsedObj.analysis.steps)) {
      parsedObj.analysis.steps = parsedObj.analysis.steps.map(step => sanitizeLatex(step));
    }
    if (parsedObj.answer) {
      Object.keys(parsedObj.answer).forEach(key => {
        parsedObj.answer[key] = sanitizeLatex(parsedObj.answer[key]);
      });
    }

    // Step 5: Reasoning 字段强制纯文本
    if (parsedObj.reasoning) {
      parsedObj.reasoning = cleanReasoning(parsedObj.reasoning);
    }

    return { success: true, data: parsedObj };

  } catch (error) {
    console.error("解析失败详情:", error.message);
    return {
      success: false,
      error: error.message,
      rawPreview: rawText.substring(0, 300)
    };
  }
};
```

---

## 三、结论

### 评估结果：✅ 代码合理，需要小修复

| 问题 | 修复方案 |
|------|----------|
| 模板字符串语法 | 移除 `${}` 中的空格 |
| 双重包裹修复 | 修正替换结果 |
| cleanReasoning | 添加数组处理 |

### 建议：使用修复后的代码
