#!/usr/bin/env python3
"""
M04 数据迁移脚本
功能：从 M04-旧版.json 提取教学标签，注入到 M04.json 和 M04_Master_RAG.md
"""

import json
import re
from pathlib import Path

# 文件路径
OLD_FILE = '/Users/mac/Downloads/高中数学/数学无忧/M04-旧版.json'
NEW_FILE = '/Users/mac/Downloads/高中数学/数学无忧/src/data/M04.json'
MD_FILE = '/Users/mac/Downloads/高中数学/数学无忧/src/data/M04_Master_RAG.md'

def load_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def extract_old_data(old_data):
    """从旧版数据中提取教学标签"""
    extracted = {
        'variations': {},
        'questions': {}
    }
    
    for spec in old_data.get('specialties', []):
        spec_id = spec.get('spec_id', '')
        
        for var in spec.get('variations', []):
            var_id = var.get('var_id', '')
            full_var_id = f"{spec_id}_{var_id}"
            
            # 提取变例级别的标签
            var_info = {
                'logic_core': var.get('logic_core', ''),
                'weapons': [],
                'weapon_note': ''
            }
            
            # 提取 toolkit
            toolkit = var.get('toolkit', {})
            if toolkit.get('linked_weapons'):
                var_info['weapons'] = toolkit['linked_weapons']
            if toolkit.get('weapon_map_note'):
                var_info['weapon_note'] = toolkit['weapon_map_note']
            
            extracted['variations'][full_var_id] = var_info
            
            # 提取题目级别的标签
            for q in var.get('original_pool', []):
                desc = q.get('desc', '')
                level = q.get('level', 'L3')
                
                # 生成题目 ID
                q_id = f"M04_{var_id}_{level}_{desc[:20]}"
                
                q_meta = q.get('meta', {})
                
                question_info = {
                    'var_id': var_id,
                    'level': level,
                    'desc': desc,
                    'core_logic': q_meta.get('core_logic', []),
                    'trap_risk': q_meta.get('trap_risk', 'low'),
                    'strategy': q_meta.get('recommended_strategy', ''),
                    'weapons': var_info['weapons'],
                    'weapon_note': var_info['weapon_note']
                }
                
                # 使用 desc 的 hash 作为 key（因为旧版没有 ID）
                key = f"{var_id}_{level}_{hash(desc) % 10000}"
                extracted['questions'][key] = question_info
    
    return extracted

def match_questions(new_data, extracted):
    """匹配新旧题目并注入标签"""
    match_count = 0
    
    for spec in new_data.get('specialties', []):
        spec_id = spec.get('spec_id', '')
        
        for var in spec.get('variations', []):
            var_id = var.get('var_id', '')
            full_var_id = f"{spec_id}_{var_id}"
            
            # 注入变例级别的标签
            var_info = extracted['variations'].get(full_var_id, {})
            if var_info.get('logic_core'):
                var['logic_core'] = var_info['logic_core']
            if var_info.get('weapons'):
                if 'toolkit' not in var:
                    var['toolkit'] = {}
                var['toolkit']['linked_weapons'] = var_info['weapons']
                var['toolkit']['weapon_map_note'] = var_info.get('weapon_note', '')
            
            # 匹配题目
            for q in var.get('original_pool', []):
                q_level = q.get('level', 'L3')
                q_problem = q.get('problem', '') or q.get('desc', '')
                
                # 尝试匹配
                for key, old_q in extracted['questions'].items():
                    if old_q['var_id'] == var_id and old_q['level'] == q_level:
                        # 检查内容相似度
                        old_desc = old_q.get('desc', '')
                        if old_desc and q_problem:
                            # 简单匹配：检查是否有共同关键词
                            if any(kw in q_problem for kw in ['log', 'ln', 'lg', '对数', '指数'] if kw in old_desc):
                                # 注入标签
                                if 'meta' not in q:
                                    q['meta'] = {}
                                
                                if old_q.get('core_logic'):
                                    q['meta']['core_logic'] = old_q['core_logic']
                                
                                if old_q.get('trap_risk'):
                                    trap_risk = old_q['trap_risk']
                                    # 转换为标签
                                    if trap_risk == 'high':
                                        q['meta']['trap_tags'] = ['定义域陷阱', '漏解风险']
                                    elif trap_risk == 'medium':
                                        q['meta']['trap_tags'] = ['需注意边界']
                                    else:
                                        q['meta']['trap_tags'] = []
                                
                                if old_q.get('strategy'):
                                    q['meta']['strategy_hint'] = old_q['strategy']
                                
                                if old_q.get('weapons'):
                                    q['meta']['weapons'] = old_q['weapons']
                                
                                match_count += 1
                                break
            
            # 同样处理 master_benchmarks
            for q in var.get('master_benchmarks', []):
                q_level = q.get('level', 'L3')
                
                for key, old_q in extracted['questions'].items():
                    if old_q['var_id'] == var_id and old_q['level'] == q_level:
                        if 'meta' not in q:
                            q['meta'] = {}
                        
                        if old_q.get('core_logic'):
                            q['meta']['core_logic'] = old_q['core_logic']
                        
                        if old_q.get('trap_risk'):
                            trap_risk = old_q['trap_risk']
                            if trap_risk == 'high':
                                q['meta']['trap_tags'] = ['定义域陷阱', '漏解风险']
                            elif trap_risk == 'medium':
                                q['meta']['trap_tags'] = ['需注意边界']
                            else:
                                q['meta']['trap_tags'] = []
                        
                        if old_q.get('weapons'):
                            q['meta']['weapons'] = old_q['weapons']
                        
                        break
    
    return match_count

def update_markdown(md_file, new_data):
    """更新 Markdown 文件，注入教学标签"""
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 在文件开头添加元数据块
    header = """# 📘 M04 指对数函数 RAG 种子库 (Master Edition)

<!--
元数据说明：
- core_logic: 核心思维方法标签
- trap_tags: 陷阱风险标签
- weapons: 杀手锏武器 ID
- strategy_hint: 解题策略提示
-->

"""
    
    # 如果没有元数据说明，添加它
    if '元数据说明' not in content:
        content = content.replace('# 📘 M04 指对数函数 RAG 种子库 (Master Edition)', header, 1)
    
    # 为每个变例添加逻辑核心
    for spec in new_data.get('specialties', []):
        spec_id = spec.get('spec_id', '')
        
        for var in spec.get('variations', []):
            var_id = var.get('var_id', '')
            var_name = var.get('name', '')
            logic_core = var.get('logic_core', '')
            toolkit = var.get('toolkit', {})
            weapons = toolkit.get('linked_weapons', [])
            weapon_note = toolkit.get('weapon_map_note', '')
            
            # 构建变例标题
            var_title = f"### Variation {var_id}: {var_name}"
            
            # 构建元数据块
            meta_block = ""
            if logic_core:
                meta_block += f"\n> **逻辑核心**: {logic_core[:100]}...\n"
            if weapons:
                meta_block += f"> **杀手锏**: {', '.join(weapons)}\n"
            if weapon_note:
                meta_block += f"> **武器说明**: {weapon_note}\n"
            
            # 如果有元数据，插入到变例标题后面
            if meta_block:
                # 查找变例标题位置（使用字符串查找而非正则）
                var_marker = f"### Variation {var_id}: {var_name}"
                if var_marker in content:
                    content = content.replace(var_marker, var_marker + "\n" + meta_block, 1)
    
    with open(md_file, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    print("🚀 开始数据迁移...")
    
    # 1. 加载文件
    print("📖 加载文件...")
    old_data = load_json(OLD_FILE)
    new_data = load_json(NEW_FILE)
    
    print(f"  - 旧版: {len(old_data.get('specialties', []))} 个专项")
    print(f"  - 新版: {len(new_data.get('specialties', []))} 个专项")
    
    # 2. 提取旧版数据
    print("\n📦 提取教学标签...")
    extracted = extract_old_data(old_data)
    print(f"  - 变例标签: {len(extracted['variations'])} 个")
    print(f"  - 题目标签: {len(extracted['questions'])} 个")
    
    # 3. 匹配并注入
    print("\n🔄 匹配并注入标签...")
    match_count = match_questions(new_data, extracted)
    print(f"  - 成功匹配: {match_count} 题")
    
    # 4. 保存新版 JSON
    print("\n💾 保存新版 JSON...")
    save_json(NEW_FILE, new_data)
    print(f"  - 已保存: {NEW_FILE}")
    
    # 5. 更新 Markdown
    print("\n📝 更新 Markdown...")
    update_markdown(MD_FILE, new_data)
    print(f"  - 已更新: {MD_FILE}")
    
    # 6. 统计结果
    print("\n📊 迁移统计:")
    total_questions = 0
    tagged_questions = 0
    
    for spec in new_data.get('specialties', []):
        for var in spec.get('variations', []):
            for q in var.get('original_pool', []):
                total_questions += 1
                if q.get('meta', {}).get('core_logic'):
                    tagged_questions += 1
    
    print(f"  - 总题目数: {total_questions}")
    print(f"  - 已标记数: {tagged_questions}")
    print(f"  - 标记率: {tagged_questions/total_questions*100:.1f}%" if total_questions > 0 else "  - 标记率: 0%")
    
    print("\n✅ 数据迁移完成！")

if __name__ == "__main__":
    main()
