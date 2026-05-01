/**
 * 教学大纲规则配置
 * 
 * 统一管理年级限制、禁词表、母题权限等规则
 * 被 problemLogic.js 和 questionVerifier.js 共享使用
 */

/**
 * 年级限制配置
 */
export const GRADE_RESTRICTIONS = {
  universityForbidden: [
    '洛必达法则', '泰勒展开', '级数敛散性', '严格极限定义',
    '矩阵变换', '行列式计算', '特征值分解', '群论', '拓扑',
    '洛必达', '泰勒', '级数', '极限定义', '特征值', '行列式'
  ],

  grade10: {
    allowedMotifs: ['M01', 'M02', 'M03', 'M04', 'M05', 'M06'],
    toolForbidden: [
      '导数', '微分', '积分', '空间向量', '三维坐标', '法向量',
      '复数三角形式', '棣莫弗', '柯西不等式', '排序不等式',
      '和差化积', '积化和差', '反三角函数运算', '特征方程', '不动点',
      '极坐标', '参数方程', '圆锥曲线', '椭圆', '双曲线', '抛物线',
      '数列求和', '等比数列', '等差数列求和', '裂项', '错位相减',
      '二项式定理', '排列组合', '条件概率', '独立事件'
    ],
    // 🎯 L2 思维难度禁词表 (仅检查变例名称，不检查题干)
    // 修改为更具体的"复杂思维"描述，避免误伤基础题
    l2ThoughtForbidden: [
      '参数讨论',          // 多参数复杂讨论
      '零点个数',          // 复杂函数零点讨论
      '恰有',              // 恰有 N 个解的复杂讨论
      '恒成立',            // 复杂不等式恒成立
      '存在性',            // 存在性问题
      '最值博弈',          // 高阶最值问题
      '不等式证明',        // 证明题
      '充要条件证明',      // 证明题
      '极值点偏移',        // 高阶技巧
      '隐零点',            // 高阶技巧
      '分类讨论',          // 复杂分类讨论
      '多解筛选',          // 多解情况讨论
      '动态分析',          // 复杂动点分析
      '超越方程',          // 需导数求解
      '同构构造'           // 高阶技巧
    ]
  },

  grade12: {
    allowedMotifs: ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10', 'M11', 'M12'],
    toolForbidden: [
      '泰勒展开', '洛必达', '极值点偏移', '隐零点代换', '复杂构造函数',
      '极点极线', '第二定义', '复杂放缩', '裂项放缩', '生成函数',
      '正态分布积分', '复杂条件概率', '多重集排列',
      '切线不等式', '端点效应', '必要性探路'
    ],
    contextSpecific: {
      'M07': ['导数', '空间向量', '坐标法'],
      'M06': ['导数', '微分']
    },
    // 🎯 L2 思维难度禁词表 (仅检查变例名称，不检查题干)
    l2ThoughtForbidden: [
      '参数讨论',          // 多参数复杂讨论
      '零点个数',          // 复杂函数零点讨论
      '恰有',              // 恰有 N 个解的复杂讨论
      '恒成立',            // 复杂不等式恒成立
      '存在性',            // 存在性问题
      '最值博弈',          // 高阶最值问题
      '不等式证明',        // 证明题
      '一般性结论',        // 抽象证明
      '极值点偏移',        // 高阶技巧
      '隐零点',            // 高阶技巧
      '多解筛选',          // 多解情况讨论
      '动态分析',          // 复杂动点分析
      '超越方程',          // 需导数求解
      '同构构造'           // 高阶技巧
    ]
  },

  grade13: {
    allowedMotifs: 'ALL',
    toolForbidden: [],
    l2ThoughtForbidden: [
      '竞赛级技巧', '超纲背景', '大学方法', '高阶技巧'
    ]
  }
}

/**
 * 获取年级配置
 * @param {string} grade - 年级 ('高一', '高二', '高三')
 * @returns {Object} 年级配置对象
 */
export const getGradeConfig = (grade) => {
  if (grade === '高一') return GRADE_RESTRICTIONS.grade10
  if (grade === '高二') return GRADE_RESTRICTIONS.grade12
  return GRADE_RESTRICTIONS.grade13
}

/**
 * 检查文本是否包含禁词
 * @param {string} text - 待检查文本
 * @param {string[]} forbiddenList - 禁词列表
 * @returns {boolean} 是否包含禁词
 */
export const checkTextContainsForbidden = (text, forbiddenList) => {
  if (!text || !forbiddenList || forbiddenList.length === 0) return false
  const lowerText = text.toLowerCase()
  return forbiddenList.some(keyword => lowerText.includes(keyword.toLowerCase()))
}

/**
 * 统一的大纲合规性检查函数
 * @param {string} content - 题目内容
 * @param {string} grade - 年级 ('高一', '高二', '高三')
 * @param {string} motifId - 母题ID
 * @param {string} targetLevel - 目标难度 (可选，用于 L2 思维难度检查)
 * @returns {Object} { pass: boolean, reason: string, details: object }
 */
export const checkSyllabusCompliance = (content, grade = '高三', motifId = '', targetLevel = null) => {
  const config = getGradeConfig(grade)
  const details = {
    grade,
    motifId,
    checkedItems: [],
    violations: []
  }

  // 1. 检查大学工具
  const universityViolation = GRADE_RESTRICTIONS.universityForbidden.find(
    keyword => content.toLowerCase().includes(keyword.toLowerCase())
  )
  if (universityViolation) {
    details.violations.push({
      type: 'university_tool',
      keyword: universityViolation,
      message: `包含大学工具: ${universityViolation}`
    })
    return {
      pass: false,
      reason: `包含大学工具: ${universityViolation}`,
      details
    }
  }
  details.checkedItems.push('university_tools')

  // 2. 检查年级特定工具
  if (config.toolForbidden && config.toolForbidden.length > 0) {
    const toolViolation = config.toolForbidden.find(
      keyword => content.toLowerCase().includes(keyword.toLowerCase())
    )
    if (toolViolation) {
      details.violations.push({
        type: 'grade_tool',
        keyword: toolViolation,
        message: `${grade}超纲工具: ${toolViolation}`
      })
      return {
        pass: false,
        reason: `${grade}超纲工具: ${toolViolation}`,
        details
      }
    }
  }
  details.checkedItems.push('grade_tools')

  // 3. 检查母题权限
  if (config.allowedMotifs !== 'ALL' && motifId) {
    if (!config.allowedMotifs.includes(motifId)) {
      details.violations.push({
        type: 'motif_permission',
        motifId,
        message: `${grade}不允许学习母题 ${motifId}`
      })
      return {
        pass: false,
        reason: `${grade}不允许学习该母题`,
        details
      }
    }
  }
  details.checkedItems.push('motif_permission')

  // 4. 检查 L2 思维难度 (仅当目标难度为 L2 时)
  if (targetLevel === 'L2' && config.l2ThoughtForbidden && config.l2ThoughtForbidden.length > 0) {
    const thoughtViolation = config.l2ThoughtForbidden.find(
      keyword => content.toLowerCase().includes(keyword.toLowerCase())
    )
    if (thoughtViolation) {
      details.violations.push({
        type: 'l2_thought',
        keyword: thoughtViolation,
        message: `L2 难度包含超纲思维: ${thoughtViolation}`
      })
      return {
        pass: false,
        reason: `L2 难度包含超纲思维: ${thoughtViolation}`,
        details
      }
    }
  }
  if (targetLevel === 'L2') {
    details.checkedItems.push('l2_thought')
  }

  // 5. 检查上下文特定限制 (针对特定母题)
  if (config.contextSpecific && motifId && config.contextSpecific[motifId]) {
    const contextViolation = config.contextSpecific[motifId].find(
      keyword => content.toLowerCase().includes(keyword.toLowerCase())
    )
    if (contextViolation) {
      details.violations.push({
        type: 'context_specific',
        keyword: contextViolation,
        message: `该模块不宜使用工具: ${contextViolation}`
      })
      return {
        pass: false,
        reason: `该模块不宜使用工具: ${contextViolation}`,
        details
      }
    }
  }
  details.checkedItems.push('context_specific')

  return {
    pass: true,
    reason: '大纲合规',
    details
  }
}

export default {
  GRADE_RESTRICTIONS,
  getGradeConfig,
  checkTextContainsForbidden,
  checkSyllabusCompliance
}
