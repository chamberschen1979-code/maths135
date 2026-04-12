import { getDifficultyConfig, getQuestionLevelsForUser } from '../config/difficultyConfig.js'
import { 
  GRADE_RESTRICTIONS, 
  getGradeConfig as getSharedGradeConfig,
  checkTextContainsForbidden 
} from '../config/syllabusRules.js'
import {
  extractQuestionsByLevel,
  selectQuestionFromPool,
  extractVariableConstraints,
  getQuestionVariationInfo as getRAGVariationInfo,
  getMotifStats
} from './dataLoader.js'
import { normalizeQuestion, normalizeQuestionPool } from './dataAdapter.js'

// 复用共享配置
export const getGradeConfig = getSharedGradeConfig

export const normalizeId = (id) => {
  if (!id || typeof id !== 'string') return null
  return id.replace(/_/g, '-').toLowerCase().trim()
}

export const selectQuestionLevels = (userLevel, motifData, userQualificationStatus) => {
  if (userQualificationStatus?.isHighLevelLocked) {
    return [
      { level: 'L2', questionIndex: 0, isMultiQuestion: false }
    ]
  }

  const config = getQuestionLevelsForUser(userLevel)

  if (!config.multiQuestion) {
    return [{ level: config.levels[0], questionIndex: 0, isMultiQuestion: false }]
  }

  if (userLevel === 'L3') {
    return [
      { level: 'L2', questionIndex: 0, isMultiQuestion: true },
      { level: 'L3', questionIndex: 1, isMultiQuestion: true }
    ]
  }

  if (userLevel === 'L4') {
    const firstLevel = Math.random() > 0.5 ? 'L2' : 'L3'
    return [
      { level: firstLevel, questionIndex: 0, isMultiQuestion: true },
      { level: 'L4', questionIndex: 1, isMultiQuestion: true }
    ]
  }

  return [{ level: 'L1', questionIndex: 0, isMultiQuestion: false }]
}

export const findMotifData = async (targetId, crossFileIndex, loadMotifDataFn = null) => {
  if (!targetId || !crossFileIndex) return null

  const idVariants = [
    targetId,
    normalizeId(targetId),
    targetId.replace(/-/g, '_'),
    targetId.toUpperCase(),
    targetId.toLowerCase()
  ].filter(Boolean)

  for (const variant of idVariants) {
    if (crossFileIndex[variant] && crossFileIndex[variant].length > 0) {
      return crossFileIndex[variant][0]
    }
  }

  if (loadMotifDataFn) {
    try {
      const loadedData = await loadMotifDataFn(targetId)
      if (loadedData) {
        return {
          ...loadedData,
          prototypeProblems: loadedData.prototypeProblems || loadedData.prototype_problems || []
        }
      }
    } catch (e) {
      console.warn(`[problemLogic] 动态加载母题数据失败 (${targetId}):`, e)
    }
  }

  return null
}

export const getDifficultyByElo = (elo) => {
  return getDifficultyConfig(elo)
}

/**
 * 🔥 通用函数：从任意母题的 variable_knobs 中提取当前难度的硬性约束
 * 适用于 M04, M01, M02 等所有遵循相同 JSON 结构的母题
 */
export const extractLevelConstraints = (variableKnobs, targetLevel) => {
  if (!variableKnobs || !variableKnobs.level_constraints) {
    return { safeParams: {}, forbiddenModels: [], maxSteps: 5, forcedMethod: 'any', requiredTags: [] }
  }

  // 1. 获取当前难度的具体配置 (如 L2_constraints)
  // 支持多种命名习惯: "L2_constraints", "level_L2", "L2"
  const levelConfig =
    variableKnobs.level_constraints[`${targetLevel}_constraints`] ||
    variableKnobs.level_constraints[`level_${targetLevel}`] ||
    variableKnobs.level_constraints[targetLevel] ||
    {}

  // 2. 提取安全参数池
  const safeParams = levelConfig.safe_param_pool || {}
  
  // 3. 提取禁忌模型
  let forbiddenModels = []
  if (Array.isArray(levelConfig.forbidden_models)) {
    forbiddenModels = levelConfig.forbidden_models.map(item =>
      typeof item === 'string' ? item : (item.model || item.description || '')
    )
  } else if (levelConfig.forbidden_models?.list) {
    forbiddenModels = levelConfig.forbidden_models.list
  }

  // 4. 提取其他通用约束
  const maxSteps = levelConfig.max_steps || 99
  const forcedMethod = levelConfig.forced_method || 'any'
  const requiredTags = levelConfig.required_tags || []

  return {
    safeParams,
    forbiddenModels,
    maxSteps,
    forcedMethod,
    requiredTags,
    rawConfig: levelConfig
  }
}

/**
 * 准备生成上下文：动态提取当前母题、当前难度的约束
 */
export const prepareGenerationContext = (motifData, targetLevel) => {
  const variableKnobs = motifData.variable_knobs
  
  // 🔥 动态提取当前母题、当前难度的约束
  const constraints = extractLevelConstraints(variableKnobs, targetLevel)
  
  
  return {
    ...motifData,
    activeConstraints: constraints
  }
}

/**
 * 通用年级与难度过滤函数 (适用于 ALL 17 个母题)
 * 核心策略更新：
 * 1. 大学工具/超纲工具：扫描全文，确保绝对干净。
 * 2. L2 思维难度：【重大调整】不再因变例名称包含"思维模型关键词"而剔除。
 *    - 适用对象：M02(函数), M04(指对), M07(三角复合), M08(数列不等式) 等所有涉及高阶思维的母题。
 *    - 理由：高考 L2 题完全可以考查"指对同构"，只需设计成"观察法"可解即可。
 *    - 仅当名称明确包含"导数"、"洛必达"等 L2 绝对禁止的"工具"时才剔除。
 */
const filterByGradeRestrictions = (item, motifId, targetLevel, grade, gradeConfig) => {
  // 1. 提取"元数据文本" (用于思维难度判断)
  // 包含：变例名、专项名、标题。不包含具体题目描述和题干。
  const metaDataText = [
    item.varName || '',
    item.specName || '',
    item.title || '',
    item.var_id || '',
    item.id || ''
  ].join(' ').toLowerCase()

  // 2. 提取"全文本" (用于工具红线判断)
  // 包含：元数据 + 描述 + 题干。确保题目内容里也不出现洛必达等工具。
  const fullText = [
    metaDataText,
    (item.description || item.desc || ''),
    (item.problem || ''),
    (item.content || '')
  ].join(' ').toLowerCase()

  // --- 第一道防线：大学工具红线 (全局禁止，适用于所有母题) ---
  if (checkTextContainsForbidden(fullText, GRADE_RESTRICTIONS.universityForbidden)) {
    return false
  }

  // --- 第二道防线：年级特定工具红线 (全局禁止) ---
  if (gradeConfig.toolForbidden && gradeConfig.toolForbidden.length > 0) {
    if (checkTextContainsForbidden(fullText, gradeConfig.toolForbidden)) {
      return false
    }
  }

  // --- 第三道防线：上下文特定限制 (全局禁止) ---
  if (gradeConfig.contextSpecific && gradeConfig.contextSpecific[motifId]) {
    if (checkTextContainsForbidden(fullText, gradeConfig.contextSpecific[motifId])) {
      return false
    }
  }

  // --- 🔥 第四道防线：L2 思维难度过滤 (【已优化】仅拦截超纲工具，放行思维模型) ---
  if (targetLevel === 'L2') {
    // ✅ 新策略：只禁止"工具"，不禁止"思维模型"
    // 即使变例叫"超越方程同构"(M04) 或 "非线性递推"(M08)，只要不用导数，L2 也能出
    const strictBanKeywords = [
      "导数", "求导", "f'(x)", "洛必达", "泰勒", "极限定义",
      "拉格朗日", "中值定理", "级数", "收敛", "空间向量坐标",
      "微分", "积分", "极坐标", "参数方程"
    ]
    
    // 检查元数据中是否包含这些绝对禁止的工具词
    const hitTool = strictBanKeywords.find(keyword => metaDataText.includes(keyword.toLowerCase()))
    
    if (hitTool) {
      return false
    }

    // ❌ 旧策略已移除：
    // 不再因为包含 "超越方程", "同构", "博弈", "最值", "极值点偏移", "双零点" 而直接剔除。
    // 这些是 M02, M04, M07, M08 等母题的核心思维，L2 应当通过"简化数据"或"观察法"来考查，而不是禁止考查。
    // 让 AI 根据 Prompt 中的"高考难度锚点"去自动降维。
  }

  return true
}

/**
 * 收集所有可用的标杆题（跨变例）
 * 支持 weaponId 过滤：优先选择关联了指定杀手锏的变例
 * 支持年级过滤：根据年级配置过滤超纲内容
 */
const collectAllBenchmarks = (motifData, targetLevel, constraints = {}) => {
  const { specId, varId, specName: constraintSpecName, varName: constraintVarName, weaponId, grade } = constraints
  const specialties = motifData.specialties || []
  const motifId = motifData.id || motifData.motif_id || ''
  
  const gradeConfig = getGradeConfig(grade || '高三')
  
  if (gradeConfig.allowedMotifs !== 'ALL' && !gradeConfig.allowedMotifs.includes(motifId)) {
    console.warn(`[⚠️ 年级母题拦截] ${grade || '高三'} 不应出现 ${motifId}`)
    return { 
      matchedLevelBenchmarks: [], 
      otherLevelBenchmarks: [], 
      matchedLevelPool: [], 
      otherLevelPool: [],
      weaponMatchedBenchmarks: [],
      weaponMatchedPool: [],
      gradeBlocked: true
    }
  }
  
  const matchedLevelBenchmarks = []
  const otherLevelBenchmarks = []
  const matchedLevelPool = []
  const otherLevelPool = []
  
  const weaponMatchedBenchmarks = []
  const weaponMatchedPool = []

  for (const spec of specialties) {
    if (specId && spec.spec_id !== specId) continue
    if (constraintSpecName && spec.spec_name !== constraintSpecName) continue
    
    const variations = spec.variations || []
    for (const v of variations) {
      if (varId && v.var_id !== varId) continue
      if (constraintVarName && v.name !== constraintVarName) continue
      
      const benchmarks = v.master_benchmarks || []
      const pool = v.original_pool || []
      const linkedWeapons = v.toolkit?.linked_weapons || []
      
      const hasWeaponMatch = weaponId && linkedWeapons.some(w => 
        w.id === weaponId || w === weaponId || w.weapon_id === weaponId
      )
      
      for (const b of benchmarks) {
        const benchmarkWithMeta = {
          ...b,
          specId: spec.spec_id,
          varId: v.var_id,
          specName: spec.spec_name,
          varName: v.name,
          linkedWeapons,
          hasWeaponMatch
        }
        
        if (!filterByGradeRestrictions(benchmarkWithMeta, motifId, targetLevel, grade, gradeConfig)) {
          continue
        }
        
        if (hasWeaponMatch) {
          weaponMatchedBenchmarks.push(benchmarkWithMeta)
        }
        
        if (b.level === targetLevel) {
          matchedLevelBenchmarks.push(benchmarkWithMeta)
        } else {
          otherLevelBenchmarks.push(benchmarkWithMeta)
        }
      }
      
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i]
        const poolWithMeta = {
          ...p,
          id: p.id || `pool_${spec.spec_id}_${v.var_id}_${i}`,
          problem: p.desc,
          specId: spec.spec_id,
          varId: v.var_id,
          specName: spec.spec_name,
          varName: v.name,
          linkedWeapons,
          isFromPool: true,
          hasWeaponMatch
        }
        
        if (!filterByGradeRestrictions(poolWithMeta, motifId, targetLevel, grade, gradeConfig)) {
          continue
        }
        
        if (hasWeaponMatch) {
          weaponMatchedPool.push(poolWithMeta)
        }
        
        if (p.level === targetLevel) {
          matchedLevelPool.push(poolWithMeta)
        } else {
          otherLevelPool.push(poolWithMeta)
        }
      }
    }
  }

  const mb = motifData.master_benchmarks || []
  if (!specId && !constraintSpecName && !varId && !constraintVarName && !weaponId) {
    for (const b of mb) {
      if (!filterByGradeRestrictions(b, motifId, targetLevel, grade, gradeConfig)) {
        continue
      }
      if (b.level === targetLevel) {
        matchedLevelBenchmarks.push(b)
      } else {
        otherLevelBenchmarks.push(b)
      }
    }
  }

  return { 
    matchedLevelBenchmarks, 
    otherLevelBenchmarks, 
    matchedLevelPool, 
    otherLevelPool,
    weaponMatchedBenchmarks,
    weaponMatchedPool
  }
}

/**
 * 选择标杆题（支持跨变例选择，确保题目多样性）
 * 支持 weaponId 过滤：优先选择关联了指定杀手锏的变例
 * 支持年级过滤：根据年级配置过滤超纲内容和工具
 * @param {Object} motifData - 母题数据
 * @param {string} targetLevel - 目标难度等级 (L2/L3/L4)
 * @param {number} problemIndex - 题目序号 (用于选择不同的题)
 * @param {Object} constraints - 约束条件 { specId, varId, specName, varName, weaponId, grade }
 * @param {string} constraints.grade - 年级 ('高一'/'高二'/'高三')，用于年级过滤
 * @returns {Object} benchmark 数据，包含 specName, varName, linkedWeapons
 */
export const selectBenchmark = (motifData, targetLevel, problemIndex = 0, constraints = {}, userProgress = null) => {
  if (!motifData) return null

  const motifId = motifData.id || motifData.motif_id || 'M04'

  const ragQuestion = selectQuestionFromPool(motifData, targetLevel, problemIndex, userProgress)
  if (ragQuestion) {
    const normalizedQ = normalizeQuestion(ragQuestion, motifId)
    return {
      ...normalizedQ,
      problem: normalizedQ.problem || normalizedQ.desc,
      specName: normalizedQ.specName,
      varName: normalizedQ.varName,
      level: normalizedQ.level,
      linkedWeapons: normalizedQ.linkedWeapons || normalizedQ.weapons || []
    }
  }

  const { grade } = constraints
  const { 
    matchedLevelBenchmarks, 
    otherLevelBenchmarks, 
    matchedLevelPool, 
    otherLevelPool,
    gradeBlocked
  } = collectAllBenchmarks(motifData, targetLevel, constraints)

  if (gradeBlocked) {
    console.warn(`[⚠️ 年级拦截] ${grade || '高三'} 无法访问此母题`)
    return null
  }

  // 优先级1：同难度等级的 master_benchmarks
  if (matchedLevelBenchmarks.length > 0) {
    const groupedByVar = {}
    matchedLevelBenchmarks.forEach(b => {
      const key = b.varName || 'default'
      if (!groupedByVar[key]) groupedByVar[key] = []
      groupedByVar[key].push(b)
    })
    
    const varNames = Object.keys(groupedByVar)
    if (varNames.length > 1) {
      const selectedVarName = varNames[problemIndex % varNames.length]
      const benchmarksInVar = groupedByVar[selectedVarName]
      return benchmarksInVar[problemIndex % benchmarksInVar.length]
    }
    
    return matchedLevelBenchmarks[problemIndex % matchedLevelBenchmarks.length]
  }

  // 优先级2：同难度等级的 original_pool（随机选择，不区分杀手锏）
  if (matchedLevelPool.length > 0) {
    const groupedByVar = {}
    matchedLevelPool.forEach(b => {
      const key = b.varName || 'default'
      if (!groupedByVar[key]) groupedByVar[key] = []
      groupedByVar[key].push(b)
    })
    
    const varNames = Object.keys(groupedByVar)
    if (varNames.length > 1) {
      const selectedVarName = varNames[problemIndex % varNames.length]
      const poolInVar = groupedByVar[selectedVarName]
      return poolInVar[problemIndex % poolInVar.length]
    }
    
    return matchedLevelPool[problemIndex % matchedLevelPool.length]
  }

  // 优先级3：其他难度等级的 master_benchmarks
  if (otherLevelBenchmarks.length > 0) {
    const groupedByVar = {}
    otherLevelBenchmarks.forEach(b => {
      const key = b.varName || 'default'
      if (!groupedByVar[key]) groupedByVar[key] = []
      groupedByVar[key].push(b)
    })
    
    const varNames = Object.keys(groupedByVar)
    if (varNames.length > 1) {
      const selectedVarName = varNames[problemIndex % varNames.length]
      const benchmarksInVar = groupedByVar[selectedVarName]
      return benchmarksInVar[problemIndex % benchmarksInVar.length]
    }
    
    return otherLevelBenchmarks[problemIndex % otherLevelBenchmarks.length]
  }

  // 优先级4：其他难度等级的 original_pool
  if (otherLevelPool.length > 0) {
    return otherLevelPool[problemIndex % otherLevelPool.length]
  }

  return null
}

/**
 * 选择变量因子
 * @param {Object} motifData - 母题数据
 * @param {string} targetLevel - 目标难度等级
 * @param {number} problemIndex - 题目序号
 * @param {Object} constraints - 约束条件 { specId, varId, specName, varName }
 * @param {Object} benchmark - 已选择的标杆题（用于获取对应的变例）
 */
export const selectVariableKnobs = (motifData, targetLevel = 'L3', problemIndex = 0, constraints = {}, benchmark = null) => {
  const { specId, varId, specName: constraintSpecName, varName: constraintVarName } = constraints
  const specialties = motifData?.specialties || []
  
  let targetVariation = null
  
  // 优先从 benchmark 获取变例信息
  if (benchmark?.specName && benchmark?.varName) {
    for (const spec of specialties) {
      if (spec.spec_name !== benchmark.specName) continue
      const variations = spec.variations || []
      for (const v of variations) {
        if (v.name === benchmark.varName) {
          targetVariation = v
          break
        }
      }
      if (targetVariation) break
    }
  }
  
  if (!targetVariation) {
    for (const spec of specialties) {
      if (specId && spec.spec_id !== specId) continue
      if (constraintSpecName && spec.spec_name !== constraintSpecName) continue
      
      const variations = spec.variations || []
      for (const v of variations) {
        if (varId && v.var_id !== varId) continue
        if (constraintVarName && v.name !== constraintVarName) continue
        targetVariation = v
        break
      }
      if (targetVariation) break
    }
  }
  
  if (!targetVariation) {
    const allVariations = specialties.flatMap(s => s.variations || [])
    if (allVariations.length === 0) {
      return { fallback: true, message: '使用通用策略' }
    }
    targetVariation = allVariations[problemIndex % allVariations.length]
  }
  
  if (!targetVariation?.variable_knobs) {
    return { fallback: true, message: '使用通用策略' }
  }

  const knobs = targetVariation.variable_knobs
  const selectedStrategy = {}

  for (const [dimension, options] of Object.entries(knobs)) {
    if (!Array.isArray(options) || options.length === 0) continue

    const validOptions = options.filter(opt => {
      if (!opt.difficulty_delta) return true
      const delta = parseFloat(opt.difficulty_delta) || 0
      if (targetLevel === 'L2') return delta <= 0
      if (targetLevel === 'L3') return delta <= 0.5
      return true
    })

    if (validOptions.length === 0) continue

    const idx = problemIndex % validOptions.length
    selectedStrategy[dimension] = validOptions[idx]
  }

  return selectedStrategy
}

/**
 * 获取变例信息（从 benchmark 中获取，确保一致性）
 * @param {Object} benchmark - 已选择的标杆题
 */
export const getVariationInfo = (benchmark) => {
  if (!benchmark) {
    return {
      specName: '',
      varName: '',
      linkedWeapons: [],
      specId: '',
      varId: ''
    }
  }
  
  // 🔥 RAG 模式：优先从 benchmark 中提取
  const ragInfo = getRAGVariationInfo(benchmark)
  
  return {
    specName: benchmark.specName || ragInfo.specName || '',
    varName: benchmark.varName || ragInfo.varName || '',
    linkedWeapons: benchmark.linkedWeapons || [],
    specId: benchmark.specId || ragInfo.specId || '',
    varId: benchmark.varId || ragInfo.varId || ''
  }
}

/**
 * 难度分层过滤 + 层内随机抽取种子题
 * @param {Object} motifData - 母题数据
 * @param {string} targetLevel - 目标难度 (L2/L3/L4)
 * @param {Object} benchmark - 已选择的标杆题（用于定位变例）
 * @param {number} problemIndex - 题目序号（用于随机种子）
 * @returns {Object|null} 种子题数据
 */
export const selectSeedQuestion = (motifData, targetLevel, benchmark, problemIndex = 0) => {
  if (!motifData || !benchmark) return null
  
  const motifId = motifData.id || motifData.motif_id || 'M04'

  // 🔥 RAG 模式：优先使用新的 JSON 结构
  const ragQuestion = selectQuestionFromPool(motifData, targetLevel, problemIndex)
  if (ragQuestion) {
    // 🔥 使用适配器标准化输出
    const normalizedQ = normalizeQuestion(ragQuestion, motifId)
    return {
      question: normalizedQ,
      variableKnobs: extractVariableConstraints(normalizedQ),
      variationName: normalizedQ.varName,
      specName: normalizedQ.specName,
      specId: normalizedQ.specId,
      varId: normalizedQ.varId,
      ...normalizedQ
    }
  }
  
  // 降级：使用原有逻辑（简化版）
  
  const specId = benchmark.specId || ''
  const varId = benchmark.varId || ''
  
  const specialties = motifData.specialties || []
  let candidatePool = []
  
  // 简单逻辑：直接取该变例下的所有题目
  for (const spec of specialties) {
    if (spec.spec_id === specId) {
      for (const v of spec.variations || []) {
        if (v.var_id === varId) {
          candidatePool = v.original_pool || []
          break
        }
      }
      break
    }
  }

  // 🔴 简化：不再过滤"高对称性"或"参数不规则性"，直接用
  if (candidatePool.length === 0) {
    return null
  }
  
  // 先尝试匹配目标难度
  let targetPool = candidatePool.filter(q => q.level === targetLevel)
  if (targetPool.length === 0) {
    targetPool = candidatePool
  }
  
  // 直接随机选一个
  const seedQuestion = targetPool[problemIndex % targetPool.length]
  
  
  // 查找该题目所属的变例配置，提取 variable_knobs
  let variableKnobs = null
  
  for (const spec of specialties) {
    if (spec.spec_id === specId) {
      for (const v of spec.variations || []) {
        if (v.var_id === varId) {
          variableKnobs = v.variable_knobs || null
          break
        }
      }
      break
    }
  }
  
  if (!variableKnobs) {
    console.warn(`[⚠️ 警告] 变例 ${specId}/${varId} 未找到 variable_knobs，难度约束可能丢失`)
  } else {
  }
  
  return {
    question: seedQuestion,
    variableKnobs,
    variationName: benchmark.varName,
    specName: benchmark.specName,
    specId,
    varId,
    ...seedQuestion
  }
}

/**
 * 获取所有可用的变例列表（用于没有指定约束时选择不同变例）
 */
export const getAvailableVariations = (motifData, targetLevel) => {
  if (!motifData) return []
  
  const variations = []
  const specialties = motifData.specialties || []
  
  for (const spec of specialties) {
    const vars = spec.variations || []
    for (const v of vars) {
      const benchmarks = v.master_benchmarks || []
      const originalPool = v.original_pool || []
      const hasMatchingLevel = benchmarks.some(b => b.level === targetLevel) || 
                               originalPool.some(p => p.level === targetLevel)
      if (hasMatchingLevel) {
        variations.push({
          specId: spec.spec_id,
          specName: spec.spec_name,
          varId: v.var_id,
          varName: v.name,
          variation: v,
          linkedWeapons: v.toolkit?.linked_weapons || []
        })
      }
    }
  }
  
  return variations
}

export const buildCrossFileIndex = (motifDataMap) => {
  const index = {}
  if (!motifDataMap || typeof motifDataMap !== 'object') return index

  Object.entries(motifDataMap).forEach(([key, value]) => {
    const normalKey = normalizeId(key)
    if (normalKey) {
      if (!index[normalKey]) {
        index[normalKey] = []
      }
      index[normalKey].push(value)
    }
  })
  return index
}
