const USERS_KEY = 'maths_users';
export const ADMIN_USERNAME = 'ccb';
export const ADMIN_PASSWORD = 'admin2026';

const STORAGE_PREFIX = 'maths_';
const STORAGE_VERSION = 'v1_';

export const getStorageKey = (key) => `${STORAGE_PREFIX}${STORAGE_VERSION}${key}`;

export const getUserDataKey = (username, dataType) => {
  return `${STORAGE_PREFIX}${STORAGE_VERSION}user_${username}_${dataType}`;
};

export const isLoggedIn = () => {
  return !!localStorage.getItem('maths_current_user');
};

export const init = () => {
  const saved = localStorage.getItem('maths_current_user');
  return saved || null;
};

const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

export const createUser = (username, password) => {
  const users = getAllUsers();
  if (users[username]) {
    return { success: false, error: '用户已存在' };
  }
  users[username] = {
    passwordHash: simpleHash(password),
    createdAt: new Date().toISOString(),
    hasAssessmentAccess: false
  };
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { success: true };
};

export const validateUser = (username, password) => {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return { success: true, isAdmin: true };
  }
  const users = getAllUsers();
  if (!users[username]) {
    return { success: false, error: '用户不存在' };
  }
  if (users[username].passwordHash !== simpleHash(password)) {
    return { success: false, error: '密码错误' };
  }
  return { success: true, isAdmin: false };
};

export const getAllUsers = () => {
  try {
    const saved = localStorage.getItem(USERS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export const deleteUser = (username) => {
  if (username === ADMIN_USERNAME) {
    return { success: false, error: '不能删除管理员' };
  }
  const users = getAllUsers();
  if (!users[username]) {
    return { success: false, error: '用户不存在' };
  }
  delete users[username];
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  const userDataPrefix = `${STORAGE_PREFIX}${STORAGE_VERSION}user_${username}_`;
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(userDataPrefix)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  return { success: true };
};

export const updateUserPermission = (username, hasAssessmentAccess) => {
  const users = getAllUsers();
  if (!users[username]) {
    return { success: false, error: '用户不存在' };
  }
  users[username].hasAssessmentAccess = hasAssessmentAccess;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { success: true };
};

export const hasAssessmentAccess = (username) => {
  if (username === ADMIN_USERNAME) return true;
  const users = getAllUsers();
  return users[username]?.hasAssessmentAccess || false;
};

export const getUserData = (username, dataType, defaultValue = null) => {
  try {
    const key = getUserDataKey(username, dataType);
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const setUserData = (username, dataType, data) => {
  try {
    const key = getUserDataKey(username, dataType);
    localStorage.setItem(key, JSON.stringify(data));
    return { success: true };
  } catch {
    return { success: false, error: '存储失败' };
  }
};

export const getCurrentUser = () => {
  return localStorage.getItem('maths_current_user');
};

export const getDataKey = (dataType) => {
  const user = localStorage.getItem('maths_current_user');
  if (!user) return getStorageKey(dataType);
  return getUserDataKey(user, dataType);
};

export const getData = (dataType, defaultValue = null) => {
  const key = getDataKey(dataType);
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const setData = (dataType, data) => {
  const key = getDataKey(dataType);
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return { success: true };
  } catch {
    return { success: false, error: '存储失败' };
  }
};

export const migrateToUserData = (dataType) => {
  const globalKey = getStorageKey(dataType);
  const userKey = getDataKey(dataType);
  try {
    const globalData = localStorage.getItem(globalKey);
    if (globalData && !localStorage.getItem(userKey)) {
      localStorage.setItem(userKey, globalData);
      return true;
    }
  } catch {}
  return false;
};

const ACTIVITY_KEY_PREFIX = `${STORAGE_PREFIX}${STORAGE_VERSION}activity_`;

export const addActivityLog = (username, entry) => {
  try {
    const key = `${ACTIVITY_KEY_PREFIX}${username}`;
    let log = [];
    try {
      const saved = localStorage.getItem(key);
      log = saved ? JSON.parse(saved) : [];
    } catch {}
    log.unshift({
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString(),
      ...entry
    });
    localStorage.setItem(key, JSON.stringify(log));
    return { success: true };
  } catch {
    return { success: false, error: '写入活动日志失败' };
  }
};

export const getActivityLog = (username, days = 7) => {
  try {
    const key = `${ACTIVITY_KEY_PREFIX}${username}`;
    const saved = localStorage.getItem(key);
    if (!saved) return [];
    const log = JSON.parse(saved);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return log.filter(e => new Date(e.timestamp).getTime() > cutoff);
  } catch {
    return [];
  }
};

export const getActivityStats = (username, days = 7) => {
  const log = getActivityLog(username, days);
  const battles = log.filter(e => e.type === 'battle');
  const certifications = log.filter(e => e.type === 'certification');
  const assessments = log.filter(e => e.type === 'assessment');
  const correctBattles = battles.filter(e => ['S', 'A'].includes(e.grade));
  const totalEloDelta = battles.reduce((sum, e) => sum + (e.eloDelta || 0), 0);
  return {
    battleCount: battles.length,
    certificationCount: certifications.length,
    assessmentCount: assessments.length,
    accuracy: battles.length > 0 ? Math.round((correctBattles.length / battles.length) * 100) : 0,
    eloDelta: totalEloDelta,
    recentBattles: battles.slice(0, 10),
    recentCertifications: certifications.slice(0, 5)
  };
};
