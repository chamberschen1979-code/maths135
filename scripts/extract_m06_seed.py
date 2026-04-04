#!/usr/bin/env python3
"""
从 M06.json 提取种子题，创建 M06_seed.json 和 M06_seed.md
"""

import json
import re
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / 'src' / 'data'

def clean_latex(text):
    """清理 LaTeX 格式"""
    if not text:
        return ""
    # 替换 $ 为行内公式
    text = text.replace('$', '')
    return text.strip()

def extract_m06_questions():
    """从 M06.json 提取题目"""
    with open(DATA_DIR / 'M06.json', 'r', encoding='utf-8') as f:
        m06 = json.load(f)
    
    questions = []
    seed_counter = 1
    
    for specialty in m06.get('specialties', []):
        spec_id = specialty.get('spec_id', '')
        
        for variation in specialty.get('variations', []):
            var_id = variation.get('var_id', '')
            var_name = variation.get('name', '')
            
            # 从 master_benchmarks 提取标杆题
            for mb in variation.get('master_benchmarks', []):
                level = mb.get('level', 'L2')
                problem = mb.get('problem', '')
                analysis = mb.get('analysis', {})
                
                # 生成 ID
                qid = f"M06_{spec_id}_{var_id}_{level}_SEED_{seed_counter:03d}"
                seed_counter += 1
                
                # 提取答案
                answer = analysis.get('conclusion', '')
                
                # 提取关键步骤
                key_steps = analysis.get('key_steps', [])
                key_points = [clean_latex(s) for s in key_steps if s]
                
                # 提取陷阱
                pitfalls = analysis.get('common_pitfalls', [])
                trap_tags = [clean_latex(p) for p in pitfalls if p]
                
                question = {
                    "id": qid,
                    "data_source": "original",
                    "source": mb.get('id', ''),
                    "problem": clean_latex(problem),
                    "answer": clean_latex(answer),
                    "key_points": key_points,
                    "level": level,
                    "tags": [level],
                    "quality_score": 95,
                    "meta": {
                        "core_logic": key_points,
                        "trap_tags": trap_tags,
                        "weapons": []
                    },
                    "variation": {
                        "var_id": var_id,
                        "name": var_name
                    }
                }
                questions.append(question)
            
            # 从 original_pool 提取原始题
            for orig in variation.get('original_pool', []):
                level = orig.get('level', 'L2')
                desc = orig.get('desc', '')
                
                # 生成 ID
                qid = f"M06_{spec_id}_{var_id}_{level}_SEED_{seed_counter:03d}"
                seed_counter += 1
                
                question = {
                    "id": qid,
                    "data_source": "original",
                    "source": desc.split(']')[0] + ']' if ']' in desc else '',
                    "problem": clean_latex(desc),
                    "answer": "",
                    "key_points": [],
                    "level": level,
                    "tags": [level],
                    "quality_score": 85,
                    "meta": {
                        "core_logic": [],
                        "trap_tags": [],
                        "weapons": []
                    },
                    "variation": {
                        "var_id": var_id,
                        "name": var_name
                    }
                }
                questions.append(question)
    
    return questions

def create_seed_json(questions):
    """创建 M06_seed.json"""
    data = {
        "motif_id": "M06",
        "motif_name": "三角函数基础",
        "description": "M06 种子题库 - 从标杆库和原始库提炼",
        "total_questions": len(questions),
        "created_at": "2026-03-27",
        "questions": questions
    }
    
    with open(DATA_DIR / 'M06_seed.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"创建 M06_seed.json: {len(questions)} 道题目")

def create_seed_md(questions):
    """创建 M06_seed.md"""
    md_content = """# M06 种子题库

**模块**: 三角函数基础  
**题目数量**: {total} 道  
**创建时间**: 2026-03-27

---

## 题目列表

""".format(total=len(questions))
    
    # 按变式分组
    by_variation = {}
    for q in questions:
        var_key = f"V{q['variation']['var_id']} - {q['variation']['name']}"
        if var_key not in by_variation:
            by_variation[var_key] = []
        by_variation[var_key].append(q)
    
    for var_name, var_questions in by_variation.items():
        md_content += f"### {var_name}\n\n"
        
        for q in var_questions:
            md_content += f"#### {q['id']}\n\n"
            md_content += f"- **难度**: {q['level']}\n"
            md_content += f"- **来源**: {q['source']}\n"
            md_content += f"- **题目**: {q['problem']}\n"
            
            if q['answer']:
                md_content += f"- **答案**: {q['answer']}\n"
            
            if q['key_points']:
                md_content += f"- **关键步骤**:\n"
                for kp in q['key_points']:
                    md_content += f"  - {kp}\n"
            
            if q['meta'].get('trap_tags'):
                md_content += f"- **常见陷阱**:\n"
                for trap in q['meta']['trap_tags']:
                    md_content += f"  - {trap}\n"
            
            md_content += "\n---\n\n"
    
    with open(DATA_DIR / 'M06_seed.md', 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print(f"创建 M06_seed.md: {len(questions)} 道题目")

def main():
    print("提取 M06 种子题...")
    questions = extract_m06_questions()
    
    # 统计
    level_counts = {}
    for q in questions:
        level = q['level']
        level_counts[level] = level_counts.get(level, 0) + 1
    
    print(f"\n难度分布:")
    for level, count in sorted(level_counts.items()):
        print(f"  {level}: {count} 道")
    
    create_seed_json(questions)
    create_seed_md(questions)

if __name__ == '__main__':
    main()
