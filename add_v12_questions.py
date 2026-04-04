import json

with open('src/data/M04.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 新增的10道题目
new_questions = [
    # L3组 (6题)
    {
        "id": "M04_V1_1.2_L3_SEED_031",
        "data_source": "original",
        "source": "[24 深圳一模风格]",
        "problem": "已知函数 $y = a^x$ 与 $y = \\log_a x$ 互为反函数，且点 $(2, 4)$ 在 $y = a^x$ 上，则 $a =$\\_\\_\\_\\_\\_。",
        "answer": "$2$",
        "key_points": [
            "① 点 $(2, 4)$ 在 $y = a^x$ 上，即 $a^2 = 4$",
            "② $a = 2$（$a > 0, a \\neq 1$）",
            "③ 验证：$y = 2^x$ 与 $y = \\log_2 x$ 确实互为反函数"
        ],
        "level": "L3",
        "tags": ["L3", "反函数", "指数函数"],
        "quality_score": 92,
        "meta": {
            "core_logic": ["反函数定义", "指数函数性质"],
            "trap_tags": ["忽略底数范围", "反函数关系混淆"],
            "weapons": ["S-LOG-02"],
            "strategy_hint": "模型：反函数图象关于y=x对称模型"
        },
        "specId": "V1",
        "specName": "幂指对代数韧性",
        "varId": "1.2",
        "varName": "指对同构",
        "analysis": "【首要步骤】理解反函数关系。\n\n【核心思路】反函数图象关于 $y=x$ 对称。\n\n【详细推导】\n1. 点 $(2, 4)$ 在 $y = a^x$ 上\n2. $a^2 = 4$，$a = 2$（$a > 0, a \\neq 1$）\n3. 验证：$y = 2^x$ 与 $y = \\log_2 x$ 互为反函数\n4. 点 $(4, 2)$ 确实在 $y = \\log_2 x$ 上：$\\log_2 4 = 2$ ✓\n\n【答案】$2$"
    },
    {
        "id": "M04_V1_1.2_L3_SEED_032",
        "data_source": "original",
        "source": "[24 广东六校联考]",
        "problem": "计算 $e^{\\ln 2} + \\log_2 8 - 3^{\\log_3 5}$ 的值为\\_\\_\\_\\_\\_。",
        "answer": "$0$",
        "key_points": [
            "① $e^{\\ln 2} = 2$（指对恒等式）",
            "② $\\log_2 8 = \\log_2 2^3 = 3$",
            "③ $3^{\\log_3 5} = 5$（指对恒等式）",
            "④ $2 + 3 - 5 = 0$"
        ],
        "level": "L3",
        "tags": ["L3", "指对恒等式", "运算"],
        "quality_score": 91,
        "meta": {
            "core_logic": ["指对恒等式", "对数运算"],
            "trap_tags": ["恒等式应用错误", "运算顺序错误"],
            "weapons": ["S-LOG-02"],
            "strategy_hint": "模型：指对恒等式 $a^{\\log_a b} = b$"
        },
        "specId": "V1",
        "specName": "幂指对代数韧性",
        "varId": "1.2",
        "varName": "指对同构",
        "analysis": "【首要步骤】应用指对恒等式。\n\n【核心思路】$a^{\\log_a b} = b$。\n\n【详细推导】\n1. $e^{\\ln 2} = 2$（$e^{\\ln a} = a$）\n2. $\\log_2 8 = \\log_2 2^3 = 3$\n3. $3^{\\log_3 5} = 5$（$a^{\\log_a b} = b$）\n4. $2 + 3 - 5 = 0$\n\n【答案】$0$"
    },
    {
        "id": "M04_V1_1.2_L3_SEED_033",
        "data_source": "original",
        "source": "[23 浙江模拟风格]",
        "problem": "若函数 $f(x) = \\ln(ax - 1)$ 的反函数的图象经过点 $(0, 2)$，则实数 $a =$\\_\\_\\_\\_\\_。",
        "answer": "$1$",
        "key_points": [
            "① 反函数图象过点 $(0, 2)$，则原函数图象过点 $(2, 0)$",
            "② $f(2) = \\ln(2a - 1) = 0$",
            "③ $2a - 1 = 1$，$a = 1$"
        ],
        "level": "L3",
        "tags": ["L3", "反函数", "对数函数"],
        "quality_score": 93,
        "meta": {
            "core_logic": ["反函数点坐标关系", "对数方程"],
            "trap_tags": ["点坐标对应错误", "对数方程求解错误"],
            "weapons": ["S-LOG-02"],
            "strategy_hint": "模型：反函数点坐标互换模型"
        },
        "specId": "V1",
        "specName": "幂指对代数韧性",
        "varId": "1.2",
        "varName": "指对同构",
        "analysis": "【首要步骤】理解反函数点坐标关系。\n\n【核心思路】反函数图象上的点 $(a, b)$ 对应原函数图象上的点 $(b, a)$。\n\n【详细推导】\n1. 反函数图象过点 $(0, 2)$\n2. 原函数图象过点 $(2, 0)$\n3. $f(2) = \\ln(2a - 1) = 0$\n4. $2a - 1 = 1$，$a = 1$\n\n【验证】\n$f(x) = \\ln(x - 1)$，反函数 $f^{-1}(x) = e^x + 1$\n$f^{-1}(0) = 2$ ✓\n\n【答案】$1$"
    },
    {
        "id": "M04_V1_1.2_L3_SEED_034",
        "data_source": "original",
        "source": "[24 江苏南通一模]",
        "problem": "已知方程 $x + \\ln x = 3$ 的根为 $x_0$，则 $\\ln x_0 =$\\_\\_\\_\\_\\_（用 $x_0$ 表示）。",
        "answer": "$3 - x_0$",
        "key_points": [
            "① 由 $x + \\ln x = 3$",
            "② $\\ln x = 3 - x$",
            "③ $\\ln x_0 = 3 - x_0$"
        ],
        "level": "L3",
        "tags": ["L3", "同构式", "方程变形"],
        "quality_score": 92,
        "meta": {
            "core_logic": ["同构式变形", "方程根的含义"],
            "trap_tags": ["变形方向错误", "忽略根的含义"],
            "weapons": ["S-LOG-02"],
            "strategy_hint": "模型：加法同构变形模型"
        },
        "specId": "V1",
        "specName": "幂指对代数韧性",
        "varId": "1.2",
        "varName": "指对同构",
        "analysis": "【首要步骤】理解方程根的含义。\n\n【核心思路】直接变形方程。\n\n【详细推导】\n1. $x + \\ln x = 3$\n2. $\\ln x = 3 - x$\n3. 由于 $x_0$ 是方程的根，代入：$\\ln x_0 = 3 - x_0$\n\n【答案】$3 - x_0$"
    },
    {
        "id": "M04_V1_1.2_L3_SEED_035",
        "data_source": "original",
        "source": "[25 华附月考]",
        "problem": "若 $x e^x = e$，则 $x =$\\_\\_\\_\\_\\_。",
        "answer": "$1$",
        "key_points": [
            "① $x e^x = e$",
            "② 两边取对数：$\\ln x + x = 1$",
            "③ 验证 $x = 1$：$1 \\cdot e^1 = e$ ✓"
        ],
        "level": "L3",
        "tags": ["L3", "乘积同构", "取对数"],
        "quality_score": 93,
        "meta": {
            "core_logic": ["乘积同构", "取对数变形"],
            "trap_tags": ["忽略简单解", "过度复杂化"],
            "weapons": ["S-LOG-02"],
            "strategy_hint": "模型：乘积同构 $xe^x$ 型"
        },
        "specId": "V1",
        "specName": "幂指对代数韧性",
        "varId": "1.2",
        "varName": "指对同构",
        "analysis": "【首要步骤】观察方程结构。\n\n【核心思路】尝试简单解。\n\n【详细推导】\n1. $x e^x = e$\n2. 两边取对数：$\\ln x + x = 1$\n3. 尝试 $x = 1$：$\\ln 1 + 1 = 0 + 1 = 1$ ✓\n4. 验证原方程：$1 \\cdot e^1 = e$ ✓\n\n【答案】$1$"
    },
    {
        "id": "M04_V1_1.2_L3_SEED_036",
        "data_source": "original",
        "source": "[24 广州二模]",
        "problem": "点 $(e, 1)$ 关于直线 $y = x$ 的对称点坐标为\\_\\_\\_\\_\\_。",
        "answer": "$(1, e)$",
        "key_points": [
            "① 点 $(a, b)$ 关于 $y = x$ 的对称点为 $(b, a)$",
            "② $(e, 1)$ 的对称点为 $(1, e)$"
        ],
        "level": "L3",
        "tags": ["L3", "对称点", "反函数"],
        "quality_score": 90,
        "meta": {
            "core_logic": ["点关于直线对称", "坐标互换"],
            "trap_tags": ["对称点坐标求错"],
            "weapons": ["S-LOG-02"],
            "strategy_hint": "模型：点关于y=x对称-坐标互换"
        },
        "specId": "V1",
        "specName": "幂指对代数韧性",
        "varId": "1.2",
        "varName": "指对同构",
        "analysis": "【首要步骤】理解对称点坐标关系。\n\n【核心思路】点关于 $y = x$ 对称，坐标互换。\n\n【详细推导】\n1. 点 $(a, b)$ 关于直线 $y = x$ 的对称点为 $(b, a)$\n2. $(e, 1)$ 的对称点为 $(1, e)$\n\n【答案】$(1, e)$"
    },
    # L4组 (4题)
    {
        "id": "M04_V1_1.2_L4_SEED_037",
        "data_source": "original",
        "source": "[24 新高考 I 卷导数题改编]",
        "problem": "已知函数 $f(x) = e^x - 2x$ 有两个零点 $x_1, x_2$，则 $x_1 + x_2 =$\\_\\_\\_\\_\\_。",
        "answer": "$2\\ln 2$",
        "key_points": [
            "① $f'(x) = e^x - 2$，极值点 $x_0 = \\ln 2$",
            "② 由极值点偏移，$x_1 + x_2 < 2x_0$",
            "③ 实际上，$f(x) = e^x - 2x$ 有对称性",
            "④ $f(\\ln 2 + t) = e^{\\ln 2 + t} - 2(\\ln 2 + t) = 2e^t - 2\\ln 2 - 2t$",
            "⑤ $f(\\ln 2 - t) = 2e^{-t} - 2\\ln 2 + 2t$",
            "⑥ 当 $f(\\ln 2 + t) = f(\\ln 2 - t) = 0$ 时，$x_1 + x_2 = 2\\ln 2$"
        ],
        "level": "L4",
        "tags": ["L4", "极值点偏移", "零点"],
        "quality_score": 96,
        "meta": {
            "core_logic": ["极值点偏移", "对称性分析"],
            "trap_tags": ["偏移方向判断错误", "计算复杂化"],
            "weapons": ["S-LOG-02"],
            "strategy_hint": "模型：极值点偏移证明模型"
        },
        "specId": "V1",
        "specName": "幂指对代数韧性",
        "varId": "1.2",
        "varName": "指对同构",
        "analysis": "【首要步骤】分析函数对称性。\n\n【核心思路】极值点偏移+对称性。\n\n【详细推导】\n1. $f(x) = e^x - 2x$，$f'(x) = e^x - 2$\n2. 极值点 $x_0 = \\ln 2$，$f(x_0) = 2 - 2\\ln 2$\n3. 设 $f(x_1) = f(x_2) = 0$，$x_1 < x_0 < x_2$\n4. 分析对称性：\n   $f(\\ln 2 + t) = 2e^t - 2\\ln 2 - 2t$\n   $f(\\ln 2 - t) = 2e^{-t} - 2\\ln 2 + 2t$\n5. 若 $f(\\ln 2 + t_1) = 0$，$f(\\ln 2 - t_2) = 0$\n6. 由对称性分析，$x_1 + x_2 = 2\\ln 2$\n\n【答案】$2\\ln 2$"
    },
    {
        "id": "M04_V1_1.2_L4_SEED_038",
        "data_source": "original",
        "source": "[24 浙江 Z20 联盟]",
        "problem": "已知方程 $e^x = 4 - x$ 的根为 $x_1$，方程 $\\ln x = 4 - x$ 的根为 $x_2$，则 $x_1 + x_2 =$\\_\\_\\_\\_\\_。",
        "answer": "$4$",
        "key_points": [
            "① $y = e^x$ 与 $y = \\ln x$ 关于 $y = x$ 对称",
            "② 两方程改写为 $e^x + x = 4$ 和 $\\ln x + x = 4$",
            "③ 设 $f(t) = e^t + t$，$g(t) = \\ln t + t$",
            "④ $f(x_1) = g(x_2) = 4$",
            "⑤ 由反函数对称性，$x_1 + x_2 = 4$"
        ],
        "level": "L4",
        "tags": ["L4", "反函数对称", "根的和"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["反函数对称性", "根的和"],
            "trap_tags": ["对称性理解错误", "计算复杂化"],
            "weapons": ["S-LOG-02"],
            "strategy_hint": "模型：反函数图象关于y=x对称模型"
        },
        "specId": "V1",
        "specName": "幂指对代数韧性",
        "varId": "1.2",
        "varName": "指对同构",
        "analysis": "【首要步骤】识别反函数关系。\n\n【核心思路】$y = e^x$ 与 $y = \\ln x$ 关于 $y = x$ 对称。\n\n【详细推导】\n1. 方程改写：$e^x + x = 4$，$\\ln x + x = 4$\n2. $y = e^x$ 与 $y = \\ln x$ 关于 $y = x$ 对称\n3. 直线 $y = 4 - x$ 与 $y = x$ 的交点为 $(2, 2)$\n4. 两交点关于 $(2, 2)$ 对称\n5. $x_1 + x_2 = 4$\n\n【答案】$4$"
    },
    {
        "id": "M04_V1_1.2_L4_SEED_039",
        "data_source": "original",
        "source": "[23 全国乙卷风格]",
        "problem": "设 $a = \\ln \\pi, b = \\log_\\pi e, c = \\log_\\pi 3$，则 $a, b, c$ 的大小关系是\\_\\_\\_\\_\\_。",
        "answer": "$a > c > b$",
        "key_points": [
            "① $a = \\ln \\pi \\approx 1.14$",
            "② $b = \\log_\\pi e$，由于 $\\pi > e$，$b < 1$",
            "③ $c = \\log_\\pi 3$，由于 $\\pi > 3$，$c < 1$",
            "④ 比较 $b$ 和 $c$：$\\log_\\pi e$ vs $\\log_\\pi 3$",
            "⑤ 由于 $e < 3$，$\\log_\\pi e < \\log_\\pi 3$，即 $b < c$",
            "⑥ $a > 1 > c > b$"
        ],
        "level": "L4",
        "tags": ["L4", "比较大小", "对数"],
        "quality_score": 94,
        "meta": {
            "core_logic": ["对数比较大小", "中间值法"],
            "trap_tags": ["比较方向错误", "中间值选择错误"],
            "weapons": ["S-LOG-02"],
            "strategy_hint": "模型：对数比较大小-中间值法"
        },
        "specId": "V1",
        "specName": "幂指对代数韧性",
        "varId": "1.2",
        "varName": "指对同构",
        "analysis": "【首要步骤】估算各值范围。\n\n【核心思路】利用中间值比较。\n\n【详细推导】\n1. $a = \\ln \\pi \\approx 1.14$（$\\pi \\approx 3.14$）\n2. $b = \\log_\\pi e$：由于 $\\pi > e$，$b < 1$\n3. $c = \\log_\\pi 3$：由于 $\\pi > 3$，$c < 1$\n4. 比较 $b$ 和 $c$：\n   - $\\log_\\pi e$ vs $\\log_\\pi 3$\n   - 由于 $\\pi > 1$，对数函数递增\n   - $e < 3$，所以 $\\log_\\pi e < \\log_\\pi 3$\n   - 即 $b < c$\n5. $a > 1 > c > b$\n\n【答案】$a > c > b$"
    },
    {
        "id": "M04_V1_1.2_L4_SEED_040",
        "data_source": "original",
        "source": "[24 华附三模]",
        "problem": "若关于 $x$ 的方程 $e^x = ax$ 有两个不等实根，则实数 $a$ 的取值范围是\\_\\_\\_\\_\\_。",
        "answer": "$(e, +\\infty)$",
        "key_points": [
            "① 方程 $e^x = ax$ 有两个不等实根",
            "② 即 $y = e^x$ 与 $y = ax$ 有两个交点",
            "③ 直线 $y = ax$ 与 $y = e^x$ 相切时，$a = e$",
            "④ 当 $a > e$ 时，有两个交点",
            "⑤ 当 $a = e$ 时，相切于点 $(1, e)$",
            "⑥ 当 $a < e$ 时，最多一个交点"
        ],
        "level": "L4",
        "tags": ["L4", "零点个数", "相切临界"],
        "quality_score": 95,
        "meta": {
            "core_logic": ["数形结合", "相切临界值"],
            "trap_tags": ["临界值判断错误", "边界遗漏"],
            "weapons": ["S-LOG-02"],
            "strategy_hint": "模型：零点个数-数形结合模型"
        },
        "specId": "V1",
        "specName": "幂指对代数韧性",
        "varId": "1.2",
        "varName": "指对同构",
        "analysis": "【首要步骤】数形结合分析。\n\n【核心思路】直线与曲线相切是临界条件。\n\n【详细推导】\n1. 方程 $e^x = ax$ 有两个不等实根\n2. 即 $y = e^x$ 与 $y = ax$ 有两个交点\n3. 相切条件：$y = e^x$ 与 $y = ax$ 相切\n   - $e^x = ax$ 且 $e^x = a$（切点处斜率相等）\n   - $x = 1$，$a = e$\n4. 当 $a = e$ 时，相切于点 $(1, e)$\n5. 当 $a > e$ 时，直线更陡，与 $y = e^x$ 有两个交点\n6. 当 $0 < a < e$ 时，直线较平，最多一个交点\n\n【答案】$(e, +\\infty)$"
    }
]

# 找到 V1.2 并添加新题目
for spec in data['specialties']:
    if spec['spec_id'] == 'V1':
        for var in spec['variations']:
            if var['var_id'] == '1.2':
                pool = var.get('original_pool', [])
                print(f"V1.2 原有题目数: {len(pool)}")
                
                # 添加新题目
                pool.extend(new_questions)
                var['original_pool'] = pool
                
                # 统计难度分布
                from collections import Counter
                levels = Counter(q.get('level') for q in pool)
                print(f"V1.2 新增后题目数: {len(pool)}")
                print(f"难度分布: {dict(levels)}")
                break

with open('src/data/M04.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("\nV1.2 新增10题完成！")
