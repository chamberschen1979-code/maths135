import json

with open('M06_seed.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

questions = data.get('questions', [])

print("=" * 70)
print("M06_seed.json 题目评估报告")
print("=" * 70)

# 1. 按专项统计
print("\n【一、专项分布】")
spec_stats = {}
for q in questions:
    var_id = q.get('variation', {}).get('var_id', '')
    spec_id = 'V' + var_id.split('.')[0] if '.' in var_id else var_id
    if spec_id not in spec_stats:
        spec_stats[spec_id] = {'total': 0, 'levels': {}}
    spec_stats[spec_id]['total'] += 1
    level = q.get('level', 'L2')
    spec_stats[spec_id]['levels'][level] = spec_stats[spec_id]['levels'].get(level, 0) + 1

for spec_id, stats in sorted(spec_stats.items()):
    print(f"\n{spec_id}: {stats['total']} 题")
    for level, count in sorted(stats['levels'].items()):
        print(f"  {level}: {count} 题")

# 2. 按变式统计
print("\n" + "=" * 70)
print("【二、变式分布】")
var_stats = {}
for q in questions:
    var_id = q.get('variation', {}).get('var_id', '')
    var_name = q.get('variation', {}).get('name', '')
    key = f"V{var_id} - {var_name}"
    if key not in var_stats:
        var_stats[key] = {'total': 0, 'levels': {}}
    var_stats[key]['total'] += 1
    level = q.get('level', 'L2')
    var_stats[key]['levels'][level] = var_stats[key]['levels'].get(level, 0) + 1

for var_name, stats in sorted(var_stats.items()):
    print(f"\n{var_name}: {stats['total']} 题")
    for level, count in sorted(stats['levels'].items()):
        print(f"  {level}: {count} 题")

# 3. 难度分布
print("\n" + "=" * 70)
print("【三、难度分布】")
level_stats = {}
for q in questions:
    level = q.get('level', 'L2')
    level_stats[level] = level_stats.get(level, 0) + 1

for level, count in sorted(level_stats.items()):
    pct = count / len(questions) * 100
    bar = '#' * int(pct / 5)
    print(f"  {level}: {count:2d} 题 ({pct:5.1f}%) {bar}")

# 4. 质量评估
print("\n" + "=" * 70)
print("【四、质量评估】")

with_answer = sum(1 for q in questions if q.get('answer'))
with_key_points = sum(1 for q in questions if q.get('key_points'))
with_traps = sum(1 for q in questions if q.get('meta', {}).get('trap_tags'))
with_source = sum(1 for q in questions if q.get('source'))

print(f"\n字段完整性:")
print(f"  有答案: {with_answer}/{len(questions)} ({with_answer/len(questions)*100:.1f}%)")
print(f"  有关键步骤: {with_key_points}/{len(questions)} ({with_key_points/len(questions)*100:.1f}%)")
print(f"  有陷阱标签: {with_traps}/{len(questions)} ({with_traps/len(questions)*100:.1f}%)")
print(f"  有来源: {with_source}/{len(questions)} ({with_source/len(questions)*100:.1f}%)")

# 5. 问题检测
print("\n" + "=" * 70)
print("【五、问题检测】")

issues = []

missing_answer = [q['id'] for q in questions if not q.get('answer')]
if missing_answer:
    issues.append(f"缺少答案: {len(missing_answer)} 题")
    print(f"\n缺少答案的题目 ({len(missing_answer)} 题):")
    for qid in missing_answer[:5]:
        print(f"  - {qid}")
    if len(missing_answer) > 5:
        print(f"  ... 还有 {len(missing_answer)-5} 题")

missing_kp = [q['id'] for q in questions if not q.get('key_points')]
if missing_kp:
    issues.append(f"缺少关键步骤: {len(missing_kp)} 题")
    print(f"\n缺少关键步骤的题目 ({len(missing_kp)} 题):")
    for qid in missing_kp[:5]:
        print(f"  - {qid}")
    if len(missing_kp) > 5:
        print(f"  ... 还有 {len(missing_kp)-5} 题")

l2_ratio = level_stats.get('L2', 0) / len(questions)
l3_ratio = level_stats.get('L3', 0) / len(questions)
l4_ratio = level_stats.get('L4', 0) / len(questions)

print(f"\n难度分布分析:")
if l2_ratio < 0.15:
    print(f"  L2 占比过低 ({l2_ratio*100:.1f}%)，建议增加基础题")
else:
    print(f"  L2 占比合理 ({l2_ratio*100:.1f}%)")

if l3_ratio < 0.3:
    print(f"  L3 占比过低 ({l3_ratio*100:.1f}%)，建议增加中等题")
else:
    print(f"  L3 占比合理 ({l3_ratio*100:.1f}%)")

if l4_ratio > 0.4:
    print(f"  L4 占比过高 ({l4_ratio*100:.1f}%)，可能难度偏大")
else:
    print(f"  L4 占比合理 ({l4_ratio*100:.1f}%)")

# 6. 总结
print("\n" + "=" * 70)
print("【六、总结】")
print(f"\n总题数: {len(questions)} 道")
print(f"专项数: {len(spec_stats)} 个")
print(f"变式数: {len(var_stats)} 个")

if issues:
    print(f"\n需要改进的问题:")
    for issue in issues:
        print(f"  - {issue}")
else:
    print(f"\n整体质量良好，无明显问题")
