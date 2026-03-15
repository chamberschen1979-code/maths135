import { getDifficultyConfig } from '../config/difficultyConfig.js'

export const normalizeId = (id) => {
  if (!id || typeof id !== 'string') return null
  return id.replace(/_/g, '-').toLowerCase().trim()
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

export const selectBenchmark = (motifData, targetLevel) => {
  if (!motifData) return null

  const specialties = motifData.specialties || []

  for (const spec of specialties) {
    const variations = spec.variations || []
    for (const v of variations) {
      const benchmarks = v.master_benchmarks || []
      const match = benchmarks.find(b => b.level === targetLevel)
      if (match) return match
    }
  }

  for (const spec of specialties) {
    const variations = spec.variations || []
    for (const v of variations) {
      const pool = v.original_pool || []
      const matches = pool.filter(b => b.level === targetLevel)
      if (matches.length > 0) {
        return matches[Math.floor(Math.random() * matches.length)]
      }
    }
  }

  const mb = motifData.master_benchmarks || []
  const matchMB = mb.find(b => b.level === targetLevel)
  if (matchMB) return matchMB

  return null
}

export const selectVariableKnobs = (motifData, targetLevel = 'L3') => {
  const variation = motifData?.specialties?.[0]?.variations?.[0]

  if (!variation?.variable_knobs) {
    return { fallback: true, message: '使用通用策略' }
  }

  const knobs = variation.variable_knobs
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

    const totalWeight = validOptions.reduce((sum, opt) => sum + (opt.weight || 1), 0)
    let random = Math.random() * totalWeight

    for (const opt of validOptions) {
      const weight = opt.weight || 1
      if (random <= weight) {
        selectedStrategy[dimension] = opt
        break
      }
      random -= weight
    }
  }

  return selectedStrategy
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
