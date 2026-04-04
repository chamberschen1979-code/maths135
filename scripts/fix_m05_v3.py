import json
import re

# 读取文件
with open('src/data/M05.json', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 替换所有 `]\n[` 为 `,`
content = re.sub(r'\]\s*\n\s*\[', ',', content)

# 2. 找出所有没有字段名的字符串行（以 "修正"、"答案"、"key_points" 开头）
# 这些是错误嵌入在值中的字符串
lines = content.split('\n')
fixed_lines = []
skip_next = False

for i, line in enumerate(lines):
    stripped = line.strip()
    
    # 跳过注释性质的字符串行
    if stripped.startswith('"修正') or stripped.startswith('"最终') or stripped.startswith('"答案：') or stripped.startswith('"理由') or stripped.startswith('"实际上') or stripped.startswith('"正确结论') or stripped.startswith('"计算') or stripped.startswith('"若要') or stripped.startswith('"更换') or stripped.startswith('"简化版') or stripped.startswith('"采用') or stripped.startswith('"题目：') or stripped.startswith('"替换为'):
        continue
    
    # 跳过嵌套的 key_points 行
    if '"key_points":' in stripped and stripped != line:
        continue
    
    fixed_lines.append(line)

content = '\n'.join(fixed_lines)

# 3. 再次尝试解析
try:
    data = json.loads(content)
    print("✅ JSON 格式修复成功")
    
    # 保存
    with open('src/data/M05_fixed.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("✅ 已保存到 M05_fixed.json")
    
except json.JSONDecodeError as e:
    print(f"❌ 解析失败: {e}")
    print(f"   位置: {e.pos}")
    
    # 保存修复后的内容用于调试
    with open('src/data/M05_debug.txt', 'w', encoding='utf-8') as f:
        f.write(content)
    print("📝 已保存到 M05_debug.txt")
