import json

with open('M04.json', 'r', encoding='utf-8') as f:
    m04 = json.load(f)

print("=== 核实报告中的问题 ===\n")

# 问题1: V1.1 基础运算部分的 L2 题目
print("1. V1.1 基础运算部分的 L2 题目杀手锏匹配:")
for s in m04.get('specialties', []):
    for v in s.get('variations', []):
        if v.get('var_id') == '1.1':
            count = 0
            for q in v.get('original_pool', []):
                if q.get('level') == 'L2':
                    w = q.get('meta', {}).get('weapons', [])
                    if count < 5:
                        print(f"  {q.get('id')}: weapons={w}")
                    count += 1
            print(f"  V1.1 L2 题目总数: {count}")
            break

print()

# 问题2: 检查 M04_1.2_L2_NEW_8687 是否存在
print("2. 检查 M04_1.2_L2_NEW_8687:")
found = False
for s in m04.get('specialties', []):
    for v in s.get('variations', []):
        for q in v.get('original_pool', []):
            if 'NEW_8687' in q.get('id', ''):
                print(f"  找到: {q.get('id')}")
                print(f"  weapons: {q.get('meta', {}).get('weapons', [])}")
                print(f"  题目: {q.get('problem', '')[:60]}...")
                found = True

if not found:
    print("  不存在此 ID 的题目")

print()

# 问题3: 检查最后一道题
print("3. 检查最后一道题 M04_2.1_L3_OLD_2758:")
for s in m04.get('specialties', []):
    for v in s.get('variations', []):
        for q in v.get('original_pool', []):
            if 'OLD_2758' in q.get('id', ''):
                print(f"  找到: {q.get('id')}")
                print(f"  weapons: {q.get('meta', {}).get('weapons', [])}")
                print(f"  题目: {q.get('problem', '')[:80]}...")

print()

# 检查所有题目 ID 格式
print("4. 检查题目 ID 格式:")
id_patterns = set()
for s in m04.get('specialties', []):
    for v in s.get('variations', []):
        for q in v.get('original_pool', []):
            qid = q.get('id', '')
            if 'NEW' in qid or 'OLD' in qid:
                id_patterns.add(qid)

print(f"  包含 NEW/OLD 的 ID 数量: {len(id_patterns)}")
if id_patterns:
    print(f"  示例: {list(id_patterns)[:3]}")

# 检查是否有 strategy_hint 字段
print()
print("5. 检查 strategy_hint 字段:")
has_strategy_hint = 0
for s in m04.get('specialties', []):
    for v in s.get('variations', []):
        for q in v.get('original_pool', []):
            if 'strategy_hint' in q:
                has_strategy_hint += 1

print(f"  有 strategy_hint 字段的题目数: {has_strategy_hint}")

# 检查 S-DERIV-04 的使用情况
print()
print("6. 检查 S-DERIV-04 的使用:")
deriv04_count = 0
for s in m04.get('specialties', []):
    for v in s.get('variations', []):
        for q in v.get('original_pool', []):
            w = q.get('meta', {}).get('weapons', [])
            if 'S-DERIV-04' in w:
                deriv04_count += 1
                print(f"  {q.get('id')}: {q.get('problem', '')[:50]}...")

print(f"  S-DERIV-04 使用次数: {deriv04_count}")
