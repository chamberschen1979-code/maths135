import json

with open('src/data/M04.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

strategy_map = {
    "换底公式统一底数": "模型：换底公式统一底数模型",
    "利用中间值1进行比较": "模型：中间值比较模型",
    "两边取对数": "模型：取对数变形模型",
    "分类讨论，验证解的范围": "模型：分类讨论模型",
    "分别求集合A和B，再求交集": "模型：集合运算模型",
    "先由条件判定0<a<1": "模型：对数底数判定模型",
    "分析单调性，确定最值位置": "模型：单调性分析模型",
    "化简后用均值不等式": "模型：均值不等式模型",
    "设t=3^x换元": "模型：换元法模型",
    "直接利用对数定义": "模型：对数定义模型",
    "构造函数f(x)=e^x+x": "模型：构造函数模型",
    "加同构": "模型：加法同构模型",
    "考查xe^x在正半轴的单调性": "模型：乘积同构模型",
    "杀手锏：构造f(x)=ln(x+1)/ln x": "模型：商同构模型",
    "函数差值：考查增量与凸性": "模型：函数差值模型",
    "杀手锏：识别xe^x=e^(x+ln x)整体代换": "模型：整体代换模型",
    "考查f(x)=lnx/x的对称性": "模型：商同构模型",
    "考查指对互化": "模型：指对互化模型",
    "利用f(x)单调性": "模型：单调性分析模型",
    "考查反函数点坐标关系": "模型：反函数对称模型",
    "考查复合函数单调性": "模型：复合单调性模型",
    "考查函数零点": "模型：零点分析模型",
    "考查函数对称性": "模型：对称性分析模型",
    "考查函数奇偶性": "模型：奇偶性分析模型",
    "考查函数周期性": "模型：周期性分析模型",
    "考查函数值域": "模型：值域分析模型",
    "考查函数最值": "模型：最值分析模型",
    "考查函数极值": "模型：极值分析模型",
    "考查函数图象": "模型：图象分析模型",
    "考查函数性质综合": "模型：综合分析模型",
}

fixed_count = 0

for spec in data['specialties']:
    for var in spec['variations']:
        pool = var.get('original_pool', [])
        for q in pool:
            strategy = q.get('meta', {}).get('strategy_hint', '')
            
            if strategy and not strategy.startswith('模型：'):
                if strategy in strategy_map:
                    q['meta']['strategy_hint'] = strategy_map[strategy]
                    fixed_count += 1
                else:
                    q['meta']['strategy_hint'] = f"模型：{strategy}"
                    fixed_count += 1

with open('src/data/M04.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"已修复 {fixed_count} 个 strategy_hint 格式")
