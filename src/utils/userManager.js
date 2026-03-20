const USERS_KEY = 'mw_users'
const CURRENT_USER_KEY = 'mw_current_user'

export const getAllUsers = () => {
  try {
    const data = localStorage.getItem(USERS_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.warn('[userManager] 读取用户列表失败:', e)
    return []
  }
}

const saveUsers = (users) => {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch (e) {
    console.warn('[userManager] 保存用户列表失败:', e)
  }
}

export const getCurrentUser = () => {
  try {
    const userId = localStorage.getItem(CURRENT_USER_KEY)
    if (!userId) return null
    const users = getAllUsers()
    return users.find(u => u.id === userId) || null
  } catch (e) {
    console.warn('[userManager] 获取当前用户失败:', e)
    return null
  }
}

export const init = () => {
  const currentUser = getCurrentUser()
  if (currentUser) {
    updateLastActive(currentUser.id)
  }
  return currentUser
}

export const createUser = (name) => {
  const users = getAllUsers()
  const newUser = {
    id: `user_${Date.now()}`,
    name: name.trim() || `用户${users.length + 1}`,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  }
  users.push(newUser)
  saveUsers(users)
  localStorage.setItem(CURRENT_USER_KEY, newUser.id)
  console.log('[userManager] 创建用户成功:', newUser.name)
  return newUser
}

export const switchUser = (userId) => {
  const users = getAllUsers()
  const user = users.find(u => u.id === userId)
  if (!user) {
    console.warn('[userManager] 用户不存在:', userId)
    return false
  }
  
  user.lastActiveAt = new Date().toISOString()
  saveUsers(users)
  localStorage.setItem(CURRENT_USER_KEY, userId)
  console.log('[userManager] 切换用户成功:', user.name)
  return true
}

export const deleteUser = (userId) => {
  const users = getAllUsers()
  const index = users.findIndex(u => u.id === userId)
  if (index === -1) return false
  
  users.splice(index, 1)
  saveUsers(users)
  
  const currentUser = getCurrentUser()
  if (currentUser?.id === userId) {
    localStorage.removeItem(CURRENT_USER_KEY)
  }
  
  const keysToDelete = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(`${userId}_`)) {
      keysToDelete.push(key)
    }
  }
  keysToDelete.forEach(key => localStorage.removeItem(key))
  
  console.log('[userManager] 删除用户成功:', userId)
  return true
}

export const getStorageKey = (key) => {
  const user = getCurrentUser()
  if (!user) {
    throw new Error('[userManager] 未登录，无法获取存储 Key')
  }
  return `${user.id}_${key}`
}

export const safeGetStorageKey = (key) => {
  try {
    return getStorageKey(key)
  } catch {
    return null
  }
}

const updateLastActive = (userId) => {
  const users = getAllUsers()
  const user = users.find(u => u.id === userId)
  if (user) {
    user.lastActiveAt = new Date().toISOString()
    saveUsers(users)
  }
}

export const isLoggedIn = () => {
  return getCurrentUser() !== null
}

export const getUserStats = () => {
  const users = getAllUsers()
  const current = getCurrentUser()
  return {
    total: users.length,
    currentName: current?.name || '未登录',
    currentId: current?.id || null
  }
}
