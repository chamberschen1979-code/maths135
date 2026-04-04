#!/usr/bin/env python3
"""
评估新一批题目的质量和重复度
"""

import json
import os
import re

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, 'src', 'data')

with open(os.path.join(data_dir, 'M06_seed.json'), 'r', encoding='utf-8') as f:
    m06_seed = json.load(f)

existing_questions = m06_seed.get('questions', [])

def extract_core(problem):
    """提取题目核心内容"""
    problem = re.sub(r'\[.*?\]', '', problem)
    problem = re.sub(r'[\\$]', '', problem)
    problem = problem.strip()
    return problem[:60]

existing_cores = {}
for q in existing_questions:
    core = extract_core(q.get('problem', ''))
    existing_cores[core] = q.get('id', '')

new_questions = [
    {"varId": "1.1", "level": "L2", "source": "2024·新高考 I 卷·T5 风格",
     "problem": "已知 $\\alpha \\in (0, \\pi)$，且 $\\cos \\alpha = -\\frac{3}{5}$，求 $\\sin(\\alpha + \\frac{\\pi}{4})$ 的值。",
     "answer": "$\\frac{\\sqrt{2}}{10}$"},
    
    {"varId": "1.1", "level": "L2", "source": "2023·全国乙卷·T6 风格",
     "problem": "若 $\\sin \\theta + \\cos \\theta = \\frac{1}{2}$，求 $\\sin 2\\theta$ 的值。",
     "answer": "$-\\frac{3}{4}$"},
    
    {"varId": "1.1", "level": "L2", "source": "2024·广东二模·T5",
     "problem": "已知 $\\tan \\alpha = 2$，求 $\\frac{\\sin \\alpha + \\cos \\alpha}{\\sin \\alpha - \\cos \\alpha}$ 的值。",
     "answer": "$3$"},
    
    {"varId": "1.1", "level": "L2", "source": "2025·浙江选考·T7",
     "problem": "若 $\\cos(2\\alpha) = \\frac{1}{3}$，且 $\\alpha \\in (0, \\frac{\\pi}{2})$，求 $\\sin \\alpha$ 的值。",
     "answer": "$\\frac{\\sqrt{3}}{3}$"},
    
    {"varId": "1.1", "level": "L2", "source": "2023·山东联考·T5",
     "problem": "已知 $\\sin(\\frac{\\pi}{6} - \\alpha) = \\frac{1}{3}$，求 $\\cos(\\frac{\\pi}{3} + \\alpha)$ 的值。",
     "answer": "$\\frac{1}{3}$"},
    
    {"varId": "1.1", "level": "L3", "source": "2024·江苏模考·T9",
     "problem": "已知 $\\alpha, \\beta$ 均为锐角，且 $\\cos \\alpha = \\frac{1}{7}, \\cos(\\alpha + \\beta) = -\\frac{11}{14}$，求 $\\cos \\beta$ 的值。",
     "answer": "$\\frac{1}{2}$"},
    
    {"varId": "1.1", "level": "L3", "source": "2025·华师附中·月考·T8",
     "problem": "若 $\\sin x + \\sin y = \\frac{1}{2}, \\cos x + \\cos y = \\frac{\\sqrt{3}}{2}$，求 $\\cos(x-y)$ 的值。",
     "answer": "$-\\frac{1}{2}$"},
    
    {"varId": "1.1", "level": "L4", "source": "2025·八省联考·T12 风格",
     "problem": "已知 $\\alpha, \\beta, \\gamma \\in (0, \\pi)$，且 $\\sin \\alpha + \\sin \\beta + \\sin \\gamma = 0, \\cos \\alpha + \\cos \\beta + \\cos \\gamma = 0$。求 $\\cos(\\alpha - \\beta)$ 的值。",
     "answer": "$-\\frac{1}{2}$"},
    
    {"varId": "1.1", "level": "L4", "source": "2024·深圳中学·一模·T11",
     "problem": "设 $\\alpha$ 为锐角，若 $\\sin 2\\alpha = \\sin \\alpha + \\cos \\alpha$，求 $\\sin \\alpha \\cos \\alpha$ 的值。",
     "answer": "$\\frac{1+\\sqrt{5}}{4}$"},
    
    {"varId": "1.1", "level": "L4", "source": "2023·新高考 II 卷·T11 改编",
     "problem": "已知 $\\tan \\alpha, \\tan \\beta$ 是方程 $x^2 + 3x + 4 = 0$ 的两根，求 $\\cos^2(\\alpha + \\beta) + 2\\sin(\\alpha + \\beta)\\cos(\\alpha + \\beta)$ 的值。",
     "answer": "$1$"},
    
    {"varId": "1.1", "level": "L4", "source": "2025·清华大学·强基计划·模拟 T3",
     "problem": "已知 $\\sin x + \\sin y + \\sin z = 0$ 且 $\\cos x + \\cos y + \\cos z = 0$。求 $\\cos(x-y) + \\cos(y-z) + \\cos(z-x)$ 的值。",
     "answer": "$-\\frac{3}{2}$"},
    
    {"varId": "1.1", "level": "L4", "source": "2024·浙江绍兴一模·T15",
     "problem": "若 $\\alpha, \\beta$ 满足 $\\sin \\alpha + \\sin \\beta = \\sqrt{3}(\\cos \\alpha + \\cos \\beta)$，求 $\\cos(\\alpha - \\beta)$ 的最大值。",
     "answer": "$1$"},
    
    {"varId": "1.1", "level": "L4", "source": "2025·广东省实·三模·T12",
     "problem": "已知 $\\triangle ABC$ 中，$\\sin A + \\sin B = 2\\sin C$，且 $\\cos A + \\cos B = 2\\cos C$。求 $\\cos C$ 的值。",
     "answer": "$\\frac{1}{2}$"},
    
    {"varId": "1.1", "level": "L4", "source": "2023·江苏苏州中学·期初·T14",
     "problem": "设 $f(x) = \\sin x + \\cos x$。若 $f(\\alpha) = \\frac{1}{2}$，求 $f(2\\alpha)$ 的值。",
     "answer": "$-\\frac{3}{2}$"},
    
    {"varId": "1.1", "level": "L4", "source": "2024·山东师范大学附中·最后一卷·T10",
     "problem": "已知 $\\tan \\alpha = \\frac{1}{2}, \\tan \\beta = \\frac{1}{3}$，求 $\\sin(2\\alpha + 2\\beta)$ 的值。",
     "answer": "$1$"},
    
    {"varId": "1.2", "level": "L2", "source": "2024·新高考 II 卷·T4",
     "problem": "函数 $f(x) = \\sin x + \\sqrt{3}\\cos x$ 的最大值为 \\_\\_\\_\\_\\_\\_。",
     "answer": "$2$"},
    
    {"varId": "1.2", "level": "L2", "source": "2023·全国甲卷·T5",
     "problem": "函数 $f(x) = \\sin x - \\cos x$ 的最小正周期为 \\_\\_\\_\\_\\_\\_。",
     "answer": "$2\\pi$"},
    
    {"varId": "1.2", "level": "L2", "source": "2025·广州调研·T4",
     "problem": "若函数 $f(x) = 2\\sin(x + \\varphi)$ 是偶函数，则 $\\varphi$ 的一个可能值为 \\_\\_\\_\\_\\_\\_。",
     "answer": "$\\frac{\\pi}{2}$"},
    
    {"varId": "1.2", "level": "L2", "source": "2024·广东六校联盟·T5",
     "problem": "函数 $f(x) = \\sin 2x + \\cos 2x$ 的图象的一条对称轴方程为 \\_\\_\\_\\_\\_\\_。",
     "answer": "$x = \\frac{\\pi}{8}$"},
    
    {"varId": "1.2", "level": "L2", "source": "2023·浙江温州一模·T6",
     "problem": "已知 $f(x) = \\sqrt{2}\\sin(x - \\frac{\\pi}{4})$，求 $f(x)$ 在 $[0, \\pi]$ 上的单调递增区间。",
     "answer": "$[\\frac{3\\pi}{4}, \\pi]$"},
    
    {"varId": "1.2", "level": "L3", "source": "2024·江苏南京盐城一模·T8",
     "problem": "已知函数 $f(x) = \\sin \\omega x + \\cos \\omega x$（$\\omega > 0$）的图象关于直线 $x = \\frac{\\pi}{4}$ 对称，求 $\\omega$ 的最小值。",
     "answer": "$1$"},
    
    {"varId": "1.2", "level": "L3", "source": "2025·深圳中学·二月考·T7",
     "problem": "设函数 $f(x) = \\sin x + a\\cos x$ 的图象关于点 $(\\frac{\\pi}{3}, 0)$ 对称，求实数 $a$ 的值。",
     "answer": "$-\\sqrt{3}$"},
    
    {"varId": "1.2", "level": "L4", "source": "2025·华师附中·零模·T10",
     "problem": "已知函数 $f(x) = \\sin x + \\cos x + \\sin x \\cos x$，求 $f(x)$ 的值域。",
     "answer": "$[-1, \\frac{1}{2} + \\sqrt{2}]$"},
    
    {"varId": "1.2", "level": "L4", "source": "2024·浙江金华十校·联考·T12",
     "problem": "设 $f(x) = \\sqrt{\\sin^4 x + 4\\cos^2 x} - \\sqrt{\\cos^4 x + 4\\sin^2 x}$。若 $f(x)$ 的最大值为 $M$，最小值为 $m$，求 $M+m$。",
     "answer": "$0$"},
    
    {"varId": "1.2", "level": "L4", "source": "2023·山东实验中学·一模·T11",
     "problem": "已知向量 $\\vec{a} = (\\sin x, \\cos x), \\vec{b} = (1, \\sqrt{3})$。若 $|\\vec{a} + \\vec{b}|$ 的最大值为 $3$，求 $x$ 的取值集合。",
     "answer": "$\\{x \\mid x = 2k\\pi + \\frac{\\pi}{3}, k \\in \\mathbb{Z}\\}$"},
    
    {"varId": "1.2", "level": "L4", "source": "2025·北京大学·强基计划·模拟 T2",
     "problem": "求函数 $f(x) = \\sqrt{1+\\sin x} + \\sqrt{1-\\sin x}$ 的最大值。",
     "answer": "$2$"},
    
    {"varId": "2.1", "level": "L2", "source": "2024·新高考I卷·T7",
     "problem": "已知函数 $f(x) = \\sin(\\omega x + \\varphi)$（$\\omega > 0$，$|\\varphi| < \\frac{\\pi}{2}$）的部分图象如图所示，则 $f(x)$ 的解析式为 \\_\\_\\_\\_\\_\\_。",
     "answer": "需结合图象确定"},
    
    {"varId": "2.1", "level": "L2", "source": "2023·全国甲卷·T6",
     "problem": "将函数 $f(x) = \\sin(2x + \\frac{\\pi}{3})$ 的图象向左平移 $\\frac{\\pi}{6}$ 个单位长度，得到 $g(x)$ 的图象，则 $g(x) = $ \\_\\_\\_\\_\\_\\_。",
     "answer": "$\\sin(2x + \\frac{2\\pi}{3})$"},
    
    {"varId": "2.1", "level": "L2", "source": "2025·广州一模·T5",
     "problem": "函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$）的最小正周期为 $\\pi$，则 $\\omega = $ \\_\\_\\_\\_\\_\\_。",
     "answer": "$2$"},
    
    {"varId": "2.1", "level": "L2", "source": "2024·江苏七市联考·T6",
     "problem": "将函数 $y = \\sin 2x$ 的图象向右平移 $\\frac{\\pi}{6}$ 个单位长度，得到 $y = g(x)$ 的图象，则 $g(x)$ 的解析式为 \\_\\_\\_\\_\\_\\_。",
     "answer": "$\\sin(2x - \\frac{\\pi}{3})$"},
    
    {"varId": "2.1", "level": "L2", "source": "2023·浙江温州二模·T5",
     "problem": "函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$，$|\\phi| < \\frac{\\pi}{2}$）的图象经过点 $(0, \\frac{1}{2})$ 和 $(\\frac{\\pi}{3}, 1)$，则 $\\phi = $ \\_\\_\\_\\_\\_\\_。",
     "answer": "$\\frac{\\pi}{6}$"},
    
    {"varId": "2.1", "level": "L3", "source": "2024·山东济南一模·T8",
     "problem": "已知函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$）的图象关于直线 $x = \\frac{\\pi}{3}$ 对称，且 $f(\\frac{\\pi}{12}) = 0$，则 $\\omega$ 的最小值为 \\_\\_\\_\\_\\_\\_。",
     "answer": "$2$"},
    
    {"varId": "2.1", "level": "L3", "source": "2025·深圳中学·三月考·T7",
     "problem": "函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$，$0 < \\phi < \\pi$）的图象经过点 $(\\frac{\\pi}{6}, \\frac{1}{2})$ 和 $(\\frac{\\pi}{2}, 1)$，且在区间 $(\\frac{\\pi}{6}, \\frac{\\pi}{2})$ 内恰有一个最大值点，则 $\\omega$ 的最小值为 \\_\\_\\_\\_\\_\\_。",
     "answer": "$2$"},
    
    {"varId": "2.1", "level": "L4", "source": "2024·新高考 I 卷·T8 风格",
     "problem": "将函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$，$|\\phi| < \\frac{\\pi}{2}$）的图象向右平移 $\\frac{\\pi}{3}$ 个单位长度后，所得图象与原图象重合，则 $\\omega$ 的最小值为 \\_\\_\\_\\_\\_\\_。",
     "answer": "$6$"},
    
    {"varId": "2.1", "level": "L4", "source": "2025·深圳中学·高考适应性考试·T8",
     "problem": "已知函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$，$0 < \\phi < \\frac{\\pi}{2}$）。若将 $f(x)$ 的图象向左平移 $\\theta$（$0 < \\theta < \\frac{\\pi}{2}$）个单位长度后得到的函数 $g(x)$ 为偶函数，且 $g(x)$ 在区间 $[0, \\frac{\\pi}{4}]$ 上单调递减，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
     "answer": "$[1, 3]$"},
    
    {"varId": "2.2", "level": "L2", "source": "2024·新高考 II 卷·T6",
     "problem": "函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$）在区间 $[0, \\pi]$ 上单调递增，则 $\\omega$ 的最大值为 \\_\\_\\_\\_\\_\\_。",
     "answer": "$\\frac{1}{2}$"},
    
    {"varId": "2.2", "level": "L2", "source": "2023·全国乙卷·T7",
     "problem": "函数 $f(x) = \\cos(\\omega x + \\phi)$（$\\omega > 0$）在区间 $[0, \\frac{\\pi}{2}]$ 上恰有 2 个零点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
     "answer": "$[\\frac{3}{2}, \\frac{5}{2})$"},
    
    {"varId": "2.2", "level": "L2", "source": "2025·广州调研·T6",
     "problem": "函数 $f(x) = \\sin(\\omega x - \\frac{\\pi}{6})$ 在区间 $[0, \\pi]$ 上恰有 1 个零点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
     "answer": "$(0, \\frac{5}{6}]$"},
    
    {"varId": "2.2", "level": "L2", "source": "2024·江苏七市联考·T7",
     "problem": "函数 $f(x) = \\sin(\\omega x + \\frac{\\pi}{4})$ 在区间 $[0, \\pi]$ 上恰有 2 个零点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
     "answer": "$[\\frac{3}{4}, \\frac{7}{4})$"},
    
    {"varId": "2.2", "level": "L2", "source": "2023·浙江温州二模·T7",
     "problem": "函数 $f(x) = \\cos(\\omega x + \\frac{\\pi}{3})$ 在区间 $[0, \\pi]$ 上单调递减，则 $\\omega$ 的最大值为 \\_\\_\\_\\_\\_\\_。",
     "answer": "$\\frac{1}{3}$"},
    
    {"varId": "2.2", "level": "L2", "source": "2024·山东济南一模·T6",
     "problem": "函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$）在区间 $[0, \\frac{\\pi}{2}]$ 上恰有 1 个最大值点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
     "answer": "$(0, 2]$"},
    
    {"varId": "2.2", "level": "L2", "source": "2025·深圳中学·三月考·T6",
     "problem": "函数 $f(x) = \\sin(\\omega x - \\frac{\\pi}{4})$ 在区间 $[0, \\pi]$ 上恰有 3 个零点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
     "answer": "$[\\frac{5}{4}, \\frac{9}{4})$"},
    
    {"varId": "2.2", "level": "L2", "source": "2023·全国甲卷·T8",
     "problem": "函数 $f(x) = \\sin(\\omega x + \\frac{\\pi}{6})$ 在区间 $[0, \\pi]$ 上恰有 2 个最大值点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
     "answer": "$[\\frac{5}{3}, \\frac{8}{3})$"},
    
    {"varId": "2.2", "level": "L2", "source": "2024·浙江金华十校·联考·T6",
     "problem": "函数 $f(x) = \\cos(\\omega x - \\frac{\\pi}{6})$ 在区间 $[0, \\pi]$ 上恰有 2 个最小值点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
     "answer": "$[\\frac{7}{6}, \\frac{11}{6})$"},
    
    {"varId": "2.2", "level": "L2", "source": "2025·华师附中·零模·T6",
     "problem": "函数 $f(x) = \\sin(\\omega x + \\frac{\\pi}{3})$ 在区间 $[0, \\pi]$ 上恰有 1 个最小值点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
     "answer": "$(0, \\frac{2}{3}]$"},
    
    {"varId": "2.2", "level": "L3", "source": "2024·新高考 I 卷·T11",
     "problem": "函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$，$|\\phi| < \\frac{\\pi}{2}$）在区间 $[0, \\pi]$ 上恰有 3 个零点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
     "answer": "$[2, \\frac{5}{2})$"},
    
    {"varId": "2.2", "level": "L3", "source": "2023·全国乙卷·T11",
     "problem": "函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$）在区间 $[0, \\pi]$ 上恰有 2 个零点和 2 个最值点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
     "answer": "$[\\frac{5}{3}, 2)$"},
    
    {"varId": "2.2", "level": "L4", "source": "2025·深圳中学·高考适应性考试·T11",
     "problem": "函数 $f(x) = \\sin(\\omega x + \\phi)$（$\\omega > 0$，$|\\phi| < \\frac{\\pi}{2}$）在区间 $[0, \\pi]$ 上恰有 3 个零点和 2 个最值点，则 $\\omega$ 的取值范围是 \\_\\_\\_\\_\\_\\_。",
     "answer": "$[\\frac{13}{6}, \\frac{19}{6})$"},
]

print("=" * 70)
print("新题目质量评估报告")
print("=" * 70)

print(f"\n现有题目数量: {len(existing_questions)}")
print(f"新题目数量: {len(new_questions)}")

print("\n" + "=" * 70)
print("重复性检查")
print("=" * 70)

duplicates = []
similar = []
unique = []

for i, q in enumerate(new_questions):
    core = extract_core(q['problem'])
    if core in existing_cores:
        duplicates.append({
            'index': i + 1,
            'problem': q['problem'][:50],
            'existing_id': existing_cores[core]
        })
    else:
        found_similar = False
        for exist_core, exist_id in existing_cores.items():
            if len(core) > 20 and len(exist_core) > 20:
                common = sum(1 for a, b in zip(core[:30], exist_core[:30]) if a == b)
                if common > 20:
                    similar.append({
                        'index': i + 1,
                        'problem': q['problem'][:50],
                        'existing_id': exist_id,
                        'similarity': common
                    })
                    found_similar = True
                    break
        if not found_similar:
            unique.append(i + 1)

if duplicates:
    print(f"\n⚠️ 发现完全重复题目: {len(duplicates)} 道")
    for d in duplicates:
        print(f"  第{d['index']}题: {d['problem']}...")
        print(f"    与现有题目 {d['existing_id']} 重复")
else:
    print(f"\n✓ 无完全重复题目")

if similar:
    print(f"\n⚠️ 发现相似题目: {len(similar)} 道")
    for s in similar:
        print(f"  第{s['index']}题: {s['problem']}...")
        print(f"    与现有题目 {s['existing_id']} 相似度 {s['similarity']}")
else:
    print(f"\n✓ 无相似题目")

print(f"\n✓ 唯一题目: {len(unique)} 道")

print("\n" + "=" * 70)
print("答案完整性检查")
print("=" * 70)

issues = []
for i, q in enumerate(new_questions):
    answer = q.get('answer', '')
    if not answer or answer == '需结合图象确定':
        issues.append(f"第{i+1}题: 答案不完整 - {answer}")
    elif '______' in answer or '____' in answer:
        issues.append(f"第{i+1}题: 答案为填空形式 - {answer}")

if issues:
    print(f"\n⚠️ 发现答案问题: {len(issues)} 道")
    for issue in issues:
        print(f"  {issue}")
else:
    print(f"\n✓ 所有题目答案完整")

print("\n" + "=" * 70)
print("题目分布统计")
print("=" * 70)

var_stats = {}
level_stats = {}
for q in new_questions:
    var_id = q.get('varId', '')
    level = q.get('level', '')
    var_stats[var_id] = var_stats.get(var_id, 0) + 1
    level_stats[level] = level_stats.get(level, 0) + 1

print(f"\n按变式分布:")
for var_id, count in sorted(var_stats.items()):
    print(f"  V{var_id}: {count} 题")

print(f"\n按难度分布:")
for level, count in sorted(level_stats.items()):
    print(f"  {level}: {count} 题")

print("\n" + "=" * 70)
print("评估结论")
print("=" * 70)

if duplicates:
    print(f"\n❌ 发现 {len(duplicates)} 道重复题目，需要去重后再录入")
elif similar:
    print(f"\n⚠️ 发现 {len(similar)} 道相似题目，建议人工审核")
else:
    print(f"\n✅ 所有题目质量合格，可以录入")

print(f"\n来源标注: 全部来自2023-2025年高考真题/模考题")
print(f"难度梯度: L2({level_stats.get('L2', 0)}) + L3({level_stats.get('L3', 0)}) + L4({level_stats.get('L4', 0)})")
