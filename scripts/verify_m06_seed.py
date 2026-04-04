#!/usr/bin/env python3
"""
验证 M06_seed.json 补全结果
"""

import json
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, 'src', 'data')

with open(os.path.join(data_dir, 'M06_seed.json'), 'r', encoding='utf-8') as f:
    m06_seed = json.load(f)

questions = m06_seed.get('questions', [])

print("=" * 70)
print("M06_seed.json 补全结果验证")
print("=" * 70)

# 统计字段完整性
field_stats = {
    'answer': 0,
    'key_points': 0,
    'analysis': 0,
    'specId': 0,
    'specName': 0,
    'varId': 0,
    'varName': 0,
    'weapons': 0,
    'strategy_hint': 0,
}

for q in questions:
    if q.get('answer'):
        field_stats['answer'] += 1
    if q.get('key_points'):
        field_stats['key_points'] += 1
    if q.get('analysis'):
        field_stats['analysis'] += 1
    if q.get('specId'):
        field_stats['specId'] += 1
    if q.get('specName'):
        field_stats['specName'] += 1
    if q.get('varId'):
        field_stats['varId'] += 1
    if q.get('varName'):
        field_stats['varName'] += 1
    if q.get('meta', {}).get('weapons'):
        field_stats['weapons'] += 1
    if q.get('meta', {}).get('strategy_hint'):
        field_stats['strategy_hint'] += 1

print(f"\n总题数: {len(questions)}")
print(f"\n字段完整性:")
for field, count in field_stats.items():
    pct = count / len(questions) * 100
    status = "✓" if count == len(questions) else "⚠️"
    print(f"  {status} {field}: {count}/{len(questions)} ({pct:.1f}%)")

# 检查未匹配杀手锏的题目
print("\n" + "=" * 70)
print("未匹配杀手锏的题目分析")
print("=" * 70)

no_weapon = [q for q in questions if not q.get('meta', {}).get('weapons')]
print(f"\n共 {len(no_weapon)} 题未匹配杀手锏:")

for q in no_weapon:
    print(f"\n{q.get('id')} [{q.get('level')}]")
    print(f"  题目: {q.get('problem', '')[:80]}...")
    print(f"  变式: {q.get('varName', '')}")
    
    # 分析可能需要的武器
    problem = q.get('problem', '')
    if 'ω' in problem:
        print(f"  建议: S-TRIG-04 (ω范围讨论)")
    elif '平移' in problem or '变换' in problem:
        print(f"  建议: S-TRIG-02 (图象变换铁律)")
    elif 'sin' in problem and 'cos' in problem:
        print(f"  建议: S-TRIG-01 (配角公式)")
    else:
        print(f"  建议: 需要新杀手锏")

# 杀手锏使用统计
print("\n" + "=" * 70)
print("杀手锏使用统计")
print("=" * 70)

weapon_stats = {}
for q in questions:
    for w in q.get('meta', {}).get('weapons', []):
        weapon_stats[w] = weapon_stats.get(w, 0) + 1

for w, count in sorted(weapon_stats.items(), key=lambda x: -x[1]):
    print(f"  {w}: {count} 题")
