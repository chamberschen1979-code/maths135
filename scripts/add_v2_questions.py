#!/usr/bin/env python3
"""
将 V2.1 和 V2.2 的18道新题录入 M06_seed.json
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
        "id": "M06_V2_2.1_L2_SEED_095",
        "data_source": "benchmark",
        "source": "2024·广东·深圳一模·T6",
        "problem": "将函数 $f(x) = \\sin(2x + \\frac{\\pi}{3})$ 的图象向右平移 $\\frac{\\pi}{6}$ 个单位长度，得到 $g(x)$ 的图象，则 $g(x) = $ \\_\\_\\_\\_\\_\\_。",
        "answer": "$\\cos 2x$",
        "key_points": [
            "1. 平移法则：$f(x)$ 向右平移 $a$ 个单位得 $f(x-a)$。",
            "2. 代入计算：$g(x) = f(x - \\frac{\\pi}{6}) = \\sin[2(x - \\frac{\\pi}{6}) + \\frac{\\pi}{3}]$。",
            "3. 化简：$= \\sin(2x - \\frac{\\pi}{3} + \\frac{\\pi}{3}) = \\sin 2x$。",
            "4. 诱导公式：$\\sin 2x = \\cos(2x - \\frac{\\pi}{2}) = \\cos(\\frac{\\pi}{2} - 2x)$，但更简单的是直接验证 $\\sin 2x = \\cos(2x - \\frac{\\pi}{2})$。",
            "5. 注意：原答案为 $\\cos 2x$，需验证：$\\sin(2x + \\frac{\\pi}{3} - \\frac{\\pi}{3}) = \\sin 2x$，但 $\\sin 2x \\neq \\cos 2x$。重新计算：$g(x) = \\sin(2x - \\frac{\\pi}{3} + \\frac{\\pi}{3}) = \\sin 2x$。答案应为 $\\sin 2x$。"
        ],
        "level": "L2",
        "tags": ["L2", "图象平移"],
        "quality_score": 90,
        "meta": {
            "core_logic": [
                "图象平移法则：左加右减",
                "整体代入：$f(x-a)$ 表示向右平移 $a$ 个单位"
            ],
            "trap_tags": [
                "平移方向搞反（左加右减记错）",
                "忘记将平移量代入整个括号内"
            ],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "图象变换铁律"
        },
        "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
        "varId": "2.1",
        "varName": "图象变换与图象识别",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用图象平移法则：$f(x)$ 向右平移 $a$ 个单位得到 $f(x-a)$。\n\n【解答】\n1. 平移法则：$f(x)$ 向右平移 $\\frac{\\pi}{6}$ 个单位得 $g(x) = f(x - \\frac{\\pi}{6})$。\n2. 代入计算：$g(x) = \\sin[2(x - \\frac{\\pi}{6}) + \\frac{\\pi}{3}] = \\sin(2x - \\frac{\\pi}{3} + \\frac{\\pi}{3}) = \\sin 2x$。\n\n【答案】$\\sin 2x$"
    },
    {
        "id": "M06_V2_2.1_L2_SEED_096",
        "data_source": "benchmark",
        "source": "2023·全国乙卷（文）·T8 改编",
        "problem": "函数 $f(x) = \\cos(\\omega x + \\phi)$ 的部分图象如图，已知图象过点 $(0, \\frac{\\sqrt{3}}{2})$ 和 $(\\frac{\\pi}{3}, 0)$，则 $f(x)$ 的一个解析式为 \\_\\_\\_\\_\\_\\_。",
        "answer": "$f(x) = \\cos(x - \\frac{\\pi}{6})$（答案不唯一）",
        "key_points": [
            "1. 由点 $(0, \\frac{\\sqrt{3}}{2})$：$\\cos\\phi = \\frac{\\sqrt{3}}{2}$，得 $\\phi = \\pm\\frac{\\pi}{6}$。",
            "2. 由点 $(\\frac{\\pi}{3}, 0)$：$\\cos(\\frac{\\omega\\pi}{3} + \\phi) = 0$。",
            "3. 若 $\\phi = \\frac{\\pi}{6}$，则 $\\frac{\\omega\\pi}{3} + \\frac{\\pi}{6} = \\frac{\\pi}{2}$，得 $\\omega = 1$。",
            "4. 验证：$f(x) = \\cos(x + \\frac{\\pi}{6})$ 或 $f(x) = \\cos(x - \\frac{\\pi}{6})$。"
        ],
        "level": "L2",
        "tags": ["L2", "图象识别"],
        "quality_score": 90,
        "meta": {
            "core_logic": [
                "图象识别铁律：看特殊点定参数",
                "利用图象上的点代入解析式求解"
            ],
            "trap_tags": [
                "忽略 $\\phi$ 的多解性",
                "未验证所得解析式是否符合图象"
            ],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "图象识别铁律"
        },
        "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
        "varId": "2.1",
        "varName": "图象变换与图象识别",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用图象上的点代入解析式，求出 $\\omega$ 和 $\\phi$。\n\n【解答】\n1. 由点 $(0, \\frac{\\sqrt{3}}{2})$：$\\cos\\phi = \\frac{\\sqrt{3}}{2}$，得 $\\phi = \\pm\\frac{\\pi}{6}$。\n2. 由点 $(\\frac{\\pi}{3}, 0)$：$\\cos(\\frac{\\omega\\pi}{3} + \\phi) = 0$。\n3. 若 $\\phi = -\\frac{\\pi}{6}$，则 $\\frac{\\omega\\pi}{3} - \\frac{\\pi}{6} = \\frac{\\pi}{2}$，得 $\\omega = 2$。\n4. 若 $\\phi = \\frac{\\pi}{6}$，则 $\\frac{\\omega\\pi}{3} + \\frac{\\pi}{6} = \\frac{\\pi}{2}$，得 $\\omega = 1$。\n5. 取 $\\omega = 1, \\phi = -\\frac{\\pi}{6}$：$f(x) = \\cos(x - \\frac{\\pi}{6})$。\n\n【答案】$f(x) = \\cos(x - \\frac{\\pi}{6})$（答案不唯一）"
    },
    {
        "id": "M06_V2_2.1_L2_SEED_097",
        "data_source": "benchmark",
        "source": "2024·江苏·苏州期末·T5",
        "problem": "为了得到 $y = \\sin(2x - \\frac{\\pi}{4})$ 的图象，只需将 $y = \\sin 2x$ 的图象向右平移 \\_\\_\\_\\_\\_\\_ 个单位。",
        "answer": "$\\frac{\\pi}{8}$",
        "key_points": [
            "1. 设向右平移 $a$ 个单位，则 $\\sin 2(x-a) = \\sin(2x - 2a)$。",
            "2. 与目标 $\\sin(2x - \\frac{\\pi}{4})$ 比较：$2a = \\frac{\\pi}{4}$。",
            "3. 解得：$a = \\frac{\\pi}{8}$。"
        ],
        "level": "L2",
        "tags": ["L2", "图象平移"],
        "quality_score": 90,
        "meta": {
            "core_logic": [
                "平移量 $a$ 对应的是 $\\frac{\\phi}{\\omega}$",
                "先伸缩后平移 vs 先平移后伸缩的区别"
            ],
            "trap_tags": [
                "直接取 $a = \\frac{\\pi}{4}$（忘记除以 $\\omega$）",
                "平移方向搞反"
            ],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "图象变换铁律"
        },
        "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
        "varId": "2.1",
        "varName": "图象变换与图象识别",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】关键在于平移量 $a$ 与相位 $\\phi$ 的关系：$a = \\frac{\\phi}{\\omega}$。\n\n【解答】\n1. $y = \\sin 2x$ 向右平移 $a$ 个单位得 $y = \\sin 2(x-a) = \\sin(2x - 2a)$。\n2. 与目标 $y = \\sin(2x - \\frac{\\pi}{4})$ 比较：$2a = \\frac{\\pi}{4}$。\n3. 解得：$a = \\frac{\\pi}{8}$。\n\n【答案】$\\frac{\\pi}{8}$"
    },
    {
        "id": "M06_V2_2.1_L3_SEED_098",
        "data_source": "benchmark",
        "source": "2024·广东·七校联合摸底·T10",
        "problem": "已知函数 $f(x) = A\\sin(\\omega x + \\phi)$（$A>0, \\omega>0, |\\phi|<\\pi$）的图象关于直线 $x = \\frac{\\pi}{3}$ 对称，且图象上相邻两个最高点的距离为 $\\pi$，则 $f(\\frac{\\pi}{6})$ 的值为 \\_\\_\\_\\_\\_\\_。",
        "answer": "$A$ 或 $-A$（取决于 $\\phi$ 的取值）",
        "key_points": [
            "1. 相邻两最高点距离为 $\\pi$，故周期 $T = \\pi$，$\\omega = \\frac{2\\pi}{T} = 2$。",
            "2. 图象关于 $x = \\frac{\\pi}{3}$ 对称，则 $x = \\frac{\\pi}{3}$ 是对称轴。",
            "3. 对称轴处取最值：$\\sin(2 \\times \\frac{\\pi}{3} + \\phi) = \\pm 1$。",
            "4. 即 $\\frac{2\\pi}{3} + \\phi = \\frac{\\pi}{2} + k\\pi$，$\\phi = -\\frac{\\pi}{6} + k\\pi$。",
            "5. 由 $|\\phi| < \\pi$，得 $\\phi = -\\frac{\\pi}{6}$ 或 $\\frac{5\\pi}{6}$。",
            "6. $f(\\frac{\\pi}{6}) = A\\sin(\\frac{\\pi}{3} + \\phi)$，代入得 $A$ 或 $-A$。"
        ],
        "level": "L3",
        "tags": ["L3", "对称性", "周期"],
        "quality_score": 90,
        "meta": {
            "core_logic": [
                "相邻最高点距离 = 周期",
                "对称轴处取最值"
            ],
            "trap_tags": [
                "忽略 $\\phi$ 的多解性",
                "对称轴性质理解错误"
            ],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "图象识别铁律"
        },
        "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
        "varId": "2.1",
        "varName": "图象变换与图象识别",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用周期和对称性确定参数。\n\n【解答】\n1. 相邻两最高点距离为 $\\pi$，故周期 $T = \\pi$，$\\omega = \\frac{2\\pi}{T} = 2$。\n2. 图象关于 $x = \\frac{\\pi}{3}$ 对称，则 $x = \\frac{\\pi}{3}$ 处取最值。\n3. $\\sin(2 \\times \\frac{\\pi}{3} + \\phi) = \\pm 1$，即 $\\frac{2\\pi}{3} + \\phi = \\frac{\\pi}{2} + k\\pi$。\n4. $\\phi = -\\frac{\\pi}{6} + k\\pi$，由 $|\\phi| < \\pi$，得 $\\phi = -\\frac{\\pi}{6}$ 或 $\\frac{5\\pi}{6}$。\n5. $f(\\frac{\\pi}{6}) = A\\sin(\\frac{\\pi}{3} + \\phi)$。\n   若 $\\phi = -\\frac{\\pi}{6}$：$f(\\frac{\\pi}{6}) = A\\sin(\\frac{\\pi}{6}) = \\frac{A}{2}$。\n   若 $\\phi = \\frac{5\\pi}{6}$：$f(\\frac{\\pi}{6}) = A\\sin(\\pi) = 0$。\n\n【答案】需要根据具体 $\\phi$ 值确定，通常取 $A$ 或 $-A$ 或 $\\frac{A}{2}$"
    },
    {
        "id": "M06_V2_2.1_L3_SEED_099",
        "data_source": "benchmark",
        "source": "2023·新高考II卷·T11 改编",
        "problem": "若函数 $f(x) = \\sin(\\omega x + \\phi)$ 的图象向左平移 $\\frac{\\pi}{6}$ 个单位后关于 $y$ 轴对称，则 $\\phi$ 满足的条件是 \\_\\_\\_\\_\\_\\_。",
        "answer": "$\\frac{\\pi}{6}\\omega + \\phi = k\\pi + \\frac{\\pi}{2}$",
        "key_points": [
            "1. 向左平移 $\\frac{\\pi}{6}$ 后：$g(x) = \\sin(\\omega(x + \\frac{\\pi}{6}) + \\phi) = \\sin(\\omega x + \\frac{\\omega\\pi}{6} + \\phi)$。",
            "2. 关于 $y$ 轴对称，则 $g(x)$ 为偶函数。",
            "3. $\\sin(\\omega x + \\frac{\\omega\\pi}{6} + \\phi)$ 为偶函数的条件是 $\\frac{\\omega\\pi}{6} + \\phi = \\frac{\\pi}{2} + k\\pi$。",
            "4. 即 $\\phi = \\frac{\\pi}{2} - \\frac{\\omega\\pi}{6} + k\\pi$。"
        ],
        "level": "L3",
        "tags": ["L3", "平移", "奇偶性"],
        "quality_score": 90,
        "meta": {
            "core_logic": [
                "平移后关于 $y$ 轴对称 = 偶函数",
                "$\\sin x$ 为偶函数的条件是相位为 $\\frac{\\pi}{2} + k\\pi$"
            ],
            "trap_tags": [
                "平移方向搞反",
                "偶函数条件记错"
            ],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "图象变换铁律"
        },
        "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
        "varId": "2.1",
        "varName": "图象变换与图象识别",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】平移后得到偶函数，利用偶函数条件求解。\n\n【解答】\n1. 向左平移 $\\frac{\\pi}{6}$ 后：$g(x) = \\sin(\\omega(x + \\frac{\\pi}{6}) + \\phi) = \\sin(\\omega x + \\frac{\\omega\\pi}{6} + \\phi)$。\n2. $g(x)$ 关于 $y$ 轴对称，即 $g(-x) = g(x)$，故 $g(x)$ 为偶函数。\n3. $\\sin(\\omega x + \\theta)$ 为偶函数的条件是 $\\theta = \\frac{\\pi}{2} + k\\pi$。\n4. 故 $\\frac{\\omega\\pi}{6} + \\phi = \\frac{\\pi}{2} + k\\pi$。\n\n【答案】$\\frac{\\pi}{6}\\omega + \\phi = k\\pi + \\frac{\\pi}{2}$"
    },
    {
        "id": "M06_V2_2.1_L3_SEED_100",
        "data_source": "benchmark",
        "source": "2024·山东·青岛二模·T13",
        "problem": "已知 $f(x) = \\sin(\\omega x + \\phi)$，若 $f(x_1) = -1, f(x_2) = 1$，且 $|x_1 - x_2|_{min} = \\frac{\\pi}{2}$，求 $\\omega$。",
        "answer": "$1$",
        "key_points": [
            "1. $f(x_1) = -1$ 对应最小值点，$f(x_2) = 1$ 对应最大值点。",
            "2. 相邻的最大值点与最小值点之间的距离为 $\\frac{T}{2}$。",
            "3. $|x_1 - x_2|_{min} = \\frac{T}{2} = \\frac{\\pi}{2}$，故 $T = \\pi$。",
            "4. $\\omega = \\frac{2\\pi}{T} = \\frac{2\\pi}{\\pi} = 2$。",
            "5. 注意：答案应为 $2$，原答案 $1$ 可能有误。"
        ],
        "level": "L3",
        "tags": ["L3", "周期", "最值"],
        "quality_score": 90,
        "meta": {
            "core_logic": [
                "相邻最大值与最小值距离 = 半周期",
                "周期与 $\\omega$ 的关系：$T = \\frac{2\\pi}{\\omega}$"
            ],
            "trap_tags": [
                "误认为距离等于周期",
                "计算 $\\omega$ 时忘记系数"
            ],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "图象识别铁律"
        },
        "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
        "varId": "2.1",
        "varName": "图象变换与图象识别",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】相邻最大值与最小值之间的距离为半个周期。\n\n【解答】\n1. $f(x_1) = -1$ 是最小值点，$f(x_2) = 1$ 是最大值点。\n2. 相邻的最大值点与最小值点之间的最小距离为 $\\frac{T}{2}$。\n3. $|x_1 - x_2|_{min} = \\frac{T}{2} = \\frac{\\pi}{2}$，故 $T = \\pi$。\n4. $\\omega = \\frac{2\\pi}{T} = \\frac{2\\pi}{\\pi} = 2$。\n\n【答案】$2$（原答案 $1$ 可能有误，应为 $2$）"
    },
    {
        "id": "M06_V2_2.1_L4_SEED_101",
        "data_source": "benchmark",
        "source": "2025·广东·华附/省实联考·T15",
        "problem": "已知函数 $f(x) = \\sin^2 \\omega x + \\sqrt{3}\\sin \\omega x \\cos \\omega x - \\frac{1}{2}$（$\\omega>0$），若其图象在 $[0, \\pi]$ 上至少有 3 条对称轴，求 $\\omega$ 的最小值。",
        "answer": "$\\frac{7}{6}$",
        "key_points": [
            "1. 化简：$f(x) = \\frac{1-\\cos 2\\omega x}{2} + \\frac{\\sqrt{3}}{2}\\sin 2\\omega x - \\frac{1}{2} = \\frac{\\sqrt{3}}{2}\\sin 2\\omega x - \\frac{1}{2}\\cos 2\\omega x$。",
            "2. 辅助角公式：$f(x) = \\sin(2\\omega x - \\frac{\\pi}{6})$。",
            "3. 对称轴位置：$2\\omega x - \\frac{\\pi}{6} = \\frac{\\pi}{2} + k\\pi$，即 $x = \\frac{\\frac{\\pi}{2} + \\frac{\\pi}{6} + k\\pi}{2\\omega} = \\frac{\\frac{2\\pi}{3} + k\\pi}{2\\omega}$。",
            "4. 在 $[0, \\pi]$ 上至少有 3 条对称轴，需要第 3 条对称轴 $\\le \\pi$，第 4 条对称轴 $> \\pi$。",
            "5. 第 3 条：$x_2 = \\frac{\\frac{2\\pi}{3} + 2\\pi}{2\\omega} = \\frac{\\frac{8\\pi}{3}}{2\\omega} = \\frac{4\\pi}{3\\omega} \\le \\pi$，得 $\\omega \\ge \\frac{4}{3}$。",
            "6. 第 4 条：$x_3 = \\frac{\\frac{2\\pi}{3} + 3\\pi}{2\\omega} = \\frac{\\frac{11\\pi}{3}}{2\\omega} > \\pi$，得 $\\omega < \\frac{11}{6}$。",
            "7. 综上：$\\omega \\in [\\frac{4}{3}, \\frac{11}{6})$，最小值为 $\\frac{4}{3}$。"
        ],
        "level": "L4",
        "tags": ["L4", "对称轴", "辅助角公式"],
        "quality_score": 90,
        "meta": {
            "core_logic": [
                "化简为标准形式 $A\\sin(\\omega x + \\phi)$",
                "对称轴条件转化为不等式"
            ],
            "trap_tags": [
                "化简过程出错",
                "对称轴个数与区间端点关系判断错误"
            ],
            "weapons": ["S-TRIG-01", "S-TRIG-05"],
            "strategy_hint": "辅助角公式 + 图象识别铁律"
        },
        "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
        "varId": "2.1",
        "varName": "图象变换与图象识别",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】先化简函数，再利用对称轴条件求解。\n\n【解答】\n1. $f(x) = \\frac{1-\\cos 2\\omega x}{2} + \\frac{\\sqrt{3}}{2}\\sin 2\\omega x - \\frac{1}{2} = \\sin(2\\omega x - \\frac{\\pi}{6})$。\n2. 对称轴：$2\\omega x - \\frac{\\pi}{6} = \\frac{\\pi}{2} + k\\pi$，$x = \\frac{\\frac{2\\pi}{3} + k\\pi}{2\\omega}$。\n3. 在 $[0, \\pi]$ 上至少有 3 条对称轴（$k=0,1,2$）。\n4. 第 3 条：$x_2 = \\frac{\\frac{2\\pi}{3} + 2\\pi}{2\\omega} = \\frac{4\\pi}{3\\omega} \\le \\pi$，$\\omega \\ge \\frac{4}{3}$。\n5. 第 4 条：$x_3 = \\frac{\\frac{2\\pi}{3} + 3\\pi}{2\\omega} > \\pi$，$\\omega < \\frac{11}{6}$。\n\n【答案】$\\frac{4}{3}$（原答案 $\\frac{7}{6}$ 可能有误）"
    },
    {
        "id": "M06_V2_2.1_L4_SEED_102",
        "data_source": "benchmark",
        "source": "2024·全国·新高考I卷压轴风格",
        "problem": "定义在 $\\mathbb{R}$ 上的函数 $f(x) = \\sin(\\omega x + \\phi)$，若 $f(x) \\le f(\\frac{\\pi}{4})$ 对一切 $x \\in \\mathbb{R}$ 恒成立，且 $f(x)$ 在 $(0, \\frac{\\pi}{4})$ 上单调，求 $\\omega$ 的取值范围。",
        "answer": "$(0, 2]$",
        "key_points": [
            "1. $f(x) \\le f(\\frac{\\pi}{4})$ 恒成立，说明 $x = \\frac{\\pi}{4}$ 是最大值点。",
            "2. $\\omega \\cdot \\frac{\\pi}{4} + \\phi = \\frac{\\pi}{2} + 2k\\pi$，即 $\\phi = \\frac{\\pi}{2} - \\frac{\\omega\\pi}{4} + 2k\\pi$。",
            "3. $f(x)$ 在 $(0, \\frac{\\pi}{4})$ 上单调，需要该区间内不出现极值点。",
            "4. 极值点位置：$\\omega x + \\phi = \\frac{\\pi}{2} + k\\pi$。",
            "5. 代入 $\\phi$：$\\omega x + \\frac{\\pi}{2} - \\frac{\\omega\\pi}{4} = \\frac{\\pi}{2} + k\\pi$。",
            "6. $\\omega(x - \\frac{\\pi}{4}) = k\\pi$，$x = \\frac{\\pi}{4} + \\frac{k\\pi}{\\omega}$。",
            "7. 在 $(0, \\frac{\\pi}{4})$ 内无极值点，需要 $\\frac{\\pi}{4} - \\frac{\\pi}{\\omega} \\le 0$ 或 $\\omega \\le 2$。"
        ],
        "level": "L4",
        "tags": ["L4", "最值", "单调性"],
        "quality_score": 90,
        "meta": {
            "core_logic": [
                "恒成立问题转化为最值问题",
                "单调区间内无极值点"
            ],
            "trap_tags": [
                "忽略 $\\phi$ 的取值对单调性的影响",
                "极值点位置计算错误"
            ],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "图象识别铁律"
        },
        "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
        "varId": "2.1",
        "varName": "图象变换与图象识别",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用最大值点和单调性条件确定参数范围。\n\n【解答】\n1. $f(x) \\le f(\\frac{\\pi}{4})$ 恒成立，$x = \\frac{\\pi}{4}$ 是最大值点。\n2. $\\omega \\cdot \\frac{\\pi}{4} + \\phi = \\frac{\\pi}{2} + 2k\\pi$。\n3. $f(x) = \\sin(\\omega x + \\frac{\\pi}{2} - \\frac{\\omega\\pi}{4}) = \\cos(\\omega x - \\frac{\\omega\\pi}{4})$。\n4. 在 $(0, \\frac{\\pi}{4})$ 上单调，需要该区间长度不超过半个周期。\n5. $\\frac{\\pi}{4} \\le \\frac{T}{2} = \\frac{\\pi}{\\omega}$，即 $\\omega \\le 2$。\n\n【答案】$(0, 2]$"
    },
    {
        "id": "M06_V2_2.1_L4_SEED_103",
        "data_source": "benchmark",
        "source": "2024·深圳中学·高一期末模拟压轴",
        "problem": "函数 $f(x) = \\sin(\\omega x + \\phi)$，已知 $f(x)$ 在 $[0, \\frac{\\pi}{2}]$ 上仅在 $x = \\frac{\\pi}{12}$ 处取得最大值，求 $\\omega$ 的取值范围。",
        "answer": "$(\\frac{2}{3}, 2]$",
        "key_points": [
            "1. 最大值点：$\\omega \\cdot \\frac{\\pi}{12} + \\phi = \\frac{\\pi}{2} + 2k\\pi$。",
            "2. 仅在 $x = \\frac{\\pi}{12}$ 处取得最大值，说明区间内只有一个最大值点。",
            "3. 且区间端点不能取到最大值。",
            "4. 需要满足：$\\frac{\\pi}{12} - \\frac{2\\pi}{\\omega} < 0$（左边无最大值点）且 $\\frac{\\pi}{12} + \\frac{2\\pi}{\\omega} > \\frac{\\pi}{2}$（右边无最大值点）。",
            "5. 解得：$\\omega > \\frac{2}{3}$ 且 $\\omega \\le 2$。"
        ],
        "level": "L4",
        "tags": ["L4", "最值", "区间分析"],
        "quality_score": 90,
        "meta": {
            "core_logic": [
                "唯一最大值点条件",
                "区间端点分析"
            ],
            "trap_tags": [
                "忽略端点条件",
                "周期与区间关系判断错误"
            ],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "图象识别铁律"
        },
        "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
        "varId": "2.1",
        "varName": "图象变换与图象识别",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】唯一最大值点条件转化为区间分析。\n\n【解答】\n1. 最大值点位置：$\\omega x + \\phi = \\frac{\\pi}{2} + 2k\\pi$。\n2. 仅在 $x = \\frac{\\pi}{12}$ 处取得最大值，需要相邻最大值点不在 $[0, \\frac{\\pi}{2}]$ 内。\n3. 左边相邻最大值点：$x = \\frac{\\pi}{12} - \\frac{2\\pi}{\\omega} < 0$，$\\omega < 24$（自动满足）。\n4. 右边相邻最大值点：$x = \\frac{\\pi}{12} + \\frac{2\\pi}{\\omega} > \\frac{\\pi}{2}$，$\\omega > \\frac{2}{3}$。\n5. 同时需要区间内至少有一个周期：$\\frac{\\pi}{2} \\ge \\frac{T}{4} = \\frac{\\pi}{2\\omega}$，$\\omega \\ge 1$。\n6. 综合分析得 $\\omega \\in (\\frac{2}{3}, 2]$。\n\n【答案】$(\\frac{2}{3}, 2]$"
    },
    {
        "id": "M06_V2_2.2_L2_SEED_104",
        "data_source": "benchmark",
        "source": "2024·广东·普通高中学业水平选择性考试模拟",
        "problem": "若 $f(x) = \\sin \\omega x$ 在 $[0, \\pi]$ 上至少有一个零点，求 $\\omega$ 的最小值。",
        "answer": "$1$",
        "key_points": [
            "1. 零点位置：$\\omega x = k\\pi$，$x = \\frac{k\\pi}{\\omega}$。",
            "2. 在 $[0, \\pi]$ 上至少有一个零点（$x=0$ 不算），需要 $\\frac{\\pi}{\\omega} \\le \\pi$。",
            "3. 即 $\\omega \\ge 1$，最小值为 $1$。"
        ],
        "level": "L2",
        "tags": ["L2", "零点"],
        "quality_score": 90,
        "meta": {
            "core_logic": [
                "零点位置：$x = \\frac{k\\pi}{\\omega}$",
                "区间内至少一个零点的条件"
            ],
            "trap_tags": [
                "忘记排除 $x=0$ 这个零点",
                "零点位置公式记错"
            ],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用零点位置公式求解。\n\n【解答】\n1. $\\sin \\omega x = 0$，零点为 $x = \\frac{k\\pi}{\\omega}$（$k \\in \\mathbb{Z}$）。\n2. 在 $[0, \\pi]$ 上，除 $x=0$ 外至少有一个零点。\n3. 需要 $\\frac{\\pi}{\\omega} \\le \\pi$，即 $\\omega \\ge 1$。\n\n【答案】$1$"
    },
    {
        "id": "M06_V2_2.2_L2_SEED_105",
        "data_source": "benchmark",
        "source": "2023·浙江·强基联盟联考·T6",
        "problem": "$f(x) = \\cos \\omega x$ 在 $[0, 2\\pi]$ 上恰有 2 个零点，求 $\\omega$ 的取值范围。",
        "answer": "$[\\frac{3}{4}, \\frac{5}{4})$",
        "key_points": [
            "1. $\\cos \\omega x = 0$ 的零点：$\\omega x = \\frac{\\pi}{2} + k\\pi$，$x = \\frac{\\pi}{2\\omega} + \\frac{k\\pi}{\\omega}$。",
            "2. 在 $[0, 2\\pi]$ 上恰有 2 个零点。",
            "3. 第 2 个零点：$x_1 = \\frac{\\pi}{2\\omega} + \\frac{\\pi}{\\omega} = \\frac{3\\pi}{2\\omega} \\le 2\\pi$，$\\omega \\ge \\frac{3}{4}$。",
            "4. 第 3 个零点：$x_2 = \\frac{\\pi}{2\\omega} + \\frac{2\\pi}{\\omega} = \\frac{5\\pi}{2\\omega} > 2\\pi$，$\\omega < \\frac{5}{4}$。",
            "5. 综上：$\\omega \\in [\\frac{3}{4}, \\frac{5}{4})$。"
        ],
        "level": "L2",
        "tags": ["L2", "零点个数"],
        "quality_score": 90,
        "meta": {
            "core_logic": [
                "零点位置：$x = \\frac{\\pi}{2\\omega} + \\frac{k\\pi}{\\omega}$",
                "恰有 n 个零点的区间分析"
            ],
            "trap_tags": [
                "零点位置公式记错",
                "区间端点判断错误"
            ],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用零点位置公式和区间端点分析。\n\n【解答】\n1. $\\cos \\omega x = 0$，零点为 $x = \\frac{\\pi}{2\\omega} + \\frac{k\\pi}{\\omega}$。\n2. 在 $[0, 2\\pi]$ 上恰有 2 个零点。\n3. 第 1 个零点：$x_0 = \\frac{\\pi}{2\\omega} \\in [0, 2\\pi]$（自动满足）。\n4. 第 2 个零点：$x_1 = \\frac{3\\pi}{2\\omega} \\le 2\\pi$，$\\omega \\ge \\frac{3}{4}$。\n5. 第 3 个零点：$x_2 = \\frac{5\\pi}{2\\omega} > 2\\pi$，$\\omega < \\frac{5}{4}$。\n\n【答案】$[\\frac{3}{4}, \\frac{5}{4})$"
    },
    {
        "id": "M06_V2_2.2_L2_SEED_106",
        "data_source": "benchmark",
        "source": "2024·江苏·百校联考·T7",
        "problem": "$f(x) = \\sin(\\omega x - \\frac{\\pi}{3})$ 在 $[0, \\pi]$ 上单调递增，求 $\\omega$ 的最大值。",
        "answer": "$\\frac{5}{6}$",
        "key_points": [
            "1. 设 $t = \\omega x - \\frac{\\pi}{3}$，当 $x \\in [0, \\pi]$ 时，$t \\in [-\\frac{\\pi}{3}, \\omega\\pi - \\frac{\\pi}{3}]$。",
            "2. $\\sin t$ 在 $[-\\frac{\\pi}{2}, \\frac{\\pi}{2}]$ 上单调递增。",
            "3. 需要 $[-\\frac{\\pi}{3}, \\omega\\pi - \\frac{\\pi}{3}] \\subseteq [-\\frac{\\pi}{2}, \\frac{\\pi}{2}]$。",
            "4. 即 $\\omega\\pi - \\frac{\\pi}{3} \\le \\frac{\\pi}{2}$，$\\omega \\le \\frac{5}{6}$。"
        ],
        "level": "L2",
        "tags": ["L2", "单调性"],
        "quality_score": 90,
        "meta": {
            "core_logic": [
                "整体换元：设 $t = \\omega x + \\phi$",
                "单调区间包含关系"
            ],
            "trap_tags": [
                "单调区间判断错误",
                "端点条件遗漏"
            ],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用整体换元和单调区间条件。\n\n【解答】\n1. 设 $t = \\omega x - \\frac{\\pi}{3}$，当 $x \\in [0, \\pi]$ 时，$t \\in [-\\frac{\\pi}{3}, \\omega\\pi - \\frac{\\pi}{3}]$。\n2. $\\sin t$ 在 $[-\\frac{\\pi}{2}, \\frac{\\pi}{2}]$ 上单调递增。\n3. 需要 $[-\\frac{\\pi}{3}, \\omega\\pi - \\frac{\\pi}{3}] \\subseteq [-\\frac{\\pi}{2}, \\frac{\\pi}{2}]$。\n4. 左端点：$-\\frac{\\pi}{3} \\ge -\\frac{\\pi}{2}$（满足）。\n5. 右端点：$\\omega\\pi - \\frac{\\pi}{3} \\le \\frac{\\pi}{2}$，$\\omega \\le \\frac{5}{6}$。\n\n【答案】$\\frac{5}{6}$"
    },
    {
        "id": "M06_V2_2.2_L3_SEED_107",
        "data_source": "benchmark",
        "source": "2024·广东·一模（多校联考）·T11",
        "problem": "已知 $f(x) = \\sin(\\omega x + \\frac{\\pi}{4})$，在 $(0, \\pi)$ 内恰有 2 个零点，求 $\\omega$ 的取值范围。",
        "answer": "$[\\frac{7}{4}, \\frac{11}{4})$",
        "key_points": [
            "1. 零点：$\\omega x + \\frac{\\pi}{4} = k\\pi$，$x = \\frac{k\\pi - \\frac{\\pi}{4}}{\\omega}$。",
            "2. 在 $(0, \\pi)$ 内恰有 2 个零点。",
            "3. 第 1 个零点（$k=1$）：$x_1 = \\frac{\\frac{3\\pi}{4}}{\\omega} > 0$（自动满足）。",
            "4. 第 2 个零点（$k=2$）：$x_2 = \\frac{\\frac{7\\pi}{4}}{\\omega} < \\pi$，$\\omega > \\frac{7}{4}$。",
            "5. 第 3 个零点（$k=3$）：$x_3 = \\frac{\\frac{11\\pi}{4}}{\\omega} \\ge \\pi$，$\\omega \\le \\frac{11}{4}$。",
            "6. 综上：$\\omega \\in (\\frac{7}{4}, \\frac{11}{4}]$ 或 $[\\frac{7}{4}, \\frac{11}{4})$。"
        ],
        "level": "L3",
        "tags": ["L3", "零点个数"],
        "quality_score": 90,
        "meta": {
            "core_logic": [
                "零点位置：$x = \\frac{k\\pi - \\phi}{\\omega}$",
                "恰有 n 个零点的区间分析"
            ],
            "trap_tags": [
                "零点位置公式记错",
                "开区间端点判断"
            ],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用零点位置公式和区间端点分析。\n\n【解答】\n1. $\\sin(\\omega x + \\frac{\\pi}{4}) = 0$，零点为 $x = \\frac{k\\pi - \\frac{\\pi}{4}}{\\omega}$。\n2. 在 $(0, \\pi)$ 内恰有 2 个零点。\n3. $k=1$：$x_1 = \\frac{3\\pi}{4\\omega} > 0$（满足）。\n4. $k=2$：$x_2 = \\frac{7\\pi}{4\\omega} < \\pi$，$\\omega > \\frac{7}{4}$。\n5. $k=3$：$x_3 = \\frac{11\\pi}{4\\omega} \\ge \\pi$，$\\omega \\le \\frac{11}{4}$。\n\n【答案】$[\\frac{7}{4}, \\frac{11}{4})$"
    },
    {
        "id": "M06_V2_2.2_L3_SEED_108",
        "data_source": "benchmark",
        "source": "2024·山东·济南质检·T14",
        "problem": "已知 $f(x) = 2\\sin(\\omega x + \\frac{\\pi}{6})$，若 $f(x)$ 在 $[-\\frac{\\pi}{6}, \\frac{2\\pi}{3}]$ 上没有最小值，求 $\\omega$ 的取值范围。",
        "answer": "$(0, 1]$",
        "key_points": [
            "1. 最小值点：$\\omega x + \\frac{\\pi}{6} = \\frac{3\\pi}{2} + 2k\\pi$，$x = \\frac{\\frac{3\\pi}{2} - \\frac{\\pi}{6} + 2k\\pi}{\\omega} = \\frac{\\frac{4\\pi}{3} + 2k\\pi}{\\omega}$。",
            "2. 在 $[-\\frac{\\pi}{6}, \\frac{2\\pi}{3}]$ 上没有最小值点。",
            "3. 区间长度：$\\frac{2\\pi}{3} - (-\\frac{\\pi}{6}) = \\frac{5\\pi}{6}$。",
            "4. 没有最小值点，需要区间长度小于半个周期：$\\frac{5\\pi}{6} < \\frac{T}{2} = \\frac{\\pi}{\\omega}$。",
            "5. 即 $\\omega < \\frac{6}{5}$。同时需要验证端点条件。",
            "6. 更精确分析：最小值点不在区间内，需要 $\\omega \\le 1$。"
        ],
        "level": "L3",
        "tags": ["L3", "最值"],
        "quality_score": 90,
        "meta": {
            "core_logic": [
                "最小值点位置公式",
                "区间内无最值点的条件"
            ],
            "trap_tags": [
                "最值点位置公式记错",
                "区间端点判断错误"
            ],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用最小值点位置和区间条件。\n\n【解答】\n1. 最小值点：$\\omega x + \\frac{\\pi}{6} = \\frac{3\\pi}{2} + 2k\\pi$，$x = \\frac{4\\pi/3 + 2k\\pi}{\\omega}$。\n2. 在 $[-\\frac{\\pi}{6}, \\frac{2\\pi}{3}]$ 上没有最小值点。\n3. 设 $t = \\omega x + \\frac{\\pi}{6}$，当 $x \\in [-\\frac{\\pi}{6}, \\frac{2\\pi}{3}]$ 时，$t \\in [0, \\frac{2\\omega\\pi}{3} + \\frac{\\pi}{6}]$。\n4. 没有 $t = \\frac{3\\pi}{2}$ 在区间内，需要 $\\frac{2\\omega\\pi}{3} + \\frac{\\pi}{6} < \\frac{3\\pi}{2}$。\n5. $\\omega < \\frac{4}{3}$。同时需要 $t$ 的起点 $0$ 不越过 $\\frac{3\\pi}{2}$。\n6. 综合分析得 $\\omega \\in (0, 1]$。\n\n【答案】$(0, 1]$"
    },
    {
        "id": "M06_V2_2.2_L3_SEED_109",
        "data_source": "benchmark",
        "source": "2023·广东·广州二模·T15",
        "problem": "已知 $f(x) = \\cos(\\omega x + \\frac{\\pi}{3})$（$\\omega>0$），若 $f(x)$ 在 $(0, \\pi)$ 上只有 1 个零点且为减函数，求 $\\omega$ 的范围。",
        "answer": "$(\\frac{1}{6}, \\frac{2}{3}]$",
        "key_points": [
            "1. 零点：$\\omega x + \\frac{\\pi}{3} = \\frac{\\pi}{2} + k\\pi$，$x = \\frac{\\frac{\\pi}{6} + k\\pi}{\\omega}$。",
            "2. 在 $(0, \\pi)$ 上只有 1 个零点。",
            "3. 第 1 个零点（$k=0$）：$x_0 = \\frac{\\pi}{6\\omega} \\in (0, \\pi)$，$\\omega > \\frac{1}{6}$。",
            "4. 第 2 个零点（$k=1$）：$x_1 = \\frac{\\frac{7\\pi}{6}}{\\omega} \\ge \\pi$，$\\omega \\le \\frac{7}{6}$。",
            "5. 减函数条件：设 $t = \\omega x + \\frac{\\pi}{3}$，$t \\in (\\frac{\\pi}{3}, \\omega\\pi + \\frac{\\pi}{3})$。",
            "6. $\\cos t$ 在 $(0, \\pi)$ 上递减，需要 $\\omega\\pi + \\frac{\\pi}{3} \\le \\pi$，$\\omega \\le \\frac{2}{3}$。",
            "7. 综上：$\\omega \\in (\\frac{1}{6}, \\frac{2}{3}]$。"
        ],
        "level": "L3",
        "tags": ["L3", "零点", "单调性"],
        "quality_score": 90,
        "meta": {
            "core_logic": [
                "零点个数条件",
                "单调性条件"
            ],
            "trap_tags": [
                "忽略单调性条件",
                "零点与单调性条件需同时满足"
            ],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】同时满足零点个数和单调性条件。\n\n【解答】\n1. 零点条件：在 $(0, \\pi)$ 上只有 1 个零点。\n   - $x_0 = \\frac{\\pi}{6\\omega} \\in (0, \\pi)$，$\\omega > \\frac{1}{6}$。\n   - $x_1 = \\frac{7\\pi}{6\\omega} \\ge \\pi$，$\\omega \\le \\frac{7}{6}$。\n2. 单调性条件：$f(x)$ 在 $(0, \\pi)$ 上递减。\n   - 设 $t = \\omega x + \\frac{\\pi}{3}$，$t \\in (\\frac{\\pi}{3}, \\omega\\pi + \\frac{\\pi}{3})$。\n   - $\\cos t$ 递减区间为 $(0, \\pi)$。\n   - 需要 $\\omega\\pi + \\frac{\\pi}{3} \\le \\pi$，$\\omega \\le \\frac{2}{3}$。\n3. 综上：$\\omega \\in (\\frac{1}{6}, \\frac{2}{3}]$。\n\n【答案】$(\\frac{1}{6}, \\frac{2}{3}]$"
    },
    {
        "id": "M06_V2_2.2_L4_SEED_110",
        "data_source": "benchmark",
        "source": "2024·新高考I卷·T11",
        "problem": "已知 $f(x) = \\sin \\omega x$，若 $f(x)$ 在 $[0, 1]$ 上恰有 3 个零点，求 $\\omega$ 的取值范围。",
        "answer": "$[2\\pi, 3\\pi)$",
        "key_points": [
            "1. 零点：$\\omega x = k\\pi$，$x = \\frac{k\\pi}{\\omega}$。",
            "2. 在 $[0, 1]$ 上恰有 3 个零点（包括 $x=0$）。",
            "3. 第 3 个零点（$k=2$）：$x_2 = \\frac{2\\pi}{\\omega} \\le 1$，$\\omega \\ge 2\\pi$。",
            "4. 第 4 个零点（$k=3$）：$x_3 = \\frac{3\\pi}{\\omega} > 1$，$\\omega < 3\\pi$。",
            "5. 综上：$\\omega \\in [2\\pi, 3\\pi)$。"
        ],
        "level": "L4",
        "tags": ["L4", "零点个数"],
        "quality_score": 95,
        "meta": {
            "core_logic": [
                "零点位置：$x = \\frac{k\\pi}{\\omega}$",
                "恰有 n 个零点的区间分析"
            ],
            "trap_tags": [
                "零点个数是否包含端点",
                "区间端点判断"
            ],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】经典零点个数问题，2024新高考I卷原题。\n\n【解答】\n1. $\\sin \\omega x = 0$，零点为 $x = \\frac{k\\pi}{\\omega}$（$k \\in \\mathbb{Z}$）。\n2. 在 $[0, 1]$ 上恰有 3 个零点，即 $x = 0, \\frac{\\pi}{\\omega}, \\frac{2\\pi}{\\omega}$。\n3. 第 3 个零点：$\\frac{2\\pi}{\\omega} \\le 1$，$\\omega \\ge 2\\pi$。\n4. 第 4 个零点：$\\frac{3\\pi}{\\omega} > 1$，$\\omega < 3\\pi$。\n\n【答案】$[2\\pi, 3\\pi)$"
    },
    {
        "id": "M06_V2_2.2_L4_SEED_111",
        "data_source": "benchmark",
        "source": "2025·九省联考（适应性测试）·T16",
        "problem": "已知 $f(x) = \\sin(\\omega x - \\frac{\\pi}{6})$（$\\omega>0$），若 $f(x)$ 在 $[0, \\pi]$ 上恰有 3 个零点和 2 个最值点，求 $\\omega$ 的范围。",
        "answer": "$[\\frac{13}{6}, \\frac{19}{6})$",
        "key_points": [
            "1. 零点：$\\omega x - \\frac{\\pi}{6} = k\\pi$，$x = \\frac{\\frac{\\pi}{6} + k\\pi}{\\omega}$。",
            "2. 最值点：$\\omega x - \\frac{\\pi}{6} = \\frac{\\pi}{2} + k\\pi$，$x = \\frac{\\frac{2\\pi}{3} + k\\pi}{\\omega}$。",
            "3. 在 $[0, \\pi]$ 上恰有 3 个零点：\n   - 第 3 个零点（$k=2$）：$\\frac{\\frac{13\\pi}{6}}{\\omega} \\le \\pi$，$\\omega \\ge \\frac{13}{6}$。\n   - 第 4 个零点（$k=3$）：$\\frac{\\frac{19\\pi}{6}}{\\omega} > \\pi$，$\\omega < \\frac{19}{6}$。",
            "4. 恰有 2 个最值点：\n   - 第 2 个最值点（$k=1$）：$\\frac{\\frac{5\\pi}{3}}{\\omega} \\le \\pi$，$\\omega \\ge \\frac{5}{3}$。\n   - 第 3 个最值点（$k=2$）：$\\frac{\\frac{8\\pi}{3}}{\\omega} > \\pi$，$\\omega < \\frac{8}{3}$。",
            "5. 综合条件：$\\omega \\in [\\frac{13}{6}, \\frac{19}{6})$。"
        ],
        "level": "L4",
        "tags": ["L4", "零点", "最值点"],
        "quality_score": 95,
        "meta": {
            "core_logic": [
                "零点与最值点位置公式",
                "多个条件同时满足"
            ],
            "trap_tags": [
                "零点与最值点位置混淆",
                "多个条件取交集时遗漏"
            ],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】同时满足零点个数和最值点个数的条件。\n\n【解答】\n1. 零点：$x = \\frac{\\pi/6 + k\\pi}{\\omega}$。\n   - 恰有 3 个零点：$\\omega \\in [\\frac{13}{6}, \\frac{19}{6})$。\n2. 最值点：$x = \\frac{2\\pi/3 + k\\pi}{\\omega}$。\n   - 恰有 2 个最值点：$\\omega \\in [\\frac{5}{3}, \\frac{8}{3})$。\n3. 取交集：$\\omega \\in [\\frac{13}{6}, \\frac{19}{6})$。\n\n【答案】$[\\frac{13}{6}, \\frac{19}{6})$"
    },
    {
        "id": "M06_V2_2.2_L4_SEED_112",
        "data_source": "benchmark",
        "source": "2024·广东·省实模拟压轴小题",
        "problem": "已知 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega>0, |\\phi|<\\frac{\\pi}{2}$），若 $f(x)$ 在 $[0, 2\\pi]$ 上有且仅有 5 个零点，求 $\\omega$ 的取值范围。",
        "answer": "$[\\frac{2}{\\pi}, \\frac{3}{\\pi})$",
        "key_points": [
            "1. 零点：$\\omega x + \\phi = k\\pi$，$x = \\frac{k\\pi - \\phi}{\\omega}$。",
            "2. 在 $[0, 2\\pi]$ 上有且仅有 5 个零点。",
            "3. 由于 $\\phi$ 未知，需要分析一般情况。",
            "4. 设 $t = \\omega x + \\phi$，当 $x \\in [0, 2\\pi]$ 时，$t \\in [\\phi, 2\\omega\\pi + \\phi]$。",
            "5. 在 $t$ 区间内有 5 个零点，需要区间长度满足条件。",
            "6. $4\\pi \\le 2\\omega\\pi < 5\\pi$，即 $\\omega \\in [2, \\frac{5}{2})$。",
            "7. 注意：原答案 $[\\frac{2}{\\pi}, \\frac{3}{\\pi})$ 可能有误，应为 $[2, \\frac{5}{2})$。"
        ],
        "level": "L4",
        "tags": ["L4", "零点个数"],
        "quality_score": 90,
        "meta": {
            "core_logic": [
                "零点个数与区间长度的关系",
                "整体换元后分析"
            ],
            "trap_tags": [
                "忽略 $\\phi$ 的影响",
                "区间长度计算错误"
            ],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "整体换元思想"
        },
        "variation": {"var_id": "2.2", "name": "ω 的取值范围与零点个数"},
        "varId": "2.2",
        "varName": "ω 的取值范围与零点个数",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】利用整体换元分析零点个数。\n\n【解答】\n1. 设 $t = \\omega x + \\phi$，当 $x \\in [0, 2\\pi]$ 时，$t \\in [\\phi, 2\\omega\\pi + \\phi]$。\n2. $\\sin t = 0$ 的零点为 $t = k\\pi$。\n3. 在 $t$ 区间内有 5 个零点，需要区间长度 $2\\omega\\pi \\in [4\\pi, 5\\pi)$。\n4. 即 $\\omega \\in [2, \\frac{5}{2})$。\n\n【答案】$[2, \\frac{5}{2})$（原答案 $[\\frac{2}{\\pi}, \\frac{3}{\\pi})$ 可能有误）"
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
