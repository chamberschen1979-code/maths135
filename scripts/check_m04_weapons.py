import json

with open('M04.json', 'r', encoding='utf-8') as f:
    m04 = json.load(f)

weapon_counts = {}
for s in m04.get('specialties', []):
    for v in s.get('variations', []):
        for q in v.get('original_pool', []):
            w = q.get('meta', {}).get('weapons', [])
            for weapon in w:
                weapon_counts[weapon] = weapon_counts.get(weapon, 0) + 1

print('M04 杀手锏使用统计:')
for w, c in sorted(weapon_counts.items(), key=lambda x: -x[1]):
    print(f'  {w}: {c} 次')

print()
print('检查 L2 题目的杀手锏匹配:')
advanced_weapons = ['S-DERIV-09', 'S-DERIV-10', 'S-DERIV-11', 'S-LOG-05', 'S-CONIC-05', 'S-CONIC-06']
l2_issues = []
for s in m04.get('specialties', []):
    for v in s.get('variations', []):
        for q in v.get('original_pool', []):
            level = q.get('level', '')
            weapons = q.get('meta', {}).get('weapons', [])
            if level == 'L2':
                for adv in advanced_weapons:
                    if adv in weapons:
                        l2_issues.append((q.get('id'), adv))

if l2_issues:
    print(f'警告: {len(l2_issues)} 个 L2 题目匹配了高级杀手锏')
    for qid, adv in l2_issues:
        print(f'  {qid}: {adv}')
else:
    print('OK: L2 题目没有匹配高级杀手锏')
