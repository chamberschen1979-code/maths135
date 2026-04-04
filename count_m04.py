import json
from collections import Counter

with open('src/data/M04.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print('=' * 60)
print('M04 题库统计报告')
print('=' * 60)

total = 0
for spec in data['specialties']:
    spec_id = spec['spec_id']
    spec_name = spec['spec_name']
    spec_total = 0
    print(f'\n【专项 {spec_id}】{spec_name}')
    print('-' * 50)
    
    for var in spec['variations']:
        var_id = var['var_id']
        var_name = var.get('name', '未知')
        pool = var.get('original_pool', [])
        var_total = len(pool)
        spec_total += var_total
        
        levels = Counter(q.get('level', '未知') for q in pool)
        
        print(f'  变式 {var_id}「{var_name}」: 共 {var_total} 题')
        for level in ['L2', 'L3', 'L4']:
            if level in levels:
                print(f'    └─ {level}: {levels[level]} 题')
    
    total += spec_total
    print(f'  专项小计: {spec_total} 题')

print('\n' + '=' * 60)
print(f'总计: {total} 题')
print('=' * 60)
