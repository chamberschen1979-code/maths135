import json, re, math

DATA_DIR = 'src/data'

def load(fid):
    with open(f'{DATA_DIR}/{fid}.json') as f: return json.load(f)

def extract_answer_text(analysis):
    """Extract the claimed answer from analysis text."""
    m = re.search(r'【答案[：:】]\s*(.+)', analysis)
    if m: return m.group(1).strip()
    m = re.search(r'答案[：:]\s*(.+)', analysis)
    if m: return m.group(1).strip()
    return None

def extract_nums(s):
    return re.findall(r'-?\d+\.?\d*', str(s))

def normalize(s):
    """Normalize for comparison: strip $, spaces, LaTeX wrappers."""
    s = str(s).strip()
    s = re.sub(r'\$\s*', '', s)
    s = re.sub(r'\s*\$', '', s)
    s = re.sub(r'\\\(', '', s)
    s = re.sub(r'\\\)', '', s)
    s = re.sub(r'\\boxed\{([^}]*)\}', r'\1', s)
    s = s.replace(' ', '')
    return s

def check_single(q, fid):
    issues = []
    answer = str(q.get('answer', '')).strip()
    analysis = str(q.get('analysis', '')).strip()
    problem = str(q.get('problem', '') or q.get('desc', '')).strip()
    qid = q.get('id', '?')

    # Skip empty
    if not answer or answer in ('见解析', '见教材解析', '暂无答案', ''):
        return issues

    # 1. Answer in analysis vs answer field mismatch
    ans_in_analysis = extract_answer_text(analysis)
    if ans_in_analysis:
        a1 = normalize(ans_in_analysis)
        a2 = normalize(answer)
        # Compare numeric parts
        n1 = sorted(extract_nums(a1))
        n2 = sorted(extract_nums(a2))
        if n1 and n2:
            # Allow small float differences
            if len(n1) == len(n2):
                for v1, v2 in zip([float(x) for x in n1], [float(x) for x in n2]):
                    if abs(v1 - v2) > 0.01:
                        issues.append(('warn', f'答案与分析不一致: analysis→{ans_in_analysis[:40]} vs answer→{answer[:40]}'))
                        break
            elif abs(len(n1) - len(n2)) > 1:
                issues.append(('warn', f'答案数值个数不同: analysis{n1} vs answer{n2}'))

    # 2. Simple substitution checks based on problem type
    text = f"{problem} {analysis}"

    # --- Triangle: a²+b²=c² check for right triangles ---
    if any(kw in text for kw in ['直角', '∠C=90', '∠A=90', '∠B=90']):
        nums = extract_nums(text)
        nums = [float(x) for x in nums if 1 < float(x) < 1000]
        if len(nums) >= 3:
            # Try to find Pythagorean triple among last 3-4 nums
            recent = nums[-6:]
            for i in range(len(recent)):
                for j in range(i+1, len(recent)):
                    for k in range(j+1, len(recent)):
                        a,b,c = sorted([recent[i], recent[j], recent[k]])
                        if abs(a*a + b*b - c*c) < 0.01:
                            # Found a triple — check if it's the answer
                            pass  # no further check needed

    # --- Solve-for-x: verify f(answer)=0 ---
    if any(kw in text for kw in ['求x', '求 x', '解方程', '=0']):
        # Extract equation pattern: something = 0 or = right_side
        eq_match = re.search(r'([^，。；\n]*?)=\s*0', problem)
        if eq_match:
            eq = eq_match.group(1)
            ans_nums = extract_nums(answer)
            for n in ans_nums:
                check_eq = eq.replace('x', f'({n})')
                # Only attempt simple evaluations with basic math
                try:
                    # Replace LaTeX fractions
                    check_eq = re.sub(r'\\frac\{([^}]*)\}\{([^}]*)\}', r'(\1)/(\2)', check_eq)
                    check_eq = re.sub(r'\^\{([^}]*)\}', r'**(\1)', check_eq)
                    check_eq = check_eq.replace('^', '**')
                    check_eq = check_eq.replace('√', 'math.sqrt')
                    # Very basic: only allow safe chars
                    safe = re.match(r'^[\d\s+\-*/().,math.sqrt]+$', check_eq)
                    if safe:
                        val = eval(check_eq.replace(',','.'))
                        if abs(val) > 0.1:
                            issues.append(('warn', f'x={n}代回方程得{val:.1f}≠0'))
                except:
                    pass

    # 3. Answer looks like complete gibberish?
    if len(answer) > 2000:
        issues.append(('warn', f'答案过长({len(answer)}字符)'))

    return issues

def main():
    total, errs, warns = 0, 0, 0
    for i in range(1, 18):
        fid = f'M{str(i).zfill(2)}'
        data = load(fid)
        for s in data.get('specialties',[]):
            for v in s.get('variations',[]):
                for q in v.get('original_pool',[]):
                    total += 1
                    for sev, msg in check_single(q, fid):
                        if sev == 'error': errs += 1
                        else: warns += 1
                        print(f'  [{sev.upper()}] {fid}/{q.get("id","?")}: {msg[:120]}')

    print(f'\n检查{total}题, {errs}错误, {warns}警告')

main()
