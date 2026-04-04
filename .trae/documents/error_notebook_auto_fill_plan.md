# 错题库自动补全答案和解析计划

## 需求分析

**当前流程**：
1. 上传截图 → AI诊断 → 自动进入错题库（只有题干，没有答案和解析）
2. 点击"入库" → AI补全完整 RAG 字段

**用户期望**：
1. 上传截图 → AI诊断 → 自动进入错题库时，**AI 自动补全答案和解析**
2. 点击"入库" → AI补全其他字段（如 id、weapons、key_points 等）

## 技术方案

利用已有的 `aiFillAnswerAndKeyPoints` 函数，在诊断完成后自动调用补全答案和解析。

## 实现步骤

### 1. 修改 `handleRealDiagnosis` 函数

在 `src/App.jsx` 中，诊断完成后调用 `aiFillAnswerAndKeyPoints`：

```javascript
import { aiFillAnswerAndKeyPoints } from './utils/aiFillUtils'

const handleRealDiagnosis = async (base64Data) => {
  // ... 现有诊断逻辑 ...
  
  if (result && result.classification) {
    // 调用 AI 补全答案和解析
    const fillResult = await aiFillAnswerAndKeyPoints(
      result.questionText,
      result.classification.motifName
    )
    
    const errorEntry = {
      // ... 现有字段 ...
      correctAnswer: fillResult?.answer || '',
      diagnosis: fillResult?.key_points?.join('\n') || result.diagnosis?.message || '',
      // ...
    }
    
    setErrorNotebook(prev => [...(prev || []), errorEntry])
  }
}
```

### 2. 区分两种补全场景

| 场景 | 函数 | 补全内容 |
|------|------|----------|
| 自动进错题库 | `aiFillAnswerAndKeyPoints` | 答案、关键步骤 |
| 点击入库 | `aiFillFullRagFields` | id、weapons、key_points、answer 等 RAG 字段 |

### 3. 优化用户体验

- 显示"AI 正在补全答案和解析..."的加载提示
- 补全失败时使用默认值，不影响主流程

## 文件修改

### `src/App.jsx`
- 导入 `aiFillAnswerAndKeyPoints`
- 在 `handleRealDiagnosis` 中调用补全函数
- 更新 `errorEntry` 的 `correctAnswer` 和 `diagnosis` 字段

## 注意事项

1. 补全是异步的，需要等待完成后再添加到错题库
2. 补全失败时使用空字符串作为默认值
3. 不影响现有的诊断流程
