import scoringEngine from '../data/scoringEngine.json'
import strategyLib from '../data/strategy_lib.json'

const LEVEL_SCORES = scoringEngine.level_scores
const ELO_DISTRIBUTION = scoringEngine.elo_question_distribution
const QUESTION_COMBINATIONS = scoringEngine.question_combinations

const motifCache = new Map()

const loadMotifData = async (motifId) => {
  if (motifCache.has(motifId)) {
    return motifCache.get(motifId)
  }
  
  try {
    const response = await fetch(`/src/data/${motifId}.json`)
    if (!response.ok) {
      console.warn(`Failed to load ${motifId}.json`)
      return null
    }
    const data = await response.json()
    motifCache.set(motifId, data)
    return data
  } catch (error) {
    console.warn(`Error loading ${motifId}.json:`, error)
    return null
  }
}

const getWeaponFromStrategyLib = (weaponId) => {
  if (!strategyLib || !strategyLib.categories) return null
  
  for (const category of strategyLib.categories) {
    const weapon = category.weapons?.find(w => w.id === weaponId)
    if (weapon) {
      return {
        id: weapon.id,
        name: weapon.name,
        rank: weapon.rank,
        logicFlow: weapon.logic_flow,
        description: weapon.description,
        triggerKeywords: weapon.trigger_keywords
      }
    }
  }
  
  return null
}

export const generateQuestion = async (params) => {
  const {
    userElo,
    targetMotifId,
    currentLevel,
    recentPerformance,
    timeAvailable,
    variationId
  } = params

  const distribution = getEloDistribution(userElo)
  
  const questionType = selectQuestionType(distribution, recentPerformance)
  
  const levels = parseLevels(questionType)
  
  const totalScore = calculateTotalScore(levels)
  
  const motifData = await loadMotifData(targetMotifId)
  
  const variationInfo = variationId ? 
    getVariationFromMotif(motifData, variationId) : 
    getRandomVariationFromMotif(motifData)
  
  const scaffoldings = await getScaffoldingsForLevels(motifData, levels, variationInfo)
  
  const weapons = await getWeaponsForVariation(variationInfo)
  
  return {
    questionType,
    levels,
    totalScore,
    timeLimit: estimateTimeLimit(levels),
    scaffoldings,
    difficulty: calculateDifficulty(levels, userElo),
    tips: generateTips(motifData, variationInfo, weapons),
    motifId: targetMotifId,
    motifName: motifData?.motif_name || '未知母题',
    variationId: variationInfo?.var_id,
    variationName: variationInfo?.name,
    weapons: weapons.map(w => w.name),
    benchmarkQuestion: getBenchmarkQuestion(variationInfo, levels)
  }
}

const getVariationFromMotif = (motifData, variationId) => {
  if (!motifData || !motifData.specialties) return null
  
  for (const specialty of motifData.specialties) {
    const variation = specialty.variations?.find(v => v.var_id === variationId)
    if (variation) {
      return {
        ...variation,
        specialtyId: specialty.spec_id,
        specialtyName: specialty.spec_name
      }
    }
  }
  
  return null
}

const getRandomVariationFromMotif = (motifData) => {
  if (!motifData || !motifData.specialties) return null
  
  const allVariations = []
  
  for (const specialty of motifData.specialties) {
    for (const variation of specialty.variations || []) {
      allVariations.push({
        ...variation,
        specialtyId: specialty.spec_id,
        specialtyName: specialty.spec_name
      })
    }
  }
  
  if (allVariations.length === 0) return null
  
  return allVariations[Math.floor(Math.random() * allVariations.length)]
}

const getWeaponsForVariation = async (variationInfo) => {
  if (!variationInfo || !variationInfo.toolkit?.linked_weapons) return []
  
  const weapons = []
  for (const weaponId of variationInfo.toolkit.linked_weapons) {
    const weapon = getWeaponFromStrategyLib(weaponId)
    if (weapon) {
      weapons.push(weapon)
    }
  }
  
  return weapons
}

const getBenchmarkQuestion = (variationInfo, levels) => {
  if (!variationInfo || !variationInfo.master_benchmarks) return null
  
  const targetLevel = levels[levels.length - 1]
  
  const benchmark = variationInfo.master_benchmarks.find(b => 
    b.level === targetLevel || b.difficulty === targetLevel
  )
  
  return benchmark || variationInfo.master_benchmarks[0]
}

const getEloDistribution = (elo) => {
  for (const [tier, config] of Object.entries(ELO_DISTRIBUTION)) {
    if (elo >= config.range[0] && elo <= config.range[1]) {
    return { tier, ...config }
    }
  }
  return { tier: 'medium', ...ELO_DISTRIBUTION.medium }
}

const selectQuestionType = (distribution, recentPerformance) => {
  const { recommended_levels } = distribution
  
  if (recentPerformance === 'struggling') {
    const easierLevels = recommended_levels.filter(l => l.includes('L2'))
    return easierLevels.length > 0 ? easierLevels[0] : 'L2'
  }
  
  if (recentPerformance === 'excelling') {
    const harderLevels = recommended_levels.filter(l => l.includes('L4'))
    return harderLevels.length > 0 ? harderLevels[0] : 'L4'
  }
  
  const randomIndex = Math.floor(Math.random() * recommended_levels.length)
  return recommended_levels[randomIndex]
}

const parseLevels = (questionType) => {
  if (questionType.includes('+')) {
    return questionType.split('+')
  }
  return [questionType]
}

const calculateTotalScore = (levels) => {
  const combinationKey = levels.sort().join('+')
  if (QUESTION_COMBINATIONS[combinationKey]) {
    return QUESTION_COMBINATIONS[combinationKey].total_score
  }
  
  return levels.reduce((sum, level) => {
    return sum + (LEVEL_SCORES[level]?.score || 0)
  }, 0)
}

const estimateTimeLimit = (levels) => {
  return levels.reduce((sum, level) => {
    return sum + (LEVEL_SCORES[level]?.time_limit || 120)
  }, 0)
}

const getScaffoldingsForLevels = async (motifData, levels, variationInfo) => {
  const scaffoldings = []
  
  if (variationInfo?.toolkit?.standard_steps) {
    scaffoldings.push({
      type: 'standard_steps',
      source: 'variation',
      steps: variationInfo.toolkit.standard_steps
    })
  }
  
  if (variationInfo?.logic_core) {
    scaffoldings.push({
      type: 'logic_core',
      source: 'variation',
      content: variationInfo.logic_core
    })
  }
  
  if (motifData?.specialties) {
    for (const specialty of motifData.specialties) {
      if (specialty.variations) {
        for (const variation of specialty.variations) {
          if (variation.master_benchmarks) {
            for (const benchmark of variation.master_benchmarks) {
              if (levels.includes(benchmark.level)) {
                scaffoldings.push({
                  type: 'benchmark',
                  source: 'master_benchmarks',
                  level: benchmark.level,
                  problem: benchmark.problem,
                  logicKey: benchmark.logic_key,
                  specialtyId: specialty.spec_id,
                  variationId: variation.var_id
                })
              }
            }
          }
        }
      }
    }
  }
  
  return scaffoldings
}

const calculateDifficulty = (levels, userElo) => {
  const levelDifficulty = levels.reduce((sum, level) => {
    const weight = LEVEL_SCORES[level]?.difficulty_weight || 1
    return sum + weight
  }, 0)
  
  const averageLevelDifficulty = levelDifficulty / levels.length
  
  if (userElo < 1200) {
    return averageLevelDifficulty > 1.5 ? 'hard' : 'medium'
  } else if (userElo < 2000) {
    return averageLevelDifficulty > 1.8 ? 'hard' : 'medium'
  } else {
    return averageLevelDifficulty > 1.5 ? 'medium' : 'easy'
  }
}

const generateTips = (motifData, variationInfo, weapons) => {
  const tips = []
  
  if (variationInfo?.logic_core) {
    const trapMatch = variationInfo.logic_core.match(/陷阱[：:]\s*([^\n。]+)/)
    if (trapMatch) {
      tips.push({
        type: 'trap_warning',
        content: trapMatch[1],
        source: 'logic_core'
      })
    }
  }
  
  if (weapons.length > 0) {
    const primaryWeapon = weapons[0]
    tips.push({
      type: 'weapon_hint',
      content: primaryWeapon.name,
      logicFlow: primaryWeapon.logicFlow,
      source: 'strategy_lib'
    })
    
    if (primaryWeapon.triggerKeywords && primaryWeapon.triggerKeywords.length > 0) {
      tips.push({
        type: 'trigger_keywords',
        content: primaryWeapon.triggerKeywords.join('、'),
        source: 'strategy_lib'
      })
    }
  }
  
  if (motifData?.description) {
    tips.push({
      type: 'module_overview',
      content: motifData.description.substring(0, 100) + '...',
      source: 'motif_description'
    })
  }
  
  return tips
}

export const generateQuestionSet = async (params) => {
  const {
    userElo,
    targetMotifIds,
    sessionDuration,
    goal
  } = params

  const questions = []
  let remainingTime = sessionDuration
  let totalScore = 0
  
  const distribution = getEloDistribution(userElo)
  
  const shuffledMotifs = [...targetMotifIds].sort(() => Math.random() - 0.5)
  
  for (const motifId of shuffledMotifs) {
    if (remainingTime < 60) break
    
    const question = await generateQuestion({
      userElo,
      targetMotifId: motifId,
      currentLevel: 'L1',
      timeAvailable: remainingTime
    })
    
    if (question.timeLimit <= remainingTime) {
      questions.push(question)
      remainingTime -= question.timeLimit
      totalScore += question.totalScore
    }
    
    if (goal === 'intensive' && questions.length >= 3) break
    if (goal === 'normal' && questions.length >= 2) break
  }
  
  return {
    questions,
    totalScore,
    estimatedTime: sessionDuration - remainingTime,
    averageDifficulty: calculateAverageDifficulty(questions)
  }
}

const calculateAverageDifficulty = (questions) => {
  if (questions.length === 0) return 'unknown'
  
  const difficulties = questions.map(q => q.difficulty)
  const mediumCount = difficulties.filter(d => d === 'medium').length
  
  if (mediumCount > questions.length / 2) return 'medium'
  if (difficulties.filter(d => d === 'hard').length > questions.length / 2) return 'hard'
  return 'easy'
}

export const adaptQuestionToLevel = (baseQuestion, targetLevel) => {
  const levelScore = LEVEL_SCORES[targetLevel]
  
  return {
    ...baseQuestion,
    levels: [targetLevel],
    totalScore: levelScore?.score || 40,
    timeLimit: levelScore?.time_limit || 120,
    difficulty: levelScore?.difficulty_weight > 1.5 ? 'hard' : 'medium'
  }
}

export const getMotifVariations = async (motifId) => {
  const motifData = await loadMotifData(motifId)
  if (!motifData || !motifData.specialties) return []
  
  const variations = []
  for (const specialty of motifData.specialties) {
    for (const variation of specialty.variations || []) {
      variations.push({
        id: variation.var_id,
        name: variation.name,
        specialtyId: specialty.spec_id,
        specialtyName: specialty.spec_name,
        benchmarkCount: variation.master_benchmarks?.length || 0,
        weapons: variation.toolkit?.linked_weapons || []
      })
    }
  }
  
  return variations
}

export const getMotifSpecialties = async (motifId) => {
  const motifData = await loadMotifData(motifId)
  if (!motifData || !motifData.specialties) return []
  
  return motifData.specialties.map(s => ({
    id: s.spec_id,
    name: s.spec_name,
    variationCount: s.variations?.length || 0
  }))
}

export const getRandomBenchmark = async (motifId, variationId = null) => {
  const motifData = await loadMotifData(motifId)
  if (!motifData) return null
  
  let variation
  if (variationId) {
    variation = getVariationFromMotif(motifData, variationId)
  } else {
    variation = getRandomVariationFromMotif(motifData)
  }
  
  if (!variation || !variation.master_benchmarks || variation.master_benchmarks.length === 0) {
    return null
  }
  
  return variation.master_benchmarks[Math.floor(Math.random() * variation.master_benchmarks.length)]
}

export default {
  generateQuestion,
  generateQuestionSet,
  adaptQuestionToLevel,
  getEloDistribution,
  calculateTotalScore,
  estimateTimeLimit,
  calculateDifficulty,
  generateTips,
  getMotifVariations,
  getMotifSpecialties,
  getRandomBenchmark,
  loadMotifData
}
