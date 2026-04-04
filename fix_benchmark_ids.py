import json

with open('src/data/M04.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

fixed_count = 0

for spec in data['specialties']:
    spec_id = spec['spec_id']
    
    for var in spec['variations']:
        var_id = var['var_id']
        
        if 'master_benchmarks' in var:
            for b in var['master_benchmarks']:
                old_id = b.get('id', '')
                correct_id = f"M04_V{spec_id}_{var_id}_MB_{b['level']}"
                if old_id != correct_id:
                    b['id'] = correct_id
                    fixed_count += 1
                    print(f"修复: {old_id} -> {correct_id}")

with open('src/data/M04.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\n共修复 {fixed_count} 个ID")
