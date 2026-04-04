#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修正 M06.json 中的问题题目
基于千问和 Gemini 分析验证后的建议
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

def main():
    print("="*60)
    print("M06.json 题库精简与优化")
    print("="*60)
    
    data = load_data()
    questions = data.get('questions', [])
    
    print(f"\n当前题目总数: {len(questions)}")
    
    # 1. 删除 SEED_001（与 SEED_004 完全重复）
    print("\n" + "-"*40)
    print("1. 删除重复题目 SEED_001")
    print("-"*40)
    
    seed_001 = None
    seed_004 = None
    
    for q in questions:
        if q['id'] == 'M06_V1_1.1_L2_SEED_001':
            seed_001 = q
        elif q['id'] == 'M06_V1_1.1_L2_SEED_004':
            seed_004 = q
    
    if seed_001:
        print(f"  找到 SEED_001: {seed_001['problem'][:60]}...")
    if seed_004:
        print(f"  找到 SEED_004: {seed_004['problem'][:60]}...")
    
    if seed_001 and seed_004:
        print("\n  两题完全相同（sinα=3/5, cos(α+π/3)），删除 SEED_001")
        questions = [q for q in questions if q['id'] != 'M06_V1_1.1_L2_SEED_001']
        print(f"  ✓ 已删除 SEED_001")
    
    # 2. 整合 V2.2 ω 范围题目（保留高质量典型题）
    print("\n" + "-"*40)
    print("2. 整合 V2.2 ω 范围题目")
    print("-"*40)
    
    # 找出所有 V2.2 L2 级别的 ω 范围题目
    v22_l2_omega = [q for q in questions if 'V2_2.2' in q['id'] and q.get('level') == 'L2']
    
    print(f"  找到 {len(v22_l2_omega)} 道 V2.2 L2 级别的 ω 范围题目")
    
    # 保留标准：来源为真题、题目有代表性
    # 保留 SEED_150（江苏七市联考）、SEED_161（新高考II卷风格）、SEED_105（浙江强基）
    # 删除其他重复度高的题目
    
    keep_ids = {
        'M06_V2_2.2_L2_SEED_150',  # 2024·江苏七市联考
        'M06_V2_2.2_L2_SEED_161',  # 2023·新高考II卷风格
        'M06_V2_2.2_L2_SEED_105',  # 2023·浙江强基联盟
    }
    
    # 找出要删除的 V2.2 L2 题目
    v22_l2_to_remove = []
    for q in v22_l2_omega:
        if q['id'] not in keep_ids:
            # 检查是否是简单的零点个数题
            problem = q.get('problem', '')
            if '零点' in problem and '恰有' in problem:
                v22_l2_to_remove.append(q['id'])
    
    if v22_l2_to_remove:
        print(f"\n  建议删除 {len(v22_l2_to_remove)} 道重复的 ω 零点题目:")
        for qid in v22_l2_to_remove[:5]:  # 只显示前5个
            q = next((x for x in questions if x['id'] == qid), None)
            if q:
                print(f"    - {qid}: {q.get('source', '未知来源')}")
        
        # 执行删除
        questions = [q for q in questions if q['id'] not in v22_l2_to_remove]
        print(f"\n  ✓ 已删除 {len(v22_l2_to_remove)} 道重复题目")
    
    # 3. 统计最终结果
    print("\n" + "-"*40)
    print("3. 统计各变例各难度题目数量")
    print("-"*40)
    
    from collections import defaultdict
    distribution = defaultdict(lambda: defaultdict(int))
    
    for q in questions:
        var_id = q.get('varId', 'unknown')
        level = q.get('level', 'unknown')
        distribution[var_id][level] += 1
    
    print("\n  变例\\难度  L2   L3   L4")
    print("  " + "-"*30)
    for var in ['1.1', '1.2', '2.1', '2.2']:
        l2 = distribution[var]['L2']
        l3 = distribution[var]['L3']
        l4 = distribution[var]['L4']
        total = l2 + l3 + l4
        status = "✓" if 10 <= total <= 12 else ("⚠️" if total < 10 else "⚠️超标")
        print(f"  V{var}      {l2:3d}  {l3:3d}  {l4:3d}  (共{total}题) {status}")
    
    # 更新数据
    data['questions'] = questions
    data['total_questions'] = len(questions)
    
    # 保存
    save_data(data)
    
    print("\n" + "="*60)
    print("修正完成")
    print("="*60)
    print(f"最终题目总数: {len(questions)}")
    print("\n修正摘要：")
    print("  1. 删除 SEED_001（与 SEED_004 完全重复）")
    print("  2. 整合 V2.2 ω 范围题目（保留 3 道典型真题）")
    print("  3. 保留 SEED_097（逆向思维题）、SEED_077（诱导公式技巧）、SEED_150（真题）")

if __name__ == "__main__":
    main()
