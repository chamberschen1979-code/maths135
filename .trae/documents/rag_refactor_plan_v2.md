# RAG 出题方案文件清理与重构计划（v2.0 优化版）

## 📋 概述

本计划基于原有的 RAG 出题方案清理计划，结合 5 项补充建议进行优化。**M04 题目清洗和重构工作已完成**，本计划聚焦于代码架构优化和系统稳定性保障。

---

## 🎯 核心目标

1. **建立适配层**：统一新旧数据格式，消除代码中的 if/else 兼容判断
2. **保障数据完整性**：增加 Schema 校验，防止垃圾数据进入生产环境
3. **武器库对齐**：确保 M04 中使用的武器 ID 在 strategy_lib.json 中有定义
4. **安全归档**：临时文件归档而非删除，保留回溯能力
5. **温和重构验证器**：入口适配而非内部重构

---

## 📊 当前状态

### M04.json 已完成
- ✅ 题目数量：126 题（L2=42, L3=40, L4=44）
- ✅ 字段标准化：统一使用 `quality_score`
- ✅ 答案占位符：标准化为 `【答案待完善】`、`【需分类讨论求解】` 等

### 其他母题（M01-M03, M05-M17）
- ⚠️ 仍使用旧格式（`variable_knobs`, `level_constraints`）
- ⚠️ 需要适配器支持

---

## 📁 执行阶段

### 阶段 0：安全网构建（优先级：最高）

#### 0.1 创建归档目录

```bash
mkdir -p src/data/_archive_legacy
```

#### 0.2 移动待归档文件

| 文件 | 操作 |
|------|------|
| `src/data/M04_backup_*.json` | 移动到归档目录 |
| `src/data/M04_Master_RAG_backup_*.md` | 移动到归档目录 |
| `src/data/clean_m04_final.py` | 移动到归档目录 |
| `src/data/standardize_m04.py` | 移动到归档目录 |
| `src/data/evaluate_l3.py` | 移动到归档目录 |
| `src/data/migrate_m04_data.py` | 移动到归档目录 |
| `src/data/merge_m04_full.py` | 移动到归档目录 |

#### 0.3 编写 Schema 校验脚本

创建 `src/data/validate_schema.js`：

```javascript
// 校验规则
const REQUIRED_FIELDS = ['id', 'level', 'problem', 'answer'];
const REQUIRED_META = ['core_logic', 'weapons'];

function validateQuestion(q) {
  const errors = [];
  
  // 检查必填字段
  for (const field of REQUIRED_FIELDS) {
    if (!q[field]) errors.push(`缺少字段: ${field}`);
  }
  
  // 检查 meta 字段
  if (q.meta) {
    for (const field of REQUIRED_META) {
      if (!q.meta[field]) errors.push(`缺少 meta.${field}`);
    }
  }
  
  return errors;
}
```

---

### 阶段 1：核心适配层开发（优先级：高）

#### 1.1 创建 dataAdapter.js

**文件路径**：`src/utils/dataAdapter.js`

**职责**：
- 统一输入：接受新旧两种格式的数据
- 统一输出：标准化为 RAG 格式对象

**核心函数**：

```javascript
/**
 * 数据格式适配器 - 统一新旧格式输出
 * @param {Object} rawData - 原始题目数据
 * @returns {Object} 标准化后的题目对象
 */
export function normalizeQuestion(rawData) {
  // 新格式检测：有 meta.weapons 字段
  if (rawData.meta && rawData.meta.weapons) {
    return {
      ...rawData,
      _format: 'RAG',
      weapons: rawData.meta.weapons,
      coreLogic: rawData.meta.core_logic || [],
      trapTags: rawData.meta.trap_tags || [],
      strategyHint: rawData.meta.strategy_hint || 'analysis'
    };
  }
  
  // 旧格式转换：有 variable_knobs 字段
  if (rawData.variable_knobs) {
    return {
      ...rawData,
      _format: 'LEGACY',
      meta: {
        weapons: mapOldKnobsToWeapons(rawData.variable_knobs),
        core_logic: extractCoreLogicFromConstraints(rawData.level_constraints),
        trap_tags: [],
        strategy_hint: 'legacy'
      },
      weapons: mapOldKnobsToWeapons(rawData.variable_knobs)
    };
  }
  
  // 默认返回
  return { ...rawData, _format: 'UNKNOWN' };
}

/**
 * 批量标准化题目池
 */
export function normalizeQuestionPool(pool) {
  return pool.map(normalizeQuestion);
}

/**
 * 旧格式 variable_knobs 到 weapons 的映射
 */
function mapOldKnobsToWeapons(knobs) {
  // 复用 motifWeaponMapper.js 的逻辑
  const mapping = {
    'log_base_change': 'S-LOG-01',
    'exp_log_iso': 'S-LOG-02',
    'composite_mono': 'S-LOG-04',
    // ... 其他映射
  };
  
  return knobs
    .map(k => mapping[k] || 'S-GENERAL-01')
    .filter(Boolean);
}
```

#### 1.2 修改 problemLogic.js

**修改原则**：移除内部 if/else 兼容逻辑，改为调用 dataAdapter

**修改前**：
```javascript
// 问题代码：到处写兼容判断
if (question.variable_knobs) {
  // 旧逻辑
} else if (question.meta) {
  // 新逻辑
}
```

**修改后**：
```javascript
import { normalizeQuestion } from './dataAdapter.js';

// 统一入口：先标准化，再处理
const normalizedQ = normalizeQuestion(question);
// 后续代码只处理标准化后的格式
```

#### 1.3 重构 motifWeaponMapper.js

**修改方案**：
- 将映射逻辑下沉到 `dataAdapter.js`
- 本文件仅作为备用映射表

```javascript
/**
 * 武器映射备用表
 * 注意：优先从 JSON 的 meta.weapons 字段读取
 * 此文件仅作为旧数据的后备映射
 */
export const WEAPON_FALLBACK_MAP = {
  'M04': {
    '1.1': ['S-LOG-01'],
    '1.2': ['S-LOG-02', 'S-INEQ-04'],
    // ...
  }
};

// 主函数改为调用 dataAdapter
export function getWeaponsForMotif(question, motifId, varId) {
  const normalized = normalizeQuestion(question);
  return normalized.weapons || WEAPON_FALLBACK_MAP[motifId]?.[varId] || ['S-GENERAL-01'];
}
```

---

### 阶段 2：依赖项检查（优先级：中）

#### 2.1 武器库对齐检查

创建脚本 `src/data/check_weapons_alignment.js`：

```javascript
import fs from 'fs';

// 读取 M04.json 中使用的所有 weapons ID
const m04Data = JSON.parse(fs.readFileSync('M04.json', 'utf-8'));
const usedWeapons = new Set();

for (const spec of m04Data.specialties) {
  for (const var of spec.variations) {
    for (const q of var.original_pool) {
      if (q.meta?.weapons) {
        q.meta.weapons.forEach(w => usedWeapons.add(w));
      }
    }
  }
}

// 读取 strategy_lib.json 中定义的 weapons ID
const strategyLib = JSON.parse(fs.readFileSync('strategy_lib.json', 'utf-8'));
const definedWeapons = new Set(Object.keys(strategyLib));

// 找出缺失的 weapons
const missing = [...usedWeapons].filter(w => !definedWeapons.has(w));

if (missing.length > 0) {
  console.log('⚠️ 缺失的武器 ID:', missing);
} else {
  console.log('✅ 所有武器 ID 已定义');
}
```

#### 2.2 运行 Schema 校验

```bash
node src/data/validate_schema.js
```

---

### 阶段 3：验证器温和重构（优先级：低）

#### 3.1 保持验证器内部不变

**原则**：暂时不修改 `M04_exp_log_iso.js` 内部逻辑

#### 3.2 入口适配

在调用验证器前，确保数据已被 `dataAdapter` 标准化：

```javascript
// 在 questionVerifier.js 中
import { normalizeQuestion } from './dataAdapter.js';

export function verifyQuestion(rawQuestion, motifData) {
  // 先标准化
  const question = normalizeQuestion(rawQuestion);
  
  // 再调用验证器
  const verifier = getVerifier(motifData.motif_id);
  return verifier(question, motifData);
}
```

#### 3.3 长远目标

等 M01-M17 全部升级为 RAG 格式后，统一将验证器重构为：
- 读取 JSON 中的 `validation_rules` 字段
- 彻底消灭硬编码验证器文件

---

### 阶段 4：最终清理（优先级：最低）

#### 4.1 完整测试

- 测试 L2/L3/L4 各难度出题功能
- 验证新旧格式数据兼容性
- 检查武器提示词生成是否正常

#### 4.2 物理删除归档

确认系统稳定运行 1-2 周后：
```bash
rm -rf src/data/_archive_legacy
```

---

## 📊 文件变更清单

### 新增文件

| 文件 | 用途 |
|------|------|
| `src/utils/dataAdapter.js` | 数据格式适配器 |
| `src/data/validate_schema.js` | Schema 校验脚本 |
| `src/data/check_weapons_alignment.js` | 武器库对齐检查 |
| `src/data/_archive_legacy/` | 归档目录 |

### 修改文件

| 文件 | 修改内容 |
|------|----------|
| `src/utils/problemLogic.js` | 移除 if/else 兼容逻辑，调用 dataAdapter |
| `src/utils/motifWeaponMapper.js` | 重构为备用映射表 |

### 归档文件（移动到 _archive_legacy）

| 文件 | 原因 |
|------|------|
| `M04_backup_*.json` | 备份文件 |
| `M04_Master_RAG_backup_*.md` | 备份文件 |
| `clean_m04_final.py` | 临时脚本 |
| `standardize_m04.py` | 临时脚本 |
| `evaluate_l3.py` | 临时脚本 |
| `migrate_m04_data.py` | 临时脚本 |
| `merge_m04_full.py` | 临时脚本 |

### 保留不变

| 文件 | 原因 |
|------|------|
| `src/data/M04.json` | 已完成升级 |
| `src/data/M04_Master_RAG.md` | 已完成升级 |
| `src/data/strategy_lib.json` | 武器库，仍需使用 |
| `src/services/verifiers/M04_exp_log_iso.js` | 暂不修改内部逻辑 |

---

## ⚠️ 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 适配器转换逻辑错误 | 编写单元测试，覆盖新旧格式转换 |
| 武器 ID 缺失 | 运行对齐检查脚本，补全缺失定义 |
| 验证器入口适配遗漏 | 统一在 questionVerifier.js 入口处理 |
| 归档文件误删 | 保留 1-2 周观察期 |

---

## 📝 执行顺序

```
阶段 0 (安全网) ──→ 阶段 1 (适配层) ──→ 阶段 2 (依赖检查) ──→ 阶段 3 (验证器) ──→ 阶段 4 (清理)
     │                    │                   │                    │                  │
     ▼                    ▼                   ▼                    ▼                  ▼
  创建归档            开发 dataAdapter     武器库对齐           入口适配           测试后删除
  编写校验脚本        修改 problemLogic    运行校验脚本         保持验证器不变      归档目录
```

---

## ✅ 完成标准

- [ ] `dataAdapter.js` 开发完成，通过单元测试
- [ ] `problemLogic.js` 移除所有 if/else 兼容判断
- [ ] Schema 校验脚本运行通过，无缺失字段
- [ ] 武器库对齐检查通过，无缺失 ID
- [ ] L2/L3/L4 出题功能测试通过
- [ ] 临时文件已归档，工作区整洁
