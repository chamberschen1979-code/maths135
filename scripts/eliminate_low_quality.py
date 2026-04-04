#!/usr/bin/env python3
"""
执行严格淘汰标准：淘汰得分<80的题目
"""

import json
import os
import re

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, 'src', 'data')

with open(os.path.join(data_dir, 'M06_seed.json'), 'r', encoding='utf-8') as f:
    m06_seed = json.load(f)

questions = m06_seed.get('questions', [])

def evaluate_question(q, all_questions):
    """评估单道题的质量"""
    score = 0
    issues = []
    
    # 1. 来源评估 (0-25分)
    source = q.get('source', '')
    if '高考' in source or '卷' in source:
        if '新高考' in source or '全国' in source:
            score += 25
        else:
            score += 20
    elif '模考' in source or '联考' in source or '一模' in source or '二模' in source:
        score += 18
    elif '风格' in source:
        score += 15
    else:
        score += 10
        issues.append("来源标注不明确")
    
    # 2. 题干质量 (0-20分)
    problem = q.get('problem', '')
    if len(problem) < 20:
        score += 5
        issues.append("题干过短")
    elif len(problem) > 200:
        score += 15
    else:
        score += 18
    
    if '如图' in problem or '图象如图' in problem:
        issues.append("依赖图象")
        score -= 5
    
    # 3. 答案质量 (0-20分)
    answer = q.get('answer', '')
    if not answer or answer == '':
        score += 0
        issues.append("答案缺失")
    elif '______' in answer or '____' in answer:
        score += 10
        issues.append("答案为填空形式")
    elif len(answer) < 5:
        score += 12
        issues.append("答案过简")
    else:
        score += 20
    
    # 4. 解析质量 (0-20分)
    analysis = q.get('analysis', '')
    key_points = q.get('key_points', [])
    
    if analysis and len(analysis) > 50:
        score += 10
    else:
        issues.append("解析不完整")
    
    if key_points and len(key_points) >= 2:
        score += 10
    else:
        issues.append("关键步骤不足")
    
    # 5. 重复度检查 (0-15分)
    problem_core = re.sub(r'[\\$]', '', problem)
    problem_core = re.sub(r'\[.*?\]', '', problem_core).strip()[:50]
    
    similar_count = 0
    for other in all_questions:
        if other.get('id') == q.get('id'):
            continue
        other_core = re.sub(r'[\\$]', '', other.get('problem', ''))
        other_core = re.sub(r'\[.*?\]', '', other_core).strip()[:50]
        common = sum(1 for a, b in zip(problem_core, other_core) if a == b)
        if common > 30:
            similar_count += 1
    
    if similar_count == 0:
        score += 15
    elif similar_count <= 2:
        score += 10
        issues.append(f"有{similar_count}道相似题")
    else:
        score += 5
        issues.append(f"有{similar_count}道相似题，重复度高")
    
    # 6. 特殊问题扣分
    if '可能有误' in analysis or '有误' in analysis:
        score -= 10
        issues.append("答案可能有误")
    
    return score, issues

# 评估所有题目
evaluations = []
for q in questions:
    score, issues = evaluate_question(q, questions)
    evaluations.append({
        'id': q.get('id'),
        'score': score,
        'issues': issues,
        'question': q
    })

# 淘汰得分<80的题目
keep_questions = []
eliminate_questions = []

for eval_item in evaluations:
    if eval_item['score'] >= 80:
        keep_questions.append(eval_item['question'])
    else:
        eliminate_questions.append(eval_item)

# 更新数据
m06_seed['questions'] = keep_questions
m06_seed['total_questions'] = len(keep_questions)

# 保存
with open(os.path.join(data_dir, 'M06_seed.json'), 'w', encoding='utf-8') as f:
    json.dump(m06_seed, f, ensure_ascii=False, indent=2)

# 输出报告
print("=" * 80)
print("M06_seed.json 严格淘汰执行报告")
print("=" * 80)

print(f"\n淘汰标准: 得分 < 80")
print(f"淘汰前题目数: {len(questions)}")
print(f"淘汰后题目数: {len(keep_questions)}")
print(f"淘汰题目数: {len(eliminate_questions)}")

print("\n" + "=" * 80)
print("淘汰题目清单")
print("=" * 80)

for e in sorted(eliminate_questions, key=lambda x: (x['question'].get('varId', ''), x['question'].get('level', ''), x['score'])):
    q = e['question']
    print(f"\n{e['id']} (得分: {e['score']})")
    print(f"  变例: V{q.get('varId', '?')} / {q.get('level', '?')}")
    print(f"  来源: {q.get('source', '')}")
    print(f"  问题: {', '.join(e['issues'])}")

print("\n" + "=" * 80)
print("淘汰后各组统计")
print("=" * 80)

# 按变例和难度统计
stats = {}
for q in keep_questions:
    var_id = q.get('varId', '?')
    level = q.get('level', '?')
    key = (var_id, level)
    stats[key] = stats.get(key, 0) + 1

print(f"\n{'变例':<10} {'难度':<6} {'题数':>6} {'状态':>10}")
print("-" * 40)

for (var_id, level), count in sorted(stats.items()):
    status = "✓ 合格" if 10 <= count <= 12 else ("⚠ 需补充" if count < 10 else "⚠ 需精简")
    print(f"V{var_id:<9} {level:<6} {count:>6} {status:>10}")

print("\n" + "=" * 80)
print("需补充的组（题数<10）")
print("=" * 80)

for (var_id, level), count in sorted(stats.items()):
    if count < 10:
        need = 10 - count
        print(f"V{var_id} / {level}: 当前{count}题，需补充{need}题")

print("\n淘汰完成！")
