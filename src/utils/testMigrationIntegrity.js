/**
 * 极限场景测试脚本
 * 测试熔断、升级、持久化等核心功能
 */

const LEVEL_THRESHOLDS = {
  L1: { min: 0, max: 999 },
  L2: { min: 1000, max: 1799 },
  L3: { min: 1800, max: 2499 },
  L4: { min: 2500, max: 3000 },
}

const LEVEL_INITIAL_ELO = {
  L1: 800,
  L2: 1000,
  L3: 1800,
  L4: 2500
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

const calculateGearLevelFromSpecialties = (specialties) => {
  if (!specialties || specialties.length === 0) return 'L1'
  
  const benchmarks = getAllBenchmarks(specialties)
  if (benchmarks.length === 0) return 'L1'
  
  const l2Benchmarks = benchmarks.filter(b => b.level === 'L2')
  const l3Benchmarks = benchmarks.filter(b => b.level === 'L3')
  const l4Benchmarks = benchmarks.filter(b => b.level === 'L4')
  
  const hasL2Red = l2Benchmarks.some(b => b.is_mastered === false || b.l2_status === 'RED')
  const hasL3Red = l3Benchmarks.some(b => b.is_mastered === false || b.l2_status === 'RED')
  const hasL4Red = l4Benchmarks.some(b => b.is_mastered === false || b.l2_status === 'RED')
  
  if (hasL2Red) {
    return 'L1'
  }
  
  const l2AllGreen = l2Benchmarks.length > 0 && l2Benchmarks.every(b => b.is_mastered === true)
  const l3AllGreen = l3Benchmarks.length > 0 && l3Benchmarks.every(b => b.is_mastered === true)
  const l4AllGreen = l4Benchmarks.length > 0 && l4Benchmarks.every(b => b.is_mastered === true)
  
  if (l4AllGreen) return 'L4'
  if (l3AllGreen) return 'L3'
  if (l2AllGreen) return 'L2'
  
  return 'L1'
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
  
  return LEVEL_INITIAL_ELO.L1
}

console.log('=== 极限场景测试开始 ===\n')

// 测试 A: 熔断测试
console.log('【测试 A】熔断逻辑测试')
const meltdownSpecialties = [
  {
    spec_id: 'V1',
    spec_name: '专项1',
    variations: [
      {
        var_id: '1.1',
        name: '变例1',
        master_benchmarks: [
          { level: 'L2', id: 'b1', is_mastered: false, l2_status: 'RED' },
          { level: 'L3', id: 'b2', is_mastered: true },
          { level: 'L4', id: 'b3', is_mastered: true }
        ]
      }
    ]
  }
]

const meltdownLevel = calculateGearLevelFromSpecialties(meltdownSpecialties)
const meltdownElo = calculateEloFromSpecialties(meltdownSpecialties)
console.log(`  输入: L2 RED, L3 GREEN, L4 GREEN`)
console.log(`  期望等级: L1 (熔断)`)
console.log(`  实际等级: ${meltdownLevel}`)
console.log(`  期望Elo: ${LEVEL_INITIAL_ELO.L1}`)
console.log(`  实际Elo: ${meltdownElo}`)
console.log(`  结果: ${meltdownLevel === 'L1' ? '✅ 通过' : '❌ 失败'}`)

// 测试 B: 升级测试
console.log('\n【测试 B】升级逻辑测试')
const upgradeSpecialties = [
  {
    spec_id: 'V1',
    spec_name: '专项1',
    variations: [
      {
        var_id: '1.1',
        name: '变例1',
        master_benchmarks: [
          { level: 'L2', id: 'b1', is_mastered: true },
          { level: 'L3', id: 'b2', is_mastered: true }
        ]
      }
    ]
  }
]

const upgradeLevel = calculateGearLevelFromSpecialties(upgradeSpecialties)
const upgradeElo = calculateEloFromSpecialties(upgradeSpecialties)
console.log(`  输入: L2 GREEN, L3 GREEN, 无 L4`)
console.log(`  期望等级: L3`)
console.log(`  实际等级: ${upgradeLevel}`)
console.log(`  期望Elo: ${LEVEL_THRESHOLDS.L3.min}`)
console.log(`  实际Elo: ${upgradeElo}`)
console.log(`  结果: ${upgradeLevel === 'L3' ? '✅ 通过' : '❌ 失败'}`)

// 测试 C: 持久化测试
console.log('\n【测试 C】持久化测试')
const testSpecialties = [
  {
    spec_id: 'V1',
    spec_name: '专项1',
    variations: [
      {
        var_id: '1.1',
        name: '变例1',
        master_benchmarks: [
          { level: 'L2', id: 'b1', is_mastered: true, consecutive_correct: 3, last_practice: new Date().toISOString() }
        ]
      }
    ]
  }
]

const testData = {
  schemaVersion: 2,
  tactical_maps: [{
    map_id: 'test',
    encounters: [{
      target_id: 'M16',
      target_name: '计数原理',
      specialties: testSpecialties,
      elo_score: 1000,
      gear_level: 'L2'
    }]
  }]
}

const serialized = JSON.stringify(testData)
const deserialized = JSON.parse(serialized)
const persistedLevel = calculateGearLevelFromSpecialties(deserialized.tactical_maps[0].encounters[0].specialties)

console.log(`  输入: L2 GREEN, 序列化后反序列化`)
console.log(`  期望等级: L2`)
console.log(`  实际等级: ${persistedLevel}`)
console.log(`  结果: ${persistedLevel === 'L2' ? '✅ 通过' : '❌ 失败'}`)

// 测试 D: 全绿测试
console.log('\n【测试 D】全绿测试 (L4)')
const allGreenSpecialties = [
  {
    spec_id: 'V1',
    spec_name: '专项1',
    variations: [
      {
        var_id: '1.1',
        name: '变例1',
        master_benchmarks: [
          { level: 'L2', id: 'b1', is_mastered: true },
          { level: 'L3', id: 'b2', is_mastered: true },
          { level: 'L4', id: 'b3', is_mastered: true }
        ]
      }
    ]
  }
]

const allGreenLevel = calculateGearLevelFromSpecialties(allGreenSpecialties)
const allGreenElo = calculateEloFromSpecialties(allGreenSpecialties)
console.log(`  输入: L2 GREEN, L3 GREEN, L4 GREEN`)
console.log(`  期望等级: L4`)
console.log(`  实际等级: ${allGreenLevel}`)
console.log(`  期望Elo: ${LEVEL_THRESHOLDS.L4.min}`)
console.log(`  实际Elo: ${allGreenElo}`)
console.log(`  结果: ${allGreenLevel === 'L4' ? '✅ 通过' : '❌ 失败'}`)

// 测试 E: 空数据测试
console.log('\n【测试 E】空数据测试')
const emptyLevel = calculateGearLevelFromSpecialties(null)
const emptyElo = calculateEloFromSpecialties(null)
console.log(`  输入: null`)
console.log(`  期望等级: L1`)
console.log(`  实际等级: ${emptyLevel}`)
console.log(`  期望Elo: ${LEVEL_INITIAL_ELO.L1}`)
console.log(`  实际Elo: ${emptyElo}`)
console.log(`  结果: ${emptyLevel === 'L1' && emptyElo === LEVEL_INITIAL_ELO.L1 ? '✅ 通过' : '❌ 失败'}`)

console.log('\n=== 测试完成 ===')

export {
  calculateGearLevelFromSpecialties,
  calculateEloFromSpecialties,
  getAllBenchmarks
}
