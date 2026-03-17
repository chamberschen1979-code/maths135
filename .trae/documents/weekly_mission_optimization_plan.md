# 周度任务页面优化计划

## 任务概述
优化周度任务页面的多个功能点，包括样题参考弹窗、任务持久化、来源标识和打印功能。

## 具体修改项

### 1. 样题参考弹窗优化
**文件**: `src/components/weekly/TaskDisplay.jsx`

**修改内容**:
删除"参考母题样题"标题和"题目"之间的冗余内容：
- 删除专项名称标签（如"数量积的核心度量"）
- 删除变例名称标签（如"投影向量与夹角范围"）
- 删除等级标签（如"L3"）
- 删除"🎯 [逻辑核心]..."这一行

保留：
- 标题"参考母题样题"
- 【题目】区块
- 核心思路、解析步骤、避坑指南
- 变量因子和杀手锏（在弹窗底部）

### 2. 周度任务持久化
**文件**: `src/App.jsx`, `src/components/WeeklyMissionNew.jsx`

**问题**: 切换页面后 `generatedTasks` 状态丢失

**解决方案**:
- 在 App.jsx 中添加 `weeklyTasks` 状态管理
- 将任务状态提升到 App.jsx 层级
- 通过 props 传递给 WeeklyMissionNew 组件

### 3. 出题区域来源标识
**文件**: `src/components/weekly/TaskDisplay.jsx`

**修改内容**:
- 在任务卡片上显示来源标签（错题/自选/强化）
- 显示母题名称和专项名称
- 已有 `getSourceBadge` 函数，需确保数据正确传递

### 4. 打印任务页面题干显示
**文件**: `src/components/weekly/PrintPreview.jsx`

**修改内容**:
- 修复题干获取逻辑：`task.variant?.question || task.problem || task.question`
- 确保正确获取 AI 生成的题干内容

## 实施步骤

1. 修改 TaskDisplay.jsx 样题参考弹窗（删除冗余标签和逻辑核心行）
2. 修改 PrintPreview.jsx 题干显示
3. 在 App.jsx 中添加 weeklyTasks 状态持久化
4. 修改 WeeklyMissionNew.jsx 接收和更新持久化任务
5. 验证构建和功能
