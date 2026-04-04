import json

with open('M04.json', 'r', encoding='utf-8') as f:
    m04 = json.load(f)

unknown_count = 0
known_count = 0
source_dist = {}

for s in m04.get('specialties', []):
    for v in s.get('variations', []):
        for q in v.get('original_pool', []):
            source = q.get('source', '')
            if not source or source == '未知来源':
                unknown_count += 1
            else:
                known_count += 1
                source_dist[source] = source_dist.get(source, 0) + 1

total = unknown_count + known_count
print(f"M04 来源统计:")
print(f"  总题数: {total}")
print(f"  有来源: {known_count} ({known_count/total*100:.1f}%)")
print(f"  未知来源: {unknown_count} ({unknown_count/total*100:.1f}%)")

print(f"\n来源分布 (前15):")
for source, count in sorted(source_dist.items(), key=lambda x: -x[1])[:15]:
    print(f"  {source}: {count} 题")
