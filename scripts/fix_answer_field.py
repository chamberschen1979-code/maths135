import json, re, os

DATA_DIR = 'src/data'

def extract_answer_from_analysis(analysis):
    m = re.search(r'【答案[：:】]\s*(.+)', analysis)
    if m: return m.group(1).strip()
    m = re.search(r'答案[：:]\s*(.+)', analysis)
    if m: return m.group(1).strip()
    return None

def normalize(s):
    s = str(s).strip()
    s = re.sub(r'\$\s*', '', s)
    s = re.sub(r'\s*\$', '', s)
    s = re.sub(r'\\\(', '', s)
    s = re.sub(r'\\\)', '', s)
    s = re.sub(r'\\boxed\{([^}]*)\}', r'\1', s)
    s = s.replace(' ', '')
    return s

def extract_nums(s):
    return [float(x) for x in re.findall(r'-?\d+\.?\d*', str(s))]

def check_one(answer, analysis):
    a_in_a = extract_answer_from_analysis(analysis)
    if not a_in_a:
        return None

    n1 = sorted(extract_nums(a_in_a))
    n2 = sorted(extract_nums(answer))

    if not n1 or not n2:
        # Can't compare numerically, try string
        if normalize(a_in_a) != normalize(answer):
            return a_in_a  # return analysis version as "correct"
        return None

    # Compare numeric values with tolerance
    if len(n1) != len(n2):
        return a_in_a  # different number of values → likely wrong

    for v1, v2 in zip([float(x) for x in n1], [float(x) for x in n2]):
        if abs(v1 - v2) > 0.01:
            return a_in_a  # found mismatch

    return None

def fix_all():
    fixed = []
    for i in range(1, 18):
        fid = f'M{str(i).zfill(2)}'
        filepath = f'{DATA_DIR}/{fid}.json'
        with open(filepath) as f:
            data = json.load(f)

        modified = False
        for s in data.get('specialties', []):
            for v in s.get('variations', []):
                for q in v.get('original_pool', []):
                    answer = str(q.get('answer', '')).strip()
                    analysis = str(q.get('analysis', '')).strip()
                    if not answer or not analysis:
                        continue

                    correct = check_one(answer, analysis)
                    if correct:
                        qid = q.get('id', '?')
                        fixed.append({
                            'file': fid, 'id': qid,
                            'old': answer[:80],
                            'new': correct[:80],
                            'problem': str(q.get('problem', ''))[:60]
                        })
                        q['answer'] = correct
                        modified = True

        if modified:
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f'{fid}: 已保存')

    print(f'\n共修复 {len(fixed)} 道题:')
    for item in fixed:
        print(f'  {item["file"]}/{item["id"]}')
        print(f'    ❌ {item["old"]}')
        print(f'    ✅ {item["new"]}')
        print(f'    题目: {item["problem"]}')
        print()

fix_all()
