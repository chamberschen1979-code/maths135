#!/usr/bin python3
"""
优化 M05 杀手锏匹配 - 去除冗余的 S-VEC-04
原则：如果题目可以通过极化恒等式（S-VEC-05）秒杀，就只保留 S-VEC-05，去掉 S-VEC-04
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / 'src' / 'data'

def can_solve_by_polarization(problem_text, analysis_text):
    """
    判断题目是否可以通过极化恒等式秒杀
    条件：
    1. 有 PA 或 PB 向量
    2. 有数量积符号（·）
    3. 有动点或中点
    4. 是定值问题或最值问题
    """
    text = problem_text + ' ' + analysis_text
    
    # 必须有 PA 或 PB
    has_pa_pb = 'PA' in text or 'PB' in text or 'vec{PA}' in text or 'vec{PB}' in text
    
    # 必须有数量积
    has_dot = '·' in text or '数量积' in text
    
    # 必须有动点或中点
    has_moving = '动点' in text or '中点' in text
    
    # 是定值或最值问题
    is_optimization = '定值' in text or '最值' in text or '最大值' in text or '最小值' in text or '范围' in text
    
    return has_pa_pb and has_dot and has_moving


def optimize_m05():
    # 读取 M05.json
    with open(DATA_DIR / 'M05.json', 'r', encoding='utf-8') as f:
        m05 = json.load(f)
    
    optimized_count = 0
    
    for specialty in m05.get('specialties', []):
        for variation in specialty.get('variations', []):
            for question in variation.get('original_pool', []):
                weapons = question.get('meta', {}).get('weapons', [])
                
                # 检查是否同时有 S-VEC-05 和 S-VEC-04
                if 'S-VEC-05' in weapons and 'S-VEC-04' in weapons:
                    problem_text = question.get('problem', '')
                    analysis_text = question.get('analysis', '')
                    
                    # 判断是否可以通过极化恒等式秒杀
                    if can_solve_by_polarization(problem_text, analysis_text):
                        # 只保留 S-VEC-05，去掉 S-VEC-04
                        new_weapons = [w for w in weapons if w != 'S-VEC-04']
                        question['meta']['weapons'] = new_weapons
                        optimized_count += 1
                        print(f"优化: {question.get('id')} - 去掉 S-VEC-04")
    
    # 保存
    with open(DATA_DIR / 'M05.json', 'w', encoding='utf-8') as f:
        json.dump(m05, f, ensure_ascii=False, indent=2)
    
    print(f"\n优化完成！共优化 {optimized_count} 道题目")

if __name__ == '__main__':
    optimize_m05()
