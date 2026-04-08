/**
 * 武器详情适配器
 * 将 weapon_details.json 的扁平结构转换为分类格式
 * 提供杀手锏查询和匹配功能
 */

import weaponDetails from '../data/weapon_details.json'

let weaponCache = null
let categoryCache = null

const WEAPON_NAMES = {
  'S-SET-01': '空集优先讨论',
  'S-SET-02': '集合运算化简',
  'S-SET-03': '韦恩图分析',
  'S-FUNC-01': '定义域优先',
  'S-FUNC-02': '同增异减法则',
  'S-FUNC-03': '奇偶性判断',
  'S-FUNC-04': '零点交点转化',
  'S-FUNC-05': '数形结合分析',
  'S-FUNC-06': '函数性质综合',
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
  'S-SEQ-09': '数列综合应用',
  'S-SEQ-10': '递推与求和',
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
  'S-DERIV-03': '导数综合应用',
  'S-DERIV-04': '极值点偏移',
  'S-PROB-01': '古典概型',
  'S-PROB-02': '条件概率',
  'S-PROB-03': '期望方差',
  'S-PROB-04': '分布列',
  'S-PROB-05': '统计推断',
  'S-LOG-01': '换底公式链式消去',
  'S-LOG-02': '指对同构构造法',
  'S-LOG-03': '定点与反函数对称',
  'S-LOG-05': '对数平均不等式',
  'S-VIS-01': '函数动态图像分析',
  'S-INEQ-01': '基本不等式',
  'S-INEQ-02': '均值不等式',
  'S-INEQ-03': '柯西不等式',
  'S-INEQ-04': '同构构造单调性'
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

const MOTIF_LINKS = {
  'S-SET-01': ['M01'],
  'S-SET-02': ['M01'],
  'S-SET-03': ['M01'],
  'S-FUNC-01': ['M03'],
  'S-FUNC-02': ['M03'],
  'S-FUNC-03': ['M03'],
  'S-FUNC-04': ['M03', 'M04'],
  'S-FUNC-05': ['M03', 'M04'],
  'S-TRIG-01': ['M06'],
  'S-TRIG-02': ['M06'],
  'S-TRIG-03': ['M06'],
  'S-TRIG-04': ['M06'],
  'S-TRIG-05': ['M06'],
  'S-VEC-01': ['M05'],
  'S-VEC-02': ['M05'],
  'S-VEC-03': ['M05'],
  'S-VEC-04': ['M05'],
  'S-VEC-05': ['M05'],
  'S-SEQ-01': ['M08'],
  'S-SEQ-02': ['M08'],
  'S-SEQ-03': ['M08'],
  'S-SEQ-04': ['M08'],
  'S-SEQ-05': ['M08'],
  'S-GEO-01': ['M09'],
  'S-GEO-02': ['M09'],
  'S-GEO-03': ['M09'],
  'S-GEO-04': ['M09'],
  'S-GEO-05': ['M09'],
  'S-ANA-01': ['M10', 'M13'],
  'S-ANA-02': ['M10', 'M13'],
  'S-ANA-03': ['M10', 'M13'],
  'S-ANA-04': ['M10', 'M13'],
  'S-ANA-05': ['M10', 'M13'],
  'S-DER-01': ['M11', 'M14'],
  'S-DER-02': ['M11', 'M14'],
  'S-DER-03': ['M11', 'M14'],
  'S-DER-04': ['M11', 'M14'],
  'S-DER-05': ['M11', 'M14'],
  'S-PROB-01': ['M12'],
  'S-PROB-02': ['M12'],
  'S-PROB-03': ['M12'],
  'S-PROB-04': ['M12'],
  'S-PROB-05': ['M12']
}

const TRIGGER_KEYWORDS = {
  'S-SET-01': ['空集', '子集', '包含', 'A⊆B'],
  'S-SET-02': ['交集', '并集', '补集', '集合运算'],
  'S-SET-03': ['韦恩图', '集合关系'],
  'S-FUNC-01': ['定义域', '值域', '有意义'],
  'S-FUNC-02': ['单调性', '复合函数', '同增异减'],
  'S-FUNC-03': ['奇函数', '偶函数', '对称'],
  'S-FUNC-04': ['零点', '交点', '根'],
  'S-FUNC-05': ['数形结合', '图像'],
  'S-TRIG-01': ['恒等变换', '诱导公式', '倍角'],
  'S-TRIG-02': ['图象变换', '平移', '伸缩'],
  'S-TRIG-03': ['五点作图', '图象'],
  'S-TRIG-04': ['ω范围', '周期', '单调区间'],
  'S-TRIG-05': ['辅助角公式', '最值', '振幅'],
  'S-VEC-01': ['基底', '向量分解'],
  'S-VEC-02': ['坐标', '向量运算'],
  'S-VEC-03': ['几何意义', '投影'],
  'S-VEC-04': ['建系', '坐标系'],
  'S-VEC-05': ['数量积', '夹角', '垂直'],
  'S-SEQ-01': ['等差', '等比', '下标'],
  'S-SEQ-02': ['错位相减', '求和'],
  'S-SEQ-03': ['裂项', '相消'],
  'S-SEQ-04': ['分组', '求和'],
  'S-SEQ-05': ['通项', '递推'],
  'S-GEO-01': ['建系', '坐标'],
  'S-GEO-02': ['几何法', '证明'],
  'S-GEO-03': ['体积', '等体积'],
  'S-GEO-04': ['空间向量', '法向量'],
  'S-GEO-05': ['二面角', '夹角'],
  'S-ANA-01': ['设点', '参数'],
  'S-ANA-02': ['韦达定理', '根与系数'],
  'S-ANA-03': ['点差法', '中点'],
  'S-ANA-04': ['切线', '切点'],
  'S-ANA-05': ['轨迹', '方程'],
  'S-DER-01': ['求导', '导数'],
  'S-DER-02': ['切线', '切点'],
  'S-DER-03': ['单调性', '增减'],
  'S-DER-04': ['极值', '最值'],
  'S-DER-05': ['零点', '根'],
  'S-PROB-01': ['古典概型', '等可能'],
  'S-PROB-02': ['条件概率', '贝叶斯'],
  'S-PROB-03': ['期望', '方差'],
  'S-PROB-04': ['分布', '随机变量'],
  'S-PROB-05': ['统计', '样本']
}

const extractFormula = (coreLogic) => {
  if (!coreLogic) return '核心解题步骤'
  const match = coreLogic.match(/['"「」『』]([^'"「」『』]+)['"「」『』]/)
  if (match) return match[1]
  const parts = coreLogic.split(/[。：:]/)
  return parts[0]?.slice(0, 50) || '核心解题步骤'
}

const buildWeaponCache = () => {
  if (weaponCache) return weaponCache
  
  weaponCache = new Map()
  
  Object.entries(weaponDetails).forEach(([weaponId, details]) => {
    const categoryPrefix = weaponId.split('-').slice(0, 2).join('-')
    const category = WEAPON_CATEGORIES[categoryPrefix] || { id: 'other', name: '其他' }
    
    const scenarios = details.scenarios || []
    const pitfalls = details.pitfalls || []
    const scenarioTags = scenarios.filter(s => !s.match(/^M\d{2}/))
    
    weaponCache.set(weaponId, {
      id: weaponId,
      name: WEAPON_NAMES[weaponId] || weaponId,
      category: category.name,
      categoryId: category.id,
      logicFlow: details.coreLogic || '',
      logic_flow: details.coreLogic || '',
      description: details.coreLogic || '',
      triggerKeywords: TRIGGER_KEYWORDS[weaponId] || [],
      trigger_keywords: TRIGGER_KEYWORDS[weaponId] || [],
      scenarios: scenarios,
      pitfalls: pitfalls,
      example: details.example || null,
      linkedMotifs: (MOTIF_LINKS[weaponId] || []).map(id => ({ id })),
      certification: {
        focusLogic: extractFormula(details.coreLogic),
        antiPattern: pitfalls[0] || '跳步或逻辑跳跃',
        scenarioTags: scenarioTags
      }
    })
  })
  
  console.log(`[WeaponDetailsAdapter] 构建了 ${weaponCache.size} 个杀手锏映射`)
  return weaponCache
}

const buildCategoryCache = () => {
  if (categoryCache) return categoryCache
  
  const cache = buildWeaponCache()
  categoryCache = { categories: [] }
  
  const categoryMap = new Map()
  
  cache.forEach((weapon, weaponId) => {
    const catId = weapon.categoryId
    if (!categoryMap.has(catId)) {
      categoryMap.set(catId, {
        id: catId,
        name: weapon.category,
        weapons: []
      })
    }
    categoryMap.get(catId).weapons.push({
      id: weaponId,
      name: weapon.name,
      logic_flow: weapon.logicFlow,
      trigger_keywords: weapon.triggerKeywords,
      description: weapon.description,
      linked_motifs: weapon.linkedMotifs
    })
  })
  
  categoryCache.categories = Array.from(categoryMap.values())
  
  return categoryCache
}

export const getWeaponById = (weaponId) => {
  if (!weaponId) return null
  const cache = buildWeaponCache()
  return cache.get(weaponId) || null
}

export const getWeaponNameById = (weaponId) => {
  const weapon = getWeaponById(weaponId)
  return weapon?.name || null
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
  return getWeaponById(weaponId)
}

export const getAllWeapons = () => {
  const cache = buildWeaponCache()
  const weapons = []
  cache.forEach((value, key) => {
    weapons.push({ id: key, ...value })
  })
  return weapons
}

export const getWeaponsByCategory = (categoryId) => {
  const allWeapons = getAllWeapons()
  return allWeapons.filter(w => w.categoryId === categoryId)
}

export const getWeaponCategories = () => {
  const cache = buildCategoryCache()
  return cache.categories
}

export const findWeaponsByMotif = (motifId) => {
  const allWeapons = getAllWeapons()
  return allWeapons.filter(weapon => 
    weapon.linkedMotifs?.some(m => m.id === motifId)
  )
}

export const matchWeaponsByKeywords = (text) => {
  if (!text) return []
  
  const normalizedText = text.toLowerCase()
  const matches = []
  const matchedWeapons = new Set()
  
  const cache = buildWeaponCache()
  
  cache.forEach((weapon, weaponId) => {
    weapon.triggerKeywords.forEach(keyword => {
      const normalizedKeyword = keyword.toLowerCase()
      if (normalizedText.includes(normalizedKeyword) && !matchedWeapons.has(weaponId)) {
        matchedWeapons.add(weaponId)
        matches.push({
          weaponId,
          weaponName: weapon.name,
          category: weapon.category,
          matchedKeyword: keyword,
          relevance: keyword.length
        })
      }
    })
  })
  
  matches.sort((a, b) => b.relevance - a.relevance)
  return matches.slice(0, 5)
}

export const getWeaponRecommendations = (classification, questionText = '') => {
  const recommendations = []
  
  if (questionText) {
    const textMatches = matchWeaponsByKeywords(questionText)
    recommendations.push(...textMatches.map(m => ({
      weaponId: m.weaponId,
      weaponName: m.weaponName,
      matchType: 'keyword',
      matchedKeyword: m.matchedKeyword
    })))
  }
  
  if (classification?.motifId) {
    const motifWeapons = findWeaponsByMotif(classification.motifId)
    motifWeapons.forEach(weapon => {
      if (!recommendations.find(r => r.weaponId === weapon.id)) {
        recommendations.push({
          weaponId: weapon.id,
          weaponName: weapon.name,
          matchType: 'motif',
          matchedMotif: classification.motifId
        })
      }
    })
  }
  
  return recommendations.slice(0, 5)
}

export const getStrategyLibCompatible = () => {
  return buildCategoryCache()
}

export default {
  getWeaponById,
  getWeaponNameById,
  getWeaponLogicFlow,
  getWeaponTriggerKeywords,
  getWeaponInfo,
  getAllWeapons,
  getWeaponsByCategory,
  getWeaponCategories,
  findWeaponsByMotif,
  matchWeaponsByKeywords,
  getWeaponRecommendations,
  getStrategyLibCompatible
}
