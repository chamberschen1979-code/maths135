import scoringEngine from '../data/scoringEngine.json'

const LEVEL_THRESHOLDS = {
  L1: { min: 0, max: 999 },
  L2: { min: 1000, max: 1799 },
  L3: { min: 1800, max: 2499 },
  L4: { min: 2500, max: 3000 },
}

export { LEVEL_THRESHOLDS }

const LEVEL_INITIAL_ELO = {
  L1: 800,
  L2: 1000,
  L3: 1800,
  L4: 2500
}

export { LEVEL_INITIAL_ELO }

const MASTERY_CONFIG = {
  CONSECUTIVE_CORRECT_REQUIRED: 3,
}

const ELO_SCORES = {
  L1: { correct: 20, wrong: -10 },
  L2: { correct: 40, wrong: -20 },
  L3: { correct: 60, wrong: -30 },
  L4: { correct: 100, wrong: -50 }
}

export const getTargetStatus = (targetLevel, currentElo, consecutiveCorrect = 0) => {
  const thresholds = LEVEL_THRESHOLDS[targetLevel] || LEVEL_THRESHOLDS.L1
  
    if (currentElo < thresholds.min) return 'gray'

    if (consecutiveCorrect >= 3) return 'green'

    return 'red'
}

export const getLevelByElo = (elo) => {
    if (elo >= LEVEL_THRESHOLDS.L4.min) return 'L4'
    if (elo >= LEVEL_THRESHOLDS.L3.min) return 'L3'
    if (elo >= LEVEL_THRESHOLDS.L2.min) return 'L2'
    return 'L1'
}

export const getEloCeilingFromSpecialties = (specialties) => {
    if (!specialties || specialties.length === 0) {
        return LEVEL_THRESHOLDS.L1.max
    }

    const checkLevel = (level) => {
        let allBenchmarks = []
        specialties.forEach(spec => {
            spec.variations?.forEach(v => {
                v.master_benchmarks?.forEach(b => {
                    if (b.level === level) {
                        allBenchmarks.push(b)
                    }
                })
            })
        })

        if (allBenchmarks.length === 0) return true
        return allBenchmarks.every(b => b.is_mastered === true)
    }

    const hasL2Mastered = checkLevel('L2')
    const hasL3Mastered = checkLevel('L3')
    const hasL4Mastered = checkLevel('L4')

    if (hasL4Mastered) return LEVEL_THRESHOLDS.L4.max
    if (hasL3Mastered) return LEVEL_THRESHOLDS.L3.max
    if (hasL2Mastered) return LEVEL_THRESHOLDS.L2.max
    return LEVEL_THRESHOLDS.L1.max
}

export const getEloCeiling = (subTargets, motifData = null) => {
    if (!subTargets || subTargets.length === 0) {
        return getEloCeilingFromSpecialties(motifData?.specialties)
    }

    const checkLevel = (level) => {
        const levelSubs = subTargets.filter(sub => sub.level_req === level)
        if (levelSubs.length === 0) return true

        return levelSubs.every(sub => sub.is_mastered === true)
    }

    const hasL2Mastered = checkLevel('L2')
    const hasL3Mastered = checkLevel('L3')
    const hasL4Mastered = checkLevel('L4')

    if (hasL4Mastered) return LEVEL_THRESHOLDS.L4.max
    if (hasL3Mastered) return LEVEL_THRESHOLDS.L3.max
    if (hasL2Mastered) return LEVEL_THRESHOLDS.L2.max
    return LEVEL_THRESHOLDS.L1.max
}

export const applyEloCeiling = (elo, subTargets, motifData = null) => {
    const ceiling = getEloCeiling(subTargets, motifData)
    return Math.min(elo, ceiling)
}

export const checkLevelLock = (currentElo, subTargets, motifData = null) => {
    const locks = {
        L2: false,
        L3: false,
        L4: false,
        message: ''
    }

    if (!subTargets || subTargets.length === 0) {
        return locks
    }

    const checkLevelStatus = (level) => {
        const levelSubs = subTargets.filter(sub => sub.level_req === level)
        if (levelSubs.length === 0) return { allGreen: true }

        const allGreen = levelSubs.every(sub => sub.is_mastered === true)
        return { allGreen }
    }

    const l2Status = checkLevelStatus('L2')
    const l3Status = checkLevelStatus('L3')

    if (currentElo >= LEVEL_THRESHOLDS.L3.min && !l2Status.allGreen) {
        locks.L3 = true
        locks.message = 'L2节点未全部变绿，Elo无法突破1800'
    }

    if (currentElo >= LEVEL_THRESHOLDS.L4.min && !l3Status.allGreen) {
        locks.L4 = true
        locks.message = 'L3节点未全部变绿,Elo无法突破2500'
    }

    return locks
}

export const calculateMasteryProgress = (subTarget) => {
    const consecutiveCorrect = subTarget.consecutive_correct || 0
    const required = MASTERY_CONFIG.CONSECUTIVE_CORRECT_REQUIRED

    return {
        current: consecutiveCorrect,
        required,
        progress: Math.min(100, (consecutiveCorrect / required) * 100),
        isReady: consecutiveCorrect >= required
    }
}
export const checkMasteryEligibility = (subTarget, eloScore) => {
    const level = subTarget.level_req
    const threshold = LEVEL_THRESHOLDS[level]

    if (!threshold) return false

    const eloMet = eloScore >= threshold.min
    const consecutiveMet = (subTarget.consecutive_correct || 0) >= MASTERY_CONFIG.CONSECUTIVE_CORRECT_REQUIRED

    return eloMet && consecutiveMet
}

export const calculateSimpleEloChange = (level, isCorrect) => {
    const scores = ELO_SCORES[level] || ELO_SCORES.L1
    return isCorrect ? scores.correct : scores.wrong
}

export const calculateMultiQuestionElo = (details) => {
    let totalDelta = 0
    const breakdown = []

    details.forEach(d => {
        const delta = calculateSimpleEloChange(d.level, d.isCorrect)
        totalDelta += delta
        breakdown.push({
            index: d.index,
            level: d.level,
            isCorrect: d.isCorrect,
            delta
        })
    })

    return { totalDelta, breakdown }
}

export const evaluateSubmission = (params) => {
    const { userAnswers, correctAnswers, questionMeta, currentUser } = params

    const details = userAnswers.map((ans, i) => ({
        index: i,
        level: questionMeta.questions[i].level,
        isCorrect: strictCompare(ans, correctAnswers[i])
    }))

    const isAllCorrect = details.every(d => d.isCorrect)
    const hasL2Error = details.some(d => d.level === 'L2' && !d.isCorrect)
    const isPureL2Question = details.every(d => d.level === 'L2') && details.length === 1

    const eloResult = calculateMultiQuestionElo(details)
    let motifStreak = isAllCorrect ? (currentUser.motifStreak || 0) + 1 : 0
    let l2RemediationStreak = currentUser.l2RemediationStreak || 0

    if (isPureL2Question) {
        l2RemediationStreak = isAllCorrect ? l2RemediationStreak + 1 : 0
    }

    const isHighLevelLocked = currentUser.isHighLevelLocked && l2RemediationStreak < 3
    const newLocked = hasL2Error ? true : isHighLevelLocked

    return {
        pass: isAllCorrect,
        elo: eloResult,
        qualification: {
            motifStreak,
            l2RemediationStreak,
            l2Status: hasL2Error ? 'RED' : 'GREEN',
            isHighLevelLocked: newLocked,
            nextAction: newLocked ? 'FORCE_L2_REMEDIATION' : (isAllCorrect ? 'NEXT' : 'RETRY')
        },
        feedback: { details }
    }
}

const strictCompare = (userAnswer, correctAnswer) => {
    const normalizeStr = (str) => {
        if (!str || typeof str !== 'string') return ''
        return str
            .replace(/\s+/g, '')
            .replace(/[，。；：！？、]/g, '')
            .replace(/[,.:;!?]/g, '')
            .replace(/\$/g, '')
            .toLowerCase()
    }

    const userNorm = normalizeStr(userAnswer)
    const correctNorm = normalizeStr(correctAnswer)

    if (!userNorm) return false
    if (!correctNorm) return false

    if (userNorm === correctNorm) return true
    const extractNumbers = (str) => {
        if (!str || typeof str !== 'string') return []
        const matches = str.match(/-?\d+\.?\d*/g) || []
        return matches.map(n => parseFloat(n))
    }

    const userNums = extractNumbers(userAnswer)
    const correctNums = extractNumbers(correctAnswer)

    if (correctNums.length > 0 && userNums.length > 0) {
        const matchedNums = correctNums.filter(n =>
            userNums.some(un => Math.abs(un - n) < 0.001)
        )
        if (matchedNums.length === correctNums.length && userNums.length === correctNums.length) {
            return true
        }
    }

    return false
}

export const calculateMeltdownPenalty = (currentElo, failedLevel) => {
    if (currentElo < LEVEL_THRESHOLDS.L4.min) {
        return { meltdown: false, penalty: 0 }
    }

    if (failedLevel === 'L2') {
        return {
            meltdown: true,
            penalty: 100,
            message: '⚠️ 熔断惩罚：L4战区L2基础失误，锁定高阶挑战权限'
        }
    }

    return { meltdown: false, penalty: 0 }
}

export const applyMeltdownReset = (subTargets) => {
    return subTargets.map(sub => ({
        ...sub,
        is_mastered: false,
        consecutive_correct: 0,
        meltdown_reset: true
    }))
}

export const updateSubTargetMastery = (subTarget, isCorrect, isFirstAttempt, currentElo) => {
    const currentStatus = subTarget.is_mastered
    const level = subTarget.level_req
    const threshold = LEVEL_THRESHOLDS[level]
    const eloMet = currentElo >= threshold.min

    if (!isCorrect) {
        return {
            ...subTarget,
            is_mastered: false,
            consecutive_correct: 0,
            last_practice: new Date().toISOString()
        }
    }

    const newConsecutive = (subTarget.consecutive_correct || 0) + 1

    if (eloMet && newConsecutive >= MASTERY_CONFIG.CONSECUTIVE_CORRECT_REQUIRED) {
        return {
            ...subTarget,
            is_mastered: true,
            consecutive_correct: newConsecutive,
            last_practice: new Date().toISOString(),
            mastered_at: new Date().toISOString()
        }
    }

    return {
        ...subTarget,
        is_mastered: false,
        consecutive_correct: newConsecutive,
        last_practice: new Date().toISOString()
    }
}

export const processPracticeResult = (params) => {
    const {
        currentElo,
        subTargets,
        level,
        subId,
        isCorrect,
        isFirstAttempt = true
    } = params

    let updatedSubTargets = [...subTargets]
    let eloResult = { newElo: currentElo, change: 0 }
    let meltdownTriggered = false
    let messages = []

    const subIndex = updatedSubTargets.findIndex(sub => sub.sub_id === subId)
    if (subIndex === -1) {
        return { updatedSubTargets, eloResult, meltdownTriggered, messages }
    }

    const subTarget = updatedSubTargets[subIndex]
    const currentStatus = subTarget.is_mastered

    const eloDelta = calculateSimpleEloChange(level, isCorrect)
    let newElo = currentElo + eloDelta
    newElo = Math.max(0, Math.min(3000, newElo))
    newElo = applyEloCeiling(newElo, updatedSubTargets)

    eloResult = { newElo, change: eloDelta }

    if (isCorrect) {
        updatedSubTargets[subIndex] = updateSubTargetMastery(
            subTarget,
            true,
            isFirstAttempt,
            eloResult.newElo
        )

        const newStatus = updatedSubTargets[subIndex].is_mastered
        if (newStatus === true && currentStatus !== true) {
            messages.push(`🟢 恭喜！${level} 关卡已点亮！`)
        }
    } else {
        const meltdown = calculateMeltdownPenalty(currentElo, level)

        if (meltdown.meltdown) {
            meltdownTriggered = true
            updatedSubTargets = applyMeltdownReset(updatedSubTargets)
            eloResult = {
                newElo: Math.max(LEVEL_THRESHOLDS.L1.max, currentElo - meltdown.penalty),
                change: -meltdown.penalty
            }
            messages.push(meltdown.message)
            messages.push('🔴 熔断触发：所有节点状态回滚为红色')
        } else {
            updatedSubTargets[subIndex] = updateSubTargetMastery(
                subTarget,
                false,
                isFirstAttempt,
                eloResult.newElo
            )
        }
    }

    return {
        updatedSubTargets,
        eloResult,
        meltdownTriggered,
        messages
    }
}

export const getEloStatistics = (subTargets) => {
    const stats = {
        totalSubTargets: 0,
        mastered: 0,
        practicing: 0,
        failed: 0,
        locked: 0,
        ceiling: LEVEL_THRESHOLDS.L1.max,
        levelLocks: { L2: false, L3: false, L4: false }
    }

    if (!subTargets) return stats

    stats.totalSubTargets = subTargets.length

    subTargets.forEach(sub => {
        if (sub.is_mastered === true) {
            stats.mastered++
        } else if (sub.is_mastered === false) {
            stats.failed++
        } else {
            stats.locked++
        }
    })

    stats.ceiling = getEloCeiling(subTargets)
    stats.levelLocks = checkLevelLock(stats.ceiling, subTargets)

    return stats
}

export const migrateUserLevel = (oldEloScore) => {
    if (oldEloScore < LEVEL_THRESHOLDS.L2.min) {
        return 'L1'
    }
    return getLevelByElo(oldEloScore)
}

export default {
    LEVEL_THRESHOLDS,
    LEVEL_INITIAL_ELO,
    MASTERY_CONFIG,
    ELO_SCORES,
    getTargetStatus,
    getLevelByElo,
    getEloCeiling,
    applyEloCeiling,
    checkLevelLock,
    calculateMasteryProgress,
    checkMasteryEligibility,
    calculateSimpleEloChange,
    calculateMultiQuestionElo,
    evaluateSubmission,
    strictCompare,
    calculateMeltdownPenalty,
    applyMeltdownReset,
    updateSubTargetMastery,
    processPracticeResult,
    getEloStatistics,
    migrateUserLevel
}
