# App.jsx 拆分计划

## 当前文件分析

`App.jsx` 共 2063 行，包含以下主要部分：

### 1. 导入部分 (1-18行)
- React 相关
- 第三方库 (ReactMarkdown, pdfjs-dist 等)
- 组件导入
- 工具函数导入

### 2. 常量配置 (20-44行)
- API 配置 (API_KEY, BASE_URL, MODEL_NAME)
- Prompt 模板 (VISION_DIAGNOSIS_PROMPT)
- Elo 相关常量

### 3. 工具函数 (48-394行) - **约 350 行**
- `checkBenchmarkDecay` - benchmark 衰减检查
- `checkEncounterDecay` - encounter 衰减检查
- `getLevelSpan`, `getMaxEloGain` - Elo 计算
- `getAllBenchmarks`, `getBenchmarksByLevel` - benchmark 查询
- `updateBenchmarkStatus`, `updateBenchmarksByLevel` - benchmark 更新
- `calculateGearLevelFromSpecialties` - 等级计算
- `calculateEloFromSpecialties` - Elo 计算
- `isEloCappedFromSpecialties`, `getEloCeilingFromSpecialties` - Elo 上限
- `calculateDecayedEloFromSpecialties` - 衰减 Elo 计算
- `getWeaponInfo`, `getWeaponProficiency` - 武器相关
- `checkLowProficiencyWarning` - 低熟练度警告
- `CATEGORY_TO_MOTIF` - 分类映射

### 4. Context 定义 (396-400行)
- `ThemeContext`
- `GradeContext`

### 5. App 组件状态 (405-527行)
- 主题/年级状态
- 战术数据状态
- 错题本状态
- 每周计划状态
- UI 状态 (activeTab, messages, isLoading 等)

### 6. 业务逻辑函数 (529-1258行) - **约 730 行**
- `generateWeeklyBundle` - 生成每周任务包
- `addErrorToNotebook`, `resolveError` - 错题本操作
- `setActiveMotifs`, `getWeeklyStats` - 每周计划操作
- `callLLM` - LLM 调用
- `processBattleResult` - 战斗结果处理
- `updateTargetData` - 更新目标数据
- `handleBattleComplete` - 战斗完成处理
- `handleCalibrate` - 校准处理
- `handleRecalculateElo` - 重新计算 Elo
- `handleRealDiagnosis` - 视觉诊断
- `handleDiagnosisComplete` - 诊断完成
- `handleGlobalReset` - 全局重置
- `handleFileUpload`, `handleRemoveImage` - 文件上传
- `handleDeployToZone` - 部署到战区
- `handleSelectQuestion` - 选择题目
- `handleSend`, `handleKeyPress` - 发送消息

### 7. DiagnosisView 组件 (1269-1501行) - **约 230 行**
- AI 诊断界面
- 错题库界面
- 消息列表
- 输入框

### 8. 主渲染逻辑 (1503-2060行) - **约 560 行**
- 战斗结果弹窗
- 老乔警告提示
- 侧边导航
- 主内容区
- 底部导航
- 初始化弹窗

---

## 拆分方案

### 第一层：工具函数拆分

| 文件 | 内容 | 行数 |
|------|------|------|
| `src/utils/benchmarkUtils.js` | benchmark 相关函数 | ~100行 |
| `src/utils/eloUtils.js` | Elo 计算函数 | ~150行 |
| `src/utils/weaponUtils.js` | 武器相关函数 | ~80行 |
| `src/constants/config.js` | API配置、Prompt、常量 | ~50行 |

### 第二层：Context 和 Hooks 拆分

| 文件 | 内容 | 行数 |
|------|------|------|
| `src/contexts/AppContext.jsx` | ThemeContext, GradeContext | ~20行 |
| `src/hooks/useAppState.js` | UI 状态管理 | ~50行 |
| `src/hooks/useTacticalData.js` | 战术数据状态和操作 | ~150行 |
| `src/hooks/useErrorNotebook.js` | 错题本状态和操作 | ~50行 |
| `src/hooks/useWeeklyPlan.js` | 每周计划状态和操作 | ~80行 |
| `src/hooks/useBattle.js` | 战斗/对话逻辑 | ~200行 |
| `src/hooks/useFileUpload.js` | 文件上传逻辑 | ~50行 |

### 第三层：组件拆分

| 文件 | 内容 | 行数 |
|------|------|------|
| `src/components/DiagnosisView.jsx` | 诊断视图组件 | ~230行 |
| `src/components/InitModal.jsx` | 初始化弹窗 | ~200行 |
| `src/components/BattleResultModal.jsx` | 战斗结果弹窗 | ~80行 |
| `src/components/LaoQiaoWarning.jsx` | 老乔警告提示 | ~30行 |
| `src/components/Navigation.jsx` | 导航组件 | ~120行 |

---

## 拆分后的 App.jsx 结构

```jsx
// 导入
import { useState, useRef, useEffect, createContext, useContext } from 'react'
import ReactMarkdown from 'react-markdown'
// ... 其他导入

// 常量
import { API_KEY, BASE_URL, MODEL_NAME, VISION_DIAGNOSIS_PROMPT } from './constants/config'
import { LEVEL_THRESHOLDS, DECAY_CONFIG, MASTERY_CONFIG } from './utils/eloUtils'

// 工具函数
import { 
  getAllBenchmarks, 
  calculateGearLevelFromSpecialties, 
  calculateEloFromSpecialties 
} from './utils/benchmarkUtils'
import { getWeaponInfo, checkLowProficiencyWarning } from './utils/weaponUtils'

// Context
import { ThemeContext, GradeContext, useTheme, useGrade } from './contexts/AppContext'

// Hooks
import { useAppState } from './hooks/useAppState'
import { useTacticalData } from './hooks/useTacticalData'
import { useErrorNotebook } from './hooks/useErrorNotebook'
import { useWeeklyPlan } from './hooks/useWeeklyPlan'
import { useBattle } from './hooks/useBattle'
import { useFileUpload } from './hooks/useFileUpload'

// 组件
import TacticalDashboard from './components/TacticalDashboard'
import TrainingCenter from './components/training/TrainingCenter'
import TrainingView from './components/TrainingView'
import StrategyHub from './components/StrategyHub'
import BattleScanner from './components/BattleScanner'
import WeeklyMissionNew from './components/WeeklyMissionNew'
import { ErrorLibrary } from './components/weekly'
import DiagnosisView from './components/DiagnosisView'
import InitModal from './components/InitModal'
import BattleResultModal from './components/BattleResultModal'
import LaoQiaoWarning from './components/LaoQiaoWarning'
import Navigation from './components/Navigation'

function App() {
  // 使用自定义 Hooks
  const { isAcademicMode, setIsAcademicMode, currentGrade, setCurrentGrade, ... } = useAppState()
  const { tacticalData, setTacticalData, handleGlobalReset, handleCalibrate, ... } = useTacticalData()
  const { errorNotebook, addErrorToNotebook, resolveError, ... } = useErrorNotebook()
  const { weeklyPlan, weeklyTasks, generateWeeklyBundle, ... } = useWeeklyPlan()
  const { messages, isLoading, handleSend, callLLM, ... } = useBattle()
  const { selectedImage, handleFileUpload, handleRemoveImage } = useFileUpload()

  // 渲染
  return (
    <ThemeContext.Provider value={{ isAcademicMode, setIsAcademicMode }}>
      <GradeContext.Provider value={{ currentGrade, setCurrentGrade }}>
        {/* ... */}
      </GradeContext.Provider>
    </ThemeContext.Provider>
  )
}
```

---

## 实施步骤

### 步骤 1：创建常量文件
- [ ] 创建 `src/constants/config.js`
- [ ] 移动 API 配置、Prompt 模板、常量

### 步骤 2：创建工具函数文件
- [ ] 创建 `src/utils/benchmarkUtils.js`
- [ ] 创建 `src/utils/eloUtils.js`
- [ ] 创建 `src/utils/weaponUtils.js`
- [ ] 移动相关函数

### 步骤 3：创建 Context 文件
- [ ] 创建 `src/contexts/AppContext.jsx`
- [ ] 移动 ThemeContext, GradeContext

### 步骤 4：创建 Hooks 文件
- [ ] 创建 `src/hooks/useAppState.js`
- [ ] 创建 `src/hooks/useTacticalData.js`
- [ ] 创建 `src/hooks/useErrorNotebook.js`
- [ ] 创建 `src/hooks/useWeeklyPlan.js`
- [ ] 创建 `src/hooks/useBattle.js`
- [ ] 创建 `src/hooks/useFileUpload.js`

### 步骤 5：创建组件文件
- [ ] 创建 `src/components/DiagnosisView.jsx`
- [ ] 创建 `src/components/InitModal.jsx`
- [ ] 创建 `src/components/BattleResultModal.jsx`
- [ ] 创建 `src/components/LaoQiaoWarning.jsx`
- [ ] 创建 `src/components/Navigation.jsx`

### 步骤 6：重构 App.jsx
- [ ] 更新导入
- [ ] 使用自定义 Hooks
- [ ] 简化主组件

---

## 预期效果

| 文件 | 拆分前 | 拆分后 |
|------|--------|--------|
| App.jsx | 2063行 | ~200行 |
| utils/*.js | 0行 | ~350行 |
| hooks/*.js | 0行 | ~580行 |
| components/*.jsx | 已有 | 新增~660行 |

拆分后 App.jsx 将从 2063 行减少到约 200 行，代码结构更清晰，可维护性更高。
