/**
 * 题目状态管理工具
 * 实现"做对即冻结、做错入循环"的核心逻辑
 */

const STORAGE_KEY = 'user_question_progress';
const DEFAULT_COOLDOWN_DAYS = 14;
const L4_MASTERY_THRESHOLD = 2;

/**
 * 获取用户进度数据
 */
export const getUserProgress = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('[questionStateManager] 读取进度失败:', e);
  }
  return {
    mastered_pool: [],
    weak_point_buffer: {},
    l4_mastery_counter: {}
  };
};

/**
 * 保存用户进度数据
 */
const saveUserProgress = (progress) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch (e) {
    console.error('[questionStateManager] 保存进度失败:', e);
    return false;
  }
};

/**
 * 获取已掌握题目列表
 */
export const getMasteredPool = () => {
  const progress = getUserProgress();
  return progress.mastered_pool || [];
};

/**
 * 添加到已掌握池
 */
export const addToMasteredPool = (questionId) => {
  const progress = getUserProgress();
  
  if (!progress.mastered_pool.includes(questionId)) {
    progress.mastered_pool.push(questionId);
    saveUserProgress(progress);
    return true;
  }
  
  return false;
};

/**
 * 从已掌握池移除（用于重置）
 */
export const removeFromMasteredPool = (questionId) => {
  const progress = getUserProgress();
  const index = progress.mastered_pool.indexOf(questionId);
  
  if (index > -1) {
    progress.mastered_pool.splice(index, 1);
    saveUserProgress(progress);
    return true;
  }
  
  return false;
};

/**
 * 获取错题缓冲区
 */
export const getWeakPointBuffer = () => {
  const progress = getUserProgress();
  return progress.weak_point_buffer || {};
};

/**
 * 添加到错题缓冲区
 */
export const addToWeakPointBuffer = (questionId, level, motifId, cooldownDays = DEFAULT_COOLDOWN_DAYS) => {
  const progress = getUserProgress();
  
  progress.weak_point_buffer[questionId] = {
    addedAt: new Date().toISOString(),
    level: level,
    motifId: motifId,
    cooldownDays: cooldownDays
  };
  
  saveUserProgress(progress);
  return true;
};

/**
 * 从错题缓冲区移除
 */
export const removeFromWeakPointBuffer = (questionId) => {
  const progress = getUserProgress();
  
  if (progress.weak_point_buffer[questionId]) {
    delete progress.weak_point_buffer[questionId];
    saveUserProgress(progress);
    return true;
  }
  
  return false;
};

/**
 * 检查题目是否在冷却期
 */
export const isInCooldown = (questionId) => {
  const progress = getUserProgress();
  const errorRecord = progress.weak_point_buffer?.[questionId];
  
  if (!errorRecord) return false;
  
  const addedDate = new Date(errorRecord.addedAt);
  const now = new Date();
  const diffDays = (now - addedDate) / (1000 * 60 * 60 * 24);
  const cooldownDays = errorRecord.cooldownDays || DEFAULT_COOLDOWN_DAYS;
  
  return diffDays < cooldownDays;
};

/**
 * 获取冷却剩余天数
 */
export const getCooldownRemainingDays = (questionId) => {
  const progress = getUserProgress();
  const errorRecord = progress.weak_point_buffer?.[questionId];
  
  if (!errorRecord) return 0;
  
  const addedDate = new Date(errorRecord.addedAt);
  const now = new Date();
  const diffDays = (now - addedDate) / (1000 * 60 * 60 * 24);
  const cooldownDays = errorRecord.cooldownDays || DEFAULT_COOLDOWN_DAYS;
  const remaining = cooldownDays - diffDays;
  
  return Math.max(0, Math.ceil(remaining));
};

/**
 * 获取 L4 题目的做对计数
 */
export const getL4MasteryCounter = () => {
  const progress = getUserProgress();
  return progress.l4_mastery_counter || {};
};

/**
 * L4 题目做对计数 +1
 * @returns {boolean} 是否达到冻结阈值
 */
export const incrementL4Mastery = (questionId) => {
  const progress = getUserProgress();
  
  if (!progress.l4_mastery_counter) {
    progress.l4_mastery_counter = {};
  }
  
  const current = progress.l4_mastery_counter[questionId] || { count: 0, lastCorrectAt: null };
  const newCount = current.count + 1;
  
  progress.l4_mastery_counter[questionId] = {
    count: newCount,
    lastCorrectAt: new Date().toISOString()
  };
  
  saveUserProgress(progress);
  
  if (newCount >= L4_MASTERY_THRESHOLD) {
    return true;
  } else {
    return false;
  }
};

/**
 * 检查 L4 题目是否已达到冻结阈值
 */
export const checkL4Mastered = (questionId) => {
  const progress = getUserProgress();
  const counter = progress.l4_mastery_counter?.[questionId];
  
  return counter && counter.count >= L4_MASTERY_THRESHOLD;
};

/**
 * 过滤可用题目（使用 ID 匹配，避免字段不一致问题）
 */
export const filterAvailableSeeds = (originalPool, userProgress) => {
  const { masteredPool = [], weakPointBuffer = {} } = userProgress;
  const now = new Date();

  return originalPool.filter(seed => {
    if (!seed || !seed.id) return false;
    
    if (masteredPool.includes(seed.id)) {
      return false;
    }
    
    const errorRecord = weakPointBuffer[seed.id];
    if (errorRecord) {
      const addedDate = new Date(errorRecord.addedAt);
      const diffDays = (now - addedDate) / (1000 * 60 * 60 * 24);
      if (diffDays < (errorRecord.cooldownDays || DEFAULT_COOLDOWN_DAYS)) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * 获取冷却期结束的错题
 */
export const getCooledQuestions = (weakPointBuffer) => {
  const now = new Date();
  const cooled = [];
  
  for (const [questionId, record] of Object.entries(weakPointBuffer || {})) {
    const addedDate = new Date(record.addedAt);
    const diffDays = (now - addedDate) / (1000 * 60 * 60 * 24);
    const cooldownDays = record.cooldownDays || DEFAULT_COOLDOWN_DAYS;
    
    if (diffDays >= cooldownDays) {
      cooled.push({
        id: questionId,
        ...record,
        cooledAt: addedDate.toISOString()
      });
    }
  }
  
  return cooled.sort((a, b) => new Date(a.cooledAt) - new Date(b.cooledAt));
};

/**
 * 标记题目为已掌握（根据难度自动处理）
 * @returns {Object} { mastered: boolean, message: string }
 */
export const markAsMastered = (questionId, level) => {
  if (level === 'L4') {
    const reached = incrementL4Mastery(questionId);
    if (reached) {
      addToMasteredPool(questionId);
      removeFromWeakPointBuffer(questionId);
      return { mastered: true, message: `L4 题目累计做对 ${L4_MASTERY_THRESHOLD} 次，已冻结` };
    } else {
      const counter = getL4MasteryCounter()[questionId];
      return { 
        mastered: false, 
        message: `L4 题目做对 ${counter?.count || 1} 次，还需 ${L4_MASTERY_THRESHOLD - (counter?.count || 1)} 次` 
      };
    }
  } else {
    addToMasteredPool(questionId);
    removeFromWeakPointBuffer(questionId);
    return { mastered: true, message: `${level} 题目已冻结` };
  }
};

/**
 * 标记题目为薄弱点
 */
export const markAsWeak = (questionId, level, motifId) => {
  addToWeakPointBuffer(questionId, level, motifId);
  return { success: true, message: `题目已进入 ${DEFAULT_COOLDOWN_DAYS} 天冷却循环` };
};

/**
 * 重置所有进度
 */
export const resetAllProgress = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    console.error('[Progress Reset] 重置失败:', e);
    return false;
  }
};

/**
 * 获取统计信息
 */
export const getProgressStats = () => {
  const progress = getUserProgress();
  const masteredCount = progress.mastered_pool?.length || 0;
  const weakCount = Object.keys(progress.weak_point_buffer || {}).length;
  const l4Progress = progress.l4_mastery_counter || {};
  
  let coolingCount = 0;
  let cooledCount = 0;
  
  for (const record of Object.values(progress.weak_point_buffer || {})) {
    if (isInCooldown(Object.keys(progress.weak_point_buffer).find(k => progress.weak_point_buffer[k] === record))) {
      coolingCount++;
    } else {
      cooledCount++;
    }
  }
  
  return {
    masteredCount,
    weakCount,
    coolingCount,
    cooledCount,
    l4ProgressCount: Object.keys(l4Progress).length,
    userAddedCount: progress.user_added_pool?.length || 0
  };
};

/**
 * 获取用户添加的题库
 */
export const getUserAddedPool = () => {
  const progress = getUserProgress();
  return progress.user_added_pool || [];
};

/**
 * 添加用户录入的题目
 */
export const addToUserPool = (question) => {
  const progress = getUserProgress();
  
  if (!progress.user_added_pool) {
    progress.user_added_pool = [];
  }
  
  progress.user_added_pool.push(question);
  saveUserProgress(progress);
  
  return true;
};

/**
 * 从用户题库移除题目
 */
export const removeFromUserPool = (questionId) => {
  const progress = getUserProgress();
  const index = progress.user_added_pool?.findIndex(q => q.id === questionId);
  
  if (index > -1) {
    progress.user_added_pool.splice(index, 1);
    saveUserProgress(progress);
    return true;
  }
  
  return false;
};

/**
 * 生成用户题目 ID
 * 格式：USER_ADD_{motifId}_{timestamp}
 */
export const generateUserQuestionId = (motifId) => {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `USER_ADD_${motifId}_${timestamp}`;
};
