#!/usr/bin/env python3
"""
评估 M06_seed.json 每道题的质量，给出淘汰/保留建议
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
            score += 25  # 高考真题
        else:
            score += 20  # 模考题
    elif '模考' in source or '联考' in source or '一模' in source or '二模' in source:
        score += 18
    elif '风格' in source:
        score += 15  # 风格改编
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
    
    # 检查是否有图象依赖
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
        
        # 计算相似度
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

def get_recommendation(score, issues):
    """根据得分给出建议"""
    if score >= 80:
        return "保留", "高质量题目"
    elif score >= 65:
        if len(issues) <= 1:
            return "保留", "质量良好"
        else:
            return "待定", "质量一般，可考虑淘汰"
    elif score >= 50:
        return "待定", "质量一般，建议优化或淘汰"
    else:
        return "淘汰", "质量较差"

# 按变例和难度分组评估
groups = {}
for q in questions:
    var_id = q.get('varId', '?')
    level = q.get('level', '?')
    key = (var_id, level)
    if key not in groups:
        groups[key] = []
    groups[key].append(q)

# 评估每道题
results = []
for (var_id, level), group_questions in sorted(groups.items()):
    for q in group_questions:
        score, issues = evaluate_question(q, questions)
        recommendation, reason = get_recommendation(score, issues)
        
        results.append({
            'id': q.get('id'),
            'varId': var_id,
            'level': level,
            'source': q.get('source', ''),
            'problem': q.get('problem', '')[:60] + '...',
            'score': score,
            'issues': issues,
            'recommendation': recommendation,
            'reason': reason
        })

# 输出报告
print("=" * 100)
print("M06_seed.json 题目质量评估报告")
print("=" * 100)

# 按变例和难度分组输出
for (var_id, level), group_questions in sorted(groups.items()):
    print(f"\n{'='*100}")
    print(f"【V{var_id} / {level}】 当前 {len(group_questions)} 题")
    print("=" * 100)
    
    group_results = [r for r in results if r['varId'] == var_id and r['level'] == level]
    group_results.sort(key=lambda x: -x['score'])
    
    print(f"{'排名':<4} {'ID':<30} {'得分':<6} {'建议':<6} {'问题':<30}")
    print("-" * 100)
    
    for i, r in enumerate(group_results, 1):
        issues_str = ', '.join(r['issues'][:2]) if r['issues'] else '无'
        print(f"{i:<4} {r['id']:<30} {r['score']:<6} {r['recommendation']:<6} {issues_str[:30]}")

# 统计汇总
print("\n" + "=" * 100)
print("汇总统计")
print("=" * 100)

recommendations = {'保留': 0, '待定': 0, '淘汰': 0}
for r in results:
    recommendations[r['recommendation']] += 1

print(f"\n保留: {recommendations['保留']} 题")
print(f"待定: {recommendations['待定']} 题")
print(f"淘汰: {recommendations['淘汰']} 题")

# 按组统计
print("\n" + "=" * 100)
print("各组淘汰建议")
print("=" * 100)

for (var_id, level), group_questions in sorted(groups.items()):
    group_results = [r for r in results if r['varId'] == var_id and r['level'] == level]
    keep = len([r for r in group_results if r['recommendation'] == '保留'])
    pending = len([r for r in group_results if r['recommendation'] == '待定'])
    remove = len([r for r in group_results if r['recommendation'] == '淘汰'])
    
    current = len(group_questions)
    target_min, target_max = 10, 12
    
    if current > target_max:
        action = f"需淘汰 {current - target_max} 题"
    elif current < target_min:
        action = f"需补充 {target_min - current} 题"
    else:
        action = "数量合适"
    
    print(f"V{var_id}/{level}: 当前{current}题, 保留{keep}+待定{pending}, 淘汰{remove} | {action}")

# 输出淘汰清单
print("\n" + "=" * 100)
print("建议淘汰题目清单")
print("=" * 100)

eliminate_list = [r for r in results if r['recommendation'] == '淘汰']
eliminate_list.sort(key=lambda x: (x['varId'], x['level'], x['score']))

for r in eliminate_list:
    print(f"\n{r['id']}")
    print(f"  来源: {r['source']}")
    print(f"  得分: {r['score']}")
    print(f"  问题: {', '.join(r['issues'])}")
    print(f"  题干: {r['problem']}")

# 输出待定题目清单
print("\n" + "=" * 100)
print("待定题目清单（需人工审核）")
print("=" * 100)

pending_list = [r for r in results if r['recommendation'] == '待定']
pending_list.sort(key=lambda x: (x['varId'], x['level'], -x['score']))

for r in pending_list:
    print(f"\n{r['id']}")
    print(f"  来源: {r['source']}")
    print(f"  得分: {r['score']}")
    print(f"  问题: {', '.join(r['issues'])}")
    print(f"  题干: {r['problem']}")

# 保存详细报告到文件
report_data = {
    'total': len(questions),
    'keep': recommendations['保留'],
    'pending': recommendations['待定'],
    'eliminate': recommendations['淘汰'],
    'results': results
}

with open(os.path.join(base_dir, 'scripts', 'm06_evaluation_report.json'), 'w', encoding='utf-8') as f:
    json.dump(report_data, f, ensure_ascii=False, indent=2)

print("\n" + "=" * 100)
print("详细报告已保存到 scripts/m06_evaluation_report.json")
print("=" * 100)
