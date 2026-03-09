# 同步 systemPrompt 计划

## 问题分析

WeeklyMission.jsx 中有两个地方定义了 `systemPrompt`：

| 位置 | 行号 | 用途 | 状态 |
|------|------|------|------|
| buildDNAProblem 函数 | 462 | AI 调用时的默认 Prompt | ✅ 已更新 |
| WeeklyMission 组件 | 1232 | 状态变量，显示在"命题引擎配置"面板 | ❌ 未更新 |

用户看到的"命题引擎配置"页面显示的是第 1232 行的状态变量内容，需要同步更新。

## 修复计划

### 步骤 1：更新 WeeklyMission 组件中的 systemPrompt 状态变量

**文件**：`src/components/WeeklyMission.jsx`
**位置**：第 1232 行

将旧的 Prompt：
```
【专家身份】
你是 135+ 高中数学研究院首席命题官。你拥有 20 年高考阅卷经验...
```

替换为新的 Prompt：
```
【专家身份】
你是 135+ 高中数学研究院首席命题官。你不再是盲目生成题目，而是根据提供的【教研变例矩阵】进行精准的"变量旋钮命题"。

【核心命题算法（1+2 阵型）】
...
```

### 步骤 2：验证同步

确保两处 `systemPrompt` 内容完全一致：
- buildDNAProblem 函数中的默认值
- WeeklyMission 组件中的状态变量初始值
