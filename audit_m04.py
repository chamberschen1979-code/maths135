import json

with open('src/data/M04.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

required_fields = ['id', 'data_source', 'source', 'problem', 'answer', 'key_points', 'level', 'tags', 'quality_score', 'meta', 'analysis']
meta_fields = ['core_logic', 'trap_tags', 'weapons', 'strategy_hint']
valid_weapons = ['S-LOG-02', 'S-FUNC-02', 'S-FUNC-04', 'S-FUNC-05', 'S-FUNC-06']

print('=' * 70)
print('M04 题库完整性审计报告')
print('=' * 70)

total_issues = 0
total_questions = 0
weapon_stats = {}
missing_weapon_count = 0
invalid_weapon_count = 0

for spec in data['specialties']:
    spec_id = spec['spec_id']
    
    for var in spec['variations']:
        var_id = var['var_id']
        pool = var.get('original_pool', [])
        
        for q in pool:
            total_questions += 1
            qid = q.get('id', '未知ID')
            issues = []
            
            for field in required_fields:
                if field not in q or not q[field]:
                    issues.append(f"缺失字段: {field}")
            
            if 'meta' in q:
                meta = q['meta']
                for mf in meta_fields:
                    if mf not in meta or not meta[mf]:
                        issues.append(f"meta缺失: {mf}")
                
                weapons = meta.get('weapons', [])
                if not weapons:
                    issues.append("weapons为空")
                    missing_weapon_count += 1
                else:
                    for w in weapons:
                        if w not in valid_weapons:
                            issues.append(f"无效武器: {w}")
                            invalid_weapon_count += 1
                        else:
                            weapon_stats[w] = weapon_stats.get(w, 0) + 1
            
            if issues:
                total_issues += 1
                print(f"\n❌ {qid}")
                for issue in issues:
                    print(f"   └─ {issue}")

print('\n' + '=' * 70)
print('审计结果汇总')
print('=' * 70)
print(f'总题目数: {total_questions}')
print(f'问题题目数: {total_issues}')
print(f'完整题目数: {total_questions - total_issues}')

print(f'\n【武器使用统计】')
for w in valid_weapons:
    count = weapon_stats.get(w, 0)
    print(f'  {w}: {count} 题')

print(f'\n【武器问题】')
print(f'  缺失武器: {missing_weapon_count} 题')
print(f'  无效武器: {invalid_weapon_count} 题')

if total_issues == 0:
    print('\n✅ 所有题目字段完整，武器匹配正确！')
else:
    print(f'\n⚠️ 发现 {total_issues} 道题目存在问题，需要修复')
