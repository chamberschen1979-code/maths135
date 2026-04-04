#!/usr/bin/env python3
"""
M04 全量多源题目合并脚本
功能：从 M04-旧版.json 的所有来源（original_pool + master_benchmarks）提取题目，合并到新版
"""

import json
import re
from pathlib import Path
from datetime import datetime

# 文件路径
OLD_FILE = '/Users/mac/Downloads/高中数学/数学无忧/M04-旧版.json'
NEW_FILE = '/Users/mac/Downloads/高中数学/数学无忧/src/data/M04.json'
OUTPUT_JSON = '/Users/mac/Downloads/高中数学/数学无忧/src/data/M04_full.json'
OUTPUT_MD = '/Users/mac/Downloads/高中数学/数学无忧/src/data/M04_Master_RAG_full.md'

def load_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_existing_ids(new_data):
    """收集新版中所有现有题目 ID"""
    existing = set()
    for spec in new_data.get('specialties', []):
        for var in spec.get('variations', []):
            for q in var.get('original_pool', []):
                if q.get('id'):
                    existing.add(q['id'])
            for q in var.get('master_benchmarks', []):
                if q.get('id'):
                    existing.add(q['id'])
    return existing

def clean_question(q_data, var_info):
    """清洗题目数据，只保留教学标签"""
    cleaned = {
        'id': q_data.get('id', ''),
        'source': q_data.get('source', q_data.get('desc', '')),
        'level': q_data.get('level', 'L3'),
        'problem': q_data.get('problem', q_data.get('desc', '')),
        'answer': q_data.get('answer', ''),
        'key_points': '',
        'tags': ['真题', '合并入库'],
        'meta': {}
    }
    
    # 提取 key_points
    if q_data.get('key_points'):
        cleaned['key_points'] = q_data['key_points']
    elif q_data.get('analysis'):
        analysis = q_data['analysis']
        if isinstance(analysis, dict):
            if analysis.get('key_steps'):
                cleaned['key_points'] = '\n'.join(analysis['key_steps'])
            elif analysis.get('core_idea'):
                cleaned['key_points'] = analysis['core_idea']
        elif isinstance(analysis, str):
            cleaned['key_points'] = analysis
    
    # 提取 logic_key
    if q_data.get('logic_key'):
        cleaned['meta']['logic_key'] = q_data['logic_key']
    
    # 提取 meta 标签
    meta = q_data.get('meta', {})
    if meta.get('core_logic'):
        cleaned['meta']['core_logic'] = meta['core_logic']
    if meta.get('trap_risk'):
        trap_risk = meta['trap_risk']
        if trap_risk == 'high':
            cleaned['meta']['trap_tags'] = ['定义域陷阱', '漏解风险']
        elif trap_risk == 'medium':
            cleaned['meta']['trap_tags'] = ['需注意边界']
        else:
            cleaned['meta']['trap_tags'] = []
    if meta.get('recommended_strategy'):
        cleaned['meta']['strategy_hint'] = meta['recommended_strategy']
    
    # 添加变例级武器
    if var_info.get('weapons'):
        cleaned['meta']['weapons'] = var_info['weapons']
    
    return cleaned

def extract_all_questions_from_old(old_data):
    """从旧版提取所有题目（original_pool + master_benchmarks）"""
    all_questions = []
    stats = {
        'original_pool': 0,
        'master_benchmarks': 0
    }
    
    for spec in old_data.get('specialties', []):
        spec_id = spec.get('spec_id', '')
        spec_name = spec.get('spec_name', spec.get('name', ''))
        
        for var in spec.get('variations', []):
            var_id = var.get('var_id', '')
            var_name = var.get('name', '')
            
            # 提取变例级信息
            var_info = {
                'spec_id': spec_id,
                'spec_name': spec_name,
                'var_id': var_id,
                'var_name': var_name,
                'logic_core': var.get('logic_core', ''),
                'weapons': [],
                'weapon_note': ''
            }
            
            toolkit = var.get('toolkit', {})
            if toolkit.get('linked_weapons'):
                var_info['weapons'] = toolkit['linked_weapons']
            if toolkit.get('weapon_map_note'):
                var_info['weapon_note'] = toolkit['weapon_map_note']
            
            # 提取 original_pool
            for q in var.get('original_pool', []):
                q['var_id'] = var_id
                q['spec_id'] = spec_id
                all_questions.append({
                    'source_type': 'original_pool',
                    'var_info': var_info,
                    'data': q
                })
                stats['original_pool'] += 1
            
            # 提取 master_benchmarks
            for q in var.get('master_benchmarks', []):
                q['var_id'] = var_id
                q['spec_id'] = spec_id
                all_questions.append({
                    'source_type': 'master_benchmarks',
                    'var_info': var_info,
                    'data': q
                })
                stats['master_benchmarks'] += 1
    
    return all_questions, stats

def merge_questions(new_data, old_questions, existing_ids):
    """合并题目到新版"""
    new_count = 0
    duplicate_count = 0
    tag_updated_count = 0
    
    # 建立变例映射
    var_map = {}
    for spec in new_data.get('specialties', []):
        spec_id = spec.get('spec_id', '')
        for var in spec.get('variations', []):
            var_id = var.get('var_id', '')
            key = f"{spec_id}_{var_id}"
            var_map[key] = {
                'spec': spec,
                'var': var
            }
    
    for item in old_questions:
        q_data = item['data']
        var_info = item['var_info']
        source_type = item['source_type']
        
        # 生成或获取 ID
        q_id = q_data.get('id', '')
        if not q_id:
            # 生成 ID
            level = q_data.get('level', 'L3')
            var_id = var_info['var_id']
            q_id = f"M04_{var_id}_{level}_OLD_{hash(str(q_data)) % 10000:04d}"
        
        # 检查是否已存在
        if q_id in existing_ids:
            duplicate_count += 1
            continue
        
        # 清洗题目
        cleaned = clean_question(q_data, var_info)
        cleaned['id'] = q_id
        cleaned['source_type'] = source_type
        
        # 找到目标变例
        var_key = f"{var_info['spec_id']}_{var_info['var_id']}"
        if var_key in var_map:
            target_var = var_map[var_key]['var']
            
            # 添加到 original_pool
            if 'original_pool' not in target_var:
                target_var['original_pool'] = []
            target_var['original_pool'].append(cleaned)
            
            # 添加变例级信息（如果不存在）
            if not target_var.get('logic_core') and var_info.get('logic_core'):
                target_var['logic_core'] = var_info['logic_core']
            if not target_var.get('toolkit') and var_info.get('weapons'):
                target_var['toolkit'] = {
                    'linked_weapons': var_info['weapons'],
                    'weapon_map_note': var_info.get('weapon_note', '')
                }
            
            new_count += 1
            existing_ids.add(q_id)
        else:
            # 无法匹配的题目，报告出来
            print(f"⚠️ 无法匹配变例: {var_key} | 题目: {q_id}")
    
    return new_count, duplicate_count, tag_updated_count

def generate_markdown(new_data):
    """生成 Markdown 文件"""
    lines = [
        "# 📘 M04 指对数函数 RAG 种子库 (Full Edition)",
        "",
        "<!--",
        "元数据说明：",
        "- core_logic: 核心思维方法标签",
        "- trap_tags: 陷阱风险标签",
        "- weapons: 杀手锏武器 ID",
        "- strategy_hint: 解题策略提示",
        "-->",
        "",
        f"> 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        ""
    ]
    
    for spec in new_data.get('specialties', []):
        spec_id = spec.get('spec_id', '')
        spec_name = spec.get('spec_name', spec.get('name', ''))
        
        lines.append(f"## Specialty {spec_id}: {spec_name}")
        lines.append("")
        
        for var in spec.get('variations', []):
            var_id = var.get('var_id', '')
            var_name = var.get('name', '')
            logic_core = var.get('logic_core', '')
            toolkit = var.get('toolkit', {})
            weapons = toolkit.get('linked_weapons', [])
            weapon_note = toolkit.get('weapon_map_note', '')
            
            lines.append(f"### Variation {var_id}: {var_name}")
            
            if logic_core:
                lines.append(f"> **逻辑核心**: {logic_core[:150]}...")
            if weapons:
                lines.append(f"> **杀手锏**: {', '.join(weapons)}")
            if weapon_note:
                lines.append(f"> **武器说明**: {weapon_note}")
            lines.append("")
            
            # 按 level 分组
            pool = var.get('original_pool', [])
            levels = {}
            for q in pool:
                lvl = q.get('level', 'L3')
                if lvl not in levels:
                    levels[lvl] = []
                levels[lvl].append(q)
            
            for level in ['L2', 'L3', 'L4']:
                if level in levels:
                    lines.append(f"#### 【{level} 级别】")
                    lines.append("")
                    
                    for i, q in enumerate(levels[level], 1):
                        problem = q.get('problem', q.get('desc', ''))
                        answer = q.get('answer', '')
                        key_points = q.get('key_points', '')
                        score = q.get('score_estimate', 90)
                        meta = q.get('meta', {})
                        
                        lines.append(f"{i}. **题目 ({q.get('source', '未知来源')})**: {problem[:200]}...")
                        lines.append(f"   - **答案**: {answer[:100]}...")
                        if key_points:
                            lines.append(f"   - **解析要点**: {key_points[:150]}...")
                        lines.append(f"   - **质量评分**: {score}")
                        if meta.get('core_logic'):
                            lines.append(f"   - **核心逻辑**: {', '.join(meta['core_logic'])}")
                        if meta.get('trap_tags'):
                            lines.append(f"   - **陷阱标签**: {', '.join(meta['trap_tags'])}")
                        lines.append("")
            
            lines.append("")
    
    return '\n'.join(lines)

def main():
    print("🚀 开始全量多源题目合并...")
    
    # 1. 加载文件
    print("\n📖 加载文件...")
    old_data = load_json(OLD_FILE)
    new_data = load_json(NEW_FILE)
    
    # 2. 收集现有 ID
    print("\n🔍 收集现有题目 ID...")
    existing_ids = get_existing_ids(new_data)
    print(f"  - 现有题目: {len(existing_ids)} 道")
    
    # 3. 提取旧版所有题目
    print("\n📦 提取旧版所有题目...")
    old_questions, old_stats = extract_all_questions_from_old(old_data)
    print(f"  - original_pool: {old_stats['original_pool']} 题")
    print(f"  - master_benchmarks: {old_stats['master_benchmarks']} 题")
    print(f"  - 旧版总计: {len(old_questions)} 题")
    
    # 4. 合并题目
    print("\n🔄 合并题目...")
    new_count, duplicate_count, tag_updated = merge_questions(new_data, old_questions, existing_ids)
    print(f"  - 新增题目: {new_count} 题")
    print(f"  - 重复跳过: {duplicate_count} 题")
    
    # 5. 统计最终结果
    print("\n📊 最终统计:")
    total_questions = 0
    level_dist = {'L2': 0, 'L3': 0, 'L4': 0}
    
    for spec in new_data.get('specialties', []):
        for var in spec.get('variations', []):
            pool = var.get('original_pool', [])
            total_questions += len(pool)
            for q in pool:
                lvl = q.get('level', 'L3')
                if lvl in level_dist:
                    level_dist[lvl] += 1
    
    print(f"  - 最终总题数: {total_questions}")
    print(f"  - 难度分布: L2={level_dist['L2']}, L3={level_dist['L3']}, L4={level_dist['L4']}")
    
    # 6. 保存文件
    print("\n💾 保存文件...")
    save_json(OUTPUT_JSON, new_data)
    print(f"  - JSON: {OUTPUT_JSON}")
    
    md_content = generate_markdown(new_data)
    with open(OUTPUT_MD, 'w', encoding='utf-8') as f:
        f.write(md_content)
    print(f"  - Markdown: {OUTPUT_MD}")
    
    # 7. 验证抽样
    print("\n📋 验证抽样:")
    sample_count = 0
    for spec in new_data.get('specialties', []):
        for var in spec.get('variations', []):
            for q in var.get('original_pool', []):
                if q.get('source_type') == 'master_benchmarks' and sample_count < 2:
                    print(f"\n  【标杆库样例 {sample_count + 1}】")
                    print(f"  ID: {q.get('id')}")
                    print(f"  题目: {q.get('problem', '')[:80]}...")
                    print(f"  核心逻辑: {q.get('meta', {}).get('core_logic', [])}")
                    sample_count += 1
    
    sample_count = 0
    for spec in new_data.get('specialties', []):
        for var in spec.get('variations', []):
            for q in var.get('original_pool', []):
                if q.get('source_type') == 'original_pool' and sample_count < 2:
                    print(f"\n  【常规池样例 {sample_count + 1}】")
                    print(f"  ID: {q.get('id')}")
                    print(f"  题目: {q.get('problem', '')[:80]}...")
                    print(f"  核心逻辑: {q.get('meta', {}).get('core_logic', [])}")
                    sample_count += 1
    
    print("\n✅ 全量合并完成！")

if __name__ == "__main__":
    main()
