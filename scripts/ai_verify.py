import json, re, os, time, random, subprocess

# Read API key from .env
with open('.env') as f:
    for line in f:
        if 'VITE_QWEN_API_KEY' in line:
            API_KEY = line.split('=')[1].strip()
            break

API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
DATA_DIR = 'src/data'

def load_motif(fid):
    with open(f'{DATA_DIR}/{fid}.json') as f:
        return json.load(f)

def build_prompt(problem, answer):
    return f"""请判断以下高中数学题的答案是否正确。

题目：{problem}

给出的答案：{answer}

请独立解答这道题，然后判断给出的答案是否正确。
仅回复 YES 或 NO，如果答案是 NO，简要说明正确答案应该是什么。
格式：YES 或 NO: <简要说明>"""

def call_qwen(prompt):
    body = json.dumps({
        "model": "qwen-plus",
        "messages": [
            {"role": "system", "content": "你是一位高中数学教师，负责验算题目答案。仅回复YES或NO:原因"},
            {"role": "user", "content": prompt}
        ]
    })
    import subprocess
    try:
        result = subprocess.run([
            'curl', '-s', API_URL,
            '-H', f'Authorization: Bearer {API_KEY}',
            '-H', 'Content-Type: application/json',
            '-d', body
        ], capture_output=True, text=True, timeout=35)
        data = json.loads(result.stdout)
        return data['choices'][0]['message']['content']
    except Exception as e:
        return f"ERROR: {e}"

def sample_questions():
    """Sample 5 questions per motif, prioritizing different difficulty levels."""
    samples = []
    for i in range(1, 18):
        fid = f'M{str(i).zfill(2)}'
        data = load_motif(fid)
        pool = []
        for s in data.get('specialties', []):
            for v in s.get('variations', []):
                for q in v.get('original_pool', []):
                    prob = q.get('problem') or q.get('desc', '')
                    ans = q.get('answer', '')
                    if prob and ans and ans not in ('见解析', '见教材解析', '暂无答案', ''):
                        pool.append(q)

        random.shuffle(pool)
        # Pick up to 5, trying to spread across levels
        by_level = {'L2': [], 'L3': [], 'L4': []}
        for q in pool:
            lv = q.get('level', 'L2')
            if lv in by_level and len(by_level[lv]) < 2:
                by_level[lv].append(q)

        selected = []
        for lv in ['L2', 'L3', 'L4']:
            selected.extend(by_level[lv][:2])
        selected.extend(pool[:5])  # fill up to 5

        samples.extend(selected[:5])

    return samples

def main():
    samples = sample_questions()
    print(f'抽样 {len(samples)} 道题，开始AI验算...\n')

    issues = []
    for idx, q in enumerate(samples):
        prob = q.get('problem') or q.get('desc', '')
        ans = q.get('answer', '')
        qid = q.get('id', '?')

        if len(prob) > 500:
            prob = prob[:500]

        prompt = build_prompt(prob, ans)
        print(f'[{idx+1}/{len(samples)}] {qid} ', end='', flush=True)

        result = call_qwen(prompt)
        print(result[:80])

        if result.startswith('NO') or '错误' in result or '不正确' in result:
            issues.append({
                'id': qid,
                'problem': prob[:120],
                'answer': ans[:80],
                'ai_response': result[:200]
            })

        time.sleep(0.5)  # rate limit

    print(f'\n===== 结果 =====')
    print(f'验算 {len(samples)} 题, {len(issues)} 题AI认为有问题:')
    for item in issues:
        print(f'\n{item["id"]}')
        print(f'  题目: {item["problem"]}')
        print(f'  答案: {item["answer"]}')
        print(f'  AI: {item["ai_response"]}')

if __name__ == '__main__':
    main()
