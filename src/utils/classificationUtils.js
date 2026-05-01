import weaponDetailsAdapter from './weaponDetailsAdapter'

export const buildWeaponKeywordMap = () => {
  const keywordMap = new Map()
  
  const allWeapons = weaponDetailsAdapter.getAllWeapons()
  
  allWeapons.forEach(weapon => {
    if (!weapon.triggerKeywords) return
    
    weapon.triggerKeywords.forEach(keyword => {
      const normalizedKeyword = keyword.toLowerCase().trim()
      
      if (!keywordMap.has(normalizedKeyword)) {
        keywordMap.set(normalizedKeyword, [])
      }
      
      keywordMap.get(normalizedKeyword).push({
        weaponId: weapon.id,
        weaponName: weapon.name,
        category: weapon.category,
        motifIds: weapon.linkedMotifs?.map(m => m.id) || [],
        logicFlow: weapon.logicFlow || ''
      })
    })
  })
  
  return keywordMap
}

export const matchWeaponsByKeywords = (text, keywordMap) => {
  if (!text) return []
  
  const normalizedText = text.toLowerCase()
  const matches = []
  const matchedWeapons = new Set()
  
  keywordMap.forEach((weapons, keyword) => {
    if (normalizedText.includes(keyword)) {
      weapons.forEach(weapon => {
        if (!matchedWeapons.has(weapon.weaponId)) {
          matchedWeapons.add(weapon.weaponId)
          matches.push({
            keyword,
            ...weapon,
            relevance: keyword.length
          })
        }
      })
    }
  })
  
  matches.sort((a, b) => b.relevance - a.relevance)
  
  return matches.slice(0, 5)
}

export const getWeaponRecommendations = (classification, questionText = '') => {
  const keywordMap = buildWeaponKeywordMap()
  
  const recommendations = []
  
  if (questionText) {
    const textMatches = matchWeaponsByKeywords(questionText, keywordMap)
    recommendations.push(...textMatches.map(m => ({
      weaponId: m.weaponId,
      weaponName: m.weaponName,
      matchType: 'keyword',
      matchedKeyword: m.keyword
    })))
  }
  
  if (classification?.motifId) {
    const motifWeapons = []
    
    keywordMap.forEach((weapons) => {
      weapons.forEach(weapon => {
        if (weapon.motifIds.includes(classification.motifId)) {
          if (!recommendations.find(r => r.weaponId === weapon.weaponId)) {
            motifWeapons.push({
              weaponId: weapon.weaponId,
              weaponName: weapon.weaponName,
              matchType: 'motif',
              matchedMotif: classification.motifId
            })
          }
        }
      })
    })
    
    recommendations.push(...motifWeapons.slice(0, 3))
  }
  
  const uniqueRecommendations = []
  const seen = new Set()
  
  for (const rec of recommendations) {
    if (!seen.has(rec.weaponId)) {
      seen.add(rec.weaponId)
      uniqueRecommendations.push(rec)
    }
  }
  
  return uniqueRecommendations.slice(0, 5)
}

export const MOTIF_KEYWORDS = {
  'M01': ['集合', '子集', '交集', '并集', '补集', '空集', '逻辑', '命题', '复数', '虚数', '共轭'],
  'M02': ['不等式', '解集', '均值不等式', '基本不等式', '最值', '范围'],
  'M03': ['函数', '定义域', '值域', '单调性', '奇偶性', '周期', '对称', '零点', '图像'],
  'M04': ['指数', '对数', '幂函数', '指数函数', '对数函数', 'ln', 'log', 'e^'],
  'M05': ['向量', '数量积', '点积', '模', '夹角', '垂直', '平行', '坐标'],
  'M06': ['三角函数', '正弦', '余弦', '正切', 'sin', 'cos', 'tan', '诱导公式', '恒等变换'],
  'M07': ['解三角形', '正弦定理', '余弦定理', '边角', '面积', '外接圆'],
  'M08': ['数列', '等差', '等比', '通项', '求和', 'Sn', 'an', '递推'],
  'M09': ['立体几何', '空间', '平面', '直线', '垂直', '平行', '二面角', '体积', '表面积'],
  'M10': ['解析几何', '直线', '圆', '方程', '距离', '斜率', '切线', '弦长'],
  'M11': ['导数', '切线', '单调性', '极值', '最值', "f'", '求导', '积分'],
  'M12': ['概率', '统计', '期望', '方差', '分布', '随机', '独立', '互斥'],
  'M13': ['椭圆', '双曲线', '抛物线', '圆锥曲线', '焦点', '准线', '离心率'],
  'M14': ['导数综合', '零点', '证明', '不等式', '存在性', '唯一性'],
  'M15': ['数列综合', '放缩', '证明', '求和', '不等式'],
  'M16': ['排列', '组合', '二项式', '计数', 'C', 'A', '杨辉三角'],
  'M17': ['新定义', '创新', '情境', '阅读理解', '应用题']
}

export const classifyByKeywords = (text) => {
  if (!text) return { motifId: 'M01', confidence: 0.3 }
  
  const normalizedText = text.toLowerCase()
  const scores = {}
  
  Object.entries(MOTIF_KEYWORDS).forEach(([motifId, keywords]) => {
    let score = 0
    keywords.forEach(keyword => {
      const normalizedKeyword = keyword.toLowerCase()
      if (normalizedText.includes(normalizedKeyword)) {
        score += normalizedKeyword.length
      }
    })
    scores[motifId] = score
  })
  
  const sorted = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
  
  if (sorted.length === 0) {
    return { motifId: 'M01', confidence: 0.3 }
  }
  
  const [topMotif, topScore] = sorted[0]
  const totalScore = sorted.reduce((sum, [_, s]) => sum + s, 0)
  const confidence = Math.min(0.95, 0.5 + (topScore / totalScore) * 0.45)
  
  return {
    motifId: topMotif,
    confidence,
    allMatches: sorted.slice(0, 3).map(([id, score]) => ({ motifId: id, score }))
  }
}

export const enhanceDiagnosisWithKeywords = (diagnosisResult) => {
  const { questionText, classification } = diagnosisResult
  
  if (!questionText) return diagnosisResult
  
  const keywordClassification = classifyByKeywords(questionText)
  const weaponRecommendations = getWeaponRecommendations(classification, questionText)
  
  const enhancedClassification = {
    ...classification,
    motifId: classification?.motifId || keywordClassification.motifId,
    confidence: Math.max(classification?.confidence || 0, keywordClassification.confidence)
  }
  
  const existingWeapons = diagnosisResult.diagnosis?.suggestedWeapons || []
  const newWeaponIds = weaponRecommendations.map(r => r.weaponId)
  const mergedWeapons = [...new Set([...existingWeapons, ...newWeaponIds])].slice(0, 5)
  
  return {
    ...diagnosisResult,
    classification: enhancedClassification,
    diagnosis: {
      ...diagnosisResult.diagnosis,
      suggestedWeapons: mergedWeapons
    },
    weaponRecommendations,
    keywordMatch: keywordClassification
  }
}
