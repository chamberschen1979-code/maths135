#!/usr/bin/env python3
"""
统计 M06_seed.json 的题目分布和字段完整性
"""

import json
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, 'src', 'data')

with open(os.path.join(data_dir, 'M06_seed.json'), 'r', encoding='utf-8') as f:
    m06_seed = json.load(f)

questions = m06_seed.get('questions', [])

print("=" * 80)
print("M06_seed.json 题目统计报告")
print("=" * 80)

print(f"\n总题目数: {len(questions)}")

# 必要字段列表
required_fields = ['id', 'problem', 'answer', 'level', 'source', 'varId', 'varName', 'specId', 'specName', 'analysis', 'key_points', 'meta']
optional_fields = ['tags', 'quality_score', 'data_source', 'variation']

print("\n" + "=" * 80)
print("一、按专项统计")
print("=" * 80)

spec_stats = {}
for q in questions:
    spec_id = q.get('specId', '未知')
    spec_name = q.get('specName', '未知')
    key = f"{spec_id} {spec_name}"
    spec_stats[key] = spec_stats.get(key, 0) + 1

for spec, count in sorted(spec_stats.items()):
    print(f"  {spec}: {count} 题")

print("\n" + "=" * 80)
print("二、按变例统计")
print("=" * 80)

var_stats = {}
for q in questions:
    var_id = q.get('varId', '未知')
    var_name = q.get('varName', '未知')
    key = f"V{var_id} {var_name}"
    var_stats[key] = var_stats.get(key, 0) + 1

for var, count in sorted(var_stats.items()):
    print(f"  {var}: {count} 题")

print("\n" + "=" * 80)
print("三、按难度统计")
print("=" * 80)

level_stats = {}
for q in questions:
    level = q.get('level', '未知')
    level_stats[level] = level_stats.get(level, 0) + 1

for level, count in sorted(level_stats.items()):
    print(f"  {level}: {count} 题")

print("\n" + "=" * 80)
print("四、按专项×变例×难度交叉统计")
print("=" * 80)

cross_stats = {}
for q in questions:
    spec_id = q.get('specId', '?')
    var_id = q.get('varId', '?')
    level = q.get('level', '?')
    key = (spec_id, var_id, level)
    cross_stats[key] = cross_stats.get(key, 0) + 1

# 按专项分组显示
current_spec = None
for (spec_id, var_id, level), count in sorted(cross_stats.items()):
    if spec_id != current_spec:
        current_spec = spec_id
        print(f"\n【专项 {spec_id}】")
    print(f"  V{var_id} / {level}: {count} 题")

print("\n" + "=" * 80)
print("五、字段完整性检查")
print("=" * 80)

# 检查每道题的字段
field_issues = {
    'missing_required': [],
    'empty_fields': [],
    'missing_optional': []
}

for q in questions:
    qid = q.get('id', '未知ID')
    
    # 检查必要字段
    for field in required_fields:
        if field not in q:
            field_issues['missing_required'].append((qid, field))
        elif q[field] is None or q[field] == '' or q[field] == []:
            field_issues['empty_fields'].append((qid, field))
    
    # 检查可选字段
    for field in optional_fields:
        if field not in q:
            field_issues['missing_optional'].append((qid, field))

print(f"\n必要字段缺失统计:")
if field_issues['missing_required']:
    # 按字段分组
    by_field = {}
    for qid, field in field_issues['missing_required']:
        by_field[field] = by_field.get(field, 0) + 1
    for field, count in sorted(by_field.items(), key=lambda x: -x[1]):
        print(f"  ⚠️ {field}: {count} 题缺失")
else:
    print(f"  ✓ 所有题目必要字段完整")

print(f"\n字段为空统计:")
if field_issues['empty_fields']:
    by_field = {}
    for qid, field in field_issues['empty_fields']:
        by_field[field] = by_field.get(field, 0) + 1
    for field, count in sorted(by_field.items(), key=lambda x: -x[1]):
        print(f"  ⚠️ {field}: {count} 题为空")
else:
    print(f"  ✓ 所有题目字段非空")

print(f"\n可选字段缺失统计:")
if field_issues['missing_optional']:
    by_field = {}
    for qid, field in field_issues['missing_optional']:
        by_field[field] = by_field.get(field, 0) + 1
    for field, count in sorted(by_field.items(), key=lambda x: -x[1]):
        print(f"  ℹ️ {field}: {count} 题缺失")
else:
    print(f"  ✓ 所有题目可选字段完整")

print("\n" + "=" * 80)
print("六、详细字段完整性（按题目）")
print("=" * 80)

# 统计每道题的完整度
completeness = []
for q in questions:
    qid = q.get('id', '未知ID')
    total = len(required_fields) + len(optional_fields)
    present = 0
    missing = []
    for field in required_fields + optional_fields:
        if field in q and q[field] is not None and q[field] != '' and q[field] != []:
            present += 1
        else:
            missing.append(field)
    pct = present / total * 100
    completeness.append((qid, pct, missing))

# 按完整度排序
completeness.sort(key=lambda x: x[1])

# 显示不完整的题目
incomplete = [c for c in completeness if c[1] < 100]
if incomplete:
    print(f"\n不完整题目 ({len(incomplete)} 题):")
    for qid, pct, missing in incomplete[:20]:  # 只显示前20个
        print(f"  {qid}: {pct:.1f}% - 缺失 {', '.join(missing)}")
    if len(incomplete) > 20:
        print(f"  ... 还有 {len(incomplete) - 20} 题不完整")
else:
    print(f"\n✓ 所有题目字段100%完整")

# 完整度分布
print(f"\n完整度分布:")
ranges = [(100, 100), (90, 99), (80, 89), (70, 79), (0, 69)]
for lo, hi in ranges:
    if lo == hi:
        count = len([c for c in completeness if c[1] == lo])
        if count > 0:
            print(f"  {lo}%: {count} 题")
    else:
        count = len([c for c in completeness if lo <= c[1] <= hi])
        if count > 0:
            print(f"  {lo}-{hi}%: {count} 题")

print("\n" + "=" * 80)
print("七、汇总表格")
print("=" * 80)

print(f"\n{'专项':<20} {'变例':<25} {'L2':>5} {'L3':>5} {'L4':>5} {'合计':>6}")
print("-" * 80)

# 构建表格
table = {}
for q in questions:
    spec_id = q.get('specId', '?')
    var_id = q.get('varId', '?')
    level = q.get('level', '?')
    key = (spec_id, var_id)
    if key not in table:
        table[key] = {'L2': 0, 'L3': 0, 'L4': 0}
    if level in table[key]:
        table[key][level] += 1

# 按专项、变例排序显示
current_spec = None
for (spec_id, var_id), counts in sorted(table.items()):
    if spec_id != current_spec:
        if current_spec is not None:
            print("-" * 80)
        current_spec = spec_id
    
    # 获取变例名称
    var_name = ''
    for q in questions:
        if q.get('specId') == spec_id and q.get('varId') == var_id:
            var_name = q.get('varName', '')
            break
    
    total = counts['L2'] + counts['L3'] + counts['L4']
    print(f"V{spec_id} {'V'+var_id+' '+var_name:<20} {counts['L2']:>5} {counts['L3']:>5} {counts['L4']:>5} {total:>6}")

# 总计
print("-" * 80)
total_l2 = sum(c['L2'] for c in table.values())
total_l3 = sum(c['L3'] for c in table.values())
total_l4 = sum(c['L4'] for c in table.values())
print(f"{'总计':<46} {total_l2:>5} {total_l3:>5} {total_l4:>5} {len(questions):>6}")

print("\n" + "=" * 80)
print("报告完成")
print("=" * 80)
