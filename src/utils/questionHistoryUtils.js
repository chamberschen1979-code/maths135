const DECAY_CONFIG = {
  YELLOW_THRESHOLD_DAYS: 7,
  WARNING_THRESHOLD_DAYS: 14
}

const getDaysSince = (dateString) => {
  if (!dateString) return Infinity
  const now = Date.now()
  const diff = now - new Date(dateString).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

const buildQuestionKey = (motifId, varId, questionId) => {
  return `${motifId}_${varId || 'default'}_${questionId}`
}

const parseQuestionKey = (key) => {
  const parts = key.split('_')
  if (parts.length >= 3) {
    return {
      motifId: parts[0],
      varId: parts[1],
      questionId: parts.slice(2).join('_')
    }
  }
  return null
}

const createHistoryEntry = (questionId, motifId, varId, level, extraInfo = {}) => {
  const now = new Date().toISOString()
  return {
    questionId,
    motifId,
    motifName: extraInfo.motifName || '',
    specId: extraInfo.specId || '',
    specName: extraInfo.specName || '',
    varId: varId || 'default',
    varName: extraInfo.varName || '',
    level,
    questionText: extraInfo.questionText || '',
    firstIssuedAt: now,
    lastIssuedAt: now,
    issueCount: 1,
    lastAnsweredAt: null,
    lastGrade: null,
    consecutiveCorrect: 0,
    isMastered: false,
    isReset: false,
    resetAt: null
  }
}

const updateHistoryOnIssue = (history, questionId, motifId, varId, level, extraInfo = {}) => {
  const key = buildQuestionKey(motifId, varId, questionId)
  const now = new Date().toISOString()
  
  if (history[key]) {
    return {
      ...history,
      [key]: {
        ...history[key],
        lastIssuedAt: now,
        issueCount: (history[key].issueCount || 0) + 1,
        isReset: false,
        resetAt: null,
        questionText: extraInfo.questionText || history[key].questionText
      }
    }
  }
  
  return {
    ...history,
    [key]: createHistoryEntry(questionId, motifId, varId, level, extraInfo)
  }
}

const updateHistoryOnAnswer = (history, questionId, motifId, varId, grade, isCorrect) => {
  const key = buildQuestionKey(motifId, varId, questionId)
  const now = new Date().toISOString()
  
  if (!history[key]) {
    return history
  }
  
  const entry = history[key]
  const newConsecutiveCorrect = isCorrect 
    ? (entry.consecutiveCorrect || 0) + 1 
    : 0
  
  const isMastered = newConsecutiveCorrect >= 2 || grade === 'S'
  
  return {
    ...history,
    [key]: {
      ...entry,
      lastAnsweredAt: now,
      lastGrade: grade,
      consecutiveCorrect: newConsecutiveCorrect,
      isMastered
    }
  }
}

const resetQuestionHistory = (history, key) => {
  if (!history[key]) return history
  
  return {
    ...history,
    [key]: {
      ...history[key],
      isReset: true,
      resetAt: new Date().toISOString(),
      isMastered: false,
      consecutiveCorrect: 0
    }
  }
}

const isQuestionAvailable = (historyEntry) => {
  if (!historyEntry) return { available: true, reason: 'never_issued' }
  
  if (historyEntry.isReset) {
    return { available: true, reason: 'reset' }
  }
  
  if (historyEntry.isMastered) {
    const daysSinceAnswered = getDaysSince(historyEntry.lastAnsweredAt)
    if (daysSinceAnswered < DECAY_CONFIG.YELLOW_THRESHOLD_DAYS) {
      return { available: false, reason: 'mastered_recently' }
    }
    return { available: true, reason: 'decayed' }
  }
  
  const daysSinceIssued = getDaysSince(historyEntry.lastIssuedAt)
  if (daysSinceIssued < 1 && !historyEntry.lastAnsweredAt) {
    return { available: false, reason: 'issued_today_unanswered' }
  }
  
  return { available: true, reason: 'not_mastered' }
}

const selectQuestionWithHistory = (questionPool, history, motifId, varId) => {
  if (!questionPool || questionPool.length === 0) return null
  
  const availableQuestions = questionPool.map(q => {
    const key = buildQuestionKey(motifId, varId, q.id)
    const historyEntry = history[key]
    const availability = isQuestionAvailable(historyEntry)
    return { ...q, key, historyEntry, ...availability }
  })
  
  const neverIssued = availableQuestions.filter(q => q.reason === 'never_issued')
  if (neverIssued.length > 0) {
    return neverIssued[Math.floor(Math.random() * neverIssued.length)]
  }
  
  const resetQuestions = availableQuestions.filter(q => q.reason === 'reset')
  if (resetQuestions.length > 0) {
    return resetQuestions[Math.floor(Math.random() * resetQuestions.length)]
  }
  
  const decayedQuestions = availableQuestions.filter(q => q.reason === 'decayed')
  if (decayedQuestions.length > 0) {
    return decayedQuestions[Math.floor(Math.random() * decayedQuestions.length)]
  }
  
  const notMastered = availableQuestions.filter(q => q.reason === 'not_mastered')
  if (notMastered.length > 0) {
    return notMastered[Math.floor(Math.random() * notMastered.length)]
  }
  
  return availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
}

const getHistoryStats = (history) => {
  const entries = Object.values(history)
  return {
    total: entries.length,
    mastered: entries.filter(e => e.isMastered).length,
    reset: entries.filter(e => e.isReset).length,
    neverAnswered: entries.filter(e => !e.lastAnsweredAt).length
  }
}

export {
  DECAY_CONFIG,
  buildQuestionKey,
  parseQuestionKey,
  createHistoryEntry,
  updateHistoryOnIssue,
  updateHistoryOnAnswer,
  resetQuestionHistory,
  isQuestionAvailable,
  selectQuestionWithHistory,
  getHistoryStats,
  getDaysSince
}
