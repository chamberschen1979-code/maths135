import eloEngine from './eloEngine'

const LEVEL_THRESHOLDS = eloEngine.LEVEL_THRESHOLDS
const DECAY_CONFIG = eloEngine.DECAY_CONFIG
const LEVEL_INITIAL_ELO = eloEngine.LEVEL_INITIAL_ELO
const getDaysSincePractice = eloEngine.getDaysSincePractice

const checkBenchmarkDecay = (benchmark) => {
  if (benchmark.is_mastered !== true) return benchmark
  
  const daysSincePractice = getDaysSincePractice(benchmark.last_practice)
  
  if (daysSincePractice >= DECAY_CONFIG.YELLOW_THRESHOLD_DAYS) {
    return { ...benchmark, is_mastered: false, consecutive_correct: 0, decayed_from: true }
  }
  
  return benchmark
}

const checkEncounterDecay = (encounter) => {
  if (!encounter.specialties) return encounter
  
  let hasDecay = false
  let oldestDecayDays = 0
  
  const updatedSpecialties = encounter.specialties.map(spec => ({
    ...spec,
    variations: (spec.variations || []).map(v => ({
      ...v,
      master_benchmarks: (v.master_benchmarks || []).map(b => {
        const checked = checkBenchmarkDecay(b)
        if (checked.decayed_from) {
          hasDecay = true
          const days = getDaysSincePractice(b.last_practice)
          if (days > oldestDecayDays) {
            oldestDecayDays = days
          }
        }
        return checked
      })
    }))
  }))
  
  let warningLevel = null
  if (hasDecay) {
    if (oldestDecayDays >= DECAY_CONFIG.WARNING_THRESHOLD_DAYS) {
      warningLevel = 'critical'
    } else {
      warningLevel = 'attention'
    }
  }
  
  return {
    ...encounter,
    specialties: updatedSpecialties,
    decay_warning: warningLevel
  }
}

const getAllBenchmarks = (specialties) => {
  if (!specialties || specialties.length === 0) return []
  const benchmarks = []
  specialties.forEach(spec => {
    spec.variations?.forEach(v => {
      v.master_benchmarks?.forEach(b => {
        benchmarks.push({
          ...b,
          spec_id: spec.spec_id,
          spec_name: spec.spec_name,
          var_id: v.var_id,
          var_name: v.name
        })
      })
    })
  })
  return benchmarks
}

const getBenchmarksByLevel = (specialties, level) => {
  return getAllBenchmarks(specialties).filter(b => b.level === level)
}

const updateBenchmarkStatus = (specialties, benchmarkId, updates) => {
  if (!specialties) return specialties
  
  return specialties.map(spec => ({
    ...spec,
    variations: (spec.variations || []).map(v => ({
      ...v,
      master_benchmarks: (v.master_benchmarks || []).map(b => {
        if (b.id === benchmarkId || b.legacy_id === benchmarkId) {
          return { ...b, ...updates }
        }
        return b
      })
    }))
  }))
}

const updateBenchmarksByLevel = (specialties, level, updates) => {
  if (!specialties) return specialties
  
  return specialties.map(spec => ({
    ...spec,
    variations: (spec.variations || []).map(v => ({
      ...v,
      master_benchmarks: (v.master_benchmarks || []).map(b => {
        if (b.level === level) {
          return { ...b, ...updates }
        }
        return b
      })
    }))
  }))
}

const calculateGearLevelFromSpecialties = (specialties) => {
  if (!specialties || specialties.length === 0) return 'L1'
  
  const benchmarks = getAllBenchmarks(specialties)
  if (benchmarks.length === 0) return 'L1'
  
  const l2Benchmarks = benchmarks.filter(b => b.level === 'L2')
  const l3Benchmarks = benchmarks.filter(b => b.level === 'L3')
  const l4Benchmarks = benchmarks.filter(b => b.level === 'L4')
  
  const hasL2Red = l2Benchmarks.some(b => b.is_mastered === false || b.l2_status === 'RED')
  
  if (hasL2Red) {
    return 'L1'
  }
  
  const l2AllGreen = l2Benchmarks.length > 0 && l2Benchmarks.every(b => b.is_mastered === true)
  const l3AllGreen = l3Benchmarks.length > 0 && l3Benchmarks.every(b => b.is_mastered === true)
  const l4AllGreen = l4Benchmarks.length > 0 && l4Benchmarks.every(b => b.is_mastered === true)
  
  if (l4AllGreen) return 'L4'
  if (l3AllGreen) return 'L3'
  if (l2AllGreen) return 'L2'
  
  if (l2Benchmarks.length > 0 && l3Benchmarks.some(b => b.is_mastered === false) && l2AllGreen) return 'L2'
  
  return 'L1'
}

export {
  checkBenchmarkDecay,
  checkEncounterDecay,
  getAllBenchmarks,
  getBenchmarksByLevel,
  updateBenchmarkStatus,
  updateBenchmarksByLevel,
  calculateGearLevelFromSpecialties,
  LEVEL_THRESHOLDS,
  DECAY_CONFIG,
  LEVEL_INITIAL_ELO
}
