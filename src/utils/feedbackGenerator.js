import scoringEngine from '../data/scoringEngine.json'
import weaponDetails from '../data/weapon_details.json'

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
    const response = await fetch(`/data/${motifId}.json`)
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

const WEAPON_NAMES = {
  'S-SET-01': '空集优先讨论',
  'S-SET-02': '集合运算化简',
  'S-SET-03': '韦恩图分析',
  'S-FUNC-01': '定义域优先',
  'S-FUNC-02': '同增异减法则',
  'S-FUNC-03': '奇偶性判断',
  'S-FUNC-04': '零点交点转化',
  'S-FUNC-05': '数形结合分析',
  'S-TRIG-01': '恒等变换技巧',
  'S-TRIG-02': '图象变换铁律',
  'S-TRIG-03': '五点作图法',
  'S-TRIG-04': 'ω范围讨论',
  'S-TRIG-05': '辅助角公式',
  'S-VEC-01': '基底法',
  'S-VEC-02': '坐标法',
  'S-VEC-03': '几何意义',
  'S-VEC-04': '建系策略',
  'S-VEC-05': '数量积应用',
  'S-SEQ-01': '下标和性质',
  'S-SEQ-02': '错位相减',
  'S-SEQ-03': '裂项相消',
  'S-SEQ-04': '分组求和',
  'S-SEQ-05': '通项公式',
  'S-GEO-01': '建系坐标法',
  'S-GEO-02': '几何法',
  'S-GEO-03': '体积转化',
  'S-GEO-04': '空间向量',
  'S-GEO-05': '二面角计算',
  'S-ANA-01': '设点求参',
  'S-ANA-02': '韦达定理',
  'S-ANA-03': '点差法',
  'S-ANA-04': '切线方程',
  'S-ANA-05': '轨迹方程',
  'S-DER-01': '求导法则',
  'S-DER-02': '切线方程',
  'S-DER-03': '单调性讨论',
  'S-DER-04': '极值最值',
  'S-DER-05': '零点讨论',
  'S-PROB-01': '古典概型',
  'S-PROB-02': '条件概率',
  'S-PROB-03': '期望方差',
  'S-PROB-04': '分布列',
  'S-PROB-05': '统计推断'
}

const WEAPON_CATEGORIES = {
  'S-SET': { id: 'set', name: '集合与逻辑' },
  'S-FUNC': { id: 'func', name: '函数与性质' },
  'S-TRIG': { id: 'trig', name: '三角函数' },
  'S-VEC': { id: 'vec', name: '平面向量' },
  'S-SEQ': { id: 'seq', name: '数列' },
  'S-GEO': { id: 'geo', name: '立体几何' },
  'S-ANA': { id: 'ana', name: '解析几何' },
  'S-DER': { id: 'der', name: '导数' },
  'S-PROB': { id: 'prob', name: '概率统计' }
}

const getWeaponFromWeaponDetails = (weaponId) => {
  if (!weaponId) return null
  
  const details = weaponDetails[weaponId]
  if (!details) return null
  
  const categoryPrefix = weaponId.split('-').slice(0, 2).join('-')
  const category = WEAPON_CATEGORIES[categoryPrefix] || { id: 'other', name: '其他' }
  
  return {
    id: weaponId,
    name: WEAPON_NAMES[weaponId] || weaponId,
    rank: weaponId.includes('-05') ? 'killer' : 'standard',
    logicFlow: details.coreLogic || '',
    description: details.coreLogic || '',
    triggerKeywords: details.scenarios || [],
    category: category.id,
    categoryName: category.name,
    pitfalls: details.pitfalls || [],
    example: details.example || null
  }
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
          const weaponInfo = getWeaponFromWeaponDetails(weaponId)
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
      if (variation.common_pitfalls) {
        for (const pitfall of variation.common_pitfalls) {
          if (typeof pitfall === 'string') {
            return pitfall
          }
          if (pitfall.description) {
            return pitfall.description
          }
        }
      }
    }
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

export const getKnowledgeItemForLevel = async (motifId, level) => {
  const motifData = await loadMotifData(motifId)
  if (!motifData || !motifData.specialties) return null
  
  for (const specialty of motifData.specialties) {
    for (const variation of specialty.variations || []) {
      if (variation.master_benchmarks) {
        const benchmark = variation.master_benchmarks.find(b => b.level === level)
        if (benchmark) {
          return {
            name: variation.name,
            level: benchmark.level,
            problem: benchmark.problem,
            logicKey: benchmark.logic_key,
            specialtyId: specialty.spec_id,
            variationId: variation.var_id
          }
        }
      }
    }
  }
  
  return null
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
  return getWeaponFromWeaponDetails(weaponId)
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
