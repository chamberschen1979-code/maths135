const PERFECT_OUTPUT_EXAMPLE = {
  reasoning: {
    step1_mathematical_construction: "【逆向构造思维演示】\n1. 设定目标：构造一个有唯一解的方程（或存在最值的函数）。\n2. 正向推导：先确定答案（如 x=1），反推表达式 (x-1)^2=0 -> x^2-2x+1=0。\n3. 参数映射：将系数映射为题目参数 (a=2, b=1)。\n*注：若是三角/向量/函数题，此步骤同理：先定结论，再反推参数，确保存在性。*",
    step2_conflict_check: "【通用逻辑冲突排查】\n1. 变量遮蔽：待求参数是否在题干中意外暴露？(检查：否)\n2. 存在性验证：所求最值/范围在数学上是否存在？(如：开口向上是否有最大值？动点轨迹是否闭合？检查：存在)\n3. 条件自洽：已知条件之间是否矛盾？(如：单调性与底数是否冲突？检查：自洽)",
    step3_generate_text: "【文案生成】将验证无误的参数代入题干模板，隐藏推导过程，形成最终问题。"
  },
  question: {
    content: "（1）已知关于 x 的方程 $x^2 - ax + b = 0$ 有唯一实根 $x=1$，求 $a, b$ 的值。\n（2）若函数 $f(t)$ 在区间 $[0, 2]$ 上的最大值为 $M$，且 $f(t) = t^2 - 2t + 2$，求 $M$。"
  },
  analysis: {
    core_idea: "演示逆向构造法：先确定数学对象的性质（唯一解、最值存在性），再反推参数，最后生成题目。",
    steps: [
      "(1) 由唯一实根知 $\\Delta = 0$ 或直接代入 $(x-1)^2=0$，对比系数得 $a=2, b=1$。",
      "(2) 分析 $f(t)$ 开口向上，对称轴 $t=1 \\in [0,2]$，故最小值在顶点，最大值在端点。计算 $f(0)=2, f(2)=2$，故 $M=2$。"
    ]
  },
  answer: {
    l1: "$a=2, b=1$",
    l2: "$M=2$"
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
- **设定目标答案**：先确定你想要的最终结果（例如：唯一解、特定的最值、存在的范围）。
- **正向推导表达式**：从答案出发，反向构造方程、函数或几何关系。
  - *通用原则*：若求最值，先确认函数图像形态（开口方向、有界性）；若求参数范围，先构建不等式模型。
  - *参数锁定*：明确写出所有变量的具体数值。
- **注意**：此步骤是纯数学推导，不涉及题目文字。

### 第二步：逻辑冲突排查 (Conflict Check)
- **常量/变量悖论**：待求参数是否在题干中意外暴露？(若是，立即重造)
- **极值存在性悖论**：
  - 二次函数开口向上 -> 只有最小值。若求最大值，立即重造。
  - 动点在无限直线上 -> 通常无最值。若求最值，需检查是否有界或改为求最小值。
- **复合逻辑悖论**：
  - 单调性、奇偶性、周期性等性质是否与参数设定冲突？(若是，立即重造)
- **模块特异性检查**：结合用户传入的 \`moduleConstraints\` 中的"数学不变量"进行核对。

### 第三步：文案生成 (Text Generation)
- 只有前两步完全通过，才将参数代入题干模板。
- 确保题干中隐藏了关键参数，形成待求解的问题。

# 🚨 命题事故自检清单 (Reasoning 中必须显式回答)
1. **参数遮蔽检查**：待求参数是否在题干中意外暴露？(是/否)
2. **极值/范围存在性检查**：所求最值/范围在数学上是否严格存在？(存在/不存在)
3. **条件自洽性检查**：所有已知条件是否互相兼容？(自洽/冲突)

# 关键约束
1. **输出格式**: 严格为单个 JSON 对象。
2. **LaTeX 规范**: 行内公式用 '$'，JSON 中转义反斜杠。
3. **推理字段**: 'reasoning' 必须是纯文本，清晰展示上述"沙盘推演"全过程。
4. **模块适配**: 必须严格遵守传入的 \`moduleConstraints\` 中的特殊数学规则。

# 输出格式示例
${exampleJson}

# 执行指令
现在，请根据用户需求（母题类型、难度），启动**数学沙盘推演**，构造一道逻辑完美自洽的题目。`
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
    constraints = {},
    hardConstraints = null,
    systemInstructionTemplate = null,
    moduleConstraints = null
  } = context

  const strategyInstructions = buildStrategyInstructions(variableKnobs)

  const benchmarkText = benchmarkQuestion?.problem || benchmarkQuestion?.desc || '无特定标杆，请自由发挥'

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
${strategyComparisonSection}${strategySection}${levelConstraintsSection}${hardConstraintsSection}${moduleConstraintsSection}${weaponSection}
## 生成指令
1. **参数选择**：在 'reasoning' 中明确说明你选择了哪些参数，以及为什么它们符合目标难度和策略约束。
2. **自我验证**：确保所选参数能构成有效的数学情境（如判别式 >= 0，定义域 > 0）${moduleConstraints ? '，**并再次核对 "' + motifName + ' 专属铁律"**' : ''}。
3. **题目生成**：基于这些参数创建一道两问的题目（第一问：基础，第二问：进阶/讨论）。
4. **解析编写**：提供分步解答，使用清晰的 LaTeX 格式。${weaponId ? '\n5. **杀手锏体现**：确保解析中显式体现「' + weaponName + '」的应用步骤。' : ''}
6. **输出**：立即生成 JSON 对象。`
}
