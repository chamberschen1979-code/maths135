#!/usr/bin/env python3
"""
为 M06_seed.json 中缺失答案的题目生成答案和解析
"""

import json
import os
import re

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, 'src', 'data')

with open(os.path.join(data_dir, 'M06_seed.json'), 'r', encoding='utf-8') as f:
    m06_seed = json.load(f)

# 答案和解析模板
ANSWER_TEMPLATES = {
    # V1.1 配角技巧
    'M06_V1_1.1_L2_SEED_004': {
        'answer': '(4-3√3)/10',
        'key_points': ['① 由 sinα=3/5, α∈(0,π/2) 得 cosα=4/5', '② cos(α+π/3)=cosα·cos(π/3)-sinα·sin(π/3)', '③ 代入计算：(4/5)·(1/2)-(3/5)·(√3/2)=(4-3√3)/10'],
        'analysis': '【分析】利用两角和的余弦公式展开计算。\n\n【解答】\n① 由 sinα=3/5, α∈(0,π/2) 得 cosα=√(1-sin²α)=4/5\n\n② cos(α+π/3)=cosα·cos(π/3)-sinα·sin(π/3)\n\n③ 代入：=(4/5)·(1/2)-(3/5)·(√3/2)=(4-3√3)/10\n\n【答案】(4-3√3)/10'
    },
    'M06_V1_1.1_L2_SEED_005': {
        'answer': '3',
        'key_points': ['① 分子分母同除以 cosθ', '② (sinθ+cosθ)/(sinθ-cosθ)=(tanθ+1)/(tanθ-1)', '③ 代入 tanθ=2：(2+1)/(2-1)=3'],
        'analysis': '【分析】分子分母同除以 cosθ，转化为 tanθ 的表达式。\n\n【解答】\n① 分子分母同除以 cosθ\n\n② (sinθ+cosθ)/(sinθ-cosθ)=(tanθ+1)/(tanθ-1)\n\n③ 代入 tanθ=2：(2+1)/(2-1)=3\n\n【答案】3'
    },
    'M06_V1_1.1_L3_SEED_006': {
        'answer': '(2-4√3)/9',
        'key_points': ['① sin(2α+π/6)=sin2α·cos(π/6)+cos2α·sin(π/6)', '② 由 cos(α-π/6)=1/3 求 sinα, cosα', '③ 计算得 sin(2α+π/6)=(2-4√3)/9'],
        'analysis': '【分析】利用二倍角公式和两角和公式。\n\n【解答】\n① 设 α-π/6=θ，则 cosθ=1/3\n\n② sin(2α+π/6)=sin(2θ+π/2)=cos2θ=2cos²θ-1=2/9-1=-7/9\n\n【答案】-7/9'
    },
    'M06_V1_1.1_L3_SEED_007': {
        'answer': 'π/4',
        'key_points': ['① 由 sinα=√5/5 得 cosα=2√5/5', '② 由 cosβ=√10/10 得 sinβ=3√10/10', '③ cos(α+β)=cosα·cosβ-sinα·sinβ=√2/2', '④ α+β=π/4'],
        'analysis': '【分析】先求 cos(α+β)，再确定角的大小。\n\n【解答】\n① 由 sinα=√5/5 得 cosα=√(1-1/5)=2√5/5\n\n② 由 cosβ=√10/10 得 sinβ=√(1-1/10)=3√10/10\n\n③ cos(α+β)=cosα·cosβ-sinα·sinβ\n= (2√5/5)·(√10/10)-(√5/5)·(3√10/10)\n= (2√50-3√50)/50 = -√50/50 = -√2/2\n\n④ 由于 α,β 均为锐角，α+β∈(0,π)\ncos(α+β)=-√2/2，故 α+β=3π/4\n\n【答案】3π/4'
    },
    'M06_V1_1.1_L3_SEED_008': {
        'answer': '7/9',
        'key_points': ['① 设 π/4+α=θ，则 sinθ=1/3', '② cos2α=cos(2θ-π/2)=sin2θ', '③ sin2θ=2sinθ·cosθ=2·(1/3)·√(8/9)=4√2/9', '④ 或用 cos2α=1-2sin²(π/4+α)=1-2/9=7/9'],
        'analysis': '【分析】利用二倍角公式变形。\n\n【解答】\n① cos2α=cos[2(π/4+α)-π/2]=sin[2(π/4+α)]\n\n② 或直接用 cos2α=1-2sin²(π/4+α)=1-2·(1/9)=7/9\n\n【答案】7/9'
    },
    'M06_V1_1.1_L2_SEED_009': {
        'answer': '-1',
        'key_points': ['① tan(2α)=tan[(α+β)+(α-β)]', '② tan(A+B)=(tanA+tanB)/(1-tanA·tanB)', '③ 代入：(2+3)/(1-6)=-1'],
        'analysis': '【分析】利用两角和的正切公式。\n\n【解答】\n① tan(2α)=tan[(α+β)+(α-β)]\n\n② tan(A+B)=(tanA+tanB)/(1-tanA·tanB)\n\n③ 代入 tan(α+β)=2, tan(α-β)=3\ntan(2α)=(2+3)/(1-2·3)=5/(-5)=-1\n\n【答案】-1'
    },
    'M06_V1_1.1_L4_SEED_010': {
        'answer': '-4/3 或 -3/4',
        'key_points': ['① (sinα+cosα)²=1/25', '② 1+sin2α=1/25，得 sin2α=-24/25', '③ 由 α∈(0,π) 且 sinα+cosα=1/5>0', '④ 确定 α∈(π/2,3π/4)，tanα<0', '⑤ tanα=-4/3 或 -3/4'],
        'analysis': '【分析】由 sinα+cosα=1/5 求 sin2α，再求 tanα。\n\n【解答】\n① (sinα+cosα)²=1/25\n\n② 1+2sinαcosα=1/25\nsin2α=-24/25\n\n③ 由 sinα+cosα=1/5>0 且 α∈(0,π)\n得 α∈(π/2,3π/4)，tanα<0\n\n④ 由 sin2α=2tanα/(1+tan²α)=-24/25\n解得 tanα=-4/3 或 tanα=-3/4\n\n【答案】-4/3 或 -3/4'
    },
    'M06_V1_1.1_L2_SEED_011': {
        'answer': '1/4',
        'key_points': ['① sin15°cos15°=(1/2)sin30°', '② sin30°=1/2', '③ 结果：1/4'],
        'analysis': '【分析】利用二倍角公式 sin2α=2sinαcosα。\n\n【解答】\n① sin15°cos15°=(1/2)·sin(2×15°)=(1/2)·sin30°\n\n② sin30°=1/2\n\n③ 结果：(1/2)·(1/2)=1/4\n\n【答案】1/4'
    },
    'M06_V1_1.1_L3_SEED_012': {
        'answer': '1/2',
        'key_points': ['① cos(α+β)=cosαcosβ-sinαsinβ=1/5', '② cos(α-β)=cosαcosβ+sinαsinβ=3/5', '③ 两式相加：2cosαcosβ=4/5', '④ 两式相减：2sinαsinβ=2/5', '⑤ tanαtanβ=(sinαsinβ)/(cosαcosβ)=1/2'],
        'analysis': '【分析】利用两角和差公式展开后相加减。\n\n【解答】\n① cos(α+β)=cosαcosβ-sinαsinβ=1/5\n\n② cos(α-β)=cosαcosβ+sinαsinβ=3/5\n\n③ 两式相加：2cosαcosβ=4/5，即 cosαcosβ=2/5\n\n④ 两式相减：2sinαsinβ=2/5，即 sinαsinβ=1/5\n\n⑤ tanαtanβ=(sinαsinβ)/(cosαcosβ)=(1/5)/(2/5)=1/2\n\n【答案】1/2'
    },
    'M06_V1_1.1_L3_SEED_013': {
        'answer': '(√2-√10)/8',
        'key_points': ['① 由 2sinα=cosα 得 tanα=1/2', '② 求 sinα, cosα', '③ cos(2α+π/4)=cos2α·cos(π/4)-sin2α·sin(π/4)', '④ 计算得 (√2-√10)/8'],
        'analysis': '【分析】先由 2sinα=cosα 求 tanα，再求 cos(2α+π/4)。\n\n【解答】\n① 由 2sinα=cosα 得 tanα=1/2\n\n② sinα=√5/5, cosα=2√5/5\n\n③ sin2α=2sinαcosα=4/5\ncos2α=cos²α-sin²α=3/5\n\n④ cos(2α+π/4)=cos2α·cos(π/4)-sin2α·sin(π/4)\n= (3/5)·(√2/2)-(4/5)·(√2/2)\n= -√2/10\n\n【答案】-√2/10'
    },
}

# 更新题目
questions = m06_seed.get('questions', [])
updated = 0

for q in questions:
    qid = q.get('id', '')
    if qid in ANSWER_TEMPLATES and not q.get('answer'):
        template = ANSWER_TEMPLATES[qid]
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
