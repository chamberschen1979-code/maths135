#!/usr/bin/env python3
"""
将新杀手锏 S-TRIG-05 添加到 weapon_details.json
"""

import json
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, 'src', 'data')

# 读取现有武器
with open(os.path.join(data_dir, 'weapon_details.json'), 'r', encoding='utf-8') as f:
    weapons = json.load(f)

# 新杀手锏
new_weapon = {
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
        "question": "（L3）已知函数 f(x)=Asin(ωx+φ) (A>0, ω>0, |φ|<π/2) 的图象如图，最高点 (π/6, 2)，相邻最低点 (2π/3, -2)，求解析式。",
        "solution": "【分析】由最高点定A，由周期定ω，由特征点定φ。\n\n【解答】\n① 定A：最高点纵坐标为2，故A=2。\n\n② 定ω：相邻最高点与最低点横坐标差为T/2。\n T/2 = 2π/3 - π/6 = π/2\n ∴ T = π\n ω = 2π/T = 2\n\n③ 定φ：最高点对应 ωx+φ = π/2\n 2×(π/6) + φ = π/2\n φ = π/2 - π/3 = π/6\n\n④ 解析式：f(x) = 2sin(2x + π/6)\n\n【关键突破】图象识别三步走：高点定A，周期定ω，特征点定φ。\n\n【答案】f(x) = 2sin(2x + π/6)"
    }
}

# 添加新武器
weapons['S-TRIG-05'] = new_weapon

# 保存
with open(os.path.join(data_dir, 'weapon_details.json'), 'w', encoding='utf-8') as f:
    json.dump(weapons, f, ensure_ascii=False, indent=2)

print(f"已添加新杀手锏 S-TRIG-05 到 weapon_details.json")
print(f"当前武器总数: {len(weapons)}")

# 删除临时文件
temp_file = os.path.join(data_dir, 'new_weapon_s_trig_05.json')
if os.path.exists(temp_file):
    os.remove(temp_file)
    print(f"已删除临时文件: new_weapon_s_trig_05.json")
