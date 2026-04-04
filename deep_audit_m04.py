import json
from collections import Counter

with open('src/data/M04.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

valid_weapons = ['S-LOG-02', 'S-FUNC-02', 'S-FUNC-04', 'S-FUNC-05', 'S-FUNC-06']
weapon_names = {
    'S-LOG-02': '指对同构',
    'S-FUNC-02': '切线放缩',
    'S-FUNC-04': '零点个数',
    'S-FUNC-05': '复合单调性',
    'S-FUNC-06': '奇偶性+单调性'
}

print('=' * 70)
print('M04 深度质量审计')
print('=' * 70)

weapon_by_var = {}
strategy_issues = []
multi_weapon_count = 0
single_weapon_count = 0

for spec in data['specialties']:
    spec_id = spec['spec_id']
    
    for var in spec['variations']:
        var_id = var['var_id']
        pool = var.get('original_pool', [])
        
        if var_id not in weapon_by_var:
            weapon_by_var[var_id] = Counter()
        
        for q in pool:
            qid = q.get('id', '未知')
            weapons = q.get('meta', {}).get('weapons', [])
            strategy = q.get('meta', {}).get('strategy_hint', '')
            
            for w in weapons:
                weapon_by_var[var_id][w] += 1
            
            if len(weapons) > 1:
                multi_weapon_count += 1
            elif len(weapons) == 1:
                single_weapon_count += 1
            
            if not strategy or strategy.strip() == '':
                strategy_issues.append(qid)
            elif '模型' not in strategy and '杀手锏' not in strategy:
                strategy_issues.append(f"{qid}: {strategy[:30]}...")

print('\n【各变式武器分布】')
for var_id in ['1.1', '1.2', '2.1', '2.2']:
    if var_id in weapon_by_var:
        print(f'\n  变式 {var_id}:')
        for w in valid_weapons:
            count = weapon_by_var[var_id].get(w, 0)
            if count > 0:
                print(f'    {w} ({weapon_names[w]}): {count} 题')

print(f'\n【武器使用策略】')
print(f'  单武器题目: {single_weapon_count} 题')
print(f'  多武器题目: {multi_weapon_count} 题')

print(f'\n【strategy_hint 检查】')
if strategy_issues:
    print(f'  问题题目: {len(strategy_issues)} 题')
    for s in strategy_issues[:10]:
        print(f'    └─ {s}')
else:
    print('  ✅ 所有题目都有有效的 strategy_hint')

print('\n【武器使用合理性分析】')
for var_id in ['1.1', '1.2', '2.1', '2.2']:
    if var_id in weapon_by_var:
        weapons_used = [w for w in valid_weapons if weapon_by_var[var_id].get(w, 0) > 0]
        print(f'  变式 {var_id}: 使用 {len(weapons_used)} 种武器')
        if len(weapons_used) <= 3:
            print(f'    ✅ 符合"宁缺毋滥"原则')
        else:
            print(f'    ⚠️ 武器种类较多，建议精简')
