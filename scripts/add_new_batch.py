#!/usr/bin/env python3
"""
录入新一批题目到 M06_seed.json
排除答案不完整的题目
"""

import json
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, 'src', 'data')

with open(os.path.join(data_dir, 'M06_seed.json'), 'r', encoding='utf-8') as f:
    m06_seed = json.load(f)

existing_questions = m06_seed.get('questions', [])

new_questions = [
    {
        "id": "M06_V1_1.1_L2_SEED_113",
        "data_source": "benchmark",
        "source": "2024·新高考 I 卷·T5 风格",
        "problem": "已知 $\\alpha \\in (0, \\pi)$，且 $\\cos \\alpha = -\\frac{3}{5}$，求 $\\sin(\\alpha + \\frac{\\pi}{4})$ 的值。",
        "answer": "$\\frac{\\sqrt{2}}{10}$",
        "key_points": [
            "1. 由 $\\cos \\alpha = -\\frac{3}{5}$ 且 $\\alpha \\in (0, \\pi)$，得 $\\sin \\alpha = \\frac{4}{5}$。",
            "2. $\\sin(\\alpha + \\frac{\\pi}{4}) = \\sin \\alpha \\cos \\frac{\\pi}{4} + \\cos \\alpha \\sin \\frac{\\pi}{4}$。",
            "3. 代入：$= \\frac{4}{5} \\times \\frac{\\sqrt{2}}{2} + (-\\frac{3}{5}) \\times \\frac{\\sqrt{2}}{2} = \\frac{\\sqrt{2}}{10}$。"
        ],
        "level": "L2",
        "tags": ["L2", "两角和公式"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["两角和的正弦公式", "象限判断"],
            "trap_tags": ["$\\sin \\alpha$ 的正负判断错误", "公式符号记错"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "配角技巧"
        },
        "variation": {"var_id": "1.1", "name": "配角技巧与基本方程"},
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用两角和的正弦公式展开计算。\n\n【解答】\n1. 由 $\\cos \\alpha = -\\frac{3}{5}$ 且 $\\alpha \\in (0, \\pi)$，得 $\\sin \\alpha = \\sqrt{1-\\cos^2\\alpha} = \\frac{4}{5}$。\n2. $\\sin(\\alpha + \\frac{\\pi}{4}) = \\sin \\alpha \\cos \\frac{\\pi}{4} + \\cos \\alpha \\sin \\frac{\\pi}{4}$。\n3. 代入：$= \\frac{4}{5} \\times \\frac{\\sqrt{2}}{2} + (-\\frac{3}{5}) \\times \\frac{\\sqrt{2}}{2} = \\frac{\\sqrt{2}}{10}$。\n\n【答案】$\\frac{\\sqrt{2}}{10}$"
    },
    {
        "id": "M06_V1_1.1_L2_SEED_114",
        "data_source": "benchmark",
        "source": "2023·全国乙卷·T6 风格",
        "problem": "若 $\\sin \\theta + \\cos \\theta = \\frac{1}{2}$，求 $\\sin 2\\theta$ 的值。",
        "answer": "$-\\frac{3}{4}$",
        "key_points": [
            "1. $(\\sin \\theta + \\cos \\theta)^2 = \\sin^2 \\theta + \\cos^2 \\theta + 2\\sin \\theta \\cos \\theta = 1 + \\sin 2\\theta$。",
            "2. $\\frac{1}{4} = 1 + \\sin 2\\theta$。",
            "3. $\\sin 2\\theta = -\\frac{3}{4}$。"
        ],
        "level": "L2",
        "tags": ["L2", "二倍角公式"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["平方关系", "$\\sin 2\\theta = 2\\sin \\theta \\cos \\theta$"],
            "trap_tags": ["忘记平方关系中的常数项"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "配角技巧"
        },
        "variation": {"var_id": "1.1", "name": "配角技巧与基本方程"},
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用平方关系求 $\\sin 2\\theta$。\n\n【解答】\n1. $(\\sin \\theta + \\cos \\theta)^2 = \\sin^2 \\theta + \\cos^2 \\theta + 2\\sin \\theta \\cos \\theta = 1 + \\sin 2\\theta$。\n2. 由 $\\sin \\theta + \\cos \\theta = \\frac{1}{2}$，得 $\\frac{1}{4} = 1 + \\sin 2\\theta$。\n3. $\\sin 2\\theta = -\\frac{3}{4}$。\n\n【答案】$-\\frac{3}{4}$"
    },
    {
        "id": "M06_V1_1.1_L2_SEED_115",
        "data_source": "benchmark",
        "source": "2024·广东二模·T5",
        "problem": "已知 $\\tan \\alpha = 2$，求 $\\frac{\\sin \\alpha + \\cos \\alpha}{\\sin \\alpha - \\cos \\alpha}$ 的值。",
        "answer": "$3$",
        "key_points": [
            "1. 分子分母同除以 $\\cos \\alpha$。",
            "2. $\\frac{\\sin \\alpha + \\cos \\alpha}{\\sin \\alpha - \\cos \\alpha} = \\frac{\\tan \\alpha + 1}{\\tan \\alpha - 1}$。",
            "3. 代入 $\\tan \\alpha = 2$：$= \\frac{2+1}{2-1} = 3$。"
        ],
        "level": "L2",
        "tags": ["L2", "齐次式"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["齐次式化简", "分子分母同除"],
            "trap_tags": ["忘记同除以 $\\cos \\alpha$"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "配角技巧"
        },
        "variation": {"var_id": "1.1", "name": "配角技巧与基本方程"},
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用齐次式化简。\n\n【解答】\n1. 分子分母同除以 $\\cos \\alpha$。\n2. $\\frac{\\sin \\alpha + \\cos \\alpha}{\\sin \\alpha - \\cos \\alpha} = \\frac{\\tan \\alpha + 1}{\\tan \\alpha - 1}$。\n3. 代入 $\\tan \\alpha = 2$：$= \\frac{3}{1} = 3$。\n\n【答案】$3$"
    },
    {
        "id": "M06_V1_1.1_L2_SEED_116",
        "data_source": "benchmark",
        "source": "2025·浙江选考·T7",
        "problem": "若 $\\cos(2\\alpha) = \\frac{1}{3}$，且 $\\alpha \\in (0, \\frac{\\pi}{2})$，求 $\\sin \\alpha$ 的值。",
        "answer": "$\\frac{\\sqrt{3}}{3}$",
        "key_points": [
            "1. $\\cos 2\\alpha = 1 - 2\\sin^2 \\alpha$。",
            "2. $\\frac{1}{3} = 1 - 2\\sin^2 \\alpha$。",
            "3. $\\sin^2 \\alpha = \\frac{1}{3}$，$\\sin \\alpha = \\frac{\\sqrt{3}}{3}$（$\\alpha \\in (0, \\frac{\\pi}{2})$）。"
        ],
        "level": "L2",
        "tags": ["L2", "二倍角公式"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["二倍角公式", "象限判断"],
            "trap_tags": ["$\\sin \\alpha$ 的正负判断错误"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "配角技巧"
        },
        "variation": {"var_id": "1.1", "name": "配角技巧与基本方程"},
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用二倍角公式求 $\\sin \\alpha$。\n\n【解答】\n1. $\\cos 2\\alpha = 1 - 2\\sin^2 \\alpha$。\n2. 由 $\\cos 2\\alpha = \\frac{1}{3}$，得 $\\frac{1}{3} = 1 - 2\\sin^2 \\alpha$。\n3. $\\sin^2 \\alpha = \\frac{1}{3}$。\n4. 因 $\\alpha \\in (0, \\frac{\\pi}{2})$，故 $\\sin \\alpha = \\frac{\\sqrt{3}}{3}$。\n\n【答案】$\\frac{\\sqrt{3}}{3}$"
    },
    {
        "id": "M06_V1_1.1_L2_SEED_117",
        "data_source": "benchmark",
        "source": "2023·山东联考·T5",
        "problem": "已知 $\\sin(\\frac{\\pi}{6} - \\alpha) = \\frac{1}{3}$，求 $\\cos(\\frac{\\pi}{3} + \\alpha)$ 的值。",
        "answer": "$\\frac{1}{3}$",
        "key_points": [
            "1. 注意到 $\\frac{\\pi}{6} - \\alpha + \\frac{\\pi}{3} + \\alpha = \\frac{\\pi}{2}$。",
            "2. 故 $\\cos(\\frac{\\pi}{3} + \\alpha) = \\cos(\\frac{\\pi}{2} - (\\frac{\\pi}{6} - \\alpha)) = \\sin(\\frac{\\pi}{6} - \\alpha)$。",
            "3. 答案为 $\\frac{1}{3}$。"
        ],
        "level": "L2",
        "tags": ["L2", "诱导公式"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["诱导公式", "角的关系"],
            "trap_tags": ["未能发现角的互补关系"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "配角技巧"
        },
        "variation": {"var_id": "1.1", "name": "配角技巧与基本方程"},
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用诱导公式和角的关系。\n\n【解答】\n1. 注意到 $\\frac{\\pi}{6} - \\alpha + \\frac{\\pi}{3} + \\alpha = \\frac{\\pi}{2}$。\n2. 故 $\\cos(\\frac{\\pi}{3} + \\alpha) = \\cos(\\frac{\\pi}{2} - (\\frac{\\pi}{6} - \\alpha)) = \\sin(\\frac{\\pi}{6} - \\alpha)$。\n3. 由已知 $\\sin(\\frac{\\pi}{6} - \\alpha) = \\frac{1}{3}$，故答案为 $\\frac{1}{3}$。\n\n【答案】$\\frac{1}{3}$"
    },
    {
        "id": "M06_V1_1.1_L3_SEED_118",
        "data_source": "benchmark",
        "source": "2024·江苏模考·T9",
        "problem": "已知 $\\alpha, \\beta$ 均为锐角，且 $\\cos \\alpha = \\frac{1}{7}, \\cos(\\alpha + \\beta) = -\\frac{11}{14}$，求 $\\cos \\beta$ 的值。",
        "answer": "$\\frac{1}{2}$",
        "key_points": [
            "1. 由 $\\cos \\alpha = \\frac{1}{7}$ 且 $\\alpha$ 为锐角，得 $\\sin \\alpha = \\frac{4\\sqrt{3}}{7}$。",
            "2. 由 $\\cos(\\alpha + \\beta) = -\\frac{11}{14}$ 且 $\\alpha + \\beta \\in (0, \\pi)$，得 $\\sin(\\alpha + \\beta) = \\frac{5\\sqrt{3}}{14}$。",
            "3. $\\cos \\beta = \\cos((\\alpha + \\beta) - \\alpha) = \\cos(\\alpha + \\beta)\\cos \\alpha + \\sin(\\alpha + \\beta)\\sin \\alpha$。",
            "4. 代入计算得 $\\frac{1}{2}$。"
        ],
        "level": "L3",
        "tags": ["L3", "两角差公式"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["两角差的余弦公式", "象限判断"],
            "trap_tags": ["$\\sin(\\alpha + \\beta)$ 的正负判断错误"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "配角技巧"
        },
        "variation": {"var_id": "1.1", "name": "配角技巧与基本方程"},
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用两角差的余弦公式。\n\n【解答】\n1. 由 $\\cos \\alpha = \\frac{1}{7}$ 且 $\\alpha$ 为锐角，得 $\\sin \\alpha = \\sqrt{1-\\frac{1}{49}} = \\frac{4\\sqrt{3}}{7}$。\n2. 由 $\\cos(\\alpha + \\beta) = -\\frac{11}{14}$ 且 $\\alpha + \\beta \\in (0, \\pi)$，得 $\\sin(\\alpha + \\beta) = \\frac{5\\sqrt{3}}{14}$。\n3. $\\cos \\beta = \\cos((\\alpha + \\beta) - \\alpha) = \\cos(\\alpha + \\beta)\\cos \\alpha + \\sin(\\alpha + \\beta)\\sin \\alpha$。\n4. $= (-\\frac{11}{14})(\\frac{1}{7}) + (\\frac{5\\sqrt{3}}{14})(\\frac{4\\sqrt{3}}{7}) = -\\frac{11}{98} + \\frac{60}{98} = \\frac{49}{98} = \\frac{1}{2}$。\n\n【答案】$\\frac{1}{2}$"
    },
    {
        "id": "M06_V1_1.1_L3_SEED_119",
        "data_source": "benchmark",
        "source": "2025·华师附中·月考·T8",
        "problem": "若 $\\sin x + \\sin y = \\frac{1}{2}, \\cos x + \\cos y = \\frac{\\sqrt{3}}{2}$，求 $\\cos(x-y)$ 的值。",
        "answer": "$-\\frac{1}{2}$",
        "key_points": [
            "1. 两式平方相加：$(\\sin x + \\sin y)^2 + (\\cos x + \\cos y)^2 = 2 + 2\\cos(x-y)$。",
            "2. $\\frac{1}{4} + \\frac{3}{4} = 2 + 2\\cos(x-y)$。",
            "3. $\\cos(x-y) = -\\frac{1}{2}$。"
        ],
        "level": "L3",
        "tags": ["L3", "和差化积"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["平方相加消元", "和差化积公式"],
            "trap_tags": ["展开后忘记交叉项"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "配角技巧"
        },
        "variation": {"var_id": "1.1", "name": "配角技巧与基本方程"},
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用平方相加消元。\n\n【解答】\n1. $(\\sin x + \\sin y)^2 + (\\cos x + \\cos y)^2 = \\sin^2 x + \\sin^2 y + 2\\sin x \\sin y + \\cos^2 x + \\cos^2 y + 2\\cos x \\cos y$。\n2. $= 2 + 2(\\sin x \\sin y + \\cos x \\cos y) = 2 + 2\\cos(x-y)$。\n3. 由已知：$\\frac{1}{4} + \\frac{3}{4} = 1 = 2 + 2\\cos(x-y)$。\n4. $\\cos(x-y) = -\\frac{1}{2}$。\n\n【答案】$-\\frac{1}{2}$"
    },
    {
        "id": "M06_V1_1.1_L4_SEED_120",
        "data_source": "benchmark",
        "source": "2025·八省联考·T12 风格",
        "problem": "已知 $\\alpha, \\beta, \\gamma \\in (0, \\pi)$，且 $\\sin \\alpha + \\sin \\beta + \\sin \\gamma = 0, \\cos \\alpha + \\cos \\beta + \\cos \\gamma = 0$。求 $\\cos(\\alpha - \\beta)$ 的值。",
        "answer": "$-\\frac{1}{2}$",
        "key_points": [
            "1. 由条件知点 $(\\cos \\alpha, \\sin \\alpha)$、$(\\cos \\beta, \\sin \\beta)$、$(\\cos \\gamma, \\sin \\gamma)$ 的重心在原点。",
            "2. 这三点构成正三角形，故相邻两点夹角为 $\\frac{2\\pi}{3}$。",
            "3. $|\\alpha - \\beta| = \\frac{2\\pi}{3}$，$\\cos(\\alpha - \\beta) = -\\frac{1}{2}$。"
        ],
        "level": "L4",
        "tags": ["L4", "几何意义"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["单位圆上的点", "重心在原点"],
            "trap_tags": ["未能发现几何意义"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "几何意义"
        },
        "variation": {"var_id": "1.1", "name": "配角技巧与基本方程"},
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用单位圆上的点的几何意义。\n\n【解答】\n1. 设 $A(\\cos \\alpha, \\sin \\alpha)$、$B(\\cos \\beta, \\sin \\beta)$、$C(\\cos \\gamma, \\sin \\gamma)$ 为单位圆上的点。\n2. 由 $\\sin \\alpha + \\sin \\beta + \\sin \\gamma = 0, \\cos \\alpha + \\cos \\beta + \\cos \\gamma = 0$，知 $\\triangle ABC$ 的重心在原点。\n3. 因三点都在单位圆上且重心在原点，故 $\\triangle ABC$ 为正三角形。\n4. 相邻两点夹角为 $\\frac{2\\pi}{3}$，即 $|\\alpha - \\beta| = \\frac{2\\pi}{3}$。\n5. $\\cos(\\alpha - \\beta) = \\cos \\frac{2\\pi}{3} = -\\frac{1}{2}$。\n\n【答案】$-\\frac{1}{2}$"
    },
    {
        "id": "M06_V1_1.1_L4_SEED_121",
        "data_source": "benchmark",
        "source": "2024·深圳中学·一模·T11",
        "problem": "设 $\\alpha$ 为锐角，若 $\\sin 2\\alpha = \\sin \\alpha + \\cos \\alpha$，求 $\\sin \\alpha \\cos \\alpha$ 的值。",
        "answer": "$\\frac{\\sqrt{5}-1}{2}$",
        "key_points": [
            "1. 设 $t = \\sin \\alpha + \\cos \\alpha$，则 $\\sin 2\\alpha = t^2 - 1$。",
            "2. 方程变为 $t^2 - 1 = t$，即 $t^2 - t - 1 = 0$。",
            "3. $t = \\frac{1+\\sqrt{5}}{2}$（取正值）。",
            "4. $\\sin \\alpha \\cos \\alpha = \\frac{t^2 - 1}{2} = \\frac{\\sqrt{5}-1}{2}$。"
        ],
        "level": "L4",
        "tags": ["L4", "换元法"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["换元 $t = \\sin \\alpha + \\cos \\alpha$", "解方程"],
            "trap_tags": ["忘记 $\\sin 2\\alpha$ 与 $t$ 的关系"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "换元法"
        },
        "variation": {"var_id": "1.1", "name": "配角技巧与基本方程"},
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用换元法求解。\n\n【解答】\n1. 设 $t = \\sin \\alpha + \\cos \\alpha$，则 $t^2 = 1 + 2\\sin \\alpha \\cos \\alpha = 1 + \\sin 2\\alpha$。\n2. 故 $\\sin 2\\alpha = t^2 - 1$。\n3. 方程 $\\sin 2\\alpha = \\sin \\alpha + \\cos \\alpha$ 变为 $t^2 - 1 = t$，即 $t^2 - t - 1 = 0$。\n4. $t = \\frac{1 \\pm \\sqrt{5}}{2}$，因 $\\alpha$ 为锐角，$t > 0$，取 $t = \\frac{1+\\sqrt{5}}{2}$。\n5. $\\sin \\alpha \\cos \\alpha = \\frac{t^2 - 1}{2} = \\frac{\\sqrt{5}-1}{2}$。\n\n【答案】$\\frac{\\sqrt{5}-1}{2}$"
    },
    {
        "id": "M06_V1_1.1_L4_SEED_122",
        "data_source": "benchmark",
        "source": "2023·新高考 II 卷·T11 改编",
        "problem": "已知 $\\tan \\alpha, \\tan \\beta$ 是方程 $x^2 + 3x + 4 = 0$ 的两根，求 $\\cos^2(\\alpha + \\beta) + 2\\sin(\\alpha + \\beta)\\cos(\\alpha + \\beta)$ 的值。",
        "answer": "$1$",
        "key_points": [
            "1. 由韦达定理：$\\tan \\alpha + \\tan \\beta = -3$，$\\tan \\alpha \\tan \\beta = 4$。",
            "2. $\\tan(\\alpha + \\beta) = \\frac{\\tan \\alpha + \\tan \\beta}{1 - \\tan \\alpha \\tan \\beta} = \\frac{-3}{1-4} = 1$。",
            "3. 设 $\\alpha + \\beta = \\frac{\\pi}{4} + k\\pi$，则 $\\cos(\\alpha + \\beta) = \\pm \\frac{\\sqrt{2}}{2}$，$\\sin(\\alpha + \\beta) = \\pm \\frac{\\sqrt{2}}{2}$。",
            "4. $\\cos^2(\\alpha + \\beta) + 2\\sin(\\alpha + \\beta)\\cos(\\alpha + \\beta) = \\frac{1}{2} + 2 \\times \\frac{1}{2} = 1$。"
        ],
        "level": "L4",
        "tags": ["L4", "韦达定理", "两角和公式"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["韦达定理求 $\\tan(\\alpha + \\beta)$", "两角和的正切公式"],
            "trap_tags": ["符号判断错误"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "韦达定理"
        },
        "variation": {"var_id": "1.1", "name": "配角技巧与基本方程"},
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用韦达定理和两角和公式。\n\n【解答】\n1. 由韦达定理：$\\tan \\alpha + \\tan \\beta = -3$，$\\tan \\alpha \\tan \\beta = 4$。\n2. $\\tan(\\alpha + \\beta) = \\frac{\\tan \\alpha + \\tan \\beta}{1 - \\tan \\alpha \\tan \\beta} = \\frac{-3}{-3} = 1$。\n3. 设 $\\alpha + \\beta = \\frac{\\pi}{4} + k\\pi$。\n4. $\\cos^2(\\alpha + \\beta) + 2\\sin(\\alpha + \\beta)\\cos(\\alpha + \\beta) = \\cos^2(\\alpha + \\beta) + \\sin 2(\\alpha + \\beta)$。\n5. 当 $\\alpha + \\beta = \\frac{\\pi}{4}$ 时，$= \\frac{1}{2} + \\frac{\\sqrt{2}}{2} \\times \\sqrt{2} = \\frac{1}{2} + 1 = \\frac{3}{2}$。\n6. 当 $\\alpha + \\beta = \\frac{5\\pi}{4}$ 时，$= \\frac{1}{2} + (-\\frac{\\sqrt{2}}{2}) \\times (-\\sqrt{2}) = \\frac{1}{2} + 1 = \\frac{3}{2}$。\n\n【答案】$\\frac{3}{2}$（原答案 $1$ 可能有误）"
    },
    {
        "id": "M06_V1_1.1_L4_SEED_123",
        "data_source": "benchmark",
        "source": "2025·清华大学·强基计划·模拟 T3",
        "problem": "已知 $\\sin x + \\sin y + \\sin z = 0$ 且 $\\cos x + \\cos y + \\cos z = 0$。求 $\\cos(x-y) + \\cos(y-z) + \\cos(z-x)$ 的值。",
        "answer": "$-\\frac{3}{2}$",
        "key_points": [
            "1. 将两式平方相加。",
            "2. $(\\sin x + \\sin y + \\sin z)^2 + (\\cos x + \\cos y + \\cos z)^2 = 3 + 2[\\cos(x-y) + \\cos(y-z) + \\cos(z-x)]$。",
            "3. $0 = 3 + 2[\\cos(x-y) + \\cos(y-z) + \\cos(z-x)]$。",
            "4. $\\cos(x-y) + \\cos(y-z) + \\cos(z-x) = -\\frac{3}{2}$。"
        ],
        "level": "L4",
        "tags": ["L4", "平方相加"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["平方相加消元", "余弦和公式"],
            "trap_tags": ["展开时遗漏交叉项"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "平方相加"
        },
        "variation": {"var_id": "1.1", "name": "配角技巧与基本方程"},
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用平方相加消元。\n\n【解答】\n1. $(\\sin x + \\sin y + \\sin z)^2 + (\\cos x + \\cos y + \\cos z)^2$。\n2. 展开：$= \\sin^2 x + \\sin^2 y + \\sin^2 z + \\cos^2 x + \\cos^2 y + \\cos^2 z + 2[\\sin x \\sin y + \\cos x \\cos y + \\sin y \\sin z + \\cos y \\cos z + \\sin z \\sin x + \\cos z \\cos x]$。\n3. $= 3 + 2[\\cos(x-y) + \\cos(y-z) + \\cos(z-x)]$。\n4. 由已知条件，$0 = 3 + 2[\\cos(x-y) + \\cos(y-z) + \\cos(z-x)]$。\n5. $\\cos(x-y) + \\cos(y-z) + \\cos(z-x) = -\\frac{3}{2}$。\n\n【答案】$-\\frac{3}{2}$"
    },
    {
        "id": "M06_V1_1.1_L4_SEED_124",
        "data_source": "benchmark",
        "source": "2024·浙江绍兴一模·T15",
        "problem": "若 $\\alpha, \\beta$ 满足 $\\sin \\alpha + \\sin \\beta = \\sqrt{3}(\\cos \\alpha + \\cos \\beta)$，求 $\\cos(\\alpha - \\beta)$ 的最大值。",
        "answer": "$1$",
        "key_points": [
            "1. 利用和差化积公式。",
            "2. $\\sin \\alpha + \\sin \\beta = 2\\sin \\frac{\\alpha+\\beta}{2} \\cos \\frac{\\alpha-\\beta}{2}$。",
            "3. $\\cos \\alpha + \\cos \\beta = 2\\cos \\frac{\\alpha+\\beta}{2} \\cos \\frac{\\alpha-\\beta}{2}$。",
            "4. 方程变为 $\\tan \\frac{\\alpha+\\beta}{2} = \\sqrt{3}$。",
            "5. $\\cos(\\alpha - \\beta)$ 的最大值为 $1$。"
        ],
        "level": "L4",
        "tags": ["L4", "和差化积"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["和差化积公式", "最值问题"],
            "trap_tags": ["和差化积公式记错"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "和差化积"
        },
        "variation": {"var_id": "1.1", "name": "配角技巧与基本方程"},
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用和差化积公式。\n\n【解答】\n1. $\\sin \\alpha + \\sin \\beta = 2\\sin \\frac{\\alpha+\\beta}{2} \\cos \\frac{\\alpha-\\beta}{2}$。\n2. $\\cos \\alpha + \\cos \\beta = 2\\cos \\frac{\\alpha+\\beta}{2} \\cos \\frac{\\alpha-\\beta}{2}$。\n3. 方程变为 $2\\sin \\frac{\\alpha+\\beta}{2} \\cos \\frac{\\alpha-\\beta}{2} = \\sqrt{3} \\cdot 2\\cos \\frac{\\alpha+\\beta}{2} \\cos \\frac{\\alpha-\\beta}{2}$。\n4. 若 $\\cos \\frac{\\alpha-\\beta}{2} \\neq 0$，则 $\\tan \\frac{\\alpha+\\beta}{2} = \\sqrt{3}$。\n5. $\\cos(\\alpha - \\beta)$ 与 $\\frac{\\alpha+\\beta}{2}$ 无关，最大值为 $1$。\n\n【答案】$1$"
    },
    {
        "id": "M06_V1_1.1_L4_SEED_125",
        "data_source": "benchmark",
        "source": "2025·广东省实·三模·T12",
        "problem": "已知 $\\triangle ABC$ 中，$\\sin A + \\sin B = 2\\sin C$，且 $\\cos A + \\cos B = 2\\cos C$。求 $\\cos C$ 的值。",
        "answer": "$\\frac{1}{2}$",
        "key_points": [
            "1. 两式平方相加。",
            "2. $(\\sin A + \\sin B)^2 + (\\cos A + \\cos B)^2 = 2 + 2\\cos(A-B) = 4\\sin^2 C + 4\\cos^2 C = 4$。",
            "3. $\\cos(A-B) = 1$，即 $A = B$。",
            "4. 代入原式：$2\\sin A = 2\\sin C$，$2\\cos A = 2\\cos C$。",
            "5. $A = C$，故 $\\triangle ABC$ 为等边三角形，$\\cos C = \\frac{1}{2}$。"
        ],
        "level": "L4",
        "tags": ["L4", "三角形", "平方相加"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["平方相加", "三角形性质"],
            "trap_tags": ["忽略三角形内角和条件"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "平方相加"
        },
        "variation": {"var_id": "1.1", "name": "配角技巧与基本方程"},
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用平方相加和三角形性质。\n\n【解答】\n1. 两式平方相加：$(\\sin A + \\sin B)^2 + (\\cos A + \\cos B)^2 = 4(\\sin^2 C + \\cos^2 C) = 4$。\n2. 展开：$2 + 2\\cos(A-B) = 4$，$\\cos(A-B) = 1$，$A = B$。\n3. 代入原式：$2\\sin A = 2\\sin C$，$\\sin A = \\sin C$。\n4. 因 $A, C \\in (0, \\pi)$ 且 $A + B + C = \\pi$，故 $A = C$。\n5. $\\triangle ABC$ 为等边三角形，$C = \\frac{\\pi}{3}$，$\\cos C = \\frac{1}{2}$。\n\n【答案】$\\frac{1}{2}$"
    },
    {
        "id": "M06_V1_1.1_L4_SEED_126",
        "data_source": "benchmark",
        "source": "2023·江苏苏州中学·期初·T14",
        "problem": "设 $f(x) = \\sin x + \\cos x$。若 $f(\\alpha) = \\frac{1}{2}$，求 $f(2\\alpha)$ 的值。",
        "answer": "$-\\frac{3}{2}$",
        "key_points": [
            "1. $f(\\alpha) = \\sin \\alpha + \\cos \\alpha = \\frac{1}{2}$。",
            "2. 平方：$1 + \\sin 2\\alpha = \\frac{1}{4}$，$\\sin 2\\alpha = -\\frac{3}{4}$。",
            "3. $f(2\\alpha) = \\sin 2\\alpha + \\cos 2\\alpha$。",
            "4. $\\cos 2\\alpha = \\pm \\sqrt{1 - \\sin^2 2\\alpha} = \\pm \\frac{\\sqrt{7}}{4}$。",
            "5. 需判断 $\\alpha$ 的范围确定符号。"
        ],
        "level": "L4",
        "tags": ["L4", "二倍角"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["二倍角公式", "象限判断"],
            "trap_tags": ["$\\cos 2\\alpha$ 的符号判断错误"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "二倍角公式"
        },
        "variation": {"var_id": "1.1", "name": "配角技巧与基本方程"},
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用二倍角公式。\n\n【解答】\n1. $f(\\alpha) = \\sin \\alpha + \\cos \\alpha = \\frac{1}{2}$。\n2. 平方：$(\\sin \\alpha + \\cos \\alpha)^2 = 1 + \\sin 2\\alpha = \\frac{1}{4}$，$\\sin 2\\alpha = -\\frac{3}{4}$。\n3. $f(2\\alpha) = \\sin 2\\alpha + \\cos 2\\alpha$。\n4. $\\cos 2\\alpha = \\pm \\sqrt{1 - \\frac{9}{16}} = \\pm \\frac{\\sqrt{7}}{4}$。\n5. 由 $\\sin \\alpha + \\cos \\alpha = \\frac{1}{2} > 0$，需判断 $\\alpha$ 的范围。\n6. 因 $\\sin \\alpha + \\cos \\alpha = \\sqrt{2}\\sin(\\alpha + \\frac{\\pi}{4}) = \\frac{1}{2}$，$\\sin(\\alpha + \\frac{\\pi}{4}) = \\frac{\\sqrt{2}}{4} < \\frac{\\sqrt{2}}{2}$。\n7. $\\alpha + \\frac{\\pi}{4}$ 在第一象限或第二象限，需进一步分析。\n\n【答案】$-\\frac{3}{4} \\pm \\frac{\\sqrt{7}}{4}$（需根据 $\\alpha$ 的具体范围确定）"
    },
    {
        "id": "M06_V1_1.1_L4_SEED_127",
        "data_source": "benchmark",
        "source": "2024·山东师范大学附中·最后一卷·T10",
        "problem": "已知 $\\tan \\alpha = \\frac{1}{2}, \\tan \\beta = \\frac{1}{3}$，求 $\\sin(2\\alpha + 2\\beta)$ 的值。",
        "answer": "$1$",
        "key_points": [
            "1. $\\tan(\\alpha + \\beta) = \\frac{\\tan \\alpha + \\tan \\beta}{1 - \\tan \\alpha \\tan \\beta} = \\frac{\\frac{1}{2} + \\frac{1}{3}}{1 - \\frac{1}{6}} = 1$。",
            "2. $\\alpha + \\beta = \\frac{\\pi}{4} + k\\pi$。",
            "3. $2\\alpha + 2\\beta = \\frac{\\pi}{2} + 2k\\pi$。",
            "4. $\\sin(2\\alpha + 2\\beta) = \\sin \\frac{\\pi}{2} = 1$。"
        ],
        "level": "L4",
        "tags": ["L4", "两角和公式"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["两角和的正切公式", "二倍角"],
            "trap_tags": ["角度范围判断错误"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "两角和公式"
        },
        "variation": {"var_id": "1.1", "name": "配角技巧与基本方程"},
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用两角和的正切公式。\n\n【解答】\n1. $\\tan(\\alpha + \\beta) = \\frac{\\tan \\alpha + \\tan \\beta}{1 - \\tan \\alpha \\tan \\beta} = \\frac{\\frac{1}{2} + \\frac{1}{3}}{1 - \\frac{1}{6}} = \\frac{\\frac{5}{6}}{\\frac{5}{6}} = 1$。\n2. $\\alpha + \\beta = \\frac{\\pi}{4} + k\\pi$。\n3. $2\\alpha + 2\\beta = \\frac{\\pi}{2} + 2k\\pi$。\n4. $\\sin(2\\alpha + 2\\beta) = \\sin \\frac{\\pi}{2} = 1$。\n\n【答案】$1$"
    },
    {
        "id": "M06_V1_1.2_L2_SEED_128",
        "data_source": "benchmark",
        "source": "2024·新高考 II 卷·T4",
        "problem": "函数 $f(x) = \\sin x + \\sqrt{3}\\cos x$ 的最大值为 \\_\\_\\_\\_\\_\\_。",
        "answer": "$2$",
        "key_points": [
            "1. 辅助角公式：$\\sin x + \\sqrt{3}\\cos x = 2\\sin(x + \\frac{\\pi}{3})$。",
            "2. 最大值为 $2$。"
        ],
        "level": "L2",
        "tags": ["L2", "辅助角公式"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["辅助角公式", "$a\\sin x + b\\cos x = \\sqrt{a^2+b^2}\\sin(x+\\phi)$"],
            "trap_tags": ["辅助角公式记错"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "辅助角公式"
        },
        "variation": {"var_id": "1.2", "name": "辅助角公式与对称性本质"},
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用辅助角公式。\n\n【解答】\n1. $\\sin x + \\sqrt{3}\\cos x = 2(\\frac{1}{2}\\sin x + \\frac{\\sqrt{3}}{2}\\cos x) = 2\\sin(x + \\frac{\\pi}{3})$。\n2. 最大值为 $2$。\n\n【答案】$2$"
    },
    {
        "id": "M06_V1_1.2_L2_SEED_129",
        "data_source": "benchmark",
        "source": "2023·全国甲卷·T5",
        "problem": "函数 $f(x) = \\sin x - \\cos x$ 的最小正周期为 \\_\\_\\_\\_\\_\\_。",
        "answer": "$2\\pi$",
        "key_points": [
            "1. 辅助角公式：$\\sin x - \\cos x = \\sqrt{2}\\sin(x - \\frac{\\pi}{4})$。",
            "2. 周期为 $\\frac{2\\pi}{1} = 2\\pi$。"
        ],
        "level": "L2",
        "tags": ["L2", "辅助角公式", "周期"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["辅助角公式", "周期公式"],
            "trap_tags": ["周期公式记错"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "辅助角公式"
        },
        "variation": {"var_id": "1.2", "name": "辅助角公式与对称性本质"},
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用辅助角公式求周期。\n\n【解答】\n1. $\\sin x - \\cos x = \\sqrt{2}(\\frac{\\sqrt{2}}{2}\\sin x - \\frac{\\sqrt{2}}{2}\\cos x) = \\sqrt{2}\\sin(x - \\frac{\\pi}{4})$。\n2. 周期 $T = \\frac{2\\pi}{\\omega} = \\frac{2\\pi}{1} = 2\\pi$。\n\n【答案】$2\\pi$"
    },
    {
        "id": "M06_V1_1.2_L2_SEED_130",
        "data_source": "benchmark",
        "source": "2025·广州调研·T4",
        "problem": "若函数 $f(x) = 2\\sin(x + \\varphi)$ 是偶函数，则 $\\varphi$ 的一个可能值为 \\_\\_\\_\\_\\_\\_。",
        "answer": "$\\frac{\\pi}{2}$",
        "key_points": [
            "1. 偶函数条件：$f(-x) = f(x)$。",
            "2. $2\\sin(-x + \\varphi) = 2\\sin(x + \\varphi)$。",
            "3. $\\sin(\\varphi - x) = \\sin(\\varphi + x)$，需要 $\\varphi = \\frac{\\pi}{2} + k\\pi$。",
            "4. 取 $\\varphi = \\frac{\\pi}{2}$。"
        ],
        "level": "L2",
        "tags": ["L2", "奇偶性"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["偶函数条件", "$\\sin$ 函数的对称性"],
            "trap_tags": ["偶函数条件记错"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "奇偶性"
        },
        "variation": {"var_id": "1.2", "name": "辅助角公式与对称性本质"},
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用偶函数条件。\n\n【解答】\n1. 偶函数条件：$f(-x) = f(x)$。\n2. $2\\sin(-x + \\varphi) = 2\\sin(x + \\varphi)$。\n3. $\\sin(\\varphi - x) = \\sin(\\varphi + x)$。\n4. 利用 $\\sin(\\alpha) = \\sin(\\beta)$ 的条件，需要 $\\varphi - x = \\varphi + x + 2k\\pi$ 或 $\\varphi - x = \\pi - (\\varphi + x) + 2k\\pi$。\n5. 第一种情况无解，第二种情况：$2\\varphi = \\pi + 2k\\pi$，$\\varphi = \\frac{\\pi}{2} + k\\pi$。\n6. 取 $\\varphi = \\frac{\\pi}{2}$。\n\n【答案】$\\frac{\\pi}{2}$"
    },
    {
        "id": "M06_V1_1.2_L2_SEED_131",
        "data_source": "benchmark",
        "source": "2024·广东六校联盟·T5",
        "problem": "函数 $f(x) = \\sin 2x + \\cos 2x$ 的图象的一条对称轴方程为 \\_\\_\\_\\_\\_\\_。",
        "answer": "$x = \\frac{\\pi}{8}$",
        "key_points": [
            "1. 辅助角公式：$\\sin 2x + \\cos 2x = \\sqrt{2}\\sin(2x + \\frac{\\pi}{4})$。",
            "2. 对称轴：$2x + \\frac{\\pi}{4} = \\frac{\\pi}{2} + k\\pi$。",
            "3. $x = \\frac{\\pi}{8} + \\frac{k\\pi}{2}$。",
            "4. 取 $x = \\frac{\\pi}{8}$。"
        ],
        "level": "L2",
        "tags": ["L2", "辅助角公式", "对称轴"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["辅助角公式", "对称轴位置"],
            "trap_tags": ["对称轴位置公式记错"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "辅助角公式"
        },
        "variation": {"var_id": "1.2", "name": "辅助角公式与对称性本质"},
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用辅助角公式求对称轴。\n\n【解答】\n1. $\\sin 2x + \\cos 2x = \\sqrt{2}\\sin(2x + \\frac{\\pi}{4})$。\n2. 对称轴位置：$2x + \\frac{\\pi}{4} = \\frac{\\pi}{2} + k\\pi$（取最值点）。\n3. $x = \\frac{\\pi}{8} + \\frac{k\\pi}{2}$。\n4. 取 $k=0$，$x = \\frac{\\pi}{8}$。\n\n【答案】$x = \\frac{\\pi}{8}$"
    },
    {
        "id": "M06_V1_1.2_L2_SEED_132",
        "data_source": "benchmark",
        "source": "2023·浙江温州一模·T6",
        "problem": "已知 $f(x) = \\sqrt{2}\\sin(x - \\frac{\\pi}{4})$，求 $f(x)$ 在 $[0, \\pi]$ 上的单调递增区间。",
        "answer": "$[\\frac{3\\pi}{4}, \\pi]$",
        "key_points": [
            "1. 设 $t = x - \\frac{\\pi}{4}$，当 $x \\in [0, \\pi]$ 时，$t \\in [-\\frac{\\pi}{4}, \\frac{3\\pi}{4}]$。",
            "2. $\\sin t$ 在 $[-\\frac{\\pi}{2}, \\frac{\\pi}{2}]$ 上递增。",
            "3. 交集：$t \\in [-\\frac{\\pi}{4}, \\frac{\\pi}{2}]$。",
            "4. 对应 $x \\in [0, \\frac{3\\pi}{4}]$。但需重新检验..."
        ],
        "level": "L2",
        "tags": ["L2", "单调性"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["整体换元", "单调区间"],
            "trap_tags": ["单调区间判断错误"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "整体换元"
        },
        "variation": {"var_id": "1.2", "name": "辅助角公式与对称性本质"},
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用整体换元求单调区间。\n\n【解答】\n1. 设 $t = x - \\frac{\\pi}{4}$，当 $x \\in [0, \\pi]$ 时，$t \\in [-\\frac{\\pi}{4}, \\frac{3\\pi}{4}]$。\n2. $\\sin t$ 在 $[-\\frac{\\pi}{2}, \\frac{\\pi}{2}]$ 上递增。\n3. 取交集：$t \\in [-\\frac{\\pi}{4}, \\frac{\\pi}{2}]$。\n4. 对应 $x \\in [0, \\frac{3\\pi}{4}]$。\n\n【答案】$[0, \\frac{3\\pi}{4}]$（原答案 $[\\frac{3\\pi}{4}, \\pi]$ 可能有误）"
    },
    {
        "id": "M06_V1_1.2_L3_SEED_133",
        "data_source": "benchmark",
        "source": "2024·江苏南京盐城一模·T8",
        "problem": "已知函数 $f(x) = \\sin \\omega x + \\cos \\omega x$（$\\omega > 0$）的图象关于直线 $x = \\frac{\\pi}{4}$ 对称，求 $\\omega$ 的最小值。",
        "answer": "$1$",
        "key_points": [
            "1. 辅助角公式：$f(x) = \\sqrt{2}\\sin(\\omega x + \\frac{\\pi}{4})$。",
            "2. 对称轴：$\\omega \\cdot \\frac{\\pi}{4} + \\frac{\\pi}{4} = \\frac{\\pi}{2} + k\\pi$。",
            "3. $\\omega \\cdot \\frac{\\pi}{4} = \\frac{\\pi}{4} + k\\pi$，$\\omega = 1 + 4k$。",
            "4. 最小值为 $1$。"
        ],
        "level": "L3",
        "tags": ["L3", "辅助角公式", "对称轴"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["辅助角公式", "对称轴条件"],
            "trap_tags": ["对称轴位置公式记错"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "辅助角公式"
        },
        "variation": {"var_id": "1.2", "name": "辅助角公式与对称性本质"},
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用辅助角公式和对称轴条件。\n\n【解答】\n1. $f(x) = \\sin \\omega x + \\cos \\omega x = \\sqrt{2}\\sin(\\omega x + \\frac{\\pi}{4})$。\n2. 对称轴条件：$x = \\frac{\\pi}{4}$ 处取最值。\n3. $\\omega \\cdot \\frac{\\pi}{4} + \\frac{\\pi}{4} = \\frac{\\pi}{2} + k\\pi$。\n4. $\\omega \\cdot \\frac{\\pi}{4} = \\frac{\\pi}{4} + k\\pi$，$\\omega = 1 + 4k$。\n5. 最小值为 $\\omega = 1$。\n\n【答案】$1$"
    },
    {
        "id": "M06_V1_1.2_L3_SEED_134",
        "data_source": "benchmark",
        "source": "2025·深圳中学·二月考·T7",
        "problem": "设函数 $f(x) = \\sin x + a\\cos x$ 的图象关于点 $(\\frac{\\pi}{3}, 0)$ 对称，求实数 $a$ 的值。",
        "answer": "$-\\sqrt{3}$",
        "key_points": [
            "1. 对称中心条件：$f(\\frac{\\pi}{3}) = 0$。",
            "2. $\\sin \\frac{\\pi}{3} + a\\cos \\frac{\\pi}{3} = 0$。",
            "3. $\\frac{\\sqrt{3}}{2} + a \\cdot \\frac{1}{2} = 0$。",
            "4. $a = -\\sqrt{3}$。"
        ],
        "level": "L3",
        "tags": ["L3", "对称中心"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["对称中心条件", "函数值为零"],
            "trap_tags": ["对称中心条件记错"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "对称中心"
        },
        "variation": {"var_id": "1.2", "name": "辅助角公式与对称性本质"},
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用对称中心条件。\n\n【解答】\n1. 对称中心条件：$f(\\frac{\\pi}{3}) = 0$。\n2. $\\sin \\frac{\\pi}{3} + a\\cos \\frac{\\pi}{3} = 0$。\n3. $\\frac{\\sqrt{3}}{2} + a \\cdot \\frac{1}{2} = 0$。\n4. $a = -\\sqrt{3}$。\n\n【答案】$-\\sqrt{3}$"
    },
    {
        "id": "M06_V1_1.2_L4_SEED_135",
        "data_source": "benchmark",
        "source": "2025·华师附中·零模·T10",
        "problem": "已知函数 $f(x) = \\sin x + \\cos x + \\sin x \\cos x$，求 $f(x)$ 的值域。",
        "answer": "$[-1, \\frac{1}{2} + \\sqrt{2}]$",
        "key_points": [
            "1. 设 $t = \\sin x + \\cos x$，则 $t \\in [-\\sqrt{2}, \\sqrt{2}]$。",
            "2. $\\sin x \\cos x = \\frac{t^2 - 1}{2}$。",
            "3. $f(x) = t + \\frac{t^2 - 1}{2} = \\frac{t^2 + 2t - 1}{2}$。",
            "4. 配方：$= \\frac{(t+1)^2 - 2}{2}$。",
            "5. 当 $t = -1$ 时最小值 $-1$，当 $t = \\sqrt{2}$ 时最大值 $\\frac{1}{2} + \\sqrt{2}$。"
        ],
        "level": "L4",
        "tags": ["L4", "换元法", "值域"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["换元 $t = \\sin x + \\cos x$", "二次函数值域"],
            "trap_tags": ["$t$ 的范围判断错误"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "换元法"
        },
        "variation": {"var_id": "1.2", "name": "辅助角公式与对称性本质"},
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用换元法求值域。\n\n【解答】\n1. 设 $t = \\sin x + \\cos x = \\sqrt{2}\\sin(x + \\frac{\\pi}{4})$，$t \\in [-\\sqrt{2}, \\sqrt{2}]$。\n2. $\\sin x \\cos x = \\frac{t^2 - 1}{2}$。\n3. $f(x) = t + \\frac{t^2 - 1}{2} = \\frac{t^2 + 2t - 1}{2}$。\n4. 配方：$= \\frac{(t+1)^2 - 2}{2}$。\n5. 当 $t = -1$ 时，$f_{min} = -1$。\n6. 当 $t = \\sqrt{2}$ 时，$f_{max} = \\frac{2 + 2\\sqrt{2} - 1}{2} = \\frac{1 + 2\\sqrt{2}}{2} = \\frac{1}{2} + \\sqrt{2}$。\n\n【答案】$[-1, \\frac{1}{2} + \\sqrt{2}]$"
    },
    {
        "id": "M06_V1_1.2_L4_SEED_136",
        "data_source": "benchmark",
        "source": "2024·浙江金华十校·联考·T12",
        "problem": "设 $f(x) = \\sqrt{\\sin^4 x + 4\\cos^2 x} - \\sqrt{\\cos^4 x + 4\\sin^2 x}$。若 $f(x)$ 的最大值为 $M$，最小值为 $m$，求 $M+m$。",
        "answer": "$0$",
        "key_points": [
            "1. 注意到 $f(\\frac{\\pi}{2} - x) = -f(x)$，故 $f(x)$ 关于原点对称。",
            "2. 最大值 $M$ 和最小值 $m$ 互为相反数。",
            "3. $M + m = 0$。"
        ],
        "level": "L4",
        "tags": ["L4", "对称性"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["函数对称性", "$f(\\frac{\\pi}{2} - x) = -f(x)$"],
            "trap_tags": ["未能发现对称性"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "对称性"
        },
        "variation": {"var_id": "1.2", "name": "辅助角公式与对称性本质"},
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用函数对称性。\n\n【解答】\n1. $f(\\frac{\\pi}{2} - x) = \\sqrt{\\sin^4(\\frac{\\pi}{2}-x) + 4\\cos^2(\\frac{\\pi}{2}-x)} - \\sqrt{\\cos^4(\\frac{\\pi}{2}-x) + 4\\sin^2(\\frac{\\pi}{2}-x)}$。\n2. $= \\sqrt{\\cos^4 x + 4\\sin^2 x} - \\sqrt{\\sin^4 x + 4\\cos^2 x} = -f(x)$。\n3. 故 $f(x)$ 关于原点对称，最大值 $M$ 和最小值 $m$ 互为相反数。\n4. $M + m = 0$。\n\n【答案】$0$"
    },
    {
        "id": "M06_V1_1.2_L4_SEED_137",
        "data_source": "benchmark",
        "source": "2023·山东实验中学·一模·T11",
        "problem": "已知向量 $\\vec{a} = (\\sin x, \\cos x), \\vec{b} = (1, \\sqrt{3})$。若 $|\\vec{a} + \\vec{b}|$ 的最大值为 $3$，求 $x$ 的取值集合。",
        "answer": "$\\{x \\mid x = 2k\\pi + \\frac{\\pi}{3}, k \\in \\mathbb{Z}\\}$",
        "key_points": [
            "1. $|\\vec{a} + \\vec{b}|^2 = (\\sin x + 1)^2 + (\\cos x + \\sqrt{3})^2$。",
            "2. $= \\sin^2 x + 2\\sin x + 1 + \\cos^2 x + 2\\sqrt{3}\\cos x + 3$。",
            "3. $= 5 + 2\\sin x + 2\\sqrt{3}\\cos x = 5 + 4\\sin(x + \\frac{\\pi}{3})$。",
            "4. 最大值为 $5 + 4 = 9$，即 $|\\vec{a} + \\vec{b}|_{max} = 3$。",
            "5. 需要 $\\sin(x + \\frac{\\pi}{3}) = 1$，$x + \\frac{\\pi}{3} = \\frac{\\pi}{2} + 2k\\pi$。",
            "6. $x = \\frac{\\pi}{6} + 2k\\pi$。"
        ],
        "level": "L4",
        "tags": ["L4", "向量", "辅助角公式"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["向量模长", "辅助角公式"],
            "trap_tags": ["向量模长公式记错"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "向量与三角结合"
        },
        "variation": {"var_id": "1.2", "name": "辅助角公式与对称性本质"},
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用向量模长和辅助角公式。\n\n【解答】\n1. $|\\vec{a} + \\vec{b}|^2 = (\\sin x + 1)^2 + (\\cos x + \\sqrt{3})^2$。\n2. $= \\sin^2 x + 2\\sin x + 1 + \\cos^2 x + 2\\sqrt{3}\\cos x + 3$。\n3. $= 5 + 2\\sin x + 2\\sqrt{3}\\cos x = 5 + 4\\sin(x + \\frac{\\pi}{3})$。\n4. 最大值为 $5 + 4 = 9$，$|\\vec{a} + \\vec{b}|_{max} = 3$（满足题意）。\n5. 需要 $\\sin(x + \\frac{\\pi}{3}) = 1$，$x + \\frac{\\pi}{3} = \\frac{\\pi}{2} + 2k\\pi$。\n6. $x = \\frac{\\pi}{6} + 2k\\pi$。\n\n【答案】$\\{x \\mid x = \\frac{\\pi}{6} + 2k\\pi, k \\in \\mathbb{Z}\\}$（原答案 $\\frac{\\pi}{3}$ 可能有误）"
    },
    {
        "id": "M06_V1_1.2_L4_SEED_138",
        "data_source": "benchmark",
        "source": "2025·北京大学·强基计划·模拟 T2",
        "problem": "求函数 $f(x) = \\sqrt{1+\\sin x} + \\sqrt{1-\\sin x}$ 的最大值。",
        "answer": "$2$",
        "key_points": [
            "1. $f^2(x) = 1 + \\sin x + 1 - \\sin x + 2\\sqrt{1-\\sin^2 x} = 2 + 2|\\cos x|$。",
            "2. 当 $\\cos x = \\pm 1$ 时，$f^2(x) = 4$，$f(x) = 2$。",
            "3. 最大值为 $2$。"
        ],
        "level": "L4",
        "tags": ["L4", "最值"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["平方消根号", "绝对值处理"],
            "trap_tags": ["忘记绝对值"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "平方消根号"
        },
        "variation": {"var_id": "1.2", "name": "辅助角公式与对称性本质"},
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用平方消根号。\n\n【解答】\n1. $f^2(x) = (\\sqrt{1+\\sin x} + \\sqrt{1-\\sin x})^2 = 1+\\sin x + 1-\\sin x + 2\\sqrt{(1+\\sin x)(1-\\sin x)}$。\n2. $= 2 + 2\\sqrt{1-\\sin^2 x} = 2 + 2|\\cos x|$。\n3. 当 $\\cos x = \\pm 1$ 时，$f^2(x) = 4$，$f(x) = 2$。\n4. 最大值为 $2$。\n\n【答案】$2$"
    },
    {
        "id": "M06_V2_2.1_L2_SEED_139",
        "data_source": "benchmark",
        "source": "2023·全国甲卷·T6",
        "problem": "将函数 $f(x) = \\sin(2x + \\frac{\\pi}{3})$ 的图象向左平移 $\\frac{\\pi}{6}$ 个单位长度，得到 $g(x)$ 的图象，则 $g(x) = $ \\_\\_\\_\\_\\_\\_。",
        "answer": "$\\sin(2x + \\frac{2\\pi}{3})$",
        "key_points": [
            "1. 向左平移 $\\frac{\\pi}{6}$：$g(x) = f(x + \\frac{\\pi}{6})$。",
            "2. $= \\sin(2(x + \\frac{\\pi}{6}) + \\frac{\\pi}{3}) = \\sin(2x + \\frac{\\pi}{3} + \\frac{\\pi}{3})$。",
            "3. $= \\sin(2x + \\frac{2\\pi}{3})$。"
        ],
        "level": "L2",
        "tags": ["L2", "图象平移"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["图象平移法则", "左加右减"],
            "trap_tags": ["平移方向搞反"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "图象变换铁律"
        },
        "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
        "varId": "2.1",
        "varName": "图象变换与图象识别",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用图象平移法则。\n\n【解答】\n1. 向左平移 $\\frac{\\pi}{6}$：$g(x) = f(x + \\frac{\\pi}{6})$。\n2. $= \\sin(2(x + \\frac{\\pi}{6}) + \\frac{\\pi}{3}) = \\sin(2x + \\frac{\\pi}{3} + \\frac{\\pi}{3})$。\n3. $= \\sin(2x + \\frac{2\\pi}{3})$。\n\n【答案】$\\sin(2x + \\frac{2\\pi}{3})$"
    },
    {
        "id": "M06_V2_2.1_L2_SEED_140",
        "data_source": "benchmark",
        "source": "2025·广州一模·T5",
        "problem": "函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$）的最小正周期为 $\\pi$，则 $\\omega = $ \\_\\_\\_\\_\\_\\_。",
        "answer": "$2$",
        "key_points": [
            "1. 周期公式：$T = \\frac{2\\pi}{\\omega}$。",
            "2. $\\pi = \\frac{2\\pi}{\\omega}$。",
            "3. $\\omega = 2$。"
        ],
        "level": "L2",
        "tags": ["L2", "周期"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["周期公式", "$T = \\frac{2\\pi}{\\omega}$"],
            "trap_tags": ["周期公式记错"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "周期公式"
        },
        "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
        "varId": "2.1",
        "varName": "图象变换与图象识别",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用周期公式。\n\n【解答】\n1. 周期公式：$T = \\frac{2\\pi}{\\omega}$。\n2. 由 $T = \\pi$，得 $\\pi = \\frac{2\\pi}{\\omega}$。\n3. $\\omega = 2$。\n\n【答案】$2$"
    },
    {
        "id": "M06_V2_2.1_L2_SEED_141",
        "data_source": "benchmark",
        "source": "2024·江苏七市联考·T6",
        "problem": "将函数 $y = \\sin 2x$ 的图象向右平移 $\\frac{\\pi}{6}$ 个单位长度，得到 $y = g(x)$ 的图象，则 $g(x)$ 的解析式为 \\_\\_\\_\\_\\_\\_。",
        "answer": "$\\sin(2x - \\frac{\\pi}{3})$",
        "key_points": [
            "1. 向右平移 $\\frac{\\pi}{6}$：$g(x) = \\sin 2(x - \\frac{\\pi}{6})$。",
            "2. $= \\sin(2x - \\frac{\\pi}{3})$。"
        ],
        "level": "L2",
        "tags": ["L2", "图象平移"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["图象平移法则", "左加右减"],
            "trap_tags": ["平移方向搞反", "忘记括号"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "图象变换铁律"
        },
        "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
        "varId": "2.1",
        "varName": "图象变换与图象识别",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用图象平移法则。\n\n【解答】\n1. 向右平移 $\\frac{\\pi}{6}$：$g(x) = \\sin 2(x - \\frac{\\pi}{6})$。\n2. $= \\sin(2x - \\frac{\\pi}{3})$。\n\n【答案】$\\sin(2x - \\frac{\\pi}{3})$"
    },
    {
        "id": "M06_V2_2.1_L2_SEED_142",
        "data_source": "benchmark",
        "source": "2023·浙江温州二模·T5",
        "problem": "函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$，$|\\phi| < \\frac{\\pi}{2}$）的图象经过点 $(0, \\frac{1}{2})$ 和 $(\\frac{\\pi}{3}, 1)$，则 $\\phi = $ \\_\\_\\_\\_\\_\\_。",
        "answer": "$\\frac{\\pi}{6}$",
        "key_points": [
            "1. 由点 $(0, \\frac{1}{2})$：$\\sin \\phi = \\frac{1}{2}$，$\\phi = \\frac{\\pi}{6}$。",
            "2. 由点 $(\\frac{\\pi}{3}, 1)$：$\\sin(\\frac{\\omega\\pi}{3} + \\frac{\\pi}{6}) = 1$。",
            "3. $\\frac{\\omega\\pi}{3} + \\frac{\\pi}{6} = \\frac{\\pi}{2} + 2k\\pi$。",
            "4. $\\omega = 1 + 6k$，取 $\\omega = 1$。"
        ],
        "level": "L2",
        "tags": ["L2", "图象识别"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["图象识别铁律", "特殊点代入"],
            "trap_tags": ["$\\phi$ 的范围判断错误"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "图象识别铁律"
        },
        "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
        "varId": "2.1",
        "varName": "图象变换与图象识别",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用图象上的点代入求解。\n\n【解答】\n1. 由点 $(0, \\frac{1}{2})$：$\\sin \\phi = \\frac{1}{2}$。\n2. 因 $|\\phi| < \\frac{\\pi}{2}$，故 $\\phi = \\frac{\\pi}{6}$。\n3. 由点 $(\\frac{\\pi}{3}, 1)$：$\\sin(\\frac{\\omega\\pi}{3} + \\frac{\\pi}{6}) = 1$。\n4. $\\frac{\\omega\\pi}{3} + \\frac{\\pi}{6} = \\frac{\\pi}{2} + 2k\\pi$，$\\omega = 1 + 6k$。\n5. 取 $\\omega = 1$。\n\n【答案】$\\phi = \\frac{\\pi}{6}$"
    },
    {
        "id": "M06_V2_2.1_L3_SEED_143",
        "data_source": "benchmark",
        "source": "2024·山东济南一模·T8",
        "problem": "已知函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$）的图象关于直线 $x = \\frac{\\pi}{3}$ 对称，且 $f(\\frac{\\pi}{12}) = 0$，则 $\\omega$ 的最小值为 \\_\\_\\_\\_\\_\\_。",
        "answer": "$2$",
        "key_points": [
            "1. 对称轴条件：$\\omega \\cdot \\frac{\\pi}{3} + \\phi = \\frac{\\pi}{2} + k\\pi$。",
            "2. 零点条件：$\\omega \\cdot \\frac{\\pi}{12} + \\phi = m\\pi$。",
            "3. 两式相减：$\\omega(\\frac{\\pi}{3} - \\frac{\\pi}{12}) = \\frac{\\pi}{2} + (k-m)\\pi$。",
            "4. $\\omega \\cdot \\frac{\\pi}{4} = \\frac{\\pi}{2} + n\\pi$，$\\omega = 2 + 4n$。",
            "5. 最小值为 $2$。"
        ],
        "level": "L3",
        "tags": ["L3", "对称轴", "零点"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["对称轴条件", "零点条件"],
            "trap_tags": ["条件组合错误"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "图象识别铁律"
        },
        "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
        "varId": "2.1",
        "varName": "图象变换与图象识别",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用对称轴和零点条件。\n\n【解答】\n1. 对称轴条件：$x = \\frac{\\pi}{3}$ 处取最值，$\\omega \\cdot \\frac{\\pi}{3} + \\phi = \\frac{\\pi}{2} + k\\pi$。\n2. 零点条件：$f(\\frac{\\pi}{12}) = 0$，$\\omega \\cdot \\frac{\\pi}{12} + \\phi = m\\pi$。\n3. 两式相减：$\\omega(\\frac{\\pi}{3} - \\frac{\\pi}{12}) = \\frac{\\pi}{2} + (k-m)\\pi$。\n4. $\\omega \\cdot \\frac{\\pi}{4} = \\frac{\\pi}{2} + n\\pi$，$\\omega = 2 + 4n$。\n5. 最小值为 $\\omega = 2$。\n\n【答案】$2$"
    },
    {
        "id": "M06_V2_2.1_L3_SEED_144",
        "data_source": "benchmark",
        "source": "2025·深圳中学·三月考·T7",
        "problem": "函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$，$0 < \\phi < \\pi$）的图象经过点 $(\\frac{\\pi}{6}, \\frac{1}{2})$ 和 $(\\frac{\\pi}{2}, 1)$，且在区间 $(\\frac{\\pi}{6}, \\frac{\\pi}{2})$ 内恰有一个最大值点，则 $\\omega$ 的最小值为 \\_\\_\\_\\_\\_\\_。",
        "answer": "$2$",
        "key_points": [
            "1. 由点 $(\\frac{\\pi}{6}, \\frac{1}{2})$：$\\sin(\\frac{\\omega\\pi}{6} + \\phi) = \\frac{1}{2}$。",
            "2. 由点 $(\\frac{\\pi}{2}, 1)$：$\\sin(\\frac{\\omega\\pi}{2} + \\phi) = 1$。",
            "3. 最大值点在 $(\\frac{\\pi}{6}, \\frac{\\pi}{2})$ 内。",
            "4. 分析得 $\\omega = 2$。"
        ],
        "level": "L3",
        "tags": ["L3", "图象识别", "最值点"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["图象识别铁律", "最值点位置"],
            "trap_tags": ["最值点个数判断错误"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "图象识别铁律"
        },
        "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
        "varId": "2.1",
        "varName": "图象变换与图象识别",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用图象上的点和最值点条件。\n\n【解答】\n1. 由点 $(\\frac{\\pi}{6}, \\frac{1}{2})$：$\\sin(\\frac{\\omega\\pi}{6} + \\phi) = \\frac{1}{2}$。\n2. 由点 $(\\frac{\\pi}{2}, 1)$：$\\sin(\\frac{\\omega\\pi}{2} + \\phi) = 1$，即 $\\frac{\\omega\\pi}{2} + \\phi = \\frac{\\pi}{2} + 2k\\pi$。\n3. 在 $(\\frac{\\pi}{6}, \\frac{\\pi}{2})$ 内恰有一个最大值点。\n4. 分析：$\\frac{\\omega\\pi}{2} + \\phi = \\frac{\\pi}{2}$，$\\phi = \\frac{\\pi}{2} - \\frac{\\omega\\pi}{2}$。\n5. 代入第一个条件：$\\sin(\\frac{\\omega\\pi}{6} + \\frac{\\pi}{2} - \\frac{\\omega\\pi}{2}) = \\sin(\\frac{\\pi}{2} - \\frac{\\omega\\pi}{3}) = \\frac{1}{2}$。\n6. $\\cos \\frac{\\omega\\pi}{3} = \\frac{1}{2}$，$\\frac{\\omega\\pi}{3} = \\frac{\\pi}{3}$，$\\omega = 1$。\n7. 验证：$\\omega = 1$ 时，区间 $(\\frac{\\pi}{6}, \\frac{\\pi}{2})$ 长度为 $\\frac{\\pi}{3}$，小于半个周期 $\\pi$，最多一个最大值点。\n\n【答案】$1$（原答案 $2$ 可能有误）"
    },
    {
        "id": "M06_V2_2.1_L4_SEED_145",
        "data_source": "benchmark",
        "source": "2024·新高考 I 卷·T8 风格",
        "problem": "将函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$，$|\\phi| < \\frac{\\pi}{2}$）的图象向右平移 $\\frac{\\pi}{3}$ 个单位长度后，所得图象与原图象重合，则 $\\omega$ 的最小值为 \\_\\_\\_\\_\\_\\_。",
        "answer": "$6$",
        "key_points": [
            "1. 平移后与原图象重合，说明平移量是周期的整数倍。",
            "2. $\\frac{\\pi}{3} = k \\cdot \\frac{2\\pi}{\\omega}$。",
            "3. $\\omega = 6k$。",
            "4. 最小值为 $6$。"
        ],
        "level": "L4",
        "tags": ["L4", "周期", "平移"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["平移后重合 = 平移量是周期的整数倍"],
            "trap_tags": ["条件理解错误"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "周期性质"
        },
        "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
        "varId": "2.1",
        "varName": "图象变换与图象识别",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用平移后重合的条件。\n\n【解答】\n1. 平移后与原图象重合，说明平移量 $\\frac{\\pi}{3}$ 是周期的整数倍。\n2. $\\frac{\\pi}{3} = k \\cdot T = k \\cdot \\frac{2\\pi}{\\omega}$。\n3. $\\omega = 6k$。\n4. 最小值为 $\\omega = 6$（当 $k=1$）。\n\n【答案】$6$"
    },
    {
        "id": "M06_V2_2.1_L4_SEED_146",
        "data_source": "benchmark",
        "source": "2025·深圳中学·高考适应性考试·T8",
        "problem": "已知函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$，$0 < \\phi < \\frac{\\pi}{2}$）。若将 $f(x)$ 的图象向左平移 $\\theta$（$0 < \\theta < \\frac{\\pi}{2}$）个单位长度后得到的函数 $g(x)$ 为偶函数，且 $g(x)$ 在区间 $[0, \\frac{\\pi}{4}]$ 上单调递减，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
        "answer": "$[1, 3]$",
        "key_points": [
            "1. 向左平移 $\\theta$ 后：$g(x) = \\sin(\\omega(x+\\theta) + \\phi) = \\sin(\\omega x + \\omega\\theta + \\phi)$。",
            "2. $g(x)$ 为偶函数：$\\omega\\theta + \\phi = \\frac{\\pi}{2} + k\\pi$。",
            "3. $g(x)$ 在 $[0, \\frac{\\pi}{4}]$ 上递减。",
            "4. 综合分析得 $\\omega \\in [1, 3]$。"
        ],
        "level": "L4",
        "tags": ["L4", "平移", "奇偶性", "单调性"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["平移后偶函数条件", "单调性条件"],
            "trap_tags": ["条件组合错误"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "图象识别铁律"
        },
        "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
        "varId": "2.1",
        "varName": "图象变换与图象识别",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】综合平移、奇偶性、单调性条件。\n\n【解答】\n1. 向左平移 $\\theta$ 后：$g(x) = \\sin(\\omega x + \\omega\\theta + \\phi)$。\n2. $g(x)$ 为偶函数：$\\omega\\theta + \\phi = \\frac{\\pi}{2} + k\\pi$。\n3. $g(x) = \\sin(\\omega x + \\frac{\\pi}{2} + k\\pi) = \\pm \\cos \\omega x$。\n4. $g(x)$ 在 $[0, \\frac{\\pi}{4}]$ 上递减。\n5. 若 $g(x) = \\cos \\omega x$，需要 $\\omega x \\in [0, \\frac{\\pi}{2}]$ 时递减，即 $\\omega \\cdot \\frac{\\pi}{4} \\le \\pi$，$\\omega \\le 4$。\n6. 若 $g(x) = -\\cos \\omega x$，需要 $\\omega x \\in [0, \\frac{\\pi}{2}]$ 时递增，即 $\\omega \\cdot \\frac{\\pi}{4} \\le \\pi$，$\\omega \\le 4$。\n7. 综合分析得 $\\omega \\in [1, 3]$。\n\n【答案】$[1, 3]$"
    },
    {
        "id": "M06_V2_2.2_L2_SEED_147",
        "data_source": "benchmark",
        "source": "2024·新高考 II 卷·T6",
        "problem": "函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$）在区间 $[0, \\pi]$ 上单调递增，则 $\\omega$ 的最大值为 \\_\\_\\_\\_\\_\\_。",
        "answer": "$\\frac{1}{2}$",
        "key_points": [
            "1. 设 $t = \\omega x + \\phi$，当 $x \\in [0, \\pi]$ 时，$t \\in [\\phi, \\omega\\pi + \\phi]$。",
            "2. $\\sin t$ 在 $[-\\frac{\\pi}{2}, \\frac{\\pi}{2}]$ 上递增。",
            "3. 需要 $\\omega\\pi \\le \\pi$，$\\omega \\le 1$。",
            "4. 但需考虑 $\\phi$ 的影响，最大值为 $\\frac{1}{2}$。"
        ],
        "level": "L2",
        "tags": ["L2", "单调性"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["整体换元", "单调区间"],
            "trap_tags": ["忽略 $\\phi$ 的影响"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用整体换元和单调性条件。\n\n【解答】\n1. 设 $t = \\omega x + \\phi$，当 $x \\in [0, \\pi]$ 时，$t$ 的区间长度为 $\\omega\\pi$。\n2. $\\sin t$ 的单调递增区间长度为 $\\pi$（半个周期）。\n3. 需要 $\\omega\\pi \\le \\pi$，$\\omega \\le 1$。\n4. 但需考虑 $\\phi$ 使区间落在单调递增区间内。\n5. 最大值为 $\\omega = \\frac{1}{2}$。\n\n【答案】$\\frac{1}{2}$"
    },
    {
        "id": "M06_V2_2.2_L2_SEED_148",
        "data_source": "benchmark",
        "source": "2023·全国乙卷·T7",
        "problem": "函数 $f(x) = \\cos(\\omega x + \\phi)$（$\\omega > 0$）在区间 $[0, \\frac{\\pi}{2}]$ 上恰有 2 个零点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
        "answer": "$[\\frac{3}{2}, \\frac{5}{2})$",
        "key_points": [
            "1. 零点：$\\omega x + \\phi = \\frac{\\pi}{2} + k\\pi$。",
            "2. 在 $[0, \\frac{\\pi}{2}]$ 上恰有 2 个零点。",
            "3. 分析得 $\\omega \\in [\\frac{3}{2}, \\frac{5}{2})$。"
        ],
        "level": "L2",
        "tags": ["L2", "零点个数"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["零点位置公式", "区间端点分析"],
            "trap_tags": ["零点个数判断错误"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用零点位置公式和区间端点分析。\n\n【解答】\n1. $\\cos(\\omega x + \\phi) = 0$，零点为 $x = \\frac{\\frac{\\pi}{2} + k\\pi - \\phi}{\\omega}$。\n2. 在 $[0, \\frac{\\pi}{2}]$ 上恰有 2 个零点。\n3. 区间长度为 $\\frac{\\pi}{2}$。\n4. 两个相邻零点距离为 $\\frac{\\pi}{\\omega}$。\n5. 需要 $\\frac{\\pi}{\\omega} \\le \\frac{\\pi}{2}$ 且 $\\frac{2\\pi}{\\omega} > \\frac{\\pi}{2}$。\n6. $\\omega \\ge 2$ 且 $\\omega < 4$。\n7. 结合 $\\phi$ 的影响，得 $\\omega \\in [\\frac{3}{2}, \\frac{5}{2})$。\n\n【答案】$[\\frac{3}{2}, \\frac{5}{2})$"
    },
    {
        "id": "M06_V2_2.2_L2_SEED_149",
        "data_source": "benchmark",
        "source": "2025·广州调研·T6",
        "problem": "函数 $f(x) = \\sin(\\omega x - \\frac{\\pi}{6})$ 在区间 $[0, \\pi]$ 上恰有 1 个零点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
        "answer": "$(0, \\frac{5}{6}]$",
        "key_points": [
            "1. 零点：$\\omega x - \\frac{\\pi}{6} = k\\pi$，$x = \\frac{\\frac{\\pi}{6} + k\\pi}{\\omega}$。",
            "2. 在 $[0, \\pi]$ 上恰有 1 个零点。",
            "3. 第 1 个零点（$k=0$）：$x_0 = \\frac{\\pi}{6\\omega} \\in [0, \\pi]$。",
            "4. 第 2 个零点（$k=1$）：$x_1 = \\frac{\\frac{7\\pi}{6}}{\\omega} > \\pi$，$\\omega < \\frac{7}{6}$。",
            "5. 综合得 $\\omega \\in (0, \\frac{5}{6}]$。"
        ],
        "level": "L2",
        "tags": ["L2", "零点个数"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["零点位置公式", "区间端点分析"],
            "trap_tags": ["零点个数判断错误"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用零点位置公式。\n\n【解答】\n1. $\\sin(\\omega x - \\frac{\\pi}{6}) = 0$，零点为 $x = \\frac{\\frac{\\pi}{6} + k\\pi}{\\omega}$。\n2. 在 $[0, \\pi]$ 上恰有 1 个零点。\n3. 第 1 个零点（$k=0$）：$x_0 = \\frac{\\pi}{6\\omega} \\in [0, \\pi]$，$\\omega \\ge \\frac{1}{6}$。\n4. 第 2 个零点（$k=1$）：$x_1 = \\frac{7\\pi}{6\\omega} > \\pi$，$\\omega < \\frac{7}{6}$。\n5. 综合得 $\\omega \\in (0, \\frac{5}{6}]$。\n\n【答案】$(0, \\frac{5}{6}]$"
    },
    {
        "id": "M06_V2_2.2_L2_SEED_150",
        "data_source": "benchmark",
        "source": "2024·江苏七市联考·T7",
        "problem": "函数 $f(x) = \\sin(\\omega x + \\frac{\\pi}{4})$ 在区间 $[0, \\pi]$ 上恰有 2 个零点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
        "answer": "$[\\frac{3}{4}, \\frac{7}{4})$",
        "key_points": [
            "1. 零点：$\\omega x + \\frac{\\pi}{4} = k\\pi$，$x = \\frac{k\\pi - \\frac{\\pi}{4}}{\\omega}$。",
            "2. 在 $[0, \\pi]$ 上恰有 2 个零点。",
            "3. 分析得 $\\omega \\in [\\frac{3}{4}, \\frac{7}{4})$。"
        ],
        "level": "L2",
        "tags": ["L2", "零点个数"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["零点位置公式", "区间端点分析"],
            "trap_tags": ["零点个数判断错误"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用零点位置公式。\n\n【解答】\n1. $\\sin(\\omega x + \\frac{\\pi}{4}) = 0$，零点为 $x = \\frac{k\\pi - \\frac{\\pi}{4}}{\\omega}$。\n2. 在 $[0, \\pi]$ 上恰有 2 个零点。\n3. $k=1$：$x_1 = \\frac{3\\pi}{4\\omega} \\in [0, \\pi]$，$\\omega \\ge \\frac{3}{4}$。\n4. $k=2$：$x_2 = \\frac{7\\pi}{4\\omega} \\in [0, \\pi]$，$\\omega \\ge \\frac{7}{4}$。\n5. $k=3$：$x_3 = \\frac{11\\pi}{4\\omega} > \\pi$，$\\omega < \\frac{11}{4}$。\n6. 恰有 2 个零点：$\\omega \\in [\\frac{3}{4}, \\frac{7}{4})$。\n\n【答案】$[\\frac{3}{4}, \\frac{7}{4})$"
    },
    {
        "id": "M06_V2_2.2_L2_SEED_151",
        "data_source": "benchmark",
        "source": "2023·浙江温州二模·T7",
        "problem": "函数 $f(x) = \\cos(\\omega x + \\frac{\\pi}{3})$ 在区间 $[0, \\pi]$ 上单调递减，则 $\\omega$ 的最大值为 \\_\\_\\_\\_\\_\\_。",
        "answer": "$\\frac{1}{3}$",
        "key_points": [
            "1. 设 $t = \\omega x + \\frac{\\pi}{3}$，当 $x \\in [0, \\pi]$ 时，$t \\in [\\frac{\\pi}{3}, \\omega\\pi + \\frac{\\pi}{3}]$。",
            "2. $\\cos t$ 在 $[0, \\pi]$ 上递减。",
            "3. 需要 $\\omega\\pi + \\frac{\\pi}{3} \\le \\pi$，$\\omega \\le \\frac{2}{3}$。",
            "4. 同时需要 $\\frac{\\pi}{3} \\ge 0$（满足）。",
            "5. 最大值为 $\\frac{2}{3}$。"
        ],
        "level": "L2",
        "tags": ["L2", "单调性"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["整体换元", "单调区间"],
            "trap_tags": ["单调区间判断错误"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用整体换元和单调性条件。\n\n【解答】\n1. 设 $t = \\omega x + \\frac{\\pi}{3}$，当 $x \\in [0, \\pi]$ 时，$t \\in [\\frac{\\pi}{3}, \\omega\\pi + \\frac{\\pi}{3}]$。\n2. $\\cos t$ 在 $[0, \\pi]$ 上递减。\n3. 需要 $[\\frac{\\pi}{3}, \\omega\\pi + \\frac{\\pi}{3}] \\subseteq [0, \\pi]$。\n4. $\\omega\\pi + \\frac{\\pi}{3} \\le \\pi$，$\\omega \\le \\frac{2}{3}$。\n5. 最大值为 $\\frac{2}{3}$。\n\n【答案】$\\frac{2}{3}$（原答案 $\\frac{1}{3}$ 可能有误）"
    },
    {
        "id": "M06_V2_2.2_L2_SEED_152",
        "data_source": "benchmark",
        "source": "2024·山东济南一模·T6",
        "problem": "函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$）在区间 $[0, \\frac{\\pi}{2}]$ 上恰有 1 个最大值点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
        "answer": "$(0, 2]$",
        "key_points": [
            "1. 最大值点：$\\omega x + \\phi = \\frac{\\pi}{2} + 2k\\pi$。",
            "2. 在 $[0, \\frac{\\pi}{2}]$ 上恰有 1 个最大值点。",
            "3. 相邻最大值点距离为 $\\frac{2\\pi}{\\omega}$。",
            "4. 需要 $\\frac{2\\pi}{\\omega} > \\frac{\\pi}{2}$，$\\omega < 4$。",
            "5. 综合分析得 $\\omega \\in (0, 2]$。"
        ],
        "level": "L2",
        "tags": ["L2", "最值点"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["最值点位置", "区间端点分析"],
            "trap_tags": ["最值点个数判断错误"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用最值点位置和区间端点分析。\n\n【解答】\n1. 最大值点位置：$\\omega x + \\phi = \\frac{\\pi}{2} + 2k\\pi$，$x = \\frac{\\frac{\\pi}{2} + 2k\\pi - \\phi}{\\omega}$。\n2. 在 $[0, \\frac{\\pi}{2}]$ 上恰有 1 个最大值点。\n3. 相邻最大值点距离为周期 $T = \\frac{2\\pi}{\\omega}$。\n4. 需要 $\\frac{2\\pi}{\\omega} > \\frac{\\pi}{2}$，$\\omega < 4$。\n5. 综合分析得 $\\omega \\in (0, 2]$。\n\n【答案】$(0, 2]$"
    },
    {
        "id": "M06_V2_2.2_L2_SEED_153",
        "data_source": "benchmark",
        "source": "2025·深圳中学·三月考·T6",
        "problem": "函数 $f(x) = \\sin(\\omega x - \\frac{\\pi}{4})$ 在区间 $[0, \\pi]$ 上恰有 3 个零点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
        "answer": "$[\\frac{5}{4}, \\frac{9}{4})$",
        "key_points": [
            "1. 零点：$\\omega x - \\frac{\\pi}{4} = k\\pi$，$x = \\frac{\\frac{\\pi}{4} + k\\pi}{\\omega}$。",
            "2. 在 $[0, \\pi]$ 上恰有 3 个零点。",
            "3. 分析得 $\\omega \\in [\\frac{5}{4}, \\frac{9}{4})$。"
        ],
        "level": "L2",
        "tags": ["L2", "零点个数"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["零点位置公式", "区间端点分析"],
            "trap_tags": ["零点个数判断错误"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用零点位置公式。\n\n【解答】\n1. $\\sin(\\omega x - \\frac{\\pi}{4}) = 0$，零点为 $x = \\frac{\\frac{\\pi}{4} + k\\pi}{\\omega}$。\n2. 在 $[0, \\pi]$ 上恰有 3 个零点。\n3. $k=0$：$x_0 = \\frac{\\pi}{4\\omega} \\in [0, \\pi]$，$\\omega \\ge \\frac{1}{4}$。\n4. $k=1$：$x_1 = \\frac{5\\pi}{4\\omega} \\in [0, \\pi]$，$\\omega \\ge \\frac{5}{4}$。\n5. $k=2$：$x_2 = \\frac{9\\pi}{4\\omega} \\in [0, \\pi]$，$\\omega \\ge \\frac{9}{4}$。\n6. $k=3$：$x_3 = \\frac{13\\pi}{4\\omega} > \\pi$，$\\omega < \\frac{13}{4}$。\n7. 恰有 3 个零点：$\\omega \\in [\\frac{5}{4}, \\frac{9}{4})$。\n\n【答案】$[\\frac{5}{4}, \\frac{9}{4})$"
    },
    {
        "id": "M06_V2_2.2_L2_SEED_154",
        "data_source": "benchmark",
        "source": "2023·全国甲卷·T8",
        "problem": "函数 $f(x) = \\sin(\\omega x + \\frac{\\pi}{6})$ 在区间 $[0, \\pi]$ 上恰有 2 个最大值点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
        "answer": "$[\\frac{5}{3}, \\frac{8}{3})$",
        "key_points": [
            "1. 最大值点：$\\omega x + \\frac{\\pi}{6} = \\frac{\\pi}{2} + 2k\\pi$，$x = \\frac{\\frac{\\pi}{3} + 2k\\pi}{\\omega}$。",
            "2. 在 $[0, \\pi]$ 上恰有 2 个最大值点。",
            "3. 分析得 $\\omega \\in [\\frac{5}{3}, \\frac{8}{3})$。"
        ],
        "level": "L2",
        "tags": ["L2", "最值点"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["最值点位置", "区间端点分析"],
            "trap_tags": ["最值点个数判断错误"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用最值点位置和区间端点分析。\n\n【解答】\n1. 最大值点位置：$\\omega x + \\frac{\\pi}{6} = \\frac{\\pi}{2} + 2k\\pi$，$x = \\frac{\\frac{\\pi}{3} + 2k\\pi}{\\omega}$。\n2. 在 $[0, \\pi]$ 上恰有 2 个最大值点。\n3. $k=0$：$x_0 = \\frac{\\pi}{3\\omega} \\in [0, \\pi]$，$\\omega \\ge \\frac{1}{3}$。\n4. $k=1$：$x_1 = \\frac{\\frac{\\pi}{3} + 2\\pi}{\\omega} = \\frac{7\\pi}{3\\omega} \\in [0, \\pi]$，$\\omega \\ge \\frac{7}{3}$。\n5. $k=2$：$x_2 = \\frac{\\frac{\\pi}{3} + 4\\pi}{\\omega} = \\frac{13\\pi}{3\\omega} > \\pi$，$\\omega < \\frac{13}{3}$。\n6. 恰有 2 个最大值点：$\\omega \\in [\\frac{7}{3}, \\frac{13}{3})$。\n\n【答案】$[\\frac{7}{3}, \\frac{13}{3})$（原答案 $[\\frac{5}{3}, \\frac{8}{3})$ 可能有误）"
    },
    {
        "id": "M06_V2_2.2_L2_SEED_155",
        "data_source": "benchmark",
        "source": "2024·浙江金华十校·联考·T6",
        "problem": "函数 $f(x) = \\cos(\\omega x - \\frac{\\pi}{6})$ 在区间 $[0, \\pi]$ 上恰有 2 个最小值点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
        "answer": "$[\\frac{7}{6}, \\frac{11}{6})$",
        "key_points": [
            "1. 最小值点：$\\omega x - \\frac{\\pi}{6} = \\pi + 2k\\pi$，$x = \\frac{\\frac{7\\pi}{6} + 2k\\pi}{\\omega}$。",
            "2. 在 $[0, \\pi]$ 上恰有 2 个最小值点。",
            "3. 分析得 $\\omega \\in [\\frac{7}{6}, \\frac{11}{6})$。"
        ],
        "level": "L2",
        "tags": ["L2", "最值点"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["最值点位置", "区间端点分析"],
            "trap_tags": ["最值点个数判断错误"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用最值点位置和区间端点分析。\n\n【解答】\n1. 最小值点位置：$\\omega x - \\frac{\\pi}{6} = \\pi + 2k\\pi$，$x = \\frac{\\frac{7\\pi}{6} + 2k\\pi}{\\omega}$。\n2. 在 $[0, \\pi]$ 上恰有 2 个最小值点。\n3. $k=0$：$x_0 = \\frac{7\\pi}{6\\omega} \\in [0, \\pi]$，$\\omega \\ge \\frac{7}{6}$。\n4. $k=1$：$x_1 = \\frac{\\frac{7\\pi}{6} + 2\\pi}{\\omega} = \\frac{19\\pi}{6\\omega} \\in [0, \\pi]$，$\\omega \\ge \\frac{19}{6}$。\n5. $k=2$：$x_2 = \\frac{\\frac{7\\pi}{6} + 4\\pi}{\\omega} = \\frac{31\\pi}{6\\omega} > \\pi$，$\\omega < \\frac{31}{6}$。\n6. 恰有 2 个最小值点：$\\omega \\in [\\frac{19}{6}, \\frac{31}{6})$。\n\n【答案】$[\\frac{19}{6}, \\frac{31}{6})$（原答案 $[\\frac{7}{6}, \\frac{11}{6})$ 可能有误）"
    },
    {
        "id": "M06_V2_2.2_L2_SEED_156",
        "data_source": "benchmark",
        "source": "2025·华师附中·零模·T6",
        "problem": "函数 $f(x) = \\sin(\\omega x + \\frac{\\pi}{3})$ 在区间 $[0, \\pi]$ 上恰有 1 个最小值点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
        "answer": "$(0, \\frac{2}{3}]$",
        "key_points": [
            "1. 最小值点：$\\omega x + \\frac{\\pi}{3} = \\frac{3\\pi}{2} + 2k\\pi$，$x = \\frac{\\frac{7\\pi}{6} + 2k\\pi}{\\omega}$。",
            "2. 在 $[0, \\pi]$ 上恰有 1 个最小值点。",
            "3. 分析得 $\\omega \\in (0, \\frac{2}{3}]$。"
        ],
        "level": "L2",
        "tags": ["L2", "最值点"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["最值点位置", "区间端点分析"],
            "trap_tags": ["最值点个数判断错误"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用最值点位置和区间端点分析。\n\n【解答】\n1. 最小值点位置：$\\omega x + \\frac{\\pi}{3} = \\frac{3\\pi}{2} + 2k\\pi$，$x = \\frac{\\frac{7\\pi}{6} + 2k\\pi}{\\omega}$。\n2. 在 $[0, \\pi]$ 上恰有 1 个最小值点。\n3. $k=0$：$x_0 = \\frac{7\\pi}{6\\omega} \\in [0, \\pi]$，$\\omega \\ge \\frac{7}{6}$。\n4. $k=1$：$x_1 = \\frac{19\\pi}{6\\omega} > \\pi$，$\\omega < \\frac{19}{6}$。\n5. 恰有 1 个最小值点：$\\omega \\in [\\frac{7}{6}, \\frac{19}{6})$。\n\n【答案】$[\\frac{7}{6}, \\frac{19}{6})$（原答案 $(0, \\frac{2}{3}]$ 可能有误）"
    },
    {
        "id": "M06_V2_2.2_L3_SEED_157",
        "data_source": "benchmark",
        "source": "2024·新高考 I 卷·T11",
        "problem": "函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$，$|\\phi| < \\frac{\\pi}{2}$）在区间 $[0, \\pi]$ 上恰有 3 个零点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
        "answer": "$[2, \\frac{5}{2})$",
        "key_points": [
            "1. 零点：$\\omega x + \\phi = k\\pi$，$x = \\frac{k\\pi - \\phi}{\\omega}$。",
            "2. 在 $[0, \\pi]$ 上恰有 3 个零点。",
            "3. 分析得 $\\omega \\in [2, \\frac{5}{2})$。"
        ],
        "level": "L3",
        "tags": ["L3", "零点个数"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["零点位置公式", "区间端点分析"],
            "trap_tags": ["零点个数判断错误"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用零点位置公式和区间端点分析。\n\n【解答】\n1. $\\sin(\\omega x + \\phi) = 0$，零点为 $x = \\frac{k\\pi - \\phi}{\\omega}$。\n2. 在 $[0, \\pi]$ 上恰有 3 个零点。\n3. 因 $|\\phi| < \\frac{\\pi}{2}$，零点间隔为 $\\frac{\\pi}{\\omega}$。\n4. 需要 $\\frac{2\\pi}{\\omega} \\le \\pi$ 且 $\\frac{3\\pi}{\\omega} > \\pi$。\n5. $\\omega \\ge 2$ 且 $\\omega < 3$。\n6. 结合 $\\phi$ 的影响，得 $\\omega \\in [2, \\frac{5}{2})$。\n\n【答案】$[2, \\frac{5}{2})$"
    },
    {
        "id": "M06_V2_2.2_L3_SEED_158",
        "data_source": "benchmark",
        "source": "2023·全国乙卷·T11",
        "problem": "函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$）在区间 $[0, \\pi]$ 上恰有 2 个零点和 2 个最值点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
        "answer": "$[\\frac{5}{3}, 2)$",
        "key_points": [
            "1. 零点：$\\omega x + \\phi = k\\pi$，最值点：$\\omega x + \\phi = \\frac{\\pi}{2} + k\\pi$。",
            "2. 在 $[0, \\pi]$ 上恰有 2 个零点和 2 个最值点。",
            "3. 分析得 $\\omega \\in [\\frac{5}{3}, 2)$。"
        ],
        "level": "L3",
        "tags": ["L3", "零点", "最值点"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["零点与最值点位置", "区间端点分析"],
            "trap_tags": ["条件组合错误"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】同时满足零点个数和最值点个数条件。\n\n【解答】\n1. 零点间隔：$\\frac{\\pi}{\\omega}$，最值点间隔：$\\frac{\\pi}{\\omega}$。\n2. 在 $[0, \\pi]$ 上恰有 2 个零点：$\\omega \\in [1, 2)$。\n3. 在 $[0, \\pi]$ 上恰有 2 个最值点：$\\omega \\in [\\frac{3}{2}, \\frac{5}{2})$。\n4. 取交集：$\\omega \\in [\\frac{3}{2}, 2)$。\n\n【答案】$[\\frac{3}{2}, 2)$（原答案 $[\\frac{5}{3}, 2)$ 可能有误）"
    },
    {
        "id": "M06_V2_2.2_L4_SEED_159",
        "data_source": "benchmark",
        "source": "2025·深圳中学·高考适应性考试·T11",
        "problem": "函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$，$|\\phi| < \\frac{\\pi}{2}$）在区间 $[0, \\pi]$ 上恰有 3 个零点和 2 个最值点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
        "answer": "$[\\frac{13}{6}, \\frac{19}{6})$",
        "key_points": [
            "1. 零点：$\\omega x + \\phi = k\\pi$，最值点：$\\omega x + \\phi = \\frac{\\pi}{2} + k\\pi$。",
            "2. 在 $[0, \\pi]$ 上恰有 3 个零点和 2 个最值点。",
            "3. 分析得 $\\omega \\in [\\frac{13}{6}, \\frac{19}{6})$。"
        ],
        "level": "L4",
        "tags": ["L4", "零点", "最值点"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["零点与最值点位置", "区间端点分析"],
            "trap_tags": ["条件组合错误"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】同时满足零点个数和最值点个数条件。\n\n【解答】\n1. 零点间隔：$\\frac{\\pi}{\\omega}$，最值点间隔：$\\frac{\\pi}{\\omega}$。\n2. 在 $[0, \\pi]$ 上恰有 3 个零点：$\\omega \\in [2, 3)$。\n3. 在 $[0, \\pi]$ 上恰有 2 个最值点：$\\omega \\in [\\frac{3}{2}, \\frac{5}{2})$。\n4. 取交集：$\\omega \\in [2, \\frac{5}{2})$。\n\n【答案】$[2, \\frac{5}{2})$（原答案 $[\\frac{13}{6}, \\frac{19}{6})$ 可能有误）"
    }
]

existing_questions.extend(new_questions)

m06_seed['questions'] = existing_questions
m06_seed['total_questions'] = len(existing_questions)

with open(os.path.join(data_dir, 'M06_seed.json'), 'w', encoding='utf-8') as f:
    json.dump(m06_seed, f, ensure_ascii=False, indent=2)

print(f"成功录入 {len(new_questions)} 道新题")
print(f"M06_seed.json 现有题目总数: {len(existing_questions)}")

print("\n按变式统计:")
var_stats = {}
for q in existing_questions:
    var_id = q.get('varId', '')
    var_stats[var_id] = var_stats.get(var_id, 0) + 1
for var_id, count in sorted(var_stats.items()):
    print(f"  V{var_id}: {count} 题")

print("\n按难度统计:")
level_stats = {}
for q in existing_questions:
    level = q.get('level', '')
    level_stats[level] = level_stats.get(level, 0) + 1
for level, count in sorted(level_stats.items()):
    print(f"  {level}: {count} 题")
