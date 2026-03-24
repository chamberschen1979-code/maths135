import { getDifficultyConfig, getQuestionLevelsForUser } from '../config/difficultyConfig.js'
import { 
  GRADE_RESTRICTIONS, 
  getGradeConfig as getSharedGradeConfig,
  checkTextContainsForbidden 
} from '../config/syllabusRules.js'

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

const filterByGradeRestrictions = (item, motifId, targetLevel, grade, gradeConfig) => {
  const text = [
    item.varName || '',
    item.specName || '',
    item.description || item.desc || '',
    item.problem || '',
    item.title || ''
  ].join(' ')

  if (checkTextContainsForbidden(text, GRADE_RESTRICTIONS.universityForbidden)) {
    console.log(`[🛡️ 大学工具红线] 剔除 ${motifId}: ${item.varName || item.id} (含大学工具)`)
    return false
  }

  if (gradeConfig.toolForbidden && gradeConfig.toolForbidden.length > 0) {
    if (checkTextContainsForbidden(text, gradeConfig.toolForbidden)) {
      console.log(`[🛡️ ${grade} 工具红线] 剔除 ${motifId}: ${item.varName || item.id} (含超纲工具)`)
      return false
    }
  }

  if (gradeConfig.contextSpecific && gradeConfig.contextSpecific[motifId]) {
    if (checkTextContainsForbidden(text, gradeConfig.contextSpecific[motifId])) {
      console.log(`[🛡️ 上下文红线] 剔除 ${motifId}: ${item.varName || item.id} (该模块不宜用此工具)`)
      return false
    }
  }

  if (targetLevel === 'L2' && gradeConfig.l2ThoughtForbidden && gradeConfig.l2ThoughtForbidden.length > 0) {
    if (checkTextContainsForbidden(text, gradeConfig.l2ThoughtForbidden)) {
      console.log(`[🎯 L2 难度过滤] 剔除 ${motifId}-L2: ${item.varName || item.id} (思维过难)`)
      return false
    }
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
export const selectBenchmark = (motifData, targetLevel, problemIndex = 0, constraints = {}) => {
  if (!motifData) return null

  const { weaponId, grade } = constraints
  const { 
    matchedLevelBenchmarks, 
    otherLevelBenchmarks, 
    matchedLevelPool, 
    otherLevelPool,
    weaponMatchedBenchmarks,
    weaponMatchedPool,
    gradeBlocked
  } = collectAllBenchmarks(motifData, targetLevel, constraints)

  if (gradeBlocked) {
    console.warn(`[⚠️ 年级拦截] ${grade || '高三'} 无法访问此母题`)
    return null
  }

  // 最高优先级：匹配杀手锏的标杆题
  if (weaponId && weaponMatchedBenchmarks.length > 0) {
    const matchedLevel = weaponMatchedBenchmarks.filter(b => b.level === targetLevel)
    if (matchedLevel.length > 0) {
      return matchedLevel[problemIndex % matchedLevel.length]
    }
    return weaponMatchedBenchmarks[problemIndex % weaponMatchedBenchmarks.length]
  }

  // 次高优先级：匹配杀手锏的题库
  if (weaponId && weaponMatchedPool.length > 0) {
    const matchedLevel = weaponMatchedPool.filter(p => p.level === targetLevel)
    if (matchedLevel.length > 0) {
      return matchedLevel[problemIndex % matchedLevel.length]
    }
    return weaponMatchedPool[problemIndex % weaponMatchedPool.length]
  }

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
      linkedWeapons: [],
      specId: '',
      varId: ''
    }
  }
  
  return {
    specName: benchmark.specName || '',
    varName: benchmark.varName || '',
    linkedWeapons: benchmark.linkedWeapons || [],
    specId: benchmark.specId || '',
    varId: benchmark.varId || ''
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
  
  const specId = benchmark.specId || ''
  const varId = benchmark.varId || ''
  const varName = benchmark.varName || ''
  
  const specialties = motifData.specialties || []
  let originalPool = []
  
  for (const spec of specialties) {
    if (spec.spec_id === specId) {
      for (const v of spec.variations || []) {
        if (v.var_id === varId) {
          originalPool = v.original_pool || []
          break
        }
      }
      break
    }
  }
  
  if (originalPool.length === 0) {
    console.log(`[种子题抽取] 变例 ${specId}/${varId} 无 original_pool，降级使用标杆题`)
    return null
  }
  
  const adjacentLevels = ['L1', 'L2', 'L3', 'L4']
  let candidatePool = originalPool.filter(q => q.level === targetLevel)
  
  if (candidatePool.length < 2) {
    const currentIndex = adjacentLevels.indexOf(targetLevel)
    const neighbors = []
    if (currentIndex > 0) neighbors.push(adjacentLevels[currentIndex - 1])
    if (currentIndex < adjacentLevels.length - 1) neighbors.push(adjacentLevels[currentIndex + 1])
    
    const neighborQuestions = originalPool.filter(q => neighbors.includes(q.level))
    candidatePool = [...candidatePool, ...neighborQuestions]
    
    if (candidatePool.length > originalPool.filter(q => q.level === targetLevel).length) {
      console.log(`[难度适配] 目标 ${targetLevel} 题目不足，已混入相邻难度题目，当前池大小: ${candidatePool.length}`)
    }
  }
  
  if (candidatePool.length === 0) {
    console.log(`[种子题抽取] 无符合条件的题目，降级使用标杆题`)
    return null
  }
  
  // 🔧 新增：种子题安全性过滤 - 避免选择容易导致"退化"的种子
  // 如果目标是求"范围"，过滤掉高对称性种子
  if (varName.includes("范围") || varName.includes("最值")) {
    const safeSeeds = candidatePool.filter(q => {
      // 检查是否标记为高对称性
      if (q.tags && q.tags.includes('highly_symmetric')) {
        return false
      }
      
      // 启发式规则：检查题目是否包含对称性关键词
      const desc = q.desc || q.problem || ''
      const symmetricPatterns = [
        /原点.*圆|圆.*原点/,
        /对称.*轴|轴.*对称/,
        /等腰|等边|正三角形/,
        /A\s*\(\s*-?\d+\s*,\s*0\s*\).*B\s*\(\s*\d+\s*,\s*0\s*\)/,  // A(-a,0), B(a,0) 对称
        /圆心.*原点|原点.*圆心/
      ]
      
      const isHighlySymmetric = symmetricPatterns.some(p => p.test(desc))
      return !isHighlySymmetric
    })
    
    if (safeSeeds.length > 0) {
      candidatePool = safeSeeds
      console.log(`[种子题安全过滤] 目标含"范围/最值"，已过滤高对称性种子，剩余 ${safeSeeds.length} 题`)
    } else {
      console.log(`[种子题安全过滤] 警告：所有种子都具有高对称性，将在 Prompt 中强制添加防退化检查`)
    }
  }
  
  // 🔧 新增：参数不规则性优先 - 优先选择参数不规则的种子
  const irregularityScore = (q) => {
    const desc = q.desc || q.problem || ''
    let score = 0
    
    // 检查是否包含非整数参数（更不容易退化）
    if (/\d+\.\d+|\d+\/\d+|√\d+/.test(desc)) score += 2
    
    // 检查是否包含非对称坐标
    if (/\(\s*-?\d+\s*,\s*-?\d+\s*\)/.test(desc)) {
      const coords = desc.match(/\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/g) || []
      for (const coord of coords) {
        const match = coord.match(/\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/)
        if (match && match[1] !== '0' && match[2] !== '0') {
          score += 1  // 非原点坐标加分
        }
      }
    }
    
    // 检查是否包含参数符号（如 a, b, k）
    if (/[a-z]\s*[=<>∈]/i.test(desc)) score += 1
    
    return score
  }
  
  // 按不规则性排序
  candidatePool.sort((a, b) => irregularityScore(b) - irregularityScore(a))
  
  // 从前 50% 的候选中随机选择（平衡随机性和安全性）
  const topHalf = candidatePool.slice(0, Math.max(1, Math.ceil(candidatePool.length / 2)))
  const randomIndex = (problemIndex + Math.floor(Math.random() * 1000)) % topHalf.length
  const seedQuestion = topHalf[randomIndex]
  
  console.log(`[出题种子] 母题:${motifData.motif_id || motifData.id} | 变例:${specId}/${varId} | 目标难度:${targetLevel} | 选中种子难度:${seedQuestion.level} | 种子ID:${seedQuestion.id || 'unknown'}`)
  
  return {
    ...seedQuestion,
    specId,
    varId,
    specName: benchmark.specName,
    varName: benchmark.varName
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
