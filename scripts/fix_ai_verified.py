import json

# Only fix clear errors verified by AI computation
FIXES = {
    # M03: f(x)代入验证 2(3x+1)+3(-x)+1=3x+3≠3x+1，真正解为3x+1/3
    'M03': {
        'M03_V1_1.1_L3_010': '$3x + \\frac{1}{3}$',
    },
    # M14: 符号反了
    'M14': {
        'M14_V2_2.1_L3_002': '$\\frac{a}{2}(2x_0 - x_0^2)$',
        'M14_V2_2.1_L4_014': '$a(x_0 - 2)$  # AI验证此公式推导正确，保持原答案',
    },
}

for fid, fixes in FIXES.items():
    filepath = f'src/data/{fid}.json'
    with open(filepath) as f:
        data = json.load(f)

    modified = False
    for s in data.get('specialties', []):
        for v in s.get('variations', []):
            for q in v.get('original_pool', []):
                qid = q.get('id', '')
                if qid in fixes:
                    old = q['answer']
                    new = fixes[qid]
                    if new.startswith('$') and '#' in new:
                        # Skip comments
                        continue
                    q['answer'] = new
                    print(f'{fid}/{qid}:')
                    print(f'  ❌ {old[:60]}')
                    print(f'  ✅ {new[:60]}')
                    print(f'  题: {str(q.get("problem",""))[:80]}')
                    print()
                    modified = True

    if modified:
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
