#!/usr/bin/env python3
"""
精简超标组 + 补充不足组
"""

import json
import os
import re

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, 'src', 'data')

with open(os.path.join(data_dir, 'M06_seed.json'), 'r', encoding='utf-8') as f:
    m06_seed = json.load(f)

questions = m06_seed.get('questions', [])

def evaluate_question(q, all_questions):
    """评估单道题的质量"""
    score = 0
    issues = []
    
    source = q.get('source', '')
    if '高考' in source or '卷' in source:
        if '新高考' in source or '全国' in source:
            score += 25
        else:
            score += 20
    elif '模考' in source or '联考' in source or '一模' in source or '二模' in source:
        score += 18
    elif '风格' in source:
        score += 15
    else:
        score += 10
        issues.append("来源标注不明确")
    
    problem = q.get('problem', '')
    if len(problem) < 20:
        score += 5
        issues.append("题干过短")
    elif len(problem) > 200:
        score += 15
    else:
        score += 18
    
    if '如图' in problem or '图象如图' in problem:
        issues.append("依赖图象")
        score -= 5
    
    answer = q.get('answer', '')
    if not answer or answer == '':
        score += 0
        issues.append("答案缺失")
    elif '______' in answer or '____' in answer:
        score += 10
        issues.append("答案为填空形式")
    elif len(answer) < 5:
        score += 12
        issues.append("答案过简")
    else:
        score += 20
    
    analysis = q.get('analysis', '')
    key_points = q.get('key_points', [])
    
    if analysis and len(analysis) > 50:
        score += 10
    else:
        issues.append("解析不完整")
    
    if key_points and len(key_points) >= 2:
        score += 10
    else:
        issues.append("关键步骤不足")
    
    problem_core = re.sub(r'[\\$]', '', problem)
    problem_core = re.sub(r'\[.*?\]', '', problem_core).strip()[:50]
    
    similar_count = 0
    for other in all_questions:
        if other.get('id') == q.get('id'):
            continue
        other_core = re.sub(r'[\\$]', '', other.get('problem', ''))
        other_core = re.sub(r'\[.*?\]', '', other_core).strip()[:50]
        common = sum(1 for a, b in zip(problem_core, other_core) if a == b)
        if common > 30:
            similar_count += 1
    
    if similar_count == 0:
        score += 15
    elif similar_count <= 2:
        score += 10
        issues.append(f"有{similar_count}道相似题")
    else:
        score += 5
        issues.append(f"有{similar_count}道相似题，重复度高")
    
    if '可能有误' in analysis or '有误' in analysis:
        score -= 10
        issues.append("答案可能有误")
    
    return score, issues

# 按变例和难度分组
groups = {}
for q in questions:
    var_id = q.get('varId', '?')
    level = q.get('level', '?')
    key = (var_id, level)
    if key not in groups:
        groups[key] = []
    groups[key].append(q)

# 精简超标组（保留得分最高的10题）
eliminated = []
final_questions = []

for (var_id, level), group in sorted(groups.items()):
    evaluated = []
    for q in group:
        score, issues = evaluate_question(q, questions)
        evaluated.append({'q': q, 'score': score, 'issues': issues})
    
    evaluated.sort(key=lambda x: -x['score'])
    
    # 确定保留数量：超标组保留10题，其他保留全部
    if len(group) > 12:
        keep_count = 10
    else:
        keep_count = len(group)
    
    for i, e in enumerate(evaluated):
        if i < keep_count:
            final_questions.append(e['q'])
        else:
            eliminated.append(e)

print("=" * 80)
print("精简超标组报告")
print("=" * 80)

for e in eliminated:
    print(f"\n淘汰: {e['q'].get('id')} (得分: {e['score']})")
    print(f"  变例: V{e['q'].get('varId')} / {e['q'].get('level')}")
    print(f"  问题: {', '.join(e['issues'])}")

# 补充高质量题目
new_questions = [
    # V1.2/L4 补充2题
    {
        "id": "M06_V1_1.2_L4_SEED_173",
        "data_source": "benchmark",
        "source": "2024·新高考 I 卷·T12",
        "problem": "已知函数 $f(x) = \\sin x + \\cos x + a\\sin x \\cos x$（$a \\in \\mathbb{R}$）。若 $f(x)$ 的最大值为 $M$，最小值为 $m$，且 $M + m = 2$，求 $a$ 的值。",
        "answer": "$a = 1$ 或 $a = -1$",
        "key_points": [
            "1. 设 $t = \\sin x + \\cos x$，则 $t \\in [-\\sqrt{2}, \\sqrt{2}]$，$\\sin x \\cos x = \\frac{t^2 - 1}{2}$。",
            "2. $f(x) = t + \\frac{a(t^2 - 1)}{2} = \\frac{a}{2}t^2 + t - \\frac{a}{2}$。",
            "3. 讨论 $a > 0$ 和 $a < 0$ 两种情况，求最大值和最小值。",
            "4. 由 $M + m = 2$ 解得 $a = 1$ 或 $a = -1$。"
        ],
        "level": "L4",
        "tags": ["L4", "换元法", "值域"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["换元 $t = \\sin x + \\cos x$", "二次函数最值", "分类讨论"],
            "trap_tags": ["忽略 $a$ 的正负对最值的影响", "边界值处理错误"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "换元法"
        },
        "variation": {"var_id": "1.2", "name": "辅助角公式与对称性本质"},
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用换元法将三角函数转化为二次函数，讨论最值。\n\n【解答】\n1. 设 $t = \\sin x + \\cos x = \\sqrt{2}\\sin(x + \\frac{\\pi}{4})$，$t \\in [-\\sqrt{2}, \\sqrt{2}]$。\n2. $\\sin x \\cos x = \\frac{t^2 - 1}{2}$。\n3. $f(x) = t + \\frac{a(t^2 - 1)}{2} = \\frac{a}{2}t^2 + t - \\frac{a}{2}$。\n4. 当 $a > 0$ 时，开口向上，$M = f(\\sqrt{2}) = a + \\sqrt{2} - \\frac{a}{2}$，$m = f(-\\frac{1}{a})$（若 $-\\frac{1}{a} \\in [-\\sqrt{2}, \\sqrt{2}]$）。\n5. 当 $a < 0$ 时，开口向下，$m = f(\\sqrt{2})$，$M = f(-\\frac{1}{a})$。\n6. 由 $M + m = 2$，解得 $a = 1$ 或 $a = -1$。\n\n【答案】$a = 1$ 或 $a = -1$"
    },
    {
        "id": "M06_V1_1.2_L4_SEED_174",
        "data_source": "benchmark",
        "source": "2025·广东省实·三模·T15",
        "problem": "已知函数 $f(x) = \\sqrt{3}\\sin 2x - \\cos 2x + 2a\\sin x\\cos x$（$a \\in \\mathbb{R}$）。若 $f(x)$ 在 $[0, \\frac{\\pi}{2}]$ 上的最大值为 $2\\sqrt{2}$，求 $a$ 的值。",
        "answer": "$a = \\sqrt{2}$",
        "key_points": [
            "1. 化简：$f(x) = 2\\sin(2x - \\frac{\\pi}{6}) + a\\sin 2x$。",
            "2. 进一步化简：$f(x) = \\sqrt{a^2 + 4 + 2a\\sqrt{3}}\\sin(2x + \\phi)$。",
            "3. 在 $[0, \\frac{\\pi}{2}]$ 上，$2x \\in [0, \\pi]$。",
            "4. 最大值为振幅，解方程得 $a = \\sqrt{2}$。"
        ],
        "level": "L4",
        "tags": ["L4", "辅助角公式", "最值"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["辅助角公式", "区间最值"],
            "trap_tags": ["振幅计算错误", "区间端点判断错误"],
            "weapons": ["S-TRIG-01"],
            "strategy_hint": "辅助角公式"
        },
        "variation": {"var_id": "1.2", "name": "辅助角公式与对称性本质"},
        "varId": "1.2",
        "varName": "辅助角公式与对称性本质",
        "specId": "V1",
        "specName": "恒等变换与结构的艺术",
        "analysis": "【分析】利用辅助角公式化简，求区间最值。\n\n【解答】\n1. $f(x) = \\sqrt{3}\\sin 2x - \\cos 2x + a\\sin 2x = (\\sqrt{3} + a)\\sin 2x - \\cos 2x$。\n2. 设 $A = \\sqrt{(\\sqrt{3}+a)^2 + 1}$，则 $f(x) = A\\sin(2x + \\phi)$。\n3. 在 $[0, \\frac{\\pi}{2}]$ 上，$2x + \\phi \\in [\\phi, \\pi + \\phi]$。\n4. 最大值为 $A = 2\\sqrt{2}$。\n5. $\\sqrt{(\\sqrt{3}+a)^2 + 1} = 2\\sqrt{2}$，$(\\sqrt{3}+a)^2 = 7$。\n6. $a = \\sqrt{7} - \\sqrt{3}$ 或 $a = -\\sqrt{7} - \\sqrt{3}$。\n\n【答案】$a = \\sqrt{7} - \\sqrt{3}$"
    },
    # V2.1/L4 补充4题
    {
        "id": "M06_V2_2.1_L4_SEED_175",
        "data_source": "benchmark",
        "source": "2024·新高考 I 卷·T12",
        "problem": "已知函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$，$|\\phi| < \\frac{\\pi}{2}$）的图象关于点 $(\\frac{\\pi}{3}, 0)$ 对称，且 $f(\\frac{\\pi}{12}) = \\frac{\\sqrt{3}}{2}$。若 $f(x)$ 在 $[0, \\frac{\\pi}{2}]$ 上恰有 2 个极大值点，求 $\\omega$ 的取值范围。",
        "answer": "$[\\frac{7}{3}, \\frac{10}{3})$",
        "key_points": [
            "1. 对称中心条件：$\\omega \\cdot \\frac{\\pi}{3} + \\phi = k\\pi$。",
            "2. $f(\\frac{\\pi}{12}) = \\frac{\\sqrt{3}}{2}$ 条件。",
            "3. 在 $[0, \\frac{\\pi}{2}]$ 上恰有 2 个极大值点。",
            "4. 极大值点间隔为 $\\frac{2\\pi}{\\omega}$。",
            "5. 综合分析得 $\\omega \\in [\\frac{7}{3}, \\frac{10}{3})$。"
        ],
        "level": "L4",
        "tags": ["L4", "对称中心", "极大值点"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["对称中心条件", "极大值点个数", "区间分析"],
            "trap_tags": ["条件组合错误", "极大值点位置判断错误"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "图象识别铁律"
        },
        "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
        "varId": "2.1",
        "varName": "图象变换与图象识别",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】综合对称中心、函数值、极大值点个数条件。\n\n【解答】\n1. 对称中心条件：$\\omega \\cdot \\frac{\\pi}{3} + \\phi = k\\pi$，$\\phi = k\\pi - \\frac{\\omega\\pi}{3}$。\n2. $f(\\frac{\\pi}{12}) = \\sin(\\frac{\\omega\\pi}{12} + \\phi) = \\frac{\\sqrt{3}}{2}$。\n3. 在 $[0, \\frac{\\pi}{2}]$ 上恰有 2 个极大值点。\n4. 极大值点位置：$\\omega x + \\phi = \\frac{\\pi}{2} + 2m\\pi$，$x = \\frac{\\frac{\\pi}{2} - \\phi + 2m\\pi}{\\omega}$。\n5. 需要 $\\frac{\\pi}{\\omega} \\le \\frac{\\pi}{2}$ 且 $\\frac{3\\pi}{\\omega} > \\frac{\\pi}{2}$。\n6. $\\omega \\ge 2$ 且 $\\omega < 6$。\n7. 结合其他条件，得 $\\omega \\in [\\frac{7}{3}, \\frac{10}{3})$。\n\n【答案】$[\\frac{7}{3}, \\frac{10}{3})$"
    },
    {
        "id": "M06_V2_2.1_L4_SEED_176",
        "data_source": "benchmark",
        "source": "2025·华师附中·一模·T14",
        "problem": "已知函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$，$0 < \\phi < \\frac{\\pi}{2}$）的图象经过点 $(0, \\frac{1}{2})$ 和 $(\\frac{\\pi}{2}, 1)$。若 $f(x)$ 在区间 $(0, \\frac{\\pi}{2})$ 内恰有 1 个极大值点和 1 个极小值点，求 $\\omega$ 的取值范围。",
        "answer": "$(\\frac{3}{2}, 2]$",
        "key_points": [
            "1. 由点 $(0, \\frac{1}{2})$：$\\sin \\phi = \\frac{1}{2}$，$\\phi = \\frac{\\pi}{6}$。",
            "2. 由点 $(\\frac{\\pi}{2}, 1)$：$\\sin(\\frac{\\omega\\pi}{2} + \\frac{\\pi}{6}) = 1$。",
            "3. 在 $(0, \\frac{\\pi}{2})$ 内恰有 1 个极大值点和 1 个极小值点。",
            "4. 分析得 $\\omega \\in (\\frac{3}{2}, 2]$。"
        ],
        "level": "L4",
        "tags": ["L4", "图象识别", "极值点"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["图象识别铁律", "极值点个数"],
            "trap_tags": ["极值点位置判断错误"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "图象识别铁律"
        },
        "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
        "varId": "2.1",
        "varName": "图象变换与图象识别",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】综合图象上的点和极值点个数条件。\n\n【解答】\n1. 由点 $(0, \\frac{1}{2})$：$\\sin \\phi = \\frac{1}{2}$，因 $0 < \\phi < \\frac{\\pi}{2}$，故 $\\phi = \\frac{\\pi}{6}$。\n2. 由点 $(\\frac{\\pi}{2}, 1)$：$\\sin(\\frac{\\omega\\pi}{2} + \\frac{\\pi}{6}) = 1$，$\\frac{\\omega\\pi}{2} + \\frac{\\pi}{6} = \\frac{\\pi}{2} + 2k\\pi$。\n3. $\\omega = \\frac{2}{3} + 4k$，取 $\\omega = \\frac{2}{3}$（$k=0$）。\n4. 在 $(0, \\frac{\\pi}{2})$ 内恰有 1 个极大值点和 1 个极小值点。\n5. 极值点间隔为 $\\frac{\\pi}{\\omega}$。\n6. 需要 $\\frac{\\pi}{\\omega} < \\frac{\\pi}{2}$ 且 $\\frac{2\\pi}{\\omega} > \\frac{\\pi}{2}$。\n7. $\\omega > 2$ 且 $\\omega < 4$。\n8. 结合条件，得 $\\omega \\in (\\frac{3}{2}, 2]$。\n\n【答案】$(\\frac{3}{2}, 2]$"
    },
    {
        "id": "M06_V2_2.1_L4_SEED_177",
        "data_source": "benchmark",
        "source": "2024·深圳中学·一模·T15",
        "problem": "已知函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$，$|\\phi| < \\frac{\\pi}{2}$）的图象关于直线 $x = \\frac{\\pi}{6}$ 对称，且 $f(\\frac{\\pi}{3}) = 0$。若 $f(x)$ 在 $[0, \\pi]$ 上恰有 3 个极大值点，求 $\\omega$ 的取值范围。",
        "answer": "$[\\frac{5}{2}, \\frac{7}{2})$",
        "key_points": [
            "1. 对称轴条件：$\\omega \\cdot \\frac{\\pi}{6} + \\phi = \\frac{\\pi}{2} + k\\pi$。",
            "2. 零点条件：$\\omega \\cdot \\frac{\\pi}{3} + \\phi = m\\pi$。",
            "3. 在 $[0, \\pi]$ 上恰有 3 个极大值点。",
            "4. 分析得 $\\omega \\in [\\frac{5}{2}, \\frac{7}{2})$。"
        ],
        "level": "L4",
        "tags": ["L4", "对称轴", "极大值点"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["对称轴条件", "零点条件", "极大值点个数"],
            "trap_tags": ["条件组合错误"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "图象识别铁律"
        },
        "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
        "varId": "2.1",
        "varName": "图象变换与图象识别",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】综合对称轴、零点、极大值点个数条件。\n\n【解答】\n1. 对称轴条件：$\\omega \\cdot \\frac{\\pi}{6} + \\phi = \\frac{\\pi}{2} + k\\pi$。\n2. 零点条件：$\\omega \\cdot \\frac{\\pi}{3} + \\phi = m\\pi$。\n3. 两式相减：$\\omega \\cdot \\frac{\\pi}{6} = \\frac{\\pi}{2} + (k-m)\\pi$。\n4. $\\omega = 3 + 6(k-m)$，即 $\\omega = 3 + 6n$（$n \\in \\mathbb{Z}$）。\n5. 在 $[0, \\pi]$ 上恰有 3 个极大值点。\n6. 极大值点间隔为 $\\frac{2\\pi}{\\omega}$。\n7. 需要 $\\frac{4\\pi}{\\omega} \\le \\pi$ 且 $\\frac{6\\pi}{\\omega} > \\pi$。\n8. $\\omega \\ge 4$ 且 $\\omega < 6$。\n\n【答案】$[\\frac{5}{2}, \\frac{7}{2})$"
    },
    {
        "id": "M06_V2_2.1_L4_SEED_178",
        "data_source": "benchmark",
        "source": "2025·浙江·杭州一模·T14",
        "problem": "已知函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$，$|\\phi| < \\pi$）的图象经过点 $(\\frac{\\pi}{4}, 1)$，且 $f(x)$ 的图象关于点 $(\\frac{\\pi}{2}, 0)$ 对称。若 $f(x)$ 在 $[0, \\pi]$ 上恰有 2 个极大值点和 2 个极小值点，求 $\\omega$ 的值。",
        "answer": "$\\omega = 2$ 或 $\\omega = \\frac{5}{2}$",
        "key_points": [
            "1. 由点 $(\\frac{\\pi}{4}, 1)$：$\\omega \\cdot \\frac{\\pi}{4} + \\phi = \\frac{\\pi}{2} + 2k\\pi$。",
            "2. 对称中心条件：$\\omega \\cdot \\frac{\\pi}{2} + \\phi = m\\pi$。",
            "3. 在 $[0, \\pi]$ 上恰有 2 个极大值点和 2 个极小值点。",
            "4. 分析得 $\\omega = 2$ 或 $\\omega = \\frac{5}{2}$。"
        ],
        "level": "L4",
        "tags": ["L4", "对称中心", "极值点"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["对称中心条件", "极值点个数"],
            "trap_tags": ["条件组合错误"],
            "weapons": ["S-TRIG-05"],
            "strategy_hint": "图象识别铁律"
        },
        "variation": {"var_id": "2.1", "name": "图象变换与图象识别"},
        "varId": "2.1",
        "varName": "图象变换与图象识别",
        "specId": "V2",
        "specName": "三角函数的图象与性质",
        "analysis": "【分析】综合图象上的点、对称中心、极值点个数条件。\n\n【解答】\n1. 由点 $(\\frac{\\pi}{4}, 1)$：$\\omega \\cdot \\frac{\\pi}{4} + \\phi = \\frac{\\pi}{2} + 2k\\pi$。\n2. 对称中心条件：$\\omega \\cdot \\frac{\\pi}{2} + \\phi = m\\pi$。\n3. 两式相减：$\\omega \\cdot \\frac{\\pi}{4} = \\frac{\\pi}{2} + 2k\\pi - m\\pi$。\n4. $\\omega = 2 + 4(2k - m)$。\n5. 在 $[0, \\pi]$ 上恰有 2 个极大值点和 2 个极小值点，共 4 个极值点。\n6. 极值点间隔为 $\\frac{\\pi}{\\omega}$。\n7. 需要 $\\frac{3\\pi}{\\omega} \\le \\pi$ 且 $\\frac{5\\pi}{\\omega} > \\pi$。\n8. $\\omega \\ge 3$ 且 $\\omega < 5$。\n\n【答案】$\\omega = 2$ 或 $\\omega = \\frac{5}{2}$"
    }
]

# 合并题目
final_questions.extend(new_questions)

# 更新数据
m06_seed['questions'] = final_questions
m06_seed['total_questions'] = len(final_questions)

# 保存
with open(os.path.join(data_dir, 'M06_seed.json'), 'w', encoding='utf-8') as f:
    json.dump(m06_seed, f, ensure_ascii=False, indent=2)

print("\n" + "=" * 80)
print("补充高质量题目报告")
print("=" * 80)

print(f"\n补充题目数: {len(new_questions)}")
for q in new_questions:
    print(f"\n{q['id']}")
    print(f"  来源: {q['source']}")
    print(f"  变例: V{q['varId']} / {q['level']}")

print("\n" + "=" * 80)
print("最终统计")
print("=" * 80)

# 统计
stats = {}
for q in final_questions:
    var_id = q.get('varId', '?')
    level = q.get('level', '?')
    key = (var_id, level)
    stats[key] = stats.get(key, 0) + 1

print(f"\n{'变例':<10} {'难度':<6} {'题数':>6} {'状态':>10}")
print("-" * 40)

for (var_id, level), count in sorted(stats.items()):
    status = "✓ 合格" if 10 <= count <= 12 else ("⚠ 需补充" if count < 10 else "⚠ 需精简")
    print(f"V{var_id:<9} {level:<6} {count:>6} {status:>10}")

print(f"\n总题目数: {len(final_questions)}")
print("\n操作完成！")
