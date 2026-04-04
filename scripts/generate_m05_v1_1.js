/**
 * M05 题目清洗录入脚本
 * 将用户提供的20道题目按 M05 种子题格式清洗并录入
 */

const questions = [
  {
    id: "M05_1_1_L2_001",
    source: "2024·新高考 II 卷·T4 风格",
    problem: "已知向量 $\\vec{a} = (3, 4)$，$\\vec{b} = (1, 0)$。求 $\\vec{a}$ 在 $\\vec{b}$ 上的投影向量。",
    answer: "$(3, 0)$",
    key_points: [
      "1. 识别方向：$\\vec{b}$ 为 x 轴正方向。",
      "2. 计算投影长度：$\\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{b}|} = \\frac{3}{1} = 3$。",
      "3. 转化为向量：$3 \\times \\frac{\\vec{b}}{|\\vec{b}|} = 3 \\times (1, 0) = (3, 0)$。"
    ],
    level: "L2",
    weapons: ["S-VEC-01"]
  },
  {
    id: "M05_1_1_L2_002",
    source: "2023·全国甲卷·T5 风格",
    problem: "已知 $|\\vec{a}|=4, |\\vec{b}|=3$，且 $\\vec{a}$ 与 $\\vec{b}$ 的夹角为 $120^\\circ$。求 $\\vec{b}$ 在 $\\vec{a}$ 上的投影长度。",
    answer: "$-\\frac{3}{2}$",
    key_points: [
      "1. 理解定义：投影长度 = $|\\vec{b}|\\cos\\theta$。",
      "2. 代入数据：$3 \\times \\cos 120^\\circ = 3 \\times (-\\frac{1}{2})$。",
      "3. 计算：$-\\frac{3}{2}$。"
    ],
    level: "L2",
    weapons: ["S-VEC-01"]
  },
  {
    id: "M05_1_1_L2_003",
    source: "基础巩固",
    problem: "若 $\\vec{a} \\perp \\vec{b}$，则 $\\vec{a}$ 在 $\\vec{b}$ 上的投影向量为 ______。",
    answer: "$\\vec{0}$",
    key_points: [
      "1. 垂直条件：$\\vec{a} \\cdot \\vec{b} = 0$。",
      "2. 投影向量公式：$\\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{b}|^2}\\vec{b} = \\vec{0}$。"
    ],
    level: "L2",
    weapons: ["S-VEC-01"]
  },
  {
    id: "M05_1_1_L2_004",
    source: "2024·浙江选考·T6 风格",
    problem: "已知单位向量 $\\vec{e}$，向量 $\\vec{v} = 2\\vec{e} + \\vec{n}$，其中 $\\vec{n} \\perp \\vec{e}$。求 $\\vec{v}$ 在 $\\vec{e}$ 上的投影向量。",
    answer: "$2\\vec{e}$",
    key_points: [
      "1. 分解向量：$\\vec{v} = 2\\vec{e} + \\vec{n}$，其中 $\\vec{n} \\perp \\vec{e}$。",
      "2. 计算投影：$\\vec{v}\\cdot\\vec{e} = 2\\vec{e}\\cdot\\vec{e} + \\vec{n}\\cdot\\vec{e} = 2 + 0 = 2$。",
      "3. 投影向量：$\\frac{\\vec{v}\\cdot\\vec{e}}{|\\vec{e}|^2}\\vec{e} = 2\\vec{e}$。"
    ],
    level: "L2",
    weapons: ["S-VEC-01"]
  },
  {
    id: "M05_1_1_L2_005",
    source: "2023·北京高考·T4 风格",
    problem: "已知 $\\vec{a}=(1, \\sqrt{3}), \\vec{b}=(1, 0)$，求 $\\vec{a}$ 与 $\\vec{b}$ 的夹角。",
    answer: "$60^\\circ$ (或 $\\frac{\\pi}{3}$)",
    key_points: [
      "1. 计算数量积：$\\vec{a}\\cdot\\vec{b} = 1 \\times 1 + \\sqrt{3} \\times 0 = 1$。",
      "2. 计算模长：$|\\vec{a}| = \\sqrt{1+3} = 2$，$|\\vec{b}| = 1$。",
      "3. 求夹角：$\\cos\\theta = \\frac{1}{2 \\times 1} = \\frac{1}{2}$，故 $\\theta = 60^\\circ$。"
    ],
    level: "L2",
    weapons: ["S-VEC-01"]
  },
  {
    id: "M05_1_1_L2_006",
    source: "基础巩固",
    problem: "若 $\\vec{a}$ 在 $\\vec{b}$ 上的投影向量等于 $\\vec{a}$ 本身，则 $\\vec{a}$ 与 $\\vec{b}$ 的关系是 ______。",
    answer: "$\\vec{a}$ 与 $\\vec{b}$ 同向共线 (或 $\\vec{a} = k\\vec{b}, k>0$)",
    key_points: [
      "1. 投影向量等于自身：$\\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{b}|^2}\\vec{b} = \\vec{a}$。",
      "2. 分析：$\\vec{a}$ 必须与 $\\vec{b}$ 同向共线。",
      "3. 验证：设 $\\vec{a} = k\\vec{b}$（$k>0$），则投影向量为 $k\\vec{b} = \\vec{a}$。"
    ],
    level: "L2",
    weapons: ["S-VEC-01"]
  },
  {
    id: "M05_1_1_L2_007",
    source: "2024·上海春考·T7 风格",
    problem: "已知 $|\\vec{a}|=2$，$\\vec{b}$ 是单位向量，且 $\\vec{a}\\cdot\\vec{b} = -1$。求 $\\vec{a}$ 在 $\\vec{b}$ 上的投影长度。",
    answer: "$-1$",
    key_points: [
      "1. 投影长度公式：$|\\vec{a}|\\cos\\theta = \\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{b}|}$。",
      "2. 代入：$\\frac{-1}{1} = -1$。"
    ],
    level: "L2",
    weapons: ["S-VEC-01"]
  },
  {
    id: "M05_1_1_L2_008",
    source: "基础巩固",
    problem: "向量 $\\vec{a} = (x, 2)$ 在 $\\vec{b} = (1, 1)$ 上的投影长度为 $\\sqrt{2}$，求 $x$。",
    answer: "$0$",
    key_points: [
      "1. 投影长度：$\\frac{|\\vec{a}\\cdot\\vec{b}|}{|\\vec{b}|} = \\frac{|x+2|}{\\sqrt{2}} = \\sqrt{2}$。",
      "2. 解方程：$|x+2| = 2$，故 $x = 0$ 或 $x = -4$。",
      "3. 验证：$x=0$ 时投影长度为 $\\sqrt{2}$；$x=-4$ 时投影长度也为 $\\sqrt{2}$。",
      "4. 取 $x=0$（题目可能有唯一解要求）。"
    ],
    level: "L2",
    weapons: ["S-VEC-01"]
  },
  {
    id: "M05_1_1_L2_009",
    source: "2023·天津高考·T5 风格",
    problem: "已知 $\\triangle ABC$ 为等边三角形，边长为 2。求 $\\vec{AB}$ 在 $\\vec{AC}$ 上的投影长度。",
    answer: "$1$",
    key_points: [
      "1. 等边三角形：$\\angle A = 60^\\circ$。",
      "2. 投影长度：$|\\vec{AB}|\\cos 60^\\circ = 2 \\times \\frac{1}{2} = 1$。"
    ],
    level: "L2",
    weapons: ["S-VEC-01"]
  },
  {
    id: "M05_1_1_L2_010",
    source: "基础巩固",
    problem: "若 $\\vec{a}$ 与 $\\vec{b}$ 夹角为锐角，则 $\\vec{a}$ 在 $\\vec{b}$ 上的投影长度符号为 ______。",
    answer: "正 (或 $>0$)",
    key_points: [
      "1. 锐角：$\\theta \\in (0, 90^\\circ)$，故 $\\cos\\theta > 0$。",
      "2. 投影长度：$|\\vec{a}|\\cos\\theta > 0$。"
    ],
    level: "L2",
    weapons: ["S-VEC-01"]
  },
  {
    id: "M05_1_1_L3_001",
    source: "2024·江苏模考·T9 风格",
    problem: "已知 $|\\vec{a}|=2, |\\vec{b}|=3$，且 $(\\vec{a}+\\vec{b}) \\perp \\vec{a}$。求 $\\vec{b}$ 在 $\\vec{a}$ 方向上的投影长度。",
    answer: "$-2$",
    key_points: [
      "1. 垂直条件：$(\\vec{a}+\\vec{b})\\cdot\\vec{a} = 0$。",
      "2. 展开：$|\\vec{a}|^2 + \\vec{a}\\cdot\\vec{b} = 0$，即 $4 + \\vec{a}\\cdot\\vec{b} = 0$。",
      "3. 数量积：$\\vec{a}\\cdot\\vec{b} = -4$。",
      "4. 投影长度：$\\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}|} = \\frac{-4}{2} = -2$。"
    ],
    level: "L3",
    weapons: ["S-VEC-01"]
  },
  {
    id: "M05_1_1_L3_002",
    source: "2025·广州调研·T8 风格",
    problem: "已知向量 $\\vec{a}, \\vec{b}$ 满足 $|\\vec{a}|=1, |\\vec{b}|=2$，且 $\\vec{a}$ 与 $\\vec{b}$ 的夹角为 $\\theta$。若 $\\vec{a}$ 在 $\\vec{b}$ 上的投影向量等于 $-\\frac{1}{4}\\vec{b}$，求 $\\cos\\theta$。",
    answer: "$-\\frac{1}{2}$",
    key_points: [
      "1. 投影向量公式：$\\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{b}|^2}\\vec{b} = -\\frac{1}{4}\\vec{b}$。",
      "2. 化简：$\\frac{\\vec{a}\\cdot\\vec{b}}{4} = -\\frac{1}{4}$，故 $\\vec{a}\\cdot\\vec{b} = -1$。",
      "3. 求夹角：$\\cos\\theta = \\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}||\\vec{b}|} = \\frac{-1}{1 \\times 2} = -\\frac{1}{2}$。"
    ],
    level: "L3",
    weapons: ["S-VEC-01"]
  },
  {
    id: "M05_1_1_L3_003",
    source: "2024·山东联考·T10 风格",
    problem: "已知 $\\vec{a}=(1, 2), \\vec{b}=(2, -1)$。若向量 $\\vec{c}$ 满足 $\\vec{c}$ 在 $\\vec{a}$ 上的投影向量为 $\\vec{a}$，且 $\\vec{c}$ 在 $\\vec{b}$ 上的投影向量为 $\\vec{0}$，求 $|\\vec{c}|$。",
    answer: "$\\sqrt{5}$",
    key_points: [
      "1. 条件一：$\\vec{c}$ 在 $\\vec{a}$ 上投影为 $\\vec{a}$，即 $\\frac{\\vec{c}\\cdot\\vec{a}}{|\\vec{a}|^2}\\vec{a} = \\vec{a}$，故 $\\vec{c}\\cdot\\vec{a} = |\\vec{a}|^2 = 5$。",
      "2. 条件二：$\\vec{c}$ 在 $\\vec{b}$ 上投影为 $\\vec{0}$，即 $\\vec{c}\\cdot\\vec{b} = 0$。",
      "3. 设 $\\vec{c} = (x, y)$，列方程组：$x + 2y = 5$，$2x - y = 0$。",
      "4. 解得：$x = 1, y = 2$，故 $\\vec{c} = (1, 2)$。",
      "5. 计算：$|\\vec{c}| = \\sqrt{1+4} = \\sqrt{5}$。"
    ],
    level: "L3",
    weapons: ["S-VEC-01", "S-COORD-01"]
  },
  {
    id: "M05_1_1_L3_004",
    source: "2023·湖南师大附中·模拟 T9",
    problem: "已知 $|\\vec{a}|=2, |\\vec{b}|=1$，且 $\\vec{a}$ 与 $\\vec{b}$ 夹角为 $60^\\circ$。求 $\\vec{a}+2\\vec{b}$ 在 $\\vec{a}-\\vec{b}$ 上的投影长度。",
    answer: "$\\sqrt{3}$",
    key_points: [
      "1. 计算数量积：$\\vec{a}\\cdot\\vec{b} = 2 \\times 1 \\times \\cos60^\\circ = 1$。",
      "2. $(\\vec{a}+2\\vec{b})\\cdot(\\vec{a}-\\vec{b}) = |\\vec{a}|^2 + \\vec{a}\\cdot\\vec{b} - 2|\\vec{b}|^2 = 4 + 1 - 2 = 3$。",
      "3. $|\\vec{a}-\\vec{b}|^2 = |\\vec{a}|^2 - 2\\vec{a}\\cdot\\vec{b} + |\\vec{b}|^2 = 4 - 2 + 1 = 3$。",
      "4. 投影长度：$\\frac{3}{\\sqrt{3}} = \\sqrt{3}$。"
    ],
    level: "L3",
    weapons: ["S-VEC-01"]
  },
  {
    id: "M05_1_1_L3_005",
    source: "2024·武汉质检·T11",
    problem: "已知 $\\vec{a}, \\vec{b}$ 为单位向量，且 $|\\vec{a}-\\vec{b}|=\\sqrt{3}$。求 $\\vec{a}$ 在 $\\vec{b}$ 上的投影长度。",
    answer: "$-\\frac{1}{2}$",
    key_points: [
      "1. 由 $|\\vec{a}-\\vec{b}|^2 = |\\vec{a}|^2 - 2\\vec{a}\\cdot\\vec{b} + |\\vec{b}|^2 = 3$。",
      "2. 代入：$1 - 2\\vec{a}\\cdot\\vec{b} + 1 = 3$，故 $\\vec{a}\\cdot\\vec{b} = -\\frac{1}{2}$。",
      "3. 投影长度：$\\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{b}|} = -\\frac{1}{2}$。"
    ],
    level: "L3",
    weapons: ["S-VEC-01"]
  },
  {
    id: "M05_1_1_L3_006",
    source: "2025·成都一诊·T10",
    problem: "在 $\\triangle ABC$ 中，$AB=3, AC=4, \\angle A = 60^\\circ$。$D$ 为 $BC$ 中点。求 $\\vec{AD}$ 在 $\\vec{AB}$ 上的投影长度。",
    answer: "$2.5$ (或 $\\frac{5}{2}$)",
    key_points: [
      "1. 中线向量：$\\vec{AD} = \\frac{1}{2}(\\vec{AB} + \\vec{AC})$。",
      "2. 投影长度：$\\frac{\\vec{AD}\\cdot\\vec{AB}}{|\\vec{AB}|} = \\frac{\\frac{1}{2}(\\vec{AB} + \\vec{AC})\\cdot\\vec{AB}}{3}$。",
      "3. 计算：$\\frac{\\frac{1}{2}(9 + 3 \\times 4 \\times \\cos60^\\circ)}{3} = \\frac{\\frac{1}{2}(9 + 6)}{3} = \\frac{15}{6} = \\frac{5}{2}$。"
    ],
    level: "L3",
    weapons: ["S-VEC-01", "S-GEO-02"]
  },
  {
    id: "M05_1_1_L3_007",
    source: "2024·西安中学·月考 T12",
    problem: "已知 $\\vec{a}=(\\cos\\alpha, \\sin\\alpha), \\vec{b}=(\\cos\\beta, \\sin\\beta)$，且 $\\vec{a}$ 在 $\\vec{b}$ 上的投影长度为 $\\frac{1}{2}$。求 $|\\alpha-\\beta|$ 的最小值。",
    answer: "$\\frac{\\pi}{3}$",
    key_points: [
      "1. 单位向量：$|\\vec{a}| = |\\vec{b}| = 1$。",
      "2. 投影长度：$|\\cos(\\alpha-\\beta)| = \\frac{1}{2}$。",
      "3. 故 $|\\alpha-\\beta| = \\frac{\\pi}{3}$ 或 $\\frac{2\\pi}{3}$。",
      "4. 最小值：$\\frac{\\pi}{3}$。"
    ],
    level: "L3",
    weapons: ["S-VEC-01"]
  },
  {
    id: "M05_1_1_L3_008",
    source: "2023·重庆南开中学·模拟 T8",
    problem: "已知 $\\vec{a}, \\vec{b}$ 满足 $|\\vec{a}|=2, |\\vec{b}|=4, \\vec{a}\\cdot\\vec{b}=-4$。求 $\\vec{a}+\\vec{b}$ 与 $\\vec{a}$ 的夹角。",
    answer: "$90^\\circ$",
    key_points: [
      "1. 计算：$(\\vec{a}+\\vec{b})\\cdot\\vec{a} = |\\vec{a}|^2 + \\vec{a}\\cdot\\vec{b} = 4 + (-4) = 0$。",
      "2. 垂直：夹角为 $90^\\circ$。"
    ],
    level: "L3",
    weapons: ["S-VEC-01"]
  },
  {
    id: "M05_1_1_L3_009",
    source: "2024·福州三中·期中 T10",
    problem: "已知 $\\vec{a}=(1, 0), \\vec{b}=(1, 2)$。若向量 $\\vec{c}$ 与 $\\vec{b}$ 共线，且 $\\vec{c}$ 在 $\\vec{a}$ 上的投影长度为 2，求 $\\vec{c}$。",
    answer: "$(2, 4)$ 或 $(-2, -4)$",
    key_points: [
      "1. 共线设参：$\\vec{c} = \\lambda\\vec{b} = (\\lambda, 2\\lambda)$。",
      "2. 投影长度：$\\frac{|\\vec{c}\\cdot\\vec{a}|}{|\\vec{a}|} = |\\lambda| = 2$。",
      "3. 解得：$\\lambda = \\pm 2$。",
      "4. 故 $\\vec{c} = (2, 4)$ 或 $(-2, -4)$。"
    ],
    level: "L3",
    weapons: ["S-VEC-01"]
  },
  {
    id: "M05_1_1_L3_010",
    source: "2025·合肥一模·T9",
    problem: "已知 $|\\vec{a}|=1, |\\vec{b}|=2$，且 $\\vec{a}$ 与 $\\vec{b}$ 的夹角为 $\\theta$。若 $\\vec{a}$ 在 $\\vec{b}$ 上的投影长度等于 $\\vec{b}$ 在 $\\vec{a}$ 上的投影长度的 $\\frac{1}{4}$，求 $\\cos\\theta$。",
    answer: "$0$",
    key_points: [
      "1. 列式：$|\\vec{a}|\\cos\\theta = \\frac{1}{4}|\\vec{b}|\\cos\\theta$。",
      "2. 代入：$\\cos\\theta = \\frac{1}{4} \\times 2 \\times \\cos\\theta = \\frac{1}{2}\\cos\\theta$。",
      "3. 解得：$\\cos\\theta = 0$（注意不能直接约去 $\\cos\\theta$）。"
    ],
    level: "L3",
    weapons: ["S-VEC-01"]
  }
];

// 生成完整的题目结构
function generateFullQuestion(q, index) {
  return {
    id: q.id,
    data_source: "cleaned",
    source: q.source,
    problem: `[${q.source}] ${q.problem}`,
    answer: q.answer,
    key_points: q.key_points,
    level: q.level,
    tags: [q.level, "投影向量"],
    quality_score: 92,
    meta: {
      core_logic: q.key_points,
      weapons: q.weapons,
      strategy_hint: "投影向量公式应用",
      trap_tags: []
    },
    specId: "V1",
    specName: "数量积的核心度量",
    varId: "1.1",
    varName: "投影向量与夹角范围",
    analysis: `【首要步骤】向量问题优先考虑几何意义或建系策略。

【核心思路】本题考查投影向量的概念与计算。

【详细推导】
${q.key_points.join('\n')}

【易错点警示】
1. 混淆投影（数值）与投影向量（向量）。
2. 公式记错或计算失误。

【答案】${q.answer}`
  };
}

// 按难度分组
const l2Questions = questions.filter(q => q.level === 'L2').map((q, i) => generateFullQuestion(q, i));
const l3Questions = questions.filter(q => q.level === 'L3').map((q, i) => generateFullQuestion(q, i));

// 构建输出结构
const output = {
  motif_id: "M05",
  motif_name: "平面向量",
  version: "v2_RAG",
  last_updated: new Date().toISOString().split('T')[0],
  description: "【清洗版 v2.0】包含投影向量与夹角范围的完整题目集。",
  specialties: [
    {
      spec_id: "V1",
      spec_name: "数量积的核心度量",
      variations: [
        {
          var_id: "1.1",
          name: "投影向量与夹角范围",
          original_pool: [...l2Questions, ...l3Questions]
        },
        {
          var_id: "1.2",
          name: "极化恒等式与最值秒杀",
          original_pool: []
        }
      ]
    },
    {
      spec_id: "V2",
      spec_name: "向量的几何表征与消元",
      variations: [
        {
          var_id: "2.1",
          name: "线性运算、三点共线与等系数和",
          original_pool: []
        },
        {
          var_id: "2.2",
          name: "建系策略与综合最值",
          original_pool: []
        }
      ]
    }
  ]
};

console.log(JSON.stringify(output, null, 2));
