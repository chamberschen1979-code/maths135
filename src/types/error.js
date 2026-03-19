export const MOTIF_LIST = [
  { id: 'M01', name: '集合、逻辑用语与复数' },
  { id: 'M02', name: '不等式性质' },
  { id: 'M03', name: '函数概念与性质' },
  { id: 'M04', name: '指对数函数与运算' },
  { id: 'M05', name: '平面向量' },
  { id: 'M06', name: '三角函数基础' },
  { id: 'M07', name: '解三角形综合' },
  { id: 'M08', name: '数列基础与求和' },
  { id: 'M09', name: '立体几何基础' },
  { id: 'M10', name: '解析几何基础' },
  { id: 'M11', name: '导数工具基础' },
  { id: 'M12', name: '概率与统计综合' },
  { id: 'M13', name: '解析几何综合压轴' },
  { id: 'M14', name: '导数综合压轴' },
  { id: 'M15', name: '数列综合压轴' },
  { id: 'M16', name: '计数原理与二项式' },
  { id: 'M17', name: '创新思维与情境' }
]

export const MOTIF_MAP = Object.fromEntries(
  MOTIF_LIST.map(m => [m.id, m.name])
)

export const SPECIALTY_MAP = {
  'M01': [
    { id: 'V1', name: '集合的运算与关系' },
    { id: 'V2', name: '逻辑用语与命题' },
    { id: 'V3', name: '复数运算与几何意义' }
  ],
  'M02': [
    { id: 'V1', name: '不等式性质与解法' },
    { id: 'V2', name: '基本不等式应用' }
  ],
  'M03': [
    { id: 'V1', name: '函数概念与三要素' },
    { id: 'V2', name: '函数单调性' },
    { id: 'V3', name: '函数奇偶性' },
    { id: 'V4', name: '函数零点' }
  ],
  'M04': [
    { id: 'V1', name: '指数函数' },
    { id: 'V2', name: '对数函数' },
    { id: 'V3', name: '指对数运算' }
  ],
  'M05': [
    { id: 'V1', name: '向量运算' },
    { id: 'V2', name: '向量数量积' },
    { id: 'V3', name: '向量几何应用' }
  ],
  'M06': [
    { id: 'V1', name: '三角函数定义' },
    { id: 'V2', name: '三角恒等变换' },
    { id: 'V3', name: '三角函数图像与性质' }
  ],
  'M07': [
    { id: 'V1', name: '正弦定理' },
    { id: 'V2', name: '余弦定理' },
    { id: 'V3', name: '解三角形综合' }
  ],
  'M08': [
    { id: 'V1', name: '等差数列' },
    { id: 'V2', name: '等比数列' },
    { id: 'V3', name: '数列求和' }
  ],
  'M09': [
    { id: 'V1', name: '空间几何体' },
    { id: 'V2', name: '点线面位置关系' },
    { id: 'V3', name: '空间向量' }
  ],
  'M10': [
    { id: 'V1', name: '直线方程' },
    { id: 'V2', name: '圆的方程' },
    { id: 'V3', name: '直线与圆' }
  ],
  'M11': [
    { id: 'V1', name: '导数概念与运算' },
    { id: 'V2', name: '导数与单调性' },
    { id: 'V3', name: '导数与极值最值' }
  ],
  'M12': [
    { id: 'V1', name: '概率计算' },
    { id: 'V2', name: '统计与数据分析' }
  ],
  'M13': [
    { id: 'V1', name: '椭圆' },
    { id: 'V2', name: '双曲线' },
    { id: 'V3', name: '抛物线' }
  ],
  'M14': [
    { id: 'V1', name: '导数综合应用' },
    { id: 'V2', name: '导数证明' }
  ],
  'M15': [
    { id: 'V1', name: '数列综合' },
    { id: 'V2', name: '数列压轴' }
  ],
  'M16': [
    { id: 'V1', name: '排列组合' },
    { id: 'V2', name: '二项式定理' }
  ],
  'M17': [
    { id: 'V1', name: '新定义问题' },
    { id: 'V2', name: '数学文化' }
  ]
}

export const getMotifName = (motifId) => MOTIF_MAP[motifId] || '未知母题'

export const getSpecialtyName = (motifId, specialtyId) => {
  const specialties = SPECIALTY_MAP[motifId] || []
  const specialty = specialties.find(s => s.id === specialtyId)
  return specialty?.name || '通用专项'
}

export const DIFFICULTY_LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5']

export const ERROR_STATUS = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  REVIEWED: 'REVIEWED',
  RESOLVED: 'RESOLVED'
}

export const createEmptyClassification = () => ({
  motifId: '',
  motifName: '',
  specialtyId: 'V0',
  specialtyName: '待分类',
  variationId: 'GENERAL',
  difficulty: 'L2'
})

export const createEmptyDiagnosis = () => ({
  keyPoints: [],
  trapType: null,
  suggestedWeapons: [],
  message: ''
})

export const createErrorRecord = (data = {}) => ({
  id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  questionText: data.questionText || '',
  classification: {
    ...createEmptyClassification(),
    ...(data.classification || {})
  },
  diagnosis: {
    ...createEmptyDiagnosis(),
    ...(data.diagnosis || {})
  },
  confidence: data.confidence || 0.5,
  status: data.status || ERROR_STATUS.PENDING_REVIEW,
  source: data.source || 'photo',
  imageData: data.imageData || null,
  addedAt: new Date().toISOString(),
  resolved: false,
  resolvedAt: null,
  
  targetId: data.classification?.motifId || data.targetId || '',
  diagnosis_message: data.diagnosis?.message || data.diagnosis || ''
})

export const migrateOldErrorRecord = (oldRecord) => {
  if (oldRecord.classification && oldRecord.diagnosis) {
    return oldRecord
  }
  
  return {
    ...oldRecord,
    questionText: oldRecord.questionText || '',
    classification: {
      motifId: oldRecord.targetId || '',
      motifName: getMotifName(oldRecord.targetId),
      specialtyId: 'V0',
      specialtyName: '待分类',
      variationId: 'GENERAL',
      difficulty: oldRecord.level || 'L2'
    },
    diagnosis: {
      keyPoints: [],
      trapType: null,
      suggestedWeapons: [],
      message: oldRecord.diagnosis || oldRecord.diagnosis_message || ''
    },
    confidence: 0.5,
    status: ERROR_STATUS.REVIEWED,
    source: 'legacy',
    imageData: null
  }
}

export const validateErrorRecord = (record) => {
  const errors = []
  
  if (!record.questionText && !record.imageData) {
    errors.push('缺少题干内容')
  }
  
  if (!record.classification?.motifId) {
    errors.push('缺少母题分类')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
