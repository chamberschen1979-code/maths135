# AI 诊断结构化匹配方案实施计划（最终版）

## 方案可行性分析

### ⚠️ 用户方案需要调整的地方

用户方案中有一个关键问题：**`fs`** **模块不能在前端使用**。

```javascript
// ❌ 错误：fs 是 Node.js 模块，浏览器环境不支持
const fs = require('fs');
const files = fs.readdirSync(dataDir);
```

### ✅ 正确的实现方式

使用 Vite 的 `import.meta.glob` 在构建时扫描文件：

```javascript
// ✅ 正确：Vite 支持 import.meta.glob
const motifModules = import.meta.glob('/src/data/M*.json');
```

***

## 最终实施方案

### 第一步：创建结构提取工具函数

**文件**：`src/utils/motifStructureExtractor.js`

**核心特性**：

* 使用 `import.meta.glob` 自动扫描所有 M\*.json 文件

* 提取专项、变例、难度、关键词信息

* 缓存机制避免重复加载

* 支持动态添加新母题（无需修改代码）

```javascript
// motifStructureExtractor.js
const motifModules = import.meta.glob('/src/data/M*.json');

let structureCache = null;
let motifListCache = null;

export const buildStructurePrompt = async () => {
  if (structureCache) return structureCache;
  
  let promptContent = '\n【可选母题结构列表 - 必须从中选择】\n';
  
  const motifIds = Object.keys(motifModules)
    .map(path => path.match(/M(\d+)\.json$/)?.[0]?.replace('.json', ''))
    .filter(Boolean)
    .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
  
  for (const motifId of motifIds) {
    const module = await motifModules[`/src/data/${motifId}.json`]();
    const data = module.default || module;
    
    promptContent += `\n[${data.motif_id}] ${data.motif_name}\n`;
    
    data.specialties?.forEach(spec => {
      promptContent += `  ${spec.spec_id} ${spec.spec_name}\n`;
      
      spec.variations?.forEach(vari => {
        const difficulties = extractDifficulties(vari);
        const keywords = vari.keywords ? ` [关键词: ${vari.keywords.join(',')}]` : '';
        promptContent += `    ${vari.var_id} ${vari.name}${keywords} → 支持: ${difficulties}\n`;
      });
    });
  }
  
  structureCache = promptContent;
  return promptContent;
};

const extractDifficulties = (variation) => {
  const levels = new Set();
  variation.original_pool?.forEach(q => {
    if (q.level) levels.add(q.level);
  });
  return levels.size > 0 ? [...levels].sort().join('/') : 'L2/L3/L4';
};

export const getMotifList = async () => {
  if (motifListCache) return motifListCache;
  
  const motifIds = Object.keys(motifModules)
    .map(path => path.match(/M(\d+)\.json$/)?.[0]?.replace('.json', ''))
    .filter(Boolean)
    .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
  
  motifListCache = motifIds;
  return motifIds;
};
```

### 第二步：修改 AI 诊断服务

**文件**：`src/services/aiVisionService.js`

**修改内容**：

1. **导入结构提取函数**

```javascript
import { buildStructurePrompt } from '../utils/motifStructureExtractor';
```

1. **创建动态 Prompt 生成函数**

```javascript
const buildDiagnosisPrompt = async () => {
  const structureInfo = await buildStructurePrompt();
  
  return `你是高中数学 AI 诊断专家。请分析以下识别到的题目文本。

【任务目标】
确定该题目所属的母题(Motif)、专项(Specialty)、变例(Variation)及难度(Difficulty)。

${structureInfo}

【严格约束】
1. 母题选择：必须从上述列表的 [Mxx] 中选择一个最匹配的。
2. 专项/变例选择：
   - 必须先确定母题，然后在该母题的专项列表中选择 specId。
   - 必须在选定的专项中选择存在的 varId。
   - 严禁编造列表中不存在的 ID（例如：如果 M08 只有 2.1，绝不能返回 2.3）。
3. 难度评估：
   - 必须参考"支持难度"列表。
   - 如果题目看起来很难，但该变例不支持 L4，请选择该变例支持的最高难度。

【输出格式】
纯 JSON 格式：
{
  "questionText": "题干内容",
  "motifId": "M08",
  "specId": "V2",
  "varId": "2.2",
  "difficulty": "L3"
}`;
};
```

1. **修改 diagnoseError 函数**

```javascript
export const diagnoseError = async (base64Image) => {
  try {
    const prompt = await buildDiagnosisPrompt();
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: 'image/jpeg', data: base64Image } }
          ]
        }]
      })
    });
    
    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // 保留验证逻辑作为保底
      return await validateAndEnrich(parsed);
    }
    
    throw new Error('无法解析 AI 响应');
  } catch (error) {
    console.error('诊断失败:', error);
    throw error;
  }
};
```

### 第三步：保留验证逻辑作为保底

即使 Prompt 注入了完整列表，AI 仍可能出错，所以保留现有的验证逻辑：

```javascript
const validateAndEnrich = async (result) => {
  const { loadMotifData } = await import('../utils/dataLoader');
  const motifData = await loadMotifData(result.motifId);
  
  if (!motifData) {
    return { ...result, error: '母题不存在' };
  }
  
  // 验证 specId
  const specialty = motifData.specialties?.find(s => s.spec_id === result.specId);
  if (!specialty) {
    // 自动修正为第一个专项
    result.specId = motifData.specialties?.[0]?.spec_id;
    result.autoCorrected = true;
  }
  
  // 验证 varId
  const variation = specialty?.variations?.find(v => v.var_id === result.varId);
  if (!variation && specialty?.variations?.length > 0) {
    result.varId = specialty.variations[0].var_id;
    result.autoCorrected = true;
  }
  
  return result;
};
```

***

## 文件修改清单

| 文件                                     | 操作     | 说明                          |
| -------------------------------------- | ------ | --------------------------- |
| `src/utils/motifStructureExtractor.js` | **新建** | 结构提取工具（使用 import.meta.glob） |
| `src/services/aiVisionService.js`      | **修改** | Prompt 动态生成 + 诊断逻辑          |

***

## 工作流程图

```
用户上传图片
     ↓
aiVisionService.diagnoseError()
     ↓
buildDiagnosisPrompt() ← buildStructurePrompt()
     ↓                       ↓
组装 Prompt            import.meta.glob 扫描 M01-M17
     ↓                       ↓
包含完整结构列表的 Prompt   提取专项/变例/难度/关键词
     ↓
AI 大模型处理
     ↓
返回 JSON 结果
     ↓
validateAndEnrich() 保底验证
     ↓
返回最终诊断结果
```

***

## 预期效果对比

### 改进前

```
AI 返回: { motifId: "M08", specId: "V2", varId: "2.3", difficulty: "L4" }
代码验证: 2.3 不存在 → 自动修正为 2.1
问题: AI 瞎编了不存在的 ID，修正后可能不准确
```

### 改进后

```
Prompt 注入:
【M08 数列】
  V1 等差数列
    1.1 通项公式 [关键词: 等差,公差] → 支持: L2/L3
    1.2 求和公式 [关键词: 求和,Sn] → 支持: L2/L3/L4
  V2 等比数列
    2.1 通项公式 [关键词: 等比,公比] → 支持: L2/L3
    2.2 错位相减 [关键词: 错位相减,求和] → 支持: L3/L4

AI 看到 Prompt: M08/V2 只有 2.1 和 2.2
AI 看到"错位相减"关键词 → 匹配 2.2
AI 返回: { motifId: "M08", specId: "V2", varId: "2.2", difficulty: "L3" }
结果: 精准匹配，无需修正
```

***

## 关键改进点

| 改进点       | 说明                                   |
| --------- | ------------------------------------ |
| **去硬编码**  | 使用 `import.meta.glob` 自动扫描，新增母题无需改代码 |
| **全量覆盖**  | M01-M17 全部加载，一个不漏                    |
| **关键词辅助** | 提取 keywords 字段，帮助 AI 精准匹配变例          |
| **难度约束**  | 从 original\_pool 提取实际支持的难度级别         |
| **缓存优化**  | 结构信息只加载一次，后续使用缓存                     |
| **保底验证**  | 保留验证逻辑，防止 AI 仍返回无效 ID                |

***

## 风险与对策

| 风险         | 对策               |
| ---------- | ---------------- |
| 首次加载较慢     | 使用缓存，只加载一次       |
| Prompt 过长  | 只列出 ID、名称、关键词、难度 |
| AI 仍可能忽略列表 | 保留现有验证逻辑作为保底     |
| JSON 格式变化  | 添加容错处理，缺失字段使用默认值 |

