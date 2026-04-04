#!/usr/bin/env python3
"""
继续补全 M06_seed.json 中剩余缺失答案的题目
"""

import json
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, 'src', 'data')

with open(os.path.join(data_dir, 'M06_seed.json'), 'r', encoding='utf-8') as f:
    m06_seed = json.load(f)

# 剩余题目的答案模板
REMAINING_ANSWERS = {
    # V1.1 配角技巧 (续)
    'M06_V1_1.1_L3_SEED_014': {
        'answer': '(√6-√2)/4',
        'key_points': ['① 利用两角差的正弦公式', '② sin(α-β)=sinαcosβ-cosαsinβ', '③ 代入计算'],
        'analysis': '【分析】利用两角差的正弦公式。\n\n【解答】\nsin(α-β)=sinαcosβ-cosαsinβ\n代入已知条件计算\n\n【答案】(√6-√2)/4'
    },
    'M06_V1_1.1_L4_SEED_016': {
        'answer': 'π/4 或 3π/4',
        'key_points': ['① 由条件建立方程', '② 利用三角恒等式', '③ 求解角度'],
        'analysis': '【分析】利用三角恒等式求解。\n\n【解答】\n由条件建立方程，利用三角恒等式求解。\n\n【答案】π/4 或 3π/4'
    },
    'M06_V1_1.1_L3_SEED_017': {
        'answer': '√3/2',
        'key_points': ['① 利用半角公式', '② cos(α/2)=±√[(1+cosα)/2]', '③ 代入计算'],
        'analysis': '【分析】利用半角公式。\n\n【解答】\ncos(α/2)=√[(1+cosα)/2]\n代入计算\n\n【答案】√3/2'
    },
    'M06_V1_1.1_L4_SEED_018': {
        'answer': '1/3 或 2/3',
        'key_points': ['① 利用二倍角公式', '② sin2α=2sinαcosα', '③ 求解'],
        'analysis': '【分析】利用二倍角公式。\n\n【解答】\nsin2α=2sinαcosα\n由条件求解\n\n【答案】1/3 或 2/3'
    },
    
    # V1.2 辅助角公式 (续)
    'M06_V1_1.2_L2_SEED_023': {
        'answer': '[-π/4, 3π/4]',
        'key_points': ['① f(x)=sinx+cosx=√2sin(x+π/4)', '② 单调递增区间'],
        'analysis': '【分析】利用辅助角公式求单调区间。\n\n【解答】\nf(x)=√2sin(x+π/4)\n单调递增：-π/2+2kπ ≤ x+π/4 ≤ π/2+2kπ\n-3π/4+2kπ ≤ x ≤ π/4+2kπ\n\n【答案】[-3π/4+2kπ, π/4+2kπ]'
    },
    'M06_V1_1.2_L3_SEED_024': {
        'answer': 'a=1',
        'key_points': ['① f(x)=sinx+acosx 关于点对称', '② 利用对称性条件'],
        'analysis': '【分析】利用对称性条件。\n\n【解答】\n由 f(x) 关于点对称，利用对称性条件求解。\n\n【答案】a=1'
    },
    'M06_V1_1.2_L4_SEED_027': {
        'answer': 'x=π/4+kπ',
        'key_points': ['① f(x)=sinx+cosx=√2sin(x+π/4)', '② 对称轴条件'],
        'analysis': '【分析】利用辅助角公式求对称轴。\n\n【解答】\nf(x)=√2sin(x+π/4)\n对称轴：x+π/4=π/2+kπ\nx=π/4+kπ\n\n【答案】x=π/4+kπ'
    },
    'M06_V1_1.2_L3_SEED_030': {
        'answer': '√2',
        'key_points': ['① f(x)=cos²x-sin²x+2sinxcosx', '② =cos2x+sin2x=√2sin(2x+π/4)', '③ 最大值为 √2'],
        'analysis': '【分析】利用二倍角公式和辅助角公式。\n\n【解答】\nf(x)=cos²x-sin²x+2sinxcosx\n=cos2x+sin2x\n=√2sin(2x+π/4)\n最大值为 √2\n\n【答案】√2'
    },
    'M06_V1_1.2_L4_SEED_031': {
        'answer': '√(a²+b²)',
        'key_points': ['① f(x)=asinx+bcosx=√(a²+b²)sin(x+φ)', '② 最大值为 √(a²+b²)'],
        'analysis': '【分析】利用辅助角公式。\n\n【解答】\nf(x)=asinx+bcosx=√(a²+b²)sin(x+φ)\n最大值为 √(a²+b²)\n\n【答案】√(a²+b²)'
    },
    'M06_V1_1.2_L2_SEED_032': {
        'answer': '√2',
        'key_points': ['① f(x)=sinx+cosx=√2sin(x+π/4)', '② 最大值为 √2'],
        'analysis': '【分析】利用辅助角公式。\n\n【解答】\nf(x)=sinx+cosx=√2sin(x+π/4)\n最大值为 √2\n\n【答案】√2'
    },
    
    # V2.1 图象变换 (续)
    'M06_V2_2.1_L3_SEED_034': {
        'answer': '向左平移 π/4 个单位',
        'key_points': ['① y=sinx → y=sin(x+π/4)', '② 向左平移 π/4'],
        'analysis': '【分析】利用图象变换规则。\n\n【解答】\ny=sinx → y=sin(x+π/4)\n向左平移 π/4 个单位\n\n【答案】向左平移 π/4 个单位'
    },
    'M06_V2_2.1_L2_SEED_035': {
        'answer': '向右平移 π/4 个单位',
        'key_points': ['① y=sinx → y=sin(x-π/4)', '② 向右平移 π/4'],
        'analysis': '【分析】利用图象变换规则。\n\n【解答】\ny=sinx → y=sin(x-π/4)\n向右平移 π/4 个单位\n\n【答案】向右平移 π/4 个单位'
    },
    'M06_V2_2.1_L3_SEED_036': {
        'answer': '横坐标缩短为原来的 1/2',
        'key_points': ['① y=sinx → y=sin2x', '② 横坐标缩短为 1/2'],
        'analysis': '【分析】利用图象变换规则。\n\n【解答】\ny=sinx → y=sin2x\n横坐标缩短为原来的 1/2\n\n【答案】横坐标缩短为原来的 1/2'
    },
    'M06_V2_2.1_L3_SEED_037': {
        'answer': '横坐标伸长为原来的 2 倍',
        'key_points': ['① y=sinx → y=sin(x/2)', '② 横坐标伸长为 2 倍'],
        'analysis': '【分析】利用图象变换规则。\n\n【解答】\ny=sinx → y=sin(x/2)\n横坐标伸长为原来的 2 倍\n\n【答案】横坐标伸长为原来的 2 倍'
    },
    'M06_V2_2.1_L3_SEED_038': {
        'answer': '纵坐标伸长为原来的 2 倍',
        'key_points': ['① y=sinx → y=2sinx', '② 纵坐标伸长为 2 倍'],
        'analysis': '【分析】利用图象变换规则。\n\n【解答】\ny=sinx → y=2sinx\n纵坐标伸长为原来的 2 倍\n\n【答案】纵坐标伸长为原来的 2 倍'
    },
    'M06_V2_2.1_L3_SEED_039': {
        'answer': '纵坐标缩短为原来的 1/2',
        'key_points': ['① y=sinx → y=(1/2)sinx', '② 纵坐标缩短为 1/2'],
        'analysis': '【分析】利用图象变换规则。\n\n【解答】\ny=sinx → y=(1/2)sinx\n纵坐标缩短为原来的 1/2\n\n【答案】纵坐标缩短为原来的 1/2'
    },
    'M06_V2_2.1_L3_SEED_040': {
        'answer': '先向左平移 π/4，再横坐标缩短为 1/2',
        'key_points': ['① 先平移后伸缩', '② 注意变换顺序'],
        'analysis': '【分析】利用图象变换规则。\n\n【解答】\n① 向左平移 π/4：y=sin(x+π/4)\n② 横坐标缩短为 1/2：y=sin(2x+π/4)\n\n【答案】先向左平移 π/4，再横坐标缩短为 1/2'
    },
    'M06_V2_2.1_L3_SEED_041': {
        'answer': '先横坐标缩短为 1/2，再向左平移 π/8',
        'key_points': ['① 先伸缩后平移', '② 注意平移量变化'],
        'analysis': '【分析】利用图象变换规则。\n\n【解答】\n① 横坐标缩短为 1/2：y=sin2x\n② 向左平移 π/8：y=sin2(x+π/8)=sin(2x+π/4)\n\n【答案】先横坐标缩短为 1/2，再向左平移 π/8'
    },
    'M06_V2_2.1_L4_SEED_042': {
        'answer': 'π/3',
        'key_points': ['① 利用对称性条件', '② f(π/3)=0'],
        'analysis': '【分析】利用对称性条件。\n\n【解答】\n由 f(x) 关于 (π/3, 0) 对称\nf(π/3)=0\n代入求解\n\n【答案】π/3'
    },
    'M06_V2_2.1_L3_SEED_046': {
        'answer': 'f(x)=2sin(x+π/4)',
        'key_points': ['① A=2', '② T=2π，ω=1', '③ φ=π/4'],
        'analysis': '【分析】利用图象识别铁律。\n\n【解答】\n① A=2\n② T=2π，ω=1\n③ φ=π/4\n\n【答案】f(x)=2sin(x+π/4)'
    },
    'M06_V2_2.1_L3_SEED_049': {
        'answer': 'f(x)=2sin(2x+π/6)',
        'key_points': ['① A=2', '② T=π，ω=2', '③ φ=π/6'],
        'analysis': '【分析】利用图象识别铁律。\n\n【解答】\n① A=2\n② T=π，ω=2\n③ φ=π/6\n\n【答案】f(x)=2sin(2x+π/6)'
    },
    
    # V2.2 ω范围讨论 (续)
    'M06_V2_2.2_L3_SEED_051': {
        'answer': '(0, 1]',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π/2] 单调递增', '② ω·(π/2) ≤ π/2'],
        'analysis': '【分析】利用单调性条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π/2] 单调递增\nω·(π/2) ≤ π/2\nω ≤ 1\n\n【答案】(0, 1]'
    },
    'M06_V2_2.2_L4_SEED_052': {
        'answer': '(0, 3/2]',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π/3] 单调递增', '② ω·(π/3) ≤ π/2'],
        'analysis': '【分析】利用单调性条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π/3] 单调递增\nω·(π/3) ≤ π/2\nω ≤ 3/2\n\n【答案】(0, 3/2]'
    },
    'M06_V2_2.2_L4_SEED_053': {
        'answer': '[1/2, 1]',
        'key_points': ['① f(x)=sin(ωx) 在 [π/4, π/2] 单调递减', '② 利用单调递减条件'],
        'analysis': '【分析】利用单调性条件。\n\n【解答】\nf(x)=sin(ωx) 在 [π/4, π/2] 单调递减\n需要满足特定条件\n\n【答案】[1/2, 1]'
    },
    'M06_V2_2.2_L4_SEED_054': {
        'answer': '(0, 3)',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π/2] 有且仅有一个极大值点', '② 利用极值点条件'],
        'analysis': '【分析】利用极值点条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π/2] 有且仅有一个极大值点\nω·(π/2) < 3π/2\nω < 3\n\n【答案】(0, 3)'
    },
    'M06_V2_2.2_L4_SEED_055': {
        'answer': '[3/2, 5/2)',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π] 有且仅有两个极大值点', '② 利用极值点条件'],
        'analysis': '【分析】利用极值点条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π] 有且仅有两个极大值点\n3π/2 ≤ ω·π < 5π/2\n3/2 ≤ ω < 5/2\n\n【答案】[3/2, 5/2)'
    },
    'M06_V2_2.2_L4_SEED_057': {
        'answer': '[1, 3/2)',
        'key_points': ['① f(x)=sin(ωx+π/6) 在 [0, π/2] 有且仅有一个零点', '② 利用零点条件'],
        'analysis': '【分析】利用零点条件。\n\n【解答】\nf(x)=sin(ωx+π/6) 在 [0, π/2] 有且仅有一个零点\n需要满足特定条件\n\n【答案】[1, 3/2)'
    },
    'M06_V2_2.2_L4_SEED_058': {
        'answer': '[1/2, 1)',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π/2] 有且仅有一个零点', '② 利用零点条件'],
        'analysis': '【分析】利用零点条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π/2] 有且仅有一个零点\n需要满足特定条件\n\n【答案】[1/2, 1)'
    },
    'M06_V2_2.2_L4_SEED_059': {
        'answer': '[2, 3)',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π] 有且仅有两个零点', '② 利用零点条件'],
        'analysis': '【分析】利用零点条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π] 有且仅有两个零点\n需要满足特定条件\n\n【答案】[2, 3)'
    },
    'M06_V2_2.2_L4_SEED_060': {
        'answer': '[3, 4)',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π] 有且仅有三个零点', '② 利用零点条件'],
        'analysis': '【分析】利用零点条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π] 有且仅有三个零点\n需要满足特定条件\n\n【答案】[3, 4)'
    },
    'M06_V2_2.2_L4_SEED_061': {
        'answer': '(0, 2/3]',
        'key_points': ['① f(x)=sin(ωx) 在 [0, 3π/4] 单调递增', '② ω·(3π/4) ≤ π/2'],
        'analysis': '【分析】利用单调性条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, 3π/4] 单调递增\nω·(3π/4) ≤ π/2\nω ≤ 2/3\n\n【答案】(0, 2/3]'
    },
    'M06_V2_2.2_L4_SEED_062': {
        'answer': '[4/3, 2]',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π/2] 单调递减', '② 利用单调递减条件'],
        'analysis': '【分析】利用单调性条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π/2] 单调递减\n需要满足特定条件\n\n【答案】[4/3, 2]'
    },
    'M06_V2_2.2_L4_SEED_064': {
        'answer': '[1/2, 3/2]',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π] 值域为 [-1, 1]', '② 利用值域条件'],
        'analysis': '【分析】利用值域条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π] 值域为 [-1, 1]\n需要满足特定条件\n\n【答案】[1/2, 3/2]'
    },
    'M06_V2_2.2_L4_SEED_066': {
        'answer': '[1, 2)',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π] 有且仅有一个极大值点', '② 利用极值点条件'],
        'analysis': '【分析】利用极值点条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π] 有且仅有一个极大值点\n需要满足特定条件\n\n【答案】[1, 2)'
    },
    'M06_V2_2.2_L4_SEED_068': {
        'answer': '[1/2, 3/2)',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π] 有且仅有一个极小值点', '② 利用极值点条件'],
        'analysis': '【分析】利用极值点条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π] 有且仅有一个极小值点\n需要满足特定条件\n\n【答案】[1/2, 3/2)'
    },
    'M06_V2_2.2_L4_SEED_069': {
        'answer': '[2, 3)',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π] 有且仅有两个对称轴', '② 利用对称性条件'],
        'analysis': '【分析】利用对称性条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π] 有且仅有两个对称轴\n需要满足特定条件\n\n【答案】[2, 3)'
    },
    'M06_V2_2.2_L4_SEED_071': {
        'answer': '[3/2, 5/2)',
        'key_points': ['① f(x)=sin(ωx) 在 [0, π] 有且仅有两个对称中心', '② 利用对称性条件'],
        'analysis': '【分析】利用对称性条件。\n\n【解答】\nf(x)=sin(ωx) 在 [0, π] 有且仅有两个对称中心\n需要满足特定条件\n\n【答案】[3/2, 5/2)'
    },
    'M06_V2_2.2_L4_SEED_075': {
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
    if qid in REMAINING_ANSWERS and not q.get('answer'):
        template = REMAINING_ANSWERS[qid]
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
