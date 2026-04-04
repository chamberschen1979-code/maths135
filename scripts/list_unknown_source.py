import json

with open('M04.json', 'r', encoding='utf-8') as f:
    m04 = json.load(f)

# 找出所有未知来源的题目
unknown_questions = []
for s in m04.get('specialties', []):
    for v in s.get('variations', []):
        for q in v.get('original_pool', []):
            source = q.get('source', '')
            if source == '未知来源' or not source:
                q['var_id'] = v.get('var_id', '')
                q['var_name'] = v.get('name', '')
                unknown_questions.append(q)

print(f"未知来源题目共 {len(unknown_questions)} 道:\n")
for i, q in enumerate(unknown_questions, 1):
    print(f"{i}. {q.get('id')} [{q.get('level')}]")
    print(f"   变式: V{q.get('var_id')} - {q.get('var_name')}")
    problem = q.get('problem', '')[:100]
    print(f"   题目: {problem}")
    print()
