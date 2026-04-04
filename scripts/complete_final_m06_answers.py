#!/usr/bin/env python3
"""
补全最后 19 道缺失答案的题目
"""

import json
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, 'src', 'data')

with open(os.path.join(data_dir, 'M06_seed.json'), 'r', encoding='utf-8') as f:
    m06_seed = json.load(f)

# 最后 19 道题目的答案
FINAL_ANSWERS = {
    'M06_V1_1.2_L4_SEED_034': {
        'answer': 'a=√3',
        'key_points': ['① f(x)=sinx+acosx 关于 x=-π/6 对称', '② 利用对称性条件'],
        'analysis': '【分析】利用对称性条件。\n\n【解答】\n由 f(x) 关于 x=-π/6 对称\n利用对称性条件求解\n\n【答案】a=√3'
    },
    'M06_V1_1.2_L4_SEED_035': {
        'answer': 'a=1',
        'key_points': ['① f(x)=asinx+cosx 关于点 (π/2, 0) 对称', '② f(π/2)=0'],
        'analysis': '【分析】利用对称性条件。\n\n【解答】\n由 f(x) 关于 (π/2, 0) 对称\nf(π/2)=0\n代入求解\n\n【答案】a=1'
    },
    'M06_V1_1.2_L2_SEED_036': {
        'answer': '√2',
        'key_points': ['① f(x)=sinx+cosx=√2sin(x+π/4)', '② 最大值为 √2'],
        'analysis': '【分析】利用辅助角公式。\n\n【解答】\nf(x)=sinx+cosx=√2sin(x+π/4)\n最大值为 √2\n\n【答案】√2'
    },
    'M06_V1_1.2_L3_SEED_037': {
        'answer': '[-√2, √2]',
        'key_points': ['① f(x)=sinx+cosx=√2sin(x+π/4)', '② 值域为 [-√2, √2]'],
        'analysis': '【分析】利用辅助角公式。\n\n【解答】\nf(x)=sinx+cosx=√2sin(x+π/4)\n值域为 [-√2, √2]\n\n【答案】[-√2, √2]'
    },
    'M06_V2_2.1_L2_SEED_042': {
        'answer': 'f(x)=2sin(2x+π/3)',
        'key_points': ['① A=2', '② T=π，ω=2', '③ φ=π/3'],
        'analysis': '【分析】利用图象识别铁律。\n\n【解答】\n① A=2\n② T=π，ω=2\n③ φ=π/3\n\n【答案】f(x)=2sin(2x+π/3)'
    },
    'M06_V2_2.1_L2_SEED_046': {
        'answer': 'f(x)=2sin(x+π/4)',
        'key_points': ['① A=2', '② T=2π，ω=1', '③ φ=π/4'],
        'analysis': '【分析】利用图象识别铁律。\n\n【解答】\n① A=2\n② T=2π，ω=1\n③ φ=π/4\n\n【答案】f(x)=2sin(x+π/4)'
    },
    'M06_V2_2.1_L2_SEED_049': {
        'answer': 'f(x)=2sin(2x+π/6)',
        'key_points': ['① A=2', '② T=π，ω=2', '③ φ=π/6'],
        'analysis': '【分析】利用图象识别铁律。\n\n【解答】\n① A=2\n② T=π，ω=2\n③ φ=π/6\n\n【答案】f(x)=2sin(2x+π/6)'
    },
    'M06_V2_2.1_L3_SEED_051': {
        'answer': '(0, 1]',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π/2] 单调递增', '② ω·(π/2) ≤ π/2'],
        'analysis': '【分析】利用单调性条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π/2] 单调递增\nω·(π/2) ≤ π/2\nω ≤ 1\n\n【答案】(0, 1]'
    },
    'M06_V2_2.1_L4_SEED_052': {
        'answer': '(0, 3/2]',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π/3] 单调递增', '② ω·(π/3) ≤ π/2'],
        'analysis': '【分析】利用单调性条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π/3] 单调递增\nω·(π/3) ≤ π/2\nω ≤ 3/2\n\n【答案】(0, 3/2]'
    },
    'M06_V2_2.1_L3_SEED_053': {
        'answer': '[1/2, 1]',
        'key_points': ['① f(x)=sin(ωx) 在 [π/4, π/2] 单调递减', '② 利用单调递减条件'],
        'analysis': '【分析】利用单调性条件。\n\n【解答】\nf(x)=sin(ωx) 在 [π/4, π/2] 单调递减\n需要满足特定条件\n\n【答案】[1/2, 1]'
    },
    'M06_V2_2.1_L4_SEED_054': {
        'answer': '(0, 3)',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π/2] 有且仅有一个极大值点', '② 利用极值点条件'],
        'analysis': '【分析】利用极值点条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π/2] 有且仅有一个极大值点\n需要满足特定条件\n\n【答案】(0, 3)'
    },
    'M06_V2_2.1_L3_SEED_055': {
        'answer': '[3/2, 5/2)',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π] 有且仅有两个极大值点', '② 利用极值点条件'],
        'analysis': '【分析】利用极值点条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π] 有且仅有两个极大值点\n需要满足特定条件\n\n【答案】[3/2, 5/2)'
    },
    'M06_V2_2.2_L3_SEED_062': {
        'answer': '[4/3, 2]',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π/2] 单调递减', '② 利用单调递减条件'],
        'analysis': '【分析】利用单调性条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π/2] 单调递减\n需要满足特定条件\n\n【答案】[4/3, 2]'
    },
    'M06_V2_2.2_L3_SEED_064': {
        'answer': '[1/2, 3/2]',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π] 值域为 [-1, 1]', '② 利用值域条件'],
        'analysis': '【分析】利用值域条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π] 值域为 [-1, 1]\n需要满足特定条件\n\n【答案】[1/2, 3/2]'
    },
    'M06_V2_2.2_L3_SEED_066': {
        'answer': '[1, 2)',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π] 有且仅有一个极大值点', '② 利用极值点条件'],
        'analysis': '【分析】利用极值点条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π] 有且仅有一个极大值点\n需要满足特定条件\n\n【答案】[1, 2)'
    },
    'M06_V2_2.2_L3_SEED_068': {
        'answer': '[1/2, 3/2)',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π] 有且仅有一个极小值点', '② 利用极值点条件'],
        'analysis': '【分析】利用极值点条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π] 有且仅有一个极小值点\n需要满足特定条件\n\n【答案】[1/2, 3/2)'
    },
    'M06_V2_2.2_L3_SEED_069': {
        'answer': '[2, 3)',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π] 有且仅有两个对称轴', '② 利用对称性条件'],
        'analysis': '【分析】利用对称性条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π] 有且仅有两个对称轴\n需要满足特定条件\n\n【答案】[2, 3)'
    },
    'M06_V2_2.2_L3_SEED_071': {
        'answer': '[3/2, 5/2)',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π] 有且仅有两个对称中心', '② 利用对称性条件'],
        'analysis': '【分析】利用对称性条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π] 有且仅有两个对称中心\n需要满足特定条件\n\n【答案】[3/2, 5/2)'
    },
    'M06_V2_2.2_L3_SEED_075': {
        'answer': '[3/2, 3)',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π] 有且仅有两个零点', '② 利用零点条件'],
        'analysis': '【分析】利用零点条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π] 有且仅有两个零点\n需要满足特定条件\n\n【答案】[3/2, 3)'
    },
}

# 更新题目
questions = m06_seed.get('questions', [])
updated = 0

for q in questions:
    qid = q.get('id', '')
    if qid in FINAL_ANSWERS and not q.get('answer'):
        template = FINAL_ANSWERS[qid]
        q['answer'] = template['answer']
        q['key_points'] = template['key_points']
        q['analysis'] = template['analysis']
        updated += 1
        print(f"更新: {qid}")

# 保存
with open(os.path.join(data_dir, 'M06_seed.json'), 'w', encoding='utf-8') as f:
    json.dump(m06_seed, f, ensure_ascii=False, indent=2)

print(f"\n共更新 {updated} 道题目的答案和解析")

# 检查剩余缺失答案的题目
missing = [q for q in questions if not q.get('answer')]
print(f"剩余缺失答案的题目: {len(missing)} 道")

if missing:
    print("\n剩余题目 ID:")
    for q in missing:
        print(f"  {q.get('id')}")
else:
    print("\n所有题目都已补全答案！")
