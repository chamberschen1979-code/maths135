import scoringEngine from '../data/scoringEngine.json'
import strategyLib from '../data/strategy_lib.json'
import knowledgeAggregationIndex from '../data/knowledge-aggregation-index.json'

const LEVEL_SCORES = scoringEngine.level_scores
const LEVEL_INDICATORS = scoringEngine.level_indicators
const FEEDBACK_TEMPLATES = scoringEngine.feedback_templates
const QUESTION_COMBINATIONS = scoringEngine.question_combinations
const ELO_DISTRIBUTION = scoringEngine.elo_question_distribution

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
        triggerKeywords: weapon.trigger_keywords,
        category: category.id,
        categoryName: category.name
      }
    }
  }
  
  return null
}

const findWeaponsForMotifFromLib = async (motifId, variationId = null) => {
  const motifData = await loadMotifData(motifId)
  if (!motifData || !motifData.specialties) return []
  
  const weapons = []
  
  for (const specialty of motifData.specialties) {
    for (const variation of specialty.variations || []) {
      if (!variationId || variation.var_id === variationId) {
        const linkedWeapons = variation.toolkit?.linked_weapons || []
        for (const weaponId of linkedWeapons) {
          const weaponInfo = getWeaponFromStrategyLib(weaponId)
          if (weaponInfo && !weapons.find(w => w.id === weaponId)) {
            weapons.push(weaponInfo)
          }
        }
      }
    }
  }
  
  return weapons
}

const getVariationInfo = async (motifId, variationId) => {
  const motifData = await loadMotifData(motifId)
  if (!motifData || !motifData.specialties) return null
  
  for (const specialty of motifData.specialties) {
    const variation = specialty.variations?.find(v => v.var_id === variationId)
    if (variation) {
      return {
        id: variation.var_id,
        name: variation.name,
        logicCore: variation.logic_core,
        standardSteps: variation.toolkit?.standard_steps || [],
        linkedWeapons: variation.toolkit?.linked_weapons || [],
        weaponMapNote: variation.toolkit?.weapon_map_note || '',
        specialtyId: specialty.spec_id,
        specialtyName: specialty.spec_name
      }
    }
  }
  
  return null
}

const getL4TrapForMotif = async (motifId) => {
  const motifData = await loadMotifData(motifId)
  if (!motifData) return '核心知识点'
  
  for (const specialty of motifData.specialties || []) {
    for (const variation of specialty.variations || []) {
      if (variation.logic_core) {
        const trapMatch = variation.logic_core.match(/陷阱[：:]\s*([^\n。]+)/)
        if (trapMatch) {
          return trapMatch[1]
        }
      }
    }
  }
  
  const mapping = knowledgeAggregationIndex.mapping?.[motifId]
  if (mapping?.l4_trap_reference) {
    return mapping.l4_trap_reference
  }
  
  return '核心知识点'
}

const getNextLevel = (currentLevel) => {
  const levels = ['L1', 'L2', 'L3', 'L4']
  const currentIndex = levels.indexOf(currentLevel)
  if (currentIndex < levels.length - 1) {
    return levels[currentIndex + 1]
  }
  return 'L4'
}

export const generateJoeFeedback = async (params) => {
  const {
    motifId,
    motifName,
    currentLevel,
    l4Trap,
    weaponName,
    logicCore,
    failedLevel,
    scoreEarned,
    totalScore,
    variationId
  } = params
  
  const weapons = await findWeaponsForMotifFromLib(motifId, variationId)
  const variationInfo = variationId ? await getVariationInfo(motifId, variationId) : null
  const actualL4Trap = l4Trap || await getL4TrapForMotif(motifId)
  const actualWeaponName = weaponName || weapons[0]?.name || '基础武器'
  const actualLogicCore = logicCore || variationInfo?.logicCore || '核心思路'
  
  let feedback = ''
  
  if (failedLevel) {
    feedback = `你在「${motifName}」的挑战中，虽然拿到了基础分 ${scoreEarned || 0} 分，但死在了「${actualL4Trap}」。\n\n`
    feedback += `建议调取武器：「${actualWeaponName}」进行针对性训练。\n\n`
    feedback += `核心思路：${actualLogicCore}`
  } else if (currentLevel === 'L4') {
    feedback = `🎯 完美！你在「${motifName}」的 L4 压轴题中表现出色，获得 ${totalScore || 100} 分！\n\n`
    feedback += `你的「${actualWeaponName}」运用得当，继续保持！`
  } else {
    const nextLevel = getNextLevel(currentLevel)
    feedback = `你在「${motifName}」的 ${currentLevel} 节点表现良好，获得 ${scoreEarned || LEVEL_SCORES[currentLevel]?.score || 0} 分。\n\n`
    feedback += `建议继续挑战 ${nextLevel} 节点，注意「${actualL4Trap}」。`
  }
  
  return feedback
}

export const getKnowledgeItemForLevel = (motifId, level) => {
  const mapping = knowledgeAggregationIndex.mapping?.[motifId]
  if (!mapping || !mapping.knowledge_items) return null
  
  return mapping.knowledge_items.find(item => 
    item.level_scaffolding && item.level_scaffolding.includes(level)
  )
}

export const findWeaponForMotifAndLevel = async (motifId, level, variationId = null) => {
  const weapons = await findWeaponsForMotifFromLib(motifId, variationId)
  
  if (weapons.length === 0) return null
  
  if (level === 'L4') {
    const l4Weapon = weapons.find(w => w.rank === 'killer')
    if (l4Weapon) return l4Weapon
  }
  
  return weapons[0]
}

export const getWeaponForMotif = async (motifId, failedLevel, variationId = null) => {
  const weapon = await findWeaponForMotifAndLevel(motifId, failedLevel, variationId)
  if (weapon) {
    return weapon.name
  }
  
  return '基础武器'
}

export const generateFeedback = (params) => {
  const {
    motifId,
    motifName,
    level,
    status,
    l4Trap,
    weaponName,
    logicCore,
    prerequisite,
    daysSincePractice
  } = params

  const template = FEEDBACK_TEMPLATES[status]
  if (!template) {
    return `${motifName} 的 ${level} 节点状态未知，请继续练习。`
  }

  const randomTemplate = template.templates[Math.floor(Math.random() * template.templates.length)]
  
  let feedback = randomTemplate
    .replace(/\$\{motif_name\}/g, motifName || '未知母题')
    .replace(/\$\{level\}/g, level || '未知等级')
    .replace(/\$\{l4_trap\}/g, l4Trap || '核心知识点')
    .replace(/\$\{weapon_name\}/g, weaponName || '基础武器')
    .replace(/\$\{logic_core\}/g, logicCore || '核心思路')
    .replace(/\$\{prerequisite\}/g, prerequisite || '前置知识')
    .replace(/\$\{score\}/g, LEVEL_SCORES[level]?.score || 0)
    .replace(/\$\{days\}/g, daysSincePractice || 0)

  return `${template.prefix}\n\n${feedback}`
}

export const getLevelIndicator = (level, status) => {
  const indicator = LEVEL_INDICATORS[status]
  if (!indicator) {
    return LEVEL_INDICATORS.locked
  }
  return indicator
}

export const calculateQuestionScore = (levels) => {
  if (!Array.isArray(levels)) {
    levels = [levels]
  }
  
  const combinationKey = levels.sort().join('+')
  const combination = QUESTION_COMBINATIONS[combinationKey]
  
  if (combination) {
    return combination
  }
  
  let totalScore = 0
  levels.forEach(level => {
    totalScore += LEVEL_SCORES[level]?.score || 0
  })
  
  return {
    total_score: totalScore,
    description: `自定义组合: ${levels.join(' + ')}`,
    recommended_for: '自定义用户'
  }
}

export const getRecommendedQuestionLevels = (elo) => {
  for (const [tier, config] of Object.entries(ELO_DISTRIBUTION)) {
    if (elo >= config.range[0] && elo <= config.range[1]) {
      const randomLevel = config.recommended_levels[Math.floor(Math.random() * config.recommended_levels.length)]
      return {
        tier,
        levels: randomLevel,
        description: config.description,
        totalScore: calculateQuestionScore(randomLevel).total_score
      }
    }
  }
  
  return {
    tier: 'medium',
    levels: 'L3',
    description: '默认推送进阶题',
    totalScore: 60
  }
}

export const getMotifInfo = async (motifId) => {
  const motifData = await loadMotifData(motifId)
  if (!motifData) return null
  
  return {
    id: motifData.motif_id,
    name: motifData.motif_name,
    description: motifData.description,
    specialties: motifData.specialties?.map(s => ({
      id: s.spec_id,
      name: s.spec_name,
      variations: s.variations?.map(v => ({
        id: v.var_id,
        name: v.name,
        linkedWeapons: v.toolkit?.linked_weapons || []
      }))
    }))
  }
}

export const generateDiagnosticReport = async (params) => {
  const {
    motifId,
    motifName,
    currentLevel,
    eloScore,
    subTargetStatus,
    l4Trap,
    weaponName,
    logicCore,
    variationId
  } = params

  const report = {
    summary: '',
    details: [],
    recommendations: [],
    levelBreakdown: {}
  }

  const levelOrder = ['L2', 'L3', 'L4']
  levelOrder.forEach(level => {
    const status = subTargetStatus?.[level] || 'locked'
    const indicator = getLevelIndicator(level, status)
    const score = LEVEL_SCORES[level]
    
    report.levelBreakdown[level] = {
      status,
      indicator,
      score: score?.score || 0,
      description: score?.description || ''
    }
    
    if (status === 'failed') {
      report.details.push({
        level,
        issue: `${level} 节点未攻克`,
        suggestion: l4Trap || '需要加强基础训练'
      })
    } else if (status === 'practicing') {
      report.details.push({
        level,
        issue: `${level} 节点正在磨合`,
        suggestion: '继续练习，巩固掌握'
      })
    }
  })

  const failedLevels = levelOrder.filter(l => subTargetStatus?.[l] === 'failed')
  const practicingLevels = levelOrder.filter(l => subTargetStatus?.[l] === 'practicing')
  const masteredLevels = levelOrder.filter(l => subTargetStatus?.[l] === 'mastered')

  const weapons = await findWeaponsForMotifFromLib(motifId, variationId)
  const actualWeaponName = weaponName || weapons[0]?.name || '基础武器'

  if (failedLevels.length > 0) {
    report.summary = `⚠️ ${motifName} 存在 ${failedLevels.length} 个等级节点需要强化`
    report.recommendations.push(`重点攻克 ${failedLevels.join('、')} 节点`)
    report.recommendations.push(`建议使用「${actualWeaponName}」进行针对性训练`)
  } else if (practicingLevels.length > 0) {
    report.summary = `🔄 ${motifName} 的 ${practicingLevels.join('、')} 节点正在磨合`
    report.recommendations.push('继续练习以巩固掌握')
  } else if (masteredLevels.length === levelOrder.length) {
    report.summary = `✅ ${motifName} 所有等级节点已全部攻克！`
    report.recommendations.push('可以挑战更高难度的母题')
  } else {
    report.summary = `${motifName} 当前状态良好，继续加油！`
  }

  if (logicCore) {
    report.details.unshift({
      level: 'core',
      issue: '核心思路',
      suggestion: logicCore
    })
  }

  return report
}

export const formatFeedbackForDisplay = (feedback, type = 'default') => {
  const typeStyles = {
    success: { color: '#10b981', icon: '🎯' },
    partial: { color: '#f59e0b', icon: '⚠️' },
    failed: { color: '#ef4444', icon: '❌' },
    decay_warning: { color: '#f59e0b', icon: '⏰' },
    default: { color: '#6b7280', icon: '📌' }
  }
  
  const style = typeStyles[type] || typeStyles.default
  
  return {
    icon: style.icon,
    color: style.color,
    text: feedback
  }
}

export const getWeaponDetails = (weaponId) => {
  return getWeaponFromStrategyLib(weaponId)
}

export const getMotifWeapons = async (motifId, variationId = null) => {
  return findWeaponsForMotifFromLib(motifId, variationId)
}

export const getVariationDetails = async (motifId, variationId) => {
  return getVariationInfo(motifId, variationId)
}

export default {
  LEVEL_SCORES,
  LEVEL_INDICATORS,
  FEEDBACK_TEMPLATES,
  QUESTION_COMBINATIONS,
  ELO_DISTRIBUTION,
  generateFeedback,
  generateJoeFeedback,
  getLevelIndicator,
  calculateQuestionScore,
  getRecommendedQuestionLevels,
  getMotifInfo,
  generateDiagnosticReport,
  formatFeedbackForDisplay,
  getKnowledgeItemForLevel,
  getL4TrapForMotif,
  findWeaponForMotifAndLevel,
  getWeaponForMotif,
  getWeaponDetails,
  getMotifWeapons,
  getVariationDetails
}
