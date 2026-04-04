import json

with open('M05.json', 'r', encoding='utf-8') as f:
    m05 = json.load(f)

weapon_counts = {}
for s in m05.get('specialties', []):
    for v in s.get('variations', []):
        for q in v.get('original_pool', []):
            w = q.get('meta', {}).get('weapons', [])
            for weapon in w:
                weapon_counts[weapon] = weapon_counts.get(weapon, 0) + 1

print("M05 实际使用的杀手锏:")
for w, c in sorted(weapon_counts.items(), key=lambda x: -x[1]):
    print(f"  {w}: {c} 次")

print()

user_weapons = ['S-LOG-05', 'S-FUNC-02', 'S-DERIV-04', 'S-FUNC-04', 'S-SEQ-10', 'S-LOG-02', 'S-SEQ-09', 'S-FUNC-06', 'S-DERIV-03']
print("用户列出的杀手锏在 M05 中的使用情况:")
for w in user_weapons:
    if w in weapon_counts:
        print(f"  {w}: {weapon_counts[w]} 次")
    else:
        print(f"  {w}: 未使用")
