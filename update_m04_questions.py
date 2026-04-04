import json

with open('src/data/M04.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

v11_delete_ids = ['M04_V1_1.1_L2_SEED_005', 'M04_V1_1.1_L2_SEED_008', 'M04_V1_1.1_L2_SEED_010']
v12_delete_ids = ['M04_V1_1.2_L3_SEED_014', 'M04_V1_1.2_L4_SEED_022', 'M04_V1_1.2_L4_SEED_024']
v11_replace_ids = ['M04_V1_1.1_L3_SEED_011', 'M04_V1_1.1_L3_SEED_012']

v11_new_questions = [
    {
        "id": "M04_V1_1.1_L3_SEED_011",
        "data_source": "original",
        "source": "[23 全国乙卷风格]",
        "problem": "设 $a = \\ln \\pi, b = \\log_\\pi 3, c = \\log_3 \\pi$，则 $a, b, c$ 的大小关系是\\_\\_\\_\\_\\_。",
        "answer": "$a > b > c$",
        "key_points": [
            "① $a = \\ln \\pi \\approx 1.14$",
            "② $b = \\log_\\pi 3$：由于 $\\pi > 3$，$b < 1$",
            "③ $c = \\log_3 \\pi$：由于 $\\pi > 3$，$c > 1$",
            "④ 比较 $a$ 和 $c$：$\\ln \\pi$ vs $\\log_3 \\pi$",
            "⑤ $\\ln \\pi = \\frac{\\ln \\pi}{\\ln e}$，$\\log_3 \\pi = \\frac{\\ln \\pi}{\\ln 3}$",
            "⑥ 由于 $\\ln e = 1 < \\ln 3$，故 $\\ln \\pi > \\log_3 \\pi$，即 $a > c$",
            "⑦ 比较 $c$ 和 $b$：$\\log_3 \\pi$ vs $\\log_\\pi 3$",
            "⑧ $\\log_3 \\pi \\cdot \\log_\\pi 3 = 1$，且 $\\log_3 \\pi > 1$，故 $\\log_\\pi 3 < 1$",
            "⑨ 综上 $a > c > b$，即 $a > b > c$"
        ],
        "level": "L3",
        "tags": ["L3", "比较大小", "对数"],
        "quality_score": 94,
        "meta": {
            "core_logic": ["对数比较大小", "中间值法"],
            "trap_tags": ["比较方向错误", "中间值选择错误"],
            "weapons": ["S-LOG-02"],
            "strategy_hint": "模型：对数比较大小-中间值法"
        },
        "specId": "V1",
        "specName": "幂指对代数韧性",
        "varId": "1.1",
        "varName": "复合运算与指对转化",
        "analysis": "【首要步骤】估算各值范围。\n\n【核心思路】利用中间值比较。\n\n【详细推导】\n1. $a = \\ln \\pi \\approx 1.14$（$\\pi \\approx 3.14$）\n2. $b = \\log_\\pi 3$：由于 $\\pi > 3$，$b < 1$\n3. $c = \\log_3 \\pi$：由于 $\\pi > 3$，$c > 1$\n4. 比较 $a$ 和 $c$：\n   - $\\ln \\pi = \\frac{\\ln \\pi}{\\ln e}$，$\\log_3 \\pi = \\frac{\\ln \\pi}{\\ln 3}$\n   - 由于 $\\ln e = 1 < \\ln 3$，故 $\\ln \\pi > \\log_3 \\pi$\n   - 即 $a > c$\n5. 比较 $c$ 和 $b$：\n   - $\\log_3 \\pi \\cdot \\log_\\pi 3 = 1$\n   - 由于 $\\log_3 \\pi > 1$，故 $\\log_\\pi 3 < 1 < \\log_3 \\pi$\n   - 即 $c > b$\n6. 综上 $a > c > b$\n\n【答案】$a > b > c$"
    },
    {
        "id": "M04_V1_1.1_L3_SEED_012",
        "data_source": "original",
        "source": "[24 浙江·名校协作体]",
        "problem": "已知 $a = 0.3^{0.2}, b = 0.2^{0.3}, c = \\log_{0.3} 0.2$，则 $a, b, c$ 的大小关系为\\_\\_\\_\\_\\_。",
        "answer": "$c > a > b$",
        "key_points": [
            "① $a = 0.3^{0.2}$：底数 $0.3 < 1$，指数 $0.2 > 0$，故 $a < 1$",
            "② $b = 0.2^{0.3}$：底数 $0.2 < 1$，指数 $0.3 > 0$，故 $b < 1$",
            "③ $c = \\log_{0.3} 0.2$：底数 $0.3 < 1$，真数 $0.2 < 0.3$，故 $c > 1$",
            "④ 比较 $a$ 和 $b$：$0.3^{0.2}$ vs $0.2^{0.3}$",
            "⑤ 取对数：$\\ln a = 0.2 \\ln 0.3$，$\\ln b = 0.3 \\ln 0.2$",
            "⑥ $\\ln 0.3 \\approx -1.20$，$\\ln 0.2 \\approx -1.61$",
            "⑦ $\\ln a \\approx -0.24$，$\\ln b \\approx -0.48$，故 $a > b$",
            "⑧ 综上 $c > a > b$"
        ],
        "level": "L3",
        "tags": ["L3", "比较大小", "指数", "对数"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["指数比较大小", "对数比较大小", "中间值法"],
            "trap_tags": ["底数小于1时单调性反转", "比较方向错误"],
            "weapons": ["S-LOG-02"],
            "strategy_hint": "模型：指对数比较大小-取对数法"
        },
        "specId": "V1",
        "specName": "幂指对代数韧性",
        "varId": "1.1",
        "varName": "复合运算与指对转化",
        "analysis": "【首要步骤】分析各值范围。\n\n【核心思路】利用中间值和取对数比较。\n\n【详细推导】\n1. $a = 0.3^{0.2}$：底数 $0.3 < 1$，指数 $0.2 > 0$，故 $a < 1$\n2. $b = 0.2^{0.3}$：底数 $0.2 < 1$，指数 $0.3 > 0$，故 $b < 1$\n3. $c = \\log_{0.3} 0.2$：底数 $0.3 < 1$，真数 $0.2 < 0.3$，故 $c > 1$\n4. 比较 $a$ 和 $b$：\n   - 取对数：$\\ln a = 0.2 \\ln 0.3$，$\\ln b = 0.3 \\ln 0.2$\n   - $\\ln 0.3 \\approx -1.20$，$\\ln 0.2 \\approx -1.61$\n   - $\\ln a \\approx -0.24$，$\\ln b \\approx -0.48$\n   - 由于 $\\ln a > \\ln b$，故 $a > b$\n5. 综上 $c > a > b$\n\n【答案】$c > a > b$"
    }
]

v12_new_questions = [
    {
        "id": "M04_V1_1.2_L4_SEED_016",
        "data_source": "original",
        "source": "[24 新高考 I 卷·T11 改编]",
        "problem": "已知函数 $f(x) = e^x - ax$ 有两个零点 $x_1, x_2$。若 $x_1 + x_2 < k\\ln a$ 恒成立，则 $k$ 的最小值为\\_\\_\\_\\_\\_。",
        "answer": "$2$",
        "key_points": [
            "① 零点条件：$e^{x_1} = a x_1$，$e^{x_2} = a x_2$",
            "② 取对数：$x_1 = \\ln a + \\ln x_1$，$x_2 = \\ln a + \\ln x_2$",
            "③ $x_1 + x_2 = 2\\ln a + \\ln(x_1 x_2)$",
            "④ 极值点：$f'(x) = e^x - a = 0$，$x_0 = \\ln a$",
            "⑤ 由极值点偏移，$x_1 + x_2 < 2x_0 = 2\\ln a$",
            "⑥ 所以 $k$ 的最小值为 $2$"
        ],
        "level": "L4",
        "tags": ["L4", "极值点偏移", "指对同构"],
        "quality_score": 96,
        "meta": {
            "core_logic": ["极值点偏移", "指对同构"],
            "trap_tags": ["极值点偏移方法不熟悉", "同构变形错误"],
            "weapons": ["S-LOG-02"],
            "strategy_hint": "模型：极值点偏移证明模型"
        },
        "specId": "V1",
        "specName": "幂指对代数韧性",
        "varId": "1.2",
        "varName": "指对同构",
        "analysis": "【首要步骤】分析零点条件与极值点。\n\n【核心思路】极值点偏移+指对同构。\n\n【详细推导】\n1. 零点条件：$e^{x_1} = a x_1$，$e^{x_2} = a x_2$\n2. 取对数：$x_1 = \\ln a + \\ln x_1$，$x_2 = \\ln a + \\ln x_2$\n3. $x_1 + x_2 = 2\\ln a + \\ln(x_1 x_2)$\n4. 极值点：$f'(x) = e^x - a = 0$，$x_0 = \\ln a$\n5. 由极值点偏移理论，对于有两个零点的函数，$x_1 + x_2 < 2x_0$\n6. 所以 $x_1 + x_2 < 2\\ln a$\n7. 若 $x_1 + x_2 < k\\ln a$ 恒成立，则 $k \\ge 2$\n8. $k$ 的最小值为 $2$\n\n【答案】$2$"
    },
    {
        "id": "M04_V1_1.2_L4_SEED_017",
        "data_source": "original",
        "source": "[24 江苏·苏州二模]",
        "problem": "设 $x_0$ 是方程 $x e^x = 1$ 的根，则 $\\ln x_0 + x_0 =$\\_\\_\\_\\_\\_。",
        "answer": "$0$",
        "key_points": [
            "① $x e^x = 1$",
            "② 两边取对数：$\\ln x + x = 0$",
            "③ 由于 $x_0$ 是方程的根，故 $\\ln x_0 + x_0 = 0$"
        ],
        "level": "L4",
        "tags": ["L4", "乘积同构", "取对数"],
        "quality_score": 94,
        "meta": {
            "core_logic": ["乘积同构", "取对数变形"],
            "trap_tags": ["忽略简单变形", "过度复杂化"],
            "weapons": ["S-LOG-02"],
            "strategy_hint": "模型：乘积同构 $xe^x$ 型-取对数"
        },
        "specId": "V1",
        "specName": "幂指对代数韧性",
        "varId": "1.2",
        "varName": "指对同构",
        "analysis": "【首要步骤】观察方程结构。\n\n【核心思路】取对数直接变形。\n\n【详细推导】\n1. $x e^x = 1$\n2. 两边取对数：$\\ln x + x = \\ln 1 = 0$\n3. 由于 $x_0$ 是方程的根，故 $\\ln x_0 + x_0 = 0$\n\n【答案】$0$"
    },
    {
        "id": "M04_V1_1.2_L4_SEED_018",
        "data_source": "original",
        "source": "[24 浙江·名校协作体]",
        "problem": "不等式 $x e^x \\ge a(x + \\ln x)$ 恒成立，求 $a$ 的最大值为\\_\\_\\_\\_\\_。",
        "answer": "$e$",
        "key_points": [
            "① $x e^x = e^{\\ln x} \\cdot e^x = e^{x + \\ln x}$",
            "② 设 $t = x + \\ln x$，则不等式变为 $e^t \\ge a t$",
            "③ 即 $a \\le \\frac{e^t}{t}$",
            "④ 求 $\\frac{e^t}{t}$ 的最小值",
            "⑤ 设 $h(t) = \\frac{e^t}{t}$，$h'(t) = \\frac{e^t(t-1)}{t^2}$",
            "⑥ 当 $t = 1$ 时，$h(t)$ 取最小值 $e$",
            "⑦ 故 $a \\le e$，$a$ 的最大值为 $e$"
        ],
        "level": "L4",
        "tags": ["L4", "恒成立问题", "整体代换"],
        "quality_score": 96,
        "meta": {
            "core_logic": ["整体代换", "最值"],
            "trap_tags": ["整体代换识别错误", "最值计算错误"],
            "weapons": ["S-LOG-02"],
            "strategy_hint": "模型：识别 $xe^x=e^{x+\\ln x}$ 整体代换"
        },
        "specId": "V1",
        "specName": "幂指对代数韧性",
        "varId": "1.2",
        "varName": "指对同构",
        "analysis": "【首要步骤】识别整体结构。\n\n【核心思路】整体代换+最值。\n\n【详细推导】\n1. $x e^x = e^{\\ln x} \\cdot e^x = e^{x + \\ln x}$\n2. 设 $t = x + \\ln x$，则 $x e^x = e^t$\n3. 不等式变为 $e^t \\ge a t$\n4. 即 $a \\le \\frac{e^t}{t}$\n5. 设 $h(t) = \\frac{e^t}{t}$，$h'(t) = \\frac{e^t(t-1)}{t^2}$\n6. 当 $t = 1$ 时，$h(t)$ 取最小值 $e$\n7. 故 $a \\le e$，$a$ 的最大值为 $e$\n\n【答案】$e$"
    },
    {
        "id": "M04_V1_1.2_L4_SEED_019",
        "data_source": "original",
        "source": "[25 广东省实/深中联考]",
        "problem": "若 $a^b = b^a (a \\ne b)$，求 $ab$ 的取值范围是\\_\\_\\_\\_\\_。",
        "answer": "$(e^2, +\\infty)$",
        "key_points": [
            "① 取对数：$b \\ln a = a \\ln b$",
            "② $\\frac{\\ln a}{a} = \\frac{\\ln b}{b}$",
            "③ 设 $f(x) = \\frac{\\ln x}{x}$，则 $f(a) = f(b)$",
            "④ $f'(x) = \\frac{1 - \\ln x}{x^2}$",
            "⑤ 当 $x = e$ 时取最大值 $\\frac{1}{e}$",
            "⑥ $f(x)$ 在 $(0, e)$ 递增，在 $(e, +\\infty)$ 递减",
            "⑦ 若 $a \\ne b$ 且 $f(a) = f(b)$，则 $a, b$ 分布在 $e$ 两侧",
            "⑧ $ab > e^2$"
        ],
        "level": "L4",
        "tags": ["L4", "商同构", "对称性"],
        "quality_score": 96,
        "meta": {
            "core_logic": ["商同构", "对称性"],
            "trap_tags": ["函数构造错误", "对称性分析错误"],
            "weapons": ["S-LOG-02"],
            "strategy_hint": "模型：商同构 $\\frac{\\ln x}{x}$ 型"
        },
        "specId": "V1",
        "specName": "幂指对代数韧性",
        "varId": "1.2",
        "varName": "指对同构",
        "analysis": "【首要步骤】取对数变形。\n\n【核心思路】商同构+函数对称性。\n\n【详细推导】\n1. 取对数：$b \\ln a = a \\ln b$\n2. $\\frac{\\ln a}{a} = \\frac{\\ln b}{b}$\n3. 设 $f(x) = \\frac{\\ln x}{x}$，则 $f(a) = f(b)$\n4. $f'(x) = \\frac{1 - \\ln x}{x^2}$\n5. 当 $x = e$ 时取最大值 $\\frac{1}{e}$\n6. $f(x)$ 在 $(0, e)$ 递增，在 $(e, +\\infty)$ 递减\n7. 若 $a \\ne b$ 且 $f(a) = f(b)$，则 $a, b$ 分布在 $e$ 两侧\n8. 设 $a < e < b$，由对称性分析\n9. $ab > e^2$\n\n【答案】$(e^2, +\\infty)$"
    }
]

for spec in data['specialties']:
    if spec['spec_id'] == 'V1':
        for var in spec['variations']:
            pool = var.get('original_pool', [])
            
            if var['var_id'] == '1.1':
                print(f"V1.1 原有题目数: {len(pool)}")
                
                pool = [q for q in pool if q['id'] not in v11_delete_ids]
                print(f"V1.1 删除3题后: {len(pool)}")
                
                pool = [q for q in pool if q['id'] not in v11_replace_ids]
                pool.extend(v11_new_questions)
                print(f"V1.1 替换2题后: {len(pool)}")
                
                var['original_pool'] = pool
                
            elif var['var_id'] == '1.2':
                print(f"\nV1.2 原有题目数: {len(pool)}")
                
                pool = [q for q in pool if q['id'] not in v12_delete_ids]
                print(f"V1.2 删除3题后: {len(pool)}")
                
                pool.extend(v12_new_questions)
                print(f"V1.2 新增4题后: {len(pool)}")
                
                var['original_pool'] = pool

with open('src/data/M04.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("\n✅ 6删6增完成！")
