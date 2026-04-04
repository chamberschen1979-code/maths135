import json
import re

# 读取文件
with open('src/data/M05.json', 'r', encoding='utf-8') as f:
    content = f.read()

# 找出所有 `]\n[` 模式
pattern = r'\]\s*\n\s*\['
matches = list(re.finditer(pattern, content))
print(f"找到 {len(matches)} 处数组拼接错误")

# 替换所有 `]\n[` 为 `,`
fixed_content = re.sub(pattern, ',', content)

# 尝试解析
try:
    data = json.loads(fixed_content)
    print("✅ JSON 格式修复成功")
    
    # 保存
    with open('src/data/M05_fixed.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("✅ 已保存到 M05_fixed.json")
    
except json.JSONDecodeError as e:
    print(f"❌ 解析失败: {e}")
    print(f"   位置: {e.pos}")
    
    # 显示错误位置附近内容
    start = max(0, e.pos - 100)
    end = min(len(fixed_content), e.pos + 100)
    print(f"\n错误位置附近内容:")
    print(fixed_content[start:end])
