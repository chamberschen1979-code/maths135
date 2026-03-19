import strategyLib from '../data/strategy_lib.json'

let weaponNameCache = null

const buildWeaponNameCache = () => {
  if (weaponNameCache) return weaponNameCache
  
  weaponNameCache = new Map()
  
  if (!strategyLib?.categories) return weaponNameCache
  
  strategyLib.categories.forEach(category => {
    if (!category.weapons) return
    
    category.weapons.forEach(weapon => {
      if (weapon.id) {
        weaponNameCache.set(weapon.id, {
          name: weapon.name,
          category: category.name,
          logicFlow: weapon.logic_flow || '',
          description: weapon.description || '',
          triggerKeywords: weapon.trigger_keywords || []
        })
      }
    })
  })
  
  console.log(`[WeaponUtils] 构建了 ${weaponNameCache.size} 个杀手锏名称映射`)
  return weaponNameCache
}

export const getWeaponNameById = (weaponId) => {
  if (!weaponId) return null
  
  const cache = buildWeaponNameCache()
  const weapon = cache.get(weaponId)
  
  return weapon?.name || null
}

export const getWeaponById = (weaponId) => {
  if (!weaponId) return null
  
  const cache = buildWeaponNameCache()
  return cache.get(weaponId) || null
}

export const getWeaponLogicFlow = (weaponId) => {
  const weapon = getWeaponById(weaponId)
  return weapon?.logicFlow || null
}

export const getWeaponTriggerKeywords = (weaponId) => {
  const weapon = getWeaponById(weaponId)
  return weapon?.triggerKeywords || []
}

export const getWeaponInfo = (weaponId) => {
  if (!weaponId) return null
  
  const cache = buildWeaponNameCache()
  const weapon = cache.get(weaponId)
  
  if (!weapon) return null
  
  return {
    id: weaponId,
    name: weapon.name,
    category: weapon.category,
    logicFlow: weapon.logicFlow,
    description: weapon.description,
    triggerKeywords: weapon.triggerKeywords
  }
}

export const checkLowProficiencyWarning = (tacticalData) => {
  if (!tacticalData?.tactical_maps) return null
  
  let lowestWeapon = null
  let lowestExp = Infinity
  
  tacticalData.tactical_maps.forEach(map => {
    map.encounters?.forEach(encounter => {
      if (encounter.health_status === 'bleeding' && encounter.elo_score < 1200) {
        const exp = encounter.elo_score || 0
        if (exp < lowestExp) {
          lowestExp = exp
          lowestWeapon = {
            weaponId: encounter.target_id,
            weaponName: encounter.target_name,
            exp: exp,
            zone: map.map_name
          }
        }
      }
    })
  })
  
  return lowestWeapon
}

export const getAllWeapons = () => {
  const cache = buildWeaponNameCache()
  const weapons = []
  
  cache.forEach((value, key) => {
    weapons.push({
      id: key,
      ...value
    })
  })
  
  return weapons
}

export const findWeaponsByMotif = (motifId) => {
  const allWeapons = getAllWeapons()
  
  return allWeapons.filter(weapon => {
    return weapon.triggerKeywords.some(keyword => {
      const motif = findMotifByKeyword(keyword)
      return motif?.id === motifId
    })
  })
}

const MOTIF_KEYWORDS = {
  'M01': ['集合', '子集', '交集', '并集', '补集', '空集', '逻辑', '命题', '复数'],
  'M02': ['不等式', '解集', '均值不等式', '基本不等式'],
  'M03': ['函数', '定义域', '值域', '单调性', '奇偶性', '零点'],
  'M04': ['指数', '对数', '幂函数'],
  'M05': ['向量', '数量积', '点积'],
  'M06': ['三角函数', '正弦', '余弦', '正切'],
  'M07': ['解三角形', '正弦定理', '余弦定理'],
  'M08': ['数列', '等差', '等比', '通项', '求和'],
  'M09': ['立体几何', '空间', '二面角', '体积'],
  'M10': ['解析几何', '直线', '圆', '切线'],
  'M11': ['导数', '切线', '极值', '最值'],
  'M12': ['概率', '统计', '期望', '方差'],
  'M13': ['椭圆', '双曲线', '抛物线', '圆锥曲线'],
  'M14': ['导数综合', '零点', '证明'],
  'M15': ['数列综合', '放缩'],
  'M16': ['排列', '组合', '二项式'],
  'M17': ['新定义', '创新', '情境']
}

const findMotifByKeyword = (keyword) => {
  const normalizedKeyword = keyword.toLowerCase()
  
  for (const [motifId, keywords] of Object.entries(MOTIF_KEYWORDS)) {
    if (keywords.some(k => k.toLowerCase().includes(normalizedKeyword) || normalizedKeyword.includes(k.toLowerCase()))) {
      return { id: motifId, name: getMotifName(motifId) }
    }
  }
  
  return null
}

const getMotifName = (motifId) => {
  const names = {
    'M01': '集合、逻辑用语与复数',
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
    'M17': '创新思维与情境'
  }
  
  return names[motifId] || '未知母题'
}
