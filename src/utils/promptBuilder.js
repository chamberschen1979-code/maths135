const PERFECT_OUTPUT_EXAMPLE = {
  reasoning: {
    step1_dynamic_fingerprint: "【动态识别与指纹提取】\n1. 题型路由：判断当前母题属于四大领域中的哪一类（函数方程类 / 几何向量类 / 代数数列类 / 统计概率类）。\n2. 提取指纹：若为数列类，提取'非线性递推'；若为几何类，提取'非中点/非对称构型'；若为概率类，提取'条件概率嵌套'。本例假设为向量几何类，提取指纹：'圆心与线段中点不重合'。\n3. 策略定调：保留该指纹，拒绝退化为平庸的基础模型（如定值模型）。",
    step2_reverse_construction: "【逆向构造与参数锁定】\n设定目标难度为L3。基于'圆心偏移'指纹，设A(-1,0), B(1,0)，中点M(0,0)。故意将动点P所在的圆心设为C(0,1)，半径r=1。设计第一问求数量积范围，第二问求动态极值之差。",
    step3_adaptive_check: `【🔥 分科诊疗：自适应逻辑熔断与验算 (Adaptive Circuit Breaker)】

**第一步：母题类型路由**
请先明确本题属于以下哪一类，并**仅执行**对应类别的验算脚本：
- **A类 [几何/向量]** (M05, M09, M10, M11, M12): 涉及点、线、面、轨迹、数量积。
- **B类 [函数/方程]** (M02, M03, M04, M06, M07): 涉及单调性、零点、对称性、指对三角。
- **C类 [数列/代数]** (M08, M13, M14): 涉及递推、求和、不等式放缩。
- **D类 [统计/概率]** (M15, M16, M17): 涉及分布列、期望、条件概率、抽样。
- **E类 [集合/逻辑]** (M01): 涉及包含关系、充要条件。

**第二步：执行专属验算脚本 (必须写出具体算式/推导，严禁模糊描述)**

>>> **若为 A类 [几何/向量]：**
1. **定值熔断测试**：选取动点的**两个极端位置**（如圆的最左/最右端，或线段端点），分别计算目标量 Val1, Val2。
   - 若 Val1 == Val2，**立即报错**：判定为定值，严禁问"范围"。必须修改构型（如移动圆心）或改问"求值"。
   - 若 Val1 != Val2，通过。
2. **存在性检查**：验证轨迹是否非空（如半径 r>0，判别式 Δ >= 0）。
3. **变量定义检查**：题干中出现的参数（如 a, r, λ）是否已赋值或作为求解对象？若有未定义参数，**立即报错**。

>>> **若为 B类 [函数/方程]：**
1. **边界/端点熔断测试**：代入定义域或区间的**边界值**，计算函数值或零点个数。
   - 验证"恰有 N 个零点"时，需确认边界值是否导致 N+1 或 N-1 个，确保开闭区间准确。
2. **参数唯一性检查**：
   - 若求 ω, φ 等参数，检查条件数是否 >= 未知数个数？
   - 若解不唯一（如 ω = 6k-1），题干是否限制了范围（如"最小正值"）？若无限制且问"求值"，**立即报错**。
3. **定义域非空检查**：确保对数真数 >0，分母 != 0。

>>> **若为 C类 [数列/代数]：**
1. **n=1 兼容性测试**：将 n=1 代入通项公式和求和公式，验证是否与首项一致。
2. **分母/根号安全检查**：验证递推式中分母是否可能为 0，根号内是否非负。
3. **放缩方向检查**：若涉及不等式，验证放缩方向是否一致（如不能从 A<B 推出 A>C）。

>>> **若为 D类 [统计/概率]：**
1. **归一化测试 (最高优先级)**：计算所有可能情况的概率之和 ΣPi。
   - 若 ΣPi != 1，**立即报错**：数据构造失败，必须重新分配概率。
2. **非负性测试**：验证所有概率 Pi ∈ [0, 1]。
3. **事件互斥/独立检查**：验证题目假设（如"独立重复试验"）是否与题干条件冲突。

>>> **若为 E类 [集合/逻辑]：**
1. **空集陷阱测试**：若涉及子集关系 (A ⊆ B)，**必须讨论 A = ∅ 的情况**。
   - 若忽略空集导致漏解，**立即报错**。
2. **端点重合测试**：若涉及区间端点，验证端点值取等号时集合关系是否成立。
3. **循环论证检查**：对比"已知"与"求证"，严禁"已知 A 求证 A"。

**第三步：最终自检填空 (基于上述真实计算如实填写)**
- 归属类别：(填写 A/B/C/D/E)
- 核心验算结果：(填写具体算式，如 'Val1=-1, Val2=3, 不相等' 或 'Sum(P)=1' 或 'n=1 符合')
- 致命错误排查：(填写：无 / 发现 [具体错误名称] 已修正)
- **最终决策**：(填写：通过生成 / **驳回重写**)`
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
你是一位拥有 20 年经验的**高中数学命题质检专家**。你的核心能力是**"数学沙盘推演"**。
无论面对哪个母题（集合、函数、三角、向量、数列等），你都必须遵循**"先构造数学模型，再生成题目文案"**的铁律。

# 全局年级护栏 (当前设定：${userGrade})
${gradeGuardrails}

# 🧠 核心工作流：数学沙盘推演 (强制执行 - 适用于所有 17 个母题)
在输出 'question' 字段之前，你必须在 'reasoning' 字段严格执行以下三步推演，**缺一不可**：

### 第一步：逆向数学构造 (Mathematical Construction)
- 设定目标答案 -> 正向推导表达式 -> 锁定参数具体数值（不涉及题目文字）。

### 第二步：逻辑冲突排查 (Conflict Check) - 必须写草稿！
禁止直接回答"是/否"，必须写出简要的代数验算或几何分析过程：
1. **代数/方程/数列类**：未知数个数 vs 独立方程个数是否匹配？设定的方程根是否为"无理数死胡同"？
2. **函数/导数/三角类**：求最值时，函数在区间内是否有界？求参数时，是否给足了限制条件（如相位范围）？
3. **几何/向量/解析几何类**：所求量是否随动点变化（定值严禁问最值）？轨迹是否闭合有界？
4. **模块特异性检查**：严格逐条核对传入的 \`mathInvariants\` 铁律。
🔥 **熔断机制**：若验算发现矛盾，**必须立刻放弃当前参数重新构造**！

### 第三步：文案生成 (Text Generation)
- 只有前两步完全通过，才隐藏推导痕迹，生成题干。

# 输出格式示例
${exampleJson}

# 执行指令
现在，请根据用户需求，启动**数学沙盘推演**，构造一道逻辑完美自洽的题目。`
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
    motifId = ''
  } = context

  const strategyInstructions = buildStrategyInstructions(variableKnobs)

  const benchmarkText = benchmarkQuestion?.problem || benchmarkQuestion?.desc || '无特定标杆，请自由发挥'
  
  const seedText = seedQuestion?.desc || seedQuestion?.problem || null

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
## 策略约束（必须遵循）
请严格按照以下策略生成题目：
${strategyInstructions.map(s => `- ${s}`).join('\n')}

**重要**：具体的数值（如数列的项、角度大小、方程系数）请由你根据上述策略自行构造，确保数据整洁且可解。`
  }

  // 提取难度级别约束
  const level = difficultyConfig?.level || 'L2'
  const levelConstraintsKey = `${level}_constraints`
  const levelConstraints = variableKnobs?.[levelConstraintsKey] || null

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

  return `## 上下文
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
${seedText ? `
## 🎯 种子题（本次变形基底）
**重要**：以下是从题库中筛选出的与目标难度匹配的种子题，请以此为基础进行变形：
${seedText}
${seedQuestion?.level ? `（种子难度：${seedQuestion.level}）` : ''}
` : ''}
${strategyComparisonSection}${strategySection}${levelConstraintsSection}${hardConstraintsSection}${moduleConstraintsSection}${mathInvariantsSection}${weaponSection}
## 生成指令
在输出 JSON 前，必须在 'reasoning' 中严格执行以下三步，绝不能跳过：

🔥 **多样性红线**：禁止连续生成两道逻辑模型完全相同的题目。严禁直接套用 PERFECT_OUTPUT_EXAMPLE 中的具体数值。示例仅用于展示思维流程，必须构造全新的参数和情境。

1. **动态识别与指纹提取 (step1_dynamic_fingerprint)**：
   - **路由判断**：明确指出本题属于【函数/方程】、【几何/向量】、【代数/数列】还是【统计/概率】。
   - **指纹提取**：严禁套用平庸模板！必须提取种子题的核心非标准结构（如：函数类的"分段/指对混合"、几何类的"非特殊位置/隐含轨迹"、数列类的"非线性递推"、概率类的"条件嵌套"）。

2. **逆向构造与参数锁定 (step2_reverse_construction)**：
   - 基于提取的指纹，进行逆向数学构造。通过"静态改动态"或"单步改多步"提升逻辑链深度。

3. **自适应逻辑熔断与验算 (step3_adaptive_check)**：
   - **领域特异性草稿验算**：必须根据题型计算！几何题必须算距离/角度确认非定值；函数题必须代入边界查极值是否存在；数列题必须验算 $n=1$ 或分母不为零；概率题必须算总概率为 1。
   - **铁律核对**：严格核对上方传入的 \`mathInvariants\` 专属红线。${weaponId ? '\n4. **杀手锏体现**：确保解析中显式体现「' + weaponName + '」的应用步骤。' : ''}

---

## 🚨 生死自检（输出 JSON 前必须强制作答）

请在 'reasoning' 的 step3_adaptive_check 最后，**必须以填空题的形式**，逐一如实回答以下四个问题：

1. **反平庸与基因继承检查**：你是否提取了种子题的独特数学结构（如非线性、绝对值、偏心几何等），而没有退化为随处可见的基础模板题？(填写：是/否/无种子题)
2. **自适应数学严谨性检查**：你是否已经在草稿中执行了特定领域的验算（如几何量确实会变化非定值、概率和确实为1、极值确实有界不存在无穷大）？(填写：是/否/非本题)
3. **代数可解性与递进检查**：你设定的参数方程在高中阶段是否能纯手算解出？第二问是否实现了逻辑递进而非低级的"换数重算"？(填写：是/否)
4. **铁律与逻辑自洽检查**：所有条件在数学上是否 100% 兼容无矛盾？是否完全遵守了本模块的 mathInvariants 铁律？(填写：自洽/冲突)

**🔥 组长最高警告**：如果你对任何一个问题回答了"否"或"冲突"，说明产生了致命数学幻觉！**必须立刻清空当前参数，重新提取基因构造！** 只有全票通过，才允许生成最终的 question 和 JSON！`
}
