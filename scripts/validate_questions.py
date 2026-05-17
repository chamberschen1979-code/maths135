import json, re, os

DATA_DIR = 'src/data'
REPORT = []

def load_motif(fid):
    with open(f'{DATA_DIR}/{fid}.json') as f:
        return json.load(f)

def check_problem(q, fid):
    issues = []
    text = str(q.get('problem', '') or q.get('desc', '') or q.get('question', ''))
    answer = str(q.get('answer', ''))
    analysis = str(q.get('analysis', ''))
    full = f"{text} {answer} {analysis}"

    # --- Empty check ---
    if not text.strip():
        issues.append(('warn', '题干为空'))
        return issues

    # --- LaTeX balance ---
    dollars = text.count('$')
    if dollars % 2 != 0:
        issues.append(('warn', f'$不对称({dollars}个)'))

    # --- sin/cos range ---
    for m in re.finditer(r'sin\s*(\d+)\s*=\s*(\d+\.?\d*)', full):
        v = float(m.group(2))
        if v > 1.001:
            issues.append(('error', f'sin值>1: {m.group(0)}'))

    # --- Negative R ---
    for m in re.finditer(r'[Rr]\s*=\s*(-\d+\.?\d*)', full):
        if float(m.group(1)) < 0:
            issues.append(('error', f'半径为负: {m.group(0)}'))

    # --- Divide by zero ---
    if '/0' in text or '/ 0' in text:
        issues.append(('error', '除数为零'))

    # --- Triangle side extraction (careful: exclude angles) ---
    # Look for explicitly labeled sides: AB=3, a=4, BC=5, etc.
    # But NOT ∠A=60 which also matches the pattern.
    sides = []
    # Pattern: (letter)(letter)=number, but NOT preceded by ∠
    for m in re.finditer(r'(?<!∠)([A-Za-z])\s*[=＝]\s*(\d+\.?\d*)', text):
        key = m.group(1).lower()
        val = float(m.group(2))
        # Skip if value looks like an angle (>30 and divisible by 5 or 3)
        if val > 30 and (val % 5 < 0.01 or val % 3 < 0.01 or val % 15 < 0.01):
            continue
        # Skip if key is 'a' and problem has ∠A
        if key in ('a','b','c') and ('∠' in text or '角' in text):
            continue
        sides.append(val)

    # Also try AB=6, BC=8 pattern (two uppercase letters followed by =number)
    for m in re.finditer(r'([A-Z]{2})\s*[=＝]\s*(\d+\.?\d*)', text):
        val = float(m.group(2))
        if val > 30 and (val % 5 < 0.01 or val % 15 < 0.01):
            continue
        sides.append(val)

    sides = sorted(set(s for s in sides if 0 < s < 100))
    if len(sides) >= 3:
        a, b, c = sides[-3:]
        if a + b <= c:
            issues.append(('warn', f'可能违反三角不等式: 最小两边{a}+{b}={a+b} ≤ 最大边{c} (可能是角度误提取)'))

    # --- Answer not empty / gibberish ---
    if answer.strip() and answer != '见解析' and answer != '见教材解析' and len(answer) < 2000:
        # Check if answer contains unrendered LaTeX garbage
        bad = ['\\\\frac', '\\frac{\\frac', '\\begin{array']
        for b in bad:
            if b in answer:
                issues.append(('warn', f'答案含可疑LaTeX: {b[:20]}'))

    return issues

def check_all():
    total = 0
    errors = 0
    warnings = 0
    by_motif = {}

    for i in range(1, 18):
        fid = f'M{str(i).zfill(2)}'
        try:
            data = load_motif(fid)
        except:
            print(f'{fid}: 读取失败')
            continue

        mname = data.get('motif_name', fid)
        m_iss = 0

        for s in data.get('specialties', []):
            for v in s.get('variations', []):
                for q in v.get('original_pool', []):
                    total += 1
                    iss = check_problem(q, fid)
                    for sev, msg in iss:
                        m_iss += 1
                        if sev == 'error': errors += 1
                        else: warnings += 1
                        qid = q.get('id', '?')
                        REPORT.append(f'  [{sev.upper()}] {fid}/{qid}: {msg}')
        if m_iss > 0:
            by_motif[fid] = m_iss

    print(f'检查 {total} 题, {errors} 错误, {warnings} 警告')
    if not REPORT:
        print('未发现问题！')
        return

    for line in REPORT:
        print(line)

    print(f'\n按母题分布:')
    for fid, n in sorted(by_motif.items()):
        print(f'  {fid}: {n}个')

check_all()
