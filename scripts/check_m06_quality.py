#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
M06.json 题库全面质量检查
检查维度：高考实战、题型覆盖、难度区分、杀手锏配置、字段完整性
"""

import json
from pathlib import Path
from collections import defaultdict, Counter

DATA_FILE = Path(__file__).parent.parent / "src" / "data" / "M06.json"

def load_data():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def check_source_quality(questions):
    """检查题目来源质量"""
    print("\n" + "="*60)
    print("一、高考实战评估")
    print("="*60)
    
    # 统计来源年份
    year_count = defaultdict(int)
    source_type = defaultdict(int)
    
    high_quality_sources = [
        '新高考', '全国甲', '全国乙', '八省联考', '九省联考',
        '山东', '浙江', '江苏', '广东',
        '华附', '华师附中', '省实', '深圳中学', '深中',
        '杭州', '南京', '济南', '广州'
    ]
    
    high_quality_count = 0
    
    for q in questions:
        source = q.get('source', '')
        
        # 提取年份
        import re
        years = re.findall(r'20(2[3-6])', source)
        for y in years:
            year_count[f'20{y}'] += 1
        
        # 判断来源类型
        if any(hq in source for hq in high_quality_sources):
            high_quality_count += 1
            if '高考' in source or '联考' in source:
                source_type['高考/联考真题'] += 1
            else:
                source_type['强省/名校模拟'] += 1
        else:
            source_type['其他来源'] += 1
    
    print(f"\n1. 来源年份分布：")
    for year in sorted(year_count.keys()):
        print(f"   {year}年: {year_count[year]}道")
    
    print(f"\n2. 来源类型分布：")
    for st, count in sorted(source_type.items(), key=lambda x: -x[1]):
        print(f"   {st}: {count}道")
    
    print(f"\n3. 高质量来源占比：")
    ratio = high_quality_count / len(questions) * 100
    print(f"   {high_quality_count}/{len(questions)} = {ratio:.1f}%")
    
    # 评分
    if ratio >= 80:
        score = 95
        status = "优秀 ✅"
    elif ratio >= 60:
        score = 85
        status = "良好 ⚠️"
    else:
        score = 70
        status = "需改进 ❌"
    
    print(f"\n   评分: {score}/100 ({status})")
    return score

def check_topic_coverage(questions):
    """检查题型覆盖"""
    print("\n" + "="*60)
    print("二、题型覆盖评估")
    print("="*60)
    
    # 定义核心考点
    core_topics = {
        '1.1': ['配角技巧', '两角和差', '二倍角', '半角公式', '诱导公式'],
        '1.2': ['辅助角公式', '最值', '对称性', '周期性'],
        '2.1': ['图象平移', '图象伸缩', '图象识别', '五点作图'],
        '2.2': ['ω范围-零点', 'ω范围-单调性', 'ω范围-极值', 'ω范围-值域']
    }
    
    # 统计各考点覆盖
    topic_coverage = defaultdict(lambda: defaultdict(int))
    
    for q in questions:
        var_id = q.get('varId', '')
        problem = q.get('problem', '')
        tags = q.get('tags', [])
        key_points = q.get('key_points', [])
        
        # 根据题目内容判断考点
        content = problem + ' '.join(tags) + ' '.join(key_points)
        
        if var_id == '1.1':
            if '配角' in content or 'α+β' in content or 'α-β' in content:
                topic_coverage['1.1']['配角技巧'] += 1
            if '两角和' in content or '两角差' in content:
                topic_coverage['1.1']['两角和差'] += 1
            if '2α' in content or '二倍角' in content or '倍角' in content:
                topic_coverage['1.1']['二倍角'] += 1
            if '诱导' in content:
                topic_coverage['1.1']['诱导公式'] += 1
        elif var_id == '1.2':
            if '辅助角' in content or 'asin' in content.lower() or '√3' in content:
                topic_coverage['1.2']['辅助角公式'] += 1
            if '最大值' in content or '最小值' in content or '最值' in content:
                topic_coverage['1.2']['最值'] += 1
            if '对称' in content:
                topic_coverage['1.2']['对称性'] += 1
        elif var_id == '2.1':
            if '平移' in content:
                topic_coverage['2.1']['图象平移'] += 1
            if '伸缩' in content:
                topic_coverage['2.1']['图象伸缩'] += 1
            if '图象' in content or '图像' in content:
                topic_coverage['2.1']['图象识别'] += 1
        elif var_id == '2.2':
            if '零点' in content:
                topic_coverage['2.2']['ω范围-零点'] += 1
            if '单调' in content:
                topic_coverage['2.2']['ω范围-单调性'] += 1
            if '极值' in content or '极大值' in content or '极小值' in content:
                topic_coverage['2.2']['ω范围-极值'] += 1
            if '值域' in content:
                topic_coverage['2.2']['ω范围-值域'] += 1
    
    print(f"\n各变例考点覆盖情况：")
    
    total_covered = 0
    total_expected = 0
    
    for var_id in ['1.1', '1.2', '2.1', '2.2']:
        print(f"\n  V{var_id}:")
        for topic in core_topics.get(var_id, []):
            count = topic_coverage[var_id][topic]
            status = "✅" if count >= 2 else ("⚠️" if count >= 1 else "❌")
            print(f"    {topic}: {count}道 {status}")
            if count >= 1:
                total_covered += 1
            total_expected += 1
    
    coverage_ratio = total_covered / total_expected * 100
    print(f"\n考点覆盖率: {total_covered}/{total_expected} = {coverage_ratio:.1f}%")
    
    # 评分
    if coverage_ratio >= 90:
        score = 95
        status = "优秀 ✅"
    elif coverage_ratio >= 70:
        score = 85
        status = "良好 ⚠️"
    else:
        score = 70
        status = "需改进 ❌"
    
    print(f"评分: {score}/100 ({status})")
    return score

def check_difficulty_distribution(questions):
    """检查难度分布"""
    print("\n" + "="*60)
    print("三、难度区分评估")
    print("="*60)
    
    # 统计各变例各难度分布
    distribution = defaultdict(lambda: defaultdict(int))
    
    for q in questions:
        var_id = q.get('varId', 'unknown')
        level = q.get('level', 'unknown')
        distribution[var_id][level] += 1
    
    print(f"\n各变例难度分布：")
    print(f"{'变例':<8} {'L2':>6} {'L3':>6} {'L4':>6} {'总计':>6} {'评价':>10}")
    print("-"*50)
    
    total_l2, total_l3, total_l4 = 0, 0, 0
    ideal_ratio = {'L2': 0.35, 'L3': 0.40, 'L4': 0.25}  # 理想比例
    
    for var in ['1.1', '1.2', '2.1', '2.2']:
        l2 = distribution[var]['L2']
        l3 = distribution[var]['L3']
        l4 = distribution[var]['L4']
        total = l2 + l3 + l4
        total_l2 += l2
        total_l3 += l3
        total_l4 += l4
        
        # 评价
        if 8 <= l2 <= 12 and 8 <= l3 <= 14 and 8 <= l4 <= 14:
            status = "均衡 ✅"
        elif total < 25:
            status = "偏少 ⚠️"
        else:
            status = "可接受"
        
        print(f"V{var:<7} {l2:>6} {l3:>6} {l4:>6} {total:>6} {status:>10}")
    
    print("-"*50)
    total = total_l2 + total_l3 + total_l4
    print(f"{'总计':<8} {total_l2:>6} {total_l3:>6} {total_l4:>6} {total:>6}")
    
    # 计算实际比例
    actual_ratio = {
        'L2': total_l2 / total,
        'L3': total_l3 / total,
        'L4': total_l4 / total
    }
    
    print(f"\n难度比例：")
    print(f"  L2: {actual_ratio['L2']*100:.1f}% (理想: {ideal_ratio['L2']*100:.0f}%)")
    print(f"  L3: {actual_ratio['L3']*100:.1f}% (理想: {ideal_ratio['L3']*100:.0f}%)")
    print(f"  L4: {actual_ratio['L4']*100:.1f}% (理想: {ideal_ratio['L4']*100:.0f}%)")
    
    # 评分
    ratio_diff = sum(abs(actual_ratio[k] - ideal_ratio[k]) for k in ideal_ratio)
    if ratio_diff < 0.2:
        score = 95
        status = "优秀 ✅"
    elif ratio_diff < 0.3:
        score = 85
        status = "良好 ⚠️"
    else:
        score = 75
        status = "需调整 ❌"
    
    print(f"\n评分: {score}/100 ({status})")
    return score

def check_weapons_config(questions):
    """检查杀手锏配置"""
    print("\n" + "="*60)
    print("四、杀手锏配置评估")
    print("="*60)
    
    # 统计武器配置
    weapons_count = defaultdict(int)
    weapons_by_var = defaultdict(lambda: defaultdict(int))
    
    for q in questions:
        meta = q.get('meta', {})
        weapons = meta.get('weapons', [])
        var_id = q.get('varId', '')
        
        for w in weapons:
            weapons_count[w] += 1
            weapons_by_var[var_id][w] += 1
    
    print(f"\n杀手锏分布：")
    
    expected_weapons = ['S-TRIG-01', 'S-TRIG-02', 'S-TRIG-03', 'S-TRIG-04', 'S-TRIG-05']
    
    for w in expected_weapons:
        count = weapons_count[w]
        status = "✅" if count >= 10 else ("⚠️" if count >= 5 else "❌")
        print(f"  {w}: {count}道 {status}")
    
    # 检查覆盖率
    questions_with_weapons = sum(1 for q in questions if q.get('meta', {}).get('weapons'))
    coverage = questions_with_weapons / len(questions) * 100
    
    print(f"\n武器标签覆盖率: {questions_with_weapons}/{len(questions)} = {coverage:.1f}%")
    
    # 评分
    if coverage >= 90:
        score = 95
        status = "优秀 ✅"
    elif coverage >= 70:
        score = 85
        status = "良好 ⚠️"
    else:
        score = 70
        status = "需改进 ❌"
    
    print(f"评分: {score}/100 ({status})")
    return score

def check_field_completeness(questions):
    """检查字段完整性"""
    print("\n" + "="*60)
    print("五、字段完整性评估")
    print("="*60)
    
    required_fields = ['id', 'problem', 'answer', 'level', 'source', 'varId', 'varName', 
                       'specId', 'specName', 'analysis', 'key_points', 'meta']
    
    optional_fields = ['tags', 'quality_score', 'data_source', 'variation']
    
    field_stats = defaultdict(lambda: {'filled': 0, 'empty': 0, 'missing': 0})
    
    for q in questions:
        for field in required_fields:
            value = q.get(field)
            if value is None:
                field_stats[field]['missing'] += 1
            elif isinstance(value, str) and value.strip() == '':
                field_stats[field]['empty'] += 1
            elif isinstance(value, (list, dict)) and len(value) == 0:
                field_stats[field]['empty'] += 1
            else:
                field_stats[field]['filled'] += 1
    
    print(f"\n必填字段完整性：")
    
    total_complete = 0
    for field in required_fields:
        filled = field_stats[field]['filled']
        ratio = filled / len(questions) * 100
        status = "✅" if ratio == 100 else ("⚠️" if ratio >= 90 else "❌")
        print(f"  {field}: {filled}/{len(questions)} ({ratio:.1f}%) {status}")
        if ratio == 100:
            total_complete += 1
    
    # 检查解析质量
    print(f"\n解析质量检查：")
    
    good_analysis = 0
    short_analysis = 0
    
    for q in questions:
        analysis = q.get('analysis', '')
        if len(analysis) >= 100:
            good_analysis += 1
        else:
            short_analysis += 1
    
    print(f"  详细解析(≥100字): {good_analysis}道")
    print(f"  简略解析(<100字): {short_analysis}道")
    
    # 检查答案格式
    print(f"\n答案格式检查：")
    
    good_answer = 0
    for q in questions:
        answer = q.get('answer', '')
        # 检查是否有LaTeX格式
        if '$' in answer or 'frac' in answer or 'sqrt' in answer or 'pi' in answer.lower():
            good_answer += 1
        elif any(c.isdigit() for c in answer) and len(answer) >= 3:
            good_answer += 1
    
    print(f"  格式规范答案: {good_answer}/{len(questions)} ({good_answer/len(questions)*100:.1f}%)")
    
    # 评分
    completeness = total_complete / len(required_fields) * 100
    analysis_quality = good_analysis / len(questions) * 100
    answer_quality = good_answer / len(questions) * 100
    
    overall = (completeness * 0.4 + analysis_quality * 0.3 + answer_quality * 0.3)
    
    if overall >= 90:
        score = 95
        status = "优秀 ✅"
    elif overall >= 80:
        score = 85
        status = "良好 ⚠️"
    else:
        score = 70
        status = "需改进 ❌"
    
    print(f"\n评分: {score}/100 ({status})")
    return score

def check_duplicates(questions):
    """检查重复题目"""
    print("\n" + "="*60)
    print("六、重复度检测")
    print("="*60)
    
    # 检查相似题目
    problems = {}
    duplicates = []
    
    for q in questions:
        problem = q.get('problem', '')
        # 简化题目文本用于比较
        simplified = problem.replace(' ', '').replace('$', '').replace('\\', '')
        
        if simplified in problems:
            duplicates.append((q['id'], problems[simplified]))
        else:
            problems[simplified] = q['id']
    
    if duplicates:
        print(f"\n发现 {len(duplicates)} 对可能重复的题目：")
        for id1, id2 in duplicates[:5]:
            print(f"  {id1} 与 {id2}")
    else:
        print(f"\n未发现完全重复的题目 ✅")
    
    # 评分
    if len(duplicates) == 0:
        score = 100
        status = "优秀 ✅"
    elif len(duplicates) <= 3:
        score = 90
        status = "良好 ⚠️"
    else:
        score = 75
        status = "需清理 ❌"
    
    print(f"\n评分: {score}/100 ({status})")
    return score

def main():
    print("="*60)
    print("M06.json 题库全面质量检查报告")
    print("="*60)
    
    data = load_data()
    questions = data.get('questions', [])
    
    print(f"\n题目总数: {len(questions)}")
    
    # 执行各项检查
    scores = {}
    scores['高考实战'] = check_source_quality(questions)
    scores['题型覆盖'] = check_topic_coverage(questions)
    scores['难度区分'] = check_difficulty_distribution(questions)
    scores['杀手锏配置'] = check_weapons_config(questions)
    scores['字段完整性'] = check_field_completeness(questions)
    scores['重复度'] = check_duplicates(questions)
    
    # 综合评分
    print("\n" + "="*60)
    print("综合评估报告")
    print("="*60)
    
    print(f"\n各维度评分：")
    total_score = 0
    for dim, score in scores.items():
        status = "✅" if score >= 90 else ("⚠️" if score >= 80 else "❌")
        print(f"  {dim}: {score}/100 {status}")
        total_score += score
    
    avg_score = total_score / len(scores)
    
    print(f"\n综合评分: {avg_score:.1f}/100")
    
    if avg_score >= 90:
        final_status = "优秀 - 题库质量达到很高水平，无需调整 ✅"
    elif avg_score >= 80:
        final_status = "良好 - 可进行小幅优化 ⚠️"
    else:
        final_status = "需改进 - 建议进行优化 ❌"
    
    print(f"最终评价: {final_status}")
    
    return avg_score

if __name__ == "__main__":
    main()
