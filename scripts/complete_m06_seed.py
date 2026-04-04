#!/usr/bin/env python3
"""
补全 M06_seed.json 中缺失的字段
参考 M05.json 的格式
"""

import json
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, 'src', 'data')

# 读取文件
with open(os.path.join(data_dir, 'M06_seed.json'), 'r', encoding='utf-8') as f:
    m06_seed = json.load(f)

with open(os.path.join(data_dir, 'weapon_details.json'), 'r', encoding='utf-8') as f:
    weapons = json.load(f)

# 三角函数武器映射规则
TRIG_WEAPONS = {
    'S-TRIG-01': {
        'name': '配角公式',
        'keywords': ['α+', 'α-', 'α+β', 'α-β', '2α', '配角', 'sin(', 'cos('],
        'scenarios': ['给值求值', '角的线性组合']
    },
    'S-TRIG-02': {
        'name': '图象变换铁律',
        'keywords': ['平移', '变换', '图象', 'φ', '相位', '左加右减', 'ω'],
        'scenarios': ['图象平移', '相位变换']
    },
    'S-TRIG-03': {
        'name': '化边为角',
        'keywords': ['周长', '面积', '最值', '三角形', 'sinB', 'sinC'],
        'scenarios': ['三角形周长最值', '面积最值']
    },
    'S-TRIG-04': {
        'name': 'ω范围讨论',
        'keywords': ['ω', '周期', '单调区间', '对称轴', '零点个数', '值域'],
        'scenarios': ['ω取值范围', '单调性讨论']
    },
    'S-TRIG-05': {
        'name': '图象识别铁律',
        'keywords': ['图象', '最高点', '最低点', '零点', '解析式'],
        'scenarios': ['由图象求解析式', '已知零点/最值点求参数']
    },
}

def match_weapon(problem):
    """匹配杀手锏"""
    text = problem
    matches = []
    
    for weapon_id, weapon_info in TRIG_WEAPONS.items():
        keyword_matches = sum(1 for kw in weapon_info['keywords'] if kw in text)
        if keyword_matches >= 1:
            matches.append((weapon_id, keyword_matches))
    
    matches.sort(key=lambda x: -x[1])
    return [m[0] for m in matches[:2]]

def get_strategy_hint(problem):
    """获取策略提示"""
    if 'ω' in problem or '周期' in problem:
        return 'ω范围讨论'
    elif '平移' in problem or '变换' in problem:
        return '图象变换铁律'
    elif 'α+' in problem or 'α-' in problem:
        return '配角技巧'
    elif 'sin' in problem and 'cos' in problem:
        return '辅助角公式'
    return '公式应用'

# 补全字段
questions = m06_seed.get('questions', [])

for q in questions:
    # 补充 specId/specName/varId/varName
    var_info = q.get('variation', {})
    var_id = var_info.get('var_id', '')
    var_name = var_info.get('name', '')
    
    q['varId'] = var_id
    q['varName'] = var_name
    
    # 根据 var_id 确定 specId/specName
    if var_id.startswith('1.'):
        q['specId'] = 'V1'
        q['specName'] = '恒等变换与结构的艺术'
    else:
        q['specId'] = 'V2'
        q['specName'] = '图象变换与性质探索'
    
    # 补充杀手锏
    if 'meta' not in q:
        q['meta'] = {}
    
    if not q['meta'].get('weapons'):
        q['meta']['weapons'] = match_weapon(q.get('problem', ''))
    
    # 补充 strategy_hint
    if not q['meta'].get('strategy_hint'):
        q['meta']['strategy_hint'] = get_strategy_hint(q.get('problem', ''))
    
    # 补充 analysis（如果有 key_points）
    if not q.get('analysis') and q.get('key_points'):
        kp = q['key_points']
        analysis = "【分析】\n\n【解答】\n"
        for step in kp:
            analysis += f"{step}\n"
        if q.get('answer'):
            analysis += f"\n【答案】{q['answer']}"
        q['analysis'] = analysis

# 保存
with open(os.path.join(data_dir, 'M06_seed.json'), 'w', encoding='utf-8') as f:
    json.dump(m06_seed, f, ensure_ascii=False, indent=2)

print(f"补全完成！共处理 {len(questions)} 道题目")

# 统计武器匹配
weapon_stats = {}
for q in questions:
    for w in q.get('meta', {}).get('weapons', []):
        weapon_stats[w] = weapon_stats.get(w, 0) + 1

print(f"\n杀手锏匹配统计:")
for w, count in sorted(weapon_stats.items(), key=lambda x: -x[1]):
    wname = TRIG_WEAPONS.get(w, {}).get('name', w)
    print(f"  {w} ({wname}): {count} 题")

# 检查未匹配的题目
no_weapon = [q for q in questions if not q.get('meta', {}).get('weapons')]
if no_weapon:
    print(f"\n未匹配杀手锏的题目 ({len(no_weapon)} 题)")
    for qid in no_weapon:
        print(f"  {qid}")
else:
    print(f"\n所有题目都已匹配杀手锏！")
