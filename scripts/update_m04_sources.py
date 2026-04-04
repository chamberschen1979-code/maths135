import json

with open('M04.json', 'r', encoding='utf-8') as f:
    m04 = json.load(f)

# 来源映射规则 - 根据题目风格判断
source_mapping = {
    # V1.1 基础运算题 - 基础巩固风格
    'M04_1.1_L2_001': '[基础巩固]',
    'M04_1.1_L2_002': '[基础巩固]',
    'M04_1.1_L2_003': '[基础巩固]',
    'M04_1.1_L2_004': '[基础巩固]',
    'M04_1.1_L2_005': '[25 广东一模风格]',
    
    # V1.2 指对同构
    'M04_V1.2_MB_L2_V97': '[24 新高考 I 卷风格]',
    'M04_1.2_L4_001': '[25 浙江杭州二模风格]',
    'M04_1.2_L4_002': '[25 山东济南一模风格]',
    'M04_1.2_L4_003': '[24 广东二模风格]',
    'M04_1.2_L4_004': '[25 江苏南京一模风格]',
    'M04_1.2_L4_005': '[24 华附一模风格]',
    
    # V2.1 定点、对称性
    'M04_2.1_L2_001': '[基础巩固]',
    'M04_2.1_L2_002': '[基础巩固]',
    'M04_2.1_L2_003': '[基础巩固]',
    'M04_2.1_L2_004': '[25 深圳一模风格]',
    'M04_2.1_L2_005': '[基础巩固]',
    
    # V2.2 复合单调性
    'M04_2.2_L2_001': '[基础巩固]',
    'M04_2.2_L2_002': '[24 广东二模风格]',
    'M04_2.2_L2_003': '[基础巩固]',
    'M04_2.2_L2_004': '[基础巩固]',
    'M04_2.2_L2_005': '[25 广州一模风格]',
    'M04_V2.2_MB_L2_V97': '[基础巩固]',
    
    # V2.2 压轴题
    'M04_2.2_L4_011': '[25 浙江宁波十校联考风格]',
    'M04_2.2_L4_012': '[24 华附零模风格]',
    'M04_2.2_L4_013': '[25 山东济南一模风格]',
    'M04_2.2_L4_014': '[24 深圳一模风格]',
    'M04_2.2_L4_015': '[25 浙江杭州二模风格]',
}

# 更新来源
updated_count = 0
for specialty in m04.get('specialties', []):
    for variation in specialty.get('variations', []):
        for q in variation.get('original_pool', []):
            qid = q.get('id', '')
            source = q.get('source', '')
            
            # 如果是未知来源或空，且有映射
            if (source == '未知来源' or not source) and qid in source_mapping:
                q['source'] = source_mapping[qid]
                updated_count += 1
                print(f"更新: {qid} -> {source_mapping[qid]}")

# 保存
with open('M04.json', 'w', encoding='utf-8') as f:
    json.dump(m04, f, ensure_ascii=False, indent=2)

print(f"\n共更新 {updated_count} 道题目的来源")
