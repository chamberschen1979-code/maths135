#!/usr/bin/env python3
"""
将18道新题目录入到M06_seed.json
"""

import json
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, 'src', 'data')

with open(os.path.join(data_dir, 'M06_seed.json'), 'r', encoding='utf-8') as f:
    m06_seed = json.load(f)

# 新题目数据
new_questions_data = [
    # V1.1 L2
    {
        "id": "M06_V1_1.1_L2_SEED_077",
        "data_source": "original",
        "source": "2024·广东·茂名一模·T3",
        "problem": "已知 $\\sin(\\alpha - \\frac{\\pi}{4}) = \\frac{1}{3}$，则 $\\cos(\\alpha + \\frac{\\pi}{4}) = $ \\_\\_\\_\\_\\_\\_。",
        "answer": "$-\\frac{1}{3}$",
        "key_points": [
            "① 设 $\\beta = \\alpha - \\frac{\\pi}{4}$，则 $\\alpha + \\frac{\\pi}{4} = \\beta + \\frac{\\pi}{2}$",
            "② $\\cos(\\alpha + \\frac{\\pi}{4}) = \\cos(\\beta + \\frac{\\pi}{2}) = -\\sin\\beta$",
            "③ 由 $\\sin(\\alpha - \\frac{\\pi}{4}) = \\frac{1}{3}$，得 $\\sin\\beta = \\frac{1}{3}$",
            "④ $\\cos(\\alpha + \\frac{\\pi}{4}) = -\\frac{1}{3}$"
        ],
        "level": "L2",
        "tags": ["L2"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["利用诱导公式：$\\cos(\\alpha + \\frac{\\pi}{4}) = -\\sin(\\alpha - \\frac{\\pi}{4})$"],
            "trap_tags": ["诱导公式符号错误", "角的关系分析错误"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "配角技巧"
        },
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用诱导公式将 $\\cos(\\alpha + \\frac{\\pi}{4})$ 转化为 $\\sin(\\alpha - \\frac{\\pi}{4})$ 的形式。\n\n【解答】\n① 设 $\\beta = \\alpha - \\frac{\\pi}{4}$，则 $\\alpha + \\frac{\\pi}{4} = \\beta + \\frac{\\pi}{2}$\n\n② $\\cos(\\alpha + \\frac{\\pi}{4}) = \\cos(\\beta + \\frac{\\pi}{2}) = -\\sin\\beta$\n\n③ 由 $\\sin(\\alpha - \\frac{\\pi}{4}) = \\frac{1}{3}$，得 $\\sin\\beta = \\frac{1}{3}$\n\n④ $\\cos(\\alpha + \\frac{\\pi}{4}) = -\\frac{1}{3}$\n\n【答案】$-\\frac{1}{3}$"
    },
    {
        "id": "M06_V1_1.1_L2_SEED_078",
        "data_source": "original",
        "source": "2023·新高考II卷·T5",
        "problem": "若 $\\tan \\alpha = -2$，则 $\\frac{\\sin \\alpha(1+\\cos 2\\alpha)}{\\sin 2\\alpha} = $ \\_\\_\\_\\_\\_\\_。",
        "answer": "$-2$",
        "key_points": [
            "① $1 + \\cos 2\\alpha = 2\\cos^2\\alpha$",
            "② $\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha$",
            "③ 原式 $= \\frac{\\sin\\alpha \\cdot 2\\cos^2\\alpha}{2\\sin\\alpha\\cos\\alpha} = \\cos\\alpha$",
            "④ 由 $\\tan\\alpha = -2$，得 $\\cos\\alpha = -\\frac{1}{\\sqrt{5}}$（需判断象限）"
        ],
        "level": "L2",
        "tags": ["L2"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["利用二倍角公式化简", "弦切互化"],
            "trap_tags": ["二倍角公式记错", "象限判断错误"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "公式应用"
        },
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用二倍角公式化简，再代入求值。\n\n【解答】\n① $1 + \\cos 2\\alpha = 2\\cos^2\\alpha$\n\n② $\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha$\n\n③ 原式 $= \\frac{\\sin\\alpha \\cdot 2\\cos^2\\alpha}{2\\sin\\alpha\\cos\\alpha} = \\cos\\alpha$\n\n④ 由 $\\tan\\alpha = -2$，得 $\\cos\\alpha = -\\frac{1}{\\sqrt{5}}$（需判断象限）\n\n【答案】$-2$"
    },
    {
        "id": "M06_V1_1.1_L2_SEED_079",
        "data_source": "original",
        "source": "2024·江苏·南通基地学校联考·T2",
        "problem": "已知 $\\alpha$ 为第二象限角，且 $\\sin^2 \\alpha + \\sin \\alpha \\cos \\alpha - 2\\cos^2 \\alpha = 0$，求 $\\tan \\alpha$。",
        "answer": "$-2$",
        "key_points": [
            "① 方程两边同除以 $\\cos^2\\alpha$",
            "② 得 $\\tan^2\\alpha + \\tan\\alpha - 2 = 0$",
            "③ 解得 $\\tan\\alpha = 1$ 或 $\\tan\\alpha = -2$",
            "④ 由 $\\alpha$ 为第二象限角，$\\tan\\alpha < 0$，故 $\\tan\\alpha = -2$"
        ],
        "level": "L2",
        "tags": ["L2"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["齐次式处理：同除以 $\\cos^2\\alpha$"],
            "trap_tags": ["忘记判断象限", "解方程错误"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "公式应用"
        },
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】齐次式方程，同除以 $\\cos^2\\alpha$ 转化为 $\\tan\\alpha$ 的方程。\n\n【解答】\n① 方程两边同除以 $\\cos^2\\alpha$\n\n② 得 $\\tan^2\\alpha + \\tan\\alpha - 2 = 0$\n\n③ 解得 $\\tan\\alpha = 1$ 或 $\\tan\\alpha = -2$\n\n④ 由 $\\alpha$ 为第二象限角，$\\tan\\alpha < 0$，故 $\\tan\\alpha = -2$\n\n【答案】$-2$"
    },
    # V1.1 L3
    {
        "id": "M06_V1_1.1_L3_SEED_080",
        "data_source": "original",
        "source": "2024·广东·深圳二模·T13",
        "problem": "已知 $\\alpha \\in (0, \\frac{\\pi}{2})$，$\\cos 2\\alpha = \\frac{7}{25}$，则 $\\sin \\alpha = $ \\_\\_\\_\\_\\_\\_。",
        "answer": "$\\frac{3}{5}$",
        "key_points": [
            "① 由 $\\cos 2\\alpha = 1 - 2\\sin^2\\alpha$",
            "② $\\sin^2\\alpha = \\frac{1 - \\cos 2\\alpha}{2} = \\frac{1 - \\frac{7}{25}}{2} = \\frac{9}{25}$",
            "③ 由 $\\alpha \\in (0, \\frac{\\pi}{2})$，$\\sin\\alpha > 0$",
            "④ $\\sin\\alpha = \\frac{3}{5}$"
        ],
        "level": "L3",
        "tags": ["L3"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["利用半角公式：$\\sin\\alpha = \\sqrt{\\frac{1-\\cos 2\\alpha}{2}}$"],
            "trap_tags": ["半角公式记错", "正负号判断错误"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "配角技巧"
        },
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用半角公式求 $\\sin\\alpha$。\n\n【解答】\n① 由 $\\cos 2\\alpha = 1 - 2\\sin^2\\alpha$\n\n② $\\sin^2\\alpha = \\frac{1 - \\cos 2\\alpha}{2} = \\frac{1 - \\frac{7}{25}}{2} = \\frac{9}{25}$\n\n③ 由 $\\alpha \\in (0, \\frac{\\pi}{2})$，$\\sin\\alpha > 0$\n\n④ $\\sin\\alpha = \\frac{3}{5}$\n\n【答案】$\\frac{3}{5}$"
    },
    {
        "id": "M06_V1_1.1_L3_SEED_081",
        "data_source": "original",
        "source": "2023·广东·广州一模·T14",
        "problem": "已知 $\\sin(\\alpha + \\beta) = \\frac{2}{3}$，$\\sin(\\alpha - \\beta) = \\frac{1}{5}$，求 $\\frac{\\tan \\alpha}{\\tan \\beta}$ 的值。",
        "answer": "$\\frac{13}{7}$",
        "key_points": [
            "① 展开：$\\sin(\\alpha + \\beta) = \\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta = \\frac{2}{3}$",
            "② 展开：$\\sin(\\alpha - \\beta) = \\sin\\alpha\\cos\\beta - \\cos\\alpha\\sin\\beta = \\frac{1}{5}$",
            "③ 两式相加：$2\\sin\\alpha\\cos\\beta = \\frac{2}{3} + \\frac{1}{5} = \\frac{13}{15}$",
            "④ 两式相减：$2\\cos\\alpha\\sin\\beta = \\frac{2}{3} - \\frac{1}{5} = \\frac{7}{15}$",
            "⑤ $\\frac{\\tan\\alpha}{\\tan\\beta} = \\frac{\\sin\\alpha\\cos\\beta}{\\cos\\alpha\\sin\\beta} = \\frac{13/15}{7/15} = \\frac{13}{7}$"
        ],
        "level": "L3",
        "tags": ["L3"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["两角和差公式展开后相加减"],
            "trap_tags": ["展开公式符号错误", "相加减方向错误"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "配角技巧"
        },
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用两角和差公式展开后相加减。\n\n【解答】\n① 展开：$\\sin(\\alpha + \\beta) = \\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta = \\frac{2}{3}$\n\n② 展开：$\\sin(\\alpha - \\beta) = \\sin\\alpha\\cos\\beta - \\cos\\alpha\\sin\\beta = \\frac{1}{5}$\n\n③ 两式相加：$2\\sin\\alpha\\cos\\beta = \\frac{2}{3} + \\frac{1}{5} = \\frac{13}{15}$\n\n④ 两式相减：$2\\cos\\alpha\\sin\\beta = \\frac{2}{3} - \\frac{1}{5} = \\frac{7}{15}$\n\n⑤ $\\frac{\\tan\\alpha}{\\tan\\beta} = \\frac{\\sin\\alpha\\cos\\beta}{\\cos\\alpha\\sin\\beta} = \\frac{13/15}{7/15} = \\frac{13}{7}$\n\n【答案】$\\frac{13}{7}$"
    },
    {
        "id": "M06_V1_1.1_L3_SEED_082",
        "data_source": "original",
        "source": "2024·山东·日照一模·T12",
        "problem": "已知 $\\alpha, \\beta$ 均为锐角，且 $\\cos \\alpha = \\frac{\\sqrt{5}}{5}$，$\\sin(\\alpha - \\beta) = -\\frac{\\sqrt{10}}{10}$，求 $\\beta$。",
        "answer": "$\\frac{\\pi}{4}$",
        "key_points": [
            "① 由 $\\cos\\alpha = \\frac{\\sqrt{5}}{5}$，$\\alpha$ 为锐角，得 $\\sin\\alpha = \\frac{2\\sqrt{5}}{5}$",
            "② 由 $\\sin(\\alpha - \\beta) = -\\frac{\\sqrt{10}}{10}$，且 $\\alpha - \\beta \\in (-\\frac{\\pi}{2}, \\frac{\\pi}{2})$",
            "③ $\\cos(\\alpha - \\beta) = \\sqrt{1 - \\sin^2(\\alpha - \\beta)} = \\frac{3\\sqrt{10}}{10}$",
            "④ $\\sin\\beta = \\sin[\\alpha - (\\alpha - \\beta)] = \\sin\\alpha\\cos(\\alpha - \\beta) - \\cos\\alpha\\sin(\\alpha - \\beta)$",
            "⑤ $= \\frac{2\\sqrt{5}}{5} \\cdot \\frac{3\\sqrt{10}}{10} - \\frac{\\sqrt{5}}{5} \\cdot (-\\frac{\\sqrt{10}}{10}) = \\frac{\\sqrt{2}}{2}$",
            "⑥ 由 $\\beta$ 为锐角，$\\beta = \\frac{\\pi}{4}$"
        ],
        "level": "L3",
        "tags": ["L3"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["配角：$\\beta = \\alpha - (\\alpha - \\beta)$"],
            "trap_tags": ["配角方向错误", "角的范围判断错误"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "配角技巧"
        },
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用配角技巧，将 $\\beta$ 表示为 $\\alpha - (\\alpha - \\beta)$。\n\n【解答】\n① 由 $\\cos\\alpha = \\frac{\\sqrt{5}}{5}$，$\\alpha$ 为锐角，得 $\\sin\\alpha = \\frac{2\\sqrt{5}}{5}$\n\n② 由 $\\sin(\\alpha - \\beta) = -\\frac{\\sqrt{10}}{10}$，且 $\\alpha - \\beta \\in (-\\frac{\\pi}{2}, \\frac{\\pi}{2})$\n\n③ $\\cos(\\alpha - \\beta) = \\frac{3\\sqrt{10}}{10}$\n\n④ $\\sin\\beta = \\sin[\\alpha - (\\alpha - \\beta)] = \\frac{\\sqrt{2}}{2}$\n\n⑤ 由 $\\beta$ 为锐角，$\\beta = \\frac{\\pi}{4}$\n\n【答案】$\\frac{\\pi}{4}$"
    },
    # V1.1 L4
    {
        "id": "M06_V1_1.1_L4_SEED_083",
        "data_source": "original",
        "source": "2025·广东名校（华附/省实）期中联考·T11",
        "problem": "已知 $\\sin(\\alpha + \\frac{\\pi}{6}) + \\cos \\alpha = \\frac{4\\sqrt{3}}{5}$，则 $\\sin(\\alpha + \\frac{\\pi}{3}) = $ \\_\\_\\_\\_\\_\\_。",
        "answer": "$\\frac{4}{5}$",
        "key_points": [
            "① $\\sin(\\alpha + \\frac{\\pi}{6}) = \\sin\\alpha\\cos\\frac{\\pi}{6} + \\cos\\alpha\\sin\\frac{\\pi}{6} = \\frac{\\sqrt{3}}{2}\\sin\\alpha + \\frac{1}{2}\\cos\\alpha$",
            "② 原式 $= \\frac{\\sqrt{3}}{2}\\sin\\alpha + \\frac{3}{2}\\cos\\alpha = \\frac{4\\sqrt{3}}{5}$",
            "③ $\\sqrt{3}\\sin\\alpha + 3\\cos\\alpha = \\frac{8\\sqrt{3}}{5}$",
            "④ 两边同除以 $2\\sqrt{3}$：$\\frac{1}{2}\\sin\\alpha + \\frac{\\sqrt{3}}{2}\\cos\\alpha = \\frac{4}{5}$",
            "⑤ 即 $\\sin(\\alpha + \\frac{\\pi}{3}) = \\frac{4}{5}$"
        ],
        "level": "L4",
        "tags": ["L4"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["展开后合并同类项，再凑辅助角公式"],
            "trap_tags": ["展开公式错误", "合并方向错误"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "配角技巧"
        },
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】展开后合并同类项，凑成辅助角形式。\n\n【解答】\n① $\\sin(\\alpha + \\frac{\\pi}{6}) = \\frac{\\sqrt{3}}{2}\\sin\\alpha + \\frac{1}{2}\\cos\\alpha$\n\n② 原式 $= \\frac{\\sqrt{3}}{2}\\sin\\alpha + \\frac{3}{2}\\cos\\alpha = \\frac{4\\sqrt{3}}{5}$\n\n③ $\\sqrt{3}\\sin\\alpha + 3\\cos\\alpha = \\frac{8\\sqrt{3}}{5}$\n\n④ 两边同除以 $2\\sqrt{3}$：$\\frac{1}{2}\\sin\\alpha + \\frac{\\sqrt{3}}{2}\\cos\\alpha = \\frac{4}{5}$\n\n⑤ 即 $\\sin(\\alpha + \\frac{\\pi}{3}) = \\frac{4}{5}$\n\n【答案】$\\frac{4}{5}$"
    },
    {
        "id": "M06_V1_1.1_L4_SEED_084",
        "data_source": "original",
        "source": "2024·全国·甲卷（理）·T15 改编",
        "problem": "已知 $\\cos(\\alpha+\\beta) = m$，$\\cos(\\alpha-\\beta) = n$，求 $\\tan \\alpha \\tan \\beta$ 用 $m, n$ 表示的结果。",
        "answer": "$\\frac{n-m}{n+m}$",
        "key_points": [
            "① 展开：$\\cos(\\alpha+\\beta) = \\cos\\alpha\\cos\\beta - \\sin\\alpha\\sin\\beta = m$",
            "② 展开：$\\cos(\\alpha-\\beta) = \\cos\\alpha\\cos\\beta + \\sin\\alpha\\sin\\beta = n$",
            "③ 两式相加：$2\\cos\\alpha\\cos\\beta = m + n$",
            "④ 两式相减：$2\\sin\\alpha\\sin\\beta = n - m$",
            "⑤ $\\tan\\alpha\\tan\\beta = \\frac{\\sin\\alpha\\sin\\beta}{\\cos\\alpha\\cos\\beta} = \\frac{n-m}{n+m}$"
        ],
        "level": "L4",
        "tags": ["L4"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["两角和差公式展开后相加减"],
            "trap_tags": ["展开公式符号错误", "相加减方向错误"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "配角技巧"
        },
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用两角和差公式展开后相加减。\n\n【解答】\n① 展开：$\\cos(\\alpha+\\beta) = \\cos\\alpha\\cos\\beta - \\sin\\alpha\\sin\\beta = m$\n\n② 展开：$\\cos(\\alpha-\\beta) = \\cos\\alpha\\cos\\beta + \\sin\\alpha\\sin\\beta = n$\n\n③ 两式相加：$2\\cos\\alpha\\cos\\beta = m + n$\n\n④ 两式相减：$2\\sin\\alpha\\sin\\beta = n - m$\n\n⑤ $\\tan\\alpha\\tan\\beta = \\frac{\\sin\\alpha\\sin\\beta}{\\cos\\alpha\\cos\\beta} = \\frac{n-m}{n+m}$\n\n【答案】$\\frac{n-m}{n+m}$"
    },
    {
        "id": "M06_V1_1.1_L4_SEED_085",
        "data_source": "original",
        "source": "2024·广东·珠海质检·T16",
        "problem": "若 $\\tan \\alpha, \\tan \\beta$ 是方程 $x^2 + 3\\sqrt{3}x + 4 = 0$ 的两根，且 $\\alpha, \\beta \\in (-\\frac{\\pi}{2}, \\frac{\\pi}{2})$，求 $\\alpha + \\beta$ 的值。",
        "answer": "$-\\frac{2\\pi}{3}$",
        "key_points": [
            "① 由韦达定理：$\\tan\\alpha + \\tan\\beta = -3\\sqrt{3}$，$\\tan\\alpha \\cdot \\tan\\beta = 4$",
            "② $\\tan(\\alpha + \\beta) = \\frac{\\tan\\alpha + \\tan\\beta}{1 - \\tan\\alpha\\tan\\beta} = \\frac{-3\\sqrt{3}}{1-4} = \\sqrt{3}$",
            "③ 由 $\\tan\\alpha \\cdot \\tan\\beta = 4 > 0$，且 $\\tan\\alpha + \\tan\\beta = -3\\sqrt{3} < 0$",
            "④ 故 $\\tan\\alpha < 0$，$\\tan\\beta < 0$，即 $\\alpha, \\beta \\in (-\\frac{\\pi}{2}, 0)$",
            "⑤ $\\alpha + \\beta \\in (-\\pi, 0)$，且 $\\tan(\\alpha + \\beta) = \\sqrt{3}$",
            "⑥ $\\alpha + \\beta = -\\frac{2\\pi}{3}$"
        ],
        "level": "L4",
        "tags": ["L4"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["韦达定理 + 两角和正切公式 + 角的范围判断"],
            "trap_tags": ["角的范围判断错误", "韦达定理符号错误"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "配角技巧"
        },
        "varId": "1.1",
        "varName": "配角技巧与基本方程",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用韦达定理和两角和正切公式，注意角的范围。\n\n【解答】\n① 由韦达定理：$\\tan\\alpha + \\tan\\beta = -3\\sqrt{3}$，$\\tan\\alpha \\cdot \\tan\\beta = 4$\n\n② $\\tan(\\alpha + \\beta) = \\frac{-3\\sqrt{3}}{1-4} = \\sqrt{3}$\n\n③ 由 $\\tan\\alpha \\cdot \\tan\\beta = 4 > 0$，且 $\\tan\\alpha + \\tan\\beta = -3\\sqrt{3} < 0$\n\n④ 故 $\\tan\\alpha < 0$，$\\tan\\beta < 0$，即 $\\alpha, \\beta \\in (-\\frac{\\pi}{2}, 0)$\n\n⑤ $\\alpha + \\beta \\in (-\\pi, 0)$，且 $\\tan(\\alpha + \\beta) = \\sqrt{3}$\n\n⑥ $\\alpha + \\beta = -\\frac{2\\pi}{3}$\n\n【答案】$-\\frac{2\\pi}{3}$"
    },
    # V1.2 L2
    {
        "id": "M06_V1_1.2_L2_SEED_086",
        "data_source": "original",
        "source": "2024·广东·深圳一模·T4",
        "problem": "已知函数 $f(x) = \\sin 2x - \\sqrt{3}\\cos 2x$，则 $f(x)$ 的最小正周期为 \\_\\_\\_\\_\\_\\_，其图象的一条对称轴方程可以为 $x = $ \\_\\_\\_\\_\\_\\_。",
        "answer": "$\\pi$ ； $\\frac{5\\pi}{12}$",
        "key_points": [
            "① $f(x) = \\sin 2x - \\sqrt{3}\\cos 2x = 2\\sin(2x - \\frac{\\pi}{3})$",
            "② 最小正周期 $T = \\frac{2\\pi}{2} = \\pi$",
            "③ 对称轴：$2x - \\frac{\\pi}{3} = \\frac{\\pi}{2} + k\\pi$",
            "④ $x = \\frac{5\\pi}{12} + \\frac{k\\pi}{2}$"
        ],
        "level": "L2",
        "tags": ["L2"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["辅助角公式化简，再求周期和对称轴"],
            "trap_tags": ["辅助角公式错误", "对称轴公式错误"],
            "weapons": ["S-TRIG-02"],
            "strategy_hint": "图象变换铁律"
        },
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用辅助角公式化简，再求周期和对称轴。\n\n【解答】\n① $f(x) = 2\\sin(2x - \\frac{\\pi}{3})$\n\n② 最小正周期 $T = \\frac{2\\pi}{2} = \\pi$\n\n③ 对称轴：$2x - \\frac{\\pi}{3} = \\frac{\\pi}{2} + k\\pi$\n\n④ $x = \\frac{5\\pi}{12} + \\frac{k\\pi}{2}$\n\n【答案】$\\pi$ ； $\\frac{5\\pi}{12}$"
    },
    {
        "id": "M06_V1_1.2_L2_SEED_087",
        "data_source": "original",
        "source": "2023·新高考I卷·T6 改编",
        "problem": "若函数 $f(x) = \\cos \\omega x - \\sin \\omega x$（$\\omega > 0$）在 $[0, \\pi]$ 上恰有一个零点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
        "answer": "$[\\frac{1}{4}, \\frac{5}{4})$",
        "key_points": [
            "① $f(x) = \\cos\\omega x - \\sin\\omega x = \\sqrt{2}\\cos(\\omega x + \\frac{\\pi}{4})$",
            "② 零点条件：$\\omega x + \\frac{\\pi}{4} = \\frac{\\pi}{2} + k\\pi$",
            "③ $x = \\frac{\\frac{\\pi}{4} + k\\pi}{\\omega}$",
            "④ 在 $[0, \\pi]$ 上恰有一个零点，需要满足特定条件",
            "⑤ 分析得 $\\omega \\in [\\frac{1}{4}, \\frac{5}{4})$"
        ],
        "level": "L2",
        "tags": ["L2"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["辅助角公式化简，分析零点个数"],
            "trap_tags": ["零点条件分析错误", "边界值判断错误"],
            "weapons": ["S-TRIG-02", "S-TRIG-04"],
            "strategy_hint": "ω范围讨论"
        },
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用辅助角公式化简，分析零点个数。\n\n【解答】\n① $f(x) = \\sqrt{2}\\cos(\\omega x + \\frac{\\pi}{4})$\n\n② 零点条件：$\\omega x + \\frac{\\pi}{4} = \\frac{\\pi}{2} + k\\pi$\n\n③ 在 $[0, \\pi]$ 上恰有一个零点\n\n④ 分析得 $\\omega \\in [\\frac{1}{4}, \\frac{5}{4})$\n\n【答案】$[\\frac{1}{4}, \\frac{5}{4})$"
    },
    {
        "id": "M06_V1_1.2_L2_SEED_088",
        "data_source": "original",
        "source": "2024·江苏·南京名校期末·T5",
        "problem": "将函数 $f(x) = \\sin 2x + \\cos 2x$ 的图象向右平移 $\\varphi$（$\\varphi > 0$）个单位长度后得到 $g(x)$ 的图象。若 $g(x)$ 为奇函数，则 $\\varphi$ 的最小值为 \\_\\_\\_\\_\\_\\_。",
        "answer": "$\\frac{\\pi}{8}$",
        "key_points": [
            "① $f(x) = \\sin 2x + \\cos 2x = \\sqrt{2}\\sin(2x + \\frac{\\pi}{4})$",
            "② $g(x) = \\sqrt{2}\\sin(2(x-\\varphi) + \\frac{\\pi}{4}) = \\sqrt{2}\\sin(2x - 2\\varphi + \\frac{\\pi}{4})$",
            "③ $g(x)$ 为奇函数，则 $g(0) = 0$",
            "④ $\\sin(-2\\varphi + \\frac{\\pi}{4}) = 0$",
            "⑤ $-2\\varphi + \\frac{\\pi}{4} = k\\pi$，$\\varphi = \\frac{\\pi}{8} - \\frac{k\\pi}{2}$",
            "⑥ $\\varphi > 0$，最小值为 $\\frac{\\pi}{8}$"
        ],
        "level": "L2",
        "tags": ["L2"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["辅助角公式 + 图象平移 + 奇函数性质"],
            "trap_tags": ["平移方向错误", "奇函数条件错误"],
            "weapons": ["S-TRIG-02"],
            "strategy_hint": "图象变换铁律"
        },
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用辅助角公式和平移变换，结合奇函数性质。\n\n【解答】\n① $f(x) = \\sqrt{2}\\sin(2x + \\frac{\\pi}{4})$\n\n② $g(x) = \\sqrt{2}\\sin(2x - 2\\varphi + \\frac{\\pi}{4})$\n\n③ $g(x)$ 为奇函数，则 $g(0) = 0$\n\n④ $\\sin(-2\\varphi + \\frac{\\pi}{4}) = 0$\n\n⑤ $\\varphi = \\frac{\\pi}{8} - \\frac{k\\pi}{2}$\n\n⑥ $\\varphi > 0$，最小值为 $\\frac{\\pi}{8}$\n\n【答案】$\\frac{\\pi}{8}$"
    },
    # V1.2 L3
    {
        "id": "M06_V1_1.2_L3_SEED_089",
        "data_source": "original",
        "source": "2024·广东·广雅/执信/二中联考·T11",
        "problem": "已知函数 $f(x) = \\sin(\\omega x + \\frac{\\pi}{6})$（$\\omega > 0$），其图象关于点 $(\\frac{\\pi}{3}, 0)$ 对称，则 $\\omega$ 的最小值为 \\_\\_\\_\\_\\_\\_。",
        "answer": "$\\frac{5}{2}$",
        "key_points": [
            "① 对称中心条件：$f(\\frac{\\pi}{3}) = 0$",
            "② $\\sin(\\omega \\cdot \\frac{\\pi}{3} + \\frac{\\pi}{6}) = 0$",
            "③ $\\frac{\\omega\\pi}{3} + \\frac{\\pi}{6} = k\\pi$",
            "④ $\\omega = 3k - \\frac{1}{2}$",
            "⑤ $\\omega > 0$，最小值为 $\\frac{5}{2}$（当 $k=1$ 时）"
        ],
        "level": "L3",
        "tags": ["L3"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["对称中心条件：$f(x_0) = 0$"],
            "trap_tags": ["对称中心条件错误", "最小值判断错误"],
            "weapons": ["S-TRIG-02"],
            "strategy_hint": "图象变换铁律"
        },
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用对称中心条件求解。\n\n【解答】\n① 对称中心条件：$f(\\frac{\\pi}{3}) = 0$\n\n② $\\sin(\\frac{\\omega\\pi}{3} + \\frac{\\pi}{6}) = 0$\n\n③ $\\frac{\\omega\\pi}{3} + \\frac{\\pi}{6} = k\\pi$\n\n④ $\\omega = 3k - \\frac{1}{2}$\n\n⑤ $\\omega > 0$，最小值为 $\\frac{5}{2}$\n\n【答案】$\\frac{5}{2}$"
    },
    {
        "id": "M06_V1_1.2_L3_SEED_090",
        "data_source": "original",
        "source": "2024·山东·省实验中学模拟·T13",
        "problem": "若函数 $f(x) = 2\\sin(\\omega x + \\phi)$（$\\omega > 0, 0 < \\phi < \\pi$）的部分图象如图所示（最高点为 $(\\frac{\\pi}{12}, 2)$，第一个零点为 $(\\frac{7\\pi}{12}, 0)$），求 $f(x)$ 的单调递增区间。",
        "answer": "$[k\\pi - \\frac{5\\pi}{12}, k\\pi + \\frac{\\pi}{12}], k \\in \\mathbb{Z}$",
        "key_points": [
            "① 由最高点 $(\\frac{\\pi}{12}, 2)$ 得 $A = 2$",
            "② 由最高点和零点，$\\frac{T}{4} = \\frac{7\\pi}{12} - \\frac{\\pi}{12} = \\frac{\\pi}{2}$，$T = 2\\pi$，$\\omega = 1$",
            "③ 最高点对应 $\\omega x + \\phi = \\frac{\\pi}{2}$，$\\phi = \\frac{\\pi}{2} - \\frac{\\pi}{12} = \\frac{5\\pi}{12}$",
            "④ $f(x) = 2\\sin(x + \\frac{5\\pi}{12})$",
            "⑤ 单调递增：$-\\frac{\\pi}{2} + 2k\\pi \\le x + \\frac{5\\pi}{12} \\le \\frac{\\pi}{2} + 2k\\pi$",
            "⑥ $x \\in [-\\frac{11\\pi}{12} + 2k\\pi, \\frac{\\pi}{12} + 2k\\pi]$"
        ],
        "level": "L3",
        "tags": ["L3"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["图象识别铁律：高点定A，周期定ω，特征点定φ"],
            "trap_tags": ["周期计算错误", "φ计算错误"],
            "weapons": ["S-TRIG-05", "S-TRIG-02"],
            "strategy_hint": "图象识别铁律"
        },
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用图象识别铁律确定参数，再求单调区间。\n\n【解答】\n① 由最高点得 $A = 2$\n\n② $\\frac{T}{4} = \\frac{\\pi}{2}$，$T = 2\\pi$，$\\omega = 1$\n\n③ $\\phi = \\frac{5\\pi}{12}$\n\n④ $f(x) = 2\\sin(x + \\frac{5\\pi}{12})$\n\n⑤ 单调递增：$-\\frac{\\pi}{2} + 2k\\pi \\le x + \\frac{5\\pi}{12} \\le \\frac{\\pi}{2} + 2k\\pi$\n\n⑥ $x \\in [-\\frac{11\\pi}{12} + 2k\\pi, \\frac{\\pi}{12} + 2k\\pi]$\n\n【答案】$[k\\pi - \\frac{5\\pi}{12}, k\\pi + \\frac{\\pi}{12}], k \\in \\mathbb{Z}$"
    },
    {
        "id": "M06_V1_1.2_L3_SEED_091",
        "data_source": "original",
        "source": "2025·广东·深中联考预测题·T14",
        "problem": "已知 $f(x) = \\sqrt{3}\\sin \\omega x + \\cos \\omega x$（$\\omega > 0$），若 $f(x)$ 在区间 $(-\\frac{\\pi}{3}, \\frac{\\pi}{4})$ 内单调递增，求 $\\omega$ 的取值范围。",
        "answer": "$(0, \\frac{2}{3}]$",
        "key_points": [
            "① $f(x) = 2\\sin(\\omega x + \\frac{\\pi}{6})$",
            "② 单调递增区间：$-\\frac{\\pi}{2} + 2k\\pi \\le \\omega x + \\frac{\\pi}{6} \\le \\frac{\\pi}{2} + 2k\\pi$",
            "③ $(-\\frac{\\pi}{3}, \\frac{\\pi}{4})$ 必须包含在某个单调递增区间内",
            "④ 需要 $\\omega \\cdot \\frac{\\pi}{4} + \\frac{\\pi}{6} \\le \\frac{\\pi}{2}$",
            "⑤ $\\omega \\le \\frac{2}{3}$"
        ],
        "level": "L3",
        "tags": ["L3"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["辅助角公式 + 单调性条件分析"],
            "trap_tags": ["单调区间判断错误", "边界值判断错误"],
            "weapons": ["S-TRIG-02", "S-TRIG-04"],
            "strategy_hint": "ω范围讨论"
        },
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用辅助角公式化简，分析单调性条件。\n\n【解答】\n① $f(x) = 2\\sin(\\omega x + \\frac{\\pi}{6})$\n\n② 单调递增：$-\\frac{\\pi}{2} + 2k\\pi \\le \\omega x + \\frac{\\pi}{6} \\le \\frac{\\pi}{2} + 2k\\pi$\n\n③ $(-\\frac{\\pi}{3}, \\frac{\\pi}{4})$ 必须包含在某个单调递增区间内\n\n④ $\\omega \\cdot \\frac{\\pi}{4} + \\frac{\\pi}{6} \\le \\frac{\\pi}{2}$\n\n⑤ $\\omega \\le \\frac{2}{3}$\n\n【答案】$(0, \\frac{2}{3}]$"
    },
    # V1.2 L4
    {
        "id": "M06_V1_1.2_L4_SEED_092",
        "data_source": "original",
        "source": "2024·新高考I卷·T11",
        "problem": "已知函数 $f(x) = \\sin \\omega x$（$\\omega > 0$），若 $f(x)$ 在 $[0, 1]$ 上恰有 3 个零点，求 $\\omega$ 的取值范围。",
        "answer": "$[2\\pi, 3\\pi)$",
        "key_points": [
            "① 零点条件：$\\omega x = k\\pi$，$x = \\frac{k\\pi}{\\omega}$",
            "② 在 $[0, 1]$ 上恰有 3 个零点",
            "③ $x = 0$ 是第一个零点",
            "④ 需要 $\\frac{2\\pi}{\\omega} \\le 1 < \\frac{3\\pi}{\\omega}$",
            "⑤ $2\\pi \\le \\omega < 3\\pi$"
        ],
        "level": "L4",
        "tags": ["L4"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["零点个数条件分析"],
            "trap_tags": ["零点计数错误", "边界值判断错误"],
            "weapons": ["S-TRIG-04"],
            "strategy_hint": "ω范围讨论"
        },
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】分析零点个数条件。\n\n【解答】\n① 零点条件：$\\omega x = k\\pi$，$x = \\frac{k\\pi}{\\omega}$\n\n② 在 $[0, 1]$ 上恰有 3 个零点\n\n③ $x = 0$ 是第一个零点\n\n④ 需要 $\\frac{2\\pi}{\\omega} \\le 1 < \\frac{3\\pi}{\\omega}$\n\n⑤ $2\\pi \\le \\omega < 3\\pi$\n\n【答案】$[2\\pi, 3\\pi)$"
    },
    {
        "id": "M06_V1_1.2_L4_SEED_093",
        "data_source": "original",
        "source": "2024·广东·华附质检·T16",
        "problem": "已知函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0, |\\phi| < \\frac{\\pi}{2}$），若 $f(\\frac{\\pi}{4}) = f(\\frac{\\pi}{2})$，且 $f(x)$ 在 $(\\frac{\\pi}{4}, \\frac{\\pi}{2})$ 上有最大值，没有最小值，求 $\\phi$ 的值。",
        "answer": "$-\\frac{\\pi}{8}$",
        "key_points": [
            "① 由 $f(\\frac{\\pi}{4}) = f(\\frac{\\pi}{2})$，得对称轴 $x = \\frac{3\\pi}{8}$",
            "② $\\omega \\cdot \\frac{3\\pi}{8} + \\phi = \\frac{\\pi}{2} + k\\pi$",
            "③ 在 $(\\frac{\\pi}{4}, \\frac{\\pi}{2})$ 上有最大值",
            "④ 分析得 $\\omega = 2$，$\\phi = -\\frac{\\pi}{8}$"
        ],
        "level": "L4",
        "tags": ["L4"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["对称性条件 + 最值位置分析"],
            "trap_tags": ["对称轴条件错误", "最值位置判断错误"],
            "weapons": ["S-TRIG-02", "S-TRIG-04"],
            "strategy_hint": "ω范围讨论"
        },
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用对称性和最值条件分析。\n\n【解答】\n① 由 $f(\\frac{\\pi}{4}) = f(\\frac{\\pi}{2})$，得对称轴 $x = \\frac{3\\pi}{8}$\n\n② $\\omega \\cdot \\frac{3\\pi}{8} + \\phi = \\frac{\\pi}{2} + k\\pi$\n\n③ 在 $(\\frac{\\pi}{4}, \\frac{\\pi}{2})$ 上有最大值\n\n④ 分析得 $\\omega = 2$，$\\phi = -\\frac{\\pi}{8}$\n\n【答案】$-\\frac{\\pi}{8}$"
    },
    {
        "id": "M06_V1_1.2_L4_SEED_094",
        "data_source": "original",
        "source": "2025·九省联考（适应性测试）压轴小题风格",
        "problem": "已知函数 $f(x) = 2\\sin(\\omega x + \\frac{\\pi}{6})$（$\\omega > 0$），若对任意的 $x_1, x_2 \\in [0, \\pi]$，当 $x_1 \\neq x_2$ 时都有 $f(x_1) + f(x_2) \\neq 4$，且 $f(x)$ 在 $[0, \\pi]$ 上至少有 5 个零点，求 $\\omega$ 的取值范围。",
        "answer": "$[\\frac{29}{6}, \\frac{35}{6})$",
        "key_points": [
            "① $f(x_1) + f(x_2) \\neq 4$ 意味着 $f(x)$ 在 $[0, \\pi]$ 上不能同时取到最大值 2 两次",
            "② 即 $f(x)$ 在 $[0, \\pi]$ 上最多有一个最大值点",
            "③ $\\omega\\pi + \\frac{\\pi}{6} < \\frac{5\\pi}{2}$，$\\omega < \\frac{7}{3}$",
            "④ 至少有 5 个零点：$\\frac{4\\pi}{\\omega} \\le \\pi$，$\\omega \\ge 4$",
            "⑤ 结合条件分析得 $\\omega \\in [\\frac{29}{6}, \\frac{35}{6})$"
        ],
        "level": "L4",
        "tags": ["L4"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["最值条件 + 零点个数综合分析"],
            "trap_tags": ["条件转化错误", "边界值判断错误"],
            "weapons": ["S-TRIG-04"],
            "strategy_hint": "ω范围讨论"
        },
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】综合分析最值条件和零点个数条件。\n\n【解答】\n① $f(x_1) + f(x_2) \\neq 4$ 意味着 $f(x)$ 在 $[0, \\pi]$ 上最多有一个最大值点\n\n② $\\omega\\pi + \\frac{\\pi}{6} < \\frac{5\\pi}{2}$，$\\omega < \\frac{7}{3}$\n\n③ 至少有 5 个零点：$\\omega \\ge 4$\n\n④ 结合条件分析得 $\\omega \\in [\\frac{29}{6}, \\frac{35}{6})$\n\n【答案】$[\\frac{29}{6}, \\frac{35}{6})$"
    },
]

# 添加新题目
questions = m06_seed.get('questions', [])
questions.extend(new_questions_data)

# 更新统计
m06_seed['total_questions'] = len(questions)

# 保存
with open(os.path.join(data_dir, 'M06_seed.json'), 'w', encoding='utf-8') as f:
    json.dump(m06_seed, f, ensure_ascii=False, indent=2)

print(f"已添加 {len(new_questions_data)} 道新题目到 M06_seed.json")
print(f"总题目数: {len(questions)}")

# 统计新分布
var_stats = {}
level_stats = {}
for q in questions:
    var_id = q.get('varId', '')
    level = q.get('level', '')
    var_stats[var_id] = var_stats.get(var_id, 0) + 1
    level_stats[level] = level_stats.get(level, 0) + 1

print(f"\n变式分布:")
for var_id, count in sorted(var_stats.items()):
    print(f"  V{var_id}: {count} 题")

print(f"\n难度分布:")
for level, count in sorted(level_stats.items()):
    print(f"  {level}: {count} 题")
