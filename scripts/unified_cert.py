import json
with open('src/data/weapon_details.json') as f:
    wd = json.load(f)

# Quick reference: Add cert to ALL weapons that need it
# M01-M06, M08 weapons (M07+M09 already done)

cert = {
    'S-SET-01': [
        {"level":1,"name":"方法识别","question":"A={x|x²-(a+2)x+2a<0},B={x|1<x<3}且A⊆B。第一步？","answer":"讨论空集。A可能为∅（a=2时），空集是任何集合的子集——漏掉空集讨论会丢解。因为题干未说A非空。"},
        {"level":2,"name":"陷阱规避","question":"A={x|ax²+bx+c=0}。Δ≥0→A非空，对吗？","answer":"当a=0时Δ公式无意义。需先讨论a=0的退化情况。含参二次问题必须先处理退化情形。"},
        {"level":3,"name":"核心应用","question":"A={x|x²-3x+2<0},B={x|x²-5x+6<0}。求A∩B。","answer":"A=(1,2),B=(2,3)。画数轴：A∩B=(1,2)∩(2,3)? 端点2在A开区间不在B→A∩B=(1,2)。分析每段区间交集。"},
        {"level":4,"name":"变式迁移","question":"A={x|log₂(x-a)<1},B={x|x²-5x+6≤0}。A∪B=B，求a。","answer":"A∪B=B⇔A⊆B。B=[2,3]。A:a<x<a+2。A⊆B→a≥2且a+2≤3→a∈[2,1]→无解。有时答案是空集——识别不可满足条件。"},
        {"level":5,"name":"综合压轴","question":"A={x|ax²-(a²+1)x+a>0}。当A=R时求a；当A=∅时求a。","answer":"A=R→a>0且Δ<0→a⁴-2a²+1<0→(a²-1)²<0无解→不可能。A=∅→a<0且Δ≤0→a=−1。分a>0/a=0/a<0三类讨论二次函数图像。"}
    ],
    'S-SET-02': [
        {"level":1,"name":"方法识别","question":"U={1,...,10},M={1,3,5},N={2,3,4,6}。∁U(M∪N)=？","answer":"先求M∪N={1,2,3,4,5,6}，再求补集{7,8,9,10}。括号优先，从内到外。德摩根律也可互换顺序。"},
        {"level":2,"name":"陷阱规避","question":"A={x|x²-3x+2>0},B={x|x²-5x+6>0}。A∩B？","answer":"A=(−∞,1)∪(2,∞),B=(−∞,2)∪(3,∞)。逐段求交：(−∞,1)∩(−∞,2)=(−∞,1); (2,∞)∩(−∞,2)=∅; (−∞,1)∩(3,∞)=∅; (2,∞)∩(3,∞)=(3,∞)。A∩B=(−∞,1)∪(3,∞)。不能合并写成(2,∞)——那是常见错误。"},
        {"level":3,"name":"核心应用","question":"A={x|3x²-7x+2≤0},B={x|x²-4x+3≤0}。求A∪B,A∩B。","answer":"A=[1/3,2],B=[1,3]。A∪B=[1/3,3],A∩B=[1,2]。因式分解后画数轴一目了然。"},
        {"level":4,"name":"变式迁移","question":"A={x|ax²+2x+1>0}。求A=R时a的范围。","answer":"需a>0且Δ=4-4a<0→a>1。a=0时退化为2x+1>0→A≠R。"},
        {"level":5,"name":"综合压轴","question":"A={x|f(x)≥0,f(x)=x²-2x-3},B={x|g(x)≥0,g(x)=x²-4x+a}。B⊆A时求a。","answer":"A=(−∞,−1]∪[3,∞)。B的区间取决于a。a>4时g(x)>0恒成立→B=R→B⊆A不可能。a≤4时B=(−∞,x1]∪[x2,∞)。需x1≤−1且x2≥3→解二次不等式得a≤−5。"}
    ],
    'S-SET-03': [
        {"level":1,"name":"方法识别","question":"A={x|x²-x-6<0},B={y|y=x²+1,x∈A}。求B。","answer":"A=(−2,3)。y=x²+1在x∈(−2,3)的值域：最小值x=0时y=1，最大值趋近x→3时y→10。所以B=[1,10)。韦恩图思考法——变量映射。"},
        {"level":2,"name":"陷阱规避","question":"B={x|√(x-1)≤2}。求B。需要额外的约束吗？","answer":"√的定义域x≥1。平方得x−1≤4→x≤5。综合得B=[1,5]。忽略定义域约束会导致多写x<1的部分。"},
        {"level":3,"name":"核心应用","question":"A={x|2^x<8},B={x|log₂x≤2},C={x|1/x≥1/3}。求(A∩B)∪C。","answer":"A=(−∞,3),B=(0,4],C=(0,3]。A∩B=(0,3)。(A∩B)∪C=(0,3]——含端点3。"},
        {"level":4,"name":"变式迁移","question":"A={x|(x-1)/(x+2)≥0},B={x||x-1|≤a}。A∩B≠∅时a的min？","answer":"A=(−∞,−2)∪[1,∞)。B=[1−a,1+a]。对任意a>0,1∈B且1∈A→交集永远非空→a_min→0+（确界0但无最小值）。"},
        {"level":5,"name":"综合压轴","question":"A={x|ax²-(a+1)x+1<0}。求含恰好2个整数的a范围。","answer":"因式分解(ax-1)(x-1)。两根1和1/a。a>0时A为两数间开区间。需区间长度3→a∈(1/4,1/3)。分类a正负和大小关系，含参讨论。"}
    ],
    'S-COMPLEX-01': [
        {"level":1,"name":"方法识别","question":"|z-(1+i)|=2 在复平面上的几何意义？","answer":"以(1,1)为圆心、半径为2的圆。复数的模|z-z0|=几何距离。"},
        {"level":2,"name":"陷阱规避","question":"|z+1|=|z-i|表示什么？有同学说表示以-1和i为端点的线段。对吗？","answer":"不对。|z+1|=|z-i|是两点(-1,0)和(0,1)的中垂线——到两点距离相等的点的轨迹。"},
        {"level":3,"name":"核心应用","question":"z满足|z-2|=1，求|z|的最大值和最小值。","answer":"圆心(2,0),r=1。|z|是点到原点距离。max=3（最远点(3,0)），min=1（最近点(1,0)）。几何法画圆即得。"},
        {"level":4,"name":"变式迁移","question":"|z-1|+|z+1|=4 表示什么曲线？","answer":"椭圆。焦点F₁(1,0),F₂(−1,0)，长轴2a=4→a=2,c=1→b²=3。方程为x²/4+y²/3=1。"},
        {"level":5,"name":"综合压轴","question":"z⋅z̄+|z|=6。求|z|的范围并画轨迹。","answer":"令r=|z|→r²+r=6→r²+r−6=0→(r+3)(r−2)=0→r=2（r≥0）。|z|=2的圆。z+z̄=|z|²等复数的运算性质与几何意义结合。"}
    ],
    'S-LOGIC-01': [
        {"level":1,"name":"方法识别","question":"某病患病率1%，检测阳性率95%。求阳性者患病的概率。用什么方法？","answer":"树状图法。画两分支(患病/未患病)→各支检测结果。用条件概率公式P(病|阳)=P(病∩阳)/P(阳)。"},
        {"level":2,"name":"陷阱规避","question":"P(阳|病)=95%，则P(病|阳)也是95%？","answer":"错。两者是完全不同的条件概率。P(病|阳)=P(病∩阳)/P(阳)需考虑假阳性。本例P(病|阳)=0.01×0.95/(0.01×0.95+0.99×0.05)≈16.1%。"},
        {"level":3,"name":"核心应用","question":"一盒中有3红2白球。不放回连取2球。求第二次取红球的概率。","answer":"全概率公式：P₂(R)=P₁(R)·P₂(R|₁R)+P₁(W)·P₂(R|₁W)=(3/5)(2/4)+(2/5)(3/4)=6/20+6/20=3/5。有趣地——等于第一次直接取红的概率。"},
        {"level":4,"name":"变式迁移","question":"3个黑球2个白球，甲先乙后各取一球不放回。谁取到黑球概率大？","answer":"P(甲黑)=3/5。P(乙黑)=P(甲黑)P(乙黑|甲黑)+P(甲白)P(乙黑|甲白)=(3/5)(2/4)+(2/5)(3/4)=6/20+6/20=3/5。相等！先抽后抽概率一样。"},
        {"level":5,"name":"综合压轴","question":"检测阳性→患病概率的计算中，若提高检测敏感度到99%，阳性预测值变化多少？","answer":"原：P(病|阳)=0.01×0.95/(0.01×0.95+0.99×0.05)≈16.1%。新：P(病|阳)=0.01×0.99/(0.01×0.99+0.99×0.01)=0.0099/(0.0099+0.0099)=50%。提高很多但仍有50%假阳性——因为病本身极罕见。"}
    ],
    'S-LOGIC-02': [
        {"level":1,"name":"方法识别","question":"期望值决策：方案A收益E(A)=50，方案B收益E(B)=40，选哪个？依据？","answer":"选A（期望值更大）。期望值决策的标准是取期望最优方案。但风险态度（风险厌恶/中性/偏好）也影响决策。"},
        {"level":2,"name":"陷阱规避","question":"数据分组后每组正相关，合并后却负相关。为什么？","answer":"辛普森悖论——分层数据结构差异导致汇总趋势反转。原因：各组样本量分布不均，权重不同。"},
        {"level":3,"name":"核心应用","question":"某商品利润为[−10(概率0.2),+20(0.5),+50(0.3)]。求期望利润。","answer":"E=−10×0.2+20×0.5+50×0.3=−2+10+15=23。"},
        {"level":4,"name":"变式迁移","question":"有两个投资：A确定性收益10万，B有50%概率30万/50%概率−10万。你会选哪个？","answer":"E(A)=10,E(B)=0.5×30+0.5(−10)=10。期望相同。风险中性者无所谓，风险厌恶者选A(确定)。"},
        {"level":5,"name":"综合压轴","question":"构建一个包含辛普森悖论的数据例子，分两组分别正相关，合并后负相关。","answer":"例：组1(男)：样本量大的x-y正相关；组2(女)：样本量小的x-y正相关。合并时大组主导，若大组整体均值与小组方向相反则汇总反转。"}
    ],

    # M03
    'S-FUNC-02': [
        {"level":1,"name":"方法识别","question":"非线性回归y=ce^(kx)。如何转化为线性？","answer":"取对数：lny=lnc+kx。z=lny对x做线性回归。见指幂取对数，秒变线性。"},
        {"level":2,"name":"陷阱规避","question":"y=ce^(kx)+d。能直接取对数吗？","answer":"不能。ln(y)=ln(ce^(kx)+d)≠lnc+kx+lnd（对数不能拆加法）。含常数d需迭代法或平移处理。"},
        {"level":3,"name":"核心应用","question":"数据拟合y=ax^b。取对数后lny=lna+blnx。求a,b。","answer":"令z=lny,t=lnx→z=lna+bt。对(logx,logy)点做线性回归，斜率=b，截距=lna→a=e^截距。"},
        {"level":4,"name":"变式迁移","question":"模型y=ae^(bx²)。取对数后形式？","answer":"lny=lna+bx²→令t=x²。z=lna+bt（线性回归）。自变量是x²而非x本身。"},
        {"level":5,"name":"综合压轴","question":"两模型y=ae^(bx)和y=cx^d。如何比较哪个更优？","answer":"分别做(lny~x)和(lny~lnx)的线性回归，比较R²。也可对原始y计算拟合值后比SSE/RMSE。同尺度比较残差最可靠。"}
    ],
    'S-FUNC-05': [
        {"level":1,"name":"方法识别","question":"f对称于x=1和(2,0)。求周期。方法？","answer":"双对称推周期。一轴一心T=4|a-b|=4|1-2|=4。"},
        {"level":2,"name":"陷阱规避","question":"轴对称x=a→f(x)=f(2a-x)；中心对称(b,c)→f(x)=2c-f(2b-x)。公式对吗？","answer":"对。中心对称c=0时简化为f(2b-x)=-f(x)。注意是f(2b-x)不是f(2-x)——中心坐标b代入。"},
        {"level":3,"name":"核心应用","question":"f对称于x=3和(1,0)。证T=8并推导。","answer":"轴：f(x)=f(6-x)；心：f(2-x)=-f(x)→f(6-x)=-f(x-4)。结合得f(x)=-f(x-4)→f(x+8)=f(x)→T=8。"},
        {"level":4,"name":"变式迁移","question":"两轴x=2和x=6时T=？","answer":"T=2|a-b|=2×4=8。两轴间无符号翻转，推导更简洁。"},
        {"level":5,"name":"综合压轴","question":"f(x)+f(2-x)=2且f(x+1)是奇函数。证两条件可能矛盾。","answer":"条件1→对称于(1,1)。条件2→对称于(1,0)。f关于两点对称但不自洽→条件矛盾。检查矛盾是高级对称分析的关键能力。"}
    ],
    'S-FUNC-06': [
        {"level":1,"name":"方法识别","question":"f偶且在[0,∞)递增。f(2x-1)<f(3)的解法？","answer":"脱壳：偶→加绝对值；递增→去f保号。|2x-1|<3→-1<x<2。核心：f(A)<f(B)⇔|A|<|B|。"},
        {"level":2,"name":"陷阱规避","question":"f偶在[0,∞)递减。f(2x-1)<f(3)的解法？","answer":"递减时f(A)<f(B)⇔|A|>|B|（反转）。|2x-1|>3→x<-1或x>2。脱壳前必须确认单调方向。"},
        {"level":3,"name":"核心应用","question":"f奇在R上递增且f(1)=2。解f(x²-3x)+f(2)<0。","answer":"奇函数：f(x²-3x)<-f(2)=f(-2)。递增：x²-3x<-2→(x-1)(x-2)<0→x∈(1,2)。"},
        {"level":4,"name":"变式迁移","question":"f偶在[0,∞)递减且f(2)=4。解f(x+1)≥f(3x-5)。","answer":"递减→f(A)≥f(B)⇔|A|≤|B|。|x+1|≤|3x-5|→平方→8x²-32x+24≥0→x≤1或x≥3。"},
        {"level":5,"name":"综合压轴","question":"f满足f(x+y)=f(x)+f(y)且x≥0时f(x)≤0,f(3)=-6。解f(x²-x)+f(4x-4)≥f(6)。","answer":"Cauchy+单调→f(x)=kx。f(3)=3k=-6→k=-2。不等式化为-2(x²+3x-4)≥-12→x²+3x-10≤0→x∈[-5,2]。"}
    ],
    'S-FUNC-08': [
        {"level":1,"name":"方法识别","question":"f(x)=x²-2x。解f(f(x))=0的第一步？","answer":"剥洋葱：设t=f(x)，先解f(t)=0→t²-2t=0→t=0或2。再代回f(x)=t→两组解。外→内逐层剥离。"},
        {"level":2,"name":"陷阱规避","question":"f(f(x))=x。能否用剥洋葱？","answer":"不能。f(f(x))=0适用剥洋葱（外层=常数c）。但f(f(x))=x是两层层复合等于自变量，需直接展开解方程。"},
        {"level":3,"name":"核心应用","question":"f(x)=x²-4x+3。解f(f(x))=0。","answer":"外层：t²-4t+3=0→t=1或3。内层：f(x)=1→x²-4x+2=0→x=2±√2；f(x)=3→x²-4x=0→x=0,4。四根。"},
        {"level":4,"name":"变式迁移","question":"f(x)=|x-2|。解f(f(x))=1。","answer":"外层：|t-2|=1→t=3或1。内层：|x-2|=3→x=-1,5；|x-2|=1→x=1,3。四解：-1,1,3,5。"},
        {"level":5,"name":"综合压轴","question":"f(x)=2^x。解f(f(f(x)))=8。","answer":"最外层2^u=8→u=3。中层2^v=3→v=log₂3。内层2^x=log₂3→x=log₂(log₂3)≈0.665。"}
    ],

    # M04
    'S-LOG-02': [
        {"level":1,"name":"方法识别","question":"xe^x=2→x=?用什么函数？","answer":"Lambert W:x=W(2)≈0.8526。W是We^W的逆函数。"},
        {"level":2,"name":"陷阱规避","question":"对xe^x=1取ln→lnx+x=0，能直接解吗？","answer":"不能。lnx+x=0仍是超越方程。正确用W：x=W(1)≈0.5671。"},
        {"level":3,"name":"核心应用","question":"f(x)=xe^x-1的增减区间和零点。","answer":"f'(x)=(1+x)e^x。x<-1减，x>-1增。极小值f(-1)=-e⁻¹-1<0,f(1)=e-1>0→唯一零点x=W(1)≈0.5671。"},
        {"level":4,"name":"变式迁移","question":"x²e^x=1。解出x。","answer":"(xe^{x/2})²=1→xe^{x/2}=±1→x=2W(±1/2)。正≈0.7035，负≈−0.7035。"},
        {"level":5,"name":"综合压轴","question":"利用f(x)=lnx/x比较e^π和π^e的大小。","answer":"f(e)=1/e,f(π)=lnπ/π。π>e且f在(e,∞)递减→1/e>lnπ/π→π>e·lnπ→e^π>π^e。"}
    ],
    'S-LOG-03': [
        {"level":1,"name":"方法识别","question":"比较a^b和b^a。构造什么函数？","answer":"f(x)=lnx/x。lna/a和lnb/b的大小决定a^b和b^a的大小。"},
        {"level":2,"name":"陷阱规避","question":"2³<3²→8<9✓。由此推n^{n+1}>(n+1)^n对所有n成立？","answer":"不对。n=2时2³<3²。n≥3时方向反转（n>e→递减段）。3⁴=81>4³=64✓。不同的n所在的区间不同。"},
        {"level":3,"name":"核心应用","question":"证n≥3时n^{n+1}>(n+1)^n。","answer":"f(n)>f(n+1)(递减)→交叉乘即得证。"},
        {"level":4,"name":"变式迁移","question":"a^b=b^a的正整数解(a≠b)。","answer":"解f(a)=f(b)且a≠b。唯一解{2,4}。f(2)=f(4)=ln2/2=ln4/4。"},
        {"level":5,"name":"综合压轴","question":"a^b=b^a且a<b。证ab>e²。","answer":"先证a<e<b（否则同在递增/递减段不能相等）。由对称性+凸性→ab>e²。"}
    ],
    'S-LOG-05': [
        {"level":1,"name":"方法识别","question":"(a-b)/(lna-lnb)叫什么？介于哪两个量之间？","answer":"对数平均L(a,b)。√(ab) < L < (a+b)/2。"},
        {"level":2,"name":"陷阱规避","question":"(lna-lnb)/(a-b)<1/√(ab)是否正确？","answer":"正确。取倒数保持方向（各项为正）。这是对数平均不等式的变形。"},
        {"level":3,"name":"核心应用","question":"利用L<A证明(x-1)/lnx<(x+1)/2(x≠1)。","answer":"L(x,1)=(x-1)/lnx，A(x,1)=(x+1)/2。L<A直接得证。"},
        {"level":4,"name":"变式迁移","question":"比较ln(1+x)和2x/(2+x)的大小。","answer":"构造f(x)=ln(1+x)-2x/(2+x)。f(0)=0,f'(x)>0→f(x)>0。ln(1+x)>2x/(2+x)。这是比x/(1+x)更紧的下界。"},
        {"level":5,"name":"综合压轴","question":"用Taylor展开证x²/2-x³/3<ln(1+x)<x-x²/2+x³/3。","answer":"ln(1+x)=x-x²/2+x³/3-...+(-1)^{n+1}x^n/n。交错级数截断误差≤被舍弃首项绝对值。"}
    ],

    # M05
    'S-VEC-02': [
        {"level":1,"name":"方法识别","question":"|a|=3,|b|=4,|a-b|=5。求a·b。凭什么公式？","answer":"极化恒等式：a·b=(|a|²+|b|²-|a-b|²)/2=(9+16-25)/2=0。a⊥b。"},
        {"level":2,"name":"陷阱规避","question":"PA·PB=PB·PC→约去|PB|→|PA|cosAPB=|PC|cosBPC。对吗？","answer":"错。应移项：PB·(PA-PC)=0→PB⊥CA。向量的点积不能像数量那样约分。"},
        {"level":3,"name":"核心应用","question":"△ABC中AB=4,BC=5,CA=6。求BA·BC。","answer":"(16+25-36)/2=5/2=2.5。"},
        {"level":4,"name":"变式迁移","question":"已知|a|=3,|b|=4,|a+b|=5。求a·b。","answer":"|a+b|²=|a|²+2a·b+|b|²→25=9+2a·b+16→a·b=0。a⊥b。"},
        {"level":5,"name":"综合压轴","question":"四边形ABCD各边长和一对角线已知，求另一对角线。","answer":"Euler四边形定理：AC²+BD²=AB²+BC²+CD²+DA²-4MN²(M,N为对角线中点)。或向量法：AC+BD用对各边向量表达→方程求解。"}
    ],
    'S-VEC-03': [
        {"level":1,"name":"方法识别","question":"P在BC上，用AB,AC表达AP。什么定理？","answer":"等和线定理：AP=t·AB+(1-t)·AC（系数和=1）。P在BC直线上⇔系数和=1；P在线段BC上再加0≤t≤1。"},
        {"level":2,"name":"陷阱规避","question":"OP=(1-t)OB+tOC推AP=(1-t)AB+tAC。成立吗？","answer":"成立。OP-OA=(1-t)(OB-OA)+t(OC-OA)→AP=(1-t)AB+tAC。系数和保持=1——与起点O无关。"},
        {"level":3,"name":"核心应用","question":"D在BC上BD:DC=2:3，用AB,AC表示AD。","answer":"AD=(3/5)AB+(2/5)AC。t=DC/BC=3/5。"},
        {"level":4,"name":"变式迁移","question":"E为AC中点，F为BC中点。EF用向量表达？","answer":"F-E=(B+C)/2-(A+C)/2=(B-A)/2=AB/2。中位线平行底边且等其半。"},
        {"level":5,"name":"综合压轴","question":"三边上BD:DC=CE:EA=AF:FB=1:2。证△DEF重心=△ABC重心。","answer":"设A为原点。G_ABC=(a+c)/3。D=(2a+c)/3,E=2c/3,F=a/3。G_DEF=(3a+3c)/9=(a+c)/3=G_ABC。"}
    ],
    'S-VEC-04': [
        {"level":1,"name":"方法识别","question":"正方体中求体对角线交点。什么方法？","answer":"建系法——取顶点为原点的直角坐标系。直线参数方程联立求交点。不会几何就建系。"},
        {"level":2,"name":"陷阱规避","question":"长方体AB=2,AD=3,AA₁=4。A为原点→B₁坐标？","answer":"B₁=(2,0,4)，不是(2,3,4)！沿AB走2，AD方向=0，AA₁方向=4。(2,3,4)是体对角顶点C₁。"},
        {"level":3,"name":"核心应用","question":"棱长为2的正方体中，E为C₁D₁中点。异面直线AE与BD₁的距离。","answer":"建系→方向向量→公垂线方向=AE×BD₁→d=|(A-B)·公垂方向|/|公垂方向|。具体计算得距离。"},
        {"level":4,"name":"变式迁移","question":"长方体AB=4,AD=3,AA₁=2。B₁到平面ACD₁的距离。","answer":"法向量=AC×AD₁。平面过原点→距离=|B₁到平面距离|=24/√61。"},
        {"level":5,"name":"综合压轴","question":"用向量法证明四面体对棱中点连线交于一点。","answer":"各对棱中点=(A+B)/2,(C+D)/2等。所有中点向量的均值为(A+B+C+D)/4→六线段中点共点。即四面体重心。"}
    ],
    'S-VEC-06': [
        {"level":1,"name":"方法识别","question":"△ABC中P为任意点。PA²+PB²+PC²与PG²(重心G)的关系？用什么定理？","answer":"奔驰定理：PA²+PB²+PC²=3PG²+GA²+GB²+GC²。"},
        {"level":2,"name":"陷阱规避","question":"有人将奔驰定理写成：PA²+PB²+PC²=PG²+GA²+GB²+GC²。差在哪？","answer":"错了系数。PG²的系数是3（因G将质量三等分）。丢失系数3是常见失误。"},
        {"level":3,"name":"核心应用","question":"等边三角形ABC边长为a，G为其重心。求GA²+GB²+GC²。","answer":"等边三角形中GA=GB=GC=a/√3。和=3a²/3=a²。"},
        {"level":4,"name":"变式迁移","question":"利用奔驰定理求使PA²+PB²+PC²最小的点P。","answer":"奔驰定理：min当PG²=0→P=G。最小值=GA²+GB²+GC²。"},
        {"level":5,"name":"综合压轴","question":"四边形推广：对任意点P，PA²+PB²+PC²+PD² 何时最小？","answer":"P=四边形重心G(四点均值)。由Euler推广：PA²+...+PD²=4PG²+GA²+...+GD²。min当P=G。"}
    ],

    # M06
    'S-TRIG-01': [
        {"level":1,"name":"方法识别","question":"sinθ+cosθ=√2。第一步？","answer":"平方：(sin+cos)²=2→1+sin2θ=2→sin2θ=1→θ=π/4。"},
        {"level":2,"name":"陷阱规避","question":"(sin+cos)²=sin²+cos²=1。正确吗？","answer":"错！(a+b)²=a²+2ab+b²。中间的2sinθcosθ(即sin2θ)不能漏。"},
        {"level":3,"name":"核心应用","question":"sinα-cosα=1/3,α∈(π/4,π/2)。求sin2α和cos2α。","answer":"平方→1-sin2α=1/9→sin2α=8/9。2α∈(π/2,π)→cos2α=-√(1-64/81)=-√17/9。"},
        {"level":4,"name":"变式迁移","question":"tanα=2。求(sin+cos)/(sin-cos)。","answer":"分子分母同除cosα→(tanα+1)/(tanα-1)=3/1=3。"},
        {"level":5,"name":"综合压轴","question":"sin³θ+cos³θ=1。求sinθ+cosθ。","answer":"因式：1=(sin+cos)(1-sincos)。令t=sin+cos→sincos=(t²-1)/2。代入得t³-3t+2=0→(t-1)²(t+2)=0→t=1。sin+cos=1→θ=0或π/2。"}
    ],
    'S-TRIG-03': [
        {"level":1,"name":"方法识别","question":"f(x)=sin(ωx+φ)零点间隔与ω的关系？","answer":"相邻零点间隔=T/2=π/ω。"},
        {"level":2,"name":"陷阱规避","question":"f(0)=0且f(π/3)=0→周期=π/3。对吗？","answer":"不一定。两零点间可能是半周期的倍数，需更多约束(如无中间零点)。"},
        {"level":3,"name":"核心应用","question":"f(x)=2sin(ωx)(ω>0)在[0,π/3]恰有3个零点。求ω。","answer":"零点x=kπ/ω。含0,π/ω,2π/ω共3个→2π/ω≤π/3<3π/ω→6≤ω<9。"},
        {"level":4,"name":"变式迁移","question":"f(x)=sin(ωx+π/6)在(0,π)恰有2个极值点。求ω。","answer":"极值点间隔π/ω。在(0,π)内有2个需π/ω<π且2π/ω≥π→1<ω≤2。"},
        {"level":5,"name":"综合压轴","question":"f(x)=sin(ωx+φ)在[0,π/2]单调递增且f(0)=1/2,f(π/2)=1。求ω,φ。","answer":"φ=π/6。ωπ/2+π/6=π/2+2kπ→k=0:ω=2/3。验证区间内无极值→单调递增→满足。"}
    ],
    'S-TRIG-05': [
        {"level":1,"name":"方法识别","question":"y=sinx→y=2sin(3x-π/4)+1经过哪些变换？","answer":"水平：压缩1/3→右移π/12。垂直：振幅×2→上移1。"},
        {"level":2,"name":"陷阱规避","question":"y=sin(2x+π/3)先左移π/3再压缩→y=sin(2x+2π/3)≠原式。正确答案？","answer":"先压缩：sin2x，再左移π/6（因为2(x+π/6)=2x+π/3）。顺序：先伸缩后平移。"},
        {"level":3,"name":"核心应用","question":"用五点法作y=2sin(2x-π/3)在[0,π]的图像。","answer":"令t=2x-π/3。t=0,π/2,π,3π/2,2π→x=π/6,5π/12,2π/3,11π/12,7π/6。"},
        {"level":4,"name":"变式迁移","question":"y=3cos(πx/2+π/4)的周期和初相。","answer":"T=2π/(π/2)=4。初相φ=π/4。"},
        {"level":5,"name":"综合压轴","question":"y=Asin(ωx+φ)+k，最高点(π/6,5),最低点(π/2,-1)。求A,k,ω,φ。","answer":"A=(5+1)/2=3,k=2。半周期=π/3→T=2π/3→ω=3。由x=π/6时取最大值→3·π/6+φ=π/2→φ=0。y=3sin(3x)+2。"}
    ],

    # M08
    'S-SEQ-01': [
        {"level":1,"name":"方法识别","question":"a₁=1,a_{n+1}=2a_n+1。求通项。方法？","answer":"构造等比：a_{n+1}+1=2(a_n+1)。b_n=a_n+1→b_1=2,q=2→b_n=2^n→a_n=2^n-1。"},
        {"level":2,"name":"陷阱规避","question":"a_{n+1}=3a_n+2。有同学直接写a_n=3^n-1。对吗？","answer":"凑巧对的。但需要展示构造过程：a_{n+1}+1=3(a_n+1)→验证通项=3^n-1。无推导不给分。"},
        {"level":3,"name":"核心应用","question":"a₁=2,a_{n+1}=3a_n+4^n。求a_n。","answer":"齐次解3^n。特解构造a_n=A·4^n→4A=3A+1→A=1。a_n=C·3^n+4^n。a₁=2→C=-2/3。a_n=4^n-(2/3)·3^n。"},
        {"level":4,"name":"变式迁移","question":"a₁=1,a_{n+1}=a_n/(a_n+2)。求a_n。","answer":"倒数化：1/a_{n+1}=1+2/a_n→b_n=1/a_n→b_{n+1}=2b_n+1→b_n=2^n-1→a_n=1/(2^n-1)。"},
        {"level":5,"name":"综合压轴","question":"a₁=1,a_{n+1}=a_n²+2a_n。求a_n。","answer":"a_{n+1}+1=(a_n+1)²。令b_n=a_n+1→b_{n+1}=b_n²→b_n=2^{2^{n-1}}→a_n=2^{2^{n-1}}-1。"}
    ],
    'S-SEQ-02': [
        {"level":1,"name":"方法识别","question":"S_n=∑(2n-1)/2^n。用什么方法？","answer":"错位相减法。一列等差乘一列等比→写S_n和qS_n→相减消去对应项→等比求和。"},
        {"level":2,"name":"陷阱规避","question":"错位相减时乘以公比后减还是被减？容易搞混符号。","answer":"写S_n-公比·S_n。对齐以下标为准——(k项)−(k+1项)"},
        {"level":3,"name":"核心应用","question":"S_n=∑_{k=1}^n(3k-2)·2^k。求S_n。","answer":"标准错位相减法→S_n-2S_n展开→整理→S_n=(6n-7)·2^{n+1}+14。"},
        {"level":4,"name":"变式迁移","question":"S_n=∑k/3^k的求和。","answer":"公比1/3。S_n-1/3S_n→等比求和→S_n=[3-(2n+3)/3^n]/4。"},
        {"level":5,"name":"综合压轴","question":"S_n=∑k·2^{n-k}。换序后求和。","answer":"S_n=2^n∑k/2^k。用Q4结果：∑k/2^k=2-(n+2)/2^n。S_n=2^{n+1}-(n+2)。"}
    ],
    'S-SEQ-04': [
        {"level":1,"name":"方法识别","question":"∑_{k=1}^n 1/(k(k+1))。怎么裂？","answer":"1/(k(k+1))=1/k-1/(k+1)。S_n=(1-1/2)+(1/2-1/3)+...+(1/n-1/(n+1))=1-1/(n+1)。"},
        {"level":2,"name":"陷阱规避","question":"1/(k(k+2))=1/k-1/(k+2)。需要什么修正？","answer":"需系数1/2：(1/2)[1/k-1/(k+2)]。不乘系数会差2倍。"},
        {"level":3,"name":"核心应用","question":"∑_{k=1}^n 1/((2k-1)(2k+1))。","answer":"1/((2k-1)(2k+1))=(1/2)[1/(2k-1)-1/(2k+1)]。S_n=(1/2)(1-1/(2n+1))=n/(2n+1)。"},
        {"level":4,"name":"变式迁移","question":"∑1/(k²+3k+2)。先因式分解。","answer":"(k+1)(k+2)→1/(k+1)-1/(k+2)。S_n=1/2-1/(n+2)。"},
        {"level":5,"name":"综合压轴","question":"∑1/(n(n+1)(n+2))的求和。","answer":"(1/2)[1/(n(n+1))-1/((n+1)(n+2))]。两层裂项嵌套→S_n=1/4-1/(2(n+1)(n+2))。"}
    ],
    'S-SEQ-05': [
        {"level":1,"name":"方法识别","question":"已知a₁和a_{n+1}-a_n=f(n)。求a_n的通法？","answer":"累加法：a_n=a₁+∑_{k=1}^{n-1}(a_{k+1}-a_k)=a₁+∑_{k=1}^{n-1}f(k)。"},
        {"level":2,"name":"陷阱规避","question":"a_{n+1}=a_n+2^n,a₁=1。通项=2^n-1对吗？","answer":"对。累加：a_n=1+∑_{k=1}^{n-1}2^k=1+(2^n-2)=2^n-1。验证：a₂=1+2=3=4-1✓。"},
        {"level":3,"name":"核心应用","question":"a₁=1,a_{n+1}-a_n=n。求a_n。","answer":"累加：a_n=1+∑_{k=1}^{n-1}k=1+n(n-1)/2。"},
        {"level":4,"name":"变式迁移","question":"a₁=2,a_{n+1}-a_n=2n+1。求a_n。","answer":"累加：a_n=2+∑(2k+1)=2+n(n-1)+(n-1)=n²+1。"},
        {"level":5,"name":"综合压轴","question":"a₁=2,a_{n+1}=(n+1)a_n/n。迭代法求通项。","answer":"累乘：a_n/a₁=∏(a_{k+1}/a_k)=∏((k+1)/k)=n。a_n=2n。"}
    ],
    'S-SEQ-09': [
        {"level":1,"name":"方法识别","question":"a_{n+1}=a_n/(1+2a_n)。求通项的第一步？","answer":"取倒数：1/a_{n+1}=1/a_n+2→1/a_n成等差→求1/a_n→回代求a_n。"},
        {"level":2,"name":"陷阱规避","question":"a_{n+1}=a_n/(a_n-2)。能直接用倒数法吗？","answer":"能。1/a_{n+1}=1/a_n-2/(a_n)→这不是简单的线性。正确：1/a_{n+1}=(a_n-2)/a_n=1-2/a_n→设b_n=1/a_n→b_{n+1}=1-2b_n。"},
        {"level":3,"name":"核心应用","question":"a₁=1,a_{n+1}=a_n/(3-2a_n)。求a_n。","answer":"取倒数→1/a_{n+1}=3/a_n-2→b_{n+1}=3b_n-2,b₁=1→构造b_{n+1}-1=3(b_n-1)→b_n-1=0→b_n=1→a_n=1。"},
        {"level":4,"name":"变式迁移","question":"分式递推a_{n+1}=pa_n/(qa_n+r)的标准解法。","answer":"1/a_{n+1}=(r/p)(1/a_n)+q/p。令b_n=1/a_n→一阶线性递推→待定常数/构造等比。"},
        {"level":5,"name":"综合压轴","question":"a₁=1/2,a_{n+1}=a_n/(a_n²+1)。判断收敛性。","answer":"1/a_{n+1}=a_n+1/a_n≥2→a_{n+1}≤1/2。递减有下界→收敛。极限L：L=L/(L²+1)→L=0。"}
    ],
}

# Write all
for wid, qs in cert.items():
    if wid in wd:
        wd[wid]['certification_questions'] = qs
    else:
        print(f'WARNING: {wid} not in weapon_details.json!')

with open('src/data/weapon_details.json', 'w') as f:
    json.dump(wd, f, indent=2, ensure_ascii=False)

total = 0
for wid in sorted(wd.keys()):
    n = len(wd[wid].get('certification_questions', []))
    if n > 0:
        total += n
        print(f'{wid}: {n}题')
print(f'\nTotal: {total} questions across all weapons')
