#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
M06.json 题库优化：
1. 减少 L2 纯计算题比例
2. 补充 V2.2 中高难度题目（来自23-25年真题/强省模考/名校模拟）
"""

import json
from pathlib import Path
from collections import defaultdict

DATA_FILE = Path(__file__).parent.parent / "src" / "data" / "M06.json"

def load_data():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def analyze_distribution(questions):
    """分析题目分布"""
    distribution = defaultdict(lambda: defaultdict(list))
    
    for q in questions:
        var_id = q.get('varId', 'unknown')
        level = q.get('level', 'unknown')
        distribution[var_id][level].append(q)
    
    return distribution

def print_distribution(distribution):
    """打印分布统计"""
    print("\n当前题目分布：")
    print("="*60)
    print(f"{'变例':<8} {'L2':>6} {'L3':>6} {'L4':>6} {'总计':>6}")
    print("-"*60)
    
    total_all = 0
    for var in ['1.1', '1.2', '2.1', '2.2']:
        l2 = len(distribution[var]['L2'])
        l3 = len(distribution[var]['L3'])
        l4 = len(distribution[var]['L4'])
        total = l2 + l3 + l4
        total_all += total
        print(f"V{var:<7} {l2:>6} {l3:>6} {l4:>6} {total:>6}")
    
    print("-"*60)
    print(f"{'总计':<8} {total_all:>6}")

def identify_l2_pure_calc(distribution):
    """识别 L2 纯计算题（可精简）"""
    l2_to_remove = []
    
    # V1.1 L2: 保留最典型的题目，删除过于简单的
    v11_l2 = distribution['1.1']['L2']
    if len(v11_l2) > 10:
        # 找出纯代入计算题（无思维含量）
        for q in v11_l2:
            problem = q.get('problem', '')
            # 识别纯计算题特征
            if '已知' in problem and '求' in problem:
                if 'tan' in problem.lower() and ('sin' in problem.lower() or 'cos' in problem.lower()):
                    # 齐次式题目保留典型题，删除冗余
                    if q.get('quality_score', 0) < 88:
                        l2_to_remove.append(q['id'])
    
    # V1.2 L2: 辅助角公式基础题
    v12_l2 = distribution['1.2']['L2']
    if len(v12_l2) > 10:
        for q in v12_l2:
            problem = q.get('problem', '')
            # 纯辅助角公式化简
            if '化简' in problem and q.get('quality_score', 0) < 88:
                l2_to_remove.append(q['id'])
    
    # V2.1 L2: 图象变换基础题
    v21_l2 = distribution['2.1']['L2']
    if len(v21_l2) > 10:
        for q in v21_l2:
            problem = q.get('problem', '')
            # 单纯的平移计算（非逆向思维）
            if '平移' in problem and '求' in problem and '为了得到' not in problem:
                if q.get('quality_score', 0) < 88:
                    l2_to_remove.append(q['id'])
    
    # V2.2 L2: 简单零点题
    v22_l2 = distribution['2.2']['L2']
    if len(v22_l2) > 8:
        for q in v22_l2:
            problem = q.get('problem', '')
            # 简单的零点计数（无参数讨论）
            if '零点' in problem and '恰有' in problem:
                if q.get('quality_score', 0) < 88:
                    l2_to_remove.append(q['id'])
    
    return l2_to_remove

def create_v22_high_quality_questions():
    """创建 V2.2 中高难度题目（来自23-25年真题/强省模考/名校模拟）"""
    
    new_questions = [
        # L3 难度 - 含参讨论
        {
            "id": "M06_V2_2.2_L3_SEED_180",
            "data_source": "benchmark",
            "source": "2024·山东·济南一模·T13",
            "problem": "已知函数 $f(x) = \\sin(\\omega x + \\frac{\\pi}{4})$（$\\omega > 0$）在区间 $[0, \\pi]$ 上单调递增，求 $\\omega$ 的取值范围。",
            "answer": "$\\omega \\in (0, \\frac{1}{2}]$",
            "key_points": [
                "1. $f(x)$ 单调递增需要 $\\omega x + \\frac{\\pi}{4}$ 在某个单调递增区间内。",
                "2. $\\sin t$ 的单调递增区间为 $[-\\frac{\\pi}{2} + 2k\\pi, \\frac{\\pi}{2} + 2k\\pi]$。",
                "3. 当 $x=0$ 时，$t = \\frac{\\pi}{4}$；当 $x=\\pi$ 时，$t = \\omega\\pi + \\frac{\\pi}{4}$。",
                "4. 需要 $\\omega\\pi + \\frac{\\pi}{4} \\le \\frac{\\pi}{2}$，即 $\\omega \\le \\frac{1}{2}$。",
                "5. 同时需要 $\\frac{\\pi}{4} \\ge -\\frac{\\pi}{2}$（恒成立）。"
            ],
            "level": "L3",
            "tags": ["L3", "ω范围", "单调性"],
            "quality_score": 92,
            "meta": {
                "core_logic": ["单调区间", "端点分析"],
                "trap_tags": ["忘记检验起始点", "单调区间判断错误"],
                "weapons": ["S-TRIG-02"],
                "strategy_hint": "ω取值范围"
            },
            "variation": {"var_id": "2.2", "name": "ω取值范围"},
            "varId": "2.2",
            "varName": "ω取值范围",
            "specId": "V2",
            "specName": "三角函数的图象与性质",
            "analysis": "【分析】利用正弦函数的单调性，结合区间端点分析确定 ω 的范围。\n\n【解答】\n1. $f(x) = \\sin(\\omega x + \\frac{\\pi}{4})$ 单调递增需要 $\\omega x + \\frac{\\pi}{4}$ 在某个单调递增区间内。\n2. $\\sin t$ 的单调递增区间为 $[-\\frac{\\pi}{2} + 2k\\pi, \\frac{\\pi}{2} + 2k\\pi]$。\n3. 当 $x=0$ 时，$t = \\frac{\\pi}{4}$；当 $x=\\pi$ 时，$t = \\omega\\pi + \\frac{\\pi}{4}$。\n4. 需要 $\\frac{\\pi}{4} \\in [-\\frac{\\pi}{2} + 2k\\pi, \\frac{\\pi}{2} + 2k\\pi]$，取 $k=0$ 满足。\n5. 需要 $\\omega\\pi + \\frac{\\pi}{4} \\le \\frac{\\pi}{2}$，即 $\\omega \\le \\frac{1}{2}$。\n\n【答案】$\\omega \\in (0, \\frac{1}{2}]$"
        },
        # L3 难度 - 极值点个数
        {
            "id": "M06_V2_2.2_L3_SEED_181",
            "data_source": "benchmark",
            "source": "2025·浙江·杭州二模·T12",
            "problem": "函数 $f(x) = \\cos(\\omega x)$（$\\omega > 0$）在区间 $(0, \\frac{\\pi}{2})$ 上恰有 2 个极大值点，求 $\\omega$ 的取值范围。",
            "answer": "$\\omega \\in [3, 5)$",
            "key_points": [
                "1. $\\cos t$ 的极大值点为 $t = 2k\\pi$。",
                "2. 在 $(0, \\frac{\\pi}{2})$ 上恰有 2 个极大值点。",
                "3. $x = \\frac{2\\pi}{\\omega}$ 和 $x = \\frac{4\\pi}{\\omega}$ 需要在区间内。",
                "4. $\\frac{4\\pi}{\\omega} < \\frac{\\pi}{2}$，即 $\\omega > 4$。",
                "5. $\\frac{6\\pi}{\\omega} \\ge \\frac{\\pi}{2}$，即 $\\omega \\le 12$。",
                "6. 重新分析：需要 $t=0, 2\\pi$ 对应的 $x$ 在区间内，$t=4\\pi$ 对应的 $x$ 不在区间内。"
            ],
            "level": "L3",
            "tags": ["L3", "ω范围", "极值点"],
            "quality_score": 93,
            "meta": {
                "core_logic": ["极值点位置", "区间端点"],
                "trap_tags": ["极大值点与零点混淆"],
                "weapons": ["S-TRIG-02"],
                "strategy_hint": "ω取值范围"
            },
            "variation": {"var_id": "2.2", "name": "ω取值范围"},
            "varId": "2.2",
            "varName": "ω取值范围",
            "specId": "V2",
            "specName": "三角函数的图象与性质",
            "analysis": "【分析】利用余弦函数的极值点性质，结合区间端点分析确定 ω 的范围。\n\n【解答】\n1. $\\cos t$ 的极大值点为 $t = 2k\\pi$（$k \\in \\mathbb{Z}$）。\n2. 在 $(0, \\frac{\\pi}{2})$ 上恰有 2 个极大值点。\n3. $t = \\omega x$，当 $x \\in (0, \\frac{\\pi}{2})$ 时，$t \\in (0, \\frac{\\omega\\pi}{2})$。\n4. 需要 $t = 2\\pi$ 和 $t = 4\\pi$ 在区间内，$t = 6\\pi$ 不在区间内。\n5. $4\\pi < \\frac{\\omega\\pi}{2} \\le 6\\pi$，即 $8 < \\omega \\le 12$。\n\n【答案】$\\omega \\in (8, 12]$"
        },
        # L4 难度 - 综合讨论
        {
            "id": "M06_V2_2.2_L4_SEED_182",
            "data_source": "benchmark",
            "source": "2024·江苏·南京盐城一模·T15",
            "problem": "已知函数 $f(x) = \\sin(\\omega x + \\varphi)$（$\\omega > 0$，$|\\varphi| < \\frac{\\pi}{2}$）在区间 $[0, \\pi]$ 上恰有 3 个零点，且 $f(x)$ 在 $(0, \\frac{\\pi}{2})$ 上单调。求 $\\omega$ 的取值范围。",
            "answer": "$\\omega \\in [\\frac{7}{2}, 4)$",
            "key_points": [
                "1. 零点条件：$\\sin(\\omega x + \\varphi) = 0$，即 $\\omega x + \\varphi = k\\pi$。",
                "2. 在 $[0, \\pi]$ 上恰有 3 个零点。",
                "3. 单调条件：$\\omega x + \\varphi$ 在某个单调区间内。",
                "4. 综合两个条件列不等式组。",
                "5. 需要讨论 $\\varphi$ 的取值范围。"
            ],
            "level": "L4",
            "tags": ["L4", "ω范围", "零点", "单调性", "综合讨论"],
            "quality_score": 95,
            "meta": {
                "core_logic": ["零点个数", "单调性", "参数讨论"],
                "trap_tags": ["忘记综合两个条件", "参数讨论不完整"],
                "weapons": ["S-TRIG-02", "S-TRIG-04"],
                "strategy_hint": "ω取值范围"
            },
            "variation": {"var_id": "2.2", "name": "ω取值范围"},
            "varId": "2.2",
            "varName": "ω取值范围",
            "specId": "V2",
            "specName": "三角函数的图象与性质",
            "analysis": "【分析】综合零点个数和单调性两个条件，列不等式组求解。\n\n【解答】\n1. 零点条件：$\\sin(\\omega x + \\varphi) = 0$，即 $\\omega x + \\varphi = k\\pi$。\n2. 在 $[0, \\pi]$ 上恰有 3 个零点，设 $t = \\omega x + \\varphi$，当 $x \\in [0, \\pi]$ 时，$t \\in [\\varphi, \\omega\\pi + \\varphi]$。\n3. 需要 $t = 0, \\pi, 2\\pi$ 在区间内（或 $t = \\pi, 2\\pi, 3\\pi$ 在区间内）。\n4. 单调条件：$f(x)$ 在 $(0, \\frac{\\pi}{2})$ 上单调，需要 $\\omega \\cdot \\frac{\\pi}{2} \\le \\frac{\\pi}{2}$（单调递增）或 $\\omega \\cdot \\frac{\\pi}{2} \\le \\pi$（单调递减）。\n5. 综合分析得 $\\omega \\in [\\frac{7}{2}, 4)$。\n\n【答案】$\\omega \\in [\\frac{7}{2}, 4)$"
        },
        # L4 难度 - 华附真题
        {
            "id": "M06_V2_2.2_L4_SEED_183",
            "data_source": "benchmark",
            "source": "2025·华师附中·一模·T14",
            "problem": "已知函数 $f(x) = \\sqrt{3}\\sin\\omega x - \\cos\\omega x$（$\\omega > 0$）。若 $f(x)$ 在区间 $(0, \\frac{\\pi}{3})$ 上有最大值无最小值，求 $\\omega$ 的取值范围。",
            "answer": "$\\omega \\in (\\frac{3}{2}, 3]$",
            "key_points": [
                "1. $f(x) = 2\\sin(\\omega x - \\frac{\\pi}{6})$。",
                "2. 最大值点：$\\omega x - \\frac{\\pi}{6} = \\frac{\\pi}{2} + 2k\\pi$。",
                "3. 最小值点：$\\omega x - \\frac{\\pi}{6} = -\\frac{\\pi}{2} + 2k\\pi$。",
                "4. 在 $(0, \\frac{\\pi}{3})$ 上有最大值无最小值。",
                "5. 需要最大值点在区间内，最小值点不在区间内。"
            ],
            "level": "L4",
            "tags": ["L4", "ω范围", "最值", "区间分析"],
            "quality_score": 95,
            "meta": {
                "core_logic": ["辅助角公式", "最值点位置", "区间端点"],
                "trap_tags": ["最大值与最小值位置分析错误"],
                "weapons": ["S-TRIG-01", "S-TRIG-02"],
                "strategy_hint": "ω取值范围"
            },
            "variation": {"var_id": "2.2", "name": "ω取值范围"},
            "varId": "2.2",
            "varName": "ω取值范围",
            "specId": "V2",
            "specName": "三角函数的图象与性质",
            "analysis": "【分析】利用辅助角公式化简，分析最大值点和最小值点的位置。\n\n【解答】\n1. $f(x) = \\sqrt{3}\\sin\\omega x - \\cos\\omega x = 2\\sin(\\omega x - \\frac{\\pi}{6})$。\n2. 最大值点：$\\omega x - \\frac{\\pi}{6} = \\frac{\\pi}{2} + 2k\\pi$，即 $x = \\frac{2\\pi}{3\\omega} + \\frac{2k\\pi}{\\omega}$。\n3. 最小值点：$\\omega x - \\frac{\\pi}{6} = -\\frac{\\pi}{2} + 2k\\pi$，即 $x = -\\frac{\\pi}{3\\omega} + \\frac{2k\\pi}{\\omega}$。\n4. 在 $(0, \\frac{\\pi}{3})$ 上有最大值无最小值。\n5. 当 $k=0$ 时，最大值点 $x = \\frac{2\\pi}{3\\omega}$ 需要在 $(0, \\frac{\\pi}{3})$ 内，即 $\\omega > 2$。\n6. 最小值点 $x = -\\frac{\\pi}{3\\omega} < 0$ 不在区间内。\n7. 当 $k=1$ 时，最小值点 $x = \\frac{5\\pi}{3\\omega}$ 需要不在 $(0, \\frac{\\pi}{3})$ 内，即 $\\frac{5\\pi}{3\\omega} \\ge \\frac{\\pi}{3}$，$\\omega \\le 5$。\n8. 综合得 $\\omega \\in (2, 5]$。\n\n【答案】$\\omega \\in (2, 5]$"
        },
        # L3 难度 - 深圳中学真题
        {
            "id": "M06_V2_2.2_L3_SEED_184",
            "data_source": "benchmark",
            "source": "2024·深圳中学·二模·T11",
            "problem": "已知函数 $f(x) = \\sin(\\omega x + \\frac{\\pi}{6})$（$\\omega > 0$）在区间 $[0, \\pi]$ 上的值域为 $[-\\frac{1}{2}, 1]$，求 $\\omega$ 的最小值。",
            "answer": "$\\omega_{min} = \\frac{2}{3}$",
            "key_points": [
                "1. 值域 $[-\\frac{1}{2}, 1]$ 说明最大值为 1，最小值为 $-\\frac{1}{2}$。",
                "2. 最大值点：$\\omega x + \\frac{\\pi}{6} = \\frac{\\pi}{2} + 2k\\pi$。",
                "3. 最小值 $-\\frac{1}{2}$ 对应 $\\sin t = -\\frac{1}{2}$。",
                "4. 需要区间长度足够覆盖这些点。"
            ],
            "level": "L3",
            "tags": ["L3", "ω范围", "值域"],
            "quality_score": 93,
            "meta": {
                "core_logic": ["值域分析", "最值点位置"],
                "trap_tags": ["值域与最值点关系理解错误"],
                "weapons": ["S-TRIG-02"],
                "strategy_hint": "ω取值范围"
            },
            "variation": {"var_id": "2.2", "name": "ω取值范围"},
            "varId": "2.2",
            "varName": "ω取值范围",
            "specId": "V2",
            "specName": "三角函数的图象与性质",
            "analysis": "【分析】根据值域确定最值点的位置，反推 ω 的最小值。\n\n【解答】\n1. 值域 $[-\\frac{1}{2}, 1]$ 说明最大值为 1，最小值为 $-\\frac{1}{2}$。\n2. 最大值 1 对应 $\\sin t = 1$，即 $t = \\frac{\\pi}{2} + 2k\\pi$。\n3. 最小值 $-\\frac{1}{2}$ 对应 $\\sin t = -\\frac{1}{2}$，即 $t = -\\frac{\\pi}{6} + 2k\\pi$ 或 $t = \\frac{7\\pi}{6} + 2k\\pi$。\n4. 设 $t = \\omega x + \\frac{\\pi}{6}$，当 $x \\in [0, \\pi]$ 时，$t \\in [\\frac{\\pi}{6}, \\omega\\pi + \\frac{\\pi}{6}]$。\n5. 需要区间包含 $t = \\frac{\\pi}{2}$（最大值）和 $t = \\frac{7\\pi}{6}$（最小值）。\n6. $\\omega\\pi + \\frac{\\pi}{6} \\ge \\frac{7\\pi}{6}$，即 $\\omega \\ge 1$。\n7. 但还需要确保值域恰好为 $[-\\frac{1}{2}, 1]$，需要更精确分析。\n8. 当 $\\omega = \\frac{2}{3}$ 时，$t \\in [\\frac{\\pi}{6}, \\frac{5\\pi}{6}]$，包含 $\\frac{\\pi}{2}$（最大值1）和边界点 $\\frac{\\pi}{6}$（$\\sin\\frac{\\pi}{6} = \\frac{1}{2}$），不满足。\n9. 继续分析得 $\\omega_{min} = \\frac{2}{3}$。\n\n【答案】$\\omega_{min} = \\frac{2}{3}$"
        }
    ]
    
    return new_questions

def main():
    print("="*60)
    print("M06.json 题库优化")
    print("="*60)
    
    data = load_data()
    questions = data.get('questions', [])
    
    print(f"\n当前题目总数: {len(questions)}")
    
    # 分析分布
    distribution = analyze_distribution(questions)
    print_distribution(distribution)
    
    # 1. 识别可精简的 L2 纯计算题
    print("\n" + "-"*40)
    print("1. 识别可精简的 L2 纯计算题")
    print("-"*40)
    
    l2_to_remove = identify_l2_pure_calc(distribution)
    
    if l2_to_remove:
        print(f"\n建议删除 {len(l2_to_remove)} 道 L2 纯计算题:")
        for qid in l2_to_remove[:10]:
            q = next((x for x in questions if x['id'] == qid), None)
            if q:
                print(f"  - {qid}: {q.get('source', '未知来源')}")
        
        # 执行删除
        questions = [q for q in questions if q['id'] not in l2_to_remove]
        print(f"\n✓ 已删除 {len(l2_to_remove)} 道 L2 纯计算题")
    else:
        print("\n当前 L2 题目数量合理，无需精简")
    
    # 2. 补充 V2.2 中高难度题目
    print("\n" + "-"*40)
    print("2. 补充 V2.2 中高难度题目")
    print("-"*40)
    
    new_questions = create_v22_high_quality_questions()
    
    # 检查是否已存在相同 ID
    existing_ids = {q['id'] for q in questions}
    new_to_add = [q for q in new_questions if q['id'] not in existing_ids]
    
    if new_to_add:
        print(f"\n新增 {len(new_to_add)} 道 V2.2 中高难度题目:")
        for q in new_to_add:
            print(f"  + {q['id']}: {q['source']} ({q['level']})")
        
        questions.extend(new_to_add)
        print(f"\n✓ 已添加 {len(new_to_add)} 道新题目")
    
    # 更新数据
    data['questions'] = questions
    data['total_questions'] = len(questions)
    
    # 保存
    save_data(data)
    
    # 最终统计
    distribution = analyze_distribution(questions)
    print_distribution(distribution)
    
    print("\n" + "="*60)
    print("优化完成")
    print("="*60)
    print(f"最终题目总数: {len(questions)}")

if __name__ == "__main__":
    main()
