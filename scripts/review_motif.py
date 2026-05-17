import json, sys

def review_one(fid):
    with open(f'src/data/{fid}.json') as f:
        data = json.load(f)

    name = data.get('motif_name', fid)
    print(f'\n{"="*60}')
    print(f'  {fid}  {name}')
    print(f'{"="*60}')

    issues = []
    total = 0
    for s in data.get('specialties', []):
        for v in s.get('variations', []):
            for q in v.get('original_pool', []):
                total += 1
                qid = q.get('id', '?')
                prob = str(q.get('problem', '') or q.get('desc', ''))
                ans = str(q.get('answer', ''))
                ana = str(q.get('analysis', ''))

                # --- Design issue: question type mismatch ---
                if '个数' in prob and ('区间' in ana or '连续' in ana or '值域' in ana):
                    if len(extract_interval(ana)) > 0:
                        issues.append(('DESIGN', qid, '问"个数"但答案是连续区间', prob[:60], ans[:40]))

                # --- Empty / placeholder answer ---
                if not ans or ans in ('见解析', '见教材解析', '暂无答案'):
                    issues.append(('MISSING', qid, '无答案', prob[:60], '-'))

                # --- Proof with just "证明题" as answer ---
                if ('证明' in prob or '求证' in prob) and ans in ('证明题', '证明') and len(ana) < 20:
                    issues.append(('PROOF', qid, '证明题缺少推导', prob[:60], ans[:40]))

                # --- Analysis doesn't reach conclusion ---
                if '【答案】' not in ana and ans and ans not in ('见解析', '证明题'):
                    issues.append(('NO_ANS_MARK', qid, '解析无【答案】标记', prob[:60], ans[:40]))

    print(f'  共 {total} 题')
    if issues:
        print(f'  ⚠️  {len(issues)} 个可疑:')
        for typ, qid, desc, p, a in issues:
            print(f'    [{typ}] {qid}')
            print(f'      {desc}')
            print(f'      题: {p}')
            print(f'      答: {a}')
    else:
        print(f'  ✅ 无异常')

    return issues

def extract_interval(s):
    import re
    return re.findall(r'[\[\(]-?\d+\.?\d*\s*,\s*-?\d+\.?\d*[\]\)]', s)

if __name__ == '__main__':
    start = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    end = int(sys.argv[2]) if len(sys.argv) > 2 else 17

    for i in range(start, end+1):
        fid = f'M{str(i).zfill(2)}'
        try:
            review_one(fid)
        except Exception as e:
            print(f'{fid}: ERROR - {e}')
