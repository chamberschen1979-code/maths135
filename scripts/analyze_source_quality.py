import json

def analyze_source_quality(file_path, module_name):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    questions = []
    for s in data.get('specialties', []):
        for v in s.get('variations', []):
            for q in v.get('original_pool', []):
                q['var_id'] = v.get('var_id', '')
                q['var_name'] = v.get('name', '')
                questions.append(q)
    
    # 分类统计
    unknown_source = []
    known_source = []
    
    for q in questions:
        source = q.get('source', '')
        if source == '未知来源' or not source:
            unknown_source.append(q)
        else:
            known_source.append(q)
    
    print(f"\n{'='*70}")
    print(f"{module_name} 来源质量分析")
    print(f"{'='*70}")
    
    print(f"\n【来源分布】")
    print(f"  总题数: {len(questions)}")
    print(f"  未知来源: {len(unknown_source)} ({len(unknown_source)/len(questions)*100:.1f}%)")
    print(f"  有来源: {len(known_source)} ({len(known_source)/len(questions)*100:.1f}%)")
    
    # 分析未知来源题目的质量
    print(f"\n【未知来源题目质量】")
    if unknown_source:
        with_answer = sum(1 for q in unknown_source if q.get('answer'))
        with_analysis = sum(1 for q in unknown_source if q.get('analysis'))
        with_key_points = sum(1 for q in unknown_source if q.get('key_points'))
        
        print(f"  有答案: {with_answer}/{len(unknown_source)} ({with_answer/len(unknown_source)*100:.1f}%)")
        print(f"  有解析: {with_analysis}/{len(unknown_source)} ({with_analysis/len(unknown_source)*100:.1f}%)")
        print(f"  有关键点: {with_key_points}/{len(unknown_source)} ({with_key_points/len(unknown_source)*100:.1f}%)")
        
        # 难度分布
        levels = {}
        for q in unknown_source:
            level = q.get('level', 'L2')
            levels[level] = levels.get(level, 0) + 1
        print(f"  难度分布: {levels}")
        
        # 显示前5个未知来源题目
        print(f"\n  未知来源题目示例:")
        for q in unknown_source[:5]:
            problem = q.get('problem', '')[:50]
            print(f"    - {q.get('id')}: {problem}...")
    else:
        print(f"  无未知来源题目")
    
    # 分析有来源题目的质量
    print(f"\n【有来源题目质量】")
    if known_source:
        with_answer = sum(1 for q in known_source if q.get('answer'))
        with_analysis = sum(1 for q in known_source if q.get('analysis'))
        with_key_points = sum(1 for q in known_source if q.get('key_points'))
        
        print(f"  有答案: {with_answer}/{len(known_source)} ({with_answer/len(known_source)*100:.1f}%)")
        print(f"  有解析: {with_analysis}/{len(known_source)} ({with_analysis/len(known_source)*100:.1f}%)")
        print(f"  有关键点: {with_key_points}/{len(known_source)} ({with_key_points/len(known_source)*100:.1f}%)")
        
        # 难度分布
        levels = {}
        for q in known_source:
            level = q.get('level', 'L2')
            levels[level] = levels.get(level, 0) + 1
        print(f"  难度分布: {levels}")
        
        # 来源统计
        sources = {}
        for q in known_source:
            source = q.get('source', '')
            # 提取年份
            if source:
                sources[source] = sources.get(source, 0) + 1
        
        print(f"\n  来源分布 (前10):")
        for source, count in sorted(sources.items(), key=lambda x: -x[1])[:10]:
            print(f"    {source}: {count} 题")
    
    return {
        'total': len(questions),
        'unknown': len(unknown_source),
        'known': len(known_source)
    }

# 分析 M04
m04_stats = analyze_source_quality('M04.json', 'M04 (指对数函数)')

# 分析 M05
m05_stats = analyze_source_quality('M05.json', 'M05 (平面向量)')

# 总结
print(f"\n{'='*70}")
print(f"总结")
print(f"{'='*70}")
print(f"\nM04: 未知来源 {m04_stats['unknown']}/{m04_stats['total']} ({m04_stats['unknown']/m04_stats['total']*100:.1f}%)")
print(f"M05: 未知来源 {m05_stats['unknown']}/{m05_stats['total']} ({m05_stats['unknown']/m05_stats['total']*100:.1f}%)")
