import { getDifficultyConfig, getQuestionLevelsForUser } from '../config/difficultyConfig.js'

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
 * 收集所有可用的标杆题（跨变例）
 */
const collectAllBenchmarks = (motifData, targetLevel, constraints = {}) => {
  const { specId, varId, specName: constraintSpecName, varName: constraintVarName } = constraints
  const specialties = motifData.specialties || []
  
  const matchedLevelBenchmarks = []
  const otherLevelBenchmarks = []
  const matchedLevelPool = []
  const otherLevelPool = []

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
      
      for (const b of benchmarks) {
        const benchmarkWithMeta = {
          ...b,
          specName: spec.spec_name,
          varName: v.name,
          linkedWeapons
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
          specName: spec.spec_name,
          varName: v.name,
          linkedWeapons,
          isFromPool: true
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
  if (!specId && !constraintSpecName && !varId && !constraintVarName) {
    for (const b of mb) {
      if (b.level === targetLevel) {
        matchedLevelBenchmarks.push(b)
      } else {
        otherLevelBenchmarks.push(b)
      }
    }
  }

  return { matchedLevelBenchmarks, otherLevelBenchmarks, matchedLevelPool, otherLevelPool }
}

/**
 * 选择标杆题（支持跨变例选择，确保题目多样性）
 * @param {Object} motifData - 母题数据
 * @param {string} targetLevel - 目标难度等级 (L2/L3/L4)
 * @param {number} problemIndex - 题目序号 (用于选择不同的题)
 * @param {Object} constraints - 约束条件 { specId, varId, specName, varName }
 * @returns {Object} benchmark 数据，包含 specName, varName, linkedWeapons
 */
export const selectBenchmark = (motifData, targetLevel, problemIndex = 0, constraints = {}) => {
  if (!motifData) return null

  const { matchedLevelBenchmarks, otherLevelBenchmarks, matchedLevelPool, otherLevelPool } = 
    collectAllBenchmarks(motifData, targetLevel, constraints)

  // 优先选择匹配难度等级的 master_benchmarks
  if (matchedLevelBenchmarks.length > 0) {
    // 按 varName 分组，确保选择不同变例的题目
    const groupedByVar = {}
    matchedLevelBenchmarks.forEach(b => {
      const key = b.varName || 'default'
      if (!groupedByVar[key]) groupedByVar[key] = []
      groupedByVar[key].push(b)
    })
    
    const varNames = Object.keys(groupedByVar)
    if (varNames.length > 1) {
      // 有多个变例，按 problemIndex 选择不同变例
      const selectedVarName = varNames[problemIndex % varNames.length]
      const benchmarksInVar = groupedByVar[selectedVarName]
      return benchmarksInVar[problemIndex % benchmarksInVar.length]
    }
    
    // 只有一个变例，直接选择
    return matchedLevelBenchmarks[problemIndex % matchedLevelBenchmarks.length]
  }

  // 其次选择匹配难度等级的 original_pool
  if (matchedLevelPool.length > 0) {
    // 按 varName 分组
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

  // 再次选择其他难度等级的 master_benchmarks
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

  // 最后选择其他难度等级的 original_pool
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
      linkedWeapons: []
    }
  }
  
  return {
    specName: benchmark.specName || '',
    varName: benchmark.varName || '',
    linkedWeapons: benchmark.linkedWeapons || []
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
