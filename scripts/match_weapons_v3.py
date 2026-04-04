#!/usr/bin/env python3
"""
杀手锏匹配脚本 V3.0 - 精准实战版
原则：高考实战 > 模块归属，宁缺毋滥 > 全部匹配
规则：
1. 允许跨模块匹配
2. 使用精准场景匹配，而非泛泛关键词
3. 每道题最多匹配 0-2 个杀手锏
4. 匹配必须"实战有用"
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

# 杀手锏精准匹配规则
WEAPON_RULES = {
    'S-SET-01': {
        'name': '空集讨论',
        'keywords': ['A ⊆ B', 'A⊆B', '子集', '空集', 'A ∩ B = ∅'],
        'must_have': ['⊆', '子集', '空集'],
        'scenarios': ['集合包含关系', '集合参数问题'],
    },
    'S-FUNC-02': {
        'name': '同增异减',
        'keywords': ['复合函数', '单调性', '单调区间', '同增异减', '外层', '内层'],
        'must_have': ['单调', '复合'],
        'scenarios': ['复合函数单调性', 'log单调性'],
    },
    'S-FUNC-04': {
        'name': '零点个数=交点个数',
        'keywords': ['零点', '根的个数', '交点', 'f(x)=g(x)', '方程的根'],
        'must_have': ['零点', '根的个数', '交点'],
        'scenarios': ['零点问题', '方程根个数'],
    },
    'S-TRIG-02': {
        'name': '图象变换',
        'keywords': ['平移', '图象变换', '左加右减', '伸缩', '相位变换'],
        'must_have': ['平移', '变换', '伸缩'],
        'scenarios': ['三角函数图象变换'],
    },
    'S-VEC-04': {
        'name': '建系策略',
        'keywords': ['建系', '坐标系', '坐标法', '最值问题', '动点'],
        'must_have': ['建系', '坐标法', '最值'],
        'scenarios': ['向量模长最值', '动点问题'],
    },
    'S-SEQ-01': {
        'name': '下标和性质',
        'keywords': ['等差数列', '等比数列', '下标和', 'am+an', '片段和'],
        'must_have': ['等差', '等比', '数列'],
        'scenarios': ['数列性质', '片段和'],
    },
    'S-SEQ-04': {
        'name': '求和三法',
        'keywords': ['裂项', '错位相减', '并项', '求和', 'Sn'],
        'must_have': ['裂项', '错位', '并项', '求和'],
        'scenarios': ['数列求和'],
    },
    'S-GEO-02': {
        'name': '建系秒杀',
        'keywords': ['线面角', '二面角', '法向量', '立体几何', '建系'],
        'must_have': ['线面角', '二面角', '法向量', '立体几何'],
        'scenarios': ['立体几何计算'],
    },
    'S-GEO-03': {
        'name': '等体积法',
        'keywords': ['等体积', '点面距', '体积', '高'],
        'must_have': ['等体积', '点面距', '体积法'],
        'scenarios': ['点到面距离'],
    },
    'S-PROB-01': {
        'name': '概率树/全概率',
        'keywords': ['条件概率', '全概率', '贝叶斯', '概率树', '完备事件'],
        'must_have': ['条件概率', '全概率', '贝叶斯'],
        'scenarios': ['条件概率计算'],
    },
    'S-CONIC-02': {
        'name': '焦点三角形面积',
        'keywords': ['焦点三角形', 'PF1', 'PF2', 'tan(θ/2)', 'cot(θ/2)', '面积'],
        'must_have': ['焦点三角形', 'PF1', 'PF2'],
        'scenarios': ['焦点三角形问题'],
    },
    'S-DERIV-03': {
        'name': '含参讨论通法',
        'keywords': ['含参', '参数', '分类讨论', '单调区间', '极值点'],
        'must_have': ['含参', '参数讨论', '分类讨论'],
        'scenarios': ['含参函数单调性', '含参极值'],
    },
    'S-DERIV-04': {
        'name': '端点效应',
        'keywords': ['恒成立', '存在性', '端点', '必要条件', '探路'],
        'must_have': ['恒成立', '端点', '探路'],
        'scenarios': ['恒成立问题'],
    },
    'S-DERIV-09': {
        'name': '洛必达法则',
        'keywords': ['洛必达', '极限', '0/0', '∞/∞', '临界值'],
        'must_have': ['洛必达', '极限'],
        'scenarios': ['极限问题', '临界值'],
    },
    'S-DERIV-10': {
        'name': '极值点偏移(比值代换)',
        'keywords': ['极值点偏移', 'x1+x2', 'x1·x2', '比值代换', '双变量'],
        'must_have': ['极值点偏移', '双变量', 'x1', 'x2'],
        'scenarios': ['极值点偏移证明'],
    },
    'S-DERIV-11': {
        'name': '对数平均不等式',
        'keywords': ['对数平均', 'L(a,b)', '√(ab)', '(a-b)/(ln a - ln b)'],
        'must_have': ['对数平均'],
        'scenarios': ['极值点偏移', '双变量不等式'],
    },
    'S-CONIC-05': {
        'name': '仿射变换',
        'keywords': ['仿射', '椭圆变圆', '面积比', 'b/a'],
        'must_have': ['仿射', '椭圆变圆'],
        'scenarios': ['椭圆内接图形', '面积最值'],
    },
    'S-CONIC-06': {
        'name': '齐次化联立',
        'keywords': ['齐次化', '斜率关系', 'k1+k2', 'k1·k2', '过原点'],
        'must_have': ['齐次化', '斜率关系'],
        'scenarios': ['斜率关系证明'],
    },
    'S-CONIC-07': {
        'name': '参数方程',
        'keywords': ['参数方程', 'acosθ', 'bsinθ', '椭圆上点'],
        'must_have': ['参数方程', 'cosθ', 'sinθ'],
        'scenarios': ['椭圆上动点最值'],
    },
    'S-SEQ-08': {
        'name': '特征根法',
        'keywords': ['特征根', '递推', 'a_{n+2}', '线性递推'],
        'must_have': ['特征根', '递推'],
        'scenarios': ['二阶线性递推'],
    },
    'S-SEQ-09': {
        'name': '不动点法',
        'keywords': ['不动点', 'f(x)=x', '收敛', '周期性'],
        'must_have': ['不动点'],
        'scenarios': ['递推数列极限'],
    },
    'S-SEQ-10': {
        'name': '切线放缩',
        'keywords': ['切线放缩', 'e^x≥x+1', 'ln x≤x-1', '放缩'],
        'must_have': ['切线放缩', 'e^x', 'ln x'],
        'scenarios': ['数列不等式', '函数不等式'],
    },
    'S-INEQ-05': {
        'name': '琴生不等式',
        'keywords': ['琴生', '凸函数', '凹函数', '加权平均'],
        'must_have': ['琴生', '凸函数', '凹函数'],
        'scenarios': ['多变量不等式'],
    },
    'S-VEC-05': {
        'name': '极化恒等式',
        'keywords': ['极化恒等式', 'PA·PB', 'vec{PA}', 'vec{PB}', '数量积最值', 'PM²', 'AM²', '中点'],
        'must_have': ['PA', 'PB', '极化', '数量积最值', '中点'],
        'scenarios': ['定弦动点数量积'],
    },
    'S-FUNC-08': {
        'name': '复合零点(剥洋葱)',
        'keywords': ['f(f(x))', '复合零点', '剥洋葱', '嵌套'],
        'must_have': ['f(f(x))', '复合零点', '嵌套'],
        'scenarios': ['复合函数零点'],
    },
    'S-TRIG-01': {
        'name': '配角公式',
        'keywords': ['辅助角', 'asinx+bcosx', '配角', '√(a²+b²)'],
        'must_have': ['辅助角', 'asinx+bcosx', 'sinx', 'cosx'],
        'scenarios': ['三角函数化简', '三角函数最值'],
    },
    'S-TRIG-03': {
        'name': '化边为角',
        'keywords': ['化边为角', '正弦定理', '周长最值', '面积最值', 'sinB+sinC'],
        'must_have': ['化边为角', '周长最值', '面积最值'],
        'scenarios': ['三角形周长/面积最值'],
    },
    'S-TRI-04': {
        'name': '中线/角平分线',
        'keywords': ['中线', '角平分线', '面积法', '向量法'],
        'must_have': ['中线', '角平分线'],
        'scenarios': ['中线/角平分线问题'],
    },
    'S-VEC-01': {
        'name': '投影向量',
        'keywords': ['投影向量', '投影', '在...上的投影'],
        'must_have': ['投影向量', '在...上的投影'],
        'scenarios': ['向量投影问题'],
    },
    'S-SEQ-02': {
        'name': 'Sn最值(二次函数)',
        'keywords': ['Sn最大', 'Sn最小', '前n项和最值', '等差数列最值'],
        'must_have': ['Sn最值', '前n项和最值'],
        'scenarios': ['等差数列前n项和最值'],
    },
    'S-INEQ-02': {
        'name': '乘1法',
        'keywords': ['乘1法', '常数代换', 'x+y=1', '条件最值'],
        'must_have': ['乘1法', '常数代换'],
        'scenarios': ['条件最值问题'],
    },
    'S-FUNC-05': {
        'name': '双对称推周期',
        'keywords': ['双对称', '周期', '对称轴', '对称中心', 'T=2|a-b|'],
        'must_have': ['双对称', '周期'],
        'scenarios': ['抽象函数周期'],
    },
    'S-FUNC-06': {
        'name': '脱壳法',
        'keywords': ['脱壳法', 'f(A)>f(B)', '奇偶性', '单调性', '抽象不等式'],
        'must_have': ['脱壳', 'f(', '抽象不等式'],
        'scenarios': ['解抽象函数不等式'],
    },
    'S-INEQ-06': {
        'name': '柯西不等式',
        'keywords': ['柯西', '(a²+b²)(c²+d²)', 'ac+bd'],
        'must_have': ['柯西'],
        'scenarios': ['分式最值', '多变量不等式'],
    },
    'S-INEQ-07': {
        'name': '权方和不等式',
        'keywords': ['权方和', 'a²/x+b²/y'],
        'must_have': ['权方和'],
        'scenarios': ['分式最值'],
    },
    'S-INEQ-08': {
        'name': '赫尔德不等式',
        'keywords': ['赫尔德', 'Holder'],
        'must_have': ['赫尔德', 'Holder'],
        'scenarios': ['高阶不等式'],
    },
    'S-INEQ-09': {
        'name': '切比雪夫不等式',
        'keywords': ['切比雪夫', '同序和', '乱序和', '排序不等式'],
        'must_have': ['切比雪夫', '排序不等式'],
        'scenarios': ['排序不等式'],
    },
    'S-INEQ-10': {
        'name': '均值不等式链',
        'keywords': ['均值不等式', '调和平均', '几何平均', '算术平均', '平方平均'],
        'must_have': ['均值不等式', '调和平均', '平方平均'],
        'scenarios': ['多变量最值'],
    },
    'S-LOG-02': {
        'name': '指对同构',
        'keywords': ['同构', 'xe^x', 'ye^y', 'f(x)=f(y)'],
        'must_have': ['同构', 'xe^x'],
        'scenarios': ['指对混合方程', '同构比大小'],
    },
    'S-LOG-05': {
        'name': '对数平均不等式',
        'keywords': ['对数平均', '极值点偏移', '双变量', 'ln'],
        'must_have': ['对数平均', '极值点偏移'],
        'scenarios': ['极值点偏移', '双变量不等式'],
    },
}

def match_weapon_for_question(question, weapon_id, rule):
    """检查单个杀手锏是否匹配题目"""
    text = ''
    text += question.get('problem', '') + ' '
    text += question.get('analysis', '') + ' '
    text += ' '.join(question.get('key_points', [])) + ' '
    
    meta = question.get('meta', {})
    text += ' '.join(meta.get('core_logic', [])) + ' '
    text += ' '.join(meta.get('trap_tags', []))
    
    # 特殊处理：极化恒等式 - 必须是 PA·PB 类型的定弦动点问题
    if weapon_id == 'S-VEC-05':
        # 必须同时满足：1) 有 PA 或 PB 向量符号 2) 有数量积符号 3) 有动点或中点
        has_pa_pb = ('PA' in text or 'PB' in text or 'vec{PA}' in text or 'vec{PB}' in text)
        has_dot = '·' in text or '数量积' in text
        has_moving_or_midpoint = '动点' in text or '中点' in text
        
        if has_pa_pb and has_dot and has_moving_or_midpoint:
            return True, 3
        else:
            return False, 0  # 不满足条件直接返回不匹配
    
    # 检查必须包含的关键词
    must_have = rule.get('must_have', [])
    match_count = 0
    for kw in must_have:
        if kw in text:
            match_count += 1
    
    # 至少匹配1个必须关键词
    if match_count == 0:
        return False, 0
    
    # 检查所有关键词
    keywords = rule.get('keywords', [])
    keyword_matches = sum(1 for kw in keywords if kw in text)
    
    # 需要至少匹配2个关键词
    if keyword_matches < 2:
        return False, 0
    
    return True, keyword_matches

def match_weapons_for_question(question):
    """为题目匹配杀手锏"""
    matches = []
    
    for weapon_id, rule in WEAPON_RULES.items():
        is_match, score = match_weapon_for_question(question, weapon_id, rule)
        if is_match:
            matches.append((weapon_id, score))
    
    # 按分数排序，取前2个
    matches.sort(key=lambda x: -x[1])
    return [m[0] for m in matches[:2]]

def process_module(module_file, module_name):
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
            variation_weapons = set()
            
            for question in variation.get('original_pool', []):
                stats['total_questions'] += 1
                
                # 匹配杀手锏
                matched_weapons = match_weapons_for_question(question)
                
                # 更新题目的 weapons 字段
                if 'meta' not in question:
                    question['meta'] = {}
                question['meta']['weapons'] = matched_weapons
                
                # 收集 variation 的杀手锏
                for w in matched_weapons:
                    variation_weapons.add(w)
                
                # 统计
                if matched_weapons:
                    stats['questions_with_weapons'] += 1
                    for w in matched_weapons:
                        stats['weapon_usage'][w] += 1
                else:
                    stats['questions_without_weapons'].append(question.get('id', 'unknown'))
            
            # 更新 toolkit.linked_weapons
            if variation_weapons:
                if 'toolkit' not in variation:
                    variation['toolkit'] = {}
                variation['toolkit']['linked_weapons'] = list(variation_weapons)
    
    # 保存
    save_json(module_file, data)
    
    # 打印统计
    print(f"\n统计结果:")
    print(f"  总题目数: {stats['total_questions']}")
    print(f"  有杀手锏的题目: {stats['questions_with_weapons']}")
    print(f"  无杀手锏的题目: {len(stats['questions_without_weapons'])}")
    print(f"\n杀手锏使用频次:")
    for weapon_id, count in sorted(stats['weapon_usage'].items(), key=lambda x: -x[1]):
        weapon_name = WEAPON_RULES.get(weapon_id, {}).get('name', '未知')
        print(f"  {weapon_id} ({weapon_name}): {count} 次")
    
    return stats

def main():
    print("="*60)
    print("杀手锏匹配脚本 V3.0 - 精准实战版")
    print("原则: 高考实战 > 模块归属，宁缺毋滥 > 全部匹配")
    print("="*60)
    
    # 处理 M04
    m04_stats = process_module('M04.json', 'M04 - 指对数函数与运算')
    
    # 处理 M05
    m05_stats = process_module('M05.json', 'M05 - 平面向量')
    
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
        weapon_name = WEAPON_RULES.get(weapon_id, {}).get('name', '未知')
        print(f"  {weapon_id} ({weapon_name}): {count} 次")
    
    # 找出未使用的杀手锏
    unused_weapons = set(WEAPON_RULES.keys()) - set(all_weapon_usage.keys())
    if unused_weapons:
        print(f"\n未使用的杀手锏 ({len(unused_weapons)} 个):")
        for w in sorted(unused_weapons):
            weapon_name = WEAPON_RULES.get(w, {}).get('name', '未知')
            print(f"  {w} ({weapon_name})")

if __name__ == '__main__':
    main()
