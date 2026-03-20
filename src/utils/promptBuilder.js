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

  let strategySection = ''
  if (strategyInstructions) {
    strategySection = `
## 策略约束（必须遵循）
请严格按照以下策略生成题目：
${strategyInstructions.map(s => `- ${s}`).join('\n')}

**重要**：具体的数值（如数列的项、角度大小、方程系数）请由你根据上述策略自行构造，确保数据整洁且可解。`
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
${strategySection}${hardConstraintsSection}${weaponSection}
## 生成指令
1. **参数选择**：在 'reasoning' 中明确说明你选择了哪些参数，以及为什么它们符合目标难度和策略约束。
2. **自我验证**：确保所选参数能构成有效的数学情境（如判别式 >= 0，定义域 > 0）。
3. **题目生成**：基于这些参数创建一道两问的题目（第一问：基础，第二问：进阶/讨论）。
4. **解析编写**：提供分步解答，使用清晰的 LaTeX 格式。${weaponId ? '\n5. **杀手锏体现**：确保解析中显式体现「' + weaponName + '」的应用步骤。' : ''}
6. **输出**：立即生成 JSON 对象。`
}
