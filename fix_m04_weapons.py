import json

with open('src/data/M04.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 修复无效的杀手锏ID
# S-FUNC-03 不存在，S-FUNC-01 不存在
# 根据题目内容替换为正确的杀手锏

fixes = {
    # M04_V2_2.1_L2_SEED_005: 与x轴交点，应该用 S-FUNC-04（零点个数）
    'M04_V2_2.1_L2_SEED_005': {
        'old': ['S-FUNC-03'],
        'new': ['S-FUNC-04']  # 零点个数（数形结合）
    },
    # M04_V2_2.2_L4_SEED_024: 复合方程有解，应该用 S-FUNC-08（复合零点）
    'M04_V2_2.2_L4_SEED_024': {
        'old': ['S-FUNC-03'],
        'new': ['S-FUNC-08']  # 复合零点（剥洋葱）
    },
    # M04_V2_2.2_L4_SEED_025: 零点个数问题，应该用 S-FUNC-04
    'M04_V2_2.2_L4_SEED_025': {
        'old': ['S-FUNC-03'],
        'new': ['S-FUNC-04']  # 零点个数（数形结合）
    },
    # M04_V2_2.2_L4_SEED_026: 指对同构，应该用 S-LOG-02
    'M04_V2_2.2_L4_SEED_026': {
        'old': ['S-FUNC-01'],
        'new': ['S-LOG-02']  # 指对同构
    },
    # M04_V2_2.2_L4_SEED_027: 方程根的个数，应该用 S-FUNC-04
    'M04_V2_2.2_L4_SEED_027': {
        'old': ['S-FUNC-03'],
        'new': ['S-FUNC-04']  # 零点个数（数形结合）
    }
}

fixed_count = 0

for spec in data['specialties']:
    for var in spec['variations']:
        pool = var.get('original_pool', [])
        for q in pool:
            qid = q.get('id', '')
            if qid in fixes:
                fix = fixes[qid]
                if 'meta' in q and 'weapons' in q['meta']:
                    old_weapons = q['meta']['weapons']
                    if old_weapons == fix['old']:
                        q['meta']['weapons'] = fix['new']
                        print(f"已修复 {qid}: {fix['old']} -> {fix['new']}")
                        fixed_count += 1

with open('src/data/M04.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\n共修复 {fixed_count} 个杀手锏ID")
print("M04.json 杀手锏修复完成！")
