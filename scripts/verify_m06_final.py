#!/usr/bin/env python3
import json
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, 'src', 'data')

with open(os.path.join(data_dir, 'M06_seed.json'), 'r', encoding='utf-8') as f:
    m06_seed = json.load(f)

questions = m06_seed.get('questions', [])

print("=" * 70)
print("M06_seed.json 最终补全结果")
print("=" * 70)

print(f"\n总题数: {len(questions)}")

# 字段完整性
print(f"\n字段完整性:")
fields = ['answer', 'key_points', 'analysis', 'specId', 'specName', 'varId', 'varName']
for field in fields:
    count = sum(1 for q in questions if q.get(field))
    pct = count / len(questions) * 100
    status = "✓" if count == len(questions) else "⚠️"
    print(f"  {status} {field}: {count}/{len(questions)} ({pct:.1f}%)")

# meta 字段
print(f"\nmeta 字段:")
meta_fields = ['weapons', 'strategy_hint']
for field in meta_fields:
    count = sum(1 for q in questions if q.get('meta', {}).get(field))
    pct = count / len(questions) * 100
    status = "✓" if count == len(questions) else "⚠️"
    print(f"  {status} meta.{field}: {count}/{len(questions)} ({pct:.1f}%)")

# 杀手锏统计
weapon_stats = {}
for q in questions:
    for w in q.get('meta', {}).get('weapons', []):
        weapon_stats[w] = weapon_stats.get(w, 0) + 1

print(f"\n杀手锏使用统计:")
for w, count in sorted(weapon_stats.items(), key=lambda x: -x[1]):
    print(f"  {w}: {count} 题")

# 难度分布
level_stats = {}
for q in questions:
    level = q.get('level', 'L2')
    level_stats[level] = level_stats.get(level, 0) + 1

print(f"\n难度分布:")
for level, count in sorted(level_stats.items()):
    print(f"  {level}: {count} 题")

print("\n" + "=" * 70)
print("补全完成！")
print("=" * 70)
