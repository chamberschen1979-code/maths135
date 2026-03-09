import scoringEngine from '../data/scoringEngine.json'

const LEVEL_THRESHOLDS = {
  L1: { min: 0, max: 1000 },
  L2: { min: 1001, max: 1800 },
  L3: { min: 1801, max: 2500 },
  L4: { min: 2501, max: 3000 },
}

const MASTERY_CONFIG = {
  CONSECUTIVE_CORRECT_REQUIRED: 3,
  L4_BONUS_MULTIPLIER: 1.5,
  L2_PENALTY_MULTIPLIER: 2.0,
  MELTDOWN_PENALTY_MULTIPLIER: 2.5,
}

export const getTargetStatus = (targetLevel, currentElo, consecutiveCorrect = 0) => {
  const thresholds = LEVEL_THRESHOLDS[targetLevel] || LEVEL_THRESHOLDS.L1
  
  if (currentElo < thresholds.min) return 'gray'
  
  if (consecutiveCorrect >= 3) return 'green'
  
  return 'red'
}

export const getLevelByElo = (elo) => {
  if (elo >= LEVEL_THRESHOLDS.L4.min) return 'L4'
  if (elo >= LEVEL_THRESHOLDS.L3.min) return 'L3'
  if (elo >= LEVEL_THRESHOLDS.L2.min) return 'L2'
  return 'L1'
}

export const getEloCeiling = (subTargets, motifData = null) => {
  if (!subTargets || subTargets.length === 0) {
    return LEVEL_THRESHOLDS.L1.max
  }
  
  const checkLevel = (level) => {
    const levelSubs = subTargets.filter(sub => sub.level_req === level)
    if (levelSubs.length === 0) return true
    
    return levelSubs.every(sub => sub.is_mastered === true)
  }
  
  const hasL2Mastered = checkLevel('L2')
  const hasL3Mastered = checkLevel('L3')
  const hasL4Mastered = checkLevel('L4')
  
  if (hasL4Mastered) return LEVEL_THRESHOLDS.L4.max
  if (hasL3Mastered) return LEVEL_THRESHOLDS.L3.max
  if (hasL2Mastered) return LEVEL_THRESHOLDS.L2.max
  return LEVEL_THRESHOLDS.L1.max
}

export const applyEloCeiling = (elo, subTargets, motifData = null) => {
  const ceiling = getEloCeiling(subTargets, motifData)
  return Math.min(elo, ceiling)
}

export const checkLevelLock = (currentElo, subTargets, motifData = null) => {
  const locks = {
    L2: false,
    L3: false,
    L4: false,
    message: ''
  }
  
  if (!subTargets || subTargets.length === 0) {
    return locks
  }
  
  const checkLevelStatus = (level) => {
    const levelSubs = subTargets.filter(sub => sub.level_req === level)
    if (levelSubs.length === 0) return { allGreen: true }
    
    const allGreen = levelSubs.every(sub => sub.is_mastered === true)
    return { allGreen }
  }
  
  const l2Status = checkLevelStatus('L2')
  const l3Status = checkLevelStatus('L3')
  
  if (currentElo >= LEVEL_THRESHOLDS.L3.min && !l2Status.allGreen) {
    locks.L3 = true
    locks.message = 'L2节点未全部变绿，Elo无法突破1800'
  }
  
  if (currentElo >= LEVEL_THRESHOLDS.L4.min && !l3Status.allGreen) {
    locks.L4 = true
    locks.message = 'L3节点未全部变绿，Elo无法突破2500'
  }
  
  return locks
}

export const calculateMasteryProgress = (subTarget) => {
  const consecutiveCorrect = subTarget.consecutive_correct || 0
  const required = MASTERY_CONFIG.CONSECUTIVE_CORRECT_REQUIRED
  
  return {
    current: consecutiveCorrect,
    required,
    progress: Math.min(100, (consecutiveCorrect / required) * 100),
    isReady: consecutiveCorrect >= required
  }
}

export const checkMasteryEligibility = (subTarget, eloScore) => {
  const level = subTarget.level_req
  const threshold = LEVEL_THRESHOLDS[level]
  
  if (!threshold) return false
  
  const eloMet = eloScore >= threshold.min
  const consecutiveMet = (subTarget.consecutive_correct || 0) >= MASTERY_CONFIG.CONSECUTIVE_CORRECT_REQUIRED
  
  return eloMet && consecutiveMet
}

export const calculateMeltdownPenalty = (currentElo, failedLevel) => {
  if (currentElo < LEVEL_THRESHOLDS.L4.min) {
    return { meltdown: false, penalty: 0 }
  }
  
  if (failedLevel === 'L2') {
    const basePenalty = 40
    const penalty = Math.round(basePenalty * MASTERY_CONFIG.MELTDOWN_PENALTY_MULTIPLIER)
    return { 
      meltdown: true, 
      penalty,
      message: `⚠️ 熔断惩罚：L4战区L2基础失误，扣除 ${penalty} 分`
    }
  }
  
  return { meltdown: false, penalty: 0 }
}

export const applyMeltdownReset = (subTargets) => {
  return subTargets.map(sub => ({
    ...sub,
    is_mastered: false,
    consecutive_correct: 0,
    meltdown_reset: true
  }))
}

export const calculateEloChange = (params) => {
  const {
    currentElo,
    level,
    isCorrect,
    subTargets,
    isFirstAttempt
  } = params
  
  const baseK = 32
  let k = baseK
  let bonusMessage = ''
  
  if (level === 'L4' && isCorrect) {
    k = baseK * MASTERY_CONFIG.L4_BONUS_MULTIPLIER
    bonusMessage = '🎯 L4挑战成功，奖励倍数 1.5x'
  }
  
  if (level === 'L2' && !isCorrect) {
    k = baseK * MASTERY_CONFIG.L2_PENALTY_MULTIPLIER
    bonusMessage = '⚠️ L2基础失误，惩罚倍数 2.0x'
  }
  
  const expected = 1 / (1 + Math.pow(10, (currentElo - 1000) / 400))
  const actual = isCorrect ? 1 : 0
  let change = Math.round(k * (actual - expected))
  
  const meltdown = calculateMeltdownPenalty(currentElo, level)
  if (meltdown.meltdown && !isCorrect) {
    change = -Math.abs(meltdown.penalty)
    bonusMessage = meltdown.message
  }
  
  let newElo = currentElo + change
  newElo = Math.max(0, Math.min(3000, newElo))
  newElo = applyEloCeiling(newElo, subTargets)
  
  return {
    newElo,
    change,
    k,
    bonusMessage,
    meltdown: meltdown.meltdown && !isCorrect
  }
}

export const updateSubTargetMastery = (subTarget, isCorrect, isFirstAttempt, currentElo) => {
  const currentStatus = subTarget.is_mastered
  const level = subTarget.level_req
  const threshold = LEVEL_THRESHOLDS[level]
  const eloMet = currentElo >= threshold.min
  
  if (!isCorrect) {
    return {
      ...subTarget,
      is_mastered: false,
      consecutive_correct: 0,
      last_practice: new Date().toISOString()
    }
  }
  
  const newConsecutive = (subTarget.consecutive_correct || 0) + 1
  
  if (eloMet && newConsecutive >= MASTERY_CONFIG.CONSECUTIVE_CORRECT_REQUIRED) {
    return {
      ...subTarget,
      is_mastered: true,
      consecutive_correct: newConsecutive,
      last_practice: new Date().toISOString(),
      mastered_at: new Date().toISOString()
    }
  }
  
  return {
    ...subTarget,
    is_mastered: false,
    consecutive_correct: newConsecutive,
    last_practice: new Date().toISOString()
  }
}

export const processPracticeResult = (params) => {
  const {
    currentElo,
    subTargets,
    level,
    subId,
    isCorrect,
    isFirstAttempt = true
  } = params
  
  let updatedSubTargets = [...subTargets]
  let eloResult = { newElo: currentElo, change: 0 }
  let meltdownTriggered = false
  let messages = []
  
  const subIndex = updatedSubTargets.findIndex(sub => sub.sub_id === subId)
  if (subIndex === -1) {
    return { updatedSubTargets, eloResult, meltdownTriggered, messages }
  }
  
  const subTarget = updatedSubTargets[subIndex]
  const currentStatus = subTarget.is_mastered
  
  eloResult = calculateEloChange({
    currentElo,
    level,
    isCorrect,
    subTargets: updatedSubTargets,
    isFirstAttempt
  })
  
  if (eloResult.bonusMessage) {
    messages.push(eloResult.bonusMessage)
  }
  
  if (isCorrect) {
    updatedSubTargets[subIndex] = updateSubTargetMastery(
      subTarget, 
      true, 
      isFirstAttempt, 
      eloResult.newElo
    )
    
    const newStatus = updatedSubTargets[subIndex].is_mastered
    if (newStatus === true && currentStatus !== true) {
      messages.push(`🟢 恭喜！${level} 关卡已点亮！`)
    }
  } else {
    const meltdown = calculateMeltdownPenalty(currentElo, level)
    
    if (meltdown.meltdown) {
      meltdownTriggered = true
      updatedSubTargets = applyMeltdownReset(updatedSubTargets)
      eloResult = {
        newElo: Math.max(LEVEL_THRESHOLDS.L1.max, currentElo - meltdown.penalty),
        change: -meltdown.penalty
      }
      messages.push(meltdown.message)
      messages.push('🔴 熔断触发：所有节点状态回滚为红色')
    } else {
      updatedSubTargets[subIndex] = updateSubTargetMastery(
        subTarget, 
        false, 
        isFirstAttempt, 
        eloResult.newElo
      )
    }
  }
  
  return {
    updatedSubTargets,
    eloResult,
    meltdownTriggered,
    messages
  }
}

export const getEloStatistics = (subTargets) => {
  const stats = {
    totalSubTargets: 0,
    mastered: 0,
    practicing: 0,
    failed: 0,
    locked: 0,
    ceiling: LEVEL_THRESHOLDS.L1.max,
    levelLocks: { L2: false, L3: false, L4: false }
  }
  
  if (!subTargets) return stats
  
  stats.totalSubTargets = subTargets.length
  
  subTargets.forEach(sub => {
    if (sub.is_mastered === true) {
      stats.mastered++
    } else if (sub.is_mastered === false) {
      stats.failed++
    } else {
      stats.locked++
    }
  })
  
  stats.ceiling = getEloCeiling(subTargets)
  stats.levelLocks = checkLevelLock(stats.ceiling, subTargets)
  
  return stats
}

export default {
  LEVEL_THRESHOLDS,
  MASTERY_CONFIG,
  getTargetStatus,
  getLevelByElo,
  getEloCeiling,
  applyEloCeiling,
  checkLevelLock,
  calculateMasteryProgress,
  checkMasteryEligibility,
  calculateMeltdownPenalty,
  applyMeltdownReset,
  calculateEloChange,
  updateSubTargetMastery,
  processPracticeResult,
  getEloStatistics
}
