#!/usr/bin/env python3
"""
检查 M06_seed.json 中缺失答案的题目
"""

import json
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, 'src', 'data')

with open(os.path.join(data_dir, 'M06_seed.json'), 'r', encoding='utf-8') as f:
    m06_seed = json.load(f)

questions = m06_seed.get('questions', [])

# 找出缺失答案的题目
missing_answer = [q for q in questions if not q.get('answer')]

print(f"缺失答案的题目: {len(missing_answer)} 道\n")
print("=" * 70)

for i, q in enumerate(missing_answer[:10], 1):
    print(f"\n{i}. {q.get('id')} [{q.get('level')}]")
    print(f"   变式: V{q.get('varId')} - {q.get('varName')}")
    print(f"   题目: {q.get('problem', '')[:100]}...")
    print(f"   杀手锏: {q.get('meta', {}).get('weapons', [])}")
    print(f"   策略提示: {q.get('meta', {}).get('strategy_hint', '')}")

print(f"\n... 还有 {len(missing_answer) - 10} 道题目")
