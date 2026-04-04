#!/usr/bin/env python3
"""
杀手锏匹配脚本 V2.0 - 实战版
原则：高考实战 > 模块归属，宁缺毋滥 > 全部匹配
规则：
1. 允许跨模块匹配
2. 关键词匹配阈值 ≥2
3. 每道题最多匹配 0-2 个杀手锏
"""

import json
import re
from pathlib import Path
from collections import defaultdict

DATA_DIR = Path(__file__).parent.parent / 'src' / 'data'

def load_json(filename):
    with open(DATA_DIR / filename, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(filename, data):
    with open(DATA_DIR / filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def extract_keywords_from_weapon(weapon_data):
    """从杀手锏数据中提取关键词"""
    keywords = set()
    
    # 从 coreLogic 提取
    core_logic = weapon_data.get('coreLogic', '')
    keywords.update(extract_math_keywords(core_logic))
    
    # 从 scenarios 提取
    for scenario in weapon_data.get('scenarios', []):
        keywords.update(extract_math_keywords(scenario))
    
    # 从 pitfalls 提取
    for pitfall in weapon_data.get('pitfalls', []):
        keywords.update(extract_math_keywords(pitfall))
    
    # 从 example.question 提取
    example = weapon_data.get('example', {})
    question = example.get('question', '')
    keywords.update(extract_math_keywords(question))
    
    return keywords

def extract_math_keywords(text):
    """从文本中提取数学关键词"""
    keywords = set()
    
    # 核心方法关键词（权重高）
    method_keywords = [
        '换底公式', '链式', '同构', '极值点偏移', '对数平均',
        '辅助角', '配角', '化边为角', '正弦定理', '余弦定理',
        '建系', '等体积', '投影', '极化恒等式', '数量积',
        '裂项', '错位相减', '并项', '下标和', '特征根', '不动点',
        '切线放缩', '琴生', '柯西', '权方和', '均值不等式',
        '端点效应', '洛必达', '比值代换', '脱壳法', '剥洋葱',
        '双对称', '周期', '奇偶性', '单调性',
        '焦点三角形', '离心率', '渐近线', '仿射变换', '齐次化', '参数方程',
        'SSA', '中线', '角平分线', '面积法',
        '概率树', '全概率', '贝叶斯',
        '空集', '子集', '端点验证',
        '复数模', '几何意义',
        '定义域', '值域', '零点', '交点',
        '最大值', '最小值', '最值',
        '恒成立', '存在性',
    ]
    
    for kw in method_keywords:
        if kw in text:
            keywords.add(kw)
    
    # 数学概念关键词
    concept_keywords = [
        '对数', '指数', 'log', 'ln', 'lg',
        '向量', '投影', '数量积', '夹角',
        '椭圆', '双曲线', '抛物线', '圆锥曲线',
        '等差数列', '等比数列', '数列',
        '导数', '极值', '单调',
        '三角函数', '正弦', '余弦', '正切',
        '三角形', '解三角形',
        '不等式', '基本不等式',
        '函数', '复合函数', '抽象函数',
        '集合', '复数',
        '概率', '条件概率',
    ]
    
    for kw in concept_keywords:
        if kw in text.lower() or kw in text:
            keywords.add(kw)
    
    # 特殊结构关键词
    structure_keywords = [
        'xe^x', 'ye^y', '同构',
        'f(f(x))', '复合零点',
        'x₁+x₂', 'x₁·x₂', '双变量',
        'tan(θ/2)', 'cot(θ/2)',
        'a·b', '数量积',
    ]
    
    for kw in structure_keywords:
        if kw in text:
            keywords.add(kw)
    
    return keywords

def extract_keywords_from_question(question):
    """从题目中提取关键词"""
    keywords = set()
    
    # 从 problem 提取
    problem = question.get('problem', '')
    keywords.update(extract_math_keywords(problem))
    
    # 从 analysis 提取
    analysis = question.get('analysis', '')
    keywords.update(extract_math_keywords(analysis))
    
    # 从 key_points 提取
    for kp in question.get('key_points', []):
        keywords.update(extract_math_keywords(kp))
    
    # 从 meta.core_logic 提取
    meta = question.get('meta', {})
    for cl in meta.get('core_logic', []):
        keywords.update(extract_math_keywords(cl))
    
    # 从 trap_tags 提取
    for trap in meta.get('trap_tags', []):
        keywords.update(extract_math_keywords(trap))
    
    return keywords

def calculate_match_score(question_keywords, weapon_keywords):
    """计算匹配分数（交集数量）"""
    return len(question_keywords & weapon_keywords)

def match_weapons_for_question(question, weapon_keywords_map, threshold=2):
    """为单道题目匹配杀手锏"""
    question_keywords = extract_keywords_from_question(question)
    
    if not question_keywords:
        return []
    
    # 计算每个杀手锏的匹配分数
    matches = []
    for weapon_id, weapon_keywords in weapon_keywords_map.items():
        score = calculate_match_score(question_keywords, weapon_keywords)
        if score >= threshold:
            matches.append((weapon_id, score))
    
    # 按分数排序，取前2个
    matches.sort(key=lambda x: -x[1])
    return [m[0] for m in matches[:2]]

def process_module(module_file, weapon_keywords_map, module_name):
    """处理单个模块"""
    print(f"\n{'='*60}")
    print(f"处理模块: {module_name}")
    print(f"{'='*60}")
    
    data = load_json(module_file)
    
    stats = {
        'total_questions': 0,
        'questions_with_weapons': 0,
        'weapon_usage': defaultdict(int),
        'questions_without_weapons': [],
    }
    
    for specialty in data.get('specialties', []):
        for variation in specialty.get('variations', []):
            for question in variation.get('original_pool', []):
                stats['total_questions'] += 1
                
                # 匹配杀手锏
                matched_weapons = match_weapons_for_question(
                    question, weapon_keywords_map
                )
                
                # 更新题目的 weapons 字段
                if 'meta' not in question:
                    question['meta'] = {}
                question['meta']['weapons'] = matched_weapons
                
                # 更新 toolkit.linked_weapons
                if 'toolkit' not in variation:
                    variation['toolkit'] = {}
                variation['toolkit']['linked_weapons'] = list(set(
                    variation['toolkit'].get('linked_weapons', []) + matched_weapons
                ))
                
                # 统计
                if matched_weapons:
                    stats['questions_with_weapons'] += 1
                    for w in matched_weapons:
                        stats['weapon_usage'][w] += 1
                else:
                    stats['questions_without_weapons'].append(question.get('id', 'unknown'))
    
    # 保存
    save_json(module_file, data)
    
    # 打印统计
    print(f"\n统计结果:")
    print(f"  总题目数: {stats['total_questions']}")
    print(f"  有杀手锏的题目: {stats['questions_with_weapons']}")
    print(f"  无杀手锏的题目: {len(stats['questions_without_weapons'])}")
    print(f"\n杀手锏使用频次:")
    for weapon_id, count in sorted(stats['weapon_usage'].items(), key=lambda x: -x[1]):
        print(f"  {weapon_id}: {count} 次")
    
    return stats

def main():
    print("="*60)
    print("杀手锏匹配脚本 V2.0 - 实战版")
    print("原则: 高考实战 > 模块归属，宁缺毋滥 > 全部匹配")
    print("="*60)
    
    # 加载杀手锏
    weapons = load_json('weapon_details.json')
    print(f"\n加载杀手锏: {len(weapons)} 个")
    
    # 构建杀手锏关键词映射
    weapon_keywords_map = {}
    for weapon_id, weapon_data in weapons.items():
        keywords = extract_keywords_from_weapon(weapon_data)
        weapon_keywords_map[weapon_id] = keywords
        print(f"  {weapon_id}: {len(keywords)} 个关键词")
    
    # 处理 M04
    m04_stats = process_module('M04.json', weapon_keywords_map, 'M04 - 指对数函数与运算')
    
    # 处理 M05
    m05_stats = process_module('M05.json', weapon_keywords_map, 'M05 - 平面向量')
    
    # 总结
    print("\n" + "="*60)
    print("总结")
    print("="*60)
    print(f"M04: {m04_stats['questions_with_weapons']}/{m04_stats['total_questions']} 题有杀手锏")
    print(f"M05: {m05_stats['questions_with_weapons']}/{m05_stats['total_questions']} 题有杀手锏")
    
    # 合并杀手锏使用统计
    all_weapon_usage = defaultdict(int)
    for w, c in m04_stats['weapon_usage'].items():
        all_weapon_usage[w] += c
    for w, c in m05_stats['weapon_usage'].items():
        all_weapon_usage[w] += c
    
    print(f"\n杀手锏总使用频次（跨模块）:")
    for weapon_id, count in sorted(all_weapon_usage.items(), key=lambda x: -x[1]):
        print(f"  {weapon_id}: {count} 次")
    
    # 找出未使用的杀手锏
    unused_weapons = set(weapons.keys()) - set(all_weapon_usage.keys())
    if unused_weapons:
        print(f"\n未使用的杀手锏 ({len(unused_weapons)} 个):")
        for w in sorted(unused_weapons):
            print(f"  {w}")

if __name__ == '__main__':
    main()
