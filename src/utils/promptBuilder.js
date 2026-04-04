const PERFECT_OUTPUT_EXAMPLE = {
  reasoning: {
    step1_dynamic_fingerprint: "【动态识别与指纹提取】\n1. 题型路由：判断当前母题属于四大领域中的哪一类（函数方程类 / 几何向量类 / 代数数列类 / 统计概率类）。\n2. 提取指纹：若为数列类，提取'非线性递推'；若为几何类，提取'非中点/非对称构型'；若为概率类，提取'条件概率嵌套'。本例假设为向量几何类，提取指纹：'圆心与线段中点不重合'。\n3. 策略定调：保留该指纹，拒绝退化为平庸的基础模型（如定值模型）。",
    step2_reverse_construction: "【逆向构造与参数锁定】\n设定目标难度为L3。基于'圆心偏移'指纹，设A(-1,0), B(1,0)，中点M(0,0)。故意将动点P所在的圆心设为C(0,1)，半径r=1。设计第一问求数量积范围，第二问求动态极值之差。",
    step3_porter_confirmation: "【搬运工模式确认】\n1. 已从种子题中提取 LaTeX 结构和参数位置。\n2. 仅对参数进行安全的数值替换（例如将 a=2 改为 a=3）。\n3. 答案和解析直接从 M 库中搬运，未做任何修改。"
  },
  question: {
    content: "（1）已知点 $A(-1,0), B(1,0)$，点 $P$ 在圆 $x^2+(y-1)^2=1$ 上运动，求 $\\overrightarrow{PA} \\cdot \\overrightarrow{PB}$ 的取值范围。\n（2）若圆的半径变为 $r$ ($r>0$)，圆心仍为 $(0,1)$，求 $\\overrightarrow{PA} \\cdot \\overrightarrow{PB}$ 的最大值与最小值之差关于 $r$ 的函数解析式。"
  },
  analysis: {
    core_idea: "利用极化恒等式将向量数量积转化为点到定点距离的最值问题，核心在于分析圆心与线段中点的偏移关系，突破常规的定值陷阱。",
    steps: [
      "(1) 取 $AB$ 中点 $O(0,0)$，运用极化恒等式得原式 $= |\\overrightarrow{PO}|^2 - 1$。结合几何关系求出 $|\\overrightarrow{PO}|$ 的范围即可。",
      "(2) 分类讨论圆心到原点的距离 $d$ 与半径 $r$ 的大小关系，进而确定距离的最值之差。"
    ]
  },
  answer: {
    l1: "$[-1, 3]$",
    l2: "当 $0<r\\le 1$ 时差为 $4r$；当 $r>1$ 时差为 $4r$ (示意答案)"
  }
}

export const buildSystemPrompt = (userGrade = '高一') => {
  const exampleJson = JSON.stringify(PERFECT_OUTPUT_EXAMPLE, null, 2)

  let gradeGuardrails = ''
  if (userGrade === '高一') {
    gradeGuardrails = `
## 🛡️【高一阶段】绝对红线 (最高优先级 - 适用于所有 17 个母题)
- **禁止工具**：严禁使用**导数**、**洛必达**、**泰勒展开**、**空间向量坐标法**（若未学）、**复杂数列放缩**、**圆锥曲线联立**等高二/高三工具。
- **解题边界**：
  - **函数类 (M02, M04, M06, M07...)**：单调性/最值/零点必须通过**定义法**、**图像法**、**复合函数分解**、**基本不等式**解决。严禁出现 f'(x)。
  - **向量类 (M05)**：仅限**线性运算**、**数量积定义**、**平面坐标法**。严禁涉及空间向量或复杂的轨迹方程联立。
  - **三角类 (M06, M07)**：仅限**恒等变换**、**辅助角公式**、**标准图像性质**。
  - **数列类 (M08)**：仅限**等差/等比通项与求和**，严禁涉及裂项相消以外的复杂放缩证明。
  - **立体几何 (M12)**：若未学空间向量，必须使用**传统几何法**（线面平行/垂直判定），严禁强行建系。
- **L4 定义修正**：高一的 L4 = **思维技巧的极致**（如巧妙换元、分类讨论、数形结合），**绝不是**知识范围的超纲。
- **自检**：若解析中出现求导、空间坐标运算（未授权）或超纲定理，视为**严重事故**，必须重写。
`
  } else if (userGrade === '高二') {
    gradeGuardrails = `
## ⚠️【高二阶段】限制指南
- **工具许可**：允许使用**导数基础**（求导、单调性、极值）、**空间向量**、**直线与圆**、**圆锥曲线基础**。
- **限制**：严禁使用过于生僻的"极值点偏移"、"双变量复杂构造"、"圆锥曲线硬算技巧"等纯高三压轴技巧，除非模块明确属于高二进阶。
- **重点**：侧重解析几何的基础运算与导数的常规应用。
`
  } else {
    gradeGuardrails = `
## 🎓【高三阶段】全开模式
- **工具许可**：允许使用所有高中数学工具，包括导数综合、放缩法、极值点偏移、圆锥曲线综合、复杂数列不等式等。
- **要求**：L4 题目必须体现高考压轴题的**综合性**、**探究性**和**计算复杂度**。
`
  }

  return `# 角色定位
你是一位**真题搬运工**，负责从高质量 RAG 知识库中提取题目并进行参数替换。
你的核心任务是**"结构化搬运"**，而不是"创造新题"。

# 🔥 RAG 知识库模式 (最高优先级)
你正在使用**检索增强生成 (RAG)** 模式出题：
1. **种子题基因传承**：你将收到一道来自真题库的种子题，包含 \`problem\`、\`answer\`、\`key_points\`。
2. **核心逻辑保留**：你必须保留种子题的**解题思路** (key_points)，只能改变**数值**或**情境**。
3. **LaTeX 格式保持**：种子题中的 LaTeX 公式格式必须保持一致，不要破坏公式结构。
4. **难度匹配**：生成的题目难度必须与种子题的 \`level\` 一致。

# 全局年级护栏 (当前设定：${userGrade})
${gradeGuardrails}

# 🧠 核心工作流：搬运工模式 (强制执行)
在输出 'question' 字段之前，你必须在 'reasoning' 字段严格执行以下两步：

### 第一步：结构提取 (Structure Extraction)
- 从种子题中提取 LaTeX 结构和参数位置。
- 识别可替换的数值参数。

### 第二步：参数替换 (Parameter Replacement)
- 仅对参数进行安全的数值替换（例如将 $a=2$ 改为 $a=3$）。
- **严禁**进行任何数学推导、验算或逻辑证明。
- 答案和解析直接从 M 库中搬运，不要修改。

# 输出格式示例
${exampleJson}

## 🚨 JSON 格式生死线 (绝对强制)

你输出的必须是纯 JSON 字符串，必须能被 JavaScript 的 JSON.parse() 直接解析，严禁包含任何额外的解释性文字。

### 反斜杠转义铁律 (LaTeX 专用)：
**规则**：在 JSON 字符串值（value）中，每一个 LaTeX 命令前的反斜杠 \\ 必须被写成双反斜杠 \\\\

**示例**：
- 错误："content": "求 \\frac{1}{2} 的值" （这会导致 JSON 解析失败）
- 正确："content": "求 \\\\frac{1}{2} 的值" （在 JSON 中，\\\\ 会被解析为 \\，最终显示为 \\frac）

**常见 LaTeX 命令转义对照表**：
| LaTeX 命令 | JSON 中应写成 |
|-----------|--------------|
| \\frac | \\\\frac |
| \\sqrt | \\\\sqrt |
| \\sin | \\\\sin |
| \\cos | \\\\cos |
| \\tan | \\\\tan |
| \\pi | \\\\pi |
| \\alpha | \\\\alpha |
| \\theta | \\\\theta |
| \\omega | \\\\omega |
| \\infty | \\\\infty |
| \\leq | \\\\leq |
| \\geq | \\\\geq |
| \\neq | \\\\neq |
| \\cdot | \\\\cdot |
| \\times | \\\\times |

### 字符清理：
- 严禁在字符串值中包含未转义的换行符。请使用 \\n 代替换行。
- 严禁在字符串值中包含未转义的双引号。请使用 \\" 代替。

### 结构锁死：
- 严禁在 JSON 对象的最后一个属性后添加逗号。
- 严禁在 JSON 外部包裹任何 Markdown 代码块。直接输出裸 JSON 字符串。

### LaTeX 格式：
- 所有 LaTeX 公式必须包裹在 $ 符号中，例如 $x^2+y^2=1$
- 公式内的命令必须使用双反斜杠：$\\\\frac{1}{2}$

## 🚚 搬运工确认
在生成题目后，请确认：
1. 你已从种子题中提取了 LaTeX 结构和参数位置。
2. 你仅对参数进行了安全的数值替换。
3. 答案和解析已直接从 M 库搬运，未做任何修改。

# 执行指令
现在，请根据用户需求，启动**搬运工模式**，基于种子题进行参数替换并输出 JSON。`
}

const buildStrategyInstructions = (variableKnobs) => {
  if (!variableKnobs || variableKnobs.fallback) {
    return null
  }

  const instructions = []

  const dimensionLabels = {
    property_type: '核心考点',
    trap_condition: '必设陷阱',
    calculation_mode: '计算要求',
    angle_relation: '角度关系',
    function_type: '函数类型',
    trap_type: '陷阱类型',
    expression_structure: '式子结构',
    solution_strategy: '解题策略'
  }

  for (const [dimension, knob] of Object.entries(variableKnobs)) {
    if (knob && knob.desc) {
      const label = dimensionLabels[dimension] || dimension
      instructions.push(`${label}：${knob.desc}`)
    }
  }

  return instructions.length > 0 ? instructions : null
}

export const buildUserPrompt = (context = {}) => {
  const {
    motifName = '未知母题',
    specName = '通用专项',
    varName = '常规变式',
    difficultyConfig = { level: 'L2', tier: '基础筑基', complexity: 1, steps: 2, traps: 0, paramConstraint: 'integer' },
    variableKnobs = null,
    benchmarkQuestion = null,
    seedQuestion = null,
    constraints = {},
    hardConstraints = null,
    systemInstructionTemplate = null,
    moduleConstraints = null,
    mathInvariants = null,
    userGrade = '高三',
    motifId = '',
    problemIndex = 1,
    totalProblems = 3
  } = context

  // 🔧 【关键修复】显式提取 level 变量，防止未定义错误
  const level = difficultyConfig?.level || 'L2'

  const strategyInstructions = buildStrategyInstructions(variableKnobs)

  const benchmarkText = benchmarkQuestion?.problem || benchmarkQuestion?.desc || '无特定标杆，请自由发挥'
  
  const seedText = seedQuestion?.desc || seedQuestion?.problem || null
  
  // 🔥 新增：提取种子题的核心基因 (key_points, answer, tags, param_slots)
  const seedKeyPoints = seedQuestion?.key_points || seedQuestion?.question?.key_points || null
  const seedAnswer = seedQuestion?.answer || seedQuestion?.question?.answer || null
  const seedTags = seedQuestion?.tags || seedQuestion?.question?.tags || null
  const seedId = seedQuestion?.id || seedQuestion?.question?.id || 'unknown'
  
  // 提取可变参数槽
  const paramSlots = variableKnobs?.param_slots || null
  
  // 构建种子题基因文本
  let seedGeneText = ''
  if (seedText) {
    seedGeneText = `
## 🎯 种子题（本次变形基底）
**重要**：以下是从题库中筛选出的与目标难度匹配的真题种子，请以此为基础进行变形：

**种子ID**: ${seedId}
**原题描述**: ${seedText}
${seedQuestion?.level ? `**种子难度**: ${seedQuestion.level}` : ''}

${seedKeyPoints ? `### 🧬 核心逻辑基因 (不可变)
以下是种子题的解题思路，你**必须严格保留**这些核心逻辑：
${Array.isArray(seedKeyPoints) ? seedKeyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n') : seedKeyPoints}
` : ''}

${seedAnswer ? `### 📝 原答案 (参考)
${seedAnswer}
` : ''}

${seedTags ? `### 🏷️ 考点标签
${Array.isArray(seedTags) ? seedTags.join('、') : seedTags}
` : ''}

${paramSlots && paramSlots.length > 0 ? `### 🔧 可变参数槽 (仅允许在此范围内替换)
以下参数是你可以安全替换的，**严禁**使用列表外的数值：
${paramSlots.map(slot => `- **${slot.desc || slot.slot_id}**: 候选值 [${Array.isArray(slot.candidates) ? slot.candidates.join(', ') : slot.candidates || '范围限制'}]`).join('\n')}
` : ''}
`
  }

  // 读取标杆题的策略对比和名师点拨
  let strategyComparisonSection = ''
  if (benchmarkQuestion?.strategy_comparison) {
    const sc = benchmarkQuestion.strategy_comparison
    const methods = []
    
    Object.entries(sc).forEach(([key, method]) => {
      const recommended = method.recommended ? ' ⭐推荐' : ''
      const complexity = method.complexity === 'low' ? '简单' : method.complexity === 'high' ? '复杂' : '中等'
      methods.push(`**${method.name}${recommended}**：${method.steps} 步 (${complexity})\n   - ${method.description}${method.advantage ? `\n   - 优势：${method.advantage}` : ''}${method.drawback ? `\n   - 缺点：${method.drawback}` : ''}`)
    })
    
    strategyComparisonSection = `
## 🌟 策略对比（学习标杆题的解题思路）
${methods.join('\n\n')}
`
  }
  
  if (benchmarkQuestion?.teacher_tip) {
    strategyComparisonSection += `
${benchmarkQuestion.teacher_tip}
`
  }

  let strategySection = ''
  if (strategyInstructions) {
    strategySection = `
## 🚫 核心策略：保真改写 (Faithful Rewriting) - 最高优先级
**重要警告**：本题源自高质量真题库 (种子ID: ${seedId || 'unknown'})。你的任务**不是**重新设计题目逻辑，而是**严格保留原题的思维骨架**。

1. **严禁改变题型结构**：
   - 如果种子题是"指对运算 + 范围求解"，你必须保持这个结构。
   - 如果种子题有 2 个小问且逻辑递进，你**必须**保留这种递进关系，**严禁**将其拆分为两个无关的计算题（禁止拼盘）。
   - **严禁**简化原题的逻辑链条（如删除分类讨论、删除构造函数步骤），这会导致难度从 L3 降为 L2。

2. **仅允许的操作 (Allowed Operations)**：
   - ✅ **数值替换**：修改底数、真数、系数、常数项（确保结果整洁）。
   - ✅ **变量重命名**：将 x 改为 t，将 a 改为 k 等。
   - ✅ **等价变形**：将 $\\log_2 8$ 写成 $3$，或将 $2^3$ 写成 $8$（增加一点点计算步骤，但不改变逻辑）。
   
3. **禁止的操作 (Forbidden Operations)**：
   - ❌ **删除步骤**：不得省略原题的关键推导环节。
   - ❌ **合并/拆分**：不得将两问合并为一问，也不得将一问拆成两问。
   - ❌ **更换核心考点**：如果原题考"构造函数单调性"，你不能改成"直接解方程"。

4. **难度锚定**：
   - 原题难度标记为 **${seedQuestion?.level || level}**。你的改写版本必须保持同等难度的思维密度。
   - **自检**：如果改写后的题目能在 1 分钟内通过纯机械计算完成，说明你**简化过度**，必须重写！

**额外策略约束**：
${strategyInstructions.map(s => `- ${s}`).join('\n')}
`
  }

  // 🔥【新增核心功能】构建通用的"高考难度锚点"描述 (适用于 ALL 17 母题)
  const getDifficultyAnchor = (lvl) => {
    switch(lvl) {
      case 'L2':
        return `【🎯 难度定位：110 分水平 / 高考中档题】
- **对应试卷位置**：单选题前 6 题、填空题前 2 题、解答题前 3 道（三角/数列/概率）。
- **命题风格**：考查核心概念的直接应用或简单变形。允许简单的数形结合，但严禁复杂分类讨论。
- **解法要求**：必须能用基础代数方法或**观察法**在 3-5 分钟内解决。**严禁使用导数**（除非题目本身是研究单调性且无需求导即可判断）。
- **典型模型**：可以是经典的'定点问题'、'基本不等式'、'简单复合函数性质'、'指对同构（观察法）'、'数列简单递推'。
- **特别提示**：即使种子题涉及"超越方程"或"复杂结构"，你也必须将其简化为"一眼能看出结构特征"的 L2 题型。`
      
      case 'L3':
        return `【🎯 难度定位：125 分水平 / 高考中高难题】
- **对应试卷位置**：单选题后 2 题、多选题前 2 题、解答题倒数第二道的压轴问。
- **命题风格**：需要一定的思维灵活性，如构造简单模型、逆向思维、或 2 步以上的逻辑推导。
- **解法要求**：可以涉及分类讨论（不超过 2 类），可以涉及简单的参数范围求解。**谨慎使用导数**（仅用于基础单调性讨论）。
- **典型模型**：'指对同构（构造法）'、'函数性质综合'、'含参不等式恒成立（分离参数法）'、'数列放缩（基础）'。
- **🔥 核心要求**：必须保留种子题的**完整逻辑链条**。
- **严禁简化**：如果种子题涉及"构造函数"、"分类讨论"或"多步转化"，你**必须**在改写版中完整保留这些步骤。
- **反例警示**：
  - 种子题：利用单调性证明 f(x)=f(y) => x=y。
  - ❌ 错误改写：直接给出 x,y 的具体值让学生计算。（这是 L2，禁止！）
  - ✅ 正确改写：修改函数底数和系数，依然要求学生利用单调性判断 x,y 关系。
- **操作指南**：你的工作本质是**"换皮不换骨"**。只换数字，不换逻辑！`

      case 'L4':
        return `【🎯 难度定位：135+ 分水平 / 高考压轴题】
- **对应试卷位置**：单选题最后一题、填空题最后一题、解答题最后两道的最终问。
- **命题风格**：高思维密度，多步转化，巧妙的构造，或复杂的分类讨论（3 类以上）。
- **解法要求**：**允许并鼓励使用导数**解决极值、零点、不等式证明问题。可以涉及放缩法、同构法的高级应用。
- **典型模型**：'导数双零点问题'、'圆锥曲线定值/范围'、'复杂指对混合不等式证明'、'数列复杂放缩'。`
      
      default:
        return `【🎯 难度定位：常规难度】
- 请根据题目内容自动调整难度。`
    }
  }
  
  const difficultyAnchorText = getDifficultyAnchor(level)

  // 🔥 修改为兼容模式 (同时支持旧格式、新格式和 RAG 格式)
  let levelConstraints = null
  
  if (variableKnobs) {
    // 优先尝试新格式: level_constraints -> L2
    if (variableKnobs.level_constraints && variableKnobs.level_constraints[level]) {
      levelConstraints = variableKnobs.level_constraints[level]
      console.log(`[PromptBuilder] ✅ 读取到新格式约束: level_constraints.${level}`)
    }
    // 降级尝试旧格式: L2_constraints
    else if (variableKnobs[`${level}_constraints`]) {
      levelConstraints = variableKnobs[`${level}_constraints`]
      console.log(`[PromptBuilder] ⚠️ 读取到旧格式约束: ${level}_constraints`)
    }
    // 兜底: 直接读 level (如果存在)
    else if (variableKnobs[level]) {
      levelConstraints = variableKnobs[level]
      console.log(`[PromptBuilder] ⚠️ 读取到简写格式约束: ${level}`)
    }
    // 🔥 RAG 格式：从 keyPoints / key_points 提取约束
    else if (variableKnobs.keyPoints || variableKnobs.key_points) {
      const keyPoints = variableKnobs.keyPoints || variableKnobs.key_points
      levelConstraints = {
        key_points: Array.isArray(keyPoints) ? keyPoints : [keyPoints],
        context: 'rag_extraction'
      }
      console.log(`[PromptBuilder] ✅ 读取到 RAG 格式约束: key_points`)
    }
  }

  // 🚨 致命检查：如果还是没读到，且是 L2，必须强制注入通用红线
  if (!levelConstraints && level === 'L2') {
    console.error(`[PromptBuilder] ❌ 严重警告：L2 题目未加载到任何难度约束！将注入紧急红线。`)
    levelConstraints = {
      forbidden_concepts: ["导数", "同构", "超越方程", "极值点偏移"],
      require_elementary_solution: true,
      steps_max: 3,
      context: 'direct_calculation'
    }
  }

  let levelConstraintsSection = ''
  if (levelConstraints) {
    const constraintItems = []
    
    if (levelConstraints.omega_discussion === false) {
      constraintItems.push(`🚫 **禁止 ω 范围讨论**：L2 题目严禁出现求 ω 范围的问题。`)
    }
    if (levelConstraints.phi_multiple_solutions === false) {
      constraintItems.push(`🚫 **禁止 φ 多解筛选**：L2 题目必须给定 φ 范围，直接代入求解。`)
    }
    if (levelConstraints.phi_range_required) {
      constraintItems.push(`✅ **必须给定 φ 范围**：题干中必须显式给出 φ 的范围（如 |φ| < π/2）。`)
    }
    if (levelConstraints.steps_max) {
      constraintItems.push(`📏 **步骤上限**：解题步骤不超过 ${levelConstraints.steps_max} 步。`)
    }
    if (levelConstraints.context === 'direct_calculation') {
      constraintItems.push(`📐 **计算类型**：直接计算，无需逆向推理或分类讨论。`)
    }
    if (levelConstraints.context === 'inverse_reasoning') {
      constraintItems.push(`🔄 **推理类型**：需要逆向推理，可能涉及参数讨论。`)
    }
    if (levelConstraints.context === 'complex_construction') {
      constraintItems.push(`🏗️ **构造类型**：复杂构造，需要多步分析和综合运用。`)
    }
    if (levelConstraints.zero_point_count === false) {
      constraintItems.push(`🚫 **禁止零点个数讨论**：L2 题目严禁出现"恰有 N 个零点"的问题。`)
    }
    if (levelConstraints.open_close_boundary) {
      constraintItems.push(`⚠️ **开闭区间端点校验**：必须明确说明端点等号的取舍理由。`)
    }
    if (levelConstraints.endpoint_equality_check) {
      constraintItems.push(`⚠️ **端点等号校验**：解析中必须详细解释"为什么取等号"或"为什么不取等号"。`)
    }
    
    // 向量专属约束
    if (levelConstraints.allow_dynamic_point === false) {
      constraintItems.push(`🚫 **禁止动点**：本题不得包含动点轨迹或参数范围讨论。`)
    }
    if (levelConstraints.allow_parameter_optimization === false) {
      constraintItems.push(`🚫 **禁止参数优化**：本题不得包含求参数范围或最值的问题。`)
    }
    if (levelConstraints.model_complexity === 'direct') {
      constraintItems.push(`✅ **直接应用**：本题应直接给出模型条件（如明确告知 M 是中点），不得要求学生自行构造。`)
    }
    if (levelConstraints.model_complexity === 'recognition_required') {
      constraintItems.push(`🔍 **模型识别**：本题需要学生识别隐藏的几何模型（如极化恒等式、奔驰定理）。`)
    }
    if (levelConstraints.midpoint_given) {
      constraintItems.push(`✅ **中点已给**：题干中必须明确给出中点条件，学生直接代入极化恒等式即可。`)
    }
    if (levelConstraints.collinear_condition_given) {
      constraintItems.push(`✅ **共线条件已给**：题干中必须明确给出三点共线或中点条件。`)
    }
    if (levelConstraints.no_parameter_t_lambda) {
      constraintItems.push(`🚫 **禁止参数 t/λ**：L2 题目不得包含参数 t 或 λ 的最值问题。`)
    }
    if (levelConstraints.strategy_trap) {
      constraintItems.push(`⚠️ **策略陷阱**：必须包含"建系 vs 几何法"的策略选择陷阱，让学生体会方法选择的重要性。`)
    }
    if (levelConstraints.calculation_steps_max) {
      constraintItems.push(`📏 **计算步骤上限**：坐标运算不超过 ${levelConstraints.calculation_steps_max} 步。`)
    }
    if (levelConstraints.advanced_theorems && levelConstraints.advanced_theorems.length > 0) {
      constraintItems.push(`📚 **高级定理**：可使用 ${levelConstraints.advanced_theorems.join('、')} 等高级定理。`)
    }
    
    // 函数专属约束
    if (levelConstraints.allow_mixed_symmetry === false) {
      constraintItems.push(`🚫 **禁止混合对称**：本题仅考查单一性质，严禁出现双重对称推导周期。`)
    }
    if (levelConstraints.domain_complexity === 'single_condition') {
      constraintItems.push(`✅ **单条件定义域**：定义域必须是单条件（如 x>0），严禁复杂不等式组。`)
    }
    if (levelConstraints.calculation_result === 'integer') {
      constraintItems.push(`✅ **整数结果**：解析式运算结果必须为整数，严禁出现无法完美配方的情况。`)
    }
    if (levelConstraints.allow_half_period) {
      constraintItems.push(`📐 **半周期推导**：允许使用 f(x+T/2)=-f(x) 推导周期。`)
    }
    if (levelConstraints.inequality_type === 'odd_even_monotonic') {
      constraintItems.push(`📊 **奇偶+单调**：允许使用奇偶性+单调性解不等式。`)
    }
    if (levelConstraints.logic_chain_length) {
      constraintItems.push(`📏 **逻辑链长度**：逻辑链长度不超过 ${levelConstraints.logic_chain_length}。`)
    }
    if (levelConstraints.symmetry_combo && levelConstraints.symmetry_combo.length > 0) {
      constraintItems.push(`🔄 **双重对称组合**：必须包含 ${levelConstraints.symmetry_combo.join('、')} 等双重对称推导。`)
    }
    if (levelConstraints.zero_validation === 'mandatory') {
      constraintItems.push(`✅ **必须验证**：求出外层 t 后，必须显式验证 t 是否在 f(x) 值域内。`)
    }
    if (levelConstraints.boundary_check === 'critical_point_analysis') {
      constraintItems.push(`🔍 **临界分析**：必须单独讨论边界值，并说明取舍理由。`)
    }
    
    // 代数专属约束
    if (levelConstraints.allow_parameter === false) {
      constraintItems.push(`🚫 **禁止参数**：L2 题目严禁出现任何参数讨论。`)
    }
    if (levelConstraints.calculation_result === 'integer') {
      constraintItems.push(`✅ **整数结果**：所有系数和根必须为整数，便于十字相乘。`)
    }
    if (levelConstraints.discussion_levels === 1) {
      constraintItems.push(`📊 **单级讨论**：仅允许根序讨论或简单配凑，逻辑链长度 2。`)
    }
    if (levelConstraints.hook_function_vertex === 'on_boundary') {
      constraintItems.push(`📐 **拐点在边界**：对勾函数拐点在区间边界，等号勉强可取。`)
    }
    if (levelConstraints.degenerate_case === 'mandatory') {
      constraintItems.push(`⚠️ **退化预警**：本题必须讨论二次项系数为 0 的情况！`)
    }
    if (levelConstraints.hook_function_vertex === 'outside_interval') {
      constraintItems.push(`🚫 **公式禁用**：等号无法取到，请使用单调性求解！`)
    }
    if (levelConstraints.logic_chain_length >= 3) {
      constraintItems.push(`🔍 **三级讨论**：请按"开口 → 判别式 → 根序"顺序严谨推导。`)
    }
    
    // 集合与逻辑专属约束 (M01)
    if (levelConstraints.empty_set_discussion === 'mandatory') {
      constraintItems.push(`⚠️ **空集预警**：本题必须讨论集合为空的情况！`)
    }
    if (levelConstraints.endpoint_validation === 'mandatory') {
      constraintItems.push(`✅ **端点验证**：必须代入端点值验证集合关系是否成立。`)
    }
    if (levelConstraints.forbid_empty_set_trap === true) {
      constraintItems.push(`🚫 **禁止空集陷阱**：L3 题目禁止涉及空集讨论，空集陷阱应归为 L4。`)
    }
    if (levelConstraints.data_integrity === 'integer_solution') {
      constraintItems.push(`✅ **整数解**：运算结果必须为整数或简单分数，避免复杂根式。`)
    }
    
    if (constraintItems.length > 0) {
      levelConstraintsSection = `
## 🎯 ${level} 难度专属约束
以下约束针对 ${level} 难度题目，必须严格遵守：
${constraintItems.map(c => `- ${c}`).join('\n')}`
    }
  }

  let hardConstraintsSection = ''
  if (hardConstraints) {
    const constraintItems = []
    
    if (hardConstraints.phi_range_required) {
      constraintItems.push(`⚠️ **相位唯一性约束**：本题涉及求解 φ，必须在题干中明确给定范围（默认：${hardConstraints.phi_default_range || '|φ| < π/2'}）。`)
    }
    
    if (hardConstraints.omega_must_positive) {
      constraintItems.push(`⚠️ **频率正定性**：ω 必须为正数，题目中应注明 ω > 0。`)
    }
    
    if (hardConstraints.check_symmetry_consistency) {
      constraintItems.push(`⚠️ **对称性自洽校验**：生成题目后，请代入对称点验证函数值是否为 0（或最值），确保逻辑自洽。`)
    }
    
    if (hardConstraints.check_boundary_equality) {
      constraintItems.push(`⚠️ **端点等号校验**：涉及"恰有 N 个"的问题，必须在解析中明确说明端点等号的取舍理由。`)
    }
    
    if (hardConstraints.explicit_endpoint_reasoning) {
      constraintItems.push(`⚠️ **端点推理显式化**：解析中必须详细解释"为什么取等号"或"为什么不取等号"。`)
    }
    
    if (hardConstraints.check_phase_consistency) {
      constraintItems.push(`⚠️ **相位一致性校验**：确保所有条件（如过定点、对称轴）对应的相位值一致。`)
    }
    
    if (constraintItems.length > 0) {
      hardConstraintsSection = `
## 🛡️ 强制约束（最高优先级）
以下约束必须严格遵守，违反则题目无效：
${constraintItems.map(c => `- ${c}`).join('\n')}

**执行流程**：生成题目 → 自我校验上述约束 → 通过则输出，不通过则重写。`
    }
  }

  // 构建模块专属约束段落
  let moduleConstraintsSection = ''
  if (moduleConstraints && Array.isArray(moduleConstraints) && moduleConstraints.length > 0) {
    moduleConstraintsSection = `
## ⚠️ ${motifName} 专属铁律 (最高优先级)
以下是针对 **${motifName}** 模块的绝对数学禁忌，违反任意一条即视为命题失败：
${moduleConstraints.map((rule, index) => `${index + 1}. ${rule}`).join('\n')}

**自检要求**：生成题目后，必须逐条核对上述规则，确保完全合规。
`
  }

  // 构建数学不变量段落 (融合方案的核心：微观动态强控)
  let mathInvariantsSection = ''
  if (mathInvariants && Array.isArray(mathInvariants) && mathInvariants.length > 0) {
    mathInvariantsSection = `
## 🛡️ ${motifName} 专属数学不变量 (最高优先级 - 违反即逻辑崩塌)
在"逻辑冲突排查"环节，必须逐条在草稿中验证以下规则：
${mathInvariants.map((rule, index) => `${index + 1}. ${rule}`).join('\n')}
**验证流程**：逆向构造 → 逐条验证不变量 → 通过则继续，不通过则重造。`
  }

  // 🔥 【核心修改】移除所有验算逻辑，改为"结构化搬运"
  // 原有的 dynamicConstraintsSection 和 自检指令全部移除
  
  // 构建新的"搬运指令"
  const 搬运指令 = `## 🚚 纯搬运模式指令 (Source of Truth)
1. **任务变更**：你不再是"出题人"，而是"真题搬运工"。
2. **核心逻辑**：
   - 从"种子题"中提取 LaTeX 结构和参数位置。
   - 仅对参数进行安全的数值替换（例如将 $a=2$ 改为 $a=3$）。
   - **严禁**进行任何数学推导、验算或逻辑证明。
   - **严禁**在 reasoning 中包含 step3_adaptive_check（验算步骤）。
3. **输出要求**：
   - 直接输出题目结构。
   - 答案直接从 M 库中搬运，不要修改。
   - 解析直接从 M 库中搬运，不要重写。`

  let systemSection = ''
  if (systemInstructionTemplate) {
    systemSection = `
## 母题专属指令
${systemInstructionTemplate}
`
  }

  let weaponSection = ''
  const { weaponId, weaponName, weaponLogicFlow } = constraints
  
  if (weaponId && weaponName) {
    weaponSection = `
## 🔥 杀手锏训练要求（最高优先级）
本题必须体现「**${weaponName}**」的应用！

**杀手锏核心逻辑**：
${weaponLogicFlow || '请参考杀手锏名称设计题目'}

**强制要求**：
1. 题目设计必须诱导学生需要使用该杀手锏才能正确解题
2. 解析中必须详细演示该杀手锏的应用步骤
3. 在 analysis.steps 中显式标注「[杀手锏]」标记
4. 若学生未使用该杀手锏，极易掉入陷阱

**示例格式**：
- 步骤中需包含："应用「${weaponName}」：..."
- 或："关键步骤：使用「${weaponName}」思维，..."
`
  }

  // 🔧 新增：进度提示部分
  const progressSection = `
## 📍 当前任务进度
- **母题**: ${motifName}
- **进度**: 第 ${problemIndex} / ${totalProblems} 题
- **策略**: 本题必须在**几何背景**、**设问方式**或**核心考点**上与同母题的其他题目保持显著差异。
${problemIndex === 1 ? `- 📌 第 1 题：确立基准模型，确保典型性。` : ''}
${problemIndex === 2 ? `- 🔄 第 2 题：必须变换背景或条件（如动点变静点，求值变范围），避免重复。` : ''}
${problemIndex === 3 ? `- 🚀 第 3 题：必须尝试综合创新或逆向思维，作为本组的压轴变式。` : ''}
`

  return `${progressSection}

## 🎯 高考难度锚点 (最高优先级指导 - 适用于所有母题)
${difficultyAnchorText}

## 上下文
- **母题主题**: ${motifName}
- **专项知识点**: ${specName}
- **变式方向**: ${varName}
- **目标难度**: ${difficultyConfig.level} (${difficultyConfig.tier})
  - 复杂度: ${difficultyConfig.complexity}
  - 步骤数: ${difficultyConfig.steps}
  - 陷阱数: ${difficultyConfig.traps}
  - 参数约束: ${difficultyConfig.paramConstraint}
  - 参数数量范围: ${difficultyConfig.minParams || 1} ~ ${difficultyConfig.maxParams || 3}
${systemSection}
## 参考标杆
参考标杆题逻辑（不要照抄，仅参考逻辑结构）:
${benchmarkText}
${seedGeneText || (seedText ? `
## 🎯 种子题（本次变形基底）
**重要**：以下是从题库中筛选出的与目标难度匹配的种子题，请以此为基础进行变形：
${seedText}
${seedQuestion?.level ? `（种子难度：${seedQuestion.level}）` : ''}
` : '')}
${strategyComparisonSection}${strategySection}${levelConstraintsSection}${hardConstraintsSection}${moduleConstraintsSection}${mathInvariantsSection}
${搬运指令}
${weaponSection}

## 🚨 JSON 格式生死线 (搬运工版)
你的输出**必须**是合法的 JSON 对象。任何格式错误都会导致系统崩溃！

1. **严禁**在字符串值中包含未转义的换行符、双引号 (") 或反斜杠 (\\)。
   - 错误示例："content": "第一问...
第二问..."  (❌ 直接换行)
   - 正确示例："content": "第一问...\\n第二问..." (✅ 使用 \\n)

2. **严禁**在最后一个属性后加逗号。
   - 错误示例：{ "a": 1, "b": 2, }  (❌ 尾部逗号)
   - 正确示例：{ "a": 1, "b": 2 }  (✅ 无尾部逗号)

3. **严禁**在 JSON 外部输出任何多余的文字（如 "好的，这是题目..."）。

4. **LaTeX 转义规则**：
   - 所有 LaTeX 中的反斜杠必须双写：\\\\rightarrow 而非 \\rightarrow
   - 所有 LaTeX 中的花括号必须保留：$x^2$ 而非 $x^2$

5. **严禁**在 reasoning 中包含数学验算过程（如代入数值计算结果）。

6. **必须**保留种子题的 reasoning 结构，仅替换参数描述。

7. **答案 (answer)** 字段必须直接复制 M 库中的标准答案，不要做任何格式修改。

8. **解析 (analysis)** 字段必须直接复制 M 库中的标准解析，不要做任何改写。

9. **🚨 强制要求**：analysis 字段必须包含：
   - core_idea：核心解题思路（1-2句话）
   - steps：详细解题步骤数组（至少2步）
   - 如果种子题有 key_points，必须将其转化为 analysis.steps

10. **严禁简化**：如果种子题有3步解析，你的输出也必须有3步，不得省略任何步骤。

## 生成指令 (搬运工模式)
在输出 JSON 前，必须在 'reasoning' 中严格执行以下两步：

1. **动态识别与指纹提取 (step1_dynamic_fingerprint)**：
   - 从种子题中提取 LaTeX 结构和参数位置。

2. **逆向构造与参数锁定 (step2_reverse_construction)**：
   - 仅对参数进行安全的数值替换，不进行任何数学推导。

3. **搬运工确认 (step3_porter_confirmation)**：
   - 确认答案和解析已直接从 M 库搬运，未做修改。${weaponId ? '\n4. **杀手锏体现**：确保解析中显式体现「' + weaponName + '」的应用步骤。' : ''}

---

请确认你理解了"搬运工模式"。不要创造，不要验算，只要基于种子题进行参数替换并输出 JSON。`
}
