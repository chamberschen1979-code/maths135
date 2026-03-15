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
  'M10': '解析几何基础',
  'M11': '导数工具基础',
  'M12': '概率与统计综合',
  'M13': '解析几何综合压轴',
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
