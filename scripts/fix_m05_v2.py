import json
import re

# 读取文件
with open('src/data/M05.json', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 替换所有 `]\n[` 为 `,`
content = re.sub(r'\]\s*\n\s*\[', ',', content)

# 2. 找出并修复 key_points 中的注释内容
# 模式：key_points 数组中包含 "修正"、"答案"、"最终" 等注释字符串

def clean_key_points(match):
    full_match = match.group(0)
    # 提取 key_points 数组内容
    try:
        # 找到数组的开始和结束
        start = full_match.find('[')
        if start == -1:
            return full_match
        
        # 手动解析数组
        depth = 0
        end = -1
        for i in range(start, len(full_match)):
            if full_match[i] == '[':
                depth += 1
            elif full_match[i] == ']':
                depth -= 1
                if depth == 0:
                    end = i
                    break
        
        if end == -1:
            return full_match
        
        array_content = full_match[start:end+1]
        
        # 解析数组
        items = json.loads(array_content)
        
        # 过滤掉注释性质的字符串
        cleaned_items = []
        for item in items:
            if isinstance(item, str):
                # 跳过注释性质的字符串
                skip_keywords = ['修正', '最终定题', '最终 L', '更换 L', '替换为', 
                                '答案：', '理由：', '实际上：', '正确结论：',
                                '计算：', '若要最值', '简化版', '采用经典']
                should_skip = any(kw in item for kw in skip_keywords)
                
                # 跳过嵌套的 key_points
                if '"key_points"' in item:
                    should_skip = True
                
                if not should_skip:
                    cleaned_items.append(item)
        
        # 重建 key_points
        return '"key_points": ' + json.dumps(cleaned_items, ensure_ascii=False)
        
    except:
        return full_match

# 应用清理
content = re.sub(r'"key_points":\s*\[', clean_key_points, content)

# 3. 尝试解析
try:
    data = json.loads(content)
    print("✅ JSON 格式修复成功")
    
    # 统计
    total = 0
    if 'specialties' in data:
        for spec in data['specialties']:
            if 'variations' in spec:
                for v in spec['variations']:
                    if 'original_pool' in v:
                        count = len(v['original_pool'])
                        total += count
                        print(f"  {v.get('var_id', '?')} {v.get('name', '?')}: {count} 题")
    
    print(f"\n总计: {total} 题")
    
    # 保存
    with open('src/data/M05_fixed.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("\n✅ 已保存到 M05_fixed.json")
    
except json.JSONDecodeError as e:
    print(f"❌ 解析失败: {e}")
    print(f"   位置: {e.pos}")
    
    # 保存修复后的内容用于调试
    with open('src/data/M05_debug.txt', 'w', encoding='utf-8') as f:
        f.write(content)
    print("📝 已保存到 M05_debug.txt")
