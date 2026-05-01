import { LEVEL_THRESHOLDS, LEVEL_INITIAL_ELO, getAllBenchmarks, DECAY_CONFIG } from './benchmarkUtils'

const getLevelSpan = (level) => {
  const thresholds = LEVEL_THRESHOLDS[level]
  return thresholds.max - thresholds.min + 1
}

const getMaxEloGain = (currentLevel) => {
  const span = getLevelSpan(currentLevel)
  return Math.round(span * 0.2)
}

const calculateEloFromSpecialties = (specialties) => {
  if (!specialties || specialties.length === 0) return LEVEL_INITIAL_ELO.L1
  
  const benchmarks = getAllBenchmarks(specialties)
  if (benchmarks.length === 0) return LEVEL_INITIAL_ELO.L1
  
  const l2Benchmarks = benchmarks.filter(b => b.level === 'L2')
  const l3Benchmarks = benchmarks.filter(b => b.level === 'L3')
  const l4Benchmarks = benchmarks.filter(b => b.level === 'L4')
  
  const l2AllGreen = l2Benchmarks.length > 0 && l2Benchmarks.every(b => b.is_mastered === true)
  const l3AllGreen = l3Benchmarks.length > 0 && l3Benchmarks.every(b => b.is_mastered === true)
  const l4AllGreen = l4Benchmarks.length > 0 && l4Benchmarks.every(b => b.is_mastered === true)
  
  if (l4AllGreen) return LEVEL_THRESHOLDS.L4.min
  if (l3AllGreen) return LEVEL_THRESHOLDS.L3.min
  if (l2AllGreen) return LEVEL_THRESHOLDS.L2.min
  
  const l2HasWarning = l2Benchmarks.some(b => b.consecutive_correct > 0 && b.consecutive_correct < 3)
  const l3HasWarning = l3Benchmarks.some(b => b.consecutive_correct > 0 && b.consecutive_correct < 3)
  
  if (l3HasWarning && l2AllGreen) return LEVEL_THRESHOLDS.L2.min
  if (l2HasWarning) return LEVEL_INITIAL_ELO.L1 + 100
  
  return LEVEL_INITIAL_ELO.L1
}

const isEloCappedFromSpecialties = (specialties) => {
  if (!specialties || specialties.length === 0) return false
  
  const benchmarks = getAllBenchmarks(specialties)
  
  const l2Benchmarks = benchmarks.filter(b => b.level === 'L2')
  if (l2Benchmarks.length > 0 && l2Benchmarks.some(b => b.is_mastered !== true)) return true
  
  const l3Benchmarks = benchmarks.filter(b => b.level === 'L3')
  if (l3Benchmarks.length > 0 && l3Benchmarks.some(b => b.is_mastered !== true)) return true
  
  const l4Benchmarks = benchmarks.filter(b => b.level === 'L4')
  if (l4Benchmarks.length > 0 && l4Benchmarks.some(b => b.is_mastered !== true)) return true
  
  return false
}

const getEloCeilingFromSpecialties = (specialties) => {
  if (!specialties || specialties.length === 0) return LEVEL_THRESHOLDS.L1.max
  
  const benchmarks = getAllBenchmarks(specialties)
  
  const checkLevel = (level) => {
    const levelBenchmarks = benchmarks.filter(b => b.level === level)
    if (levelBenchmarks.length === 0) return true
    return levelBenchmarks.every(b => b.is_mastered === true)
  }
  
  const hasL2Mastered = checkLevel('L2')
  const hasL3Mastered = checkLevel('L3')
  const hasL4Mastered = checkLevel('L4')
  
  if (hasL4Mastered) return LEVEL_THRESHOLDS.L4.max
  if (hasL3Mastered) return LEVEL_THRESHOLDS.L3.max
  if (hasL2Mastered) return LEVEL_THRESHOLDS.L2.max
  return LEVEL_THRESHOLDS.L1.max
}

const calculateDecayedEloFromSpecialties = (specialties) => {
  const currentElo = calculateEloFromSpecialties(specialties)
  
  let decayedAmount = 0
  const benchmarks = getAllBenchmarks(specialties)
  benchmarks.forEach(b => {
    if (b.consecutive_correct > 0 && b.consecutive_correct < 3 && b.decayed_from) {
      const levelScore = b.level === 'L4' ? 100 : b.level === 'L3' ? 60 : 40
      decayedAmount += levelScore * (1 - DECAY_CONFIG.YELLOW_ELO_PENALTY)
    }
  })
  
  return {
    current: currentElo,
    potential: currentElo + Math.round(decayedAmount),
    decayed: Math.round(decayedAmount)
  }
}

export {
  getLevelSpan,
  getMaxEloGain,
  calculateEloFromSpecialties,
  isEloCappedFromSpecialties,
  getEloCeilingFromSpecialties,
  calculateDecayedEloFromSpecialties
}
