# App.jsx 拆分计划（优化版）

## 千问建议总结

1. **Context 不应塞在一个文件里** - 应该独立文件，使用 index.js 统一导出
2. **优先级排序** - 先拆 Utils/Data，再拆 UI 组件，再拆业务 Hooks，最后拆 Context
3. **避免过度拆分** - 2000 行代码规模不需要过度细化

---

## 优化后的拆分优先级

### P0: 拆分 Utils 和 Constants（最安全，无副作用）

```
src/
├── constants/
│   └── config.js              # API配置、Prompt模板、常量映射
│
└── utils/
    ├── benchmarkUtils.js      # Benchmark 相关函数
    ├── eloUtils.js            # Elo 计算函数
    └── weaponUtils.js         # 武器相关函数
```

### P1: 拆分 UI 组件（减少渲染代码）

```
src/components/
├── DiagnosisView.jsx          # 诊断视图组件 (~230行)
├── InitModal.jsx              # 初始化弹窗 (~200行)
├── BattleResultModal.jsx      # 战斗结果弹窗 (~80行)
├── LaoQiaoWarning.jsx         # 老乔警告 (~30行)
└── Navigation.jsx             # 导航组件 (~120行)
```

### P2: 拆分业务 Hooks（状态管理）

```
src/hooks/
├── useAppState.js             # UI 状态 (主题、年级、标签页)
├── useTacticalData.js         # 战术数据状态和操作
├── useErrorNotebook.js        # 错题本状态和操作
├── useWeeklyPlan.js           # 每周计划状态和操作
├── useBattle.js               # 战斗/对话逻辑
└── useFileUpload.js           # 文件上传逻辑
```

### P3: 拆分 Context（按需，最后做）

```
src/contexts/
├── ThemeContext.jsx           # 主题 Context (独立文件)
├── GradeContext.jsx           # 年级 Context (独立文件)
└── index.js                   # 统一导出
```

---

## 实施步骤

### 步骤 1: 创建 constants/config.js

**内容：**
- API_KEY, BASE_URL, MODEL_NAME, VISION_MODEL_NAME
- VISION_DIAGNOSIS_PROMPT
- CATEGORY_TO_MOTIF 映射
- DATA_VERSION

**行数：** ~50 行

### 步骤 2: 创建 utils/benchmarkUtils.js

**内容：**
- checkBenchmarkDecay
- checkEncounterDecay
- getAllBenchmarks
- getBenchmarksByLevel
- updateBenchmarkStatus
- updateBenchmarksByLevel
- calculateGearLevelFromSpecialties

**行数：** ~150 行

### 步骤 3: 创建 utils/eloUtils.js

**内容：**
- getLevelSpan
- getMaxEloGain
- calculateEloFromSpecialties
- isEloCappedFromSpecialties
- getEloCeilingFromSpecialties
- calculateDecayedEloFromSpecialties

**行数：** ~150 行

### 步骤 4: 创建 utils/weaponUtils.js

**内容：**
- getWeaponInfo
- getWeaponProficiency
- checkLowProficiencyWarning

**行数：** ~80 行

### 步骤 5: 创建 components/DiagnosisView.jsx

**内容：**
- 整个 DiagnosisView 组件
- AI 诊断界面
- 错题库界面
- 消息列表和输入框

**行数：** ~230 行

### 步骤 6: 创建 components/InitModal.jsx

**内容：**
- 初始化弹窗组件
- 年级切换
- 灯泡状态切换逻辑

**行数：** ~200 行

### 步骤 7: 创建 components/BattleResultModal.jsx

**内容：**
- 战斗结果弹窗
- 等级提升显示
- Elo 变化显示

**行数：** ~80 行

### 步骤 8: 创建 components/LaoQiaoWarning.jsx

**内容：**
- 老乔警告提示组件

**行数：** ~30 行

### 步骤 9: 创建 components/Navigation.jsx

**内容：**
- 侧边导航
- 底部导航
- 年级下拉菜单

**行数：** ~120 行

### 步骤 10: 更新 App.jsx 导入

**内容：**
- 更新所有导入路径
- 使用拆分后的模块

---

## 预期效果

| 阶段 | 文件 | 行数变化 |
|------|------|----------|
| P0完成后 | App.jsx | 2063 → ~1700行 |
| P1完成后 | App.jsx | ~1700 → ~1000行 |
| P2完成后 | App.jsx | ~1000 → ~300行 |
| P3完成后 | App.jsx | ~300 → ~200行 |

---

## 注意事项

1. **每完成一个步骤后测试** - 确保功能正常
2. **保持导入路径简洁** - 使用 index.js 统一导出
3. **Context 最后拆分** - 当前 Theme 和 Grade 逻辑简单，暂不需要独立 Context
4. **避免循环依赖** - Utils 文件不要互相引用

---

## 文件结构预览

```
src/
├── App.jsx                    # 主组件 (~200行)
├── constants/
│   └── config.js              # 配置常量 (~50行)
├── utils/
│   ├── benchmarkUtils.js      # Benchmark 工具 (~150行)
│   ├── eloUtils.js            # Elo 工具 (~150行)
│   └── weaponUtils.js         # 武器工具 (~80行)
├── hooks/
│   └── useTrainingCenterData.js  # 已存在
├── components/
│   ├── DiagnosisView.jsx      # 诊断视图 (~230行)
│   ├── InitModal.jsx          # 初始化弹窗 (~200行)
│   ├── BattleResultModal.jsx  # 战斗结果 (~80行)
│   ├── LaoQiaoWarning.jsx     # 老乔警告 (~30行)
│   ├── Navigation.jsx         # 导航 (~120行)
│   └── ...                    # 其他已存在组件
└── contexts/                  # P3 阶段再创建
    ├── ThemeContext.jsx
    ├── GradeContext.jsx
    └── index.js
```
