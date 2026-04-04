#!/usr/bin/env python3
"""
补全 M06_seed.json 未匹配杀手锏的题目
"""

import json
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, 'src', 'data')

with open(os.path.join(data_dir, 'M06_seed.json'), 'r', encoding='utf-8') as f:
    m06_seed = json.load(f)

# 手动补充杀手锏映射
MANUAL_WEAPONS = {
    # V1.1 配角技巧
    'M06_V1_1.1_L4_SEED_003': ['S-TRIG-01'],  # sinα+cosα=1/5, 求tanα
    'M06_V1_1.1_L2_SEED_005': ['S-TRIG-01'],  # tanθ=2, 求(sinθ+cosθ)/(sinθ-cosθ)
    'M06_V1_1.1_L2_SEED_011': ['S-TRIG-01'],  # sin15°cos15°
    'M06_V1_1.1_L3_SEED_017': ['S-TRIG-01'],  # (cos10°-√3sin10°)/sin10°
    
    # V1.2 辅助角公式
    'M06_V1_1.2_L3_SEED_025': ['S-TRIG-01'],  # f(x)=sinx+acosx 关于点对称
    'M06_V1_1.2_L3_SEED_026': ['S-TRIG-01'],  # f(x)=√3sin2x-cos2x 单调区间
    'M06_V1_1.2_L3_SEED_029': ['S-TRIG-01'],  # f(x)=sinx+cosx 单调递增
    'M06_V1_1.2_L2_SEED_032': ['S-TRIG-01'],  # f(x)=cos²x-sin²x+2sinxcosx 最大值
    'M06_V1_1.2_L3_SEED_033': ['S-TRIG-01'],  # f(x)=asin x+bcos x 最大值
    
    # V2.1 图象识别 - 需要新杀手锏 S-TRIG-05
    'M06_V2_2.1_L2_SEED_043': ['S-TRIG-02', 'S-TRIG-05'],  # 图象求解析式
    'M06_V2_2.1_L3_SEED_050': ['S-TRIG-02', 'S-TRIG-05'],  # 零点距离求解析式
    'M06_V2_2.1_L3_SEED_056': ['S-TRIG-02', 'S-TRIG-05'],  # 最高点零点求解析式
}

# 更新杀手锏
questions = m06_seed.get('questions', [])
updated = 0

for q in questions:
    qid = q.get('id', '')
    if qid in MANUAL_WEAPONS:
        if 'meta' not in q:
            q['meta'] = {}
        q['meta']['weapons'] = MANUAL_WEAPONS[qid]
        updated += 1
        print(f"更新: {qid} -> {MANUAL_WEAPONS[qid]}")

# 保存
with open(os.path.join(data_dir, 'M06_seed.json'), 'w', encoding='utf-8') as f:
    json.dump(m06_seed, f, ensure_ascii=False, indent=2)

print(f"\n共更新 {updated} 道题目的杀手锏")

# 检查是否需要新建杀手锏
print("\n" + "=" * 70)
print("需要新建的杀手锏分析")
print("=" * 70)

# S-TRIG-05: 图象识别铁律
new_weapon = {
    "S-TRIG-05": {
        "coreLogic": "图象识别铁律：看最高点定A，看周期定ω，看零点/最值点定φ。口诀：'高点定A，周期定ω，特征点定φ'",
        "scenarios": [
            "由图象求解析式",
            "已知零点/最值点求参数",
            "图象特征与参数关系"
        ],
        "pitfalls": [
            "ω求错（周期判断错误）",
            "φ求错（特征点选择错误）",
            "忽略A的正负号"
        ],
        "example": {
            "question": "已知函数 f(x)=Asin(ωx+φ) (A>0, ω>0, |φ|<π/2) 的图象如图，最高点 (π/6, 2)，相邻最低点 (2π/3, -2)，求解析式。",
            "solution": "【分析】由最高点定A，由周期定ω，由特征点定φ。\n\n【解答】\n① 定A：最高点纵坐标为2，故A=2。\n\n② 定ω：相邻最高点与最低点横坐标差为T/2。\n T/2 = 2π/3 - π/6 = π/2\n ∴ T = π\n ω = 2π/T = 2\n\n③ 定φ：最高点对应 ωx+φ = π/2\n 2×(π/6) + φ = π/2\n φ = π/2 - π/3 = π/6\n\n④ 解析式：f(x) = 2sin(2x + π/6)\n\n【答案】f(x) = 2sin(2x + π/6)"
        }
    }
}

print("\n建议新建杀手锏:")
print(f"  S-TRIG-05: 图象识别铁律")
print(f"  核心逻辑: {new_weapon['S-TRIG-05']['coreLogic']}")
print(f"  适用场景: {new_weapon['S-TRIG-05']['scenarios']}")

# 保存新杀手锏到文件
with open(os.path.join(data_dir, 'new_weapon_s_trig_05.json'), 'w', encoding='utf-8') as f:
    json.dump(new_weapon, f, ensure_ascii=False, indent=2)

print(f"\n新杀手锏已保存到: new_weapon_s_trig_05.json")
