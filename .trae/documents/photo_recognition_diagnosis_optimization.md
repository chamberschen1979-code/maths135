# 拍照识别与错题诊断优化方案

## 问题分析

### 当前系统架构
```
母题 (M01-M17)
  └── 专项 (V1, V2, ...)
       └── 变例 (1.1, 1.2, ...)
```

杀手锏库 (strategy_lib.json) 与母题关联，包含 trigger_keywords。

### 两种拍照场景对比

| 场景 | 目的 | 关键识别对象 | 当前问题 |
|------|------|-------------|---------|
| 拍照录入答案 | AI评分 | 学生答案内容 | ✅ 基本OK |
| 拍照导入错题 | 诊断分类 | **题干内容** | ❌ 精度不足 |

### 当前 DIAGNOSIS_PROMPT 的问题

1. **只返回母题ID**：没有返回专项ID、变例ID
2. **没有识别题干**：只判断"属于哪个母题"，没有提取题目内容
3. **没有利用杀手锏关键词**：strategy_lib.json 中的 trigger_keywords 未被使用
4. **诊断信息不足**：只返回 message，没有具体的知识点分析

## 改进方案

### 方案一：增强错题诊断 Prompt

**核心思路**：错题诊断的重点是识别题干类型，而不是学生答案

```javascript
const DIAGNOSIS_PROMPT_V2 = `你是高中数学教研专家。请分析这道错题图片。

【任务】
1. 识别题干内容（OCR提取）
2. 判断题目类型（母题/专项/变例）
3. 识别涉及的知识点
4. 推荐相关杀手锏

【输出格式】纯JSON：
{
  "questionText": "提取的题干内容",
  "targetId": "M01",
  "targetName": "集合、逻辑用语与复数",
  "specId": "V1",
  "specName": "集合的运算与关系",
  "variationId": "1.1",
  "variationName": "基本运算与要素识别",
  "keyPoints": ["知识点1", "知识点2"],
  "difficulty": "L2",
  "suggestedWeapons": ["S-SET-01", "S-SET-02"],
  "trapType": "空集陷阱",
  "message": "诊断评语"
}

【母题列表】
M01 集合、逻辑与复数, M02 不等式性质, M03 函数概念与性质, M04 指对数函数, M05 平面向量,
M06 三角函数基础, M07 解三角形综合, M08 数列基础与求和, M09 立体几何基础, M10 解析几何基础,
M11 导数工具基础, M12 概率与统计, M13 解析几何压轴, M14 导数综合压轴, M15 数列综合压轴,
M16 计数原理, M17 创新思维与情境`
```

### 方案二：两阶段诊断流程

**阶段一：题干识别**
- 使用视觉模型识别题干内容
- 提取关键数学表达式和条件

**阶段二：分类匹配**
- 基于题干内容匹配母题/专项/变例
- 结合 killer_keywords 提高匹配精度

```javascript
export const diagnoseErrorV2 = async (base64Image) => {
  // 阶段一：OCR识别题干
  const ocrResult = await extractQuestionText(base64Image)
  
  // 阶段二：分类匹配
  const classification = await classifyQuestion(ocrResult.questionText)
  
  // 阶段三：推荐杀手锏
  const weapons = await recommendWeapons(classification)
  
  return {
    ...ocrResult,
    ...classification,
    suggestedWeapons: weapons
  }
}
```

### 方案三：利用杀手锏关键词库

**思路**：strategy_lib.json 中每个杀手锏都有 trigger_keywords，可以用这些关键词来匹配题目

```javascript
const buildKeywordMatcher = (strategyLib) => {
  const keywordMap = new Map()
  
  strategyLib.categories.forEach(cat => {
    cat.weapons.forEach(weapon => {
      weapon.trigger_keywords.forEach(keyword => {
        if (!keywordMap.has(keyword)) {
          keywordMap.set(keyword, [])
        }
        keywordMap.get(keyword).push({
          weaponId: weapon.id,
          weaponName: weapon.name,
          motifIds: weapon.linked_motifs.map(m => m.id)
        })
      })
    })
  })
  
  return keywordMap
}

const matchWeaponsByKeywords = (questionText, keywordMap) => {
  const matches = []
  
  keywordMap.forEach((weapons, keyword) => {
    if (questionText.includes(keyword)) {
      matches.push({ keyword, weapons })
    }
  })
  
  return matches
}
```

## 实施步骤

### 步骤一：更新 DIAGNOSIS_PROMPT
- 增加题干提取要求
- 增加专项/变例识别
- 增加杀手锏推荐

### 步骤二：创建分类匹配函数
- 实现 `classifyQuestion` 函数
- 基于题干内容匹配母题/专项/变例

### 步骤三：集成杀手锏关键词
- 加载 strategy_lib.json 的 trigger_keywords
- 实现关键词匹配逻辑

### 步骤四：优化错题本数据结构
- 增加 specId、variationId 字段
- 增加 suggestedWeapons 字段
- 增加 keyPoints 字段

### 步骤五：更新周度任务生成
- 基于诊断结果生成针对性任务
- 优先推荐相关杀手锏

## 预期效果

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 识别层级 | 只有母题 | 母题+专项+变例 |
| 题干提取 | 无 | 完整提取 |
| 杀手锏推荐 | 无 | 基于关键词匹配 |
| 任务针对性 | 一般 | 精准定位 |

## 关键洞察

用户提出的核心观点：
> "错题回答的怎么样（字体潦草）并不重要，重要的是他错了，所以识别题干的类型更重要"

这个观点非常正确！错题诊断的核心目标是：
1. **识别题目类型** → 知道是哪个知识点的题
2. **推荐学习资源** → 推荐相关杀手锏
3. **生成针对性任务** → 周度任务来源

而不是：
- 评判学生答案的对错（已经知道是错题了）
- 识别潦草的字迹（不重要）
