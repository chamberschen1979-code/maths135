import strategyLib from '../data/strategy_lib.json'
import { CATEGORY_TO_MOTIF } from '../constants/config'
import { getAllBenchmarks } from './benchmarkUtils'

const getWeaponInfo = (weaponId) => {
  if (!strategyLib) return null
  
  for (const category of strategyLib.categories) {
    for (const weapon of category.weapons || []) {
      if (weapon.id === weaponId) {
        return {
          id: weapon.id,
          name: weapon.name,
          category: category.name,
          categoryId: category.id,
          triggerKeywords: weapon.trigger_keywords,
          corePrinciple: weapon.core_principle,
          applicationScenarios: weapon.application_scenarios,
          pitfalls: weapon.pitfalls
        }
      }
    }
  }
  
  return null
}

const getWeaponProficiency = (weaponId, tacticalData) => {
  const weapon = getWeaponInfo(weaponId)
  if (!weapon || !tacticalData) return { exp: 0, proficiency: 0 }
  
  const motifId = CATEGORY_TO_MOTIF[weapon.categoryId]
  if (!motifId) return { exp: 0, proficiency: 0 }
  
  let totalExp = 0
  
  tacticalData.tactical_maps.forEach(map => {
    map.encounters.forEach(encounter => {
      if (encounter.target_id === motifId) {
        if (encounter.specialties) {
          encounter.specialties.forEach(spec => {
            spec.variations?.forEach(v => {
              v.master_benchmarks?.forEach(b => {
                if (b.is_mastered === true) {
                  totalExp += b.level === 'L4' ? 40 : b.level === 'L3' ? 25 : 15
                }
              })
            })
          })
        }
      }
    })
  })
  
  const proficiency = totalExp >= 200 ? 3 : totalExp >= 100 ? 2 : totalExp >= 40 ? 1 : 0
  return { exp: totalExp, proficiency }
}

const checkLowProficiencyWarning = (tacticalData) => {
  if (!tacticalData) return null
  
  const highFreqWeapons = ['S-DERIV-01', 'S-DERIV-02', 'S-DERIV-05', 'S-ANAL-01']
  
  for (const weaponId of highFreqWeapons) {
    const { exp, proficiency } = getWeaponProficiency(weaponId, tacticalData)
    const weapon = getWeaponInfo(weaponId)
    
    if (weapon && proficiency < 1 && exp < 30) {
      let stalledZone = ''
      const motifId = CATEGORY_TO_MOTIF[weapon.categoryId]
      
      for (const map of tacticalData.tactical_maps) {
        for (const encounter of map.encounters) {
          if (encounter.target_id === motifId) {
            if (encounter.elo_score < 1500 && encounter.elo_score > 800) {
              stalledZone = map.map_name
              break
            }
          }
        }
        if (stalledZone) break
      }
      
      if (stalledZone) {
        return {
          weaponName: weapon.name,
          zone: stalledZone,
          motif: motifId,
          exp
        }
      }
    }
  }
  
  return null
}

export {
  getWeaponInfo,
  getWeaponProficiency,
  checkLowProficiencyWarning
}
