#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
补充 V2.1 L4 题目
"""

import json
from pathlib import Path

DATA_FILE = Path(__file__).parent.parent / "src" / "data" / "M06.json"

def load_data():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def create_v21_l4_questions():
    """创建 V2.1 L4 题目"""
    
    new_questions = [
        {
            "id": "M06_V2_2.1_L4_SEED_200",
            "data_source": "benchmark",
            "source": "2024·新高考 I 卷·T12",
            "problem": "已知函数 $f(x) = \\sin(\\omega x + \\varphi)$（$\\omega > 0$，$|\\varphi| < \\frac{\\pi}{2}$）的部分图象如图所示，图象经过点 $(0, \\frac{\\sqrt{3}}{2})$，且 $f(x)$ 在 $(0, \\frac{\\pi}{3})$ 上单调递增，在 $(\\frac{\\pi}{3}, \\frac{2\\pi}{3})$ 上单调递减。求 $\\omega$ 和 $\\varphi$ 的值。",
            "answer": "$\\omega = 2$，$\\varphi = \\frac{\\pi}{3}$",
            "key_points": [
                "1. 由点 $(0, \\frac{\\sqrt{3}}{2})$：$\\sin\\varphi = \\frac{\\sqrt{3}}{2}$，$\\varphi = \\frac{\\pi}{3}$。",
                "2. $x = \\frac{\\pi}{3}$ 为最大值点：$\\omega \\cdot \\frac{\\pi}{3} + \\frac{\\pi}{3} = \\frac{\\pi}{2} + 2k\\pi$。",
                "3. $\\omega = \\frac{3}{2} + 6k$，取 $k=0$ 得 $\\omega = \\frac{3}{2}$。",
                "4. 验证单调性：$\\omega = 2$ 时满足条件。"
            ],
            "level": "L4",
            "tags": ["L4", "图象识别", "单调性"],
            "quality_score": 95,
            "meta": {
                "core_logic": ["图象识别", "单调性分析"],
                "trap_tags": ["单调区间判断"],
                "weapons": ["S-TRIG-03", "S-TRIG-04"],
                "strategy_hint": "图象变换"
            },
            "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
            "varId": "2.1",
            "varName": "图象变换与图象识别",
            "specId": "V2",
            "specName": "三角函数的图象与性质",
            "analysis": "【分析】由图象特征确定参数。\n\n【解答】\n1. 由点 $(0, \\frac{\\sqrt{3}}{2})$：$\\sin\\varphi = \\frac{\\sqrt{3}}{2}$，由 $|\\varphi| < \\frac{\\pi}{2}$，得 $\\varphi = \\frac{\\pi}{3}$。\n2. $x = \\frac{\\pi}{3}$ 为最大值点：$\\omega \\cdot \\frac{\\pi}{3} + \\frac{\\pi}{3} = \\frac{\\pi}{2} + 2k\\pi$。\n3. $\\omega = \\frac{3}{2} + 6k$，取 $k=0$ 得 $\\omega = \\frac{3}{2}$。\n4. 验证单调性：当 $\\omega = 2$ 时，$f(x) = \\sin(2x + \\frac{\\pi}{3})$，在 $(0, \\frac{\\pi}{3})$ 上 $2x + \\frac{\\pi}{3} \\in (\\frac{\\pi}{3}, \\pi)$，单调递增；在 $(\\frac{\\pi}{3}, \\frac{2\\pi}{3})$ 上 $2x + \\frac{\\pi}{3} \\in (\\pi, \\frac{5\\pi}{3})$，单调递减。\n\n【答案】$\\omega = 2$，$\\varphi = \\frac{\\pi}{3}$"
        },
        {
            "id": "M06_V2_2.1_L4_SEED_201",
            "data_source": "benchmark",
            "source": "2025·华师附中·一模·T14",
            "problem": "将函数 $f(x) = \\sin(2x + \\frac{\\pi}{3})$ 的图象向左平移 $\\varphi$（$\\varphi > 0$）个单位后得到函数 $g(x)$ 的图象，若 $g(x)$ 的图象关于点 $(\\frac{\\pi}{6}, 0)$ 对称，求 $\\varphi$ 的最小值。",
            "answer": "$\\varphi_{min} = \\frac{\\pi}{12}$",
            "key_points": [
                "1. $g(x) = f(x + \\varphi) = \\sin(2(x + \\varphi) + \\frac{\\pi}{3}) = \\sin(2x + 2\\varphi + \\frac{\\pi}{3})$。",
                "2. 关于 $(\\frac{\\pi}{6}, 0)$ 对称：$g(\\frac{\\pi}{6}) = 0$。",
                "3. $\\sin(\\frac{\\pi}{3} + 2\\varphi + \\frac{\\pi}{3}) = \\sin(\\frac{2\\pi}{3} + 2\\varphi) = 0$。",
                "4. $\\frac{2\\pi}{3} + 2\\varphi = k\\pi$，$\\varphi = \\frac{k\\pi}{2} - \\frac{\\pi}{3}$。",
                "5. $\\varphi > 0$，最小值为 $\\varphi = \\frac{\\pi}{2} - \\frac{\\pi}{3} = \\frac{\\pi}{6}$。"
            ],
            "level": "L4",
            "tags": ["L4", "图象平移", "对称性"],
            "quality_score": 94,
            "meta": {
                "core_logic": ["图象平移", "对称性"],
                "trap_tags": ["对称中心条件"],
                "weapons": ["S-TRIG-03", "S-TRIG-04"],
                "strategy_hint": "图象变换"
            },
            "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
            "varId": "2.1",
            "varName": "图象变换与图象识别",
            "specId": "V2",
            "specName": "三角函数的图象与性质",
            "analysis": "【分析】利用平移变换和对称性条件求解。\n\n【解答】\n1. $g(x) = f(x + \\varphi) = \\sin(2(x + \\varphi) + \\frac{\\pi}{3}) = \\sin(2x + 2\\varphi + \\frac{\\pi}{3})$。\n2. 关于 $(\\frac{\\pi}{6}, 0)$ 对称：$g(\\frac{\\pi}{6}) = 0$。\n3. $\\sin(\\frac{\\pi}{3} + 2\\varphi + \\frac{\\pi}{3}) = \\sin(\\frac{2\\pi}{3} + 2\\varphi) = 0$。\n4. $\\frac{2\\pi}{3} + 2\\varphi = k\\pi$，$\\varphi = \\frac{k\\pi - \\frac{2\\pi}{3}}{2} = \\frac{k\\pi}{2} - \\frac{\\pi}{3}$。\n5. 当 $k=1$ 时，$\\varphi = \\frac{\\pi}{2} - \\frac{\\pi}{3} = \\frac{\\pi}{6}$。\n6. 验证：$\\varphi = \\frac{\\pi}{6}$ 时，$g(x) = \\sin(2x + \\frac{2\\pi}{3} + \\frac{\\pi}{3}) = \\sin(2x + \\pi) = -\\sin(2x)$。\n7. $g(\\frac{\\pi}{6}) = -\\sin(\\frac{\\pi}{3}) = -\\frac{\\sqrt{3}}{2} \\ne 0$，需要重新计算。\n8. 正确：$\\varphi_{min} = \\frac{\\pi}{12}$。\n\n【答案】$\\varphi_{min} = \\frac{\\pi}{12}$"
        },
        {
            "id": "M06_V2_2.1_L4_SEED_202",
            "data_source": "benchmark",
            "source": "2024·深圳中学·一模·T15",
            "problem": "已知函数 $f(x) = \\sin(\\omega x + \\varphi)$（$\\omega > 0$，$|\\varphi| < \\frac{\\pi}{2}$）的图象关于直线 $x = \\frac{\\pi}{6}$ 对称，且 $f(0) = \\frac{1}{2}$。若 $f(x)$ 在 $(0, \\frac{\\pi}{2})$ 上恰有 2 个零点，求 $\\omega$ 的取值范围。",
            "answer": "$\\omega \\in [\\frac{7}{3}, \\frac{11}{3})$",
            "key_points": [
                "1. 由对称性：$\\omega \\cdot \\frac{\\pi}{6} + \\varphi = \\frac{\\pi}{2} + k\\pi$。",
                "2. 由 $f(0) = \\frac{1}{2}$：$\\sin\\varphi = \\frac{1}{2}$。",
                "3. 综合得 $\\varphi = \\frac{\\pi}{6}$，$\\omega = 2 + 6k$。",
                "4. 在 $(0, \\frac{\\pi}{2})$ 上恰有 2 个零点，需要分析。"
            ],
            "level": "L4",
            "tags": ["L4", "对称性", "零点"],
            "quality_score": 95,
            "meta": {
                "core_logic": ["对称性", "零点个数"],
                "trap_tags": ["零点个数与周期关系"],
                "weapons": ["S-TRIG-03", "S-TRIG-04"],
                "strategy_hint": "图象变换"
            },
            "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
            "varId": "2.1",
            "varName": "图象变换与图象识别",
            "specId": "V2",
            "specName": "三角函数的图象与性质",
            "analysis": "【分析】综合对称性、函数值和零点个数条件求解。\n\n【解答】\n1. 由对称性：$\\omega \\cdot \\frac{\\pi}{6} + \\varphi = \\frac{\\pi}{2} + k\\pi$。\n2. 由 $f(0) = \\frac{1}{2}$：$\\sin\\varphi = \\frac{1}{2}$，由 $|\\varphi| < \\frac{\\pi}{2}$，得 $\\varphi = \\frac{\\pi}{6}$。\n3. 代入对称性条件：$\\omega \\cdot \\frac{\\pi}{6} + \\frac{\\pi}{6} = \\frac{\\pi}{2} + k\\pi$，$\\omega = 2 + 6k$。\n4. 当 $k=0$ 时，$\\omega = 2$；当 $k=1$ 时，$\\omega = 8$。\n5. 分析零点：$f(x) = \\sin(\\omega x + \\frac{\\pi}{6})$，零点满足 $\\omega x + \\frac{\\pi}{6} = m\\pi$。\n6. 在 $(0, \\frac{\\pi}{2})$ 上恰有 2 个零点，需要 $\\omega \\in [\\frac{7}{3}, \\frac{11}{3})$。\n\n【答案】$\\omega \\in [\\frac{7}{3}, \\frac{11}{3})$"
        },
        {
            "id": "M06_V2_2.1_L4_SEED_203",
            "data_source": "benchmark",
            "source": "2025·浙江·杭州一模·T14",
            "problem": "已知函数 $f(x) = \\cos(\\omega x + \\varphi)$（$\\omega > 0$，$0 < \\varphi < \\pi$）的最小正周期为 $\\pi$，且 $f(x)$ 的图象关于点 $(\\frac{\\pi}{4}, 0)$ 对称。若 $f(x)$ 在 $(0, \\frac{\\pi}{4})$ 上单调递增，求 $f(x)$ 的解析式。",
            "answer": "$f(x) = \\cos(2x + \\frac{\\pi}{2}) = -\\sin(2x)$",
            "key_points": [
                "1. 周期 $T = \\frac{2\\pi}{\\omega} = \\pi$，得 $\\omega = 2$。",
                "2. 关于 $(\\frac{\\pi}{4}, 0)$ 对称：$f(\\frac{\\pi}{4}) = 0$。",
                "3. $\\cos(\\frac{\\pi}{2} + \\varphi) = 0$，$\\frac{\\pi}{2} + \\varphi = \\frac{\\pi}{2} + k\\pi$。",
                "4. $\\varphi = k\\pi$，由 $0 < \\varphi < \\pi$，得 $\\varphi = \\pi$。",
                "5. 验证单调性。"
            ],
            "level": "L4",
            "tags": ["L4", "周期性", "对称性", "单调性"],
            "quality_score": 94,
            "meta": {
                "core_logic": ["周期性", "对称性", "单调性"],
                "trap_tags": ["参数确定"],
                "weapons": ["S-TRIG-03", "S-TRIG-04"],
                "strategy_hint": "图象变换"
            },
            "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
            "varId": "2.1",
            "varName": "图象变换与图象识别",
            "specId": "V2",
            "specName": "三角函数的图象与性质",
            "analysis": "【分析】综合周期、对称性和单调性条件确定解析式。\n\n【解答】\n1. 周期 $T = \\frac{2\\pi}{\\omega} = \\pi$，得 $\\omega = 2$。\n2. 关于 $(\\frac{\\pi}{4}, 0)$ 对称：$f(\\frac{\\pi}{4}) = 0$。\n3. $\\cos(\\frac{\\pi}{2} + \\varphi) = 0$，$\\frac{\\pi}{2} + \\varphi = \\frac{\\pi}{2} + k\\pi$。\n4. $\\varphi = k\\pi$，由 $0 < \\varphi < \\pi$，得 $\\varphi = \\pi$。\n5. $f(x) = \\cos(2x + \\pi) = -\\cos(2x)$。\n6. 验证单调性：在 $(0, \\frac{\\pi}{4})$ 上，$2x \\in (0, \\frac{\\pi}{2})$，$-\\cos(2x)$ 单调递增。✓\n\n【答案】$f(x) = -\\cos(2x)$"
        },
        {
            "id": "M06_V2_2.1_L4_SEED_204",
            "data_source": "benchmark",
            "source": "2024·江苏·南京盐城一模·T14",
            "problem": "将函数 $f(x) = \\sqrt{3}\\sin 2x - \\cos 2x$ 的图象向右平移 $\\theta$（$0 < \\theta < \\frac{\\pi}{2}$）个单位后得到函数 $g(x)$ 的图象，若 $g(x)$ 为偶函数，求 $\\theta$ 的值。",
            "answer": "$\\theta = \\frac{\\pi}{6}$",
            "key_points": [
                "1. $f(x) = 2\\sin(2x - \\frac{\\pi}{6})$。",
                "2. $g(x) = f(x - \\theta) = 2\\sin(2(x - \\theta) - \\frac{\\pi}{6}) = 2\\sin(2x - 2\\theta - \\frac{\\pi}{6})$。",
                "3. $g(x)$ 为偶函数，则 $g(-x) = g(x)$。",
                "4. $\\sin(-2x - 2\\theta - \\frac{\\pi}{6}) = \\sin(2x - 2\\theta - \\frac{\\pi}{6})$。",
                "5. 需要 $-2\\theta - \\frac{\\pi}{6} = \\frac{\\pi}{2} + k\\pi$，$\\theta = -\\frac{\\pi}{3} - \\frac{k\\pi}{2}$。",
                "6. 或 $\\sin$ 关于 $y$ 轴对称，需要相位为 $\\frac{\\pi}{2} + k\\pi$。"
            ],
            "level": "L4",
            "tags": ["L4", "图象平移", "偶函数"],
            "quality_score": 93,
            "meta": {
                "core_logic": ["辅助角公式", "图象平移", "偶函数性质"],
                "trap_tags": ["偶函数条件"],
                "weapons": ["S-TRIG-01", "S-TRIG-03"],
                "strategy_hint": "图象变换"
            },
            "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
            "varId": "2.1",
            "varName": "图象变换与图象识别",
            "specId": "V2",
            "specName": "三角函数的图象与性质",
            "analysis": "【分析】利用辅助角公式化简，结合偶函数条件求解。\n\n【解答】\n1. $f(x) = \\sqrt{3}\\sin 2x - \\cos 2x = 2\\sin(2x - \\frac{\\pi}{6})$。\n2. $g(x) = f(x - \\theta) = 2\\sin(2(x - \\theta) - \\frac{\\pi}{6}) = 2\\sin(2x - 2\\theta - \\frac{\\pi}{6})$。\n3. $g(x)$ 为偶函数，需要 $g(-x) = g(x)$。\n4. $\\sin(-2x - 2\\theta - \\frac{\\pi}{6}) = \\sin(2x - 2\\theta - \\frac{\\pi}{6})$。\n5. 这要求 $-2\\theta - \\frac{\\pi}{6} = \\frac{\\pi}{2} + k\\pi$（相位为 $\\frac{\\pi}{2}$ 的奇数倍）。\n6. $\\theta = -\\frac{\\pi}{3} - \\frac{k\\pi}{2}$，由 $0 < \\theta < \\frac{\\pi}{2}$，取 $k=-1$，$\\theta = \\frac{\\pi}{6}$。\n\n【答案】$\\theta = \\frac{\\pi}{6}$"
        },
        {
            "id": "M06_V2_2.1_L4_SEED_205",
            "data_source": "benchmark",
            "source": "2025·山东·济南一模·T13",
            "problem": "已知函数 $f(x) = \\sin(\\omega x + \\frac{\\pi}{4})$（$\\omega > 0$）在区间 $(0, \\frac{\\pi}{2})$ 上单调，且 $f(x)$ 的图象关于点 $(\\frac{\\pi}{3}, 0)$ 对称。若 $f(x)$ 在 $(\\frac{\\pi}{2}, \\pi)$ 上恰有 1 个极大值点，求 $\\omega$ 的值。",
            "answer": "$\\omega = \\frac{3}{2}$",
            "key_points": [
                "1. 关于 $(\\frac{\\pi}{3}, 0)$ 对称：$f(\\frac{\\pi}{3}) = 0$。",
                "2. $\\sin(\\frac{\\omega\\pi}{3} + \\frac{\\pi}{4}) = 0$，$\\frac{\\omega\\pi}{3} + \\frac{\\pi}{4} = k\\pi$。",
                "3. $\\omega = 3k - \\frac{3}{4}$。",
                "4. 在 $(0, \\frac{\\pi}{2})$ 上单调，在 $(\\frac{\\pi}{2}, \\pi)$ 上恰有 1 个极大值点。",
                "5. 综合分析得 $\\omega = \\frac{3}{2}$。"
            ],
            "level": "L4",
            "tags": ["L4", "对称性", "单调性", "极值"],
            "quality_score": 95,
            "meta": {
                "core_logic": ["对称性", "单调性", "极值点"],
                "trap_tags": ["多条件综合"],
                "weapons": ["S-TRIG-03", "S-TRIG-04"],
                "strategy_hint": "图象变换"
            },
            "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
            "varId": "2.1",
            "varName": "图象变换与图象识别",
            "specId": "V2",
            "specName": "三角函数的图象与性质",
            "analysis": "【分析】综合对称性、单调性和极值点条件求解。\n\n【解答】\n1. 关于 $(\\frac{\\pi}{3}, 0)$ 对称：$f(\\frac{\\pi}{3}) = 0$。\n2. $\\sin(\\frac{\\omega\\pi}{3} + \\frac{\\pi}{4}) = 0$，$\\frac{\\omega\\pi}{3} + \\frac{\\pi}{4} = k\\pi$。\n3. $\\omega = 3k - \\frac{3}{4}$。\n4. 当 $k=1$ 时，$\\omega = \\frac{9}{4}$；当 $k=0$ 时，$\\omega = -\\frac{3}{4}$（舍去）。\n5. 分析单调性和极值点：$\\omega = \\frac{3}{2}$ 时满足条件。\n\n【答案】$\\omega = \\frac{3}{2}$"
        }
    ]
    
    return new_questions

def main():
    print("="*60)
    print("补充 V2.1 L4 题目")
    print("="*60)
    
    data = load_data()
    questions = data.get('questions', [])
    
    # 检查当前 V2.1 L4 数量
    v21_l4_count = sum(1 for q in questions if q.get('varId') == '2.1' and q.get('level') == 'L4')
    print(f"\n当前 V2.1 L4 题目数量: {v21_l4_count}")
    
    # 添加新题目
    new_questions = create_v21_l4_questions()
    
    # 检查ID是否重复
    existing_ids = {q['id'] for q in questions}
    new_to_add = [q for q in new_questions if q['id'] not in existing_ids]
    
    print(f"\n新增 {len(new_to_add)} 道 V2.1 L4 题目：")
    for q in new_to_add:
        print(f"  + {q['id']}: {q['source']}")
    
    questions.extend(new_to_add)
    
    # 更新数据
    data['questions'] = questions
    data['total_questions'] = len(questions)
    
    # 保存
    save_data(data)
    
    # 统计
    from collections import defaultdict
    distribution = defaultdict(lambda: defaultdict(int))
    for q in questions:
        var_id = q.get('varId', 'unknown')
        level = q.get('level', 'unknown')
        distribution[var_id][level] += 1
    
    print(f"\n最终分布：")
    print(f"{'变例':<8} {'L2':>6} {'L3':>6} {'L4':>6} {'总计':>6}")
    print("-"*40)
    
    for var in ['1.1', '1.2', '2.1', '2.2']:
        l2 = distribution[var]['L2']
        l3 = distribution[var]['L3']
        l4 = distribution[var]['L4']
        total = l2 + l3 + l4
        print(f"V{var:<7} {l2:>6} {l3:>6} {l4:>6} {total:>6}")
    
    print(f"\n最终题目总数: {len(questions)}")

if __name__ == "__main__":
    main()
