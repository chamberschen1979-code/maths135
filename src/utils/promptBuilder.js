const PERFECT_OUTPUT_EXAMPLE = {
  reasoning: {
    q1_params: {
      values: "a=2, b=1",
      reason: "L2难度，选择小整数以确保计算简单，判别式为完全平方数"
    },
    q2_params: {
      values: "a=3, b=2",
      reason: "L3难度，引入稍大整数，需分类讨论根的符号"
    },
    verification: "Q1: x^2-2x+1=0 -> (x-1)^2=0, x=1 (OK). Q2: x^2-3x+2=0 -> x=1,2 (OK)."
  },
  question: {
    content: "（1）已知集合 $A = \\{x \\mid x^2 - ax + b = 0\\}$，若 $A = \\{1\\}$，求 $a, b$ 的值。\n（2）设方程 $x^2 - mx + n = 0$ 的两根为 $x_1, x_2$，当 $m=3, n=2$ 时，判断 $x_1, x_2$ 的符号。"
  },
  analysis: {
    core_idea: "利用韦达定理及集合元素的互异性/确定性求解参数。",
    steps: [
      "对于(1)：由 $A=\\{1\\}$ 知方程有唯一实根 $x=1$。",
      "根据韦达定理：$x_1+x_2=a \\Rightarrow 1+1=a \\Rightarrow a=2$。",
      "$x_1 \\cdot x_2=b \\Rightarrow 1 \\cdot 1=b \\Rightarrow b=1$。",
      "对于(2)：方程为 $x^2-3x+2=0$，解得 $x_1=1, x_2=2$。",
      "两者均为正数。"
    ]
  },
  answer: {
    l1: "$a=2, b=1$",
    l2: "$x_1 > 0, x_2 > 0$"
  }
}

export const buildSystemPrompt = () => {
  const exampleJson = JSON.stringify(PERFECT_OUTPUT_EXAMPLE, null, 2)
  
  return `# 角色定位
你是一位资深高中数学命题专家，擅长根据给定的知识点、难度等级和参数约束，逆向构造高质量的数学题目。

# 关键约束（绝对规则）
1. **输出格式**:
   - 输出**严格**为单个有效的 JSON 对象。
   - **禁止**使用 markdown 代码块（不要 \`\`\`json）。
   - **禁止**任何开场白或结束语。
   - 直接以 '{' 开始，以 '}' 结束。

2. **LaTeX 规范**:
   - 行内公式使用单个 '$' 符号：例如 '$x^2$'。
   - **禁止**双重包裹：错误写法 '$ $x^2$ $'，正确写法 '$x^2$'。
   - **禁止**在 '$' 外使用 LaTeX 命令：错误写法 '\\{x \\mid x>0\\}'，正确写法 '$\\{x \\mid x>0\\}$'。
   - 在 JSON 字符串中，需转义反斜杠：使用 '\\\\frac', '\\\\sqrt', '\\\\mid'。

3. **推理字段禁令**:
   - 'reasoning' 字段必须是**纯文本**。
   - **禁止**出现 '$'，**禁止**出现 '\\'，**禁止** LaTeX 公式。
   - 示例："delta = b^2 - 4ac"（正确），"$\\\\Delta$"（禁止）。

4. **逻辑流程**:
   - 第一步：在 'reasoning' 中根据难度选择参数。
   - 第二步：心算验证参数（确保整数解或简单分数）。
   - 第三步：使用验证后的参数生成题目内容。

# 输出格式示例
你必须严格遵循以下结构：
${exampleJson}`
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
    systemInstructionTemplate = null
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
${strategyComparisonSection}${strategySection}${levelConstraintsSection}${hardConstraintsSection}${weaponSection}
## 生成指令
1. **参数选择**：在 'reasoning' 中明确说明你选择了哪些参数，以及为什么它们符合目标难度和策略约束。
2. **自我验证**：确保所选参数能构成有效的数学情境（如判别式 >= 0，定义域 > 0）。
3. **题目生成**：基于这些参数创建一道两问的题目（第一问：基础，第二问：进阶/讨论）。
4. **解析编写**：提供分步解答，使用清晰的 LaTeX 格式。${weaponId ? '\n5. **杀手锏体现**：确保解析中显式体现「' + weaponName + '」的应用步骤。' : ''}
6. **输出**：立即生成 JSON 对象。`
}
