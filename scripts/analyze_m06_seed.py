#!/usr/bin/env python3
"""
分析 M06_seed.json 的缺失字段和武器匹配需求
"""

import json
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, 'src', 'data')

# 读取文件
with open(os.path.join(data_dir, 'M06_seed.json'), 'r', encoding='utf-8') as f:
    m06_seed = json.load(f)

with open(os.path.join(data_dir, 'weapon_details.json'), 'r', encoding='utf-8') as f:
    weapons = json.load(f)

questions = m06_seed.get('questions', [])

print("=" * 70)
print("M06_seed.json 字段缺失分析")
print("=" * 70)

# 统计缺失字段
missing_stats = {}
for q in questions:
    for key in ['answer', 'key_points', 'analysis', 'specId', 'specName', 'varId', 'varName']:
        if not q.get(key):
            missing_stats[key] = missing_stats.get(key, 0) + 1
    # meta 字段
    meta = q.get('meta', {})
    for key in ['weapons', 'trap_tags', 'strategy_hint']:
        if not meta.get(key):
            missing_stats[f'meta.{key}'] = missing_stats.get(f'meta.{key}', 0) + 1

print(f"\n总题数: {len(questions)}")
print(f"\n字段缺失统计:")
for field, count in sorted(missing_stats.items(), key=lambda x: -x[1]):
    pct = count / len(questions) * 100
    status = "⚠️" if count > 0 else "✓"
    print(f"  {status} {field}: {count} ({pct:.1f}%)")

# 检查武器
print("\n" + "=" * 70)
print("三角函数相关武器检查")
print("=" * 70)

trig_weapons = {k: v for k, v in weapons.items() if 'TRIG' in k or 'TRI' in k}
print(f"\n现有三角函数武器:")
for wid, wdata in trig_weapons.items():
    print(f"  {wid}: {wdata.get('coreLogic', '')[:50]}...")

# 分析题目需要的武器
print(f"\n题目武器需求分析:")
weapon_needs = {
    '配角技巧': 0,
    '图象变换': 0,
    '辅助角公式': 0,
    'ω范围讨论': 0,
}

for q in questions:
    problem = q.get('problem', '')
    if 'α+' in problem or 'α-' in problem or '配角' in problem:
        weapon_needs['配角技巧'] += 1
    if '平移' in problem or '变换' in problem or '图象' in problem:
        weapon_needs['图象变换'] += 1
    if 'sin' in problem and 'cos' in problem:
        weapon_needs['辅助角公式'] += 1
    if 'ω' in problem or '周期' in problem:
        weapon_needs['ω范围讨论'] += 1

for wtype, count in weapon_needs.items():
    print(f"  {wtype}: {count} 题需要")

# 检查缺失答案的题目
print("\n" + "=" * 70)
print("缺失答案的题目示例")
print("=" * 70)

missing_answer = [q for q in questions if not q.get('answer')]
print(f"\n缺失答案: {len(missing_answer)} 题")
for q in missing_answer[:5]:
    print(f"  {q.get('id')}: {q.get('problem', '')[:50]}...")
