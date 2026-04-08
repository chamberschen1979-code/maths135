import { filterAvailableSeeds, getCooledQuestions } from './questionStateManager.js'

const MOTIF_FILES = {
  'M01': () => import('../data/M01.json'),
  'M02': () => import('../data/M02.json'),
  'M03': () => import('../data/M03.json'),
  'M04': () => import('../data/M04.json'),
  'M05': () => import('../data/M05.json'),
  'M06': () => import('../data/M06.json'),
  'M07': () => import('../data/M07.json'),
  'M08': () => import('../data/M08.json'),
  'M09': () => import('../data/M09.json'),
  'M10': () => import('../data/M10.json'),
  'M11': () => import('../data/M11.json'),
  'M12': () => import('../data/M12.json'),
  'M13': () => import('../data/M13.json'),
  'M14': () => import('../data/M14.json'),
  'M15': () => import('../data/M15.json'),
  'M16': () => import('../data/M16.json'),
  'M17': () => import('../data/M17.json'),
}

const MOTIF_NAMES = {
  'M01': '集合、逻辑与复数',
  'M02': '不等式性质',
  'M03': '函数概念与性质',
  'M04': '指对数函数与运算',
  'M05': '平面向量',
  'M06': '三角函数基础',
  'M07': '解三角形综合',
  'M08': '数列基础与求和',
  'M09': '立体几何基础',
  'M10': '圆锥曲线基础',
  'M11': '导数工具基础',
  'M12': '概率与统计综合',
  'M13': '解析几何综合',
  'M14': '导数综合压轴',
  'M15': '数列综合压轴',
  'M16': '计数原理与二项式',
  'M17': '创新思维与情境',
}

let motifDataCache = {}

export const loadMotifData = async (motifId) => {
  if (motifDataCache[motifId]) {
    return motifDataCache[motifId]
  }
  
  if (MOTIF_FILES[motifId]) {
    try {
      const module = await MOTIF_FILES[motifId]()
      const data = module.default || module
      motifDataCache[motifId] = data
      console.log(`【动态加载】${motifId} 数据加载成功`)
      return data
    } catch (error) {
      console.error(`【加载失败】${motifId}:`, error)
      return null
    }
  }
  return null
}

export const buildCrossFileIndex = (loadedData = {}) => {
  const index = {}
  
  Object.entries(loadedData).forEach(([motifId, data]) => {
    if (!data) return
    
    let allProblems = []
    let allPitfalls = []
    let allWeapons = []
    
    if (data.specialties) {
      data.specialties.forEach(spec => {
        if (spec.variations) {
          spec.variations.forEach(v => {
            if (v.master_benchmarks) allProblems.push(...v.master_benchmarks)
            if (v.original_pool) allProblems.push(...v.original_pool)
            
            if (v.common_pitfalls) {
              v.common_pitfalls.forEach(p => allPitfalls.push(p.description || p))
            }
            
            if (v.toolkit && v.toolkit.linked_weapons) {
              allWeapons.push(...v.toolkit.linked_weapons)
            }
          })
        }
      })
    }
    
    const entry = {
      ...data,
      id: data.motif_id || motifId,
      name: data.motif_name || MOTIF_NAMES[motifId] || "未命名母题",
      prototypeProblems: allProblems,
      commonPitfalls: [...new Set(allPitfalls)],
      toolkit: { linked_weapons: [...new Set(allWeapons)] },
      specialties: data.specialties || []
    }
    
    index[motifId] = [entry]
    console.log(`【索引构建】${entry.name}(${motifId}): 共提取 ${allProblems.length} 道试题`)
  })
  
  return index
}

export const getQuestionText = (problem) => {
  if (!problem) return ''
  if (typeof problem === 'string') return problem
  if (problem.question) return problem.question
  if (problem.problem) return problem.problem
  if (problem.desc) return problem.desc
  return ''
}

export const findProblemsFromKnowledgeBase = (targetId, level, crossFileIndex = {}, validateProblem) => {
  const knowledgeEntry = crossFileIndex[targetId]
  
  if (!knowledgeEntry || knowledgeEntry.length === 0) {
    return null
  }
  
  const levelMap = { 'L1': 'L1', 'L2': 'L2', 'L3': 'L3', 'L4': 'L4' }
  const targetLevel = levelMap[level] || 'L2'
  
  const allProblems = []
  
  knowledgeEntry.forEach(entry => {
    if (entry.prototypeProblems && entry.prototypeProblems.length > 0) {
      entry.prototypeProblems.forEach(prob => {
        if (prob.level === targetLevel) {
          const validation = validateProblem ? validateProblem(prob, level, targetId) : { valid: true }
          if (validation.valid) {
            allProblems.push({
              question: prob.desc,
              analysis: `【${entry.category || entry.name}】${entry.levelScaffolding?.[`${targetLevel.toLowerCase()}_base`] || entry.levelScaffolding?.[`L${targetLevel.slice(1)}_base`] || ''}`,
              answer: '见教材解析',
              source: 'knowledge_base',
              knowledgeId: entry.id,
              knowledgeName: entry.name,
              isValidated: true
            })
          }
        }
      })
    }
  })
  
  return allProblems.length > 0 ? allProblems : null
}

export { MOTIF_FILES, MOTIF_NAMES }

// ==================== RAG 增强函数 ====================

/**
 * 从 JSON 数据中提取所有题目（支持新旧两种数据结构）
 * 旧结构：specialties[].variations[].original_pool/master_benchmarks
 * 新结构：questions[]（扁平结构，如 M06.json）
 * @param {Object} motifData - 母题 JSON 数据
 * @param {string} targetLevel - 目标难度 (L2/L3/L4)
 * @returns {Array} 符合条件的题目列表
 */
export const extractQuestionsByLevel = (motifData, targetLevel) => {
  if (!motifData) return []
  
  const questions = []
  
  // 新结构：扁平 questions 数组（M06_seed.json 格式）
  if (motifData.questions && Array.isArray(motifData.questions)) {
    motifData.questions.forEach(q => {
      if (q.level === targetLevel) {
        questions.push({
          ...q,
          sourceType: 'seed_pool'
        })
      }
    })
    if (questions.length > 0) {
      console.log(`[RAG] 从扁平结构提取到 ${questions.length} 道 ${targetLevel} 题目`)
      return questions
    }
  }
  
  // 旧结构：specialties[].variations[] 格式
  if (!motifData.specialties) return []
  
  motifData.specialties.forEach(spec => {
    if (!spec.variations) return
    
    spec.variations.forEach(variation => {
      const varInfo = {
        specId: spec.spec_id,
        specName: spec.name,
        varId: variation.var_id,
        varName: variation.name
      }
      
      // 从 original_pool 提取
      if (variation.original_pool) {
        variation.original_pool.forEach(q => {
          if (q.level === targetLevel) {
            questions.push({
              ...q,
              ...varInfo,
              sourceType: 'original_pool'
            })
          }
        })
      }
      
      // 从 master_benchmarks 提取
      if (variation.master_benchmarks) {
        variation.master_benchmarks.forEach(q => {
          if (q.level === targetLevel) {
            questions.push({
              ...q,
              ...varInfo,
              sourceType: 'master_benchmark'
            })
          }
        })
      }
    })
  })
  
  return questions
}

/**
 * 随机选择一道符合条件的题目
 * @param {Object} motifData - 母题 JSON 数据
 * @param {string} targetLevel - 目标难度
 * @param {number} problemIndex - 题目索引（用于轮换）
 * @returns {Object|null} 选中的题目对象
 */
export const selectQuestionFromPool = (motifData, targetLevel, problemIndex = 0, userProgress = null) => {
  const allQuestions = extractQuestionsByLevel(motifData, targetLevel)
  
  if (allQuestions.length === 0) {
    console.warn(`[RAG] 未找到难度 ${targetLevel} 的题目`)
    return null
  }
  
  let availableQuestions = allQuestions
  
  if (userProgress) {
    availableQuestions = filterAvailableSeeds(allQuestions, userProgress)
    
    if (availableQuestions.length === 0) {
      console.log(`[RAG] 当前难度 ${targetLevel} 题目已耗尽，尝试横向迁移...`)
      
      const cooledQuestions = getCooledQuestions(userProgress.weakPointBuffer)
      if (cooledQuestions.length > 0) {
        const cooledInLevel = cooledQuestions.filter(q => q.level === targetLevel)
        if (cooledInLevel.length > 0) {
          const selected = allQuestions.find(q => q.id === cooledInLevel[0].id)
          if (selected) {
            console.log(`[RAG 复练模式] 选取冷却期结束的错题: ${selected.id}`)
            return selected
          }
        }
      }
      
      console.warn(`[RAG] 无可用题目，建议选择其他母题`)
      return null
    }
  }
  
  const selected = availableQuestions[problemIndex % availableQuestions.length]
  console.log(`[RAG] 选中题目: ${selected.id} | 来源: ${selected.source} | 难度: ${selected.level}`)
  
  return selected
}

/**
 * 获取题目的 key_points 作为变式约束
 * @param {Object} question - 题目对象
 * @returns {Object} 变式约束对象
 */
export const extractVariableConstraints = (question) => {
  if (!question) return null
  
  return {
    keyPoints: question.key_points || '',
    tags: question.tags || [],
    answer: question.answer || '',
    source: question.source || '',
    problem: question.problem || question.desc || ''
  }
}

/**
 * 获取变例信息
 * @param {Object} question - 题目对象
 * @returns {Object} 变例信息
 */
export const getQuestionVariationInfo = (question) => {
  if (!question) return { specName: '', varName: '' }
  
  return {
    specId: question.specId || '',
    specName: question.specName || '',
    varId: question.varId || '',
    varName: question.varName || ''
  }
}

/**
 * 统计母题数据中的题目分布
 * @param {Object} motifData - 母题 JSON 数据
 * @returns {Object} 统计信息
 */
export const getMotifStats = (motifData) => {
  if (!motifData || !motifData.specialties) {
    return { total: 0, byLevel: {}, byVariation: [] }
  }
  
  const stats = {
    total: 0,
    byLevel: { L2: 0, L3: 0, L4: 0 },
    byVariation: []
  }
  
  motifData.specialties.forEach(spec => {
    if (!spec.variations) return
    
    spec.variations.forEach(variation => {
      const varStats = {
        varId: variation.var_id,
        varName: variation.name,
        count: 0,
        levels: { L2: 0, L3: 0, L4: 0 }
      }
      
      if (variation.original_pool) {
        variation.original_pool.forEach(q => {
          stats.total++
          stats.byLevel[q.level] = (stats.byLevel[q.level] || 0) + 1
          varStats.count++
          varStats.levels[q.level] = (varStats.levels[q.level] || 0) + 1
        })
      }
      
      if (variation.master_benchmarks) {
        variation.master_benchmarks.forEach(q => {
          stats.total++
          stats.byLevel[q.level] = (stats.byLevel[q.level] || 0) + 1
          varStats.count++
          varStats.levels[q.level] = (varStats.levels[q.level] || 0) + 1
        })
      }
      
      stats.byVariation.push(varStats)
    })
  })
  
  return stats
}
