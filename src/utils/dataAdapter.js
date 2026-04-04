/**
 * 数据格式适配器 (Data Adapter)
 *
 * 职责：
 * 1. 接收任意格式的题目数据 (新 RAG 格式 或 旧 variable_knobs 格式)
 * 2. 输出统一的标准化对象 (Standardized Question Object)
 * 3. 自动补全缺失的 meta 信息 (利用 motifWeaponMap 兜底)
 */

import { motifWeaponMap } from './motifWeaponMapper.js';

/**
 * 尝试从旧格式的 variable_knobs 推断武器
 * 策略：
 * 1. 如果题目属于某个母题，且该母题在 motifWeaponMap 中有定义，返回该母题的默认武器集合
 * 2. 否则，返回通用武器 S-GENERAL-01
 */
function inferWeaponsFromLegacyData(rawData, motifId) {
  // 策略 A: 查母题默认配置 (最可靠)
  if (motifId && motifWeaponMap[motifId]) {
    return motifWeaponMap[motifId].weapons;
  }

  // 策略 B: 尝试根据 knob 关键词简单映射 (如果需要更细粒度，可扩展此处)
  // 目前为了安全，如果不在默认配置里，就给一个通用武器
  return ['S-GENERAL-01'];
}

/**
 * 提取核心逻辑 (Core Logic)
 */
function extractCoreLogic(rawData) {
  // 新格式直接取
  if (rawData.meta?.core_logic && Array.isArray(rawData.meta.core_logic)) {
    return rawData.meta.core_logic;
  }
  
  // 旧格式尝试从 constraints 提取
  if (rawData.level_constraints) {
    const logic = [];
    if (rawData.level_constraints.focus_point) {
      logic.push(`重点: ${rawData.level_constraints.focus_point}`);
    }
    if (rawData.level_constraints.common_trap) {
      logic.push(`陷阱: ${rawData.level_constraints.common_trap}`);
    }
    if (logic.length > 0) return logic;
  }

  // 默认值
  return ['分析题目条件，运用相关数学性质求解'];
}

/**
 * 从题目ID解析变例信息
 * ID格式: M02_V1_1.1_L2_001
 */
function parseVariationInfoFromId(questionId) {
  if (!questionId || typeof questionId !== 'string') return null;
  
  const parts = questionId.split('_');
  if (parts.length < 4) return null;
  
  const motifId = parts[0];
  const specId = parts[1];
  const varId = parts[2];
  const level = parts[3];
  
  return { motifId, specId, varId, level };
}

/**
 * 标准化单个题目对象
 * @param {Object} rawData - 原始题目数据
 * @param {String} motifId - 所属母题 ID (如 'M04')，用于兜底映射
 * @returns {Object} 标准化后的题目对象
 */
export function normalizeQuestion(rawData, motifId = null) {
  if (!rawData) return null;

  const questionId = rawData.id || '';
  const parsedInfo = parseVariationInfoFromId(questionId);

  // --- 判断格式 ---
  const isNewFormat = rawData.meta && Array.isArray(rawData.meta.weapons);
  
  let weapons = [];
  let coreLogic = [];
  let trapTags = [];
  let strategyHint = 'analysis';
  let formatType = 'UNKNOWN';

  if (isNewFormat) {
    formatType = 'RAG';
    weapons = rawData.meta.weapons;
    coreLogic = rawData.meta.core_logic || [];
    trapTags = rawData.meta.trap_tags || [];
    strategyHint = rawData.meta.strategy_hint || 'analysis';
  } else if (rawData.variable_knobs || rawData.level_constraints) {
    formatType = 'LEGACY';
    weapons = inferWeaponsFromLegacyData(rawData, motifId);
    coreLogic = extractCoreLogic(rawData);
    trapTags = rawData.trap_tags || [];
    strategyHint = 'legacy_auto_mapped';
  } else {
    formatType = 'UNKNOWN';
    weapons = rawData.weapons || [];
    coreLogic = ['分析题目条件，运用相关数学性质求解'];
    trapTags = rawData.trap_tags || [];
    strategyHint = rawData.strategy_hint || 'analysis';
  }

  return {
    ...rawData,
    _format: formatType,
    weapons,
    linkedWeapons: weapons,
    coreLogic,
    trapTags,
    strategyHint,
    specId: rawData.specId || parsedInfo?.specId || '',
    varId: rawData.varId || parsedInfo?.varId || '',
    level: rawData.level || parsedInfo?.level || '',
    meta: {
      ...(rawData.meta || {}),
      weapons,
      core_logic: coreLogic,
      trap_tags: trapTags,
      strategy_hint: strategyHint
    }
  };
}

/**
 * 批量标准化题目池
 */
export function normalizeQuestionPool(pool, motifId) {
  if (!Array.isArray(pool)) return [];
  return pool.map(q => normalizeQuestion(q, motifId));
}
