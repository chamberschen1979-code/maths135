import json

with open('src/data/M04.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

variations_info = {
    '1.1': {'L2': True, 'L3': True, 'L4': True},
    '1.2': {'L2': False, 'L3': True, 'L4': True},
    '2.1': {'L2': True, 'L3': True, 'L4': True},
    '2.2': {'L2': True, 'L3': True, 'L4': True},
}

var_names = {
    '1.1': '复合运算与指对转化',
    '1.2': '指对同构',
    '2.1': '定点、对称性与反函数',
    '2.2': '复合单调性与值域',
}

added_count = 0

for spec in data['specialties']:
    spec_id = spec['spec_id']
    
    for var in spec['variations']:
        var_id = var['var_id']
        
        if 'master_benchmarks' not in var:
            benchmarks = []
            levels = variations_info.get(var_id, {'L2': True, 'L3': True, 'L4': True})
            
            for level in ['L2', 'L3', 'L4']:
                if levels.get(level, True):
                    benchmarks.append({
                        "level": level,
                        "id": f"M04_V{spec_id}_{var_id}_MB_{level}",
                        "problem": f"[{level}基准题] {var_names.get(var_id, '')}{'基础' if level=='L2' else '综合' if level=='L3' else '压轴'}应用",
                        "logic_key": f"{'基础' if level=='L2' else '综合' if level=='L3' else '压轴'}方法应用",
                        "is_mastered": None,
                        "consecutive_correct": 0
                    })
            
            var['master_benchmarks'] = benchmarks
            added_count += 1
            print(f"为 V{spec_id}_{var_id} 添加了 {len(benchmarks)} 个基准题")

with open('src/data/M04.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\n共为 {added_count} 个变式添加了 master_benchmarks")
