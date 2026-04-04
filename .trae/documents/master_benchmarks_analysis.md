# master_benchmarks 基准题字段调研报告

## 一、M系列文件现状

### M01-M09.json
- **master_benchmarks 字段：已不存在**
- 当前结构：`specialties[].variations[].original_pool`

### M10-M17.json
- **master_benchmarks 字段：已不存在**
- 当前结构：`specialties[].variations[].original_pool`

### tacticalMaps.json
- **master_benchmarks 字段：已不存在**

## 二、代码引用分析

### 引用 master_benchmarks 的文件（共56处）

| 文件 | 引用次数 | 关键用途 |
|------|----------|----------|
| problemLogic.js | 8处 | selectBenchmark 函数，优先从 master_benchmarks 选题 |
| dataLoader.js | 5处 | 提取所有题目时包含 master_benchmarks |
| HoloMap.jsx | 7处 | 全息地图展示题目 |
| App.jsx | 4处 | 数据处理和状态管理 |
| InitModal.jsx | 4处 | 初始化时处理题目 |
| useTrainingCenterData.js | 3处 | 训练中心数据 |
| migrateDataStructure.js | 9处 | 数据迁移逻辑 |
| benchmarkUtils.js | 5处 | 基准题工具函数 |
| eloEngine.js | 1处 | ELO积分引擎 |
| feedbackGenerator.js | 2处 | 反馈生成 |
| BattleScanner.jsx | 1处 | 战斗扫描器 |
| WeeklyMissionNew.jsx | 32处 | 每周任务出题（间接引用） |

### 代码防御性写法
```javascript
// 典型的防御性写法
const benchmarks = v.master_benchmarks || []
const pool = v.original_pool || []
```

## 三、selectBenchmark 选题优先级

```
1. 杀手锏匹配的题目（weaponMatchedPool）
2. 匹配难度等级的 master_benchmarks
3. 匹配难度等级的 original_pool
4. 其他难度等级的 master_benchmarks
5. 其他难度等级的 original_pool
6. 返回 null
```

## 四、问题根因分析

### 为什么删除 master_benchmarks 后会出错？

1. **代码逻辑依赖**：虽然代码有防御性写法，但某些逻辑可能隐式依赖 master_benchmarks 的存在

2. **数据结构差异**：
   - `original_pool` 题目格式：`{id, problem, answer, level, ...}`
   - `master_benchmarks` 题目格式：`{id, problem, level, logic_key, is_mastered, ...}`
   - 某些字段可能只在 master_benchmarks 中存在

3. **初始化流程**：InitModal.jsx 在初始化时会遍历 master_benchmarks，如果为空可能影响某些初始化逻辑

## 五、建议方案

### 方案A：保留 master_benchmarks（推荐）
- 不删除该字段
- 确保每个 variation 都有 master_benchmarks
- 与 original_pool 保持数据一致性

### 方案B：彻底移除并修改代码
- 需要修改所有56处引用
- 确保所有逻辑都能正确处理空数组
- 测试所有功能模块

### 方案C：数据迁移
- 将 master_benchmarks 的数据合并到 original_pool
- 修改代码只使用 original_pool
- 需要大量测试

## 六、当前状态

- M01-M17 所有文件都已没有 master_benchmarks 字段
- 代码仍然引用该字段，但使用防御性写法
- 如果出题正常，说明代码已正确处理空数组情况
