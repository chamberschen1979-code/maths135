export const DIFFICULTY_TIERS = [
  {
    id: 'beginner',
    name: '入门基础',
    eloRange: [0, 1000],
    config: {
      tier: '入门基础',
      level: 'L1',
      complexity: 0.5,
      steps: 1,
      traps: 0,
      allowDiscussion: false,
      paramConstraint: 'integer_or_simple_fraction',
      minParams: 1,
      maxParams: 2,
      multiQuestion: false,
      description: '侧重基本概念理解，参数简单，无复杂陷阱。'
    }
  },
  {
    id: 'foundation',
    name: '基础筑基',
    eloRange: [1001, 1800],
    config: {
      tier: '基础筑基',
      level: 'L2',
      complexity: 1,
      steps: 2,
      traps: 0,
      allowDiscussion: false,
      paramConstraint: 'integer_or_simple_fraction',
      minParams: 1,
      maxParams: 2,
      multiQuestion: false,
      description: '侧重基本概念和直接公式应用，参数简单，无复杂陷阱。'
    }
  },
  {
    id: 'intermediate',
    name: '深度复合',
    eloRange: [1801, 2500],
    config: {
      tier: '深度复合',
      level: 'L3',
      complexity: 3,
      steps: 4,
      traps: 1,
      allowDiscussion: true,
      paramConstraint: 'any',
      minParams: 2,
      maxParams: 3,
      multiQuestion: true,
      description: '涉及多个知识点综合，包含一个隐蔽陷阱，需要分类讨论或数形结合。'
    }
  },
  {
    id: 'advanced',
    name: '战术压轴',
    eloRange: [2501, Infinity],
    config: {
      tier: '战术压轴',
      level: 'L4',
      complexity: 5,
      steps: 6,
      traps: 2,
      allowDiscussion: true,
      paramConstraint: 'any',
      minParams: 3,
      maxParams: 5,
      multiQuestion: true,
      description: '高难度压轴题风格，多重陷阱，需要构造辅助函数或高阶变换，逻辑链条长。'
    }
  }
]

export const ELO_THRESHOLDS = {
  L1_MAX: 1000,
  L2_MAX: 1800,
  L3_MAX: 2500
}

export const getDifficultyConfig = (elo) => {
  const score = elo || 0

  const tier = DIFFICULTY_TIERS.find(t =>
    score >= t.eloRange[0] && score <= t.eloRange[1]
    )

    if (tier) {
      return { ...tier.config }
    }

    return score > 2500
      ? { ...DIFFICULTY_TIERS[3].config }
      : { ...DIFFICULTY_TIERS[0].config }
}

export const getDifficultyByElo = getDifficultyConfig

export const getDifficultyByLevel = (level) => {
  const tier = DIFFICULTY_TIERS.find(t => t.config.level === level)
    return tier ? { ...tier.config } : null
}

export const getQuestionLevelsForUser = (userLevel) => {
  const mapping = {
    'L1': { levels: ['L1'], multiQuestion: false },
    'L2': { levels: ['L2'], multiQuestion: false },
    'L3': { levels: ['L2', 'L3'], multiQuestion: true },
    'L4': { levels: ['L2', 'L3', 'L4'], multiQuestion: true }
  }
  return mapping[userLevel] || mapping['L1']
}

export const getAllTiers = () => DIFFICULTY_TIERS.map(t => ({
  value: t.id,
  label: t.name,
  range: `${t.eloRange[0]}-${t.eloRange[1] === Infinity ? '+' : t.eloRange[1]}`,
  level: t.config.level
}))

export const isValidLevel = (level) => {
  return DIFFICULTY_TIERS.some(t => t.config.level === level)
}

export default {
  DIFFICULTY_TIERS,
  ELO_THRESHOLDS,
  getDifficultyConfig,
  getDifficultyByElo,
  getDifficultyByLevel,
  getQuestionLevelsForUser,
  getAllTiers,
  isValidLevel
}
