const STORAGE_KEY = 'weapon_progress'

const getProgressData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch (e) {
    console.warn('[weaponProgress] 读取进度失败:', e)
    return {}
  }
}

const saveProgressData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('[weaponProgress] 保存进度失败:', e)
  }
}

export const markAsLearned = (weaponId) => {
  if (!weaponId) return
  
  const data = getProgressData()
  
  if (!data[weaponId]) {
    data[weaponId] = {
      learned: false,
      learnedAt: null,
      certified: false,
      certifiedAt: null,
      practiceCount: 0
    }
  }
  
  data[weaponId].learned = true
  data[weaponId].learnedAt = new Date().toISOString()
  
  saveProgressData(data)
  console.log(`[weaponProgress] ${weaponId} 已标记为已学习`)
}

export const markAsCertified = (weaponId) => {
  if (!weaponId) return
  
  const data = getProgressData()
  
  if (!data[weaponId]) {
    data[weaponId] = {
      learned: false,
      learnedAt: null,
      certified: false,
      certifiedAt: null,
      practiceCount: 0
    }
  }
  
  data[weaponId].certified = true
  data[weaponId].certifiedAt = new Date().toISOString()
  
  saveProgressData(data)
  console.log(`[weaponProgress] ${weaponId} 已标记为已认证`)
}

export const incrementPracticeCount = (weaponId) => {
  if (!weaponId) return
  
  const data = getProgressData()
  
  if (!data[weaponId]) {
    data[weaponId] = {
      learned: false,
      learnedAt: null,
      certified: false,
      certifiedAt: null,
      practiceCount: 0
    }
  }
  
  data[weaponId].practiceCount = (data[weaponId].practiceCount || 0) + 1
  
  saveProgressData(data)
}

export const getProgress = (weaponId) => {
  if (!weaponId) return null
  
  const data = getProgressData()
  return data[weaponId] || {
    learned: false,
    learnedAt: null,
    certified: false,
    certifiedAt: null,
    practiceCount: 0
  }
}

export const isLearned = (weaponId) => {
  return getProgress(weaponId)?.learned || false
}

export const isCertified = (weaponId) => {
  return getProgress(weaponId)?.certified || false
}

export const getAllProgress = () => {
  return getProgressData()
}

export const getLearnedWeapons = () => {
  const data = getProgressData()
  return Object.entries(data)
    .filter(([_, progress]) => progress.learned)
    .map(([weaponId, progress]) => ({ weaponId, ...progress }))
}

export const getCertifiedWeapons = () => {
  const data = getProgressData()
  return Object.entries(data)
    .filter(([_, progress]) => progress.certified)
    .map(([weaponId, progress]) => ({ weaponId, ...progress }))
}

export const clearProgress = () => {
  localStorage.removeItem(STORAGE_KEY)
}

export const getStats = () => {
  const data = getProgressData()
  const weapons = Object.values(data)
  
  return {
    total: weapons.length,
    learned: weapons.filter(w => w.learned).length,
    certified: weapons.filter(w => w.certified).length,
    totalPractices: weapons.reduce((sum, w) => sum + (w.practiceCount || 0), 0)
  }
}
